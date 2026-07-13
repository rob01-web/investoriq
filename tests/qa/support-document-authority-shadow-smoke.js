import assert from "node:assert/strict";
import {
  buildSupportDocumentAuthorityDecision,
  buildSupportDocumentAuthorityShadowComparison,
} from "../../api/_lib/support-document-authority-adjudicator.js";

function decide(fileId, originalFilename, sourceText, legacyRole = null) {
  const artifacts = [
    {
      file_id: fileId,
      original_filename: originalFilename,
      type: "document_text_extracted",
      payload: { file_id: fileId, original_filename: originalFilename, document_text_extracted: sourceText },
    },
  ];
  return {
    decision: buildSupportDocumentAuthorityDecision({ file: { file_id: fileId, original_filename: originalFilename }, artifacts }),
    comparison: buildSupportDocumentAuthorityShadowComparison({
      file: { file_id: fileId, original_filename: originalFilename },
      artifacts,
      legacyDecision: legacyRole ? { semantic_doc_role: legacyRole } : null,
    }),
  };
}

const scenarios = [
  {
    name: "affirmative acquisition financing",
    text: "Purchase assumptions / proposed acquisition financing. Purchase Price $13,500,000. Proposed Loan $9,450,000. LTV 70%.",
    family: "acquisition_financing",
    role: "purchase_assumptions",
  },
  {
    name: "affirmative current debt",
    text: "Existing current debt statement. Current outstanding balance $6,800,000. Monthly payment $39,250. Maturity date 2029-11-01.",
    family: "current_debt",
    role: "current_debt_context",
  },
  {
    name: "appraisal reference does not become acquisition",
    text: "Appraisal Summary. Appraised Value $14,200,000. This appraisal should not override purchase assumptions.",
    family: "appraisal",
    role: "appraisal_context",
  },
  {
    name: "current debt reference does not become proposed financing",
    text: "Existing current debt statement. Current outstanding balance $6,800,000. This debt is separate from proposed acquisition financing.",
    family: "current_debt",
    role: "current_debt_context",
  },
  {
    name: "mixed current and proposed financing remains ambiguous",
    text: "Current outstanding balance $6,800,000. Proposed acquisition loan $9,450,000. LTV 70%.",
    family: null,
    role: null,
    ambiguous: true,
  },
];

for (const scenario of scenarios) {
  const { decision, comparison } = decide(`file-${scenario.name}`, `${scenario.name}.pdf`, scenario.text, "purchase_assumptions");
  assert.equal(decision.mode, "shadow");
  assert.equal(decision.canonicalFamily, scenario.family, scenario.name);
  assert.equal(decision.canonicalRole, scenario.role, scenario.name);
  assert.equal(decision.ambiguity.present, scenario.ambiguous === true, scenario.name);
  assert.equal(decision.roleAccepted, false);
  assert.equal(decision.sourceBacked, false);
  assert.equal(decision.sectionDisplayReady, false);
  assert.equal(comparison.affectsAcceptedAuthority, false);
}

console.log("support-document-authority shadow smoke PASS");
