import axios from "axios";
import * as cheerio from "cheerio";
import { Exchange } from "../types";
import { getCached, setCached, getStale } from "./cache";

const CACHE_TTL_MS = 60_000;

function toGoogleSymbol(exchange: Exchange, code: string): string {
  const suffix = exchange === "NSE" ? "NSE" : "BOM";
  return `${code}:${suffix}`;
}

export interface FundamentalsResult {
  peRatio: number | null;
  latestEarnings: number | null;
  error: string | null;
  stale: boolean;
}

function parseStatValue(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export async function fetchFundamentals(exchange: Exchange, code: string): Promise<FundamentalsResult> {
  const symbol = toGoogleSymbol(exchange, code);
  const cacheKey = `google:${symbol}`;

  const cached = getCached<{ peRatio: number | null; latestEarnings: number | null }>(cacheKey);
  if (cached !== undefined) {
    return { ...cached, error: null, stale: false };
  }

  try {
    const url = `https://www.google.com/finance/quote/${symbol}`;
    const { data: html } = await axios.get<string>(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 7000,
    });

    const $ = cheerio.load(html);
    const statRows = $(".KxsRFb");
    if (statRows.length === 0) {
      throw new Error("Google Finance stats panel not found - page markup may have changed");
    }

    let peRatio: number | null = null;
    let latestEarnings: number | null = null;

    statRows.each((_, el) => {
      const label = $(el).find(".SwQK7").first().text().trim().toLowerCase();
      const value = $(el).find(".dO6ijd").first().text().trim();
      if (label.includes("p/e ratio")) {
        peRatio = parseStatValue(value);
      }
      if (label === "eps") {
        latestEarnings = parseStatValue(value);
      }
    });

    const result = { peRatio, latestEarnings };
    setCached(cacheKey, result, CACHE_TTL_MS);
    return { ...result, error: null, stale: false };
  } catch (err) {
    const stale = getStale<{ peRatio: number | null; latestEarnings: number | null }>(cacheKey);
    const message = err instanceof Error ? err.message : "Unknown error fetching fundamentals";
    if (stale !== undefined) {
      return { ...stale, error: message, stale: true };
    }
    return { peRatio: null, latestEarnings: null, error: message, stale: false };
  }
}
