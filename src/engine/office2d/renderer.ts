// RuntimeClips-Web — Motor Isométrico 2D de Oficina Agéntica
// Réplica fiel de whatsmyagentdoing (public/office.js) adaptada para los 9 Agentes de RuntimeClips.
// Cero dependencias externas, Canvas 2D puro a 60 FPS con Z-Sorting perfecto y animaciones ricas.

import type {
  Point2D,
  AgentSession,
  Person,
  DeskSlot,
  OfficePlan,
  POI,
  ThemePalette,
  HitTarget,
} from './types';
import { AStarGrid } from './astar';

const TW = 64; // Tile width en px
const TH = 32; // Tile height en px; una unidad z equivale a TH px
const WALL_H = 2.4;
const WORKING_STATUSES = new Set(['thinking', 'tool', 'typing', 'waiting', 'error']);
const MAX_WANDERERS = 7;
const SPEED = 2.1; // Tiles por segundo

const SKIN = ['#f3cfb0', '#e5b38f', '#c98d66', '#9a6646', '#6e4630', '#f7dcc7'];
const HAIR = ['#2a2019', '#4b3020', '#8a4b2a', '#c99a5b', '#1c1c1c', '#8c8c8c', '#a33a2c', '#3d3550'];
const PANTS = ['#34405a', '#2c2c34', '#4a3f35', '#3b4a3f', '#1e293b'];
const PANEL = ['#7d93c4', '#d98b6a', '#7fb08a', '#c9a24c', '#38bdf8', '#818cf8'];

// Paleta de camisetas y badges para los 9 agentes de RuntimeClips
const AGENT_BADGES: Record<
  string,
  { label: string; short: string; color: string; shirt: string[] }
> = {
  ingest: {
    label: 'Ingest Audio',
    short: 'IN',
    color: '#0284c7',
    shirt: ['#0284c7', '#38bdf8', '#0369a1', '#7dd3fc'],
  },
  vision: {
    label: 'Editorial Vision',
    short: 'VI',
    color: '#8b5cf6',
    shirt: ['#8b5cf6', '#a78bfa', '#7c3aed', '#c4b5fd'],
  },
  facetrack: {
    label: 'FaceTrack 9:16',
    short: 'FT',
    color: '#f97316',
    shirt: ['#f97316', '#fb923c', '#ea580c', '#fdba74'],
  },
  music: {
    label: 'Music Sync',
    short: 'MU',
    color: '#ec4899',
    shirt: ['#ec4899', '#f472b6', '#db2777', '#fbcfe8'],
  },
  subtitles: {
    label: 'Subtitles',
    short: 'SB',
    color: '#10b981',
    shirt: ['#10b981', '#34d399', '#059669', '#6ee7b7'],
  },
  broll: {
    label: 'B-Roll & Overlays',
    short: 'BR',
    color: '#06b6d4',
    shirt: ['#06b6d4', '#22d3ee', '#0891b2', '#67e8f9'],
  },
  render: {
    label: 'Render FFmpeg',
    short: 'RN',
    color: '#ef4444',
    shirt: ['#ef4444', '#f87171', '#dc2626', '#fca5a5'],
  },
  qa: {
    label: 'QA Gatekeeper',
    short: 'QA',
    color: '#eab308',
    shirt: ['#eab308', '#facc15', '#ca8a04', '#fde047'],
  },
  publisher: {
    label: 'Social Publisher',
    short: 'PB',
    color: '#22c55e',
    shirt: ['#22c55e', '#4ade80', '#16a34a', '#86efac'],
  },
};

export const STATUS_COLORS: Record<string, string> = {
  thinking: '#8b6be6',
  tool: '#3b8ee0',
  typing: '#22a874',
  waiting: '#e09412',
  done: '#5f9a4c',
  error: '#de4b40',
  interrupted: '#9b9a94',
  idle: '#9b9a94',
};
export const STATUS_COLOR = STATUS_COLORS;

const ACT_EMOJI: Record<string, string> = {
  coffee: '☕',
  water: '💧',
  fridge: '🍎',
  sink: '🫧',
  stool: '💬',
  couch: '💬',
  beanbag: '🎧',
  window: '☁️',
  read: '📖',
  whiteboard: '✏️',
  meeting: '💬',
  arcade: '🎮',
  pingpong: '🏓',
  plant: '🌱',
  vending: '🥤',
  foosball: '⚽',
  phone: '📞',
};

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const pick = <T>(arr: T[], h: number, salt: number): T =>
  arr[(Math.imul(h ^ Math.imul(salt, 2654435761), 2246822519) >>> 0) % arr.length];
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function getPalette(dark = true): ThemePalette {
  return dark
    ? {
        dark: true,
        wood1: '#262228',
        wood2: '#201c22',
        woodLine: 'rgba(0,0,0,.35)',
        tileA: '#2a2d34',
        tileB: '#22252a',
        carpet: '#1e2838',
        carpetLine: 'rgba(255,255,255,.05)',
        wallL: '#313540',
        wallR: '#272a33',
        wallTop: '#3e4452',
        trim: '#1a1c22',
        deskTop: '#5e4835',
        deskL: '#483728',
        deskR: '#382b1f',
        monitor: '#121418',
        screenOff: '#1c1f26',
        chair: '#20242e',
        rug: '#273a38',
        rugEdge: '#1f2e2c',
        couch: '#3d4d6e',
        couchD: '#2e3b55',
        counter: '#9da3af',
        counterL: '#6b7280',
        counterR: '#4b5563',
        metal: '#6b7280',
        glass: 'rgba(120,180,240,.12)',
        glassEdge: 'rgba(150,210,255,.45)',
        mat: '#1d382d',
        text: '#ecebe6',
        tagBg: 'rgba(15,20,30,.88)',
        bubble: '#f4f3ee',
        bubbleInk: '#1c1c1a',
        plant: '#34d399',
        pot: '#854d0e',
        shadow: 'rgba(0,0,0,.45)',
        book: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
      }
    : {
        dark: false,
        wood1: '#e6d3b6',
        wood2: '#dfcaab',
        woodLine: 'rgba(120,90,50,.12)',
        tileA: '#f4f4f1',
        tileB: '#e6e7e3',
        carpet: '#c9d3dc',
        carpetLine: 'rgba(0,0,0,.035)',
        wallL: '#f4efe6',
        wallR: '#e8e1d4',
        wallTop: '#fbf8f2',
        trim: '#cfc5b3',
        deskTop: '#c89f72',
        deskL: '#a8825a',
        deskR: '#946f4b',
        monitor: '#2a2a2e',
        screenOff: '#3a3d44',
        chair: '#4a4a52',
        rug: '#c4d4cb',
        rugEdge: '#a9bcb1',
        couch: '#7d93c4',
        couchD: '#6a80b0',
        counter: '#fbfaf7',
        counterL: '#d9d4c9',
        counterR: '#c9c3b6',
        metal: '#b5bcc4',
        glass: 'rgba(170,210,235,.18)',
        glassEdge: 'rgba(120,160,190,.6)',
        mat: '#bfd8c4',
        text: '#1c1c1a',
        tagBg: 'rgba(255,255,255,.92)',
        bubble: '#ffffff',
        bubbleInk: '#1c1c1a',
        plant: '#5a9b5d',
        pot: '#b86f4b',
        shadow: 'rgba(60,40,20,.18)',
        book: ['#c96442', '#3b8ee0', '#5f9a4c', '#c9a24c', '#8b6be6'],
      };
}

function skyColor(d = new Date()) {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 7 && h < 17) return { sky: '#93c5fd', night: false };
  if (h >= 5 && h < 7) return { sky: '#fed7aa', night: false };
  if (h >= 17 && h < 19) return { sky: '#fdba74', night: false };
  return { sky: '#111827', night: true };
}

export class Office2dRenderer {
  private root: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private pal: ThemePalette;
  public plan!: OfficePlan;
  private people = new Map<string, Person>();
  private deskOf = new Map<string, number>();
  private offDuty = 0;
  private first = true;
  private visible = true;
  private hit: HitTarget[] = [];
  public hoverKey: string | null = null;
  public selectedKey: string | null = null;
  private t = performance.now();
  private last = performance.now();
  private raf: number = 0;
  private dead = false;
  private cw = 800;
  private ch = 600;
  private dpr = 1;
  private cam: { zoom: number; ox: number; oy: number } | null = null;
  private insetFrom = 0;
  private insetTo: number | null = null;
  private insetT0 = -Infinity;

  private cat!: {
    x: number;
    y: number;
    path: Point2D[];
    until: number;
    face: number;
  };

  private onSelectAgent?: (key: string) => void;
  private onHoverAgent?: (key: string | null) => void;

