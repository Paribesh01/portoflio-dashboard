import "dotenv/config";
import express from "express";
import cors from "cors";
import { portfolioRouter } from "./routes/portfolio";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({ origin: CLIENT_ORIGINS }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", portfolioRouter);

app.listen(PORT, () => {
  console.log(`Portfolio dashboard API listening on http://localhost:${PORT}`);
});
