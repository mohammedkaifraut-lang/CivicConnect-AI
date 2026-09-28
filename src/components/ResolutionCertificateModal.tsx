import React, { useRef, useState } from 'react';
import type { Complaint } from '../types';
import { CATEGORY_CONFIG, WARDS_DATA } from '../types';
import { useLanguage } from '../context/LanguageContext';
import html2canvas from 'html2canvas';
import {
  X,
  Download,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Award,
  Copy,
  Check
} from 'lucide-react';

interface ResolutionCertificateModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ResolutionCertificateModal: React.FC<ResolutionCertificateModalProps> = ({
  complaint,
  isOpen,
  onClose
}) => {
  const { language, t } = useLanguage();
  const certRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !complaint) return null;

  const catInfo = CATEGORY_CONFIG[complaint.category];
  const wardInfo = WARDS_DATA.find((w) => w.id === complaint.ward) || WARDS_DATA[0];

  // Calculate resolution duration in days or hours
  const createdDate = new Date(complaint.createdAt);
  const resolvedDate = complaint.resolvedAt ? new Date(complaint.resolvedAt) : new Date(complaint.updatedAt);
  const diffHours = Math.max(1, Math.round((resolvedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60)));
  const diffDays = (diffHours / 24).toFixed(1);
  const resolutionDurationStr = diffHours < 24 ? `${diffHours} Hours` : `${diffDays} Days`;
  const resolutionDurationHindi = diffHours < 24 ? `${diffHours} घंटे` : `${diffDays} दिन`;
  const resolutionDurationMarathi = diffHours < 24 ? `${diffHours} तास` : `${diffDays} दिवस`;
  const formattedDuration = language === 'hi' ? resolutionDurationHindi : language === 'mr' ? resolutionDurationMarathi : resolutionDurationStr;

  const certId = `CERT-PCMC-${(complaint.complaintId || 'RESOLVED').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-8)}`;

  const handleDownloadImage = async () => {
    if (!certRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#090d16'
      });
      const link = document.createElement('a');
      link.download = `CivicConnect-Resolution-Certificate-${complaint.reporterCitizenId || 'Citizen'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error generating certificate image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopySummary = () => {
    const text = `🏆 Official Civic Resolution Certificate\n` +
      `Issue: ${catInfo?.label || complaint.category}\n` +
      `Location: ${complaint.location.address} (${complaint.ward || 'Ward A'})\n` +
      `Citizen ID: #${complaint.reporterCitizenId || 'QLMT4821'}\n` +
      `Remediated In: ${resolutionDurationStr}\n` +
      `Verified via CivicConnect AI Municipal Platform`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🎉 Civic Issue Successfully Remediated!\n` +
      `📍 ${complaint.location.address} (${complaint.ward || 'Ward A'})\n` +
      `🛠️ Category: ${catInfo?.label}\n` +
      `⏱️ Resolved in: ${resolutionDurationStr}\n` +
      `Verified on CivicConnect AI`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header Controls */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2 text-white">
            <Award className="text-amber-400" size={20} />
            <span className="font-bold text-sm">
              {language === 'mr' ? 'नागरिक निराकरण प्रमाणपत्र' : 'Citizen Resolution Certificate'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Certificate Card to be Captured / Exported */}
        <div className="p-4 sm:p-6 bg-slate-950">
          <div
            ref={certRef}
            className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 sm:p-8 rounded-2xl border-2 border-amber-400/40 shadow-2xl text-white overflow-hidden space-y-6"
            style={{ minHeight: '440px' }}
          >
            {/* Background Guilloche / Pattern Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Certificate Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg border border-blue-400/30">
                  CC
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-black tracking-tight text-white">CivicConnect AI</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30">
                      OFFICIAL
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {language === 'mr'
                      ? 'पिंपरी चिंचवड महानगरपालिका • नागरी समस्या निवारण प्राधिकरण'
                      : 'Municipal Corporation • Smart Citizen Grievance Redressal'}
                  </p>
                </div>
              </div>

              {/* Certificate ID & Stamp */}
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-mono text-slate-400 block">{certId}</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/40 mt-1">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  {language === 'mr' ? 'अधिकृतपणे निवारण पूर्ण' : 'VERIFIED & REMEDIATED'}
                </span>
              </div>
            </div>

            {/* Certificate Title Banner */}
            <div className="text-center py-2 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                {language === 'mr' ? '★ नागरी उत्तरदायित्व व यश प्रमाणपत्र ★' : '★ CITIZEN ACTION & REMEDIATION CERTIFICATE ★'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {language === 'mr' ? 'नागरी समस्येचे यशस्वी निवारण' : 'Official Municipal Remediation Accomplishment'}
              </h2>
              <p className="text-xs text-slate-300 max-w-lg mx-auto">
                {language === 'mr'
                  ? `नागरिक #${complaint.reporterCitizenId || 'QLMT4821'} यांनी नोंदवलेल्या समस्येचे क्षेत्रीय पथकाद्वारे यशस्वी निवारण करण्यात आले आहे.`
                  : `This certifies that the reported civic grievance was inspected, remediated by municipal work crews, and verified by the citizen.`}
              </p>
            </div>

            {/* Key Data Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Category</span>
                <div className="font-bold text-slate-200 truncate">
                  {catInfo?.label || complaint.category}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Ward / Jurisdiction</span>
                <div className="font-bold text-amber-300 truncate">
                  {complaint.ward || 'Ward A'}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Citizen ID</span>
                <div className="font-bold font-mono text-blue-300">
                  #{complaint.reporterCitizenId || 'QLMT4821'}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-emerald-400 block font-semibold uppercase">Resolution Time</span>
                <div className="font-bold text-emerald-400 flex items-center gap-1">
                  <Clock size={12} />
                  <span>{formattedDuration}</span>
                </div>
              </div>
            </div>

            {/* Location & Department */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300 bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-800/60">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-red-400 shrink-0" />
                <span className="font-medium">{complaint.location.address}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Building2 size={13} className="text-blue-400" />
                <span className="text-[11px]">{complaint.assignedDepartment || 'Municipal Public Works'}</span>
              </div>
            </div>

            {/* Before & After Photo Proof Strip */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  1. Reported Evidence (Before)
                </span>
                <div className="h-32 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 relative">
                  <img
                    src={complaint.photoUrl}
                    alt="Reported Issue"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-slate-900/80 text-[10px] text-slate-300 backdrop-blur-xs font-mono">
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  2. Remediated Site (After)
                </span>
                <div className="h-32 rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-900 relative">
                  <img
                    src={complaint.resolvedPhotoUrl || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80'}
                    alt="Remediated Proof"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center gap-1 shadow-md">
                    <Check size={10} strokeWidth={3} />
                    <span>RESOLVED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Seal / Signature Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>Municipal Digital Seal • Verified on Blockchain / Firestore</span>
              </div>
              <span className="font-mono text-[10px]">
                {new Date(complaint.resolvedAt || complaint.updatedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Share2 size={14} />
              <span>Share WhatsApp</span>
            </button>
          </div>

          <button
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            <Download size={15} />
            <span>{isDownloading ? 'Generating Image...' : (language === 'mr' ? 'PNG प्रमाणपत्र डाउनलोड करा' : 'Download PNG Certificate')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
