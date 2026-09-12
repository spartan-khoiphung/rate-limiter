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
technical-report cover. The accent is a single console teal — a terminal-cursor color, not a
brand color — carried at two lightness steps (a bright `--accent` for text/marks, a deeper
`--accent2` for gradients and depth) rather than as two competing hues. Amber/orange is held in
reserve for "reject" alone, so it reads as a warning the moment it appears rather than a color
that's already been spent decorating something else. A thin hand-drawn icon sprite (bucket, pipe,
window, ledger, gauge, clock, die) sits in a tinted circular plate at the head of every section
and card, doing double duty as illustration.

- **Color**: paper `#081112` (dark) / `#F4F8F8` (light) · surface `#0F1A1B` / `#FFFFFF` · ink,
  body, muted scaled off a cool near-black rather than pure grey · accent (console teal) `#3FC7D4`
  (dark) / `#1B8A93` (light) · accent2 (deeper teal, for gradients) `#1E8F99` (dark) / `#4FB8C2`
  (light) · panel-border = accent at ~30–35% alpha, used on every card/meter/gauge-card instead of
  a neutral hairline, so borders read as "on" rather than merely structural · reject (text-only,
  amber — the only other color in the system) · allow (text-only, muted green). One shadow tier,
  used only where something floats above the deck (the slide itself, the notes overlay). Toggled
  with `t`, otherwise follows system — the dark recipe is the one this deck is designed around;
  light swaps the same tokens onto a paper ground.
- **Type**: **Inter** for headings and body, weight bumped to 600 for presence (400 read as too
  flat for a title slide); **JetBrains Mono** for pseudocode, data, schematic labels, and the
  divider's "SECTION n" tag.
- **Shape**: chips and segmented-control buttons are full pills (`100px`); cards, the slide frame,
  and the gauge card use a `24px` radius with a visible accent-tinted border; inputs and code
  blocks stay at `12px`.
- **Signature move — section dividers**: eight divider slides (one per act) carry a numeral in
  large outline type (`-webkit-text-stroke`, transparent fill) in teal, with a dash-and-label
  "SECTION n" tag directly beneath it, then the act's title and one-line thesis.
- **Layout**: same reusable layouts as before (split 60/40, trio, table, full), but every diagram
  sits inside a "meter" — a bordered field with axis ticks — rather than floating free, so the
  deck reads as one instrument panel rather than a slideshow.
- **Motion**: every slide's own top-level children (eyebrow → title → body) cascade in with a
  100ms stagger once the slide becomes active, instead of the whole slide appearing as one block —
  the deck-wide fix for reading as monotonous. Slide-to-slide navigation crossfades + rises.

## Two live diagrams, not screenshots

