# The Physics of Traffic Control

*How to protect a service from being overwhelmed by too many requests.*

> Adapted from [spartan-nhanta/vntech-rate-limit](https://github.com/spartan-nhanta/vntech-rate-limit)'s
> `presentation/rate-limit-outline.md` — translated to English and reshaped into this deck's
> section list. Original outline targets a 100-minute, two-presenter internal talk for backend +
> frontend engineers; this version condenses it into a self-paced deck.

## 1. Introduction — what and why

**Rate limiting** controls how many requests a system allows through per unit of time. Without
it, one client — buggy, malicious, or just a scraper — can take the whole system down; a normal
client asking politely and an attacker sending a million requests a second look identical to a
server with no limiter in front of it.

**Three concepts people conflate:**

| Concept | Behavior once past the threshold | Where it actually lives |
|---|---|---|
| **Rate limiting** | Reject immediately — `429` | HTTP API servers |
| **Throttling** | Delay — hold the item, process it later | Async workers, queue consumers |
| **Load shedding** | Selective rejection when the whole system is overloaded | Circuit breakers, infra |

In plain HTTP APIs, "throttling" and "rate limiting" are used interchangeably — AWS, Stripe, and
GitHub all call their `429` behavior "rate limiting," even though strictly it's a reject, not a
delay. *Real* throttling shows up in async systems: a worker pulling off a Kafka topic paces
itself against a shared Redis limiter before pushing to a downstream SMS gateway, sleeping instead
of rejecting — there's no HTTP client waiting on the other end to reject.

**Status codes and headers:**

```
429 Too Many Requests   — rate limit (client sent too much)
503 Service Unavailable — load shedding (server is overloaded)
403 Forbidden            — authorization, NOT rate limiting

Retry-After: 30                — seconds to wait
X-RateLimit-Limit: 100         — the configured limit
X-RateLimit-Remaining: 0       — how much is left
X-RateLimit-Reset: 1704067320  — epoch time of the next reset
```

## 2. Implementation layers — where to enforce it

Rate limiting isn't one place — it belongs at several layers at once, each stopping a different
class of problem:

**2.1 Client-side** — don't send the wasted request in the first place.
- **Debounce**: collapse rapid-fire input (search-as-you-type) into one call after a quiet period.
- **Batching**: queue analytics/telemetry events and flush them together on an interval instead of
  one request per event.
- **Exponential backoff with full jitter**: on a `429`, wait `random(0, min(cap, base·2ⁿ))` before
  retrying — jitter is what stops 1,000 clients that all got rate-limited at once from retrying at
  exactly the same instant and re-triggering the same spike.

**2.2 Infrastructure** — Nginx / API gateway / load balancer, before a request ever reaches
application code.
- Nginx is a **reverse proxy**, not just a web server, and handles ~10K concurrent connections on
  one core through **event-driven, non-blocking I/O** — one event loop thread reacts to "data
  ready," "response ready," "new connection," "timeout" — instead of one OS thread per connection.
- `limit_req_zone` + `limit_req` implement rate limiting as a **leaky bucket** internally — the
  `burst` parameter is literally the queue size; `nodelay` means reject immediately past that
  queue rather than delaying.
- Load-balancing strategies sit right next to it: round robin (default), least-connections,
  IP-hash (session stickiness), weighted.
- Kong/Envoy centralize this as a plugin/config instead of code, sharing state (e.g. via Redis)
  across every gateway node.

**2.3 Application / middleware** — where business context lives that infrastructure can't see:
tier-based limits (free/pro/enterprise), per-endpoint limits (a slow `/export` gets its own,
tighter budget), per-API-key instead of per-IP.

## 3. Distributed state — Redis, atomicity, Lua

Everything downstream of this section assumes the same foundation, so it comes before the
algorithms rather than after.

**3.1 The problem**: each pod keeps its own counter. Three pods behind a load balancer, each
convinced it's used 47/12/38 of the budget, have actually let through 97 — the limit was bypassed
by simply having more than one instance. The fix is a **counter shared in Redis**.

**3.2 The race**: two pods `GET` the same counter at the same instant, both see `1`, both decide
they're allowed, both `SET` it to `0` — one request that should have been rejected got through,
and the count is now wrong. Read-then-write is not safe when more than one caller can read before
either writes.

**3.3 The fix — Lua scripts**: Redis is single-threaded, and a Lua script runs to completion
without another client's command interleaving. Wrapping the `GET`+decide+`SET` in one `EVAL`/
`EVALSHA` call makes the whole sequence atomic — the second pod's script simply sees the
already-decremented value.

**3.4 Redis Cluster and hash tags**: a Lua script can only run against keys on one node. Two
related keys (`rl:user_456:prev`, `rl:user_456:curr`) can land on two different nodes and the
script fails with `CROSSSLOT`. Wrapping the shared part in `{}` — `rl:{user_456}:prev` — makes
Redis hash only that substring, guaranteeing both keys land on the same node.

**3.5 Precision vs. performance** — three points on one spectrum:

| Approach | Latency | Precision | Scale |
|---|---|---|---|
| Lua script (strong consistency) | 1–4ms (Redis round trip) | Exact | ~100K req/s per node |
| Local cache, async-synced every 100ms | ~0ms | Can overshoot ~10–30% briefly | Millions req/s |
| Approximate / probabilistic | ~0ms | Low | Unbounded |

The local-cache pattern is fine for a social feed's like counter and unacceptable for billing.

## 4. Algorithms — six, compared

All six assume the Redis + Lua foundation above.

1. **Fixed Window Counter** — one counter per clock-aligned window (`INCR` + `EXPIRE`). Cheapest,
   `O(1)`, doesn't even need Lua (`INCR` is already atomic) — but a window boundary lets two full
   allotments land back-to-back (99 requests at `:59`, 99 more at `:01` — 198 in two seconds,
   both individually "valid").
2. **Sliding Window Log** — a Redis sorted set of timestamps; trim anything older than the window,
   count what's left, add the new one (`ZREMRANGEBYSCORE` + `ZCARD` + `ZADD`). Exactly accurate,
   no boundary artifact — at the cost of `O(N)` memory per key (100 requests/min per user × 1M
   users = 100M sorted-set entries).
3. **Sliding Window Counter** — a hybrid: `estimate = prev_count × weight + curr_count`, where
   `weight = 1 − elapsed/window`. `O(1)` memory, usually within a few percent of exact — but it
   assumes traffic within each window is evenly distributed; a burst concentrated at the very
   edges of two windows can still slip to roughly 2× the limit.
4. **Token Bucket** — a bucket refills continuously at a fixed rate up to a capacity; each request
   spends one token, computed lazily (`min(capacity, tokens + elapsed × rate)`) rather than on a
   timer. Allows controlled bursts, `O(1)`, gives an exact `Retry-After`, no boundary spike — the
   generally recommended default. Needs two tuned parameters (capacity, rate).
5. **Leaky Bucket** — a capped queue draining at a fixed rate; a request is accepted if the queue
   isn't full, rejected otherwise. Guarantees a fixed *output* rate, protecting whatever is
   downstream — but the counter-based version isn't a true smoother (it can still let a burst
   through if the queue has room); a genuinely smooth output needs an actual FIFO queue (a real
   worker pulling off Kafka), not just a counter.
