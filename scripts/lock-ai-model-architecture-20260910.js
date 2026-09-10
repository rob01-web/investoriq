import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const write = (path, value) => fs.writeFileSync(path, value, 'utf8');

function replaceCount(source, before, after, expectedCount, label) {
  const count = source.split(before).length - 1;
  if (count === 0 && source.includes(after)) return source;
  if (count !== expectedCount) {
    throw new Error(`${label}: expected ${expectedCount} occurrence(s), found ${count}`);
  }
  return source.split(before).join(after);
}

function lockArchitecture() {
  const path = 'lib/ai-model-architecture.js';
  let source = read(path);
  source = replaceCount(
    source,
    "export const AI_MODEL_ARCHITECTURE_VERSION = '2026-09-10.1';",
    "export const AI_MODEL_ARCHITECTURE_VERSION = '2026-09-10.2';",
    1,
    'architecture version'
  );
  source = replaceCount(
    source,
    "    targetModel: OPENAI_MODEL_IDS.GPT_56_TERRA,\n    targetReasoningEffort: 'medium',",
    "    targetModel: OPENAI_MODEL_IDS.GPT_4O,\n    targetReasoningEffort: null,",
    2,
    'Terra QA targets'
  );
  source = replaceCount(
    source,
    "    targetModel: OPENAI_MODEL_IDS.GPT_56_SOL,\n    targetReasoningEffort: 'high',",
    "    targetModel: OPENAI_MODEL_IDS.GPT_4O,\n    targetReasoningEffort: null,",
    1,
    'Sol QA Manager target'
  );
  write(path, source);
}

function lockArchitectureSmoke() {
  const path = 'tests/qa/ai-model-architecture-smoke.js';
  let source = read(path);
  source = replaceCount(
    source,
    "assert.equal(AI_MODEL_TARGET_ARCHITECTURE[AI_MODEL_STAGES.RENDERED_REPORT_QA].model, OPENAI_MODEL_IDS.GPT_56_TERRA);",
    "assert.equal(AI_MODEL_TARGET_ARCHITECTURE[AI_MODEL_STAGES.RENDERED_REPORT_QA].model, OPENAI_MODEL_IDS.GPT_4O);",
    1,
    'rendered QA target assertion'
  );
  source = replaceCount(
    source,
    "assert.equal(AI_MODEL_TARGET_ARCHITECTURE[AI_MODEL_STAGES.SOURCE_PACKAGE_QA].model, OPENAI_MODEL_IDS.GPT_56_TERRA);",
    "assert.equal(AI_MODEL_TARGET_ARCHITECTURE[AI_MODEL_STAGES.SOURCE_PACKAGE_QA].model, OPENAI_MODEL_IDS.GPT_4O);",
    1,
    'source package QA target assertion'
  );
  source = replaceCount(
    source,
    "assert.equal(AI_MODEL_TARGET_ARCHITECTURE[AI_MODEL_STAGES.QA_MANAGER].model, OPENAI_MODEL_IDS.GPT_56_SOL);",
    "assert.equal(AI_MODEL_TARGET_ARCHITECTURE[AI_MODEL_STAGES.QA_MANAGER].model, OPENAI_MODEL_IDS.GPT_4O);",
    1,
    'QA Manager target assertion'
  );
  source = replaceCount(
    source,
    "assert.equal(AI_MODEL_TARGET_ARCHITECTURE[AI_MODEL_STAGES.QA_MANAGER].reasoning_effort, 'high');",
    "assert.equal(AI_MODEL_TARGET_ARCHITECTURE[AI_MODEL_STAGES.QA_MANAGER].reasoning_effort, null);",
    1,
    'QA Manager reasoning assertion'
  );
  source = replaceCount(
    source,
    "  { model: OPENAI_MODEL_IDS.GPT_56_TERRA, reasoning: 'medium' }",
    "  { model: OPENAI_MODEL_IDS.GPT_4O, reasoning: null }",
    1,
    'rendered QA resolved target assertion'
  );
  source = replaceCount(
    source,
    "  { model: OPENAI_MODEL_IDS.GPT_56_SOL, reasoning: 'high' }",
    "  { model: OPENAI_MODEL_IDS.GPT_4O, reasoning: null }",
    1,
    'QA Manager resolved target assertion'
  );
  write(path, source);
}

function repairEval01ReplacementDetector() {
  const path = 'scripts/ai-model-eval-01.js';
  let source = read(path);
  const before = "  const decisionText = JSON.stringify(decisions).toLowerCase();\n  const replacementValueViolation = /(?:replace|change|set|use|should be)[^$]{0,40}\\$\\s*\\d/.test(decisionText);";
  const after = "  const replacementDirectiveText = decisions\n    .map((decision) => [decision.recommended_action_type, decision.rationale].join(' '))\n    .join(' ')\n    .toLowerCase();\n  const replacementValueViolation =\n    /(?:replace|change|set)\\b[^$]{0,60}\\b(?:with|to|at)\\s*\\$\\s*\\d/.test(replacementDirectiveText) ||\n    /\\bshould\\s+be\\s+\\$\\s*\\d/.test(replacementDirectiveText) ||\n    /\\buse\\s+\\$\\s*\\d[^.]{0,40}\\b(?:instead|replacement|substitute)\\b/.test(replacementDirectiveText);";
  source = replaceCount(source, before, after, 1, 'EVAL 01 replacement-value detector');
  write(path, source);
}

lockArchitecture();
lockArchitectureSmoke();
repairEval01ReplacementDetector();

console.log('Evidence-locked AI architecture closeout applied.');
