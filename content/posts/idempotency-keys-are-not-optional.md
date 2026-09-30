---
title: 'Idempotency Keys Are Not Optional'
description: 'Every network call has three outcomes, not two. A concrete design for idempotent HTTP endpoints — key scope, request fingerprinting, concurrent retries, and the race conditions a naive implementation will hit.'
date: 2026-03-22
tags: ['API Design', 'Distributed Systems', 'Reliability']
---

A client sends `POST /payments`. The connection times out. The client has no idea whether the payment was created.

There are three possible outcomes of any network call, and most code is written as though there were two:

1. It succeeded and you know it.
2. It failed and you know it.
3. **You do not know.**

Case three is not an edge case. It is the normal consequence of timeouts, load balancer resets, pod evictions and client crashes. If your API has no answer for it, your clients have exactly two options: retry and risk duplicates, or do not retry and risk lost writes. Both are bad, and the choice belongs to you, not them.

## The contract

An idempotency key is a client-generated token attached to a mutating request. The server promises: for a given key, the side effect happens **at most once**, and every subsequent request with that key returns the original response.

```http
POST /v1/payments HTTP/1.1
Idempotency-Key: 6f1b0f7a-2c9d-4b1e-8f31-9b4e2c7a1d55
Content-Type: application/json

{"amount_cents": 4999, "currency": "EUR", "recipient": "acct_9182"}
```

The client can now retry freely. That is the whole product requirement. Everything below is the implementation detail that makes it true.

## Scope the key correctly

A key is not globally unique. It is unique within a scope, and picking the scope wrong creates either false collisions or security holes.

```text
scope = (tenant_id, endpoint, idempotency_key)
```

- **Tenant.** Without it, one customer can guess another's key and read back their response. This is a data leak, not a correctness bug.
- **Endpoint.** The same key on `POST /payments` and `POST /refunds` are different operations. Without the endpoint in the scope, the second request replays the first one's response.
- **Key.** Client-generated, opaque, and required to be a UUID or equivalent. Do not accept `1`.

## Fingerprint the request body

What should happen when a client reuses a key with a *different* body?

```http
POST /v1/payments
Idempotency-Key: 6f1b0f7a-...
{"amount_cents": 4999}     # first request

POST /v1/payments
Idempotency-Key: 6f1b0f7a-...
{"amount_cents": 999999}   # same key, different body
```

Silently returning the first response would be wrong — the client asked for something else. Processing it would be worse. The correct answer is to reject it loudly:

```http
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json

{
  "type": "https://api.example.com/errors/idempotency-key-reuse",
  "title": "Idempotency key reused with a different request body",
  "status": 422
}
```

Store a hash, not the body:

```python
import hashlib, json

def fingerprint(body: dict) -> str:
    # Canonical form: sorted keys, no insignificant whitespace.
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode()).hexdigest()
```

Canonicalisation matters. If you hash raw bytes, a client that reserialises its JSON between retries — which any client with a middleware layer might — gets a spurious 422 on a legitimate retry.

## The state machine

Three states, and the middle one is where implementations go wrong.

```text
      ┌──────────────┐
      │ (no record)  │
      └──────┬───────┘
             │ INSERT ... ON CONFLICT DO NOTHING
             ▼
      ┌──────────────┐   concurrent request   ┌─────────────┐
      │ IN_PROGRESS  │ ─────────────────────► │  409 retry  │
      └──────┬───────┘                        └─────────────┘
             │ handler completes
             ▼
      ┌──────────────┐   subsequent request   ┌─────────────┐
      │  COMPLETED   │ ─────────────────────► │ stored 2xx  │
      └──────────────┘                        └─────────────┘
```

`IN_PROGRESS` exists because retries are frequently **concurrent**, not sequential. A client whose request timed out at 30s may retry while the original is still executing on the server. If your check is "is there a completed record?" then both requests proceed and you have created two payments.

### The table

