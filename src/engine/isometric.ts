// RuntimeClips-Web — Matemáticas de Proyección Dimétrica 2:1 Habbo Hotel
// Proyección clásica de baldosas 64x32 píxeles y Algoritmo del Pintor (Depth Sorting).

export const TILE_W = 64;
export const TILE_H = 32;

export interface Point2D {
  x: number;
  y: number;
}

export interface GridCoord {
  x: number;
  y: number;
  z?: number;
}

/**
 * Convierte coordenadas de celda (x, y, z) a píxeles de pantalla 2D
 */
export function gridToScreen(x: number, y: number, z = 0): Point2D {
  const screenX = (x - y) * (TILE_W / 2);
  const screenY = (x + y) * (TILE_H / 2) - z * TILE_H;
  return { x: Math.round(screenX), y: Math.round(screenY) };
}

/**
 * Convierte píxeles de pantalla a coordenadas de celda de la cuadrícula
 */
export function screenToGrid(screenX: number, screenY: number): GridCoord {
  const x = screenX / TILE_W + screenY / TILE_H;
  const y = screenY / TILE_H - screenX / TILE_W;
  return { x: Math.floor(x), y: Math.floor(y) };
}

/**
 * Calcula la clave de ordenamiento de profundidad (Painter's Algorithm)
 * En Habbo, los objetos con mayor (x + y) y mayor z están en primer plano.
 */
export function getDepthSortKey(x: number, y: number, z = 0, layer = 0): number {
  return (x + y) * 1000 + z * 100 + layer;
}

/**
 * Prueba si un punto (px, py) está dentro de un rombo de baldosa centrado en (cx, cy)
 */
export function isPointInTile(px: number, py: number, cx: number, cy: number): boolean {
  const dx = Math.abs(px - cx);
  const dy = Math.abs(py - cy);
  return dx / (TILE_W / 2) + dy / (TILE_H / 2) <= 1.0;
}
