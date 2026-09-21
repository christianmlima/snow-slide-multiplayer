import * as THREE from 'three';
const GAME_VERSION = "v1.4.3-STABLE";
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
    currentVehicle = 'board';
    currency = 1250;
    score = 0;
    otherPlayers = new Map();
    obstacles = [];
    skidMarks = [];
    snowParticles;
    // Câmera Órbita 360°
    isDragging = false;
    activeOrbitPointerId = null;
    previousTouchX = 0;
    previousTouchY = 0;
    cameraAngleY = 0;
    cameraAngleX = 0.35;
    cameraDistance = 10;
    // Analógico Virtual com PointerId dedicado
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
    constructor() {
        this.initEngine();
    }
    createSnowParticles() {
        const count = 600;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 60;
            positions[i + 1] = Math.random() * 25;
            positions[i + 2] = (Math.random() - 0.5) * 60;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.9 });
        this.snowParticles = new THREE.Points(geometry, material);
        this.scene.add(this.snowParticles);
    }
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
        const ambient = new THREE.AmbientLight(0xffffff, 0.9);
        this.scene.add(ambient);
        const sun = new THREE.DirectionalLight(0xffffff, 1.3);
        sun.position.set(40, 70, -40);
        this.scene.add(sun);
        this.scene.add(this.snowParticles);
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
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const radius = 60 + Math.random() * 30;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 2), new THREE.MeshStandardMaterial({ color: 0x78350f }));
            trunk.position.y = 1;
            const leaves = new THREE.Mesh(new THREE.ConeGeometry(2.5, 5, 5), new THREE.MeshStandardMaterial({ color: 0x15803d }));
            leaves.position.y = 4;
            tree.add(trunk, leaves);
            tree.position.set(x, 0, z);
            this.scene.add(tree);
        }
        // RESET ABSOLUTO DE POSIÇÃO NO HUB
        this.playerPosX = 0;
        this.playerPosZ = 0;
        this.playerPosY = 0;
        this.playerGroup = this.createAvatarMesh('penguin', this.currentVehicle);
        this.playerGroup.position.set(0, 0, 0);
        this.scene.add(this.playerGroup);
        document.getElementById('hub-ui').style.display = 'block';
        document.getElementById('racing-hud').style.display = 'none';
        document.getElementById('back-hub-btn').style.display = 'none';
        document.getElementById('joystick-ui').style.display = 'block';
    }
    loadRacingScene() {
        this.currentScene = 'RACING';
        this.scene.clear();
        this.scene.background = new THREE.Color(0xdbeafe);
        this.scene.fog = new THREE.FogExp2(0xdbeafe, 0.008);
        const ambient = new THREE.AmbientLight(0xffffff, 0.9);
        this.scene.add(ambient);
        const sun = new THREE.DirectionalLight(0xffffff, 1.3);
        sun.position.set(40, 70, -40);
        this.scene.add(sun);
        this.scene.add(this.snowParticles);
        // PISTA DE CORRIDA ISOLADA COM Z INICIANDO EM 0 (ZERADO)
        const trackGeo = new THREE.PlaneGeometry(120, 5000, 32, 300);
        const pos = trackGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const y = pos.getY(i);
            pos.setZ(i, pos.getZ(i) + Math.abs(y) * 0.12);
        }
        trackGeo.computeVertexNormals();
        const trackMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.95 });
        const track = new THREE.Mesh(trackGeo, trackMat);
        track.rotation.x = Math.PI / 2 - 0.12;
        track.position.set(0, -2.5, 2500);
        track.receiveShadow = true;
        this.scene.add(track);
        this.obstacles = [];
        let nextZ = 60;
        for (let i = 0; i < 70; i++) {
            const isTree = Math.random() > 0.35;
            const xPos = (Math.random() - 0.5) * 32;
            const obsGroup = new THREE.Group();
            if (isTree) {
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.5, 6), new THREE.MeshStandardMaterial({ color: 0x78350f }));
                trunk.position.y = 0.75;
                const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.8, 3.5, 6), new THREE.MeshStandardMaterial({ color: 0x15803d }));
                leaves.position.y = 2.8;
                obsGroup.add(trunk, leaves);
            }
            else {
                const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 1), new THREE.MeshStandardMaterial({ color: 0x64748b }));
                rock.position.y = 0.9;
                obsGroup.add(rock);
            }
            obsGroup.position.set(xPos, -0.5, nextZ);
            this.scene.add(obsGroup);
            this.obstacles.push({ mesh: obsGroup, x: xPos, z: nextZ });
            nextZ += 45 + Math.random() * 35;
        }
        const finishLine = new THREE.Mesh(new THREE.BoxGeometry(50, 8, 2), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x7f1d1d }));
        finishLine.position.set(0, 2, nextZ + 100);
        this.scene.add(finishLine);
        this.obstacles.push({ mesh: finishLine, x: 0, z: nextZ + 100 });
        // GARANTIA ABSOLUTA DE RESET DE POSIÇÃO NA CORRIDA
        this.playerPosX = 0;
        this.playerPosY = 0;
        this.playerPosZ = 0;
        this.playerVelX = 0;
        this.playerVelZ = 0.5;
        this.score = 0;
        this.respawnPlayerMesh();
        document.getElementById('hub-ui').style.display = 'none';
        document.getElementById('racing-hud').style.display = 'block';
        document.getElementById('back-hub-btn').style.display = 'block';
        document.getElementById('joystick-ui').style.display = 'block';
    }
    createAvatarMesh(charType, vehicleType) {
        const group = new THREE.Group();
        const vGeo = vehicleType === 'board' ? new THREE.BoxGeometry(1.4, 0.12, 2.4) : new THREE.BoxGeometry(1.6, 0.18, 2.6);
        const vMat = new THREE.MeshStandardMaterial({ color: vehicleType === 'board' ? 0x0284c7 : 0xb45309, roughness: 0.3 });
        const vehicle = new THREE.Mesh(vGeo, vMat);
        vehicle.position.y = 0.06;
        vehicle.castShadow = true;
        group.add(vehicle);
        const bodyGeo = new THREE.CapsuleGeometry(0.45, 0.6, 12, 12);
        const bodyMat = new THREE.MeshStandardMaterial({ color: charType === 'penguin' ? 0x0f172a : 0xf59e0b, roughness: 0.4 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.65;
        body.castShadow = true;
        group.add(body);
        const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: charType === 'penguin' ? 0x0f172a : 0xf59e0b, roughness: 0.4 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.15;
        head.castShadow = true;
        group.add(head);
        return group;
    }
    respawnPlayerMesh() {
        if (this.playerGroup)
            this.scene.remove(this.playerGroup);
        this.playerGroup = this.createAvatarMesh('penguin', this.currentVehicle);
        this.scene.add(this.playerGroup);
    }
    // =========================================================================
    // SETUP DE CONTROLES (CORREÇÃO DEFINITIVA DO EIXO Y: PARA CIMA = FRENTE POSITIVA)
    // =========================================================================
    setupUIAndControls() {
        const loginScreen = document.getElementById('login-screen');
        const currencyEl = document.getElementById('currency-val');
        const startSession = (name) => {
            loginScreen.style.display = 'none';
            this.loadHubScene();
        };
        document.getElementById('login-btn').addEventListener('click', () => {
            const input = document.getElementById('username-input').value.trim();
            startSession(input || 'Racer_' + Math.floor(Math.random() * 1000));
        });
        document.getElementById('quick-login-btn').addEventListener('click', () => {
            startSession('Pro_Racer_2026');
        });
        document.getElementById('board-shop-btn').addEventListener('click', () => {
            if (this.currency >= 500) {
                this.currency -= 500;
                currencyEl.innerText = this.currency.toString();
                this.currentVehicle = this.currentVehicle === 'board' ? 'sled' : 'board';
                alert(`Veículo equipado com sucesso: ${this.currentVehicle.toUpperCase()}!`);
                this.respawnPlayerMesh();
            }
            else {
                alert('Moedas insuficientes!');
            }
        });
        document.getElementById('cable-car-btn').addEventListener('click', () => {
            this.loadRacingScene();
        });
        document.getElementById('back-hub-btn').addEventListener('click', () => {
            this.loadHubScene();
        });
        // Analógico Virtual com Eixo Y Corrigido (dy negativo para cima = inputForward positivo)
        const joystickBase = document.getElementById('joystick-base');
        joystickBase.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
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
            this.joystickMoveY = -(Math.sin(angle) * dist) / 45; // CORRIGIDO: Agora empurrar para cima é positivo
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
        // Câmera Órbita 360°
        window.addEventListener('pointerdown', (e) => {
            const target = e.target;
            if (target && (target.closest('#hub-ui') || target.closest('#joystick-ui') || target.closest('#jump-btn') || target.closest('button') || target.closest('input')))
                return;
            this.activeOrbitPointerId = e.pointerId;
            this.isDragging = true;
            this.previousTouchX = e.clientX;
            this.previousTouchY = e.clientY;
        });
        window.addEventListener('pointermove', (e) => {
            if (!this.isDragging || e.pointerId !== this.activeOrbitPointerId)
                return;
            const deltaX = e.clientX - this.previousTouchX;
            const deltaY = e.clientY - this.previousTouchY;
            this.cameraAngleY -= deltaX * 0.005;
            this.cameraAngleX = Math.max(0.1, Math.min(1.4, this.cameraAngleX + deltaY * 0.005));
            this.previousTouchX = e.clientX;
            this.previousTouchY = e.clientY;
        });
        const endOrbit = (e) => {
            if (e.pointerId === this.activeOrbitPointerId) {
                this.activeOrbitPointerId = null;
                this.isDragging = false;
            }
        };
        window.addEventListener('pointerup', endOrbit);
        window.addEventListener('pointercancel', endOrbit);
        // Botão de Pulo Dedicado
        const jumpBtn = document.getElementById('jump-btn');
        jumpBtn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            if (!this.isJumping) {
                this.isJumping = true;
                this.jumpVelY = 0.42;
            }
        });
        window.addEventListener('keydown', (e) => {
            if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp')
                this.keyW = true;
            if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown')
                this.keyS = true;
            if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft')
                this.keyA = true;
            if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight')
                this.keyD = true;
            if (e.key === ' ' && !this.isJumping) {
                this.isJumping = true;
                this.jumpVelY = 0.42;
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
        });
    }
    addSkidMark(x, z) {
        const markGeo = new THREE.PlaneGeometry(0.3, 0.9);
        const markMat = new THREE.MeshBasicMaterial({ color: 0xd8eafe, transparent: true, opacity: 0.6 });
        const mark = new THREE.Mesh(markGeo, markMat);
        mark.rotation.x = -Math.PI / 2;
        mark.position.set(x, -2.48, z);
        this.scene.add(mark);
        this.skidMarks.push({ mesh: mark, createdAt: Date.now() });
        if (this.skidMarks.length > 50) {
            const old = this.skidMarks.shift();
            this.scene.remove(old.mesh);
            old.mesh.geometry.dispose();
            old.mesh.material.dispose();
        }
    }
    // ==========================================
    // GAME LOOP PRINCIPAL (60 FPS)
    // ==========================================
    loop = () => {
        requestAnimationFrame(this.loop);
        let inputForward = this.joystickMoveY;
        let inputLateral = this.joystickMoveX;
        if (this.keyW)
            inputForward = 1;
        if (this.keyS)
            inputForward = -1;
        if (this.keyA)
            inputLateral = -1;
        if (this.keyD)
            inputLateral = 1;
        if (this.currentScene === 'HUB') {
            const speed = 0.22;
            if (Math.abs(inputForward) > 0.05 || Math.abs(inputLateral) > 0.05) {
                // CORREÇÃO DA ORIENTAÇÃO: inputForward positivo avança na direção para onde a câmera aponta
                const forward = new THREE.Vector3(-Math.sin(this.cameraAngleY), 0, -Math.cos(this.cameraAngleY));
                const lateral = new THREE.Vector3(Math.cos(this.cameraAngleY), 0, -Math.sin(this.cameraAngleY));
                const moveDir = new THREE.Vector3()
                    .addScaledVector(forward, inputForward)
                    .addScaledVector(lateral, inputLateral)
                    .normalize();
                this.playerPosX += moveDir.x * speed;
                this.playerPosZ += moveDir.z * speed;
                this.playerGroup.rotation.y = Math.atan2(moveDir.x, moveDir.z);
            }
            if (this.isJumping) {
                this.playerPosY += this.jumpVelY;
                this.jumpVelY -= 0.025;
                if (this.playerPosY <= 0) {
                    this.playerPosY = 0;
                    this.isJumping = false;
                    this.jumpVelY = 0;
                }
            }
            this.playerPosX = Math.max(-120, Math.min(120, this.playerPosX));
            this.playerPosZ = Math.max(-120, Math.min(120, this.playerPosZ));
            this.playerGroup.position.set(this.playerPosX, this.playerPosY, this.playerPosZ);
            // Câmera Órbita 360° Simultânea
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
        }
        else if (this.currentScene === 'RACING') {
            const acceleration = 0.004;
            if (this.playerVelZ < 1.4)
                this.playerVelZ += acceleration;
            const steeringSensitivity = 0.28;
            this.playerVelX += inputLateral * steeringSensitivity;
            if (inputForward > 0.1) {
                this.playerVelZ += 0.01;
            }
            else if (inputForward < -0.1) {
                this.playerVelZ = Math.max(0.4, this.playerVelZ - 0.015);
            }
            this.playerVelX *= 0.86;
            this.playerPosX += this.playerVelX;
            this.playerPosZ += this.playerVelZ;
            if (this.playerPosX < -16) {
                this.playerPosX = -16;
                this.playerVelX = 0;
            }
            if (this.playerPosX > 16) {
                this.playerPosX = 16;
                this.playerVelX = 0;
            }
            if (this.isJumping) {
                this.playerPosY += this.jumpVelY;
                this.jumpVelY -= 0.025;
                if (this.playerPosY <= 0) {
                    this.playerPosY = 0;
                    this.isJumping = false;
                    this.jumpVelY = 0;
                }
            }
            this.playerGroup.position.set(this.playerPosX, this.playerPosY, this.playerPosZ);
            this.playerGroup.rotation.z = -this.playerVelX * 0.4;
            if (Math.random() < 0.5 && this.playerPosY === 0) {
                this.addSkidMark(this.playerPosX, this.playerPosZ);
            }
            this.obstacles.forEach(obs => {
                const dx = this.playerPosX - obs.x;
                const dz = this.playerPosZ - obs.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist < 1.3 && this.playerPosY < 0.6) {
                    this.playerVelZ = 0.3;
                    this.score = Math.max(0, this.score - 100);
                }
            });
            this.score += Math.round(this.playerVelZ * 8);
            document.getElementById('score-val').innerText = this.score.toString();
            const camX = this.playerPosX + Math.sin(this.cameraAngleY) * (this.cameraDistance * Math.cos(this.cameraAngleX) * 0.8);
            const camZ = this.playerPosZ + Math.cos(this.cameraAngleY) * (this.cameraDistance * Math.cos(this.cameraAngleX) * 0.8);
            const camY = this.playerPosY + Math.sin(this.cameraAngleX) * this.cameraDistance + 2;
            this.camera.position.set(camX, camY, camZ);
            this.camera.lookAt(this.playerPosX, this.playerPosY + 0.5, this.playerPosZ + 6);
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
