import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line
} from 'recharts';
import { Leaf, Zap, Trash2, ShieldCheck, TrendingDown, RefreshCw, Info, X, Server, Database } from 'lucide-react';
import { playClickSfx } from '../utils/audio';

// Realistic telemetry data showing accumulation over 20 years for a 500 TB ledger
const SUSTAINABILITY_DATA = [
  { year: 0, traditionalEnergy: 0, crystalEnergy: 0.12, traditionalCarbon: 0, crystalCarbon: 0.05, eWasteSaved: 0 },
  { year: 2, traditionalEnergy: 180, crystalEnergy: 0.12, traditionalCarbon: 32, crystalCarbon: 0.05, eWasteSaved: 180 },
  { year: 4, traditionalEnergy: 360, crystalEnergy: 0.12, traditionalCarbon: 64, crystalCarbon: 0.05, eWasteSaved: 360 }, // Replacement cycle 1
  { year: 6, traditionalEnergy: 540, crystalEnergy: 0.12, traditionalCarbon: 96, crystalCarbon: 0.05, eWasteSaved: 680 },
  { year: 8, traditionalEnergy: 720, crystalEnergy: 0.12, traditionalCarbon: 128, crystalCarbon: 0.05, eWasteSaved: 860 }, // Replacement cycle 2
  { year: 10, traditionalEnergy: 900, crystalEnergy: 0.12, traditionalCarbon: 160, crystalCarbon: 0.05, eWasteSaved: 1200 },
  { year: 12, traditionalEnergy: 1080, crystalEnergy: 0.12, traditionalCarbon: 192, crystalCarbon: 0.05, eWasteSaved: 1380 }, // Replacement cycle 3
  { year: 14, traditionalEnergy: 1260, crystalEnergy: 0.12, traditionalCarbon: 224, crystalCarbon: 0.05, eWasteSaved: 1720 },
  { year: 16, traditionalEnergy: 1440, crystalEnergy: 0.12, traditionalCarbon: 256, crystalCarbon: 0.05, eWasteSaved: 1900 }, // Replacement cycle 4
  { year: 18, traditionalEnergy: 1620, crystalEnergy: 0.12, traditionalCarbon: 288, crystalCarbon: 0.05, eWasteSaved: 2240 },
  { year: 20, traditionalEnergy: 1800, crystalEnergy: 0.12, traditionalCarbon: 320, crystalCarbon: 0.05, eWasteSaved: 2420 }
];

interface EfficiencyChartProps {
  currentSceneNumber: number;
  purityLevel: number;
  writingProgress: number;
  instabilityActive?: boolean;
  isBlackout?: boolean;
  onSimulateBlackout?: (val: boolean) => void;
}

