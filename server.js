// server.js — Local API server for InvestorIQ
import express from "express";
import bodyParser from "body-parser"; // currently unused but fine to keep
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import generateClientReport from "./api/generate-client-report.js";
import createCheckoutSession from "./api/create-checkout-session.js";
import webhookHandler from "./api/webhook.js";

dotenv.config();

const app = express();

// --- Resolve __dirname for ES modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// 🚨 STATIC FILES FIX — serve ONLY the public folder as static assets
app.use(express.static(path.join(__dirname, "public")));

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
