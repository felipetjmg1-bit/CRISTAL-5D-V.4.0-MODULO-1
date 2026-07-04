export enum StorageScene {
  RAW_SOURCE = 'RAW_SOURCE',
  MINING_PURITY = 'MINING_PURITY',
  ELEMENT_INJECTION = 'ELEMENT_INJECTION',
  FIVE_D_ENCODING = 'FIVE_D_ENCODING',
  FINAL_PRODUCT = 'FINAL_PRODUCT'
}

export interface SceneConfig {
  id: StorageScene;
  number: number;
  title: string;
  subtitle: string;
  promptText: string;
  narration: string;
  styleNotes: string[];
  scientificBase: {
    title: string;
    description: string;
    parameters: Array<{ name: string; value: string; unit?: string }>;
  };
  imagePath: string;
}

export interface Voxel5D {
  x: number;          // Space X (-1 to 1)
  y: number;          // Space Y (-1 to 1)
  z: number;          // Space Z (-1 to 1)
  theta: number;      // Polarization angle (0 to 180 degrees)
  intensity: number;  // Optical retardance/void size (0 to 1)
  char: string;       // Character encoded
  bitIndex: number;   // Index in bitstream
}

export interface CrystalDataBlock {
  id: string;
  title: string;
  payload: string;
  type: 'DREX_TX' | 'SMART_CONTRACT' | 'CUSTOM_TEXT' | 'SYSTEM_METADATA';
  timestamp: number;
  hash: string;
  voxels: Voxel5D[];
  sizeKb: number;
}

export interface SimulationState {
  currentScene: StorageScene;
  isPlaying: boolean;
  playProgress: number; // 0 to 100 within current scene
  purity: number; // 0 to 100 (for Scene 2)
  erbiumLevel: number; // 0 to 100 (for Scene 3)
  lithiumLevel: number; // 0 to 100 (for Scene 3)
  writingProgress: number; // 0 to 100 (for Scene 4)
  activeDataBlockId: string | null;
  soundEnabled: boolean;
  instabilityActive: boolean;
  instabilitySeverity: number;
  laserFrequency: number; // pulse frequency in THz
  laserDepth: number; // writing depth in nanometers
  laserBurstMode: boolean; // whether high-speed random pulse oscillation is active
}
