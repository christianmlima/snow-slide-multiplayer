import * as THREE from 'three';

export interface SkidMark {
  mesh: THREE.Mesh;
  createdAt: number;
}

export class TrailManager {
  private scene: THREE.Scene;
  public skidMarks: SkidMark[] = [];
  public prevTrailLeft: { x: number; z: number } | null = null;
  public prevTrailRight: { x: number; z: number } | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public setScene(scene: THREE.Scene) {
    this.scene = scene;
  }

  public addContinuousSnowTrail(px: number, py: number, pz: number, rotY: number, isRacing: boolean) {
    const runnerOffset = isRacing ? 0.44 : 0.22;
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);

    const leftX = px - cosY * runnerOffset;
    const leftZ = pz + sinY * runnerOffset;
    const rightX = px + cosY * runnerOffset;
    const rightZ = pz - sinY * runnerOffset;

    if (this.prevTrailLeft && this.prevTrailRight) {
      this.createTrailSegment(this.prevTrailLeft.x, this.prevTrailLeft.z, leftX, leftZ, isRacing);
      if (isRacing) {
        this.createTrailSegment(this.prevTrailRight.x, this.prevTrailRight.z, rightX, rightZ, isRacing);
      }
    }

    this.prevTrailLeft = { x: leftX, z: leftZ };
    this.prevTrailRight = { x: rightX, z: rightZ };
  }

  public createTrailSegment(x1: number, z1: number, x2: number, z2: number, isRacing: boolean) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz);
    if (length < 0.06 || length > 4.5) return;

    const width = isRacing ? 0.12 : 0.18;
    const angle = Math.atan2(dx, dz);
    const geo = new THREE.PlaneGeometry(width, length);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = -angle;
    mesh.position.set((x1 + x2) * 0.5, 0.015, (z1 + z2) * 0.5);

    this.scene.add(mesh);
    this.skidMarks.push({ mesh, createdAt: Date.now() });

    if (this.skidMarks.length > 250) {
      const old = this.skidMarks.shift();
      if (old) this.scene.remove(old.mesh);
    }
  }

  public resetPrevPoints() {
    this.prevTrailLeft = null;
    this.prevTrailRight = null;
  }

  public clearAllSkidMarks() {
    for (const mark of this.skidMarks) {
      this.scene.remove(mark.mesh);
    }
    this.skidMarks = [];
    this.prevTrailLeft = null;
    this.prevTrailRight = null;
  }
}
