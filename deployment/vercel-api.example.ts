import type { Request, Response } from 'express';
import { createApiApp } from '../server';
import { readRuntimeConfig } from '../server/runtime';

if (process.env.APIP_ACCOUNT_MODE !== 'cloud' || process.env.NODE_ENV !== 'production') {
  throw Error('Cloud production account mode is required.');
}
const { app } = createApiApp(readRuntimeConfig());
export default function handler(req: Request, res: Response) {
  if (req.path?.endsWith('/pdf') || req.url?.split('?')[0].endsWith('/pdf')) {
    res.status(503).json({ error: 'PDF_CONTAINER_ROUTE_REQUIRED' });
    return;
  }
  app(req, res);
}
