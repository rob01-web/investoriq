import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { assertReportFile } from "./assert-report-output.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const resultsDir = path.join(__dirname, "results");
const latestResultsPath = path.join(resultsDir, "latest-e2e-results.json");
const wave2FixturePath = path.join(__dirname, "fixtures", "jobs", "wave2-job-lifecycle.json");

function read(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), "utf8");
}

function readIfExists(relPath) {
  const absPath = path.join(repoRoot, relPath);
  return fs.existsSync(absPath) ? fs.readFileSync(absPath, "utf8") : "";
}

function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, "utf8"));
}

function exists(relPath) {
  return fs.existsSync(path.join(repoRoot, relPath));
}

function result(testName, mode, expected, actual, pass, notes = "") {
  return {
    testName,
    mode,
    expected,
    actual,
    result: pass ? "PASS" : "FAIL",
    notes,
  };
}

function skip(testName, mode, notes) {
  return {
    testName,
    mode,
    expected: "configured input",
    actual: "not configured",
    result: "SKIP",
    notes,
  };
}

function addStaticAssertion(rows, testName, mode, pass, notes = "") {
  rows.push(result(testName, mode, "pass", pass ? "pass" : "fail", pass, notes));
}

function discoverFixtures() {
  const candidates = [
    "Final_Testing",
    "tests/e2e/fixtures",
    "tests/fixtures",
    "fixtures",
    "!Fictitious Property Documents to Upload",
    "124 Richmond Street, London, ON",
  ];
  return candidates
    .filter(exists)
    .map((relPath) => {
      const abs = path.join(repoRoot, relPath);
      const count = fs.readdirSync(abs, { recursive: true }).length;
      return { relPath, count };
    });
}

function parseArgs(argv) {
  const args = {
    reportPaths: [],
    profile: process.env.E2E_PROFILE || "generic",
    mode: process.env.E2E_MODE || "static",
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--report" && argv[i + 1]) {
      args.reportPaths.push(argv[i + 1]);
      i += 1;
    } else if (arg === "--profile" && argv[i + 1]) {
      args.profile = argv[i + 1];
      i += 1;
    } else if (arg === "--mode" && argv[i + 1]) {
      args.mode = argv[i + 1];
      i += 1;
    }
  }
  const envReports = String(process.env.E2E_REPORT_PATHS || "")
    .split(path.delimiter)
    .map((item) => item.trim())
    .filter(Boolean);
  args.reportPaths.push(...envReports);
  return args;
}

function runStaticSourceChecks() {
  const rows = [];
  const generator = read("api/generate-client-report.js");
  const template = read("api/report-template-runtime.html");
  const parser = read("api/parse/parse-doc.js");

  addStaticAssertion(rows, "Generator syntax target present", "static", generator.includes("export default async function handler"));
  addStaticAssertion(rows, "Template cover title token present", "static", template.includes("{{PROPERTY_NAME}}"));
  addStaticAssertion(rows, "Market Rent Gap label present", "static", generator.includes("Market Rent Gap (Avg)"));
  addStaticAssertion(rows, "Market Rent Premium label absent", "static", !/Market Rent Premium \(Avg\)/.test(generator + template));
  addStaticAssertion(rows, "No post-reno rent-positioning labels", "static", !/Target Rent \(Post-Reno\)|Monthly Lift|Planned Lift/i.test(generator + template));
  addStaticAssertion(rows, "Refi sufficiency heading protected", "static", generator.includes('class="subsection-title"><strong>Full Refinance Sufficiency (Deterministic)</strong>'));
  addStaticAssertion(rows, "Value sensitivity heading protected", "static", /class="subsection-title"[^>]*>Implied Value Sensitivity at Stabilization<\/p>/.test(generator));
  addStaticAssertion(rows, "Top income concentration value not sentence paragraph", "static", !/Top Income Line Concentration<\/p><p>/.test(generator));
  addStaticAssertion(rows, "DSCR constrained verdict anchor present", "static", generator.includes("Review - Debt Coverage Constraint"));
  addStaticAssertion(rows, "Deal Score cap note clear", "static", generator.includes("Base score thresholds") && generator.includes("mandatory Review verdict cap"));
  addStaticAssertion(rows, "Loan generic fixed-rate parser support present", "static", /Fixed Rate|Loan Rate|Rate/.test(parser) && /interest_rate/.test(parser));
  addStaticAssertion(rows, "Property tax year-like rejection present", "static", /1900/.test(parser) && /2100/.test(parser) && /implausible_annual_tax|missing_annual_tax/.test(parser));
  addStaticAssertion(rows, "No public AI term in template", "static", !/\bAI\b|artificial intelligence|AI-assisted|AI fallback|AI QA/i.test(template));
  addStaticAssertion(rows, "No BUY/SELL in template", "static", !/\b(BUY|SELL)\b/i.test(template));

  return rows;
}

