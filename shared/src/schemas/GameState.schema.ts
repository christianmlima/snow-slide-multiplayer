import { Schema, type } from '@colyseus/schema';

export class PlayerState extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
  @type('string') character: string = 'penguin';
  @type('string') vehicle: string = 'board';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') z: number = 0;
  @type('number') rotY: number = 0;
  @type('string') state: string = 'HUB'; // HUB | CABLE_CAR | RACING | FINISHED
}

export class GameState extends Schema {
  @type({ map: PlayerState }) players = new Map<string, PlayerState>();
  @type('string') phase: string = 'HUB';
}
