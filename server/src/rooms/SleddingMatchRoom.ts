import { Room, Client } from 'colyseus';
import { GameState, PlayerState } from '@snow-slide/shared';

export class SleddingMatchRoom extends Room<GameState> {
  maxClients = 8;
  private lobbyCountdownTimer: any = null;
  private raceGraceTimer: any = null;
  private nextFinishRank = 1;

  onCreate(options: any) {
    this.setState(new GameState());
    this.state.phase = 'LOBBY';
    this.state.countdown = 0;

    // Jogador sinaliza que está pronto no teleférico
    this.onMessage('readyUp', (client: Client) => {
      const player = this.state.players.get(client.sessionId);
      if (player && this.state.phase === 'LOBBY') {
        player.state = 'READY';
        console.log(`[SleddingMatchRoom] ${player.name} está pronto!`);
        this.checkStartLobbyCountdown();
      }
    });

    // Atualização de telemetria durante a descida
    this.onMessage('updateRacePosition', (client: Client, data: any) => {
      const player = this.state.players.get(client.sessionId);
      if (player && this.state.phase === 'RACING') {
        if (typeof data.x === 'number') player.x = data.x;
        if (typeof data.y === 'number') player.y = data.y;
        if (typeof data.z === 'number') player.z = data.z;
        if (typeof data.rotX === 'number') player.rotX = data.rotX;
        if (typeof data.rotY === 'number') player.rotY = data.rotY;
        if (typeof data.rotZ === 'number') player.rotZ = data.rotZ;
        if (typeof data.velX === 'number') player.velX = data.velX;
        if (typeof data.velZ === 'number') player.velZ = data.velZ;
        if (typeof data.score === 'number') player.score = data.score;
        if (typeof data.gatesCleared === 'number') player.gatesCleared = data.gatesCleared;
      }
    });

    // Chegada à linha de chegada
    this.onMessage('finishRace', (client: Client, data: any) => {
      const player = this.state.players.get(client.sessionId);
      if (player && player.state === 'RACING') {
        player.state = 'FINISHED';
        player.finishTime = Date.now() - this.state.raceStartTime;
        player.rank = this.nextFinishRank++;
        if (typeof data?.score === 'number') player.score = data.score;
        if (typeof data?.gatesCleared === 'number') player.gatesCleared = data.gatesCleared;

        console.log(`[SleddingMatchRoom] ${player.name} cruzou a linha em ${player.rank}º lugar (${(player.finishTime / 1000).toFixed(2)}s)!`);

        this.broadcast('playerFinished', {
          sessionId: client.sessionId,
          name: player.name,
          rank: player.rank,
          finishTime: player.finishTime,
          score: player.score,
        });

        this.checkAllFinished();
      }
    });
  }

  onJoin(client: Client, options: any) {
    const player = new PlayerState();
    player.id = client.sessionId;
    player.name = (options.name && options.name.trim().length > 0)
      ? options.name.trim().substring(0, 16)
      : `Piloto_${client.sessionId.substring(0, 4)}`;
    player.character = options.character || 'penguin';
    player.vehicle = options.vehicle || 'board_basic';
    player.hat = options.hat || 'none';
    player.scarf = options.scarf || 'none';
    player.goggles = options.goggles || 'none';
    player.state = 'WAITING';

    // Alinha jogadores lado a lado na largada do cume
    const slotIndex = this.state.players.size;
    player.x = -6 + (slotIndex % 4) * 4;
    player.y = 0;
    player.z = -2 - Math.floor(slotIndex / 4) * 3;

    this.state.players.set(client.sessionId, player);
    console.log(`[SleddingMatchRoom] ${player.name} entrou no lobby de corrida. Total: ${this.state.players.size}`);

    // Auto-pronto se for corrida solo ou se já tiverem jogadores esperando
    if (this.state.players.size === 1) {
      // Inicia contagem de conveniência
      this.checkStartLobbyCountdown();
    }
  }

  private checkStartLobbyCountdown() {
    if (this.state.phase !== 'LOBBY') return;
    if (this.lobbyCountdownTimer) return;

    let countdownSeconds = 5;
    this.state.countdown = countdownSeconds;

    this.lobbyCountdownTimer = this.clock.setInterval(() => {
      countdownSeconds--;
      this.state.countdown = Math.max(0, countdownSeconds);

      if (countdownSeconds <= 0) {
        if (this.lobbyCountdownTimer) {
          this.lobbyCountdownTimer.clear();
          this.lobbyCountdownTimer = null;
        }
        this.startCountdown();
      }
    }, 1000);
  }

  private startCountdown() {
    this.state.phase = 'COUNTDOWN';
    let raceCountdown = 3;
    this.state.countdown = raceCountdown;

    const timer = this.clock.setInterval(() => {
      raceCountdown--;
      this.state.countdown = raceCountdown;

      if (raceCountdown <= 0) {
        timer.clear();
        this.startRace();
      }
    }, 1000);
  }

  private startRace() {
    this.state.phase = 'RACING';
    this.state.raceStartTime = Date.now();
    this.nextFinishRank = 1;

    this.state.players.forEach((player) => {
      player.state = 'RACING';
      player.score = 0;
      player.gatesCleared = 0;
    });

    console.log('[SleddingMatchRoom] 🏁 Corrida iniciada!');
    this.broadcast('raceStarted', { startTime: this.state.raceStartTime });
  }

  private checkAllFinished() {
    let allDone = true;
    let anyFinished = false;

    this.state.players.forEach((p) => {
      if (p.state === 'FINISHED') anyFinished = true;
      else allDone = false;
    });

    if (allDone) {
      this.endRace();
    } else if (anyFinished && !this.raceGraceTimer) {
      // Dá 15 segundos para os demais cruzarem a linha após o 1º colocado
      this.raceGraceTimer = this.clock.setTimeout(() => {
        this.endRace();
      }, 15000);
    }
  }

  private endRace() {
    if (this.raceGraceTimer) {
      this.raceGraceTimer.clear();
      this.raceGraceTimer = null;
    }

    this.state.phase = 'FINISHED';

    // Compila pódio final ordenado por rank e tempo
    const leaderboard: Array<{
      id: string;
      name: string;
      rank: number;
      finishTime: number;
      score: number;
      gatesCleared: number;
      character: string;
      vehicle: string;
    }> = [];

    this.state.players.forEach((p) => {
      leaderboard.push({
        id: p.id,
        name: p.name,
        rank: p.rank || 999,
        finishTime: p.finishTime || 999999,
        score: p.score,
        gatesCleared: p.gatesCleared,
        character: p.character,
        vehicle: p.vehicle,
      });
    });

    leaderboard.sort((a, b) => a.rank - b.rank || a.finishTime - b.finishTime);

    console.log('[SleddingMatchRoom] 🏆 Corrida finalizada! Resultados gerados.');
    this.broadcast('raceFinished', { leaderboard });
  }

  onLeave(client: Client, consented: boolean) {
    this.state.players.delete(client.sessionId);
    console.log(`[SleddingMatchRoom] Piloto ${client.sessionId} desconectou.`);
    if (this.state.phase === 'RACING') {
      this.checkAllFinished();
    }
  }

  onDispose() {
    if (this.lobbyCountdownTimer) this.lobbyCountdownTimer.clear();
    if (this.raceGraceTimer) this.raceGraceTimer.clear();
    console.log('[SleddingMatchRoom] Sala de corrida desfeita.');
  }
}
