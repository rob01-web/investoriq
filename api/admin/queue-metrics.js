import { createClient } from '@supabase/supabase-js';
import { classifyDiagnosticOwnerArea } from '../_lib/validator-diagnostics-rollup.js';

const severityRank = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };

// ──────────────────────────────────────────────────────────────────────────
// DIAGNOSTICS INTELLIGENCE ROLLUP (Slice 1 — additive, read-only)
// Aggregates diagnostic / action / violation / finding codes across recent
// analysis_artifacts of these types:
//     qa_action_plan
//     report_contract_qa
//     source_report_coverage_qa
//     validator_diagnostics_rollup
// Returns one row per distinct code with 7d/30d counts, owner area,
// example job_ids (capped at 5), and the three doctrine readiness blockers.
// ──────────────────────────────────────────────────────────────────────────
const ROLLUP_ARTIFACT_TYPES = [
  'qa_action_plan',
  'report_contract_qa',
  'source_report_coverage_qa',
  'validator_diagnostics_rollup',
];

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

// Returns `value` when it is a real boolean, otherwise the fallback. Critical
// for blocker precedence: an artifact that explicitly says `blocks_* === false`
// must NOT be overridden by a severity-derived heuristic. Only when the field
// is absent or non-boolean do we fall back.
function explicitBooleanOr(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function severityIsHigher(candidate, current) {
  return severityRank[normalizeSeverity(candidate)] > severityRank[normalizeSeverity(current)];
}

function classifyOwnerSafe(code) {
  try {
    const area = classifyDiagnosticOwnerArea(code);
    if (area && typeof area === 'string') return area;
    if (area && typeof area === 'object' && area.owner_area) return area.owner_area;
    return null;
  } catch (_) {
    return null;
  }
}

// Pulls every diagnostic-shaped record out of an artifact payload regardless
// of its specific shape. Each yielded item carries the four normalized fields
// the rollup needs.
function extractCodesFromArtifact(type, payload = {}) {
  const out = [];
  if (!payload || typeof payload !== 'object') return out;

  const push = ({ code, section, severity, blocks_customer_delivery, blocks_public_sample, blocks_high_value_outreach }) => {
    if (!code || typeof code !== 'string') return;
    out.push({
      code,
      section: section && typeof section === 'string' ? section : null,
      severity: severity || null,
      blocks_customer_delivery: Boolean(blocks_customer_delivery),
      blocks_public_sample: Boolean(blocks_public_sample),
      blocks_high_value_outreach: Boolean(blocks_high_value_outreach),
    });
  };

  // qa_action_plan: { prioritized_actions: [{ code, section, severity, blocks_* }] }
  if (type === 'qa_action_plan') {
    for (const action of safeArray(payload.prioritized_actions)) {
      push({
        code: action?.code,
        section: action?.section || action?.owner_area || null,
        severity: action?.severity,
        blocks_customer_delivery: action?.blocks_customer_delivery,
        blocks_public_sample: action?.blocks_public_sample,
        blocks_high_value_outreach: action?.blocks_high_value_outreach,
      });
    }
    return out;
  }

  // report_contract_qa: { violations: [{ code, severity, section, blocks_* }] }
  // Doctrine: explicit blocker booleans on the artifact item win. Severity
  // is ONLY a fallback when the field is absent. An explicit `false` (e.g.
  // a disclose-only contract violation at high severity) must NOT be
  // promoted to a customer blocker.
  if (type === 'report_contract_qa') {
    for (const v of safeArray(payload.violations)) {
      const sevRank = severityRank[normalizeSeverity(v?.severity)];
      // Conservative fallback for customer delivery: critical-only.
      // High-severity contract violations are NOT auto-promoted to
      // customer blockers — only explicit artifact intent or true core
      // (critical) severity routes there.
      const fallbackCustomerBlock = sevRank >= severityRank.critical;
      const fallbackPublicBlock = sevRank >= severityRank.medium;
      const fallbackOutreachBlock = sevRank >= severityRank.medium;
      push({
        code: v?.code,
        section: v?.section || v?.contract || null,
        severity: v?.severity,
        blocks_customer_delivery: explicitBooleanOr(v?.blocks_customer_delivery, fallbackCustomerBlock),
        blocks_public_sample: explicitBooleanOr(v?.blocks_public_sample, fallbackPublicBlock),
        blocks_high_value_outreach: explicitBooleanOr(v?.blocks_high_value_outreach, fallbackOutreachBlock),
      });
    }
    return out;
  }

  // source_report_coverage_qa: { findings: [{ code, section, severity, blocks_* }] }
  // Same explicit-first behavior. Conservative fallback: only critical
  // severity blocks customer delivery; medium+ blocks public/outreach.
  // Explicit `false` from the artifact is preserved.
  if (type === 'source_report_coverage_qa') {
    for (const f of safeArray(payload.findings)) {
      const sevRank = severityRank[normalizeSeverity(f?.severity)];
      const fallbackCustomerBlock = sevRank >= severityRank.critical;
      const fallbackPublicBlock = sevRank >= severityRank.medium;
      const fallbackOutreachBlock = sevRank >= severityRank.medium;
      push({
        code: f?.code,
        section: f?.section || null,
        severity: f?.severity,
        blocks_customer_delivery: explicitBooleanOr(f?.blocks_customer_delivery, fallbackCustomerBlock),
        blocks_public_sample: explicitBooleanOr(f?.blocks_public_sample, fallbackPublicBlock),
        blocks_high_value_outreach: explicitBooleanOr(f?.blocks_high_value_outreach, fallbackOutreachBlock),
      });
    }
    return out;
  }

  // validator_diagnostics_rollup: per-job summary, can include
  // { codes: [...], top_codes: [...], items: [{ code, severity, section }] }
  if (type === 'validator_diagnostics_rollup') {
    const items = safeArray(payload.items).length ? safeArray(payload.items)
      : safeArray(payload.codes).length ? safeArray(payload.codes).map((c) => ({ code: c }))
      : safeArray(payload.top_codes).map((c) => (typeof c === 'string' ? { code: c } : c));
    for (const item of items) {
      push({
        code: item?.code,
        section: item?.section || null,
        severity: item?.severity,
        blocks_customer_delivery: item?.blocks_customer_delivery,
        blocks_public_sample: item?.blocks_public_sample,
        blocks_high_value_outreach: item?.blocks_high_value_outreach,
      });
    }
    return out;
  }

  return out;
}

async function buildDiagnosticsRollup(supabase) {
  const now = Date.now();
  const since30d = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since7d = now - 7 * 24 * 60 * 60 * 1000;

  const { data: rows, error } = await supabase
    .from('analysis_artifacts')
    .select('job_id, type, payload, created_at')
    .in('type', ROLLUP_ARTIFACT_TYPES)
    .gte('created_at', since30d)
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error) {
    return { ok: false, error: error.message || 'rollup_query_failed' };
  }

  // Aggregate: one entry per code
  const byCode = new Map();
  for (const row of rows || []) {
    if (!row?.type || !row?.payload) continue;
    const createdAtMs = row.created_at ? Date.parse(row.created_at) : 0;
    const items = extractCodesFromArtifact(row.type, row.payload);
    for (const item of items) {
      const key = item.code;
      let entry = byCode.get(key);
      if (!entry) {
        entry = {
          code: key,
          owner_area: classifyOwnerSafe(key),
          section: item.section || null,
          severity: 'none',
          count_7d: 0,
          count_30d: 0,
          example_job_ids: [],
          _job_set: new Set(),
          blocks_customer_delivery: false,
          blocks_public_sample: false,
          blocks_high_value_outreach: false,
        };
        byCode.set(key, entry);
      }
      entry.count_30d += 1;
      if (createdAtMs >= since7d) entry.count_7d += 1;
      if (severityIsHigher(item.severity, entry.severity)) {
        entry.severity = normalizeSeverity(item.severity);
      }
      if (item.section && !entry.section) entry.section = item.section;
      if (item.blocks_customer_delivery) entry.blocks_customer_delivery = true;
      if (item.blocks_public_sample) entry.blocks_public_sample = true;
      if (item.blocks_high_value_outreach) entry.blocks_high_value_outreach = true;
      if (row.job_id && !entry._job_set.has(row.job_id) && entry.example_job_ids.length < 5) {
        entry._job_set.add(row.job_id);
        entry.example_job_ids.push(row.job_id);
      }
    }
  }

  // Strip the helper Set before returning + final shape
  const rollup = Array.from(byCode.values())
    .map(({ _job_set, ...rest }) => ({
      ...rest,
      section: rest.section || 'Unclassified',
      severity: rest.severity === 'none' ? 'low' : rest.severity,
    }))
    .sort((a, b) =>
      severityRank[b.severity] - severityRank[a.severity] ||
      b.count_7d - a.count_7d ||
      b.count_30d - a.count_30d
    );

  return { ok: true, rollup };
}

