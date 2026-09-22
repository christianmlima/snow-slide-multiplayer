import * as THREE from 'three';
const GAME_VERSION = "v2.1.0-STABLE";
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
    // Sistema de Bolas de Neve
    snowballs = [];
    lastSnowballTime = 0;
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
    // Posições de Interação no Hub
    garagePos = new THREE.Vector3(-24, 0, -18);
    garageCounterPos = new THREE.Vector3(-24, 0, -15.5);
    hatShopPos = new THREE.Vector3(-24, 0, 18);
    hatShopCounterPos = new THREE.Vector3(-24, 0, 15.5);
    atelierPos = new THREE.Vector3(6, 0, 24);
    atelierCounterPos = new THREE.Vector3(6, 0, 21.5);
    tavernPos = new THREE.Vector3(26, 0, 14);
    recordsBoardPos = new THREE.Vector3(26, 0, 12);
    phoneBoothPos = new THREE.Vector3(8, 0, -4);
    cableCarStationPos = new THREE.Vector3(22, 0, -18);
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
    previousTouchX = 0;
    previousTouchY = 0;
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
    playSnowThrowSound() {
        if (!this.soundEnabled)
            return;
        this.playTone(480, 'sine', 0.08, 0.15);
    }
    playSnowSplatSound() {
        if (!this.soundEnabled)
            return;
        this.playTone(180, 'triangle', 0.12, 0.25);
        setTimeout(() => this.playTone(90, 'sine', 0.14, 0.2), 30);
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
    // 1. PINGUIM ALPINO
    createDetailedPenguin() {
        const root = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
        const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
        this.charTorso = new THREE.Group();
        // Corpo
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.44, 0.65, 14, 14), bodyMat);
        body.position.y = 0.68;
        body.castShadow = true;
        this.charTorso.add(body);
        // Barriga branca
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), whiteMat);
        belly.position.set(0, 0.64, 0.24);
        belly.scale.set(0.82, 1.05, 0.5);
        this.charTorso.add(belly);
        // Cabeça
        this.charHead = new THREE.Group();
        this.charHead.position.y = 1.22;
        const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 16), bodyMat);
        headMesh.castShadow = true;
        this.charHead.add(headMesh);
        // Bico laranja
        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.32, 8), orangeMat);
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, -0.04, 0.44);
        this.charHead.add(beak);
        // Olhos
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
            this.charHead.add(eye, pupil, glint);
            const blush = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.08), new THREE.MeshBasicMaterial({ color: 0xfb7185, transparent: true, opacity: 0.65 }));
            blush.position.set(side * 0.24, -0.04, 0.28);
            blush.rotation.y = side * 0.3;
            this.charHead.add(blush);
        }
        this.attachEquippedHat(this.charHead);
        this.attachEquippedGoggles(this.charHead);
        this.charTorso.add(this.charHead);
        this.attachEquippedScarf(this.charTorso);
        // Asas
        this.charArmL = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.48, 8, 8), bodyMat);
        this.charArmL.position.set(-0.50, 0.66, 0.02);
        this.charArmL.rotation.set(-0.2, 0, 0.42);
        this.charArmL.scale.set(1.1, 1.0, 0.4);
        this.charArmR = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.48, 8, 8), bodyMat);
        this.charArmR.position.set(0.50, 0.66, 0.02);
        this.charArmR.rotation.set(-0.2, 0, -0.42);
        this.charArmR.scale.set(1.1, 1.0, 0.4);
        this.charTorso.add(this.charArmL, this.charArmR);
        root.add(this.charTorso);
        // Patas
        this.charFootL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.38), orangeMat);
        this.charFootL.position.set(-0.24, 0.06, 0.12);
        this.charFootL.castShadow = true;
        this.charFootR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.38), orangeMat);
        this.charFootR.position.set(0.24, 0.06, 0.12);
        this.charFootR.castShadow = true;
        root.add(this.charFootL, this.charFootR);
        this.charTail = null;
        return root;
    }
    // 2. SAPO VERDE
    createDetailedFrog() {
        const root = new THREE.Group();
        const frogGreenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.35 });
        const frogBellyMat = new THREE.MeshStandardMaterial({ color: 0xd9f99d, roughness: 0.5 });
        const eyeGoldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2 });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.charTorso = new THREE.Group();
        // Tronco rechonchudo do sapo
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 16), frogGreenMat);
        body.scale.set(1.1, 0.88, 1.0);
        body.position.y = 0.58;
        body.castShadow = true;
        this.charTorso.add(body);
        // Barriga macia amarelada
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 14), frogBellyMat);
        belly.position.set(0, 0.54, 0.20);
        belly.scale.set(0.9, 0.8, 0.5);
        this.charTorso.add(belly);
        // Cabeça larga de sapo
        this.charHead = new THREE.Group();
        this.charHead.position.y = 1.05;
        const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), frogGreenMat);
        headMesh.scale.set(1.2, 0.75, 1.1);
        headMesh.castShadow = true;
        this.charHead.add(headMesh);
        // Olhos bulbosos proeminentes no topo da cabeça
        for (const side of [-1, 1]) {
            const eyeSocket = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), frogGreenMat);
            eyeSocket.position.set(side * 0.24, 0.24, 0.15);
            this.charHead.add(eyeSocket);
            const eyeGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), eyeGoldMat);
            eyeGlobe.position.set(side * 0.24, 0.26, 0.22);
            const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), pupilMat);
            pupil.position.set(side * 0.24, 0.26, 0.34);
            const glint = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            glint.position.set(side * 0.22, 0.28, 0.35);
            this.charHead.add(eyeGlobe, pupil, glint);
        }
        // Sorriso largo de sapo
        const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.02, 6, 14, Math.PI * 0.7), new THREE.MeshBasicMaterial({ color: 0x14532d }));
        mouth.rotation.set(Math.PI * 0.85, 0, Math.PI * 0.15);
        mouth.position.set(0, -0.06, 0.44);
        this.charHead.add(mouth);
        this.attachEquippedHat(this.charHead);
        this.attachEquippedGoggles(this.charHead);
        this.charTorso.add(this.charHead);
        this.attachEquippedScarf(this.charTorso);
        // Braços verdes com mãos espalmadas
        this.charArmL = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.45, 8, 8), frogGreenMat);
        this.charArmL.position.set(-0.52, 0.58, 0.1);
        this.charArmL.rotation.set(0.1, 0, 0.35);
        this.charArmR = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.45, 8, 8), frogGreenMat);
        this.charArmR.position.set(0.52, 0.58, 0.1);
        this.charArmR.rotation.set(0.1, 0, -0.35);
        this.charTorso.add(this.charArmL, this.charArmR);
        root.add(this.charTorso);
        // Patas traseiras de sapo
        this.charFootL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.42), frogGreenMat);
        this.charFootL.position.set(-0.28, 0.05, 0.14);
        this.charFootL.castShadow = true;
        this.charFootR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.42), frogGreenMat);
        this.charFootR.position.set(0.28, 0.05, 0.14);
        this.charFootR.castShadow = true;
        root.add(this.charFootL, this.charFootR);
        this.charTail = null;
        return root;
    }
    // 3. GATO SIAMÊS
    createDetailedCat() {
        const root = new THREE.Group();
        const furCreamMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 });
        const sealBrownMat = new THREE.MeshStandardMaterial({ color: 0x3b1d11, roughness: 0.5 });
        const innerEarPinkMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 });
        const sapphireEyeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.2 });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.charTorso = new THREE.Group();
        // Tronco gracioso de gato
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.62, 14, 14), furCreamMat);
        body.position.y = 0.64;
        body.castShadow = true;
        this.charTorso.add(body);
        // Cabeça felina com máscara marrom escura (padrão siamês)
        this.charHead = new THREE.Group();
        this.charHead.position.y = 1.18;
        const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), furCreamMat);
        headMesh.castShadow = true;
        this.charHead.add(headMesh);
        const mask = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), sealBrownMat);
        mask.scale.set(1.05, 0.85, 0.65);
        mask.position.set(0, -0.04, 0.22);
        this.charHead.add(mask);
        // Focinho e nariz rosa
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.06, 5), innerEarPinkMat);
        nose.rotation.x = -Math.PI / 2;
        nose.position.set(0, -0.02, 0.40);
        this.charHead.add(nose);
        // Orelhas triangulares siamesas
        for (const side of [-1, 1]) {
            const ear = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.26, 4), sealBrownMat);
            ear.position.set(side * 0.22, 0.36, 0.02);
            ear.rotation.set(0.1, 0, -side * 0.32);
            const innerEar = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 4), innerEarPinkMat);
            innerEar.position.set(side * 0.21, 0.34, 0.06);
            innerEar.rotation.set(0.1, 0, -side * 0.32);
            this.charHead.add(ear, innerEar);
            // Olhos amendoados de safira
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), sapphireEyeMat);
            eye.position.set(side * 0.12, 0.05, 0.31);
            const pupil = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.08, 4, 4), pupilMat);
            pupil.position.set(side * 0.12, 0.05, 0.37);
            const glint = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            glint.position.set(side * 0.10 + 0.015, 0.07, 0.385);
            this.charHead.add(eye, pupil, glint);
        }
        this.attachEquippedHat(this.charHead);
        this.attachEquippedGoggles(this.charHead);
        this.charTorso.add(this.charHead);
        this.attachEquippedScarf(this.charTorso);
        // Patinhas dianteiras escuras
        this.charArmL = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.46, 8, 8), sealBrownMat);
        this.charArmL.position.set(-0.42, 0.58, 0.08);
        this.charArmL.rotation.set(-0.15, 0, 0.3);
        this.charArmR = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.46, 8, 8), sealBrownMat);
        this.charArmR.position.set(0.42, 0.58, 0.08);
        this.charArmR.rotation.set(-0.15, 0, -0.3);
        this.charTorso.add(this.charArmL, this.charArmR);
        // Cauda longa elegante siamesa
        this.charTail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.75, 8), sealBrownMat);
        this.charTail.position.set(0, 0.45, -0.45);
        this.charTail.rotation.set(-0.95, 0, 0);
        this.charTorso.add(this.charTail);
        root.add(this.charTorso);
        // Patas traseiras marrom escuras
        this.charFootL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.34), sealBrownMat);
        this.charFootL.position.set(-0.20, 0.06, 0.10);
        this.charFootL.castShadow = true;
        this.charFootR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.34), sealBrownMat);
        this.charFootR.position.set(0.20, 0.06, 0.10);
        this.charFootR.castShadow = true;
        root.add(this.charFootL, this.charFootR);
        return root;
    }
    // 4. CACHORRO SHIH TZU
    createDetailedDog() {
        const root = new THREE.Group();
        const caramelMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
        const whiteFurMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });
        const noseBlackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
        const eyeBrownMat = new THREE.MeshStandardMaterial({ color: 0x27170a, roughness: 0.2 });
        this.charTorso = new THREE.Group();
        // Tronco peludo caramelo com peitoral branco
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.64, 14, 14), caramelMat);
        body.position.y = 0.65;
        body.castShadow = true;
        this.charTorso.add(body);
        const chestFur = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 12), whiteFurMat);
        chestFur.position.set(0, 0.66, 0.20);
        chestFur.scale.set(0.9, 0.95, 0.6);
        this.charTorso.add(chestFur);
        // Cabeça fofa de Shih Tzu
        this.charHead = new THREE.Group();
        this.charHead.position.y = 1.20;
        const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), caramelMat);
        headMesh.castShadow = true;
        this.charHead.add(headMesh);
        // Focinho achatado branco
        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.22), whiteFurMat);
        snout.position.set(0, -0.05, 0.32);
        this.charHead.add(snout);
        // Nariz botão preto
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), noseBlackMat);
        nose.position.set(0, 0.02, 0.44);
        this.charHead.add(nose);
        // Orelhas caídas e peludas (assinatura do Shih Tzu)
        for (const side of [-1, 1]) {
            const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.44, 8, 8), caramelMat);
            ear.position.set(side * 0.38, 0.08, 0.06);
            ear.rotation.set(0.2, 0, side * 0.15);
            this.charHead.add(ear);
            // Olhos expressivos castanhos
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), eyeBrownMat);
            eye.position.set(side * 0.13, 0.08, 0.33);
            const glint = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            glint.position.set(side * 0.115, 0.10, 0.39);
            this.charHead.add(eye, glint);
        }
        this.attachEquippedHat(this.charHead);
        this.attachEquippedGoggles(this.charHead);
        this.charTorso.add(this.charHead);
        this.attachEquippedScarf(this.charTorso);
        // Patinhas dianteiras fofas brancas
        this.charArmL = new THREE.Mesh(new THREE.CapsuleGeometry(0.10, 0.46, 8, 8), whiteFurMat);
        this.charArmL.position.set(-0.46, 0.58, 0.06);
        this.charArmL.rotation.set(-0.15, 0, 0.28);
        this.charArmR = new THREE.Mesh(new THREE.CapsuleGeometry(0.10, 0.46, 8, 8), whiteFurMat);
        this.charArmR.position.set(0.46, 0.58, 0.06);
        this.charArmR.rotation.set(-0.15, 0, -0.28);
        this.charTorso.add(this.charArmL, this.charArmR);
        // Rabinho pom-pom enrolado nas costas
        this.charTail = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), whiteFurMat);
        this.charTail.position.set(0, 0.72, -0.42);
        this.charTail.scale.set(0.9, 1.2, 1.0);
        this.charTorso.add(this.charTail);
        root.add(this.charTorso);
        // Patas traseiras brancas
        this.charFootL = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.10, 0.35), whiteFurMat);
        this.charFootL.position.set(-0.22, 0.06, 0.10);
        this.charFootL.castShadow = true;
        this.charFootR = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.10, 0.35), whiteFurMat);
        this.charFootR.position.set(0.22, 0.06, 0.10);
        this.charFootR.castShadow = true;
        root.add(this.charFootL, this.charFootR);
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
        switch (this.selectedCharacter) {
            case 'frog':
                return this.createDetailedFrog();
            case 'cat':
                return this.createDetailedCat();
            case 'dog':
                return this.createDetailedDog();
            case 'penguin':
            default:
                return this.createDetailedPenguin();
        }
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
    }
    // Animação Procedural de Caminhada / Corrida para Todos os Personagens
    animateCharacterWalk(time, running) {
        if (!this.charFootL || !this.charFootR || !this.charTorso)
            return;
        const freq = running ? 1.6 : 1.0;
        const t = time * freq;
        this.charFootL.position.z = Math.sin(t) * 0.24;
        this.charFootL.position.y = Math.max(0, Math.cos(t) * 0.14);
        this.charFootR.position.z = -Math.sin(t) * 0.24;
        this.charFootR.position.y = Math.max(0, -Math.cos(t) * 0.14);
        this.charTorso.rotation.z = Math.sin(t) * (running ? 0.20 : 0.14);
        this.charTorso.position.y = Math.abs(Math.sin(t * 2)) * 0.05;
        if (this.charArmL && this.charArmR) {
            this.charArmL.rotation.z = 0.42 + Math.sin(t) * 0.25;
            this.charArmR.rotation.z = -0.42 + Math.sin(t) * 0.25;
        }
        if (this.charTail) {
            this.charTail.rotation.y = Math.sin(t * 1.8) * 0.35;
        }
        if (this.charScarfTail) {
            this.charScarfTail.rotation.y = 0.25 + Math.sin(t * 1.5) * 0.25;
        }
    }
    animateCharacterIdle() {
        if (!this.charFootL || !this.charFootR || !this.charTorso)
            return;
        if (this.isSitting) {
            this.charFootL.position.set(-0.20, 0.05, 0.38);
            this.charFootR.position.set(0.20, 0.05, 0.38);
            this.charTorso.rotation.z = 0;
            this.charTorso.position.y = -0.05;
            if (this.charArmL && this.charArmR) {
                this.charArmL.rotation.set(0.4, 0, 0.2);
                this.charArmR.rotation.set(0.4, 0, -0.2);
            }
            return;
        }
        this.charFootL.position.set(-0.22, 0.06, 0.12);
        this.charFootR.position.set(0.22, 0.06, 0.12);
        this.charTorso.rotation.z = 0;
        this.charTorso.position.y = 0;
        if (this.charArmL && this.charArmR) {
            this.charArmL.rotation.set(-0.2, 0, 0.38);
            this.charArmR.rotation.set(-0.2, 0, -0.38);
        }
        if (this.charTail) {
            this.charTail.rotation.y = Math.sin(Date.now() * 0.002) * 0.15;
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
            yVel: 0
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
            yVel: 0
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
            yVel: 0
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
            yVel: 0
        });
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
                const t = npc.walkTime;
                if (npc.footL && npc.footR) {
                    npc.footL.position.z = Math.sin(t) * 0.22;
                    npc.footL.position.y = Math.max(0, Math.cos(t) * 0.12);
                    npc.footR.position.z = -Math.sin(t) * 0.22;
                    npc.footR.position.y = Math.max(0, -Math.cos(t) * 0.12);
                }
                if (npc.torso) {
                    npc.torso.rotation.z = Math.sin(t) * 0.12;
                    npc.torso.position.y = Math.abs(Math.sin(t * 2)) * 0.04;
                }
                if (npc.armL && npc.armR) {
                    npc.armL.rotation.z = 0.38 + Math.sin(t) * 0.22;
                    npc.armR.rotation.z = -0.38 + Math.sin(t) * 0.22;
                }
                if (npc.tail) {
                    npc.tail.rotation.y = Math.sin(t * 1.8) * 0.32;
                }
            }
        }
    }
    // =========================================================================
    // ARREMESSO DE BOLAS DE NEVE COM O BOTÃO ESQUERDO DO MOUSE
    // =========================================================================
    throwSnowball() {
        if (this.currentScene !== 'HUB')
            return;
        if (this.isAnyModalOpen())
            return;
        const now = Date.now();
        if (now - this.lastSnowballTime < 240)
            return;
        this.lastSnowballTime = now;
        // Direção da mira da câmera
        const cosPitch = Math.cos(this.cameraAngleX);
        const sinPitch = Math.sin(this.cameraAngleX);
        const sinYaw = Math.sin(this.cameraAngleY);
        const cosYaw = Math.cos(this.cameraAngleY);
        const speed = 1.35;
        const vx = -sinYaw * cosPitch * speed;
        const vy = Math.max(0.06, -sinPitch * speed + 0.24);
        const vz = -cosYaw * cosPitch * speed;
        const snowballGeo = new THREE.SphereGeometry(0.22, 10, 10);
        const snowballMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
        const mesh = new THREE.Mesh(snowballGeo, snowballMat);
        mesh.position.set(this.playerPosX, this.playerPosY + 1.15, this.playerPosZ);
        mesh.castShadow = true;
        this.scene.add(mesh);
        this.snowballs.push({ mesh, vx, vy, vz, life: 0 });
        this.playSnowThrowSound();
    }
    updateSnowballs() {
        for (let i = this.snowballs.length - 1; i >= 0; i--) {
            const sb = this.snowballs[i];
            sb.mesh.position.x += sb.vx;
            sb.mesh.position.y += sb.vy;
            sb.mesh.position.z += sb.vz;
            sb.vy -= 0.016; // Gravidade
            sb.life++;
            sb.mesh.rotation.x += 0.2;
            sb.mesh.rotation.z += 0.2;
            let splat = false;
            // Colisão com o chão
            if (sb.mesh.position.y <= 0.1) {
                splat = true;
            }
            // Colisão com os NPCs que circulam
            if (!splat) {
                for (const npc of this.wanderingNPCs) {
                    const distNpc = sb.mesh.position.distanceTo(npc.mesh.position);
                    if (distNpc < 1.1) {
                        splat = true;
                        npc.state = 'hit';
                        npc.reactionTimer = 45;
                        npc.yVel = 0.22;
                        this.showToast(`Você acertou uma bola de neve no ${npc.name}! ❄️`, 'info');
                        break;
                    }
                }
            }
            // Colisão com o Boneco de Neve
            if (!splat) {
                const distSnowman = sb.mesh.position.distanceTo(new THREE.Vector3(-12, 1.8, 8));
                if (distSnowman < 1.6) {
                    splat = true;
                    this.showToast('Você acertou em cheio o Boneco de Neve! ⛄❄️', 'success');
                }
            }
            // Tempo de vida máximo (120 frames)
            if (sb.life > 120) {
                splat = true;
            }
            if (splat) {
                this.emitSnowSpray(10, 0, sb.mesh.position.x, sb.mesh.position.y, sb.mesh.position.z);
                this.playSnowSplatSound();
                this.scene.remove(sb.mesh);
                this.snowballs.splice(i, 1);
            }
        }
    }
    // =========================================================================
    // CENÁRIO: CHALÉS AMPLOS, LOJAS SEGMENTADAS, CABINE TELEFÔNICA & BONDINHO
    // =========================================================================
    // Construtor Modular de Chalés Amplos e Acessíveis (Walk-in Lodges)
    createWalkInLodge(centerX, centerZ, width, depth, wallColor, roofColor, signText, shopType) {
        const lodge = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.8 });
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x5c3317, roughness: 0.7 });
        const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.6 });
        const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.95 });
        const counterMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 });
        const wallThickness = 0.8;
        const wallHeight = 7.0;
        const doorWidth = 4.2;
        const floor = new THREE.Mesh(new THREE.BoxGeometry(width - 0.4, 0.3, depth - 0.4), floorMat);
        floor.position.set(0, 0.15, 0);
        floor.receiveShadow = true;
        lodge.add(floor);
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
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, wallHeight - 4.5, wallThickness), woodMat);
        lintel.position.set(0, wallHeight - (wallHeight - 4.5) * 0.5, depth * 0.5 - wallThickness * 0.5);
        lodge.add(frontLeft, frontRight, lintel);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, depth) * 0.78, 5.2, 4), roofMat);
        roof.position.y = wallHeight + 2.5;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        const snowCap = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, depth) * 0.81, 1.4, 4), snowMat);
        snowCap.position.y = wallHeight + 3.2;
        snowCap.rotation.y = Math.PI / 4;
        lodge.add(roof, snowCap);
        const counter = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.3, 1.2), counterMat);
        counter.position.set(0, 0.65, 0.5);
        counter.castShadow = true;
        lodge.add(counter);
        const warmLight = new THREE.PointLight(0xfef08a, 1.6, 18);
        warmLight.position.set(0, 5.0, 0);
        lodge.add(warmLight);
        if (shopType === 'garage') {
            for (const side of [-1, 1]) {
                const wallBoard = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 0.45), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
                wallBoard.position.set(side * (width * 0.5 - 0.7), 3.0, -1.0);
                wallBoard.rotation.z = side * 0.2;
                lodge.add(wallBoard);
            }
            this.npcRalph = this.createMerchantRalph();
            this.npcRalph.position.set(0, 0.15, -1.5);
            lodge.add(this.npcRalph);
        }
        else if (shopType === 'hats') {
            const carpet = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.05, depth - 2.0), new THREE.MeshStandardMaterial({ color: 0xb91c1c }));
            carpet.position.set(0, 0.22, 0);
            lodge.add(carpet);
            const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 1.4, 8), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 }));
            stand.position.set(-3.2, 0.7, -1.2);
            const mHead = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
            mHead.position.set(-3.2, 1.6, -1.2);
            lodge.add(stand, mHead);
            this.npcBabette = this.createMerchantBabette();
            this.npcBabette.position.set(0, 0.15, -1.5);
            lodge.add(this.npcBabette);
        }
        else if (shopType === 'atelier') {
            const displayCase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 0.8), new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 }));
            displayCase.position.set(-3.4, 0.55, 0.2);
            lodge.add(displayCase);
            this.npcBoris = this.createMerchantBoris();
            this.npcBoris.position.set(0, 0.15, -1.5);
            lodge.add(this.npcBoris);
        }
        else if (shopType === 'tavern') {
            const posterBoard = new THREE.Mesh(new THREE.BoxGeometry(6.4, 3.2, 0.15), new THREE.MeshStandardMaterial({ color: 0x451a03 }));
            posterBoard.position.set(0, 3.6, -depth * 0.5 + 0.45);
            const posterGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(6.6, 3.4, 0.08), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85 }));
            posterGoldTrim.position.set(0, 3.6, -depth * 0.5 + 0.4);
            const trophyCup = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.15, 0.7, 10), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9 }));
            trophyCup.position.set(0, 1.7, 0.5);
            lodge.add(posterBoard, posterGoldTrim, trophyCup);
        }
        lodge.position.set(centerX, 0, centerZ);
        this.hubColliders.push({
            type: 'box',
            x: centerX,
            z: centerZ - depth * 0.5 + wallThickness * 0.5,
            hw: width * 0.5,
            hd: wallThickness * 0.5,
            angle: 0
        });
        this.hubColliders.push({
            type: 'box',
            x: centerX - width * 0.5 + wallThickness * 0.5,
            z: centerZ,
            hw: wallThickness * 0.5,
            hd: depth * 0.5,
            angle: 0
        });
        this.hubColliders.push({
            type: 'box',
            x: centerX + width * 0.5 - wallThickness * 0.5,
            z: centerZ,
            hw: wallThickness * 0.5,
            hd: depth * 0.5,
            angle: 0
        });
        this.hubColliders.push({
            type: 'box',
            x: centerX - doorWidth * 0.5 - frontSegmentWidth * 0.5,
            z: centerZ + depth * 0.5 - wallThickness * 0.5,
            hw: frontSegmentWidth * 0.5,
            hd: wallThickness * 0.5,
            angle: 0
        });
        this.hubColliders.push({
            type: 'box',
            x: centerX + doorWidth * 0.5 + frontSegmentWidth * 0.5,
            z: centerZ + depth * 0.5 - wallThickness * 0.5,
            hw: frontSegmentWidth * 0.5,
            hd: wallThickness * 0.5,
            angle: 0
        });
        this.hubColliders.push({
            type: 'box',
            x: centerX,
            z: centerZ + 0.5,
            hw: 2.7,
            hd: 0.6,
            angle: 0
        });
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
        const babette = this.createDetailedPenguin();
        const bow = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({ color: 0xec4899 }));
        bow.position.set(0.2, 1.5, 0.1);
        babette.add(bow);
        return babette;
    }
    createMerchantBoris() {
        const boris = this.createDetailedPenguin();
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
        this.clearAllSkidMarks();
        this.confettiPoints = null;
        this.snowballs = [];
        this.isSitting = false;
        this.currentBench = null;
        this.benches = [];
        // Solo da Praça da Vila Alpina
        const groundGeo = new THREE.PlaneGeometry(350, 350, 32, 32);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.hubColliders = [];
        // 1. Estação do Bondinho (Teleférico com embarque para a Corrida)
        this.scene.add(this.createCableCarBaseStation());
        this.hubColliders.push({ type: 'box', x: 22, z: -20.5, hw: 8.5, hd: 4.2, angle: 0 });
        this.hubColliders.push({ type: 'box', x: 13.8, z: -15.5, hw: 0.8, hd: 2.8, angle: 0 });
        this.hubColliders.push({ type: 'box', x: 30.2, z: -15.5, hw: 0.8, hd: 2.8, angle: 0 });
        this.hubColliders.push({ type: 'circle', x: 22, z: -19, r: 1.2 });
        // Placa 3D Informativa do Bondinho / Corrida de Descida
        this.scene.add(this.createTextSignboard(15, -12, 0.2, '🚠 TELEFÉRICO DA MONTANHA', '🏔️ EMBARQUE PARA A CORRIDA DE DESCIDA', '#38bdf8'));
        // 2. Fogueira acolhedora central
        this.scene.add(this.createBonfire());
        this.hubColliders.push({ type: 'circle', x: -2, z: 0, r: 2.1 });
        // 3. Boneco de Neve
        this.scene.add(this.createSnowman());
        this.hubColliders.push({ type: 'circle', x: -12, z: 8, r: 1.4 });
        // 4. Cabine Telefônica Mágica (Troca de Personagem) com Placa
        this.scene.add(this.createPhoneBooth(this.phoneBoothPos.x, this.phoneBoothPos.z));
        this.scene.add(this.createTextSignboard(11.5, -3.5, -Math.PI / 4, '📞 CABINE MÁGICA', '✨ METAMORFOSE DE PERSONAGEM', '#ef4444'));
        // 5. Chalé 1: Garagem Alpina (Trenós & Snowboards) com Placa Externa
        const garage = this.createWalkInLodge(this.garagePos.x, this.garagePos.z, 13, 11, 0x5c3317, 0xd97706, 'GARAGEM ALPINA', 'garage');
        this.scene.add(garage);
        this.scene.add(this.createTextSignboard(-18, -12.5, -0.15, '🛠️ GARAGEM ALPINA', '🛷 TRENÓS & SNOWBOARDS VELOZES', '#f59e0b'));
        // 6. Chalé 2: Boutique dos Gorros (Chapéus & Coroas) com Placa Externa
        const hatShop = this.createWalkInLodge(this.hatShopPos.x, this.hatShopPos.z, 13, 11, 0x7c2d12, 0xdb2777, 'BOUTIQUE DOS GORROS', 'hats');
        this.scene.add(hatShop);
        this.scene.add(this.createTextSignboard(-18, 12.5, 0.15, '🎩 BOUTIQUE DOS GORROS', '👑 GORROS, CARTOLAS & COROAS', '#ec4899'));
        // 7. Chalé 3: Ateliê da Montanha (Cachecóis & Óculos) com Placa Externa
        const atelier = this.createWalkInLodge(this.atelierPos.x, this.atelierPos.z, 13, 11, 0x4d7c0f, 0x059669, 'ATELIÊ DA MONTANHA', 'atelier');
        this.scene.add(atelier);
        this.scene.add(this.createTextSignboard(6, 17.5, 0, '🧣 ATELIÊ DA MONTANHA', '🥽 CACHECÓIS MACIOS & ÓCULOS', '#10b981'));
        // 8. Chalé 4: Taverna dos Campeões (Salão de Recordes) com Placa Externa
        const tavern = this.createWalkInLodge(this.tavernPos.x, this.tavernPos.z, 14, 12, 0x78350f, 0x2563eb, 'TAVERNA DOS CAMPEÕES', 'tavern');
        this.scene.add(tavern);
        this.scene.add(this.createTextSignboard(19, 13.5, -Math.PI * 0.15, '🏆 TAVERNA DOS CAMPEÕES', '🌟 SALÃO DE RECORDES & HALL DA FAMA', '#eab308'));
        // 9. Bancos de Madeira Rústicos na Praça (Onde é possível sentar)
        this.scene.add(this.createWoodenParkBench(-2, 3.4, Math.PI)); // Em frente à fogueira
        this.scene.add(this.createWoodenParkBench(-2, -3.4, 0)); // Ao sul da fogueira
        this.scene.add(this.createWoodenParkBench(16, 8, -Math.PI / 2)); // Perto da taverna
        this.scene.add(this.createWoodenParkBench(6, 2, Math.PI * 0.75)); // Perto da cabine
        // 10. Spawn dos NPCs Autônomos Circulando pelo Vilarejo
        this.spawnWanderingNPCs();
        // 11. Postes de iluminação da praça
        const lampPositions = [
            [-6, 6],
            [12, 4],
            [-8, -8],
            [10, -12]
        ];
        for (const [lx, lz] of lampPositions) {
            this.scene.add(this.createStreetLamp(lx, lz));
            this.hubColliders.push({ type: 'circle', x: lx, z: lz, r: 0.5 });
        }
        // 12. Pinheiros decorativos internos
        const innerTrees = [
            [-16, -2],
            [-10, 18],
            [18, 22],
            [28, 2],
            [2, -16]
        ];
        for (const [tx, tz] of innerTrees) {
            const tree = this.createSnowyPineTree();
            tree.position.set(tx, 0, tz);
            tree.scale.setScalar(0.95);
            this.scene.add(tree);
            this.hubColliders.push({ type: 'circle', x: tx, z: tz, r: 0.9 });
        }
        // 13. Cercas delimitadoras da vila alpina
        const fences = [
            { x: 0, z: -43, rot: 0, len: 38 },
            { x: 0, z: 43, rot: 0, len: 70 },
            { x: -43, z: 0, rot: Math.PI / 2, len: 70 },
            { x: 43, z: 12, rot: Math.PI / 2, len: 45 }
        ];
        for (const f of fences) {
            this.scene.add(this.createRusticFence(f.x, f.z, f.rot, f.len));
        }
        // 14. Montanhas no horizonte
        for (let i = 0; i < 6; i++) {
            const ang = (i / 6) * Math.PI * 2;
            const p = this.createMountainPeak(55 + Math.random() * 20, 80 + Math.random() * 40);
            p.position.set(Math.cos(ang) * 160, 0, Math.sin(ang) * 160);
            this.scene.add(p);
        }
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
        this.nearBench = null;
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
        document.getElementById('back-hub-btn').style.display = 'none';
        // CORREÇÃO CRÍTICA DO BUG: Remove tela de cutscene
        const cutsceneEl = document.getElementById('cable-car-cutscene');
        if (cutsceneEl)
            cutsceneEl.style.display = 'none';
        document.getElementById('joystick-ui').style.display = 'block';
        document.getElementById('run-btn').style.display = 'flex';
        document.getElementById('race-finish-modal').style.display = 'none';
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
        document.getElementById('run-btn').style.display = 'none';
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
            'race-finish-modal'
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
            'race-finish-modal'
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
        // Bloqueio do Ponteiro do Mouse & Arremesso de Bola de Neve (Botão Esquerdo)
        this.renderer.domElement.addEventListener('click', (e) => {
            this.initAudio();
            if (this.currentScene === 'HUB' && !this.isAnyModalOpen()) {
                if (!this.isPointerLocked) {
                    try {
                        this.renderer.domElement.requestPointerLock();
                    }
                    catch (err) { }
                }
                // Ao clicar com o botão esquerdo, joga bola de neve!
                if (e.button === 0) {
                    this.throwSnowball();
                }
            }
        });
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
            const crosshair = document.getElementById('hub-crosshair');
            if (crosshair) {
                crosshair.style.display = (this.isPointerLocked && this.currentScene === 'HUB') ? 'block' : 'none';
            }
        });
        // Rotação da Câmera com Mouse
        window.addEventListener('mousemove', (e) => {
            if (this.currentScene !== 'HUB')
                return;
            if (this.isAnyModalOpen())
                return;
            if (this.isPointerLocked || this.isRightMouseDown) {
                const baseSens = 0.0024;
                const effectiveSens = baseSens * this.mouseSensMultiplier;
                const invertFactor = this.invertY ? -1 : 1;
                this.cameraAngleY -= e.movementX * effectiveSens;
                this.cameraAngleX = Math.max(-0.35, Math.min(1.15, this.cameraAngleX + e.movementY * effectiveSens * invertFactor));
            }
        });
        window.addEventListener('mousedown', (e) => {
            if (this.currentScene === 'HUB') {
                if (e.button === 2) {
                    this.isRightMouseDown = true;
                }
                else if (e.button === 0 && this.isPointerLocked && !this.isAnyModalOpen()) {
                    this.throwSnowball();
                }
            }
        });
        window.addEventListener('mouseup', (e) => {
            if (e.button === 2) {
                this.isRightMouseDown = false;
            }
        });
        window.addEventListener('contextmenu', (e) => {
            if (this.currentScene === 'HUB') {
                e.preventDefault();
            }
        });
        window.addEventListener('wheel', (e) => {
            if (this.currentScene !== 'HUB')
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
        jumpBtn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            triggerJump();
        });
        const runBtn = document.getElementById('run-btn');
        runBtn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            this.isRunning = !this.isRunning;
            runBtn.classList.toggle('active', this.isRunning);
        });
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
                this.closeAllModals();
                return;
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
            // Atualização das bolas de neve atiradas
            this.updateSnowballs();
            if (!this.isSitting) {
                const running = this.keyShift || this.isRunning;
                const moveSpeed = running ? 0.28 : 0.16;
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
                    const targetRotY = Math.atan2(moveWorldX, moveWorldZ);
                    let diffRot = targetRotY - this.playerGroup.rotation.y;
                    while (diffRot > Math.PI)
                        diffRot -= Math.PI * 2;
                    while (diffRot < -Math.PI)
                        diffRot += Math.PI * 2;
                    this.playerGroup.rotation.y += diffRot * 0.22;
                    this.walkTime += running ? 0.30 : 0.18;
                    this.animateCharacterWalk(this.walkTime, running);
                    if (Math.random() < 0.22) {
                        this.addContinuousSnowTrail(this.playerPosX, this.playerPosY, this.playerPosZ, this.playerGroup.rotation.y);
                    }
                }
                else {
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
            // Câmera terceira pessoa
            const targetLookY = this.playerPosY + 1.25;
            const cosPitch = Math.cos(this.cameraAngleX);
            const sinPitch = Math.sin(this.cameraAngleX);
            const shoulderOffset = 0.45;
            const rightCamX = Math.cos(this.cameraAngleY) * shoulderOffset;
            const rightCamZ = -Math.sin(this.cameraAngleY) * shoulderOffset;
            const camX = this.playerPosX + rightCamX + Math.sin(this.cameraAngleY) * (this.cameraDistance * cosPitch);
            const camZ = this.playerPosZ + rightCamZ + Math.cos(this.cameraAngleY) * (this.cameraDistance * cosPitch);
            const camY = Math.max(this.playerPosY + 0.5, this.playerPosY + 1.4 + (this.cameraDistance * sinPitch));
            this.camera.position.set(camX, camY, camZ);
            this.camera.lookAt(this.playerPosX + rightCamX * 0.5, targetLookY, this.playerPosZ + rightCamZ * 0.5);
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
