import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { findSecretViolations } from './git-workflow.mjs';

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.woff', '.woff2',
  '.ttf', '.otf', '.eot', '.sqlite', '.db', '.zip', '.gz', '.bin', '.crt', '.der',
]);

const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);

const issues = [];
for (const file of tracked) {
  const ext = path.extname(file).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) continue;
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  const findings = findSecretViolations(content);
  if (findings.length > 0) {
    issues.push({ file, kinds: [...new Set(findings.map(f => f.kind))] });
  }
}

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`SECRET_VIOLATION ${issue.file}: ${issue.kinds.join(', ')}`);
  }
  process.exitCode = 1;
} else {
  console.log(`PASS secret scan checked ${tracked.length} tracked files (0 findings in working HEAD).`);
}
