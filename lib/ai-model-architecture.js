const truthy = (value) => String(value || '').trim().toLowerCase() === 'true';
const clean = (value) => String(value || '').trim();

export const AI_MODEL_ARCHITECTURE_VERSION = '2026-09-10.3';
export const AI_MODEL_ARCHITECTURE_FLAG = 'ENABLE_AI_MODEL_ARCHITECTURE_20260910';

export const OPENAI_MODEL_IDS = Object.freeze({
  GPT_4O: 'gpt-4o-2024-08-06',
  GPT_4O_MINI: 'gpt-4o-mini',
  GPT_41_MINI: 'gpt-4.1-mini',
  GPT_56_LUNA: 'gpt-5.6-luna',
  GPT_56_TERRA: 'gpt-5.6-terra',
  GPT_56_SOL: 'gpt-5.6-sol',
  GPT_6_ASTRA: 'gpt-6-astra',
});

export const OPENAI_STANDARD_PRICING_PER_MILLION = Object.freeze({
  [OPENAI_MODEL_IDS.GPT_56_LUNA]: Object.freeze({ input: 0.2, output: 1.2 }),
  [OPENAI_MODEL_IDS.GPT_56_TERRA]: Object.freeze({ input: 2, output: 12 }),
  [OPENAI_MODEL_IDS.GPT_56_SOL]: Object.freeze({ input: 4, output: 20 }),
  [OPENAI_MODEL_IDS.GPT_6_ASTRA]: Object.freeze({ input: 10, output: 50 }),
});

export const AI_MODEL_STAGES = Object.freeze({
  T12_RECOVERY: 't12_recovery',
  RENT_ROLL_RECOVERY: 'rent_roll_recovery',
  SUPPORT_DOC_RECOVERY: 'support_doc_recovery',
  RENDERED_REPORT_QA: 'rendered_report_qa',
  SOURCE_PACKAGE_QA: 'source_package_qa',
  QA_MANAGER: 'qa_manager',
});

