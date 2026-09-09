"use client";

import { memo, useState, type ReactNode } from "react";
import { ChevronDown, CircleDollarSign, Cpu, Factory, Landmark, LayoutGrid, ShoppingCart, Zap } from "lucide-react";
import { SectorSummary } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/format";
import PortfolioTable from "./PortfolioTable";

const ICON_CLASS = "h-5 w-5";

const SECTOR_ICONS: Record<string, ReactNode> = {
  Financials: <Landmark className={ICON_CLASS} aria-hidden />,
  Technology: <Cpu className={ICON_CLASS} aria-hidden />,
  Consumer: <ShoppingCart className={ICON_CLASS} aria-hidden />,
  Power: <Zap className={ICON_CLASS} aria-hidden />,
  Pipes: <Factory className={ICON_CLASS} aria-hidden />,
  Others: <LayoutGrid className={ICON_CLASS} aria-hidden />,
};
const DEFAULT_SECTOR_ICON = <CircleDollarSign className={ICON_CLASS} aria-hidden />;

function SectorGroup({ sector }: { sector: SectorSummary }) {
  const [expanded, setExpanded] = useState(true);
  const isGain = sector.totalGainLoss >= 0;
  const gainLossPercent = sector.totalInvestment > 0 ? (sector.totalGainLoss / sector.totalInvestment) * 100 : 0;
  const icon = SECTOR_ICONS[sector.sector] ?? DEFAULT_SECTOR_ICON;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            {icon}
          </span>
          <h2 className="text-lg font-semibold text-slate-900">{sector.sector}</h2>
          {sector.hasIncompleteData && (
            <span
              className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
              title="One or more prices in this sector could not be fetched live; totals exclude them."
            >
              partial data
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
          <span>
            Investment: <span className="font-medium text-slate-900">{formatCurrency(sector.totalInvestment)}</span>
          </span>
          <span>
            Present Value:{" "}
            <span className="font-medium text-slate-900">{formatCurrency(sector.totalPresentValue)}</span>
          </span>
          <span>
            Gain/Loss:{" "}
            <span className={`font-medium ${isGain ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(sector.totalGainLoss)} ({formatPercent(gainLossPercent)})
            </span>
          </span>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-slate-100 p-4">
          <PortfolioTable holdings={sector.holdings} />
        </div>
      )}
    </section>
  );
}

function areSectorPropsEqual(prev: { sector: SectorSummary }, next: { sector: SectorSummary }): boolean {
  const a = prev.sector;
  const b = next.sector;
  if (a.holdings.length !== b.holdings.length) return false;
  if (a.totalPresentValue !== b.totalPresentValue || a.totalGainLoss !== b.totalGainLoss) return false;

  return a.holdings.every((holding, index) => {
    const other = b.holdings[index];
    return (
      holding.cmp === other.cmp &&
      holding.peRatio === other.peRatio &&
      holding.latestEarnings === other.latestEarnings &&
      holding.presentValue === other.presentValue &&
      holding.gainLoss === other.gainLoss
    );
  });
}

export default memo(SectorGroup, areSectorPropsEqual);
