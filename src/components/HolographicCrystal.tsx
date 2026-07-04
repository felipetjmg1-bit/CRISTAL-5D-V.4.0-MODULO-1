import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCw, 
  AlertTriangle, 
  ShieldCheck, 
  ChevronRight, 
  Zap, 
  Activity,
  Award
} from 'lucide-react';
import { playClickSfx } from '../utils/audio';

interface FaultPoint {
  id: string;
  x: number;
  y: number;
  z: number;
  name: string;
  code: string;
  type: 'impurity' | 'fissure' | 'doping' | 'refraction';
  severity: 'low' | 'medium' | 'critical';
  details: string;
  fix: string;
  metric: string;
  resolved?: boolean;
}

interface HolographicCrystalProps {
  instabilityActive: boolean;
  purity: number;
  currentScene: string; // scene ID as string
  onResolveInstability?: () => void;
  onAddToast?: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function HolographicCrystal({ 
  instabilityActive, 
  purity, 
  currentScene,
  onResolveInstability,
  onAddToast
}: HolographicCrystalProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [rotateX, setRotateX] = useState(-22);
  const [rotateY, setRotateY] = useState(45);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [selectedFault, setSelectedFault] = useState<FaultPoint | null>(null);
  const [calibratingId, setCalibratingId] = useState<string | null>(null);
  const [calibProgress, setCalibProgress] = useState(0);

  // Laser scanner sweep oscillation height (-1 to 1)
  const [scanY, setScanY] = useState(0);

  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0 });

  // Baseline simulated fault points in Brazil national colors theme!
  const [localFaults, setLocalFaults] = useState<FaultPoint[]>([
    {
      id: 'fault-1',
      x: 0.22,
      y: -0.32,
      z: 0.15,
      name: "Dispersão Assimétrica de Érbio [Er³⁺]",
      code: "IMP-BR45",
      type: 'doping',
      severity: purity < 95 ? 'critical' : 'medium',
      metric: "Estabilidade: 84.2%",
      details: "Aglomerados iônicos na rede cristalina diminuindo a eficiência da birrefringência induzida no quartzo brasileiro.",
      fix: "Dispare pulso de alta frequência no validador para reorganizar o canal óptico de dopagem."
    },
    {
      id: 'fault-2',
      x: -0.28,
      y: 0.25,
      z: -0.2,
      name: "Tensão Micro-Fissural por Choque Térmico",
      code: "STR-BR102",
      type: 'fissure',
      severity: instabilityActive ? 'critical' : 'low',
      metric: "Estresse: 145 MPa",
      details: "Tensão de gradiente mecânico no caminho óptico do laser devido à flutuação de calor.",
      fix: "Utilize a Recalibragem de Emergência ou ajuste de foco angular para dissipar o estresse térmico."
    },
    {
      id: 'fault-3',
      x: 0.35,
      y: 0.08,
      z: -0.15,
      name: "Desvio de Fase Refratômetro",
      code: "REF-BR404",
      type: 'refraction',
      severity: 'medium',
      metric: "Desvio: -4.51λ",
      details: "Incompatibilidade nanométrica de retardance em canais de silício que distorcem o laser de femtossegundo.",
      fix: "Realinhe o colimador óptico injetando um pulso de correção de fase quântica."
    }
  ]);

  // Handle auto rotation animation
  useEffect(() => {
    if (!isAutoRotating) return;
    let animId: number;
    const tick = () => {
      setRotateY(prev => (prev + 0.7) % 360);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isAutoRotating]);

  // Laser scanner sweep oscillation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setScanY(prev => {
        const next = prev + 0.05;
        return next > Math.PI * 2 ? 0 : next;
      });
    }, 35);
    return () => clearInterval(interval);
  }, []);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY
    };
    setIsAutoRotating(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    setRotateY(prev => (prev + dx * 0.5) % 360);
    setRotateX(prev => Math.max(-80, Math.min(80, prev - dy * 0.5)));

    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
  };

  const handleMouseUpOrLeave = () => {
    dragRef.current.isDragging = false;
  };

  // Perform interactive local recalibration / correction
  const handleFixFault = (fault: FaultPoint) => {
    playClickSfx();
    setCalibratingId(fault.id);
    setCalibProgress(0);

    const interval = setInterval(() => {
      setCalibProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setCalibratingId(null);
          
          // Mark as resolved
          setLocalFaults(prevList => 
            prevList.map(f => f.id === fault.id ? { ...f, resolved: true, severity: 'low' as const } : f)
          );

          if (onAddToast) {
            onAddToast(
              "CORREÇÃO OPERACIONAL",
              `Lattice óptica e desvios de fase em ${fault.code} realinhados para os padrões soberanos da rede DREX.`,
              "success"
            );
          }
          
          setSelectedFault(prevF => prevF ? { ...prevF, resolved: true, severity: 'low' as const } : null);
          return 0;
        }
        return prev + 5;
      });
    }, 30);
  };

  // 3D Math projection helpers for double-pointed hexagonal bipyramid (Quartz crystal model)
  const centerOfViewer = 120;
  const scaleOfCrystal = 95;

  const getHexagonVertices = () => {
    const verts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 * Math.PI) / 180;
      verts.push({
        x: 0.52 * Math.cos(angle),
        y: 0,
        z: 0.52 * Math.sin(angle)
      });
    }
    return verts;
  };

  const vertices = [
    { x: 0, y: -1.0, z: 0 }, // 0: Top pyramid peak
    ...getHexagonVertices(), // 1 to 6: Hexagonal middle ring
    { x: 0, y: 1.0, z: 0 }  // 7: Bottom pyramid peak
  ];

  // Rotates a point around Y (theta) and X (phi) axes
  const rotatePoint = (x: number, y: number, z: number) => {
    const radY = (rotateY * Math.PI) / 180;
    const radX = (rotateX * Math.PI) / 180;

    // Rotate Y
    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);
    let x1 = x * cosY - z * sinY;
    let z1 = x * sinY + z * cosY;

    // Rotate X
    const cosX = Math.cos(radX);
    const sinX = Math.sin(radX);
    let y2 = y * cosX - z1 * sinX;
    let z2 = y * sinX + z1 * cosX;

    return {
      sx: centerOfViewer + x1 * scaleOfCrystal,
      sy: centerOfViewer + y2 * scaleOfCrystal,
      sz: z2
    };
  };

  const projectedVertices = vertices.map(v => rotatePoint(v.x, v.y, v.z));

  // Connections/Edges between crystal vertices
  const edges = [
    // Top pyramid edges
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
    // Middle ring edges
    [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1],
    // Bottom pyramid edges
    [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]
  ];

  // Laser scanner sweep oscillation height mapped to pixels
  const currentScanLineY = centerOfViewer + Math.sin(scanY) * 90;

  return (
    <div className="mt-4 border border-emerald-900/40 rounded-lg overflow-hidden bg-[#03060c]/90 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
      <button
        type="button"
        onClick={() => { playClickSfx(); setIsOpen(!isOpen); }}
        className="w-full flex items-center justify-between p-3 bg-[#040c17] border-b border-emerald-950/40 hover:bg-[#071526] transition-colors"
      >
        <div className="flex items-center gap-2">
          {/* Brazil patriotic micro-shield glow indicator */}
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </div>
          <span className="font-mono text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
            Visualizador Holográfico 3D
            <span className="text-[7.5px] text-yellow-400 font-semibold px-1 rounded bg-emerald-950 border border-emerald-500/20">BR-AURORA</span>
          </span>
        </div>
        <span className="font-mono text-[8px] text-slate-500 uppercase">
          {isOpen ? '[ RECOLHER ]' : '[ DETALHAR ]'}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <p className="font-sans text-[10px] text-slate-300 leading-normal font-light">
                  Inspeção cristalográfica por ressonância eletromagnética de alta frequência. Arraste para girar a bipyramide quântica do quartzo e recalibrar anomalias de fase.
                </p>
                <div className="flex items-center gap-1 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                  <Award className="w-3 h-3 text-yellow-400" />
                  <span className="font-mono text-[7px] text-slate-300 font-bold">SOBERANIA BR</span>
                </div>
              </div>

              {/* Holographic 3D Viewport in Brazil Flag Palette: Emerald Green wireframe, Yellow scanner laser, Deep Blue center glows */}
              <div className="relative flex items-center justify-center bg-[#010204] border border-emerald-500/20 rounded-xl overflow-hidden shadow-[inset_0_0_25px_rgba(16,185,129,0.18)] select-none">
                
                {/* HUD Overlay rings (Patriotic Green and Yellow accents) */}
                <div className="absolute inset-0 border border-emerald-500/5 rounded-full [transform:rotateX(60deg)_scale(0.85)] animate-pulse pointer-events-none" />
                <div className="absolute inset-0 border border-dashed border-yellow-400/5 rounded-full [transform:rotateX(75deg)_scale(0.7)] animate-[spin_35s_linear_infinite] pointer-events-none" />

                {/* Laser scan lines (Golden yellow color of Brazil) */}
                <div 
                  className="absolute left-0 w-full h-[1.5px] bg-yellow-400/90 shadow-[0_0_12px_#f59e0b] pointer-events-none z-10"
                  style={{ top: `${currentScanLineY}px` }}
                />

                {/* Dynamic Calibration Beam overlay when active */}
                {calibratingId && selectedFault && (
                  <div className="absolute inset-0 pointer-events-none z-25">
                    <svg className="w-full h-full">
                      {/* Laser beam focusing on the selected point */}
                      <line
                        x1={centerOfViewer}
                        y1="0"
                        x2={rotatePoint(selectedFault.x, selectedFault.y, selectedFault.z).sx}
                        y2={rotatePoint(selectedFault.x, selectedFault.y, selectedFault.z).sy}
                        stroke="#00f0ff"
                        strokeWidth="3"
                        strokeDasharray="4 2"
                        className="animate-pulse"
                        style={{ filter: 'drop-shadow(0 0 8px rgba(0,240,255,0.9))' }}
                      />
                    </svg>
                  </div>
                )}

                {/* SVG Visualizer Canvas */}
                <svg
                  width={centerOfViewer * 2}
                  height={centerOfViewer * 2}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                  className="cursor-grab active:cursor-grabbing z-10"
                >
                  {/* Outer orbit boundary rings (Deep blue of Brazilian Flag) */}
                  <circle cx={centerOfViewer} cy={centerOfViewer} r={scaleOfCrystal * 1.25} fill="none" stroke="rgba(59, 130, 246, 0.05)" strokeWidth="1.2" strokeDasharray="4 4" />
                  <circle cx={centerOfViewer} cy={centerOfViewer} r={scaleOfCrystal * 0.8} fill="none" stroke="rgba(16, 185, 129, 0.04)" strokeWidth="1" />
                  
                  {/* Grid layout crosshair lines */}
                  <line x1={centerOfViewer} y1={12} x2={centerOfViewer} y2={centerOfViewer*2-12} stroke="rgba(16, 185, 129, 0.03)" strokeWidth="1" strokeDasharray="3 4" />
                  <line x1={12} y1={centerOfViewer} x2={centerOfViewer*2-12} y2={centerOfViewer} stroke="rgba(16, 185, 129, 0.03)" strokeWidth="1" strokeDasharray="3 4" />

                  {/* Wireframe edges (Emerald Green) */}
                  {edges.map((edge, idx) => {
                    const p1 = projectedVertices[edge[0]];
                    const p2 = projectedVertices[edge[1]];
                    const isBackEdge = (p1.sz + p2.sz) > 0.08; // depth simulation

                    return (
                      <line
                        key={`edge-${idx}`}
                        x1={p1.sx}
                        y1={p1.sy}
                        x2={p2.sx}
                        y2={p2.sy}
                        stroke={isBackEdge ? "rgba(16, 185, 129, 0.12)" : "#10b981"} // High-contrast emerald green
                        strokeWidth={isBackEdge ? 0.9 : 1.4}
                        strokeDasharray={isBackEdge ? "2 3" : undefined}
                        style={!isBackEdge ? { filter: 'drop-shadow(0 0 2px rgba(16,185,129,0.35))' } : undefined}
                      />
                    );
                  })}

                  {/* Vertices Nodes (Yellow gold of Brazil) */}
                  {projectedVertices.map((p, idx) => (
                    <circle
                      key={`vert-${idx}`}
                      cx={p.sx}
                      cy={p.sy}
                      r={idx === 0 || idx === 7 ? 3.5 : 2.5}
                      fill="#eab308" // Gold Yellow color
                      opacity={p.sz > 0.25 ? 0.35 : 0.9}
                      style={{ filter: 'drop-shadow(0 0 3px #eab308)' }}
                    />
                  ))}

                  {/* Interactive Fault Points layer */}
                  {localFaults.map((fault) => {
                    const p = rotatePoint(fault.x, fault.y, fault.z);
                    const isSelected = selectedFault?.id === fault.id;
                    const isSolved = fault.resolved;

                    // Fault color state
                    let color = "#ef4444"; // Red for critical/unsolved
                    if (isSolved) {
                      color = "#10b981"; // Emerald Green for resolved
                    } else if (fault.severity === 'medium') {
                      color = "#f59e0b"; // Golden Amber for warnings
                    } else if (fault.severity === 'low') {
                      color = "#3b82f6"; // Ocean Blue for low warning
                    }

                    return (
                      <g key={fault.id} className="cursor-pointer group" onClick={(e) => {
                        e.stopPropagation();
                        playClickSfx();
                        setSelectedFault(isSelected ? null : fault);
                      }}>
                        {/* Interactive touch expansion */}
                        <circle cx={p.sx} cy={p.sy} r={16} fill="transparent" />

                        {/* Outer pulsing ring */}
                        {!isSolved && (
                          <circle
                            cx={p.sx}
                            cy={p.sy}
                            r={isSelected ? 11 : 7.5}
                            fill="none"
                            stroke={color}
                            strokeWidth="1.5"
                            className="animate-pulse"
                            opacity="0.8"
                          />
                        )}

                        {/* Central fault marker */}
                        <circle
                          cx={p.sx}
                          cy={p.sy}
                          r={isSelected ? 5.5 : 4}
                          fill={color}
                          style={{ filter: `drop-shadow(0 0 5px ${color})` }}
                          className="transition-transform group-hover:scale-125"
                        />

                        {/* Code label on hover */}
                        <text
                          x={p.sx + 8}
                          y={p.sy + 2.5}
                          fill="#ffffff"
                          fontSize="7.5"
                          fontFamily="monospace"
                          className="opacity-0 group-hover:opacity-100 font-bold select-none transition-opacity duration-200 pointer-events-none fill-white"
                        >
                          {fault.code}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Left side telemetry coordinates and stats overlay (White & cyan) */}
                <div className="absolute top-2.5 left-2.5 font-mono text-[7px] text-slate-300 leading-normal pointer-events-none z-20">
                  <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <span className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                    <span>LATTICE: SiO2_SOL_AURORA_SOBERANO</span>
                  </div>
                  <div>AZIMUTH: {rotateY.toFixed(1)}°</div>
                  <div>ELEVATION: {rotateX.toFixed(1)}°</div>
                  <div>FALHAS ATIVAS: {localFaults.filter(f => !f.resolved).length}</div>
                </div>

                {/* Rotation controls on bottom right */}
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 bg-slate-950/90 border border-emerald-950/40 rounded p-1 z-25">
                  <button
                    type="button"
                    onClick={() => { playClickSfx(); setIsAutoRotating(!isAutoRotating); }}
                    className={`p-1 rounded transition-colors ${
                      isAutoRotating ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title={isAutoRotating ? 'Pausar Rotação' : 'Girar Automaticamente'}
                  >
                    {isAutoRotating ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { playClickSfx(); setRotateX(-22); setRotateY(45); }}
                    className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                    title="Resetar Orientação"
                  >
                    <RotateCw className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              {/* Anomaly inspection detail card */}
              <AnimatePresence mode="wait">
                {selectedFault ? (
                  <motion.div
                    key={selectedFault.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-3 bg-[#0a0712] border border-red-950/40 rounded-lg flex flex-col gap-2.5 shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-4 border-b border-red-950/20 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className={`w-3.5 h-3.5 ${selectedFault.resolved ? 'text-emerald-400' : 'text-yellow-500 animate-pulse'}`} />
                        <span className="font-mono text-[9px] font-bold text-slate-100 uppercase tracking-wider">
                          Anomalia {selectedFault.code}
                        </span>
                      </div>
                      <span className={`font-mono text-[7px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        selectedFault.resolved 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' 
                          : selectedFault.severity === 'critical'
                          ? 'bg-red-950 text-red-400 border border-red-500/20 animate-pulse'
                          : 'bg-yellow-950 text-yellow-400 border border-yellow-500/20'
                      }`}>
                        {selectedFault.resolved ? 'CORRIGIDO' : selectedFault.severity}
                      </span>
                    </div>

                    <div>
                      <p className="font-sans text-[10.5px] font-bold text-slate-100">
                        {selectedFault.name}
                      </p>
                      <p className="font-sans text-[9.5px] text-slate-400 leading-relaxed mt-1 font-light">
                        {selectedFault.details}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-[#020306] p-2 rounded border border-slate-900 font-mono text-[8px]">
                      <div>
                        <span className="text-slate-500 block text-[7px]">COORDENADAS 3D</span>
                        <span className="text-slate-300 font-bold">
                          X:{selectedFault.x.toFixed(2)} Y:{selectedFault.y.toFixed(2)} Z:{selectedFault.z.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[7px]">MÉTRICA DE FASE</span>
                        <span className="text-slate-300 font-bold">{selectedFault.metric}</span>
                      </div>
                    </div>

                    {/* Correction / Recalibration Action Button */}
                    {!selectedFault.resolved ? (
                      <button
                        onClick={() => handleFixFault(selectedFault)}
                        disabled={calibratingId !== null}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-900 text-white disabled:text-slate-500 font-bold font-mono text-[8.5px] uppercase tracking-widest rounded transition-all flex items-center justify-center gap-1.5 relative overflow-hidden active:scale-95 cursor-pointer"
                      >
                        {calibratingId === selectedFault.id ? (
                          <>
                            <Activity className="w-3 h-3 animate-spin" />
                            <span>CALIBRANDO LASER... {calibProgress}%</span>
                            <div 
                              className="absolute bottom-0 left-0 h-[2px] bg-yellow-400 transition-all duration-300"
                              style={{ width: `${calibProgress}%` }}
                            />
                          </>
                        ) : (
                          <>
                            <Zap className="w-3 h-3 text-yellow-300 animate-bounce" />
                            <span>CALIBRAR POR IMPULSO LASER</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="py-2 bg-emerald-950/40 border border-emerald-900/30 rounded text-emerald-400 font-bold font-mono text-[8.5px] uppercase tracking-widest flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>SINAL ESTABILIZADO COM SUCESSO</span>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="p-3.5 bg-[#03060c]/30 border border-slate-900/40 rounded-lg flex items-center justify-center gap-3 min-h-[75px]">
                    <ShieldCheck className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                    <p className="font-sans text-[9.5px] text-slate-500 font-light text-left leading-normal">
                      Selecione um ponto de anomalia pulsante no holograma 3D acima para recalibrar o feixe óptico e restabelecer a integridade cristalográfica.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
