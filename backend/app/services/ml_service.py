import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
from scipy.cluster.hierarchy import linkage, dendrogram
from typing import Dict, Any, List, Tuple, Optional
import math

ID_COLUMNS = {"customerid", "customer_id", "id", "customer", "index"}

def get_numeric_features(df: pd.DataFrame) -> List[str]:
    """Return numeric feature columns excluding ID columns."""
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    return [col for col in numeric_cols if col.lower().replace("_", "").replace(" ", "") not in ID_COLUMNS]

def validate_and_clean_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Clean dataset by imputing missing values and resolving duplicates."""
    df_clean = df.copy()
    
    total_rows = len(df_clean)
    total_cols = len(df_clean.columns)
    missing_count = int(df_clean.isnull().sum().sum())
    duplicate_rows = int(df_clean.duplicated().sum())
    
    if duplicate_rows > 0:
        df_clean = df_clean.drop_duplicates()
        
    numeric_features = get_numeric_features(df_clean)
    categorical_cols = [c for c in df_clean.columns if c not in numeric_features and c.lower() not in ID_COLUMNS]
    
    # Impute missing values
    for col in numeric_features:
        if df_clean[col].isnull().sum() > 0:
            df_clean[col] = df_clean[col].fillna(df_clean[col].median())
            
    for col in categorical_cols:
        if df_clean[col].isnull().sum() > 0:
            df_clean[col] = df_clean[col].fillna(df_clean[col].mode()[0] if not df_clean[col].mode().empty else "Unknown")
            
    quality = {
        "total_rows": total_rows,
        "total_columns": total_cols,
        "missing_values": missing_count,
        "duplicate_rows": duplicate_rows,
        "numeric_columns": numeric_features,
        "categorical_columns": categorical_cols
    }
    
    return df_clean, quality

def get_eda_overview(df: pd.DataFrame) -> Dict[str, Any]:
    """Generate comprehensive EDA metadata, summary stats, distributions, and correlations."""
    df_clean, quality = validate_and_clean_data(df)
    numeric_cols = quality["numeric_columns"]
    
    # Statistics
    stats = []
    for col in numeric_cols:
        series = df_clean[col].dropna()
        stats.append({
            "column": col,
            "mean": round(float(series.mean()), 2),
            "median": round(float(series.median()), 2),
            "min": round(float(series.min()), 2),
            "max": round(float(series.max()), 2),
            "std": round(float(series.std()), 2)
        })
        
    # Binned Distributions
    distributions = {}
    for col in numeric_cols:
        counts, bin_edges = np.histogram(df_clean[col].dropna(), bins=7)
        dist_list = []
        for i in range(len(counts)):
            label = f"{round(bin_edges[i], 1)}-{round(bin_edges[i+1], 1)}"
            dist_list.append({"bin_label": label, "count": int(counts[i])})
        distributions[col] = dist_list
        
    # Correlations
    correlations = []
    if len(numeric_cols) >= 2:
        corr_matrix = df_clean[numeric_cols].corr()
        for i in range(len(numeric_cols)):
            for j in range(i + 1, len(numeric_cols)):
                col1 = numeric_cols[i]
                col2 = numeric_cols[j]
                val = corr_matrix.loc[col1, col2]
                if not math.isnan(val):
                    correlations.append({
                        "feature1": col1,
                        "feature2": col2,
                        "correlation": round(float(val), 3)
                    })
                    
    # Sample records (first 10)
    sample_records = df_clean.head(10).to_dict(orient="records")
    
    return {
        "quality": quality,
        "statistics": stats,
        "distributions": distributions,
        "correlations": correlations,
        "sample_records": sample_records
    }

def get_standard_feature_mapping(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
    """Map columns to canonical customer features if available."""
    feature_cols = get_numeric_features(df)
    return df, feature_cols

def assign_dynamic_segment_name(cluster_stats: Dict[str, float], overall_stats: Dict[str, float]) -> Tuple[str, str, List[str], Dict[str, str]]:
    """
    Dynamically assign human-readable business segment names and marketing advice
    based on relative feature statistics against overall population averages.
    """
    income_ratio = cluster_stats.get("avg_income", 50) / max(overall_stats.get("mean_income", 50), 1)
    spending_ratio = cluster_stats.get("avg_spending", 50) / max(overall_stats.get("mean_spending", 50), 1)
    freq_ratio = cluster_stats.get("avg_frequency", 15) / max(overall_stats.get("mean_frequency", 15), 1)
    recency = cluster_stats.get("avg_recency", 40)
    age = cluster_stats.get("avg_age", 40)
    
    if cluster_stats.get("cluster_id") == -1:
        return (
            "Uncategorized Outliers (Noise)",
            "Customers with unusual spending patterns or isolated behavioral anomalies identified by DBSCAN.",
            ["Low cluster density", "Atypical purchasing behavior", "Requires individual review"],
            {
                "strategy": "Niche & Direct Investigation",
                "campaign": "One-on-One Outreach / Special Inquiry",
                "business_goal": "Identify special edge-case needs and prevent fraudulent or anomalous churn."
            }
        )
        
    if income_ratio >= 1.15 and spending_ratio >= 1.15:
        return (
            "High-Value Champions",
            "High-earning customers who actively spend and frequently purchase high-ticket items.",
            [f"High annual income (${cluster_stats['avg_income']:.1f}k avg)", f"High spending score ({cluster_stats['avg_spending']:.1f}/100)", f"Active buyers ({cluster_stats['avg_frequency']:.0f} orders/yr)"],
            {
                "strategy": "VIP Tier & Exclusive Loyalty Rewards",
                "campaign": "Platinum Member Access & Early Product Drops",
                "business_goal": "Maximize Customer Lifetime Value (CLV) & brand advocacy."
            }
        )
    elif income_ratio >= 1.15 and spending_ratio < 0.9:
        return (
            "High-Earner Savers",
            "Affluent customers with high earning potential who maintain conservative spending habits.",
            [f"High income (${cluster_stats['avg_income']:.1f}k avg)", f"Low spending score ({cluster_stats['avg_spending']:.1f}/100)", "Higher average order value but infrequent trips"],
            {
                "strategy": "Value-Add Premium Incentives",
                "campaign": "Curated Upsell & Luxury Value Packages",
                "business_goal": "Convert high disposable income into higher purchase frequency."
            }
        )
    elif spending_ratio >= 1.15 and income_ratio < 0.9:
        return (
            "Young Trendsetters & High Spenders",
            "Highly engaged customers who spend heavily relative to moderate annual income levels.",
            [f"Younger demographic ({cluster_stats['avg_age']:.0f} yrs avg)", f"High spending score ({cluster_stats['avg_spending']:.1f}/100)", "Frequent impulse purchases"],
            {
                "strategy": "Social Media & Flash Sale Promotions",
                "campaign": "Trendy Flash Sales & Buy-Now-Pay-Later Bundles",
                "business_goal": "Drive high volume velocity and viral referral acquisition."
            }
        )
    elif income_ratio < 0.85 and spending_ratio < 0.85 and recency >= 45:
        return (
            "At-Risk / Low-Engagement Customers",
            "Price-sensitive customers showing declining purchase activity and high days since last purchase.",
            [f"Low spending score ({cluster_stats['avg_spending']:.1f}/100)", f"High recency ({cluster_stats['avg_recency']:.0f} days inactive)", "Low purchase frequency"],
            {
                "strategy": "Win-Back & Reactivation Discounts",
                "campaign": "We Miss You Special 25% Off Reactivation",
                "business_goal": "Reduce churn rate and reactivate dormant customer accounts."
            }
        )
    elif income_ratio < 0.95 and spending_ratio < 0.95:
        return (
            "Budget-Conscious Savers",
            "Price-aware customers who buy deliberately and prioritize essential discounts.",
            [f"Moderate income (${cluster_stats['avg_income']:.1f}k avg)", f"Controlled spending score ({cluster_stats['avg_spending']:.1f}/100)", "Consistent baseline buyers"],
            {
                "strategy": "Discount Bundles & Loyalty Points",
                "campaign": "Save More on Essentials Loyalty Pass",
                "business_goal": "Maintain steady recurring volume with predictable retention."
            }
        )
    else:
        return (
            "Moderate Core Shoppers",
            "Balanced customer group with average income and consistent, steady shopping behavior.",
            [f"Average annual income (${cluster_stats['avg_income']:.1f}k avg)", f"Steady spending score ({cluster_stats['avg_spending']:.1f}/100)", "Consistent purchase cycle"],
            {
                "strategy": "Cross-Selling & Personalized Recommendations",
                "campaign": "Recommended For You Cross-Category Boost",
                "business_goal": "Incrementally boost average order value (AOV) and purchase frequency."
            }
        )

def compute_cluster_metrics(X_scaled: np.ndarray, labels: np.ndarray) -> Tuple[float, float, float]:
    """Calculate Silhouette, Davies-Bouldin, and Calinski-Harabasz metrics safely."""
    unique_labels = set(labels)
    valid_labels = [l for l in unique_labels if l != -1]
    
    if len(valid_labels) < 2 or len(set(labels[labels != -1])) < 2:
        return 0.0, 0.0, 0.0
        
    non_noise_mask = labels != -1 if -1 in unique_labels else np.ones(len(labels), dtype=bool)
    if np.sum(non_noise_mask) < 4:
        return 0.0, 0.0, 0.0
        
    try:
        sil = float(silhouette_score(X_scaled[non_noise_mask], labels[non_noise_mask]))
        db = float(davies_bouldin_score(X_scaled[non_noise_mask], labels[non_noise_mask]))
        ch = float(calinski_harabasz_score(X_scaled[non_noise_mask], labels[non_noise_mask]))
        return round(sil, 3), round(db, 3), round(ch, 2)
    except Exception:
        return 0.0, 0.0, 0.0

def process_clustering(df: pd.DataFrame, algorithm: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Execute ML clustering pipeline, compute PCA 2D coordinates, and structure response."""
    df_clean, quality = validate_and_clean_data(df)
    feature_cols = params.get("features") or quality["numeric_columns"]
    
    if not feature_cols or len(feature_cols) == 0:
        raise ValueError("No numeric features available for clustering.")
        
    X = df_clean[feature_cols].values
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # 2D PCA for spatial visualization
    pca = PCA(n_components=2, random_state=42)
    X_pca = pca.fit_transform(X_scaled)
    
    elbow_data = []
    dendrogram_data = None
    
    if algorithm == "kmeans":
        n_clusters = params.get("n_clusters", 4)
        model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = model.fit_predict(X_scaled)
        
        # Calculate Elbow metrics for K=2 to 10
        for k in range(2, min(11, len(df_clean))):
            km = KMeans(n_clusters=k, random_state=42, n_init=5)
            lbls = km.fit_predict(X_scaled)
            sil, db, ch = compute_cluster_metrics(X_scaled, lbls)
            elbow_data.append({
                "k": k,
                "inertia": round(float(km.inertia_), 2),
                "silhouette": sil,
                "davies_bouldin": db,
                "calinski_harabasz": ch
            })
            
    elif algorithm == "hierarchical":
        n_clusters = params.get("n_clusters", 4)
        linkage_type = params.get("linkage", "ward")
        model = AgglomerativeClustering(n_clusters=n_clusters, linkage=linkage_type)
        labels = model.fit_predict(X_scaled)
        
        # Compute hierarchical linkage matrix for dendrogram visualization
        try:
            Z = linkage(X_scaled, method=linkage_type)
            dendro = dendrogram(Z, no_plot=True)
            dendrogram_data = {
                "icoord": dendro["icoord"][:30],  # sample first 30 branches for fast UI rendering
                "dcoord": dendro["dcoord"][:30],
                "ivl": dendro["ivl"][:30]
            }
        except Exception:
            dendrogram_data = None
            
    elif algorithm == "dbscan":
        eps = params.get("eps", 0.5)
        min_samples = params.get("min_samples", 5)
        model = DBSCAN(eps=eps, min_samples=min_samples)
        labels = model.fit_predict(X_scaled)
        n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
    else:
        raise ValueError(f"Unsupported algorithm: {algorithm}")
        
    sil_score, db_score, ch_score = compute_cluster_metrics(X_scaled, labels)
    
    # Calculate population-wide feature means for relative profiling
    overall_stats = {
        "mean_income": float(df_clean.filter(regex="Income|income").iloc[:, 0].mean()) if any(c for c in df_clean.columns if "income" in c.lower()) else 50.0,
        "mean_spending": float(df_clean.filter(regex="Spending|spending").iloc[:, 0].mean()) if any(c for c in df_clean.columns if "spending" in c.lower()) else 50.0,
        "mean_frequency": float(df_clean.filter(regex="Frequency|frequency").iloc[:, 0].mean()) if any(c for c in df_clean.columns if "frequency" in c.lower()) else 15.0,
    }
    
    # Process Cluster Points & Summaries
    df_clean["_cluster_id"] = labels
    df_clean["_pca_x"] = X_pca[:, 0]
    df_clean["_pca_y"] = X_pca[:, 1]
    
    unique_clusters = sorted(list(set(labels)))
    cluster_summaries = []
    points = []
    
    # Detect relevant columns
    id_col = next((c for c in df_clean.columns if c.lower().replace("_", "") in ID_COLUMNS), None)
    gender_col = next((c for c in df_clean.columns if "gender" in c.lower() or "sex" in c.lower()), None)
    age_col = next((c for c in df_clean.columns if "age" in c.lower()), None)
    income_col = next((c for c in df_clean.columns if "income" in c.lower()), None)
    spending_col = next((c for c in df_clean.columns if "spending" in c.lower()), None)
    freq_col = next((c for c in df_clean.columns if "frequency" in c.lower() or "purchase" in c.lower()), None)
    aov_col = next((c for c in df_clean.columns if "aov" in c.lower() or "order" in c.lower() or "value" in c.lower()), None)
    recency_col = next((c for c in df_clean.columns if "recency" in c.lower() or "days" in c.lower()), None)
    
    total_customers = len(df_clean)
    
    for c_id in unique_clusters:
        c_mask = df_clean["_cluster_id"] == c_id
        c_df = df_clean[c_mask]
        count = len(c_df)
        pct = round((count / total_customers) * 100, 1)
        
        avg_inc = float(c_df[income_col].mean()) if income_col else 50.0
        avg_spd = float(c_df[spending_col].mean()) if spending_col else 50.0
        avg_ag = float(c_df[age_col].mean()) if age_col else 35.0
        avg_frq = float(c_df[freq_col].mean()) if freq_col else 15.0
        avg_aov = float(c_df[aov_col].mean()) if aov_col else 100.0
        avg_rec = float(c_df[recency_col].mean()) if recency_col else 30.0
        
        c_stats = {
            "cluster_id": c_id,
            "avg_income": avg_inc,
            "avg_spending": avg_spd,
            "avg_age": avg_ag,
            "avg_frequency": avg_frq,
            "avg_order_value": avg_aov,
            "avg_recency": avg_rec
        }
        
        seg_name, desc, traits, recommendation = assign_dynamic_segment_name(c_stats, overall_stats)
        
        cluster_summaries.append({
            "cluster_id": c_id,
            "segment_name": seg_name,
            "count": count,
            "percentage": pct,
            "avg_income": round(avg_inc, 1),
            "avg_spending": round(avg_spd, 1),
            "avg_age": round(avg_ag, 1),
            "avg_frequency": round(avg_frq, 1),
            "avg_order_value": round(avg_aov, 1),
            "avg_recency": round(avg_rec, 1)
        })

    # Map individual points
    for idx, row in df_clean.iterrows():
        c_id = int(row["_cluster_id"])
        seg_name = next(s["segment_name"] for s in cluster_summaries if s["cluster_id"] == c_id)
        
        c_id_str = str(row[id_col]) if id_col else f"CUST-{idx + 1001}"
        g_val = str(row[gender_col]) if gender_col else "N/A"
        age_val = float(row[age_col]) if age_col else 35.0
        inc_val = float(row[income_col]) if income_col else 50.0
        spd_val = float(row[spending_col]) if spending_col else 50.0
        frq_val = float(row[freq_col]) if freq_col else 15.0
        aov_val = float(row[aov_col]) if aov_col else 100.0
        rec_val = float(row[recency_col]) if recency_col else 30.0
        
        points.append({
            "customer_id": c_id_str,
            "gender": g_val,
            "age": round(age_val, 1),
            "income": round(inc_val, 1),
            "spending_score": round(spd_val, 1),
            "purchase_frequency": round(frq_val, 1),
            "avg_order_value": round(aov_val, 1),
            "recency": round(rec_val, 1),
            "cluster_id": c_id,
            "segment_name": seg_name,
            "pca_x": round(float(row["_pca_x"]), 3),
            "pca_y": round(float(row["_pca_y"]), 3)
        })

    noise_count = int(np.sum(labels == -1)) if -1 in labels else 0

    return {
        "algorithm": algorithm,
        "n_clusters": max(1, n_clusters),
        "noise_count": noise_count,
        "silhouette_score": sil_score,
        "davies_bouldin_score": db_score,
        "calinski_harabasz_score": ch_score,
        "elbow_data": elbow_data if algorithm == "kmeans" else None,
        "dendrogram_data": dendrogram_data if algorithm == "hierarchical" else None,
        "points": points,
        "cluster_summaries": cluster_summaries
    }

