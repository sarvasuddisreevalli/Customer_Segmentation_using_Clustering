"""
clusterer.py
------------
Clustering algorithms, parameter exploration, evaluation, and PCA projection.
All outputs come from actual scikit-learn computations.
"""

import time
import math
import uuid
import warnings
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.decomposition import PCA
from sklearn.metrics import (
    silhouette_score,
    davies_bouldin_score,
    calinski_harabasz_score,
)
from scipy.cluster.hierarchy import linkage, dendrogram

# ── constants ────────────────────────────────────────────────────────────────
K_MIN = 2
K_MAX = 12          # cap elbow/silhouette sweep
MAX_ELBOW_K = 10    # shown in UI elbow chart

# ── helpers ──────────────────────────────────────────────────────────────────

def _safe_metrics(
    X: np.ndarray,
    labels: np.ndarray,
) -> Dict[str, Any]:
    """
    Compute Silhouette, Davies-Bouldin, and Calinski-Harabasz scores safely.

    DBSCAN noise points (label == -1) are EXCLUDED from metric calculations.
    If fewer than 2 non-noise clusters or fewer than 4 non-noise points remain,
    all metrics are returned as None with an explanation.
    """
    noise_mask = labels == -1
    clean_labels = labels[~noise_mask]
    clean_X = X[~noise_mask]

    n_clean = len(clean_labels)
    unique_clusters = set(clean_labels)
    n_clusters = len(unique_clusters)

    if n_clusters < 2:
        reason = (
            "Cannot compute clustering metrics: fewer than 2 valid clusters "
            f"(found {n_clusters}). "
            + ("All points classified as noise." if noise_mask.all() else "")
        )
        return {
            "silhouette_score": None,
            "davies_bouldin_score": None,
            "calinski_harabasz_score": None,
            "metrics_valid": False,
            "reason": reason,
        }

    if n_clean < 4:
        return {
            "silhouette_score": None,
            "davies_bouldin_score": None,
            "calinski_harabasz_score": None,
            "metrics_valid": False,
            "reason": f"Only {n_clean} non-noise points – not enough for reliable metrics.",
        }

    # Check no cluster is a singleton (needed for silhouette)
    min_cluster_size = min(np.bincount(clean_labels).tolist())
    if min_cluster_size < 2:
        return {
            "silhouette_score": None,
            "davies_bouldin_score": None,
            "calinski_harabasz_score": None,
            "metrics_valid": False,
            "reason": "A cluster has only 1 member – silhouette score undefined.",
        }

    try:
        sil = float(silhouette_score(clean_X, clean_labels))
        db = float(davies_bouldin_score(clean_X, clean_labels))
        ch = float(calinski_harabasz_score(clean_X, clean_labels))
        return {
            "silhouette_score": round(sil, 4),
            "davies_bouldin_score": round(db, 4),
            "calinski_harabasz_score": round(ch, 2),
            "metrics_valid": True,
            "reason": None,
        }
    except Exception as exc:
        return {
            "silhouette_score": None,
            "davies_bouldin_score": None,
            "calinski_harabasz_score": None,
            "metrics_valid": False,
            "reason": str(exc),
        }


def _pca_projection(X: np.ndarray) -> Tuple[np.ndarray, float]:
    """Project X to 2D via PCA. Returns (coords, explained_variance_ratio_sum)."""
    n_components = min(2, X.shape[1], X.shape[0] - 1)
    if n_components < 1:
        # Fallback: return zeros
        return np.zeros((X.shape[0], 2)), 0.0

    pca = PCA(n_components=n_components, random_state=42)
    coords = pca.fit_transform(X)

    if n_components == 1:
        # Pad second dimension with zeros
        coords = np.column_stack([coords, np.zeros(len(coords))])

    evr = float(pca.explained_variance_ratio_.sum())
    return coords, evr


def compute_pca_visualization(
    X: np.ndarray, labels: np.ndarray, id_series: Optional[Any] = None
) -> Dict[str, Any]:
    """Compute 2D PCA projection points for cluster visualization."""
    coords, evr = _pca_projection(X)
    points = []
    for i in range(len(X)):
        cid = int(labels[i])
        cust_id = str(id_series.iloc[i]) if id_series is not None and i < len(id_series) else f"Cust_{i+1}"
        points.append({
            "point_index": i,
            "customer_id": cust_id,
            "pca_x": round(float(coords[i, 0]), 4),
            "pca_y": round(float(coords[i, 1]), 4),
            "cluster": cid,
            "is_noise": bool(cid == -1),
        })
    return {
        "explained_variance_ratio": [round(float(evr), 4)],
        "total_variance_explained": round(float(evr), 4),
        "points": points,
    }


def _build_cluster_sizes(labels: np.ndarray) -> Dict[int, int]:
    unique, counts = np.unique(labels, return_counts=True)
    return {int(k): int(v) for k, v in zip(unique, counts)}