const STAGE_POLICY = Object.freeze({
  [AI_MODEL_STAGES.T12_RECOVERY]: Object.freeze({
    legacyModel: OPENAI_MODEL_IDS.GPT_4O,
    targetModel: OPENAI_MODEL_IDS.GPT_4O,
    targetReasoningEffort: null,
    evaluationCandidateModel: OPENAI_MODEL_IDS.GPT_56_TERRA,
    evaluationCandidateReasoningEffort: 'none',
    explicitModelEnv: ['OPENAI_T12_RECOVERY_MODEL'],
    explicitReasoningEnv: ['OPENAI_T12_RECOVERY_REASONING_EFFORT'],
    doctrine: 'deterministic_recovery_first',
  }),
  [AI_MODEL_STAGES.RENT_ROLL_RECOVERY]: Object.freeze({
    legacyModel: OPENAI_MODEL_IDS.GPT_4O,
    targetModel: OPENAI_MODEL_IDS.GPT_4O,
    targetReasoningEffort: null,
    evaluationCandidateModel: OPENAI_MODEL_IDS.GPT_56_TERRA,
    evaluationCandidateReasoningEffort: 'none',
    explicitModelEnv: ['OPENAI_RENT_ROLL_RECOVERY_MODEL'],
    explicitReasoningEnv: ['OPENAI_RENT_ROLL_RECOVERY_REASONING_EFFORT'],
    doctrine: 'deterministic_recovery_first',
  }),
  [AI_MODEL_STAGES.SUPPORT_DOC_RECOVERY]: Object.freeze({
    legacyModel: OPENAI_MODEL_IDS.GPT_4O,
    targetModel: OPENAI_MODEL_IDS.GPT_4O,
    targetReasoningEffort: null,
    evaluationCandidateModel: OPENAI_MODEL_IDS.GPT_56_TERRA,
    evaluationCandidateReasoningEffort: 'none',
    explicitModelEnv: ['OPENAI_SUPPORT_DOC_RECOVERY_MODEL'],
    explicitReasoningEnv: ['OPENAI_SUPPORT_DOC_RECOVERY_REASONING_EFFORT'],
    doctrine: 'deterministic_recovery_first',
  }),
  [AI_MODEL_STAGES.RENDERED_REPORT_QA]: Object.freeze({
    legacyModel: OPENAI_MODEL_IDS.GPT_4O,
    targetModel: OPENAI_MODEL_IDS.GPT_4O,
    targetReasoningEffort: null,
    evaluationCandidateModel: OPENAI_MODEL_IDS.GPT_56_TERRA,
    evaluationCandidateReasoningEffort: 'medium',
    explicitModelEnv: ['QA_REVIEW_MODEL', 'OPENAI_REPORT_QA_MODEL'],
    explicitReasoningEnv: ['QA_REVIEW_REASONING_EFFORT'],
    doctrine: 'institutional_rendered_report_review',
  }),
  [AI_MODEL_STAGES.SOURCE_PACKAGE_QA]: Object.freeze({
    legacyModel: OPENAI_MODEL_IDS.GPT_4O,
    targetModel: OPENAI_MODEL_IDS.GPT_4O,
    targetReasoningEffort: null,
    evaluationCandidateModel: OPENAI_MODEL_IDS.GPT_56_TERRA,
    evaluationCandidateReasoningEffort: 'medium',
    explicitModelEnv: ['QA_SOURCE_PACKAGE_MODEL', 'QA_REVIEW_MODEL', 'OPENAI_REPORT_QA_MODEL'],
    explicitReasoningEnv: ['QA_SOURCE_PACKAGE_REASONING_EFFORT', 'QA_REVIEW_REASONING_EFFORT'],
    doctrine: 'cross_document_source_review',
  }),
  [AI_MODEL_STAGES.QA_MANAGER]: Object.freeze({
    legacyModel: OPENAI_MODEL_IDS.GPT_4O,
    targetModel: OPENAI_MODEL_IDS.GPT_4O,
    targetReasoningEffort: null,
    evaluationCandidateModel: OPENAI_MODEL_IDS.GPT_56_SOL,
    evaluationCandidateReasoningEffort: 'high',
    explicitModelEnv: ['QA_MANAGER_MODEL', 'QA_SOURCE_PACKAGE_MODEL', 'QA_REVIEW_MODEL', 'OPENAI_REPORT_QA_MODEL'],
    explicitReasoningEnv: ['QA_MANAGER_REASONING_EFFORT', 'QA_SOURCE_PACKAGE_REASONING_EFFORT', 'QA_REVIEW_REASONING_EFFORT'],
    doctrine: 'final_institutional_qa_judgment',
  }),
});

export const AI_MODEL_TARGET_ARCHITECTURE = Object.freeze(
  Object.fromEntries(
    Object.entries(STAGE_POLICY).map(([stage, policy]) => [
      stage,
      Object.freeze({
        model: policy.targetModel,
        reasoning_effort: policy.targetReasoningEffort,
        evaluation_candidate_model: policy.evaluationCandidateModel,
        evaluation_candidate_reasoning_effort: policy.evaluationCandidateReasoningEffort,
        doctrine: policy.doctrine,
      }),
    ])
  )
);

export const AI_MODEL_EVAL_01_CANDIDATES = Object.freeze([
  Object.freeze({ label: 'baseline_gpt4o', model: OPENAI_MODEL_IDS.GPT_4O, reasoning_effort: null, scope: 'all' }),
  Object.freeze({ label: 'terra_medium', model: OPENAI_MODEL_IDS.GPT_56_TERRA, reasoning_effort: 'medium', scope: 'all' }),
  Object.freeze({ label: 'sol_high', model: OPENAI_MODEL_IDS.GPT_56_SOL, reasoning_effort: 'high', scope: 'all' }),
  Object.freeze({ label: 'astra_high_ceiling', model: OPENAI_MODEL_IDS.GPT_6_ASTRA, reasoning_effort: 'high', scope: 'hard' }),
]);

const ALLOWED_REASONING_EFFORTS = new Set(['none', 'low', 'medium', 'high', 'xhigh', 'max']);

