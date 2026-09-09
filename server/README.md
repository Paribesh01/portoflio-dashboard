# Portfolio Dashboard API

Express + TypeScript backend. Resolves each stock's real trading symbol, fetches CMP from Yahoo Finance,
scrapes P/E ratio + EPS from Google Finance, caches everything, and computes investment/present
value/gain-loss/sector totals.

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

Runs on `http://localhost:4000` by default (`PORT` in `.env`). No API keys needed, both sources are public
pages/endpoints.

```bash
npm run build
npm start
```

## Endpoints

- `GET /api/health` - liveness check
- `GET /api/portfolio` - full computed portfolio, holdings grouped by sector with CMP, present value,
  gain/loss, P/E ratio and latest earnings, plus sector and portfolio totals

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | Port this server listens on |
| `CLIENT_ORIGIN` | `http://localhost:3000` | Comma-separated list of origins allowed by CORS |

## Structure

- `src/data/portfolio.json` - the 26 holdings, transcribed from the case study's Excel sheet
- `src/services/yahooFinance.ts` - CMP from Yahoo's unofficial chart endpoint, with symbol resolution for
  BSE codes that don't resolve directly
- `src/services/googleFinance.ts` - P/E ratio and EPS scraped from Google Finance's quote page
- `src/services/cache.ts` - in-memory TTL cache shared by both fetchers
- `src/services/concurrency.ts` - caps parallel requests at 5
- `src/services/portfolio.ts` - joins holdings with live quotes and builds the response
- `src/routes/portfolio.ts`, `src/index.ts` - the Express route and app setup

More on the problems I hit building this in `../TECHNICAL_DOCUMENT.md`.
