"""Pinned, read-only local DDXPlus streams. No downloading, extraction or repartitioning."""
from __future__ import annotations

from contextlib import contextmanager
import csv
import hashlib
import json
import os
import stat
import struct
import zipfile
import zlib

from .storage import external_path
from .validation import HERE, InvalidRecord, read_json, require, validate_catalogue, validate_ddxplus_record

PARTITIONS = {'train': 'release_train_patients.zip', 'validation': 'release_validate_patients.zip',
              'test': 'release_test_patients.zip'}
FIELDS = {'AGE', 'SEX', 'PATHOLOGY', 'EVIDENCES', 'INITIAL_EVIDENCE', 'DIFFERENTIAL_DIAGNOSIS'}
MAX_RECORD_BYTES = 1024 * 1024
MAX_EXPANDED_BYTES = 2 * 1024 ** 3


def manifest():
    path = HERE / 'dataset-manifest.json'
    expected = read_json(HERE / 'verification.json')['files_sha256']['models/medassist_v2/dataset-manifest.json']
    require(hashlib.sha256(path.read_bytes()).hexdigest() == expected, 'source_manifest_changed')
    return read_json(path)


def signature(stream):
    s = os.fstat(stream.fileno())
    return s.st_size, s.st_mtime_ns, s.st_ctime_ns


@contextmanager
def verified_file(root, specification, served_roots=()):
    root = external_path(root, served_roots)
    name = specification['name']
    require(isinstance(name, str) and '/' not in name and '\\' not in name and ':' not in name and name not in ('.', '..'), 'unsafe_source_name')
    path = root / name
    require(not path.is_symlink() and path.resolve().parent == root and path.is_file(), 'missing_or_unsafe_source_file')
    try:
        with path.open('rb') as stream:
            before = signature(stream)
            require(before[0] == specification['bytes'], 'source_size_mismatch')
            md5, sha = hashlib.md5(usedforsecurity=False), hashlib.sha256()
            for block in iter(lambda: stream.read(65536), b''):
                md5.update(block); sha.update(block)
            require(md5.hexdigest() == specification['publisher_reported_md5'], 'source_hash_mismatch')
            digest = sha.hexdigest()
            if specification.get('local_sha256') is not None:
                require(digest == specification['local_sha256'], 'source_sha256_mismatch')
            require(signature(stream) == before, 'source_changed')
            stream.seek(0)
            yield stream, digest, before
            require(signature(stream) == before, 'source_changed')
    except OSError:
        raise InvalidRecord('source_io_failure') from None


def archive_member(archive):
    entries = archive.infolist()
    require(len(entries) == 1, 'archive_member_count')
    item = entries[0]
    name = item.filename
    require(name and '/' not in name and '\\' not in name and ':' not in name
            and not name.startswith('.') and name.lower().endswith('.csv'), 'unsafe_archive_path')
    mode = item.external_attr >> 16
    require(not item.is_dir() and not stat.S_ISLNK(mode)
            and stat.S_IFMT(mode) in (0, stat.S_IFREG), 'unsafe_archive_member_type')
    require(not item.flag_bits & 1 and item.compress_type in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED), 'unsupported_archive_encoding')
    require(0 < item.file_size <= MAX_EXPANDED_BYTES and item.compress_size > 0
            and item.file_size / item.compress_size <= 500, 'archive_expansion_limit')
    return item


def archive_preflight(stream):
    """Bound central-directory allocation before ZipFile reads it; reject multipart/ZIP64."""
    stream.seek(0, 2)
    size = stream.tell()
    stream.seek(max(0, size - 65557))
    tail = stream.read(65557)
    offset = tail.rfind(b'PK\x05\x06')
    require(offset >= 0 and len(tail) - offset >= 22, 'archive_directory')
    _, disk, central_disk, disk_count, count, directory_bytes, directory_offset, comment = struct.unpack('<4s4H2LH', tail[offset:offset + 22])
    require(offset + 22 + comment == len(tail) and disk == central_disk == 0
            and disk_count == count == 1 and 0 < directory_bytes <= 65536
            and directory_offset + directory_bytes <= size - len(tail) + offset, 'archive_directory_limit')
    stream.seek(0)


class BoundedLines:
    """Bound cumulative physical-line bytes per CSV record, including multiline quotes."""
    def __init__(self, stream):
        self.stream, self.bytes_in_record = stream, 0

    def __iter__(self):
        return self

    def __next__(self):
        raw = self.stream.readline(MAX_RECORD_BYTES + 1)
        if not raw:
            raise StopIteration
        self.bytes_in_record += len(raw)
        require(self.bytes_in_record <= MAX_RECORD_BYTES, 'record_size_limit')
        try:
            return raw.decode('utf-8-sig' if self.stream.tell() == len(raw) else 'utf-8')
        except UnicodeError:
            raise InvalidRecord('source_encoding') from None


