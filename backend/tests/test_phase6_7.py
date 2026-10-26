"""
test_phase6_7.py
----------------
Automated unit & integration tests for Phase 6 (Advanced Analytics & Correlations)
and Phase 7 (AI Customer Intelligence, Recommendations, and Ask SegmentIQ Chat).
"""

import io
import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app


test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def client():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()

    def override_get_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    session.close()
    Base.metadata.drop_all(bind=test_engine)


def make_test_csv(n: int = 60) -> bytes:
    rng = np.random.default_rng(123)
    df = pd.DataFrame({
        "CustomerID": [f"CUST_{i+1:03d}" for i in range(n)],
        "Age": rng.integers(18, 70, size=n),
        "AnnualIncome": rng.integers(25, 140, size=n),
        "SpendingScore": rng.integers(5, 95, size=n),
    })
    return df.to_csv(index=False).encode("utf-8")


class TestPhase6AdvancedAnalytics:
    def test_correlations_matrix(self, client):
        upload_resp = client.post(
            "/api/datasets/upload",
            files={"file": ("corr_test.csv", io.BytesIO(make_test_csv(50)), "text/csv")},
        )
        ds_id = upload_resp.json()["id"]

        resp = client.get(f"/api/analytics/correlations?dataset_id={ds_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert "features" in data
        assert len(data["features"]) >= 3
        assert "matrix" in data

    def test_feature_distributions(self, client):
        upload_resp = client.post(
            "/api/datasets/upload",
            files={"file": ("dist_test.csv", io.BytesIO(make_test_csv(50)), "text/csv")},
        )
        ds_id = upload_resp.json()["id"]

        run_resp = client.post(
            "/api/clustering/runs",
            json={"dataset_id": ds_id, "algorithm": "kmeans", "n_clusters": 3},
        )
        run_id = run_resp.json()["id"]

        resp = client.get(f"/api/analytics/distributions?run_id={run_id}&feature=AnnualIncome")
        assert resp.status_code == 200
        data = resp.json()
        assert data["feature"] == "AnnualIncome"
        assert "overall" in data
        assert "histogram" in data["overall"]
        assert "by_segment" in data

    def test_segment_comparison(self, client):
        upload_resp = client.post(
            "/api/datasets/upload",
            files={"file": ("comp_test.csv", io.BytesIO(make_test_csv(50)), "text/csv")},
        )
        ds_id = upload_resp.json()["id"]

        run_resp = client.post(
            "/api/clustering/runs",
            json={"dataset_id": ds_id, "algorithm": "kmeans", "n_clusters": 3},
        )
        run_id = run_resp.json()["id"]

        resp = client.get(f"/api/analytics/comparison?run_id={run_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 3
        assert "features" in data[0]


class TestPhase7AICustomerIntelligence:
    def test_ai_status(self, client):
        resp = client.get("/api/ai/status")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ready"
        assert "privacy_policy" in data

    def test_ai_insights_generation(self, client):
        upload_resp = client.post(
            "/api/datasets/upload",
            files={"file": ("ai_test.csv", io.BytesIO(make_test_csv(50)), "text/csv")},
        )
        ds_id = upload_resp.json()["id"]

        run_resp = client.post(
            "/api/clustering/runs",
            json={"dataset_id": ds_id, "algorithm": "kmeans", "n_clusters": 3},
        )
        run_id = run_resp.json()["id"]

        resp = client.post("/api/ai/insights", json={"run_id": run_id})
        assert resp.status_code == 200
        data = resp.json()
        assert "executive_summary" in data
        assert "segment_insights" in data
        assert len(data["segment_insights"]) == 3
        assert data["ai_grounded"] is True

    def test_business_recommendations(self, client):
        upload_resp = client.post(
            "/api/datasets/upload",
            files={"file": ("rec_test.csv", io.BytesIO(make_test_csv(50)), "text/csv")},
        )
        ds_id = upload_resp.json()["id"]

        run_resp = client.post(
            "/api/clustering/runs",
            json={"dataset_id": ds_id, "algorithm": "kmeans", "n_clusters": 3},
        )
        run_id = run_resp.json()["id"]

        resp = client.post("/api/ai/recommendations", json={"run_id": run_id})
        assert resp.status_code == 200
        recs = resp.json()
        assert len(recs) >= 3
        assert all("priority" in r and "action" in r and "success_metric" in r for r in recs)

    def test_ask_segmentiq_chat(self, client):
        upload_resp = client.post(
            "/api/datasets/upload",
            files={"file": ("chat_test.csv", io.BytesIO(make_test_csv(50)), "text/csv")},
        )
        ds_id = upload_resp.json()["id"]

        run_resp = client.post(
            "/api/clustering/runs",
            json={"dataset_id": ds_id, "algorithm": "kmeans", "n_clusters": 3},
        )
        run_id = run_resp.json()["id"]

        # Ask spending question
        resp = client.post(
            "/api/ai/chat",
            json={"run_id": run_id, "question": "Which customer segment spends the most?"},
        )
        assert resp.status_code == 200
        chat_data = resp.json()
        assert "answer" in chat_data
        assert chat_data["grounded"] is True
        assert "spending" in chat_data["answer"].lower()

    def test_ai_executive_report(self, client):
        upload_resp = client.post(
            "/api/datasets/upload",
            files={"file": ("rep_test.csv", io.BytesIO(make_test_csv(50)), "text/csv")},
        )
        ds_id = upload_resp.json()["id"]

        run_resp = client.post(
            "/api/clustering/runs",
            json={"dataset_id": ds_id, "algorithm": "kmeans", "n_clusters": 3},
        )
        run_id = run_resp.json()["id"]

        resp = client.post("/api/ai/reports", json={"run_id": run_id})
        assert resp.status_code == 200
        rep_data = resp.json()
        assert "report_markdown" in rep_data
        assert "# Executive Segmentation" in rep_data["report_markdown"]
