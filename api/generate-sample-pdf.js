export const config = {
  runtime: "nodejs",
};

import fs from "fs";
import path from "path";
import https from "https";

export default async function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), "public", "reports", "sample-report.html");
    const html = fs.readFileSync(filePath, "utf8");

    const payload = JSON.stringify({
      test: true,                          // IMPORTANT: test mode (free)
      name: "sample-report.pdf",
      document_type: "pdf",
      document_content: html,
      javascript: true,
      prince_options: { media: "screen" },
    });

    const options = {
      hostname: "api.docraptor.com",
      port: 443,
      path: "/docs",
      method: "POST",
      auth: `${process.env.DOCRAPTOR_API_KEY}:`,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const rawResponse = await new Promise((resolve, reject) => {
      const req = https.request(options, (response) => {
        let chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve({ 
          buffer: Buffer.concat(chunks),
          status: response.statusCode,
          headers: response.headers
        }));
      });

      req.on("error", reject);
      req.write(payload);
      req.end();
    });

    const { buffer, status } = rawResponse;

    // If response is JSON, it's an error — show it
    const text = buffer.toString("utf8");
    if (text.startsWith("{") || text.startsWith("<")) {
      res.setHeader("Content-Type", "application/json");
      return res.status(200).send(text);
    }

    // Otherwise assume it's a PDF binary
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="sample-report.pdf"');
    return res.send(buffer);

  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
