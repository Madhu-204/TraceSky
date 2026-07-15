const AI_BASE = 'http://localhost:8000/api/v1/ai';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface RiskAlert {
  id: string;
  name: string;
  percentage: number;
  severity: string;
  color: string;
  detail: string;
}

export interface MetricItem {
  label: string;
  value: string;
  color: string;
}

export interface ComparisonDataset {
  label: string;
  current: number;
  historical: number;
  change_pct: number;
}

export interface GraphConfig {
  type: 'risk_gauge' | 'comparison_bars' | 'forecast_line' | 'suggestion_list';
  title: string;
  value?: number;
  severity?: string;
  threshold?: number;
  labels?: string[];
  highs?: number[];
  lows?: number[];
  precip?: number[];
  datasets?: ComparisonDataset[];
  items?: string[];
  icon?: string;
}

export interface ExpertTraceCondition {
  fact: string;
  actual: unknown;
  expected: string;
  operator: string;
  matched: boolean;
}

export interface ExpertTraceRule {
  rule_id: string;
  description: string;
  certainty: number;
  conditions: ExpertTraceCondition[];
}

export interface ExpertTrace {
  fired_rules: ExpertTraceRule[];
  rules_evaluated: number;
  rules_fired: number;
  execution_time_ms: number;
  overall_certainty: number;
}

export interface ChatResponse {
  response: string;
  graph?: GraphConfig | null;
  metrics?: Record<string, MetricItem> | null;
  risks?: RiskAlert[];
  recommendations?: string[];
  suggestions?: string[];
  intents?: string[];
  entities?: Record<string, unknown>;
  expert_trace?: ExpertTrace | null;
}

export interface HistoricalComparison {
  period: {
    current: { start: string; end: string };
    comparison: { start: string; end: string };
  };
  metrics: {
    temperature: { current: number; historical: number; change_pct: number; trend: string };
    precipitation: { current: number; historical: number; change_pct: number; trend: string };
    wind_speed: { current: number; historical: number; change_pct: number; trend: string };
  };
  summary: string;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getRisks(lat: number, lon: number): Promise<RiskAlert[]> {
  const resp = await fetchJson<ApiResponse<RiskAlert[]>>(
    `${AI_BASE}/risks?lat=${lat}&lon=${lon}`
  );
  return resp.data;
}

export async function getRecommendations(lat: number, lon: number): Promise<string[]> {
  const resp = await fetchJson<ApiResponse<string[]>>(
    `${AI_BASE}/recommendations?lat=${lat}&lon=${lon}`
  );
  return resp.data;
}

export async function getHistoricalComparison(lat: number, lon: number): Promise<HistoricalComparison> {
  const resp = await fetchJson<ApiResponse<HistoricalComparison>>(
    `${AI_BASE}/historical-comparison?lat=${lat}&lon=${lon}`
  );
  return resp.data;
}

export async function getFarmSuggestions(lat: number, lon: number): Promise<string[]> {
  const resp = await fetchJson<ApiResponse<string[]>>(
    `${AI_BASE}/farm-suggestions?lat=${lat}&lon=${lon}`
  );
  return resp.data;
}

export async function getSolarSuggestions(lat: number, lon: number): Promise<string[]> {
  const resp = await fetchJson<ApiResponse<string[]>>(
    `${AI_BASE}/solar-suggestions?lat=${lat}&lon=${lon}`
  );
  return resp.data;
}

const SESSION_ID = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export async function getExpertAnalysis(lat: number, lon: number): Promise<import('../types/expert.types').ExpertAnalysis> {
  const resp = await fetchJson<ApiResponse<import('../types/expert.types').ExpertAnalysis>>(
    `${AI_BASE}/expert-analysis?lat=${lat}&lon=${lon}`
  );
  return resp.data;
}

export async function getRiskMonitor(lat: number, lon: number): Promise<import('../types/riskMonitor.types').RiskMonitorReport> {
  const resp = await fetchJson<ApiResponse<import('../types/riskMonitor.types').RiskMonitorReport>>(
    `${AI_BASE}/risk-monitor?lat=${lat}&lon=${lon}`
  );
  return resp.data;
}

export async function getAnalyticsReport(lat: number, lon: number, refresh?: boolean): Promise<import('../types/analytics.types').AnalyticsReport> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  if (refresh) params.set('refresh', 'true');
  const resp = await fetchJson<ApiResponse<import('../types/analytics.types').AnalyticsReport>>(
    `${AI_BASE}/analytics?${params.toString()}`
  );
  return resp.data;
}

export async function chatWithAI(
  lat: number,
  lon: number,
  message: string,
): Promise<ChatResponse> {
  const resp = await fetchJson<ApiResponse<ChatResponse>>(
    `${AI_BASE}/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: SESSION_ID, lat, lon, message }),
    }
  );
  return resp.data;
}
