"""Lightweight, non-destructive status inspector for Model A Stage 6."""
from __future__ import annotations

import datetime
import json
from pathlib import Path
import sqlite3
import sys

# Ensure workspace root is in sys.path
workspace_root = Path(__file__).resolve().parent.parent
if str(workspace_root) not in sys.path:
    sys.path.insert(0, str(workspace_root))

from models.medassist_v2.training.data import file_hash


def check_status() -> dict:
    run_root = Path(r"C:\apip_research\campaign_2026\run_01")
    total_validation_cases = 132448
    policies_count = 4
    total_expected_trajectories = total_validation_cases * policies_count

    worker_path = run_root / "stage6_worker.json"
    worker_info = {}
    if worker_path.exists():
        try:
            worker_info = json.loads(worker_path.read_text(encoding="utf-8"))
        except Exception:
            pass

    pid = worker_info.get("pid")
    is_alive = False
    if pid:
        try:
            import psutil
            is_alive = psutil.pid_exists(pid)
        except ImportError:
            # Fallback for Windows without psutil
            import subprocess
            res = subprocess.run(["tasklist", "/FI", f"PID eq {pid}"], capture_output=True, text=True)
            is_alive = str(pid) in res.stdout

    val_sqlite = run_root / "validation-trajectories.sqlite"
    trajectories_count = 0
    cases_completed = 0
    max_ordinal = None
    sqlite_size_mb = 0.0

    if val_sqlite.exists():
        sqlite_size_mb = round(val_sqlite.stat().st_size / (1024 * 1024), 2)
        try:
            # Open in read-only URI mode to avoid blocking worker transactions
            conn = sqlite3.connect(f"file:{val_sqlite}?mode=ro", uri=True, timeout=5.0)
            cur = conn.cursor()
            cur.execute("SELECT count(*), max(ordinal) FROM trajectories")
            row = cur.fetchone()
            if row:
                trajectories_count = row[0] or 0
                max_ordinal = row[1]
                cases_completed = (max_ordinal + 1) if max_ordinal is not None else (trajectories_count // policies_count)
            conn.close()
        except Exception as e:
            # Table might be locked or just created
            pass

    pct = round((cases_completed / total_validation_cases) * 100, 2)

    has_aggregate = (run_root / "validation-aggregate.json").exists()
    has_seal = (run_root / "pre-test-seal.json").exists()
    has_seal_hash = (run_root / "pre-test-seal-hash.json").exists()
    has_provenance = (run_root / "campaign-provenance.json").exists()

    status = "running" if is_alive else ("completed" if (has_seal and has_provenance) else "idle_or_interrupted")

    report = {
        "timestamp_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "status": status,
        "worker_pid": pid,
        "process_alive": is_alive,
        "worker_info": worker_info,
        "cases_completed": cases_completed,
        "total_cases": total_validation_cases,
        "progress_percent": pct,
        "trajectories_count": trajectories_count,
        "expected_trajectories": total_expected_trajectories,
        "sqlite_size_mb": sqlite_size_mb,
        "max_ordinal": max_ordinal,
        "artifacts": {
            "validation-trajectories.sqlite": val_sqlite.exists(),
            "validation-aggregate.json": has_aggregate,
            "pre-test-seal.json": has_seal,
            "pre-test-seal-hash.json": has_seal_hash,
            "campaign-provenance.json": has_provenance,
        }
    }
    return report


if __name__ == "__main__":
    rep = check_status()
    print(json.dumps(rep, indent=2))
