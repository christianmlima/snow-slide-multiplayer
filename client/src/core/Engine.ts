import * as THREE from 'three';
import { NetworkManager } from '../network/NetworkManager';
import {
  CharacterId,
  CharacterRig,
  EquippedState,
  HubCollider,
  BenchSpot,
  WanderingNPC,
  ActiveSnowball,
  CarnivalTarget,
  WarBot,
  WarObstacle,
  RaceBot,
  SceneType
} from '../types/game.types';
import { SHOP_CATALOG } from '../config/catalog';
import { SoundManager } from '../audio/SoundManager';
import { MusicManager } from '../audio/MusicManager';
import { ParticleManager } from '../effects/ParticleManager';
import { TrailManager } from '../effects/TrailManager';
import { CollisionSystem } from '../physics/CollisionSystem';
import { RigAnimator } from '../animation/RigAnimator';
import { CharacterBuilder } from '../models/CharacterBuilder';
import { VehicleBuilder } from '../models/VehicleBuilder';
import { EnvironmentBuilder } from '../models/EnvironmentBuilder';
import { UIManager } from '../ui/UIManager';
import { GamepadManager } from './GamepadManager';
import { PowerUpType, PowerUpItem, POWER_UPS } from '../types/powerup.types';
import { TrackTheme, TRACK_CATALOG } from '../types/track.types';
import { ACHIEVEMENTS, Achievement } from '../config/achievements';

export class SnowSlideTPSMasterEngine {
  private networkManager: NetworkManager;
  private playerName: string = 'Piloto';
  private isMultiplayerRace: boolean = false;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;

  private currentScene: SceneType = 'LOGIN';

  // Nametag Local e Balão de Chat 3D
  private localNameTagSprite: THREE.Sprite | null = null;
  private localNameTagCanvas!: HTMLCanvasElement;
  private localNameTagContext!: CanvasRenderingContext2D;
  private localNameTagTexture!: THREE.CanvasTexture;
  private localChatText: string = '';
  private localChatTimer: number = 0;

  // Subsistemas
  private soundManager: SoundManager;
  private musicManager: MusicManager;
  private particleManager!: ParticleManager;
  private trailManager!: TrailManager;

  // Jogador
  private playerGroup!: THREE.Group;
  private playerPosX = 0;
  private playerPosY = 0;
  private playerPosZ = 0;
  private playerVelX = 0;
  private playerVelZ = 0;
  private isJumping = false;
  private jumpVelY = 0;

  // Sentar em Bancos
  private isSitting = false;
  private currentBench: BenchSpot | null = null;
  private benches: BenchSpot[] = [];
  private nearBench: BenchSpot | null = null;

  // Bolas de Neve e Mira ADS
  private snowballs: ActiveSnowball[] = [];
  private lastSnowballTime = 0;
  private isAimingDownSights = false;
  private isChargingSnowball = false;
  private snowballChargeStartTime = 0;
  private currentChargeRatio = 0.5;
  private playerRig: CharacterRig | null = null;
  private throwAnimTimer = 0;

  // Minigame 1: Estande de Tiro (Carnival)
  private nearCarnivalBooth = false;
  private carnivalBoothPos = new THREE.Vector3(42, 0, -12);
  private carnivalTargets: CarnivalTarget[] = [];
  private shootingScore = 0;
  private shootingHits = 0;
  private shootingShots = 0;
  private shootingCombo = 0;
  private shootingTimeLeft = 40;
  private shootingTimer: any = null;
  private toyGunGroup: THREE.Group | null = null;

  // Minigame 2: Guerra de Neve (Snowball War Arena)
  private nearSnowballWarPortal = false;
  private snowballWarPortalPos = new THREE.Vector3(-52, 0, 8);
  private warBots: WarBot[] = [];
  private warObstacles: WarObstacle[] = [];
  private warPlayerHealth = 3;
  private warKOs = 0;
  private warHits = 0;
  private warScore = 0;
  private warTimeLeft = 60;
  private warTimer: any = null;
  private isPlayerWarInvuln = false;
  private playerWarInvulnTimer = 0;

  // Economia e Inventário
  private currency = 1250;
  private score = 0;
  private equipped: EquippedState = {
    vehicle: 'sled_wood',
    hat: 'hat_red',
    scarf: 'scarf_green',
    goggles: 'goggles_none'
  };
  private inventory: Set<string> = new Set(['sled_wood', 'hat_red', 'scarf_green', 'goggles_none']);
  private selectedCharacter: CharacterId = 'penguin';

  // Configurações
  private mouseSensMultiplier = 1.0;
  private invertY = false;

  // Colisões Hub
  private hubColliders: HubCollider[] = [];

  // Posições de Interação na Vila
  private nearGarage = false;
  private nearHatShop = false;
  private nearAtelier = false;
  private nearRecords = false;
  private nearPhoneBooth = false;
  private nearCableCar = false;

  private garageCounterPos = new THREE.Vector3(-44, 0, -29);
  private hatShopCounterPos = new THREE.Vector3(-44, 0, 39);
  private atelierCounterPos = new THREE.Vector3(12, 0, 45);
  private recordsBoardPos = new THREE.Vector3(51, 0, 16);
  private phoneBoothPos = new THREE.Vector3(14, 0, -10);
  private cableCarStationPos = new THREE.Vector3(42, 0, -42);

  // Animação Jogador
  private walkTime = 0;
  private isRunning = false;

  // NPCs Vendedores
  private npcRalph: THREE.Group | null = null;
  private npcBabette: THREE.Group | null = null;
  private npcBoris: THREE.Group | null = null;

  // NPCs Andarilhos
  private wanderingNPCs: WanderingNPC[] = [];

  // Fogueira
  private bonfireLight: THREE.PointLight | null = null;
  private bonfireEmbers: THREE.Points | null = null;
  private bonfireEmberData: { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number }[] = [];

  // Corrida
  private obstacles: { mesh: THREE.Object3D; x: number; z: number; radius: number }[] = [];
  private gates: { mesh: THREE.Group; x: number; z: number; passed: boolean; leftLight: THREE.Mesh; rightLight: THREE.Mesh }[] = [];
  private ramps: { mesh: THREE.Object3D; x: number; z: number }[] = [];
  private gatesCleared = 0;
  private totalRaceGates = 0;
  private raceStartTime = 0;
  private isRaceFinished = false;
  private raceTrackLength = 3200;
  private raceBots: RaceBot[] = [];

  // Câmera TPS e Pointer Lock
  private isPointerLocked = false;
  private isRightMouseDown = false;
  private cameraAngleY = 0;
  private cameraAngleX = 0.22;
  private cameraDistance = 6.8;

  // Câmera Touch Mobile
  private activeCameraTouchId: number | null = null;
  private lastCameraTouchX = 0;
  private lastCameraTouchY = 0;

  // Joystick Analógico Virtual
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

  // Gamepad
  private gamepadManager: GamepadManager;

  // Drift & Mini-Turbo
  private isDrifting: boolean = false;
  private driftDirection: number = 0; // -1 (esquerda), 1 (direita)
  private driftCharge: number = 0;
  private driftTier: 0 | 1 | 2 | 3 = 0;
  private miniTurboTimer: number = 0;
  private miniTurboBonus: number = 0;
  private isDriftBtnDown: boolean = false;

  // Acrobacias Aéreas (Tricks)
  private trickSpins: number = 0;
  private trickRotationY: number = 0;

  // Caixas de Itens & Power-ups
  private itemBoxes: { mesh: THREE.Group; x: number; z: number; respawnTimer: number }[] = [];
  private currentItem: PowerUpItem | null = null;
  private isItemRoulette: boolean = false;
  private hasShield: boolean = false;
  private shieldMesh: THREE.Mesh | null = null;
  private iceTraps: { mesh: THREE.Group; x: number; z: number; life: number }[] = [];
  private homingSnowballs: { mesh: THREE.Group; x: number; z: number; targetX: number; targetZ: number }[] = [];
  private spinoutTimer: number = 0;

  // Moedas de Neve
  private raceCoins: { mesh: THREE.Group; x: number; z: number; collected: boolean }[] = [];
  private raceCoinsCollected: number = 0;

  // Pistas
  private selectedTrack: TrackTheme = 'alpine_day';
  private auroraMesh: THREE.Mesh | null = null;

  // Conquistas
  private achievements = ACHIEVEMENTS;
  private unlockedAchievements: Set<string> = new Set();

  // Arena PvP
  private isPvPArena: boolean = false;
  private pvpKOs: number = 0;
  private pvpRespawnTimer: number = 0;

  // Salas Privadas e Matchmaking
  private isPrivateRoom: boolean = false;
  private customRoomCode: string = '';

  // Salão de Recordes & Leaderboard Global
  private cachedLeaderboard: { race: any[]; arena: any[] } = { race: [], arena: [] };
  private currentLeaderboardTab: 'race' | 'arena' = 'race';

  // Ciclo Dia/Noite e Iluminação Dinâmica da Vila Alpina
  private weatherMode: 'dynamic' | 'day' | 'sunset' | 'night' = 'dynamic';
  private dayTimeCycle: number = 0.25; // 0.25 = dia, 0.5 = entardecer, 0.75 = noite polar
  private hubSunLight: THREE.DirectionalLight | null = null;
  private hubAmbientLight: THREE.AmbientLight | null = null;

  constructor() {
    this.soundManager = new SoundManager(true);
    this.musicManager = new MusicManager(this.soundManager);
    this.networkManager = new NetworkManager();
    this.gamepadManager = new GamepadManager();
    this.loadSavedSettings();
    this.initLocalNameTag();
    this.initEngine();
  }

  // =========================================================================
  // PERSISTÊNCIA & CONFIGURAÇÕES
  // =========================================================================
  private loadSavedSettings() {
    try {
      const savedName = localStorage.getItem('snow_slide_player_name');
      if (savedName) this.playerName = savedName;

      const savedSens = localStorage.getItem('snow_slide_sens');
      if (savedSens) this.mouseSensMultiplier = parseFloat(savedSens) || 1.0;

      const savedInvert = localStorage.getItem('snow_slide_invert_y');
      if (savedInvert) this.invertY = savedInvert === 'true';

      const savedSound = localStorage.getItem('snow_slide_sound');
      if (savedSound) this.soundManager.setSoundEnabled(savedSound !== 'false');

      const savedChar = localStorage.getItem('snow_slide_character');
      if (savedChar && ['penguin', 'frog', 'cat', 'dog'].includes(savedChar)) {
        this.selectedCharacter = savedChar as CharacterId;
      }

      const savedCoins = localStorage.getItem('snow_slide_coins');
      if (savedCoins) this.currency = parseInt(savedCoins, 10) || 1250;

      const savedInv = localStorage.getItem('snow_slide_inventory');
      if (savedInv) {
        const arr = JSON.parse(savedInv);
        if (Array.isArray(arr)) {
          this.inventory = new Set(arr);
        }
      }

      const savedEquipped = localStorage.getItem('snow_slide_equipped');
      if (savedEquipped) {
        const obj = JSON.parse(savedEquipped);
        if (obj) Object.assign(this.equipped, obj);
      }

      const savedAch = localStorage.getItem('snow_slide_achievements');
      if (savedAch) {
        const arr = JSON.parse(savedAch);
        if (Array.isArray(arr)) {
          this.unlockedAchievements = new Set(arr);
        }
      }

      const savedWeather = localStorage.getItem('snow_slide_weather');
      if (savedWeather && ['dynamic', 'day', 'sunset', 'night'].includes(savedWeather)) {
        this.weatherMode = savedWeather as any;
      }

      // Detecta convite via URL param (?room=NEVE-42)
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const queryRoom = params.get('room');
        if (queryRoom && queryRoom.trim().length > 0) {
          this.customRoomCode = queryRoom.trim().toUpperCase();
          this.isPrivateRoom = true;
          setTimeout(() => {
            UIManager.showToast(`❄️ Convite detectado! Sala: ${this.customRoomCode}`, 'success', this.soundManager);
          }, 800);
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar configurações salvas:', e);
    }
  }

  private unlockAchievement(id: string) {
    if (this.unlockedAchievements.has(id)) return;
    this.unlockedAchievements.add(id);
    try {
      localStorage.setItem('snow_slide_achievements', JSON.stringify(Array.from(this.unlockedAchievements)));
    } catch (e) {}

    const ach = this.achievements[id];
    if (ach) {
      UIManager.showAchievementToast(ach, this.soundManager);
      this.gamepadManager.vibrate(280, 0.4, 0.8);
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('snow_slide_sens', this.mouseSensMultiplier.toString());
      localStorage.setItem('snow_slide_invert_y', this.invertY.toString());
      localStorage.setItem('snow_slide_sound', this.soundManager.isSoundEnabled().toString());
      localStorage.setItem('snow_slide_character', this.selectedCharacter);
      localStorage.setItem('snow_slide_coins', this.currency.toString());
      localStorage.setItem('snow_slide_inventory', JSON.stringify(Array.from(this.inventory)));
      localStorage.setItem('snow_slide_equipped', JSON.stringify(this.equipped));
      localStorage.setItem('snow_slide_weather', this.weatherMode);
    } catch (e) {}
  }

  // =========================================================================
  // MONTAGEM DO AVATAR DO JOGADOR
  // =========================================================================
  private createCurrentCharacterModel(): THREE.Group {
    const group = CharacterBuilder.createCharacter(this.selectedCharacter, this.equipped);
    this.playerRig = group.userData.rig as CharacterRig;
    return group;
  }

  private createAvatarAssembly(): THREE.Group {
    const group = new THREE.Group();
    if (this.currentScene === 'RACING') {
      const vehicle = VehicleBuilder.createVehicleMesh(this.equipped.vehicle);
      group.add(vehicle);

      const character = this.createCurrentCharacterModel();
      character.position.y = this.equipped.vehicle.startsWith('sled') ? 0.26 : 0.08;
      group.add(character);
    } else {
      const character = this.createCurrentCharacterModel();
      character.position.y = 0;
      group.add(character);
    }
    return group;
  }

  private respawnPlayerMesh() {
    if (this.playerGroup) this.scene.remove(this.playerGroup);
    this.playerGroup = this.createAvatarAssembly();
    if (this.localNameTagSprite) {
      this.playerGroup.add(this.localNameTagSprite);
    }
    this.scene.add(this.playerGroup);
  }

  private initLocalNameTag() {
    this.localNameTagCanvas = document.createElement('canvas');
    this.localNameTagCanvas.width = 512;
    this.localNameTagCanvas.height = 256;
    this.localNameTagContext = this.localNameTagCanvas.getContext('2d')!;
    this.localNameTagTexture = new THREE.CanvasTexture(this.localNameTagCanvas);
    this.localNameTagTexture.minFilter = THREE.LinearFilter;

    this.redrawLocalNameTag();
    const spriteMat = new THREE.SpriteMaterial({
      map: this.localNameTagTexture,
      transparent: true,
      depthTest: false,
    });
    this.localNameTagSprite = new THREE.Sprite(spriteMat);
    this.localNameTagSprite.scale.set(3.2, 1.6, 1);
    this.localNameTagSprite.position.set(0, 2.3, 0);
  }

  public showLocalChatBubble(text: string) {
    this.localChatText = text;
    this.localChatTimer = 5.0;
    this.redrawLocalNameTag();
  }

  private redrawLocalNameTag() {
    if (!this.localNameTagContext) return;
    const ctx = this.localNameTagContext;
    ctx.clearRect(0, 0, 512, 256);

    const centerX = 256;
    const nameY = 200;

    if (this.localChatText.length > 0 && this.localChatTimer > 0) {
      ctx.save();
      const bubbleW = Math.min(460, Math.max(160, ctx.measureText(this.localChatText).width + 60));
      const bubbleH = 64;
      const bubbleX = centerX - bubbleW / 2;
      const bubbleY = 80;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 16);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(centerX - 10, bubbleY + bubbleH);
      ctx.lineTo(centerX + 10, bubbleY + bubbleH);
      ctx.lineTo(centerX, bubbleY + bubbleH + 12);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.font = 'bold 26px "Segoe UI", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let displayStr = this.localChatText;
      if (displayStr.length > 32) displayStr = displayStr.substring(0, 30) + '...';
      ctx.fillText(displayStr, centerX, bubbleY + bubbleH / 2);
      ctx.restore();
    }

    ctx.save();
    ctx.font = 'bold 28px "Segoe UI", sans-serif';
    const textWidth = ctx.measureText(this.playerName).width;
    const badgeW = textWidth + 50;
    const badgeH = 42;
    const badgeX = centerX - badgeW / 2;
    const badgeY = nameY - badgeH / 2;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
    ctx.fill();

    ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#22c55e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`👑 ${this.playerName}`, centerX, nameY);
    ctx.restore();

    this.localNameTagTexture.needsUpdate = true;
  }

  // =========================================================================
  // INICIALIZAÇÃO DA ENGINE THREE.JS
  // =========================================================================
  private initEngine() {
    this.scene = new THREE.Scene();
    this.particleManager = new ParticleManager(this.scene);
    this.trailManager = new TrailManager(this.scene);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1200);

    const appEl = document.getElementById('app')!;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    appEl.appendChild(this.renderer.domElement);

