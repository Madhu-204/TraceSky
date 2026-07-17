import type { ExpertRisk, ExpertRecommendation, SensorFact, InferenceMetrics, DataSourceInfo, DomainRuleTrace, ForecastValidation } from './expert.types';

export interface DeltaFact {
  name: string;
  value: number | string;
  certainty: number;
  source: string;
}

export interface HistoricalComparisonMetric {
  current: number;
  historical: number | null;
  change_pct: number | null;
  trend: string;
  current_high?: number;
  current_low?: number;
  historical_high?: number | null;
  historical_low?: number | null;
}

export interface HistoricalComparisonData {
  period: {
    current: { label: string };
    comparison: { label: string };
  };
  metrics: {
    temperature: HistoricalComparisonMetric;
    precipitation: HistoricalComparisonMetric;
    wind_speed: HistoricalComparisonMetric;
  };
  summary: string;
}

export interface CurrentTelemetry {
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
  precipitation?: number;
  uv_index?: number;
  feels_like?: number;
  condition?: string;
}

export interface RiskMonitorReport {
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
  historical_comparison: HistoricalComparisonData;
  delta_facts: Record<string, DeltaFact>;
  current_telemetry: CurrentTelemetry;
  forecast_data: {
    hourly_count: number;
    daily_count: number;
  };
}
