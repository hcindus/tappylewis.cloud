# Brain Constellation v4 — Fleet Deployment Guide

Two self-contained HTML files. No build step, no backend — just serve them (or open them) and edit one `CONFIG` block to point at a brain.

## Files

| File | Use case | Data source |
|------|----------|-------------|
| `brain-constellation-v4-local.html` | Run on the SAME host as a brain | `http://localhost:8080/api/status` |
| `brain-constellation-v4-remote.html` | View the MAIN brain from anywhere | `https://tappylewis.cloud/brain/status` |

## Setup (per fleet host)

1. Copy the HTML file onto the host (any web root, or just open it in a browser).
2. Copy `portfolio.json` alongside it (for the `-local` build).
3. Edit the `CONFIG` block near the top of the `<script>` — there are exactly two lines to change:

```js
// ── CONFIG (edit these two to point at YOUR brain / portfolio) ──
const BRAIN_URLS = ['http://localhost:8080/api/status'];  // your brain's status endpoint
const PORTFOLIO_URL = '/portfolio.json';                   // your entity list
```

That's it. The visualizer polls the brain every 2s and re-reads the portfolio every 30s, so it's fully live.

## Requirements for live data

- The brain must expose a status JSON at the `BRAIN_URLS` endpoint.
- That endpoint must send `Access-Control-Allow-Origin: *` (the Miles brain already does) so cross-origin viewing works.
- `portfolio.json` shape:

```json
{
  "categories": { "Commerce": "#d69e2e", "...": "..." },
  "entities": [
    { "name": "CREAM", "category": "Software", "sub": "Real estate agent mgmt" }
  ]
}
```

Entities are auto-distributed on a sphere and tethered to a brain region by category (see `CATEGORY_REGION` in the HTML).

## The suite (all live on tappylewis.cloud)

- `brain-composite.html` — regions + live traffic
- `brain-neural-v2.html` — living memory points
- `brain-constellation-v3.html` — business/project map (hardcoded entities)
- `brain-constellation-v4.html` — live self-updating map (relative data source)
- `brain-constellation-v4-local.html` — **local build** (own brain)
- `brain-constellation-v4-remote.html` — **remote build** (main brain)
