import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  subtitleText?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  showSubtitle = true,
  subtitleText = 'PSIT Kanpur Chapter',
}) => {
  const iconSizeClasses = { sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-11 h-11' };

  const titleSizeClasses = {
    sm: 'text-base font-bold',
    md: 'text-lg font-extrabold',
    lg: 'text-2xl font-extrabold',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <img className="taskhub-logo-mark flex-shrink-0" src="/gdgoc-siliguri-transparent.png" alt="" />

      <div className="flex flex-col leading-tight">
        <div className={`flex items-center gap-2 tracking-tight font-extrabold ${titleSizeClasses[size]}`}>
          <span className="login-gdgoc-wordmark" aria-label="GDGoC">
            <span>G</span><span>D</span><span>G</span><span>o</span><span>C</span>
          </span>
          <span className="taskhub-wordmark">TaskHub</span>
        </div>
        {showSubtitle && (
          <span className="logo-subtitle text-[11px] text-gdgoc-gray-600 font-medium tracking-wide">
            {subtitleText}
          </span>
        )}
      </div>
    </div>
  );
};
