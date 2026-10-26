from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from fastapi.responses import StreamingResponse
import pandas as pd
import io
import os
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from app.models.schemas import (
    EDAOverviewResponse, KMeansParams, HierarchicalParams, DBSCANParams,
    ClusteringResult, ModelComparisonResponse, InsightsResponse
)
from app.services.ml_service import (
    validate_and_clean_data, get_eda_overview, process_clustering,
    compare_clustering_models, generate_insights_and_profiles,
    get_numeric_features
)

class PreprocessParams(BaseModel):
    fill_missing: Optional[bool] = True
    missing_strategy: Optional[str] = "median"
    drop_duplicates: Optional[bool] = True
    scale_type: Optional[str] = "standard"
    selected_features: Optional[List[str]] = None

router = APIRouter()

# Global state for uploaded or active dataset
CURRENT_DATASET: Dict[str, Any] = {"df": None, "name": "demo_customers.csv"}

def find_demo_path() -> str:
    candidates = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "demo_customers.csv")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "demo_customers.csv")),
        os.path.abspath("data/demo_customers.csv"),
        os.path.abspath("../data/demo_customers.csv")
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return candidates[0]

DEMO_PATH = find_demo_path()

def get_active_dataframe() -> pd.DataFrame:
    """Retrieve active DataFrame or load default demo dataset."""
    if CURRENT_DATASET["df"] is not None:
        return CURRENT_DATASET["df"]
    
    if os.path.exists(DEMO_PATH):
        df = pd.read_csv(DEMO_PATH)
        CURRENT_DATASET["df"] = df
        CURRENT_DATASET["name"] = "demo_customers.csv"
        return df
    else:
        raise HTTPException(status_code=400, detail="No dataset uploaded and demo dataset file not found.")

