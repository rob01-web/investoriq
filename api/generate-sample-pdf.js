// api/generate-sample-pdf.js
// InvestorIQ – Sample Report Generator (Public HTML → DocRaptor)

import { ensureSentenceIntegrity } from "./lib/sentenceIntegrity.js";

const TEST_MODE = true;
const PUBLIC_HTML_URL = "https://investoriq.tech/reports/sample-report.html";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  const DOCRAPTOR_API_KEY = process.env.DOCRAPTOR_API_KEY;
  if (!DOCRAPTOR_API_KEY) {
    return res.status(500).json({
      error: "DocRaptor API key not set."
    });
  }

  try {
    // 🔥 Load HTML directly from public URL
    const htmlResponse = await fetch(PUBLIC_HTML_URL);

    if (!htmlResponse.ok) {
      const err = await htmlResponse.text();
      return res.status(500).json({
        error: "Failed to load HTML from public URL",
        details: err
      });
    }

    const html = await htmlResponse.text();

    // DocRaptor payload
    const payload = {
      test: TEST_MODE,
      document_type: "pdf",
      name: "investoriq-sample-report.pdf",
      document_content: html,
      prince_options: { media: "print" }
    };

    // Auth
    const authHeader =
      "Basic " + Buffer.from(`${DOCRAPTOR_API_KEY}:`).toString("base64");

    // Send to DocRaptor
    const response = await fetch("https://docraptor.com/docs", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({
        error: "DocRaptor PDF generation failed",
        details: errorText
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
    return res.status(500).json({
      error: "Internal Server Error",
      details: err.message
    });
  }
}
