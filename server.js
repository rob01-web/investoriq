// server.js — Local API server for InvestorIQ
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

import generateClientReport from "./api/generate-client-report.js";
import createCheckoutSession from "./api/create-checkout-session.js";
import webhookHandler from "./api/webhook.js";

dotenv.config();

const app = express();

// Enable CORS for all routes
app.use(cors());

// 🚨 MUST come FIRST and MUST NOT be combined with JSON parser
// Stripe requires raw body to validate signatures
app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => webhookHandler(req, res)
);

// 🚨 JSON parser comes AFTER webhook route only
app.use(express.json({ limit: "10mb" }));

// Static assets
app.use(express.static("."));

// PDF generation route
app.post("/api/generate-client-report", (req, res) =>
  generateClientReport(req, res)
);

// Stripe checkout session route
app.post("/api/create-checkout-session", (req, res) =>
  createCheckoutSession(req, res)
);

app.listen(3000, () => {
  console.log("🚀 InvestorIQ API running at http://localhost:3000");
});
