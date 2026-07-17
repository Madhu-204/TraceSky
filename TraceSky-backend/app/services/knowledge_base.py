from dataclasses import dataclass, field
from typing import Any, Literal


@dataclass
class RuleCondition:
    fact: str
    op: Literal["eq", "neq", "gt", "gte", "lt", "lte", "between", "in"]
    value: Any
    weight: float = 1.0


@dataclass
class RuleConclusion:
    fact: str
    value: Any


@dataclass
class WeatherRule:
    id: str
    domain: str
    description: str
    priority: int
    certainty: float
    conditions: list[RuleCondition]
    conclusions: list[RuleConclusion]
    explanation: str
    explanation_short: str


FLOOD_RULES: list[WeatherRule] = [
    WeatherRule(
        id="FLOOD-HIGH-01",
        domain="flood",
        description="Heavy precipitation exceeding flood threshold",
        priority=90,
        certainty=0.85,
        conditions=[
            RuleCondition("precipitation", "gte", 50),
        ],
        conclusions=[RuleConclusion("flood_risk", "HIGH")],
        explanation="Precipitation of {precipitation}mm exceeds 50mm high flood threshold",
        explanation_short="Precip {precipitation}mm >= 50mm",
    ),
    WeatherRule(
        id="FLOOD-HIGH-02",
        domain="flood",
        description="Sustained heavy rainfall over 3 days",
        priority=85,
        certainty=0.80,
        conditions=[
            RuleCondition("precip_sum_3d", "gte", 100),
        ],
        conclusions=[RuleConclusion("flood_risk", "HIGH")],
        explanation="3-day precipitation sum of {precip_sum_3d}mm exceeds 100mm threshold, indicating sustained flooding potential",
        explanation_short="3d sum {precip_sum_3d}mm >= 100mm",
    ),
    WeatherRule(
        id="FLOOD-MOD-01",
        domain="flood",
        description="Moderate precipitation with high probability",
        priority=70,
        certainty=0.70,
        conditions=[
            RuleCondition("precipitation", "gte", 20),
            RuleCondition("precip_prob", "gte", 60),
        ],
        conclusions=[RuleConclusion("flood_risk", "MODERATE")],
        explanation="Moderate precipitation ({precipitation}mm) with {precip_prob}% probability — monitor water levels",
        explanation_short="Precip {precipitation}mm & prob {precip_prob}%",
    ),
    WeatherRule(
        id="FLOOD-MOD-02",
        domain="flood",
        description="Moderate 3-day accumulation with continued rain chance",
        priority=65,
        certainty=0.65,
        conditions=[
            RuleCondition("precip_sum_3d", "gte", 30),
            RuleCondition("precip_prob", "gte", 50),
        ],
        conclusions=[RuleConclusion("flood_risk", "MODERATE")],
        explanation="3-day rainfall sum of {precip_sum_3d}mm with continued {precip_prob}% rain probability",
        explanation_short="3d sum {precip_sum_3d}mm & prob {precip_prob}%",
    ),
    WeatherRule(
        id="FLOOD-LOW-01",
        domain="flood",
        description="Light precipitation with some probability",
        priority=50,
        certainty=0.50,
        conditions=[
            RuleCondition("precipitation", "gte", 5),
            RuleCondition("precip_prob", "gte", 40),
        ],
        conclusions=[RuleConclusion("flood_risk", "LOW")],
        explanation="Light precipitation ({precipitation}mm) with {precip_prob}% probability — low risk",
        explanation_short="Precip {precipitation}mm & prob {precip_prob}%",
    ),
    WeatherRule(
        id="FLOOD-LOW-02",
        domain="flood",
        description="High humidity with rain probability suggesting damp conditions",
        priority=40,
        certainty=0.40,
        conditions=[
            RuleCondition("humidity", "gte", 85),
            RuleCondition("precip_prob", "gte", 30),
        ],
        conclusions=[RuleConclusion("flood_risk", "LOW")],
        explanation="High humidity ({humidity}%) with {precip_prob}% rain probability — monitor for changes",
        explanation_short="Humidity {humidity}% & prob {precip_prob}%",
    ),
]

