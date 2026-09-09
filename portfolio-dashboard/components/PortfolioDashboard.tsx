"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutDashboard, RefreshCw, TriangleAlert } from "lucide-react";
import { PortfolioResponse } from "@/lib/types";
import { fetchPortfolio } from "@/lib/api";
import SummaryCards from "./SummaryCards";
import SectorGroup from "./SectorGroup";
import SectorPerformanceChart from "./SectorPerformanceChart";

const REFRESH_INTERVAL_MS = 15_000;

export default function PortfolioDashboard({ initialData }: { initialData: PortfolioResponse }) {
  const [portfolio, setPortfolio] = useState<PortfolioResponse>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchPortfolio();
      setPortfolio(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load portfolio data";
      setError(message);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const intervalId = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [refresh]);

  return (
    <div className="min-h-screen">
      <div className="border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                <LayoutDashboard className="h-6 w-6" aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-white sm:text-2xl">Portfolio Dashboard</h1>
                <p className="text-sm text-blue-100">Live CMP from Yahoo Finance · P/E &amp; earnings from Google Finance</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span>
                  Updated{" "}
                  <span suppressHydrationWarning>{new Date(portfolio.updatedAt).toLocaleTimeString()}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={refresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span className="min-w-0">Last refresh failed ({error}). Showing the most recently loaded data.</span>
          </div>
        )}

        {portfolio.hasIncompleteData && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span className="min-w-0">
              Some prices couldn&apos;t be fetched live right now (unofficial data sources can rate-limit or
              change without notice). Totals below reflect only the holdings with a current price.
            </span>
          </div>
        )}

        <SummaryCards
          totalInvestment={portfolio.totalInvestment}
          totalPresentValue={portfolio.totalPresentValue}
          totalGainLoss={portfolio.totalGainLoss}
        />

        <SectorPerformanceChart sectors={portfolio.sectors} />

        <div className="space-y-4">
          {portfolio.sectors.map((sector) => (
            <SectorGroup key={sector.sector} sector={sector} />
          ))}
        </div>
      </div>
    </div>
  );
}
