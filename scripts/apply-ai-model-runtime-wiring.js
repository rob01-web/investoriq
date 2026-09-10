import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const write = (path, value) => fs.writeFileSync(path, value, 'utf8');

function replaceRequired(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) {
    throw new Error(`AI model runtime wiring could not find expected source for ${label}`);
  }
  return source.replace(before, after);
}

function replaceAllRequired(source, before, after, label) {
  if (!source.includes(before)) {
    if (source.includes(after)) return source;
    throw new Error(`AI model runtime wiring could not find expected source for ${label}`);
  }
  return source.split(before).join(after);
}

function patchRenderedReportQa() {
  const path = 'api/_lib/qa-review.js';
  let source = read(path);
  source = replaceRequired(
    source,
    'import { classifyOpenAiError } from "../../lib/openai-error-classifier.js";\n',
    'import { classifyOpenAiError } from "../../lib/openai-error-classifier.js";\nimport {\n  AI_MODEL_STAGES,\n  buildChatCompletionModelControls,\n  resolveAiStageConfig,\n} from "../../lib/ai-model-architecture.js";\n',
    'rendered QA architecture import'
  );
  source = replaceRequired(
    source,
    'const REVIEW_VERSION = "2026.05.05.1";\n// Fallback follows the existing project convention used by extraction-recovery helpers.\nconst DEFAULT_MODEL =\n  process.env.QA_REVIEW_MODEL ||\n  process.env.OPENAI_REPORT_QA_MODEL ||\n  "gpt-4o-mini";\n',
    'const REVIEW_VERSION = "2026.05.05.1";\nconst DEFAULT_STAGE_CONFIG = resolveAiStageConfig(AI_MODEL_STAGES.RENDERED_REPORT_QA);\nconst DEFAULT_MODEL = DEFAULT_STAGE_CONFIG.model;\nconst DEFAULT_REASONING_EFFORT = DEFAULT_STAGE_CONFIG.reasoning_effort;\n',
    'rendered QA stage default'
  );
  source = replaceRequired(
    source,
    'async function callReviewModel({ apiKey, model, userContent, timeoutMs = DEFAULT_TIMEOUT_MS }) {',
    'async function callReviewModel({ apiKey, model, reasoningEffort, userContent, timeoutMs = DEFAULT_TIMEOUT_MS }) {',
    'rendered QA call signature'
  );
  source = replaceRequired(
    source,
    '        model,\n        temperature: 0,\n        messages:',
    '        model,\n        ...buildChatCompletionModelControls({ model, reasoningEffort }),\n        messages:',
    'rendered QA model controls'
  );
  source = replaceRequired(
    source,
    '  model = DEFAULT_MODEL,\n  timeoutMs = DEFAULT_TIMEOUT_MS,\n} = {}) {',
    '  model = DEFAULT_MODEL,\n  reasoningEffort = DEFAULT_REASONING_EFFORT,\n  timeoutMs = DEFAULT_TIMEOUT_MS,\n} = {}) {',
    'rendered QA public reasoning parameter'
  );
  source = replaceRequired(
    source,
    '    model,\n    userContent,\n    timeoutMs,\n  });',
    '    model,\n    reasoningEffort,\n    userContent,\n    timeoutMs,\n  });',
    'rendered QA call forwarding'
  );
  source = replaceRequired(
    source,
    '    model: usedModel,\n    usage,\n    version: REVIEW_VERSION,',
    '    model: usedModel,\n    reasoning_effort: reasoningEffort || null,\n    model_architecture_version: DEFAULT_STAGE_CONFIG.version,\n    model_architecture_enabled: DEFAULT_STAGE_CONFIG.architecture_enabled,\n    usage,\n    version: REVIEW_VERSION,',
    'rendered QA result metadata'
  );
  write(path, source);
}

