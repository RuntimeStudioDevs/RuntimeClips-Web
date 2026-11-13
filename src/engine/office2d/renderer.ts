// RuntimeClips-Web — Motor Isométrico Canvas 2D Completo (Portado y Adaptado de myoffice)

import type {
  Point2D,
  Person,
  AgentSession,
  OfficePlan,
  ThemePalette,
  HitTarget,
  DeskSlot,
  POI,
} from './types';
import { getThemePalette, buildRuntimeOfficePlan } from './layout';

const TW = 64; // Ancho del tile en píxeles
const TH = 32; // Alto del tile en píxeles (la relación 2:1 clásica isométrica)
const WALL_H = 2.4;
const WORKING_STATUSES = new Set(['thinking', 'tool', 'typing', 'waiting', 'error']);
const MAX_WANDERERS = 6;
const SPEED = 2.2; // Baldosas por segundo

const SKIN_TONES = ['#f3cfb0', '#e5b38f', '#c98d66', '#9a6646', '#6e4630', '#f7dcc7'];
const HAIR_COLORS = ['#2a2019', '#4b3020', '#8a4b2a', '#c99a5b', '#1c1c1c', '#71717a', '#dc2626', '#3b82f6'];
const PANTS_COLORS = ['#334155', '#1e293b', '#3f3f46', '#18181b', '#374151'];

const AGENT_COLORS: Record<string, string[]> = {
  ingest: ['#3b82f6', '#60a5fa', '#2563eb'],
  vision: ['#a855f7', '#c084fc', '#9333ea'],
  facetrack: ['#06b6d4', '#22d3ee', '#0891b2'],
  music: ['#f43f5e', '#fb7185', '#e11d48'],
  subtitles: ['#eab308', '#facc15', '#ca8a04'],
  broll: ['#10b981', '#34d399', '#059669'],
  render: ['#f97316', '#fb923c', '#ea580c'],
  qa: ['#8b5cf6', '#a78bfa', '#7c3aed'],
  publisher: ['#ec4899', '#f472b6', '#db2777'],
  default: ['#64748b', '#94a3b8', '#475569'],
};

export const STATUS_COLORS: Record<string, string> = {
  thinking: '#a855f7',
  tool: '#0284c7',
  typing: '#10b981',
  waiting: '#f59e0b',
  done: '#22c55e',
  error: '#ef4444',
  interrupted: '#71717a',
  idle: '#94a3b8',
};

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: T[], h: number, salt: number): T {
  return arr[(Math.imul(h ^ Math.imul(salt, 2654435761), 2246822519) >>> 0) % arr.length];
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function getSkyColor(d = new Date()): { sky: string; night: boolean } {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 7 && h < 17) return { sky: '#93c5fd', night: false };
  if (h >= 5 && h < 7) return { sky: '#fed7aa', night: false };
  if (h >= 17 && h < 19) return { sky: '#fdba74', night: false };
  return { sky: '#0f172a', night: true };
}

export class Office2dRenderer {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  private root: HTMLElement;
  private onSelectAgent: (key: string | null) => void;
  private onHoverAgent: (key: string | null) => void;

  public pal: ThemePalette;
  public plan: OfficePlan;
  public people: Map<string, Person> = new Map();
  public deskOf: Map<string, number> = new Map();
  public offDuty = 0;
  public hit: HitTarget[] = [];
  public hoverKey: string | null = null;
  public selectedKey: string | null = null;

  public t = performance.now();
  public last = performance.now();
  private raf = 0;
  private dead = false;
  private dpr = 1;
  private cw = 800;
  private ch = 600;

  // Cámara e Inset (para cuando se abre el panel lateral)
  private zoom = 1;
  private ox = 0;
  private oy = 0;
  private insetFrom = 0;
  private insetTo = 0;
  private insetT0 = -Infinity;

  // Gato de la oficina
  public cat = {
    x: 10,
    y: 12,
    path: [] as Point2D[],
    until: 0,
    face: 1,
    act: 'idle',
  };

  constructor(
    root: HTMLElement,
    options: {
      isDark?: boolean;
      onSelectAgent?: (key: string | null) => void;
      onHoverAgent?: (key: string | null) => void;
    } = {}
  ) {
    this.root = root;
    this.onSelectAgent = options.onSelectAgent || (() => {});
    this.onHoverAgent = options.onHoverAgent || (() => {});
    this.pal = getThemePalette(options.isDark || false);
    this.plan = buildRuntimeOfficePlan(9, this.pal);

    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.cursor = 'default';
    this.root.appendChild(this.canvas);

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not obtain 2D canvas context');
    this.ctx = ctx;

    this.cat.x = this.plan.W - 3;
    this.cat.y = this.plan.D - 3;

    this.setupListeners();
    this.resize();
    this.startLoop();
  }

