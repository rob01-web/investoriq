import assert from "node:assert/strict";
import fs from "node:fs";
import pdfMake from "pdfmake/build/pdfmake.js";
import pdfFonts from "pdfmake/build/vfs_fonts.js";

process.env.NODE_ENV ||= "test";
process.env.INVESTORIQ_ENABLE_TEST_HOOKS ||= "true";
process.env.SUPABASE_URL ||= "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-key";
process.env.ADMIN_RUN_KEY ||= "test-admin-run-key";
process.env.DOCRAPTOR_API_KEY ||= "test-docraptor-key";
process.env.QA_REVIEW_ENABLED ||= "false";
process.env.ACQ_MEMO_V2_SOURCE_AUTHORITY ||= "true";

const fixture = JSON.parse(
  fs.readFileSync(new URL("./fixtures/retest24-sanitized-permanent-replay.json", import.meta.url), "utf8"),
);
const generateClientReport = (await import("../../api/generate-client-report.js")).default;
const {
  buildCanonicalSourceTruthPackage,
  constrainCanonicalSourcePackageToSourceTruth,
} = await import("../../api/_lib/source-truth-package.js");
const { buildAcquisitionMemoProjection } = await import("../../api/_lib/acquisition-memo-projection.js");
const {
  buildAcquisitionMemoBossContract,
  validateAcquisitionMemoBossContract,
} = await import("../../api/_lib/acquisition-memo-boss-contract.js");
const {
  buildAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2CustomerSurfaceModel,
} = await import("../../api/_lib/acquisition-memo-v2-customer-surface-model.js");
const {
  buildSourceReconciliationState,
  buildSourceReconciliationRenderState,
} = await import("../../api/_lib/report-surface-contracts.js");
const {
  buildDeterministicReportContractQaSeal,
  DETERMINISTIC_REPORT_CONTRACT,
} = await import("../../api/_lib/deterministic-report-contract-qa-seal.js");
const { buildReportContractQa } = await import("../../api/_lib/report-contract-qa.js");
const { buildDeliveryResponseCompatibilityAliases } = await import("../../api/_lib/report-delivery-output.js");
const {
  analyzeFinalPdfBytes,
  buildApprovedPdfSurfaceManifest,
  inspectFinalPdfPublicationQuality,
} = await import("../../api/_lib/final-pdf-publication-quality-boss.js");

assert.equal(fixture.schema_version, "retest24_sanitized_permanent_replay_v1");
assert.equal(fixture.sanitization.customer_identifiers_removed, true);
assert.equal(fixture.sanitization.production_ids_removed, true);
assert.equal(/Stonebridge|e2f92088|robmc/i.test(JSON.stringify(fixture)), false);

function expandUnits(groups = []) {
  return groups.flatMap((group) => Array.from({ length: group.count }, (_, index) => {
    const occupied = index < group.occupied_count;
    return {
      unit: `${group.prefix}${String(index + 1).padStart(2, "0")}`,
      status: occupied ? "occupied" : "vacant",
      beds: group.beds,
      sqft: group.square_feet,
      in_place_rent: occupied ? group.in_place_rent_occupied : 0,
      market_rent: group.market_rent,
    };
  }));
}

