export const config = {
  runtime: "nodejs",
};

import fs from "fs";
import path from "path";
import https from "https";
import { generateAllCharts } from "./lib/generateCharts.js";

export default async function handler(req, res) {
  try {
    // 1) Generate /public/charts/*.png at 5× quality
    await generateAllCharts();

    // 2) Load HTML template (already points to /charts/*.png)
    const filePath = path.join(
      process.cwd(),
      "api",
      "html",
      "sample-report.html"
    );
    const html = fs.readFileSync(filePath, "utf8");

    // 3) DocRaptor payload (PRODUCTION mode, no JS needed)
    const payload = JSON.stringify({
      test: false, // set true if you want the "test" watermark
      name: "sample-report.pdf",
      document_type: "pdf",
      document_content: html,
      javascript: false, // charts are static images now
      prince_options: {
        media: "print",
        dpi: 300, // crisp print quality
      },
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

    // 4) Send request to DocRaptor
    const rawResponse = await new Promise((resolve, reject) => {
      const reqApi = https.request(options, (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () =>
          resolve({
            buffer: Buffer.concat(chunks),
            status: response.statusCode,
            headers: response.headers,
          })
        );
      });

      reqApi.on("error", reject);
      reqApi.write(payload);
      reqApi.end();
    });

    const { buffer, status } = rawResponse;
    const text = buffer.toString("utf8").trim();

    // If DocRaptor returns JSON/XML, it’s an error
    if (status !== 200 || text.startsWith("{") || text.startsWith("<")) {
      res.setHeader("Content-Type", "application/json");
      return res.status(200).send(text);
    }

    // 5) Return PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'inline; filename="sample-report.pdf"'
    );
    return res.send(buffer);
  } catch (err) {
    console.error("PDF ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
