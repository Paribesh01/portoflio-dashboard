# Portfolio Dashboard Frontend

Next.js + TypeScript + Tailwind frontend. Pure UI, no scraping or data-fetching logic of its own, all of that
is in the Express API in `../server`. This just calls it and renders the result.

## Getting started

Needs the API server running first, see the root `README.md`.

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
npm run lint
```

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000` | Base URL of the Express API |

## Stack

- Next.js 16 (App Router, Turbopack), React 19
- TypeScript
- Tailwind CSS v4
- TanStack Table (`@tanstack/react-table` v8)
- Recharts for the sector Investment vs Present Value chart
- `lucide-react` for icons

## How it works

- `lib/api.ts` - `fetchPortfolio()`, the one place that calls the Express API, used both server-side and
  client-side
- `lib/types.ts`, `lib/format.ts` - response types and currency/percent formatting
- `app/page.tsx` - a server component that fetches on the server for the first paint
- `components/PortfolioDashboard.tsx` - client component that polls the API every 15 seconds after that
- `components/SectorGroup.tsx`, `PortfolioTable.tsx` - the sector sections and holdings table, gain/loss
  colored green/red with an up/down arrow icon so direction isn't color-only
- `components/SectorPerformanceChart.tsx` - the Recharts bar chart comparing Investment vs Present Value

More on the problems I hit building this in `../TECHNICAL_DOCUMENT.md`.
