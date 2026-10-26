"""
session.py
----------
Thread-safe in-memory store for uploaded datasets and clustering run results.

Design decisions:
- No database is required for local development.
- A dataset is stored under a UUID key.
- Clustering runs are keyed by another UUID.
- Both collections are capped to avoid unbounded memory growth.
- This module is NOT production-safe for multi-worker deployments
  (use Redis or a DB for that scenario).
"""

import threading
from collections import OrderedDict
from typing import Any, Dict, Optional

_lock = threading.Lock()

# Ordered dicts preserve insertion order so we can evict the oldest entry
_MAX_DATASETS = 20
_MAX_RUNS = 50

# { dataset_id: { "df": pd.DataFrame, "preview": dict, "filename": str, ... } }
_datasets: OrderedDict[str, Dict[str, Any]] = OrderedDict()

# { run_id: { "dataset_id": str, "result": dict, "profiles": dict, ... } }
_runs: OrderedDict[str, Dict[str, Any]] = OrderedDict()


def _evict(store: OrderedDict, max_items: int) -> None:
    while len(store) >= max_items:
        store.popitem(last=False)  # remove oldest


# ── Dataset storage ──────────────────────────────────────────────────────────

def store_dataset(dataset_id: str, payload: Dict[str, Any]) -> None:
    with _lock:
        _evict(_datasets, _MAX_DATASETS)
        _datasets[dataset_id] = payload


def get_dataset(dataset_id: str) -> Optional[Dict[str, Any]]:
    with _lock:
        return _datasets.get(dataset_id)


def delete_dataset(dataset_id: str) -> bool:
    with _lock:
        if dataset_id in _datasets:
            del _datasets[dataset_id]
            return True
        return False


def list_datasets() -> list:
    with _lock:
        return [
            {
                "dataset_id": did,
                "filename": d.get("filename", "unknown"),
                "n_rows": d.get("preview", {}).get("n_rows", 0),
                "n_cols": d.get("preview", {}).get("n_cols", 0),
            }
            for did, d in _datasets.items()
        ]


# ── Run storage ───────────────────────────────────────────────────────────────

def store_run(run_id: str, payload: Dict[str, Any]) -> None:
    with _lock:
        _evict(_runs, _MAX_RUNS)
        _runs[run_id] = payload


def get_run(run_id: str) -> Optional[Dict[str, Any]]:
    with _lock:
        return _runs.get(run_id)


def list_runs(dataset_id: Optional[str] = None) -> list:
    with _lock:
        return [
            {
                "run_id": rid,
                "dataset_id": r.get("dataset_id"),
                "algorithm": r.get("algorithm"),
                "n_clusters_found": r.get("result", {}).get("n_clusters_found"),
                "created_at": r.get("created_at"),
            }
            for rid, r in _runs.items()
            if dataset_id is None or r.get("dataset_id") == dataset_id
        ]


# ── Active/default dataset pointer (for legacy endpoints) ────────────────────
# Keeps backward compat with the existing endpoints.py that uses CURRENT_DATASET

_active_dataset_id: Optional[str] = None


def set_active(dataset_id: str) -> None:
    global _active_dataset_id
    with _lock:
        _active_dataset_id = dataset_id


def get_active_id() -> Optional[str]:
    with _lock:
        return _active_dataset_id


def get_active_dataset() -> Optional[Dict[str, Any]]:
    with _lock:
        if _active_dataset_id and _active_dataset_id in _datasets:
            return _datasets[_active_dataset_id]
        # Fallback: most recently added
        if _datasets:
            return next(reversed(_datasets.values()))
        return None
