import PortfolioDashboard from "@/components/PortfolioDashboard";
import { fetchPortfolio } from "@/lib/api";
import type { PortfolioResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function Home() {
  let initialData: PortfolioResponse | null = null;
  try {
    initialData = await fetchPortfolio();
  } catch (err) {
    console.error("Failed to load initial portfolio data from the API server:", err);
  }

  if (!initialData) {
    return (
      <div className="mx-auto mt-16 max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-700">Couldn&apos;t load the portfolio</p>
        <p className="mt-3 text-sm text-slate-500">Please refresh the page to try again.</p>
      </div>
    );
  }

  return <PortfolioDashboard initialData={initialData} />;
}
