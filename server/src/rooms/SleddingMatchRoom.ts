import { Room, Client } from 'colyseus';
import { GameState, PlayerState } from '@snow-slide/shared';

export class SleddingMatchRoom extends Room<GameState> {
  maxClients = 8;
  private simulationInterval: any;

  onCreate (options: any) {
    this.setState(new GameState());
    this.state.phase = 'CABLE_CAR'; // Estado inicial: aguardando no bondinho

    this.onMessage('readyUp', (client) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.state = 'READY';
        console.log(`[SleddingMatchRoom] Player ready: ${player.name}`);
        this.checkAllReady();
      }
    });

    this.onMessage('clientInput', (client, input) => {
      const player = this.state.players.get(client.sessionId);
      if (player && this.state.phase === 'RACING') {
        // Atualização autoritativa simplificada de posição baseada no input
        const speed = 0.4;
        player.z += (input.forward || 0) * speed;
        player.x += (input.steer || 0) * speed;
      }
    });
  }

  onJoin (client: Client, options: any) {
    const player = new PlayerState();
    player.id = client.sessionId;
    player.name = options.name || `Racer_${client.sessionId.substring(0, 4)}`;
    player.character = options.character || 'penguin';
    player.vehicle = options.vehicle || 'board';
    player.state = 'WAITING';
    player.x = (Math.random() - 0.5) * 6;
    player.y = 0;
    player.z = 0;

    this.state.players.set(client.sessionId, player);
  }

  private checkAllReady() {
    let allReady = true;
    this.state.players.forEach((player) => {
      if (player.state !== 'READY') allReady = false;
    });

    if (allReady && this.state.players.size > 0) {
      this.startRace();
    }
  }

  private startRace() {
    this.state.phase = 'RACING';
    this.state.players.forEach((player) => {
      player.state = 'RACING';
    });
    console.log('[SleddingMatchRoom] Cable car arrived! Race started at 60Hz tickrate.');

    // Simulação do servidor a 60 Hz (16.6ms)
    this.simulationInterval = this.clock.setInterval(() => {
      // Loop de física autoritativa do servidor aqui
    }, 1000 / 60);
  }

  onLeave (client: Client, consented: boolean) {
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
  }
}