    this.setupUIAndControls();

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.loop();
  }

  // =========================================================================
  // CENÁRIO 1: HUB DA VILA ALPINA (ALPINE VILLAGE)
  // =========================================================================
  private loadHubScene() {
    this.currentScene = 'HUB';
    this.scene.clear();
    this.particleManager.setScene(this.scene);
    this.trailManager.setScene(this.scene);

    this.scene.background = new THREE.Color(0xcbe4f9);
    this.scene.fog = new THREE.FogExp2(0xcbe4f9, 0.004);

    this.hubAmbientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(this.hubAmbientLight);
    this.hubSunLight = new THREE.DirectionalLight(0xffffff, 1.3);
    this.hubSunLight.position.set(40, 70, -40);
    this.scene.add(this.hubSunLight);
    this.updateWeatherAndDayCycle(0);

    this.particleManager.createSnowParticles();
    this.particleManager.createSnowSpraySystem();
    this.particleManager.createSnowballBurstSystem();
    this.trailManager.clearAllSkidMarks();
    this.particleManager.confettiPoints = null;
    this.snowballs = [];
    this.raceBots = [];
    this.isSitting = false;
    this.currentBench = null;
    this.benches = [];

    // Solo da Praça da Vila Alpina (500m x 500m)
    const groundGeo = new THREE.PlaneGeometry(500, 500, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.hubColliders = [];

    // 1. Estação do Bondinho
    this.scene.add(EnvironmentBuilder.createCableCarBaseStation(this.cableCarStationPos));
    const csX = this.cableCarStationPos.x;
    const csZ = this.cableCarStationPos.z;
    this.hubColliders.push({ type: 'box', x: csX, z: csZ - 2.5, hw: 8.5, hd: 4.0, angle: 0 });
    this.hubColliders.push({ type: 'box', x: csX - 8.2, z: csZ + 2.5, hw: 0.8, hd: 2.8, angle: 0 });
    this.hubColliders.push({ type: 'box', x: csX + 8.2, z: csZ + 2.5, hw: 0.8, hd: 2.8, angle: 0 });
    this.hubColliders.push({ type: 'circle', x: csX, z: csZ - 1.0, r: 1.2 });

    // Placa informativa do Bondinho
    this.scene.add(EnvironmentBuilder.createTextSignboard(
      csX, csZ + 9.5, 0,
      '🚠 TELEFÉRICO DA MONTANHA',
      'Embarque para a Corrida de Descida & Slalom',
      '#38bdf8',
      this.hubColliders
    ));

    // 2. Garagem Alpina de Trenós (Ralph)
    const garage = EnvironmentBuilder.createWalkInLodge(
      -44, -22, 17, 15,
      0x5c3317, 0x1e3a8a,
      '🛠️ GARAGEM ALPINA', 'garage', 0,
      this.hubColliders,
      { ralph: undefined }
    );
    this.scene.add(garage);

    this.scene.add(EnvironmentBuilder.createTextSignboard(
      -44, -10.5, 0,
      '🛠️ GARAGEM ALPINA DE TRENÓS',
      'Mestre Ralph: Trenós, Snowboards & Acessórios de Pista',
      '#f59e0b',
      this.hubColliders
    ));

    // 3. Boutique dos Gorros (Babette)
    const boutique = EnvironmentBuilder.createWalkInLodge(
      -44, 46, 17, 15,
      0x701a75, 0xb91c1c,
      '🎩 BOUTIQUE DOS GORROS', 'hats', 0,
      this.hubColliders,
      { babette: undefined }
    );
    this.scene.add(boutique);

    this.scene.add(EnvironmentBuilder.createTextSignboard(
      -44, 34.5, 0,
      '🎩 BOUTIQUE DOS GORROS POLARES',
      'Madame Babette: Alta Moda em Gorros, Cartolas & Coroas',
      '#ec4899',
      this.hubColliders
    ));

    // 4. Ateliê da Montanha (Boris)
    const atelier = EnvironmentBuilder.createWalkInLodge(
      12, 52, 18, 16,
      0x064e3b, 0xd97706,
      '🧣 ATELIÊ DA MONTANHA', 'atelier', -Math.PI / 2,
      this.hubColliders,
      { boris: undefined }
    );
    this.scene.add(atelier);

    this.scene.add(EnvironmentBuilder.createTextSignboard(
      0.5, 52, Math.PI / 2,
      '🧣 ATELIÊ DA MONTANHA',
      'Mestre Boris: Cachecóis Felpudos & Óculos UV de Esqui',
      '#10b981',
      this.hubColliders
    ));

    // 5. Taverna dos Campeões & Hall da Fama
    const tavern = EnvironmentBuilder.createWalkInLodge(
      46, 16, 22, 18,
      0x3e2723, 0x7c2d12,
      '🏆 TAVERNA DOS CAMPEÕES', 'tavern', -Math.PI / 2,
      this.hubColliders
    );
    this.scene.add(tavern);

    this.scene.add(EnvironmentBuilder.createTextSignboard(
      31.5, 16, Math.PI / 2,
      '🏆 TAVERNA DOS CAMPEÕES',
      'Hall da Fama, Canecas Quentes & Melhores Recordes',
      '#eab308',
      this.hubColliders
    ));

    // 6. Estande de Tiro de Circo (Minigame)
    const carnival = EnvironmentBuilder.createCarnivalBooth(42, -12, -Math.PI / 2);
    this.scene.add(carnival);

    this.scene.add(EnvironmentBuilder.createTextSignboard(
      33, -12, Math.PI / 2,
      '🎯 ESTANDE DE TIRO DO FESTIVAL',
      'Acerte patinhos e alvos móveis com espingarda pop de ar!',
      '#f43f5e',
      this.hubColliders
    ));
    this.hubColliders.push({
      type: 'box',
      x: 42,
      z: -12,
      hw: 4.0,
      hd: 6.2,
      angle: -Math.PI / 2
    });

    // 7. Arena da Guerra de Neve (Minigame)
    const warPortal = EnvironmentBuilder.createSnowballWarPortal(-52, 8, Math.PI / 2);
    this.scene.add(warPortal);

    this.scene.add(EnvironmentBuilder.createTextSignboard(
      -42, 8, -Math.PI / 2,
      '❄️ ARENA DA GUERRA DE NEVE',
      'Batalha tática em equipes com IA! Acerte bolas e vença o torneio!',
      '#06b6d4',
      this.hubColliders
    ));
    this.hubColliders.push({
      type: 'box',
      x: -52,
      z: 8,
      hw: 2.0,
      hd: 6.5,
      angle: Math.PI / 2
    });

    // 8. Cabine Telefônica de Metamorfose
    this.scene.add(EnvironmentBuilder.createPhoneBooth(14, -10, this.hubColliders));
    this.scene.add(EnvironmentBuilder.createTextSignboard(
      14, -4.5, 0,
      '📞 CABINE DE METAMORFOSE',
      'Transforme-se em Pinguim, Sapo, Gato Siamês ou Shih Tzu!',
      '#ef4444',
      this.hubColliders
    ));

    // 9. Bancos de Madeira Sentáveis
    const benchConfigs = [
      { x: -9, z: 2, rotY: Math.PI * 0.45 },
      { x: 5, z: 2, rotY: -Math.PI * 0.45 },
      { x: -2, z: 10, rotY: 0 },
      { x: -2, z: -10, rotY: Math.PI },
      { x: -26, z: -18, rotY: Math.PI / 2 },
      { x: -26, z: 38, rotY: Math.PI / 2 },
      { x: 26, z: -6, rotY: -Math.PI / 2 },
      { x: 26, z: 32, rotY: -Math.PI / 2 }
    ];
    for (const bc of benchConfigs) {
      this.scene.add(EnvironmentBuilder.createWoodenParkBench(bc.x, bc.z, bc.rotY, this.benches, this.hubColliders));
    }

    // 10. Fogueira Central
    const bonfireHolder: any = {};
    this.scene.add(EnvironmentBuilder.createBonfire(bonfireHolder));
    this.bonfireLight = bonfireHolder.bonfireLight;
    this.bonfireEmbers = bonfireHolder.bonfireEmbers;
    this.bonfireEmberData = bonfireHolder.bonfireEmberData;
    this.hubColliders.push({ type: 'circle', x: -2, z: 0, r: 2.4 });

    // 11. Boneco de Neve
    this.scene.add(EnvironmentBuilder.createSnowman());
    this.hubColliders.push({ type: 'circle', x: -12, z: 8, r: 1.5 });

    // 12. Postes de Luz
    const lampCoords = [
      [-12, -4], [8, -4], [-12, 14], [8, 14],
      [-28, -26], [-28, 20], [28, -26], [28, 20]
    ];
    for (const [lx, lz] of lampCoords) {
      this.scene.add(EnvironmentBuilder.createStreetLamp(lx, lz));
      this.hubColliders.push({ type: 'circle', x: lx, z: lz, r: 0.6 });
    }

    // 13. Cercas e Pinheiros Periféricos
    for (let i = 0; i < 48; i++) {
      const ang = (i / 48) * Math.PI * 2;
      const rad = 72 + (Math.random() - 0.5) * 14;
      const tree = EnvironmentBuilder.createSnowyPineTree();
      tree.position.set(Math.cos(ang) * rad, 0, Math.sin(ang) * rad);
      tree.scale.setScalar(0.85 + Math.random() * 0.4);
      this.scene.add(tree);
      this.hubColliders.push({ type: 'circle', x: tree.position.x, z: tree.position.z, r: 1.4 });
    }

    // 14. NPCs Andarilhos
    this.spawnWanderingNPCs();

    // Posiciona Jogador na praça
    this.playerPosX = 0;
    this.playerPosY = 0;
    this.playerPosZ = 5.5;
    this.playerVelX = 0;
    this.playerVelZ = 0;
    this.isJumping = false;
    this.jumpVelY = 0;

    this.respawnPlayerMesh();
    this.playerGroup.position.set(this.playerPosX, this.playerPosY, this.playerPosZ);
    this.playerGroup.rotation.set(0, 0, 0);

    // Ajusta Câmera TPS
    this.cameraDistance = 6.8;
    this.cameraAngleY = 0;
    this.cameraAngleX = 0.22;

    // Atualiza HUDs
    document.getElementById('hub-ui')!.style.display = 'block';
    const hubChat = document.getElementById('hub-chat-container');
    if (hubChat) hubChat.style.display = 'flex';
    const raceLead = document.getElementById('race-multiplayer-leaderboard');
    if (raceLead) raceLead.style.display = 'none';
    const lobbyModal = document.getElementById('cable-car-lobby-modal');
    if (lobbyModal) lobbyModal.style.display = 'none';

    document.getElementById('racing-hud')!.style.display = 'none';
    document.getElementById('shooting-hud')!.style.display = 'none';
    document.getElementById('snowball-war-hud')!.style.display = 'none';
    document.getElementById('back-hub-btn')!.style.display = 'none';
    document.getElementById('joystick-ui')!.style.display = 'block';

    // Restaura jogadores remotos conectados na cena do Hub
    this.networkManager.remotePlayers.forEach((rp) => {
      rp.rebuildAvatar(false);
      this.scene.add(rp.group);
    });

    const runBtn = document.getElementById('run-btn');
    if (runBtn) runBtn.style.display = 'flex';
    const jumpBtn = document.getElementById('jump-btn');
    if (jumpBtn) jumpBtn.style.display = 'flex';
    const sbBtn = document.getElementById('snowball-btn');
    if (sbBtn) { sbBtn.style.display = 'flex'; sbBtn.innerHTML = '❄️'; }
    const aimBtn = document.getElementById('aim-btn');
    if (aimBtn) aimBtn.style.display = 'flex';
    const interactBtn = document.getElementById('interact-btn');
    if (interactBtn) interactBtn.style.display = 'none';
    const crosshair = document.getElementById('hub-crosshair');
    if (crosshair) crosshair.style.display = 'block';

    const itemBtn = document.getElementById('item-use-btn');
    if (itemBtn) itemBtn.style.display = 'none';
    const driftBtn = document.getElementById('drift-btn');
    if (driftBtn) driftBtn.style.display = 'none';
    const emoteBtn = document.getElementById('emote-wheel-btn');
    if (emoteBtn) emoteBtn.style.display = 'flex';
    const itemSlotEl = document.getElementById('race-item-slot-container');
    if (itemSlotEl) itemSlotEl.style.display = 'none';
    const driftGauge = document.getElementById('drift-gauge-container');
    if (driftGauge) driftGauge.style.display = 'none';

    UIManager.hideAllInteractivePrompts();
    UIManager.updateCoinsDisplay(this.currency);
    this.musicManager.play('hub');
  }

  // =========================================================================
  // CENÁRIO 2: DESCIDA DA MONTANHA & CORRIDA (DOWNHILL RACING)
  // =========================================================================
  private loadRacingScene() {
    this.currentScene = 'RACING';
    this.scene.clear();
    this.particleManager.setScene(this.scene);
    this.trailManager.setScene(this.scene);

    this.isRaceFinished = false;
    this.gatesCleared = 0;
    this.raceStartTime = Date.now();
    this.particleManager.confettiPoints = null;
    this.snowballs = [];
    this.isSitting = false;
    this.currentBench = null;

    const cutsceneEl = document.getElementById('cable-car-cutscene');
    if (cutsceneEl) cutsceneEl.style.display = 'none';

    const trackCfg = TRACK_CATALOG[this.selectedTrack] || TRACK_CATALOG.alpine_day;
    this.scene.background = new THREE.Color(trackCfg.skyColor);
    this.scene.fog = new THREE.FogExp2(trackCfg.fogColor, trackCfg.id === 'crystal_cave' ? 0.0055 : 0.0035);

    const ambient = new THREE.AmbientLight(trackCfg.ambientColor, trackCfg.id === 'aurora_night' ? 0.5 : 0.85);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(trackCfg.directionalColor, trackCfg.id === 'aurora_night' ? 0.85 : 1.4);
    sun.position.set(40, 80, -20);
    sun.castShadow = true;
    this.scene.add(sun);

    const trackLength = this.raceTrackLength + 400;

    if (trackCfg.hasAurora) {
      this.createAuroraBorealisEffect(trackLength);
    }
    if (trackCfg.hasCrystals) {
      this.createCrystalCavernElements(trackLength);
    }

    this.particleManager.createSnowParticles();
    this.particleManager.createSnowSpraySystem();
    this.particleManager.createSparkSystem();
    this.trailManager.clearAllSkidMarks();
    const trackGeo = new THREE.PlaneGeometry(48, trackLength, 16, 80);
    const trackMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.92 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = -Math.PI / 2;
    track.position.set(0, 0, trackLength * 0.5);
    track.receiveShadow = true;
    this.scene.add(track);

    const bermGeo = new THREE.PlaneGeometry(60, trackLength, 8, 40);
    const bermMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.95 });

    const leftBerm = new THREE.Mesh(bermGeo, bermMat);
    leftBerm.rotation.x = -Math.PI / 2;
    leftBerm.rotation.y = 0.24;
    leftBerm.position.set(-48, 4.5, trackLength * 0.5);
    leftBerm.receiveShadow = true;
    this.scene.add(leftBerm);

    const rightBerm = new THREE.Mesh(bermGeo, bermMat);
    rightBerm.rotation.x = -Math.PI / 2;
    rightBerm.rotation.y = -0.24;
    rightBerm.position.set(48, 4.5, trackLength * 0.5);
    rightBerm.receiveShadow = true;
    this.scene.add(rightBerm);

    for (let mz = 200; mz <= trackLength; mz += 380) {
      const p1 = EnvironmentBuilder.createMountainPeak(45 + Math.random() * 20, 65 + Math.random() * 35);
      p1.position.set(-110 - Math.random() * 30, 0, mz + (Math.random() - 0.5) * 80);
      this.scene.add(p1);

      const p2 = EnvironmentBuilder.createMountainPeak(45 + Math.random() * 20, 65 + Math.random() * 35);
      p2.position.set(110 + Math.random() * 30, 0, mz + (Math.random() - 0.5) * 80);
      this.scene.add(p2);
    }

    for (let tz = 10; tz <= trackLength; tz += 24) {
      const tLeft = EnvironmentBuilder.createSnowyPineTree();
      tLeft.position.set(-25.5 - Math.random() * 8, 0, tz + (Math.random() - 0.5) * 6);
      tLeft.scale.setScalar(0.85 + Math.random() * 0.4);
      this.scene.add(tLeft);

      const tRight = EnvironmentBuilder.createSnowyPineTree();
      tRight.position.set(25.5 + Math.random() * 8, 0, tz + (Math.random() - 0.5) * 6);
      tRight.scale.setScalar(0.85 + Math.random() * 0.4);
      this.scene.add(tRight);
    }

    this.obstacles = [];
    this.gates = [];
    this.ramps = [];

    let nextZ = 75;
    for (let i = 0; i < 45; i++) {
      const isTree = Math.random() > 0.45;
      const xPos = (Math.random() - 0.5) * 30;

      let obsMesh: THREE.Object3D;
      let radius = 1.3;

      if (isTree) {
        obsMesh = EnvironmentBuilder.createSnowyPineTree();
        obsMesh.scale.setScalar(0.75 + Math.random() * 0.25);
        radius = 1.2;
      } else {
        obsMesh = EnvironmentBuilder.createSnowyRock();
        obsMesh.scale.setScalar(0.85 + Math.random() * 0.3);
        radius = 1.5;
      }

      obsMesh.position.set(xPos, 0, nextZ);
      this.scene.add(obsMesh);
      this.obstacles.push({ mesh: obsMesh, x: xPos, z: nextZ, radius });

      nextZ += 60 + Math.random() * 45;
      if (nextZ > this.raceTrackLength - 100) break;
    }

    for (let gz = 120; gz < this.raceTrackLength - 120; gz += 130) {
      const colorHex = (Math.floor(gz / 130) % 2 === 0) ? 0xef4444 : 0x0284c7;
      const gate = EnvironmentBuilder.createSlalomGate(colorHex);
      const gateX = (Math.random() - 0.5) * 20;
      gate.position.set(gateX, 0, gz);
      this.scene.add(gate);
      this.gates.push({
        mesh: gate,
        x: gateX,
        z: gz,
        passed: false,
        leftLight: gate.leftLight,
        rightLight: gate.rightLight
      });
    }
    this.totalRaceGates = this.gates.length;

    for (let rz = 200; rz < this.raceTrackLength - 160; rz += 280) {
      const ramp = EnvironmentBuilder.createSnowRamp();
      const rampX = (Math.random() - 0.5) * 22;
      ramp.position.set(rampX, 0, rz);
      this.scene.add(ramp);
      this.ramps.push({ mesh: ramp, x: rampX, z: rz });
    }

    const finishArch = EnvironmentBuilder.createFinishLineArch();
    finishArch.position.set(0, 0, this.raceTrackLength);
    this.scene.add(finishArch);

    // Caixas de Itens (Mario Kart style)
    this.itemBoxes = [];
    for (let iz = 240; iz < this.raceTrackLength - 200; iz += 340) {
      const boxCount = 3;
      const spacing = 7.0;
      for (let b = 0; b < boxCount; b++) {
        const bx = (b - 1) * spacing + (Math.random() - 0.5) * 1.5;
        const boxMesh = this.createItemBoxMesh();
        boxMesh.position.set(bx, 1.0, iz);
        this.scene.add(boxMesh);
        this.itemBoxes.push({ mesh: boxMesh, x: bx, z: iz, respawnTimer: 0 });
      }
    }

    // Moedas de Neve Coletáveis (Snow Coins)
    this.raceCoins = [];
    for (let cz = 90; cz < this.raceTrackLength - 100; cz += 140) {
      const coinCount = 4;
      const coinSpacing = 4.5;
      const coinStartX = (Math.random() - 0.5) * 16;
      for (let c = 0; c < coinCount; c++) {
        const coinMesh = this.createCoinMesh();
        const cx = coinStartX + Math.sin(c * 0.8) * 3;
        const czPos = cz + c * coinSpacing;
        coinMesh.position.set(cx, 0.8, czPos);
        this.scene.add(coinMesh);
        this.raceCoins.push({ mesh: coinMesh, x: cx, z: czPos, collected: false });
      }
    }

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

    this.camera.position.set(0, 2.5, -6.0);
    this.camera.lookAt(0, 0.7, 8.0);

    this.respawnPlayerMesh();
    this.playerGroup.position.set(0, 0, 0);
    this.playerGroup.rotation.set(0.08, 0, 0);

    document.getElementById('hub-ui')!.style.display = 'none';
    const hubChat = document.getElementById('hub-chat-container');
    if (hubChat) hubChat.style.display = 'none';

    document.getElementById('racing-hud')!.style.display = 'block';
    const raceLead = document.getElementById('race-multiplayer-leaderboard');
    if (raceLead) raceLead.style.display = 'block';

    // Monta corredores no início da pista (Multiplayer ou Rivais IA no Solo Grand Prix)
    if (this.isMultiplayerRace) {
      this.raceBots = [];
      this.networkManager.remotePlayers.forEach((rp) => {
        rp.rebuildAvatar(true);
        this.scene.add(rp.group);
      });
    } else {
      this.spawnRaceBots();
    }

    document.getElementById('back-hub-btn')!.style.display = 'block';
    document.getElementById('joystick-ui')!.style.display = 'block';
    const runBtn = document.getElementById('run-btn');
    if (runBtn) runBtn.style.display = 'none';
    const jumpBtn = document.getElementById('jump-btn');
    if (jumpBtn) jumpBtn.style.display = 'flex';
    const sbBtn = document.getElementById('snowball-btn');
    if (sbBtn) sbBtn.style.display = 'none';
    const aimBtn = document.getElementById('aim-btn');
    if (aimBtn) aimBtn.style.display = 'none';
    const interactBtn = document.getElementById('interact-btn');
    if (interactBtn) interactBtn.style.display = 'none';
    const crosshair = document.getElementById('hub-crosshair');
    if (crosshair) crosshair.style.display = 'none';
    document.getElementById('race-finish-modal')!.style.display = 'none';
    UIManager.hideAllInteractivePrompts();

    this.currentItem = null;
    this.isItemRoulette = false;
    this.hasShield = false;
    this.shieldMesh = null;
    this.driftTier = 0;
    this.driftCharge = 0;
    this.isDrifting = false;
    this.miniTurboTimer = 0;
    this.miniTurboBonus = 0;
    this.trickSpins = 0;
    this.trickRotationY = 0;
    this.spinoutTimer = 0;
    this.iceTraps = [];
    this.homingSnowballs = [];
    this.raceCoinsCollected = 0;

    UIManager.updateItemHUD(null, false);
    UIManager.updateDriftHUD(0, 0);
    const coinsValEl = document.getElementById('race-coins-val');
    if (coinsValEl) coinsValEl.innerText = '0';
    const itemSlotEl = document.getElementById('race-item-slot-container');
    if (itemSlotEl) itemSlotEl.style.display = 'flex';

    const itemBtn = document.getElementById('item-use-btn');
    if (itemBtn) itemBtn.style.display = 'flex';
    const driftBtn = document.getElementById('drift-btn');
    if (driftBtn) driftBtn.style.display = 'flex';
    const emoteBtn = document.getElementById('emote-wheel-btn');
    if (emoteBtn) emoteBtn.style.display = 'none';

    const slalomHudVal = document.getElementById('slalom-hud-val');
    if (slalomHudVal) slalomHudVal.innerText = '0';
    this.musicManager.play('racing');
  }

  private async startCableCarClimb() {
    if (this.networkManager.status === 'connected') {
      const lobbyModal = document.getElementById('cable-car-lobby-modal')!;
      lobbyModal.style.display = 'flex';
      this.isMultiplayerRace = true;

      UIManager.renderTrackOptions('track-select-container', this.selectedTrack, (track) => {
        this.selectedTrack = track;
      });

      const readyBtn = document.getElementById('lobby-ready-btn');
      if (readyBtn) {
        readyBtn.innerText = '⚡ Estou Pronto!';
        readyBtn.style.background = 'linear-gradient(to right, #0ea5e9, #6366f1)';
      }

      UIManager.renderLobbyPilots([
        { name: this.playerName, isReady: false, character: this.selectedCharacter }
      ]);

      this.networkManager.onPlayerJoined = () => {
        this.updateLobbyPilotsList();
      };
      this.networkManager.onPlayerLeft = () => {
        this.updateLobbyPilotsList();
      };

      this.networkManager.onRaceCountdown = (sec) => {
        const countdownVal = document.getElementById('lobby-countdown-val');
        if (countdownVal) countdownVal.innerText = sec.toString();
        this.updateLobbyPilotsList();
      };

      this.networkManager.onRaceStart = () => {
        lobbyModal.style.display = 'none';
        this.startMultiplayerRace();
      };

      this.networkManager.onRaceFinished = (data) => {
        this.handleMultiplayerRaceFinished(data);
      };

      const roomCodeToUse = this.isPrivateRoom && this.customRoomCode ? this.customRoomCode : undefined;
      const statusBadge = document.getElementById('room-code-status-badge');
      if (statusBadge) {
        statusBadge.innerText = roomCodeToUse ? `Sala: ${roomCodeToUse}` : 'Sala Pública';
      }

      const joined = await this.networkManager.joinRace(
        {
          name: this.playerName,
          character: this.selectedCharacter,
          vehicle: this.equipped.vehicle,
          hat: this.equipped.hat,
          scarf: this.equipped.scarf,
          goggles: this.equipped.goggles,
        },
        this.scene,
        roomCodeToUse
      );

      if (!joined) {
        this.isMultiplayerRace = false;
        lobbyModal.style.display = 'none';
        this.startSoloCableCarCutscene();
      }
    } else {
      this.isMultiplayerRace = false;
      this.startSoloCableCarCutscene();
    }
  }

  private updateLobbyPilotsList() {
    const list: Array<{ name: string; isReady: boolean; character: string }> = [
      { name: this.playerName, isReady: true, character: this.selectedCharacter }
    ];
    this.networkManager.remotePlayers.forEach((rp) => {
      list.push({ name: rp.name, isReady: true, character: rp.characterId });
    });
    UIManager.renderLobbyPilots(list);
  }

  private startSoloCableCarCutscene() {
    const cutscene = document.getElementById('cable-car-cutscene')!;
    cutscene.style.display = 'flex';
    this.soundManager.playTone(392, 'sine', 0.5, 0.2);

    setTimeout(() => {
      cutscene.style.display = 'none';
      this.loadRacingScene();
    }, 2000);
  }

  private startMultiplayerRace() {
    const overlay = document.getElementById('race-countdown-overlay');
    if (overlay) {
      overlay.style.display = 'block';
      let count = 3;
      overlay.innerText = count.toString();
      this.soundManager.playTone(440, 'triangle', 0.15, 0.2);

      const interval = setInterval(() => {
        count--;
        if (count > 0) {
          overlay.innerText = count.toString();
          this.soundManager.playTone(440, 'triangle', 0.15, 0.2);
        } else if (count === 0) {
          overlay.innerText = 'VAI!';
          this.soundManager.playTone(880, 'triangle', 0.3, 0.4);
        } else {
          clearInterval(interval);
          overlay.style.display = 'none';
          this.loadRacingScene();
        }
      }, 750);
    } else {
      this.loadRacingScene();
    }
  }

  private handleMultiplayerRaceFinished(data: { leaderboard: any[] }) {
    UIManager.renderRaceFinishPodium(data.leaderboard);

    // Salva automaticamente o recorde no Hall da Fama Global
    const myResult = data.leaderboard.find((p: any) => p.name === this.playerName || p.id === this.networkManager.sessionId);
    if (myResult && myResult.finishTime && myResult.finishTime < 9999) {
      this.networkManager.submitRaceRecord({
        playerName: this.playerName,
        character: this.selectedCharacter,
        trackName: TRACK_CATALOG[this.selectedTrack]?.name || 'Pico da Nevasca',
        finishTime: myResult.finishTime,
        score: myResult.score || this.score
      });
    }
  }

  public async openLeaderboardModal() {
    UIManager.openRecordsModal();
    const data = await this.networkManager.fetchLeaderboard();
    if (data) {
      this.cachedLeaderboard = data;
    }
    UIManager.renderLeaderboardTable(this.cachedLeaderboard, this.currentLeaderboardTab);
  }

  public updateWeatherAndDayCycle(delta: number) {
    if (this.currentScene !== 'HUB' || !this.hubSunLight || !this.hubAmbientLight) return;

    if (this.weatherMode === 'dynamic') {
      // 1 ciclo completo dura ~3.5 minutos (210 segundos)
      this.dayTimeCycle = (this.dayTimeCycle + (delta / 210)) % 1.0;
    } else if (this.weatherMode === 'day') {
      this.dayTimeCycle = 0.25;
    } else if (this.weatherMode === 'sunset') {
      this.dayTimeCycle = 0.50;
    } else if (this.weatherMode === 'night') {
      this.dayTimeCycle = 0.75;
    }

    const angle = this.dayTimeCycle * Math.PI * 2;
    this.hubSunLight.position.set(
      Math.cos(angle) * 70,
      Math.sin(angle) * 70,
      -35
    );

    const sunHeight = Math.sin(angle);
    if (sunHeight > 0.3) {
      // Dia claro ensolarado
      const sky = new THREE.Color(0xcbe4f9);
      this.scene.background = sky;
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color = sky;
      this.hubSunLight.color.setHex(0xffffff);
      this.hubSunLight.intensity = 1.3;
      this.hubAmbientLight.color.setHex(0xffffff);
      this.hubAmbientLight.intensity = 0.9;
    } else if (sunHeight > -0.1) {
      // Entardecer / Pôr do Sol Dourado
      const t = (sunHeight + 0.1) / 0.4;
      const sunsetSky = new THREE.Color(0xfdba74).lerp(new THREE.Color(0xcbe4f9), t);
      this.scene.background = sunsetSky;
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color = sunsetSky;
      this.hubSunLight.color.setHex(0xf97316);
      this.hubSunLight.intensity = 1.6;
      this.hubAmbientLight.color.setHex(0xfef08a);
      this.hubAmbientLight.intensity = 0.7;
    } else {
      // Noite Polar Estrelada & Aurora
      const nightSky = new THREE.Color(0x0a1128);
      this.scene.background = nightSky;
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color = nightSky;
      this.hubSunLight.color.setHex(0x38bdf8);
      this.hubSunLight.intensity = 0.4;
      this.hubAmbientLight.color.setHex(0x1e293b);
      this.hubAmbientLight.intensity = 0.45;
    }
  }

  private createItemBoxMesh(): THREE.Group {
    const group = new THREE.Group();

    const cubeGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.82,
      roughness: 0.1,
      metalness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35
    });
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    group.add(cube);

    const coreGeo = new THREE.SphereGeometry(0.5, 12, 12);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    const ringGeo = new THREE.TorusGeometry(1.1, 0.06, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    return group;
  }

  private createCoinMesh(): THREE.Group {
    const group = new THREE.Group();

    const coinGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.15, 16);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0xeab308,
      emissiveIntensity: 0.2
    });
    const coin = new THREE.Mesh(coinGeo, coinMat);
    coin.rotation.x = Math.PI / 2;
    group.add(coin);

    const starGeo = new THREE.BoxGeometry(0.2, 0.8, 0.18);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const star1 = new THREE.Mesh(starGeo, starMat);
    const star2 = new THREE.Mesh(starGeo, starMat);
    star2.rotation.z = Math.PI / 2;
    group.add(star1);
    group.add(star2);

    return group;
  }

  private createShieldBubble() {
    if (this.shieldMesh) {
      this.shieldMesh.visible = true;
      return;
    }
    const geo = new THREE.SphereGeometry(1.6, 24, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.1,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.5
    });
    this.shieldMesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.shieldMesh);
  }

  private spawnIceTrap(x: number, z: number) {
    const group = new THREE.Group();
    const iceGeo = new THREE.BoxGeometry(1.6, 1.2, 1.6);
    const iceMat = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      roughness: 0.05,
      transparent: true,
      opacity: 0.88,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.4
    });
    const mesh = new THREE.Mesh(iceGeo, iceMat);
    mesh.position.y = 0.6;
    mesh.rotation.y = Math.random() * Math.PI;
    group.add(mesh);
    group.position.set(x, 0, z);
    this.scene.add(group);
    this.iceTraps.push({ mesh: group, x, z, life: 600 });
  }

  private launchHomingSnowball(x: number, z: number) {
    const group = new THREE.Group();
    const geo = new THREE.SphereGeometry(0.65, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.7;
    group.add(mesh);
    group.position.set(x, 0, z + 2);
    this.scene.add(group);
    this.homingSnowballs.push({ mesh: group, x, z: z + 2, targetX: x, targetZ: z + 120 });
  }

  private useCurrentItem() {
    if (!this.currentItem || this.isItemRoulette) return;
    const item = this.currentItem;
    this.currentItem = null;
    UIManager.updateItemHUD(null, false);
    this.unlockAchievement('powerup_frenzy');

    switch (item.type) {
      case 'nitro':
        this.miniTurboTimer = 160;
        this.miniTurboBonus = 0.45;
        this.soundManager.playNitroSound();
        this.gamepadManager.vibrate(400, 0.6, 1.0);
        UIManager.showToast('🌶️ NITRO FLAME ATIVADO!', 'success');
        break;

      case 'ice_trap':
        this.spawnIceTrap(this.playerPosX, this.playerPosZ - 3.0);
        this.soundManager.playIceSlickSound();
        UIManager.showToast('🧊 CUBO DE GELO LANÇADO PARA TRÁS!', 'info');
        break;

      case 'homing_snowball':
        this.launchHomingSnowball(this.playerPosX, this.playerPosZ);
        this.soundManager.playJumpSound();
        UIManager.showToast('🎯 BOLA TELEGUIADA DISPARADA!', 'info');
        break;

      case 'shield':
        this.hasShield = true;
        this.soundManager.playShieldSound();
        this.createShieldBubble();
        UIManager.showToast('🛡️ ESCUDO DE NEVE ATIVADO!', 'success');
        break;
    }
  }

  private performAirTrick() {
    if (!this.isJumping) return;
    this.trickSpins++;
    this.soundManager.playTrickSound();
    this.particleManager.emitSnowSpray(10, 0, this.playerPosX, this.playerPosY, this.playerPosZ);
    this.gamepadManager.vibrate(100, 0.4, 0.7);
  }

  private startItemRoulette() {
    if (this.isItemRoulette || this.currentItem) return;
    this.isItemRoulette = true;
    this.soundManager.playItemRouletteSound();
    UIManager.updateItemHUD(null, true);

    let rolls = 0;
    const items = Object.values(POWER_UPS);
    const interval = setInterval(() => {
      rolls++;
      const rand = items[Math.floor(Math.random() * items.length)];
      UIManager.updateItemHUD(rand, true);
      if (rolls >= 12) {
        clearInterval(interval);
        this.currentItem = items[Math.floor(Math.random() * items.length)];
        this.isItemRoulette = false;
        UIManager.updateItemHUD(this.currentItem, false);
        this.soundManager.playSlalomChime();
        this.gamepadManager.vibrate(150, 0.4, 0.6);
      }
    }, 90);
  }

  private createAuroraBorealisEffect(trackLength: number) {
    const auroraGeo = new THREE.PlaneGeometry(90, trackLength, 16, 64);
    const auroraMat = new THREE.MeshBasicMaterial({
      color: 0x2dd4bf,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    this.auroraMesh = new THREE.Mesh(auroraGeo, auroraMat);
    this.auroraMesh.rotation.x = -Math.PI * 0.45;
    this.auroraMesh.position.set(0, 48, trackLength * 0.5);
    this.scene.add(this.auroraMesh);
  }

  private createCrystalCavernElements(trackLength: number) {
    for (let cz = 50; cz < trackLength; cz += 45) {
      const crystalGeo = new THREE.ConeGeometry(0.9 + Math.random() * 0.5, 4 + Math.random() * 3, 6);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: cz % 90 === 0 ? 0xc084fc : 0x06b6d4,
        emissive: cz % 90 === 0 ? 0xa855f7 : 0x0891b2,
        emissiveIntensity: 0.6,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85
      });
      const leftCrystal = new THREE.Mesh(crystalGeo, crystalMat);
      leftCrystal.position.set(-23.8 - Math.random() * 2, 2, cz);
      leftCrystal.rotation.z = -0.3;
      this.scene.add(leftCrystal);

      const rightCrystal = new THREE.Mesh(crystalGeo, crystalMat);
      rightCrystal.position.set(23.8 + Math.random() * 2, 2, cz);
      rightCrystal.rotation.z = 0.3;
      this.scene.add(rightCrystal);
    }
  }

  private openEmoteWheelModal() {
    const modal = document.getElementById('emote-wheel-modal');
    if (!modal) return;
    if (document.pointerLockElement) {
      try { document.exitPointerLock(); } catch (e) {}
    }
    UIManager.closeAllModals();
    modal.style.display = 'flex';
  }

  private triggerEmote(animName: string) {
    const modal = document.getElementById('emote-wheel-modal');
    if (modal) modal.style.display = 'none';

    if (this.currentScene === 'HUB') {
      const labels: Record<string, string> = {
        dance_penguin: '🕺 Dançou como um Pinguim!',
        wave: '👋 Acenou para a Vila!',
        victory: '🏆 Comemorou a Vitória!',
        shiver: '🥶 Está tremendo de frio!',
        sit: '🪑 Sentou na neve macia.',
        cheer: '🎉 Viva a Vila Alpina!'
      };
      const text = labels[animName] || '✨ Fez um gesto!';
      this.showLocalChatBubble(text);
      if (this.networkManager.status === 'connected') {
        this.networkManager.sendChatMessage(text);
      }
      this.soundManager.playSlalomChime();
    }
  }

  private openSnowballWarChoiceModal() {
    const modal = document.getElementById('snowball-war-choice-modal');
    if (!modal) return;
    if (document.pointerLockElement) {
      try { document.exitPointerLock(); } catch (e) {}
    }
    UIManager.closeAllModals();
    modal.style.display = 'flex';
  }

  private finishRace() {
    if (this.isRaceFinished) return;
    this.isRaceFinished = true;

    this.soundManager.playVictoryFanfare();
    this.particleManager.createConfettiSystem();
    this.unlockAchievement('first_race');
    if (this.currency >= 100) this.unlockAchievement('coin_collector');

    if (this.isMultiplayerRace) {
      this.networkManager.sendRaceFinish(this.score, this.gatesCleared);
    }

    const elapsedSeconds = ((Date.now() - this.raceStartTime) / 1000).toFixed(1);
    const bonusCoins = 150 + this.gatesCleared * 15;
    this.currency += bonusCoins;
    UIManager.updateCoinsDisplay(this.currency);

    const prevBestScore = parseInt(localStorage.getItem('snow_slide_best_score') || '0', 10);
    if (this.score > prevBestScore) {
      localStorage.setItem('snow_slide_best_score', this.score.toString());
    }

    const prevBestTime = localStorage.getItem('snow_slide_best_time');
    const elapsedNum = parseFloat(elapsedSeconds);
    if (!prevBestTime || prevBestTime === '--:--' || elapsedNum < parseFloat(prevBestTime)) {
      localStorage.setItem('snow_slide_best_time', `${elapsedSeconds}s`);
    }

    // Submete recorde ao Hall da Fama Global
    this.networkManager.submitRaceRecord({
      playerName: this.playerName,
      character: this.selectedCharacter,
      trackName: TRACK_CATALOG[this.selectedTrack]?.name || 'Pico da Nevasca',
      finishTime: elapsedNum,
      score: this.score
    });

    const finishModal = document.getElementById('race-finish-modal')!;
    const timeEl = document.getElementById('finish-time-val');
    if (timeEl) timeEl.innerText = `${elapsedSeconds}s`;

    const gatesEl = document.getElementById('finish-gates-val');
    if (gatesEl) gatesEl.innerText = `${this.gatesCleared} / ${this.totalRaceGates}`;

    const scoreEl = document.getElementById('finish-score-val');
    if (scoreEl) scoreEl.innerText = this.score.toLocaleString('pt-BR');

    const coinsEl = document.getElementById('finish-coins-val');
    if (coinsEl) coinsEl.innerText = `+${bonusCoins} pts`;

    if (!this.isMultiplayerRace && this.raceBots.length > 0) {
      // Pódio Solo Grand Prix contra os Rivais IA
      const playerFinishTime = Date.now() - this.raceStartTime;
      const racers = [
        { name: `${this.playerName} (Você)`, rank: 1, finishTime: playerFinishTime, score: this.score },
        ...this.raceBots.map((b) => {
          const distRemaining = Math.max(0, this.raceTrackLength - b.z);
          const estTime = playerFinishTime + Math.round(distRemaining * 35 + (Math.random() * 800 - 300));
          const estScore = Math.max(2000, Math.round(this.score * 0.88 + (Math.random() * 2000 - 1000)));
          return { name: b.name, rank: 0, finishTime: Math.max(1000, estTime), score: estScore };
        })
      ];
      racers.sort((a, b) => a.finishTime - b.finishTime);
      racers.forEach((r, idx) => (r.rank = idx + 1));

      UIManager.renderRaceFinishPodium(racers);
      const playerRank = racers.findIndex((r) => r.name.includes('(Você)')) + 1;
      if (playerRank === 1) {
        UIManager.showToast('🥇 PARABÉNS! Você venceu o Grand Prix Solo em 1º Lugar!', 'success', this.soundManager);
      } else {
        UIManager.showToast(`🏁 Você cruzou a linha de chegada em ${playerRank}º Lugar!`, 'info', this.soundManager);
      }
    }

    finishModal.style.display = 'flex';
  }

  // =========================================================================
  // RIVAIS IA NA CORRIDA (SOLO GRAND PRIX)
  // =========================================================================
  private spawnRaceBots() {
    this.raceBots = [];

    const botConfigs: Array<{
      id: string;
      name: string;
      type: CharacterId;
      vehicle: string;
      hat: string;
      scarf: string;
      startX: number;
      startZ: number;
      baseSpeed: number;
    }> = [
      {
        id: 'bot_kero',
        name: 'Kero 🐸',
        type: this.selectedCharacter === 'frog' ? 'penguin' : 'frog',
        vehicle: 'snowboard_pro',
        hat: 'beanie_green',
        scarf: 'scarf_green',
        startX: -4.5,
        startZ: 1.0,
        baseSpeed: 0.375
      },
      {
        id: 'bot_mimi',
        name: 'Mimi 🐱',
        type: this.selectedCharacter === 'cat' ? 'penguin' : 'cat',
        vehicle: 'sled_classic',
        hat: 'earmuffs_pink',
        scarf: 'scarf_pink',
        startX: 4.5,
        startZ: 0.5,
        baseSpeed: 0.365
      },
      {
        id: 'bot_toby',
        name: 'Toby 🐶',
        type: this.selectedCharacter === 'dog' ? 'penguin' : 'dog',
        vehicle: 'sled_gold',
        hat: 'cap_winter',
        scarf: 'scarf_blue',
        startX: -2.2,
        startZ: 2.2,
        baseSpeed: 0.380
      }
    ];

    botConfigs.forEach((cfg) => {
      const equipped: EquippedState = {
        vehicle: cfg.vehicle,
        hat: cfg.hat,
        scarf: cfg.scarf,
        goggles: 'none'
      };

      const group = new THREE.Group();
      const vehicle = VehicleBuilder.createVehicleMesh(cfg.vehicle);
      group.add(vehicle);

      const charGroup = CharacterBuilder.createCharacter(cfg.type, equipped);
      charGroup.position.y = cfg.vehicle.startsWith('sled') ? 0.26 : 0.08;
      group.add(charGroup);

      const rig = charGroup.userData.rig as CharacterRig;

      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.beginPath();
      ctx.roundRect(10, 8, 236, 48, 12);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 22px "Nunito", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cfg.name, 128, 32);

      const tex = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(0, 1.8, 0);
      sprite.scale.set(1.8, 0.45, 1.0);
      group.add(sprite);

      group.position.set(cfg.startX, 0, cfg.startZ);
      this.scene.add(group);

      const bot: RaceBot = {
        id: cfg.id,
        name: cfg.name,
        type: cfg.type,
        group,
        rig,
        x: cfg.startX,
        y: 0,
        z: cfg.startZ,
        velX: 0,
        velZ: cfg.baseSpeed,
        baseSpeed: cfg.baseSpeed,
        targetX: cfg.startX,
        isJumping: false,
        jumpVelY: 0,
        driftTimer: 0,
        driftDir: 0,
        miniTurboTimer: 0,
        spinoutTimer: 0,
        itemCooldown: 120 + Math.floor(Math.random() * 180),
        hasShield: false,
        shieldMesh: null,
        rank: 0,
        finished: false
      };

      this.raceBots.push(bot);
    });
  }

  private updateRaceBots(delta: number) {
    if (this.raceBots.length === 0) return;

    for (let i = 0; i < this.raceBots.length; i++) {
      const bot = this.raceBots[i];

      // 1. Linha de chegada cruzada
      if (bot.finished) {
        bot.velZ *= 0.96;
        bot.z += bot.velZ;
        bot.group.position.set(bot.x, bot.y, bot.z);
        continue;
      }

      // 2. Spinout
      if (bot.spinoutTimer > 0) {
        bot.spinoutTimer--;
        bot.group.rotation.y += 0.35;
        bot.velZ *= 0.94;
        bot.z += bot.velZ;
        bot.group.position.set(bot.x, bot.y, bot.z);
        continue;
      }

      // 3. Velocidade adaptativa & Rubber-banding
      let desiredSpeed = bot.baseSpeed;
      const distFromPlayer = bot.z - this.playerPosZ;
      if (distFromPlayer < -25) {
        desiredSpeed *= 1.15;
      } else if (distFromPlayer > 35) {
        desiredSpeed *= 0.88;
      }

      if (bot.miniTurboTimer > 0) {
        bot.miniTurboTimer--;
        desiredSpeed *= 1.28;
        this.particleManager.emitNitroFlames(bot.x, bot.y, bot.z);
      }

      bot.velZ += (desiredSpeed - bot.velZ) * 0.06;
      bot.z += bot.velZ;

      if (bot.z >= this.raceTrackLength) {
        bot.finished = true;
      }

      // 4. Inteligência de Desvio & Slalom
      if (Math.random() < 0.04) {
        bot.targetX += (Math.random() - 0.5) * 1.8;
      }

      const upcomingGate = this.gates.find((g) => g.z > bot.z && g.z < bot.z + 55);
      if (upcomingGate) {
        bot.targetX = upcomingGate.x + Math.sin(bot.z * 0.05) * 1.5;
      }

      for (const obs of this.obstacles) {
        if (obs.z > bot.z && obs.z < bot.z + 30 && Math.abs(obs.x - bot.x) < 3.2) {
          bot.targetX = bot.x > obs.x ? obs.x + 3.8 : obs.x - 3.8;
          break;
        }
      }

      for (const ramp of this.ramps) {
        if (ramp.z > bot.z && ramp.z < bot.z + 45 && Math.abs(ramp.x - bot.x) < 5.0) {
          bot.targetX = ramp.x;
          break;
        }
      }

      bot.targetX = Math.max(-17.5, Math.min(17.5, bot.targetX));

      // 5. Direção lateral suave
      bot.velX += (bot.targetX - bot.x) * 0.04;
      bot.velX *= 0.88;
      bot.x += bot.velX;
      bot.x = Math.max(-19, Math.min(19, bot.x));

      // 6. Rampas e Salto
      if (!bot.isJumping) {
        for (const ramp of this.ramps) {
          if (Math.abs(bot.x - ramp.x) < 3.2 && Math.abs(bot.z - ramp.z) < 2.5) {
            bot.isJumping = true;
            bot.jumpVelY = 0.44;
            this.soundManager.playJumpSound();
            break;
          }
        }
      } else {
        bot.y += bot.jumpVelY;
        bot.jumpVelY -= 0.018;
        if (bot.y <= 0) {
          bot.y = 0;
          bot.isJumping = false;
          bot.jumpVelY = 0;
          bot.miniTurboTimer = 50;
          this.particleManager.emitSnowSpray(10, 0, bot.x, bot.y, bot.z);
        }
      }

      // 7. Caixas de Itens & Uso de Power-ups
      if (bot.itemCooldown <= 0) {
        for (const box of this.itemBoxes) {
          if (box.respawnTimer <= 0 && Math.abs(bot.x - box.x) < 2.5 && Math.abs(bot.z - box.z) < 2.5) {
            box.respawnTimer = 300;
            box.mesh.visible = false;
            this.particleManager.emitItemBoxShatter(box.x, 1.0, box.z);
            bot.itemCooldown = 260 + Math.floor(Math.random() * 200);

            const roll = Math.random();
            if (roll < 0.45) {
              bot.miniTurboTimer = 90;
            } else if (roll < 0.70) {
              bot.hasShield = true;
            } else {
              this.spawnIceTrap(bot.x, bot.z - 3.5);
            }
            break;
          }
        }
      } else {
        bot.itemCooldown--;
      }

      // 8. Colisão com Obstáculos
      if (!bot.isJumping) {
        for (const obs of this.obstacles) {
          if (Math.hypot(bot.x - obs.x, bot.z - obs.z) < obs.radius + 0.6) {
            if (bot.hasShield) {
              bot.hasShield = false;
            } else {
              bot.spinoutTimer = 35;
              this.particleManager.emitSnowSpray(15, 0, bot.x, bot.y, bot.z);
            }
            break;
          }
        }
      }

      // 9. Colisão com o Jogador
      const distToPlayer = Math.hypot(this.playerPosX - bot.x, this.playerPosZ - bot.z);
      if (distToPlayer < 1.8 && distToPlayer > 0.01) {
        const nx = (this.playerPosX - bot.x) / distToPlayer;
        this.playerVelX += nx * 0.08;
        bot.velX -= nx * 0.08;
        this.soundManager.playIceSlickSound();
      }

      // 10. Atualização de Posição, Inclinação e Efeitos
      bot.group.position.set(bot.x, bot.y, bot.z);
      bot.group.rotation.set(0.08, -bot.velX * 0.35, -bot.velX * 0.45);

      if (!bot.isJumping && Math.random() < 0.35) {
        this.particleManager.emitSnowSpray(3, -bot.velX * 0.5, bot.x, bot.y + 0.05, bot.z - 0.4);
      }

      if (bot.rig) {
        if (bot.rig.torso) {
          bot.rig.torso.rotation.z = -bot.velX * 0.4;
          bot.rig.torso.rotation.x = bot.isJumping ? -0.25 : 0.08;
        }
        if (bot.rig.head) {
          bot.rig.head.rotation.y = -bot.velX * 0.3;
        }
        if (bot.rig.tail) {
          bot.rig.tail.rotation.y = Math.sin(performance.now() * 0.008) * 0.25;
        }
      }
    }
  }

  // =========================================================================
  // CENÁRIO 3: ESTANDE DE TIRO (CARNIVAL SHOOTING GALLERY)
  // =========================================================================
  private loadShootingGalleryScene() {
    this.currentScene = 'SHOOTING_GALLERY';
    this.scene.clear();
    this.particleManager.setScene(this.scene);
    this.isSitting = false;
    this.particleManager.confettiPoints = null;
    this.snowballs = [];
    this.raceBots = [];
    this.musicManager.play('hub');

    this.scene.background = new THREE.Color(0x1e1b4b);
    this.scene.fog = new THREE.FogExp2(0x1e1b4b, 0.005);

    const ambient = new THREE.AmbientLight(0xffffff, 0.95);
    this.scene.add(ambient);

    const stageLight = new THREE.PointLight(0xfef08a, 2.5, 25);
    stageLight.position.set(0, 5.0, -4.0);
    this.scene.add(stageLight);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const clothRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 });
    const clothWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });

    const shooterCounter = new THREE.Mesh(new THREE.BoxGeometry(10, 1.1, 1.2), woodMat);
    shooterCounter.position.set(0, 0.55, -2.0);
    shooterCounter.receiveShadow = true;
    this.scene.add(shooterCounter);

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 0.5), woodMat);
    backWall.position.set(0, 3.5, -9.5);
    this.scene.add(backWall);

    for (let i = 0; i < 16; i++) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.2, 5.5),
        i % 2 === 0 ? clothRed : clothWhite
      );
      stripe.position.set(-7.5 + i * 1.0, 7.2, -6.5);
      stripe.rotation.x = 0.2;
      this.scene.add(stripe);
    }

    const shelfY = [1.4, 2.7, 4.0];
    for (const y of shelfY) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(14, 0.16, 0.7), woodMat);
      shelf.position.set(0, y, -8.5);
      this.scene.add(shelf);
    }

    this.toyGunGroup = EnvironmentBuilder.createToyPopGun();
    this.camera.add(this.toyGunGroup);
    this.scene.add(this.camera);

    this.shootingScore = 0;
    this.shootingHits = 0;
    this.shootingShots = 0;
    this.shootingCombo = 0;
    this.shootingTimeLeft = 40;

    this.spawnCarnivalTargets();

    this.camera.position.set(0, 1.65, 0);
    this.camera.lookAt(0, 2.7, -8.5);
    this.cameraAngleX = 0.05;
    this.cameraAngleY = 0;

    document.getElementById('hub-ui')!.style.display = 'none';
    document.getElementById('racing-hud')!.style.display = 'none';
    document.getElementById('snowball-war-hud')!.style.display = 'none';
    document.getElementById('shooting-hud')!.style.display = 'block';
    document.getElementById('back-hub-btn')!.style.display = 'none';
    document.getElementById('joystick-ui')!.style.display = 'none';
    const runBtn = document.getElementById('run-btn');
    if (runBtn) runBtn.style.display = 'none';
    const jumpBtn = document.getElementById('jump-btn');
    if (jumpBtn) jumpBtn.style.display = 'none';
    const aimBtn = document.getElementById('aim-btn');
    if (aimBtn) aimBtn.style.display = 'none';
    const interactBtn = document.getElementById('interact-btn');
    if (interactBtn) interactBtn.style.display = 'none';
    const sbBtn = document.getElementById('snowball-btn');
    if (sbBtn) { sbBtn.style.display = 'flex'; sbBtn.innerHTML = '🎯'; }
    document.getElementById('hub-crosshair')!.style.display = 'block';
    UIManager.hideAllInteractivePrompts();

    this.updateShootingHUD();
    this.soundManager.playCarnivalHornSound();

    if (this.shootingTimer) clearInterval(this.shootingTimer);
    this.shootingTimer = setInterval(() => {
      this.shootingTimeLeft--;
      const timeEl = document.getElementById('shooting-time-val');
      if (timeEl) timeEl.textContent = this.shootingTimeLeft.toString();
      if (this.shootingTimeLeft <= 0) {
        clearInterval(this.shootingTimer);
        this.endShootingGallery();
      }
    }, 1000);
  }

  private spawnCarnivalTargets() {
    for (const t of this.carnivalTargets) {
      this.scene.remove(t.group);
    }
    this.carnivalTargets = [];

    const shelfHeights = [1.55, 2.85, 4.15];
    const shelfSpeeds = [0.045, -0.065, 0.08];

    for (let shelf = 0; shelf < 3; shelf++) {
      const baseY = shelfHeights[shelf];
      const speed = shelfSpeeds[shelf];
      const count = 4;

      for (let i = 0; i < count; i++) {
        const x = -5.0 + i * 3.3 + (Math.random() - 0.5) * 0.5;
        const rand = Math.random();
        let type: 'duck' | 'bullseye' | 'star' | 'bomb' = 'duck';
        let points = 25;

        if (rand < 0.45) {
          type = 'duck';
          points = 30;
        } else if (rand < 0.75) {
          type = 'bullseye';
          points = 50;
        } else if (rand < 0.90) {
          type = 'star';
          points = 100;
        } else {
          type = 'bomb';
          points = -40;
        }

        const group = new THREE.Group();
        const baseMat = new THREE.MeshStandardMaterial({ roughness: 0.4 });

        if (type === 'duck') {
          baseMat.color.setHex(0xfacc15);
          const duckBody = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), baseMat);
          duckBody.scale.set(1.2, 0.9, 0.7);
          const duckHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), baseMat);
          duckHead.position.set(0.25, 0.28, 0);
          const duckBeak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 6), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
          duckBeak.rotation.z = -Math.PI / 2;
          duckBeak.position.set(0.45, 0.26, 0);
          group.add(duckBody, duckHead, duckBeak);
        } else if (type === 'bullseye') {
          const ring1 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 16), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
          ring1.rotation.x = Math.PI / 2;
          const ring2 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.09, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
          ring2.rotation.x = Math.PI / 2;
          const ring3 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.10, 16), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
          ring3.rotation.x = Math.PI / 2;
          group.add(ring1, ring2, ring3);
        } else if (type === 'star') {
          const star = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 0), new THREE.MeshStandardMaterial({ color: 0xfde047, metalness: 0.8, roughness: 0.2 }));
          group.add(star);
        } else {
          const bomb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 }));
          const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
          fuse.position.y = 0.38;
          const spark = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
          spark.position.y = 0.48;
          group.add(bomb, fuse, spark);
        }

        group.position.set(x, baseY + 0.4, -8.3);
        this.scene.add(group);

        this.carnivalTargets.push({
          group,
          type,
          shelfIndex: shelf,
          x,
          baseY: baseY + 0.4,
          z: -8.3,
          speed: Math.abs(speed),
          dir: speed > 0 ? 1 : -1,
          points,
          hit: false,
          hitTimer: 0
        });
      }
    }
  }

  private updateCarnivalShooting() {
    const leftLimit = -6.2;
    const rightLimit = 6.2;

    for (const t of this.carnivalTargets) {
      if (t.hit) {
        t.hitTimer++;
        t.group.rotation.x += 0.25;
        t.group.position.y -= 0.08;
        if (t.hitTimer > 35) {
          t.hit = false;
          t.hitTimer = 0;
          t.group.rotation.set(0, 0, 0);
          t.group.position.y = t.baseY;
          t.x = t.dir > 0 ? leftLimit : rightLimit;
          t.group.position.x = t.x;
        }
      } else {
        t.x += t.speed * t.dir;
        if (t.dir > 0 && t.x > rightLimit) {
          t.x = leftLimit;
        } else if (t.dir < 0 && t.x < leftLimit) {
          t.x = rightLimit;
        }
        t.group.position.x = t.x;
        t.group.rotation.y += t.dir * 0.02;
      }
    }
  }

  private shootCarnivalToyGun() {
    if (this.currentScene !== 'SHOOTING_GALLERY') return;
    this.shootingShots++;
    this.soundManager.playToyGunPopSound();

    if (this.toyGunGroup) {
      this.toyGunGroup.position.z += 0.12;
      this.toyGunGroup.rotation.x += 0.08;
      setTimeout(() => {
        if (this.toyGunGroup) {
          this.toyGunGroup.position.set(0.32, -0.24, -0.65);
          this.toyGunGroup.rotation.set(0.05, -0.05, 0);
        }
      }, 75);
    }

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    let hitTarget: CarnivalTarget | null = null;
    let minDistance = Infinity;

    for (const t of this.carnivalTargets) {
      if (t.hit) continue;
      const intersects = raycaster.intersectObjects(t.group.children, true);
      if (intersects.length > 0 && intersects[0].distance < minDistance) {
        minDistance = intersects[0].distance;
        hitTarget = t;
      }
    }

    if (hitTarget) {
      hitTarget.hit = true;
      hitTarget.hitTimer = 0;
      this.shootingHits++;

      if (hitTarget.type === 'bomb') {
        this.shootingCombo = 0;
        this.shootingScore = Math.max(0, this.shootingScore + hitTarget.points);
        this.soundManager.playSnowSplatSound();
        UIManager.showToast('💣 BOMBA! Pontuação penalizada!', 'warning', this.soundManager);
      } else {
        this.shootingCombo++;
        const multiplier = Math.min(4, 1 + Math.floor(this.shootingCombo / 3));
        const pts = hitTarget.points * multiplier;
        this.shootingScore += pts;
        this.soundManager.playTargetHitSound();
        if (multiplier > 1) {
          UIManager.showToast(`🎯 +${pts} pts! (Combo ${multiplier}x)`, 'success', this.soundManager);
        }
      }
    } else {
      this.shootingCombo = 0;
    }

    this.updateShootingHUD();
  }

  private updateShootingHUD() {
    const scoreEl = document.getElementById('shooting-score-val');
    if (scoreEl) scoreEl.textContent = this.shootingScore.toString();
    const hitsEl = document.getElementById('shooting-hits-val');
    if (hitsEl) hitsEl.textContent = this.shootingHits.toString();
    const comboEl = document.getElementById('shooting-combo-val');
    if (comboEl) comboEl.textContent = `${this.shootingCombo}x`;
  }

  private endShootingGallery() {
    if (this.camera && this.toyGunGroup) {
      this.camera.remove(this.toyGunGroup);
      this.toyGunGroup = null;
    }

    this.soundManager.playVictoryFanfare();
    const earnedCoins = Math.max(20, Math.floor(this.shootingScore * 0.25));
    this.currency += earnedCoins;
    UIManager.updateCoinsDisplay(this.currency);

    const accuracy = this.shootingShots > 0 ? Math.round((this.shootingHits / this.shootingShots) * 100) : 0;

    const resModal = document.getElementById('shooting-results-modal')!;
    const fScore = document.getElementById('shooting-final-score');
    if (fScore) fScore.textContent = this.shootingScore.toString();
    const fHits = document.getElementById('shooting-final-hits');
    if (fHits) fHits.textContent = `${this.shootingHits} / ${this.shootingShots}`;
    const fAcc = document.getElementById('shooting-final-accuracy');
    if (fAcc) fAcc.textContent = `${accuracy}%`;
    const fCoins = document.getElementById('shooting-final-coins');
    if (fCoins) fCoins.textContent = `+${earnedCoins} pts`;

    resModal.style.display = 'flex';
  }

  // =========================================================================
  // CENÁRIO 4: GUERRA DE BOLAS DE NEVE (SNOWBALL WAR ARENA)
  // =========================================================================
  private loadSnowballWarScene(isPvP: boolean = false) {
    this.currentScene = 'SNOWBALL_WAR';
    this.isPvPArena = isPvP;
    this.scene.clear();
    this.particleManager.setScene(this.scene);
    this.trailManager.setScene(this.scene);

    this.isSitting = false;
    this.snowballs = [];
    this.raceBots = [];
    this.warBots = [];
    this.musicManager.play('war');
    this.warObstacles = [];
    this.warPlayerHealth = 3;
    this.warKOs = 0;
    this.warHits = 0;
    this.warScore = 0;
    this.warTimeLeft = isPvP ? 180 : 60;
    this.isPlayerWarInvuln = false;
    this.playerWarInvulnTimer = 0;

    this.scene.background = new THREE.Color(0x0f172a);
    this.scene.fog = new THREE.FogExp2(0x0f172a, 0.007);

    const ambient = new THREE.AmbientLight(0x94a3b8, 0.7);
    this.scene.add(ambient);

    const moon = new THREE.DirectionalLight(0x38bdf8, 1.2);
    moon.position.set(30, 60, -30);
    moon.castShadow = true;
    this.scene.add(moon);

    this.particleManager.createSnowParticles();
    this.particleManager.createSnowSpraySystem();
    this.particleManager.createSnowballBurstSystem();

    this.buildSnowballWarArena();

    this.playerPosX = (Math.random() - 0.5) * 20;
    this.playerPosZ = (Math.random() - 0.5) * 20;
    this.playerPosY = 0;
    this.playerVelX = 0;
    this.playerVelZ = 0;
    this.respawnPlayerMesh();
    this.playerGroup.position.set(this.playerPosX, 0, this.playerPosZ);

    this.cameraDistance = 4.5;
    this.cameraAngleY = Math.PI * 0.25;
    this.cameraAngleX = 0.25;

    document.getElementById('hub-ui')!.style.display = 'none';
    document.getElementById('racing-hud')!.style.display = 'none';
    document.getElementById('shooting-hud')!.style.display = 'none';
    document.getElementById('snowball-war-hud')!.style.display = 'block';
    document.getElementById('back-hub-btn')!.style.display = 'none';
    document.getElementById('joystick-ui')!.style.display = 'block';
    const runBtn = document.getElementById('run-btn');
    if (runBtn) runBtn.style.display = 'flex';
    const jumpBtn = document.getElementById('jump-btn');
    if (jumpBtn) jumpBtn.style.display = 'flex';
    const sbBtn = document.getElementById('snowball-btn');
    if (sbBtn) { sbBtn.style.display = 'flex'; sbBtn.innerHTML = '❄️'; }
    const aimBtn = document.getElementById('aim-btn');
    if (aimBtn) aimBtn.style.display = 'flex';
    const interactBtn = document.getElementById('interact-btn');
    if (interactBtn) interactBtn.style.display = 'none';
    document.getElementById('hub-crosshair')!.style.display = 'block';
    UIManager.hideAllInteractivePrompts();

    UIManager.updateWarHUDHearts(this.warPlayerHealth);
    const kosEl = document.getElementById('war-kos-val');
    if (kosEl) kosEl.textContent = '0';
    const scoreEl = document.getElementById('war-score-val');
    if (scoreEl) scoreEl.textContent = '0';
    const timeEl = document.getElementById('war-time-val');
    if (timeEl) timeEl.textContent = `${this.warTimeLeft}s`;

    this.soundManager.playVictoryFanfare();

    if (this.isPvPArena) {
      UIManager.showToast('❄️ ARENA MULTIPLAYER PVP INICIADA! Conectando rivais...', 'info', this.soundManager);
      this.networkManager.onPlayerJoined = (_id, remotePlayer) => {
        remotePlayer.rebuildAvatar(false);
        this.scene.add(remotePlayer.group);
      };
      this.networkManager.onSnowballSpawned = (data) => {
        this.spawnRemoteSnowball(data);
      };
      this.networkManager.onArenaHit = (data) => {
        if (data.targetId === this.networkManager.sessionId) {
          this.warPlayerHealth = data.newHealth;
          this.isPlayerWarInvuln = true;
          this.playerWarInvulnTimer = 45;
          UIManager.updateWarHUDHearts(this.warPlayerHealth);
          this.soundManager.playSnowSplatSound();
          this.particleManager.emitSnowballDisintegration(this.playerPosX, this.playerPosY + 1.0, this.playerPosZ, true);
          this.gamepadManager.vibrate(250, 0.6, 0.8);
          UIManager.showToast(`💥 Atingido por ${data.attackerName}!`, 'warning', this.soundManager);
        } else {
          this.soundManager.playSnowSplatSound();
          const victim = this.networkManager.remotePlayers.get(data.targetId);
          if (victim) victim.knockback(data.attackerId === this.networkManager.sessionId ? 0.35 : 0.15);
          if (data.attackerId === this.networkManager.sessionId) {
            this.warHits++;
            this.warScore += 100;
            const scEl = document.getElementById('war-score-val');
            if (scEl) scEl.textContent = this.warScore.toString();
          }
        }
      };
      this.networkManager.onArenaKO = (data) => {
        if (data.attackerId === this.networkManager.sessionId) {
          this.warKOs = data.attackerKOs;
          this.warScore += 350;
          const kEl = document.getElementById('war-kos-val');
          if (kEl) kEl.textContent = this.warKOs.toString();
          const sEl = document.getElementById('war-score-val');
          if (sEl) sEl.textContent = this.warScore.toString();
          this.soundManager.playSlalomChime();
          this.gamepadManager.vibrate(300, 0.8, 1.0);
          UIManager.showToast(`🎯 K.O.! Você congelou ${data.victimName}! (+350 pts)`, 'success', this.soundManager);
          this.unlockAchievement('snowball_sniper');
        } else {
          UIManager.showToast(`❄️ ${data.attackerName} congelou ${data.victimName}!`, 'info');
        }
      };
      this.networkManager.onArenaRespawn = (data) => {
        if (data.playerId === this.networkManager.sessionId) {
          this.playerPosX = data.x;
          this.playerPosZ = data.z;
          this.playerPosY = 0;
          this.warPlayerHealth = data.health;
          this.isPlayerWarInvuln = true;
          this.playerWarInvulnTimer = 60;
          UIManager.updateWarHUDHearts(this.warPlayerHealth);
          UIManager.showToast('✨ Você renasceu! Volte à batalha!', 'info', this.soundManager);
        } else {
          const rp = this.networkManager.remotePlayers.get(data.playerId);
          if (rp) {
            rp.group.position.set(data.x, data.y, data.z);
            rp.unfreeze();
          }
        }
      };
      this.networkManager.onArenaFinished = (data) => {
        this.endSnowballWar(data.leaderboard);
      };

      this.networkManager.connectToArena(
        {
          name: this.playerName,
          character: this.selectedCharacter,
          vehicle: this.equipped.vehicle,
          hat: this.equipped.hat,
          scarf: this.equipped.scarf,
          goggles: this.equipped.goggles,
        },
        this.scene
      );
    } else {
      UIManager.showToast('❄️ A GUERRA DE NEVE COMEÇOU! Acabe com os rivais!', 'info', this.soundManager);
      this.spawnWarBots();
    }

    if (this.warTimer) clearInterval(this.warTimer);
    this.warTimer = setInterval(() => {
      this.warTimeLeft--;
      const tEl = document.getElementById('war-time-val');
      if (tEl) tEl.textContent = `${this.warTimeLeft}s`;
      if (this.warTimeLeft <= 0) {
        clearInterval(this.warTimer);
        this.endSnowballWar();
      }
    }, 1000);
  }

  private buildSnowballWarArena() {
    const arenaSize = 58;
    const snowGroundGeo = new THREE.PlaneGeometry(arenaSize, arenaSize, 32, 32);
    const snowGroundMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.95 });
    const ground = new THREE.Mesh(snowGroundGeo, snowGroundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const snowWallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
    const iceBlockMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, transparent: true, opacity: 0.8 });
    const woodFenceMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });

    const hWall = 4.2;
    const half = arenaSize * 0.5;
    const perimWalls = [
      { x: 0, z: -half, hw: half, hd: 0.8 },
      { x: 0, z: half, hw: half, hd: 0.8 },
      { x: -half, z: 0, hw: 0.8, hd: half },
      { x: half, z: 0, hw: 0.8, hd: half }
    ];
    for (const pw of perimWalls) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(pw.hw * 2, hWall, pw.hd * 2), woodFenceMat);
      mesh.position.set(pw.x, hWall * 0.5, pw.z);
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.warObstacles.push({ x: pw.x, z: pw.z, hw: pw.hw, hd: pw.hd, height: hWall });
    }

    const corners = [
      { x: -20, z: -20 },
      { x: 20, z: -20 },
      { x: -20, z: 20 },
      { x: 20, z: 20 }
    ];
    for (const c of corners) {
      const bWallH = 2.2;
      const b1Geo = EnvironmentBuilder.createRoundedWallGeometry(6, bWallH, 0.8, 0.28);
      const b1 = new THREE.Mesh(b1Geo, snowWallMat);
      b1.position.set(c.x, bWallH * 0.5, c.z - 3);
      b1.castShadow = true;

      const b2Geo = EnvironmentBuilder.createRoundedWallGeometry(0.8, bWallH, 6, 0.28);
      const b2 = new THREE.Mesh(b2Geo, snowWallMat);
      b2.position.set(c.x - 3, bWallH * 0.5, c.z);
      b2.castShadow = true;

      this.scene.add(b1, b2);
      this.warObstacles.push({ x: c.x, z: c.z - 3, hw: 3.0, hd: 0.4, height: bWallH });
      this.warObstacles.push({ x: c.x - 3, z: c.z, hw: 0.4, hd: 3.0, height: bWallH });
    }

    const mazeWalls = [
      { x: 0, z: -10, w: 10, h: 2.2, d: 1.2 },
      { x: 0, z: 10, w: 10, h: 2.2, d: 1.2 },
      { x: -10, z: 0, w: 1.2, h: 2.2, d: 10 },
      { x: 10, z: 0, w: 1.2, h: 2.2, d: 10 },
      { x: -14, z: -10, w: 6, h: 1.8, d: 1.0 },
      { x: 14, z: 10, w: 6, h: 1.8, d: 1.0 },
      { x: -10, z: 14, w: 1.0, h: 1.8, d: 6 },
      { x: 10, z: -14, w: 1.0, h: 1.8, d: 6 }
    ];
    for (const mw of mazeWalls) {
      const mGeo = EnvironmentBuilder.createRoundedWallGeometry(mw.w, mw.h, mw.d, 0.32);
      const mesh = new THREE.Mesh(mGeo, snowWallMat);
      mesh.position.set(mw.x, mw.h * 0.5, mw.z);
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.warObstacles.push({ x: mw.x, z: mw.z, hw: mw.w * 0.5, hd: mw.d * 0.5, height: mw.h });
    }

    const centerIce = new THREE.Mesh(new THREE.BoxGeometry(2.8, 4.5, 2.8), iceBlockMat);
    centerIce.position.set(0, 2.25, 0);
    this.scene.add(centerIce);
    this.warObstacles.push({ x: 0, z: 0, hw: 1.4, hd: 1.4, height: 4.5 });
  }

  private spawnWarBots() {
    this.warBots = [];
    const botConfigs: { name: string; type: CharacterId; start: { x: number; z: number } }[] = [
      { name: 'Kero', type: 'frog', start: { x: 20, z: -20 } },
      { name: 'Mimi', type: 'cat', start: { x: -20, z: 20 } },
      { name: 'Toby', type: 'dog', start: { x: 20, z: 20 } }
    ];

    const defaultEquipped = { vehicle: 'sled_wood', hat: 'hat_red', scarf: 'scarf_green', goggles: 'goggles_none' };

    for (const cfg of botConfigs) {
      const group = CharacterBuilder.createCharacter(cfg.type, defaultEquipped);
      group.position.set(cfg.start.x, 0, cfg.start.z);
      this.scene.add(group);

      const rig = group.userData.rig as CharacterRig;
      const iceCube = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 2.2, 1.6),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, transparent: true, opacity: 0.65 })
      );
      iceCube.position.set(0, 1.1, 0);
      iceCube.visible = false;
      group.add(iceCube);

      this.warBots.push({
        id: cfg.name.toLowerCase(),
        name: cfg.name,
        type: cfg.type,
        group,
        rig,
        pos: new THREE.Vector3(cfg.start.x, 0, cfg.start.z),
        rotY: 0,
        health: 3,
        maxHealth: 3,
        state: 'patrol',
        stateTimer: Math.floor(Math.random() * 60),
        targetPos: new THREE.Vector3(cfg.start.x, 0, cfg.start.z),
        invulnTimer: 0,
        iceCube,
        walkTime: Math.random() * 10,
        strafeDir: Math.random() > 0.5 ? 1 : -1,
        throwCooldown: 40 + Math.floor(Math.random() * 50),
        hitTimer: 0,
        isMoving: false
      });
    }
  }

  private updateSnowballWar() {
    const playerPos = new THREE.Vector3(this.playerPosX, 0, this.playerPosZ);

    if (this.isPlayerWarInvuln) {
      this.playerWarInvulnTimer--;
      this.playerGroup.visible = Math.floor(this.playerWarInvulnTimer / 4) % 2 === 0;
      if (this.playerWarInvulnTimer <= 0) {
        this.isPlayerWarInvuln = false;
        this.playerGroup.visible = true;
      }
    }

    for (const bot of this.warBots) {
      if (bot.invulnTimer > 0) bot.invulnTimer--;
      if (bot.hitTimer > 0) bot.hitTimer--;

      if (bot.state === 'frozen') {
        bot.stateTimer--;
        bot.isMoving = false;
        if (bot.stateTimer <= 0) {
          bot.state = 'patrol';
          bot.health = bot.maxHealth;
          if (bot.iceCube) bot.iceCube.visible = false;
          bot.invulnTimer = 40;
          this.soundManager.playSnowSplatSound();
          this.particleManager.emitSnowballDisintegration(bot.pos.x, bot.pos.y + 0.8, bot.pos.z);
        }
        RigAnimator.animateBot(bot);
        continue;
      }

      if (bot.throwCooldown > 0) bot.throwCooldown--;

      const distToPlayer = bot.pos.distanceTo(playerPos);
      const seePlayer = distToPlayer < 24;

      if (seePlayer) {
        bot.state = 'skirmish';
      }

      if (bot.state === 'skirmish') {
        const toPlayer = new THREE.Vector3().subVectors(playerPos, bot.pos).normalize();
        bot.rotY = Math.atan2(toPlayer.x, toPlayer.z);

        if (distToPlayer > 12) {
          bot.pos.addScaledVector(toPlayer, 0.08);
          bot.isMoving = true;
        } else if (distToPlayer < 6) {
          bot.pos.addScaledVector(toPlayer, -0.07);
          bot.isMoving = true;
        } else {
          const strafe = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).multiplyScalar(bot.strafeDir * 0.06);
          bot.pos.add(strafe);
          bot.isMoving = true;
          if (Math.random() < 0.02) bot.strafeDir *= -1;
        }

        if (bot.throwCooldown <= 0 && distToPlayer < 20) {
          bot.state = 'windup';
          bot.stateTimer = 22;
          bot.isMoving = false;
        }
      } else if (bot.state === 'windup') {
        bot.stateTimer--;
        const toPlayer = new THREE.Vector3().subVectors(playerPos, bot.pos).normalize();
        bot.rotY = Math.atan2(toPlayer.x, toPlayer.z);
        if (bot.stateTimer <= 0) {
          this.throwBotSnowball(bot);
          bot.state = 'throw';
          bot.stateTimer = 18;
          bot.throwCooldown = 70 + Math.floor(Math.random() * 50);
        }
      } else if (bot.state === 'throw') {
        bot.stateTimer--;
        if (bot.stateTimer <= 0) {
          bot.state = 'skirmish';
        }
      } else {
        // Patrulha
        bot.stateTimer--;
        if (bot.stateTimer <= 0) {
          bot.stateTimer = 80 + Math.floor(Math.random() * 90);
          bot.targetPos.set((Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40);
        }
        const toTarg = new THREE.Vector3().subVectors(bot.targetPos, bot.pos);
        if (toTarg.length() > 1.2) {
          toTarg.normalize();
          bot.pos.addScaledVector(toTarg, 0.06);
          bot.rotY = Math.atan2(toTarg.x, toTarg.z);
          bot.isMoving = true;
        } else {
          bot.isMoving = false;
        }
      }

      const res = CollisionSystem.resolveWarCollisions(bot.pos.x, bot.pos.z, this.warObstacles, 0.65);
      bot.pos.x = res.x;
      bot.pos.z = res.z;

      bot.group.position.copy(bot.pos);
      bot.group.rotation.y = bot.rotY;

      if (bot.isMoving) {
        bot.walkTime += 0.22;
      }
      RigAnimator.animateBot(bot);
    }
  }

  private throwBotSnowball(bot: WarBot) {
    const startPos = bot.pos.clone().add(new THREE.Vector3(0, 1.1, 0));
    const toTarget = new THREE.Vector3(this.playerPosX, 0.9, this.playerPosZ).sub(startPos);
    const dist = toTarget.length();
    toTarget.normalize();

    const speed = 0.55 + Math.min(0.4, dist * 0.02);
    const vx = toTarget.x * speed;
    const vz = toTarget.z * speed;
    const vy = 0.08 + dist * 0.012;

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.6 })
    );
    mesh.position.copy(startPos);
    this.scene.add(mesh);

    this.snowballs.push({
      mesh,
      vx,
      vy,
      vz,
      life: 0,
      isEnemy: true,
      gravity: 0.009
    });
    this.soundManager.playSnowThrowSound(0.5);
  }

  private endSnowballWar(leaderboard?: any[]) {
    this.soundManager.playVictoryFanfare();
    if (this.isPvPArena) {
      this.networkManager.leaveArena();
    }
    const earnedCoins = 100 + this.warKOs * 50 + this.warHits * 10;
    this.currency += earnedCoins;
    UIManager.updateCoinsDisplay(this.currency);

    const resModal = document.getElementById('snowball-war-results-modal')!;
    const fKOs = document.getElementById('war-final-kos');
    if (fKOs) fKOs.textContent = this.warKOs.toString();
    const fHits = document.getElementById('war-final-hits');
    if (fHits) fHits.textContent = this.warHits.toString();
    const fRank = document.getElementById('war-final-rank');
    if (fRank) {
      if (leaderboard && leaderboard.length > 0) {
        const myIndex = leaderboard.findIndex((p: any) => p.name === this.playerName);
        const rank = myIndex >= 0 ? myIndex + 1 : 1;
        fRank.textContent = rank === 1 ? '🏆 1º Lugar (Campeão da Arena)' : (rank === 2 ? '🥈 2º Lugar' : `${rank}º Lugar`);
      } else {
        if (this.warKOs >= 6) fRank.textContent = '🏆 1º Lugar (Mestre Supremo)';
        else if (this.warKOs >= 3) fRank.textContent = '🥈 2º Lugar (Atirador Polar)';
        else fRank.textContent = '🥉 3º Lugar (Competidor de Neve)';
      }
    }
    const fCoins = document.getElementById('war-final-coins');
    if (fCoins) fCoins.textContent = `+${earnedCoins} pts`;

    // Submete pontuação da Guerra de Neve ao Leaderboard Global
    if (this.warKOs > 0) {
      this.networkManager.submitArenaRecord({
        playerName: this.playerName,
        character: this.selectedCharacter,
        kos: this.warKOs,
        score: earnedCoins
      });
    }

    resModal.style.display = 'flex';
  }

  // =========================================================================
  // SISTEMA UNIVERSAL DE BOLAS DE NEVE (HUB E ARENA)
  // =========================================================================
  private throwSnowball(chargeRatio = 0.5) {
    const now = Date.now();
    if (now - this.lastSnowballTime < 240) return;
    this.lastSnowballTime = now;

    this.throwAnimTimer = RigAnimator.MAX_THROW_ANIM_FRAMES;
    this.soundManager.playSnowThrowSound(chargeRatio);

    const isChargedLaser = chargeRatio >= 0.85;
    const speed = isChargedLaser ? (1.35 + chargeRatio * 0.45) : (0.55 + chargeRatio * 0.65);
    const radius = 0.14 + chargeRatio * 0.12;

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 10, 10),
      new THREE.MeshStandardMaterial({
        color: isChargedLaser ? 0xe0f2fe : 0xffffff,
        roughness: 0.4,
        emissive: isChargedLaser ? 0x0284c7 : 0x000000,
        emissiveIntensity: isChargedLaser ? 0.35 : 0
      })
    );

    const shoulderOffset = this.isAimingDownSights ? 0.65 : 0.38;
    const rightX = Math.cos(this.cameraAngleY) * shoulderOffset;
    const rightZ = -Math.sin(this.cameraAngleY) * shoulderOffset;
    const originX = this.playerPosX + rightX;
    const originY = this.playerPosY + (this.isAimingDownSights ? 1.25 : 1.15);
    const originZ = this.playerPosZ + rightZ;

    mesh.position.set(originX, originY, originZ);

    const cosPitch = Math.cos(this.cameraAngleX);
    const sinPitch = Math.sin(this.cameraAngleX);
    const sinYaw = Math.sin(this.cameraAngleY);
    const cosYaw = Math.cos(this.cameraAngleY);

    const dirX = -sinYaw * cosPitch;
    const dirY = -sinPitch;
    const dirZ = -cosYaw * cosPitch;

    const gravityVal = isChargedLaser ? 0.0022 : (0.012 - chargeRatio * 0.006);
    const upwardBoost = isChargedLaser ? 0.015 : (this.isAimingDownSights ? 0.04 : 0.08);

    this.snowballs.push({
      mesh,
      vx: dirX * speed,
      vy: dirY * speed + upwardBoost,
      vz: dirZ * speed,
      life: 0,
      isEnemy: false,
      gravity: gravityVal
    });

    this.scene.add(mesh);

    if (this.currentScene === 'HUB') {
      this.networkManager.sendSnowballThrow(
        originX,
        originY,
        originZ,
        dirX * speed,
        dirY * speed + upwardBoost,
        dirZ * speed,
        chargeRatio
      );
    } else if (this.currentScene === 'SNOWBALL_WAR' && this.isPvPArena) {
      this.networkManager.sendArenaSnowball(
        new THREE.Vector3(originX, originY, originZ),
        new THREE.Vector3(dirX * speed, dirY * speed + upwardBoost, dirZ * speed),
        chargeRatio
      );
    }
  }

  private spawnRemoteSnowball(data: { senderId: string; senderName: string; x: number; y: number; z: number; vx: number; vy: number; vz: number; charge: number }) {
    if (this.currentScene !== 'HUB' && this.currentScene !== 'SNOWBALL_WAR') return;

    const isChargedLaser = data.charge >= 0.85;
    const radius = 0.14 + data.charge * 0.12;

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 8, 8),
      new THREE.MeshStandardMaterial({
        color: isChargedLaser ? 0xe0f2fe : 0xffffff,
        roughness: 0.4,
        emissive: isChargedLaser ? 0x0284c7 : 0x000000,
        emissiveIntensity: isChargedLaser ? 0.35 : 0
      })
    );
    mesh.position.set(data.x, data.y, data.z);
    this.scene.add(mesh);

    this.soundManager.playSnowThrowSound(data.charge);

    this.snowballs.push({
      mesh,
      vx: data.vx,
      vy: data.vy,
      vz: data.vz,
      life: 0,
      isEnemy: data.senderId !== this.networkManager.sessionId,
      gravity: isChargedLaser ? 0.0022 : (0.012 - data.charge * 0.006)
    });
  }

  private updateSnowballs() {
    const toRemove: number[] = [];

    for (let i = 0; i < this.snowballs.length; i++) {
      const sb = this.snowballs[i];
      sb.mesh.position.x += sb.vx;
      sb.mesh.position.y += sb.vy;
      sb.mesh.position.z += sb.vz;
      sb.vy -= sb.gravity;
      sb.life++;

      // Efeito de rastro/partículas na trajetória
      if (sb.life % 2 === 0) {
        this.particleManager.emitSnowSpray(1, 0, sb.mesh.position.x, sb.mesh.position.y, sb.mesh.position.z);
      }

      let hasHit = false;

      // Colisão com o Chão
      if (sb.mesh.position.y <= 0.08) {
        hasHit = true;
        this.soundManager.playSnowSplatSound();
        this.particleManager.emitSnowballDisintegration(sb.mesh.position.x, 0.08, sb.mesh.position.z, false);
      }

      // Colisão na Arena de Guerra de Neve
      if (this.currentScene === 'SNOWBALL_WAR') {
        for (const obs of this.warObstacles) {
          if (
            Math.abs(sb.mesh.position.x - obs.x) < obs.hw &&
            Math.abs(sb.mesh.position.z - obs.z) < obs.hd &&
            sb.mesh.position.y <= obs.height
          ) {
            hasHit = true;
            this.soundManager.playSnowSplatSound();
            this.particleManager.emitSnowballDisintegration(sb.mesh.position.x, sb.mesh.position.y, sb.mesh.position.z, false);
            break;
          }
        }

        // Colisão com Jogador (se bola inimiga)
        if (sb.isEnemy && !this.isPlayerWarInvuln && !hasHit) {
          const distToPlayer = sb.mesh.position.distanceTo(new THREE.Vector3(this.playerPosX, this.playerPosY + 0.8, this.playerPosZ));
          if (distToPlayer < 0.95) {
            hasHit = true;
            this.warPlayerHealth--;
            this.isPlayerWarInvuln = true;
            this.playerWarInvulnTimer = 45;
            this.soundManager.playSnowSplatSound();
            this.particleManager.emitSnowballDisintegration(this.playerPosX, this.playerPosY + 1.0, this.playerPosZ, true);
            UIManager.updateWarHUDHearts(this.warPlayerHealth);
            UIManager.showToast('💥 VOCÊ FOI ATINGIDO!', 'warning', this.soundManager);

            if (this.warPlayerHealth <= 0 && !this.isPvPArena) {
              if (this.warTimer) clearInterval(this.warTimer);
              this.endSnowballWar();
            }
          }
        }

        // Colisão com Jogadores Remotos na Arena PvP
        if (this.isPvPArena && !sb.isEnemy && !hasHit) {
          this.networkManager.remotePlayers.forEach((rp, targetId) => {
            const dist = sb.mesh.position.distanceTo(rp.group.position.clone().add(new THREE.Vector3(0, 0.8, 0)));
            if (dist < 1.1) {
              hasHit = true;
              this.soundManager.playSnowSplatSound();
              this.particleManager.emitSnowballDisintegration(rp.group.position.x, rp.group.position.y + 0.9, rp.group.position.z, true);
              this.networkManager.sendArenaHit(targetId);
            }
          });
        }

        // Colisão com Bots (se bola do jogador)
        if (!sb.isEnemy && !hasHit) {
          for (const bot of this.warBots) {
            if (bot.state === 'frozen' || bot.invulnTimer > 0) continue;
            const dist = sb.mesh.position.distanceTo(bot.pos.clone().add(new THREE.Vector3(0, 0.8, 0)));
            if (dist < 0.95) {
              hasHit = true;
              bot.health--;
              bot.hitTimer = 18;
              this.warHits++;
              this.warScore += 100;
              this.soundManager.playSnowSplatSound();
              this.particleManager.emitSnowballDisintegration(bot.pos.x, bot.pos.y + 0.9, bot.pos.z, true);

              if (bot.health <= 0) {
                bot.state = 'frozen';
                bot.stateTimer = 140; // ~2.3s congelado
                if (bot.iceCube) bot.iceCube.visible = true;
                this.warKOs++;
                this.warScore += 350;
                this.soundManager.playSlalomChime();
                UIManager.showToast(`🎯 K.O.! ${bot.name} foi congelado! (+350 pts)`, 'success', this.soundManager);
                const kosEl = document.getElementById('war-kos-val');
                if (kosEl) kosEl.textContent = this.warKOs.toString();
              }

              const scoreEl = document.getElementById('war-score-val');
              if (scoreEl) scoreEl.textContent = this.warScore.toString();
              break;
            }
          }
        }
      }

      // Colisão no Hub com NPCs Andarilhos
      if (this.currentScene === 'HUB' && !hasHit) {
        for (const npc of this.wanderingNPCs) {
          const npcCenter = npc.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0));
          if (sb.mesh.position.distanceTo(npcCenter) < 1.1) {
            hasHit = true;
            this.soundManager.playSnowSplatSound();
            this.particleManager.emitSnowballDisintegration(npcCenter.x, npcCenter.y, npcCenter.z, true);
            npc.state = 'hit';
            npc.reactionTimer = 45;
            npc.yVel = 0.22;
            UIManager.showToast(`❄️ ${npc.name} levou uma bolada de neve!`, 'info', this.soundManager);
            break;
          }
        }
      }

      if (hasHit || sb.life > 90) {
        toRemove.push(i);
        this.scene.remove(sb.mesh);
      }
    }

    for (let r = toRemove.length - 1; r >= 0; r--) {
      this.snowballs.splice(toRemove[r], 1);
    }
  }

  // =========================================================================
  // SISTEMA DE NPCS ANDARILHOS (WANDERING NPCS)
  // =========================================================================
  private spawnWanderingNPCs() {
    this.wanderingNPCs = [];

    const defaultEquipped = { vehicle: 'sled_wood', hat: 'hat_red', scarf: 'scarf_green', goggles: 'goggles_none' };

    const pip = CharacterBuilder.createDetailedPenguin(defaultEquipped);
    const pipWp = [
      { x: -4, z: 4 },
      { x: -12, z: 6 },
      { x: -16, z: 12 },
      { x: -8, z: 14 },
      { x: -2, z: 8 },
      { x: -4, z: 4 }
    ];
    pip.position.set(pipWp[0].x, 0, pipWp[0].z);
    this.scene.add(pip);
    this.wanderingNPCs.push({
      mesh: pip,
      name: 'Pip, o Pinguim',
      type: 'penguin',
      waypoints: pipWp,
      wpIndex: 0,
      speed: 0.045,
      walkTime: Math.random() * 10,
      footL: (pip.children[1] as THREE.Mesh),
      footR: (pip.children[2] as THREE.Mesh),
      torso: (pip.children[0] as THREE.Group),
      armL: (pip.children[0] as THREE.Group).children[3] as THREE.Mesh,
      armR: (pip.children[0] as THREE.Group).children[4] as THREE.Mesh,
      tail: null,
      state: 'walking',
      reactionTimer: 0,
      yVel: 0,
      rig: pip.userData.rig as CharacterRig
    });

    const kero = CharacterBuilder.createDetailedFrog(defaultEquipped);
    const keroWp = [
      { x: -10, z: -8 },
      { x: -4, z: -14 },
      { x: 4, z: -12 },
      { x: 2, z: -4 },
      { x: -6, z: -2 },
      { x: -10, z: -8 }
    ];
    kero.position.set(keroWp[0].x, 0, keroWp[0].z);
    this.scene.add(kero);
    this.wanderingNPCs.push({
      mesh: kero,
      name: 'Kero, o Sapo',
      type: 'frog',
      waypoints: keroWp,
      wpIndex: 0,
      speed: 0.05,
      walkTime: Math.random() * 10,
      footL: (kero.children[1] as THREE.Mesh),
      footR: (kero.children[2] as THREE.Mesh),
      torso: (kero.children[0] as THREE.Group),
      armL: (kero.children[0] as THREE.Group).children[3] as THREE.Mesh,
      armR: (kero.children[0] as THREE.Group).children[4] as THREE.Mesh,
      tail: null,
      state: 'walking',
      reactionTimer: 0,
      yVel: 0,
      rig: kero.userData.rig as CharacterRig
    });

    const mimi = CharacterBuilder.createDetailedCat(defaultEquipped);
    const mimiWp = [
      { x: 14, z: 8 },
      { x: 8, z: 12 },
      { x: 2, z: 10 },
      { x: 6, z: 2 },
      { x: 14, z: 2 },
      { x: 14, z: 8 }
    ];
    mimi.position.set(mimiWp[0].x, 0, mimiWp[0].z);
    this.scene.add(mimi);
    this.wanderingNPCs.push({
      mesh: mimi,
      name: 'Mimi, a Gatinha',
      type: 'cat',
      waypoints: mimiWp,
      wpIndex: 0,
      speed: 0.042,
      walkTime: Math.random() * 10,
      footL: (mimi.children[1] as THREE.Mesh),
      footR: (mimi.children[2] as THREE.Mesh),
      torso: (mimi.children[0] as THREE.Group),
      armL: (mimi.children[0] as THREE.Group).children[3] as THREE.Mesh,
      armR: (mimi.children[0] as THREE.Group).children[4] as THREE.Mesh,
      tail: (mimi.children[0] as THREE.Group).children[5] as THREE.Mesh,
      state: 'walking',
      reactionTimer: 0,
      yVel: 0,
      rig: mimi.userData.rig as CharacterRig
    });

    const toby = CharacterBuilder.createDetailedDog(defaultEquipped);
    const tobyWp = [
      { x: 12, z: -6 },
      { x: 18, z: -4 },
      { x: 18, z: 4 },
      { x: 10, z: 0 },
      { x: 12, z: -6 }
    ];
    toby.position.set(tobyWp[0].x, 0, tobyWp[0].z);
    this.scene.add(toby);
    this.wanderingNPCs.push({
      mesh: toby,
      name: 'Toby, o Shih Tzu',
      type: 'dog',
      waypoints: tobyWp,
      wpIndex: 0,
      speed: 0.055,
      walkTime: Math.random() * 10,
      footL: (toby.children[1] as THREE.Mesh),
      footR: (toby.children[2] as THREE.Mesh),
      torso: (toby.children[0] as THREE.Group),
      armL: (toby.children[0] as THREE.Group).children[3] as THREE.Mesh,
      armR: (toby.children[0] as THREE.Group).children[4] as THREE.Mesh,
      tail: (toby.children[0] as THREE.Group).children[5] as THREE.Mesh,
      state: 'walking',
      reactionTimer: 0,
      yVel: 0,
      rig: toby.userData.rig as CharacterRig
    });
  }

  private updateWanderingNPCs() {
    for (const npc of this.wanderingNPCs) {
      if (npc.state === 'hit') {
        npc.reactionTimer--;
        npc.mesh.position.y += npc.yVel;
        npc.yVel -= 0.02;
        npc.mesh.rotation.y += 0.18;
        if (npc.mesh.position.y <= 0) {
          npc.mesh.position.y = 0;
          npc.yVel = 0;
        }
        if (npc.rig) {
          RigAnimator.animateRigFlinch(npc.rig);
        }
        if (npc.reactionTimer <= 0) {
          npc.state = 'walking';
          npc.mesh.position.y = 0;
        }
        continue;
      }

      const target = npc.waypoints[npc.wpIndex];
      const dx = target.x - npc.mesh.position.x;
      const dz = target.z - npc.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.6) {
        npc.wpIndex = (npc.wpIndex + 1) % npc.waypoints.length;
      } else {
        const moveX = (dx / dist) * npc.speed;
        const moveZ = (dz / dist) * npc.speed;
        npc.mesh.position.x += moveX;
        npc.mesh.position.z += moveZ;

        const targetRotY = Math.atan2(moveX, moveZ);
        let diff = targetRotY - npc.mesh.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        npc.mesh.rotation.y += diff * 0.12;

        npc.walkTime += 0.14;
        if (npc.rig) {
          RigAnimator.animateRigWalk(npc.rig, npc.walkTime, false, false, 0, 0);
        }
      }
    }
  }

  // =========================================================================
  // GESTÃO DE MODAIS & LOJAS
  // =========================================================================
  private buyItem(id: string) {
    const item = SHOP_CATALOG.find(i => i.id === id);
    if (!item) return;

    if (this.currency >= item.price) {
      this.currency -= item.price;
      this.inventory.add(id);
      UIManager.updateCoinsDisplay(this.currency);
      this.saveSettings();
      this.equipItem(id, item.category);
      UIManager.showToast(`Parabéns! Você adquiriu e equipou: ${item.name}!`, 'success', this.soundManager);
      UIManager.renderShop(item.category, this.inventory, this.equipped, (bid) => this.buyItem(bid), (eid, cat) => this.equipItem(eid, cat));
    } else {
      UIManager.showToast(`Moedas insuficientes! Faltam ${item.price - this.currency} pts para comprar este item.`, 'warning', this.soundManager);
    }
  }

  private equipItem(id: string, cat: 'sleds' | 'hats' | 'scarves' | 'goggles') {
    if (cat === 'sleds') this.equipped.vehicle = id;
    if (cat === 'hats') this.equipped.hat = id;
    if (cat === 'scarves') this.equipped.scarf = id;
    if (cat === 'goggles') this.equipped.goggles = id;

    this.saveSettings();
    this.respawnPlayerMesh();
    this.networkManager.sendCosmetics(
      this.selectedCharacter,
      this.equipped.vehicle,
      this.equipped.hat,
      this.equipped.scarf,
      this.equipped.goggles
    );
  }

  private openSegmentedShop(shopType: 'garage' | 'hats' | 'atelier' | 'all') {
    if (document.pointerLockElement) {
      try { document.exitPointerLock(); } catch (e) {}
    }
    UIManager.closeAllModals();
    UIManager.updateCoinsDisplay(this.currency);

    const titleEl = document.getElementById('shop-modal-title');
    let initialCategory: 'sleds' | 'hats' | 'scarves' | 'goggles' = 'sleds';

    if (shopType === 'garage') {
      if (titleEl) titleEl.innerText = '🛠️ Garagem Alpina (Trenós & Snowboards)';
      initialCategory = 'sleds';
    } else if (shopType === 'hats') {
      if (titleEl) titleEl.innerText = '🎩 Boutique dos Gorros & Coroas';
      initialCategory = 'hats';
    } else if (shopType === 'atelier') {
      if (titleEl) titleEl.innerText = '🧣 Ateliê da Montanha (Cachecóis & Óculos)';
      initialCategory = 'scarves';
    } else {
      if (titleEl) titleEl.innerText = '🛒 Lojinha Alpina Geral';
      initialCategory = 'sleds';
    }

    document.querySelectorAll('[data-shop-tab]').forEach(tabBtn => {
      const cat = tabBtn.getAttribute('data-shop-tab');
      if (cat === initialCategory) {
        tabBtn.classList.add('active');
      } else {
        tabBtn.classList.remove('active');
      }
    });

    UIManager.renderShop(
      initialCategory,
      this.inventory,
      this.equipped,
      (id) => this.buyItem(id),
      (id, cat) => this.equipItem(id, cat)
    );
    const shopModal = document.getElementById('shop-modal');
    if (shopModal) shopModal.style.display = 'flex';
  }

  private sitOnNearestBench() {
    if (!this.nearBench || this.isSitting) return;
    this.isSitting = true;
    this.currentBench = this.nearBench;
    this.playerPosX = this.nearBench.x;
    this.playerPosZ = this.nearBench.z;
    this.playerPosY = 0.28;
    this.playerGroup.rotation.y = this.nearBench.rotY;

    const sitPrompt = document.getElementById('sit-bench-prompt');
    if (sitPrompt) sitPrompt.style.display = 'none';
    const standPrompt = document.getElementById('stand-up-prompt');
    if (standPrompt) standPrompt.style.display = 'block';

    UIManager.showToast('Você sentou no banco para apreciar a vista.', 'info', this.soundManager);
  }

  private standUpFromBench() {
    if (!this.isSitting || !this.currentBench) return;
    this.isSitting = false;
    this.playerPosY = 0;
    this.playerPosX += Math.sin(this.currentBench.rotY) * 0.95;
    this.playerPosZ += Math.cos(this.currentBench.rotY) * 0.95;
    this.currentBench = null;

    const standPrompt = document.getElementById('stand-up-prompt');
    if (standPrompt) standPrompt.style.display = 'none';
  }

  private triggerCurrentHubInteraction() {
    if (this.isSitting) {
      this.standUpFromBench();
    } else if (this.nearBench) {
      this.sitOnNearestBench();
    } else if (this.nearGarage) {
      this.openSegmentedShop('garage');
    } else if (this.nearHatShop) {
      this.openSegmentedShop('hats');
    } else if (this.nearAtelier) {
      this.openSegmentedShop('atelier');
    } else if (this.nearPhoneBooth) {
      UIManager.openCharacterModal(this.selectedCharacter, (charId) => {
        this.selectedCharacter = charId;
        this.saveSettings();
        this.respawnPlayerMesh();
        UIManager.closeAllModals();
      });
    } else if (this.nearCableCar) {
      this.startCableCarClimb();
    } else if (this.nearCarnivalBooth) {
      this.loadShootingGalleryScene();
    } else if (this.nearSnowballWarPortal) {
      this.openSnowballWarChoiceModal();
    } else if (this.nearRecords) {
      this.openLeaderboardModal();
    }
  }

  // =========================================================================
  // EVENT LISTENERS E CONTROLES (PC & MOBILE)
  // =========================================================================
  private setupUIAndControls() {
    const loginScreen = document.getElementById('login-screen')!;
    const loginBtn = document.getElementById('login-btn')!;
    const quickLoginBtn = document.getElementById('quick-login-btn')!;

    const defaultNicknames = [
      'Pinguim_Veloz',
      'Lobo_das_Neves',
      'Saltador_Polar',
      'Mestre_do_Gelo',
      'Raposa_Branca',
      'Esquiador_Pro',
      'Capitão_Geada',
      'Urso_do_Cume'
    ];

    const startGame = (useQuickLogin = false) => {
      this.soundManager.initAudio();
      const usernameInput = document.getElementById('username-input') as HTMLInputElement | null;
      let chosenName = usernameInput?.value?.trim() || '';
      if (!chosenName || useQuickLogin) {
        chosenName = defaultNicknames[Math.floor(Math.random() * defaultNicknames.length)];
      }
      this.playerName = chosenName;
      try {
        localStorage.setItem('snow_slide_player_name', this.playerName);
      } catch (e) {}

      this.redrawLocalNameTag();
      loginScreen.style.display = 'none';
      this.loadHubScene();
      this.connectMultiplayerHub();
    };

    loginBtn.addEventListener('click', () => startGame(false));
    quickLoginBtn.addEventListener('click', () => startGame(true));

    // Controles de Teclado
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      if (e.key === 'Enter' && this.currentScene === 'HUB' && !isTyping) {
        e.preventDefault();
        const chatInp = document.getElementById('hub-chat-input');
        if (chatInp) chatInp.focus();
        return;
      }

      if (isTyping) {
        if (e.key === 'Escape') {
          (activeEl as HTMLElement).blur();
        }
        return;
      }

      if (UIManager.isAnyModalOpen()) {
        if (e.key === 'Escape') UIManager.closeAllModals();
        return;
      }

      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keyW = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keyS = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keyA = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keyD = true;
      if (e.key === 'Shift') this.keyShift = true;

      if (e.code === 'Space') {
        if (this.currentScene === 'HUB' || this.currentScene === 'SNOWBALL_WAR' || this.currentScene === 'SNOWBALL_WAR_PVP') {
          if (!this.isChargingSnowball) {
            this.isChargingSnowball = true;
            this.snowballChargeStartTime = performance.now();
          }
        } else if (this.currentScene === 'RACING') {
          if (!this.isJumping) {
            this.isJumping = true;
            this.jumpVelY = 0.44;
            this.soundManager.playJumpSound();
          } else {
            this.performAirTrick();
          }
        } else if (this.currentScene === 'SHOOTING_GALLERY') {
          this.shootCarnivalToyGun();
        }
      }

      if (e.code === 'KeyQ') {
        if (this.currentScene === 'RACING') {
          this.useCurrentItem();
        }
      }

      if (e.code === 'KeyT') {
        if (this.currentScene === 'HUB') {
          this.openEmoteWheelModal();
        }
      }

      if (e.code === 'KeyE') {
        if (this.currentScene === 'HUB') this.triggerCurrentHubInteraction();
      }

      if (e.code === 'Tab') {
        e.preventDefault();
        const invModal = document.getElementById('inventory-modal')!;
        if (invModal.style.display === 'flex') {
          invModal.style.display = 'none';
        } else {
          if (document.pointerLockElement) {
            try { document.exitPointerLock(); } catch (err) {}
          }
          UIManager.closeAllModals();
          UIManager.renderInventory('sleds', this.inventory, this.equipped, (id, cat) => this.equipItem(id, cat));
          invModal.style.display = 'flex';
        }
      }

      if (e.code === 'KeyO') {
        this.openSettingsModal();
      }

      if (e.code === 'KeyH') {
        const modal = document.getElementById('instructions-modal');
        if (modal) {
          if (modal.style.display === 'flex') modal.style.display = 'none';
          else {
            UIManager.closeAllModals();
            modal.style.display = 'flex';
          }
        }
      }

      if (e.code === 'KeyL') {
        const modal = document.getElementById('records-modal');
        if (modal) {
          if (modal.style.display === 'flex') modal.style.display = 'none';
          else {
            UIManager.closeAllModals();
            this.openLeaderboardModal();
          }
        }
      }

      if (e.code === 'Escape') {
        if (this.currentScene === 'SHOOTING_GALLERY' || this.currentScene === 'SNOWBALL_WAR') {
          this.loadHubScene();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keyW = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keyS = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keyA = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keyD = false;
      if (e.key === 'Shift') this.keyShift = false;

      if (e.code === 'Space') {
        if ((this.currentScene === 'HUB' || this.currentScene === 'SNOWBALL_WAR') && this.isChargingSnowball) {
          this.isChargingSnowball = false;
          this.throwSnowball(this.currentChargeRatio);
          const bar = document.getElementById('snowball-charge-container');
          if (bar) bar.style.display = 'none';
        }
      }
    });

    // Mouse Look & Pointer Lock
    const canvas = this.renderer.domElement;
    canvas.addEventListener('click', () => {
      if (!this.isPointerLocked && !UIManager.isAnyModalOpen() && this.currentScene !== 'LOGIN') {
        try {
          canvas.requestPointerLock();
        } catch (e) {}
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === canvas;
    });

    window.addEventListener('mousemove', (e) => {
      if (UIManager.isAnyModalOpen()) return;

      if (this.isPointerLocked || this.isRightMouseDown) {
        const sens = 0.0022 * this.mouseSensMultiplier;
        const dirY = this.invertY ? -1 : 1;

        this.cameraAngleY -= e.movementX * sens;
        this.cameraAngleX = Math.max(-0.25, Math.min(1.15, this.cameraAngleX + e.movementY * sens * dirY));
      }
    });

    window.addEventListener('mousedown', (e) => {
      if (UIManager.isAnyModalOpen()) return;
      this.soundManager.initAudio();

      if (e.button === 2) {
        e.preventDefault();
        this.isRightMouseDown = true;
        this.isAimingDownSights = true;
      }

      if (e.button === 0) {
        if (this.currentScene === 'SHOOTING_GALLERY') {
          this.shootCarnivalToyGun();
        } else if (this.currentScene === 'HUB' || this.currentScene === 'SNOWBALL_WAR') {
          if (!this.isChargingSnowball) {
            this.isChargingSnowball = true;
            this.snowballChargeStartTime = performance.now();
          }
        }
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this.isRightMouseDown = false;
        this.isAimingDownSights = false;
      }

      if (e.button === 0) {
        if ((this.currentScene === 'HUB' || this.currentScene === 'SNOWBALL_WAR') && this.isChargingSnowball) {
          this.isChargingSnowball = false;
          this.throwSnowball(this.currentChargeRatio);
          const bar = document.getElementById('snowball-charge-container');
          if (bar) bar.style.display = 'none';
        }
      }
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Controles Touch Mobile (Analógico Virtual Dinâmico e Deslize de Câmera)
    const setupTouchControls = () => {
      const joyBase = document.getElementById('joystick-base');
      const joyKnob = document.getElementById('joystick-knob');
      const joyUi = document.getElementById('joystick-ui');

      if (joyBase && joyKnob && joyUi) {
        joyBase.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this.soundManager.initAudio();
          this.joystickActive = true;
          this.activeJoystickPointerId = e.pointerId;
          const rect = joyBase.getBoundingClientRect();
          this.joystickStartX = rect.left + rect.width / 2;
          this.joystickStartY = rect.top + rect.height / 2;
          joyKnob.style.transform = `translate(0px, 0px)`;
        });

        window.addEventListener('pointermove', (e) => {
          if (this.joystickActive && e.pointerId === this.activeJoystickPointerId && joyKnob) {
            const dx = e.clientX - this.joystickStartX;
            const dy = e.clientY - this.joystickStartY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxR = 48;
            const clampedDist = Math.min(dist, maxR);
            const angle = Math.atan2(dy, dx);

            const knobX = Math.cos(angle) * clampedDist;
            const knobY = Math.sin(angle) * clampedDist;
            joyKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

            this.joystickMoveX = knobX / maxR;
            this.joystickMoveY = -knobY / maxR;
          }
        });

        const resetJoystick = (e: PointerEvent) => {
          if (this.joystickActive && e.pointerId === this.activeJoystickPointerId && joyKnob) {
            this.joystickActive = false;
            this.activeJoystickPointerId = null;
            this.joystickMoveX = 0;
            this.joystickMoveY = 0;
            joyKnob.style.transform = `translate(0px, 0px)`;
          }
        };

        window.addEventListener('pointerup', resetJoystick);
        window.addEventListener('pointercancel', resetJoystick);
      }

      // Deslize de Câmera na tela touch
      window.addEventListener('touchstart', (e) => {
        if (UIManager.isAnyModalOpen()) return;
        this.soundManager.initAudio();

        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.clientX > window.innerWidth * 0.35 && this.activeCameraTouchId === null) {
            this.activeCameraTouchId = t.identifier;
            this.lastCameraTouchX = t.clientX;
            this.lastCameraTouchY = t.clientY;
          }
        }
      }, { passive: false });

      window.addEventListener('touchmove', (e) => {
        if (UIManager.isAnyModalOpen()) return;

        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === this.activeCameraTouchId) {
            const dx = t.clientX - this.lastCameraTouchX;
            const dy = t.clientY - this.lastCameraTouchY;
            this.lastCameraTouchX = t.clientX;
            this.lastCameraTouchY = t.clientY;

            const touchSens = 0.006 * this.mouseSensMultiplier;
            const dirY = this.invertY ? -1 : 1;

            this.cameraAngleY -= dx * touchSens;
            this.cameraAngleX = Math.max(-0.25, Math.min(1.15, this.cameraAngleX + dy * touchSens * dirY));
          }
        }
      }, { passive: false });

      const endCameraTouch = (e: TouchEvent) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.activeCameraTouchId) {
            this.activeCameraTouchId = null;
          }
        }
      };

      window.addEventListener('touchend', endCameraTouch);
      window.addEventListener('touchcancel', endCameraTouch);

      // Botões Touch de Ação
      const jumpBtn = document.getElementById('jump-btn');
      if (jumpBtn) {
        jumpBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.soundManager.initAudio();
          if (!this.isJumping) {
            this.isJumping = true;
            this.jumpVelY = this.currentScene === 'RACING' ? 0.44 : 0.28;
            this.soundManager.playJumpSound();
          }
        });
      }

      const runBtn = document.getElementById('run-btn');
      if (runBtn) {
        runBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.isRunning = !this.isRunning;
          runBtn.style.background = this.isRunning ? '#f59e0b' : 'rgba(15, 23, 42, 0.82)';
        });
      }

      const sbBtn = document.getElementById('snowball-btn');
      if (sbBtn) {
        sbBtn.addEventListener('touchstart', (e) => {
          e.stopPropagation();
          this.soundManager.initAudio();
          if (this.currentScene === 'SHOOTING_GALLERY') {
            this.shootCarnivalToyGun();
          } else if (this.currentScene === 'HUB' || this.currentScene === 'SNOWBALL_WAR') {
            if (!this.isChargingSnowball) {
              this.isChargingSnowball = true;
              this.snowballChargeStartTime = performance.now();
            }
          }
        });

        sbBtn.addEventListener('touchend', (e) => {
          e.stopPropagation();
          if ((this.currentScene === 'HUB' || this.currentScene === 'SNOWBALL_WAR') && this.isChargingSnowball) {
            this.isChargingSnowball = false;
            this.throwSnowball(this.currentChargeRatio);
            const bar = document.getElementById('snowball-charge-container');
            if (bar) bar.style.display = 'none';
          }
        });
      }

      const aimBtn = document.getElementById('aim-btn');
      if (aimBtn) {
        aimBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.isAimingDownSights = !this.isAimingDownSights;
          aimBtn.style.background = this.isAimingDownSights ? '#0284c7' : 'rgba(15, 23, 42, 0.82)';
        });
      }

      const interactBtn = document.getElementById('interact-btn');
      if (interactBtn) {
        interactBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.currentScene === 'HUB') this.triggerCurrentHubInteraction();
        });
      }
    };

    setupTouchControls();

    // Botões dos Modais e HUD
    document.getElementById('open-inventory-btn')?.addEventListener('click', () => {
      const invModal = document.getElementById('inventory-modal')!;
      UIManager.closeAllModals();
      UIManager.renderInventory('sleds', this.inventory, this.equipped, (id, cat) => this.equipItem(id, cat));
      invModal.style.display = 'flex';
    });

    document.getElementById('open-settings-btn')?.addEventListener('click', () => this.openSettingsModal());

    document.getElementById('open-instructions-btn')?.addEventListener('click', () => {
      const m = document.getElementById('instructions-modal');
      if (m) {
        UIManager.closeAllModals();
        m.style.display = 'flex';
      }
    });

    document.getElementById('back-hub-btn')?.addEventListener('click', () => {
      if (this.isMultiplayerRace) {
        this.networkManager.leaveRace();
        this.isMultiplayerRace = false;
        this.connectMultiplayerHub();
      }
      this.loadHubScene();
    });
    document.getElementById('exit-shooting-btn')?.addEventListener('click', () => this.loadHubScene());
    document.getElementById('exit-war-btn')?.addEventListener('click', () => {
      if (this.isPvPArena) {
        this.networkManager.leaveArena();
        this.isPvPArena = false;
        this.connectMultiplayerHub();
      }
      this.loadHubScene();
    });
    document.getElementById('finish-to-hub-btn')?.addEventListener('click', () => {
      UIManager.closeAllModals();
      if (this.isMultiplayerRace) {
        this.networkManager.leaveRace();
        this.isMultiplayerRace = false;
        this.connectMultiplayerHub();
      }
      this.loadHubScene();
    });
    document.getElementById('shooting-to-hub-btn')?.addEventListener('click', () => {
      UIManager.closeAllModals();
      this.loadHubScene();
    });
    document.getElementById('war-to-hub-btn')?.addEventListener('click', () => {
      UIManager.closeAllModals();
      if (this.isPvPArena) {
        this.networkManager.leaveArena();
        this.isPvPArena = false;
        this.connectMultiplayerHub();
      }
      this.loadHubScene();
    });

    document.getElementById('retry-race-btn')?.addEventListener('click', () => {
      UIManager.closeAllModals();
      if (this.isMultiplayerRace) {
        this.startCableCarClimb();
      } else {
        this.loadRacingScene();
      }
    });
    document.getElementById('retry-shooting-btn')?.addEventListener('click', () => {
      UIManager.closeAllModals();
      this.loadShootingGalleryScene();
    });
    document.getElementById('retry-war-btn')?.addEventListener('click', () => {
      UIManager.closeAllModals();
      this.loadSnowballWarScene(this.isPvPArena);
    });

    // Botão de Usar Item e Slot de Item
    document.getElementById('item-use-btn')?.addEventListener('click', () => this.useCurrentItem());
    document.getElementById('race-item-slot')?.addEventListener('click', () => this.useCurrentItem());

    // Botão de Drift Mobile
    const driftBtn = document.getElementById('drift-btn');
    if (driftBtn) {
      driftBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.isDriftBtnDown = true;
      });
      driftBtn.addEventListener('pointerup', (e) => {
        e.stopPropagation();
        this.isDriftBtnDown = false;
      });
      driftBtn.addEventListener('pointercancel', (e) => {
        e.stopPropagation();
        this.isDriftBtnDown = false;
      });
    }

    // Modal de Escolha da Guerra de Neve (PvP vs Solo)
    document.getElementById('war-choice-pvp-btn')?.addEventListener('click', () => {
      document.getElementById('snowball-war-choice-modal')!.style.display = 'none';
      this.loadSnowballWarScene(true);
    });
    document.getElementById('war-choice-solo-btn')?.addEventListener('click', () => {
      document.getElementById('snowball-war-choice-modal')!.style.display = 'none';
      this.loadSnowballWarScene(false);
    });
    document.getElementById('war-choice-close-btn')?.addEventListener('click', () => {
      document.getElementById('snowball-war-choice-modal')!.style.display = 'none';
    });

    // Roda de Emotes e Dancinhas
    document.getElementById('emote-wheel-btn')?.addEventListener('click', () => this.openEmoteWheelModal());
    document.getElementById('close-emote-wheel-btn')?.addEventListener('click', () => {
      document.getElementById('emote-wheel-modal')!.style.display = 'none';
    });
    document.querySelectorAll('.emote-choice-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const anim = (e.currentTarget as HTMLElement).getAttribute('data-anim');
        if (anim) this.triggerEmote(anim);
      });
    });

    // Fechar modais
    document.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', () => UIManager.closeAllModals());
    });
    document.getElementById('understand-instructions-btn')?.addEventListener('click', () => UIManager.closeAllModals());

    // Abas da Loja
    document.querySelectorAll('[data-shop-tab]').forEach(tabBtn => {
      tabBtn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-shop-tab]').forEach(b => b.classList.remove('active'));
        const btn = e.currentTarget as HTMLElement;
        btn.classList.add('active');
        const cat = btn.getAttribute('data-shop-tab') as 'sleds' | 'hats' | 'scarves' | 'goggles';
        UIManager.renderShop(cat, this.inventory, this.equipped, (id) => this.buyItem(id), (id, c) => this.equipItem(id, c));
      });
    });

    // Abas do Inventário
    document.querySelectorAll('[data-inv-tab]').forEach(tabBtn => {
      tabBtn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-inv-tab]').forEach(b => b.classList.remove('active'));
        const btn = e.currentTarget as HTMLElement;
        btn.classList.add('active');
        const cat = btn.getAttribute('data-inv-tab') as 'sleds' | 'hats' | 'scarves' | 'goggles';
        UIManager.renderInventory(cat, this.inventory, this.equipped, (id, c) => this.equipItem(id, c));
      });
    });

    // Seleção de Personagem na Cabine
    document.querySelectorAll('.character-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const charId = (e.currentTarget as HTMLElement).getAttribute('data-char') as CharacterId;
        if (charId) {
          this.selectedCharacter = charId;
          this.saveSettings();
          this.respawnPlayerMesh();
          UIManager.openCharacterModal(this.selectedCharacter, () => {});
          UIManager.showToast(`Metamorfose concluída! Agora você é: ${charId.toUpperCase()}!`, 'success', this.soundManager);
        }
      });
    });

    // Sliders de Configuração
    const sensSlider = document.getElementById('mouse-sens-slider') as HTMLInputElement;
    if (sensSlider) {
      sensSlider.addEventListener('input', () => {
        this.mouseSensMultiplier = parseFloat(sensSlider.value);
        const valEl = document.getElementById('mouse-sens-val');
        if (valEl) valEl.innerText = `${this.mouseSensMultiplier.toFixed(1)}x`;
        this.saveSettings();
      });
    }

    const invertToggle = document.getElementById('invert-y-toggle') as HTMLInputElement;
    if (invertToggle) {
      invertToggle.addEventListener('change', () => {
        this.invertY = invertToggle.checked;
        this.saveSettings();
      });
    }

    const soundToggle = document.getElementById('sound-fx-toggle') as HTMLInputElement;
    if (soundToggle) {
      soundToggle.addEventListener('change', () => {
        this.soundManager.setSoundEnabled(soundToggle.checked);
        this.saveSettings();
      });
    }

    const bgmToggle = document.getElementById('bgm-music-toggle') as HTMLInputElement;
    if (bgmToggle) {
      bgmToggle.addEventListener('change', () => {
        this.musicManager.setEnabled(bgmToggle.checked);
      });
    }

    const bgmSlider = document.getElementById('bgm-volume-slider') as HTMLInputElement;
    if (bgmSlider) {
      bgmSlider.addEventListener('input', () => {
        const vol = parseFloat(bgmSlider.value);
        this.musicManager.setVolume(vol);
        const bgmVal = document.getElementById('bgm-volume-val');
        if (bgmVal) bgmVal.innerText = `${Math.round(vol * 100)}%`;
      });
    }

    document.getElementById('reset-settings-btn')?.addEventListener('click', () => {
      this.mouseSensMultiplier = 1.0;
      this.invertY = false;
      this.soundManager.setSoundEnabled(true);
      this.musicManager.setEnabled(true);
      this.musicManager.setVolume(0.45);
      if (sensSlider) sensSlider.value = '1.0';
      const valEl = document.getElementById('mouse-sens-val');
      if (valEl) valEl.innerText = '1.0x';
      if (invertToggle) invertToggle.checked = false;
      if (soundToggle) soundToggle.checked = true;
      if (bgmToggle) bgmToggle.checked = true;
      if (bgmSlider) bgmSlider.value = '0.45';
      const bgmVal = document.getElementById('bgm-volume-val');
      if (bgmVal) bgmVal.innerText = '45%';
      this.saveSettings();
      UIManager.showToast('Configurações restauradas para o padrão!', 'info', this.soundManager);
    });

    // Chat do Hub & Quick Emotes
    const chatInput = document.getElementById('hub-chat-input') as HTMLInputElement | null;
    const chatSendBtn = document.getElementById('hub-chat-send-btn');
    const sendChatMsg = () => {
      if (!chatInput) return;
      const text = chatInput.value.trim();
      if (text.length > 0) {
        this.networkManager.sendChat(text);
        this.showLocalChatBubble(text);
        chatInput.value = '';
      }
    };
    chatSendBtn?.addEventListener('click', sendChatMsg);
    chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.stopPropagation();
        sendChatMsg();
        chatInput.blur();
      }
    });

    document.querySelectorAll('.emote-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const emote = (e.currentTarget as HTMLElement).getAttribute('data-emote') || '👋';
        this.networkManager.sendEmote(emote);
        this.showLocalChatBubble(emote);
      });
    });

    // Lobby do Teleférico
    document.getElementById('lobby-ready-btn')?.addEventListener('click', () => {
      this.networkManager.sendRaceReady();
      const readyBtn = document.getElementById('lobby-ready-btn');
      if (readyBtn) {
        readyBtn.innerText = '✅ Você está Pronto!';
        readyBtn.style.background = '#22c55e';
      }
    });

    document.getElementById('lobby-cancel-btn')?.addEventListener('click', () => {
      this.networkManager.leaveRace();
      this.isMultiplayerRace = false;
      document.getElementById('cable-car-lobby-modal')!.style.display = 'none';
      this.connectMultiplayerHub();
    });

    // ==========================================
    // SELETOR DE MODO DO LOBBY: PÚBLICA VS PRIVADA
    // ==========================================
    const modePubBtn = document.getElementById('lobby-mode-public-btn');
    const modePrivBtn = document.getElementById('lobby-mode-private-btn');
    const privPanel = document.getElementById('private-room-panel');
    const roomInput = document.getElementById('private-room-code-input') as HTMLInputElement | null;
    const btnGenCode = document.getElementById('btn-generate-room-code');
    const btnCopyLink = document.getElementById('btn-copy-invite-link');

    const generateFunRoomCode = () => {
      const prefixes = ['NEVE', 'GELADO', 'PINGUIM', 'ALPINO', 'POLAR', 'ESQUI'];
      const num = Math.floor(10 + Math.random() * 90);
      return `${prefixes[Math.floor(Math.random() * prefixes.length)]}-${num}`;
    };

    modePubBtn?.addEventListener('click', () => {
      this.isPrivateRoom = false;
      this.customRoomCode = '';
      if (modePubBtn) { modePubBtn.style.background = '#0ea5e9'; modePubBtn.style.color = '#fff'; }
      if (modePrivBtn) { modePrivBtn.style.background = 'transparent'; modePrivBtn.style.color = '#94a3b8'; }
      if (privPanel) privPanel.style.display = 'none';
      const badge = document.getElementById('room-code-status-badge');
      if (badge) badge.innerText = '';
    });

    modePrivBtn?.addEventListener('click', () => {
      this.isPrivateRoom = true;
      if (modePrivBtn) { modePrivBtn.style.background = '#0ea5e9'; modePrivBtn.style.color = '#fff'; }
      if (modePubBtn) { modePubBtn.style.background = 'transparent'; modePubBtn.style.color = '#94a3b8'; }
      if (privPanel) privPanel.style.display = 'block';
      if (roomInput && (!roomInput.value || roomInput.value.trim().length === 0)) {
        roomInput.value = this.customRoomCode || generateFunRoomCode();
        this.customRoomCode = roomInput.value;
      }
      const badge = document.getElementById('room-code-status-badge');
      if (badge) badge.innerText = `Sala: ${this.customRoomCode}`;
    });

    btnGenCode?.addEventListener('click', () => {
      if (roomInput) {
        roomInput.value = generateFunRoomCode();
        this.customRoomCode = roomInput.value;
        const badge = document.getElementById('room-code-status-badge');
        if (badge) badge.innerText = `Sala: ${this.customRoomCode}`;
        this.soundManager.playTone(600, 'sine', 0.1, 0.1);
      }
    });

    roomInput?.addEventListener('input', () => {
      if (roomInput) {
        this.customRoomCode = roomInput.value.trim().toUpperCase();
        const badge = document.getElementById('room-code-status-badge');
        if (badge) badge.innerText = this.customRoomCode ? `Sala: ${this.customRoomCode}` : '';
      }
    });

    btnCopyLink?.addEventListener('click', () => {
      const code = this.customRoomCode || (roomInput ? roomInput.value.trim().toUpperCase() : '');
      if (!code) {
        UIManager.showToast('Gere ou digite um código de sala primeiro!', 'warning', this.soundManager);
        return;
      }
      const url = `${window.location.origin}${window.location.pathname}?room=${code}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          UIManager.showToast('📋 Link de convite copiado para a área de transferência!', 'success', this.soundManager);
        }).catch(() => {
          prompt('Copie o link abaixo para enviar aos seus amigos:', url);
        });
      } else {
        prompt('Copie o link abaixo para enviar aos seus amigos:', url);
      }
    });

    // Se já veio com código de sala na URL, ativa aba de sala privada
    if (this.customRoomCode) {
      if (modePrivBtn) modePrivBtn.click();
      if (roomInput) roomInput.value = this.customRoomCode;
    }

    // ==========================================
    // ABAS DO SALÃO DE RECORDES (LEADERBOARDS)
    // ==========================================
    const tabRaceBtn = document.getElementById('leaderboard-tab-race-btn');
    const tabArenaBtn = document.getElementById('leaderboard-tab-arena-btn');
    const refreshLeadBtn = document.getElementById('btn-refresh-leaderboard');

    tabRaceBtn?.addEventListener('click', () => {
      this.currentLeaderboardTab = 'race';
      if (tabRaceBtn) { tabRaceBtn.style.background = '#0ea5e9'; tabRaceBtn.style.color = '#fff'; }
      if (tabArenaBtn) { tabArenaBtn.style.background = 'transparent'; tabArenaBtn.style.color = '#94a3b8'; }
      UIManager.renderLeaderboardTable(this.cachedLeaderboard, 'race');
    });

    tabArenaBtn?.addEventListener('click', () => {
      this.currentLeaderboardTab = 'arena';
      if (tabArenaBtn) { tabArenaBtn.style.background = '#0ea5e9'; tabArenaBtn.style.color = '#fff'; }
      if (tabRaceBtn) { tabRaceBtn.style.background = 'transparent'; tabRaceBtn.style.color = '#94a3b8'; }
      UIManager.renderLeaderboardTable(this.cachedLeaderboard, 'arena');
    });

    refreshLeadBtn?.addEventListener('click', async () => {
      const data = await this.networkManager.fetchLeaderboard();
      if (data) {
        this.cachedLeaderboard = data;
        UIManager.renderLeaderboardTable(this.cachedLeaderboard, this.currentLeaderboardTab);
        UIManager.showToast('Recordes atualizados com sucesso!', 'success', this.soundManager);
      }
    });

    // ==========================================
    // SELETOR DE CLIMA & CICLO DIA/NOITE
    // ==========================================
    const weatherSelect = document.getElementById('weather-cycle-select') as HTMLSelectElement | null;
    if (weatherSelect) {
      weatherSelect.value = this.weatherMode;
      weatherSelect.addEventListener('change', () => {
        this.weatherMode = weatherSelect.value as any;
        this.saveSettings();
        this.updateWeatherAndDayCycle(0);
        UIManager.showToast(`🌤️ Clima alterado para: ${weatherSelect.options[weatherSelect.selectedIndex].text}`, 'info', this.soundManager);
      });
    }
  }

  private async connectMultiplayerHub() {
    this.networkManager.onStatusChange = (status, count) => {
      UIManager.updateNetworkBadge(status, count);
    };

    this.networkManager.onPlayerJoined = (_id, remotePlayer) => {
      if (this.currentScene === 'HUB') {
        remotePlayer.rebuildAvatar(false);
        this.scene.add(remotePlayer.group);
      } else if (this.currentScene === 'RACING' && this.isMultiplayerRace) {
        remotePlayer.rebuildAvatar(true);
        this.scene.add(remotePlayer.group);
      }
    };

    this.networkManager.onChatMessage = (data) => {
      UIManager.addChatMessage(data.senderName, data.text, data.senderId === 'SYSTEM');
      if (data.senderId !== this.networkManager.sessionId && data.senderId !== 'SYSTEM') {
        this.soundManager.playTone(523.25, 'sine', 0.1, 0.1);
      }
    };

    this.networkManager.onPlayerEmote = (data) => {
      UIManager.addChatMessage(data.senderName, data.emote, false);
    };

    this.networkManager.onSnowballSpawned = (data) => {
      this.spawnRemoteSnowball(data);
    };

    const connected = await this.networkManager.connectToHub(
      {
        name: this.playerName,
        character: this.selectedCharacter,
        vehicle: this.equipped.vehicle,
        hat: this.equipped.hat,
        scarf: this.equipped.scarf,
        goggles: this.equipped.goggles,
      },
      this.scene
    );

    if (connected) {
      UIManager.showToast(`Conectado ao servidor online! Olá, ${this.playerName}!`, 'success', this.soundManager);
    } else {
      UIManager.showToast('Servidor offline - jogando em modo solo.', 'info');
    }
  }

  private openSettingsModal() {
    if (document.pointerLockElement) {
      try { document.exitPointerLock(); } catch (e) {}
    }
    UIManager.closeAllModals();

    const slider = document.getElementById('mouse-sens-slider') as HTMLInputElement;
    if (slider) slider.value = this.mouseSensMultiplier.toString();

    const sensVal = document.getElementById('mouse-sens-val');
    if (sensVal) sensVal.innerText = `${this.mouseSensMultiplier.toFixed(1)}x`;

    const invertBox = document.getElementById('invert-y-toggle') as HTMLInputElement;
    if (invertBox) invertBox.checked = this.invertY;

    const soundBox = document.getElementById('sound-fx-toggle') as HTMLInputElement;
    if (soundBox) soundBox.checked = this.soundManager.isSoundEnabled();

    const bgmBox = document.getElementById('bgm-music-toggle') as HTMLInputElement;
    if (bgmBox) bgmBox.checked = this.musicManager.isBGMEnabled();

    const bgmSlider = document.getElementById('bgm-volume-slider') as HTMLInputElement;
    if (bgmSlider) bgmSlider.value = this.musicManager.getVolume().toString();

    const bgmVal = document.getElementById('bgm-volume-val');
    if (bgmVal) bgmVal.innerText = `${Math.round(this.musicManager.getVolume() * 100)}%`;

    const modal = document.getElementById('settings-modal');
    if (modal) modal.style.display = 'flex';
  }

  // =========================================================================
  // GAME LOOP PRINCIPAL
  // =========================================================================
  private loop = () => {
    requestAnimationFrame(this.loop);

    const targetFov = (this.currentScene === 'HUB' || this.currentScene === 'SNOWBALL_WAR') && this.isAimingDownSights ? 46 : 75;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.16);
    this.camera.updateProjectionMatrix();

    const crosshairEl = document.getElementById('hub-crosshair');
    if (crosshairEl) {
      crosshairEl.classList.toggle('aiming', this.isAimingDownSights);
    }

    if (this.throwAnimTimer > 0) {
      this.throwAnimTimer--;
    }

    if (this.isChargingSnowball) {
      const duration = performance.now() - this.snowballChargeStartTime;
      const ratio = Math.min(1.0, Math.max(0.15, duration / 850));
      this.currentChargeRatio = ratio;
      const pct = Math.round(ratio * 100);
      const container = document.getElementById('snowball-charge-container');
      const fill = document.getElementById('snowball-charge-fill');
      const txt = document.getElementById('snowball-charge-text');
      if (container) container.style.display = 'block';
      if (fill) fill.style.width = `${pct}%`;
      if (txt) {
        if (pct >= 85) {
          txt.innerText = `FORÇA: ${pct}% ❄️ TIRO RETO!`;
        } else if (pct >= 50) {
          txt.innerText = `FORÇA: ${pct}% ⚡ RÁPIDO`;
        } else {
          txt.innerText = `FORÇA: ${pct}% 🏹 ARCO`;
        }
      }
    }

    let inputForward = 0;
    let inputLateral = 0;

    if (this.keyW) inputForward += 1;
    if (this.keyS) inputForward -= 1;
    if (this.keyA) inputLateral -= 1;
    if (this.keyD) inputLateral += 1;

    if (this.joystickActive) {
      inputForward = this.joystickMoveY;
      inputLateral = this.joystickMoveX;
    }

    const pad = this.gamepadManager.getState();
    if (pad.connected) {
      if (Math.abs(pad.stickY) > 0.05) inputForward -= pad.stickY;
      if (Math.abs(pad.stickX) > 0.05) inputLateral += pad.stickX;

      if (this.currentScene === 'RACING') {
        if (pad.accelerate > 0.05) inputForward += pad.accelerate;
        if (pad.brake > 0.05) inputForward -= pad.brake;
        if (pad.justJump) {
          if (this.isJumping) {
            this.performAirTrick();
          } else {
            this.isJumping = true;
            this.jumpVelY = 0.54;
            this.soundManager.playJumpSound();
          }
        }
        if (pad.justItem) {
          this.useCurrentItem();
        }
        if (pad.justEmote) {
          this.openEmoteWheelModal();
        }
      } else {
        if (pad.justJump && !this.isJumping && !this.isSitting) {
          this.isJumping = true;
          this.jumpVelY = 0.32;
          this.soundManager.playJumpSound();
        }
        if (pad.justEmote) {
          this.openEmoteWheelModal();
        }
      }
    }

    inputForward = Math.max(-1, Math.min(1, inputForward));
    inputLateral = Math.max(-1, Math.min(1, inputLateral));

    if (this.currentScene === 'HUB') {
      this.updateWeatherAndDayCycle(1 / 60);
      this.updateWanderingNPCs();
      this.updateSnowballs();
      this.particleManager.updateSnowballBursts();

      if (!this.isSitting) {
        const running = this.keyShift || this.isRunning;
        const moveSpeed = running ? 0.22 : 0.14;

        const cosYaw = Math.cos(this.cameraAngleY);
        const sinYaw = Math.sin(this.cameraAngleY);

        const fwdX = -sinYaw;
        const fwdZ = -cosYaw;
        const rightX = cosYaw;
        const rightZ = -sinYaw;

        let moveWorldX = (fwdX * inputForward) + (rightX * inputLateral);
        let moveWorldZ = (fwdZ * inputForward) + (rightZ * inputLateral);

        const moveMag = Math.sqrt(moveWorldX * moveWorldX + moveWorldZ * moveWorldZ);
        const isMoving = moveMag > 0.05;

        if (isMoving) {
          moveWorldX = (moveWorldX / moveMag) * moveSpeed;
          moveWorldZ = (moveWorldZ / moveMag) * moveSpeed;

          const desiredX = this.playerPosX + moveWorldX;
          const desiredZ = this.playerPosZ + moveWorldZ;

          const resolved = CollisionSystem.resolveHubCollisions(desiredX, desiredZ, this.hubColliders, 0.85);
          this.playerPosX = resolved.x;
          this.playerPosZ = resolved.z;

          if (this.isAimingDownSights || this.isChargingSnowball || this.throwAnimTimer > 0) {
            const targetRotY = this.cameraAngleY + Math.PI;
            let diffRot = targetRotY - this.playerGroup.rotation.y;
            while (diffRot > Math.PI) diffRot -= Math.PI * 2;
            while (diffRot < -Math.PI) diffRot += Math.PI * 2;
            this.playerGroup.rotation.y += diffRot * 0.35;
          } else {
            const targetRotY = Math.atan2(moveWorldX, moveWorldZ);
            let diffRot = targetRotY - this.playerGroup.rotation.y;
            while (diffRot > Math.PI) diffRot -= Math.PI * 2;
            while (diffRot < -Math.PI) diffRot += Math.PI * 2;
            this.playerGroup.rotation.y += diffRot * 0.22;
          }

          this.walkTime += running ? 0.30 : 0.18;
          if (this.playerRig) {
            RigAnimator.animateRigWalk(
              this.playerRig,
              this.walkTime,
              running,
              this.isChargingSnowball,
              this.currentChargeRatio,
              this.throwAnimTimer
            );
          }

          if (Math.random() < 0.22) {
            this.trailManager.addContinuousSnowTrail(this.playerPosX, this.playerPosY, this.playerPosZ, this.playerGroup.rotation.y, false);
          }
        } else {
          if (this.isAimingDownSights || this.isChargingSnowball || this.throwAnimTimer > 0) {
            const targetRotY = this.cameraAngleY + Math.PI;
            let diffRot = targetRotY - this.playerGroup.rotation.y;
            while (diffRot > Math.PI) diffRot -= Math.PI * 2;
            while (diffRot < -Math.PI) diffRot += Math.PI * 2;
            this.playerGroup.rotation.y += diffRot * 0.35;
          }
          if (this.playerRig) {
            RigAnimator.animateRigIdle(
              this.playerRig,
              this.isSitting,
              this.isChargingSnowball,
              this.currentChargeRatio,
              this.throwAnimTimer
            );
          }
        }

        if (this.isJumping) {
          this.playerPosY += this.jumpVelY;
          this.jumpVelY -= 0.022;
          if (this.playerPosY <= 0) {
            this.playerPosY = 0;
            this.isJumping = false;
            this.jumpVelY = 0;
            this.particleManager.emitSnowSpray(6, 0, this.playerPosX, this.playerPosY, this.playerPosZ);
          }
        }
      } else {
        if (this.playerRig) {
          RigAnimator.animateRigIdle(
            this.playerRig,
            true,
            this.isChargingSnowball,
            this.currentChargeRatio,
            this.throwAnimTimer
          );
        }
      }

      this.playerGroup.position.set(this.playerPosX, this.playerPosY, this.playerPosZ);

      // Sincronização e Telemetria Multiplayer no Hub
      const nowSec = performance.now() * 0.001;
      this.networkManager.updateRemotePlayers(0.016, nowSec, false);
      const movingFlag = !this.isSitting && (Math.abs(inputForward) > 0.05 || Math.abs(inputLateral) > 0.05);
      this.networkManager.sendHubTransform(
        this.playerPosX,
        this.playerPosY,
        this.playerPosZ,
        this.playerGroup.rotation.x,
        this.playerGroup.rotation.y,
        this.playerGroup.rotation.z,
        this.playerVelX,
        this.playerVelZ,
        movingFlag,
        this.keyShift || this.isRunning,
        this.isSitting,
        this.isSitting ? 'sit' : (this.throwAnimTimer > 0 ? 'throw' : (movingFlag ? 'walk' : 'idle'))
      );

      // Temporizador de balão de chat local
      if (this.localChatTimer > 0) {
        this.localChatTimer -= 0.016;
        if (this.localChatTimer <= 0) {
          this.localChatText = '';
          this.redrawLocalNameTag();
        }
      }

      // Verificação de Proximidades no Hub
      this.nearBench = null;
      if (!this.isSitting) {
        for (const b of this.benches) {
          const dx = this.playerPosX - b.x;
          const dz = this.playerPosZ - b.z;
          if (Math.sqrt(dx * dx + dz * dz) < 2.2) {
            this.nearBench = b;
            break;
          }
        }
        const sitPrompt = document.getElementById('sit-bench-prompt');
        if (sitPrompt) sitPrompt.style.display = this.nearBench ? 'block' : 'none';
      }

      const distCableCar = this.cableCarStationPos.distanceTo(new THREE.Vector3(this.playerPosX, 0, this.playerPosZ));
      const cableCarPrompt = document.getElementById('cable-car-prompt');
      if (cableCarPrompt) {
        this.nearCableCar = distCableCar < 6.5;
        cableCarPrompt.style.display = (this.nearCableCar && !this.isSitting) ? 'block' : 'none';
      }

      const distGarage = this.garageCounterPos.distanceTo(new THREE.Vector3(this.playerPosX, 0, this.playerPosZ));
      const garagePrompt = document.getElementById('garage-shop-prompt');
      if (garagePrompt) {
        this.nearGarage = distGarage < 4.5;
        garagePrompt.style.display = (this.nearGarage && !this.isSitting) ? 'block' : 'none';
      }

      const distHat = this.hatShopCounterPos.distanceTo(new THREE.Vector3(this.playerPosX, 0, this.playerPosZ));
      const hatPrompt = document.getElementById('hat-shop-prompt');
      if (hatPrompt) {
        this.nearHatShop = distHat < 4.5;
        hatPrompt.style.display = (this.nearHatShop && !this.isSitting) ? 'block' : 'none';
      }

      const distAtelier = this.atelierCounterPos.distanceTo(new THREE.Vector3(this.playerPosX, 0, this.playerPosZ));
      const atelierPrompt = document.getElementById('atelier-shop-prompt');
      if (atelierPrompt) {
        this.nearAtelier = distAtelier < 4.5;
        atelierPrompt.style.display = (this.nearAtelier && !this.isSitting) ? 'block' : 'none';
      }

      const distRecords = this.recordsBoardPos.distanceTo(new THREE.Vector3(this.playerPosX, 0, this.playerPosZ));
      const recordsPrompt = document.getElementById('records-prompt');
      if (recordsPrompt) {
        this.nearRecords = distRecords < 4.2;
        recordsPrompt.style.display = (this.nearRecords && !this.isSitting) ? 'block' : 'none';
      }

      const distPhone = this.phoneBoothPos.distanceTo(new THREE.Vector3(this.playerPosX, 0, this.playerPosZ));
      const phonePrompt = document.getElementById('phone-booth-prompt');
      if (phonePrompt) {
        this.nearPhoneBooth = distPhone < 3.2;
        phonePrompt.style.display = (this.nearPhoneBooth && !this.isSitting) ? 'block' : 'none';
      }

      const distCarnival = this.carnivalBoothPos.distanceTo(new THREE.Vector3(this.playerPosX, 0, this.playerPosZ));
      const carnivalPrompt = document.getElementById('carnival-prompt');
      if (carnivalPrompt) {
        this.nearCarnivalBooth = distCarnival < 5.5;
        carnivalPrompt.style.display = (this.nearCarnivalBooth && !this.isSitting) ? 'block' : 'none';
      }

      const distWar = this.snowballWarPortalPos.distanceTo(new THREE.Vector3(this.playerPosX, 0, this.playerPosZ));
      const warPrompt = document.getElementById('snowball-war-prompt');
      if (warPrompt) {
        this.nearSnowballWarPortal = distWar < 5.5;
        warPrompt.style.display = (this.nearSnowballWarPortal && !this.isSitting) ? 'block' : 'none';
      }

      const hasInteraction = (this.isSitting || this.nearBench || this.nearGarage || this.nearHatShop || this.nearAtelier || this.nearRecords || this.nearPhoneBooth || this.nearCableCar || this.nearCarnivalBooth || this.nearSnowballWarPortal);
      const interactBtn = document.getElementById('interact-btn');
      if (interactBtn) {
        interactBtn.style.display = hasInteraction ? 'flex' : 'none';
        if (this.isSitting) interactBtn.innerHTML = '🚶 LEVANTAR';
        else if (this.nearBench) interactBtn.innerHTML = '🪑 SENTAR';
        else if (this.nearGarage || this.nearHatShop || this.nearAtelier) interactBtn.innerHTML = '🛍️ LOJA';
        else if (this.nearPhoneBooth) interactBtn.innerHTML = '📞 CABINE';
        else if (this.nearCableCar) interactBtn.innerHTML = '🚠 CORRIDA';
        else if (this.nearCarnivalBooth) interactBtn.innerHTML = '🎯 TIRO';
        else if (this.nearSnowballWarPortal) interactBtn.innerHTML = '❄️ GUERRA';
        else if (this.nearRecords) interactBtn.innerHTML = '🏆 RECORDES';
      }

      // Animação dos Comerciantes
      const now = Date.now();
      if (this.npcRalph) this.npcRalph.rotation.y = Math.sin(now * 0.002) * 0.15;
      if (this.npcBabette) this.npcBabette.rotation.y = Math.sin(now * 0.0025 + 1.0) * 0.15;
      if (this.npcBoris) this.npcBoris.rotation.y = Math.sin(now * 0.0018 + 2.0) * 0.15;

      // Animação das fagulhas da fogueira
      if (this.bonfireEmbers && this.bonfireLight) {
        this.bonfireLight.intensity = 2.4 + Math.sin(now * 0.01) * 0.4;
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

      // Câmera 3ª pessoa
      const targetLookY = this.playerPosY + 1.25;
      const cosPitch = Math.cos(this.cameraAngleX);
      const sinPitch = Math.sin(this.cameraAngleX);

      const shoulderOffset = this.isAimingDownSights ? 0.72 : 0.45;
      const rightCamX = Math.cos(this.cameraAngleY) * shoulderOffset;
      const rightCamZ = -Math.sin(this.cameraAngleY) * shoulderOffset;

      const currentDist = this.isAimingDownSights ? Math.max(2.4, this.cameraDistance * 0.62) : this.cameraDistance;
      const camX = this.playerPosX + rightCamX + Math.sin(this.cameraAngleY) * (currentDist * cosPitch);
      const camZ = this.playerPosZ + rightCamZ + Math.cos(this.cameraAngleY) * (currentDist * cosPitch);
      const camY = Math.max(this.playerPosY + 0.5, this.playerPosY + (this.isAimingDownSights ? 1.55 : 1.4) + (currentDist * sinPitch));

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(
        this.playerPosX + rightCamX * (this.isAimingDownSights ? 0.8 : 0.5),
        targetLookY,
        this.playerPosZ + rightCamZ * (this.isAimingDownSights ? 0.8 : 0.5)
      );

    } else if (this.currentScene === 'SNOWBALL_WAR') {
      this.updateSnowballWar();
      this.updateSnowballs();
      this.particleManager.updateSnowballBursts();

      const running = this.keyShift || this.isRunning;
      const moveSpeed = running ? 0.20 : 0.13;

      const cosYaw = Math.cos(this.cameraAngleY);
      const sinYaw = Math.sin(this.cameraAngleY);

      const fwdX = -sinYaw;
      const fwdZ = -cosYaw;
      const rightX = cosYaw;
      const rightZ = -sinYaw;

      let moveWorldX = (fwdX * inputForward) + (rightX * inputLateral);
      let moveWorldZ = (fwdZ * inputForward) + (rightZ * inputLateral);

      const moveMag = Math.sqrt(moveWorldX * moveWorldX + moveWorldZ * moveWorldZ);
      const isMoving = moveMag > 0.05;

      if (isMoving) {
        moveWorldX = (moveWorldX / moveMag) * moveSpeed;
        moveWorldZ = (moveWorldZ / moveMag) * moveSpeed;

        const desiredX = this.playerPosX + moveWorldX;
        const desiredZ = this.playerPosZ + moveWorldZ;

        const resolved = CollisionSystem.resolveWarCollisions(desiredX, desiredZ, this.warObstacles, 0.65);
        this.playerPosX = resolved.x;
        this.playerPosZ = resolved.z;

        if (this.isAimingDownSights || this.isChargingSnowball || this.throwAnimTimer > 0) {
          const targetRotY = this.cameraAngleY + Math.PI;
          let diffRot = targetRotY - this.playerGroup.rotation.y;
          while (diffRot > Math.PI) diffRot -= Math.PI * 2;
          while (diffRot < -Math.PI) diffRot += Math.PI * 2;
          this.playerGroup.rotation.y += diffRot * 0.35;
        } else {
          const targetRotY = Math.atan2(moveWorldX, moveWorldZ);
          let diffRot = targetRotY - this.playerGroup.rotation.y;
          while (diffRot > Math.PI) diffRot -= Math.PI * 2;
          while (diffRot < -Math.PI) diffRot += Math.PI * 2;
          this.playerGroup.rotation.y += diffRot * 0.25;
        }

        this.walkTime += running ? 0.30 : 0.18;
        if (this.playerRig) {
          RigAnimator.animateRigWalk(
            this.playerRig,
            this.walkTime,
            running,
            this.isChargingSnowball,
            this.currentChargeRatio,
            this.throwAnimTimer
          );
        }

        if (Math.random() < 0.22) {
          this.trailManager.addContinuousSnowTrail(this.playerPosX, this.playerPosY, this.playerPosZ, this.playerGroup.rotation.y, false);
        }
      } else {
        if (this.isAimingDownSights || this.isChargingSnowball || this.throwAnimTimer > 0) {
          const targetRotY = this.cameraAngleY + Math.PI;
          let diffRot = targetRotY - this.playerGroup.rotation.y;
          while (diffRot > Math.PI) diffRot -= Math.PI * 2;
          while (diffRot < -Math.PI) diffRot += Math.PI * 2;
          this.playerGroup.rotation.y += diffRot * 0.35;
        }
        if (this.playerRig) {
          RigAnimator.animateRigIdle(
            this.playerRig,
            false,
            this.isChargingSnowball,
            this.currentChargeRatio,
            this.throwAnimTimer
          );
        }
      }

      if (this.isJumping) {
        this.playerPosY += this.jumpVelY;
        this.jumpVelY -= 0.022;
        if (this.playerPosY <= 0) {
          this.playerPosY = 0;
          this.isJumping = false;
          this.jumpVelY = 0;
          this.particleManager.emitSnowSpray(6, 0, this.playerPosX, this.playerPosY, this.playerPosZ);
        }
      }

      this.playerGroup.position.set(this.playerPosX, this.playerPosY, this.playerPosZ);

      if (this.isPvPArena) {
        this.networkManager.updateRemotePlayers(0.016, performance.now() * 0.001, false);
        const movingFlag = (Math.abs(inputForward) > 0.05 || Math.abs(inputLateral) > 0.05);
        this.networkManager.sendArenaMovement({
          x: this.playerPosX,
          y: this.playerPosY,
          z: this.playerPosZ,
          rotY: this.playerGroup.rotation.y,
          animState: this.throwAnimTimer > 0 ? 'throw' : (movingFlag ? (running ? 'run' : 'walk') : 'idle'),
          isMoving: movingFlag
        });
      }

      const targetLookY = this.playerPosY + 1.25;
      const cosPitch = Math.cos(this.cameraAngleX);
      const sinPitch = Math.sin(this.cameraAngleX);

      const shoulderOffset = this.isAimingDownSights ? 0.72 : 0.45;
      const rightCamX = Math.cos(this.cameraAngleY) * shoulderOffset;
      const rightCamZ = -Math.sin(this.cameraAngleY) * shoulderOffset;

      const currentDist = this.isAimingDownSights ? Math.max(2.4, this.cameraDistance * 0.62) : this.cameraDistance;
      const camX = this.playerPosX + rightCamX + Math.sin(this.cameraAngleY) * (currentDist * cosPitch);
      const camZ = this.playerPosZ + rightCamZ + Math.cos(this.cameraAngleY) * (currentDist * cosPitch);
      const camY = Math.max(this.playerPosY + 0.5, this.playerPosY + (this.isAimingDownSights ? 1.55 : 1.4) + (currentDist * sinPitch));

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(
        this.playerPosX + rightCamX * (this.isAimingDownSights ? 0.8 : 0.5),
        targetLookY,
        this.playerPosZ + rightCamZ * (this.isAimingDownSights ? 0.8 : 0.5)
      );

      if (this.particleManager.snowParticles) {
        this.particleManager.snowParticles.position.x = this.playerPosX;
        this.particleManager.snowParticles.position.z = this.playerPosZ;
      }

    } else if (this.currentScene === 'SHOOTING_GALLERY') {
      const cosPitch = Math.cos(this.cameraAngleX);
      const sinPitch = Math.sin(this.cameraAngleX);
      const sinYaw = Math.sin(this.cameraAngleY);
      const cosYaw = Math.cos(this.cameraAngleY);

      this.camera.position.set(0, 1.65, 0);
      const lookX = -sinYaw * cosPitch * 10;
      const lookY = 1.65 - sinPitch * 10;
      const lookZ = -cosYaw * cosPitch * 10;
      this.camera.lookAt(lookX, lookY, lookZ);

      this.updateCarnivalShooting();

    } else if (this.currentScene === 'RACING') {
      if (this.spinoutTimer > 0) {
        this.spinoutTimer--;
        this.playerGroup.rotation.y += 0.35;
        this.playerVelZ = Math.max(0.12, this.playerVelZ * 0.95);
        inputLateral = 0;
        inputForward = 0;
      }

      const isDrifting = (this.keyShift || this.isDriftBtnDown || pad.buttonDrift) && Math.abs(inputLateral) > 0.1 && !this.isJumping && this.spinoutTimer === 0;

      if (isDrifting) {
        if (this.driftDirection === 0) {
          this.driftDirection = inputLateral < 0 ? -1 : 1;
          this.driftCharge = 0;
          this.driftTier = 0;
          this.gamepadManager.vibrate(80, 0.2, 0.4);
        }
        this.driftCharge += 1;
        let newTier: 0 | 1 | 2 | 3 = 0;
        if (this.driftCharge >= 150) newTier = 3;
        else if (this.driftCharge >= 90) newTier = 2;
        else if (this.driftCharge >= 45) newTier = 1;

        if (newTier !== this.driftTier) {
          this.driftTier = newTier;
          this.soundManager.playDriftSparkSound();
          this.gamepadManager.vibrate(100, 0.25 * newTier, 0.5 * newTier);
        }

        UIManager.updateDriftHUD(this.driftTier, this.driftCharge);
        const currentTier = this.driftTier;
        if (currentTier === 1 || currentTier === 2 || currentTier === 3) {
          this.particleManager.emitDriftSparks(this.playerPosX, this.playerPosY, this.playerPosZ, currentTier, this.driftDirection);
        }
      } else if (this.driftDirection !== 0) {
        if (this.driftTier > 0) {
          this.soundManager.playMiniTurboBoostSound();
          this.miniTurboTimer = this.driftTier === 3 ? 75 : (this.driftTier === 2 ? 50 : 30);
          this.miniTurboBonus = this.driftTier === 3 ? 0.35 : (this.driftTier === 2 ? 0.24 : 0.15);
          this.particleManager.emitNitroFlames(this.playerPosX, this.playerPosY, this.playerPosZ);
          this.gamepadManager.vibrate(220, 0.5, 0.9);
          UIManager.showToast(`🔥 MINI-TURBO NÍVEL ${this.driftTier}!`, 'success', this.soundManager);
          if (this.driftTier >= 2) this.unlockAchievement('drift_master');
        }
        this.driftDirection = 0;
        this.driftCharge = 0;
        this.driftTier = 0;
        UIManager.updateDriftHUD(0, 0);
      }

      if (this.miniTurboTimer > 0) {
        this.miniTurboTimer--;
        this.playerVelZ = Math.min(0.95, this.playerVelZ + this.miniTurboBonus * 0.08);
        this.particleManager.emitNitroFlames(this.playerPosX, this.playerPosY, this.playerPosZ);
        if (this.playerVelZ >= 0.85) {
          this.unlockAchievement('speed_demon');
        }
      }

      if (!this.isRaceFinished) {
        const baseCruise = 0.48;
        if (this.playerVelZ < baseCruise && this.miniTurboTimer <= 0) {
          this.playerVelZ += 0.0015;
        }

        if (inputForward > 0.1) {
          this.playerVelZ = Math.min(0.68 + (this.miniTurboTimer > 0 ? 0.25 : 0), this.playerVelZ + 0.004);
        } else if (inputForward < -0.1) {
          this.playerVelZ = Math.max(0.18, this.playerVelZ - 0.012);
          this.particleManager.emitSnowSpray(4, 0, this.playerPosX, this.playerPosY, this.playerPosZ);
        }

        const steeringSensitivity = isDrifting ? 0.062 : 0.046;
        this.playerVelX -= inputLateral * steeringSensitivity;
        this.playerVelX *= 0.88;
        this.playerVelX = Math.max(-0.52, Math.min(0.52, this.playerVelX));

        this.playerPosX += this.playerVelX;
        this.playerPosZ += this.playerVelZ;

        if (this.playerPosX < -23.5) { this.playerPosX = -23.5; this.playerVelX = 0; }
        if (this.playerPosX > 23.5) { this.playerPosX = 23.5; this.playerVelX = 0; }

        if (this.playerPosZ >= this.raceTrackLength) {
          this.finishRace();
        }

      } else {
        this.playerVelZ *= 0.96;
        this.playerPosZ += this.playerVelZ;
        this.particleManager.updateConfetti();
      }

      if (this.isJumping) {
        this.playerPosY += this.jumpVelY;
        this.jumpVelY -= 0.012;

        const pitchAngle = 0.08 - this.jumpVelY * 0.35;
        this.playerGroup.rotation.x = pitchAngle;
        this.playerGroup.rotation.z = -this.playerVelX * 1.1;

        if (this.trickSpins > 0) {
          this.trickRotationY += 0.28;
          this.playerGroup.rotation.y = this.trickRotationY;
        }

        if (this.playerPosY <= 0) {
          this.playerPosY = 0;
          this.isJumping = false;
          this.jumpVelY = 0;
          this.playerGroup.rotation.x = 0.08;
          this.particleManager.emitSnowSpray(18, 0, this.playerPosX, this.playerPosY, this.playerPosZ);

          if (this.trickSpins > 0) {
            this.soundManager.playMiniTurboBoostSound();
            this.miniTurboTimer = 35 + this.trickSpins * 15;
            this.miniTurboBonus = 0.25;
            this.score += this.trickSpins * 200;
            this.currency += this.trickSpins * 5;
            UIManager.updateCoinsDisplay(this.currency);
            UIManager.showToast(`✨ ACROBACIA COMPLETA! +${this.trickSpins * 200} pts!`, 'success', this.soundManager);
            this.gamepadManager.vibrate(150, 0.5, 0.7);
            this.unlockAchievement('stunt_legend');
            this.trickSpins = 0;
            this.trickRotationY = 0;
          }
        }
      } else {
        if (this.spinoutTimer === 0) {
          this.playerGroup.rotation.z = -this.playerVelX * 0.92;
          this.playerGroup.rotation.y = this.driftDirection !== 0 ? (this.driftDirection * 0.45) : (this.playerVelX * 0.38);
          this.playerGroup.rotation.x = 0.08;
        }
      }

      this.playerGroup.position.set(this.playerPosX, this.playerPosY, this.playerPosZ);

      if (this.hasShield && this.shieldMesh) {
        this.shieldMesh.position.copy(this.playerGroup.position).add(new THREE.Vector3(0, 0.9, 0));
        this.shieldMesh.rotation.y += 0.03;
      }

      if (this.playerPosY === 0) {
        this.trailManager.addContinuousSnowTrail(this.playerPosX, this.playerPosY, this.playerPosZ, this.playerGroup.rotation.y, true);
        const isCarving = Math.abs(this.playerVelX) > 0.06;
        this.particleManager.emitSnowSpray(isCarving ? 3 : 1, this.playerVelX, this.playerPosX, this.playerPosY, this.playerPosZ);
      } else {
        this.trailManager.resetPrevPoints();
      }

      this.particleManager.updateSnowSpray();
      this.particleManager.updateSparks();

      for (const box of this.itemBoxes) {
        box.mesh.rotation.y += 0.03;
        box.mesh.rotation.x += 0.015;
        box.mesh.position.y = 1.1 + Math.sin(performance.now() * 0.004 + box.z) * 0.2;
        if (box.respawnTimer > 0) {
          box.respawnTimer--;
          box.mesh.visible = box.respawnTimer === 0;
        } else if (!this.isRaceFinished) {
          const dx = this.playerPosX - box.x;
          const dz = this.playerPosZ - box.z;
          if (Math.hypot(dx, dz) < 1.8 && this.playerPosY < 1.8) {
            box.respawnTimer = 260;
            box.mesh.visible = false;
            this.soundManager.playItemBoxHitSound();
            this.particleManager.emitItemBoxShatter(box.x, box.mesh.position.y, box.z);
            this.gamepadManager.vibrate(120, 0.4, 0.5);
            this.startItemRoulette();
          }
        }
      }

      for (const coin of this.raceCoins) {
        coin.mesh.rotation.y += 0.04;
        coin.mesh.position.y = 0.8 + Math.sin(performance.now() * 0.005 + coin.z) * 0.15;
        if (!coin.collected && !this.isRaceFinished) {
          const dx = this.playerPosX - coin.x;
          const dz = this.playerPosZ - coin.z;
          if (Math.hypot(dx, dz) < 1.5 && this.playerPosY < 1.5) {
            coin.collected = true;
            coin.mesh.visible = false;
            this.raceCoinsCollected++;
            this.currency += 5;
            this.score += 50;
            UIManager.updateCoinsDisplay(this.currency);
            this.soundManager.playCoinSound();
            this.particleManager.emitCoinSparkle(coin.x, coin.mesh.position.y, coin.z);
            if (this.raceCoinsCollected >= 10) {
              this.unlockAchievement('coin_collector');
            }
          }
        }
      }

      for (let i = this.iceTraps.length - 1; i >= 0; i--) {
        const trap = this.iceTraps[i];
        trap.life--;
        if (Math.hypot(this.playerPosX - trap.x, this.playerPosZ - trap.z) < 1.6 && this.playerPosY < 0.8) {
          if (this.hasShield) {
            this.hasShield = false;
            if (this.shieldMesh) this.shieldMesh.visible = false;
            this.soundManager.playSnowSplatSound();
            UIManager.showToast('🛡️ O escudo absorveu a armadilha de gelo!', 'info');
          } else {
            this.spinoutTimer = 45;
            this.soundManager.playIceSlickSound();
            this.gamepadManager.vibrate(300, 0.7, 0.9);
            UIManager.showToast('❄️ DERRAPOU NA ARMADILHA DE GELO!', 'warning');
          }
          this.scene.remove(trap.mesh);
          this.iceTraps.splice(i, 1);
        } else if (trap.life <= 0) {
          this.scene.remove(trap.mesh);
          this.iceTraps.splice(i, 1);
        }
      }

      for (let i = this.homingSnowballs.length - 1; i >= 0; i--) {
        const hsb = this.homingSnowballs[i];
        hsb.z += 0.85;
        hsb.mesh.position.set(hsb.x, 1.0, hsb.z);
        this.particleManager.emitSnowSpray(2, 0, hsb.x, 1.0, hsb.z);
        if (hsb.z > this.raceTrackLength + 20) {
          this.scene.remove(hsb.mesh);
          this.homingSnowballs.splice(i, 1);
        }
      }

      for (const gate of this.gates) {
        if (!gate.passed && Math.abs(this.playerPosZ - gate.z) < 2.2) {
          if (Math.abs(this.playerPosX - gate.x) < 3.0) {
            gate.passed = true;
            this.gatesCleared++;
            this.score += 100;
            this.currency += 10;
            UIManager.updateCoinsDisplay(this.currency);
            this.particleManager.emitSnowSpray(14, 0, this.playerPosX, this.playerPosY, this.playerPosZ);
            this.soundManager.playSlalomChime();

            if (gate.leftLight && gate.rightLight) {
              (gate.leftLight.material as THREE.MeshBasicMaterial).color.setHex(0x22c55e);
              (gate.rightLight.material as THREE.MeshBasicMaterial).color.setHex(0x22c55e);
            }

            const popup = document.getElementById('slalom-popup');
            if (popup) {
              popup.style.display = 'block';
              setTimeout(() => { popup.style.display = 'none'; }, 600);
            }

            const slalomHudVal = document.getElementById('slalom-hud-val');
            if (slalomHudVal) slalomHudVal.innerText = this.gatesCleared.toString();
          }
        }
      }

      for (const ramp of this.ramps) {
        if (!this.isJumping && Math.abs(this.playerPosZ - ramp.z) < 2.0) {
          if (Math.abs(this.playerPosX - ramp.x) < 2.4) {
            this.isJumping = true;
            this.jumpVelY = 0.58;
            this.score += 150;
            this.currency += 15;
            UIManager.updateCoinsDisplay(this.currency);
            this.particleManager.emitSnowSpray(14, 0, this.playerPosX, this.playerPosY, this.playerPosZ);
            this.soundManager.playJumpSound();
          }
        }
      }

      for (const obs of this.obstacles) {
        const dx = this.playerPosX - obs.x;
        const dz = this.playerPosZ - obs.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < obs.radius && this.playerPosY < 0.6) {
          if (this.hasShield) {
            this.hasShield = false;
            if (this.shieldMesh) this.shieldMesh.visible = false;
            this.soundManager.playSnowSplatSound();
            UIManager.showToast('🛡️ Escudo quebrou mas te protegeu!', 'info');
          } else {
            this.playerVelZ = 0.18;
            this.score = Math.max(0, this.score - 50);
            this.particleManager.emitSnowSpray(10, 0, this.playerPosX, this.playerPosY, this.playerPosZ);
            this.gamepadManager.vibrate(200, 0.5, 0.7);
          }
        }
      }

      if (!this.isRaceFinished) {
        this.score += Math.round(this.playerVelZ * 3.5);
      }
      const scoreEl = document.getElementById('score-val');
      if (scoreEl) scoreEl.innerText = this.score.toString();

      const speedEl = document.getElementById('speed-val');
      if (speedEl) speedEl.innerText = Math.round(this.playerVelZ * 80).toString();

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

      if (this.particleManager.snowParticles) {
        this.particleManager.snowParticles.position.z = this.playerPosZ;
      }

      // Telemetria e Interpolação Multiplayer na Descida
      if (this.isMultiplayerRace) {
        this.networkManager.updateRemotePlayers(0.016, performance.now() * 0.001, true);
        this.networkManager.sendRaceTransform(
          this.playerPosX,
          this.playerPosY,
          this.playerPosZ,
          this.playerGroup.rotation.x,
          this.playerGroup.rotation.y,
          this.playerGroup.rotation.z,
          this.playerVelX,
          this.playerVelZ,
          this.score,
          this.gatesCleared
        );

        // Atualiza tabela de posições em tempo real
        const leaderboardItems: Array<{ name: string; distance: number; isLocal: boolean }> = [
          { name: this.playerName, distance: this.playerPosZ, isLocal: true }
        ];
        this.networkManager.remotePlayers.forEach((rp) => {
          leaderboardItems.push({ name: rp.name, distance: rp.group.position.z, isLocal: false });
        });
        UIManager.updateRaceLeaderboard(leaderboardItems);
      } else {
        // Atualiza rivais IA na corrida solo e exibe tabela ao vivo
        this.updateRaceBots(0.016);
        const leaderboardItems: Array<{ name: string; distance: number; isLocal: boolean }> = [
          { name: `${this.playerName} (Você)`, distance: this.playerPosZ, isLocal: true },
          ...this.raceBots.map((b) => ({ name: b.name, distance: b.z, isLocal: false }))
        ];
        UIManager.updateRaceLeaderboard(leaderboardItems);
      }
    }

    this.renderer.render(this.scene, this.camera);
  };
}
