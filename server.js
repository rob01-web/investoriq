// server.js — Local + Production API server for InvestorIQ

import express from "express";
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

// Detect environment
const isProd = process.env.NODE_ENV === "production";
console.log("🚀 Environment:", isProd ? "PRODUCTION" : "LOCAL DEVELOPMENT");

// Enable CORS
app.use(cors());

// -------------------------------------------------------
// 1️⃣ Webhook route (RAW BODY) — *only enabled locally*
// -------------------------------------------------------
if (!isProd) {
  console.log("⚡ Webhook ENABLED (local mode)");
  app.post(
    "/api/webhook",
    express.raw({ type: "application/json" }),
    (req, res) => webhookHandler(req, res)
  );
} else {
  console.log("⛔ Webhook DISABLED in production");
}

// -------------------------------------------------------
// 2️⃣ JSON Body Parser — must come AFTER webhook
// -------------------------------------------------------
app.use(express.json({ limit: "10mb" }));

// -------------------------------------------------------
// 3️⃣ Static files (HTML test-checkout etc.)
// -------------------------------------------------------
app.use(express.static(__dirname));

// -------------------------------------------------------
// 4️⃣ API routes
// -------------------------------------------------------

// PDF generator
app.post("/api/generate-client-report", (req, res) =>
  generateClientReport(req, res)
);

// Stripe Checkout
app.post("/api/create-checkout-session", (req, res) =>
  createCheckoutSession(req, res)
);

// -------------------------------------------------------
// 5️⃣ Start server
// -------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 InvestorIQ API running at http://localhost:${PORT}`);
});