function normalizeSeverity(value) {
  const severity = String(value || "").toLowerCase();
  return Object.prototype.hasOwnProperty.call(severityRank, severity) ? severity : "low";
}

function highestSeverityValue(values = []) {
  return (Array.isArray(values) ? values : []).reduce(
    (highest, value) =>
      severityRank[normalizeSeverity(value)] > severityRank[highest]
        ? normalizeSeverity(value)
        : highest,
    "none"
  );
}

function normalizeActionPlan(plan = {}) {
  const prioritizedActions = Array.isArray(plan?.prioritized_actions) ? plan.prioritized_actions : [];
  const topAction = prioritizedActions[0] || null;
  const hierarchy = plan?.readiness_hierarchy && typeof plan.readiness_hierarchy === 'object'
    ? plan.readiness_hierarchy
    : null;
  return {
    top_action_code: topAction?.code || null,
    top_action_title: topAction?.title || null,
    recommended_next_step: topAction?.recommended_next_step || null,
    owner_area: topAction?.owner_area || null,
    highest_severity: plan?.highest_severity || highestSeverityValue(prioritizedActions.map((action) => action?.severity)),
    customer_delivery_ready: Boolean(plan?.customer_delivery_ready),
    public_sample_ready: Boolean(plan?.public_sample_ready),
    high_value_outreach_ready: Boolean(plan?.high_value_outreach_ready),
    requires_code_patch: Boolean(plan?.action_counts?.requires_code_patch || prioritizedActions.some((action) => action?.requires_code_patch)),
    requires_regeneration: Boolean(plan?.regenerate_recommended || prioritizedActions.some((action) => action?.requires_regeneration)),
    readiness_hierarchy: hierarchy,
  };
}

function normalizeFixQueueDisplay(raw = {}) {
  const candidateCode = String(
    raw?.top_action_code ||
    raw?.code ||
    raw?.reason_code ||
    raw?.source_code ||
    ''
  ).trim();
  const codeLower = candidateCode.toLowerCase();
  const rentRollMismatch = codeLower === 'rent_roll_vs_t12_gpr_discrepancy';
  if (rentRollMismatch) {
    return {
      display_title: 'Rent roll source totals require verification',
      display_reason: 'The unit-level rent roll totals do not reconcile cleanly against the rent roll summary totals and T12 gross potential rent. Admin review is required before delivery.',
      display_next_step: 'Review rent roll unit rows, rent roll summary totals, and T12 GPR. Confirm which source total should control before regenerating.',
      display_category: 'Source verification',
      display_priority: 'Admin review required',
    };
  }
  const deliveryGateStatus = String(raw?.delivery_gate_status || '').toLowerCase();
  const customerReady = Boolean(raw?.customer_delivery_ready);
  const publicReady = Boolean(raw?.public_sample_ready);
  const outreachReady = Boolean(raw?.high_value_outreach_ready);
  const hierarchyPriority =
    deliveryGateStatus === 'admin_review_required'
      ? 'Internal review required'
      : deliveryGateStatus === 'user_needs_documents'
      ? 'Internal documents required'
      : customerReady && publicReady && outreachReady
      ? 'Delivery gate ready'
      : customerReady && !publicReady && !outreachReady
      ? 'Delivery gate ready (distribution context flags)'
      : customerReady && publicReady && !outreachReady
      ? 'Delivery gate ready (distribution context flags)'
      : raw?.highest_severity || null;
  return {
    display_title: raw?.top_action_title || null,
    display_reason: raw?.display_reason || null,
    display_next_step: raw?.recommended_next_step || null,
    display_category: raw?.owner_area || null,
    display_priority: hierarchyPriority,
  };
}

