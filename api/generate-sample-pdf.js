// /api/generate-sample-pdf.js

import fs from "fs";
import path from "path";
import https from "https";

export default async function handler(req, res) {
  try {
    // 1. Load the exact HTML report file
    const filePath = path.join(process.cwd(), "public/reports/sample-report.html");
    const htmlString = fs.readFileSync(filePath, "utf8");

    // 2. Prepare DocRaptor payload
    const postData = JSON.stringify({
      test: false, // <-- change to false after testing (true = watermark PDF)
      document_content: htmlString,
      name: "sample-report.pdf",
      document_type: "pdf",
      javascript: true, // allow Google Charts
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
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    // 3. Send to DocRaptor
    const docReq = https.request(options, (docRes) => {
      let data = [];

      docRes.on("data", (chunk) => data.push(chunk));
      docRes.on("end", () => {
        const pdfBuffer = Buffer.concat(data);

        // 4. Send PDF to browser
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="sample-report.pdf"`);
        res.end(pdfBuffer);
      });
    });

    docReq.on("error", (e) => {
      console.error("DocRaptor error:", e);
      res.status(500).json({ error: e.message });
    });

    docReq.write(postData);
    docReq.end();

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: err.message });
  }
}
