import React, { useState } from 'react';
import type { ComplaintCategory, ComplaintStatus } from '../types';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '../types';
import { ImageOff, Sparkles } from 'lucide-react';

export const CATEGORY_FALLBACK_PHOTOS: Record<ComplaintCategory, string> = {
  pothole: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
  garbage: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
  streetlight: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
  water_leak: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
  damaged_facility: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80'
};

interface ComplaintImageProps {
  src?: string | null;
  alt: string;
  category?: ComplaintCategory;
  status?: ComplaintStatus;
  priorityScore?: number;
  className?: string;
  containerClassName?: string;
  showBadges?: boolean;
}

export const ComplaintImage: React.FC<ComplaintImageProps> = ({
  src,
  alt,
  category = 'pothole',
  status,
  priorityScore,
  className = 'w-full h-full object-cover',
  containerClassName = 'w-full h-48 sm:h-52 relative shrink-0 block bg-slate-100 overflow-hidden',
  showBadges = true
}) => {
  const fallbackUrl = CATEGORY_FALLBACK_PHOTOS[category] || CATEGORY_FALLBACK_PHOTOS.pothole;
  const initialSrc = src && src.trim().length > 0 ? src : fallbackUrl;
  
  const [imgSrc, setImgSrc] = useState<string>(initialSrc);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // If the src prop changes dynamically, update
  React.useEffect(() => {
    if (src && src.trim().length > 0) {
      setImgSrc(src);
      setHasError(false);
      setIsLoading(true);
    } else {
      setImgSrc(fallbackUrl);
    }
  }, [src, fallbackUrl]);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackUrl);
    }
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const statusInfo = status ? STATUS_CONFIG[status] : undefined;

  return (
    <div className={`${containerClassName} isolate group`}>
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse z-0" />
      )}

      {/* Actual Image */}
      <img
        src={imgSrc}
        alt={alt}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={`${className} transition-transform duration-300 group-hover:scale-105 relative z-0`}
      />

      {/* Fallback watermark if image had error */}
      {hasError && (
        <div className="absolute bottom-2 left-2 z-10 bg-slate-900/75 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-slate-300 flex items-center gap-1">
          <ImageOff size={11} className="text-amber-400" />
          <span>Verified Photo Archive</span>
        </div>
      )}

      {/* Top Badges Overlay */}
      {showBadges && (
        <>
          {/* Status Pill Badge (Top-Left) */}
          {statusInfo && (
            <div className="absolute top-3 left-3 z-10">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-md backdrop-blur-xs flex items-center gap-1 ${statusInfo.bgColor}`}>
                <span>{statusInfo.label}</span>
              </span>
            </div>
          )}

          {/* Priority Score Badge (Top-Right) */}
          {priorityScore !== undefined && (
            <div className="absolute top-3 right-3 z-10">
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-white font-mono text-[11px] font-bold border border-white/20 shadow-md">
                Priority {priorityScore}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
