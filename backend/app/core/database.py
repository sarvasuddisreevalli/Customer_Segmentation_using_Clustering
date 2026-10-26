"""
database.py
-----------
SQLAlchemy 2.x database configuration, engine creation, and session management.
Supports PostgreSQL and SQLite out of the box with zero code changes.
"""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

# Configure connection args (e.g. check_same_thread for SQLite)
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

# SQLAlchemy 2.x Engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=False,
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)

# Declarative Base
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining a SQLAlchemy session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables. Creates all tables defined in Base metadata."""
    # Ensure all models are registered with Base.metadata before creating
    import app.models.db_models  # noqa: F401
    Base.metadata.create_all(bind=engine)
