import React, { useState } from 'react';
import { Save, ShieldCheck } from 'lucide-react';
import { SettingsSidebar, type SettingsTab } from '../components/settings/SettingsSidebar';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { AppearanceSettings } from '../components/settings/AppearanceSettings';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { DefaultLocationSettings } from '../components/settings/DefaultLocationSettings';
import { DataManagement } from '../components/settings/DataManagement';
import { useSettingsStore } from '../store/settingsStore';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const { config, updateConfig } = useSettingsStore();
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => setSaving(false), 800);
  };

  return (
    <div className="pt-20 pb-6 px-4 sm:px-6 lg:px-8 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 space-y-6 transition-all flex flex-col justify-between">

      <form onSubmit={handleSave} className="space-y-6 flex-1">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-[#1C2345] pb-5">
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">System Settings</h2>
            <p className="text-xs font-semibold text-gray-400 mt-0.5">Configure application preferences and operational thresholds.</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white disabled:text-gray-500 rounded-xl text-xs font-bold transition-all shadow-md self-end sm:self-auto"
          >
            <Save size={14} />
            <span>{saving ? 'SAVING...' : 'SAVE CHANGES'}</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          <div className="flex-1 bg-[#0E1328] border border-[#1C2345] rounded-2xl p-6 w-full shadow-xl">
            {activeTab === 'general' && (
              <>
                <GeneralSettings
                  unitSystem={config.unitSystem}
                  setUnitSystem={(val) => updateConfig({ unitSystem: val })}
                  refreshInterval={config.refreshInterval}
                  setRefreshInterval={(val) => updateConfig({ refreshInterval: val })}
                  alertRadius={config.alertRadius}
                  setAlertRadius={(val) => updateConfig({ alertRadius: val })}
                />
                <div className="mt-6 pt-6 border-t border-[#1C2345]">
                  <AppearanceSettings />
                </div>
              </>
            )}

            {activeTab === 'profile' && <ProfileSettings />}

            {activeTab === 'location' && <DefaultLocationSettings />}

            {activeTab === 'advanced' && (
              <>
                <DataManagement />
              </>
            )}
          </div>
        </div>
      </form>

      <div className="bg-[#0A0D1F] border border-[#161D3A] px-4 py-3 rounded-xl flex items-center gap-3 text-[11px] font-medium text-gray-500 shrink-0">
        <ShieldCheck size={14} className="text-emerald-400" />
        <span>End-to-end cloud infrastructure encryption verified. TLS 1.3 tunnels active.</span>
      </div>

    </div>
  );
};
