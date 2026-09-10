import assert from 'node:assert/strict';
import {
  AI_MODEL_ARCHITECTURE_FLAG,
  AI_MODEL_EVAL_01_CANDIDATES,
  AI_MODEL_STAGES,
  AI_MODEL_TARGET_ARCHITECTURE,
  OPENAI_MODEL_IDS,
  buildChatCompletionModelControls,
  buildResponsesModelControls,
  estimateOpenAiTokenCostUsd,
  isTargetArchitectureEnabled,
  normalizeReasoningEffort,
  resolveAiStageConfig,
} from '../../lib/ai-model-architecture.js';

assert.equal(OPENAI_MODEL_IDS.GPT_56_LUNA, 'gpt-5.6-luna');
assert.equal(OPENAI_MODEL_IDS.GPT_56_TERRA, 'gpt-5.6-terra');
assert.equal(OPENAI_MODEL_IDS.GPT_56_SOL, 'gpt-5.6-sol');
assert.equal(OPENAI_MODEL_IDS.GPT_6_ASTRA, 'gpt-6-astra');

assert.equal(AI_MODEL_TARGET_ARCHITECTURE[AI_MODEL_STAGES.RENDERED_REPORT_QA].model, OPENAI_MODEL_IDS.GPT_4O);
assert.equal(AI_MODEL_TARGET_ARCHITECTURE[AI_MODEL_STAGES.SOURCE_PACKAGE_QA].model, OPENAI_MODEL_IDS.GPT_4O);
assert.equal(AI_MODEL_TARGET_ARCHITECTURE[AI_MODEL_STAGES.QA_MANAGER].model, OPENAI_MODEL_IDS.GPT_4O);
assert.equal(AI_MODEL_TARGET_ARCHITECTURE[AI_MODEL_STAGES.QA_MANAGER].reasoning_effort, null);

for (const stage of [AI_MODEL_STAGES.T12_RECOVERY, AI_MODEL_STAGES.RENT_ROLL_RECOVERY, AI_MODEL_STAGES.SUPPORT_DOC_RECOVERY]) {
  const target = AI_MODEL_TARGET_ARCHITECTURE[stage];
  assert.equal(target.model, OPENAI_MODEL_IDS.GPT_4O, `${stage} should preserve the certified recovery default`);
  assert.equal(target.evaluation_candidate_model, OPENAI_MODEL_IDS.GPT_56_TERRA, `${stage} should expose Terra as a shadow candidate`);
  assert.equal(target.evaluation_candidate_reasoning_effort, 'none');
}

const legacyEnv = {};
assert.equal(isTargetArchitectureEnabled(legacyEnv), false);
assert.equal(resolveAiStageConfig(AI_MODEL_STAGES.QA_MANAGER, legacyEnv).model, OPENAI_MODEL_IDS.GPT_4O);
assert.equal(resolveAiStageConfig(AI_MODEL_STAGES.RENDERED_REPORT_QA, legacyEnv).model, OPENAI_MODEL_IDS.GPT_4O);
assert.equal(resolveAiStageConfig(AI_MODEL_STAGES.SOURCE_PACKAGE_QA, legacyEnv).model, OPENAI_MODEL_IDS.GPT_4O);

const targetEnv = { [AI_MODEL_ARCHITECTURE_FLAG]: 'true' };
assert.equal(isTargetArchitectureEnabled(targetEnv), true);
assert.deepEqual(
  {
    model: resolveAiStageConfig(AI_MODEL_STAGES.RENDERED_REPORT_QA, targetEnv).model,
    reasoning: resolveAiStageConfig(AI_MODEL_STAGES.RENDERED_REPORT_QA, targetEnv).reasoning_effort,
  },
  { model: OPENAI_MODEL_IDS.GPT_4O, reasoning: null }
);
assert.deepEqual(
  {
    model: resolveAiStageConfig(AI_MODEL_STAGES.QA_MANAGER, targetEnv).model,
    reasoning: resolveAiStageConfig(AI_MODEL_STAGES.QA_MANAGER, targetEnv).reasoning_effort,
  },
  { model: OPENAI_MODEL_IDS.GPT_4O, reasoning: null }
);
assert.equal(resolveAiStageConfig(AI_MODEL_STAGES.T12_RECOVERY, targetEnv).model, OPENAI_MODEL_IDS.GPT_4O);

const explicitEnv = {
  [AI_MODEL_ARCHITECTURE_FLAG]: 'true',
  QA_MANAGER_MODEL: OPENAI_MODEL_IDS.GPT_56_TERRA,
  QA_MANAGER_REASONING_EFFORT: 'low',
};
const explicitManager = resolveAiStageConfig(AI_MODEL_STAGES.QA_MANAGER, explicitEnv);
assert.equal(explicitManager.model, OPENAI_MODEL_IDS.GPT_56_TERRA);
assert.equal(explicitManager.reasoning_effort, 'low');
assert.equal(explicitManager.model_source, 'QA_MANAGER_MODEL');
assert.equal(explicitManager.reasoning_source, 'QA_MANAGER_REASONING_EFFORT');

assert.deepEqual(buildChatCompletionModelControls({ model: OPENAI_MODEL_IDS.GPT_4O }), { temperature: 0 });
assert.deepEqual(
  buildChatCompletionModelControls({ model: OPENAI_MODEL_IDS.GPT_56_TERRA, reasoningEffort: 'medium' }),
  { reasoning_effort: 'medium' }
);
assert.deepEqual(
  buildChatCompletionModelControls({ model: OPENAI_MODEL_IDS.GPT_6_ASTRA, reasoningEffort: 'none' }),
  { reasoning_effort: 'low' }
);
assert.deepEqual(
  buildResponsesModelControls({ model: OPENAI_MODEL_IDS.GPT_56_SOL, reasoningEffort: 'high' }),
  { reasoning: { effort: 'high' } }
);
assert.equal(normalizeReasoningEffort('none', { model: OPENAI_MODEL_IDS.GPT_6_ASTRA, fallback: 'low' }), 'low');

const terraCost = estimateOpenAiTokenCostUsd({ model: OPENAI_MODEL_IDS.GPT_56_TERRA, inputTokens: 1_000_000, outputTokens: 1_000_000 });
assert.equal(terraCost, 14);
const unknownCost = estimateOpenAiTokenCostUsd({ model: OPENAI_MODEL_IDS.GPT_4O, inputTokens: 1000, outputTokens: 1000 });
assert.equal(unknownCost, null);

assert.ok(AI_MODEL_EVAL_01_CANDIDATES.some((candidate) => candidate.model === OPENAI_MODEL_IDS.GPT_56_TERRA));
assert.ok(AI_MODEL_EVAL_01_CANDIDATES.some((candidate) => candidate.model === OPENAI_MODEL_IDS.GPT_56_SOL));
assert.ok(AI_MODEL_EVAL_01_CANDIDATES.some((candidate) => candidate.model === OPENAI_MODEL_IDS.GPT_6_ASTRA && candidate.scope === 'hard'));

console.log('ai-model-architecture smoke PASS');