function buildReplayInputs() {
  const t12 = structuredClone(fixture.core.t12);
  const rentRoll = structuredClone(fixture.core.rent_roll);
  const units = expandUnits(rentRoll.unit_groups);
  const rentRollPayload = {
    ...rentRoll,
    total_in_place_annual: rentRoll.annual_in_place_rent,
    total_market_annual: rentRoll.annual_market_rent,
    units,
    totals: {
      summary_row_detected: true,
      total_units: rentRoll.total_units,
      occupied_units: rentRoll.occupied_units,
      vacant_units: rentRoll.vacant_units,
      occupancy: rentRoll.occupancy,
      in_place_rent_annual: rentRoll.annual_in_place_rent,
      market_rent_annual: rentRoll.annual_market_rent,
    },
  };
  const computedRentRoll = {
    ...rentRollPayload,
    total_annual_market: rentRoll.annual_market_rent,
    avg_in_place_rent: rentRoll.annual_in_place_rent / 12 / rentRoll.total_units,
    avg_market_rent: rentRoll.annual_market_rent / 12 / rentRoll.total_units,
    rent_to_market_gap: 1 - (rentRoll.annual_in_place_rent / rentRoll.annual_market_rent),
  };

  const supportArtifacts = fixture.support_artifacts.map((artifact, index) => {
    const document = fixture.documents.find((candidate) => candidate.id === artifact.file_id);
    return {
      id: `fixture-support-candidate-${index + 1}`,
      file_id: artifact.file_id,
      original_filename: document.original_filename,
      type: artifact.type,
      payload: {
        ...structuredClone(artifact.payload),
        file_id: artifact.file_id,
        original_filename: document.original_filename,
        validated: true,
        candidate_facts: structuredClone(artifact.payload),
      },
    };
  });
  const textArtifacts = fixture.documents.map((document, index) => ({
    id: `fixture-support-text-${index + 1}`,
    file_id: document.id,
    original_filename: document.original_filename,
    type: "document_text_extracted",
    payload: {
      file_id: document.id,
      original_filename: document.original_filename,
      document_text_extracted: document.source_text,
      source_text: document.source_text,
      text: document.source_text,
    },
  }));
  const coreArtifacts = [
    {
      id: "fixture-t12-artifact",
      file_id: t12.file_id,
      original_filename: t12.original_filename,
      type: "t12_parsed",
      payload: {
        file_id: t12.file_id,
        original_filename: t12.original_filename,
        t12_parsed: {
          ...t12,
          validated: true,
          core_t12_validation: { ok: true, failures: [] },
        },
      },
    },
    {
      id: "fixture-rent-roll-artifact",
      file_id: rentRoll.file_id,
      original_filename: rentRoll.original_filename,
      type: "rent_roll_parsed",
      payload: {
        file_id: rentRoll.file_id,
        original_filename: rentRoll.original_filename,
        rent_roll_parsed: {
          ...rentRollPayload,
          validated: true,
          parser_diagnostics: { validation_reasons: [] },
        },
      },
    },
  ];
  const documentSources = [
    {
      id: t12.file_id,
      original_filename: t12.original_filename,
      doc_type: "t12",
      parse_status: "parsed",
    },
    {
      id: rentRoll.file_id,
      original_filename: rentRoll.original_filename,
      doc_type: "rent_roll",
      parse_status: "parsed",
    },
    ...fixture.documents.map((document) => ({ ...structuredClone(document), fileId: document.id })),
  ];
  return {
    t12,
    rentRollPayload,
    computedRentRoll,
    coreArtifacts,
    supportArtifacts,
    textArtifacts,
    coverageArtifacts: [...coreArtifacts, ...textArtifacts, ...supportArtifacts],
    documentSources,
  };
}

function makeResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return body;
    },
  };
}

