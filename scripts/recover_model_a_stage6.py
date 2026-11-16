"""Deterministic Checkpoint Recovery Runner for MedAssist Model A Campaign 2026 Stage 6.

Resumes from verified partial validation-trajectories.sqlite (ordinal 69,000 through 132,447).
Never refits models, never modifies the 13 frozen implementation files, and never opens locked test partition.
Single-threaded, deterministic protocol execution.
"""
from __future__ import annotations

import datetime
import json
import os
from pathlib import Path
import sqlite3
import sys
import time
import traceback

from threadpoolctl import threadpool_limits

# Ensure workspace root is in sys.path
workspace_root = Path(__file__).resolve().parent.parent
if str(workspace_root) not in sys.path:
    sys.path.insert(0, str(workspace_root))

from models.medassist_v2.campaign_runner import (
    authenticate_protocol,
    _verify_stage1_4_artifacts,
    _write_campaign_provenance,
)
from models.medassist_v2.training.data import (
    OfficialDataset,
    implementation_hashes,
    file_hash,
)
from models.medassist_v2.training.campaign import (
    policies,
    load_models,
    cached_report,
    seal,
    verify_seal,
    choose,
)
from models.medassist_v2.training.flow import trajectory
from models.medassist_v2.validation import read_json, require
from models.medassist_v2 import questioning_protocol as ref


def safe_write_json(path: Path, data: Any) -> None:
    """Atomic write that safely overwrites without failing on existing files."""
    tmp_path = path.with_suffix(f".tmp_{os.getpid()}")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    tmp_path.replace(path)


