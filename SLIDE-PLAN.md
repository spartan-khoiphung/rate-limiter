# SLIDE-PLAN — Rate Limiting

Generic systems lecture, not tied to any employer's codebase — pseudocode and public,
well-documented patterns only (AWS's backoff-and-jitter writeup, Redis command semantics,
the standard bucket/window taxonomy). Deployable as a static site on GitHub Pages: no build
step, no server, three files (`index.html`, `deck.css`, `deck.js`, `widgets.js`) loaded relative
to each other.

## Visual concept

Rate limiting is a **flow-control** problem — valves, gauges, meters — so the deck borrows that
vocabulary instead of a generic "tech talk" look. A single amber signal color (`#F5A623`-family)
stands for "throttle," used the way a flow gauge uses its needle: sparingly, only where something
is actually being metered. Danger red is reserved for "rejected" (429), a separate hue from the
brand accent so the two never compete. A thin hand-drawn icon sprite (bucket, pipe, window, ledger,
gauge, clock, die) marks each section, in the single-stroke style of a schematic legend.

- **Color**: paper `#F3F4F8` (cool, not cream) · ink `#12162A` · body `#3B415A` · muted `#6C7290` ·
  hairline `#DBDEEA` · accent (throttle) `#F5A623` · accent-strong `#D98300` · reject `#E1495B` ·
  allow `#1E9E73`. Dark mode swaps to ink-navy ground `#0E1120` with the same accent, contrast kept
  legible both ways; toggled with `t`, otherwise follows system.
- **Type**: **Archivo** (700/800) for headings — a grotesk with enough weight to read as signage;
  **Archivo Black** only for the one big hero numeral per slide; **IBM Plex Sans** for body copy;
  **IBM Plex Mono** for pseudocode, data, and the little schematic labels. Plex Sans/Mono are drawn
  from the same family, so code and prose sit together without clashing.
- **Layout**: same reusable layouts as before (split 60/40, trio, table, full), but every diagram
  now sits inside a "meter" — a hairline-bordered field with axis ticks — rather than floating on
  white, so the deck reads as one instrument panel rather than a slideshow.

## Slide list

| # | Title | Layout | Visual | Steps |
|---|---|---|---|---|
| 1 | Rate Limiting | cover | Gauge dial hero, needle in the amber zone | — |
| 2 | Two places a limiter can live | full | Client → gateway → service, service → third party | 1: "gateway: often absent" |
| 3 | Token bucket: burst, then a steady drip | split | Gantt of 10 concurrent callers against a 5-token bucket | 1: callers 6–10 |
| 4 | Borrow first, then sleep off the debt | split | Pseudocode `acquire()` | 1–3 |
| 5 | Leaky bucket: smooth the output, not the input | split | Ideal drip vs. batched drip (integer division) | 1 |
| 6 | Fixed window: the boundary spike | split | Two windows meeting at a clock boundary | 1, 2 |
| 7 | Fixed window in the wild | table | Three common uses | — |
| 8 | Picking the right key | trio | Composite key, status-code parity, trusted hop | — |
| 9 | Sliding window log | split | Timestamps trimmed against a ZSET | — |
| 10 | Sliding window counter | split | Interactive slider on the estimate formula | — |
| 11 | Where the counter lives changes the limit | trio | In-process / shared cache / vendor-side | — |
| 12 | Two commands, one race | split | `INCR` then `EXPIRE`, and the atomic fix | 1 |
| 13 | Absorbing a 429 | two-up | Retry-After backpressure vs. a shared circuit gate | 1 |
| 14 | Three backoff schedules, one has jitter | table | Comparison | — |
| 15 | Why jitter: the thundering herd | full | Histogram, mode switch (none/equal/full) | — |
| 16 | Three jitter formulas | split | Table + pseudocode | 1 |
| 17 | Retry-After still needs jitter | full | Histogram, exact vs. +20% | — |
| 18 | Takeaways | list | Five points | — |

## Keyboard

`→` / `Space` next step · `←` back · `N` speaker notes · `O` overview grid · `T` toggle theme ·
`F` fullscreen · `#6.2` deep-link to slide 6, step 2 · print → one page per slide, all steps shown.

## Deploying to GitHub Pages

No build step. Push this folder to a repo, then in **Settings → Pages** choose
**Deploy from a branch**, branch `main`, folder `/ (root)` — or `/docs` if you'd rather nest it.
`.nojekyll` is included so GitHub doesn't run the Jekyll build over the `deck.js`/`widgets.js`
files.
