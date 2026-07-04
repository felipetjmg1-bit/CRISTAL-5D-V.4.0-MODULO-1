import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SimulationState, CrystalDataBlock, Voxel5D, StorageScene } from '../types';
import CertificadoConformidade from './CertificadoConformidade';
import { 
  FileJson, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Cpu, 
  Search, 
  Layers, 
  Terminal, 
  Flame, 
  Sparkles,
  CheckCircle2,
  HelpCircle,
  FileSpreadsheet,
  Award,
  Tag,
  X,
  Printer
} from 'lucide-react';
import { playClickSfx } from '../utils/audio';
import { jsPDF } from 'jspdf';

interface VoxelLogsPanelProps {
  state: SimulationState;
  activeBlock: CrystalDataBlock | null;
}

interface AuditableLogEntry {
  voxelIndex: number;
  coordinates: { x: number; y: number; z: number };
  polarizationAngleDeg: number;
  opticalRetardance: number;
  character: string;
  bitOffset: number;
  timestamp: string;
  integrityPercent: number;
  status: 'PENDING' | 'WRITING' | 'COMPLETED' | 'CORRUPTED';
  laserParameters: {
    powerGwCm2: number;
    pulseDurationFs: number;
    wavelengthNm: number;
  };
}

export default function VoxelLogsPanel({ state, activeBlock }: VoxelLogsPanelProps) {
  const [selectedVoxelIdx, setSelectedVoxelIdx] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'completed' | 'corrupted' | 'pending'>('all');
  const [customBatchName, setCustomBatchName] = useState('');
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<boolean>(true);

  const voxels = activeBlock?.voxels || [];
  const totalVoxels = voxels.length;

  // Calculate progress-based recorded voxels count
  const isEncodingScene = state.currentScene === StorageScene.FIVE_D_ENCODING;
  
  // If we are in step 5 (Final Product), progress is 100% written
  const effectiveProgress = state.currentScene === StorageScene.FINAL_PRODUCT 
    ? 100 
    : isEncodingScene 
      ? state.writingProgress 
      : 0;

  const recordedCount = Math.floor((totalVoxels * effectiveProgress) / 100);

  // Maintain list of simulated voxel errors caused by active laser instability
  // We can tie this to the write index to show which specific voxels were corrupted
  const [corruptedIndices, setCorruptedIndices] = useState<Set<number>>(new Set());

  const overallIntegrityScore = totalVoxels > 0 
    ? Math.floor(((recordedCount - corruptedIndices.size) / totalVoxels) * 100) 
    : 100;

  // Accumulate corrupted indices as the laser writes with instability active
  useEffect(() => {
    if (isEncodingScene && state.isPlaying && state.instabilityActive) {
      const currentWriteIndex = recordedCount;
      if (currentWriteIndex > 0 && currentWriteIndex < totalVoxels) {
        setCorruptedIndices(prev => {
          const updated = new Set(prev);
          // Corrupt the current voxel block
          for (let i = Math.max(0, currentWriteIndex - 3); i <= currentWriteIndex; i++) {
            updated.add(i);
          }
          return updated;
        });
      }
    }
  }, [recordedCount, state.instabilityActive, isEncodingScene, state.isPlaying, totalVoxels]);

  // Reset corrupted indices if we restart/rewind or change block
  useEffect(() => {
    if (effectiveProgress === 0) {
      setCorruptedIndices(new Set());
    }
  }, [effectiveProgress, activeBlock?.id]);

  // Generate logs array based on active block voxels
  const voxelLogs = useMemo<AuditableLogEntry[]>(() => {
    return voxels.map((v, idx) => {
      const isCompleted = idx < recordedCount;
      const isWriting = idx === recordedCount && effectiveProgress < 100 && effectiveProgress > 0 && isEncodingScene;
      const isCorrupted = corruptedIndices.has(idx);

      let status: AuditableLogEntry['status'] = 'PENDING';
      let integrityPercent = 100;

      if (isCorrupted) {
        status = 'CORRUPTED';
        integrityPercent = Math.max(10, Math.floor(15 + Math.random() * 20 - (state.instabilitySeverity * 0.1)));
      } else if (isCompleted) {
        status = 'COMPLETED';
        integrityPercent = 100;
      } else if (isWriting) {
        status = 'WRITING';
        integrityPercent = state.instabilityActive ? Math.max(30, 100 - state.instabilitySeverity) : 98;
      }

      // Create log timestamp derived from block timestamp and offset
      const logTime = new Date(activeBlock!.timestamp + idx * 45).toISOString();

      return {
        voxelIndex: idx,
        coordinates: { x: parseFloat(v.x.toFixed(4)), y: parseFloat(v.y.toFixed(4)), z: parseFloat(v.z.toFixed(4)) },
        polarizationAngleDeg: v.theta,
        opticalRetardance: parseFloat(v.intensity.toFixed(2)),
        character: v.char,
        bitOffset: v.bitIndex,
        timestamp: logTime,
        integrityPercent,
        status,
        laserParameters: {
          powerGwCm2: status === 'COMPLETED' || status === 'WRITING' ? parseFloat((65 + (isCorrupted ? -25 : 5) + Math.sin(idx) * 2).toFixed(2)) : 0,
          pulseDurationFs: status === 'COMPLETED' || status === 'WRITING' ? 220 : 0,
          wavelengthNm: status === 'COMPLETED' || status === 'WRITING' ? 515 : 0
        }
      };
    });
  }, [voxels, recordedCount, corruptedIndices, activeBlock, effectiveProgress, isEncodingScene, state.instabilityActive, state.instabilitySeverity]);

  // Auto-scroll logs as they write
  useEffect(() => {
    if (autoScrollRef.current && scrollContainerRef.current && isEncodingScene && state.isPlaying) {
      const el = scrollContainerRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [recordedCount, isEncodingScene, state.isPlaying]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return voxelLogs.filter(log => {
      const matchesSearch = searchQuery === '' || 
        log.character.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.voxelIndex.toString().includes(searchQuery) ||
        log.status.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (logFilter === 'all') return true;
      if (logFilter === 'completed') return log.status === 'COMPLETED';
      if (logFilter === 'corrupted') return log.status === 'CORRUPTED';
      if (logFilter === 'pending') return log.status === 'PENDING';
      return true;
    });
  }, [voxelLogs, searchQuery, logFilter]);

  // Selected voxel details
  const selectedVoxelDetail = selectedVoxelIdx !== null && selectedVoxelIdx < voxelLogs.length 
    ? voxelLogs[selectedVoxelIdx] 
    : null;

  // Export JSON handler
  const handleExportJSON = () => {
    playClickSfx();
    if (!activeBlock) return;

    const auditData = {
      exportedAt: new Date().toISOString(),
      facility: "Soberana CleanLab - Aurora Soberano Alpha-7",
      customBatchName: customBatchName.trim() || activeBlock.title,
      targetDataBlock: {
        id: activeBlock.id,
        title: activeBlock.title,
        type: activeBlock.type,
        payloadSizeChars: activeBlock.payload.length,
        hash: activeBlock.hash,
        compiledAt: new Date(activeBlock.timestamp).toISOString(),
      },
      processStatistics: {
        totalVoxels: totalVoxels,
        recordedVoxels: recordedCount,
        corruptedVoxels: corruptedIndices.size,
        purityLevel: `${(99.8 + (state.purity * 0.001999)).toFixed(4)}%`,
        erbiumLevelMolPercent: `${(state.erbiumLevel * 0.0042).toFixed(4)} mol%`,
        lithiumLevelMolPercent: `${(state.lithiumLevel * 0.0115).toFixed(4)} mol%`,
        laserInstabilityIncidentReported: state.instabilityActive,
        overallIntegrityScorePercent: totalVoxels > 0 
          ? Math.floor(((recordedCount - corruptedIndices.size) / totalVoxels) * 100) 
          : 0,
      },
      auditVoxelMap: voxelLogs
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(auditData, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `AUDIT_VOXEL_LOG_${activeBlock.id}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export CSV handler
  const handleExportCSV = () => {
    playClickSfx();
    if (!activeBlock) return;

    const headers = [
      "Voxel_ID",
      "Coord_X",
      "Coord_Y",
      "Coord_Z",
      "Polarizacao_Angulo_Graus",
      "Retardancia_Optica",
      "Caractere",
      "Offset_Bit",
      "Timestamp",
      "Integridade_Percentual",
      "Status",
      "Laser_Potencia_GW_cm2",
      "Laser_Largura_Pulso_fs",
      "Laser_Comprimento_Onda_nm"
    ];

    const rows = voxelLogs.map(log => {
      let charRep = log.character;
      if (charRep === '\n') {
        charRep = '[LineBreak]';
      } else if (charRep === '"') {
        charRep = '""';
      } else if (charRep === ',') {
        charRep = '","';
      }

      return [
        log.voxelIndex,
        log.coordinates.x,
        log.coordinates.y,
        log.coordinates.z,
        log.polarizationAngleDeg,
        log.opticalRetardance,
        `"${charRep}"`,
        log.bitOffset,
        log.timestamp,
        log.integrityPercent,
        log.status,
        log.laserParameters.powerGwCm2,
        log.laserParameters.pulseDurationFs,
        log.laserParameters.wavelengthNm
      ].join(',');
    });

    const csvContent = "\ufeff" + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `AUDIT_VOXEL_LOG_${activeBlock.id}_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  // Export PDF Certificate handler
  const handleExportPDF = () => {
    playClickSfx();
    if (!activeBlock) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;

    // Background style - Light, elegant official parchment paper tone
    doc.setFillColor(252, 251, 246); // Off-white/cream parchment
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Decorative Forest Green outer border
    doc.setDrawColor(11, 60, 31); // Forest Green (#0b3c1f)
    doc.setLineWidth(1.0);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S');

    // Inner Imperial Gold border
    doc.setDrawColor(184, 134, 11); // Dark Goldenrod (#b8860b)
    doc.setLineWidth(0.4);
    doc.rect(10.5, 10.5, pageWidth - 21, pageHeight - 21, 'S');

    // Ornate Corner Accents (Gold Stars)
    const drawCornerStar = (cx: number, cy: number) => {
      doc.setDrawColor(184, 134, 11);
      doc.setLineWidth(0.2);
      doc.line(cx - 2, cy, cx + 2, cy);
      doc.line(cx, cy - 2, cx, cy + 2);
      doc.circle(cx, cy, 0.8, 'S');
    };
    drawCornerStar(13, 13);
    drawCornerStar(pageWidth - 13, 13);
    drawCornerStar(13, pageHeight - 13);
    drawCornerStar(pageWidth - 13, pageHeight - 13);

    // Subtle center watermark (glowing laser lines / concentric circles in gold)
    doc.setDrawColor(212, 175, 55); // Metallic Gold
    doc.setLineWidth(0.08);
    doc.circle(pageWidth / 2, pageHeight / 2, 45, 'S');
    doc.circle(pageWidth / 2, pageHeight / 2, 40, 'S');
    doc.circle(pageWidth / 2, pageHeight / 2, 5, 'S');
    doc.line(pageWidth / 2 - 50, pageHeight / 2, pageWidth / 2 + 50, pageHeight / 2);
    doc.line(pageWidth / 2, pageHeight / 2 - 50, pageWidth / 2, pageHeight / 2 + 50);

    // --- OFFICIAL GOVERNAMENT-STYLE CREST (VECTORS) ---
    const crestX = pageWidth / 2;
    const crestY = 28;

    // Outer gold wreath circle
    doc.setDrawColor(184, 134, 11);
    doc.setLineWidth(0.3);
    doc.circle(crestX, crestY, 9, 'S');
    
    // Internal Green star/shield elements
    doc.setFillColor(11, 60, 31); // Green
    doc.circle(crestX, crestY, 7.5, 'F');

    // Central Blue Core
    doc.setFillColor(15, 32, 67); // Navy Blue
    doc.circle(crestX, crestY, 4.5, 'F');

    // Small Gold Star in the center
    doc.setFillColor(255, 215, 0); // Yellow/Gold
    // Draw simple cross star
    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(0.5);
    doc.line(crestX - 2, crestY, crestX + 2, crestY);
    doc.line(crestX, crestY - 2, crestX, crestY + 2);

    // --- HEADER TEXT (GOVERNMENT DEPARTMENT STYLE) ---
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(11, 60, 31); // Forest Green
    doc.text("REPÚBLICA FEDERATIVA DO BRASIL", pageWidth / 2, 43, { align: "center" });

    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 32, 67); // Dark Navy
    doc.text("SISTEMA AURORA SOBERANO", pageWidth / 2, 49, { align: "center" });

    doc.setFont('times', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 110, 120);
    doc.text("UNIDADE DE SOBERANIA TECNOLÓGICA E SEGURANÇA NACIONAL DE DADOS", pageWidth / 2, 53, { align: "center" });

    // Header divider line
    doc.setDrawColor(184, 134, 11); // Gold Line
    doc.setLineWidth(0.35);
    doc.line(20, 56, pageWidth - 20, 56);

    // --- MAIN CERTIFICATE TITLE ---
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 32, 67); // Navy
    doc.text("CERTIFICADO DE SOBERANIA E INTEGRIDADE DE REGISTRO", pageWidth / 2, 66, { align: "center" });

    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(11, 60, 31); // Forest Green
    doc.text("GRAVAÇÃO FISÍCA PERMANENTE EM MÍDIA DE QUARTZO CRISTALINO 5D", pageWidth / 2, 71, { align: "center" });

    // Official Decree text
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(40, 45, 50);
    const splitText = doc.splitTextToSize(
      "Certificamos, para fins de salvaguarda de segurança cibernética e registro histórico perpétuo de dados, que as informações contidas no bloco especificado abaixo foram gravadas permanentemente por meio de feixe laser pulsado de femtossegundo em estrutura atômica de silicato de quartzo 5D, em conformidade com as diretrizes de integridade de dados do Banco Central do Brasil e os protocolos de criptografia da rede DREX.",
      pageWidth - 40
    );
    doc.text(splitText, 20, 79, { align: "justify", maxWidth: pageWidth - 40 });

    // --- METADATA TABLE (RE-DESIGNED AS A CLASSIC RECORD CARD) ---
    const tableStartY = 104;
    doc.setFillColor(247, 246, 240); // Soft paper gray-beige
    doc.rect(20, tableStartY, pageWidth - 40, 78, 'F');
    doc.setDrawColor(184, 134, 11); // Gold boundary
    doc.setLineWidth(0.25);
    doc.rect(20, tableStartY, pageWidth - 40, 78, 'S');

    // Table divider lines
    doc.setDrawColor(218, 215, 200);
    doc.setLineWidth(0.2);
    let currentY = tableStartY;
    for (let i = 0; i < 7; i++) {
      currentY += 11;
      doc.line(20, currentY, pageWidth - 20, currentY);
    }

    doc.setFont('times', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 32, 67);

    // Draw fields
    const drawRow = (rowY: number, label: string, value: string, isHash = false) => {
      doc.setFont('times', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(11, 60, 31);
      doc.text(label, 24, rowY + 7);

      if (isHash) {
        doc.setFont('courier', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 32, 67);
      } else {
        doc.setFont('times', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 45);
      }
      doc.text(value, 68, rowY + 7);
    };

    drawRow(tableStartY, "ID do Bloco:", activeBlock.id);
    drawRow(tableStartY + 11, "Identificação do Lote:", customBatchName.trim() || activeBlock.title);
    drawRow(tableStartY + 22, "Tipo de Dados:", activeBlock.type);
    drawRow(tableStartY + 33, "Padrão Tecnológico:", "DREX SOBERANO v1.0 / PROTOCOLO AURORA 5D");
    drawRow(tableStartY + 44, "Tamanho do Payload:", `${activeBlock.payload.length} caracteres (ASCII / UTF-8)`);
    drawRow(tableStartY + 55, "Assinatura Ledger (Hash):", activeBlock.hash, true);
    drawRow(tableStartY + 66, "Data de Emissão:", new Date().toLocaleString('pt-BR'));

    // --- PERFORMANCE & PHYSICAL INTEGRITY METRICS ---
    const metricsY = 191;
    doc.setFillColor(242, 245, 240); // Soft green tint
    doc.rect(20, metricsY, pageWidth - 40, 40, 'F');
    doc.setDrawColor(11, 60, 31); // Green border
    doc.setLineWidth(0.3);
    doc.rect(20, metricsY, pageWidth - 40, 40, 'S');

    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(11, 60, 31);
    doc.text("MÉTRICAS FÍSICAS DE DEPOSIÇÃO E INTEGRIDADE DE VOXELS", 24, metricsY + 7);
    doc.setDrawColor(11, 60, 31, 0.3);
    doc.line(24, metricsY + 10, pageWidth - 24, metricsY + 10);

    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 55, 60);
    doc.text(`Capacidade Total Lote: ${totalVoxels} voxels`, 24, metricsY + 17);
    doc.text(`Gravações Efetuadas com Sucesso: ${recordedCount - corruptedIndices.size} voxels`, 24, metricsY + 23);
    doc.text(`Anomalias de Foco Detectadas: ${corruptedIndices.size} voxels`, 24, metricsY + 29);
    doc.text(`Quartzo de Sílica (SiO2) Pureza: ${(99.8 + (state.purity * 0.001999)).toFixed(4)}%`, 24, metricsY + 35);

    // Overall integrity badge inside metrics box
    const overallIntegrityScore = totalVoxels > 0 
      ? Math.floor(((recordedCount - corruptedIndices.size) / totalVoxels) * 100) 
      : 100;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(184, 134, 11);
    doc.rect(130, metricsY + 14, 55, 21, 'DF');

    doc.setFont('times', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 32, 67);
    doc.text("TAXA GERAL DE SOBERANIA", 133, metricsY + 19);

    doc.setFontSize(15);
    const scoreCol = overallIntegrityScore >= 95 ? [11, 60, 31] : [180, 40, 40];
    doc.setTextColor(scoreCol[0], scoreCol[1], scoreCol[2]);
    doc.text(`${overallIntegrityScore}% INTEGRIDADE`, 133, metricsY + 28);

    doc.setFont('times', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(110, 115, 120);
    doc.text(overallIntegrityScore >= 95 ? "ESTADO: CRISTALINA ESTÁVEL" : "ESTADO: OSCILAÇÃO PARCIAL", 133, metricsY + 32);

    // --- OFFICIAL FOOTER STAMP & HANDWRITTEN CURSIVE SIGNATURE ---
    const footerStartY = 243;

    // 1. Left Side: Official Green Chancellery Seal / Stamp
    const sealX = 55;
    const sealY = footerStartY + 12;

    doc.setDrawColor(11, 60, 31); // Green Stamp
    doc.setLineWidth(0.4);
    doc.circle(sealX, sealY, 13, 'S');

    doc.setLineDashPattern([0.5, 0.5], 0);
    doc.circle(sealX, sealY, 11.2, 'S');
    doc.setLineDashPattern([], 0); // Reset

    doc.setFont('times', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(11, 60, 31);
    doc.text("REDE FINANCEIRA DREX", sealX, sealY - 6.5, { align: "center" });
    doc.setFontSize(7);
    doc.text("SOBERANA", sealX, sealY - 1, { align: "center" });
    doc.setFontSize(5);
    doc.text("CHANCELADO", sealX, sealY + 4, { align: "center" });
    doc.setFontSize(4.5);
    doc.text("SISTEMA AURORA", sealX, sealY + 8, { align: "center" });

    // 2. Right Side: Beautiful Cursive Signature and Name
    const sigX = 145;
    const sigY = footerStartY + 9;

    // Horizontal signature placeholder line
    doc.setDrawColor(184, 134, 11); // Gold
    doc.setLineWidth(0.25);
    doc.line(sigX - 32, sigY + 3, sigX + 32, sigY + 3);

    // --- CUSTOM VECTOR CURSIVE HANDWRITTEN SIGNATURE "Felipe Marcos" ---
    doc.setDrawColor(18, 52, 133); // Authentic Royal Blue Pen Ink (#123485)
    doc.setLineWidth(0.5);
    
    // Calligraphic letter strokes representing "Felipe Marcos de Abreu Aquino"
    // F loop
    doc.line(sigX - 22, sigY - 1, sigX - 18, sigY - 8);
    doc.line(sigX - 18, sigY - 8, sigX - 15, sigY - 4);
    doc.line(sigX - 25, sigY - 7, sigX - 12, sigY - 7); // crossbar
    doc.line(sigX - 18, sigY - 8, sigX - 19, sigY + 2); // vertical down
    doc.line(sigX - 19, sigY + 2, sigX - 15, sigY);

    // "elipe" running cursives
    doc.line(sigX - 15, sigY, sigX - 12, sigY - 5);
    doc.line(sigX - 12, sigY - 5, sigX - 10, sigY);
    doc.line(sigX - 10, sigY, sigX - 8, sigY - 4);
    doc.line(sigX - 8, sigY - 4, sigX - 6, sigY);
    doc.line(sigX - 6, sigY, sigX - 4, sigY - 3);
    doc.line(sigX - 4, sigY - 3, sigX - 2, sigY);
    
    // "p" loop and drop
    doc.line(sigX - 2, sigY, sigX - 1, sigY + 4);
    doc.line(sigX - 1, sigY + 4, sigX + 1, sigY - 3);
    doc.line(sigX + 1, sigY - 3, sigX + 3, sigY);

    // Majestic lower flourish underline swash
    doc.line(sigX - 24, sigY + 1.5, sigX + 24, sigY + 0.5);

    // "Aquino" signature part
    doc.line(sigX + 6, sigY - 1, sigX + 9, sigY - 6);
    doc.line(sigX + 9, sigY - 6, sigX + 12, sigY);
    doc.line(sigX + 12, sigY, sigX + 14, sigY - 4);
    doc.line(sigX + 14, sigY - 4, sigX + 16, sigY);
    doc.line(sigX + 16, sigY, sigX + 18, sigY - 3);
    doc.line(sigX + 18, sigY - 3, sigX + 20, sigY + 1);
    doc.line(sigX + 20, sigY + 1, sigX + 24, sigY - 4);

    // Title & Name below line
    doc.setFont('times', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 32, 67); // Navy
    doc.text("Felipe Marcos de Abreu Aquino", sigX, sigY + 7, { align: "center" });

    doc.setFont('times', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 85, 90);
    doc.text("Arquiteto de Sistemas e Diretor de I.A.", sigX, sigY + 11, { align: "center" });

    doc.setFont('times', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(110, 115, 120);
    doc.text("Plataforma de Soberania Tecnológica Aurora", sigX, sigY + 14, { align: "center" });

    // --- CRYPTOGRAPHIC TELEMETRY CODE AT VERY BOTTOM ---
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 125, 130);
    const securityHash = `CODEX_REG_SEC: ${activeBlock.hash.slice(0, 18)}... VALIDATION: SIGNATURE_SOVEREIGN_OK_v4.0.2`;
    doc.text(securityHash, pageWidth / 2, 282, { align: 'center' });

    // Save PDF
    doc.save(`CERTIFICADO_AURORA_SOBERANO_5D_${activeBlock.id}.pdf`);
  };

  return (
    <div id="voxel-logs-audit-panel" className="mt-4 bg-[#070e1b]/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 backdrop-blur-md relative overflow-hidden">
      {/* Decorative background grid and laser scan line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-pulse" />
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-950/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-950/40 border border-cyan-800/30 rounded">
            <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-mono text-xs font-bold text-gray-200 tracking-wider flex items-center gap-1.5">
              LOGS DE GRAVAÇÃO DE VOXELS 5D
              {isEncodingScene && (
                <span className="text-[7.5px] bg-red-500/10 text-red-400 border border-red-500/20 px-1 py-0.5 rounded font-normal uppercase tracking-tighter">
                  Feixe Laser Ativo
                </span>
              )}
            </h3>
            <p className="font-mono text-[8.5px] text-slate-500 uppercase tracking-tight">
              Análise Holográfica e Auditoria de Deposição de Dados Ópticos em Silicato
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleExportJSON}
            disabled={!activeBlock || totalVoxels === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00ff66]/10 hover:bg-[#00ff66]/20 border border-[#00ff66]/40 hover:border-[#00ff66]/80 text-[#00ff66] font-mono text-[9px] font-bold uppercase rounded transition-all shadow-[0_0_8px_rgba(0,255,102,0.1)] hover:shadow-[0_0_12px_rgba(0,255,102,0.3)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Exportar auditoria de gravação de voxels em formato JSON"
          >
            <Download className="w-3 h-3" />
            Auditoria (JSON)
          </button>

          <button
            id="btn-export-voxel-logs-csv"
            onClick={handleExportCSV}
            disabled={!activeBlock || totalVoxels === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 hover:border-cyan-500/80 text-cyan-400 font-mono text-[9px] font-bold uppercase rounded transition-all shadow-[0_0_8px_rgba(6,182,212,0.1)] hover:shadow-[0_0_12px_rgba(6,182,212,0.3)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Exportar auditoria de gravação de voxels em formato CSV para verificação"
          >
            <FileSpreadsheet className="w-3 h-3" />
            Relatório de Auditoria (CSV)
          </button>

          <button
            id="btn-export-audit-certificate-pdf"
            onClick={handleExportPDF}
            disabled={!activeBlock || totalVoxels === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/40 hover:border-yellow-500/80 text-yellow-400 font-mono text-[9px] font-bold uppercase rounded transition-all shadow-[0_0_8px_rgba(250,204,21,0.1)] hover:shadow-[0_0_12px_rgba(250,204,21,0.3)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Gerar Certificado de Auditoria oficial do lote de codificação em formato PDF"
          >
            <Award className="w-3 h-3" />
            Certificado de Auditoria (PDF)
          </button>

          <button
            id="btn-view-drex-conformity-certificate"
            onClick={() => { playClickSfx(); setIsCertificateOpen(true); }}
            disabled={!activeBlock || totalVoxels === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 hover:border-emerald-500/80 text-emerald-400 font-mono text-[9px] font-bold uppercase rounded transition-all shadow-[0_0_8px_rgba(16,185,129,0.15)] hover:shadow-[0_0_12px_rgba(16,185,129,0.35)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Exibir o Certificado de Conformidade DREX oficial com visual governamental"
          >
            <ShieldCheck className="w-3 h-3 text-[#34A853]" />
            Certificado DREX (Visual)
          </button>
        </div>
      </div>

      {/* Nome do Lote Personalizado Input Section with Google Colors */}
      <div className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 relative overflow-hidden">
        {/* Left Google color line strip */}
        <div className="absolute top-0 bottom-0 left-0 w-1 flex flex-col">
          <div className="flex-1 bg-[#4285F4]" />
          <div className="flex-1 bg-[#EA4335]" />
          <div className="flex-1 bg-[#FBBC05]" />
          <div className="flex-1 bg-[#34A853]" />
        </div>

        <div className="flex items-center gap-2.5 pl-2">
          <div className="p-1 bg-[#4285F4]/10 rounded border border-[#4285F4]/30">
            <Tag className="w-3.5 h-3.5 text-[#4285F4]" />
          </div>
          <div>
            <span className="font-mono text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              Identificação do Lote de Gravação
              <span className="text-[7px] text-[#34A853] bg-[#34A853]/10 border border-[#34A853]/20 px-1 py-0.2 rounded uppercase">
                Metadados 5D
              </span>
            </span>
            <p className="text-[8px] text-slate-500 font-mono uppercase mt-0.5">
              Defina um nome personalizado para o lote que será inserido diretamente nos relatórios JSON e PDF de auditoria.
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-sm w-full pl-2 md:pl-0">
          <input
            id="input-custom-batch-name"
            type="text"
            value={customBatchName}
            onChange={(e) => setCustomBatchName(e.target.value)}
            placeholder={activeBlock ? `${activeBlock.title} - Customizado` : "Digite o nome personalizado do lote..."}
            className="w-full bg-[#040813] border border-slate-800 focus:border-cyan-500 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 font-mono transition-all"
          />
        </div>
      </div>

      {/* Audit stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-lg flex flex-col gap-1">
          <span className="font-mono text-[8px] text-slate-500 uppercase">Capacidade Total</span>
          <span className="font-mono text-xs text-slate-200 font-bold">
            {totalVoxels} voxels
          </span>
          <div className="h-1 bg-slate-900 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-slate-700 w-full" />
          </div>
        </div>

        <div className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-lg flex flex-col gap-1">
          <span className="font-mono text-[8px] text-slate-500 uppercase">Gravados com Sucesso</span>
          <span className="font-mono text-xs text-emerald-400 font-bold">
            {recordedCount - corruptedIndices.size} voxels
          </span>
          <div className="h-1 bg-slate-900 rounded-full overflow-hidden mt-1">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${totalVoxels > 0 ? ((recordedCount - corruptedIndices.size) / totalVoxels) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-lg flex flex-col gap-1">
          <span className="font-mono text-[8px] text-slate-500 uppercase">Voxels Corrompidos</span>
          <span className={`font-mono text-xs font-bold ${corruptedIndices.size > 0 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
            {corruptedIndices.size} voxels
          </span>
          <div className="h-1 bg-slate-900 rounded-full overflow-hidden mt-1">
            <div 
              className="h-full bg-red-500 transition-all duration-300" 
              style={{ width: `${totalVoxels > 0 ? (corruptedIndices.size / totalVoxels) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-lg flex flex-col gap-1">
          <span className="font-mono text-[8px] text-slate-500 uppercase">Taxa de Integridade</span>
          <span className={`font-mono text-xs font-bold ${state.instabilityActive ? 'text-amber-500' : 'text-cyan-400'}`}>
            {recordedCount > 0 
              ? `${Math.floor(((recordedCount - corruptedIndices.size) / recordedCount) * 100)}%` 
              : '100%'}
          </span>
          <div className="h-1 bg-slate-900 rounded-full overflow-hidden mt-1">
            <div 
              className={`h-full transition-all duration-300 ${state.instabilityActive ? 'bg-amber-500' : 'bg-cyan-400'}`}
              style={{ 
                width: `${recordedCount > 0 ? ((recordedCount - corruptedIndices.size) / recordedCount) * 100 : 100}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Main interactive sections (Split list and detailed bento panel) */}
      <div className="flex flex-col lg:flex-row gap-4">
        
        {/* Left side: Voxel index status grid & details box */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          
          {/* Subheader and search filter tab bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-cyan-500" />
              <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Grade de Silício (Vista Logística)
              </span>
            </div>
            
            <div className="flex items-center bg-slate-950/60 p-0.5 rounded border border-slate-900 gap-1 overflow-x-auto">
              {(['all', 'completed', 'corrupted', 'pending'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => { playClickSfx(); setLogFilter(f); }}
                  className={`px-2 py-0.5 font-mono text-[8px] uppercase font-bold rounded tracking-wide transition-all ${
                    logFilter === f
                      ? 'bg-cyan-500 text-black shadow-[0_0_6px_rgba(6,182,212,0.3)]'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {f === 'all' ? 'Tudo' : f === 'completed' ? 'Ok' : f === 'corrupted' ? 'Erro' : 'Pendente'}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive grid of voxel blocks */}
          {voxels.length > 0 ? (
            <div className="p-3 bg-slate-950/50 border border-slate-900 rounded-lg flex flex-col gap-2">
              <p className="font-sans text-[9px] text-slate-500">
                Selecione qualquer bloco de voxel abaixo para inspecionar seus valores físicos de polarização e birefringência.
              </p>
              
              <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 gap-1 max-h-[140px] overflow-y-auto p-1 border border-slate-900/60 rounded bg-slate-950">
                {voxelLogs.map((log, idx) => {
                  const isSelected = selectedVoxelIdx === idx;
                  let colorClass = 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700'; // Pending
                  
                  if (log.status === 'COMPLETED') {
                    colorClass = 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:border-emerald-400 shadow-[0_0_2px_rgba(16,185,129,0.1)]';
                  } else if (log.status === 'CORRUPTED') {
                    colorClass = 'bg-red-950/50 border-red-500/40 text-red-400 hover:border-red-500 animate-pulse';
                  } else if (log.status === 'WRITING') {
                    colorClass = 'bg-cyan-950/50 border-cyan-500 text-cyan-400 animate-pulse';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => { playClickSfx(); setSelectedVoxelIdx(isSelected ? null : idx); }}
                      className={`h-7 rounded border font-mono text-[9px] flex items-center justify-center font-bold transition-all relative group cursor-pointer ${colorClass} ${
                        isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-black scale-105 z-10' : ''
                      }`}
                      title={`Voxel #${idx} | Caractere: ${log.character} | Status: ${log.status}`}
                    >
                      {log.character === '\n' ? '↵' : log.character}
                      
                      {/* Tooltip on hover */}
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black border border-slate-800 px-1.5 py-0.5 rounded text-[8px] font-mono text-gray-300 whitespace-nowrap z-50 shadow-xl">
                        #{idx} [{log.coordinates.x}, {log.coordinates.y}, {log.coordinates.z}]
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 bg-slate-950/50 border border-slate-900 rounded-lg text-center font-mono text-[10px] text-slate-500 italic">
              Nenhum bloco de dados carregado no simulador de quartzo.
            </div>
          )}

          {/* Real-time Streaming Table Log */}
          <div className="flex items-center gap-1 mt-1">
            <Activity className="w-3.5 h-3.5 text-cyan-500" />
            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Fluxo em Tempo Real (Log Técnico)
            </span>
          </div>

          <div className="border border-slate-900 rounded-lg overflow-hidden bg-slate-950">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-1.5 px-3 py-1.5 bg-slate-900 border-b border-slate-900 text-[8px] font-mono text-slate-500 uppercase tracking-wider">
              <div className="col-span-2">VOXEL_ID</div>
              <div className="col-span-4">COORDENADAS_XYZ</div>
              <div className="col-span-2 text-center">ÂNGULO</div>
              <div className="col-span-1 text-center">RETARD.</div>
              <div className="col-span-1 text-center">CHAR</div>
              <div className="col-span-2 text-right">INTEGRIDADE</div>
            </div>

            {/* Table Content */}
            <div 
              ref={scrollContainerRef}
              onWheel={() => { autoScrollRef.current = false; }}
              className="h-36 overflow-y-auto font-mono text-[9px] leading-relaxed divide-y divide-slate-900/60 scrollbar-thin scrollbar-thumb-cyan-950/40"
            >
              {filteredLogs.map((log) => {
                let textCol = 'text-slate-500';
                let bgCol = 'hover:bg-slate-950/30';
                
                if (log.status === 'COMPLETED') {
                  textCol = 'text-slate-300';
                } else if (log.status === 'CORRUPTED') {
                  textCol = 'text-red-400';
                  bgCol = 'bg-red-950/10 hover:bg-red-950/20';
                } else if (log.status === 'WRITING') {
                  textCol = 'text-cyan-400 font-bold';
                  bgCol = 'bg-cyan-950/10 hover:bg-cyan-950/20';
                }

                return (
                  <div 
                    key={log.voxelIndex} 
                    onClick={() => { playClickSfx(); setSelectedVoxelIdx(log.voxelIndex); }}
                    className={`grid grid-cols-12 gap-1.5 px-3 py-1.5 items-center transition-colors cursor-pointer ${bgCol} ${textCol}`}
                  >
                    <div className="col-span-2 font-bold text-slate-400">
                      #{String(log.voxelIndex).padStart(3, '0')}
                    </div>
                    <div className="col-span-4 text-slate-400 font-light truncate">
                      [{log.coordinates.x.toFixed(3)}, {log.coordinates.y.toFixed(3)}, {log.coordinates.z.toFixed(3)}]
                    </div>
                    <div className="col-span-2 text-center">
                      {log.polarizationAngleDeg}°
                    </div>
                    <div className="col-span-1 text-center font-light">
                      {log.opticalRetardance.toFixed(2)}
                    </div>
                    <div className="col-span-1 text-center font-bold">
                      {log.character === '\n' ? '↵' : log.character}
                    </div>
                    <div className="col-span-2 text-right font-bold">
                      {log.status === 'PENDING' ? (
                        <span className="text-slate-600">FILA</span>
                      ) : log.status === 'CORRUPTED' ? (
                        <span className="text-red-500 animate-pulse">ERR {log.integrityPercent}%</span>
                      ) : log.status === 'WRITING' ? (
                        <span className="text-cyan-400 animate-pulse">GRAVANDO</span>
                      ) : (
                        <span className="text-emerald-400">{log.integrityPercent}%</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredLogs.length === 0 && (
                <div className="text-slate-600 italic text-center py-8 text-[9px]">
                  Nenhum registro correspondente ao filtro "{logFilter}"...
                </div>
              )}
            </div>

            {/* Resume Autoscroll Controller */}
            {isEncodingScene && state.isPlaying && !autoScrollRef.current && (
              <div className="px-3 py-1 bg-cyan-950/20 border-t border-slate-900 flex justify-between items-center text-[7.5px] font-mono">
                <span className="text-slate-500">Auto-rolagem desativada por navegação manual</span>
                <button 
                  onClick={() => { playClickSfx(); autoScrollRef.current = true; }}
                  className="text-cyan-400 uppercase hover:underline"
                >
                  Reativar Auto-rolagem
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right side: Detailed Audit Bento Panel */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Relatório de Inspeção 5D
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-3.5 flex-1 flex flex-col gap-3.5 justify-between min-h-[220px]">
            <AnimatePresence mode="wait">
              {selectedVoxelDetail ? (
                <motion.div
                  key={`detail-${selectedVoxelDetail.voxelIndex}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  {/* Title */}
                  <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                    <span className="font-mono text-[10px] font-bold text-cyan-400">
                      VOXEL #{selectedVoxelDetail.voxelIndex}
                    </span>
                    <span className={`font-mono text-[8px] px-1 py-0.5 rounded font-bold uppercase ${
                      selectedVoxelDetail.status === 'COMPLETED' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20' :
                      selectedVoxelDetail.status === 'CORRUPTED' ? 'bg-red-950/60 text-red-400 border border-red-500/20 animate-pulse' :
                      selectedVoxelDetail.status === 'WRITING' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/20' :
                      'bg-slate-900 text-slate-500'
                    }`}>
                      {selectedVoxelDetail.status}
                    </span>
                  </div>

                  {/* Physical Parameters */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                      <div>
                        <span className="text-slate-500 block uppercase text-[7.5px]">Coordenada X</span>
                        <span className="text-slate-200 font-medium">{selectedVoxelDetail.coordinates.x.toFixed(4)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[7.5px]">Coordenada Y</span>
                        <span className="text-slate-200 font-medium">{selectedVoxelDetail.coordinates.y.toFixed(4)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                      <div>
                        <span className="text-slate-500 block uppercase text-[7.5px]">Profundidade Z</span>
                        <span className="text-slate-200 font-medium">{selectedVoxelDetail.coordinates.z.toFixed(4)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[7.5px]">Caractere Binário</span>
                        <span className="text-cyan-400 font-bold">
                          "{selectedVoxelDetail.character === '\n' ? 'Line Break' : selectedVoxelDetail.character}"
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px] font-mono border-t border-slate-900/60 pt-2">
                      <div>
                        <span className="text-slate-500 block uppercase text-[7.5px]">Ângulo Polariz.</span>
                        <span className="text-amber-500 font-bold">{selectedVoxelDetail.polarizationAngleDeg}°</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[7.5px]">Retardância Óptica</span>
                        <span className="text-purple-400 font-bold">{selectedVoxelDetail.opticalRetardance.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                      <div>
                        <span className="text-slate-500 block uppercase text-[7.5px]">Offset do Bit</span>
                        <span className="text-slate-200">{selectedVoxelDetail.bitOffset} bits</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[7.5px]">Integridade Real</span>
                        <span className={`font-bold ${selectedVoxelDetail.integrityPercent === 100 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {selectedVoxelDetail.integrityPercent}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Laser Telemetry Details */}
                  {selectedVoxelDetail.status !== 'PENDING' && (
                    <div className="p-2 bg-slate-950 border border-slate-900 rounded font-mono text-[8.5px] space-y-1.5 mt-2">
                      <div className="text-slate-500 font-bold uppercase text-[7.5px] border-b border-slate-900 pb-1 flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-cyan-400" />
                        Parâmetros Físicos do Laser
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Energia Laser:</span>
                        <span className="text-slate-300 font-bold">{selectedVoxelDetail.laserParameters.powerGwCm2} GW/cm²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Duração de Pulso:</span>
                        <span className="text-slate-300">220 fs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Comprimento de Onda:</span>
                        <span className="text-slate-300">515 nm (Verde)</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-3 font-mono">
                  <HelpCircle className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-[10px] text-slate-500 leading-normal uppercase">
                    Nenhum voxel selecionado
                  </p>
                  <p className="text-[8.5px] text-slate-600 mt-1 leading-normal">
                    Clique em qualquer quadrado ou linha de registro para inspecionar parâmetros ópticos 5D detalhados em tempo real.
                  </p>
                </div>
              )}
            </AnimatePresence>

            {/* Quick calibration footer note */}
            <div className="p-2 bg-[#0A162B]/50 border border-cyan-950/40 rounded flex items-start gap-1.5 mt-auto">
              <Sparkles className="w-3.5 h-3.5 text-[#ffe600] shrink-0 mt-0.5" />
              <p className="font-mono text-[8px] text-slate-400 leading-relaxed uppercase">
                Chaves e assinaturas digitais são convertidas em micro-reentrâncias retardantes permanentes na microestrutura do cristal.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Certificado de Conformidade DREX Modal Overlay */}
      <CertificadoConformidade
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
        activeBlock={activeBlock}
        totalVoxels={totalVoxels}
        purity={state.purity}
        recordedCount={recordedCount}
        corruptedCount={corruptedIndices.size}
      />
    </div>
  );
}
