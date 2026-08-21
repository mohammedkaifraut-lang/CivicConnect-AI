import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import type { Complaint, ComplaintStatus, ComplaintCategory, UserProfile } from '../types';
import { CATEGORY_CONFIG, STATUS_CONFIG, DEPARTMENTS } from '../types';
import { ComplaintImage } from './ComplaintImage';
import {
  Shield,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  Building,
  Upload,
  Sparkles,
  MapPin,
  MessageSquare,
  Users,
  BarChart3,
  Check,
  ArrowRight,
  TrendingUp,
  Layers,
  Wrench,
  AlertTriangle,
  X,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminDashboardProps {
  complaints: Complaint[];
  onRefresh?: () => void;
}

const SAMPLE_RESOLVED_AFTER_PHOTOS = [
  'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80'
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ complaints, onRefresh }) => {
  const { userProfile } = useAuth();
  
  const [activeView, setActiveView] = useState<'complaints' | 'users' | 'analytics'>('complaints');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editing state for drawer
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('reported');
  const [newDepartment, setNewDepartment] = useState<string>('');
  const [newRemark, setNewRemark] = useState<string>('');
  const [resolvedPhotoUrl, setResolvedPhotoUrl] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Registered users state
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (selectedComplaint) {
      setNewStatus(selectedComplaint.status);
      setNewDepartment(selectedComplaint.assignedDepartment || CATEGORY_CONFIG[selectedComplaint.category]?.defaultDepartment || '');
      setResolvedPhotoUrl(selectedComplaint.resolvedPhotoUrl || '');
    }
  }, [selectedComplaint]);

  // Load registered users on tab switch
  useEffect(() => {
    if (activeView === 'users') {
      loadUsers();
    }
  }, [activeView]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push(d.data() as UserProfile));
      setRegisteredUsers(list);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (departmentFilter !== 'all' && c.assignedDepartment !== departmentFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = c.description?.toLowerCase().includes(q);
      const matchAddr = c.location?.address?.toLowerCase().includes(q);
      const matchId = c.complaintId?.toLowerCase().includes(q);
      const matchCitizen = c.reporterCitizenId?.toLowerCase().includes(q);
      if (!matchDesc && !matchAddr && !matchId && !matchCitizen) return false;
    }
    return true;
  });

  // Calculate metrics
  const totalComplaints = complaints.length;
  const verifiedCount = complaints.filter((c) => c.status === 'verified').length;
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress' || c.status === 'assigned').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;
  const pendingReviewCount = complaints.filter((c) => c.status === 'reported').length;

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint) return;

    // Resolving requires an after photo!
    if (newStatus === 'resolved' && !resolvedPhotoUrl.trim()) {
      setStatusMessage('Validation Error: Marking as Resolved requires uploading or selecting an After-Remediation Photo.');
      return;
    }

    setIsUpdating(true);
    setStatusMessage(null);

    try {
      const docRef = doc(db, 'complaints', selectedComplaint.complaintId);
      const now = new Date().toISOString();

      const timelineUpdates = selectedComplaint.statusTimeline ? [...selectedComplaint.statusTimeline] : [];
      if (newStatus !== selectedComplaint.status || newRemark.trim()) {
        timelineUpdates.push({
          status: newStatus,
          timestamp: now,
          remarks: newRemark.trim() || `Status updated to ${newStatus} by ${userProfile?.name || 'Administrator'}`,
          updatedBy: userProfile?.name || 'Municipal Officer'
        });
      }

      const updatePayload: Partial<Complaint> = {
        status: newStatus,
        assignedDepartment: newDepartment,
        adminRemarks: newRemark.trim() ? newRemark.trim() : selectedComplaint.adminRemarks,
        updatedAt: now,
        statusTimeline: timelineUpdates
      };

      if (newStatus === 'resolved') {
        updatePayload.resolvedPhotoUrl = resolvedPhotoUrl;
        updatePayload.resolvedAt = now;
      }

      await updateDoc(docRef, updatePayload);

      if (newStatus === 'resolved') {
        confetti({ particleCount: 70, spread: 70 });
      }

      // Update local state
      setSelectedComplaint({
        ...selectedComplaint,
        ...updatePayload
      });

      setStatusMessage('Complaint successfully updated in municipal database.');
      setNewRemark('');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('Update error:', err);
      setStatusMessage(`Error updating complaint: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Top Header & Clearance Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center text-white shadow-lg border border-red-500/30">
              <Shield size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-wide">
                  Municipal Authority Dashboard
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/40">
                  Officer Level
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Centralized Civic Issue Management, Department Dispatch & Verification Engine
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveView('complaints')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'complaints'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers size={14} />
              <span>Complaints Pipeline ({totalComplaints})</span>
            </button>

            <button
              onClick={() => setActiveView('users')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'users'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users size={14} />
              <span>Citizens Directory</span>
            </button>

            <button
              onClick={() => setActiveView('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'analytics'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 size={14} />
              <span>Municipal Analytics</span>
            </button>
          </div>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Reports</span>
            <span className="text-xl font-bold text-white">{totalComplaints}</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[10px] uppercase font-semibold text-amber-400 block">Pending Review</span>
            <span className="text-xl font-bold text-amber-400">{pendingReviewCount}</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[10px] uppercase font-semibold text-blue-400 block">Verified Queue</span>
            <span className="text-xl font-bold text-blue-400">{verifiedCount}</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[10px] uppercase font-semibold text-purple-400 block">In Remediation</span>
            <span className="text-xl font-bold text-purple-400">{inProgressCount}</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[10px] uppercase font-semibold text-emerald-400 block">Remediated & Closed</span>
            <span className="text-xl font-bold text-emerald-400">{resolvedCount}</span>
          </div>
        </div>
      </div>

      {/* VIEW 1: Complaints Pipeline & Action Drawer */}
      {activeView === 'complaints' && (
        <div className="space-y-6">
          
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by description, address, ID, Citizen ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700"
              >
                <option value="all">All Statuses</option>
                {Object.keys(STATUS_CONFIG).map((st) => (
                  <option key={st} value={st}>
                    {STATUS_CONFIG[st as ComplaintStatus].label}
                  </option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
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
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700"
              >
                <option value="all">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Split Table & Detail Drawer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Table / List */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs text-slate-600 font-semibold">
                <span>Displaying {filteredComplaints.length} municipal reports</span>
                <span>Click a row to inspect & update</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
                {filteredComplaints.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    No complaints match current filter criteria.
                  </div>
                ) : (
                  filteredComplaints.map((c) => {
                    const isSelected = selectedComplaint?.complaintId === c.complaintId;
                    const catInfo = CATEGORY_CONFIG[c.category];
                    const statusInfo = STATUS_CONFIG[c.status];

                    return (
                      <div
                        key={c.complaintId}
                        onClick={() => setSelectedComplaint(c)}
                        className={`p-4 transition-all cursor-pointer flex gap-3.5 hover:bg-slate-50 ${
                          isSelected ? 'bg-red-50/50 border-l-4 border-red-600' : ''
                        }`}
                      >
                        {/* Thumbnail */}
                        <ComplaintImage
                          src={c.photoUrl}
                          alt="Report"
                          category={c.category}
                          showBadges={false}
                          containerClassName="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 relative"
                        />

                        {/* Summary */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${catInfo?.badgeColor}`}>
                              {catInfo?.label || c.category}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                Priority: {c.priorityScore}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${statusInfo?.bgColor}`}>
                                {statusInfo?.label}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {c.description}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                            <span className="truncate">{c.location.address}</span>
                            <span className="font-mono text-slate-500">
                              Citizen: {c.reporterCitizenId || 'ANON'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Action / Detail Inspector Drawer */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-md p-6 sticky top-20 space-y-5">
              {selectedComplaint ? (
                <div className="space-y-5">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          #{selectedComplaint.complaintId.slice(0, 12)}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                          Citizen ID: {selectedComplaint.reporterCitizenId || 'QLMT4821'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Logged on {new Date(selectedComplaint.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {statusMessage && (
                    <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      statusMessage.startsWith('Validation') || statusMessage.startsWith('Error')
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{statusMessage}</span>
                    </div>
                  )}

                  {/* Photo Evidence & AI Classification Breakdown */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Citizen Photo</span>
                        <ComplaintImage
                          src={selectedComplaint.photoUrl}
                          alt="Citizen Photo"
                          category={selectedComplaint.category}
                          showBadges={false}
                          containerClassName="aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase block mb-1">Remediation Proof</span>
                        <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center relative">
                          {resolvedPhotoUrl ? (
                            <ComplaintImage
                              src={resolvedPhotoUrl}
                              alt="After resolution"
                              category={selectedComplaint.category}
                              showBadges={false}
                              containerClassName="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400 text-center p-2">Pending resolution upload</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Assessment Card */}
                    <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                          <Sparkles size={13} className="text-indigo-600" />
                          <span>Gemini AI Classification</span>
                        </span>
                        <span className="font-mono font-bold text-emerald-700 text-[11px]">
                          {Math.round((selectedComplaint.aiClassification?.confidence || 0.95) * 100)}% Confidence
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 italic">
                        "{selectedComplaint.aiClassification?.aiDescription || selectedComplaint.description}"
                      </p>
                      <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                        <span>Severity: <strong className="uppercase text-indigo-900">{selectedComplaint.aiClassification?.severity || 'Medium'}</strong></span>
                        <span>Upvotes: <strong>{selectedComplaint.upvotes?.length || 1}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Controls Form */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                        Change Resolution Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                        className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-red-500"
                      >
                        {Object.keys(STATUS_CONFIG).map((st) => (
                          <option key={st} value={st}>
                            {STATUS_CONFIG[st as ComplaintStatus].label} (Step {STATUS_CONFIG[st as ComplaintStatus].step}/5)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                        Jurisdictional Department Assignment
                      </label>
                      <select
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-red-500"
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept.id} value={dept.name}>
                            {dept.name} ({dept.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* After Resolution Photo Picker (Required when marking resolved) */}
                    {newStatus === 'resolved' && (
                      <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-300 space-y-2 text-xs">
                        <label className="block font-bold text-amber-950 uppercase tracking-wider text-[10px]">
                          * Required: After-Remediation Photo Proof
                        </label>
                        <p className="text-[11px] text-amber-800">
                          Select verified remediation photo from field dispatch:
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {SAMPLE_RESOLVED_AFTER_PHOTOS.map((url, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setResolvedPhotoUrl(url)}
                              className={`aspect-video rounded-md overflow-hidden border-2 transition-all ${
                                resolvedPhotoUrl === url ? 'border-emerald-600 ring-2 ring-emerald-300' : 'border-slate-300'
                              }`}
                            >
                              <img src={url} alt="After sample" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                        Add Official Municipal Remark
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Field crew #4 dispatched for asphalt patch..."
                        value={newRemark}
                        onChange={(e) => setNewRemark(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <button
                      onClick={handleUpdateComplaint}
                      disabled={isUpdating}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {isUpdating ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check size={14} />
                          <span>Apply Official Updates</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 text-xs">
                  <Wrench size={32} className="mx-auto text-slate-300 mb-2" />
                  <p>Select any complaint from the pipeline list to assign departments, verify authenticity, or mark as resolved.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Registered Citizens Directory (Read-Only Accountability) */}
      {activeView === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Registered Citizens Directory</h2>
              <p className="text-xs text-slate-500">
                Read-only municipal audit view of registered citizen IDs and accountability logs
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
              {registeredUsers.length} Registered Accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="p-3">Citizen ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registeredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      {loadingUsers ? 'Loading citizen records...' : 'No citizen records found.'}
                    </td>
                  </tr>
                ) : (
                  registeredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-700">
                        {u.citizenId || 'N/A'}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{u.name}</td>
                      <td className="p-3 text-slate-600">{u.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Municipal Analytics */}
      {activeView === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Breakdown by Category */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Complaints by Category</h3>
              
              <div className="space-y-3">
                {(Object.keys(CATEGORY_CONFIG) as ComplaintCategory[]).map((cat) => {
                  const count = complaints.filter((c) => c.category === cat).length;
                  const pct = totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0;

                  return (
                    <div key={cat} className="space-y-1 text-xs">
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span>{CATEGORY_CONFIG[cat].label}</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department Workload Matrix */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Department Workload & Remediation</h3>
              
              <div className="space-y-3">
                {DEPARTMENTS.map((dept) => {
                  const deptComplaints = complaints.filter((c) => c.assignedDepartment === dept.name);
                  const pending = deptComplaints.filter((c) => c.status !== 'resolved').length;
                  const resolved = deptComplaints.filter((c) => c.status === 'resolved').length;

                  return (
                    <div key={dept.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                      <div className="flex justify-between font-bold text-slate-900 mb-1">
                        <span>{dept.name}</span>
                        <span className="font-mono text-slate-600">{deptComplaints.length} Total</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span className="text-amber-700 font-semibold">{pending} Active Tasks</span>
                        <span className="text-emerald-700 font-semibold">{resolved} Remediated</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
