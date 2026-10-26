"""
grounding.py
------------
Builds deterministic, structured evidence from database records.
Ensures zero hallucination by providing verified numerical metrics as context.
Raw customer PII (names, IDs, emails) are strictly excluded from AI context.
"""

import json
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.db_models import ClusteringRunModel, DatasetModel


def extract_grounded_evidence(db: Session, run_id: str) -> Dict[str, Any]:
    """Extracts strictly verified statistics and profiles for a clustering run."""
    run = db.query(ClusteringRunModel).filter(ClusteringRunModel.id == run_id).first()
    if not run:
        raise ValueError(f"Run '{run_id}' not found.")

    dataset = db.query(DatasetModel).filter(DatasetModel.id == run.dataset_id).first()
    dataset_name = dataset.original_filename if dataset else "Customer Dataset"
    total_customers = dataset.row_count if dataset else 0

    features = json.loads(run.selected_features) if run.selected_features else []
    params = json.loads(run.parameters) if run.parameters else {}

    # Evaluation
    eval_data = {}
    if run.evaluation:
        eval_data = {
            "silhouette_score": round(run.evaluation.silhouette_score, 4) if run.evaluation.silhouette_score else None,
            "davies_bouldin_index": round(run.evaluation.davies_bouldin_index, 4) if run.evaluation.davies_bouldin_index else None,
            "calinski_harabasz_index": round(run.evaluation.calinski_harabasz_index, 2) if run.evaluation.calinski_harabasz_index else None,
            "noise_percentage": round(run.evaluation.noise_percentage, 2),
            "metrics_valid": run.evaluation.metrics_valid,
        }

    # Segments
    segments = []
    for sp in run.segment_profiles:
        avg_f = json.loads(sp.average_features_json) if sp.average_features_json else {}
        dist = json.loads(sp.distinguishing_characteristics_json) if sp.distinguishing_characteristics_json else []
        segments.append({
            "cluster_label": sp.cluster_label,
            "segment_name": sp.segment_name,
            "customer_count": sp.customer_count,
            "percentage": sp.segment_percentage,
            "average_features": avg_f,
            "key_characteristics": dist,
            "marketing_strategy": sp.marketing_strategy,
            "marketing_campaign": sp.marketing_campaign,
            "business_goal": sp.business_goal,
        })

    # Find highest/lowest spenders if feature exists
    spend_feat = next((f for f in features if any(k in f.lower() for k in ["spend", "score", "amount", "revenue"])), None)
    income_feat = next((f for f in features if any(k in f.lower() for k in ["income", "salary", "wealth"])), None)

    highest_spend_seg = None
    if spend_feat and segments:
        valid_segs = [s for s in segments if s["cluster_label"] >= 0 and spend_feat in s["average_features"]]
        if valid_segs:
            highest_spend_seg = max(valid_segs, key=lambda s: s["average_features"][spend_feat])["segment_name"]

    return {
        "run_id": run.id,
        "dataset_name": dataset_name,
        "total_customers": total_customers,
        "algorithm": run.algorithm,
        "selected_features": features,
        "parameters": params,
        "n_clusters_found": run.n_clusters_found,
        "evaluation": eval_data,
        "segments": segments,
        "highest_spending_segment": highest_spend_seg,
        "spend_feature": spend_feat,
        "income_feature": income_feat,
    }
