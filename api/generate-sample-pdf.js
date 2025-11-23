// api/generate-sample-pdf.js (Vercel + DocRaptor + Public HTML Fetch)
// InvestorIQ – Sample Report Generator (DocRaptor TEST MODE)

const TEST_MODE = true;

const PUBLIC_HTML_URL =
  "https://investoriq.tech/reports/sample-report.html";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  const DOCRAPTOR_API_KEY = process.env.DOCRAPTOR_API_KEY;
  if (!DOCRAPTOR_API_KEY) {
    return res.status(500).json({
      error:
        "DocRaptor API key not set. Add DOCRAPTOR_API_KEY to Vercel environment.",
    });
  }

  try {
    // 🔥 Step 1 — Load HTML from public URL
    const htmlResponse = await fetch(PUBLIC_HTML_URL);

    if (!htmlResponse.ok) {
      const error = await htmlResponse.text();
      console.error("Failed to fetch public HTML:", error);
      return res.status(500).json({
        error: "Failed to load HTML from public URL",
        details: error,
      });
    }

    const html = await htmlResponse.text();

    // 🔥 Step 2 — Prepare DocRaptor payload
    const payload = {
      test: TEST_MODE,
      document_type: "pdf",
      name: "investoriq-sample-report.pdf",
      document_content: html,
      prince_options: { media: "print" },
    };

    // 🔐 Step 3 — Auth header
    const authHeader =
      "Basic " + Buffer.from(`${DOCRAPTOR_API_KEY}:`).toString("base64");

    // 🔥 Step 4 — DocRaptor request
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

    // 🔥 Step 5 — Return final PDF
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
