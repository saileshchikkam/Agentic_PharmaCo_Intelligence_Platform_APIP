"""Read-only fixture/readiness checks; no downloads, model calls or storage writes."""
import json
import os

from .quality import profile
from .validation import HERE, read_json, validate_ddxplus_record


def main():
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['verify-fixtures', 'readiness'])
    parser.add_argument('--root', default=os.environ.get('APIP_MEDASSIST_V2_ROOT'))
    args = parser.parse_args()
    if args.command == 'readiness':
        from .loader import DatasetLoader, manifest
        from .validation import InvalidRecord
        try:
            result = DatasetLoader(args.root).readiness() if args.root else {
                'status': 'missing_root', 'missing_files': sorted(f['name'] for f in manifest()['files']),
                'real_data_statistics': None}
        except InvalidRecord as exc:
            print(json.dumps({'status': 'blocked', 'error_code': str(exc), 'real_data_statistics': None}))
            raise SystemExit(2) from None
        print(json.dumps(result, sort_keys=True))
        raise SystemExit(0 if result['status'] == 'local_files_verified_and_streamed' else 2)
    catalogue = read_json(HERE / 'fixtures/catalogue.json')
    interview = read_json(HERE / 'fixtures/interview.json')
    validate_ddxplus_record(read_json(HERE / 'fixtures/ddxplus-shaped-record.json'), catalogue)
    report = profile([interview], catalogue)
    print(json.dumps({'status': 'synthetic_fixture_checks_passed', 'clinical_accuracy_evaluated': False,
                      'profile': report}, sort_keys=True))


if __name__ == '__main__':
    main()
