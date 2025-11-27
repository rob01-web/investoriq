// api/generate-client-report.js
import { ensureSentenceIntegrity } from "./lib/sentenceIntegrity.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// DocRaptor (we will expand this later)
import axios from "axios";

// Convert __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
  try {
    // 1. Parse input JSON (for now use sample JSON)
    const data = req.body || {};

    // 2. Load the HTML template
    const templatePath = path.join(
      __dirname,
      "html",
      "sample-report.html"
    );

    let htmlTemplate = fs.readFileSync(templatePath, "utf8");

    // 3. TODO: Insert AI-generated narrative here
    // For now placeholders:
    const finalHtml = htmlTemplate
      .replace("{{EXEC_SUMMARY}}", "EXEC SUMMARY GOES HERE")
      .replace("{{CASH_FLOW_PROJECTIONS}}", "PROJECTIONS GO HERE");

    // 4. Ensure sentence integrity
    const { html: safeHtml, warnings } = ensureSentenceIntegrity(finalHtml, {
      autoFixPunctuation: true,
    });

    if (warnings.length > 0) {
      console.warn("⚠️ Sentence Integrity Warnings:");
      warnings.forEach(w => console.warn(" - " + w));
    }

    // 5. Send to DocRaptor (placeholder)
    const pdfResponse = await axios.post(
      "https://docraptor.com/docs",
      {
        test: true,
        document_content: safeHtml,
        name: "InvestorIQ-ClientReport.pdf",
        document_type: "pdf",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${Buffer.from(process.env.DOCRAPTOR_API_KEY + ":").toString("base64")}`,
        },
        responseType: "arraybuffer",
      }
    );

    // 6. Return PDF to client
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfResponse.data);

  } catch (err) {
    console.error("❌ Error generating report:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
}
