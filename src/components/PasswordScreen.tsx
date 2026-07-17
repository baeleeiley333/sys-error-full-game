import React, { useState, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'motion/react';
import { Plus, RotateCcw, Beaker, Info, X, Wrench, Shield } from 'lucide-react';
import AAAStudioLogo from './AAAStudioLogo';
import { audio } from '../utils/audio';

interface PasswordScreenProps {
  onNext: () => void;
  avatarSrc?: string;
  key?: string;
}

export default function PasswordScreen({ onNext, avatarSrc }: PasswordScreenProps) {
  const [typedPassword, setTypedPassword] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Workstation is locked');
  const arrowControls = useAnimation();

  const secretPassword = 'AAASTUDIOSYSERROR';

  // Cursor blink effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  // Keyboard override (Enter goes next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !showAboutModal) {
        triggerSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typedPassword, showAboutModal]);

  // Automated typing sequence
  useEffect(() => {
    let index = 0;
    const startTimeout = setTimeout(() => {
      const typeInterval = setInterval(() => {
        if (index < secretPassword.length) {
          setTypedPassword(prev => prev + '•');
          audio.playTypeBeep();
          index++;
        } else {
          clearInterval(typeInterval);
          
          // Wait 600ms after typing is complete, then submit
          setTimeout(() => {
            triggerSubmit();
          }, 600);
        }
      }, 85); // 70-90ms typing speed

      return () => clearInterval(typeInterval);
    }, 1200); // blink cursor before typing

    return () => clearTimeout(startTimeout);
  }, []);

  const triggerSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setStatusMessage('Logging on...');
    audio.playSubmitChime();
    
    // Play a quick animation on the submit button
    await arrowControls.start({
      x: [0, 6, 0],
      scale: [1, 0.9, 1],
      transition: { duration: 0.25 }
    });

    // Transition to Scene 3 (Auth)
    setTimeout(() => {
      onNext();
    }, 500);
  };

  const handleActionClick = (actionName: string) => {
    audio.playTypeBeep();
    if (actionName === 'About') {
      setShowAboutModal(true);
    } else if (actionName === 'Set background') {
      setStatusMessage('Wallpapers locked by Administrator');
      setTimeout(() => setStatusMessage('Workstation is locked'), 3000);
    } else if (actionName === 'Default background') {
      setStatusMessage('Background reset to Bliss V2');
      setTimeout(() => setStatusMessage('Workstation is locked'), 2000);
    } else if (actionName === 'Test') {
      triggerSubmit();
    } else if (actionName === 'Close') {
      setStatusMessage('Operation cancelled. Lock active.');
      setTimeout(() => setStatusMessage('Workstation is locked'), 2500);
    }
  };

  return (
    <motion.div
      className="relative w-full h-screen flex flex-col items-center justify-between font-sans select-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: "easeInOut" }}
      id="win7-password-screen"
    >
      {/* 1. LUSH SUNNY GREEN HILLS VECTOR BACKGROUND (1:1 with reference) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Sky gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2e6dcf] via-[#5c98eb] to-[#a3cdf4]" />
        
        {/* High fidelity scalable vector scenery */}
        <svg 
          viewBox="0 0 1000 800" 
          preserveAspectRatio="xMidYMid slice" 
          className="absolute inset-0 w-full h-full object-cover opacity-95"
        >
          <defs>
            {/* Gradients for back hills */}
            <linearGradient id="hillBackGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7cb337" />
              <stop offset="100%" stopColor="#315c0e" />
            </linearGradient>
            
            {/* Gradients for front hills */}
            <linearGradient id="hillFrontGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#67a120" />
              <stop offset="45%" stopColor="#3e750e" />
              <stop offset="100%" stopColor="#1e3e03" />
            </linearGradient>
            
            {/* Gradients for fluffy clouds */}
            <linearGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f1f7fe" />
            </linearGradient>
            
            {/* Soft drop shadow for clouds to pop */}
            <filter id="cloudShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="1" dy="4" stdDeviation="6" floodColor="#00183b" floodOpacity="0.1" />
            </filter>
            
            {/* Radial brush foliage shading */}
            <radialGradient id="bushShade1" cx="50%" cy="30%" r="50%">
              <stop offset="0%" stopColor="#3d7515" />
              <stop offset="100%" stopColor="#1a3b06" />
            </radialGradient>
            <radialGradient id="bushShade2" cx="50%" cy="30%" r="50%">
              <stop offset="0%" stopColor="#4e8f1c" />
              <stop offset="100%" stopColor="#224a08" />
            </radialGradient>
          </defs>

          {/* Clouds */}
          <g filter="url(#cloudShadow)" opacity="0.94">
            {/* Large Left Cloud */}
            <path d="M-40,160 C-40,115 15,80 65,95 C85,60 155,60 185,95 C215,65 290,75 310,120 C340,105 395,120 395,165 C395,200 365,225 330,225 L-40,225 Z" fill="url(#cloudGrad)" />
          </g>
          
          <g filter="url(#cloudShadow)" opacity="0.88">
            {/* Middle-Top Cloud */}
            <path d="M420,80 C420,55 465,30 500,45 C520,20 580,20 600,50 C625,30 675,40 680,75 C700,65 740,85 730,120 C720,145 675,150 655,150 L420,150 Z" fill="url(#cloudGrad)" />
          </g>

          <g filter="url(#cloudShadow)" opacity="0.9">
            {/* Far Right Cloud */}
            <path d="M780,200 C780,175 815,155 845,170 C865,145 915,145 930,170 C950,155 985,165 990,190 C1005,185 1030,200 1025,225 C1020,240 985,245 965,245 L780,245 Z" fill="url(#cloudGrad)" />
          </g>

          {/* Floating tiny atmospheric light reflections */}
          <circle cx="845" cy="195" r="10" fill="#ffffff" opacity="0.35" />
          <circle cx="340" cy="90" r="22" fill="#ffffff" opacity="0.25" />

          {/* Back rolling hill */}
          <path d="M-100,520 Q220,300 620,500 T1100,460 L1100,900 L-100,900 Z" fill="url(#hillBackGrad)" />

          {/* Foreground main rolling hill */}
          <path d="M-50,620 Q420,350 1050,520 L1050,900 L-50,900 Z" fill="url(#hillFrontGrad)" />

          {/* Little house on the right foreground hill */}
          <g transform="translate(790, 355) scale(0.95)" className="drop-shadow-[1px_3px_5px_rgba(0,0,0,0.18)]">
            {/* Chimney */}
            <rect x="42" y="5" width="8" height="20" fill="#752c1a" />
            <rect x="40" y="3" width="12" height="4" fill="#4d1b10" />
            
            {/* Smoke coils (floating upward) */}
            <path d="M46,-3 Q43,-10 49,-15 T44,-25 T51,-35" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.65" />
            <circle cx="48" cy="-8" r="5" fill="#ffffff" opacity="0.4" />
            <circle cx="53" cy="-20" r="7" fill="#ffffff" opacity="0.3" />

            {/* House walls */}
            <rect x="10" y="22" width="38" height="28" fill="#d47348" rx="1" />
            <polygon points="5,22 45,22 25,2" fill="#4d1b10" opacity="0.18" />
            
            {/* Roof */}
            <polygon points="4,22 46,22 25,0" fill="#a13723" />
            
            {/* Door */}
            <rect x="16" y="34" width="10" height="16" fill="#4d1b10" rx="0.5" />
            <circle cx="19" cy="42" r="1" fill="#f1c40f" />
            
            {/* Window */}
            <rect x="32" y="30" width="10" height="10" fill="#ffffff" rx="1" />
            <rect x="36" y="30" width="2" height="10" fill="#d47348" />
            <rect x="32" y="34" width="10" height="2" fill="#d47348" />
          </g>

          {/* Deep green leafy bushes */}
          {/* Middle foreground bush cluster */}
          <g transform="translate(630, 485) scale(1.1)">
            <circle cx="20" cy="20" r="16" fill="url(#bushShade1)" />
            <circle cx="38" cy="14" r="14" fill="url(#bushShade2)" />
            <circle cx="52" cy="24" r="15" fill="url(#bushShade1)" />
            <circle cx="34" cy="30" r="16" fill="url(#bushShade2)" />
            <circle cx="16" cy="30" r="13" fill="url(#bushShade1)" />
          </g>
          
          {/* Bottom-right bush cluster */}
          <g transform="translate(680, 640) scale(1.35)">
            <circle cx="20" cy="20" r="16" fill="url(#bushShade1)" />
            <circle cx="43" cy="14" r="15" fill="url(#bushShade2)" />
            <circle cx="58" cy="26" r="15" fill="url(#bushShade1)" />
            <circle cx="38" cy="33" r="17" fill="url(#bushShade2)" />
            <circle cx="18" cy="29" r="13" fill="url(#bushShade1)" />
          </g>

          {/* Left hill back bush cluster */}
          <g transform="translate(30, 520) scale(0.8)">
            <circle cx="20" cy="20" r="15" fill="url(#bushShade1)" />
            <circle cx="35" cy="17" r="13" fill="url(#bushShade2)" />
            <circle cx="45" cy="24" r="14" fill="url(#bushShade1)" />
            <circle cx="28" cy="29" r="15" fill="url(#bushShade2)" />
          </g>
        </svg>
      </div>

      {/* Spacer to push content down */}
      <div className="h-10" />

      {/* 2. MAIN LOGIN FRAME (Center contents) */}
      <div className="flex flex-col items-center z-10" id="win7-frame">
        {/* Windows 7 Glassy Avatar Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative p-[5px] bg-[#ffffff]/90 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.4)] border border-[#a3cff4]/40 mb-5 overflow-hidden"
          style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 2px 8px rgba(255,255,255,0.9), 0 0 1px 1px rgba(255,255,255,0.4)'
          }}
          id="win7-avatar-container"
        >
          {/* Glass reflection gradient highlight */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/10 to-white/40 pointer-events-none z-10" />
          <AAAStudioLogo src={avatarSrc} className="w-[110px] h-[110px] rounded-xl" />
        </motion.div>

        {/* Identity Title & Locked Status */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          className="text-center mb-6"
          id="win7-text-id"
        >
          <h1 
            className="text-2xl font-semibold text-white tracking-wide"
            style={{ textShadow: '0 2px 5px rgba(0,0,0,0.75)' }}
          >
            A.A.A STUDIO
          </h1>
          <p 
            className="text-[12px] text-[#dfebff] tracking-wide mt-1.5 opacity-90 font-medium"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
          >
            {statusMessage}
          </p>
        </motion.div>

        {/* Password Input Bar & Enter Button */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="flex items-center gap-2.5 w-[280px]"
          id="win7-input-block"
        >
          {/* Faux Input Box */}
          <div className="flex-1 h-[28px] bg-white border border-[#a0a0a0] rounded-sm shadow-[inset_1px_1px_3px_rgba(0,0,0,0.18)] flex items-center px-2 relative overflow-hidden">
            <span className="text-xl font-bold tracking-[0.2em] text-[#1a1a1a] select-none leading-none">
              {typedPassword}
            </span>
            {showCursor && !isSubmitting && (
              <span className="w-[1.2px] h-[16px] bg-slate-900 ml-0.5 animate-pulse" />
            )}
            
            {typedPassword === '' && (
              <span className="absolute left-2 text-slate-400 text-[11px] pointer-events-none font-sans">
                Type Password
              </span>
            )}
          </div>

          {/* Windows 7 Style Circular Blue Enter Button */}
          <motion.button
            animate={arrowControls}
            onClick={() => triggerSubmit()}
            className={`w-[28px] h-[28px] rounded-full flex items-center justify-center border shadow-md transition-all duration-300 relative overflow-hidden ${
              isSubmitting 
                ? 'bg-sky-600 border-sky-500 text-white' 
                : 'bg-gradient-to-b from-[#5ca1f4] via-[#2272d9] to-[#125ebd] border-[#104fa2] text-white hover:from-[#72b0f7] hover:to-[#2e82e6] active:scale-95'
            }`}
            style={{
              boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.4)'
            }}
            id="win7-submit-btn"
          >
            {isSubmitting ? (
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 100 100" className="w-4 h-4 stroke-white stroke-[12] fill-none stroke-linecap-round stroke-linejoin-round">
                <path d="M15,50 L85,50 M50,15 L85,50 L50,85" />
              </svg>
            )}
          </motion.button>
        </motion.div>
      </div>

      {/* 3. WINDOWS 7 BRAND SIGNATURE (Centered Brand) */}
      <div className="flex flex-col items-center z-10 mb-20" id="win7-brand-block">
        <div className="flex items-center">
          {/* Perfect 1:1 responsive Windows flag */}
          <svg className="w-10 h-10 mr-3 drop-shadow-[1px_2px_4px_rgba(0,0,0,0.5)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Top Left - Red Wave */}
            <path d="M15,25 Q32,15 48,25 L48,50 Q32,40 15,50 Z" fill="#e64626" />
            {/* Top Right - Green Wave */}
            <path d="M52,25 Q68,15 85,25 L85,50 Q68,40 52,50 Z" fill="#6faf22" />
            {/* Bottom Left - Blue Wave */}
            <path d="M15,54 Q32,44 48,54 L48,79 Q32,69 15,79 Z" fill="#118ecb" />
            {/* Bottom Right - Yellow Wave */}
            <path d="M52,54 Q68,44 85,54 L85,79 Q68,69 52,79 Z" fill="#f8b229" />
          </svg>
          <span 
            className="text-white text-3xl font-light tracking-wide font-sans select-none"
            style={{ textShadow: '0 2px 5px rgba(0,0,0,0.6)' }}
          >
            Windows 7
          </span>
        </div>
      </div>

      {/* 4. TRANSLUCENT GREEN-TEAL GLASS TASKBAR (1:1 with reference) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[72px] flex items-center justify-between px-8 z-20"
        style={{
          background: 'linear-gradient(to bottom, rgba(16, 52, 28, 0.78) 0%, rgba(10, 36, 18, 0.88) 100%)',
          borderTop: '1px solid rgba(132, 214, 155, 0.25)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.3)'
        }}
        id="win7-taskbar"
      >
        {/* Left blueprint app signature */}
        <div className="flex items-center gap-3">
          {/* Blueprint document with gear logo */}
          <div className="w-10 h-10 bg-[#2d5da1] border border-blue-400/50 rounded-sm p-1.5 flex items-center justify-center shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3)] relative overflow-hidden">
            {/* Architectural Grid lines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-25 pointer-events-none">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
            </div>
            {/* Drafting graphic details */}
            <svg viewBox="0 0 24 24" className="w-full h-full text-white/95 stroke-current fill-none stroke-[2] drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
              <rect x="2" y="2" width="20" height="20" rx="1" />
              <line x1="2" y1="2" x2="22" y2="22" />
              <line x1="2" y1="22" x2="22" y2="2" />
              <circle cx="12" cy="12" r="5" className="fill-[#2d5da1]" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          </div>
          {/* Multi-line header label */}
          <div className="flex flex-col text-[10px] leading-[1.1] font-bold font-sans text-white/90 text-left uppercase tracking-wider">
            <span>Windows 7</span>
            <span>Account</span>
            <span>Screen</span>
            <span>Editor</span>
          </div>
        </div>

        {/* Center menu buttons matching the reference screenshot */}
        <div className="flex items-center gap-5 md:gap-8" id="taskbar-actions">
          {/* Action 1: Set background */}
          <button 
            onClick={() => handleActionClick('Set background')}
            className="group flex items-center gap-2 text-white/90 hover:text-white text-[12px] font-medium transition-all cursor-pointer"
          >
            {/* Green thick plus icon */}
            <div className="w-4 h-4 rounded-sm bg-emerald-500/20 group-hover:bg-emerald-500/30 flex items-center justify-center border border-emerald-400/30">
              <Plus className="w-3.5 h-3.5 text-emerald-400 stroke-[3.5]" />
            </div>
            <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Set background</span>
          </button>

          {/* Action 2: Default background */}
          <button 
            onClick={() => handleActionClick('Default background')}
            className="group flex items-center gap-2 text-white/90 hover:text-white text-[12px] font-medium transition-all cursor-pointer"
          >
            <div className="w-4 h-4 rounded-sm bg-cyan-500/20 group-hover:bg-cyan-500/30 flex items-center justify-center border border-cyan-400/30">
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400 stroke-[2.5]" />
            </div>
            <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Default background</span>
          </button>

          {/* Action 3: Test */}
          <button 
            onClick={() => handleActionClick('Test')}
            className="group flex items-center gap-2 text-white/90 hover:text-white text-[12px] font-medium transition-all cursor-pointer"
          >
            <div className="w-4 h-4 rounded-sm bg-green-500/20 group-hover:bg-green-500/30 flex items-center justify-center border border-green-400/30">
              <Beaker className="w-3.5 h-3.5 text-green-400 stroke-[2.5]" />
            </div>
            <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Test</span>
          </button>

          {/* Action 4: About */}
          <button 
            onClick={() => handleActionClick('About')}
            className="group flex items-center gap-2 text-white/90 hover:text-white text-[12px] font-medium transition-all cursor-pointer"
          >
            <div className="w-4 h-4 rounded-sm bg-blue-500/20 group-hover:bg-blue-500/30 flex items-center justify-center border border-blue-400/30">
              <Info className="w-3.5 h-3.5 text-blue-400 stroke-[2.5]" />
            </div>
            <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>About</span>
          </button>

          {/* Action 5: Close */}
          <button 
            onClick={() => handleActionClick('Close')}
            className="group flex items-center gap-2 text-white/90 hover:text-white text-[12px] font-medium transition-all cursor-pointer"
          >
            <div className="w-4 h-4 rounded-sm bg-red-500/20 group-hover:bg-red-500/30 flex items-center justify-center border border-red-400/30">
              <X className="w-3.5 h-3.5 text-red-400 stroke-[2.5]" />
            </div>
            <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Close</span>
          </button>
        </div>

        {/* Far right maintenance tools widget */}
        <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
          <div className="relative w-7 h-7 flex items-center justify-center rounded-full bg-white/5 border border-white/10 shadow-sm">
            <Wrench className="w-4 h-4 text-[#f89c0e] stroke-[2.2]" />
            {/* Sparkle background glow */}
            <div className="absolute inset-0 rounded-full bg-amber-400/10 blur-xs pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 5. DELIGHTFUL INTERACTIVE RETRO WINDOWS 7 DIALOG (Nostalgia dialog) */}
      <AnimatePresence>
        {showAboutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-[420px] bg-[#f0f0f0] border border-[#7a7a7a] rounded shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.8)] overflow-hidden"
              id="about-dialog-container"
            >
              {/* Window glass titlebar */}
              <div 
                className="h-8 flex items-center justify-between px-3 relative border-b border-[#bababa]"
                style={{
                  background: 'linear-gradient(to bottom, #eaeaea 0%, #d8d8d8 100%)'
                }}
              >
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-semibold text-slate-800 font-sans">System Specifications</span>
                </div>
                <button 
                  onClick={() => { audio.playTypeBeep(); setShowAboutModal(false); }}
                  className="w-5 h-5 rounded-xs flex items-center justify-center bg-red-600 hover:bg-red-500 border border-red-700 hover:border-red-600 shadow-sm text-white transition-colors"
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>

              {/* Dialog Body */}
              <div className="p-5 flex gap-4 bg-white">
                {/* Visual */}
                <div className="w-14 h-14 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded flex items-center justify-center shadow-md border border-white/20 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-9 h-9 stroke-white stroke-[8] fill-none">
                    <circle cx="50" cy="50" r="40" />
                    <line x1="50" y1="35" x2="50" y2="35" strokeLinecap="round" strokeWidth="12" />
                    <line x1="50" y1="50" x2="50" y2="72" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="flex flex-col text-left">
                  <h2 className="text-sm font-bold text-slate-900 font-sans mb-1">
                    a.a.a studio relationship protocol
                  </h2>
                  <p className="text-[11px] text-slate-500 font-mono mb-3">
                    Version 8.2.0 (Build ROS_8.2.0-STABLE)
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans mb-1">
                    This interactive terminal operates on port <strong>3000</strong> within a sandboxed development environment.
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    The custom profile picture has been mapped to <code>/public/aaa-avatar.png</code> and successfully rendered on your screen.
                  </p>
                </div>
              </div>

              {/* Bottom footer buttons */}
              <div className="h-12 bg-[#f0f0f0] border-t border-[#e2e2e2] flex items-center justify-end px-4 gap-2">
                <button 
                  onClick={() => { audio.playTypeBeep(); setShowAboutModal(false); }}
                  className="px-6 py-1 bg-linear-to-b from-white to-[#e1e1e1] hover:from-[#fcfcfc] hover:to-[#d0d0d0] active:scale-95 border border-[#adadad] rounded shadow-xs text-xs font-medium text-slate-800 transition-all cursor-pointer"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

