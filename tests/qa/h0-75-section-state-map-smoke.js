import assert from "node:assert/strict";
import { TERMINAL_FAILURE_CODES } from "../../lib/terminal-failure-taxonomy.js";
import { buildTerminalFailureSectionStateMap } from "../../api/_lib/terminal-failure-section-state-map.js";

const tier1Map = buildTerminalFailureSectionStateMap({
  issueCodes: [TERMINAL_FAILURE_CODES.CORE_T12_CATASTROPHICALLY_UNUSABLE],
});

assert.equal(tier1Map.report_state, "blocked");
assert.equal(tier1Map.section_states.t12.state, "blocked");
assert.equal(tier1Map.section_states.rent_roll.state, "blocked");
assert.equal(tier1Map.section_states.source_truth_package.state, "blocked");
assert.equal(tier1Map.section_states.customer_delivery.state, "blocked");

const tier2Map = buildTerminalFailureSectionStateMap({
  issueCodes: [TERMINAL_FAILURE_CODES.REPORT_CONTRACT_FAILED],
});

assert.equal(tier2Map.report_state, "qualified");
assert.equal(tier2Map.section_states.report.state, "qualified");
assert.equal(tier2Map.section_states.report_contract.state, "qualified");
assert.equal(tier2Map.section_states.customer_surface.state, "collapsed");
assert.equal(tier2Map.section_states.qa.state, "omitted_not_applicable");
assert.equal(tier2Map.section_states.report_contract.source_codes[0], TERMINAL_FAILURE_CODES.REPORT_CONTRACT_FAILED);

const tier3Map = buildTerminalFailureSectionStateMap({
  issueCodes: [TERMINAL_FAILURE_CODES.REPORT_RENDER_FAILED, TERMINAL_FAILURE_CODES.PDF_ARTIFACT_FAILED],
});

assert.equal(tier3Map.publication_state, "recovery_required");
assert.equal(tier3Map.delivery_state, "blocked_pending_recovery");
assert.equal(tier3Map.section_states.renderer.state, "recovery_required");
assert.equal(tier3Map.section_states.pdf_artifact.state, "blocked_pending_recovery");
assert.equal(tier3Map.section_states.storage_publication.state, "blocked_pending_recovery");
assert.equal(tier3Map.section_states.delivery_gate.state, "blocked_pending_recovery");

console.log("h0-75 section state map smoke PASS");
