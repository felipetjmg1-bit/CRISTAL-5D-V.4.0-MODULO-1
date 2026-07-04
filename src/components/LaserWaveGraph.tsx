import { useEffect, useRef } from 'react';

interface LaserWaveGraphProps {
  frequency: number; // 1.0 to 50.0 THz
  depth: number; // 100 to 800 nm
  isActive: boolean;
}

export default function LaserWaveGraph({ frequency, depth, isActive }: LaserWaveGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    // Handles retina display rendering
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Dynamic coloring based on frequency
    const getLaserColors = (freq: number) => {
      if (freq < 15.0) {
        return {
          stroke: 'rgba(16, 185, 129, 0.85)', // Emerald
          glow: 'rgba(16, 185, 129, 0.3)',
          bgGradient: 'rgba(16, 185, 129, 0.05)',
        };
      } else if (freq >= 15.0 && freq < 35.0) {
        return {
          stroke: 'rgba(6, 182, 212, 0.85)', // Cyan
          glow: 'rgba(6, 182, 212, 0.3)',
          bgGradient: 'rgba(6, 182, 212, 0.05)',
        };
      } else {
        return {
          stroke: 'rgba(168, 85, 247, 0.85)', // Purple
          glow: 'rgba(168, 85, 247, 0.3)',
          bgGradient: 'rgba(168, 85, 247, 0.05)',
        };
      }
    };

    const drawGrid = (width: number, height: number) => {
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
      ctx.lineWidth = 0.5;

      // Draw vertical grid lines
      const gridSpacingX = width / 10;
      for (let x = 0; x <= width; x += gridSpacingX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw horizontal grid lines
      const gridSpacingY = height / 4;
      for (let y = 0; y <= height; y += gridSpacingY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw center dashed lines
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.2)';
      ctx.setLineDash([4, 4]);
      
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      ctx.setLineDash([]);
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw oscilloscope background grid
      drawGrid(width, height);

      // 2. Compute parameters based on frequency and depth
      const colors = getLaserColors(frequency);
      
      // Calculate speed and amplitude multipliers
      // Speed scales with frequency
      const speedMultiplier = isActive ? (0.05 + (frequency / 50) * 0.15) : 0.01;
      phase += speedMultiplier;

      // Amplitude scales with writing depth (100 - 800 nm mapped to 6px - 22px)
      const amplitude = 4 + (depth / 800) * 16;
      
      // Wave tightness scales with frequency
      const wavelength = Math.max(10, 80 - (frequency / 50) * 60);

      // 3. Draw Waveform background fill/glow
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      for (let x = 0; x <= width; x++) {
        // Compound wave formula for laser pulse simulation (fundamental + 3rd harmonic)
        const rad = (x / wavelength) + phase;
        const y = height / 2 + 
          Math.sin(rad) * amplitude + 
          Math.sin(rad * 3 + phase * 0.5) * (amplitude * 0.18);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      const fillGrad = ctx.createLinearGradient(0, height / 2, 0, height);
      fillGrad.addColorStop(0, colors.bgGradient);
      fillGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // 4. Draw main glowing laser wave stroke
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      for (let x = 0; x <= width; x++) {
        const rad = (x / wavelength) + phase;
        const y = height / 2 + 
          Math.sin(rad) * amplitude + 
          Math.sin(rad * 3 + phase * 0.5) * (amplitude * 0.18);
        ctx.lineTo(x, y);
      }
      
      ctx.shadowBlur = isActive ? 10 : 3;
      ctx.shadowColor = colors.stroke;
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = isActive ? (1.5 + (depth / 300)) : 1;
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      // 5. Draw overlay text telemetry data
      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.font = '7px Courier New, monospace';
      ctx.fillText('OSC WAVEFORM: SIGMA-FEMTO', 6, 12);
      ctx.fillText(`PULSE RATE: ${(frequency * 10).toFixed(0)} F/s`, width - 110, 12);
      ctx.fillText(`RESOL: ${(850 - depth / 2).toFixed(0)} ps`, 6, height - 6);
      ctx.fillText(isActive ? 'SYS: ACTIVE_EMISSION' : 'SYS: WARMUP_IDLE', width - 90, height - 6);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [frequency, depth, isActive]);

  return (
    <div className="relative w-full h-[60px] bg-slate-950/90 border border-slate-900 rounded-lg overflow-hidden mt-2.5">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
      {/* Scope decorative elements */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-slate-800 rounded-full" />
      <div className="absolute inset-0 pointer-events-none border border-white/[0.02]" />
    </div>
  );
}
