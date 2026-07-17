import React from 'react';
import { Shield, TrendingDown, Clock, Brain, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';
import type { ForecastValidation, ExpertRecommendation, InferenceMetrics } from '../../types/expert.types';
import { useUnitSystem } from '../../utils/unitConversion';

interface ForecastExpertInsightsProps {
  validation: ForecastValidation | null | undefined;
  recommendations: ExpertRecommendation[];
  metrics: InferenceMetrics | null;
  generatedAt: string | null;
}

export const ForecastExpertInsights: React.FC<ForecastExpertInsightsProps> = ({
  validation, recommendations, metrics, generatedAt,
}) => {
  const { temp } = useUnitSystem();
  const status = validation?.overall_status ?? 'NONE';
  const avgConfidence = validation?.average_confidence ?? 0;
  const avgDeviation = validation?.average_temp_deviation;
  const hoursValidated = validation?.hours_validated ?? 0;

  const statusColor: Record<string, string> = {
    HIGH: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    LOW: 'text-red-400 bg-red-500/10 border-red-500/20',
    NONE: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
  };

  const statusIcon: Record<string, React.ReactNode> = {
    HIGH: <CheckCircle size={16} className="text-emerald-400" />,
    MEDIUM: <AlertTriangle size={16} className="text-amber-400" />,
    LOW: <AlertTriangle size={16} className="text-red-400" />,
    NONE: <Shield size={16} className="text-gray-500" />,
  };

  const statusLabel: Record<string, string> = {
    HIGH: 'High Confidence',
    MEDIUM: 'Medium Confidence',
    LOW: 'Low Confidence',
    NONE: 'Not Validated',
  };

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 space-y-5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10 text-emerald-400">
            <Brain size={14} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Expert System</p>
            <h3 className="text-sm font-bold text-white tracking-tight">Forecast Validation & Reasoning</h3>
          </div>
        </div>
        <span className={`text-[9px] font-black tracking-wider px-2 py-1 rounded-lg border uppercase flex items-center gap-1 ${statusColor[status] || statusColor.NONE}`}>
          {statusIcon[status]}
          {statusLabel[status]}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111630] border border-[#1C2340] rounded-xl p-3 space-y-1">
          <p className="text-[9px] text-gray-500 font-bold tracking-wider uppercase">Avg Confidence</p>
          <p className={`text-lg font-black font-mono ${avgConfidence >= 0.7 ? 'text-emerald-400' : avgConfidence >= 0.4 ? 'text-amber-400' : 'text-red-400'}`}>
            {Math.round(avgConfidence * 100)}%
          </p>
        </div>

        <div className="bg-[#111630] border border-[#1C2340] rounded-xl p-3 space-y-1">
          <p className="text-[9px] text-gray-500 font-bold tracking-wider uppercase">Temp Deviation</p>
          <p className="text-lg font-black font-mono text-white">
            {avgDeviation != null ? `±${temp(avgDeviation).value}${temp(avgDeviation).unit}` : '--'}
          </p>
        </div>

        <div className="bg-[#111630] border border-[#1C2340] rounded-xl p-3 space-y-1">
          <p className="text-[9px] text-gray-500 font-bold tracking-wider uppercase">Hours Validated</p>
          <p className="text-lg font-black font-mono text-white">
            {hoursValidated}h
          </p>
        </div>

        <div className="bg-[#111630] border border-[#1C2340] rounded-xl p-3 space-y-1">
          <p className="text-[9px] text-gray-500 font-bold tracking-wider uppercase">Rules Evaluated</p>
          <p className="text-lg font-black font-mono text-white">
            {metrics?.total_rules_evaluated ?? '--'}
          </p>
        </div>
      </div>

      <div className="bg-[#111630] border border-[#1C2340] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb size={13} className="text-amber-400" />
          <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Inference Recommendations</p>
        </div>
        <div className="space-y-2">
          {recommendations.length > 0 ? (
            recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                <span className="text-blue-400 mt-0.5 shrink-0">&#9656;</span>
                <p>{rec.text}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500 italic">No recommendations generated</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-[10px] text-gray-600 font-mono border-t border-[#1C2340] pt-3">
        <div className="flex items-center gap-1.5">
          <Clock size={11} />
          Sync: {generatedAt ? `${Math.round((Date.now() - new Date(generatedAt).getTime()) / 60000)}m ago` : '--'}
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingDown size={11} />
          Inference: {metrics?.execution_time_ms != null ? `${metrics.execution_time_ms}ms` : '--'}
        </div>
        <div className="flex items-center gap-1.5">
          <Brain size={11} />
          Fired: {metrics?.total_rules_fired ?? 0}/{metrics?.total_rules_evaluated ?? 0} rules
        </div>
      </div>
    </div>
  );
};
