export interface SensorFact {
  name: string;
  value: number | string;
  certainty: number;
  source: 'sensor' | 'derived' | 'inferred';
  fired_rule_id?: string;
}

export interface ConditionEvaluation {
  fact: string;
  operator: string;
  expected: string | number;
  actual: string | number | null;
  matched: boolean;
  weight?: number;
}

export interface RuleTraceData {
  rule_id: string;
  rule_description: string;
  certainty: number;
  conditions: ConditionEvaluation[];
  conclusion?: string;
  conclusion_value?: string | number;
}

export interface ExplanationChain {
  conclusion: string;
  certainty: number;
  chain: RuleTraceData[];
}

export interface ExpertRisk {
  id: string;
  name: string;
  percentage: number;
  severity: string;
  certainty: number;
  color: string;
  detail: string;
  explanation: ExplanationChain;
}

export interface ExpertRecommendation {
  text: string;
  triggered_by: string;
  certainty: number;
}

export interface InferenceMetrics {
  total_rules_evaluated: number;
  total_rules_fired: number;
  execution_time_ms: number;
  facts_loaded: number;
  overall_certainty: number;
}

export interface DataSourceInfo {
  provider: string;
  endpoint: string;
  fetched_at: string;
}

export interface ExpertAnalysis {
  timestamp: string;
  data_source: DataSourceInfo;
  sensor_facts: SensorFact[];
  derived_facts: SensorFact[];
  risks: ExpertRisk[];
  recommendations: ExpertRecommendation[];
  farm_suggestions: string[];
  solar_suggestions: string[];
  inference_metrics: InferenceMetrics;
  evaluated_by_domain: Record<string, DomainRuleTrace[]>;
  forecast_validation?: ForecastValidation;
}

export interface DomainRuleTrace {
  rule_id: string;
  description: string;
  certainty: number;
  matched: boolean;
  propagated_certainty: number;
  conditions: ConditionEvaluation[];
  conclusion: string | null;
  conclusion_value: string | number | null;
}

export interface ValidatedHour {
  hour: string;
  forecast_temp: number;
  historical_temp: number;
  temp_deviation: number;
  humidity_deviation: number;
  wind_deviation: number;
  forecast_rate?: number | null;
  historical_rate?: number | null;
  rate_deviation?: number | null;
  confidence: number;
  status: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface BaselineAnchor {
  current_temperature: number | null;
  nearest_forecast_hour: string | null;
  anchor_confidence: 'HIGH' | 'MEDIUM' | 'LOW' | null;
}

export interface ForecastValidation {
  validated_hours: ValidatedHour[];
  average_temp_deviation: number | null;
  average_confidence: number;
  hours_validated: number;
  overall_status: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  baseline_anchor?: BaselineAnchor | null;
}
