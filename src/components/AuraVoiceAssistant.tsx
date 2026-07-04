import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Square, Pause, Volume2, VolumeX, Mic, HelpCircle, ChevronRight, ChevronLeft, X, Sparkles, User, Radio, Disc, Keyboard, Send } from 'lucide-react';
import { playClickSfx } from '../utils/audio';

interface StepDetail {
  title: string;
  shortDesc: string;
  narration: string;
  badge: string;
  targetId?: string;
}

const VOICE_STEPS: StepDetail[] = [
  {
    title: "Carregar Bloco de Transações",
    shortDesc: "Selecione e prepare as transações da rede DREX.",
    narration: "Olá, eu sou a Aurora, sua assistente virtual de operações! Para começar, selecione um bloco de transações financeiras no painel do Ledger do DREX localizado no canto inferior esquerdo. Clique no botão de carregamento para preparar os dados de transações que serão gravados fisicamente no cristal de quartzo de forma imutável e ecológica!",
    badge: "Passo 1",
    targetId: "drex-ledger-panel"
  },
  {
    title: "Purificar & Monitorar Cristal",
    shortDesc: "Verifique os diagnósticos e garanta alta pureza do silício.",
    narration: "Excelente. No segundo passo, observe o painel de diagnósticos na coluna lateral. Para uma gravação com emissão zero e zero falhas de dados, a pureza do cristal precisa ser máxima. Se o indicador de anomalia térmica piscar em vermelho devido ao laser quente, pressione imediatamente o botão de Recalibragem de Emergência para estabilizar os sistemas.",
    badge: "Passo 2",
    targetId: "sidebar-diagnostics"
  },
  {
    title: "Ajustar Dopantes (Er / Li)",
    shortDesc: "Dope o quartzo com Érbio e Lítio para melhorar a estabilidade óptica.",
    narration: "No terceiro passo, use os seletores deslizantes para ajustar a dopagem de Érbio e Lítio. O Érbio otimiza os canais de refração luminosa e o Lítio garante a fixação molecular. Monitore as variações térmicas no mapa de calor D3 e veja o impacto ecológico acumulado de longo prazo na aba de impacto.",
    badge: "Passo 3",
    targetId: "tab-doping-button"
  },
  {
    title: "Gravação 5D de Alta Precisão",
    shortDesc: "O laser de femtossegundo codifica os dados ópticos.",
    narration: "Quarto passo. Uma vez configurados os dopantes e com o bloco ativado, o laser de femtossegundo inicia a gravação tridimensional, codificando os dados através de variações microscópicas de intensidade e polarização da luz. Veja o modelo do holograma de cristal girar e os feixes pulsantes trabalharem.",
    badge: "Passo 4",
    targetId: "crystal-simulator-container"
  },
  {
    title: "Conformidade & Registro Eterno",
    shortDesc: "Gere o certificado com hash imutável por 20.000 anos.",
    narration: "Por fim, o sistema conclui a escrita e gera automaticamente o seu Certificado de Conformidade DREX! O hash seguro é gravado na estrutura atômica do vidro de quartzo. Concluímos nosso passo a passo operacional! Agora você pode fechar esta aba de instruções e guias a qualquer momento clicando no botão Concluir e Fechar abaixo. Muito obrigada e boa simulação!",
    badge: "Passo 5",
    targetId: "btn-generate-certificate"
  }
];

