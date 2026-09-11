# Rate Limiting

A self-contained slide deck on the five rate-limiting algorithms, where a limiter belongs in an
architecture, and why exponential backoff needs jitter. No build step, no framework — three files
loaded relative to `index.html`.

## View it locally

Open `index.html` directly, or serve the folder so relative asset paths resolve the same way
they will on GitHub Pages:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Pick the branch (`main`) and the folder — `/ (root)` if this folder *is* the repo root, or
   `/docs` if you nested it there.
5. Save. GitHub publishes at `https://<user>.github.io/<repo>/` within a minute or two.

`.nojekyll` is included so GitHub serves `deck.js` and `widgets.js` as-is instead of running them
through the Jekyll build.

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

- `index.html` — slide content and structure
- `deck.css` — design tokens (color, type, spacing) and layout
- `deck.js` — navigation, notes, overview, theme toggle
- `widgets.js` — the charts and interactive sliders, each built from one linear scale

See [`SLIDE-PLAN.md`](SLIDE-PLAN.md) for the design rationale and the full slide list.
