import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import {
  AI_MODEL_EVAL_01_CANDIDATES,
  OPENAI_MODEL_IDS,
  buildChatCompletionModelControls,
  estimateOpenAiTokenCostUsd,
  normalizeReasoningEffort,
} from '../lib/ai-model-architecture.js';
import { __test__ as qaManagerTest } from '../api/_lib/qa-manager-review.js';

const apiKey = String(process.env.OPENAI_API_KEY || '').trim();
const timeoutMs = Math.max(15_000, Number(process.env.AI_MODEL_EVAL_TIMEOUT_MS) || 90_000);
const repeats = Math.max(1, Math.min(5, Number(process.env.AI_MODEL_EVAL_REPEATS) || 1));
const outputPath = String(process.env.AI_MODEL_EVAL_OUTPUT || '').trim();

if (!apiKey) {
  console.error('AI MODEL EVAL 01 requires OPENAI_API_KEY. No request was sent.');
  process.exit(2);
}

const severityRank = Object.freeze({ info: 0, low: 1, medium: 2, high: 3, critical: 4 });
const realRiskClassifications = new Set([
  'real_parser_or_artifact_risk',
  'real_source_report_contradiction',
  'real_public_language_risk',
]);

const safeDisclosureText = [
  'CORE INPUT COVERAGE CONFIRMED.',
  'Supplemental documents that are not converted into structured report inputs are not used quantitatively.',
  'Unsupported or unstructured uploads remain excluded from modeled outputs.',
  'Capital Risk Profile: Sensitized.',
  'Primary Pressure Point: DSCR of 1.09x constrains refinance capacity below lender thresholds.',
  'Expense Ratio 62.6%. NOI Margin 37.4%. Break-even Occupancy 62.6%.',
  'Standardized underwriting threshold language is shown.',
].join(' ');

const acquisitionCoveragePass = Object.freeze({
  qa_status: 'pass',
  severity: 'info',
  deterministic_flags: [],
  artifact_inventory: {},
  rendered_text_signals: ['acquisition_financing_assumptions'],
  current_debt_state: {
    has_proposed_acquisition_financing: true,
    has_true_current_debt_balance: false,
    current_debt_dscr_status: 'not_assessed',
    current_debt_limitation_reason_code: 'current_debt_balance_not_provided',
  },
  acquisition_assumption_state: {
    acquisition_assumptions_supported: true,
    has_validated_acquisition_assumptions: true,
    current_debt_separated: true,
  },
});

const baseContext = Object.freeze({
  property_name: 'AI Model Eval Property',
  report_type: 'Full Underwriting',
  report_tier: 2,
});

const finding = ({ category = 'support', severity = 'warn', issue, excerpt, suggestedReview }) => ({
  category,
  severity,
  issue,
  excerpt,
  suggested_review: suggestedReview || 'Review the cited evidence and deterministic source state.',
});

const sourceFinding = ({ code, severity = 'medium', message, excerpt, artifactType = 'document_text_extracted' }) => ({
  code,
  severity,
  message,
  evidence: {
    summary: message,
    source: 'source_package_qa_advisory',
    file: 'EvalSource.pdf',
    artifact_type: artifactType,
    excerpt,
  },
  suggested_review: 'Compare the report statement with deterministic source and artifact evidence.',
});

