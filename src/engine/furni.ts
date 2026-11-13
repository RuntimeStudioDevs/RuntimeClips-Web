// RuntimeClips-Web — Catálogo de Mobiliario (Furni) Auténtico Habbo Hotel
// Escritorios Mode, sillas Plasto, computadoras CRT, macetas Yucca y dispensador de agua.

import * as THREE from 'three';

export class HabboFurniFactory {
  // Materiales compartidos
  private static deskMat = new THREE.MeshStandardMaterial({
    color: 0x1c2b38,
    roughness: 0.4,
    metalness: 0.2,
  });

  private static deskTopMat = new THREE.MeshStandardMaterial({
    color: 0x273d50,
    roughness: 0.3,
  });

  private static darkOutlineMat = new THREE.MeshBasicMaterial({ color: 0x090e14 });

  // 1. Escritorio Mode Clásico Habbo
  public static createModeDesk(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'furni-mode-desk';

    // Superficie principal
    const topGeo = new THREE.BoxGeometry(2.4, 0.16, 1.4);
    const top = new THREE.Mesh(topGeo, this.deskTopMat);
    top.position.y = 1.0;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    // Contorno oscuro de la superficie estilo pixel art
    const outlineGeo = new THREE.BoxGeometry(2.44, 0.04, 1.44);
    const outline = new THREE.Mesh(outlineGeo, this.darkOutlineMat);
    outline.position.y = 0.96;
    group.add(outline);

    // Patas metálicas sólidas estilo Habbo
    const legGeo = new THREE.BoxGeometry(0.12, 1.0, 1.3);
    const legLeft = new THREE.Mesh(legGeo, this.deskMat);
    legLeft.position.set(-1.08, 0.5, 0);
    legLeft.castShadow = true;
    group.add(legLeft);

    const legRight = new THREE.Mesh(legGeo, this.deskMat);
    legRight.position.set(1.08, 0.5, 0);
    legRight.castShadow = true;
    group.add(legRight);

    // Tablero trasero de privacidad
    const backGeo = new THREE.BoxGeometry(2.1, 0.6, 0.08);
    const back = new THREE.Mesh(backGeo, this.deskMat);
    back.position.set(0, 0.65, -0.6);
    group.add(back);

    return group;
  }

