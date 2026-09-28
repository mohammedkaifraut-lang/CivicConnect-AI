import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  db,
  calculatePriorityScore,
  findNearbyDuplicates,
  toggleUpvoteComplaint,
  uploadComplaintPhoto,
  compressImage
} from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import type { Complaint, ComplaintCategory, AIClassification, WardId } from '../types';
import { CATEGORY_CONFIG, DEPARTMENTS, WARDS_DATA } from '../types';
import { ComplaintImage } from './ComplaintImage';
import confetti from 'canvas-confetti';
import {
  X,
  Upload,
  Camera,
  Sparkles,
  MapPin,
  AlertTriangle,
  Check,
  ThumbsUp,
  ArrowRight,
  RefreshCw,
  Info,
  ShieldCheck,
  ChevronRight,
  Star,
  Building2,
  Users,
  Activity
} from 'lucide-react';

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  allComplaints: Complaint[];
  onReportSubmitted: (newComplaint: Complaint) => void;
}

const SAMPLE_CIVIC_PHOTOS = [
  {
    name: '⚡ High-Voltage Electric Wire Bursting & Sparking',
    category: 'streetlight' as ComplaintCategory,
    url: '/11kv_wire_blast.svg',
    description: 'High-tension 11kV overhead electric wire snapped and bursting with violent explosive arcing and sparks across street, posing lethal electrocution and fire hazard'
  },
  {
    name: 'Asphalt Pothole & Road Hazard',
    category: 'pothole' as ComplaintCategory,
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    description: 'Deep hazardous asphalt pothole crater on main carriageway causing severe vehicle suspension impact and two-wheeler skidding risk'
  },
  {
    name: '🌊 Major Water Main Pipe Burst & Flooding',
    category: 'water_leak' as ComplaintCategory,
    url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
    description: 'Pressurized underground municipal water main pipe rupture bursting through road surface and flooding carriageway'
  },
  {
    name: 'Overflowing Waste Dump',
    category: 'garbage' as ComplaintCategory,
    url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    description: 'Uncollected refuse overflowing into pedestrian sidewalk causing obstruction'
  },
  {
    name: 'Intersection Traffic Signal & Luminaire Blackout',
    category: 'streetlight' as ComplaintCategory,
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    description: 'Major intersection traffic signal and overhead luminaire blacked out, causing severe vehicle congestion and pedestrian hazards'
  },
  {
    name: 'Damaged Public Facility',
    category: 'damaged_facility' as ComplaintCategory,
    url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80',
    description: 'Vandalized public transit shelter and shattered security glass'
  }
];

