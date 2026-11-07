import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildSync } from 'esbuild';
import postgres from 'postgres';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

async function verifyDisconnectRecovery() {
  const db = new PGlite();
  const server = new PGLiteSocketServer({ db, host: '127.0.0.1', port: 0 });
  await server.start();
  const [host, port] = server.getServerConn().split(':');
  const sockets = new Set<net.Socket>();
  let disconnect = () => {};
  const proxy = net.createServer(client => {
    const remote = net.connect(Number(port), host);
    sockets.add(client);
    sockets.add(remote);
    disconnect = () => { client.destroy(); remote.destroy(); };
    client.on('error', () => remote.destroy());
    remote.on('error', () => client.destroy());
    client.pipe(remote);
    remote.pipe(client);
  });
  await new Promise<void>(resolve => proxy.listen(0, '127.0.0.1', resolve));
  const proxyPort = (proxy.address() as net.AddressInfo).port;
  const sql = postgres('postgresql://postgres@127.0.0.1:' + proxyPort + '/postgres', {
    max: 1, prepare: false, connect_timeout: 2,
  });
  try {
    await sql`select 1`;
    await assert.rejects(sql.begin(async tx => {
      await tx`select set_config('apip.test_subject', 'synthetic', true)`;
      const pending = tx`select pg_sleep(3)`.execute();
      setTimeout(disconnect, 200);
      await pending;
    }));
    await new Promise(resolve => setTimeout(resolve, 500));
    const [row] = await sql`select
      nullif(current_setting('apip.test_subject', true), '') is null as clean`;
    assert.equal(row.clean, true);
  } finally {
    await sql.end({ timeout: 1 });
    for (const socket of sockets) socket.destroy();
    await new Promise<void>(resolve => proxy.close(() => resolve()));
    await server.stop();
    await db.close();
  }
}

if (process.env.APIP_DISCONNECT_TEST_CHILD === '1') {
  await verifyDisconnectRecovery();
} else {
  test('the production CommonJS bundle can construct the ESM PostgreSQL driver', () => {
    const bundle = buildSync({
      stdin: {
        contents: `import express from 'express';
          import { configuredCloudAccount } from './server/cloud-account';
          const account = configuredCloudAccount(express(), {
            APIP_ACCOUNT_MODE: 'cloud',
            APIP_SUPABASE_URL: 'https://auth.example.test',
            APIP_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture',
            APIP_ADR_DATABASE_URL: 'postgresql://fixture@127.0.0.1:1/fixture',
          });
          if (!account) throw Error('Cloud runtime was not constructed');
          account.close().catch(() => { process.exitCode = 1; });`,
        resolveDir: process.cwd(),
      },
      bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
    });
    execFileSync(process.execPath, ['--input-type=commonjs'], {
      cwd: process.cwd(), input: bundle.outputFiles[0].text, timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true,
    });
  });
  test('a connection lost during a transaction rejects safely and reconnects without retained identity', {
    timeout: 30000,
  }, () => {
    // A child makes an uncaught driver exception an observable test failure.
    execFileSync(process.execPath, ['--import', 'tsx', fileURLToPath(import.meta.url)], {
      env: { ...process.env, APIP_DISCONNECT_TEST_CHILD: '1' },
      timeout: 25000,
      stdio: 'pipe',
      windowsHide: true,
    });
  });
}