function patchSourcePackageQa() {
  const path = 'api/_lib/source-package-qa.js';
  let source = read(path);
  source = replaceRequired(
    source,
    'import { classifyOpenAiError } from "../../lib/openai-error-classifier.js";\n',
    'import { classifyOpenAiError } from "../../lib/openai-error-classifier.js";\nimport {\n  AI_MODEL_STAGES,\n  buildChatCompletionModelControls,\n  resolveAiStageConfig,\n} from "../../lib/ai-model-architecture.js";\n',
    'source package QA architecture import'
  );
  source = replaceRequired(
    source,
    'const SOURCE_PACKAGE_QA_VERSION = "2026.05.07.1";\nconst DEFAULT_MODEL =\n  process.env.QA_SOURCE_PACKAGE_MODEL ||\n  process.env.QA_REVIEW_MODEL ||\n  process.env.OPENAI_REPORT_QA_MODEL ||\n  "gpt-4o-mini";\n',
    'const SOURCE_PACKAGE_QA_VERSION = "2026.05.07.1";\nconst DEFAULT_STAGE_CONFIG = resolveAiStageConfig(AI_MODEL_STAGES.SOURCE_PACKAGE_QA);\nconst DEFAULT_MODEL = DEFAULT_STAGE_CONFIG.model;\nconst DEFAULT_REASONING_EFFORT = DEFAULT_STAGE_CONFIG.reasoning_effort;\n',
    'source package QA stage default'
  );
  source = replaceRequired(
    source,
    'async function callSourcePackageReviewModel({ apiKey, model, userContent, timeoutMs }) {',
    'async function callSourcePackageReviewModel({ apiKey, model, reasoningEffort, userContent, timeoutMs }) {',
    'source package QA call signature'
  );
  source = replaceRequired(
    source,
    '        model,\n        temperature: 0,\n        messages:',
    '        model,\n        ...buildChatCompletionModelControls({ model, reasoningEffort }),\n        messages:',
    'source package QA model controls'
  );
  source = replaceRequired(
    source,
    '  model = DEFAULT_MODEL,\n  timeoutMs = DEFAULT_TIMEOUT_MS,\n} = {}) {',
    '  model = DEFAULT_MODEL,\n  reasoningEffort = DEFAULT_REASONING_EFFORT,\n  timeoutMs = DEFAULT_TIMEOUT_MS,\n} = {}) {',
    'source package QA public reasoning parameter'
  );
  source = replaceRequired(
    source,
    '    apiKey,\n    model,\n    timeoutMs,\n    userContent: JSON.stringify(compactPayload),\n  });',
    '    apiKey,\n    model,\n    reasoningEffort,\n    timeoutMs,\n    userContent: JSON.stringify(compactPayload),\n  });',
    'source package QA call forwarding'
  );
  source = replaceRequired(
    source,
    '    model: usedModel,\n    usage,\n    timeout_ms: timeoutMs,',
    '    model: usedModel,\n    reasoning_effort: reasoningEffort || null,\n    model_architecture_version: DEFAULT_STAGE_CONFIG.version,\n    model_architecture_enabled: DEFAULT_STAGE_CONFIG.architecture_enabled,\n    usage,\n    timeout_ms: timeoutMs,',
    'source package QA result metadata'
  );
  write(path, source);
}

