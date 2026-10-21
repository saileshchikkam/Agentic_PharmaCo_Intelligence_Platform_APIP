import { spawnSync } from 'node:child_process';
import { lstatSync, existsSync } from 'node:fs';
import path from 'node:path';

const command = process.argv[2];
const args = process.argv.slice(3);

function git(args, optional = false) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    timeout: args[0] === 'commit' ? 60000 : 30000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'Never' },
  });
  if (result.error || result.status !== 0) {
    if (optional) return null;
    throw new Error(result.error?.message || result.stderr.trim() || `git ${args[0]} failed`);
  }
  if (args[0] === 'commit' && result.stderr) process.stderr.write(result.stderr);
  return result.stdout.trim();
}

function changedPaths() {
  const output = git(['diff', '--cached', '--name-only', '-z']);
  return output ? output.split('\0').filter(Boolean) : [];
}

function requireIdle() {
  if (!git(['symbolic-ref', '--quiet', '--short', 'HEAD'], true)) {
    throw new Error('Detached HEAD: select the intended branch before completing work.');
  }
  for (const name of ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply']) {
    if (existsSync(git(['rev-parse', '--git-path', name]))) {
      throw new Error('A merge/rebase/cherry-pick/revert is in progress; automatic completion stopped.');
    }
  }
}

function requireEnabledOrigin() {
  if (git(['config', '--bool', '--get', 'apip.autoSync'], true) !== 'true') {
    throw new Error('APIP auto-sync is not enabled in this checkout. Run the install command.');
  }
  const expected = git(['config', '--get', 'apip.autoSyncOrigin']);
  const fetchUrl = git(['remote', 'get-url', 'origin']);
  const pushUrls = git(['remote', 'get-url', '--push', '--all', 'origin']).split('\n');
  if (!expected || fetchUrl !== expected || pushUrls.length !== 1 || pushUrls[0] !== expected) {
    throw new Error('Origin changed or has multiple push destinations. Review it before re-enabling auto-sync.');
  }
}

function install() {
  const configured = git(['config', '--get', 'core.hooksPath'], true);
  if (configured && configured !== '.githooks') {
    throw new Error('An existing hooksPath is configured. Preserve/reconcile those hooks before installation.');
  }
  const defaultHooks = git(['rev-parse', '--git-path', 'hooks']);
  // Do not hide a pre-existing active hook when changing hooksPath.
  for (const event of ['applypatch-msg', 'pre-applypatch', 'post-applypatch', 'pre-commit',
    'pre-merge-commit', 'prepare-commit-msg', 'commit-msg', 'post-commit', 'pre-rebase',
    'post-checkout', 'post-merge', 'pre-push', 'post-rewrite', 'sendemail-validate',
    'pre-auto-gc', 'reference-transaction', 'post-index-change', 'push-to-checkout',
    'pre-receive', 'update', 'proc-receive', 'post-receive', 'post-update']) {
    if (!configured && existsSync(path.join(defaultHooks, event))) {
      throw new Error(`An existing ${event} hook needs reconciliation before installation.`);
    }
  }
  const origin = git(['remote', 'get-url', 'origin']);
  const pushUrls = git(['remote', 'get-url', '--push', '--all', 'origin']).split('\n');
  if (pushUrls.length !== 1 || pushUrls[0] !== origin) {
    throw new Error('Use a single reviewed origin destination before enabling automatic sync.');
  }
  if (!existsSync('.githooks/post-commit')) throw new Error('The project post-commit hook is missing.');
  git(['config', '--local', 'apip.autoSyncOrigin', origin]);
  git(['config', '--local', 'apip.autoSync', 'true']);
  git(['config', '--local', 'core.hooksPath', '.githooks']);
  console.log('APIP auto-sync enabled for this checkout and its reviewed origin.');
}

function push() {
  requireIdle();
  requireEnabledOrigin();
  const branch = git(['symbolic-ref', '--quiet', '--short', 'HEAD']);
  const result = git(['-c', 'credential.interactive=never', 'push', '--set-upstream',
    'origin', `HEAD:refs/heads/${branch}`]);
  if (result) console.log(result);
  console.log(`APIP: synced ${git(['rev-parse', '--short', 'HEAD'])} to origin/${branch}.`);
}

function complete() {
  requireIdle();
  requireEnabledOrigin();
  if (git(['config', '--get', 'core.hooksPath'], true) !== '.githooks') {
    throw new Error('The post-commit hook is not installed. Run the install command.');
  }
  if (changedPaths().length) throw new Error('The index already contains staged changes; review ownership first.');
  if (args[0] !== '--message' || !args[1]?.trim() || args[2] !== '--' || args.length < 4) {
    throw new Error('Usage: complete --message "summary" -- file1 file2 ...');
  }
  const paths = [...new Set(args.slice(3))];
  for (const file of paths) {
    const relative = path.relative(process.cwd(), path.resolve(file));
    if (!relative || path.isAbsolute(file) || relative === '..' || relative.startsWith(`..${path.sep}`)
      || path.isAbsolute(relative) || relative.split(path.sep).includes('.git') || file.startsWith(':')) {
      throw new Error('Select explicit repository files, without parent traversal or Git pathspec magic.');
    }
    if (existsSync(relative) && (!lstatSync(relative).isFile() || lstatSync(relative).isSymbolicLink())) {
      throw new Error('Select individual regular files, not directories or symbolic links.');
    }
    const base = path.basename(relative).toLowerCase();
    if ((base.startsWith('.env') && base !== '.env.example') || /\.(pem|key|p12|pfx)$/.test(base)
      || ['id_rsa', 'id_ed25519', 'credentials.json'].includes(base)) {
      throw new Error('A selected filename may contain credentials; review it outside automatic completion.');
    }
    if (/[?*\[\]]/.test(file)) throw new Error('Select literal file paths without glob patterns.');
  }
  // Literal paths prevent Git pathspec expansion; pre-existing staged work is never swept in.
  git(['--literal-pathspecs', 'add', '-A', '--', ...paths]);
  const staged = changedPaths();
  if (!staged.length) { console.log('APIP: no selected changes to commit.'); return; }
  if (!staged.some(file => /^docs\/history\/\d{4}-\d{2}-\d{2}\.md$/.test(file))) {
    throw new Error('Include an updated dated history entry with the completed work. Selected files remain staged for review.');
  }
  git(['diff', '--cached', '--check']);
  for (const file of staged.filter(file => file.startsWith('.githooks/') && !file.endsWith('.md'))) {
    if (existsSync(file)) git(['update-index', '--chmod=+x', '--', file]);
  }
  const output = git(['commit', '-m', args[1]]);
  console.log(output);
  // post-commit cannot fail the local commit, so independently check its sync outcome.
  const branch = git(['symbolic-ref', '--quiet', '--short', 'HEAD']);
  const head = git(['rev-parse', 'HEAD']);
  const remoteHead = git(['rev-parse', '--verify', `refs/remotes/origin/${branch}`], true);
  if (remoteHead !== head) throw new Error('Commit saved locally; GitHub sync is pending. Retry the push and report its outcome.');
  console.log(`APIP: completion committed and synced (${head.slice(0, 7)}).`);
}

try {
  process.chdir(git(['rev-parse', '--show-toplevel']));
  if (command === 'install') install();
  else if (command === 'push') push();
  else if (command === 'complete') complete();
  else throw new Error('Choose install, push, or complete. See scripts/README.md.');
} catch (error) {
  console.error(`APIP: ${error.message}`);
  process.exitCode = 1;
}
