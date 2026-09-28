import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, AlertTriangle, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';

interface OwnerLoginProps {
  onSuccess: () => void;
  onBackToFeed: () => void;
}

export const OwnerLogin: React.FC<OwnerLoginProps> = ({ onSuccess, onBackToFeed }) => {
  const { signInOwner, isOwner, userProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signInOwner(email, password);
      onSuccess();
    } catch (err: any) {
      console.error('Owner Login failed:', err);
      // Strictly follow prompt requirements:
      // If authentication fails: "Invalid owner credentials."
      // If user is authenticated but not owner: "Access denied."
      if (err.message === 'Access denied.') {
        setError('Access denied.');
      } else {
        setError('Invalid owner credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="max-w-md w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 overflow-hidden relative">
        
        {/* Top Header Badge */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 p-6 sm:p-8 border-b border-red-900/40 text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-red-900/30 border border-red-500/30">
            <Shield size={28} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-mono font-semibold uppercase tracking-widest mb-2">
            <KeyRound size={13} className="text-red-400 animate-pulse" />
            <span>Executive Clearance Required</span>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight">
            Owner Login
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Sign in to access the CivicConnect AI Executive Management Console
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2 animate-shake">
              <AlertTriangle size={16} className="shrink-0 text-red-400" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="Enter owner email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Enter owner password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-red-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying clearance...</span>
                </div>
              ) : (
                <>
                  <span>Login to Owner Dashboard</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Bottom helper */}
          <div className="pt-4 border-t border-slate-800 text-center">
            <button
              onClick={onBackToFeed}
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 mx-auto font-medium"
            >
              <ArrowLeft size={13} />
              <span>Return to Citizen Portal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