def compare_clustering_models(df: pd.DataFrame) -> Dict[str, Any]:
    """Compare K-Means, Hierarchical, and DBSCAN side-by-side on current dataset."""
    df_clean, quality = validate_and_clean_data(df)
    feature_cols = quality["numeric_columns"]
    
    # Run K-Means
    km_res = process_clustering(df_clean, "kmeans", {"n_clusters": 4, "features": feature_cols})
    # Run Hierarchical
    hc_res = process_clustering(df_clean, "hierarchical", {"n_clusters": 4, "linkage": "ward", "features": feature_cols})
    # Run DBSCAN
    db_res = process_clustering(df_clean, "dbscan", {"eps": 0.6, "min_samples": 5, "features": feature_cols})
    
    models = [
        {"algorithm": "K-Means", "result": km_res},
        {"algorithm": "Hierarchical Clustering", "result": hc_res},
        {"algorithm": "DBSCAN", "result": db_res}
    ]
    
    # Determine best model based on Silhouette Score & Davies-Bouldin
    best_idx = max(range(len(models)), key=lambda i: models[i]["result"]["silhouette_score"])
    
    comparison_table = []
    for i, m in enumerate(models):
        res = m["result"]
        is_rec = (i == best_idx)
        
        if m["algorithm"] == "K-Means":
            exp = f"K-Means achieved a Silhouette Score of {res['silhouette_score']} with distinct spherical boundary separation."
        elif m["algorithm"] == "Hierarchical Clustering":
            exp = f"Hierarchical Clustering grouped customer hierarchies with a Silhouette Score of {res['silhouette_score']}."
        else:
            exp = f"DBSCAN created {res['n_clusters']} dense clusters and isolated {res['noise_count']} outlier customers."
            
        comparison_table.append({
            "algorithm": m["algorithm"],
            "clusters": res["n_clusters"],
            "silhouette_score": res["silhouette_score"],
            "davies_bouldin_score": res["davies_bouldin_score"],
            "calinski_harabasz_score": res["calinski_harabasz_score"],
            "is_recommended": is_rec,
            "explanation": exp
        })
        
    rec_algo = models[best_idx]["algorithm"]
    rec_sil = models[best_idx]["result"]["silhouette_score"]
    
    summary_exp = f"{rec_algo} is the recommended model for your dataset, delivering the highest cluster cohesion and separation (Silhouette Score: {rec_sil})."
    
    return {
        "comparison_table": comparison_table,
        "recommended_model": rec_algo,
        "summary_explanation": summary_exp
    }