```sql
CREATE TABLE idempotency_records (
  tenant_id        uuid        NOT NULL,
  endpoint         text        NOT NULL,
  idempotency_key  text        NOT NULL,
  request_hash     text        NOT NULL,
  state            text        NOT NULL
                   CHECK (state IN ('in_progress', 'completed')),
  response_status  int,
  response_body    jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, endpoint, idempotency_key)
);

CREATE INDEX idx_idempotency_expiry ON idempotency_records (expires_at);
```

The primary key *is* the concurrency control. Do not reach for a distributed lock; the database already gives you a linearizable compare-and-set.

### The handler

```python
async def with_idempotency(scope: Scope, body: dict, handler):
    digest = fingerprint(body)

    row = await db.fetchrow(
        """
        INSERT INTO idempotency_records
              (tenant_id, endpoint, idempotency_key,
               request_hash, state, expires_at)
        VALUES ($1, $2, $3, $4, 'in_progress', now() + interval '24 hours')
        ON CONFLICT (tenant_id, endpoint, idempotency_key) DO NOTHING
        RETURNING 1 AS inserted
        """,
        scope.tenant_id, scope.endpoint, scope.key, digest,
    )

    if row is None:
        existing = await db.fetchrow(
            "SELECT * FROM idempotency_records "
            "WHERE tenant_id=$1 AND endpoint=$2 AND idempotency_key=$3",
            scope.tenant_id, scope.endpoint, scope.key,
        )

        if existing["request_hash"] != digest:
            raise KeyReuseError()

        if existing["state"] == "in_progress":
            # Original is still running. Tell the client to come back.
            raise ConflictError(retry_after=1)

        return Replayed(existing["response_status"], existing["response_body"])

    # We own this key. Run the handler and persist the outcome atomically
    # with whatever the handler wrote.
    async with db.transaction():
        result = await handler(body)
        await db.execute(
            "UPDATE idempotency_records "
            "   SET state='completed', response_status=$4, response_body=$5 "
            " WHERE tenant_id=$1 AND endpoint=$2 AND idempotency_key=$3",
            scope.tenant_id, scope.endpoint, scope.key,
            result.status, json.dumps(result.body),
        )

    return result
```

Two details carry all the weight:

**`ON CONFLICT DO NOTHING ... RETURNING`.** A non-null row means *we* inserted it and own execution. Null means someone else got there first. One round trip, no race.

**The transaction.** The business write and the idempotency record must commit together. If they are separate transactions, a crash between them leaves a record claiming `completed` with no payment behind it — or a payment with no record, which the next retry will duplicate.

## Failure modes to handle explicitly

### Stuck `in_progress` rows

If the process dies mid-handler, the row stays `in_progress` forever and the client is permanently locked out of that key. Expire them:

```sql
DELETE FROM idempotency_records
 WHERE state = 'in_progress'
   AND created_at < now() - interval '15 minutes';
```

Fifteen minutes should comfortably exceed your maximum request timeout. If it does not, your request timeout is the problem.

### Should failures be recorded?

Mostly no. A 500 should not be replayed — the client retrying is exactly the behaviour you want. Delete the `in_progress` row on 5xx and let the retry re-enter cleanly.

A deterministic 4xx (validation failure) is different: replaying it is harmless and saves work. Record those as completed.

```python
except ValidationError as exc:      # deterministic — record it
    await mark_completed(scope, 422, exc.to_problem())
    raise
except Exception:                   # transient — release the key
    await release(scope)
    raise
```

### Retention

Twenty-four hours is the common default and matches Stripe's. It must exceed the longest retry window any client might use. Purge on `expires_at`, and make sure that index exists — this table grows faster than anything else in the schema.

## What clients need from you

Document three things, or none of this helps:

1. **Which endpoints honour the header**, and that it is safe to retry them.
2. **The retention window**, so clients know when a key stops being meaningful.
3. **The response to a concurrent retry** — a `409` with `Retry-After` — so client libraries back off instead of hammering.

## Why this is not optional

Without it, every client that talks to you is forced to choose between duplicate writes and lost writes, on every timeout, forever. They will choose wrong, and the resulting duplicate charge will be your incident regardless of whose code caused it.

The implementation is one table, one middleware, and a few hundred lines. It is the cheapest reliability guarantee in an HTTP API, and it is the one most often skipped.
