import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(__dirname, 'phase2-finalize-local.mjs');
const generatedPath = path.join(__dirname, '.phase2-finalize-local.generated.mjs');

function fail(message) {
  throw new Error(`STOP: ${message}`);
}

const branch = execFileSync('git', ['branch', '--show-current'], {
  cwd: repoRoot,
  encoding: 'utf8',
}).trim();
if (branch !== 'internal-phase2-atomic-publication-20260830') {
  fail(`Wrong branch. Found ${branch || '(none)'}.`);
}

let source = fs.readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n');

const staleBlob = "['src/lib/reportRevisionAuthority.js', 'feadb90ded64ddcca69f932b060004883bce7f64']";
const governedBlob = "['src/lib/reportRevisionAuthority.js', 'dfb3e5651bd9d96cb4f00f332fff8fe414aee24d']";
if (!source.includes(staleBlob)) {
  fail('The Phase 2 patcher no longer contains the expected stale revision-authority guard. Refusing to transform an unknown harness.');
}
source = source.replace(staleBlob, governedBlob);

const revisionSectionMarker = [
  '// -----------------------------------------------------------------------------',
  '// 2. Revision authority consumes governed publication_state, with legacy status fallback only.',
  '// -----------------------------------------------------------------------------',
].join('\n');
const surfaceSectionMarker = [
  '// -----------------------------------------------------------------------------',
  '// 3. Customer report surface consumes publication_state, never reports.status.',
  '// -----------------------------------------------------------------------------',
].join('\n');

const revisionStart = source.indexOf(revisionSectionMarker);
const surfaceStart = source.indexOf(surfaceSectionMarker, revisionStart + 1);
if (revisionStart < 0 || surfaceStart < 0 || surfaceStart <= revisionStart) {
  fail('Could not isolate the stale revision-authority patch section safely.');
}

const alreadyCommittedAuthority = [
  '// -----------------------------------------------------------------------------',
  '// 2. Revision authority is already committed on the Phase 2 branch.',
  '// The branch version derives publication strictly from governed publication_state.',
  '// No local rewrite is permitted here.',
  '// -----------------------------------------------------------------------------',
  '',
].join('\n');

source = source.slice(0, revisionStart) + alreadyCommittedAuthority + source.slice(surfaceStart);

if (source.includes('normalizeReportPublicationState(row = {})')) {
  fail('Stale revision-authority rewrite survived generated patcher transformation.');
}

if (fs.existsSync(generatedPath)) {
  fs.unlinkSync(generatedPath);
}

try {
  fs.writeFileSync(generatedPath, source, 'utf8');
  execFileSync(process.execPath, ['--check', generatedPath], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [generatedPath], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
} finally {
  if (fs.existsSync(generatedPath)) {
    fs.unlinkSync(generatedPath);
  }
}
