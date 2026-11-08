import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { scriptedVocabulary } from '../src/features/medassist-conversation/scripted';
import { understand } from '../src/features/medassist-conversation/understanding';

type Row = { id: string; family: string; text: string; expected: string[]; clarify: boolean };
const root = new URL('../docs/evaluation/', import.meta.url);
const read = (name: string) => readFileSync(new URL(name, root));
const hash = (value: Buffer) => createHash('sha256').update(value).digest('hex');
const frozen = JSON.parse(read('medassist-systemic-corpus-freeze-v1.json').toString('utf8'));

function evaluate(name: string, expectedHash: string) {
  const source = read(name);
  if (hash(source) !== expectedHash) throw Error(`${name} does not match its frozen SHA-256`);
  const corpus = JSON.parse(source.toString('utf8')) as { cases: Row[] };
  const rows = corpus.cases.map(row => {
    const result = understand(row.text, scriptedVocabulary);
    const actual = result.proposal.observations.map(item => `${item.evidence_id}${item.state === 'unknown' ? '?' : item.state === 'contradiction' ? '!' : item.value ? '+' : '-'}`).sort();
    const expected = [...row.expected].sort();
    const clarification = result.proposal.observations.length === 0;
    return { id: row.id, family: row.family, expected, actual, expected_clarification: row.clarify, clarification,
      pass: JSON.stringify(actual) === JSON.stringify(expected) && clarification === row.clarify,
      unmapped: result.proposal.unmapped, validation_failed: result.validation_failed };
  });
  return { name, hash: expectedHash, total: rows.length, passed: rows.filter(row => row.pass).length, failed: rows.filter(row => !row.pass).length, rows };
}

console.log(JSON.stringify({ schema_version: 'medassist.systemic-language-results.v1', fictional_only: true,
  development: evaluate('medassist-systemic-development-v1.json', frozen.sha256.development),
  withheld: evaluate('medassist-systemic-withheld-v1.json', frozen.sha256.withheld) }, null, 2));
