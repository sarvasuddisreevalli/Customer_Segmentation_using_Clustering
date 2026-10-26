"""
preprocessor.py
---------------
Data cleaning, feature engineering, and preprocessing pipeline.
Uses scikit-learn primitives (SimpleImputer, StandardScaler, etc.).
"""

import uuid
import math
import warnings
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, RobustScaler, MinMaxScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

# ── constants ───────────────────────────────────────────────────────────────
ID_KEYWORDS = {"id", "customerid", "customer_id", "index", "rowid", "row_id"}
HIGH_CARDINALITY_THRESHOLD = 50   # unique values
MAX_ONEHOT_CATEGORIES = 20        # max categories before we skip OHE
MAX_ROWS = 100_000
MAX_COLS = 500

# ── helpers ──────────────────────────────────────────────────────────────────

def _is_id_column(col: str) -> bool:
    return col.lower().replace(" ", "").replace("_", "") in ID_KEYWORDS


def _detect_column_types(df: pd.DataFrame) -> Dict[str, List[str]]:
    """Return numeric, categorical, id, and datetime column lists."""
    numeric, categorical, id_cols, datetime_cols = [], [], [], []

    for col in df.columns:
        if _is_id_column(col):
            id_cols.append(col)
            continue
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            datetime_cols.append(col)
        elif pd.api.types.is_numeric_dtype(df[col]):
            numeric.append(col)
        else:
            categorical.append(col)

    return {
        "numeric": numeric,
        "categorical": categorical,
        "id_cols": id_cols,
        "datetime_cols": datetime_cols,
    }


def _outlier_summary(series: pd.Series) -> Dict[str, Any]:
    """Return IQR-based outlier counts for a numeric series."""
    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    n_out = int(((series < lower) | (series > upper)).sum())
    return {
        "q1": round(float(q1), 4),
        "q3": round(float(q3), 4),
        "iqr": round(float(iqr), 4),
        "lower_fence": round(float(lower), 4),
        "upper_fence": round(float(upper), 4),
        "n_outliers": n_out,
        "pct_outliers": round(n_out / max(len(series), 1) * 100, 2),
    }

# ── dataset validation ───────────────────────────────────────────────────────

def validate_dataset(df: pd.DataFrame, filename: str = "upload.csv") -> Dict[str, Any]:
    """
    Validate basic dataset requirements.
    Returns a dict with 'valid': bool, 'errors': list, 'warnings': list.
    """
    errors, warnings_list = [], []

    if df.empty:
        errors.append("Uploaded dataset is empty.")
    if len(df) < 5:
        errors.append(f"Dataset has only {len(df)} row(s). Minimum 5 required.")
    if len(df) > MAX_ROWS:
        errors.append(f"Dataset has {len(df):,} rows. Maximum supported is {MAX_ROWS:,}.")
    if len(df.columns) > MAX_COLS:
        errors.append(f"Dataset has {len(df.columns)} columns. Maximum supported is {MAX_COLS}.")

    # Duplicate column names
    if len(df.columns) != len(set(df.columns)):
        dupes = [c for c in df.columns if list(df.columns).count(c) > 1]
        errors.append(f"Duplicate column names detected: {list(set(dupes))}")

    col_types = _detect_column_types(df) if len(errors) == 0 else {"numeric": [], "categorical": [], "datetime": [], "text": []}
    if len(col_types["numeric"]) < 1 and len(errors) == 0:
        errors.append("No numeric columns detected. At least 1 numeric feature is required for clustering.")

    if len(col_types["numeric"]) < 2 and len(errors) == 0:
        warnings_list.append("Only 1 numeric column found. At least 2 numeric features are recommended for meaningful clustering.")

    # All-null columns
    if len(errors) == 0:
        all_null_cols = [c for c in df.columns if df[c].isnull().all()]
        if all_null_cols:
            warnings_list.append(f"Columns with ALL missing values: {all_null_cols}. They will be dropped.")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings_list,
        "col_types": col_types,
    }

