"""
insight_engine.py
-----------------
AI Customer Intelligence engine.
Generates evidence-backed segment insights using Google Gemini / OpenAI when configured,
with a robust, deterministic rule-based fallback when external LLM credentials are absent.
"""

import os
from typing import Any, Dict, List, Optional
from app.ai.grounding import extract_grounded_evidence


def generate_segment_insights(evidence: Dict[str, Any]) -> Dict[str, Any]:
    """Generates structured AI insights from verified numerical evidence."""
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("OPENAI_API_KEY")

    # If LLM credentials exist, try LLM generation
    if api_key:
        try:
            return _generate_with_llm(evidence, api_key)
        except Exception:
            # Fall back safely on any provider timeout or error
            pass

    return _generate_deterministic_insights(evidence)


def _generate_deterministic_insights(evidence: Dict[str, Any]) -> Dict[str, Any]:
    """Deterministic, mathematically grounded fallback insights without external API calls."""
    algo = evidence.get("algorithm", "Clustering").upper()
    n_segs = evidence.get("n_clusters_found", 0)
    total_cust = evidence.get("total_customers", 0)
    sil = evidence.get("evaluation", {}).get("silhouette_score")

    sil_desc = "solid cohesion and cluster separation" if (sil and sil > 0.4) else "moderate cluster separation"
    summary = (
        f"{algo} discovered {n_segs} distinct customer segments across {total_cust:,} customer records. "
        f"Evaluation indicates a Silhouette score of {sil if sil is not None else 'N/A'}, demonstrating {sil_desc}. "
        "Each segment reveals distinct behavioral tendencies that can inform targeted retention, upsell, and loyalty initiatives."
    )

    segment_insights = []
    for s in evidence.get("segments", []):
        lbl = s["cluster_label"]
        name = s["segment_name"]
        count = s["customer_count"]
        pct = s["percentage"]
        avg_f = s.get("average_features", {})

        traits = s.get("key_characteristics", [])
        top_trait = traits[0] if traits else "Average feature levels"

        if lbl < 0:
            interpretation = (
                f"Noise points comprise {pct}% of customers ({count:,} records). These represent non-conforming outliers "
                "or unique purchasing behavior requiring bespoke customer service review."
            )
            opportunity = "Audit data collection for outliers and conduct manual account reviews."
        else:
            interpretation = (
                f"Segment '{name}' encompasses {pct}% of total customers ({count:,} profiles). "
                f"Distinguishing metrics: {top_trait}. Average values: {', '.join([f'{k}: {v}' for k, v in list(avg_f.items())[:3]])}."
            )
            opportunity = (
                f"Implement targeted {s.get('marketing_strategy', 'engagement')} campaigns focusing on: "
                f"{s.get('marketing_campaign', 'personalized communications')}."
            )

        segment_insights.append({
            "cluster_label": lbl,
            "segment_name": name,
            "customer_count": count,
            "percentage": pct,
            "interpretation": interpretation,
            "opportunity": opportunity,
            "confidence": "High (Grounded in calculated cluster metrics)",
            "limitations": "Clustering discovers correlation in feature space, not psychological intent or causal driver.",
        })

    return {
        "provider": "deterministic_grounded_engine",
        "executive_summary": summary,
        "segment_insights": segment_insights,
        "model_performance_note": f"Clustering evaluated with {evidence.get('evaluation', {}).get('silhouette_score', 'N/A')} Silhouette score.",
        "ai_grounded": True,
    }


def _generate_with_llm(evidence: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    """Optional LLM-enhanced generation with strict grounding constraints."""
    # Build compact prompt containing ONLY aggregated statistics
    compact_evidence = {
        "algorithm": evidence["algorithm"],
        "n_clusters": evidence["n_clusters_found"],
        "total_customers": evidence["total_customers"],
        "evaluation": evidence["evaluation"],
        "segments": [
            {
                "name": s["segment_name"],
                "count": s["customer_count"],
                "percentage": s["percentage"],
                "traits": s.get("key_characteristics", [])[:3],
                "averages": s.get("average_features", {}),
            }
            for s in evidence.get("segments", [])
        ],
    }

    # For safety and predictable student environments, we verify if google.generativeai is installed
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = (
            "You are a Senior Principal Data Scientist. Analyze this customer clustering evidence. "
            "STRICT RULE: Do NOT invent metrics, revenue numbers, or conversion rates. Only reference numbers in the evidence.\n"
            f"Evidence: {compact_evidence}\n"
            "Return a concise 2-sentence executive summary and 1 strategic business hypothesis per segment."
        )
        resp = model.generate_content(prompt)
        text = resp.text
        # Augment deterministic framework with LLM summary
        base = _generate_deterministic_insights(evidence)
        base["provider"] = "google_gemini_grounded"
        base["executive_summary"] = text.strip()
        return base
    except Exception:
        return _generate_deterministic_insights(evidence)
