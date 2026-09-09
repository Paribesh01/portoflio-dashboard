import { Router } from "express";
import { getPortfolio } from "../services/portfolio";

export const portfolioRouter = Router();

portfolioRouter.get("/portfolio", async (_req, res) => {
  try {
    const portfolio = await getPortfolio();
    res.json(portfolio);
  } catch (err) {
    console.error("Failed to build portfolio response:", err);
    res.status(500).json({
      error: "Failed to load portfolio data. Please try again shortly.",
    });
  }
});
