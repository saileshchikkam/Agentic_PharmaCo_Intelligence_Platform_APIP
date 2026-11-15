"""Official background runner for MedAssist Model A Campaign 2026 Stage 6.

Resumes strictly from verified Stage 5 selection.json through Stage 6 sealing.
Never refits models, never modifies Stage 1-5 artifacts, never opens locked test partition.
Single-threaded, deterministic protocol execution.
"""
from __future__ import annotations

import datetime
import json
import os
from pathlib import Path
import sys
import traceback

# Ensure workspace root is in sys.path
workspace_root = Path(__file__).resolve().parent.parent
if str(workspace_root) not in sys.path:
    sys.path.insert(0, str(workspace_root))

from models.medassist_v2.campaign_runner import resume_stage6_only


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
    }
    with open(worker_info_path, "w", encoding="utf-8") as f:
        json.dump(worker_info, f, indent=2)

    print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Model A Stage 6 worker started with PID {os.getpid()}", flush=True)
    print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Campaign ID: {campaign_id}", flush=True)
    print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Run Root: {run_root}", flush=True)
    print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Data Root: {data_root}", flush=True)

    try:
        result = resume_stage6_only(
            data_root=data_root,
            run_root=run_root,
            campaign_id=campaign_id,
            execute=True,
            discard_incomplete_cache=True,
        )

        completion_info_path = run_root / "stage6_completion.json"
        with open(completion_info_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)

        worker_info["status"] = "completed"
        worker_info["completed_at_utc"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        worker_info["seal_sha256"] = result.get("seal_sha256")
        with open(worker_info_path, "w", encoding="utf-8") as f:
            json.dump(worker_info, f, indent=2)

        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Stage 6 completed and sealed successfully!", flush=True)
        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Selected Alpha: {result.get('selected_alpha')}", flush=True)
        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Seal SHA-256: {result.get('seal_sha256')}", flush=True)
        return 0

    except Exception as e:
        err_msg = traceback.format_exc()
        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] ERROR in Stage 6 execution:\n{err_msg}", file=sys.stderr, flush=True)
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
