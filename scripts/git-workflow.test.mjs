import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, chmodSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const journal = 'docs/history/2026-10-16.md';
const temporaryRepositories = [];

after(() => {
  for (const base of temporaryRepositories) {
    const absolute = path.resolve(base);
    if (path.dirname(absolute) !== path.resolve(os.tmpdir())
      || !path.basename(absolute).startsWith('apip-git-workflow-')) {
      throw new Error('Refusing to remove a test directory outside the intended temporary workspace.');
    }
    rmSync(absolute, { recursive: true, force: true });
  }
});

function run(cwd, bin, args, expected = 0) {
  const result = spawnSync(bin, args, {
    cwd, encoding: 'utf8', timeout: 90000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'Never' },
  });
  if (expected !== null) assert.equal(result.status, expected, `${result.stdout}\n${result.stderr}\n${result.error || ''}`);
  return result;
}

function git(cwd, ...args) { return run(cwd, 'git', args).stdout.trim(); }
function cli(cwd, ...args) { return run(cwd, process.execPath, ['scripts/git-workflow.mjs', ...args], null); }

function fixture() {
  // Isolated local repositories: no test pushes to GitHub or uses patient data.
  const base = mkdtempSync(path.join(os.tmpdir(), 'apip-git-workflow-'));
  temporaryRepositories.push(base);
  const remote = path.join(base, 'remote.git');
  const repo = path.join(base, 'repo');
  mkdirSync(repo);
  git(base, 'init', '--bare', '--template=', remote);
  git(repo, 'init', '--template=', '--initial-branch=main');
  git(repo, 'config', 'user.name', 'APIP Workflow Test');
  git(repo, 'config', 'user.email', 'workflow-test@example.invalid');
  git(repo, 'config', 'core.autocrlf', 'false');
  mkdirSync(path.join(repo, 'scripts'));
  mkdirSync(path.join(repo, '.githooks'));
  mkdirSync(path.join(repo, 'docs/history'), { recursive: true });
  copyFileSync(path.join(source, 'scripts/git-workflow.mjs'), path.join(repo, 'scripts/git-workflow.mjs'));
  copyFileSync(path.join(source, '.githooks/post-commit'), path.join(repo, '.githooks/post-commit'));
  chmodSync(path.join(repo, '.githooks/post-commit'), 0o755);
  writeFileSync(path.join(repo, journal), '# Initial history\n');
  writeFileSync(path.join(repo, 'app.txt'), 'initial\n');
  git(repo, 'add', '.');
  git(repo, 'update-index', '--chmod=+x', '.githooks/post-commit');
  git(repo, 'commit', '-m', 'initial');
  git(repo, 'remote', 'add', 'origin', remote);
  git(repo, 'push', '-u', 'origin', 'main');
  return { base, repo, remote };
}

function install(repo) {
  const result = cli(repo, 'install');
  assert.equal(result.status, 0, result.stderr);
}

function change(repo) {
  writeFileSync(path.join(repo, 'app.txt'), 'completed change\n');
  writeFileSync(path.join(repo, journal), '# History\n\nCompleted and checked fictional change.\n');
}

function complete(repo, files = ['app.txt', journal]) {
  return cli(repo, 'complete', '--message', 'test: completed change', '--', ...files);
}

test('installation is local, repeatable, and records the reviewed origin', () => {
  const { repo, remote } = fixture();
  install(repo); install(repo);
  assert.equal(git(repo, 'config', '--local', 'core.hooksPath'), '.githooks');
  assert.equal(git(repo, 'config', '--bool', 'apip.autoSync'), 'true');
  assert.equal(git(repo, 'config', 'apip.autoSyncOrigin'), remote);
});

test('real commit event pushes only selected work and preserves unrelated edits', () => {
  const { repo, remote } = fixture();
  install(repo); change(repo);
  writeFileSync(path.join(repo, 'unrelated.txt'), 'another task\n');
  const result = complete(repo);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(git(repo, 'rev-parse', 'HEAD'), git(remote, 'rev-parse', 'refs/heads/main'));
  assert.equal(git(repo, 'show', 'HEAD:app.txt'), 'completed change');
  assert.equal(git(repo, 'status', '--porcelain'), '?? unrelated.txt');
});

