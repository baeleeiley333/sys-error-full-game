import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { audio } from '../utils/audio';

interface BootSequenceProps {
  onNext: () => void;
  key?: string;
}

export default function BootSequence({ onNext }: BootSequenceProps) {
  const [phase, setPhase] = useState<'black' | 'loading' | 'gradient'>('black');

  useEffect(() => {
    // Stage 1: Play startup sound and transition to loading spinner
    const timer1 = setTimeout(() => {
      setPhase('loading');
      audio.playStartupChime();
    }, 600);

    // Stage 2: Fade from dark to royal blue gradient (CRT wake up)
    const timer2 = setTimeout(() => {
      setPhase('gradient');
    }, 2000);

    // Stage 3: Complete boot, transition to desktop
    const timer3 = setTimeout(() => {
      onNext();
    }, 3800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onNext]);

  return (
    <motion.div
      className="relative w-full h-screen flex flex-col items-center justify-center select-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        backgroundColor: '#000000'
      }}
      id="xp-boot-sequence"
    >
      {/* Black Phase */}
      {phase === 'black' && (
        <div className="absolute inset-0 bg-black" />
      )}

      {/* Loading Spinner on Black */}
      {phase === 'loading' && (
        <motion.div 
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          id="boot-spinner-group"
        >
          {/* A high-fidelity retro loading spinner */}
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-[2.5px] border-slate-800" />
            <motion.div 
              className="absolute inset-0 rounded-full border-[2.5px] border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
            Booting SYS_ERROR_OS
          </span>
        </motion.div>
      )}

      {/* Blue Gradient Glow (CRT wakes up, blue gradient fills screen) */}
      {phase === 'gradient' && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-b from-[#0b3c5d] via-[#328cc1] to-[#0b3c5d]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.0, ease: "easeInOut" }}
          id="boot-gradient-layer"
        >
          {/* Retro glowing screen center */}
          <div className="absolute inset-0 bg-radial-gradient from-white/10 to-transparent pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="flex flex-col items-center"
            id="boot-welcome-title"
          >
            <h2 className="text-4xl font-light tracking-[0.2em] text-white/90 drop-shadow-[0_2px_15px_rgba(255,255,255,0.2)] text-center font-sans">
              WELCOME
            </h2>
            <p className="text-[11px] text-sky-200/60 font-mono tracking-widest uppercase mt-4">
              A.A.A Studio Installation System
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* Subtle Scanline Overlay exclusively for boot to make the transition look analog */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.06] z-40"
        style={{
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
          backgroundSize: '100% 6px',
        }}
      />
    </motion.div>
  );
}
