# SLIDE-PLAN — Rate Limiting

Generic systems lecture, not tied to any employer's codebase — pseudocode and public,
well-documented patterns only (AWS's backoff-and-jitter writeup, Redis command semantics,
the standard bucket/window taxonomy). Deployable as a static site on GitHub Pages: a single
self-contained `index.html` (styles and scripts inlined, no separate files to go missing),
plus a GitHub Actions workflow that publishes it on every push.

## Visual concept

A dark instrument panel in the spirit of a terminal-style slide deck: near-black surfaces, visible
(not merely hairline) borders tinted with the accent, monospace labels, and a signature move —
each major section opens on a divider slide with a huge outline numeral, echoing a printed
technical-report cover. Two tones carry the whole system rather than one loud accent: a muted
brick red (`--accent`) and a soft, desaturated blue (`--accent2`), used together — never as
competing accents, always as one pairing — on the handful of elements meant to read as the
deck's signature: the left edge strip, the top rule on every slide, and the divider's numeral +
section tag. Both are kept muted (no neon saturation) so the pairing reads as considered rather
than loud. Semantic green/orange exist only as text — for the allow/reject verdicts a rate
limiter actually produces — and stay clearly apart from the brand pairing. A thin hand-drawn icon
sprite (bucket, pipe, window, ledger, gauge, clock, die) sits in a tinted circular plate at the
head of every section and card, doing double duty as illustration.

- **Color**: paper `#0C0808` (dark) / `#F7F7F7` (light) · surface `#170F0F` / `#FFFFFF` ·
  ink, body, muted scaled off a warm near-black rather than pure grey · accent (muted brick red)
  `#C96B64` (dark) / `#B8524F` (light) · accent2 (soft desaturated blue) `#7E9AB8` (dark) /
  `#5C7A99` (light) · panel-border = accent at ~30% alpha, used on every card/meter/gauge-card
  instead of a neutral hairline, so borders read as "on" rather than merely structural · reject
  (text-only, warm orange, kept apart from the brand red) · allow (text-only, muted green). One
  shadow tier, used only where something floats above the deck (the slide itself, the notes
  overlay). Toggled with `t`, otherwise follows system — the dark recipe is the one this deck is
  designed around; light swaps the same tokens onto a paper ground.
- **Type**: **Inter** for headings and body, weight bumped to 600 for presence (400 read as too
  flat for a title slide); **JetBrains Mono** for pseudocode, data, schematic labels, and the
  divider's "SECTION n" tag.
- **Shape**: chips and segmented-control buttons are full pills (`100px`); cards, the slide frame,
  and the gauge card use a `24px` radius with a visible accent-tinted border; inputs and code
  blocks stay at `12px`.
- **Signature move — section dividers**: five divider slides (one per act) carry a numeral in
  large outline type (`-webkit-text-stroke`, transparent fill) in the accent red, a dash-and-label
  "SECTION n" tag in the soft blue directly beneath it — the one place the two tones sit side by
  side as a deliberate pairing — then the act's title and one-line thesis.
- **Layout**: same reusable layouts as before (split 60/40, trio, table, full), but every diagram
  sits inside a "meter" — a bordered field with axis ticks — rather than floating free, so the
  deck reads as one instrument panel rather than a slideshow.

## Slide list

Five acts, each opened by a divider slide (bold row below).

| # | Title | Layout | Visual | Steps |
|---|---|---|---|---|
| 1 | Rate Limiting | cover | Gauge dial hero, needle in the accent zone | — |
| **2** | **§01 — Where it lives** | **divider** | **Outline "01"** | — |
| 3 | Two places a limiter can live | full | Client → gateway → service, service → third party | 1: "gateway: often absent" |
| **4** | **§02 — Counting algorithms** | **divider** | **Outline "02"** | — |
| 5 | Token bucket: burst, then a steady drip | split | Gantt of 10 concurrent callers against a 5-token bucket | 1: callers 6–10 |
| 6 | Borrow first, then sleep off the debt | split | Pseudocode `acquire()` | 1–3 |
| 7 | Leaky bucket: smooth the output, not the input | split | Ideal drip vs. batched drip (integer division) | 1 |
| 8 | Fixed window: the boundary spike | split | Two windows meeting at a clock boundary | 1, 2 |
| 9 | Fixed window in the wild | table | Three common uses | — |
| 10 | Picking the right key | trio | Composite key, status-code parity, trusted hop | — |
| 11 | Sliding window log | split | Timestamps trimmed against a ZSET | — |
| 12 | Sliding window counter | split | Interactive slider on the estimate formula | — |
| **13** | **§03 — State & correctness** | **divider** | **Outline "03"** | — |
| 14 | Where the counter lives changes the limit | trio | In-process / shared cache / vendor-side | — |
| 15 | Two commands, one race | split | `INCR` then `EXPIRE`, and the atomic fix | 1 |
| **16** | **§04 — Being a good client** | **divider** | **Outline "04"** | — |
| 17 | Absorbing a 429 | two-up | Retry-After backpressure vs. a shared circuit gate | 1 |
| 18 | Three backoff schedules, one has jitter | table | Comparison | — |
| 19 | Why jitter: the thundering herd | full | Histogram, mode switch (none/equal/full) | — |
| 20 | Three jitter formulas | split | Table + pseudocode | 1 |
| 21 | Retry-After still needs jitter | full | Histogram, exact vs. +20% | — |
| **22** | **§05 — Takeaways** | **divider** | **Outline "05"** | — |
| 23 | Takeaways | list | Five points | — |

## Keyboard

`→` / `Space` next step · `←` back · `N` speaker notes · `O` overview grid · `T` toggle theme ·
`F` fullscreen · `#6.2` deep-link to slide 6, step 2 · print → one page per slide, all steps shown.

## Deploying to GitHub Pages

No build step. Push this folder to a repo, then in **Settings → Pages** choose
**Deploy from a branch**, branch `main`, folder `/ (root)` — or `/docs` if you'd rather nest it.
`.nojekyll` is included so GitHub doesn't run the Jekyll build over the `deck.js`/`widgets.js`
files.
