import React, { useState } from 'react';
import { Layers, Compass, Plus, Minus } from 'lucide-react';
import type { DayMatrixPoint } from '../../types/risk.types';

interface GeospatialCanvasProps {
  timelineData: DayMatrixPoint[];
}

export const GeospatialCanvas: React.FC<GeospatialCanvasProps> = ({ timelineData }) => {
  const [activeLayer, setActiveLayer] = useState<'Risk' | 'Wind' | 'Thermal'>('Risk');

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 space-y-4">
      <style>{`@keyframes radarSweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.radar-sweep { animation: radarSweep 4s linear infinite; transform-origin: center; }
.radar-sweep::after { content: ''; position: absolute; top: 50%; left: 50%; width: 50%; height: 2px; background: linear-gradient(90deg, rgba(34,211,238,0.8), rgba(34,211,238,0)); transform-origin: left center; border-radius: 1px; }
.radar-sweep::before { content: ''; position: absolute; top: 50%; left: 50%; width: 100%; height: 100%; background: conic-gradient(from 0deg, rgba(34,211,238,0.15) 0deg, rgba(34,211,238,0.08) 45deg, transparent 60deg); transform: translate(-50%, -50%); border-radius: 50%; }`}</style>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-white tracking-wide">Geospatial Overlay</p>
          <span className="text-[9px] font-mono text-gray-500">N 40.7128° W 74.0060°</span>
        </div>
        <div className="flex items-center gap-1 bg-[#0A0E22] p-1 rounded-lg border border-[#161D3A]">
          {(['Risk', 'Wind', 'Thermal'] as const).map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                activeLayer === layer
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>
      </div>
      <div className="relative h-[280px] w-full bg-[#070A14] rounded-xl overflow-hidden border border-[#161D3A]">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="absolute border-l border-blue-400 h-full" style={{ left: `${(i + 1) * 8.33}%` }} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="absolute border-t border-blue-400 w-full" style={{ top: `${(i + 1) * 12.5}%` }} />
          ))}
        </div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 -translate-x-1/2 -translate-y-1/2">
          <div className="w-full h-full rounded-full border border-blue-500/15" />
          <div className="absolute top-1/2 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-500/20" />
          <div className="absolute top-1/2 left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5" />
          <div className="radar-sweep absolute inset-0" />
        </div>
        <div className="absolute top-1/3 left-1/4 w-20 h-20 -translate-x-1/2 -translate-y-1/2 bg-rose-500/40 rounded-full blur-xl" />
        <div className="absolute top-1/2 left-2/3 w-28 h-28 -translate-x-1/2 -translate-y-1/2 bg-amber-500/30 rounded-full blur-xl" />
        <div className="absolute bottom-1/3 right-1/3 w-16 h-16 -translate-x-1/2 -translate-y-1/2 bg-rose-500/30 rounded-full blur-lg" />
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <button className="p-2 bg-[#121733] border border-[#1C2340] rounded-lg hover:bg-[#1C2345] transition-colors"><Plus size={14} className="text-gray-400" /></button>
          <button className="p-2 bg-[#121733] border border-[#1C2340] rounded-lg hover:bg-[#1C2345] transition-colors"><Minus size={14} className="text-gray-400" /></button>
          <button className="p-2 bg-[#121733] border border-[#1C2340] rounded-lg hover:bg-[#1C2345] transition-colors"><Compass size={14} className="text-gray-400" /></button>
          <button className="p-2 bg-[#121733] border border-[#1C2340] rounded-lg hover:bg-[#1C2345] transition-colors"><Layers size={14} className="text-gray-400" /></button>
        </div>
        <div className="absolute bottom-3 right-3 bg-[#0A0E22]/90 border border-[#161D3A] p-2.5 rounded-lg">
          <p className="text-[9px] font-bold text-gray-400 mb-2 uppercase tracking-wider">Risk Intensity</p>
          <div className="space-y-1.5">
            {[
              { label: 'Critical', color: 'bg-rose-500' },
              { label: 'Warning', color: 'bg-amber-500' },
              { label: 'Stable', color: 'bg-emerald-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-sm ${item.color}`} />
                <span className="text-[9px] text-gray-500 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-3 left-3 text-[10px] font-mono text-gray-500">
          LIVE <span className="text-blue-400">RADAR</span>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">7-Day Risk Matrix</p>
          <div className="flex items-center gap-3 text-[9px] font-mono">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-rose-500 rounded-sm" /> Critical</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber-500 rounded-sm" /> Warning</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-500 rounded-sm" /> Stable</span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-16 px-2">
          {timelineData.map((point, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full flex items-end gap-0.5 h-10">
                {point.critical > 0 && <div className="flex-1 bg-rose-500/60 rounded-t-sm" style={{ height: `${(point.critical / 100) * 100}%` }} />}
                {point.warning > 0 && <div className="flex-1 bg-amber-500/60 rounded-t-sm" style={{ height: `${(point.warning / 100) * 100}%` }} />}
                {point.stable > 0 && <div className="flex-1 bg-emerald-500/60 rounded-t-sm" style={{ height: `${(point.stable / 100) * 100}%` }} />}
              </div>
              {point.hasPeak && <span className="text-[8px] font-black text-rose-400 uppercase">Peak</span>}
              <span className="text-[9px] font-bold text-gray-500">{point.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
