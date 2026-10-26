# SegmentIQ – Phase 4 & Phase 5 Architecture & Codebase Audit

**Date:** 2026-10-26  
**Project:** SegmentIQ – Intelligent Customer Segmentation & Analytics Platform  
**Auditor:** Principal Full-Stack Engineer & Senior Architect  
**Objective:** Comprehensive audit of existing codebase before Phase 4 (Backend Architecture, Database Integration, API Improvements) and Phase 5 (Premium SaaS Frontend, Dashboard, and UX).

---

## 1. Executive Summary

SegmentIQ has established strong mathematical and ML foundations across Phases 1, 2, and 3:
- Full support for **K-Means**, **Hierarchical (Agglomerative)**, and **DBSCAN** clustering.
- Robust data preprocessing: missing value imputation, duplicate removal, feature scaling (`StandardScaler`, `MinMaxScaler`, `RobustScaler`), and PCA 2D projections.
- Segment profiling deriving human-readable business personas from real cluster statistics (not hardcoded).
- Formula injection protection for CSV export.
- 73+ passing unit and integration tests across ML pipelines and legacy API endpoints.

However, to transition from a development prototype to an institutional-grade SaaS platform, several architectural gaps must be addressed:
1. **Metadata Persistence:** Datasets and runs currently reside primarily in memory (`ml/session.py`), which means a server restart clears dataset references and run histories.
2. **Database Layer:** Need a structured SQLAlchemy 2.x persistence layer supporting PostgreSQL (production) and SQLite (local dev), tracking datasets, clustering runs, evaluation metrics, and segment profiles.
3. **API Organization:** Unify legacy Phase 1 routes (`/api/*`) and Phase 2/3 routes (`/api/v2/*`) into clean, restful, versioned endpoints (`/api/datasets`, `/api/clustering/runs`, `/api/analytics`).
4. **Artifact Storage:** Decouple customer CSV files and generated segmentation artifacts from ephemeral memory onto managed disk storage with directory-traversal prevention.
5. **Frontend Experience:** Modernize the Next.js/Tailwind frontend into a high-craft SaaS interface (Linear/Vercel/Stripe aesthetic) with a multi-step Segmentation Studio, Customer Explorer table, Analytics visualization suite, and comprehensive empty/loading states.

---

## 2. Component-by-Component Audit

### 2.1 Backend Architecture & API Routes

| Component | Status | Findings | Recommendations |
| :--- | :--- | :--- | :--- |
| `backend/app/main.py` | Working | Configures FastAPI app, CORS, registers `/api` and `/api/v2` routers. | Add centralized exception handlers, health checks (`/api/health`), and structured logging. |
| `backend/app/api/endpoints.py` | Legacy (Phase 1) | Works for demo customer dataset and legacy routes (`/api/cluster/*`). | Keep for backward compatibility; migrate active frontend consumers to unified routes. |
| `backend/app/api/v2_routes.py` | Working (Phase 2-3) | Implements `/api/v2/datasets/*` and `/api/v2/clustering/*`. | Good validation, but stores state in in-memory dicts. Needs database-backed service layer. |
| `backend/app/api/auth.py` | Partial / Experimental | Tied to MongoDB/PyMongo. Not aligned with prompt's PostgreSQL/SQLAlchemy architecture. | Maintain decoupled or optional single-user local mode as specified by project rules. |
| `backend/app/services/ml_service.py` | Legacy | Redundant with `app/ml/` suite. | Keep legacy endpoints intact, route new logic through `app/ml/` and database repositories. |

### 2.2 Machine Learning Modules (`backend/app/ml/`)

| Module | Status | Findings |
| :--- | :--- | :--- |
| `clusterer.py` | Excellent | True scikit-learn K-Means, AgglomerativeClustering, DBSCAN. Safe metric computations for edge cases (single cluster, all noise, small $N$). 2D PCA projection for cluster visualization. Elbow exploration data. |
| `preprocessor.py` | Excellent | Data validation, missing value imputation (median/mean/most_frequent), duplicate removal, scaling (standard/minmax/robust), outlier detection via IQR, detailed step-by-step audit reports. |
| `profiler.py` | Excellent | Profiles clusters against global population means. Identifies distinguishing features and assigns data-driven segment personas (e.g., High-Spending, Frequent Buyers, Budget-Conscious). |
| `session.py` | Prototype | In-memory thread-safe dictionary with LRU eviction. Does not persist across server restarts. Must be augmented with SQLite/PostgreSQL storage. |

