import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const apiKey = String(process.env.OPENAI_API_KEY || '').trim();
const outputDir = path.resolve(process.env.AI_MODEL_EVAL_02_OUTPUT_DIR || '.artifacts/ai-model-eval-02');
const timeoutMs = Math.max(30_000, Number(process.env.AI_MODEL_EVAL_02_TIMEOUT_MS) || 120_000);

if (!apiKey) {
  console.error('AI MODEL EVAL 02 requires OPENAI_API_KEY. No model request was sent.');
  process.exit(2);
}

const MODELS = Object.freeze([
  Object.freeze({ label: 'gpt4o_baseline', model: 'gpt-4o-2024-08-06', reasoning_effort: 'none' }),
  Object.freeze({ label: 'terra_candidate', model: 'gpt-5.6-terra', reasoning_effort: 'none' }),
]);

const JOBS = Object.freeze([
  't12_recovery',
  'rent_roll_recovery',
  'acquisition_assumptions_recovery',
  'current_mortgage_recovery',
  'renovation_capex_recovery',
  'property_tax_recovery',
  'appraisal_recovery',
]);

const PRICE_PER_MILLION = Object.freeze({
  'gpt-4o-2024-08-06': Object.freeze({ input: 2.5, output: 10 }),
  'gpt-5.6-terra': Object.freeze({ input: 2, output: 12 }),
});