function patchQaManager() {
  const path = 'api/_lib/qa-manager-review.js';
  let source = read(path);
  source = replaceRequired(
    source,
    'import { classifyOpenAiError } from "../../lib/openai-error-classifier.js";\n',
    'import { classifyOpenAiError } from "../../lib/openai-error-classifier.js";\nimport {\n  AI_MODEL_STAGES,\n  buildChatCompletionModelControls,\n  resolveAiStageConfig,\n} from "../../lib/ai-model-architecture.js";\n',
    'QA manager architecture import'
  );
  source = replaceRequired(
    source,
    'const QA_MANAGER_REVIEW_VERSION = "2026.05.07.1";\nconst DEFAULT_MODEL =\n  process.env.QA_MANAGER_MODEL ||\n  process.env.QA_SOURCE_PACKAGE_MODEL ||\n  process.env.QA_REVIEW_MODEL ||\n  process.env.OPENAI_REPORT_QA_MODEL ||\n  "gpt-4o-mini";\n',
    'const QA_MANAGER_REVIEW_VERSION = "2026.05.07.1";\nconst DEFAULT_STAGE_CONFIG = resolveAiStageConfig(AI_MODEL_STAGES.QA_MANAGER);\nconst DEFAULT_MODEL = DEFAULT_STAGE_CONFIG.model;\nconst DEFAULT_REASONING_EFFORT = DEFAULT_STAGE_CONFIG.reasoning_effort;\n',
    'QA manager stage default'
  );
  source = replaceRequired(
    source,
    'async function callManagerModel({ apiKey, model, timeoutMs, userContent }) {',
    'async function callManagerModel({ apiKey, model, reasoningEffort, timeoutMs, userContent }) {',
    'QA manager call signature'
  );
  source = replaceRequired(
    source,
    '        model,\n        temperature: 0,\n        messages:',
    '        model,\n        ...buildChatCompletionModelControls({ model, reasoningEffort }),\n        messages:',
    'QA manager model controls'
  );
  source = replaceRequired(
    source,
    '  model = DEFAULT_MODEL,\n  timeoutMs = DEFAULT_TIMEOUT_MS,\n} = {}) {',
    '  model = DEFAULT_MODEL,\n  reasoningEffort = DEFAULT_REASONING_EFFORT,\n  timeoutMs = DEFAULT_TIMEOUT_MS,\n} = {}) {',
    'QA manager public reasoning parameter'
  );
  source = replaceRequired(
    source,
    '    apiKey,\n    model,\n    timeoutMs,\n    userContent: JSON.stringify(payload),\n  });',
    '    apiKey,\n    model,\n    reasoningEffort,\n    timeoutMs,\n    userContent: JSON.stringify(payload),\n  });',
    'QA manager call forwarding'
  );
  source = replaceRequired(
    source,
    '    model: usedModel,\n    usage,\n    timeout_ms: timeoutMs,',
    '    model: usedModel,\n    reasoning_effort: reasoningEffort || null,\n    model_architecture_version: DEFAULT_STAGE_CONFIG.version,\n    model_architecture_enabled: DEFAULT_STAGE_CONFIG.architecture_enabled,\n    usage,\n    timeout_ms: timeoutMs,',
    'QA manager result metadata'
  );
  write(path, source);
}

function patchT12Recovery() {
  const path = 'lib/ai-t12-recovery.js';
  let source = read(path);
  source = replaceRequired(
    source,
    "const OPENAI_T12_RECOVERY_MODEL =\n  process.env.OPENAI_T12_RECOVERY_MODEL || 'gpt-4o-2024-08-06';\nconst OPENAI_TEMPERATURE = 0;\n",
    "import {\n  AI_MODEL_STAGES,\n  buildResponsesModelControls,\n  resolveAiStageConfig,\n} from './ai-model-architecture.js';\n\nconst RECOVERY_STAGE_CONFIG = resolveAiStageConfig(AI_MODEL_STAGES.T12_RECOVERY);\nconst OPENAI_T12_RECOVERY_MODEL = RECOVERY_STAGE_CONFIG.model;\nconst OPENAI_T12_RECOVERY_REASONING_EFFORT = RECOVERY_STAGE_CONFIG.reasoning_effort;\nconst OPENAI_TEMPERATURE = 0;\n",
    'T12 recovery architecture default'
  );
  source = replaceRequired(
    source,
    '        model: OPENAI_T12_RECOVERY_MODEL,\n        temperature: OPENAI_TEMPERATURE,\n        input:',
    '        model: OPENAI_T12_RECOVERY_MODEL,\n        ...buildResponsesModelControls({\n          model: OPENAI_T12_RECOVERY_MODEL,\n          reasoningEffort: OPENAI_T12_RECOVERY_REASONING_EFFORT,\n          legacyTemperature: OPENAI_TEMPERATURE,\n        }),\n        input:',
    'T12 recovery model controls'
  );
  write(path, source);
}

