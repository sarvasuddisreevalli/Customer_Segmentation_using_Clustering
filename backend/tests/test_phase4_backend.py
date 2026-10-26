"""
test_phase4_backend.py
----------------------
End-to-end integration and unit tests for Phase 4 backend architecture:
Database persistence, dataset management, clustering run lifecycle,
evaluations, segment profiles, customer explorer, and analytics aggregation.
"""

import io
import os
import tempfile
import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app


from sqlalchemy.pool import StaticPool

# Temporary test database in memory with StaticPool
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Provides a fresh database session for each test."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Provides a TestClient with database session override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def make_test_csv(n: int = 60) -> bytes:
    rng = np.random.default_rng(42)
    df = pd.DataFrame({
        "CustomerID": [f"CUST_{i+1:03d}" for i in range(n)],
        "Age": rng.integers(18, 70, size=n),
        "AnnualIncome": rng.integers(20, 150, size=n),
        "SpendingScore": rng.integers(1, 100, size=n),
    })
    return df.to_csv(index=False).encode("utf-8")


class TestHealthEndpoint:
    def test_health_check(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] in ["online", "degraded"]
        assert "version" in data
        assert "database" in data


class TestDatasetManagement:
    def test_upload_valid_dataset(self, client):
        csv_bytes = make_test_csv(50)
        resp = client.post(
            "/api/datasets/upload",
            files={"file": ("customers.csv", io.BytesIO(csv_bytes), "text/csv")},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["original_filename"] == "customers.csv"
        assert data["row_count"] == 50
        assert data["column_count"] == 4
        assert "AnnualIncome" in data["columns"]

    def test_upload_non_csv_rejected(self, client):
        resp = client.post(
            "/api/datasets/upload",
            files={"file": ("test.txt", io.BytesIO(b"hello world"), "text/plain")},
        )
        assert resp.status_code == 400

    def test_upload_empty_csv_rejected(self, client):
        resp = client.post(
            "/api/datasets/upload",
            files={"file": ("empty.csv", io.BytesIO(b""), "text/csv")},
        )
        assert resp.status_code == 400

    def test_list_datasets_pagination(self, client):
        for i in range(3):
            client.post(
                "/api/datasets/upload",
                files={"file": (f"test_{i}.csv", io.BytesIO(make_test_csv(30)), "text/csv")},
            )
        resp = client.get("/api/datasets?page=1&page_size=2")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 3
        assert len(data["datasets"]) == 2

    def test_get_dataset_preview(self, client):
        upload_resp = client.post(
            "/api/datasets/upload",
            files={"file": ("preview_test.csv", io.BytesIO(make_test_csv(40)), "text/csv")},
        )
        ds_id = upload_resp.json()["id"]

        preview_resp = client.get(f"/api/datasets/{ds_id}/preview")
        assert preview_resp.status_code == 200
        data = preview_resp.json()
        assert data["total_rows"] == 40
        assert len(data["numeric_stats"]) >= 3
        assert len(data["head"]) <= 10

    def test_get_dataset_eda(self, client):
        upload_resp = client.post(
            "/api/datasets/upload",
            files={"file": ("eda_test.csv", io.BytesIO(make_test_csv(50)), "text/csv")},
        )
        ds_id = upload_resp.json()["id"]

        eda_resp = client.get(f"/api/datasets/{ds_id}/eda")
        assert eda_resp.status_code == 200
        data = eda_resp.json()
        assert "quality" in data
        assert "statistics" in data
        assert "correlations" in data

    def test_delete_dataset_cascades(self, client):
        upload_resp = client.post(
            "/api/datasets/upload",
            files={"file": ("to_delete.csv", io.BytesIO(make_test_csv(30)), "text/csv")},
        )
        ds_id = upload_resp.json()["id"]

        # Run clustering on this dataset first
        run_resp = client.post(
            "/api/clustering/runs",
            json={"dataset_id": ds_id, "algorithm": "kmeans", "n_clusters": 3},
        )
        assert run_resp.status_code == 201

        # Delete dataset
        del_resp = client.delete(f"/api/datasets/{ds_id}")
        assert del_resp.status_code == 200

        # Verify dataset is gone
        assert client.get(f"/api/datasets/{ds_id}").status_code == 404


class TestClusteringRunWorkflow:
    def test_kmeans_run_lifecycle_and_persistence(self, client):
        upload_resp = client.post(
            "/api/datasets/upload",
            files={"file": ("customers.csv", io.BytesIO(make_test_csv(60)), "text/csv")},
        )
        ds_id = upload_resp.json()["id"]

        # 1. Start clustering
        run_resp = client.post(
            "/api/clustering/runs",
            json={
                "dataset_id": ds_id,
                "algorithm": "kmeans",
                "n_clusters": 4,
                "scale_type": "standard",
            },
        )
        assert run_resp.status_code == 201
        run_data = run_resp.json()
        run_id = run_data["id"]
        assert run_data["algorithm"] == "kmeans"
        assert run_data["status"] == "completed"
        assert run_data["n_clusters_found"] == 4
        assert run_data["evaluation"]["silhouette_score"] is not None
        assert len(run_data["profiles"]) == 4

        # 2. Retrieve persisted run
        get_resp = client.get(f"/api/clustering/runs/{run_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["id"] == run_id

        # 3. Retrieve PCA visualizations
        vis_resp = client.get(f"/api/clustering/runs/{run_id}/visualizations")
        assert vis_resp.status_code == 200
        vis_data = vis_resp.json()
        assert len(vis_data["points"]) == 60
        assert "pca_x" in vis_data["points"][0]
        assert "segment_name" in vis_data["points"][0]

        # 4. Customer Explorer endpoint
        cust_resp = client.get(f"/api/clustering/runs/{run_id}/customers?page=1&page_size=10")
        assert cust_resp.status_code == 200
        cust_data = cust_resp.json()
        assert cust_data["total_customers"] == 60
        assert len(cust_data["customers"]) == 10

        # 5. Export CSV
        export_resp = client.get(f"/api/clustering/runs/{run_id}/export")
        assert export_resp.status_code == 200
        assert "text/csv" in export_resp.headers["content-type"]
        csv_text = export_resp.content.decode("utf-8")
        assert "Cluster" in csv_text
        assert "Segment_Name" in csv_text

    def test_hierarchical_clustering_run(self, client):
        upload_resp = client.post(
            "/api/datasets/upload",
            files={"file": ("hier_data.csv", io.BytesIO(make_test_csv(50)), "text/csv")},
        )
        ds_id = upload_resp.json()["id"]

        run_resp = client.post(
            "/api/clustering/runs",
            json={
                "dataset_id": ds_id,
                "algorithm": "hierarchical",
                "n_clusters": 3,
                "linkage": "ward",
            },
        )
        assert run_resp.status_code == 201
        data = run_resp.json()
        assert data["algorithm"] == "hierarchical"
        assert data["n_clusters_found"] == 3

    def test_dbscan_clustering_run(self, client):
        upload_resp = client.post(
            "/api/datasets/upload",
            files={"file": ("dbscan_data.csv", io.BytesIO(make_test_csv(50)), "text/csv")},
        )
        ds_id = upload_resp.json()["id"]

        run_resp = client.post(
            "/api/clustering/runs",
            json={
                "dataset_id": ds_id,
                "algorithm": "dbscan",
                "eps": 0.8,
                "min_samples": 4,
            },
        )
        assert run_resp.status_code == 201
        data = run_resp.json()
        assert data["algorithm"] == "dbscan"
        assert "noise_count" in data


class TestAnalyticsAggregation:
    def test_overview_empty_state(self, client):
        resp = client.get("/api/analytics/overview")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_datasets"] == 0
        assert data["total_runs"] == 0
        assert data["latest_run"] is None

    def test_overview_with_runs(self, client):
        upload_resp = client.post(
            "/api/datasets/upload",
            files={"file": ("analytics_test.csv", io.BytesIO(make_test_csv(40)), "text/csv")},
        )
        ds_id = upload_resp.json()["id"]

        client.post(
            "/api/clustering/runs",
            json={"dataset_id": ds_id, "algorithm": "kmeans", "n_clusters": 3},
        )

        resp = client.get("/api/analytics/overview")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_datasets"] == 1
        assert data["total_runs"] == 1
        assert data["completed_runs"] == 1
        assert data["latest_run"] is not None
        assert data["active_dataset_customers"] == 40
        assert data["best_silhouette_score"] is not None

    def test_segments_distribution(self, client):
        upload_resp = client.post(
            "/api/datasets/upload",
            files={"file": ("dist_test.csv", io.BytesIO(make_test_csv(40)), "text/csv")},
        )
        ds_id = upload_resp.json()["id"]

        run_resp = client.post(
            "/api/clustering/runs",
            json={"dataset_id": ds_id, "algorithm": "kmeans", "n_clusters": 3},
        )
        run_id = run_resp.json()["id"]

        resp = client.get(f"/api/analytics/segments?run_id={run_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 3
        assert sum(item["customer_count"] for item in data) == 40