export default function AuraVoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceRate, setVoiceRate] = useState(0.95); // Natural speed
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [isUsingGemini, setIsUsingGemini] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastHeardWord, setLastHeardWord] = useState('');
  const [inputVolume, setInputVolume] = useState(0);
  const [micSensitivity, setMicSensitivity] = useState(50); // Exact 50% initial state for immediate response
  const [soundThresholdDb, setSoundThresholdDb] = useState(-50); // Decibel activation threshold (dB)
  const [currentDbLevel, setCurrentDbLevel] = useState(-100); // Real-time decibels readout
  const [soundwaveTheme, setSoundwaveTheme] = useState<'Aurora' | 'Drex-Blue' | 'Cyber-Neon'>('Aurora');
  const [waveShape, setWaveShape] = useState<'Linear' | 'Sinoidal' | 'Quadrada'>('Linear');
  const [isExpanded, setIsExpanded] = useState(false);
  const [textCommandInput, setTextCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  const executeTextCommand = (command: string) => {
    const cleanCommand = command.toLowerCase().trim();
    if (!cleanCommand) return;
    
    playClickSfx();
    setLastHeardWord(`"${command}"`);
    setCommandHistory(prev => [command, ...prev].slice(0, 5));
    
    if (
      cleanCommand.includes('fechar') || 
      cleanCommand.includes('encerrar') || 
      cleanCommand.includes('concluir') ||
      cleanCommand.includes('parar')
    ) {
      triggerCloseModals();
    } else if (cleanCommand.includes('passo 1') || cleanCommand.includes('etapa 1') || cleanCommand.includes('bloco')) {
      setCurrentStep(0);
      speakText(VOICE_STEPS[0].narration);
    } else if (cleanCommand.includes('passo 2') || cleanCommand.includes('etapa 2') || cleanCommand.includes('cristal') || cleanCommand.includes('purificar')) {
      setCurrentStep(1);
      speakText(VOICE_STEPS[1].narration);
    } else if (cleanCommand.includes('passo 3') || cleanCommand.includes('etapa 3') || cleanCommand.includes('dopante') || cleanCommand.includes('erbio') || cleanCommand.includes('litio')) {
      setCurrentStep(2);
      speakText(VOICE_STEPS[2].narration);
    } else if (cleanCommand.includes('passo 4') || cleanCommand.includes('etapa 4') || cleanCommand.includes('laser') || cleanCommand.includes('femto') || cleanCommand.includes('gravação')) {
      setCurrentStep(3);
      speakText(VOICE_STEPS[3].narration);
    } else if (cleanCommand.includes('passo 5') || cleanCommand.includes('etapa 5') || cleanCommand.includes('certificado') || cleanCommand.includes('registro')) {
      setCurrentStep(4);
      speakText(VOICE_STEPS[4].narration);
    } else {
      speakText(command);
    }
    setTextCommandInput('');
  };

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micRafRef = useRef<number | null>(null);
  const micSensitivityRef = useRef(1.75);
  const soundThresholdDbRef = useRef(-50);

  useEffect(() => {
    // Map 0% - 100% to 0.5x - 3.0x multiplier
    const multiplier = 0.5 + (micSensitivity / 100) * 2.5;
    micSensitivityRef.current = multiplier;
  }, [micSensitivity]);

  useEffect(() => {
    soundThresholdDbRef.current = soundThresholdDb;
  }, [soundThresholdDb]);

  // Initialize SpeechRecognition safely
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript.toLowerCase().trim();
          setLastHeardWord(transcript);
          
          if (
            transcript.includes('fechar') || 
            transcript.includes('encerrar') || 
            transcript.includes('concluir') ||
            transcript.includes('parar')
          ) {
            triggerCloseModals();
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = (e: any) => {
          console.warn("Speech recognition error:", e);
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    playClickSfx();
    if (!recognitionRef.current) {
      alert("Reconhecimento de voz não é suportado ou permitido neste navegador.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        setLastHeardWord('');
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Speech recognition start failed:", e);
      }
    }
  };

  const triggerCloseModals = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aura-close-modals'));
      // Friendly voice feedback with Gemini
      speakText("Certificado encerrado com sucesso! Se precisar de mais alguma coisa, estarei aqui.");
      // Stop listening after successful command execution to keep state clean
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  // Load voices asynchronously
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        const ptBR = availableVoices.filter(v => v.lang.startsWith('pt-BR'));
        setVoices(ptBR.length > 0 ? ptBR : availableVoices);
        
        // Auto-select a high quality female sounding pt-BR voice if possible
        const femaleKeywords = ['maria', 'luciana', 'francisca', 'google português do brasil', 'female', 'mulher', 'lucia', 'joana', 'helena', 'zambian'];
        const bestVoice = ptBR.find(v => 
          femaleKeywords.some(kw => v.name.toLowerCase().includes(kw))
        ) || ptBR[0];

        if (bestVoice) {
          setSelectedVoiceName(bestVoice.name);
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const cleanupMicTracking = () => {
    if (micRafRef.current) {
      cancelAnimationFrame(micRafRef.current);
      micRafRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (micAudioCtxRef.current) {
      if (micAudioCtxRef.current.state !== 'closed') {
        micAudioCtxRef.current.close().catch(() => {});
      }
      micAudioCtxRef.current = null;
    }
    micAnalyserRef.current = null;
    setInputVolume(0);
  };

  // Track microphone volume level in real-time when listening
  useEffect(() => {
    if (!isListening) {
      cleanupMicTracking();
      return;
    }

    let active = true;

    async function setupMicTracking() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        micStreamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        micAudioCtxRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128; // Small fftSize is enough and faster
        micAnalyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        let frameCount = 0;
        const updateVolume = () => {
          if (!active) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;

          // Map average (0-255) to a clean decibel scale (-100 dB to 0 dB)
          const currentDb = avg === 0 ? -100 : Math.round(20 * Math.log10(avg / 255));

          frameCount++;
          if (frameCount % 10 === 0) {
            setCurrentDbLevel(currentDb);
          }

          let normalized = 0;
          // Check if current decibel level is above the threshold before activating soundwave
          if (currentDb >= soundThresholdDbRef.current) {
            // Scale it to 0-1 nicely using manual sensitivity
            normalized = Math.min(1, (avg / 80) * micSensitivityRef.current);
          } else {
            normalized = 0;
          }

          setInputVolume(normalized);
          micRafRef.current = requestAnimationFrame(updateVolume);
        };

        updateVolume();
      } catch (err) {
        console.warn("Could not access microphone for volume visualization:", err);
      }
    }

    setupMicTracking();

    return () => {
      active = false;
      cleanupMicTracking();
    };
  }, [isListening]);

  // Stop speaking on unmount
  useEffect(() => {
    return () => {
      handleStop();
    };
  }, []);

  // Highlight step target elements on hover/focus in assistant
  useEffect(() => {
    if (!isOpen) {
      document.querySelectorAll('.aura-highlight-active').forEach(el => {
        el.classList.remove('aura-highlight-active');
      });
      return;
    }

    const step = VOICE_STEPS[currentStep];
    if (step.targetId) {
      const element = document.getElementById(step.targetId);
      if (element) {
        element.classList.add('aura-highlight-active');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return () => {
          element.classList.remove('aura-highlight-active');
        };
      }
    }
  }, [isOpen, currentStep]);

  const speakText = async (text: string) => {
    // 1. Cancel any active playback
    handleStopSilently();

    if (isMuted) return;

    // Create a new AbortController for this call
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsProcessing(true);

    // 2. Try calling Gemini TTS API
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Gemini API returned error status');
      }

      const data = await response.json();
      setIsProcessing(false);
      
      if (data.audio) {
        // Double check we haven't been aborted in the meantime
        if (controller.signal.aborted) return;

        setIsUsingGemini(true);
        playPcmAudio(data.audio, text);
        return;
      }
    } catch (err: any) {
      setIsProcessing(false);
      if (err.name === 'AbortError') {
        console.log("Fetch aborted");
        return;
      }
      console.warn("Gemini Voice API failed or key not configured:", err);
    }

    // 3. Fallback to browser SpeechSynthesis is disabled per user instructions to ensure ONLY the animated Gemini voice runs.
    console.log("SpeechSynthesis is disabled as requested. Please configure GEMINI_API_KEY to hear the animated voice.");
  };

  const playPcmAudio = (base64Data: string, originalText: string) => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass({ sampleRate: 24000 });
      audioCtxRef.current = audioCtx;

      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const numSamples = len / 2;
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        float32Array[i] = int16Array[i] / 32768.0; // normalize
      }

      const audioBuffer = audioCtx.createBuffer(1, numSamples, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      source.onended = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setIsUsingGemini(false);
      };

      source.start(0);
      audioSourceRef.current = source;
      setIsSpeaking(true);
      setIsPaused(false);
    } catch (err) {
      console.error("Failed to play PCM audio:", err);
    }
  };

  const playLocalSpeech = (text: string) => {
    // Disabled to guarantee that ONLY the animated Gemini Voice is used
    console.warn("Local speechSynthesis is disabled per request.", text);
  };

  const handleTogglePlay = () => {
    playClickSfx();
    if (isSpeaking) {
      if (isPaused) {
        if (audioCtxRef.current) {
          audioCtxRef.current.resume();
        }
        setIsPaused(false);
      } else {
        if (audioCtxRef.current) {
          audioCtxRef.current.suspend();
        }
        setIsPaused(true);
      }
    } else {
      speakText(VOICE_STEPS[currentStep].narration);
    }
  };

  const handleStopSilently = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {}
      audioSourceRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setIsProcessing(false);
    setIsUsingGemini(false);
  };

  const handleStop = () => {
    playClickSfx();
    handleStopSilently();
  };

  const handleNext = () => {
    playClickSfx();
    const nextIdx = (currentStep + 1) % VOICE_STEPS.length;
    setCurrentStep(nextIdx);
    
    setTimeout(() => {
      speakText(VOICE_STEPS[nextIdx].narration);
    }, 150);
  };

  const handlePrev = () => {
    playClickSfx();
    const prevIdx = currentStep === 0 ? VOICE_STEPS.length - 1 : currentStep - 1;
    setCurrentStep(prevIdx);
    
    setTimeout(() => {
      speakText(VOICE_STEPS[prevIdx].narration);
    }, 150);
  };

  const toggleMute = () => {
    playClickSfx();
    if (!isMuted) {
      handleStopSilently();
    }
    setIsMuted(!isMuted);
  };

  return (
    <>
      {/* Tiny clean floating helper button next to system tour */}
      <button
        onClick={() => {
          playClickSfx();
          setIsOpen(!isOpen);
          // Greeting when opening
          if (!isOpen) {
            setTimeout(() => {
              speakText("Olá! Eu sou a Aurora, sua guia virtual de voz super animada! É um imenso prazer guiar você por aqui. Vamos aprender juntos a operar este incrível simulador tridimensional do DREX e gravação atômica em cristal de quartzo de forma rápida, segura e sustentável!");
            }, 300);
          } else {
            handleStop();
          }
        }}
        className="fixed bottom-4 right-36 z-[90] flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-mono text-[9px] font-bold uppercase tracking-wider rounded-full shadow-[0_4px_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer hover:scale-105 active:scale-95 border border-emerald-400/20"
        title="Assistente de Voz Feminina (Aurora)"
      >
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSpeaking ? 'bg-cyan-400' : isProcessing ? 'bg-cyan-300' : 'bg-emerald-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isSpeaking ? 'bg-cyan-400' : isProcessing ? 'bg-cyan-400' : 'bg-emerald-500'}`}></span>
        </span>
        {isSpeaking ? (
          <div className="flex items-end gap-[2px] h-3 px-0.5">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ height: ['20%', '100%', '20%'] }}
                transition={{ repeat: Infinity, duration: 0.4 + i * 0.1, ease: "easeInOut" }}
                className="w-0.5 bg-white rounded-full"
              />
            ))}
          </div>
        ) : (
          <Volume2 className={`w-3.5 h-3.5 ${isProcessing ? 'animate-pulse text-cyan-200' : ''}`} />
        )}
        <span>{isProcessing ? 'Carregando Voz...' : 'Voz da Aurora'}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="AuraVoiceAssistant"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`fixed bottom-16 right-4 z-[95] ${isExpanded ? 'w-[24rem]' : 'w-80'} bg-[#060a13]/95 border border-emerald-500/30 rounded-2xl shadow-[0_12px_45px_rgba(16,185,129,0.2)] overflow-hidden backdrop-blur-md font-sans transition-all duration-300`}
          >
            {/* Holographic Glowing Top Bar */}
            <div className="relative h-1 w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500" />
            
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      playClickSfx();
                      setIsExpanded(!isExpanded);
                    }}
                    className={`p-1 rounded border transition-all cursor-pointer flex items-center justify-center ${isExpanded ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-emerald-950/50 border-emerald-800/30 hover:bg-emerald-900/40'}`}
                    title="Alternar teclado de comandos fallback"
                  >
                    <Radio className={`w-3.5 h-3.5 text-emerald-400 ${isSpeaking ? 'animate-pulse text-cyan-400' : ''}`} />
                  </button>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-[10px] uppercase font-mono font-bold text-emerald-400 tracking-wider">
                        Aurora Operator AI
                      </h4>
                      {isSpeaking && (
                        <div className="flex items-end gap-[1.5px] h-2.5">
                          {[1, 2, 3, 4].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ height: ['20%', '100%', '20%'] }}
                              transition={{ repeat: Infinity, duration: 0.3 + i * 0.1, ease: "easeInOut" }}
                              className="w-[1.5px] bg-cyan-400 rounded-full"
                            />
                          ))}
                        </div>
                      )}
                      {isProcessing && (
                        <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                      )}
                    </div>
                    <p className="text-[8px] font-mono text-slate-500">
                      Guia Vocal de Instrução pt-BR
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleListening}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      isListening 
                        ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' 
                        : 'border-slate-800/50 hover:bg-slate-900/60 text-slate-400 hover:text-slate-200'
                    }`}
                    title={isListening ? "Desativar comando de voz" : "Ativar comando de voz (Fale 'Fechar' ou 'Encerrar')"}
                  >
                    <Mic className="w-3 h-3" />
                  </button>
                  <button
                    onClick={toggleMute}
                    className="p-1.5 rounded-lg border border-slate-800/50 hover:bg-slate-900/60 transition-all text-slate-400 hover:text-slate-200 cursor-pointer"
                    title={isMuted ? "Ativar som" : "Desativar som"}
                  >
                    {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => {
                      playClickSfx();
                      setIsExpanded(!isExpanded);
                    }}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${isExpanded ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'border-slate-800/50 hover:bg-slate-900/60 text-slate-400 hover:text-slate-200'}`}
                    title={isExpanded ? "Ocultar teclado de comandos" : "Exibir teclado de comandos fallback"}
                  >
                    <Keyboard className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      playClickSfx();
                      handleStop();
                      setIsOpen(false);
                    }}
                    className="p-1.5 rounded-lg border border-slate-800/50 hover:bg-slate-900/60 transition-all text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Glowing Interactive Waveform / Status Indicator */}
              <div className="relative h-12 bg-slate-950/80 border border-slate-900 rounded-lg flex flex-col items-center justify-center overflow-hidden p-2">
                {isSpeaking ? (
                  <div className="flex items-end gap-1 h-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
                      <motion.div
                        key={i}
                        animate={{
                          height: [
                            '10%',
                            `${Math.floor(Math.random() * 80) + 20}%`,
                            '10%'
                          ]
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.5 + Math.random() * 0.5,
                          ease: "easeInOut"
                        }}
                        className="w-1 bg-gradient-to-t from-emerald-500 to-cyan-400 rounded-full"
                      />
                    ))}
                  </div>
                ) : isProcessing ? (
                  <div className="flex flex-col items-center gap-1 text-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest animate-pulse">Sintetizando voz animada...</span>
                    </div>
                    {/* Minimalist horizontal scanning wave */}
                    <div className="flex gap-[3px] h-1.5 w-24 overflow-hidden mt-0.5 justify-center items-center">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <motion.div
                          key={i}
                          animate={{
                            opacity: [0.3, 1, 0.3],
                            scaleY: [1, 2.2, 1]
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.8,
                            delay: i * 0.1,
                            ease: "easeInOut"
                          }}
                          className="w-1 h-1.5 bg-cyan-500/80 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                ) : isListening ? (
                  <div className="flex flex-col items-center gap-1 text-center w-full">
                    <div className="text-[8px] font-mono text-red-400 flex items-center gap-1.5 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      <span>SINTONIZADA • Ouvindo comandos...</span>
                    </div>
                    {/* Minimalist horizontal soundwave that pulsates in real time with input volume */}
                    <div className="flex gap-[3px] h-3 items-center justify-center mt-0.5 w-full">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => {
                        // Create waveform factor based on the selected waveShape
                        let factor = 1;
                        if (waveShape === 'Linear') {
                          const distance = Math.abs(i - 6.5);
                          factor = Math.max(0.15, (6 - distance) / 6);
                        } else if (waveShape === 'Sinoidal') {
                          // Symmetric sine dome mapping index to a clean curve from 0 to 1
                          factor = Math.sin((i / 13) * Math.PI);
                        } else {
                          // Quadrada / Square - blocks or steps
                          factor = (i % 4 < 2) ? 0.85 : 0.25;
                        }
                        // Combine real-time volume pulse with a very subtle background ripple
                        const heightPercent = 20 + (inputVolume * 80 * factor);

                        // Interpolate between colors based on micSensitivity (0.5 to 3.0)
                        const sensitivityFactor = Math.min(1, Math.max(0, (micSensitivity - 0.5) / 2.5));
                        
                        let backgroundGradient = '';

                        if (soundwaveTheme === 'Aurora') {
                          // Start color (bottom of bar): Cyan (6, 182, 212) -> Neon Green (34, 197, 94)
                          const rStart = Math.round(6 + (34 - 6) * sensitivityFactor);
                          const gStart = Math.round(182 + (197 - 182) * sensitivityFactor);
                          const bStart = Math.round(212 + (94 - 212) * sensitivityFactor);

                          // End color (top of bar): Cyan (34, 211, 238) -> Neon Green (74, 222, 128)
                          const rEnd = Math.round(34 + (74 - 34) * sensitivityFactor);
                          const gEnd = Math.round(211 + (222 - 211) * sensitivityFactor);
                          const bEnd = Math.round(238 + (128 - 238) * sensitivityFactor);

                          backgroundGradient = `linear-gradient(to top, rgb(${rStart}, ${gStart}, ${bStart}), rgb(${rEnd}, ${gEnd}, ${bEnd}))`;
                        } else if (soundwaveTheme === 'Drex-Blue') {
                          // Royal Blue (37, 99, 235) -> Deep Violet (124, 58, 237)
                          const rStart = Math.round(37 + (124 - 37) * sensitivityFactor);
                          const gStart = Math.round(99 + (58 - 99) * sensitivityFactor);
                          const bStart = Math.round(235 + (237 - 235) * sensitivityFactor);

                          // Sky Blue (56, 189, 248) -> Hot Pink (236, 72, 153)
                          const rEnd = Math.round(56 + (236 - 56) * sensitivityFactor);
                          const gEnd = Math.round(189 + (72 - 189) * sensitivityFactor);
                          const bEnd = Math.round(248 + (153 - 248) * sensitivityFactor);

                          backgroundGradient = `linear-gradient(to top, rgb(${rStart}, ${gStart}, ${bStart}), rgb(${rEnd}, ${gEnd}, ${bEnd}))`;
                        } else {
                          // Amber/Yellow (245, 158, 11) -> Neon Red (239, 68, 68)
                          const rStart = Math.round(245 + (239 - 245) * sensitivityFactor);
                          const gStart = Math.round(158 + (68 - 158) * sensitivityFactor);
                          const bStart = Math.round(11 + (68 - 11) * sensitivityFactor);

                          // Neon Magenta (217, 70, 239) -> Bright Pink (244, 63, 94)
                          const rEnd = Math.round(217 + (244 - 217) * sensitivityFactor);
                          const gEnd = Math.round(70 + (63 - 70) * sensitivityFactor);
                          const bEnd = Math.round(239 + (94 - 239) * sensitivityFactor);

                          backgroundGradient = `linear-gradient(to top, rgb(${rStart}, ${gStart}, ${bStart}), rgb(${rEnd}, ${gEnd}, ${bEnd}))`;
                        }
                        
                        return (
                          <motion.div
                            key={i}
                            style={{ 
                              height: `${heightPercent}%`,
                              background: backgroundGradient
                            }}
                            animate={{
                              // Slow baseline wave breathing if there's no volume input
                              scaleY: inputVolume === 0 ? [1, 1.3, 1] : 1
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.2 + (i % 3) * 0.2,
                              ease: "easeInOut"
                            }}
                            className="w-[3px] min-h-[3px] rounded-full transition-all duration-75"
                          />
                        );
                      })}
                    </div>
                    <span className="text-[7.5px] font-mono text-slate-400 italic">
                      {lastHeardWord ? `Ouvido: "${lastHeardWord}"` : 'Diga "fechar", "encerrar" ou "concluir"'}
                    </span>
                  </div>
                ) : (
                  <div className="text-[8.5px] font-mono text-slate-500 flex items-center gap-1.5">
                    <Disc className="w-3 h-3 text-slate-600 animate-spin" />
                    <span>Aurora em espera. Clique em Falar ou no Microfone.</span>
                  </div>
                )}
                {/* Holographic grid lines overlay */}
                <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
              </div>

              {/* Active Step Panel */}
              <div className="bg-[#04080e]/60 border border-slate-900 rounded-xl p-3 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="px-1.5 py-0.5 font-mono text-[8px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/30 rounded uppercase tracking-wider">
                    {VOICE_STEPS[currentStep].badge}
                  </span>
                  <span className="text-[8px] font-mono text-slate-500">
                    Operação {currentStep + 1} de {VOICE_STEPS.length}
                  </span>
                </div>

                <h5 className="font-sans text-xs font-bold text-slate-200">
                  {VOICE_STEPS[currentStep].title}
                </h5>

                <p className="font-sans text-[11px] text-slate-400 leading-normal">
                  {VOICE_STEPS[currentStep].shortDesc}
                </p>

                {/* Subtitles box */}
                <div className="p-2.5 bg-slate-950/65 border border-slate-900/60 rounded-lg max-h-24 overflow-y-auto">
                  <p className="font-sans text-[10px] text-slate-300 leading-normal italic text-left">
                    "{VOICE_STEPS[currentStep].narration}"
                  </p>
                </div>

                {/* Option to complete and close on the final step */}
                {currentStep === VOICE_STEPS.length - 1 && (
                  <motion.button
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => {
                      playClickSfx();
                      handleStop();
                      setIsOpen(false);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/25 hover:from-emerald-500/30 hover:to-cyan-500/35 border border-emerald-500/30 text-emerald-300 rounded-lg text-[9px] font-mono font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.15)] active:scale-95"
                  >
                    <X className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Concluir e Fechar Assistente</span>
                  </motion.button>
                )}
              </div>

              {/* Voice Command Quick Buttons */}
              <div className="bg-[#03060a]/40 border border-slate-900 rounded-xl p-2 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[7.5px] font-mono text-slate-400 uppercase">Comando de Voz</span>
                  <span className="text-[7px] font-mono text-slate-600">Diga "fechar" ou "encerrar"</span>
                </div>
                <button
                  onClick={() => {
                    playClickSfx();
                    triggerCloseModals();
                  }}
                  className="px-2.5 py-1 bg-red-950/40 hover:bg-red-950/60 border border-red-900/30 text-red-400 font-mono text-[8px] uppercase tracking-wider rounded transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  title="Simula o comando de voz 'Fechar' para fechar o Certificado"
                >
                  <X className="w-2.5 h-2.5" />
                  <span>Fechar Certificado</span>
                </button>
              </div>

              {/* Audio & Navigation Controls */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {/* Step navigation */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrev}
                    className="p-1.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-all cursor-pointer hover:text-white"
                    title="Etapa anterior"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="p-1.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-all cursor-pointer hover:text-white"
                    title="Próxima etapa"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Speak controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleStop}
                    disabled={!isSpeaking}
                    className={`p-1.5 rounded-lg border border-red-950/40 text-red-400 transition-all cursor-pointer ${
                      isSpeaking ? 'bg-red-950/20 hover:bg-red-950/40' : 'opacity-40 pointer-events-none'
                    }`}
                    title="Parar reprodução"
                  >
                    <Square className="w-3 h-3" />
                  </button>

                  <button
                    onClick={handleTogglePlay}
                    className="flex items-center gap-1 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:from-emerald-400 hover:to-cyan-400 font-mono text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                  >
                    {isSpeaking && !isPaused ? (
                      <>
                        <Pause className="w-3 h-3" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        <span>Falar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Adjust Voice Rate Speeds */}
              <div className="flex items-center justify-between border-t border-slate-900 pt-2 text-[8px] font-mono text-slate-500">
                <span>Velocidade de Leitura</span>
                <div className="flex bg-slate-950 border border-slate-900 rounded p-0.5 gap-1">
                  <button
                    onClick={() => { playClickSfx(); setVoiceRate(0.8); }}
                    className={`px-1 rounded text-[7.5px] uppercase ${voiceRate === 0.8 ? 'bg-emerald-950 text-emerald-400 font-bold' : 'hover:text-slate-300'}`}
                  >
                    Lenta
                  </button>
                  <button
                    onClick={() => { playClickSfx(); setVoiceRate(0.95); }}
                    className={`px-1 rounded text-[7.5px] uppercase ${voiceRate === 0.95 ? 'bg-emerald-950 text-emerald-400 font-bold' : 'hover:text-slate-300'}`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => { playClickSfx(); setVoiceRate(1.15); }}
                    className={`px-1 rounded text-[7.5px] uppercase ${voiceRate === 1.15 ? 'bg-emerald-950 text-emerald-400 font-bold' : 'hover:text-slate-300'}`}
                  >
                    Rápida
                  </button>
                </div>
              </div>

              {/* Adjust Mic Sensitivity Slider */}
              <div id="aura-mic-sensitivity-control" className="flex flex-col gap-1 border-t border-slate-900 pt-2 text-[8px] font-mono text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Sensibilidade do Som ({micSensitivity}%)</span>
                  <button
                    onClick={() => { playClickSfx(); setMicSensitivity(50); }}
                    className="text-[7px] hover:text-emerald-400 uppercase border border-slate-800/80 rounded px-1 cursor-pointer transition-colors"
                    title="Restaurar sensibilidade para 50% padrão"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[7.5px] text-slate-600">0%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={micSensitivity}
                    onChange={(e) => {
                      setMicSensitivity(parseInt(e.target.value));
                    }}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                  />
                  <span className="text-[7.5px] text-slate-600">100%</span>
                </div>
              </div>

              {/* Adjust Sound Activation Threshold (dB) */}
              <div id="aura-sound-threshold-control" className="flex flex-col gap-1 border-t border-slate-900 pt-2 text-[8px] font-mono text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Limiar de Ativação (Threshold)</span>
                  <span className="text-[7.5px] text-emerald-400 font-bold uppercase">Atual: {isListening ? `${currentDbLevel} dB` : 'Inativo'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[7.5px] text-slate-600">-100 dB</span>
                  <input
                    type="range"
                    min="-100"
                    max="0"
                    step="1"
                    value={soundThresholdDb}
                    onChange={(e) => {
                      setSoundThresholdDb(parseInt(e.target.value));
                    }}
                    className="flex-1 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                  />
                  <span className="text-[7.5px] text-slate-600">0 dB</span>
                </div>
                {/* Numeric input field for exact dB threshold */}
                <div className="flex items-center justify-between mt-1 bg-slate-950/40 border border-slate-900/60 rounded px-2 py-1">
                  <span className="text-[7px] text-slate-400">VALOR EXATO DO LIMIAR:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="-100"
                      max="0"
                      value={soundThresholdDb}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) {
                          setSoundThresholdDb(Math.max(-100, Math.min(0, val)));
                        }
                      }}
                      className="w-12 bg-slate-900 text-slate-200 border border-slate-800 text-center rounded text-[8px] py-0.5 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-slate-500 text-[8px]">dB</span>
                  </div>
                </div>
              </div>

              {/* Soundwave Style Selector */}
              <div id="aura-soundwave-theme-control" className="flex flex-col gap-1 border-t border-slate-900 pt-2 text-[8px] font-mono text-slate-500">
                <span>Estilo da Onda Sonora</span>
                <div className="flex gap-1.5 mt-0.5">
                  {(['Aurora', 'Drex-Blue', 'Cyber-Neon'] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => { playClickSfx(); setSoundwaveTheme(theme); }}
                      className={`px-1.5 py-0.5 rounded text-[7.5px] uppercase border transition-all cursor-pointer ${soundwaveTheme === theme ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30 font-bold' : 'hover:text-slate-300 hover:bg-slate-900/50 border-slate-800/80'}`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              {/* Soundwave Shape Selector */}
              <div id="aura-soundwave-shape-control" className="flex flex-col gap-1 border-t border-slate-900 pt-2 text-[8px] font-mono text-slate-500">
                <span>Forma da Onda Sonora</span>
                <div className="flex gap-1.5 mt-0.5">
                  {(['Linear', 'Sinoidal', 'Quadrada'] as const).map((shape) => (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => { playClickSfx(); setWaveShape(shape); }}
                      className={`px-1.5 py-0.5 rounded text-[7.5px] uppercase border transition-all cursor-pointer ${waveShape === shape ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30 font-bold' : 'hover:text-slate-300 hover:bg-slate-900/50 border-slate-800/80'}`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Target highlight warning */}
              {VOICE_STEPS[currentStep].targetId && (
                <div className="pt-1.5 border-t border-slate-900/60 flex items-center gap-1.5 text-[7.5px] font-mono text-cyan-400/80 uppercase">
                  <Sparkles className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>Realce visual ativo para {VOICE_STEPS[currentStep].title}</span>
                </div>
              )}

              {/* Fallback Text Command Keyboard Section */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: 15 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: 15 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="pt-2 border-t border-slate-900 flex flex-col gap-2 overflow-hidden"
                    id="aura-fallback-keyboard-section"
                  >
                    <div className="flex items-center gap-1.5 text-[8px] font-mono text-emerald-400 uppercase tracking-wider">
                      <Keyboard className="w-3 h-3 text-emerald-400" />
                      <span>Teclado de Fallback & Comandos Rápidos</span>
                    </div>

                    {/* Keyboard Shortcuts Grid */}
                    <div className="grid grid-cols-3 gap-1">
                      {VOICE_STEPS.map((step, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCurrentStep(idx);
                            speakText(step.narration);
                            setLastHeardWord(`"Passo ${idx + 1}"`);
                            setCommandHistory(prev => [`Passo ${idx + 1}`, ...prev].slice(0, 5));
                            playClickSfx();
                          }}
                          className={`py-1 px-1.5 rounded border text-[7px] font-mono uppercase text-center cursor-pointer transition-all ${
                            currentStep === idx
                              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 font-bold shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                              : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                          }`}
                          title={step.title}
                        >
                          P{idx + 1}: {step.title.split(' ')[0]}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          playClickSfx();
                          handleStop();
                          setLastHeardWord('"Parar"');
                          setCommandHistory(prev => ['Parar Voz', ...prev].slice(0, 5));
                        }}
                        className="py-1 px-1.5 rounded border border-red-950 bg-red-950/20 text-red-400 text-[7px] font-mono uppercase text-center cursor-pointer hover:bg-red-950/40"
                      >
                        Parar Voz
                      </button>
                    </div>

                    {/* Histórico de Comandos */}
                    <div className="flex flex-col gap-1 border-t border-slate-900/60 pt-1.5" id="aura-command-history-container">
                      <span className="text-[7.5px] font-mono text-slate-500 uppercase tracking-wider">Últimos Comandos</span>
                      {commandHistory.length === 0 ? (
                        <span className="text-[7px] font-mono text-slate-600 italic">Nenhum comando enviado</span>
                      ) : (
                        <div className="flex flex-col gap-0.5 max-h-24 overflow-y-auto pr-1">
                          {commandHistory.map((cmd, index) => (
                            <div 
                              key={index} 
                              className="flex items-center justify-between text-[7.5px] font-mono bg-slate-950/40 border border-slate-900/30 px-1.5 py-0.5 rounded text-slate-300"
                            >
                              <span className="truncate max-w-[210px]" title={cmd}>{cmd}</span>
                              <span className="text-[6.5px] text-emerald-500/70">#{commandHistory.length - index}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Input form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        executeTextCommand(textCommandInput);
                      }}
                      className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-900/60 rounded-lg p-1"
                    >
                      <input
                        type="text"
                        value={textCommandInput}
                        onChange={(e) => setTextCommandInput(e.target.value)}
                        placeholder="Digite ex: 'Passo 3', 'fechar' ou digite um texto..."
                        className="flex-1 bg-transparent border-none text-[8.5px] font-mono text-slate-200 focus:outline-none focus:ring-0 placeholder-slate-600 px-1.5"
                      />
                      <button
                        type="submit"
                        className="p-1 rounded bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-500/30 text-emerald-400 cursor-pointer transition-colors flex items-center justify-center"
                        title="Enviar comando"
                      >
                        <Send className="w-2.5 h-2.5" />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
