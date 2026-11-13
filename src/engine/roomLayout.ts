// RuntimeClips-Web — Layout de la Sala Cafetería / Estudio Agéntico (Inspirado en Imagen 2)
// Cuadrícula 14x14 con zonas diferenciadas: Cafetería, Lounge Creativo, Despachos CRT, Almacén y Cine.

export interface RenderItem {
  id: string;
  type: 'tile' | 'wall' | 'window' | 'furni' | 'avatar' | 'steam';
  x: number;
  y: number;
  z: number;
  sprite: HTMLCanvasElement;
  offsetX: number;
  offsetY: number;
  depthSortOffset?: number;
  nodeKey?: string; // Si está asociado a un nodo del pipeline
  isClickable?: boolean;
}

export interface AgentVisualConfig {
  key: string;
  name: string;
  role: string;
  gridX: number;
  gridY: number;
  gridZ: number;
  skinColor: string;
  hairColor: string;
  hairStyle: 'bob' | 'spiky' | 'cap' | 'visor' | 'glasses' | 'headset' | 'beret';
  shirtColor: string;
  pantsColor: string;
  seatType: 'desk' | 'couch' | 'bar';
}

export const ROOM_WIDTH = 14;
export const ROOM_HEIGHT = 14;

// Configuración de los 10 agentes dentro de la Cafetería / Estudio
export const AGENT_CONFIGS: Record<string, AgentVisualConfig> = {
  input: {
    key: 'input',
    name: 'Nexus',
    role: 'Recepción & Barista',
    gridX: 2,
    gridY: 3,
    gridZ: 0,
    skinColor: '#fbd38d',
    hairColor: '#eab308',
    hairStyle: 'bob',
    shirtColor: '#0284c7',
    pantsColor: '#0f172a',
    seatType: 'bar',
  },
  ingest: {
    key: 'ingest',
    name: 'Byte',
    role: 'Descarga Datacenter',
    gridX: 2,
    gridY: 7,
    gridZ: 0,
    skinColor: '#f6ad55',
    hairColor: '#0f172a',
    hairStyle: 'headset',
    shirtColor: '#06b6d4',
    pantsColor: '#1e293b',
    seatType: 'desk',
  },
  transcribe: {
    key: 'transcribe',
    name: 'Echo',
    role: 'Whisper Studio',
    gridX: 6,
    gridY: 2,
    gridZ: 0,
    skinColor: '#ed8936',
    hairColor: '#9333ea',
    hairStyle: 'headset',
    shirtColor: '#a855f7',
    pantsColor: '#111827',
    seatType: 'couch',
  },
  hook: {
    key: 'hook',
    name: 'Viral',
    role: 'Dirección Viral',
    gridX: 8,
    gridY: 2,
    gridZ: 0,
    skinColor: '#fbd38d',
    hairColor: '#c2410c',
    hairStyle: 'cap',
    shirtColor: '#f97316',
    pantsColor: '#1e293b',
    seatType: 'couch',
  },
  // Ramas de producción de clips
  reframe: {
    key: 'reframe',
    name: 'Focus',
    role: 'Reframe UltraFace',
    gridX: 5,
    gridY: 6,
    gridZ: 0,
    skinColor: '#f6ad55',
    hairColor: '#164e63',
    hairStyle: 'visor',
    shirtColor: '#06b6d4',
    pantsColor: '#0f172a',
    seatType: 'desk',
  },
  overlays: {
    key: 'overlays',
    name: 'Vector',
    role: 'Motion Designer',
    gridX: 7,
    gridY: 6,
    gridZ: 0,
    skinColor: '#fbd38d',
    hairColor: '#831843',
    hairStyle: 'beret',
    shirtColor: '#ec4899',
    pantsColor: '#1e293b',
    seatType: 'desk',
  },
  captions: {
    key: 'captions',
    name: 'Typo',
    role: 'Tipografía ASS',
    gridX: 5,
    gridY: 9,
    gridZ: 0,
    skinColor: '#f6ad55',
    hairColor: '#713f12',
    hairStyle: 'glasses',
    shirtColor: '#eab308',
    pantsColor: '#0f172a',
    seatType: 'desk',
  },
  render: {
    key: 'render',
    name: 'Master',
    role: 'Render NVENC',
    gridX: 7,
    gridY: 9,
    gridZ: 0,
    skinColor: '#ed8936',
    hairColor: '#064e3b',
    hairStyle: 'spiky',
    shirtColor: '#10b981',
    pantsColor: '#1e293b',
    seatType: 'desk',
  },
  // Join final
  collector: {
    key: 'collector',
    name: 'Boxer',
    role: 'Empaquetador .ZIP',
    gridX: 11,
    gridY: 6,
    gridZ: 0,
    skinColor: '#f6ad55',
    hairColor: '#7c2d12',
    hairStyle: 'spiky',
    shirtColor: '#ea580c',
    pantsColor: '#1e293b',
    seatType: 'desk',
  },
  player: {
    key: 'player',
    name: 'Showcase',
    role: 'Cine & Visualizador',
    gridX: 11,
    gridY: 10,
    gridZ: 0,
    skinColor: '#fbd38d',
    hairColor: '#1e1b4b',
    hairStyle: 'bob',
    shirtColor: '#4f46e5',
    pantsColor: '#0f172a',
    seatType: 'couch',
  },
};
