export interface ChartDataPoint {
  label: string;
  value: number;
  isCurrent?: boolean;
}

export interface MetricItem {
  label: string;
  value: string;
  color: string;
}

export interface GraphConfig {
  type: 'risk_gauge' | 'comparison_bars' | 'forecast_line' | 'suggestion_list';
  title: string;
  value?: number;
  severity?: string;
  threshold?: number;
  labels?: string[];
  highs?: number[];
  lows?: number[];
  precip?: number[];
  datasets?: {
    label: string;
    current: number;
    historical: number;
    change_pct: number;
  }[];
  items?: string[];
  icon?: string;
}

export interface ExpertTraceCondition {
  fact: string;
  actual: unknown;
  expected: string;
  operator: string;
  matched: boolean;
}

export interface ExpertTraceRule {
  rule_id: string;
  description: string;
  certainty: number;
  conditions: ExpertTraceCondition[];
}

export interface ExpertTrace {
  fired_rules: ExpertTraceRule[];
  rules_evaluated: number;
  rules_fired: number;
  execution_time_ms: number;
  overall_certainty: number;
}

export interface AssistantMessage {
  id: string;
  sender: 'assistant' | 'user';
  timestamp: string;
  text: string;
  graph?: GraphConfig;
  metrics?: Record<string, MetricItem>;
  expert_trace?: ExpertTrace;
  hasMetricsCard?: boolean;
  metricsData?: {
    title: string;
    badgeText: string;
    currentValue: string;
    historicValue: string;
    thresholdValue: string;
    chartPoints: ChartDataPoint[];
    summaryText: string;
  };
}

export interface SuggestionToken {
  id: string;
  label: string;
  iconType: 'flood' | 'farm' | 'cyclone' | 'solar' | 'forecast' | 'general';
}