import React, { useState } from 'react';
import { Shield, Lock, Eye, Bell, Activity, Trash2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient, { getErrorMessage } from '../services/apiClient';

const SettingsPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [autoOverload, setAutoOverload] = useState(true);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete Account state
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiClient.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Failed to update password.'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (confirmDeleteText !== 'DELETE') {
      toast.error("Please type 'DELETE' to confirm deletion.");
      return;
    }

    if (!deletePassword) {
      toast.error('Password is required for account purging.');
      return;
    }

    const consent = window.confirm('Are you absolutely sure you want to permanently delete your account? This action is irreversible.');
    if (!consent) return;

    setIsDeletingAccount(true);
    try {
      await apiClient.delete('/api/profile', {
        data: { password: deletePassword }
      });
      toast.success('Your profile and all data have been purged successfully.');
      logout();
      navigate('/login');
    } catch (error: any) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Account deletion aborted. Ensure your password is correct.'));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-4 md:p-8 font-sans space-y-8">
      {/* Header */}
      <div className="border-b border-slate-900 pb-6">
        <h1 className="text-3xl font-black text-white bg-gradient-to-r from-white via-slate-100 to-[#ccff00] bg-clip-text text-transparent">Settings</h1>
        <p className="text-slate-400 font-medium mt-1">Configure your athlete terminal settings, security details, and account telemetry.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Options panel */}
        <div className="lg:col-span-2 space-y-8">

          {/* Change Password Card */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-xl border border-slate-850 p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4">
              <Lock className="h-6 w-6 text-emerald-400" />
              <div>
                <h2 className="text-xl font-black text-white">Credential Management</h2>
                <p className="text-xs text-slate-400">Regularly update your password to maintain profile privacy</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Min 8 characters"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    placeholder="Verify new password"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmNewPassword}
                className={`py-3 px-6 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-md
                  ${currentPassword && newPassword && confirmNewPassword && !isChangingPassword
                    ? 'bg-gradient-to-r from-lime-400 to-emerald-500 hover:from-lime-300 hover:to-emerald-400 text-slate-950'
                    : 'bg-slate-850 text-slate-500 cursor-not-allowed'
                  }`}
              >
                {isChangingPassword ? 'Updating credentials...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Core App Behaviors */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-xl border border-slate-850 p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4">
              <Activity className="h-6 w-6 text-[#00f0ff]" />
              <div>
                <h2 className="text-xl font-black text-white">Workout & Overload Rules</h2>
                <p className="text-xs text-slate-400">Configure parameters for automatic progressive scaling algorithms</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-850/60 rounded-2xl">
                <div>
                  <h3 className="text-xs font-bold text-white">Auto-Scale Compound Weights</h3>
                  <p className="text-[10px] text-slate-450 mt-1">If all workout sets are completed, suggest +2.5kg or +5% next week.</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoOverload}
                  onChange={(e) => setAutoOverload(e.target.checked)}
                  className="w-10 h-5 bg-slate-900 rounded-full appearance-none cursor-pointer border border-slate-850 checked:bg-[#ccff00] relative checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-3.5 after:h-3.5 after:rounded-full after:transition-all"
                />
              </div>
            </div>
          </div>

          {/* Delete Account Card */}
          <div className="bg-red-950/10 backdrop-blur-md rounded-3xl shadow-xl border border-red-900/30 p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-red-900/20 pb-4">
              <ShieldAlert className="h-6 w-6 text-red-500" />
              <div>
                <h2 className="text-xl font-black text-red-400">Hazard Zone</h2>
                <p className="text-xs text-red-500/70">Irreversible terminal profile commands</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Deleting your account will purge all user profiles, daily metrics logs, workouts, history, coaching insights, and active authorization sessions. <strong>This action is permanent and cannot be undone.</strong>
              </p>

              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-red-450 uppercase tracking-wider block">Confirm Password</label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      required
                      placeholder="Verify password to confirm"
                      className="w-full bg-slate-950 border border-red-950/40 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-red-450 uppercase tracking-wider block">Type "DELETE"</label>
                    <input
                      type="text"
                      value={confirmDeleteText}
                      onChange={(e) => setConfirmDeleteText(e.target.value)}
                      required
                      placeholder="Type DELETE in capitals"
                      className="w-full bg-slate-950 border border-red-950/40 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isDeletingAccount || !deletePassword || confirmDeleteText !== 'DELETE'}
                  className={`py-3 px-6 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2
                    ${deletePassword && confirmDeleteText === 'DELETE' && !isDeletingAccount
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-slate-850 text-slate-500 cursor-not-allowed'
                    }`}
                >
                  {isDeletingAccount ? (
                    'Wiping profile records...'
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Account Permanently
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Right Info sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-xl border border-slate-850 p-6 space-y-4">
            <h3 className="text-lg font-black text-white font-sans">Active Setup</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Workspace configurations are persistent on this local terminal. Telemetry and Progressive Overload suggestions rely on the integrity of your stored metrics history.
            </p>

            <div className="border-t border-slate-850 pt-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Theme:</span>
                <span className="font-extrabold text-[#00f0ff] uppercase tracking-wide">Dark Cyberpunk</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Build Status:</span>
                <span className="font-extrabold text-[#ccff00] uppercase tracking-wide">Release Candidate (RC-1)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Database Engine:</span>
                <span className="font-extrabold text-slate-200">MongoDB / Mongoose</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
