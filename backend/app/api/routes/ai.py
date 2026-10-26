"""
ai.py
-----
API endpoints for AI Customer Intelligence, Recommendations, Ask SegmentIQ Chat, and Reports.
All endpoints are strictly grounded in database evidence with zero hallucination.
"""

import os
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.ai.chat import answer_segmentiq_question
from app.ai.grounding import extract_grounded_evidence
from app.ai.insight_engine import generate_segment_insights
from app.ai.recommendations import generate_recommendations
from app.ai.report_generator import generate_executive_report
from app.api.dependencies.db import get_db
from app.core.exceptions import ClusteringRunNotFoundError
from app.repositories.clustering_repo import ClusteringRepository

router = APIRouter(prefix="/ai", tags=["AI Customer Intelligence"])


def _get_evidence(db: Session, run_id: Optional[str] = None) -> Dict[str, Any]:
    target_id = run_id
    if not target_id:
        latest = ClusteringRepository.get_latest_completed_run(db)
        if not latest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No completed clustering runs found to analyze.",
            )
        target_id = latest.id

    try:
        return extract_grounded_evidence(db, target_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/status")
def get_ai_status():
    """Returns AI provider configuration and readiness status."""
    has_gemini = bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))
    has_openai = bool(os.getenv("OPENAI_API_KEY"))
    provider = "Google Gemini" if has_gemini else ("OpenAI" if has_openai else "Deterministic Grounded Engine (Active)")

    return {
        "status": "ready",
        "configured_provider": provider,
        "has_external_key": has_gemini or has_openai,
        "mode": "hybrid_grounded",
        "privacy_policy": "No raw customer records or personal identifiers are transmitted to external AI services.",
    }


@router.post("/insights")
def post_insights(
    run_id: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
):
    """Generates evidence-backed AI segment insights for the specified or latest run."""
    evidence = _get_evidence(db, run_id)
    return generate_segment_insights(evidence)


@router.get("/insights/{run_id}")
def get_insights_by_run(run_id: str, db: Session = Depends(get_db)):
    evidence = _get_evidence(db, run_id)
    return generate_segment_insights(evidence)


@router.post("/recommendations")
def post_recommendations(
    run_id: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
):
    """Generates prioritized business recommendations (High/Medium/Low) with testable hypotheses."""
    evidence = _get_evidence(db, run_id)
    return generate_recommendations(evidence)


@router.get("/recommendations/{run_id}")
def get_recommendations_by_run(run_id: str, db: Session = Depends(get_db)):
    evidence = _get_evidence(db, run_id)
    return generate_recommendations(evidence)


@router.post("/chat")
def post_chat(
    question: str = Body(..., embed=True),
    run_id: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
):
    """Ask SegmentIQ: Natural-language conversational analytics using real clustering evidence."""
    if not question.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Question cannot be empty.")
    evidence = _get_evidence(db, run_id)
    return answer_segmentiq_question(question, evidence)


@router.post("/reports")
def post_report(
    run_id: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
):
    """Generates a complete executive analytics report in Markdown format."""
    evidence = _get_evidence(db, run_id)
    markdown_content = generate_executive_report(evidence)
    return {
        "run_id": evidence["run_id"],
        "dataset_name": evidence["dataset_name"],
        "report_markdown": markdown_content,
    }


@router.get("/reports/{run_id}")
def get_report_by_run(run_id: str, db: Session = Depends(get_db)):
    evidence = _get_evidence(db, run_id)
    markdown_content = generate_executive_report(evidence)
    return {
        "run_id": evidence["run_id"],
        "dataset_name": evidence["dataset_name"],
        "report_markdown": markdown_content,
    }
