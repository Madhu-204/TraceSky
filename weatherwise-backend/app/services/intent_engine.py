import re
from typing import Optional

# ─────────────────────────── Intent definitions ───────────────────────────

INTENTS = {
    "flood": {
        "keywords": ["flood", "flooding", "flooded", "submerged"],
        "phrases": ["flood risk", "water level", "precipitation risk", "flood warning", "heavy rain", "overflow"],
        "weight": 1.0,
    },
    "storm": {
        "keywords": ["storm", "wind", "gust", "tornado", "cyclone", "hurricane"],
        "phrases": ["storm warning", "wind speed", "wind alert", "gust risk", "severe storm", "storm surge"],
        "weight": 1.0,
    },
    "heat": {
        "keywords": ["heat", "hot", "warm", "heatwave", "temperature"],
        "phrases": ["heat index", "heat warning", "high temperature", "feels like", "extreme heat"],
        "weight": 1.0,
    },
    "forecast": {
        "keywords": ["forecast", "prediction", "upcoming", "outlook", "expected"],
        "phrases": ["next days", "daily forecast", "hourly forecast", "weather forecast", "7 day", "week ahead"],
        "weight": 0.8,
    },
    "historical": {
        "keywords": ["historical", "compare", "previous", "past", "vs", "versus", "last year", "last week", "yesterday"],
        "phrases": ["compared to", "how does", "how did", "difference from", "year over year", "same week"],
        "weight": 0.9,
    },
    "farm": {
        "keywords": ["farm", "crop", "plant", "harvest", "irrigation", "agriculture", "soil"],
        "phrases": ["best time to farm", "planting conditions", "crop health", "farm suggestion", "farming advice"],
        "weight": 1.0,
    },
    "solar": {
        "keywords": ["solar", "panel", "sun", "uv", "photovoltaic", "energy"],
        "phrases": ["solar efficiency", "solar generation", "panel cleaning", "solar energy", "battery charge"],
        "weight": 1.0,
    },
    "general": {
        "keywords": ["weather", "current", "condition", "today", "now", "outside"],
        "phrases": ["what is the weather", "how is the weather", "current weather", "today weather", "weather now"],
        "weight": 0.5,
    },
}

# Entity extraction patterns
TIME_PATTERNS = {
    "next_3_days": re.compile(r"(next\s+3\s+days?|next\s+few\s+days?|coming\s+days?)", re.IGNORECASE),
    "next_7_days": re.compile(r"(next\s+7\s+days?|next\s+week|coming\s+week|7\s*day)", re.IGNORECASE),
    "last_week": re.compile(r"(last\s+week|previous\s+week|past\s+week)", re.IGNORECASE),
    "last_year": re.compile(r"(last\s+year|previous\s+year|past\s+year)", re.IGNORECASE),
    "today": re.compile(r"\btoday\b", re.IGNORECASE),
    "tomorrow": re.compile(r"\btomorrow\b", re.IGNORECASE),
    "this_week": re.compile(r"(this\s+week|current\s+week)", re.IGNORECASE),
    "48_hours": re.compile(r"(48\s*hours?|next\s+two\s+days?|next\s+2\s+days?)", re.IGNORECASE),
}

NUMERIC_PATTERN = re.compile(r"(\d+\.?\d*)\s*(°[CF]|km/h|%|mm|°C|°F)", re.IGNORECASE)


class IntentResult:
    def __init__(self, primary: str, scores: dict[str, float], entities: dict):
        self.primary = primary
        self.scores = scores
        self.entities = entities

    def has_intent(self, intent: str) -> bool:
        return intent in self.scores and self.scores[intent] > 0

    def top_intents(self, threshold: float = 0.3) -> list[str]:
        return [k for k, v in sorted(self.scores.items(), key=lambda x: -x[1]) if v >= threshold]


class IntentEngine:

    def extract(self, message: str) -> IntentResult:
        message_lower = message.lower().strip()

        scores: dict[str, float] = {}
        entities: dict = {}

        # 1. Score each intent
        for intent_name, config in INTENTS.items():
            score = 0.0

            # Phrase matching (higher weight)
            for phrase in config["phrases"]:
                if phrase in message_lower:
                    score += 0.6 * config["weight"]

            # Keyword matching
            for keyword in config["keywords"]:
                if keyword in message_lower:
                    score += 0.3 * config["weight"]

            # Exact matches get a bonus
            words = message_lower.split()
            for keyword in config["keywords"]:
                if keyword in words:
                    score += 0.1 * config["weight"]

            if score > 0:
                scores[intent_name] = round(min(score, 1.0), 2)

        # 2. Entity extraction — time ranges
        for entity_name, pattern in TIME_PATTERNS.items():
            match = pattern.search(message_lower)
            if match:
                entities["time_range"] = entity_name
                break

        # 3. Entity extraction — numeric values
        numeric_matches = NUMERIC_PATTERN.findall(message)
        if numeric_matches:
            entities["numeric"] = [
                {"value": float(m[0]), "unit": m[1]} for m in numeric_matches
            ]

        # 4. Determine primary intent
        primary = "general"
        if scores:
            primary = max(scores, key=scores.get)

        # If general is the only match with low score, still use general
        if not scores or (primary == "general" and scores.get("general", 0) < 0.2):
            scores["general"] = 0.5

        return IntentResult(primary=primary, scores=scores, entities=entities)
