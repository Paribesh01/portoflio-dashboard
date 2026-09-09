"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import { SectorSummary } from "@/lib/types";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";

const COLOR_INVESTMENT = "#2a78d6";
const COLOR_PRESENT_VALUE = "#eb6834";
const TEXT_SECONDARY = "#52514e";
const GRIDLINE = "#e1e0d9";

interface ChartDatum {
  sector: string;
  totalInvestment: number;
  totalPresentValue: number;
}

function CustomTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-slate-900">{label}</p>
      {payload.map((entry) => (
        <p key={String(entry.dataKey ?? entry.name)} className="flex items-center gap-2 text-slate-600">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-medium text-slate-900">{formatCurrency(Number(entry.value))}</span>
        </p>
      ))}
    </div>
  );
}

export default function SectorPerformanceChart({ sectors }: { sectors: SectorSummary[] }) {
  const data: ChartDatum[] = sectors.map((s) => ({
    sector: s.sector,
    totalInvestment: s.totalInvestment,
    totalPresentValue: s.totalPresentValue,
  }));

  const height = Math.max(240, data.length * 64);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Investment vs Present Value by Sector</h2>
      <p className="mt-0.5 text-sm text-slate-500">Where the portfolio is allocated, and how it&apos;s performing.</p>
      <ResponsiveContainer width="100%" height={height} className="mt-2">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 0, left: 0 }} barGap={4} barCategoryGap="28%">
          <CartesianGrid horizontal={false} stroke={GRIDLINE} />
          <XAxis
            type="number"
            tickFormatter={(value) => formatCurrencyCompact(value)}
            tick={{ fill: TEXT_SECONDARY, fontSize: 12 }}
            axisLine={{ stroke: GRIDLINE }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="sector"
            width={90}
            tick={{ fill: TEXT_SECONDARY, fontSize: 13 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={CustomTooltip} cursor={{ fill: "#f8fafc" }} />
          <Legend
            verticalAlign="top"
            align="right"
            height={32}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 13, color: TEXT_SECONDARY }}
          />
          <Bar dataKey="totalInvestment" name="Investment" fill={COLOR_INVESTMENT} radius={[0, 4, 4, 0]} maxBarSize={22} />
          <Bar
            dataKey="totalPresentValue"
            name="Present Value"
            fill={COLOR_PRESENT_VALUE}
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
