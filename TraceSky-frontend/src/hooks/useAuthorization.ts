export type Feature =
  | 'farm-suggestions'
  | 'solar-suggestions'
  | 'risk-monitor'
  | 'expert-analysis'
  | 'analytics';

export function useAuthorization() {
  return {
    canAccess: (_feature: Feature): boolean => true,
    getAccessibleTabs: (): string[] => [
      'dashboard', 'forecast', 'risk', 'assistant', 'analytics', 'settings'
    ],
  };
}
