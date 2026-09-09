import holdingsSeed from "../data/portfolio.json";
import { Holding, HoldingSeed, PortfolioResponse, SectorSummary } from "../types";
import { fetchCmp } from "./yahooFinance";
import { fetchFundamentals } from "./googleFinance";
import { runWithConcurrencyLimit } from "./concurrency";

const MAX_PARALLEL_REQUESTS = 5;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

async function buildHolding(seed: HoldingSeed, totalInvestment: number): Promise<Holding> {
  const investment = seed.purchasePrice * seed.qty;

  const [cmpResult, fundamentalsResult] = await Promise.all([
    fetchCmp(seed.name, seed.exchange, seed.code),
    fetchFundamentals(seed.exchange, seed.code),
  ]);

  const presentValue = cmpResult.cmp !== null ? round2(cmpResult.cmp * seed.qty) : null;
  const gainLoss = presentValue !== null ? round2(presentValue - investment) : null;
  const gainLossPercent = presentValue !== null && investment > 0 ? round2((gainLoss! / investment) * 100) : null;

  return {
    ...seed,
    investment,
    portfolioPercent: round2((investment / totalInvestment) * 100),
    cmp: cmpResult.cmp,
    cmpError: cmpResult.error,
    cmpStale: cmpResult.stale,
    presentValue,
    gainLoss,
    gainLossPercent,
    peRatio: fundamentalsResult.peRatio,
    latestEarnings: fundamentalsResult.latestEarnings,
    fundamentalsError: fundamentalsResult.error,
    fundamentalsStale: fundamentalsResult.stale,
  };
}

function groupBySector(holdings: Holding[]): SectorSummary[] {
  const bySector = new Map<string, Holding[]>();
  for (const holding of holdings) {
    const list = bySector.get(holding.sector) ?? [];
    list.push(holding);
    bySector.set(holding.sector, list);
  }

  return Array.from(bySector.entries()).map(([sector, sectorHoldings]) => {
    const totalInvestment = sectorHoldings.reduce((sum, h) => sum + h.investment, 0);
    const pricedHoldings = sectorHoldings.filter((h) => h.presentValue !== null);
    const totalPresentValue = round2(pricedHoldings.reduce((sum, h) => sum + (h.presentValue ?? 0), 0));
    const investmentOfPriced = pricedHoldings.reduce((sum, h) => sum + h.investment, 0);
    const totalGainLoss = round2(totalPresentValue - investmentOfPriced);
    const hasIncompleteData = pricedHoldings.length !== sectorHoldings.length;

    return { sector, totalInvestment, totalPresentValue, totalGainLoss, hasIncompleteData, holdings: sectorHoldings };
  });
}

export async function getPortfolio(): Promise<PortfolioResponse> {
  const seeds = holdingsSeed as HoldingSeed[];
  const totalInvestment = seeds.reduce((sum, s) => sum + s.purchasePrice * s.qty, 0);

  const holdings = await runWithConcurrencyLimit(seeds, MAX_PARALLEL_REQUESTS, (seed) =>
    buildHolding(seed, totalInvestment)
  );

  const sectors = groupBySector(holdings);
  const totalPresentValue = round2(sectors.reduce((sum, s) => sum + s.totalPresentValue, 0));
  const investmentOfPriced = holdings
    .filter((h) => h.presentValue !== null)
    .reduce((sum, h) => sum + h.investment, 0);
  const totalGainLoss = round2(totalPresentValue - investmentOfPriced);
  const hasIncompleteData = sectors.some((s) => s.hasIncompleteData);

  return {
    updatedAt: new Date().toISOString(),
    totalInvestment,
    totalPresentValue,
    totalGainLoss,
    hasIncompleteData,
    sectors,
  };
}
