import * as THREE from 'three';
import { Client } from 'colyseus.js';
import { GameState } from '@snow-slide/shared';

const GAME_VERSION = "v1.8.0-STABLE";

interface ShopItem {
  id: string;
  name: string;
  category: 'sleds' | 'hats' | 'scarves' | 'goggles';
  price: number;
  icon: string;
  desc: string;
}

interface CircleCollider {
  type: 'circle';
  x: number;
  z: number;
  r: number;
}

interface BoxCollider {
  type: 'box';
  x: number;
  z: number;
  hw: number;
  hd: number;
  angle: number;
}

type HubCollider = CircleCollider | BoxCollider;

const SHOP_CATALOG: ShopItem[] = [
  // Veículos
  { id: 'sled_wood', name: 'Trenó de Madeira', category: 'sleds', price: 0, icon: '🛷', desc: 'Clássico trenó alpino com patins de aço polido.' },
  { id: 'board_cyan', name: 'Snowboard Pro Cyan', category: 'sleds', price: 350, icon: '🏂', desc: 'Prancha de alta performance para manobras ágeis.' },
  { id: 'sled_gold', name: 'Trenó Imperial Ouro', category: 'sleds', price: 800, icon: '👑', desc: 'Forjado em ouro alpino com estofado carmesim.' },
  { id: 'board_lava', name: 'Snowboard Vulcão', category: 'sleds', price: 500, icon: '🔥', desc: 'Prancha vulcânica com bordas incandescentes.' },

  // Chapéus
  { id: 'hat_red', name: 'Gorro Vermelho Pom-Pom', category: 'hats', price: 0, icon: '🔴', desc: 'O clássico gorro de lã quentinho com pom-pom.' },
  { id: 'hat_blue', name: 'Gorro Azul Nevasca', category: 'hats', price: 150, icon: '🔵', desc: 'Gorro polar reforçado para ventos frios.' },
  { id: 'hat_top', name: 'Cartola de Inverno', category: 'hats', price: 400, icon: '🎩', desc: 'Elegância aristocrática para o pinguim refinado.' },
  { id: 'hat_crown', name: 'Coroa Glacial', category: 'hats', price: 750, icon: '👑', desc: 'Digna do verdadeiro rei das montanhas nevadas.' },

  // Cachecóis
  { id: 'scarf_green', name: 'Cachecol Verde Esmeralda', category: 'scarves', price: 0, icon: '🧣', desc: 'Lã macia com cauda esvoaçante ao vento.' },
  { id: 'scarf_red', name: 'Cachecol Vermelho Listrado', category: 'scarves', price: 180, icon: '🧣', desc: 'Listras festivas visíveis em qualquer nevasca.' },
  { id: 'scarf_gold', name: 'Cachecol Seda Dourada', category: 'scarves', price: 380, icon: '✨', desc: 'Tecido nobre que reluz ao brilho do sol alpino.' },

  // Óculos de Esqui
  { id: 'goggles_none', name: 'Sem Óculos', category: 'goggles', price: 0, icon: '👀', desc: 'Olhos livres para sentir a brisa da neve.' },
  { id: 'goggles_orange', name: 'Óculos Laranja Polar', category: 'goggles', price: 250, icon: '🥽', desc: 'Lentes âmbar de alta definição com proteção UV.' },
  { id: 'goggles_cyan', name: 'Óculos Neon Ciano', category: 'goggles', price: 380, icon: '🥽', desc: 'Visor espelhado futurista contra reflexos de gelo.' }
];

class SnowSlideTPSMasterEngine {
  private client!: Client;
  private room: any;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  
  private currentScene: 'LOGIN' | 'HUB' | 'RACING' = 'LOGIN';
  
  private playerGroup!: THREE.Group;
  private playerPosX = 0;
  private playerPosY = 0;
  private playerPosZ = 0;
  private playerVelX = 0;
  private playerVelZ = 0;
  private isJumping = false;
  private jumpVelY = 0;
  
  // Customizações e Equipamentos
  private currency = 1250;
  private score = 0;
  private equipped = {
    vehicle: 'sled_wood',
    hat: 'hat_red',
    scarf: 'scarf_green',
    goggles: 'goggles_none'
  };
  private inventory: Set<string> = new Set(['sled_wood', 'hat_red', 'scarf_green', 'goggles_none']);

  // Colisões do Hub
  private hubColliders: HubCollider[] = [];

  // Lojinha Alpina Física & NPC Lojista
  private shopPos = new THREE.Vector3(-22, 0, -18);
  private shopInteractionPos = new THREE.Vector3(-24.8, 0, -11.4);
  private nearShop = false;
  private merchantPenguin: THREE.Group | null = null;

  // Membros do Pinguim para Animação Procedural
  private penguinTorso!: THREE.Group;
  private penguinHead!: THREE.Group;
  private penguinFootL!: THREE.Mesh;
  private penguinFootR!: THREE.Mesh;
  private penguinWingL!: THREE.Mesh;
  private penguinWingR!: THREE.Mesh;
  private penguinScarfTail!: THREE.Mesh;
  private walkTime = 0;
  private isRunning = false;

  // Interação do Bondinho (Cable Car)
  private cableCarStationPos = new THREE.Vector3(22, 0, -18);
  private nearCableCar = false;
  private gondolaMesh!: THREE.Group;

  // Fogueira no Hub
  private bonfireLight!: THREE.PointLight;
  private bonfireEmbers!: THREE.Points;
  private bonfireEmberData: { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number }[] = [];

  // Pista de Corrida & Obstáculos
  private otherPlayers: Map<string, THREE.Group> = new Map();
  private obstacles: { mesh: THREE.Object3D; x: number; z: number; radius: number }[] = [];
  private gates: { mesh: THREE.Object3D; x: number; z: number; passed: boolean }[] = [];
  private ramps: { mesh: THREE.Object3D; x: number; z: number }[] = [];

  // Rastro na Neve e Partículas
  private skidMarks: { mesh: THREE.Mesh; createdAt: number }[] = [];
  private prevTrailLeft: { x: number; z: number } | null = null;
  private prevTrailRight: { x: number; z: number } | null = null;
  private snowParticles!: THREE.Points;
  private snowSprayPoints!: THREE.Points;
  private sprayData: { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; maxLife: number }[] = [];

  // Câmera Órbita 360° (Hub)
  private isDragging = false;
  private activeOrbitPointerId: number | null = null;
  private previousTouchX = 0;
  private previousTouchY = 0;
  private cameraAngleY = 0;
  private cameraAngleX = 0.35;
  private cameraDistance = 10;

  // Analógico Virtual
  private joystickActive = false;
  private activeJoystickPointerId: number | null = null;
  private joystickStartX = 0;
  private joystickStartY = 0;
  private joystickMoveX = 0;
  private joystickMoveY = 0;
  
  // Teclado
  private keyW = false;
  private keyS = false;
  private keyA = false;
  private keyD = false;
  private keyShift = false;

  constructor() {
    this.initEngine();
  }

  // =========================================================================
  // SISTEMA DE PARTÍCULAS E RASTRO
  // =========================================================================
  private createSnowParticles() {
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

  private createSnowSpraySystem() {
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

  private emitSnowSpray(count: number, lateralBoost = 0) {
    if (!this.snowSprayPoints) return;
    let emitted = 0;
    for (let i = 0; i < this.sprayData.length; i++) {
      const p = this.sprayData[i];
      if (p.life <= 0) {
        p.x = this.playerPosX + (Math.random() - 0.5) * 0.7;
        p.y = this.playerPosY + 0.08;
        p.z = this.playerPosZ - 0.85;
        p.vx = (Math.random() - 0.5) * 0.15 - lateralBoost * 0.38;
        p.vy = 0.06 + Math.random() * 0.09;
        p.vz = -0.15 - Math.random() * 0.18;
        p.life = 18 + Math.floor(Math.random() * 14);
        p.maxLife = p.life;
        emitted++;
        if (emitted >= count) break;
      }
    }
  }

  private updateSnowSpray() {
    if (!this.snowSprayPoints) return;
    const posAttr = this.snowSprayPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < this.sprayData.length; i++) {
      const p = this.sprayData[i];
      if (p.life > 0) {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.vy -= 0.0035;
        p.life--;
        arr[i * 3] = p.x;
        arr[i * 3 + 1] = p.y;
        arr[i * 3 + 2] = p.z;
      } else {
        arr[i * 3 + 1] = -999;
      }
    }
    posAttr.needsUpdate = true;
  }

  private addContinuousSnowTrail(x: number, y: number, z: number, rotY: number) {
    const isSled = this.equipped.vehicle.startsWith('sled');
    const trackMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.62,
      depthWrite: false
    });

    const cosH = Math.cos(rotY);
    const sinH = Math.sin(rotY);

