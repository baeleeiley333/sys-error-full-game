import React from 'react';
import { motion } from 'motion/react';

export default function CrtOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden select-none">
      {/* Dynamic scanlines */}
      <div 
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
          backgroundSize: '100% 4px',
        }}
        id="crt-scanlines"
      />

      {/* Retro CRT curvature shadow and vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, transparent 55%, rgba(0, 0, 0, 0.45) 100%)',
          mixBlendMode: 'multiply',
        }}
        id="crt-vignette"
      />

      {/* Ambient subtle screen flicker */}
      <motion.div
        className="absolute inset-0 bg-white/[0.005] mix-blend-overlay pointer-events-none"
        animate={{
          opacity: [0.1, 0.3, 0.15, 0.4, 0.2, 0.35, 0.1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        id="crt-flicker"
      />

      {/* Screen phosphor color bleed overlay */}
      <div 
        className="absolute inset-0 opacity-[0.012] pointer-events-none bg-linear-to-b from-blue-500/20 via-transparent to-emerald-500/10 mix-blend-screen"
        id="crt-phosphor"
      />
    </div>
  );
}
