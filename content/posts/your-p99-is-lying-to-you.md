---
title: 'Your p99 Is Lying to You'
description: 'Averaged percentiles are not percentiles. Why per-instance p99s cannot be aggregated, what coordinated omission hides, and how to measure latency in a way that survives a postmortem.'
date: 2026-03-04
tags: ['Observability', 'Performance', 'Distributed Systems']
---

Here is a dashboard I have seen at four different companies:

```text
service.request.latency.p99  →  avg by (service)
```

It is wrong. Not "slightly imprecise" — structurally, mathematically wrong, in a direction that always makes things look better than they are.

## Percentiles do not average

A percentile is a quantile of a distribution. The mean of two quantiles is not the quantile of the combined distribution. There is no weighting, no correction, no clever trick that makes it work in general.

A two-instance example makes the failure obvious:

```text
Instance A — 1000 requests, all 10ms
Instance B — 10 requests, all 5000ms

avg(p99_A, p99_B) = avg(10ms, 5000ms) = 2505ms
true p99 over 1010 requests            = 10ms
```

The averaged number is 250× the real one. Flip the ratio and you get the opposite error: one busy instance with a genuinely bad tail gets averaged away by nine idle healthy ones, and your alert never fires.

> Averaging percentiles produces a number that is not a percentile of anything. It has no interpretation.

### What to do instead

Aggregate over the *distribution*, not over the summary. That means your instances must export histograms, not pre-computed quantiles.

```promql
# Correct: merge histogram buckets, then compute the quantile once.
histogram_quantile(
  0.99,
  sum by (le, service) (rate(http_request_duration_seconds_bucket[5m]))
)
```

```promql
# Wrong: each instance computed its own quantile; you are averaging summaries.
avg by (service) (http_request_duration_seconds{quantile="0.99"})
```

The `sum by (le, ...)` is the entire point. Histogram buckets are additive because they are counts. Quantiles are not additive because they are order statistics.

This is also why Prometheus **summaries** are close to useless in a multi-instance service, and why the documentation says so in a sentence most people skim past.

## Bucket resolution decides your accuracy

`histogram_quantile` interpolates linearly inside whichever bucket the quantile falls into. If your p99 lands in the bucket spanning 1s to 2.5s, the reported value is an interpolation across a 1.5-second range. The number will be confidently precise and meaningfully arbitrary.

Default bucket layouts are tuned for nothing in particular. Pick buckets around the latencies you actually care about:

```go
// Bad: default buckets — .005 .01 .025 .05 .1 .25 .5 1 2.5 5 10
// If your SLO is 300ms, you have exactly one bucket edge near it.

var requestDuration = prometheus.NewHistogramVec(
    prometheus.HistogramOpts{
        Name: "http_request_duration_seconds",
        // Dense where the SLO lives, sparse in the far tail.
        Buckets: []float64{
            0.010, 0.025, 0.050, 0.075, 0.100, 0.150,
            0.200, 0.250, 0.300, 0.400, 0.500,
            0.750, 1.000, 2.000, 5.000, 10.000,
        },
    },
    []string{"route", "method", "status"},
)
```

Or skip the guesswork entirely and use native/exponential histograms, which give you constant relative error across the whole range at a fraction of the series count.

## Coordinated omission

This one is worse, because it corrupts the data at the source.

Most load generators and many client libraries work like this:

```python
while running:
    start = time.monotonic()
    send_request()          # blocks
    record(time.monotonic() - start)
```

When the server stalls for two seconds, this loop does not send requests during the stall. It sends one slow request and records one slow sample. The thousand requests that *would* have arrived during the stall — and would each have experienced part of that two-second delay — were never issued, so they were never measured.

The result: a service that froze for two seconds shows up as a handful of slow samples in a sea of fast ones. Your p99 barely moves. Your users saw a two-second freeze.

This is **coordinated omission**: the measurement process is accidentally synchronised with the thing it is measuring, and it stops sampling exactly when sampling matters most.

### Fixing it

Measure against the schedule, not against the send:

```python
interval = 1.0 / target_rps
scheduled = time.monotonic()

while running:
    scheduled += interval
    now = time.monotonic()
    if now < scheduled:
        time.sleep(scheduled - now)

    start = time.monotonic()
    send_request()
    end = time.monotonic()

    # Latency includes time spent waiting to be sent — which is
    # exactly what a queued user experiences.
    record(end - scheduled)
```

The difference between `end - start` and `end - scheduled` is the queueing delay you were silently discarding. Good tools do this for you: `wrk2`, `k6` (with a fixed arrival-rate executor), and anything built on HdrHistogram's correction support.

In production, the equivalent fix is to measure at the edge — load balancer or gateway — where the timer starts when the request *arrived*, not when a worker picked it up.

## p99 of what, exactly?

Three more places where the number quietly changes meaning:

**Mixed routes.** A `GET /health` at 1ms and a `POST /reports` at 4s in the same histogram produces a p99 that describes neither. Split by route, or at least by route class.

**Errors excluded.** Fast 500s are the cheapest way to improve latency. If your histogram drops non-2xx responses, a partial outage looks like a performance win. Record all responses; break down by status when you analyse.

**The wrong percentile.** If a single user page load fans out to 20 backend calls, the probability that at least one hits the p99 is `1 - 0.99^20 ≈ 18%`. Nearly one in five page loads touches your tail. At that fan-out, p99.9 of the backend is closer to the user's p99 than p99 is.

## A dashboard that does not lie

Six things, in order of how often they have saved me:

1. **Histograms, aggregated as buckets.** Never `avg(quantile)`.
2. **Buckets placed around the SLO**, not around library defaults.
3. **Latency measured from arrival**, at the edge, including queue time.
4. **All responses**, errors included, with a status breakdown available.
5. **p50, p99, p99.9 and max together.** The *shape* is the signal; a single number never is.
6. **Request rate next to latency.** A p99 over 11 requests is not a measurement, it is a rumour.

That last one deserves emphasis. During an incident, traffic collapses. Percentiles computed over a collapsed sample become noise, and people make decisions on that noise at 3am. Always put the denominator on the graph.

## The summary

The tail is where your users live, and the tail is exactly where the default tooling is least trustworthy. Averaged percentiles understate it, coarse buckets blur it, coordinated omission deletes it, and mixed routes make it meaningless.

None of these are exotic failure modes. They are the defaults.
