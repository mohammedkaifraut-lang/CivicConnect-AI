import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { X, Award, Check, CreditCard, Upload, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentPlanModal: React.FC<PaymentPlanModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile } = useAuth();
  const { language } = useLanguage();

  const [selectedPlan, setSelectedPlan] = useState<'Civic Citizen Pro' | 'Priority Resolution Pass' | 'Ward Sponsor Patron'>('Civic Citizen Pro');
  const [upiId, setUpiId] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [screenshotUrl, setScreenshotUrl] = useState('https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const getAmount = () => {
    if (selectedPlan === 'Priority Resolution Pass') return 199;
    if (selectedPlan === 'Ward Sponsor Patron') return 999;
    return 499;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/payments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.uid || 'citizen-anon',
          userEmail: email.trim(),
          paymentPlan: selectedPlan,
          amount: getAmount(),
          upiTransactionId: upiId.trim(),
          paymentScreenshotUrl: screenshotUrl
        })
      });

      const data = await res.json();
      if (data.success) {
        confetti({ particleCount: 60, spread: 70 });
        setStatusMessage('Payment details submitted! The owner will review and activate your plan.');
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setStatusMessage(data.error || 'Failed to submit payment.');
      }
    } catch (err: any) {
      console.error('Payment submit error:', err);
      setStatusMessage('Submission error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl space-y-4">
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
              <Award size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base">CivicConnect Premium Upgrade</h3>
              <p className="text-xs text-amber-100">
                Unlock 50 certificate downloads, priority AI processing & ward alerts
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-amber-100 hover:text-white rounded-lg cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              statusMessage.includes('submitted') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <Sparkles size={14} className="shrink-0 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Plan Selector */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { title: 'Priority Resolution Pass' as const, price: '₹199', desc: '1 Month Fast-Track' },
              { title: 'Civic Citizen Pro' as const, price: '₹499', desc: '1 Year Citizen Pass', popular: true },
              { title: 'Ward Sponsor Patron' as const, price: '₹999', desc: 'Annual Civic Sponsor' }
            ].map((plan) => (
              <div
                key={plan.title}
                onClick={() => setSelectedPlan(plan.title)}
                className={`p-3 rounded-xl border-2 cursor-pointer text-center transition-all ${
                  selectedPlan === plan.title
                    ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {plan.popular && (
                  <span className="text-[9px] uppercase font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full inline-block mb-1">
                    Popular
                  </span>
                )}
                <div className="font-bold text-xs text-slate-900">{plan.title}</div>
                <div className="text-base font-black text-amber-600 mt-0.5">{plan.price}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{plan.desc}</div>
              </div>
            ))}
          </div>

          {/* UPI Payment Instructions */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <span className="font-bold text-slate-800 text-[11px] uppercase block">
              1. Transfer via any UPI App (GPay / PhonePe / Paytm / BHIM)
            </span>
            <div className="flex justify-between font-mono bg-white p-2 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-600">UPI ID:</span>
              <span className="font-bold text-blue-700">civicconnect.pcmc@sbi</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Amount to transfer: <strong className="text-slate-900 font-mono">₹{getAmount()}</strong>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Your Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@gmail.com"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              UPI Transaction Reference ID (UTR / Txn ID)
            </label>
            <input
              type="text"
              required
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. UPI/482019482104/AXIS or 12-digit Ref No"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Submitting Verification...</span>
              ) : (
                <>
                  <CreditCard size={14} />
                  <span>Submit Payment for Approval</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
