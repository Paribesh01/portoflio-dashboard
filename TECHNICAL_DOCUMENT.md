# Technical Document

Notes on the harder parts of building this and how I dealt with them.

The project is two services: an Express API in `server/` that does all the data fetching, scraping and caching,
and a Next.js frontend in `portfolio-dashboard/` that just calls that API and renders it. I split it this way
because the brief literally lists Next.js as the frontend and Node.js as the backend, so I wanted an actual
separate backend process instead of hiding everything inside Next.js API routes.

## Yahoo Finance symbols aren't as simple as they look

Yahoo has no official API, so I'm hitting the same `/v8/finance/chart/<symbol>` endpoint the yahoo.com site
itself uses. My first attempt just built the symbol as `<code>.NS` for NSE stocks and `<code>.BO` for BSE
stocks, using the exchange code from the portfolio sheet directly.

That broke on several BSE holdings. `532174.BO` (ICICI Bank) came back with "No data found, symbol may be
delisted". Worse, `541557.BO` (Fine Organic Industries) returned a price of 10,603,328,500, which is obviously
garbage for a stock worth a few thousand rupees but still came back as a normal 200 response, so there was
nothing to catch it with a status code check alone.

I fixed this by resolving each holding's actual trading symbol once through Yahoo's `/v1/finance/search`
endpoint (search by company name, prefer the NSE listing if there is one) and caching that result for a day.
The naive `.NS`/`.BO` guess is tried first since it works fine for most NSE stocks, and any price it returns
gets sanity-checked against a plausible range (0 to 1,000,000) before being trusted. See
`server/src/services/yahooFinance.ts`.

One stock, LTIMindtree, still doesn't resolve through either path. Yahoo's search just doesn't have an equity
match for it right now. Rather than fake a number I left it as a visible N/A with the actual error message on
hover.

## Google changed its page layout while I was scraping it

There's no Google Finance API either, so P/E ratio and EPS come from scraping the public quote page with
cheerio. I first wrote the scraper against class names I found by inspecting the page (`.gyFHrc`, `.mfs7Fc`,
`.P6K39c`). It stopped working in the same session because Google now redirects to a redesigned
`/finance/beta/quote/...` page with completely different class names (`.KxsRFb`, `.SwQK7`, `.dO6ijd`).

This is basically the exact fragility the case study warns about, so I split the failure into two cases instead
of treating everything as an error. If the stats panel itself isn't found at all, that's a real scraping
failure and it falls back to the last cached value. If the panel is found but a specific stat (like P/E) isn't
in it, that's treated as legitimately missing data, since some of these companies genuinely have no P/E shown
(negative earnings), and it just shows N/A without an alarming error.

## Rate limits and caching

Hitting two unofficial sources for 26 stocks every 15 seconds with no throttling would get the server blocked
pretty fast. Two things help here. Requests are capped at 5 in flight at a time instead of firing all 26 at
once (`server/src/services/concurrency.ts`). And there's a simple in-memory TTL cache shared by both fetchers:
30s for CMP, 60s for fundamentals, both longer than the 15s poll interval so most client polls get served from
cache. Resolved Yahoo symbols get cached for a full day since they basically never change. If a live fetch
fails, the last cached value is returned instead of leaving the field blank, with a small stale indicator in
the UI.

## A failed price shouldn't blank the whole portfolio total

I originally had sector and portfolio totals go to null if even one holding's price fetch failed, figuring an
incomplete sum was wrong to show. In practice this meant the one flaky LTIMindtree stock permanently zeroed out
every total on the dashboard, which is worse than just showing a slightly incomplete number.

Now totals only sum the holdings that actually have a live price, and a `hasIncompleteData` flag tells the UI
to show a small "partial data" badge and a banner explaining why. Much more useful under exactly the kind of
partial failure these unofficial sources are going to produce.

## CORS and keeping two type files in sync

Splitting into two processes on different ports means the 15-second polling requests from the browser are
cross-origin, so Express needs `cors()` configured with the frontend's origin. `CLIENT_ORIGIN` is a
comma-separated env var so a deployed frontend can be added without touching code.

