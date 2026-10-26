"""
advanced_analytics.py
---------------------
Computes advanced exploratory and diagnostic analytics:
1. Feature distributions (histogram bins, IQR box-plot percentiles)
2. Pearson correlation matrix with safe numeric column filtering
3. Segment-to-segment comparison matrix with percentage differences
"""

from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd


def compute_feature_distributions(
    df: pd.DataFrame, feature: str, labels: Optional[np.ndarray] = None, bins: int = 10
) -> Dict[str, Any]:
    """Computes overall and per-segment histogram bins and quartiles for a numerical feature."""
    if feature not in df.columns:
        raise ValueError(f"Feature '{feature}' not found in dataset.")

    series = df[feature].dropna()
    if len(series) == 0:
        return {"overall": {}, "by_segment": {}}

    min_val, max_val = float(series.min()), float(series.max())
    if min_val == max_val:
        min_val -= 1.0
        max_val += 1.0

    counts, bin_edges = np.histogram(series, bins=bins, range=(min_val, max_val))
    overall_hist = [
        {
            "bin_start": round(float(bin_edges[i]), 2),
            "bin_end": round(float(bin_edges[i + 1]), 2),
            "count": int(counts[i]),
        }
        for i in range(len(counts))
    ]

    q25, q50, q75 = float(series.quantile(0.25)), float(series.quantile(0.50)), float(series.quantile(0.75))
    iqr = q75 - q25

    overall_stats = {
        "mean": round(float(series.mean()), 2),
        "median": round(q50, 2),
        "std": round(float(series.std()), 2) if len(series) > 1 else 0.0,
        "min": round(min_val, 2),
        "max": round(max_val, 2),
        "q25": round(q25, 2),
        "q75": round(q75, 2),
        "iqr": round(iqr, 2),
        "histogram": overall_hist,
    }

    by_segment: Dict[str, Any] = {}
    if labels is not None and len(labels) == len(df):
        unique_labels = sorted(set(labels))
        for lbl in unique_labels:
            seg_name = f"Cluster {lbl}" if lbl >= 0 else "Noise"
            seg_series = df.iloc[labels == lbl][feature].dropna()
            if len(seg_series) > 0:
                s_counts, _ = np.histogram(seg_series, bins=bin_edges)
                by_segment[str(lbl)] = {
                    "segment_label": seg_name,
                    "count": int(len(seg_series)),
                    "mean": round(float(seg_series.mean()), 2),
                    "median": round(float(seg_series.median()), 2),
                    "histogram": [int(c) for c in s_counts],
                }

    return {"feature": feature, "overall": overall_stats, "by_segment": by_segment}


def compute_correlation_matrix(df: pd.DataFrame, features: Optional[List[str]] = None) -> Dict[str, Any]:
    """Computes safe Pearson correlation matrix across numerical features."""
    num_df = df.select_dtypes(include=[np.number])
    if features:
        valid = [f for f in features if f in num_df.columns]
        if len(valid) >= 2:
            num_df = num_df[valid]

    if num_df.shape[1] < 2:
        return {"features": list(num_df.columns), "matrix": []}

    corr = num_df.corr(method="pearson").fillna(0.0)
    cols = list(corr.columns)
    matrix = []
    for r in cols:
        row_values = []
        for c in cols:
            row_values.append(round(float(corr.loc[r, c]), 3))
        matrix.append({"feature": r, "values": row_values})

    return {"features": cols, "matrix": matrix}


def compute_segment_comparison(
    df: pd.DataFrame, labels: np.ndarray, feature_names: List[str]
) -> List[Dict[str, Any]]:
    """Compares average feature values per segment against the overall dataset baseline."""
    valid_feats = [f for f in feature_names if f in df.columns]
    baseline = {f: float(df[f].mean()) for f in valid_feats}

    comparison = []
    unique_labels = sorted(set(labels))

    for lbl in unique_labels:
        mask = labels == lbl
        seg_df = df[mask]
        count = int(mask.sum())
        pct = round(count / max(1, len(df)) * 100, 2)

        feat_metrics = {}
        for f in valid_feats:
            seg_mean = float(seg_df[f].mean()) if count > 0 else 0.0
            base_mean = baseline[f]
            diff_pct = round(((seg_mean - base_mean) / base_mean) * 100, 2) if base_mean != 0 else 0.0
            feat_metrics[f] = {
                "mean": round(seg_mean, 2),
                "baseline_mean": round(base_mean, 2),
                "diff_percentage": diff_pct,
            }

        comparison.append({
            "cluster_label": int(lbl),
            "segment_name": f"Cluster {lbl}" if lbl >= 0 else "Noise / Outliers",
            "customer_count": count,
            "percentage": pct,
            "features": feat_metrics,
        })

    return comparison
