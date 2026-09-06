import fs from "node:fs";
import path from "node:path";

process.env.NODE_ENV = "test";
process.env.INVESTORIQ_ENABLE_TEST_HOOKS = "true";
process.env.SUPABASE_URL ||= "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-key";
process.env.ADMIN_RUN_KEY ||= "test-admin-run-key";
process.env.DOCRAPTOR_API_KEY ||= "test-docraptor-key";
process.env.QA_REVIEW_ENABLED ||= "false";

const { default: generateClientReport } = await import("../api/generate-client-report.js");
const {
  buildPhase8CertificationRequests,
  renderPhase8CertificationArtifacts,
} = await import("./phase8-visual-certification-fixtures.js");

const base = buildPhase8CertificationRequests();
const underwriting = structuredClone(base.underwriting);
underwriting.body.userId = "visual_elite_step6_preview_underwriting";
underwriting.body.report_type = "underwriting";
underwriting.body.property_name = "Stonebridge Lofts";
underwriting.body.__test_return_final_html = true;

const screening = structuredClone(base.underwriting);
screening.body.userId = "visual_elite_step6_preview_screening";
screening.body.report_type = "screening";
screening.body.property_name = "Stonebridge Lofts";
screening.body.__test_return_final_html = true;
delete screening.body.__test_acq_memo_v2_render_context;

const rendered = await renderPhase8CertificationArtifacts(generateClientReport, { screening, underwriting });
const out = path.resolve(process.env.STEP6_PREVIEW_DIR || "step6-pagination-preview");
fs.mkdirSync(out, { recursive: true });

for (const lane of ["screening", "underwriting"]) {
  const html = rendered[lane].html;
  if (!/Stonebridge Lofts/i.test(html)) throw new Error(`STEP6_PREVIEW_IDENTITY_MISSING:${lane}`);
  if (!/data-iq-phase8b="cross-product-publication-system-v1"/i.test(html)) throw new Error(`STEP6_PREVIEW_PHASE8B_MISSING:${lane}`);
  const expectedClass = lane === "screening"
    ? /class="card allow-break phase8b-screening-decision-page"/
    : /class="card allow-break iq-ic-summary-card phase8a-executive-summary"/;
  if (!expectedClass.test(html)) throw new Error(`STEP6_PREVIEW_DECISION_FLOW_CLASS_MISSING:${lane}`);
  fs.writeFileSync(path.join(out, `Stonebridge_${lane}.html`), html, "utf8");
}

console.log(`visual-elite-step6-dual-lane-html: PASS (${out})`);
