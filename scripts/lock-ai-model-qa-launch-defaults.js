import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const write = (path, value) => fs.writeFileSync(path, value, 'utf8');

function replaceCount(source, before, after, expectedCount, label) {
  const count = source.split(before).length - 1;
  if (count === 0 && source.includes(after)) return source;
  if (count !== expectedCount) throw new Error(`${label}: expected ${expectedCount}, found ${count}`);
  return source.split(before).join(after);
}

const architecturePath = 'lib/ai-model-architecture.js';
let architecture = read(architecturePath);
architecture = replaceCount(
  architecture,
  "export const AI_MODEL_ARCHITECTURE_VERSION = '2026-09-10.2';",
  "export const AI_MODEL_ARCHITECTURE_VERSION = '2026-09-10.3';",
  1,
  'architecture version'
);
architecture = replaceCount(
  architecture,
  "    legacyModel: OPENAI_MODEL_IDS.GPT_4O_MINI,\n    targetModel: OPENAI_MODEL_IDS.GPT_4O,",
  "    legacyModel: OPENAI_MODEL_IDS.GPT_4O,\n    targetModel: OPENAI_MODEL_IDS.GPT_4O,",
  3,
  'QA GPT-4o legacy defaults'
);
write(architecturePath, architecture);

const smokePath = 'tests/qa/ai-model-architecture-smoke.js';
let smoke = read(smokePath);
smoke = replaceCount(
  smoke,
  "assert.equal(resolveAiStageConfig(AI_MODEL_STAGES.QA_MANAGER, legacyEnv).model, OPENAI_MODEL_IDS.GPT_4O_MINI);",
  "assert.equal(resolveAiStageConfig(AI_MODEL_STAGES.QA_MANAGER, legacyEnv).model, OPENAI_MODEL_IDS.GPT_4O);",
  1,
  'QA Manager legacy assertion'
);
smoke = replaceCount(
  smoke,
  "assert.equal(resolveAiStageConfig(AI_MODEL_STAGES.RENDERED_REPORT_QA, legacyEnv).model, OPENAI_MODEL_IDS.GPT_4O_MINI);",
  "assert.equal(resolveAiStageConfig(AI_MODEL_STAGES.RENDERED_REPORT_QA, legacyEnv).model, OPENAI_MODEL_IDS.GPT_4O);\nassert.equal(resolveAiStageConfig(AI_MODEL_STAGES.SOURCE_PACKAGE_QA, legacyEnv).model, OPENAI_MODEL_IDS.GPT_4O);",
  1,
  'rendered/source QA legacy assertions'
);
write(smokePath, smoke);

console.log('GPT-4o QA launch fallback lock applied.');
