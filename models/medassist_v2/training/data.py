"""Verified source capabilities and external, bounded-memory governance storage."""
import hashlib
import heapq
import importlib.metadata
import json
import os
from pathlib import Path
import platform
import sqlite3
import sys
from contextlib import closing

from .. import questioning_protocol as ref
from ..loader import DatasetLoader, PARTITIONS, normalise_catalogue, verified_file
from ..storage import external_path
from ..validation import read_json, require, typed_key


def file_hash(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda:stream.read(65536),b''): h.update(block)
    return h.hexdigest()


def write_json(path,value):
    with Path(path).open('x',encoding='utf-8',newline='\n') as stream:
        json.dump(value,stream,sort_keys=True,allow_nan=False,indent=2);stream.write('\n')


def database(path, readonly=False):
    path=Path(path)
    if readonly:
        db=sqlite3.connect(path.as_uri()+'?mode=ro',uri=True)
    else:
        require(not path.exists(),'artifact_exists')
        db=sqlite3.connect(path)
    db.execute('PRAGMA cache_size=-8192');db.execute('PRAGMA temp_store=FILE')
    return db


def environment(p):
    actual={'python':sys.version.split()[0]}
    for name in ('scikit-learn','numpy','scipy','jsonschema'):
        actual[name]=importlib.metadata.version(name)
    require(all(actual[k]==p['environment'][k] for k in actual),'environment_pin_mismatch')
    actual.update(platform=platform.platform(),sqlite=sqlite3.sqlite_version)
    return actual


def implementation_hashes():
    base=Path(__file__).parent
    paths=[*sorted(base.glob('*.py')),base.parent/'questioning_protocol.py',base.parent/'simulator.py',
           base.parent/'loader.py',base.parent/'validation.py',base.parent/'storage.py']
    return {str(path.relative_to(base.parent)).replace('\\','/'):file_hash(path) for path in paths}


def new_run(path,source_root=None):
    root=external_path(path)
    if source_root is not None:
        source=external_path(source_root)
        require(not (root==source or source.is_relative_to(root) or root.is_relative_to(source)), 'run_source_overlap')
    require(not root.exists(),'run_directory_exists')
    root.mkdir(parents=True,exist_ok=False)
    return root


class OfficialDataset:
    mode='official'

    def __init__(self,root,p):
        self.loader=DatasetLoader(root);self.p=p
        self.receipt=verify_sources(self.loader,p)
        self.source=self.loader._metadata('release_evidences.json')
        ref.validate_metadata(self.source,p)
        self.catalogue=normalise_catalogue(self.source)
        self.counts=p['source']['official_partitions']

    def records(self,partition):
        require(partition in PARTITIONS,'partition_scope')
        expected=next(f['sha256'] for f in self.p['source']['files'] if f['name']==PARTITIONS[partition])
        for membership,digest,record in self.loader.records(partition):
            require(membership==partition and digest==expected,'stream_membership_or_hash')
            yield record


def verify_sources(loader,p):
    """Checks all compressed source bytes, never decodes patient records."""
    result={}
    for spec in p['source']['files']:
        pinned={'name':spec['name'],'bytes':spec['bytes'],'publisher_reported_md5':spec['md5'],'local_sha256':spec['sha256']}
        with verified_file(loader.root,pinned) as (_,digest,_): result[spec['name']]=digest
    return result


class Encoding:
    """Metadata compiled once. Records supplied here have passed the source validator."""
    def __init__(self,source,p):
        self.source,self.p=source,p
        self.values={eid:{str(v):v for v in d['possible-values']} for eid,d in source.items()}

    def answers(self,record):
        result={}
        for token in record['EVIDENCES']:
            parts=token.split('_@_');eid=parts[0];kind=self.source[eid]['data_type']
            if kind=='B':result[eid]=True
            elif kind=='M':result.setdefault(eid,[]).append(self.values[eid][parts[1]])
            else:result[eid]=self.values[eid][parts[1]]
        return result

    def fingerprint(self,record):
        answers={eid:value for eid,value in self.answers(record).items() if eid not in ref.ORPHANS}
        for eid,value in answers.items():
            if self.source[eid]['data_type']=='M':answers[eid]=sorted(value,key=typed_key)
        return ref.sha({'profile':'active-interview-v1','AGE':float(record['AGE']),'SEX':record['SEX'],
                        'INITIAL_EVIDENCE':record['INITIAL_EVIDENCE'],'answers':sorted(answers.items())})


def sample_key(domain,fp):
    return hashlib.sha256(f'1729|{domain}|{fp}'.encode()).hexdigest()


def consider(heap,cap,fp,ordinal,record,domain):
    # Negative integers put the worst retained hash/ordinal at heap[0].
    entry=(-int(sample_key(domain,fp),16),-ordinal,fp,record)
    if len(heap)<cap:heapq.heappush(heap,entry)
    elif entry[:2]>heap[0][:2]:heapq.heapreplace(heap,entry)


