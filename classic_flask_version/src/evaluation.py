import numpy as np
import pandas as pd
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score

class ModelEvaluator:
    """
    Model Evaluation Suite for Unsupervised Clustering Algorithms.
    Computes Silhouette Score, Davies-Bouldin Index, Calinski-Harabasz Index,
    and produces comparative benchmarking summaries.
    """

    @staticmethod
    def calculate_metrics(X_scaled: np.ndarray, labels: np.ndarray) -> dict:
        """
        Calculates validation metrics for given cluster assignment labels.
        Filters out DBSCAN noise points (label == -1) where necessary.
        """
        unique_labels = set(labels)
        # Exclude noise label -1 if present
        valid_mask = labels != -1
        n_clusters = len(unique_labels - {-1})

        if n_clusters < 2:
            return {
                "n_clusters": n_clusters,
                "silhouette": -1.0,
                "davies_bouldin": float('inf'),
                "calinski_harabasz": 0.0,
                "noise_ratio": round(float(np.mean(labels == -1)), 4) if -1 in unique_labels else 0.0,
                "status": "Invalid (Fewer than 2 clusters formed)"
            }

        X_valid = X_scaled[valid_mask]
        labels_valid = labels[valid_mask]

        if len(set(labels_valid)) < 2:
            return {
                "n_clusters": n_clusters,
                "silhouette": -1.0,
                "davies_bouldin": float('inf'),
                "calinski_harabasz": 0.0,
                "noise_ratio": round(float(np.mean(labels == -1)), 4),
                "status": "Invalid (Only 1 non-noise cluster)"
            }

        sil = silhouette_score(X_valid, labels_valid)
        db = davies_bouldin_score(X_valid, labels_valid)
        ch = calinski_harabasz_score(X_valid, labels_valid)
        noise_ratio = float(np.mean(labels == -1)) if -1 in unique_labels else 0.0

        return {
            "n_clusters": n_clusters,
            "silhouette": round(float(sil), 4),
            "davies_bouldin": round(float(db), 4),
            "calinski_harabasz": round(float(ch), 2),
            "noise_ratio": round(noise_ratio, 4),
            "status": "Valid"
        }

    @classmethod
    def compare_models(cls, X_scaled: np.ndarray, model_results: dict) -> pd.DataFrame:
        """
        Compares multiple clustering algorithms and outputs a benchmark pandas DataFrame.
        model_results dict format:
        {
            "K-Means": labels_array,
            "Hierarchical": labels_array,
            "DBSCAN": labels_array
        }
        """
        rows = []
        for algo_name, labels in model_results.items():
            metrics = cls.calculate_metrics(X_scaled, labels)
            rows.append({
                "Algorithm": algo_name,
                "Number of Clusters": metrics["n_clusters"],
                "Silhouette Score": metrics["silhouette"],
                "Davies-Bouldin Index": metrics["davies_bouldin"],
                "Calinski-Harabasz Index": metrics["calinski_harabasz"],
                "Noise Ratio (%)": f"{metrics['noise_ratio'] * 100:.1f}%"
            })

        comparison_df = pd.DataFrame(rows)
        return comparison_df
