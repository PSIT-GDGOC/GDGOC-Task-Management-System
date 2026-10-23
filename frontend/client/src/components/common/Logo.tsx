import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  showSubtitle = true 
}) => {
  const iconSizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const titleSizeClasses = {
    sm: 'text-base font-semibold',
    md: 'text-lg font-bold',
    lg: 'text-2xl font-bold',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Google 4-Color Geometric Brackets / Emblem */}
      <div className={`relative ${iconSizeClasses[size]} flex items-center justify-center rounded-lg bg-white shadow-sm border border-gdgoc-gray-200 p-1 flex-shrink-0`}>
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Left bracket: Red */}
          <path d="M14 24L22 16L18.5 12.5L7 24L18.5 35.5L22 32L14 24Z" fill="#EA4335" />
          {/* Right bracket: Blue */}
          <path d="M34 24L26 32L29.5 35.5L41 24L29.5 12.5L26 16L34 24Z" fill="#4285F4" />
          {/* Top accent: Green */}
          <rect x="21" y="9" width="6" height="5" rx="1.5" transform="rotate(45 24 11.5)" fill="#34A853" />
          {/* Bottom accent: Yellow */}
          <rect x="21" y="34" width="6" height="5" rx="1.5" transform="rotate(-45 24 36.5)" fill="#FBBC04" />
        </svg>
      </div>

      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="text-gdgoc-gray-900 font-semibold tracking-tight">GDGoC</span>
          <span className={`${titleSizeClasses[size]} text-gdgoc-blue tracking-tight`}>TaskHub</span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] text-gdgoc-gray-600 font-medium tracking-wide uppercase">
            PSIT Kanpur Chapter
          </span>
        )}
      </div>
    </div>
  );
};