function runWave1BreakTests() {
  const rows = [];
  const generator = read("api/generate-client-report.js");
  const parser = read("api/parse/parse-doc.js");
  const worker = read("api/admin-run-worker.js");
  const motherloadRoot = "Final_Testing/SYNTH-QA-MOTHERLOAD-UNDERWRITING-01";
  const loanTerms = readIfExists(`${motherloadRoot}/loan_terms_simple_source.txt`);
  const capexSupport = readIfExists(`${motherloadRoot}/capex_budget_unstructured_source.txt`);
  const marketSurvey = readIfExists(`${motherloadRoot}/market_rent_survey_unstructured_source.txt`);

  addStaticAssertion(
    rows,
    "Wave1 missing rent roll fails closed",
    "wave1-static",
    /missing\.push\('rent_roll'\)/.test(worker) &&
      worker.includes("missing_required_documents") &&
      /status:\s*'failed'/.test(worker) &&
      worker.includes("entitlement_restored"),
    "Worker gate records missing required document and restores entitlement on hard failure."
  );
  addStaticAssertion(
    rows,
    "Wave1 missing T12 fails closed",
    "wave1-static",
    /missing\.push\('t12'\)/.test(worker) &&
      worker.includes("missing_required_documents") &&
      /status:\s*'failed'/.test(worker) &&
      worker.includes("entitlement_restored"),
    "Worker gate records missing required document and restores entitlement on hard failure."
  );
  addStaticAssertion(
    rows,
    "Wave1 structured artifacts required",
    "wave1-static",
    worker.includes("parsing did not produce all required structured financial artifacts") ||
      worker.includes("failed_artifact"),
    "Required docs without structured artifacts are not treated as publishable."
  );
  addStaticAssertion(
    rows,
    "Wave1 scale mismatch fails closed",
    "wave1-static",
    worker.includes("DOCUMENT_FINANCIAL_SCALE_MISMATCH") &&
      worker.includes("document_financial_scale_mismatch") &&
      worker.includes("t12_effective_gross_income") &&
      worker.includes("rent_roll_annual_in_place_rent") &&
      worker.includes("entitlement_restored"),
    "T12/rent-roll scale mismatch has a hard failure path and event artifact."
  );
  addStaticAssertion(
    rows,
    "Wave1 partial rent roll suppresses full metrics",
    "wave1-static",
    generator.includes("is_partial_sample === true") &&
      generator.includes('stripMarkedSection(finalHtml, "SECTION_2_UNIT_VALUE_ADD")') &&
      /if\s*\(source\.is_partial_sample === true\)\s*return ""/.test(generator),
    "Partial samples suppress full-property rent distribution/value sensitivity output."
  );
  addStaticAssertion(
    rows,
    "Wave1 unsupported CapEx not modeled",
    "fixture-static",
    capexSupport.length > 0 &&
      /not.*rent lift|rent lift, ROI, payback/i.test(capexSupport) &&
      generator.includes("hasExplicitRenovationInput") &&
      generator.includes("No CapEx amount, renovation scope, rent lift, ROI, or payback calculation has been modeled") &&
      generator.includes('stripMarkedSection(finalHtml, "SECTION_6_RENOVATION")'),
    "Supplemental CapEx support is acknowledged only when structured renovation inputs are absent."
  );
  addStaticAssertion(
    rows,
    "Wave1 market survey cannot replace rent roll",
    "fixture-static",
    marketSurvey.length > 0 &&
      /not a full rent roll|not intended to replace/i.test(marketSurvey) &&
      generator.includes("MARKET_SURVEY_CLASSIFICATION_REVIEW"),
    "Unstructured market survey support is QA-reviewed rather than promoted to rent roll."
  );
  addStaticAssertion(
    rows,
    "Wave1 explicit loan terms fixture anchors",
    "fixture-static",
    /Outstanding loan balance:\s*\$8,750,000/i.test(loanTerms) &&
      /Interest rate:\s*5\.25%/i.test(loanTerms) &&
      /Amortization:\s*30 years/i.test(loanTerms) &&
      /Loan-to-value:\s*70%/i.test(loanTerms),
    "Motherload loan fixture contains balance, rate, amortization, and LTV anchors."
  );
  addStaticAssertion(
    rows,
    "Wave1 generic debt rate parser is scoped",
    "wave1-static",
    parser.includes("effectiveDocType === 'loan_term_sheet'") &&
      /(?:fixed\\s\+rate\|loan\\s\+rate\|rate)/.test(parser) &&
      parser.includes("compact_refi_cap_rate") &&
      parser.includes("compact_ltv") &&
      !/exit\s*cap[^;\n]+interest_rate/i.test(parser),
    "Generic Rate/Fixed Rate/Loan Rate fallback exists only in loan-term parser path."
  );
  addStaticAssertion(
    rows,
    "Wave1 incomplete debt does not fabricate DSCR",
    "wave1-static",
    generator.includes("DSCR (Not Assessed)") &&
      generator.includes("Debt sizing balance not provided") &&
      generator.includes("Review - Debt Coverage Constraint") &&
      generator.includes("DSCR below 1.25x or not assessed applies a mandatory Review verdict cap"),
    "Debt gaps remain disclosed and verdict-capped rather than modeled."
  );

  return rows;
}

