import React, { useState } from 'react';
import type { Complaint, ComplaintCategory, ComplaintStatus } from '../types';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { toggleUpvoteComplaint } from '../lib/firebase';
import { ComplaintImage } from './ComplaintImage';
import { ResolutionCertificateModal } from './ResolutionCertificateModal';
import {
  Sparkles,
  PlusCircle,
  ThumbsUp,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Award
} from 'lucide-react';

interface PublicFeedProps {
  complaints: Complaint[];
  onOpenReportModal: () => void;
  onOpenCitizenAuth: (mode?: 'signin' | 'signup') => void;
  onSelectComplaint?: (complaint: Complaint) => void;
}

export const PublicFeed: React.FC<PublicFeedProps> = ({
  complaints,
  onOpenReportModal,
  onOpenCitizenAuth,
  onSelectComplaint
}) => {
  const { currentUser, isCitizen } = useAuth();
  const { language, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [certificateComplaint, setCertificateComplaint] = useState<Complaint | null>(null);

  const filteredComplaints = complaints.filter((c) => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = c.description?.toLowerCase().includes(q);
      const matchAddr = c.location?.address?.toLowerCase().includes(q);
      const matchId = c.reporterCitizenId?.toLowerCase().includes(q);
      const matchWard = c.ward?.toLowerCase().includes(q);
      if (!matchDesc && !matchAddr && !matchId && !matchWard) return false;
    }
    return true;
  });

  const totalResolved = complaints.filter((c) => c.status === 'resolved').length;
  const totalInFlight = complaints.length - totalResolved;

  const handleUpvote = async (complaintId: string) => {
    if (!currentUser) {
      onOpenCitizenAuth('signin');
      return;
    }
    try {
      await toggleUpvoteComplaint(complaintId, currentUser.uid);
    } catch (err) {
      console.error('Error upvoting:', err);
    }
  };

  return (
    <div className="space-y-10 pb-12 animate-fade-in">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles size={14} className="text-yellow-400 animate-pulse" />
              <span>{t('hero.badge')}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              {t('hero.title1')} <br />
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                {t('hero.title2')}
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              {t('hero.description')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => {
                  if (!currentUser) onOpenCitizenAuth('signin');
                  else onOpenReportModal();
                }}
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl hover:shadow-blue-600/30 transition-all flex items-center gap-2"
              >
                <PlusCircle size={18} />
                <span>{t('hero.reportCta')}</span>
              </button>

              {!currentUser && (
                <button
                  onClick={() => onOpenCitizenAuth('signup')}
                  className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all flex items-center gap-2"
                >
                  <ShieldCheck size={16} className="text-blue-400" />
                  <span>{t('hero.citizenIdCta')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-800/80">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">{t('hero.totalReports')}</span>
              <span className="text-3xl font-extrabold text-white mt-1 block">{complaints.length}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">{t('hero.activePipeline')}</span>
              <span className="text-3xl font-extrabold text-amber-400 mt-1 block">{totalInFlight}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">{t('hero.remediated')}</span>
              <span className="text-3xl font-extrabold text-emerald-400 mt-1 block">{totalResolved}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider block">{t('hero.aiClassification')}</span>
              <span className="text-3xl font-extrabold text-sky-400 mt-1 block">98.4%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Public Feed List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Search & Filter Header */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={t('common.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700"
            >
              <option value="all">{t('cat.all')}</option>
              {Object.keys(CATEGORY_CONFIG).map((cat) => (
                <option key={cat} value={cat}>
                  {t(`cat.${cat}`)}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700"
            >
              <option value="all">{t('status.all')}</option>
              {Object.keys(STATUS_CONFIG).map((st) => (
                <option key={st} value={st}>
                  {t(`status.${st}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Complaints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComplaints.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Layers size={36} className="mx-auto text-slate-300 mb-2" />
              <h3 className="font-bold text-slate-800">{t('common.noComplaints')}</h3>
              <p className="text-xs text-slate-500 mt-1">{t('common.adjustFilters')}</p>
            </div>
          ) : (
            filteredComplaints.map((comp) => {
              const catInfo = CATEGORY_CONFIG[comp.category];
              const statusInfo = STATUS_CONFIG[comp.status];
              const hasUpvoted = currentUser ? comp.upvotes?.includes(currentUser.uid) : false;

              return (
                <div
                  key={comp.complaintId}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all flex flex-col group h-full"
                >
                  {/* Photo Container */}
                  <ComplaintImage
                    src={comp.photoUrl}
                    alt={comp.description}
                    category={comp.category}
                    status={comp.status}
                    priorityScore={comp.priorityScore}
                    containerClassName="w-full h-52 sm:h-56 relative shrink-0 block bg-slate-100 overflow-hidden"
                  />

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-white">
                    <div className="space-y-3">
                      {/* Meta Tags Row */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${catInfo?.badgeColor}`}>
                          {t(`cat.${comp.category}`)}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          {comp.ward && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              {comp.ward}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-slate-400">
                            #{comp.reporterCitizenId || 'QLMT4821'}
                          </span>
                        </div>
                      </div>

                      {/* Complaint Description Title */}
                      <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                        {comp.description}
                      </h3>

                      {/* Address info */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{comp.location.address}</span>
                      </div>

                      {/* AI classification description snippet */}
                      {comp.aiClassification?.aiDescription && (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex items-start gap-2">
                          <Sparkles size={14} className="text-blue-600 shrink-0 mt-0.5" />
                          <span className="italic line-clamp-2">
                            "{comp.aiClassification.aiDescription}"
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer / Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                      <span className="text-slate-400 text-[11px]">
                        {new Date(comp.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {comp.status === 'resolved' && (
                          <button
                            onClick={() => setCertificateComplaint(comp)}
                            title={t('common.share')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1 text-[11px] border border-emerald-200 transition-colors"
                          >
                            <Award size={13} className="text-emerald-600" />
                            <span className="hidden sm:inline">{t('common.share')}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleUpvote(comp.complaintId)}
                          className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-xs ${
                            hasUpvoted
                              ? 'bg-blue-600 text-white shadow-blue-600/20'
                              : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700'
                          }`}
                        >
                          <ThumbsUp size={13} />
                          <span>{t('common.upvote')} ({comp.upvotes?.length || 1})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Shareable Resolution Certificate Modal */}
      <ResolutionCertificateModal
        isOpen={!!certificateComplaint}
        complaint={certificateComplaint}
        onClose={() => setCertificateComplaint(null)}
      />
    </div>
  );
};


