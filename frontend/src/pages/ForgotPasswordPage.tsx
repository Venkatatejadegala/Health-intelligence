import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient, { getErrorMessage } from '../services/apiClient';
import toast from 'react-hot-toast';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await apiClient.post('/api/auth/forgot-password', { email });
      setIsSent(true);
      toast.success('Reset link dispatched successfully');
    } catch (error: any) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Failed to dispatch reset link'));
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
            Account Recovery
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Enter your registration email below to receive a secure password recovery link.
          </p>
        </div>

        {!isSent ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold text-slate-350 uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="athlete@example.com"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className={`w-full py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg
                ${email && !isLoading
                  ? 'bg-gradient-to-r from-lime-400 to-emerald-500 hover:from-lime-300 hover:to-emerald-400 text-slate-950 shadow-emerald-500/10'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Dispatch Reset Link
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
              <h2 className="text-lg font-bold text-white">Reset Link Dispatched</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                If the email <span className="text-slate-200 font-semibold">{email}</span> exists in our database, you will receive a password reset link shortly.
              </p>
            </div>
          </div>
        )}

        {/* Back Link */}
        <button
          onClick={() => navigate('/login')}
          className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors pt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
