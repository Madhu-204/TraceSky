export interface RiskAlert {
  id: string;
  type: 'FLOOD' | 'STORM' | 'HEAT' | 'LIGHTNING';
  badgeText: string;
  title: string;
  timestamp: string;
  description: string;
  metaTags?: string[];
  statusText: string;
  statusColor: 'emerald' | 'amber' | 'blue';
}

export interface DayMatrixPoint {
  day: string;
  critical: number;
  warning: number;
  stable: number;
  hasPeak?: boolean;
}