// RuntimeClips-Web — Generador de Plano Isométrico 2D y Paletas Temáticas

import type { ThemePalette, OfficePlan, DeskSlot, POI, PropItem } from './types';
import { AStarGrid } from './astar';

export const PANEL_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

export function getThemePalette(isDark = false): ThemePalette {
  return isDark
    ? {
        dark: true,
        wood1: '#2e2620',
        wood2: '#27201b',
        woodLine: 'rgba(0,0,0,0.3)',
        tileA: '#2c3138',
        tileB: '#24282e',
        carpet: '#1e293b',
        carpetLine: 'rgba(255,255,255,0.05)',
        wallL: '#333742',
        wallR: '#2a2d36',
        wallTop: '#424856',
        trim: '#1b1d24',
        deskTop: '#644e3a',
        deskL: '#4e3c2c',
        deskR: '#3e2f23',
        monitor: '#111827',
        screenOff: '#1f2937',
        chair: '#1f242d',
        rug: '#2e3846',
        rugEdge: '#242c38',
        couch: '#3b4b66',
        couchD: '#2c384d',
        counter: '#9ca3af',
        counterL: '#6b7280',
        counterR: '#4b5563',
        metal: '#6b7280',
        glass: 'rgba(96,165,250,0.12)',
        glassEdge: 'rgba(147,197,253,0.4)',
        mat: '#1c382b',
        text: '#f3f4f6',
        tagBg: 'rgba(17,24,39,0.85)',
        bubble: '#f9fafb',
        bubbleInk: '#111827',
        plant: '#22c55e',
        pot: '#9a3412',
        shadow: 'rgba(0,0,0,0.35)',
        book: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
      }
    : {
        dark: false,
        wood1: '#f3e8d8',
        wood2: '#ebdcc7',
        woodLine: 'rgba(120,90,50,0.14)',
        tileA: '#f8fafc',
        tileB: '#e2e8f0',
        carpet: '#cbd5e1',
        carpetLine: 'rgba(0,0,0,0.04)',
        wallL: '#f1f5f9',
        wallR: '#e2e8f0',
        wallTop: '#ffffff',
        trim: '#cbd5e1',
        deskTop: '#d7b894',
        deskL: '#b8946e',
        deskR: '#9e7a53',
        monitor: '#1e293b',
        screenOff: '#334155',
        chair: '#475569',
        rug: '#d1fae5',
        rugEdge: '#a7f3d0',
        couch: '#64748b',
        couchD: '#475569',
        counter: '#f8fafc',
        counterL: '#e2e8f0',
        counterR: '#cbd5e1',
        metal: '#94a3b8',
        glass: 'rgba(147,197,253,0.2)',
        glassEdge: 'rgba(96,165,250,0.6)',
        mat: '#dcfce7',
        text: '#0f172a',
        tagBg: 'rgba(255,255,255,0.92)',
        bubble: '#ffffff',
        bubbleInk: '#0f172a',
        plant: '#16a34a',
        pot: '#c2410c',
        shadow: 'rgba(60,40,20,0.18)',
        book: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
      };
}

