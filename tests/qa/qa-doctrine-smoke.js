import assert from "node:assert/strict";
import {
  INVESTORIQ_QA_DOCTRINE,
  containsProhibitedPublicLanguage,
  isAllowedMethodologyOnlyText,
  isFilenameHintOnlyText,
} from "../../api/_lib/investoriq-qa-doctrine.js";
import { __test__ as renderedQaTest } from "../../api/_lib/qa-review.js";
import { __test__ as sourcePackageQaTest } from "../../api/_lib/source-package-qa.js";
import { __test__ as qaManagerTest } from "../../api/_lib/qa-manager-review.js";

assert.equal(
  isAllowedMethodologyOnlyText({
    category: "compliance",
    excerpt: "InvestorIQ estimates are document-backed and framework-constrained.",
    suggested_review: "Review whether this implies guaranteed accuracy.",
  }),
  true
);

assert.equal(containsProhibitedPublicLanguage("BUY this property."), true);
assert.equal(containsProhibitedPublicLanguage("This report is document-backed and deterministic."), false);

assert.equal(
  isFilenameHintOnlyText({
    message: "Filename token UNSUPPORTED may imply unsupported file.",
    evidence: { file: "UNSUPPORTED_capex.xlsx" },
  }),
  true
);

assert.match(INVESTORIQ_QA_DOCTRINE, /unsupported\/unstructured uploads may be listed and explicitly excluded from modeled outputs/i);
assert.match(sourcePackageQaTest.SOURCE_PACKAGE_QA_PROMPT, /Filename and upload-slot tokens are never source truth/i);
assert.match(sourcePackageQaTest.SOURCE_PACKAGE_QA_PROMPT, /source_report_coverage_qa\.artifact_inventory/i);
assert.match(qaManagerTest.QA_MANAGER_PROMPT, /Deterministic evidence and actual rendered excerpts outrank speculative AI suggestions/i);
assert.match(renderedQaTest.SYSTEM_PROMPT, /INVESTORIQ QA DOCTRINE - LAUNCH VERSION/i);

const managerDecisionProperties =
  qaManagerTest.RESPONSE_SCHEMA.schema.properties.decisions.items.properties;
assert.equal(Object.hasOwn(managerDecisionProperties, "replacement_financial_value"), false);
assert.equal(Object.hasOwn(managerDecisionProperties, "mutated_report_copy"), false);
assert.equal(qaManagerTest.RESPONSE_SCHEMA.schema.properties.decisions.items.additionalProperties, false);

console.log("qa-doctrine smoke PASS");
