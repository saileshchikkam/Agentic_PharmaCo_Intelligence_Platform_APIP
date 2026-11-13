import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { defaultFilters, type CaseFilters } from '../../src/features/adr/cases/contracts';

export type CasePosition = { at: string; id: string };
const secret = randomBytes(32);
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const invalid = () => { throw Error('INVALID_FILTER'); };
export function parseCaseFilters(query: Record<string, unknown>): CaseFilters {
  if (Object.keys(query).some(key => !Object.hasOwn(defaultFilters, key) && key !== 'cursor')) invalid();
  const f = { ...defaultFilters };
  for (const key of Object.keys(defaultFilters) as (keyof CaseFilters)[]) {
    if (query[key] === undefined) continue;
    if (typeof query[key] !== 'string') invalid();
    const value = query[key] as string;
    if (key === 'limit') {
      if (!/^[1-9][0-9]?$/.test(value) || Number(value) > 50) invalid();
      f.limit = Number(value);
    } else (f as unknown as Record<string, unknown>)[key] = value.trim();
  }
  if (f.q.length > 100 || f.medicine.length > 100 || !['all','draft','intake_complete','finalized'].includes(f.status)
    || !['all','Initial','Follow-up'].includes(f.caseType) || !['created','updated','reported'].includes(f.dateField)
    || !['created','updated'].includes(f.sort) || !['asc','desc'].includes(f.direction) || f.archived !== 'exclude') invalid();
  for (const date of [f.from, f.to]) if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date)
    || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date)) invalid();
  if (f.from && f.to && f.from > f.to) invalid();
  return f;
}
const mac = (owner: string, f: CaseFilters, data: string) => createHmac('sha256', secret)
  .update(JSON.stringify([owner, f, data])).digest();
export function encodeCursor(owner: string, f: CaseFilters, p: CasePosition) {
  const data = Buffer.from(JSON.stringify(p)).toString('base64url');
  return data + '.' + mac(owner, f, data).toString('base64url');
}
export function decodeCursor(owner: string, f: CaseFilters, value: unknown): CasePosition | undefined {
  if (value === undefined) return;
  try {
    if (typeof value !== 'string' || value.length > 500 || !/^[\w-]+\.[\w-]+$/.test(value)) throw Error();
    const [data, signature] = value.split('.');
    const actual = Buffer.from(signature, 'base64url'), expected = mac(owner, f, data);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw Error();
    const p = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (Object.keys(p).sort().join(',') !== 'at,id' || !uuid.test(p.id)
      || typeof p.at !== 'string' || !Number.isFinite(Date.parse(p.at))) throw Error();
    return p;
  } catch { throw Error('INVALID_CURSOR'); }
}
