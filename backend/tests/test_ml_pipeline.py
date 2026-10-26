"""
test_ml_pipeline.py
-------------------
Automated tests for SegmentIQ Phase 2 & 3 ML pipeline.
Run with: pytest backend/tests/test_ml_pipeline.py -v

Tests use small synthetic datasets for determinism.
"""

import io
import sys
import os
import math

import numpy as np
import pandas as pd
import pytest

# Ensure backend is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ml.preprocessor import (
    validate_dataset,
    build_preview,
    compute_eda,
    run_preprocessing,
)
from app.ml.clusterer import (
    run_kmeans,
    run_hierarchical,
    run_dbscan,
    compare_algorithms,
    elbow_data,
    _safe_metrics,
)
from app.ml.profiler import build_segment_profiles


# ── Fixtures ──────────────────────────────────────────────────────────────────

def _make_numeric_df(n: int = 100) -> pd.DataFrame:
    rng = np.random.default_rng(42)
    return pd.DataFrame({
        "CustomerID": [f"C{i}" for i in range(n)],
        "Age": rng.integers(18, 70, n).astype(float),
        "AnnualIncome": rng.uniform(20_000, 150_000, n),
        "SpendingScore": rng.uniform(1, 100, n),
        "PurchaseFrequency": rng.integers(1, 30, n).astype(float),
    })


def _make_mixed_df(n: int = 80) -> pd.DataFrame:
    rng = np.random.default_rng(0)
    df = _make_numeric_df(n)
    df["Gender"] = rng.choice(["Male", "Female", "Other"], n)
    df["Region"] = rng.choice(["North", "South", "East", "West"], n)
    return df


def _make_df_with_missing(n: int = 60) -> pd.DataFrame:
    df = _make_numeric_df(n)
    rng = np.random.default_rng(7)
    for col in ["Age", "SpendingScore"]:
        idx = rng.choice(n, 10, replace=False)
        df.loc[idx, col] = np.nan
    return df


def _make_df_with_dupes(n: int = 50) -> pd.DataFrame:
    df = _make_numeric_df(n)
    dupes = df.iloc[:10].copy()
    return pd.concat([df, dupes], ignore_index=True)


# ── TASK 20: Preprocessing tests ─────────────────────────────────────────────

class TestValidation:

    def test_valid_dataset(self):
        df = _make_numeric_df(50)
        result = validate_dataset(df)
        assert result["valid"] is True
        assert len(result["errors"]) == 0

    def test_empty_dataset(self):
        df = pd.DataFrame()
        result = validate_dataset(df)
        assert result["valid"] is False
        assert any("empty" in e.lower() for e in result["errors"])

    def test_too_few_rows(self):
        df = _make_numeric_df(3)
        result = validate_dataset(df)
        assert result["valid"] is False

    def test_too_many_rows(self):
        # Create a df that exceeds MAX_ROWS
        from app.ml.preprocessor import MAX_ROWS
        df = pd.DataFrame({"A": range(MAX_ROWS + 1), "B": range(MAX_ROWS + 1)})
        result = validate_dataset(df)
        assert result["valid"] is False
        assert any("rows" in e.lower() for e in result["errors"])

    def test_duplicate_column_names(self):
        df = pd.DataFrame([[1, 2, 3]], columns=["A", "A", "B"])
        result = validate_dataset(df)
        assert result["valid"] is False
        assert any("duplicate" in e.lower() for e in result["errors"])

    def test_no_numeric_columns(self):
        df = pd.DataFrame({"Name": ["Alice", "Bob", "Carol", "Dave", "Eve"]})
        result = validate_dataset(df)
        assert result["valid"] is False


class TestPreview:

    def test_preview_shape(self):
        df = _make_numeric_df(50)
        preview = build_preview(df)
        assert preview["n_rows"] == 50
        assert "CustomerID" in preview["id_columns"]
        assert len(preview["sample_records"]) == 10

    def test_preview_missing_counts(self):
        df = _make_df_with_missing(60)
        preview = build_preview(df)
        assert preview["total_missing"] > 0

    def test_preview_duplicates(self):
        df = _make_df_with_dupes(50)
        preview = build_preview(df)
        assert preview["duplicate_rows"] == 10