STORM_RULES: list[WeatherRule] = [
    WeatherRule(
        id="STORM-HIGH-01",
        domain="storm",
        description="Extreme wind speeds exceeding storm threshold",
        priority=90,
        certainty=0.90,
        conditions=[
            RuleCondition("wind_speed", "gte", 60),
        ],
        conclusions=[RuleConclusion("storm_risk", "HIGH")],
        explanation="Wind speed of {wind_speed}km/h exceeds 60km/h storm threshold — secure loose objects, prepare for outages",
        explanation_short="Wind {wind_speed}km/h >= 60km/h",
    ),
    WeatherRule(
        id="STORM-HIGH-02",
        domain="storm",
        description="High wind gusts exceeding danger threshold",
        priority=85,
        certainty=0.85,
        conditions=[
            RuleCondition("gust_estimate", "gte", 80),
        ],
        conclusions=[RuleConclusion("storm_risk", "HIGH")],
        explanation="Estimated gusts of {gust_estimate}km/h (from {max_wind_24h}km/h max wind) exceed 80km/h danger threshold",
        explanation_short="Gusts {gust_estimate}km/h >= 80km/h",
    ),
    WeatherRule(
        id="STORM-MOD-01",
        domain="storm",
        description="Moderate to strong wind speeds",
        priority=70,
        certainty=0.70,
        conditions=[
            RuleCondition("wind_speed", "gte", 35),
            RuleCondition("wind_speed", "lt", 60),
        ],
        conclusions=[RuleConclusion("storm_risk", "MODERATE")],
        explanation="Wind speed of {wind_speed}km/h indicates moderate storm conditions — caution advised",
        explanation_short="Wind {wind_speed}km/h in [35, 60)",
    ),
    WeatherRule(
        id="STORM-MOD-02",
        domain="storm",
        description="Strong forecast winds over 48 hours",
        priority=65,
        certainty=0.65,
        conditions=[
            RuleCondition("max_wind_48h", "gte", 50),
        ],
        conclusions=[RuleConclusion("storm_risk", "MODERATE")],
        explanation="Maximum forecast wind of {max_wind_48h}km/h over 48 hours indicates sustained windy conditions",
        explanation_short="Max wind 48h {max_wind_48h}km/h >= 50km/h",
    ),
    WeatherRule(
        id="STORM-LOW-01",
        domain="storm",
        description="Elevated but non-critical wind speeds",
        priority=50,
        certainty=0.50,
        conditions=[
            RuleCondition("wind_speed", "gte", 20),
            RuleCondition("wind_speed", "lt", 35),
        ],
        conclusions=[RuleConclusion("storm_risk", "LOW")],
        explanation="Wind speed of {wind_speed}km/h is elevated but below warning thresholds",
        explanation_short="Wind {wind_speed}km/h in [20, 35)",
    ),
]

