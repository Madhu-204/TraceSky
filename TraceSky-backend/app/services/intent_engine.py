import re
from typing import Optional

INTENTS = {
    "flood": {
        "keywords": ["flood", "flooding", "flooded", "submerged", "drowning", "overflow"],
        "phrases": [
            "flood risk", "water level", "heavy rain", "is it going to flood",
            "will it flood", "flood warning", "rain danger", "flash flood",
            "how much rain", "is there flooding",
        ],
        "weight": 1.0,
    },
    "storm": {
        "keywords": ["storm", "wind", "gust", "tornado", "cyclone", "hurricane", "breeze", "blowing"],
        "phrases": [
            "storm warning", "wind speed", "how windy", "is it stormy",
            "strong wind", "wind alert", "gust risk", "severe storm",
            "storm coming", "should I worry about wind",
        ],
        "weight": 1.0,
    },
    "heat": {
        "keywords": ["heat", "hot", "warm", "heatwave", "temperature", "warmth", "sunny"],
        "phrases": [
            "heat index", "heat warning", "high temperature", "feels like",
            "extreme heat", "how hot", "is it hot", "temperature today",
            "will it be hot", "heat wave", "stay cool",
        ],
        "weight": 1.0,
    },
    "forecast": {
        "keywords": ["forecast", "prediction", "upcoming", "outlook", "expected", "later", "tomorrow"],
        "phrases": [
            "next days", "daily forecast", "hourly forecast", "weather forecast",
            "7 day", "week ahead", "what is the weather", "how is the weather",
            "weather today", "today weather", "weather now", "current weather",
            "what will the weather be", "weather this week",
        ],
        "weight": 0.8,
    },
    "farm": {
        "keywords": ["farm", "crop", "plant", "harvest", "irrigation", "agriculture", "soil",
                     "field", "grow", "garden", "seeds", "farming"],
        "phrases": [
            "best time to farm", "planting conditions", "crop health",
            "farm suggestion", "farming advice", "should I plant",
            "is it good for farming", "can I harvest", "watering",
        ],
        "weight": 1.0,
    },
    "solar": {
        "keywords": ["solar", "panel", "sun", "uv", "photovoltaic", "energy",
                     "power", "electricity", "renewable"],
        "phrases": [
            "solar efficiency", "solar generation", "panel cleaning",
            "solar energy", "battery charge", "how much sun",
            "is it sunny enough", "will my panels work",
        ],
        "weight": 1.0,
    },
    "general": {
        "keywords": ["weather", "condition", "outside"],
        "phrases": [
            "how is it outside", "tell me about the weather",
            "weather report", "weather conditions",
        ],
        "weight": 0.5,
    },
    "trend": {
        "keywords": ["trend", "pattern", "changing", "getting"],
        "phrases": [
            "how is it changing", "what is the trend", "weather pattern",
            "is it getting warmer", "is it getting colder",
        ],
        "weight": 0.7,
    },
}

AFFIRMATIVE_PATTERNS = [
    re.compile(r"^(yes|yeah|sure|ok|okay|go ahead|tell me|please|would love to)", re.IGNORECASE),
    re.compile(r"(yes please|tell me more|show me|more details|let's see|i'd like|i want)", re.IGNORECASE),
    re.compile(r"(deep dive|dive deeper|go deeper|break it down|elaborate|explain more)", re.IGNORECASE),
    re.compile(r"^(what|which|how)\s+(about|does|is|are|about)", re.IGNORECASE),
]

NEGATIVE_PATTERNS = [
    re.compile(r"^(no|nope|nah|not now|maybe later|never mind|skip|pass|not interested)", re.IGNORECASE),
]

TIME_PATTERNS = {
    "next_3_days": re.compile(r"(next\s+(3|few|three)\s*days?|coming\s+days?|in\s+3\s*days?)", re.IGNORECASE),
    "next_7_days": re.compile(r"(next\s+(7|week|seven)\s*days?|coming\s+week|7\s*day|this\s+week)", re.IGNORECASE),
    "last_week": re.compile(r"(last\s+week|previous\s+week|past\s+week)", re.IGNORECASE),
    "last_year": re.compile(r"(last\s+year|previous\s+year|past\s+year)", re.IGNORECASE),
    "today": re.compile(r"\btoday\b", re.IGNORECASE),
    "tomorrow": re.compile(r"\btomorrow\b", re.IGNORECASE),
    "48_hours": re.compile(r"(48\s*hours?|next\s+(two|2)\s*days?)", re.IGNORECASE),
}

