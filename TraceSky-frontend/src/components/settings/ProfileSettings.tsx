import React, { useState } from 'react';
import { User, Mail, Key, Check, X, Lock, Eye, EyeOff, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const ProfileSettings: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changing, setChanging] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-12 text-gray-500 text-xs font-mono">
        No user data available. Please log in.
      </div>
    );
  }

  const isGoogleUser = user.auth_provider === 'google';

  const startEditing = () => {
    setNameDraft(user.name);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setNameDraft(user.name);
  };

  const saveName = async () => {
    if (!nameDraft.trim() || nameDraft.trim() === user.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: nameDraft.trim() });
      setEditing(false);
    } catch {
      // error handled by store
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (oldPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setChanging(true);
    try {
      await changePassword(oldPassword, newPassword);
      setPasswordSuccess('Password changed successfully. Please sign in again.');
      setTimeout(() => {
        setShowPasswordModal(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess('');
      }, 2000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold text-white tracking-wide">Profile & Account</h4>
        <p className="text-xs text-gray-500 mt-0.5">Manage your personal information and subscription.</p>
      </div>

      <div className="space-y-4">
        <div className="bg-[#090D1F] border border-[#161B35] rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <User size={20} className="text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      autoFocus
                      className="bg-[#070A14] border border-[#1C2340] text-sm font-bold text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 w-full max-w-xs"
                    />
                    <button onClick={saveName} disabled={saving} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    </button>
                    <button onClick={cancelEditing} className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-500/10 rounded-lg transition-all">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{user.name}</p>
                    <button onClick={startEditing} className="text-[9px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider">
                      Edit
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-gray-500 font-mono">{user.email}</p>
              </div>
            </div>
            {isGoogleUser && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-lg shrink-0">
                Google
              </span>
            )}
          </div>

          <div className="h-px bg-[#161B35]" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 bg-[#070A14] rounded-lg p-3 border border-[#1C2340]">
              <Mail size={14} className="text-gray-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Email</p>
                <p className="text-xs text-white font-mono truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[#070A14] rounded-lg p-3 border border-[#1C2340]">
              <Key size={14} className="text-gray-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">User ID</p>
                <p className="text-[10px] text-gray-400 font-mono">{user.id}</p>
              </div>
            </div>
          </div>
        </div>

        {isGoogleUser ? (
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
              <span className="text-cyan-400 text-xs font-bold">G</span>
            </div>
            <div>
              <p className="text-xs font-bold text-cyan-300">Connected with Google</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                You signed in using Google. Manage your account security and password via{' '}
                <a href="https://myaccount.google.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">
                  Google Account Settings
                </a>.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-[#090D1F] border border-[#161B35] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-gray-200 block">Change Password</label>
                <span className="text-[11px] text-gray-500 font-medium">Update your account password.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold border border-[#1C2345] hover:border-blue-500/30 bg-[#070A14] text-gray-400 hover:text-white rounded-xl transition-all"
              >
                <Key size={12} /> Change
              </button>
            </div>
          </div>
        )}

      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-blue-400" />
                <h4 className="text-sm font-bold text-white">Change Password</h4>
              </div>
              <button onClick={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordSuccess(''); }} className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
                <X size={16} />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
                <Check size={24} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-emerald-300 font-bold">{passwordSuccess}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Current Password</label>
                  <div className="relative">
                    <input
                      type={showOld ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      className="w-full bg-[#070A14] border border-[#1C2340] text-xs text-white rounded-xl px-3 py-2.5 pr-9 focus:outline-none focus:border-blue-500 placeholder:text-gray-600"
                      placeholder="Enter current password"
                    />
                    <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showOld ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full bg-[#070A14] border border-[#1C2340] text-xs text-white rounded-xl px-3 py-2.5 pr-9 focus:outline-none focus:border-blue-500 placeholder:text-gray-600"
                      placeholder="At least 8 characters"
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-[#070A14] border border-[#1C2340] text-xs text-white rounded-xl px-3 py-2.5 pr-9 focus:outline-none focus:border-blue-500 placeholder:text-gray-600"
                      placeholder="Re-enter new password"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {passwordError && (
                  <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                    <AlertTriangle size={12} className="text-red-400 shrink-0" />
                    <span className="text-[10px] text-red-300">{passwordError}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={changing || !oldPassword || !newPassword || !confirmPassword}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white text-xs font-bold rounded-xl transition-all flex-1 justify-center"
                  >
                    {changing ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                    {changing ? 'Changing...' : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowPasswordModal(false); setPasswordError(''); }}
                    className="px-4 py-2.5 text-[10px] font-bold border border-[#1C2345] text-gray-400 hover:text-white rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
