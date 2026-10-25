"""Read only fictional experiment receipts; write separate analysis, never rewrite baseline."""
import collections
import hashlib
import json
from pathlib import Path

import jsonschema

ROOT = Path('models/medassist_intelligence/reliability-v1')


def main():
    analysis_path, selection_path = ROOT / 'analysis.json', ROOT / 'selection.json'
    if analysis_path.exists() or selection_path.exists():
        raise ValueError('preserve_existing_analysis')
    data = (ROOT / 'comparison.json').read_bytes()
    comparison = json.loads(data)
    protocol = json.loads((ROOT / 'protocol.json').read_text())
    responses = json.loads((ROOT / 'responses.json').read_text())['rows']
    by_key = {(r['model'], r['variant'], r['case_id']): r for r in responses}
    groups = []
    for group in comparison['groups']:
        native_valid = 0
        failures = []
        mapping_rejections = 0
        for case in comparison['cases']:
            if (case['model'], case['variant']) != (group['model'], group['variant']):
                continue
            raw = by_key[(case['model'], case['variant'], case['case_id'])]
            try:
                jsonschema.validate(raw['raw'], protocol['variants'][case['variant']]['schema'])
                valid = True
            except jsonschema.ValidationError:
                valid = False
            native_valid += valid
            mapping_rejected = valid and raw['mapped'] is None
            mapping_rejections += mapping_rejected
            if not case['semantic_exact']:
                categories = []
                if case['error']:
                    categories.append('request_or_generation_failure')
                if not valid:
                    categories.append('native_schema_failure')
                if mapping_rejected:
                    categories.append('deterministic_mapping_rejected')
                if case['unsupported_assertions']:
                    categories.append('unsupported_model_assertion')
                if case['wrong_polarity_or_unknown']:
                    categories.append('wrong_model_polarity_or_unknown')
                if not categories:
                    categories.append('wrong_status_issues_or_missing_expected_items')
                failures.append({'case_id': case['case_id'], 'categories': categories})
        groups.append({**group, 'native_schema_valid': native_valid, 'mapping_rejections': mapping_rejections,
                       'remaining_failures': failures})
    eligible = sorted((g for g in groups if g['candidate_gate']),
                      key=lambda g: (-g['semantic_exact'], g['p95_ms'], g['median_ms']))
    chosen = eligible[0] if eligible else None
    identities = {i['model']: i['digest'] for i in comparison['identities']}
    selected = {'model': chosen['model'], 'digest': identities[chosen['model']],
                'variant': chosen['variant']} if chosen else None
    selection = {'schema_version': 'medassist.local-provider-selection.v1',
                 'comparison_sha256': hashlib.sha256(data).hexdigest(), 'selected': selected,
                 'reason': 'fixed_20_case_candidate_gate_passed' if selected else 'no_candidate_met_fixed_correctness_safety_latency_gate',
                 'clinical_or_full_L2_promotion': False}
    analysis = {'groups': groups, 'selection': selection, 'limitations': [
        'Same 20 reused development cases and one repetition; not independent held-out or clinical evaluation.',
        'Two prospective variants, no retries; compact includes deterministic mapping, not a standalone-model accuracy claim.',
        'Unsupported and polarity counts include rejected native proposals; zero accepted facts is not high extraction accuracy.',
        'Native compact-schema validity and mapped evidence-contract validity are separately reported.',
        'Warm timing excludes requests reporting >=1000ms model loading; failures remain in accuracy denominators.',
        'The historical run used a 60s timeout; this identical-case comparison uses 30s and explicitly disables thinking.',
        'Installed quantization differs; ordinary laptop load and a concurrent 37s build were not controlled. Timing is observational.',
        '20-case subset does not exercise numeric E_56, Telugu, broader clinical vocabulary or independent wording review.',
        'All subset targets are representable via evidence or explicit clarification; duration still has no frozen evidence field.',
        'Tag/digest identifies the installed artifact, not verified upstream licence/provenance or clinical fitness.',
    ]}
    analysis_path.write_text(json.dumps(analysis, indent=2) + '\n')
    selection_path.write_text(json.dumps(selection, indent=2) + '\n')
    print(json.dumps({'groups': [{k: g[k] for k in ['model', 'variant', 'semantic_exact', 'native_schema_valid', 'schema_valid',
          'unsupported_assertions', 'wrong_polarity_or_unknown', 'median_ms', 'p95_ms', 'errors', 'candidate_gate']} for g in groups],
          'selected': selected}))


if __name__ == '__main__':
    main()
