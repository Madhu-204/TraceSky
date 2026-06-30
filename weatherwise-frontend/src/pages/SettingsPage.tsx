import React, { useState } from 'react';
import { Save, ShieldCheck } from 'lucide-react';
import { SettingsSidebar, type SettingsTab } from '../components/settings/SettingsSidebar';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { ApiGatewaySettings } from '../components/settings/ApiGatewaySettings';
import type { SystemConfig } from '../types/settings.types';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [config, setConfig] = useState<SystemConfig>({
    unitSystem: 'METRIC',
    refreshInterval: 30,
    alertRadius: 25,
    pushNotifications: true,
    emailAlerts: false,
    smsCriticalAlerts: true,
    apiKey: 'ww_live_8f39a0bc42de711209bcfa66381ea19a',
    apiStatus: 'ACTIVE',
    ingestionMode: 'BALANCED'
  });

  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => setSaving(false), 1200); // Simulated edge node write latency
  };

  const regenerateApiKey = () => {
    const hex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setConfig(prev => ({ ...prev, apiKey: `ww_live_${hex}` }));
  };

  return (
    <div className="pt-20 pb-6 px-4 sm:px-6 lg:px-8 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 space-y-6 transition-all flex flex-col justify-between">

      <form onSubmit={handleSave} className="space-y-6 flex-1">
        {/* SECTION 1: Fixed Screen Header Control Row */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-[#1C2345] pb-5">
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">System Settings</h2>
            <p className="text-xs font-semibold text-gray-400 mt-0.5">Configure algorithmic parameters and operational thresholds.</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white disabled:text-gray-500 rounded-xl text-xs font-bold transition-all shadow-md self-end sm:self-auto"
          >
            <Save size={14} />
            <span>{saving ? 'SAVING PROFILE...' : 'SAVE CHANGES'}</span>
          </button>
        </div>

        {/* SECTION 2: Two-Column Interface Panel Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          <div className="flex-1 bg-[#0E1328] border border-[#1C2345] rounded-2xl p-6 w-full shadow-xl">
            {activeTab === 'general' && (
              <GeneralSettings
                unitSystem={config.unitSystem}
                setUnitSystem={(val) => setConfig(p => ({ ...p, unitSystem: val }))}
                refreshInterval={config.refreshInterval}
                setRefreshInterval={(val) => setConfig(p => ({ ...p, refreshInterval: val }))}
                alertRadius={config.alertRadius}
                setAlertRadius={(val) => setConfig(p => ({ ...p, alertRadius: val }))}
              />
            )}

            {activeTab === 'api' && (
              <ApiGatewaySettings
                apiKey={config.apiKey}
                status={config.apiStatus}
                onRegenerate={regenerateApiKey}
              />
            )}

            {(activeTab === 'notifications' || activeTab === 'ingestion') && (
              <div className="text-center py-12 text-gray-500 text-xs font-mono font-medium">
                Additional properties for <span className="text-blue-400 font-bold">"{activeTab.toUpperCase()}"</span> section are managed by your network group profile.
              </div>
            )}
          </div>
        </div>
      </form>

      {/* SECTION 3: System Verification Integrity Guard Footer */}
      <div className="bg-[#0A0D1F] border border-[#161D3A] px-4 py-3 rounded-xl flex items-center gap-3 text-[11px] font-medium text-gray-500 shrink-0">
        <ShieldCheck size={14} className="text-emerald-400" />
        <span>End-to-end cloud infrastructure encryption verified. TLS 1.3 tunnels active.</span>
      </div>

    </div>
  );
};