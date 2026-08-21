import React, { useState, useEffect, useRef } from 'react';
import type { Complaint, ComplaintCategory, ComplaintStatus } from '../types';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '../types';
import { toggleUpvoteComplaint } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { MapPin, ThumbsUp, Filter, Layers, CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';
import L from 'leaflet';

interface PublicMapProps {
  complaints: Complaint[];
  onSelectComplaint?: (c: Complaint) => void;
}

export const PublicMap: React.FC<PublicMapProps> = ({ complaints, onSelectComplaint }) => {
  const { currentUser } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);

  const filteredComplaints = complaints.filter((c) => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
    return true;
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center around default metro coordinates
    const defaultCenter: [number, number] = [37.7749, -122.4194];

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
        setActiveComplaint(comp);
        map.setView([lat, lng], 15, { animate: true });
      });

      markersGroup.addLayer(marker);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [filteredComplaints]);

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
          <h2 className="font-extrabold text-slate-900 text-xl flex items-center gap-2">
            <MapPin size={22} className="text-blue-600" />
            <span>Public Civic Issue Map</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Geospatial citywide visualization of reported problems and municipal resolution statuses
          </p>
        </div>

        {/* Filters */}
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

      {/* Map Container with Floating Pin Card */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-lg h-[650px] bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Legend Overlay */}
        <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-md border border-slate-200 text-[11px] space-y-1.5 hidden sm:block">
          <span className="font-bold text-slate-800 uppercase tracking-wider block mb-1">
            Status Legend
          </span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Reported</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500" />
            <span>Assigned</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Resolved</span>
          </div>
        </div>

        {/* Selected Complaint Floating Card */}
        {activeComplaint && (
          <div className="absolute bottom-6 left-6 right-6 sm:right-auto sm:w-96 z-10 bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex justify-between items-start mb-3">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase text-white ${STATUS_CONFIG[activeComplaint.status]?.bgColor}`}>
                {STATUS_CONFIG[activeComplaint.status]?.label}
              </span>
              <button
                onClick={() => setActiveComplaint(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-3 mb-3">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                <img src={activeComplaint.photoUrl} alt="Reported" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-blue-700 uppercase block">
                  {CATEGORY_CONFIG[activeComplaint.category]?.label}
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
      </div>
    </div>
  );
};
