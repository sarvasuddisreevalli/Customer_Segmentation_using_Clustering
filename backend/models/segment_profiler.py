import pandas as pd
import numpy as np

def generate_segment_profiles(df_clean, labels, selected_features):
    df_worked = df_clean.copy()
    df_worked['Cluster'] = labels
    total_customers = len(df_worked)

    overall_means = {}
    for feat in selected_features:
        if feat in df_worked.columns:
            overall_means[feat] = df_worked[feat].mean()

    segments = []
    unique_clusters = sorted(list(set(labels)))

    for cid in unique_clusters:
        if cid == -1:
            c_name = "Unclassified Noise Points"
        else:
            c_name = None

        cluster_df = df_worked[df_worked['Cluster'] == cid]
        count = len(cluster_df)
        percentage = float(np.round((count / total_customers) * 100, 1))

        feature_means = {}
        for feat in selected_features:
            if feat in cluster_df.columns:
                feature_means[feat] = float(np.round(cluster_df[feat].mean(), 1))

        avg_age = feature_means.get('Age', float(np.round(cluster_df['Age'].mean(), 1)) if 'Age' in cluster_df.columns else 0.0)
        avg_income = feature_means.get('Annual Income', float(np.round(cluster_df['Annual Income'].mean(), 1)) if 'Annual Income' in cluster_df.columns else 0.0)
        avg_spending = feature_means.get('Spending Score', float(np.round(cluster_df['Spending Score'].mean(), 1)) if 'Spending Score' in cluster_df.columns else 0.0)
        avg_freq = feature_means.get('Purchase Frequency', float(np.round(cluster_df['Purchase Frequency'].mean(), 1)) if 'Purchase Frequency' in cluster_df.columns else 0.0)

        if cid != -1:
            inc_high = avg_income >= overall_means.get('Annual Income', 50.0)
            spd_high = avg_spending >= overall_means.get('Spending Score', 50.0)
            freq_high = avg_freq >= overall_means.get('Purchase Frequency', 20.0)

            if inc_high and spd_high and (freq_high or avg_freq == 0):
                c_name = "High-Value Loyal Champions"
            elif inc_high and spd_high:
                c_name = "High-Value Spenders"
            elif inc_high and not spd_high:
                c_name = "High-Income Potential Savers"
            elif not inc_high and spd_high:
                c_name = "Carefree Spenders"
            elif freq_high:
                c_name = "Frequent Regular Buyers"
            elif avg_age > overall_means.get('Age', 38.0) and not spd_high:
                c_name = "Conservative Senior Buyers"
            else:
                c_name = f"Budget-Conscious Customers (Group {cid + 1})"

        segments.append({
            'cluster_id': int(cid),
            'name': c_name,
            'count': int(count),
            'percentage': percentage,
            'avg_age': avg_age,
            'avg_income': avg_income,
            'avg_spending': avg_spending,
            'avg_frequency': avg_freq,
            'feature_means': feature_means
        })

    return segments

def generate_business_insights(segments):
    valid_segments = [s for s in segments if s['cluster_id'] != -1]
    if not valid_segments:
        return []

    highest_spending = max(valid_segments, key=lambda x: x['avg_spending'])
    largest_segment = max(valid_segments, key=lambda x: x['count'])
    highest_income = max(valid_segments, key=lambda x: x['avg_income'])
    lowest_spending = min(valid_segments, key=lambda x: x['avg_spending'])

    insights = [
        {
            'card_type': 'TOP SPENDING SEGMENT',
            'title': highest_spending['name'],
            'cluster_id': highest_spending['cluster_id'],
            'value': f"{highest_spending['avg_spending']} / 100",
            'explanation': f"Cluster {highest_spending['cluster_id']} has the highest average spending score across the customer base.",
            'strategy': 'Target with VIP loyalty perks, preview access to new arrivals, and premium rewards.'
        },
        {
            'card_type': 'LARGEST CUSTOMER SEGMENT',
            'title': largest_segment['name'],
            'cluster_id': largest_segment['cluster_id'],
            'value': f"{largest_segment['count']} Customers ({largest_segment['percentage']}%)",
            'explanation': f"Cluster {largest_segment['cluster_id']} represents the largest share of your customer population.",
            'strategy': 'Mainstream marketing focus. Optimize core product offerings and broad promotional campaigns.'
        },
        {
            'card_type': 'HIGHEST INCOME SEGMENT',
            'title': highest_income['name'],
            'cluster_id': highest_income['cluster_id'],
            'value': f"${highest_income['avg_income']}k",
            'explanation': f"Cluster {highest_income['cluster_id']} possesses the highest average annual earning capacity.",
            'strategy': 'High up-sell opportunity. Introduce luxury lines, personalized concierge services, and high-margin bundles.'
        },
        {
            'card_type': 'LOWEST SPENDING / RETENTION ALERT',
            'title': lowest_spending['name'],
            'cluster_id': lowest_spending['cluster_id'],
            'value': f"{lowest_spending['avg_spending']} / 100",
            'explanation': f"Cluster {lowest_spending['cluster_id']} displays low purchasing engagement and spending score.",
            'strategy': 'Re-activation campaigns. Deploy targeted discount coupons, surveys, and win-back email sequences.'
        }
    ]

    return insights

def generate_customer_profile_comparison(customer_row, segment):
    if not segment:
        return {}

    income_cust = customer_row.get('Annual Income', 0)
    income_avg = segment.get('avg_income', 1)
    income_diff = float(np.round(((income_cust - income_avg) / max(1, income_avg)) * 100, 1))

    spending_cust = customer_row.get('Spending Score', 0)
    spending_avg = segment.get('avg_spending', 1)
    spending_diff = float(np.round(((spending_cust - spending_avg) / max(1, spending_avg)) * 100, 1))

    age_cust = customer_row.get('Age', 0)
    age_avg = segment.get('avg_age', 1)
    age_diff = float(np.round(((age_cust - age_avg) / max(1, age_avg)) * 100, 1))

    return {
        'income_comparison': {'customer': income_cust, 'cluster_avg': income_avg, 'diff_percent': income_diff},
        'spending_comparison': {'customer': spending_cust, 'cluster_avg': spending_avg, 'diff_percent': spending_diff},
        'age_comparison': {'customer': age_cust, 'cluster_avg': age_avg, 'diff_percent': age_diff}
    }
