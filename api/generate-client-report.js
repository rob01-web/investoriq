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
    // 1. Parse input JSON
    const data = req.body || {};

    // 2. Load the HTML template
    const templatePath = path.join(
      __dirname,
      "html",
      "sample-report.html"
    );

    let htmlTemplate = fs.readFileSync(templatePath, "utf8");

    // 3. Insert AI-generated narrative pieces (ONLY EXEC SUMMARY for now)
    let finalHtml = htmlTemplate;

    // 🔥 EXEC SUMMARY — FIRST PLACEHOLDER
    finalHtml = finalHtml.replace(
      "{{EXEC_SUMMARY}}",
      data.execSummary || ""
    );

    // (Other placeholders will be added *one at a time* later)

    // 4. Ensure sentence integrity
    const { html: safeHtml, warnings } = ensureSentenceIntegrity(finalHtml, {
      autoFixPunctuation: true,
    });

    if (warnings.length > 0) {
      console.warn("⚠️ Sentence Integrity Warnings:");
      warnings.forEach(w => console.warn(" - " + w));
    }

    // 5. Send to DocRaptor (placeholder for now)
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
