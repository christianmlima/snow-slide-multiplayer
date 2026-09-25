import { Client, Room } from 'colyseus.js';
import * as THREE from 'three';
import { GameState, PlayerState } from '@snow-slide/shared';
import { RemotePlayer } from './RemotePlayer';

export type NetworkStatus = 'offline' | 'connecting' | 'connected';

export interface PlayerProfile {
  name: string;
  character: string;
  vehicle: string;
  hat: string;
  scarf: string;
  goggles: string;
}

export class NetworkManager {
  private client: Client;
  public hubRoom: Room<GameState> | null = null;
  public raceRoom: Room<GameState> | null = null;
  public arenaRoom: Room<GameState> | null = null;
  public status: NetworkStatus = 'offline';
  public sessionId: string = '';

  public remotePlayers: Map<string, RemotePlayer> = new Map();

  // Throttling de pacotes de rede (~25Hz)
  private lastHubSendTime = 0;
  private lastRaceSendTime = 0;
  private lastArenaSendTime = 0;
  private readonly SEND_INTERVAL_MS = 40; // 25 updates/sec

  // Callbacks de eventos
  public onStatusChange?: (status: NetworkStatus, onlineCount: number) => void;
  public onPlayerJoined?: (id: string, player: RemotePlayer) => void;
  public onPlayerLeft?: (id: string) => void;
  public onChatMessage?: (data: { senderId: string; senderName: string; text: string; timestamp: number }) => void;
  public onSnowballSpawned?: (data: { senderId: string; senderName: string; x: number; y: number; z: number; vx: number; vy: number; vz: number; charge: number }) => void;
  public onPlayerEmote?: (data: { senderId: string; senderName: string; emote: string }) => void;
  public onRaceCountdown?: (seconds: number) => void;
  public onRaceStart?: () => void;
  public onPlayerFinished?: (data: { sessionId: string; name: string; rank: number; finishTime: number; score: number }) => void;
  public onRaceFinished?: (data: { leaderboard: any[] }) => void;

  // Callbacks da Arena de Guerra de Neve PvP
  public onArenaHit?: (data: { targetId: string; targetName: string; attackerId: string; attackerName: string; newHealth: number }) => void;
  public onArenaKO?: (data: { victimId: string; victimName: string; attackerId: string; attackerName: string; attackerKOs: number }) => void;
  public onArenaRespawn?: (data: { playerId: string; x: number; y: number; z: number; health: number }) => void;
  public onArenaFinished?: (data: { leaderboard: any[] }) => void;

  constructor() {
    let serverUrl: string = (import.meta as any).env?.VITE_SERVER_URL || '';

    // Permite sobrescrever via query param (?server=wss://... ou ?server=ws://localhost:2567)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryServer = params.get('server');
      if (queryServer) {
        serverUrl = queryServer;
      }
    }

    // Se não especificado:
    if (!serverUrl) {
      const isLocalhost = typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.endsWith('.local')
      );

