import * as THREE from 'three';
import { Client } from 'colyseus.js';
import { GameState } from '@snow-slide/shared';

class SnowSlideClient {
  private client!: Client;
  private room: any;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private playerMesh!: THREE.Mesh;
  private otherPlayers: Map<string, THREE.Mesh> = new Map();
  
  private moveX = 0;
  private moveZ = 0;

  async init() {
    // 1. Setup Three.js Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdbeafe);
    this.scene.fog = new THREE.FogExp2(0xdbeafe, 0.01);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 5, -10);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.getElementById('app')!.appendChild(this.renderer.domElement);

    // Luzes
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(10, 20, -10);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // Chão Hub Alpino
    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Jogador Local (Placeholder cubo com prancha)
    const playerGroup = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.4;
    body.castShadow = true;
    playerGroup.add(body);

    const boardGeo = new THREE.BoxGeometry(1.2, 0.1, 2.2);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = 0.05;
    board.castShadow = true;
    playerGroup.add(board);

    this.scene.add(playerGroup);
    this.playerMesh = playerGroup as any;

    // Controles
    window.addEventListener('keydown', (e) => this.handleKey(e, true));
    window.addEventListener('keyup', (e) => this.handleKey(e, false));

    // 2. Conexão Colyseus
    try {
      const host = window.location.hostname || 'localhost';
      this.client = new Client(`ws://${host}:2567`);
      this.room = await this.client.joinOrCreate<GameState>('alpine_hub', {
        name: 'Player_' + Math.floor(Math.random() * 1000),
        character: 'penguin',
        vehicle: 'board'
      });

      console.log('Connected to Alpine Hub:', this.room.sessionId);

      this.room.state.players.onAdd((player: any, sessionId: string) => {
        if (sessionId === this.room.sessionId) return;

        // Cria mesh para outro jogador
        const otherGroup = playerGroup.clone();
        this.scene.add(otherGroup);
        this.otherPlayers.set(sessionId, otherGroup as any);

        player.onChange(() => {
          otherGroup.position.set(player.x, player.y, player.z);
          otherGroup.rotation.y = player.rotY;
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
      console.error('Failed to connect to Colyseus server:', e);
    }

    // Loop
    this.animate();
  }

  private handleKey(e: KeyboardEvent, isDown: boolean) {
    const val = isDown ? 1 : 0;
    if (e.key === 'ArrowUp' || e.key === 'w') this.moveZ = -val;
    if (e.key === 'ArrowDown' || e.key === 's') this.moveZ = val;
    if (e.key === 'ArrowLeft' || e.key === 'a') this.moveX = -val;
    if (e.key === 'ArrowRight' || e.key === 'd') this.moveX = val;
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    // Movimento simples local
    const speed = 0.15;
    this.playerMesh.position.x += this.moveX * speed;
    this.playerMesh.position.z += this.moveZ * speed;

    if (this.moveX !== 0 || this.moveZ !== 0) {
      const angle = Math.atan2(this.moveX, this.moveZ);
      this.playerMesh.rotation.y = angle;
    }

    // Câmera segue o jogador
    this.camera.position.x = this.playerMesh.position.x;
    this.camera.position.z = this.playerMesh.position.z - 10;
    this.camera.position.y = this.playerMesh.position.y + 5;
    this.camera.lookAt(this.playerMesh.position.x, this.playerMesh.position.y, this.playerMesh.position.z + 2);

    // Envia posição para o servidor Colyseus
    if (this.room) {
      this.room.send('updatePosition', {
        x: this.playerMesh.position.x,
        y: this.playerMesh.position.y,
        z: this.playerMesh.position.z,
        rotY: this.playerMesh.rotation.y
      });
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new SnowSlideClient();
  app.init();
});
