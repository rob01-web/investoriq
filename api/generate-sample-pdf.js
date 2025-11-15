export const config = {
  runtime: "nodejs",
};

import fs from "fs";
import path from "path";
import DocRaptor from "docraptor";

export default async function handler(req, res) {
  try {
    // Read the sample report HTML file
    const filePath = path.join(process.cwd(), "public", "reports", "sample-report.html");
    const htmlString = fs.readFileSync(filePath, "utf8");

    // Create the client (NOT a constructor!)
    const docraptor = new DocRaptor.DocApi();
    docraptor.apiClient.authentications["api_key"].apiKey = process.env.DOCRAPTOR_API_KEY;

    // Prepare the payload
    const response = await docraptor.createDoc({
      test: false,
      document_content: htmlString,
      name: "sample-report.pdf",
      document_type: "pdf",
      javascript: true,
      prince_options: { media: "screen" },
    });

    // Return PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="sample-report.pdf"');
    return res.send(Buffer.from(response));

  } catch (err) {
    console.error("PDF GEN ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
