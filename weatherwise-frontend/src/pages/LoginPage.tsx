import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store/authStore';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { WeatherIcon } from '../components/ui/WeatherIcon';
import { FcGoogle } from 'react-icons/fc';
import { Toast } from '../components/ui/Toast';

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister, onNavigateToForgotPassword }) => {
  const { login, googleSignIn, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      googleSignIn(tokenResponse.access_token);
    },
    flow: 'implicit'
  });

  useEffect(() => {
    clearError();
  }, []);

  useEffect(() => {
    if (error) {
      setToastMessage(error);
      setToastVisible(true);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    await login(email, password);
  };

  return (
    <div className="w-full min-h-screen bg-[#070A13] flex items-center justify-center p-4 sm:p-6 lg:p-8 selection:bg-blue-500/30">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 bg-[#0E1322] border border-gray-800/80 rounded-3xl overflow-hidden shadow-2xl relative">

        {/* LEFT BRANDING SIDEBAR PANEL - Hidden on mobile/tablets */}
        <div className="hidden lg:flex lg:col-span-5 p-12 bg-gradient-to-b from-[#111827] via-[#0E1322] to-[#070A13] flex-col justify-between relative overflow-hidden border-r border-gray-800/40">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_45%)] pointer-events-none" />

          <div>
            <div className="flex items-center gap-3 mb-16">
              <div className="bg-blue-600 p-2 rounded-xl text-white" style={{ boxShadow: 'var(--color-shadow-strong)' }}>
                <WeatherIcon type="logo" size={22} />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">WeatherWise AI</span>
            </div>

            <h2 className="text-4xl font-extrabold tracking-tight text-white leading-[1.15] mb-6">
              WeatherWise <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">AI Dashboard.</span>
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Access weather forecasts, alerts, and AI-powered climate insights for your needs.
            </p>
          </div>

          <div className="space-y-6">
            <div className="border-t border-gray-800/80 pt-6">
              <p className="text-[10px] font-bold text-blue-500 tracking-widest uppercase mb-1">Operational Standard</p>
              <p className="text-xs text-gray-400">Explainable AI (XAI) mapping logs run actively on every telemetry projection stream.</p>
            </div>
            <p className="text-[11px] text-gray-500">© 2026 WeatherWise Labs Inc. All nodes active.</p>
          </div>
        </div>

        {/* RIGHT INTERACTIVE INTERFACE BOX */}
        <div className="col-span-1 lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">

            {/* Header Switching Tabs */}
            <div className="flex gap-6 border-b border-gray-800 mb-8 text-sm font-medium">
              <button className="text-blue-400 border-b-2 border-blue-500 pb-3 font-semibold transition-all">
                Sign In
              </button>
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="text-gray-500 pb-3 hover:text-gray-300 transition-all"
              >
                Create Account
              </button>
            </div>

            <Toast
              message={toastMessage}
              type="error"
              visible={toastVisible}
              onClose={() => setToastVisible(false)}
            />

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-medium text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Entry Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#111827] border border-gray-800 focus:border-blue-500/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all placeholder:text-gray-600"
                />
              </div>

              {/* Password Entry Input */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                  <button
                    type="button"
                    onClick={onNavigateToForgotPassword}
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-all uppercase tracking-wider"
                  >Forgot Password?</button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#111827] border border-gray-800 focus:border-blue-500/50 rounded-xl px-4 py-3 pr-10 text-sm text-white focus:outline-none transition-all placeholder:text-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>



              {/* Form Submission Core Button trigger */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all text-sm mt-3 flex items-center justify-center gap-2"
                style={{ boxShadow: 'var(--color-shadow-btn)' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-[#0E1322] text-gray-500 font-medium">or continue with</span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleGoogleLogin()}
                className="w-full bg-[#1C2345] hover:bg-[#252d4a] disabled:bg-[#1C2345] disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-3 border border-gray-700"
              >
                <FcGoogle size={20} />
                Sign in with Google
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
};