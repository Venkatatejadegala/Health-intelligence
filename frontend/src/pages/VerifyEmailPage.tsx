import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, Loader } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient, { getErrorMessage } from '../services/apiClient';

const VerifyEmailPage: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmailToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Missing verification token.');
        return;
      }

      try {
        const response = await apiClient.get(`/api/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(response.data?.message || 'Your email has been verified successfully!');
        
        // Update stored user verification status if they are logged in
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            parsed.isEmailVerified = true;
            localStorage.setItem('user', JSON.stringify(parsed));
          } catch (e) {
            console.error('Failed to update local verified status', e);
          }
        }
      } catch (error: any) {
        console.error(error);
        setStatus('error');
        setMessage(getErrorMessage(error, 'Invalid or expired email verification token.'));
      }
    };

    verifyEmailToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans select-none relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#ccff00]/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8 z-10 text-center"
      >
        {/* Header Logo */}
        <div className="w-12 h-12 bg-gradient-to-tr from-lime-400 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto shadow-md">
          🏥
        </div>

        {/* Dynamic Status Render */}
        <div className="space-y-6">
          {status === 'loading' && (
            <div className="space-y-4 py-8">
              <Loader className="w-12 h-12 text-emerald-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-350">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4 py-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-white">Email Verified!</h1>
                <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full mt-6 py-3.5 bg-gradient-to-r from-lime-400 to-emerald-500 hover:from-lime-300 hover:to-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4 py-4">
              <XCircle className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-white">Verification Failed</h1>
                <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full mt-6 py-3.5 bg-slate-850 hover:bg-slate-800 text-white font-extrabold text-sm rounded-xl transition-all border border-slate-800"
              >
                Return to Login
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
