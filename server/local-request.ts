import type { Request } from 'express';

/** Socket identity is authoritative; forwarded headers cannot grant local access. */
export function trustedLocalRequest(req: Request, port: number, requireOrigin: boolean) {
  const origins = [`http://localhost:${port}`, `http://127.0.0.1:${port}`, `http://[::1]:${port}`];
  const loopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '');
  const hostAllowed = origins.some(origin => new URL(origin).host === req.get('host'));
  const origin = req.get('origin');
  return loopback && hostAllowed && (origin ? origins.includes(origin) : !requireOrigin);
}
