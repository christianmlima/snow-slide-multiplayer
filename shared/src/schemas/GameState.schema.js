var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Schema, type } from '@colyseus/schema';
export class PlayerState extends Schema {
    id = '';
    name = '';
    character = 'penguin';
    vehicle = 'board';
    x = 0;
    y = 0;
    z = 0;
    rotY = 0;
    state = 'HUB'; // HUB | CABLE_CAR | RACING | FINISHED
}
__decorate([
    type('string'),
    __metadata("design:type", String)
], PlayerState.prototype, "id", void 0);
__decorate([
    type('string'),
    __metadata("design:type", String)
], PlayerState.prototype, "name", void 0);
__decorate([
    type('string'),
    __metadata("design:type", String)
], PlayerState.prototype, "character", void 0);
__decorate([
    type('string'),
    __metadata("design:type", String)
], PlayerState.prototype, "vehicle", void 0);
__decorate([
    type('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "x", void 0);
__decorate([
    type('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "y", void 0);
__decorate([
    type('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "z", void 0);
__decorate([
    type('number'),
    __metadata("design:type", Number)
], PlayerState.prototype, "rotY", void 0);
__decorate([
    type('string'),
    __metadata("design:type", String)
], PlayerState.prototype, "state", void 0);
export class GameState extends Schema {
    players = new Map();
    phase = 'HUB';
}
__decorate([
    type({ map: PlayerState }),
    __metadata("design:type", Object)
], GameState.prototype, "players", void 0);
__decorate([
    type('string'),
    __metadata("design:type", String)
], GameState.prototype, "phase", void 0);
