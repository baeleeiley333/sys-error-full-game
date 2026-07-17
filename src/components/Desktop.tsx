import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useAnimation, AnimatePresence } from 'motion/react';
import { Heart, Folder, FileText, Trash2 } from 'lucide-react';
import RelationshipDetector from './RelationshipDetector';
import { audio } from '../utils/audio';

interface DesktopProps {
  key?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedY: number;
  speedX: number;
}

export default function Desktop() {
  const [time, setTime] = useState('');
  const [isHoveredByCursor, setIsHoveredByCursor] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [bgUrl, setBgUrl] = useState<string>('/desktop-bg.png');
  const [bgErrorCount, setBgErrorCount] = useState<number>(0);
  const [useFallbackBg, setUseFallbackBg] = useState<boolean>(false);
  const [whiteFlash, setWhiteFlash] = useState(false);
  const step2TransitionStarted = useRef(false);
  
  // Custom states for steps and window triggers
  const [showDetectorWindow, setShowDetectorWindow] = useState(false);
  const [isAnimatingCursor, setIsAnimatingCursor] = useState(true);

  const handleBgError = () => {
    if (bgErrorCount === 0) {
      setBgUrl('/desktop-bg.png.png');
      setBgErrorCount(1);
    } else if (bgErrorCount === 1) {
      setBgUrl('/desktop-bg.jpg');
      setBgErrorCount(2);
    } else if (bgErrorCount === 2) {
      setBgUrl('/desktop-bg.jpeg');
      setBgErrorCount(3);
    } else {
      setUseFallbackBg(true);
    }
  };
  
  // Virtual cursor coordinates and controls
  const cursorControls = useAnimation();
  const [cursorX, setCursorX] = useState<number>(0);
  const [cursorY, setCursorY] = useState<number>(0);

  // Update clock time
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Generate subtle drifting dust particles
  useEffect(() => {
    const initialParticles: Particle[] = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.4 + 0.1,
      speedY: -(Math.random() * 0.05 + 0.02),
      speedX: (Math.random() * 0.04 - 0.02),
    }));
    setParticles(initialParticles);

    const animationFrame = setInterval(() => {
      setParticles(prev =>
        prev.map(p => {
          let newY = p.y + p.speedY;
          let newX = p.x + p.speedX;
          // Wrap around edges
          if (newY < -5) newY = 105;
          if (newX < -5) newX = 105;
          if (newX > 105) newX = -5;
          return { ...p, y: newY, x: newX };
        })
      );
    }, 50);

    return () => clearInterval(animationFrame);
  }, []);

  // Coordinate the virtual cursor automation to glide directly to the Relationship Detector desktop icon
  useEffect(() => {
    const animateCursor = async () => {
      // Position cursor at bottom right initially
      setCursorX(window.innerWidth * 0.85);
      setCursorY(window.innerHeight * 0.75);

      // Wait 1200ms for desktop to fully settle
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Coordinate target: Relationship Detector.exe icon (top left: roughly x: 72, y: 60)
      const targetX = 72;
      const targetY = 60;

      // Glide mouse smoothly to the application icon
      await cursorControls.start({
        x: targetX,
        y: targetY,
        transition: {
          duration: 1.6,
          ease: [0.25, 0.1, 0.25, 1], // Classic organic easing
        }
      });

      // Icon select/hover highlight on arrival
      setIsHoveredByCursor(true);

      // Double-click effect (classic click sounds)
      await new Promise(resolve => setTimeout(resolve, 300));
      audio.playTypeBeep();
      await new Promise(resolve => setTimeout(resolve, 120));
      audio.playTypeBeep();

      // Launch the Relationship Detector.exe!
      setShowDetectorWindow(true);

      // Give cursor control over to user mousemove events
      setIsAnimatingCursor(false);
    };

    animateCursor();
  }, [cursorControls]);

  // Detector opens → brief beat → white flash + magic sound → auto Step 2
  useEffect(() => {
    if (!showDetectorWindow || step2TransitionStarted.current) return;

    const leadIn = setTimeout(() => {
      step2TransitionStarted.current = true;
      audio.playMagicTransition();
      setWhiteFlash(true);
      setTimeout(() => {
        window.location.href = '/part3/index.html';
      }, 480);
    }, 1400);

    return () => clearTimeout(leadIn);
  }, [showDetectorWindow]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isAnimatingCursor) {
      setCursorX(e.clientX);
      setCursorY(e.clientY);
    }
  };

  const handleDetectorClose = useCallback(() => {
    setShowDetectorWindow(false);
  }, []);

  return (
    <motion.div
      className="relative w-full h-screen overflow-hidden select-none font-sans"
      style={{
        // Sleek Interface signature color gradient representing XP bliss
        background: 'linear-gradient(180deg, #4da1ff 0%, #a2d2ff 45%, #52ad42 45%, #2d8a1e 100%)',
        cursor: 'none' // Hide native browser cursor to allow virtual cursor
      }}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      id="xp-desktop"
    >
      {whiteFlash && (
        <motion.div
          className="fixed inset-0 z-[200] bg-white pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1] }}
          transition={{ duration: 0.5, times: [0, 0.25, 1], ease: 'easeOut' }}
          id="step2-white-flash"
          aria-hidden="true"
        />
      )}

      {/* Custom Desktop Background Photo (if uploaded by user) */}
      {!useFallbackBg && (
        <img 
          src={bgUrl} 
          onError={handleBgError} 
          className="absolute inset-0 w-full h-full object-cover z-0 select-none pointer-events-none" 
          alt="Desktop Background"
          referrerPolicy="no-referrer"
        />
      )}
      {/* Background repeating scanlines from Sleek Interface Theme */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-10" 
        style={{
          background: 'repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 2px)'
        }} 
      />

      {/* Sleek Interface Centralized Artistic Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-20 z-10 select-none">
        <h1 className="text-[120px] font-black text-white/50 tracking-tighter leading-none italic">SYS_ERROR</h1>
        <p className="text-2xl font-light text-white tracking-[1em] uppercase -mt-4">A.A.A Studio Installation</p>
      </div>

      {/* Soft overlay vignette to increase depth and match the installation aesthetic */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/15 pointer-events-none z-10" />

      {/* Floating ambient dust particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10" id="desktop-particles">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute bg-amber-100 rounded-full blur-xs transition-transform"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>

      {/* Desktop Icons Column (Top Left Stack) */}
      <div className="absolute top-6 left-6 grid grid-cols-1 gap-8 z-20" id="desktop-icon-stack">
        {/* 1. Relationship Detector.exe */}
        <motion.div
          className={`group flex flex-col items-center w-24 cursor-pointer text-center transition-all duration-300 ${
            isHoveredByCursor
              ? 'scale-105'
              : ''
          }`}
          id="icon-relationship-detector"
        >
          <div className="w-12 h-12 mb-1 relative flex items-center justify-center">
            {/* Hover aura */}
            <div className={`absolute inset-0 bg-white/20 blur-sm rounded-lg transition-opacity duration-300 ${
              isHoveredByCursor ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`} />
            
            {/* Custom crafted Sleek Interface Red Device Icon */}
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-md border-2 border-white/50 flex items-center justify-center shadow-lg">
              <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
              </div>
            </div>
          </div>
          <span className="text-[11px] text-white text-center font-medium drop-shadow-md leading-tight">
            Relationship Detector.exe
          </span>
        </motion.div>

        {/* 2. People Folder */}
        <div
          className="flex flex-col items-center group w-24 cursor-pointer text-center"
          id="icon-people-folder"
        >
          <div className="w-12 h-12 mb-1 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-white/10 blur-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-md border-2 border-white/30 flex flex-col p-1.5 gap-1 shadow-md">
              <div className="w-full h-1 bg-white/40 rounded-xs" />
              <div className="w-full h-1 bg-white/40 rounded-xs" />
              <div className="w-full h-1 bg-white/40 rounded-xs" />
            </div>
          </div>
          <span className="text-[11px] text-white text-center font-medium drop-shadow-md leading-tight">
            People Folder
          </span>
        </div>

        {/* 3. SYS_LOG.txt */}
        <div
          className="flex flex-col items-center group w-24 cursor-pointer text-center"
          id="icon-sys-log"
        >
          <div className="w-12 h-12 mb-1 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-white/10 blur-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-400 rounded-sm border-2 border-white/30 flex items-center justify-center shadow-md">
              <div className="w-6 h-8 border border-gray-500 bg-white flex flex-col p-1 gap-1">
                <div className="w-full h-0.5 bg-gray-300" />
                <div className="w-full h-0.5 bg-gray-300" />
                <div className="w-full h-0.5 bg-gray-300" />
              </div>
            </div>
          </div>
          <span className="text-[11px] text-white text-center font-medium drop-shadow-md leading-tight">
            SYS_LOG.txt
          </span>
        </div>

        {/* 4. Recycle Bin */}
        <div
          className="flex flex-col items-center group w-24 cursor-pointer text-center"
          id="icon-recycle-bin"
        >
          <div className="w-12 h-12 mb-1 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-white/10 blur-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-10 h-10 flex flex-col items-center justify-end overflow-hidden border border-white/20 bg-slate-800/40 rounded shadow-md">
              <div className="w-8 h-6 bg-gray-300/80 rounded-t-sm relative">
                <div className="absolute top-1 left-1 w-2 h-0.5 bg-gray-500" />
              </div>
              <div className="w-9 h-2 bg-gray-400 rounded-sm" />
            </div>
          </div>
          <span className="text-[11px] text-white text-center font-medium drop-shadow-md leading-tight">
            Recycle Bin
          </span>
        </div>
      </div>

      {/* Sleek Interface Corner Build Signature */}
      <div className="absolute bottom-16 right-8 text-right text-white/40 pointer-events-none z-20 select-none">
        <p className="text-xs font-mono uppercase tracking-wider">Build: ROS_8.2.0-STABLE</p>
        <p className="text-[10px] font-mono tracking-wide opacity-80">Human-Machine Relationship Protocol Active</p>
      </div>

      {/* Windows XP Taskbar (At the bottom) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[40px] z-30 flex items-center justify-between"
        style={{
          background: 'linear-gradient(to bottom, #245ed1 0%, #3f8cf3 9%, #245ed1 18%, #245ed1 92%, #1941a5 100%)',
          borderTop: '1px solid #103184'
        }}
        id="xp-taskbar"
      >
        {/* Start Button Container */}
        <div className="flex items-center h-full">
          {/* Classic Start button: rounded green glossy badge */}
          <div 
            className="h-full px-6 flex items-center gap-2 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.3)] cursor-pointer"
            style={{
              background: 'linear-gradient(to bottom, #3c813c 0%, #53a353 4%, #4b9e4b 6%, #3c813c 93%, #2a5a2a 100%)',
              borderTopRightRadius: '12px',
              borderBottomRightRadius: '12px'
            }}
            id="xp-start-btn"
          >
            {/* Tiny logomark */}
            <div className="w-6 h-6 flex flex-wrap gap-0.5 mr-1 transform rotate-6">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-tl-sm" />
              <div className="w-2.5 h-2.5 bg-green-500 rounded-tr-sm" />
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-bl-sm" />
              <div className="w-2.5 h-2.5 bg-yellow-500 rounded-br-sm" />
            </div>
            <span className="text-white font-bold italic text-lg drop-shadow-sm select-none">
              start
            </span>
          </div>

          {/* Running program block (SYS_ERROR Active Client) */}
          <div className="flex items-center px-4 gap-2 h-full">
            <div className="h-8 px-4 flex items-center bg-[#3a7af2] border border-[#103184] rounded-sm text-xs text-white shadow-[inset_1px_1px_1px_rgba(255,255,255,0.2)]">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse" />
              Relationship Detector.exe
            </div>
          </div>
        </div>

        {/* System Notification Tray (Clock Area) */}
        <div 
          className="h-full w-32 flex items-center justify-center px-4"
          style={{
            background: 'linear-gradient(to bottom, #0997ff 0%, #0076d1 100%)',
            borderLeft: '1px solid #103184'
          }}
          id="xp-system-tray"
        >
          {/* Clock Text */}
          <span className="text-white text-xs font-semibold drop-shadow-sm tracking-wide font-mono select-none" id="tray-clock">
            {time}
          </span>
        </div>
      </div>

      {/* Relationship Detector.exe Window Interface */}
      <AnimatePresence>
        {showDetectorWindow && (
          <RelationshipDetector 
            onClose={handleDetectorClose} 
          />
        )}
      </AnimatePresence>

      {/* Virtual Cursor pointer */}
      <motion.div
        animate={cursorControls}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          x: cursorX,
          y: cursorY,
        }}
        className="pointer-events-none z-50 select-none drop-shadow-[2px_4px_3px_rgba(0,0,0,0.35)]"
        id="virtual-cursor"
      >
        {/* Classic Windows XP white mouse cursor */}
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Arrow Body - White fill, strong black outline */}
          <path 
            d="M0 0V22.5L6.5 16L11 25.5L14.5 23.5L10 14.5L17 14L0 0Z" 
            fill="white" 
            stroke="black" 
            strokeWidth="2.5" 
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}
