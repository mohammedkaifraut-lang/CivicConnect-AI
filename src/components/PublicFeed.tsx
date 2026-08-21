import React, { useState } from 'react';
import type { Complaint, ComplaintCategory, ComplaintStatus } from '../types';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '../types';
import { useAuth } from '../context/AuthContext';
import { toggleUpvoteComplaint } from '../lib/firebase';
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
  ShieldCheck
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredComplaints = complaints.filter((c) => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = c.description?.toLowerCase().includes(q);
      const matchAddr = c.location?.address?.toLowerCase().includes(q);
      const matchId = c.reporterCitizenId?.toLowerCase().includes(q);
      if (!matchDesc && !matchAddr && !matchId) return false;
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
              <span>Next-Gen Civic AI Intelligence & Resolution Pipeline</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Report Civic Issues. <br />
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                Track Direct Resolution.
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              CivicConnect AI bridges citizens directly with city departments. Snap a photo of potholes, garbage piles, broken lights, or water leaks — our AI engine auto-classifies the issue, predicts priority, and dispatches work orders to municipal field crews.
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
                <span>Report a Civic Problem</span>
              </button>

              {!currentUser && (
                <button
                  onClick={() => onOpenCitizenAuth('signup')}
                  className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all flex items-center gap-2"
                >
                  <ShieldCheck size={16} className="text-blue-400" />
                  <span>Get Official Citizen ID</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-800/80">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Reports</span>
              <span className="text-3xl font-extrabold text-white mt-1 block">{complaints.length}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">Active Pipeline</span>
              <span className="text-3xl font-extrabold text-amber-400 mt-1 block">{totalInFlight}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">Remediated & Verified</span>
              <span className="text-3xl font-extrabold text-emerald-400 mt-1 block">{totalResolved}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider block">AI Classification</span>
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
              placeholder="Search reports by issue, street address, Citizen ID..."
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
              <option value="all">All Categories</option>
              {Object.keys(CATEGORY_CONFIG).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_CONFIG[cat as ComplaintCategory].label}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700"
            >
              <option value="all">All Statuses</option>
              {Object.keys(STATUS_CONFIG).map((st) => (
                <option key={st} value={st}>
                  {STATUS_CONFIG[st as ComplaintStatus].label}
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
              <h3 className="font-bold text-slate-800">No complaints found</h3>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or submit a new report.</p>
            </div>
          ) : (
            filteredComplaints.map((comp) => {
              const catInfo = CATEGORY_CONFIG[comp.category];
              const statusInfo = STATUS_CONFIG[comp.status];
              const hasUpvoted = currentUser ? comp.upvotes?.includes(currentUser.uid) : false;

              return (
                <div
                  key={comp.complaintId}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all flex flex-col group"
                >
                  {/* Photo Container */}
                  <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    <img
                      src={comp.photoUrl}
                      alt={comp.description}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Status Pill Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-md ${statusInfo?.bgColor}`}>
                        {statusInfo?.label}
                      </span>
                    </div>

                    {/* Priority score badge */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white font-mono text-[11px] font-bold border border-white/20">
                        Priority {comp.priorityScore}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${catInfo?.badgeColor}`}>
                          {catInfo?.label || comp.category}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          Citizen #{comp.reporterCitizenId || 'QLMT4821'}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm line-clamp-2">
                        {comp.description}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{comp.location.address}</span>
                      </div>

                      {/* AI classification description snippet */}
                      {comp.aiClassification?.aiDescription && (
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] text-slate-600 flex items-start gap-1.5">
                          <Sparkles size={13} className="text-blue-600 shrink-0 mt-0.5" />
                          <span className="italic line-clamp-2">
                            "{comp.aiClassification.aiDescription}"
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer / Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        {new Date(comp.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>

                      <button
                        onClick={() => handleUpvote(comp.complaintId)}
                        className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-xs ${
                          hasUpvoted
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700'
                        }`}
                      >
                        <ThumbsUp size={13} />
                        <span>Upvote ({comp.upvotes?.length || 1})</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
