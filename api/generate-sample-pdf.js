// Force Node.js runtime (NOT edge)
export const config = {
  runtime: "nodejs"
};

import fs from "fs";
import path from "path";
import https from "https";

export default async function handler(req, res) {
  try {
    // Load local HTML template
    const filePath = path.resolve("./public/reports/sample-report.html");
    const htmlString = fs.readFileSync(filePath, "utf8");

    // Prepare DocRaptor payload
    const payload = JSON.stringify({
      test: false, // change to false when doing final production PDF
      document_content: htmlString,
      name: "sample-report.pdf",
      document_type: "pdf",
      javascript: true,
      prince_options: {
        media: "screen"
      }
    });

    const options = {
      hostname: "api.docraptor.com",
      port: 443,
      path: "/docs",
      method: "POST",
      auth: process.env.DOCRAPTOR_API_KEY + ":",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload)
      }
    };

    // Send request to DocRaptor using Promise wrapper
    const pdfBuffer = await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
        let chunks = [];

        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const buffer = Buffer.concat(chunks);

          // Check for DocRaptor error response
          const text = buffer.toString();
          if (text.startsWith("{")) {
  console.error("❌ DocRaptor returned non-PDF payload:", text);
  return reject(new Error("DocRaptor returned an error response. See logs."));
}


          resolve(buffer);
        });
      });

      request.on("error", reject);
      request.write(payload);
      request.end();
    });

    // Send PDF to browser
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="sample-report.pdf"');
    res.end(pdfBuffer);

  } catch (err) {
    console.error("PDF generation failed:", err);
    res.status(500).json({ error: err.message });
  }
}
