import React from 'react';
import './StampBranding.css';

/**
 * StampBranding
 * 
 * Bold, distressed rubber-stamp typography branding:
 *   - Line 1: "GDGoC TASKFLOW" (large, prominent)
 *   - Line 2: "GDGoC PSIT" (underneath, bold, cohesive)
 * 
 * Styled with Google-inspired Blue (#4285F4), Green (#34A853), and Yellow (#FBBC04)
 * with authentic worn rubber-stamp ink texture and readable off-white interiors.
 * No boxed borders or sticker frames — pure stamped ink aesthetic.
 */
export const StampBranding: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div 
      className={`stamp-container ${className}`} 
      role="img" 
      aria-label="GDGoC TASKFLOW — GDGoC PSIT Google Stamped Branding"
    >
      <svg
        className="stamp-svg"
        viewBox="0 0 440 135"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Multi-stop Google-inspired ink gradient for line 1 */}
          <linearGradient id="google-stamp-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4285F4" />
            <stop offset="35%" stopColor="#4285F4" />
            <stop offset="65%" stopColor="#34A853" />
            <stop offset="100%" stopColor="#FBBC04" />
          </linearGradient>

          {/* Google-inspired ink gradient for line 2 */}
          <linearGradient id="google-stamp-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4285F4" />
            <stop offset="50%" stopColor="#FBBC04" />
            <stop offset="100%" stopColor="#34A853" />
          </linearGradient>

          {/* Distress turbulence & displacement filter */}
          <filter id="google-stamp-distress" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.045 0.075"
              numOctaves="3"
              seed="29"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="2.6"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
          </filter>

          {/* Micro-distress ink void mask */}
          <mask id="google-stamp-mask">
            <rect x="0" y="0" width="440" height="135" fill="#FFFFFF" />
            {/* Random small ink voids punching through the letterforms */}
            <g fill="#000000" opacity="0.8">
              <circle cx="48" cy="36" r="1.5" />
              <circle cx="88" cy="48" r="1.2" />
              <circle cx="132" cy="28" r="1.6" />
              <circle cx="164" cy="52" r="1.3" />
              <circle cx="198" cy="34" r="1.8" />
              <circle cx="236" cy="46" r="1.4" />
              <circle cx="270" cy="30" r="1.7" />
              <circle cx="312" cy="50" r="1.3" />
              <circle cx="348" cy="34" r="1.5" />
              <circle cx="388" cy="48" r="1.4" />

              <circle cx="110" cy="98" r="1.4" />
              <circle cx="156" cy="106" r="1.3" />
              <circle cx="204" cy="96" r="1.6" />
              <circle cx="254" cy="104" r="1.4" />
              <circle cx="304" cy="98" r="1.5" />

              <ellipse cx="142" cy="42" rx="2.5" ry="0.8" transform="rotate(-15 142 42)" />
              <ellipse cx="282" cy="44" rx="2.8" ry="0.9" transform="rotate(20 282 44)" />
              <ellipse cx="225" cy="100" rx="3.0" ry="0.8" transform="rotate(-10 225 100)" />
            </g>
          </mask>
        </defs>

        {/* Group with stamped-ink distress and ink voids */}
        <g filter="url(#google-stamp-distress)" mask="url(#google-stamp-mask)">
          
          {/* Playful stamp energy / impact accent marks (like in reference) */}
          <g strokeWidth="2.8" strokeLinecap="round" opacity="0.75">
            {/* Top-left blue accent rays */}
            <line x1="28" y1="20" x2="16" y2="12" stroke="#4285F4" />
            <line x1="36" y1="12" x2="32" y2="2" stroke="#EA4335" />
            <line x1="48" y1="8" x2="52" y2="0" stroke="#FBBC04" />

            {/* Top-right green/yellow accent rays */}
            <line x1="392" y1="10" x2="400" y2="2" stroke="#34A853" />
            <line x1="406" y1="16" x2="418" y2="10" stroke="#FBBC04" />
            <line x1="412" y1="26" x2="424" y2="24" stroke="#4285F4" />
          </g>

          {/* =================================================================
              LINE 1: "GDGoC TASKFLOW"
              ================================================================= */}
          
          {/* 1A. Deep directional drop-shadow */}
          <text
            x="222"
            y="54"
            className="stamp-line1"
            fill="#202124"
            opacity="0.38"
          >
            GDGoC TASKFLOW
          </text>

          {/* 1B. Heavy Google-Colored Ink Outline */}
          <text
            x="220"
            y="51"
            className="stamp-line1"
            fill="url(#google-stamp-grad-1)"
            stroke="url(#google-stamp-grad-1)"
            strokeWidth="6"
            strokeLinejoin="round"
          >
            GDGoC TASKFLOW
          </text>

          {/* 1C. Readable Off-White Interior with Subtle Inner Bevel */}
          <text
            x="220"
            y="51"
            className="stamp-line1"
            fill="#F8F9FA"
            stroke="#202124"
            strokeWidth="0.8"
            strokeOpacity="0.35"
          >
            GDGoC TASKFLOW
          </text>

          {/* =================================================================
              LINE 2: "GDGoC PSIT" (Directly underneath)
              ================================================================= */}
          
          {/* 2A. Directional drop-shadow */}
          <text
            x="222"
            y="105"
            className="stamp-line2"
            fill="#202124"
            opacity="0.35"
          >
            GDGoC PSIT
          </text>

          {/* 2B. Google-Colored Ink Outline */}
          <text
            x="220"
            y="102"
            className="stamp-line2"
            fill="url(#google-stamp-grad-2)"
            stroke="url(#google-stamp-grad-2)"
            strokeWidth="5"
            strokeLinejoin="round"
          >
            GDGoC PSIT
          </text>

          {/* 2C. Readable Off-White Interior */}
          <text
            x="220"
            y="102"
            className="stamp-line2"
            fill="#F8F9FA"
            stroke="#202124"
            strokeWidth="0.7"
            strokeOpacity="0.35"
          >
            GDGoC PSIT
          </text>

        </g>
      </svg>
    </div>
  );
};
