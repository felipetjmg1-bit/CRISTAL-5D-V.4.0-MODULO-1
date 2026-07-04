import { useEffect, useRef } from 'react';

interface LaserSpectrumGraphProps {
  frequency: number; // 1.0 to 50.0 THz
  isActive: boolean;
  burstMode: boolean;
}

export default function LaserSpectrumGraph({ frequency, isActive, burstMode }: LaserSpectrumGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Color theme based on current frequency
    const getSpectrumColors = (freq: number) => {
      if (freq < 15.0) {
        return {
          primary: 'rgba(16, 185, 129, 0.85)', // Emerald
          primaryGlow: 'rgba(16, 185, 129, 0.25)',
          harmonics: 'rgba(52, 211, 153, 0.6)',
        };
      } else if (freq >= 15.0 && freq < 35.0) {
        return {
          primary: 'rgba(6, 182, 212, 0.85)', // Cyan
          primaryGlow: 'rgba(6, 182, 212, 0.25)',
          harmonics: 'rgba(103, 232, 249, 0.6)',
        };
      } else {
        return {
          primary: 'rgba(168, 85, 247, 0.85)', // Purple
          primaryGlow: 'rgba(168, 85, 247, 0.25)',
          harmonics: 'rgba(216, 180, 254, 0.6)',
        };
      }
    };

    const drawGrid = (width: number, height: number) => {
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
      ctx.lineWidth = 0.5;

      // Draw grid lines (frequencies scale from 0 to 200 THz)
      const gridCount = 5;
      for (let i = 0; i <= gridCount; i++) {
        const x = (i / gridCount) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        // Draw frequency labels at the bottom grid line
        ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
        ctx.font = '6px Courier New, monospace';
        const thzLabel = `${(i * 40).toFixed(0)}`;
        ctx.fillText(`${thzLabel}T`, Math.min(width - 15, Math.max(2, x - 6)), height - 3);
      }

      // Horizontal decibel-like lines
      const dbLines = 3;
      for (let i = 1; i <= dbLines; i++) {
        const y = (i / (dbLines + 1)) * (height - 10);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);
      time += 0.1;

      // 1. Draw grid background
      drawGrid(width, height);

      const colors = getSpectrumColors(frequency);

      // 2. Compute spectrum peak values
      // We map 0 to 200 THz onto the X-axis (width of canvas).
      // Max frequency limit is 200 THz.
      const mapFreqToX = (f: number) => (f / 200) * width;

      // Peak frequencies
      // Fundamental f0
      const f0 = frequency;
      // Harmonics
      const harmonics = [f0, f0 * 2, f0 * 3, f0 * 4];
      // Amplitudes
      const baseAmps = [
        0.85, // Fundamental
        0.35, // 2nd Harmonic
        0.18, // 3rd Harmonic
        0.08, // 4th Harmonic
      ];

      // Jitter / Instability effect for burst mode or playing
      const jitterAmount = burstMode ? 0.08 : (isActive ? 0.015 : 0.003);
      const frequencyJitter = burstMode ? Math.sin(time * 0.8) * 2.5 : 0;

      // Draw frequency bins (spectral peaks) using beautiful organic spectrum bars
      ctx.save();

      // We will construct the continuous spectral envelope/energy curve
      ctx.beginPath();
      ctx.moveTo(0, height - 10);

      const samples = width;
      const spectrumArray = new Float32Array(samples);

      // Fill spectrum array with harmonic peaks and noise floor
      for (let x = 0; x < samples; x++) {
        const currentFreq = (x / width) * 200;
        let power = 0.02; // Noise floor

        // Sum up Gaussian distribution for each harmonic
        harmonics.forEach((harmonicFreq, index) => {
          const targetFreq = harmonicFreq + frequencyJitter;
          const delta = currentFreq - targetFreq;
          // Gaussian envelope width (broaden slightly at higher harmonics or burst mode)
          const stdDev = (2.5 + index * 1.5) * (burstMode ? 1.5 : 1.0);
          const amp = baseAmps[index] * (isActive ? 1.0 : 0.3) * (1 + (Math.sin(time + index) * jitterAmount));
          
          power += Math.exp(-(delta * delta) / (2 * stdDev * stdDev)) * amp;
        });

        // Add some random noise fluctuations if active
        if (isActive) {
          const noiseFactor = burstMode ? 0.05 : 0.015;
          power += (Math.sin(currentFreq * 0.8 + time * 3) * Math.cos(currentFreq * 0.3 - time)) * noiseFactor;
        }

        spectrumArray[x] = Math.max(0, Math.min(0.95, power));
      }

      // Draw the spectrum area
      ctx.beginPath();
      ctx.moveTo(0, height - 10);
      for (let x = 0; x < samples; x++) {
        const y = (height - 10) - spectrumArray[x] * (height - 16);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height - 10);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 0, 0, height - 10);
      grad.addColorStop(0, colors.primaryGlow);
      grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.4)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();

      // Draw the spectrum line
      ctx.beginPath();
      for (let x = 0; x < samples; x++) {
        const y = (height - 10) - spectrumArray[x] * (height - 16);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 1.2;
      ctx.shadowBlur = isActive ? 8 : 2;
      ctx.shadowColor = colors.primary;
      ctx.stroke();
      ctx.restore();

      // Draw peak indicators (small technical markers above the harmonics)
      if (isActive) {
        ctx.fillStyle = '#f8fafc';
        ctx.font = '5px Courier New, monospace';
        harmonics.forEach((hFreq, index) => {
          const targetX = mapFreqToX(hFreq + frequencyJitter);
          if (targetX > 0 && targetX < width) {
            const powerAtX = spectrumArray[Math.floor(targetX)];
            const targetY = (height - 10) - (powerAtX || 0.1) * (height - 16);

            // Draw a small dot above the peak
            ctx.beginPath();
            ctx.arc(targetX, Math.max(2, targetY - 3), 1, 0, Math.PI * 2);
            ctx.fillStyle = index === 0 ? colors.primary : colors.harmonics;
            ctx.fill();

            // Label peaks (f0, 2f0, 3f0, 4f0)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.fillText(index === 0 ? 'f₀' : `${index + 1}f₀`, targetX - 4, Math.max(7, targetY - 6));
          }
        });
      }

      // Technical info labels overlay
      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.font = '6px Courier New, monospace';
      ctx.fillText('FFT HARMONICS [0-200 THz]', 5, 10);
      ctx.fillText(`BANDWIDTH: ${burstMode ? '±15.5' : '±4.2'} THz`, width - 95, 10);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [frequency, isActive, burstMode]);

  return (
    <div className="relative w-full h-[55px] bg-slate-950/95 border border-slate-900 rounded-lg overflow-hidden mt-2">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
      {/* Scope corner decor */}
      <div className="absolute top-1 left-1.5 w-[3px] h-[3px] border-t border-l border-slate-700" />
      <div className="absolute top-1 right-1.5 w-[3px] h-[3px] border-t border-r border-slate-700" />
      <div className="absolute bottom-[11px] left-1.5 w-[3px] h-[3px] border-b border-l border-slate-700" />
      <div className="absolute bottom-[11px] right-1.5 w-[3px] h-[3px] border-b border-r border-slate-700" />
    </div>
  );
}
