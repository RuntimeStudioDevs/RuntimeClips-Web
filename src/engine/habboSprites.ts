// RuntimeClips-Web — Generador y Gestor de Sprites Pixel-Art Auténticos Habbo Hotel
// Sprites 2D dibujados en canvas con contornos negros de 1px, sombreado plano de 3 tonos y estética 100% Habbo.

import { TILE_W, TILE_H } from './isometric';

export class HabboSpriteManager {
  private cache = new Map<string, HTMLCanvasElement>();

  /**
   * Obtiene o genera un sprite en caché
   */
  public get(key: string, generator: () => HTMLCanvasElement): HTMLCanvasElement {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    const canvas = generator();
    this.cache.set(key, canvas);
    return canvas;
  }

  // ── 1. Baldosas de Suelo (64x32 px) ──────────────────────────────────────────

  // Baldosa de Parquet de Madera Oscura (Estilo Imagen 2 Cafetería)
  public getFloorWood(): HTMLCanvasElement {
    return this.get('floor_wood', () => {
      const c = document.createElement('canvas');
      c.width = TILE_W;
      c.height = TILE_H;
      const ctx = c.getContext('2d')!;

      // Rombo base 64x32
      ctx.beginPath();
      ctx.moveTo(32, 0);
      ctx.lineTo(64, 16);
      ctx.lineTo(32, 32);
      ctx.lineTo(0, 16);
      ctx.closePath();

      // Color base madera cálida
      ctx.fillStyle = '#4a3325';
      ctx.fill();

      // Listones de parquet interiores
      ctx.strokeStyle = '#38251a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(16, 8);
      ctx.lineTo(48, 24);
      ctx.moveTo(48, 8);
      ctx.lineTo(16, 24);
      ctx.stroke();

      // Resalte de luz superior
      ctx.strokeStyle = '#634734';
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.lineTo(32, 0);
      ctx.lineTo(64, 16);
      ctx.stroke();

      // Borde exterior negro pixel art (1px)
      ctx.strokeStyle = '#1b120c';
      ctx.stroke();

      return c;
    });
  }

  // Baldosa de Alfombra de Felpa Púrpura (Estilo Imagen 1 Sala VIP)
  public getFloorCarpet(): HTMLCanvasElement {
    return this.get('floor_carpet', () => {
      const c = document.createElement('canvas');
      c.width = TILE_W;
      c.height = TILE_H;
      const ctx = c.getContext('2d')!;

      ctx.beginPath();
      ctx.moveTo(32, 0);
      ctx.lineTo(64, 16);
      ctx.lineTo(32, 32);
      ctx.lineTo(0, 16);
      ctx.closePath();

      ctx.fillStyle = '#583863';
      ctx.fill();

      // Borde decorativo interior
      ctx.strokeStyle = '#3d2545';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Resalte suave
      ctx.strokeStyle = '#744a82';
      ctx.beginPath();
      ctx.moveTo(1, 16);
      ctx.lineTo(32, 1);
      ctx.lineTo(63, 16);
      ctx.stroke();

      return c;
    });
  }

  // ── 2. Paredes de Ladrillo y Gran Ventanal (Estilo Imagen 2) ──────────────────

  // Muro de ladrillo visto con borde superior blanco biselado (Pared Oeste / Norte)
  public getBrickWall(direction: 'left' | 'right'): HTMLCanvasElement {
    return this.get(`wall_brick_${direction}`, () => {
      const w = 64;
      const h = 130;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;

      const isLeft = direction === 'left';

      // Polígono isométrico de la pared
      ctx.beginPath();
      if (isLeft) {
        ctx.moveTo(32, 0);
        ctx.lineTo(64, 16);
        ctx.lineTo(64, h);
        ctx.lineTo(32, h - 16);
      } else {
        ctx.moveTo(0, 16);
        ctx.lineTo(32, 0);
        ctx.lineTo(32, h - 16);
        ctx.lineTo(0, h);
      }
      ctx.closePath();

      // Color base ladrillo rojizo Habbo
      ctx.fillStyle = isLeft ? '#8a3324' : '#a3402e';
      ctx.fill();

      // Líneas de mortero de ladrillo (filas horizontales en ángulo isométrico)
      ctx.strokeStyle = '#5a1e14';
      ctx.lineWidth = 1;
      for (let y = 16; y < h; y += 10) {
        ctx.beginPath();
        if (isLeft) {
          ctx.moveTo(32, y - 16);
          ctx.lineTo(64, y);
        } else {
          ctx.moveTo(0, y);
          ctx.lineTo(32, y - 16);
        }
        ctx.stroke();
      }

      // Remate superior blanco biselado de Habbo
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      if (isLeft) {
        ctx.moveTo(32, 0);
        ctx.lineTo(64, 16);
        ctx.lineTo(64, 22);
        ctx.lineTo(32, 6);
      } else {
        ctx.moveTo(0, 16);
        ctx.lineTo(32, 0);
        ctx.lineTo(32, 6);
        ctx.lineTo(0, 22);
      }
      ctx.closePath();
      ctx.fill();

      // Contornos negros de 1px
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();

      return c;
    });
  }

