import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

export function qualifySelection(selection: any, result: any, comparisonHash: string, model: string, digest: string | undefined) {
  if (!selection?.selected || selection.comparison_sha256 !== comparisonHash) return null;
  const chosen = selection.selected;
  if (chosen.model !== model || chosen.digest !== digest || !/^[a-f0-9]{64}$/.test(digest ?? '') || !['baseline','compact'].includes(chosen.variant)) return null;
  const identity = result.identities?.find((i: any) => i.model === model && i.digest === digest);
  const group = result.groups?.find((g: any) => g.model === model && g.variant === chosen.variant);
  if (!identity || !group || group.attempts !== 20 || !Number.isInteger(group.semantic_exact) || group.semantic_exact < 19 || group.semantic_exact > 20 || group.schema_valid !== 20 || group.errors !== 0
    || group.unsupported_assertions !== 0 || group.wrong_polarity_or_unknown !== 0 || typeof group.p95_ms !== 'number' || !Number.isFinite(group.p95_ms) || group.p95_ms < 0 || group.p95_ms > 5000) return null;
  return { variant: chosen.variant as 'baseline' | 'compact', digest: chosen.digest as string };
}

/** A failed/missing/changed comparison cannot enable initial-evidence proposals. */
export function readQualifiedSelection(model: string, digest: string | undefined) {
  try {
    const directory = resolve('models/medassist_intelligence/reliability-v1');
    const selection = JSON.parse(readFileSync(resolve(directory, 'selection.json'), 'utf8'));
    const bytes = readFileSync(resolve(directory, 'comparison.json'));
    const result = JSON.parse(bytes.toString('utf8'));
    // Recompute the fixed subset gate rather than trusting a stored 'passed' flag.
    return qualifySelection(selection, result, createHash('sha256').update(bytes).digest('hex'), model, digest);
  } catch { return null; }
}
