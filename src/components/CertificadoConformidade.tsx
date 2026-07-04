import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CrystalDataBlock } from '../types';
import { ShieldCheck, Download, Printer, X, Award, CheckCircle, Info } from 'lucide-react';
import { playClickSfx } from '../utils/audio';
import { jsPDF } from 'jspdf';

interface CertificadoConformidadeProps {
  isOpen: boolean;
  onClose: () => void;
  activeBlock: CrystalDataBlock | null;
  totalVoxels: number;
  purity: number;
  recordedCount: number;
  corruptedCount: number;
}

export default function CertificadoConformidade({
  isOpen,
  onClose,
  activeBlock,
  totalVoxels,
  purity,
  recordedCount,
  corruptedCount
}: CertificadoConformidadeProps) {

  // Play a beautiful success chime if the modal opens automatically
  useEffect(() => {
    if (isOpen) {
      try {
        // Play click or sound effect
        playClickSfx();
      } catch (e) {
        console.warn('Audio play failed', e);
      }
    }
  }, [isOpen]);

  const overallIntegrityScore = totalVoxels > 0
    ? Math.floor(((recordedCount - corruptedCount) / totalVoxels) * 100)
    : 100;

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
    doc.text("CERTIFICADO DE CONFORMIDADE E REGISTRO DREX", pageWidth / 2, 66, { align: "center" });

    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(11, 60, 31); // Forest Green
    doc.text("GRAVAÇÃO FÍSICA PERMANENTE EM MÍDIA DE QUARTZO CRISTALINO 5D", pageWidth / 2, 71, { align: "center" });

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
    drawRow(tableStartY + 11, "Identificação do Lote:", activeBlock.title);
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
    doc.text(`Gravações Efetuadas com Sucesso: ${recordedCount - corruptedCount} voxels`, 24, metricsY + 23);
    doc.text(`Anomalias de Foco Detectadas: ${corruptedCount} voxels`, 24, metricsY + 29);
    doc.text(`Quartzo de Sílica (SiO2) Pureza: ${(99.8 + (purity * 0.001999)).toFixed(4)}%`, 24, metricsY + 35);

    // Overall integrity badge inside metrics box
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
    doc.save(`CERTIFICADO_CONFORMIDADE_DREX_${activeBlock.id}.pdf`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-3xl bg-white shadow-2xl rounded-xl border border-slate-200 overflow-hidden text-slate-800 flex flex-col my-8"
          >
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes draw-signature {
                to {
                  stroke-dashoffset: 0;
                }
              }
              .animated-signature-path-1 {
                stroke-dasharray: 400;
                stroke-dashoffset: 400;
                animation: draw-signature 2.5s cubic-bezier(0.3, 0.1, 0.3, 1) forwards;
                animation-delay: 0.6s;
              }
              .animated-signature-path-2 {
                stroke-dasharray: 150;
                stroke-dashoffset: 150;
                animation: draw-signature 1.5s cubic-bezier(0.3, 0.1, 0.3, 1) forwards;
                animation-delay: 2.8s;
              }
              @media print {
                body * {
                  visibility: hidden;
                }
                #drex-visual-certificate-paper, #drex-visual-certificate-paper * {
                  visibility: visible;
                }
                #drex-visual-certificate-paper {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  max-width: 100%;
                  box-shadow: none;
                  border: none;
                  padding: 0;
                  margin: 0;
                  background: #fcfbf6 !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}} />

            {/* Top bar controls */}
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0 no-print">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider">
                    HOMOLOGAÇÃO DE LEDGER DREX CONCLUÍDA
                  </h4>
                  <p className="text-[9px] text-emerald-400 font-mono animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Sincronização Final Operacional 100%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playClickSfx();
                    window.print();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-bold rounded uppercase transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white font-mono text-[10px] font-bold rounded uppercase transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar PDF
                </button>
                <button
                  onClick={() => { playClickSfx(); onClose(); }}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification of automatic display */}
            <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 flex items-start gap-2.5 text-[11px] text-emerald-800 font-medium no-print">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-950 font-bold">Processo de Sincronização Concluído!</strong> O bloco foi homologado e seu respectivo Certificado de Conformidade Governamental foi gerado automaticamente pela rede soberana.
              </div>
            </div>

            {/* Scrollable container for the certificate */}
            <div className="overflow-y-auto p-6 md:p-10 max-h-[70vh] bg-[#fdfdfc] flex justify-center items-center print:p-0">
              {/* Visual Certificate Paper Sheet (styled like government parchment) */}
              <div 
                id="drex-visual-certificate-paper" 
                className="w-full max-w-2xl bg-[#fcfbf6] border-[6px] border-[#0b3c1f] p-8 md:p-12 relative shadow-lg overflow-hidden flex flex-col gap-6"
                style={{ backgroundImage: 'radial-gradient(#b8860b 0.4px, transparent 0.4px)', backgroundSize: '16px 16px' }}
              >
                {/* Thin Golden inner line */}
                <div className="absolute inset-2 border border-[#b8860b]/60 pointer-events-none" />
                
                {/* Ornate corner star icons */}
                <div className="absolute top-4 left-4 text-[#b8860b] font-serif text-[10px]">✦</div>
                <div className="absolute top-4 right-4 text-[#b8860b] font-serif text-[10px]">✦</div>
                <div className="absolute bottom-4 left-4 text-[#b8860b] font-serif text-[10px]">✦</div>
                <div className="absolute bottom-4 right-4 text-[#b8860b] font-serif text-[10px]">✦</div>

                {/* Header / Government emblem */}
                <div className="text-center flex flex-col items-center gap-2 relative z-10">
                  {/* Brasão da República Simulado em Tailwind */}
                  <div className="w-16 h-16 rounded-full border-2 border-[#b8860b] p-0.5 bg-white shadow-sm flex items-center justify-center relative">
                    <div className="w-full h-full rounded-full bg-[#0b3c1f] flex items-center justify-center relative overflow-hidden">
                      {/* Blue globe core */}
                      <div className="w-10 h-10 rounded-full bg-[#0f2043] flex items-center justify-center border border-yellow-500/30">
                        {/* Simulated cross stars */}
                        <div className="absolute w-6 h-px bg-yellow-400/80" />
                        <div className="absolute h-6 w-px bg-yellow-400/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse z-10" />
                      </div>
                      {/* Outer laurel leaf vectors */}
                      <div className="absolute inset-0 border-2 border-dashed border-yellow-500/20 rounded-full" />
                    </div>
                    {/* Top gold ribbon */}
                    <div className="absolute -top-1 px-1 bg-yellow-500 text-slate-950 font-mono text-[7px] font-bold rounded uppercase">
                      Soberano
                    </div>
                  </div>

                  <div className="mt-2 text-center">
                    <h2 className="font-serif text-xs md:text-sm font-bold text-[#0b3c1f] uppercase tracking-wider">
                      REPÚBLICA FEDERATIVA DO BRASIL
                    </h2>
                    <h1 className="font-serif text-sm md:text-base font-bold text-[#0f2043] uppercase tracking-wide mt-0.5">
                      SISTEMA AURORA SOBERANO
                    </h1>
                    <p className="font-serif text-[8px] md:text-[9px] text-slate-500 tracking-widest uppercase font-medium mt-1">
                      UNIDADE DE SOBERANIA TECNOLÓGICA E SEGURANÇA NACIONAL DE DADOS
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center justify-center gap-2">
                  <div className="h-0.5 bg-[#b8860b]/40 flex-1" />
                  <div className="w-2 h-2 rounded-full bg-[#b8860b]" />
                  <div className="h-0.5 bg-[#b8860b]/40 flex-1" />
                </div>

                {/* Certificate Main Title */}
                <div className="text-center">
                  <h3 className="font-serif text-sm md:text-lg font-black text-[#0f2043] tracking-normal">
                    CERTIFICADO DE CONFORMIDADE E REGISTRO DREX
                  </h3>
                  <p className="font-serif text-[9px] md:text-[10px] text-[#0b3c1f] font-bold uppercase tracking-wider mt-1">
                    GRAVAÇÃO FÍSICA PERMANENTE EM MÍDIA DE QUARTZO CRISTALINO 5D
                  </p>
                </div>

                {/* Legal Statement Text */}
                <div className="text-justify font-serif text-xs leading-relaxed text-slate-700 font-medium px-2">
                  <p>
                    Certificamos, para todos os fins de direito público e privado, salvaguarda perpétua de dados de segurança cibernética e soberania nacional, que as informações financeiras e de infraestrutura do ledger contidas no bloco especificado abaixo foram gravadas permanentemente em estrutura atômica de silicato de quartzo puro de alta densidade por meio de tecnologia de deposição a laser pulsado de femtossegundo 5D, estando em plena conformidade com as diretrizes normativas de auditoria do Banco Central do Brasil e os protocolos de criptografia permanente da rede DREX.
                  </p>
                </div>

                {/* Metadata Table Card */}
                <div className="bg-[#f7f6f0] border border-[#b8860b]/60 rounded p-1">
                  <div className="border border-[#b8860b]/30 rounded overflow-hidden">
                    <table className="w-full font-serif text-[10px] md:text-xs text-left border-collapse">
                      <tbody>
                        <tr className="border-b border-[#b8860b]/20">
                          <td className="px-3 py-2 bg-[#f0eee4] font-bold text-[#0b3c1f] w-1/3">ID do Bloco:</td>
                          <td className="px-3 py-2 font-mono text-[9px] text-slate-800">{activeBlock?.id}</td>
                        </tr>
                        <tr className="border-b border-[#b8860b]/20">
                          <td className="px-3 py-2 bg-[#f0eee4] font-bold text-[#0b3c1f]">Identificação do Lote:</td>
                          <td className="px-3 py-2 font-bold text-slate-900">
                            {activeBlock?.title}
                          </td>
                        </tr>
                        <tr className="border-b border-[#b8860b]/20">
                          <td className="px-3 py-2 bg-[#f0eee4] font-bold text-[#0b3c1f]">Tipo de Dados:</td>
                          <td className="px-3 py-2 font-bold text-slate-800">{activeBlock?.type}</td>
                        </tr>
                        <tr className="border-b border-[#b8860b]/20">
                          <td className="px-3 py-2 bg-[#f0eee4] font-bold text-[#0b3c1f]">Padrão Tecnológico:</td>
                          <td className="px-3 py-2 font-serif text-slate-800">DREX SOBERANO v1.0 / PROTOCOLO AURORA 5D</td>
                        </tr>
                        <tr className="border-b border-[#b8860b]/20">
                          <td className="px-3 py-2 bg-[#f0eee4] font-bold text-[#0b3c1f]">Tamanho do Payload:</td>
                          <td className="px-3 py-2 text-slate-800">{activeBlock?.payload.length} caracteres (ASCII / UTF-8)</td>
                        </tr>
                        <tr className="border-b border-[#b8860b]/20">
                          <td className="px-3 py-2 bg-[#f0eee4] font-bold text-[#0b3c1f]">Assinatura Ledger (Hash):</td>
                          <td className="px-3 py-2 font-mono text-[8px] md:text-[9px] text-[#0f2043] select-all break-all">{activeBlock?.hash}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 bg-[#f0eee4] font-bold text-[#0b3c1f]">Data de Emissão:</td>
                          <td className="px-3 py-2 text-slate-800">{activeBlock ? new Date(activeBlock.timestamp).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Physical Integrity Metrics Badge and Box */}
                <div className="border border-[#0b3c1f]/40 bg-[#f2f5f0] p-4 rounded flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="font-serif text-xs text-slate-700 space-y-1">
                    <h4 className="font-bold text-[#0b3c1f] text-[11px] uppercase">
                      Métricas Físicas de Deposição e Integridade de Voxels
                    </h4>
                    <p>Capacidade Total Lote: <strong className="text-slate-900">{totalVoxels} voxels</strong></p>
                    <p>Gravações Efetuadas com Sucesso: <strong className="text-slate-900">{recordedCount - corruptedCount} voxels</strong></p>
                    <p>Anomalias de Foco Detectadas: <strong className={corruptedCount > 0 ? "text-red-600 font-bold" : "text-slate-900"}>{corruptedCount} voxels</strong></p>
                    <p>Quartzo de Sílica (SiO2) Pureza: <strong className="text-slate-900">{(99.8 + (purity * 0.001999)).toFixed(4)}%</strong></p>
                  </div>

                  <div className="bg-white border-2 border-[#b8860b] p-3 rounded text-center w-full md:w-auto min-w-[140px] shadow-sm">
                    <span className="font-serif font-bold text-[8px] text-[#0f2043] block tracking-wider uppercase">
                      TAXA GERAL DE SOBERANIA
                    </span>
                    <span className={`font-serif font-black text-lg block my-0.5 ${overallIntegrityScore >= 95 ? "text-[#0b3c1f]" : "text-red-700"}`}>
                      {overallIntegrityScore}% INTEGRIDADE
                    </span>
                    <span className="font-serif italic text-[7px] text-slate-500 block uppercase">
                      {overallIntegrityScore >= 95 ? "CRISTALINA ESTÁVEL" : "OSCILAÇÃO PARCIAL"}
                    </span>
                  </div>
                </div>

                {/* Footer Seal stamp and handwritten-style signature */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 pt-4">
                  {/* Official Green Stamp Seal */}
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full border-2 border-double border-[#0b3c1f] p-0.5 flex items-center justify-center bg-transparent shrink-0">
                      <div className="w-full h-full rounded-full border border-dashed border-[#0b3c1f] flex flex-col items-center justify-center text-center p-1 text-[#0b3c1f]">
                        <span className="text-[4px] font-sans font-bold leading-none">REDE DREX</span>
                        <span className="text-[7px] font-serif font-black leading-none my-0.5 tracking-tighter">SOBERANA</span>
                        <span className="text-[4px] font-sans font-medium leading-none">CHANCELADO</span>
                        <span className="text-[3.5px] font-mono leading-none mt-0.5 uppercase">SYSTEM AURORA</span>
                      </div>
                    </div>
                    <div className="font-serif">
                      <p className="text-[10px] font-bold text-[#0b3c1f] uppercase leading-snug">Chancelaria Digital</p>
                      <p className="text-[8px] text-slate-500 leading-normal uppercase">Lote chancelado via Ledger Central DREX.</p>
                    </div>
                  </div>

                  {/* Blue Ink vector handwriting signature */}
                  <div className="flex flex-col items-center text-center relative max-w-[240px]">
                    {/* Handwriting Cursive Path representation with stroke-dashoffset animation */}
                    <div className="h-10 w-44 relative flex items-center justify-center no-select pointer-events-none">
                      <svg className="w-full h-full absolute inset-0 text-blue-800" viewBox="0 0 100 25" fill="none" stroke="currentColor">
                        {/* Simulated realistic cursive calligraphic strokes for signature "Felipe Marcos" */}
                        <path 
                          className="animated-signature-path-1"
                          d="M 5,18 C 12,5 15,10 18,3 C 21,12 10,22 17,14 C 23,10 25,6 29,14 C 33,20 37,12 40,16 C 45,22 42,6 48,12 C 54,18 52,10 56,14 C 60,18 64,4 68,10 C 72,16 75,12 79,15 C 83,18 86,5 92,12" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />
                        {/* Majestic flourish underline swash */}
                        <path 
                          className="animated-signature-path-2"
                          d="M 3,19 Q 45,24 95,16" 
                          strokeWidth="1.0" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />
                      </svg>
                    </div>

                    <div className="w-full h-px bg-[#b8860b]/40 my-1" />
                    
                    <p className="font-serif text-[10px] font-bold text-[#0f2043]">
                      Felipe Marcos de Abreu Aquino
                    </p>
                    <p className="font-serif text-[8px] text-slate-600 leading-normal">
                      Arquiteto de Sistemas e Diretor de I.A.
                    </p>
                    <p className="font-serif italic text-[7px] text-slate-400 mt-0.5 leading-none">
                      Plataforma de Soberania Tecnológica Aurora
                    </p>
                  </div>
                </div>

                {/* Cryptographic Ledger Code bottom note */}
                <div className="text-center font-mono text-[7px] text-slate-400 uppercase mt-2 tracking-wider">
                  CODEX_REG_SEC: {activeBlock?.hash.slice(0, 24)}... VALIDATION: SIGNATURE_SOVEREIGN_OK_v4.0.2
                </div>
              </div>
            </div>

            {/* Footer controls */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 no-print">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tight">
                Soberana CleanLab - Aurora Soberano Alpha-7
              </span>
              <button
                onClick={() => { playClickSfx(); onClose(); }}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-mono text-xs font-bold rounded uppercase transition-colors cursor-pointer"
              >
                Fechar Visualizador
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
