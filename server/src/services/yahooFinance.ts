import axios from "axios";
import { Exchange } from "../types";
import { getCached, setCached, getStale } from "./cache";

const PRICE_CACHE_TTL_MS = 30_000;
const SYMBOL_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const USER_AGENT = "Mozilla/5.0 (compatible; PortfolioDashboard/1.0)";

function naiveSymbol(exchange: Exchange, code: string): string {
  return exchange === "NSE" ? `${code}.NS` : `${code}.BO`;
}

function isPlausibleIndianEquityPrice(price: number): boolean {
  return Number.isFinite(price) && price > 0 && price < 1_000_000;
}

interface YahooSearchQuote {
  symbol: string;
  exchange: string;
  quoteType: string;
}

async function resolveSymbol(name: string, exchange: Exchange): Promise<string | null> {
  try {
    const { data } = await axios.get("https://query2.finance.yahoo.com/v1/finance/search", {
      params: { q: name, quotesCount: 8, newsCount: 0 },
      headers: { "User-Agent": USER_AGENT },
      timeout: 5000,
    });

    const quotes: YahooSearchQuote[] = data?.quotes ?? [];
    const equities = quotes.filter((q) => q.quoteType === "EQUITY");

    const preferredExchangeCode = exchange === "NSE" ? "NSI" : "BSE";
    const preferred = equities.find((q) => q.exchange === preferredExchangeCode);
    const anyIndian = equities.find((q) => q.exchange === "NSI" || q.exchange === "BSE");

    return preferred?.symbol ?? anyIndian?.symbol ?? equities[0]?.symbol ?? null;
  } catch {
    return null;
  }
}

async function fetchRegularMarketPrice(symbol: string): Promise<number | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
  const { data } = await axios.get(url, {
    params: { interval: "1d", range: "1d" },
    headers: { "User-Agent": USER_AGENT },
    timeout: 5000,
  });

  const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
  return typeof price === "number" && isPlausibleIndianEquityPrice(price) ? price : null;
}

async function getWorkingSymbol(name: string, exchange: Exchange, code: string): Promise<string> {
  const symbolCacheKey = `yahoo-symbol:${exchange}:${code}`;
  const cachedSymbol = getCached<string>(symbolCacheKey);
  if (cachedSymbol) return cachedSymbol;

  const guess = naiveSymbol(exchange, code);
  try {
    if ((await fetchRegularMarketPrice(guess)) !== null) {
      setCached(symbolCacheKey, guess, SYMBOL_CACHE_TTL_MS);
      return guess;
    }
  } catch {
  }

  const resolved = await resolveSymbol(name, exchange);
  const workingSymbol = resolved ?? guess;
  setCached(symbolCacheKey, workingSymbol, SYMBOL_CACHE_TTL_MS);
  return workingSymbol;
}

export interface CmpResult {
  cmp: number | null;
  error: string | null;
  stale: boolean;
}

export async function fetchCmp(name: string, exchange: Exchange, code: string): Promise<CmpResult> {
  const priceCacheKey = `yahoo-price:${exchange}:${code}`;

  const cached = getCached<number>(priceCacheKey);
  if (cached !== undefined) {
    return { cmp: cached, error: null, stale: false };
  }

  try {
    const symbol = await getWorkingSymbol(name, exchange, code);
    const price = await fetchRegularMarketPrice(symbol);
    if (price === null) {
      throw new Error(`No usable price returned by Yahoo Finance for resolved symbol "${symbol}"`);
    }

    setCached(priceCacheKey, price, PRICE_CACHE_TTL_MS);
    return { cmp: price, error: null, stale: false };
  } catch (err) {
    const stale = getStale<number>(priceCacheKey);
    const message = err instanceof Error ? err.message : "Unknown error fetching CMP";
    if (stale !== undefined) {
      return { cmp: stale, error: message, stale: true };
    }
    return { cmp: null, error: message, stale: false };
  }
}