6. **GCRA** (Generic Cell Rate Algorithm) — mathematically equivalent to token bucket, but stores
   one value (`tat`, "theoretical arrival time") instead of two (`tokens`, `last_ts`). Used inside
   `redis-cell`. Rarely reimplemented by hand in application code — token bucket is easier to
   reason about and just as capable — but worth knowing it exists as "the one-field version."

**Comparison:**

| Algorithm | Memory | Boundary spike | Allows burst | Exact `Retry-After` | Best for |
|---|---|---|---|---|---|
| Fixed Window | O(1) | ❌ up to 2× | ❌ | ❌ | Simple, low-stakes limits |
| Sliding Log | O(N) | ✅ | ❌ | ❌ | Billing, exact accounting |
| Sliding Counter | O(1) | ⚠️ ~2× worst case | ❌ | ❌ | Most public APIs |
| Token Bucket | O(1) | ✅ | ✅ | ✅ | **Default choice** |
| Leaky Bucket | O(1) | ✅ | ❌ | ✅ | Protecting a downstream system |
| GCRA | O(1), one field | ✅ | ✅ | ✅ | Same as token bucket, tighter storage |

## 5. System design — putting it together

A worked example: 10M users, 100K req/s peak, 1,000 req/min per user, 500K req/min global per
endpoint, <5ms overhead, 99.99% availability.

**Architecture**: Clients → edge (Cloudflare: DDoS, IP block) → infrastructure (Nginx: per-IP
limit, connection cap) → application pods → a rate-limit service backed by a sharded Redis
cluster → business services. The rate-limit check sits as its own hop the application pods call
before proceeding, not embedded ad hoc in each service.