def main() -> int:
    data_root = Path(r"C:\apip_research\ddxplus_v2\source")
    run_root = Path(r"C:\apip_research\campaign_2026\run_01")
    campaign_id = "campaign-2026-v1"

    worker_info_path = run_root / "stage6_worker.json"
    worker_info = {
        "pid": os.getpid(),
        "campaign_id": campaign_id,
        "run_root": str(run_root),
        "data_root": str(data_root),
        "python_exe": sys.executable,
        "python_version": sys.version,
        "started_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "status": "running",
        "mode": "deterministic_checkpoint_recovery",
    }
    with open(worker_info_path, "w", encoding="utf-8") as f:
        json.dump(worker_info, f, indent=2)

    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    print(f"[{now_str}] Model A Stage 6 Checkpoint Recovery worker started with PID {os.getpid()}", flush=True)
    print(f"[{now_str}] Campaign ID: {campaign_id}", flush=True)
    print(f"[{now_str}] Run Root: {run_root}", flush=True)
    print(f"[{now_str}] Data Root: {data_root}", flush=True)

    try:
        # 1. Authenticate protocol and verify Stage 1-4 and Stage 5 receipts
        p, representation, canonical_sha, historical_sha = authenticate_protocol()
        dataset = OfficialDataset(data_root, p)
        _verify_stage1_4_artifacts(run_root, dataset)

        selection = read_json(run_root / "selection.json")
        require(selection.get("partition") == "validation", "selection_partition_invalid")
        require(selection.get("training_overlap_excluded") is True, "selection_overlap_invalid")
        require(selection.get("model_refitted_after_selection") is False, "selection_refit_flag_invalid")
        require(selection.get("selected_alpha") == choose(selection["scores"], p), "selection_rule_mismatch")
        selected_alpha = selection["selected_alpha"]
        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Verified Stage 1-5 artifacts. Selected alpha: {selected_alpha}", flush=True)

        # Verify implementation hashes match run.json exactly
        run_meta = read_json(run_root / "run.json")
        require(run_meta["implementation"] == implementation_hashes(), "implementation_hashes_mismatch")
        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] All 13 frozen implementation hashes verified intact.", flush=True)

        # 2. Inspect and connect to existing validation-trajectories.sqlite
        cache_path = run_root / "validation-trajectories.sqlite"
        require(cache_path.exists(), "validation_cache_missing")

        cache_conn = sqlite3.connect(cache_path)
        cache_cur = cache_conn.cursor()

        # Check integrity
        cache_cur.execute("PRAGMA integrity_check;")
        integrity = cache_cur.fetchall()
        require(integrity == [("ok",)], f"database_integrity_failed: {integrity}")
        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Database integrity check: ok", flush=True)

        # Determine committed count
        cache_cur.execute("SELECT max(ordinal), count(DISTINCT ordinal), count(*) FROM trajectories;")
        max_ord, count_distinct, total_rows = cache_cur.fetchone()
        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Current database state: max_ordinal={max_ord}, distinct_patients={count_distinct}, total_trajectories={total_rows}", flush=True)

        total_patients = dataset.counts["validation"]  # 132,448
        total_expected_trajectories = total_patients * 4  # 529,792

        require(max_ord is not None and count_distinct == max_ord + 1, "ordinal_sequence_gap_detected")
        start_ordinal = max_ord + 1
        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Resuming computation from ordinal {start_ordinal} through {total_patients - 1}...", flush=True)

        # 3. Initialize selectors with single thread
        with threadpool_limits(limits=1):
            selectors = policies(run_root, p)

            cohort_conn = sqlite3.connect(run_root / "cohorts.sqlite")
            cohort_cur = cohort_conn.cursor()

            progress_path = run_root / "stage6_recovery_progress.json"
            batch_size = 500  # Commit every 500 patients (2,000 trajectories)
            processed_in_session = 0
            t_session_start = time.monotonic()

            cohort_cur.execute(
                "SELECT ordinal, fp, keep, raw FROM records WHERE partition='validation' AND ordinal >= ? ORDER BY ordinal",
                (start_ordinal,)
            )

            current_batch = []
            for ordinal, fp, keep, raw_str in cohort_cur:
                raw = json.loads(raw_str)
                for name, selector in selectors.items():
                    res = trajectory(raw, dataset.source, dataset.catalogue, p, selector, "validation")
                    res_json = json.dumps(res, allow_nan=False, separators=(",", ":"))
                    current_batch.append((fp, ordinal, int(keep), name, res_json))

                processed_in_session += 1

                if len(current_batch) >= batch_size * 4:
                    cache_cur.executemany("INSERT INTO trajectories VALUES(?,?,?,?,?)", current_batch)
                    cache_conn.commit()
                    current_batch.clear()

                    # Update progress receipt
                    current_patient_count = start_ordinal + processed_in_session
                    current_traj_count = current_patient_count * 4
                    pct = (current_traj_count / total_expected_trajectories) * 100.0
                    elapsed_session = time.monotonic() - t_session_start
                    rate = processed_in_session / elapsed_session if elapsed_session > 0 else 1.0
                    remaining_patients = total_patients - current_patient_count
                    remaining_sec = remaining_patients / rate if rate > 0 else 0

                    progress_info = {
                        "pid": os.getpid(),
                        "mode": "deterministic_checkpoint_recovery",
                        "current_ordinal": ordinal,
                        "patients_completed": current_patient_count,
                        "total_patients": total_patients,
                        "trajectories_completed": current_traj_count,
                        "total_trajectories": total_expected_trajectories,
                        "completion_percentage": round(pct, 2),
                        "session_elapsed_seconds": round(elapsed_session, 1),
                        "rate_patients_per_second": round(rate, 3),
                        "estimated_remaining_seconds": round(remaining_sec, 1),
                        "estimated_remaining_hours": round(remaining_sec / 3600.0, 2),
                        "updated_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    }
                    safe_write_json(progress_path, progress_info)

                    if processed_in_session % 2000 == 0:
                        print(
                            f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Progress: {current_traj_count}/{total_expected_trajectories} ({pct:.2f}%) | "
                            f"Rate: {rate:.2f} pat/s | ETA: {remaining_sec/3600.0:.2f} hrs",
                            flush=True
                        )

            # Insert any trailing rows
            if current_batch:
                cache_cur.executemany("INSERT INTO trajectories VALUES(?,?,?,?,?)", current_batch)
                cache_conn.commit()
                current_batch.clear()

            cohort_conn.close()

            # 4. Final verification of trajectory database
            cache_cur.execute("SELECT count(*), count(DISTINCT ordinal) FROM trajectories;")
            final_rows, final_distinct = cache_cur.fetchone()
            print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Trajectory evaluation complete! Total rows: {final_rows}, Distinct patients: {final_distinct}", flush=True)
            require(final_rows == total_expected_trajectories, f"expected {total_expected_trajectories} trajectories, got {final_rows}")
            require(final_distinct == total_patients, f"expected {total_patients} patients, got {final_distinct}")

            cache_cur.execute("PRAGMA integrity_check;")
            final_integrity = cache_cur.fetchall()
            require(final_integrity == [("ok",)], f"final_database_integrity_failed: {final_integrity}")
            cache_conn.close()

            print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Trajectory database closed cleanly. Generating validation-aggregate.json...", flush=True)
            report = cached_report(run_root, "validation", p)
            val_agg_path = run_root / "validation-aggregate.json"
            if val_agg_path.exists():
                val_agg_path.unlink()
            safe_write_json(val_agg_path, report)
            print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] validation-aggregate.json written successfully.", flush=True)

            print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Sealing campaign artifacts...", flush=True)
            # Ensure seal files do not pre-exist
            for seal_f in ["pre-test-seal.json", "pre-test-seal-hash.json", "campaign-provenance.json"]:
                p_f = run_root / seal_f
                if p_f.exists():
                    p_f.unlink()

            seal_record = seal(run_root, p)
            verify_seal(run_root, dataset, p)
            print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Pre-test seal created and cryptographically verified!", flush=True)

            # Write campaign provenance
            provenance = _write_campaign_provenance(
                run_root,
                campaign_id=campaign_id,
                dataset=dataset,
                resume_time=worker_info["started_at_utc"],
                resumption_note=(
                    "Stages 1-5 completed cleanly (selection.json verified); Stage 6 evaluation was checkpointed at "
                    f"ordinal {start_ordinal - 1} ({start_ordinal * 4} trajectories). Deterministic checkpoint recovery resumed "
                    f"from ordinal {start_ordinal} through {total_patients - 1} without altering the 13 frozen files or refitting models."
                ),
                representation=representation,
                canonical_sha=canonical_sha,
                historical_sha=historical_sha,
                seal_record=seal_record,
            )

            completion_info_path = run_root / "stage6_completion.json"
            safe_write_json(completion_info_path, provenance)

            worker_info["status"] = "completed"
            worker_info["completed_at_utc"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            worker_info["seal_sha256"] = provenance["seal_sha256"]
            safe_write_json(worker_info_path, worker_info)

            print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] All Stage 6 validation, aggregation, and sealing completed successfully!", flush=True)
            print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Seal SHA-256: {provenance['seal_sha256']}", flush=True)
            return 0

    except Exception as e:
        err_msg = traceback.format_exc()
        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] ERROR in Stage 6 checkpoint recovery:\n{err_msg}", file=sys.stderr, flush=True)
        error_info_path = run_root / "stage6_error.json"
        with open(error_info_path, "w", encoding="utf-8") as f:
            json.dump({
                "pid": os.getpid(),
                "failed_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "error": str(e),
                "traceback": err_msg,
            }, f, indent=2)

        worker_info["status"] = "failed"
        worker_info["failed_at_utc"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        worker_info["error"] = str(e)
        with open(worker_info_path, "w", encoding="utf-8") as f:
            json.dump(worker_info, f, indent=2)
        return 1


if __name__ == "__main__":
    sys.exit(main())
