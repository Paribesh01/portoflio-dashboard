"use client";

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowDownRight, ArrowUpRight, CircleAlert } from "lucide-react";
import { Holding } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

const columnHelper = createColumnHelper<Holding>();

function GainLossCell({ value, percent }: { value: number | null; percent: number | null }) {
  if (value === null) return <span className="text-slate-400">—</span>;
  const isGain = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 ${isGain ? "text-emerald-600" : "text-red-600"}`}>
      {isGain ? <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden /> : <ArrowDownRight className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      {formatCurrency(value)}
      {percent !== null && <span className="text-xs">({formatPercent(percent)})</span>}
    </span>
  );
}

function CmpCell({ holding }: { holding: Holding }) {
  if (holding.cmp === null) {
    return (
      <span className="inline-flex items-center gap-1 text-slate-400" title={holding.cmpError ?? undefined}>
        <CircleAlert className="h-3.5 w-3.5" aria-hidden />
        N/A
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1"
      title={holding.cmpStale ? `Live fetch failed, showing last known price. ${holding.cmpError ?? ""}` : undefined}
    >
      {formatCurrency(holding.cmp)}
      {holding.cmpStale && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Stale price" />}
    </span>
  );
}

function FundamentalCell({ value, holding, digits = 2 }: { value: number | null; holding: Holding; digits?: number }) {
  if (value === null) {
    return (
      <span className="text-slate-400" title={holding.fundamentalsError ?? "Not available"}>
        N/A
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1" title={holding.fundamentalsStale ? "Showing last known value" : undefined}>
      {formatNumber(value, digits)}
      {holding.fundamentalsStale && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Stale value" />}
    </span>
  );
}

const columns = [
  columnHelper.accessor("name", {
    header: "Particulars",
    cell: (info) => <span className="font-medium text-slate-900">{info.getValue()}</span>,
  }),
  columnHelper.accessor("exchange", {
    header: "NSE/BSE",
    cell: (info) => (
      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
        {info.getValue()}: {info.row.original.code}
      </span>
    ),
  }),
  columnHelper.accessor("purchasePrice", {
    header: "Purchase Price",
    cell: (info) => formatCurrency(info.getValue()),
  }),
  columnHelper.accessor("qty", {
    header: "Qty",
  }),
  columnHelper.accessor("investment", {
    header: "Investment",
    cell: (info) => formatCurrency(info.getValue()),
  }),
  columnHelper.accessor("portfolioPercent", {
    header: "Portfolio %",
    cell: (info) => formatPercent(info.getValue()),
  }),
  columnHelper.accessor("cmp", {
    header: "CMP",
    cell: (info) => <CmpCell holding={info.row.original} />,
  }),
  columnHelper.accessor("presentValue", {
    header: "Present Value",
    cell: (info) => formatCurrency(info.getValue()),
  }),
  columnHelper.accessor("gainLoss", {
    header: "Gain/Loss",
    cell: (info) => <GainLossCell value={info.getValue()} percent={info.row.original.gainLossPercent} />,
  }),
  columnHelper.accessor("peRatio", {
    header: "P/E Ratio",
    cell: (info) => <FundamentalCell value={info.getValue()} holding={info.row.original} />,
  }),
  columnHelper.accessor("latestEarnings", {
    header: "Latest Earnings (EPS)",
    cell: (info) => <FundamentalCell value={info.getValue()} holding={info.row.original} />,
  }),
];

export default function PortfolioTable({ holdings }: { holdings: Holding[] }) {
  const table = useReactTable({
    data: holdings,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="max-h-[420px] overflow-auto rounded-lg border border-slate-100">
      <table className="w-full min-w-[960px] border-collapse text-sm [font-variant-numeric:tabular-nums]">
        <thead className="sticky top-0 z-10 bg-slate-50">
          <tr className="text-left text-slate-500">
            {table.getFlatHeaders().map((header) => (
              <th key={header.id} className="whitespace-nowrap border-b border-slate-200 px-3 py-2 font-medium">
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, index) => (
            <tr
              key={row.id}
              className={`border-b border-slate-100 last:border-b-0 hover:bg-blue-50/40 ${
                index % 2 === 1 ? "bg-slate-50/60" : "bg-white"
              }`}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="whitespace-nowrap px-3 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
