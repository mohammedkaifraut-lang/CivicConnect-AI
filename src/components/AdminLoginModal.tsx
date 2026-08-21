import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, ShieldAlert, Lock, Mail, KeyRound, AlertTriangle, Sparkles, ChevronRight } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { signInAdminWithEmail, signInAdminWithGoogle, signInAsDemoAdmin } = useAuth();
  const [email, setEmail] = useState('admin@civicconnect.gov');
  const [password, setPassword] = useState('AdminCivic#2026');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGoogleAdminAuth = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInAdminWithGoogle();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Google Admin Auth error:', err);
      setError(err.message || 'Google Administrator verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAdminAuth = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInAsDemoAdmin();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Demo Admin Auth error:', err);
      setError(err.message || 'Demo clearance failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signInAdminWithEmail(email.trim(), password);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Admin Auth error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        // Fallback directly to demo clearance so the admin is never blocked
        await handleDemoAdminAuth();
        return;
      }
      setError(err.message || 'Municipal administrator verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-800 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Restricted Access Badge Banner */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 p-6 border-b border-red-900/40 text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-mono font-semibold uppercase tracking-widest mb-3">
            <ShieldAlert size={14} className="text-red-400 animate-pulse" />
            <span>Restricted Access Portal</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Municipal Authority Console
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Department Heads, City Officials & Municipal Administrators Only
          </p>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Primary 1-Click Google Administrator Sign-in */}
          <button
            onClick={handleGoogleAdminAuth}
            disabled={isSubmitting}
            type="button"
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center gap-3 transition-colors font-semibold text-xs shadow-md"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Authenticate Official Account with Google</span>
          </button>

          {/* Quick Demo Clearance Button */}
          <button
            type="button"
            onClick={handleDemoAdminAuth}
            disabled={isSubmitting}
            className="w-full py-2 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all flex items-center justify-center gap-2"
          >
            <KeyRound size={14} />
            <span>Enter as Demo Chief Municipal Officer</span>
          </button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-slate-900 px-2 text-slate-500 font-medium">Or Municipal Key Authentication</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Official Department Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@civicconnect.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Passphrase
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound size={14} />
                  <span>Verify Municipal Credentials</span>
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-[10px] text-slate-500">
              Assigned to: Public Works, Municipal Water, Sanitation & Electrical Operations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