HEAT_RULES: list[WeatherRule] = [
    WeatherRule(
        id="HEAT-EXT-01",
        domain="heat",
        description="Extreme temperature exceeding 40°C",
        priority=95,
        certainty=0.95,
        conditions=[
            RuleCondition("temperature", "gte", 40),
        ],
        conclusions=[RuleConclusion("heat_risk", "EXTREME")],
        explanation="Temperature of {temperature}°C exceeds 40°C extreme heat threshold — emergency precautions needed",
        explanation_short="Temp {temperature}°C >= 40°C",
    ),
    WeatherRule(
        id="HEAT-HIGH-01",
        domain="heat",
        description="High temperature exceeding heat warning threshold",
        priority=85,
        certainty=0.85,
        conditions=[
            RuleCondition("temperature", "gte", 35),
            RuleCondition("temperature", "lt", 40),
        ],
        conclusions=[RuleConclusion("heat_risk", "HIGH")],
        explanation="Temperature of {temperature}°C is in high heat range — stay hydrated, avoid midday sun",
        explanation_short="Temp {temperature}°C in [35, 40)",
    ),
    WeatherRule(
        id="HEAT-HIGH-02",
        domain="heat",
        description="High feels-like temperature with actual heat",
        priority=80,
        certainty=0.80,
        conditions=[
            RuleCondition("feels_like", "gte", 38),
            RuleCondition("temperature", "gte", 32),
        ],
        conclusions=[RuleConclusion("heat_risk", "HIGH")],
        explanation="Feels-like temperature of {feels_like}°C (actual {temperature}°C) indicates dangerous heat index",
        explanation_short="Feels {feels_like}°C >= 38°C & temp {temperature}°C >= 32°C",
    ),
    WeatherRule(
        id="HEAT-MOD-01",
        domain="heat",
        description="Moderate temperature requiring caution",
        priority=70,
        certainty=0.70,
        conditions=[
            RuleCondition("temperature", "gte", 30),
            RuleCondition("temperature", "lt", 35),
        ],
        conclusions=[RuleConclusion("heat_risk", "MODERATE")],
        explanation="Temperature of {temperature}°C is moderately high — normal precautions advised",
        explanation_short="Temp {temperature}°C in [30, 35)",
    ),
    WeatherRule(
        id="HEAT-MOD-02",
        domain="heat",
        description="Forecast heatwave with high feels-like temps",
        priority=65,
        certainty=0.65,
        conditions=[
            RuleCondition("max_temp_7d", "gte", 35),
            RuleCondition("feels_like", "gte", 32),
        ],
        conclusions=[RuleConclusion("heat_risk", "MODERATE")],
        explanation="7-day max forecast of {max_temp_7d}°C with current feels-like {feels_like}°C indicates impending heatwave",
        explanation_short="7d max {max_temp_7d}°C >= 35°C & feels {feels_like}°C >= 32°C",
    ),
    WeatherRule(
        id="HEAT-LOW-01",
        domain="heat",
        description="Slightly elevated temperature",
        priority=50,
        certainty=0.50,
        conditions=[
            RuleCondition("temperature", "gte", 25),
            RuleCondition("temperature", "lt", 30),
        ],
        conclusions=[RuleConclusion("heat_risk", "LOW")],
        explanation="Temperature of {temperature}°C is mildly warm — minimal heat risk",
        explanation_short="Temp {temperature}°C in [25, 30)",
    ),
]