  constructor(
    root: HTMLElement,
    options: {
      isDark?: boolean;
      onSelectAgent?: (key: string) => void;
      onHoverAgent?: (key: string | null) => void;
    } = {}
  ) {
    this.root = root;
    this.onSelectAgent = options.onSelectAgent;
    this.onHoverAgent = options.onHoverAgent;

    this.pal = getPalette(options.isDark !== false);
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'office-canvas-2d';
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.root.appendChild(this.canvas);

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not obtain Canvas 2D context');
    this.ctx = ctx;

    this.plan = this.buildPlan(9);
    this.cat = {
      x: this.plan.W - 3.2,
      y: this.plan.D - 2.2,
      path: [],
      until: 0,
      face: 1,
    };

    this.resize();
    this.setupListeners();

    const loop = (time: number) => {
      if (this.dead) return;
      this.frame(time);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  public destroy(): void {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    this.canvas.remove();
  }

  public setDarkMode(dark: boolean): void {
    this.pal = getPalette(dark);
  }

  public setVisible(v: boolean): void {
    this.visible = v;
    if (v) this.resize();
  }

  public setInset(px: number, animate = true): void {
    const now = performance.now();
    this.insetFrom = animate ? this.currentInset(now) : px;
    this.insetTo = px;
    this.insetT0 = animate ? now : -Infinity;
  }

  private currentInset(now = performance.now()): number {
    if (this.insetTo == null) return 0;
    const k = Math.min(1, (now - this.insetT0) / 340);
    const e = 1 - Math.pow(1 - k, 3);
    return this.insetFrom + (this.insetTo - this.insetFrom) * e;
  }

  private insetMoving(now = performance.now()): boolean {
    return this.insetTo != null && now - this.insetT0 < 360;
  }

  // ------------------------------------------------------------ Construcción del Plano

  public buildPlan(nWorking = 9): OfficePlan {
    const pal = this.pal;
    const pods = Math.max(3, Math.ceil((nWorking + 2) / 4));
    const podCols = pods <= 4 ? 2 : 3;
    const podRows = Math.ceil(pods / podCols);
    const OW = 1.3 + (podCols - 1) * 4.2 + 4.0;
    const OD = podRows * 4.7 + 0.8;
    const D = Math.max(OD + 3.8, 15.5);
    const RW = 7.6;
    const W = OW + RW;
    const MR = 5.2; // Fondo sala de reuniones
    const PY = 10.0; // Límite cafetería / lounge

    const grid = new AStarGrid(W, D);
    const items: Array<{ depth: number; draw: () => void }> = [];
    const props: any[] = [];
    const pois: POI[] = [];
    const desks: DeskSlot[] = [];

    const add = (depth: number, draw: () => void) => items.push({ depth, draw });
    const solid = (x: number, y: number, w: number, d: number, pad = 0.08) =>
      grid.block(x, y, w, d, pad);
    const poi = (
      x: number,
      y: number,
      act: POI['act'],
      face: POI['face'],
      opt: Partial<POI> = {}
    ) => pois.push({ x, y, act, face, sit: 0, ...opt });

    // Segmentación de cajas largas para evitar fallos de profundidad isométrica con personajes
    const longBox = (
      x: number,
      y: number,
      z: number,
      w: number,
      d: number,
      h: number,
      top: string,
      left: string,
      right: string,
      opts: { bias?: number; extra?: (x0: number, x1: number) => void } = {}
    ) => {
      const n = Math.max(1, Math.ceil(Math.max(w, d) / 0.9));
      for (let k = 0; k < n; k++) {
        const sx = w >= d ? x + (w / n) * k : x;
        const sy = w >= d ? y : y + (d / n) * k;
        const sw = w >= d ? w / n : w;
        const sd = w >= d ? d : d / n;
        add(sx + sw / 2 + sy + sd / 2 + (opts.bias || 0), () => {
          this.box(sx, sy, z, sw, sd, h, top, left, right);
          if (opts.extra) opts.extra(sx, sx + sw);
        });
      }
    };

    // 1. Pods de Escritorios (4 puestos por pod, con panel separador central y lateral)
    for (let p = 0; p < pods; p++) {
      const c = p % podCols;
      const r = Math.floor(p / podCols);
      const px = 1.3 + c * 4.2;
      const py = 2.0 + r * 4.7;
      const panelColor = PANEL[p % PANEL.length];

      for (let k = 0; k < 2; k++) {
        const x = px + k * 1.5;
        desks.push({
          id: `desk-${p}-${k}-n`,
          x,
          y: py,
          side: 'n',
          seat: { x: x + 0.7, y: py - 0.45 },
        });
        desks.push({
          id: `desk-${p}-${k}-s`,
          x,
          y: py + 0.92,
          side: 's',
          seat: { x: x + 0.7, y: py + 0.92 + 1.25 },
        });
        solid(x, py, 1.4, 0.8, 0.08);
        solid(x, py + 0.92, 1.4, 0.8, 0.08);
      }

      longBox(
        px - 0.1,
        py + 0.82,
        0,
        3.15,
        0.08,
        1.15,
        this.shade(panelColor, 25),
        panelColor,
        this.shade(panelColor, -15),
        { bias: 0.05 }
      );
      add(px - 0.1 + py + 0.86, () =>
        this.box(
          px - 0.18,
          py - 0.05,
          0,
          0.08,
          1.82,
          1.15,
          this.shade(panelColor, 25),
          panelColor,
          this.shade(panelColor, -15)
        )
      );
      solid(px - 0.18, py + 0.8, 3.25, 0.12, 0.05);
    }

    // 2. Rack de Servidores y GPU Render Station + Impresora Láser
    const rx = OW - 1.25;
    add(rx + 0.35 + 0.5, () => this.serverRack(rx, 0.2));
    solid(rx, 0.2, 0.75, 0.65);

    add(OW - 2.4 + 0.3 + 0.5, () => this.printer(OW - 2.4, 0.25));
    solid(OW - 2.4, 0.25, 0.75, 0.55);

    // Plantas de interior en esquinas
    for (const [x, y] of [
      [0.45, 0.45],
      [0.45, OD - 0.2],
    ]) {
      add(x + y, () => this.plant(x, y));
      solid(x - 0.2, y - 0.2, 0.4, 0.4);
    }

    // Ventanales panorámicos al exterior con cielo y nubes dinámicas
    const windows: number[] = [];
    for (let x = 1.0; x < OW - 2.6; x += 2.4) {
      windows.push(x);
      poi(x + 0.75, 0.75, 'window', 'back');
    }
    poi(0.95, OD - 0.2, 'plant', 'back');

    // 3. Rincón Recreativo: Ping-Pong interactivo
    const tx = 2.4;
    const ty = OD + 1.0;
    add(tx + 1.3 + ty + 0.7, () => this.pingpong(tx, ty));
    solid(tx, ty, 2.6, 1.4, 0.05);
    poi(tx - 0.55, ty + 0.7, 'pingpong', 'side', { pair: 'pp' });
    poi(tx + 3.15, ty + 0.7, 'pingpong', 'side', { pair: 'pp' });
    const pp = { x0: tx - 0.2, x1: tx + 2.8, y: ty + 0.7 };

    // Máquinas expendedoras de snacks/bebidas, futbolín y cabina telefónica
    const fy = OD + 3.7;
    if (D - fy >= 3.2) {
      add(0.5 + fy + 0.4, () => this.vending(0.12, fy, '#ef4444'));
      add(0.5 + fy + 1.2, () => this.vending(0.12, fy + 0.8, '#3b82f6'));
      solid(0.1, fy, 0.75, 1.6);
      poi(1.3, fy + 0.4, 'vending', 'back');
      poi(1.3, fy + 1.2, 'vending', 'back');
    }

    if (D - fy >= 2.0) {
      const fx = 3.0;
      const fby = fy + 0.4;
      add(fx + 0.8 + fby + 0.4, () => this.foosball(fx, fby));
      solid(fx, fby, 1.6, 0.8, 0.05);
      poi(fx - 0.45, fby + 0.4, 'foosball', 'side', { pair: 'fb' });
      poi(fx + 2.05, fby + 0.4, 'foosball', 'side', { pair: 'fb' });

      const bx = OW - 2.0;
      this.booth(add, bx, fy);
      solid(bx - 0.05, fy - 0.05, 1.4, 0.1, 0.03);
      solid(bx - 0.05, fy - 0.05, 0.1, 1.4, 0.03);
      solid(bx + 1.25, fy - 0.05, 0.1, 1.4, 0.03);
      solid(bx + 0.85, fy + 1.25, 0.5, 0.1, 0.03);
      poi(bx + 0.65, fy + 0.6, 'phone', 'front', { sit: 0.45 });

      add(OW - 0.45 + D - 0.6, () => this.plant(OW - 0.45, D - 0.6));
    }

    // 4. Sala de Reuniones Editorial y War Room (detrás de mampara de cristal)
    const mx = OW;
    for (const [y, d] of [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 0.6],
      [4.6, MR - 4.6],
    ]) {
      this.glassX(add, mx, y, d);
    }
    for (let x = mx; x < W - 0.01; x += 1) {
      this.glassY(add, x, MR, Math.min(1, W - x));
    }
    solid(mx - 0.05, 0, 0.1, 3.6, 0.05);
    solid(mx - 0.05, 4.6, 0.1, MR - 4.6, 0.05);
    solid(mx, MR - 0.05, RW, 0.1, 0.05);

    const mtx = mx + 1.6;
    const mty = 1.7;
    add(mtx + 1.5 + mty + 0.7, () => this.meetingTable(mtx, mty));
    solid(mtx, mty, 3.0, 1.4);

    for (let k = 0; k < 3; k++) {
      const cx = mtx + 0.5 + k * 1.0;
      add(cx + mty - 0.45, () => this.stool(cx, mty - 0.4, 0.4, '#555c66'));
      add(cx + mty + 1.78, () => this.stool(cx, mty + 1.8, 0.4, '#555c66'));
      poi(cx, mty - 0.4, 'meeting', 'front', { sit: 0.42 });
      poi(cx, mty + 1.8, 'meeting', 'back', { sit: 0.42 });
    }
    poi(mx + 3.6, 0.65, 'whiteboard', 'back');
    add(W - 0.45 + 0.45, () => this.plant(W - 0.45, 0.45));
    solid(W - 0.65, 0.25, 0.4, 0.4);

    // 5. Cafetería / Pantry (Encimera, máquina de café, fregadero, dispensador de agua, nevera)
    const cy = MR + 0.3;
    longBox(
      mx + 1.0,
      cy,
      0,
      RW - 2.3,
      0.7,
      0.9,
      pal.counter,
      pal.counterL,
      pal.counterR,
      { bias: -0.5 }
    );
    solid(mx + 1.0, cy, RW - 2.3, 0.7);

    add(mx + 2.65 + cy + 0.35, () => this.coffeeMachine(mx + 2.4, cy + 0.12));
    add(mx + 4.15 + cy + 0.35, () => this.sink(mx + 3.9, cy + 0.12));
    add(W - 0.75 + cy + 0.4, () => this.fridge(W - 1.15, cy));
    solid(W - 1.15, cy, 0.85, 0.75);

    add(mx + 0.55 + cy + 0.25, () => this.waterCooler(mx + 0.35, cy + 0.05));
    solid(mx + 0.3, cy, 0.5, 0.5);

    poi(mx + 2.65, cy + 1.2, 'coffee', 'back');
    poi(mx + 4.15, cy + 1.2, 'sink', 'back');
    poi(W - 0.75, cy + 1.3, 'fridge', 'back');
    poi(mx + 0.6, cy + 0.95, 'water', 'back');

    // Mesa redonda y taburetes de bar
    const rtx = mx + 3.6;
    const rty = MR + 2.9;
    add(rtx + rty, () => this.roundTable(rtx, rty));
    solid(rtx - 0.45, rty - 0.45, 0.9, 0.9);
    for (const [sx, sy, face] of [
      [rtx - 1.0, rty, 'front'],
      [rtx + 1.0, rty, 'front'],
      [rtx, rty + 1.0, 'back'],
      [rtx, rty - 0.95, 'front'],
    ] as Array<[number, number, 'front' | 'back']>) {
      add(sx + sy - 0.02, () => this.stool(sx, sy, 0.45, '#c9a24c'));
      poi(sx, sy, 'stool', face, { sit: 0.47 });
    }

    // 6. Zona Lounge (Estantería de libros, sofá esquinero, mesa de centro, beanbags, arcade retro)
    const lx = mx + 0.6;
    const ly = PY + 0.4;
    const shelfX = mx + 3.4;
    const shelfW = RW - 3.6;
    longBox(
      shelfX,
      PY - 0.25,
      0,
      shelfW,
      0.45,
      1.45,
      this.shade(pal.deskTop, -5),
      pal.deskL,
      pal.deskR,
      { extra: (x0, x1) => this.books(x0, x1, PY + 0.2) }
    );
    solid(shelfX, PY - 0.25, shelfW, 0.45);
    poi(mx + 4.6, PY + 0.75, 'read', 'back');
    poi(mx + 5.8, PY + 0.75, 'read', 'back');

    add(lx + ly + 0.6, () => this.couch(lx, ly + 0.6));
    solid(lx, ly + 0.6, 2.8, 0.8);
    for (let k = 0; k < 3; k++) {
      poi(lx + 0.5 + k * 0.9, ly + 1.2, 'couch', 'front', { sit: 0.36 });
    }

    add(lx + 1.4 + ly + 2.35, () => this.coffeeTable(lx + 0.6, ly + 2.0));
    solid(lx + 0.6, ly + 2.0, 1.6, 0.7);

    add(lx + 0.4 + ly + 3.6, () => this.beanbag(lx + 0.4, ly + 3.6, '#ef4444'));
    add(lx + 2.6 + ly + 3.6, () => this.beanbag(lx + 2.6, ly + 3.6, '#3b82f6'));
    poi(lx + 0.4, ly + 3.6, 'beanbag', 'front', { sit: 0.18 });
    poi(lx + 2.6, ly + 3.6, 'beanbag', 'front', { sit: 0.18 });

    const ax = W - 1.2;
    const ay = ly + 1.0;
    add(ax + 0.35 + ay + 0.35, () => this.arcade(ax, ay));
    solid(ax, ay, 0.7, 0.7);
    poi(ax + 0.35, ay + 1.15, 'arcade', 'back');

    add(W - 0.5 + D - 0.5, () => this.plant(W - 0.5, D - 0.5));
    add(lx - 0.2 + D - 0.6, () => this.floorLamp(lx - 0.2, D - 0.6));

    const posters = [
      { y: 2.2, color: '#0284c7', text: 'RUNTIME 9:16' },
      { y: 4.6, color: '#10b981', text: 'TESTS ✓' },
    ];

    return {
      W,
      D,
      OW,
      OD,
      MR,
      PY,
      RW,
      grid,
      items,
      props,
      pois,
      desks,
      windows,
      posters,
      pp,
      door: { x: 0.4, y: D - 1.2 },
    };
  }

  private glassX(
    add: (depth: number, draw: () => void) => void,
    x: number,
    y: number,
    d: number
  ): void {
    add(x + y + d / 2 + 0.02, () => {
      const P = (a: number, b: number, c: number) => this.iso(a, b, c);
      this.poly(
        [P(x, y, 0), P(x, y + d, 0), P(x, y + d, 0.22), P(x, y, 0.22)],
        this.pal.trim
      );
      this.poly(
        [P(x, y, 0.22), P(x, y + d, 0.22), P(x, y + d, 2.1), P(x, y, 2.1)],
        this.pal.glass,
        this.pal.glassEdge
      );
    });
  }

  private glassY(
    add: (depth: number, draw: () => void) => void,
    x: number,
    y: number,
    w: number
  ): void {
    add(x + w / 2 + y + 0.02, () => {
      const P = (a: number, b: number, c: number) => this.iso(a, b, c);
      this.poly(
        [P(x, y, 0), P(x + w, y, 0), P(x + w, y, 0.22), P(x, y, 0.22)],
        this.pal.trim
      );
      this.poly(
        [P(x, y, 0.22), P(x + w, y, 0.22), P(x + w, y, 2.1), P(x, y, 2.1)],
        this.pal.glass,
        this.pal.glassEdge
      );
    });
  }

  // ------------------------------------------------------------ Sesiones y Agentes

  public updateSessions(sessions: AgentSession[]): void {
    const working = sessions.filter((s) => WORKING_STATUSES.has(s.status));
    const off = sessions
      .filter((s) => !WORKING_STATUSES.has(s.status))
      .sort((a, b) => (b.lastEventAt || 0) - (a.lastEventAt || 0));
    const wanderers = off.slice(0, MAX_WANDERERS);
    this.offDuty = off.length - wanderers.length;

    const workKeys = new Set(working.map((s) => s.key));
    for (const k of [...this.deskOf.keys()]) {
      if (!workKeys.has(k)) this.deskOf.delete(k);
    }
    const used = new Set(this.deskOf.values());
    const desks = this.plan.desks;
    // Preferir puestos orientados al frente (side: 's') para mejor visibilidad
    const order = desks
      .map((_, i) => i)
      .sort((a, b) => (desks[a].side === 's' ? -1 : 1) - (desks[b].side === 's' ? -1 : 1) || a - b);

    for (const s of [...working].sort((a, b) => (a.startedAt || 0) - (b.startedAt || 0))) {
      if (this.deskOf.has(s.key)) continue;
      const i = order.find((n) => !used.has(n));
      if (i == null) continue;
      this.deskOf.set(s.key, i);
      used.add(i);
    }
    const takenDesks = new Set([...this.deskOf.values()].map((i) => desks[i]));

    const shown = new Set<string>();
    for (const s of [...working, ...wanderers]) {
      const isWorker = this.deskOf.has(s.key);
      if (!isWorker && WORKING_STATUSES.has(s.status)) continue;
      shown.add(s.key);
      let p = this.people.get(s.key);
      if (!p) {
        p = this.newPerson(s);
        this.people.set(s.key, p);
      }
      p.s = s;
      p.leaving = false;
      if (isWorker) {
        this.releasePerson(p);
        const desk = desks[this.deskOf.get(s.key)!];
        if (p.desk !== desk || p.mode !== 'work') {
          p.desk = desk;
          this.walkTo(p, desk.seat);
        }
        p.mode = 'work';
      } else {
        if (p.mode !== 'wander') {
          p.mode = 'wander';
          p.desk = null;
          p.poi = null;
          p.until = 0;
        }
        if (p.napDesk && takenDesks.has(p.napDesk)) {
          this.releasePerson(p);
          p.path = [];
        }
      }
    }

    for (const [k, p] of this.people) {
      if (!shown.has(k) && !p.leaving) {
        p.leaving = true;
        p.mode = 'leave';
        this.releasePerson(p);
        p.desk = null;
        this.walkTo(p, this.plan.door);
      }
    }
    this.first = false;
  }

  private releasePerson(p: Person): void {
    if (p.poi) {
      p.poi.taken = null;
      p.poi = null;
    }
    if (p.napDesk) {
      p.napDesk.napper = null;
      p.napDesk = null;
    }
  }

  private newPerson(s: AgentSession): Person {
    const h = hash(s.key);
    const door = this.plan.door;
    const badge = AGENT_BADGES[s.agent] || AGENT_BADGES.ingest;
    return {
      key: s.key,
      h,
      s,
      skin: pick(SKIN, h, 3),
      hair: pick(HAIR, h, 7),
      pants: pick(PANTS, h, 13),
      shirt: pick(badge.shirt, h, 11),
      hairStyle: h % 4,
      phase: ((h % 1000) / 1000) * Math.PI * 2,
      x: door.x,
      y: door.y,
      path: [],
      walkFace: 'front',
      until: 0,
      mode: null,
      placeOnArrive: this.first,
    };
  }

  private walkTo(p: Person, target: Point2D): void {
    if (p.placeOnArrive) {
      p.x = target.x;
      p.y = target.y;
      p.path = [];
      p.placeOnArrive = false;
      return;
    }
    p.path = this.plan.grid.path(p.x, p.y, target.x, target.y);
  }

  private wander(p: Person, now: number): void {
    if (p.path.length) return;
    if (p.poi && now < p.until) return;
    this.releasePerson(p);
    const plan = this.plan;
    const workingDesks = new Set([...this.deskOf.values()].map((i) => plan.desks[i]));
    const sleepy = p.s.status === 'idle';
    const weighted: Array<[POI, number]> = [];

    for (const q of plan.pois) {
      if (q.taken) continue;
      let w = 1;
      if (q.pair) {
        w = plan.pois.some((o) => o.pair === q.pair && o !== q && o.taken) ? 7 : 1.2;
      }
      if (q.act === 'couch' || q.act === 'beanbag' || q.sleepy) {
        w = sleepy ? 3 : 1.4;
      }
      weighted.push([q, w]);
    }

    for (const d of plan.desks) {
      if (workingDesks.has(d) || d.napper) continue;
      weighted.push([
        {
          x: d.seat.x,
          y: d.seat.y,
          act: 'nap',
          face: d.side === 'n' ? 'front' : 'back',
          sit: 0.34,
          desk: d,
        },
        sleepy ? 3 : 0.25,
      ]);
    }

    if (!weighted.length) return;
    let r = Math.random() * weighted.reduce((a, [, w]) => a + w, 0);
    let choice = weighted[0][0];
    for (const [q, w] of weighted) {
      r -= w;
      if (r <= 0) {
        choice = q;
        break;
      }
    }
    if (choice.desk) {
      choice.desk.napper = p.key;
      p.napDesk = choice.desk;
    }
    choice.taken = p.key;
    p.poi = choice;
    p.until = Infinity;
    p.stay =
      (choice.act === 'nap'
        ? rand(25, 60)
        : choice.act === 'pingpong'
          ? rand(15, 30)
          : rand(8, 20)) * 1000;
    this.walkTo(p, choice);
  }

  // ------------------------------------------------------------ Cámara y Geometría Isométrica

  public resize(): void {
    const r = this.root.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.cw = Math.max(200, r.width);
    this.ch = Math.max(240, r.height);
    this.canvas.width = Math.round(this.cw * dpr);
    this.canvas.height = Math.round(this.ch * dpr);
    this.canvas.style.width = this.cw + 'px';
    this.canvas.style.height = this.ch + 'px';
    this.dpr = dpr;
  }

  private fitCamera(): void {
    const { W, D } = this.plan;
    const left = this.iso(0, D, 0).x;
    const right = this.iso(W, 0, 0).x;
    const top = this.iso(0, 0, WALL_H).y - 20;
    const bottom = this.iso(W, D, 0).y + 10;
    const inset = this.currentInset();
    const vw = Math.max(120, this.cw - inset);
    const zoom = Math.min(vw / (right - left + 30), this.ch / (bottom - top + 30), 2.2);
    const want = {
      zoom,
      ox: vw / 2 - ((left + right) / 2) * zoom,
      oy: this.ch / 2 - ((top + bottom) / 2) * zoom,
    };
    if (!this.cam || this.insetMoving()) this.cam = want;
    else {
      for (const k of ['zoom', 'ox', 'oy'] as const) {
        this.cam[k] += (want[k] - this.cam[k]) * 0.1;
      }
    }
  }

  public iso(x: number, y: number, z = 0): Point2D {
    return {
      x: ((x - y) * TW) / 2,
      y: ((x + y) * TH) / 2 - z * TH,
    };
  }

  private poly(pts: Point2D[], fill: string | null, stroke?: string): void {
    const c = this.ctx;
    c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.closePath();
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 1;
      c.stroke();
    }
  }

