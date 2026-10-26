"""
profiler.py
-----------
Customer segment profiling: assigns descriptive labels to clusters
based on actual computed statistics. No hardcoded results.
"""

from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd


# ── helpers ──────────────────────────────────────────────────────────────────

def _describe_relative(value: float, global_mean: float, std: float, feature: str) -> Optional[str]:
    """Return a human-readable characterisation of a cluster mean vs the global mean."""
    if std == 0:
        return None
    z = (value - global_mean) / std
    label = feature.lower().replace("_", " ")
    if z > 0.7:
        return f"high {label}"
    if z < -0.7:
        return f"low {label}"
    return None


def _classify_segment(profile: Dict[str, Any], global_stats: Dict[str, Any]) -> str:
    """
    Derive a human-readable segment name from actual cluster statistics.
    Falls back to a neutral label when the data does not support a specific name.
    """
    chars = profile.get("distinguishing_characteristics", [])

    # Income & spending axis
    has_high_income = any("high" in c and "income" in c for c in chars)
    has_low_income = any("low" in c and "income" in c for c in chars)
    has_high_spending = any("high" in c and "spend" in c for c in chars)
    has_low_spending = any("low" in c and "spend" in c for c in chars)
    has_high_freq = any("high" in c and "frequen" in c for c in chars)
    has_low_freq = any("low" in c and "frequen" in c for c in chars)
    has_high_recency = any("high" in c and "recen" in c for c in chars)
    has_low_recency = any("low" in c and "recen" in c for c in chars)

    if has_high_income and has_high_spending:
        return "High-Value Customers"
    if has_high_income and has_low_spending:
        return "Affluent Savers"
    if has_low_income and has_high_spending:
        return "Budget Spenders"
    if has_low_income and has_low_spending:
        return "Low-Engagement Customers"
    if has_high_freq and has_high_spending:
        return "Loyal Active Buyers"
    if has_high_freq:
        return "Frequent Buyers"
    if has_low_freq and has_low_spending:
        return "At-Risk Customers"
    if has_high_recency:
        return "Recently Active Customers"
    if has_low_recency:
        return "Lapsed Customers"
    if has_high_spending:
        return "High-Spending Customers"
    if has_low_spending:
        return "Budget-Conscious Customers"

    # Neutral fallback
    cid = profile["cluster_id"]
    return f"Segment {cid + 1}"


def _marketing_recommendation(segment_name: str, chars: List[str]) -> Dict[str, str]:
    """Return a rule-based marketing recommendation dict."""
    mapping = {
        "High-Value Customers": {
            "strategy": "VIP Retention",
            "campaign": "Exclusive loyalty rewards, early product access, and premium support.",
            "business_goal": "Maximise lifetime value and deepen brand loyalty.",
        },
        "Affluent Savers": {
            "strategy": "Targeted Upsell",
            "campaign": "Highlight premium bundles with strong value propositions and limited-time offers.",
            "business_goal": "Convert high potential into higher spending.",
        },
        "Budget Spenders": {
            "strategy": "Value Positioning",
            "campaign": "Flash sales, instalment offers, and budget-friendly product recommendations.",
            "business_goal": "Increase transaction frequency among price-sensitive customers.",
        },
        "Low-Engagement Customers": {
            "strategy": "Re-engagement",
            "campaign": "Win-back emails with targeted discounts and simplified product discovery.",
            "business_goal": "Reduce churn risk and reactivate dormant accounts.",
        },
        "Loyal Active Buyers": {
            "strategy": "Cross-Sell",
            "campaign": "Personalised product bundles and referral incentive programmes.",
            "business_goal": "Grow revenue per customer and expand product reach.",
        },
        "Frequent Buyers": {
            "strategy": "Frequency Rewards",
            "campaign": "Punch-card loyalty programmes and subscription offers.",
            "business_goal": "Sustain and increase purchase cadence.",
        },
        "At-Risk Customers": {
            "strategy": "Churn Prevention",
            "campaign": "Satisfaction surveys, exclusive re-engagement discounts, and proactive support.",
            "business_goal": "Reduce churn rate and identify root causes of disengagement.",
        },
        "Recently Active Customers": {
            "strategy": "Nurture & Convert",
            "campaign": "Onboarding sequences, social proof, and time-limited new customer offers.",
            "business_goal": "Convert recent activity into long-term purchasing habits.",
        },
        "Lapsed Customers": {
            "strategy": "Win-Back Campaign",
            "campaign": "Re-activation email series with a compelling incentive.",
            "business_goal": "Recover lapsed revenue and extend customer lifecycle.",
        },
        "High-Spending Customers": {
            "strategy": "Premium Experiences",
            "campaign": "Invite to exclusive events, personal shoppers, and premium tier programmes.",
            "business_goal": "Strengthen brand affinity among top spenders.",
        },
        "Budget-Conscious Customers": {
            "strategy": "Deal-Driven Engagement",
            "campaign": "Weekly promotions, value packs, and comparison guides.",
            "business_goal": "Drive volume through value-oriented messaging.",
        },
    }
    default = {
        "strategy": "General Engagement",
        "campaign": "Broad-reach email campaigns with personalised product recommendations.",
        "business_goal": "Improve overall customer satisfaction and repeat purchase rate.",
    }
    return mapping.get(segment_name, default)


# ── main profiling function ───────────────────────────────────────────────────