RISK_DELTA_RULES: list[WeatherRule] = [
    WeatherRule(
        id="RISK-TEMP-SPIKE-01",
        domain="heat",
        description="Temperature spike compared to yesterday — elevated heat concern",
        priority=75,
        certainty=0.75,
        conditions=[
            RuleCondition("temperature", "gte", 30),
            RuleCondition("temp_delta_24h", "gte", 8),
        ],
        conclusions=[RuleConclusion("heat_risk", "HIGH")],
        explanation="Temperature of {temperature}°C is {temp_delta_24h}°C hotter than yesterday — rapid heat buildup poses health risk",
        explanation_short="Temp {temperature}°C delta {temp_delta_24h}°C >= 8°C",
    ),
    WeatherRule(
        id="RISK-TEMP-SPIKE-02",
        domain="heat",
        description="Moderate temperature with notable day-over-day increase",
        priority=60,
        certainty=0.65,
        conditions=[
            RuleCondition("temperature", "gte", 25),
            RuleCondition("temp_delta_24h", "gte", 5),
        ],
        conclusions=[RuleConclusion("heat_risk", "MODERATE")],
        explanation="Temperature {temperature}°C is {temp_delta_24h}°C warmer than yesterday — monitor for heat stress",
        explanation_short="Temp {temperature}°C delta {temp_delta_24h}°C >= 5°C",
    ),
    WeatherRule(
        id="RISK-WIND-SURGE-01",
        domain="storm",
        description="Wind speed surge compared to yesterday — storm risk elevated",
        priority=75,
        certainty=0.75,
        conditions=[
            RuleCondition("wind_speed", "gte", 35),
            RuleCondition("wind_delta_24h", "gte", 20),
        ],
        conclusions=[RuleConclusion("storm_risk", "HIGH")],
        explanation="Wind speed {wind_speed}km/h jumped {wind_delta_24h}km/h from yesterday — sudden wind surge indicates storm front",
        explanation_short="Wind {wind_speed}km/h delta {wind_delta_24h}km/h >= 20km/h",
    ),
    WeatherRule(
        id="RISK-WIND-SURGE-02",
        domain="storm",
        description="Moderate wind increase from yesterday",
        priority=55,
        certainty=0.55,
        conditions=[
            RuleCondition("wind_speed", "gte", 20),
            RuleCondition("wind_delta_24h", "gte", 15),
        ],
        conclusions=[RuleConclusion("storm_risk", "MODERATE")],
        explanation="Wind speed {wind_speed}km/h increased {wind_delta_24h}km/h from yesterday — caution advised",
        explanation_short="Wind {wind_speed}km/h delta {wind_delta_24h}km/h >= 15km/h",
    ),
    WeatherRule(
        id="RISK-PRECIP-SPIKE-01",
        domain="flood",
        description="Precipitation spike compared to yesterday — flash flood risk",
        priority=75,
        certainty=0.75,
        conditions=[
            RuleCondition("precipitation", "gte", 20),
            RuleCondition("precip_delta_24h", "gte", 15),
        ],
        conclusions=[RuleConclusion("flood_risk", "HIGH")],
        explanation="Precipitation {precipitation}mm is {precip_delta_24h}mm more than yesterday — rapid accumulation raises flood risk",
        explanation_short="Precip {precipitation}mm delta {precip_delta_24h}mm >= 15mm",
    ),
    WeatherRule(
        id="RISK-PRECIP-SPIKE-02",
        domain="flood",
        description="Elevated precipitation compared to yesterday",
        priority=55,
        certainty=0.55,
        conditions=[
            RuleCondition("precipitation", "gte", 10),
            RuleCondition("precip_delta_24h", "gte", 8),
        ],
        conclusions=[RuleConclusion("flood_risk", "MODERATE")],
        explanation="Precipitation {precipitation}mm is {precip_delta_24h}mm above yesterday — monitor water levels",
        explanation_short="Precip {precipitation}mm delta {precip_delta_24h}mm >= 8mm",
    ),
    WeatherRule(
        id="RISK-HUMID-SUSTAIN-01",
        domain="flood",
        description="Sustained high humidity with day-over-day buildup",
        priority=50,
        certainty=0.55,
        conditions=[
            RuleCondition("humidity", "gte", 80),
            RuleCondition("humidity_delta_24h", "gte", 10),
        ],
        conclusions=[RuleConclusion("flood_risk", "LOW")],
        explanation="Humidity {humidity}% rose {humidity_delta_24h}% from yesterday — atmospheric saturation increasing",
        explanation_short="Humidity {humidity}% delta {humidity_delta_24h}% >= 10%",
    ),
]

