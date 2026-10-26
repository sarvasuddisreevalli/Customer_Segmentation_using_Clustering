"""
clustering_repo.py
------------------
Repository pattern for ClusteringRunModel, ModelEvaluation, SegmentProfile, and Artifact entities.
"""

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.db_models import (
    ClusteringRunModel,
    ModelEvaluationModel,
    SegmentProfileModel,
    ArtifactModel,
)


class ClusteringRepository:

    @staticmethod
    def get_run_by_id(db: Session, run_id: str) -> Optional[ClusteringRunModel]:
        return db.query(ClusteringRunModel).filter(ClusteringRunModel.id == run_id).first()

    @staticmethod
    def list_runs(
        db: Session,
        dataset_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[ClusteringRunModel], int]:
        query = db.query(ClusteringRunModel)
        if dataset_id:
            query = query.filter(ClusteringRunModel.dataset_id == dataset_id)
        
        total = query.count()
        runs = query.order_by(ClusteringRunModel.created_at.desc()).offset(skip).limit(limit).all()
        return runs, total

    @staticmethod
    def create_run(db: Session, run: ClusteringRunModel) -> ClusteringRunModel:
        db.add(run)
        db.commit()
        db.refresh(run)
        return run

    @staticmethod
    def save_evaluation(db: Session, eval_model: ModelEvaluationModel) -> ModelEvaluationModel:
        db.add(eval_model)
        db.commit()
        db.refresh(eval_model)
        return eval_model

    @staticmethod
    def save_segment_profiles(db: Session, profiles: List[SegmentProfileModel]) -> List[SegmentProfileModel]:
        db.add_all(profiles)
        db.commit()
        return profiles

    @staticmethod
    def save_artifact(db: Session, artifact: ArtifactModel) -> ArtifactModel:
        db.add(artifact)
        db.commit()
        db.refresh(artifact)
        return artifact

    @staticmethod
    def get_latest_completed_run(db: Session) -> Optional[ClusteringRunModel]:
        return (
            db.query(ClusteringRunModel)
            .filter(ClusteringRunModel.status == "completed")
            .order_by(ClusteringRunModel.created_at.desc())
            .first()
        )

    @staticmethod
    def get_runs_count(db: Session) -> dict:
        total = db.query(ClusteringRunModel).count()
        completed = db.query(ClusteringRunModel).filter(ClusteringRunModel.status == "completed").count()
        failed = db.query(ClusteringRunModel).filter(ClusteringRunModel.status == "failed").count()
        return {"total": total, "completed": completed, "failed": failed}

    @staticmethod
    def get_artifact_by_run_and_type(db: Session, run_id: str, artifact_type: str) -> Optional[ArtifactModel]:
        return (
            db.query(ArtifactModel)
            .filter(ArtifactModel.run_id == run_id, ArtifactModel.artifact_type == artifact_type)
            .order_by(ArtifactModel.created_at.desc())
            .first()
        )
