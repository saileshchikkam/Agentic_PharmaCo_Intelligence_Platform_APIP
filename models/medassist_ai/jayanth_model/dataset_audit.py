"""Dataset/split audit only: no fitting, loading estimators or accuracy scoring."""
from collections import Counter, defaultdict
import csv
import hashlib
from pathlib import Path
from .static_inspection import literal_string_list, opcode_summary


def audit_dataset(root):
    from sklearn.model_selection import GroupShuffleSplit, train_test_split
    root = Path(root)
    with (root/'app/data/processed/processed_dataset.csv').open(encoding='utf-8-sig',newline='') as stream:
        reader = csv.DictReader(stream)
        columns = tuple(c for c in reader.fieldnames if c != 'Disease'); rows = list(reader)
    vocabulary = literal_string_list((root/'app/ml/symptom_columns.joblib').read_bytes())
    if columns != vocabulary or any(row[c] not in ('0','1') for row in rows for c in columns):
        raise ValueError('CSV_VOCABULARY_OR_BINARY_SCHEMA_MISMATCH')
    labels = [row['Disease'] for row in rows]
    groups = [''.join(row[c] for c in columns) for row in rows]  # Deliberately label-independent.
    by_group = defaultdict(set)
    for group, label in zip(groups, labels): by_group[group].add(label)
    # Reconstruct historical split indices solely to audit leakage. No evaluation.
    old_train, old_test = train_test_split(list(range(len(rows))),test_size=0.2,random_state=42,stratify=labels)
    old_groups = {groups[i] for i in old_train}
    leaked = sum(groups[i] in old_groups for i in old_test)
    train, test = next(GroupShuffleSplit(n_splits=1,test_size=0.2,random_state=42).split(rows,labels,groups))
    train_groups, test_groups = {groups[i] for i in train}, {groups[i] for i in test}
    assert not train_groups & test_groups
    counts = Counter(labels)
    groups_per_class = Counter(label for values in by_group.values() for label in values)
    return {
        'rows':len(rows),'features':len(columns),'labels':len(counts),
        'serialized_literal_vocabulary_matches_csv_order':True,
        'symptom_groups':len(by_group),'repeated_symptom_vectors':len(rows)-len(by_group),
        'groups_with_conflicting_disease_labels':sum(len(v)>1 for v in by_group.values()),
        'class_support':dict(sorted(counts.items())),
        'unique_symptom_groups_per_class':dict(sorted(groups_per_class.items())),
        'unique_group_min':min(groups_per_class.values()),'unique_group_max':max(groups_per_class.values()),
        'class_min':min(counts.values()),'class_max':max(counts.values()),
        'class_imbalance_ratio':max(counts.values())/min(counts.values()),
        'historical_row_split_audit':{'test_rows':len(old_test),'test_rows_with_symptom_group_in_training':leaked,
            'overlap_fraction':leaked/len(old_test),'accuracy_computed':False},
        'prospective_group_partition':{'method':'GroupShuffleSplit seed42 test_size0.2; group=symptom vector without label',
            'train_rows':len(train),'test_rows':len(test),'train_groups':len(train_groups),'test_groups':len(test_groups),
            'group_overlap':0,'train_label_count':len({labels[i] for i in train}),
            'test_label_count':len({labels[i] for i in test}),
            'assignment_sha256':hashlib.sha256(','.join(map(str,sorted(map(int,test)))).encode()).hexdigest(),
            'independent_test_for_existing_model':False,
            'reason':'post-hoc grouping cannot undo the existing model training exposure; original exact training membership not attested'},
        'model_accuracy_or_calibration_claim':None,
        'serialized_artifact_inspection':{name:opcode_summary((root/'app/ml'/name).read_bytes())
            for name in ('model.joblib','label_encoder.joblib')},
        'joblib_loaded':False,'models_fitted':0,
    }
