"""
health.py
---------
Health and diagnostics endpoint.
"""

import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.core.database import get_db
from app.schemas.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """Check application health and database connectivity."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {e}"

    return HealthResponse(
        status="online" if "unhealthy" not in db_status else "degraded",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database=db_status,
        timestamp=datetime.datetime.now(datetime.timezone.utc),
    )
