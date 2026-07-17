import React from 'react';
import { Settings, User, MapPin, Shield } from 'lucide-react';

export type SettingsTab = 'general' | 'profile' | 'location' | 'advanced';

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'general', label: 'General Configuration', icon: <Settings size={14} /> },
    { id: 'profile', label: 'Profile & Account', icon: <User size={14} /> },
    { id: 'location', label: 'Default Location', icon: <MapPin size={14} /> },
    { id: 'advanced', label: 'Data & Security', icon: <Shield size={14} /> },
  ] as const;

  return (
    <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-1 bg-[#0E1328] border border-[#1C2345] p-2 rounded-2xl overflow-x-auto lg:overflow-x-visible custom-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as SettingsTab)}
          className={`flex items-center gap-2.5 px-4 py-3 text-xs font-bold whitespace-nowrap rounded-xl transition-all w-full text-left ${
            activeTab === tab.id
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#151C3A]/50'
          }`}
          style={activeTab === tab.id ? { boxShadow: 'var(--color-shadow-glow)' } : undefined}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