  // 2. Silla Plasto Habbo
  public static createPlastoChair(colorHex: number): THREE.Group {
    const group = new THREE.Group();
    group.name = 'furni-plasto-chair';

    const plasticMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.3,
      metalness: 0.1,
    });

    // Asiento
    const seatGeo = new THREE.BoxGeometry(0.8, 0.12, 0.8);
    const seat = new THREE.Mesh(seatGeo, plasticMat);
    seat.position.y = 0.6;
    seat.castShadow = true;
    group.add(seat);

    // Respaldo
    const backGeo = new THREE.BoxGeometry(0.8, 0.8, 0.1);
    const back = new THREE.Mesh(backGeo, plasticMat);
    back.position.set(0, 1.05, 0.35);
    back.castShadow = true;
    group.add(back);

    // Borde negro del respaldo
    const backOutlineGeo = new THREE.BoxGeometry(0.84, 0.04, 0.12);
    const backOutline = new THREE.Mesh(backOutlineGeo, this.darkOutlineMat);
    backOutline.position.set(0, 1.45, 0.35);
    group.add(backOutline);

    // Pata central de metal
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.y = 0.3;
    group.add(leg);

    // Base de 4 radios en el suelo
    const baseGeo = new THREE.BoxGeometry(0.7, 0.04, 0.7);
    const base = new THREE.Mesh(baseGeo, legMat);
    base.position.y = 0.02;
    group.add(base);

    return group;
  }

  // 3. Monitor CRT Retro Habbo
  public static createCRTMonitor(screenColor = 0x00f2fe): { group: THREE.Group; screenMat: THREE.MeshBasicMaterial } {
    const group = new THREE.Group();
    group.name = 'furni-crt-monitor';

    const casingMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Gris beige retro
      roughness: 0.5,
    });

    // Caja profunda del tubo de rayos catódicos
    const boxGeo = new THREE.BoxGeometry(0.9, 0.7, 0.7);
    const box = new THREE.Mesh(boxGeo, casingMat);
    box.position.y = 0.45;
    box.castShadow = true;
    group.add(box);

    // Pantalla de fósforo curva con textura viva
    const screenGeo = new THREE.PlaneGeometry(0.75, 0.55);
    const screenMat = new THREE.MeshBasicMaterial({
      color: screenColor,
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0.46, 0.36);
    group.add(screen);

    // Teclado retro
    const kbGeo = new THREE.BoxGeometry(0.65, 0.04, 0.3);
    const kbMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
    const kb = new THREE.Mesh(kbGeo, kbMat);
    kb.position.set(0, 0.02, 0.6);
    group.add(kb);

    return { group, screenMat };
  }

  // 4. Planta Yucca Habbo
  public static createYuccaPlant(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'furni-yucca';

    // Maceta de terracota
    const potMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.6 });
    const potGeo = new THREE.CylinderGeometry(0.45, 0.35, 0.7, 8);
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.y = 0.35;
    pot.castShadow = true;
    group.add(pot);

    // Hojas pixeladas estilo Habbo
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 });
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const leafGeo = new THREE.BoxGeometry(0.12, 0.9, 0.04);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(Math.cos(angle) * 0.25, 0.9, Math.sin(angle) * 0.25);
      leaf.rotation.z = Math.cos(angle) * 0.4;
      leaf.rotation.x = Math.sin(angle) * 0.4;
      leaf.castShadow = true;
      group.add(leaf);
    }

    return group;
  }

  // 5. Dispensador de Agua Habbo (Water Cooler)
  public static createWaterCooler(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'furni-water-cooler';

    // Soporte blanco
    const standMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 });
    const standGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.4, 8);
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.y = 0.7;
    stand.castShadow = true;
    group.add(stand);

    // Botellón azul translúcido invertido
    const bottleMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      transmission: 0.8,
    });
    const bottleGeo = new THREE.CylinderGeometry(0.28, 0.24, 0.8, 8);
    const bottle = new THREE.Mesh(bottleGeo, bottleMat);
    bottle.position.y = 1.8;
    group.add(bottle);

    return group;
  }

  // 6. Gran Pantalla de Cine Vertical (Showcase Reel Preview)
  public static createCinemaScreen(): { group: THREE.Group; screenMat: THREE.MeshBasicMaterial } {
    const group = new THREE.Group();
    group.name = 'furni-cinema-screen';

    // Marco negro elegante
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x090e14, roughness: 0.3 });
    const frameGeo = new THREE.BoxGeometry(2.4, 4.0, 0.1);
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 2.4;
    group.add(frame);

    // Pantalla 9:16 vertical
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x1e1b4b });
    const screenGeo = new THREE.PlaneGeometry(2.1, 3.7);
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 2.4, 0.06);
    group.add(screen);

    return { group, screenMat };
  }

  // 7. Cajas de Envío y Palé (Boxer Collector)
  public static createCrateStack(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'furni-crate-stack';

    const crateMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
    const strapMat = new THREE.MeshBasicMaterial({ color: 0xf8cf2c });

    const makeCrate = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const crateGeo = new THREE.BoxGeometry(w, h, d);
      const crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.set(x, y + h / 2, z);
      crate.castShadow = true;
      group.add(crate);

      // Fleje amarillo de precinto ZIP
      const strapGeo = new THREE.BoxGeometry(w + 0.02, 0.06, d + 0.02);
      const strap = new THREE.Mesh(strapGeo, strapMat);
      strap.position.set(x, y + h / 2, z);
      group.add(strap);
    };

    makeCrate(1.1, 0.9, 1.1, 0, 0, 0);
    makeCrate(0.9, 0.8, 0.9, 0.1, 0.9, 0.05);

    return group;
  }
}
