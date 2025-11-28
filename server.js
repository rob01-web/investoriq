// server.js — Local API server for InvestorIQ
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import handler from "./api/generate-client-report.js";

console.log("Loaded key:", process.env.DOCRAPTOR_API_KEY);

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// Connect your route
app.post("/api/generate-client-report", (req, res) => handler(req, res));

app.listen(3000, () => {
  console.log("🚀 InvestorIQ API running at http://localhost:3000");
});
