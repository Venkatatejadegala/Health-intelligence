import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient, { getErrorMessage } from '../services/apiClient';
import toast from 'react-hot-toast';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post(`/api/auth/reset-password/${token}`, { password });
      setIsSuccess(true);
      toast.success('Password updated successfully');
    } catch (error: any) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Invalid or expired password reset link'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans select-none relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#ccff00]/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8 z-10"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-lime-400 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto shadow-md">
            🏥
          </div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-450 tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Enter a strong new password to regain access to your account.
          </p>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* New Password */}
              <div className="space-y-2">
                <label htmlFor="pass" className="text-xs font-bold text-slate-350 uppercase tracking-wider block">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                  <input
                    id="pass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-medium"
                  />
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPass" className="text-xs font-bold text-slate-350 uppercase tracking-wider block">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                  <input
                    id="confirmPass"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Verify new password"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className={`w-full py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg
                ${password && confirmPassword && !isLoading
                  ? 'bg-gradient-to-r from-lime-400 to-emerald-500 hover:from-lime-300 hover:to-emerald-400 text-slate-950 shadow-emerald-500/10'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Update Password
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center py-4 space-y-6">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 text-3xl animate-bounce">
              ✓
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">Password Updated</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your credentials have been securely updated. You can now use your new password to access your profile.
              </p>
            </div>
            
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 bg-slate-850 hover:bg-slate-800 text-white font-extrabold text-sm rounded-xl transition-all border border-slate-800"
            >
              Sign In Now
            </button>
          </div>
        )}

        {!isSuccess && (
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors pt-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel & Sign In
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
