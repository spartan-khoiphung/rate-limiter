# SLIDE-PLAN — Rate Limiting

Generic systems lecture, not tied to any employer's codebase — pseudocode and public,
well-documented patterns only (AWS's backoff-and-jitter writeup, Redis command semantics,
the standard bucket/window taxonomy). Deployable as a static site on GitHub Pages: a single
self-contained `index.html` (styles and scripts inlined, no separate files to go missing),
plus a GitHub Actions workflow that publishes it on every push.

## Visual concept

Institutional calm, modeled after Coinbase's public design system: one restrained accent color
carries every action, display type stays at a light weight instead of shouting, and depth comes
from a hairline border on ~95% of surfaces rather than a stack of shadows. Semantic green/red
exist only as text — for the allow/reject verdicts a rate limiter actually produces — and never
as a button fill, so they read as information, not decoration. A thin hand-drawn icon sprite
(bucket, pipe, window, ledger, gauge, clock, die) still marks each section, in the single-stroke
style of a schematic legend, but the palette around it is quiet enough that the icon does the
signaling, not a glowing accent.

- **Color**: paper `#F7F7F7` (a soft neutral floor, not the card itself) · surface `#FFFFFF` ·
  ink `#0A0B0D` · body `#5B616E` · muted `#7C828A` · hairline `#DEE1E6` · accent `#0052FF` ·
  accent-strong (press) `#003ECC` · reject (text-only) `#CF202F` · allow (text-only) `#05B169`.
  One shadow tier (`0 4px 12px rgba(10,11,13,.06)`), used only where something genuinely floats —
  the slide itself over its backdrop, the notes overlay — never stacked on cards sitting inside
  those. Dark mode swaps to a near-black ground `#0A0B0D` with a lighter accent for contrast;
  toggled with `t`, otherwise follows system.
- **Type**: **Inter** for both headings and body — Coinbase's own stated fallback for its custom
  cuts — differentiated by weight and size rather than by swapping families. Headings and the one
  big numeral per slide stay at **weight 400** even at 68px: restraint over shouting is the whole
  point of the reference. **JetBrains Mono** carries pseudocode, data, and schematic labels.
- **Shape**: chips and segmented-control buttons are full pills (`100px` radius, matching Coinbase's
  CTA and badge shapes); cards and the slide frame itself use a calmer `24px` radius; inputs and
  code blocks stay at `12px`.
- **Layout**: same reusable layouts as before (split 60/40, trio, table, full), but every diagram
  now sits inside a "meter" — a hairline-bordered field with axis ticks — rather than floating on
  white, so the deck reads as one instrument panel rather than a slideshow.

## Slide list

| # | Title | Layout | Visual | Steps |
|---|---|---|---|---|
| 1 | Rate Limiting | cover | Gauge dial hero, needle in the accent-blue zone | — |
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
