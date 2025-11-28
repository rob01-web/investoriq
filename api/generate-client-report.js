// api/generate-client-report.js

import { ensureSentenceIntegrity } from "./lib/sentenceIntegrity.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios"; // DocRaptor

// Convert __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
  try {
    // 1. Parse input JSON (structured)
    // Expected shape:
    // {
    //   sections: {
    //     execSummary: string,
    //     unitValueAdd: string,
    //     cashFlowProjections: string,
    //     neighborhoodAnalysis: string,
    //     riskAssessment: string,
    //     renovationNarrative: string,
    //     debtStructure: string,
    //     dealScoreSummary: string,
    //     dealScoreInterpretation: string,
    //     advancedModelingIntro: string,
    //     dcfInterpretation: string,
    //     finalRecommendation: string
    //   }
    // }
    const body = req.body || {};
    const sections = body.sections || {};

    const getSection = (key) => sections[key] || "";

    // 2. Load the HTML template (SACRED MASTER COPY)
    const templatePath = path.join(__dirname, "html", "sample-report.html");
    let htmlTemplate = fs.readFileSync(templatePath, "utf8");

    // 3. Inject ALL dynamic narrative sections

    let finalHtml = htmlTemplate;

    // 1.0 Executive Summary
    finalHtml = finalHtml.replace(
      "{{EXEC_SUMMARY}}",
      getSection("execSummary")
    );

    // 2.0 Unit-Level Value Add Analysis
    finalHtml = finalHtml.replace(
      "{{UNIT_VALUE_ADD}}",
      getSection("unitValueAdd")
    );

    // 3.0 Scenario Analysis & Five-Year Outlook
    finalHtml = finalHtml.replace(
      "{{CASH_FLOW_PROJECTIONS}}",
      getSection("cashFlowProjections")
    );

    // 4.0 Neighborhood Fundamentals
    finalHtml = finalHtml.replace(
      "{{NEIGHBORHOOD_ANALYSIS}}",
      getSection("neighborhoodAnalysis")
    );

    // 5.0 Risk Scoring & Sensitivities
    finalHtml = finalHtml.replace(
      "{{RISK_ASSESSMENT}}",
      getSection("riskAssessment")
    );

    // 6.0 Renovation Program & ROI
    finalHtml = finalHtml.replace(
      "{{RENOVATION_NARRATIVE}}",
      getSection("renovationNarrative")
    );

    // 7.0 Debt Structure & Financing
    finalHtml = finalHtml.replace(
      "{{DEBT_STRUCTURE}}",
      getSection("debtStructure")
    );

    // 8.0 Deal Scorecard & Radar
    finalHtml = finalHtml.replace(
      "{{DEAL_SCORE_SUMMARY}}",
      getSection("dealScoreSummary")
    );
    finalHtml = finalHtml.replace(
      "{{DEAL_SCORE_INTERPRETATION}}",
      getSection("dealScoreInterpretation")
    );

    // 9.0 Advanced Financial Modeling
    finalHtml = finalHtml.replace(
      "{{ADVANCED_MODELING_INTRO}}",
      getSection("advancedModelingIntro")
    );
    finalHtml = finalHtml.replace(
      "{{DCF_INTERPRETATION}}",
      getSection("dcfInterpretation")
    );

    // 10.0 Final Recommendations
    finalHtml = finalHtml.replace(
      "{{FINAL_RECOMMENDATION}}",
      getSection("finalRecommendation")
    );

    // (Section 11 is static — no placeholders to replace)

    // Optional: log which sections are missing for debugging
    const missingKeys = [
      "execSummary",
      "unitValueAdd",
      "cashFlowProjections",
      "neighborhoodAnalysis",
      "riskAssessment",
      "renovationNarrative",
      "debtStructure",
      "dealScoreSummary",
      "dealScoreInterpretation",
      "advancedModelingIntro",
      "dcfInterpretation",
      "finalRecommendation",
    ].filter((k) => !sections[k]);

    if (missingKeys.length > 0) {
      console.warn("⚠️ Missing narrative sections:", missingKeys.join(", "));
    }

    // 4. Ensure sentence integrity across the full HTML
    const { html: safeHtml, warnings } = ensureSentenceIntegrity(finalHtml, {
      autoFixPunctuation: true,
    });

    if (warnings.length > 0) {
      console.warn("⚠️ Sentence Integrity Warnings:");
      warnings.forEach((w) => console.warn(" - " + w));
    }

    // 5. Send to DocRaptor (STILL IN TEST MODE)
    const pdfResponse = await axios.post(
      "https://docraptor.com/docs",
      {
        test: true, // 🔒 keep true until you're ready to burn real (non-watermark) credits
        document_content: safeHtml,
        name: "InvestorIQ-ClientReport.pdf",
        document_type: "pdf",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            process.env.DOCRAPTOR_API_KEY + ":"
          ).toString("base64")}`,
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
