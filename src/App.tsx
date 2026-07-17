/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import LoginScreen from './components/LoginScreen';
import PasswordScreen from './components/PasswordScreen';
import AuthScreen from './components/AuthScreen';
import BootSequence from './components/BootSequence';
import Desktop from './components/Desktop';
import CrtOverlay from './components/CrtOverlay';

type ScreenState = 'LOGIN' | 'PASSWORD' | 'AUTH' | 'BOOT' | 'DESKTOP';

const AVATAR_SRC = '/aaa-avatar.png';

export default function App() {
  const [currentState, setCurrentState] = useState<ScreenState>('LOGIN');

  // Curator / developer trick: press Escape key to reset the boot loop back to LOGIN state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCurrentState('LOGIN');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-[#000000] overflow-hidden select-none">
      {/* Immersive CRT filter, scanlines, and vignette active globally */}
      <CrtOverlay />

      {/* Screen view router with animated transitions */}
      <AnimatePresence mode="wait">
        {currentState === 'LOGIN' && (
          <LoginScreen 
            key="login" 
            avatarSrc={AVATAR_SRC}
            onNext={() => setCurrentState('PASSWORD')} 
          />
        )}

        {currentState === 'PASSWORD' && (
          <PasswordScreen 
            key="password" 
            avatarSrc={AVATAR_SRC}
            onNext={() => setCurrentState('AUTH')} 
          />
        )}

        {currentState === 'AUTH' && (
          <AuthScreen 
            key="auth" 
            avatarSrc={AVATAR_SRC}
            onNext={() => setCurrentState('DESKTOP')} 
          />
        )}

        {currentState === 'BOOT' && (
          <BootSequence 
            key="boot" 
            onNext={() => setCurrentState('DESKTOP')} 
          />
        )}

        {currentState === 'DESKTOP' && (
          <Desktop 
            key="desktop" 
          />
        )}
      </AnimatePresence>

      {/* Unobtrusive developer helper notice - fades out automatically */}
      <div className="absolute top-4 left-4 z-50 pointer-events-none opacity-20 hover:opacity-100 transition-opacity duration-300 font-mono text-[9px] text-slate-500">
        SYS_ERROR // A.A.A STUDIO INSTALLATION // PRESS 'ESC' TO RESET LOOP
      </div>
    </div>
  );
}
