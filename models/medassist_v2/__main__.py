"""Synthetic software-fixture verification only; no downloads, model calls or storage writes."""
import json

from .quality import profile
from .validation import HERE, read_json, validate_ddxplus_record


def main():
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['verify-fixtures'])
    parser.parse_args()
    catalogue = read_json(HERE / 'fixtures/catalogue.json')
    interview = read_json(HERE / 'fixtures/interview.json')
    validate_ddxplus_record(read_json(HERE / 'fixtures/ddxplus-shaped-record.json'), catalogue)
    report = profile([interview], catalogue)
    print(json.dumps({'status': 'synthetic_fixture_checks_passed', 'clinical_accuracy_evaluated': False,
                      'profile': report}, sort_keys=True))


if __name__ == '__main__':
    main()