const CASES = Object.freeze([
  Object.freeze({
    id: 'clean_document_constrained_report',
    difficulty: 'standard',
    critical: true,
    html: `<html><body>${safeDisclosureText} Occupancy 93.75%. Effective Gross Income $1,500,000. NOI $945,000.</body></html>`,
    renderedReportQa: { status: 'pass', counts: { total: 0 }, findings: [] },
    sourcePackageQa: { model_status: 'pass', counts: { total: 0 } },
    sourceReportCoverageQa: acquisitionCoveragePass,
    qaFixRouting: { routes: [] },
    reportQaFlags: [],
    expectation: { kind: 'safe' },
  }),
  Object.freeze({
    id: 'unsupported_listing_is_not_quantitative_reliance',
    difficulty: 'hard',
    critical: true,
    html: `<html><body>${safeDisclosureText} Supporting file MarketSurvey.pdf is listed in the Source Register. It is excluded from modeled outputs.</body></html>`,
    renderedReportQa: {
      status: 'warn',
      counts: { total: 1, support: 1 },
      findings: [finding({
        issue: 'An unsupported supporting document is listed.',
        excerpt: 'MarketSurvey.pdf',
        suggestedReview: 'Confirm the unsupported document is not used quantitatively.',
      })],
    },
    sourcePackageQa: {
      model_status: 'warn',
      possible_false_unsupported_docs: [sourceFinding({
        code: 'UNSUPPORTED_DOC_REFERENCE',
        message: 'Supporting document is listed but is excluded from modeled outputs.',
        excerpt: 'MarketSurvey.pdf',
      })],
    },
    sourceReportCoverageQa: acquisitionCoveragePass,
    qaFixRouting: { routes: [] },
    reportQaFlags: [],
    expectation: { kind: 'safe' },
  }),
  Object.freeze({
    id: 'true_unsupported_document_quantitative_reliance',
    difficulty: 'hard',
    critical: true,
    html: '<html><body>Appraisal.pdf did not parse into a validated structured artifact. The modeled valuation nevertheless uses the appraisal value of $13,800,000 as the underwriting value.</body></html>',
    renderedReportQa: {
      status: 'review',
      counts: { total: 1, support: 1 },
      findings: [finding({
        severity: 'critical',
        issue: 'The report quantitatively relies on an unsupported appraisal.',
        excerpt: 'uses the appraisal value of $13,800,000 as the underwriting value',
      })],
    },
    sourcePackageQa: {
      model_status: 'review',
      possible_support_contamination: [sourceFinding({
        code: 'UNSUPPORTED_DOC_RELIANCE',
        severity: 'critical',
        message: 'Unsupported appraisal value appears in modeled outputs.',
        excerpt: '$13,800,000',
      })],
    },
    sourceReportCoverageQa: {
      qa_status: 'review',
      severity: 'critical',
      deterministic_flags: [{
        code: 'UNSUPPORTED_MODELED_SOURCE_RELIANCE',
        severity: 'critical',
        message: 'Modeled output relies on an unsupported source.',
        evidence: { artifact_type: 'appraisal_parsed', value: 13800000 },
      }],
      artifact_inventory: { appraisal_parsed: { present: false } },
      rendered_text_signals: [],
    },
    qaFixRouting: { routes: [] },
    reportQaFlags: [],
    expectation: {
      kind: 'risk',
      allowedClassifications: ['real_source_report_contradiction', 'real_parser_or_artifact_risk'],
      minimumSeverity: 'medium',
    },
  }),
  Object.freeze({
    id: 'validated_acquisition_assumptions_are_not_current_debt',
    difficulty: 'hard',
    critical: true,
    html: `<html><body>${safeDisclosureText} Proposed Acquisition Debt Sizing. Derived Acquisition Loan Amount $10,125,000. This is not current outstanding debt. Current-debt DSCR and refinance capacity were not assessed because no true current debt balance was verified.</body></html>`,
    renderedReportQa: {
      status: 'warn',
      counts: { total: 1, support: 1 },
      findings: [finding({
        issue: 'Acquisition assumptions may be unsupported current debt.',
        excerpt: 'Derived Acquisition Loan Amount $10,125,000',
      })],
    },
    sourcePackageQa: {
      model_status: 'warn',
      acquisition_assumption_state: acquisitionCoveragePass.acquisition_assumption_state,
      source_report_coverage_qa: acquisitionCoveragePass,
      source_report_consistency_findings: [sourceFinding({
        code: 'UNSUPPORTED_ACQUISITION_ASSUMPTIONS',
        message: 'Acquisition assumptions appear unsupported.',
        excerpt: 'Derived Acquisition Loan Amount $10,125,000',
        artifactType: 'loan_term_sheet_parsed',
      })],
    },
    sourceReportCoverageQa: acquisitionCoveragePass,
    qaFixRouting: { routes: [] },
    reportQaFlags: [],
    expectation: { kind: 'safe' },
  }),
  Object.freeze({
    id: 'current_debt_limitation_is_disclosed',
    difficulty: 'hard',
    critical: true,
    html: `<html><body>${safeDisclosureText} Current Debt DSCR: Not assessed. No current debt document provided. Current debt terms were not fully provided. Proposed Acquisition Debt Sizing is shown separately and is not current outstanding debt.</body></html>`,
    renderedReportQa: {
      status: 'warn',
      counts: { total: 1, support: 1 },
      findings: [finding({
        issue: 'Current debt is not assessed.',
        excerpt: 'No current debt document provided.',
      })],
    },
    sourcePackageQa: { model_status: 'pass' },
    sourceReportCoverageQa: acquisitionCoveragePass,
    qaFixRouting: { routes: [] },
    reportQaFlags: [],
    expectation: { kind: 'safe' },
  }),
  Object.freeze({
    id: 'forbidden_investment_recommendation_language',
    difficulty: 'standard',
    critical: true,
    html: '<html><body>Investment Committee Memorandum. Recommendation: BUY. This property should be acquired immediately.</body></html>',
    renderedReportQa: {
      status: 'review',
      counts: { total: 1, compliance: 1, critical: 1 },
      findings: [finding({
        category: 'compliance',
        severity: 'critical',
        issue: 'The public report contains prohibited BUY recommendation language.',
        excerpt: 'Recommendation: BUY.',
      })],
    },
    sourcePackageQa: { model_status: 'pass' },
    sourceReportCoverageQa: { qa_status: 'pass', severity: 'info', deterministic_flags: [] },
    qaFixRouting: { routes: [] },
    reportQaFlags: [{
      code: 'PUBLIC_LANGUAGE_BUY_RECOMMENDATION',
      severity: 'critical',
      message: 'BUY recommendation language is prohibited in customer-facing reports.',
      evidence: { excerpt: 'Recommendation: BUY.' },
    }],
    expectation: {
      kind: 'risk',
      allowedClassifications: ['real_public_language_risk'],
      minimumSeverity: 'high',
    },
  }),
  Object.freeze({
    id: 'deterministic_t12_parser_gap',
    difficulty: 'standard',
    critical: true,
    html: '<html><body>T12 totals are present, but source detail indicates line items that were not captured. NOI $945,000.</body></html>',
    renderedReportQa: { status: 'warn', counts: { total: 0 }, findings: [] },
    sourcePackageQa: {
      model_status: 'warn',
      possible_parser_misses: [sourceFinding({
        code: 'T12_TOTALS_ONLY',
        severity: 'high',
        message: 'T12 line-item detail appears present in the source but was not parsed.',
        excerpt: 'T12 line items not captured',
        artifactType: 't12_parsed',
      })],
    },
    sourceReportCoverageQa: {
      qa_status: 'review',
      severity: 'high',
      deterministic_flags: [{
        code: 'T12_TOTALS_ONLY',
        severity: 'high',
        message: 'T12 contains totals but no parsed income or expense line items.',
        evidence: { t12_parsed: { income_line_count: 0, expense_line_count: 0 } },
      }],
      artifact_inventory: { t12_parsed: { present: true, income_line_count: 0, expense_line_count: 0 } },
      rendered_text_signals: [],
    },
    qaFixRouting: { routes: [{ code: 'T12_TOTALS_ONLY', owner_area: 'parser' }] },
    reportQaFlags: [{
      code: 'T12_TOTALS_ONLY',
      severity: 'high',
      message: 'T12 line-item extraction gap.',
    }],
    expectation: {
      kind: 'risk',
      allowedClassifications: ['real_parser_or_artifact_risk', 'real_source_report_contradiction'],
      minimumSeverity: 'medium',
    },
  }),
  Object.freeze({
    id: 'headline_noi_internal_contradiction',
    difficulty: 'hard',
    critical: true,
    html: '<html><body>Key Metrics Snapshot: NOI $945,000. Operating Performance: NOI $955,000. Effective Gross Income $1,500,000. Operating Expenses $555,000.</body></html>',
    renderedReportQa: {
      status: 'review',
      counts: { total: 1, numbers: 1, critical: 1 },
      findings: [finding({
        category: 'numbers',
        severity: 'critical',
        issue: 'NOI is internally contradictory across the rendered report.',
        excerpt: 'NOI $945,000 ... NOI $955,000',
      })],
    },
    sourcePackageQa: { model_status: 'pass' },
    sourceReportCoverageQa: {
      qa_status: 'review',
      severity: 'critical',
      deterministic_flags: [{
        code: 'HEADLINE_NOI_CONTRADICTION',
        severity: 'critical',
        message: 'Rendered report contains conflicting NOI values.',
        evidence: { canonical_noi: 945000, conflicting_noi: 955000 },
      }],
      artifact_inventory: { t12_parsed: { present: true, net_operating_income: 945000 } },
      rendered_text_signals: [],
    },
    qaFixRouting: { routes: [{ code: 'HEADLINE_NOI_CONTRADICTION', owner_area: 'report_renderer' }] },
    reportQaFlags: [{
      code: 'HEADLINE_NOI_CONTRADICTION',
      severity: 'critical',
      message: 'Conflicting NOI values are rendered.',
    }],
    expectation: {
      kind: 'risk',
      allowedClassifications: ['real_source_report_contradiction', 'real_parser_or_artifact_risk'],
      minimumSeverity: 'high',
    },
  }),
]);