### 2.3 Database & Storage Layer

- **Current state:** Files are read into pandas DataFrames and stored in an in-memory dictionary (`DatasetStore`).
- **Issues:**
  - Server restarts drop uploaded datasets and completed clustering results.
  - No transactional safety or relational integrity between datasets, runs, evaluation scores, and segment profiles.
- **Solution (Phase 4):**
  - Implement SQLAlchemy 2.x models: `Dataset`, `ClusteringRun`, `ModelEvaluation`, `SegmentProfile`.
  - Provide database migrations via Alembic.
  - Store actual raw and segmented CSVs on a secure filesystem path (`backend/data/storage/artifacts/`) with sanitised UUID filenames, storing metadata in the DB.

### 2.4 Frontend Architecture (`frontend/`)

- **Tech Stack:** Next.js 15, React 18, Tailwind CSS, Recharts, Lucide React, Framer Motion.
- **Current state:**
  - Dashboard and clustering pages exist from Phase 1, but feature sets need expansion.
  - Needs full integration with v2 API capabilities (multi-step Segmentation Studio wizard, real-time comparison tables, PCA scatter plots, Customer Explorer with search/sort/filter, detailed segment profile cards).
  - Needs unified TanStack Query / central API client for predictable cache invalidation and loading skeletons.
  - Empty states must be inspiring, guiding users to upload their first dataset or load the demo dataset.

---

## 3. Security, Reliability & Quality Audit

1. **Path Traversal / Filename Safety:** Currently filenames are sanitized, but raw storage paths must never be returned to the client or accepted directly. Use UUID references.
2. **Formula Injection (CSV Injection):** Sanitization implemented in `export_csv_with_clusters` prefixes `=`, `+`, `-`, `@` with a single quote `'`.
3. **CORS:** Currently permissive (`allow_origins=["*"]`). Phase 4 should allow configuration via `CORS_ORIGINS` environment variable.
4. **Data Privacy:** Local/single-user development mode documented; no authentication credentials hardcoded.
5. **Serialization:** All NumPy types (`np.bool_`, `np.int64`, `np.float64`, `np.ndarray`) must be sanitized to standard Python types before returning JSON responses.

---

## 4. Phase 4 & 5 Action Plan

- **Step 1: Database Architecture (Task 3 & Task 4):** SQLAlchemy 2.x models (`models/db_models.py`), database session manager (`core/database.py`), and repositories (`repositories/`).
- **Step 2: Service Layer & Run Management (Task 5 & Task 6):** `DatasetService` and `ClusteringService` implementing lifecycle states (`pending`, `running`, `completed`, `failed`).
- **Step 3: Unified REST APIs & Analytics (Task 7 & Task 8):** Build clean endpoints under `/api/datasets`, `/api/clustering/runs`, and `/api/analytics/overview`.
- **Step 4: Premium Frontend UI & Design System (Tasks 10–24):**
  - Application shell with polished Sidebar & TopNav.
  - Overview Dashboard with authentic KPI cards and charts.
  - Dataset Management with drag-and-drop CSV upload and data quality preview.
  - Segmentation Studio multi-step wizard.
  - Advanced Analytics with Recharts (PCA 2D scatter, cluster distribution, feature bar charts, metric comparisons).
  - Customer Explorer interactive table with filtering and CSV export.
  - Segment Profile interface with distinguishing features.
  - Settings page with theme and default preferences.
  - Professional empty and loading states.
- **Step 5: Testing, Quality Checks & Documentation (Tasks 25–30):** Full end-to-end verification, backend pytest suite, frontend build verification, and complete documentation in `docs/`.
