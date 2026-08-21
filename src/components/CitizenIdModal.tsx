import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ShieldCheck, Copy, Check, Sparkles, ArrowRight, User } from 'lucide-react';
import { useState } from 'react';

interface CitizenIdModalProps {
  citizenId: string;
  userName: string;
  onClose: () => void;
}

export const CitizenIdModal: React.FC<CitizenIdModalProps> = ({
  citizenId,
  userName,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(citizenId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 transform transition-all">
        {/* Header gradient banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white text-center relative">
          <div className="inline-flex p-3 bg-white/20 rounded-full mb-3 backdrop-blur-md">
            <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold">Welcome to CivicConnect!</h3>
          <p className="text-blue-100 text-sm mt-1">
            Your official Citizen Identity has been registered.
          </p>
        </div>

        {/* Citizen ID Card */}
        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-xl p-5 text-white shadow-lg border border-slate-700 relative overflow-hidden">
            {/* Background watermark */}
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 text-white pointer-events-none">
              <ShieldCheck size={140} />
            </div>

            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                  CC
                </div>
                <span className="text-xs tracking-wider uppercase text-blue-300 font-semibold">
                  Official Citizen Credential
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active
              </span>
            </div>

            <div className="space-y-1 mb-4">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Citizen Name</span>
              <p className="font-semibold text-lg text-white flex items-center gap-2">
                <User size={16} className="text-blue-400" />
                {userName || 'Verified Citizen'}
              </p>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                Unique Citizen ID
              </span>
              <div className="flex items-center justify-between bg-slate-950/60 rounded-lg p-2.5 border border-slate-700/80">
                <span className="font-mono text-2xl font-black text-amber-400 tracking-widest">
                  {citizenId}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
                  title="Copy Citizen ID"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
              <span>Civic Authority Network</span>
              <span>Encrypted Firestore Identity</span>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200/80 text-amber-900 text-xs flex gap-3">
            <span className="text-base font-bold text-amber-600">💡</span>
            <div>
              <p className="font-semibold text-amber-950">Keep your Citizen ID handy</p>
              <p className="text-amber-800/90 mt-0.5">
                This unique ID connects all your civic reports, upvotes, and municipal resolution verification tracking.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <span>Proceed to Dashboard</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
