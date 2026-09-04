import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const artifactDir = path.resolve(process.env.PHASE8_ARTIFACT_DIR || path.join(root, "tmp", "phase8b-f-certification"));
const outputDir = path.resolve(process.env.PHASE8B_PDF_OUTPUT_DIR || path.join(root, "output", "pdf"));
const chromePath = process.env.PHASE8B_CHROME_PATH;
const renderer = String(process.env.PHASE8B_PDF_RENDERER || "chromium").trim().toLowerCase();
const weasyprintPythonPath = String(process.env.PHASE8B_WEASYPRINT_PYTHONPATH || "").trim();
const weasyprintStylesheet = path.join(root, "scripts", "phase8b-weasyprint-certification.css");
const nodeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules";
const playwrightModule = path.join(nodeModules, "playwright", "index.js");

if (renderer === "chromium" && (!chromePath || !fs.existsSync(chromePath))) {
  throw new Error("PHASE8B_CHROMIUM_EXECUTABLE_REQUIRED");
}
if (renderer === "chromium" && !fs.existsSync(playwrightModule)) {
  throw new Error("PHASE8B_PLAYWRIGHT_MODULE_REQUIRED");
}
if (!["chromium", "weasyprint"].includes(renderer)) throw new Error(`PHASE8B_PDF_RENDERER_UNSUPPORTED:${renderer}`);

const inputs = [
  {
    html: path.join(artifactDir, "phase7-screening-harbourstone.html"),
    pdf: path.join(outputDir, "phase8b-screening-harbourstone.pdf"),
  },
  {
    html: path.join(artifactDir, "phase7-underwriting-stonebridge.html"),
    pdf: path.join(outputDir, "phase8b-underwriting-stonebridge.pdf"),
  },
];
for (const input of inputs) {
  if (!fs.existsSync(input.html)) throw new Error(`PHASE8B_CERTIFICATION_HTML_MISSING:${input.html}`);
}

fs.mkdirSync(outputDir, { recursive: true });
if (renderer === "weasyprint") {
  for (const input of inputs) {
    const weasyprintArgs = ["--stylesheet", weasyprintStylesheet, input.html, input.pdf];
    if (weasyprintPythonPath) {
      execFileSync("python3", ["-m", "weasyprint", ...weasyprintArgs], {
        stdio: "inherit",
        env: { ...process.env, PYTHONPATH: weasyprintPythonPath },
      });
    } else {
      execFileSync("weasyprint", weasyprintArgs, { stdio: "inherit" });
    }
  }
} else {
  const playwrightImport = await import(pathToFileURL(playwrightModule).href);
  const { chromium } = playwrightImport.default || playwrightImport;
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    for (const input of inputs) {
      const page = await browser.newPage();
      await page.goto(pathToFileURL(input.html).href, { waitUntil: "networkidle", timeout: 120000 });
      await page.evaluate(() => document.fonts?.ready);
      await page.emulateMedia({ media: "print" });
      await page.pdf({
        path: input.pdf,
        format: "Letter",
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        margin: { top: "0in", right: "0in", bottom: "0in", left: "0in" },
        tagged: true,
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

console.log(`phase8b-render-certification-pdfs: PASS (${renderer}; ${outputDir})`);
