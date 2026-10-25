import React from 'react';
import './TypewriterBranding.css';

/** Left-aligned login-page title and chapter label. */
export const TypewriterBranding: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative -top-2 flex w-full flex-col items-start text-left select-none ${className}`} role="banner">
    <h1 className="login-brand-title text-[clamp(2rem,4.5vw,3rem)] font-black leading-none tracking-tight text-black">
      GDGoC TaskHub
    </h1>
    <p className="mt-2 text-sm font-semibold leading-tight tracking-[0.12em] text-black sm:text-base">
      GDGoC PSIT
    </p>
  </div>
);