  public destroy(): void {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    this.canvas.remove();
  }

  public setDarkMode(isDark: boolean): void {
    this.pal = getThemePalette(isDark);
  }

  public setInset(px: number, animate = true): void {
    const now = performance.now();
    this.insetFrom = animate ? this.currentInset(now) : px;
    this.insetTo = px;
    this.insetT0 = animate ? now : -Infinity;
  }

  private currentInset(now = performance.now()): number {
    if (this.insetTo == null) return 0;
    const k = Math.min(1, (now - this.insetT0) / 320);
    const e = 1 - Math.pow(1 - k, 3); // Ease out
    return this.insetFrom + (this.insetTo - this.insetFrom) * e;
  }

  // ------------------------------------------------------------ Cámara y Proyección

  public iso(x: number, y: number, z = 0): Point2D {
    return {
      x: ((x - y) * (TW / 2)) * this.zoom + this.ox,
      y: ((x + y) * (TH / 2) - z * TH) * this.zoom + this.oy,
    };
  }

  private shade(hex: string, percent: number): string {
    if (hex.startsWith('rgba')) return hex;
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = clamp((num >> 16) + amt, 0, 255);
    const G = clamp(((num >> 8) & 0x00ff) + amt, 0, 255);
    const B = clamp((num & 0x0000ff) + amt, 0, 255);
    return `#${(0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  }

  public resize(): void {
    const r = this.root.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.cw = Math.max(300, r.width);
    this.ch = Math.max(300, r.height);
    this.canvas.width = Math.round(this.cw * this.dpr);
    this.canvas.height = Math.round(this.ch * this.dpr);
    this.canvas.style.width = `${this.cw}px`;
    this.canvas.style.height = `${this.ch}px`;
  }

  private fitCamera(): void {
    const { W, D } = this.plan;
    // Puntos límite de la sala
    const left = (0 - D) * (TW / 2);
    const right = (W - 0) * (TW / 2);
    const top = (0 + 0) * (TH / 2) - WALL_H * TH - 25;
    const bottom = (W + D) * (TH / 2) + 15;

    const inset = this.currentInset();
    const visibleWidth = Math.max(200, this.cw - inset);
    const targetZoom = Math.min(visibleWidth / (right - left + 60), this.ch / (bottom - top + 60), 1.6);

    const targetOx = visibleWidth / 2 - ((left + right) / 2) * targetZoom;
    const targetOy = this.ch / 2 - ((top + bottom) / 2) * targetZoom;

    // Suavizado suave
    this.zoom += (targetZoom - this.zoom) * 0.1;
    this.ox += (targetOx - this.ox) * 0.1;
    this.oy += (targetOy - this.oy) * 0.1;
  }

  // ------------------------------------------------------------ Primitivas Geométricas

  public poly(points: Point2D[], fill: string | null, stroke?: string): void {
    const c = this.ctx;
    if (points.length < 3) return;
    c.beginPath();
    c.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) c.lineTo(points[i].x, points[i].y);
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
    topCol: string,
    leftCol: string,
    rightCol: string
  ): void {
    const P = (a: number, b: number, c: number) => this.iso(a, b, c);
    // Cara Superior (Top)
    this.poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], topCol);
    // Cara Izquierda (Left)
    this.poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], leftCol);
    // Cara Derecha (Right)
    this.poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], rightCol);
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number, fill?: string, stroke?: string): void {
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
      c.lineWidth = 1.2;
      c.stroke();
    }
  }

  // ------------------------------------------------------------ Sincronización con Agentes

  public updateSessions(sessions: AgentSession[]): void {
    const working = sessions.filter((s) => WORKING_STATUSES.has(s.status));
    const off = sessions
      .filter((s) => !WORKING_STATUSES.has(s.status))
      .sort((a, b) => (b.lastEventAt || 0) - (a.lastEventAt || 0));

    const wanderers = off.slice(0, MAX_WANDERERS);
    this.offDuty = off.length - wanderers.length;

    // Asignación de escritorios prioritarios a los que están trabajando
    const workKeys = new Set(working.map((s) => s.key));
    for (const k of [...this.deskOf.keys()]) {
      if (!workKeys.has(k)) this.deskOf.delete(k);
    }
    const used = new Set(this.deskOf.values());
    const desks = this.plan.desks;

    // Asignar primer escritorio disponible con preferencia a los que miran al frente (side === 's')
    const order = desks.map((_, i) => i).sort((a, b) => (desks[a].side === 's' ? -1 : 1) - (desks[b].side === 's' ? -1 : 1) || a - b);

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
        p = this.createPerson(s);
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
  }

  private createPerson(s: AgentSession): Person {
    const h = hash(s.key);
    const door = this.plan.door;
    const agentPalette = AGENT_COLORS[s.agent] || AGENT_COLORS.default;

    return {
      key: s.key,
      h,
      s,
      skin: pick(SKIN_TONES, h, 3),
      hair: pick(HAIR_COLORS, h, 7),
      pants: pick(PANTS_COLORS, h, 13),
      shirt: pick(agentPalette, h, 11),
      hairStyle: h % 3,
      phase: ((h % 1000) / 1000) * Math.PI * 2,
      x: door.x,
      y: door.y,
      path: [],
      walkFace: 'front',
      until: 0,
      mode: null,
      placeOnArrive: true,
    };
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
    const weighted: Array<[POI, number]> = [];

    for (const q of plan.pois) {
      if (q.taken) continue;
      let w = 1.0;
      if (q.pair) w = plan.pois.some((o) => o.pair === q.pair && o !== q && o.taken) ? 6 : 1.2;
      if (q.act === 'couch' || q.act === 'beanbag') w = 2.0;
      weighted.push([q, w]);
    }

    // Posibilidad de sentarse a descansar en un escritorio libre
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
        0.5,
      ]);
    }

    if (!weighted.length) return;

    let totalW = weighted.reduce((acc, [, w]) => acc + w, 0);
    let r = Math.random() * totalW;
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
    p.stay = (choice.act === 'nap' ? rand(15, 30) : choice.act === 'pingpong' ? rand(12, 25) : rand(6, 16)) * 1000;
    this.walkTo(p, choice);
  }

  // ------------------------------------------------------------ Bucle Principal de Renderizado

  private startLoop(): void {
    const loop = (t: number) => {
      if (this.dead) return;
      this.renderFrame(t);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private renderFrame(t: number): void {
    const dt = Math.min(0.1, (t - this.last) / 1000);
    this.t = t;
    this.last = t;

    this.hit = [];
    const c = this.ctx;
    c.save();
    c.scale(this.dpr, this.dpr);
    c.clearRect(0, 0, this.cw, this.ch);

    this.fitCamera();
    this.updateWanderersAndMovement(t, dt);

    // 1. Dibujar el entorno arquitectónico (Suelos, Paredes, Ventanas con Cielo)
    this.drawRoomShell();

    // 2. Elementos ordenados por profundidad isométrica (Muebles, Personajes, Props)
    this.drawDepthSortedItems();

    c.restore();
  }

  private updateWanderersAndMovement(now: number, dt: number): void {
    for (const [k, p] of this.people) {
      if (p.leaving && !p.path.length && Math.hypot(p.x - this.plan.door.x, p.y - this.plan.door.y) < 0.2) {
        this.people.delete(k);
        continue;
      }

      if (p.mode === 'wander') {
        this.wander(p, now);
      }

      // Mover a lo largo de la trayectoria A*
      if (p.path.length) {
        const target = p.path[0];
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        const dist = Math.hypot(dx, dy);
        const step = SPEED * dt;

        p.walkFace = dx - dy >= 0 ? 'front' : 'back';

        if (dist <= step) {
          p.x = target.x;
          p.y = target.y;
          p.path.shift();
          if (!p.path.length && p.poi) {
            p.until = now + (p.stay || 10000);
          }
        } else {
          p.x += (dx / dist) * step;
          p.y += (dy / dist) * step;
        }
      }
    }

    // Actualizar movimiento del gato
    this.updateCat(now, dt);
  }

  private updateCat(now: number, dt: number): void {
    const cat = this.cat;
    if (now > cat.until && !cat.path.length) {
      // Elegir destino aleatorio en el salón o cerca del rack
      const spots = [
        { x: this.plan.W - 3, y: this.plan.D - 2 },
        { x: this.plan.OW + 2, y: this.plan.PY + 2 },
        { x: 3, y: this.plan.OD + 2 },
      ];
      const target = spots[Math.floor(Math.random() * spots.length)];
      cat.path = this.plan.grid.path(cat.x, cat.y, target.x, target.y);
      cat.until = now + rand(8, 18) * 1000;
    }

    if (cat.path.length) {
      const target = cat.path[0];
      const dx = target.x - cat.x;
      const dy = target.y - cat.y;
      const dist = Math.hypot(dx, dy);
      const step = 1.4 * dt;
      cat.face = dx >= 0 ? 1 : -1;

      if (dist <= step) {
        cat.x = target.x;
        cat.y = target.y;
        cat.path.shift();
      } else {
        cat.x += (dx / dist) * step;
        cat.y += (dy / dist) * step;
      }
    }
  }

  // ------------------------------------------------------------ Arquitectura de la Sala

  private drawRoomShell(): void {
    const { W, D, OW, MR, PY, pp } = this.plan;
    const pal = this.pal;
    const P = (x: number, y: number, z = 0) => this.iso(x, y, z);
    const t = this.t / 1000;

    // Suelo: Madera en oficina abierta, moqueta en sala de reuniones, baldosas en cafetería, alfombra lounge
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

    // Sala de Reuniones / Control (Moqueta)
    this.poly([P(OW, 0), P(W, 0), P(W, MR), P(OW, MR)], pal.carpet);
    for (let x = OW + 0.5; x < W; x += 0.5) {
      this.poly([P(x, 0), P(x + 0.015, 0), P(x + 0.015, MR), P(x, MR)], pal.carpetLine);
    }

    // Cafetería / Pantry (Baldosas ajedrezadas)
    for (let i = 0; i < Math.ceil((W - OW) * 2); i++) {
      for (let j = 0; j < Math.ceil((PY - MR) * 2); j++) {
        const x = OW + i / 2;
        const y = MR + j / 2;
        const x1 = Math.min(W, x + 0.5);
        const y1 = Math.min(PY, y + 0.5);
        this.poly([P(x, y), P(x1, y), P(x1, y1), P(x, y1)], (i + j) % 2 ? pal.tileA : pal.tileB);
      }
    }

    // Lounge (Madera + Alfombra verde agua)
    for (let x = Math.floor(OW); x < W; x++) {
      for (let y = PY; y < D; y++) {
        const x0 = Math.max(OW, x);
        const x1 = Math.min(W, x + 1);
        const y1 = Math.min(D, y + 1);
        this.poly([P(x0, y), P(x1, y), P(x1, y1), P(x0, y1)], (x + Math.floor(y)) % 2 ? pal.wood1 : pal.wood2);
      }
    }
    this.poly([P(OW + 0.4, PY + 0.6), P(W - 0.5, PY + 0.6), P(W - 0.5, D - 0.5), P(OW + 0.4, D - 0.5)], pal.rug);
    this.poly([P(OW + 0.55, PY + 0.75), P(W - 0.65, PY + 0.75), P(W - 0.65, D - 0.65), P(OW + 0.55, D - 0.65)], null, pal.rugEdge);

    // Alfombra de ping-pong
    this.poly([P(pp.x0 - 0.6, pp.y - 1.4), P(pp.x1 + 0.6, pp.y - 1.4), P(pp.x1 + 0.6, pp.y + 1.3), P(pp.x0 - 0.6, pp.y + 1.3)], pal.mat);

    // Paredes principales
    this.poly([P(0, 0, 0), P(W, 0, 0), P(W, 0, WALL_H), P(0, 0, WALL_H)], pal.wallL);
    this.poly([P(0, 0, 0), P(0, D, 0), P(0, D, WALL_H), P(0, 0, WALL_H)], pal.wallR);
    this.poly(
      [P(0, 0, WALL_H), P(W, 0, WALL_H), P(W, -0.15, WALL_H), P(-0.15, -0.15, WALL_H), P(-0.15, D, WALL_H), P(0, D, WALL_H)],
      pal.wallTop
    );
    this.poly([P(0, 0, 0), P(W, 0, 0), P(W, 0, 0.12), P(0, 0, 0.12)], pal.trim);
    this.poly([P(0, 0, 0), P(0, D, 0), P(0, D, 0.12), P(0, 0, 0.12)], pal.trim);

    // Ventanas exteriores con cielo dinámico
    const sky = getSkyColor();
    for (const x of this.plan.windows) {
      this.poly([P(x, 0, 0.85), P(x + 1.6, 0, 0.85), P(x + 1.6, 0, 2.05), P(x, 0, 2.05)], sky.sky);
      const c = this.ctx;
      if (sky.night) {
        // Luna y estrellas
        const wp = this.iso(x + 0.4, 0, 1.8);
        c.fillStyle = '#fef08a';
        c.beginPath();
        c.arc(wp.x, wp.y, 4, 0, Math.PI * 2);
        c.fill();
      } else {
        // Nubes suaves
        const cx = x + 0.3 + (((t * 0.02 + x * 0.35) % 1) * 1.0);
        const cp = this.iso(cx, 0, 1.7);
        c.fillStyle = 'rgba(255,255,255,0.85)';
        c.beginPath();
        c.ellipse(cp.x, cp.y, 10, 4, 0, 0, Math.PI * 2);
        c.fill();
      }
      // Marco de ventana
      this.poly([P(x + 0.78, 0, 0.85), P(x + 0.82, 0, 0.85), P(x + 0.82, 0, 2.05), P(x + 0.78, 0, 2.05)], pal.trim);
      this.poly([P(x, 0, 0.85), P(x + 1.6, 0, 0.85), P(x + 1.6, 0, 0.9), P(x, 0, 0.9)], pal.trim);
    }

    // Puerta de entrada
    const dy = this.plan.door.y;
    this.poly([P(0, dy - 0.6, 0), P(0, dy + 0.6, 0), P(0, dy + 0.6, 1.8), P(0, dy - 0.6, 1.8)], pal.trim);
    this.poly([P(0, dy - 0.52, 0), P(0, dy + 0.52, 0), P(0, dy + 0.52, 1.72), P(0, dy - 0.52, 1.72)], this.shade(pal.deskL, -10));
  }

  // ------------------------------------------------------------ Elementos con Z-Sorting

  private drawDepthSortedItems(): void {
    const list: Array<{ depth: number; render: () => void }> = [];

    // Props estáticos
    for (const prop of this.plan.props) {
      list.push({
        depth: prop.x + prop.y + ((prop.w || 1) + (prop.d || 1)) / 2,
        render: () => this.drawProp(prop),
      });
    }

    // Escritorios con sillas
    for (const d of this.plan.desks) {
      list.push({
        depth: d.x + d.y + 0.8,
        render: () => this.drawDesk(d),
      });
    }

    // Personajes
    for (const p of this.people.values()) {
      list.push({
        depth: p.x + p.y,
        render: () => this.drawPerson(p),
      });
    }

    // Gato
    list.push({
      depth: this.cat.x + this.cat.y,
      render: () => this.drawCat(),
    });

    // Ordenar de más lejano a más cercano (pintor isométrico)
    list.sort((a, b) => a.depth - b.depth);
    for (const item of list) {
      item.render();
    }
  }

  private drawDesk(d: DeskSlot): void {
    const pal = this.pal;
    // Mesa
    this.box(d.x, d.y, 0, 1.4, 0.8, 0.72, pal.deskTop, pal.deskL, pal.deskR);

    // Monitor
    const monZ = 0.72;
    const mx = d.x + 0.45;
    const my = d.side === 'n' ? d.y + 0.15 : d.y + 0.55;
    this.box(mx, my, monZ, 0.5, 0.1, 0.4, pal.monitor, pal.monitor, pal.monitor);
    // Pantalla activa brillante
    const scrX = mx + 0.04;
    const scrY = d.side === 'n' ? my + 0.105 : my - 0.005;
    const P = (a: number, b: number, c: number) => this.iso(a, b, c);
    this.poly([P(scrX, scrY, monZ + 0.05), P(scrX + 0.42, scrY, monZ + 0.05), P(scrX + 0.42, scrY, monZ + 0.36), P(scrX, scrY, monZ + 0.36)], '#0ea5e9');

    // Teclado
    const kx = d.x + 0.5;
    const ky = d.side === 'n' ? d.y + 0.35 : d.y + 0.3;
    this.box(kx, ky, monZ, 0.4, 0.18, 0.02, '#334155', '#1e293b', '#0f172a');

    // Silla de oficina
    const sx = d.seat.x - 0.22;
    const sy = d.seat.y - 0.2;
    this.box(sx + 0.18, sy + 0.16, 0, 0.08, 0.08, 0.34, '#1e293b', '#1e293b', '#0f172a');
    this.box(sx, sy, 0.34, 0.44, 0.4, 0.08, pal.chair, pal.chair, this.shade(pal.chair, -10));
    if (d.side === 'n') {
      this.box(sx, sy - 0.04, 0.42, 0.44, 0.08, 0.48, pal.chair, pal.chair, this.shade(pal.chair, -10));
    }
  }

  private drawProp(prop: any): void {
    const pal = this.pal;
    const t = this.t / 1000;
    const P = (a: number, b: number, c: number) => this.iso(a, b, c);

    switch (prop.t) {
      case 'rack': {
        // Rack de servidores de render
        this.box(prop.x, prop.y, 0, 0.8, 0.65, 2.0, '#1e293b', '#0f172a', '#020617');
        const c = this.ctx;
        for (let r = 0; r < 8; r++) {
          for (let k = 0; k < 4; k++) {
            const on = Math.sin(t * 4 + r * 2 + k) > 0;
            const pt = this.iso(prop.x + 0.12 + k * 0.15, prop.y + 0.66, 1.8 - r * 0.22);
            c.fillStyle = on ? (k === 0 ? '#ef4444' : '#22c55e') : '#1e293b';
            c.fillRect(pt.x - 1, pt.y - 1, 2.5, 2.5);
          }
        }
        break;
      }
      case 'pingpong': {
        // Mesa de ping-pong
        this.box(prop.x, prop.y, 0.7, 2.7, 1.45, 0.06, '#15803d', '#166534', '#14532d');
        // Red blanca
        this.poly(
          [P(prop.x + 1.35, prop.y - 0.05, 0.76), P(prop.x + 1.35, prop.y + 1.5, 0.76), P(prop.x + 1.35, prop.y + 1.5, 0.95), P(prop.x + 1.35, prop.y - 0.05, 0.95)],
          'rgba(255,255,255,0.6)',
          '#ffffff'
        );
        // Pelota animada rebotando
        const ballProg = (Math.sin(t * 6) + 1) / 2;
        const bx = prop.x + 0.3 + ballProg * 2.1;
        const bz = 0.76 + Math.sin(ballProg * Math.PI) * 0.25;
        const bp = this.iso(bx, prop.y + 0.72, bz);
        const c = this.ctx;
        c.fillStyle = '#fef08a';
        c.beginPath();
        c.arc(bp.x, bp.y, 3, 0, Math.PI * 2);
        c.fill();
        break;
      }
      case 'counter':
        this.box(prop.x, prop.y, 0, prop.w, prop.d, 0.88, pal.counter, pal.counterL, pal.counterR);
        break;
      case 'coffee': {
        // Cafetera espresso
        this.box(prop.x, prop.y, 0.88, 0.45, 0.35, 0.38, '#334155', '#1e293b', '#0f172a');
        break;
      }
      case 'cooler':
        // Dispensador de agua
        this.box(prop.x, prop.y, 0, 0.4, 0.4, 0.85, '#e2e8f0', '#cbd5e1', '#94a3b8');
        this.box(prop.x + 0.05, prop.y + 0.05, 0.85, 0.3, 0.3, 0.38, 'rgba(56,189,248,0.7)', 'rgba(14,165,233,0.7)', 'rgba(2,132,199,0.7)');
        break;
      case 'fridge':
        // Frigorífico grande
        this.box(prop.x, prop.y, 0, 0.85, 0.75, 1.95, '#e2e8f0', '#cbd5e1', '#94a3b8');
        break;
      case 'couch':
        // Sofá lounge
        this.box(prop.x, prop.y, 0, prop.w, prop.d, 0.44, pal.couch, pal.couchD, pal.couchD);
        this.box(prop.x, prop.y - 0.08, 0.44, prop.w, 0.2, 0.4, pal.couch, pal.couchD, pal.couchD);
        break;
      case 'coffeeTable':
        this.box(prop.x, prop.y, 0, prop.w, prop.d, 0.38, pal.deskTop, pal.deskL, pal.deskR);
        break;
      case 'roundTable': {
        const c = this.ctx;
        this.box(prop.x - 0.06, prop.y - 0.06, 0, 0.12, 0.12, 0.74, '#475569', '#334155', '#1e293b');
        const pt = this.iso(prop.x, prop.y, 0.75);
        c.fillStyle = pal.deskTop;
        c.beginPath();
        c.ellipse(pt.x, pt.y, 28 * this.zoom, 14 * this.zoom, 0, 0, Math.PI * 2);
        c.fill();
        break;
      }
      case 'shelf':
        this.box(prop.x, prop.y, 0, prop.w, prop.d, 1.45, pal.deskTop, pal.deskL, pal.deskR);
        break;
      case 'arcade':
        // Máquina arcade retro
        this.box(prop.x, prop.y, 0, 0.75, 0.7, 1.8, '#4338ca', '#3730a3', '#312e81');
        break;
      case 'plant': {
        this.box(prop.x - 0.16, prop.y - 0.16, 0, 0.32, 0.32, 0.28, pal.pot, pal.pot, this.shade(pal.pot, -15));
        const c = this.ctx;
        const b = this.iso(prop.x, prop.y, 0.28);
        c.fillStyle = pal.plant;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          c.beginPath();
          c.ellipse(b.x + Math.cos(a) * 5, b.y - 10 + Math.sin(a) * 3, 5, 11, a / 3, 0, Math.PI * 2);
          c.fill();
        }
        break;
      }
      case 'panel':
        this.box(prop.x, prop.y, 0, prop.w, prop.d, prop.h, this.shade(prop.color, 15), prop.color, this.shade(prop.color, -15));
        break;
      default:
        break;
    }
  }

  // ------------------------------------------------------------ Dibujado de Personajes Chibi

  private drawPerson(p: Person): void {
    const c = this.ctx;
    const t = this.t / 1000;
    const s = p.s || { status: 'idle' };
    const seated = p.mode === 'work' && !p.path.length;
    const walking = p.path.length > 0;
    const sitZ = seated ? 0.34 : p.poi?.sit || 0;

    const b = this.iso(p.x, p.y, sitZ);
    const fb = this.iso(p.x, p.y, 0);

    // Sombra en el suelo
    c.fillStyle = this.pal.shadow;
    c.beginPath();
    c.ellipse(fb.x, fb.y, 9 * this.zoom, 4.5 * this.zoom, 0, 0, Math.PI * 2);
    c.fill();

    // Anillo de selección o hover
    const isHovered = this.hoverKey === p.key;
    const isSelected = this.selectedKey === p.key;
    if (isHovered || isSelected) {
      c.strokeStyle = STATUS_COLORS[s.status] || '#38bdf8';
      c.lineWidth = isSelected ? 3 : 2;
      c.beginPath();
      c.ellipse(fb.x, fb.y, 14 * this.zoom, 7 * this.zoom, 0, 0, Math.PI * 2);
      c.stroke();
    }

    const step = walking ? Math.sin(t * 12 + p.phase) : 0;
    const bob = walking ? Math.abs(step) * 1.6 : 0;

    c.save();
    c.translate(b.x, b.y - bob);
    c.scale(this.zoom, this.zoom);

    // Piernas / Pantalones
    c.fillStyle = p.pants;
    if (seated) {
      c.fillRect(-5, -4, 4, 5);
      c.fillRect(1, -4, 4, 5);
    } else {
      c.fillRect(-5, -10, 4, 10 + step * 2);
      c.fillRect(1, -10, 4, 10 - step * 2);
      c.fillStyle = '#18181b';
      c.fillRect(-5, -1 + step, 4, 2);
      c.fillRect(1, -1 - step, 4, 2);
    }

    // Torso / Camiseta
    const hip = seated ? -4 : -10;
    this.roundRect(-7, hip - 13, 14, 14, 3, p.shirt);

    // Brazos y Acciones
    const arm = this.shade(p.shirt, -18);
    c.fillStyle = arm;

    if (s.status === 'waiting' || s.status === 'error') {
      // Agitar brazo para pedir atención
      const wave = Math.sin(t * 8 + p.phase) * 3;
      c.fillRect(6, hip - 25, 3, 13);
      c.fillStyle = p.skin;
      c.beginPath();
      c.arc(7.5 + wave * 0.4, hip - 26, 2.2, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = arm;
      c.fillRect(-9, hip - 11, 3, 10);
    } else if (seated && (s.status === 'tool' || s.status === 'typing')) {
      // Tecleo rápido en el escritorio
      const k1 = Math.sin(t * 16 + p.phase) > 0 ? 1 : 0;
      c.fillRect(-9, hip - 11 - k1, 3, 8);
      c.fillRect(6, hip - 11 - (1 - k1), 3, 8);
    } else if (p.poi?.act === 'coffee' || p.poi?.act === 'water') {
      // Beber café
      c.fillRect(-9, hip - 11, 3, 10);
      c.fillRect(6, hip - 15, 3, 7);
      c.fillStyle = '#fafafa';
      c.fillRect(6, hip - 19, 5, 6);
    } else {
      c.fillRect(-9, hip - 11, 3, 10);
      c.fillRect(6, hip - 11, 3, 10);
    }

    // Cabeza Chibi
    const hy = hip - 20;
    c.fillStyle = p.skin;
    c.beginPath();
    c.arc(0, hy, 7.5, 0, Math.PI * 2);
    c.fill();

    // Pelo
    c.fillStyle = p.hair;
    c.beginPath();
    c.arc(0, hy - 1.5, 7.8, Math.PI * 1.05, Math.PI * 1.95);
    c.fill();

    // Ojos y Parpadeo estocástico
    const blink = Math.sin(t * 0.8 + p.phase * 3) > 0.98;
    c.fillStyle = '#18181b';
    c.fillRect(-3, hy - 0.5, 1.6, blink ? 0.6 : 2);
    c.fillRect(1.6, hy - 0.5, 1.6, blink ? 0.6 : 2);

    c.restore();

    // Bocadillo de Estado / Diálogo
    this.drawSpeechBubble(p, b.x, b.y - bob - 35 * this.zoom);

    // Registro de Hit Testing para clics y hover
    const headTop = b.y - bob - 30 * this.zoom;
    this.hit.push({
      key: p.key,
      x0: b.x - 18 * this.zoom,
      x1: b.x + 18 * this.zoom,
      y0: headTop - 15 * this.zoom,
      y1: fb.y + 6 * this.zoom,
    });
  }

  private drawSpeechBubble(p: Person, x: number, y: number): void {
    const s = p.s;
    if (!s) return;
    const c = this.ctx;
    const text = s.taskSummary || s.role || s.name;
    c.save();
    c.font = `600 ${Math.max(9, 10 * this.zoom)}px ui-sans-serif, system-ui, sans-serif`;

    const metrics = c.measureText(text);
    const bw = Math.min(180, metrics.width + 16);
    const bh = 18;

    c.fillStyle = this.pal.tagBg;
    this.roundRect(x - bw / 2, y - bh / 2, bw, bh, 4, this.pal.tagBg, STATUS_COLORS[s.status] || '#38bdf8');

    c.fillStyle = this.pal.text;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, x, y);
    c.restore();
  }

  private drawCat(): void {
    const c = this.ctx;
    const cat = this.cat;
    const b = this.iso(cat.x, cat.y, 0);
    const t = this.t / 1000;
    const walking = cat.path.length > 0;
    const step = walking ? Math.sin(t * 14) * 2 : 0;

    c.save();
    c.translate(b.x, b.y);
    c.scale(this.zoom * cat.face, this.zoom);

    // Sombra
    c.fillStyle = this.pal.shadow;
    c.beginPath();
    c.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
    c.fill();

    // Cuerpo
    c.fillStyle = '#ea580c'; // Gato naranja
    c.beginPath();
    c.ellipse(0, -6, 8, 5, 0, 0, Math.PI * 2);
    c.fill();

    // Cabeza y Orejas
    c.beginPath();
    c.arc(6, -10, 4.5, 0, Math.PI * 2);
    c.fill();
    // Oreja
    c.beginPath();
    c.moveTo(5, -14);
    c.lineTo(8, -17);
    c.lineTo(9, -13);
    c.fill();

    // Cola balanceándose
    const tailWiggle = Math.sin(t * 5) * 3;
    c.strokeStyle = '#ea580c';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-7, -7);
    c.quadraticCurveTo(-14, -14 + tailWiggle, -11, -18);
    c.stroke();

    // Patitas
    c.fillStyle = '#c2410c';
    c.fillRect(-4, -2, 2.5, 3 + step);
    c.fillRect(3, -2, 2.5, 3 - step);

    c.restore();
  }

  // ------------------------------------------------------------ Eventos del Puntero

  private setupListeners(): void {
    this.canvas.addEventListener('mousemove', (e) => this.handlePointer(e, false));
    this.canvas.addEventListener('click', (e) => this.handlePointer(e, true));
    this.canvas.addEventListener('mouseleave', () => {
      this.hoverKey = null;
      this.onHoverAgent(null);
    });
  }

  private handlePointer(e: MouseEvent, isClick: boolean): void {
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    let found: string | null = null;
    for (let i = this.hit.length - 1; i >= 0; i--) {
      const h = this.hit[i];
      if (px >= h.x0 && px <= h.x1 && py >= h.y0 && py <= h.y1) {
        found = h.key;
        break;
      }
    }

    if (isClick) {
      this.selectedKey = found;
      this.onSelectAgent(found);
    } else {
      if (this.hoverKey !== found) {
        this.hoverKey = found;
        this.onHoverAgent(found);
        this.canvas.style.cursor = found ? 'pointer' : 'default';
      }
    }
  }
}