FARM_RULES: list[WeatherRule] = [
    WeatherRule(
        id="FARM-PLANT-01",
        domain="farm",
        description="Optimal conditions for planting and harvesting",
        priority=80,
        certainty=0.80,
        conditions=[
            RuleCondition("temperature", "between", [15, 30]),
            RuleCondition("precipitation", "lt", 2),
            RuleCondition("wind_speed", "lt", 20),
        ],
        conclusions=[RuleConclusion("farm_planting", "OPTIMAL")],
        explanation="Temperature {temperature}°C (15-30°C ideal), precipitation {precipitation}mm (<2mm), wind {wind_speed}km/h (<20km/h) — optimal for planting",
        explanation_short="Temp {temperature}°C, precip {precipitation}mm, wind {wind_speed}km/h",
    ),
    WeatherRule(
        id="FARM-PLANT-02",
        domain="farm",
        description="Heat stress prevents planting",
        priority=75,
        certainty=0.75,
        conditions=[
            RuleCondition("temperature", "gt", 35),
        ],
        conclusions=[RuleConclusion("farm_planting", "DELAY")],
        explanation="Temperature of {temperature}°C exceeds 35°C — heat stress will affect germination, delay planting",
        explanation_short="Temp {temperature}°C > 35°C — delay planting",
    ),
    WeatherRule(
        id="FARM-PLANT-03",
        domain="farm",
        description="Wet soil prevents field work",
        priority=70,
        certainty=0.70,
        conditions=[
            RuleCondition("precipitation", "gt", 5),
        ],
        conclusions=[RuleConclusion("farm_field_work", "AVOID")],
        explanation="Precipitation of {precipitation}mm exceeds 5mm — soil too wet, risk of compaction, avoid field work",
        explanation_short="Precip {precipitation}mm > 5mm — avoid field work",
    ),
    WeatherRule(
        id="FARM-IRR-01",
        domain="farm",
        description="Low rainfall forecast requires irrigation",
        priority=75,
        certainty=0.75,
        conditions=[
            RuleCondition("precip_sum_3d", "lt", 5),
        ],
        conclusions=[RuleConclusion("farm_irrigation", "RECOMMENDED")],
        explanation="Only {precip_sum_3d}mm rain expected over next 3 days — irrigation recommended to prevent drought stress",
        explanation_short="3d precip {precip_sum_3d}mm < 5mm — irrigate",
    ),
    WeatherRule(
        id="FARM-IRR-02",
        domain="farm",
        description="Heavy rain expected — delay irrigation",
        priority=70,
        certainty=0.70,
        conditions=[
            RuleCondition("precip_sum_3d", "gt", 20),
        ],
        conclusions=[RuleConclusion("farm_irrigation", "DELAY")],
        explanation="{precip_sum_3d}mm rain expected over next 3 days — delay irrigation to avoid runoff and water waste",
        explanation_short="3d precip {precip_sum_3d}mm > 20mm — delay irrigation",
    ),
    WeatherRule(
        id="FARM-PEST-01",
        domain="farm",
        description="Warm and humid conditions favor fungal diseases",
        priority=65,
        certainty=0.65,
        conditions=[
            RuleCondition("temperature", "gt", 28),
            RuleCondition("precipitation", "gt", 3),
        ],
        conclusions=[RuleConclusion("farm_pest_fungal", "HIGH_RISK")],
        explanation="Temperature {temperature}°C > 28°C and precipitation {precipitation}mm > 3mm — warm & humid conditions favor fungal diseases",
        explanation_short="Temp {temperature}°C > 28°C & precip {precipitation}mm > 3mm",
    ),
    WeatherRule(
        id="FARM-PEST-02",
        domain="farm",
        description="Heat stress attracts pests",
        priority=60,
        certainty=0.60,
        conditions=[
            RuleCondition("temperature", "gt", 30),
        ],
        conclusions=[RuleConclusion("farm_pest_monitoring", "RECOMMENDED")],
        explanation="Temperature of {temperature}°C > 30°C — heat stress attracts aphids and mites, monitor for pest outbreaks",
        explanation_short="Temp {temperature}°C > 30°C — pest monitoring",
    ),
    WeatherRule(
        id="FARM-WIND-01",
        domain="farm",
        description="High winds require windbreaks",
        priority=80,
        certainty=0.80,
        conditions=[
            RuleCondition("max_wind_48h", "gt", 40),
        ],
        conclusions=[RuleConclusion("farm_wind_protection", "INSTALL")],
        explanation="Max wind {max_wind_48h}km/h > 40km/h over next 48h — install windbreaks or delay spraying",
        explanation_short="Max wind 48h {max_wind_48h}km/h > 40km/h",
    ),
    WeatherRule(
        id="FARM-WIND-02",
        domain="farm",
        description="Moderate winds create spray drift risk",
        priority=70,
        certainty=0.70,
        conditions=[
            RuleCondition("max_wind_48h", "gt", 25),
            RuleCondition("max_wind_48h", "lte", 40),
        ],
        conclusions=[RuleConclusion("farm_spraying", "AVOID")],
        explanation="Max wind {max_wind_48h}km/h in 25-40km/h range — avoid pesticide spraying due to drift risk",
        explanation_short="Max wind 48h {max_wind_48h}km/h in (25, 40]",
    ),
    WeatherRule(
        id="FARM-HARV-01",
        domain="farm",
        description="Good harvest window with minimal rain",
        priority=75,
        certainty=0.75,
        conditions=[
            RuleCondition("rain_days_5d", "lte", 1),
        ],
        conclusions=[RuleConclusion("farm_harvest", "GOOD_WINDOW")],
        explanation="Only {rain_days_5d} day(s) with significant rain in next 5 days — good harvest window opening",
        explanation_short="Rain days 5d <= {rain_days_5d}",
    ),
]

