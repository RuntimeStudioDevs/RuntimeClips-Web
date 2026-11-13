// RuntimeClips-Web — Modelos de Avatares Voxel estilo Habbo Hotel
// Proporciones icónicas de Habbo, accesorios de rol, animaciones de tecleo y anclaje de burbujas.

import * as THREE from 'three';

export interface HabboAvatarConfig {
  name: string;
  role: string;
  skinColor: number;
  hairColor: number;
  shirtColor: number;
  pantsColor: number;
  accessory?: 'headphones' | 'badge' | 'cap' | 'visor' | 'glasses' | 'sunglasses';
}

export class HabboAvatar {
  public group: THREE.Group;
  public headGroup: THREE.Group;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public statusBadge: THREE.Mesh;
  public statusBadgeMat: THREE.MeshBasicMaterial;
  public config: HabboAvatarConfig;
  public status: 'idle' | 'running' | 'completed' | 'error' = 'idle';

  constructor(config: HabboAvatarConfig) {
    this.config = config;
    this.group = new THREE.Group();
    this.group.name = `habbo-avatar-${config.name}`;

    // Materiales
    const skinMat = new THREE.MeshStandardMaterial({ color: config.skinColor, roughness: 0.6 });
    const hairMat = new THREE.MeshStandardMaterial({ color: config.hairColor, roughness: 0.5 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: config.shirtColor, roughness: 0.5 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: config.pantsColor, roughness: 0.6 });
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const blackOutlineMat = new THREE.MeshBasicMaterial({ color: 0x090e14 });

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.65, 0.75, 0.45);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 0.45;
    torso.castShadow = true;
    this.group.add(torso);

    // Contorno del torso
    const torsoOutlineGeo = new THREE.BoxGeometry(0.69, 0.04, 0.49);
    const torsoOutline = new THREE.Mesh(torsoOutlineGeo, blackOutlineMat);
    torsoOutline.position.y = 0.83;
    this.group.add(torsoOutline);

