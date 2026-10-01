import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.metrics import silhouette_score, davies_bouldin_score
from scipy.cluster.hierarchy import linkage, dendrogram

class ClusteringPipeline:
    """
    Clustering Model Suite implementing:
    1. K-Means Clustering
    2. Hierarchical Agglomerative Clustering
    3. DBSCAN (Density-Based Spatial Clustering of Applications with Noise)
    """

    def __init__(self, random_state: int = 42):
        self.random_state = random_state

    # ------------------ 1. K-Means ------------------ #
    def find_optimal_kmeans(self, X_scaled: np.ndarray, min_k: int = 2, max_k: int = 10) -> dict:
        """
        Calculates Within-Cluster Sum of Squares (WCSS/Inertia) and Silhouette Scores
        for K values ranging from min_k to max_k.
        """
        k_values = list(range(min_k, max_k + 1))
        inertias = []
        silhouette_scores = []

        for k in k_values:
            kmeans = KMeans(n_clusters=k, init='k-means++', n_init=10, random_state=self.random_state)
            labels = kmeans.fit_predict(X_scaled)
            inertias.append(kmeans.inertia_)
            
            score = silhouette_score(X_scaled, labels)
            silhouette_scores.append(score)

        return {
            "k_values": k_values,
            "inertias": inertias,
            "silhouette_scores": silhouette_scores
        }

    def fit_kmeans(self, X_scaled: np.ndarray, n_clusters: int) -> tuple:
        """
        Fits K-Means model on normalized feature matrix.
        Returns (labels, model, cluster_centers).
        """
        kmeans = KMeans(n_clusters=n_clusters, init='k-means++', n_init=10, random_state=self.random_state)
        labels = kmeans.fit_predict(X_scaled)
        return labels, kmeans, kmeans.cluster_centers_

    # ------------------ 2. Hierarchical ------------------ #
    def compute_linkage_matrix(self, X_scaled: np.ndarray, method: str = 'ward') -> np.ndarray:
        """
        Computes SciPy linkage matrix for Dendrogram rendering.
        """
        return linkage(X_scaled, method=method)

    def fit_hierarchical(self, X_scaled: np.ndarray, n_clusters: int, linkage_type: str = 'ward') -> tuple:
        """
        Fits Agglomerative Hierarchical Clustering model.
        Returns (labels, model).
        """
        agg = AgglomerativeClustering(n_clusters=n_clusters, linkage=linkage_type)
        labels = agg.fit_predict(X_scaled)
        return labels, agg

    # ------------------ 3. DBSCAN ------------------ #
    def fit_dbscan(self, X_scaled: np.ndarray, eps: float = 0.5, min_samples: int = 5) -> tuple:
        """
        Fits DBSCAN model.
        Returns (labels, model, noise_points_count).
        """
        dbscan = DBSCAN(eps=eps, min_samples=min_samples)
        labels = dbscan.fit_predict(X_scaled)
        noise_count = int(np.sum(labels == -1))
        return labels, dbscan, noise_count
