import { Schema, type, MapSchema } from '@colyseus/schema';

export class PlayerState extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
  @type('string') character: string = 'penguin';
  @type('string') vehicle: string = 'board_basic';
  @type('string') hat: string = 'none';
  @type('string') scarf: string = 'none';
  @type('string') goggles: string = 'none';

  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') z: number = 0;
  @type('number') rotX: number = 0;
  @type('number') rotY: number = 0;
  @type('number') rotZ: number = 0;
  @type('number') velX: number = 0;
  @type('number') velY: number = 0;
  @type('number') velZ: number = 0;

  @type('boolean') isMoving: boolean = false;
  @type('boolean') isRunning: boolean = false;
  @type('boolean') isSitting: boolean = false;
  @type('string') animState: string = 'idle';

  @type('string') state: string = 'HUB'; // HUB | WAITING | READY | RACING | FINISHED | ARENA
  @type('number') score: number = 0;
  @type('number') gatesCleared: number = 0;
  @type('number') finishTime: number = 0;
  @type('number') rank: number = 0;

  @type('number') health: number = 3;
  @type('number') kos: number = 0;

  @type('string') lastMessage: string = '';
  @type('number') lastMessageTime: number = 0;
}

export class GameState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type('string') phase: string = 'HUB'; // HUB | LOBBY | COUNTDOWN | RACING | FINISHED | ARENA
  @type('number') countdown: number = 0;
  @type('number') raceStartTime: number = 0;
  @type('number') matchTimeRemaining: number = 180;
}