def ordered(heap,domain):
    return sorted(((fp,-negordinal,raw) for _,negordinal,fp,raw in heap),key=lambda x:(sample_key(domain,x[0]),x[1]))


def prepare(dataset,root,p):
    """Train reference closes/seals before validation is read. Test is never opened here."""
    enc=Encoding(dataset.source,p)
    reference=database(root/'training-reference.sqlite')
    cohort=database(root/'cohorts.sqlite')
    try:
        reference.execute('CREATE TABLE groups(fp TEXT PRIMARY KEY, ordinal INTEGER, sample_key TEXT) WITHOUT ROWID')
        cohort.execute('CREATE TABLE records(partition TEXT, ordinal INTEGER, fp TEXT, raw TEXT, keep INTEGER, selected INTEGER, PRIMARY KEY(partition,ordinal)) WITHOUT ROWID')
        cohort.execute('CREATE INDEX records_fp ON records(partition,fp)')
        heap=[];train_rows=0
        for ordinal,raw in enumerate(dataset.records('train')):
            train_rows+=1;fp=enc.fingerprint(raw)
            inserted=reference.execute('INSERT OR IGNORE INTO groups VALUES(?,?,?)',(fp,ordinal,sample_key('fit',fp))).rowcount
            if inserted:consider(heap,p['prefixes']['max_unique_cases'],fp,ordinal,raw,'fit')
            if train_rows%5000==0:reference.commit()
        require(train_rows==dataset.counts['train'],'train_count_mismatch')
        reference.commit();groups=reference.execute('SELECT count(*) FROM groups').fetchone()[0]
        selected_train=ordered(heap,'fit')
        require(bool(selected_train),'empty_training_cohort')
        for fp,ordinal,raw in selected_train:
            cohort.execute('INSERT INTO records VALUES(?,?,?,?,?,?)',('train',ordinal,fp,typed_key(raw),1,1))
        reference.close();reference=None
        write_json(root/'training-reference.json',{'mode':dataset.mode,'partition':'train','profile':'active-interview-v1',
            'reference_sha256':file_hash(root/'training-reference.sqlite'),'rows':train_rows,'groups':groups,
            'selected_membership_sha256':ref.sha([[fp,ordinal] for fp,ordinal,_ in selected_train]),
            'protocol_sha256':file_hash(ref.PROTOCOL),'source_hashes':dataset.receipt})
        reference=database(root/'training-reference.sqlite',True)
        heap=[];val_rows=0
        # The disk-backed uniqueness table includes all validation groups; only <=4096 raw cases remain on the heap.
        cohort.execute('CREATE TABLE validation_groups(fp TEXT PRIMARY KEY, ordinal INTEGER) WITHOUT ROWID')
        for ordinal,raw in enumerate(dataset.records('validation')):
            val_rows+=1;fp=enc.fingerprint(raw)
            keep=reference.execute('SELECT 1 FROM groups WHERE fp=?',(fp,)).fetchone() is None
            first=cohort.execute('INSERT OR IGNORE INTO validation_groups VALUES(?,?)',(fp,ordinal)).rowcount
            cohort.execute('INSERT INTO records VALUES(?,?,?,?,?,?)',('validation',ordinal,fp,typed_key(raw),int(keep),0))
            if keep and first:consider(heap,p['selection']['validation_cap_unique_nontraining_groups'],fp,ordinal,raw,'select')
            if val_rows%5000==0:cohort.commit()
        require(val_rows==dataset.counts['validation'],'validation_count_mismatch')
        selected_val=ordered(heap,'select')
        require(bool(selected_val),'empty_nonoverlap_validation')
        for _,ordinal,_ in selected_val:cohort.execute('UPDATE records SET selected=1 WHERE partition=? AND ordinal=?',('validation',ordinal))
        cohort.commit()
        result={'mode':dataset.mode,'train_rows':train_rows,'train_groups':groups,'fit_groups':len(selected_train),
                'validation_rows':val_rows,'selection_groups':len(selected_val),'test_rows_opened':0,
                'cohorts_sha256':file_hash(root/'cohorts.sqlite')}
        write_json(root/'cohorts.json',result)
        return result
    finally:
        if reference is not None:reference.close()
        cohort.close()


def selected_records(root,partition,domain):
    require((partition,domain) in (('train','fit'),('validation','select')),'selected_partition')
    with closing(database(root/'cohorts.sqlite',True)) as db:
        rows=db.execute('SELECT fp,ordinal,raw FROM records WHERE partition=? AND selected=1',(partition,)).fetchall()
    rows.sort(key=lambda r:(sample_key(domain,r[0]),r[1]))
    for fp,ordinal,raw in rows:yield fp,ordinal,json.loads(raw)
