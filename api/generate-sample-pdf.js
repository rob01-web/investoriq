// TEMP DEBUG VERSION

export const config = {
  runtime: 'nodejs',  // ✅ This is correct
};

import fs from "fs";
import path from "path";
import https from "https";

export default async function handler(req, res) {
  try {
    const filePath = path.resolve("./public/reports/sample-report.html");
    const htmlString = fs.readFileSync(filePath, "utf8");

    const payload = JSON.stringify({
      test: true,
      document_content: htmlString,
      name: "debug.pdf",
      document_type: "pdf",
      javascript: true,
      prince_options: { media: "screen" }
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

    const rawResponse = await new Promise((resolve, reject) => {
      const req = https.request(options, (response) => {
        let chunks = [];
        response.on("data", (c) => chunks.push(c));
        response.on("end", () => resolve(Buffer.concat(chunks)));
      });
      req.on("error", reject);
      req.write(payload);
      req.end();
    });

    // ⛔ IMPORTANT: Just return whatever DocRaptor sent.
    const text = rawResponse.toString("utf8");

    // If it's JSON, show JSON. If it's PDF binary, return as PDF.
    if (text.trim().startsWith("{")) {
      res.setHeader("Content-Type", "application/json");
      return res.status(200).send(text);
    }

    // Otherwise assume it's a PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="debug.pdf"');
    res.end(rawResponse);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