# ── dataset preview ──────────────────────────────────────────────────────────

def build_preview(df: pd.DataFrame) -> Dict[str, Any]:
    """Build the dataset preview dict returned after upload."""
    col_types = _detect_column_types(df)

    missing_per_col = df.isnull().sum().to_dict()
    missing_per_col = {k: int(v) for k, v in missing_per_col.items()}

    dtype_map = {col: str(df[col].dtype) for col in df.columns}

    # Numeric summary stats
    numeric_stats = []
    for col in col_types["numeric"]:
        s = df[col].dropna()
        if len(s) == 0:
            continue
        numeric_stats.append({
            "column": col,
            "count": int(s.count()),
            "mean": round(float(s.mean()), 4),
            "median": round(float(s.median()), 4),
            "std": round(float(s.std()), 4),
            "min": round(float(s.min()), 4),
            "max": round(float(s.max()), 4),
            "missing": int(df[col].isnull().sum()),
        })

    # Categorical summary
    cat_stats = []
    for col in col_types["categorical"]:
        vc = df[col].value_counts()
        cat_stats.append({
            "column": col,
            "unique_values": int(df[col].nunique()),
            "top_values": vc.head(5).to_dict(),
            "missing": int(df[col].isnull().sum()),
        })

    # Safe sample records (convert everything to str-safe types)
    sample = df.head(10).copy()
    for col in sample.select_dtypes(include=["datetime64"]).columns:
        sample[col] = sample[col].astype(str)
    sample_records = sample.where(pd.notnull(sample), None).to_dict(orient="records")

    return {
        "n_rows": len(df),
        "n_cols": len(df.columns),
        "columns": list(df.columns),
        "dtypes": dtype_map,
        "missing_per_col": missing_per_col,
        "total_missing": int(df.isnull().sum().sum()),
        "duplicate_rows": int(df.duplicated().sum()),
        "numeric_columns": col_types["numeric"],
        "categorical_columns": col_types["categorical"],
        "id_columns": col_types["id_cols"],
        "datetime_columns": col_types["datetime_cols"],
        "numeric_stats": numeric_stats,
        "categorical_stats": cat_stats,
        "sample_records": sample_records,
    }

# ── EDA ──────────────────────────────────────────────────────────────────────