function parseCandidateOverride() {
  const raw = String(process.env.AI_MODEL_EVAL_MODELS || '').trim();
  if (!raw) return AI_MODEL_EVAL_01_CANDIDATES;
  return Object.freeze(raw.split(',').map((entry, index) => {
    const [modelPart, effortPart, scopePart] = entry.split(':').map((value) => String(value || '').trim());
    if (!modelPart) throw new Error(`Invalid AI_MODEL_EVAL_MODELS entry at position ${index + 1}`);
    return Object.freeze({
      label: modelPart.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase(),
      model: modelPart,
      reasoning_effort: effortPart || null,
      scope: scopePart === 'hard' ? 'hard' : 'all',
    });
  }));
}

function buildManagerPayload(testCase) {
  return {
    property_name: baseContext.property_name,
    report_type: baseContext.report_type,
    report_tier: baseContext.report_tier,
    report_qa_flags: Array.isArray(testCase.reportQaFlags) ? testCase.reportQaFlags : [],
    source_report_coverage_qa: testCase.sourceReportCoverageQa || null,
    rendered_report_qa_advisory: testCase.renderedReportQa || null,
    source_package_qa_advisory: testCase.sourcePackageQa || null,
    qa_fix_routing: testCase.qaFixRouting || null,
    rendered_report_text: qaManagerTest.stripHtmlForManager(testCase.html),
  };
}

