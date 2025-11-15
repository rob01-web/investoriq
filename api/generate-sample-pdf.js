export const config = {
  runtime: "nodejs",
};

import fs from "fs";
import path from "path";
import https from "https";

export default async function handler(req, res) {
  try {
    // Read your HTML file
    const filePath = path.join(process.cwd(), "public", "reports", "sample-report.html");
    const html = fs.readFileSync(filePath, "utf8");

    // Create the JSON payload for DocRaptor
    const payload = JSON.stringify({
      test: false,
      name: "sample-report.pdf",
      document_type: "pdf",
      document_content: html,
      javascript: true,
      prince_options: { media: "screen" },
    });

    // HTTPS request options
    const options = {
      hostname: "api.docraptor.com",
      port: 443,
      path: "/docs",
      method: "POST",
      auth: `${process.env.DOCRAPTOR_API_KEY}:`, // <-- API KEY!
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    // Make the HTTPS request
    const pdfBuffer = await new Promise((resolve, reject) => {
      const req = https.request(options, (response) => {
        let chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
      });

      req.on("error", reject);
      req.write(payload);
      req.end();
    });

    // Send PDF back to browser
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="sample-report.pdf"');
    res.send(pdfBuffer);

  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
