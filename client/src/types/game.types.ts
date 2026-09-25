import * as THREE from 'three';

export type CharacterId = 'penguin' | 'frog' | 'cat' | 'dog';

export type SceneType = 'LOGIN' | 'HUB' | 'RACING' | 'SHOOTING_GALLERY' | 'SNOWBALL_WAR' | 'SNOWBALL_WAR_PVP';

export interface CharacterRig {
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  armL: THREE.Object3D;
  armR: THREE.Object3D;
  footL: THREE.Object3D;
  footR: THREE.Object3D;
  tail: THREE.Object3D | null;
  scarfTail: THREE.Mesh | null;
  handSnowball?: THREE.Mesh | null;
}

export interface ShopItem {
  id: string;
  name: string;
  category: 'sleds' | 'hats' | 'scarves' | 'goggles';
  price: number;
  icon: string;
  desc: string;
}

export interface CircleCollider {
  type: 'circle';
  x: number;
  z: number;
  r: number;
}

export interface BoxCollider {
  type: 'box';
  x: number;
  z: number;
  hw: number;
  hd: number;
  angle: number;
}

export type HubCollider = CircleCollider | BoxCollider;

export interface WanderingNPC {
  mesh: THREE.Group;
  name: string;
  type: CharacterId;
  waypoints: { x: number; z: number }[];
  wpIndex: number;
  speed: number;
  walkTime: number;
  footL: THREE.Mesh;
  footR: THREE.Mesh;
  torso: THREE.Group;
  armL: THREE.Mesh;
  armR: THREE.Mesh;
  tail: THREE.Mesh | null;
  state: 'walking' | 'idle' | 'hit';
  reactionTimer: number;
  yVel: number;
  rig?: CharacterRig;
}

export interface BenchSpot {
  x: number;
  z: number;
  rotY: number;
}

export interface ActiveSnowball {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  isEnemy?: boolean;
  gravity: number;
}

export interface CarnivalTarget {
  group: THREE.Group;
  type: 'duck' | 'bullseye' | 'star' | 'bomb';
  shelfIndex: number;
  x: number;
  baseY: number;
  z: number;
  speed: number;
  dir: number;
  points: number;
  hit: boolean;
  hitTimer: number;
}

export interface WarBot {
  id: string;
  name: string;
  type: CharacterId;
  group: THREE.Group;
  rig: CharacterRig;
  pos: THREE.Vector3;
  rotY: number;
  health: number;
  maxHealth: number;
  state: 'patrol' | 'skirmish' | 'windup' | 'throw' | 'frozen';
  stateTimer: number;
  targetPos: THREE.Vector3;
  invulnTimer: number;
  iceCube: THREE.Mesh | null;
  walkTime: number;
  strafeDir: number;
  throwCooldown: number;
  hitTimer: number;
  isMoving: boolean;
}

export interface WarObstacle {
  x: number;
  z: number;
  hw: number;
  hd: number;
  height: number;
}

export interface EquippedState {
  vehicle: string;
  hat: string;
  scarf: string;
  goggles: string;
}

export interface RaceBot {
  id: string;
  name: string;
  type: CharacterId;
  group: THREE.Group;
  rig: CharacterRig;
  x: number;
  y: number;
  z: number;
  velX: number;
  velZ: number;
  baseSpeed: number;
  targetX: number;
  isJumping: boolean;
  jumpVelY: number;
  driftTimer: number;
  driftDir: number;
  miniTurboTimer: number;
  spinoutTimer: number;
  itemCooldown: number;
  hasShield: boolean;
  shieldMesh: THREE.Mesh | null;
  rank: number;
  finished: boolean;
}

