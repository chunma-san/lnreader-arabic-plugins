import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import './generate.js';

const files = fs
  .readdirSync('plugins/arabic')
  .filter(file => file.endsWith('.ts') && !file.endsWith('.broken.ts'))
  .sort();
const requested = process.argv.slice(2);
const results = [];
fs.mkdirSync('.arabic-health', { recursive: true });

for (const file of files) {
  if (requested.length && !requested.includes(file)) continue;
  const run = spawnSync(
    process.execPath,
    ['scripts/live-check-plugin.js', path.join('plugins/arabic', file)],
    { encoding: 'utf8', timeout: 150_000, maxBuffer: 2 * 1024 * 1024 },
  );
  const output = (run.stdout || '') + (run.stderr || '');
  const table = output.split(/\r?\n/).filter(line => /^\| `/.test(line));
  const status =
    run.error || !table.length
      ? 'INCONCLUSIVE'
      : run.status !== 0
        ? 'FAIL'
        : output.includes('Result: ⚠️')
          ? 'INCONCLUSIVE'
          : 'PASS';
  results.push({ file, status, checks: table, error: run.error?.message });
  console.log(`${status}: ${file}`);
  fs.writeFileSync(
    '.arabic-health/report.json',
    JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2) +
      '\n',
  );
}
if (!results.length) throw new Error('No Arabic plugins selected');
const report = [
  '# Arabic plugin health',
  '',
  'Live website checks. INCONCLUSIVE means the check could not establish whether the plugin works.',
  '',
  '| Plugin | Result |',
  '| --- | --- |',
  ...results.map(result => `| ${result.file} | ${result.status} |`),
  '',
  ...results.flatMap(result => [
    `## ${result.file}`,
    '',
    '| Check | Result | Details |',
    '| --- | --- | --- |',
    ...result.checks,
    '',
  ]),
].join('\n');
fs.writeFileSync('.arabic-health/report.md', report);
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
}
if (results.some(result => result.status === 'FAIL')) process.exitCode = 1;
