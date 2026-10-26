"""
datasets.py
-----------
API routes for dataset management: uploading, previewing, EDA, listing, search, and safe deletion.
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.dependencies.db import get_db
from app.core.exceptions import DatasetNotFoundError, DatasetValidationError
from app.schemas.schemas import (
    DatasetDetailResponse,
    DatasetListResponse,
    DatasetPreviewResponse,
    MessageResponse,
)
from app.services.dataset_service import DatasetService

router = APIRouter(prefix="/datasets", tags=["Datasets"])


@router.post(
    "/upload",
    response_model=DatasetDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and validate a new customer dataset CSV",
)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Accepts a multipart CSV upload. Validates shape, numeric columns, and missing values.
    Saves raw file safely and stores metadata in PostgreSQL / SQLite.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files (.csv) are accepted.",
        )

    content = await file.read()
    if not content or len(content.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    try:
        return DatasetService.upload_dataset(db, content, file.filename)
    except DatasetValidationError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Upload processing failed: {e}")


@router.post(
    "/demo",
    response_model=DatasetDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Load demo dataset for immediate exploration",
)
def load_demo(db: Session = Depends(get_db)):
    """Loads the Mall Customers demo dataset."""
    try:
        return DatasetService.load_demo_dataset(db)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to load demo dataset: {e}")


@router.get(
    "",
    response_model=DatasetListResponse,
    summary="List all uploaded datasets with pagination and search",
)
def list_datasets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return DatasetService.list_datasets(db, page=page, page_size=page_size, search=search)


@router.get(
    "/{dataset_id}",
    response_model=DatasetDetailResponse,
    summary="Get detailed metadata for a specific dataset",
)
def get_dataset(dataset_id: str, db: Session = Depends(get_db)):
    try:
        return DatasetService.get_dataset(db, dataset_id)
    except DatasetNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.get(
    "/{dataset_id}/preview",
    response_model=DatasetPreviewResponse,
    summary="Get preview, summary statistics, and missing value analysis",
)
def get_dataset_preview(dataset_id: str, db: Session = Depends(get_db)):
    try:
        return DatasetService.get_preview(db, dataset_id)
    except DatasetNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.get(
    "/{dataset_id}/eda",
    response_model=Dict[str, Any],
    summary="Compute exploratory data analysis (correlations, distributions, outliers)",
)
def get_dataset_eda(dataset_id: str, db: Session = Depends(get_db)):
    try:
        return DatasetService.get_eda(db, dataset_id)
    except DatasetNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.delete(
    "/{dataset_id}",
    response_model=MessageResponse,
    summary="Delete a dataset and all associated runs and artifacts",
)
def delete_dataset(dataset_id: str, db: Session = Depends(get_db)):
    try:
        DatasetService.delete_dataset(db, dataset_id)
        return MessageResponse(
            message=f"Dataset '{dataset_id}' and all associated runs were successfully deleted."
        )
    except DatasetNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
