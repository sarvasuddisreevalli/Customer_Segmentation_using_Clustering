import os
import sys
from contextlib import asynccontextmanager

# Ensure backend root directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.core.config import settings
from app.core.database import init_db
from app.core.exceptions import (
    ClusteringExecutionError,
    ClusteringRunNotFoundError,
    DatasetNotFoundError,
    DatasetValidationError,
    FileSecurityError,
    SegmentIQException,
)
from app.core.logging import logger

# Modern routers
from app.api.routes.health import router as health_router
from app.api.routes.datasets import router as datasets_router
from app.api.routes.clustering import router as clustering_router
from app.api.routes.analytics import router as analytics_router

# Backward compatibility routers
from app.api.endpoints import router as legacy_api_router
from app.api.v2_routes import router as v2_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables
    logger.info("Initializing database schema...")
    init_db()
    logger.info("Database initialized successfully.")
    yield
    logger.info("Shutting down SegmentIQ backend...")


app = FastAPI(
    title="SegmentIQ – Intelligent Customer Segmentation & Analytics Engine",
    description=(
        "Production-grade REST API for customer segmentation, clustering analytics, "
        "model evaluation, and segment profiling powered by scikit-learn and SQLAlchemy."
    ),
    version="2.1.0",
    lifespan=lifespan,
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.ENVIRONMENT == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Centralized Exception Handlers
@app.exception_handler(DatasetNotFoundError)
async def dataset_not_found_handler(request: Request, exc: DatasetNotFoundError):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"error": "DatasetNotFound", "message": exc.message, "details": exc.details},
    )

@app.exception_handler(ClusteringRunNotFoundError)
async def run_not_found_handler(request: Request, exc: ClusteringRunNotFoundError):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"error": "ClusteringRunNotFound", "message": exc.message, "details": exc.details},
    )

@app.exception_handler(DatasetValidationError)
async def dataset_validation_handler(request: Request, exc: DatasetValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": "ValidationError", "message": exc.message, "details": exc.details},
    )

@app.exception_handler(ClusteringExecutionError)
async def clustering_execution_handler(request: Request, exc: ClusteringExecutionError):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "ClusteringError", "message": exc.message, "details": exc.details},
    )

@app.exception_handler(FileSecurityError)
async def file_security_handler(request: Request, exc: FileSecurityError):
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"error": "SecurityViolation", "message": exc.message, "details": exc.details},
    )

# Modern Phase 4/5/6/7 API routes
from app.api.routes.ai import router as ai_router

app.include_router(health_router, prefix="/api")
app.include_router(datasets_router, prefix="/api")
app.include_router(clustering_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(ai_router, prefix="/api")

# Backward-compatibility routes
app.include_router(legacy_api_router, prefix="/api")
app.include_router(v2_router, prefix="/api")

@app.get("/")
def root():
    return {
        "title": "SegmentIQ Backend API",
        "version": "2.1.0",
        "status": "online",
        "docs": "/docs",
        "endpoints": {
            "health": "/api/health",
            "datasets": "/api/datasets",
            "clustering_runs": "/api/clustering/runs",
            "analytics": "/api/analytics/overview",
            "legacy_phase1": "/api/*",
            "v2_routes": "/api/v2/*",
        },
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True, app_dir=backend_dir)
