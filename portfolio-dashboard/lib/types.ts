export type Exchange = "NSE" | "BSE";

export interface HoldingSeed {
  name: string;
  sector: string;
  exchange: Exchange;
  code: string;
  purchasePrice: number;
  qty: number;
}

export interface LiveQuote {
  cmp: number | null;
  cmpError: string | null;
  cmpStale: boolean;
  peRatio: number | null;
  latestEarnings: number | null;
  fundamentalsError: string | null;
  fundamentalsStale: boolean;
}

export interface Holding extends HoldingSeed, LiveQuote {
  investment: number;
  portfolioPercent: number;
  presentValue: number | null;
  gainLoss: number | null;
  gainLossPercent: number | null;
}

export interface SectorSummary {
  sector: string;
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
  hasIncompleteData: boolean;
  holdings: Holding[];
}

export interface PortfolioResponse {
  updatedAt: string;
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
  hasIncompleteData: boolean;
  sectors: SectorSummary[];
}