  public box(
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
    top: string,
    left: string,
    right: string
  ): void {
    const P = (a: number, b: number, cc: number) => this.iso(a, b, cc);
    this.poly(
      [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)],
      left
    );
    this.poly(
      [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)],
      right
    );
    this.poly(
      [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)],
      top
    );
  }

  private shade(color: string, amt: number): string {
    if (!color || color[0] !== '#') return color;
    const n = parseInt(color.slice(1), 16);
    const f = (v: number) => clamp(Math.round(v + amt), 0, 255);
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }

  private roundRect(
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill?: string,
    stroke?: string
  ): void {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 1.5;
      c.stroke();
    }
  }

  private onWall(dir: 'y0' | 'x0', a: number, z: number, fn: (c: CanvasRenderingContext2D) => void): void {
    const c = this.ctx;
    const o = dir === 'y0' ? this.iso(a, 0, z) : this.iso(0, a, z);
    c.save();
    c.translate(o.x, o.y);
    c.transform(1, dir === 'y0' ? 0.5 : -0.5, 0, 1, 0, 0);
    fn(c);
    c.restore();
  }

  // ------------------------------------------------------------ Shell de la Sala

  private drawRoom(): void {
    const { W, D, OW, MR, PY, pp } = this.plan;
    const pal = this.pal;
    const P = (x: number, y: number, z = 0) => this.iso(x, y, z);
    const t = this.t / 1000;

    // 1. Suelos: madera oficina, moqueta reunión, baldosas pantry, madera lounge
    for (let x = 0; x < Math.ceil(OW); x++) {
      for (let y = 0; y < Math.ceil(D); y++) {
        const x1 = Math.min(OW, x + 1);
        const y1 = Math.min(D, y + 1);
        this.poly([P(x, y), P(x1, y), P(x1, y1), P(x, y1)], (x + y) % 2 ? pal.wood1 : pal.wood2);
      }
    }
    for (let y = 0.5; y < D; y += 0.5) {
      this.poly([P(0, y), P(OW, y), P(OW, y + 0.012), P(0, y + 0.012)], pal.woodLine);
    }
    this.poly([P(OW, 0), P(W, 0), P(W, MR), P(OW, MR)], pal.carpet);
    for (let x = OW + 0.5; x < W; x += 0.5) {
      this.poly([P(x, 0), P(x + 0.015, 0), P(x + 0.015, MR), P(x, MR)], pal.carpetLine);
    }
    for (let i = 0; i < Math.ceil((W - OW) * 2); i++) {
      for (let j = 0; j < Math.ceil((PY - MR) * 2); j++) {
        const x = OW + i / 2;
        const y = MR + j / 2;
        const x1 = Math.min(W, x + 0.5);
        const y1 = Math.min(PY, y + 0.5);
        this.poly([P(x, y), P(x1, y), P(x1, y1), P(x, y1)], (i + j) % 2 ? pal.tileA : pal.tileB);
      }
    }
    for (let x = Math.floor(OW); x < W; x++) {
      for (let y = PY; y < D; y++) {
        const x0 = Math.max(OW, x);
        const x1 = Math.min(W, x + 1);
        const y1 = Math.min(D, y + 1);
        this.poly([P(x0, y), P(x1, y), P(x1, y1), P(x0, y1)], (x + Math.floor(y)) % 2 ? pal.wood1 : pal.wood2);
      }
    }
    this.poly([P(OW + 0.3, PY + 0.6), P(OW + 4.3, PY + 0.6), P(OW + 4.3, D - 0.4), P(OW + 0.3, D - 0.4)], pal.rug);
    this.poly([P(OW + 0.5, PY + 0.8), P(OW + 4.1, PY + 0.8), P(OW + 4.1, D - 0.6), P(OW + 0.5, D - 0.6)], null, pal.rugEdge);
    this.poly([P(pp.x0 - 0.6, pp.y - 1.4), P(pp.x1 + 0.6, pp.y - 1.4), P(pp.x1 + 0.6, pp.y + 1.3), P(pp.x0 - 0.6, pp.y + 1.3)], pal.mat);

    // 2. Paredes
    this.poly([P(0, 0, 0), P(W, 0, 0), P(W, 0, WALL_H), P(0, 0, WALL_H)], pal.wallL);
    this.poly([P(0, 0, 0), P(0, D, 0), P(0, D, WALL_H), P(0, 0, WALL_H)], pal.wallR);
    this.poly(
      [
        P(0, 0, WALL_H),
        P(W, 0, WALL_H),
        P(W, -0.15, WALL_H),
        P(-0.15, -0.15, WALL_H),
        P(-0.15, D, WALL_H),
        P(0, D, WALL_H),
      ],
      pal.wallTop
    );
    this.poly([P(0, 0, 0), P(W, 0, 0), P(W, 0, 0.12), P(0, 0, 0.12)], pal.trim);
    this.poly([P(0, 0, 0), P(0, D, 0), P(0, D, 0.12), P(0, 0, 0.12)], pal.trim);

    // 3. Ventanales con cielo real exterior y rayos de sol
    const sky = skyColor();
    for (const x of this.plan.windows) {
      this.poly([P(x, 0, 0.85), P(x + 1.5, 0, 0.85), P(x + 1.5, 0, 2.0), P(x, 0, 2.0)], sky.sky);
      if (sky.night) {
        this.onWall('y0', x + 0.3, 1.75, (c) => {
          c.fillStyle = '#fef08a';
          c.beginPath();
          c.arc(0, 0, 3, 0, Math.PI * 2);
          c.fill();
        });
        this.onWall('y0', x + 1.1, 1.55, (c) => {
          c.fillStyle = 'rgba(255,255,255,.7)';
          c.fillRect(0, 0, 1.5, 1.5);
        });
      } else {
        const cx = x + 0.25 + (((t * 0.02 + x * 0.37) % 1) * 1.0);
        this.onWall('y0', cx, 1.65, (c) => {
          c.fillStyle = 'rgba(255,255,255,.85)';
          c.beginPath();
          c.ellipse(0, 0, 7, 3, 0, 0, Math.PI * 2);
          c.ellipse(5, -2, 5, 3, 0, 0, Math.PI * 2);
          c.fill();
        });
      }
      this.poly([P(x + 0.74, 0, 0.85), P(x + 0.76, 0, 0.85), P(x + 0.76, 0, 2.0), P(x + 0.74, 0, 2.0)], pal.trim);
      this.poly([P(x, 0, 0.85), P(x + 1.5, 0, 0.85), P(x + 1.5, 0, 0.9), P(x, 0, 0.9)], pal.trim);
      this.poly(
        [P(x, 0.05), P(x + 1.5, 0.05), P(x + 1.95, 1.2), P(x + 0.45, 1.2)],
        sky.night ? 'rgba(120,140,200,.06)' : 'rgba(255,250,230,.15)'
      );
    }

    // 4. Whiteboard en sala de reuniones con diagrama de flujo y texto
    const wx = OW + 2.4;
    this.poly([P(wx, 0, 0.8), P(wx + 2.6, 0, 0.8), P(wx + 2.6, 0, 1.95), P(wx, 0, 1.95)], '#fdfdfb', pal.trim);
    this.onWall('y0', wx + 0.25, 1.75, (c) => {
      c.lineWidth = 1.4;
      c.strokeStyle = '#3b8ee0';
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(22, 0);
      c.moveTo(0, 7);
      c.lineTo(36, 7);
      c.stroke();
      c.strokeStyle = '#c96442';
      c.strokeRect(46, -2, 20, 12);
      c.strokeRect(80, 6, 20, 12);
      c.beginPath();
      c.moveTo(66, 4);
      c.lineTo(80, 12);
      c.stroke();
      c.strokeStyle = '#5f9a4c';
      c.beginPath();
      c.moveTo(0, 22);
      for (let i = 0; i < 8; i++) c.lineTo(i * 8, 22 - ((i * 37) % 13));
      c.stroke();
    });
    this.onWall('y0', OW + 0.5, 2.2, (c) => {
      c.font = '700 9px ui-sans-serif, system-ui, sans-serif';
      c.fillStyle = this.shade(pal.trim, -60);
      c.fillText('WAR ROOM', 0, 0);
    });

    // 5. Pared izquierda: Reloj analógico funcional, pósters y puerta de entrada
    for (const ps of this.plan.posters) {
      this.poly([P(0, ps.y, 0.95), P(0, ps.y + 0.9, 0.95), P(0, ps.y + 0.9, 1.95), P(0, ps.y, 1.95)], ps.color);
      this.onWall('x0', ps.y + 0.45, 1.4, (c) => {
        c.font = '800 8px ui-sans-serif, system-ui, sans-serif';
        c.fillStyle = '#fff';
        c.textAlign = 'center';
        c.fillText(ps.text, 0, 0);
      });
    }

    this.onWall('x0', 1.0, 1.85, (c) => {
      c.beginPath();
      c.arc(0, 0, 11, 0, Math.PI * 2);
      c.fillStyle = pal.bubble;
      c.fill();
      c.lineWidth = 2;
      c.strokeStyle = pal.trim;
      c.stroke();
      const d = new Date();
      const hand = (ang: number, len: number, w: number) => {
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(Math.sin(ang) * len, -Math.cos(ang) * len);
        c.lineWidth = w;
        c.strokeStyle = pal.bubbleInk;
        c.stroke();
      };
      hand((((d.getHours() % 12) + d.getMinutes() / 60) / 12) * Math.PI * 2, 5.5, 2);
      hand((d.getMinutes() / 60) * Math.PI * 2, 8, 1.4);
    });

    const dy = this.plan.door.y;
    this.poly([P(0, dy - 0.6, 0), P(0, dy + 0.6, 0), P(0, dy + 0.6, 1.8), P(0, dy - 0.6, 1.8)], pal.trim);
    this.poly(
      [P(0, dy - 0.52, 0), P(0, dy + 0.52, 0), P(0, dy + 0.52, 1.72), P(0, dy - 0.52, 1.72)],
      this.shade(pal.deskL, -10)
    );
    this.onWall('x0', dy - 0.25, 0.85, (c) => {
      c.fillStyle = '#d8c48a';
      c.beginPath();
      c.arc(0, 0, 1.8, 0, Math.PI * 2);
      c.fill();
    });
    this.poly(
      [P(0.05, dy - 0.6), P(0.9, dy - 0.6), P(0.9, dy + 0.6), P(0.05, dy + 0.6)],
      pal.dark ? 'rgba(0,0,0,.35)' : 'rgba(0,0,0,.08)'
    );
  }

  // ------------------------------------------------------------ Muebles y Props

  private serverRack(x: number, y: number): void {
    this.box(x, y, 0, 0.7, 0.6, 1.9, '#1a1d24', '#12141a', '#0d0f13');
    const P = (a: number, b: number, c: number) => this.iso(a, b, c);
    for (let s = 0; s < 7; s++) {
      const z = 0.2 + s * 0.23;
      this.poly([P(x + 0.05, y + 0.6, z), P(x + 0.65, y + 0.6, z), P(x + 0.65, y + 0.6, z + 0.16), P(x + 0.05, y + 0.6, z + 0.16)], '#252932');
      const led = P(x + 0.12, y + 0.6, z + 0.08);
      this.ctx.fillStyle = Math.sin(this.t / 200 + s * 1.5) > 0 ? '#10b981' : '#059669';
      this.ctx.fillRect(led.x, led.y, 2.5, 2.5);
      const led2 = P(x + 0.2, y + 0.6, z + 0.08);
      this.ctx.fillStyle = Math.sin(this.t / 150 + s) > 0 ? '#38bdf8' : '#0284c7';
      this.ctx.fillRect(led2.x, led2.y, 2.5, 2.5);
    }
  }

  private printer(x: number, y: number): void {
    this.box(x, y, 0, 0.75, 0.55, 0.75, '#f1f5f9', '#cbd5e1', '#94a3b8');
    this.box(x + 0.1, y + 0.1, 0.75, 0.55, 0.35, 0.15, '#e2e8f0', '#94a3b8', '#64748b');
    const p = this.iso(x + 0.55, y + 0.35, 0.76);
    this.ctx.fillStyle = '#10b981';
    this.ctx.fillRect(p.x, p.y, 3, 3);
  }

  private plant(x: number, y: number): void {
    const pal = this.pal;
    this.box(x - 0.2, y - 0.2, 0, 0.4, 0.4, 0.45, pal.pot, pal.pot, this.shade(pal.pot, -15));
    const c = this.ctx;
    const t = this.t / 1000;
    const p = this.iso(x, y, 0.45);
    c.fillStyle = pal.plant;
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2 + Math.sin(t * 0.8 + i) * 0.05;
      const lx = p.x + Math.cos(ang) * 11;
      const ly = p.y - 12 + Math.sin(ang) * 6;
      c.beginPath();
      c.ellipse(lx, ly, 7, 10, ang, 0, Math.PI * 2);
      c.fill();
    }
  }

  private pingpong(x: number, y: number): void {
    for (const [lx, ly] of [
      [0.1, 0.1],
      [2.4, 0.1],
      [0.1, 1.2],
      [2.4, 1.2],
    ]) {
      this.box(x + lx, y + ly, 0, 0.08, 0.08, 0.7, '#333', '#333', '#222');
    }
    this.box(x, y, 0.7, 2.6, 1.4, 0.06, '#2f7a52', '#245f40', '#1d4f35');
    const P = (a: number, b: number, c: number) => this.iso(a, b, c);
    this.poly(
      [
        P(x + 0.04, y + 0.69, 0.765),
        P(x + 2.56, y + 0.69, 0.765),
        P(x + 2.56, y + 0.71, 0.765),
        P(x + 0.04, y + 0.71, 0.765),
      ],
      '#ffffff'
    );
    this.poly(
      [
        P(x + 1.3, y - 0.05, 0.76),
        P(x + 1.3, y + 1.45, 0.76),
        P(x + 1.3, y + 1.45, 0.95),
        P(x + 1.3, y - 0.05, 0.95),
      ],
      'rgba(255,255,255,.55)',
      '#ddd'
    );
  }

  private meetingTable(x: number, y: number): void {
    const pal = this.pal;
    this.box(x + 0.3, y + 0.5, 0, 0.12, 0.4, 0.7, pal.deskL, pal.deskL, pal.deskR);
    this.box(x + 2.6, y + 0.5, 0, 0.12, 0.4, 0.7, pal.deskL, pal.deskL, pal.deskR);
    this.box(x, y, 0.7, 3.0, 1.4, 0.08, this.shade(pal.deskTop, 12), pal.deskL, pal.deskR);
    this.box(x + 1.2, y + 0.45, 0.78, 0.5, 0.35, 0.03, '#2a2a2e', '#222', '#1a1a1a');
    this.box(x + 0.4, y + 0.3, 0.78, 0.2, 0.28, 0.02, '#fff', '#eee', '#ddd');
    this.box(x + 2.2, y + 0.8, 0.78, 0.12, 0.12, 0.12, '#f2f2f2', '#d0d0d0', '#bbb');
  }

  private stool(x: number, y: number, h: number, color: string): void {
    this.box(x - 0.04, y - 0.04, 0, 0.08, 0.08, h, '#555', '#444', '#333');
    this.box(x - 0.2, y - 0.2, h, 0.4, 0.4, 0.07, this.shade(color, 18), color, this.shade(color, -18));
  }

  private roundTable(x: number, y: number): void {
    const c = this.ctx;
    this.box(x - 0.05, y - 0.05, 0, 0.1, 0.1, 0.72, '#555', '#444', '#333');
    const p = this.iso(x, y, 0.75);
    c.fillStyle = this.shade(this.pal.deskTop, -15);
    c.beginPath();
    c.ellipse(p.x, p.y + 3, 30, 15, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = this.shade(this.pal.deskTop, 15);
    c.beginPath();
    c.ellipse(p.x, p.y, 30, 15, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fff';
    c.beginPath();
    c.ellipse(p.x + 8, p.y - 2, 5, 2.5, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#e6b35c';
    c.beginPath();
    c.arc(p.x + 8, p.y - 3, 2, 0, Math.PI * 2);
    c.fill();
  }

  private coffeeMachine(x: number, y: number): void {
    this.box(x, y, 0.9, 0.5, 0.45, 0.6, '#555b63', '#3a3f45', '#2e3237');
    this.box(x + 0.15, y + 0.42, 1.0, 0.2, 0.05, 0.15, '#222', '#111', '#111');
    const p = this.iso(x + 0.4, y + 0.45, 1.35);
    this.ctx.fillStyle = Math.sin(this.t / 400) > 0 ? '#ff6b4a' : '#7a3a2a';
    this.ctx.fillRect(p.x, p.y, 2.5, 2.5);
    this.box(x + 0.6, y + 0.1, 0.9, 0.14, 0.14, 0.14, '#fff', '#ddd', '#ccc');
  }

  private sink(x: number, y: number): void {
    this.box(x, y + 0.05, 0.9, 0.55, 0.4, 0.02, '#9aa3ad', '#7d858e', '#6c737b');
    this.box(x + 0.22, y + 0.02, 0.92, 0.06, 0.06, 0.3, this.pal.metal, this.pal.metal, '#888');
    this.box(x + 0.22, y + 0.02, 1.2, 0.06, 0.2, 0.04, this.pal.metal, this.pal.metal, '#888');
  }

  private fridge(x: number, y: number): void {
    this.box(x, y, 0, 0.85, 0.75, 1.95, '#eef1f4', '#cfd5db', '#bcc3ca');
    const P = (a: number, b: number, c: number) => this.iso(a, b, c);
    this.poly([P(x, y + 0.75, 1.25), P(x + 0.85, y + 0.75, 1.25), P(x + 0.85, y + 0.75, 1.27), P(x, y + 0.75, 1.27)], '#9aa3ad');
    this.poly([P(x + 0.7, y + 0.75, 1.4), P(x + 0.73, y + 0.75, 1.4), P(x + 0.73, y + 0.75, 1.75), P(x + 0.7, y + 0.75, 1.75)], '#888');
    for (const [mx, mz, col] of [
      [0.2, 1.6, '#ef4444'],
      [0.4, 1.45, '#3b82f6'],
      [0.3, 0.9, '#10b981'],
    ] as Array<[number, number, string]>) {
      const p = P(x + mx, y + 0.75, mz);
      this.ctx.fillStyle = col;
      this.ctx.fillRect(p.x, p.y, 4, 4);
    }
  }

  private waterCooler(x: number, y: number): void {
    this.box(x, y, 0, 0.42, 0.42, 0.95, '#e8ecef', '#cfd5db', '#bcc3ca');
    const c = this.ctx;
    const p = this.iso(x + 0.21, y + 0.21, 0.95);
    c.fillStyle = 'rgba(120,180,240,.6)';
    c.beginPath();
    c.ellipse(p.x, p.y - 9, 8, 11, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,.5)';
    c.fillRect(p.x - 4, p.y - 16, 2, 10);
    const k = (this.t / 1800) % 1;
    c.fillStyle = 'rgba(255,255,255,.85)';
    c.beginPath();
    c.arc(p.x + 2, p.y - 2 - k * 16, 1.2, 0, Math.PI * 2);
    c.fill();
    const tap = this.iso(x + 0.21, y + 0.42, 0.65);
    c.fillStyle = '#3b8ee0';
    c.fillRect(tap.x - 1.5, tap.y, 3, 3);
  }

  private couch(x: number, y: number): void {
    const pal = this.pal;
    this.box(x, y - 0.05, 0.32, 2.8, 0.25, 0.42, this.shade(pal.couch, 10), pal.couchD, this.shade(pal.couchD, -12));
    this.box(x, y, 0, 2.8, 0.8, 0.32, pal.couch, pal.couchD, this.shade(pal.couchD, -12));
    this.box(x - 0.15, y - 0.05, 0, 0.18, 0.85, 0.52, this.shade(pal.couch, 6), pal.couchD, this.shade(pal.couchD, -12));
    this.box(x + 2.8, y - 0.05, 0, 0.18, 0.85, 0.52, this.shade(pal.couch, 6), pal.couchD, this.shade(pal.couchD, -12));
    this.box(x + 2.15, y + 0.12, 0.32, 0.35, 0.16, 0.28, '#e9c46a', '#d4ae52', '#c19c43');
  }

  private coffeeTable(x: number, y: number): void {
    const pal = this.pal;
    this.box(x, y, 0, 1.6, 0.7, 0.3, this.shade(pal.deskTop, -10), pal.deskL, pal.deskR);
    this.box(x + 0.2, y + 0.15, 0.3, 0.35, 0.25, 0.06, '#c96442', '#a85336', '#8f462e');
    this.box(x + 1.1, y + 0.3, 0.3, 0.12, 0.12, 0.12, '#fff', '#ddd', '#ccc');
  }

  private beanbag(x: number, y: number, color: string): void {
    const c = this.ctx;
    const p = this.iso(x, y, 0);
    c.fillStyle = this.shade(color, -25);
    c.beginPath();
    c.ellipse(p.x, p.y - 4, 20, 11, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(p.x, p.y - 8, 18, 10, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = this.shade(color, 20);
    c.beginPath();
    c.ellipse(p.x - 3, p.y - 14, 10, 6, -0.2, 0, Math.PI * 2);
    c.fill();
  }

  private books(x0: number, x1: number, y: number): void {
    const P = (a: number, b: number, c: number) => this.iso(a, b, c);
    const cols = this.pal.book;
    for (let shelf = 0; shelf < 3; shelf++) {
      const z = 0.12 + shelf * 0.45;
      let bx = x0 + 0.05;
      let i = Math.round(x0 * 7) + shelf * 5;
      while (bx < x1 - 0.1) {
        const bw = 0.07 + ((i * 13) % 5) * 0.015;
        const bh = 0.25 + ((i * 7) % 4) * 0.03;
        if (i % 7 !== 3) {
          this.poly(
            [P(bx, y, z), P(bx + bw, y, z), P(bx + bw, y, z + bh), P(bx, y, z + bh)],
            cols[i % cols.length]
          );
        }
        bx += bw + 0.015;
        i++;
      }
      this.poly([P(x0, y, z - 0.02), P(x1, y, z - 0.02), P(x1, y, z), P(x0, y, z)], this.pal.deskR);
    }
  }

  private arcade(x: number, y: number): void {
    this.box(x, y, 0, 0.7, 0.7, 1.75, '#3a2a6a', '#2b1f52', '#221843');
    const P = (a: number, b: number, c: number) => this.iso(a, b, c);
    const hue = (this.t / 20) % 360;
    this.poly(
      [P(x + 0.1, y + 0.7, 1.0), P(x + 0.6, y + 0.7, 1.0), P(x + 0.6, y + 0.7, 1.45), P(x + 0.1, y + 0.7, 1.45)],
      `hsl(${hue},70%,55%)`
    );
    const blip = this.iso(x + 0.25 + 0.2 * Math.sin(this.t / 300), y + 0.7, 1.2);
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(blip.x, blip.y, 3, 3);
    this.poly([P(x, y + 0.7, 1.55), P(x + 0.7, y + 0.7, 1.55), P(x + 0.7, y + 0.7, 1.72), P(x, y + 0.7, 1.72)], '#ffcf4a');
    this.box(x, y + 0.7, 0.8, 0.7, 0.2, 0.08, '#4a3a8a', '#3a2a6a', '#2b1f52');
    const j = this.iso(x + 0.25, y + 0.8, 0.88);
    this.ctx.fillStyle = '#e04a4a';
    this.ctx.beginPath();
    this.ctx.arc(j.x, j.y - 3, 2.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private floorLamp(x: number, y: number): void {
    const c = this.ctx;
    const b = this.iso(x, y, 0);
    const t = this.iso(x, y, 1.7);
    if (skyColor().night) {
      c.fillStyle = 'rgba(255,220,140,.14)';
      c.beginPath();
      c.ellipse(b.x, b.y, 50, 25, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.strokeStyle = '#333';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(b.x, b.y);
    c.lineTo(t.x, t.y);
    c.stroke();
    c.fillStyle = '#333';
    c.beginPath();
    c.ellipse(b.x, b.y, 7, 3.5, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#f3e3b5';
    c.beginPath();
    c.moveTo(t.x - 9, t.y + 4);
    c.lineTo(t.x + 9, t.y + 4);
    c.lineTo(t.x + 5, t.y - 8);
    c.lineTo(t.x - 5, t.y - 8);
    c.closePath();
    c.fill();
  }

  private vending(x: number, y: number, color: string): void {
    this.box(x, y, 0, 0.7, 0.75, 1.85, this.shade(color, 15), this.shade(color, -10), color);
    const P = (a: number, b: number, c: number) => this.iso(a, b, c);
    const fx = x + 0.7;
    this.poly([P(fx, y + 0.08, 0.7), P(fx, y + 0.55, 0.7), P(fx, y + 0.55, 1.7), P(fx, y + 0.08, 1.7)], 'rgba(20,30,40,.75)');
    const cols = ['#f2d16b', '#5cf08a', '#ff8a65', '#81d4fa', '#ce93d8'];
    for (let r = 0; r < 4; r++) {
      for (let k = 0; k < 3; k++) {
        const q = P(fx, y + 0.15 + k * 0.14, 1.55 - r * 0.23);
        this.ctx.fillStyle = cols[(r * 3 + k + Math.round(y)) % cols.length];
        this.ctx.fillRect(q.x - 1.5, q.y - 4, 3, 5);
      }
    }
    this.poly([P(fx, y + 0.1, 0.25), P(fx, y + 0.5, 0.25), P(fx, y + 0.5, 0.45), P(fx, y + 0.1, 0.45)], '#222');
    const glow = P(fx, y + 0.65, 1.2);
    this.ctx.fillStyle = Math.sin(this.t / 700 + y) > 0 ? '#9ef' : '#4ad';
    this.ctx.fillRect(glow.x - 1, glow.y - 3, 2, 6);
  }

  private foosball(x: number, y: number): void {
    for (const [lx, ly] of [
      [0.1, 0.1],
      [1.42, 0.1],
      [0.1, 0.62],
      [1.42, 0.62],
    ]) {
      this.box(x + lx, y + ly, 0, 0.08, 0.08, 0.6, '#5a4030', '#5a4030', '#4a3428');
    }
    this.box(x, y, 0.6, 1.6, 0.8, 0.25, '#2f8a4a', '#6e533b', '#5c4431');
    const P = (a: number, b: number, c: number) => this.iso(a, b, c);
    const players = this.plan && this.plan.pois.filter((q) => q.pair === 'fb' && q.taken).length === 2;
    for (let k = 0; k < 6; k++) {
      const rx = x + 0.2 + k * 0.24;
      const shift = players ? Math.sin(this.t / 120 + k) * 0.06 : 0;
      const a = P(rx, y - 0.15, 0.82);
      const b = P(rx, y + 0.95, 0.82);
      this.ctx.strokeStyle = '#c8ccd0';
      this.ctx.lineWidth = 1.2;
      this.ctx.beginPath();
      this.ctx.moveTo(a.x, a.y);
      this.ctx.lineTo(b.x, b.y);
      this.ctx.stroke();
      const col = k % 2 ? '#3b8ee0' : '#c96442';
      for (const py of [y + 0.2 + shift, y + 0.6 + shift]) {
        if (py < y + 0.05 || py > y + 0.75) continue;
        const fig = P(rx, py, 0.82);
        this.ctx.fillStyle = col;
        this.ctx.fillRect(fig.x - 2, fig.y - 2, 4, 6);
      }
    }
  }

  private booth(
    add: (depth: number, draw: () => void) => void,
    x: number,
    y: number
  ): void {
    const H = 2.1;
    const pal = this.pal;
    const P = (a: number, b: number, c: number) => this.iso(a, b, c);
    add(x + y + 0.01, () => {
      this.poly([P(x, y, 0), P(x + 1.3, y, 0), P(x + 1.3, y, H), P(x, y, H)], pal.wallL);
      this.poly([P(x, y, 0), P(x, y + 1.3, 0), P(x, y + 1.3, H), P(x, y, H)], pal.wallR);
      this.box(x + 0.08, y + 0.45, 1.15, 0.08, 0.35, 0.35, '#222', '#1a1a1a', '#111');
      const lamp = this.iso(x + 0.65, y + 0.65, H - 0.05);
      this.ctx.fillStyle = 'rgba(255,230,160,.9)';
      this.ctx.beginPath();
      this.ctx.ellipse(lamp.x, lamp.y, 8, 4, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.stool(x + 0.65, y + 0.6, 0.43, '#c96442');
    });
    add(x + 1.3 + y + 0.65 + 0.3, () => {
      this.poly([P(x + 1.3, y, 0), P(x + 1.3, y + 1.3, 0), P(x + 1.3, y + 1.3, H), P(x + 1.3, y, H)], pal.glass, pal.glassEdge);
      this.poly([P(x, y + 1.3, 0), P(x + 1.3, y + 1.3, 0), P(x + 1.3, y + 1.3, H), P(x, y + 1.3, H)], pal.glass, pal.glassEdge);
      this.poly([P(x + 0.85, y + 1.3, 0), P(x + 0.87, y + 1.3, 0), P(x + 0.87, y + 1.3, H), P(x + 0.85, y + 1.3, H)], pal.glassEdge);
      this.box(x - 0.03, y - 0.03, H, 1.36, 1.36, 0.08, pal.dark ? '#4a5868' : '#b5c4d3', pal.trim, pal.trim);
    });
  }

  // ------------------------------------------------------------ Escritorios y Pantallas

  private desk(dk: DeskSlot, p?: Person | null): void {
    const pal = this.pal;
    const { x, y } = dk;
    for (const [lx, ly] of [
      [0.05, 0.05],
      [1.27, 0.05],
      [0.05, 0.67],
      [1.27, 0.67],
    ]) {
      this.box(x + lx, y + ly, 0, 0.08, 0.08, 0.72, pal.deskL, pal.deskL, pal.deskR);
    }
    this.box(x, y, 0.72, 1.4, 0.8, 0.07, pal.deskTop, pal.deskL, pal.deskR);
    const worker = p && p.mode === 'work' ? p : null;

    if (dk.side === 's') {
      const mx = x + 0.42;
      const my = y + 0.1;
      const mz = 0.79;
      this.box(mx + 0.22, my + 0.04, mz, 0.1, 0.1, 0.18, pal.monitor, pal.monitor, pal.monitor);
      this.box(mx, my, mz + 0.18, 0.56, 0.08, 0.42, pal.monitor, pal.monitor, this.shade(pal.monitor, 10));
      this.screen(mx + 0.04, my + 0.08, mz + 0.22, 0.48, 0.34, worker);
      this.box(x + 0.48, y + 0.48, 0.79, 0.44, 0.16, 0.025, '#d8d8d8', '#aaa', '#999');
    } else {
      const mx = x + 0.42;
      const my = y + 0.6;
      const mz = 0.79;
      this.box(x + 0.48, y + 0.16, 0.79, 0.44, 0.16, 0.025, '#d8d8d8', '#aaa', '#999');
      this.box(mx + 0.22, my - 0.02, mz, 0.1, 0.1, 0.18, pal.monitor, pal.monitor, pal.monitor);
      this.box(mx, my, mz + 0.18, 0.56, 0.08, 0.42, this.shade(pal.monitor, 15), this.shade(pal.monitor, 8), this.shade(pal.monitor, 12));
      if (worker) {
        const g = this.iso(mx + 0.28, my + 0.08, mz + 0.5);
        this.ctx.fillStyle = STATUS_COLOR[worker.s.status] || '#888';
        this.ctx.globalAlpha = 0.6 + 0.4 * Math.sin(this.t / 400 + worker.phase);
        this.ctx.beginPath();
        this.ctx.arc(g.x, g.y, 1.8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
      }
    }

    // Toques personales estables por puesto
    const h = hash(`${x.toFixed(1)},${y.toFixed(1)}`);
    if (h % 3 === 0) {
      this.box(x + 1.12, y + 0.3, 0.79, 0.12, 0.12, 0.13, '#f2f2f2', '#d0d0d0', '#bbb');
    }
    if (h % 5 === 1) {
      this.box(x + 0.14, y + 0.24, 0.79, 0.12, 0.12, 0.08, pal.pot, pal.pot, this.shade(pal.pot, -15));
      const q = this.iso(x + 0.2, y + 0.3, 0.87);
      this.ctx.fillStyle = pal.plant;
      this.ctx.beginPath();
      this.ctx.ellipse(q.x, q.y - 4, 4, 6, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }
    if (h % 4 === 2) {
      this.box(x + 0.12, y + 0.45, 0.79, 0.22, 0.15, 0.05, '#f2d16b', '#d9b84f', '#c4a33f');
    }
  }

  private screen(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    p?: Person | null
  ): void {
    const P = (a: number, b: number, cc: number) => this.iso(a, b, cc);
    const st = p ? p.s.status : 'off';
    const base: Record<string, string> = {
      thinking: '#3a3160',
      tool: '#14324f',
      typing: '#123d2e',
      waiting: '#4d3510',
      error: '#4a1612',
    };
    const corners = [P(x, y, z), P(x + w, y, z), P(x + w, y, z + h), P(x, y, z + h)];
    this.poly(corners, base[st] || this.pal.screenOff);
    if (!p) return;

    const c = this.ctx;
    c.save();
    c.beginPath();
    corners.forEach((q, i) => (i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y)));
    c.closePath();
    c.clip();

    const t = this.t / 1000;
    const col = STATUS_COLOR[st] || '#888';

    if (st === 'tool' || st === 'typing') {
      const scroll = (t * (st === 'tool' ? 2.2 : 1.2) + p.phase) % 1;
      for (let i = -1; i < 6; i++) {
        const zz = z + h - 0.05 - ((i + scroll) * h) / 5;
        const len = 0.12 + ((p.h >> ((i + 8) & 15)) % 7) / 20;
        const a = P(x + 0.05, y, zz);
        const b = P(x + 0.05 + Math.min(len, w - 0.1), y, zz);
        c.strokeStyle = i % 3 === 0 ? col : 'rgba(255,255,255,.55)';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.stroke();
      }
    } else {
      const m = P(x + w / 2, y, z + h / 2);
      c.fillStyle = col;
      c.globalAlpha = st === 'thinking' ? 0.5 + 0.4 * Math.sin(t * 3 + p.phase) : 0.9;
      c.font = '700 10px ui-sans-serif, system-ui, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const markMap: Record<string, string> = { thinking: '…', waiting: '?', error: '!' };
      const mark = markMap[st] || '';
      c.fillText(mark, m.x, m.y);
    }
    c.restore();

    // Reflejo de luz de la pantalla proyectado sobre la mesa
    c.save();
    c.globalAlpha = 0.22;
    const g = P(x + w / 2, y + 0.35, 0.8);
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(g.x, g.y, 18, 7, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  private chair(dk: DeskSlot, p?: Person | null): void {
    const pal = this.pal;
    const sx = dk.seat.x - 0.25;
    const sy = dk.seat.y - 0.22;
    const seated =
      p &&
      !p.path.length &&
      p.pose === 'sit' &&
      Math.hypot(p.x - dk.seat.x, p.y - dk.seat.y) < 0.05;
    const ox = seated ? 0 : 0.12;
    const oy = seated ? 0 : dk.side === 's' ? 0.18 : -0.18;

    this.box(sx + 0.22 + ox, sy + 0.19 + oy, 0, 0.06, 0.06, 0.32, '#222', '#222', '#111');
    if (dk.side === 'n') {
      this.box(
        sx + ox,
        sy + oy - 0.05,
        0.4,
        0.5,
        0.07,
        0.55,
        this.shade(pal.chair, 15),
        pal.chair,
        this.shade(pal.chair, -10)
      );
    }
    this.box(
      sx + ox,
      sy + oy,
      0.32,
      0.5,
      0.45,
      0.08,
      this.shade(pal.chair, 15),
      pal.chair,
      this.shade(pal.chair, -10)
    );
    if (dk.side === 's' && !seated) {
      this.box(
        sx + ox,
        sy + oy + 0.4,
        0.4,
        0.5,
        0.07,
        0.5,
        this.shade(pal.chair, 15),
        pal.chair,
        this.shade(pal.chair, -10)
      );
    }
  }

  // ------------------------------------------------------------ Personajes Chibi y Animaciones

  private stateOf(p: Person): {
    pose: 'sit' | 'stand' | 'walk';
    face: 'front' | 'back';
    act: string | null;
    sitZ: number;
  } {
    const s = p.s || ({} as any);
    if (p.path.length) return { pose: 'walk', face: p.walkFace, act: null, sitZ: 0 };
    if (p.mode === 'work' && p.desk) {
      const face = p.desk.side === 'n' ? 'front' : 'back';
      if (s.status === 'waiting' || s.status === 'error') {
        return { pose: 'stand', face, act: 'wave', sitZ: 0 };
      }
      return {
        pose: 'sit',
        face,
        act: s.status === 'tool' || s.status === 'typing' ? 'type' : 'think',
        sitZ: 0.34,
      };
    }
    if (p.mode === 'wander' && p.poi) {
      const q = p.poi;
      return {
        pose: q.sit ? 'sit' : 'stand',
        face: q.face === 'side' ? 'front' : q.face,
        act: q.act,
        sitZ: q.sit || 0,
      };
    }
    return { pose: 'stand', face: 'front', act: null, sitZ: 0 };
  }

  private person(p: Person): { x: number; y: number; act: string | null } {
    const c = this.ctx;
    const t = this.t / 1000;
    const s = p.s || ({} as any);
    const st = this.stateOf(p);
    p.pose = st.pose;

    const moving = st.pose === 'walk';
    const seated = st.pose === 'sit';
    const front = st.face !== 'back';
    const b = this.iso(p.x, p.y, st.sitZ);
    const step = moving ? Math.sin(t * 12 + p.phase) : 0;
    const bob = moving ? Math.abs(step) * 1.5 : 0;

    const fb = this.iso(p.x, p.y, 0);
    c.fillStyle = this.pal.shadow;
    c.beginPath();
    c.ellipse(fb.x, fb.y, 10, 5, 0, 0, Math.PI * 2);
    c.fill();

    const isHover = this.hoverKey === p.key;
    const isSelected = this.selectedKey === p.key;
    if (isHover || isSelected) {
      c.strokeStyle = isSelected ? '#38bdf8' : (STATUS_COLOR[s.status] || '#888');
      c.lineWidth = isSelected ? 3 : 2;
      c.beginPath();
      c.ellipse(fb.x, fb.y, 14, 7, 0, 0, Math.PI * 2);
      c.stroke();
    }

    let x = b.x;
    const y = b.y - bob;
    if (st.act === 'pingpong') x += Math.sin(t * 7 + p.phase) * 4;
    if (st.act === 'foosball') x += Math.sin(t * 5 + p.phase) * 1.5;

    c.save();
    c.translate(x, y);

    // Pantalones
    c.fillStyle = p.pants;
    if (seated) {
      c.fillRect(-5, -4, 4, 5);
      c.fillRect(1, -4, 4, 5);
    } else {
      c.fillRect(-5, -10, 4, 10 + step * 2);
      c.fillRect(1, -10, 4, 10 - step * 2);
      c.fillStyle = '#2a2a2a';
      c.fillRect(-5, -1 + step, 4, 2);
      c.fillRect(1, -1 - step, 4, 2);
    }

    // Camiseta con bordes redondeados
    const hip = seated ? -4 : -10;
    this.roundRect(-7, hip - 13, 14, 14, 3, p.shirt);

    const arm = this.shade(p.shirt, -18);
    const hand = (hx: number, hy: number) => {
      c.fillStyle = p.skin;
      c.beginPath();
      c.arc(hx, hy, 2.2, 0, Math.PI * 2);
      c.fill();
    };

    c.fillStyle = arm;
    const sip = Math.sin(t * 0.9 + p.phase) > 0.6;

    switch (st.act) {
      case 'wave': {
        const wave = Math.sin(t * 8 + p.phase) * 2;
        c.fillRect(6, hip - 26, 3, 14);
        hand(7.5 + wave * 0.5, hip - 27);
        c.fillStyle = arm;
        c.fillRect(-9, hip - 11, 3, 10);
        break;
      }
      case 'type': {
        const k1 = Math.sin(t * 18 + p.phase) > 0 ? 1 : 0;
        c.fillRect(-9, hip - 11 - k1, 3, 8);
        c.fillRect(6, hip - 11 - (1 - k1), 3, 8);
        break;
      }
      case 'coffee':
      case 'water': {
        c.fillRect(-9, hip - 11, 3, 10);
        c.fillRect(6, sip ? hip - 15 : hip - 11, 3, sip ? 7 : 10);
        const cupY = sip && front ? hip - 19 : hip - 4;
        c.fillStyle = st.act === 'water' ? 'rgba(170,215,255,.95)' : '#fafafa';
        c.fillRect(6, cupY, 5, 6);
        if (st.act === 'coffee') {
          c.fillStyle = '#6b3f22';
          c.fillRect(7, cupY, 3, 1.5);
        }
        break;
      }
      case 'read': {
        c.fillRect(-8, hip - 11, 3, 7);
        c.fillRect(5, hip - 11, 3, 7);
        if (front) {
          c.fillStyle = pick(this.pal.book, p.h, 5);
          c.fillRect(-7, hip - 12, 14, 9);
          c.fillStyle = '#fff';
          c.fillRect(-0.5, hip - 12, 1, 9);
        }
        break;
      }
      case 'whiteboard':
      case 'arcade': {
        const k = Math.sin(t * (st.act === 'arcade' ? 14 : 3) + p.phase);
        c.fillRect(-9, hip - 11, 3, 10);
        c.fillRect(6, hip - 20 + k * 2, 3, 12);
        hand(7.5, hip - 21 + k * 2);
        break;
      }
      case 'pingpong': {
        c.fillRect(-9, hip - 11, 3, 10);
        c.fillRect(6, hip - 14, 3, 9);
        c.fillStyle = '#c0392b';
        c.beginPath();
        c.arc(10, hip - 16, 4, 0, Math.PI * 2);
        c.fill();
        break;
      }
      case 'foosball': {
        const k1 = Math.sin(t * 16 + p.phase) * 1.5;
        c.fillRect(-9, hip - 12 + k1, 3, 7);
        c.fillRect(6, hip - 12 - k1, 3, 7);
        break;
      }
      case 'phone': {
        c.fillRect(-9, hip - 11, 3, 10);
        c.fillRect(5, hip - 22, 3, 12);
        c.fillStyle = '#222';
        c.fillRect(5, hip - 25, 3, 6);
        break;
      }
      case 'nap': {
        c.fillRect(-9, hip - 13, 3, 6);
        c.fillRect(6, hip - 13, 3, 6);
        break;
      }
      default: {
        const sw = moving ? step * 2 : 0;
        c.fillRect(-9, hip - 11 + sw, 3, 10);
        c.fillRect(6, hip - 11 - sw, 3, 10);
      }
    }

    const napping = st.act === 'nap';
    const hy =
      hip - 20 + (napping ? 7 : 0) + (st.act === 'think' ? Math.sin(t * 1.5 + p.phase) * 0.6 : 0);

    // Cabeza
    c.fillStyle = p.skin;
    c.beginPath();
    c.arc(0, hy, 7, 0, Math.PI * 2);
    c.fill();

    // Pelo y rostro
    c.fillStyle = p.hair;
    if (front && !napping) {
      c.beginPath();
      c.arc(0, hy - 1.5, 7.3, Math.PI * 1.05, Math.PI * 1.95);
      c.fill();
      if (p.hairStyle === 1) {
        c.fillRect(-7.3, hy - 2, 2.5, 8);
        c.fillRect(4.8, hy - 2, 2.5, 8);
      }
      if (p.hairStyle === 2) {
        c.beginPath();
        c.arc(0, hy - 8, 3.2, 0, Math.PI * 2);
        c.fill();
      }

      // Ojos con pestañeo estocástico
      c.fillStyle = '#2a2018';
      const sleepy = s.status === 'idle';
      const blink = Math.sin(t * 0.7 + p.phase * 3) > 0.985;
      c.fillRect(-3, hy - 0.5, 1.6, blink || sleepy ? 0.7 : 2);
      c.fillRect(1.6, hy - 0.5, 1.6, blink || sleepy ? 0.7 : 2);

      // Expresión de boca
      c.strokeStyle = '#2a2018';
      c.lineWidth = 1;
      if (p.mode === 'wander' && !sleepy) {
        c.beginPath();
        c.arc(0, hy + 2.2, 2, 0.15 * Math.PI, 0.85 * Math.PI);
        c.stroke();
      } else if (s.status === 'error' && p.mode === 'work') {
        c.beginPath();
        c.arc(0, hy + 4.5, 2, 1.15 * Math.PI, 1.85 * Math.PI);
        c.stroke();
      }
    } else {
      c.beginPath();
      c.arc(0, hy - 0.5, 7.2, 0, Math.PI * 2);
      c.fill();
      if (p.hairStyle === 2) {
        c.beginPath();
        c.arc(0, hy - 7, 3.2, 0, Math.PI * 2);
        c.fill();
      }
      if (p.hairStyle === 1) c.fillRect(-6, hy, 12, 8);
    }

    if (st.act === 'arcade' || st.act === 'beanbag') {
      c.strokeStyle = '#222';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, hy, 8, Math.PI * 1.1, Math.PI * 1.9);
      c.stroke();
    }
    c.restore();

    const headTop = y + hy - 8;
    this.hit.push({
      key: p.key,
      x0: x - 28,
      x1: x + 28,
      y0: headTop - 36,
      y1: fb.y + 8,
    });

    return { x, y: headTop, act: st.act };
  }

  // ------------------------------------------------------------ Burbujas de Estado y Badges

  private bubble(p: Person, at: { x: number; y: number; act: string | null }): void {
    const c = this.ctx;
    const t = this.t / 1000;
    const s = p.s || ({} as any);
    const st = s.status;
    const pal = this.pal;
    const x = at.x;
    const y = at.y - 6;

    c.save();
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const font = (w: number, px: number) =>
      `${w} ${px}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
    c.font = font(600, 10);

    const badge = AGENT_BADGES[s.agent] || AGENT_BADGES.ingest;

    const pill = (
      text: string,
      fg: string,
      bg: string,
      yy: number,
      alpha = 1,
      identify = false
    ) => {
      c.globalAlpha = alpha;
      let tx = text;
      while (c.measureText(tx).width > 120 && tx.length > 2) tx = tx.slice(0, -2) + '…';
      const extra = badge && identify ? 26 : 0;
      const w = c.measureText(tx).width + 12 + extra;
      const height = extra ? 22 : 16;
      this.roundRect(x - w / 2, yy - height / 2, w, height, 8, bg);
      c.fillStyle = fg;
      c.fillText(tx, x + extra / 2, yy + 0.5);
      if (extra) this.agentBadge(badge, x - w / 2 + 13, yy);
      c.globalAlpha = 1;
      return yy - 8;
    };

    let top = y;
    if (p.mode === 'work' && !p.path.length) {
      const col = STATUS_COLOR[st] || '#888';
      if (st === 'thinking') {
        c.fillStyle = pal.bubble;
        c.beginPath();
        c.arc(x + 6, y - 2, 2, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(x + 10, y - 7, 3, 0, Math.PI * 2);
        c.fill();
        this.roundRect(x - 2, y - 26, 32, 16, 8, pal.bubble);
        for (let i = 0; i < 3; i++) {
          c.fillStyle = col;
          c.globalAlpha = 0.3 + 0.7 * Math.max(0, Math.sin(t * 5 - i * 0.7));
          c.beginPath();
          c.arc(x + 6 + i * 8, y - 18, 2.4, 0, Math.PI * 2);
          c.fill();
        }
        c.globalAlpha = 1;
        top = y - 26;
      } else if (st === 'typing') {
        this.roundRect(x - 2, y - 24, 34, 16, 5, col);
        c.beginPath();
        c.moveTo(x + 2, y - 9);
        c.lineTo(x - 2, y - 3);
        c.lineTo(x + 8, y - 9);
        c.fillStyle = col;
        c.fill();
        const n = Math.floor(t * 4) % 4;
        c.fillStyle = '#fff';
        for (let i = 0; i < n; i++) {
          c.beginPath();
          c.arc(x + 7 + i * 8, y - 16, 2, 0, Math.PI * 2);
          c.fill();
        }
        top = y - 24;
      } else if (st === 'tool') {
        top = pill('⚙ ' + (s.taskSummary || 'FFmpeg'), '#fff', col, y - 12);
      } else if (st === 'waiting' || st === 'error') {
        const jump = Math.abs(Math.sin(t * 4)) * 4;
        c.fillStyle = col;
        c.beginPath();
        c.arc(x, y - 12 - jump, 9, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#fff';
        c.font = font(800, 12);
        c.fillText('!', x, y - 11.5 - jump);
        c.font = font(600, 10);
        top = y - 22 - jump;
      }
    } else if (p.mode === 'wander') {
      const justDone = st === 'done';
      const dozing = at.act === 'nap' || (st === 'idle' && (at.act === 'couch' || at.act === 'beanbag'));
      if (justDone) {
        c.fillStyle = STATUS_COLOR.done;
        c.beginPath();
        c.arc(x, y - 10, 7, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#fff';
        c.font = font(800, 9);
        c.fillText('✓', x, y - 9.5);
        c.font = font(600, 10);
        top = y - 18;
      } else if (dozing && !p.path.length) {
        c.fillStyle = STATUS_COLOR.idle;
        c.font = font(700, 10);
        for (let i = 0; i < 3; i++) {
          const k = (t * 0.6 + i / 3) % 1;
          c.globalAlpha = 1 - k;
          c.fillText('z', x + 6 + k * 10, y - 4 - k * 18);
        }
        c.globalAlpha = 1;
        c.font = font(600, 10);
        top = y - 20;
      } else if (at.act && ACT_EMOJI[at.act] && !p.path.length) {
        const cycle = (t + p.phase * 3) % 9;
        if (cycle < 2.2) {
          c.globalAlpha = Math.min(1, cycle * 3, (2.2 - cycle) * 3);
          c.font = font(400, 13);
          c.fillText(ACT_EMOJI[at.act], x, y - 10);
          c.globalAlpha = 1;
          c.font = font(600, 10);
          top = y - 18;
        }
      }
    }

    const hover = this.hoverKey === p.key || this.selectedKey === p.key;
    pill(s.name || s.key, pal.text, pal.tagBg, top - 11, p.mode === 'work' || hover ? 1 : 0.75, true);

    c.restore();
  }

  private agentBadge(
    badge: { short: string; color: string },
    x: number,
    y: number
  ): void {
    const c = this.ctx;
    c.save();
    c.beginPath();
    c.arc(x, y, 7.5, 0, Math.PI * 2);
    c.fillStyle = badge.color;
    c.fill();
    c.fillStyle = '#ffffff';
    c.font = '800 8px ui-sans-serif, system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(badge.short, x, y + 0.5);
    c.restore();
  }

  // ------------------------------------------------------------ Gato de Oficina

  private moveCat(dt: number, now: number): void {
    const k = this.cat;
    if (!k.path.length && now > k.until) {
      const { W, D, grid } = this.plan;
      let tx: number, ty: number;
      let tries = 0;
      do {
        tx = rand(0.6, W - 0.6);
        ty = rand(1, D - 0.6);
        tries++;
      } while (grid.blocked(tx, ty) && tries < 30);
      k.path = grid.path(k.x, k.y, tx, ty);
      k.until = Infinity;
    }
    if (k.path.length) {
      const n = k.path[0];
      const dx = n.x - k.x;
      const dy = n.y - k.y;
      const d = Math.hypot(dx, dy);
      const v = 1.2 * dt;
      if (d > 0.001) k.face = dx - dy >= 0 ? 1 : -1;
      if (d <= v) {
        k.x = n.x;
        k.y = n.y;
        k.path.shift();
        if (!k.path.length) k.until = now + rand(4000, 12000);
      } else {
        k.x += (dx / d) * v;
        k.y += (dy / d) * v;
      }
    }
  }

  private drawCat(): void {
    const k = this.cat;
    const c = this.ctx;
    const p = this.iso(k.x, k.y, 0);
    const t = this.t / 1000;
    const walking = k.path.length > 0;

    c.save();
    c.translate(p.x, p.y);
    c.scale(k.face, 1);
    c.fillStyle = this.pal.shadow;
    c.beginPath();
    c.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2);
    c.fill();

    const col = '#e09a4a';
    c.fillStyle = col;
    if (walking) {
      const s = Math.sin(t * 14) * 1.5;
      c.fillRect(-5, -4, 2, 4 + s);
      c.fillRect(3, -4, 2, 4 - s);
    }
    c.beginPath();
    c.ellipse(0, walking ? -6 : -4, 7, walking ? 4 : 5, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(6, walking ? -10 : -9, 3.6, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(4, -12);
    c.lineTo(5, -16);
    c.lineTo(7, -12.5);
    c.fill();
    c.beginPath();
    c.moveTo(7, -12.5);
    c.lineTo(9, -15.5);
    c.lineTo(9.5, -11);
    c.fill();
    c.strokeStyle = col;
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-6, -6);
    c.quadraticCurveTo(-12, -8 + Math.sin(t * 3) * 3, -10, -14);
    c.stroke();
    c.fillStyle = '#2a2018';
    c.fillRect(7, -10.5, 1.2, walking ? 1.2 : 0.6);
    c.restore();
  }

  private pingPongBall(): void {
    const players = this.plan.pois
      .filter((q) => q.pair === 'pp' && q.taken)
      .map((q) => this.people.get(q.taken!))
      .filter((p) => p && p.poi && p.poi.pair === 'pp' && !p.path.length);
    if (players.length < 2) return;

    const pp = this.plan.pp;
    const k = (this.t / 900) % 2;
    const f = k < 1 ? k : 2 - k;
    const x = pp.x0 + 0.3 + f * (pp.x1 - pp.x0 - 0.6);
    const z = 0.8 + Math.abs(Math.sin(f * Math.PI * 2)) * 0.45;
    const c = this.ctx;

    const sh = this.iso(x, pp.y, 0.77);
    c.fillStyle = 'rgba(0,0,0,.25)';
    c.beginPath();
    c.ellipse(sh.x, sh.y, 2.5, 1.2, 0, 0, Math.PI * 2);
    c.fill();

    const p = this.iso(x, pp.y, z);
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
    c.fill();
  }

  // ------------------------------------------------------------ Frame Loop & Z-Sorting

  private frame(now: number): void {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t = now;
    if (!this.visible) return;

    this.step(dt);
    this.draw();
  }

  private step(dt: number): void {
    const wall = Date.now();
    for (const [k, p] of this.people) {
      if (p.mode === 'wander') {
        if (p.poi && !p.path.length && p.until === Infinity) {
          p.until = wall + (p.stay || 10000);
        }
        this.wander(p, wall);
      }
      if (p.path.length) {
        const n = p.path[0];
        const dx = n.x - p.x;
        const dy = n.y - p.y;
        const d = Math.hypot(dx, dy);
        const v = SPEED * dt;
        if (d > 0.001) p.walkFace = dx + dy >= 0 ? 'front' : 'back';
        if (d <= v) {
          p.x = n.x;
          p.y = n.y;
          p.path.shift();
        } else {
          p.x += (dx / d) * v;
          p.y += (dy / d) * v;
        }
      } else if (p.leaving) {
        this.people.delete(k);
      }
    }
    this.moveCat(dt, wall);
  }

  private draw(): void {
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.cw, this.ch);

    this.fitCamera();
    if (!this.cam) return;

    c.translate(this.cam.ox, this.cam.oy);
    c.scale(this.cam.zoom, this.cam.zoom);

    this.drawRoom();

    const occupant = new Map<DeskSlot, Person>();
    for (const p of this.people.values()) {
      if (p.mode === 'work' && p.desk) occupant.set(p.desk, p);
      else if (p.napDesk) occupant.set(p.napDesk, p);
    }

    const items: Array<{ depth: number; draw?: () => void; person?: Person }> = [
      ...this.plan.items,
    ];

    for (const dk of this.plan.desks) {
      const p = occupant.get(dk);
      items.push({
        depth: dk.x + 0.7 + dk.y + 0.4,
        draw: () => this.desk(dk, p),
      });
      items.push({
        depth: dk.seat.x + dk.seat.y - 0.06,
        draw: () => this.chair(dk, p),
      });
    }

    for (const p of this.people.values()) {
      items.push({
        depth: p.x + p.y + 0.01,
        person: p,
      });
    }

    items.push({
      depth: this.cat.x + this.cat.y,
      draw: () => this.drawCat(),
    });

    items.sort((a, b) => a.depth - b.depth);

    this.hit = [];
    const heads: Array<[Person, { x: number; y: number; act: string | null }]> = [];
    for (const it of items) {
      if (it.person) {
        heads.push([it.person, this.person(it.person)]);
      } else if (it.draw) {
        it.draw();
      }
    }

    this.pingPongBall();

    for (const [p, at] of heads) {
      this.bubble(p, at);
    }

    if (this.offDuty > 0) {
      const d = this.iso(0.2, this.plan.door.y + 0.9, 0);
      c.font = '600 10px ui-sans-serif, system-ui, sans-serif';
      c.textAlign = 'center';
      c.fillStyle = this.pal.text;
      c.globalAlpha = 0.65;
      c.fillText(`+${this.offDuty} en descanso`, d.x - 10, d.y + 14);
      c.globalAlpha = 1;
    }

    const z = this.cam.zoom;
    this.hit = this.hit.map((h) => ({
      key: h.key,
      x0: h.x0 * z + this.cam!.ox,
      x1: h.x1 * z + this.cam!.ox,
      y0: h.y0 * z + this.cam!.oy,
      y1: h.y1 * z + this.cam!.oy,
    }));
  }

  // ------------------------------------------------------------ Interacción del Ratón

  private setupListeners(): void {
    this.canvas.addEventListener('mousemove', (e) => this.pointer(e, false));
    this.canvas.addEventListener('click', (e) => this.pointer(e, true));
    this.canvas.addEventListener('mouseleave', () => {
      this.hoverKey = null;
      if (this.onHoverAgent) this.onHoverAgent(null);
    });
  }

  private pointer(e: MouseEvent, click: boolean): void {
    const r = this.canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    let found: HitTarget | null = null;

    for (let i = this.hit.length - 1; i >= 0; i--) {
      const h = this.hit[i];
      if (mx >= h.x0 && mx <= h.x1 && my >= h.y0 && my <= h.y1) {
        found = h;
        break;
      }
    }

    const key = found ? found.key : null;
    this.canvas.style.cursor = key ? 'pointer' : 'default';

    if (click && key) {
      this.selectedKey = key;
      if (this.onSelectAgent) this.onSelectAgent(key);
    }

    if (key !== this.hoverKey) {
      this.hoverKey = key;
      if (this.onHoverAgent) this.onHoverAgent(key);
    }
  }
}
