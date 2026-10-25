"""Transitive duplicate/patient/encounter/source grouping; no row-random split."""
from collections import Counter
from dataclasses import dataclass
import hashlib
import json
import random
from .data import Observation, ReadinessError, records_digest


def symptom_key(record, schema):
    values={name:record.features.get(name,Observation(state='not_asked',value=None)).model_dump()
            for name in sorted(schema.symptom_group_features)}
    for observation in values.values():
        if type(observation['value']) in (int,float):
            observation['value']=float(observation['value']) or 0.0
    return hashlib.sha256(json.dumps(values,sort_keys=True,separators=(',',':')).encode()).hexdigest()


@dataclass(frozen=True)
class Split:
    train: tuple[int,...]
    calibration: tuple[int,...]
    test: tuple[int,...]
    seed: int
    dataset_sha256: str
    records_sha256: str
    features_sha256: str

    def parts(self):
        return {'train':self.train,'calibration':self.calibration,'test':self.test}


class LeakageAuditor:
    def audit(self, records, split, schema):
        if not records:raise ReadinessError('EMPTY_DATASET')
        schema_hash=hashlib.sha256(json.dumps(schema.model_dump(),sort_keys=True).encode()).hexdigest()
        if split.records_sha256!=records_digest(records) or split.features_sha256!=schema_hash:
            raise ReadinessError('SPLIT_RECORDS_OR_FEATURE_SCHEMA_CHANGED')
        flattened=[i for part in split.parts().values() for i in part]
        if sorted(flattened)!=list(range(len(records))):
            raise ReadinessError('SPLIT_MUST_COVER_EACH_RECORD_ONCE')
        owners={}; overlaps=Counter()
        for part,indices in split.parts().items():
            for i in indices:
                row=records[i]
                keys=[('record',row.record_id),('symptom',symptom_key(row,schema))]
                keys += [(kind,value) for kind,value in [('patient',row.patient_id),('encounter',row.encounter_id),('source',row.source_group)] if value]
                for key in keys:
                    if key in owners and owners[key]!=part: overlaps[key[0]]+=1
                    owners[key]=part
        if overlaps:
            raise ReadinessError('CROSS_SPLIT_IDENTITY_OR_SYMPTOM_LEAKAGE')
        counts=Counter(r.target for r in records)
        group_labels={}
        for row in records: group_labels.setdefault(symptom_key(row,schema),set()).add(row.target)
        return {'rows':len(records),'symptom_groups':len(group_labels),
                'repeated_symptom_groups':len(records)-len(group_labels),
                'conflicting_labels_in_symptom_groups':sum(len(v)>1 for v in group_labels.values()),
                'class_support':dict(sorted(counts.items())),
                'imbalance_ratio':max(counts.values())/min(counts.values()),
                'missing_patient_ids':sum(not r.patient_id for r in records),
                'missing_encounter_ids':sum(not r.encounter_id for r in records),
                'split_class_support':{part:dict(sorted(Counter(records[i].target for i in indices).items()))
                                       for part,indices in split.parts().items()},
                'cross_split_overlap':0,
                'limitation':'Identifiers absent from source cannot be audited; grouping review and intended-use assessment remain required'}


class GroupSafeSplitter:
    def __init__(self, seed=42, train_fraction=0.6, calibration_fraction=0.2):
        if not (0<train_fraction<1 and 0<calibration_fraction<1 and train_fraction+calibration_fraction<1):
            raise ReadinessError('INVALID_SPLIT_FRACTIONS')
        self.seed=seed;self.train_fraction=train_fraction;self.calibration_fraction=calibration_fraction

    def split(self, records, schema, dataset_sha256):
        parent=list(range(len(records)))
        def find(i):
            while parent[i]!=i:
                parent[i]=parent[parent[i]];i=parent[i]
            return i
        seen={}
        for i,row in enumerate(records):
            keys=[('symptom',symptom_key(row,schema))]
            keys += [(kind,value) for kind,value in [('patient',row.patient_id),('encounter',row.encounter_id),('source',row.source_group)] if value]
            for key in keys:
                if key in seen:parent[find(i)]=find(seen[key])
                else:seen[key]=i
        groups={}
        for i in range(len(records)):groups.setdefault(find(i),[]).append(i)
        ordered=sorted(groups,key=lambda k:min(groups[k]));random.Random(self.seed).shuffle(ordered)
        n=len(ordered);a=int(n*self.train_fraction);b=a+int(n*self.calibration_fraction)
        if not (0<a<b<n):raise ReadinessError('INSUFFICIENT_INDEPENDENT_GROUPS')
        parts=[tuple(sorted(i for group in subset for i in groups[group]))
               for subset in (ordered[:a],ordered[a:b],ordered[b:])]
        schema_hash=hashlib.sha256(json.dumps(schema.model_dump(),sort_keys=True).encode()).hexdigest()
        result=Split(*parts,self.seed,dataset_sha256,records_digest(records),schema_hash)
        LeakageAuditor().audit(records,result,schema)
        return result
