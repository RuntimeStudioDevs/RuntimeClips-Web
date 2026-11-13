// RuntimeClips-Web — Motor Principal de Escena Habbo Hotel
// Cámara Dimétrica 2:1 auténtica, sombreado pixel-art, gestión de Furnis y proyección de burbujas.

import * as THREE from 'three';
import { HabboRoom } from './room';
import { HabboFurniFactory } from './furni';
import { HabboAvatar, type HabboAvatarConfig } from './avatars';
import { usePipelineStore } from '@/stores/pipeline';

export interface StationData {
  key: string;
  nodeKey: string;
  group: THREE.Group;
  avatar: HabboAvatar;
  screenMat: THREE.MeshBasicMaterial | null;
  hitBox: THREE.Mesh;
}

export class HabboEngine {
  private container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.OrthographicCamera;
  public renderer: THREE.WebGLRenderer;
  private room: HabboRoom;
  private stations: Map<string, StationData> = new Map();
  private hitTargets: THREE.Mesh[] = [];
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private animFrameId: number | null = null;
  private clock = new THREE.Clock();

  // Controles de paneo manual
  private isDragging = false;
  private startMouse = { x: 0, y: 0 };

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d1721); // Fondo Habbo clásico

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Cámara Dimétrica 2:1 Estricta Habbo
    const aspect = width / height;
    const frustumSize = 24;
    this.camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      -50,
      100
    );

    // Ángulos exactos de proyección dimétrica Habbo (45° yaw, 26.565° pitch)
    const distance = 30;
    const yaw = Math.PI / 4; // 45°
    const pitch = Math.atan(0.5); // 26.565° (proporción 2:1)
    this.camera.position.set(
      distance * Math.cos(pitch) * Math.sin(yaw),
      distance * Math.sin(pitch),
      distance * Math.cos(pitch) * Math.cos(yaw)
    );
    this.camera.lookAt(0, 1.5, 0);

    // 2. Renderer WebGL optimizado estilo Pixel-Art
    this.renderer = new THREE.WebGLRenderer({
      antialias: false, // Sin suavizado borroso para nitidez de píxeles
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap; // Sombras con contornos marcados

    this.container.appendChild(this.renderer.domElement);

    // 3. Montar la sala Habbo
    this.room = new HabboRoom(16, 14, 2.0);
    this.scene.add(this.room.group);

    // 4. Iluminación de estudio Habbo (Luz solar cenital suave + relleno)
    this.setupLighting();

    // 5. Decoración de la sala (Plantas Yucca, dispensador de agua, cine, cajas)
    this.setupDecorations();

    // 6. Construir estaciones de trabajo iniciales
    this.setupDefaultStations();

    // 7. Eventos de interacción
    this.bindEvents();
    this.startLoop();
  }

  private setupLighting(): void {
    // Luz ambiental para no perder detalle en sombras
    const ambient = new THREE.AmbientLight(0x718ca4, 2.4);
    this.scene.add(ambient);

    // Luz solar direccional en ángulo isométrico
    const sun = new THREE.DirectionalLight(0xfffbeb, 2.0);
    sun.position.set(20, 30, 15);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 60;
    const d = 16;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    this.scene.add(sun);
  }

  private setupDecorations(): void {
    // Maceta Yucca en la esquina
    const yucca1 = HabboFurniFactory.createYuccaPlant();
    yucca1.position.set(-13, 0, -11);
    this.scene.add(yucca1);

    const yucca2 = HabboFurniFactory.createYuccaPlant();
    yucca2.position.set(13, 0, -11);
    this.scene.add(yucca2);

    // Dispensador de agua cerca de la entrada
    const cooler = HabboFurniFactory.createWaterCooler();
    cooler.position.set(-12, 0, 7);
    this.scene.add(cooler);
  }

  // Estaciones de los agentes iniciales del tronco
  private setupDefaultStations(): void {
    const avatarConfigs: Record<string, HabboAvatarConfig> = {
      input: {
        name: 'Nexus',
        role: 'Recepción',
        skinColor: 0xfbd38d,
        hairColor: 0x1e293b,
        shirtColor: 0x0284c7,
        pantsColor: 0x0f172a,
        accessory: 'badge',
      },
      ingest: {
        name: 'Byte',
        role: 'Datacenter',
        skinColor: 0xf6ad55,
        hairColor: 0x090d16,
        shirtColor: 0x06b6d4,
        pantsColor: 0x1e293b,
        accessory: 'headphones',
      },
      transcribe: {
        name: 'Echo',
        role: 'Whisper Studio',
        skinColor: 0xed8936,
        hairColor: 0x4c1d95,
        shirtColor: 0x9333ea,
        pantsColor: 0x111827,
        accessory: 'headphones',
      },
      hook: {
        name: 'Viral',
        role: 'Dirección',
        skinColor: 0xfbd38d,
        hairColor: 0xb45309,
        shirtColor: 0xf59e0b,
        pantsColor: 0x1e293b,
        accessory: 'cap',
      },
      collector: {
        name: 'Boxer',
        role: 'Empaquetado',
        skinColor: 0xf6ad55,
        hairColor: 0x7c2d12,
        shirtColor: 0xea580c,
        pantsColor: 0x1e293b,
      },
      player: {
        name: 'Showcase',
        role: 'Cine',
        skinColor: 0xfbd38d,
        hairColor: 0x1e1b4b,
        shirtColor: 0x4f46e5,
        pantsColor: 0x0f172a,
        accessory: 'sunglasses',
      },
    };

    // Posiciones en el suelo de la sala Habbo
    const stationPositions: Record<string, [number, number]> = {
      input: [-9, -6],
      ingest: [-9, 0],
      transcribe: [-4, -6],
      hook: [-4, 0],
      collector: [10, -5],
      player: [10, 3],
    };

    for (const [key, [x, z]] of Object.entries(stationPositions)) {
      this.createOrUpdateStation(key, new THREE.Vector3(x, 0, z), avatarConfigs[key]);
    }
  }

  // Crea una estación de trabajo completa (Desk, Chair, CRT, Avatar, Hitbox)
  public createOrUpdateStation(key: string, pos: THREE.Vector3, config?: HabboAvatarConfig): StationData {
    if (this.stations.has(key)) {
      const existing = this.stations.get(key)!;
      existing.group.position.copy(pos);
      return existing;
    }

    const group = new THREE.Group();
    group.position.copy(pos);
    group.name = `station-${key}`;

    let screenMat: THREE.MeshBasicMaterial | null = null;

    if (key === 'player') {
      // Cine y visualizador
      const cinema = HabboFurniFactory.createCinemaScreen();
      cinema.group.position.set(0, 0, -0.6);
      group.add(cinema.group);
      screenMat = cinema.screenMat;
    } else if (key === 'collector') {
      // Almacén y cajas de empaquetado
      const crates = HabboFurniFactory.createCrateStack();
      crates.position.set(0, 0, -0.4);
      group.add(crates);
    } else {
      // Escritorio estándar Mode + CRT
      const desk = HabboFurniFactory.createModeDesk();
      group.add(desk);

      const crt = HabboFurniFactory.createCRTMonitor(0x00f2fe);
      crt.group.position.set(0, 1.05, -0.2);
      group.add(crt.group);
      screenMat = crt.screenMat;
    }

    // Silla Plasto
    const chairColor = config?.shirtColor || 0x38bdf8;
    const chair = HabboFurniFactory.createPlastoChair(chairColor);
    chair.position.set(0, 0, 0.7);
    group.add(chair);

    // Avatar Habbo
    const avatar = new HabboAvatar(
      config || {
        name: key,
        role: 'Worker',
        skinColor: 0xfbd38d,
        hairColor: 0x0f172a,
        shirtColor: 0x38bdf8,
        pantsColor: 0x1e293b,
      }
    );
    avatar.group.position.set(0, 0.5, 0.65);
    group.add(avatar.group);

    // Caja de clic para selección (Raycasting)
    const hitBoxGeo = new THREE.BoxGeometry(2.6, 2.8, 2.2);
    const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
    hitBox.position.set(0, 1.4, 0);
    hitBox.userData = { nodeKey: key };
    group.add(hitBox);

    this.scene.add(group);
    this.hitTargets.push(hitBox);

    const stationData: StationData = {
      key,
      nodeKey: key,
      group,
      avatar,
      screenMat,
      hitBox,
    };

    this.stations.set(key, stationData);
    return stationData;
  }

  // Sincroniza dinámicamente con la lista de nodos del store Pinia
  public syncNodes(nodes: Map<string, any>): void {
    const branchSpacing = 3.6;

    for (const [key, node] of nodes.entries()) {
      let station = this.stations.get(key);

      // Si es una rama dinámica de clip (reframe-clip-1, etc.)
      if (!station && (key.startsWith('reframe-') || key.startsWith('overlays-') || key.startsWith('captions-') || key.startsWith('render-'))) {
        const stage = key.split('-')[0];
        const clipId = key.split('-')[1] || '1';
        const rowIndex = parseInt(clipId.replace(/\D/g, '') || '1', 10) - 1;

        const stageX: Record<string, number> = {
          reframe: 1.5,
          overlays: 3.8,
          captions: 6.1,
          render: 8.4,
        };

        const x = stageX[stage] ?? 2.0;
        const z = -4.5 + rowIndex * branchSpacing;

        const stageColors: Record<string, number> = {
          reframe: 0x06b6d4,
          overlays: 0xec4899,
          captions: 0xeab308,
          render: 0x10b981,
        };

        station = this.createOrUpdateStation(key, new THREE.Vector3(x, 0, z), {
          name: `${stage}-${clipId}`,
          role: stage.toUpperCase(),
          skinColor: 0xfbd38d,
          hairColor: 0x111827,
          shirtColor: stageColors[stage] || 0x38bdf8,
          pantsColor: 0x1e293b,
        });
      }

      if (station) {
        station.avatar.status = node.status || 'idle';
        if (station.screenMat) {
          if (node.status === 'running') station.screenMat.color.setHex(0x00f2fe);
          else if (node.status === 'completed') station.screenMat.color.setHex(0x2ecc71);
          else if (node.status === 'error') station.screenMat.color.setHex(0xe74c3c);
          else station.screenMat.color.setHex(0x1e293b);
        }
      }
    }
  }

  // Actualiza la posición en pantalla de cada burbuja de diálogo activa
  private updateSpeechBubblePositions(): void {
    const store = usePipelineStore();
    if (!store.speechBubbles.length) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    for (const bubble of store.speechBubbles) {
      const station = this.stations.get(bubble.agentKey);
      if (!station) continue;

      const headPos = station.avatar.getHeadWorldPosition();
      headPos.project(this.camera);

      // Conversión a coordenadas de pantalla (píxeles)
      const x = ((headPos.x + 1) * width) / 2;
      const y = ((-headPos.y + 1) * height) / 2;

      bubble.screenX = Math.round(x);
      bubble.screenY = Math.round(y);
    }
  }

  private bindEvents(): void {
    const dom = this.renderer.domElement;

    // Paneo con arrastre de ratón
    dom.addEventListener('pointerdown', (e) => {
      if (e.button === 0) {
        this.isDragging = true;
        this.startMouse.x = e.clientX;
        this.startMouse.y = e.clientY;
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (this.isDragging) {
        const dx = (e.clientX - this.startMouse.x) * 0.04;
        const dy = (e.clientY - this.startMouse.y) * 0.04;
        this.startMouse.x = e.clientX;
        this.startMouse.y = e.clientY;

        this.camera.position.x -= dx;
        this.camera.position.z += dx;
        this.camera.position.y += dy;
        this.camera.updateProjectionMatrix();
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;

      // Si fue solo un clic sin arrastre, hacer Raycasting
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const hits = this.raycaster.intersectObjects(this.hitTargets, false);

      if (hits.length > 0) {
        const key = hits[0].object.userData.nodeKey;
        const store = usePipelineStore();
        store.selectNode(key);
      }
    });

    window.addEventListener('resize', () => this.resize());
  }

  public resize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;

    const aspect = width / height;
    const frustumSize = 24;

    this.camera.left = (-frustumSize * aspect) / 2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  private startLoop(): void {
    const animate = () => {
      this.animFrameId = requestAnimationFrame(animate);

      const time = this.clock.getElapsedTime();

      // Actualizar animaciones de todos los avatares
      for (const station of this.stations.values()) {
        station.avatar.update(time);
      }

      // Proyectar burbujas de diálogo
      this.updateSpeechBubblePositions();

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  public dispose(): void {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
