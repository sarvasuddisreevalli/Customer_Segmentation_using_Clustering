import os
import io
import datetime
from flask import Blueprint, request, jsonify, send_file
import pandas as pd
import numpy as np

from database.db import get_db
from preprocessing.cleaner import inspect_dataset, preprocess_dataset
from clustering.models import run_kmeans, run_hierarchical, run_dbscan, compute_pca_projection
from models.segment_profiler import (
    generate_segment_profiles,
    generate_business_insights,
    generate_customer_profile_comparison
)

api_bp = Blueprint('api', __name__)

class AppState:
    def __init__(self):
        self.load_kaggle_sample()

    def load_kaggle_sample(self):
        sample_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'datasets', 'mall_customers.csv')
        self.raw_df = pd.read_csv(sample_path)
        self.dataset_name = "Mall_Customers.csv"
        self.selected_features = ['Age', 'Annual Income', 'Spending Score']
        self.clean_df, self.X_scaled, self.selected_features, self.scaler = preprocess_dataset(
            self.raw_df, selected_features=self.selected_features
        )
        self.active_algorithm = "K-Means"
        self.model_results = run_kmeans(self.X_scaled, n_clusters=4)
        self.update_active_clusters(self.model_results['labels'])

        db = get_db()
        db.save_dataset({
            'dataset_name': self.dataset_name,
            'row_count': len(self.raw_df),
            'feature_list': list(self.raw_df.columns)
        })

    def update_active_clusters(self, labels):
        self.clean_df['Cluster'] = labels
        self.segments = generate_segment_profiles(self.clean_df, labels, self.selected_features)
        self.insights = generate_business_insights(self.segments)
        self.pca_results = compute_pca_projection(self.X_scaled)

state = AppState()

