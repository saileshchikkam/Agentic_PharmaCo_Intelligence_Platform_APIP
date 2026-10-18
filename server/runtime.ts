import { isIP } from 'node:net';

export function readRuntimeConfig(env: NodeJS.ProcessEnv = process.env) {
  if (env.NODE_ENV !== 'development' && env.NODE_ENV !== 'production') {
    throw new Error('NODE_ENV must explicitly be development or production; use bun run dev or bun run start.');
  }
  const mode = env.NODE_ENV;
  const host = env.APIP_HOST ?? '127.0.0.1';
  const portText = env.APIP_PORT ?? '3000';
  if (!isIP(host) && host !== 'localhost') throw new Error('APIP_HOST must be a bind IP address or localhost.');
  if (mode === 'development' && !['127.0.0.1', '::1', 'localhost'].includes(host)) throw new Error('Development must bind to loopback.');
  if (!/^\d+$/.test(portText) || Number(portText) < 1 || Number(portText) > 65535
    || (mode === 'development' && Number(portText) !== 3000)) throw new Error('Invalid APIP_PORT; development requires port 3000.');
  if (env.APIP_ENABLE_LEGACY_AGENTS !== undefined && !['0', '1'].includes(env.APIP_ENABLE_LEGACY_AGENTS)) {
    throw new Error('APIP_ENABLE_LEGACY_AGENTS must be 0 or 1.');
  }
  return { mode, host, port: Number(portText), legacyAgentsEnabled: mode === 'development' && env.APIP_ENABLE_LEGACY_AGENTS === '1' } as const;
}
export type RuntimeConfig = ReturnType<typeof readRuntimeConfig>;