def compute_eda(df: pd.DataFrame) -> Dict[str, Any]:
    """Compute full exploratory data analysis on the DataFrame."""
    col_types = _detect_column_types(df)
    numeric_cols = col_types["numeric"]

    # Distributions (binned histograms)
    distributions: Dict[str, List[Dict]] = {}
    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) == 0:
            continue
        n_bins = min(10, max(5, int(np.sqrt(len(series)))))
        counts, edges = np.histogram(series, bins=n_bins)
        bins = []
        for i in range(len(counts)):
            bins.append({
                "bin_label": f"{round(float(edges[i]), 2)}–{round(float(edges[i+1]), 2)}",
                "count": int(counts[i]),
                "range_start": round(float(edges[i]), 4),
                "range_end": round(float(edges[i+1]), 4),
            })
        distributions[col] = bins

    # Correlations
    correlations = []
    if len(numeric_cols) >= 2:
        corr = df[numeric_cols].corr(method="pearson")
        for i, c1 in enumerate(numeric_cols):
            for j, c2 in enumerate(numeric_cols):
                if i < j:
                    val = corr.loc[c1, c2]
                    if not math.isnan(val):
                        correlations.append({
                            "feature1": c1,
                            "feature2": c2,
                            "correlation": round(float(val), 4),
                        })

    # Outlier summary
    outlier_info = {}
    for col in numeric_cols:
        outlier_info[col] = _outlier_summary(df[col].dropna())

    # Summary stats
    stats = []
    for col in numeric_cols:
        s = df[col].dropna()
        if len(s) == 0:
            continue
        stats.append({
            "column": col,
            "count": int(s.count()),
            "mean": round(float(s.mean()), 4),
            "median": round(float(s.median()), 4),
            "std": round(float(s.std()), 4),
            "min": round(float(s.min()), 4),
            "max": round(float(s.max()), 4),
            "skew": round(float(s.skew()), 4),
            "kurtosis": round(float(s.kurtosis()), 4),
        })

    # Categorical distributions
    cat_dist: Dict[str, Any] = {}
    for col in col_types["categorical"][:10]:  # cap at 10 cat columns
        vc = df[col].value_counts().head(20)
        cat_dist[col] = [{"value": str(k), "count": int(v)} for k, v in vc.items()]

    # Dataset-level quality
    quality = {
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "total_missing": int(df.isnull().sum().sum()),
        "duplicate_rows": int(df.duplicated().sum()),
        "numeric_columns": numeric_cols,
        "categorical_columns": col_types["categorical"],
        "id_columns": col_types["id_cols"],
    }

    sample = df.head(10).copy()
    for col in sample.select_dtypes(include=["datetime64"]).columns:
        sample[col] = sample[col].astype(str)
    sample_records = sample.where(pd.notnull(sample), None).to_dict(orient="records")

    return {
        "quality": quality,
        "statistics": stats,
        "distributions": distributions,
        "correlations": correlations,
        "outlier_info": outlier_info,
        "categorical_distributions": cat_dist,
        "sample_records": sample_records,
    }

# ── preprocessing pipeline ────────────────────────────────────────────────────

