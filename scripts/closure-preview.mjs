// Private verification adapter: unified frontend and hosted API on one single user-facing port. No credentials.
import express from 'express';
import http from 'node:http';
import { resolve } from 'node:path';

const port = Number(process.env.APIP_CLOSURE_PORT || 3602);
const backend = new URL(process.env.APIP_CLOSURE_BACKEND || 'http://127.0.0.1:3601');
if (!Number.isInteger(port) || port < 1024 || port > 65535 || backend.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(backend.hostname) || backend.username || backend.password || backend.pathname !== '/') {
  throw Error('Loopback verification configuration required');
}

const app = express();
app.disable('x-powered-by');

// Allow loopback host header (127.0.0.1 or localhost)
app.use((req, res, next) => {
  const host = req.get('host') || '';
  if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) {
    res.sendStatus(403);
    return;
  }
  next();
});

// Proxy /api/* to internal backend
app.use('/api', (req, res) => {
  const upstream = http.request(
    new URL(req.originalUrl, backend),
    {
      method: req.method,
      headers: { ...req.headers, host: backend.host },
    },
    (reply) => {
      res.writeHead(reply.statusCode || 502, reply.headers);
      reply.pipe(res);
    }
  );
  upstream.setTimeout(30000, () => upstream.destroy());
  upstream.on('error', () => {
    if (!res.headersSent) res.status(503).json({ error: 'UPSTREAM_UNAVAILABLE' });
    else res.end();
  });
  req.on('aborted', () => upstream.destroy());
  req.pipe(upstream);
});

// Serve static frontend assets
const distPath = resolve('dist');
app.use(express.static(distPath, { index: 'index.html' }));

// SPA fallback for HTML5 / deep-link routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'NOT_FOUND' });
    return;
  }
  res.sendFile(resolve(distPath, 'index.html'));
});

app.listen(port, '127.0.0.1', () => {
  console.log(`APIP Unified Portal listening on http://127.0.0.1:${port} (proxied API: ${backend.origin})`);
});
