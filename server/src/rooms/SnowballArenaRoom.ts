import { Room, Client } from 'colyseus';
import { GameState, PlayerState } from '@snow-slide/shared';

export class SnowballArenaRoom extends Room<GameState> {
  maxClients = 8;
  private matchInterval: any = null;

  onCreate(options: any) {
    this.setState(new GameState());
    this.state.phase = 'ARENA';
    this.state.matchTimeRemaining = 180; // 3 minutos de partida

    // Atualização de movimento e mira dos gladiadores de neve
    this.onMessage('updateMovement', (client: Client, data: any) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        if (typeof data.x === 'number') player.x = data.x;
        if (typeof data.y === 'number') player.y = data.y;
        if (typeof data.z === 'number') player.z = data.z;
        if (typeof data.rotY === 'number') player.rotY = data.rotY;
        if (typeof data.animState === 'string') player.animState = data.animState;
        if (typeof data.isMoving === 'boolean') player.isMoving = data.isMoving;
      }
    });

    // Lançamento de bola de neve física na arena
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
        charge: data.charge || 1.0
      });
    });

    // Dano / Impacto validado
    this.onMessage('hitPlayer', (client: Client, data: { targetId: string }) => {
      const attacker = this.state.players.get(client.sessionId);
      const target = this.state.players.get(data.targetId);

      if (attacker && target && target.health > 0) {
        target.health = Math.max(0, target.health - 1);
        console.log(`[SnowballArena] ${attacker.name} acertou ${target.name}! Vida restante: ${target.health}`);

        this.broadcast('playerHit', {
          targetId: target.id,
          targetName: target.name,
          attackerId: attacker.id,
          attackerName: attacker.name,
          newHealth: target.health
        });

        // Se a vida zerar, registrar KO e agendar respawn
        if (target.health <= 0) {
          attacker.kos++;
          attacker.score += 250;
          target.state = 'RESPAWNING';

          console.log(`[SnowballArena] 💥 KO! ${attacker.name} eliminou ${target.name}! Total KOs: ${attacker.kos}`);

          this.broadcast('playerKO', {
            victimId: target.id,
            victimName: target.name,
            attackerId: attacker.id,
            attackerName: attacker.name,
            attackerKOs: attacker.kos
          });

          // Respawn em 3 segundos
          this.clock.setTimeout(() => {
            if (this.state.players.has(target.id)) {
              target.health = 3;
              target.state = 'ARENA';
              // Posição aleatória na arena
              target.x = (Math.random() - 0.5) * 35;
              target.z = (Math.random() - 0.5) * 35;
              target.y = 0;

              this.broadcast('playerRespawn', {
                playerId: target.id,
                x: target.x,
                y: target.y,
                z: target.z,
                health: 3
              });
            }
          }, 3000);
        }
      }
    });

    // Chat interno da arena
    this.onMessage('chat', (client: Client, message: string) => {
      const player = this.state.players.get(client.sessionId);
      if (player && typeof message === 'string' && message.trim().length > 0) {
        const text = message.trim().slice(0, 70);
        player.lastMessage = text;
        player.lastMessageTime = Date.now();
        this.broadcast('chatMessage', {
          senderId: client.sessionId,
          senderName: player.name,
          text,
          timestamp: Date.now()
        });
      }
    });

    // Loop do temporizador da arena (1Hz)
    this.matchInterval = this.clock.setInterval(() => {
      if (this.state.matchTimeRemaining > 0) {
        this.state.matchTimeRemaining--;
        if (this.state.matchTimeRemaining === 0) {
          this.finishMatch();
        }
      }
    }, 1000);
  }

  onJoin(client: Client, options: any) {
    const player = new PlayerState();
    player.id = client.sessionId;
    player.name = (options.name && options.name.trim().length > 0) ? options.name.trim().slice(0, 16) : `Guerreiro_${client.sessionId.slice(0, 4)}`;
    player.character = options.character || 'penguin';
    player.vehicle = options.vehicle || 'board_basic';
    player.hat = options.hat || 'none';
    player.scarf = options.scarf || 'none';
    player.goggles = options.goggles || 'none';
    player.health = 3;
    player.kos = 0;
    player.state = 'ARENA';

    // Posições de spawn espalhadas pela arena
    player.x = (Math.random() - 0.5) * 30;
    player.y = 0;
    player.z = (Math.random() - 0.5) * 30;

    this.state.players.set(client.sessionId, player);
    console.log(`[SnowballArena] ${player.name} (${client.sessionId}) entrou na Arena PvP! Total: ${this.state.players.size}`);

    this.broadcast('chatMessage', {
      senderId: 'SYSTEM',
      senderName: '❄️ Arena',
      text: `${player.name} entrou na batalha de neve!`,
      timestamp: Date.now()
    });
  }

  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      console.log(`[SnowballArena] ${player.name} saiu da arena.`);
      this.state.players.delete(client.sessionId);
    }
  }

  private finishMatch() {
    this.state.phase = 'FINISHED';
    const leaderboard: any[] = [];
    this.state.players.forEach((p) => {
      leaderboard.push({
        id: p.id,
        name: p.name,
        kos: p.kos,
        score: p.score
      });
    });
    leaderboard.sort((a, b) => b.kos - a.kos || b.score - a.score);

    this.broadcast('arenaFinished', { leaderboard });
    console.log('[SnowballArena] Partida finalizada! Placar:', leaderboard);
  }

  onDispose() {
    if (this.matchInterval) this.matchInterval.clear();
    console.log('[SnowballArena] Sala da arena desfeita.');
  }
}
