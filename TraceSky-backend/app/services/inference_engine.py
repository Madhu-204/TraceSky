import time
from dataclasses import dataclass, field
from typing import Any, Literal, Optional

from app.services.knowledge_base import (
    WeatherRule, RuleCondition, RuleConclusion,
    ALL_RULES, SEVERITY_ORDER,
)


@dataclass
class Fact:
    name: str
    value: Any
    certainty: float
    source: Literal["sensor", "derived", "inferred"]
    fired_rule_id: Optional[str] = None


@dataclass
class ConditionEvaluation:
    fact: str
    operator: str
    expected_value: Any
    actual_value: Any
    matched: bool
    weight: float = 1.0


@dataclass
class RuleTrace:
    rule_id: str
    rule_description: str
    domain: str
    priority: int
    certainty: float
    matched: bool
    conditions_evaluated: list[ConditionEvaluation]
    conclusion: Optional[str] = None
    conclusion_value: Optional[Any] = None
    propagated_certainty: float = 0.0


class WorkingMemory:
    def __init__(self):
        self._facts: dict[str, list[Fact]] = {}

    def add_fact(self, fact: Fact) -> None:
        if fact.name not in self._facts:
            self._facts[fact.name] = []
        self._facts[fact.name].append(fact)

    def add_facts(self, facts: list[Fact]) -> None:
        for f in facts:
            self.add_fact(f)

    def get_fact(self, name: str) -> Optional[Fact]:
        facts = self._facts.get(name, [])
        return max(facts, key=lambda f: f.certainty) if facts else None

    def get_all_facts(self, name: str) -> list[Fact]:
        return self._facts.get(name, [])

    def get_all_fact_names(self) -> list[str]:
        return list(self._facts.keys())

    def has_value(self, name: str) -> bool:
        return self.get_fact(name) is not None

    def evaluate_condition(self, cond: RuleCondition) -> tuple[bool, Any, float]:
        fact = self.get_fact(cond.fact)
        if fact is None:
            return (False, None, 0.0)
        matched = _compare(fact.value, cond.op, cond.value)
        condition_cf = fact.certainty * cond.weight
        return (matched, fact.value, condition_cf)

    def _format_value(self, val: Any, op: str) -> str:
        if op == "between" and isinstance(val, list):
            return f"[{val[0]}, {val[1]}]"
        return str(val)


def _compare(value: Any, op: str, target: Any) -> bool:
    try:
        if op == "eq":
            return value == target
        elif op == "neq":
            return value != target
        elif op == "gt":
            return value is not None and value > target
        elif op == "gte":
            return value is not None and value >= target
        elif op == "lt":
            return value is not None and value < target
        elif op == "lte":
            return value is not None and value <= target
        elif op == "between":
            if isinstance(target, (list, tuple)) and len(target) == 2:
                return value is not None and target[0] <= value <= target[1]
            return False
        elif op == "in":
            return value in (target if isinstance(target, (list, tuple)) else [target])
        return False
    except (TypeError, ValueError):
        return False


@dataclass
class InferenceResult:
    derived_facts: dict[str, list[Fact]] = field(default_factory=dict)
    fired_rules: list[RuleTrace] = field(default_factory=list)
    evaluated_rules: list[RuleTrace] = field(default_factory=list)
    execution_time_ms: float = 0.0
    facts_loaded: int = 0
    total_rules_evaluated: int = 0
    total_rules_fired: int = 0


