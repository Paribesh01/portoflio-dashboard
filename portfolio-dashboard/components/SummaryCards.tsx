import { PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/format";

interface SummaryCardsProps {
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
}

export default function SummaryCards({ totalInvestment, totalPresentValue, totalGainLoss }: SummaryCardsProps) {
  const gainLossPercent = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0;
  const isGain = totalGainLoss >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Wallet className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-sm text-slate-500">Total Investment</p>
        </div>
        <p className="mt-3 text-2xl font-semibold text-slate-900">{formatCurrency(totalInvestment)}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <PiggyBank className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-sm text-slate-500">Present Value</p>
        </div>
        <p className="mt-3 text-2xl font-semibold text-slate-900">{formatCurrency(totalPresentValue)}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              isGain ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            }`}
          >
            {isGain ? <TrendingUp className="h-5 w-5" aria-hidden /> : <TrendingDown className="h-5 w-5" aria-hidden />}
          </span>
          <p className="text-sm text-slate-500">Overall Gain / Loss</p>
        </div>
        <p className={`mt-3 text-2xl font-semibold ${isGain ? "text-emerald-600" : "text-red-600"}`}>
          {formatCurrency(totalGainLoss)}{" "}
          <span className="text-base font-normal">({formatPercent(gainLossPercent)})</span>
        </p>
      </div>
    </div>
  );
}
