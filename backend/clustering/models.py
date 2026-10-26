import numpy as np
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.metrics import silhouette_score
from sklearn.decomposition import PCA
from scipy.cluster.hierarchy import linkage

def run_kmeans(X_scaled, n_clusters=4, random_state=42):
    n_samples = len(X_scaled)
    n_clusters = max(2, min(n_clusters, n_samples - 1))

    kmeans = KMeans(n_clusters=n_clusters, random_state=random_state, n_init=10)
    labels = kmeans.fit_predict(X_scaled)
    
    score = float(np.round(silhouette_score(X_scaled, labels), 4)) if n_clusters > 1 else 0.0

    elbow_data = []
    max_k = min(10, n_samples - 1)
    for k in range(2, max_k + 1):
        km = KMeans(n_clusters=k, random_state=random_state, n_init=10)
        km.fit(X_scaled)
        elbow_data.append({
            'k': int(k),
            'wcss': float(np.round(km.inertia_, 2))
        })

    return {
        'algorithm': 'K-Means',
        'n_clusters': int(n_clusters),
        'labels': labels.tolist(),
        'cluster_centers': kmeans.cluster_centers_.tolist(),
        'inertia': float(np.round(kmeans.inertia_, 2)),
        'silhouette_score': score,
        'elbow_data': elbow_data
    }

def run_hierarchical(X_scaled, n_clusters=4, linkage_method='ward'):
    n_samples = len(X_scaled)
    n_clusters = max(2, min(n_clusters, n_samples - 1))
    
    if linkage_method not in ['ward', 'complete', 'average', 'single']:
        linkage_method = 'ward'

    model = AgglomerativeClustering(n_clusters=n_clusters, linkage=linkage_method)
    labels = model.fit_predict(X_scaled)
    
    score = float(np.round(silhouette_score(X_scaled, labels), 4)) if n_clusters > 1 else 0.0

    Z = linkage(X_scaled, method=linkage_method)
    dendrogram_tree = []
    for i, row in enumerate(Z[-15:]):
        dendrogram_tree.append({
            'node1': int(row[0]),
            'node2': int(row[1]),
            'distance': float(np.round(row[2], 2)),
            'sample_count': int(row[3])
        })

    return {
        'algorithm': 'Hierarchical',
        'n_clusters': int(n_clusters),
        'linkage': linkage_method,
        'labels': labels.tolist(),
        'silhouette_score': score,
        'dendrogram_tree': dendrogram_tree
    }

def run_dbscan(X_scaled, eps=0.5, min_samples=5):
    model = DBSCAN(eps=eps, min_samples=min_samples)
    labels = model.fit_predict(X_scaled)
    
    unique_labels = set(labels)
    n_noise = int(list(labels).count(-1))
    
    non_noise_labels = unique_labels - {-1}
    n_clusters = len(non_noise_labels)

    if n_clusters > 1 and len(labels[labels != -1]) > n_clusters:
        non_noise_mask = labels != -1
        score = float(np.round(silhouette_score(X_scaled[non_noise_mask], labels[non_noise_mask]), 4))
    else:
        score = 0.0

    return {
        'algorithm': 'DBSCAN',
        'n_clusters': int(n_clusters),
        'n_noise': int(n_noise),
        'eps': float(eps),
        'min_samples': int(min_samples),
        'labels': labels.tolist(),
        'silhouette_score': score
    }

def compute_pca_projection(X_scaled):
    n_features = X_scaled.shape[1]
    n_components = min(3, n_features)
    
    pca = PCA(n_components=n_components)
    X_pca = pca.fit_transform(X_scaled)

    pca_data = []
    for i in range(len(X_pca)):
        item = {
            'pc1': float(np.round(X_pca[i][0], 3)),
            'pc2': float(np.round(X_pca[i][1], 3)) if n_components >= 2 else 0.0,
            'pc3': float(np.round(X_pca[i][2], 3)) if n_components >= 3 else 0.0
        }
        pca_data.append(item)

    variance_ratio = [float(np.round(v, 4)) for v in pca.explained_variance_ratio_]

    return {
        'pca_points': pca_data,
        'explained_variance_ratio': variance_ratio
    }
