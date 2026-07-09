import { create } from 'zustand';
import type { RiskAlert, HistoricalComparison, MetricItem } from '../services/aiService';
import * as aiService from '../services/aiService';
import type { AssistantMessage } from '../types/assistant.types';
import type { ExpertAnalysis, ExpertRisk, ExpertRecommendation } from '../types/expert.types';
import type { RiskMonitorReport } from '../types/riskMonitor.types';

export interface SuggestionToken {
  id: string;
  label: string;
  iconType: 'flood' | 'farm' | 'cyclone' | 'solar';
}

const suggestionTokens: SuggestionToken[] = [
  { id: 'tok-1', label: 'Flood risk?', iconType: 'flood' },
  { id: 'tok-2', label: 'Best time to farm?', iconType: 'farm' },
  { id: 'tok-3', label: 'Compare to last year', iconType: 'cyclone' },
  { id: 'tok-4', label: 'Solar efficiency', iconType: 'solar' },
];

interface AIState {
  risks: RiskAlert[];
  recommendations: string[];
  historicalComparison: HistoricalComparison | null;
  farmSuggestions: string[];
  solarSuggestions: string[];
  messages: AssistantMessage[];
  isLoading: boolean;
  error: string | null;

  // Expert analysis
  expertAnalysis: ExpertAnalysis | null;
  isExpertLoading: boolean;
  expertError: string | null;

  // Risk monitor expert report
  riskMonitorReport: RiskMonitorReport | null;
  isRiskMonitorLoading: boolean;
  riskMonitorError: string | null;

  fetchRisks: (lat: number, lon: number) => Promise<void>;
  fetchRecommendations: (lat: number, lon: number) => Promise<void>;
  fetchHistoricalComparison: (lat: number, lon: number) => Promise<void>;
  fetchFarmSuggestions: (lat: number, lon: number) => Promise<void>;
  fetchSolarSuggestions: (lat: number, lon: number) => Promise<void>;
  fetchExpertAnalysis: (lat: number, lon: number) => Promise<void>;
  fetchRiskMonitor: (lat: number, lon: number) => Promise<void>;
  sendMessage: (lat: number, lon: number, text: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
  getSuggestionTokens: () => SuggestionToken[];
}

export const useAIStore = create<AIState>((set) => ({
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
  messages: [
    {
      id: 'msg-init',
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: 'Hello! I\'m your WeatherWise Intelligence Assistant. I can help you interpret complex atmospheric data, assess regional risks, or plan your operations based on hyper-local forecasts. How can I assist you today?',
    },
  ],
  isLoading: false,
  error: null,

  fetchRisks: async (lat, lon) => {
    set({ isLoading: true, error: null });
    try {
      const data = await aiService.getRisks(lat, lon);
      set({ risks: data, isLoading: false });
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

      // Build metricsData from new graph/metrics format
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

      const assistantMsg: AssistantMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: data.response,
        graph: data.graph || undefined,
        metrics: data.metrics || undefined,
        hasMetricsCard: !!metricsData,
        metricsData,
      };
      set((state) => ({ messages: [...state.messages, assistantMsg], isLoading: false }));
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
          text: 'Chat logs purged. Session re-initialized safely. How can I assist you with regional weather telemetry parameters now?',
        },
      ],
    });
  },

  clearError: () => set({ error: null }),

  getSuggestionTokens: () => suggestionTokens,
}));
