import json
import os
import sqlite3
from pathlib import Path
from models.medassist_v2.training.data import OfficialDataset
from models.medassist_v2.training.campaign import policies
from models.medassist_v2.training.flow import trajectory
from models.medassist_v2.campaign_runner import authenticate_protocol

data_root = Path(os.environ.get("MEDASSIST_A_METADATA_ROOT", r"C:\apip_research\ddxplus_v2\source"))
run_root = Path(os.environ.get("MEDASSIST_A_RUN_ROOT", r"C:\apip_research\campaign_2026\run_01"))
db_path = Path(os.environ.get("MEDASSIST_A_DB_PATH", run_root / "validation-trajectories.sqlite"))

p, _, _, _ = authenticate_protocol()
dataset = OfficialDataset(data_root, p)
selectors = policies(run_root, p)

# Connect to cohorts.sqlite to get raw patient record for ordinal 0 and ordinal 68999
cohort_conn = sqlite3.connect(run_root / "cohorts.sqlite")
cohort_cur = cohort_conn.cursor()

cache_conn = sqlite3.connect(db_path)
cache_cur = cache_conn.cursor()

test_ordinals = [0, 100, 1000, 68999]
all_match = True

for ord_val in test_ordinals:
    cohort_cur.execute("SELECT fp, keep, raw FROM records WHERE partition='validation' AND ordinal=?", (ord_val,))
    fp, keep, raw_str = cohort_cur.fetchone()
    raw = json.loads(raw_str)

    for name, selector in selectors.items():
        cache_cur.execute("SELECT result FROM trajectories WHERE ordinal=? AND policy=?", (ord_val, name))
        stored_result_str = cache_cur.fetchone()[0]

        computed_result = trajectory(raw, dataset.source, dataset.catalogue, p, selector, 'validation')
        computed_result_str = json.dumps(computed_result, allow_nan=False, separators=(',', ':'))

        if stored_result_str != computed_result_str:
            print(f"MISMATCH for ordinal={ord_val}, policy={name}!")
            all_match = False
        else:
            print(f"MATCH: ordinal={ord_val}, policy={name}")

print("\nExact protocol equivalence test passed:", all_match)

cohort_conn.close()
cache_conn.close()