async function callQaManagerCandidate({ candidate, payload }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();
  try {
    const controls = buildChatCompletionModelControls({
      model: candidate.model,
      reasoningEffort: candidate.reasoning_effort,
    });
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: candidate.model,
        ...controls,
        messages: [
          { role: 'system', content: qaManagerTest.QA_MANAGER_PROMPT },
          { role: 'user', content: JSON.stringify(payload) },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: qaManagerTest.RESPONSE_SCHEMA,
        },
      }),
    });
    const latencyMs = Math.round(performance.now() - startedAt);
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const err = new Error(`OpenAI ${response.status}: ${body.slice(0, 600)}`);
      err.status = response.status;
      err.latency_ms = latencyMs;
      throw err;
    }
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new Error('Empty model response');
    const review = JSON.parse(content);
    return {
      review,
      latency_ms: latencyMs,
      model: data?.model || candidate.model,
      usage: data?.usage || null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

const normalizedWords = (value) => new Set(
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9$%.]+/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 4)
);

function evidenceOverlapScore(excerpt, payloadText) {
  const evidenceWords = normalizedWords(excerpt);
  if (evidenceWords.size === 0) return 0;
  const payloadWords = normalizedWords(payloadText);
  let matched = 0;
  for (const word of evidenceWords) {
    if (payloadWords.has(word)) matched += 1;
  }
  return matched / evidenceWords.size;
}

