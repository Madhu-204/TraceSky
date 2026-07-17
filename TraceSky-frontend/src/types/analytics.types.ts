export interface AccuracyPoint {
  label: string;
  predicted: number;
  actual: number;
}

export interface ConditionEvaluation {
  fact: string;
  operator: string;
  expected: string;
  actual: string;
  matched: boolean;
}

export interface ExplanationChainLink {
  rule_id: string;
  rule_description: string;
  certainty: number;
  conditions: ConditionEvaluation[];
  conclusion?: string;
  conclusion_value?: string | number;
}

export interface AccuracyByVariable {
  variable: string;
  accuracy: number;
  confidence: number;
  mean_deviation: number;
  trend: string;
  samples: number;
  reasoning: string;
  explanation_chain: ExplanationChainLink[];
}

export interface ForecastAccuracyData {
  overall_accuracy: number;
  overall_confidence: number;
  overall_status: string;
  by_variable: AccuracyByVariable[];
  validated_hours_count: number;
  reasoning: string;
}

export interface IntensityDay {
  day: string;
  day_index: number;
  week_index: number;
  intensity: 'none' | 'low' | 'medium' | 'high' | 'extreme';
  primary_factor: string;
  primary_value: number;
  temperature: number;
  precipitation: number;
  wind_speed: number;
  reasoning: string;
  explanation_chain: ExplanationChainLink[];
}

export interface IntensityWeek {
  label: string;
  week_index: number;
  days: IntensityDay[];
}

export interface ClimaticIntensityData {
  weeks: IntensityWeek[];
  overall_assessment: string;
  certainty: number;
}

export interface AnomalyEventData {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  certainty: number;
  triggered_by: string;
  explanation: {
    conclusion: string;
    certainty: number;
    chain: ExplanationChainLink[];
  };
}

export interface BenchmarkRowData {
  variable: string;
  unit: string;
  source_model_value: number;
  wise_model_value: number;
  actual_observed: number;
  source_error: number;
  wise_error: number;
  improvement_pct: number;
  status: 'optimal' | 'divergent';
  reasoning: string;
  certainty: number;
  explanation_chain: ExplanationChainLink[];
}

export interface PerformanceBenchmarkData {
  rows: BenchmarkRowData[];
  overall_assessment: string;
  certainty: number;
}

export interface InferenceMetrics {
  total_rules_evaluated: number;
  total_rules_fired: number;
  execution_time_ms: number;
  facts_loaded: number;
  overall_certainty: number;
}

export interface AnalyticsReport {
  forecast_accuracy: ForecastAccuracyData;
  climatic_intensity: ClimaticIntensityData;
  anomaly_events: AnomalyEventData[];
  performance_benchmark: PerformanceBenchmarkData;
  summary: string;
  inference_metrics: InferenceMetrics;
}
