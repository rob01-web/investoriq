// server.js — Local API server for InvestorIQ
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import handler from "./api/generate-client-report.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// ⭐ Serve static files (HTML test pages, etc.)
app.use(express.static("."));

// Connect your route
app.post("/api/generate-client-report", (req, res) => handler(req, res));

app.listen(3000, () => {
  console.log("🚀 InvestorIQ API running at http://localhost:3000");
});
