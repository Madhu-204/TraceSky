import React from 'react';
import { Search, Bell, Clock, LogOut, LayoutDashboard, CloudSun, ShieldAlert, Bot, BarChart3, Settings, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { WeatherIcon } from '../../components/ui/WeatherIcon';
import { LocationPicker } from '../../components/ui/LocationPicker';

interface HeaderProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab = 'dashboard', setActiveTab }) => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'forecast', label: 'Forecast', icon: CloudSun },
    { id: 'risk', label: 'Risk', icon: ShieldAlert },
    { id: 'assistant', label: 'Assistant', icon: Bot },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tabId: string) => {
    if (setActiveTab) {
      setActiveTab(tabId);
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#070A14]/90 backdrop-blur-md border-b border-[#161B33] flex items-center justify-between px-4 z-30">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-300"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="flex items-center gap-2">
          <WeatherIcon type="logo" size={18} className="text-blue-400" />
          <span className="text-sm font-bold text-white">WeatherWise</span>
        </div>

        <Bell size={18} className="text-gray-400" />
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-14 left-0 right-0 bg-[#0A0D1A] border-b border-[#161B33] z-25">
          <nav className="flex overflow-x-auto py-2 px-2 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-[#1C2345]'
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-0 right-0 left-0 lg:left-64 h-16 bg-[#070A14]/80 backdrop-blur-md border-b border-[#161B33] items-center justify-between px-4 sm:px-8 z-20">
        {/* Location Picker */}
        <div className="w-full max-w-md">
          <LocationPicker />
        </div>

        {/* Control Actions & Identity Target */}
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-white bg-[#0E1326] border border-[#1C2340] rounded-lg relative">
            <Bell size={14} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white bg-[#0E1326] border border-[#1C2340] rounded-lg">
            <Clock size={14} />
          </button>

          <div className="w-[1px] h-6 bg-[#161B33]" />

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-blue-500/40 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Avatar User" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs font-bold text-white hidden sm:inline-block">
              {user?.name || 'User'}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                logout();
              }}
              className="p-2 text-gray-400 hover:text-rose-400 bg-[#0E1326] border border-[#1C2340] hover:border-rose-500/30 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
};