import * as THREE from 'three';
import { Client } from 'colyseus.js';
import { GameState } from '@snow-slide/shared';

const GAME_VERSION = "v1.5.0-STABLE";

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
  
  private currentVehicle = 'board';
  private currency = 1250;
  private score = 0;
  
  private otherPlayers: Map<string, THREE.Group> = new Map();
  private obstacles: { mesh: THREE.Object3D; x: number; z: number; radius: number }[] = [];
  private gates: { mesh: THREE.Object3D; x: number; z: number; passed: boolean }[] = [];
  private ramps: { mesh: THREE.Object3D; x: number; z: number }[] = [];
  private skidMarks: { mesh: THREE.Mesh; createdAt: number }[] = [];
  private snowParticles!: THREE.Points;
  private snowSprayPoints!: THREE.Points;
  private sprayData: { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number }[] = [];

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

  constructor() {
    this.initEngine();
  }

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
    const count = 120;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) positions[i] = 0;
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.45,
      transparent: true,
      opacity: 0.8
    });
    this.snowSprayPoints = new THREE.Points(geo, mat);
    this.sprayData = [];
    for (let i = 0; i < count; i++) {
      this.sprayData.push({ x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0 });
    }
    this.scene.add(this.snowSprayPoints);
  }

  private emitSnowSpray(count: number, lateralBoost = 0) {
    if (!this.snowSprayPoints) return;
    let emitted = 0;
    for (let i = 0; i < this.sprayData.length; i++) {
      const p = this.sprayData[i];
      if (p.life <= 0) {
        p.x = this.playerPosX + (Math.random() - 0.5) * 0.5;
        p.y = this.playerPosY + 0.08;
        p.z = this.playerPosZ - 0.7;
        p.vx = (Math.random() - 0.5) * 0.12 - lateralBoost * 0.3;
        p.vy = 0.04 + Math.random() * 0.08;
        p.vz = -0.12 - Math.random() * 0.15;
        p.life = 16 + Math.floor(Math.random() * 12);
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

  private addSkidMark(x: number, y: number, z: number, headingRad: number) {
    const trackGeo = new THREE.PlaneGeometry(0.18, 1.2);
    const trackMat = new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });

    const offset = 0.42;
    const cosH = Math.cos(headingRad);
    const sinH = Math.sin(headingRad);

    const markL = new THREE.Mesh(trackGeo, trackMat);
    markL.rotation.x = -Math.PI / 2;
    markL.rotation.z = -headingRad;
    markL.position.set(x - cosH * offset, y + 0.02, z + sinH * offset);
    this.scene.add(markL);
    this.skidMarks.push({ mesh: markL, createdAt: Date.now() });

    const markR = new THREE.Mesh(trackGeo, trackMat);
    markR.rotation.x = -Math.PI / 2;
    markR.rotation.z = -headingRad;
    markR.position.set(x + cosH * offset, y + 0.02, z - sinH * offset);
    this.scene.add(markR);
    this.skidMarks.push({ mesh: markR, createdAt: Date.now() });

    while (this.skidMarks.length > 250) {
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
  }

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
    this.scene.fog = new THREE.FogExp2(0xcbe4f9, 0.005);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 1.3);
    sun.position.set(40, 70, -40);
    this.scene.add(sun);
    this.createSnowParticles();
    this.createSnowSpraySystem();
    this.clearAllSkidMarks();

    const groundGeo = new THREE.PlaneGeometry(300, 300, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const cabinGroup = new THREE.Group();
    const walls = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 10), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 }));
    walls.position.y = 3;
    walls.castShadow = true;
    cabinGroup.add(walls);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(7, 3.5, 4), new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 }));
    roof.position.y = 7.5;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    cabinGroup.add(roof);
    cabinGroup.position.set(-25, 0, 20);
    this.scene.add(cabinGroup);

    const stationGroup = new THREE.Group();
    const station = new THREE.Mesh(new THREE.BoxGeometry(12, 7, 14), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 }));
    station.position.y = 3.5;
    station.castShadow = true;
    stationGroup.add(station);

    const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    signPost.position.set(0, 2, 7);
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 0.2), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    signBoard.position.set(0, 4.2, 7);
    stationGroup.add(signPost, signBoard);
    
    stationGroup.position.set(25, 0, -20);
    this.scene.add(stationGroup);

    // Floresta alpina ao redor do Hub
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const radius = 55 + Math.random() * 35;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const tree = this.createSnowyPineTree();
      tree.position.set(x, 0, z);
      tree.scale.setScalar(0.85 + Math.random() * 0.35);
      this.scene.add(tree);
    }

    // RESET DE ESTADO E CÂMERA DO HUB
    this.playerPosX = 0;
    this.playerPosZ = 0;
    this.playerPosY = 0;
    this.playerVelX = 0;
    this.playerVelZ = 0;
    this.isJumping = false;
    this.jumpVelY = 0;

    this.keyW = false;
    this.keyS = false;
    this.keyA = false;
    this.keyD = false;
    this.joystickMoveX = 0;
    this.joystickMoveY = 0;

    this.cameraAngleY = 0;
    this.cameraAngleX = 0.35;
    this.cameraDistance = 10;

    this.respawnPlayerMesh();
    this.playerGroup.position.set(0, 0, 0);
    this.playerGroup.rotation.set(0, 0, 0);

    document.getElementById('hub-ui')!.style.display = 'block';
    document.getElementById('racing-hud')!.style.display = 'none';
    document.getElementById('back-hub-btn')!.style.display = 'none';
    document.getElementById('joystick-ui')!.style.display = 'block';
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

    // Paredões/encostas de neve nas laterais (efeito cânion/half-pipe alpino)
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
    this.playerVelZ = 0.36; // Início suave e controlado
    this.isJumping = false;
    this.jumpVelY = 0;
    this.score = 0;

    // Reset de inputs e teclas
    this.keyW = false;
    this.keyS = false;
    this.keyA = false;
    this.keyD = false;
    this.joystickMoveX = 0;
    this.joystickMoveY = 0;

    // Reset de ângulos de órbita do Hub
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
  }

  private createAvatarMesh(charType: string, vehicleType: string): THREE.Group {
    const group = new THREE.Group();
    
    // Veículo (Prancha de Snowboard ou Trenó)
    const vGeo = vehicleType === 'board' ? new THREE.BoxGeometry(1.3, 0.12, 2.4) : new THREE.BoxGeometry(1.6, 0.18, 2.5);
    const vMat = new THREE.MeshStandardMaterial({
      color: vehicleType === 'board' ? 0x0284c7 : 0xb45309,
      roughness: 0.35
    });
    const vehicle = new THREE.Mesh(vGeo, vMat);
    vehicle.position.y = 0.06;
    vehicle.castShadow = true;
    group.add(vehicle);

    // Corpo do Pinguim
    const bodyGeo = new THREE.CapsuleGeometry(0.42, 0.65, 12, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: charType === 'penguin' ? 0x0f172a : 0xf59e0b,
      roughness: 0.4
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.65;
    body.castShadow = true;
    group.add(body);

    // Barriguinha branca
    const bellyGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    const belly = new THREE.Mesh(bellyGeo, bellyMat);
    belly.position.set(0, 0.62, 0.22);
    belly.scale.set(0.8, 1.05, 0.5);
    group.add(belly);

    // Cabeça
    const headGeo = new THREE.SphereGeometry(0.34, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: charType === 'penguin' ? 0x0f172a : 0xf59e0b,
      roughness: 0.4
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.18;
    head.castShadow = true;
    group.add(head);

    // Bico laranja (aponta para frente +Z)
    const beakGeo = new THREE.ConeGeometry(0.12, 0.28, 6);
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 1.15, 0.42);
    group.add(beak);

    // Olhos
    const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const pupilGeo = new THREE.SphereGeometry(0.03, 6, 6);
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });

    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.14, 1.25, 0.28);
    const pL = new THREE.Mesh(pupilGeo, pupilMat);
    pL.position.set(-0.14, 1.25, 0.33);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.14, 1.25, 0.28);
    const pR = new THREE.Mesh(pupilGeo, pupilMat);
    pR.position.set(0.14, 1.25, 0.33);

    group.add(eyeL, pL, eyeR, pR);

    return group;
  }

  private respawnPlayerMesh() {
    if (this.playerGroup) this.scene.remove(this.playerGroup);
    this.playerGroup = this.createAvatarMesh('penguin', this.currentVehicle);
    this.scene.add(this.playerGroup);
  }

  private setupUIAndControls() {
    const loginScreen = document.getElementById('login-screen')!;
    const currencyEl = document.getElementById('currency-val')!;

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

    document.getElementById('board-shop-btn')!.addEventListener('click', () => {
      if (this.currency >= 500) {
        this.currency -= 500;
        currencyEl.innerText = this.currency.toString();
        this.currentVehicle = this.currentVehicle === 'board' ? 'sled' : 'board';
        alert(`Veículo equipado com sucesso: ${this.currentVehicle.toUpperCase()}!`);
        this.respawnPlayerMesh();
      } else {
        alert('Moedas insuficientes!');
      }
    });

    document.getElementById('cable-car-btn')!.addEventListener('click', () => {
      this.loadRacingScene();
    });

    document.getElementById('back-hub-btn')!.addEventListener('click', () => {
      this.loadHubScene();
    });

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

    // Câmera Órbita 360° (Apenas ativa no Hub)
    window.addEventListener('pointerdown', (e) => {
      if (this.currentScene !== 'HUB') return;
      const target = e.target as HTMLElement;
      if (target && (target.closest('#hub-ui') || target.closest('#joystick-ui') || target.closest('#jump-btn') || target.closest('button') || target.closest('input'))) return;
      
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

    // Botão de Pulo Dedicado
    const jumpBtn = document.getElementById('jump-btn')!;
    jumpBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (!this.isJumping) {
        this.isJumping = true;
        this.jumpVelY = 0.38;
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') this.keyW = true;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') this.keyS = true;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') this.keyA = true;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') this.keyD = true;
      if (e.key === ' ' && !this.isJumping) {
        this.isJumping = true;
        this.jumpVelY = 0.38;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') this.keyW = false;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') this.keyS = false;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') this.keyA = false;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') this.keyD = false;
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
      const speed = 0.22;

      if (Math.abs(inputForward) > 0.05 || Math.abs(inputLateral) > 0.05) {
        // Direção da Câmera no Hub
        const forward = new THREE.Vector3(-Math.sin(this.cameraAngleY), 0, -Math.cos(this.cameraAngleY));
        const lateral = new THREE.Vector3(Math.cos(this.cameraAngleY), 0, -Math.sin(this.cameraAngleY));

        const moveDir = new THREE.Vector3()
          .addScaledVector(forward, inputForward)
          .addScaledVector(lateral, inputLateral)
          .normalize();

        this.playerPosX += moveDir.x * speed;
        this.playerPosZ += moveDir.z * speed;

        this.playerGroup.rotation.y = Math.atan2(moveDir.x, moveDir.z);

        if (this.playerPosY === 0) {
          this.addSkidMark(this.playerPosX, this.playerPosY, this.playerPosZ, this.playerGroup.rotation.y);
          this.emitSnowSpray(1, 0);
        }
      }

      this.updateSnowSpray();

      if (this.isJumping) {
        this.playerPosY += this.jumpVelY;
        this.jumpVelY -= 0.025;
        if (this.playerPosY <= 0) {
          this.playerPosY = 0;
          this.isJumping = false;
          this.jumpVelY = 0;
          this.emitSnowSpray(8, 0);
        }
      }

      this.playerPosX = Math.max(-120, Math.min(120, this.playerPosX));
      this.playerPosZ = Math.max(-120, Math.min(120, this.playerPosZ));

      this.playerGroup.position.set(this.playerPosX, this.playerPosY, this.playerPosZ);

      // Câmera Órbita 360° do Hub
      const camX = this.playerPosX + Math.sin(this.cameraAngleY) * (this.cameraDistance * Math.cos(this.cameraAngleX));
      const camZ = this.playerPosZ + Math.cos(this.cameraAngleY) * (this.cameraDistance * Math.cos(this.cameraAngleX));
      const camY = this.playerPosY + Math.sin(this.cameraAngleX) * this.cameraDistance + 2;
      
      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(this.playerPosX, this.playerPosY + 0.5, this.playerPosZ);

      if (this.room) {
        this.room.send('updatePosition', {
          x: this.playerPosX,
          y: this.playerPosY,
          z: this.playerPosZ,
          rotY: this.playerGroup.rotation.y
        });
      }

    } else if (this.currentScene === 'RACING') {
      // FÍSICA DE DESCIDA BALANCEADA (Estilo Sledding Game)
      const baseCruise = 0.48;
      if (this.playerVelZ < baseCruise) {
        this.playerVelZ += 0.0015;
      }

      // W / Analógico Cima: Projeção aerodinâmica (boost suave até 0.68)
      // S / Analógico Baixo: Frenagem na neve (spray de neve até 0.18)
      if (inputForward > 0.1) {
        this.playerVelZ = Math.min(0.68, this.playerVelZ + 0.004);
      } else if (inputForward < -0.1) {
        this.playerVelZ = Math.max(0.18, this.playerVelZ - 0.012);
        this.emitSnowSpray(3, 0);
      }

      // Direção lateral suave e responsiva com amortecimento de atrito
      const steeringSensitivity = 0.042;
      this.playerVelX += inputLateral * steeringSensitivity;
      this.playerVelX *= 0.88;
      this.playerVelX = Math.max(-0.45, Math.min(0.45, this.playerVelX));

      this.playerPosX += this.playerVelX;
      this.playerPosZ += this.playerVelZ;

      // Limites de pista seguros (-23.5 a +23.5)
      if (this.playerPosX < -23.5) {
        this.playerPosX = -23.5;
        this.playerVelX = 0;
      }
      if (this.playerPosX > 23.5) {
        this.playerPosX = 23.5;
        this.playerVelX = 0;
      }

      // Pulos e física vertical
      if (this.isJumping) {
        this.playerPosY += this.jumpVelY;
        this.jumpVelY -= 0.022;
        if (this.playerPosY <= 0) {
          this.playerPosY = 0;
          this.isJumping = false;
          this.jumpVelY = 0;
          this.emitSnowSpray(10, 0);
        }
      }

      // Animação de inclinação dinâmica do avatar
      this.playerGroup.position.set(this.playerPosX, this.playerPosY, this.playerPosZ);
      this.playerGroup.rotation.z = -this.playerVelX * 0.85; // Inclinação na curva
      this.playerGroup.rotation.y = this.playerVelX * 0.35;  // Rotação suave do bico
      this.playerGroup.rotation.x = 0.08;                    // Inclinação da descida

      // Rastro duplo na neve e spray de neve contínuo
      if (this.playerPosY === 0) {
        this.addSkidMark(this.playerPosX, this.playerPosY, this.playerPosZ, this.playerGroup.rotation.y);
        const isCarving = Math.abs(this.playerVelX) > 0.08;
        this.emitSnowSpray(isCarving ? 2 : 1, this.playerVelX);
      }

      this.updateSnowSpray();

      // Colisão com Portais de Slalom (+100 pontos)
      for (const gate of this.gates) {
        if (!gate.passed && Math.abs(this.playerPosZ - gate.z) < 1.6) {
          if (Math.abs(this.playerPosX - gate.x) < 2.8) {
            gate.passed = true;
            this.score += 100;
            this.emitSnowSpray(8, 0);
          }
        }
      }

      // Colisão com Rampas de Neve (Salto dinâmico)
      for (const ramp of this.ramps) {
        if (!this.isJumping && Math.abs(this.playerPosZ - ramp.z) < 2.0) {
          if (Math.abs(this.playerPosX - ramp.x) < 2.4) {
            this.isJumping = true;
            this.jumpVelY = 0.38;
            this.score += 75;
            this.emitSnowSpray(10, 0);
          }
        }
      }

      // Colisão com Obstáculos (árvores e rochas)
      for (const obs of this.obstacles) {
        const dx = this.playerPosX - obs.x;
        const dz = this.playerPosZ - obs.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < obs.radius && this.playerPosY < 0.6) {
          this.playerVelZ = 0.18;
          this.score = Math.max(0, this.score - 50);
          this.emitSnowSpray(8, 0);
        }
      }

      // Pontuação por distância
      this.score += Math.round(this.playerVelZ * 3.5);
      const scoreEl = document.getElementById('score-val');
      if (scoreEl) scoreEl.innerText = this.score.toString();

      const speedEl = document.getElementById('speed-val');
      if (speedEl) speedEl.innerText = Math.round(this.playerVelZ * 80).toString();

      // CÂMERA CHASE DEDICADA DE 3ª PESSOA (Desacoplada de rotações do Hub)
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
