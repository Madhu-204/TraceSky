export interface ChartDataPoint {
  label: string;
  value: number;
  isCurrent?: boolean;
}

export interface AssistantMessage {
  id: string;
  sender: 'assistant' | 'user';
  timestamp: string;
  text: string;
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