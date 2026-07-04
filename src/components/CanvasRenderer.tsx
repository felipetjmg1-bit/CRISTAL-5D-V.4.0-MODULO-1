import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StorageScene, SimulationState, Voxel5D } from '../types';
import { SCENES_DATA } from '../data/scenesData';

interface CanvasRendererProps {
  state: SimulationState;
  voxels: Voxel5D[];
  onInteract?: (action: string, data?: any) => void;
}

export default function CanvasRenderer({ state, voxels, onInteract }: CanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 400 });
  const [hoveredVoxel, setHoveredVoxel] = useState<Voxel5D | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, isDown: false });

  // Scene 1: Raw Quartz interactive nodes
  const [inclusions, setInclusions] = useState<Array<{ x: number; y: number; z: number; scanned: boolean; id: number }>>([
    { id: 1, x: -0.2, y: 0.3, z: 0.1, scanned: false },
    { id: 2, x: 0.3, y: -0.2, z: -0.3, scanned: false },
    { id: 3, x: 0.1, y: 0.1, z: 0.4, scanned: false },
  ]);

  // Scene 2: Slicing state and bath bubbles
  const bubblesRef = useRef<Array<{ x: number; y: number; r: number; speed: number; alpha: number }>>([]);

  // Scene 3: Injection ripples
  const ripplesRef = useRef<Array<{ radius: number; maxRadius: number; x: number; y: number; color: string; speed: number; alpha: number }>>([]);

  // Camera angle for 3D rotation (Scene 1, 4, 5)
  const angleRef = useRef({ theta: 0.5, phi: 0.3 });

  // Track laser pulses
  const laserBeamRef = useRef<{ active: boolean; targetX: number; targetY: number; targetZ: number } | null>(null);

  // Set up dimensions and resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 320),
          height: Math.max(height, 350)
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Update Scene 2 chemical bubbles
  useEffect(() => {
    if (state.currentScene === StorageScene.MINING_PURITY) {
      const bubbles = [];
      for (let i = 0; i < 25; i++) {
        bubbles.push({
          x: Math.random() * dimensions.width,
          y: dimensions.height + Math.random() * 50,
          r: 1 + Math.random() * 4,
          speed: 1 + Math.random() * 2,
          alpha: 0.2 + Math.random() * 0.6
        });
      }
      bubblesRef.current = bubbles;
    }
  }, [state.currentScene, dimensions.width, dimensions.height]);

  // Inject element ripples
  useEffect(() => {
    if (state.currentScene === StorageScene.ELEMENT_INJECTION) {
      ripplesRef.current = [];
    }
  }, [state.currentScene]);

  // Monitor element injection levels and spawn ripples
  const prevErbium = useRef(state.erbiumLevel);
  const prevLithium = useRef(state.lithiumLevel);

  useEffect(() => {
    if (state.currentScene === StorageScene.ELEMENT_INJECTION) {
      if (state.erbiumLevel > prevErbium.current && state.erbiumLevel % 5 === 0) {
        ripplesRef.current.push({
          x: -0.2,
          y: -0.2,
          radius: 1,
          maxRadius: 180,
          color: 'rgba(16, 185, 129, 0.8)', // Green Erbium
          speed: 3,
          alpha: 1
        });
      }
      if (state.lithiumLevel > prevLithium.current && state.lithiumLevel % 5 === 0) {
        ripplesRef.current.push({
          x: 0.2,
          y: 0.2,
          radius: 1,
          maxRadius: 180,
          color: 'rgba(168, 85, 247, 0.8)', // Violet Lithium
          speed: 3,
          alpha: 1
        });
      }
    }
    prevErbium.current = state.erbiumLevel;
    prevLithium.current = state.lithiumLevel;
  }, [state.erbiumLevel, state.lithiumLevel, state.currentScene]);

  // Main canvas animation render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let localFrame = 0;

    const render = () => {
      localFrame++;
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw futuristic grid background
      drawGridBackground(ctx, dimensions.width, dimensions.height, localFrame);

      // Automatically slowly rotate 3D cameras
      if (!mouseRef.current.isDown) {
        angleRef.current.theta += 0.004;
      }

      // Route rendering based on scene
      switch (state.currentScene) {
        case StorageScene.RAW_SOURCE:
          renderScene1RawSource(ctx, localFrame);
          break;
        case StorageScene.MINING_PURITY:
          renderScene2MiningPurity(ctx, localFrame);
          break;
        case StorageScene.ELEMENT_INJECTION:
          renderScene3ElementInjection(ctx, localFrame);
          break;
        case StorageScene.FIVE_D_ENCODING:
          renderScene4FiveDEncoding(ctx, localFrame);
          break;
        case StorageScene.FINAL_PRODUCT:
          renderScene5FinalProduct(ctx, localFrame);
          break;
      }

      // Draw subtle telemetry overlay text on edges
      drawTelemetryOverlay(ctx, dimensions.width, dimensions.height, localFrame);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [dimensions, state, voxels, inclusions]);

  // Handle Mouse interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - mouseRef.current.x;
    const dy = y - mouseRef.current.y;

    if (mouseRef.current.isDown) {
      angleRef.current.theta += dx * 0.01;
      angleRef.current.phi = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, angleRef.current.phi + dy * 0.01));
    }

    mouseRef.current.x = x;
    mouseRef.current.y = y;

    // Check hovered items in specific scenes
    if (state.currentScene === StorageScene.FIVE_D_ENCODING && voxels.length > 0) {
      checkHoveredVoxel(x, y);
    }
  };

  const handleMouseDown = () => {
    mouseRef.current.isDown = true;
  };

  const handleMouseUp = () => {
    mouseRef.current.isDown = false;
  };

  const handleCanvasClick = () => {
    const { x, y } = mouseRef.current;

    // Scene 1: Click inclusions to scan
    if (state.currentScene === StorageScene.RAW_SOURCE) {
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      const scale = Math.min(dimensions.width, dimensions.height) * 0.35;

      const cosT = Math.cos(angleRef.current.theta);
      const sinT = Math.sin(angleRef.current.theta);
      const cosP = Math.cos(angleRef.current.phi);
      const sinP = Math.sin(angleRef.current.phi);

      inclusions.forEach((node) => {
        // Project 3D node to 2D
        const x3d = node.x;
        const y3d = node.y;
        const z3d = node.z;

        // Rotation around Y (theta)
        let xRot = x3d * cosT - z3d * sinT;
        let zRot = x3d * sinT + z3d * cosT;
        // Rotation around X (phi)
        let yRot = y3d * cosP - zRot * sinP;

        const screenX = centerX + xRot * scale;
        const screenY = centerY + yRot * scale;

        const dist = Math.hypot(x - screenX, y - screenY);
        if (dist < 15 && !node.scanned) {
          const updated = inclusions.map(n => n.id === node.id ? { ...n, scanned: true } : n);
          setInclusions(updated);
          if (onInteract) {
            onInteract('SCAN_INCLUSION', node);
          }
        }
      });
    }
  };

  // Check which voxel is hovered (Scene 4)
  const checkHoveredVoxel = (mx: number, my: number) => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const scale = Math.min(dimensions.width, dimensions.height) * 0.38;

    const cosT = Math.cos(angleRef.current.theta);
    const sinT = Math.sin(angleRef.current.theta);
    const cosP = Math.cos(angleRef.current.phi);
    const sinP = Math.sin(angleRef.current.phi);

    let closestVoxel: Voxel5D | null = null;
    let closestDist = 12; // Radius tolerance in px

    voxels.forEach((v) => {
      // Rotate 3D
      const xRot = v.x * cosT - v.z * sinT;
      const zRot = v.x * sinT + v.z * cosT;
      const yRot = v.y * cosP - zRot * sinP;

      const px = centerX + xRot * scale;
      const py = centerY + yRot * scale;

      const d = Math.hypot(mx - px, my - py);
      if (d < closestDist) {
        closestDist = d;
        closestVoxel = v;
      }
    });

    setHoveredVoxel(closestVoxel);
  };

  // Helper: Draw digital grid background
  const drawGridBackground = (ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;

    // Draw grid
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Concentric cleanroom rings in background
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
    ctx.beginPath();
    ctx.arc(w/2, h/2, Math.min(w, h) * 0.45, 0, Math.PI * 2);
    ctx.stroke();
  };

  // Helper: Draw lab indicators and telemetry overlay
  const drawTelemetryOverlay = (ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
    
    // Live scanning frame ticker
    ctx.fillText(`SYS.TICK: ${frame.toString().padStart(6, '0')}`, 15, 20);
    ctx.fillText(`LAB_DEVC: AURORA-FMT-V4`, 15, h - 15);
    ctx.fillText(`COORDS: [${angleRef.current.theta.toFixed(2)}, ${angleRef.current.phi.toFixed(2)}]`, w - 160, 20);
    
    const activeText = SCENES_DATA[state.currentScene].subtitle.toUpperCase();
    ctx.fillText(`PROCESS_PHASE: ${activeText}`, w - 260, h - 15);

    // Tech corners
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
    ctx.lineWidth = 1;
    const lineLen = 10;
    const m = 8; // margin
    
    // Top Left
    ctx.beginPath(); ctx.moveTo(m + lineLen, m); ctx.lineTo(m, m); ctx.lineTo(m, m + lineLen); ctx.stroke();
    // Top Right
    ctx.beginPath(); ctx.moveTo(w - m - lineLen, m); ctx.lineTo(w - m, m); ctx.lineTo(w - m, m + lineLen); ctx.stroke();
    // Bottom Left
    ctx.beginPath(); ctx.moveTo(m + lineLen, h - m); ctx.lineTo(m, h - m); ctx.lineTo(m, h - m + lineLen); ctx.stroke();
    // Bottom Right
    ctx.beginPath(); ctx.moveTo(w - m - lineLen, h - m); ctx.lineTo(w - m, h - m); ctx.lineTo(w - m, h - m + lineLen); ctx.stroke();
  };

  // ================= SCENE 1: THE RAW SOURCE =================
  const renderScene1RawSource = (ctx: CanvasRenderingContext2D, frame: number) => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const scale = Math.min(dimensions.width, dimensions.height) * 0.35;

    // Drawing 3D Raw quartz shard using vertex projection
    const vertices = [
      { x: 0, y: -0.9, z: 0 }, // Top peak
      { x: 0.4, y: -0.2, z: 0.3 },
      { x: 0.3, y: -0.2, z: -0.4 },
      { x: -0.4, y: -0.1, z: -0.3 },
      { x: -0.3, y: -0.1, z: 0.4 },
      { x: 0.35, y: 0.6, z: 0.35 },
      { x: -0.35, y: 0.6, z: 0.35 },
      { x: -0.3, y: 0.6, z: -0.4 },
      { x: 0.3, y: 0.6, z: -0.4 },
      { x: 0, y: 0.9, z: 0 } // Bottom peak
    ];

    const faces = [
      [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], // Top faces
      [1, 5, 2], [2, 5, 8], [2, 8, 7], [2, 7, 3], [3, 7, 6], [3, 6, 4], [4, 6, 5], [4, 5, 1], // Mid body
      [9, 5, 6], [9, 6, 7], [9, 7, 8], [9, 8, 5] // Bottom faces
    ];

    const cosT = Math.cos(angleRef.current.theta);
    const sinT = Math.sin(angleRef.current.theta);
    const cosP = Math.cos(angleRef.current.phi);
    const sinP = Math.sin(angleRef.current.phi);

    // Project points
    const proj = vertices.map((v) => {
      // Rotate around Y
      let x1 = v.x * cosT - v.z * sinT;
      let z1 = v.x * sinT + v.z * cosT;
      // Rotate around X
      let y1 = v.y * cosP - z1 * sinP;
      let z2 = v.y * sinP + z1 * cosP;

      return {
        x: centerX + x1 * scale,
        y: centerY + y1 * scale,
        depth: z2
      };
    });

    // Sort faces by depth
    const facesWithDepth = faces.map((face) => {
      const depth = (proj[face[0]].depth + proj[face[1]].depth + proj[face[2]].depth) / 3;
      return { face, depth };
    }).sort((a, b) => b.depth - a.depth);

    // Draw faces
    facesWithDepth.forEach(({ face, depth }) => {
      const p1 = proj[face[0]];
      const p2 = proj[face[1]];
      const p3 = proj[face[2]];

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();

      // Shading based on depth and angle
      const normalIntensity = Math.max(0.1, (depth + 1) / 2);
      ctx.fillStyle = `rgba(148, 163, 184, ${0.15 + normalIntensity * 0.35})`;
      ctx.fill();

      // Sharp wireframes
      ctx.strokeStyle = `rgba(165, 243, 252, ${0.15 + normalIntensity * 0.25})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw floating mineral dust particles
    ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
    for (let i = 0; i < 8; i++) {
      const px = centerX + Math.sin(frame * 0.01 + i) * scale * 1.1;
      const py = centerY + Math.cos(frame * 0.02 + i) * scale * 0.9;
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw interactive "Inclusion Nodes"
    inclusions.forEach((node) => {
      let nx = node.x * cosT - node.z * sinT;
      let nz = node.x * sinT + node.z * cosT;
      let ny = node.y * cosP - nz * sinP;

      const screenX = centerX + nx * scale;
      const screenY = centerY + ny * scale;

      // Draw red pulsing indicator for inclusions
      ctx.save();
      ctx.beginPath();
      ctx.arc(screenX, screenY, node.scanned ? 4 : 5 + Math.sin(frame * 0.1) * 2, 0, Math.PI * 2);
      ctx.fillStyle = node.scanned ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)';
      ctx.fill();
      ctx.strokeStyle = node.scanned ? 'rgba(52, 211, 153, 0.4)' : 'rgba(248, 113, 113, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(node.scanned ? `[SCAN OK: SILICA_PURE]` : `[UNCERTIFIED INCLUSION ${node.id}]`, screenX + 10, screenY - 4);
      ctx.restore();
    });

    // Interactive guidance overlay
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
    ctx.fillText('⚡ DRAG TO ORBIT OR CLICK IMPURITY SENSORS TO SCAN RAW MINERAL', 20, 45);
  };

  // ================= SCENE 2: MINING TO PURITY =================
  const renderScene2MiningPurity = (ctx: CanvasRenderingContext2D, frame: number) => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const size = Math.min(dimensions.width, dimensions.height) * 0.38;

    // Draw acidic chemical bath container frame
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - size * 1.1, centerY - size * 0.9, size * 2.2, size * 1.8);

    // Liquid fill level based on Frame or purity
    const liquidY = centerY + size * 0.7 - (state.purity / 100) * (size * 1.3);
    
    // Draw iridiscence glowing fluid surface
    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.beginPath();
    ctx.moveTo(centerX - size * 1.1, liquidY);
    // Draw sine wave for chemical liquid surface movement
    for (let x = centerX - size * 1.1; x <= centerX + size * 1.1; x += 10) {
      const wave = Math.sin(x * 0.02 + frame * 0.05) * 6;
      ctx.lineTo(x, liquidY + wave);
    }
    ctx.lineTo(centerX + size * 1.1, centerY + size * 0.9);
    ctx.lineTo(centerX - size * 1.1, centerY + size * 0.9);
    ctx.closePath();
    ctx.fill();

    // Draw chemical purification bath bubbles
    bubblesRef.current.forEach((b) => {
      b.y -= b.speed;
      if (b.y < centerY - size * 0.8) {
        b.y = dimensions.height + Math.random() * 20;
        b.x = Math.random() * dimensions.width;
      }
      ctx.fillStyle = `rgba(34, 211, 238, ${b.alpha * (state.purity / 100)})`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Render the physical Quartz Wafer transitioning from cloudy to ultra-pure
    const cosT = Math.cos(angleRef.current.theta * 0.5);
    const sinT = Math.sin(angleRef.current.theta * 0.5);

    // Wafer shape: 3D-flat disk
    const radiusX = size * 0.95;
    const radiusY = size * 0.28;

    // Outer wafer glow and gradient
    ctx.save();
    
    // Purity determines translucency & color
    const pPct = state.purity / 100;
    
    // Gradient representing impure silica (dusty brownish grey) shifting to 100% pure (clear neon blue glass)
    const gr = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radiusX);
    gr.addColorStop(0, `rgba(34, 211, 238, ${0.1 + pPct * 0.6})`);
    gr.addColorStop(0.5, `rgba(148, 163, 184, ${0.4 * (1 - pPct) + pPct * 0.1})`);
    gr.addColorStop(1, `rgba(6, 182, 212, ${0.5 + pPct * 0.4})`);

    // Draw wafer shadow
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 30, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();

    // Draw 3D wafer thickness edges
    const thickness = 14;
    ctx.fillStyle = `rgba(6, 182, 212, ${0.2 + pPct * 0.5})`;
    for (let t = 0; t < thickness; t++) {
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + t, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw main wafer top face
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.strokeStyle = `rgba(34, 211, 238, ${0.3 + pPct * 0.7})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // If purity is low, draw black fleck impurities inside the crystal
    if (state.purity < 95) {
      ctx.fillStyle = `rgba(50, 50, 50, ${0.8 * (1 - pPct)})`;
      for (let i = 0; i < 15; i++) {
        // Distribute within circular ellipse
        const rFactor = 0.1 + (i / 15) * 0.7;
        const ang = i * 2.3;
        const ix = centerX + Math.cos(ang) * radiusX * rFactor;
        const iy = centerY + Math.sin(ang) * radiusY * rFactor;
        ctx.beginPath();
        ctx.arc(ix, iy, 1.5 + (i%3), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw robotic diamond cutter slicing (glowing lines)
    if (state.purity < 40) {
      const scanLineY = centerY - radiusY + (frame % 30) / 30 * radiusY * 2;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.shadowColor = 'rgba(239, 68, 68, 1)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(centerX, scanLineY, radiusX * 0.9, radiusY * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(34, 211, 238, 0.8)';
    ctx.fillText(`SILICA PURIFICATION LEVEL: ${state.purity}%`, 20, 45);
    ctx.fillText('🧪 CHEMICAL BATH ACTIVE - ENERGIZE THE WASH USING THE SLIDER', 20, 60);
  };

  // ================= SCENE 3: ELEMENT INJECTION =================
  const renderScene3ElementInjection = (ctx: CanvasRenderingContext2D, frame: number) => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const size = Math.min(dimensions.width, dimensions.height) * 0.38;

    const radiusX = size * 0.95;
    const radiusY = size * 0.28;

    // Render wafer disk top
    ctx.save();
    
    // Shifting Opalescent Doping core center gradient based on elements injected
    const erPct = state.erbiumLevel / 100;
    const liPct = state.lithiumLevel / 100;

    const gr = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, radiusX);
    // Colorful ripple reaction color
    gr.addColorStop(0, `rgba(168, 85, 247, ${0.1 + liPct * 0.7})`); // Purple Lithium
    gr.addColorStop(0.2, `rgba(16, 185, 129, ${0.1 + erPct * 0.7})`); // Green Erbium
    gr.addColorStop(0.5, 'rgba(6, 182, 212, 0.2)');
    gr.addColorStop(1, 'rgba(6, 182, 212, 0.6)');

    // 3D Wafer Depth
    ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
    for (let t = 0; t < 10; t++) {
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + t, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wafer surface
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Render custom expanding injection ripples
    ripplesRef.current.forEach((r, idx) => {
      r.radius += r.speed;
      r.alpha = Math.max(0, 1 - r.radius / r.maxRadius);

      ctx.save();
      ctx.beginPath();
      // Draw ripple fitted to the ellipse perspective
      ctx.ellipse(centerX, centerY, Math.min(radiusX, r.radius), Math.min(radiusY, r.radius * (radiusY / radiusX)), 0, 0, Math.PI * 2);
      ctx.strokeStyle = r.color.replace('0.8', r.alpha.toFixed(2));
      ctx.lineWidth = 3 * r.alpha;
      ctx.stroke();
      ctx.restore();
    });

    // Remove finished ripples
    ripplesRef.current = ripplesRef.current.filter(r => r.radius < r.maxRadius);

    // Draw the two physical metal micro-cannulas approaching
    // Left cannula (Erbium)
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(16, 185, 129, 0.8)';
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.9)';
    ctx.lineWidth = 3;
    
    // Draw syringe left needle descending to target X: centerX - size * 0.2
    const targetLx = centerX - size * 0.3;
    const targetLy = centerY - size * 0.1;
    ctx.beginPath();
    ctx.moveTo(targetLx - 50, centerY - size * 1.2);
    ctx.lineTo(targetLx, targetLy);
    ctx.stroke();

    // Draw neon injection drop
    if (state.erbiumLevel > 0 && state.erbiumLevel < 100 && frame % 15 < 5) {
      ctx.fillStyle = 'rgba(52, 211, 153, 1)';
      ctx.beginPath();
      ctx.arc(targetLx, targetLy + 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Right cannula (Lithium Niobate)
    ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';
    const targetRx = centerX + size * 0.3;
    const targetRy = centerY - size * 0.1;
    ctx.beginPath();
    ctx.moveTo(targetRx + 50, centerY - size * 1.2);
    ctx.lineTo(targetRx, targetRy);
    ctx.stroke();

    if (state.lithiumLevel > 0 && state.lithiumLevel < 100 && frame % 15 < 5) {
      ctx.fillStyle = 'rgba(192, 132, 252, 1)';
      ctx.beginPath();
      ctx.arc(targetRx, targetRy + 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
    ctx.fillText(`Érbio (Erbium) Doping: ${state.erbiumLevel}%`, 20, 45);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.9)';
    ctx.fillText(`Niobato de Lítio (LiNbO3) Doping: ${state.lithiumLevel}%`, 20, 60);
    ctx.fillStyle = 'rgba(34, 211, 238, 0.8)';
    ctx.fillText('🧬 CLICK ELEMENT DOSE VALVES IN DASHBOARD TO DISPENSE IONS', 20, 75);
  };

  // ================= SCENE 4: THE WRITING PROCESS - 5D ENCODING =================
  const renderScene4FiveDEncoding = (ctx: CanvasRenderingContext2D, frame: number) => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const scale = Math.min(dimensions.width, dimensions.height) * 0.38;

    const cosT = Math.cos(angleRef.current.theta);
    const sinT = Math.sin(angleRef.current.theta);
    const cosP = Math.cos(angleRef.current.phi);
    const sinP = Math.sin(angleRef.current.phi);

    // Draw crystal transparent wafer outline (3D rotating disc)
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Draw disk outer rim in 3D projection
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x3d = Math.cos(angle) * 0.9;
      const y3d = Math.sin(angle) * 0.9;
      const z3d = 0;

      const xRot = x3d * cosT - z3d * sinT;
      const zRot = x3d * sinT + z3d * cosT;
      const yRot = y3d * cosP - zRot * sinP;

      const px = centerX + xRot * scale;
      const py = centerY + yRot * scale;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
    ctx.fill();
    ctx.stroke();

    // Render voxels
    if (voxels.length > 0) {
      // Sort voxels back-to-front (depth-sort) for correct painter algorithm render
      const voxelsWithDepth = voxels.map((v, index) => {
        const xRot = v.x * cosT - v.z * sinT;
        const zRot = v.x * sinT + v.z * cosT;
        const yRot = v.y * cosP - zRot * sinP;
        const depth = v.y * sinP + zRot * cosP;

        const px = centerX + xRot * scale;
        const py = centerY + yRot * scale;

        return { v, px, py, depth, index };
      }).sort((a, b) => b.depth - a.depth);

      // Determine voxel limit to show based on writingProgress (if encoding)
      const limit = Math.ceil((state.writingProgress / 100) * voxels.length);

      voxelsWithDepth.forEach(({ v, px, py, index }) => {
        // Skip voxels not written yet
        if (state.writingProgress < 100 && index >= limit) return;

        const isHovered = hoveredVoxel && hoveredVoxel.bitIndex === v.bitIndex;

        ctx.save();
        ctx.beginPath();
        // Voxel radius represents optical void size/intensity
        const baseRadius = 2.5 + v.intensity * 2.5;
        ctx.arc(px, py, isHovered ? baseRadius * 1.8 : baseRadius, 0, Math.PI * 2);

        // Color based on Polarization angle (0 -> Cyan, 45 -> Emerald, 90 -> Violet, 135 -> Magenta)
        let glowColor = 'rgba(6, 182, 212, 0.7)';
        if (v.theta === 45) glowColor = 'rgba(16, 185, 129, 0.7)';
        if (v.theta === 90) glowColor = 'rgba(168, 85, 247, 0.7)';
        if (v.theta === 135) glowColor = 'rgba(236, 72, 153, 0.7)';

        ctx.fillStyle = glowColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = isHovered ? 12 : 3;
        ctx.fill();

        // Draw polarisation angle directional tic marker
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        const markerLen = baseRadius + 2;
        const angleRad = (v.theta * Math.PI) / 180;
        ctx.moveTo(px - Math.cos(angleRad) * markerLen, py - Math.sin(angleRad) * markerLen);
        ctx.lineTo(px + Math.cos(angleRad) * markerLen, py + Math.sin(angleRad) * markerLen);
        ctx.stroke();

        ctx.restore();
      });

      // Active Laser beam during simulation writing
      if (state.writingProgress > 0 && state.writingProgress < 100) {
        const activeVoxelIdx = Math.min(voxels.length - 1, limit);
        const activeV = voxels[activeVoxelIdx];
        if (activeV) {
          // Project active voxel position
          const xRot = activeV.x * cosT - activeV.z * sinT;
          const zRot = activeV.x * sinT + activeV.z * cosT;
          const yRot = activeV.y * cosP - zRot * sinP;

          const lx = centerX + xRot * scale;
          const ly = centerY + yRot * scale;

          // Dynamic parameters based on user input
          const freq = state.laserFrequency ?? 12.5;
          const depth = state.laserDepth ?? 150;

          // Color shift based on laser pulse frequency
          let laserColor = 'rgba(16, 185, 129, 0.85)'; // Green for standard frequency
          let shadowColor = 'rgba(16, 185, 129, 1)';
          if (freq >= 15.0 && freq < 35.0) {
            laserColor = 'rgba(6, 182, 212, 0.85)'; // Cyan for mid-range frequency
            shadowColor = 'rgba(6, 182, 212, 1)';
          } else if (freq >= 35.0) {
            laserColor = 'rgba(168, 85, 247, 0.85)'; // Violet/Purple for high frequency
            shadowColor = 'rgba(168, 85, 247, 1)';
          }

          // Beam thickness proportional to writing depth
          const beamWidth = 1.5 + (depth / 150) * 1.5;

          // Pulsation speed based on pulse frequency, and radius based on depth
          const pulseSpeed = freq * 0.04;
          const flashRadius = 6 + (depth / 100);

          // Draw laser targeting beams descending from ceiling
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(centerX, -100);
          ctx.lineTo(lx, ly);
          ctx.strokeStyle = laserColor;
          ctx.lineWidth = beamWidth;
          ctx.shadowColor = shadowColor;
          ctx.shadowBlur = 15;
          ctx.stroke();

          // Laser impact flash rings
          ctx.beginPath();
          ctx.arc(lx, ly, flashRadius + Math.sin(frame * pulseSpeed) * (flashRadius * 0.4), 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }
      }
    } else {
      // Guide text when empty
      ctx.font = '11px monospace';
      ctx.fillStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.fillText('NO DATA LOADED FOR 5D LATTICE ENCODING', centerX - 120, centerY);
      ctx.fillText('ENTER TEXT OR SELECT DREX LEDGER BLOCK TO BURNING', centerX - 150, centerY + 20);
    }

    // Floating Voxel HUD Tooltip details
    if (hoveredVoxel) {
      drawVoxelHUD(ctx, hoveredVoxel);
    }
  };

  // Helper: Renders high-fidelity holographic voxel data overlay card on mouseover
  const drawVoxelHUD = (ctx: CanvasRenderingContext2D, v: Voxel5D) => {
    const rx = mouseRef.current.x + 15;
    const ry = mouseRef.current.y + 15;
    const w = 220;
    const h = 105;

    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(rx, ry, w, h, 6);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Content headers
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = 'rgba(34, 211, 238, 1)';
    ctx.fillText(`HOLOGRAPHIC VOXEL OPT-28`, rx + 12, ry + 16);
    
    // Grid line divider
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
    ctx.beginPath();
    ctx.moveTo(rx + 10, ry + 24);
    ctx.lineTo(rx + w - 10, ry + 24);
    ctx.stroke();

    // 5D Parameters
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 1)';
    
    ctx.fillText(`COORDS X: ${v.x.toFixed(4)}`, rx + 12, ry + 36);
    ctx.fillText(`COORDS Y: ${v.y.toFixed(4)}`, rx + 12, ry + 46);
    ctx.fillText(`COORDS Z: ${v.z.toFixed(4)} (LAYER ${Math.floor((v.z+0.6)/0.3)})`, rx + 12, ry + 56);
    
    ctx.fillStyle = 'rgba(16, 185, 129, 1)';
    ctx.fillText(`θ POLAR ANGLE: ${v.theta}°`, rx + 12, ry + 70);
    ctx.fillStyle = 'rgba(168, 85, 247, 1)';
    ctx.fillText(`I RETARDANCE: ${v.intensity.toFixed(2)} (VOID)`, rx + 12, ry + 80);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`DECODED CHAR: "${v.char}"`, rx + 12, ry + 94);

    // Byte code
    const polBits = (v.theta / 45).toString(2).padStart(2, '0');
    const intBits = Math.floor((v.intensity - 0.25) / 0.25).toString(2).padStart(2, '0');
    ctx.fillText(`BIN: [${polBits}${intBits}]`, rx + 130, ry + 94);
    ctx.restore();
  };

  // ================= SCENE 5: FINAL PRODUCT & SCALE =================
  const renderScene5FinalProduct = (ctx: CanvasRenderingContext2D, frame: number) => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const scale = Math.min(dimensions.width, dimensions.height) * 0.38;

    // Draw the zero-energy cold storage vault server rack grid (infinite grid lanes meeting at focal perspective point)
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
    ctx.lineWidth = 1;
    const rackY = centerY + 30;

    // Draw perspective lines (floor grids)
    const lineCount = 12;
    for (let i = 0; i < lineCount; i++) {
      const pct = i / (lineCount - 1);
      const startX = dimensions.width * (pct * 2 - 0.5);
      ctx.beginPath();
      ctx.moveTo(centerX, rackY - 50);
      ctx.lineTo(startX, dimensions.height);
      ctx.stroke();
    }

    // Draw horizontal shelf grids descending in size
    for (let h = rackY - 50; h < dimensions.height; h += 25) {
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(dimensions.width, h);
      ctx.stroke();
    }

    // Render several storage slots/pedestals holding wafers
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue; // Leave center empty for primary selected wafer
      const rx = centerX + i * 85;
      const ry = rackY + 50;

      // Draw standard small glowing wafer disks
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.beginPath();
      ctx.ellipse(rx, ry, 28, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.stroke();

      // Pulsing blue LED indicators
      ctx.fillStyle = frame % 60 < 30 ? 'rgba(34, 211, 238, 0.8)' : 'rgba(34, 211, 238, 0.2)';
      ctx.beginPath();
      ctx.arc(rx, ry + 12, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render the PRIMARY completed wafer placed on center pedestal
    ctx.save();
    const diskX = centerX;
    const diskY = centerY - 25 + Math.sin(frame * 0.04) * 5; // Levitating wafer
    const radX = scale * 0.75;
    const radY = scale * 0.22;

    // Pedestal bottom
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 65, radX * 0.7, radY * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Levitating wafer aura
    const gradientGlow = ctx.createRadialGradient(diskX, diskY, 5, diskX, diskY, radX);
    gradientGlow.addColorStop(0, 'rgba(34, 211, 238, 0.25)');
    gradientGlow.addColorStop(0.6, 'rgba(168, 85, 247, 0.1)'); // Erbium/Lithium opalescent fuse glow
    gradientGlow.addColorStop(1, 'rgba(6, 182, 212, 0.02)');
    ctx.fillStyle = gradientGlow;
    ctx.beginPath();
    ctx.ellipse(diskX, diskY, radX * 1.3, radY * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3D Wafer Depth
    ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
    for (let t = 0; t < 8; t++) {
      ctx.beginPath();
      ctx.ellipse(diskX, diskY + t, radX, radY, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wafer surface
    ctx.beginPath();
    ctx.ellipse(diskX, diskY, radX, radY, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(34, 211, 238, 1)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw concentric circles representing internal written data layers (represented as glowing tracks)
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
    for (let rFactor = 0.3; rFactor < 0.9; rFactor += 0.15) {
      ctx.beginPath();
      ctx.ellipse(diskX, diskY, radX * rFactor, radY * rFactor, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Digital Holographic Screen Overlay overlay: "DREX NETWORK DATA"
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(centerX - 110, centerY - 150, 220, 60, 4);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = 'rgba(34, 211, 238, 1)';
    ctx.fillText('⚡ SOVEREIGN ARCHIVAL VAULT', centerX - 95, centerY - 136);
    
    ctx.font = '8px monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 1)';
    ctx.fillText('DATA STATUS:  [SECURE_PERMANENT]', centerX - 95, centerY - 122);
    ctx.fillText('MEDIUM TYPE:  5D OPTICAL GLASS', centerX - 95, centerY - 112);
    ctx.fillStyle = 'rgba(16, 185, 129, 1)';
    ctx.fillText('VAL:          DREX NETWORK DATA', centerX - 95, centerY - 102);

    ctx.restore();
  };

  const isEncoding = state.currentScene === StorageScene.FIVE_D_ENCODING;
  const isWritingActive = isEncoding && state.writingProgress > 0 && state.writingProgress < 100;
  const instabilityActive = !!state.instabilityActive;

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#050B14] overflow-hidden rounded-xl border border-cyan-950/40">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-grab active:cursor-grabbing z-0"
      />

      {/* 5D Optical Activity Pulsing Overlay */}
      <AnimatePresence>
        {isEncoding && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            {/* Center optical core aligned with the rotating wafer */}
            <div className="relative flex items-center justify-center w-[300px] h-[300px] md:w-[400px] md:h-[400px]">
              
              {/* Outer pulsing refractive boundary */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{
                  scale: instabilityActive 
                    ? [0.95, 1.05, 0.93, 1.08, 0.95] 
                    : isWritingActive 
                    ? [0.98, 1.04, 0.98] 
                    : [0.99, 1.01, 0.99],
                  opacity: instabilityActive 
                    ? [0.35, 0.8, 0.25, 0.9, 0.35] 
                    : isWritingActive 
                    ? [0.3, 0.65, 0.3] 
                    : [0.15, 0.25, 0.15],
                  borderColor: instabilityActive 
                    ? 'rgba(239, 68, 68, 0.4)' 
                    : isWritingActive 
                    ? 'rgba(34, 211, 238, 0.35)' 
                    : 'rgba(6, 182, 212, 0.15)',
                  boxShadow: instabilityActive
                    ? [
                        '0 0 15px rgba(239, 68, 68, 0.15), inset 0 0 15px rgba(239, 68, 68, 0.15)',
                        '0 0 35px rgba(239, 68, 68, 0.4), inset 0 0 30px rgba(239, 68, 68, 0.3)',
                        '0 0 15px rgba(239, 68, 68, 0.15), inset 0 0 15px rgba(239, 68, 68, 0.15)'
                      ]
                    : isWritingActive
                    ? [
                        '0 0 10px rgba(34, 211, 238, 0.1), inset 0 0 10px rgba(34, 211, 238, 0.1)',
                        '0 0 25px rgba(34, 211, 238, 0.35), inset 0 0 20px rgba(34, 211, 238, 0.25)',
                        '0 0 10px rgba(34, 211, 238, 0.1), inset 0 0 10px rgba(34, 211, 238, 0.1)'
                      ]
                    : '0 0 5px rgba(6, 182, 212, 0.05), inset 0 0 5px rgba(6, 182, 212, 0.05)'
                }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{
                  duration: instabilityActive ? 0.25 : isWritingActive ? 2.2 : 4.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute w-[80%] h-[80%] rounded-full border border-cyan-500/20 [transform:rotateX(55deg)]"
              />

              {/* Inner energetic data-burning core */}
              {isWritingActive && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: instabilityActive 
                      ? [0.75, 1.15, 0.8, 1.25, 0.75] 
                      : [0.93, 1.07, 0.93],
                    opacity: instabilityActive 
                      ? [0.4, 0.9, 0.3, 0.95, 0.4] 
                      : [0.25, 0.7, 0.25],
                    background: instabilityActive
                      ? 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.05) 50%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(34, 211, 238, 0.1) 45%, transparent 70%)'
                  }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{
                    duration: instabilityActive ? 0.18 : 1.6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute w-[60%] h-[60%] rounded-full [transform:rotateX(55deg)]"
                />
              )}

              {/* Laser optical feedback target crosshair overlay when encoding */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: isWritingActive ? 0.45 : 0.15 }}
                className="absolute w-28 h-28 border border-dashed border-cyan-500/30 rounded-full animate-[spin_20s_linear_infinite] flex items-center justify-center"
              >
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