function patchRentRollRecovery() {
  const path = 'lib/ai-rent-roll-recovery.js';
  let source = read(path);
  source = replaceRequired(
    source,
    "const OPENAI_RENT_ROLL_RECOVERY_MODEL =\n  process.env.OPENAI_RENT_ROLL_RECOVERY_MODEL || 'gpt-4o-2024-08-06';\nconst OPENAI_TEMPERATURE = 0;\n",
    "import {\n  AI_MODEL_STAGES,\n  buildResponsesModelControls,\n  resolveAiStageConfig,\n} from './ai-model-architecture.js';\n\nconst RECOVERY_STAGE_CONFIG = resolveAiStageConfig(AI_MODEL_STAGES.RENT_ROLL_RECOVERY);\nconst OPENAI_RENT_ROLL_RECOVERY_MODEL = RECOVERY_STAGE_CONFIG.model;\nconst OPENAI_RENT_ROLL_RECOVERY_REASONING_EFFORT = RECOVERY_STAGE_CONFIG.reasoning_effort;\nconst OPENAI_TEMPERATURE = 0;\n",
    'rent roll recovery architecture default'
  );
  source = replaceRequired(
    source,
    '        model: OPENAI_RENT_ROLL_RECOVERY_MODEL,\n        temperature: OPENAI_TEMPERATURE,\n        input:',
    '        model: OPENAI_RENT_ROLL_RECOVERY_MODEL,\n        ...buildResponsesModelControls({\n          model: OPENAI_RENT_ROLL_RECOVERY_MODEL,\n          reasoningEffort: OPENAI_RENT_ROLL_RECOVERY_REASONING_EFFORT,\n          legacyTemperature: OPENAI_TEMPERATURE,\n        }),\n        input:',
    'rent roll recovery model controls'
  );
  write(path, source);
}

function patchSupportDocRecovery() {
  const path = 'lib/ai-support-doc-recovery.js';
  let source = read(path);
  source = replaceRequired(
    source,
    'import { classifyOpenAiError } from "./openai-error-classifier.js";\n',
    'import { classifyOpenAiError } from "./openai-error-classifier.js";\nimport {\n  AI_MODEL_STAGES,\n  buildResponsesModelControls,\n  resolveAiStageConfig,\n} from "./ai-model-architecture.js";\n',
    'support recovery architecture import'
  );
  source = replaceRequired(
    source,
    "const OPENAI_MODEL = process.env.OPENAI_SUPPORT_DOC_RECOVERY_MODEL || 'gpt-4o-2024-08-06';\nconst OPENAI_TEMPERATURE = 0;\n",
    "const RECOVERY_STAGE_CONFIG = resolveAiStageConfig(AI_MODEL_STAGES.SUPPORT_DOC_RECOVERY);\nconst OPENAI_MODEL = RECOVERY_STAGE_CONFIG.model;\nconst OPENAI_REASONING_EFFORT = RECOVERY_STAGE_CONFIG.reasoning_effort;\nconst OPENAI_TEMPERATURE = 0;\n",
    'support recovery architecture default'
  );
  source = replaceAllRequired(
    source,
    '        model: OPENAI_MODEL,\n        temperature: OPENAI_TEMPERATURE,\n        input:',
    '        model: OPENAI_MODEL,\n        ...buildResponsesModelControls({\n          model: OPENAI_MODEL,\n          reasoningEffort: OPENAI_REASONING_EFFORT,\n          legacyTemperature: OPENAI_TEMPERATURE,\n        }),\n        input:',
    'support recovery model controls'
  );
  write(path, source);
}

function patchPackageJson() {
  const path = 'package.json';
  const pkg = JSON.parse(read(path));
  pkg.scripts ||= {};
  pkg.scripts['qa:diagnostic:ai-model-architecture'] = 'node tests/qa/ai-model-architecture-smoke.js';
  pkg.scripts['qa:eval:ai-model-01'] = 'node scripts/ai-model-eval-01.js';
  write(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

function patchCanonicalQa() {
  const path = 'tests/qa/run-all.js';
  let source = read(path);
  source = replaceRequired(
    source,
    "  ['architecture authority', 'launch-critical-architecture-smoke.js'],\n",
    "  ['architecture authority', 'launch-critical-architecture-smoke.js'],\n  ['AI model architecture', 'ai-model-architecture-smoke.js'],\n",
    'canonical QA AI model architecture check'
  );
  write(path, source);
}

patchRenderedReportQa();
patchSourcePackageQa();
patchQaManager();
patchT12Recovery();
patchRentRollRecovery();
patchSupportDocRecovery();
patchPackageJson();
patchCanonicalQa();

console.log('AI model runtime wiring applied successfully.');
