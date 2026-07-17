import { create } from 'zustand';
import type { RiskAlert, HistoricalComparison, MetricItem } from '../services/aiService';
import * as aiService from '../services/aiService';
import type { AssistantMessage, ExpertTrace, SuggestionToken } from '../types/assistant.types';
import type { ExpertAnalysis, ExpertRisk, ExpertRecommendation } from '../types/expert.types';
import type { RiskMonitorReport } from '../types/riskMonitor.types';

function generateDynamicTokens(risks: RiskAlert[]): SuggestionToken[] {
  const tokens: SuggestionToken[] = [
    { id: 'tok-q1', label: 'What is the weather now?', iconType: 'general' },
    { id: 'tok-q2', label: 'What is the forecast?', iconType: 'forecast' },
  ];
  const hasFlood = risks.some((r) => r.id === 'flood');
  const hasStorm = risks.some((r) => r.id === 'storm');
  const hasHeat = risks.some((r) => r.id === 'heat');

  if (hasFlood) tokens.push({ id: 'tok-d1', label: 'Flood risk?', iconType: 'flood' });
  else tokens.push({ id: 'tok-d1', label: 'Any flood risk?', iconType: 'flood' });

  if (hasStorm) tokens.push({ id: 'tok-d2', label: 'Storm risk?', iconType: 'cyclone' });
  else tokens.push({ id: 'tok-d2', label: 'Any storm risk?', iconType: 'cyclone' });

  if (hasHeat) tokens.push({ id: 'tok-d3', label: 'Heat risk?', iconType: 'flood' });

  tokens.push(
    { id: 'tok-trend', label: 'Weather trend?', iconType: 'cyclone' },
    { id: 'tok-farm', label: 'Best time to farm?', iconType: 'farm' },
    { id: 'tok-solar', label: 'Solar efficiency?', iconType: 'solar' },
  );

  return tokens;
}

interface AIState {
  risks: RiskAlert[];
  recommendations: string[];
  historicalComparison: HistoricalComparison | null;
  farmSuggestions: string[];
  solarSuggestions: string[];
  messages: AssistantMessage[];
  isLoading: boolean;
  error: string | null;

  expertAnalysis: ExpertAnalysis | null;
  isExpertLoading: boolean;
  expertError: string | null;

  riskMonitorReport: RiskMonitorReport | null;
  isRiskMonitorLoading: boolean;
  riskMonitorError: string | null;

  analyticsReport: import('../types/analytics.types').AnalyticsReport | null;
  isAnalyticsLoading: boolean;
  analyticsError: string | null;

  suggestionTokens: SuggestionToken[];