function stripHtml(html = "") {
  return String(html)
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertContainsLabelValue(html, label, value) {
  assert.match(html, new RegExp(`${escapeRegex(label)}[\\s\\S]{0,180}${escapeRegex(value)}`, "i"));
}

function buildHarnessPayload(inputs, { includeSupport = true, unusableSupport = false } = {}) {
  const acquisition = fixture.expected.acquisition_financing;
  const debt = fixture.expected.current_debt;
  const supportDocuments = unusableSupport
    ? fixture.documents.map((document) => ({
        id: document.id,
        original_filename: document.original_filename,
        doc_type: document.doc_type,
        parse_status: "failed",
        parse_error: "Fixture unreadable optional support",
        source_text: "",
      }))
    : inputs.documentSources.slice(2);
  return {
    t12Payload: structuredClone(inputs.t12),
    rentRollPayload: structuredClone(inputs.rentRollPayload),
    computedRentRoll: structuredClone(inputs.computedRentRoll),
    acquisitionTermsPayload: includeSupport && !unusableSupport ? {
      debt_basis: "acquisition_financing_assumption",
      purchase_price: acquisition.purchase_price,
      noi_basis: acquisition.noi_basis,
      going_in_cap_rate: acquisition.going_in_cap_rate,
      proposed_loan_amount: acquisition.proposed_loan_amount,
      ltv: acquisition.proposed_ltv,
      interest_rate: acquisition.proposed_interest_rate,
      amortization_years: acquisition.proposed_amortization_years,
      lender_fee_percent: acquisition.lender_fee_percent,
    } : null,
    loanTermSheetTermsPayload: includeSupport && !unusableSupport ? {
      debt_basis: "current_debt_context",
      outstanding_balance: debt.current_outstanding_balance,
      interest_rate: debt.interest_rate,
      amortization_years: debt.amortization_remaining_years,
      monthly_payment: debt.monthly_payment,
      maturity_date: debt.maturity_date,
    } : null,
    mortgagePayload: includeSupport && !unusableSupport ? {
      outstanding_balance: debt.current_outstanding_balance,
      interest_rate: debt.interest_rate,
      amort_years: debt.amortization_remaining_years,
      monthly_payment: debt.monthly_payment,
      maturity_date: debt.maturity_date,
    } : null,
    documentSources: [inputs.documentSources[0], inputs.documentSources[1], ...supportDocuments],
    coverageArtifacts: includeSupport && !unusableSupport
      ? inputs.coverageArtifacts
      : inputs.coreArtifacts,
  };
}

async function runHarness({ reportType, payload, userId }) {
  const request = {
    headers: { "x-admin-run-key": process.env.ADMIN_RUN_KEY },
    body: {
      userId,
      report_type: reportType,
      property_name: fixture.property.name,
      __test_enable_acq_memo_v2_source_authority: true,
      __test_return_final_html: true,
      __test_payloads: payload,
    },
  };
  const response = makeResponse();
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = (...args) => {
    if (/^(?:Failed to write|Source package QA advisory failed|QA manager review failed)/.test(String(args[0] || ""))) return;
    originalError(...args);
  };
  console.warn = (...args) => {
    if (/^WARN Missing narrative sections:/.test(String(args[0] || ""))) return;
    originalWarn(...args);
  };
  try {
    await generateClientReport(request, response);
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }
  return response;
}

function uniqueFixtureText(values = []) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function fixturePdfText(value = "") {
  return String(value || "")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fixturePdfCell(value, { header = false, numeric = false } = {}) {
  return {
    text: fixturePdfText(value),
    bold: header,
    alignment: numeric ? "right" : "left",
    fontSize: 8,
    color: header ? "#ffffff" : "#1f2933",
    fillColor: header ? "#334155" : null,
    margin: [2, 2, 2, 2],
  };
}

function fixturePdfCompactCell(value, { numeric = false } = {}) {
  return {
    text: fixturePdfText(value),
    alignment: numeric ? "right" : "left",
    fontSize: 7.5,
    color: "#1f2933",
    margin: [2, 1, 2, 1],
  };
}

function fixturePdfValueParts(value = "") {
  const text = fixturePdfText(value);
  const suffixMatch = text.match(/^(.*?)(\s+years?|x)$/i);
  return [
    fixturePdfCell(suffixMatch?.[1] || text, { numeric: true }),
    fixturePdfCell(suffixMatch?.[2] || ""),
  ];
}

function buildPdfBuffer(html, { deterministicContractQaSeal, sourceReconciliation } = {}) {
  pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts;
  const manifest = buildApprovedPdfSurfaceManifest({
    approvedHtml: html,
    deterministicContractQaSeal,
    sourceReconciliation,
    requiredTextAnchors: ["Underwriting Report"],
  });
  const content = [
    {
      text: "Underwriting Report",
      fontSize: 18,
      bold: true,
      color: "#172554",
      margin: [0, 0, 0, 12],
    },
    {
      stack: [
        { text: "Source Reconciliation", fontSize: 13, bold: true, color: "#1e3a8a", margin: [0, 0, 0, 4] },
        { text: fixturePdfText(manifest.reconciliation.disclosure), fontSize: 8.5, lineHeight: 1.2 },
      ],
      unbreakable: true,
      margin: [0, 0, 0, 12],
    },
  ];

  for (const table of manifest.tables) {
    const financialRows = manifest.financialRows.filter((financialRow) =>
      (table.rows || []).some((row) =>
        row[0] === financialRow.label && row.slice(1).includes(financialRow.value)
      )
    );
    const representedCells = new Set([
      ...table.headers,
      ...financialRows.flatMap((row) => [row.label, row.value]),
    ]);
    const remainingCells = uniqueFixtureText(table.cells)
      .filter((cell) => !representedCells.has(cell));
    const tableContent = [
      {
        text: fixturePdfText(table.title || `Approved Table ${table.id}`),
        fontSize: 11,
        bold: true,
        color: "#1e3a8a",
        margin: [0, 0, 0, 5],
      },
    ];
    if (financialRows.length) {
      tableContent.push({
        table: {
          headerRows: 1,
          heights: (rowIndex) => rowIndex === 0 || table.id !== "approved-table-17" ? 20 : 36,
          widths: [250, "*", 36],
          body: [
            [
              fixturePdfCell(`Approved financial label - ${table.title || table.id}`, { header: true }),
              { ...fixturePdfCell("Approved value", { header: true }), colSpan: 2 },
              {},
            ],
            ...financialRows.map((row) => [
              fixturePdfCell(row.label),
              ...fixturePdfValueParts(row.value),
            ]),
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 8],
      });
    }
    tableContent.push({
      table: {
        headerRows: 1,
        dontBreakRows: true,
        widths: [120, "*"],
        body: [
          [
            fixturePdfCell("Approved table headers", { header: true }),
            fixturePdfCell(
              uniqueFixtureText(table.headers).join(" | ") || fixturePdfText(table.title),
              { header: true },
            ),
          ],
          ...remainingCells.map((cell) => [
            fixturePdfCell("Approved surface text"),
            fixturePdfCell(cell),
          ]),
        ],
      },
      layout: "lightHorizontalLines",
    });
    content.push({
      stack: tableContent,
      pageBreak: "before",
      margin: [0, 0, 0, 10],
    });
  }

  for (const [chartIndex, chart] of manifest.charts.entries()) {
    const chartRows = Array.from(
      { length: Math.max(chart.labels.length, chart.displayedNumbers.length, 1) },
      (_, index) => [
        fixturePdfCell(chart.labels[index] || "Approved chart value"),
        fixturePdfCell(chart.displayedNumbers[index] || "", { numeric: true }),
      ]
    );
    content.push({
      stack: [
        {
          text: fixturePdfText(chart.title || chart.id),
          fontSize: 11,
          bold: true,
          color: "#1e3a8a",
          margin: [0, 0, 0, 4],
        },
        {
          table: {
            widths: [250, "*"],
            body: chartRows,
          },
          layout: "lightHorizontalLines",
        },
      ],
      pageBreak: chartIndex === 0 ? "before" : undefined,
      unbreakable: true,
      margin: [0, 0, 0, 14],
    });
  }

  const representedHeadings = new Set(uniqueFixtureText([
    "Underwriting Report",
    "Source Reconciliation",
    ...manifest.tables.map((table) => table.title),
    ...manifest.charts.map((chart) => chart.title),
  ]).map((value) => value.toLowerCase()));
  const additionalHeadings = uniqueFixtureText(manifest.headings)
    .filter((heading) => !representedHeadings.has(heading.toLowerCase()));
  if (additionalHeadings.length) {
    content.push(
      {
        text: "Approved Customer Surface Headings",
        fontSize: 13,
        bold: true,
        color: "#1e3a8a",
        pageBreak: "before",
        margin: [0, 0, 0, 5],
      },
      {
        table: {
          widths: ["*"],
          body: additionalHeadings.map((heading) => [
            fixturePdfCell(`Approved heading: ${heading}`),
          ]),
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 14],
      },
    );
  }

  content.push(
    {
      text: "Approved Displayed Values",
      fontSize: 13,
      bold: true,
      color: "#1e3a8a",
      pageBreak: "before",
      margin: [0, 0, 0, 5],
    },
    {
      table: {
        headerRows: 1,
        widths: [250, "*"],
        body: [
          [
            fixturePdfCell("Approved surface", { header: true }),
            fixturePdfCell("Displayed value", { header: true }),
          ],
          ...uniqueFixtureText(manifest.displayedNumbers).map((value) => [
            fixturePdfCompactCell("Approved displayed value"),
            fixturePdfCompactCell(value, { numeric: true }),
          ]),
        ],
      },
      layout: "lightHorizontalLines",
    },
  );

  const definition = {
    pageSize: "LETTER",
    pageMargins: [42, 54, 42, 48],
    header: () => ({
      text: "InvestorIQ Underwriting Report",
      margin: [42, 24, 42, 0],
      fontSize: 8,
      color: "#5a6670",
    }),
    footer: (currentPage, pageCount) => ({
      text: `InvestorIQ Confidential | Page ${currentPage} of ${pageCount}`,
      alignment: "right",
      margin: [42, 0, 42, 18],
      fontSize: 8,
      color: "#5a6670",
    }),
    content,
    styles: {
      tableHeader: { bold: true, color: "#ffffff", fillColor: "#334155" },
    },
    defaultStyle: { font: "Roboto" },
  };
  return new Promise((resolve) => pdfMake.createPdf(definition).getBuffer((buffer) => resolve(Buffer.from(buffer))));
}

const inputs = buildReplayInputs();
const expectedAcquisition = fixture.expected.acquisition_financing;
const expectedDebt = fixture.expected.current_debt;
const expectedAppraisal = fixture.expected.appraisal;

const sourceTruthArtifacts = inputs.coverageArtifacts.map((artifact) => {
  if (artifact.type === "t12_parsed") return { ...artifact, payload: artifact.payload.t12_parsed };
  if (artifact.type === "rent_roll_parsed") return { ...artifact, payload: artifact.payload.rent_roll_parsed };
  return artifact;
});
const sourceTruth = buildCanonicalSourceTruthPackage({ artifacts: sourceTruthArtifacts });
assert.equal(sourceTruth.core_publishable, true, JSON.stringify(sourceTruth.core, null, 2));
const acceptedByRole = new Map(sourceTruth.support.accepted.map((document) => [document.canonical_role, document]));
const acceptedPurchase = acceptedByRole.get("purchase_assumptions");
const acceptedDebt = acceptedByRole.get("current_debt_context");
const acceptedAppraisal = acceptedByRole.get("appraisal_context");
assert.ok(acceptedPurchase, JSON.stringify(sourceTruth.support, null, 2));
assert.ok(acceptedDebt, JSON.stringify(sourceTruth.support, null, 2));
assert.ok(acceptedAppraisal, JSON.stringify(sourceTruth.support, null, 2));
for (const [field, value] of Object.entries({
  purchase_price: expectedAcquisition.purchase_price,
  noi_basis: expectedAcquisition.noi_basis,
  going_in_cap_rate: expectedAcquisition.going_in_cap_rate,
  proposed_loan_amount: expectedAcquisition.proposed_loan_amount,
  ltv: expectedAcquisition.proposed_ltv,
  interest_rate: expectedAcquisition.proposed_interest_rate,
  amortization_years: expectedAcquisition.proposed_amortization_years,
  lender_fee_percent: expectedAcquisition.lender_fee_percent,
})) assert.ok(Math.abs(acceptedPurchase.accepted_facts[field] - value) < 1e-12, `purchase ${field}`);
for (const [field, value] of Object.entries({
  current_outstanding_balance: expectedDebt.current_outstanding_balance,
  interest_rate: expectedDebt.interest_rate,
  amortization_remaining_years: expectedDebt.amortization_remaining_years,
  monthly_payment: expectedDebt.monthly_payment,
  maturity_date: expectedDebt.maturity_date,
})) {
  if (typeof value === "number") assert.ok(Math.abs(acceptedDebt.accepted_facts[field] - value) < 1e-12, `current debt ${field}`);
  else assert.equal(acceptedDebt.accepted_facts[field], value, `current debt ${field}`);
}
assert.equal(acceptedAppraisal.accepted_facts.appraisal_value, expectedAppraisal.appraised_value, JSON.stringify(acceptedAppraisal, null, 2));
assert.equal(acceptedAppraisal.accepted_facts.stabilized_noi, expectedAppraisal.stabilized_noi, JSON.stringify(acceptedAppraisal, null, 2));
assert.ok(Math.abs(acceptedAppraisal.accepted_facts.stabilized_cap_rate - expectedAppraisal.stabilized_cap_rate) < 1e-12, JSON.stringify(acceptedAppraisal, null, 2));
assert.equal(acceptedPurchase.authority_decision.sectionEligibility.currentDebt, false);
assert.equal(acceptedDebt.authority_decision.sectionEligibility.proposedFinancing, false);
assert.equal(acceptedDebt.authority_decision.sectionEligibility.acquisitionRequest, false);
assert.equal(acceptedAppraisal.authority_decision.sectionEligibility.proposedFinancing, false);
assert.equal(acceptedAppraisal.authority_decision.sectionEligibility.currentDebt, false);

const canonical = constrainCanonicalSourcePackageToSourceTruth(null, sourceTruth);
const projection = buildAcquisitionMemoProjection(canonical);
const coreMetrics = {
  units: inputs.rentRollPayload.total_units,
  totalUnits: inputs.rentRollPayload.total_units,
  occupancy: inputs.rentRollPayload.occupancy,
  annualInPlaceRent: inputs.rentRollPayload.annual_in_place_rent,
  annualMarketRent: inputs.rentRollPayload.annual_market_rent,
  annualRentUpside: inputs.rentRollPayload.annual_market_rent - inputs.rentRollPayload.annual_in_place_rent,
  egi: inputs.t12.effective_gross_income,
  opEx: inputs.t12.total_operating_expenses,
  noi: inputs.t12.net_operating_income,
  expenseRatio: inputs.t12.total_operating_expenses / inputs.t12.effective_gross_income,
  noiMargin: inputs.t12.net_operating_income / inputs.t12.effective_gross_income,
  breakEvenOccupancy: fixture.expected.break_even_occupancy,
  purchasePrice: expectedAcquisition.purchase_price,
  goingInCapRate: expectedAcquisition.going_in_cap_rate,
};
const boss = buildAcquisitionMemoBossContract({
  canonicalSourcePackage: canonical,
  sourceTruthPackage: sourceTruth,
  acquisitionMemoProjection: projection,
  t12Payload: inputs.t12,
  coreMetrics,
  propertyProfile: { propertyName: fixture.property.name, propertyAddress: fixture.property.address, assetClass: fixture.property.asset_class },
  reportMeta: { reportType: "underwriting", reportTier: 2, reportMode: "v1_core" },
  reportMode: "v1_core",
});
const customerSurfaceModel = buildAcquisitionMemoV2CustomerSurfaceModel({
  canonicalSourcePackage: canonical,
  sourceTruthPackage: sourceTruth,
  acquisitionMemoProjection: projection,
  bossContract: boss,
  coreMetrics,
  propertyProfile: { propertyName: fixture.property.name, propertyAddress: fixture.property.address, assetClass: fixture.property.asset_class },
  reportMeta: { reportType: "underwriting", reportTier: 2, reportMode: "v1_core" },
  reportMode: "v1_core",
});
assert.equal(validateAcquisitionMemoBossContract(boss).ok, true);
assert.equal(validateAcquisitionMemoV2CustomerSurfaceModel(customerSurfaceModel).ok, true);
assert.equal(boss.sections.acquisitionRequestContext.factAvailability.sourceBacked, true);
assert.equal(boss.sections.proposedFinancingContext.factAvailability.sourceBacked, true);
assert.equal(boss.sections.currentDebtContext.factAvailability.sourceBacked, true);

const reconciliation = buildSourceReconciliationState({
  computedRentRoll: inputs.computedRentRoll,
  rentRollPayload: inputs.rentRollPayload,
  t12Payload: inputs.t12,
  artifacts: sourceTruthArtifacts,
});
const reconciliationRender = buildSourceReconciliationRenderState({ sourceReconciliationState: reconciliation });
assert.equal(reconciliation.status, "source_reconciliation_required");
assert.equal(reconciliation.publishability_bucket, "disclose_only_publishable");
assert.equal(reconciliation.rr_annual_in_place, fixture.expected.reconciliation.rent_roll_annual_in_place_rent);
assert.equal(reconciliation.t12_gpr, fixture.expected.reconciliation.t12_gross_potential_rent);
assert.equal(reconciliation.difference_amount, fixture.expected.reconciliation.difference);
assert.ok(Math.abs(reconciliation.variance_pct - fixture.expected.reconciliation.variance) < 1e-12);
assert.equal(reconciliationRender.variance_display, "-11.2%");
assert.equal(reconciliationRender.source_reconciliation_disclosure, reconciliation.source_reconciliation_disclosure);

const acquisitionResponse = await runHarness({
  reportType: "underwriting",
  userId: "fixture-retest24-acquisition",
  payload: buildHarnessPayload(inputs),
});
assert.equal(acquisitionResponse.statusCode, 200, JSON.stringify(acquisitionResponse.body, null, 2));
assert.equal(acquisitionResponse.body?.success, true);
assert.equal(acquisitionResponse.body?.report_publishable, true, JSON.stringify(acquisitionResponse.body?.deliveryDecisionState, null, 2));
assert.equal(acquisitionResponse.body?.customer_publish_eligible, true, JSON.stringify(acquisitionResponse.body?.deliveryDecisionState, null, 2));
const acquisitionDeliveryAliases = buildDeliveryResponseCompatibilityAliases(acquisitionResponse.body?.deliveryDecisionState);
assert.equal(acquisitionDeliveryAliases.report_publishable, true);
assert.equal(acquisitionDeliveryAliases.customer_publish_eligible, true);
for (const invalidDecision of [
  { ...structuredClone(acquisitionResponse.body.deliveryDecisionState), version: "unknown" },
  { ...structuredClone(acquisitionResponse.body.deliveryDecisionState), blockingReasons: ["fixture_blocker"] },
  {
    ...structuredClone(acquisitionResponse.body.deliveryDecisionState),
    finalBossCompliance: { ...structuredClone(acquisitionResponse.body.deliveryDecisionState.finalBossCompliance), customerSurfaceHtmlOk: false },
  },
]) {
  const invalidAliases = buildDeliveryResponseCompatibilityAliases(invalidDecision);
  assert.equal(invalidAliases.report_publishable, false);
  assert.equal(invalidAliases.customer_publish_eligible, false);
  assert.equal(invalidAliases.report_blocked, true);
}
const html = String(acquisitionResponse.body.final_html || "");
assert.ok(html.length > 10000);
const visibleHtmlText = stripHtml(html);

for (const [label, value] of [
  ["Purchase Price", "$13,500,000"],
  ["NOI Basis", "$945,000"],
  ["Going-In Cap Rate", "7.0%"],
  ["Proposed Loan Amount", "$9,450,000"],
  ["LTV", "70.0%"],
  ["Interest Rate", "5.95%"],
  ["Amortization", "30 years"],
  ["Lender / Origination Fee", "0.85%"],
]) assertContainsLabelValue(html, label, value);
for (const [label, value] of [
  ["Outstanding Balance", "$6,800,000"],
  ["Interest Rate", "4.85%"],
  ["Amortization Remaining", "24 years"],
  ["Monthly Payment", "$39,250"],
  ["Maturity Date", "2029-11-01"],
]) assertContainsLabelValue(html, label, value);

assertContainsLabelValue(html, "T12 Gross Potential Rent", "$1,612,800");
assertContainsLabelValue(html, "Rent Roll Annual In-Place Rent", "$1,432,800");
assertContainsLabelValue(html, "Rent Roll less T12", "($180,000)");
assert.match(
  visibleHtmlText,
  new RegExp(`Variance[^%]{0,180}${escapeRegex(fixture.expected.reconciliation.customer_display)}`, "i"),
  (visibleHtmlText.match(/.{0,100}Variance.{0,180}/gi) || []).join("\n"),
);
assert.match(html, new RegExp(escapeRegex(reconciliation.source_reconciliation_disclosure), "i"));
assertContainsLabelValue(html, "Break-Even Occupancy", "34.4%");
assert.equal(/Break-Even Occupancy[\s\S]{0,120}37\.0%/i.test(html), false);
assert.equal(/Implied Incremental Value|Capitalized (?:Gross )?Rent|gross rent (?:upside|difference|gap)[\s\S]{0,100}capitalized at/i.test(html), false);
assert.equal(/<tr[^>]*>\s*<td[^>]*>Purchase Price<\/td>\s*<td[^>]*>\$0<\/td>\s*<\/tr>/i.test(html), false);
assert.equal(/[\u2013\u2014]|&(?:ndash|mdash);|&#(?:8211|8212);/i.test(html), false);

const rowFor = (filename) => html.match(new RegExp(`<tr[^>]*>(?:(?!<\\/tr>)[\\s\\S])*?${escapeRegex(filename)}(?:(?!<\\/tr>)[\\s\\S])*?<\\/tr>`, "i"))?.[0] || "";
const purchaseRow = rowFor("Harbourview_Purchase_Assumptions.pdf");
const debtRow = rowFor("Harbourview_Current_Debt.pdf");
const appraisalRow = rowFor("Harbourview_Appraisal_Summary.pdf");
assert.match(purchaseRow, /Purchase Assumptions \/ Proposed Acquisition Financing Context/i);
assert.equal(/Current Mortgage|Existing Debt Context|Appraisal Context/i.test(purchaseRow), false);
assert.match(debtRow, /Existing Debt Context \/ Current Mortgage \/ Debt Statement/i);
assert.equal(/Purchase Assumptions|Appraisal Context/i.test(debtRow), false);
assert.match(appraisalRow, /Appraisal \/ Valuation Context/i);
assert.equal(/Purchase Assumptions|Current Mortgage|Existing Debt Context/i.test(appraisalRow), false);

assert.equal((html.match(/<title\b[^>]*>/gi) || []).length, 1);
assert.equal((html.match(/class="cover-prop-name"/gi) || []).length, 1);
assert.equal(/page-break-before\s*:\s*always[^}]*>[\s\S]*?<\/section>\s*<section[^>]*>\s*<\/section>/i.test(html), false);

const contractSeal = buildDeterministicReportContractQaSeal({
  html,
  reportIdentity: { reportMode: "v1_core", reportType: "underwriting", reportTier: 2 },
  sourceReconciliation: reconciliation,
  breakEven: {
    label: DETERMINISTIC_REPORT_CONTRACT.breakEvenLabel,
    formula: DETERMINISTIC_REPORT_CONTRACT.breakEvenFormula,
    numerator: inputs.t12.total_operating_expenses,
    denominator: inputs.t12.gross_potential_rent,
    result: fixture.expected.break_even_occupancy,
  },
  grossRentCapitalizationAuthorized: false,
});
assert.equal(contractSeal.ok, true, JSON.stringify(contractSeal, null, 2));
const reportContractQa = buildReportContractQa({
  propertyName: fixture.property.name,
  reportType: "underwriting",
  reportTier: 2,
  html,
  artifacts: sourceTruthArtifacts,
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    source_reconciliation_state: reconciliation,
    core_input_sufficiency_state: { publishability_bucket: "core_sufficient_publishable" },
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true, unit_count: inputs.rentRollPayload.total_units, occupancy: inputs.rentRollPayload.occupancy },
    },
  },
  deliveryGateDecision: acquisitionResponse.body.deliveryDecisionState,
  upstreamDeterministicContractQaSeal: contractSeal,
});
assert.equal(reportContractQa.deterministic_contract_qa_seal.ok, true, JSON.stringify(reportContractQa, null, 2));

