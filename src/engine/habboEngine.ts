// RuntimeClips-Web — Motor Canvas 2D Isométrico Pixel-Art Auténtico Habbo Hotel
// Painter's Algorithm (Depth-Sorting), animaciones de avatares, vapor de café, cámara con paneo y zoom.

import { gridToScreen, getDepthSortKey, TILE_W } from './isometric';
import { HabboSpriteManager } from './habboSprites';
import { ROOM_WIDTH, ROOM_HEIGHT, AGENT_CONFIGS } from './roomLayout';
import { usePipelineStore } from '@/stores/pipeline';

interface ClickableZone {
  nodeKey: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface SteamParticle {
  x: number;
  y: number;
  alpha: number;
  speed: number;
}

export class HabboCanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sprites = new HabboSpriteManager();
  private animFrameId: number | null = null;
  private isDestroyed = false;

  // Transformación de la vista (Cámara)
  public panX = 0;
  public panY = 0;
  public zoom = 1.0;
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };

  // Animaciones y tiempo
  private tick = 0;
  private steamParticles: SteamParticle[] = [];
  private clickZones: ClickableZone[] = [];

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.canvas.style.imageRendering = 'pixelated';
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;

    // Centrar la cámara en el centro de la cafetería
    this.resize();
    this.panX = this.canvas.width / 2;
    this.panY = 160;

    // Inicializar vapor de la cafetera
    for (let i = 0; i < 6; i++) {
      this.steamParticles.push({
        x: Math.random() * 8 - 4,
        y: Math.random() * 20,
        alpha: Math.random() * 0.7,
        speed: 0.4 + Math.random() * 0.4,
      });
    }

    this.bindEvents();
    this.startLoop();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.button === 0) {
        this.isDragging = true;
        this.dragStart = { x: e.clientX - this.panX, y: e.clientY - this.panY };
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (this.isDragging) {
        this.panX = e.clientX - this.dragStart.x;
        this.panY = e.clientY - this.dragStart.y;
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;

      // Detección de clic si no hubo arrastre grande
      const rect = this.canvas.getBoundingClientRect();
      const clickScreenX = (e.clientX - rect.left - this.panX) / this.zoom;
      const clickScreenY = (e.clientY - rect.top - this.panY) / this.zoom;

      for (const zone of this.clickZones) {
        if (
          clickScreenX >= zone.minX &&
          clickScreenX <= zone.maxX &&
          clickScreenY >= zone.minY &&
          clickScreenY <= zone.maxY
        ) {
          const store = usePipelineStore();
          store.selectNode(zone.nodeKey);
          break;
        }
      }
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
      this.zoom = Math.max(0.6, Math.min(2.5, this.zoom * zoomFactor));
    }, { passive: false });

    window.addEventListener('resize', () => this.resize());
  }

  public resize(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth || window.innerWidth;
    const h = parent.clientHeight || window.innerHeight;
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx.imageSmoothingEnabled = false;
  }

  private startLoop(): void {
    const render = () => {
      if (this.isDestroyed) return;
      this.animFrameId = requestAnimationFrame(render);
      this.tick++;

      this.updateSteam();
      this.drawRoom();
      this.updateBubblePositions();
    };

    render();
  }

  private updateSteam(): void {
    for (const p of this.steamParticles) {
      p.y += p.speed;
      p.alpha -= 0.015;
      if (p.alpha <= 0 || p.y > 28) {
        p.y = 0;
        p.x = Math.random() * 8 - 4;
        p.alpha = 0.8;
      }
    }
  }

  /**
   * Dibuja toda la sala con el Painter's Algorithm (Depth-Sorting)
   */
  private drawRoom(): void {
    const ctx = this.ctx;
    const store = usePipelineStore();
    this.clickZones = [];

    // Limpiar fondo
    ctx.fillStyle = '#0d1721';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    // Aplicar paneo y zoom
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);

    // Lista de renderizado con clave de profundidad
    const drawList: Array<{ depth: number; draw: () => void }> = [];

    // 1. Baldosas del Suelo (Floor Grid)
    for (let x = 0; x < ROOM_WIDTH; x++) {
      for (let y = 0; y < ROOM_HEIGHT; y++) {
        const isLounge = x >= 5 && x <= 9 && y >= 1 && y <= 5;
        const tileSprite = isLounge ? this.sprites.getFloorCarpet() : this.sprites.getFloorWood();
        const pt = gridToScreen(x, y, 0);
        const depth = getDepthSortKey(x, y, 0, 0);

        drawList.push({
          depth,
          draw: () => {
            ctx.drawImage(tileSprite, pt.x - TILE_W / 2, pt.y);
          },
        });
      }
    }

    // 2. Muros de Ladrillo (Norte y Oeste)
    // Pared Norte (y = 0)
    for (let x = 0; x < ROOM_WIDTH; x++) {
      const pt = gridToScreen(x, 0, 0);
      const wallSprite = this.sprites.getBrickWall('left');
      const depth = getDepthSortKey(x, -1, 0, 10);

      drawList.push({
        depth,
        draw: () => {
          ctx.drawImage(wallSprite, pt.x - 32, pt.y - 114);
        },
      });
    }

    // Pared Oeste (x = 0)
    for (let y = 0; y < ROOM_HEIGHT; y++) {
      const pt = gridToScreen(0, y, 0);
      const wallSprite = this.sprites.getBrickWall('right');
      const depth = getDepthSortKey(-1, y, 0, 10);

      drawList.push({
        depth,
        draw: () => {
          ctx.drawImage(wallSprite, pt.x - 32, pt.y - 114);
        },
      });
    }

    // 3. Decoraciones fijas de la pared (Ventanal con cielo y Pizarra)
    const windowPt = gridToScreen(6, 0, 0);
    drawList.push({
      depth: getDepthSortKey(6, -1, 1, 15),
      draw: () => {
        ctx.drawImage(this.sprites.getLargeWindow(), windowPt.x - 64, windowPt.y - 110);
      },
    });

    const menuPt = gridToScreen(2, 0, 0);
    drawList.push({
      depth: getDepthSortKey(2, -1, 1, 15),
      draw: () => {
        ctx.drawImage(this.sprites.getChalkboard(), menuPt.x - 30, menuPt.y - 85);
      },
    });

    // 4. Muebles y Decoración (Furni)
    // Barra de Café (x = 2, y = 3)
    const barPt = gridToScreen(2, 3, 0);
    drawList.push({
      depth: getDepthSortKey(2, 3, 0, 50),
      draw: () => {
        ctx.drawImage(this.sprites.getCoffeeBar(), barPt.x - 48, barPt.y - 45);
      },
    });

    // Máquina de Café con vapor (x = 2, y = 2)
    const machinePt = gridToScreen(2, 2, 0);
    drawList.push({
      depth: getDepthSortKey(2, 2, 0, 55),
      draw: () => {
        ctx.drawImage(this.sprites.getEspressoMachine(), machinePt.x - 24, machinePt.y - 38);
        // Partículas de vapor pixel-art
        ctx.fillStyle = '#ffffff';
        for (const p of this.steamParticles) {
          ctx.globalAlpha = p.alpha;
          ctx.fillRect(machinePt.x - 4 + p.x, machinePt.y - 40 - p.y, 2, 2);
        }
        ctx.globalAlpha = 1.0;
      },
    });

    // Sofás de Cuero en el Lounge
    const couch1Pt = gridToScreen(6, 2, 0);
    drawList.push({
      depth: getDepthSortKey(6, 2, 0, 45),
      draw: () => {
        ctx.drawImage(this.sprites.getLeatherCouch('teal'), couch1Pt.x - 38, couch1Pt.y - 40);
      },
    });

    const couch2Pt = gridToScreen(8, 2, 0);
    drawList.push({
      depth: getDepthSortKey(8, 2, 0, 45),
      draw: () => {
        ctx.drawImage(this.sprites.getLeatherCouch('purple'), couch2Pt.x - 38, couch2Pt.y - 40);
      },
    });

    // Estantería de Libros (x = 10, y = 1)
    const shelfPt = gridToScreen(10, 1, 0);
    drawList.push({
      depth: getDepthSortKey(10, 1, 0, 45),
      draw: () => {
        ctx.drawImage(this.sprites.getBookshelf(), shelfPt.x - 24, shelfPt.y - 75);
      },
    });

    // Plantas Ficus
    const plant1Pt = gridToScreen(4, 1, 0);
    drawList.push({
      depth: getDepthSortKey(4, 1, 0, 45),
      draw: () => {
        ctx.drawImage(this.sprites.getPottedPlant(), plant1Pt.x - 20, plant1Pt.y - 45);
      },
    });

    const plant2Pt = gridToScreen(12, 4, 0);
    drawList.push({
      depth: getDepthSortKey(12, 4, 0, 45),
      draw: () => {
        ctx.drawImage(this.sprites.getPottedPlant(), plant2Pt.x - 20, plant2Pt.y - 45);
      },
    });

    // Cajas de Embalaje ZIP (Boxer en x = 11, y = 6)
    const cratePt = gridToScreen(11, 6, 0);
    drawList.push({
      depth: getDepthSortKey(11, 6, 0, 50),
      draw: () => {
        ctx.drawImage(this.sprites.getShippingCrates(), cratePt.x - 25, cratePt.y - 35);
      },
    });

    // Pantalla de Cine Vertical (Showcase en x = 11, y = 10)
    const screenPt = gridToScreen(11, 10, 0);
    drawList.push({
      depth: getDepthSortKey(11, 10, 0, 50),
      draw: () => {
        ctx.drawImage(this.sprites.getCinemaScreen(), screenPt.x - 27, screenPt.y - 75);
      },
    });

    // 5. Escritorios CRT y Avatares de los 10 Agentes
    for (const [key, config] of Object.entries(AGENT_CONFIGS)) {
      const node = store.nodes.get(key);
      const status = node?.status || 'idle';
      const isSelected = store.selectedNodeKey === key;

      const pt = gridToScreen(config.gridX, config.gridY, config.gridZ);

      // 5.1 Si tiene escritorio CRT
      if (config.seatType === 'desk') {
        const screenColor = status === 'completed' ? '#2ecc71' : status === 'running' ? '#00f2fe' : '#475569';
        const deskSprite = this.sprites.getCRTDesk(screenColor, status === 'running');
        const deskDepth = getDepthSortKey(config.gridX, config.gridY, config.gridZ, 60);

        drawList.push({
          depth: deskDepth,
          draw: () => {
            ctx.drawImage(deskSprite, pt.x - 36, pt.y - 50);
          },
        });
      }

      // 5.2 Avatar Habbo
      // Estado de animación:
      // - 'type' con 2 frames alternantes si está running
      // - 'cheer' si está completed
      // - 'blink' periódico cada 180 ticks (3 segundos)
      let avatarState: 'sit' | 'type' | 'cheer' | 'blink' = 'sit';
      const animFrame = (Math.floor(this.tick / 8)) % 2;

      if (status === 'running') {
        avatarState = 'type';
      } else if (status === 'completed') {
        avatarState = 'cheer';
      } else if (this.tick % 180 < 10) {
        avatarState = 'blink';
      }

      const avatarSprite = this.sprites.getHabboAvatar(config.name, {
        skinColor: config.skinColor,
        hairColor: config.hairColor,
        hairStyle: config.hairStyle,
        shirtColor: config.shirtColor,
        pantsColor: config.pantsColor,
        state: avatarState,
        animFrame,
      });

      const avatarYOffset = config.seatType === 'bar' ? -48 : -38;
      const avatarDepth = getDepthSortKey(config.gridX, config.gridY, config.gridZ, 70);

      // Registrar zona clicable
      this.clickZones.push({
        nodeKey: key,
        minX: pt.x - 24,
        maxX: pt.x + 24,
        minY: pt.y + avatarYOffset,
        maxY: pt.y + avatarYOffset + 64,
      });

      drawList.push({
        depth: avatarDepth,
        draw: () => {
          // Si está seleccionado, dibujar aureola de foco
          if (isSelected) {
            ctx.strokeStyle = '#f8cf2c';
            ctx.lineWidth = 2;
            ctx.strokeRect(pt.x - 22, pt.y + avatarYOffset - 4, 44, 68);
          }

          ctx.drawImage(avatarSprite, pt.x - 24, pt.y + avatarYOffset);
        },
      });
    }

    // 6. Ordenar por profundidad estricta (Painter's Algorithm) y Renderizar
    drawList.sort((a, b) => a.depth - b.depth);
    for (const item of drawList) {
      item.draw();
    }

    ctx.restore();
  }

  /**
   * Actualiza las posiciones en pantalla de los globos de diálogo flotantes
   */
  private updateBubblePositions(): void {
    const store = usePipelineStore();
    if (!store.speechBubbles.length) return;

    for (const bubble of store.speechBubbles) {
      const config = AGENT_CONFIGS[bubble.agentKey];
      if (!config) continue;

      const pt = gridToScreen(config.gridX, config.gridY, config.gridZ);
      const avatarYOffset = config.seatType === 'bar' ? -48 : -38;

      // Coordenadas transformadas a la ventana del navegador
      bubble.screenX = Math.round(this.panX + pt.x * this.zoom);
      bubble.screenY = Math.round(this.panY + (pt.y + avatarYOffset - 16) * this.zoom);
    }
  }

  public dispose(): void {
    this.isDestroyed = true;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
  }
}
