import * as THREE from 'three';

export interface SprayParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export interface BurstParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface ConfettiParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: THREE.Color;
}

export interface DynamicParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  r: number;
  g: number;
  b: number;
  life: number;
  maxLife: number;
}

export class ParticleManager {
  private scene: THREE.Scene;
  
  public snowParticles: THREE.Points | null = null;
  public snowSprayPoints: THREE.Points | null = null;
  public sprayData: SprayParticle[] = [];

  public snowballBurstPoints: THREE.Points | null = null;
  public burstParticles: BurstParticle[] = [];

  public confettiPoints: THREE.Points | null = null;
  public confettiData: ConfettiParticle[] = [];

  public sparkPoints: THREE.Points | null = null;
  public sparkData: DynamicParticle[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public setScene(scene: THREE.Scene) {
    this.scene = scene;
  }

  public createSnowParticles() {
    const count = 750;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 80;
      positions[i + 1] = Math.random() * 30;
      positions[i + 2] = (Math.random() - 0.5) * 80;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.32, transparent: true, opacity: 0.85 });
    this.snowParticles = new THREE.Points(geometry, material);
    this.scene.add(this.snowParticles);
  }

  public createSnowSpraySystem() {
    const count = 180;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) positions[i] = 0;
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.52,
      transparent: true,
      opacity: 0.82
    });
    this.snowSprayPoints = new THREE.Points(geo, mat);
    this.sprayData = [];
    for (let i = 0; i < count; i++) {
      this.sprayData.push({ x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 24 });
    }
    this.scene.add(this.snowSprayPoints);
  }

  public emitSnowSpray(count: number, lateralBoost = 0, originX: number, originY: number, originZ: number) {
    if (!this.snowSprayPoints) return;
    let emitted = 0;

    for (let i = 0; i < this.sprayData.length && emitted < count; i++) {
      const p = this.sprayData[i];
      if (p.life <= 0) {
        p.x = originX + (Math.random() - 0.5) * 0.45;
        p.y = originY + 0.08 + Math.random() * 0.12;
        p.z = originZ - 0.95;
        p.vx = -lateralBoost * 0.35 + (Math.random() - 0.5) * 0.08;
        p.vy = 0.07 + Math.random() * 0.12;
        p.vz = -0.12 - Math.random() * 0.14;
        p.life = 1;
        p.maxLife = 16 + Math.floor(Math.random() * 12);
        emitted++;
      }
    }
  }

  public updateSnowSpray() {
    if (!this.snowSprayPoints) return;
    const positions = (this.snowSprayPoints.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i < this.sprayData.length; i++) {
      const p = this.sprayData[i];
      if (p.life > 0) {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.vy -= 0.005;
        p.life++;
        if (p.life > p.maxLife || p.y < 0) {
          p.life = 0;
          p.y = -999;
        }
      }
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    }
    this.snowSprayPoints.geometry.getAttribute('position').needsUpdate = true;
  }

  public createSnowballBurstSystem() {
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) positions[i] = 0;
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.44,
      transparent: true,
      opacity: 0.9,
      blending: THREE.NormalBlending
    });
    this.snowballBurstPoints = new THREE.Points(geo, mat);
    this.burstParticles = [];
    for (let i = 0; i < count; i++) {
      this.burstParticles.push({
        x: 0, y: -999, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 26,
        size: 0.44
      });
    }
    this.scene.add(this.snowballBurstPoints);
  }

  public emitSnowballDisintegration(ox: number, oy: number, oz: number, isCharacterHit = false) {
    if (!this.snowballBurstPoints) return;
    const particleCount = isCharacterHit ? 36 : 22;
    let spawned = 0;

    for (let i = 0; i < this.burstParticles.length && spawned < particleCount; i++) {
      const p = this.burstParticles[i];
      if (p.life <= 0) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = (isCharacterHit ? 0.08 : 0.05) + Math.random() * 0.16;

        p.x = ox + (Math.random() - 0.5) * 0.25;
        p.y = Math.max(0.12, oy + (Math.random() - 0.5) * 0.25);
        p.z = oz + (Math.random() - 0.5) * 0.25;

        p.vx = Math.sin(phi) * Math.cos(theta) * speed;
        p.vy = Math.cos(phi) * speed + (isCharacterHit ? 0.09 : 0.05);
        p.vz = Math.sin(phi) * Math.sin(theta) * speed;

        p.life = 1;
        p.maxLife = 18 + Math.floor(Math.random() * 14);
        spawned++;
      }
    }
  }

  public updateSnowballBursts() {
    if (!this.snowballBurstPoints) return;
    const attr = this.snowballBurstPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
    if (!attr) return;
    const positions = attr.array as Float32Array;

    for (let i = 0; i < this.burstParticles.length; i++) {
      const p = this.burstParticles[i];
      if (p.life > 0) {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.vy -= 0.0055;
        p.vx *= 0.94;
        p.vz *= 0.94;
        p.life++;

        if (p.y <= 0.06) {
          p.y = 0.06;
          p.vx *= 0.6;
          p.vz *= 0.6;
        }

        if (p.life >= p.maxLife) {
          p.life = 0;
          p.y = -999;
        }
      }
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    }
    this.snowballBurstPoints.geometry.getAttribute('position').needsUpdate = true;
  }

  public createConfettiSystem() {
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this.confettiData = [];

    const palette = [
      new THREE.Color(0xef4444),
      new THREE.Color(0x38bdf8),
      new THREE.Color(0xfacc15),
      new THREE.Color(0x22c55e),
      new THREE.Color(0xa855f7)
    ];

    for (let i = 0; i < count; i++) {
      const col = palette[i % palette.length];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      this.confettiData.push({
        x: (Math.random() - 0.5) * 25,
        y: 8 + Math.random() * 12,
        z: 3200 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 0.08,
        vy: -0.04 - Math.random() * 0.06,
        vz: (Math.random() - 0.5) * 0.08,
        color: col
      });

      positions[i * 3] = this.confettiData[i].x;
      positions[i * 3 + 1] = this.confettiData[i].y;
      positions[i * 3 + 2] = this.confettiData[i].z;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({ size: 0.6, vertexColors: true, transparent: true, opacity: 0.95 });
    this.confettiPoints = new THREE.Points(geo, mat);
    this.scene.add(this.confettiPoints);
  }

  public updateConfetti() {
    if (!this.confettiPoints) return;
    const positions = (this.confettiPoints.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i < this.confettiData.length; i++) {
      const c = this.confettiData[i];
      c.x += c.vx + Math.sin(Date.now() * 0.003 + i) * 0.03;
      c.y += c.vy;
      c.z += c.vz;
      if (c.y < 0.1) {
        c.y = 12 + Math.random() * 6;
      }
      positions[i * 3] = c.x;
      positions[i * 3 + 1] = c.y;
      positions[i * 3 + 2] = c.z;
    }
    this.confettiPoints.geometry.getAttribute('position').needsUpdate = true;
  }

  public createSparkSystem() {
    const count = 350;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this.sparkData = [];

    for (let i = 0; i < count; i++) {
      this.sparkData.push({
        x: 0,
        y: -999,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        r: 1,
        g: 1,
        b: 1,
        life: 0,
        maxLife: 20
      });
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -999;
      positions[i * 3 + 2] = 0;
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.42,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    this.sparkPoints = new THREE.Points(geo, mat);
    this.scene.add(this.sparkPoints);
  }

  public emitDriftSparks(x: number, y: number, z: number, tier: 1 | 2 | 3, side: number) {
    if (!this.sparkPoints) return;
    const count = 4;
    // Tier 1: Azul Cyan (0x38bdf8), Tier 2: Laranja/Amarelo (0xf97316), Tier 3: Roxo/Magenta Neon (0xc084fc)
    const color = tier === 3
      ? { r: 0.85, g: 0.35, b: 1.0 }
      : tier === 2
      ? { r: 1.0, g: 0.55, b: 0.1 }
      : { r: 0.2, g: 0.75, b: 1.0 };

    for (let c = 0; c < count; c++) {
      const idx = this.sparkData.findIndex(p => p.life === 0);
      if (idx === -1) break;
      const p = this.sparkData[idx];
      p.x = x + (Math.random() - 0.5) * 0.4 - side * 0.3;
      p.y = y + 0.1 + Math.random() * 0.2;
      p.z = z - 0.4 + (Math.random() - 0.5) * 0.3;
      p.vx = -side * (0.05 + Math.random() * 0.08);
      p.vy = 0.03 + Math.random() * 0.08;
      p.vz = -0.06 - Math.random() * 0.06;
      p.r = color.r;
      p.g = color.g;
      p.b = color.b;
      p.life = 1;
      p.maxLife = 14 + Math.floor(Math.random() * 10);
    }
  }

  public emitNitroFlames(x: number, y: number, z: number) {
    if (!this.sparkPoints) return;
    for (let c = 0; c < 5; c++) {
      const idx = this.sparkData.findIndex(p => p.life === 0);
      if (idx === -1) break;
      const p = this.sparkData[idx];
      p.x = x + (Math.random() - 0.5) * 0.35;
      p.y = y + 0.15 + (Math.random() - 0.5) * 0.2;
      p.z = z - 0.5 - Math.random() * 0.4;
      p.vx = (Math.random() - 0.5) * 0.04;
      p.vy = 0.02 + Math.random() * 0.05;
      p.vz = -0.18 - Math.random() * 0.12;
      const isRed = Math.random() > 0.4;
      p.r = 1.0;
      p.g = isRed ? 0.35 : 0.85;
      p.b = 0.1;
      p.life = 1;
      p.maxLife = 12 + Math.floor(Math.random() * 8);
    }
  }

  public emitItemBoxShatter(x: number, y: number, z: number) {
    if (!this.sparkPoints) return;
    for (let c = 0; c < 25; c++) {
      const idx = this.sparkData.findIndex(p => p.life === 0);
      if (idx === -1) break;
      const p = this.sparkData[idx];
      p.x = x;
      p.y = y;
      p.z = z;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.08 + Math.random() * 0.16;
      p.vx = Math.cos(angle) * speed;
      p.vy = 0.08 + Math.random() * 0.14;
      p.vz = Math.sin(angle) * speed;
      // Cor de cristal de gelo prismático / dourado
      p.r = 0.4 + Math.random() * 0.6;
      p.g = 0.8 + Math.random() * 0.2;
      p.b = 1.0;
      p.life = 1;
      p.maxLife = 22 + Math.floor(Math.random() * 12);
    }
  }

  public emitCoinSparkle(x: number, y: number, z: number) {
    if (!this.sparkPoints) return;
    for (let c = 0; c < 15; c++) {
      const idx = this.sparkData.findIndex(p => p.life === 0);
      if (idx === -1) break;
      const p = this.sparkData[idx];
      p.x = x + (Math.random() - 0.5) * 0.3;
      p.y = y + (Math.random() - 0.5) * 0.3;
      p.z = z + (Math.random() - 0.5) * 0.3;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.04 + Math.random() * 0.08;
      p.vx = Math.cos(angle) * speed;
      p.vy = 0.05 + Math.random() * 0.08;
      p.vz = Math.sin(angle) * speed;
      p.r = 1.0;
      p.g = 0.84;
      p.b = 0.1;
      p.life = 1;
      p.maxLife = 16 + Math.floor(Math.random() * 8);
    }
  }

  public updateSparks() {
    if (!this.sparkPoints) return;
    const positions = (this.sparkPoints.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
    const colors = (this.sparkPoints.geometry.getAttribute('color') as THREE.BufferAttribute).array as Float32Array;

    for (let i = 0; i < this.sparkData.length; i++) {
      const p = this.sparkData[i];
      if (p.life > 0) {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.vy -= 0.003;
        p.life++;

        if (p.y <= 0.04) {
          p.y = 0.04;
          p.vx *= 0.7;
          p.vz *= 0.7;
        }

        if (p.life >= p.maxLife) {
          p.life = 0;
          p.y = -999;
        }
      }
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      colors[i * 3] = p.r;
      colors[i * 3 + 1] = p.g;
      colors[i * 3 + 2] = p.b;
    }

    this.sparkPoints.geometry.getAttribute('position').needsUpdate = true;
    this.sparkPoints.geometry.getAttribute('color').needsUpdate = true;
  }
}