function compactArtifactSummary(row = {}) {
  const payload = row?.payload || {};
  const type = String(row?.type || '').toLowerCase();
  if (type === 'worker_event') {
    return String(
      payload.message ||
      payload.reason ||
      payload.stage ||
      payload.event ||
      'Worker event'
    );
  }
  if (type === 'status_transition') {
    return `Transition ${payload.from_status || 'unknown'} -> ${payload.to_status || 'unknown'}`;
  }
  if (type === 'delivery_gate_decision') {
    return `Gate ${payload.delivery_gate_status || 'unknown'}${payload.reason_code ? ` - ${payload.reason_code}` : ''}`;
  }
  if (type === 'qa_action_plan') {
    return `QA action plan${payload.delivery_recommendation ? ` - ${payload.delivery_recommendation}` : ''}`;
  }
  if (type === 'report_contract_qa') {
    const count = Array.isArray(payload.violations) ? payload.violations.length : 0;
    return `Report contract QA${payload.contract_status ? ` - ${payload.contract_status}` : ''}${count ? ` - ${count} violation${count === 1 ? '' : 's'}` : ''}`;
  }
  if (type === 'qa_director_review') {
    return `QA director review${payload.overall_director_decision ? ` - ${payload.overall_director_decision}` : ''}`;
  }
  if (type === 'report_qa_flags') {
    return `QA flags${payload.qa_status ? ` - ${payload.qa_status}` : ''}${payload.severity ? ` - ${payload.severity}` : ''}`;
  }
  return type || 'artifact';
}

function compactAction(action = {}) {
  return {
    code: action?.code || null,
    title: action?.title || null,
    action_type: action?.action_type || null,
    owner_area: action?.owner_area || null,
    severity: action?.severity || null,
    blocks_customer_delivery: Boolean(action?.blocks_customer_delivery),
    blocks_public_sample: Boolean(action?.blocks_public_sample),
    blocks_high_value_outreach: Boolean(action?.blocks_high_value_outreach),
    requires_code_patch: Boolean(action?.requires_code_patch),
    requires_regeneration: Boolean(action?.requires_regeneration),
    recommended_next_step: action?.recommended_next_step || null,
  };
}

function compactFinding(finding = {}) {
  return {
    code: finding?.code || null,
    title: finding?.title || null,
    severity: finding?.severity || null,
    classification: finding?.classification || null,
    blocks_customer_delivery: Boolean(finding?.blocks_customer_delivery),
    blocks_public_sample: Boolean(finding?.blocks_public_sample),
    blocks_high_value_outreach: Boolean(finding?.blocks_high_value_outreach),
  };
}

function parseIsoMs(value) {
  const ms = Date.parse(value || '');
  return Number.isFinite(ms) ? ms : null;
}

function minutesSince(value, nowMs) {
  const ms = parseIsoMs(value);
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, (nowMs - ms) / 60000);
}

function includesProductionConfigBlocker(text = '') {
  return String(text || '').toLowerCase().includes('production_config');
}

function textIncludesAny(text = '', needles = []) {
  const haystack = String(text || '').toLowerCase();
  return Array.isArray(needles) && needles.some((needle) => {
    const value = String(needle || '').trim().toLowerCase();
    return value ? haystack.includes(value) : false;
  });
}

function buildAutomationRecommendations({ job = null, artifacts = [] } = {}) {
  const recommendations = [];
  const nowMs = Date.now();
  const status = String(job?.status || '').toLowerCase();
  const errorCode = String(job?.error_code || '').toLowerCase();
  const ageMins = minutesSince(job?.started_at || job?.created_at, nowMs);
  const workerEvents = (artifacts || []).filter((row) => row?.type === 'worker_event' || row?.type === 'status_transition');
  const recentWorkerMinutes = workerEvents
    .map((row) => minutesSince(row?.created_at, nowMs))
    .filter((mins) => Number.isFinite(mins))
    .sort((a, b) => a - b);
  const latestWorkerMinutes = recentWorkerMinutes.length > 0 ? recentWorkerMinutes[0] : null;
  const recentWorkerGap = latestWorkerMinutes === null ? null : latestWorkerMinutes;
  const productionConfigHits = (artifacts || []).reduce((count, row) => {
    const payloadText = JSON.stringify(row?.payload || {});
    return count + (includesProductionConfigBlocker(payloadText) ? 1 : 0);
  }, 0);
  const hardDocumentBlockers = new Set([
    'missing_structured_financials',
    'missing_structured_financial_artifacts',
    'missing_required_source_data',
    'document_financial_scale_mismatch',
  ]);

  if (status === 'queued' && Number.isFinite(ageMins) && ageMins >= 10) {
    recommendations.push({
      recommendation: 'Queue backlog review',
      reason: `Queued for ${Math.round(ageMins)} minutes without starting.`,
      confidence: 'medium',
      eligibility: 'manual review',
      suggested_manual_action: 'Check worker availability and queue depth.',
      blocked_reason: null,
    });
  }

  if (['extracting', 'underwriting', 'scoring', 'rendering', 'pdf_generating'].includes(status) && Number.isFinite(ageMins) && ageMins >= 60) {
    recommendations.push({
      recommendation: 'Stuck in-progress review',
      reason: `Job has been ${status} for about ${Math.round(ageMins)} minutes.`,
      confidence: 'high',
      eligibility: 'manual review',
      suggested_manual_action: 'Open the worker event trail and verify the last stage update.',
      blocked_reason: null,
    });
  }

  if (status === 'failed') {
    const canRequeue = !hardDocumentBlockers.has(errorCode);
    recommendations.push({
      recommendation: canRequeue ? 'Requeue candidate' : 'Review blocker before requeue',
      reason: canRequeue
        ? `Failed job with ${job?.error_code || 'no error code'} appears eligible for a manual requeue review.`
        : 'Failure appears tied to a document, source, or integrity blocker.',
      confidence: canRequeue ? 'medium' : 'low',
      eligibility: canRequeue ? 'review before requeue' : 'not eligible',
      suggested_manual_action: canRequeue
        ? 'Confirm the failure cause, then use the controlled requeue action if appropriate.'
        : 'Resolve the blocker before considering any requeue.',
      blocked_reason: canRequeue ? null : 'Not safe to recommend auto-requeue.',
    });
  }

  if (status === 'publishing' && errorCode === 'admin_review_required') {
    recommendations.push({
      recommendation: 'Human review required',
      reason: 'Admin review hold is active and delivery remains blocked.',
      confidence: 'high',
      eligibility: 'human review only',
      suggested_manual_action: 'Use the controlled admin actions panel to continue review.',
      blocked_reason: 'This is a delivery gate hold, not an automation candidate.',
    });
  }

  if (productionConfigHits >= 2) {
    recommendations.push({
      recommendation: 'Production/config metadata signal',
      reason: `Repeated production_config metadata appeared in ${productionConfigHits} recent artifacts.`,
      confidence: 'low',
      eligibility: 'metadata only',
      suggested_manual_action: 'Record for distribution/config awareness only.',
      blocked_reason: null,
    });
  }

  if ((recentWorkerGap === null || recentWorkerGap >= 30) && status && status !== 'published') {
    recommendations.push({
      recommendation: 'No recent worker events',
      reason: recentWorkerGap === null
        ? 'No worker events were found for this job.'
        : `Last worker event was about ${Math.round(recentWorkerGap)} minutes ago.`,
      confidence: 'medium',
      eligibility: 'manual review',
      suggested_manual_action: 'Open the worker event trail and verify worker activity.',
      blocked_reason: recentWorkerGap === null ? 'No recent worker events were found.' : null,
    });
  }

  return recommendations.slice(0, 6);
}

