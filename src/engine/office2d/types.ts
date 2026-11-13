// RuntimeClips-Web — Tipos e interfaces del Motor Isométrico 2D (inspirado en myoffice)

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type AgentStatus =
  | 'thinking'
  | 'tool'
  | 'typing'
  | 'waiting'
  | 'done'
  | 'error'
  | 'idle'
  | 'interrupted';

export type ActivityAction =
  | 'coffee'
  | 'water'
  | 'fridge'
  | 'sink'
  | 'stool'
  | 'couch'
  | 'beanbag'
  | 'window'
  | 'read'
  | 'whiteboard'
  | 'meeting'
  | 'arcade'
  | 'pingpong'
  | 'plant'
  | 'vending'
  | 'foosball'
  | 'phone'
  | 'nap'
  | 'think'
  | 'type'
  | 'wave'
  | 'station';

export interface DeskSlot {
  id: string;
  x: number;
  y: number;
  side: 'n' | 's';
  seat: Point2D;
  agentKey?: string;
  napper?: string | null;
  pose?: 'sit' | 'stand';
}

export interface POI {
  x: number;
  y: number;
  act: ActivityAction;
  face: 'front' | 'back' | 'side';
  sit?: number;
  pair?: string;
  sleepy?: boolean;
  taken?: string | null;
  desk?: DeskSlot;
}

export interface PropItem {
  t: string;
  x: number;
  y: number;
  w?: number;
  d?: number;
  h?: number;
  color?: string;
  face?: 'front' | 'back' | 'side';
}

export interface AgentBadge {
  label: string;
  short: string;
  color: string;
  icon?: string;
}

export interface AgentSession {
  key: string;
  agent: string;
  name: string;
  role: string;
  status: AgentStatus;
  progress: number;
  taskSummary?: string;
  startedAt?: number;
  lastEventAt?: number;
  subagent?: boolean;
  logs?: string[];
  clipCount?: number;
}

export interface Person {
  key: string;
  h: number;
  s: AgentSession;
  skin: string;
  hair: string;
  pants: string;
  shirt: string;
  hairStyle: number;
  phase: number;
  x: number;
  y: number;
  path: Point2D[];
  walkFace: 'front' | 'back';
  until: number;
  stay?: number;
  mode: 'work' | 'wander' | 'leave' | null;
  desk?: DeskSlot | null;
  napDesk?: DeskSlot | null;
  poi?: POI | null;
  pose?: 'sit' | 'stand' | 'walk';
  placeOnArrive?: boolean;
  leaving?: boolean;
}

export interface ThemePalette {
  dark: boolean;
  wood1: string;
  wood2: string;
  woodLine: string;
  tileA: string;
  tileB: string;
  carpet: string;
  carpetLine: string;
  wallL: string;
  wallR: string;
  wallTop: string;
  trim: string;
  deskTop: string;
  deskL: string;
  deskR: string;
  monitor: string;
  screenOff: string;
  chair: string;
  rug: string;
  rugEdge: string;
  couch: string;
  couchD: string;
  counter: string;
  counterL: string;
  counterR: string;
  metal: string;
  glass: string;
  glassEdge: string;
  mat: string;
  text: string;
  tagBg: string;
  bubble: string;
  bubbleInk: string;
  plant: string;
  pot: string;
  shadow: string;
  book: string[];
}

export interface HitTarget {
  key: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface OfficePlan {
  W: number;
  D: number;
  OW: number;
  OD: number;
  MR: number;
  PY: number;
  RW: number;
  grid: any;
  items: Array<{ depth: number; draw: () => void }>;
  props: PropItem[];
  pois: POI[];
  desks: DeskSlot[];
  windows: number[];
  posters: Array<{ y: number; color: string; text: string }>;
  pp: { x0: number; x1: number; y: number };
  door: Point2D;
  fixed?: boolean;
  noNap?: boolean;
}
