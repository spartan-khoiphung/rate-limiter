# Rate Limiting

A self-contained slide deck on the five rate-limiting algorithms, where a limiter belongs in an
architecture, and why exponential backoff needs jitter. Everything — markup, styles, and the chart
scripts — lives in a single `index.html`, so it opens correctly straight off disk, from a Slack
attachment, or from GitHub Pages, with no separate files that can go missing or fail to resolve.

## View it locally

Just open `index.html` in a browser. No build step, no dependencies to install.

## Deploy to GitHub Pages

Deployment is automatic: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and
publishes the site on every push to `main`/`master`, and turns Pages on for the repo itself the
first time it runs (`configure-pages` with `enablement: true`) — no trip to **Settings → Pages**
required. Just push:

```bash
git push
```

Then check the **Actions** tab for the run; the deployed URL shows up there and in
**Settings → Pages** once it finishes (`https://<user>.github.io/<repo>/`).

`.nojekyll` is included so GitHub serves the page as-is instead of running it through Jekyll.

## Controls

| Key | Action |
|---|---|
| `→` / `Space` | Next step, then next slide |
| `←` | Previous step, then previous slide |
| `N` | Toggle speaker notes |
| `O` | Overview grid — click a slide to jump to it |
| `T` | Toggle light / dark |
| `F` | Fullscreen |
| `#6.2` | Deep link to slide 6, step 2 |

Printing (`⌘P` / `Ctrl P`) lays out one slide per page with every step already revealed.

## Editing

Everything is in `index.html`:
- the `<style>` block — design tokens (color, type, spacing) and layout
- the slide markup — content and structure
- the first `<script>` block (`widgets.js`'s former content) — the charts and interactive sliders,
  each built from one linear scale
- the second `<script>` block (`deck.js`'s former content) — navigation, notes, overview, theme toggle

See [`SLIDE-PLAN.md`](SLIDE-PLAN.md) for the design rationale and the full slide list.
