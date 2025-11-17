import fs from "fs";
import path from "path";
import https from "https";
import url from "url";

export default async function handler(req, res) {
  try {
    const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
    const filePath = path.join(__dirname, "html", "sample-report.html");

    if (!fs.existsSync(filePath)) {
      throw new Error("sample-report.html NOT FOUND at: " + filePath);
    }

    let html = fs.readFileSync(filePath, "utf8");

    const baseUrl = "https://investoriq.tech";
    html = html.replace(/src="\/charts\//g, `src="${baseUrl}/charts/`);

    const payload = JSON.stringify({
      test: false,
      name: "sample-report.pdf",
      document_type: "pdf",
      document_content: html,
      javascript: false,
      prince_options: {
        media: "print",
        dpi: 300
      }
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

    const rawResponse = await new Promise((resolve, reject) => {
      const reqApi = https.request(options, response => {
        const chunks = [];
        response.on("data", chunk => chunks.push(chunk));
        response.on("end", () =>
          resolve({
            buffer: Buffer.concat(chunks),
            status: response.statusCode
          })
        );
      });

      reqApi.on("error", reject);
      reqApi.write(payload);
      reqApi.end();
    });

    const { buffer, status } = rawResponse;
    const text = buffer.toString("utf8").trim();

    if (status !== 200 || text.startsWith("{") || text.startsWith("<")) {
      res.setHeader("Content-Type", "application/json");
      return res.status(200).send(text);
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="sample-report.pdf"');
    res.send(buffer);
  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}

export const config = {
  runtime: "nodejs20.x"
};
