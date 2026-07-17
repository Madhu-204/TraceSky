export interface HourlyTelemetry {
  time: string;
  isToday: boolean;
  condition: string;
  icon: 'sunny' | 'cloudy' | 'overcast' | 'rain';
  temperature: number;
  precipitationChance: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';

  historicalTemp?: number;
  tempDeviation?: number;
  confidenceScore?: number;
  historicalCondition?: string;
}

export interface ChartDatapoint {
  time: string;
  predicted: number;
  historical: number;

  confidence?: number;
  confidenceStatus?: 'HIGH' | 'MEDIUM' | 'LOW';
  tempDeviation?: number;
  humidityDeviation?: number;
  windDeviation?: number;
  forecastRate?: number;
  historicalRate?: number;
  rateDeviation?: number;
}
