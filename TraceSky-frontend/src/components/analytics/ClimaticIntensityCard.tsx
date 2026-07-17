import React, { useState } from 'react';
import { Info, Check, X } from 'lucide-react';
import type { ClimaticIntensityData, IntensityDay, ExplanationChainLink } from '../../types/analytics.types';
import { useUnitSystem } from '../../utils/unitConversion';

interface ClimaticIntensityCardProps {
  data: ClimaticIntensityData;
}

const intensityColors: Record<string, string> = {
  none: 'bg-[#1C2345]/60 border border-[#2C376B]/30',
  low: 'bg-teal-700/50 border border-teal-500/20',
  medium: 'bg-blue-500/60 border border-blue-400/30',
  high: 'bg-rose-500/80 border border-rose-400/40',
  extreme: 'bg-amber-400 border border-amber-300/60',
};

const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const ClimaticIntensityCard: React.FC<ClimaticIntensityCardProps> = ({ data }) => {
  const [selectedDay, setSelectedDay] = useState<IntensityDay | null>(null);

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 space-y-5 shadow-xl flex flex-col">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-black tracking-wider text-gray-500 font-mono uppercase">Climatic Intensity</span>
          <h3 className="text-sm font-bold text-white mt-0.5">Pattern Heatmap</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono">
            CF: {data.certainty.toFixed(2)}
          </span>
          <button className="text-gray-500 hover:text-gray-300 transition-all">
            <Info size={14} />
          </button>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 leading-relaxed bg-[#080C1A] rounded-lg p-2.5 border border-[#1C2340]">
        {data.overall_assessment}
      </p>

      <div className="space-y-4 flex-1 flex flex-col">
        {data.weeks.map((week) => (
          <div key={week.week_index}>
            <p className="text-[9px] font-mono font-bold text-gray-600 mb-2">{week.label}</p>
            <div className="grid grid-cols-7 gap-1.5">
              {week.days.map((day) => (
                <button
                  key={`${week.week_index}-${day.day_index}`}
                  onClick={() => setSelectedDay(selectedDay?.day_index === day.day_index && selectedDay?.week_index === day.week_index ? null : day)}
                  className={`aspect-square rounded-sm ${intensityColors[day.intensity]} transition-all hover:scale-110 cursor-pointer relative group`}
                  title={`${day.day}: ${day.primary_factor} ${day.primary_value} (${day.intensity})`}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[6px] font-mono font-bold text-white/60 opacity-0 group-hover:opacity-100">
                    {day.day}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedDay && (
        <DayDetailModal day={selectedDay} onClose={() => setSelectedDay(null)} />
      )}

      <div className="flex justify-between items-center text-[9px] font-mono font-bold text-gray-500 pt-3 border-t border-[#151B35]">
        <span>Low Intensity</span>
        <div className="w-24 h-1.5 rounded bg-gradient-to-r from-blue-600/40 via-rose-500/60 to-amber-400 mx-2" />
        <span>Extreme</span>
      </div>
    </div>
  );
};

function DayDetailModal({ day, onClose }: { day: IntensityDay; onClose: () => void }) {
  const { temp, wind, precip } = useUnitSystem();

  return (
    <div className="bg-[#0D1128] border border-[#1C2345] rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[9px] font-mono font-bold text-gray-500">Week {day.week_index + 1} &middot; {day.day}</span>
          <h4 className="text-xs font-bold text-white mt-0.5 capitalize">Intensity: {day.intensity}</h4>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-[10px]">&times;</button>
      </div>

      <p className="text-[10px] text-gray-400 leading-relaxed">{day.reasoning}</p>

      <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
        <div className="bg-[#080C1A] border border-[#1C2340] rounded p-1.5 text-center">
          <span className="text-gray-500">Temp</span>
          <p className="text-white font-bold">{temp(day.temperature).value}{temp(0).unit}</p>
        </div>
        <div className="bg-[#080C1A] border border-[#1C2340] rounded p-1.5 text-center">
          <span className="text-gray-500">Precip</span>
          <p className="text-white font-bold">{precip(day.precipitation).value}{precip(0).unit}</p>
        </div>
        <div className="bg-[#080C1A] border border-[#1C2340] rounded p-1.5 text-center">
          <span className="text-gray-500">Wind</span>
          <p className="text-white font-bold">{wind(day.wind_speed).value}{wind(0).unit}</p>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-[8px] text-gray-600 font-bold tracking-wider uppercase">Primary Factor</p>
        <div className="bg-[#080C1A] border border-[#1C2340] rounded-lg p-2">
          <div className="flex items-center gap-2 text-[9px] font-mono">
            <span className="text-cyan-400 capitalize">{day.primary_factor}</span>
            <span className="text-gray-500">= {day.primary_value}</span>
            <span className="text-gray-600">| intensity: {day.intensity}</span>
          </div>
        </div>
      </div>

      {day.explanation_chain.map((link, i) => (
        <ChainRow key={i} link={link} />
      ))}
    </div>
  );
}

function ChainRow({ link }: { link: ExplanationChainLink }) {
  return (
    <div className="bg-[#080C1A] border border-[#1C2340] rounded-lg p-2 space-y-1">
      <div className="flex items-center gap-2 text-[9px] font-mono">
        <span className="text-cyan-400 font-bold">{link.rule_id}</span>
        <span className="text-gray-500">CF: {link.certainty.toFixed(2)}</span>
        <span className="text-gray-400 flex-1 truncate">{link.rule_description}</span>
      </div>
      <div className="space-y-0.5">
        {link.conditions.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[8px] font-mono">
            <span className={c.matched ? 'text-emerald-400' : 'text-red-400'}>
              {c.matched ? <Check size={8} /> : <X size={8} />}
            </span>
            <span className="text-gray-500">{c.fact}</span>
            <span className="text-gray-600">{c.operator}</span>
            <span className="text-gray-400">{c.expected}</span>
            <span className="text-gray-600">| actual:</span>
            <span className={c.matched ? 'text-emerald-300' : 'text-red-300'}>{c.actual}</span>
          </div>
        ))}
      </div>
      {link.conclusion && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-[#1C2340] mt-1 text-[8px] font-mono">
          <span className="text-cyan-400">&rarr;</span>
          <span className="text-cyan-300">{link.conclusion}</span>
          <span className="text-gray-500">= {String(link.conclusion_value)}</span>
        </div>
      )}
    </div>
  );
}
