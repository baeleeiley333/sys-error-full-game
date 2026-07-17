/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Synthesizes a beautiful, swelling 6-note retro chord with a shimmering finish.
   */
  public playStartupChime() {
    this.playXpStartup();
  }

  /**
   * High fidelity synthesis of the legendary Windows XP Startup Sound.
   * Features a swelling warm analog string pad chord under a glassy 6-note chime melody.
   */
  public playXpStartup() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const masterVolume = this.ctx.createGain();
      masterVolume.gain.setValueAtTime(0.001, now);
      masterVolume.gain.linearRampToValueAtTime(0.4, now + 1.2);
      masterVolume.gain.exponentialRampToValueAtTime(0.001, now + 5.5);
      masterVolume.connect(this.ctx.destination);

      // --- LAYER 1: THE WARM ANALOG SYNTH PAD CHORD (Ab Major) ---
      // Frequencies: Ab2 (103.83Hz), Eb3 (155.56Hz), Ab3 (207.65Hz), C4 (261.63Hz), Eb4 (311.13Hz)
      const padFreqs = [103.83, 155.56, 207.65, 261.63, 311.13];
      padFreqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc2.type = 'triangle';

        // Detune slightly for lush analog chorus effect
        osc1.frequency.setValueAtTime(freq - 0.6, now);
        osc2.frequency.setValueAtTime(freq + 0.6, now);

        // Lowpass filter for warm, brassy, smooth textures (not harsh)
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, now);
        filter.frequency.exponentialRampToValueAtTime(650, now + 1.5);
        filter.frequency.exponentialRampToValueAtTime(180, now + 5.0);
        filter.Q.setValueAtTime(1.2, now);

        // Slow swelling gain envelope
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 1.5 + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 5.0);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(masterVolume);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 5.2);
        osc2.stop(now + 5.2);
      });

      // --- LAYER 2: THE LEGENDARY CHIME MELODY (Ab4 -> Bb4 -> Eb5 -> Eb4 -> Ab4 -> C5) ---
      // 1. Ab4 (415.30Hz) @ 1.0s
      // 2. Bb4 (466.16Hz) @ 1.2s
      // 3. Eb5 (622.25Hz) @ 1.4s
      // 4. Eb4 (311.13Hz) @ 1.8s
      // 5. Ab4 (415.30Hz) @ 2.0s
      // 6. C5  (523.25Hz) @ 2.25s
      const melody = [
        { freq: 415.30, start: 1.0, duration: 0.5 },
        { freq: 466.16, start: 1.2, duration: 0.5 },
        { freq: 622.25, start: 1.4, duration: 1.2 },
        { freq: 311.13, start: 1.8, duration: 0.5 },
        { freq: 415.30, start: 2.0, duration: 0.5 },
        { freq: 523.25, start: 2.25, duration: 2.8 }
      ];

      melody.forEach((note) => {
        if (!this.ctx) return;
        const noteTime = now + note.start;
        
        // Crisp glass/bell component (Sine + soft Triangle)
        const bellOsc1 = this.ctx.createOscillator();
        const bellOsc2 = this.ctx.createOscillator();
        const bellGain = this.ctx.createGain();
        const bellFilter = this.ctx.createBiquadFilter();

        bellOsc1.type = 'sine';
        bellOsc2.type = 'triangle';

        bellOsc1.frequency.setValueAtTime(note.freq, noteTime);
        // Harmonic ring component for bell texture
        bellOsc2.frequency.setValueAtTime(note.freq * 2, noteTime);

        bellFilter.type = 'lowpass';
        bellFilter.frequency.setValueAtTime(2000, noteTime);

        // Percussive bell volume envelope
        bellGain.gain.setValueAtTime(0.001, noteTime);
        bellGain.gain.linearRampToValueAtTime(0.15, noteTime + 0.03); // quick attack
        bellGain.gain.exponentialRampToValueAtTime(0.001, noteTime + note.duration);

        bellOsc1.connect(bellFilter);
        bellOsc2.connect(bellFilter);
        bellFilter.connect(bellGain);
        bellGain.connect(masterVolume);

        bellOsc1.start(noteTime);
        bellOsc2.start(noteTime);
        bellOsc1.stop(noteTime + note.duration + 0.1);
        bellOsc2.stop(noteTime + note.duration + 0.1);
      });

    } catch (e) {
      console.warn("XP Startup Audio failed:", e);
    }
  }

  /**
   * Generates a single vintage retro click sound (e.g., keyboard type sound).
   */
  public playTypeBeep() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      // Slight pitch slide for a mechanical switch click sound
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.02);

      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {
      // Ignore audio errors
    }
  }

  /**
   * Play classic Windows login success click sound.
   */
  public playSubmitChime() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Synthesizes the warm, iconic Windows XP "Chord" (warning/error) chime.
   * A classic combination of frequencies around G3, D4, G4, B4, D5.
   */
  public playXpWarning() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const master = this.ctx.createGain();
      master.gain.setValueAtTime(0.001, now);
      master.gain.linearRampToValueAtTime(0.35, now + 0.05);
      master.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      master.connect(this.ctx.destination);

      // Warm organ-like chord: G3, D4, G4, B4, D5
      const freqs = [196.00, 293.66, 392.00, 493.88, 587.33];
      freqs.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc1.type = 'triangle';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(freq - 0.5, now);
        osc2.frequency.setValueAtTime(freq + 0.5, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + 0.8);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0 + i * 0.05);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(master);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.2);
        osc2.stop(now + 1.2);
      });
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Sparkling ascending arpeggio + shimmer — step transition "magic" cue.
   */
  public playMagicTransition() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const master = this.ctx.createGain();
      master.gain.setValueAtTime(0.001, now);
      master.gain.linearRampToValueAtTime(0.28, now + 0.04);
      master.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      master.connect(this.ctx.destination);

      const arpeggio = [523.25, 659.25, 783.99, 987.77, 1318.51];
      arpeggio.forEach((freq, i) => {
        if (!this.ctx) return;
        const t = now + i * 0.07;
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc2.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        osc2.frequency.setValueAtTime(freq * 2.01, t);

        filter.type = 'highpass';
        filter.frequency.setValueAtTime(400, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.14 - i * 0.012, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(master);

        osc.start(t);
        osc2.start(t);
        osc.stop(t + 0.5);
        osc2.stop(t + 0.5);
      });

      // Soft whoosh
      const whoosh = this.ctx.createOscillator();
      const whooshGain = this.ctx.createGain();
      const whooshFilter = this.ctx.createBiquadFilter();
      whoosh.type = 'sine';
      whoosh.frequency.setValueAtTime(220, now);
      whoosh.frequency.exponentialRampToValueAtTime(1800, now + 0.35);
      whooshFilter.type = 'bandpass';
      whooshFilter.frequency.setValueAtTime(600, now);
      whooshFilter.frequency.exponentialRampToValueAtTime(2400, now + 0.4);
      whooshFilter.Q.value = 0.8;
      whooshGain.gain.setValueAtTime(0.001, now);
      whooshGain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      whoosh.connect(whooshFilter);
      whooshFilter.connect(whooshGain);
      whooshGain.connect(this.ctx.destination);
      whoosh.start(now);
      whoosh.stop(now + 0.6);
    } catch (e) {
      console.warn('Magic transition audio failed:', e);
    }
  }

  /**
   * Generates a cute retro synthesizer dog bark sound ("ruff ruff!").
   */
  public playRoverBark() {
    try {
      this.init();
      if (!this.ctx) return;

      const playSingleBark = (startTime: number) => {
        if (!this.ctx) return;
        const ctx = this.ctx;
        
        // Downward sweeping pitch
        const osc = ctx.createOscillator();
        const noise = ctx.createOscillator(); // we will use triangular with high frequency detuning for a quick rough texture
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, startTime);
        osc.frequency.exponentialRampToValueAtTime(140, startTime + 0.12);

        // Rough bark texture using a secondary pulse-like oscillator
        noise.type = 'sawtooth';
        noise.frequency.setValueAtTime(180, startTime);
        noise.frequency.exponentialRampToValueAtTime(80, startTime + 0.12);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, startTime);
        filter.frequency.exponentialRampToValueAtTime(220, startTime + 0.12);
        filter.Q.setValueAtTime(3, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

        osc.connect(filter);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        noise.start(startTime);
        osc.stop(startTime + 0.18);
        noise.stop(startTime + 0.18);
      };

      const now = this.ctx.currentTime;
      // Bark twice! "Ruff! Ruff!"
      playSingleBark(now);
      playSingleBark(now + 0.16);
    } catch (e) {
      // Ignore
    }
  }
}

export const audio = new AudioEngine();
