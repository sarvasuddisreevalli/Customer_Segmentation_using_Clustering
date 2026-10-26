"""
db.py
-----
FastAPI dependency injection for database sessions.
"""

from app.core.database import get_db

__all__ = ["get_db"]
