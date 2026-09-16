import * as THREE from 'three';
import { Client } from 'colyseus.js';
import { GameState } from '@snow-slide/shared';

class SnowSlideMatchClient {
  private client!: Client;
  private room: any;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private playerMesh!: THREE.Mesh;
  private otherPlayers: Map<string, THREE.Mesh> = new Map();
  
  private moveX = 0;
  private moveZ = 0;
  private isReady = false;

  async init() {
    // UI de Ready-up
    const readyBtn = document.getElementById('ready-btn')!;
    const phaseInfo = document.getElementById('phase-info')!;

    readyBtn.addEventListener('click', () => {
      if (this.room && !this.isReady) {
        this.isReady = true;
        this.room.send('readyUp');
        readyBtn.innerText = 'Aguardando outros jogadores...';
        readyBtn.style.background = '#64748b';
      }
    });

    // Setup Three.js
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdbeafe);
    this.scene.fog = new THREE.FogExp2(0xdbeafe, 0.008);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 6, -12);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.getElementById('app')!.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 50, -20);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // Pista de Neve Deslizante
    const floorGeo = new THREE.PlaneGeometry(60, 1000);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2 - 0.1;
    floor.position.set(0, -2, 500);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Jogador Local (Prancha + Trenó 3D)
    const playerGroup = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x16a34a });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.4;
    body.castShadow = true;
    playerGroup.add(body);

    const boardGeo = new THREE.BoxGeometry(1.4, 0.12, 2.4);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = 0.05;
    board.castShadow = true;
    playerGroup.add(board);

    this.scene.add(playerGroup);
    this.playerMesh = playerGroup as any;

    window.addEventListener('keydown', (e) => this.handleKey(e, true));
    window.addEventListener('keyup', (e) => this.handleKey(e, false));

    // Conexão Colyseus (Sala de Partida / Bondinho)
    try {
      const host = window.location.hostname || 'localhost';
      this.client = new Client(`ws://${host}:2567`);
      this.room = await this.client.joinOrCreate<GameState>('sledding_match', {
        name: 'Racer_' + Math.floor(Math.random() * 1000),
        character: 'penguin',
        vehicle: 'board'
      });

      console.log('Connected to Sledding Match Room:', this.room.sessionId);

      this.room.onStateChange((state: any) => {
        if (state.phase === 'RACING') {
          phaseInfo.innerText = '💨 DESCIDA EM ANDAMENTO!';
          readyBtn.style.display = 'none';
        } else {
          phaseInfo.innerText = '🚠 No Bondinho - Aguardando Ready-up';
        }
      });

      this.room.state.players.onAdd((player: any, sessionId: string) => {
        if (sessionId === this.room.sessionId) return;
        const otherGroup = playerGroup.clone();
        this.scene.add(otherGroup);
        this.otherPlayers.set(sessionId, otherGroup as any);

        player.onChange(() => {
          otherGroup.position.set(player.x, player.y, player.z);
        });
      });

      this.room.state.players.onRemove((player: any, sessionId: string) => {
        const mesh = this.otherPlayers.get(sessionId);
        if (mesh) {
          this.scene.remove(mesh);
          this.otherPlayers.delete(sessionId);
        }
      });

    } catch (e) {
      console.error('Failed to connect to Match Room:', e);
    }

    this.animate();
  }

  private handleKey(e: KeyboardEvent, isDown: boolean) {
    const val = isDown ? 1 : 0;
    if (e.key === 'ArrowUp' || e.key === 'w') this.moveZ = val;
    if (e.key === 'ArrowDown' || e.key === 's') this.moveZ = -val;
    if (e.key === 'ArrowLeft' || e.key === 'a') this.moveX = -val;
    if (e.key === 'ArrowRight' || e.key === 'd') this.moveX = val;
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    // Movimentação de descida se a corrida estiver ativa
    if (this.room && this.room.state.phase === 'RACING') {
      const forwardSpeed = 0.6;
      const steerSpeed = 0.25;

      this.playerMesh.position.z += forwardSpeed;
      this.playerMesh.position.x += this.moveX * steerSpeed;

      // Envia input ao servidor autoritativo
      this.room.send('clientInput', {
        forward: forwardSpeed,
        steer: this.moveX
      });
    }

    // Câmera em terceira pessoa nas costas do jogador
    this.camera.position.x = this.playerMesh.position.x * 0.4;
    this.camera.position.z = this.playerMesh.position.z - 12;
    this.camera.position.y = this.playerMesh.position.y + 6;
    this.camera.lookAt(this.playerMesh.position.x, this.playerMesh.position.y, this.playerMesh.position.z + 4);

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new SnowSlideMatchClient();
  app.init();
});
