const FINAL_HUMAN_PUBLICATION_AUTHORITY_VERSION = "final-human-publication-authority-v1";

function finite(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(/[$,%]/g, "").trim());
  return Number.isFinite(number) ? number : null;
}

function acceptedFacts(sourceTruthPackage = null, key = "") {
  const facts = sourceTruthPackage?.core?.[key]?.accepted_facts;
  return facts && typeof facts === "object" && !Array.isArray(facts) ? facts : {};
}

function screeningOperatingCostCoverageRatio(sourceTruthPackage = null) {
  const t12 = acceptedFacts(sourceTruthPackage, "t12");
  const gpr = finite(t12.gross_potential_rent ?? t12.gross_scheduled_rent);
  const opex = finite(t12.total_operating_expenses ?? t12.operating_expenses);
  if (gpr === null || gpr <= 0 || opex === null) return null;
  return opex / gpr;
}

function percent(value, digits = 1) {
  return Number.isFinite(value) ? `${(value * 100).toFixed(digits)}%` : "Not available";
}

function normalizeCoverTitle(html = "", lane = null) {
  let source = String(html || "");
  if (lane === "screening") {
    source = source.replace(
      /(<div\s+class="cover-prop-sub">)\s*InvestorIQ\s+Screening\s+Report\s*(<\/div>)/i,
      "$1Screening Report$2"
    );
  }
  if (lane === "underwriting") {
    source = source.replace(
      /(<div\s+class="cover-prop-sub">)\s*(?:InvestorIQ\s+)?Investment\s+Committee\s+Memorandum\s*(<\/div>)/i,
      "$1Underwriting Report$2"
    );
  }
  return source;
}

function polishScreeningText(text = "", sourceTruthPackage = null) {
  const costCoverage = screeningOperatingCostCoverageRatio(sourceTruthPackage);
  const costCoveragePct = percent(costCoverage, 1);
  let out = String(text || "");

  if (Number.isFinite(costCoverage)) {
    out = out
      .replace(/Occupancy is\s+[0-9.]+\s*pp\s+above\s+break-even\.?/gi, `Operating expenses equal ${costCoveragePct} of T12 Gross Potential Rent.`)
      .replace(/[0-9.]+\s*pp\s+above\s+break-even/gi, `${costCoveragePct} of GPR`);
  }

  return out
    .replace(/SOURCE RECONCILIATION REQUIRED/gi, "SOURCE DIFFERENCE REQUIRES REVIEW")
    .replace(/SOURCE RECONCILIATION/gi, "SOURCE DIFFERENCE REVIEW")
    .replace(/Source Reconciliation Required/gi, "Source Difference Requires Review")
    .replace(/Reconciliation Required/gi, "Source Difference Review")
    .replace(/Source Reconciliation/gi, "Source Difference Review")
    .replace(/operating break-even occupancy/gi, "operating cost coverage ratio")
    .replace(/Break-Even Occupancy/gi, "Operating Cost Coverage Ratio")
    .replace(/break-even occupancy/gi, "operating cost coverage ratio")
    .replace(/Operating Cushion/gi, "Operating Cost Coverage")
    .replace(/operating cushion/gi, "operating cost coverage");
}

function polishUnderwritingText(text = "") {
  return String(text || "")
    .replace(/Investment Committee Overview/gi, "Underwriting Overview")
    .replace(/T12 EXPENSE-LINE RECONCILIATION REQUIRED/gi, "T12 EXPENSE-LINE DIFFERENCE REQUIRES REVIEW")
    .replace(/T12 expense-line reconciliation required/gi, "T12 expense-line difference requires review")
    .replace(/\ba source-supported going-in cap-rate reference is available\./g, "A source-supported going-in cap-rate reference is available.")
    .replace(/\b(What\s+(?:explains|evidence|would|is|are|does|do|can|could|should|has|have)\b[^.!?]*?)\./g, "$1?");
}

function polishVisibleText(html = "", lane = null, sourceTruthPackage = null) {
  return String(html || "")
    .split(/(<style\b[^>]*>[\s\S]*?<\/style>|<script\b[^>]*>[\s\S]*?<\/script>|<[^>]+>)/gi)
    .map((part) => {
      if (/^</.test(part)) return part;
      return lane === "screening"
        ? polishScreeningText(part, sourceTruthPackage)
        : lane === "underwriting"
          ? polishUnderwritingText(part)
          : part;
    })
    .join("");
}

const FINAL_HUMAN_PUBLICATION_STYLE = `<style id="investoriq-final-human-publication-authority">
.iq-phase8 .cover-brand-name::after { content:'.' !important; color:#bfa367 !important; display:inline !important; }
.iq-phase8 .header-strip::before { content:none !important; display:none !important; }
.iq-phase8 .section-header::after { content:none !important; display:none !important; }
.iq-phase8 .section-header { border-bottom:1px solid #ded9cd !important; }
.iq-phase8 .iq-ic-metric-label { font-size:7pt !important; }
.iq-phase8-underwriting .institutional-chapter[data-iq-chapter="committee-overview"] > .chapter-heading { display:none !important; }
.iq-phase8-underwriting #quality-manifest-title { break-inside:avoid-page !important; page-break-inside:avoid !important; }
@media print {
  .iq-phase8-underwriting #quality-manifest-title { break-inside:avoid-page !important; page-break-inside:avoid !important; }
}
</style>`;

function injectFinalStyle(html = "") {
  const source = String(html || "");
  if (source.includes('id="investoriq-final-human-publication-authority"')) return source;
  return /<\/head>/i.test(source)
    ? source.replace(/<\/head>/i, `${FINAL_HUMAN_PUBLICATION_STYLE}\n</head>`)
    : `${FINAL_HUMAN_PUBLICATION_STYLE}${source}`;
}

export function applyInvestorIqFinalHumanPublicationAuthority(
  html,
  { lane = null, sourceTruthPackage = null } = {}
) {
  const normalizedLane = String(lane || "").trim().toLowerCase();
  if (!["screening", "underwriting"].includes(normalizedLane)) return String(html || "");
  const titled = normalizeCoverTitle(html, normalizedLane);
  const polished = polishVisibleText(titled, normalizedLane, sourceTruthPackage);
  return injectFinalStyle(polished);
}

export function finalHumanPublicationAuthorityMetadata() {
  return Object.freeze({
    version: FINAL_HUMAN_PUBLICATION_AUTHORITY_VERSION,
    changesSourceFacts: false,
    changesCalculations: false,
    hardcodedPageCount: false,
    customerFacingPresentationOnly: true,
  });
}

