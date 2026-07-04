import { Voxel5D, CrystalDataBlock } from '../types';

/**
 * Converts a text string into a list of 5D voxels using realistic
 * 5D optical storage principles.
 * 
 * Each voxel encodes 4 bits:
 * - 2 bits in Polarization Angle (0°, 45°, 90°, 135°)
 * - 2 bits in Optical Intensity/Retardance (0.25, 0.50, 0.75, 1.00)
 * 
 * They are physically laid out in a concentric spiral within circular layers (Z depth).
 */
export function encodeTextTo5D(text: string, blockType: string = 'CUSTOM_TEXT'): Voxel5D[] {
  const voxels: Voxel5D[] = [];
  if (!text) return [];

  // Convert string to bytes
  const bytes = Array.from(new TextEncoder().encode(text));
  let bitIndex = 0;

  // Parameters for spiral layout
  const layers = 5; // 5 separate Z depth layers
  const tracksPerLayer = 8;
  const voxelsPerTrackBase = 12;

  bytes.forEach((byte, byteIdx) => {
    // A byte has 8 bits, split into two 4-bit nibbles (each nibble is 1 voxel)
    const char = text[Math.floor(byteIdx)] || '?';
    const nibbles = [
      (byte >> 4) & 0x0f, // Upper 4 bits
      byte & 0x0f         // Lower 4 bits
    ];

    nibbles.forEach((nibble, nibbleIdx) => {
      // Split nibble: 2 bits for polarization, 2 bits for retardance
      const polBits = (nibble >> 2) & 0x03; // 2 bits
      const intBits = nibble & 0x03;        // 2 bits

      // Map to physical values
      const theta = polBits * 45; // 0, 45, 90, 135 degrees
      const intensity = 0.25 + intBits * 0.25; // 0.25, 0.50, 0.75, 1.00

      // Compute geometric positions in a spiral
      // We determine which layer, track, and angle based on voxel count
      const voxelIdx = voxels.length;
      
      // Select layer
      const layerIdx = voxelIdx % layers;
      const z = -0.6 + (layerIdx / (layers - 1)) * 1.2; // Z from -0.6 to +0.6

      // Select spiral track
      const totalVoxelsInLayer = Math.floor(voxelIdx / layers);
      const trackIdx = Math.min(tracksPerLayer - 1, Math.floor(totalVoxelsInLayer / voxelsPerTrackBase));
      const voxelsInThisTrack = voxelsPerTrackBase + trackIdx * 4;
      const positionInTrack = totalVoxelsInLayer % voxelsInThisTrack;

      // Spiral radius and angle
      const minRadius = 0.15;
      const maxRadius = 0.85;
      const radiusStep = (maxRadius - minRadius) / tracksPerLayer;
      const r = minRadius + trackIdx * radiusStep + (positionInTrack / voxelsInThisTrack) * radiusStep * 0.5;

      const phi = (positionInTrack / voxelsInThisTrack) * Math.PI * 2 + (trackIdx * Math.PI / 4);

      // Polar to cartesian coordinates
      const x = r * Math.cos(phi);
      const y = r * Math.sin(phi);

      voxels.push({
        x,
        y,
        z,
        theta,
        intensity,
        char,
        bitIndex: bitIndex + (nibbleIdx * 4)
      });
    });

    bitIndex += 8;
  });

  return voxels;
}

/**
 * Utility to generate a cryptographic-style hash string for blockchain/DREX logs
 */
export function generateHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `0X${hex}F294C7${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}E81B`;
}

/**
 * Creates a pre-populated list of digital Brazilian DREX blocks ready to archive.
 */
export function getPresetDrexBlocks(): Omit<CrystalDataBlock, 'voxels'>[] {
  return [
    {
      id: 'drex-tx-001',
      title: 'Transação Interbancária DREX #84920',
      type: 'DREX_TX',
      payload: `{\n  "bloco": 84920,\n  "rede": "DREX_REDE_PRINCIPAL",\n  "transacoes": 422,\n  "liquidacao": "Banco Central do Brasil",\n  "validador": "Aurora-Soberano-Lab-01",\n  "carimbo_tempo": 1782947600,\n  "hash_ledger": "D5F294C7931E81B"\n}`,
      timestamp: Date.now() - 3600000 * 2,
      hash: '0XD5F294C7931E81B8283E1A',
      sizeKb: 1.4
    },
    {
      id: 'drex-sc-002',
      title: 'Contrato Inteligente de Título Verde Soberano v2.1',
      type: 'SMART_CONTRACT',
      payload: `pragma solidity ^0.8.20;\n\ncontract TituloVerdeSoberano {\n  string public constant nome = "Titulo Verde Aurora Soberano";\n  uint256 public constant compensacaoCarbonoToneladas = 500000;\n  address public emissor = 0xAuroraSoberano777;\n  \n  function certificarArmazenamento() external pure returns (string memory) {\n    return "COFRE_ETERNO_QUARTZO_5D";\n  }\n}`,
      timestamp: Date.now() - 1800000,
      hash: '0X027A4D789B9E1C2C907A3E',
      sizeKb: 3.2
    },
    {
      id: 'drex-sys-003',
      title: 'Telemetria de Calibração Ambiental Aurora Soberano',
      type: 'SYSTEM_METADATA',
      payload: `{\n  "equipamento": "Aurora-GravadorFemto-V4",\n  "comprimento_onda_nm": 515,\n  "temperatura_ambiente_c": 21.4,\n  "classe_sala_limpa": 100,\n  "vacuo_torr": 1e-6,\n  "gas_dopagem": "He-Argon",\n  "status": "CALIBRACAO_OTIMA"\n}`,
      timestamp: Date.now() - 300000,
      hash: '0X9F44781A837A8B7C23A401',
      sizeKb: 0.8
    }
  ];
}
