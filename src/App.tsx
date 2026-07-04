import { useState, useEffect, useRef } from 'react';
import { StorageScene, SimulationState, CrystalDataBlock } from './types';
import { SCENES_DATA } from './data/scenesData';
import { getPresetDrexBlocks, encodeTextTo5D } from './utils/encoder';
import { initAudio, toggleMute, getMuteState, playClickSfx, speakText, stopSpeaking } from './utils/audio';
import CanvasRenderer from './components/CanvasRenderer';
import TimelineController from './components/TimelineController';
import DrexConsole from './components/DrexConsole';
import PromptLab from './components/PromptLab';
import EfficiencyChart from './components/EfficiencyChart';
import DopingHeatmap from './components/DopingHeatmap';
import OnboardingTour from './components/OnboardingTour';
import AuraVoiceAssistant from './components/AuraVoiceAssistant';
import ToastNotifications, { Toast } from './components/ToastNotifications';
import HolographicCrystal from './components/HolographicCrystal';
import VoxelLogsPanel from './components/VoxelLogsPanel';
import CertificadoConformidade from './components/CertificadoConformidade';
import LaserWaveGraph from './components/LaserWaveGraph';
import LaserSpectrumGraph from './components/LaserSpectrumGraph';
import { 
  Cpu, 
  Volume2, 
  VolumeX, 
  Eye, 
  Video, 
  Info, 
  Network, 
  Leaf, 
  Globe, 
  Sliders, 
  Atom, 
  ChevronRight,
  Server,
  Palette,
  Zap,
  Activity
} from 'lucide-react';

interface DopingHistoryEntry {
  id: string;
  timestamp: string;
  purity: number;
  erbiumLevel: number;
  lithiumLevel: number;
  stability: number;
}

