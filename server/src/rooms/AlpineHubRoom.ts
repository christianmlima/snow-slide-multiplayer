import { Room, Client } from 'colyseus';
import { GameState, PlayerState } from '@snow-slide/shared';

export class AlpineHubRoom extends Room<GameState> {
  maxClients = 16;

  onCreate (options: any) {
    this.setState(new GameState());

    this.onMessage('updatePosition', (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.x = data.x;
        player.y = data.y;
        player.z = data.z;
        player.rotY = data.rotY;
      }
    });
  }

  onJoin (client: Client, options: any) {
    const player = new PlayerState();
    player.id = client.sessionId;
    player.name = options.name || `Skier_${client.sessionId.substring(0, 4)}`;
    player.character = options.character || 'penguin';
    player.vehicle = options.vehicle || 'board';
    player.x = (Math.random() - 0.5) * 10;
    player.y = 0;
    player.z = 0;

    this.state.players.set(client.sessionId, player);
    console.log(`[AlpineHubRoom] Player joined: ${player.name} (${client.sessionId})`);
  }

  onLeave (client: Client, consented: boolean) {
    this.state.players.delete(client.sessionId);
    console.log(`[AlpineHubRoom] Player left: ${client.sessionId}`);
  }

  onDispose() {
    console.log('[AlpineHubRoom] Room disposed');
  }
}
