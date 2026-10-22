import React from 'react';
import './MarqueeStrip.css';

/**
 * MarqueeStrip
 * 
 * Elegant black pill strip with repeating text:
 *   ✨ BUILD • GROW • CONNECT • ✨ BUILD • GROW • CONNECT •
 * 
 * Features:
 *   - Dark charcoal background (#202124)
 *   - Bold white uppercase tracking
 *   - Subtle Google-color separators (Yellow sparkles, Blue/Green/Red dots)
 *   - Seamless continuous loop animated strictly from LEFT TO RIGHT
 *   - Stationary pill container; only text tracks animate
 *   - Respects prefers-reduced-motion
 */
export const MarqueeStrip: React.FC<{ className?: string }> = ({ className = '' }) => {
  const content = (
    <div className="marquee-track-content">
      <span className="text-[#FBBC04] text-xs">✨</span>
      <span className="font-extrabold tracking-wider text-[11px] text-white">BUILD</span>
      <span className="text-[#4285F4] text-[10px]">•</span>
      <span className="font-extrabold tracking-wider text-[11px] text-white">GROW</span>
      <span className="text-[#34A853] text-[10px]">•</span>
      <span className="font-extrabold tracking-wider text-[11px] text-white">CONNECT</span>
      <span className="text-[#EA4335] text-[10px]">•</span>
      <span className="text-[#FBBC04] text-xs">✨</span>
      <span className="font-extrabold tracking-wider text-[11px] text-white">BUILD</span>
      <span className="text-[#4285F4] text-[10px]">•</span>
      <span className="font-extrabold tracking-wider text-[11px] text-white">GROW</span>
      <span className="text-[#34A853] text-[10px]">•</span>
      <span className="font-extrabold tracking-wider text-[11px] text-white">CONNECT</span>
      <span className="text-[#FBBC04] text-[10px]">•</span>
    </div>
  );

  return (
    <div className={`marquee-strip-container ${className}`} aria-label="Community pillars: Build, Grow, Connect">
      <div className="marquee-track-wrapper">
        {content}
        {content}
      </div>
    </div>
  );
};
