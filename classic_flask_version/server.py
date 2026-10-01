import os
import sys
import json
import pandas as pd
import numpy as np
from flask import Flask, render_template, request, jsonify

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.preprocessing import DataPreprocessor
from src.eda import EDAnalyzer
from src.clustering import ClusteringPipeline
from src.evaluation import ModelEvaluator
from src.segmentation import SegmentAnalyzer
from sklearn.decomposition import PCA

app = Flask(__name__, template_folder='templates', static_folder='static')

# Global cache for dataset and preprocessor
DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'customers.csv')
preprocessor = DataPreprocessor()
pipeline = ClusteringPipeline()
analyzer = SegmentAnalyzer()

def load_current_dataframe():
    if os.path.exists(DATA_PATH):
        return pd.read_csv(DATA_PATH)
    else:
        from data.generate_dataset import generate_customer_dataset
        df = generate_customer_dataset(400)
        os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
        df.to_csv(DATA_PATH, index=False)
        return df

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/stats', methods=['GET'])
def get_stats():
    df = load_current_dataframe()
    df_clean = preprocessor.clean_data(df)
    
    return jsonify({
        "total_customers": int(len(df_clean)),
        "avg_income": round(float(df_clean['Annual Income (k$)'].mean()), 2) if 'Annual Income (k$)' in df_clean.columns else 0,
        "avg_spending": round(float(df_clean['Spending Score (1-100)'].mean()), 2) if 'Spending Score (1-100)' in df_clean.columns else 0,
        "avg_frequency": round(float(df_clean['Purchase Frequency (per year)'].mean()), 2) if 'Purchase Frequency (per year)' in df_clean.columns else 0,
        "missing_values": int(df.isnull().sum().sum()),
        "duplicates": int(df.duplicated().sum())
    })

@app.route('/api/data', methods=['GET'])
def get_data():
    df = load_current_dataframe()
    df_clean = preprocessor.clean_data(df)
    records = df_clean.head(100).to_dict(orient='records')
    columns = list(df_clean.columns)
    return jsonify({"columns": columns, "records": records, "total_rows": len(df_clean)})

@app.route('/api/eda', methods=['GET'])
def get_eda():
    df = load_current_dataframe()
    df_clean = preprocessor.clean_data(df)
    
    numeric_cols = ['Age', 'Annual Income (k$)', 'Spending Score (1-100)', 'Purchase Frequency (per year)']
    corr = df_clean[numeric_cols].corr().round(2).to_dict()
    
    return jsonify({
        "income": df_clean['Annual Income (k$)'].tolist(),
        "spending": df_clean['Spending Score (1-100)'].tolist(),
        "age": df_clean['Age'].tolist(),
        "frequency": df_clean['Purchase Frequency (per year)'].tolist() if 'Purchase Frequency (per year)' in df_clean.columns else [],
        "gender": df_clean['Gender'].value_counts().to_dict() if 'Gender' in df_clean.columns else {},
        "correlation": corr
    })

@app.route('/api/cluster', methods=['POST'])
def run_cluster():
    payload = request.get_json() or {}
    algo = payload.get('algorithm', 'K-Means')
    n_clusters = int(payload.get('n_clusters', 4))
    eps = float(payload.get('eps', 0.75))
    min_samples = int(payload.get('min_samples', 5))

    df = load_current_dataframe()
    df_clean = preprocessor.clean_data(df)
    df_encoded = preprocessor.encode_categorical(df_clean)

    feature_cols = ['Age', 'Annual Income (k$)', 'Spending Score (1-100)', 'Purchase Frequency (per year)']
    X_scaled, _, _ = preprocessor.prepare_features(df_encoded, feature_cols)

    if algo == 'K-Means':
        labels, model, centers = pipeline.fit_kmeans(X_scaled, n_clusters=n_clusters)
    elif algo == 'Hierarchical':
        labels, model = pipeline.fit_hierarchical(X_scaled, n_clusters=n_clusters)
    else:
        labels, model, noise_cnt = pipeline.fit_dbscan(X_scaled, eps=eps, min_samples=min_samples)

    eval_metrics = ModelEvaluator.calculate_metrics(X_scaled, labels)

    # Compute PCA 2D
    pca = PCA(n_components=2)
    pca_2d = pca.fit_transform(X_scaled).tolist()

    df_clean['Cluster'] = labels
    stats = analyzer.compute_cluster_stats(df_clean, labels)
    seg_names = analyzer.generate_segment_names(stats)
    stats['Segment Name'] = stats['Cluster'].map(seg_names)

    recommendations = analyzer.generate_business_recommendations(stats, seg_names)

    # Format points for Plotly frontend
    points = []
    for idx, row in df_clean.iterrows():
        points.append({
            "id": int(row.get('CustomerID', idx + 1)),
            "age": int(row['Age']),
            "income": float(row['Annual Income (k$)']),
            "spending": float(row['Spending Score (1-100)']),
            "freq": float(row.get('Purchase Frequency (per year)', 0)),
            "cluster": int(row['Cluster']),
            "segment": seg_names.get(int(row['Cluster']), f"Cluster {row['Cluster']}"),
            "pc1": round(float(pca_2d[idx][0]), 3),
            "pc2": round(float(pca_2d[idx][1]), 3)
        })

    return jsonify({
        "algorithm": algo,
        "n_clusters": int(eval_metrics['n_clusters']),
        "silhouette": eval_metrics['silhouette'],
        "davies_bouldin": eval_metrics['davies_bouldin'],
        "calinski_harabasz": eval_metrics['calinski_harabasz'],
        "noise_ratio": eval_metrics['noise_ratio'],
        "cluster_summary": stats.to_dict(orient='records'),
        "recommendations": recommendations,
        "points": points
    })

@app.route('/api/upload', methods=['POST'])
def upload_csv():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    try:
        df = pd.read_csv(file)
        os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
        df.to_csv(DATA_PATH, index=False)
        return jsonify({"message": f"Successfully uploaded {len(df)} rows."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"[START] Customer AI Web Portal running on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
