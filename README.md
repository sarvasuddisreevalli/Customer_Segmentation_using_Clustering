# SegmentIQ – Intelligent Customer Segmentation & Analytics Platform

[![Full Test Suite](https://img.shields.io/badge/pytest-95%2F95%20passed-emerald)](backend/tests/)
[![TypeScript](https://img.shields.io/badge/typescript-zero%20errors-blue)](frontend/)
[![Next.js](https://img.shields.io/badge/next.js-15.5-black)](frontend/)
[![FastAPI](https://img.shields.io/badge/fastapi-0.110-teal)](backend/)
[![License](https://img.shields.io/badge/license-MIT-purple.svg)](LICENSE)

**SegmentIQ** is an enterprise-grade, portfolio-ready full-stack Machine Learning and AI platform designed to transform customer behavioral datasets into clear, explainable, and actionable customer segments.

Built using **FastAPI (Python 3.11+/3.14)**, **SQLAlchemy 2.x**, **Scikit-Learn**, and **Next.js 15 (React 18 + TypeScript + Tailwind CSS)**, SegmentIQ implements a complete ML lifecycle alongside a zero-hallucination AI intelligence engine.

---

## 🌟 Key Architecture & Capabilities

```
Uploaded Customer Dataset (.csv)
              │
              ▼
Data Cleaning & Feature Engineering
(Duplicate removal, median/mean imputation, StandardScaler / MinMaxScaler / RobustScaler)
              │
              ▼
Clustering Engine (Partitioning, Density, Hierarchical)
├── K-Means (Elbow Curve & Silhouette Optimization)
├── Agglomerative Hierarchical Clustering (Ward, Complete, Average Linkage)
└── DBSCAN (Density-based radius & core-point detection)
              │
              ▼
Validation & Reproducible Persistence
(SQLAlchemy 2.x ORM with SQLite / PostgreSQL, Model Artifacts & Assignments)
              │
              ▼
Advanced Visual Analytics & Explanations
├── 2D PCA Spatial Maps with Explained Variance
├── Pearson Feature Correlation Matrix
├── Multi-Segment Attribute Comparison Tables & Radar Distributions
└── Customer Explorer with Instant Filtering & CSV Formula Injection Sanitization
              │
              ▼
AI-Powered Customer Intelligence & Conversational Analytics
├── Zero-Hallucination Evidence Extraction (No Raw Customer Data or PII sent to LLM)
├── Grounded Segment Personas & Behavioral Profiles
├── Prioritized Marketing Recommendations (Business Hypotheses & Target KPIs)
├── "Ask SegmentIQ" Conversational Analytics Chat
└── Downloadable Executive Markdown & CSV Reports
```

---

## ✨ Features by Phase

### 📊 Phases 1–3: Core Machine Learning Engine
- **Preprocessing Pipeline**: Outlier detection, missing value strategies (`median`, `mean`, `drop`), duplicate mitigation, and normalization (`StandardScaler`, `MinMaxScaler`, `RobustScaler`).
- **Clustering Algorithms**: K-Means clustering, Agglomerative Hierarchical clustering, and DBSCAN with density-based noise (`-1`) point identification.
- **Model Evaluation**: Cohesion and separation metrics calculated deterministically via Silhouette Score, Davies-Bouldin Index, and Calinski-Harabasz Index.
- **Segment Profiling**: Cluster statistics with distinguishing numerical traits, customer counts, and population percentages.

### 🗄️ Phase 4: Database Persistence & REST APIs
- **SQLAlchemy 2.x ORM**: Fully typed models (`DatasetModel`, `ClusteringRunModel`, `ModelEvaluationModel`, `SegmentProfileModel`, `ArtifactModel`).
- **Dataset Lifecycle**: Upload, preview, validation, search, paginated listing, and cascade deletion.
- **Run Reproducibility**: Persistent clustering history retaining parameters, metrics, and customer-cluster assignments.
- **Customer Explorer**: Server-side pagination, search by customer attributes, and cluster filtering.

### 💻 Phase 5: Modern SaaS Frontend
- **Design System**: Responsive dark SaaS interface with glassmorphism, consistent typography, cards, badges, and empty/loading states.
- **Segmentation Studio**: 5-step wizard guiding users through dataset selection, feature configuration, hyperparameter tuning, and execution.
- **Navigation Shell**: Side navigation and top bar displaying real-time FastAPI service health.

### 📈 Phase 6: Advanced Analytics & Interactive Visualizations
- **2D PCA Projection**: Interactive scatter plot with cluster coloring, noise highlighting, and explained variance percentages.
- **Correlation Heatmap**: Pearson correlation analysis across numerical attributes with identity column exclusion.
- **Segment Comparison**: Multi-group comparison tables and relative percentage differences against dataset baselines.

### 🧠 Phase 7: AI Customer Intelligence & Conversational Analytics
- **Zero-Hallucination Grounding Engine**: Deterministic extraction of numerical evidence with zero PII exposure.
- **Ask SegmentIQ**: Natural language business analyst interface answering questions using calculated metrics.
- **Prioritized Business Hypotheses**: Recommendations structured as testable hypotheses with defined success KPIs.
- **Executive Reports**: Formatted Markdown reports ready for download and executive review.
- **Deterministic Fallback**: Flawless platform execution even without external LLM credentials configured.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 18/19, TypeScript, Tailwind CSS, Recharts, Lucide React, clsx |
| **Backend Core** | FastAPI 0.110+, Uvicorn, Python 3.11+ / 3.14, Pydantic v2 |
| **Data & ML** | Scikit-Learn, Pandas, NumPy, SciPy, Joblib |
| **Database** | SQLAlchemy 2.x (SQLite for local development, PostgreSQL compatible) |
| **Testing** | Pytest, AnyIO, Pytest-AsyncIO (95 unit and integration tests passing) |
| **Deployment** | Vercel (Frontend), Render / Railway (Backend) |

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+ (Python 3.14 compatible)
- Git

### 1. Clone & Set Up Backend

```bash
git clone https://github.com/sarvasuddisreevalli/Customer_Segmentation_using_Clustering.git
cd Customer_Segmentation_using_Clustering/backend

# Create virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The FastAPI backend will start at `http://localhost:8000`.  
Explore interactive API documentation at `http://localhost:8000/docs`.

### 2. Set Up Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🧪 Automated Testing

Run the full backend test suite:

```bash
cd backend
pytest -v
```

**Results:**
- `test_ml_pipeline.py`: 63/63 passed
- `test_phase4_backend.py`: 14/14 passed
- `test_phase6_7.py`: 8/8 passed
- `test_api.py`: 10/10 passed
- **Total:** 95/95 passed (100%)

Run frontend TypeScript verification:

```bash
cd frontend
npx tsc --noEmit
npm run build
```

---

## 🔒 Security & Privacy

1. **Zero Customer PII Exposure:** Raw datasets and customer identifiers are never shared with external APIs.
2. **Formula Injection Sanitization:** Exported CSV files sanitize special formula characters (`=`, `@`, `+`, `-`).
3. **Path Traversal Prevention:** Filesystem operations use UUID-based internal keys restricted to validated directories.
4. **Resilient AI Fallback:** System functions without external LLM keys using deterministic rule-based algorithms.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
