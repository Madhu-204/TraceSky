import React from 'react';

interface GeneralSettingsProps {
  unitSystem: 'METRIC' | 'IMPERIAL';
  setUnitSystem: (val: 'METRIC' | 'IMPERIAL') => void;
  refreshInterval: number;
  setRefreshInterval: (val: number) => void;
  alertRadius: number;
  setAlertRadius: (val: number) => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  unitSystem,
  setUnitSystem,
  refreshInterval,
  setRefreshInterval,
  alertRadius,
  setAlertRadius,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold text-white tracking-wide">General Configuration</h4>
        <p className="text-xs text-gray-500 mt-0.5">Manage basic system layouts and processing intervals.</p>
      </div>

      <div className="space-y-5">
        {/* Toggle Option: Unit System */}
        <div className="flex justify-between items-center bg-[#090D1F] p-4 rounded-xl border border-[#161B35]">
          <div>
            <label className="text-xs font-bold text-gray-200 block">Unit System</label>
            <span className="text-[11px] text-gray-500 font-medium">Select global unit parameters for telemetry data.</span>
          </div>
          <div className="flex items-center gap-1 bg-[#070A14] p-1 border border-[#1C2340] rounded-xl">
            {(['METRIC', 'IMPERIAL'] as const).map((mode) => (
              <button
                type="button"
                key={mode}
                onClick={() => setUnitSystem(mode)}
                className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                  unitSystem === mode
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Select Option: Refresh Interval */}
        <div className="flex justify-between items-center bg-[#090D1F] p-4 rounded-xl border border-[#161B35]">
          <div>
            <label className="text-xs font-bold text-gray-200 block">Polling/Refresh Interval</label>
            <span className="text-[11px] text-gray-500 font-medium">Frequency of auto data fetching from edge nodes.</span>
          </div>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="bg-[#070A14] border border-[#1C2340] text-xs font-mono text-gray-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value={15}>15 Seconds</option>
            <option value={30}>30 Seconds</option>
            <option value={60}>1 Minute</option>
            <option value={300}>5 Minutes</option>
          </select>
        </div>

        {/* Custom Slider Control Input: Alert Radius */}
        <div className="bg-[#090D1F] p-4 rounded-xl border border-[#161B35] space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <label className="text-xs font-bold text-gray-200 block">Proximity Alert Radius</label>
              <span className="text-[11px] text-gray-500 font-medium">Radius envelope for processing regional emergency threat levels.</span>
            </div>
            <span className="text-xs font-mono font-black text-blue-400 bg-blue-500/5 px-2.5 py-1 rounded-md border border-blue-500/10">
              {alertRadius} km
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={alertRadius}
            onChange={(e) => setAlertRadius(Number(e.target.value))}
            className="w-full h-1 bg-[#151C3B] rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[9px] font-mono text-gray-600 font-bold">
            <span>5 KM</span>
            <span>50 KM</span>
            <span>100 KM</span>
          </div>
        </div>
      </div>
    </div>
  );
};