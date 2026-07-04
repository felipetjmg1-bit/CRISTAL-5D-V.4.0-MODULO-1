import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronRight, ChevronLeft, X, Sparkles, Compass, Lightbulb } from 'lucide-react';
import { playClickSfx } from '../utils/audio';

interface TourStep {
  targetId?: string;
  title: string;
  description: string;
  badge?: string;
  placement: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Bem-vindo ao Simulador de Armazenamento 5D!",
    description: "Este simulador demonstra o processo revolucionário de gravar dados eternos em cristais de quartzo nano-estruturados, integrado ao livro-razão (Ledger) do DREX. Vamos guiar você pelas principais funcionalidades!",
    badge: "Introdução",
    placement: "center"
  },
  {
    targetId: "timeline-controller",
    title: "Estágios do Processo de Gravação",
    description: "Controle o fluxo através dos 5 estágios fundamentais: desde a análise da rocha de quartzo bruto, purificação química, injeção ativa de dopantes (Érbio e Lítio), escrita a laser de femtossegundo 5D, até o resfriamento final.",
    badge: "Linha do Tempo",
    placement: "bottom"
  },
  {
    targetId: "crystal-simulator-container",
    title: "Simulador 3D do Cristal de Quartzo",
    description: "Aqui você visualiza o disco de quartzo girando em tempo real. Observe as reações do laser de femtossegundo e os pulsos ópticos de atividade que adicionamos para simular a escrita em 5 dimensões.",
    badge: "Visualização 3D",
    placement: "right"
  },
  {
    targetId: "sidebar-diagnostics",
    title: "Diagnósticos e Instabilidades",
    description: "Monitore a pureza do cristal e ative um 'Acidente Controlado' para provocar flutuações e testar o sistema. Use a 'Recalibragem de Emergência' para estabilizar o laser e continuar!",
    badge: "Laboratório de Controle",
    placement: "right"
  },
  {
    targetId: "tab-doping-button",
    title: "Dopagem Térmica (D3.js)",
    description: "Examine a aba de Dopagem para ver o gráfico termográfico real em tempo real. O mapa de calor D3.js exibe as concentrações de Érbio (Er) e Niobato de Lítio (LiNbO3) sob efeito do feixe térmico.",
    badge: "Física de Materiais",
    placement: "left"
  },
  {
    targetId: "tab-impact-button",
    title: "Métricas de Sustentabilidade",
    description: "Acompanhe as métricas estimadas de poupança ecológica ao longo de 20 anos na aba 'Impacto'. Veja o consumo energético, as toneladas de CO₂ evitadas e a redução drástica de lixo eletrônico.",
    badge: "Eco-Friendly",
    placement: "left"
  },
  {
    targetId: "drex-ledger-panel",
    title: "Consola Ledger DREX",
    description: "Selecione blocos de transações e grave-os permanentemente no cristal de quartzo através do laser 5D, sincronizando a infraestrutura física de armazenamento eterno com a rede DREX.",
    badge: "Rede Financeira",
    placement: "top"
  }
];

export default function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Auto-trigger tour on very first visit
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('drex_5d_tour_completed');
    if (!hasCompletedTour) {
      // Small timeout to let initial layout compile cleanly
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    playClickSfx();
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    playClickSfx();
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleClose = () => {
    playClickSfx();
    setIsOpen(false);
    localStorage.setItem('drex_5d_tour_completed', 'true');
  };

  const handleStartTour = () => {
    playClickSfx();
    setCurrentStep(0);
    setIsOpen(true);
  };

  const step = TOUR_STEPS[currentStep];

  // Helper styles to simulate highlight ring around target elements
  useEffect(() => {
    if (!isOpen || !step.targetId) {
      // Remove any leftover highlight classes
      document.querySelectorAll('.tour-highlight-active').forEach(el => {
        el.classList.remove('tour-highlight-active');
      });
      return;
    }

    const element = document.getElementById(step.targetId);
    if (element) {
      // Add visual border/ring highlights helper to target element
      element.classList.add('tour-highlight-active');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      return () => {
        element.classList.remove('tour-highlight-active');
      };
    }
  }, [isOpen, currentStep, step.targetId]);

  return (
    <>
      {/* Floating trigger button to replay the tour */}
      <button
        onClick={handleStartTour}
        className="fixed bottom-4 right-4 z-[90] flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-[9px] font-bold uppercase tracking-wider rounded-full shadow-[0_4px_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer hover:scale-105 active:scale-95 border border-cyan-400/20"
        title="Iniciar Tour de Integração 5D"
      >
        <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
        <span>Tour do Sistema</span>
      </button>

      {/* Interactive Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
            
            {/* Spotlight Mask Simulator */}
            {step.targetId && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-cyan-950/20 pointer-events-none"
              />
            )}

            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-md mx-4 bg-[#081123] border border-cyan-500/40 rounded-2xl shadow-[0_10px_40px_rgba(6,182,212,0.25)] overflow-hidden"
            >
              {/* Energy line highlight on top of modal */}
              <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 w-full" />

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1 rounded-full bg-slate-900/40 border border-slate-800/40 hover:border-slate-700 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="p-6 space-y-4">
                {/* Header with Step Badge */}
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 font-mono text-[8px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/30 rounded uppercase tracking-wider">
                    {step.badge || "Guia"}
                  </span>
                  <span className="font-mono text-[9px] text-slate-500">
                    Passo {currentStep + 1} de {TOUR_STEPS.length}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-sans text-base font-bold text-slate-100 tracking-tight leading-snug flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                  {step.title}
                </h3>

                {/* Description */}
                <p className="font-sans text-xs text-slate-300 leading-relaxed">
                  {step.description}
                </p>

                {/* Visual Target Guide Alert if applicable */}
                {step.targetId && (
                  <div className="p-2 bg-cyan-950/20 border border-cyan-500/20 rounded-lg flex items-center gap-2 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-mono text-[8px] text-cyan-300 uppercase tracking-wider">
                      Elemento realce ativo na interface
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                  <button
                    onClick={handleClose}
                    className="font-mono text-[9px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-wider cursor-pointer"
                  >
                    Pular Tour
                  </button>

                  <div className="flex items-center gap-2">
                    {currentStep > 0 && (
                      <button
                        onClick={handlePrev}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-mono text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Anterior
                      </button>
                    )}

                    <button
                      onClick={handleNext}
                      className="flex items-center gap-1 px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 hover:from-cyan-400 hover:to-blue-400 font-mono text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                    >
                      {currentStep === TOUR_STEPS.length - 1 ? "Concluir" : "Próximo"}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