export default function App() {
  // Selected visual theme: 'dark' (Standard Slate Dark) vs 'cyberpunk' (Aggressive high-contrast neon blue & deep black)
  const [theme, setTheme] = useState<'dark' | 'cyberpunk'>(() => {
    return (localStorage.getItem('drex_theme') as 'dark' | 'cyberpunk') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('drex_theme', theme);
    const root = document.documentElement;
    if (theme === 'cyberpunk') {
      root.classList.add('theme-cyberpunk');
    } else {
      root.classList.remove('theme-cyberpunk');
    }
  }, [theme]);

  // Listen to custom voice assistant event to close any active modals
  useEffect(() => {
    const handleCloseAll = () => {
      setIsAutoCertificateOpen(false);
    };
    window.addEventListener('aura-close-modals', handleCloseAll);
    return () => {
      window.removeEventListener('aura-close-modals', handleCloseAll);
    };
  }, []);

  // Initialize simulation state
  const [simState, setSimState] = useState<SimulationState>({
    currentScene: StorageScene.RAW_SOURCE,
    isPlaying: false,
    playProgress: 0,
    purity: 0,
    erbiumLevel: 0,
    lithiumLevel: 0,
    writingProgress: 0,
    activeDataBlockId: null,
    soundEnabled: false,
    instabilityActive: false,
    instabilitySeverity: 0,
    laserFrequency: 12.5, // Default 12.5 THz
    laserDepth: 150, // Default 150 nm
    laserBurstMode: false // Default Burst Mode off
  });

  // Active data block loaded in 5D encoder
  const [activeBlock, setActiveBlock] = useState<CrystalDataBlock | null>(null);
  
  // Display tab inside visual view (Interactive simulator vs 8K Cinematic Image)
  const [visualMode, setVisualMode] = useState<'simulator' | 'cinematic'>('simulator');

  // Sidebar Tab Selector (DREX Ledger vs Prompt modifier vs Scientific constants vs Sustainability vs Doping Heatmap)
  const [sidebarTab, setSidebarTab] = useState<'drex' | 'prompt' | 'constants' | 'efficiency' | 'doping'>('drex');
  const [showImpactTooltip, setShowImpactTooltip] = useState(false);

  // Toasts Notifications System state and helper
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Simulation blackout state
  const [isBlackout, setIsBlackout] = useState(false);

  // Auto certificate open modal state when phase 5 completes
  const [isAutoCertificateOpen, setIsAutoCertificateOpen] = useState(false);

  // High-fidelity Speech Synthesis Narrator active state
  const [isNarrating, setIsNarrating] = useState(false);

  // Stop narration on unmount to prevent browser voice leak
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Doping and levels adjustment history state
  const [dopingHistory, setDopingHistory] = useState<DopingHistoryEntry[]>([
    {
      id: 'h-init',
      timestamp: new Date().toTimeString().split(' ')[0],
      purity: 0,
      erbiumLevel: 0,
      lithiumLevel: 0,
      stability: 30
    }
  ]);

  interface CriticalEvent {
    id: string;
    timestamp: string;
    message: string;
    type: 'critical' | 'warning' | 'info';
    code: string;
  }

  const [criticalEvents, setCriticalEvents] = useState<CriticalEvent[]>([
    {
      id: 'e-1',
      timestamp: (() => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - 2);
        return d.toTimeString().split(' ')[0];
      })(),
      message: 'Recalibragem de Emergência',
      type: 'critical',
      code: 'SYS-REC-401'
    },
    {
      id: 'e-2',
      timestamp: (() => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - 5);
        return d.toTimeString().split(' ')[0];
      })(),
      message: 'Desconexão de Rede DREX',
      type: 'critical',
      code: 'NET-DIS-503'
    },
    {
      id: 'e-3',
      timestamp: (() => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - 11);
        return d.toTimeString().split(' ')[0];
      })(),
      message: 'Flutuação Térmica do Laser',
      type: 'warning',
      code: 'LAS-TMP-102'
    }
  ]);

  const addCriticalEvent = (message: string, type: 'critical' | 'warning' | 'info', code: string) => {
    const newEvent: CriticalEvent = {
      id: `e-${Date.now()}`,
      timestamp: new Date().toTimeString().split(' ')[0],
      message,
      type,
      code
    };
    setCriticalEvents(prev => [newEvent, ...prev].slice(0, 3));
  };

  // Monitor level adjustments and record them in history (with 1s debounce to avoid spam during dragging)
  useEffect(() => {
    // Skip recording initial 0/0/0 state if it's already there
    if (simState.purity === 0 && simState.erbiumLevel === 0 && simState.lithiumLevel === 0) {
      return;
    }

    const timer = setTimeout(() => {
      const now = new Date();
      const timestamp = now.toTimeString().split(' ')[0]; // HH:MM:SS
      
      // Calculate crystal stability based on pureza and dopantes levels
      // Purity contributes up to 40% (purity 0 to 100)
      const purityWeight = (simState.purity / 100) * 40;
      
      // Erbium contributes up to 30% (erbium 0 to 100)
      const erbiumWeight = (simState.erbiumLevel / 100) * 30;
      
      // Lithium contributes up to 30% (lithium 0 to 100)
      const lithiumWeight = (simState.lithiumLevel / 100) * 30;
      
      let baseStability = 30 + purityWeight + erbiumWeight + lithiumWeight;
      
      if (simState.instabilityActive) {
        baseStability -= simState.instabilitySeverity * 0.6;
      }
      const stability = Math.max(5, Math.min(100, Math.round(baseStability)));

      setDopingHistory(prev => {
        // Prevent registering exact duplicate of the most recent entry
        const lastEntry = prev[0];
        if (lastEntry && 
            lastEntry.purity === simState.purity && 
            lastEntry.erbiumLevel === simState.erbiumLevel && 
            lastEntry.lithiumLevel === simState.lithiumLevel &&
            lastEntry.stability === stability) {
          return prev;
        }

        const newEntry: DopingHistoryEntry = {
          id: `h-${Date.now()}-${Math.random()}`,
          timestamp,
          purity: simState.purity,
          erbiumLevel: simState.erbiumLevel,
          lithiumLevel: simState.lithiumLevel,
          stability
        };

        // Store up to 6 entries for perfect display spacing
        return [newEntry, ...prev.slice(0, 5)];
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [simState.purity, simState.erbiumLevel, simState.lithiumLevel, simState.instabilityActive, simState.instabilitySeverity]);

  const addToast = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // State monitoring refs for triggering Toast Alerts
  const prevSceneRef = useRef<StorageScene>(simState.currentScene);
  const prevInstabilityRef = useRef<boolean>(simState.instabilityActive);
  const prevPlayProgressRef = useRef<number>(simState.playProgress);
  const prevWritingProgressRef = useRef<number>(simState.writingProgress);

  // 1. Scene transition toast trigger
  useEffect(() => {
    if (prevSceneRef.current !== simState.currentScene) {
      let title = "Nova Etapa Ativada";
      let message = "";
      if (simState.currentScene === StorageScene.RAW_SOURCE) {
        message = "Etapa 1: Análise e estabilização de Quartzo Bruto brasileiro.";
      } else if (simState.currentScene === StorageScene.MINING_PURITY) {
        message = "Etapa 2: Purificação química em alta temperatura iniciada.";
      } else if (simState.currentScene === StorageScene.ELEMENT_INJECTION) {
        message = "Etapa 3: Injeção ativa de dopantes de Érbio e Lítio sob vácuo.";
      } else if (simState.currentScene === StorageScene.FIVE_D_ENCODING) {
        message = "Etapa 4: Escrita ultra rápida de voxels nanométricos ativada.";
      } else if (simState.currentScene === StorageScene.FINAL_PRODUCT) {
        message = "Etapa 5: Ciclo de resfriamento controlado e sincronização final.";
      }
      addToast(title, message, "info");
      prevSceneRef.current = simState.currentScene;
    }
  }, [simState.currentScene]);

  // 2. Instability status change toast trigger
  useEffect(() => {
    if (prevInstabilityRef.current !== simState.instabilityActive) {
      if (simState.instabilityActive) {
        addToast(
          "DREX: Status Instável",
          "Flutuação térmica detectada no laser óptico! Rede de transmissão desconectada por segurança.",
          "error"
        );
      } else {
        addToast(
          "DREX: Rede Sincronizada",
          "Calibragem do laser restabelecida com êxito. Ledger financeiro sincronizado com o cristal 5D.",
          "success"
        );
      }
      prevInstabilityRef.current = simState.instabilityActive;
    }
  }, [simState.instabilityActive]);

  // 3. Play progress step completion toast trigger
  useEffect(() => {
    if (simState.playProgress >= 98 && prevPlayProgressRef.current < 98) {
      let stageName = "";
      if (simState.currentScene === StorageScene.RAW_SOURCE) stageName = "Estabilização Térmica";
      else if (simState.currentScene === StorageScene.MINING_PURITY) stageName = "Refino de Pureza Química";
      else if (simState.currentScene === StorageScene.ELEMENT_INJECTION) stageName = "Injeção de Érbio e Lítio";
      else if (simState.currentScene === StorageScene.FIVE_D_ENCODING) stageName = "Escrita de Dados 5D";
      else if (simState.currentScene === StorageScene.FINAL_PRODUCT) stageName = "Sincronização com o DREX Ledger";

      if (stageName) {
        addToast(
          "Etapa Concluída",
          `Fase de ${stageName} finalizada com sucesso operacional 100%.`,
          "success"
        );
      }

      if (simState.currentScene === StorageScene.FINAL_PRODUCT) {
        setIsAutoCertificateOpen(true);
        setSimState(prev => ({ ...prev, isPlaying: false, playProgress: 100 }));
      }
    }
    prevPlayProgressRef.current = simState.playProgress;
  }, [simState.playProgress, simState.currentScene]);

  // 4. Writing progress completion toast trigger
  useEffect(() => {
    if (simState.writingProgress >= 100 && prevWritingProgressRef.current < 100) {
      const activeBlockObj = getPresetDrexBlocks().find(b => b.id === simState.activeDataBlockId);
      const title = activeBlockObj?.title || "Bloco Customizado";
      addToast(
        "Gravação de Bloco Concluída",
        `Bloco '${title}' foi codificado permanentemente na rede de voxels do quartzo.`,
        "success"
      );
    }
    prevWritingProgressRef.current = simState.writingProgress;
  }, [simState.writingProgress, simState.activeDataBlockId]);

  // Trigger default preset block loading on mount
  useEffect(() => {
    const presets = getPresetDrexBlocks();
    if (presets.length > 0) {
      const defaultBlock = presets[0];
      const voxels = encodeTextTo5D(defaultBlock.payload, defaultBlock.type);
      setActiveBlock({
        ...defaultBlock,
        voxels
      });
      setSimState(prev => ({
        ...prev,
        activeDataBlockId: defaultBlock.id
      }));
    }
  }, []);

  // Handle Modo Burst (Burst Mode) random frequency oscillation and increased system instability
  useEffect(() => {
    if (!simState.laserBurstMode) return;

    const interval = setInterval(() => {
      // Pick a random frequency between high (35-50 THz) and low (1-15 THz)
      const isHigh = Math.random() > 0.5;
      const randomFreq = isHigh 
        ? parseFloat((35 + Math.random() * 15).toFixed(1)) 
        : parseFloat((1 + Math.random() * 14).toFixed(1));

      setSimState(prev => {
        let updated: Partial<SimulationState> = { laserFrequency: randomFreq };
        
        // If we are in the 5D encoding scene and playing, Burst Mode actively risks system instability
        if (prev.currentScene === StorageScene.FIVE_D_ENCODING && prev.isPlaying) {
          // 15% chance to automatically trigger active instability or increase severity
          if (!prev.instabilityActive && Math.random() < 0.15) {
            updated.instabilityActive = true;
            updated.instabilitySeverity = 80 + Math.floor(Math.random() * 20); // Higher severity
          } else if (prev.instabilityActive) {
            // Keep severity high
            updated.instabilitySeverity = Math.min(100, prev.instabilitySeverity + 2);
          }
        }
        
        return { ...prev, ...updated };
      });
    }, 300);

    return () => clearInterval(interval);
  }, [simState.laserBurstMode]);

  // Sync state helpers
  const handleUpdateSimState = (updater: Partial<SimulationState>) => {
    setSimState(prev => ({ ...prev, ...updater }));
  };

  const handleWriteBlock = (block: CrystalDataBlock) => {
    setActiveBlock(block);
    setSimState(prev => ({
      ...prev,
      activeDataBlockId: block.id,
      writingProgress: 0 // Reset writing progress when new data block loaded
    }));
  };

  // Toggle Mute
  const handleToggleMute = () => {
    initAudio(); // Assure audio is initialized on interaction
    const isMutedNow = toggleMute();
    setSimState(prev => ({ ...prev, soundEnabled: !isMutedNow }));
  };

  const activeSceneData = SCENES_DATA[simState.currentScene];

  const isLaserActive = simState.currentScene === StorageScene.FIVE_D_ENCODING;
  
  // Color configuration depending on laser frequency (green, cyan, purple)
  let laserGlowColor = '16, 185, 129'; // default emerald-500
  if (simState.laserFrequency >= 15.0 && simState.laserFrequency < 35.0) {
    laserGlowColor = '6, 182, 212'; // cyan-500
  } else if (simState.laserFrequency >= 35.0) {
    laserGlowColor = '168, 85, 247'; // purple-500
  }

  // Animation speed is inversely proportional to frequency: higher frequency = faster animation
  // Let's map frequency 1.0 THz - 50.0 THz to a duration of 3.0s down to 0.08s
  const laserAnimDuration = `${Math.max(0.08, 3.0 - (simState.laserFrequency - 1.0) * (2.92 / 49.0))}s`;

  // Extreme mechanical shake variables
  const isExtremeFrequency = simState.laserFrequency >= 40.0 || simState.laserFrequency <= 5.0 || simState.laserBurstMode;
  let shakeSpeed = '0.15s';
  if (simState.laserBurstMode) {
    shakeSpeed = '0.08s';
  } else if (simState.laserFrequency >= 47.0 || simState.laserFrequency <= 2.0) {
    shakeSpeed = '0.06s';
  } else if (simState.laserFrequency >= 44.0 || simState.laserFrequency <= 3.5) {
    shakeSpeed = '0.1s';
  } else if (simState.laserFrequency >= 40.0 || simState.laserFrequency <= 5.0) {
    shakeSpeed = '0.16s';
  }

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-300 font-sans flex flex-col overflow-hidden select-none antialiased">
      {/* 
        ========================================================================
        HEADER: Corporate Status Bar
        ========================================================================
      */}
      <header className="h-16 bg-[#0a0d14] border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="relative w-10 h-10 rounded overflow-hidden flex items-center justify-center bg-[#070e1b] border border-slate-800/80 shadow-[0_0_15px_rgba(66,133,244,0.25)] shrink-0">
            {/* Quadrant background using Google Colors */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-25">
              <div className="bg-[#4285F4]" />
              <div className="bg-[#EA4335]" />
              <div className="bg-[#34A853]" />
              <div className="bg-[#FBBC05]" />
            </div>
            {/* Vibrant Google Colors subtle corner borders */}
            <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-[#4285F4] rounded-br" />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#EA4335] rounded-bl" />
            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-[#34A853] rounded-tr" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-[#FBBC05] rounded-tl" />
            
            <span className="relative text-xs font-black font-mono text-slate-100 tracking-wider">
              AS
            </span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-widest text-white uppercase">
              Sistema Aurora Soberano | Sistemas Industriais
            </h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">
              Instalação: Sala Limpa Alpha-7 // Infraestrutura Soberana de Nível 1
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:block text-right">
            <p className="text-[10px] uppercase text-slate-500">Status da Rede</p>
            {isBlackout ? (
              <p className="text-xs font-mono text-red-500 animate-pulse font-extrabold shadow-[0_0_8px_rgba(239,68,68,0.2)]">DESCONECTADO</p>
            ) : (
              <p className="text-xs font-mono text-cyan-400">DREX_SINCRONIZADO_ATIVO</p>
            )}
          </div>
          <div className="hidden sm:block h-8 w-px bg-slate-800"></div>
          <div className="hidden md:block text-right">
            <p className="text-[10px] uppercase text-slate-500">Temp. Ambiente</p>
            <p className="text-xs font-mono text-white">18.02°C</p>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          
          <div className="flex items-center gap-2">
            {/* Theme Toggle Selection */}
            <button
              id="theme-toggle-button"
              onClick={() => {
                playClickSfx();
                const newTheme = theme === 'dark' ? 'cyberpunk' : 'dark';
                setTheme(newTheme);
                addToast(
                  newTheme === 'cyberpunk' ? "SISTEMA: Modo Cyberpunk Ativado" : "SISTEMA: Modo Padrão Ativado",
                  newTheme === 'cyberpunk' 
                    ? "Sistemas ópticos e painéis recalibrados para alto contraste com tons de neon azul e preto profundo."
                    : "Sistemas ópticos retornados ao esquema de cores corporativo padrão.",
                  newTheme === 'cyberpunk' ? "warning" : "info"
                );
              }}
              className={`px-2.5 py-1.5 rounded border transition-all flex items-center gap-1.5 cursor-pointer ${
                theme === 'cyberpunk'
                  ? 'bg-black border-cyan-400 text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.45)]'
                  : 'bg-[#0B1528] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={theme === 'cyberpunk' ? 'Mudar para Tema Corporativo Padrão' : 'Mudar para Tema Cyberpunk de Alto Contraste'}
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest">
                {theme === 'cyberpunk' ? 'CYBER' : 'PADRÃO'}
              </span>
            </button>

            {/* Audio Synth Toggle */}
            <button
              onClick={handleToggleMute}
              className={`p-1.5 rounded border transition-all ${
                simState.soundEnabled
                  ? 'bg-cyan-950/20 border-cyan-500 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                  : 'bg-[#0B1528] border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={simState.soundEnabled ? 'Mutar Sintetizador do Laboratório' : 'Ativar Áudio de Ambiente do Laboratório'}
            >
              {simState.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* 
        ========================================================================
        MAIN BODY: Triple Column Layout (Pipeline | Viewport | Diagnostics)
        ========================================================================
      */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        
        {/* SIDEBAR LEFT: Process Pipeline */}
        <aside className="w-full lg:w-72 bg-[#080a0f] border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col p-5 shrink-0 overflow-y-auto">
          <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-5">
            Fluxo do Processo
          </h2>
          
          <div className="space-y-4">
            {Object.values(StorageScene).map((sceneId, idx) => {
              const sceneData = SCENES_DATA[sceneId];
              const isCurrent = simState.currentScene === sceneId;
              const isPast = idx < Object.values(StorageScene).indexOf(simState.currentScene);
              
              let stepLabel = "Entrada Bruta";
              let stepDesc = "Quartzo Bruto Brasileiro";
              
              if (sceneId === StorageScene.RAW_SOURCE) {
                stepLabel = "01: Entrada Bruta";
                stepDesc = "Quartzo Bruto Brasileiro";
              } else if (sceneId === StorageScene.MINING_PURITY) {
                stepLabel = "02: Refino de Pureza";
                stepDesc = "Disco de Ultra Alta Clareza";
              } else if (sceneId === StorageScene.ELEMENT_INJECTION) {
                stepLabel = "03: Injeção de Elementos";
                stepDesc = "Fusão de Er + LiNbO3";
              } else if (sceneId === StorageScene.FIVE_D_ENCODING) {
                stepLabel = "04: Gravação em 5D";
                stepDesc = "Laser de Femtossegundo Ativo";
              } else if (sceneId === StorageScene.FINAL_PRODUCT) {
                stepLabel = "05: Sincronização de Armazenamento";
                stepDesc = "Arquivamento de Nó DREX";
              }

              return (
                <button
                  key={sceneId}
                  onClick={() => {
                    playClickSfx();
                    setSimState(prev => ({
                      ...prev,
                      currentScene: sceneId,
                      playProgress: 0,
                      writingProgress: 0,
                      isPlaying: false
                    }));
                  }}
                  className={`flex gap-4 items-start text-left w-full transition-all group py-1 ${
                    isCurrent ? 'opacity-100' : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    isCurrent 
                      ? 'border-cyan-500 border-2 shadow-[0_0_8px_rgba(6,182,212,0.5)]' 
                      : 'border-slate-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full transition-all ${
                      isCurrent 
                        ? 'bg-cyan-400 animate-pulse' 
                        : isPast 
                        ? 'bg-cyan-600' 
                        : 'bg-slate-700'
                    }`} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase transition-colors ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
                      {stepLabel}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono tracking-wide leading-tight">
                      {stepDesc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 lg:mt-auto p-4 bg-cyan-950/20 border border-cyan-900/50 rounded">
            <p className="text-[10px] text-cyan-300 uppercase mb-2 font-mono tracking-wider">
              Status do Projeto
            </p>
            <p className="text-[11px] text-cyan-100/90 leading-relaxed">
              Avançando na soberania tecnológica através de infraestrutura sustentável de silício.
            </p>
          </div>
        </aside>

        {/* MAIN: The Viewport Area */}
        <main className="flex-1 relative overflow-hidden bg-black flex flex-col">
          
          {/* HUD Overlays (Absolute Corner Angles and Radial Laser glow) */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="absolute top-8 left-8 border-l border-t border-cyan-500/30 w-12 h-12"></div>
            <div className="absolute top-8 right-8 border-r border-t border-cyan-500/30 w-12 h-12"></div>
            <div className="absolute bottom-8 left-8 border-l border-b border-cyan-500/30 w-12 h-12"></div>
            <div className="absolute bottom-8 right-8 border-r border-b border-cyan-500/30 w-12 h-12"></div>
            
            <div className="absolute inset-0 flex items-center justify-center opacity-70">
              {/* Simulated Crystal Grid Overlay */}
              <div className="w-[360px] h-[360px] md:w-[480px] md:h-[480px] border border-cyan-500/5 rounded-full flex items-center justify-center">
                <div className="w-[260px] h-[260px] md:w-[360px] md:h-[360px] border border-cyan-500/10 rounded-full flex items-center justify-center">
                  <div className="w-[160px] h-[160px] md:w-[240px] md:h-[240px] border border-cyan-500/15 rounded-full flex items-center justify-center"></div>
                </div>
              </div>
            </div>

            {/* Dynamic floating coords inside box */}
            <div className="absolute top-4 left-4 font-mono text-[8px] text-cyan-500/80">
              COORD: X{(0.05 + simState.playProgress * 0.12).toFixed(2)} Y{(0.10 + simState.playProgress * 0.08).toFixed(2)} Z{(-0.12 + simState.playProgress * 0.04).toFixed(2)}
            </div>
            <div className="absolute bottom-4 right-4 font-mono text-[8px] text-cyan-500/80">
              INTENSIDADE: {simState.currentScene === StorageScene.FIVE_D_ENCODING ? `${(60 + simState.writingProgress * 0.3).toFixed(1)} GW/cm²` : "OFFLINE"}
            </div>
          </div>

          {/* Actual Feed Simulation / Visual Content Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 z-10 overflow-y-auto relative">
            <div id="crystal-simulator-container" className="relative w-full h-full max-w-[960px] aspect-video bg-[#03060c] rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
              
              {/* Laser Interaction Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.12),transparent_75%)] pointer-events-none" />

              {/* Phase Viewport Top Header */}
              <div className="px-4 py-2.5 bg-[#0a0d14]/90 border-b border-slate-800 flex items-center justify-between gap-4 z-30">
                <div className="flex items-center gap-2">
                  <Video className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-mono text-[10px] font-bold text-slate-200 uppercase tracking-wider">
                    Visualização: Cena {activeSceneData.number} ({activeSceneData.title})
                  </span>
                </div>

                {/* Viewport Toggle controls */}
                <div className="flex items-center bg-[#05070a] rounded p-0.5 border border-slate-800">
                  <button
                    onClick={() => { playClickSfx(); setVisualMode('simulator'); }}
                    className={`px-2 py-0.5 font-mono text-[8px] font-bold uppercase rounded transition-all flex items-center gap-1 ${
                      visualMode === 'simulator'
                        ? 'bg-cyan-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Cpu className="w-2.5 h-2.5" />
                    Simulador 3D
                  </button>
                  <button
                    onClick={() => { playClickSfx(); setVisualMode('cinematic'); }}
                    className={`px-2 py-0.5 font-mono text-[8px] font-bold uppercase rounded transition-all flex items-center gap-1 ${
                      visualMode === 'cinematic'
                        ? 'bg-cyan-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye className="w-2.5 h-2.5" />
                    Cinema 8K
                  </button>
                </div>
              </div>

              {/* Viewport rendering frame */}
              <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                {visualMode === 'simulator' ? (
                  <CanvasRenderer
                    state={simState}
                    voxels={activeBlock ? activeBlock.voxels : []}
                  />
                ) : (
                  <div className="relative w-full h-full group overflow-hidden">
                    <img
                      src={activeSceneData.imagePath}
                      alt={activeSceneData.title}
                      className="w-full h-full object-cover transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    {/* Subtle cinema gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                    
                    {/* Screenplay details floating on bottom left */}
                    <div className="absolute bottom-4 left-4 right-4 bg-[#0a0d14]/90 border border-slate-800 p-3 rounded backdrop-blur-md z-30">
                      <span className="font-mono text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-500/20 px-1 py-0.5 rounded uppercase font-semibold">
                        PROMPT DO DIRETOR DO DOCUMENTÁRIO
                      </span>
                      <p className="font-sans text-[10px] text-slate-300 leading-relaxed mt-1.5 italic font-light">
                        "{activeSceneData.promptText}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Subtitles & Timeline panel */}
            <div className="w-full max-w-[960px] mt-4 z-30">
              <TimelineController
                state={simState}
                onChangeState={handleUpdateSimState}
              />
            </div>

            {/* Voxel Logs and Audit Panel */}
            <div className="w-full max-w-[960px] z-30">
              <VoxelLogsPanel
                state={simState}
                activeBlock={activeBlock}
              />
            </div>
          </div>

          {/* Control Readout Bar */}
          <div className="h-20 bg-[#0a0d14]/80 backdrop-blur-md border-t border-slate-800 flex items-center justify-between px-6 sm:px-8 gap-4 sm:gap-12 shrink-0 z-30">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase text-slate-500 font-mono">Estabilidade de Gravação</span>
              <div className="flex gap-1 mt-1">
                <div className="w-1 h-3 bg-cyan-500"></div>
                <div className="w-1 h-3 bg-cyan-500"></div>
                <div className="w-1 h-3 bg-cyan-500"></div>
                <div className="w-1 h-3 bg-cyan-500"></div>
                <div className="w-1 h-3 bg-cyan-500"></div>
                <div className={`w-1 h-3 ${simState.isPlaying ? 'bg-cyan-500' : 'bg-cyan-700'}`}></div>
                <div className={`w-1 h-3 ${simState.isPlaying ? 'bg-cyan-500 animate-pulse' : 'bg-cyan-900'}`}></div>
              </div>
            </div>
            
            <div className="hidden sm:flex flex-col">
              <span className="text-[9px] uppercase text-slate-500 font-mono">Composição do Cristal</span>
              <span className="text-xs font-mono text-white">SiO2-Er-LiNbO3-COMP</span>
            </div>

            <div className="hidden md:flex flex-col">
              <span className="text-[9px] uppercase text-slate-500 font-mono">Fluxo de Dados</span>
              <span className="text-xs font-mono text-cyan-400">DREX_NET_GEN_0024</span>
            </div>

            <div className="flex gap-2 font-mono">
              <button
                onClick={() => {
                  playClickSfx();
                  handleUpdateSimState({ isPlaying: !simState.isPlaying });
                }}
                className={`px-4 py-1.5 border text-[10px] uppercase tracking-widest transition-colors rounded ${
                  simState.isPlaying
                    ? 'bg-amber-950/20 border-amber-500/50 text-amber-400'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {simState.isPlaying ? "PAUSAR FILME" : "REPRODUZIR"}
              </button>
              <button
                onClick={() => {
                  playClickSfx();
                  handleUpdateSimState({ isPlaying: false, playProgress: 0, writingProgress: 0 });
                }}
                className="px-4 py-1.5 bg-red-950/20 border border-red-500/50 text-red-500 text-[10px] uppercase tracking-widest rounded hover:bg-red-950/40"
              >
                PARAR SISTEMA
              </button>
            </div>
          </div>
        </main>

        {/* SIDEBAR RIGHT: Disc Diagnostics & Workspace Controls */}
        <aside id="sidebar-diagnostics" className="w-full lg:w-80 bg-[#080a0f] border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col p-5 shrink-0 overflow-y-auto">
          <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">
            Diagnósticos do Disco
          </h2>

          {/* Dynamic Laser Tech Instability Warning / Trigger */}
          {simState.instabilityActive ? (
            <div className="mb-5 p-3.5 bg-red-950/40 border border-red-500/50 rounded-xl flex flex-col gap-2 shadow-[0_0_15px_rgba(239,68,68,0.25)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500 animate-pulse" />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                <p className="text-[10px] text-red-400 font-bold font-mono uppercase tracking-wider">
                  ⚠️ INSTABILIDADE DO LASER
                </p>
              </div>
              <p className="text-[10px] text-red-200/90 leading-normal font-sans">
                O feixe de femtossegundo atingiu flutuações críticas de energia ({simState.instabilitySeverity}% de desvio). O processo foi interrompido.
              </p>
              <button
                onClick={() => {
                  playClickSfx();
                  handleUpdateSimState({
                    instabilityActive: false,
                    instabilitySeverity: 0
                  });
                  addCriticalEvent('Recalibragem de Emergência', 'info', 'SYS-REC-401');
                }}
                className="w-full py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold font-mono text-[9px] uppercase tracking-widest rounded-lg transition-all shadow-[0_0_10px_rgba(239,68,68,0.4)] active:scale-95"
              >
                Recalibragem de Emergência
              </button>
            </div>
          ) : (
            <div className="mb-5">
              <button
                onClick={() => {
                  playClickSfx();
                  const severity = 50 + Math.floor(Math.random() * 40);
                  handleUpdateSimState({
                    instabilityActive: true,
                    instabilitySeverity: severity
                  });
                  addCriticalEvent('Anomalia Térmica de Laser', 'critical', 'LAS-TMP-102');
                }}
                className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 font-mono text-[8px] uppercase tracking-widest rounded transition-all flex items-center justify-center gap-1.5"
                title="Provoca uma instabilidade aleatória no laser de gravação"
              >
                <span>Instabilidade Aleatória (Acidente)</span>
              </button>
            </div>
          )}
          
          {/* Dynamic Quartz Purity Meter */}
          <div className="mb-5">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Pureza do Quartzo</span>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {simState.currentScene === StorageScene.RAW_SOURCE ? "99.8000%" : `${Math.max(99.8, 99.8 + (simState.purity * 0.001999)).toFixed(4)}%`}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,1)] transition-all duration-300"
                style={{ width: simState.currentScene === StorageScene.RAW_SOURCE ? '20%' : `${Math.max(20, simState.purity)}%` }}
              />
            </div>
          </div>

          {/* Doping levels cards */}
          <div className="mb-5 space-y-2">
            <div className="p-2.5 bg-white/5 border border-white/10 rounded">
              <p className="text-[9px] text-slate-500 uppercase font-mono">Nível de Dopagem: Érbio</p>
              <p className="text-xs font-mono text-cyan-100 mt-0.5">
                {simState.erbiumLevel >= 100 ? "0,42 mol% (IDEAL)" : `${(simState.erbiumLevel * 0.0042).toFixed(4)} mol%`}
              </p>
            </div>
            <div className="p-2.5 bg-white/5 border border-white/10 rounded">
              <p className="text-[9px] text-slate-500 uppercase font-mono">Nível de Dopagem: Niobato de Lítio</p>
              <p className="text-xs font-mono text-cyan-100 mt-0.5">
                {simState.lithiumLevel >= 100 ? "1,15 mol% (IDEAL)" : `${(simState.lithiumLevel * 0.0115).toFixed(4)} mol%`}
              </p>
            </div>
          </div>

          {/* Controle Fino do Laser de Femtossegundo */}
          <div
            id="aura-laser-fine-control"
            className={`mb-5 border bg-[#04060c]/60 rounded-xl p-3.5 shadow-md relative overflow-hidden transition-all duration-300 ${
              isLaserActive ? 'laser-active-anim border-transparent' : 'border-slate-800'
            } ${isExtremeFrequency ? 'mechanical-shake-anim' : ''}`}
            style={{
              ['--laser-color' as any]: laserGlowColor,
              ['--laser-speed' as any]: laserAnimDuration,
              ['--shake-intensity' as any]: shakeSpeed
            }}
          >
            {/* Holographic header design with a mini laser icon or Zap icon */}
            <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <Zap className={`w-3.5 h-3.5 ${simState.currentScene === StorageScene.FIVE_D_ENCODING ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <span className="text-[10px] uppercase text-slate-300 font-mono font-bold tracking-wider">
                  Laser de Femtossegundo
                </span>
              </div>
              <div className="flex items-center gap-1">
                {simState.currentScene === StorageScene.FIVE_D_ENCODING ? (
                  <span className="flex items-center gap-1 text-[7.5px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                    OPERANDO
                  </span>
                ) : (
                  <span className="text-[7.5px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    STANDBY
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {/* Pulse Frequency Slider */}
              <div className="flex flex-col gap-1 text-[8px] font-mono text-slate-500">
                <div className="flex justify-between items-center">
                  <span className="uppercase tracking-wider">Frequência de Pulso</span>
                  <span className="text-xs text-cyan-400 font-bold">{simState.laserFrequency.toFixed(1)} THz</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[7.5px] text-slate-600">1.0</span>
                  <input
                    type="range"
                    min="1.0"
                    max="50.0"
                    step="0.5"
                    value={simState.laserFrequency}
                    onChange={(e) => {
                      playClickSfx();
                      handleUpdateSimState({ laserFrequency: parseFloat(e.target.value) });
                    }}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none"
                    title="Ajustar Frequência de Pulso em THz"
                  />
                  <span className="text-[7.5px] text-slate-600">50.0</span>
                </div>
              </div>

              {/* Writing Depth Slider */}
              <div className="flex flex-col gap-1 text-[8px] font-mono text-slate-500">
                <div className="flex justify-between items-center">
                  <span className="uppercase tracking-wider">Profundidade de Escrita</span>
                  <span className="text-xs text-amber-400 font-bold">{simState.laserDepth} nm</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[7.5px] text-slate-600">100</span>
                  <input
                    type="range"
                    min="100"
                    max="800"
                    step="10"
                    value={simState.laserDepth}
                    onChange={(e) => {
                      playClickSfx();
                      handleUpdateSimState({ laserDepth: parseInt(e.target.value) });
                    }}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                    title="Ajustar Profundidade de Escrita em Nanômetros"
                  />
                  <span className="text-[7.5px] text-slate-600">800</span>
                </div>
              </div>

              {/* Dynamic Laser Frequency Oscillation Graph */}
              <LaserWaveGraph 
                frequency={simState.laserFrequency} 
                depth={simState.laserDepth} 
                isActive={isLaserActive} 
              />

              {/* Dynamic Laser Frequency Spectrum Graph */}
              <LaserSpectrumGraph 
                frequency={simState.laserFrequency} 
                isActive={isLaserActive}
                burstMode={simState.laserBurstMode}
              />

              {/* Modo Burst Toggle Switch */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/40 font-mono text-[8px] text-slate-500">
                <div className="flex flex-col gap-0.5">
                  <span className="uppercase tracking-wider font-bold text-slate-300 flex items-center gap-1">
                    <span className={`w-1 h-1 rounded-full ${simState.laserBurstMode ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
                    Modo Burst
                  </span>
                  <span className="text-[6.5px] text-slate-500 lowercase leading-tight">Gravação 2x rápida // risco de instabilidade</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClickSfx();
                    const newBurstMode = !simState.laserBurstMode;
                    handleUpdateSimState({ laserBurstMode: newBurstMode });
                    if (newBurstMode) {
                      addToast("Modo Burst Ativado", "Laser operando em oscilação rápida. Velocidade de gravação duplicada (2x) sob risco crítico de instabilidade do laser.", "warning");
                      addCriticalEvent('Modo Burst Iniciado', 'warning', 'LAS-BST-900');
                    } else {
                      addToast("Modo Burst Desativado", "Laser retornado ao modo de emissão contínua padrão.", "info");
                    }
                  }}
                  className={`relative w-9 h-5 rounded-full transition-all duration-300 cursor-pointer focus:outline-none flex items-center ${
                    simState.laserBurstMode ? 'bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-slate-950 border border-slate-800'
                  }`}
                  title="Ativar/Desativar Modo Burst de Alta Velocidade"
                >
                  <span
                    className={`absolute w-3.5 h-3.5 rounded-full bg-white transition-all duration-300 shadow-sm ${
                      simState.laserBurstMode ? 'left-[18px]' : 'left-0.5'
                    } flex items-center justify-center`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${simState.laserBurstMode ? 'bg-red-500' : 'bg-slate-400'}`} />
                  </span>
                </button>
              </div>

              {/* Laser Presets Selector for technical fine control */}
              <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800/40 text-[7px] font-mono text-slate-500">
                <span className="uppercase tracking-wider">Modos de Calibragem Rápida</span>
                <div className="flex gap-1.5 mt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSfx();
                      handleUpdateSimState({ laserFrequency: 12.5, laserDepth: 150 });
                      addToast("Laser Calibrado", "Modo padrão de ultra-durabilidade configurado (12.5 THz // 150 nm).", "info");
                    }}
                    className={`flex-1 py-0.5 rounded text-[6.5px] uppercase border transition-all cursor-pointer text-center ${
                      simState.laserFrequency === 12.5 && simState.laserDepth === 150
                        ? 'bg-cyan-950 text-cyan-400 border-cyan-500/30 font-bold'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-300 hover:bg-slate-900/50'
                    }`}
                  >
                    Padrão (12.5)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSfx();
                      handleUpdateSimState({ laserFrequency: 40.0, laserDepth: 550 });
                      addToast("Laser Calibrado", "Modo de gravação de alta densidade configurado (40.0 THz // 550 nm).", "info");
                    }}
                    className={`flex-1 py-0.5 rounded text-[6.5px] uppercase border transition-all cursor-pointer text-center ${
                      simState.laserFrequency === 40.0 && simState.laserDepth === 550
                        ? 'bg-amber-950 text-amber-400 border-amber-500/30 font-bold'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-300 hover:bg-slate-900/50'
                    }`}
                  >
                    Dens. (40)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSfx();
                      handleUpdateSimState({ laserFrequency: 5.0, laserDepth: 800 });
                      addToast("Laser Calibrado", "Modo de gravação profunda configurado (5.0 THz // 800 nm).", "info");
                    }}
                    className={`flex-1 py-0.5 rounded text-[6.5px] uppercase border transition-all cursor-pointer text-center ${
                      simState.laserFrequency === 5.0 && simState.laserDepth === 800
                        ? 'bg-purple-950 text-purple-400 border-purple-500/30 font-bold'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-300 hover:bg-slate-900/50'
                    }`}
                  >
                    Prof. (5.0)
                  </button>
                </div>
              </div>

              {/* Voice Synthesizer Explainer Narrator */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/40">
                <div className="flex items-center justify-between text-[7px] font-mono text-slate-500">
                  <span className="uppercase tracking-wider">Sintetizador Narrador</span>
                  <span className="text-[6.5px] uppercase text-emerald-400 font-bold tracking-tight">Voz Ativa de I.A.</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSfx();
                      if (isNarrating) {
                        stopSpeaking();
                        setIsNarrating(false);
                        addToast("Narração Interrompida", "O assistente de voz do laboratório foi silenciado.", "info");
                      } else {
                        setIsNarrating(true);
                        addToast("Narrador Iniciado", "Sintetizador de voz explicando o ciclo completo de gravação 5D.", "success");
                        const fullExplanationText = 
                          "Iniciando explicação técnica do ciclo de gravação óptica em cinco dimensões. " +
                          "Fase um: Utilizamos quartzo bruto brasileiro de pureza molecular, estabilizado termicamente para remover impurezas mecânicas primárias. " +
                          "Fase dois: O cristal passa por um refino de fusão a mais de mil e setecentos graus Celsius, eliminando hidroxilas e eliminando qualquer microbolha. " +
                          "Fase três: Ocorre a injeção ativa de dopantes, inserindo nanopartículas de Érbio e Lítio sob vácuo extremo para formar os centros luminescentes e ativos de gravação. " +
                          "Fase quatro: O laser de femtossegundo realiza a gravação ultra rápida de voxels nanométricos. Cada bit é codificado em cinco dimensões: as coordenadas espaciais x, y, z, somadas à orientação de birrefringência e ao atraso óptico induzidos pelo estresse térmico localizado. " +
                          "E por fim, fase cinco: O quartzo é resfriado e integrado ao Ledger do Real Digital, o DREX, validando os dados gravados de forma inviolável por bilhões de anos.";
                        
                        speakText(
                          fullExplanationText,
                          () => setIsNarrating(true),
                          () => setIsNarrating(false)
                        );
                      }
                    }}
                    className={`flex-1 py-1.5 rounded text-[8px] uppercase border transition-all cursor-pointer flex items-center justify-center gap-1.5 font-mono ${
                      isNarrating
                        ? 'bg-red-950/40 border-red-500/50 text-red-400 hover:bg-red-900/40 shadow-[0_0_8px_rgba(239,68,68,0.25)]'
                        : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-500/40'
                    }`}
                    title={isNarrating ? "Parar explicação de voz" : "Ouvir explicação detalhada do processo de gravação"}
                  >
                    {isNarrating ? (
                      <>
                        <span className="flex gap-0.5 items-center">
                          <span className="w-[1.5px] h-3 bg-red-400 animate-[pulse_0.4s_infinite]" />
                          <span className="w-[1.5px] h-1.5 bg-red-400 animate-[pulse_0.5s_infinite]" />
                          <span className="w-[1.5px] h-2 bg-red-400 animate-[pulse_0.3s_infinite]" />
                        </span>
                        <span>Parar Narração</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3 animate-pulse" />
                        <span>Falar Processo (Voz)</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-[6.5px] font-mono text-slate-500 lowercase leading-tight">
                  Explicação cinemática falada sobre as 5 etapas da mídia e sincronização DREX.
                </div>
              </div>
            </div>
            
            {/* Warning when not in 5D recording scene */}
            {simState.currentScene !== StorageScene.FIVE_D_ENCODING && (
              <div className="mt-2 text-[7.5px] text-slate-500 leading-normal font-sans border-t border-slate-800/40 pt-1.5 flex items-center gap-1">
                <Info className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                <span>Os parâmetros de escrita do laser serão aplicados ao iniciar a Etapa 04.</span>
              </div>
            )}
          </div>

          {/* Empresa e Arquiteto do Projeto (Impulso Digital Soluções em I.A. por Felipe Marcos de Abreu Aquino) */}
          <div className="mb-5 border border-slate-800 bg-[#04060c]/60 rounded-xl p-3 shadow-md relative overflow-hidden">
            {/* Top color bar using Google Colors */}
            <div className="absolute top-0 left-0 w-full h-[3px] flex">
              <div className="flex-1 bg-[#4285F4]" />
              <div className="flex-1 bg-[#EA4335]" />
              <div className="flex-1 bg-[#FBBC05]" />
              <div className="flex-1 bg-[#34A853]" />
            </div>
            
            <div className="space-y-2 mt-1">
              <div className="flex items-center gap-1.5 justify-between">
                <span className="text-[8px] uppercase tracking-widest text-slate-400 font-mono">Desenvolvimento de I.A.</span>
                {/* Micro Google Dot Accents */}
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC05]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]" />
                </div>
              </div>
              
              <div>
                <h3 className="text-[10px] font-bold text-white font-mono tracking-wide leading-tight uppercase">
                  <span className="text-[#4285F4]">Impulso</span>{" "}
                  <span className="text-[#EA4335]">Digital</span>{" "}
                  <span className="text-[#FBBC05]">Soluções</span>{" "}
                  <span className="text-[#34A853]">em I.A.</span>
                </h3>
                <div className="mt-1 flex flex-col gap-0.5 border-t border-slate-800/60 pt-1.5">
                  <span className="text-[7px] text-slate-500 uppercase font-mono">Arquiteto do Projeto</span>
                  <span className="text-[9.5px] font-sans font-semibold text-slate-200 tracking-wide">
                    Felipe Marcos de Abreu Aquino
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Histórico Lateral de Ajustes de Dopagem */}
          <div className="mb-5 border border-slate-800/80 bg-[#04060c]/70 rounded-xl p-3 shadow-md relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800/60">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] uppercase text-amber-500 font-mono font-bold tracking-wider">
                  Histórico de Ajustes
                </span>
              </div>
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">
                Estabilidade
              </span>
            </div>
            
            <div className="space-y-1.5 max-h-[125px] overflow-y-auto pr-1 scrollbar-thin">
              {dopingHistory.map((entry) => (
                <div 
                  key={entry.id} 
                  className="flex items-center justify-between border-b border-slate-900/40 pb-1.5 last:border-0 last:pb-0 text-[9px] font-mono"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 text-[8px] flex items-center gap-1">
                      <span>⏱️ {entry.timestamp}</span>
                    </span>
                    <span className="text-slate-300">
                      P: <span className="text-cyan-400 font-bold">{entry.purity}%</span> | 
                      Er: <span className="text-emerald-400">{(entry.erbiumLevel * 0.0042).toFixed(2)}%</span> | 
                      Li: <span className="text-purple-400">{(entry.lithiumLevel * 0.0115).toFixed(2)}%</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`font-bold text-[10px] ${
                        entry.stability >= 85 
                          ? 'text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.1)]' 
                          : entry.stability >= 60 
                          ? 'text-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.1)]' 
                          : 'text-red-400 shadow-[0_0_8px_rgba(248,113,113,0.1)]'
                      }`}>
                        {entry.stability}%
                      </span>
                      <span className="text-[6.5px] uppercase text-slate-500 tracking-wider">
                        {entry.stability >= 85 ? 'ÓTIMA' : entry.stability >= 60 ? 'ALERTA' : 'CRÍTICA'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-2 text-[7.5px] text-slate-500 leading-normal font-sans border-t border-slate-800/40 pt-1.5">
              💡 Combinação ideal de 100% exige pureza máxima e níveis ideais de dopagem (Érbio e Niobato).
            </div>
          </div>

          {/* Registro Minimalista de Eventos Críticos */}
          <div className="mb-5 border border-red-950/40 bg-[#090505]/40 rounded-xl p-3 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-red-950/20">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] uppercase text-red-400 font-mono font-bold tracking-wider">
                  Ações Críticas do Sistema
                </span>
              </div>
              <span className="text-[8px] font-mono text-red-500/70 uppercase tracking-wider">
                Monitor de Atividade
              </span>
            </div>
            
            <div className="space-y-1.5">
              {criticalEvents.map((event) => (
                <div 
                  key={event.id}
                  className="flex items-start justify-between pb-1.5 last:border-0 last:pb-0 text-[9px] font-mono border-b border-red-950/10"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-300 font-medium">
                      {event.message}
                    </span>
                    <span className="text-[7.5px] text-slate-500 flex items-center gap-1">
                      <span>⏱️ {event.timestamp}</span>
                      <span>•</span>
                      <span className="text-red-400/80 font-semibold">{event.code}</span>
                    </span>
                  </div>
                  <span className={`text-[7.5px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider leading-none shrink-0 ${
                    event.type === 'critical'
                      ? 'bg-red-950/60 text-red-400 border border-red-800/20'
                      : event.type === 'warning'
                      ? 'bg-amber-950/60 text-amber-400 border border-amber-800/20'
                      : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/20'
                  }`}>
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Holographic 3D Crystal Overlayer Section */}
          <HolographicCrystal
            instabilityActive={simState.instabilityActive}
            purity={simState.purity}
            currentScene={simState.currentScene}
            onResolveInstability={() => {
              setSimState(prev => ({
                ...prev,
                instabilityActive: false,
                instabilitySeverity: 0
              }));
              addCriticalEvent('Recalibragem de Emergência', 'info', 'SYS-REC-401');
            }}
            onAddToast={addToast}
          />

          <div className="h-px bg-slate-800 my-4" />

          {/* Workspace Tab bar */}
          <div className="flex bg-[#05070a] border border-slate-800 p-0.5 rounded mb-4 shrink-0 overflow-x-auto">
            <button
              onClick={() => { playClickSfx(); setSidebarTab('drex'); }}
              className={`flex-1 min-w-[50px] py-1.5 font-mono text-[9px] font-bold text-center uppercase tracking-wider rounded transition-all ${
                sidebarTab === 'drex'
                  ? 'bg-[#0a0d14] text-cyan-400 border border-slate-800'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Ledger
            </button>
            <button
              onClick={() => { playClickSfx(); setSidebarTab('prompt'); }}
              className={`flex-1 min-w-[50px] py-1.5 font-mono text-[9px] font-bold text-center uppercase tracking-wider rounded transition-all ${
                sidebarTab === 'prompt'
                  ? 'bg-[#0a0d14] text-cyan-400 border border-slate-800'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Prompt
            </button>
            <button
              onClick={() => { playClickSfx(); setSidebarTab('constants'); }}
              className={`flex-1 min-w-[50px] py-1.5 font-mono text-[9px] font-bold text-center uppercase tracking-wider rounded transition-all ${
                sidebarTab === 'constants'
                  ? 'bg-[#0a0d14] text-cyan-400 border border-slate-800'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Ciência
            </button>
            <button
              id="tab-doping-button"
              onClick={() => { playClickSfx(); setSidebarTab('doping'); }}
              className={`flex-1 min-w-[50px] py-1.5 font-mono text-[9px] font-bold text-center uppercase tracking-wider rounded transition-all ${
                sidebarTab === 'doping'
                  ? 'bg-[#0a0d14] text-amber-400 border border-slate-800'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Dopagem
            </button>
             <button
              id="tab-impact-button"
              onClick={() => { playClickSfx(); setSidebarTab('efficiency'); }}
              onMouseEnter={() => setShowImpactTooltip(true)}
              onMouseLeave={() => setShowImpactTooltip(false)}
              className={`relative flex-1 min-w-[50px] py-1.5 font-mono text-[9px] font-bold text-center uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1 ${
                sidebarTab === 'efficiency'
                  ? 'bg-[#0a0d14] text-emerald-400 border border-slate-800 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Activity className={`w-3 h-3 ${showImpactTooltip ? 'animate-pulse text-emerald-400' : ''}`} />
              <span>Impacto</span>
              {showImpactTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-2.5 bg-[#09101F]/95 border border-emerald-500/30 rounded shadow-[0_0_12px_rgba(16,185,129,0.15)] text-left z-50 pointer-events-none backdrop-blur-md">
                  <p className="font-mono text-[9px] text-emerald-400 font-bold mb-1 uppercase tracking-wider">
                    Gráfico de Impacto
                  </p>
                  <p className="normal-case font-sans text-[10px] text-slate-300 leading-normal font-normal">
                    Mostra a estabilidade do cristal em tempo real conforme a pureza e os dopantes mudam.
                  </p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#09101F]" />
                </div>
              )}
            </button>
          </div>

          {/* Interactive controls panels */}
          <div id="drex-ledger-panel" className="flex-1 min-h-0 flex flex-col">
            {sidebarTab === 'drex' && (
              <DrexConsole
                onWriteBlock={handleWriteBlock}
                activeBlockId={simState.activeDataBlockId}
                isWriting={simState.isPlaying || (simState.writingProgress > 0 && simState.writingProgress < 100)}
                state={simState}
              />
            )}

            {sidebarTab === 'prompt' && (
              <PromptLab
                currentScene={simState.currentScene}
              />
            )}

            {sidebarTab === 'constants' && (
              <div className="bg-[#0a0d14]/60 border border-slate-800 rounded p-4 flex flex-col gap-3 h-full overflow-y-auto">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-mono text-[10px] font-bold text-slate-200 tracking-wider">
                    PROPRIEDADES DO MATERIAL 5D
                  </span>
                </div>

                <p className="font-sans text-[11px] text-slate-400 leading-relaxed">
                  O Armazenamento de Dados Ópticos 5D altera a estrutura nanométrica do quartzo de forma permanente. É uma tecnologia limpa definitiva, impedindo a perda de dados por eras com zero consumo de refrigeração.
                </p>

                <div className="space-y-2">
                  <div className="p-2 bg-[#05070a] border border-slate-800 rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider">Durabilidade de Dados</span>
                      <span className="font-mono text-[10px] text-teal-400 font-bold">13,8 Bilhões de Anos</span>
                    </div>
                  </div>

                  <div className="p-2 bg-[#05070a] border border-slate-800 rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider">Resistência Térmica</span>
                      <span className="font-mono text-[10px] text-amber-500 font-bold">Limite de 1000°C</span>
                    </div>
                  </div>

                  <div className="p-2 bg-[#05070a] border border-slate-800 rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider">Densidade</span>
                      <span className="font-mono text-[10px] text-cyan-400 font-bold">360 TB / Disco</span>
                    </div>
                  </div>

                  <div className="p-2 bg-[#05070a] border border-slate-800 rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider">Consumo Energético</span>
                      <span className="font-mono text-[10px] text-emerald-400 font-bold">0,00 Watts</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {sidebarTab === 'doping' && (
              <DopingHeatmap
                state={simState}
                playClickSfx={playClickSfx}
                handleUpdateSimState={handleUpdateSimState}
              />
            )}

            {sidebarTab === 'efficiency' && (
              <EfficiencyChart
                currentSceneNumber={SCENES_DATA[simState.currentScene].number}
                purityLevel={simState.purity}
                writingProgress={simState.writingProgress}
                instabilityActive={simState.instabilityActive}
                isBlackout={isBlackout}
                onSimulateBlackout={(val) => {
                  setIsBlackout(val);
                  if (val) {
                    addToast(
                      "ALERTA CRÍTICO: BLACKOUT",
                      "O sistema foi desconectado e entrou em estado offline de emergência.",
                      "error"
                    );
                    addCriticalEvent('Desconexão de Rede DREX', 'critical', 'NET-DIS-503');
                  } else {
                    addToast(
                      "SISTEMA RESTAURADO",
                      "A conexão com o DREX Ledger foi restabelecida com sucesso.",
                      "success"
                    );
                    addCriticalEvent('Reconexão do Ledger DREX', 'info', 'NET-CON-200');
                  }
                }}
              />
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center gap-2 shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] uppercase text-green-500 font-mono font-medium">Mecanismo de Armazenamento Pronto</span>
          </div>
        </aside>
      </div>

      {/* Sub-footer: Environmental Compliance */}
      <footer className="h-8 bg-[#05070a] border-t border-slate-900 flex items-center justify-between px-6 shrink-0 z-50">
        <p className="text-[9px] text-slate-600 font-mono">
          ARQUITETURA DE ARMAZENAMENTO SEGURO v4.0.2 // INSTALAÇÃO DE EMISSÃO ZERO
        </p>
        <p className="text-[9px] text-slate-600 font-mono hidden sm:block">
          © 2026 UNIDADE DE SOBERANIA TECNOLÓGICA SISTEMA AURORA SOBERANO
        </p>
      </footer>

      {/* Onboarding Interactive Spotlight Tour */}
      <OnboardingTour />

      {/* Aura Voice-Guided Assistant */}
      <AuraVoiceAssistant />

      {/* Real-Time Toast Notifications */}
      <ToastNotifications toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      {/* Auto-triggered Certificado de Conformidade DREX Modal Overlay */}
      <CertificadoConformidade
        isOpen={isAutoCertificateOpen}
        onClose={() => setIsAutoCertificateOpen(false)}
        activeBlock={activeBlock}
        totalVoxels={activeBlock?.voxels?.length || 100}
        purity={simState.purity}
        recordedCount={activeBlock?.voxels?.length || 100}
        corruptedCount={simState.instabilityActive ? Math.floor((activeBlock?.voxels?.length || 100) * 0.12) : 0}
      />
    </div>
  );
}
