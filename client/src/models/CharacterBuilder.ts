import * as THREE from 'three';
import { CharacterId, CharacterRig, EquippedState } from '../types/game.types';

export class CharacterBuilder {
  // Anexar Chapéu Equipado
  public static attachEquippedHat(head: THREE.Group, hatId: string) {
    if (hatId === 'hat_red' || hatId === 'hat_blue') {
      const isRed = hatId === 'hat_red';
      const hatMat = new THREE.MeshStandardMaterial({ color: isRed ? 0xdc2626 : 0x0284c7, roughness: 0.35 });
      const brimMat = new THREE.MeshStandardMaterial({ color: isRed ? 0xb91c1c : 0x0369a1, roughness: 0.40 });
      const pomMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 });

      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.57, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.52), hatMat);
      dome.position.y = 0.18;
      const brim = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.09, 10, 28), brimMat);
      brim.rotation.x = Math.PI / 2;
      brim.position.y = 0.18;
      const pom = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), pomMat);
      pom.position.set(0, 0.74, -0.08);
      head.add(dome, brim, pom);

    } else if (hatId === 'hat_top') {
      const hatMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35 });
      const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.30 });

      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.70, 0.70, 0.05, 24), hatMat);
      brim.position.y = 0.46;
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.58, 24), hatMat);
      crown.position.y = 0.76;
      const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.455, 0.455, 0.12, 24), ribbonMat);
      ribbon.position.y = 0.54;
      head.add(brim, crown, ribbon);

    } else if (hatId === 'hat_crown') {
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.22 });
      const gemMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.10 });

      const circlet = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.55, 0.20, 24, 1, true), goldMat);
      circlet.position.y = 0.48;
      head.add(circlet);

      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.26, 8), goldMat);
        spike.position.set(Math.cos(ang) * 0.52, 0.68, Math.sin(ang) * 0.52);
        const gem = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), gemMat);
        gem.position.set(Math.cos(ang) * 0.54, 0.54, Math.sin(ang) * 0.54);
        head.add(spike, gem);
      }
    }
  }

  // Anexar Óculos de Esqui Equipados
  public static attachEquippedGoggles(head: THREE.Group, gogglesId: string) {
    if (gogglesId === 'goggles_none') return;

    const lensColor = gogglesId === 'goggles_orange' ? 0xf97316 : 0x38bdf8;
    const lensMat = new THREE.MeshStandardMaterial({ color: lensColor, metalness: 0.7, roughness: 0.15, transparent: true, opacity: 0.88 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35 });
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.50 });

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.18, 0.14), lensMat);
    visor.position.set(0, 0.08, 0.52);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.22, 0.07), frameMat);
    frame.position.set(0, 0.08, 0.50);

    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 8, 28), strapMat);
    strap.rotation.x = Math.PI / 2;
    strap.position.y = 0.08;

    head.add(visor, frame, strap);
  }

  // Anexar Cachecol Equipado
  public static attachEquippedScarf(torso: THREE.Group, scarfId: string): THREE.Mesh {
    const color = scarfId === 'scarf_green' ? 0x16a34a : (scarfId === 'scarf_red' ? 0xdc2626 : 0xfacc15);
    const scarfMat = new THREE.MeshStandardMaterial({ color, roughness: 0.45 });

    const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 10, 24), scarfMat);
    scarfRing.rotation.x = Math.PI / 2;
    scarfRing.position.y = 0.68;

    const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.45), scarfMat);
    scarfTail.position.set(0.20, 0.64, -0.28);
    scarfTail.rotation.set(-0.35, 0.25, 0);

    torso.add(scarfRing, scarfTail);
    return scarfTail;
  }

  // 1. PINGUIM ALPINO - DESIGNER VINYL COLLECTIBLE TOY
  public static createDetailedPenguin(equipped: EquippedState): THREE.Group {
    const root = new THREE.Group();
    const vinylMat = { roughness: 0.35, metalness: 0.04 };
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, ...vinylMat });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, ...vinylMat });
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.32, metalness: 0.04 });
    const footMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35, metalness: 0.04 });
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eyeIrisMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.20 });
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xfb7185, transparent: true, opacity: 0.55 });

    const torso = new THREE.Group();

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), bodyMat);
    body.scale.set(0.96, 1.04, 0.92);
    body.position.y = 0.44;
    body.castShadow = true;
    torso.add(body);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.25, 20, 20), whiteMat);
    belly.scale.set(0.85, 0.94, 0.55);
    belly.position.set(0, 0.42, 0.14);
    torso.add(belly);

    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 10, 24), whiteMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.68;
    torso.add(collar);

    const head = new THREE.Group();
    head.position.y = 0.96;

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.56, 32, 32), bodyMat);
    headMesh.castShadow = true;
    head.add(headMesh);

    const faceMask = new THREE.Mesh(new THREE.SphereGeometry(0.53, 28, 28), whiteMat);
    faceMask.scale.set(0.88, 0.82, 0.60);
    faceMask.position.set(0, -0.04, 0.26);
    head.add(faceMask);

    const crest = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), bodyMat);
    crest.scale.set(1.1, 1.4, 0.8);
    crest.position.set(0, 0.56, -0.02);
    head.add(crest);

    const beak = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.15, 12, 12), beakMat);
    beak.rotation.x = Math.PI / 2 + 0.08;
    beak.position.set(0, -0.06, 0.54);
    beak.scale.set(1.2, 0.85, 1.0);
    head.add(beak);

    for (const side of [-1, 1]) {
      const eyeBack = new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 18), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      eyeBack.scale.set(0.9, 1.1, 0.35);
      eyeBack.position.set(side * 0.20, 0.08, 0.48);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), eyeIrisMat);
      iris.scale.set(0.9, 1.1, 0.3);
      iris.position.set(side * 0.20, 0.08, 0.51);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 14), eyePupilMat);
      pupil.scale.set(0.9, 1.1, 0.25);
      pupil.position.set(side * 0.20, 0.08, 0.53);

      const glintBig = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), glintMat);
      glintBig.position.set(side * 0.18, 0.125, 0.55);

      const glintSmall = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), glintMat);
      glintSmall.position.set(side * 0.22, 0.05, 0.55);

      const blush = new THREE.Mesh(new THREE.CircleGeometry(0.075, 16), blushMat);
      blush.position.set(side * 0.34, -0.08, 0.44);
      blush.rotation.y = side * 0.45;

      head.add(eyeBack, iris, pupil, glintBig, glintSmall, blush);
    }

    CharacterBuilder.attachEquippedHat(head, equipped.hat);
    CharacterBuilder.attachEquippedGoggles(head, equipped.goggles);
    torso.add(head);
    const scarfTail = CharacterBuilder.attachEquippedScarf(torso, equipped.scarf);

    const createVinylFlipper = (side: number) => {
      const flipperGroup = new THREE.Group();
      const flipper = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.22, 10, 10), bodyMat);
      flipper.scale.set(1.0, 1.0, 0.5);
      flipper.position.y = -0.10;
      flipper.castShadow = true;

      const innerTrim = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.18, 8, 8), whiteMat);
      innerTrim.position.set(-side * 0.01, -0.10, 0.02);
      innerTrim.scale.set(0.95, 0.95, 0.35);

      flipperGroup.add(flipper, innerTrim);
      flipperGroup.position.set(side * 0.30, 0.48, 0.04);
      flipperGroup.rotation.set(-0.12, 0, side * -0.38);
      return flipperGroup;
    };

    const armL = createVinylFlipper(-1);
    const armR = createVinylFlipper(1);

    const handSnowball = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
    );
    handSnowball.position.set(0, -0.22, 0.08);
    handSnowball.visible = false;
    armR.add(handSnowball);

    torso.add(armL, armR);

    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), bodyMat);
    tail.scale.set(1.0, 0.75, 1.1);
    tail.position.set(0, 0.36, -0.28);
    torso.add(tail);

    root.add(torso);

    const createVinylFoot = (posX: number) => {
      const foot = new THREE.Group();
      const footMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.16, 12, 12), footMat);
      footMesh.rotation.x = Math.PI / 2;
      footMesh.position.set(0, 0.045, 0.06);
      footMesh.scale.set(1.15, 0.85, 1.0);
      footMesh.castShadow = true;

      for (let t = -1; t <= 1; t++) {
        const toe = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), footMat);
        toe.scale.set(0.9, 0.7, 1.1);
        toe.position.set(t * 0.055, 0.035, 0.18);
        foot.add(toe);
      }

      foot.add(footMesh);
      foot.position.set(posX, 0.02, 0.02);
      foot.rotation.y = posX < 0 ? -0.15 : 0.15;
      return foot;
    };

    const footL = createVinylFoot(-0.16);
    const footR = createVinylFoot(0.16);
    root.add(footL, footR);

    const rig: CharacterRig = {
      root,
      torso,
      head,
      armL,
      armR,
      footL,
      footR,
      tail,
      scarfTail,
      handSnowball
    };
    root.userData.rig = rig;
    return root;
  }

  // 2. SAPO VERDE - DESIGNER VINYL COLLECTIBLE TOY
  public static createDetailedFrog(equipped: EquippedState): THREE.Group {
    const root = new THREE.Group();
    const vinylMat = { roughness: 0.35, metalness: 0.04 };
    const frogGreenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, ...vinylMat });
    const frogBellyMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, ...vinylMat });
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.55 });
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x14532d });

    const torso = new THREE.Group();

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), frogGreenMat);
    body.scale.set(1.02, 0.98, 0.95);
    body.position.y = 0.42;
    body.castShadow = true;
    torso.add(body);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.25, 20, 20), frogBellyMat);
    belly.position.set(0, 0.40, 0.14);
    belly.scale.set(0.85, 0.85, 0.55);
    torso.add(belly);

    const head = new THREE.Group();
    head.position.y = 0.96;

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.56, 32, 32), frogGreenMat);
    headMesh.castShadow = true;
    head.add(headMesh);

    for (const side of [-1, 1]) {
      const eyeSocket = new THREE.Mesh(new THREE.SphereGeometry(0.22, 22, 22), frogGreenMat);
      eyeSocket.position.set(side * 0.28, 0.38, 0.10);
      head.add(eyeSocket);

      const eyeGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 18), eyeWhiteMat);
      eyeGlobe.position.set(side * 0.28, 0.40, 0.18);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), pupilMat);
      pupil.position.set(side * 0.28, 0.40, 0.31);
      pupil.scale.set(0.95, 1.05, 0.35);

      const glintBig = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), glintMat);
      glintBig.position.set(side * 0.25, 0.44, 0.33);

      const glintSmall = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), glintMat);
      glintSmall.position.set(side * 0.30, 0.36, 0.33);

      head.add(eyeGlobe, pupil, glintBig, glintSmall);

      const blush = new THREE.Mesh(new THREE.CircleGeometry(0.075, 16), blushMat);
      blush.position.set(side * 0.36, -0.06, 0.42);
      blush.rotation.y = side * 0.45;
      head.add(blush);
    }

    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.024, 10, 24, Math.PI * 0.72), mouthMat);
    smile.rotation.set(Math.PI * 0.88, 0, Math.PI * 0.14);
    smile.position.set(0, -0.08, 0.54);
    head.add(smile);

    for (const side of [-1, 1]) {
      const dimple = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), mouthMat);
      dimple.position.set(side * 0.24, -0.05, 0.50);
      head.add(dimple);
    }

    CharacterBuilder.attachEquippedHat(head, equipped.hat);
    CharacterBuilder.attachEquippedGoggles(head, equipped.goggles);
    torso.add(head);
    const scarfTail = CharacterBuilder.attachEquippedScarf(torso, equipped.scarf);

    const createVinylFrogArm = (side: number) => {
      const armGroup = new THREE.Group();
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.20, 10, 10), frogGreenMat);
      arm.position.y = -0.10;
      armGroup.add(arm);

      for (let d = -1; d <= 1; d++) {
        const finger = new THREE.Mesh(new THREE.SphereGeometry(0.030, 8, 8), frogBellyMat);
        finger.position.set(d * 0.04, -0.22, 0.03);
        armGroup.add(finger);
      }

      armGroup.position.set(side * 0.30, 0.46, 0.04);
      armGroup.rotation.set(0.1, 0, side * -0.35);
      return armGroup;
    };

    const armL = createVinylFrogArm(-1);
    const armR = createVinylFrogArm(1);

    const handSnowball = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
    );
    handSnowball.position.set(0, -0.22, 0.08);
    handSnowball.visible = false;
    armR.add(handSnowball);

    torso.add(armL, armR);
    root.add(torso);

    const createVinylFrogFoot = (posX: number) => {
      const foot = new THREE.Group();
      const footMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.16, 12, 12), frogGreenMat);
      footMesh.rotation.x = Math.PI / 2;
      footMesh.position.set(0, 0.04, 0.06);
      footMesh.castShadow = true;
      foot.add(footMesh);

      for (let toe = -1; toe <= 1; toe++) {
        const ballToe = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), frogBellyMat);
        ballToe.position.set(toe * 0.06, 0.035, 0.18);
        foot.add(ballToe);
      }

      foot.position.set(posX, 0.02, 0.02);
      foot.rotation.y = posX < 0 ? -0.18 : 0.18;
      return foot;
    };

    const footL = createVinylFrogFoot(-0.16);
    const footR = createVinylFrogFoot(0.16);
    root.add(footL, footR);

    const rig: CharacterRig = {
      root,
      torso,
      head,
      armL,
      armR,
      footL,
      footR,
      tail: null,
      scarfTail,
      handSnowball
    };
    root.userData.rig = rig;
    return root;
  }

  // 3. GATO SIAMÊS - DESIGNER VINYL COLLECTIBLE TOY
  public static createDetailedCat(equipped: EquippedState): THREE.Group {
    const root = new THREE.Group();
    const vinylMat = { roughness: 0.35, metalness: 0.04 };
    const furCreamMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, ...vinylMat });
    const sealBrownMat = new THREE.MeshStandardMaterial({ color: 0x3b180d, ...vinylMat });
    const innerEarPinkMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, ...vinylMat });
    const sapphireEyeMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.22 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.55 });
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x3b180d });

    const torso = new THREE.Group();

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 24), furCreamMat);
    body.scale.set(0.96, 1.04, 0.94);
    body.position.y = 0.44;
    body.castShadow = true;
    torso.add(body);

    const chestBib = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 20), new THREE.MeshStandardMaterial({ color: 0xffffff, ...vinylMat }));
    chestBib.scale.set(0.85, 0.92, 0.55);
    chestBib.position.set(0, 0.43, 0.14);
    torso.add(chestBib);

    const head = new THREE.Group();
    head.position.y = 0.96;

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.56, 32, 32), furCreamMat);
    headMesh.castShadow = true;
    head.add(headMesh);

    const mask = new THREE.Mesh(new THREE.SphereGeometry(0.44, 26, 26), sealBrownMat);
    mask.scale.set(1.02, 0.82, 0.65);
    mask.position.set(0, -0.04, 0.28);
    head.add(mask);

    for (const side of [-1, 1]) {
      const earGroup = new THREE.Group();
      const earOuter = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.26, 12), sealBrownMat);
      earOuter.position.set(0, 0.13, 0);
      earOuter.scale.set(1.1, 1.0, 0.65);

      const earInner = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.18, 10), innerEarPinkMat);
      earInner.position.set(0, 0.11, 0.04);
      earInner.scale.set(1.0, 0.95, 0.45);

      earGroup.add(earOuter, earInner);
      earGroup.position.set(side * 0.32, 0.44, 0.06);
      earGroup.rotation.set(0.08, 0, -side * 0.35);
      head.add(earGroup);
    }

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), innerEarPinkMat);
    nose.scale.set(1.1, 0.8, 0.6);
    nose.position.set(0, -0.04, 0.55);
    head.add(nose);

    for (const side of [-1, 1]) {
      const lip = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.012, 8, 14, Math.PI * 0.9), mouthMat);
      lip.rotation.set(Math.PI * 0.95, 0, side * 0.2);
      lip.position.set(side * 0.048, -0.10, 0.54);
      head.add(lip);
    }

    for (const side of [-1, 1]) {
      for (let w = -1; w <= 1; w++) {
        const whisker = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.26, 6), whiskerMat);
        whisker.rotation.z = Math.PI / 2 + w * 0.14;
        whisker.rotation.y = side * 0.38;
        whisker.position.set(side * 0.28, -0.07 + w * 0.03, 0.46);
        head.add(whisker);
      }
    }

    for (const side of [-1, 1]) {
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      eyeWhite.scale.set(0.9, 1.1, 0.35);
      eyeWhite.position.set(side * 0.19, 0.08, 0.48);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.088, 14, 14), sapphireEyeMat);
      iris.scale.set(0.9, 1.1, 0.3);
      iris.position.set(side * 0.19, 0.08, 0.51);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 12), pupilMat);
      pupil.scale.set(0.85, 1.15, 0.25);
      pupil.position.set(side * 0.19, 0.08, 0.53);

      const glintBig = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), glintMat);
      glintBig.position.set(side * 0.17, 0.12, 0.55);

      const glintSmall = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), glintMat);
      glintSmall.position.set(side * 0.21, 0.05, 0.55);

      const blush = new THREE.Mesh(new THREE.CircleGeometry(0.075, 16), blushMat);
      blush.position.set(side * 0.35, -0.06, 0.44);
      blush.rotation.y = side * 0.45;

      head.add(eyeWhite, iris, pupil, glintBig, glintSmall, blush);
    }

    CharacterBuilder.attachEquippedHat(head, equipped.hat);
    CharacterBuilder.attachEquippedGoggles(head, equipped.goggles);
    torso.add(head);
    const scarfTail = CharacterBuilder.attachEquippedScarf(torso, equipped.scarf);

    const createVinylCatArm = (side: number) => {
      const pawGroup = new THREE.Group();
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.22, 10, 10), furCreamMat);
      arm.position.y = -0.10;
      arm.castShadow = true;

      const mitt = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), sealBrownMat);
      mitt.position.y = -0.20;

      const bean = new THREE.Mesh(new THREE.SphereGeometry(0.030, 8, 8), innerEarPinkMat);
      bean.position.set(0, -0.21, 0.03);

      pawGroup.add(arm, mitt, bean);
      pawGroup.position.set(side * 0.29, 0.47, 0.04);
      pawGroup.rotation.set(-0.1, 0, side * -0.32);
      return pawGroup;
    };

    const armL = createVinylCatArm(-1);
    const armR = createVinylCatArm(1);

    const handSnowball = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
    );
    handSnowball.position.set(0, -0.22, 0.08);
    handSnowball.visible = false;
    armR.add(handSnowball);

    torso.add(armL, armR);

    const catTail = new THREE.Group();
    const tailBase = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.45, 8), sealBrownMat);
    tailBase.position.set(0, 0.20, -0.12);
    tailBase.rotation.x = -0.7;

    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), sealBrownMat);
    tailTip.position.set(0, 0.38, -0.26);

    catTail.add(tailBase, tailTip);
    catTail.position.set(0, 0.36, -0.24);
    torso.add(catTail);

    root.add(torso);

    const createVinylCatFoot = (posX: number) => {
      const foot = new THREE.Group();
      const footMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.16, 12, 12), sealBrownMat);
      footMesh.rotation.x = Math.PI / 2;
      footMesh.position.set(0, 0.04, 0.06);
      footMesh.castShadow = true;
      foot.add(footMesh);

      const mainPad = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), innerEarPinkMat);
      mainPad.position.set(0, 0.03, 0.14);
      foot.add(mainPad);

      foot.position.set(posX, 0.02, 0.02);
      foot.rotation.y = posX < 0 ? -0.14 : 0.14;
      return foot;
    };

    const footL = createVinylCatFoot(-0.16);
    const footR = createVinylCatFoot(0.16);
    root.add(footL, footR);

    const rig: CharacterRig = {
      root,
      torso,
      head,
      armL,
      armR,
      footL,
      footR,
      tail: catTail,
      scarfTail,
      handSnowball
    };
    root.userData.rig = rig;
    return root;
  }

  // 4. CACHORRO SHIH TZU - DESIGNER VINYL COLLECTIBLE TOY
  public static createDetailedDog(equipped: EquippedState): THREE.Group {
    const root = new THREE.Group();
    const vinylMat = { roughness: 0.35, metalness: 0.04 };
    const caramelMat = new THREE.MeshStandardMaterial({ color: 0xd97706, ...vinylMat });
    const whiteFurMat = new THREE.MeshStandardMaterial({ color: 0xffffff, ...vinylMat });
    const noseBlackMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const tonguePinkMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const ribbonRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, ...vinylMat });
    const bellGoldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.22 });
    const eyeBrownMat = new THREE.MeshStandardMaterial({ color: 0x27170a, roughness: 0.22 });
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.55 });

    const torso = new THREE.Group();

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), caramelMat);
    body.scale.set(0.96, 1.04, 0.94);
    body.position.y = 0.44;
    body.castShadow = true;
    torso.add(body);

    const chestFur = new THREE.Mesh(new THREE.SphereGeometry(0.25, 20, 20), whiteFurMat);
    chestFur.position.set(0, 0.43, 0.14);
    chestFur.scale.set(0.88, 0.94, 0.60);
    torso.add(chestFur);

    const head = new THREE.Group();
    head.position.y = 0.96;

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.56, 32, 32), caramelMat);
    headMesh.castShadow = true;
    head.add(headMesh);

    const topKnot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), caramelMat);
    topKnot.scale.set(0.9, 1.25, 0.9);
    topKnot.position.set(0, 0.54, 0.05);

    const bowCenter = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), bellGoldMat);
    bowCenter.position.set(0, 0.50, 0.16);

    const bowWingL = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.13, 8), ribbonRedMat);
    bowWingL.rotation.z = Math.PI / 2;
    bowWingL.position.set(-0.09, 0.50, 0.16);

    const bowWingR = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.13, 8), ribbonRedMat);
    bowWingR.rotation.z = -Math.PI / 2;
    bowWingR.position.set(0.09, 0.50, 0.16);

    head.add(topKnot, bowCenter, bowWingL, bowWingR);

    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 20), whiteFurMat);
    snout.scale.set(1.10, 0.78, 0.72);
    snout.position.set(0, -0.06, 0.42);
    head.add(snout);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), noseBlackMat);
    nose.scale.set(1.1, 0.9, 0.7);
    nose.position.set(0, -0.02, 0.57);
    head.add(nose);

    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.024, 0.09), tonguePinkMat);
    tongue.position.set(0, -0.11, 0.53);
    tongue.rotation.x = 0.28;
    head.add(tongue);

    for (const side of [-1, 1]) {
      const earGroup = new THREE.Group();
      const earMain = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.48, 12, 12), caramelMat);
      earMain.position.y = -0.20;
      earMain.scale.set(1.15, 1.0, 0.65);

      const earFluff = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.40, 10, 10), whiteFurMat);
      earFluff.position.set(0, -0.18, 0.04);
      earFluff.scale.set(1.0, 0.95, 0.4);

      earGroup.add(earMain, earFluff);
      earGroup.position.set(side * 0.46, 0.16, 0.08);
      earGroup.rotation.set(0.14, 0, side * 0.22);
      head.add(earGroup);

      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      eyeWhite.scale.set(0.9, 1.1, 0.35);
      eyeWhite.position.set(side * 0.19, 0.08, 0.48);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 14), eyeBrownMat);
      eye.scale.set(0.9, 1.1, 0.3);
      eye.position.set(side * 0.19, 0.08, 0.51);

      const glintBig = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), glintMat);
      glintBig.position.set(side * 0.17, 0.12, 0.55);

      const glintSmall = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), glintMat);
      glintSmall.position.set(side * 0.21, 0.05, 0.55);

      const blush = new THREE.Mesh(new THREE.CircleGeometry(0.075, 16), blushMat);
      blush.position.set(side * 0.35, -0.06, 0.44);
      blush.rotation.y = side * 0.45;

      head.add(eyeWhite, eye, glintBig, glintSmall, blush);
    }

    CharacterBuilder.attachEquippedHat(head, equipped.hat);
    CharacterBuilder.attachEquippedGoggles(head, equipped.goggles);
    torso.add(head);
    const scarfTail = CharacterBuilder.attachEquippedScarf(torso, equipped.scarf);

    const createVinylDogArm = (side: number) => {
      const armGroup = new THREE.Group();
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.22, 10, 10), caramelMat);
      arm.position.y = -0.10;
      arm.castShadow = true;

      const pawTip = new THREE.Mesh(new THREE.SphereGeometry(0.072, 10, 10), whiteFurMat);
      pawTip.position.y = -0.20;

      armGroup.add(arm, pawTip);
      armGroup.position.set(side * 0.30, 0.47, 0.04);
      armGroup.rotation.set(-0.1, 0, side * -0.32);
      return armGroup;
    };

    const armL = createVinylDogArm(-1);
    const armR = createVinylDogArm(1);

    const handSnowball = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
    );
    handSnowball.position.set(0, -0.22, 0.08);
    handSnowball.visible = false;
    armR.add(handSnowball);

    torso.add(armL, armR);

    const dogTail = new THREE.Group();
    const tailBase = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.35, 8), caramelMat);
    tailBase.position.set(0, 0.16, -0.10);
    tailBase.rotation.x = -0.6;

    const tailPuff = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), whiteFurMat);
    tailPuff.position.set(0, 0.30, -0.20);

    dogTail.add(tailBase, tailPuff);
    dogTail.position.set(0, 0.36, -0.24);
    torso.add(dogTail);

    root.add(torso);

    const createVinylDogFoot = (posX: number) => {
      const foot = new THREE.Group();
      const footMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.16, 12, 12), caramelMat);
      footMesh.rotation.x = Math.PI / 2;
      footMesh.position.set(0, 0.04, 0.06);
      footMesh.castShadow = true;
      foot.add(footMesh);

      const toePuff = new THREE.Mesh(new THREE.SphereGeometry(0.040, 8, 8), whiteFurMat);
      toePuff.position.set(0, 0.035, 0.16);
      foot.add(toePuff);

      foot.position.set(posX, 0.02, 0.02);
      foot.rotation.y = posX < 0 ? -0.14 : 0.14;
      return foot;
    };

    const footL = createVinylDogFoot(-0.16);
    const footR = createVinylDogFoot(0.16);
    root.add(footL, footR);

    const rig: CharacterRig = {
      root,
      torso,
      head,
      armL,
      armR,
      footL,
      footR,
      tail: dogTail,
      scarfTail,
      handSnowball
    };
    root.userData.rig = rig;
    return root;
  }

  public static createCharacter(characterId: CharacterId, equipped: EquippedState): THREE.Group {
    switch (characterId) {
      case 'frog':
        return CharacterBuilder.createDetailedFrog(equipped);
      case 'cat':
        return CharacterBuilder.createDetailedCat(equipped);
      case 'dog':
        return CharacterBuilder.createDetailedDog(equipped);
      case 'penguin':
      default:
        return CharacterBuilder.createDetailedPenguin(equipped);
    }
  }
}
