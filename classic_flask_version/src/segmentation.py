import pandas as pd
import numpy as np
import os

class SegmentAnalyzer:
    """
    Customer Segment Profiling and Business Intelligence Generator.
    Analyzes cluster statistics, dynamically assigns meaningful segment names based on feature medians,
    and generates targeted business recommendations.
    """

    def __init__(self):
        pass

    def compute_cluster_stats(self, df_original: pd.DataFrame, cluster_labels: np.ndarray) -> pd.DataFrame:
        """
        Computes aggregate statistics for each identified customer cluster.
        """
        df_stats = df_original.copy()
        df_stats['Cluster'] = cluster_labels

        # Identify numeric columns for aggregation
        numeric_cols = df_stats.select_dtypes(include=[np.number]).columns.tolist()
        if 'CustomerID' in numeric_cols:
            numeric_cols.remove('CustomerID')
        if 'Cluster' in numeric_cols:
            numeric_cols.remove('Cluster')

        # Group by Cluster and aggregate
        agg_dict = {col: 'mean' for col in numeric_cols}
        agg_dict['Cluster'] = 'count'

        grouped = df_stats.groupby('Cluster').agg(agg_dict).rename(columns={'Cluster': 'Customer_Count'})
        grouped['Customer_Percentage'] = (grouped['Customer_Count'] / len(df_stats) * 100).round(2)

        # Round numeric values for clean formatting
        for col in numeric_cols:
            grouped[col] = grouped[col].round(2)

        # Reorder columns so Count and Percentage come first
        cols = ['Customer_Count', 'Customer_Percentage'] + numeric_cols
        return grouped[cols].reset_index()

    def generate_segment_names(self, cluster_summary: pd.DataFrame) -> dict:
        """
        Dynamically derives intuitive business persona titles for clusters based on relative income,
        spending score, recency, and purchase frequency.
        """
        segment_names = {}
        
        # Determine dataset overall medians/means for thresholding
        inc_mean = cluster_summary['Annual Income (k$)'].mean() if 'Annual Income (k$)' in cluster_summary.columns else 50
        spend_mean = cluster_summary['Spending Score (1-100)'].mean() if 'Spending Score (1-100)' in cluster_summary.columns else 50
        freq_mean = cluster_summary['Purchase Frequency (per year)'].mean() if 'Purchase Frequency (per year)' in cluster_summary.columns else 20

        for _, row in cluster_summary.iterrows():
            cid = int(row['Cluster'])
            if cid == -1:
                segment_names[cid] = "Outliers / Noise Customers"
                continue

            inc = row.get('Annual Income (k$)', inc_mean)
            spend = row.get('Spending Score (1-100)', spend_mean)
            freq = row.get('Purchase Frequency (per year)', freq_mean)
            recency = row.get('Recency (days)', 100)

            # Rule-based dynamic persona generator
            if inc >= inc_mean and spend >= spend_mean:
                if freq >= freq_mean:
                    name = "High-Value Loyal Champions"
                else:
                    name = "High-Income High-Spenders"
            elif inc >= inc_mean and spend < spend_mean:
                name = "Conservative High-Earners (Potential)"
            elif inc < inc_mean and spend >= spend_mean:
                name = "Impulsive Budget Spenders"
            elif inc < inc_mean and spend < spend_mean:
                if recency > 150:
                    name = "At-Risk Inactive Customers"
                else:
                    name = "Budget-Conscious Bargain Hunters"
            else:
                name = f"Standard Customer Group {cid + 1}"

            segment_names[cid] = name

        return segment_names

    def generate_business_recommendations(self, cluster_summary: pd.DataFrame, segment_names: dict) -> dict:
        """
        Generates actionable marketing strategies and loyalty recommendations for each segment.
        """
        recommendations = {}

        for _, row in cluster_summary.iterrows():
            cid = int(row['Cluster'])
            sname = segment_names.get(cid, f"Cluster {cid}")

            if "High-Value" in sname or "High-Spenders" in sname:
                rec = [
                    "Enroll in VIP Premium Loyalty Program with exclusive early-access perks.",
                    "Offer white-glove personal concierge & customized product recommendations.",
                    "Avoid heavy discounting; emphasize premium brand value and exclusivity."
                ]
            elif "Conservative" in sname or "Potential" in sname:
                rec = [
                    "Target with luxury cross-selling campaigns and premium product bundles.",
                    "Send personalized invitations to premium showcase events.",
                    "Provide free trial upgrades to encourage higher spending."
                ]
            elif "Impulsive" in sname:
                rec = [
                    "Promote flash sales, limited-time offers, and trend-setting merchandise.",
                    "Leverage social media influencer marketing and instant reward points.",
                    "Implement flexible payment options (Buy Now Pay Later)."
                ]
            elif "At-Risk" in sname:
                rec = [
                    "Trigger automated win-back email campaigns with special discount vouchers.",
                    "Solicit feedback via brief customer satisfaction surveys.",
                    "Offer free shipping or bonus incentives on their next purchase."
                ]
            elif "Budget-Conscious" in sname:
                rec = [
                    "Offer value-pack bundles, seasonal clearance discounts, and coupons.",
                    "Highlight low-cost high-utility product lines.",
                    "Encourage referral programs for small bonus cashback."
                ]
            else:
                rec = [
                    "Maintain standard promotional newsletter communications.",
                    "Monitor purchasing frequency for engagement changes."
                ]

            recommendations[cid] = {
                "segment_name": sname,
                "recommendations": rec
            }

        return recommendations
