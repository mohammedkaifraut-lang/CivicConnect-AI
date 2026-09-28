import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { Complaint, ComplaintStatus } from '../types';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '../types';
import { submitResolutionFeedback, toggleUpvoteComplaint } from '../lib/firebase';
import { ComplaintImage } from './ComplaintImage';
import { ResolutionCertificateModal } from './ResolutionCertificateModal';
import {
  User,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
  ThumbsUp,
  MessageSquare,
  ShieldCheck,
  Check,
  X,
  Layers,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon,
  Award,
  Star,
  Download
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CitizenDashboardProps {
  myComplaints: Complaint[];
  allComplaints: Complaint[];
  onOpenReportModal: () => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  myComplaints,
  allComplaints,
  onOpenReportModal
}) => {
  const { userProfile, currentUser } = useAuth();
  const { language, t } = useLanguage();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [certificateComplaint, setCertificateComplaint] = useState<Complaint | null>(null);

  const trustScore = userProfile?.trustScore ?? 85;

  const filteredMyComplaints = myComplaints.filter((c) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return c.status !== 'resolved';
    if (filterStatus === 'resolved') return c.status === 'resolved';
    return c.status === filterStatus;
  });

  const totalSubmitted = myComplaints.length;
  const totalResolved = myComplaints.filter((c) => c.status === 'resolved').length;
  const totalActive = totalSubmitted - totalResolved;
  const totalUpvotesReceived = myComplaints.reduce(
    (acc, curr) => acc + (curr.upvotes?.length || 0),
    0
  );

  // Handle citizen confirmation / feedback
  const handleFeedback = async (complaintId: string, confirmed: boolean) => {
    setSubmittingFeedback(true);
    try {
      await submitResolutionFeedback(complaintId, confirmed, feedbackInput);
      if (confirmed) {
        confetti({ particleCount: 60, spread: 70 });
      }
      // Update locally
      if (selectedComplaint && selectedComplaint.complaintId === complaintId) {
        setSelectedComplaint({
          ...selectedComplaint,
          citizenConfirmedResolution: confirmed,
          citizenFeedbackNotes: feedbackInput || (confirmed ? 'Confirmed on-site.' : 'Flagged as unresolved.')
        });
      }
      setFeedbackInput('');
    } catch (err) {
      console.error('Feedback submission error:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleUpvote = async (complaintId: string) => {
    if (!currentUser) return;
    try {
      await toggleUpvoteComplaint(complaintId, currentUser.uid);
    } catch (err) {
      console.error('Upvote error:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Citizen Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-500/30 border border-white/20">
              {userProfile?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {userProfile?.name || currentUser?.displayName || 'Verified Citizen'}
                </h1>
                
                {/* Citizen Trust Score Badge (FEATURE 5) */}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                  <Star size={13} className="text-amber-400 fill-amber-400" />
                  <span>{trustScore >= 80 ? t('common.trustedReporter') : (language === 'hi' ? 'सत्यापित रिपोर्टर' : language === 'mr' ? 'प्रमाणित नागरिक' : 'Verified Reporter')}</span>
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">{userProfile?.email}</p>
              
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    {t('nav.citizenId')}:
                  </span>
                  <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm tracking-widest">
                    {userProfile?.citizenId || 'QLMT4821'}
                  </span>
                </div>

                {/* Trust Score Indicator */}
                <div className="inline-flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    {t('common.trustScore')}:
                  </span>
                  <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">
                    {trustScore}/100
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenReportModal}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg hover:shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle size={18} />
              <span>{t('hero.reportBtn')}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
              {t('dash.submitted')}
            </span>
            <span className="text-2xl font-bold text-white">{totalSubmitted}</span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
              {t('dash.inProgress')}
            </span>
            <span className="text-2xl font-bold text-amber-400">{totalActive}</span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
              {t('dash.resolved')}
            </span>
            <span className="text-2xl font-bold text-emerald-400">{totalResolved}</span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
              {t('common.upvotes')}
            </span>
            <span className="text-2xl font-bold text-sky-400">{totalUpvotesReceived}</span>
          </div>
        </div>
      </div>

      {/* Main Complaints List & Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Complaints Feed / Filter */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="font-bold text-slate-900 text-lg">
                {t('dash.mySubmitted')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('dash.liveTracking')}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {[
                { key: 'all', label: t('status.all') },
                { key: 'active', label: language === 'mr' ? 'सक्रिय' : 'Active' },
                { key: 'resolved', label: t('status.resolved') }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-all ${
                    filterStatus === tab.key
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredMyComplaints.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <PlusCircle size={24} />
              </div>
              <h3 className="font-bold text-slate-800">
                {language === 'mr' ? 'या विभागात कोणतीही तक्रार नाही' : 'No complaints in this view'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {language === 'mr'
                  ? 'रस्त्यावरील खड्डा, बंद पथदिवा किंवा कचरा आढळल्यास त्वरित फोटो काढून नोंदवा.'
                  : 'Spot a pothole, broken streetlight, or garbage pile? Report it now for automated AI routing to city departments.'}
              </p>
              <button
                onClick={onOpenReportModal}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
              >
                {t('hero.reportBtn')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMyComplaints.map((complaint) => {
                const catInfo = CATEGORY_CONFIG[complaint.category];
                const statusInfo = STATUS_CONFIG[complaint.status];
                const isSelected = selectedComplaint?.complaintId === complaint.complaintId;

                return (
                  <div
                    key={complaint.complaintId}
                    onClick={() => setSelectedComplaint(complaint)}
                    className={`bg-white rounded-xl p-4 border transition-all cursor-pointer hover:shadow-md ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-100 shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      <ComplaintImage
                        src={complaint.photoUrl}
                        alt={complaint.description}
                        category={complaint.category}
                        showBadges={false}
                        containerClassName="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-slate-100 overflow-hidden shrink-0 relative"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${catInfo?.badgeColor}`}>
                              {t(`cat.${complaint.category}`)}
                            </span>
                            {complaint.ward && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                {complaint.ward}
                              </span>
                            )}
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white capitalize ${statusInfo?.bgColor}`}>
                            {t(`status.${complaint.status}`)}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {complaint.description}
                        </p>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <MapPin size={12} className="shrink-0 text-slate-400" />
                          <span className="truncate">{complaint.location.address}</span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                          <span>
                            {new Date(complaint.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          
                          <div className="flex items-center gap-3">
                            {complaint.status === 'resolved' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCertificateComplaint(complaint);
                                }}
                                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                              >
                                <Award size={12} />
                                <span>{t('feed.certificateBtn')}</span>
                              </button>
                            )}
                            <span className="flex items-center gap-1 font-semibold text-slate-600">
                              <ThumbsUp size={11} />
                              {complaint.upvotes?.length || 1}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Detail View & Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {selectedComplaint ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md space-y-6 animate-fade-in sticky top-20">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    {language === 'mr' ? 'तक्रार आयडी' : 'Complaint ID'}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700">
                    #{selectedComplaint.complaintId.slice(0, 10)}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${STATUS_CONFIG[selectedComplaint.status]?.bgColor}`}>
                  {t(`status.${selectedComplaint.status}`)}
                </span>
              </div>

              {/* Horizontal Status Timeline */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  {language === 'mr' ? 'निवारण प्रगती (Progress)' : 'Resolution Progress'}
                </h4>
                <div className="relative flex items-center justify-between">
                  {/* Progress bar line */}
                  <div className="absolute top-3 inset-x-3 h-0.5 bg-slate-200 -z-0" />
                  
                  {(['reported', 'verified', 'assigned', 'in_progress', 'resolved'] as ComplaintStatus[]).map((st, idx) => {
                    const conf = STATUS_CONFIG[st];
                    const currentStep = STATUS_CONFIG[selectedComplaint.status].step;
                    const isReached = conf.step <= currentStep;
                    const isCurrent = conf.step === currentStep;

                    return (
                      <div key={st} className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                            isReached
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                              : 'bg-slate-200 text-slate-500'
                          } ${isCurrent ? 'scale-110' : ''}`}
                        >
                          {isReached ? '✓' : idx + 1}
                        </div>
                        <span
                          className={`text-[10px] mt-1 font-semibold capitalize ${
                            isCurrent ? 'text-blue-700 font-bold' : 'text-slate-500'
                          }`}
                        >
                          {t(`status.${st}`)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Photos View: Before vs After (If resolved) */}
              {selectedComplaint.status === 'resolved' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-emerald-600" />
                      <span>{language === 'mr' ? 'निवारणापूर्वी व नंतरचे छायाचित्र' : 'Before & After Remediated Evidence'}</span>
                    </h4>
                    
                    <button
                      onClick={() => setCertificateComplaint(selectedComplaint)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-sm"
                    >
                      <Award size={13} />
                      <span>{t('feed.certificateBtn')}</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">1. Before (Reported)</span>
                      <ComplaintImage
                        src={selectedComplaint.photoUrl}
                        alt="Before"
                        category={selectedComplaint.category}
                        showBadges={false}
                        containerClassName="aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">2. After (Remediated)</span>
                      <ComplaintImage
                        src={selectedComplaint.resolvedPhotoUrl || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80'}
                        alt="After"
                        category={selectedComplaint.category}
                        showBadges={false}
                        containerClassName="aspect-video rounded-lg overflow-hidden border border-emerald-300 bg-emerald-50 relative"
                      />
                    </div>
                  </div>

                  {/* Citizen Verification Action Box */}
                  <div className="bg-emerald-50/80 rounded-xl p-4 border border-emerald-200 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                      <Sparkles size={14} className="text-emerald-600" />
                      <span>{language === 'mr' ? 'नागरिक निवारण पडताळणी' : 'Municipal Resolution Confirmation'}</span>
                    </div>

                    {selectedComplaint.citizenConfirmedResolution === true ? (
                      <div className="p-3 bg-emerald-100/80 text-emerald-900 rounded-lg text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-700" />
                        <span>{language === 'mr' ? 'तुम्ही या निवारणाची पडताळणी केली आहे. धन्यवाद!' : 'You confirmed this resolution. Thank you for making the city better!'}</span>
                      </div>
                    ) : selectedComplaint.citizenConfirmedResolution === false ? (
                      <div className="p-3 bg-red-100/80 text-red-900 rounded-lg text-xs font-semibold flex items-center gap-2">
                        <AlertCircle size={16} className="text-red-700" />
                        <span>{language === 'mr' ? 'तुम्ही तक्रार अद्याप प्रलंबित असल्याचे चिन्हांकित केले आहे.' : 'You flagged this issue as not properly resolved. Municipal supervisor notified.'}</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-emerald-900">
                          {language === 'mr'
                            ? 'महापालिका पथकाने हे काम पूर्ण केले आहे. कृपया फोटो तपासून पुष्टी करा:'
                            : 'The municipal team marked this problem fixed. Please review the after-photo and confirm:'}
                        </p>

                        <input
                          type="text"
                          placeholder={language === 'mr' ? 'कर्मचाऱ्यांसाठी अभिप्राय...' : 'Optional feedback notes for the field crew...'}
                          value={feedbackInput}
                          onChange={(e) => setFeedbackInput(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-emerald-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleFeedback(selectedComplaint.complaintId, true)}
                            disabled={submittingFeedback}
                            className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Check size={14} />
                            <span>{language === 'mr' ? 'काम पूर्ण झाले' : 'Confirm Resolved'}</span>
                          </button>

                          <button
                            onClick={() => handleFeedback(selectedComplaint.complaintId, false)}
                            disabled={submittingFeedback}
                            className="py-2 px-3 bg-white hover:bg-red-50 text-red-700 border border-red-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                          >
                            <X size={14} />
                            <span>{language === 'mr' ? 'काम बाकी आहे' : 'Not Resolved'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    {language === 'mr' ? 'नोंदवलेला फोटो पुरावा' : 'Reported Evidence'}
                  </h4>
                  <ComplaintImage
                    src={selectedComplaint.photoUrl}
                    alt="Complaint"
                    category={selectedComplaint.category}
                    showBadges={false}
                    containerClassName="aspect-video rounded-xl overflow-hidden border border-slate-200 relative"
                  />
                </div>
              )}

              {/* Details breakdown */}
              <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === 'mr' ? 'नियुक्त विभाग:' : 'Assigned Department:'}</span>
                  <span className="font-semibold text-slate-900">{selectedComplaint.assignedDepartment || 'Public Works'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === 'mr' ? 'प्राधान्यता गुण:' : 'Priority Rating:'}</span>
                  <span className="font-mono font-bold text-blue-700">{selectedComplaint.priorityScore}/100</span>
                </div>
                {selectedComplaint.ward && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">{language === 'mr' ? 'प्रभाग (Ward):' : 'Municipal Ward:'}</span>
                    <span className="font-semibold text-amber-800">{selectedComplaint.ward}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">AI Confidence:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {Math.round((selectedComplaint.aiClassification?.confidence || 0.9) * 100)}%
                  </span>
                </div>
                {selectedComplaint.adminRemarks && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block mb-1 font-semibold">Official Remarks:</span>
                    <p className="italic text-slate-800 bg-white p-2 rounded border border-slate-200">
                      "{selectedComplaint.adminRemarks}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
              <Layers size={32} className="mx-auto text-slate-300 mb-2" />
              <p>{language === 'mr' ? 'तपशील पाहण्यासाठी डावीकडील कोणत्याही तक्रारीवर क्लिक करा.' : 'Select any complaint from the list to view its complete resolution timeline, photos, and verification actions.'}</p>
            </div>
          )}

          {/* Upvote Nearby Community Issues */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-600" />
              <span>{language === 'mr' ? 'परिसरातील इतर सक्रिय समस्या' : 'Trending Civic Issues Nearby'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'mr' ? 'इतर नागरिकांच्या तक्रारींना समर्थन (Upvote) देऊन प्राधान्य वाढवा.' : 'Upvote reports from fellow citizens to raise their priority score in the municipal queue.'}
            </p>

            <div className="space-y-2 pt-1">
              {allComplaints.slice(0, 3).map((comp) => {
                const hasUpvoted = currentUser ? comp.upvotes?.includes(currentUser.uid) : false;
                return (
                  <div
                    key={comp.complaintId}
                    className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50 flex items-center justify-between text-xs gap-2"
                  >
                    <div className="truncate min-w-0">
                      <span className="font-semibold text-slate-800 truncate block">
                        {comp.description}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {t(`cat.${comp.category}`)} • {comp.location.address}
                      </span>
                    </div>

                    <button
                      onClick={() => handleUpvote(comp.complaintId)}
                      className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                        hasUpvoted
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <ThumbsUp size={12} />
                      <span>{comp.upvotes?.length || 0}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Certificate Modal */}
      {certificateComplaint && (
        <ResolutionCertificateModal
          complaint={certificateComplaint}
          onClose={() => setCertificateComplaint(null)}
        />
      )}
    </div>
  );
};

