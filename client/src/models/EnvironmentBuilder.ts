import * as THREE from 'three';
import { BenchSpot, HubCollider } from '../types/game.types';
import { CharacterBuilder } from './CharacterBuilder';

export class EnvironmentBuilder {
  // Geometria Procedural de Muretas com Bordas Arredondadas (Estilo Bunkers de Neve Esculpidos)
  public static createRoundedWallGeometry(w: number, h: number, d: number, radius = 0.32): THREE.BufferGeometry {
    const r = Math.min(radius, Math.min(w * 0.35, d * 0.35, h * 0.35));
    const hw = (w * 0.5) - r;
    const hd = (d * 0.5) - r;
    const shape = new THREE.Shape();
    shape.moveTo(-hw, -hd - r);
    shape.lineTo(hw, -hd - r);
    shape.quadraticCurveTo(hw + r, -hd - r, hw + r, -hd);
    shape.lineTo(hw + r, hd);
    shape.quadraticCurveTo(hw + r, hd + r, hw, hd + r);
    shape.lineTo(-hw, hd + r);
    shape.quadraticCurveTo(-hw - r, hd + r, -hw - r, hd);
    shape.lineTo(-hw, -hd);
    shape.quadraticCurveTo(-hw - r, -hd - r, -hw, -hd - r);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.15, h - r * 1.4),
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: r * 0.5,
      bevelThickness: r * 0.7
    });
    geo.rotateX(-Math.PI / 2);
    geo.center();
    return geo;
  }

  public static createTextSignboard(
    x: number,
    z: number,
    rotY: number,
    title: string,
    subtitle: string,
    accentHex: string = '#38bdf8',
    outColliders?: HubCollider[]
  ): THREE.Group {
    const group = new THREE.Group();

    // Postes de madeira rústica
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 });
    const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.4, 8), woodMat);
    post1.position.set(-2.0, 1.7, 0);
    post1.castShadow = true;
    const post2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.4, 8), woodMat);
    post2.position.set(2.0, 1.7, 0);
    post2.castShadow = true;
    group.add(post1, post2);

    // Prancha de madeira base
    const boardBack = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.8, 0.22), woodMat);
    boardBack.position.set(0, 2.4, 0);
    boardBack.castShadow = true;
    group.add(boardBack);

    // Neve acumulada no topo da placa
    const snowCap = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.26, 0.28), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 }));
    snowCap.position.set(0, 3.35, 0);
    group.add(snowCap);

    // Canvas com arte e texto em alta resolução
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 210;
    const ctx = canvas.getContext('2d')!;

    // Fundo ardósia escuro com bordas decoradas
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 512, 210);

    ctx.lineWidth = 10;
    ctx.strokeStyle = accentHex;
    ctx.strokeRect(6, 6, 500, 198);

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(15, 15, 482, 180);

    // Título Principal em Destaque
    ctx.textAlign = 'center';
    ctx.fillStyle = accentHex;
    ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.fillText(title, 256, 80);

    // Subtítulo Explicativo
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 23px "Segoe UI", sans-serif';
    ctx.fillText(subtitle, 256, 142);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const faceMat = new THREE.MeshBasicMaterial({ map: texture });

    // Frente da placa
    const faceFront = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 1.7), faceMat);
    faceFront.position.set(0, 2.4, 0.12);
    group.add(faceFront);

    // Verso da placa
    const faceBack = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 1.7), faceMat);
    faceBack.position.set(0, 2.4, -0.12);
    faceBack.rotation.y = Math.PI;
    group.add(faceBack);

    group.position.set(x, 0, z);
    group.rotation.y = rotY;

    if (outColliders) {
      outColliders.push({
        type: 'box',
        x,
        z,
        hw: 2.3,
        hd: 0.35,
        angle: rotY
      });
    }

    return group;
  }

  public static createWoodenParkBench(
    x: number,
    z: number,
    rotY: number,
    outBenches?: BenchSpot[],
    outColliders?: HubCollider[]
  ): THREE.Group {
    const bench = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });

    for (const side of [-1.2, 1.2]) {
      const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.65, 0.8), ironMat);
      leg1.position.set(side, 0.325, 0);
      const armrest = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), ironMat);
      armrest.rotation.x = Math.PI / 2;
      armrest.position.set(side, 0.75, 0);
      const backPost = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), ironMat);
      backPost.position.set(side, 0.8, -0.38);
      backPost.rotation.x = -0.15;
      bench.add(leg1, armrest, backPost);
    }

    for (let i = 0; i < 4; i++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.06, 0.16), woodMat);
      slat.position.set(0, 0.65, -0.25 + i * 0.18);
      slat.castShadow = true;
      bench.add(slat);
    }

    for (let i = 0; i < 3; i++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.18, 0.05), woodMat);
      slat.position.set(0, 0.95 + i * 0.22, -0.38);
      slat.rotation.x = -0.15;
      slat.castShadow = true;
      bench.add(slat);
    }

    bench.position.set(x, 0, z);
    bench.rotation.y = rotY;

    if (outBenches) {
      outBenches.push({ x, z, rotY });
    }

    if (outColliders) {
      outColliders.push({
        type: 'box',
        x,
        z,
        hw: 1.45,
        hd: 0.55,
        angle: rotY
      });
    }

    return bench;
  }

  public static createMerchantRalph(): THREE.Group {
    const defaultEquipped = { vehicle: 'sled_wood', hat: 'hat_red', scarf: 'scarf_green', goggles: 'goggles_none' };
    const ralph = CharacterBuilder.createDetailedPenguin(defaultEquipped);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.6), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    cap.position.set(0, 1.5, 0.1);
    ralph.add(cap);
    return ralph;
  }

  public static createMerchantBabette(): THREE.Group {
    const defaultEquipped = { vehicle: 'sled_wood', hat: 'hat_red', scarf: 'scarf_green', goggles: 'goggles_none' };
    const babette = CharacterBuilder.createDetailedCat(defaultEquipped);
    const bow = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({ color: 0xec4899 }));
    bow.position.set(0.2, 1.5, 0.1);
    babette.add(bow);
    return babette;
  }

  public static createMerchantBoris(): THREE.Group {
    const defaultEquipped = { vehicle: 'sled_wood', hat: 'hat_red', scarf: 'scarf_green', goggles: 'goggles_none' };
    const boris = CharacterBuilder.createDetailedDog(defaultEquipped);
    const tape = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.05, 6, 16), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
    tape.rotation.x = Math.PI / 3;
    tape.position.y = 0.8;
    boris.add(tape);
    return boris;
  }

  public static createWalkInLodge(
    centerX: number,
    centerZ: number,
    width: number,
    depth: number,
    wallColor: number,
    roofColor: number,
    _signText: string,
    shopType: 'garage' | 'hats' | 'atelier' | 'tavern',
    rotY: number = 0,
    outColliders?: HubCollider[],
    outMerchants?: { ralph?: THREE.Group; babette?: THREE.Group; boris?: THREE.Group }
  ): THREE.Group {
    const lodge = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.8 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.75 });
    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.6 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.95 });
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x3b1c06, roughness: 0.7 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.25 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.6, roughness: 0.1, transparent: true, opacity: 0.6 });

    const wallThickness = 0.8;
    const wallHeight = 8.5;
    const doorWidth = 6.4;
    const doorHeight = 5.5;

    const floor = new THREE.Mesh(new THREE.BoxGeometry(width - 0.2, 0.35, depth - 0.2), floorMat);
    floor.position.set(0, 0.175, 0);
    floor.receiveShadow = true;
    lodge.add(floor);

    const porch = new THREE.Mesh(new THREE.BoxGeometry(doorWidth + 2.0, 0.3, 2.8), floorMat);
    porch.position.set(0, 0.15, depth * 0.5 + 1.4);
    porch.receiveShadow = true;
    lodge.add(porch);

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, wallHeight, wallThickness), woodMat);
    backWall.position.set(0, wallHeight * 0.5, -depth * 0.5 + wallThickness * 0.5);
    backWall.castShadow = true;
    lodge.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, depth), woodMat);
    leftWall.position.set(-width * 0.5 + wallThickness * 0.5, wallHeight * 0.5, 0);
    leftWall.castShadow = true;
    lodge.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, depth), woodMat);
    rightWall.position.set(width * 0.5 - wallThickness * 0.5, wallHeight * 0.5, 0);
    rightWall.castShadow = true;
    lodge.add(rightWall);

    const frontSegmentWidth = (width - doorWidth) * 0.5;
    const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(frontSegmentWidth, wallHeight, wallThickness), woodMat);
    frontLeft.position.set(-doorWidth * 0.5 - frontSegmentWidth * 0.5, wallHeight * 0.5, depth * 0.5 - wallThickness * 0.5);
    frontLeft.castShadow = true;

    const frontRight = new THREE.Mesh(new THREE.BoxGeometry(frontSegmentWidth, wallHeight, wallThickness), woodMat);
    frontRight.position.set(doorWidth * 0.5 + frontSegmentWidth * 0.5, wallHeight * 0.5, depth * 0.5 - wallThickness * 0.5);
    frontRight.castShadow = true;

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, wallHeight - doorHeight, wallThickness), woodMat);
    lintel.position.set(0, wallHeight - (wallHeight - doorHeight) * 0.5, depth * 0.5 - wallThickness * 0.5);
    lodge.add(frontLeft, frontRight, lintel);

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(doorWidth + 1.2, 0.35, 2.6), roofMat);
    canopy.position.set(0, doorHeight + 0.3, depth * 0.5 + 1.1);
    canopy.rotation.x = 0.18;
    const canopySnow = new THREE.Mesh(new THREE.BoxGeometry(doorWidth + 1.4, 0.25, 2.8), snowMat);
    canopySnow.position.set(0, doorHeight + 0.55, depth * 0.5 + 1.1);
    canopySnow.rotation.x = 0.18;
    lodge.add(canopy, canopySnow);

    const facadeBoard = new THREE.Mesh(new THREE.BoxGeometry(doorWidth - 1.2, 1.1, 0.18), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 }));
    facadeBoard.position.set(0, doorHeight + 1.4, depth * 0.5 + 0.12);
    const facadeBoardTrim = new THREE.Mesh(new THREE.BoxGeometry(doorWidth - 1.0, 1.25, 0.12), goldMat);
    facadeBoardTrim.position.set(0, doorHeight + 1.4, depth * 0.5 + 0.08);
    lodge.add(facadeBoard, facadeBoardTrim);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, depth) * 0.82, 6.4, 4), roofMat);
    roof.position.y = wallHeight + 3.1;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;

    const snowCap = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, depth) * 0.86, 2.0, 4), snowMat);
    snowCap.position.y = wallHeight + 4.1;
    snowCap.rotation.y = Math.PI / 4;
    lodge.add(roof, snowCap);

    const chandelierLight = new THREE.PointLight(0xfef08a, 2.2, 26);
    chandelierLight.position.set(0, 6.8, 0);
    lodge.add(chandelierLight);

    if (shopType !== 'tavern') {
      const counter = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.35, 1.2), counterMat);
      counter.position.set(0, 0.675, -2.5);
      counter.castShadow = true;
      const counterTrim = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.15, 1.3), goldMat);
      counterTrim.position.set(0, 1.35, -2.5);
      lodge.add(counter, counterTrim);

      const counterWarmLight = new THREE.PointLight(0xfef08a, 1.6, 14);
      counterWarmLight.position.set(0, 3.8, -2.5);
      lodge.add(counterWarmLight);
    }

    if (shopType === 'garage') {
      const runnerMat = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.04, depth - 4.0), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 }));
      runnerMat.position.set(0, 0.20, 1.0);
      lodge.add(runnerMat);

      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 4.4), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }));
      bench.position.set(-width * 0.5 + 1.2, 0.6, 0.5);
      const vise = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.45), ironMat);
      vise.position.set(-width * 0.5 + 1.8, 1.35, 1.8);
      const blueprint = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 1.2), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
      blueprint.position.set(-width * 0.5 + 1.3, 1.23, 0.2);
      blueprint.rotation.y = 0.2;
      const workLantern = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.45, 8), goldMat);
      workLantern.position.set(-width * 0.5 + 1.2, 1.45, -1.0);
      lodge.add(bench, vise, blueprint, workLantern);

      const pegboard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 4.2), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 }));
      pegboard.position.set(-width * 0.5 + 0.48, 3.4, 0.5);
      lodge.add(pegboard);

      const boardColors = [0x06b6d4, 0xf97316, 0xa855f7, 0xfacc15];
      for (let i = 0; i < 4; i++) {
        const sb = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 0.5), new THREE.MeshStandardMaterial({ color: boardColors[i], metalness: 0.5, roughness: 0.2 }));
        sb.position.set(width * 0.5 - 0.55, 2.8, -3.0 + i * 2.2);
        sb.rotation.z = 0.18;
        sb.rotation.x = -0.15 + i * 0.1;
        lodge.add(sb);
      }

      for (const [bx, bz, bColor] of [[width * 0.5 - 1.8, 4.5, 0xd97706], [width * 0.5 - 2.8, 5.0, 0x475569]]) {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.2, 12), new THREE.MeshStandardMaterial({ color: bColor, metalness: 0.6, roughness: 0.4 }));
        barrel.position.set(bx, 0.6, bz);
        lodge.add(barrel);
      }
      for (const [cx, cz, cy, sz] of [[-width * 0.5 + 1.8, 4.2, 0.45, 0.9], [-width * 0.5 + 2.8, 4.5, 0.4, 0.8], [-width * 0.5 + 2.0, 4.2, 1.2, 0.7]]) {
        const crate = new THREE.Mesh(new THREE.BoxGeometry(sz, sz, sz), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 }));
        crate.position.set(cx, cy, cz);
        lodge.add(crate);
      }

      const ralph = EnvironmentBuilder.createMerchantRalph();
      ralph.position.set(0, 0.175, -4.5);
      lodge.add(ralph);
      if (outMerchants) outMerchants.ralph = ralph;

    } else if (shopType === 'hats') {
      const redCarpet = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.05, depth - 2.5), new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 }));
      redCarpet.position.set(0, 0.20, 1.0);
      const goldTrimL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, depth - 2.5), goldMat);
      goldTrimL.position.set(-2.0, 0.21, 1.0);
      const goldTrimR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, depth - 2.5), goldMat);
      goldTrimR.position.set(2.0, 0.21, 1.0);
      lodge.add(redCarpet, goldTrimL, goldTrimR);

      const ped1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.4, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
      ped1.position.set(-4.5, 0.7, 0.5);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.4, 8), goldMat);
      crown.position.set(-4.5, 1.6, 0.5);
      lodge.add(ped1, crown);

      const ped2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.4, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
      ped2.position.set(-4.5, 0.7, 3.8);
      const topHat = new THREE.Group();
      const thBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.06, 16), ironMat);
      const thCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.55, 16), ironMat);
      thCrown.position.y = 0.28;
      topHat.add(thBrim, thCrown);
      topHat.position.set(-4.5, 1.5, 3.8);
      lodge.add(ped2, topHat);

      const ped3 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.4, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
      ped3.position.set(4.5, 0.7, 3.8);
      const beanie = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
      beanie.position.set(4.5, 1.6, 3.8);
      lodge.add(ped3, beanie);

      const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.8, 3.4), new THREE.MeshStandardMaterial({ color: 0x4c0519, roughness: 0.7 }));
      wardrobe.position.set(width * 0.5 - 1.2, 1.9, 0.5);
      lodge.add(wardrobe);

      const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.6, 1.8), goldMat);
      mirrorFrame.position.set(-width * 0.5 + 0.48, 2.5, -2.5);
      const mirrorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.2, 1.4), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.05 }));
      mirrorGlass.position.set(-width * 0.5 + 0.48, 2.5, -2.5);
      lodge.add(mirrorFrame, mirrorGlass);

      const babette = EnvironmentBuilder.createMerchantBabette();
      babette.position.set(0, 0.175, -4.5);
      lodge.add(babette);
      if (outMerchants) outMerchants.babette = babette;

    } else if (shopType === 'atelier') {
      const woolRug = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.04, 6.0), new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.85 }));
      woolRug.position.set(0, 0.20, 1.5);
      lodge.add(woolRug);

      const tailorTable = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.25, 4.0), new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.75 }));
      tailorTable.position.set(-width * 0.5 + 1.2, 0.625, 1.5);
      const fabricRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.4, 12), new THREE.MeshStandardMaterial({ color: 0x059669 }));
      fabricRoll.rotation.z = Math.PI / 2;
      fabricRoll.position.set(-width * 0.5 + 1.2, 1.35, 1.0);
      const shears = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.5), goldMat);
      shears.position.set(-width * 0.5 + 1.2, 1.28, 2.4);
      shears.rotation.y = 0.6;
      lodge.add(tailorTable, fabricRoll, shears);

      const woolColors = [0xdc2626, 0x2563eb, 0xfacc15, 0xa855f7, 0x10b981];
      for (let s = 0; s < 3; s++) {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 3.6), woodMat);
        shelf.position.set(-width * 0.5 + 0.65, 2.2 + s * 1.1, -2.5);
        lodge.add(shelf);
        for (let w = 0; w < 4; w++) {
          const yarnBall = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), new THREE.MeshStandardMaterial({ color: woolColors[(s * 2 + w) % woolColors.length], roughness: 0.9 }));
          yarnBall.position.set(-width * 0.5 + 0.65, 2.5 + s * 1.1, -3.8 + w * 0.9);
          lodge.add(yarnBall);
        }
      }

      for (const vz of [0.5, 3.8]) {
        const caseBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 2.0), woodMat);
        caseBase.position.set(width * 0.5 - 1.2, 0.45, vz);
        const glassTop = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 1.9), glassMat);
        glassTop.position.set(width * 0.5 - 1.2, 1.3, vz);
        const goggle = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.08, 8, 16), new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1 }));
        goggle.position.set(width * 0.5 - 1.2, 1.25, vz);
        goggle.rotation.x = Math.PI / 2;
        lodge.add(caseBase, glassTop, goggle);
      }

      const stove = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 1.4, 10), ironMat);
      stove.position.set(width * 0.5 - 1.6, 0.7, -4.2);
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, wallHeight - 1.4, 8), ironMat);
      pipe.position.set(width * 0.5 - 1.6, 0.7 + (wallHeight - 1.4) * 0.5, -4.2);
      const stoveGlow = new THREE.PointLight(0xf97316, 2.0, 8);
      stoveGlow.position.set(width * 0.5 - 1.6, 0.8, -3.8);
      lodge.add(stove, pipe, stoveGlow);

      const boris = EnvironmentBuilder.createMerchantBoris();
      boris.position.set(0, 0.175, -4.5);
      lodge.add(boris);
      if (outMerchants) outMerchants.boris = boris;

    } else if (shopType === 'tavern') {
      const tavernRug = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.04, 8.0), new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 }));
      tavernRug.position.set(0, 0.20, 1.0);
      lodge.add(tavernRug);

      const fireplace = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4.8, 4.6), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95 }));
      fireplace.position.set(width * 0.5 - 1.4, 2.4, 0);
      const hearthOpening = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 2.6), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
      hearthOpening.position.set(width * 0.5 - 1.5, 1.2, 0);
      const logs = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 2.0, 6), new THREE.MeshStandardMaterial({ color: 0x451a03 }));
      logs.rotation.z = Math.PI / 2;
      logs.position.set(width * 0.5 - 1.3, 0.4, 0);
      const fireGlow = new THREE.PointLight(0xf97316, 3.5, 20);
      fireGlow.position.set(width * 0.5 - 2.0, 1.5, 0);
      lodge.add(fireplace, hearthOpening, logs, fireGlow);

      const boardW = 9.2;
      const boardH = 4.2;
      const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(boardW + 0.4, boardH + 0.4, 0.18), goldMat);
      boardFrame.position.set(0, 4.5, -depth * 0.5 + 0.35);

      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#1e1b18';
      ctx.fillRect(0, 0, 1024, 512);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 14;
      ctx.strokeRect(10, 10, 1004, 492);
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 38px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 TAVERNA DOS CAMPEÕES - HALL DA FAMA 🏆', 512, 70);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 26px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🏔️ DESCIDA DA MONTANHA:  0:42.15 (PIP)', 80, 160);
      ctx.fillText('🎯 TIRO AO ALVO FESTIVO: 1,450 PTS (MIMI)', 80, 230);
      ctx.fillText('❄️ ARENA GUERRA DE NEVE:  8 K.O.s (BORIS)', 80, 300);
      ctx.fillText('✨ CAMPEÃO VIGENTE:       VILAREJO UNIDO', 80, 370);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'italic 22px "Segoe UI", sans-serif';
      ctx.fillText('Pressione [E] ou aproxime-se para registrar novos recordes!', 80, 440);

      const recordTex = new THREE.CanvasTexture(canvas);
      const recordBoardMesh = new THREE.Mesh(new THREE.PlaneGeometry(boardW, boardH), new THREE.MeshBasicMaterial({ map: recordTex }));
      recordBoardMesh.position.set(0, 4.5, -depth * 0.5 + 0.46);
      lodge.add(boardFrame, recordBoardMesh);

      for (const side of [-1, 1]) {
        const cabinet = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4.2, 0.9), new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 }));
        cabinet.position.set(side * 6.8, 2.1, -depth * 0.5 + 0.8);
        const glass = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.8, 0.1), glassMat);
        glass.position.set(side * 6.8, 2.1, -depth * 0.5 + 1.28);
        const trophy = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.15, 0.9, 12), goldMat);
        trophy.position.set(side * 6.8, 2.2, -depth * 0.5 + 0.8);
        lodge.add(cabinet, glass, trophy);
      }

      for (const [tx, tz] of [[-4.2, 1.8], [-4.2, -2.4]]) {
        const table = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.14, 16), woodMat);
        table.position.set(tx, 1.15, tz);
        const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.1, 8), woodMat);
        tableLeg.position.set(tx, 0.55, tz);
        const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.35, 8), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
        mug.position.set(tx + 0.2, 1.35, tz + 0.1);
        lodge.add(table, tableLeg, mug);

        for (let a = 0; a < 3; a++) {
          const ang = (a / 3) * Math.PI * 2;
          const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.7, 10), woodMat);
          stool.position.set(tx + Math.cos(ang) * 1.8, 0.35, tz + Math.sin(ang) * 1.8);
          lodge.add(stool);
        }
      }
    }

    lodge.position.set(centerX, 0, centerZ);
    lodge.rotation.y = rotY;

    if (outColliders) {
      const addRotatedCollider = (localX: number, localZ: number, hw: number, hd: number) => {
        const cosA = Math.cos(rotY);
        const sinA = Math.sin(rotY);
        const worldX = centerX + (localX * cosA + localZ * sinA);
        const worldZ = centerZ + (-localX * sinA + localZ * cosA);
        outColliders.push({
          type: 'box',
          x: worldX,
          z: worldZ,
          hw,
          hd,
          angle: rotY
        });
      };

      addRotatedCollider(0, -depth * 0.5 + wallThickness * 0.5, width * 0.5, wallThickness * 0.5);
      addRotatedCollider(-width * 0.5 + wallThickness * 0.5, 0, wallThickness * 0.5, depth * 0.5);
      addRotatedCollider(width * 0.5 - wallThickness * 0.5, 0, wallThickness * 0.5, depth * 0.5);
      addRotatedCollider(-doorWidth * 0.5 - frontSegmentWidth * 0.5, depth * 0.5 - wallThickness * 0.5, frontSegmentWidth * 0.5, wallThickness * 0.5);
      addRotatedCollider(doorWidth * 0.5 + frontSegmentWidth * 0.5, depth * 0.5 - wallThickness * 0.5, frontSegmentWidth * 0.5, wallThickness * 0.5);

      if (shopType !== 'tavern') {
        addRotatedCollider(0, -2.5, 3.1, 0.6);
      } else {
        addRotatedCollider(width * 0.5 - 1.4, 0, 1.2, 2.4);
        const cosA = Math.cos(rotY);
        const sinA = Math.sin(rotY);
        for (const [tx, tz] of [[-4.2, 1.8], [-4.2, -2.4]]) {
          const wx = centerX + (tx * cosA + tz * sinA);
          const wz = centerZ + (-tx * sinA + tz * cosA);
          outColliders.push({ type: 'circle', x: wx, z: wz, r: 1.4 });
        }
      }
    }

    return lodge;
  }

  public static createPhoneBooth(x: number, z: number, outColliders?: HubCollider[]): THREE.Group {
    const booth = new THREE.Group();
    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.45, roughness: 0.1 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 });

    const width = 1.8;
    const depth = 1.8;
    const height = 4.2;

    const base = new THREE.Mesh(new THREE.BoxGeometry(width, 0.25, depth), redMat);
    base.position.y = 0.125;
    booth.add(base);

    for (const px of [-width * 0.45, width * 0.45]) {
      for (const pz of [-depth * 0.45, depth * 0.45]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.16, height, 0.16), redMat);
        pillar.position.set(px, height * 0.5, pz);
        booth.add(pillar);
      }
    }

    const glassBack = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.8, height * 0.72), glassMat);
    glassBack.position.set(0, height * 0.5, -depth * 0.46);
    const glassLeft = new THREE.Mesh(new THREE.PlaneGeometry(depth * 0.8, height * 0.72), glassMat);
    glassLeft.position.set(-width * 0.46, height * 0.5, 0);
    glassLeft.rotation.y = Math.PI / 2;
    const glassRight = new THREE.Mesh(new THREE.PlaneGeometry(depth * 0.8, height * 0.72), glassMat);
    glassRight.position.set(width * 0.46, height * 0.5, 0);
    glassRight.rotation.y = -Math.PI / 2;

    booth.add(glassBack, glassLeft, glassRight);

    const dome = new THREE.Mesh(new THREE.SphereGeometry(width * 0.65, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), roofMat);
    dome.position.y = height;
    booth.add(dome);

    const sign = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.35, depth * 0.9), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    sign.position.y = height + 0.15;
    booth.add(sign);

    const phoneBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.2), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    phoneBox.position.set(0, 2.2, -depth * 0.4);
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12), goldMat);
    dial.rotation.x = Math.PI / 2;
    dial.position.set(0, 2.25, -depth * 0.4 + 0.12);
    const handset = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.42, 8), goldMat);
    handset.position.set(-0.25, 2.2, -depth * 0.4 + 0.1);
    booth.add(phoneBox, dial, handset);

    const light = new THREE.PointLight(0xfef08a, 1.8, 6.0);
    light.position.set(0, height - 0.4, 0);
    booth.add(light);

    booth.position.set(x, 0, z);

    if (outColliders) {
      outColliders.push({
        type: 'box',
        x,
        z,
        hw: width * 0.55,
        hd: depth * 0.55,
        angle: 0
      });
    }

    return booth;
  }

  public static createCarnivalBooth(x: number, z: number, rotY: number = 0): THREE.Group {
    const booth = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 });
    const redCanvasMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 });
    const whiteCanvasMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });

    const floor = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.45, 7.5), woodMat);
    floor.position.y = 0.225;
    floor.receiveShadow = true;
    booth.add(floor);

    const counter = new THREE.Mesh(new THREE.BoxGeometry(11.0, 1.35, 1.0), woodMat);
    counter.position.set(0, 0.95, -2.8);
    counter.castShadow = true;
    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.15, 1.2), goldMat);
    counterTop.position.set(0, 1.65, -2.8);
    booth.add(counter, counterTop);

    for (const rx of [-3.6, -1.8, 0, 1.8, 3.6]) {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.65), woodMat);
      rack.position.set(rx, 1.8, -2.8);
      const rifleBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), goldMat);
      rifleBarrel.rotation.x = Math.PI / 2;
      rifleBarrel.position.set(rx, 1.95, -2.7);
      booth.add(rack, rifleBarrel);
    }

    for (const [px, pz] of [[-5.5, -3.2], [0, -3.2], [5.5, -3.2], [-5.5, 3.2], [0, 3.2], [5.5, 3.2]]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 5.2, 8), woodMat);
      post.position.set(px, 2.8, pz);
      post.castShadow = true;
      booth.add(post);
    }

    const stripeCount = 14;
    const stripeWidth = 12.6 / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      const isRed = i % 2 === 0;
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(stripeWidth, 0.28, 8.0),
        isRed ? redCanvasMat : whiteCanvasMat
      );
      stripe.position.set(-6.3 + stripeWidth * (i + 0.5), 5.4, 0);
      stripe.rotation.x = 0.12;
      stripe.castShadow = true;
      booth.add(stripe);
    }

    for (let i = 0; i < stripeCount; i++) {
      const fringe = new THREE.Mesh(
        new THREE.ConeGeometry(0.48, 0.7, 4),
        (i % 2 === 0) ? redCanvasMat : whiteCanvasMat
      );
      fringe.rotation.x = Math.PI;
      fringe.position.set(-6.3 + stripeWidth * (i + 0.5), 4.9, -3.95);
      booth.add(fringe);
    }

    for (let s = 1; s <= 3; s++) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.15, 0.7), woodMat);
      shelf.position.set(0, 1.2 + s * 1.0, 3.0);
      booth.add(shelf);

      for (let d = -4.2; d <= 4.2; d += 1.8) {
        const duckDeco = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), goldMat);
        duckDeco.position.set(d, 1.5 + s * 1.0, 3.0);
        booth.add(duckDeco);
      }
    }

    const light = new THREE.PointLight(0xf59e0b, 2.5, 18);
    light.position.set(0, 4.5, 0);
    booth.add(light);

    booth.position.set(x, 0, z);
    booth.rotation.y = rotY;
    return booth;
  }

  public static createSnowballWarPortal(x: number, z: number, rotY: number = 0): THREE.Group {
    const portal = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const iceMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.85 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.95 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });

    for (const side of [-1, 1]) {
      const pilar = new THREE.Mesh(new THREE.BoxGeometry(2.6, 9.0, 2.6), stoneMat);
      pilar.position.set(side * 4.6, 4.5, 0);
      pilar.castShadow = true;

      const iceCap = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.8, 6), iceMat);
      iceCap.position.set(side * 4.6, 10.4, 0);

      const torchHolder = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.0, 6), woodMat);
      torchHolder.position.set(side * 3.2, 4.5, 1.4);
      torchHolder.rotation.x = 0.4;
      const torchFlame = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      torchFlame.position.set(side * 3.2, 5.1, 1.7);

      const torchLight = new THREE.PointLight(0x38bdf8, 2.2, 14);
      torchLight.position.copy(torchFlame.position);

      portal.add(pilar, iceCap, torchHolder, torchFlame, torchLight);
    }

    const arch = new THREE.Mesh(new THREE.BoxGeometry(11.8, 1.6, 2.8), stoneMat);
    arch.position.set(0, 8.4, 0);

    const archIce = new THREE.Mesh(new THREE.BoxGeometry(11.0, 1.0, 3.0), iceMat);
    archIce.position.set(0, 9.4, 0);

    const snowCap = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.8, 3.2), snowMat);
    snowCap.position.set(0, 10.1, 0);

    for (const side of [-1, 1]) {
      const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 4.0), new THREE.MeshStandardMaterial({ color: 0x0284c7, side: THREE.DoubleSide }));
      banner.position.set(side * 4.6, 4.5, 1.35);
      portal.add(banner);
    }

    portal.add(arch, archIce, snowCap);
    portal.position.set(x, 0, z);
    portal.rotation.y = rotY;
    return portal;
  }

  public static createCableCarBaseStation(stationPos: THREE.Vector3, outGondolaHolder?: { gondola?: THREE.Group }): THREE.Group {
    const station = new THREE.Group();
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x5c3317, roughness: 0.8 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const cableMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });

    const deck = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 12), timberMat);
    deck.position.y = 0.6;
    deck.receiveShadow = true;
    station.add(deck);

    for (const [px, pz] of [[-7, -5], [-7, 5], [7, -5], [7, 5]]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 7, 8), timberMat);
      post.position.set(px, 4.1, pz);
      post.castShadow = true;
      station.add(post);
    }

    const roof = new THREE.Mesh(new THREE.ConeGeometry(13, 4.5, 4), new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 }));
    roof.position.y = 9.2;
    roof.rotation.y = Math.PI / 4;
    const roofSnow = new THREE.Mesh(new THREE.ConeGeometry(13.2, 1.2, 4), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 }));
    roofSnow.position.y = 9.8;
    roofSnow.rotation.y = Math.PI / 4;
    station.add(roof, roofSnow);

    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 14, 8), metalMat);
    pylon.position.set(0, 7.6, -1);
    const pylonArm = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 0.6), metalMat);
    pylonArm.position.set(0, 14.2, -1);
    station.add(pylon, pylonArm);

    for (const cx of [-2.4, 2.4]) {
      const cablePoints = [
        new THREE.Vector3(cx, 14.2, -1),
        new THREE.Vector3(cx * 1.5, 95, -280)
      ];
      const cableCurve = new THREE.CatmullRomCurve3(cablePoints);
      const cableGeo = new THREE.TubeGeometry(cableCurve, 20, 0.05, 6, false);
      const cableMesh = new THREE.Mesh(cableGeo, cableMat);
      station.add(cableMesh);
    }

    const gondolaMesh = new THREE.Group();
    const gondolaBody = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 4.6), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }));
    gondolaBody.position.y = 3.6;
    gondolaBody.castShadow = true;

    const windowMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0.85 });
    const winF = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.4), windowMat);
    winF.position.set(0, 3.8, 2.32);
    const winB = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.4), windowMat);
    winB.position.set(0, 3.8, -2.32);
    winB.rotation.y = Math.PI;

    const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5.2, 6), metalMat);
    hanger.position.set(0, 7.8, 0);
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.8), metalMat);
    clamp.position.set(0, 10.4, 0);

    gondolaMesh.add(gondolaBody, winF, winB, hanger, clamp);
    gondolaMesh.position.set(2.4, 3.8, -1);
    station.add(gondolaMesh);

    if (outGondolaHolder) {
      outGondolaHolder.gondola = gondolaMesh;
    }

    station.position.copy(stationPos);
    return station;
  }

  public static createBonfire(outBonfireHolder?: {
    bonfireLight?: THREE.PointLight;
    bonfireEmbers?: THREE.Points;
    bonfireEmberData?: { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number }[];
  }): THREE.Group {
    const group = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });

    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 1), stoneMat);
      stone.position.set(Math.cos(ang) * 1.8, 0.25, Math.sin(ang) * 1.8);
      group.add(stone);
    }

    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI;
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 2.2, 6), woodMat);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = ang;
      log.position.y = 0.35;
      group.add(log);
    }

    const bonfireLight = new THREE.PointLight(0xf97316, 2.8, 26);
    bonfireLight.position.set(0, 1.2, 0);
    bonfireLight.castShadow = true;
    group.add(bonfireLight);

    const emberCount = 35;
    const emberGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount * 3; i++) pos[i] = 0;
    emberGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const emberMat = new THREE.PointsMaterial({ color: 0xfbbf24, size: 0.3, transparent: true, opacity: 0.9 });
    const bonfireEmbers = new THREE.Points(emberGeo, emberMat);

    const bonfireEmberData: { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number }[] = [];
    for (let i = 0; i < emberCount; i++) {
      bonfireEmberData.push({
        x: (Math.random() - 0.5) * 0.8,
        y: 0.3 + Math.random() * 1.5,
        z: (Math.random() - 0.5) * 0.8,
        vx: (Math.random() - 0.5) * 0.02,
        vy: 0.04 + Math.random() * 0.03,
        vz: (Math.random() - 0.5) * 0.02,
        life: Math.floor(Math.random() * 30)
      });
    }
    group.add(bonfireEmbers);

    if (outBonfireHolder) {
      outBonfireHolder.bonfireLight = bonfireLight;
      outBonfireHolder.bonfireEmbers = bonfireEmbers;
      outBonfireHolder.bonfireEmberData = bonfireEmberData;
    }

    group.position.set(-2, 0, 0);
    return group;
  }

  public static createSnowman(): THREE.Group {
    const snowman = new THREE.Group();
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
    const coalMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });

    const b1 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), snowMat);
    b1.position.y = 1.0;
    b1.castShadow = true;
    const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 14), snowMat);
    b2.position.y = 2.45;
    b2.castShadow = true;
    const b3 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), snowMat);
    b3.position.y = 3.55;
    b3.castShadow = true;
    snowman.add(b1, b2, b3);

    const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.48, 8), orangeMat);
    carrot.rotation.x = Math.PI / 2;
    carrot.position.set(0, 3.55, 0.72);
    snowman.add(carrot);

    for (const side of [-0.18, 0.18]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), coalMat);
      eye.position.set(side, 3.7, 0.48);
      snowman.add(eye);
    }

    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.14, 8, 18), scarfMat);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 3.1;
    snowman.add(scarf);

    snowman.position.set(-12, 0, 8);
    return snowman;
  }

  public static createStreetLamp(x: number, z: number): THREE.Group {
    const lamp = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5.2, 8), metalMat);
    post.position.y = 2.6;
    post.castShadow = true;

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.1), metalMat);
    arm.position.set(0.35, 5.0, 0);

    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.35), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
    glass.position.set(0.7, 4.75, 0);

    const light = new THREE.PointLight(0xfef08a, 1.6, 14);
    light.position.set(0.7, 4.75, 0);
    lamp.add(post, arm, glass, light);
    lamp.position.set(x, 0, z);
    return lamp;
  }

  public static createSnowyPineTree(): THREE.Group {
    const tree = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.7 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 3.2, 8), trunkMat);
    trunk.position.y = 1.6;
    trunk.castShadow = true;
    tree.add(trunk);

    const tiers = [
      { y: 3.2, r: 2.8, h: 3.2 },
      { y: 5.2, r: 2.2, h: 2.8 },
      { y: 7.0, r: 1.5, h: 2.4 },
      { y: 8.5, r: 0.8, h: 1.8 }
    ];

    for (const t of tiers) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 8), pineMat);
      cone.position.y = t.y;
      cone.castShadow = true;
      const snow = new THREE.Mesh(new THREE.ConeGeometry(t.r * 1.03, t.h * 0.35, 8), snowMat);
      snow.position.y = t.y + t.h * 0.32;
      tree.add(cone, snow);
    }

    return tree;
  }

  public static createRusticFence(x: number, z: number, rotY: number, length: number): THREE.Group {
    const fence = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const postsCount = Math.floor(length / 3.0);

    for (let i = 0; i <= postsCount; i++) {
      const px = -length / 2 + i * 3.0;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.4, 6), woodMat);
      post.position.set(px, 0.7, 0);
      fence.add(post);
    }

    for (const ry of [0.45, 0.95]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.1, 0.08), woodMat);
      rail.position.set(0, ry, 0);
      fence.add(rail);
    }

    fence.position.set(x, 0, z);
    fence.rotation.y = rotY;
    return fence;
  }

  public static createMountainPeak(radius: number, height: number): THREE.Mesh {
    const geo = new THREE.ConeGeometry(radius, height, 10);
    const mat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.95, flatShading: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = height / 2;
    return mesh;
  }

  public static createSnowyRock(): THREE.Mesh {
    const geo = new THREE.DodecahedronGeometry(1.4, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    const rock = new THREE.Mesh(geo, mat);
    rock.position.y = 0.9;
    rock.castShadow = true;
    rock.receiveShadow = true;
    return rock;
  }

  public static createSlalomGate(colorHex: number): THREE.Group & { leftLight: THREE.Mesh; rightLight: THREE.Mesh } {
    const group = new THREE.Group() as THREE.Group & { leftLight: THREE.Mesh; rightLight: THREE.Mesh };
    const poleMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3 });
    const archMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const lightMat = new THREE.MeshBasicMaterial({ color: colorHex });

    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 4.2, 8), poleMat);
    p1.position.set(-3.0, 2.1, 0);
    p1.castShadow = true;

    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 4.2, 8), poleMat);
    p2.position.set(3.0, 2.1, 0);
    p2.castShadow = true;

    const archGeo = new THREE.TorusGeometry(3.0, 0.12, 8, 18, Math.PI);
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.position.set(0, 2.1, 0);

    const banner = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.8, 0.1), poleMat);
    banner.position.set(0, 3.8, 0);

    const leftLight = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), lightMat.clone());
    leftLight.position.set(-3.0, 4.2, 0);

    const rightLight = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), lightMat.clone());
    rightLight.position.set(3.0, 4.2, 0);

    group.add(p1, p2, arch, banner, leftLight, rightLight);
    group.leftLight = leftLight;
    group.rightLight = rightLight;

    return group;
  }

  public static createSnowRamp(): THREE.Group {
    const group = new THREE.Group();
    const rampMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.7 });

    const ramp = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.8, 4.0), rampMat);
    ramp.rotation.x = -0.18;
    ramp.position.set(0, 0.35, 0);
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    group.add(ramp);

    const flagMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const f1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.0), flagMat);
    f1.position.set(-2.4, 1.0, 1.8);
    const f2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.0), flagMat);
    f2.position.set(2.4, 1.0, 1.8);
    group.add(f1, f2);

    return group;
  }

  public static createFinishLineArch(): THREE.Group {
    const finishArch = new THREE.Group();
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 });

    const p1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 9.5, 1.2), timberMat);
    p1.position.set(-22, 4.75, 0);
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 9.5, 1.2), timberMat);
    p2.position.set(22, 4.75, 0);

    const crossBar = new THREE.Mesh(new THREE.BoxGeometry(46, 1.8, 1.4), timberMat);
    crossBar.position.set(0, 9.2, 0);

    const banner = new THREE.Mesh(new THREE.BoxGeometry(42, 2.8, 0.3), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x7f1d1d }));
    banner.position.set(0, 7.8, 0);

    for (const bx of [-15, -7, 0, 7, 15]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5), metalMat);
      pole.position.set(bx, 10.8, 0);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.8), new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide }));
      flag.position.set(bx + 0.7, 11.2, 0);
      finishArch.add(pole, flag);
    }

    finishArch.add(p1, p2, crossBar, banner);
    return finishArch;
  }

  public static createToyPopGun(): THREE.Group {
    const gun = new THREE.Group();
    const woodStockMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 });
    const corkMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 });
    const stringMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.42), woodStockMat);
    stock.position.set(0, -0.06, 0.15);
    stock.rotation.x = -0.3;

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.65, 8), brassMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0, -0.22);

    const lever = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 12, Math.PI), brassMat);
    lever.rotation.x = Math.PI / 2;
    lever.position.set(0, -0.09, 0.05);

    const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.028, 0.09, 8), corkMat);
    cork.rotation.x = Math.PI / 2;
    cork.position.set(0, 0, -0.58);

    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.18, 4), stringMat);
    string.rotation.z = 0.5;
    string.position.set(0.04, -0.06, -0.45);

    gun.add(stock, barrel, lever, cork, string);
    gun.position.set(0.32, -0.24, -0.65);
    gun.rotation.set(0.05, -0.05, 0);
    return gun;
  }
}
