import React, { useState } from 'react';
import { Download, RotateCcw, Check, AlertTriangle } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

export const DataManagement: React.FC = () => {
  const { exportSettings, resetToDefaults } = useSettingsStore();
  const [exported, setExported] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleExport = () => {
    const csv = exportSettings();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracesky-settings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const handleReset = () => {
    resetToDefaults();
    setShowResetConfirm(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold text-white tracking-wide">Data & Security</h4>
        <p className="text-xs text-gray-500 mt-0.5">Manage your data, export settings, and security credentials.</p>
      </div>

      <div className="space-y-4">
        <div className="bg-[#090D1F] border border-[#161B35] rounded-xl p-4 space-y-4">
          <label className="text-xs font-bold text-gray-200 block">Data Management</label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center justify-between bg-[#070A14] border border-[#1C2340] hover:border-blue-500/30 rounded-lg p-3 transition-all group"
            >
              <div className="flex items-center gap-2">
                {exported ? <Check size={14} className="text-emerald-400" /> : <Download size={14} className="text-gray-500 group-hover:text-blue-400 transition-colors" />}
                <div className="text-left">
                  <p className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">Export Settings</p>
                  <p className="text-[9px] text-gray-500">Download as CSV</p>
                </div>
              </div>
              {exported && <span className="text-[9px] text-emerald-400 font-mono">Done</span>}
            </button>

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center justify-between bg-[#070A14] border border-[#1C2340] hover:border-red-500/30 rounded-lg p-3 transition-all group"
            >
              <div className="flex items-center gap-2">
                <RotateCcw size={14} className="text-gray-500 group-hover:text-red-400 transition-colors" />
                <div className="text-left">
                  <p className="text-xs font-bold text-white group-hover:text-red-300 transition-colors">Reset to Defaults</p>
                  <p className="text-[9px] text-gray-500">Restore factory settings</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {showResetConfirm && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-xs font-bold text-red-400">Confirm Reset</span>
            </div>
            <p className="text-[11px] text-gray-400">
              This will reset all settings to their default values. This action cannot be undone.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 text-[10px] font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all"
              >
                Reset All Settings
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-[10px] font-bold border border-[#1C2345] text-gray-400 hover:text-white rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