def run_preprocessing(
    df: pd.DataFrame,
    selected_features: Optional[List[str]] = None,
    missing_strategy: str = "median",
    drop_duplicates: bool = True,
    scale_type: str = "standard",
    encode_categoricals: bool = False,
) -> Dict[str, Any]:
    """
    Apply the full preprocessing pipeline.

    Returns:
        {
            "X_scaled": np.ndarray,
            "feature_names": List[str],
            "pipeline": fitted sklearn Pipeline,
            "report": Dict describing every step,
            "df_clean": cleaned DataFrame (unscaled),
            "n_rows_raw": int,
            "n_rows_clean": int,
        }
    """
    report_steps = []
    raw_shape = df.shape
    df_work = df.copy()

    # ── Step 1: drop all-null columns
    all_null = [c for c in df_work.columns if df_work[c].isnull().all()]
    if all_null:
        df_work.drop(columns=all_null, inplace=True)
        report_steps.append({
            "stage": "drop_null_columns",
            "status": "completed",
            "detail": f"Dropped {len(all_null)} fully-null columns: {all_null}",
        })
    else:
        report_steps.append({
            "stage": "drop_null_columns",
            "status": "no_action",
            "detail": "No fully-null columns found.",
        })

    # ── Step 2: duplicate removal
    dup_before = int(df_work.duplicated().sum())
    if drop_duplicates and dup_before > 0:
        df_work.drop_duplicates(inplace=True)
        df_work.reset_index(drop=True, inplace=True)
        report_steps.append({
            "stage": "duplicate_removal",
            "status": "completed",
            "detail": f"Removed {dup_before} duplicate rows. Remaining: {len(df_work)}",
        })
    else:
        report_steps.append({
            "stage": "duplicate_removal",
            "status": "skipped" if not drop_duplicates else "no_action",
            "detail": f"{'Skipped by user.' if not drop_duplicates else 'No duplicates found.'}",
        })

    col_types = _detect_column_types(df_work)
    numeric_cols = col_types["numeric"]

    # ── Step 3: feature selection
    if selected_features:
        valid_sel = [f for f in selected_features if f in numeric_cols]
        if len(valid_sel) < 2:
            valid_sel = numeric_cols  # fallback
        feature_cols = valid_sel
    else:
        feature_cols = numeric_cols

    if len(feature_cols) < 2:
        raise ValueError(
            f"Need at least 2 numeric features for clustering, found {len(feature_cols)}: {feature_cols}"
        )

    report_steps.append({
        "stage": "feature_selection",
        "status": "completed",
        "detail": f"Selected {len(feature_cols)} numeric features: {feature_cols}",
        "features": feature_cols,
    })

    # ── Step 4: imputation
    missing_before = int(df_work[feature_cols].isnull().sum().sum())
    strategy_map = {"median": "median", "mean": "mean", "most_frequent": "most_frequent"}
    sk_strategy = strategy_map.get(missing_strategy, "median")

    imputer = SimpleImputer(strategy=sk_strategy)
    X_imputed = imputer.fit_transform(df_work[feature_cols].values)

    missing_after = int(np.isnan(X_imputed).sum())
    report_steps.append({
        "stage": "imputation",
        "status": "completed",
        "detail": (
            f"Imputed {missing_before} missing values using '{sk_strategy}'. "
            f"Missing after: {missing_after}"
        ),
        "strategy": sk_strategy,
        "missing_before": missing_before,
        "missing_after": missing_after,
    })

    # ── Step 5: scaling
    if scale_type == "minmax":
        scaler = MinMaxScaler()
        scaler_label = "Min-Max [0,1]"
    elif scale_type == "robust":
        scaler = RobustScaler()
        scaler_label = "Robust (IQR-based)"
    else:
        scaler = StandardScaler()
        scaler_label = "Standard (Z-score)"

    X_scaled = scaler.fit_transform(X_imputed)

    report_steps.append({
        "stage": "scaling",
        "status": "completed",
        "detail": f"Applied {scaler_label} to {len(feature_cols)} features.",
        "scaler": scale_type,
        "features_scaled": feature_cols,
    })

    # ── Build clean df for inspection (unscaled, imputed)
    df_clean = df_work.copy()
    df_clean[feature_cols] = X_imputed

    # ── Build clean sample
    clean_sample = pd.DataFrame(X_imputed, columns=feature_cols).head(5).round(4)
    scaled_sample = pd.DataFrame(X_scaled, columns=feature_cols).head(5).round(4)

    raw_info = {
        "n_rows": raw_shape[0],
        "n_cols": raw_shape[1],
        "missing_values": int(df.isnull().sum().sum()),
        "duplicate_rows": int(df.duplicated().sum()),
        "numeric_columns": numeric_cols,
        "categorical_columns": col_types["categorical"],
    }

    clean_info = {
        "n_rows": len(df_work),
        "n_cols": len(df_work.columns),
        "missing_values": missing_after,
        "duplicate_rows": 0,
        "numeric_columns": feature_cols,
        "categorical_columns": col_types["categorical"],
    }

    return {
        "X_scaled": X_scaled,
        "X_imputed": X_imputed,
        "feature_names": feature_cols,
        "imputer": imputer,
        "scaler": scaler,
        "report": {
            "raw_shape": list(raw_shape),
            "clean_shape": [len(df_work), len(df_work.columns)],
            "steps": report_steps,
            "selected_features": feature_cols,
            "scale_type": scale_type,
            "missing_strategy": missing_strategy,
        },
        "df_clean": df_work,
        "df_imputed": df_clean,
        "raw_info": raw_info,
        "clean_info": clean_info,
        "raw_sample": df.head(5).where(pd.notnull(df.head(5)), None).to_dict(orient="records"),
        "clean_sample": clean_sample.to_dict(orient="records"),
        "scaled_sample": scaled_sample.to_dict(orient="records"),
        "pipeline_flow": [
            {
                "stage_id": s["stage"],
                "title": s["stage"].replace("_", " ").title(),
                "status": s["status"],
                "summary": s["detail"],
                "details": s,
            }
            for s in report_steps
        ],
    }
