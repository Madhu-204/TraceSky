export interface AccuracyPoint {
  label: string;
  predicted: number;
  actual: number;
}

export interface HeatmapSquare {
  dayIndex: number; // 0-6 (Sun-Sat)
  weekIndex: number; // 0-3
  intensityValue: 'low' | 'medium' | 'high' | 'extreme' | 'none';
}

export interface AnomalyEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface BenchmarkRow {
  variable: string;
  unit: string;
  openWeatherVal: number;
  weatherWiseVal: number;
  actualObserved: number;
  status: 'optimal' | 'divergent';
}