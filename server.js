// server.js — Local API server for InvestorIQ
import express from "express";
import bodyParser from "body-parser";
import handler from "./api/generate-client-report.js";

const app = express();
app.use(bodyParser.json({ limit: "10mb" }));

// Connect your route
app.post("/api/generate-client-report", (req, res) => handler(req, res));

app.listen(3000, () => {
  console.log("🚀 InvestorIQ API running at http://localhost:3000");
});