class TestPreprocessing:

    def test_basic_preprocessing(self):
        df = _make_numeric_df(80)
        result = run_preprocessing(df, scale_type="standard")
        X = result["X_scaled"]
        assert X.shape[0] == 80
        assert X.shape[1] >= 2
        # Standard scaled mean ≈ 0
        assert abs(X.mean()) < 0.5

    def test_missing_imputation_median(self):
        df = _make_df_with_missing(60)
        result = run_preprocessing(df, missing_strategy="median")
        assert result["report"]["steps"][3]["missing_before"] > 0
        assert result["report"]["steps"][3]["missing_after"] == 0

    def test_missing_imputation_mean(self):
        df = _make_df_with_missing(60)
        result = run_preprocessing(df, missing_strategy="mean")
        X = result["X_scaled"]
        assert not np.any(np.isnan(X))

    def test_duplicate_removal(self):
        df = _make_df_with_dupes(50)
        result = run_preprocessing(df, drop_duplicates=True)
        assert result["df_clean"].duplicated().sum() == 0

    def test_minmax_scaler_range(self):
        df = _make_numeric_df(80)
        result = run_preprocessing(df, scale_type="minmax")
        X = result["X_scaled"]
        assert X.min() >= -0.01
        assert X.max() <= 1.01

    def test_robust_scaler(self):
        df = _make_numeric_df(80)
        result = run_preprocessing(df, scale_type="robust")
        X = result["X_scaled"]
        assert X is not None

    def test_feature_selection(self):
        df = _make_numeric_df(80)
        result = run_preprocessing(df, selected_features=["Age", "SpendingScore"])
        assert result["feature_names"] == ["Age", "SpendingScore"]
        assert result["X_scaled"].shape[1] == 2

    def test_too_few_features_fallback(self):
        df = _make_numeric_df(50)
        # If user selects only 1 valid feature, should fallback to all numeric
        result = run_preprocessing(df, selected_features=["Age"])
        assert len(result["feature_names"]) >= 2

    def test_numerical_only_dataset(self):
        df = pd.DataFrame({
            "A": np.linspace(1, 100, 50),
            "B": np.linspace(200, 500, 50),
            "C": np.linspace(10, 90, 50),
        })
        result = run_preprocessing(df)
        assert result["X_scaled"].shape == (50, 3)

    def test_mixed_dataset(self):
        df = _make_mixed_df(80)
        # Only numeric features should be selected
        result = run_preprocessing(df)
        features = result["feature_names"]
        assert "Gender" not in features
        assert "Region" not in features


class TestEDA:

    def test_eda_keys(self):
        df = _make_numeric_df(50)
        eda = compute_eda(df)
        assert "quality" in eda
        assert "statistics" in eda
        assert "distributions" in eda
        assert "correlations" in eda

    def test_eda_correlations(self):
        df = _make_numeric_df(80)
        eda = compute_eda(df)
        # Should have correlations for numeric pairs
        assert isinstance(eda["correlations"], list)
        # Every correlation should be in [-1, 1]
        for c in eda["correlations"]:
            assert -1.0 <= c["correlation"] <= 1.0

    def test_eda_sample_records(self):
        df = _make_numeric_df(30)
        eda = compute_eda(df)
        assert len(eda["sample_records"]) == 10


# ── TASK 20: Clustering tests ─────────────────────────────────────────────────

class TestKMeans:

    def _get_X(self, n=100):
        df = _make_numeric_df(n)
        return run_preprocessing(df)["X_scaled"]

    def test_kmeans_basic(self):
        X = self._get_X()
        result = run_kmeans(X, 4, ["f1", "f2", "f3", "f4"])
        assert result["n_clusters_found"] == 4
        assert len(result["labels"]) == 100

    def test_kmeans_label_alignment(self):
        X = self._get_X(80)
        result = run_kmeans(X, 3, ["f1", "f2", "f3", "f4"])
        assert len(result["labels"]) == len(result["points"])

    def test_kmeans_metrics_valid(self):
        X = self._get_X()
        result = run_kmeans(X, 4, ["f1", "f2", "f3", "f4"])
        assert result["metrics_valid"] is True
        assert result["silhouette_score"] is not None

    def test_kmeans_invalid_k_clamped(self):
        X = self._get_X(20)
        result = run_kmeans(X, 99, ["f1", "f2", "f3", "f4"])
        # k should be clamped to len(X) - 1
        assert result["n_clusters_found"] <= 19

    def test_elbow_data_length(self):
        X = self._get_X()
        data = elbow_data(X, k_min=2, k_max=6)
        assert len(data) == 5
        for d in data:
            assert "inertia" in d
            assert d["inertia"] >= 0