test('an existing staged change is never swept into automatic completion', () => {
  const { repo } = fixture();
  install(repo); change(repo);
  writeFileSync(path.join(repo, 'other.txt'), 'other work\n');
  git(repo, 'add', 'other.txt');
  const head = git(repo, 'rev-parse', 'HEAD');
  const result = complete(repo);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /already contains staged/);
  assert.equal(git(repo, 'rev-parse', 'HEAD'), head);
  assert.equal(git(repo, 'diff', '--cached', '--name-only'), 'other.txt');
});

test('a dated documentation update is required before a new commit', () => {
  const { repo } = fixture();
  install(repo); change(repo);
  const head = git(repo, 'rev-parse', 'HEAD');
  const result = complete(repo, ['app.txt']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /dated history/);
  assert.equal(git(repo, 'rev-parse', 'HEAD'), head);
});

test('credential filenames, directories, traversal, and globs are rejected before staging', () => {
  const { repo } = fixture();
  install(repo);
  writeFileSync(path.join(repo, '.env'), 'fictional-key\n');
  for (const file of ['.env', 'scripts', '../outside.txt', '*.txt', ':!app.txt']) {
    assert.notEqual(complete(repo, [file]).status, 0, file);
    assert.equal(git(repo, 'diff', '--cached', '--name-only'), '');
  }
});

test('a changed destination disables automatic sync before any files are staged', () => {
  const { repo } = fixture();
  install(repo); change(repo);
  git(repo, 'remote', 'set-url', 'origin', 'https://example.invalid/other.git');
  const result = complete(repo);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Origin changed/);
  assert.equal(git(repo, 'diff', '--cached', '--name-only'), '');
});

test('remote rejection preserves the local commit without overwriting remote history', () => {
  const { base, repo, remote } = fixture();
  install(repo);
  const other = path.join(base, 'other');
  git(base, 'clone', '--template=', '--branch', 'main', remote, other);
  git(other, 'config', 'user.name', 'APIP Workflow Test');
  git(other, 'config', 'user.email', 'workflow-test@example.invalid');
  writeFileSync(path.join(other, 'remote.txt'), 'remote update\n');
  git(other, 'add', 'remote.txt');
  git(other, 'commit', '-m', 'remote change');
  git(other, 'push', 'origin', 'main');
  const remoteHead = git(remote, 'rev-parse', 'refs/heads/main');
  const previous = git(repo, 'rev-parse', 'HEAD');
  change(repo);
  const result = complete(repo);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /sync is pending/);
  assert.notEqual(git(repo, 'rev-parse', 'HEAD'), previous);
  assert.equal(git(remote, 'rev-parse', 'refs/heads/main'), remoteHead);
  assert.equal(git(repo, 'status', '--porcelain'), '');
});

test('unchanged selected files produce no empty commit', () => {
  const { repo } = fixture();
  install(repo);
  const head = git(repo, 'rev-parse', 'HEAD');
  assert.equal(complete(repo).status, 0);
  assert.equal(git(repo, 'rev-parse', 'HEAD'), head);
});

test('a feature branch syncs to its matching branch without changing remote main', () => {
  const { repo, remote } = fixture();
  install(repo);
  const main = git(remote, 'rev-parse', 'refs/heads/main');
  git(repo, 'switch', '-c', 'feature/example');
  change(repo);
  const result = complete(repo);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(git(repo, 'rev-parse', 'HEAD'), git(remote, 'rev-parse', 'refs/heads/feature/example'));
  assert.equal(git(remote, 'rev-parse', 'refs/heads/main'), main);
});

test('installation preserves existing custom hooks instead of hiding them', () => {
  const { repo } = fixture();
  mkdirSync(path.join(repo, '.git/hooks'), { recursive: true });
  writeFileSync(path.join(repo, '.git/hooks/pre-commit'), '#!/bin/sh\nexit 0\n');
  const result = cli(repo, 'install');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /existing pre-commit/);
});
