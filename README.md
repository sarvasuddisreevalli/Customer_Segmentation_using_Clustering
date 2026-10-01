# SEGMENTIQ: Intelligent Customer Segmentation & Analytics

SegmentIQ is a premium, full-stack Machine Learning SaaS analytics application designed to transform raw customer behavior data into clear, actionable customer segments using advanced clustering algorithms (K-Means, Agglomerative Hierarchical Clustering, DBSCAN) and interactive visual analytics.

---

## 🌟 Product Vision & Flow

SegmentIQ bridges the gap between complex ML statistical results and non-technical business decision-makers:

```
Customer Dataset
      ↓
Upload & Preprocessing
      ↓
Data Validation & Scaling (StandardScaler)
      ↓
Exploratory Data Analysis (EDA)
      ↓
Clustering Execution (K-Means / Hierarchical / DBSCAN)
      ↓
Model Comparison & Evaluation (Silhouette, Davies-Bouldin, Calinski-Harabasz)
      ↓
Dynamic Persona Profiling
      ↓
Executive Insights & Marketing Strategy Recommendations
      ↓
CSV / JSON Export
```

---

## ✨ Features

- **Landing Page**: SaaS visual experience with floating cluster node animations, trusted tech strip, 4-step workflow, algorithm overview cards, business value ROI stats, and responsive drawer navigation.
- **Executive Overview Dashboard**: Real-time KPI cards (Total Customers, Segments Found, Recommended Algorithm, Silhouette Score, Avg Income, Avg Spending), interactive segment map, segment proportion donut chart, and automated executive takeaways.
- **Dataset Upload & Quality Audit**: Drag-and-drop CSV upload, "Try Demo Dataset" toggle, validation pipeline state indicator, missing value auto-imputation, and duplicate row detection.
- **Exploratory Data Analysis (EDA)**: Statistical summaries (Mean, Median, Min, Max, Std Dev), binned histogram distribution charts, feature correlation heatmap matrix, and searchable raw data table sample.
- **ML Clustering Laboratory**:
  - **K-Means**: Slider for cluster count $K \in [2, 10]$, Elbow curve plot (Inertia vs K), and Silhouette Score plot.
  - **Hierarchical Clustering**: Agglomerative linkage selector (Ward, Complete, Average, Single) and dendrogram linkage tree metadata.
  - **DBSCAN**: Interactive $\epsilon$ radius and `min_samples` sliders with density-based noise point (-1) classification.
- **Algorithmic Model Comparison**: Side-by-side comparison table evaluating Silhouette Score, Davies-Bouldin Index, and Calinski-Harabasz metrics across algorithms with automated winner badge and metric-driven explanation.
- **Discovered Customer Segments**: Dynamic persona cards (e.g. *High-Value Champions*, *Budget-Conscious Savers*, *High-Earner Savers*, *Young Trendsetters*, *At-Risk Customers*), interactive Income vs Spending scatter plot with tooltips and cluster filters, and 2D PCA spatial map.
- **Executive Business Insights**: Auto-computed highest value driver, largest market share group, highest spenders, and at-risk win-back priority with tailored marketing strategies, suggested campaigns, and primary business goals per segment.
- **Export Data**: Download full customer CSV tagged with `Cluster_ID` and `Segment_Name` alongside summary executive report JSON exports.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, React 19, Tailwind CSS, Recharts, Framer Motion, Lucide React.
- **Backend**: Python 3.13, FastAPI, Uvicorn, Pandas, NumPy, Scikit-Learn, SciPy, Pydantic v2.
- **Data & Storage**: Synthetic realistic customer dataset (`demo_customers.csv`), stateless session processing.
- **Containerization & Deployment**: Docker, Docker Compose, Vercel (Frontend), Render (Backend).

---

## 📁 Monorepo Project Structure

```
segmentiq/
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Landing Page
│   │   └── dashboard/                # Analytics Dashboard
│   │       ├── layout.tsx
│   │       ├── page.tsx              # Overview
│   │       ├── upload/page.tsx       # CSV Upload & Quality
│   │       ├── analysis/page.tsx     # EDA & Feature Analysis
│   │       ├── clustering/page.tsx   # ML Laboratory
│   │       ├── comparison/page.tsx   # Model Comparison
│   │       ├── segments/page.tsx     # Customer Segments
│   │       ├── insights/page.tsx     # Executive Strategy
│   │       ├── export/page.tsx       # Data Export
│   │       └── about/page.tsx        # Technical Methodology
│   ├── components/
│   │   ├── ui/                       # Buttons, Cards, Overlays
│   │   ├── landing/                  # Hero Visual Canvas
│   │   ├── dashboard/                # Sidebar, Header, Mobile Nav
│   │   └── charts/                   # Recharts Visualizations
│   ├── hooks/
│   │   └── useSegmentIQ.tsx          # Global State & API Context
│   ├── lib/
│   │   ├── api.ts                    # REST API Client
│   │   └── utils.ts                  # Color palettes & formatters
│   ├── types/
│   │   └── index.ts                  # TypeScript Interfaces
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── Dockerfile
│
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI Application Entry
│   │   ├── api/
│   │   │   └── endpoints.py          # REST Endpoints
│   │   ├── services/
│   │   │   └── ml_service.py         # ML Pipeline & Dynamic Profiling
│   │   ├── models/
│   │   │   └── schemas.py            # Pydantic Schemas
│   │   └── utils/
│   │       └── dataset_generator.py  # Synthetic Dataset Generator
│   ├── tests/
│   │   └── test_api.py               # Pytest Backend Unit Tests
│   ├── data/
│   │   └── demo_customers.csv
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── data/
│   └── demo_customers.csv
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

## 🚀 Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- npm 10+

### 1. Clone & Setup Backend
```bash
cd backend
pip install -r requirements.txt
python app/utils/dataset_generator.py
python -m uvicorn app.main:app --reload --port 8000
```
Backend API will be live at `http://localhost:8000` (Interactive docs at `http://localhost:8000/docs`).

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend web application will be live at `http://localhost:3000`.

---

## 🐳 Docker Setup

Run the full stack with a single command:
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

---

## 🌐 Production Deployment Guide

### Deploy Backend to Render
1. Create a new **Web Service** on [Render](https://render.com/).
2. Select your repository and set Root Directory to `backend`.
3. Set Build Command: `pip install -r requirements.txt`
4. Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variable:
   - `CORS_ORIGINS`: `https://your-segmentiq-frontend.vercel.app`

### Deploy Frontend to Vercel
1. Import your repository into [Vercel](https://vercel.com/).
2. Set Root Directory to `frontend`.
3. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://your-segmentiq-backend.onrender.com`
4. Click **Deploy**.

---

## 🧪 Testing

### Run Backend Pytest Suite
```bash
cd backend
python -m pytest tests/test_api.py
```

### Run Frontend Build Check
```bash
cd frontend
npm run build
```

---

## 🔮 Future Architecture Roadmap

- **Multi-Tenant Authentication**: NextAuth.js / Supabase Auth integration.
- **Persistent Data Store**: PostgreSQL / Supabase for historical segmentation snapshots.
- **Predictive ML**: Customer Lifetime Value (CLV) regression models and Churn Prediction.
- **CRM Integration**: Direct sync with HubSpot and Salesforce.
