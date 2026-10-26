"""
config.py
---------
Application configuration and environment management for SegmentIQ.
Uses pydantic-settings or pydantic to load environment variables safely.
"""

import os
from pathlib import Path
from typing import List

# Base directory for the backend
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Default storage directory
DEFAULT_STORAGE_DIR = BASE_DIR / "data" / "storage"
DEFAULT_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
(DEFAULT_STORAGE_DIR / "datasets").mkdir(exist_ok=True)
(DEFAULT_STORAGE_DIR / "artifacts").mkdir(exist_ok=True)

class Settings:
    PROJECT_NAME: str = "SegmentIQ – Intelligent Customer Segmentation"
    VERSION: str = "2.1.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database Configuration (PostgreSQL supported; SQLite default for local dev)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR / 'data' / 'segmentiq.db'}"
    )
    
    # Storage Configuration
    STORAGE_PATH: Path = Path(os.getenv("STORAGE_PATH", str(DEFAULT_STORAGE_DIR)))
    DATASET_STORAGE_PATH: Path = STORAGE_PATH / "datasets"
    ARTIFACT_STORAGE_PATH: Path = STORAGE_PATH / "artifacts"
    
    # File limits & constraints
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "25"))
    MAX_ROWS_ALLOWED: int = int(os.getenv("MAX_ROWS_ALLOWED", "100000"))
    MAX_COLS_ALLOWED: int = int(os.getenv("MAX_COLS_ALLOWED", "50"))
    
    # Security & CORS
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
        if origin.strip()
    ]
    
    # Demo dataset path
    DEMO_DATASET_PATH: Path = BASE_DIR.parent / "data" / "Mall_Customers.csv"


settings = Settings()