function artifactTypes(scenario) {
  return new Set((scenario.analysis_artifacts || []).map((artifact) => artifact.type));
}

function findArtifact(scenario, type) {
  return (scenario.analysis_artifacts || []).find((artifact) => artifact.type === type) || null;
}

function matchesPattern(value, pattern) {
  if (!pattern) return true;
  return new RegExp(pattern, "i").test(String(value || ""));
}

function addLifecycleAssertion(rows, scenario, label, pass, expected, actual, notes = "") {
  rows.push(
    result(
      `${scenario.profile}: ${label}`,
      "mock-lifecycle",
      expected,
      actual,
      pass,
      notes || scenario.description || ""
    )
  );
}

function runWave2LifecycleTests(profile) {
  const rows = [];
  if (!fs.existsSync(wave2FixturePath)) {
    rows.push(skip("Wave2 mock lifecycle fixtures", "mock-lifecycle", "Fixture file not found."));
    return rows;
  }

  const fixture = readJson(wave2FixturePath);
  const profiles = new Set(["generic", "wave2", "all"]);
  const scenarios = (fixture.scenarios || []).filter((scenario) =>
    profiles.has(profile) || scenario.profile === profile
  );

  if (scenarios.length === 0) return rows;

  for (const scenario of scenarios) {
    const expected = scenario.expected || {};
    const types = artifactTypes(scenario);
    const output = String(scenario.public_output_text || "");
    const reportCreated = (scenario.reports || []).length > 0;

    addLifecycleAssertion(
      rows,
      scenario,
      "job status",
      scenario.job?.status === expected.job_status,
      expected.job_status,
      scenario.job?.status || "missing"
    );

    if (expected.error_code_regex) {
      addLifecycleAssertion(
        rows,
        scenario,
        "error code",
        matchesPattern(scenario.job?.error_code, expected.error_code_regex),
        expected.error_code_regex,
        scenario.job?.error_code || "null"
      );
    }

    if (expected.failure_reason_regex) {
      addLifecycleAssertion(
        rows,
        scenario,
        "failure reason",
        matchesPattern(scenario.job?.failure_reason, expected.failure_reason_regex),
        expected.failure_reason_regex,
        scenario.job?.failure_reason || "null"
      );
    }

    addLifecycleAssertion(
      rows,
      scenario,
      "report row presence",
      reportCreated === expected.report_created,
      String(expected.report_created),
      String(reportCreated)
    );

    for (const type of expected.present_artifact_types || []) {
      addLifecycleAssertion(
        rows,
        scenario,
        `artifact present ${type}`,
        types.has(type),
        "present",
        types.has(type) ? "present" : "missing"
      );
    }

    for (const type of expected.absent_artifact_types || []) {
      addLifecycleAssertion(
        rows,
        scenario,
        `artifact absent ${type}`,
        !types.has(type),
        "absent",
        types.has(type) ? "present" : "absent"
      );
    }

    for (const pattern of expected.present_public_patterns || []) {
      addLifecycleAssertion(
        rows,
        scenario,
        `public output includes ${pattern}`,
        matchesPattern(output, pattern),
        "present",
        matchesPattern(output, pattern) ? "present" : "missing"
      );
    }

    for (const pattern of expected.absent_public_patterns || []) {
      addLifecycleAssertion(
        rows,
        scenario,
        `public output omits ${pattern}`,
        !matchesPattern(output, pattern),
        "absent",
        matchesPattern(output, pattern) ? "present" : "absent"
      );
    }

    if (expected.artifact_payload?.type) {
      const artifact = findArtifact(scenario, expected.artifact_payload.type);
      const payload = artifact?.payload || {};
      for (const [key, value] of Object.entries(expected.artifact_payload)) {
        if (key === "type") continue;
        addLifecycleAssertion(
          rows,
          scenario,
          `artifact payload ${key}`,
          Object.is(payload[key], value),
          JSON.stringify(value),
          JSON.stringify(payload[key])
        );
      }
    }
  }

  return rows;
}

