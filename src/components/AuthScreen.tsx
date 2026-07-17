import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { audio } from '../utils/audio';

interface AuthScreenProps {
  onNext: () => void;
  avatarSrc?: string;
  key?: string;
}

const loginStages = [
  "Logging on...",
  "Loading your personal settings...",
  "Applying custom system preferences...",
  "Preparing desktop..."
];

export default function AuthScreen({ onNext, avatarSrc = '/aaa-avatar.png' }: AuthScreenProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [avatarError, setAvatarError] = useState(false);

  // Keyboard shortcut to skip directly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext]);

  useEffect(() => {
    // 1. Play the spectacular Windows XP Startup Sound on mount!
    audio.playStartupChime();

    // 2. Progress through the logging-on status messages
    const timers: NodeJS.Timeout[] = [];

    // Stage changes
    timers.push(setTimeout(() => setCurrentStageIndex(1), 1200));
    timers.push(setTimeout(() => setCurrentStageIndex(2), 2400));
    timers.push(setTimeout(() => setCurrentStageIndex(3), 3600));

    // Transition to Desktop
    const finalTimer = setTimeout(() => {
      onNext();
    }, 4800);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finalTimer);
    };
  }, [onNext]);

  return (
    <motion.div
      className="relative w-full h-screen bg-[#3a6ea5] flex flex-col justify-between select-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      id="xp-welcome-screen"
    >
      {/* Top Header Bar */}
      <div 
        className="w-full h-[12vh] flex items-end justify-center pb-4 relative"
        style={{
          background: 'linear-gradient(to bottom, #002275 0%, #002f93 70%, #003cc2 100%)',
          borderBottom: '2px solid #5a8eef'
        }}
        id="xp-welcome-header"
      >
        <div className="absolute bottom-2 left-6 text-[10px] text-white/30 font-mono tracking-widest uppercase">
          SYS_ERROR OS LOGIN // SYSTEM SECURE
        </div>
      </div>

      {/* Main Center Area */}
      <div 
        className="w-full flex-1 flex items-center justify-center relative"
        style={{
          background: 'radial-gradient(circle, #5b89eb 0%, #3e66c2 100%)'
        }}
        id="xp-welcome-center"
      >
        {/* Soft elegant white horizontal dividing glow */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[380px] bg-linear-to-b from-white/5 via-white/0 to-white/5 pointer-events-none" />

        <div className="max-w-4xl w-full px-12 grid grid-cols-2 items-center relative z-10" id="xp-welcome-layout">
          
          {/* Left Side: Windows XP Flag Emblem & Welcome Title */}
          <div className="flex flex-col items-end pr-16 border-r border-white/20" id="xp-welcome-left">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="flex flex-col items-end gap-3"
            >
              {/* Authentic Windows XP Wavy Colored Flag Emblem */}
              <svg 
                className="w-24 h-24 drop-shadow-[3px_5px_6px_rgba(0,0,0,0.35)] mb-2" 
                viewBox="0 0 100 100" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Red top-left */}
                <path 
                  d="M18 24 C 28 19, 38 28, 48 24 L 48 48 C 38 52, 28 43, 18 48 Z" 
                  fill="#f14124" 
                />
                {/* Green top-right */}
                <path 
                  d="M52 24 C 62 28, 72 19, 82 24 L 82 48 C 72 43, 62 52, 52 48 Z" 
                  fill="#4caf50" 
                />
                {/* Blue bottom-left */}
                <path 
                  d="M18 52 C 28 47, 38 56, 48 52 L 48 76 C 38 80, 28 71, 18 76 Z" 
                  fill="#00a2ed" 
                />
                {/* Yellow bottom-right */}
                <path 
                  d="M52 52 C 62 56, 72 47, 82 52 L 82 76 C 72 71, 62 80, 52 76 Z" 
                  fill="#ffb300" 
                />
                
                {/* Orange/Yellow trailing lines behind the flag for retro speed trail effect */}
                <path d="M 12 36 L 16 36" stroke="#ffb300" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                <path d="M 8 46 L 15 46" stroke="#ffb300" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
                <path d="M 10 56 L 14 56" stroke="#ffb300" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
              </svg>

              <h1 className="text-white text-5xl font-light tracking-wide font-sans select-none drop-shadow-[1px_2px_3px_rgba(0,0,0,0.4)]">
                Welcome
              </h1>
            </motion.div>
          </div>

          {/* Right Side: Avatar, User Details, and Loading Message */}
          <div className="flex flex-col items-start pl-16 justify-center" id="xp-welcome-right">
            <div className="flex items-center gap-6" id="xp-welcome-user-card">
              {/* Account Picture Box with authentic Windows XP blue frame + white inner border */}
              <div 
                className="w-20 h-20 rounded-md p-[2px] bg-[#4da1ff] border border-white shadow-[1px_3px_8px_rgba(0,0,0,0.3)] overflow-hidden flex items-center justify-center relative group"
                id="xp-welcome-avatar"
              >
                {!avatarError ? (
                  <img 
                    src={avatarSrc} 
                    onError={() => setAvatarError(true)}
                    className="w-full h-full object-cover rounded-sm select-none pointer-events-none" 
                    alt="User Account"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  // Elegant retro fallback character silhouette if image fails
                  <div className="w-full h-full bg-linear-to-b from-sky-400 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl font-mono">A</span>
                  </div>
                )}
              </div>

              {/* Username & Sequenced Status messages */}
              <div className="flex flex-col gap-1.5" id="xp-welcome-status-box">
                <div className="flex items-center gap-2">
                  <span className="text-white text-2xl font-bold font-sans drop-shadow-[1px_2px_2px_rgba(0,0,0,0.3)] select-none">
                    A.A.A STUDIO
                  </span>
                  {/* Subtle glossy arrow badge next to username */}
                  <div className="w-4 h-4 rounded-xs bg-linear-to-b from-[#3a96ff] to-[#0055d4] border border-[#002f93] flex items-center justify-center shadow-xs">
                    <div className="w-1.5 h-1.5 border-t border-r border-white transform rotate-45 translate-x-[-1px] translate-y-[0px]" />
                  </div>
                </div>

                {/* Loading status text with authentic Windows XP font weight and colors */}
                <div className="h-6 flex items-center overflow-hidden" id="xp-welcome-anim-box">
                  <motion.span
                    key={currentStageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    className="text-sky-100 font-sans text-sm select-none tracking-wide text-shadow-sm font-medium"
                  >
                    {loginStages[currentStageIndex]}
                  </motion.span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Footer Bar */}
      <div 
        className="w-full h-[12vh] flex items-start justify-between px-12 pt-4 relative"
        style={{
          background: 'linear-gradient(to top, #002275 0%, #002f93 70%, #003cc2 100%)',
          borderTop: '2px solid #ff7a00' // Iconic orange-gold accent separation strip
        }}
        id="xp-welcome-footer"
      >
        <div className="text-[11px] text-[#ffc68a] font-sans font-medium">
          A.A.A Studio Human-Machine Installation System
        </div>
        <div className="text-[10px] text-white/30 font-mono">
          © 2026 A.A.A STUDIO // SYSTEM_BOOT_SUCCESS_OK
        </div>
      </div>
    </motion.div>
  );
}
