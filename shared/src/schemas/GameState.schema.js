"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameState = exports.PlayerState = void 0;
const schema_1 = require("@colyseus/schema");
class PlayerState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.id = '';
        this.name = '';
        this.character = 'penguin';
        this.vehicle = 'board_basic';
        this.hat = 'none';
        this.scarf = 'none';
        this.goggles = 'none';
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.rotX = 0;
        this.rotY = 0;
        this.rotZ = 0;
        this.velX = 0;
        this.velY = 0;
        this.velZ = 0;
        this.isMoving = false;
        this.isRunning = false;
        this.isSitting = false;
        this.animState = 'idle';
        this.state = 'HUB'; // HUB | WAITING | READY | RACING | FINISHED | ARENA
        this.score = 0;
        this.gatesCleared = 0;
        this.finishTime = 0;
        this.rank = 0;
        this.health = 3;
        this.kos = 0;
        this.lastMessage = '';
        this.lastMessageTime = 0;
    }
}
exports.PlayerState = PlayerState;
__decorate([
    (0, schema_1.type)('string'),
    __metadata("design:type", String)
], PlayerState.prototype, "id", void 0);
__decorate([
    (0, schema_1.type)('string'),
    __metadata("design:type", String)
], PlayerState.prototype, "name", void 0);
__decorate([
    (0, schema_1.type)('string'),
    __metadata("design:type", String)
], PlayerState.prototype, "character", void 0);
__decorate([
    (0, schema_1.type)('string'),
    __metadata("design:type", String)
], PlayerState.prototype, "vehicle", void 0);
__decorate([
    (0, schema_1.type)('string'),
    __metadata("design:type", String)
], PlayerState.prototype, "hat", void 0);
__decorate([
    (0, schema_1.type)('string'),
    __metadata("design:type", String)
], PlayerState.prototype, "scarf", void 0);
__decorate([
    (0, schema_1.type)('string'),
    __metadata("design:type", String)
], PlayerState.prototype, "goggles", void 0);
__decorate([
    (0, schema_1.type)('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "x", void 0);
__decorate([
    (0, schema_1.type)('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "y", void 0);
__decorate([
    (0, schema_1.type)('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "z", void 0);
__decorate([
    (0, schema_1.type)('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "rotX", void 0);
__decorate([
    (0, schema_1.type)('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "rotY", void 0);
__decorate([
    (0, schema_1.type)('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "rotZ", void 0);
__decorate([
    (0, schema_1.type)('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "velX", void 0);
__decorate([
    (0, schema_1.type)('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "velY", void 0);
__decorate([
    (0, schema_1.type)('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "velZ", void 0);
__decorate([
    (0, schema_1.type)('boolean'),
    __metadata("design:type", Boolean)
], PlayerState.prototype, "isMoving", void 0);
__decorate([
    (0, schema_1.type)('boolean'),
    __metadata("design:type", Boolean)
], PlayerState.prototype, "isRunning", void 0);
__decorate([
    (0, schema_1.type)('boolean'),
    __metadata("design:type", Boolean)
], PlayerState.prototype, "isSitting", void 0);
__decorate([
    (0, schema_1.type)('string'),
    __metadata("design:type", String)
], PlayerState.prototype, "animState", void 0);
__decorate([
    (0, schema_1.type)('string'),
    __metadata("design:type", String)
], PlayerState.prototype, "state", void 0);
__decorate([
    (0, schema_1.type)('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "score", void 0);
__decorate([
    (0, schema_1.type)('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "gatesCleared", void 0);
__decorate([
    (0, schema_1.type)('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "finishTime", void 0);
__decorate([
    (0, schema_1.type)('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "rank", void 0);
__decorate([
    (0, schema_1.type)('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "health", void 0);
__decorate([
    (0, schema_1.type)('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "kos", void 0);
__decorate([
    (0, schema_1.type)('string'),
    __metadata("design:type", String)
], PlayerState.prototype, "lastMessage", void 0);
__decorate([
    (0, schema_1.type)('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "lastMessageTime", void 0);
class GameState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.players = new schema_1.MapSchema();
        this.phase = 'HUB'; // HUB | LOBBY | COUNTDOWN | RACING | FINISHED | ARENA
        this.countdown = 0;
        this.raceStartTime = 0;
        this.matchTimeRemaining = 180;
    }
}
exports.GameState = GameState;
__decorate([
    (0, schema_1.type)({ map: PlayerState }),
    __metadata("design:type", Object)
], GameState.prototype, "players", void 0);
__decorate([
    (0, schema_1.type)('string'),
    __metadata("design:type", String)
], GameState.prototype, "phase", void 0);
__decorate([
    (0, schema_1.type)('number'),
    __metadata("design:type", Number)
], GameState.prototype, "countdown", void 0);
__decorate([
    (0, schema_1.type)('number'),
    __metadata("design:type", Number)
], GameState.prototype, "raceStartTime", void 0);
__decorate([
    (0, schema_1.type)('number'),
    __metadata("design:type", Number)
], GameState.prototype, "matchTimeRemaining", void 0);
