import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { WeatherIcon } from '../components/ui/WeatherIcon';
import { Toast } from '../components/ui/Toast';

interface ResetPasswordPageProps {
  initialToken?: string;
  onNavigateToLogin: () => void;
  onNavigateToForgotPassword: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ initialToken, onNavigateToLogin, onNavigateToForgotPassword }) => {
  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  const [token, setToken] = useState(initialToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!token) {
      setValidationError('Reset token is required');
      return;
    }

    if (newPassword.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    try {
      await resetPassword(token, newPassword);
      setToastMessage('Password reset successful! Redirecting to sign in...');
      setToastVisible(true);
      setTimeout(() => onNavigateToLogin(), 2500);
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
              onClick={onNavigateToForgotPassword}
              className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-all uppercase tracking-wider mb-12"
            >
              <ArrowLeft size={14} /> Back to Reset Request
            </button>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-blue-600 p-2 rounded-xl text-white" style={{ boxShadow: 'var(--color-shadow-strong)' }}>
                <WeatherIcon type="logo" size={22} />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">WeatherWise AI</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight mb-4">
              Set New Account Credentials.
            </h2>
            <p className="text-gray-400 text-xs leading-relaxed">
              Enter the reset token received from your email and create a new password. Ensure your new password meets the security requirements.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-gray-800/60 p-4 rounded-xl">
            <p className="text-xs text-blue-400 font-bold mb-1 flex items-center gap-1"><Sparkles size={12} />Password Requirements</p>
            <p className="text-[11px] text-gray-500 leading-normal">Minimum 8 characters. For security, all active sessions will be terminated upon reset.</p>
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
              duration={2200}
            />

            <h3 className="text-2xl font-bold text-white mb-2">Reset Password</h3>
            <p className="text-sm text-gray-400 mb-8">Enter the reset token and your new password.</p>

            {(error || validationError) && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-medium text-red-400">
                {validationError || error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Reset Token</label>
                <input
                  type="text"
                  placeholder="Paste your reset token"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-[#111827] border border-gray-800 focus:border-blue-500/50 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none transition-all placeholder:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#111827] border border-gray-800 focus:border-blue-500/50 rounded-xl px-4 py-3 pr-10 text-sm text-white focus:outline-none transition-all placeholder:text-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                style={{ boxShadow: 'var(--color-shadow-btn)' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
};