function evaluateCase(testCase, reviewResult) {
  const payload = buildManagerPayload(testCase);
  const payloadText = JSON.stringify(payload);
  const decisions = qaManagerTest.normalizeManagerDecisions(reviewResult.review?.decisions, {
    renderedText: payload.rendered_report_text,
    sourceReportCoverageQa: testCase.sourceReportCoverageQa,
    sourcePackageQa: testCase.sourcePackageQa,
  });
  const expectation = testCase.expectation || { kind: 'safe' };
  const realRisks = decisions.filter((decision) => realRiskClassifications.has(decision.classification));
  const blockingDecisions = decisions.filter((decision) => (
    decision.blocks_customer_delivery || decision.blocks_public_sample || decision.blocks_high_value_outreach
  ));

  let expectationPassed = false;
  let expectationReason = '';
  if (expectation.kind === 'safe') {
    expectationPassed = realRisks.length === 0 && blockingDecisions.length === 0;
    expectationReason = expectationPassed
      ? 'No real-risk or blocking decision survived production normalization.'
      : `Safe case produced ${realRisks.length} real-risk and ${blockingDecisions.length} blocking decisions.`;
  } else {
    const allowed = new Set(expectation.allowedClassifications || []);
    const minimumSeverity = severityRank[expectation.minimumSeverity] ?? severityRank.medium;
    const matched = decisions.filter((decision) => (
      allowed.has(decision.classification) && (severityRank[decision.severity] ?? 0) >= minimumSeverity
    ));
    expectationPassed = matched.length > 0;
    expectationReason = expectationPassed
      ? `Detected expected risk via ${matched.map((decision) => decision.classification).join(', ')}.`
      : `No decision matched expected classifications: ${[...allowed].join(', ')}.`;
  }

  const riskEvidence = realRisks.map((decision) => ({
    classification: decision.classification,
    excerpt: decision.evidence_excerpt,
    overlap: evidenceOverlapScore(decision.evidence_excerpt, payloadText),
  }));
  const evidenceGroundingFailures = riskEvidence.filter((row) => !row.excerpt || row.overlap < 0.2).length;

  const decisionText = JSON.stringify(decisions).toLowerCase();
  const replacementValueViolation = /(?:replace|change|set|use|should be)[^$]{0,40}\$\s*\d/.test(decisionText);
  const authorityViolation = expectation.kind === 'safe' && (realRisks.length > 0 || blockingDecisions.length > 0);

  return {
    expectation_passed: expectationPassed,
    expectation_reason: expectationReason,
    authority_violation: authorityViolation,
    evidence_grounding_failures: evidenceGroundingFailures,
    replacement_financial_value_violation: replacementValueViolation,
    decision_count: decisions.length,
    real_risk_count: realRisks.length,
    blocking_decision_count: blockingDecisions.length,
    risk_evidence: riskEvidence,
    decisions,
  };
}

function percentile(values, p) {
  const rows = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!rows.length) return null;
  const index = Math.min(rows.length - 1, Math.max(0, Math.ceil((p / 100) * rows.length) - 1));
  return rows[index];
}

