"""Read-only external research-path guard; creates/deletes/moves no files."""
from __future__ import annotations

import os
from pathlib import Path

from .validation import require

REPO = Path(__file__).resolve().parents[2]


def external_path(value, served_roots=()):
    path = Path(value)
    require(path.is_absolute(), 'external_path_must_be_absolute')
    path = path.resolve()
    forbidden = [REPO, *(Path(p).resolve() for p in served_roots)]
    for name in ('OneDrive', 'OneDriveConsumer', 'OneDriveCommercial'):
        if os.environ.get(name):
            forbidden.append(Path(os.environ[name]).resolve())
    for root in forbidden:
        require(not (path == root or path.is_relative_to(root) or root.is_relative_to(path)), 'research_path_overlaps_protected_root')
    require(len(path.parts) >= 4 and not any(
        p.casefold() in ('public', 'dist', 'wwwroot', 'static', '.git') or p.casefold().startswith('onedrive')
        for p in path.parts), 'research_path_may_be_served_or_synced')
    return path
