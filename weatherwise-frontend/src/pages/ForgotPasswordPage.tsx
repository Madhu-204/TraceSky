import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { WeatherIcon } from '../components/ui/WeatherIcon';
import { Toast } from '../components/ui/Toast';

interface ForgotPasswordPageProps {
  onNavigateToLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigateToLogin }) => {
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      await forgotPassword(email);
      setToastMessage(`Reset link sent to ${email}`);
      setToastVisible(true);
    } catch {
      // Error is set in the store
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#070A13] flex items-center justify-center p-4 sm:p-6 lg:p-8 selection:bg-blue-500/30">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 bg-[#0E1322] border border-gray-800/80 rounded-3xl overflow-hidden shadow-2xl relative">

        {/* LEFT BRANDING SIDEBAR PANEL */}
        <div className="hidden lg:flex lg:col-span-5 p-12 bg-gradient-to-b from-[#111827] via-[#0E1322] to-[#070A13] flex-col justify-between relative overflow-hidden border-r border-gray-800/40">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_45%)] pointer-events-none" />

          <div>
            <button
              onClick={onNavigateToLogin}
              className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-all uppercase tracking-wider mb-12"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                <WeatherIcon type="logo" size={22} />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">WeatherWise AI</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight mb-4">
              Reset Your Account Access Credentials.
            </h2>
            <p className="text-gray-400 text-xs leading-relaxed">
              Enter the email associated with your telemetry profile. A secure reset link will be sent to your inbox.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-gray-800/60 p-4 rounded-xl">
            <p className="text-xs text-blue-400 font-bold mb-1 flex items-center gap-1"><Sparkles size={12} />Security Notice</p>
            <p className="text-[11px] text-gray-500 leading-normal">Reset links expire after 15 minutes. If you did not request a reset, you can safely ignore the email.</p>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="col-span-1 lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">

            <Toast
              message={toastMessage}
              type="success"
              visible={toastVisible}
              onClose={() => setToastVisible(false)}
            />

            <h3 className="text-2xl font-bold text-white mb-2">Forgot Password</h3>
            <p className="text-sm text-gray-400 mb-8">Enter your email to receive a password reset link.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-medium text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-[0_4px_15px_rgba(59,130,246,0.3)] text-sm flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
};
