from app.services.inference_engine import InferenceResult, RuleTrace, ConditionEvaluation, Fact
from app.services.knowledge_base import DOMAINS, WeatherRule


RISK_PCT_NONE = 30
RISK_PCT_MODERATE = 50
RISK_PCT_HIGH = 70


def _risk_color(severity: str) -> str:
    return {"HIGH": "red", "EXTREME": "red", "MODERATE": "amber", "LOW": "emerald"}.get(
        severity.upper(), "emerald"
    )


def _risk_level_from_pct(pct: float) -> str:
    if pct >= RISK_PCT_HIGH:
        return "High"
    elif pct >= RISK_PCT_MODERATE:
        return "Moderate"
    elif pct >= RISK_PCT_NONE:
        return "Low"
    return "None"


ACTION_MAP: dict[str, dict[str, list[str]]] = {
    "flood_risk": {
        "HIGH": [
            "Seal windows and doors with flood barriers",
            "Move valuable items to higher ground",
            "Prepare emergency evacuation kit",
            "Monitor local flood warnings",
        ],
        "MODERATE": [
            "Monitor water levels in low-lying areas",
            "Keep emergency kit accessible",
            "Stay informed about local flood alerts",
        ],
        "LOW": [
            "Carry umbrella and waterproof clothing",
            "Avoid low-lying roads if rain persists",
        ],
    },
    "storm_risk": {
        "HIGH": [
            "Secure outdoor furniture and loose objects",
            "Charge power banks and prepare backup generator",
            "Avoid coastal areas during high wind period",
            "Stay indoors away from windows",
        ],
        "MODERATE": [
            "Secure loose items on balconies",
            "Take care when driving high-sided vehicles",
            "Review emergency plans",
        ],
        "LOW": [
            "Caution advised for outdoor activities",
            "Secure lightweight outdoor items",
        ],
    },
    "heat_risk": {
        "EXTREME": [
            "Stay indoors during peak heat hours (12:00-16:00)",
            "Ensure hydration for all household members",
            "Activate backup cooling systems",
            "Check on elderly and vulnerable neighbors",
        ],
        "HIGH": [
            "Stay hydrated throughout the day",
            "Avoid strenuous outdoor activity",
            "Wear light clothing and apply sunscreen",
        ],
        "MODERATE": [
            "Wear light clothing and apply sunscreen",
            "Stay hydrated throughout the day",
            "Limit outdoor exposure during midday",
        ],
        "LOW": [
            "Normal precautions advised",
            "Enjoy the weather and stay weather-aware",
        ],
    },
}

FARM_ACTION_MAP: dict[str, list[str]] = {
    "OPTIMAL": ["Optimal conditions for planting and harvesting today"],
    "DELAY": ["Delay planting — heat stress will affect germination"],
}

FIELD_ACTION_MAP: dict[str, list[str]] = {
    "AVOID": ["Avoid field work — soil too wet, risk of compaction"],
}

IRRIGATION_ACTION_MAP: dict[str, list[str]] = {
    "RECOMMENDED": ["Irrigation recommended — low rainfall expected in next 3 days"],
    "DELAY": ["Delay irrigation — heavy rain incoming may cause runoff"],
}

PEST_FUNGAL_ACTION_MAP: dict[str, list[str]] = {
    "HIGH_RISK": ["Warm & humid conditions favor fungal diseases — apply preventive fungicide"],
}

PEST_MONITOR_ACTION_MAP: dict[str, list[str]] = {
    "RECOMMENDED": ["Monitor for pest outbreaks — heat stress attracts aphids and mites"],
}

WIND_ACTION_MAP: dict[str, list[str]] = {
    "INSTALL": ["Install windbreaks or delay spraying — high winds forecast"],
}

SPRAY_ACTION_MAP: dict[str, list[str]] = {
    "AVOID": ["Avoid pesticide spraying — drift risk due to moderate winds"],
}

HARVEST_ACTION_MAP: dict[str, list[str]] = {
    "GOOD_WINDOW": ["Good harvest window opening — minimal rain expected"],
}

SOLAR_GEN_MAP: dict[str, list[str]] = {
    "EXCELLENT": ["Excellent solar generation expected today — run full capacity"],
    "GOOD": ["Good solar conditions — standard generation expected"],
    "LOW": ["Low solar generation expected — consider grid backup"],
    "MINIMAL": ["Minimal solar input — schedule maintenance during low production"],
}

SOLAR_CLEAN_MAP: dict[str, list[str]] = {
    "RECOMMENDED": ["No rain expected — good time for panel cleaning"],
    "POSTPONE": ["Rain will naturally clean panels — postpone manual cleaning"],
}

SOLAR_BATT_MAP: dict[str, list[str]] = {
    "CHARGE": ["Limited sun next 48h — ensure batteries are fully charged"],
}

SOLAR_LOAD_MAP: dict[str, list[str]] = {
    "REDUCE": ["Reduce non-essential load — low solar yield expected"],
}

SOLAR_EFF_MAP: dict[str, list[str]] = {
    "HEAT_REDUCED": ["Heat reduces panel efficiency — ensure adequate ventilation"],
    "COLD_IMPROVED": ["Cold temperatures improve panel efficiency — expect higher output"],
}

