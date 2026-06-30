import React from 'react';

interface ForecastAccuracyCardProps {
  accuracyPercentage: string;
}

export const ForecastAccuracyCard: React.FC<ForecastAccuracyCardProps> = ({ accuracyPercentage }) => {
  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 space-y-6 flex flex-col justify-between shadow-xl">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-black tracking-wider text-gray-500 font-mono uppercase">Forecast Accuracy</span>
          <h3 className="text-sm font-bold text-white mt-0.5">Historical vs Prediction</h3>
        </div>
        <span className="text-[10px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-mono">
          • {accuracyPercentage} Accuracy
        </span>
      </div>

      {/* Embedded Chart Workspace Map via Inline SVG Vector */}
      <div className="relative h-44 w-full pt-4">
        <div className="absolute top-2 left-0 flex items-center gap-4 text-[10px] font-bold text-gray-500 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> WeatherWise
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-0.5 border-t-2 border-dashed border-gray-500" /> Actuals
          </div>
        </div>

        <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
          {/* Grid Guideline Matrices */}
          <line x1="0" y1="100" x2="500" y2="100" stroke="#151B35" strokeWidth="1" strokeDasharray="4" />
          <line x1="0" y1="50" x2="500" y2="50" stroke="#151B35" strokeWidth="1" strokeDasharray="4" />

          {/* Actuals Spline Line (Dashed Vector) */}
          <path
            d="M 0 90 Q 125 105, 250 75 T 500 35"
            fill="none"
            stroke="#3A4468"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          {/* WeatherWise Predictive Spline Line */}
          <path
            d="M 0 80 Q 125 95, 250 65 T 500 25"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2.5"
            className="drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]"
          />

          {/* Intersection Validation Target Dot */}
          <circle cx="340" cy="48" r="3.5" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2" />
        </svg>

        {/* X-Axis Timeline Indicators */}
        <div className="flex justify-between text-[9px] font-mono font-bold text-gray-500 mt-2 pt-2 border-t border-[#151B35]">
          <span>OCT 01</span>
          <span>OCT 07</span>
          <span>OCT 14</span>
          <span>OCT 21</span>
          <span>OCT 28</span>
        </div>
      </div>
    </div>
  );
};