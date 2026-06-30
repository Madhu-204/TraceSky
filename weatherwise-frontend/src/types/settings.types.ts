export interface SystemConfig {
  unitSystem: 'METRIC' | 'IMPERIAL';
  refreshInterval: number; // in seconds
  alertRadius: number; // in kilometers
  pushNotifications: boolean;
  emailAlerts: boolean;
  smsCriticalAlerts: boolean;
  apiKey: string;
  apiStatus: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  ingestionMode: 'AGGRESSIVE' | 'BALANCED' | 'POLLING';
}