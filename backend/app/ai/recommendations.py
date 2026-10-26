"""
recommendations.py
------------------
Intelligent marketing recommendation engine.
Synthesizes business heuristics with verified clustering metrics.
Recommendations are explicitly framed as testable business hypotheses with suggested KPIs.
"""

from typing import Any, Dict, List


def generate_recommendations(evidence: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generates prioritized business recommendations grounded in verified segment metrics."""
    recommendations = []
    segments = evidence.get("segments", [])
    if not segments:
        return []

    # Sort segments by customer count descending
    sorted_segs = sorted(segments, key=lambda s: s.get("customer_count", 0), reverse=True)

    for idx, seg in enumerate(sorted_segs):
        lbl = seg["cluster_label"]
        name = seg["segment_name"]
        count = seg["customer_count"]
        pct = seg["percentage"]
        avg_f = seg.get("average_features", {})

        if lbl < 0:
            recommendations.append({
                "id": f"rec_{lbl}",
                "title": f"Investigate Outlier Behaviors ({count:,} Customers)",
                "segment": name,
                "priority": "Low",
                "evidence": f"{pct}% of customers are unclustered noise points under DBSCAN.",
                "action": "Conduct qualitative data audit and transaction inspection to discover edge-case behavior.",
                "expected_impact": "Hypothesis: Reduces data collection anomalies and clarifies non-standard purchasing journeys.",
                "success_metric": "Outlier classification rate in subsequent clustering iterations.",
                "limitations": "Outliers may be legitimate high-frequency shoppers or fraudulent activity.",
            })
            continue

        # Check for High Spending / High Value
        is_top_segment = idx == 0
        is_high_spend = any(
            any(k in feat.lower() for k in ["spend", "score", "value"]) and val > 65
            for feat, val in avg_f.items()
        )

        if is_high_spend or "High" in name:
            priority = "High"
            action = "Establish an exclusive VIP tier, invite-only early product access, and dedicated support concierge."
            impact = "Hypothesis: Fortifies customer retention and increases annual customer lifetime value."
            kpi = "Net Promoter Score (NPS) and 90-day repeat order rate."
        elif is_top_segment:
            priority = "High"
            action = "Design core lifecycle nurturing campaigns emphasizing reliable product quality and cross-sell bundles."
            impact = f"Hypothesis: Sustains engagement across the largest customer population ({pct}% of total base)."
            kpi = "Average Order Value (AOV) and purchase cadence."
        else:
            priority = "Medium" if pct > 15 else "Low"
            action = f"Deploy value-driven promotional messaging and re-engagement incentives tailored to {name}."
            impact = "Hypothesis: Tests whether price elasticity or product discovery stimulates secondary purchases."
            kpi = "Campaign click-through rate (CTR) and conversion rate on promotional offers."

        recommendations.append({
            "id": f"rec_{lbl}_{idx}",
            "title": f"Targeted Strategy for {name}",
            "segment": name,
            "priority": priority,
            "evidence": f"Represents {pct}% of customer base ({count:,} customers) with distinct feature profile: {', '.join([f'{k}={v}' for k, v in list(avg_f.items())[:2]])}.",
            "action": action,
            "expected_impact": impact,
            "success_metric": kpi,
            "limitations": "Effectiveness depends on price sensitivity, season, and external market conditions; must be tested with A/B experiments.",
        })

    # Sort by Priority: High -> Medium -> Low
    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    recommendations.sort(key=lambda r: priority_order.get(r["priority"], 3))

    return recommendations
