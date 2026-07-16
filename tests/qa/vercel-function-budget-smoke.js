import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const apiRoot = path.join(root, 'api');
const HOBBY_FUNCTION_LIMIT = 12;

function collectDeployableJavaScriptFunctions(directory, relative = '') {
  const functions = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      functions.push(...collectDeployableJavaScriptFunctions(absolutePath, relativePath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.js')) {
      functions.push(relativePath.replaceAll('\\', '/'));
    }
  }
  return functions.sort();
}

const deployableFunctions = collectDeployableJavaScriptFunctions(apiRoot);

assert.ok(
  deployableFunctions.length <= HOBBY_FUNCTION_LIMIT,
  `Vercel Hobby function budget exceeded: ${deployableFunctions.length}/${HOBBY_FUNCTION_LIMIT}\n${deployableFunctions.join('\n')}`
);
assert.ok(!deployableFunctions.includes('admin/quality-incidents.js'));
assert.ok(deployableFunctions.includes('admin/queue-metrics.js'));

console.log(`vercel-function-budget-smoke: PASS (${deployableFunctions.length}/${HOBBY_FUNCTION_LIMIT})`);