The other tradeoff of two codebases is that the response shape lives in two places:
`server/src/types/index.ts` and `portfolio-dashboard/lib/types.ts`. Nothing enforces they match. For a bigger
project I'd pull that into a shared package, but for this size I just kept both files small and checked them by
hand whenever the response shape changed.

## Server/client split and a hydration bug

`app/page.tsx` is a server component that calls the API directly on first render so the page loads with real
data instead of a spinner. Then `PortfolioDashboard.tsx` takes over on the client and polls the same endpoint
every 15 seconds.

This produced a hydration mismatch on the "last updated" timestamp. `toLocaleTimeString()` formats AM/PM
differently between Node's server-side ICU data and the browser (I saw "3:13:50 PM" on the server vs
"3:13:50 pm" on the client), and React flags that as an error since the server and client HTML don't match.
The fix is `suppressHydrationWarning` on just that span, which is what React's own docs recommend for exactly
this kind of locale-dependent text, rather than pushing the value into client-only state.

## Memoization actually needs to compare values, not just wrap in memo

Every 15s poll parses a brand new JSON object, so wrapping `SectorGroup` in `React.memo` on its own does
nothing, the `sector` prop is a new reference every time even when nothing in it changed. Since the cache TTLs
are longer than the poll interval, a lot of consecutive polls do carry identical numbers though. So
`SectorGroup` uses a custom comparator that checks the actual CMP/P-E/present-value/gain-loss fields instead of
relying on reference equality, so unchanged sectors really do skip re-rendering.

## Picking chart colors properly instead of eyeballing them

For the Investment vs Present Value bar chart I wanted two colors that stay distinguishable for colorblind
users too, not just look fine to me. Instead of guessing, I ran the two candidates (blue `#2a78d6`, orange
`#eb6834`) through a palette checker that tests lightness, chroma, simulated colorblind separation and contrast
against the white chart background. Both passed comfortably. The chart still has a legend so nobody has to rely
on matching colors by eye.

## A responsive bug that turned out not to be a bug

While testing at a 390px mobile width, a screenshot tool showed text cut off mid-word and cards missing their
right border, which looked exactly like a horizontal overflow issue. Instead of guessing at CSS fixes, I
checked the actual page directly through Chrome DevTools Protocol: `document.documentElement.scrollWidth` and
`clientWidth` were identical, meaning there was no horizontal scroll at all. A screenshot taken through the
same protocol on the same loaded page came out completely normal. The CLI screenshot tool had just captured a
frame before the page finished settling. Good reminder to trust what the browser reports about its own layout
over a one-off screenshot. I kept the `min-w-0` classes I'd added on a couple of flex rows during the
investigation anyway since they're correct regardless (a flex item defaults to `min-width: auto`, which can
force real overflow for longer content like a longer error message).

## Deployment latency

Cold requests (empty cache) to `/api/portfolio` typically take 7-9 seconds since it's resolving/fetching 26
stocks from two unofficial sources, with occasional spikes past 20s if Yahoo or Google are slow to respond.
That's fine for a long-running Node process but is a real risk on serverless platforms with short function
timeouts, so I deploy the Express server as a persistent process (Render) rather than as a serverless function,
and added `maxDuration` on the Next.js page plus a client-side fetch timeout so a genuinely slow scrape fails
into the existing error UI instead of hanging indefinitely.

## Known limitations

Both Yahoo and Google can rate-limit, block, or change their page structure without notice, that's inherent to
scraping unofficial sources and caching only reduces the blast radius, it doesn't remove it. The cache is
in-memory per process, so a multi-instance deployment would need something like Redis to share it. Scraped
fundamentals can lag behind other sources since Google recomputes its own stats panel on its own schedule.
Running two services also means `CLIENT_ORIGIN` and `NEXT_PUBLIC_API_BASE_URL` both need updating by hand when
deploying, there's no single step that wires that up.
