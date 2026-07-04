import { useState, useEffect, useRef } from 'react';
import { StorageScene, SimulationState } from '../types';
import { SCENES_DATA } from '../data/scenesData';
import { Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX, Flame, FlaskConical, Cpu, ShieldCheck } from 'lucide-react';
import { playClickSfx, playInjectionSound, startLaserWritingSfx, stopLaserWritingSfx } from '../utils/audio';

interface TimelineControllerProps {
  state: SimulationState;
  onChangeState: (updater: Partial<SimulationState>) => void;
  onAction?: (actionName: string) => void;
}

export default function TimelineController({ state, onChangeState, onAction }: TimelineControllerProps) {
  const [typedText, setTypedText] = useState('');
  const typingTimerRef = useRef<any>(null);
  const activeSceneData = SCENES_DATA[state.currentScene];

  // Auto-play interval timer
  useEffect(() => {
    let playInterval: any = null;
    if (state.isPlaying) {
      playInterval = setInterval(() => {
        // If instability is active, freeze progress
        if (state.instabilityActive) {
          return;
        }

        // Increment progress
        const isFiveD = state.currentScene === StorageScene.FIVE_D_ENCODING;
        const speedMultiplier = (state.laserBurstMode && isFiveD) ? 2.0 : 1.0;
        const nextProgress = state.playProgress + 2.5 * speedMultiplier;
        if (nextProgress >= 100) {
          // Go to next scene, or loop
          const scenesOrder = Object.values(StorageScene);
          const currentIndex = scenesOrder.indexOf(state.currentScene);
          if (currentIndex < scenesOrder.length - 1) {
            onChangeState({
              currentScene: scenesOrder[currentIndex + 1],
              playProgress: 0,
              writingProgress: 0
            });
          } else {
            // Loop back to start
            onChangeState({
              currentScene: scenesOrder[0],
              playProgress: 0,
              writingProgress: 0
            });
          }
        } else {
          // Check laser sound effects on Scene 4 auto-play
          if (state.currentScene === StorageScene.FIVE_D_ENCODING) {
            // Randomly trigger instability - significantly higher probability when in Burst Mode
            const instabilityChance = state.laserBurstMode ? 0.35 : 0.12;
            if (!state.instabilityActive && nextProgress > 20 && nextProgress < 85 && Math.random() < instabilityChance) {
              onChangeState({
                instabilityActive: true,
                instabilitySeverity: state.laserBurstMode 
                  ? 80 + Math.floor(Math.random() * 20) 
                  : 60 + Math.floor(Math.random() * 30)
              });
              stopLaserWritingSfx();
              return;
            }

            onChangeState({
              playProgress: nextProgress,
              writingProgress: nextProgress // Sync laser progress with scene play
            });
            if (nextProgress > 5 && nextProgress < 95) {
              startLaserWritingSfx();
            } else {
              stopLaserWritingSfx();
            }
          } else {
            // Smaller chance to trigger instability in other processing scenes when playing
            if (!state.instabilityActive && state.currentScene !== StorageScene.RAW_SOURCE && state.currentScene !== StorageScene.FINAL_PRODUCT && Math.random() < 0.05) {
              onChangeState({
                instabilityActive: true,
                instabilitySeverity: 40 + Math.floor(Math.random() * 30)
              });
              return;
            }

            onChangeState({ playProgress: nextProgress });
          }
        }
      }, 350);
    } else {
      stopLaserWritingSfx();
    }

    return () => {
      clearInterval(playInterval);
    };
  }, [state.isPlaying, state.playProgress, state.currentScene, state.instabilityActive]);

  // Handle laser sfx cleanup on unmount
  useEffect(() => {
    return () => {
      stopLaserWritingSfx();
    };
  }, []);

  // Typewriting effect for narration script
  useEffect(() => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    
    setTypedText('');
    let index = 0;
    const fullText = activeSceneData.narration;
    
    typingTimerRef.current = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(prev => prev + fullText.charAt(index));
        index++;
      } else {
        clearInterval(typingTimerRef.current);
      }
    }, 15); // Fast, satisfying typing speed

    return () => clearInterval(typingTimerRef.current);
  }, [state.currentScene]);

  const handleTogglePlay = () => {
    playClickSfx();
    onChangeState({ isPlaying: !state.isPlaying });
  };

  const handleNextScene = () => {
    playClickSfx();
    const scenesOrder = Object.values(StorageScene);
    const currentIndex = scenesOrder.indexOf(state.currentScene);
    const nextIndex = (currentIndex + 1) % scenesOrder.length;
    onChangeState({
      currentScene: scenesOrder[nextIndex],
      playProgress: 0,
      writingProgress: 0,
      isPlaying: false
    });
  };

  const handleResetScene = () => {
    playClickSfx();
    onChangeState({
      playProgress: 0,
      writingProgress: 0,
      purity: state.currentScene === StorageScene.MINING_PURITY ? 0 : state.purity,
      erbiumLevel: state.currentScene === StorageScene.ELEMENT_INJECTION ? 0 : state.erbiumLevel,
      lithiumLevel: state.currentScene === StorageScene.ELEMENT_INJECTION ? 0 : state.lithiumLevel,
      isPlaying: false
    });
  };

  const handleSelectScene = (scene: StorageScene) => {
    playClickSfx();
    onChangeState({
      currentScene: scene,
      playProgress: 0,
      writingProgress: 0,
      isPlaying: false
    });
  };

  const triggerInject = (type: 'erbium' | 'lithium') => {
    playInjectionSound(type);
    if (type === 'erbium') {
      onChangeState({ erbiumLevel: 100 });
    } else {
      onChangeState({ lithiumLevel: 100 });
    }
  };

  return (
    <div id="timeline-controller" className="flex flex-col gap-4 bg-[#070E1B]/80 border border-cyan-950/40 rounded-xl p-4 backdrop-blur-md">
      {/* 5-Phase Horizontal Progress Timeline Indicator */}
      <div className="grid grid-cols-5 gap-2">
        {Object.values(StorageScene).map((sceneId, idx) => {
          const s = SCENES_DATA[sceneId];
          const isCurrent = state.currentScene === sceneId;
          const isPast = idx < Object.values(StorageScene).indexOf(state.currentScene);
          
          return (
            <button
              key={sceneId}
              onClick={() => handleSelectScene(sceneId)}
              className="flex flex-col gap-1.5 text-left group"
            >
              <div className="w-full h-1 relative bg-cyan-950/40 rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full transition-all duration-300 ${
                    isCurrent
                      ? 'bg-cyan-400 w-full animate-pulse'
                      : isPast
                      ? 'bg-cyan-600/80 w-full'
                      : 'bg-transparent w-0'
                  }`}
                />
              </div>
              <span className={`font-mono text-[8px] uppercase tracking-wider ${
                isCurrent ? 'text-cyan-400 font-bold' : 'text-gray-500 group-hover:text-gray-300 transition-colors'
              }`}>
                Cena {s.number}
              </span>
              <span className={`font-sans text-[10px] font-semibold truncate ${
                isCurrent ? 'text-gray-100' : 'text-gray-500 group-hover:text-gray-300 transition-colors'
              }`}>
                {s.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Narrative Subtitle Telemetry Frame */}
      <div className="relative bg-[#040913]/90 border border-cyan-950/50 rounded-lg p-4 h-[120px] overflow-y-auto flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
            <span className="font-mono text-[9px] text-cyan-400/80 tracking-widest uppercase">
              LEGENDA DA NARRAÇÃO DO ÁUDIO DOCUMENTÁRIO
            </span>
          </div>
          <p className="font-mono text-[11px] text-cyan-100 leading-relaxed min-h-[50px] whitespace-pre-wrap">
            {typedText}
          </p>
        </div>
        <div className="font-mono text-[8px] text-gray-500 text-right uppercase tracking-wider select-none">
          Sequência de Locução do Documentário
        </div>
      </div>

      {/* Interactive Controls & Playback Hub */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#081123]/60 p-3 rounded-lg border border-cyan-950/40">
        
        {/* Playback Button Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlay}
            title={state.isPlaying ? 'Pausar Sequência do Filme' : 'Iniciar Filme Cinematográfico'}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
          >
            {state.isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
          </button>

          <button
            onClick={handleNextScene}
            title="Pular para Próxima Etapa"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0B172E] border border-cyan-950/40 hover:border-cyan-500/40 text-gray-300 hover:text-cyan-400 transition-all"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetScene}
            title="Reiniciar Progresso da Cena Ativa"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0B172E] border border-cyan-950/40 hover:border-cyan-500/40 text-gray-300 hover:text-cyan-400 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scene-Specific Action Injectors (Adds immense fidelity) */}
        <div className="flex-1 flex items-center justify-end gap-3">
          
          {/* Scene 2 Actions */}
          {state.currentScene === StorageScene.MINING_PURITY && (
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="font-mono text-[9px] text-cyan-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                Lavagem Química:
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={state.purity}
                onChange={(e) => {
                  onChangeState({ purity: parseInt(e.target.value) });
                }}
                className="w-full md:w-44 accent-cyan-400 h-1 bg-cyan-950 rounded-lg cursor-pointer"
              />
              <span className="font-mono text-[10px] text-gray-300 font-bold min-w-[35px]">
                {state.purity}%
              </span>
            </div>
          )}

          {/* Scene 3 Actions */}
          {state.currentScene === StorageScene.ELEMENT_INJECTION && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerInject('erbium')}
                className={`px-3 py-1.5 rounded border font-mono text-[10px] flex items-center gap-1.5 transition-all ${
                  state.erbiumLevel >= 100
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                    : 'bg-[#0B172E] border-cyan-950 hover:border-emerald-500 hover:text-emerald-400'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${state.erbiumLevel >= 100 ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                Injetar Érbio (Er³⁺)
              </button>

              <button
                onClick={() => triggerInject('lithium')}
                className={`px-3 py-1.5 rounded border font-mono text-[10px] flex items-center gap-1.5 transition-all ${
                  state.lithiumLevel >= 100
                    ? 'bg-purple-950/40 border-purple-500/40 text-purple-400'
                    : 'bg-[#0B172E] border-cyan-950 hover:border-purple-500 hover:text-purple-400'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${state.lithiumLevel >= 100 ? 'bg-purple-400' : 'bg-gray-600'}`} />
                Injetar Niobato de Lítio
              </button>
            </div>
          )}

          {/* Scene 4 Actions */}
          {state.currentScene === StorageScene.FIVE_D_ENCODING && (
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="font-mono text-[9px] text-cyan-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-cyan-400" />
                Gravação a Laser:
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={state.writingProgress}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  onChangeState({ writingProgress: val });
                  if (val > 0 && val < 100) {
                    startLaserWritingSfx();
                  } else {
                    stopLaserWritingSfx();
                  }
                }}
                className="w-full md:w-44 accent-cyan-400 h-1 bg-cyan-950 rounded-lg cursor-pointer"
              />
              <span className="font-mono text-[10px] text-gray-300 font-bold min-w-[35px]">
                {state.writingProgress}%
              </span>
            </div>
          )}

          {/* Scene 5 Actions */}
          {state.currentScene === StorageScene.FINAL_PRODUCT && (
            <div className="flex items-center gap-1 bg-teal-950/30 px-3 py-1.5 rounded-lg border border-teal-500/20">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-mono text-[9px] text-emerald-400 font-semibold uppercase tracking-wider">
                Soberania Tecnológica Garantida
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
