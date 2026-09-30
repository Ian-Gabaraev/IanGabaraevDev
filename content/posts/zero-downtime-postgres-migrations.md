---
title: 'Zero-Downtime Postgres Migrations: The Expand–Backfill–Contract Pattern'
description: 'Renaming a column in production is a three-deploy problem, not a one-line ALTER. A practical walkthrough of expand–backfill–contract, lock avoidance, and the failure modes nobody warns you about.'
date: 2026-02-11
tags: ['PostgreSQL', 'Databases', 'Migrations']
---

There is a class of migration that looks trivial in a pull request and takes down production for eleven minutes. It usually reads like this:

```sql
ALTER TABLE orders RENAME COLUMN total TO total_cents;
```

One line. No data movement. Postgres executes it in microseconds. And yet the deploy fails, because the migration and the application that depends on the column cannot possibly ship at the same instant.

This post is about the pattern that fixes it — **expand, backfill, contract** — and about the locking details that decide whether your "instant" DDL is actually instant.

## The real problem is not the ALTER

During any deploy there is a window where old and new application code run simultaneously. Rolling deploys guarantee it. Blue/green guarantees it. Even a "stop the world" restart has a few seconds of overlap between draining connections and new pods accepting traffic.

So a schema change must satisfy a constraint that has nothing to do with SQL:

> The database schema must be compatible with **both** the currently deployed code and the code you are about to deploy.

A rename violates this by construction. `total` and `total_cents` cannot both be the canonical column at once — unless you make them both exist for a while. That is the whole trick.

## Expand, backfill, contract

The pattern splits one logical change into three independently deployable steps.

| Phase | Schema change | Code change | Safe to roll back? |
| --- | --- | --- | --- |
| Expand | Add the new column, nullable | Dual-write old + new | Yes |
| Backfill | Copy historical rows in batches | None | Yes |
| Contract | Drop the old column | Read/write new only | Yes, after soak |

Each phase ships on its own. Each phase is individually reversible. You never have a moment where rolling back the application breaks the database or vice versa.

### Phase 1 — Expand

Add the new column. Do not add a default, do not add `NOT NULL`, do not add an index yet.

```sql
ALTER TABLE orders ADD COLUMN total_cents bigint;
```

Then deploy code that writes to both columns and still reads the old one:

```python
class Order(Base):
    total = Column(Numeric(12, 2))
    total_cents = Column(BigInteger, nullable=True)

    def set_total(self, amount: Decimal) -> None:
        # Write both; read `total` until the backfill completes.
        self.total = amount
        self.total_cents = int(amount * 100)
```

The order matters. Ship the column *before* the code that writes it. If you ship them together, the new code hits a column that does not exist yet on any instance that got the new image before the migration ran.

### Phase 2 — Backfill

Never do this:

```sql
-- Locks every row, holds one transaction open, bloats WAL,
-- and blocks autovacuum for the duration.
UPDATE orders SET total_cents = (total * 100)::bigint;
```

On a table with 200 million rows that is a single transaction holding row locks for hours, a replication lag spike, and a `pg_wal` directory that fills the disk.

Batch it instead, with a bounded key range and a commit per batch:

```sql
DO $$
DECLARE
  last_id bigint := 0;
  batch   bigint;
BEGIN
  LOOP
    UPDATE orders
       SET total_cents = (total * 100)::bigint
     WHERE id > last_id
       AND total_cents IS NULL
     ORDER BY id
     LIMIT 5000
    RETURNING id INTO batch;

    EXIT WHEN batch IS NULL;
    last_id := batch;
    COMMIT;
    PERFORM pg_sleep(0.05);  -- let replicas and autovacuum breathe
  END LOOP;
END $$;
```

Three properties make this safe:

1. **Bounded work per transaction.** Locks are held for milliseconds, not hours.
2. **Idempotent.** The `total_cents IS NULL` predicate means a crashed backfill can simply be re-run.
3. **Throttled.** The sleep gives replication and vacuum room. Tune it against your replica lag graph, not against a number you read on the internet.