def _build_points(
    X_original: np.ndarray,
    feature_names: List[str],
    labels: np.ndarray,
    pca_coords: np.ndarray,
    id_series: Optional[Any] = None,  # pandas Series or None
) -> List[Dict[str, Any]]:
    """Build per-point records for API response."""
    points = []
    n = len(labels)
    for i in range(n):
        rec: Dict[str, Any] = {
            "point_index": i,
            "customer_id": str(id_series.iloc[i]) if id_series is not None else f"CUST-{1000 + i}",
            "cluster_id": int(labels[i]),
            "is_noise": bool(labels[i] == -1),
            "pca_x": round(float(pca_coords[i, 0]), 4),
            "pca_y": round(float(pca_coords[i, 1]), 4),
        }
        for j, feat in enumerate(feature_names):
            rec[feat] = round(float(X_original[i, j]), 4) if i < len(X_original) else 0.0
        points.append(rec)
    return points

# ── K-Means ──────────────────────────────────────────────────────────────────

def run_kmeans(
    X: np.ndarray,
    n_clusters: int,
    feature_names: List[str],
    X_raw: Optional[np.ndarray] = None,
    id_series: Optional[Any] = None,
    random_state: int = 42,
) -> Dict[str, Any]:
    """Fit K-Means and return full results dict."""
    n_clusters = max(K_MIN, min(n_clusters, max(K_MIN, len(X) - 1)))

    t0 = time.perf_counter()
    model = KMeans(n_clusters=n_clusters, init="k-means++", n_init=10, random_state=random_state)
    labels = model.fit_predict(X)
    elapsed = round(time.perf_counter() - t0, 3)

    pca_coords, pca_evr = _pca_projection(X)
    metrics = _safe_metrics(X, labels)
    sizes = _build_cluster_sizes(labels)
    noise_count = int(np.sum(labels == -1))
    points = _build_points(X_raw if X_raw is not None else X, feature_names, labels, pca_coords, id_series)

    return {
        "algorithm": "kmeans",
        "params": {"n_clusters": n_clusters, "random_state": random_state},
        "n_clusters_found": n_clusters,
        "noise_count": noise_count,
        "cluster_sizes": sizes,
        "inertia": round(float(model.inertia_), 4),
        "pca_explained_variance": round(pca_evr, 4),
        **metrics,
        "elapsed_seconds": elapsed,
        "points": points,
        "labels": labels.tolist(),
        "centroids": model.cluster_centers_.tolist(),
    }


def elbow_data(
    X: np.ndarray,
    k_min: int = K_MIN,
    k_max: int = MAX_ELBOW_K,
    random_state: int = 42,
) -> List[Dict[str, Any]]:
    """
    Compute inertia + evaluation metrics for k in [k_min, k_max].
    Used for elbow curve and silhouette sweep.
    """
    k_max = min(k_max, len(X) - 1)
    results = []
    for k in range(k_min, k_max + 1):
        km = KMeans(n_clusters=k, init="k-means++", n_init=5, random_state=random_state)
        lbl = km.fit_predict(X)
        m = _safe_metrics(X, lbl)
        results.append({
            "k": k,
            "inertia": round(float(km.inertia_), 2),
            "silhouette_score": m["silhouette_score"],
            "davies_bouldin_score": m["davies_bouldin_score"],
            "calinski_harabasz_score": m["calinski_harabasz_score"],
        })
    return results

# ── Hierarchical ─────────────────────────────────────────────────────────────

VALID_LINKAGE = {"ward", "complete", "average", "single"}

def run_hierarchical(
    X: np.ndarray,
    n_clusters: int,
    linkage_method: str,
    feature_names: List[str],
    X_raw: Optional[np.ndarray] = None,
    id_series: Optional[Any] = None,
) -> Dict[str, Any]:
    """Fit Agglomerative Hierarchical clustering and return results dict."""
    linkage_method = linkage_method if linkage_method in VALID_LINKAGE else "ward"
    n_clusters = max(K_MIN, min(n_clusters, max(K_MIN, len(X) - 1)))

    t0 = time.perf_counter()
    model = AgglomerativeClustering(n_clusters=n_clusters, linkage=linkage_method)
    labels = model.fit_predict(X)
    elapsed = round(time.perf_counter() - t0, 3)

    pca_coords, pca_evr = _pca_projection(X)
    metrics = _safe_metrics(X, labels)
    sizes = _build_cluster_sizes(labels)
    noise_count = int(np.sum(labels == -1))
    points = _build_points(X_raw if X_raw is not None else X, feature_names, labels, pca_coords, id_series)

    # Dendrogram metadata (capped at 50 branches to keep response small)
    dendro_data = None
    try:
        # Use scipy linkage for dendrogram – cap at 500 rows for speed
        X_dendro = X if len(X) <= 500 else X[np.random.default_rng(42).choice(len(X), 500, replace=False)]
        Z = linkage(X_dendro, method=linkage_method)
        dendro = dendrogram(Z, no_plot=True, truncate_mode="lastp", p=min(50, len(Z)))
        dendro_data = {
            "icoord": [list(row) for row in dendro["icoord"][:50]],
            "dcoord": [list(row) for row in dendro["dcoord"][:50]],
            "ivl": dendro["ivl"][:50],
        }
    except Exception:
        dendro_data = None

    return {
        "algorithm": "hierarchical",
        "params": {"n_clusters": n_clusters, "linkage": linkage_method},
        "n_clusters_found": n_clusters,
        "noise_count": noise_count,
        "cluster_sizes": sizes,
        "pca_explained_variance": round(pca_evr, 4),
        "dendrogram_data": dendro_data,
        **metrics,
        "elapsed_seconds": elapsed,
        "points": points,
        "labels": labels.tolist(),
    }