export const ReportProblemModal: React.FC<ReportProblemModalProps> = ({
  isOpen,
  onClose,
  allComplaints,
  onReportSubmitted
}) => {
  const { currentUser, userProfile } = useAuth();
  const { language, t } = useLanguage();
  
  const [photoUrl, setPhotoUrl] = useState<string>(SAMPLE_CIVIC_PHOTOS[0].url);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<ComplaintCategory>('pothole');
  const [ward, setWard] = useState<WardId>('Ward A');
  const [isManualCategory, setIsManualCategory] = useState(false);
  
  // Coordinates (defaults around PCMC / metro downtown)
  const [lat, setLat] = useState<number>(18.6298);
  const [lng, setLng] = useState<number>(73.7997);
  const [address, setAddress] = useState<string>('PCMC Main Station Road, Nigdi, Pimpri-Chinchwad');

  // AI Classification state
  const [isClassifying, setIsClassifying] = useState(false);
  const [aiResult, setAiResult] = useState<AIClassification | null>(null);

  // Duplicate & Multi-Person detection state
  const [nearbyDuplicates, setNearbyDuplicates] = useState<Complaint[]>([]);
  const [selectedDuplicate, setSelectedDuplicate] = useState<Complaint | null>(null);
  const [upvotedExisting, setUpvotedExisting] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const trustScore = userProfile?.trustScore ?? 85;
  const isTrustedReporter = trustScore >= 80;

  // Trigger GPS location capture
  useEffect(() => {
    if (isOpen) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLat(pos.coords.latitude);
            setLng(pos.coords.longitude);
            setAddress(`Current Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
          },
          () => {
            setLat(18.6298 + (Math.random() - 0.5) * 0.02);
            setLng(73.7997 + (Math.random() - 0.5) * 0.02);
            setAddress('PCMC Municipal Corporation Chowk, Pimpri');
          }
        );
      }
      // Run initial AI analysis on default sample
      runAiClassification(SAMPLE_CIVIC_PHOTOS[0].url, null, SAMPLE_CIVIC_PHOTOS[0].description);
      setDescription(SAMPLE_CIVIC_PHOTOS[0].description);
    }
  }, [isOpen]);

  // Check for geospatial duplicates whenever category or lat/lng changes
  useEffect(() => {
    if (lat && lng && category) {
      const dups = findNearbyDuplicates(allComplaints, category, lat, lng, 80);
      setNearbyDuplicates(dups);
      if (dups.length > 0) {
        setSelectedDuplicate(dups[0]);
      } else {
        setSelectedDuplicate(null);
      }
    }
  }, [lat, lng, category, allComplaints]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);

    try {
      const { dataUrl } = await compressImage(file, 1280, 960, 0.85);
      setPhotoBase64(dataUrl);
      setPhotoUrl(dataUrl);
      runAiClassification(dataUrl, dataUrl, description);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setPhotoBase64(base64);
        setPhotoUrl(base64);
        runAiClassification(base64, base64, description);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_CIVIC_PHOTOS[0]) => {
    setUploadedFile(null);
    setPhotoUrl(sample.url);
    setPhotoBase64(null);
    setDescription(sample.description);
    setCategory(sample.category);
    setIsManualCategory(false);
    runAiClassification(sample.url, null, sample.description, sample.category);
  };

  const runAiClassification = async (
    imgUrl: string,
    base64Data: string | null,
    textDesc: string,
    hintCategory?: ComplaintCategory
  ) => {
    setIsClassifying(true);
    try {
      const response = await fetch('/api/classify-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data || undefined,
          imageUrl: !base64Data ? imgUrl : undefined,
          description: textDesc,
          userCategory: hintCategory,
          nearbyComplaints: nearbyDuplicates.length > 0 ? nearbyDuplicates : undefined
        })
      });

      const data = await response.json();
      if (data.success && data.classification) {
        const cls: AIClassification = data.classification;
        setAiResult(cls);
        if (!isManualCategory && cls.label) {
          setCategory(cls.label);
        }
      }
    } catch (err) {
      console.warn('AI classification request error:', err);
    } finally {
      setIsClassifying(false);
    }
  };

  // Upvote the existing duplicate complaint instead of submitting duplicate
  const handleUpvoteExisting = async (dup: Complaint) => {
    if (!currentUser) return;
    try {
      await toggleUpvoteComplaint(dup.complaintId, currentUser.uid);
      setUpvotedExisting(true);
      confetti({ particleCount: 50, spread: 60 });
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to upvote duplicate.');
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError(language === 'hi' ? 'शिकायत दर्ज करने के लिए लॉगिन आवश्यक है।' : 'You must be logged in to submit a report.');
      return;
    }
    if (!description.trim()) {
      setError(language === 'hi' ? 'कृपया समस्या का विवरण दर्ज करें।' : 'Please provide a brief description.');
      return;
    }

    setIsSubmitting(true);
    setUploadStatusText(language === 'hi' ? 'फोटो अपलोड हो रहा है...' : 'Uploading evidence photo...');
    setError(null);

    try {
      let finalPhotoUrl = photoUrl || SAMPLE_CIVIC_PHOTOS[0].url;
      if (uploadedFile || photoBase64) {
        setUploadStatusText(language === 'hi' ? 'सुरक्षित स्टोरेज में सहेजा जा रहा है...' : 'Saving photo to Firebase Storage...');
        finalPhotoUrl = await uploadComplaintPhoto(uploadedFile || photoBase64 || photoUrl, currentUser.uid);
      }

      setUploadStatusText(language === 'hi' ? 'AI विश्लेषण और कार्य आदेश तैयार हो रहा है...' : 'Processing AI classification and dispatching...');

      // Calculate priority score
      const finalPriority = calculatePriorityScore(
        category,
        1,
        nearbyDuplicates.length > 0,
        aiResult?.severity
      );

      const assignedDept =
        aiResult?.suggestedDepartment ||
        CATEGORY_CONFIG[category]?.defaultDepartment ||
        'Public Works & Road Infrastructure';

      const newComplaintData: Omit<Complaint, 'complaintId'> = {
        reportedBy: currentUser.uid,
        reporterName: userProfile?.name || currentUser.displayName || 'Citizen',
        reporterCitizenId: userProfile?.citizenId || 'QLMT4821',
        category,
        ward,
        description: description.trim(),
        photoUrl: finalPhotoUrl,
        location: {
          lat,
          lng,
          address: address.trim(),
          ward
        },
        aiClassification: aiResult || {
          label: category,
          confidence: 0.94,
          aiDescription: `Visual analysis verified ${category} requiring municipal action.`,
          severity: category === 'pothole' ? 'high' : 'medium',
          suggestedDepartment: assignedDept,
          tags: [category, 'civic-report']
        },
        priorityScore: finalPriority,
        status: 'reported',
        assignedDepartment: assignedDept,
        upvotes: [currentUser.uid],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusTimeline: [
          {
            status: 'reported',
            timestamp: new Date().toISOString(),
            remarks: `Registered by Citizen #${userProfile?.citizenId || 'QLMT4821'} via CivicConnect AI`,
            updatedBy: userProfile?.name || 'Citizen'
          }
        ]
      };

      const docRef = await addDoc(collection(db, 'complaints'), newComplaintData);
      const createdComplaint: Complaint = {
        complaintId: docRef.id,
        ...newComplaintData
      };

      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      onReportSubmitted(createdComplaint);
      onClose();
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit complaint. Please retry.');
    } finally {
      setIsSubmitting(false);
      setUploadStatusText('');
    }
  };

  const currentPriorityPreview = calculatePriorityScore(
    category,
    1,
    nearbyDuplicates.length > 0,
    aiResult?.severity
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg leading-tight">
                  {t('report.title')}
                </h2>
                {isTrustedReporter && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                    <Star size={11} className="fill-amber-400" />
                    <span>{t('common.trustedReporter')}</span>
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs">
                {t('report.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmitReport} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Photo Evidence Section */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              {t('report.photoLabel')}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Photo Preview Card */}
              <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden aspect-video flex flex-col items-center justify-center group">
                {photoUrl ? (
                  <>
                    <img
                      src={photoUrl}
                      alt="Civic Issue"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-900 text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload size={14} />
                        <span>{language === 'hi' ? 'फोटो बदलें' : 'Change Photo'}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <Camera size={32} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-xs text-slate-600 font-medium">{t('report.dragDrop')}</p>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Sample Photo Pickers */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  {t('report.orChooseSample')}:
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {SAMPLE_CIVIC_PHOTOS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSample(sample)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        photoUrl === sample.url
                          ? 'border-blue-600 ring-2 ring-blue-400/50 scale-105 shadow-sm'
                          : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                      }`}
                      title={sample.name}
                    >
                      <img src={sample.url} alt={sample.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      {photoUrl === sample.url && (
                        <div className="absolute bottom-0 inset-x-0 bg-blue-600 text-white text-[9px] py-0.5 text-center font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mt-2 py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload size={14} />
                  <span>{t('report.takePhoto')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Advance AI Classification & Pothole Recognition */}
          <div className="bg-gradient-to-br from-indigo-50/80 via-blue-50/60 to-sky-50/80 rounded-xl p-4 border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-600" />
                <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                  {language === 'hi' ? 'एडवांस AI नागरिक दृष्टि व समस्या विश्लेषण' : 'Advance AI Civic Vision Analysis'}
                </span>
              </div>
              {isClassifying && (
                <span className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                  <RefreshCw size={12} className="animate-spin" />
                  <span>{language === 'hi' ? 'AI छवि विश्लेषण जारी...' : 'Analyzing image...'}</span>
                </span>
              )}
            </div>

            {aiResult && !isClassifying && (
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between bg-white/90 rounded-lg p-2.5 border border-blue-100 shadow-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">{language === 'hi' ? 'पहचानी गई श्रेणी' : 'Detected Category'}</span>
                    <span className="font-bold text-slate-900 capitalize text-sm">
                      {t(`cat.${aiResult.label}`) || CATEGORY_CONFIG[aiResult.label]?.label || aiResult.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[11px] block">{language === 'hi' ? 'AI सटीकता' : 'AI Confidence'}</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {Math.round(aiResult.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <p className="text-slate-700 italic bg-white/70 p-2.5 rounded-md border border-blue-100 text-[11px] leading-relaxed">
                  "{aiResult.aiDescription}"
                </p>

                {/* ADVANCED POTHOLE VISION RECOGNITION BADGE */}
                {(category === 'pothole' || aiResult.potholeAnalysis?.isPothole) && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-amber-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-900">
                      <Activity size={13} className="text-amber-600" />
                      <span>{t('report.aiPotholeAlert')}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-amber-900 pt-0.5">
                      <div>
                        <span className="text-slate-500 block">{t('report.depthEstimated')}:</span>
                        <strong className="font-medium text-amber-950">
                          {aiResult.potholeAnalysis?.estimatedDepth || '7-12 cm localized crater'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">{t('report.rimHazard')}:</span>
                        <strong className="font-medium text-red-700">
                          {aiResult.potholeAnalysis?.trafficHazard || 'High two-wheeler skid & rim damage risk'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
                  <span>
                    {language === 'hi' ? 'सुझाया गया विभाग' : 'Suggested Dept'}: <strong className="text-slate-900">{aiResult.suggestedDepartment || CATEGORY_CONFIG[category].defaultDepartment}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-semibold uppercase text-[10px] bg-blue-100 text-blue-800">
                    {language === 'hi' ? 'गंभीरता' : 'Severity'}: {aiResult.severity || 'Medium'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Multi-Person Complaints Correlation Alert */}
          {nearbyDuplicates.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-300 text-amber-950 space-y-3 animate-fade-in">
              <div className="flex items-start gap-2.5">
                <Users size={18} className="text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-amber-900 flex items-center gap-1.5">
                    <span>{t('report.multiPersonTitle')}</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-mono text-[10px]">
                      {nearbyDuplicates.length} {language === 'hi' ? 'नागरिक रिपोर्ट' : 'reports'}
                    </span>
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    {t('report.multiPersonNotice')}
                  </p>
                </div>
              </div>

              {selectedDuplicate && (
                <div className="bg-white/90 p-3 rounded-lg border border-amber-200 text-xs flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="font-semibold block text-slate-900 truncate">
                      "{selectedDuplicate.description}"
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {language === 'hi' ? 'दर्जकर्ता' : 'Reported by'}: <strong className="font-mono text-blue-700">#{selectedDuplicate.reporterCitizenId || 'Citizen'}</strong> • {selectedDuplicate.upvotes?.length || 1} {t('common.upvotes')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpvoteExisting(selectedDuplicate)}
                    disabled={upvotedExisting}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {upvotedExisting ? (
                      <>
                        <Check size={14} />
                        <span>{language === 'hi' ? 'समर्थन दिया गया!' : 'Supported!'}</span>
                      </>
                    ) : (
                      <>
                        <ThumbsUp size={14} />
                        <span>{t('report.upvoteInstead')} (+1)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. Category & Ward Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                {language === 'hi' ? 'समस्या श्रेणी' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as ComplaintCategory);
                  setIsManualCategory(true);
                }}
                className="w-full py-2 px-3 text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(Object.keys(CATEGORY_CONFIG) as ComplaintCategory[]).map((catKey) => (
                  <option key={catKey} value={catKey}>
                    {t(`cat.${catKey}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Building2 size={13} className="text-blue-600" />
                <span>{t('report.wardLabel')}</span>
              </label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value as WardId)}
                className="w-full py-2 px-3 text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {WARDS_DATA.map((w) => (
                  <option key={w.id} value={w.id}>
                    {language === 'hi' ? `${w.name} (${w.id})` : w.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              {t('report.addressLabel')}
            </label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('report.addressPlaceholder')}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              {t('report.descriptionLabel')}
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('report.descriptionPlaceholder')}
              className="w-full p-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 5. Priority Score Preview */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">
                {language === 'hi' ? 'गणना किया गया प्राथमिकता सूचकांक:' : 'Calculated Priority Index:'}
              </span>
              <span className="font-bold text-slate-800 text-xs sm:text-sm">
                Category Base ({CATEGORY_CONFIG[category].baseWeight}) + AI Severity {isTrustedReporter && '+ ⭐ Trusted Citizen (+5)'}
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono text-xl font-black text-blue-600">
                {currentPriorityPreview}/100
              </span>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">{uploadStatusText || t('report.submitting')}</span>
                </div>
              ) : (
                <>
                  <span>{t('report.submitBtn')}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