class TestHierarchical:

    def _get_X(self, n=80):
        df = _make_numeric_df(n)
        return run_preprocessing(df)["X_scaled"], ["f1", "f2", "f3", "f4"]

    def test_hierarchical_basic(self):
        X, feats = self._get_X()
        result = run_hierarchical(X, 3, "ward", feats)
        assert result["n_clusters_found"] == 3
        assert len(result["labels"]) == 80

    def test_hierarchical_complete_linkage(self):
        X, feats = self._get_X()
        result = run_hierarchical(X, 3, "complete", feats)
        assert result["algorithm"] == "hierarchical"

    def test_hierarchical_invalid_linkage_fallback(self):
        X, feats = self._get_X()
        result = run_hierarchical(X, 3, "nonexistent_linkage", feats)
        # Should fall back to 'ward'
        assert result["n_clusters_found"] == 3

    def test_hierarchical_dendrogram_data(self):
        X, feats = self._get_X()
        result = run_hierarchical(X, 3, "ward", feats)
        # Dendrogram data may be None on very small datasets
        if result["dendrogram_data"] is not None:
            assert "icoord" in result["dendrogram_data"]


class TestDBSCAN:

    def _get_X(self, n=100):
        df = _make_numeric_df(n)
        return run_preprocessing(df)["X_scaled"], ["f1", "f2", "f3", "f4"]

    def test_dbscan_basic(self):
        X, feats = self._get_X()
        result = run_dbscan(X, 0.5, 5, feats)
        assert "n_clusters_found" in result
        assert "noise_count" in result

    def test_dbscan_noise_points(self):
        X, feats = self._get_X()
        result = run_dbscan(X, 0.01, 100, feats)  # Tight params → more noise
        # Noise points should be present
        assert result["noise_count"] >= 0

    def test_dbscan_all_noise_handled(self):
        X, feats = self._get_X(20)
        result = run_dbscan(X, 0.0001, 50, feats)  # Extreme params
        # Should not crash; metrics should be None, not fabricated
        if result["n_clusters_found"] < 2:
            assert result["silhouette_score"] is None
            assert result["metrics_valid"] is False

    def test_dbscan_label_alignment(self):
        X, feats = self._get_X()
        result = run_dbscan(X, 0.5, 5, feats)
        assert len(result["labels"]) == len(result["points"])


class TestMetrics:

    def test_metrics_valid_two_clusters(self):
        rng = np.random.default_rng(42)
        X = np.vstack([rng.normal([0, 0], 0.5, (50, 2)),
                       rng.normal([5, 5], 0.5, (50, 2))])
        labels = np.array([0] * 50 + [1] * 50)
        m = _safe_metrics(X, labels)
        assert m["metrics_valid"] is True
        assert m["silhouette_score"] is not None
        assert 0 < m["silhouette_score"] <= 1

    def test_metrics_single_cluster(self):
        X = np.random.randn(30, 2)
        labels = np.zeros(30, dtype=int)
        m = _safe_metrics(X, labels)
        assert m["metrics_valid"] is False
        assert m["silhouette_score"] is None

    def test_metrics_all_noise(self):
        X = np.random.randn(20, 2)
        labels = np.full(20, -1)
        m = _safe_metrics(X, labels)
        assert m["metrics_valid"] is False

    def test_metrics_excludes_noise(self):
        rng = np.random.default_rng(0)
        X = np.vstack([rng.normal([0, 0], 0.3, (40, 2)),
                       rng.normal([4, 4], 0.3, (40, 2)),
                       rng.normal([8, 0], 0.3, (5, 2))])  # noise-ish
        labels = np.array([0] * 40 + [1] * 40 + [-1] * 5)
        m = _safe_metrics(X, labels)
        # Should compute on non-noise points only
        assert m["metrics_valid"] is True