def build_segment_profiles(
    df_original: pd.DataFrame,
    labels: np.ndarray,
    feature_names: List[str],
    id_column: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Build rich segment profiles from actual cluster assignments.

    Parameters
    ----------
    df_original : pd.DataFrame
        The *unscaled* dataframe (raw or imputed – not StandardScaled).
    labels      : np.ndarray
        Cluster label for each row (aligned with df_original).
    feature_names : List[str]
        Numeric feature columns to profile.
    id_column   : str or None
        Column name that holds customer IDs.

    Returns
    -------
    dict with 'profiles', 'executive_summary', convenience spotlight keys.
    """
    df = df_original.copy().reset_index(drop=True)
    df = df.iloc[: len(labels)].copy()  # safety alignment
    df["__cluster__"] = labels

    n_total = len(df)

    # Global stats for relative comparisons
    global_stats: Dict[str, Dict[str, float]] = {}
    for feat in feature_names:
        if feat in df.columns:
            s = df[feat].dropna()
            global_stats[feat] = {
                "mean": float(s.mean()),
                "std": float(s.std()) if len(s) > 1 else 0.0,
            }

    profiles: List[Dict[str, Any]] = []
    unique_labels = sorted(set(labels))

    for cluster_id in unique_labels:
        is_noise = bool(int(cluster_id) == -1)
        mask = df["__cluster__"] == cluster_id
        cluster_df = df[mask]
        count = int(mask.sum())
        pct = round(count / n_total * 100, 2)

        avg_feats: Dict[str, float] = {}
        distinguishing: List[str] = []

        for feat in feature_names:
            if feat not in cluster_df.columns:
                continue
            s = cluster_df[feat].dropna()
            if len(s) == 0:
                avg_feats[feat] = 0.0
                continue
            avg = float(s.mean())
            avg_feats[feat] = round(avg, 4)
            g = global_stats.get(feat, {})
            desc = _describe_relative(avg, g.get("mean", avg), g.get("std", 0.0), feat)
            if desc:
                distinguishing.append(desc)

        profile: Dict[str, Any] = {
            "cluster_id": int(cluster_id),
            "is_noise": is_noise,
            "segment_name": "Noise / Outliers" if is_noise else None,
            "customer_count": count,
            "percentage": pct,
            "average_features": avg_feats,
            "distinguishing_characteristics": distinguishing,
            "key_characteristics": distinguishing[:4] if distinguishing else ["Average across all features"],
            "description": "",
            "marketing_recommendation": None,
        }

        if not is_noise:
            seg_name = _classify_segment(profile, global_stats)
            profile["segment_name"] = seg_name
            profile["description"] = (
                f"{seg_name} represents {pct}% of your customer base ({count:,} customers). "
                + (f"Key traits: {', '.join(distinguishing[:3])}." if distinguishing else "No strongly distinguishing traits found.")
            )
            profile["marketing_recommendation"] = _marketing_recommendation(seg_name, distinguishing)
        else:
            profile["description"] = (
                f"These {count} customers ({pct}%) could not be assigned to a cluster by DBSCAN. "
                "They may represent outliers or atypical purchasing behaviour."
            )
            profile["marketing_recommendation"] = {
                "strategy": "Individual Review",
                "campaign": "Manual inspection recommended for outlier customers.",
                "business_goal": "Understand atypical customer behaviour patterns.",
            }

        profiles.append(profile)

    # ── Spotlight segments (skip noise)
    valid_profiles = [p for p in profiles if not p["is_noise"]]

    def _find(metric_key: str, higher_is_better: bool = True) -> Optional[Dict[str, Any]]:
        scored = [
            (p, p["average_features"].get(metric_key, None))
            for p in valid_profiles
            if p["average_features"].get(metric_key) is not None
        ]
        if not scored:
            return valid_profiles[0] if valid_profiles else None
        return max(scored, key=lambda x: x[1] if higher_is_better else -x[1])[0]

    # Guess feature name aliases
    income_feat = next((f for f in feature_names if "income" in f.lower()), None)
    spend_feat = next((f for f in feature_names if "spend" in f.lower() or "score" in f.lower()), None)
    freq_feat = next((f for f in feature_names if "freq" in f.lower() or "purchase" in f.lower()), None)

    largest = max(valid_profiles, key=lambda p: p["customer_count"]) if valid_profiles else None
    highest_value = _find(income_feat) if income_feat else largest
    highest_spending = _find(spend_feat) if spend_feat else largest
    most_frequent = _find(freq_feat) if freq_feat else largest
    lowest_engagement = _find(spend_feat, higher_is_better=False) if spend_feat else largest

    n_segs = len(valid_profiles)
    executive_summary = (
        f"Analysis identified {n_segs} distinct customer segment{'s' if n_segs != 1 else ''} "
        f"from {n_total:,} customers across {len(feature_names)} features. "
        + (f"The largest segment is '{largest['segment_name']}' ({largest['percentage']}% of customers). " if largest else "")
        + (f"'{highest_value['segment_name']}' shows the strongest value indicators. " if highest_value and highest_value != largest else "")
        + "Use the segment profiles below to design targeted marketing strategies."
    )

    def _to_builtin(obj):
        if isinstance(obj, dict):
            return {k: _to_builtin(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [_to_builtin(x) for x in obj]
        elif isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, (np.bool_, bool)):
            return bool(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return obj

    res = {
        "executive_summary": executive_summary,
        "n_segments": n_segs,
        "n_noise_points": sum(1 for l in labels if l == -1),
        "profiles": profiles,
        "largest_segment": largest,
        "highest_value_segment": highest_value,
        "highest_spending_segment": highest_spending,
        "most_frequent_segment": most_frequent,
        "lowest_engagement_segment": lowest_engagement,
    }
    return _to_builtin(res)
