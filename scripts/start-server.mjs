import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export function launchConfiguration(mode, env = process.env) {
  if (!['development', 'production'].includes(mode)) throw new Error('Select development or production explicitly.');
  if (env.NODE_ENV && env.NODE_ENV !== mode) throw new Error('NODE_ENV conflicts with the selected startup command.');
  return { args: mode === 'development' ? ['--import', 'tsx', 'server-entry.ts'] : ['dist/server.cjs'], env: { ...env, NODE_ENV: mode } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw new Error('Exactly one runtime mode is required.');
    const config = launchConfiguration(process.argv[2]);
    const child = spawn(process.execPath, config.args, { stdio: 'inherit', env: config.env });
    child.on('error', () => { console.error('APIP server could not start.'); process.exitCode = 1; });
    child.on('exit', code => { process.exitCode = code ?? 1; });
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { child.kill(signal); });
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