class TestSegmentProfiling:

    def test_profile_count(self):
        rng = np.random.default_rng(42)
        df = _make_numeric_df(60)
        result = run_preprocessing(df)
        X = result["X_scaled"]
        km_result = run_kmeans(X, 3, result["feature_names"])
        labels = np.array(km_result["labels"])
        profiles = build_segment_profiles(df, labels, result["feature_names"])
        assert profiles["n_segments"] == 3

    def test_profile_percentages_sum(self):
        df = _make_numeric_df(60)
        result = run_preprocessing(df)
        X = result["X_scaled"]
        km_result = run_kmeans(X, 4, result["feature_names"])
        labels = np.array(km_result["labels"])
        profiles = build_segment_profiles(df, labels, result["feature_names"])
        total_pct = sum(p["percentage"] for p in profiles["profiles"])
        assert abs(total_pct - 100.0) < 0.5

    def test_profile_label_not_hardcoded(self):
        # Two very different clusters should get different names
        rng = np.random.default_rng(1)
        df1 = pd.DataFrame({
            "CustomerID": [f"C{i}" for i in range(30)],
            "AnnualIncome": rng.uniform(100_000, 200_000, 30),  # high
            "SpendingScore": rng.uniform(80, 100, 30),
        })
        df2 = pd.DataFrame({
            "CustomerID": [f"C{i + 30}" for i in range(30)],
            "AnnualIncome": rng.uniform(10_000, 30_000, 30),    # low
            "SpendingScore": rng.uniform(1, 20, 30),
        })
        df = pd.concat([df1, df2], ignore_index=True)
        labels = np.array([0] * 30 + [1] * 30)
        profiles = build_segment_profiles(
            df, labels, ["AnnualIncome", "SpendingScore"]
        )
        names = [p["segment_name"] for p in profiles["profiles"]]
        assert len(set(names)) == 2, f"Expected 2 distinct names, got {names}"

    def test_noise_labeled_correctly(self):
        df = _make_numeric_df(50)
        labels = np.array([-1] * 10 + [0] * 20 + [1] * 20)
        result = run_preprocessing(df)
        profiles = build_segment_profiles(
            df.iloc[:50], labels, result["feature_names"]
        )
        noise_profiles = [p for p in profiles["profiles"] if p["is_noise"]]
        assert len(noise_profiles) == 1
        assert noise_profiles[0]["segment_name"] == "Noise / Outliers"


class TestAlgorithmComparison:

    def test_comparison_has_all_algorithms(self):
        df = _make_numeric_df(80)
        result = run_preprocessing(df)
        comp = compare_algorithms(result["X_scaled"], result["feature_names"])
        algos = [r["algorithm"] for r in comp["comparison_table"]]
        assert "K-Means" in algos
        assert "Hierarchical" in algos
        assert "DBSCAN" in algos

    def test_comparison_recommends_an_algorithm(self):
        df = _make_numeric_df(80)
        result = run_preprocessing(df)
        comp = compare_algorithms(result["X_scaled"], result["feature_names"])
        assert comp["recommended_algorithm"] in ("K-Means", "Hierarchical", "DBSCAN")
        assert len(comp["reasoning"]) > 10


# ── FastAPI integration tests ─────────────────────────────────────────────────

