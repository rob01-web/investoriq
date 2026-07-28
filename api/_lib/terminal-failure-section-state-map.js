import { TERMINAL_FAILURE_TIER_MAP } from "./terminal-failure-tier-map.js";

const CORE_SECTION_KEYS = Object.freeze(["report", "t12", "rent_roll", "source_truth_package", "customer_delivery"]);
const TIER2_SECTION_STATE_BY_KEY = Object.freeze({
  report_contract: "qualified",
  customer_surface: "collapsed",
  qa: "omitted_not_applicable",
});
const TIER3_SECTION_STATE_BY_KEY = Object.freeze({
  renderer: "recovery_required",
  pdf_artifact: "blocked_pending_recovery",
  storage_publication: "blocked_pending_recovery",
  delivery_gate: "blocked_pending_recovery",
});
const DEFAULT_STATE = "rendered";

function normalizeCodes(codes = []) {
  return [...new Set((Array.isArray(codes) ? codes : []).map((code) => String(code || "").trim().toUpperCase()).filter(Boolean))];
}

function createSectionState(state = DEFAULT_STATE, sourceCodes = []) {
  return Object.freeze({
    state,
    source_codes: Object.freeze([...new Set(sourceCodes)]),
  });
}

function applyState(sectionStates, key, state, code) {
  const current = sectionStates[key] || createSectionState();
  const sourceCodes = current.source_codes.includes(code) ? current.source_codes : [...current.source_codes, code];
  sectionStates[key] = createSectionState(state, sourceCodes);
}

export function buildTerminalFailureSectionStateMap({ issueCodes = [] } = {}) {
  const codes = normalizeCodes(issueCodes);
  const sectionStates = {
    report: createSectionState(),
    t12: createSectionState(),
    rent_roll: createSectionState(),
    source_truth_package: createSectionState(),
    customer_delivery: createSectionState(),
    report_contract: createSectionState(),
    customer_surface: createSectionState(),
    qa: createSectionState(),
    renderer: createSectionState(),
    pdf_artifact: createSectionState(),
    storage_publication: createSectionState(),
    delivery_gate: createSectionState(),
  };

  for (const code of codes) {
    const descriptor = TERMINAL_FAILURE_TIER_MAP[code] || null;
    if (!descriptor) continue;

    if (descriptor.tier === 1) {
      for (const key of CORE_SECTION_KEYS) {
        applyState(sectionStates, key, "blocked", code);
      }
      continue;
    }

    if (descriptor.tier === 2) {
      for (const key of descriptor.affected_sections || []) {
        const state = TIER2_SECTION_STATE_BY_KEY[key];
        if (state) applyState(sectionStates, key, state, code);
      }
      continue;
    }

    if (descriptor.tier === 3) {
      for (const key of descriptor.affected_sections || []) {
        const state = TIER3_SECTION_STATE_BY_KEY[key];
        if (state) applyState(sectionStates, key, state, code);
      }
      continue;
    }
  }

  const hasTier1 = codes.some((code) => (TERMINAL_FAILURE_TIER_MAP[code] || {}).tier === 1);
  const hasTier3 = codes.some((code) => (TERMINAL_FAILURE_TIER_MAP[code] || {}).tier === 3);

  return Object.freeze({
    report_state: hasTier1 ? "blocked" : DEFAULT_STATE,
    publication_state: hasTier3 ? "recovery_required" : DEFAULT_STATE,
    delivery_state: hasTier3 ? "blocked_pending_recovery" : DEFAULT_STATE,
    section_states: Object.freeze(sectionStates),
    issue_codes: Object.freeze(codes),
  });
}
