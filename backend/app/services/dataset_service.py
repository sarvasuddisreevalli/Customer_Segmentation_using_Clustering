"""
dataset_service.py
------------------
Service layer encapsulating dataset management, validation, preview generation,
EDA computations, storage operations, and safe deletion policies.
"""

import io
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import (
    DatasetNotFoundError,
    DatasetValidationError,
    FileSecurityError,
)
from app.models.db_models import DatasetModel, ArtifactModel
from app.repositories.dataset_repo import DatasetRepository
from app.schemas.schemas import (
    DatasetDetailResponse,
    DatasetListItem,
    DatasetListResponse,
    DatasetPreviewResponse,
    NumericStat,
)
from app.utils.storage import (
    delete_file_safely,
    load_dataset_dataframe,
    save_uploaded_file,
)
from app.ml import preprocessor as pre


class DatasetService:

    @classmethod
    def upload_dataset(
        cls, db: Session, file_bytes: bytes, original_filename: str
    ) -> DatasetDetailResponse:
        """Validates and stores an uploaded CSV file, recording metadata in the database."""
        # 1. Size constraint check
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(file_bytes) > max_bytes:
            raise DatasetValidationError(
                f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )

        # 2. Parse CSV
        try:
            df = pd.read_csv(io.BytesIO(file_bytes))
        except Exception as e:
            raise DatasetValidationError(f"Could not parse CSV file: {e}")

        # 3. Validate contents using ML preprocessor validation
        validation = pre.validate_dataset(df, filename=original_filename)
        if not validation["valid"]:
            error_msg = "; ".join(validation["errors"])
            raise DatasetValidationError(f"Dataset validation failed: {error_msg}")

        # 4. Save to safe storage path
        file_id, storage_path, file_size = save_uploaded_file(file_bytes, original_filename)

        # 5. Build metadata records
        col_types = validation.get("col_types", {})
        columns_data = {
            "columns": list(df.columns),
            "column_types": col_types,
        }

        dataset = DatasetModel(
            id=file_id,
            original_filename=original_filename,
            storage_path=storage_path,
            file_size_bytes=file_size,
            row_count=len(df),
            column_count=len(df.columns),
            columns_json=json.dumps(columns_data),
            validation_status="valid",
            processing_status="raw",
        )
        saved = DatasetRepository.create(db, dataset)

        return cls._to_detail_response(saved, df)

    @classmethod
    def get_dataset(cls, db: Session, dataset_id: str) -> DatasetDetailResponse:
        dataset = DatasetRepository.get_by_id(db, dataset_id)
        if not dataset:
            raise DatasetNotFoundError(f"Dataset with ID '{dataset_id}' not found.")
        df = load_dataset_dataframe(dataset.storage_path)
        return cls._to_detail_response(dataset, df)

    @classmethod
    def get_preview(cls, db: Session, dataset_id: str) -> DatasetPreviewResponse:
        dataset = DatasetRepository.get_by_id(db, dataset_id)
        if not dataset:
            raise DatasetNotFoundError(f"Dataset with ID '{dataset_id}' not found.")
        df = load_dataset_dataframe(dataset.storage_path)
        preview_data = pre.build_preview(df)

        numeric_stats = [
            NumericStat(
                column=s["column"],
                count=s["count"],
                mean=s["mean"],
                median=s["median"],
                std=s["std"],
                min=s["min"],
                max=s["max"],
                q25=s.get("q25", 0.0),
                q75=s.get("q75", 0.0),
                skewness=s.get("skewness", 0.0),
                n_outliers=s.get("n_outliers", 0),
                pct_outliers=s.get("pct_outliers", 0.0),
            )
            for s in preview_data.get("numeric_stats", [])
        ]

        return DatasetPreviewResponse(
            dataset_id=dataset.id,
            filename=dataset.original_filename,
            total_rows=preview_data.get("n_rows", len(df)),
            total_columns=preview_data.get("n_cols", len(df.columns)),
            columns=preview_data.get("columns", list(df.columns)),
            column_types={
                "numeric": preview_data.get("numeric_columns", []),
                "categorical": preview_data.get("categorical_columns", []),
            },
            missing_counts=preview_data.get("missing_per_col", {}),
            dtypes=preview_data.get("dtypes", {}),
            head=preview_data.get("sample_records", []),
            numeric_stats=numeric_stats,
        )

    @classmethod
    def get_eda(cls, db: Session, dataset_id: str) -> Dict[str, Any]:
        dataset = DatasetRepository.get_by_id(db, dataset_id)
        if not dataset:
            raise DatasetNotFoundError(f"Dataset with ID '{dataset_id}' not found.")
        df = load_dataset_dataframe(dataset.storage_path)
        return pre.compute_eda(df)

    @classmethod
    def list_datasets(
        cls, db: Session, page: int = 1, page_size: int = 20, search: Optional[str] = None
    ) -> DatasetListResponse:
        skip = max(0, (page - 1) * page_size)
        items, total = DatasetRepository.list_datasets(db, skip=skip, limit=page_size, search=search)

        datasets = [
            DatasetListItem(
                id=d.id,
                original_filename=d.original_filename,
                file_size_bytes=d.file_size_bytes,
                row_count=d.row_count,
                column_count=d.column_count,
                validation_status=d.validation_status,
                processing_status=d.processing_status,
                created_at=d.created_at,
                updated_at=d.updated_at,
            )
            for d in items
        ]

        return DatasetListResponse(
            total=total,
            page=page,
            page_size=page_size,
            datasets=datasets,
        )

    @classmethod
    def delete_dataset(cls, db: Session, dataset_id: str) -> bool:
        dataset = DatasetRepository.get_by_id(db, dataset_id)
        if not dataset:
            raise DatasetNotFoundError(f"Dataset with ID '{dataset_id}' not found.")

        # Collect file paths for raw data and any generated artifacts
        files_to_delete = [dataset.storage_path]
        for run in dataset.runs:
            for art in run.artifacts:
                files_to_delete.append(art.file_path)

        # Database cascade delete removes dataset, runs, evaluations, segment profiles, and artifacts
        success = DatasetRepository.delete(db, dataset_id)

        # Clean up files from disk
        if success:
            for file_path in files_to_delete:
                delete_file_safely(file_path)

        return success

    @classmethod
    def load_demo_dataset(cls, db: Session) -> DatasetDetailResponse:
        """Loads the standard Mall_Customers.csv demo dataset if available, or creates a demo dataset."""
        demo_path = settings.DEMO_DATASET_PATH
        if demo_path.is_file():
            with open(demo_path, "rb") as f:
                content = f.read()
            return cls.upload_dataset(db, content, "Mall_Customers.csv")
        
        # Synthetic fallback
        from tests.test_ml_pipeline import _make_numeric_df
        synthetic_df = _make_numeric_df(200)
        csv_bytes = synthetic_df.to_csv(index=False).encode("utf-8")
        return cls.upload_dataset(db, csv_bytes, "demo_customers.csv")

    @classmethod
    def _to_detail_response(cls, dataset: DatasetModel, df: pd.DataFrame) -> DatasetDetailResponse:
        try:
            col_data = json.loads(dataset.columns_json)
            cols = col_data.get("columns", list(df.columns))
            types = col_data.get("column_types", {})
        except Exception:
            cols = list(df.columns)
            types = {}

        return DatasetDetailResponse(
            id=dataset.id,
            original_filename=dataset.original_filename,
            file_size_bytes=dataset.file_size_bytes,
            row_count=dataset.row_count,
            column_count=dataset.column_count,
            columns=cols,
            column_types=types,
            validation_status=dataset.validation_status,
            processing_status=dataset.processing_status,
            created_at=dataset.created_at,
            updated_at=dataset.updated_at,
        )