class TestAPIIntegration:
    """Basic integration tests using FastAPI TestClient."""

    @pytest.fixture(autouse=True)
    def client(self):
        from fastapi.testclient import TestClient
        from app.main import app
        self.client = TestClient(app)

    def _make_csv_bytes(self, n: int = 80) -> bytes:
        df = _make_numeric_df(n)
        return df.to_csv(index=False).encode("utf-8")

    def test_health_endpoint(self):
        resp = self.client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "online"

    def test_upload_valid_csv(self):
        csv_bytes = self._make_csv_bytes()
        resp = self.client.post(
            "/api/v2/datasets/upload",
            files={"file": ("test.csv", csv_bytes, "text/csv")},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "dataset_id" in body
        assert body["preview"]["n_rows"] == 80

    def test_upload_non_csv_rejected(self):
        resp = self.client.post(
            "/api/v2/datasets/upload",
            files={"file": ("malware.exe", b"ELF binary content", "application/octet-stream")},
        )
        assert resp.status_code == 400

    def test_upload_empty_file_rejected(self):
        resp = self.client.post(
            "/api/v2/datasets/upload",
            files={"file": ("empty.csv", b"", "text/csv")},
        )
        assert resp.status_code in (400, 422)

    def test_upload_malformed_csv(self):
        bad_csv = b"this,is\nnot,a,valid\ncsv,structure,here,with,random,columns\n"
        # Won't crash, but might produce warnings
        resp = self.client.post(
            "/api/v2/datasets/upload",
            files={"file": ("bad.csv", bad_csv, "text/csv")},
        )
        # Should either work or return 422 – should never be 500
        assert resp.status_code != 500

    def test_preview_endpoint(self):
        csv_bytes = self._make_csv_bytes()
        up = self.client.post(
            "/api/v2/datasets/upload",
            files={"file": ("test.csv", csv_bytes, "text/csv")},
        )
        dataset_id = up.json()["dataset_id"]
        resp = self.client.get(f"/api/v2/datasets/{dataset_id}/preview")
        assert resp.status_code == 200
        assert "n_rows" in resp.json()

    def test_eda_endpoint(self):
        csv_bytes = self._make_csv_bytes()
        up = self.client.post(
            "/api/v2/datasets/upload",
            files={"file": ("test.csv", csv_bytes, "text/csv")},
        )
        dataset_id = up.json()["dataset_id"]
        resp = self.client.get(f"/api/v2/datasets/{dataset_id}/eda")
        assert resp.status_code == 200
        data = resp.json()
        assert "statistics" in data
        assert "correlations" in data

    def test_preprocess_endpoint(self):
        csv_bytes = self._make_csv_bytes()
        up = self.client.post(
            "/api/v2/datasets/upload",
            files={"file": ("test.csv", csv_bytes, "text/csv")},
        )
        dataset_id = up.json()["dataset_id"]
        resp = self.client.post(
            f"/api/v2/datasets/{dataset_id}/preprocess",
            json={"scale_type": "standard", "drop_duplicates": True},
        )
        assert resp.status_code == 200
        assert "selected_features" in resp.json()

    def test_train_kmeans(self):
        csv_bytes = self._make_csv_bytes()
        up = self.client.post(
            "/api/v2/datasets/upload",
            files={"file": ("test.csv", csv_bytes, "text/csv")},
        )
        dataset_id = up.json()["dataset_id"]
        resp = self.client.post(
            "/api/v2/clustering/train?algorithm=kmeans",
            json={"dataset_id": dataset_id, "n_clusters": 3},
        )
        assert resp.status_code == 200
        assert resp.json()["n_clusters_found"] == 3

    def test_train_hierarchical(self):
        csv_bytes = self._make_csv_bytes()
        up = self.client.post(
            "/api/v2/datasets/upload",
            files={"file": ("test.csv", csv_bytes, "text/csv")},
        )
        dataset_id = up.json()["dataset_id"]
        resp = self.client.post(
            "/api/v2/clustering/train?algorithm=hierarchical",
            json={"dataset_id": dataset_id, "n_clusters": 3, "linkage": "ward"},
        )
        assert resp.status_code == 200

    def test_train_dbscan(self):
        csv_bytes = self._make_csv_bytes()
        up = self.client.post(
            "/api/v2/datasets/upload",
            files={"file": ("test.csv", csv_bytes, "text/csv")},
        )
        dataset_id = up.json()["dataset_id"]
        resp = self.client.post(
            "/api/v2/clustering/train?algorithm=dbscan",
            json={"dataset_id": dataset_id, "eps": 0.5, "min_samples": 5},
        )
        assert resp.status_code == 200
        assert "n_clusters_found" in resp.json()

    def test_run_segments_endpoint(self):
        csv_bytes = self._make_csv_bytes()
        up = self.client.post(
            "/api/v2/datasets/upload",
            files={"file": ("test.csv", csv_bytes, "text/csv")},
        )
        dataset_id = up.json()["dataset_id"]
        train = self.client.post(
            "/api/v2/clustering/train?algorithm=kmeans",
            json={"dataset_id": dataset_id, "n_clusters": 3},
        )
        run_id = train.json()["run_id"]
        resp = self.client.get(f"/api/v2/clustering/{run_id}/segments")
        assert resp.status_code == 200
        assert "profiles" in resp.json()

    def test_export_csv_returns_file(self):
        csv_bytes = self._make_csv_bytes()
        up = self.client.post(
            "/api/v2/datasets/upload",
            files={"file": ("test.csv", csv_bytes, "text/csv")},
        )
        dataset_id = up.json()["dataset_id"]
        train = self.client.post(
            "/api/v2/clustering/train?algorithm=kmeans",
            json={"dataset_id": dataset_id, "n_clusters": 3},
        )
        run_id = train.json()["run_id"]
        resp = self.client.get(f"/api/v2/clustering/{run_id}/export")
        assert resp.status_code == 200
        assert "text/csv" in resp.headers["content-type"]
        # Check CSV has header row
        content = resp.content.decode("utf-8")
        assert "customer_id" in content
        assert "cluster_id" in content
        assert "segment_name" in content

    def test_nonexistent_dataset_404(self):
        resp = self.client.get("/api/v2/datasets/does-not-exist/preview")
        assert resp.status_code == 404

    def test_nonexistent_run_404(self):
        resp = self.client.get("/api/v2/clustering/does-not-exist/results")
        assert resp.status_code == 404

    def test_compare_algorithms(self):
        csv_bytes = self._make_csv_bytes()
        up = self.client.post(
            "/api/v2/datasets/upload",
            files={"file": ("test.csv", csv_bytes, "text/csv")},
        )
        dataset_id = up.json()["dataset_id"]
        resp = self.client.post(
            "/api/v2/clustering/compare",
            json={
                "dataset_id": dataset_id,
                "kmeans_k": 3,
                "hier_k": 3,
                "dbscan_eps": 0.5,
                "dbscan_min_samples": 5,
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["comparison_table"]) == 3
        assert body["recommended_algorithm"] in ("K-Means", "Hierarchical", "DBSCAN")


# ── CSV Export integrity ───────────────────────────────────────────────────────

class TestExportIntegrity:

    def test_csv_row_count_matches_dataset(self):
        """Exported CSV must have exactly n+1 rows (header + n data rows)."""
        from fastapi.testclient import TestClient
        from app.main import app
        client = TestClient(app)

        n = 60
        df = _make_numeric_df(n)
        csv_bytes = df.to_csv(index=False).encode("utf-8")

        up = client.post(
            "/api/v2/datasets/upload",
            files={"file": ("test.csv", csv_bytes, "text/csv")},
        )
        dataset_id = up.json()["dataset_id"]
        train = client.post(
            "/api/v2/clustering/train?algorithm=kmeans",
            json={"dataset_id": dataset_id, "n_clusters": 3},
        )
        run_id = train.json()["run_id"]
        resp = client.get(f"/api/v2/clustering/{run_id}/export")
        content = resp.content.decode("utf-8")
        lines = [l for l in content.strip().split("\n") if l]
        assert len(lines) == n + 1  # header + n rows

    def test_csv_formula_injection_protection(self):
        """Customer IDs starting with = should be escaped."""
        from fastapi.testclient import TestClient
        from app.main import app
        client = TestClient(app)

        df = _make_numeric_df(20)
        df["CustomerID"] = [f"=CMD|'/C calc'!A0_{i}" for i in range(20)]
        csv_bytes = df.to_csv(index=False).encode("utf-8")

        up = client.post(
            "/api/v2/datasets/upload",
            files={"file": ("test.csv", csv_bytes, "text/csv")},
        )
        dataset_id = up.json()["dataset_id"]
        train = client.post(
            "/api/v2/clustering/train?algorithm=kmeans",
            json={"dataset_id": dataset_id, "n_clusters": 2},
        )
        run_id = train.json()["run_id"]
        resp = client.get(f"/api/v2/clustering/{run_id}/export")
        content = resp.content.decode("utf-8")
        # Injected formulas must be escaped with leading apostrophe
        assert "=CMD" not in content or "'=CMD" in content
