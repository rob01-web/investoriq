// api/generate-sample-pdf.js (ESM Version)
// ----------------------------------------
// InvestorIQ – Sample Report Generator (DocRaptor TEST MODE)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔒 Hard lock: ALWAYS TEST MODE unless manually changed
const TEST_MODE = true;

const DOCRAPTOR_API_KEY = process.env.DOCRAPTOR_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  if (!DOCRAPTOR_API_KEY) {
    return res.status(500).json({
      error:
        "DocRaptor API key not set. Add DOCRAPTOR_API_KEY to Vercel environment.",
    });
  }

  try {
    // Correct absolute path to sample-report.html
    const htmlPath = path.join(__dirname, "html", "sample-report.html");

    if (!fs.existsSync(htmlPath)) {
      console.error("Missing HTML template:", htmlPath);
      return res.status(500).json({
        error: `sample-report.html not found at: ${htmlPath}`,
      });
    }

    const html = fs.readFileSync(htmlPath, "utf8");

    const payload = {
      test: TEST_MODE,
      document_type: "pdf",
      name: "investoriq-sample-report.pdf",
      document_content: html,
      prince_options: { media: "print" },
    };

    const authHeader =
      "Basic " + Buffer.from(`${DOCRAPTOR_API_KEY}:`).toString("base64");

    const response = await fetch("https://docraptor.com/docs", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DocRaptor error:", errorText);
      return res.status(500).json({
        error: "DocRaptor PDF generation failed",
        details: errorText,
      });
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'inline; filename="investoriq-sample-report.pdf"'
    );

    return res.status(200).send(buffer);
  } catch (err) {
    console.error("Unexpected PDF generation error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      details: err.message,
    });
  }
}