The topology slide (§01) and the token-bucket flow embed real interactive diagrams generated with
[Archify](https://github.com/tt-a1i/archify) instead of static in-deck SVG: pan, zoom, theme
toggle, and an "Open full screen ↗" link out to `diagrams/*.html`. Source specs live alongside the
delivered HTML in `diagrams/` (`*.architecture.json`, `*.workflow.json`) — regenerate with:

```bash
npx skills add tt-a1i/archify -g   # once, installs the skill
node ~/.claude/skills/archify/bin/archify.mjs deliver workflow \
  diagrams/token-bucket-flow.workflow.json diagrams/token-bucket-flow.html --quality showcase
node ~/.claude/skills/archify/bin/archify.mjs deliver architecture \
  diagrams/request-topology.architecture.json diagrams/request-topology.html --quality showcase
```

## Hands-on demo (`demo.html`)

A separate page, linked from the "Open it in four tabs and get throttled" slide: a real token
bucket (capacity 5, refill 1/s) implemented in `localStorage`, shared across every tab open on the
same origin. A mode toggle switches between a correctly shared bucket and a deliberately buggy
per-tab bucket, reproducing the "in-process memory ⇒ limit × replica count" problem live. The
shared bucket's read-modify-write is intentionally non-atomic across tabs — the same race the
lecture warns about — rather than papered over with a lock the real bug doesn't have.

## Content source

Restructured to follow [`PRESENTATION-EN.md`](PRESENTATION-EN.md) — an English adaptation of
[spartan-nhanta/vntech-rate-limit](https://github.com/spartan-nhanta/vntech-rate-limit)'s
`presentation/rate-limit-outline.md` ("The Physics of Traffic Control," a 100-minute two-presenter
internal talk). That file is the outline to read first; this deck is its self-paced, single-track
rendering. Existing slides (the five algorithms, the backoff/jitter interactives, `demo.html`)
carried over unchanged where the outline's content matched what was already here; everything in
sections 1, 2, 3, 5, and 7 below is new.

## Slide list

Eight acts, each opened by a divider slide (bold row below): Introduction, Implementation Layers,
Distributed State, Algorithms, System Design, Demo, Checkpoint Questions, and a closing Takeaways.

| # | Title | Layout | Visual |
|---|---|---|---|
| 1 | Rate Limiting | cover | Gauge dial hero |
| **2** | **§1 — Introduction** | divider | Outline "01" |
| 3 | Rate limiting vs. throttling vs. load shedding | table | Three-concept comparison |
| 4 | Status codes & headers | code | `429`/`503`/`403` + `Retry-After` etc. |
| **5** | **§2 — Implementation layers** | divider | Outline "02" |
| 6 | Client, infrastructure, application | full | Live Archify topology diagram |
| 7 | Client-side: debounce, batch, backoff | trio | Three code snippets |
| 8–10 | Thundering herd · jitter formulas · Retry-After jitter | full/split | Interactive histograms (reused) |
| 11 | Nginx: event-driven I/O | split | Event-loop explanation |
| 12 | Nginx config + load balancing | code | `limit_req_zone`, Kong/Envoy |
| 13 | Application/middleware | code | Kotlin tier-based filter |
| **14** | **§3 — Distributed state** | divider | Outline "03" |
| 15 | Multi-pod counter problem | diagram | Load balancer fanning to 3 pods |
| 16 | Two commands, one race | split | `INCR`+`EXPIRE` race, Lua fix (reused) |
| 17 | Hash tags & Redis Cluster | code | `CROSSSLOT` vs. `{}` |
| 18 | Precision vs. performance | table | Lua / local cache / approximate |
| **19** | **§4 — Algorithms** | divider | Outline "04" |
| 20–27 | Token bucket ×2, leaky bucket, fixed window ×2, key design, sliding log, sliding counter | split/table/trio | Reused from the original deck |
| 28 | GCRA | code | `tat` pseudocode |
| 29 | Six algorithms, compared | table | Full comparison incl. GCRA |
| **30** | **§5 — System design** | divider | Outline "05" |
| 31 | Requirements | trio | Big-number stat tiles |
| 32 | Architecture | diagram | Clients → edge → app → Redis Cluster |
| 33 | Sharding | code | Per-user key vs. sharded global key |
| 34 | Hard limit vs. soft limit | two-up | Comparison + code |
| 35 | Fail-open vs. fail-closed | two-up | Comparison |
| 36 | Absorbing a 429 | two-up | Retry-After + circuit gate (reused) |
| 37 | Backoff schedules | table | Comparison (reused) |
| **38** | **§6 — Demo** | divider | Outline "06" |
| 39 | Open it in four tabs and get throttled | split | Link to `demo.html` |
| **40** | **§7 — Checkpoint questions** | divider | Outline "07" |
| 41 | Easy, medium, hard | list | Three Q&A |
| **42** | **Takeaways** | divider | Outline "08" |
| 43 | Five things worth remembering | list | Closing points (reused) |

## Keyboard

`→` / `Space` next step · `←` back · `N` speaker notes · `O` overview grid · `T` toggle theme ·
`F` fullscreen · `#6.2` deep-link to slide 6, step 2 · print → one page per slide, all steps shown.

## Deploying to GitHub Pages

Automatic via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to
`main` — see [`README.md`](README.md) for details. No build step; `.nojekyll` stops GitHub from
running the site through Jekyll.
