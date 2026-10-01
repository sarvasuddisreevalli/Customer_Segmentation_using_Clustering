from fastapi.testclient import TestClient
from app.main import app
import io

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_demo_load():
    response = client.get("/api/demo")
    assert response.status_code == 200
    assert response.json()["filename"] == "demo_customers.csv"

def test_analysis():
    response = client.get("/api/analysis")
    assert response.status_code == 200
    data = response.json()
    assert "quality" in data
    assert "statistics" in data
    assert data["quality"]["total_rows"] >= 300

def test_kmeans():
    response = client.post("/api/cluster/kmeans", json={"n_clusters": 4})
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm"] == "kmeans"
    assert len(data["points"]) > 0
    assert len(data["cluster_summaries"]) == 4

def test_hierarchical():
    response = client.post("/api/cluster/hierarchical", json={"n_clusters": 4, "linkage": "ward"})
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm"] == "hierarchical"
    assert len(data["points"]) > 0
    assert len(data["cluster_summaries"]) == 4

def test_dbscan():
    response = client.post("/api/cluster/dbscan", json={"eps": 0.6, "min_samples": 5})
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm"] == "dbscan"
    assert len(data["points"]) > 0

def test_compare_models():
    response = client.post("/api/compare-models", json={})
    assert response.status_code == 200
    data = response.json()
    assert len(data["comparison_table"]) == 3
    assert data["recommended_model"] in ["K-Means", "Hierarchical Clustering", "DBSCAN"]

def test_insights():
    km_res = client.post("/api/cluster/kmeans", json={"n_clusters": 4}).json()
    response = client.post("/api/insights", json=km_res)
    assert response.status_code == 200
    data = response.json()
    assert "highest_value_segment" in data
    assert "largest_segment" in data
    assert "all_profiles" in data

def test_export():
    km_res = client.post("/api/cluster/kmeans", json={"n_clusters": 4}).json()
    response = client.post("/api/export", json=km_res)
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert "Cluster_ID" in response.text

def test_upload_csv():
    csv_content = (
        "CustomerID,Gender,Age,Annual_Income,Spending_Score,Purchase_Frequency\n"
        "CUST-001,Male,25,45,60,12\n"
        "CUST-002,Female,34,70,85,24\n"
        "CUST-003,Male,52,30,20,5\n"
        "CUST-004,Female,29,88,92,30\n"
        "CUST-005,Male,41,65,50,15\n"
        "CUST-006,Female,60,25,15,4\n"
        "CUST-007,Male,22,40,75,18\n"
        "CUST-008,Female,38,95,90,28\n"
        "CUST-009,Male,48,55,40,10\n"
        "CUST-010,Female,31,60,65,16\n"
    )
    files = {"file": ("test_upload.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/api/upload", files=files)
    assert response.status_code == 200
    assert response.json()["filename"] == "test_upload.csv"