NUMERIC_PATTERN = re.compile(r"(\d+\.?\d*)\s*(°[CF]|km/h|%|mm|°C|°F|degrees?)", re.IGNORECASE)

DAY_NAMES = {
    "monday": "MON", "tuesday": "TUE", "wednesday": "WED", "thursday": "THU",
    "friday": "FRI", "saturday": "SAT", "sunday": "SUN",
    "mon": "MON", "tue": "TUE", "wed": "WED", "thu": "THU", "fri": "FRI", "sat": "SAT", "sun": "SUN",
}


class IntentResult:
    def __init__(self, primary: str, scores: dict[str, float], entities: dict):
        self.primary = primary
        self.scores = scores
        self.entities = entities

    def has_intent(self, intent: str) -> bool:
        return intent in self.scores and self.scores[intent] > 0

    def top_intents(self, threshold: float = 0.3) -> list[str]:
        return [k for k, v in sorted(self.scores.items(), key=lambda x: -x[1]) if v >= threshold]

    def is_conversational_starter(self) -> bool:
        return not self.scores or max(self.scores.values(), default=0) < 0.3


class IntentEngine:

    def extract(self, message: str) -> IntentResult:
        message_lower = message.lower().strip()

        if GREETINGS.match(message_lower):
            return IntentResult(
                primary="general",
                scores={"general": 0.1},
                entities={},
            )

        for pat in NEGATIVE_PATTERNS:
            if pat.match(message_lower):
                return IntentResult(
                    primary="general",
                    scores={"general": 0.2},
                    entities={},
                )

        scores: dict[str, float] = {}
        entities: dict = {}

        for intent_name, config in INTENTS.items():
            score = 0.0
            for phrase in config["phrases"]:
                if phrase in message_lower:
                    score += 0.6 * config["weight"]
            for keyword in config["keywords"]:
                if keyword in message_lower:
                    score += 0.3 * config["weight"]
            words = set(message_lower.split())
            word_overlap = len(words & set(config["keywords"]))
            if word_overlap >= 2:
                score += 0.15 * config["weight"]
            if score > 0:
                scores[intent_name] = round(min(score, 1.0), 2)

        for entity_name, pattern in TIME_PATTERNS.items():
            match = pattern.search(message_lower)
            if match:
                entities["time_range"] = entity_name
                break

        numeric_matches = NUMERIC_PATTERN.findall(message)
        if numeric_matches:
            entities["numeric"] = [
                {"value": float(m[0]), "unit": m[1]} for m in numeric_matches
            ]

        for day_name, day_code in DAY_NAMES.items():
            if day_name in message_lower:
                entities["day"] = day_code
                break

        primary = "general"
        if scores:
            primary = max(scores, key=scores.get)

        if "general" not in scores:
            has_weather_words = any(
                w in message_lower
                for w in ["weather", "rain", "rainy", "cloud", "cloudy", "sun", "sunny",
                          "wind", "windy", "storm", "hot", "cold", "warm", "cool",
                          "forecast", "today", "outside", "temperature"]
            )
            if has_weather_words:
                scores["general"] = 0.3

        if not scores or (primary == "general" and scores.get("general", 0) < 0.3):
            scores["general"] = 0.2

        return IntentResult(primary=primary, scores=scores, entities=entities)

    def is_affirmative(self, message: str) -> bool:
        message_lower = message.lower().strip()
        return any(pat.match(message_lower) for pat in AFFIRMATIVE_PATTERNS)

    def extract_day(self, message: str) -> Optional[str]:
        message_lower = message.lower().strip()
        for day_name, day_code in DAY_NAMES.items():
            if day_name in message_lower:
                return day_code
        for pat_name, pat in TIME_PATTERNS.items():
            if pat.search(message_lower):
                return pat_name
        return None


GREETINGS = re.compile(
    r"^(hi|hello|hey|good morning|good afternoon|good evening|what's up|yo|howdy|thanks|thank you)",
    re.IGNORECASE
)