const pdfBuffer = await buildPdfBuffer(html, {
  deterministicContractQaSeal: contractSeal,
  sourceReconciliation: { state: reconciliation },
});
const pdfAnalysis = await analyzeFinalPdfBytes(pdfBuffer);
assert.equal(pdfAnalysis.validPdf, true);
assert.ok(pdfAnalysis.pageCount > 1);
const pdfBoss = await inspectFinalPdfPublicationQuality({
  pdfBytes: pdfBuffer,
  approvedHtml: html,
  deterministicContractQaSeal: contractSeal,
  sourceReconciliation: { state: reconciliation },
  requiredTextAnchors: ["Underwriting Report"],
  artifactMode: "production_pdf",
  publicationTarget: "internal_test",
  pdfAnalysis,
});
assert.equal(pdfBoss.ok, true, JSON.stringify(pdfBoss, null, 2));
assert.equal(pdfBoss.status, "certified");
assert.equal(pdfBoss.issues.length, 0);
assert.equal((pdfAnalysis.pages || []).some((page) => !String(page.text || "").trim()), false);

const optionalSupportResponse = await runHarness({
  reportType: "underwriting",
  userId: "fixture-retest24-optional-support-collapse",
  payload: buildHarnessPayload(inputs, { includeSupport: false, unusableSupport: true }),
});
assert.equal(optionalSupportResponse.statusCode, 200, JSON.stringify(optionalSupportResponse.body, null, 2));
assert.equal(optionalSupportResponse.body?.success, true);
assert.equal(optionalSupportResponse.body?.report_publishable, true);
assert.equal(optionalSupportResponse.body?.customer_publish_eligible, true);
assert.equal(/<tr[^>]*>\s*<td[^>]*>Purchase Price<\/td>\s*<td[^>]*>\$0<\/td>\s*<\/tr>/i.test(String(optionalSupportResponse.body.final_html || "")), false);