**Sharding**: a per-user key (`rl:{user_456}:token`) hashes to one fixed node — the hash tag keeps
the Lua script legal. A *global* per-endpoint limit doesn't have a natural per-entity key, so it's
split across N shards (`rl:global:{/api/send}:shard:{0..15}`), each budgeted at
`total_limit / N × 1.1` (a small buffer), trading a little precision for spreading writes across
nodes instead of hammering one hot key.

**Hard limit vs. soft limit**: a hard limit rejects the instant it's crossed (free tier: 100
req/min, no exceptions). A soft limit logs and warns while still serving (pro tier: 1,000 req/min,
overage gets billed rather than blocked) — the same `check()` call, different response to the
result.

**Fail-open vs. fail-closed**: when the Redis-backed limiter itself is unreachable, fail-open lets
every request through (higher availability, briefly no protection); fail-closed rejects everything
(protects billing/security, drops availability). Most public APIs fail open, paired with a circuit
breaker and tight monitoring, because an outage in the limiter shouldn't take down the product it
was protecting.

## 6. Demo

The reference project ships a full running app (Kotlin/Micronaut backend + React frontend): an
admin page that switches the live algorithm and its parameters without a restart, a per-user state
visualizer streamed over SSE, and a client page with multiple simulated users (open several tabs)
that can blast concurrent requests and watch tokens/queue/counters drain in real time — including
a scripted "boundary spike" demo that times a burst to land exactly across a Fixed Window reset
and shows the double-allotment live.

This deck's own [`demo.html`](demo.html) is the static-site equivalent of that idea, scoped to
what a GitHub Pages site can do without a backend: a real token bucket, shared across tabs through
`localStorage`, with a toggle that reproduces the "per-pod counter" bug from §3.1 on demand.

## 7. Checkpoint questions

**Easy** — Which HTTP status code is returned when a rate limit is exceeded?
→ `429 Too Many Requests`, with a `Retry-After` header telling the client how long to wait.

**Medium** — Why does a Fixed Window Counter let through roughly 2× traffic at a window boundary?
→ Because each window resets independently. 100 requests at `12:00:59` fill window `12:00`
(count = 100, allowed); the clock ticks to `12:01:00`, the counter resets to zero, and 100 more
requests immediately after are also allowed. Total: 200 requests in about two seconds, against a
limit of 100/minute — a Sliding Window (log or counter) fixes this by never resetting abruptly.

**Hard** — A Redis round trip costs ~5ms per check. How does that cap throughput, and how would
you optimize it?
→ At 5ms per check, one thread tops out around `1000ms / 5ms = 200 req/s`; 100 concurrent
coroutines gets you to ~20,000 req/s — not unlimited. Optimizations, roughly in order of effort:
`EVALSHA` instead of `EVAL` (send a hash, not the whole script); a pooled/reused connection instead
of opening one per request; a local in-memory cache synced to Redis every ~100ms (cuts round trips
~99%, at the cost of briefly overshooting the limit by up to that window's worth of traffic);
placing the Redis cluster in the same availability zone to cut network latency; pipelining
multiple non-Lua Redis commands into one round trip where the operation allows it.

## Appendix — key terms, one line each

| Term | One line |
|---|---|
| Rate limiting | Reject once past the threshold (`429`) |
| Throttling | Delay once past the threshold — only really exists in async systems |
| Bucket | A capacity-bounded container whose contents change over time |
| Fixed Window | Resets on the clock; simple; has a boundary-spike flaw |
| Sliding Window | A continuously moving window; more accurate, costs more |
| Token Bucket | Refills while idle, spends on use — the algorithm that allows burst |
| Leaky Bucket | A capped queue draining at a fixed rate — fixed *output*, not input |
| GCRA | Token bucket's one-field equivalent; the algorithm inside `redis-cell` |
| Distributed counting | Redis + Lua = one atomic counter shared across every pod |
| Hash tag `{}` | Forces related Redis keys onto the same cluster node |
| Backpressure | Downstream telling upstream to slow down (`429` + `Retry-After`) |
| Fail-open | Limiter backend down ⇒ let requests through (favors availability) |
| Fail-closed | Limiter backend down ⇒ reject everything (favors security/billing) |
| Hard limit | Crossing it rejects immediately, no exceptions |
| Soft limit | Crossing it warns/bills/throttles lightly, but keeps serving |
| DoS protection | Rate limiting is the *last* layer — a CDN/shield is the first |
