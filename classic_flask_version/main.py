import os
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from src.preprocessing import DataPreprocessor
from src.eda import EDAnalyzer
from src.clustering import ClusteringPipeline
from src.evaluation import ModelEvaluator
from src.segmentation import SegmentAnalyzer

def run_pipeline():
    print("=" * 70)
    print("      CUSTOMER SEGMENTATION USING CLUSTERING - ML PIPELINE")
    print("=" * 70)

    # File paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, "data", "customers.csv")
    models_dir = os.path.join(base_dir, "models")
    outputs_dir = os.path.join(base_dir, "outputs")
    plots_dir = os.path.join(outputs_dir, "plots")

    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(plots_dir, exist_ok=True)

    # 1. Data Loading & Preprocessing
    print("\n[STEP 1] Data Loading & Preprocessing...")
    preprocessor = DataPreprocessor()
    df_raw = preprocessor.load_data(data_path)
    print(f"-> Loaded dataset: {df_raw.shape[0]} rows, {df_raw.shape[1]} columns")

    quality_report = preprocessor.check_data_quality(df_raw)
    print(f"-> Missing values: {sum(quality_report['missing_values'].values())}")
    print(f"-> Duplicate records: {quality_report['duplicate_count']}")

    df_clean = preprocessor.clean_data(df_raw)
    df_encoded = preprocessor.encode_categorical(df_clean)

    feature_cols = ['Age', 'Annual Income (k$)', 'Spending Score (1-100)', 'Purchase Frequency (per year)']
    print(f"-> Selected features for clustering: {feature_cols}")

    X_scaled, df_ready, scaler = preprocessor.prepare_features(df_encoded, feature_cols)
    print("-> Features successfully normalized using StandardScaler.")

    # 2. Exploratory Data Analysis
    print("\n[STEP 2] Performing Exploratory Data Analysis (EDA)...")
    eda = EDAnalyzer(output_dir=plots_dir)
    eda.plot_distributions(df_clean)
    eda.plot_gender_distribution(df_clean)
    eda.plot_bivariate_relationships(df_clean)
    eda.plot_correlation_heatmap(df_clean)
    print(f"-> Visualizations saved to: {plots_dir}")

    # 3. Clustering Execution
    print("\n[STEP 3] Training Clustering Algorithms...")
    pipeline = ClusteringPipeline(random_state=42)

    # Find optimal K for K-Means
    kmeans_search = pipeline.find_optimal_kmeans(X_scaled, min_k=2, max_k=10)
    best_k_idx = np.argmax(kmeans_search['silhouette_scores'])
    optimal_k = kmeans_search['k_values'][best_k_idx]
    print(f"-> Optimal K-Means clusters based on max Silhouette Score: K = {optimal_k}")

    # Fit K-Means
    kmeans_labels, kmeans_model, centers = pipeline.fit_kmeans(X_scaled, n_clusters=optimal_k)

    # Fit Hierarchical
    hierarchical_labels, agg_model = pipeline.fit_hierarchical(X_scaled, n_clusters=optimal_k, linkage_type='ward')

    # Fit DBSCAN
    dbscan_labels, dbscan_model, noise_cnt = pipeline.fit_dbscan(X_scaled, eps=0.75, min_samples=5)

    # 4. Model Evaluation & Comparison
    print("\n[STEP 4] Evaluating & Benchmarking Models...")
    results_dict = {
        "K-Means": kmeans_labels,
        "Hierarchical Clustering": hierarchical_labels,
        "DBSCAN": dbscan_labels
    }

    comparison_df = ModelEvaluator.compare_models(X_scaled, results_dict)
    print("\n" + comparison_df.to_string(index=False))

    # Select best model based on Silhouette score
    best_algo_row = comparison_df.sort_values(by="Silhouette Score", ascending=False).iloc[0]
    best_algo_name = best_algo_row["Algorithm"]
    print(f"\n[WINNER] Selected Best Clustering Model: {best_algo_name} (Silhouette = {best_algo_row['Silhouette Score']:.4f})")

    final_labels = results_dict[best_algo_name]

    # 5. Customer Segment Profiling & Business Intelligence
    print("\n[STEP 5] Profiling Customer Segments & Business Recommendations...")
    analyzer = SegmentAnalyzer()
    df_clean['Cluster'] = final_labels

    cluster_stats = analyzer.compute_cluster_stats(df_clean, final_labels)
    segment_names = analyzer.generate_segment_names(cluster_stats)
    cluster_stats['Segment Name'] = cluster_stats['Cluster'].map(segment_names)

    print("\n--- CLUSTER PROFILE SUMMARY ---")
    print(cluster_stats[['Cluster', 'Segment Name', 'Customer_Count', 'Customer_Percentage', 'Annual Income (k$)', 'Spending Score (1-100)', 'Purchase Frequency (per year)']].to_string(index=False))

    recommendations = analyzer.generate_business_recommendations(cluster_stats, segment_names)
    print("\n--- TARGETED BUSINESS RECOMMENDATIONS ---")
    for cid, data in recommendations.items():
        print(f"\n[Segment {cid}: {data['segment_name']}]")
        for rec in data['recommendations']:
            print(f"  • {rec}")

    # 6. Save Artifacts & Results
    results_csv_path = os.path.join(outputs_dir, "cluster_results.csv")
    df_clean.to_csv(results_csv_path, index=False)
    print(f"\n-> Cluster assignments saved to: {results_csv_path}")

    model_artifact = {
        "model": kmeans_model if best_algo_name == "K-Means" else agg_model,
        "scaler": scaler,
        "feature_cols": feature_cols,
        "best_algo_name": best_algo_name,
        "optimal_k": optimal_k,
        "segment_names": segment_names
    }
    model_pkl_path = os.path.join(models_dir, "clustering_model.pkl")
    joblib.dump(model_artifact, model_pkl_path)
    print(f"-> Trained model artifact saved to: {model_pkl_path}")

    print("\n" + "=" * 70)
    print("            PIPELINE EXECUTION COMPLETED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_pipeline()
