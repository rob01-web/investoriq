export const config = {
  runtime: "nodejs",
};

import fs from "fs";
import path from "path";
import DocRaptor from "docraptor";

export default async function handler(req, res) {
  try {
    // Load HTML
    const filePath = path.join(process.cwd(), "public", "reports", "sample-report.html");
    const htmlString = fs.readFileSync(filePath, "utf8");

    // Create client (new SDK structure)
    const client = new DocRaptor.DocApi();
    client.apiClient.basePath = "https://api.docraptor.com";
    client.apiClient.authentications.api_key.apiKey = process.env.DOCRAPTOR_API_KEY;

    // Create PDF
    const pdfBuffer = await client.createDoc({
      test: false,
      name: "sample-report.pdf",
      document_type: "pdf",
      document_content: htmlString,
      javascript: true,
      prince_options: { media: "screen" }
    });

    // Return PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="sample-report.pdf"');
    return res.send(Buffer.from(pdfBuffer));

  } catch (err) {
    console.error("PDF ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