  // Gran Ventanal Habbo con cielo azul y nubes pixeladas (Imagen 2)
  public getLargeWindow(): HTMLCanvasElement {
    return this.get('wall_window', () => {
      const w = 128;
      const h = 140;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;

      // Marco de madera
      ctx.fillStyle = '#3a261a';
      ctx.fillRect(4, 10, w - 8, h - 10);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(4, 10, w - 8, h - 10);

      // Vidrio azul cielo
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(10, 16, w - 20, h - 22);

      // Nubes blancas pixeladas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(25, 35, 35, 12);
      ctx.fillRect(32, 28, 20, 8);
      ctx.fillRect(75, 55, 30, 10);

      // Travesaño de ventana de 1px negro
      ctx.strokeStyle = '#2b1b11';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w / 2, 16);
      ctx.lineTo(w / 2, h - 6);
      ctx.moveTo(10, (h + 16) / 2);
      ctx.lineTo(w - 10, (h + 16) / 2);
      ctx.stroke();

      return c;
    });
  }

  // Pizarra de Cafetería con Tiza (Chalkboard Menu de la Imagen 2)
  public getChalkboard(): HTMLCanvasElement {
    return this.get('chalkboard', () => {
      const w = 60;
      const h = 75;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;

      // Marco de madera clara
      ctx.fillStyle = '#b45309';
      ctx.fillRect(2, 2, w - 4, h - 4);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(2, 2, w - 4, h - 4);

      // Fondo pizarra negra
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(6, 6, w - 12, h - 12);

      // Texto de tiza blanco/amarillo
      ctx.fillStyle = '#f8cf2c';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('COFFEE', 12, 18);

      ctx.fillStyle = '#ffffff';
      ctx.font = '6px monospace';
      ctx.fillText('> ESPRESSO', 10, 30);
      ctx.fillText('> LATTE', 10, 40);
      ctx.fillText('> REELS 9:16', 10, 52);
      ctx.fillText('> SSE 60FPS', 10, 64);

      return c;
    });
  }

  // ── 3. Mobiliario (Furni) Artesanal de Habbo Hotel ───────────────────────────

  // Mostrador de Cafetería (Coffee Bar Counter con vitrina)
  public getCoffeeBar(): HTMLCanvasElement {
    return this.get('coffee_bar', () => {
      const w = 96;
      const h = 72;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;

      // Base frontal de madera oscura acanalada
      ctx.fillStyle = '#2e1c12';
      ctx.fillRect(6, 26, w - 12, 40);

      // Acanalado vertical
      ctx.strokeStyle = '#1a0f0a';
      ctx.lineWidth = 1;
      for (let x = 12; x < w - 12; x += 6) {
        ctx.beginPath();
        ctx.moveTo(x, 26);
        ctx.lineTo(x, 66);
        ctx.stroke();
      }

      // Mostrador superior (mármol beige con bisel)
      ctx.fillStyle = '#e2d3b5';
      ctx.beginPath();
      ctx.moveTo(48, 6);
      ctx.lineTo(w - 6, 24);
      ctx.lineTo(48, 38);
      ctx.lineTo(6, 24);
      ctx.closePath();
      ctx.fill();

      // Vitrina de cristal con pasteles
      ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
      ctx.fillRect(16, 12, 36, 16);
      ctx.strokeStyle = '#0284c7';
      ctx.strokeRect(16, 12, 36, 16);

      // Croissants/muffins dentro de la vitrina
      ctx.fillStyle = '#d97706';
      ctx.fillRect(20, 20, 6, 5);
      ctx.fillRect(30, 19, 7, 6);
      ctx.fillRect(40, 20, 6, 5);

      // Contorno negro de todo el mueble
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(6, 26, w - 12, 40);

      return c;
    });
  }

  // Máquina de Café Espresso Profesional de Cromo
  public getEspressoMachine(): HTMLCanvasElement {
    return this.get('espresso_machine', () => {
      const w = 48;
      const h = 48;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;

      // Cuerpo de acero inoxidable brillante
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(8, 14, 32, 28);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(10, 16, 28, 10);

      // Manijas y botones
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(14, 30, 6, 8);
      ctx.fillRect(28, 30, 6, 8);

      // Taza de café blanca en la bandeja
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, 36, 8, 7);

      // Borde negro
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(8, 14, 32, 28);

      return c;
    });
  }

  // Sofá Esquinero de Cuero Cómodo (Imagen 2 style)
  public getLeatherCouch(color: string): HTMLCanvasElement {
    return this.get(`couch_${color}`, () => {
      const w = 76;
      const h = 64;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;

      // Respaldo acolchado
      ctx.fillStyle = color === 'teal' ? '#0f766e' : '#6b21a8';
      ctx.fillRect(10, 10, w - 20, 22);

      // Cojines de asiento
      ctx.fillStyle = color === 'teal' ? '#14b8a6' : '#9333ea';
      ctx.fillRect(10, 28, w - 20, 18);

      // Líneas de capitoné / acolchado
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(34, 10);
      ctx.lineTo(34, 46);
      ctx.moveTo(56, 10);
      ctx.lineTo(56, 46);
      ctx.stroke();

      // Patas de cromo
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(12, 46, 5, 8);
      ctx.fillRect(w - 17, 46, 5, 8);

      // Contorno general negro
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(10, 10, w - 20, 36);

      return c;
    });
  }

  // Escritorio de Trabajo con Computadora CRT y Pantalla Viva
  public getCRTDesk(screenColorHex = '#00f2fe', isRunning = false): HTMLCanvasElement {
    const key = `crt_desk_${screenColorHex}_${isRunning ? 'run' : 'idle'}`;
    return this.get(key, () => {
      const w = 72;
      const h = 72;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;

      // Superficie del escritorio de madera oscura con bisel
      ctx.fillStyle = '#26384a';
      ctx.beginPath();
      ctx.moveTo(36, 14);
      ctx.lineTo(68, 28);
      ctx.lineTo(36, 42);
      ctx.lineTo(4, 28);
      ctx.closePath();
      ctx.fill();

      // Borde negro del escritorio
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Patas del escritorio
      ctx.fillStyle = '#111c26';
      ctx.fillRect(8, 29, 6, 26);
      ctx.fillRect(58, 29, 6, 26);

      // Monitor CRT retro beige/gris
      ctx.fillStyle = '#64748b';
      ctx.fillRect(24, 6, 24, 20);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(24, 6, 24, 20);

      // Pantalla curva de fósforo (activa con código o estática)
      ctx.fillStyle = screenColorHex;
      ctx.fillRect(27, 9, 18, 14);

      // Líneas de código en la pantalla
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(29, 11, 10, 2);
      ctx.fillRect(29, 15, 14, 2);
      ctx.fillRect(29, 19, 8, 2);

      // Teclado retro beige
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(24, 28, 16, 6);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(24, 28, 16, 6);

      // Taza de café sobre la mesa
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(50, 24, 5, 5);

      return c;
    });
  }

  // Estantería de Libros y Rollos (Bookshelf de la Imagen 2)
  public getBookshelf(): HTMLCanvasElement {
    return this.get('bookshelf', () => {
      const w = 48;
      const h = 90;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;

      // Estructura de madera cálida
      ctx.fillStyle = '#92400e';
      ctx.fillRect(4, 8, w - 8, h - 10);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(4, 8, w - 8, h - 10);

      // 4 Baldas con libros de colores
      const bookColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
      for (let shelf = 0; shelf < 3; shelf++) {
        const y = 22 + shelf * 22;
        // Balda horizontal
        ctx.fillStyle = '#78350f';
        ctx.fillRect(6, y + 14, w - 12, 3);

        // Libros verticales
        for (let b = 0; b < 6; b++) {
          ctx.fillStyle = bookColors[(shelf + b) % bookColors.length];
          const bW = 4 + (b % 2);
          const bH = 11 + (b % 3);
          ctx.fillRect(8 + b * 5.5, y + 14 - bH, bW, bH);
        }
      }

      return c;
    });
  }

  // Planta Ficus / Monstera en maceta redonda
  public getPottedPlant(): HTMLCanvasElement {
    return this.get('potted_plant', () => {
      const w = 40;
      const h = 54;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;

      // Maceta de terracota
      ctx.fillStyle = '#c2410c';
      ctx.beginPath();
      ctx.moveTo(12, 32);
      ctx.lineTo(28, 32);
      ctx.lineTo(25, 50);
      ctx.lineTo(15, 50);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.stroke();

      // Hojas verdes frondosas pixel-art
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(20, 20, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.stroke();

      // Hojas de resalte
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(14, 14, 8, 8);
      ctx.fillRect(22, 10, 7, 7);

      return c;
    });
  }

  // Pantalla de Cine Vertical (Showcase Reel Preview)
  public getCinemaScreen(): HTMLCanvasElement {
    return this.get('cinema_screen', () => {
      const w = 54;
      const h = 90;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;

      // Marco negro
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 4, w - 8, h - 8);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(4, 4, w - 8, h - 8);

      // Pantalla 9:16 vertical
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(8, 8, w - 16, h - 16);

      // Texto de reel listo
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('9:16 REEL', 10, 24);
      ctx.fillText('✓ 1080P', 10, 36);

      return c;
    });
  }

  // Cajas de Embalaje ZIP (Boxer)
  public getShippingCrates(): HTMLCanvasElement {
    return this.get('shipping_crates', () => {
      const w = 50;
      const h = 50;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;

      // Caja de madera
      ctx.fillStyle = '#b45309';
      ctx.fillRect(8, 14, 34, 30);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(8, 14, 34, 30);

      // Cinta dorada de sellado ZIP
      ctx.fillStyle = '#f8cf2c';
      ctx.fillRect(22, 14, 6, 30);
      ctx.fillRect(8, 26, 34, 6);

      return c;
    });
  }

  // ── 4. Avatares Pixel-Art Auténticos Habbo Hotel (Proporciones Fieles) ─────────

  /**
   * Genera un avatar de Habbo Hotel con proporciones auténticas:
   * Cabeza grande expresiva, pelo con mechas, ojos con pupilas negras, ropa detallada,
   * y soporte para estados: 'sit' (sentado), 'type' (tecleando), 'blink' (parpadeo) y 'cheer'.
   */
  public getHabboAvatar(
    name: string,
    options: {
      skinColor?: string;
      hairColor?: string;
      hairStyle?: 'bob' | 'spiky' | 'cap' | 'visor' | 'glasses' | 'headset' | 'beret';
      shirtColor?: string;
      pantsColor?: string;
      state?: 'sit' | 'type' | 'cheer' | 'blink';
      animFrame?: number; // 0 o 1
    }
  ): HTMLCanvasElement {
    const skin = options.skinColor || '#fbd38d';
    const hair = options.hairColor || '#1e293b';
    const style = options.hairStyle || 'bob';
    const shirt = options.shirtColor || '#0284c7';
    const pants = options.pantsColor || '#0f172a';
    const state = options.state || 'sit';
    const frame = options.animFrame || 0;

    const cacheKey = `avatar_${name}_${style}_${shirt}_${state}_${frame}`;
    return this.get(cacheKey, () => {
      const w = 48;
      const h = 64;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;

      const centerX = 24;

      // 1. Piernas / Pantalones sentados en perspectiva isométrica
      ctx.fillStyle = pants;
      ctx.fillRect(centerX - 8, 44, 16, 12);
      // Zapatos negros
      ctx.fillStyle = '#090e14';
      ctx.fillRect(centerX - 9, 54, 8, 5);
      ctx.fillRect(centerX + 1, 54, 8, 5);
      // Contorno de piernas
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(centerX - 8, 44, 16, 12);

      // 2. Torso / Camisa
      ctx.fillStyle = shirt;
      ctx.fillRect(centerX - 9, 28, 18, 18);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(centerX - 9, 28, 18, 18);

      // Cuello de la camisa / corbata
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(centerX - 3, 28, 6, 4);

      // 3. Brazos con animación de tecleo o festejo
      ctx.fillStyle = shirt;
      if (state === 'type') {
        // Alternancia de manos tecleando
        const leftY = frame === 0 ? 36 : 40;
        const rightY = frame === 0 ? 40 : 36;
        // Brazo izquierdo
        ctx.fillRect(centerX - 13, 30, 4, 10);
        ctx.fillStyle = skin;
        ctx.fillRect(centerX - 12, leftY, 5, 4); // Mano
        // Brazo derecho
        ctx.fillStyle = shirt;
        ctx.fillRect(centerX + 9, 30, 4, 10);
        ctx.fillStyle = skin;
        ctx.fillRect(centerX + 7, rightY, 5, 4); // Mano
      } else if (state === 'cheer') {
        // Brazo levantado saludando / celebrando
        ctx.fillRect(centerX + 9, 18, 5, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(centerX + 9, 14, 5, 5);
        // Brazo izquierdo en el regazo
        ctx.fillStyle = shirt;
        ctx.fillRect(centerX - 13, 32, 5, 10);
      } else {
        // Brazos en reposo / regazo
        ctx.fillRect(centerX - 13, 31, 4, 11);
        ctx.fillRect(centerX + 9, 31, 4, 11);
        ctx.fillStyle = skin;
        ctx.fillRect(centerX - 12, 40, 4, 4);
        ctx.fillRect(centerX + 8, 40, 4, 4);
      }

      // 4. Cabeza Habbo (Proporción grande, redonda y expresiva)
      ctx.fillStyle = skin;
      ctx.fillRect(centerX - 9, 12, 18, 17);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(centerX - 9, 12, 18, 17);

      // Ojos de Habbo (blancos con pupilas negras)
      if (state === 'blink') {
        // Ojos cerrados por parpadeo
        ctx.fillStyle = '#000000';
        ctx.fillRect(centerX - 6, 21, 4, 1);
        ctx.fillRect(centerX + 2, 21, 4, 1);
      } else {
        // Ojos abiertos con pupila y brillo blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(centerX - 7, 18, 5, 5);
        ctx.fillRect(centerX + 2, 18, 5, 5);
        // Pupilas
        ctx.fillStyle = '#000000';
        ctx.fillRect(centerX - 5, 19, 3, 4);
        ctx.fillRect(centerX + 4, 19, 3, 4);
      }

      // Boca discreta Habbo
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(centerX - 2, 25, 4, 2);

      // 5. Peinado y Accesorios Icónicos de Habbo
      ctx.fillStyle = hair;

      if (style === 'bob') {
        // Melena bob clásica con flequillo
        ctx.fillRect(centerX - 11, 7, 22, 9);
        ctx.fillRect(centerX - 11, 14, 4, 10);
        ctx.fillRect(centerX + 7, 14, 4, 10);
      } else if (style === 'spiky') {
        // Pelo con puntas rebeldes
        ctx.fillRect(centerX - 10, 8, 20, 8);
        ctx.fillRect(centerX - 6, 4, 5, 5);
        ctx.fillRect(centerX + 1, 4, 5, 5);
      } else if (style === 'cap') {
        // Gorra naranja de director (Viral)
        ctx.fillStyle = '#f97316';
        ctx.fillRect(centerX - 11, 7, 22, 8);
        ctx.fillRect(centerX - 4, 5, 16, 4); // Visera hacia atrás
      } else if (style === 'visor') {
        // Pelo + Visor cian (Focus)
        ctx.fillRect(centerX - 10, 8, 20, 8);
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(centerX - 8, 17, 16, 5);
      } else if (style === 'glasses') {
        // Pelo + Gafas redondas (Typo)
        ctx.fillRect(centerX - 10, 8, 20, 8);
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(centerX - 8, 17, 6, 6);
        ctx.strokeRect(centerX + 2, 17, 6, 6);
      } else if (style === 'headset') {
        // Pelo + Auriculares de estudio (Echo / Master)
        ctx.fillRect(centerX - 10, 8, 20, 8);
        ctx.fillStyle = '#9333ea';
        ctx.fillRect(centerX - 12, 16, 4, 8);
        ctx.fillRect(centerX + 8, 16, 4, 8);
        ctx.fillRect(centerX - 10, 6, 20, 3); // Diadema
      } else if (style === 'beret') {
        // Boina de diseñador (Vector)
        ctx.fillStyle = '#db2777';
        ctx.fillRect(centerX - 12, 6, 24, 8);
      }

      // Contorno de pelo
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(centerX - 10, 7, 20, 8);

      return c;
    });
  }
}