@api_bp.route('/dataset', methods=['GET'])
def get_dataset():
    try:
        raw_info = inspect_dataset(state.raw_df)
        clean_info = inspect_dataset(state.clean_df)
        preview = state.raw_df.head(50).to_dict(orient='records')
        return jsonify({
            'dataset_name': state.dataset_name,
            'filename': state.dataset_name,
            'raw_info': raw_info,
            'clean_info': clean_info,
            'selected_features': state.selected_features,
            'preview': preview,
            'sample_records': preview
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/dataset/upload', methods=['POST'])
@api_bp.route('/upload', methods=['POST'])
def upload_dataset():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part in the request'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'Invalid file format. Please upload a valid CSV file.'}), 400

        df = pd.read_csv(file)
        if len(df) < 5:
            return jsonify({'error': 'Dataset too small. Please upload a dataset with at least 5 rows.'}), 400

        state.raw_df = df
        state.dataset_name = file.filename
        state.clean_df, state.X_scaled, state.selected_features, state.scaler = preprocess_dataset(df)
        state.active_algorithm = "K-Means"
        state.model_results = run_kmeans(state.X_scaled, n_clusters=4)
        state.update_active_clusters(state.model_results['labels'])

        db = get_db()
        db.save_dataset({
            'dataset_name': state.dataset_name,
            'row_count': len(df),
            'feature_list': list(df.columns)
        })

        preview = state.raw_df.head(50).to_dict(orient='records')
        return jsonify({
            'message': 'CSV Dataset uploaded successfully!',
            'dataset_name': state.dataset_name,
            'filename': state.dataset_name,
            'raw_info': inspect_dataset(state.raw_df),
            'clean_info': inspect_dataset(state.clean_df),
            'selected_features': state.selected_features,
            'preview': preview,
            'sample_records': preview
        })
    except Exception as e:
        return jsonify({'error': f"Failed to upload CSV: {str(e)}"}), 500

@api_bp.route('/dataset/sample', methods=['POST', 'GET'])
@api_bp.route('/demo', methods=['POST', 'GET'])
def load_sample():
    try:
        state.load_kaggle_sample()
        preview = state.raw_df.head(50).to_dict(orient='records')
        return jsonify({
            'message': 'Authentic Kaggle Mall Customers dataset loaded successfully!',
            'dataset_name': state.dataset_name,
            'filename': state.dataset_name,
            'raw_info': inspect_dataset(state.raw_df),
            'clean_info': inspect_dataset(state.clean_df),
            'selected_features': state.selected_features,
            'preview': preview,
            'sample_records': preview
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/dataset/clear', methods=['POST'])
def clear_dataset():
    try:
        state.load_kaggle_sample()
        return jsonify({'message': 'Dataset reset to sample configuration.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/preprocess', methods=['POST'])
def preprocess():
    try:
        data = request.get_json() or {}
        fill_missing = data.get('fill_missing', True)
        drop_duplicates = data.get('drop_duplicates', True)
        scale_type = data.get('scale_type', 'standard')
        selected_features = data.get('selected_features', None)

        state.clean_df, state.X_scaled, state.selected_features, state.scaler = preprocess_dataset(
            state.raw_df,
            selected_features=selected_features,
            fill_missing=fill_missing,
            drop_duplicates=drop_duplicates,
            scale_type=scale_type
        )
        
        if state.active_algorithm == 'K-Means':
            state.model_results = run_kmeans(state.X_scaled, n_clusters=state.model_results.get('n_clusters', 4))
        elif state.active_algorithm == 'Hierarchical':
            state.model_results = run_hierarchical(state.X_scaled, n_clusters=state.model_results.get('n_clusters', 4))
        else:
            state.model_results = run_dbscan(state.X_scaled)

        state.update_active_clusters(state.model_results['labels'])

        preview_raw = state.raw_df.head(50).to_dict(orient='records')
        preview_clean = state.clean_df.head(50).to_dict(orient='records')

        return jsonify({
            'message': 'Preprocessing completed successfully!',
            'raw_info': inspect_dataset(state.raw_df),
            'clean_info': inspect_dataset(state.clean_df),
            'selected_features': state.selected_features,
            'raw_preview': preview_raw,
            'clean_preview': preview_clean
        })
    except Exception as e:
        return jsonify({'error': f"Preprocessing failed: {str(e)}"}), 500

@api_bp.route('/eda', methods=['POST', 'GET'])
@api_bp.route('/analysis', methods=['POST', 'GET'])
def eda_analysis():
    try:
        data = request.get_json(silent=True) or {}
        x_col = data.get('x_col', 'Annual Income')
        y_col = data.get('y_col', 'Spending Score')

        clean_df = state.clean_df
        raw_df = state.raw_df
        numeric_cols = list(clean_df.select_dtypes(include=[np.number]).columns)
        if 'CustomerID' in numeric_cols:
            numeric_cols.remove('CustomerID')

        if x_col not in clean_df.columns:
            x_col = numeric_cols[0] if numeric_cols else 'Annual Income'
        if y_col not in clean_df.columns:
            y_col = numeric_cols[1] if len(numeric_cols) > 1 else x_col

        distributions = {}
        for col in numeric_cols:
            vals = clean_df[col].dropna().values
            if len(vals) > 0:
                counts, bin_edges = np.histogram(vals, bins=8)
                bins_data = []
                for i in range(len(counts)):
                    lbl = f"{np.round(bin_edges[i], 1)} - {np.round(bin_edges[i+1], 1)}"
                    bins_data.append({
                        'bin_label': lbl,
                        'bin': lbl,
                        'count': int(counts[i])
                    })
                distributions[col] = bins_data

        corr_matrix = clean_df[numeric_cols].corr().round(3).to_dict() if len(numeric_cols) > 1 else {}
        
        correlations_list = []
        if len(numeric_cols) > 1:
            corr = clean_df[numeric_cols].corr()
            for c1 in numeric_cols:
                for c2 in numeric_cols:
                    if c1 != c2:
                        correlations_list.append({
                            'feature1': c1,
                            'feature2': c2,
                            'correlation': float(np.round(corr.loc[c1, c2], 3))
                        })

        scatter_points = []
        req_cols = ['CustomerID', x_col, y_col]
        if 'Age' in clean_df.columns: req_cols.append('Age')
        if 'Cluster' in clean_df.columns: req_cols.append('Cluster')
        
        valid_cols = [c for c in req_cols if c in clean_df.columns]
        scatter_points = clean_df[valid_cols].to_dict(orient='records')

        statistics = []
        for col in numeric_cols:
            statistics.append({
                'column': col,
                'mean': float(np.round(clean_df[col].mean(), 2)),
                'median': float(np.round(clean_df[col].median(), 2)),
                'min': float(np.round(clean_df[col].min(), 2)),
                'max': float(np.round(clean_df[col].max(), 2)),
                'std': float(np.round(clean_df[col].std(), 2))
            })

        quality = {
            'total_rows': len(raw_df),
            'total_columns': len(raw_df.columns),
            'missing_values': int(raw_df.isnull().sum().sum()),
            'duplicate_rows': int(raw_df.duplicated().sum()),
            'numeric_columns': numeric_cols,
            'categorical_columns': list(raw_df.select_dtypes(exclude=[np.number]).columns)
        }

        sample_records = raw_df.head(50).to_dict(orient='records')

        return jsonify({
            'quality': quality,
            'statistics': statistics,
            'distributions': distributions,
            'correlations': correlations_list,
            'sample_records': sample_records,
            'numeric_columns': numeric_cols,
            'x_col': x_col,
            'y_col': y_col,
            'correlation_matrix': corr_matrix,
            'scatter_points': scatter_points,
            'raw_info': inspect_dataset(raw_df),
            'clean_info': inspect_dataset(clean_df),
            'selected_features': state.selected_features
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/clustering/kmeans', methods=['POST'])
def kmeans_clustering():
    try:
        data = request.get_json() or {}
        n_clusters = int(data.get('n_clusters', 4))

        results = run_kmeans(state.X_scaled, n_clusters=n_clusters)
        state.active_algorithm = "K-Means"
        state.model_results = results
        state.update_active_clusters(results['labels'])

        db = get_db()
        history_doc = db.save_analysis({
            'dataset_name': state.dataset_name,
            'algorithm': 'K-Means',
            'parameters': {'n_clusters': n_clusters},
            'n_clusters': results['n_clusters'],
            'silhouette_score': results['silhouette_score'],
            'cluster_profiles': state.segments,
            'points_count': len(state.clean_df)
        })

        return jsonify({
            'results': results,
            'segments': state.segments,
            'pca_results': state.pca_results,
            'points': state.clean_df.to_dict(orient='records'),
            'analysis_id': history_doc['_id']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/clustering/hierarchical', methods=['POST'])
def hierarchical_clustering():
    try:
        data = request.get_json() or {}
        n_clusters = int(data.get('n_clusters', 4))
        linkage_method = data.get('linkage', 'ward')

        results = run_hierarchical(state.X_scaled, n_clusters=n_clusters, linkage_method=linkage_method)
        state.active_algorithm = "Hierarchical"
        state.model_results = results
        state.update_active_clusters(results['labels'])

        db = get_db()
        history_doc = db.save_analysis({
            'dataset_name': state.dataset_name,
            'algorithm': 'Hierarchical',
            'parameters': {'n_clusters': n_clusters, 'linkage': linkage_method},
            'n_clusters': results['n_clusters'],
            'silhouette_score': results['silhouette_score'],
            'cluster_profiles': state.segments,
            'points_count': len(state.clean_df)
        })

        return jsonify({
            'results': results,
            'segments': state.segments,
            'pca_results': state.pca_results,
            'points': state.clean_df.to_dict(orient='records'),
            'analysis_id': history_doc['_id']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/clustering/dbscan', methods=['POST'])
def dbscan_clustering():
    try:
        data = request.get_json() or {}
        eps = float(data.get('eps', 0.5))
        min_samples = int(data.get('min_samples', 5))

        results = run_dbscan(state.X_scaled, eps=eps, min_samples=min_samples)
        state.active_algorithm = "DBSCAN"
        state.model_results = results
        state.update_active_clusters(results['labels'])

        db = get_db()
        history_doc = db.save_analysis({
            'dataset_name': state.dataset_name,
            'algorithm': 'DBSCAN',
            'parameters': {'eps': eps, 'min_samples': min_samples},
            'n_clusters': results['n_clusters'],
            'silhouette_score': results['silhouette_score'],
            'cluster_profiles': state.segments,
            'points_count': len(state.clean_df)
        })

        return jsonify({
            'results': results,
            'segments': state.segments,
            'pca_results': state.pca_results,
            'points': state.clean_df.to_dict(orient='records'),
            'analysis_id': history_doc['_id']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/evaluation/comparison', methods=['GET'])
def model_comparison():
    try:
        km = run_kmeans(state.X_scaled, n_clusters=4)
        hc = run_hierarchical(state.X_scaled, n_clusters=4)
        db_res = run_dbscan(state.X_scaled, eps=0.5, min_samples=5)

        comparison_matrix = [
            {
                'algorithm': 'K-Means',
                'n_clusters': km['n_clusters'],
                'silhouette_score': km['silhouette_score'],
                'inertia': km.get('inertia', '--'),
                'noise_points': 0,
                'observations': 'Partition-based clustering. Minimizes within-cluster variance. Best for spherical clusters.'
            },
            {
                'algorithm': 'Hierarchical',
                'n_clusters': hc['n_clusters'],
                'silhouette_score': hc['silhouette_score'],
                'inertia': '--',
                'noise_points': 0,
                'observations': 'Agglomerative bottom-up tree clustering. Reveals hierarchical distance relationships.'
            },
            {
                'algorithm': 'DBSCAN',
                'n_clusters': db_res['n_clusters'],
                'silhouette_score': db_res['silhouette_score'],
                'inertia': '--',
                'noise_points': db_res['n_noise'],
                'observations': f"Density-based clustering. Discovered {db_res['n_clusters']} clusters and isolated {db_res['n_noise']} noise points."
            }
        ]

        return jsonify({
            'comparison_matrix': comparison_matrix,
            'active_algorithm': state.active_algorithm
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/customers', methods=['GET'])
def get_customers():
    try:
        search = request.args.get('search', '').strip().lower()
        cluster_filter = request.args.get('cluster', 'all')
        age_min = float(request.args.get('age_min', 0))
        age_max = float(request.args.get('age_max', 100))
        income_min = float(request.args.get('income_min', 0))
        income_max = float(request.args.get('income_max', 1000))
        spending_min = float(request.args.get('spending_min', 0))
        spending_max = float(request.args.get('spending_max', 100))

        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))

        df_filtered = state.clean_df.copy()

        if 'Age' in df_filtered.columns:
            df_filtered = df_filtered[(df_filtered['Age'] >= age_min) & (df_filtered['Age'] <= age_max)]
        if 'Annual Income' in df_filtered.columns:
            df_filtered = df_filtered[(df_filtered['Annual Income'] >= income_min) & (df_filtered['Annual Income'] <= income_max)]
        if 'Spending Score' in df_filtered.columns:
            df_filtered = df_filtered[(df_filtered['Spending Score'] >= spending_min) & (df_filtered['Spending Score'] <= spending_max)]

        if cluster_filter != 'all':
            df_filtered = df_filtered[df_filtered['Cluster'] == int(cluster_filter)]

        if search:
            df_filtered = df_filtered[
                df_filtered['CustomerID'].astype(str).str.lower().str.contains(search)
            ]

        total_records = len(df_filtered)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_df = df_filtered.iloc[start_idx:end_idx]

        segment_map = {s['cluster_id']: s for s in state.segments}
        records = paginated_df.to_dict(orient='records')
        for r in records:
            seg = segment_map.get(r['Cluster'], None)
            r['cluster_name'] = seg['name'] if seg else f"Cluster {r['Cluster']}"

        return jsonify({
            'total': total_records,
            'page': page,
            'limit': limit,
            'total_pages': int(np.ceil(total_records / limit)) if total_records > 0 else 1,
            'customers': records
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/customer/<customer_id>', methods=['GET'])
def get_customer_profile(customer_id):
    try:
        df_clean = state.clean_df
        customer_row = df_clean[df_clean['CustomerID'].astype(str) == str(customer_id)]
        if len(customer_row) == 0:
            return jsonify({'error': 'Customer ID not found'}), 404

        cust_dict = customer_row.iloc[0].to_dict()
        cid = cust_dict.get('Cluster', 0)
        seg = next((s for s in state.segments if s['cluster_id'] == cid), None)

        comparison = generate_customer_profile_comparison(cust_dict, seg)

        return jsonify({
            'customer': cust_dict,
            'cluster_segment': seg,
            'comparison': comparison
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/segments', methods=['GET'])
def get_segments():
    try:
        return jsonify({
            'algorithm': state.active_algorithm,
            'segments': state.segments
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/insights', methods=['GET'])
def get_insights():
    try:
        return jsonify({
            'algorithm': state.active_algorithm,
            'insights': state.insights
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/history', methods=['GET'])
def get_history():
    try:
        db = get_db()
        history = db.get_history()
        return jsonify({'history': history})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/history/<analysis_id>', methods=['DELETE'])
def delete_history_item(analysis_id):
    try:
        db = get_db()
        db.delete_analysis(analysis_id)
        return jsonify({'message': 'Analysis history entry deleted.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/reports', methods=['GET'])
def export_reports():
    try:
        report_type = request.args.get('type', 'clustered')
        output = io.StringIO()

        if report_type == 'clustered':
            state.clean_df.to_csv(output, index=False)
            filename = f"clustered_customers_{state.active_algorithm.lower()}.csv"
        elif report_type == 'summary':
            report_df = pd.DataFrame(state.segments)
            report_df.to_csv(output, index=False)
            filename = "segment_summary_report.csv"
        else:
            return jsonify({'error': 'Invalid report type'}), 400

        mem = io.BytesIO()
        mem.write(output.getvalue().encode('utf-8'))
        mem.seek(0)
        return send_file(mem, mimetype='text/csv', as_attachment=True, download_name=filename)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
