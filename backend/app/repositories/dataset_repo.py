"""
dataset_repo.py
---------------
Repository pattern for DatasetModel entity operations.
Encapsulates database queries, search filtering, and pagination.
"""

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.db_models import DatasetModel


class DatasetRepository:

    @staticmethod
    def get_by_id(db: Session, dataset_id: str) -> Optional[DatasetModel]:
        return db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()

    @staticmethod
    def list_datasets(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
    ) -> Tuple[List[DatasetModel], int]:
        query = db.query(DatasetModel)
        if search:
            query = query.filter(DatasetModel.original_filename.ilike(f"%{search.strip()}%"))
        
        total = query.count()
        items = query.order_by(DatasetModel.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def create(db: Session, dataset: DatasetModel) -> DatasetModel:
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        return dataset

    @staticmethod
    def delete(db: Session, dataset_id: str) -> bool:
        record = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
        if not record:
            return False
        db.delete(record)
        db.commit()
        return True