async function runReportOutputChecks(reportPaths, profile) {
  if (reportPaths.length === 0) {
    return [
      skip(
        "Published report text assertions",
        "html/pdf",
        "Set E2E_REPORT_PATHS or pass --report <path> after regenerating a report."
      ),
    ];
  }

  const rows = [];
  for (const rawPath of reportPaths) {
    const absPath = path.isAbsolute(rawPath) ? rawPath : path.join(repoRoot, rawPath);
    if (!fs.existsSync(absPath)) {
      rows.push(result(`Report exists: ${rawPath}`, "html/pdf", "file exists", "missing", false));
      continue;
    }
    const assertions = await assertReportFile(absPath, { profile });
    for (const assertion of assertions) {
      rows.push(result(`${assertion.name}: ${path.basename(rawPath)}`, "html/pdf", assertion.expected, assertion.actual, assertion.result === "PASS", assertion.notes));
    }
  }
  return rows;
}

function addFixtureInventory(rows) {
  const fixtures = discoverFixtures();
  if (fixtures.length === 0) {
    rows.push(skip("Fixture package inventory", "fixtures", "No fixture directories found."));
    return rows;
  }
  const notes = fixtures.map((fixture) => `${fixture.relPath} (${fixture.count} entries)`).join("; ");
  rows.push(result("Fixture package inventory", "fixtures", "fixtures discovered", `${fixtures.length} discovered`, true, notes));
  return rows;
}

function addOutcomeSkips(rows) {
  const liveEnabled = process.env.E2E_LIVE === "true";
  const htmlOnly = process.env.HTML_ONLY === "true" || process.env.DRY_RUN === "true";
  const note = liveEnabled
    ? "Live job assertions are not implemented in this first harness without a seeded test account contract."
    : "Skipped by default to avoid live Supabase/DocRaptor side effects. Use regenerated report paths for output checks.";
  rows.push(skip("Clean Screening publishes", liveEnabled ? "live" : htmlOnly ? "html-only" : "dry-run", note));
  rows.push(skip("Clean Underwriting publishes", liveEnabled ? "live" : htmlOnly ? "html-only" : "dry-run", note));
  rows.push(skip("Messy Underwriting publishes when supported", liveEnabled ? "live" : htmlOnly ? "html-only" : "dry-run", note));
  rows.push(skip("Missing Rent Roll fails closed", liveEnabled ? "live" : "dry-run", note));
  rows.push(skip("Missing T12 fails closed", liveEnabled ? "live" : "dry-run", note));
  rows.push(skip("Unsupported CapEx-only fails closed", liveEnabled ? "live" : "dry-run", note));
  rows.push(skip("Job outcome / no report row assertions", liveEnabled ? "live-db" : "dry-run", note));
}

function printTable(rows) {
  const printable = rows.map((row) => ({
    "Test Name": row.testName,
    Mode: row.mode,
    Expected: row.expected,
    Actual: row.actual,
    Result: row.result,
    Notes: row.notes || "",
  }));
  console.table(printable);
}

async function main() {
  const args = parseArgs(process.argv);
  const rows = [];
  rows.push(...runStaticSourceChecks());
  rows.push(...runWave1BreakTests());
  rows.push(...runWave2LifecycleTests(args.profile));
  addFixtureInventory(rows);
  rows.push(...await runReportOutputChecks(args.reportPaths, args.profile));
  addOutcomeSkips(rows);

  fs.mkdirSync(resultsDir, { recursive: true });
  const summary = {
    generatedAt: new Date().toISOString(),
    mode: args.mode,
    profile: args.profile,
    reportPaths: args.reportPaths,
    totals: {
      pass: rows.filter((row) => row.result === "PASS").length,
      fail: rows.filter((row) => row.result === "FAIL").length,
      skip: rows.filter((row) => row.result === "SKIP").length,
    },
    rows,
  };
  fs.writeFileSync(latestResultsPath, `${JSON.stringify(summary, null, 2)}\n`);
  printTable(rows);
  console.log(`\nJSON report: ${path.relative(repoRoot, latestResultsPath)}`);

  if (summary.totals.fail > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
