import React from 'react';
import type { AnomalyEvent } from '../../types/analytics.types';

interface EventTrackingCardProps {
  events: AnomalyEvent[];
}

export const EventTrackingCard: React.FC<EventTrackingCardProps> = ({ events }) => {
  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 space-y-4 shadow-xl flex flex-col h-[320px]">
      <div>
        <span className="text-[10px] font-black tracking-wider text-gray-500 font-mono uppercase">Event Tracking</span>
        <h3 className="text-sm font-bold text-white mt-0.5">Anomaly History</h3>
      </div>

      {/* Vertical Interactive Timeline Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
        {events.map((evt) => (
          <div key={evt.id} className="relative pl-4 border-l-2 border-[#1B2347] last:border-transparent pb-1 group">
            {/* Target Pulse Intersector Icon Node */}
            <span className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full transition-all ${
              evt.severity === 'critical' ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]' : 'bg-amber-400'
            }`} />

            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-black text-rose-400/90 tracking-tight">{evt.timestamp}</span>
              <h4 className="text-xs font-bold text-gray-200 group-hover:text-white transition-all">{evt.title}</h4>
              <p className="text-[11px] leading-relaxed text-gray-400 font-medium">{evt.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};