Run it as a job, not as part of the deploy. Deploys should never block on data volume.

### Phase 3 — Contract

Only after the backfill has completed *and* the dual-writing code has soaked in production long enough that you trust it:

```sql
ALTER TABLE orders ALTER COLUMN total_cents SET NOT NULL;
ALTER TABLE orders DROP COLUMN total;
```

That first statement is a trap, which brings us to locks.

## The locks that will hurt you

Postgres DDL takes an `ACCESS EXCLUSIVE` lock unless documented otherwise. That lock conflicts with everything, including plain `SELECT`. The duration of the lock is the problem — but so is the *wait* for it.

### Lock queues are the actual outage

If a long-running `SELECT` holds an `ACCESS SHARE` lock, your `ALTER TABLE` queues behind it. And every query that arrives after your `ALTER` queues behind *that*. A one-millisecond DDL statement stuck behind a thirty-second analytics query stalls the entire table for thirty seconds.

Always bound the wait:

```sql
SET lock_timeout = '3s';
ALTER TABLE orders ADD COLUMN total_cents bigint;
```

If the lock cannot be acquired in three seconds, the statement fails and you retry later. A failed migration is an inconvenience; a lock queue is an incident.

### Operations that are cheap, and ones that are not

| Operation | Rewrites table? | Notes |
| --- | --- | --- |
| `ADD COLUMN` (nullable, no default) | No | Metadata only |
| `ADD COLUMN ... DEFAULT x` | No (PG 11+) | Rewrites on PG 10 and older |
| `ALTER COLUMN ... SET NOT NULL` | No, but full scan | Use a `CHECK ... NOT VALID` first |
| `ALTER COLUMN TYPE` | Usually yes | Exceptions: `varchar(n)` → `text` |
| `CREATE INDEX` | No | Blocks writes — use `CONCURRENTLY` |
| `DROP COLUMN` | No | Metadata only; space reclaimed by vacuum |

The `SET NOT NULL` scan is avoidable. Add a validated check constraint first — validation takes only a `SHARE UPDATE EXCLUSIVE` lock, which does not block reads or writes:

```sql
ALTER TABLE orders
  ADD CONSTRAINT total_cents_not_null
  CHECK (total_cents IS NOT NULL) NOT VALID;

ALTER TABLE orders VALIDATE CONSTRAINT total_cents_not_null;

-- PG 12+ recognises the validated constraint and skips the scan.
ALTER TABLE orders ALTER COLUMN total_cents SET NOT NULL;
ALTER TABLE orders DROP CONSTRAINT total_cents_not_null;
```

### Indexes

Always `CONCURRENTLY`, always outside a transaction block:

```sql
CREATE INDEX CONCURRENTLY idx_orders_total_cents ON orders (total_cents);
```

It is slower and it can fail, leaving an invalid index behind. Check for that in your runbook:

```sql
SELECT indexrelid::regclass
  FROM pg_index
 WHERE NOT indisvalid;
```

Drop and recreate any that show up. This is the single most common piece of debris I find in production databases.

## What this costs you

Three deploys instead of one. A backfill job to babysit. A period where two columns hold the same fact and can drift if the dual-write has a bug.

That last risk is real, and it is worth a verification query before you contract:

```sql
SELECT count(*) AS drifted
  FROM orders
 WHERE total_cents IS DISTINCT FROM (total * 100)::bigint;
```

If that returns anything other than zero, do not drop the column. Find the write path that skipped the dual-write.

## The rule that generalises

Every schema change is really a question about compatibility windows:

- **Adding** something is backward compatible. Ship the schema first.
- **Removing** something is forward compatible. Ship the code first.
- **Changing** something is neither, so decompose it into an add and a remove.

Once you internalise that, most migration anxiety disappears. The pattern is mechanical. The judgement is only in how long you let each phase soak — and the answer to that is longer than feels necessary.