const screeningCoreResponse = await runHarness({
  reportType: "screening",
  userId: "fixture-retest24-screening-core",
  payload: buildHarnessPayload(inputs, { includeSupport: false }),
});
const screeningSupportResponse = await runHarness({
  reportType: "screening",
  userId: "fixture-retest24-screening-support-isolation",
  payload: buildHarnessPayload(inputs),
});
assert.equal(screeningCoreResponse.statusCode, 200, JSON.stringify(screeningCoreResponse.body, null, 2));
assert.equal(screeningSupportResponse.statusCode, 200, JSON.stringify(screeningSupportResponse.body, null, 2));
const screeningCoreHtml = String(screeningCoreResponse.body.final_html || "");
const screeningSupportHtml = String(screeningSupportResponse.body.final_html || "");
for (const value of ["$1,500,000", "$555,000", "$945,000", "93.8%", "64"]) {
  assert.match(screeningCoreHtml, new RegExp(escapeRegex(value)));
  assert.match(screeningSupportHtml, new RegExp(escapeRegex(value)));
}
for (const screeningHtml of [screeningCoreHtml, screeningSupportHtml]) {
  assert.match(screeningHtml, /Screening/i);
  assert.equal(/Acquisition Memo|Proposed Acquisition Loan|Lender \/ Origination Fee|Current Outstanding Balance/i.test(stripHtml(screeningHtml)), false);
}

