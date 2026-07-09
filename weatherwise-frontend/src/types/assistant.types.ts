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

export interface AssistantMessage {
  id: string;
  sender: 'assistant' | 'user';
  timestamp: string;
  text: string;
  graph?: GraphConfig;
  metrics?: Record<string, MetricItem>;
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
  iconType: 'flood' | 'farm' | 'cyclone' | 'solar';
}