    // 2. Cabeza Habbo
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.15, 0);

    const headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.castShadow = true;
    this.headGroup.add(head);

    // Pelo icónico Habbo
    const hairGeo = new THREE.BoxGeometry(0.64, 0.28, 0.64);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.22, 0);
    this.headGroup.add(hair);

    // Ojos de píxel (mirando hacia adelante en la proyección)
    const eyeGeo = new THREE.BoxGeometry(0.1, 0.12, 0.04);
    const pupilGeo = new THREE.BoxGeometry(0.06, 0.08, 0.05);

    const leftEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    leftEye.position.set(-0.16, 0.04, 0.3);
    this.headGroup.add(leftEye);

    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.16, 0.04, 0.32);
    this.headGroup.add(leftPupil);

    const rightEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    rightEye.position.set(0.16, 0.04, 0.3);
    this.headGroup.add(rightEye);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.16, 0.04, 0.32);
    this.headGroup.add(rightPupil);

    // Accesorios específicos
    if (config.accessory === 'headphones') {
      const hpMat = new THREE.MeshStandardMaterial({ color: 0x9333ea, metalness: 0.7 });
      const hpGeo = new THREE.BoxGeometry(0.12, 0.24, 0.24);
      const hpLeft = new THREE.Mesh(hpGeo, hpMat);
      hpLeft.position.set(-0.35, 0.05, 0);
      this.headGroup.add(hpLeft);

      const hpRight = new THREE.Mesh(hpGeo, hpMat);
      hpRight.position.set(0.35, 0.05, 0);
      this.headGroup.add(hpRight);

      const bandGeo = new THREE.BoxGeometry(0.72, 0.06, 0.1);
      const band = new THREE.Mesh(bandGeo, hpMat);
      band.position.set(0, 0.36, 0);
      this.headGroup.add(band);
    } else if (config.accessory === 'cap') {
      const capMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
      const capGeo = new THREE.BoxGeometry(0.66, 0.15, 0.66);
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(0, 0.32, 0);
      this.headGroup.add(cap);

      const visorGeo = new THREE.BoxGeometry(0.4, 0.04, 0.3);
      const visor = new THREE.Mesh(visorGeo, capMat);
      visor.position.set(0, 0.28, -0.42); // Gorra hacia atrás
      this.headGroup.add(visor);
    } else if (config.accessory === 'visor') {
      const visorMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      const visorGeo = new THREE.BoxGeometry(0.55, 0.14, 0.15);
      const visor = new THREE.Mesh(visorGeo, visorMat);
      visor.position.set(0, 0.04, 0.31);
      this.headGroup.add(visor);
    } else if (config.accessory === 'sunglasses') {
      const glassesMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      const glassesGeo = new THREE.BoxGeometry(0.54, 0.12, 0.08);
      const glasses = new THREE.Mesh(glassesGeo, glassesMat);
      glasses.position.set(0, 0.04, 0.31);
      this.headGroup.add(glasses);
    }

    this.group.add(this.headGroup);

    // 3. Brazos articulados
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.42, 0.72, 0);
    const armGeo = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    const leftArmMesh = new THREE.Mesh(armGeo, shirtMat);
    leftArmMesh.position.y = -0.25;
    leftArmMesh.castShadow = true;
    this.leftArm.add(leftArmMesh);
    this.group.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.42, 0.72, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, shirtMat);
    rightArmMesh.position.y = -0.25;
    rightArmMesh.castShadow = true;
    this.rightArm.add(rightArmMesh);
    this.group.add(this.rightArm);

    // 4. Piernas sentadas
    const legGeo = new THREE.BoxGeometry(0.24, 0.5, 0.24);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.18, 0.15, 0.2);
    leftLeg.rotation.x = -Math.PI / 2.2;
    this.group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.18, 0.15, 0.2);
    rightLeg.rotation.x = -Math.PI / 2.2;
    this.group.add(rightLeg);

    // 5. Insignia flotante de estado (Zzz / Lightning / Check / Cross)
    const badgeGeo = new THREE.PlaneGeometry(0.4, 0.4);
    this.statusBadgeMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.8,
    });
    this.statusBadge = new THREE.Mesh(badgeGeo, this.statusBadgeMat);
    this.statusBadge.position.set(0, 1.9, 0);
    this.group.add(this.statusBadge);
  }

  // Actualiza animaciones procedurales en cada frame
  public update(time: number): void {
    if (this.status === 'running') {
      // Tecleo rápido en el escritorio
      this.leftArm.rotation.x = -Math.PI / 3 + Math.sin(time * 18) * 0.25;
      this.rightArm.rotation.x = -Math.PI / 3 + Math.cos(time * 18) * 0.25;
      this.headGroup.rotation.y = Math.sin(time * 4) * 0.12;
      this.statusBadgeMat.color.setHex(0xf8cf2c); // Oro Habbo
      this.statusBadge.position.y = 1.9 + Math.sin(time * 6) * 0.05;
    } else if (this.status === 'completed') {
      // Celebración: brazos arriba
      this.leftArm.rotation.x = -Math.PI / 1.4 + Math.sin(time * 4) * 0.15;
      this.rightArm.rotation.x = -Math.PI / 1.4 + Math.cos(time * 4) * 0.15;
      this.headGroup.rotation.y = 0;
      this.statusBadgeMat.color.setHex(0x2ecc71); // Verde Habbo
      this.statusBadge.position.y = 1.9 + Math.sin(time * 4) * 0.03;
    } else if (this.status === 'error') {
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
      this.headGroup.rotation.x = 0.25; // Cabeza gacha
      this.statusBadgeMat.color.setHex(0xe74c3c); // Rojo Bobba
      this.statusBadge.position.y = 1.7;
    } else {
      // Idle: respiración suave
      this.leftArm.rotation.x = -0.3 + Math.sin(time * 2) * 0.04;
      this.rightArm.rotation.x = -0.3 + Math.cos(time * 2) * 0.04;
      this.headGroup.rotation.y = Math.sin(time * 1.5) * 0.06;
      this.headGroup.position.y = 1.15 + Math.sin(time * 2) * 0.015;
      this.statusBadgeMat.color.setHex(0x64748b);
      this.statusBadge.position.y = 1.9;
    }
  }

  // Obtiene la posición 3D de la cabeza para el anclaje del globo de diálogo
  public getHeadWorldPosition(): THREE.Vector3 {
    const pos = new THREE.Vector3();
    this.headGroup.getWorldPosition(pos);
    pos.y += 0.8; // Justo encima de la cabeza
    return pos;
  }
}