SOLAR_RULES: list[WeatherRule] = [
    WeatherRule(
        id="SOLAR-GEN-01",
        domain="solar",
        description="Excellent solar generation conditions",
        priority=85,
        certainty=0.85,
        conditions=[
            RuleCondition("uv_index", "gt", 5),
            RuleCondition("sunny_hours_today", "gte", 6),
        ],
        conclusions=[RuleConclusion("solar_generation", "EXCELLENT")],
        explanation="UV index {uv_index} > 5 with {sunny_hours_today} sunny hours — excellent solar generation, run full capacity",
        explanation_short="UV {uv_index} > 5 & sunny {sunny_hours_today}h",
    ),
    WeatherRule(
        id="SOLAR-GEN-02",
        domain="solar",
        description="Good solar generation conditions",
        priority=75,
        certainty=0.75,
        conditions=[
            RuleCondition("uv_index", "gt", 3),
            RuleCondition("sunny_hours_today", "gte", 4),
        ],
        conclusions=[RuleConclusion("solar_generation", "GOOD")],
        explanation="UV index {uv_index} > 3 with {sunny_hours_today} sunny hours — good solar conditions, standard generation expected",
        explanation_short="UV {uv_index} > 3 & sunny {sunny_hours_today}h",
    ),
    WeatherRule(
        id="SOLAR-GEN-03",
        domain="solar",
        description="Low solar generation due to cloud cover",
        priority=70,
        certainty=0.70,
        conditions=[
            RuleCondition("sunny_hours_today", "lt", 3),
        ],
        conclusions=[RuleConclusion("solar_generation", "LOW")],
        explanation="Only {sunny_hours_today} sunny hours expected today — low generation, consider grid backup",
        explanation_short="Sunny hours {sunny_hours_today} < 3",
    ),
    WeatherRule(
        id="SOLAR-GEN-04",
        domain="solar",
        description="Minimal solar input expected",
        priority=65,
        certainty=0.65,
        conditions=[
            RuleCondition("uv_index", "lt", 2),
        ],
        conclusions=[RuleConclusion("solar_generation", "MINIMAL")],
        explanation="UV index {uv_index} < 2 — minimal solar input, schedule maintenance during low production",
        explanation_short="UV {uv_index} < 2",
    ),
    WeatherRule(
        id="SOLAR-CLEAN-01",
        domain="solar",
        description="No rain expected — good cleaning window",
        priority=70,
        certainty=0.70,
        conditions=[
            RuleCondition("rain_days_3d", "eq", 0),
        ],
        conclusions=[RuleConclusion("solar_cleaning", "RECOMMENDED")],
        explanation="No rain expected in next 3 days — good time for panel cleaning to maximize efficiency",
        explanation_short="No rain 3d — clean panels",
    ),
    WeatherRule(
        id="SOLAR-CLEAN-02",
        domain="solar",
        description="Rain will naturally clean panels",
        priority=65,
        certainty=0.65,
        conditions=[
            RuleCondition("rain_days_3d", "gt", 0),
        ],
        conclusions=[RuleConclusion("solar_cleaning", "POSTPONE")],
        explanation="Rain expected in next 3 days — postpone manual cleaning, rain will naturally clean panels",
        explanation_short="Rain expected 3d — postpone cleaning",
    ),
    WeatherRule(
        id="SOLAR-BATT-01",
        domain="solar",
        description="Limited sun requires battery management",
        priority=75,
        certainty=0.75,
        conditions=[
            RuleCondition("sunny_hours_48h", "lt", 10),
        ],
        conclusions=[RuleConclusion("solar_battery", "CHARGE")],
        explanation="Only {sunny_hours_48h} sunny hours expected in 48h — ensure batteries are fully charged for overnight",
        explanation_short="Sunny 48h {sunny_hours_48h} < 10 — charge batteries",
    ),
    WeatherRule(
        id="SOLAR-BATT-02",
        domain="solar",
        description="Low UV requires load reduction",
        priority=65,
        certainty=0.65,
        conditions=[
            RuleCondition("uv_index", "lt", 3),
        ],
        conclusions=[RuleConclusion("solar_load", "REDUCE")],
        explanation="UV index {uv_index} < 3 — reduce non-essential load to conserve battery for critical systems",
        explanation_short="UV {uv_index} < 3 — reduce load",
    ),
    WeatherRule(
        id="SOLAR-EFF-01",
        domain="solar",
        description="Heat reduces panel efficiency",
        priority=70,
        certainty=0.70,
        conditions=[
            RuleCondition("max_temp_3d", "gt", 35),
        ],
        conclusions=[RuleConclusion("solar_efficiency", "HEAT_REDUCED")],
        explanation="Max temperature {max_temp_3d}°C > 35°C — heat reduces panel efficiency, ensure adequate ventilation",
        explanation_short="Max temp 3d {max_temp_3d}°C > 35°C",
    ),
    WeatherRule(
        id="SOLAR-EFF-02",
        domain="solar",
        description="Cold improves panel efficiency",
        priority=65,
        certainty=0.65,
        conditions=[
            RuleCondition("max_temp_3d", "lt", 10),
        ],
        conclusions=[RuleConclusion("solar_efficiency", "COLD_IMPROVED")],
        explanation="Max temperature {max_temp_3d}°C < 10°C — cold temperatures improve panel efficiency, expect higher output",
        explanation_short="Max temp 3d {max_temp_3d}°C < 10°C",
    ),
]

