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
}

export interface ChartDatapoint {
  time: string;
  predicted: number;
  historical: number;
}