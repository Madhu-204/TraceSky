import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { WeatherIcon } from '../components/ui/WeatherIcon';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
  const { register, isLoading, error, clearError } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeToTerms) return;
    await register(name, email, password);
  };

  return (
    <div className="w-full min-h-screen bg-[#070A13] flex items-center justify-center p-4 sm:p-6 lg:p-8 selection:bg-blue-500/30">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 bg-[#0E1322] border border-gray-800/80 rounded-3xl overflow-hidden shadow-2xl relative">

        {/* LEFT PANEL */}
        <div className="hidden lg:flex lg:col-span-5 p-12 bg-gradient-to-b from-[#111827] via-[#0E1322] to-[#070A13] flex-col justify-between relative overflow-hidden border-r border-gray-800/40">
          <div>
            <button
              onClick={onNavigateToLogin}
              className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-all uppercase tracking-wider mb-12"
            >
              <ArrowLeft size={14} /> Back to Entry Gateway
            </button>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-blue-600 p-2 rounded-xl text-white" style={{ boxShadow: 'var(--color-shadow-strong)' }}>
                <WeatherIcon type="logo" size={22} />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">WeatherWise</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight mb-4">
              Weather Expert System.
            </h2>
            <p className="text-gray-400 text-xs leading-relaxed">
              Create your account to access weather forecasts, alerts, and rule-based expert system climate insights.
            </p>
          </div>
        </div>

        {/* RIGHT INTERACTIVE CONTAINER FORM */}
        <div className="col-span-1 lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">

            <div className="flex gap-6 border-b border-gray-800 mb-8 text-sm font-medium">
              <button type="button" onClick={onNavigateToLogin} className="text-gray-500 pb-3 hover:text-gray-300 transition-all">
                Sign In
              </button>
              <button className="text-blue-400 border-b-2 border-blue-500 pb-3 font-semibold transition-all">
                Create Account
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-medium text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#111827] border border-gray-800 focus:border-blue-500/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all placeholder:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#111827] border border-gray-800 focus:border-blue-500/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all placeholder:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#111827] border border-gray-800 focus:border-blue-500/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all placeholder:text-gray-600"
                />
              </div>



              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-0.5 rounded border-gray-800 bg-[#111827] text-blue-600 focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="terms" className="text-[11px] text-gray-400 leading-normal select-none">
                  I consent to the logging of data stream access and agree to the platform security guidelines.
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading || !agreeToTerms}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all shadow-glow text-sm mt-4 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
};