FORECAST_VALIDATION_RULES: list[WeatherRule] = [
    WeatherRule(
        id="FORECAST-CONF-LOW-01",
        domain="forecast",
        description="Forecast confidence is low — cross-reference with historical data",
        priority=60,
        certainty=0.70,
        conditions=[
            RuleCondition("forecast_overall_confidence", "eq", "LOW"),
        ],
        conclusions=[RuleConclusion("forecast_confidence", "LOW")],
        explanation="Forecast validation shows significant deviation from historical data at same hours. Predictions may be unreliable.",
        explanation_short="Forecast deviates significantly from historical pattern",
    ),
    WeatherRule(
        id="FORECAST-CONF-MED-01",
        domain="forecast",
        description="Forecast confidence is medium — some deviation from historical pattern",
        priority=50,
        certainty=0.60,
        conditions=[
            RuleCondition("forecast_overall_confidence", "eq", "MEDIUM"),
        ],
        conclusions=[RuleConclusion("forecast_confidence", "MEDIUM")],
        explanation="Forecast validation shows moderate deviation from historical data at same hours.",
        explanation_short="Forecast partially deviates from historical pattern",
    ),
    WeatherRule(
        id="FORECAST-CONF-HIGH-01",
        domain="forecast",
        description="Forecast confidence is high — closely matches historical pattern",
        priority=40,
        certainty=0.80,
        conditions=[
            RuleCondition("forecast_overall_confidence", "eq", "HIGH"),
        ],
        conclusions=[RuleConclusion("forecast_confidence", "HIGH")],
        explanation="Forecast closely matches historical data at same hours. High prediction reliability.",
        explanation_short="Forecast aligns with historical pattern",
    ),
]

ALL_RULES: list[WeatherRule] = (
    FLOOD_RULES + STORM_RULES + HEAT_RULES + RISK_DELTA_RULES + FARM_RULES + SOLAR_RULES + FORECAST_VALIDATION_RULES
)

DOMAINS: dict[str, str] = {
    "flood": "Coastal Flood & Precipitation",
    "storm": "Wind & Storm",
    "heat": "Temperature & Heatwave",
    "farm": "Agriculture & Farming",
    "solar": "Solar Energy",
    "forecast": "Forecast Validation",
}

SEVERITY_ORDER: dict[str, int] = {
    "LOW": 0,
    "MODERATE": 1,
    "HIGH": 2,
    "EXTREME": 3,
    "NONE": -1,
}
