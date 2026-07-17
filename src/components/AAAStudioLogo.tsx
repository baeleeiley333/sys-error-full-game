import React, { useState } from 'react';

interface AAAStudioLogoProps {
  className?: string;
  glow?: boolean;
  src?: string;
}

export default function AAAStudioLogo({ 
  className = "w-24 h-24", 
  glow = false, 
  src = "/aaa-avatar.png" 
}: AAAStudioLogoProps) {
  const [imgError, setImgError] = useState(false);

  // If a src is provided and hasn't errored out, try rendering the image
  const showImage = src && !imgError;

  return (
    <div 
      className={`relative flex items-center justify-center p-2.5 rounded-[18%] transition-all duration-300 overflow-hidden ${className}`}
      style={{
        background: 'radial-gradient(circle, #ffffff 30%, #fffce8 65%, #ffeb99 100%)',
        border: '4px solid #fcd34d',
        boxShadow: 'inset 0 1px 4px rgba(255,255,255,0.9), 0 4px 10px rgba(0,0,0,0.15)',
      }}
    >
      {showImage ? (
        <img 
          src={src} 
          alt="AAA Studio Logo" 
          className="w-full h-full object-cover rounded-[12%]"
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        /* Hand-drawn minimalist swirl face */
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full text-black stroke-[4] fill-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          xmlns="http://www.w3.org/2000/svg"
          id="aaa-studio-svg-logo"
        >
          {/* Left Spiral Eye */}
          <path 
            d="M 28,45 
               C 22,35 38,25 44,38 
               C 48,48 34,56 28,46 
               C 24,38 35,32 38,38 
               C 39,41 36,44 34,42" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          
          {/* Right Spiral Eye */}
          <path 
            d="M 72,45 
               C 78,35 62,25 56,38 
               C 52,48 66,56 72,46 
               C 76,38 65,32 62,38 
               C 61,41 64,44 66,42" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Squiggly mouth/nose curl in the middle-bottom */}
          <path 
            d="M 46,54 
               C 43,62 55,62 53,58 
               C 50,54 44,52 48,64 
               C 49,67 52,67 53,64" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      )}

      {/* Subtle overlay reflection for a glossy, museum-installation glass look */}
      <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/10 to-white/30 pointer-events-none rounded-[18%]" />
      
      {glow && (
        <div className="absolute -inset-1.5 bg-yellow-400/30 rounded-[22%] blur-xs pointer-events-none transition-all duration-300 animate-pulse" />
      )}
    </div>
  );
}
