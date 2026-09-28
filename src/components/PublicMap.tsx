import React, { useState, useEffect, useRef } from 'react';
import type { Complaint, ComplaintCategory, ComplaintStatus, PredictiveHotspot } from '../types';
import { CATEGORY_CONFIG, STATUS_CONFIG, WARDS_DATA } from '../types';
import { toggleUpvoteComplaint, computePredictiveHotspots } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ComplaintImage } from './ComplaintImage';
import {
  MapPin,
  ThumbsUp,
  Filter,
  Layers,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  Flame,
  ShieldAlert,
  Zap,
  Activity,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import L from 'leaflet';

interface PublicMapProps {
  complaints: Complaint[];
  onSelectComplaint?: (c: Complaint) => void;
}

export const PublicMap: React.FC<PublicMapProps> = ({ complaints, onSelectComplaint }) => {
  const { currentUser } = useAuth();
  const { language, t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const hotspotsGroupRef = useRef<L.LayerGroup | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showRiskForecast, setShowRiskForecast] = useState<boolean>(true);
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<PredictiveHotspot | null>(null);

  const filteredComplaints = complaints.filter((c) => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
    return true;
  });

  const hotspots = computePredictiveHotspots(complaints);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center around PCMC Pune / default city coordinates
    const defaultCenter: [number, number] = [18.6298, 73.7997];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | CivicConnect AI',
      maxZoom: 19
    }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    hotspotsGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map markers whenever complaints or filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const bounds: [number, number][] = [];

    filteredComplaints.forEach((comp) => {
      const { lat, lng } = comp.location;
      if (!lat || !lng) return;

      bounds.push([lat, lng]);

      // Determine pin color based on status
      let pinColor = '#f59e0b'; // amber for reported
      if (comp.status === 'verified') pinColor = '#3b82f6'; // blue
      if (comp.status === 'assigned') pinColor = '#6366f1'; // indigo
      if (comp.status === 'in_progress') pinColor = '#a855f7'; // purple
      if (comp.status === 'resolved') pinColor = '#10b981'; // emerald

      // Create custom SVG marker icon
      const customIcon = L.divIcon({
        className: 'custom-civic-pin',
        html: `
          <div style="
            background-color: ${pinColor};
            width: 28px;
            height: 28px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2.5px solid white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background-color: white;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        setActiveHotspot(null);
        setActiveComplaint(comp);
        map.setView([lat, lng], 15, { animate: true });
      });

      markersGroup.addLayer(marker);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [filteredComplaints]);

  // Update Predictive Hotspot Overlays
  useEffect(() => {
    const map = mapInstanceRef.current;
    const hotspotsGroup = hotspotsGroupRef.current;
    if (!map || !hotspotsGroup) return;

    hotspotsGroup.clearLayers();

    if (!showRiskForecast) return;

    hotspots.forEach((hs) => {
      const color = hs.riskLevel === 'critical' ? '#ef4444' : hs.riskLevel === 'high' ? '#f59e0b' : '#3b82f6';
      
      // Outer translucent pulsing circle
      const circle = L.circle([hs.centerLat, hs.centerLng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.18,
        weight: 2,
        dashArray: '6, 6',
        radius: hs.radiusMeters
      });

      // Inner pulsating hotspot badge
      const pulseIcon = L.divIcon({
        className: 'custom-hotspot-pin',
        html: `
          <div style="
            background: ${color};
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 0 16px ${color};
            border: 2px solid white;
            cursor: pointer;
            white-space: nowrap;
          ">
            <span>🔥</span>
            <span>${hs.riskLevel.toUpperCase()} RISK (${hs.complaintCount})</span>
          </div>
        `,
        iconSize: [120, 24],
        iconAnchor: [60, 12]
      });

      const centerMarker = L.marker([hs.centerLat, hs.centerLng], { icon: pulseIcon });

      const handleClick = () => {
        setActiveComplaint(null);
        setActiveHotspot(hs);
        map.setView([hs.centerLat, hs.centerLng], 15, { animate: true });
      };

      circle.on('click', handleClick);
      centerMarker.on('click', handleClick);

      hotspotsGroup.addLayer(circle);
      hotspotsGroup.addLayer(centerMarker);
    });
  }, [showRiskForecast, hotspots]);

  const handleUpvote = async (comp: Complaint) => {
    if (!currentUser) return;
    try {
      await toggleUpvoteComplaint(comp.complaintId, currentUser.uid);
      const isUpvoted = comp.upvotes?.includes(currentUser.uid);
      const newUpvotes = isUpvoted
        ? comp.upvotes.filter((u) => u !== currentUser.uid)
        : [...(comp.upvotes || []), currentUser.uid];
      setActiveComplaint({ ...comp, upvotes: newUpvotes });
    } catch (err) {
      console.error('Upvote error:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      
      {/* Map Controls Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-slate-900 text-xl flex items-center gap-2">
              <MapPin size={22} className="text-blue-600" />
              <span>{t('map.title')}</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              AI Risk Forecast
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('map.subtitle')}
          </p>
        </div>

        {/* Filters & Risk Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Predictive Hotspots Risk Forecast Toggle */}
          <button
            onClick={() => setShowRiskForecast(!showRiskForecast)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              showRiskForecast
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white border-transparent shadow-sm'
                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
            }`}
          >
            <Flame size={15} className={showRiskForecast ? 'animate-pulse text-yellow-300' : 'text-slate-500'} />
            <span>{t('common.riskForecast')}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 text-white font-mono">
              {hotspots.length}
            </span>
          </button>

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

      {/* Map Container with Floating Pin Card & Hotspot Card */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-lg h-[650px] bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Legend Overlay */}
        <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-md rounded-xl p-3.5 shadow-md border border-slate-200 text-[11px] space-y-2 hidden sm:block max-w-[210px]">
          <span className="font-bold text-slate-800 uppercase tracking-wider block">
            {language === 'mr' ? 'नकाशा सूची (Legend)' : 'Map & Risk Legend'}
          </span>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Reported Issue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Resolved Site</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
              <span className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-300" />
              <span className="font-semibold text-red-700">Predictive Hotspot</span>
            </div>
          </div>
        </div>

        {/* Selected Complaint Floating Card */}
        {activeComplaint && (
          <div className="absolute bottom-6 left-6 right-6 sm:right-auto sm:w-96 z-10 bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase text-white ${STATUS_CONFIG[activeComplaint.status]?.bgColor}`}>
                  {t(`status.${activeComplaint.status}`)}
                </span>
                {activeComplaint.ward && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    {activeComplaint.ward}
                  </span>
                )}
              </div>
              <button
                onClick={() => setActiveComplaint(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-3 mb-3">
              <ComplaintImage
                src={activeComplaint.photoUrl}
                alt="Reported"
                category={activeComplaint.category}
                showBadges={false}
                containerClassName="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0 relative"
              />
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-blue-700 uppercase block">
                  {t(`cat.${activeComplaint.category}`)}
                </span>
                <p className="text-xs font-semibold text-slate-900 line-clamp-2 mt-0.5">
                  {activeComplaint.description}
                </p>
                <span className="text-[11px] text-slate-400 block mt-1 truncate">
                  {activeComplaint.location.address}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-500">
                Priority: <strong className="font-mono text-blue-700">{activeComplaint.priorityScore}</strong>
              </span>

              <button
                onClick={() => handleUpvote(activeComplaint)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  currentUser && activeComplaint.upvotes?.includes(currentUser.uid)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <ThumbsUp size={13} />
                <span>Upvote ({activeComplaint.upvotes?.length || 1})</span>
              </button>
            </div>
          </div>
        )}

        {/* Selected Predictive Hotspot Floating Inspector Card */}
        {activeHotspot && (
          <div className="absolute bottom-6 left-6 right-6 sm:right-auto sm:w-[420px] z-10 bg-slate-900 text-white rounded-2xl p-5 shadow-2xl border-2 border-red-500/50 animate-fade-in space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                  🔥 {activeHotspot.riskLevel.toUpperCase()} HOTSPOT
                </span>
                <span className="text-[11px] font-bold text-amber-300">
                  {activeHotspot.affectedWard}
                </span>
              </div>
              <button
                onClick={() => setActiveHotspot(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <h3 className="font-black text-sm text-white">
                {language === 'mr' ? activeHotspot.marathiTitle : activeHotspot.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {language === 'mr' ? activeHotspot.marathiDescription : activeHotspot.description}
              </p>
            </div>

            {/* Recommended Municipal Remediation */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1">
                <ShieldAlert size={12} />
                <span>{language === 'mr' ? 'शिफारस केलेली प्रतिबंधात्मक उपाययोजना' : 'Recommended Municipal Action'}</span>
              </span>
              <p className="text-slate-300">
                {language === 'mr' ? activeHotspot.marathiRecommendedAction : activeHotspot.recommendedAction}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">
                Cluster Count: <strong className="text-white font-mono">{activeHotspot.complaintCount} Grievances</strong>
              </span>
              <button
                onClick={() => setSelectedCategory(activeHotspot.category)}
                className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
              >
                <span>Filter Issues</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
