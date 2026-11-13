// RuntimeClips-Web — Algoritmo de Pathfinding A* en Cuadrícula Isométrica Discretizada

import type { Point2D } from './types';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export class AStarGrid {
  public res: number;
  public cw: number;
  public ch: number;
  public cost: Uint8Array;

  constructor(W: number, D: number, res = 4) {
    this.res = res;
    this.cw = Math.ceil(W * res);
    this.ch = Math.ceil(D * res);
    this.cost = new Uint8Array(this.cw * this.ch);
  }

  public block(x: number, y: number, w: number, d: number, pad = 0.12): void {
    const R = this.res;
    const i0 = clamp(Math.floor((x - pad) * R), 0, this.cw - 1);
    const i1 = clamp(Math.ceil((x + w + pad) * R) - 1, 0, this.cw - 1);
    const j0 = clamp(Math.floor((y - pad) * R), 0, this.ch - 1);
    const j1 = clamp(Math.ceil((y + d + pad) * R) - 1, 0, this.ch - 1);
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        this.cost[j * this.cw + i] = 1;
      }
    }
  }

  public blocked(x: number, y: number): boolean {
    const i = Math.floor(x * this.res);
    const j = Math.floor(y * this.res);
    if (i < 0 || j < 0 || i >= this.cw || j >= this.ch) return true;
    return !!this.cost[j * this.cw + i];
  }

  public path(ax: number, ay: number, bx: number, by: number): Point2D[] {
    const R = this.res;
    const cw = this.cw;
    const ch = this.ch;
    const si = clamp(Math.floor(ax * R), 0, cw - 1);
    const sj = clamp(Math.floor(ay * R), 0, ch - 1);
    const gi = clamp(Math.floor(bx * R), 0, cw - 1);
    const gj = clamp(Math.floor(by * R), 0, ch - 1);

    const N = cw * ch;
    const g = new Float32Array(N).fill(Infinity);
    const came = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const heap: Array<[number, number]> = [];

    const push = (f: number, n: number) => {
      heap.push([f, n]);
      let k = heap.length - 1;
      while (k > 0) {
        const p = (k - 1) >> 1;
        if (heap[p][0] <= heap[k][0]) break;
        [heap[p], heap[k]] = [heap[k], heap[p]];
        k = p;
      }
    };

    const pop = (): [number, number] | undefined => {
      const top = heap[0];
      const last = heap.pop();
      if (heap.length && last) {
        heap[0] = last;
        let k = 0;
        for (;;) {
          const l = 2 * k + 1;
          const r = l + 1;
          let m = k;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === k) break;
          [heap[m], heap[k]] = [heap[k], heap[m]];
          k = m;
        }
      }
      return top;
    };

    const hfn = (i: number, j: number) => {
      const dx = Math.abs(i - gi);
      const dy = Math.abs(j - gj);
      return Math.max(dx, dy) + 0.41 * Math.min(dx, dy);
    };

    // Las celdas bloqueadas tienen un coste elevado (25) en lugar de ser estrictamente imposibles,
    // garantizando que un personaje pegado a un mueble siempre pueda desatascarse.
    const stepCost = (n: number) => (this.cost[n] ? 25 : 1);
    const start = sj * cw + si;
    const goal = gj * cw + gi;

    g[start] = 0;
    push(hfn(si, sj), start);

    const dirs: Array<[number, number, number]> = [
      [1, 0, 1],
      [-1, 0, 1],
      [0, 1, 1],
      [0, -1, 1],
      [1, 1, 1.41],
      [1, -1, 1.41],
      [-1, 1, 1.41],
      [-1, -1, 1.41],
    ];

    while (heap.length) {
      const top = pop();
      if (!top) break;
      const [, n] = top;
      if (n === goal) break;
      if (closed[n]) continue;
      closed[n] = 1;

      const i = n % cw;
      const j = (n / cw) | 0;

      for (const [di, dj, c] of dirs) {
        const ni = i + di;
        const nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= cw || nj >= ch) continue;
        if (di && dj && (this.cost[j * cw + ni] || this.cost[nj * cw + i])) continue;

        const nn = nj * cw + ni;
        const ng = g[n] + c * stepCost(nn);
        if (ng < g[nn]) {
          g[nn] = ng;
          came[nn] = n;
          push(ng + hfn(ni, nj), nn);
        }
      }
    }

    const cells: number[] = [];
    for (let n = goal; n !== -1 && n !== start; n = came[n]) {
      cells.push(n);
    }
    cells.reverse();

    const pts: Point2D[] = [];
    let lastDir: number | null = null;
    for (let k = 0; k < cells.length; k++) {
      const n = cells[k];
      const dir = n - (k ? cells[k - 1] : start);
      const pt: Point2D = { x: ((n % cw) + 0.5) / R, y: (((n / cw) | 0) + 0.5) / R };
      if (dir === lastDir && pts.length) {
        pts[pts.length - 1] = pt;
      } else {
        pts.push(pt);
      }
      lastDir = dir;
    }

    if (pts.length) {
      pts[pts.length - 1] = { x: bx, y: by };
    } else {
      pts.push({ x: bx, y: by });
    }

    return pts;
  }
}