class InferenceEngine:
    MAX_ITERATIONS = 10

    def __init__(self, rules: Optional[list[WeatherRule]] = None):
        self.rules = rules or ALL_RULES
        self._sorted = sorted(self.rules, key=lambda r: r.priority, reverse=True)

    def forward_chain(self, sensor_facts: list[Fact]) -> InferenceResult:
        start = time.perf_counter()
        wm = WorkingMemory()
        wm.add_facts(sensor_facts)

        result = InferenceResult(facts_loaded=len(sensor_facts))
        iteration = 0

        while iteration < self.MAX_ITERATIONS:
            iteration += 1
            new_facts_added = False

            for rule in self._sorted:
                rule_id = rule.id

                already_fired = any(
                    t.rule_id == rule_id and t.matched for t in result.fired_rules
                )
                if already_fired:
                    continue

                already_evaluated = any(
                    t.rule_id == rule_id for t in result.evaluated_rules
                )
                if already_evaluated:
                    continue

                evaluations: list[ConditionEvaluation] = []
                all_met = True
                min_cf = 1.0

                for cond in rule.conditions:
                    matched, actual, condition_cf = wm.evaluate_condition(cond)

                    expected_display = (
                        f"[{cond.value[0]}, {cond.value[1]}]"
                        if cond.op == "between" and isinstance(cond.value, list)
                        else str(cond.value)
                    )

                    evaluation = ConditionEvaluation(
                        fact=cond.fact,
                        operator=cond.op,
                        expected_value=expected_display,
                        actual_value=actual,
                        matched=matched,
                        weight=cond.weight,
                    )
                    evaluations.append(evaluation)

                    if not matched:
                        all_met = False
                    else:
                        min_cf = min(min_cf, condition_cf)

                trace = RuleTrace(
                    rule_id=rule.id,
                    rule_description=rule.description,
                    domain=rule.domain,
                    priority=rule.priority,
                    certainty=rule.certainty,
                    matched=all_met,
                    conditions_evaluated=evaluations,
                )

                if all_met:
                    propagated_cf = rule.certainty * min_cf
                    trace.propagated_certainty = propagated_cf

                    for conclusion in rule.conclusions:
                        trace.conclusion = conclusion.fact
                        trace.conclusion_value = conclusion.value

                        inferred = Fact(
                            name=conclusion.fact,
                            value=conclusion.value,
                            certainty=propagated_cf,
                            source="inferred",
                            fired_rule_id=rule.id,
                        )
                        wm.add_fact(inferred)
                        new_facts_added = True

                    result.fired_rules.append(trace)

                result.evaluated_rules.append(trace)

            if not new_facts_added:
                break

        for name in wm.get_all_fact_names():
            facts = wm.get_all_facts(name)
            inferred = [f for f in facts if f.source == "inferred"]
            if inferred:
                result.derived_facts[name] = inferred

        end = time.perf_counter()
        result.execution_time_ms = round((end - start) * 1000, 2)
        result.total_rules_evaluated = len(result.evaluated_rules)
        result.total_rules_fired = len(result.fired_rules)

        return result

    def get_highest_risk(self, result: InferenceResult, domain: str) -> Optional[dict]:
        domain_upper = domain.upper()
        risk_facts = result.derived_facts.get(f"{domain}_risk", [])
        if not risk_facts:
            risk_facts = result.derived_facts.get(f"{domain}_risk", [])

        key = f"{domain}_risk"
        risk_facts = result.derived_facts.get(key, [])

        if not risk_facts:
            fact = None
            for name, facts in result.derived_facts.items():
                if name.startswith(f"{domain}_"):
                    fact = facts[0]
                    break
            if not fact:
                return None

            return {
                "id": domain,
                "name": f"{domain.capitalize()} Risk",
                "percentage": round(fact.certainty * 100),
                "severity": str(fact.value).capitalize(),
                "certainty": round(fact.certainty, 2),
                "conclusion": fact.name,
            }

        best = max(risk_facts, key=lambda f: SEVERITY_ORDER.get(str(f.value), -1))

        return {
            "id": domain,
            "name": f"{domain.capitalize()} Risk",
            "percentage": round(best.certainty * 100),
            "severity": str(best.value).capitalize(),
            "certainty": round(best.certainty, 2),
            "conclusion": best.name,
        }

    def get_domain_rules(self, domain: str) -> list[WeatherRule]:
        return [r for r in self.rules if r.domain == domain]