function buildAutomationSimulation({ job = null, artifacts = [], fixQueueRow = null } = {}) {
  const nowMs = Date.now();
  const status = String(job?.status || '').toLowerCase();
  const errorCode = String(job?.error_code || '').toLowerCase();
  const jobText = JSON.stringify({
    status: job?.status || null,
    error_code: job?.error_code || null,
    error_message: job?.error_message || null,
    failure_reason: job?.failure_reason || null,
  }).toLowerCase();
  const qaActionPlanArtifact = artifacts.find((row) => row?.type === 'qa_action_plan') || null;
  const reportContractArtifact = artifacts.find((row) => row?.type === 'report_contract_qa') || null;
  const deliveryGateArtifact = artifacts.find((row) => row?.type === 'delivery_gate_decision') || null;
  const workerEvents = artifacts
    .filter((row) => row?.type === 'worker_event' || row?.type === 'status_transition')
    .slice(0, 12);
  const latestWorkerEventMs = workerEvents
    .map((row) => parseIsoMs(row?.created_at))
    .filter((ms) => Number.isFinite(ms))
    .sort((a, b) => b - a)[0] || null;
  const ageMins = minutesSince(job?.started_at || job?.created_at, nowMs);
  const workerGapMins = latestWorkerEventMs === null ? null : Math.max(0, (nowMs - latestWorkerEventMs) / 60000);
  const qaActionPlan = qaActionPlanArtifact?.payload || {};
  const reportContract = reportContractArtifact?.payload || {};
  const deliveryGateStatus = String(deliveryGateArtifact?.payload?.delivery_gate_status || fixQueueRow?.delivery_gate_status || '').toLowerCase();
  const hasSourceMismatch = Array.isArray(reportContract?.violations)
    ? reportContract.violations.some((violation) => {
        const haystack = [
          violation?.code,
          violation?.title,
          violation?.category,
          violation?.message,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes('reconciliation_mismatch') || haystack.includes('source_report_contradiction') || haystack.includes('contradiction');
      })
    : false;
  const hasAdminHold = status === 'publishing' && errorCode === 'admin_review_required';
  const forcePublishSignal = textIncludesAny([
    jobText,
    JSON.stringify(qaActionPlan || {}),
    JSON.stringify(reportContract || {}),
    JSON.stringify(deliveryGateArtifact?.payload || {}),
    JSON.stringify(fixQueueRow || {}),
  ].join(' '), [
    'force publish',
    'force_publish',
    'qa bypass',
    'qa_bypass',
    'bypass qa',
    'publish bypass',
  ]);
  const hasProductionConfigBlocker = [
    jobText,
    JSON.stringify(qaActionPlan || {}).toLowerCase(),
    JSON.stringify(reportContract || {}).toLowerCase(),
    JSON.stringify(deliveryGateArtifact?.payload || {}).toLowerCase(),
    JSON.stringify(workerEvents || []).toLowerCase(),
  ].some((text) => text.includes('production_config'));
  const hardDocumentBlocker = [
    'missing_structured_financials',
    'missing_structured_financial_artifacts',
    'missing_required_source_data',
    'document_financial_scale_mismatch',
    'missing_required_documents',
  ].includes(errorCode) ||
    jobText.includes('document integrity') ||
    jobText.includes('missing structured') ||
    jobText.includes('required source documents') ||
    jobText.includes('could not be validated');
  const publicBlock = Boolean(fixQueueRow?.public_sample_ready === false);
  const outreachBlock = Boolean(fixQueueRow?.high_value_outreach_ready === false);
  const inProgressStatuses = new Set(['extracting', 'underwriting', 'scoring', 'rendering', 'pdf_generating']);

  let automationClass = 'NO_ACTION';
  let proposedAction = 'No action';
  let confidenceScore = 100;
  let confidenceLabel = 'high';
  let humanReviewRequired = false;
  let executiveOverrideRequired = false;
  let requiredConditions = ['None'];
  let blockedReason = null;
  let suggestedDelayMinutes = null;
  let escalationTarget = 'None';
  let rationale = 'Job is already published or does not need automated handling.';

  if (status === 'published') {
    automationClass = 'NO_ACTION';
    proposedAction = 'No action';
    confidenceScore = 100;
    confidenceLabel = 'high';
    requiredConditions = ['Published job'];
    escalationTarget = 'None';
    rationale = 'Published jobs are not automation candidates.';
  } else if (hasSourceMismatch || hasAdminHold) {
    automationClass = 'HUMAN_REVIEW_REQUIRED';
    proposedAction = 'Human review';
    confidenceScore = hasSourceMismatch ? 97 : 94;
    confidenceLabel = 'high';
    humanReviewRequired = true;
    requiredConditions = hasSourceMismatch
      ? ['Confirm source-backed values before any further action']
      : ['Admin review hold remains active'];
    blockedReason = hasSourceMismatch
      ? 'Source reconciliation mismatch detected.'
      : 'Admin review hold is active.';
    suggestedDelayMinutes = hasSourceMismatch ? 60 : 30;
    escalationTarget = 'Admin review';
    rationale = hasSourceMismatch
      ? 'Rendered or contracted values disagree across source-to-report checks.'
      : 'Delivery gate is intentionally held for human review.';
  } else if (forcePublishSignal) {
    automationClass = 'EXECUTIVE_OVERRIDE_ONLY';
    proposedAction = 'Escalate for executive approval';
    confidenceScore = 90;
    confidenceLabel = 'high';
    executiveOverrideRequired = true;
    requiredConditions = [
      'Executive approval',
      'Confirm business reason before bypassing QA or publish controls',
    ];
    blockedReason = 'QA bypass or force publish requires executive approval.';
    suggestedDelayMinutes = 0;
    escalationTarget = 'Executive approval';
    rationale = 'Force publish and QA bypass paths should not be overridden automatically.';
  } else if (status === 'failed' && hardDocumentBlocker) {
    automationClass = 'BLOCKED_UNSAFE';
    proposedAction = 'Do not automate';
    confidenceScore = 96;
    confidenceLabel = 'high';
    requiredConditions = ['Resolve the document or integrity blocker first'];
    blockedReason = 'Document or integrity blocker detected.';
    suggestedDelayMinutes = null;
    escalationTarget = 'Admin review';
    rationale = 'Failure is tied to source documents or integrity checks.';
  } else if (
    status === 'failed' &&
    !hardDocumentBlocker &&
    !hasAdminHold &&
    !hasSourceMismatch &&
    textIncludesAny([jobText, JSON.stringify(qaActionPlan || {}), JSON.stringify(reportContract || {}), JSON.stringify(deliveryGateArtifact?.payload || {})].join(' '), [
      'transient',
      'system',
      'timeout',
      'network',
      'unavailable',
      'temporary',
      'retryable',
      'service unavailable',
      'worker timeout',
    ])
  ) {
    automationClass = 'SAFE_AUTOMATION';
    proposedAction = 'Requeue failed job';
    confidenceScore = 78;
    confidenceLabel = 'medium';
    humanReviewRequired = false;
    executiveOverrideRequired = false;
    requiredConditions = ['No document blocker detected', 'Failure appears transient or system-related'];
    blockedReason = null;
    suggestedDelayMinutes = 10;
    escalationTarget = 'Operations';
    rationale = 'The failure pattern looks transient and would normally be a manual requeue candidate.';
  } else if (
    (status === 'queued' && Number.isFinite(ageMins) && ageMins >= 10) ||
    (inProgressStatuses.has(status) && Number.isFinite(ageMins) && ageMins >= 60) ||
    ((workerGapMins === null || workerGapMins >= 30) && status !== 'published')
  ) {
    automationClass = 'SAFE_AUTOMATION';
    proposedAction = status === 'queued' ? 'Retry queued job' : 'Review worker trail';
    confidenceScore = 74;
    confidenceLabel = 'medium';
    requiredConditions = status === 'queued'
      ? ['Queued long enough to justify review', 'No document blocker detected']
      : ['No recent worker event or stage update', 'No document blocker detected'];
    blockedReason = null;
    suggestedDelayMinutes = status === 'queued' ? 15 : 10;
    escalationTarget = 'Operations';
    rationale = status === 'queued'
      ? 'Queued job has aged enough to review as a controlled automation candidate.'
      : 'Job appears stuck or stale based on worker activity timing.';
  } else if (status === 'failed') {
    automationClass = 'HUMAN_REVIEW_REQUIRED';
    proposedAction = 'Escalate for human review';
    confidenceScore = 66;
    confidenceLabel = 'medium';
    humanReviewRequired = true;
    requiredConditions = ['Failure type is not clearly safe to automate'];
    blockedReason = 'Failure classification is not safe for automatic handling.';
    suggestedDelayMinutes = null;
    escalationTarget = 'Admin review';
    rationale = 'The failure does not match a safe automation path.';
  }

  if ((publicBlock || outreachBlock) && automationClass === 'NO_ACTION') {
    rationale = 'Customer delivery authority is unchanged; public/outreach readiness is non-authoritative distribution metadata.';
  }
  if (hasProductionConfigBlocker && automationClass === 'NO_ACTION') {
    rationale = 'Customer delivery authority is unchanged; production/config exposure metadata is non-authoritative for automation class decisions.';
  }

  return {
    proposed_action: proposedAction,
    automation_class: automationClass,
    confidence_score: confidenceScore,
    confidence_label: confidenceLabel,
    human_review_required: humanReviewRequired,
    executive_override_required: executiveOverrideRequired,
    required_conditions: requiredConditions.slice(0, 4),
    blocked_reason: blockedReason,
    suggested_delay_minutes: suggestedDelayMinutes,
    escalation_target: escalationTarget,
    rationale,
  };
}

function buildFixQueueEntry({ job = null, artifactsByType = {} } = {}) {
  const contract = artifactsByType.report_contract_qa?.payload || {};
  const actionPlan = artifactsByType.qa_action_plan?.payload || {};
  const director = artifactsByType.qa_director_review?.payload || {};
  const flags = artifactsByType.report_qa_flags?.payload || {};
  const deliveryGate = artifactsByType.delivery_gate_decision?.payload || {};
  const normalizedPlan = normalizeActionPlan(actionPlan);
  const contractViolations = Array.isArray(contract?.violations) ? contract.violations : [];
  const contractSeverity = highestSeverityValue(contractViolations.map((violation) => violation?.severity));
  const directorSeverity = highestSeverityValue((director?.findings || []).map((finding) => finding?.severity));
  const flagsSeverity = normalizeSeverity((flags?.severity || (flags?.qa_status === "fail" ? "high" : "none")));
  const deliveryGateStatus = String(deliveryGate?.delivery_gate_status || "").toLowerCase();
  const highestSeverity = highestSeverityValue([
    normalizedPlan.highest_severity,
    contractSeverity,
    directorSeverity,
    flagsSeverity,
    deliveryGateStatus === 'admin_review_required' ? 'high' : deliveryGateStatus === 'user_needs_documents' ? 'medium' : 'none',
  ]);
  const shouldShow =
    (deliveryGateStatus && deliveryGateStatus !== 'deliverable') ||
    normalizedPlan.requires_code_patch === true ||
    normalizedPlan.requires_regeneration === true ||
    String(director?.overall_director_decision || "") !== "no_missed_issue_detected" ||
    String(contract?.contract_status || "") !== "pass";

  if (!shouldShow) return null;

  const display = normalizeFixQueueDisplay({
    top_action_code: normalizedPlan.top_action_code,
    top_action_title: normalizedPlan.top_action_title,
    recommended_next_step: normalizedPlan.recommended_next_step,
    owner_area: normalizedPlan.owner_area,
    highest_severity: highestSeverity,
    delivery_gate_status: deliveryGate?.delivery_gate_status || null,
    reason_code: deliveryGate?.reason_code || null,
    source_code: normalizedPlan.top_action_code || null,
    customer_delivery_ready: normalizedPlan.customer_delivery_ready,
    public_sample_ready: normalizedPlan.public_sample_ready,
    high_value_outreach_ready: normalizedPlan.high_value_outreach_ready,
  });

  return {
    job_id: job?.id || null,
    property_name: job?.property_name || contract?.property_name || null,
    report_type: job?.report_type || contract?.report_type || actionPlan?.report_type || null,
    created_at: job?.created_at || contract?.timestamp || actionPlan?.timestamp || director?.timestamp || null,
    highest_severity: highestSeverity,
    customer_delivery_ready: normalizedPlan.customer_delivery_ready,
    public_sample_ready: normalizedPlan.public_sample_ready,
    high_value_outreach_ready: normalizedPlan.high_value_outreach_ready,
    requires_code_patch: normalizedPlan.requires_code_patch,
    requires_regeneration: normalizedPlan.requires_regeneration,
    owner_area: normalizedPlan.owner_area || null,
    top_action_code: normalizedPlan.top_action_code || null,
    top_action_title: normalizedPlan.top_action_title || null,
    recommended_next_step: normalizedPlan.recommended_next_step || null,
    contract_status: contract?.contract_status || null,
    director_decision: director?.overall_director_decision || null,
    report_qa_flags_severity: flags?.severity || null,
    delivery_gate_status: deliveryGate?.delivery_gate_status || null,
    reason_code: deliveryGate?.reason_code || null,
    readiness_hierarchy: normalizedPlan.readiness_hierarchy || null,
    display_title: display.display_title,
    display_reason: display.display_reason,
    display_next_step: display.display_next_step,
    display_category: display.display_category,
    display_priority: display.display_priority,
  };
}

function buildFixQueueDetails({
  job = null,
  report = null,
  files = [],
  artifacts = [],
  fixQueueRow = null,
} = {}) {
  const qaActionPlanArtifact = artifacts.find((row) => row?.type === 'qa_action_plan') || null;
  const reportContractArtifact = artifacts.find((row) => row?.type === 'report_contract_qa') || null;
  const directorArtifact = artifacts.find((row) => row?.type === 'qa_director_review') || null;
  const deliveryGateArtifact = artifacts.find((row) => row?.type === 'delivery_gate_decision') || null;
  const flagsArtifact = artifacts.find((row) => row?.type === 'report_qa_flags') || null;
  const workerEvents = artifacts
    .filter((row) => row?.type === 'worker_event' || row?.type === 'status_transition')
    .slice(0, 12)
    .map((row) => ({
      type: row?.type || null,
      bucket: row?.bucket || null,
      created_at: row?.created_at || null,
      summary: compactArtifactSummary(row),
    }));
  const internalArtifacts = artifacts
    .filter((row) => !['worker_event', 'status_transition'].includes(String(row?.type || '')))
    .slice(0, 12)
    .map((row) => ({
      type: row?.type || null,
      bucket: row?.bucket || null,
      created_at: row?.created_at || null,
      summary: compactArtifactSummary(row),
    }));

  const qaActionPlan = qaActionPlanArtifact?.payload || {};
  const reportContract = reportContractArtifact?.payload || {};
  const director = directorArtifact?.payload || {};
  const deliveryGate = deliveryGateArtifact?.payload || {};
  const flags = flagsArtifact?.payload || {};

  return {
    job: job
      ? {
          id: job.id || null,
          property_name: job.property_name || null,
          report_type: job.report_type || null,
          status: job.status || null,
          created_at: job.created_at || null,
          started_at: job.started_at || null,
          failed_at: job.failed_at || null,
          error_code: job.error_code || null,
          error_message: job.error_message || null,
        }
      : null,
    report: report
      ? {
          id: report.id || null,
          storage_path: report.storage_path || null,
          signed_url: report.signed_url || null,
          created_at: report.created_at || null,
        }
      : null,
    files: (files || []).map((file) => ({
      id: file?.id || null,
      doc_type: file?.doc_type || null,
      original_filename: file?.original_filename || null,
      parse_status: file?.parse_status || null,
      parse_error: file?.parse_error || null,
      created_at: file?.created_at || null,
    })),
    qa: {
      delivery_gate_status: deliveryGate?.delivery_gate_status || fixQueueRow?.delivery_gate_status || null,
      reason_code: deliveryGate?.reason_code || fixQueueRow?.reason_code || null,
      top_action_code: qaActionPlan?.top_action_code || fixQueueRow?.top_action_code || null,
      top_action_title: qaActionPlan?.top_action_title || fixQueueRow?.top_action_title || null,
      owner_area: qaActionPlan?.owner_area || fixQueueRow?.owner_area || null,
      recommended_next_step: qaActionPlan?.recommended_next_step || fixQueueRow?.recommended_next_step || null,
      customer_delivery_ready: Boolean(qaActionPlan?.customer_delivery_ready ?? fixQueueRow?.customer_delivery_ready),
      public_sample_ready: Boolean(qaActionPlan?.public_sample_ready ?? fixQueueRow?.public_sample_ready),
      high_value_outreach_ready: Boolean(qaActionPlan?.high_value_outreach_ready ?? fixQueueRow?.high_value_outreach_ready),
      highest_severity: qaActionPlan?.highest_severity || fixQueueRow?.highest_severity || null,
      contract_status: reportContract?.contract_status || null,
      director_decision: director?.overall_director_decision || null,
      report_qa_flags_severity: flags?.severity || null,
      delivery_recommendation: qaActionPlan?.delivery_recommendation || null,
      readiness_hierarchy: qaActionPlan?.readiness_hierarchy || fixQueueRow?.readiness_hierarchy || null,
      prioritized_actions: Array.isArray(qaActionPlan?.prioritized_actions)
        ? qaActionPlan.prioritized_actions.slice(0, 10).map(compactAction)
        : [],
      contract_violations: Array.isArray(reportContract?.violations)
        ? reportContract.violations.slice(0, 10).map((violation) => ({
            code: violation?.code || null,
            title: violation?.title || null,
            severity: violation?.severity || null,
            category: violation?.category || null,
            message: violation?.message || null,
          }))
        : [],
      director_findings: Array.isArray(director?.findings)
        ? director.findings.slice(0, 10).map(compactFinding)
        : [],
    },
    artifacts: internalArtifacts,
    worker_events: workerEvents,
    automation_simulation: buildAutomationSimulation({ job, artifacts, fixQueueRow }),
    automation_recommendations: buildAutomationRecommendations({ job, artifacts }).slice(0, 6),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const adminRunKey = (process.env.ADMIN_RUN_KEY || '').trim();

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({
        error: 'Server misconfigured: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
      });
    }

    if (!adminRunKey) {
      return res.status(500).json({ error: 'Unauthorized' });
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : '';

    if (!token || token.trim() !== adminRunKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    if (req.method === 'POST') {
      const { issue_id, status } = req.body || {};
      const allowedStatuses = ['open', 'reviewing', 'resolved'];
      if (!issue_id || !allowedStatuses.includes(status)) {
        return res.status(400).json({ ok: false });
      }

      const { error: updateErr } = await supabaseAdmin
        .from('report_issues')
        .update({ status })
        .eq('id', issue_id);

      if (updateErr) {
        return res.status(500).json({ ok: false });
      }

      return res.status(200).json({ ok: true });
    }

    const includeFixQueue = String(req.query?.include_fix_queue || "").toLowerCase() === "true";
    const includeFixQueueDetails = String(req.query?.include_fix_queue_details || "").toLowerCase() === "true";
    const fixQueueJobId = String(req.query?.fix_queue_job_id || req.query?.job_id || "").trim();
    const includeUsers = String(req.query?.include_users || "").toLowerCase() === "true";
    const includeDiagnosticsRollup = String(req.query?.include_diagnostics_rollup || "").toLowerCase() === "true";

    // Slice 1 — Diagnostics Intelligence Rollup. Read-only, additive.
    // Short-circuits the rest of queue-metrics: this branch returns just
    // the rollup so a dedicated client (DiagnosticsIntelligence.jsx) does
    // not pay the cost of every other panel's data.
    if (includeDiagnosticsRollup) {
      const result = await buildDiagnosticsRollup(supabaseAdmin);
      if (!result.ok) {
        return res.status(200).json({
          ok: false,
          diagnostics_rollup: [],
          diagnostics_rollup_error: result.error || 'rollup_failed',
        });
      }
      return res.status(200).json({
        ok: true,
        diagnostics_rollup: result.rollup,
      });
    }

    const statuses = [
      'queued',
      'extracting',
      'underwriting',
      'scoring',
      'rendering',
      'pdf_generating',
      'publishing',
      'published',
      'failed',
    ];

    const countResults = await Promise.all(
      statuses.map(async (status) => {
        const { count, error } = await supabaseAdmin
          .from('analysis_jobs')
          .select('*', { count: 'exact', head: true })
          .eq('status', status);

        if (error) {
          return [status, 0];
        }

        return [status, count || 0];
      })
    );

    const countsByStatus = Object.fromEntries(countResults);

    const { data: oldestQueued, error: oldestQueuedErr } = await supabaseAdmin
      .from('analysis_jobs')
      .select('created_at')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: latestFailed, error: latestFailedErr } = await supabaseAdmin
      .from('analysis_jobs')
      .select('created_at')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: recentJobs, error: recentJobsErr } = await supabaseAdmin
      .from('analysis_jobs')
      .select('id, property_name, status, created_at, started_at, user_id, failure_reason, error_message')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: issuesRows, error: issuesErr } = await supabaseAdmin
      .from('report_issues')
      .select('id, user_id, job_id, artifact_id, message, attachment_path, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    const issueJobIds = Array.from(
      new Set(
        (issuesRows || [])
          .map((issue) => issue?.job_id)
          .filter((jobId) => typeof jobId === 'string' && jobId.trim())
      )
    );

    let relatedJobsById = {};
    if (issueJobIds.length > 0) {
      const { data: relatedJobs } = await supabaseAdmin
        .from('analysis_jobs')
        .select('id, property_name, report_type, status')
        .in('id', issueJobIds);

      relatedJobsById = Object.fromEntries(
        (relatedJobs || []).map((job) => [job.id, job])
      );
    }

    const issuesWithUrls = await Promise.all(
      (issuesRows || []).map(async (issue) => {
        const relatedJob = issue?.job_id ? relatedJobsById[issue.job_id] || null : null;
        if (!issue?.attachment_path) {
          return {
            ...issue,
            attachment_url: null,
            property_name: relatedJob?.property_name || null,
            report_type: relatedJob?.report_type || null,
            job_status: relatedJob?.status || null,
          };
        }
        const { data: signed, error: signedErr } = await supabaseAdmin.storage
          .from('report-issues')
          .createSignedUrl(issue.attachment_path, 3600);
        return {
          ...issue,
          attachment_url: signedErr ? null : signed?.signedUrl || null,
          property_name: relatedJob?.property_name || null,
          report_type: relatedJob?.report_type || null,
          job_status: relatedJob?.status || null,
        };
      })
    );

    let users = [];
    let usersError = false;
    let purchasesError = false;
    if (includeUsers) {
      const [profilesResult, purchasesResult] = await Promise.all([
        supabaseAdmin.rpc('get_all_profiles_for_admin'),
        supabaseAdmin.rpc('get_all_purchases_for_admin'),
      ]);

      usersError = Boolean(profilesResult.error);
      purchasesError = Boolean(purchasesResult.error);

      const creditMap = {};
      if (!purchasesResult.error) {
        for (const row of purchasesResult.data || []) {
          if (!row || row.consumed_at) continue;
          if (!row.user_id) continue;
          if (!creditMap[row.user_id]) creditMap[row.user_id] = { screening: 0, underwriting: 0 };
          if (row.product_type === 'screening') creditMap[row.user_id].screening += 1;
          else if (row.product_type === 'underwriting') creditMap[row.user_id].underwriting += 1;
        }
      }

      users = profilesResult.error
        ? []
        : (profilesResult.data || []).map((u) => ({
            id: u.id || null,
            full_name: u.full_name || null,
            role: u.role || null,
            screening_credits: creditMap[u.id]?.screening ?? 0,
            underwriting_credits: creditMap[u.id]?.underwriting ?? 0,
          }));
    }

    let fixQueue = [];
    let fixQueueArtifactsErr = false;
    if (includeFixQueue) {
      const { data: fixQueueArtifacts, error: artifactsErr } = await supabaseAdmin
        .from('analysis_artifacts')
        .select('job_id, type, payload, created_at')
        .in('type', ['qa_action_plan', 'report_contract_qa', 'qa_director_review', 'report_qa_flags', 'delivery_gate_decision'])
        .order('created_at', { ascending: false })
        .limit(25);

      fixQueueArtifactsErr = Boolean(artifactsErr);

      const artifactsByJob = {};
      for (const row of fixQueueArtifacts || []) {
        if (!row?.job_id) continue;
        if (!artifactsByJob[row.job_id]) artifactsByJob[row.job_id] = {};
        if (!artifactsByJob[row.job_id][row.type]) {
          artifactsByJob[row.job_id][row.type] = row;
        }
      }

      const fixQueueJobIds = Object.keys(artifactsByJob);
      let jobsById = {};
      if (fixQueueJobIds.length > 0) {
        const { data: fixQueueJobs } = await supabaseAdmin
          .from('analysis_jobs')
          .select('id, property_name, report_type, status, created_at')
          .in('id', fixQueueJobIds);
        jobsById = Object.fromEntries((fixQueueJobs || []).map((job) => [job.id, job]));
      }

      fixQueue = fixQueueJobIds
        .map((jobId) => buildFixQueueEntry({
          job: jobsById[jobId] || { id: jobId },
          artifactsByType: artifactsByJob[jobId] || {},
        }))
        .filter(Boolean)
        .sort((a, b) => (
          severityRank[normalizeSeverity(b.highest_severity)] - severityRank[normalizeSeverity(a.highest_severity)] ||
          Number(Boolean(b.requires_code_patch)) - Number(Boolean(a.requires_code_patch)) ||
          Number(Boolean(b.requires_regeneration)) - Number(Boolean(a.requires_regeneration)) ||
          String(b.created_at || "").localeCompare(String(a.created_at || ""))
        ));
    }

    let fixQueueDetails = null;
    let fixQueueDetailsError = false;
    if (includeFixQueueDetails) {
      if (!fixQueueJobId) {
        fixQueueDetailsError = true;
      } else {
        const { data: detailJob, error: detailJobErr } = await supabaseAdmin
          .from('analysis_jobs')
          .select('id, user_id, property_name, report_type, status, created_at, started_at, failed_at, error_code, error_message')
          .eq('id', fixQueueJobId)
          .maybeSingle();

        if (detailJobErr || !detailJob?.id) {
          fixQueueDetailsError = true;
        } else {
          const { data: detailFiles } = await supabaseAdmin
            .from('analysis_job_files')
            .select('id, doc_type, original_filename, parse_status, parse_error, created_at')
            .eq('job_id', fixQueueJobId)
            .order('created_at', { ascending: false })
            .limit(20);

          const { data: detailArtifacts } = await supabaseAdmin
            .from('analysis_artifacts')
            .select('type, bucket, created_at, payload')
            .eq('job_id', fixQueueJobId)
            .in('type', ['qa_action_plan', 'report_contract_qa', 'qa_director_review', 'report_qa_flags', 'delivery_gate_decision', 'worker_event', 'status_transition'])
            .order('created_at', { ascending: false })
            .limit(20);

          fixQueueDetails = buildFixQueueDetails({
            job: detailJob,
            files: detailFiles || [],
            artifacts: detailArtifacts || [],
            fixQueueRow: fixQueue.find((row) => row.job_id === detailJob.id) || null,
          });
        }
      }
    }

    return res.status(200).json({
      counts_by_status: countsByStatus,
      oldest_queued_at: oldestQueuedErr ? null : oldestQueued?.created_at || null,
      latest_failed_at: latestFailedErr ? null : latestFailed?.created_at || null,
      recent_jobs: recentJobsErr ? [] : recentJobs || [],
      issues: issuesErr ? [] : issuesWithUrls || [],
      users: includeUsers ? users : [],
      users_error: includeUsers ? usersError : false,
      purchases_error: includeUsers ? purchasesError : false,
      fix_queue: includeFixQueue && !fixQueueArtifactsErr ? fixQueue : [],
      fix_queue_deferred: !includeFixQueue,
      issues_error: Boolean(issuesErr),
      fix_queue_error: includeFixQueue ? Boolean(fixQueueArtifactsErr) : false,
      fix_queue_details: includeFixQueueDetails ? fixQueueDetails : null,
      fix_queue_details_error: includeFixQueueDetails ? fixQueueDetailsError : false,
    });
  } catch (err) {
    console.error('queue-metrics error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
