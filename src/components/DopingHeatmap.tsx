import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Thermometer, Flame, ShieldAlert, Cpu, Sparkles, AlertTriangle, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { StorageScene, SimulationState } from '../types';

interface DopingHeatmapProps {
  state: SimulationState;
  playClickSfx: () => void;
  handleUpdateSimState: (updates: Partial<SimulationState>) => void;
}

export default function DopingHeatmap({ state, playClickSfx, handleUpdateSimState }: DopingHeatmapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'temperature' | 'erbium' | 'lithium'>('temperature');
  const [tick, setTick] = useState(0);

  // High-frequency tick for heatmap animation / noise
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Dimensions
  const width = 280;
  const height = 200;
  const gridRows = 9;
  const gridCols = 9;

  // Base state statistics
  const baseThermalProfile = useMemo(() => {
    const scene = state.currentScene;
    const progress = state.playProgress;
    const isInstability = state.instabilityActive;

    let baseTemp = 18.0; // Room temp in Celsius
    let maxTemp = 20.0;
    let name = "Dormiente / Estável";

    if (scene === StorageScene.RAW_SOURCE) {
      baseTemp = 18.0;
      maxTemp = 21.0;
      name = "Estabilização de Quartzo Bruto";
    } else if (scene === StorageScene.MINING_PURITY) {
      baseTemp = 350 + progress * 2.5; // Rises to 600°C
      maxTemp = baseTemp + 45;
      name = "Processamento Químico de Pureza";
    } else if (scene === StorageScene.ELEMENT_INJECTION) {
      // In element injection (fusing Er + LiNbO3), laser temperature reaches up to 980°C
      baseTemp = 18 + progress * 9.5; // Rises to ~968°C
      maxTemp = baseTemp + 120;
      name = "Injeção Ativa de Dopantes";
    } else if (scene === StorageScene.FIVE_D_ENCODING) {
      // Laser localized energy focus
      baseTemp = 120 + Math.sin(tick * 0.1) * 5;
      maxTemp = 420 + Math.cos(tick * 0.1) * 15;
      name = "Escrita de Dados em Escala Nanométrica";
    } else if (scene === StorageScene.FINAL_PRODUCT) {
      // Cooling phase
      baseTemp = Math.max(22.0, 950 - progress * 15);
      maxTemp = baseTemp + 8;
      name = "Resfriamento Crítico do Vidro";
    }

    // Apply instability offset
    if (isInstability) {
      baseTemp += state.instabilitySeverity * 4.5;
      maxTemp += state.instabilitySeverity * 8.2;
      name = "🚨 INSTABILIDADE TÉRMICA DETECTADA";
    }

    return { baseTemp, maxTemp, name };
  }, [state.currentScene, state.playProgress, state.instabilityActive, state.instabilitySeverity, tick]);

  // Compute cell grid values using D3 mapping
  const gridData = useMemo(() => {
    const data: Array<{ row: number; col: number; temp: number; erbium: number; lithium: number }> = [];
    const centerRow = (gridRows - 1) / 2;
    const centerCol = (gridCols - 1) / 2;

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        // Distance from center of crystal wafer
        const dist = Math.sqrt(Math.pow(r - centerRow, 2) + Math.pow(c - centerCol, 2));
        const maxDist = Math.sqrt(Math.pow(centerRow, 2) + Math.pow(centerCol, 2));

        // Wafer edge mask (circular disk)
        const isOutsideWafer = dist > (centerRow + 0.5);

        // Calculate metrics
        let temp = baseThermalProfile.baseTemp;
        let erbium = 0;
        let lithium = 0;

        if (!isOutsideWafer) {
          // Heat source model: laser focused at center, dissipating to edges
          const laserProgress = (state.playProgress / 100) * Math.PI * 2;
          const focusRow = centerRow + Math.sin(laserProgress + tick * 0.05) * (centerRow * 0.5);
          const focusCol = centerCol + Math.cos(laserProgress + tick * 0.05) * (centerCol * 0.5);
          
          const distToLaser = Math.sqrt(Math.pow(r - focusRow, 2) + Math.pow(c - focusCol, 2));
          
          // Temperature formula
          const baseHeat = baseThermalProfile.baseTemp * (1 - (dist / maxDist) * 0.3);
          const localizedLaserHeat = (state.currentScene === StorageScene.ELEMENT_INJECTION || state.currentScene === StorageScene.FIVE_D_ENCODING)
            ? (Math.max(0, 1.2 - distToLaser * 0.4) * (baseThermalProfile.maxTemp - baseThermalProfile.baseTemp))
            : 0;

          temp = baseHeat + localizedLaserHeat;

          // Dopant concentration simulations
          if (state.currentScene === StorageScene.ELEMENT_INJECTION) {
            // Erbium: centered injection
            erbium = Math.max(0, (state.erbiumLevel / 100) * 0.42 * (1 - (dist / (centerRow + 1))));
            // Lithium: spiral distribution
            lithium = Math.max(0, (state.lithiumLevel / 100) * 1.15 * (1 - (Math.abs(dist - (centerRow * 0.45)) / centerRow)));
          } else if (state.currentScene === StorageScene.FIVE_D_ENCODING || state.currentScene === StorageScene.FINAL_PRODUCT) {
            erbium = 0.42 * (1 - (dist / (centerRow + 1)));
            lithium = 1.15 * (1 - (Math.abs(dist - (centerRow * 0.45)) / centerRow));
          }

          // Add jitter if instability is active
          if (state.instabilityActive) {
            const noise = (Math.sin(r * 1.5 + tick * 0.8) * Math.cos(c * 2.2 + tick * 0.4)) * (state.instabilitySeverity * 4);
            temp = Math.max(18, temp + noise);
            erbium = Math.max(0, erbium + (Math.sin(tick * 0.5) * 0.04));
            lithium = Math.max(0, lithium + (Math.cos(tick * 0.5) * 0.08));
          }
        } else {
          // Cold vacuum ambient temp around the spinning stage
          temp = 18.0 + (Math.sin(tick * 0.1) * 0.5);
        }

        data.push({
          row: r,
          col: c,
          temp: parseFloat(temp.toFixed(1)),
          erbium: parseFloat(Math.max(0, erbium).toFixed(4)),
          lithium: parseFloat(Math.max(0, lithium).toFixed(4))
        });
      }
    }
    return data;
  }, [baseThermalProfile, state.playProgress, state.currentScene, state.erbiumLevel, state.lithiumLevel, state.instabilityActive, state.instabilitySeverity, tick]);

  // Draw the D3 Heatmap
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clean canvas

    const margin = { top: 12, right: 12, bottom: 12, left: 12 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // D3 Scales for positioning cells
    const xScale = d3.scaleBand<number>()
      .domain(d3.range(gridCols))
      .range([0, plotWidth])
      .padding(0.08);

    const yScale = d3.scaleBand<number>()
      .domain(d3.range(gridRows))
      .range([0, plotHeight])
      .padding(0.08);

    // D3 Color Scales based on selected metric
    let colorScale: (value: number) => string;

    if (selectedMetric === 'temperature') {
      // Dark slate/blue to bright intense yellow/red for temperatures
      colorScale = d3.scaleSequential<string>()
        .domain([18, Math.max(120, baseThermalProfile.maxTemp)])
        .interpolator(state.instabilityActive ? d3.interpolateInferno : d3.interpolatePlasma);
    } else if (selectedMetric === 'erbium') {
      // Cyan to light sky blue for Erbium
      colorScale = d3.scaleSequential<string>()
        .domain([0, 0.45])
        .interpolator(d3.interpolateCool);
    } else {
      // Purple to Amber for Lithium Niobate
      colorScale = d3.scaleSequential<string>()
        .domain([0, 1.25])
        .interpolator(d3.interpolateWarm);
    }

    // Render cells using classic D3 select-enter-append cycle
    g.selectAll(".heatmap-cell")
      .data(gridData)
      .enter()
      .append("rect")
      .attr("class", "heatmap-cell")
      .attr("x", (d: any) => xScale(d.col) ?? 0)
      .attr("y", (d: any) => yScale(d.row) ?? 0)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("rx", 2)
      .attr("ry", 2)
      .style("fill", (d: any) => {
        const val = selectedMetric === 'temperature' ? d.temp : selectedMetric === 'erbium' ? d.erbium : d.lithium;
        return colorScale(val);
      })
      .style("stroke", (d: any) => {
        // Highlight active localized hot spots or instability peaks
        if (state.instabilityActive && selectedMetric === 'temperature' && d.temp > baseThermalProfile.baseTemp * 1.4) {
          return "rgba(239, 68, 68, 0.8)";
        }
        return "transparent";
      })
      .style("stroke-width", "1px")
      .style("opacity", (d: any) => {
        // Create circular shape mask for the crystal disc
        const center = (gridRows - 1) / 2;
        const dist = Math.sqrt(Math.pow(d.row - center, 2) + Math.pow(d.col - center, 2));
        if (dist > (center + 0.5)) {
          return 0.12; // Outer mounting socket/stage (faded)
        }
        return 0.95; // Active wafer body
      });

    // Add crosshair lines on laser focused spot if in ELEMENT_INJECTION or 5D_ENCODING
    if (state.currentScene === StorageScene.ELEMENT_INJECTION || state.currentScene === StorageScene.FIVE_D_ENCODING) {
      const laserProgress = (state.playProgress / 100) * Math.PI * 2;
      const centerRow = (gridRows - 1) / 2;
      const focusRow = centerRow + Math.sin(laserProgress + tick * 0.05) * (centerRow * 0.5);
      const focusCol = centerRow + Math.cos(laserProgress + tick * 0.05) * (centerRow * 0.5);

      const laserX = (xScale(Math.round(focusCol)) ?? 0) + xScale.bandwidth() / 2;
      const laserY = (yScale(Math.round(focusRow)) ?? 0) + yScale.bandwidth() / 2;

      // Laser coordinate marker
      g.append("circle")
        .attr("cx", laserX)
        .attr("cy", laserY)
        .attr("r", 10 + Math.sin(tick * 0.5) * 3)
        .style("fill", "none")
        .style("stroke", state.instabilityActive ? "rgba(239, 68, 68, 0.8)" : "rgba(34, 211, 238, 0.7)")
        .style("stroke-width", "1.5px")
        .style("stroke-dasharray", "2,2")
        .style("filter", "drop-shadow(0 0 4px rgba(6,182,212,0.5))");
    }

  }, [gridData, selectedMetric, baseThermalProfile, state.instabilityActive, state.currentScene, state.playProgress, tick]);

  // Calculate quick live telemetry metrics
  const activeStats = useMemo(() => {
    const validCells = gridData.filter(d => {
      const center = (gridRows - 1) / 2;
      const dist = Math.sqrt(Math.pow(d.row - center, 2) + Math.pow(d.col - center, 2));
      return dist <= (center + 0.5);
    });

    const temps = validCells.map(c => c.temp);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    
    // Homogeneity coefficient
    const tempRange = maxTemp - minTemp;
    const homogeneity = tempRange === 0 ? 100 : Math.max(10, 100 - (tempRange / maxTemp) * 100);

    return {
      avg: avgTemp.toFixed(1),
      max: maxTemp.toFixed(1),
      min: minTemp.toFixed(1),
      homogeneity: homogeneity.toFixed(1)
    };
  }, [gridData]);

  const handleMetricToggle = (metric: 'temperature' | 'erbium' | 'lithium') => {
    playClickSfx();
    setSelectedMetric(metric);
  };

  return (
    <div className="bg-[#0a0d14]/60 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-3 h-full overflow-y-auto">
      
      {/* Title & Core Concept Label */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-[9px] font-bold text-slate-200 tracking-wider">
            TERMOGRAFIA E DOPAGEM
          </span>
        </div>
        <span className="text-[8px] font-mono text-cyan-500 font-bold bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.5 rounded uppercase">
          D3.js Grid
        </span>
      </div>

      {/* Description */}
      <p className="font-sans text-[10px] text-slate-400 leading-normal">
        Distribuição espacial em tempo real do disco de quartzo. Os dopantes de <strong className="text-cyan-300">Érbio (Er)</strong> e <strong className="text-purple-300">Niobato de Lítio (LiNbO3)</strong> são injetados sob focos térmicos controlados de laser.
      </p>

      {/* Selector Tabs */}
      <div className="grid grid-cols-3 bg-[#05070a] border border-slate-800 rounded p-0.5 shrink-0">
        <button
          onClick={() => handleMetricToggle('temperature')}
          className={`py-1 font-mono text-[8px] font-bold text-center uppercase tracking-wider rounded transition-all ${
            selectedMetric === 'temperature'
              ? 'bg-[#0a0d14] text-cyan-400 border border-slate-800'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Térmica (°C)
        </button>
        <button
          onClick={() => handleMetricToggle('erbium')}
          className={`py-1 font-mono text-[8px] font-bold text-center uppercase tracking-wider rounded transition-all ${
            selectedMetric === 'erbium'
              ? 'bg-[#0a0d14] text-cyan-400 border border-slate-800'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Érbio (mol%)
        </button>
        <button
          onClick={() => handleMetricToggle('lithium')}
          className={`py-1 font-mono text-[8px] font-bold text-center uppercase tracking-wider rounded transition-all ${
            selectedMetric === 'lithium'
              ? 'bg-[#0a0d14] text-cyan-400 border border-slate-800'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Niobato (mol%)
        </button>
      </div>

      {/* Heatmap Visual Canvas */}
      <div className="relative bg-[#05080f] rounded-lg border border-slate-800/60 p-1 flex items-center justify-center shrink-0">
        
        {/* Crystal disk orientation background guide */}
        <div className="absolute inset-0 border border-cyan-500/5 rounded-full pointer-events-none scale-90" />
        <div className="absolute inset-0 border border-cyan-500/3 rounded-full pointer-events-none scale-75" />
        
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="max-w-full transition-all duration-300"
        />

        {/* Instability overlay border */}
        {state.instabilityActive && (
          <div className="absolute inset-0 border border-red-500/30 rounded-lg pointer-events-none animate-pulse flex items-center justify-center">
            <div className="bg-red-950/80 px-2 py-1 rounded border border-red-500/40 shadow-lg flex items-center gap-1.5 animate-bounce">
              <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />
              <span className="text-[7.5px] font-mono text-red-200 font-bold tracking-widest uppercase">Flutuação Térmica</span>
            </div>
          </div>
        )}
      </div>

      {/* Thermographic Telemetry Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-[9px]">
        
        <div className="p-2 bg-[#05070a] border border-slate-800 rounded">
          <div className="text-slate-500 uppercase font-mono tracking-wider">Temperatura Máxima</div>
          <div className={`text-xs font-mono font-bold mt-0.5 ${parseFloat(activeStats.max) > 900 ? 'text-red-400' : 'text-slate-100'}`}>
            {activeStats.max}°C
          </div>
        </div>

        <div className="p-2 bg-[#05070a] border border-slate-800 rounded">
          <div className="text-slate-500 uppercase font-mono tracking-wider">Homogeneidade</div>
          <div className="text-xs font-mono font-bold mt-0.5 text-cyan-400">
            {activeStats.homogeneity}%
          </div>
        </div>

        <div className="p-2 bg-[#05070a] border border-slate-800 rounded">
          <div className="text-slate-500 uppercase font-mono tracking-wider">Gradiente Térmico</div>
          <div className="text-xs font-mono font-bold mt-0.5 text-slate-300">
            {(parseFloat(activeStats.max) - parseFloat(activeStats.min)).toFixed(1)}°C / mm
          </div>
        </div>

        <div className="p-2 bg-[#05070a] border border-slate-800 rounded">
          <div className="text-slate-500 uppercase font-mono tracking-wider">Status Wafer</div>
          <div className="text-xs font-mono font-bold mt-0.5 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${
              state.instabilityActive 
                ? 'bg-red-500 animate-ping' 
                : state.currentScene === StorageScene.ELEMENT_INJECTION 
                ? 'bg-amber-400 animate-pulse'
                : 'bg-emerald-400'
            }`} />
            <span className={state.instabilityActive ? 'text-red-400 font-bold' : 'text-slate-300'}>
              {state.instabilityActive ? 'Instável' : state.currentScene === StorageScene.ELEMENT_INJECTION ? 'Injetando' : 'Nominal'}
            </span>
          </div>
        </div>

      </div>

      {/* Controle de Dopagem Manual */}
      <div id="manual-doping-controls" className="p-3 bg-[#05070a]/80 border border-slate-800 rounded-lg flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-yellow-400" />
          <span className="font-mono text-[9px] font-bold text-slate-200 tracking-wider">
            CONTROLE DE DOPAGEM MANUAL
          </span>
        </div>

        {/* Erbium Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[8.5px] font-mono">
            <span className="text-slate-400">Concentração de Érbio (Er³⁺)</span>
            <span className="text-cyan-400 font-bold">
              {(state.erbiumLevel * 0.0042).toFixed(4)} mol%
            </span>
          </div>
          
          <input
            id="slider-erbium-level"
            type="range"
            min="0"
            max="100"
            value={state.erbiumLevel}
            onChange={(e) => {
              playClickSfx();
              handleUpdateSimState({ erbiumLevel: parseInt(e.target.value) });
            }}
            className="w-full accent-cyan-400 h-1 bg-slate-950 rounded cursor-pointer"
          />

          {/* Animated Progress Bar */}
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden relative border border-slate-900/60">
            <motion.div
              key={`erbium-bar-${state.erbiumLevel}`}
              initial={{ scaleX: 0.9, opacity: 0.7 }}
              animate={{ 
                width: `${state.erbiumLevel}%`,
                scaleX: 1,
                scaleY: [1, 1.35, 1],
                opacity: 1
              }}
              transition={{ 
                type: 'spring', 
                stiffness: 120, 
                damping: 12,
                opacity: { duration: 0.15 }
              }}
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full origin-left shadow-[0_0_8px_rgba(6,182,212,0.6)]"
            />
          </div>
        </div>

        {/* Lithium Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[8.5px] font-mono">
            <span className="text-slate-400">Niobato de Lítio (LiNbO₃)</span>
            <span className="text-purple-400 font-bold">
              {(state.lithiumLevel * 0.0115).toFixed(4)} mol%
            </span>
          </div>

          <input
            id="slider-lithium-level"
            type="range"
            min="0"
            max="100"
            value={state.lithiumLevel}
            onChange={(e) => {
              playClickSfx();
              handleUpdateSimState({ lithiumLevel: parseInt(e.target.value) });
            }}
            className="w-full accent-purple-400 h-1 bg-slate-950 rounded cursor-pointer"
          />

          {/* Animated Progress Bar */}
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden relative border border-slate-900/60">
            <motion.div
              key={`lithium-bar-${state.lithiumLevel}`}
              initial={{ scaleX: 0.9, opacity: 0.7 }}
              animate={{ 
                width: `${state.lithiumLevel}%`,
                scaleX: 1,
                scaleY: [1, 1.35, 1],
                opacity: 1
              }}
              transition={{ 
                type: 'spring', 
                stiffness: 120, 
                damping: 12,
                opacity: { duration: 0.15 }
              }}
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full origin-left shadow-[0_0_8px_rgba(168,85,247,0.6)]"
            />
          </div>
        </div>
      </div>

      {/* Sub-note */}
      <div className="flex items-start gap-1.5 bg-slate-950/40 border border-slate-800 p-2 rounded">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <span className="text-[8.5px] text-slate-500 leading-normal font-sans">
          Durante a fase <strong className="text-slate-400">03: Injeção</strong>, certifique-se de que os níveis de dopagem permaneçam homogêneos para evitar trincas induzidas por gradientes de temperatura extremos no silicato de quartzo.
        </span>
      </div>

    </div>
  );
}
