import * as THREE from 'three';

export class VehicleBuilder {
  public static createVehicleMesh(vType: string): THREE.Group {
    const group = new THREE.Group();
    const isSled = vType.startsWith('sled');

    if (isSled) {
      const isGold = vType === 'sled_gold';
      const steelMat = new THREE.MeshStandardMaterial({
        color: isGold ? 0xfacc15 : 0x94a3b8,
        metalness: 0.85,
        roughness: 0.2
      });
      const woodMat = new THREE.MeshStandardMaterial({
        color: isGold ? 0x7c2d12 : 0xb45309,
        roughness: 0.55
      });
      const darkWoodMat = new THREE.MeshStandardMaterial({
        color: isGold ? 0x451a03 : 0x78350f,
        roughness: 0.7
      });
      const ropeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.8 });

      for (const side of [-0.46, 0.46]) {
        const runner = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 2.6), steelMat);
        runner.position.set(side, 0.05, 0);
        runner.castShadow = true;

        const tip = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 14, Math.PI * 0.85), steelMat);
        tip.rotation.y = Math.PI / 2;
        tip.position.set(side, 0.22, 1.32);
        group.add(runner, tip);

        for (const sz of [-0.7, 0.2, 0.9]) {
          const s = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.24, 6), steelMat);
          s.position.set(side, 0.17, sz);
          group.add(s);
        }
      }

      for (const px of [-0.34, -0.11, 0.11, 0.34]) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.05, 2.25), woodMat);
        plank.position.set(px, 0.29, -0.05);
        plank.castShadow = true;
        group.add(plank);
      }

      const crossF = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.06, 0.12), darkWoodMat);
      crossF.position.set(0, 0.28, 0.85);
      const crossB = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.06, 0.12), darkWoodMat);
      crossB.position.set(0, 0.28, -0.75);
      group.add(crossF, crossB);

      const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.92, 8), darkWoodMat);
      handleBar.rotation.z = Math.PI / 2;
      handleBar.position.set(0, 0.42, 1.25);

      const ropeL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6), ropeMat);
      ropeL.position.set(-0.35, 0.48, 0.95);
      ropeL.rotation.x = 0.55;
      const ropeR = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6), ropeMat);
      ropeR.position.set(0.35, 0.48, 0.95);
      ropeR.rotation.x = 0.55;

      group.add(handleBar, ropeL, ropeR);

    } else {
      const isLava = vType === 'board_lava';
      const boardMat = new THREE.MeshStandardMaterial({
        color: isLava ? 0x0f172a : 0x0284c7,
        roughness: 0.3
      });
      const stripeMat = new THREE.MeshStandardMaterial({
        color: isLava ? 0xef4444 : 0xfacc15,
        roughness: 0.4
      });
      const bindingMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
      const edgeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });

      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.10, 2.3), boardMat);
      deck.position.y = 0.08;
      deck.castShadow = true;

      const edge = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.04, 2.34), edgeMat);
      edge.position.y = 0.04;

      const nose = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.08, 0.35), boardMat);
      nose.position.set(0, 0.16, 1.25);
      nose.rotation.x = -0.35;

      const tail = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.08, 0.35), boardMat);
      tail.position.set(0, 0.16, -1.25);
      tail.rotation.x = 0.35;

      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.11, 2.2), stripeMat);
      stripe.position.y = 0.08;

      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.28), bindingMat);
      b1.position.set(0, 0.16, 0.4);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.28), bindingMat);
      b2.position.set(0, 0.16, -0.4);

      group.add(deck, edge, nose, tail, stripe, b1, b2);
    }

    return group;
  }
}