      if (isLocalhost) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        serverUrl = `${protocol}//${window.location.hostname}:2567`;
      } else {
        // Fallback padrão em produção: Railway WebSocket Server
        serverUrl = 'wss://truthful-charm-production-bdfb.up.railway.app';
      }
    }

    console.log(`[NetworkManager] Conectando ao servidor Colyseus: ${serverUrl}`);
    this.client = new Client(serverUrl);
  }

  // =========================================================================
  // HUB DA VILA ALPINA
  // =========================================================================
  public async connectToHub(profile: PlayerProfile, scene: THREE.Scene): Promise<boolean> {
    this.status = 'connecting';
    this.onStatusChange?.('connecting', 1);

    try {
      this.hubRoom = await this.client.joinOrCreate<GameState>('alpine_hub', {
        name: profile.name,
        character: profile.character,
        vehicle: profile.vehicle,
        hat: profile.hat,
        scarf: profile.scarf,
        goggles: profile.goggles,
      });

      this.sessionId = this.hubRoom.sessionId;
      this.status = 'connected';
      console.log(`[NetworkManager] Conectado à Vila Alpina! SessionId: ${this.sessionId}`);

      this.setupHubRoomListeners(this.hubRoom, scene);
      this.updateOnlineCount();
      return true;
    } catch (err) {
      console.warn('[NetworkManager] Não foi possível conectar ao servidor Colyseus (iniciando em modo solo/offline):', err);
      this.status = 'offline';
      this.hubRoom = null;
      this.onStatusChange?.('offline', 1);
      return false;
    }
  }

  private setupHubRoomListeners(room: Room<GameState>, scene: THREE.Scene) {
    // Jogadores no Hub
    room.state.players.onAdd((player: PlayerState, key: string) => {
      if (key === this.sessionId) return; // Ignora avatar próprio

      const remote = new RemotePlayer(
        key,
        {
          name: player.name,
          character: player.character,
          vehicle: player.vehicle,
          hat: player.hat,
          scarf: player.scarf,
          goggles: player.goggles,
          x: player.x,
          y: player.y,
          z: player.z,
          rotY: player.rotY,
        },
        scene
      );

      this.remotePlayers.set(key, remote);
      this.onPlayerJoined?.(key, remote);
      this.updateOnlineCount();

      // Observa mudanças do jogador
      player.onChange(() => {
        const rp = this.remotePlayers.get(key);
        if (!rp) return;

        rp.targetPosition.set(player.x, player.y, player.z);
        rp.targetRotationY = player.rotY;
        rp.velX = player.velX;
        rp.velZ = player.velZ;
        rp.isMoving = player.isMoving;
        rp.isRunning = player.isRunning;
        rp.isSitting = player.isSitting;
        rp.animState = player.animState;

        // Atualiza cosméticos se modificados
        rp.setCosmetics(player.character, player.vehicle, player.hat, player.scarf, player.goggles, false);
      });
    });

    room.state.players.onRemove((_player: PlayerState, key: string) => {
      const rp = this.remotePlayers.get(key);
      if (rp) {
        rp.destroy();
        this.remotePlayers.delete(key);
        this.onPlayerLeft?.(key);
        this.updateOnlineCount();
      }
    });

    // Mensagens de Chat
    room.onMessage('chatMessage', (data: any) => {
      this.onChatMessage?.(data);
      const rp = this.remotePlayers.get(data.senderId);
      if (rp) {
        rp.showChatBubble(data.text);
      }
    });

    // Emotes
    room.onMessage('playerEmote', (data: any) => {
      this.onPlayerEmote?.(data);
      const rp = this.remotePlayers.get(data.senderId);
      if (rp) {
        rp.showChatBubble(data.emote);
      }
    });

    // Projéteis de bola de neve no Hub
    room.onMessage('snowballSpawned', (data: any) => {
      this.onSnowballSpawned?.(data);
    });

    // Desconexão
    room.onLeave(() => {
      this.status = 'offline';
      this.clearRemotePlayers();
      this.onStatusChange?.('offline', 1);
    });
  }

  public sendHubTransform(
    x: number,
    y: number,
    z: number,
    rotX: number,
    rotY: number,
    rotZ: number,
    velX: number,
    velZ: number,
    isMoving: boolean,
    isRunning: boolean,
    isSitting: boolean,
    animState: string
  ) {
    if (!this.hubRoom || this.status !== 'connected') return;

    const now = performance.now();
    if (now - this.lastHubSendTime < this.SEND_INTERVAL_MS) return;
    this.lastHubSendTime = now;

    this.hubRoom.send('updatePosition', {
      x,
      y,
      z,
      rotX,
      rotY,
      rotZ,
      velX,
      velZ,
      isMoving,
      isRunning,
      isSitting,
      animState,
    });
  }

  public sendCosmetics(character: string, vehicle: string, hat: string, scarf: string, goggles: string) {
    if (!this.hubRoom || this.status !== 'connected') return;
    this.hubRoom.send('updateCosmetics', { character, vehicle, hat, scarf, goggles });
  }

  public sendSnowballThrow(x: number, y: number, z: number, vx: number, vy: number, vz: number, charge: number = 1.0) {
    if (!this.hubRoom || this.status !== 'connected') return;
    this.hubRoom.send('throwSnowball', { x, y, z, vx, vy, vz, charge });
  }

  public sendChat(message: string) {
    if (!this.hubRoom || this.status !== 'connected') return;
    this.hubRoom.send('chat', message);
  }

  public sendChatMessage(message: string) {
    this.sendChat(message);
  }

  public sendEmote(emote: string) {
    if (!this.hubRoom || this.status !== 'connected') return;
    this.hubRoom.send('emote', emote);
  }

  public leaveHub() {
    if (this.hubRoom) {
      this.hubRoom.leave();
      this.hubRoom = null;
    }
    this.clearRemotePlayers();
  }

  // =========================================================================
  // CORRIDA DOWNHILL MULTIPLAYER (SLEDDING MATCH)
  // =========================================================================
  public async joinRace(profile: PlayerProfile, scene: THREE.Scene): Promise<boolean> {
    this.leaveHub();
    this.clearRemotePlayers();

    try {
      this.raceRoom = await this.client.joinOrCreate<GameState>('sledding_match', {
        name: profile.name,
        character: profile.character,
        vehicle: profile.vehicle,
        hat: profile.hat,
        scarf: profile.scarf,
        goggles: profile.goggles,
      });

      this.sessionId = this.raceRoom.sessionId;
      this.status = 'connected';
      console.log(`[NetworkManager] Entrou na sala de corrida! SessionId: ${this.sessionId}`);

      this.setupRaceRoomListeners(this.raceRoom, scene);
      return true;
    } catch (err) {
      console.warn('[NetworkManager] Erro ao entrar na sala de corrida multiplayer:', err);
      return false;
    }
  }

  private setupRaceRoomListeners(room: Room<GameState>, scene: THREE.Scene) {
    room.state.players.onAdd((player: PlayerState, key: string) => {
      if (key === this.sessionId) return;

      const remote = new RemotePlayer(
        key,
        {
          name: player.name,
          character: player.character,
          vehicle: player.vehicle,
          hat: player.hat,
          scarf: player.scarf,
          goggles: player.goggles,
          x: player.x,
          y: player.y,
          z: player.z,
          rotY: player.rotY,
        },
        scene
      );
      remote.rebuildAvatar(true); // Constrói com veículo de corrida montado

      this.remotePlayers.set(key, remote);
      this.onPlayerJoined?.(key, remote);

      player.onChange(() => {
        const rp = this.remotePlayers.get(key);
        if (!rp) return;

        rp.targetPosition.set(player.x, player.y, player.z);
        rp.targetRotationY = player.rotY;
        rp.targetRotationX = player.rotX;
        rp.targetRotationZ = player.rotZ;
        rp.velX = player.velX;
        rp.velZ = player.velZ;
      });
    });

    room.state.players.onRemove((_player: PlayerState, key: string) => {
      const rp = this.remotePlayers.get(key);
      if (rp) {
        rp.destroy();
        this.remotePlayers.delete(key);
        this.onPlayerLeft?.(key);
      }
    });

    // Observa fase e contagem regressiva da corrida
    room.state.listen('countdown', (currValue: number) => {
      this.onRaceCountdown?.(currValue);
    });

    room.onMessage('raceStarted', () => {
      this.onRaceStart?.();
    });

    room.onMessage('playerFinished', (data: any) => {
      this.onPlayerFinished?.(data);
    });

    room.onMessage('raceFinished', (data: any) => {
      this.onRaceFinished?.(data);
    });
  }

  public sendRaceReady() {
    if (!this.raceRoom) return;
    this.raceRoom.send('readyUp');
  }

  public sendRaceTransform(
    x: number,
    y: number,
    z: number,
    rotX: number,
    rotY: number,
    rotZ: number,
    velX: number,
    velZ: number,
    score: number,
    gatesCleared: number
  ) {
    if (!this.raceRoom || this.status !== 'connected') return;

    const now = performance.now();
    if (now - this.lastRaceSendTime < this.SEND_INTERVAL_MS) return;
    this.lastRaceSendTime = now;

    this.raceRoom.send('updateRacePosition', {
      x,
      y,
      z,
      rotX,
      rotY,
      rotZ,
      velX,
      velZ,
      score,
      gatesCleared,
    });
  }

  public sendRaceFinish(score: number, gatesCleared: number) {
    if (!this.raceRoom || this.status !== 'connected') return;
    this.raceRoom.send('finishRace', { score, gatesCleared });
  }

  public leaveRace() {
    if (this.raceRoom) {
      this.raceRoom.leave();
      this.raceRoom = null;
    }
    this.clearRemotePlayers();
  }

  // =========================================================================
  // ARENA DE GUERRA DE NEVE PVP
  // =========================================================================
  public async connectToArena(profile: PlayerProfile, scene: THREE.Scene): Promise<boolean> {
    this.status = 'connecting';
    this.onStatusChange?.('connecting', 1);

    try {
      this.arenaRoom = await this.client.joinOrCreate<GameState>('snowball_arena', {
        name: profile.name,
        character: profile.character,
        vehicle: profile.vehicle,
        hat: profile.hat,
        scarf: profile.scarf,
        goggles: profile.goggles,
      });

      this.sessionId = this.arenaRoom.sessionId;
      this.status = 'connected';
      console.log(`[NetworkManager] Conectado à Arena de Guerra de Neve! SessionId: ${this.sessionId}`);

      this.setupArenaRoomListeners(this.arenaRoom, scene);
      this.updateOnlineCount();
      return true;
    } catch (err) {
      console.warn('[NetworkManager] Não foi possível conectar à Arena PvP.', err);
      this.status = 'offline';
      this.onStatusChange?.('offline', 1);
      return false;
    }
  }

  private setupArenaRoomListeners(room: Room<GameState>, scene: THREE.Scene) {
    room.state.players.onAdd((player: PlayerState, key: string) => {
      if (key === this.sessionId) return;
      const remotePlayer = new RemotePlayer(
        key,
        {
          name: player.name,
          character: player.character,
          vehicle: player.vehicle,
          hat: player.hat,
          scarf: player.scarf,
          goggles: player.goggles,
          x: player.x,
          y: player.y,
          z: player.z,
          rotY: player.rotY,
        },
        scene
      );
      this.remotePlayers.set(key, remotePlayer);
      this.onPlayerJoined?.(key, remotePlayer);
      this.updateOnlineCount();

      player.onChange(() => {
        const rp = this.remotePlayers.get(key);
        if (!rp) return;
        rp.targetPosition.set(player.x, player.y, player.z);
        rp.targetRotationY = player.rotY;
        rp.velX = player.velX;
        rp.velZ = player.velZ;
        rp.isMoving = player.isMoving;
        rp.isRunning = player.isRunning;
        rp.animState = player.animState;
      });
    });

    room.state.players.onRemove((player: PlayerState, key: string) => {
      const rp = this.remotePlayers.get(key);
      if (rp) {
        rp.destroy();
        this.remotePlayers.delete(key);
        this.onPlayerLeft?.(key);
        this.updateOnlineCount();
      }
    });

    room.onMessage('snowballSpawned', (data: any) => {
      this.onSnowballSpawned?.(data);
    });

    room.onMessage('playerHit', (data: any) => {
      this.onArenaHit?.(data);
    });

    room.onMessage('playerKO', (data: any) => {
      this.onArenaKO?.(data);
    });

    room.onMessage('playerRespawn', (data: any) => {
      this.onArenaRespawn?.(data);
    });

    room.onMessage('arenaFinished', (data: any) => {
      this.onArenaFinished?.(data);
    });

    room.onMessage('chatMessage', (data: any) => {
      this.onChatMessage?.(data);
      const sender = this.remotePlayers.get(data.senderId);
      if (sender) {
        sender.showChatBubble(data.text);
      }
    });
  }

  public sendArenaMovement(data: { x: number; y: number; z: number; rotY: number; animState: string; isMoving: boolean }) {
    if (!this.arenaRoom || this.status !== 'connected') return;
    const now = performance.now();
    if (now - this.lastArenaSendTime < this.SEND_INTERVAL_MS) return;
    this.lastArenaSendTime = now;
    this.arenaRoom.send('updateMovement', data);
  }

  public sendArenaSnowball(pos: THREE.Vector3, vel: THREE.Vector3, charge = 1.0) {
    if (!this.arenaRoom || this.status !== 'connected') return;
    this.arenaRoom.send('throwSnowball', {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      vx: vel.x,
      vy: vel.y,
      vz: vel.z,
      charge
    });
  }

  public sendArenaHit(targetId: string) {
    if (!this.arenaRoom || this.status !== 'connected') return;
    this.arenaRoom.send('hitPlayer', { targetId });
  }

  public leaveArena() {
    if (this.arenaRoom) {
      this.arenaRoom.leave();
      this.arenaRoom = null;
    }
    this.clearRemotePlayers();
  }

  // =========================================================================
  // AUXILIARES
  // =========================================================================
  public updateRemotePlayers(delta: number, time: number, isRacing: boolean = false) {
    this.remotePlayers.forEach((rp) => {
      rp.update(delta, time, isRacing);
    });
  }

  public clearRemotePlayers() {
    this.remotePlayers.forEach((rp) => {
      rp.destroy();
    });
    this.remotePlayers.clear();
  }

  private updateOnlineCount() {
    const total = 1 + this.remotePlayers.size;
    this.onStatusChange?.(this.status, total);
  }
}
