"""
report_generator.py
--------------------
Generates structured executive customer segmentation reports.
Produces clear Markdown documents based strictly on verified calculations.
"""

from typing import Any, Dict
from app.ai.insight_engine import generate_segment_insights
from app.ai.recommendations import generate_recommendations


def generate_executive_report(evidence: Dict[str, Any]) -> str:
    """Generates a complete executive analytics report in Markdown format."""
    dataset_name = evidence.get("dataset_name", "Customer Dataset")
    total_cust = evidence.get("total_customers", 0)
    algo = evidence.get("algorithm", "Clustering").upper()
    n_segs = evidence.get("n_clusters_found", 0)
    eval_data = evidence.get("evaluation", {})
    features = evidence.get("selected_features", [])

    insights = generate_segment_insights(evidence)
    recs = generate_recommendations(evidence)

    md = []
    md.append(f"# Executive Segmentation & Customer Intelligence Report")
    md.append(f"**Dataset:** {dataset_name} | **Algorithm:** {algo} | **Analyzed Customers:** {total_cust:,}\n")

    md.append("## 1. Executive Summary")
    md.append(insights.get("executive_summary", "Customer segmentation completed successfully."))
    md.append("")

    md.append("## 2. Methodology & Model Evaluation")
    md.append(f"- **Algorithm Deployed:** {algo}")
    md.append(f"- **Features Analyzed:** {', '.join(features) if features else 'All numeric columns'}")
    md.append(f"- **Discovered Segments:** {n_segs}")
    md.append(f"- **Silhouette Score:** {eval_data.get('silhouette_score', 'N/A')} (measures cluster cohesion and separation)")
    md.append(f"- **Davies-Bouldin Index:** {eval_data.get('davies_bouldin_index', 'N/A')} (lower values indicate better clustering)")
    md.append(f"- **Calinski-Harabasz Index:** {eval_data.get('calinski_harabasz_index', 'N/A')}")
    md.append(f"- **Noise Ratio:** {eval_data.get('noise_percentage', 0)}%\n")

    md.append("## 3. Customer Segment Distribution")
    md.append("| Cluster | Segment Name | Customer Count | Population % | Key Characteristic |")
    md.append("| :--- | :--- | :--- | :--- | :--- |")
    for s in evidence.get("segments", []):
        lbl = s["cluster_label"]
        name = s["segment_name"]
        count = s["customer_count"]
        pct = s["percentage"]
        trait = s.get("key_characteristics", ["Balanced metrics"])[0]
        md.append(f"| {lbl} | {name} | {count:,} | {pct}% | {trait} |")
    md.append("")

    md.append("## 4. Segment Deep-Dives")
    for s in insights.get("segment_insights", []):
        md.append(f"### {s['segment_name']} ({s['percentage']}% of Customer Base)")
        md.append(f"- **Interpretation:** {s['interpretation']}")
        md.append(f"- **Recommended Opportunity:** {s['opportunity']}")
        md.append(f"- **Confidence:** {s['confidence']}")
        md.append("")

    md.append("## 5. Prioritized Business Recommendations")
    for r in recs:
        md.append(f"### [{r['priority']} Priority] {r['title']}")
        md.append(f"- **Target Segment:** {r['segment']}")
        md.append(f"- **Action:** {r['action']}")
        md.append(f"- **Expected Direction:** {r['expected_impact']}")
        md.append(f"- **Recommended KPI:** {r['success_metric']}")
        md.append("")

    md.append("## 6. Limitations and Next Steps")
    md.append("- **Statistical Correlation:** Clustering groups patterns in feature space; it does not infer personal motivations.")
    md.append("- **Experimental Validation:** All business strategies should be validated with small-cohort A/B testing before scaling.")
    md.append("- **Data Freshness:** Customer behaviors evolve; schedule recurring segmentation updates to maintain accuracy.\n")

    return "\n".join(md)