def generate_insights_and_profiles(clustering_result: Dict[str, Any], df: pd.DataFrame) -> Dict[str, Any]:
    """Generate executive business insights and tailored marketing strategies for each segment."""
    summaries = clustering_result["cluster_summaries"]
    points = clustering_result["points"]
    total_cust = len(points)
    
    overall_stats = {
        "mean_income": float(np.mean([p["income"] for p in points])),
        "mean_spending": float(np.mean([p["spending_score"] for p in points])),
        "mean_frequency": float(np.mean([p["purchase_frequency"] for p in points]))
    }
    
    all_profiles = []
    for s in summaries:
        c_id = s["cluster_id"]
        c_stats = {
            "cluster_id": c_id,
            "avg_income": s["avg_income"],
            "avg_spending": s["avg_spending"],
            "avg_age": s["avg_age"],
            "avg_frequency": s["avg_frequency"],
            "avg_order_value": s["avg_order_value"],
            "avg_recency": s["avg_recency"]
        }
        
        seg_name, desc, traits, rec_dict = assign_dynamic_segment_name(c_stats, overall_stats)
        
        all_profiles.append({
            "cluster_id": c_id,
            "segment_name": seg_name,
            "customer_count": s["count"],
            "percentage": s["percentage"],
            "avg_income": s["avg_income"],
            "avg_spending": s["avg_spending"],
            "avg_age": s["avg_age"],
            "avg_frequency": s["avg_frequency"],
            "avg_order_value": s["avg_order_value"],
            "avg_recency": s["avg_recency"],
            "description": desc,
            "key_characteristics": traits,
            "marketing_recommendation": rec_dict
        })
        
    # Highest value = highest (income * spending * frequency)
    highest_val = max(all_profiles, key=lambda p: p["avg_income"] * p["avg_spending"])
    largest_group = max(all_profiles, key=lambda p: p["customer_count"])
    highest_spend = max(all_profiles, key=lambda p: p["avg_spending"])
    most_freq = max(all_profiles, key=lambda p: p["avg_frequency"])
    lowest_eng = min(all_profiles, key=lambda p: p["avg_spending"])
    
    exec_summary = (
        f"SegmentIQ analyzed {total_cust} customers across {len(all_profiles)} distinct behavioral segments. "
        f"The primary revenue driver is the '{highest_val['segment_name']}' segment (accounting for {highest_val['percentage']}% of customers). "
        f"Focus reactivation campaigns on '{lowest_eng['segment_name']}' to minimize customer churn."
    )
    
    return {
        "executive_summary": exec_summary,
        "highest_value_segment": highest_val,
        "largest_segment": largest_group,
        "highest_spending_segment": highest_spend,
        "most_frequent_segment": most_freq,
        "lowest_engagement_segment": lowest_eng,
        "all_profiles": all_profiles
    }