FORECAST_ACTION_MAP: dict[str, list[str]] = {
    "LOW": [
        "Forecast may be unreliable — cross-reference with other weather sources",
        "Plan for temperature variance of ±5°C from predicted values",
    ],
    "MEDIUM": [
        "Moderate forecast confidence — monitor conditions closely",
        "Expected temperature variance ±2-3°C from predictions",
    ],
    "HIGH": [
        "High forecast confidence — predictions align with historical patterns",
        "Expected temperature variance ±1°C from predictions",
    ],
}


def _build_recommendation(
    text: str, triggered_by: str, certainty: float
) -> dict:
    return {
        "text": text,
        "triggered_by": triggered_by,
        "certainty": round(certainty, 2),
    }


def build_expert_report(
    inference_result: InferenceResult,
    sensor_facts: list[Fact],
    data_source: dict,
    forecast_validation: dict | None = None,
) -> dict:
    risks: list[dict] = []
    recommendations: list[dict] = []
    farm_suggestions: list[str] = []
    solar_suggestions: list[str] = []

    # Build risks from derived facts
    risk_domains = {
        "flood": ("flood_risk", "Coastal Flood Warning", "flood"),
        "storm": ("storm_risk", "Storm Warning", "storm"),
        "heat": ("heat_risk", "Extreme Heatwave", "heat"),
    }

    for domain_key, (fact_name, high_name, risk_id) in risk_domains.items():
        risk_facts = inference_result.derived_facts.get(fact_name, [])

        fired_traces = [
            t
            for t in inference_result.fired_rules
            if t.domain == domain_key
        ]

        if risk_facts:
            best = max(
                risk_facts,
                key=lambda f: {"LOW": 0, "MODERATE": 1, "HIGH": 2, "EXTREME": 3}.get(
                    str(f.value), -1
                ),
            )
            severity_str = str(best.value).capitalize()
            pct = round(best.certainty * 100)

            # Apply user-defined threshold: < 30 → no risk shown
            if pct < RISK_PCT_NONE:
                continue

            is_high = severity_str in ("High", "Extreme")

            display_name = high_name if severity_str == "High" else (
                "Extreme Heatwave" if severity_str == "Extreme" else (
                    "Elevated Heat" if domain_key == "heat" else (
                        f"{domain_key.capitalize()} Warning" if severity_str == "Moderate" else
                        f"{domain_key.capitalize()} Advisory"
                    )
                )
            )
            if domain_key == "heat" and severity_str == "Moderate":
                display_name = "Elevated Heat"
            elif domain_key == "heat" and severity_str == "Low":
                display_name = "Heat Advisory"

            detail_parts = []
            for t in fired_traces:
                detail_parts.append(t.rule_description)
            detail = ". ".join(detail_parts) if detail_parts else f"{domain_key.capitalize()} conditions detected"

            risks.append({
                "id": risk_id,
                "name": display_name,
                "percentage": pct,
                "severity": severity_str,
                "certainty": round(best.certainty, 2),
                "color": _risk_color(severity_str),
                "detail": detail,
                "explanation": {
                    "conclusion": f"{fact_name} = {best.value}",
                    "certainty": round(best.certainty, 2),
                    "chain": [
                        {
                            "rule_id": t.rule_id,
                            "rule_description": t.rule_description,
                            "certainty": round(t.propagated_certainty, 2),
                            "conditions": [
                                {
                                    "fact": c.fact,
                                    "operator": c.operator,
                                    "expected": c.expected_value,
                                    "actual": c.actual_value,
                                    "matched": c.matched,
                                    "weight": c.weight,
                                }
                                for c in t.conditions_evaluated
                            ],
                        }
                        for t in fired_traces
                    ],
                },
            })

    # Determine highest severity across all detected risks
    highest_severity = "NONE"
    for r in risks:
        s = r["severity"].upper()
        if {"LOW": 0, "MODERATE": 1, "HIGH": 2, "EXTREME": 3}.get(s, -1) > {"LOW": 0, "MODERATE": 1, "HIGH": 2, "EXTREME": 3}.get(highest_severity, -1):
            highest_severity = s
    has_critical_risk = highest_severity in ("HIGH", "EXTREME")

    # Build recommendations from action map
    for domain_key, (fact_name, high_name, risk_id) in risk_domains.items():
        risk_facts = inference_result.derived_facts.get(fact_name, [])
        if not risk_facts:
            continue
        best = max(
            risk_facts,
            key=lambda f: {"LOW": 0, "MODERATE": 1, "HIGH": 2, "EXTREME": 3}.get(
                str(f.value), -1
            ),
        )
        value_str = str(best.value).upper()

        # Skip LOW-severity recommendations when a critical risk is active
        if has_critical_risk and value_str == "LOW":
            continue

        fired_traces = [
            t
            for t in inference_result.fired_rules
            if t.domain == domain_key
        ]

        if fact_name in ACTION_MAP and value_str in ACTION_MAP[fact_name]:
            for action_text in ACTION_MAP[fact_name][value_str]:
                recommendations.append(
                    _build_recommendation(action_text, fired_traces[0].rule_id if fired_traces else "N/A", best.certainty)
                )

    # Build farm suggestions
    farm_maps = [
        (inference_result.derived_facts.get("farm_planting", []), FARM_ACTION_MAP),
        (inference_result.derived_facts.get("farm_field_work", []), FIELD_ACTION_MAP),
        (inference_result.derived_facts.get("farm_irrigation", []), IRRIGATION_ACTION_MAP),
        (inference_result.derived_facts.get("farm_pest_fungal", []), PEST_FUNGAL_ACTION_MAP),
        (inference_result.derived_facts.get("farm_pest_monitoring", []), PEST_MONITOR_ACTION_MAP),
        (inference_result.derived_facts.get("farm_wind_protection", []), WIND_ACTION_MAP),
        (inference_result.derived_facts.get("farm_spraying", []), SPRAY_ACTION_MAP),
        (inference_result.derived_facts.get("farm_harvest", []), HARVEST_ACTION_MAP),
    ]

    for facts, action_map in farm_maps:
        for f in facts:
            val_str = str(f.value)
            if val_str in action_map:
                farm_suggestions.extend(action_map[val_str])

    # Build solar suggestions
    solar_maps = [
        (inference_result.derived_facts.get("solar_generation", []), SOLAR_GEN_MAP),
        (inference_result.derived_facts.get("solar_cleaning", []), SOLAR_CLEAN_MAP),
        (inference_result.derived_facts.get("solar_battery", []), SOLAR_BATT_MAP),
        (inference_result.derived_facts.get("solar_load", []), SOLAR_LOAD_MAP),
        (inference_result.derived_facts.get("solar_efficiency", []), SOLAR_EFF_MAP),
    ]

    for facts, action_map in solar_maps:
        for f in facts:
            val_str = str(f.value)
            if val_str in action_map:
                solar_suggestions.extend(action_map[val_str])

    # Build forecast validation recommendations (skip when critical risks are active)
    if forecast_validation and not has_critical_risk:
        fv_status = forecast_validation.get("overall_status", "NONE")
        if fv_status in FORECAST_ACTION_MAP:
            for action_text in FORECAST_ACTION_MAP[fv_status]:
                recommendations.append(
                    _build_recommendation(action_text, "FORECAST_VALIDATION", forecast_validation.get("average_confidence", 0.0))
                )

    # Build evaluated rules by domain
    evaluated_by_domain: dict[str, list[dict]] = {}
    for trace in inference_result.evaluated_rules:
        if trace.domain not in evaluated_by_domain:
            evaluated_by_domain[trace.domain] = []
        evaluated_by_domain[trace.domain].append({
            "rule_id": trace.rule_id,
            "description": trace.rule_description,
            "certainty": trace.certainty,
            "matched": trace.matched,
            "propagated_certainty": round(trace.propagated_certainty, 2),
            "conditions": [
                {
                    "fact": c.fact,
                    "operator": c.operator,
                    "expected": c.expected_value,
                    "actual": c.actual_value,
                    "matched": c.matched,
                }
                for c in trace.conditions_evaluated
            ],
            "conclusion": trace.conclusion,
            "conclusion_value": trace.conclusion_value,
        })

    # Build sensor facts display
    fact_displays = [
        {
            "name": f.name,
            "value": f.value,
            "certainty": round(f.certainty, 2),
            "source": f.source,
        }
        for f in sensor_facts
    ]

    # Build derived facts display
    derived_displays = []
    for name, facts in inference_result.derived_facts.items():
        for f in facts:
            derived_displays.append({
                "name": f.name,
                "value": f.value,
                "certainty": round(f.certainty, 2),
                "source": f.source,
                "fired_rule_id": f.fired_rule_id,
            })

    # Determine overall confidence (average CF of highest risk per domain)
    certainty_values = [r["certainty"] for r in risks if r["certainty"] > 0]
    overall_certainty = round(
        sum(certainty_values) / len(certainty_values), 2
    ) if certainty_values else 0.0

    return {
        "timestamp": data_source.get("fetched_at", ""),
        "data_source": data_source,
        "sensor_facts": fact_displays,
        "derived_facts": derived_displays,
        "risks": risks,
        "recommendations": recommendations,
        "farm_suggestions": list(dict.fromkeys(farm_suggestions)),
        "solar_suggestions": list(dict.fromkeys(solar_suggestions)),
        "inference_metrics": {
            "total_rules_evaluated": inference_result.total_rules_evaluated,
            "total_rules_fired": inference_result.total_rules_fired,
            "execution_time_ms": inference_result.execution_time_ms,
            "facts_loaded": inference_result.facts_loaded,
            "overall_certainty": overall_certainty,
        },
        "evaluated_by_domain": evaluated_by_domain,
        "forecast_validation": forecast_validation or {
            "validated_hours": [],
            "average_temp_deviation": None,
            "average_confidence": 0.0,
            "hours_validated": 0,
            "overall_status": "NONE",
            "baseline_anchor": None,
        },
    }
