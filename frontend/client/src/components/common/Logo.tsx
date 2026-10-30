import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  showSubtitle = true 
}) => {
  const iconSizeClasses = {
    sm: 'w-7 h-7 rounded-lg p-1',
    md: 'w-9 h-9 rounded-lg p-1',
    lg: 'w-12 h-12 rounded-xl p-1.5',
    xl: 'w-14 h-14 rounded-2xl p-2',
  };

  const titleSizeClasses = {
    sm: 'text-base font-bold',
    md: 'text-lg font-extrabold',
    lg: 'text-2xl sm:text-3xl font-black',
    xl: 'text-3xl sm:text-4xl font-black',
  };

  const subtitleSizeClasses = {
    sm: 'text-[11px]',
    md: 'text-[11px]',
    lg: 'text-xs sm:text-[13px] tracking-wider font-semibold',
    xl: 'text-xs sm:text-sm tracking-widest font-bold',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Google 4-Color Geometric Brackets / Emblem */}
      <div className={`relative ${iconSizeClasses[size]} flex items-center justify-center bg-white dark:bg-white/10 shadow-2xs border border-gdgoc-gray-200 dark:border-white/15 flex-shrink-0 transition-colors`}>
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
        <div className={`flex items-center gap-1.5 tracking-tight ${titleSizeClasses[size]}`}>
          {/* GDGoC with Google Brand Colors */}
          <span className="inline-flex">
            <span style={{ color: '#4285F4' }}>G</span>
            <span style={{ color: '#EA4335' }}>D</span>
            <span style={{ color: '#FBBC04' }}>G</span>
            <span style={{ color: '#4285F4' }}>o</span>
            <span style={{ color: '#34A853' }}>C</span>
          </span>

          {/* TaskHub with Google Brand Colors */}
          <span className="inline-flex">
            <span style={{ color: '#4285F4' }}>T</span>
            <span style={{ color: '#EA4335' }}>a</span>
            <span style={{ color: '#FBBC04' }}>s</span>
            <span style={{ color: '#34A853' }}>k</span>
            <span style={{ color: '#4285F4' }}>H</span>
            <span style={{ color: '#EA4335' }}>u</span>
            <span style={{ color: '#34A853' }}>b</span>
          </span>
        </div>
        {showSubtitle && (
          <span className={`${subtitleSizeClasses[size]} text-gdgoc-gray-600 dark:text-gray-400 uppercase pt-0.5`}>
            PSIT Kanpur Chapter
          </span>
        )}
      </div>
    </div>
  );
};
