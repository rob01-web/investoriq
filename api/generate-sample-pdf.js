export const config = {
  runtime: "nodejs",
};

import fs from "fs";
import path from "path";
import https from "https";

export default async function handler(req, res) {
  try {
    // Load HTML file (bundled inside /api/html/)
const filePath = path.join(process.cwd(), "api", "html", "sample-report.html");
const html = fs.readFileSync(filePath, "utf8");

    // DocRaptor payload
    const payload = JSON.stringify({
      test: true,
      name: "sample-report.pdf",
      document_type: "pdf",
      document_content: html,
      javascript: true,
      prince_options: { media: "screen" }
    });

    const options = {
      hostname: "api.docraptor.com",
      port: 443,
      path: "/docs",
      method: "POST",
      auth: `${process.env.DOCRAPTOR_API_KEY}:`,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload)
      }
    };

    // Send request
    const rawResponse = await new Promise((resolve, reject) => {
      const req = https.request(options, (response) => {
        let chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () =>
          resolve({
            buffer: Buffer.concat(chunks),
            status: response.statusCode,
            headers: response.headers,
          })
        );
      });

      req.on("error", reject);
      req.write(payload);
      req.end();
    });

    const { buffer, status } = rawResponse;

    // If response is JSON or XML, it's an error → show readable message
    const text = buffer.toString("utf8");
    if (
      text.trim().startsWith("{") ||
      text.trim().startsWith("<") ||
      status !== 200
    ) {
      res.setHeader("Content-Type", "application/json");
      return res.status(200).send(text);
    }

    // Otherwise return PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="sample-report.pdf"');
    return res.send(buffer);

  } catch (err) {
    console.error("PDF ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