@router.get("/health")
def health_check():
    return {"status": "online", "active_dataset": CURRENT_DATASET["name"], "version": "1.0.0"}

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload custom CSV file and validate customer features."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a valid CSV file.")
        
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        if len(df) < 10:
            raise HTTPException(status_code=400, detail="Uploaded dataset must contain at least 10 customer records.")
            
        df_clean, quality = validate_and_clean_data(df)
        
        if len(quality["numeric_columns"]) < 2:
            raise HTTPException(
                status_code=400,
                detail="Dataset must contain at least 2 numerical customer features (e.g. Age, Income, Spending Score, Purchase Frequency)."
            )
            
        CURRENT_DATASET["df"] = df_clean
        CURRENT_DATASET["name"] = file.filename
        
        return {
            "message": "Dataset uploaded and validated successfully.",
            "filename": file.filename,
            "quality": quality
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process CSV file: {str(e)}")

@router.get("/demo")
def load_demo_dataset():
    """Load default synthetic demo customer dataset."""
    if os.path.exists(DEMO_PATH):
        df = pd.read_csv(DEMO_PATH)
        df_clean, quality = validate_and_clean_data(df)
        CURRENT_DATASET["df"] = df_clean
        CURRENT_DATASET["name"] = "demo_customers.csv"
        return {
            "message": "Demo dataset loaded successfully.",
            "filename": "demo_customers.csv",
            "quality": quality
        }
    else:
        raise HTTPException(status_code=404, detail="Demo dataset file not found.")

@router.get("/analysis", response_model=EDAOverviewResponse)
def get_analysis():
    """Get EDA summary, quality stats, distribution histograms, and correlations."""
    df = get_active_dataframe()
    eda_data = get_eda_overview(df)
    return eda_data

@router.post("/preprocess")
def preprocess_dataset(params: PreprocessParams = Body(...)):
    """Apply preprocessing steps: imputation, duplicate removal, feature selection, and scaling."""
    df = get_active_dataframe().copy()
    raw_df = df.copy()
    
    try:
        from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler
        import numpy as np

        df_clean, raw_quality = validate_and_clean_data(df)
        raw_sample = raw_df.head(5).fillna("").to_dict(orient="records")
        
        pipeline_flow = []
        
        # Stage 1: Ingestion
        pipeline_flow.append({
            "stage_id": "ingestion",
            "title": "Data Ingestion",
            "status": "completed",
            "summary": f"Loaded {raw_quality['total_rows']} rows × {raw_quality['total_columns']} columns",
            "details": {"rows": raw_quality["total_rows"], "columns": raw_quality["total_columns"]}
        })
        
        # Stage 2: Missing values
        missing_before = int(raw_df.isnull().sum().sum())
        fill_strategy = params.missing_strategy or "median"
        numeric_cols = get_numeric_features(df_clean)
        
        if params.fill_missing and missing_before > 0:
            for col in numeric_cols:
                if fill_strategy == "mean":
                    df_clean[col] = df_clean[col].fillna(df_clean[col].mean())
                elif fill_strategy == "remove":
                    df_clean = df_clean.dropna(subset=numeric_cols)
                else:
                    df_clean[col] = df_clean[col].fillna(df_clean[col].median())
                    
        pipeline_flow.append({
            "stage_id": "missing",
            "title": "Missing Value Treatment",
            "status": "completed" if params.fill_missing else "skipped",
            "summary": f"Imputed {missing_before} missing values using '{fill_strategy}' strategy" if params.fill_missing and missing_before > 0 else f"No missing values detected ({missing_before})",
            "details": {"missing_before": missing_before, "strategy": fill_strategy}
        })
        
        # Stage 3: Duplicates
        dup_count = int(df_clean.duplicated().sum())
        if params.drop_duplicates and dup_count > 0:
            df_clean = df_clean.drop_duplicates()
            
        pipeline_flow.append({
            "stage_id": "duplicates",
            "title": "Duplicate Removal",
            "status": "completed" if params.drop_duplicates else "skipped",
            "summary": f"Removed {dup_count} duplicate rows" if params.drop_duplicates and dup_count > 0 else f"No duplicates found ({dup_count})",
            "details": {"duplicates_removed": dup_count if params.drop_duplicates else 0}
        })
        
        # Stage 4: Feature selection
        selected = params.selected_features if params.selected_features else numeric_cols
        selected = [f for f in selected if f in df_clean.columns]
        if len(selected) < 2:
            selected = numeric_cols[:max(2, len(numeric_cols))]
            
        pipeline_flow.append({
            "stage_id": "feature_selection",
            "title": "Feature Selection",
            "status": "completed",
            "summary": f"Selected {len(selected)} features: {', '.join(selected)}",
            "details": {"selected_features": selected, "available_features": numeric_cols}
        })
        
        # Stage 5: Scaling
        scale_type = params.scale_type or "standard"
        if scale_type == "minmax":
            scaler = MinMaxScaler()
            scaler_name = "Min-Max Scaler [0,1]"
        elif scale_type == "robust":
            scaler = RobustScaler()
            scaler_name = "Robust Scaler (IQR-based)"
        else:
            scaler = StandardScaler()
            scaler_name = "Standard Scaler (Z-score)"
            
        X_scaled = scaler.fit_transform(df_clean[selected].values)
        df_scaled = df_clean.copy()
        for i, col in enumerate(selected):
            df_scaled[col] = X_scaled[:, i]
            
        CURRENT_DATASET["df"] = df_scaled
        
        pipeline_flow.append({
            "stage_id": "scaling",
            "title": "Feature Scaling",
            "status": "completed",
            "summary": f"Applied {scaler_name} to {len(selected)} features",
            "details": {"scaler": scale_type, "features_scaled": selected}
        })
        
        # Build clean quality info
        clean_quality = {
            "total_rows": len(df_clean),
            "total_columns": len(df_clean.columns),
            "missing_values": int(df_clean.isnull().sum().sum()),
            "duplicate_rows": int(df_clean.duplicated().sum()),
            "numeric_columns": selected,
            "categorical_columns": raw_quality.get("categorical_columns", [])
        }
        
        clean_sample = df_scaled[selected].head(5).round(4).to_dict(orient="records")
        
        return {
            "message": "Preprocessing pipeline applied successfully.",
            "raw_info": raw_quality,
            "clean_info": clean_quality,
            "selected_features": selected,
            "pipeline_flow": pipeline_flow,
            "raw_sample": raw_sample,
            "clean_sample": clean_sample
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Preprocessing failed: {str(e)}")

@router.post("/cluster/kmeans", response_model=ClusteringResult)
def run_kmeans(params: KMeansParams = Body(...)):
    """Run K-Means clustering algorithm."""
    df = get_active_dataframe()
    try:
        result = process_clustering(df, "kmeans", params.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"K-Means execution failed: {str(e)}")

@router.post("/cluster/hierarchical", response_model=ClusteringResult)
def run_hierarchical(params: HierarchicalParams = Body(...)):
    """Run Agglomerative Hierarchical clustering."""
    df = get_active_dataframe()
    try:
        result = process_clustering(df, "hierarchical", params.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Hierarchical clustering failed: {str(e)}")

@router.post("/cluster/dbscan", response_model=ClusteringResult)
def run_dbscan(params: DBSCANParams = Body(...)):
    """Run DBSCAN density-based clustering."""
    df = get_active_dataframe()
    try:
        result = process_clustering(df, "dbscan", params.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"DBSCAN execution failed: {str(e)}")

@router.post("/compare-models", response_model=ModelComparisonResponse)
def compare_models():
    """Compare K-Means, Hierarchical, and DBSCAN algorithms side-by-side."""
    df = get_active_dataframe()
    try:
        comparison = compare_clustering_models(df)
        return comparison
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Model comparison failed: {str(e)}")

@router.post("/insights", response_model=InsightsResponse)
def get_insights(clustering_result: Dict[str, Any] = Body(...)):
    """Generate business insights and marketing recommendations for clusters."""
    df = get_active_dataframe()
    try:
        insights = generate_insights_and_profiles(clustering_result, df)
        return insights
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Insights generation failed: {str(e)}")

@router.post("/export")
def export_segmented_csv(clustering_result: Dict[str, Any] = Body(...)):
    """Export dataset with Cluster ID, Segment Name, and Description attached as a CSV stream."""
    df = get_active_dataframe().copy()
    points = clustering_result.get("points", [])
    
    if not points:
        raise HTTPException(status_code=400, detail="No cluster points provided for export.")
        
    cluster_map = {p["customer_id"]: (p["cluster_id"], p["segment_name"]) for p in points}
    
    # Match by CustomerID or index
    id_col = next((c for c in df.columns if c.lower().replace("_", "") in {"customerid", "customer_id", "id"}), None)
    
    cluster_ids = []
    segment_names = []
    
    for idx, row in df.iterrows():
        cust_key = str(row[id_col]) if id_col else f"CUST-{idx + 1001}"
        c_tuple = cluster_map.get(cust_key, (-1, "Uncategorized"))
        cluster_ids.append(c_tuple[0])
        segment_names.append(c_tuple[1])
        
    df["Cluster_ID"] = cluster_ids
    df["Segment_Name"] = segment_names
    
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    
    headers = {
        'Content-Disposition': 'attachment; filename="segmentiq_customers_segmented.csv"'
    }
    return StreamingResponse(io.BytesIO(output.getvalue().encode()), media_type="text/csv", headers=headers)