  fetchRisks: (lat: number, lon: number) => Promise<void>;
  fetchRecommendations: (lat: number, lon: number) => Promise<void>;
  fetchHistoricalComparison: (lat: number, lon: number) => Promise<void>;
  fetchFarmSuggestions: (lat: number, lon: number) => Promise<void>;
  fetchSolarSuggestions: (lat: number, lon: number) => Promise<void>;
  fetchExpertAnalysis: (lat: number, lon: number) => Promise<void>;
  fetchRiskMonitor: (lat: number, lon: number) => Promise<void>;
  fetchAnalyticsReport: (lat: number, lon: number, refresh?: boolean) => Promise<void>;
  sendMessage: (lat: number, lon: number, text: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
  getSuggestionTokens: () => SuggestionToken[];
}

export const useAIStore = create<AIState>((set, get) => ({
  risks: [],
  recommendations: [],
  historicalComparison: null,
  farmSuggestions: [],
  solarSuggestions: [],
  expertAnalysis: null,
  isExpertLoading: false,
  expertError: null,

  riskMonitorReport: null,
  isRiskMonitorLoading: false,
  riskMonitorError: null,

  analyticsReport: null,
  isAnalyticsLoading: false,
  analyticsError: null,
  messages: [
    {
      id: 'msg-init',
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: 'Welcome to TraceSky! I\'m your weather intelligence assistant. I use an expert system with over 50 rules to analyze weather data in real time.\n\nYou can ask me about:\n  • Current weather conditions\n  • Flood, storm, or heat risks\n  • Forecasts and outlooks\n  • Historical comparisons\n  • Farming advice\n  • Solar energy planning\n\nWhat would you like to know about your local weather?',
    },
  ],
  isLoading: false,
  error: null,

  suggestionTokens: [
    { id: 'tok-q1', label: 'What is the weather now?', iconType: 'general' },
    { id: 'tok-q2', label: 'What is the forecast?', iconType: 'forecast' },
    { id: 'tok-1', label: 'Flood risk?', iconType: 'flood' },
    { id: 'tok-trend', label: 'Weather trend?', iconType: 'cyclone' },
    { id: 'tok-farm', label: 'Best time to farm?', iconType: 'farm' },
    { id: 'tok-solar', label: 'Solar efficiency?', iconType: 'solar' },
  ],

  fetchRisks: async (lat, lon) => {
    set({ isLoading: true, error: null });
    try {
      const data = await aiService.getRisks(lat, lon);
      set({ risks: data, suggestionTokens: generateDynamicTokens(data), isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch risks', isLoading: false });
    }
  },

  fetchRecommendations: async (lat, lon) => {
    try {
      const data = await aiService.getRecommendations(lat, lon);
      set({ recommendations: data });
    } catch {
      // Silently fail
    }
  },

  fetchHistoricalComparison: async (lat, lon) => {
    set({ isLoading: true, error: null });
    try {
      const data = await aiService.getHistoricalComparison(lat, lon);
      set({ historicalComparison: data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch historical comparison', isLoading: false });
    }
  },

  fetchFarmSuggestions: async (lat, lon) => {
    try {
      const data = await aiService.getFarmSuggestions(lat, lon);
      set({ farmSuggestions: data });
    } catch {
      // Silently fail
    }
  },

  fetchSolarSuggestions: async (lat, lon) => {
    try {
      const data = await aiService.getSolarSuggestions(lat, lon);
      set({ solarSuggestions: data });
    } catch {
      // Silently fail
    }
  },

  fetchExpertAnalysis: async (lat, lon) => {
    set({ isExpertLoading: true, expertError: null });
    try {
      const data = await aiService.getExpertAnalysis(lat, lon);
      set({ expertAnalysis: data, isExpertLoading: false });
    } catch (err) {
      set({
        expertError: err instanceof Error ? err.message : 'Failed to fetch expert analysis',
        isExpertLoading: false,
      });
    }
  },

  fetchRiskMonitor: async (lat, lon) => {
    set({ isRiskMonitorLoading: true, riskMonitorError: null });
    try {
      const data = await aiService.getRiskMonitor(lat, lon);
      set({ riskMonitorReport: data, isRiskMonitorLoading: false });
    } catch (err) {
      set({
        riskMonitorError: err instanceof Error ? err.message : 'Failed to fetch risk monitor report',
        isRiskMonitorLoading: false,
      });
    }
  },

  fetchAnalyticsReport: async (lat, lon, refresh) => {
    set({ isAnalyticsLoading: true, analyticsError: null });
    try {
      const data = await aiService.getAnalyticsReport(lat, lon, refresh);
      set({ analyticsReport: data, isAnalyticsLoading: false });
    } catch (err) {
      set({
        analyticsError: err instanceof Error ? err.message : 'Failed to fetch analytics report',
        isAnalyticsLoading: false,
      });
    }
  },

  sendMessage: async (lat, lon, text) => {
    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text,
    };
    set((state) => ({ messages: [...state.messages, userMsg], isLoading: true, error: null }));

    try {
      const data = await aiService.chatWithAI(lat, lon, text);

      let metricsData: AssistantMessage['metricsData'] | undefined;
      const activeRisks = (data.risks || []).filter((r) => r.severity !== 'Low');

      if (data.metrics) {
        const metricsArr = Object.values(data.metrics) as MetricItem[];
        metricsData = {
          title: data.graph?.title || 'Analysis',
          badgeText: activeRisks.length > 0 ? `${activeRisks.length} Active` : 'Info',
          currentValue: metricsArr[0]?.value || '--',
          historicValue: metricsArr[1]?.value || '--',
          thresholdValue: data.graph?.threshold !== undefined ? `${data.graph.threshold}%` : '--',
          chartPoints: data.graph?.type === 'forecast_line'
            ? (data.graph.highs || []).map((v: number, i: number) => ({
                label: data.graph?.labels?.[i] || '',
                value: Math.round(v),
              }))
            : (data.graph?.datasets || []).map((d: { label: string; current: number }) => ({
                label: (d.label || '').split(' ')[0],
                value: Math.round(d.current),
              })),
          summaryText: data.response.split('\n\n')[0] || '',
        };
      }

      const expertTrace: ExpertTrace | undefined = data.expert_trace ?? undefined;

      const assistantMsg: AssistantMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: data.response,
        graph: data.graph || undefined,
        metrics: data.metrics || undefined,
        expert_trace: expertTrace,
        hasMetricsCard: !!metricsData,
        metricsData,
      };
      set((state) => ({
        messages: [...state.messages, assistantMsg],
        isLoading: false,
        risks: data.risks || state.risks,
        suggestionTokens: generateDynamicTokens(data.risks || state.risks),
      }));
    } catch (err) {
      const errorMsg: AssistantMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
      };
      set((state) => ({ messages: [...state.messages, errorMsg], isLoading: false }));
    }
  },

  clearMessages: () => {
    set({
      messages: [
        {
          id: 'msg-clear',
          sender: 'assistant',
          timestamp: 'Just now',
          text: 'Chat cleared. I\'m ready to help with any weather questions you have!',
        },
      ],
    });
  },

  clearError: () => set({ error: null }),

  getSuggestionTokens: () => get().suggestionTokens,
}));