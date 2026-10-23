# GitStats

GitStats checks the health of any public GitHub repository. Type `facebook/react` (or paste a GitHub URL) and it fetches live data from the GitHub REST API, calculates a 0–100 health score, and renders it as a small dashboard.

The project is deliberately simple: **React + Vite** on the frontend, **Express** on the backend, plain CSS, and hand-built SVG/CSS charts. No chart library, no database, no TypeScript.

## What it shows

- **Health score (0–100)** with a breakdown of how every point was earned.
- **Commit velocity** for the last 30 days, including active days.
- **Issue balance**: open vs. closed counts and median time-to-close.
- **Pull request flow**: merge rate and median time-to-merge.
- **Stars, forks, watchers, languages, topics, license**, and last push date.
- **Top repositories** on the home page: most-starred of all time and "Rising" repos created in the last 90 days.

## Requirements

- Node.js **18 or newer**
- npm 9 or newer

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Open <http://localhost:5173>.

The Express API starts on <http://localhost:5000> and Vite proxies `/api` to it.

### Optional: add a GitHub token

Without a token GitHub allows **60 requests per hour** per IP. That is enough to try the app, but the home page and a couple of dashboard loads will use it up.

1. Create a fine-grained personal access token with **public repository read** access:
   <https://github.com/settings/tokens?type=beta>
2. Put it in `.env`:

   ```env
   GITHUB_TOKEN=github_pat_...
   ```

3. Restart the server. The quota becomes **5,000 requests/hour**.

The token is read only by the Express server and never reaches the browser.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs Express and Vite together |
| `npm run dev:server` | Express only, with `node --watch` |
| `npm run dev:client` | Vite only |
| `npm run build` | Builds the React app into `client/dist` |
| `npm start` | Starts Express and serves the built app |
| `npm run preview` | Builds, then starts the production server |

For production, run `npm run build && npm start` and open <http://localhost:5000>. Express serves the built files from `client/dist`.

## How the health score works

| Component | Points | Calculation |
| --- | --- | --- |
| Commit activity | 35 | 20 points for commit volume in the last 30 days (40 commits = full marks) plus 15 points for consistency (15 active days = full marks). |
| Issue responsiveness | 35 | Median time to close recently closed issues, on a logarithmic scale. Under a day is near full marks; 30+ days approaches zero. |
| Pull request flow | 30 | Percentage of recently closed pull requests that were merged. |

Scores with no recent data (for example, a repo with no closed PRs) receive **neutral half-credit** rather than a zero, so a quiet but maintained project is not treated as abandoned.

Grades:

- **Excellent** — 85+
- **Good** — 70–84
- **Fair** — 50–69
- **Needs attention** — below 50

The scoring logic lives in `server/health.js`, separated from API calls so it is easy to read and change.

## API

All routes are served by Express.

### `GET /api/repos/:owner/:repo`

Returns everything the dashboard needs in one response:

```json
{
  "repo": {
    "fullName": "facebook/react",
    "stars": 230000,
    "forks": 47000,
    "watchers": 6500,
    "language": "JavaScript",
    "topics": ["react", "javascript"],
    "license": "MIT License"
  },
  "health": {
    "score": 88,
    "grade": "Excellent",
    "tone": "excellent",
    "breakdown": [{ "key": "commits", "points": 32, "max": 35 }]
  },
  "activity": {
    "days": [{ "date": "2026-10-01", "count": 7 }],
    "total": 120,
    "activeDays": 22,
    "capped": true
  },
  "issues": { "open": 800, "closed": 25000, "closedPercent": 96.9, "medianCloseDays": 2.1 },
  "pullRequests": { "merged": 74, "closed": 100, "mergeRate": 74, "medianMergeDays": 1.4 },
  "languages": [{ "name": "JavaScript", "percent": 62.4 }],
  "rateLimit": { "remaining": 4900, "limit": 5000, "resetAt": "..." }
}
```

### `GET /api/top-repos?sort=stars|rising`

Returns the home page grid. `stars` is the most-starred repositories on GitHub; `rising` is repositories created in the last 90 days sorted by stars.

### `GET /api/status`

Returns whether a token is configured and the remaining core/search quota.

## GitHub API details and limits

- Requests are made with Node's built-in `fetch`; no GitHub SDK.
- **Uncached** limits: 60 requests/hour (core) and 10 requests/minute (search) per IP. A token raises core to 5,000/hour and search to 30/minute.
- A dashboard load uses 4 core calls and 2 search calls.
- Results are cached in memory for **10 minutes** (top repositories: 15 minutes), and concurrent identical requests are deduplicated.
- Commit and pull-request endpoints return at most 100 items. The UI marks those values as `100+` / "latest 100 sampled" rather than pretending the number is exact.
- Open issue counts come from the Search API so pull requests are not included (GitHub's `open_issues_count` counts PRs too).
- Issue and PR counts are counts **at the time of the request** and cached with everything else.

If GitHub's quota is exhausted, the app shows a clear error with the reset time instead of a blank page.

## Project structure

```
GitStats/
├── client/
│   ├── src/
│   │   ├── components/      # cards, gauge, charts, skeletons, search
│   │   ├── pages/           # Home, Dashboard
│   │   ├── api.js           # fetch wrapper for the Express API
│   │   ├── format.js        # number/date/language helpers
│   │   ├── parseRepo.js     # accepts owner/repo or a GitHub URL
│   │   ├── App.jsx          # layout + routes
│   │   └── styles.css
│   └── vite.config.js       # dev proxy /api -> :5000
├── server/
│   ├── index.js             # routes, validation, error handling, static serving
│   ├── github.js            # GitHub API client + rate-limit handling
│   ├── stats.js             # combines endpoints into the clean payload
│   ├── health.js            # scoring algorithm
│   └── cache.js             # in-memory TTL cache
├── .env.example
└── package.json             # npm workspaces + dev scripts
```

## Notes for learning

- The backend returns **clean, presentation-ready JSON**; React components never talk to GitHub.
- All state is local component state with `useState` and `useEffect`. There is no Redux or data-fetching library.
- The charts are just SVG elements (`<rect>`, `<circle>`, `<text>`) and one CSS `conic-gradient` donut.
- The route `/repo/:owner/:repo` is shareable and reload-safe because Express falls back to `index.html` in production.
- `GITHUB_API_BASE` in `.env` can point the server at a different API (GitHub Enterprise, or a local mock server) without touching the code.

## Troubleshooting

**"Could not reach the GitStats server"** — make sure `npm run dev` is running and both processes are up. Check the server terminal.

**Rate limit errors** — add `GITHUB_TOKEN` to `.env` and restart, or wait for the reset time shown in the error.

**Search rate limit errors** — the unauthenticated Search API only allows 10 requests/minute. Wait a minute; results are cached after the first success.

**The home page works but the dashboard is slow** — the first load makes six GitHub calls. Subsequent loads within 10 minutes come from the server cache.

**"Could not reach GitHub"** — the Express server needs outbound access to `api.github.com`. On restricted networks, point `GITHUB_API_BASE` in `.env` at a reachable mirror or proxy.
