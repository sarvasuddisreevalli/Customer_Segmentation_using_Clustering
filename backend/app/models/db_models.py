"""
db_models.py
------------
SQLAlchemy 2.x declarative models representing persistent application metadata.
All large raw customer data remains stored on disk/artifact storage;
only metadata, parameters, evaluations, and segment profiles reside in the database.
"""

import datetime
import uuid
from typing import List, Optional
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class DatasetModel(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    original_filename = Column(String(255), nullable=False)
    storage_path = Column(String(512), nullable=False)
    file_size_bytes = Column(Integer, nullable=False, default=0)
    row_count = Column(Integer, nullable=False, default=0)
    column_count = Column(Integer, nullable=False, default=0)
    columns_json = Column(Text, nullable=False, default="[]")  # JSON encoded list/dict
    validation_status = Column(String(50), nullable=False, default="valid")
    processing_status = Column(String(50), nullable=False, default="raw")
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships
    runs = relationship("ClusteringRunModel", back_populates="dataset", cascade="all, delete-orphan")
    artifacts = relationship("ArtifactModel", back_populates="dataset", cascade="all, delete-orphan")


class ClusteringRunModel(Base):
    __tablename__ = "clustering_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dataset_id = Column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    algorithm = Column(String(50), nullable=False)  # "kmeans", "hierarchical", "dbscan"
    selected_features = Column(Text, nullable=False, default="[]")  # JSON list
    parameters = Column(Text, nullable=False, default="{}")  # JSON dict
    preprocessing_config = Column(Text, nullable=False, default="{}")  # JSON dict
    status = Column(String(50), nullable=False, default="pending")  # "pending", "running", "completed", "failed"
    error_message = Column(Text, nullable=True)
    n_clusters_found = Column(Integer, nullable=False, default=0)
    noise_count = Column(Integer, nullable=False, default=0)
    processing_duration_seconds = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    dataset = relationship("DatasetModel", back_populates="runs")
    evaluation = relationship("ModelEvaluationModel", back_populates="run", uselist=False, cascade="all, delete-orphan")
    segment_profiles = relationship("SegmentProfileModel", back_populates="run", cascade="all, delete-orphan")
    artifacts = relationship("ArtifactModel", back_populates="run", cascade="all, delete-orphan")


class ModelEvaluationModel(Base):
    __tablename__ = "model_evaluations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("clustering_runs.id", ondelete="CASCADE"), nullable=False, unique=True)
    silhouette_score = Column(Float, nullable=True)
    davies_bouldin_index = Column(Float, nullable=True)
    calinski_harabasz_index = Column(Float, nullable=True)
    noise_percentage = Column(Float, nullable=False, default=0.0)
    metrics_valid = Column(Boolean, nullable=False, default=True)
    evaluation_warnings = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationship
    run = relationship("ClusteringRunModel", back_populates="evaluation")


class SegmentProfileModel(Base):
    __tablename__ = "segment_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("clustering_runs.id", ondelete="CASCADE"), nullable=False)
    cluster_label = Column(Integer, nullable=False)
    segment_name = Column(String(100), nullable=False)
    customer_count = Column(Integer, nullable=False, default=0)
    segment_percentage = Column(Float, nullable=False, default=0.0)
    average_features_json = Column(Text, nullable=False, default="{}")
    distinguishing_characteristics_json = Column(Text, nullable=False, default="[]")
    description = Column(Text, nullable=False, default="")
    marketing_strategy = Column(Text, nullable=True)
    marketing_campaign = Column(Text, nullable=True)
    business_goal = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationship
    run = relationship("ClusteringRunModel", back_populates="segment_profiles")


class ArtifactModel(Base):
    __tablename__ = "artifacts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("clustering_runs.id", ondelete="CASCADE"), nullable=True)
    dataset_id = Column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=True)
    artifact_type = Column(String(50), nullable=False)  # "segmentation_csv", "visualization_data", etc.
    file_path = Column(String(512), nullable=False)
    file_size_bytes = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships
    run = relationship("ClusteringRunModel", back_populates="artifacts")
    dataset = relationship("DatasetModel", back_populates="artifacts")
