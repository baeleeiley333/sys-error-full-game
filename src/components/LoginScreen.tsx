import React, { useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import AAAStudioLogo from './AAAStudioLogo';
import { armPressWait, disarmPressWait } from '../utils/gameIdleReset';

declare global {
  interface Window {
    SYS_ERROR_ADVANCE?: {
      arm: (fn: () => void, opts?: { anyKey?: boolean }) => void;
      disarm: () => void;
    };
  }
}

interface LoginScreenProps {
  onNext: () => void;
  avatarSrc?: string;
  key?: string;
}

export default function LoginScreen({ onNext, avatarSrc }: LoginScreenProps) {
  const handleLogin = useCallback(() => {
    disarmPressWait();
    onNext();
  }, [onNext]);

  useEffect(() => {
    armPressWait('step1-login');
    window.SYS_ERROR_ADVANCE?.arm(() => handleLogin());
    return () => {
      window.SYS_ERROR_ADVANCE?.disarm();
      disarmPressWait();
    };
  }, [handleLogin]);

  return (
    <motion.div 
      className="relative w-full h-screen bg-[#5a7edc] flex flex-col justify-between font-sans overflow-hidden select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: "easeInOut" }}
      id="xp-login-screen"
    >
      {/* Top bar with beautiful cobalt gradient */}
      <div 
        className="h-[80px] w-full border-b-[2px] border-[#001c9c] flex items-center relative z-10 shadow-lg"
        style={{
          background: 'linear-gradient(to bottom, #001275 0%, #001c9c 100%)'
        }}
        id="login-top-bar"
      />

      {/* Main split-screen body featuring the horizontal royal-blue background band */}
      <div 
        className="flex-1 w-full flex items-center justify-center relative shadow-[inset_0_4px_12px_rgba(0,0,0,0.15)]"
        style={{
          background: 'linear-gradient(180deg, #5072ce 0%, #7296eb 10%, #7296eb 90%, #5072ce 100%)'
        }}
        id="login-body-container"
      >
        <div className="w-full max-w-5xl mx-auto flex items-center h-full px-8 relative">
          
          {/* Left Column: Branding and instructions */}
          <div className="w-[45%] flex flex-col items-end pr-14 text-right justify-center h-full" id="login-branding">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-end"
            >
              {/* Windows XP style logo icon container */}
              <div className="flex items-center gap-3.5 mb-5" id="xp-logo">
                <div className="relative w-14 h-14 flex flex-wrap gap-0.5 transform rotate-6">
                  {/* Left-top red panel */}
                  <div className="w-[25px] h-[25px] bg-[#e64626] rounded-tr-[14px] rounded-bl-[14px] shadow-[1px_2px_4px_rgba(0,0,0,0.15)]" />
                  {/* Right-top green panel */}
                  <div className="w-[25px] h-[25px] bg-[#6faf22] rounded-tl-[14px] rounded-br-[14px] shadow-[1px_2px_4px_rgba(0,0,0,0.15)]" />
                  {/* Left-bottom blue panel */}
                  <div className="w-[25px] h-[25px] bg-[#118ecb] rounded-bl-[14px] rounded-tr-[14px] shadow-[1px_2px_4px_rgba(0,0,0,0.15)]" />
                  {/* Right-bottom yellow panel */}
                  <div className="w-[25px] h-[25px] bg-[#f8b229] rounded-br-[14px] rounded-tl-[14px] shadow-[1px_2px_4px_rgba(0,0,0,0.15)]" />
                </div>
                <div className="flex flex-col text-left justify-center pl-1">
                  <div className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[2px_2px_2px_rgba(0,0,0,0.35)]">
                    Windows<span className="text-[#f89c0e] font-bold ml-1 italic text-3xl">xp</span>
                  </div>
                </div>
              </div>

              <p className="text-[#dfebff] text-xl font-normal drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.35)] font-sans max-w-xs leading-relaxed">
                To begin, click your user name.
              </p>
            </motion.div>
          </div>

          {/* Vertical Divider with highlight (Identical to 1:1 image) */}
          <div className="w-[1.5px] h-[280px] bg-linear-to-b from-transparent via-[#ffffff]/35 to-transparent relative" id="login-divider">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[5px] h-[5px] bg-sky-200 rounded-full blur-xs shadow-[0_0_8px_white]" />
          </div>

          {/* Right Column: Windows XP Users List (cat, a.a.a studio, frog) */}
          <div className="w-[55%] pl-14 flex flex-col justify-center gap-5 z-10" id="login-users-list">
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
              className="flex flex-col gap-5 max-w-md"
            >
              {/* 1. User "cat" (Inactive/Decorative to maintain 1:1 replica) */}
              <div
                className="group relative flex items-center gap-4 p-2 rounded-md border border-transparent opacity-85 hover:opacity-100 transition-all duration-200 cursor-default"
                id="xp-user-card-cat"
              >
                {/* Avatar Frame */}
                <div className="relative p-[2px] bg-[#ffffff] border border-slate-400 rounded-md shadow-sm">
                  <div className="w-14 h-14 bg-gradient-to-tr from-sky-400 to-indigo-500 rounded flex items-center justify-center text-white">
                    {/* SVG Cat face */}
                    <svg viewBox="0 0 100 100" className="w-10 h-10 stroke-white stroke-[5] fill-none">
                      <path d="M25,45 C25,35 35,25 50,25 C65,25 75,35 75,45 C75,65 65,75 50,75 C35,75 25,65 25,45" />
                      <polygon points="25,35 15,15 35,25" className="fill-white" />
                      <polygon points="75,35 85,15 65,25" className="fill-white" />
                      <circle cx="40" cy="45" r="3" className="fill-white" />
                      <circle cx="60" cy="45" r="3" className="fill-white" />
                      <path d="M45,55 Q50,60 55,55" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[17px] font-bold text-white tracking-wide">
                    cat
                  </span>
                </div>
              </div>

              {/* 2. User "a.a.a studio" (ACTIVE path to PASSWORD stage) */}
              <motion.div
                whileHover={{ scale: 1.015 }}
                className="group relative flex items-center gap-4 p-2 rounded-md border border-transparent hover:border-[#ff9a00]/40 hover:bg-linear-to-r hover:from-white/[0.08] hover:to-transparent hover:shadow-[0_0_15px_rgba(255,154,0,0.1)] transition-all duration-200 cursor-pointer"
                onClick={handleLogin}
                id="xp-user-card-aaa"
              >
                {/* Avatar Frame with custom orange glowing highlight */}
                <div className="relative p-[2px] bg-[#d3d3d3] border border-white/50 rounded-md group-hover:bg-[#ff9a00] group-hover:border-[#ff9a00] group-hover:shadow-[0_0_8px_rgba(255,154,0,0.5)] transition-all duration-200">
                  <AAAStudioLogo src={avatarSrc} className="w-14 h-14 rounded" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[17px] font-bold text-white group-hover:text-amber-400 transition-colors duration-200 tracking-wide">
                    a.a.a studio
                  </span>
                  <span className="login-press-hint text-[10px] font-mono text-white/80 group-hover:text-white tracking-[0.22em] lowercase mt-1">
                    Press to log in
                  </span>
                </div>
              </motion.div>

              {/* 3. User "frog" (Inactive/Decorative to maintain 1:1 replica) */}
              <div
                className="group relative flex items-center gap-4 p-2 rounded-md border border-transparent opacity-85 hover:opacity-100 transition-all duration-200 cursor-default"
                id="xp-user-card-frog"
              >
                {/* Avatar Frame */}
                <div className="relative p-[2px] bg-[#ffffff] border border-slate-400 rounded-md shadow-sm">
                  <div className="w-14 h-14 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded flex items-center justify-center text-white">
                    {/* SVG Frog face */}
                    <svg viewBox="0 0 100 100" className="w-10 h-10 stroke-white stroke-[5] fill-none">
                      <path d="M15,55 Q50,25 85,55 Q85,75 50,75 Q15,75 15,55" />
                      <circle cx="32" cy="35" r="10" className="fill-emerald-400" />
                      <circle cx="68" cy="35" r="10" className="fill-emerald-400" />
                      <circle cx="32" cy="35" r="4" className="fill-white" />
                      <circle cx="68" cy="35" r="4" className="fill-white" />
                      <path d="M35,60 Q50,66 65,60" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[17px] font-bold text-white tracking-wide">
                    frog
                  </span>
                </div>
              </div>

            </motion.div>
          </div>

        </div>
      </div>

      {/* Bottom cobalt footer bar with orange power button */}
      <div 
        className="h-[90px] w-full border-t-[2px] border-[#001c9c] flex items-center px-16 shadow-inner relative z-10"
        style={{
          background: 'linear-gradient(to bottom, #001c9c 0%, #001275 100%)'
        }}
        id="login-footer-bar"
      >
        <div className="w-full flex items-center justify-between" id="login-footer-content">
          {/* Power Off Button with correct orange color badge */}
          <div className="flex items-center gap-3 cursor-default" id="btn-turn-off">
            <div className="w-8 h-8 rounded-lg bg-[#e64626] border border-[#a22f18] flex items-center justify-center text-white shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 fill-none stroke-current stroke-[2.5]" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-wide text-sky-100">Turn off computer</span>
          </div>

          {/* Windows XP style Help/Slogan Text */}
          <div className="text-[11px] font-sans text-sky-200/80 max-w-md text-right leading-relaxed font-light">
            After you log on, you can add or change accounts. Just go to Control Panel and click User Accounts.
          </div>
        </div>
      </div>
    </motion.div>
  );
}
