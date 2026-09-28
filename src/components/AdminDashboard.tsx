import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, collection, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import type { Complaint, ComplaintStatus, ComplaintCategory, UserProfile, WardId } from '../types';
import { CATEGORY_CONFIG, STATUS_CONFIG, DEPARTMENTS, WARDS_DATA } from '../types';
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
  ChevronRight,
  Trash2,
  Zap,
  Radio,
  Volume2,
  VolumeX,
  Flame,
  Siren,
  PlusCircle,
  AlertOctagon
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
  const [criticalOnlyFilter, setCriticalOnlyFilter] = useState<boolean>(false);

  // Emergency Alert & Major Incident Reporting State
  const [isReportEmergencyOpen, setIsReportEmergencyOpen] = useState(false);
  const [sirenActive, setSirenActive] = useState(false);
  const [isSubmittingEmergency, setIsSubmittingEmergency] = useState(false);
  const [emergencyType, setEmergencyType] = useState<'electric_wire' | 'water_burst' | 'sinkhole' | 'custom'>('electric_wire');
  const [emergencyDesc, setEmergencyDesc] = useState('');
  const [emergencyWard, setEmergencyWard] = useState<WardId>('Ward B');
  const [emergencyAddress, setEmergencyAddress] = useState('');

  // Editing state for drawer
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('reported');
  const [newDepartment, setNewDepartment] = useState<string>('');
  const [newRemark, setNewRemark] = useState<string>('');
  const [resolvedPhotoUrl, setResolvedPhotoUrl] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
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

  // Critical Complaints Identification (Severity: critical, Priority >= 90, or electric wire / explosion)
  const isEmergencyComplaint = (c: Complaint) => {
    const isCritSev = c.aiClassification?.severity === 'critical';
    const isHighPri = (c.priorityScore || 0) >= 90;
    const desc = (c.description || '').toLowerCase();
    const isBurstOrWire = desc.includes('wire') || desc.includes('burst') || desc.includes('electric') || c.complaintId?.includes('electric-wire');
    return isCritSev || isHighPri || isBurstOrWire;
  };

  const criticalComplaints = complaints.filter(isEmergencyComplaint);

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    if (criticalOnlyFilter && !isEmergencyComplaint(c)) return false;
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

  const playSirenSound = () => {
    try {
      setSirenActive(true);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.35);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.7);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.9);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.9);
      setTimeout(() => setSirenActive(false), 2000);
    } catch {
      setTimeout(() => setSirenActive(false), 1500);
    }
  };

  const handleQuickDispatchLineman = async (comp: Complaint) => {
    try {
      setIsUpdating(true);
      const docRef = doc(db, 'complaints', comp.complaintId);
      const now = new Date().toISOString();
      const timelineUpdates = comp.statusTimeline ? [...comp.statusTimeline] : [];
      timelineUpdates.push({
        status: 'in_progress',
        timestamp: now,
        remarks: '⚡ RED ALERT: 11kV Grid Feeder Isolated & Emergency Lineman Squad Dispatched to Site',
        updatedBy: userProfile?.name || 'Chief Municipal Officer'
      });
      await updateDoc(docRef, {
        status: 'in_progress',
        assignedDepartment: 'Electrical Engineering & Street Lighting',
        adminRemarks: '⚡ 11kV Substation Feeder isolated; Lineman rapid response bucket truck on-site.',
        updatedAt: now,
        statusTimeline: timelineUpdates
      });
      playSirenSound();
      setStatusMessage('⚡ Lineman Rapid Response & Grid Isolation Dispatched Successfully!');
      if (selectedComplaint?.complaintId === comp.complaintId) {
        setSelectedComplaint({
          ...selectedComplaint,
          status: 'in_progress',
          assignedDepartment: 'Electrical Engineering & Street Lighting',
          adminRemarks: '⚡ 11kV Substation Feeder isolated; Lineman rapid response bucket truck on-site.',
          updatedAt: now,
          statusTimeline: timelineUpdates
        });
      }
      setTimeout(() => setStatusMessage(null), 4000);
      if (onRefresh) onRefresh();
    } catch (e: any) {
      setStatusMessage(`Error dispatching linemen: ${e.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateMajorEmergency = async () => {
    setIsSubmittingEmergency(true);
    try {
      const now = new Date().toISOString();
      let newComp: Partial<Complaint>;

      if (emergencyType === 'electric_wire') {
        newComp = {
          reportedBy: userProfile?.uid || 'admin-officer',
          reporterName: userProfile?.name || 'Municipal Control Room',
          reporterCitizenId: userProfile?.citizenId || 'ADMIN-01',
          category: 'streetlight',
          ward: emergencyWard || 'Ward B',
          description: emergencyDesc.trim() || '🚨 CRITICAL EMERGENCY: High-tension 11kV overhead electric wire snapped and bursting with violent explosive arcing and sparks across roadway, threatening pedestrians and vehicles.',
          photoUrl: '/11kv_wire_blast.svg',
          location: {
            lat: 18.6308,
            lng: 73.7865,
            address: emergencyAddress.trim() || 'Chinchwad Station Road, Opp. Mahavir Garden & Auto Stand',
            city: 'PCMC Metro',
            ward: emergencyWard || 'Ward B'
          },
          aiClassification: {
            label: 'streetlight',
            confidence: 0.99,
            aiDescription: 'CRITICAL LIFE-SAFETY HAZARD: High-voltage overhead electrical feeder conductor ruptured and actively discharging heavy electrical arcs onto roadway. Imminent danger of electrocution, fire outbreak, and transformer explosion.',
            severity: 'critical',
            tags: ['electric-wire-burst', 'live-arcing-wire', 'high-voltage-hazard', 'electrocution-risk', 'emergency-dispatch'],
            suggestedDepartment: 'Electrical Engineering & Street Lighting'
          },
          priorityScore: 99,
          status: 'in_progress',
          assignedDepartment: 'Electrical Engineering & Street Lighting',
          adminRemarks: '🚨 SQUAD ON-SITE: Lineman rapid response unit dispatched. Substation feeder isolated to prevent electrocution.',
          upvotes: [userProfile?.uid || 'admin-officer'],
          citizenConfirmedResolution: null,
          createdAt: now,
          updatedAt: now,
          statusTimeline: [
            {
              status: 'reported',
              timestamp: now,
              remarks: 'Urgent municipal emergency incident logged by Control Officer',
              updatedBy: userProfile?.name || 'Control Officer'
            },
            {
              status: 'in_progress',
              timestamp: now,
              remarks: 'Immediate Grid Isolation & Lineman Unit Dispatched',
              updatedBy: userProfile?.name || 'Control Officer'
            }
          ]
        };
      } else if (emergencyType === 'water_burst') {
        newComp = {
          reportedBy: userProfile?.uid || 'admin-officer',
          reporterName: userProfile?.name || 'Municipal Control Room',
          reporterCitizenId: userProfile?.citizenId || 'ADMIN-01',
          category: 'water_leak',
          ward: emergencyWard || 'Ward A',
          description: emergencyDesc.trim() || '🚨 MAJOR EXPLOSION: High-pressure 24-inch municipal main water supply pipeline burst through road surface with geyser force, fracturing asphalt and submerging roadway.',
          photoUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
          location: {
            lat: 18.6542,
            lng: 73.7715,
            address: emergencyAddress.trim() || 'Spine Road Near Sector 24 Water Reservoir Junction',
            city: 'PCMC Metro',
            ward: emergencyWard || 'Ward A'
          },
          aiClassification: {
            label: 'water_leak',
            confidence: 0.98,
            aiDescription: 'CRITICAL INFRASTRUCTURE COLLAPSE: High-volume trunk main blowout causing rapid road sub-base erosion, vehicle stranding, and municipal water supply cutoff.',
            severity: 'critical',
            tags: ['water-main-burst', 'catastrophic-leak', 'flooding-emergency', 'sub-base-erosion'],
            suggestedDepartment: 'Municipal Water & Sewerage Board'
          },
          priorityScore: 97,
          status: 'in_progress',
          assignedDepartment: 'Municipal Water & Sewerage Board',
          adminRemarks: 'Mainline control sluice gates shut down. Heavy excavation equipment deployed.',
          upvotes: [userProfile?.uid || 'admin-officer'],
          citizenConfirmedResolution: null,
          createdAt: now,
          updatedAt: now,
          statusTimeline: [
            {
              status: 'reported',
              timestamp: now,
              remarks: 'Urgent trunk main burst logged by Control Room',
              updatedBy: userProfile?.name || 'Control Officer'
            },
            {
              status: 'in_progress',
              timestamp: now,
              remarks: 'SCADA isolation & excavation team dispatched',
              updatedBy: userProfile?.name || 'Control Officer'
            }
          ]
        };
      } else if (emergencyType === 'sinkhole') {
        newComp = {
          reportedBy: userProfile?.uid || 'admin-officer',
          reporterName: userProfile?.name || 'Municipal Control Room',
          reporterCitizenId: userProfile?.citizenId || 'ADMIN-01',
          category: 'pothole',
          ward: emergencyWard || 'Ward D',
          description: emergencyDesc.trim() || '🚨 CATASTROPHIC ROAD CAVE-IN: Massive 12-foot deep sinkhole crater opened suddenly across two lanes following underground storm culvert shear.',
          photoUrl: 'https://images.unsplash.com/photo-1578983427937-26078ee3d9d3?auto=format&fit=crop&w=800&q=80',
          location: {
            lat: 18.5992,
            lng: 73.7665,
            address: emergencyAddress.trim() || 'Wakad Flyover Approach, Near Dange Chowk Connector',
            city: 'PCMC Metro',
            ward: emergencyWard || 'Ward D'
          },
          aiClassification: {
            label: 'pothole',
            confidence: 0.99,
            aiDescription: 'STRUCTURAL COLLAPSE HAZARD: Deep subterranean void formation and severe shear failure endangering all approaching vehicles and mass transit.',
            severity: 'critical',
            tags: ['massive-sinkhole', 'road-cave-in', 'structural-collapse', 'traffic-hazard'],
            suggestedDepartment: 'Public Works & Road Infrastructure'
          },
          priorityScore: 95,
          status: 'in_progress',
          assignedDepartment: 'Public Works & Road Infrastructure',
          adminRemarks: 'Traffic diverted, heavy shoring crews and precast culvert division dispatched.',
          upvotes: [userProfile?.uid || 'admin-officer'],
          citizenConfirmedResolution: null,
          createdAt: now,
          updatedAt: now,
          statusTimeline: [
            {
              status: 'reported',
              timestamp: now,
              remarks: 'Catastrophic road cave-in logged by Traffic Division',
              updatedBy: userProfile?.name || 'Control Officer'
            },
            {
              status: 'in_progress',
              timestamp: now,
              remarks: 'Structural engineering rescue squad deployed',
              updatedBy: userProfile?.name || 'Control Officer'
            }
          ]
        };
      } else {
        newComp = {
          reportedBy: userProfile?.uid || 'admin-officer',
          reporterName: userProfile?.name || 'Municipal Control Room',
          reporterCitizenId: userProfile?.citizenId || 'ADMIN-01',
          category: 'damaged_facility',
          ward: emergencyWard || 'Ward B',
          description: emergencyDesc.trim() || '🚨 URGENT CRITICAL INCIDENT: Major infrastructure failure logged via Municipal Red Dashboard.',
          photoUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
          location: {
            lat: 18.6300,
            lng: 73.7850,
            address: emergencyAddress.trim() || 'PCMC Metro Corridor',
            city: 'PCMC Metro',
            ward: emergencyWard || 'Ward B'
          },
          aiClassification: {
            label: 'damaged_facility',
            confidence: 0.95,
            aiDescription: 'CRITICAL MUNICIPAL INCIDENT: Public safety hazard requiring immediate officer dispatch.',
            severity: 'critical',
            tags: ['critical-incident', 'emergency-dispatch'],
            suggestedDepartment: 'Municipal Rapid Response'
          },
          priorityScore: 95,
          status: 'in_progress',
          assignedDepartment: 'Municipal Rapid Response',
          adminRemarks: 'Emergency work order generated by Admin Dashboard.',
          upvotes: [userProfile?.uid || 'admin-officer'],
          citizenConfirmedResolution: null,
          createdAt: now,
          updatedAt: now,
          statusTimeline: [
            {
              status: 'reported',
              timestamp: now,
              remarks: 'Emergency logged via Admin Red Dashboard',
              updatedBy: userProfile?.name || 'Control Officer'
            }
          ]
        };
      }

      await addDoc(collection(db, 'complaints'), newComp);
      setIsReportEmergencyOpen(false);
      setEmergencyDesc('');
      setEmergencyAddress('');
      setStatusMessage('🚨 Major emergency incident reported and published to Red Dashboard successfully!');
      confetti({ particleCount: 60, spread: 60 });
      playSirenSound();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Error reporting major emergency:', err);
      setStatusMessage(`Error saving emergency: ${err.message}`);
    } finally {
      setIsSubmittingEmergency(false);
    }
  };

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

  // Delete Complaint from Database
  const handleDeleteComplaint = async () => {
    if (!selectedComplaint) return;
    setIsDeleting(true);
    try {
      const docRef = doc(db, 'complaints', selectedComplaint.complaintId);
      await deleteDoc(docRef);
      setSelectedComplaint(null);
      setConfirmDelete(false);
      setStatusMessage('Complaint permanently removed from municipal record.');
      setTimeout(() => setStatusMessage(null), 3000);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Delete error:', err);
      setStatusMessage(`Error deleting complaint: ${err.message}`);
    } finally {
      setIsDeleting(false);
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
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800">
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
          <div
            onClick={() => setCriticalOnlyFilter(!criticalOnlyFilter)}
            className={`rounded-xl p-3 border cursor-pointer transition-all ${
              criticalOnlyFilter
                ? 'bg-red-950 border-red-500 ring-2 ring-red-500/50'
                : 'bg-red-950/40 border-red-900/60 hover:bg-red-950/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-extrabold text-red-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                Red Alerts
              </span>
              <Siren size={13} className="text-red-400" />
            </div>
            <span className="text-xl font-extrabold text-red-400 block mt-0.5">{criticalComplaints.length}</span>
          </div>
        </div>
      </div>

      {/* VIEW 1: Complaints Pipeline & Action Drawer */}
      {activeView === 'complaints' && (
        <div className="space-y-6">
          
          {/* 🚨 RED ALERT EMERGENCY OPERATIONS DESK */}
          <div className={`rounded-2xl p-5 border transition-all ${
            sirenActive 
              ? 'bg-red-950 border-red-500 ring-4 ring-red-500/40 shadow-2xl animate-pulse text-white' 
              : 'bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border-red-800/70 text-white shadow-xl'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
                  <Siren size={24} className="animate-bounce" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-red-600 text-white shadow-xs">
                      Red Alert Emergency Desk
                    </span>
                    <span className="text-xs text-red-300 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                      {criticalComplaints.length} Major Public Safety {criticalComplaints.length === 1 ? 'Emergency' : 'Emergencies'} Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                    Live municipal dispatch desk for critical public hazards: 11kV live electric wire bursts, high-pressure water main breaches, and catastrophic roadway collapses.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={playSirenSound}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-red-300 border border-red-800/60 transition-all cursor-pointer shadow-xs"
                >
                  {sirenActive ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  <span>{sirenActive ? 'Siren Sounding!' : 'Test Emergency Siren'}</span>
                </button>

                <button
                  onClick={() => {
                    setEmergencyType('electric_wire');
                    setEmergencyDesc('🚨 CRITICAL EMERGENCY: High-tension 11kV overhead electric wire snapped and bursting with violent explosive arcing and sparks across roadway, threatening pedestrians and vehicles.');
                    setEmergencyWard('Ward B');
                    setEmergencyAddress('Chinchwad Station Road, Opp. Mahavir Garden & Auto Stand');
                    setIsReportEmergencyOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg border border-red-400/40 transition-all cursor-pointer"
                >
                  <PlusCircle size={15} />
                  <span>Report Major Emergency Problem</span>
                </button>
              </div>
            </div>

            {/* Quick Critical Incident Highlights */}
            {criticalComplaints.length > 0 && (
              <div className="mt-4 pt-4 border-t border-red-900/60 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {criticalComplaints.slice(0, 3).map((comp) => {
                  const isWire = (comp.description || '').toLowerCase().includes('wire') || comp.complaintId?.includes('electric-wire');
                  return (
                    <div
                      key={comp.complaintId}
                      className="bg-slate-900/90 rounded-xl p-3.5 border border-red-800/40 hover:border-red-500 transition-all flex flex-col justify-between gap-2.5 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                            {isWire ? <Zap size={11} className="text-amber-400" /> : <Flame size={11} className="text-red-400" />}
                            <span>{isWire ? 'Electric Wire Burst Hazard' : 'Major Hazard'}</span>
                          </span>
                          <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded">
                            Score: {comp.priorityScore}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-white line-clamp-2">
                          {comp.description}
                        </p>
                        <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1 truncate">
                          <MapPin size={11} className="shrink-0 text-red-400" />
                          <span className="truncate">{comp.location?.address} ({comp.ward || 'PCMC'})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                        {isWire && comp.status !== 'in_progress' && comp.status !== 'resolved' && (
                          <button
                            onClick={() => handleQuickDispatchLineman(comp)}
                            disabled={isUpdating}
                            className="flex-1 py-1.5 px-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Zap size={11} />
                            <span>Dispatch Linemen</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedComplaint(comp)}
                          className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold rounded-lg transition-all text-center cursor-pointer"
                        >
                          Inspect Incident
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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

            {/* Dropdown Filters & Critical Filter Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCriticalOnlyFilter(!criticalOnlyFilter)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  criticalOnlyFilter
                    ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-400'
                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                }`}
              >
                <Zap size={14} className={criticalOnlyFilter ? 'text-amber-300' : 'text-red-600'} />
                <span>Critical Red Alerts ({criticalComplaints.length})</span>
              </button>

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
                    const isEmergency = isEmergencyComplaint(c);
                    const isWire = (c.description || '').toLowerCase().includes('wire') || c.complaintId?.includes('electric-wire');

                    return (
                      <div
                        key={c.complaintId}
                        onClick={() => setSelectedComplaint(c)}
                        className={`p-4 transition-all cursor-pointer flex gap-3.5 hover:bg-slate-50 ${
                          isSelected
                            ? 'bg-red-50/70 border-l-4 border-red-600'
                            : isEmergency
                            ? 'bg-red-50/30 border-l-4 border-red-500'
                            : ''
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
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${catInfo?.badgeColor}`}>
                                {catInfo?.label || c.category}
                              </span>
                              {isEmergency && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-red-600 text-white flex items-center gap-0.5 animate-pulse">
                                  <Zap size={10} /> {isWire ? 'WIRE BURST HAZARD' : 'RED ALERT'}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                isEmergency ? 'text-red-700 bg-red-100 font-extrabold' : 'text-slate-700 bg-slate-100'
                              }`}>
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
                            <span className="truncate">{c.location?.address}</span>
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

                    {/* Emergency Protocol Box for Critical Incidents */}
                    {isEmergencyComplaint(selectedComplaint) && (
                      <div className="bg-red-950 text-white p-4 rounded-xl border border-red-700/70 space-y-3 shadow-md animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                            <Siren size={15} className="animate-bounce text-red-500" />
                            <span>Life Safety Emergency Protocol</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white shadow-xs">
                            Priority {selectedComplaint.priorityScore}
                          </span>
                        </div>

                        <p className="text-[11px] text-red-200 leading-relaxed">
                          Immediate emergency protocol active. Dispatches high-priority lineman units, grid isolation commands, or structural shoring teams.
                        </p>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleQuickDispatchLineman(selectedComplaint)}
                            disabled={isUpdating}
                            className="py-2 px-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Zap size={14} />
                            <span>Isolate & Dispatch</span>
                          </button>

                          <button
                            type="button"
                            onClick={playSirenSound}
                            className="py-2 px-2 bg-red-800 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <Volume2 size={14} />
                            <span>Sound Siren</span>
                          </button>
                        </div>
                      </div>
                    )}
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
                      disabled={isUpdating || isDeleting}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

                    {/* Delete Action with Confirmation */}
                    <div className="pt-2 border-t border-slate-100">
                      {confirmDelete ? (
                        <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-2 animate-fade-in">
                          <p className="text-[11px] font-semibold text-red-800 flex items-center gap-1.5">
                            <AlertTriangle size={14} className="shrink-0 text-red-600" />
                            <span>Permanently delete this complaint record?</span>
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleDeleteComplaint}
                              disabled={isDeleting}
                              className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1"
                            >
                              {isDeleting ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Trash2 size={13} />
                                  <span>Yes, Delete</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(false)}
                              disabled={isDeleting}
                              className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(true)}
                          className="w-full py-2 px-3 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-xl border border-transparent hover:border-red-200 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Trash2 size={13} />
                          <span>Delete Complaint Record</span>
                        </button>
                      )}
                    </div>
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

      {/* Report Major Emergency Modal */}
      {isReportEmergencyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-red-600/50 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400">
                  <Siren size={20} className="animate-spin" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <span>Log Major Emergency Incident</span>
                    <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full uppercase font-bold">Red Alert</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Instantly broadcast critical hazard into Red Dashboard & dispatch teams
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReportEmergencyOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Template Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Select Major Problem Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmergencyType('electric_wire');
                    setEmergencyDesc('🚨 CRITICAL EMERGENCY: High-tension 11kV overhead electric wire snapped and bursting with violent explosive arcing and sparks across roadway, threatening pedestrians and vehicles.');
                    setEmergencyWard('Ward B');
                    setEmergencyAddress('Chinchwad Station Road, Opp. Mahavir Garden & Auto Stand');
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    emergencyType === 'electric_wire'
                      ? 'bg-red-950/90 border-red-500 text-white ring-2 ring-red-500/40'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold text-amber-400 text-xs mb-0.5">
                    <Zap size={14} />
                    <span>Electric Wire Burst</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">11kV snapping & sparking</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmergencyType('water_burst');
                    setEmergencyDesc('🚨 MAJOR EXPLOSION: High-pressure 24-inch municipal main water supply pipeline burst through road surface with geyser force, fracturing asphalt and submerging roadway.');
                    setEmergencyWard('Ward A');
                    setEmergencyAddress('Spine Road Near Sector 24 Water Reservoir Junction');
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    emergencyType === 'water_burst'
                      ? 'bg-red-950/90 border-red-500 text-white ring-2 ring-red-500/40'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold text-cyan-400 text-xs mb-0.5">
                    <Flame size={14} />
                    <span>Water Main Burst</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">24" high-pressure pipe breach</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmergencyType('sinkhole');
                    setEmergencyDesc('🚨 CATASTROPHIC ROAD CAVE-IN: Massive 12-foot deep sinkhole crater opened suddenly across two lanes following underground storm culvert shear.');
                    setEmergencyWard('Ward D');
                    setEmergencyAddress('Wakad Flyover Approach, Near Dange Chowk Connector');
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    emergencyType === 'sinkhole'
                      ? 'bg-red-950/90 border-red-500 text-white ring-2 ring-red-500/40'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold text-orange-400 text-xs mb-0.5">
                    <AlertOctagon size={14} />
                    <span>Massive Sinkhole</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">12ft crater road cave-in</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmergencyType('custom');
                    setEmergencyDesc('');
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    emergencyType === 'custom'
                      ? 'bg-red-950/90 border-red-500 text-white ring-2 ring-red-500/40'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold text-slate-200 text-xs mb-0.5">
                    <AlertCircle size={14} />
                    <span>Custom Crisis</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">Enter custom problem</span>
                </button>
              </div>
            </div>

            {/* Emergency Description */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Emergency Incident Description
              </label>
              <textarea
                rows={3}
                value={emergencyDesc}
                onChange={(e) => setEmergencyDesc(e.target.value)}
                placeholder="Describe critical hazard, immediate public risk, street conditions..."
                className="w-full p-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Ward & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  Jurisdiction Ward
                </label>
                <select
                  value={emergencyWard}
                  onChange={(e) => setEmergencyWard(e.target.value as WardId)}
                  className="w-full p-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-red-500 font-medium"
                >
                  {WARDS_DATA.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  Incident Street Address
                </label>
                <input
                  type="text"
                  value={emergencyAddress}
                  onChange={(e) => setEmergencyAddress(e.target.value)}
                  placeholder="Street / Landmark location..."
                  className="w-full p-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsReportEmergencyOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateMajorEmergency}
                disabled={isSubmittingEmergency || !emergencyDesc.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Siren size={15} />
                <span>{isSubmittingEmergency ? 'Broadcasting Emergency...' : 'Publish to Red Dashboard & Dispatch'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
