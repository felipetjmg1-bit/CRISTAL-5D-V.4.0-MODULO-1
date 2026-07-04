import React, { useState, useEffect, useRef } from 'react';
import { CrystalDataBlock, SimulationState, StorageScene } from '../types';
import { getPresetDrexBlocks, generateHash, encodeTextTo5D } from '../utils/encoder';
import { Database, Plus, RefreshCw, Send, CheckCircle2, ShieldAlert, Terminal } from 'lucide-react';
import { playClickSfx } from '../utils/audio';

interface DrexConsoleProps {
  onWriteBlock: (block: CrystalDataBlock) => void;
  activeBlockId: string | null;
  isWriting: boolean;
  state: SimulationState;
}

const getFormattedTimestamp = () => {
  const now = new Date();
  return now.toTimeString().split(' ')[0]; // HH:MM:SS
};

export default function DrexConsole({ onWriteBlock, activeBlockId, isWriting, state }: DrexConsoleProps) {
  const [blocks, setBlocks] = useState<Omit<CrystalDataBlock, 'voxels'>[]>([]);
  const [customText, setCustomText] = useState('');
  const [customTitle, setCustomTitle] = useState('Log de Transferência DREX Varejo');
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Real-time telemetry logs
  const [logs, setLogs] = useState<Array<{ id: string; timestamp: string; type: 'info' | 'success' | 'warning' | 'error'; message: string }>>([
    {
      id: 'init-1',
      timestamp: getFormattedTimestamp(),
      type: 'info',
      message: 'SISTEMA: Inicializando nó validador soberano Sistema Aurora Soberano.'
    },
    {
      id: 'init-2',
      timestamp: getFormattedTimestamp(),
      type: 'success',
      message: 'DREX: Conexão com a rede do Banco Central restabelecida.'
    },
    {
      id: 'init-3',
      timestamp: getFormattedTimestamp(),
      type: 'info',
      message: 'CRISTAL: Carregando rede de voxels do quartzo de silicato.'
    }
  ]);

  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const prevSceneRef = useRef<StorageScene>(state.currentScene);
  const prevInstabilityRef = useRef<boolean>(state.instabilityActive);
  const prevWritingProgressRef = useRef<number>(state.writingProgress);
  const prevBlockIdRef = useRef<string | null>(activeBlockId);

  // Auto scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Append new log entry helper
  const addLog = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    setLogs(prev => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: getFormattedTimestamp(),
        type,
        message
      }
    ]);
  };

  // Observe simulation state changes for live logs
  useEffect(() => {
    // Check scene changes
    if (prevSceneRef.current !== state.currentScene) {
      let msg = '';
      if (state.currentScene === StorageScene.RAW_SOURCE) {
        msg = 'Fase de análise de matéria-prima iniciada: inspeção do Quartzo Sólido.';
      } else if (state.currentScene === StorageScene.MINING_PURITY) {
        msg = 'Iniciando purificação química em alta temperatura. Alvo: 99.9999% de pureza SiO₂.';
      } else if (state.currentScene === StorageScene.ELEMENT_INJECTION) {
        msg = 'Iniciando injeção ativa de dopantes: Érbio (Er) e Niobato de Lítio (LiNbO₃) sob carga de plasma.';
      } else if (state.currentScene === StorageScene.FIVE_D_ENCODING) {
        msg = 'Laser de femtossegundo de alta energia ativado. Preparando escrita de dados nanométricos.';
      } else if (state.currentScene === StorageScene.FINAL_PRODUCT) {
        msg = 'Ciclo de resfriamento controlado ativado. Sincronização do ledger DREX com o cristal.';
      }

      if (msg) {
        addLog('info', `ETAPA: ${msg}`);
      }
      prevSceneRef.current = state.currentScene;
    }

    // Check instability alerts / recalibration
    if (prevInstabilityRef.current !== state.instabilityActive) {
      if (state.instabilityActive) {
        addLog('error', `CRÍTICO: Falha óptica detectada! Instabilidade térmica no laser de femtossegundo (${state.instabilitySeverity}% de desvio).`);
      } else {
        addLog('success', 'CORREÇÃO: Recalibragem de emergência concluída. Alinhamento óptico restaurado com zero desvio.');
      }
      prevInstabilityRef.current = state.instabilityActive;
    }

    // Check writing progress start and end
    if (prevWritingProgressRef.current !== state.writingProgress) {
      const activeBlockObj = blocks.find(b => b.id === activeBlockId);
      const blockTitle = activeBlockObj?.title || 'Bloco Customizado';

      if (prevWritingProgressRef.current === 0 && state.writingProgress > 0) {
        addLog('warning', `GRAVAÇÃO: Gravação iniciada via laser de femtossegundo para o '${blockTitle}'.`);
      } else if (state.writingProgress >= 100 && prevWritingProgressRef.current < 100) {
        addLog('success', `GRAVAÇÃO: '${blockTitle}' gravado com sucesso na estrutura do cristal!`);
      }
      prevWritingProgressRef.current = state.writingProgress;
    }

    // Check loaded block change
    if (prevBlockIdRef.current !== activeBlockId) {
      if (activeBlockId) {
        const activeBlockObj = blocks.find(b => b.id === activeBlockId);
        if (activeBlockObj) {
          addLog('info', `LEDGER: Bloco '${activeBlockObj.title}' carregado no buffer de gravação.`);
        }
      }
      prevBlockIdRef.current = activeBlockId;
    }
  }, [state.currentScene, state.instabilityActive, state.writingProgress, activeBlockId, blocks]);

  // Initialize with presets
  useEffect(() => {
    setBlocks(getPresetDrexBlocks());
  }, []);

  const handleSelectBlock = (block: Omit<CrystalDataBlock, 'voxels'>) => {
    playClickSfx();
    const voxels = encodeTextTo5D(block.payload, block.type);
    onWriteBlock({
      ...block,
      voxels
    });
    showFeedback(`Bloco de dados carregado para compilação na grade 5D.`);
  };

  const handleCreateCustomBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;

    playClickSfx();
    const payloadStr = JSON.stringify({
      network: "DREX_RETAIL_SANDBOX",
      payload: customText,
      institution: "Banco Central do Brasil",
      validator: "AuroraSoberano-CleanLab",
      certified_at: Math.floor(Date.now() / 1000)
    }, null, 2);

    const newBlock: Omit<CrystalDataBlock, 'voxels'> = {
      id: `custom-tx-${Date.now()}`,
      title: customTitle || 'Bloco de Dados Personalizado',
      type: 'CUSTOM_TEXT',
      payload: payloadStr,
      timestamp: Date.now(),
      hash: generateHash(payloadStr),
      sizeKb: parseFloat((payloadStr.length / 1024).toFixed(2))
    };

    setBlocks([newBlock, ...blocks]);
    const fullBlock: CrystalDataBlock = {
      ...newBlock,
      voxels: encodeTextTo5D(payloadStr, 'CUSTOM_TEXT')
    };

    onWriteBlock(fullBlock);
    setCustomText('');
    setCustomTitle('Log de Transferência DREX Varejo');
    setActiveTab('presets');
    showFeedback(`Bloco personalizado gerado e enfileirado para gravação 5D!`);
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  return (
    <div className="flex flex-col h-full bg-[#070E1B]/80 border border-cyan-950/40 rounded-xl overflow-hidden backdrop-blur-md">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0A162B] border-b border-cyan-950/40">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <h3 className="font-mono text-xs font-bold text-gray-200 tracking-wide">
            ARQUIVO CENTRAL DO LEDGER DREX
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[9px] text-emerald-400 font-medium uppercase tracking-wider">
            Nó Soberano Online
          </span>
        </div>
      </div>

      {/* Selector Tabs */}
      <div className="flex border-b border-cyan-950/40 bg-[#081123]">
        <button
          onClick={() => { playClickSfx(); setActiveTab('presets'); }}
          className={`flex-1 py-2 font-mono text-[10px] text-center tracking-wider transition-colors ${
            activeTab === 'presets'
              ? 'bg-[#0B1832] text-cyan-400 border-b-2 border-cyan-500 font-semibold'
              : 'text-gray-400 hover:bg-cyan-950/20 hover:text-gray-200'
          }`}
        >
          Blocos Pré-definidos
        </button>
        <button
          onClick={() => { playClickSfx(); setActiveTab('custom'); }}
          className={`flex-1 py-2 font-mono text-[10px] text-center tracking-wider transition-colors ${
            activeTab === 'custom'
              ? 'bg-[#0B1832] text-cyan-400 border-b-2 border-cyan-500 font-semibold'
              : 'text-gray-400 hover:bg-cyan-950/20 hover:text-gray-200'
          }`}
        >
          Injetar Carga Personalizada
        </button>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div className="flex items-center gap-2 px-4 py-2 bg-cyan-950/30 border-b border-cyan-500/20">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <p className="font-mono text-[9px] text-cyan-200">{feedbackMsg}</p>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[340px]">
        {activeTab === 'presets' ? (
          <div className="space-y-3">
            <p className="font-sans text-[11px] text-gray-400 leading-relaxed">
              Selecione um registro de transação DREX oficial do Banco Central do Brasil ou um contrato inteligente soberano. Uma vez carregado, prossiga para a <strong className="text-cyan-400">Etapa 4 (A Gravação em 5D)</strong> para acionar a sequência de gravação de femtossegundos.
            </p>
            <div className="space-y-2">
              {blocks.map((b) => {
                const isActive = b.id === activeBlockId;
                return (
                  <button
                    key={b.id}
                    onClick={() => handleSelectBlock(b)}
                    disabled={isWriting}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1.5 ${
                      isActive
                        ? 'bg-cyan-950/20 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                        : 'bg-[#060D19]/60 border-cyan-950/60 hover:border-cyan-500/40 hover:bg-[#071328]/40'
                    } ${isWriting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-[10px] font-semibold ${
                        isActive ? 'text-cyan-400' : 'text-gray-200'
                      }`}>
                        {b.title}
                      </span>
                      <span className="font-mono text-[8px] bg-cyan-950/80 text-cyan-400 border border-cyan-500/20 px-1 rounded">
                        {b.sizeKb} KB
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono text-gray-400">
                      <span>TIPO: {b.type}</span>
                      <span className="text-[8px] text-gray-500 font-light truncate max-w-[120px]">
                        HASH: {b.hash}
                      </span>
                    </div>

                    <div className="p-1.5 bg-[#03070E] rounded border border-cyan-950/40 overflow-hidden">
                      <pre className="font-mono text-[8px] text-cyan-300/80 leading-normal line-clamp-2 overflow-hidden whitespace-pre-wrap">
                        {b.payload}
                      </pre>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateCustomBlock} className="space-y-3">
            <p className="font-sans text-[11px] text-gray-400 leading-relaxed">
              Crie metadados bancários personalizados, conjuntos de chaves públicas ou registros de texto para transformá-los em voxels ópticos binários dentro da estrutura do cristal.
            </p>

            <div className="space-y-1">
              <label className="font-mono text-[9px] text-cyan-400 uppercase tracking-wider block">
                Título do Registro de Transação
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="ex: Log de Liquidação Bancária de Varejo"
                className="w-full bg-[#040913] border border-cyan-950/60 rounded px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[9px] text-cyan-400 uppercase tracking-wider block">
                Carga Útil do Registro (Payload)
              </label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Digite o texto ou cole códigos/registros JSON aqui..."
                rows={4}
                className="w-full bg-[#040913] border border-cyan-950/60 rounded px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={!customText.trim() || isWriting}
              className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-mono text-xs font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-950/40"
            >
              <Plus className="w-3.5 h-3.5" />
              COMPILAR PARA GRADE 5D
            </button>
          </form>
        )}
      </div>

      {/* Selected Block Info Summary */}
      {activeBlockId && (
        <div className="p-3 bg-[#050A14] border-t border-cyan-950/40 flex items-center justify-between text-[9px] font-mono text-gray-400 shrink-0">
          <div className="flex flex-col gap-0.5">
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[8px]">
              Dados Compilados Ativos
            </span>
            <span className="text-gray-300 font-medium truncate max-w-[150px]">
              {blocks.find(b => b.id === activeBlockId)?.title || 'Compilação Personalizada'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-teal-400 block font-bold">
              {blocks.find(b => b.id === activeBlockId)?.payload.length || 0} caracteres
            </span>
            <span>
              {blocks.find(b => b.id === activeBlockId)?.payload.length ? Math.ceil(blocks.find(b => b.id === activeBlockId)!.payload.length * 2) : 0} Voxels 5D
            </span>
          </div>
        </div>
      )}

      {/* Real-Time System Telemetry Logs Panel */}
      <div className="border-t border-cyan-950/40 bg-[#040811] p-3 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-mono text-[8px] font-bold text-slate-300 uppercase tracking-wider">
              Telemetria de Eventos do Sistema
            </span>
          </div>
          <button 
            type="button"
            onClick={() => { playClickSfx(); setLogs([]); }}
            className="font-mono text-[7.5px] text-slate-500 hover:text-slate-300 uppercase transition-colors"
          >
            Limpar Logs
          </button>
        </div>

        <div className="h-28 overflow-y-auto bg-slate-950/80 rounded border border-cyan-950/60 p-2 font-mono text-[8.5px] leading-relaxed space-y-1.5 scrollbar-thin scrollbar-thumb-cyan-950/40">
          {logs.map(log => (
            <div key={log.id} className="flex gap-1.5 items-start">
              <span className="text-slate-500 shrink-0 font-light select-none">[{log.timestamp}]</span>
              <span className={`shrink-0 font-bold uppercase ${
                log.type === 'error' ? 'text-red-500' : 
                log.type === 'warning' ? 'text-amber-500' : 
                log.type === 'success' ? 'text-emerald-400' : 
                'text-cyan-400'
              }`}>
                {log.type === 'error' ? 'ERR' : 
                 log.type === 'warning' ? 'WAR' : 
                 log.type === 'success' ? 'OK ' : 
                 'INF'}
              </span>
              <span className="text-slate-300/90 break-all">{log.message}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-slate-600 italic text-center py-4 text-[8px]">Sem eventos na fila de transmissão...</div>
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