# ── DBSCAN ────────────────────────────────────────────────────────────────────

def run_dbscan(
    X: np.ndarray,
    eps: float,
    min_samples: int,
    feature_names: List[str],
    X_raw: Optional[np.ndarray] = None,
    id_series: Optional[Any] = None,
) -> Dict[str, Any]:
    """Fit DBSCAN and return results dict. Noise points get cluster_id = -1."""
    eps = max(0.01, float(eps))
    min_samples = max(1, int(min_samples))

    t0 = time.perf_counter()
    model = DBSCAN(eps=eps, min_samples=min_samples)
    labels = model.fit_predict(X)
    elapsed = round(time.perf_counter() - t0, 3)

    pca_coords, pca_evr = _pca_projection(X)
    metrics = _safe_metrics(X, labels)
    sizes = _build_cluster_sizes(labels)
    n_clusters_found = int(len(set(labels)) - (1 if -1 in labels else 0))
    noise_count = int(np.sum(labels == -1))
    noise_pct = round(noise_count / max(len(labels), 1) * 100, 2)
    points = _build_points(X_raw if X_raw is not None else X, feature_names, labels, pca_coords, id_series)

    warnings_list = []
    if n_clusters_found == 0:
        warnings_list.append("DBSCAN found 0 clusters – all points are noise. Try increasing eps or decreasing min_samples.")
    elif n_clusters_found == 1:
        warnings_list.append("DBSCAN found only 1 cluster. Metrics require ≥2 clusters.")
    if noise_pct > 30:
        warnings_list.append(f"{noise_pct}% of points are noise. Consider adjusting eps/min_samples.")

    return {
        "algorithm": "dbscan",
        "params": {"eps": eps, "min_samples": min_samples},
        "n_clusters_found": n_clusters_found,
        "noise_count": noise_count,
        "noise_percentage": noise_pct,
        "cluster_sizes": sizes,
        "pca_explained_variance": round(pca_evr, 4),
        **metrics,
        "elapsed_seconds": elapsed,
        "warnings": warnings_list,
        "points": points,
        "labels": labels.tolist(),
    }

# ── Algorithm Comparison ──────────────────────────────────────────────────────

def compare_algorithms(
    X: np.ndarray,
    feature_names: List[str],
    kmeans_k: int = 4,
    hier_k: int = 4,
    hier_linkage: str = "ward",
    dbscan_eps: float = 0.5,
    dbscan_min_samples: int = 5,
    id_series: Optional[Any] = None,
) -> Dict[str, Any]:
    """Run all three algorithms and return a side-by-side comparison."""
    km = run_kmeans(X, kmeans_k, feature_names, id_series=id_series)
    hc = run_hierarchical(X, hier_k, hier_linkage, feature_names, id_series=id_series)
    db = run_dbscan(X, dbscan_eps, dbscan_min_samples, feature_names, id_series=id_series)

    results = [
        {"algorithm": "K-Means", "result": km},
        {"algorithm": "Hierarchical", "result": hc},
        {"algorithm": "DBSCAN", "result": db},
    ]

    # Recommend based on silhouette (only valid scores), then DB index (lower = better)
    valid = [(i, r) for i, r in enumerate(results) if r["result"]["metrics_valid"]]
    if valid:
        # highest silhouette
        best_idx, _ = max(valid, key=lambda x: x[1]["result"]["silhouette_score"] or -1)
        recommended = results[best_idx]["algorithm"]
        reasoning = (
            f"{recommended} achieved the highest Silhouette Score "
            f"({results[best_idx]['result']['silhouette_score']}) "
            "among algorithms with valid evaluation metrics."
        )
    else:
        recommended = "K-Means"
        reasoning = "No algorithm produced valid evaluation metrics. K-Means is suggested as a default starting point."

    comparison_table = []
    for r in results:
        res = r["result"]
        comparison_table.append({
            "algorithm": r["algorithm"],
            "n_clusters_found": res["n_clusters_found"],
            "noise_count": res.get("noise_count", 0),
            "noise_percentage": res.get("noise_percentage", 0.0),
            "silhouette_score": res["silhouette_score"],
            "davies_bouldin_score": res["davies_bouldin_score"],
            "calinski_harabasz_score": res["calinski_harabasz_score"],
            "metrics_valid": res["metrics_valid"],
            "metrics_reason": res.get("reason"),
            "elapsed_seconds": res["elapsed_seconds"],
            "is_recommended": r["algorithm"] == recommended,
        })

    return {
        "comparison_table": comparison_table,
        "recommended_algorithm": recommended,
        "reasoning": reasoning,
        "kmeans_result": km,
        "hierarchical_result": hc,
        "dbscan_result": db,
    }
