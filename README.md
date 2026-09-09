# Portfolio Dashboard

Portfolio dashboard for the Octa Byte AI full-stack intern case study. Shows a 26-stock portfolio across 6
sectors with live CMP from Yahoo Finance and P/E ratio + latest EPS from Google Finance, refreshing every 15
seconds.

Two separate services:

- `server/` - Express + TypeScript API. Resolves stock symbols, scrapes Yahoo/Google Finance, caches results,
  and computes investment/gain-loss/sector totals. One endpoint: `GET /api/portfolio`.
- `portfolio-dashboard/` - Next.js + TypeScript + Tailwind frontend. Calls the Express API and renders the
  table, sector grouping and chart. No scraping logic of its own.

## Running it locally

Two terminals:

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

```bash
cd portfolio-dashboard
npm install
cp .env.local.example .env.local
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). No API keys needed, both sources are public
endpoints scraped by the Express server.

## Deploying (Vercel + Render)

Deploy the backend first, since the frontend needs its URL at build time.

**1. Backend on Render**

- New Web Service, point it at this repo, root directory `server` (or just use the included `render.yaml`
  blueprint at the repo root: Render will pick up the build/start commands and health check automatically).
- Set the `CLIENT_ORIGIN` env var once you know the Vercel URL (step 2). Leave it as `http://localhost:3000`
  for the first deploy if you don't have it yet, just come back and update it after.
- Render sets `PORT` itself; the server already reads `process.env.PORT`, nothing to configure there.
- Note the deployed URL, something like `https://portfolio-dashboard-api.onrender.com`.

**2. Frontend on Vercel**

- New Project, point it at this repo, set **Root Directory** to `portfolio-dashboard` in the project settings.
- Add the env var `NEXT_PUBLIC_API_BASE_URL` = your Render URL from step 1. This has to be set before the
  build since Next.js inlines `NEXT_PUBLIC_*` vars at build time, not at runtime.
- Deploy. Note the Vercel URL.

**3. Go back and update `CLIENT_ORIGIN`** on Render to the real Vercel URL, then redeploy the backend so CORS
allows requests from it (it's read once at process startup, so a running instance won't pick up the change
until it restarts).

A couple of things worth knowing before you deploy:

- Render's free tier spins the service down after inactivity, so the first request after a while can take
  30-60 seconds just to wake up, on top of the 7-9 second cold scrape time below. Not a bug, just how the free
  tier works.
- The `/api/portfolio` endpoint takes 7-9 seconds on a cold cache since it's fetching 26 stocks from two
  unofficial sources, occasionally more if Yahoo or Google are slow. That's why the backend runs as a normal
  persistent process rather than a serverless function, and why the frontend page has `maxDuration = 60` and a
  45s fetch timeout set.

## Layout

```
byte/
├── server/                  Express API
│   └── src/
│       ├── data/portfolio.json
│       ├── services/
│       ├── routes/portfolio.ts
│       └── index.ts
├── portfolio-dashboard/     Next.js frontend
│   ├── app/
│   ├── components/
│   └── lib/
├── render.yaml
└── TECHNICAL_DOCUMENT.md
```

More detail in `server/README.md` and `portfolio-dashboard/README.md`. `TECHNICAL_DOCUMENT.md` covers the
harder problems I ran into and how I solved them.
