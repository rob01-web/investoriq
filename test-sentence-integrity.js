if (process.env.NODE_ENV === "production") {
  throw new Error("DEV_ONLY_SAMPLE_TOOLING_DISABLED_IN_PROD");
}

// test-sentence-integrity.js (ESM compatible)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Convert __dirname to ESM format
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the validator (must also be ESM or default export)
import { ensureSentenceIntegrity } from "./api/lib/sentenceIntegrity.js";

// STEP 1: Load HTML file
const htmlPath = path.join(
  __dirname,
  "public",
  "reports",
  "sample-report.html"
);

const html = fs.readFileSync(htmlPath, "utf8");

// STEP 2: Run validator
const { html: cleanedHtml, warnings } = ensureSentenceIntegrity(html, {
  autoFixPunctuation: false,
});

// STEP 3: Print findings
console.log("\n🔍 Sentence Integrity Scan Complete:");
console.log("------------------------------------");

if (warnings.length === 0) {
  console.log("✨ No suspicious paragraphs found!");
} else {
  console.log(`⚠️ Found ${warnings.length} potential issues:\n`);
  warnings.forEach((w, i) => {
    console.log(`${i + 1}. ${w}`);
  });
}

// STEP 4: Write output file
const outPath = path.join(__dirname, "sentence-integrity-output.html");
fs.writeFileSync(outPath, cleanedHtml, "utf8");

console.log(`\n📝 Cleaned HTML written to: ${outPath}\n`);