export default function EfficiencyChart({ 
  currentSceneNumber, 
  purityLevel, 
  writingProgress, 
  instabilityActive,
  isBlackout = false,
  onSimulateBlackout
}: EfficiencyChartProps) {
  const [metricView, setMetricView] = useState<'energy' | 'carbon'>('energy');
  const [chartType, setChartType] = useState<'area' | 'line' | 'correlation' | 'purity'>('area');
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [oscillationTime, setOscillationTime] = useState(0);
  const [purityHistory, setPurityHistory] = useState<{ time: string; purity: number }[]>([]);

  const purityLevelRef = React.useRef(purityLevel);
  const instabilityActiveRef = React.useRef(instabilityActive);

  React.useEffect(() => {
    purityLevelRef.current = purityLevel;
    instabilityActiveRef.current = instabilityActive;
  }, [purityLevel, instabilityActive]);

  React.useEffect(() => {
    const initialHistory = [];
    const now = Date.now();
    for (let i = 15; i >= 0; i--) {
      const timePast = new Date(now - i * 1000);
      const timeStrPast = timePast.toTimeString().split(' ')[0];
      
      let baseP = purityLevelRef.current;
      if (instabilityActiveRef.current) {
        const jitter = (Math.sin((now - i * 1000) / 1000) * 8) + (Math.random() * 2 - 1);
        baseP = Math.max(0, Math.min(100, baseP + jitter));
      } else {
        const microJitter = (Math.random() * 0.1 - 0.05);
        baseP = Math.max(0, Math.min(100, baseP + microJitter));
      }
      initialHistory.push({
        time: timeStrPast,
        purity: parseFloat(baseP.toFixed(2))
      });
    }
    setPurityHistory(initialHistory);

    const interval = setInterval(() => {
      const currentTime = Date.now();
      const timeStr = new Date(currentTime).toTimeString().split(' ')[0];
      
      let currentP = purityLevelRef.current;
      if (instabilityActiveRef.current) {
        const jitter = (Math.sin(currentTime / 1000) * 8) + (Math.random() * 2 - 1);
        currentP = Math.max(0, Math.min(100, currentP + jitter));
      } else {
        const microJitter = (Math.random() * 0.1 - 0.05);
        currentP = Math.max(0, Math.min(100, currentP + microJitter));
      }
      
      setPurityHistory(prev => {
        const newHistory = [...prev, { time: timeStr, purity: parseFloat(currentP.toFixed(2)) }];
        if (newHistory.length > 30) {
          return newHistory.slice(newHistory.length - 30);
        }
        return newHistory;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fast animation tick when instability is active
  React.useEffect(() => {
    let intervalId: any = null;
    if (instabilityActive) {
      intervalId = setInterval(() => {
        setOscillationTime(prev => prev + 1);
      }, 60);
    } else {
      setOscillationTime(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [instabilityActive]);

  // Compute oscillating or stable telemetry data
  const dynamicChartData = React.useMemo(() => {
    if (!instabilityActive) return SUSTAINABILITY_DATA;

    return SUSTAINABILITY_DATA.map((item, idx) => {
      if (idx === 0) return item; // Start stays clean

      const wave = Math.sin((idx * 0.6) + (oscillationTime * 0.45));
      const microJitter = Math.cos((idx * 2.1) + (oscillationTime * 0.9)) * 0.15;
      const combinedOscillation = wave * 0.5 + microJitter;

      // Spike crystal values representing technical loss during accident
      const spikedCrystalEnergy = 0.12 + Math.max(0, (item.traditionalEnergy * 0.65) * (0.55 + combinedOscillation));
      const spikedCrystalCarbon = 0.05 + Math.max(0, (item.traditionalCarbon * 0.65) * (0.55 + combinedOscillation));

      // Add a slight jitter to traditional as well for dynamic realism
      const tradEnergyJitter = item.traditionalEnergy * (1.0 + (Math.sin(oscillationTime * 0.25 + idx) * 0.04));
      const tradCarbonJitter = item.traditionalCarbon * (1.0 + (Math.sin(oscillationTime * 0.25 + idx) * 0.04));

      return {
        ...item,
        traditionalEnergy: parseFloat(tradEnergyJitter.toFixed(1)),
        traditionalCarbon: parseFloat(tradCarbonJitter.toFixed(1)),
        crystalEnergy: parseFloat(spikedCrystalEnergy.toFixed(2)),
        crystalCarbon: parseFloat(spikedCrystalCarbon.toFixed(2)),
      };
    });
  }, [instabilityActive, oscillationTime]);

  // Telemetry correlation data over a 24h cycle
  const correlationData = React.useMemo(() => {
    const basePoints = [
      { time: '02:00', traffic: 150, stability: 99.9, laserTemp: 21.4 },
      { time: '04:00', traffic: 280, stability: 99.8, laserTemp: 21.4 },
      { time: '06:00', traffic: 180, stability: 99.9, laserTemp: 21.4 },
      { time: '08:00', traffic: 450, stability: 99.7, laserTemp: 21.5 },
      { time: '10:00', traffic: 890, stability: 99.6, laserTemp: 21.6 },
      { time: '12:00', traffic: 1120, stability: 99.5, laserTemp: 21.8 },
      { time: '14:00', traffic: 950, stability: 99.6, laserTemp: 21.7 },
      { time: '16:00', traffic: 620, stability: 99.7, laserTemp: 21.5 },
      { time: '18:00', traffic: 780, stability: 99.6, laserTemp: 21.6 },
      { time: '20:00', traffic: 1200, stability: 99.4, laserTemp: 21.9 },
      { time: '22:00', traffic: 410, stability: 99.8, laserTemp: 21.5 },
      { time: '24:00', traffic: 200, stability: 99.9, laserTemp: 21.4 },
    ];

    if (!instabilityActive) return basePoints;

    return basePoints.map((item, idx) => {
      const wave = Math.sin((idx * 0.8) + (oscillationTime * 0.45));
      const randomJitter = Math.cos((idx * 1.5) + (oscillationTime * 0.8)) * 1.2;
      
      const stabilityDrop = (item.traffic / 220) + (10 + wave * 6 + randomJitter);
      const corruptedStability = Math.max(55, Math.min(95, 99.9 - stabilityDrop));
      
      const tempRise = (item.traffic / 120) + (15 + wave * 4);
      const activeTemp = parseFloat((item.laserTemp + tempRise).toFixed(1));

      return {
        ...item,
        stability: parseFloat(corruptedStability.toFixed(1)),
        laserTemp: activeTemp,
      };
    });
  }, [instabilityActive, oscillationTime]);

  // Multiplier based on the progress of simulation to show real-time dynamic impact
  // If instability is active, progress multiplier is degraded/fluctuating
  const baseMultiplier = currentSceneNumber >= 5 
    ? 1.0 
    : currentSceneNumber === 4 
    ? 0.7 + (writingProgress * 0.003)
    : currentSceneNumber === 3 
    ? 0.5 
    : currentSceneNumber === 2 
    ? 0.2 + (purityLevel * 0.002) 
    : 0.1;

  const progressMultiplier = instabilityActive
    ? baseMultiplier * (0.4 + Math.sin(oscillationTime * 0.5) * 0.15) // highly degraded!
    : baseMultiplier;

  // Dynamically compute real-time current savings based on simulation progress
  const currentEnergySavedMWh = Math.max(0, Math.round(1800 * progressMultiplier));
  const currentCarbonAvoidedtCO2 = Math.max(0, Math.round(320 * progressMultiplier));
  const currentEWasteAvoidedKg = Math.max(0, Math.round(2420 * progressMultiplier));

  const handleToggleView = (view: 'energy' | 'carbon') => {
    playClickSfx();
    setMetricView(view);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isCorrelation = chartType === 'correlation';
      const isPurityTrend = chartType === 'purity';
      return (
        <div className="bg-[#09101F]/95 border border-cyan-500/30 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="font-mono text-[10px] text-cyan-400 font-bold mb-1.5 uppercase tracking-wider">
            {isPurityTrend 
              ? `Tempo: ${label}` 
              : isCorrelation 
                ? `Horário: ${label}` 
                : `Ano ${label} da Operação`
            }
          </p>
          <div className="space-y-1">
            {payload.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-6 text-[10px] font-mono">
                <span className="text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}:
                </span>
                <span className="font-bold text-gray-200">
                  {item.value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                  {isPurityTrend 
                    ? "%" 
                    : isCorrelation 
                      ? (item.name.includes("Tráfego") ? " TPS" : item.name.includes("Estabilidade") ? "%" : "°C")
                      : (metricView === 'energy' ? ' MWh' : ' tCO₂')
                  }
                </span>
              </div>
            ))}
          </div>
          {isPurityTrend && (
            <div className="mt-2 pt-1.5 border-t border-cyan-950/40 text-[8px] font-mono text-slate-400 flex flex-col gap-0.5">
              <span>Status: {instabilityActive ? 'Instabilidade Ativa (Laser Quente)' : 'Otimizado (Quartzo Estabilizado)'}</span>
              <span>Alvo de Pureza: {purityLevel}%</span>
            </div>
          )}
          {!isCorrelation && !isPurityTrend && label > 0 && (
            <div className="mt-2 pt-1.5 border-t border-cyan-950/40 text-[9px] font-mono text-emerald-400 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              <span>
                Redução de {metricView === 'energy' 
                  ? `${((1 - (payload[1]?.value / payload[0]?.value)) * 100).toFixed(2)}% de energia`
                  : `${((1 - (payload[1]?.value / payload[0]?.value)) * 100).toFixed(2)}% de CO₂`
                }
              </span>
            </div>
          )}
          {isCorrelation && (
            <div className="mt-2 pt-1.5 border-t border-cyan-950/40 text-[8px] font-mono text-slate-400 flex flex-col gap-0.5">
              <span>Eficiência de Gravação: {instabilityActive ? 'Degradada (Oscilando)' : 'Otimizada (Laser Frio)'}</span>
              <span>Buffer DREX: {payload[0]?.value > 1000 ? 'Sobrecarga de Tráfego' : 'Estável'}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-[#070E1B]/80 border border-cyan-950/40 rounded-xl overflow-hidden backdrop-blur-md">
      {/* Alert panel inside the chart container when instability is active */}
      {instabilityActive && (
        <div className="bg-red-950/60 border-b border-red-500/30 px-4 py-2 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-red-400 animate-spin" />
            <span className="font-mono text-[9px] text-red-300 font-bold uppercase tracking-wider">
              ALERTA: FLUTUAÇÃO DE ENERGIA DETECTADA!
            </span>
          </div>
          <span className="font-mono text-[8px] bg-red-900/50 text-red-200 px-1.5 py-0.5 rounded font-bold">
            LASER INSTÁVEL
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0A162B] border-b border-cyan-950/40">
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-emerald-400 animate-pulse" />
          <h3 className="font-mono text-xs font-bold text-gray-200 tracking-wide uppercase">
            Métricas de Sustentabilidade 5D
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-simulate-blackout"
            onClick={() => { 
              playClickSfx(); 
              if (onSimulateBlackout) {
                onSimulateBlackout(!isBlackout);
              }
            }}
            className={`px-2 py-0.5 font-mono text-[8.5px] font-bold rounded border uppercase flex items-center gap-1 cursor-pointer transition-all ${
              isBlackout 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/30' 
                : 'bg-red-950/40 border-red-500/40 text-red-400 hover:bg-red-900/30 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.15)]'
            }`}
            title={isBlackout ? "Restaurar conexão do sistema" : "Interromper energia e simular blackout total de rede"}
          >
            <Zap className="w-3 h-3" />
            {isBlackout ? "Restaurar" : "Simular Blackout"}
          </button>
          <button
            id="btn-compare-costs-modal"
            onClick={() => { playClickSfx(); setIsCompareModalOpen(true); }}
            className="px-2 py-0.5 font-mono text-[8.5px] font-bold rounded border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/40 transition-colors uppercase flex items-center gap-1 cursor-pointer"
            title="Comparar consumo estimado com servidores tradicionais baseados em dados reais"
          >
            <Info className="w-3 h-3" />
            Comparar Custos
          </button>
          <div className="flex bg-[#050A14] border border-cyan-950/50 p-0.5 rounded">
          <button
            onClick={() => handleToggleView('energy')}
            className={`px-2 py-0.5 font-mono text-[9px] font-bold rounded transition-colors uppercase ${
              metricView === 'energy' 
                ? 'bg-cyan-500 text-slate-950' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Energia
          </button>
          <button
            onClick={() => handleToggleView('carbon')}
            className={`px-2 py-0.5 font-mono text-[9px] font-bold rounded transition-colors uppercase ${
              metricView === 'carbon' 
                ? 'bg-cyan-500 text-slate-950' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Carbono
          </button>
        </div>
      </div>
    </div>

      {/* Alerta Crítico de Segurança para Blackout */}
      {isBlackout && (
        <div className="bg-red-950/80 border-b border-red-500/40 px-4 py-3 flex flex-col gap-1.5 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="font-mono text-[10px] text-red-400 font-extrabold uppercase tracking-widest">
                🚨 ALERTA CRÍTICO: FALHA DE ENERGIA (BLACKOUT)
              </span>
            </div>
            <span className="font-mono text-[8px] bg-red-900/60 text-red-200 px-2 py-0.5 rounded-full font-bold border border-red-600/30 uppercase tracking-widest animate-bounce">
              SISTEMA DESCONECTADO
            </span>
          </div>
          <p className="font-sans text-[10px] text-red-200/90 leading-relaxed uppercase">
            A rede de transmissão óptica com o Banco Central foi interrompida de forma abrupta. Todas as gravações pendentes no ledger financeiro foram pausadas para evitar a corrupção do cristal de quartzo 5D.
          </p>
          <div className="flex items-center gap-4 text-[8px] font-mono text-red-300/80 uppercase mt-0.5 border-t border-red-900/30 pt-1.5">
            <span>Protocolo de Segurança: AURORA-SEC-99</span>
            <span>IP: 10.0.8.22</span>
            <span>Região: SÃO PAULO - BR</span>
          </div>
        </div>
      )}

      {/* Real-time Dynamic Metrics Counter */}
      <div className={`p-4 grid grid-cols-3 gap-2 bg-[#081123]/40 border-b border-cyan-950/40 transition-all duration-1000 ${isBlackout ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
        <div className="p-2 bg-[#040913]/60 border border-cyan-950/60 rounded flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-[8px] font-mono text-cyan-400 uppercase tracking-wider">
            <Zap className="w-3 h-3 text-cyan-400" />
            Poupada
          </div>
          <span className="font-mono text-xs font-bold text-gray-100">
            {isBlackout ? '--- MWh' : `${currentEnergySavedMWh} MWh`}
          </span>
          <span className="text-[7px] text-gray-500 font-mono">ENERGIA</span>
        </div>

        <div className="p-2 bg-[#040913]/60 border border-cyan-950/60 rounded flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-[8px] font-mono text-emerald-400 uppercase tracking-wider">
            <Leaf className="w-3 h-3 text-emerald-400" />
            Evitado
          </div>
          <span className="font-mono text-xs font-bold text-gray-100">
            {isBlackout ? '--- tCO₂' : `${currentCarbonAvoidedtCO2} tCO₂`}
          </span>
          <span className="text-[7px] text-gray-500 font-mono">REDUÇÃO CO₂</span>
        </div>

        <div className="p-2 bg-[#040913]/60 border border-cyan-950/60 rounded flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-[8px] font-mono text-amber-500 uppercase tracking-wider">
            <Trash2 className="w-3 h-3 text-amber-500" />
            Evitado
          </div>
          <span className="font-mono text-xs font-bold text-gray-100">
            {isBlackout ? '--- kg' : `${currentEWasteAvoidedKg} kg`}
          </span>
          <span className="text-[7px] text-gray-500 font-mono">LIXO ELETRÔNICO</span>
        </div>
      </div>

      {/* Main Graph Area */}
      <div className={`flex-1 p-4 min-h-[220px] flex flex-col gap-2 transition-all duration-1000 ${isBlackout ? 'opacity-10 blur-[1px] pointer-events-none' : 'opacity-100'}`}>
        {/* Selector de Tipo de Gráfico */}
        <div className="flex items-center justify-between border-b border-cyan-950/20 pb-2 mb-1">
          <span className="font-mono text-[8px] text-slate-500 uppercase tracking-widest">
            Modo de Visualização
          </span>
          <div className="flex bg-[#050A14] border border-cyan-950/50 p-0.5 rounded gap-0.5 flex-wrap">
            <button
              onClick={() => { playClickSfx(); setChartType('area'); }}
              className={`px-1.5 py-0.5 font-mono text-[7.5px] font-bold rounded transition-colors uppercase ${
                chartType === 'area'
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Impacto Acumulado
            </button>
            <button
              id="btn-consumption-line-chart"
              onClick={() => { playClickSfx(); setChartType('line'); }}
              className={`px-1.5 py-0.5 font-mono text-[7.5px] font-bold rounded transition-colors uppercase ${
                chartType === 'line'
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Consumo Histórico
            </button>
            <button
              id="btn-correlation-chart"
              onClick={() => { playClickSfx(); setChartType('correlation'); }}
              className={`px-1.5 py-0.5 font-mono text-[7.5px] font-bold rounded transition-colors uppercase flex items-center gap-0.5 ${
                chartType === 'correlation'
                  ? 'bg-[#4285F4] text-white shadow-[0_0_8px_rgba(66,133,244,0.4)]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="w-1 h-1 rounded-full bg-[#34A853]" />
              Correlação DREX
            </button>
            <button
              id="btn-purity-trend-chart"
              onClick={() => { playClickSfx(); setChartType('purity'); }}
              className={`px-1.5 py-0.5 font-mono text-[7.5px] font-bold rounded transition-colors uppercase flex items-center gap-0.5 ${
                chartType === 'purity'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="w-1 h-1 rounded-full bg-[#06b6d4] animate-pulse" />
              Pureza Real-Time
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart
                data={dynamicChartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorTrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorCrystal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f1e36" vertical={false} />
                <XAxis 
                  dataKey="year" 
                  stroke="#475569" 
                  fontSize={8} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v === 0 ? 'Início' : `${v}a`}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={8}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 'auto']}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#1e293b', strokeWidth: 1 }} />
                <Legend 
                  verticalAlign="top" 
                  height={32} 
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase' }}
                />
                {metricView === 'energy' ? (
                  <>
                    <Area 
                      type="monotone" 
                      name="Datacenter Tradicional" 
                      dataKey="traditionalEnergy" 
                      stroke="#ef4444" 
                      fillOpacity={1} 
                      fill="url(#colorTrad)" 
                      strokeWidth={1.5}
                    />
                    <Area 
                      type="monotone" 
                      name="Cristal de Quartzo 5D" 
                      dataKey="crystalEnergy" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorCrystal)" 
                      strokeWidth={2}
                    />
                  </>
                ) : (
                  <>
                    <Area 
                      type="monotone" 
                      name="Datacenter Tradicional" 
                      dataKey="traditionalCarbon" 
                      stroke="#f97316" 
                      fillOpacity={1} 
                      fill="url(#colorTrad)" 
                      strokeWidth={1.5}
                    />
                    <Area 
                      type="monotone" 
                      name="Cristal de Quartzo 5D" 
                      dataKey="crystalCarbon" 
                      stroke="#06b6d4" 
                      fillOpacity={1} 
                      fill="url(#colorCrystal)" 
                      strokeWidth={2}
                    />
                  </>
                )}
              </AreaChart>
            ) : chartType === 'line' ? (
              <LineChart
                data={dynamicChartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#0f1e36" vertical={false} />
                <XAxis 
                  dataKey="year" 
                  stroke="#475569" 
                  fontSize={8} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v === 0 ? 'Início' : `${v}a`}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={8}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 'auto']}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#1e293b', strokeWidth: 1 }} />
                <Legend 
                  verticalAlign="top" 
                  height={32} 
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase' }}
                />
                <Line 
                  type="monotone" 
                  name="Armazenamento Magnético" 
                  dataKey="traditionalEnergy" 
                  stroke="#ffe600" 
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#ffe600', stroke: '#070E1B', strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                />
                <Line 
                  type="monotone" 
                  name="Gravação em Quartzo 5D" 
                  dataKey="crystalEnergy" 
                  stroke="#00ff66" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#00ff66', stroke: '#070E1B', strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : chartType === 'correlation' ? (
              <LineChart
                data={correlationData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#0f1e36" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#475569" 
                  fontSize={8} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#4285F4" 
                  fontSize={8}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 1500]}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#34A853" 
                  fontSize={8}
                  tickLine={false}
                  axisLine={false}
                  domain={instabilityActive ? [40, 100] : [90, 100]}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#1e293b', strokeWidth: 1 }} />
                <Legend 
                  verticalAlign="top" 
                  height={32} 
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase' }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  name="Tráfego de Rede DREX" 
                  dataKey="traffic" 
                  stroke="#4285F4" 
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#4285F4', stroke: '#070E1B', strokeWidth: 1 }}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  name="Estabilidade do Processo 5D" 
                  dataKey="stability" 
                  stroke="#34A853" 
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#34A853', stroke: '#070E1B', strokeWidth: 1 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            ) : (
              <LineChart
                data={purityHistory}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#0f1e36" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#475569" 
                  fontSize={8} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#22d3ee" 
                  fontSize={8}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#1e293b', strokeWidth: 1 }} />
                <Legend 
                  verticalAlign="top" 
                  height={32} 
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase' }}
                />
                <Line 
                  type="monotone" 
                  name="Pureza do Cristal (%)" 
                  dataKey="purity" 
                  stroke="#22d3ee" 
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: '#22d3ee', stroke: '#070E1B', strokeWidth: 1 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sub-sistemas de Transmissão */}
      <div className="px-4 py-2.5 border-b border-cyan-950/20 bg-[#040812]/25 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest">Sub-sistemas de Transmissão</span>
          <span className={`text-[7.5px] font-mono uppercase px-1.5 py-0.5 rounded font-bold transition-all ${isBlackout ? 'bg-red-950/60 text-red-400 border border-red-900/30 shadow-[0_0_8px_rgba(239,68,68,0.1)]' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/30 shadow-[0_0_8px_rgba(16,185,129,0.1)]'}`}>
            {isBlackout ? 'Desconectado' : 'Sincronizado'}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex justify-between text-[7px] font-mono text-slate-400">
              <span>Sincronização Ledger</span>
              <span className={`font-bold transition-colors ${isBlackout ? 'text-red-400' : 'text-cyan-400'}`}>{isBlackout ? '0%' : '98.4%'}</span>
            </div>
            <div className="w-full bg-[#03070E] rounded-full h-1 overflow-hidden border border-cyan-950/20">
              <div 
                className={`h-full transition-all duration-1000 bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.4)]`}
                style={{ width: isBlackout ? '0%' : '98.4%', opacity: isBlackout ? 0.1 : 1 }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[7px] font-mono text-slate-400">
              <span>Canal Quantum-Link</span>
              <span className={`font-bold transition-colors ${isBlackout ? 'text-red-400' : 'text-emerald-400'}`}>{isBlackout ? '0%' : '92.1%'}</span>
            </div>
            <div className="w-full bg-[#03070E] rounded-full h-1 overflow-hidden border border-cyan-950/20">
              <div 
                className={`h-full transition-all duration-1000 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]`}
                style={{ width: isBlackout ? '0%' : '92.1%', opacity: isBlackout ? 0.1 : 1 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Simulation State Footer Summary */}
      <div className={`p-3 bg-[#050A14] border-t border-cyan-950/40 space-y-1.5 transition-all duration-1000 ${isBlackout ? 'opacity-30' : 'opacity-100'}`}>
        <div className="flex items-center justify-between text-[8px] font-mono">
          <span className="text-gray-500 uppercase">Estágio de Produção Ativo</span>
          <span className="text-cyan-400 font-bold uppercase">Cena {currentSceneNumber}</span>
        </div>
        <div className="w-full bg-[#03070E] rounded-full h-1 overflow-hidden border border-cyan-950/20">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            style={{ width: isBlackout ? '0%' : `${progressMultiplier * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-1 justify-center text-[8px] font-mono text-emerald-400/90 text-center leading-normal">
          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>Sua simulação reduziu as emissões estimadas em {currentCarbonAvoidedtCO2} tCO₂ até agora.</span>
        </div>
      </div>

      {/* Modal de Comparação de Impacto */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 bg-[#020617]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#070e1b] border border-cyan-500/30 rounded-xl shadow-[0_0_35px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden text-gray-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-cyan-950/50 bg-[#0A162B]">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <div>
                  <h4 className="font-mono text-xs font-bold text-gray-100 uppercase tracking-wider">
                    Resumo Comparativo de Armazenamento
                  </h4>
                  <p className="font-mono text-[8px] text-slate-500 uppercase">
                    Quartzo 5D vs Servidores Físicos (Lote de 500 TB)
                  </p>
                </div>
              </div>
              <button
                onClick={() => { playClickSfx(); setIsCompareModalOpen(false); }}
                className="p-1 hover:bg-slate-900/60 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[80vh] font-sans">
              <p className="text-[10px] text-slate-400 leading-relaxed uppercase">
                Análise baseada em dados reais de consumo e eficiência física para armazenamento a longo prazo de livros, patentes e assinaturas eletrônicas.
              </p>

              {/* Matrix Table */}
              <div className="border border-slate-900 rounded-lg overflow-hidden bg-slate-950 text-[9px] font-mono">
                <div className="grid grid-cols-3 gap-1 px-3 py-2 bg-slate-900 border-b border-slate-900 text-slate-500 font-bold uppercase">
                  <div>Métrica</div>
                  <div>Servidores SSD/HDD</div>
                  <div className="text-cyan-400">Cristal 5D</div>
                </div>

                <div className="grid grid-cols-3 gap-1 px-3 py-2 border-b border-slate-900/60 hover:bg-slate-900/20 items-center">
                  <div className="text-slate-400 font-medium">Manutenção 24/7</div>
                  <div className="text-red-400 font-medium">Ativa (900 MWh)</div>
                  <div className="text-emerald-400 font-bold">Totalmente Passiva (0 MWh)</div>
                </div>

                <div className="grid grid-cols-3 gap-1 px-3 py-2 border-b border-slate-900/60 hover:bg-slate-900/20 items-center">
                  <div className="text-slate-400 font-medium">Refrigeração (PUE)</div>
                  <div className="text-red-400 font-medium">Contínua (~900 MWh)</div>
                  <div className="text-emerald-400 font-bold">Desnecessária (0 MWh)</div>
                </div>

                <div className="grid grid-cols-3 gap-1 px-3 py-2 border-b border-slate-900/60 hover:bg-slate-900/20 items-center">
                  <div className="text-slate-400 font-medium">Troca de Mídia</div>
                  <div className="text-amber-500">A cada 3-5 anos (Degrada)</div>
                  <div className="text-emerald-400 font-bold">Nenhuma (&gt;13B anos)</div>
                </div>

                <div className="grid grid-cols-3 gap-1 px-3 py-2 hover:bg-slate-900/20 items-center">
                  <div className="text-slate-400 font-medium">Consumo Total (20a)</div>
                  <div className="text-red-500 font-bold">~1.800 MWh</div>
                  <div className="text-emerald-400 font-extrabold">0,12 MWh (Escrita)</div>
                </div>
              </div>

              {/* Callout highlights */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-emerald-950/10 border border-emerald-500/20 rounded-lg flex flex-col gap-1">
                  <span className="font-mono text-[8px] text-emerald-500 uppercase font-bold">Eficiência Energética</span>
                  <span className="font-mono text-base text-emerald-400 font-bold leading-none">
                    +99.99%
                  </span>
                  <span className="text-[7.5px] text-slate-500 font-mono uppercase">Menos emissões de calor</span>
                </div>

                <div className="p-2.5 bg-cyan-950/10 border border-cyan-500/20 rounded-lg flex flex-col gap-1">
                  <span className="font-mono text-[8px] text-cyan-500 uppercase font-bold">Redução de Carbono</span>
                  <span className="font-mono text-base text-cyan-400 font-bold leading-none">
                    ~319.95 tCO₂
                  </span>
                  <span className="text-[7.5px] text-slate-500 font-mono uppercase">Pegada neutralizada</span>
                </div>
              </div>

              {/* Detail narrative text */}
              <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-lg font-mono text-[8.5px] text-slate-400 space-y-1.5 leading-relaxed">
                <div className="text-slate-300 font-bold uppercase flex items-center gap-1">
                  <Server className="w-3 h-3 text-cyan-400" />
                  MÉTODOS DE CÁLCULO TRADICIONAIS
                </div>
                <p>
                  Datacenters modernos de alto desempenho necessitam de fornecimento constante de energia para manter discos rígidos mecânicos e memórias magnéticas girando ou energizadas. A dissipação térmica dessas mídias exige um consumo adicional de energia (refrigeração) que frequentemente dobra a pegada do hardware.
                </p>
                <p className="text-cyan-400">
                  Ao contrário disso, o Cristal de Quartzo 5D recebe uma única reestruturação sub-superficial com pulsos laser ultrarápidos de 220 fentosegundos. Uma vez que os voxels são gravados e o padrão de birefringência é gerado, os dados tornam-se indestrutíveis de forma passiva, eliminando servidores de replicação.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#0A162B] border-t border-cyan-950/40 flex justify-end gap-2">
              <button
                onClick={() => { playClickSfx(); setIsCompareModalOpen(false); }}
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-[9px] font-bold uppercase rounded cursor-pointer transition-all shadow-[0_0_8px_rgba(6,182,212,0.2)] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)]"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
