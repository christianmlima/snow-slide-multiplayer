import * as THREE from 'three';
const GAME_VERSION = "v2.5.0-STABLE";
const SHOP_CATALOG = [
    // Veículos (Exclusivo Garagem Alpina)
    { id: 'sled_wood', name: 'Trenó de Madeira', category: 'sleds', price: 0, icon: '🛷', desc: 'Clássico trenó alpino com patins de aço polido.' },
    { id: 'board_cyan', name: 'Snowboard Pro Cyan', category: 'sleds', price: 350, icon: '🏂', desc: 'Prancha de alta performance para manobras ágeis.' },
    { id: 'sled_gold', name: 'Trenó Imperial Ouro', category: 'sleds', price: 800, icon: '👑', desc: 'Forjado em ouro alpino com estofado carmesim.' },
    { id: 'board_lava', name: 'Snowboard Vulcão', category: 'sleds', price: 500, icon: '🔥', desc: 'Prancha vulcânica com bordas incandescentes.' },
    // Chapéus (Exclusivo Boutique dos Gorros)
    { id: 'hat_red', name: 'Gorro Vermelho Pom-Pom', category: 'hats', price: 0, icon: '🔴', desc: 'O clássico gorro de lã quentinho com pom-pom.' },
    { id: 'hat_blue', name: 'Gorro Azul Nevasca', category: 'hats', price: 150, icon: '🔵', desc: 'Gorro polar reforçado para ventos frios.' },
    { id: 'hat_top', name: 'Cartola de Inverno', category: 'hats', price: 400, icon: '🎩', desc: 'Elegância aristocrática para exploradores refinados.' },
    { id: 'hat_crown', name: 'Coroa Glacial', category: 'hats', price: 750, icon: '👑', desc: 'Digna do verdadeiro rei das montanhas nevadas.' },
    // Cachecóis (Exclusivo Ateliê da Montanha)
    { id: 'scarf_green', name: 'Cachecol Verde Esmeralda', category: 'scarves', price: 0, icon: '🧣', desc: 'Lã macia com cauda esvoaçante ao vento.' },
    { id: 'scarf_red', name: 'Cachecol Vermelho Listrado', category: 'scarves', price: 180, icon: '🧣', desc: 'Listras festivas visíveis em qualquer nevasca.' },
    { id: 'scarf_gold', name: 'Cachecol Seda Dourada', category: 'scarves', price: 380, icon: '✨', desc: 'Tecido nobre que reluz ao brilho do sol alpino.' },
    // Óculos de Esqui (Exclusivo Ateliê da Montanha)
    { id: 'goggles_none', name: 'Sem Óculos', category: 'goggles', price: 0, icon: '👀', desc: 'Olhos livres para sentir a brisa da neve.' },
    { id: 'goggles_orange', name: 'Óculos Laranja Polar', category: 'goggles', price: 250, icon: '🥽', desc: 'Lentes âmbar de alta definição com proteção UV.' },
    { id: 'goggles_cyan', name: 'Óculos Neon Ciano', category: 'goggles', price: 380, icon: '🥽', desc: 'Visor espelhado futurista contra reflexos de gelo.' }
];
class SnowSlideTPSMasterEngine {
    client;
    room;
    scene;
    camera;
    renderer;
    currentScene = 'LOGIN';
    playerGroup;
    playerPosX = 0;
    playerPosY = 0;
    playerPosZ = 0;
    playerVelX = 0;
    playerVelZ = 0;
    isJumping = false;
    jumpVelY = 0;
    // Sistema de Sentar em Bancos
    isSitting = false;
    currentBench = null;
    benches = [];
    nearBench = null;
    // Sistema de Bolas de Neve e Mira ADS
    snowballs = [];
    lastSnowballTime = 0;
    isAimingDownSights = false;
    isChargingSnowball = false;
    snowballChargeStartTime = 0;
    currentChargeRatio = 0.5;
    playerRig = null;
    throwAnimTimer = 0;
    maxThrowAnimFrames = 18;
    // Minigame 1: Estande de Tiro ao Alvo do Festival
    nearCarnivalBooth = false;
    carnivalBoothPos = new THREE.Vector3(42, 0, -12);
    carnivalTargets = [];
    shootingScore = 0;
    shootingHits = 0;
    shootingShots = 0;
    shootingCombo = 0;
    shootingTimeLeft = 40;
    shootingTimer = null;
    toyGunGroup = null;
    // Minigame 2: Arena de Guerra de Bolas de Neve
    nearSnowballWarPortal = false;
    snowballWarPortalPos = new THREE.Vector3(-52, 0, 8);
    warBots = [];
    warObstacles = [];
    warPlayerHealth = 3;
    warKOs = 0;
    warHits = 0;
    warScore = 0;
    warTimeLeft = 60;
    warTimer = null;
    isPlayerWarInvuln = false;
    playerWarInvulnTimer = 0;
    // Customizações e Equipamentos
    currency = 1250;
    score = 0;
    equipped = {
        vehicle: 'sled_wood',
        hat: 'hat_red',
        scarf: 'scarf_green',
        goggles: 'goggles_none'
    };
    inventory = new Set(['sled_wood', 'hat_red', 'scarf_green', 'goggles_none']);
    // Sistema de Personagens (Metamorfose)
    selectedCharacter = 'penguin';
    // Configurações e Sensibilidade do Mouse
    mouseSensMultiplier = 1.0;
    invertY = false;
    soundEnabled = true;
    audioCtx = null;
    // Colisões do Hub
    hubColliders = [];
    // Lojas Segmentadas & Interações
    nearGarage = false;
    nearHatShop = false;
    nearAtelier = false;
    nearRecords = false;
    nearPhoneBooth = false;
    nearCableCar = false;
    // Posições de Interação no Hub (Vila Alpina Expandida & Arejada)
    garagePos = new THREE.Vector3(-44, 0, -28);
    garageCounterPos = new THREE.Vector3(-44, 0, -29);
    hatShopPos = new THREE.Vector3(-44, 0, 38);
    hatShopCounterPos = new THREE.Vector3(-44, 0, 39);
    atelierPos = new THREE.Vector3(12, 0, 44);
    atelierCounterPos = new THREE.Vector3(12, 0, 45);
    tavernPos = new THREE.Vector3(46, 0, 16);
    recordsBoardPos = new THREE.Vector3(51, 0, 16);
    phoneBoothPos = new THREE.Vector3(14, 0, -10);
    cableCarStationPos = new THREE.Vector3(42, 0, -42);
    // Membros do Personagem do Jogador para Animação Procedural
    charTorso;
    charHead;
    charFootL;
    charFootR;
    charArmL;
    charArmR;
    charTail = null;
    charScarfTail = null;
    walkTime = 0;
    isRunning = false;
    // NPCs Vendedores Estacionários
    npcRalph = null;
    npcBabette = null;
    npcBoris = null;
    // NPCs Autônomos Circulando pelo Vilarejo
    wanderingNPCs = [];
    // Bondinho
    gondolaMesh;
    // Fogueira no Hub
    bonfireLight;
    bonfireEmbers;
    bonfireEmberData = [];
    // Pista de Corrida & Obstáculos
    obstacles = [];
    gates = [];
    ramps = [];
    gatesCleared = 0;
    totalRaceGates = 0;
    raceStartTime = 0;
    isRaceFinished = false;
    raceTrackLength = 3200;
    // Rastro na Neve e Partículas
    skidMarks = [];
    prevTrailLeft = null;
    prevTrailRight = null;
    snowParticles;
    snowSprayPoints;
    sprayData = [];
    // Partículas de Vitória / Confetes
    confettiPoints = null;
    confettiData = [];
    // Câmera estilo Terceira Pessoa Guiada pelo Mouse (Fortnite / Roblox)
    isPointerLocked = false;
    isRightMouseDown = false;
    cameraAngleY = 0;
    cameraAngleX = 0.22;
    cameraDistance = 6.8;
    // Câmera Touch Mobile
    activeCameraTouchId = null;
    lastCameraTouchX = 0;
    lastCameraTouchY = 0;
    // Sistema de Desmanche de Bola de Neve (Partículas de Impacto & Flocos)
    snowballBurstPoints;
    burstParticles = [];
    // Analógico Virtual
    joystickActive = false;
    activeJoystickPointerId = null;
    joystickStartX = 0;
    joystickStartY = 0;
    joystickMoveX = 0;
    joystickMoveY = 0;
    // Teclado
    keyW = false;
    keyS = false;
    keyA = false;
    keyD = false;
    keyShift = false;
    constructor() {
        this.loadSavedSettings();
        this.initEngine();
    }
    // =========================================================================
    // PERSISTÊNCIA & CONFIGURAÇÕES
    // =========================================================================
    loadSavedSettings() {
        try {
            const savedSens = localStorage.getItem('snow_slide_sens');
            if (savedSens)
                this.mouseSensMultiplier = parseFloat(savedSens) || 1.0;
            const savedInvert = localStorage.getItem('snow_slide_invert_y');
            if (savedInvert)
                this.invertY = savedInvert === 'true';
            const savedSound = localStorage.getItem('snow_slide_sound');
            if (savedSound)
                this.soundEnabled = savedSound !== 'false';
            const savedChar = localStorage.getItem('snow_slide_character');
            if (savedChar && ['penguin', 'frog', 'cat', 'dog'].includes(savedChar)) {
                this.selectedCharacter = savedChar;
            }
            const savedCoins = localStorage.getItem('snow_slide_coins');
            if (savedCoins)
                this.currency = parseInt(savedCoins, 10) || 1250;
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
                if (obj)
                    Object.assign(this.equipped, obj);
            }
        }
        catch (e) {
            console.warn('Erro ao carregar configurações salvas:', e);
        }
    }
    saveSettings() {
        try {
            localStorage.setItem('snow_slide_sens', this.mouseSensMultiplier.toString());
            localStorage.setItem('snow_slide_invert_y', this.invertY.toString());
            localStorage.setItem('snow_slide_sound', this.soundEnabled.toString());
            localStorage.setItem('snow_slide_character', this.selectedCharacter);
            localStorage.setItem('snow_slide_coins', this.currency.toString());
            localStorage.setItem('snow_slide_inventory', JSON.stringify(Array.from(this.inventory)));
            localStorage.setItem('snow_slide_equipped', JSON.stringify(this.equipped));
        }
        catch (e) { }
    }
    // =========================================================================
    // SISTEMA DE ÁUDIO SINTETIZADO (WEB AUDIO API)
    // =========================================================================
    initAudio() {
        if (!this.audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.audioCtx = new AudioContextClass();
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }
    playTone(freq, type, duration, gainVal = 0.15) {
        if (!this.soundEnabled)
            return;
        try {
            this.initAudio();
            if (!this.audioCtx)
                return;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
            gain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + duration);
        }
        catch (e) { }
    }
    playSlalomChime() {
        if (!this.soundEnabled)
            return;
        this.playTone(659.25, 'sine', 0.12, 0.2);
        setTimeout(() => this.playTone(880.00, 'triangle', 0.22, 0.25), 65);
    }
    playJumpSound() {
        if (!this.soundEnabled)
            return;
        try {
            this.initAudio();
            if (!this.audioCtx)
                return;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(620, this.audioCtx.currentTime + 0.25);
            gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.28);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.28);
        }
        catch (e) { }
    }
    playVictoryFanfare() {
        if (!this.soundEnabled)
            return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            setTimeout(() => this.playTone(freq, 'triangle', 0.35, 0.22), idx * 120);
        });
    }
    playCoinSound() {
        if (!this.soundEnabled)
            return;
        this.playTone(987.77, 'sine', 0.1, 0.2);
        setTimeout(() => this.playTone(1318.51, 'sine', 0.18, 0.2), 70);
    }
    playSnowThrowSound(charge = 0.5) {
        if (!this.soundEnabled)
            return;
        const baseFreq = 320 + charge * 260;
        this.playTone(baseFreq, 'sine', 0.08, 0.12 + charge * 0.12);
    }
    playSnowSplatSound() {
        if (!this.soundEnabled)
            return;
        try {
            this.initAudio();
            if (!this.audioCtx)
                return;
            const ctx = this.audioCtx;
            const now = ctx.currentTime;
            // 1. Ruído de impacto e esfarelamento de neve (Crunch / Splat / Powder burst)
            const bufferSize = Math.floor(ctx.sampleRate * 0.22);
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
            }
            const noiseSrc = ctx.createBufferSource();
            noiseSrc.buffer = noiseBuffer;
            // Filtro passa-faixa dinâmico para o "crunch" característico de neve estilhaçando
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1450, now);
            filter.frequency.exponentialRampToValueAtTime(320, now + 0.18);
            filter.Q.setValueAtTime(1.4, now);
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.38, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            noiseSrc.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            noiseSrc.start(now);
            // 2. Thump subsônico de impacto físico da massa de neve compactada
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
            oscGain.gain.setValueAtTime(0.28, now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(oscGain);
            oscGain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.13);
        }
        catch (e) { }
    }
    playToyGunPopSound() {
        if (!this.soundEnabled)
            return;
        this.playTone(720, 'triangle', 0.04, 0.35);
        setTimeout(() => this.playTone(220, 'sine', 0.07, 0.4), 20);
    }
    playTargetHitSound() {
        if (!this.soundEnabled)
            return;
        this.playTone(520, 'square', 0.04, 0.22);
        setTimeout(() => this.playTone(880, 'sine', 0.12, 0.25), 35);
    }
    playCarnivalHornSound() {
        if (!this.soundEnabled)
            return;
        this.playTone(440, 'sawtooth', 0.15, 0.2);
        setTimeout(() => this.playTone(554.37, 'sawtooth', 0.18, 0.22), 120);
        setTimeout(() => this.playTone(659.25, 'sawtooth', 0.3, 0.28), 260);
    }
    // =========================================================================
    // SISTEMA DE NOTIFICAÇÃO TOAST ELEGANTE (SUBSTITUI OS ALERTAS NATIVOS)
    // =========================================================================
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container)
            return;
        const toast = document.createElement('div');
        toast.className = `toast-msg ${type}`;
        const icon = type === 'success' ? '✅' : (type === 'warning' ? '⚠️' : 'ℹ️');
        toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
        container.appendChild(toast);
        if (type === 'success')
            this.playCoinSound();
        setTimeout(() => {
            if (toast.parentNode)
                toast.parentNode.removeChild(toast);
        }, 3000);
    }
    // =========================================================================
    // SISTEMA DE PARTÍCULAS E RASTRO
    // =========================================================================
    createSnowParticles() {
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
    createSnowSpraySystem() {
        const count = 180;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++)
            positions[i] = 0;
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
    emitSnowSpray(count, lateralBoost = 0, originX, originY, originZ) {
        if (!this.snowSprayPoints)
            return;
        let emitted = 0;
        const ox = originX !== undefined ? originX : this.playerPosX;
        const oy = originY !== undefined ? originY : this.playerPosY;
        const oz = originZ !== undefined ? originZ : this.playerPosZ;
        for (let i = 0; i < this.sprayData.length && emitted < count; i++) {
            const p = this.sprayData[i];
            if (p.life <= 0) {
                p.x = ox + (Math.random() - 0.5) * 0.45;
                p.y = oy + 0.08 + Math.random() * 0.12;
                p.z = oz - 0.95;
                p.vx = -lateralBoost * 0.35 + (Math.random() - 0.5) * 0.08;
                p.vy = 0.07 + Math.random() * 0.12;
                p.vz = -0.12 - Math.random() * 0.14;
                p.life = 1;
                p.maxLife = 16 + Math.floor(Math.random() * 12);
                emitted++;
            }
        }
    }
    updateSnowSpray() {
        if (!this.snowSprayPoints)
            return;
        const positions = this.snowSprayPoints.geometry.getAttribute('position').array;
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
    // =========================================================================
    // SISTEMA DE DESMANCHE DE BOLA DE NEVE & PAREDES ARREDONDADAS
    // =========================================================================
    createSnowballBurstSystem() {
        const count = 300;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++)
            positions[i] = 0;
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
    emitSnowballDisintegration(ox, oy, oz, isCharacterHit = false) {
        if (!this.snowballBurstPoints)
            return;
        const particleCount = isCharacterHit ? 36 : 22;
        let spawned = 0;
        for (let i = 0; i < this.burstParticles.length && spawned < particleCount; i++) {
            const p = this.burstParticles[i];
            if (p.life <= 0) {
                // Distribuição esférica de estilhaços tridimensionais
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
    updateSnowballBursts() {
        if (!this.snowballBurstPoints)
            return;
        const attr = this.snowballBurstPoints.geometry.getAttribute('position');
        if (!attr)
            return;
        const positions = attr.array;
        for (let i = 0; i < this.burstParticles.length; i++) {
            const p = this.burstParticles[i];
            if (p.life > 0) {
                p.x += p.vx;
                p.y += p.vy;
                p.z += p.vz;
                p.vy -= 0.0055; // gravidade
                p.vx *= 0.94; // arrasto do ar
                p.vz *= 0.94;
                p.life++;
                // Ao tocar o chão, espalha em poeira rasa
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
        attr.needsUpdate = true;
    }
    // Geometria Procedural de Muretas com Bordas Arredondadas (Estilo Bunkers de Neve Esculpidos)
    createRoundedWallGeometry(w, h, d, radius = 0.32) {
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
    // Efeito Especial de Confetes de Vitória
    createConfettiSystem() {
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
    updateConfetti() {
        if (!this.confettiPoints)
            return;
        const positions = this.confettiPoints.geometry.getAttribute('position').array;
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
    // Rastro duplo na neve
    addContinuousSnowTrail(px, py, pz, rotY) {
        const runnerOffset = this.currentScene === 'RACING' ? 0.44 : 0.22;
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const leftX = px - cosY * runnerOffset;
        const leftZ = pz + sinY * runnerOffset;
        const rightX = px + cosY * runnerOffset;
        const rightZ = pz - sinY * runnerOffset;
        if (this.prevTrailLeft && this.prevTrailRight) {
            this.createTrailSegment(this.prevTrailLeft.x, this.prevTrailLeft.z, leftX, leftZ);
            if (this.currentScene === 'RACING') {
                this.createTrailSegment(this.prevTrailRight.x, this.prevTrailRight.z, rightX, rightZ);
            }
        }
        this.prevTrailLeft = { x: leftX, z: leftZ };
        this.prevTrailRight = { x: rightX, z: rightZ };
    }
    createTrailSegment(x1, z1, x2, z2) {
        const dx = x2 - x1;
        const dz = z2 - z1;
        const length = Math.sqrt(dx * dx + dz * dz);
        if (length < 0.06 || length > 4.5)
            return;
        const width = this.currentScene === 'RACING' ? 0.12 : 0.18;
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
            if (old)
                this.scene.remove(old.mesh);
        }
    }
    clearAllSkidMarks() {
        for (const mark of this.skidMarks) {
            this.scene.remove(mark.mesh);
        }
        this.skidMarks = [];
        this.prevTrailLeft = null;
        this.prevTrailRight = null;
    }
    // =========================================================================
    // MODELOS 3D PROCEDURAIS DOS 4 PERSONAGENS (METAMORFOSE)
    // =========================================================================
    // 1. PINGUIM ALPINO ULTRA-DETALHADO
    // 1. PINGUIM ALPINO - ESTILO ANIMAL CROSSING (VILLAGER)
    createDetailedPenguin() {
        const root = new THREE.Group();
        // Materiais aveludados e suaves estilo Animal Crossing / Vinyl Toy
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.88 });
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82 });
        const beakMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.65 });
        const footMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.70 });
        const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        const eyeIrisMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 });
        const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const blushMat = new THREE.MeshBasicMaterial({ color: 0xfb7185, transparent: true, opacity: 0.60 });
        this.charTorso = new THREE.Group();
        // Tronco arredondado e fofinho em formato de pera (Animal Crossing villager silhouette)
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 20), bodyMat);
        body.scale.set(0.96, 1.08, 0.94);
        body.position.y = 0.62;
        body.castShadow = true;
        this.charTorso.add(body);
        // Barriga branca em formato clássico e fofo de pinguim do Animal Crossing
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.44, 20, 20), whiteMat);
        belly.scale.set(0.82, 0.98, 0.62);
        belly.position.set(0, 0.58, 0.22);
        this.charTorso.add(belly);
        // Colarinho macio de penugem
        const collar = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.045, 8, 24), whiteMat);
        collar.rotation.x = Math.PI / 2;
        collar.position.y = 0.96;
        this.charTorso.add(collar);
        // Cabeça Chibi grande e arredondada (Animal Crossing style)
        this.charHead = new THREE.Group();
        this.charHead.position.y = 1.18;
        const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.44, 24, 24), bodyMat);
        headMesh.scale.set(1.06, 0.96, 1.02);
        headMesh.castShadow = true;
        this.charHead.add(headMesh);
        // Rostinho branco frontal com recorte em arco fofo
        const faceMask = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 20), whiteMat);
        faceMask.scale.set(0.88, 0.82, 0.62);
        faceMask.position.set(0, -0.04, 0.22);
        this.charHead.add(faceMask);
        // Crista de 3 peninhas macias no topo
        for (let i = -1; i <= 1; i++) {
            const feather = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 6), bodyMat);
            feather.position.set(i * 0.07, 0.44, -0.02);
            feather.rotation.set(-0.3, 0, i * 0.22);
            this.charHead.add(feather);
        }
        // Bico fofo e alegre estilo Roald/Aurora
        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 10), beakMat);
        beak.rotation.x = Math.PI / 2 + 0.12;
        beak.position.set(0, -0.06, 0.42);
        beak.scale.set(1.15, 0.85, 1.0);
        this.charHead.add(beak);
        // Olhos brilhantes estilo Animal Crossing: grandes pupilas com duplo reflexo de luz
        for (const side of [-1, 1]) {
            const eyeBack = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 14), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            eyeBack.scale.set(0.9, 1.1, 0.4);
            eyeBack.position.set(side * 0.16, 0.06, 0.38);
            const iris = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), eyeIrisMat);
            iris.scale.set(0.9, 1.1, 0.35);
            iris.position.set(side * 0.16, 0.06, 0.41);
            const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), eyePupilMat);
            pupil.scale.set(0.9, 1.1, 0.3);
            pupil.position.set(side * 0.16, 0.06, 0.43);
            // Grande brilho superior (catchlight)
            const glintBig = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), glintMat);
            glintBig.position.set(side * 0.145, 0.095, 0.45);
            // Pequeno brilho inferior
            const glintSmall = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), glintMat);
            glintSmall.position.set(side * 0.175, 0.035, 0.45);
            // Bochecha rosada circular
            const blush = new THREE.Mesh(new THREE.CircleGeometry(0.065, 16), blushMat);
            blush.position.set(side * 0.27, -0.08, 0.36);
            blush.rotation.y = side * 0.42;
            this.charHead.add(eyeBack, iris, pupil, glintBig, glintSmall, blush);
        }
        this.attachEquippedHat(this.charHead);
        this.attachEquippedGoggles(this.charHead);
        this.charTorso.add(this.charHead);
        this.attachEquippedScarf(this.charTorso);
        // Asinhas (Flippers) curtinhas e gordinhas estilo Animal Crossing
        const createAnimalCrossingFlipper = (side) => {
            const flipperGroup = new THREE.Group();
            const flipper = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.38, 10, 10), bodyMat);
            flipper.scale.set(1.0, 1.0, 0.45);
            flipper.position.y = -0.16;
            flipper.castShadow = true;
            const innerTrim = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.32, 8, 8), whiteMat);
            innerTrim.position.set(-side * 0.015, -0.16, 0.03);
            innerTrim.scale.set(0.95, 0.95, 0.3);
            flipperGroup.add(flipper, innerTrim);
            flipperGroup.position.set(side * 0.48, 0.65, 0.05);
            flipperGroup.rotation.set(-0.15, 0, side * -0.42);
            return flipperGroup;
        };
        this.charArmL = createAnimalCrossingFlipper(-1);
        this.charArmR = createAnimalCrossingFlipper(1);
        const handSnowball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 }));
        handSnowball.position.set(0, -0.32, 0.10);
        handSnowball.visible = false;
        this.charArmR.add(handSnowball);
        this.charTorso.add(this.charArmL, this.charArmR);
        // Rabinho arredondado de fofura
        const tail = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), bodyMat);
        tail.scale.set(1.1, 0.75, 1.2);
        tail.position.set(0, 0.42, -0.44);
        this.charTail = tail;
        this.charTorso.add(tail);
        root.add(this.charTorso);
        // Patinhas arredondadas no estilo Animal Crossing (paddle feet)
        const createAnimalCrossingFoot = (posX) => {
            const foot = new THREE.Group();
            const footMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.34), footMat);
            footMesh.position.set(0, 0.045, 0.10);
            footMesh.scale.set(1.0, 0.85, 1.1);
            footMesh.castShadow = true;
            // 3 dedinhos arredondados fofos na frente
            for (let t = -1; t <= 1; t++) {
                const toe = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), footMat);
                toe.scale.set(0.9, 0.7, 1.2);
                toe.position.set(t * 0.075, 0.04, 0.26);
                foot.add(toe);
            }
            foot.add(footMesh);
            foot.position.set(posX, 0.02, 0.02);
            foot.rotation.y = posX < 0 ? -0.18 : 0.18; // Levemente virado para fora (waddle!)
            return foot;
        };
        this.charFootL = createAnimalCrossingFoot(-0.22);
        this.charFootR = createAnimalCrossingFoot(0.22);
        root.add(this.charFootL, this.charFootR);
        const rig = {
            root,
            torso: this.charTorso,
            head: this.charHead,
            armL: this.charArmL,
            armR: this.charArmR,
            footL: this.charFootL,
            footR: this.charFootR,
            tail: this.charTail,
            scarfTail: this.charScarfTail,
            handSnowball
        };
        root.userData.rig = rig;
        return root;
    }
    // 2. SAPO VERDE - ESTILO ANIMAL CROSSING (VILLAGER)
    createDetailedFrog() {
        const root = new THREE.Group();
        const frogGreenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.86 });
        const frogBellyMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.82 });
        const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const blushMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.60 });
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0x14532d });
        this.charTorso = new THREE.Group();
        // Tronco compacto e rechonchudo estilo pelúcia / vinyl toy
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.46, 20, 20), frogGreenMat);
        body.scale.set(1.04, 0.96, 0.98);
        body.position.y = 0.58;
        body.castShadow = true;
        this.charTorso.add(body);
        // Barriguinha redonda em tom creme/amarelo pastel
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.40, 18, 18), frogBellyMat);
        belly.position.set(0, 0.54, 0.22);
        belly.scale.set(0.86, 0.84, 0.56);
        this.charTorso.add(belly);
        // Cabeça Chibi gigante esférica (Animal Crossing frog head)
        this.charHead = new THREE.Group();
        this.charHead.position.y = 1.12;
        const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 24), frogGreenMat);
        headMesh.scale.set(1.22, 0.94, 1.12);
        headMesh.castShadow = true;
        this.charHead.add(headMesh);
        // Dois bulbos oculares icônicos no topo da cabeça (estilo Lily/Henry)
        for (const side of [-1, 1]) {
            const eyeSocket = new THREE.Mesh(new THREE.SphereGeometry(0.20, 16, 16), frogGreenMat);
            eyeSocket.position.set(side * 0.26, 0.32, 0.08);
            eyeSocket.scale.set(1.0, 1.05, 1.0);
            this.charHead.add(eyeSocket);
            // Globo ocular branco grande e saltado
            const eyeGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.155, 14, 14), eyeWhiteMat);
            eyeGlobe.position.set(side * 0.26, 0.34, 0.16);
            // Pupila redonda e expressiva
            const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 12), pupilMat);
            pupil.position.set(side * 0.26, 0.34, 0.27);
            pupil.scale.set(0.95, 1.05, 0.4);
            // Brilho grande (catchlight superior)
            const glintBig = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), glintMat);
            glintBig.position.set(side * 0.235, 0.38, 0.29);
            // Brilho menor (catchlight inferior)
            const glintSmall = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), glintMat);
            glintSmall.position.set(side * 0.28, 0.30, 0.29);
            this.charHead.add(eyeGlobe, pupil, glintBig, glintSmall);
            // Bochechas rosadas fofas bem debaixo dos olhos
            const blush = new THREE.Mesh(new THREE.CircleGeometry(0.075, 16), blushMat);
            blush.position.set(side * 0.35, -0.04, 0.38);
            blush.rotation.y = side * 0.45;
            this.charHead.add(blush);
        }
        // Sorriso alegre largo de orelha a orelha com covinhas
        const smile = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.022, 8, 20, Math.PI * 0.76), mouthMat);
        smile.rotation.set(Math.PI * 0.88, 0, Math.PI * 0.12);
        smile.position.set(0, -0.06, 0.48);
        this.charHead.add(smile);
        // Covinhas nas pontas do sorriso
        for (const side of [-1, 1]) {
            const dimple = new THREE.Mesh(new THREE.SphereGeometry(0.024, 6, 6), mouthMat);
            dimple.position.set(side * 0.22, -0.03, 0.44);
            this.charHead.add(dimple);
        }
        this.attachEquippedHat(this.charHead);
        this.attachEquippedGoggles(this.charHead);
        this.charTorso.add(this.charHead);
        this.attachEquippedScarf(this.charTorso);
        // Bracinhos curtos e fofinhos com dedinhos em esferas (ventosas)
        const createAnimalCrossingFrogArm = (side) => {
            const armGroup = new THREE.Group();
            const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.34, 8, 8), frogGreenMat);
            arm.position.y = -0.16;
            armGroup.add(arm);
            // 3 dedinhos arredondados fofos na mãozinha
            for (let d = -1; d <= 1; d++) {
                const finger = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), frogBellyMat);
                finger.position.set(d * 0.05, -0.34, 0.04);
                armGroup.add(finger);
            }
            armGroup.position.set(side * 0.48, 0.60, 0.06);
            armGroup.rotation.set(0.1, 0, side * -0.36);
            return armGroup;
        };
        this.charArmL = createAnimalCrossingFrogArm(-1);
        this.charArmR = createAnimalCrossingFrogArm(1);
        const handSnowball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 }));
        handSnowball.position.set(0, -0.32, 0.10);
        handSnowball.visible = false;
        this.charArmR.add(handSnowball);
        this.charTorso.add(this.charArmL, this.charArmR);
        root.add(this.charTorso);
        // Patinhas traseiras arredondadas com 3 dedinhos de bolinha
        const createAnimalCrossingFrogFoot = (posX) => {
            const foot = new THREE.Group();
            const footMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.32), frogGreenMat);
            footMesh.position.set(0, 0.04, 0.10);
            footMesh.castShadow = true;
            foot.add(footMesh);
            for (let toe = -1; toe <= 1; toe++) {
                const ballToe = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), frogBellyMat);
                ballToe.position.set(toe * 0.075, 0.04, 0.28);
                foot.add(ballToe);
            }
            foot.position.set(posX, 0.02, 0.02);
            foot.rotation.y = posX < 0 ? -0.22 : 0.22;
            return foot;
        };
        this.charFootL = createAnimalCrossingFrogFoot(-0.24);
        this.charFootR = createAnimalCrossingFrogFoot(0.24);
        root.add(this.charFootL, this.charFootR);
        this.charTail = null;
        const rig = {
            root,
            torso: this.charTorso,
            head: this.charHead,
            armL: this.charArmL,
            armR: this.charArmR,
            footL: this.charFootL,
            footR: this.charFootR,
            tail: null,
            scarfTail: this.charScarfTail,
            handSnowball
        };
        root.userData.rig = rig;
        return root;
    }
    // 3. GATO SIAMÊS - ESTILO ANIMAL CROSSING (VILLAGER)
    createDetailedCat() {
        const root = new THREE.Group();
        const furCreamMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.88 });
        const sealBrownMat = new THREE.MeshStandardMaterial({ color: 0x3b180d, roughness: 0.84 });
        const innerEarPinkMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.75 });
        const sapphireEyeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35 });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const blushMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.55 });
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0x3b180d });
        this.charTorso = new THREE.Group();
        // Tronco compacto e fofinho em formato de pera
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.44, 20, 20), furCreamMat);
        body.scale.set(0.96, 1.04, 0.94);
        body.position.y = 0.60;
        body.castShadow = true;
        this.charTorso.add(body);
        // Peitoral fofinho em tom marfim
        const chestBib = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }));
        chestBib.scale.set(0.85, 0.92, 0.55);
        chestBib.position.set(0, 0.62, 0.22);
        this.charTorso.add(chestBib);
        // Cabeça Chibi felina com bochechas arredondadas (Animal Crossing cat head)
        this.charHead = new THREE.Group();
        this.charHead.position.y = 1.16;
        const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.44, 24, 24), furCreamMat);
        headMesh.scale.set(1.14, 0.96, 1.06);
        headMesh.castShadow = true;
        this.charHead.add(headMesh);
        // Máscara siamesa chocolate no centro do rosto
        const mask = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 18), sealBrownMat);
        mask.scale.set(1.02, 0.82, 0.65);
        mask.position.set(0, -0.04, 0.22);
        this.charHead.add(mask);
        // Orelhas triangulares empinadas características com interior aveludado rosa
        for (const side of [-1, 1]) {
            const earGroup = new THREE.Group();
            const earOuter = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.28, 5), sealBrownMat);
            earOuter.position.set(0, 0.14, 0);
            earOuter.scale.set(1.1, 1.0, 0.6);
            const earInner = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.20, 4), innerEarPinkMat);
            earInner.position.set(0, 0.12, 0.04);
            earInner.scale.set(1.0, 0.95, 0.4);
            earGroup.add(earOuter, earInner);
            earGroup.position.set(side * 0.26, 0.38, 0.04);
            earGroup.rotation.set(0.08, 0, -side * 0.35);
            this.charHead.add(earGroup);
        }
        // Narizinho triangular rosa
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.06, 5), innerEarPinkMat);
        nose.rotation.x = -Math.PI / 2;
        nose.position.set(0, -0.04, 0.44);
        this.charHead.add(nose);
        // Boquinha felina clássica em "w" (:3) esculpida em arco duplo
        for (const side of [-1, 1]) {
            const lip = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.012, 6, 12, Math.PI * 0.9), mouthMat);
            lip.rotation.set(Math.PI * 0.95, 0, side * 0.2);
            lip.position.set(side * 0.042, -0.095, 0.44);
            this.charHead.add(lip);
        }
        // Bigodes brancos estilizados fofos
        for (const side of [-1, 1]) {
            for (let w = -1; w <= 1; w++) {
                const whisker = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.24, 4), whiskerMat);
                whisker.rotation.z = Math.PI / 2 + w * 0.14;
                whisker.rotation.y = side * 0.38;
                whisker.position.set(side * 0.24, -0.07 + w * 0.025, 0.38);
                this.charHead.add(whisker);
            }
        }
        // Olhos Amendoados de Safira estilo Animal Crossing
        for (const side of [-1, 1]) {
            const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 14), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            eyeWhite.scale.set(0.9, 1.1, 0.35);
            eyeWhite.position.set(side * 0.16, 0.07, 0.36);
            const iris = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), sapphireEyeMat);
            iris.scale.set(0.9, 1.1, 0.3);
            iris.position.set(side * 0.16, 0.07, 0.39);
            const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), pupilMat);
            pupil.scale.set(0.85, 1.15, 0.25);
            pupil.position.set(side * 0.16, 0.07, 0.41);
            // Brilhos duplos dos olhos (sparkle glints)
            const glintBig = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), glintMat);
            glintBig.position.set(side * 0.145, 0.105, 0.43);
            const glintSmall = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), glintMat);
            glintSmall.position.set(side * 0.175, 0.045, 0.43);
            // Bochechas rosadas circulares
            const blush = new THREE.Mesh(new THREE.CircleGeometry(0.065, 16), blushMat);
            blush.position.set(side * 0.29, -0.06, 0.35);
            blush.rotation.y = side * 0.45;
            this.charHead.add(eyeWhite, iris, pupil, glintBig, glintSmall, blush);
        }
        this.attachEquippedHat(this.charHead);
        this.attachEquippedGoggles(this.charHead);
        this.charTorso.add(this.charHead);
        this.attachEquippedScarf(this.charTorso);
        // Patinhas dianteiras curtinhas com pontas chocolate e almofadinhas
        const createAnimalCrossingCatArm = (side) => {
            const pawGroup = new THREE.Group();
            const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.36, 8, 8), furCreamMat);
            arm.position.y = -0.16;
            arm.castShadow = true;
            // Ponta da patinha marrom chocolate
            const mitt = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), sealBrownMat);
            mitt.position.y = -0.32;
            // Almofadinha rosa fofa na palma
            const bean = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), innerEarPinkMat);
            bean.position.set(0, -0.34, 0.04);
            pawGroup.add(arm, mitt, bean);
            pawGroup.position.set(side * 0.46, 0.62, 0.06);
            pawGroup.rotation.set(-0.1, 0, side * -0.32);
            return pawGroup;
        };
        this.charArmL = createAnimalCrossingCatArm(-1);
        this.charArmR = createAnimalCrossingCatArm(1);
        const handSnowball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 }));
        handSnowball.position.set(0, -0.32, 0.10);
        handSnowball.visible = false;
        this.charArmR.add(handSnowball);
        this.charTorso.add(this.charArmL, this.charArmR);
        // Cauda longa elegante e curva estilo Animal Crossing
        const catTail = new THREE.Group();
        const tailBase = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.05, 0.55, 8), sealBrownMat);
        tailBase.position.set(0, 0.24, -0.15);
        tailBase.rotation.x = -0.7;
        const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), sealBrownMat);
        tailTip.position.set(0, 0.45, -0.32);
        catTail.add(tailBase, tailTip);
        catTail.position.set(0, 0.46, -0.36);
        this.charTail = catTail;
        this.charTorso.add(catTail);
        root.add(this.charTorso);
        // Patinhas traseiras fofas com solas macias
        const createAnimalCrossingCatFoot = (posX) => {
            const foot = new THREE.Group();
            const footMesh = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.08, 0.30), sealBrownMat);
            footMesh.position.set(0, 0.04, 0.08);
            footMesh.castShadow = true;
            foot.add(footMesh);
            // Almofadas da patinha traseira
            const mainPad = new THREE.Mesh(new THREE.SphereGeometry(0.042, 6, 6), innerEarPinkMat);
            mainPad.position.set(0, 0.03, 0.16);
            foot.add(mainPad);
            foot.position.set(posX, 0.02, 0.02);
            foot.rotation.y = posX < 0 ? -0.14 : 0.14;
            return foot;
        };
        this.charFootL = createAnimalCrossingCatFoot(-0.20);
        this.charFootR = createAnimalCrossingCatFoot(0.20);
        root.add(this.charFootL, this.charFootR);
        const rig = {
            root,
            torso: this.charTorso,
            head: this.charHead,
            armL: this.charArmL,
            armR: this.charArmR,
            footL: this.charFootL,
            footR: this.charFootR,
            tail: this.charTail,
            scarfTail: this.charScarfTail,
            handSnowball
        };
        root.userData.rig = rig;
        return root;
    }
    // 4. CACHORRO SHIH TZU - ESTILO ANIMAL CROSSING (VILLAGER)
    createDetailedDog() {
        const root = new THREE.Group();
        const caramelMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.86 });
        const whiteFurMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82 });
        const noseBlackMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        const tonguePinkMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
        const ribbonRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
        const bellGoldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.25 });
        const eyeBrownMat = new THREE.MeshStandardMaterial({ color: 0x27170a, roughness: 0.35 });
        const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const blushMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.55 });
        this.charTorso = new THREE.Group();
        // Tronco peludinho e rechonchudo em formato de pera
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.46, 20, 20), caramelMat);
        body.scale.set(0.96, 1.04, 0.94);
        body.position.y = 0.60;
        body.castShadow = true;
        this.charTorso.add(body);
        // Peitoral farto e peludo branco estilo Isabelle
        const chestFur = new THREE.Mesh(new THREE.SphereGeometry(0.40, 18, 18), whiteFurMat);
        chestFur.position.set(0, 0.62, 0.22);
        chestFur.scale.set(0.88, 0.94, 0.62);
        this.charTorso.add(chestFur);
        // Cabeça Chibi felpuda e redondinha
        this.charHead = new THREE.Group();
        this.charHead.position.y = 1.18;
        const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 24), caramelMat);
        headMesh.scale.set(1.10, 0.98, 1.05);
        headMesh.castShadow = true;
        this.charHead.add(headMesh);
        // Topete clássico amarrado no topo com laço vermelho e sininho dourado
        const topKnot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), caramelMat);
        topKnot.scale.set(0.9, 1.25, 0.9);
        topKnot.position.set(0, 0.44, 0.05);
        // Lacinho vermelho com sino dourado
        const bowCenter = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), bellGoldMat);
        bowCenter.position.set(0, 0.40, 0.14);
        const bowWingL = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.11, 5), ribbonRedMat);
        bowWingL.rotation.z = Math.PI / 2;
        bowWingL.position.set(-0.075, 0.40, 0.14);
        const bowWingR = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.11, 5), ribbonRedMat);
        bowWingR.rotation.z = -Math.PI / 2;
        bowWingR.position.set(0.075, 0.40, 0.14);
        this.charHead.add(topKnot, bowCenter, bowWingL, bowWingR);
        // Focinho branco arredondado fofo de pelúcia
        const snout = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), whiteFurMat);
        snout.scale.set(1.10, 0.78, 0.72);
        snout.position.set(0, -0.05, 0.32);
        this.charHead.add(snout);
        // Narizinho botão preto de coração/oval
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.058, 8, 8), noseBlackMat);
        nose.scale.set(1.1, 0.9, 0.7);
        nose.position.set(0, -0.01, 0.47);
        this.charHead.add(nose);
        // Linguinha rosada de fora (expressão clássica 'mlep' fofíssima)
        const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.024, 0.09), tonguePinkMat);
        tongue.position.set(0, -0.10, 0.44);
        tongue.rotation.x = 0.28;
        this.charHead.add(tongue);
        // Orelhas caídas fartas com pelos em camadas arredondadas
        for (const side of [-1, 1]) {
            const earGroup = new THREE.Group();
            const earMain = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.44, 10, 10), caramelMat);
            earMain.position.y = -0.18;
            earMain.scale.set(1.15, 1.0, 0.65);
            const earFluff = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.36, 8, 8), whiteFurMat);
            earFluff.position.set(0, -0.16, 0.04);
            earFluff.scale.set(1.0, 0.95, 0.4);
            earGroup.add(earMain, earFluff);
            earGroup.position.set(side * 0.38, 0.14, 0.06);
            earGroup.rotation.set(0.14, 0, side * 0.22);
            this.charHead.add(earGroup);
            // Olhos castanhos brilhantes e doces estilo Animal Crossing
            const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 14), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            eyeWhite.scale.set(0.9, 1.1, 0.35);
            eyeWhite.position.set(side * 0.16, 0.07, 0.36);
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.072, 12, 12), eyeBrownMat);
            eye.scale.set(0.9, 1.1, 0.3);
            eye.position.set(side * 0.16, 0.07, 0.39);
            // Brilhos nos olhos grandes e expressivos
            const glintBig = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), glintMat);
            glintBig.position.set(side * 0.145, 0.105, 0.43);
            const glintSmall = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), glintMat);
            glintSmall.position.set(side * 0.175, 0.045, 0.43);
            // Bochechas rosadas circulares
            const blush = new THREE.Mesh(new THREE.CircleGeometry(0.065, 16), blushMat);
            blush.position.set(side * 0.29, -0.06, 0.35);
            blush.rotation.y = side * 0.45;
            this.charHead.add(eyeWhite, eye, glintBig, glintSmall, blush);
        }
        this.attachEquippedHat(this.charHead);
        this.attachEquippedGoggles(this.charHead);
        this.charTorso.add(this.charHead);
        this.attachEquippedScarf(this.charTorso);
        // Patinhas dianteiras felpudas curtinhas com meias brancas
        const createAnimalCrossingDogArm = (side) => {
            const armGroup = new THREE.Group();
            const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.36, 8, 8), caramelMat);
            arm.position.y = -0.16;
            arm.castShadow = true;
            const mitten = new THREE.Mesh(new THREE.SphereGeometry(0.092, 10, 10), whiteFurMat);
            mitten.position.y = -0.32;
            mitten.scale.set(1.05, 0.95, 1.1);
            armGroup.add(arm, mitten);
            armGroup.position.set(side * 0.48, 0.60, 0.06);
            armGroup.rotation.set(-0.12, 0, side * -0.32);
            return armGroup;
        };
        this.charArmL = createAnimalCrossingDogArm(-1);
        this.charArmR = createAnimalCrossingDogArm(1);
        const handSnowball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 }));
        handSnowball.position.set(0, -0.32, 0.10);
        handSnowball.visible = false;
        this.charArmR.add(handSnowball);
        this.charTorso.add(this.charArmL, this.charArmR);
        // Rabinho pom-pom exuberante enrolado nas costas
        const tailGroup = new THREE.Group();
        const tailPlume = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), whiteFurMat);
        tailPlume.scale.set(0.9, 1.25, 1.1);
        const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.16, 5), caramelMat);
        tailTip.position.set(0, 0.14, -0.05);
        tailTip.rotation.x = -0.4;
        tailGroup.add(tailPlume, tailTip);
        tailGroup.position.set(0, 0.68, -0.40);
        this.charTail = tailGroup;
        this.charTorso.add(tailGroup);
        root.add(this.charTorso);
        // Patas traseiras curtinhas brancas
        const createAnimalCrossingDogFoot = (posX) => {
            const foot = new THREE.Group();
            const footMesh = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.08, 0.32), whiteFurMat);
            footMesh.position.set(0, 0.04, 0.08);
            footMesh.castShadow = true;
            foot.add(footMesh);
            foot.position.set(posX, 0.02, 0.02);
            foot.rotation.y = posX < 0 ? -0.16 : 0.16;
            return foot;
        };
        this.charFootL = createAnimalCrossingDogFoot(-0.21);
        this.charFootR = createAnimalCrossingDogFoot(0.21);
        root.add(this.charFootL, this.charFootR);
        const rig = {
            root,
            torso: this.charTorso,
            head: this.charHead,
            armL: this.charArmL,
            armR: this.charArmR,
            footL: this.charFootL,
            footR: this.charFootR,
            tail: this.charTail,
            scarfTail: this.charScarfTail,
            handSnowball
        };
        root.userData.rig = rig;
        return root;
    }
    // Anexar Chapéu Equipado
    attachEquippedHat(head) {
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
        }
        else if (hatId === 'hat_top') {
            const hatMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
            const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
            const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.04, 16), hatMat);
            brim.position.y = 0.34;
            const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.48, 16), hatMat);
            crown.position.y = 0.58;
            const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.345, 0.345, 0.10, 16), ribbonMat);
            ribbon.position.y = 0.41;
            head.add(brim, crown, ribbon);
        }
        else if (hatId === 'hat_crown') {
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
    // Anexar Óculos de Esqui Equipados
    attachEquippedGoggles(head) {
        const gId = this.equipped.goggles;
        if (gId === 'goggles_none')
            return;
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
    // Anexar Cachecol Equipado
    attachEquippedScarf(torso) {
        const sId = this.equipped.scarf;
        const color = sId === 'scarf_green' ? 0x16a34a : (sId === 'scarf_red' ? 0xdc2626 : 0xfacc15);
        const scarfMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
        const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.09, 8, 20), scarfMat);
        scarfRing.rotation.x = Math.PI / 2;
        scarfRing.position.y = 0.98;
        this.charScarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.55), scarfMat);
        this.charScarfTail.position.set(0.26, 0.94, -0.38);
        this.charScarfTail.rotation.set(-0.35, 0.25, 0);
        torso.add(scarfRing, this.charScarfTail);
    }
    // Modelagem dos Veículos de Corrida
    createVehicleMesh(vType) {
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
        }
        else {
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
    // Criação do Modelo Ativo Escolhido
    createCurrentCharacterModel() {
        let group;
        switch (this.selectedCharacter) {
            case 'frog':
                group = this.createDetailedFrog();
                break;
            case 'cat':
                group = this.createDetailedCat();
                break;
            case 'dog':
                group = this.createDetailedDog();
                break;
            case 'penguin':
            default:
                group = this.createDetailedPenguin();
                break;
        }
        const rig = group.userData.rig;
        if (rig) {
            this.playerRig = rig;
            this.charTorso = rig.torso;
            this.charHead = rig.head;
            this.charArmL = rig.armL;
            this.charArmR = rig.armR;
            this.charFootL = rig.footL;
            this.charFootR = rig.footR;
            this.charTail = rig.tail;
            this.charScarfTail = rig.scarfTail;
        }
        return group;
    }
    // Montagem do Avatar (a pé no Hub, montado no veículo na corrida)
    createAvatarAssembly() {
        const group = new THREE.Group();
        if (this.currentScene === 'RACING') {
            const vehicle = this.createVehicleMesh(this.equipped.vehicle);
            group.add(vehicle);
            const character = this.createCurrentCharacterModel();
            character.position.y = this.equipped.vehicle.startsWith('sled') ? 0.26 : 0.08;
            group.add(character);
        }
        else {
            const character = this.createCurrentCharacterModel();
            character.position.y = 0;
            group.add(character);
        }
        return group;
    }
    respawnPlayerMesh() {
        if (this.playerGroup)
            this.scene.remove(this.playerGroup);
        this.playerGroup = this.createAvatarAssembly();
        this.scene.add(this.playerGroup);
        if (this.playerRig) {
            this.charTorso = this.playerRig.torso;
            this.charHead = this.playerRig.head;
            this.charArmL = this.playerRig.armL;
            this.charArmR = this.playerRig.armR;
            this.charFootL = this.playerRig.footL;
            this.charFootR = this.playerRig.footR;
            this.charTail = this.playerRig.tail;
            this.charScarfTail = this.playerRig.scarfTail;
        }
    }
    // =========================================================================
    // SISTEMA DE ANIMAÇÃO ESQUELÉTICA PROCEDURAL (ANIMAL CROSSING CHIBI RIG)
    // =========================================================================
    animateRigWalk(rig, time, running, isCharging = false, chargeRatio = 0, throwTimer = 0) {
        if (!rig.footL || !rig.footR || !rig.torso)
            return;
        const freq = running ? 1.6 : 1.0;
        const t = time * freq;
        // Passos patinados com elevação orgânica estilo Animal Crossing
        rig.footL.position.z = Math.sin(t) * (running ? 0.30 : 0.22);
        rig.footL.position.y = Math.max(0, Math.cos(t) * (running ? 0.18 : 0.14));
        rig.footL.rotation.x = -Math.sin(t) * 0.28;
        rig.footR.position.z = -Math.sin(t) * (running ? 0.30 : 0.22);
        rig.footR.position.y = Math.max(0, -Math.cos(t) * (running ? 0.18 : 0.14));
        rig.footR.rotation.x = Math.sin(t) * 0.28;
        const isThrowing = throwTimer > 0;
        const isChargingThrow = isCharging && !isThrowing;
        if (isThrowing) {
            // Snap vigoroso para frente e follow-through dinâmico em movimento
            const progress = 1.0 - (throwTimer / this.maxThrowAnimFrames);
            if (progress < 0.35) {
                const snapT = progress / 0.35;
                rig.torso.rotation.y = -0.35 + snapT * 0.75;
                rig.torso.rotation.x = snapT * 0.18;
                rig.torso.rotation.z = Math.sin(t) * 0.08;
                if (rig.armR) {
                    rig.armR.rotation.x = -1.6 + snapT * 3.25;
                    rig.armR.rotation.y = -0.25 * snapT;
                    rig.armR.rotation.z = -0.20;
                }
                if (rig.armL) {
                    rig.armL.rotation.x = 1.0 - snapT * 1.6;
                    rig.armL.rotation.z = 0.30;
                }
            }
            else {
                const blend = (progress - 0.35) / 0.65;
                rig.torso.rotation.y = 0.40 * (1 - blend);
                rig.torso.rotation.x = 0.18 * (1 - blend);
                rig.torso.rotation.z = Math.sin(t) * (running ? 0.18 : 0.13);
                if (rig.armR) {
                    rig.armR.rotation.x = 1.65 * (1 - blend) + (-Math.sin(t) * 0.6) * blend;
                    rig.armR.rotation.y = 0;
                    rig.armR.rotation.z = -0.38;
                }
                if (rig.armL) {
                    rig.armL.rotation.x = -0.6 * (1 - blend) + (Math.sin(t) * 0.6) * blend;
                    rig.armL.rotation.y = 0;
                    rig.armL.rotation.z = 0.38;
                }
            }
            if (rig.handSnowball)
                rig.handSnowball.visible = false;
        }
        else if (isChargingThrow) {
            // Postura tática enquanto corre ou anda: braço direito puxado atrás com bola, outro apontando
            const c = chargeRatio;
            rig.torso.rotation.y = -0.42 * c;
            rig.torso.rotation.x = -0.08 * c;
            rig.torso.rotation.z = Math.sin(t) * 0.08;
            if (rig.head) {
                rig.head.rotation.y = 0.42 * c;
                rig.head.rotation.z = 0;
            }
            if (rig.armR) {
                rig.armR.rotation.x = -1.6 - c * 0.65;
                rig.armR.rotation.y = 0.35;
                rig.armR.rotation.z = -0.45 - c * 0.25;
            }
            if (rig.armL) {
                rig.armL.rotation.x = 1.15;
                rig.armL.rotation.y = 0.20;
                rig.armL.rotation.z = 0.25;
            }
            if (rig.handSnowball) {
                rig.handSnowball.visible = true;
                rig.handSnowball.scale.setScalar(0.75 + c * 0.55);
            }
        }
        else {
            // Caminhada / corrida alegre estilo Animal Crossing (waddle)
            rig.torso.rotation.z = Math.sin(t) * (running ? 0.18 : 0.13);
            rig.torso.rotation.y = 0;
            rig.torso.rotation.x = 0;
            if (rig.head) {
                rig.head.rotation.z = -Math.sin(t) * (running ? 0.16 : 0.12);
                rig.head.rotation.y = Math.sin(t) * 0.08;
            }
            if (rig.armL && rig.armR) {
                rig.armL.rotation.x = Math.sin(t) * (running ? 0.75 : 0.55);
                rig.armR.rotation.x = -Math.sin(t) * (running ? 0.75 : 0.55);
                rig.armL.rotation.y = 0;
                rig.armR.rotation.y = 0;
                rig.armL.rotation.z = 0.38 + Math.abs(Math.sin(t)) * 0.12;
                rig.armR.rotation.z = -0.38 - Math.abs(Math.sin(t)) * 0.12;
            }
            if (rig.handSnowball)
                rig.handSnowball.visible = false;
        }
        rig.torso.position.y = Math.abs(Math.sin(t * 2)) * (running ? 0.08 : 0.05);
        if (rig.tail) {
            rig.tail.rotation.y = Math.sin(t * 2.2) * 0.42;
        }
        if (rig.scarfTail) {
            rig.scarfTail.rotation.y = 0.25 + Math.sin(t * 1.5) * 0.25;
        }
    }
    animateRigIdle(rig, isSitting = false, isCharging = false, chargeRatio = 0, throwTimer = 0) {
        if (!rig.footL || !rig.footR || !rig.torso)
            return;
        if (isSitting) {
            rig.footL.position.set(-0.20, 0.05, 0.38);
            rig.footR.position.set(0.20, 0.05, 0.38);
            rig.footL.rotation.set(0, -0.18, 0);
            rig.footR.rotation.set(0, 0.18, 0);
            rig.torso.rotation.set(0, 0, 0);
            rig.torso.position.y = -0.05;
            rig.torso.scale.set(1, 1, 1);
            if (rig.head)
                rig.head.rotation.set(0, 0, 0);
            if (rig.armL && rig.armR) {
                rig.armL.rotation.set(0.4, 0, 0.2);
                rig.armR.rotation.set(0.4, 0, -0.2);
            }
            if (rig.handSnowball)
                rig.handSnowball.visible = false;
            return;
        }
        const isThrowing = throwTimer > 0;
        const isChargingThrow = isCharging && !isThrowing;
        rig.footL.position.set(-0.22, 0.04, 0.08);
        rig.footR.position.set(0.22, 0.04, 0.08);
        rig.footL.rotation.set(0, -0.18, 0);
        rig.footR.rotation.set(0, 0.18, 0);
        if (isThrowing) {
            const progress = 1.0 - (throwTimer / this.maxThrowAnimFrames);
            if (progress < 0.35) {
                const snapT = progress / 0.35;
                rig.torso.rotation.y = -0.35 + snapT * 0.75;
                rig.torso.rotation.x = snapT * 0.18;
                rig.torso.rotation.z = 0;
                if (rig.armR) {
                    rig.armR.rotation.x = -1.6 + snapT * 3.25;
                    rig.armR.rotation.y = -0.25 * snapT;
                    rig.armR.rotation.z = -0.20;
                }
                if (rig.armL) {
                    rig.armL.rotation.x = 1.0 - snapT * 1.6;
                    rig.armL.rotation.z = 0.30;
                }
            }
            else {
                const blend = (progress - 0.35) / 0.65;
                rig.torso.rotation.y = 0.40 * (1 - blend);
                rig.torso.rotation.x = 0.18 * (1 - blend);
                rig.torso.rotation.z = 0;
                if (rig.armR) {
                    rig.armR.rotation.x = 1.65 * (1 - blend) + (-0.15) * blend;
                    rig.armR.rotation.y = 0;
                    rig.armR.rotation.z = -0.32;
                }
                if (rig.armL) {
                    rig.armL.rotation.x = -0.6 * (1 - blend) + (-0.15) * blend;
                    rig.armL.rotation.y = 0;
                    rig.armL.rotation.z = 0.32;
                }
            }
            if (rig.handSnowball)
                rig.handSnowball.visible = false;
        }
        else if (isChargingThrow) {
            const c = chargeRatio;
            rig.torso.rotation.y = -0.42 * c;
            rig.torso.rotation.x = -0.08 * c;
            rig.torso.rotation.z = 0;
            rig.torso.position.y = 0;
            if (rig.head) {
                rig.head.rotation.y = 0.42 * c;
                rig.head.rotation.z = 0;
            }
            if (rig.armR) {
                rig.armR.rotation.x = -1.6 - c * 0.65;
                rig.armR.rotation.y = 0.35;
                rig.armR.rotation.z = -0.45 - c * 0.25;
            }
            if (rig.armL) {
                rig.armL.rotation.x = 1.15;
                rig.armL.rotation.y = 0.20;
                rig.armL.rotation.z = 0.25;
            }
            if (rig.handSnowball) {
                rig.handSnowball.visible = true;
                rig.handSnowball.scale.setScalar(0.75 + c * 0.55);
            }
        }
        else {
            const now = Date.now();
            const breathe = Math.sin(now * 0.0035);
            rig.torso.scale.set(1.0 - breathe * 0.015, 1.0 + breathe * 0.022, 1.0 - breathe * 0.015);
            rig.torso.rotation.set(0, 0, 0);
            rig.torso.position.y = 0;
            if (rig.head) {
                rig.head.rotation.z = Math.sin(now * 0.0018) * 0.04;
                rig.head.rotation.y = Math.sin(now * 0.0012) * 0.03;
            }
            if (rig.armL && rig.armR) {
                rig.armL.rotation.set(-0.15, 0, 0.32);
                rig.armR.rotation.set(-0.15, 0, -0.32);
            }
            if (rig.tail) {
                rig.tail.rotation.y = Math.sin(now * 0.0025) * 0.18;
            }
            if (rig.handSnowball)
                rig.handSnowball.visible = false;
        }
    }
    animateRigFlinch(rig) {
        if (!rig)
            return;
        rig.torso.rotation.set(-0.35, 0, 0);
        rig.torso.position.y = 0.12;
        if (rig.head)
            rig.head.rotation.set(-0.25, 0, 0);
        if (rig.armL)
            rig.armL.rotation.set(1.1, 0, 0.5);
        if (rig.armR)
            rig.armR.rotation.set(1.1, 0, -0.5);
        if (rig.handSnowball)
            rig.handSnowball.visible = false;
    }
    animateBot(bot) {
        const rig = bot.rig;
        if (!rig)
            return;
        if (bot.state === 'frozen') {
            rig.torso.rotation.set(0.15, 0, 0.1);
            rig.torso.position.y = 0.05;
            if (rig.head)
                rig.head.rotation.set(-0.25, 0.2, 0);
            if (rig.armL)
                rig.armL.rotation.set(0.9, 0, 1.1);
            if (rig.armR)
                rig.armR.rotation.set(0.9, 0, -1.1);
            if (rig.footL)
                rig.footL.position.set(-0.24, 0.12, 0.2);
            if (rig.footR)
                rig.footR.position.set(0.24, 0.02, -0.1);
            if (rig.handSnowball)
                rig.handSnowball.visible = false;
            return;
        }
        if (bot.hitTimer > 0) {
            const hitT = bot.hitTimer / 18;
            rig.torso.rotation.set(-0.35 * hitT, 0, 0);
            rig.torso.position.y = 0.12 * hitT;
            if (rig.head)
                rig.head.rotation.set(-0.3 * hitT, 0, 0);
            if (rig.armL)
                rig.armL.rotation.set(1.2 * hitT, 0, 0.6);
            if (rig.armR)
                rig.armR.rotation.set(1.2 * hitT, 0, -0.6);
            if (rig.handSnowball)
                rig.handSnowball.visible = false;
            return;
        }
        if (bot.state === 'windup') {
            const p = Math.min(1.0, 1.0 - (bot.stateTimer / 22));
            this.animateRigIdle(rig, false, true, p, 0);
            return;
        }
        if (bot.state === 'throw') {
            this.animateRigIdle(rig, false, false, 0, bot.stateTimer);
            return;
        }
        if (bot.isMoving) {
            this.animateRigWalk(rig, bot.walkTime, true, false, 0, 0);
        }
        else {
            this.animateRigIdle(rig, false, false, 0, 0);
        }
    }
    // Animação do Personagem do Jogador
    animateCharacterWalk(time, running) {
        if (this.playerRig) {
            this.animateRigWalk(this.playerRig, time, running, this.isChargingSnowball, this.currentChargeRatio, this.throwAnimTimer);
        }
    }
    animateCharacterIdle() {
        if (this.playerRig) {
            this.animateRigIdle(this.playerRig, this.isSitting, this.isChargingSnowball, this.currentChargeRatio, this.throwAnimTimer);
        }
    }
    // =========================================================================
    // PLACAS FÍSICAS 3D INFORMATIVAS (CANVAS TEXTURE EM ALTA RESOLUÇÃO)
    // =========================================================================
    createTextSignboard(x, z, rotY, title, subtitle, accentHex = '#38bdf8') {
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
        const ctx = canvas.getContext('2d');
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
        // Colisor para a placa
        this.hubColliders.push({
            type: 'box',
            x,
            z,
            hw: 2.3,
            hd: 0.35,
            angle: rotY
        });
        return group;
    }
    // =========================================================================
    // BANCOS DE MADEIRA ONDE É POSSÍVEL SENTAR
    // =========================================================================
    createWoodenParkBench(x, z, rotY) {
        const bench = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
        const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
        // Pés e suportes de ferro fundido escuro
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
        // Ripas de madeira do assento
        for (let i = 0; i < 4; i++) {
            const slat = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.06, 0.16), woodMat);
            slat.position.set(0, 0.65, -0.25 + i * 0.18);
            slat.castShadow = true;
            bench.add(slat);
        }
        // Ripas de madeira do encosto
        for (let i = 0; i < 3; i++) {
            const slat = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.18, 0.05), woodMat);
            slat.position.set(0, 0.95 + i * 0.22, -0.38);
            slat.rotation.x = -0.15;
            slat.castShadow = true;
            bench.add(slat);
        }
        bench.position.set(x, 0, z);
        bench.rotation.y = rotY;
        // Registra ponto de sentar
        this.benches.push({ x, z, rotY });
        // Colisor do banco
        this.hubColliders.push({
            type: 'box',
            x,
            z,
            hw: 1.45,
            hd: 0.55,
            angle: rotY
        });
        return bench;
    }
    // =========================================================================
    // NPCS AUTÔNOMOS CIRCULANDO PELO VILAREJO (WANDERING NPCS)
    // =========================================================================
    spawnWanderingNPCs() {
        this.wanderingNPCs = [];
        // 1. Pip - O Pinguim Explorador (com gorro azul e cachecol listrado)
        const pip = this.createDetailedPenguin();
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
            footL: pip.children[1],
            footR: pip.children[2],
            torso: pip.children[0],
            armL: pip.children[0].children[3],
            armR: pip.children[0].children[4],
            tail: null,
            state: 'walking',
            reactionTimer: 0,
            yVel: 0,
            rig: pip.userData.rig
        });
        // 2. Kero - O Sapo das Neves (Sapo Cururu Verde saltitante)
        const kero = this.createDetailedFrog();
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
            footL: kero.children[1],
            footR: kero.children[2],
            torso: kero.children[0],
            armL: kero.children[0].children[3],
            armR: kero.children[0].children[4],
            tail: null,
            state: 'walking',
            reactionTimer: 0,
            yVel: 0,
            rig: kero.userData.rig
        });
        // 3. Mimi - A Gatinha Siamesa Elegante
        const mimi = this.createDetailedCat();
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
            footL: mimi.children[1],
            footR: mimi.children[2],
            torso: mimi.children[0],
            armL: mimi.children[0].children[3],
            armR: mimi.children[0].children[4],
            tail: mimi.children[0].children[5],
            state: 'walking',
            reactionTimer: 0,
            yVel: 0,
            rig: mimi.userData.rig
        });
        // 4. Toby - O Cachorrinho Shih Tzu Aventureiro
        const toby = this.createDetailedDog();
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
            footL: toby.children[1],
            footR: toby.children[2],
            torso: toby.children[0],
            armL: toby.children[0].children[3],
            armR: toby.children[0].children[4],
            tail: toby.children[0].children[5],
            state: 'walking',
            reactionTimer: 0,
            yVel: 0,
            rig: toby.userData.rig
        });
        // Restaura o playerRig para que a criação de NPCs não sobrescreva os membros do jogador
        if (this.playerRig) {
            this.charTorso = this.playerRig.torso;
            this.charHead = this.playerRig.head;
            this.charArmL = this.playerRig.armL;
            this.charArmR = this.playerRig.armR;
            this.charFootL = this.playerRig.footL;
            this.charFootR = this.playerRig.footR;
            this.charTail = this.playerRig.tail;
            this.charScarfTail = this.playerRig.scarfTail;
        }
    }
    updateWanderingNPCs() {
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
                    this.animateRigFlinch(npc.rig);
                }
                if (npc.reactionTimer <= 0) {
                    npc.state = 'walking';
                }
                continue;
            }
            const targetWp = npc.waypoints[npc.wpIndex];
            const dx = targetWp.x - npc.mesh.position.x;
            const dz = targetWp.z - npc.mesh.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 0.8) {
                npc.wpIndex = (npc.wpIndex + 1) % npc.waypoints.length;
            }
            else {
                const moveX = (dx / dist) * npc.speed;
                const moveZ = (dz / dist) * npc.speed;
                npc.mesh.position.x += moveX;
                npc.mesh.position.z += moveZ;
                const targetRotY = Math.atan2(moveX, moveZ);
                let diffRot = targetRotY - npc.mesh.rotation.y;
                while (diffRot > Math.PI)
                    diffRot -= Math.PI * 2;
                while (diffRot < -Math.PI)
                    diffRot += Math.PI * 2;
                npc.mesh.rotation.y += diffRot * 0.15;
                npc.walkTime += 0.18;
                if (npc.rig) {
                    this.animateRigWalk(npc.rig, npc.walkTime, false, false, 0, 0);
                }
                else if (npc.footL && npc.footR) {
                    const t = npc.walkTime;
                    npc.footL.position.z = Math.sin(t) * 0.22;
                    npc.footL.position.y = Math.max(0, Math.cos(t) * 0.12);
                    npc.footR.position.z = -Math.sin(t) * 0.22;
                    npc.footR.position.y = Math.max(0, -Math.cos(t) * 0.12);
                }
            }
        }
    }
    // =========================================================================
    // ARREMESSO DE BOLAS DE NEVE COM O BOTÃO ESQUERDO DO MOUSE
    // =========================================================================
    // =========================================================================
    // ARREMESSO DE BOLAS DE NEVE (FÍSICA BALÍSTICA SUAVE & CARGA DE FORÇA)
    // Quanto mais segurar, mais rápido e reto (trajetória laser/dardo)
    // =========================================================================
    throwSnowball(chargeRatio = 0.5) {
        if (this.currentScene !== 'HUB' && this.currentScene !== 'SNOWBALL_WAR')
            return;
        if (this.isAnyModalOpen())
            return;
        const now = Date.now();
        if (now - this.lastSnowballTime < 180)
            return;
        this.lastSnowballTime = now;
        const c = Math.max(0.15, Math.min(1.0, chargeRatio));
        // Aciona animação de follow-through esquelético do jogador
        this.throwAnimTimer = this.maxThrowAnimFrames;
        // Direção da mira da câmera
        const cosPitch = Math.cos(this.cameraAngleX);
        const sinPitch = Math.sin(this.cameraAngleX);
        const sinYaw = Math.sin(this.cameraAngleY);
        const cosYaw = Math.cos(this.cameraAngleY);
        // FÍSICA BALÍSTICA DINÂMICA (Calibrada para velocidade ideal e resposta tática agradável):
        // Mais carga = arremesso mais firme e reto; Pouca carga = arco parabólico suave (lob)
        const speed = 0.34 + c * 0.44; // 0.34 a 0.78 m/frame (excelente legibilidade e tempo de esquiva)
        const loft = (1.0 - c) * 0.11;
        const gravity = 0.009 - c * 0.0055;
        const vx = -sinYaw * cosPitch * speed;
        const vy = -sinPitch * speed + loft;
        const vz = -cosYaw * cosPitch * speed;
        const snowballGeo = new THREE.SphereGeometry(0.20 + c * 0.04, 10, 10);
        const snowballMat = new THREE.MeshStandardMaterial({
            color: c > 0.8 ? 0xffffff : 0xf8fafc,
            roughness: 0.82
        });
        const mesh = new THREE.Mesh(snowballGeo, snowballMat);
        // Posição de origem no ombro / mão direita
        const shoulderOffset = 0.42;
        const spawnX = this.playerPosX + Math.cos(this.cameraAngleY) * shoulderOffset;
        const spawnZ = this.playerPosZ - Math.sin(this.cameraAngleY) * shoulderOffset;
        mesh.position.set(spawnX, this.playerPosY + 1.25, spawnZ);
        mesh.castShadow = true;
        this.scene.add(mesh);
        this.snowballs.push({ mesh, vx, vy, vz, life: 0, isEnemy: false, gravity });
        this.playSnowThrowSound(c);
    }
    updateSnowballs() {
        for (let i = this.snowballs.length - 1; i >= 0; i--) {
            const sb = this.snowballs[i];
            sb.mesh.position.x += sb.vx;
            sb.mesh.position.y += sb.vy;
            sb.mesh.position.z += sb.vz;
            sb.vy -= sb.gravity; // Gravidade balística proporcional à carga!
            sb.vx *= 0.996; // Arrasto aerodinâmico suave
            sb.vz *= 0.996;
            sb.life++;
            sb.mesh.rotation.x += 0.15;
            sb.mesh.rotation.z += 0.15;
            let splat = false;
            let isCharHit = false;
            // Colisão com o chão
            if (sb.mesh.position.y <= 0.1) {
                splat = true;
            }
            // Colisão no HUB
            if (this.currentScene === 'HUB' && !splat) {
                // Colisão com os NPCs que circulam
                for (const npc of this.wanderingNPCs) {
                    const distNpc = sb.mesh.position.distanceTo(npc.mesh.position);
                    if (distNpc < 1.15) {
                        splat = true;
                        isCharHit = true;
                        npc.state = 'hit';
                        npc.reactionTimer = 45;
                        npc.yVel = 0.22;
                        this.showToast(`Você acertou uma bola de neve no ${npc.name}! ❄️`, 'info');
                        break;
                    }
                }
                // Colisão com o Boneco de Neve
                if (!splat) {
                    const distSnowman = sb.mesh.position.distanceTo(new THREE.Vector3(-12, 1.8, 8));
                    if (distSnowman < 1.6) {
                        splat = true;
                        isCharHit = true;
                        this.showToast('Você acertou em cheio o Boneco de Neve! ⛄❄️', 'success');
                    }
                }
            }
            // Colisão na ARENA DE GUERRA DE NEVE
            if (this.currentScene === 'SNOWBALL_WAR' && !splat) {
                // Colisão com muretas e obstáculos do labirinto
                for (const obs of this.warObstacles) {
                    if (Math.abs(sb.mesh.position.x - obs.x) < obs.hw + 0.15 &&
                        Math.abs(sb.mesh.position.z - obs.z) < obs.hd + 0.15 &&
                        sb.mesh.position.y < obs.height) {
                        splat = true;
                        break;
                    }
                }
                // Bola do jogador acertando bot adversário
                if (!splat && !sb.isEnemy) {
                    for (const bot of this.warBots) {
                        if (bot.health > 0 && bot.state !== 'frozen') {
                            const distBot = sb.mesh.position.distanceTo(new THREE.Vector3(bot.pos.x, bot.pos.y + 0.8, bot.pos.z));
                            if (distBot < 1.25) {
                                splat = true;
                                isCharHit = true;
                                bot.health--;
                                bot.hitTimer = 18;
                                this.warHits++;
                                this.warScore += 50;
                                bot.stateTimer = 20;
                                if (bot.health <= 0) {
                                    bot.health = 0;
                                    bot.state = 'frozen';
                                    bot.stateTimer = 180; // Congelado por 3s
                                    this.warKOs++;
                                    this.warScore += 200;
                                    // Cria bloco de gelo ao redor do bot
                                    const iceGeo = new THREE.BoxGeometry(1.6, 2.2, 1.6);
                                    const iceMat = new THREE.MeshStandardMaterial({
                                        color: 0x38bdf8,
                                        transparent: true,
                                        opacity: 0.75,
                                        roughness: 0.1,
                                        metalness: 0.3
                                    });
                                    const iceCube = new THREE.Mesh(iceGeo, iceMat);
                                    iceCube.position.set(bot.pos.x, 1.1, bot.pos.z);
                                    this.scene.add(iceCube);
                                    bot.iceCube = iceCube;
                                    this.showToast(`❄️ KO! Você congelou ${bot.name}! (+200 pts)`, 'success');
                                }
                                else {
                                    this.showToast(`Acertou ${bot.name}! (${bot.health}/3 vidas) ❄️`, 'info');
                                }
                                // Atualiza HUD da arena
                                const kosEl = document.getElementById('war-kos-val');
                                if (kosEl)
                                    kosEl.textContent = this.warKOs.toString();
                                const scoreEl = document.getElementById('war-score-val');
                                if (scoreEl)
                                    scoreEl.textContent = this.warScore.toString();
                                break;
                            }
                        }
                    }
                }
                // Bola inimiga acertando o jogador
                if (!splat && sb.isEnemy) {
                    const playerHeadPos = new THREE.Vector3(this.playerPosX, this.playerPosY + 0.85, this.playerPosZ);
                    if (sb.mesh.position.distanceTo(playerHeadPos) < 1.15 && !this.isPlayerWarInvuln) {
                        splat = true;
                        isCharHit = true;
                        this.warPlayerHealth--;
                        this.isPlayerWarInvuln = true;
                        this.playerWarInvulnTimer = 90; // 1.5s invulnerável
                        this.updateWarHUDHearts();
                        this.showToast(`Você foi atingido! Vidas restantes: ${this.warPlayerHealth}/3 ❤️`, 'warning');
                        if (this.warPlayerHealth <= 0) {
                            this.warPlayerHealth = 3;
                            this.updateWarHUDHearts();
                            this.playerPosX = -22;
                            this.playerPosZ = -22;
                            this.showToast('Você foi congelado e renasceu no bunker inicial!', 'warning');
                        }
                    }
                }
            }
            // Tempo de vida máximo (140 frames)
            if (sb.life > 140) {
                splat = true;
            }
            if (splat) {
                this.emitSnowballDisintegration(sb.mesh.position.x, sb.mesh.position.y, sb.mesh.position.z, isCharHit);
                this.playSnowSplatSound();
                this.scene.remove(sb.mesh);
                this.snowballs.splice(i, 1);
            }
        }
    }
    updateWarHUDHearts() {
        const heartsEl = document.getElementById('war-hearts');
        if (!heartsEl)
            return;
        let hStr = '';
        for (let i = 0; i < 3; i++) {
            hStr += i < this.warPlayerHealth ? '❤️' : '🖤';
        }
        heartsEl.textContent = hStr;
    }
    // =========================================================================
    // CENÁRIO: CHALÉS AMPLOS, LOJAS SEGMENTADAS, CABINE TELEFÔNICA & BONDINHO
    // =========================================================================
    // Construtor Modular de Chalés Amplos e Acessíveis (Walk-in Lodges)
    createWalkInLodge(centerX, centerZ, width, depth, wallColor, roofColor, signText, shopType, rotY = 0) {
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
        // Piso interior em tábuas de pinho alpino
        const floor = new THREE.Mesh(new THREE.BoxGeometry(width - 0.2, 0.35, depth - 0.2), floorMat);
        floor.position.set(0, 0.175, 0);
        floor.receiveShadow = true;
        lodge.add(floor);
        // Deck de entrada / varanda frontal acolhedora
        const porch = new THREE.Mesh(new THREE.BoxGeometry(doorWidth + 2.0, 0.3, 2.8), floorMat);
        porch.position.set(0, 0.15, depth * 0.5 + 1.4);
        porch.receiveShadow = true;
        lodge.add(porch);
        // Paredes principais
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
        // Parede frontal segmentada com pórtico de passagem amplo (6.4m de abertura)
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
        // Toldo / Cobertura frontal da entrada
        const canopy = new THREE.Mesh(new THREE.BoxGeometry(doorWidth + 1.2, 0.35, 2.6), roofMat);
        canopy.position.set(0, doorHeight + 0.3, depth * 0.5 + 1.1);
        canopy.rotation.x = 0.18;
        const canopySnow = new THREE.Mesh(new THREE.BoxGeometry(doorWidth + 1.4, 0.25, 2.8), snowMat);
        canopySnow.position.set(0, doorHeight + 0.55, depth * 0.5 + 1.1);
        canopySnow.rotation.x = 0.18;
        lodge.add(canopy, canopySnow);
        // Placa entalhada de boas-vindas na fachada frontal
        const facadeBoard = new THREE.Mesh(new THREE.BoxGeometry(doorWidth - 1.2, 1.1, 0.18), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 }));
        facadeBoard.position.set(0, doorHeight + 1.4, depth * 0.5 + 0.12);
        const facadeBoardTrim = new THREE.Mesh(new THREE.BoxGeometry(doorWidth - 1.0, 1.25, 0.12), goldMat);
        facadeBoardTrim.position.set(0, doorHeight + 1.4, depth * 0.5 + 0.08);
        lodge.add(facadeBoard, facadeBoardTrim);
        // Telhado monumental em estilo alpino com espessa camada de neve
        const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, depth) * 0.82, 6.4, 4), roofMat);
        roof.position.y = wallHeight + 3.1;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        const snowCap = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, depth) * 0.86, 2.0, 4), snowMat);
        snowCap.position.y = wallHeight + 4.1;
        snowCap.rotation.y = Math.PI / 4;
        lodge.add(roof, snowCap);
        // Iluminação aconchegante interior
        const chandelierLight = new THREE.PointLight(0xfef08a, 2.2, 26);
        chandelierLight.position.set(0, 6.8, 0);
        lodge.add(chandelierLight);
        // Balcão de atendimento e interações (para garagens e boutiques)
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
            // Tapete/passarela de borracha e metal no centro
            const runnerMat = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.04, depth - 4.0), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 }));
            runnerMat.position.set(0, 0.20, 1.0);
            lodge.add(runnerMat);
            // Bancada de trabalho pesada do mecânico (lado esquerdo)
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
            // Painel de ferramentas perfurado na parede esquerda
            const pegboard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 4.2), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 }));
            pegboard.position.set(-width * 0.5 + 0.48, 3.4, 0.5);
            lodge.add(pegboard);
            // Racks de Snowboards e Trenós na parede direita
            const boardColors = [0x06b6d4, 0xf97316, 0xa855f7, 0xfacc15];
            for (let i = 0; i < 4; i++) {
                const sb = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 0.5), new THREE.MeshStandardMaterial({ color: boardColors[i], metalness: 0.5, roughness: 0.2 }));
                sb.position.set(width * 0.5 - 0.55, 2.8, -3.0 + i * 2.2);
                sb.rotation.z = 0.18;
                sb.rotation.x = -0.15 + i * 0.1;
                lodge.add(sb);
            }
            // Tambores de óleo e caixas de madeira empilhadas nos cantos
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
            // Ralph, o Mestre Mecânico
            this.npcRalph = this.createMerchantRalph();
            this.npcRalph.position.set(0, 0.175, -4.5);
            lodge.add(this.npcRalph);
        }
        else if (shopType === 'hats') {
            // Tapete nobre vermelho imperial com frisos dourados
            const redCarpet = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.05, depth - 2.5), new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 }));
            redCarpet.position.set(0, 0.20, 1.0);
            const goldTrimL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, depth - 2.5), goldMat);
            goldTrimL.position.set(-2.0, 0.21, 1.0);
            const goldTrimR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, depth - 2.5), goldMat);
            goldTrimR.position.set(2.0, 0.21, 1.0);
            lodge.add(redCarpet, goldTrimL, goldTrimR);
            // 3 Pedestais de luxo com chapéus em exibição
            // Pedestal 1: Coroa Real Dourada
            const ped1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.4, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
            ped1.position.set(-4.5, 0.7, 0.5);
            const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.4, 8), goldMat);
            crown.position.set(-4.5, 1.6, 0.5);
            lodge.add(ped1, crown);
            // Pedestal 2: Cartola Vitoriana Elegante
            const ped2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.4, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
            ped2.position.set(-4.5, 0.7, 3.8);
            const topHat = new THREE.Group();
            const thBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.06, 16), ironMat);
            const thCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.55, 16), ironMat);
            thCrown.position.y = 0.28;
            topHat.add(thBrim, thCrown);
            topHat.position.set(-4.5, 1.5, 3.8);
            lodge.add(ped2, topHat);
            // Pedestal 3: Gorro de Inverno Felpudo
            const ped3 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.4, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
            ped3.position.set(4.5, 0.7, 3.8);
            const beanie = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
            beanie.position.set(4.5, 1.6, 3.8);
            lodge.add(ped3, beanie);
            // Arara e guarda-roupa de casacos de pele de inverno
            const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.8, 3.4), new THREE.MeshStandardMaterial({ color: 0x4c0519, roughness: 0.7 }));
            wardrobe.position.set(width * 0.5 - 1.2, 1.9, 0.5);
            lodge.add(wardrobe);
            // Espelho dourado de corpo inteiro na parede esquerda
            const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.6, 1.8), goldMat);
            mirrorFrame.position.set(-width * 0.5 + 0.48, 2.5, -2.5);
            const mirrorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.2, 1.4), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.05 }));
            mirrorGlass.position.set(-width * 0.5 + 0.48, 2.5, -2.5);
            lodge.add(mirrorFrame, mirrorGlass);
            // Babette, a Estilista de Alta Moda
            this.npcBabette = this.createMerchantBabette();
            this.npcBabette.position.set(0, 0.175, -4.5);
            lodge.add(this.npcBabette);
        }
        else if (shopType === 'atelier') {
            // Tapete de lã entrelaçado com design alpino
            const woolRug = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.04, 6.0), new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.85 }));
            woolRug.position.set(0, 0.20, 1.5);
            lodge.add(woolRug);
            // Mesa de alfaiataria com cortes de tecidos e tesouras de latão
            const tailorTable = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.25, 4.0), new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.75 }));
            tailorTable.position.set(-width * 0.5 + 1.2, 0.625, 1.5);
            const fabricRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.4, 12), new THREE.MeshStandardMaterial({ color: 0x059669 }));
            fabricRoll.rotation.z = Math.PI / 2;
            fabricRoll.position.set(-width * 0.5 + 1.2, 1.35, 1.0);
            const shears = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.5), goldMat);
            shears.position.set(-width * 0.5 + 1.2, 1.28, 2.4);
            shears.rotation.y = 0.6;
            lodge.add(tailorTable, fabricRoll, shears);
            // Prateleiras repletas de novelos de lã coloridos
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
            // 2 Vitrines modernas para óculos de neve translúcidos
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
            // Lareira rústica de ferro fundido com chaleira no canto
            const stove = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 1.4, 10), ironMat);
            stove.position.set(width * 0.5 - 1.6, 0.7, -4.2);
            const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, wallHeight - 1.4, 8), ironMat);
            pipe.position.set(width * 0.5 - 1.6, 0.7 + (wallHeight - 1.4) * 0.5, -4.2);
            const stoveGlow = new THREE.PointLight(0xf97316, 2.0, 8);
            stoveGlow.position.set(width * 0.5 - 1.6, 0.8, -3.8);
            lodge.add(stove, pipe, stoveGlow);
            // Boris, o Mestre Alfaiate
            this.npcBoris = this.createMerchantBoris();
            this.npcBoris.position.set(0, 0.175, -4.5);
            lodge.add(this.npcBoris);
        }
        else if (shopType === 'tavern') {
            // Tapete de couro rústico no centro
            const tavernRug = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.04, 8.0), new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 }));
            tavernRug.position.set(0, 0.20, 1.0);
            lodge.add(tavernRug);
            // Monumental Lareira de Pedra na parede direita
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
            // Mural de Recordes & Hall da Fama no fundo
            const boardW = 9.2;
            const boardH = 4.2;
            const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(boardW + 0.4, boardH + 0.4, 0.18), goldMat);
            boardFrame.position.set(0, 4.5, -depth * 0.5 + 0.35);
            // Canvas em alta resolução do quadro de recordes da taverna
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
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
            // 2 Armários de Troféus com Taças Reluzentes
            for (const side of [-1, 1]) {
                const cabinet = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4.2, 0.9), new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 }));
                cabinet.position.set(side * 6.8, 2.1, -depth * 0.5 + 0.8);
                const glass = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.8, 0.1), glassMat);
                glass.position.set(side * 6.8, 2.1, -depth * 0.5 + 1.28);
                const trophy = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.15, 0.9, 12), goldMat);
                trophy.position.set(side * 6.8, 2.2, -depth * 0.5 + 0.8);
                lodge.add(cabinet, glass, trophy);
            }
            // Mesas e bancos da taverna
            for (const [tx, tz] of [[-4.2, 1.8], [-4.2, -2.4]]) {
                const table = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.14, 16), woodMat);
                table.position.set(tx, 1.15, tz);
                const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.1, 8), woodMat);
                tableLeg.position.set(tx, 0.55, tz);
                const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.35, 8), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
                mug.position.set(tx + 0.2, 1.35, tz + 0.1);
                lodge.add(table, tableLeg, mug);
                // 3 Barstools por mesa
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
        // Helper para adicionar colisores de caixa locais rotacionados para o mundo
        const addRotatedCollider = (localX, localZ, hw, hd) => {
            const cosA = Math.cos(rotY);
            const sinA = Math.sin(rotY);
            const worldX = centerX + (localX * cosA + localZ * sinA);
            const worldZ = centerZ + (-localX * sinA + localZ * cosA);
            this.hubColliders.push({
                type: 'box',
                x: worldX,
                z: worldZ,
                hw,
                hd,
                angle: rotY
            });
        };
        // 1. Parede do fundo
        addRotatedCollider(0, -depth * 0.5 + wallThickness * 0.5, width * 0.5, wallThickness * 0.5);
        // 2. Parede esquerda
        addRotatedCollider(-width * 0.5 + wallThickness * 0.5, 0, wallThickness * 0.5, depth * 0.5);
        // 3. Parede direita
        addRotatedCollider(width * 0.5 - wallThickness * 0.5, 0, wallThickness * 0.5, depth * 0.5);
        // 4. Parede frontal esquerda
        addRotatedCollider(-doorWidth * 0.5 - frontSegmentWidth * 0.5, depth * 0.5 - wallThickness * 0.5, frontSegmentWidth * 0.5, wallThickness * 0.5);
        // 5. Parede frontal direita
        addRotatedCollider(doorWidth * 0.5 + frontSegmentWidth * 0.5, depth * 0.5 - wallThickness * 0.5, frontSegmentWidth * 0.5, wallThickness * 0.5);
        // 6. Colisores interiores específicos
        if (shopType !== 'tavern') {
            // Balcão
            addRotatedCollider(0, -2.5, 3.1, 0.6);
        }
        else {
            // Lareira de pedra
            addRotatedCollider(width * 0.5 - 1.4, 0, 1.2, 2.4);
            // Mesas redondas da taverna
            const cosA = Math.cos(rotY);
            const sinA = Math.sin(rotY);
            for (const [tx, tz] of [[-4.2, 1.8], [-4.2, -2.4]]) {
                const wx = centerX + (tx * cosA + tz * sinA);
                const wz = centerZ + (-tx * sinA + tz * cosA);
                this.hubColliders.push({ type: 'circle', x: wx, z: wz, r: 1.4 });
            }
        }
        return lodge;
    }
    createMerchantRalph() {
        const ralph = this.createDetailedPenguin();
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.6), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
        cap.position.set(0, 1.5, 0.1);
        ralph.add(cap);
        return ralph;
    }
    createMerchantBabette() {
        const babette = this.createDetailedCat();
        const bow = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({ color: 0xec4899 }));
        bow.position.set(0.2, 1.5, 0.1);
        babette.add(bow);
        return babette;
    }
    createMerchantBoris() {
        const boris = this.createDetailedDog();
        const tape = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.05, 6, 16), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
        tape.rotation.x = Math.PI / 3;
        tape.position.y = 0.8;
        boris.add(tape);
        return boris;
    }
    createPhoneBooth(x, z) {
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
        this.hubColliders.push({
            type: 'box',
            x,
            z,
            hw: width * 0.55,
            hd: depth * 0.55,
            angle: 0
        });
        return booth;
    }
    // Estande de Tiro ao Alvo do Festival (Circo Alpino Monumental)
    createCarnivalBooth(x, z, rotY = 0) {
        const booth = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 });
        const redCanvasMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 });
        const whiteCanvasMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
        // Plataforma do chão da barraca expandida
        const floor = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.45, 7.5), woodMat);
        floor.position.y = 0.225;
        floor.receiveShadow = true;
        booth.add(floor);
        // Balcão de atendimento frontal
        const counter = new THREE.Mesh(new THREE.BoxGeometry(11.0, 1.35, 1.0), woodMat);
        counter.position.set(0, 0.95, -2.8);
        counter.castShadow = true;
        const counterTop = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.15, 1.2), goldMat);
        counterTop.position.set(0, 1.65, -2.8);
        booth.add(counter, counterTop);
        // Suporte para espingardas de brinquedo no balcão
        for (const rx of [-3.6, -1.8, 0, 1.8, 3.6]) {
            const rack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.65), woodMat);
            rack.position.set(rx, 1.8, -2.8);
            const rifleBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), goldMat);
            rifleBarrel.rotation.x = Math.PI / 2;
            rifleBarrel.position.set(rx, 1.95, -2.7);
            booth.add(rack, rifleBarrel);
        }
        // 6 Pilares de sustentação
        for (const [px, pz] of [[-5.5, -3.2], [0, -3.2], [5.5, -3.2], [-5.5, 3.2], [0, 3.2], [5.5, 3.2]]) {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 5.2, 8), woodMat);
            post.position.set(px, 2.8, pz);
            post.castShadow = true;
            booth.add(post);
        }
        // Teto listrado de circo/festival (listras alternadas vermelho e branco)
        const stripeCount = 14;
        const stripeWidth = 12.6 / stripeCount;
        for (let i = 0; i < stripeCount; i++) {
            const isRed = i % 2 === 0;
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(stripeWidth, 0.28, 8.0), isRed ? redCanvasMat : whiteCanvasMat);
            stripe.position.set(-6.3 + stripeWidth * (i + 0.5), 5.4, 0);
            stripe.rotation.x = 0.12;
            stripe.castShadow = true;
            booth.add(stripe);
        }
        // Toldo frontal com babados (scalloped fringe)
        for (let i = 0; i < stripeCount; i++) {
            const fringe = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.7, 4), (i % 2 === 0) ? redCanvasMat : whiteCanvasMat);
            fringe.rotation.x = Math.PI;
            fringe.position.set(-6.3 + stripeWidth * (i + 0.5), 4.9, -3.95);
            booth.add(fringe);
        }
        // Prateleiras de exposição no fundo com alvos decorativos e prêmios de pelúcia
        for (let s = 1; s <= 3; s++) {
            const shelf = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.15, 0.7), woodMat);
            shelf.position.set(0, 1.2 + s * 1.0, 3.0);
            booth.add(shelf);
            // Patinhos decorativos e troféus de pelúcia na prateleira
            for (let d = -4.2; d <= 4.2; d += 1.8) {
                const duckDeco = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), goldMat);
                duckDeco.position.set(d, 1.5 + s * 1.0, 3.0);
                booth.add(duckDeco);
            }
        }
        // Lanterna festiva com iluminação âmbar de parque
        const light = new THREE.PointLight(0xf59e0b, 2.5, 18);
        light.position.set(0, 4.5, 0);
        booth.add(light);
        booth.position.set(x, 0, z);
        booth.rotation.y = rotY;
        return booth;
    }
    // Portal Monumental da Arena de Guerra de Neve (Fortaleza Ártica)
    createSnowballWarPortal(x, z, rotY = 0) {
        const portal = new THREE.Group();
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
        const iceMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.85 });
        const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.95 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
        // Pilares de pedra/gelo do portal (fortaleza ártica imponente)
        for (const side of [-1, 1]) {
            const pilar = new THREE.Mesh(new THREE.BoxGeometry(2.6, 9.0, 2.6), stoneMat);
            pilar.position.set(side * 4.6, 4.5, 0);
            pilar.castShadow = true;
            // Cristas de gelo translúcido no topo das torres
            const iceCap = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.8, 6), iceMat);
            iceCap.position.set(side * 4.6, 10.4, 0);
            // Tochas de fogo azul polar
            const torchHolder = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.0, 6), woodMat);
            torchHolder.position.set(side * 3.2, 4.5, 1.4);
            torchHolder.rotation.x = 0.4;
            const torchFlame = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
            torchFlame.position.set(side * 3.2, 5.1, 1.7);
            const torchLight = new THREE.PointLight(0x38bdf8, 2.2, 14);
            torchLight.position.copy(torchFlame.position);
            portal.add(pilar, iceCap, torchHolder, torchFlame, torchLight);
        }
        // Arco de gelo superior
        const arch = new THREE.Mesh(new THREE.BoxGeometry(11.8, 1.6, 2.8), stoneMat);
        arch.position.set(0, 8.4, 0);
        const archIce = new THREE.Mesh(new THREE.BoxGeometry(11.0, 1.0, 3.0), iceMat);
        archIce.position.set(0, 9.4, 0);
        const snowCap = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.8, 3.2), snowMat);
        snowCap.position.set(0, 10.1, 0);
        // Estandartes da arena de batalha
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
    createCableCarBaseStation() {
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
        station.position.copy(this.cableCarStationPos);
        return station;
    }
    createBonfire() {
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
        this.bonfireLight = new THREE.PointLight(0xf97316, 2.8, 26);
        this.bonfireLight.position.set(0, 1.2, 0);
        this.bonfireLight.castShadow = true;
        group.add(this.bonfireLight);
        const emberCount = 35;
        const emberGeo = new THREE.BufferGeometry();
        const pos = new Float32Array(emberCount * 3);
        for (let i = 0; i < emberCount * 3; i++)
            pos[i] = 0;
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
                vy: 0.04 + Math.random() * 0.03,
                vz: (Math.random() - 0.5) * 0.02,
                life: Math.floor(Math.random() * 30)
            });
        }
        group.add(this.bonfireEmbers);
        group.position.set(-2, 0, 0);
        return group;
    }
    createSnowman() {
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
    createStreetLamp(x, z) {
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
    createSnowyPineTree() {
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
    createRusticFence(x, z, rotY, length) {
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
    createMountainPeak(radius, height) {
        const geo = new THREE.ConeGeometry(radius, height, 10);
        const mat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.95, flatShading: true });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = height / 2;
        return mesh;
    }
    createSnowyRock() {
        const geo = new THREE.DodecahedronGeometry(1.4, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
        const rock = new THREE.Mesh(geo, mat);
        rock.position.y = 0.9;
        rock.castShadow = true;
        rock.receiveShadow = true;
        return rock;
    }
    createSlalomGate(colorHex) {
        const group = new THREE.Group();
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
    createSnowRamp() {
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
    createFinishLineArch() {
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
    // =========================================================================
    // RESOLUÇÃO DE COLISÕES NO HUB (CÍRCULOS & CAIXAS ORIENTADAS)
    // =========================================================================
    resolveHubCollisions(px, pz, playerRadius = 0.85) {
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
                        }
                        else {
                            resX += minDist;
                        }
                    }
                }
                else if (col.type === 'box') {
                    const dx = resX - col.x;
                    const dz = resZ - col.z;
                    const cosA = Math.cos(col.angle);
                    const sinA = Math.sin(col.angle);
                    // Transformada inversa correta (mundo para local do colisor)
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
                        }
                        else {
                            const distLeft = localX - (-col.hw);
                            const distRight = col.hw - localX;
                            const distTop = localZ - (-col.hd);
                            const distBottom = col.hd - localZ;
                            const minD = Math.min(distLeft, distRight, distTop, distBottom);
                            if (minD === distLeft)
                                pushLocalX = -(distLeft + playerRadius);
                            else if (minD === distRight)
                                pushLocalX = (distRight + playerRadius);
                            else if (minD === distTop)
                                pushLocalZ = -(distTop + playerRadius);
                            else
                                pushLocalZ = (distBottom + playerRadius);
                        }
                        // Transformada direta correta (local para mundo)
                        const worldPushX = pushLocalX * cosA + pushLocalZ * sinA;
                        const worldPushZ = -pushLocalX * sinA + pushLocalZ * cosA;
                        resX += worldPushX;
                        resZ += worldPushZ;
                    }
                }
            }
        }
        const maxBound = 74;
        resX = Math.max(-maxBound, Math.min(maxBound, resX));
        resZ = Math.max(-maxBound, Math.min(maxBound, resZ));
        return { x: resX, z: resZ };
    }
    // =========================================================================
    // CARREGAMENTO DE CENAS: HUB & CORRIDA
    // =========================================================================
    initEngine() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xbae6fd);
        this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.005);
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('app').appendChild(this.renderer.domElement);
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
        this.createSnowballBurstSystem();
        this.setupUIAndControls();
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        this.loop();
    }
    loadHubScene() {
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
        this.createSnowballBurstSystem();
        this.clearAllSkidMarks();
        this.confettiPoints = null;
        this.snowballs = [];
        this.isSitting = false;
        this.currentBench = null;
        this.benches = [];
        // Solo da Praça da Vila Alpina Expandida (500m x 500m)
        const groundGeo = new THREE.PlaneGeometry(500, 500, 32, 32);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.hubColliders = [];
        // 1. Estação do Bondinho (Teleférico com embarque para a Corrida de Descida)
        this.scene.add(this.createCableCarBaseStation());
        const csX = this.cableCarStationPos.x;
        const csZ = this.cableCarStationPos.z;
        this.hubColliders.push({ type: 'box', x: csX, z: csZ - 2.5, hw: 8.5, hd: 4.0, angle: 0 });
        this.hubColliders.push({ type: 'box', x: csX - 8.2, z: csZ + 2.5, hw: 0.8, hd: 2.8, angle: 0 });
        this.hubColliders.push({ type: 'box', x: csX + 8.2, z: csZ + 2.5, hw: 0.8, hd: 2.8, angle: 0 });
        this.hubColliders.push({ type: 'circle', x: csX, z: csZ - 1.0, r: 1.2 });
        // Placa 3D Informativa do Bondinho / Corrida de Descida
        this.scene.add(this.createTextSignboard(28, -30, -Math.PI / 4, '🚠 TELEFÉRICO DA MONTANHA', '🏔️ EMBARQUE PARA A CORRIDA DE DESCIDA', '#38bdf8'));
        // 2. Fogueira acolhedora central
        this.scene.add(this.createBonfire());
        this.hubColliders.push({ type: 'circle', x: 0, z: 0, r: 2.4 });
        // 3. Boneco de Neve
        this.scene.add(this.createSnowman());
        this.hubColliders.push({ type: 'circle', x: -8, z: 10, r: 1.5 });
        // 4. Cabine Telefônica Mágica (Troca de Personagem) com Placa
        this.scene.add(this.createPhoneBooth(this.phoneBoothPos.x, this.phoneBoothPos.z));
        this.scene.add(this.createTextSignboard(14, -5, 0, '📞 CABINE MÁGICA', '✨ METAMORFOSE DE PERSONAGEM', '#ef4444'));
        // 5. Chalé 1: Garagem Alpina (Trenós & Snowboards) com Placa Externa
        const garage = this.createWalkInLodge(this.garagePos.x, this.garagePos.z, 18, 15, 0x5c3317, 0xd97706, 'GARAGEM ALPINA', 'garage', 0);
        this.scene.add(garage);
        this.scene.add(this.createTextSignboard(-33, -18, -0.2, '🛠️ GARAGEM ALPINA', '🛷 TRENÓS & SNOWBOARDS VELOZES', '#f59e0b'));
        // 6. Chalé 2: Boutique dos Gorros (Chapéus & Coroas) com Placa Externa
        const hatShop = this.createWalkInLodge(this.hatShopPos.x, this.hatShopPos.z, 18, 15, 0x7c2d12, 0xdb2777, 'BOUTIQUE DOS GORROS', 'hats', Math.PI);
        this.scene.add(hatShop);
        this.scene.add(this.createTextSignboard(-33, 24, Math.PI, '🎩 BOUTIQUE DOS GORROS', '👑 GORROS, CARTOLAS & COROAS', '#ec4899'));
        // 7. Chalé 3: Ateliê da Montanha (Cachecóis & Óculos) com Placa Externa
        const atelier = this.createWalkInLodge(this.atelierPos.x, this.atelierPos.z, 18, 15, 0x4d7c0f, 0x059669, 'ATELIÊ DA MONTANHA', 'atelier', Math.PI);
        this.scene.add(atelier);
        this.scene.add(this.createTextSignboard(12, 30, Math.PI, '🧣 ATELIÊ DA MONTANHA', '🥽 CACHECÓIS MACIOS & ÓCULOS', '#10b981'));
        // 8. Chalé 4: Taverna dos Campeões (Salão de Recordes) com Placa Externa
        const tavern = this.createWalkInLodge(this.tavernPos.x, this.tavernPos.z, 20, 16, 0x78350f, 0x2563eb, 'TAVERNA DOS CAMPEÕES', 'tavern', -Math.PI / 2);
        this.scene.add(tavern);
        this.scene.add(this.createTextSignboard(31, 16, -Math.PI / 2, '🏆 TAVERNA DOS CAMPEÕES', '🌟 SALÃO DE RECORDES & HALL DA FAMA', '#eab308'));
        // 9. Bancos de Madeira Rústicos na Praça (Onde é possível sentar ao redor da fogueira)
        this.scene.add(this.createWoodenParkBench(0, -7, 0)); // Ao norte da fogueira
        this.scene.add(this.createWoodenParkBench(0, 7, Math.PI)); // Ao sul da fogueira
        this.scene.add(this.createWoodenParkBench(-7, 0, Math.PI / 2)); // A oeste da fogueira
        this.scene.add(this.createWoodenParkBench(7, 0, -Math.PI / 2)); // A leste da fogueira
        // 10. Spawn dos NPCs Autônomos Circulando pelo Vilarejo
        this.spawnWanderingNPCs();
        // 11. Postes de iluminação da praça e caminhos
        const lampPositions = [
            [-9, -9],
            [9, -9],
            [-9, 9],
            [9, 9],
            [22, -22],
            [24, 2],
            [6, 20],
            [-22, 16],
            [-20, -14]
        ];
        for (const [lx, lz] of lampPositions) {
            this.scene.add(this.createStreetLamp(lx, lz));
            this.hubColliders.push({ type: 'circle', x: lx, z: lz, r: 0.5 });
        }
        // 12. Pinheiros decorativos externos e entre as alas da vila
        const innerTrees = [
            [-48, -10],
            [-48, 24],
            [-16, 48],
            [-6, 52],
            [34, 42],
            [56, 2],
            [54, -28],
            [-20, -55],
            [0, -58],
            [20, -56]
        ];
        for (const [tx, tz] of innerTrees) {
            const tree = this.createSnowyPineTree();
            tree.position.set(tx, 0, tz);
            tree.scale.setScalar(1.2);
            this.scene.add(tree);
            this.hubColliders.push({ type: 'circle', x: tx, z: tz, r: 1.1 });
        }
        // 13. Cercas delimitadoras da vila alpina expandida
        const fences = [
            { x: 0, z: -75, rot: 0, len: 150 },
            { x: 0, z: 75, rot: 0, len: 150 },
            { x: -75, z: 0, rot: Math.PI / 2, len: 150 },
            { x: 75, z: 0, rot: Math.PI / 2, len: 150 }
        ];
        for (const f of fences) {
            this.scene.add(this.createRusticFence(f.x, f.z, f.rot, f.len));
        }
        // 14. Montanhas no horizonte
        for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            const p = this.createMountainPeak(70 + Math.random() * 25, 110 + Math.random() * 50);
            p.position.set(Math.cos(ang) * 220, 0, Math.sin(ang) * 220);
            this.scene.add(p);
        }
        // 15. Estande de Tiro ao Alvo do Festival (Circo Alpino Monumental)
        this.scene.add(this.createCarnivalBooth(this.carnivalBoothPos.x, this.carnivalBoothPos.z, Math.PI / 2));
        this.scene.add(this.createTextSignboard(31, -12, -Math.PI / 2, '🎯 TIRO AO ALVO FESTIVO', '🎪 PATINHOS, PRÊMIOS & DIVERSÃO', '#f43f5e'));
        this.hubColliders.push({
            type: 'box',
            x: this.carnivalBoothPos.x,
            z: this.carnivalBoothPos.z,
            hw: 6.0,
            hd: 3.8,
            angle: Math.PI / 2
        });
        // 16. Portal Monumental da Arena de Guerra de Neve (Fortaleza Ártica)
        this.scene.add(this.createSnowballWarPortal(this.snowballWarPortalPos.x, this.snowballWarPortalPos.z, Math.PI / 2));
        this.scene.add(this.createTextSignboard(-42, 8, -Math.PI / 2, '❄️ ARENA GUERRA DE NEVE', '⚔️ FORTES, TRINCHEIRAS & LABIRINTO', '#06b6d4'));
        this.hubColliders.push({
            type: 'box',
            x: this.snowballWarPortalPos.x,
            z: this.snowballWarPortalPos.z,
            hw: 6.0,
            hd: 1.6,
            angle: Math.PI / 2
        });
        // RESET TOTAL DO JOGADOR NO HUB
        this.playerPosX = 0;
        this.playerPosZ = 0;
        this.playerPosY = 0;
        this.playerVelX = 0;
        this.playerVelZ = 0;
        this.isJumping = false;
        this.jumpVelY = 0;
        this.nearCableCar = false;
        this.nearGarage = false;
        this.nearHatShop = false;
        this.nearAtelier = false;
        this.nearRecords = false;
        this.nearPhoneBooth = false;
        this.nearCarnivalBooth = false;
        this.nearSnowballWarPortal = false;
        this.nearBench = null;
        if (this.shootingTimer)
            clearInterval(this.shootingTimer);
        if (this.warTimer)
            clearInterval(this.warTimer);
        this.keyW = false;
        this.keyS = false;
        this.keyA = false;
        this.keyD = false;
        this.joystickMoveX = 0;
        this.joystickMoveY = 0;
        this.respawnPlayerMesh();
        this.playerGroup.position.set(0, 0, 0);
        document.getElementById('hub-ui').style.display = 'block';
        document.getElementById('racing-hud').style.display = 'none';
        document.getElementById('shooting-hud').style.display = 'none';
        document.getElementById('snowball-war-hud').style.display = 'none';
        document.getElementById('back-hub-btn').style.display = 'none';
        // CORREÇÃO CRÍTICA DO BUG: Remove tela de cutscene
        const cutsceneEl = document.getElementById('cable-car-cutscene');
        if (cutsceneEl)
            cutsceneEl.style.display = 'none';
        document.getElementById('joystick-ui').style.display = 'block';
        const runBtn = document.getElementById('run-btn');
        if (runBtn)
            runBtn.style.display = 'flex';
        const jumpBtn = document.getElementById('jump-btn');
        if (jumpBtn)
            jumpBtn.style.display = 'flex';
        const sbBtn = document.getElementById('snowball-btn');
        if (sbBtn) {
            sbBtn.style.display = 'flex';
            sbBtn.innerHTML = '❄️';
        }
        const aimBtn = document.getElementById('aim-btn');
        if (aimBtn)
            aimBtn.style.display = 'flex';
        const crosshair = document.getElementById('hub-crosshair');
        if (crosshair) {
            const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth <= 860;
            crosshair.style.display = (this.isPointerLocked || isTouch) ? 'block' : 'none';
        }
        document.getElementById('race-finish-modal').style.display = 'none';
        const shootModal = document.getElementById('shooting-results-modal');
        if (shootModal)
            shootModal.style.display = 'none';
        const warModal = document.getElementById('snowball-war-results-modal');
        if (warModal)
            warModal.style.display = 'none';
        this.hideAllInteractivePrompts();
        this.closeAllModals();
    }
    hideAllInteractivePrompts() {
        const prompts = [
            'cable-car-prompt',
            'garage-shop-prompt',
            'hat-shop-prompt',
            'atelier-shop-prompt',
            'records-prompt',
            'phone-booth-prompt',
            'carnival-prompt',
            'snowball-war-prompt',
            'sit-bench-prompt',
            'stand-up-prompt'
        ];
        for (const pid of prompts) {
            const el = document.getElementById(pid);
            if (el)
                el.style.display = 'none';
        }
    }
    loadRacingScene() {
        this.currentScene = 'RACING';
        this.scene.clear();
        this.isRaceFinished = false;
        this.gatesCleared = 0;
        this.raceStartTime = Date.now();
        this.confettiPoints = null;
        this.snowballs = [];
        this.isSitting = false;
        this.currentBench = null;
        // CORREÇÃO CRÍTICA DO BUG: Garante que a cutscene desaparece 100% ao iniciar a descida!
        const cutsceneEl = document.getElementById('cable-car-cutscene');
        if (cutsceneEl)
            cutsceneEl.style.display = 'none';
        // Atmosfera Alpina Imersiva
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
        const trackLength = this.raceTrackLength + 400;
        const trackGeo = new THREE.PlaneGeometry(48, trackLength, 16, 80);
        const trackMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.92 });
        const track = new THREE.Mesh(trackGeo, trackMat);
        track.rotation.x = -Math.PI / 2;
        track.position.set(0, 0, trackLength * 0.5);
        track.receiveShadow = true;
        this.scene.add(track);
        // Paredões/encostas de neve nas laterais
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
        // Cordilheira de montanhas no horizonte
        for (let mz = 200; mz <= trackLength; mz += 380) {
            const p1 = this.createMountainPeak(45 + Math.random() * 20, 65 + Math.random() * 35);
            p1.position.set(-110 - Math.random() * 30, 0, mz + (Math.random() - 0.5) * 80);
            this.scene.add(p1);
            const p2 = this.createMountainPeak(45 + Math.random() * 20, 65 + Math.random() * 35);
            p2.position.set(110 + Math.random() * 30, 0, mz + (Math.random() - 0.5) * 80);
            this.scene.add(p2);
        }
        // Pinheiros nevados nas margens
        for (let tz = 10; tz <= trackLength; tz += 24) {
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
        // Obstáculos dentro da pista
        let nextZ = 75;
        for (let i = 0; i < 45; i++) {
            const isTree = Math.random() > 0.45;
            const xPos = (Math.random() - 0.5) * 30;
            let obsMesh;
            let radius = 1.3;
            if (isTree) {
                obsMesh = this.createSnowyPineTree();
                obsMesh.scale.setScalar(0.75 + Math.random() * 0.25);
                radius = 1.2;
            }
            else {
                obsMesh = this.createSnowyRock();
                obsMesh.scale.setScalar(0.85 + Math.random() * 0.3);
                radius = 1.5;
            }
            obsMesh.position.set(xPos, 0, nextZ);
            this.scene.add(obsMesh);
            this.obstacles.push({ mesh: obsMesh, x: xPos, z: nextZ, radius });
            nextZ += 60 + Math.random() * 45;
            if (nextZ > this.raceTrackLength - 100)
                break;
        }
        // Portais de Slalom com Arcos Iluminados
        for (let gz = 120; gz < this.raceTrackLength - 120; gz += 130) {
            const colorHex = (Math.floor(gz / 130) % 2 === 0) ? 0xef4444 : 0x0284c7;
            const gate = this.createSlalomGate(colorHex);
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
        // Rampas de Neve (Kickers)
        for (let rz = 200; rz < this.raceTrackLength - 160; rz += 280) {
            const ramp = this.createSnowRamp();
            const rampX = (Math.random() - 0.5) * 22;
            ramp.position.set(rampX, 0, rz);
            this.scene.add(ramp);
            this.ramps.push({ mesh: ramp, x: rampX, z: rz });
        }
        // Grande Linha de Chegada / Portal da Vitória em Z = 3200
        const finishArch = this.createFinishLineArch();
        finishArch.position.set(0, 0, this.raceTrackLength);
        this.scene.add(finishArch);
        // RESET TOTAL DO JOGADOR NA CORRIDA
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
        document.getElementById('hub-ui').style.display = 'none';
        document.getElementById('racing-hud').style.display = 'block';
        document.getElementById('back-hub-btn').style.display = 'block';
        document.getElementById('joystick-ui').style.display = 'block';
        const runBtn = document.getElementById('run-btn');
        if (runBtn)
            runBtn.style.display = 'none';
        const jumpBtn = document.getElementById('jump-btn');
        if (jumpBtn)
            jumpBtn.style.display = 'flex';
        const sbBtn = document.getElementById('snowball-btn');
        if (sbBtn)
            sbBtn.style.display = 'none';
        const aimBtn = document.getElementById('aim-btn');
        if (aimBtn)
            aimBtn.style.display = 'none';
        const interactBtn = document.getElementById('interact-btn');
        if (interactBtn)
            interactBtn.style.display = 'none';
        const crosshair = document.getElementById('hub-crosshair');
        if (crosshair)
            crosshair.style.display = 'none';
        document.getElementById('race-finish-modal').style.display = 'none';
        this.hideAllInteractivePrompts();
        const slalomHudVal = document.getElementById('slalom-hud-val');
        if (slalomHudVal)
            slalomHudVal.innerText = '0';
    }
    // Transição do Bondinho
    startCableCarClimb() {
        const cutscene = document.getElementById('cable-car-cutscene');
        cutscene.style.display = 'flex';
        this.playTone(392, 'sine', 0.5, 0.2);
        setTimeout(() => {
            cutscene.style.display = 'none';
            this.loadRacingScene();
        }, 2000);
    }
    // Conclusão da Corrida / Linha de Chegada
    finishRace() {
        if (this.isRaceFinished)
            return;
        this.isRaceFinished = true;
        this.playVictoryFanfare();
        this.createConfettiSystem();
        const elapsedSeconds = ((Date.now() - this.raceStartTime) / 1000).toFixed(1);
        const bonusCoins = 150 + this.gatesCleared * 15;
        this.currency += bonusCoins;
        this.updateCoinsDisplay();
        this.saveSettings();
        try {
            const bestScore = parseInt(localStorage.getItem('snow_slide_best_score') || '0', 10);
            if (this.score > bestScore) {
                localStorage.setItem('snow_slide_best_score', this.score.toString());
                localStorage.setItem('snow_slide_best_time', `${elapsedSeconds}s`);
            }
        }
        catch (e) { }
        const finishTimeVal = document.getElementById('finish-time-val');
        if (finishTimeVal)
            finishTimeVal.innerText = `${elapsedSeconds}s`;
        const finishGatesVal = document.getElementById('finish-gates-val');
        if (finishGatesVal)
            finishGatesVal.innerText = `${this.gatesCleared} / ${this.totalRaceGates}`;
        const finishScoreVal = document.getElementById('finish-score-val');
        if (finishScoreVal)
            finishScoreVal.innerText = this.score.toLocaleString('pt-BR');
        const finishCoinsVal = document.getElementById('finish-coins-val');
        if (finishCoinsVal)
            finishCoinsVal.innerText = `+${bonusCoins}`;
        const finishModal = document.getElementById('race-finish-modal');
        if (finishModal) {
            setTimeout(() => {
                if (document.pointerLockElement) {
                    try {
                        document.exitPointerLock();
                    }
                    catch (e) { }
                }
                finishModal.style.display = 'flex';
            }, 700);
        }
    }
    // =========================================================================
    // MINIGAME 1: TIRO AO ALVO DO FESTIVAL (CIRCO ALPINO / ARMA DE BRINQUEDO)
    // =========================================================================
    loadShootingGalleryScene() {
        this.currentScene = 'SHOOTING_GALLERY';
        this.scene.clear();
        this.isSitting = false;
        this.confettiPoints = null;
        this.snowballs = [];
        // Céu festivo do entardecer
        this.scene.background = new THREE.Color(0x1e1b4b);
        this.scene.fog = new THREE.FogExp2(0x1e1b4b, 0.005);
        const ambient = new THREE.AmbientLight(0xffffff, 0.95);
        this.scene.add(ambient);
        const stageLight = new THREE.PointLight(0xfef08a, 2.5, 25);
        stageLight.position.set(0, 5.0, -4.0);
        this.scene.add(stageLight);
        // Estande de tiro de madeira
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
        const clothRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 });
        const clothWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
        // Balcão de apoio do atirador
        const shooterCounter = new THREE.Mesh(new THREE.BoxGeometry(10, 1.1, 1.2), woodMat);
        shooterCounter.position.set(0, 0.55, -2.0);
        shooterCounter.receiveShadow = true;
        this.scene.add(shooterCounter);
        // Parede de fundo do estande
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 0.5), woodMat);
        backWall.position.set(0, 3.5, -9.5);
        this.scene.add(backWall);
        // Toldo listrado festivo no topo
        for (let i = 0; i < 16; i++) {
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.2, 5.5), i % 2 === 0 ? clothRed : clothWhite);
            stripe.position.set(-7.5 + i * 1.0, 7.2, -6.5);
            stripe.rotation.x = 0.2;
            this.scene.add(stripe);
        }
        // 3 Prateleiras de alvos
        const shelfY = [1.4, 2.7, 4.0];
        for (const y of shelfY) {
            const shelf = new THREE.Mesh(new THREE.BoxGeometry(14, 0.16, 0.7), woodMat);
            shelf.position.set(0, y, -8.5);
            this.scene.add(shelf);
        }
        // Criação da Espingarda de Brinquedo na visão do jogador
        this.toyGunGroup = this.createToyPopGun();
        this.camera.add(this.toyGunGroup);
        this.scene.add(this.camera);
        // Reset de variáveis do jogo
        this.shootingScore = 0;
        this.shootingHits = 0;
        this.shootingShots = 0;
        this.shootingCombo = 0;
        this.shootingTimeLeft = 40;
        // Spawna alvos móveis
        this.spawnCarnivalTargets();
        // Posiciona câmera na mira
        this.camera.position.set(0, 1.65, 0);
        this.camera.lookAt(0, 2.7, -8.5);
        this.cameraAngleX = 0.05;
        this.cameraAngleY = 0;
        // Ajusta UI
        document.getElementById('hub-ui').style.display = 'none';
        document.getElementById('racing-hud').style.display = 'none';
        document.getElementById('snowball-war-hud').style.display = 'none';
        document.getElementById('shooting-hud').style.display = 'block';
        document.getElementById('back-hub-btn').style.display = 'none';
        document.getElementById('joystick-ui').style.display = 'none';
        const runBtn = document.getElementById('run-btn');
        if (runBtn)
            runBtn.style.display = 'none';
        const jumpBtn = document.getElementById('jump-btn');
        if (jumpBtn)
            jumpBtn.style.display = 'none';
        const aimBtn = document.getElementById('aim-btn');
        if (aimBtn)
            aimBtn.style.display = 'none';
        const interactBtn = document.getElementById('interact-btn');
        if (interactBtn)
            interactBtn.style.display = 'none';
        const sbBtn = document.getElementById('snowball-btn');
        if (sbBtn) {
            sbBtn.style.display = 'flex';
            sbBtn.innerHTML = '🎯';
        }
        document.getElementById('hub-crosshair').style.display = 'block';
        this.hideAllInteractivePrompts();
        this.updateShootingHUD();
        this.playCarnivalHornSound();
        // Inicia cronômetro da rodada
        if (this.shootingTimer)
            clearInterval(this.shootingTimer);
        this.shootingTimer = setInterval(() => {
            this.shootingTimeLeft--;
            const timeEl = document.getElementById('shooting-time-val');
            if (timeEl)
                timeEl.textContent = this.shootingTimeLeft.toString();
            if (this.shootingTimeLeft <= 0) {
                clearInterval(this.shootingTimer);
                this.endShootingGallery();
            }
        }, 1000);
    }
    createToyPopGun() {
        const gun = new THREE.Group();
        const woodStockMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 });
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 });
        const corkMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 });
        const stringMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        // Coronha de madeira de brinquedo
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.42), woodStockMat);
        stock.position.set(0, -0.06, 0.15);
        stock.rotation.x = -0.3;
        // Cano dourado de latão
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.65, 8), brassMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0, -0.22);
        // Alavanca de mola de brinquedo
        const lever = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 12, Math.PI), brassMat);
        lever.rotation.x = Math.PI / 2;
        lever.position.set(0, -0.09, 0.05);
        // Rolha de brinquedo amarrada
        const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.028, 0.09, 8), corkMat);
        cork.rotation.x = Math.PI / 2;
        cork.position.set(0, 0, -0.58);
        // Cordinha da rolha
        const string = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.18, 4), stringMat);
        string.rotation.z = 0.5;
        string.position.set(0.04, -0.06, -0.45);
        gun.add(stock, barrel, lever, cork, string);
        gun.position.set(0.32, -0.24, -0.65);
        gun.rotation.set(0.05, -0.05, 0);
        return gun;
    }
    spawnCarnivalTargets() {
        this.carnivalTargets = [];
        const duckYellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
        const duckOrangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
        const targetRingMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
        const targetWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
        const targetBullseyeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 });
        const starGoldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.15 });
        const bombMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
        // 1. Prateleira Inferior: Patinhos de madeira clássicos que deslizam nos trilhos
        for (let i = 0; i < 5; i++) {
            const duck = new THREE.Group();
            const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), duckYellowMat);
            body.scale.set(1.2, 0.9, 0.8);
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), duckYellowMat);
            head.position.set(0.22, 0.22, 0);
            const beak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 6), duckOrangeMat);
            beak.rotation.z = -Math.PI / 2;
            beak.position.set(0.36, 0.20, 0);
            const baseStand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.25, 6), duckOrangeMat);
            baseStand.position.set(0, -0.25, 0);
            duck.add(body, head, beak, baseStand);
            const startX = -5.0 + i * 2.5;
            duck.position.set(startX, 1.7, -8.5);
            this.scene.add(duck);
            this.carnivalTargets.push({
                group: duck,
                type: 'duck',
                shelfIndex: 0,
                x: startX,
                baseY: 1.7,
                z: -8.5,
                speed: 0.04 + (i % 2) * 0.02,
                dir: 1,
                points: 20,
                hit: false,
                hitTimer: 0
            });
        }
        // 2. Prateleira Média: Alvos circulares concêntricos giratórios
        for (let i = 0; i < 4; i++) {
            const targetGroup = new THREE.Group();
            const outerRing = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.06, 16), targetRingMat);
            outerRing.rotation.x = Math.PI / 2;
            const middleRing = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.07, 16), targetWhiteMat);
            middleRing.rotation.x = Math.PI / 2;
            const bullseye = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16), targetBullseyeMat);
            bullseye.rotation.x = Math.PI / 2;
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.35, 6), duckOrangeMat);
            stem.position.set(0, -0.5, 0);
            targetGroup.add(outerRing, middleRing, bullseye, stem);
            const startX = -4.5 + i * 3.0;
            targetGroup.position.set(startX, 3.2, -8.5);
            this.scene.add(targetGroup);
            this.carnivalTargets.push({
                group: targetGroup,
                type: 'bullseye',
                shelfIndex: 1,
                x: startX,
                baseY: 3.2,
                z: -8.5,
                speed: 0.035,
                dir: i % 2 === 0 ? 1 : -1,
                points: 35,
                hit: false,
                hitTimer: 0
            });
        }
        // 3. Prateleira Superior: Estrelas douradas bônus e Bombinha de penalidade
        for (let i = 0; i < 3; i++) {
            const topGroup = new THREE.Group();
            const isBomb = i === 1;
            if (isBomb) {
                const bombBody = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), bombMat);
                const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.15, 6), targetBullseyeMat);
                fuse.position.set(0, 0.36, 0);
                const skull = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.1), targetWhiteMat);
                skull.position.set(0, 0, 0.3);
                topGroup.add(bombBody, fuse, skull);
            }
            else {
                const star = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), starGoldMat);
                topGroup.add(star);
            }
            const startX = -3.5 + i * 3.5;
            topGroup.position.set(startX, 4.6, -8.5);
            this.scene.add(topGroup);
            this.carnivalTargets.push({
                group: topGroup,
                type: isBomb ? 'bomb' : 'star',
                shelfIndex: 2,
                x: startX,
                baseY: 4.6,
                z: -8.5,
                speed: 0.05,
                dir: i === 0 ? 1 : -1,
                points: isBomb ? -30 : 60,
                hit: false,
                hitTimer: 0
            });
        }
    }
    updateCarnivalShooting() {
        for (const tgt of this.carnivalTargets) {
            if (!tgt.hit) {
                tgt.x += tgt.speed * tgt.dir;
                if (tgt.x > 5.5) {
                    tgt.x = 5.5;
                    tgt.dir = -1;
                }
                else if (tgt.x < -5.5) {
                    tgt.x = -5.5;
                    tgt.dir = 1;
                }
                tgt.group.position.x = tgt.x;
                // Leve oscilação de movimento
                if (tgt.type === 'duck') {
                    tgt.group.position.y = tgt.baseY + Math.sin(Date.now() * 0.005 + tgt.x) * 0.04;
                }
                else if (tgt.type === 'bullseye') {
                    tgt.group.rotation.z += 0.02;
                }
                else if (tgt.type === 'star') {
                    tgt.group.rotation.y += 0.04;
                }
            }
            else {
                // Alvo abatido tomba para trás e depois sobe novamente
                tgt.hitTimer--;
                tgt.group.rotation.x = THREE.MathUtils.lerp(tgt.group.rotation.x, Math.PI / 2, 0.2);
                if (tgt.hitTimer <= 0) {
                    tgt.hit = false;
                    tgt.group.rotation.x = 0;
                }
            }
        }
    }
    shootCarnivalToyGun() {
        if (this.currentScene !== 'SHOOTING_GALLERY')
            return;
        this.initAudio();
        this.playToyGunPopSound();
        this.shootingShots++;
        // Animação de recuo da arminha de brinquedo
        if (this.toyGunGroup) {
            this.toyGunGroup.position.z = -0.52;
            this.toyGunGroup.rotation.x = 0.25;
            setTimeout(() => {
                if (this.toyGunGroup) {
                    this.toyGunGroup.position.z = -0.65;
                    this.toyGunGroup.rotation.x = 0.05;
                }
            }, 120);
        }
        // Raycaster a partir da mira central da câmera
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        let hitSomething = false;
        for (const tgt of this.carnivalTargets) {
            if (tgt.hit)
                continue;
            const intersects = raycaster.intersectObjects(tgt.group.children, true);
            if (intersects.length > 0) {
                hitSomething = true;
                tgt.hit = true;
                tgt.hitTimer = 65; // Tomba por 65 frames
                this.playTargetHitSound();
                this.shootingHits++;
                this.shootingCombo++;
                // Emissão de faíscas festivas
                this.emitSnowSpray(15, 0, tgt.x, tgt.baseY, tgt.z);
                if (tgt.type === 'bomb') {
                    this.shootingScore = Math.max(0, this.shootingScore - 30);
                    this.shootingCombo = 0;
                    this.showToast('💣 BUUM! Você acertou a bomba de brinquedo (-30 pts)!', 'warning');
                }
                else {
                    const mult = Math.min(4, 1 + Math.floor(this.shootingCombo / 3));
                    const earned = tgt.points * mult;
                    this.shootingScore += earned;
                    const msg = mult > 1 ? `🎯 +${earned} pts! (COMBO x${mult})` : `🎯 +${earned} pts!`;
                    this.showToast(msg, 'success');
                }
                break;
            }
        }
        if (!hitSomething) {
            this.shootingCombo = 0;
        }
        this.updateShootingHUD();
    }
    updateShootingHUD() {
        const scoreEl = document.getElementById('shooting-score-val');
        if (scoreEl)
            scoreEl.textContent = this.shootingScore.toString();
        const hitsEl = document.getElementById('shooting-hits-val');
        if (hitsEl)
            hitsEl.textContent = this.shootingHits.toString();
        const comboBadge = document.getElementById('shooting-combo-badge');
        const comboVal = document.getElementById('shooting-combo-val');
        if (comboBadge && comboVal) {
            if (this.shootingCombo >= 2) {
                comboBadge.style.display = 'inline-block';
                comboVal.textContent = this.shootingCombo.toString();
            }
            else {
                comboBadge.style.display = 'none';
            }
        }
    }
    endShootingGallery() {
        if (this.shootingTimer)
            clearInterval(this.shootingTimer);
        this.playVictoryFanfare();
        const acc = this.shootingShots > 0 ? Math.round((this.shootingHits / this.shootingShots) * 100) : 0;
        const coins = Math.max(40, Math.floor(this.shootingScore * 0.35));
        this.currency += coins;
        this.updateCoinsDisplay();
        const fScore = document.getElementById('shooting-final-score');
        if (fScore)
            fScore.textContent = this.shootingScore.toString();
        const fHits = document.getElementById('shooting-final-hits');
        if (fHits)
            fHits.textContent = this.shootingHits.toString();
        const fAcc = document.getElementById('shooting-final-accuracy');
        if (fAcc)
            fAcc.textContent = `${acc}%`;
        const fCoins = document.getElementById('shooting-final-coins');
        if (fCoins)
            fCoins.textContent = `+${coins}`;
        const modal = document.getElementById('shooting-results-modal');
        if (modal) {
            if (document.pointerLockElement) {
                try {
                    document.exitPointerLock();
                }
                catch (e) { }
            }
            modal.style.display = 'flex';
        }
    }
    // =========================================================================
    // MINIGAME 2: ARENA DE GUERRA DE NEVE (FORTES, TRINCHEIRAS & LABIRINTO)
    // =========================================================================
    loadSnowballWarScene() {
        this.currentScene = 'SNOWBALL_WAR';
        this.scene.clear();
        this.isSitting = false;
        this.snowballs = [];
        this.warBots = [];
        this.warObstacles = [];
        this.warPlayerHealth = 3;
        this.warKOs = 0;
        this.warHits = 0;
        this.warScore = 0;
        this.warTimeLeft = 60;
        this.isPlayerWarInvuln = false;
        this.playerWarInvulnTimer = 0;
        // Atmosfera noturna gélida com nevasca
        this.scene.background = new THREE.Color(0x0f172a);
        this.scene.fog = new THREE.FogExp2(0x0f172a, 0.007);
        const ambient = new THREE.AmbientLight(0x94a3b8, 0.7);
        this.scene.add(ambient);
        const moon = new THREE.DirectionalLight(0x38bdf8, 1.2);
        moon.position.set(30, 60, -30);
        moon.castShadow = true;
        this.scene.add(moon);
        this.createSnowParticles();
        this.createSnowSpraySystem();
        this.createSnowballBurstSystem();
        // Constrói o labirinto de trincheiras e fortes de neve
        this.buildSnowballWarArena();
        // Spawna jogador no bunker base 1
        this.playerPosX = -20;
        this.playerPosZ = -20;
        this.playerPosY = 0;
        this.playerVelX = 0;
        this.playerVelZ = 0;
        this.respawnPlayerMesh();
        this.playerGroup.position.set(this.playerPosX, 0, this.playerPosZ);
        // Spawna os 3 bots adversários nas outras bases
        this.spawnWarBots();
        // Configura câmera em terceira pessoa
        this.cameraDistance = 4.5;
        this.cameraAngleY = Math.PI * 0.25;
        this.cameraAngleX = 0.25;
        // Atualiza HUD da Guerra
        document.getElementById('hub-ui').style.display = 'none';
        document.getElementById('racing-hud').style.display = 'none';
        document.getElementById('shooting-hud').style.display = 'none';
        document.getElementById('snowball-war-hud').style.display = 'block';
        document.getElementById('back-hub-btn').style.display = 'none';
        document.getElementById('joystick-ui').style.display = 'block';
        const runBtn = document.getElementById('run-btn');
        if (runBtn)
            runBtn.style.display = 'flex';
        const jumpBtn = document.getElementById('jump-btn');
        if (jumpBtn)
            jumpBtn.style.display = 'flex';
        const sbBtn = document.getElementById('snowball-btn');
        if (sbBtn) {
            sbBtn.style.display = 'flex';
            sbBtn.innerHTML = '❄️';
        }
        const aimBtn = document.getElementById('aim-btn');
        if (aimBtn)
            aimBtn.style.display = 'flex';
        const interactBtn = document.getElementById('interact-btn');
        if (interactBtn)
            interactBtn.style.display = 'none';
        document.getElementById('hub-crosshair').style.display = 'block';
        this.hideAllInteractivePrompts();
        this.updateWarHUDHearts();
        const kosEl = document.getElementById('war-kos-val');
        if (kosEl)
            kosEl.textContent = '0';
        const scoreEl = document.getElementById('war-score-val');
        if (scoreEl)
            scoreEl.textContent = '0';
        const timeEl = document.getElementById('war-time-val');
        if (timeEl)
            timeEl.textContent = '60s';
        this.playVictoryFanfare();
        this.showToast('❄️ A GUERRA DE NEVE COMEÇOU! Acabe com os rivais!', 'info');
        // Cronômetro da Batalha (60 segundos)
        if (this.warTimer)
            clearInterval(this.warTimer);
        this.warTimer = setInterval(() => {
            this.warTimeLeft--;
            const tEl = document.getElementById('war-time-val');
            if (tEl)
                tEl.textContent = `${this.warTimeLeft}s`;
            if (this.warTimeLeft <= 0) {
                clearInterval(this.warTimer);
                this.endSnowballWar();
            }
        }, 1000);
    }
    buildSnowballWarArena() {
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
        // Paliçada perimetral alta da arena
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
        // 4 Bunkers de Neve nos Cantos (Bases dos Competidores com Bordas Arredondadas)
        const corners = [
            { x: -20, z: -20 },
            { x: 20, z: -20 },
            { x: -20, z: 20 },
            { x: 20, z: 20 }
        ];
        for (const c of corners) {
            // Pequeno forte quadrado esculpido com cantos arredondados
            const bWallH = 2.2;
            const b1Geo = this.createRoundedWallGeometry(6, bWallH, 0.8, 0.28);
            const b1 = new THREE.Mesh(b1Geo, snowWallMat);
            b1.position.set(c.x, bWallH * 0.5, c.z - 3);
            b1.castShadow = true;
            b1.receiveShadow = true;
            const b2Geo = this.createRoundedWallGeometry(0.8, bWallH, 6, 0.28);
            const b2 = new THREE.Mesh(b2Geo, snowWallMat);
            b2.position.set(c.x - 3, bWallH * 0.5, c.z);
            b2.castShadow = true;
            b2.receiveShadow = true;
            this.scene.add(b1, b2);
            this.warObstacles.push({ x: c.x, z: c.z - 3, hw: 3.0, hd: 0.5, height: bWallH });
            this.warObstacles.push({ x: c.x - 3, z: c.z, hw: 0.5, hd: 3.0, height: bWallH });
        }
        // Labirinto tático central com muretas de cobertura arredondadas (altura peito: 1.4m) e blocos altos (2.8m)
        const mazeWalls = [
            // Muretas centrais em cruz protegendo o miolo
            { x: 0, z: -8, w: 10, d: 1.0, h: 1.4 },
            { x: 0, z: 8, w: 10, d: 1.0, h: 1.4 },
            { x: -8, z: 0, w: 1.0, d: 10, h: 1.4 },
            { x: 8, z: 0, w: 1.0, d: 10, h: 1.4 },
            // Bunkers intermediários
            { x: -12, z: -12, w: 6, d: 1.0, h: 2.8 },
            { x: 12, z: -12, w: 6, d: 1.0, h: 2.8 },
            { x: -12, z: 12, w: 6, d: 1.0, h: 2.8 },
            { x: 12, z: 12, w: 6, d: 1.0, h: 2.8 },
            // Pilares de gelo translúcido para ricochete
            { x: -4, z: -4, w: 1.8, d: 1.8, h: 3.6, isIce: true },
            { x: 4, z: -4, w: 1.8, d: 1.8, h: 3.6, isIce: true },
            { x: -4, z: 4, w: 1.8, d: 1.8, h: 3.6, isIce: true },
            { x: 4, z: 4, w: 1.8, d: 1.8, h: 3.6, isIce: true },
            // Trincheiras em L
            { x: -16, z: 0, w: 1.0, d: 8, h: 1.4 },
            { x: 16, z: 0, w: 1.0, d: 8, h: 1.4 },
            { x: 0, z: -16, w: 8, d: 1.0, h: 1.4 },
            { x: 0, z: 16, w: 8, d: 1.0, h: 1.4 }
        ];
        for (const mw of mazeWalls) {
            const mat = mw.isIce ? iceBlockMat : snowWallMat;
            const geo = mw.isIce
                ? new THREE.BoxGeometry(mw.w, mw.h, mw.d)
                : this.createRoundedWallGeometry(mw.w, mw.h, mw.d, 0.32);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(mw.x, mw.h * 0.5, mw.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.warObstacles.push({
                x: mw.x,
                z: mw.z,
                hw: mw.w * 0.5,
                hd: mw.d * 0.5,
                height: mw.h
            });
        }
        // Monumento de gelo decorativo central
        const centerIce = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4.5, 6), iceBlockMat);
        centerIce.position.set(0, 2.25, 0);
        this.scene.add(centerIce);
        this.warObstacles.push({ x: 0, z: 0, hw: 1.4, hd: 1.4, height: 4.5 });
    }
    resolveWarCollisions(px, pz, playerRadius = 0.65) {
        let resX = Math.max(-27 + playerRadius, Math.min(27 - playerRadius, px));
        let resZ = Math.max(-27 + playerRadius, Math.min(27 - playerRadius, pz));
        for (let pass = 0; pass < 2; pass++) {
            for (const obs of this.warObstacles) {
                const minX = obs.x - obs.hw - playerRadius;
                const maxX = obs.x + obs.hw + playerRadius;
                const minZ = obs.z - obs.hd - playerRadius;
                const maxZ = obs.z + obs.hd + playerRadius;
                if (resX > minX && resX < maxX && resZ > minZ && resZ < maxZ) {
                    const dLeft = resX - minX;
                    const dRight = maxX - resX;
                    const dTop = resZ - minZ;
                    const dBottom = maxZ - resZ;
                    const minD = Math.min(dLeft, dRight, dTop, dBottom);
                    if (minD === dLeft)
                        resX = minX;
                    else if (minD === dRight)
                        resX = maxX;
                    else if (minD === dTop)
                        resZ = minZ;
                    else
                        resZ = maxZ;
                }
            }
        }
        return { x: resX, z: resZ };
    }
    spawnWarBots() {
        this.warBots = [];
        const botConfigs = [
            { name: 'Kero Saltador', type: 'frog', start: { x: 20, z: -20 } },
            { name: 'Mimi Ártica', type: 'cat', start: { x: -20, z: 20 } },
            { name: 'Toby Neve', type: 'dog', start: { x: 20, z: 20 } }
        ];
        for (let i = 0; i < botConfigs.length; i++) {
            const cfg = botConfigs[i];
            let model;
            if (cfg.type === 'frog')
                model = this.createDetailedFrog();
            else if (cfg.type === 'cat')
                model = this.createDetailedCat();
            else if (cfg.type === 'dog')
                model = this.createDetailedDog();
            else
                model = this.createDetailedPenguin();
            const botRig = model.userData.rig;
            model.position.set(cfg.start.x, 0, cfg.start.z);
            this.scene.add(model);
            this.warBots.push({
                id: `bot_${i}`,
                name: cfg.name,
                type: cfg.type,
                group: model,
                rig: botRig,
                pos: new THREE.Vector3(cfg.start.x, 0, cfg.start.z),
                rotY: 0,
                health: 3,
                maxHealth: 3,
                state: 'patrol',
                stateTimer: 60 + Math.floor(Math.random() * 60),
                targetPos: new THREE.Vector3(cfg.start.x, 0, cfg.start.z),
                invulnTimer: 0,
                iceCube: null,
                walkTime: Math.random() * 10,
                strafeDir: Math.random() < 0.5 ? -1 : 1,
                throwCooldown: 60 + Math.floor(Math.random() * 60),
                hitTimer: 0,
                isMoving: false
            });
        }
        // Crucial: Restaura o playerRig do jogador para que nunca seja sobrescrito pelos bots!
        if (this.playerRig) {
            this.charTorso = this.playerRig.torso;
            this.charHead = this.playerRig.head;
            this.charArmL = this.playerRig.armL;
            this.charArmR = this.playerRig.armR;
            this.charFootL = this.playerRig.footL;
            this.charFootR = this.playerRig.footR;
            this.charTail = this.playerRig.tail;
            this.charScarfTail = this.playerRig.scarfTail;
        }
    }
    updateSnowballWar() {
        if (this.currentScene !== 'SNOWBALL_WAR')
            return;
        // Atualiza invulnerabilidade do jogador
        if (this.isPlayerWarInvuln) {
            this.playerWarInvulnTimer--;
            if (this.playerGroup) {
                this.playerGroup.visible = Math.floor(this.playerWarInvulnTimer / 6) % 2 === 0;
            }
            if (this.playerWarInvulnTimer <= 0) {
                this.isPlayerWarInvuln = false;
                if (this.playerGroup)
                    this.playerGroup.visible = true;
            }
        }
        // Atualiza IA de combate e animação esquelética dos bots
        for (const bot of this.warBots) {
            if (bot.hitTimer > 0)
                bot.hitTimer--;
            if (bot.state === 'frozen') {
                bot.stateTimer--;
                this.animateBot(bot);
                if (bot.stateTimer <= 0) {
                    // Descongela e renasce
                    if (bot.iceCube) {
                        this.scene.remove(bot.iceCube);
                        bot.iceCube = null;
                    }
                    bot.health = 3;
                    bot.state = 'patrol';
                    bot.stateTimer = 60;
                    this.emitSnowSpray(20, 0, bot.pos.x, 1.0, bot.pos.z);
                }
                continue;
            }
            // Distância do bot até o jogador
            const toPlayerX = this.playerPosX - bot.pos.x;
            const toPlayerZ = this.playerPosZ - bot.pos.z;
            const distToPlayer = Math.sqrt(toPlayerX * toPlayerX + toPlayerZ * toPlayerZ);
            // Comportamentos e Estados de Combate dos Bots:
            if (bot.state === 'windup') {
                bot.isMoving = false;
                bot.rotY = Math.atan2(toPlayerX, toPlayerZ);
                bot.group.rotation.y = bot.rotY;
                bot.stateTimer--;
                if (bot.stateTimer <= 0) {
                    this.throwBotSnowball(bot);
                    bot.state = 'throw';
                    bot.stateTimer = 14;
                }
            }
            else if (bot.state === 'throw') {
                bot.isMoving = false;
                bot.stateTimer--;
                if (bot.stateTimer <= 0) {
                    bot.state = 'skirmish';
                    bot.throwCooldown = 70 + Math.floor(Math.random() * 60);
                    bot.strafeDir = Math.random() < 0.5 ? -1 : 1;
                }
            }
            else if (distToPlayer < 24) {
                // Skirmish tático ativo (aproxima, recua e faz strafe lateral entre barreiras)
                bot.state = 'skirmish';
                bot.rotY = Math.atan2(toPlayerX, toPlayerZ);
                bot.group.rotation.y = bot.rotY;
                let fwdMove = 0;
                if (distToPlayer > 17)
                    fwdMove = 0.08;
                else if (distToPlayer < 5.5)
                    fwdMove = -0.07;
                const fwdX = (toPlayerX / distToPlayer);
                const fwdZ = (toPlayerZ / distToPlayer);
                const rightX = -fwdZ;
                const rightZ = fwdX;
                const strafeSpeed = 0.07 * bot.strafeDir;
                const dX = (fwdX * fwdMove) + (rightX * strafeSpeed);
                const dZ = (fwdZ * fwdMove) + (rightZ * strafeSpeed);
                const newX = bot.pos.x + dX;
                const newZ = bot.pos.z + dZ;
                const resolved = this.resolveWarCollisions(newX, newZ, 0.65);
                if (Math.abs(resolved.x - newX) > 0.01 || Math.abs(resolved.z - newZ) > 0.01) {
                    bot.strafeDir = -bot.strafeDir;
                }
                const movedDist = Math.hypot(resolved.x - bot.pos.x, resolved.z - bot.pos.z);
                bot.isMoving = movedDist > 0.01;
                if (bot.isMoving) {
                    bot.walkTime += 0.20;
                }
                bot.pos.x = resolved.x;
                bot.pos.z = resolved.z;
                bot.throwCooldown--;
                if (bot.throwCooldown <= 0) {
                    bot.state = 'windup';
                    bot.stateTimer = 22; // ~360ms de animação de preparação
                }
            }
            else {
                // Patrulhar pelo labirinto
                bot.state = 'patrol';
                bot.stateTimer--;
                if (bot.stateTimer <= 0) {
                    bot.targetPos.set((Math.random() - 0.5) * 36, 0, (Math.random() - 0.5) * 36);
                    bot.stateTimer = 100 + Math.floor(Math.random() * 80);
                }
                const dx = bot.targetPos.x - bot.pos.x;
                const dz = bot.targetPos.z - bot.pos.z;
                const dTarget = Math.sqrt(dx * dx + dz * dz);
                if (dTarget > 0.8) {
                    bot.rotY = Math.atan2(dx, dz);
                    bot.group.rotation.y = bot.rotY;
                    const spd = 0.07;
                    const newX = bot.pos.x + (dx / dTarget) * spd;
                    const newZ = bot.pos.z + (dz / dTarget) * spd;
                    const resolved = this.resolveWarCollisions(newX, newZ, 0.65);
                    bot.pos.x = resolved.x;
                    bot.pos.z = resolved.z;
                    bot.isMoving = true;
                    bot.walkTime += 0.16;
                }
                else {
                    bot.isMoving = false;
                }
            }
            bot.group.position.copy(bot.pos);
            this.animateBot(bot);
        }
    }
    throwBotSnowball(bot) {
        const toPlayerX = this.playerPosX - bot.pos.x;
        const toPlayerZ = this.playerPosZ - bot.pos.z;
        const dist = Math.sqrt(toPlayerX * toPlayerX + toPlayerZ * toPlayerZ);
        if (dist < 0.1)
            return;
        // Velocidade calibrada e legível para permitir reação tática e esquiva
        const speed = 0.42;
        const vx = (toPlayerX / dist) * speed;
        const vz = (toPlayerZ / dist) * speed;
        const vy = 0.11 + (dist / 24) * 0.06;
        const gravity = 0.006;
        const snowballGeo = new THREE.SphereGeometry(0.20, 8, 8);
        const snowballMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.7 });
        const mesh = new THREE.Mesh(snowballGeo, snowballMat);
        mesh.position.set(bot.pos.x, 1.25, bot.pos.z);
        mesh.castShadow = true;
        this.scene.add(mesh);
        this.snowballs.push({ mesh, vx, vy, vz, life: 0, isEnemy: true, gravity });
        this.playSnowThrowSound(0.4);
    }
    endSnowballWar() {
        if (this.warTimer)
            clearInterval(this.warTimer);
        this.playVictoryFanfare();
        let rankStr = '🥉 3º Lugar';
        if (this.warKOs >= 4)
            rankStr = '🥇 1º Lugar';
        else if (this.warKOs >= 2)
            rankStr = '🥈 2º Lugar';
        const coins = 120 + this.warKOs * 50;
        this.currency += coins;
        this.updateCoinsDisplay();
        const kosEl = document.getElementById('war-final-kos');
        if (kosEl)
            kosEl.textContent = this.warKOs.toString();
        const hitsEl = document.getElementById('war-final-hits');
        if (hitsEl)
            hitsEl.textContent = this.warHits.toString();
        const rankEl = document.getElementById('war-final-rank');
        if (rankEl)
            rankEl.textContent = rankStr;
        const coinsEl = document.getElementById('war-final-coins');
        if (coinsEl)
            coinsEl.textContent = `+${coins}`;
        const modal = document.getElementById('snowball-war-results-modal');
        if (modal) {
            if (document.pointerLockElement) {
                try {
                    document.exitPointerLock();
                }
                catch (e) { }
            }
            modal.style.display = 'flex';
        }
    }
    // =========================================================================
    // GESTÃO DE MODAIS, LOJA E EQUIPAMENTOS
    // =========================================================================
    updateCoinsDisplay() {
        const el1 = document.getElementById('currency-val');
        if (el1)
            el1.innerText = this.currency.toString();
        const el2 = document.getElementById('shop-coins-val');
        if (el2)
            el2.innerText = this.currency.toString();
        this.saveSettings();
    }
    renderShop(category) {
        const container = document.getElementById('shop-items-container');
        if (!container)
            return;
        container.innerHTML = '';
        const items = SHOP_CATALOG.filter(i => i.category === category);
        for (const item of items) {
            const isOwned = this.inventory.has(item.id);
            let isEquipped = false;
            if (item.category === 'sleds')
                isEquipped = this.equipped.vehicle === item.id;
            if (item.category === 'hats')
                isEquipped = this.equipped.hat === item.id;
            if (item.category === 'scarves')
                isEquipped = this.equipped.scarf === item.id;
            if (item.category === 'goggles')
                isEquipped = this.equipped.goggles === item.id;
            const card = document.createElement('div');
            card.className = `item-card ${isEquipped ? 'equipped' : ''}`;
            let btnHtml = '';
            if (isEquipped) {
                btnHtml = `<button class="item-btn btn-equipped">Equipado</button>`;
            }
            else if (isOwned) {
                btnHtml = `<button class="item-btn btn-equip" data-equip-id="${item.id}">Equipar</button>`;
            }
            else {
                btnHtml = `<button class="item-btn btn-buy" data-buy-id="${item.id}">Comprar (${item.price} pts)</button>`;
            }
            card.innerHTML = `
        <div class="item-icon">${item.icon}</div>
        <div class="item-title">${item.name}</div>
        <div class="item-desc">${item.desc}</div>
        ${btnHtml}
      `;
            container.appendChild(card);
        }
        container.querySelectorAll('[data-buy-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-buy-id');
                this.buyItem(id);
            });
        });
        container.querySelectorAll('[data-equip-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-equip-id');
                const it = SHOP_CATALOG.find(i => i.id === id);
                if (it) {
                    this.equipItem(id, it.category);
                    this.renderShop(category);
                    this.showToast(`Equipado: ${it.name}!`, 'success');
                }
            });
        });
    }
    renderInventory(category) {
        const container = document.getElementById('inv-items-container');
        if (!container)
            return;
        container.innerHTML = '';
        const items = SHOP_CATALOG.filter(i => i.category === category && this.inventory.has(i.id));
        const sledItem = SHOP_CATALOG.find(i => i.id === this.equipped.vehicle);
        const hatItem = SHOP_CATALOG.find(i => i.id === this.equipped.hat);
        const scarfItem = SHOP_CATALOG.find(i => i.id === this.equipped.scarf);
        const gogglesItem = SHOP_CATALOG.find(i => i.id === this.equipped.goggles);
        const s1 = document.getElementById('summary-sled');
        if (s1)
            s1.innerText = sledItem ? sledItem.name : 'Trenó';
        const s2 = document.getElementById('summary-hat');
        if (s2)
            s2.innerText = hatItem ? hatItem.name : 'Gorro';
        const s3 = document.getElementById('summary-scarf');
        if (s3)
            s3.innerText = scarfItem ? scarfItem.name : 'Cachecol';
        const s4 = document.getElementById('summary-goggles');
        if (s4)
            s4.innerText = gogglesItem ? gogglesItem.name : 'Nenhum';
        for (const item of items) {
            let isEquipped = false;
            if (item.category === 'sleds')
                isEquipped = this.equipped.vehicle === item.id;
            if (item.category === 'hats')
                isEquipped = this.equipped.hat === item.id;
            if (item.category === 'scarves')
                isEquipped = this.equipped.scarf === item.id;
            if (item.category === 'goggles')
                isEquipped = this.equipped.goggles === item.id;
            const card = document.createElement('div');
            card.className = `item-card ${isEquipped ? 'equipped' : ''}`;
            const btnHtml = isEquipped
                ? `<button class="item-btn btn-equipped">Em Uso</button>`
                : `<button class="item-btn btn-equip" data-inv-equip="${item.id}">Equipar</button>`;
            card.innerHTML = `
        <div class="item-icon">${item.icon}</div>
        <div class="item-title">${item.name}</div>
        <div class="item-desc">${item.desc}</div>
        ${btnHtml}
      `;
            container.appendChild(card);
        }
        container.querySelectorAll('[data-inv-equip]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-inv-equip');
                const it = SHOP_CATALOG.find(i => i.id === id);
                if (it) {
                    this.equipItem(id, it.category);
                    this.renderInventory(category);
                    this.showToast(`Equipado: ${it.name}!`, 'success');
                }
            });
        });
    }
    buyItem(id) {
        const item = SHOP_CATALOG.find(i => i.id === id);
        if (!item)
            return;
        if (this.currency >= item.price) {
            this.currency -= item.price;
            this.inventory.add(id);
            this.updateCoinsDisplay();
            this.equipItem(id, item.category);
            this.showToast(`Parabéns! Você adquiriu e equipou: ${item.name}!`, 'success');
            this.renderShop(item.category);
        }
        else {
            this.showToast(`Moedas insuficientes! Faltam ${item.price - this.currency} pts para comprar este item.`, 'warning');
        }
    }
    equipItem(id, cat) {
        if (cat === 'sleds')
            this.equipped.vehicle = id;
        if (cat === 'hats')
            this.equipped.hat = id;
        if (cat === 'scarves')
            this.equipped.scarf = id;
        if (cat === 'goggles')
            this.equipped.goggles = id;
        this.saveSettings();
        this.respawnPlayerMesh();
    }
    isAnyModalOpen() {
        const modals = [
            'shop-modal',
            'inventory-modal',
            'settings-modal',
            'character-modal',
            'records-modal',
            'race-finish-modal',
            'shooting-results-modal',
            'snowball-war-results-modal'
        ];
        for (const m of modals) {
            const el = document.getElementById(m);
            if (el && el.style.display === 'flex')
                return true;
        }
        return false;
    }
    closeAllModals() {
        const modals = [
            'shop-modal',
            'inventory-modal',
            'settings-modal',
            'character-modal',
            'records-modal',
            'race-finish-modal',
            'shooting-results-modal',
            'snowball-war-results-modal'
        ];
        for (const m of modals) {
            const el = document.getElementById(m);
            if (el)
                el.style.display = 'none';
        }
        this.keyW = false;
        this.keyS = false;
        this.keyA = false;
        this.keyD = false;
    }
    toggleInventoryModal() {
        const invModal = document.getElementById('inventory-modal');
        if (invModal.style.display === 'flex') {
            invModal.style.display = 'none';
        }
        else {
            if (document.pointerLockElement) {
                try {
                    document.exitPointerLock();
                }
                catch (e) { }
            }
            this.closeAllModals();
            this.renderInventory('sleds');
            invModal.style.display = 'flex';
        }
    }
    openSettingsModal() {
        if (document.pointerLockElement) {
            try {
                document.exitPointerLock();
            }
            catch (e) { }
        }
        this.closeAllModals();
        const slider = document.getElementById('mouse-sens-slider');
        if (slider)
            slider.value = this.mouseSensMultiplier.toString();
        const sensVal = document.getElementById('mouse-sens-val');
        if (sensVal)
            sensVal.innerText = `${this.mouseSensMultiplier.toFixed(1)}x`;
        const invertBox = document.getElementById('invert-y-toggle');
        if (invertBox)
            invertBox.checked = this.invertY;
        const soundBox = document.getElementById('sound-fx-toggle');
        if (soundBox)
            soundBox.checked = this.soundEnabled;
        const modal = document.getElementById('settings-modal');
        if (modal)
            modal.style.display = 'flex';
    }
    openCharacterModal() {
        if (document.pointerLockElement) {
            try {
                document.exitPointerLock();
            }
            catch (e) { }
        }
        this.closeAllModals();
        document.querySelectorAll('.character-card').forEach(card => {
            const charId = card.getAttribute('data-char');
            const btn = card.querySelector('.item-btn');
            if (charId === this.selectedCharacter) {
                card.classList.add('active');
                if (btn) {
                    btn.className = 'item-btn btn-equipped';
                    btn.innerText = 'Em Uso';
                }
            }
            else {
                card.classList.remove('active');
                if (btn) {
                    btn.className = 'item-btn btn-equip';
                    btn.innerText = 'Selecionar';
                }
            }
        });
        const modal = document.getElementById('character-modal');
        if (modal)
            modal.style.display = 'flex';
    }
    openRecordsModal() {
        if (document.pointerLockElement) {
            try {
                document.exitPointerLock();
            }
            catch (e) { }
        }
        this.closeAllModals();
        const bestScore = localStorage.getItem('snow_slide_best_score') || '0';
        const bestTime = localStorage.getItem('snow_slide_best_time') || '--:--';
        const pBestScoreEl = document.getElementById('personal-best-score');
        if (pBestScoreEl)
            pBestScoreEl.innerText = `${parseInt(bestScore, 10).toLocaleString('pt-BR')} pts`;
        const pBestTimeEl = document.getElementById('personal-best-time');
        if (pBestTimeEl)
            pBestTimeEl.innerText = bestTime;
        const modal = document.getElementById('records-modal');
        if (modal)
            modal.style.display = 'flex';
    }
    openSegmentedShop(shopType) {
        if (document.pointerLockElement) {
            try {
                document.exitPointerLock();
            }
            catch (e) { }
        }
        this.closeAllModals();
        this.updateCoinsDisplay();
        const titleEl = document.getElementById('shop-modal-title');
        let initialCategory = 'sleds';
        if (shopType === 'garage') {
            if (titleEl)
                titleEl.innerText = '🛠️ Garagem Alpina (Trenós & Snowboards)';
            initialCategory = 'sleds';
        }
        else if (shopType === 'hats') {
            if (titleEl)
                titleEl.innerText = '🎩 Boutique dos Gorros & Coroas';
            initialCategory = 'hats';
        }
        else if (shopType === 'atelier') {
            if (titleEl)
                titleEl.innerText = '🧣 Ateliê da Montanha (Cachecóis & Óculos)';
            initialCategory = 'scarves';
        }
        else {
            if (titleEl)
                titleEl.innerText = '🛒 Lojinha Alpina Geral';
            initialCategory = 'sleds';
        }
        document.querySelectorAll('[data-shop-tab]').forEach(tabBtn => {
            const cat = tabBtn.getAttribute('data-shop-tab');
            if (cat === initialCategory) {
                tabBtn.classList.add('active');
            }
            else {
                tabBtn.classList.remove('active');
            }
        });
        this.renderShop(initialCategory);
        const shopModal = document.getElementById('shop-modal');
        if (shopModal)
            shopModal.style.display = 'flex';
    }
    // =========================================================================
    // EVENT LISTENERS E CONFIGURAÇÃO DOS CONTROLES
    // =========================================================================
    setupUIAndControls() {
        const loginScreen = document.getElementById('login-screen');
        const startSession = (name) => {
            loginScreen.style.display = 'none';
            this.initAudio();
            this.loadHubScene();
        };
        document.getElementById('login-btn').addEventListener('click', () => {
            const input = document.getElementById('username-input').value.trim();
            startSession(input || 'Racer_' + Math.floor(Math.random() * 1000));
        });
        document.getElementById('quick-login-btn').addEventListener('click', () => {
            startSession('Pro_Racer_2026');
        });
        document.getElementById('back-hub-btn').addEventListener('click', () => {
            this.loadHubScene();
        });
        document.getElementById('open-inventory-btn').addEventListener('click', () => {
            this.toggleInventoryModal();
        });
        document.getElementById('open-settings-btn').addEventListener('click', () => {
            this.openSettingsModal();
        });
        document.getElementById('close-shop-btn').addEventListener('click', () => {
            document.getElementById('shop-modal').style.display = 'none';
        });
        document.getElementById('close-inv-btn').addEventListener('click', () => {
            document.getElementById('inventory-modal').style.display = 'none';
        });
        document.getElementById('close-settings-btn').addEventListener('click', () => {
            document.getElementById('settings-modal').style.display = 'none';
        });
        document.getElementById('close-char-btn').addEventListener('click', () => {
            document.getElementById('character-modal').style.display = 'none';
        });
        document.getElementById('close-records-btn').addEventListener('click', () => {
            document.getElementById('records-modal').style.display = 'none';
        });
        document.getElementById('retry-race-btn').addEventListener('click', () => {
            this.loadRacingScene();
        });
        document.getElementById('finish-to-hub-btn').addEventListener('click', () => {
            this.loadHubScene();
        });
        document.getElementById('exit-shooting-btn')?.addEventListener('click', () => {
            this.loadHubScene();
        });
        document.getElementById('retry-shooting-btn')?.addEventListener('click', () => {
            this.loadShootingGalleryScene();
        });
        document.getElementById('shooting-to-hub-btn')?.addEventListener('click', () => {
            this.loadHubScene();
        });
        document.getElementById('exit-war-btn')?.addEventListener('click', () => {
            this.loadHubScene();
        });
        document.getElementById('retry-war-btn')?.addEventListener('click', () => {
            this.loadSnowballWarScene();
        });
        document.getElementById('war-to-hub-btn')?.addEventListener('click', () => {
            this.loadHubScene();
        });
        const sensSlider = document.getElementById('mouse-sens-slider');
        if (sensSlider) {
            sensSlider.addEventListener('input', (e) => {
                this.mouseSensMultiplier = parseFloat(e.target.value) || 1.0;
                const valSpan = document.getElementById('mouse-sens-val');
                if (valSpan)
                    valSpan.innerText = `${this.mouseSensMultiplier.toFixed(1)}x`;
                this.saveSettings();
            });
        }
        const invertBox = document.getElementById('invert-y-toggle');
        if (invertBox) {
            invertBox.addEventListener('change', (e) => {
                this.invertY = e.target.checked;
                this.saveSettings();
            });
        }
        const soundBox = document.getElementById('sound-fx-toggle');
        if (soundBox) {
            soundBox.addEventListener('change', (e) => {
                this.soundEnabled = e.target.checked;
                this.saveSettings();
            });
        }
        const resetSettingsBtn = document.getElementById('reset-settings-btn');
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                this.mouseSensMultiplier = 1.0;
                this.invertY = false;
                this.soundEnabled = true;
                this.saveSettings();
                this.openSettingsModal();
                this.showToast('Configurações restauradas com sucesso!', 'info');
            });
        }
        document.querySelectorAll('[data-char]').forEach(card => {
            card.addEventListener('click', (e) => {
                const charId = e.currentTarget.getAttribute('data-char');
                if (charId) {
                    this.selectedCharacter = charId;
                    this.saveSettings();
                    this.respawnPlayerMesh();
                    this.openCharacterModal();
                    const names = {
                        penguin: 'Pinguim Alpino',
                        frog: 'Sapo Verde',
                        cat: 'Gato Siamês',
                        dog: 'Cachorro Shih Tzu'
                    };
                    this.showToast(`Você se transformou em: ${names[charId]}! ✨`, 'success');
                }
            });
        });
        document.querySelectorAll('[data-shop-tab]').forEach(tabBtn => {
            tabBtn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-shop-tab]').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const cat = e.currentTarget.getAttribute('data-shop-tab');
                this.renderShop(cat);
            });
        });
        document.querySelectorAll('[data-inv-tab]').forEach(tabBtn => {
            tabBtn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-inv-tab]').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const cat = e.currentTarget.getAttribute('data-inv-tab');
                this.renderInventory(cat);
            });
        });
        document.getElementById('cable-car-prompt')?.addEventListener('click', () => this.startCableCarClimb());
        document.getElementById('garage-shop-prompt')?.addEventListener('click', () => this.openSegmentedShop('garage'));
        document.getElementById('hat-shop-prompt')?.addEventListener('click', () => this.openSegmentedShop('hats'));
        document.getElementById('atelier-shop-prompt')?.addEventListener('click', () => this.openSegmentedShop('atelier'));
        document.getElementById('records-prompt')?.addEventListener('click', () => this.openRecordsModal());
        document.getElementById('phone-booth-prompt')?.addEventListener('click', () => this.openCharacterModal());
        document.getElementById('sit-bench-prompt')?.addEventListener('click', () => this.sitOnNearestBench());
        document.getElementById('stand-up-prompt')?.addEventListener('click', () => this.standUpFromBench());
        document.getElementById('carnival-prompt')?.addEventListener('click', () => this.loadShootingGalleryScene());
        document.getElementById('snowball-war-prompt')?.addEventListener('click', () => this.loadSnowballWarScene());
        // Analógico Virtual
        const joystickBase = document.getElementById('joystick-base');
        joystickBase.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            this.initAudio();
            this.activeJoystickPointerId = e.pointerId;
            this.joystickActive = true;
            this.joystickStartX = e.clientX;
            this.joystickStartY = e.clientY;
            joystickBase.setPointerCapture(e.pointerId);
        });
        joystickBase.addEventListener('pointermove', (e) => {
            if (!this.joystickActive || e.pointerId !== this.activeJoystickPointerId)
                return;
            e.stopPropagation();
            const dx = e.clientX - this.joystickStartX;
            const dy = e.clientY - this.joystickStartY;
            const dist = Math.min(45, Math.sqrt(dx * dx + dy * dy));
            const angle = Math.atan2(dy, dx);
            this.joystickMoveX = (Math.cos(angle) * dist) / 45;
            this.joystickMoveY = -(Math.sin(angle) * dist) / 45;
            const knob = document.getElementById('joystick-knob');
            knob.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
        });
        const endJoystick = (e) => {
            if (e.pointerId === this.activeJoystickPointerId) {
                this.activeJoystickPointerId = null;
                this.joystickActive = false;
                this.joystickMoveX = 0;
                this.joystickMoveY = 0;
                const knob = document.getElementById('joystick-knob');
                knob.style.transform = `translate(0px, 0px)`;
            }
        };
        joystickBase.addEventListener('pointerup', endJoystick);
        joystickBase.addEventListener('pointercancel', endJoystick);
        // Bloqueio do Ponteiro do Mouse
        this.renderer.domElement.addEventListener('click', () => {
            this.initAudio();
            if ((this.currentScene === 'HUB' || this.currentScene === 'SNOWBALL_WAR' || this.currentScene === 'SHOOTING_GALLERY') && !this.isAnyModalOpen()) {
                if (!this.isPointerLocked) {
                    try {
                        this.renderer.domElement.requestPointerLock();
                    }
                    catch (err) { }
                }
            }
        });
        const updateCrosshairVisibility = () => {
            const crosshair = document.getElementById('hub-crosshair');
            if (crosshair) {
                const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth <= 860;
                const validScene = this.currentScene === 'HUB' || this.currentScene === 'SNOWBALL_WAR' || this.currentScene === 'SHOOTING_GALLERY';
                crosshair.style.display = (validScene && (this.isPointerLocked || isTouch)) ? 'block' : 'none';
            }
        };
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
            updateCrosshairVisibility();
        });
        // Rotação da Câmera com Mouse (Com suporte a ADS e multiplicador de mira)
        window.addEventListener('mousemove', (e) => {
            if (this.currentScene !== 'HUB' && this.currentScene !== 'SNOWBALL_WAR' && this.currentScene !== 'SHOOTING_GALLERY')
                return;
            if (this.isAnyModalOpen())
                return;
            if (this.isPointerLocked || this.isRightMouseDown || this.currentScene === 'SHOOTING_GALLERY') {
                const baseSens = 0.0024;
                let effectiveSens = baseSens * this.mouseSensMultiplier;
                if (this.isAimingDownSights)
                    effectiveSens *= 0.55;
                const invertFactor = this.invertY ? -1 : 1;
                this.cameraAngleY -= e.movementX * effectiveSens;
                this.cameraAngleX = Math.max(-0.65, Math.min(1.15, this.cameraAngleX + e.movementY * effectiveSens * invertFactor));
            }
        });
        // ROTAÇÃO DE CÂMERA POR TOQUE (TOUCH DRAG MOBILE)
        window.addEventListener('touchstart', (e) => {
            if (this.currentScene !== 'HUB' && this.currentScene !== 'SNOWBALL_WAR' && this.currentScene !== 'SHOOTING_GALLERY')
                return;
            if (this.isAnyModalOpen())
                return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const target = touch.target;
                if (target && target.closest('#joystick-ui, #jump-btn, #run-btn, #snowball-btn, #aim-btn, #interact-btn, .modal-card, .interactive-prompt, #settings-toggle-btn')) {
                    continue;
                }
                if (this.activeCameraTouchId === null) {
                    this.activeCameraTouchId = touch.identifier;
                    this.lastCameraTouchX = touch.clientX;
                    this.lastCameraTouchY = touch.clientY;
                    break;
                }
            }
        }, { passive: true });
        window.addEventListener('touchmove', (e) => {
            if (this.activeCameraTouchId === null)
                return;
            if (this.currentScene !== 'HUB' && this.currentScene !== 'SNOWBALL_WAR' && this.currentScene !== 'SHOOTING_GALLERY')
                return;
            if (this.isAnyModalOpen())
                return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.activeCameraTouchId) {
                    const dx = touch.clientX - this.lastCameraTouchX;
                    const dy = touch.clientY - this.lastCameraTouchY;
                    this.lastCameraTouchX = touch.clientX;
                    this.lastCameraTouchY = touch.clientY;
                    const touchSens = 0.0038 * this.mouseSensMultiplier;
                    const effectiveSens = this.isAimingDownSights ? touchSens * 0.55 : touchSens;
                    const invertFactor = this.invertY ? -1 : 1;
                    this.cameraAngleY -= dx * effectiveSens;
                    this.cameraAngleX = Math.max(-0.65, Math.min(1.15, this.cameraAngleX + dy * effectiveSens * invertFactor));
                    break;
                }
            }
        }, { passive: true });
        const endCameraTouch = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.activeCameraTouchId) {
                    this.activeCameraTouchId = null;
                    break;
                }
            }
        };
        window.addEventListener('touchend', endCameraTouch, { passive: true });
        window.addEventListener('touchcancel', endCameraTouch, { passive: true });
        // Arremesso Carregado (LMB) & Mira Tática / ADS (RMB)
        window.addEventListener('mousedown', (e) => {
            if (this.isAnyModalOpen())
                return;
            if (this.currentScene === 'SHOOTING_GALLERY') {
                if (e.button === 0) {
                    this.shootCarnivalToyGun();
                }
                return;
            }
            if (this.currentScene === 'HUB' || this.currentScene === 'SNOWBALL_WAR') {
                if (e.button === 2) {
                    this.isRightMouseDown = true;
                    this.isAimingDownSights = true;
                }
                else if (e.button === 0 && this.isPointerLocked) {
                    this.isChargingSnowball = true;
                    this.snowballChargeStartTime = performance.now();
                }
            }
        });
        window.addEventListener('mouseup', (e) => {
            if (e.button === 2) {
                this.isRightMouseDown = false;
                this.isAimingDownSights = false;
            }
            else if (e.button === 0) {
                if (this.isChargingSnowball) {
                    this.isChargingSnowball = false;
                    const chargeDuration = performance.now() - this.snowballChargeStartTime;
                    const chargeRatio = Math.min(1.0, Math.max(0.15, chargeDuration / 850));
                    this.throwSnowball(chargeRatio);
                    const chargeContainer = document.getElementById('snowball-charge-container');
                    if (chargeContainer)
                        chargeContainer.style.display = 'none';
                }
            }
        });
        window.addEventListener('contextmenu', (e) => {
            if (this.currentScene === 'HUB' || this.currentScene === 'SNOWBALL_WAR' || this.currentScene === 'SHOOTING_GALLERY') {
                e.preventDefault();
            }
        });
        window.addEventListener('wheel', (e) => {
            if (this.currentScene !== 'HUB' && this.currentScene !== 'SNOWBALL_WAR')
                return;
            this.cameraDistance = Math.max(3.2, Math.min(13.0, this.cameraDistance + e.deltaY * 0.006));
        }, { passive: true });
        // Pulo
        const triggerJump = () => {
            if (this.isSitting) {
                this.standUpFromBench();
                return;
            }
            if (!this.isJumping) {
                this.isJumping = true;
                this.jumpVelY = this.currentScene === 'RACING' ? 0.44 : 0.40;
                this.playJumpSound();
            }
        };
        const jumpBtn = document.getElementById('jump-btn');
        if (jumpBtn) {
            jumpBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                triggerJump();
            });
        }
        const runBtn = document.getElementById('run-btn');
        if (runBtn) {
            runBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                this.isRunning = !this.isRunning;
                runBtn.classList.toggle('active', this.isRunning);
            });
        }
        // Botão Mobile Dedicado: Bola de Neve / Disparo
        const snowballBtn = document.getElementById('snowball-btn');
        if (snowballBtn) {
            const handleSnowballPress = (e) => {
                e.stopPropagation();
                if (this.isAnyModalOpen())
                    return;
                this.initAudio();
                if (this.currentScene === 'SHOOTING_GALLERY') {
                    this.shootCarnivalToyGun();
                    return;
                }
                if (this.currentScene === 'HUB' || this.currentScene === 'SNOWBALL_WAR') {
                    this.isChargingSnowball = true;
                    this.snowballChargeStartTime = performance.now();
                    snowballBtn.classList.add('charging');
                    const chargeContainer = document.getElementById('snowball-charge-container');
                    if (chargeContainer)
                        chargeContainer.style.display = 'block';
                }
            };
            const handleSnowballRelease = (e) => {
                e.stopPropagation();
                snowballBtn.classList.remove('charging');
                if (this.isChargingSnowball) {
                    this.isChargingSnowball = false;
                    const chargeDuration = performance.now() - this.snowballChargeStartTime;
                    const chargeRatio = Math.min(1.0, Math.max(0.15, chargeDuration / 850));
                    this.throwSnowball(chargeRatio);
                    const chargeContainer = document.getElementById('snowball-charge-container');
                    if (chargeContainer)
                        chargeContainer.style.display = 'none';
                }
            };
            snowballBtn.addEventListener('pointerdown', handleSnowballPress);
            snowballBtn.addEventListener('pointerup', handleSnowballRelease);
            snowballBtn.addEventListener('pointercancel', handleSnowballRelease);
        }
        // Botão Mobile Dedicado: Mira ADS
        const aimBtn = document.getElementById('aim-btn');
        if (aimBtn) {
            aimBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                if (this.currentScene === 'HUB' || this.currentScene === 'SNOWBALL_WAR') {
                    this.isAimingDownSights = !this.isAimingDownSights;
                    aimBtn.classList.toggle('active', this.isAimingDownSights);
                    const crosshair = document.getElementById('hub-crosshair');
                    if (crosshair)
                        crosshair.classList.toggle('aiming', this.isAimingDownSights);
                }
            });
        }
        // Botão Mobile Dedicado: Interação Rápida
        const interactBtn = document.getElementById('interact-btn');
        if (interactBtn) {
            interactBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                this.triggerCurrentHubInteraction();
            });
        }
        // Teclado
        window.addEventListener('keydown', (e) => {
            this.initAudio();
            if (e.key === 'Tab' || e.code === 'Tab') {
                e.preventDefault();
                this.toggleInventoryModal();
                return;
            }
            if (e.key === 'o' || e.key === 'O') {
                e.preventDefault();
                const settingsModal = document.getElementById('settings-modal');
                if (settingsModal && settingsModal.style.display === 'flex') {
                    settingsModal.style.display = 'none';
                }
                else {
                    this.openSettingsModal();
                }
                return;
            }
            if (e.key === 'Escape') {
                if (this.isAnyModalOpen()) {
                    this.closeAllModals();
                    return;
                }
                if (this.currentScene === 'SHOOTING_GALLERY' || this.currentScene === 'SNOWBALL_WAR') {
                    this.loadHubScene();
                    return;
                }
            }
            if (this.isAnyModalOpen())
                return;
            // Se estiver sentado e tentar mover, levanta do banco
            if (this.isSitting) {
                if (['w', 'W', 's', 'S', 'a', 'A', 'd', 'D', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    this.standUpFromBench();
                }
            }
            if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp')
                this.keyW = true;
            if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown')
                this.keyS = true;
            if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft')
                this.keyA = true;
            if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight')
                this.keyD = true;
            if (e.key === 'Shift') {
                this.keyShift = true;
                this.isRunning = true;
            }
            if (e.key === ' ')
                triggerJump();
            // Tecla E para interações contextuais no Hub
            if ((e.key === 'e' || e.key === 'E') && this.currentScene === 'HUB') {
                this.triggerCurrentHubInteraction();
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp')
                this.keyW = false;
            if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown')
                this.keyS = false;
            if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft')
                this.keyA = false;
            if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight')
                this.keyD = false;
            if (e.key === 'Shift') {
                this.keyShift = false;
                this.isRunning = false;
            }
        });
    }
    triggerCurrentHubInteraction() {
        if (this.currentScene !== 'HUB')
            return;
        if (this.isSitting) {
            this.standUpFromBench();
        }
        else if (this.nearBench) {
            this.sitOnNearestBench();
        }
        else if (this.nearGarage) {
            this.openSegmentedShop('garage');
        }
        else if (this.nearHatShop) {
            this.openSegmentedShop('hats');
        }
        else if (this.nearAtelier) {
            this.openSegmentedShop('atelier');
        }
        else if (this.nearRecords) {
            this.openRecordsModal();
        }
        else if (this.nearPhoneBooth) {
            this.openCharacterModal();
        }
        else if (this.nearCableCar) {
            this.startCableCarClimb();
        }
        else if (this.nearCarnivalBooth) {
            this.loadShootingGalleryScene();
        }
        else if (this.nearSnowballWarPortal) {
            this.loadSnowballWarScene();
        }
    }
    sitOnNearestBench() {
        if (!this.nearBench)
            return;
        this.isSitting = true;
        this.currentBench = this.nearBench;
        this.playerPosX = this.nearBench.x;
        this.playerPosZ = this.nearBench.z;
        this.playerPosY = 0.52;
        this.playerGroup.rotation.y = this.nearBench.rotY;
        const sitPrompt = document.getElementById('sit-bench-prompt');
        if (sitPrompt)
            sitPrompt.style.display = 'none';
        const standPrompt = document.getElementById('stand-up-prompt');
        if (standPrompt)
            standPrompt.style.display = 'block';
        this.showToast('Você se sentou no banco para descansar!', 'info');
    }
    standUpFromBench() {
        if (!this.isSitting || !this.currentBench)
            return;
        this.isSitting = false;
        this.playerPosY = 0;
        this.playerPosX += Math.sin(this.currentBench.rotY) * 0.95;
        this.playerPosZ += Math.cos(this.currentBench.rotY) * 0.95;
        this.currentBench = null;
        const standPrompt = document.getElementById('stand-up-prompt');
        if (standPrompt)
            standPrompt.style.display = 'none';
    }
    // =========================================================================
    // GAME LOOP PRINCIPAL
    // =========================================================================
    loop = () => {
        requestAnimationFrame(this.loop);
        // Interpolação suave do FOV para mira tática (ADS)
        const targetFov = (this.currentScene === 'HUB' || this.currentScene === 'SNOWBALL_WAR') && this.isAimingDownSights ? 46 : 75;
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.16);
        this.camera.updateProjectionMatrix();
        // Atualiza classe do retículo para mira tática
        const crosshairEl = document.getElementById('hub-crosshair');
        if (crosshairEl) {
            crosshairEl.classList.toggle('aiming', this.isAimingDownSights);
        }
        if (this.throwAnimTimer > 0) {
            this.throwAnimTimer--;
        }
        // Atualiza barra de carga da força de arremesso
        if (this.isChargingSnowball) {
            const duration = performance.now() - this.snowballChargeStartTime;
            const ratio = Math.min(1.0, Math.max(0.15, duration / 850));
            this.currentChargeRatio = ratio;
            const pct = Math.round(ratio * 100);
            const container = document.getElementById('snowball-charge-container');
            const fill = document.getElementById('snowball-charge-fill');
            const txt = document.getElementById('snowball-charge-text');
            if (container)
                container.style.display = 'block';
            if (fill)
                fill.style.width = `${pct}%`;
            if (txt) {
                if (pct >= 85) {
                    txt.innerText = `FORÇA: ${pct}% ❄️ TIRO RETO!`;
                }
                else if (pct >= 50) {
                    txt.innerText = `FORÇA: ${pct}% ⚡ RÁPIDO`;
                }
                else {
                    txt.innerText = `FORÇA: ${pct}% 🏹 ARCO`;
                }
            }
        }
        let inputForward = 0;
        let inputLateral = 0;
        if (this.keyW)
            inputForward += 1;
        if (this.keyS)
            inputForward -= 1;
        if (this.keyA)
            inputLateral -= 1;
        if (this.keyD)
            inputLateral += 1;
        if (this.joystickActive) {
            inputForward = this.joystickMoveY;
            inputLateral = this.joystickMoveX;
        }
        if (this.currentScene === 'HUB') {
            // Atualização dos NPCs autônomos circulando pela praça
            this.updateWanderingNPCs();
            // Atualização das bolas de neve atiradas e dos estilhaços/desmanche
            this.updateSnowballs();
            this.updateSnowballBursts();
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
                    const resolved = this.resolveHubCollisions(desiredX, desiredZ, 0.85);
                    this.playerPosX = resolved.x;
                    this.playerPosZ = resolved.z;
                    // Se mirando/carregando/jogando, alinha sempre para onde a câmera está apontando
                    if (this.isAimingDownSights || this.isChargingSnowball || this.throwAnimTimer > 0) {
                        const targetRotY = this.cameraAngleY + Math.PI;
                        let diffRot = targetRotY - this.playerGroup.rotation.y;
                        while (diffRot > Math.PI)
                            diffRot -= Math.PI * 2;
                        while (diffRot < -Math.PI)
                            diffRot += Math.PI * 2;
                        this.playerGroup.rotation.y += diffRot * 0.35;
                    }
                    else {
                        const targetRotY = Math.atan2(moveWorldX, moveWorldZ);
                        let diffRot = targetRotY - this.playerGroup.rotation.y;
                        while (diffRot > Math.PI)
                            diffRot -= Math.PI * 2;
                        while (diffRot < -Math.PI)
                            diffRot += Math.PI * 2;
                        this.playerGroup.rotation.y += diffRot * 0.22;
                    }
                    this.walkTime += running ? 0.30 : 0.18;
                    this.animateCharacterWalk(this.walkTime, running);
                    if (Math.random() < 0.22) {
                        this.addContinuousSnowTrail(this.playerPosX, this.playerPosY, this.playerPosZ, this.playerGroup.rotation.y);
                    }
                }
                else {
                    if (this.isAimingDownSights || this.isChargingSnowball || this.throwAnimTimer > 0) {
                        const targetRotY = this.cameraAngleY + Math.PI;
                        let diffRot = targetRotY - this.playerGroup.rotation.y;
                        while (diffRot > Math.PI)
                            diffRot -= Math.PI * 2;
                        while (diffRot < -Math.PI)
                            diffRot += Math.PI * 2;
                        this.playerGroup.rotation.y += diffRot * 0.35;
                    }
                    this.animateCharacterIdle();
                }
                // Pulo flutuante no Hub
                if (this.isJumping) {
                    this.playerPosY += this.jumpVelY;
                    this.jumpVelY -= 0.022;
                    if (this.playerPosY <= 0) {
                        this.playerPosY = 0;
                        this.isJumping = false;
                        this.jumpVelY = 0;
                        this.emitSnowSpray(6, 0);
                    }
                }
            }
            else {
                // Personagem sentado descansando
                this.animateCharacterIdle();
            }
            this.playerGroup.position.set(this.playerPosX, this.playerPosY, this.playerPosZ);
            // Verificação de Proximidade: Bancos de Madeira
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
                if (sitPrompt) {
                    sitPrompt.style.display = this.nearBench ? 'block' : 'none';
                }
            }
            // Verificação de Proximidade: Bondinho
            const distCableCar = this.cableCarStationPos.distanceTo(new THREE.Vector3(this.playerPosX, 0, this.playerPosZ));
            const cableCarPrompt = document.getElementById('cable-car-prompt');
            if (cableCarPrompt) {
                this.nearCableCar = distCableCar < 6.5;
                cableCarPrompt.style.display = (this.nearCableCar && !this.isSitting) ? 'block' : 'none';
            }
            // Verificação de Proximidade: Garagem Alpina
            const distGarage = this.garageCounterPos.distanceTo(new THREE.Vector3(this.playerPosX, 0, this.playerPosZ));
            const garagePrompt = document.getElementById('garage-shop-prompt');
            if (garagePrompt) {
                this.nearGarage = distGarage < 4.5;
                garagePrompt.style.display = (this.nearGarage && !this.isSitting) ? 'block' : 'none';
            }
            // Verificação de Proximidade: Boutique dos Gorros
            const distHat = this.hatShopCounterPos.distanceTo(new THREE.Vector3(this.playerPosX, 0, this.playerPosZ));
            const hatPrompt = document.getElementById('hat-shop-prompt');
            if (hatPrompt) {
                this.nearHatShop = distHat < 4.5;
                hatPrompt.style.display = (this.nearHatShop && !this.isSitting) ? 'block' : 'none';
            }
            // Verificação de Proximidade: Ateliê da Montanha
            const distAtelier = this.atelierCounterPos.distanceTo(new THREE.Vector3(this.playerPosX, 0, this.playerPosZ));
            const atelierPrompt = document.getElementById('atelier-shop-prompt');
            if (atelierPrompt) {
                this.nearAtelier = distAtelier < 4.5;
                atelierPrompt.style.display = (this.nearAtelier && !this.isSitting) ? 'block' : 'none';
            }
            // Verificação de Proximidade: Quadro de Recordes da Taverna
            const distRecords = this.recordsBoardPos.distanceTo(new THREE.Vector3(this.playerPosX, 0, this.playerPosZ));
            const recordsPrompt = document.getElementById('records-prompt');
            if (recordsPrompt) {
                this.nearRecords = distRecords < 4.2;
                recordsPrompt.style.display = (this.nearRecords && !this.isSitting) ? 'block' : 'none';
            }
            // Verificação de Proximidade: Cabine Telefônica
            const distPhone = this.phoneBoothPos.distanceTo(new THREE.Vector3(this.playerPosX, 0, this.playerPosZ));
            const phonePrompt = document.getElementById('phone-booth-prompt');
            if (phonePrompt) {
                this.nearPhoneBooth = distPhone < 3.2;
                phonePrompt.style.display = (this.nearPhoneBooth && !this.isSitting) ? 'block' : 'none';
            }
            // Verificação de Proximidade: Estande de Tiro Festivo
            const distCarnival = this.carnivalBoothPos.distanceTo(new THREE.Vector3(this.playerPosX, 0, this.playerPosZ));
            const carnivalPrompt = document.getElementById('carnival-prompt');
            if (carnivalPrompt) {
                this.nearCarnivalBooth = distCarnival < 5.5;
                carnivalPrompt.style.display = (this.nearCarnivalBooth && !this.isSitting) ? 'block' : 'none';
            }
            // Verificação de Proximidade: Arena de Guerra de Neve
            const distWar = this.snowballWarPortalPos.distanceTo(new THREE.Vector3(this.playerPosX, 0, this.playerPosZ));
            const warPrompt = document.getElementById('snowball-war-prompt');
            if (warPrompt) {
                this.nearSnowballWarPortal = distWar < 5.5;
                warPrompt.style.display = (this.nearSnowballWarPortal && !this.isSitting) ? 'block' : 'none';
            }
            // Atualização do Botão de Interação Rápida Mobile
            const hasInteraction = (this.isSitting || this.nearBench || this.nearGarage || this.nearHatShop || this.nearAtelier || this.nearRecords || this.nearPhoneBooth || this.nearCableCar || this.nearCarnivalBooth || this.nearSnowballWarPortal);
            const interactBtn = document.getElementById('interact-btn');
            if (interactBtn) {
                interactBtn.style.display = hasInteraction ? 'flex' : 'none';
                if (this.isSitting) {
                    interactBtn.innerHTML = '🚶 LEVANTAR';
                }
                else if (this.nearBench) {
                    interactBtn.innerHTML = '🪑 SENTAR';
                }
                else if (this.nearGarage || this.nearHatShop || this.nearAtelier) {
                    interactBtn.innerHTML = '🛍️ LOJA';
                }
                else if (this.nearPhoneBooth) {
                    interactBtn.innerHTML = '📞 CABINE';
                }
                else if (this.nearCableCar) {
                    interactBtn.innerHTML = '🚠 CORRIDA';
                }
                else if (this.nearCarnivalBooth) {
                    interactBtn.innerHTML = '🎯 TIRO';
                }
                else if (this.nearSnowballWarPortal) {
                    interactBtn.innerHTML = '❄️ GUERRA';
                }
                else if (this.nearRecords) {
                    interactBtn.innerHTML = '🏆 RECORDES';
                }
            }
            // Animação dos NPCs Lojistas
            const now = Date.now();
            if (this.npcRalph)
                this.npcRalph.rotation.y = Math.sin(now * 0.002) * 0.15;
            if (this.npcBabette)
                this.npcBabette.rotation.y = Math.sin(now * 0.0025 + 1.0) * 0.15;
            if (this.npcBoris)
                this.npcBoris.rotation.y = Math.sin(now * 0.0018 + 2.0) * 0.15;
            // Animação das fagulhas da fogueira
            if (this.bonfireEmbers && this.bonfireLight) {
                this.bonfireLight.intensity = 2.4 + Math.sin(now * 0.01) * 0.4;
                const posArr = this.bonfireEmbers.geometry.getAttribute('position').array;
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
            // Câmera terceira pessoa (com ADS sobre o ombro)
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
            this.camera.lookAt(this.playerPosX + rightCamX * (this.isAimingDownSights ? 0.8 : 0.5), targetLookY, this.playerPosZ + rightCamZ * (this.isAimingDownSights ? 0.8 : 0.5));
        }
        else if (this.currentScene === 'SNOWBALL_WAR') {
            // Atualização dos bots e das bolas de neve na arena
            this.updateSnowballWar();
            this.updateSnowballs();
            this.updateSnowballBursts();
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
                const resolved = this.resolveWarCollisions(desiredX, desiredZ, 0.65);
                this.playerPosX = resolved.x;
                this.playerPosZ = resolved.z;
                // Na arena de guerra, mira tática: alinha sempre com a mira da câmera ao mirar/carregar/jogar
                if (this.isAimingDownSights || this.isChargingSnowball || this.throwAnimTimer > 0) {
                    const targetRotY = this.cameraAngleY + Math.PI;
                    let diffRot = targetRotY - this.playerGroup.rotation.y;
                    while (diffRot > Math.PI)
                        diffRot -= Math.PI * 2;
                    while (diffRot < -Math.PI)
                        diffRot += Math.PI * 2;
                    this.playerGroup.rotation.y += diffRot * 0.35;
                }
                else {
                    const targetRotY = Math.atan2(moveWorldX, moveWorldZ);
                    let diffRot = targetRotY - this.playerGroup.rotation.y;
                    while (diffRot > Math.PI)
                        diffRot -= Math.PI * 2;
                    while (diffRot < -Math.PI)
                        diffRot += Math.PI * 2;
                    this.playerGroup.rotation.y += diffRot * 0.25;
                }
                this.walkTime += running ? 0.30 : 0.18;
                this.animateCharacterWalk(this.walkTime, running);
                if (Math.random() < 0.22) {
                    this.addContinuousSnowTrail(this.playerPosX, this.playerPosY, this.playerPosZ, this.playerGroup.rotation.y);
                }
            }
            else {
                if (this.isAimingDownSights || this.isChargingSnowball || this.throwAnimTimer > 0) {
                    const targetRotY = this.cameraAngleY + Math.PI;
                    let diffRot = targetRotY - this.playerGroup.rotation.y;
                    while (diffRot > Math.PI)
                        diffRot -= Math.PI * 2;
                    while (diffRot < -Math.PI)
                        diffRot += Math.PI * 2;
                    this.playerGroup.rotation.y += diffRot * 0.35;
                }
                this.animateCharacterIdle();
            }
            // Pulo na arena de guerra
            if (this.isJumping) {
                this.playerPosY += this.jumpVelY;
                this.jumpVelY -= 0.022;
                if (this.playerPosY <= 0) {
                    this.playerPosY = 0;
                    this.isJumping = false;
                    this.jumpVelY = 0;
                    this.emitSnowSpray(6, 0);
                }
            }
            this.playerGroup.position.set(this.playerPosX, this.playerPosY, this.playerPosZ);
            // Câmera terceira pessoa na arena de guerra (com ADS)
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
            this.camera.lookAt(this.playerPosX + rightCamX * (this.isAimingDownSights ? 0.8 : 0.5), targetLookY, this.playerPosZ + rightCamZ * (this.isAimingDownSights ? 0.8 : 0.5));
            if (this.snowParticles) {
                this.snowParticles.position.x = this.playerPosX;
                this.snowParticles.position.z = this.playerPosZ;
            }
        }
        else if (this.currentScene === 'SHOOTING_GALLERY') {
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
        }
        else if (this.currentScene === 'RACING') {
            // Física da descida na montanha
            if (!this.isRaceFinished) {
                const baseCruise = 0.48;
                if (this.playerVelZ < baseCruise) {
                    this.playerVelZ += 0.0015;
                }
                if (inputForward > 0.1) {
                    this.playerVelZ = Math.min(0.68, this.playerVelZ + 0.004);
                }
                else if (inputForward < -0.1) {
                    this.playerVelZ = Math.max(0.18, this.playerVelZ - 0.012);
                    this.emitSnowSpray(4, 0);
                }
                const steeringSensitivity = 0.046;
                this.playerVelX -= inputLateral * steeringSensitivity;
                this.playerVelX *= 0.88;
                this.playerVelX = Math.max(-0.48, Math.min(0.48, this.playerVelX));
                this.playerPosX += this.playerVelX;
                this.playerPosZ += this.playerVelZ;
                if (this.playerPosX < -23.5) {
                    this.playerPosX = -23.5;
                    this.playerVelX = 0;
                }
                if (this.playerPosX > 23.5) {
                    this.playerPosX = 23.5;
                    this.playerVelX = 0;
                }
                if (this.playerPosZ >= this.raceTrackLength) {
                    this.finishRace();
                }
            }
            else {
                this.playerVelZ *= 0.96;
                this.playerPosZ += this.playerVelZ;
                this.updateConfetti();
            }
            // Salto
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
            }
            else {
                this.playerGroup.rotation.z = -this.playerVelX * 0.92;
                this.playerGroup.rotation.y = this.playerVelX * 0.38;
                this.playerGroup.rotation.x = 0.08;
            }
            this.playerGroup.position.set(this.playerPosX, this.playerPosY, this.playerPosZ);
            // Rastro e Spray
            if (this.playerPosY === 0) {
                this.addContinuousSnowTrail(this.playerPosX, this.playerPosY, this.playerPosZ, this.playerGroup.rotation.y);
                const isCarving = Math.abs(this.playerVelX) > 0.06;
                this.emitSnowSpray(isCarving ? 3 : 1, this.playerVelX);
            }
            else {
                this.prevTrailLeft = null;
                this.prevTrailRight = null;
            }
            this.updateSnowSpray();
            // Colisão de Slalom
            for (const gate of this.gates) {
                if (!gate.passed && Math.abs(this.playerPosZ - gate.z) < 2.2) {
                    if (Math.abs(this.playerPosX - gate.x) < 3.0) {
                        gate.passed = true;
                        this.gatesCleared++;
                        this.score += 100;
                        this.currency += 10;
                        this.updateCoinsDisplay();
                        this.emitSnowSpray(14, 0);
                        this.playSlalomChime();
                        if (gate.leftLight && gate.rightLight) {
                            gate.leftLight.material.color.setHex(0x22c55e);
                            gate.rightLight.material.color.setHex(0x22c55e);
                        }
                        const popup = document.getElementById('slalom-popup');
                        if (popup) {
                            popup.style.display = 'block';
                            setTimeout(() => { popup.style.display = 'none'; }, 600);
                        }
                        const slalomHudVal = document.getElementById('slalom-hud-val');
                        if (slalomHudVal)
                            slalomHudVal.innerText = this.gatesCleared.toString();
                    }
                }
            }
            // Colisão com Rampas de Salto
            for (const ramp of this.ramps) {
                if (!this.isJumping && Math.abs(this.playerPosZ - ramp.z) < 2.0) {
                    if (Math.abs(this.playerPosX - ramp.x) < 2.4) {
                        this.isJumping = true;
                        this.jumpVelY = 0.58;
                        this.score += 150;
                        this.currency += 15;
                        this.updateCoinsDisplay();
                        this.emitSnowSpray(14, 0);
                        this.playJumpSound();
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
            if (!this.isRaceFinished) {
                this.score += Math.round(this.playerVelZ * 3.5);
            }
            const scoreEl = document.getElementById('score-val');
            if (scoreEl)
                scoreEl.innerText = this.score.toString();
            const speedEl = document.getElementById('speed-val');
            if (speedEl)
                speedEl.innerText = Math.round(this.playerVelZ * 80).toString();
            // Câmera Chase 3ª Pessoa
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
    };
}
window.addEventListener('DOMContentLoaded', () => {
    new SnowSlideTPSMasterEngine();
});
