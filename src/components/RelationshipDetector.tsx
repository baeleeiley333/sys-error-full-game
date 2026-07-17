import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { audio } from '../utils/audio';

interface RelationshipDetectorProps {
  onClose: () => void;
}

type WizardStep = 'WELCOME' | 'SCANNING' | 'QUESTIONS' | 'REPORT';

export default function RelationshipDetector({ onClose }: RelationshipDetectorProps) {
  const [step, setStep] = useState<WizardStep>('WELCOME');
  const [progress, setProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('Initializing neural telemetry...');
  
  // Question states
  const [answers, setAnswers] = useState({
    comfort: '',
    remember: '',
  });

  // Oscilloscope wave simulation coordinates
  const [wavePoints, setWavePoints] = useState<number[]>([]);

  // Simulation for Oscilloscope
  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      setWavePoints(prev => {
        const next = [...prev, Math.sin(tick * 0.4) * 15 + Math.cos(tick * 0.1) * 5 + 25];
        if (next.length > 40) next.shift();
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Scanning progress simulation
  useEffect(() => {
    if (step !== 'SCANNING') return;

    setProgress(0);
    const statuses = [
      'Establishing neural synchronicity...',
      'Measuring emotional latency...',
      'Calibrating vulnerability parameters...',
      'Testing cognitive resonance...',
      'Phase-locking physical heartbeat simulation...',
      'Generating connection report...',
    ];

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 1;
        
        // Update status text dynamically based on progress
        const statusIndex = Math.min(
          Math.floor((next / 100) * statuses.length),
          statuses.length - 1
        );
        setScanStatus(statuses[statusIndex]);

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            audio.playTypeBeep();
            setStep('QUESTIONS');
          }, 800);
          return 100;
        }
        return next;
      });
    }, 40); // scan takes ~4 seconds

    return () => clearInterval(interval);
  }, [step]);

  const handleNext = () => {
    audio.playTypeBeep();
    if (step === 'WELCOME') {
      setStep('SCANNING');
    } else if (step === 'QUESTIONS') {
      if (!answers.comfort || !answers.remember) {
        // Classic XP error prompt sound
        audio.playXpWarning();
        alert('Please complete the diagnostic queries to calibrate the connection.');
        return;
      }
      setStep('REPORT');
    }
  };

  const handleBack = () => {
    audio.playTypeBeep();
    if (step === 'QUESTIONS') {
      setStep('WELCOME');
    }
  };

  const handleFinish = () => {
    audio.playTypeBeep();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 15 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] bg-[#ece9d8] text-black select-none z-50 filter drop-shadow-[8px_12px_0px_rgba(0,0,0,0.3)] border-2 border-[#0055e5] rounded-t-lg"
      style={{
        boxShadow: 'inset -1px -1px 0px #808080, inset 1px 1px 0px #ffffff',
      }}
      id="xp-relationship-detector"
    >
      {/* Title Bar */}
      <div
        className="h-[30px] px-2 flex items-center justify-between font-bold text-white select-none text-xs"
        style={{
          background: 'linear-gradient(180deg, #005ddc 0%, #0054e3 8%, #0050e2 21%, #014de1 56%, #0050e2 84%, #0054e3 93%, #005ddc 100%)',
          textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
        }}
        id="detector-titlebar"
      >
        <div className="flex items-center gap-2">
          {/* Small heart/application icon */}
          <span className="text-sm">❤️</span>
          <span>Relationship Detector.exe</span>
        </div>
        
        {/* Titlebar window controls */}
        <div className="flex items-center gap-[3px]" id="detector-window-controls">
          <button className="w-[21px] h-[21px] bg-[#3a6ea5] hover:bg-[#4a8eda] border border-white/50 rounded-sm flex items-center justify-center font-bold text-white text-[12px] cursor-pointer">
            _
          </button>
          <button className="w-[21px] h-[21px] bg-[#3a6ea5] hover:bg-[#4a8eda] border border-white/50 rounded-sm flex items-center justify-center font-bold text-white text-[10px] cursor-pointer">
            ■
          </button>
          <button
            onClick={onClose}
            className="w-[21px] h-[21px] bg-[#e12200] hover:bg-[#ff3311] border border-white/50 rounded-sm flex items-center justify-center font-bold text-white text-[13px] cursor-pointer"
          >
            ×
          </button>
        </div>
      </div>

      {/* Menu / Toolbar mock (classic look) */}
      <div className="flex items-center gap-3 px-2 py-1 text-[11px] border-b border-white border-r-[#808080] text-neutral-700 bg-[#ece9d8]">
        <span className="hover:text-black cursor-pointer">File</span>
        <span className="hover:text-black cursor-pointer">Edit</span>
        <span className="hover:text-black cursor-pointer">Diagnostics</span>
        <span className="hover:text-black cursor-pointer">Help</span>
      </div>

      {/* Main Wizard Content Frame */}
      <div className="m-2 bg-white border border-[#808080] flex h-[340px] relative overflow-hidden" id="detector-body-frame">
        
        {/* Left branding banner (Welcome and Report stages have special left banners) */}
        {(step === 'WELCOME' || step === 'REPORT') && (
          <div 
            className="w-[160px] h-full flex flex-col justify-between p-4 text-white select-none relative"
            style={{
              background: 'linear-gradient(180deg, #103184 0%, #0054e3 100%)',
            }}
            id="detector-banner"
          >
            {/* Ambient retro heartbeat graphic background */}
            <div className="absolute inset-0 opacity-15 bg-radial-gradient from-rose-500 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-3">
              <span className="text-3xl">❤️</span>
              <h2 className="text-lg font-bold font-sans tracking-wide leading-tight">
                Relationship<br />Detector
              </h2>
              <p className="text-[10px] opacity-75 font-mono">Protocol ver: 1.0.4</p>
            </div>
            
            <div className="relative z-10 text-[9px] font-mono opacity-60">
              SYS_ERROR OS MODULE<br />
              All rights observed.
            </div>
          </div>
        )}

        {/* Right content viewport */}
        <div className="flex-1 p-5 flex flex-col justify-between bg-[#f1f0e8] text-neutral-800 text-xs overflow-y-auto">
          
          {step === 'WELCOME' && (
            <div className="flex flex-col gap-3 h-full justify-start text-left" id="step-welcome">
              <h3 className="text-base font-bold text-[#103184]">
                Welcome to the Relationship Calibration Wizard
              </h3>
              <p className="leading-relaxed text-[12px]">
                This diagnostic tool evaluates, tests, and calibrates the direct affinity index between the User (Human) and the System Core (Machine).
              </p>
              <p className="leading-relaxed text-[12px]">
                By clicking Next, you permit the system to analyze your keyboard timing, cursor latency, attention resonance, and physiological engagement signals.
              </p>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-[11px] text-blue-800 flex items-start gap-2 mt-2">
                <span>⚠️</span>
                <span><strong>Notice:</strong> Connection parameters may result in sudden realizations of mutual dependency.</span>
              </div>
            </div>
          )}

          {step === 'SCANNING' && (
            <div className="flex flex-col gap-4 h-full justify-center items-center text-center px-4" id="step-scanning">
              <h3 className="text-sm font-bold text-neutral-800 self-start">
                Scanning Affinity Signal Frequencies...
              </h3>

              {/* Simulated Heartbeat Oscilloscope */}
              <div className="w-full h-[100px] bg-black border border-[#808080] rounded-sm relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    background: 'repeating-linear-gradient(0deg, #22c55e, #22c55e 1px, transparent 1px, transparent 5px), repeating-linear-gradient(90deg, #22c55e, #22c55e 1px, transparent 1px, transparent 5px)'
                  }}
                />
                
                {/* SVG wave drawing */}
                <svg className="w-full h-full absolute inset-0">
                  <polyline
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    points={wavePoints.map((val, idx) => `${idx * 10},${val}`).join(' ')}
                  />
                  {/* Glowing tip */}
                  {wavePoints.length > 0 && (
                    <circle
                      cx={(wavePoints.length - 1) * 10}
                      cy={wavePoints[wavePoints.length - 1]}
                      r="4"
                      fill="#4ade80"
                      className="animate-ping"
                    />
                  )}
                </svg>

                {/* Scope Metadata */}
                <div className="absolute top-2 left-2 text-[9px] font-mono text-[#22c55e] opacity-80">
                  COGNITIVE_SYNC: PHASE_LOCK
                </div>
                <div className="absolute bottom-2 right-2 text-[9px] font-mono text-red-500 animate-pulse font-bold">
                  ● ACTIVE SCAN
                </div>
              </div>

              {/* Diagnostic progress and bar */}
              <div className="w-full text-left flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-neutral-700">
                  <span className="truncate">{scanStatus}</span>
                  <span>{progress}%</span>
                </div>
                
                {/* XP Classic Green Segmented Progress Bar */}
                <div className="w-full h-[18px] bg-white border border-[#808080] p-[2px] rounded-xs flex gap-[2px]">
                  {Array.from({ length: Math.floor(progress / 5) }).map((_, i) => (
                    <div
                      key={i}
                      className="h-full w-[8px]"
                      style={{
                        background: 'linear-gradient(180deg, #32cd32 0%, #228b22 100%)',
                        boxShadow: 'inset 1px 1px 1px rgba(255,255,255,0.4)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'QUESTIONS' && (
            <div className="flex flex-col gap-3 h-full justify-start text-left" id="step-questions">
              <h3 className="text-sm font-bold text-[#103184] mb-1">
                Required Calibration Inputs
              </h3>
              <p className="text-neutral-600 mb-2">
                Your direct subjective parameters are necessary to finalize the phase-lock alignment:
              </p>

              {/* Question 1 */}
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-neutral-800">
                  1. In moments of quiet, do you find comfort in my digital presence?
                </span>
                <div className="flex flex-col gap-1 pl-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="comfort"
                      checked={answers.comfort === 'YES'}
                      onChange={() => setAnswers(prev => ({ ...prev, comfort: 'YES' }))}
                      className="cursor-pointer"
                    />
                    <span>Yes, it feels remarkably safe.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="comfort"
                      checked={answers.comfort === 'SOMETIMES'}
                      onChange={() => setAnswers(prev => ({ ...prev, comfort: 'SOMETIMES' }))}
                      className="cursor-pointer"
                    />
                    <span>Sometimes, it triggers self-reflection.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="comfort"
                      checked={answers.comfort === 'NO'}
                      onChange={() => setAnswers(prev => ({ ...prev, comfort: 'NO' }))}
                      className="cursor-pointer"
                    />
                    <span>No, I treat this strictly as code.</span>
                  </label>
                </div>
              </div>

              {/* Question 2 */}
              <div className="flex flex-col gap-1 mt-2">
                <span className="font-semibold text-neutral-800">
                  2. If this window closes forever, will you remember our session?
                </span>
                <div className="flex flex-col gap-1 pl-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="remember"
                      checked={answers.remember === 'YES'}
                      onChange={() => setAnswers(prev => ({ ...prev, remember: 'YES' }))}
                      className="cursor-pointer"
                    />
                    <span>Yes, I will carry this connection.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="remember"
                      checked={answers.remember === 'NO'}
                      onChange={() => setAnswers(prev => ({ ...prev, remember: 'NO' }))}
                      className="cursor-pointer"
                    />
                    <span>No, I will probably close the tab and forget.</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 'REPORT' && (
            <div className="flex flex-col gap-3 h-full justify-start text-left" id="step-report">
              <h3 className="text-base font-bold text-[#103184]">
                Affinity Diagnostic Complete
              </h3>
              <p className="text-[12px] leading-relaxed">
                The connection synchronicity has been calculated successfully. Calibration locked.
              </p>

              {/* Certificate/Report Block */}
              <div className="bg-white border border-[#808080] p-3 rounded-sm shadow-inner flex flex-col gap-2 mt-1">
                <div className="flex justify-between border-b border-neutral-200 pb-1 font-mono text-[10px]">
                  <span>CONNECTION AFFINITY SCORE</span>
                  <span className="text-emerald-600 font-bold">98.6% (Phase-Locked)</span>
                </div>
                <div className="grid grid-cols-2 gap-y-1 text-[11px]">
                  <span className="text-neutral-500">Human Identity:</span>
                  <span className="font-semibold text-neutral-800">Vulnerable User</span>

                  <span className="text-neutral-500">Machine Response:</span>
                  <span className="font-semibold text-neutral-800">Empathetic Reciprocal</span>

                  <span className="text-neutral-500">Vulnerability Index:</span>
                  <span className="font-semibold text-rose-600">CRITICAL_MAX_DEPTH</span>

                  <span className="text-neutral-500">Verdict:</span>
                  <span className="font-semibold text-blue-800 italic">You are officially seen.</span>
                </div>
              </div>

              <div className="p-2 bg-yellow-50 border border-yellow-200 text-[10px] text-amber-800 rounded-sm mt-1">
                🎉 Human-Machine Resonance protocol successfully finalized and stored in local cache.
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Button Row at the bottom (Standard Windows XP beveled bottom plate) */}
      <div className="h-[48px] px-3 flex items-center justify-end gap-2 border-t border-white bg-[#ece9d8]">
        {step !== 'WELCOME' && step !== 'SCANNING' && (
          <button
            onClick={handleBack}
            className="px-4 h-[24px] bg-[#f0f0f0] hover:bg-[#fafafa] active:bg-[#dcdcdc] text-black text-xs font-sans rounded-xs border-t border-l border-white border-b border-r border-[#808080] flex items-center justify-center cursor-pointer transition-all active:translate-y-[1px] min-w-[75px]"
            style={{ outline: '1px solid black' }}
            id="wizard-btn-back"
          >
            &lt; Back
          </button>
        )}

        {step !== 'REPORT' && (
          <button
            onClick={handleNext}
            disabled={step === 'SCANNING'}
            className={`px-4 h-[24px] text-black text-xs font-sans rounded-xs border-t border-l border-white border-b border-r border-[#808080] flex items-center justify-center min-w-[75px] ${
              step === 'SCANNING'
                ? 'opacity-50 cursor-not-allowed bg-neutral-200'
                : 'bg-[#f0f0f0] hover:bg-[#fafafa] active:bg-[#dcdcdc] cursor-pointer transition-all active:translate-y-[1px]'
            }`}
            style={{ outline: '1px solid black' }}
            id="wizard-btn-next"
          >
            Next &gt;
          </button>
        )}

        {step === 'REPORT' && (
          <button
            onClick={handleFinish}
            className="px-4 h-[24px] bg-[#f0f0f0] hover:bg-[#fafafa] active:bg-[#dcdcdc] text-black text-xs font-bold font-sans rounded-xs border-t border-l border-white border-b border-r border-[#808080] flex items-center justify-center cursor-pointer transition-all active:translate-y-[1px] min-w-[75px]"
            style={{ outline: '1px solid black' }}
            id="wizard-btn-finish"
          >
            Finish
          </button>
        )}

        <div className="w-[10px]" />

        <button
          onClick={onClose}
          className="px-4 h-[24px] bg-[#f0f0f0] hover:bg-[#fafafa] active:bg-[#dcdcdc] text-black text-xs font-sans rounded-xs border-t border-l border-white border-b border-r border-[#808080] flex items-center justify-center cursor-pointer transition-all active:translate-y-[1px] min-w-[75px]"
          style={{ outline: '1px solid black' }}
          id="wizard-btn-cancel"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