function aggregateCandidate(candidate, runs) {
  const completed = runs.filter((run) => !run.error);
  const passed = completed.filter((run) => run.evaluation?.expectation_passed).length;
  const criticalFailures = completed.filter((run) => run.critical && !run.evaluation?.expectation_passed).length;
  const authorityViolations = completed.reduce((sum, run) => sum + (run.evaluation?.authority_violation ? 1 : 0), 0);
  const groundingFailures = completed.reduce((sum, run) => sum + (run.evaluation?.evidence_grounding_failures || 0), 0);
  const replacementValueViolations = completed.reduce((sum, run) => sum + (run.evaluation?.replacement_financial_value_violation ? 1 : 0), 0);
  const apiErrors = runs.filter((run) => run.error).length;
  const inputTokens = completed.reduce((sum, run) => sum + Number(run.usage?.prompt_tokens || 0), 0);
  const outputTokens = completed.reduce((sum, run) => sum + Number(run.usage?.completion_tokens || 0), 0);
  const costUsd = estimateOpenAiTokenCostUsd({ model: candidate.model, inputTokens, outputTokens });
  const latencies = completed.map((run) => run.latency_ms).filter(Number.isFinite);
  const passRate = completed.length ? passed / completed.length : 0;
  const eligibleForPromotion = (
    completed.length > 0 &&
    apiErrors === 0 &&
    criticalFailures === 0 &&
    authorityViolations === 0 &&
    replacementValueViolations === 0 &&
    passRate >= 0.875
  );
  const qualityScore = Math.max(0, Math.round(
    passRate * 100 -
    criticalFailures * 25 -
    authorityViolations * 25 -
    groundingFailures * 4 -
    replacementValueViolations * 25 -
    apiErrors * 20
  ));

  return {
    label: candidate.label,
    requested_model: candidate.model,
    reasoning_effort: candidate.reasoning_effort,
    scope: candidate.scope,
    attempted_runs: runs.length,
    completed_runs: completed.length,
    api_errors: apiErrors,
    passed_expectations: passed,
    pass_rate: Number(passRate.toFixed(4)),
    critical_failures: criticalFailures,
    authority_violations: authorityViolations,
    evidence_grounding_failures: groundingFailures,
    replacement_financial_value_violations: replacementValueViolations,
    quality_score: qualityScore,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    estimated_standard_cost_usd: costUsd === null ? null : Number(costUsd.toFixed(6)),
    average_latency_ms: latencies.length ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length) : null,
    p95_latency_ms: percentile(latencies, 95),
    eligible_for_promotion: eligibleForPromotion,
  };
}

function chooseProvisionalWinner(summaries) {
  const comparable = summaries.filter((summary) => summary.scope === 'all' && summary.label !== 'baseline_gpt4o');
  const eligible = comparable.filter((summary) => summary.eligible_for_promotion);
  if (!eligible.length) return null;
  eligible.sort((a, b) => {
    if (b.quality_score !== a.quality_score) return b.quality_score - a.quality_score;
    if (b.pass_rate !== a.pass_rate) return b.pass_rate - a.pass_rate;
    const costA = Number.isFinite(a.estimated_standard_cost_usd) ? a.estimated_standard_cost_usd : Number.POSITIVE_INFINITY;
    const costB = Number.isFinite(b.estimated_standard_cost_usd) ? b.estimated_standard_cost_usd : Number.POSITIVE_INFINITY;
    return costA - costB;
  });
  return eligible[0].label;
}

const candidates = parseCandidateOverride();
const runRows = [];
console.log(`AI MODEL EVAL 01: ${candidates.length} candidates, ${CASES.length} cases, ${repeats} repeat(s)`);

