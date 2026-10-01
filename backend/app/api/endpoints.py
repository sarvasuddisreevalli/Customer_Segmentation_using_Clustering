from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from fastapi.responses import StreamingResponse
import pandas as pd
import io
import os
from typing import Dict, Any, Optional, List
from app.models.schemas import (
    EDAOverviewResponse, KMeansParams, HierarchicalParams, DBSCANParams,
    ClusteringResult, ModelComparisonResponse, InsightsResponse
)
from app.services.ml_service import (
    validate_and_clean_data, get_eda_overview, process_clustering,
    compare_clustering_models, generate_insights_and_profiles
)

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