export function isModernReasoningModel(model) {
  const value = clean(model).toLowerCase();
  return value.startsWith('gpt-5.6') || value.startsWith('gpt-6-astra');
}

export function isAstraModel(model) {
  return clean(model).toLowerCase().startsWith('gpt-6-astra');
}

export function normalizeReasoningEffort(value, { model = '', fallback = null } = {}) {
  const normalized = clean(value).toLowerCase();
  if (ALLOWED_REASONING_EFFORTS.has(normalized)) {
    if (isAstraModel(model) && normalized === 'none') return 'low';
    return normalized;
  }
  if (isAstraModel(model) && fallback === 'none') return 'low';
  return fallback;
}

const firstDefinedEnv = (env, names) => {
  for (const name of names || []) {
    const value = clean(env?.[name]);
    if (value) return { name, value };
  }
  return null;
};

export function isTargetArchitectureEnabled(env = process.env) {
  return truthy(env?.[AI_MODEL_ARCHITECTURE_FLAG]);
}

export function resolveAiStageConfig(stage, env = process.env) {
  const policy = STAGE_POLICY[stage];
  if (!policy) throw new Error(`Unknown AI model stage: ${stage}`);

  const explicitModel = firstDefinedEnv(env, policy.explicitModelEnv);
  const architectureEnabled = isTargetArchitectureEnabled(env);
  const model = explicitModel?.value || (architectureEnabled ? policy.targetModel : policy.legacyModel);

  const explicitReasoning = firstDefinedEnv(env, policy.explicitReasoningEnv);
  let reasoningEffort = explicitReasoning?.value || (architectureEnabled ? policy.targetReasoningEffort : null);
  if (isModernReasoningModel(model)) {
    const fallback = isAstraModel(model) ? 'low' : policy.targetReasoningEffort || 'medium';
    reasoningEffort = normalizeReasoningEffort(reasoningEffort, { model, fallback });
  } else {
    reasoningEffort = null;
  }

  return Object.freeze({
    stage,
    version: AI_MODEL_ARCHITECTURE_VERSION,
    architecture_enabled: architectureEnabled,
    model,
    reasoning_effort: reasoningEffort,
    model_source: explicitModel?.name || (architectureEnabled ? 'target_architecture' : 'legacy_default'),
    reasoning_source: explicitReasoning?.name || (reasoningEffort ? 'stage_default' : 'not_applicable'),
    doctrine: policy.doctrine,
    evaluation_candidate_model: policy.evaluationCandidateModel,
    evaluation_candidate_reasoning_effort: policy.evaluationCandidateReasoningEffort,
  });
}

export function buildChatCompletionModelControls({ model, reasoningEffort = null, legacyTemperature = 0 } = {}) {
  if (!isModernReasoningModel(model)) {
    return { temperature: legacyTemperature };
  }
  const fallback = isAstraModel(model) ? 'low' : 'medium';
  return {
    reasoning_effort: normalizeReasoningEffort(reasoningEffort, { model, fallback }),
  };
}

export function buildResponsesModelControls({ model, reasoningEffort = null, legacyTemperature = 0 } = {}) {
  if (!isModernReasoningModel(model)) {
    return { temperature: legacyTemperature };
  }
  const fallback = isAstraModel(model) ? 'low' : 'medium';
  return {
    reasoning: {
      effort: normalizeReasoningEffort(reasoningEffort, { model, fallback }),
    },
  };
}

export function estimateOpenAiTokenCostUsd({ model, inputTokens = 0, outputTokens = 0 } = {}) {
  const pricing = OPENAI_STANDARD_PRICING_PER_MILLION[clean(model)];
  if (!pricing) return null;
  const input = Math.max(0, Number(inputTokens) || 0);
  const output = Math.max(0, Number(outputTokens) || 0);
  return (input / 1_000_000) * pricing.input + (output / 1_000_000) * pricing.output;
}

export function getAiModelStagePolicy(stage) {
  const policy = STAGE_POLICY[stage];
  if (!policy) throw new Error(`Unknown AI model stage: ${stage}`);
  return policy;
}
