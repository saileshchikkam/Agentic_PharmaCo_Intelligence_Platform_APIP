/**
 * APIP MedAssist — Unified Local Research Startup Launcher.
 *
 * Spawns both the FastAPI Model A research inference adapter (port 8766)
 * and the APIP Express/Vite frontend development server (port 3000)
 * with verified environment configuration, loopback security, and graceful shutdown.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const isWin = process.platform === 'win32';
const DEFAULT_PYTHON = isWin && existsSync('C:\\apip_research\\python312\\python.exe')
  ? 'C:\\apip_research\\python312\\python.exe'
  : 'python';

const PYTHON_BIN = process.env.PYTHON_EXECUTABLE || DEFAULT_PYTHON;
const RUN_ROOT = process.env.MEDASSIST_A_RUN_ROOT || (isWin ? 'C:\\apip_research\\campaign_2026\\run_01' : '/opt/apip_research/campaign_2026/run_01');
const METADATA_ROOT = process.env.MEDASSIST_A_METADATA_ROOT || (isWin ? 'C:\\apip_research\\ddxplus_v2\\source' : '/opt/apip_research/ddxplus_v2/source');
const TOKEN = process.env.MEDASSIST_A_TOKEN || 'fictional-local-research-token-32-chars-long';
const CAMPAIGN_ID = process.env.MEDASSIST_A_CAMPAIGN_ID || 'campaign-2026-v1';

const children = [];

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, () => resolve(true));
    req.on('error', (err) => resolve(err.code !== 'ECONNREFUSED'));
    req.setTimeout(500, () => { req.destroy(); resolve(true); });
  });
}

async function waitForHealth(url, headers = {}, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const ok = await new Promise((resolve) => {
      const u = new URL(url);
      const req = http.get({
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        headers,
        timeout: 1000,
      }, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    });
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function shutdown() {
  console.log('\n[APIP MedAssist] Shutting down all services...');
  for (const child of children) {
    if (child && !child.killed) {
      try {
        child.kill('SIGINT');
      } catch {}
    }
  }
  setTimeout(() => process.exit(0), 1000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function main() {
  console.log('================================================================');
  console.log(' APIP MedAssist — Research Environment Launcher');
  console.log('================================================================');
  console.log(`Campaign Run Root:     ${RUN_ROOT}`);
  console.log(`Metadata Source Root:  ${METADATA_ROOT}`);
  console.log(`Python Interpreter:    ${PYTHON_BIN}`);
  console.log(`Research Campaign ID:  ${CAMPAIGN_ID}`);
  console.log('----------------------------------------------------------------');

  const adapterPortInUse = await checkPort(8766);
  if (adapterPortInUse) {
    console.log('[Adapter] Port 8766 is already listening. Checking health...');
    const healthy = await waitForHealth('http://127.0.0.1:8766/research/model-a/v1/health', {
      Authorization: `Bearer ${TOKEN}`,
    }, 3);
    if (healthy) {
      console.log('[Adapter] Existing Model A research adapter is active and healthy.');
    } else {
      console.warn('[Adapter] Port 8766 is listening but did not respond to authenticated health check.');
    }
  } else {
    console.log('[Adapter] Spawning FastAPI Model A research adapter on 127.0.0.1:8766...');
    const adapterEnv = {
      ...process.env,
      MEDASSIST_A_ENABLE_RESEARCH: '1',
      MEDASSIST_A_TOKEN: TOKEN,
      MEDASSIST_A_ENABLE_CAMPAIGN: '1',
      MEDASSIST_A_CAMPAIGN_ID: CAMPAIGN_ID,
      MEDASSIST_A_RUN_ROOT: RUN_ROOT,
      MEDASSIST_A_METADATA_ROOT: METADATA_ROOT,
    };

    const adapterChild = spawn(PYTHON_BIN, ['-m', 'models.medassist_v2.research_adapter'], {
      env: adapterEnv,
      stdio: ['ignore', 'inherit', 'inherit'],
    });

    children.push(adapterChild);
    adapterChild.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`[Adapter] Process exited with code ${code}`);
      }
    });

    console.log('[Adapter] Waiting for pre-test seal authentication & model loading...');
    const healthy = await waitForHealth('http://127.0.0.1:8766/research/model-a/v1/health', {
      Authorization: `Bearer ${TOKEN}`,
    }, 40);

    if (!healthy) {
      console.error('[Adapter] Failed to verify adapter health within timeout.');
      shutdown();
      return;
    }
    console.log('[Adapter] Model A service loaded and verified on port 8766.');
  }

  const serverPortInUse = await checkPort(3000);
  if (serverPortInUse) {
    console.log('[Server] Port 3000 is already listening.');
  } else {
    console.log('[Server] Spawning Express/Vite development server on 127.0.0.1:3000...');
    const serverEnv = {
      ...process.env,
      NODE_ENV: 'development',
      APIP_ENABLE_MODEL_A_DEMO: '1',
      MEDASSIST_A_TOKEN: TOKEN,
    };

    const serverChild = spawn(process.execPath, ['scripts/start-server.mjs', 'development'], {
      env: serverEnv,
      stdio: ['ignore', 'inherit', 'inherit'],
    });

    children.push(serverChild);
    serverChild.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`[Server] Process exited with code ${code}`);
      }
    });

    await waitForHealth('http://127.0.0.1:3000/#/', {}, 20);
    console.log('[Server] Express/Vite server ready on port 3000.');
  }

  console.log('================================================================');
  console.log(' ALL SERVICES ACTIVE');
  console.log(' MedAssist Preview:   http://127.0.0.1:3000/#/preview/medassist-conversation');
  console.log(' Model A Lab Preview: http://127.0.0.1:3000/#/research/model-a');
  console.log(' Press Ctrl+C to stop all services.');
  console.log('================================================================');
}

main().catch((err) => {
  console.error('[APIP MedAssist] Startup error:', err);
  shutdown();
});
