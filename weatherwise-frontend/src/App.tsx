import { useState } from 'react';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { Sidebar } from './components/dashboard/Sidebar';
import { Header } from './components/dashboard/Header';
import { DashboardPage } from './pages/DashboardPage';
import { ForecastPage } from './pages/ForecastPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { RiskMonitorPage } from './pages/RiskMonitorPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return authView === 'login' ? (
      <LoginPage onNavigateToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onNavigateToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 selection:bg-blue-500/30 antialiased">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} />
      <div className="flex flex-col flex-1">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 pt-14 lg:pt-0">
          {activeTab === 'dashboard' && <DashboardPage />}
          {activeTab === 'forecast' && <ForecastPage />}
          {activeTab === 'assistant' && <AiAssistantPage />}
          {activeTab === 'risk' && <RiskMonitorPage />}
          {activeTab === 'analytics' && <AnalyticsPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}