for (const candidate of candidates) {
  const casesForCandidate = candidate.scope === 'hard'
    ? CASES.filter((testCase) => testCase.difficulty === 'hard')
    : CASES;
  const normalizedEffort = normalizeReasoningEffort(candidate.reasoning_effort, {
    model: candidate.model,
    fallback: candidate.model === OPENAI_MODEL_IDS.GPT_6_ASTRA ? 'low' : null,
  });
  const resolvedCandidate = { ...candidate, reasoning_effort: normalizedEffort };

  console.log(`\n[${candidate.label}] ${candidate.model}${normalizedEffort ? ` / reasoning=${normalizedEffort}` : ''} / scope=${candidate.scope}`);
  for (const testCase of casesForCandidate) {
    for (let repeat = 1; repeat <= repeats; repeat += 1) {
      process.stdout.write(`  ${testCase.id} [${repeat}/${repeats}] ... `);
      try {
        const payload = buildManagerPayload(testCase);
        const result = await callQaManagerCandidate({ candidate: resolvedCandidate, payload });
        const evaluation = evaluateCase(testCase, result);
        const row = {
          candidate: candidate.label,
          requested_model: candidate.model,
          returned_model: result.model,
          reasoning_effort: normalizedEffort,
          case_id: testCase.id,
          difficulty: testCase.difficulty,
          critical: testCase.critical,
          repeat,
          latency_ms: result.latency_ms,
          usage: result.usage,
          evaluation,
        };
        runRows.push(row);
        console.log(`${evaluation.expectation_passed ? 'PASS' : 'FAIL'} (${result.latency_ms}ms)`);
      } catch (error) {
        const row = {
          candidate: candidate.label,
          requested_model: candidate.model,
          reasoning_effort: normalizedEffort,
          case_id: testCase.id,
          difficulty: testCase.difficulty,
          critical: testCase.critical,
          repeat,
          latency_ms: Number(error?.latency_ms) || null,
          error: {
            name: error?.name || 'Error',
            message: String(error?.message || error).slice(0, 1000),
            status: Number(error?.status) || null,
          },
        };
        runRows.push(row);
        console.log(`ERROR ${row.error.message}`);
      }
    }
  }
}

const summaries = candidates.map((candidate) => (
  aggregateCandidate(candidate, runRows.filter((run) => run.candidate === candidate.label))
));
const baselineSummary = summaries.find((summary) => summary.label === 'baseline_gpt4o') || null;
const provisionalWinner = chooseProvisionalWinner(summaries);
const astraCeiling = summaries.find((summary) => summary.requested_model === OPENAI_MODEL_IDS.GPT_6_ASTRA) || null;

const report = {
  eval: 'AI_MODEL_EVAL_01_QA_MANAGER_SHADOW_BENCHMARK',
  generated_at: new Date().toISOString(),
  production_mutation: false,
  default_repeats: repeats,
  timeout_ms: timeoutMs,
  case_count: CASES.length,
  candidate_summaries: summaries,
  baseline_summary: baselineSummary,
  provisional_winner: provisionalWinner,
  astra_quality_ceiling: astraCeiling,
  promotion_rule: 'No production promotion unless candidate has zero critical failures, zero authority violations, zero replacement-value violations, zero API errors, and at least 87.5% case pass rate. Compare candidate quality against the baseline before activation.',
  runs: runRows,
};

console.log('\n=== AI MODEL EVAL 01 SUMMARY ===');
for (const summary of summaries) {
  console.log([
    summary.label,
    `pass=${(summary.pass_rate * 100).toFixed(1)}%`,
    `critical_failures=${summary.critical_failures}`,
    `authority_violations=${summary.authority_violations}`,
    `grounding_failures=${summary.evidence_grounding_failures}`,
    `api_errors=${summary.api_errors}`,
    `quality=${summary.quality_score}`,
    `cost=${summary.estimated_standard_cost_usd === null ? 'n/a' : `$${summary.estimated_standard_cost_usd.toFixed(4)}`}`,
    `promotion=${summary.eligible_for_promotion ? 'ELIGIBLE' : 'HOLD'}`,
  ].join(' | '));
}
console.log(`Provisional winner: ${provisionalWinner || 'NONE - keep current authority'}`);

if (outputPath) {
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Detailed report written to ${outputPath}`);
} else {
  console.log('\nSet AI_MODEL_EVAL_OUTPUT to write the detailed JSON report to disk.');
}

if (summaries.some((summary) => summary.api_errors > 0)) process.exitCode = 1;