    if (this.currentScene === 'HUB') {
      // No Hub (a pé): pegadas leves de pinguim
      const footOffset = 0.22;
      const geo = new THREE.PlaneGeometry(0.18, 0.26);
      const footprint = new THREE.Mesh(geo, trackMat);
      footprint.rotation.x = -Math.PI / 2;
      footprint.rotation.z = -rotY;
      const footSide = Math.sin(this.walkTime) > 0 ? 1 : -1;
      footprint.position.set(x + cosH * footOffset * footSide, y + 0.02, z - sinH * footOffset * footSide);
      this.scene.add(footprint);
      this.skidMarks.push({ mesh: footprint, createdAt: Date.now() });

    } else if (isSled) {
      // Na Corrida com Trenó: rastro duplo de lâminas
      const offset = 0.46;
      const currL = { x: x - cosH * offset, z: z + sinH * offset };
      const currR = { x: x + cosH * offset, z: z - sinH * offset };

      if (this.prevTrailLeft && this.prevTrailRight) {
        const dxL = currL.x - this.prevTrailLeft.x;
        const dzL = currL.z - this.prevTrailLeft.z;
        const distL = Math.sqrt(dxL * dxL + dzL * dzL);

        if (distL > 0.35 && distL < 8.0) {
          const angleL = Math.atan2(dxL, dzL);
          const geoL = new THREE.PlaneGeometry(0.14, distL + 0.04);
          const markL = new THREE.Mesh(geoL, trackMat);
          markL.rotation.x = -Math.PI / 2;
          markL.rotation.z = -angleL;
          markL.position.set((this.prevTrailLeft.x + currL.x) / 2, y + 0.02, (this.prevTrailLeft.z + currL.z) / 2);
          this.scene.add(markL);
          this.skidMarks.push({ mesh: markL, createdAt: Date.now() });

          const dxR = currR.x - this.prevTrailRight.x;
          const dzR = currR.z - this.prevTrailRight.z;
          const distR = Math.sqrt(dxR * dxR + dzR * dzR);
          const angleR = Math.atan2(dxR, dzR);
          const geoR = new THREE.PlaneGeometry(0.14, distR + 0.04);
          const markR = new THREE.Mesh(geoR, trackMat);
          markR.rotation.x = -Math.PI / 2;
          markR.rotation.z = -angleR;
          markR.position.set((this.prevTrailRight.x + currR.x) / 2, y + 0.02, (this.prevTrailRight.z + currR.z) / 2);
          this.scene.add(markR);
          this.skidMarks.push({ mesh: markR, createdAt: Date.now() });

          this.prevTrailLeft = currL;
          this.prevTrailRight = currR;
        }
      } else {
        this.prevTrailLeft = currL;
        this.prevTrailRight = currR;
      }
    } else {
      // Na Corrida com Snowboard: sulco central de carving
      if (this.prevTrailLeft) {
        const dx = x - this.prevTrailLeft.x;
        const dz = z - this.prevTrailLeft.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 0.35 && dist < 8.0) {
          const angle = Math.atan2(dx, dz);
          const carveWidth = 0.48 + Math.abs(this.playerVelX) * 0.4;
          const geo = new THREE.PlaneGeometry(carveWidth, dist + 0.04);
          const mark = new THREE.Mesh(geo, trackMat);
          mark.rotation.x = -Math.PI / 2;
          mark.rotation.z = -angle;
          mark.position.set((this.prevTrailLeft.x + x) / 2, y + 0.02, (this.prevTrailLeft.z + z) / 2);
          this.scene.add(mark);
          this.skidMarks.push({ mesh: mark, createdAt: Date.now() });
          this.prevTrailLeft = { x, z };
        }
      } else {
        this.prevTrailLeft = { x, z };
      }
    }

    while (this.skidMarks.length > 350) {
      const old = this.skidMarks.shift()!;
      this.scene.remove(old.mesh);
      old.mesh.geometry.dispose();
      (old.mesh.material as THREE.Material).dispose();
    }
  }

  private clearAllSkidMarks() {
    for (const m of this.skidMarks) {
      this.scene.remove(m.mesh);
      m.mesh.geometry.dispose();
      (m.mesh.material as THREE.Material).dispose();
    }
    this.skidMarks = [];
    this.prevTrailLeft = null;
    this.prevTrailRight = null;
  }

  // =========================================================================
  // MODELAGEM VISUAL: CENÁRIO ALPINO (ÁRVORES, ROCHAS, PORTAIS, RAMPAS, MONTANHAS)
  // =========================================================================
  private createSnowyPineTree(): THREE.Group {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.5, 2.0, 7),
      new THREE.MeshStandardMaterial({ color: 0x5c3317, roughness: 0.9 })
    );
    trunk.position.y = 1.0;
    trunk.castShadow = true;
    group.add(trunk);

    const greenMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });

    // Camada 1 (Base)
    const t1 = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.3, 7), greenMat);
    t1.position.y = 2.4;
    t1.castShadow = true;
    const s1 = new THREE.Mesh(new THREE.ConeGeometry(2.65, 0.7, 7), snowMat);
    s1.position.y = 2.65;
    group.add(t1, s1);

    // Camada 2 (Meio)
    const t2 = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.9, 7), greenMat);
    t2.position.y = 3.7;
    t2.castShadow = true;
    const s2 = new THREE.Mesh(new THREE.ConeGeometry(2.05, 0.6, 7), snowMat);
    s2.position.y = 3.95;
    group.add(t2, s2);

    // Camada 3 (Topo)
    const t3 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.7, 7), greenMat);
    t3.position.y = 4.9;
    t3.castShadow = true;
    const s3 = new THREE.Mesh(new THREE.ConeGeometry(1.45, 0.8, 7), snowMat);
    s3.position.y = 5.25;
    group.add(t3, s3);

    return group;
  }

  private createSnowyRock(): THREE.Group {
    const group = new THREE.Group();
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });

    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 1), rockMat);
    rock.position.y = 0.9;
    rock.scale.set(1.2, 0.8, 1.1);
    rock.castShadow = true;

    const cap = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), snowMat);
    cap.position.y = 1.35;
    cap.scale.set(1.15, 0.5, 1.05);

    group.add(rock, cap);
    return group;
  }

  private createSlalomGate(colorHex: number): THREE.Group {
    const group = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3 });
    const bannerMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5, side: THREE.DoubleSide });

    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), poleMat);
    p1.position.set(-2.8, 1.6, 0);
    p1.castShadow = true;

    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), poleMat);
    p2.position.set(2.8, 1.6, 0);
    p2.castShadow = true;

    const banner = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 0.8), bannerMat);
    banner.position.set(0, 2.7, 0);

    group.add(p1, p2, banner);
    return group;
  }

  private createSnowRamp(): THREE.Group {
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

  private createMountainPeak(radius: number, height: number): THREE.Group {
    const group = new THREE.Group();
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });

    const base = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 6), rockMat);
    base.position.y = height / 2;

    const snowCap = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.48, height * 0.45, 6), snowMat);
    snowCap.position.y = height * 0.78;

    group.add(base, snowCap);
    return group;
  }

  // =========================================================================
  // MODELAGEM VISUAL: PENGUIN, ACESSÓRIOS & VEÍCULOS
  // =========================================================================
  private createDetailedPenguin(): THREE.Group {
    const root = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });

    // Grupo do Torso (Balança no waddle)
    this.penguinTorso = new THREE.Group();
    
    // Corpo
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.44, 0.65, 14, 14), bodyMat);
    body.position.y = 0.68;
    body.castShadow = true;
    this.penguinTorso.add(body);

    // Barriga branca
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), whiteMat);
    belly.position.set(0, 0.64, 0.24);
    belly.scale.set(0.82, 1.05, 0.5);
    this.penguinTorso.add(belly);

    // Cabeça
    this.penguinHead = new THREE.Group();
    this.penguinHead.position.y = 1.22;

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 16), bodyMat);
    headMesh.castShadow = true;
    this.penguinHead.add(headMesh);

    // Bico laranja
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.32, 8), orangeMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, -0.04, 0.44);
    this.penguinHead.add(beak);

    // Olhos com pupilas e brilho
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), eyeMat);
      eye.position.set(side * 0.13, 0.06, 0.30);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), pupilMat);
      pupil.position.set(side * 0.13, 0.06, 0.36);
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), glintMat);
      glint.position.set(side * 0.11 + 0.02, 0.08, 0.39);
      this.penguinHead.add(eye, pupil, glint);

      const blush = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.08), new THREE.MeshBasicMaterial({ color: 0xfb7185, transparent: true, opacity: 0.65 }));
      blush.position.set(side * 0.24, -0.04, 0.28);
      blush.rotation.y = side * 0.3;
      this.penguinHead.add(blush);
    }

    // ACESSÓRIO: Chapéu / Gorro Equipado
    this.attachEquippedHat(this.penguinHead);

    // ACESSÓRIO: Óculos de Esqui Equipados
    this.attachEquippedGoggles(this.penguinHead);

    this.penguinTorso.add(this.penguinHead);

    // ACESSÓRIO: Cachecol Equipado
    this.attachEquippedScarf(this.penguinTorso);

    // Asas / Nadadeiras articuladas
    this.penguinWingL = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.48, 8, 8), bodyMat);
    this.penguinWingL.position.set(-0.50, 0.66, 0.02);
    this.penguinWingL.rotation.set(-0.2, 0, 0.42);
    this.penguinWingL.scale.set(1.1, 1.0, 0.4);

    this.penguinWingR = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.48, 8, 8), bodyMat);
    this.penguinWingR.position.set(0.50, 0.66, 0.02);
    this.penguinWingR.rotation.set(-0.2, 0, -0.42);
    this.penguinWingR.scale.set(1.1, 1.0, 0.4);

    this.penguinTorso.add(this.penguinWingL, this.penguinWingR);
    root.add(this.penguinTorso);

    // Patas articuladas para caminhar
    this.penguinFootL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.38), orangeMat);
    this.penguinFootL.position.set(-0.24, 0.06, 0.12);
    this.penguinFootL.castShadow = true;

    this.penguinFootR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.38), orangeMat);
    this.penguinFootR.position.set(0.24, 0.06, 0.12);
    this.penguinFootR.castShadow = true;

    root.add(this.penguinFootL, this.penguinFootR);

    return root;
  }

  private attachEquippedHat(head: THREE.Group) {
    const hatId = this.equipped.hat;
    if (hatId === 'hat_red' || hatId === 'hat_blue') {
      const isRed = hatId === 'hat_red';
      const hatMat = new THREE.MeshStandardMaterial({ color: isRed ? 0xdc2626 : 0x0284c7, roughness: 0.6 });
      const brimMat = new THREE.MeshStandardMaterial({ color: isRed ? 0xb91c1c : 0x0369a1, roughness: 0.8 });
      const pomMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });

      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hatMat);
      dome.position.y = 0.13;
      const brim = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.07, 8, 20), brimMat);
      brim.rotation.x = Math.PI / 2;
      brim.position.y = 0.14;
      const pom = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), pomMat);
      pom.position.set(0, 0.54, -0.06);
      head.add(dome, brim, pom);

    } else if (hatId === 'hat_top') {
      const hatMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
      const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });

      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.04, 16), hatMat);
      brim.position.y = 0.34;
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.48, 16), hatMat);
      crown.position.y = 0.58;
      const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.345, 0.345, 0.10, 16), ribbonMat);
      ribbon.position.y = 0.41;
      head.add(brim, crown, ribbon);

    } else if (hatId === 'hat_crown') {
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.25 });
      const gemMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1 });

      const circlet = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.18, 16, 1, true), goldMat);
      circlet.position.y = 0.38;
      head.add(circlet);

      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 5), goldMat);
        spike.position.set(Math.cos(ang) * 0.36, 0.54, Math.sin(ang) * 0.36);
        const gem = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), gemMat);
        gem.position.set(Math.cos(ang) * 0.38, 0.42, Math.sin(ang) * 0.38);
        head.add(spike, gem);
      }
    }
  }

  private attachEquippedGoggles(head: THREE.Group) {
    const gId = this.equipped.goggles;
    if (gId === 'goggles_none') return;

    const lensColor = gId === 'goggles_orange' ? 0xf97316 : 0x38bdf8;
    const lensMat = new THREE.MeshStandardMaterial({ color: lensColor, metalness: 0.7, roughness: 0.2, transparent: true, opacity: 0.88 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.16, 0.12), lensMat);
    visor.position.set(0, 0.08, 0.35);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.20, 0.06), frameMat);
    frame.position.set(0, 0.08, 0.33);

    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.04, 6, 20), strapMat);
    strap.rotation.x = Math.PI / 2;
    strap.position.y = 0.08;

    head.add(visor, frame, strap);
  }

  private attachEquippedScarf(torso: THREE.Group) {
    const sId = this.equipped.scarf;
    const color = sId === 'scarf_green' ? 0x16a34a : (sId === 'scarf_red' ? 0xdc2626 : 0xfacc15);
    const scarfMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });

    const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.09, 8, 20), scarfMat);
    scarfRing.rotation.x = Math.PI / 2;
    scarfRing.position.y = 0.98;

    this.penguinScarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.55), scarfMat);
    this.penguinScarfTail.position.set(0.26, 0.94, -0.38);
    this.penguinScarfTail.rotation.set(-0.35, 0.25, 0);

    torso.add(scarfRing, this.penguinScarfTail);
  }

  // Modelagem dos Veículos para a Corrida
  private createVehicleMesh(vType: string): THREE.Group {
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

      // Lâminas curvadas
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

      // Tábuas de madeira
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
      // Snowboard
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

  // Avatar completo montado: a pé no Hub, montado no veículo na corrida
  private createAvatarAssembly(): THREE.Group {
    const group = new THREE.Group();

    if (this.currentScene === 'RACING') {
      const vehicle = this.createVehicleMesh(this.equipped.vehicle);
      group.add(vehicle);

      const penguin = this.createDetailedPenguin();
      penguin.position.y = this.equipped.vehicle.startsWith('sled') ? 0.26 : 0.08;
      group.add(penguin);
    } else {
      // NO HUB: O pinguim caminha a pé diretamente no chão sem carrinho!
      const penguin = this.createDetailedPenguin();
      penguin.position.y = 0;
      group.add(penguin);
    }

    return group;
  }

  private respawnPlayerMesh() {
    if (this.playerGroup) this.scene.remove(this.playerGroup);
    this.playerGroup = this.createAvatarAssembly();
    this.scene.add(this.playerGroup);
  }

  // Animação Procedural dos Membros do Pinguim
  private animatePenguinWalk(time: number, running: boolean) {
    if (!this.penguinFootL || !this.penguinFootR || !this.penguinTorso) return;

    const freq = running ? 1.6 : 1.0;
    const t = time * freq;

    // Patas alternando passos
    this.penguinFootL.position.z = Math.sin(t) * 0.24;
    this.penguinFootL.position.y = Math.max(0, Math.cos(t) * 0.14);

    this.penguinFootR.position.z = -Math.sin(t) * 0.24;
    this.penguinFootR.position.y = Math.max(0, -Math.cos(t) * 0.14);

    // O clássico "Waddle": balanço alegre de corpo de pinguim
    this.penguinTorso.rotation.z = Math.sin(t) * (running ? 0.20 : 0.14);
    this.penguinTorso.position.y = Math.abs(Math.sin(t * 2)) * 0.05;

    // Asas balançando suavemente para equilíbrio
    this.penguinWingL.rotation.z = 0.42 + Math.sin(t) * 0.25;
    this.penguinWingR.rotation.z = -0.42 + Math.sin(t) * 0.25;

    // Cauda do cachecol esvoaçando
    if (this.penguinScarfTail) {
      this.penguinScarfTail.rotation.y = 0.25 + Math.sin(t * 1.5) * 0.25;
    }
  }

  private animatePenguinIdle() {
    if (!this.penguinFootL || !this.penguinFootR || !this.penguinTorso) return;

    this.penguinFootL.position.set(-0.24, 0.06, 0.12);
    this.penguinFootR.position.set(0.24, 0.06, 0.12);
    this.penguinTorso.rotation.z = 0;
    this.penguinTorso.position.y = 0;
    this.penguinWingL.rotation.set(-0.2, 0, 0.42);
    this.penguinWingR.rotation.set(-0.2, 0, -0.42);
  }

  // =========================================================================
  // CENÁRIO: ESTAÇÃO DO BONDINHO, FOGUEIRA & VILA ALPINA (HUB)
  // =========================================================================
  private createCableCarBaseStation(): THREE.Group {
    const station = new THREE.Group();
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x5c3317, roughness: 0.8 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const cableMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });

    // Plataforma de madeira com degraus
    const deck = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 12), timberMat);
    deck.position.y = 0.6;
    deck.receiveShadow = true;
    station.add(deck);

    // Pilares e Telhado Alpino da Estação
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

    // Torre de aço e roldanas do cabo do bondinho
    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 14, 8), metalMat);
    pylon.position.set(0, 7.6, -1);
    const pylonArm = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 0.6), metalMat);
    pylonArm.position.set(0, 14.2, -1);
    station.add(pylon, pylonArm);

    // Cabos de aço que sobem em direção à montanha (Z negativo, Y alto)
    for (const cx of [-2.4, 2.4]) {
      const cablePoints = [
        new THREE.Vector3(cx, 14.2, -1),
        new THREE.Vector3(cx * 1.5, 95, -280) // Sobe em direção ao pico
      ];
      const cableCurve = new THREE.CatmullRomCurve3(cablePoints);
      const cableGeo = new THREE.TubeGeometry(cableCurve, 20, 0.05, 6, false);
      const cableMesh = new THREE.Mesh(cableGeo, cableMat);
      station.add(cableMesh);
    }

    // Cabine do Bondinho (Gôndola vermelha e amarela suspensa)
    this.gondolaMesh = new THREE.Group();
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

    this.gondolaMesh.add(gondolaBody, winF, winB, hanger, clamp);
    this.gondolaMesh.position.set(2.4, 3.8, -1);
    station.add(this.gondolaMesh);

    // Placa Luminosa da Estação
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(9, 1.6, 0.2), boardMat);
    signBoard.position.set(0, 5.8, 5.8);
    station.add(signBoard);

    station.position.copy(this.cableCarStationPos);
    return station;
  }

  private createBonfire(): THREE.Group {
    const group = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });

    // Anel de pedras
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 1), stoneMat);
      stone.position.set(Math.cos(ang) * 1.8, 0.25, Math.sin(ang) * 1.8);
      group.add(stone);
    }

    // Troncos cruzados
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI;
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 2.2, 6), woodMat);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = ang;
      log.position.y = 0.35;
      group.add(log);
    }

    // Luz aconchegante da fogueira
    this.bonfireLight = new THREE.PointLight(0xf97316, 2.8, 26);
    this.bonfireLight.position.set(0, 1.2, 0);
    this.bonfireLight.castShadow = true;
    group.add(this.bonfireLight);

    // Brasas / Fagulhas flutuantes
    const emberCount = 35;
    const emberGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount * 3; i++) pos[i] = 0;
    emberGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const emberMat = new THREE.PointsMaterial({ color: 0xfbbf24, size: 0.3, transparent: true, opacity: 0.9 });
    this.bonfireEmbers = new THREE.Points(emberGeo, emberMat);
    this.bonfireEmberData = [];
    for (let i = 0; i < emberCount; i++) {
      this.bonfireEmberData.push({
        x: (Math.random() - 0.5) * 0.8,
        y: 0.3 + Math.random() * 1.5,
        z: (Math.random() - 0.5) * 0.8,
        vx: (Math.random() - 0.5) * 0.02,
        vy: 0.03 + Math.random() * 0.04,
        vz: (Math.random() - 0.5) * 0.02,
        life: Math.random() * 30
      });
    }
    group.add(this.bonfireEmbers);

    // Bancos de tora ao redor
    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * Math.PI * 1.6 + 0.6;
      const bench = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 3.4, 8), woodMat);
      bench.rotation.z = Math.PI / 2;
      bench.rotation.y = ang + Math.PI / 2;
      bench.position.set(Math.cos(ang) * 4.2, 0.32, Math.sin(ang) * 4.2);
      group.add(bench);
    }

    group.position.set(-6, 0, -2);
    return group;
  }

  private createSnowman(): THREE.Group {
    const group = new THREE.Group();
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });
    const coalMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const carrotMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });

    const b1 = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 12), snowMat);
    b1.position.y = 0.9;
    const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.72, 12, 12), snowMat);
    b2.position.y = 2.1;
    const b3 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), snowMat);
    b3.position.y = 3.1;
    group.add(b1, b2, b3);

    // Nariz de cenoura
    const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 6), carrotMat);
    carrot.rotation.x = Math.PI / 2;
    carrot.position.set(0, 3.1, 0.6);

    // Cartola
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.06, 12), hatMat);
    hatBrim.position.y = 3.52;
    const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.6, 12), hatMat);
    hatCrown.position.y = 3.84;
    group.add(carrot, hatBrim, hatCrown);

    // Olhos de carvão
    for (const sx of [-0.18, 0.18]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), coalMat);
      eye.position.set(sx, 3.22, 0.44);
      group.add(eye);
    }

    group.position.set(-16, 0, 10);
    return group;
  }

  private createChalet(x: number, z: number, rotY: number): THREE.Group {
    const chalet = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
    const windowMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.5 });

    // Parede
    const walls = new THREE.Mesh(new THREE.BoxGeometry(11, 6.5, 10), woodMat);
    walls.position.y = 3.25;
    walls.castShadow = true;
    chalet.add(walls);

    // Telhado alpino inclinado com neve
    const roof = new THREE.Mesh(new THREE.ConeGeometry(8.5, 4.5, 4), roofMat);
    roof.position.y = 8.5;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;

    const roofSnow = new THREE.Mesh(new THREE.ConeGeometry(8.8, 1.2, 4), snowMat);
    roofSnow.position.y = 9.2;
    roofSnow.rotation.y = Math.PI / 4;
    chalet.add(roof, roofSnow);

    // Janelas iluminadas quentinhas
    const win1 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), windowMat);
    win1.position.set(-2.8, 3.8, 5.02);
    const win2 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), windowMat);
    win2.position.set(2.8, 3.8, 5.02);
    chalet.add(win1, win2);

    chalet.position.set(x, 0, z);
    chalet.rotation.y = rotY;
    return chalet;
  }

  // Lojinha Alpina Física com Balcão Aberto, Toldo, Lanternas e Vendedor NPC Pingo
  private createShopBuilding(x: number, z: number, rotY: number): THREE.Group {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6d3916, roughness: 0.75 });
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7, roughness: 0.3 });
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 });
    const windowMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.6 });

    // 1. Corpo principal do chalé
    const walls = new THREE.Mesh(new THREE.BoxGeometry(11, 6.5, 10), woodMat);
    walls.position.y = 3.25;
    walls.castShadow = true;
    group.add(walls);

    // Telhado de montanha com neve espessa
    const roof = new THREE.Mesh(new THREE.ConeGeometry(8.8, 4.8, 4), roofMat);
    roof.position.y = 8.6;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;

    const roofSnow = new THREE.Mesh(new THREE.ConeGeometry(9.1, 1.3, 4), snowMat);
    roofSnow.position.y = 9.3;
    roofSnow.rotation.y = Math.PI / 4;
    group.add(roof, roofSnow);

    // Janelas iluminadas laterais
    const winL = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), windowMat);
    winL.position.set(-5.52, 3.6, 0);
    winL.rotation.y = -Math.PI / 2;
    const winR = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), windowMat);
    winR.position.set(5.52, 3.6, 0);
    winR.rotation.y = Math.PI / 2;
    group.add(winL, winR);

    // 2. Balcão de atendimento frontal voltado para a praça
    const counter = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.15, 1.2), counterMat);
    counter.position.set(0, 0.58, 5.4);
    counter.castShadow = true;
    counter.receiveShadow = true;
    group.add(counter);

    // Toldo listrado acima do balcão
    const awning = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.18, 2.4), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 }));
    awning.position.set(0, 4.1, 5.6);
    awning.rotation.x = 0.22;
    awning.castShadow = true;
    group.add(awning);

    // Postes de sustentação do toldo
    for (const px of [-2.9, 2.9]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.8, 8), darkWoodMat);
      pole.position.set(px, 1.9, 6.4);
      group.add(pole);
    }

    // Placa artesanal da Lojinha Alpina
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.3, 0.22), goldMat);
    signBoard.position.set(0, 4.9, 5.2);
    group.add(signBoard);

    // Lanternas quentes no balcão
    for (const lx of [-2.4, 2.4]) {
      const lanternMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 1.0 });
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.3), lanternMat);
      lamp.position.set(lx, 3.5, 6.0);
      const light = new THREE.PointLight(0xf59e0b, 1.2, 7);
      light.position.copy(lamp.position);
      group.add(lamp, light);
    }

    // Itens em exposição no balcão (mini trenó, chapéu e sino dourado)
    const miniSled = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.9), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
    miniSled.position.set(-1.6, 1.25, 5.4);
    miniSled.rotation.y = 0.3;
    const miniHat = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
    miniHat.position.set(1.6, 1.3, 5.4);
    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 8), goldMat);
    bell.position.set(0.6, 1.24, 5.3);
    group.add(miniSled, miniHat, bell);

    // Tapete de boas-vindas na neve em frente ao balcão
    const rug = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.85 })
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.02, 6.6);
    rug.receiveShadow = true;
    group.add(rug);

    // 3. Vendedor NPC: Pingo, o Pinguim Lojista
    this.merchantPenguin = new THREE.Group();
    const pBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const pBellyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
    const pBeakMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
    const pApronMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });

    const pTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.65, 8, 12), pBodyMat);
    pTorso.position.y = 1.35;
    const pBelly = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 10), pBellyMat);
    pBelly.scale.set(0.85, 1.1, 0.4);
    pBelly.position.set(0, 1.32, 0.28);
    const pBeak = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 6), pBeakMat);
    pBeak.rotation.x = Math.PI / 2;
    pBeak.position.set(0, 1.62, 0.42);

    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.1), pApronMat);
    apron.position.set(0, 1.25, 0.32);

    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.35, 10), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    hat.position.set(0, 1.95, 0);

    this.merchantPenguin.add(pTorso, pBelly, pBeak, apron, hat);
    this.merchantPenguin.position.set(0, 0, 4.4); // Atrás do balcão
    group.add(this.merchantPenguin);

    group.position.set(x, 0, z);
    group.rotation.y = rotY;
    return group;
  }

  // Poste de luz com lanterna quente
  private createStreetLamp(x: number, z: number): THREE.Group {
    const lamp = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 1.0 });

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 4.6, 8), woodMat);
    pole.position.y = 2.3;
    pole.castShadow = true;
    lamp.add(pole);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.1), metalMat);
    arm.position.set(0.35, 4.4, 0);
    lamp.add(arm);

    const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.35), glassMat);
    lantern.position.set(0.7, 4.1, 0);
    const light = new THREE.PointLight(0xfbbf24, 1.2, 16);
    light.position.set(0.7, 4.1, 0);
    lamp.add(lantern, light);

    const snowCap = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.2, 4), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
    snowCap.position.set(0.7, 4.45, 0);
    snowCap.rotation.y = Math.PI / 4;
    lamp.add(snowCap);

    lamp.position.set(x, 0, z);
    return lamp;
  }

  // Cercas rústicas de madeira para delimitação do vilarejo
  private createRusticFence(x: number, z: number, rotY: number, length: number): THREE.Group {
    const fence = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3317, roughness: 0.85 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });

    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(length, 0.12, 0.12), woodMat);
    rail1.position.y = 0.5;
    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(length, 0.14, 0.14), woodMat);
    rail2.position.y = 1.0;
    const snow = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, 0.18), snowMat);
    snow.position.y = 1.1;
    fence.add(rail1, rail2, snow);

    const postCount = Math.max(2, Math.floor(length / 2.8) + 1);
    for (let i = 0; i < postCount; i++) {
      const px = -length / 2 + (i / (postCount - 1)) * length;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.4, 6), woodMat);
      post.position.set(px, 0.7, 0);
      post.castShadow = true;
      fence.add(post);
    }

    fence.position.set(x, 0, z);
    fence.rotation.y = rotY;
    return fence;
  }

  // Resolução de colisões sólidas no Hub (Círculos, Caixas orientadas e Fronteiras)
  private resolveHubCollisions(px: number, pz: number, playerRadius = 0.85): { x: number; z: number } {
    let resX = px;
    let resZ = pz;

    for (let pass = 0; pass < 2; pass++) {
      for (const col of this.hubColliders) {
        if (col.type === 'circle') {
          const dx = resX - col.x;
          const dz = resZ - col.z;
          const distSq = dx * dx + dz * dz;
          const minDist = col.r + playerRadius;
          if (distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq);
            if (dist > 0.0001) {
              const overlap = minDist - dist;
              resX += (dx / dist) * overlap;
              resZ += (dz / dist) * overlap;
            } else {
              resX += minDist;
            }
          }
        } else if (col.type === 'box') {
          const dx = resX - col.x;
          const dz = resZ - col.z;
          const cosA = Math.cos(-col.angle);
          const sinA = Math.sin(-col.angle);
          const localX = dx * cosA - dz * sinA;
          const localZ = dx * sinA + dz * cosA;

          const clampedX = Math.max(-col.hw, Math.min(col.hw, localX));
          const clampedZ = Math.max(-col.hd, Math.min(col.hd, localZ));

          const diffX = localX - clampedX;
          const diffZ = localZ - clampedZ;
          const distSq = diffX * diffX + diffZ * diffZ;

          if (distSq < playerRadius * playerRadius) {
            let pushLocalX = 0;
            let pushLocalZ = 0;

            if (distSq > 0.00001) {
              const dist = Math.sqrt(distSq);
              const overlap = playerRadius - dist;
              pushLocalX = (diffX / dist) * overlap;
              pushLocalZ = (diffZ / dist) * overlap;
            } else {
              const distLeft = localX - (-col.hw);
              const distRight = col.hw - localX;
              const distTop = localZ - (-col.hd);
              const distBottom = col.hd - localZ;
              const minD = Math.min(distLeft, distRight, distTop, distBottom);
              if (minD === distLeft) pushLocalX = -(distLeft + playerRadius);
              else if (minD === distRight) pushLocalX = (distRight + playerRadius);
              else if (minD === distTop) pushLocalZ = -(distTop + playerRadius);
              else pushLocalZ = (distBottom + playerRadius);
            }

            const worldPushX = pushLocalX * Math.cos(col.angle) - pushLocalZ * Math.sin(col.angle);
            const worldPushZ = pushLocalX * Math.sin(col.angle) + pushLocalZ * Math.cos(col.angle);
            resX += worldPushX;
            resZ += worldPushZ;
          }
        }
      }
    }

    const maxBound = 44;
    resX = Math.max(-maxBound, Math.min(maxBound, resX));
    resZ = Math.max(-maxBound, Math.min(maxBound, resZ));

    return { x: resX, z: resZ };
  }

  // =========================================================================
  // CENAS: LOAD HUB & LOAD RACING
  // =========================================================================
  private initEngine() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbae6fd);
    this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.005);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('app')!.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.3);
    sun.position.set(40, 70, -40);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    this.scene.add(sun);

    this.createSnowParticles();
    this.createSnowSpraySystem();
    this.setupUIAndControls();

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.loop();
  }

  private loadHubScene() {
    this.currentScene = 'HUB';
    this.scene.clear();
    this.scene.background = new THREE.Color(0xcbe4f9);
    this.scene.fog = new THREE.FogExp2(0xcbe4f9, 0.004);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 1.3);
    sun.position.set(40, 70, -40);
    this.scene.add(sun);
    this.createSnowParticles();
    this.createSnowSpraySystem();
    this.clearAllSkidMarks();

    // Solo da Praça da Vila Alpina
    const groundGeo = new THREE.PlaneGeometry(350, 350, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.hubColliders = [];

    // 1. Estação do Bondinho (Teleférico com cabos para o morro)
    this.scene.add(this.createCableCarBaseStation());
    // Colisores sólidos da estação:
    this.hubColliders.push({ type: 'box', x: 22, z: -20.5, hw: 8.5, hd: 4.2, angle: 0 }); // maquinário/fundo
    this.hubColliders.push({ type: 'box', x: 13.8, z: -15.5, hw: 0.8, hd: 2.8, angle: 0 }); // lateral esquerda
    this.hubColliders.push({ type: 'box', x: 30.2, z: -15.5, hw: 0.8, hd: 2.8, angle: 0 }); // lateral direita
    this.hubColliders.push({ type: 'circle', x: 22, z: -19, r: 1.2 }); // torre de aço

    // 2. Fogueira acolhedora central com bancos
    this.scene.add(this.createBonfire());
    this.hubColliders.push({ type: 'circle', x: -6, z: -2, r: 2.1 }); // poço de fogo
    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * Math.PI * 1.6 + 0.6;
      const bx = -6 + Math.cos(ang) * 4.2;
      const bz = -2 + Math.sin(ang) * 4.2;
      this.hubColliders.push({ type: 'box', x: bx, z: bz, hw: 1.8, hd: 0.65, angle: ang + Math.PI / 2 });
    }

    // 3. Boneco de Neve
    this.scene.add(this.createSnowman());
    this.hubColliders.push({ type: 'circle', x: -16, z: 10, r: 1.4 });

    // 4. Chalés residenciais
    this.scene.add(this.createChalet(-26, 18, 0.3));
    this.hubColliders.push({ type: 'box', x: -26, z: 18, hw: 6.0, hd: 5.4, angle: 0.3 });

    this.scene.add(this.createChalet(4, 26, Math.PI - 0.2));
    this.hubColliders.push({ type: 'box', x: 4, z: 26, hw: 6.0, hd: 5.4, angle: Math.PI - 0.2 });

    // 5. Lojinha Alpina Física (com balcão frontal e vendedor NPC Pingo)
    const shopX = -22;
    const shopZ = -18;
    const shopRot = -0.4;
    this.scene.add(this.createShopBuilding(shopX, shopZ, shopRot));
    this.hubColliders.push({ type: 'box', x: shopX, z: shopZ, hw: 6.0, hd: 5.4, angle: shopRot });
    const cwX = shopX + Math.sin(shopRot) * 5.4;
    const cwZ = shopZ + Math.cos(shopRot) * 5.4;
    this.hubColliders.push({ type: 'box', x: cwX, z: cwZ, hw: 3.0, hd: 0.9, angle: shopRot });
    this.shopInteractionPos.set(shopX + Math.sin(shopRot) * 7.2, 0, shopZ + Math.cos(shopRot) * 7.2);

    // 6. Postes de iluminação da praça com lanternas quentes
    const lampPositions = [
      [-8, 8],
      [10, 4],
      [-10, -12],
      [12, -6]
    ];
    for (const [lx, lz] of lampPositions) {
      this.scene.add(this.createStreetLamp(lx, lz));
      this.hubColliders.push({ type: 'circle', x: lx, z: lz, r: 0.5 });
    }

    // 7. Pinheiros decorativos internos da praça
    const innerTrees = [
      [-18, -4],
      [-8, 22],
      [16, 18],
      [28, 6],
      [6, -18],
      [-34, 2]
    ];
    for (const [tx, tz] of innerTrees) {
      const tree = this.createSnowyPineTree();
      tree.position.set(tx, 0, tz);
      tree.scale.setScalar(0.95);
      this.scene.add(tree);
      this.hubColliders.push({ type: 'circle', x: tx, z: tz, r: 0.9 });
    }

    // 8. Cercas rústicas delimitadoras da vila alpina
    const fences = [
      { x: 0, z: -43, rot: 0, len: 38 },
      { x: 0, z: 43, rot: 0, len: 70 },
      { x: -43, z: 0, rot: Math.PI / 2, len: 70 },
      { x: 43, z: 12, rot: Math.PI / 2, len: 45 }
    ];
    for (const f of fences) {
      this.scene.add(this.createRusticFence(f.x, f.z, f.rot, f.len));
    }

    // 9. Montanhas no horizonte do Hub
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const p = this.createMountainPeak(55 + Math.random() * 20, 80 + Math.random() * 40);
      p.position.set(Math.cos(ang) * 160, 0, Math.sin(ang) * 160);
      this.scene.add(p);
    }

    // 10. Pinheiros nevados no perímetro
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const radius = 46 + Math.random() * 32;
      const tree = this.createSnowyPineTree();
      tree.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      tree.scale.setScalar(0.85 + Math.random() * 0.35);
      this.scene.add(tree);
    }

    // RESET TOTAL DO HUB
    this.playerPosX = 0;
    this.playerPosZ = 0;
    this.playerPosY = 0;
    this.playerVelX = 0;
    this.playerVelZ = 0;
    this.isJumping = false;
    this.jumpVelY = 0;
    this.nearCableCar = false;
    this.nearShop = false;

    this.keyW = false;
    this.keyS = false;
    this.keyA = false;
    this.keyD = false;
    this.keyShift = false;
    this.isRunning = false;
    this.joystickMoveX = 0;
    this.joystickMoveY = 0;

    this.cameraAngleY = 0;
    this.cameraAngleX = 0.35;
    this.cameraDistance = 9;

    this.respawnPlayerMesh();
    this.playerGroup.position.set(0, 0, 0);
    this.playerGroup.rotation.set(0, 0, 0);

    document.getElementById('hub-ui')!.style.display = 'block';
    document.getElementById('racing-hud')!.style.display = 'none';
    document.getElementById('back-hub-btn')!.style.display = 'none';
    document.getElementById('joystick-ui')!.style.display = 'block';
    document.getElementById('run-btn')!.style.display = 'flex';
    document.getElementById('cable-car-prompt')!.style.display = 'none';
    const shopP = document.getElementById('shop-prompt');
    if (shopP) shopP.style.display = 'none';
    this.closeAllModals();
  }

  private loadRacingScene() {
    this.currentScene = 'RACING';
    this.scene.clear();
    
    // Atmosfera Alpina Imersiva (Estilo Sledding Game)
    this.scene.background = new THREE.Color(0xbdddf7);
    this.scene.fog = new THREE.FogExp2(0xcde3f7, 0.0035);

    const ambient = new THREE.AmbientLight(0xdbeafe, 0.85);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(40, 80, -20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    this.scene.add(sun);

    this.createSnowParticles();
    this.createSnowSpraySystem();
    this.clearAllSkidMarks();

    // Pista principal de neve compactada
    const trackGeo = new THREE.PlaneGeometry(48, 5600, 16, 120);
    const trackMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.92 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = -Math.PI / 2;
    track.position.set(0, 0, 2700);
    track.receiveShadow = true;
    this.scene.add(track);

    // Paredões/encostas de neve nas laterais (efeito cânion alpino)
    const bermGeo = new THREE.PlaneGeometry(60, 5600, 8, 60);
    const bermMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.95 });

    const leftBerm = new THREE.Mesh(bermGeo, bermMat);
    leftBerm.rotation.x = -Math.PI / 2;
    leftBerm.rotation.y = 0.24;
    leftBerm.position.set(-48, 4.5, 2700);
    leftBerm.receiveShadow = true;
    this.scene.add(leftBerm);

    const rightBerm = new THREE.Mesh(bermGeo, bermMat);
    rightBerm.rotation.x = -Math.PI / 2;
    rightBerm.rotation.y = -0.24;
    rightBerm.position.set(48, 4.5, 2700);
    rightBerm.receiveShadow = true;
    this.scene.add(rightBerm);

    // Cordilheira de montanhas no horizonte e nas laterais
    for (let mz = 200; mz <= 5200; mz += 380) {
      const p1 = this.createMountainPeak(45 + Math.random() * 20, 65 + Math.random() * 35);
      p1.position.set(-110 - Math.random() * 30, 0, mz + (Math.random() - 0.5) * 80);
      this.scene.add(p1);

      const p2 = this.createMountainPeak(45 + Math.random() * 20, 65 + Math.random() * 35);
      p2.position.set(110 + Math.random() * 30, 0, mz + (Math.random() - 0.5) * 80);
      this.scene.add(p2);
    }

    // Paredão de pinheiros nevados ao longo da pista
    for (let tz = 10; tz <= 5300; tz += 24) {
      const tLeft = this.createSnowyPineTree();
      tLeft.position.set(-25.5 - Math.random() * 8, 0, tz + (Math.random() - 0.5) * 6);
      tLeft.scale.setScalar(0.85 + Math.random() * 0.4);
      this.scene.add(tLeft);

      const tRight = this.createSnowyPineTree();
      tRight.position.set(25.5 + Math.random() * 8, 0, tz + (Math.random() - 0.5) * 6);
      tRight.scale.setScalar(0.85 + Math.random() * 0.4);
      this.scene.add(tRight);
    }

    this.obstacles = [];
    this.gates = [];
    this.ramps = [];

    // Obstáculos (árvores e pedras nevadas dentro da pista)
    let nextZ = 75;
    for (let i = 0; i < 65; i++) {
      const isTree = Math.random() > 0.45;
      const xPos = (Math.random() - 0.5) * 32;

      let obsMesh: THREE.Object3D;
      let radius = 1.3;

      if (isTree) {
        obsMesh = this.createSnowyPineTree();
        obsMesh.scale.setScalar(0.75 + Math.random() * 0.25);
        radius = 1.2;
      } else {
        obsMesh = this.createSnowyRock();
        obsMesh.scale.setScalar(0.85 + Math.random() * 0.3);
        radius = 1.5;
      }

      obsMesh.position.set(xPos, 0, nextZ);
      this.scene.add(obsMesh);
      this.obstacles.push({ mesh: obsMesh, x: xPos, z: nextZ, radius });

      nextZ += 55 + Math.random() * 45;
    }

    // Portais de Slalom (Bandeiras vermelhas e azuis com bônus de pontuação)
    for (let gz = 120; gz < 4900; gz += 110) {
      const colorHex = (Math.floor(gz / 110) % 2 === 0) ? 0xef4444 : 0x0284c7;
      const gate = this.createSlalomGate(colorHex);
      const gateX = (Math.random() - 0.5) * 22;
      gate.position.set(gateX, 0, gz);
      this.scene.add(gate);
      this.gates.push({ mesh: gate, x: gateX, z: gz, passed: false });
    }

    // Rampas de Neve (Kickers para saltos)
    for (let rz = 180; rz < 4900; rz += 240) {
      const ramp = this.createSnowRamp();
      const rampX = (Math.random() - 0.5) * 24;
      ramp.position.set(rampX, 0, rz);
      this.scene.add(ramp);
      this.ramps.push({ mesh: ramp, x: rampX, z: rz });
    }

    // Linha de Chegada / Portal Alpino em Z = 5000
    const finishArch = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({ color: 0x5c3317, roughness: 0.8 });
    const archP1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 9, 8), postMat);
    archP1.position.set(-18, 4.5, 0);
    const archP2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 9, 8), postMat);
    archP2.position.set(18, 4.5, 0);
    const crossBar = new THREE.Mesh(new THREE.BoxGeometry(37, 1.4, 1.2), postMat);
    crossBar.position.set(0, 8.5, 0);

    const bannerMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x7f1d1d });
    const banner = new THREE.Mesh(new THREE.BoxGeometry(34, 2.2, 0.3), bannerMat);
    banner.position.set(0, 7.2, 0);

    finishArch.add(archP1, archP2, crossBar, banner);
    finishArch.position.set(0, 0, 5000);
    this.scene.add(finishArch);

    // RESET TOTAL DE ESTADO DO JOGADOR NA CORRIDA
    this.playerPosX = 0;
    this.playerPosY = 0;
    this.playerPosZ = 0;
    this.playerVelX = 0;
    this.playerVelZ = 0.36;
    this.isJumping = false;
    this.jumpVelY = 0;
    this.score = 0;

    this.keyW = false;
    this.keyS = false;
    this.keyA = false;
    this.keyD = false;
    this.joystickMoveX = 0;
    this.joystickMoveY = 0;

    this.cameraAngleY = 0;
    this.cameraAngleX = 0.35;

    // Câmera posicionada imediatamente atrás do trenó
    this.camera.position.set(0, 2.5, -6.0);
    this.camera.lookAt(0, 0.7, 8.0);

    this.respawnPlayerMesh();
    this.playerGroup.position.set(0, 0, 0);
    this.playerGroup.rotation.set(0.08, 0, 0);

    document.getElementById('hub-ui')!.style.display = 'none';
    document.getElementById('racing-hud')!.style.display = 'block';
    document.getElementById('back-hub-btn')!.style.display = 'block';
    document.getElementById('joystick-ui')!.style.display = 'block';
    document.getElementById('run-btn')!.style.display = 'none';
    document.getElementById('cable-car-prompt')!.style.display = 'none';
  }

  // Animação de subida do Bondinho até o topo da montanha
  private startCableCarClimb() {
    const cutscene = document.getElementById('cable-car-cutscene')!;
    cutscene.style.display = 'flex';

    setTimeout(() => {
      cutscene.style.display = 'none';
      this.loadRacingScene();
    }, 1800);
  }

  // =========================================================================
  // SISTEMA DE LOJINHA E INVENTÁRIO (UI + ESTADO)
  // =========================================================================
  private updateCoinsDisplay() {
    const el1 = document.getElementById('currency-val');
    if (el1) el1.innerText = this.currency.toString();
    const el2 = document.getElementById('shop-coins-val');
    if (el2) el2.innerText = this.currency.toString();
  }

  private renderShop(category: 'sleds' | 'hats' | 'scarves' | 'goggles') {
    const container = document.getElementById('shop-items-container')!;
    container.innerHTML = '';
    const items = SHOP_CATALOG.filter(it => it.category === category);

    for (const it of items) {
      const card = document.createElement('div');
      const isOwned = this.inventory.has(it.id);
      const isEquipped = this.isItemEquipped(it.id, it.category);
      card.className = 'item-card' + (isEquipped ? ' equipped' : '');

      let buttonHtml = '';
      if (isEquipped) {
        buttonHtml = `<button class="item-btn btn-equipped">✓ Equipado</button>`;
      } else if (isOwned) {
        buttonHtml = `<button class="item-btn btn-equip" data-equip="${it.id}" data-cat="${it.category}">Equipar</button>`;
      } else {
        buttonHtml = `<button class="item-btn btn-buy" data-buy="${it.id}">Comprar (${it.price} pts)</button>`;
      }

      card.innerHTML = `
        <div class="item-icon">${it.icon}</div>
        <div class="item-title">${it.name}</div>
        <div class="item-desc">${it.desc}</div>
        ${buttonHtml}
      `;
      container.appendChild(card);
    }

    container.querySelectorAll('[data-buy]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-buy')!;
        this.buyItem(id);
      });
    });

    container.querySelectorAll('[data-equip]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-equip')!;
        const cat = (e.currentTarget as HTMLElement).getAttribute('data-cat') as any;
        this.equipItem(id, cat);
        this.renderShop(category);
      });
    });
  }

  private renderInventory(category: 'sleds' | 'hats' | 'scarves' | 'goggles') {
    const container = document.getElementById('inv-items-container')!;
    container.innerHTML = '';

    // Atualiza resumo
    const sledIt = SHOP_CATALOG.find(i => i.id === this.equipped.vehicle);
    const hatIt = SHOP_CATALOG.find(i => i.id === this.equipped.hat);
    const scarfIt = SHOP_CATALOG.find(i => i.id === this.equipped.scarf);
    const goggIt = SHOP_CATALOG.find(i => i.id === this.equipped.goggles);

    document.getElementById('summary-sled')!.innerText = sledIt ? sledIt.name : this.equipped.vehicle;
    document.getElementById('summary-hat')!.innerText = hatIt ? hatIt.name : this.equipped.hat;
    document.getElementById('summary-scarf')!.innerText = scarfIt ? scarfIt.name : this.equipped.scarf;
    document.getElementById('summary-goggles')!.innerText = goggIt ? goggIt.name : this.equipped.goggles;

    const ownedItems = SHOP_CATALOG.filter(it => it.category === category && this.inventory.has(it.id));

    for (const it of ownedItems) {
      const card = document.createElement('div');
      const isEquipped = this.isItemEquipped(it.id, it.category);
      card.className = 'item-card' + (isEquipped ? ' equipped' : '');

      let buttonHtml = isEquipped
        ? `<button class="item-btn btn-equipped">✓ Em Uso</button>`
        : `<button class="item-btn btn-equip" data-invequip="${it.id}" data-invcat="${it.category}">Equipar</button>`;

      card.innerHTML = `
        <div class="item-icon">${it.icon}</div>
        <div class="item-title">${it.name}</div>
        <div class="item-desc">${it.desc}</div>
        ${buttonHtml}
      `;
      container.appendChild(card);
    }

    container.querySelectorAll('[data-invequip]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-invequip')!;
        const cat = (e.currentTarget as HTMLElement).getAttribute('data-invcat') as any;
        this.equipItem(id, cat);
        this.renderInventory(category);
      });
    });
  }

  private isItemEquipped(id: string, cat: string): boolean {
    if (cat === 'sleds') return this.equipped.vehicle === id;
    if (cat === 'hats') return this.equipped.hat === id;
    if (cat === 'scarves') return this.equipped.scarf === id;
    if (cat === 'goggles') return this.equipped.goggles === id;
    return false;
  }

  private buyItem(id: string) {
    const item = SHOP_CATALOG.find(i => i.id === id);
    if (!item) return;

    if (this.currency >= item.price) {
      this.currency -= item.price;
      this.inventory.add(id);
      this.updateCoinsDisplay();
      this.equipItem(id, item.category);
      alert(`Parabéns! Você adquiriu e equipou: ${item.name}!`);
      this.renderShop(item.category);
    } else {
      alert(`Moedas insuficientes! Você precisa de mais ${item.price - this.currency} pts para comprar este item.`);
    }
  }

  private equipItem(id: string, cat: 'sleds' | 'hats' | 'scarves' | 'goggles') {
    if (cat === 'sleds') this.equipped.vehicle = id;
    if (cat === 'hats') this.equipped.hat = id;
    if (cat === 'scarves') this.equipped.scarf = id;
    if (cat === 'goggles') this.equipped.goggles = id;

    // Reconstrói o avatar instantaneamente com as novas peças visuais
    this.respawnPlayerMesh();
  }

  private isAnyModalOpen(): boolean {
    const s = document.getElementById('shop-modal');
    const i = document.getElementById('inventory-modal');
    return (s && s.style.display === 'flex') || (i && i.style.display === 'flex') || false;
  }

  private closeAllModals() {
    const s = document.getElementById('shop-modal');
    const i = document.getElementById('inventory-modal');
    if (s) s.style.display = 'none';
    if (i) i.style.display = 'none';
    this.keyW = false;
    this.keyS = false;
    this.keyA = false;
    this.keyD = false;
  }

  private toggleInventoryModal() {
    const invModal = document.getElementById('inventory-modal')!;
    const shopModal = document.getElementById('shop-modal')!;
    if (invModal.style.display === 'flex') {
      invModal.style.display = 'none';
    } else {
      shopModal.style.display = 'none';
      this.renderInventory('sleds');
      invModal.style.display = 'flex';
      this.keyW = false;
      this.keyS = false;
      this.keyA = false;
      this.keyD = false;
    }
  }

  private openShopModal() {
    const shopModal = document.getElementById('shop-modal')!;
    const invModal = document.getElementById('inventory-modal')!;
    invModal.style.display = 'none';
    this.updateCoinsDisplay();
    this.renderShop('sleds');
    shopModal.style.display = 'flex';
    this.keyW = false;
    this.keyS = false;
    this.keyA = false;
    this.keyD = false;
  }

  // Modais de Loja e Inventário
  private setupModalsAndPrompts() {
    const shopModal = document.getElementById('shop-modal')!;
    const invModal = document.getElementById('inventory-modal')!;

    document.getElementById('open-shop-btn')!.addEventListener('click', () => {
      this.openShopModal();
    });

    document.getElementById('close-shop-btn')!.addEventListener('click', () => {
      shopModal.style.display = 'none';
    });

    document.getElementById('open-inventory-btn')!.addEventListener('click', () => {
      this.toggleInventoryModal();
    });

    document.getElementById('close-inv-btn')!.addEventListener('click', () => {
      invModal.style.display = 'none';
    });

    // Fechar ao clicar fora do cartão modal
    shopModal.addEventListener('click', (e) => {
      if (e.target === shopModal) shopModal.style.display = 'none';
    });
    invModal.addEventListener('click', (e) => {
      if (e.target === invModal) invModal.style.display = 'none';
    });

    // Prompt da Lojinha Alpina
    const shopPrompt = document.getElementById('shop-prompt');
    if (shopPrompt) {
      shopPrompt.addEventListener('click', () => {
        this.openShopModal();
      });
    }

    // Abas da Loja
    document.querySelectorAll('[data-shop-tab]').forEach(tabBtn => {
      tabBtn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-shop-tab]').forEach(b => b.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');
        const cat = (e.currentTarget as HTMLElement).getAttribute('data-shop-tab') as any;
        this.renderShop(cat);
      });
    });

    // Abas do Inventário
    document.querySelectorAll('[data-inv-tab]').forEach(tabBtn => {
      tabBtn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-inv-tab]').forEach(b => b.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');
        const cat = (e.currentTarget as HTMLElement).getAttribute('data-inv-tab') as any;
        this.renderInventory(cat);
      });
    });
  }

  // Interação com o Bondinho
  private setupCableCarInteraction() {
    const cablePrompt = document.getElementById('cable-car-prompt')!;
    cablePrompt.addEventListener('click', () => {
      this.startCableCarClimb();
    });
  }

  // =========================================================================
  // SETUP DE CONTROLES E EVENTOS
  // =========================================================================
  private setupUIAndControls() {
    const loginScreen = document.getElementById('login-screen')!;

    const startSession = (name: string) => {
      loginScreen.style.display = 'none';
      this.loadHubScene();
    };

    document.getElementById('login-btn')!.addEventListener('click', () => {
      const input = (document.getElementById('username-input') as HTMLInputElement).value.trim();
      startSession(input || 'Racer_' + Math.floor(Math.random() * 1000));
    });

    document.getElementById('quick-login-btn')!.addEventListener('click', () => {
      startSession('Pro_Racer_2026');
    });

    document.getElementById('back-hub-btn')!.addEventListener('click', () => {
      this.loadHubScene();
    });

    // Configuração dos modais e prompts
    this.setupModalsAndPrompts();
    this.setupCableCarInteraction();

    // Analógico Virtual
    const joystickBase = document.getElementById('joystick-base')!;
    joystickBase.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.activeJoystickPointerId = e.pointerId;
      this.joystickActive = true;
      this.joystickStartX = e.clientX;
      this.joystickStartY = e.clientY;
      joystickBase.setPointerCapture(e.pointerId);
    });

    joystickBase.addEventListener('pointermove', (e) => {
      if (!this.joystickActive || e.pointerId !== this.activeJoystickPointerId) return;
      e.stopPropagation();
      
      const dx = e.clientX - this.joystickStartX;
      const dy = e.clientY - this.joystickStartY;
      const dist = Math.min(45, Math.sqrt(dx * dx + dy * dy));
      const angle = Math.atan2(dy, dx);

      this.joystickMoveX = (Math.cos(angle) * dist) / 45;
      this.joystickMoveY = -(Math.sin(angle) * dist) / 45;

      const knob = document.getElementById('joystick-knob')!;
      knob.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
    });

    const endJoystick = (e: any) => {
      if (e.pointerId === this.activeJoystickPointerId) {
        this.activeJoystickPointerId = null;
        this.joystickActive = false;
        this.joystickMoveX = 0;
        this.joystickMoveY = 0;
        const knob = document.getElementById('joystick-knob')!;
        knob.style.transform = `translate(0px, 0px)`;
      }
    };

    joystickBase.addEventListener('pointerup', endJoystick);
    joystickBase.addEventListener('pointercancel', endJoystick);

    // Câmera Órbita 360° (Hub)
    window.addEventListener('pointerdown', (e) => {
      if (this.currentScene !== 'HUB') return;
      const target = e.target as HTMLElement;
      if (target && (target.closest('#hub-ui') || target.closest('#joystick-ui') || target.closest('#jump-btn') || target.closest('#run-btn') || target.closest('#cable-car-prompt') || target.closest('#shop-prompt') || target.closest('.modal-card') || target.closest('button') || target.closest('input'))) return;
      
      this.activeOrbitPointerId = e.pointerId;
      this.isDragging = true;
      this.previousTouchX = e.clientX;
      this.previousTouchY = e.clientY;
    });

    window.addEventListener('pointermove', (e) => {
      if (this.currentScene !== 'HUB') return;
      if (!this.isDragging || e.pointerId !== this.activeOrbitPointerId) return;
      const deltaX = e.clientX - this.previousTouchX;
      const deltaY = e.clientY - this.previousTouchY;
      
      this.cameraAngleY -= deltaX * 0.005;
      this.cameraAngleX = Math.max(0.1, Math.min(1.4, this.cameraAngleX + deltaY * 0.005));
      
      this.previousTouchX = e.clientX;
      this.previousTouchY = e.clientY;
    });

    const endOrbit = (e: any) => {
      if (e.pointerId === this.activeOrbitPointerId) {
        this.activeOrbitPointerId = null;
        this.isDragging = false;
      }
    };

    window.addEventListener('pointerup', endOrbit);
    window.addEventListener('pointercancel', endOrbit);

    // Pulo com física fluida
    const triggerJump = () => {
      if (!this.isJumping) {
        this.isJumping = true;
        this.jumpVelY = this.currentScene === 'RACING' ? 0.44 : 0.40;
      }
    };

    const jumpBtn = document.getElementById('jump-btn')!;
    jumpBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      triggerJump();
    });

    // Botão de Correr Dedicado (Mobile)
    const runBtn = document.getElementById('run-btn')!;
    runBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.isRunning = !this.isRunning;
      runBtn.classList.toggle('active', this.isRunning);
    });

    window.addEventListener('keydown', (e) => {
      // Tecla TAB: Alterna Menu de Equipamentos / Inventário
      if (e.key === 'Tab' || e.code === 'Tab') {
        e.preventDefault();
        this.toggleInventoryModal();
        return;
      }

      // Tecla ESC: Fecha qualquer modal aberto
      if (e.key === 'Escape') {
        this.closeAllModals();
        return;
      }

      // Se modal estiver aberto, ignora movimentação
      if (this.isAnyModalOpen()) return;

      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') this.keyW = true;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') this.keyS = true;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') this.keyA = true;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') this.keyD = true;
      if (e.key === 'Shift') { this.keyShift = true; this.isRunning = true; }
      if (e.key === ' ') triggerJump();
      
      // Tecla E para interagir com Lojinha ou Bondinho
      if ((e.key === 'e' || e.key === 'E') && this.currentScene === 'HUB') {
        if (this.nearShop) {
          this.openShopModal();
        } else if (this.nearCableCar) {
          this.startCableCarClimb();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') this.keyW = false;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') this.keyS = false;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') this.keyA = false;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') this.keyD = false;
      if (e.key === 'Shift') { this.keyShift = false; this.isRunning = false; }
    });
  }

  // ==========================================
  // GAME LOOP PRINCIPAL (60 FPS)
  // ==========================================
  private loop = () => {
    requestAnimationFrame(this.loop);

    let inputForward = this.joystickMoveY;
    let inputLateral = this.joystickMoveX;

    if (this.keyW) inputForward = 1;
    if (this.keyS) inputForward = -1;
    if (this.keyA) inputLateral = -1;
    if (this.keyD) inputLateral = 1;

    if (this.currentScene === 'HUB') {
      // MOVIMENTAÇÃO NO HUB A PÉ COM ANIMAÇÃO PROCEDURAL
      const running = this.isRunning || this.keyShift;
      const moveSpeed = running ? 0.28 : 0.15;
      const isMoving = Math.abs(inputForward) > 0.05 || Math.abs(inputLateral) > 0.05;

      if (isMoving) {
        const forward = new THREE.Vector3(-Math.sin(this.cameraAngleY), 0, -Math.cos(this.cameraAngleY));
        const lateral = new THREE.Vector3(Math.cos(this.cameraAngleY), 0, -Math.sin(this.cameraAngleY));

        const moveDir = new THREE.Vector3()
          .addScaledVector(forward, inputForward)
          .addScaledVector(lateral, inputLateral)
          .normalize();

        const desiredX = this.playerPosX + moveDir.x * moveSpeed;
        const desiredZ = this.playerPosZ + moveDir.z * moveSpeed;

        const resolved = this.resolveHubCollisions(desiredX, desiredZ, 0.85);
        this.playerPosX = resolved.x;
        this.playerPosZ = resolved.z;

        this.playerGroup.rotation.y = Math.atan2(moveDir.x, moveDir.z);

        // Animação de caminhada/corrida dos membros do pinguim
        this.walkTime += running ? 0.28 : 0.16;
        this.animatePenguinWalk(this.walkTime, running);

        if (this.playerPosY === 0) {
          this.addContinuousSnowTrail(this.playerPosX, this.playerPosY, this.playerPosZ, this.playerGroup.rotation.y);
          this.emitSnowSpray(running ? 2 : 1, 0);
        }
      } else {
        this.animatePenguinIdle();
        this.prevTrailLeft = null;
        this.prevTrailRight = null;
      }

      this.updateSnowSpray();

      // Pulo flutuante no Hub
      if (this.isJumping) {
        this.playerPosY += this.jumpVelY;
        this.jumpVelY -= 0.014;
        if (this.playerPosY <= 0) {
          this.playerPosY = 0;
          this.isJumping = false;
          this.jumpVelY = 0;
          this.emitSnowSpray(8, 0);
        }
      }

      // Clamping de segurança
      const bounds = 44;
      this.playerPosX = Math.max(-bounds, Math.min(bounds, this.playerPosX));
      this.playerPosZ = Math.max(-bounds, Math.min(bounds, this.playerPosZ));

      this.playerGroup.position.set(this.playerPosX, this.playerPosY, this.playerPosZ);

      // Verificação de proximidade da Estação do Bondinho
      const boardingGatePos = new THREE.Vector3(22, 0, -14);
      const distToStation = boardingGatePos.distanceTo(new THREE.Vector3(this.playerPosX, 0, this.playerPosZ));
      const promptEl = document.getElementById('cable-car-prompt')!;
      if (distToStation < 7.0) {
        this.nearCableCar = true;
        promptEl.style.display = 'block';
      } else {
        this.nearCableCar = false;
        promptEl.style.display = 'none';
      }

      // Verificação de proximidade da Lojinha Alpina Física
      const distToShop = this.shopInteractionPos.distanceTo(new THREE.Vector3(this.playerPosX, 0, this.playerPosZ));
      const shopPromptEl = document.getElementById('shop-prompt');
      if (shopPromptEl) {
        if (distToShop < 5.8) {
          this.nearShop = true;
          shopPromptEl.style.display = 'block';
        } else {
          this.nearShop = false;
          shopPromptEl.style.display = 'none';
        }
      }

      // Animação acolhedora do Lojista Pingo
      if (this.merchantPenguin) {
        this.merchantPenguin.rotation.y = Math.sin(Date.now() * 0.002) * 0.18;
      }

      // Animação das fagulhas da fogueira
      if (this.bonfireEmbers && this.bonfireLight) {
        this.bonfireLight.intensity = 2.4 + Math.sin(Date.now() * 0.01) * 0.4;
        const posArr = (this.bonfireEmbers.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
        for (let i = 0; i < this.bonfireEmberData.length; i++) {
          const emb = this.bonfireEmberData[i];
          emb.y += emb.vy;
          emb.x += emb.vx;
          emb.z += emb.vz;
          emb.life++;
          if (emb.life > 35) {
            emb.y = 0.3;
            emb.x = (Math.random() - 0.5) * 0.8;
            emb.z = (Math.random() - 0.5) * 0.8;
            emb.life = 0;
          }
          posArr[i * 3] = emb.x;
          posArr[i * 3 + 1] = emb.y;
          posArr[i * 3 + 2] = emb.z;
        }
        this.bonfireEmbers.geometry.getAttribute('position').needsUpdate = true;
      }

      // Câmera Órbita 360° do Hub
      const camX = this.playerPosX + Math.sin(this.cameraAngleY) * (this.cameraDistance * Math.cos(this.cameraAngleX));
      const camZ = this.playerPosZ + Math.cos(this.cameraAngleY) * (this.cameraDistance * Math.cos(this.cameraAngleX));
      const camY = this.playerPosY + Math.sin(this.cameraAngleX) * this.cameraDistance + 2;
      
      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(this.playerPosX, this.playerPosY + 0.5, this.playerPosZ);

    } else if (this.currentScene === 'RACING') {
      // =========================================================================
      // FÍSICA DE DESCIDA BALANCEADA & DIREÇÃO CORRETA (ESTILO SLEDDING GAME)
      // =========================================================================
      const baseCruise = 0.48;
      if (this.playerVelZ < baseCruise) {
        this.playerVelZ += 0.0015;
      }

      // W / Analógico Cima: Projeção aerodinâmica (boost suave)
      // S / Analógico Baixo: Frenagem na neve com spray
      if (inputForward > 0.1) {
        this.playerVelZ = Math.min(0.68, this.playerVelZ + 0.004);
      } else if (inputForward < -0.1) {
        this.playerVelZ = Math.max(0.18, this.playerVelZ - 0.012);
        this.emitSnowSpray(4, 0);
      }

      // Direção correta: D esterça para a Direita da tela (-X), A esterça para a Esquerda (+X)
      const steeringSensitivity = 0.046;
      this.playerVelX -= inputLateral * steeringSensitivity;
      this.playerVelX *= 0.88;
      this.playerVelX = Math.max(-0.48, Math.min(0.48, this.playerVelX));

      this.playerPosX += this.playerVelX;
      this.playerPosZ += this.playerVelZ;

      // Limites de pista
      if (this.playerPosX < -23.5) { this.playerPosX = -23.5; this.playerVelX = 0; }
      if (this.playerPosX > 23.5) { this.playerPosX = 23.5; this.playerVelX = 0; }

      // Física de salto com hang-time estendido
      if (this.isJumping) {
        this.playerPosY += this.jumpVelY;
        this.jumpVelY -= 0.012;

        const pitchAngle = 0.08 - this.jumpVelY * 0.35;
        this.playerGroup.rotation.x = pitchAngle;
        this.playerGroup.rotation.z = -this.playerVelX * 1.1;

        if (this.playerPosY <= 0) {
          this.playerPosY = 0;
          this.isJumping = false;
          this.jumpVelY = 0;
          this.playerGroup.rotation.x = 0.08;
          this.emitSnowSpray(18, 0);
        }
      } else {
        this.playerGroup.rotation.z = -this.playerVelX * 0.92;
        this.playerGroup.rotation.y = this.playerVelX * 0.38;
        this.playerGroup.rotation.x = 0.08;
      }

      this.playerGroup.position.set(this.playerPosX, this.playerPosY, this.playerPosZ);

      // Rastro duplo contínuo e spray
      if (this.playerPosY === 0) {
        this.addContinuousSnowTrail(this.playerPosX, this.playerPosY, this.playerPosZ, this.playerGroup.rotation.y);
        const isCarving = Math.abs(this.playerVelX) > 0.06;
        this.emitSnowSpray(isCarving ? 3 : 1, this.playerVelX);
      } else {
        this.prevTrailLeft = null;
        this.prevTrailRight = null;
      }

      this.updateSnowSpray();

      // Colisão com Portais de Slalom (+100 pontos)
      for (const gate of this.gates) {
        if (!gate.passed && Math.abs(this.playerPosZ - gate.z) < 1.8) {
          if (Math.abs(this.playerPosX - gate.x) < 2.8) {
            gate.passed = true;
            this.score += 100;
            this.currency += 10;
            this.updateCoinsDisplay();
            this.emitSnowSpray(10, 0);
          }
        }
      }

      // Colisão com Rampas de Neve (Salto dinâmico)
      for (const ramp of this.ramps) {
        if (!this.isJumping && Math.abs(this.playerPosZ - ramp.z) < 2.0) {
          if (Math.abs(this.playerPosX - ramp.x) < 2.4) {
            this.isJumping = true;
            this.jumpVelY = 0.58;
            this.score += 150;
            this.currency += 15;
            this.updateCoinsDisplay();
            this.emitSnowSpray(14, 0);
          }
        }
      }

      // Colisão com Obstáculos
      for (const obs of this.obstacles) {
        const dx = this.playerPosX - obs.x;
        const dz = this.playerPosZ - obs.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < obs.radius && this.playerPosY < 0.6) {
          this.playerVelZ = 0.18;
          this.score = Math.max(0, this.score - 50);
          this.emitSnowSpray(10, 0);
        }
      }

      // Pontuação
      this.score += Math.round(this.playerVelZ * 3.5);
      const scoreEl = document.getElementById('score-val');
      if (scoreEl) scoreEl.innerText = this.score.toString();

      const speedEl = document.getElementById('speed-val');
      if (speedEl) speedEl.innerText = Math.round(this.playerVelZ * 80).toString();

      // Câmera Chase 3ª pessoa
      const targetCamX = this.playerPosX * 0.55;
      const targetCamY = this.playerPosY + 2.4;
      const targetCamZ = this.playerPosZ - 5.8;

      this.camera.position.x += (targetCamX - this.camera.position.x) * 0.12;
      this.camera.position.y += (targetCamY - this.camera.position.y) * 0.12;
      this.camera.position.z = targetCamZ;

      const lookTargetX = this.playerPosX * 0.75;
      const lookTargetY = this.playerPosY + 0.6;
      const lookTargetZ = this.playerPosZ + 9.0;
      this.camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);

      if (this.snowParticles) {
        this.snowParticles.position.z = this.playerPosZ;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new SnowSlideTPSMasterEngine();
});