const tokenCount = (usage, keys) => {
  for (const key of keys) {
    const value = Number(usage?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
};

const addCost = (result) => {
  const pricing = PRICE_PER_MILLION[result.model];
  const inputTokens = tokenCount(result.usage, ['input_tokens', 'prompt_tokens']);
  const outputTokens = tokenCount(result.usage, ['output_tokens', 'completion_tokens']);
  const costUsd = pricing
    ? (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output
    : null;
  return { ...result, input_tokens: inputTokens, output_tokens: outputTokens, estimated_cost_usd: costUsd };
};

const parseWorkerOutput = (stdout) => {
  const lines = String(stdout || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      return JSON.parse(lines[index]);
    } catch {
      // Keep looking for the worker JSON result.
    }
  }
  return null;
};

const results = [];
for (const candidate of MODELS) {
  for (const job of JOBS) {
    process.stdout.write(`[AI MODEL EVAL 02] ${candidate.label} -> ${job}\n`);
    const child = spawnSync(
      process.execPath,
      ['scripts/ai-model-eval-02-worker.js', job, candidate.model, candidate.reasoning_effort],
      {
        cwd: process.cwd(),
        env: process.env,
        encoding: 'utf8',
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    const parsed = parseWorkerOutput(child.stdout);
    if (!parsed) {
      results.push({
        eval: 'AI_MODEL_EVAL_02',
        job,
        model: candidate.model,
        model_label: candidate.label,
        reasoning_effort: candidate.reasoning_effort,
        pass: false,
        accepted: false,
        field_hits: 0,
        field_total: 0,
        field_accuracy: 0,
        elapsed_ms: null,
        worker_status: child.signal ? `signal:${child.signal}` : `exit:${child.status}`,
        worker_stderr: String(child.stderr || '').slice(0, 2000),
        error: 'worker_result_missing',
      });
      continue;
    }

    results.push(addCost({
      ...parsed,
      model_label: candidate.label,
      worker_status: child.signal ? `signal:${child.signal}` : `exit:${child.status}`,
    }));
  }
}

const groupByModel = (model) => results.filter((result) => result.model === model);
const summarizeModel = (candidate) => {
  const rows = groupByModel(candidate.model);
  const completed = rows.filter((row) => row.field_total > 0).length;
  const passed = rows.filter((row) => row.pass).length;
  const fieldHits = rows.reduce((sum, row) => sum + Number(row.field_hits || 0), 0);
  const fieldTotal = rows.reduce((sum, row) => sum + Number(row.field_total || 0), 0);
  const elapsedMs = rows.reduce((sum, row) => sum + Number(row.elapsed_ms || 0), 0);
  const inputTokens = rows.reduce((sum, row) => sum + Number(row.input_tokens || 0), 0);
  const outputTokens = rows.reduce((sum, row) => sum + Number(row.output_tokens || 0), 0);
  const estimatedCostUsd = rows.reduce((sum, row) => sum + Number(row.estimated_cost_usd || 0), 0);
  return {
    label: candidate.label,
    model: candidate.model,
    jobs_completed: completed,
    jobs_passed: passed,
    jobs_total: JOBS.length,
    field_hits: fieldHits,
    field_total: fieldTotal,
    field_accuracy: fieldTotal ? fieldHits / fieldTotal : 0,
    elapsed_ms: elapsedMs,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    estimated_cost_usd: estimatedCostUsd,
  };
};

const modelSummaries = MODELS.map(summarizeModel);
const byJob = JOBS.map((job) => {
  const baseline = results.find((result) => result.job === job && result.model === MODELS[0].model);
  const terra = results.find((result) => result.job === job && result.model === MODELS[1].model);
  let quality_winner = 'tie';
  if (Boolean(terra?.pass) !== Boolean(baseline?.pass)) quality_winner = terra?.pass ? 'terra_candidate' : 'gpt4o_baseline';
  else if (Number(terra?.field_accuracy || 0) !== Number(baseline?.field_accuracy || 0)) {
    quality_winner = Number(terra?.field_accuracy || 0) > Number(baseline?.field_accuracy || 0) ? 'terra_candidate' : 'gpt4o_baseline';
  }
  return {
    job,
    quality_winner,
    gpt4o: baseline || null,
    terra: terra || null,
  };
});

const complete = modelSummaries.every((summary) => summary.jobs_completed === JOBS.length);
const artifact = {
  eval: 'AI_MODEL_EVAL_02',
  doctrine: 'LLM intelligence increases recoverability; deterministic contracts preserve truth.',
  quality_priority: 'pass/fail and deterministic field fidelity outrank latency and token cost',
  compared_models: MODELS,
  recovery_jobs: JOBS,
  complete,
  model_summaries: modelSummaries,
  by_job: byJob,
  generated_at: new Date().toISOString(),
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'results.json'), `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');

const percent = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;
const dollars = (value) => `$${Number(value || 0).toFixed(4)}`;
const markdown = [
  '# AI MODEL EVAL 02',
  '',
  'Quality-first comparison of GPT-4o versus GPT-5.6 Terra on all seven InvestorIQ recovery jobs.',
  '',
  '| Model | Jobs Passed | Field Accuracy | Elapsed | Input Tokens | Output Tokens | Est. Cost |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...modelSummaries.map((summary) => `| ${summary.model} | ${summary.jobs_passed}/${summary.jobs_total} | ${percent(summary.field_accuracy)} | ${(summary.elapsed_ms / 1000).toFixed(1)}s | ${summary.input_tokens} | ${summary.output_tokens} | ${dollars(summary.estimated_cost_usd)} |`),
  '',
  '| Recovery Job | Quality Winner | GPT-4o | Terra |',
  '| --- | --- | --- | --- |',
  ...byJob.map((entry) => `| ${entry.job} | ${entry.quality_winner} | ${entry.gpt4o?.field_hits || 0}/${entry.gpt4o?.field_total || 0} fields, ${entry.gpt4o?.pass ? 'PASS' : 'FAIL'} | ${entry.terra?.field_hits || 0}/${entry.terra?.field_total || 0} fields, ${entry.terra?.pass ? 'PASS' : 'FAIL'} |`),
  '',
  `Complete: ${complete ? 'YES' : 'NO'}`,
  '',
].join('\n');
fs.writeFileSync(path.join(outputDir, 'results.md'), markdown, 'utf8');

console.log('\n' + markdown);
console.log(`[AI MODEL EVAL 02] JSON: ${path.join(outputDir, 'results.json')}`);

if (!complete) {
  console.error('AI MODEL EVAL 02 is incomplete. All seven recovery jobs must execute for both models.');
  process.exitCode = 1;
}
