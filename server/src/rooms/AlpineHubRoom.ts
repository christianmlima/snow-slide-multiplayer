import { Room, Client } from 'colyseus';
import { GameState, PlayerState } from '@snow-slide/shared';

export class AlpineHubRoom extends Room<GameState> {
  maxClients = 32;

  onCreate(options: any) {
    this.setState(new GameState());
    this.state.phase = 'HUB';

    // Atualização de transform e movimento do jogador
    this.onMessage('updatePosition', (client: Client, data: any) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        if (typeof data.x === 'number') player.x = data.x;
        if (typeof data.y === 'number') player.y = data.y;
        if (typeof data.z === 'number') player.z = data.z;
        if (typeof data.rotX === 'number') player.rotX = data.rotX;
        if (typeof data.rotY === 'number') player.rotY = data.rotY;
        if (typeof data.rotZ === 'number') player.rotZ = data.rotZ;
        if (typeof data.velX === 'number') player.velX = data.velX;
        if (typeof data.velZ === 'number') player.velZ = data.velZ;
        if (typeof data.isMoving === 'boolean') player.isMoving = data.isMoving;
        if (typeof data.isRunning === 'boolean') player.isRunning = data.isRunning;
        if (typeof data.isSitting === 'boolean') player.isSitting = data.isSitting;
        if (typeof data.animState === 'string') player.animState = data.animState;
      }
    });

    // Atualização de cosméticos e equipamentos
    this.onMessage('updateCosmetics', (client: Client, data: any) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        if (data.character) player.character = data.character;
        if (data.vehicle) player.vehicle = data.vehicle;
        if (data.hat !== undefined) player.hat = data.hat;
        if (data.scarf !== undefined) player.scarf = data.scarf;
        if (data.goggles !== undefined) player.goggles = data.goggles;
      }
    });

    // Arremesso de bola de neve no Hub
    this.onMessage('throwSnowball', (client: Client, data: any) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      this.broadcast('snowballSpawned', {
        senderId: client.sessionId,
        senderName: player.name,
        x: data.x,
        y: data.y,
        z: data.z,
        vx: data.vx,
        vy: data.vy,
        vz: data.vz,
        charge: data.charge || 1.0,
      }, { except: client });
    });

    // Chat textual entre jogadores
    this.onMessage('chat', (client: Client, message: string) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || typeof message !== 'string') return;

      const cleanText = message.trim().substring(0, 80);
      if (cleanText.length === 0) return;

      const now = Date.now();
      player.lastMessage = cleanText;
      player.lastMessageTime = now;

      this.broadcast('chatMessage', {
        senderId: client.sessionId,
        senderName: player.name,
        text: cleanText,
        timestamp: now,
      });
    });

    // Emotes e reações rápidas
    this.onMessage('emote', (client: Client, emoteName: string) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || typeof emoteName !== 'string') return;

      this.broadcast('playerEmote', {
        senderId: client.sessionId,
        senderName: player.name,
        emote: emoteName,
      });
    });
  }

  onJoin(client: Client, options: any) {
    const player = new PlayerState();
    player.id = client.sessionId;
    player.name = (options.name && options.name.trim().length > 0)
      ? options.name.trim().substring(0, 16)
      : `Esquiador_${client.sessionId.substring(0, 4)}`;
    player.character = options.character || 'penguin';
    player.vehicle = options.vehicle || 'board_basic';
    player.hat = options.hat || 'none';
    player.scarf = options.scarf || 'none';
    player.goggles = options.goggles || 'none';

    // Posição inicial no centro da vila (próximo à fogueira)
    player.x = (Math.random() - 0.5) * 6;
    player.y = 0;
    player.z = (Math.random() - 0.5) * 6;
    player.rotY = Math.random() * Math.PI * 2;
    player.state = 'HUB';

    this.state.players.set(client.sessionId, player);
    console.log(`[AlpineHubRoom] ${player.name} (${client.sessionId}) entrou na Vila Alpina. Total: ${this.state.players.size}`);

    this.broadcast('chatMessage', {
      senderId: 'SYSTEM',
      senderName: '❄️ Vila Alpina',
      text: `${player.name} entrou na vila!`,
      timestamp: Date.now(),
    });
  }

  onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    const name = player ? player.name : client.sessionId;
    this.state.players.delete(client.sessionId);
    console.log(`[AlpineHubRoom] ${name} saiu. Restantes: ${this.state.players.size}`);

    this.broadcast('chatMessage', {
      senderId: 'SYSTEM',
      senderName: '❄️ Vila Alpina',
      text: `${name} saiu da vila.`,
      timestamp: Date.now(),
    });
  }

  onDispose() {
    console.log('[AlpineHubRoom] Sala da vila desfeita.');
  }
}
