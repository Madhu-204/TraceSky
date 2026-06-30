import React from 'react';
import { Settings, Bell, Key, Database } from 'lucide-react';

export type SettingsTab = 'general' | 'notifications' | 'api' | 'ingestion';

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'general', label: 'General Configuration', icon: <Settings size={14} /> },
    { id: 'notifications', label: 'Notification Protocols', icon: <Bell size={14} /> },
    { id: 'api', label: 'API Keys & Gateways', icon: <Key size={14} /> },
    { id: 'ingestion', label: 'Data Ingestion Architecture', icon: <Database size={14} /> },
  ] as const;

  return (
    <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-1 bg-[#0E1328] border border-[#1C2345] p-2 rounded-2xl overflow-x-auto lg:overflow-x-visible custom-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2.5 px-4 py-3 text-xs font-bold whitespace-nowrap rounded-xl transition-all w-full text-left ${
            activeTab === tab.id
              ? 'bg-blue-600 text-white shadow-[0_2px_10px_rgba(59,130,246,0.2)]'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#151C3A]/50'
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};