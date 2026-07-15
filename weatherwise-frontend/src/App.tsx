import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from './store/authStore';
import { useSettingsStore } from './store/settingsStore';
import { useLocationStore } from './store/locationStore';
import { useAuthorization } from './hooks/useAuthorization';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
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
  const isLoading = useAuthStore((state) => state.isLoading);
  const initAuth = useAuthStore((state) => state.initAuth);
  const logout = useAuthStore((state) => state.logout);
  const { getAccessibleTabs } = useAuthorization();
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>('login');
  const [resetToken, setResetToken] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Check for reset_token in URL params (from email link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token');
    if (token) {
      setResetToken(token);
      setAuthView('reset-password');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Apply saved theme accent on mount
  useEffect(() => {
    const theme = useSettingsStore.getState().config.themeAccent;
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  // Initialize auth on app load - check session via cookie
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Sync defaultLocation to currentLocation on app load (after rehydration)
  useEffect(() => {
    useLocationStore.getState().syncDefaultToCurrent();
  }, []);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    switch (authView) {
      case 'register':
        return <RegisterPage onNavigateToLogin={() => setAuthView('login')} />;
      case 'forgot-password':
        return (
          <ForgotPasswordPage
            onNavigateToLogin={() => setAuthView('login')}
          />
        );
      case 'reset-password':
        return (
          <ResetPasswordPage
            initialToken={resetToken}
            onNavigateToLogin={() => setAuthView('login')}
            onNavigateToForgotPassword={() => setAuthView('forgot-password')}
          />
        );
      default:
        return <LoginPage onNavigateToRegister={() => setAuthView('register')} onNavigateToForgotPassword={() => setAuthView('forgot-password')} />;
    }
  }

  const safeTabs = getAccessibleTabs();
  const safeActiveTab = safeTabs.includes(activeTab) ? activeTab : 'dashboard';

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 selection:bg-blue-500/30 antialiased">
      <Sidebar activeTab={safeActiveTab} setActiveTab={setActiveTab} onLogout={logout} />
      <div className="flex flex-col flex-1">
        <Header activeTab={safeActiveTab} setActiveTab={setActiveTab} />
        <main className="flex-1 pt-14 lg:pt-0">
          {safeActiveTab === 'dashboard' && <DashboardPage onNavigateToForecast={() => setActiveTab('forecast')} onNavigateToAssistant={() => setActiveTab('assistant')} />}
          {safeActiveTab === 'forecast' && <ForecastPage />}
          {safeActiveTab === 'assistant' && <AiAssistantPage />}
          {safeActiveTab === 'risk' && <RiskMonitorPage />}
          {safeActiveTab === 'analytics' && <AnalyticsPage />}
          {safeActiveTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}