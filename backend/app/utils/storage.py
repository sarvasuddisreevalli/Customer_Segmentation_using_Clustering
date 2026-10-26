"""
storage.py
----------
Filesystem storage abstraction for raw datasets and generated artifacts.
Guarantees directory traversal prevention, safe UUID naming, and safe CSV exports.
"""

import os
import re
import uuid
from pathlib import Path
from typing import Optional
import pandas as pd
from app.core.config import settings
from app.core.exceptions import FileSecurityError


def sanitize_filename(filename: str) -> str:
    """Strip out path components and dangerous characters from user-supplied filenames."""
    base = os.path.basename(filename)
    # Remove any characters other than alphanumeric, dots, underscores, dashes
    clean = re.sub(r"[^a-zA-Z0-9._-]", "_", base)
    return clean or "uploaded_dataset.csv"


def save_uploaded_file(file_bytes: bytes, original_filename: str) -> tuple[str, str, int]:
    """
    Saves an uploaded file to the safe dataset storage directory under a unique UUID name.
    Returns (safe_file_id, absolute_path, file_size).
    """
    safe_name = sanitize_filename(original_filename)
    file_id = str(uuid.uuid4())
    stored_name = f"{file_id}_{safe_name}"
    target_path = settings.DATASET_STORAGE_PATH / stored_name

    # Validate directory containment to prevent traversal
    try:
        resolved = target_path.resolve()
        if not str(resolved).startswith(str(settings.DATASET_STORAGE_PATH.resolve())):
            raise FileSecurityError("Invalid storage path target: directory traversal prevented.")
    except Exception as e:
        raise FileSecurityError(f"Path resolution error: {e}")

    with open(target_path, "wb") as f:
        f.write(file_bytes)

    return file_id, str(target_path), len(file_bytes)


def load_dataset_dataframe(file_path: str) -> pd.DataFrame:
    """Load a stored dataset CSV into a pandas DataFrame."""
    path = Path(file_path)
    if not path.is_file():
        raise FileNotFoundError(f"Dataset file not found at: {file_path}")
    return pd.read_csv(path)


def save_artifact_csv(df: pd.DataFrame, artifact_type: str, run_id: str) -> tuple[str, str, int]:
    """
    Saves a DataFrame as an artifact CSV with formula-injection sanitization.
    Returns (artifact_id, file_path, file_size).
    """
    artifact_id = str(uuid.uuid4())
    filename = f"{run_id}_{artifact_type}_{artifact_id[:8]}.csv"
    target_path = settings.ARTIFACT_STORAGE_PATH / filename

    # Sanitize any string fields to prevent CSV formula injection (=, +, -, @)
    sanitized_df = df.copy()
    for col in sanitized_df.select_dtypes(include=["object"]).columns:
        sanitized_df[col] = sanitized_df[col].astype(str).apply(
            lambda x: f"'{x}" if any(x.startswith(char) for char in ["=", "+", "-", "@"]) else x
        )

    sanitized_df.to_csv(target_path, index=False)
    file_size = target_path.stat().st_size
    return artifact_id, str(target_path), file_size


def delete_file_safely(file_path: Optional[str]) -> bool:
    """Safely delete a file if it exists within the application storage directory."""
    if not file_path:
        return False
    try:
        p = Path(file_path).resolve()
        storage_root = settings.STORAGE_PATH.resolve()
        if str(p).startswith(str(storage_root)) and p.is_file():
            p.unlink(missing_ok=True)
            return True
    except Exception:
        pass
    return False