export function buildRuntimeOfficePlan(nAgents = 9, _pal?: ThemePalette): OfficePlan {
  // Aseguramos espacio para al menos 9 puestos fijos (3 pods de 4 escritorios = 12 plazas)
  const pods = Math.max(3, Math.ceil((nAgents + 1) / 4));
  const podCols = pods <= 4 ? 2 : 3;
  const podRows = Math.ceil(pods / podCols);

  const OW = 1.4 + (podCols - 1) * 4.4 + 4.2; // Ancho oficina abierta
  const OD = podRows * 4.8 + 1.0;            // Profundidad oficina abierta
  const D = Math.max(OD + 4.0, 16.0);        // Profundidad total del plano
  const RW = 8.0;                            // Ancho ala derecha (Cafetería + Lounge + Reuniones)
  const W = OW + RW;                         // Ancho total del plano
  const MR = 5.4;                            // Profundidad sala de reuniones
  const PY = 10.4;                           // Límite entre cafetería y lounge

  const grid = new AStarGrid(W, D);
  const items: Array<{ depth: number; draw: () => void }> = [];
  const props: PropItem[] = [];
  const pois: POI[] = [];
  const desks: DeskSlot[] = [];

  const solid = (x: number, y: number, w: number, d: number, pad = 0.08) => grid.block(x, y, w, d, pad);
  const poi = (x: number, y: number, act: POI['act'], face: POI['face'], opt: Partial<POI> = {}) =>
    pois.push({ x, y, act, face, sit: 0, ...opt });
  const prop = (t: string, o: Partial<PropItem>) => props.push({ t, x: o.x || 0, y: o.y || 0, ...o });

  // 1. Pods de Escritorios (Cubicles) para los 9 agentes
  let deskCount = 0;
  for (let p = 0; p < pods; p++) {
    const c = p % podCols;
    const r = Math.floor(p / podCols);
    const px = 1.4 + c * 4.4;
    const py = 2.2 + r * 4.8;
    const panelColor = PANEL_COLORS[p % PANEL_COLORS.length];

    for (let k = 0; k < 2; k++) {
      const x = px + k * 1.55;
      deskCount++;
      const northDesk: DeskSlot = {
        id: `desk-${deskCount}-n`,
        x,
        y: py,
        side: 'n',
        seat: { x: x + 0.72, y: py - 0.45 },
      };
      deskCount++;
      const southDesk: DeskSlot = {
        id: `desk-${deskCount}-s`,
        x,
        y: py + 0.94,
        side: 's',
        seat: { x: x + 0.72, y: py + 0.94 + 1.25 },
      };

      desks.push(northDesk);
      desks.push(southDesk);
      solid(x, py, 1.45, 0.82);
      solid(x, py + 0.94, 1.45, 0.82);
    }

    solid(px - 0.15, py + 0.82, 3.3, 0.12);
    prop('panel', { x: px - 0.1, y: py + 0.82, w: 3.25, d: 0.08, h: 1.15, color: panelColor });
    prop('panel', { x: px - 0.18, y: py - 0.05, w: 0.08, d: 1.85, h: 1.15, color: panelColor });
  }

  // 2. Racks de Servidores de Render FFmpeg y Datacenter
  const rx = OW - 1.2;
  prop('rack', { x: rx, y: 0.25 });
  solid(rx, 0.25, 0.8, 0.65);

  const px = OW - 2.5;
  prop('printer', { x: px, y: 0.28 });
  solid(px, 0.28, 0.8, 0.6);

  // Plantas en esquinas de oficina abierta
  prop('plant', { x: 0.5, y: 0.5 });
  solid(0.3, 0.3, 0.4, 0.4);
  prop('plant', { x: 0.5, y: OD - 0.3 });
  solid(0.3, OD - 0.5, 0.4, 0.4);

  // Ventanas exteriores
  const windows: number[] = [];
  for (let x = 1.2; x < OW - 2.8; x += 2.6) {
    windows.push(x);
    poi(x + 0.8, 0.8, 'window', 'back');
  }

  // 3. Rincón Recreativo: Mesa de Ping-Pong interactiva
  const tx = 2.4;
  const ty = OD + 1.2;
  prop('pingpong', { x: tx, y: ty });
  solid(tx, ty, 2.7, 1.45, 0.06);
  poi(tx - 0.55, ty + 0.72, 'pingpong', 'side', { pair: 'pp' });
  poi(tx + 3.2, ty + 0.72, 'pingpong', 'side', { pair: 'pp' });
  const pp = { x0: tx - 0.2, x1: tx + 2.9, y: ty + 0.72 };

  // Máquinas de Vending y Arcade Retro
  const fy = OD + 3.8;
  if (D - fy >= 3.0) {
    prop('vending', { x: 0.15, y: fy, color: '#ef4444' });
    prop('vending', { x: 0.15, y: fy + 0.85, color: '#3b82f6' });
    solid(0.12, fy, 0.8, 1.7);
    poi(1.35, fy + 0.42, 'vending', 'back');
    poi(1.35, fy + 1.28, 'vending', 'back');

    const arcX = OW - 2.2;
    prop('arcade', { x: arcX, y: fy + 0.4 });
    solid(arcX, fy + 0.4, 0.8, 0.8);
    poi(arcX + 0.4, fy + 1.5, 'arcade', 'back');
  }

  // 4. Sala de Control Editorial y Auditoría (Detrás de cristal transparente)
  const mx = OW;
  solid(mx - 0.05, 0, 0.1, 3.6);
  solid(mx - 0.05, 4.6, 0.1, MR - 4.6);
  solid(mx, MR - 0.05, RW, 0.1);
  prop('glass', { x: mx, y: 0, w: 0, d: 3.6 });
  prop('glass', { x: mx, y: 4.6, w: 0, d: MR - 4.6 });
  prop('glass', { x: mx, y: MR, w: RW, d: 0 });

  const mtx = mx + 1.8;
  const mty = 1.8;
  prop('meetingTable', { x: mtx, y: mty, w: 3.2, d: 1.5 });
  solid(mtx, mty, 3.2, 1.5);
  for (let k = 0; k < 3; k++) {
    const cx = mtx + 0.6 + k * 1.0;
    poi(cx, mty - 0.45, 'meeting', 'front', { sit: 0.42 });
    poi(cx, mty + 1.85, 'meeting', 'back', { sit: 0.42 });
    prop('chair', { x: cx, y: mty - 0.45, face: 'front' });
    prop('chair', { x: cx, y: mty + 1.85, face: 'back' });
  }
  poi(mx + 3.8, 0.7, 'whiteboard', 'back');

  // 5. Cafetería / Pantry
  const cy = MR + 0.4;
  const counterW = RW - 2.4;
  prop('counter', { x: mx + 1.0, y: cy, w: counterW, d: 0.75 });
  solid(mx + 1.0, cy, counterW, 0.75);

  prop('coffee', { x: mx + 2.5, y: cy + 0.12 });
  prop('sink', { x: mx + 4.1, y: cy + 0.12 });
  prop('fridge', { x: W - 1.2, y: cy });
  solid(W - 1.2, cy, 0.9, 0.8);

  prop('cooler', { x: mx + 0.4, y: cy + 0.05 });
  solid(mx + 0.35, cy, 0.55, 0.55);

  poi(mx + 2.7, cy + 1.25, 'coffee', 'back');
  poi(mx + 4.3, cy + 1.25, 'sink', 'back');
  poi(W - 0.75, cy + 1.35, 'fridge', 'back');
  poi(mx + 0.65, cy + 1.0, 'water', 'back');

  // Mesa redonda y taburetes de bar
  const rtx = mx + 3.8;
  const rty = MR + 3.0;
  prop('roundTable', { x: rtx, y: rty });
  solid(rtx - 0.5, rty - 0.5, 1.0, 1.0);
  const barStools: Array<[number, number, 'front' | 'back']> = [
    [rtx - 1.1, rty, 'front'],
    [rtx + 1.1, rty, 'front'],
    [rtx, rty + 1.1, 'back'],
    [rtx, rty - 1.0, 'front'],
  ];
  for (const [sx, sy, face] of barStools) {
    poi(sx, sy, 'stool', face, { sit: 0.46 });
    prop('barStool', { x: sx, y: sy });
  }

  // 6. Zona Lounge (Sofá esquinero, mesa, beanbags, estantería con libros)
  const lx = mx + 0.7;
  const ly = PY + 0.5;
  const shelfX = mx + 3.5;
  const shelfW = RW - 3.7;
  prop('shelf', { x: shelfX, y: PY - 0.3, w: shelfW, d: 0.48 });
  solid(shelfX, PY - 0.3, shelfW, 0.48);
  poi(mx + 4.8, PY + 0.75, 'read', 'back');
  poi(mx + 6.0, PY + 0.75, 'read', 'back');

  prop('couch', { x: lx, y: ly + 0.6, w: 2.9, d: 0.85 });
  solid(lx, ly + 0.6, 2.9, 0.85);
  for (let k = 0; k < 3; k++) {
    poi(lx + 0.55 + k * 0.9, ly + 1.25, 'couch', 'front', { sit: 0.36 });
  }

  prop('coffeeTable', { x: lx + 0.65, y: ly + 2.1, w: 1.65, d: 0.75 });
  solid(lx + 0.65, ly + 2.1, 1.65, 0.75);

  prop('beanbag', { x: lx + 0.45, y: ly + 3.7, color: '#f97316' });
  prop('beanbag', { x: lx + 2.7, y: ly + 3.7, color: '#3b82f6' });
  poi(lx + 0.45, ly + 3.7, 'beanbag', 'front', { sit: 0.18 });
  poi(lx + 2.7, ly + 3.7, 'beanbag', 'front', { sit: 0.18 });

  prop('rug', { x: OW + 0.4, y: PY + 0.6, w: 4.2, d: D - PY - 1.1 });
  prop('plant', { x: W - 0.5, y: D - 0.5 });
  prop('lamp', { x: lx - 0.25, y: D - 0.65 });

  const posters = [
    { y: 2.2, color: '#3b82f6', text: 'RUNTIME 9:16' },
    { y: 4.8, color: '#10b981', text: 'FFMPEG OK ✓' },
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
    door: { x: 0.45, y: D - 1.2 },
  };
}
