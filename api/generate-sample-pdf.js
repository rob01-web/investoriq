// api/generate-sample-pdf.js
//
// InvestorIQ – Sample Report PDF Generator (DocRaptor, TEST MODE ONLY)
// -------------------------------------------------------------------
// This route:
// - Reads the static DocRaptor-compatible HTML template from /api/html/sample-report.html
// - Sends it to DocRaptor with `test: true` to AVOID consuming production credits
// - Streams the resulting PDF back to the client
//
// IMPORTANT:
// - This file is HARD-LOCKED to DocRaptor TEST MODE.
// - To use your ONE production credit later, you will manually flip TEST_MODE to false,
//   redeploy, generate the final PDF once, then flip it back to true.

const fs = require("fs");
const path = require("path");

// 🔒 Hard-locked test mode (safe by default)
const TEST_MODE = true;

const DOCRAPTOR_API_KEY = process.env.DOCRAPTOR_API_KEY;

if (!DOCRAPTOR_API_KEY) {
  console.warn(
    "[InvestorIQ] WARNING: DOCRAPTOR_API_KEY is not set. PDF generation will fail until this is configured."
  );
}

// Helper to read the HTML template
function loadSampleReportHtml() {
  const htmlPath = path.join(
    process.cwd(),
    "api",
    "html",
    "sample-report.html"
  );

  if (!fs.existsSync(htmlPath)) {
    throw new Error(
      `Sample report HTML not found at: ${htmlPath}. Make sure api/html/sample-report.html exists in the repo.`
    );
  }

  return fs.readFileSync(htmlPath, "utf8");
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  if (!DOCRAPTOR_API_KEY) {
    return res.status(500).json({
      error:
        "DocRaptor API key is not configured. Set DOCRAPTOR_API_KEY in your environment.",
    });
  }

  try {
    const html = loadSampleReportHtml();

    const authHeader =
      "Basic " +
      Buffer.from(`${DOCRAPTOR_API_KEY}:`).toString("base64");

    const docRaptorPayload = {
      test: TEST_MODE, // 🔒 always true unless you explicitly change it
      document_type: "pdf",
      name: "investoriq-sample-report.pdf",
      document_content: html,
      prince_options: {
        media: "print",
      },
    };

    const response = await fetch("https://docraptor.com/docs", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(docRaptorPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[InvestorIQ] DocRaptor error:", errorText);
      return res.status(500).json({
        error: "DocRaptor failed to generate PDF",
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
    console.error("[InvestorIQ] PDF generation error:", err);
    return res.status(500).json({
      error: "Unexpected error while generating PDF",
      details: err.message || String(err),
    });
  }
};
