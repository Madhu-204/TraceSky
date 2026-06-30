export interface CurrentTelemetry {
  location: string;
  condition: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: string;
  uvIndex: string;
}

export interface RiskFactor {
  id: string;
  name: string;
  percentage: number;
  severity: 'High' | 'Moderate' | 'Low';
}

export interface MatrixDay {
  day: string;
  high: number;
  low: number;
  pop: number;
  icon: string;
}