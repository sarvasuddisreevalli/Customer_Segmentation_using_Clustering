"""
chat.py
-------
Ask SegmentIQ conversational analytics engine.
Answers user natural-language questions about customer segmentation using strictly verified evidence.
Prevents prompt injection, hallucinatory metrics, and arbitrary execution.
"""

from typing import Any, Dict, List


def answer_segmentiq_question(question: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
    """Answers user analytics questions using verified clustering evidence."""
    q = question.lower().strip()
    segments = evidence.get("segments", [])
    valid_segs = [s for s in segments if s["cluster_label"] >= 0]
    total_cust = evidence.get("total_customers", 0)
    algo = evidence.get("algorithm", "Clustering").upper()
    eval_data = evidence.get("evaluation", {})
    sil = eval_data.get("silhouette_score")

    # 1. Highest spending / value question
    if any(k in q for k in ["spend", "spending", "spends", "top spender"]):
        spend_feat = evidence.get("spend_feature")
        if spend_feat and valid_segs:
            top_spend = max(valid_segs, key=lambda s: s.get("average_features", {}).get(spend_feat, -1))
            val = top_spend["average_features"].get(spend_feat)
            ans = (
                f"Based on the **{spend_feat}** feature, the highest-spending segment is **{top_spend['segment_name']}** "
                f"with an average of **{val}**. This segment comprises {top_spend['customer_count']:,} customers "
                f"({top_spend['percentage']}% of the dataset)."
            )
            supporting_metrics = {"segment": top_spend["segment_name"], spend_feat: val, "count": top_spend["customer_count"]}
        else:
            ans = "The selected dataset features do not include an explicit spending or monetary metric."
            supporting_metrics = {}

    # 2. Main segments / How many segments
    elif any(k in q for k in ["how many segment", "main segment", "what are the segment", "clusters"]):
        seg_list = ", ".join([f"**{s['segment_name']}** ({s['percentage']}%)" for s in valid_segs])
        ans = (
            f"The **{algo}** model discovered **{len(valid_segs)} segments** across {total_cust:,} customers: {seg_list}. "
            f"Noise points account for {eval_data.get('noise_percentage', 0)}% of customers."
        )
        supporting_metrics = {"total_segments": len(valid_segs), "total_customers": total_cust}

    # 3. Model performance / Silhouette score
    elif any(k in q for k in ["performance", "silhouette", "davies", "metric", "accuracy", "good"]):
        ans = (
            f"The **{algo}** clustering run achieved a **Silhouette Score of {sil if sil is not None else 'N/A'}** "
            f"and a **Davies-Bouldin Index of {eval_data.get('davies_bouldin_index', 'N/A')}**. "
            "Higher silhouette scores (approaching +1.0) reflect dense, well-separated clusters, while lower Davies-Bouldin scores reflect tighter clusters."
        )
        supporting_metrics = eval_data

    # 4. Largest segment
    elif any(k in q for k in ["largest", "biggest", "most customer", "dominant"]):
        if valid_segs:
            largest = max(valid_segs, key=lambda s: s["customer_count"])
            ans = (
                f"The largest customer group is **{largest['segment_name']}** with **{largest['customer_count']:,} customers** "
                f"({largest['percentage']}% of the total population). Key trait: {largest.get('key_characteristics', ['Balanced features'])[0]}."
            )
            supporting_metrics = {"largest_segment": largest["segment_name"], "count": largest["customer_count"], "percentage": largest["percentage"]}
        else:
            ans = "No valid segments discovered."
            supporting_metrics = {}

    # 5. Marketing recommendation / Strategy
    elif any(k in q for k in ["recommend", "strategy", "campaign", "action", "retention"]):
        if valid_segs:
            top_seg = valid_segs[0]
            ans = (
                f"For your prominent segment (**{top_seg['segment_name']}**), we recommend testing: "
                f"**{top_seg.get('marketing_strategy', 'Targeted Nurturing')}** via "
                f"'{top_seg.get('marketing_campaign', 'personalized engagement')}'. "
                "Note: Marketing outcomes should be verified via controlled A/B experiments rather than assumed as guaranteed."
            )
            supporting_metrics = {"strategy": top_seg.get("marketing_strategy"), "campaign": top_seg.get("marketing_campaign")}
        else:
            ans = "No segments available to recommend strategies for."
            supporting_metrics = {}

    # 6. General synthesis fallback
    else:
        ans = (
            f"Analysis of {evidence.get('dataset_name', 'your dataset')} with **{algo}** "
            f"identifies **{evidence.get('n_clusters_found', 0)} customer groups** across {total_cust:,} customers. "
            f"The average Silhouette score is {sil if sil is not None else 'N/A'}. "
            "You can ask specific questions such as 'Which segment spends the most?', 'What are the main segments?', or 'How can we improve retention?'"
        )
        supporting_metrics = {"n_clusters": evidence.get("n_clusters_found"), "customers": total_cust}

    return {
        "question": question,
        "answer": ans,
        "supporting_metrics": supporting_metrics,
        "evidence_source": f"Run ID {evidence.get('run_id')} ({evidence.get('dataset_name')})",
        "grounded": True,
    }
