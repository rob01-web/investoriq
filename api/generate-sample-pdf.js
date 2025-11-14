export const config = {
  runtime: "nodejs",
};

import { promises as fs } from "fs";
import path from "path";
import DocRaptor from "docraptor";

export default async function handler(req, res) {
  try {

    // Load HTML from the public folder
    const htmlPath = path.join(
      process.cwd(),
      "public",
      "reports",
      "sample-report.html"
    );

    console.log("Loading HTML from:", htmlPath);

    let html;
    try {
      html = await fs.readFile(htmlPath, "utf8");
    } catch (readErr) {
      console.error("Failed to read HTML file:", readErr);
      return res.status(500).json({
        error: "HTML file could not be read",
        path: htmlPath,
      });
    }

    console.log("HTML LENGTH:", html.length);

    if (!html || html.trim().length < 50) {
      return res.status(500).json({
        error: "HTML content is empty or too small",
        length: html.length,
        path: htmlPath,
      });
    }

    // Remove unsupported module scripts
    html = html.replace(
      /<script[^>]*type="module"[^>]*>[\s\S]*?<\/script>/gi,
      ""
    );

    const docraptor = new DocRaptor({
      apiKey: process.env.DOCRAPTOR_API_KEY,
    });

    const pdfBuffer = await docraptor.createDoc({
      test: false,
      document_type: "pdf",
      name: "sample-report.pdf",
      document_content: html,
      javascript: true,
      prince_options: {
        media: "print",
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'inline; filename="sample-report.pdf"'
    );
    return res.send(Buffer.from(pdfBuffer));

  } catch (err) {
    console.error("PDF GENERATION ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