assert.deepEqual(
  {
    contractQa: contractSeal.ok,
    publicationBoss: pdfBoss.ok,
    deliverySeal: acquisitionResponse.body.customer_publish_eligible === true && acquisitionResponse.body.report_publishable === true,
  },
  { contractQa: true, publicationBoss: true, deliverySeal: true },
);

console.log(JSON.stringify({
  fixture: fixture.schema_version,
  acquisitionAuthority: acceptedPurchase.canonical_role,
  currentDebtAuthority: acceptedDebt.canonical_role,
  appraisalAuthority: acceptedAppraisal.canonical_role,
  reconciliation: {
    difference: reconciliation.difference_amount,
    canonicalVariance: reconciliation.variance_pct,
    customerDisplay: fixture.expected.reconciliation.customer_display,
    disclosure: reconciliation.source_reconciliation_disclosure,
  },
  contractQa: contractSeal.status,
  publicationBoss: pdfBoss.status,
  deliverySeal: acquisitionResponse.body.deliveryDecisionState?.status || "publishable",
  pdfPages: pdfAnalysis.pageCount,
  optionalSupportCollapse: optionalSupportResponse.body.customer_publish_eligible,
  screeningIsolation: true,
}, null, 2));
console.log("P0-D RETEST 24 permanent regression replay smoke PASS");
