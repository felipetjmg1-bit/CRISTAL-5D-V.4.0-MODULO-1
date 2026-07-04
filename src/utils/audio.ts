// Web Audio API Synth Engine for Cinematic 5D Storage Simulator
let audioCtx: AudioContext | null = null;
let ambientOsc: OscillatorNode | null = null;
let ambientFilter: BiquadFilterNode | null = null;
let ambientGain: GainNode | null = null;

let laserOsc: OscillatorNode | null = null;
let laserGain: GainNode | null = null;
let laserInterval: any = null;

let muted = true;
let activeUtterance: SpeechSynthesisUtterance | null = null;

export function initAudio() {
  if (audioCtx) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
    setupAmbientHum();
  } catch (e) {
    console.error("Web Audio API not supported", e);
  }
}

export function toggleMute(forceState?: boolean): boolean {
  muted = forceState !== undefined ? forceState : !muted;
  
  // Make sure AudioContext is initialized when unmuting
  if (!muted) {
    initAudio();
  }

  if (audioCtx) {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(err => console.warn("Failed to resume AudioContext:", err));
    }
    
    if (muted) {
      if (ambientGain) ambientGain.gain.setValueAtTime(0, audioCtx.currentTime);
    } else {
      if (ambientGain) ambientGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    }
  }
  return muted;
}

export function getMuteState(): boolean {
  return muted;
}

function setupAmbientHum() {
  if (!audioCtx) return;

  try {
    // Create ambient laboratory hum
    ambientOsc = audioCtx.createOscillator();
    ambientFilter = audioCtx.createBiquadFilter();
    ambientGain = audioCtx.createGain();

    ambientOsc.type = 'sawtooth';
    ambientOsc.frequency.setValueAtTime(55, audioCtx.currentTime); // Low A hum

    ambientFilter.type = 'lowpass';
    ambientFilter.frequency.setValueAtTime(110, audioCtx.currentTime); // Filter high end
    ambientFilter.Q.setValueAtTime(5, audioCtx.currentTime);

    ambientGain.gain.setValueAtTime(muted ? 0 : 0.08, audioCtx.currentTime);

    ambientOsc.connect(ambientFilter);
    ambientFilter.connect(ambientGain);
    ambientGain.connect(audioCtx.destination);

    ambientOsc.start();
  } catch (err) {
    console.warn("Failed to set up ambient hum synth:", err);
  }
}

/**
 * Sweeping crystal sound for injecting elements
 */
export function playInjectionSound(type: 'erbium' | 'lithium') {
  initAudio();
  if (!audioCtx || muted) return;
  
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gainNode = audioCtx.createGain();

    const startFreq = type === 'erbium' ? 440 : 660;
    const endFreq = type === 'erbium' ? 880 : 1320;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 1.2);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(startFreq * 1.5, now);
    filter.frequency.exponentialRampToValueAtTime(endFreq * 1.5, now + 1.2);
    filter.Q.setValueAtTime(12, now);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 1.2);
  } catch (err) {
    console.warn("Failed to play injection sound:", err);
  }
}

/**
 * Dynamic pulsing clicks when laser writes voxels
 */
export function startLaserWritingSfx() {
  initAudio();
  if (!audioCtx || muted || laserInterval) return;
  
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    let tickCount = 0;
    laserInterval = setInterval(() => {
      if (!audioCtx || muted) return;
      try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        // Alternate frequency to sound like high-precision optical laser writing
        const freq = 1200 + (tickCount % 5) * 350;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.05);

        tickCount++;
      } catch (err) {
        // Prevent error stack overflow in case context gets suspended
      }
    }, 60);
  } catch (err) {
    console.warn("Failed to start laser writing SFX:", err);
  }
}

export function stopLaserWritingSfx() {
  if (laserInterval) {
    clearInterval(laserInterval);
    laserInterval = null;
  }
}

/**
 * Standard utility feedback click
 */
export function playClickSfx() {
  initAudio();
  if (!audioCtx || muted) return;

  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    gainNode.gain.setValueAtTime(0.04, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (err) {
    console.warn("Failed to play click sound:", err);
  }
}

/**
 * Speech Synthesis Narrator for explaining the 5D writing process in Portuguese
 */
export function speakText(text: string, onStart?: () => void, onEnd?: () => void) {
  try {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Create speech utterance
      activeUtterance = new SpeechSynthesisUtterance(text);
      activeUtterance.lang = 'pt-BR';
      
      // Try to find a premium Brazilian voice
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang.startsWith('pt'));
      if (ptVoice) {
        activeUtterance.voice = ptVoice;
      }
      
      // Calibrate speech pace for professional narration
      activeUtterance.rate = 1.05;
      activeUtterance.pitch = 1.0;

      if (onStart) activeUtterance.onstart = onStart;
      if (onEnd) {
        activeUtterance.onend = onEnd;
        activeUtterance.onerror = onEnd;
      }

      window.speechSynthesis.speak(activeUtterance);
    } else {
      console.warn("Speech synthesis is not supported in this browser.");
      if (onEnd) onEnd();
    }
  } catch (error) {
    console.error("Error in speech synthesis narrator:", error);
    if (onEnd) onEnd();
  }
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
