import React from 'react';
import { LayoutDashboard, CloudSun, ShieldAlert, Bot, BarChart3, Settings, HelpCircle, LogOut } from 'lucide-react';
import { WeatherIcon } from '../ui/WeatherIcon';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'forecast', label: 'Forecast', icon: CloudSun },
    { id: 'risk', label: 'Risk Monitor', icon: ShieldAlert },
    { id: 'assistant', label: 'AI Assistant', icon: Bot },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-[#0A0D1A] border-r border-[#161B33] flex flex-col justify-between p-4 z-30 hidden lg:flex">
      <div className="space-y-7">
        {/* Brand Logo Identity */}
        <div className="px-3 py-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.4)]">
            <WeatherIcon type="logo" size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">WeatherWise AI</h1>
            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Premium Intelligence</p>
          </div>
        </div>

        {/* Navigation Actions Array */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all group ${
                  isActive
                    ? 'bg-[#121833] border border-blue-500/30 text-blue-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#0E1326]'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400'} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Account Control Actions */}
      <div className="space-y-4">
        {/* Pro Banner Upgrade Node */}
        <div className="bg-[#11162E] border border-blue-500/10 p-4 rounded-xl text-center space-y-2.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pro Status</p>
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-lg transition-all shadow-[0_4px_12px_rgba(59,130,246,0.3)]">
            Upgrade to Pro
          </button>
        </div>

        <div className="space-y-1 border-t border-[#161B33] pt-3">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-gray-200 transition-all">
            <HelpCircle size={15} /> Help Center
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/10 transition-all"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
};