def normalise_catalogue(source):
    require(isinstance(source, dict) and bool(source), 'source_evidence_metadata')
    evidences = {}
    for eid, item in source.items():
        require(isinstance(item, dict) and type(item.get('is_antecedent')) is bool, 'source_evidence_metadata')
        evidences[eid] = {'kind': 'antecedent' if item['is_antecedent'] else 'symptom',
                          'data_type': item.get('data_type'), 'question_en': item.get('question_en'),
                          'possible_values': item.get('possible-values', [])}
    result = {'catalogue_id': 'ddxplus-en-v2-evidences-40278013', 'evidences': evidences}
    validate_catalogue(result)
    return result


class DatasetLoader:
    """Only the checked-in English v2 manifest is accepted. Patient data never appears in repr."""
    def __init__(self, root, served_roots=()):
        self.root = external_path(root, served_roots)
        self.served_roots = tuple(served_roots)
        self.specs = {item['name']: item for item in manifest()['files']}

    def __repr__(self):
        return '<DDXPlusLocalLoader>'

    def missing_files(self):
        return sorted(name for name in self.specs if not (self.root / name).is_file())

    def _metadata(self, name):
        spec = self.specs[name]
        require(spec['bytes'] <= MAX_RECORD_BYTES, 'metadata_size_limit')
        with verified_file(self.root, spec, self.served_roots) as (stream, _, _):
            # Reject duplicate keys using the shared strict parser without opening another file.
            def pairs(items):
                out = {}
                for key, value in items:
                    require(key not in out, 'duplicate_json_key'); out[key] = value
                return out
            try:
                return json.load(stream, object_pairs_hook=pairs)
            except (UnicodeError, ValueError) as exc:
                if isinstance(exc, InvalidRecord):
                    raise
                raise InvalidRecord('malformed_source_metadata') from None

    def catalogue(self):
        return normalise_catalogue(self._metadata('release_evidences.json'))

    def _condition_names(self):
        source = self._metadata('release_conditions.json')
        require(isinstance(source, dict) and bool(source) and len(source) <= 10000, 'condition_metadata_shape')
        names = set()
        for item in source.values():
            require(isinstance(item, dict) and isinstance(item.get('condition_name'), str), 'condition_metadata_shape')
            names.add(item['condition_name'])
        return names

    def records(self, partition):
        """Evaluator-side decoded records, one at a time. Never pass this iterator to a selector."""
        require(partition in PARTITIONS, 'unknown_source_partition')
        catalogue, conditions = self.catalogue(), self._condition_names()
        try:
            with verified_file(self.root, self.specs[PARTITIONS[partition]], self.served_roots) as (file, digest, original):
                archive_preflight(file)
                with zipfile.ZipFile(file) as archive:
                    member = archive_member(archive)
                    with archive.open(member) as stream:
                        lines = BoundedLines(stream)
                        reader = csv.reader(lines, strict=True)
                        header = next(reader, [])
                        require(len(header) == len(set(header)) and set(header) == FIELDS, 'source_csv_header')
                        lines.bytes_in_record = 0
                        for row in reader:
                            require(len(row) == len(header), 'source_csv_columns')
                            require(signature(file) == original, 'source_changed')
                            raw = dict(zip(header, row))
                            try:
                                raw['AGE'] = float(raw['AGE'])
                            except ValueError:
                                raise InvalidRecord('source_age_encoding') from None
                            validated = validate_ddxplus_record(raw, catalogue)
                            require(validated['PATHOLOGY'] in conditions and all(d[0] in conditions for d in validated['DIFFERENTIAL_DIAGNOSIS']), 'unknown_source_condition')
                            lines.bytes_in_record = 0
                            yield partition, digest, validated
        except (zipfile.BadZipFile, RuntimeError, csv.Error, EOFError, zlib.error):
            raise InvalidRecord('malformed_archive_or_csv') from None

    def readiness(self):
        missing = self.missing_files()
        if missing:
            return {'status': 'missing_files', 'missing_files': missing, 'real_data_statistics': None}
        hashes = {}
        for name, spec in self.specs.items():
            with verified_file(self.root, spec, self.served_roots) as (_, digest, _):
                hashes[name] = digest
        from collections import Counter
        results = {}
        for partition in PARTITIONS:
            rows, classes = 0, Counter()
            for _, _, record in self.records(partition):
                rows += 1; classes[record['PATHOLOGY']] += 1
            results[partition] = {'rows': rows, 'synthetic_diagnostic_classes_observed': len(classes)}
        return {'status': 'local_files_verified_and_streamed', 'observed_sha256': hashes,
                'partitions': results, 'source_partitions_regenerated': False, 'urgency_labels_available': False,
                'clinical_accuracy_evaluated': False}
