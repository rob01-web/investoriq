// FINAL FIXED VERSION — DOCUMENT_CONTENT EMPTY ISSUE SOLVED

export const config = {
  runtime: "nodejs",
};

import { promises as fs } from "fs";
import path from "path";
import DocRaptor from "docraptor";

export default async function handler(req, res) {
  try {

    // 🔥 Absolute path — guaranteed to work on Vercel
    const htmlPath = path.join(process.cwd(), "public", "reports", "sample-report.html");

    console.log("Attempting to load:", htmlPath);

    let html = "";
    try {
      html = await fs.readFile(htmlPath, "utf8");
    } catch (err) {
      console.error("FAILED TO READ HTML FILE:", err);
      return res.status(500).json({
        error: "Could not read HTML file.",
        path: htmlPath,
      });
    }

    console.log("HTML LENGTH:", html.length);

    if (!html || html.trim().length < 50) {
      return res.status(500).json({
        error: "HTML file is empty or missing.",
        length: html.length,
        path: htmlPath,
      });
    }

    // Fix any module scripts (DocRaptor can't run them)
    html = html.replace(/<script[^>]*type="module"[^>]*>[\s\S]*?<\/script>/gi, "");

    const docraptor = new DocRaptor({
      apiKey: process.env.DOCRAPTOR_API_KEY,
    });

    const pdf = await docraptor.createDoc({
      test: false,
      document_type: "pdf",
      name: "sample-report.pdf",
      document_content: html,
      javascript: true,
      prince_options: { media: "print" },
    });

    // Return PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="sample-report.pdf"');
    return res.send(Buffer.from(pdf));

  } catch (err) {
    console.error("PDF GENERATION ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
