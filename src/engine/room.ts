// RuntimeClips-Web — Habbo Hotel Room Geometry
// Suelo dimétrico 2:1 con baldosas 64x32 y paredes biseladas características de Habbo.

import * as THREE from 'three';

export class HabboRoom {
  public group: THREE.Group;
  public widthTiles: number;
  public heightTiles: number;
  public tileSize: number;

  constructor(widthTiles = 16, heightTiles = 14, tileSize = 2.0) {
    this.widthTiles = widthTiles;
    this.heightTiles = heightTiles;
    this.tileSize = tileSize;
    this.group = new THREE.Group();
    this.group.name = 'habbo-room';

    this.buildFloor();
    this.buildWalls();
    this.buildDoor();
  }

  // Suelo con baldosas estilo parquet Habbo
  private buildFloor(): void {
    const floorWidth = this.widthTiles * this.tileSize;
    const floorHeight = this.heightTiles * this.tileSize;

    // Losa del suelo
    const floorGeo = new THREE.PlaneGeometry(floorWidth, floorHeight);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x223547,
      roughness: 0.7,
      metalness: 0.1,
    });

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Rejilla de baldosas dimétricas Habbo
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = 128;
    gridCanvas.height = 128;
    const ctx = gridCanvas.getContext('2d');
    if (ctx) {
      // Color base de baldosa
      ctx.fillStyle = '#2c4359';
      ctx.fillRect(0, 0, 128, 128);

      // Línea de borde oscura de baldosa (1px pixel art)
      ctx.strokeStyle = '#182736';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 128, 128);

      // Resalte de luz en borde superior/izquierdo
      ctx.strokeStyle = '#3d5c7a';
      ctx.beginPath();
      ctx.moveTo(1, 127);
      ctx.lineTo(1, 1);
      ctx.lineTo(127, 1);
      ctx.stroke();
    }

    const gridTexture = new THREE.CanvasTexture(gridCanvas);
    gridTexture.wrapS = THREE.RepeatWrapping;
    gridTexture.wrapT = THREE.RepeatWrapping;
    gridTexture.repeat.set(this.widthTiles, this.heightTiles);
    gridTexture.magFilter = THREE.NearestFilter;
    gridTexture.minFilter = THREE.NearestFilter;
    floorMat.map = gridTexture;
    floorMat.needsUpdate = true;

    // Base del diorama (borde inferior oscuro de 0.8 unidades)
    const baseGeo = new THREE.BoxGeometry(floorWidth + 0.1, 0.6, floorHeight + 0.1);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0a1017,
      roughness: 0.9,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.3;
    base.receiveShadow = true;
    this.group.add(base);
  }

  // Paredes características de Habbo Hotel (con borde biselado a 45 grados y contorno negro)
  private buildWalls(): void {
    const wallHeight = 5.5;
    const wallThickness = 0.5;
    const floorWidth = this.widthTiles * this.tileSize;
    const floorHeight = this.heightTiles * this.tileSize;

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x3d566e,
      roughness: 0.6,
      metalness: 0.1,
    });

    const bevelMat = new THREE.MeshStandardMaterial({
      color: 0x517292,
      roughness: 0.4,
    });

    const borderMat = new THREE.MeshBasicMaterial({ color: 0x090e14 });

    // 1. Pared Trasera Norte (Z = -floorHeight / 2)
    const northGroup = new THREE.Group();
    const northWallGeo = new THREE.BoxGeometry(floorWidth, wallHeight, wallThickness);
    const northWall = new THREE.Mesh(northWallGeo, wallMat);
    northWall.position.set(0, wallHeight / 2, -floorHeight / 2 - wallThickness / 2);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    northGroup.add(northWall);

    // Bisel superior de la pared norte
    const northBevelGeo = new THREE.BoxGeometry(floorWidth, 0.15, wallThickness + 0.08);
    const northBevel = new THREE.Mesh(northBevelGeo, bevelMat);
    northBevel.position.set(0, wallHeight + 0.07, -floorHeight / 2 - wallThickness / 2);
    northGroup.add(northBevel);

    // Contorno negro superior estilo pixel art
    const northBorderGeo = new THREE.BoxGeometry(floorWidth + 0.02, 0.04, 0.04);
    const northBorder = new THREE.Mesh(northBorderGeo, borderMat);
    northBorder.position.set(0, wallHeight + 0.16, -floorHeight / 2 + 0.02);
    northGroup.add(northBorder);

    this.group.add(northGroup);

    // 2. Pared Oeste (X = -floorWidth / 2)
    const westGroup = new THREE.Group();
    const westWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, floorHeight);
    const westWall = new THREE.Mesh(westWallGeo, wallMat);
    westWall.position.set(-floorWidth / 2 - wallThickness / 2, wallHeight / 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    westGroup.add(westWall);

    // Bisel superior de la pared oeste
    const westBevelGeo = new THREE.BoxGeometry(wallThickness + 0.08, 0.15, floorHeight);
    const westBevel = new THREE.Mesh(westBevelGeo, bevelMat);
    westBevel.position.set(-floorWidth / 2 - wallThickness / 2, wallHeight + 0.07, 0);
    westGroup.add(westBevel);

    // Contorno negro
    const westBorderGeo = new THREE.BoxGeometry(0.04, 0.04, floorHeight + 0.02);
    const westBorder = new THREE.Mesh(westBorderGeo, borderMat);
    westBorder.position.set(-floorWidth / 2 + 0.02, wallHeight + 0.16, 0);
    westGroup.add(westBorder);

    this.group.add(westGroup);
  }

  // Puerta de entrada icónica de Habbo
  private buildDoor(): void {
    const doorGeo = new THREE.BoxGeometry(1.8, 3.2, 0.1);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x1f2e3d,
      roughness: 0.5,
    });
    const door = new THREE.Mesh(doorGeo, doorMat);
    const floorWidth = this.widthTiles * this.tileSize;
    door.position.set(-floorWidth / 2 + 2.5, 1.6, -this.heightTiles * this.tileSize / 2 + 0.06);
    this.group.add(door);

    // Marco de puerta
    const frameGeo = new THREE.BoxGeometry(2.0, 3.4, 0.08);
    const frameMat = new THREE.MeshBasicMaterial({ color: 0x090e14 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(-floorWidth / 2 + 2.5, 1.7, -this.heightTiles * this.tileSize / 2 + 0.02);
    this.group.add(frame);

    // Felpudo de bienvenida "WELCOME"
    const matGeo = new THREE.PlaneGeometry(1.6, 1.0);
    const matMat = new THREE.MeshStandardMaterial({ color: 0xf8cf2c, roughness: 0.8 });
    const mat = new THREE.Mesh(matGeo, matMat);
    mat.rotation.x = -Math.PI / 2;
    mat.position.set(-floorWidth / 2 + 2.5, 0.02, -this.heightTiles * this.tileSize / 2 + 0.8);
    this.group.add(mat);
  }
}
