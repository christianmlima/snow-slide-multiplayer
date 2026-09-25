import * as THREE from 'three';
import { CharacterBuilder } from '../models/CharacterBuilder';
import { VehicleBuilder } from '../models/VehicleBuilder';
import { RigAnimator } from '../animation/RigAnimator';
import { CharacterRig, CharacterId } from '../types/game.types';

export class RemotePlayer {
  public readonly id: string;
  public name: string;
  public characterId: CharacterId;
  public vehicleId: string;
  public hatId: string;
  public scarfId: string;
  public gogglesId: string;

  public group: THREE.Group;
  public characterGroup: THREE.Group | null = null;
  public vehicleMesh: THREE.Group | null = null;
  public rig: CharacterRig | null = null;

  // Interpolação de movimento
  public targetPosition: THREE.Vector3 = new THREE.Vector3();
  public targetRotationY: number = 0;
  public targetRotationX: number = 0;
  public targetRotationZ: number = 0;
  public velX: number = 0;
  public velZ: number = 0;
  public isMoving: boolean = false;
  public isRunning: boolean = false;
  public isSitting: boolean = false;
  public animState: string = 'idle';

  // Físicas de combate e efeitos
  public freezeTimer = 0;
  public knockbackVel = new THREE.Vector3();

  public applyKnockback(dir: THREE.Vector3, force = 0.35) {
    this.knockbackVel.copy(dir).multiplyScalar(force);
  }

  public knockback(force = 0.35) {
    this.knockbackVel.set((Math.random() - 0.5) * force, 0.15, (Math.random() - 0.5) * force);
  }

  public applyFreeze(duration = 1.5) {
    this.freezeTimer = duration;
  }

  public unfreeze() {
    this.freezeTimer = 0;
  }

  // Nametag e Balão de Chat 3D
  private nameTagSprite: THREE.Sprite | null = null;
  private nameTagCanvas: HTMLCanvasElement;
  private nameTagContext: CanvasRenderingContext2D;
  private nameTagTexture: THREE.CanvasTexture;
  private currentChatText: string = '';
  private chatBubbleTimer: number = 0;

  constructor(
    id: string,
    options: {
      name?: string;
      character?: string;
      vehicle?: string;
      hat?: string;
      scarf?: string;
      goggles?: string;
      x?: number;
      y?: number;
      z?: number;
      rotY?: number;
    },
    private parentScene: THREE.Scene
  ) {
    this.id = id;
    this.name = options.name || `Piloto_${id.substring(0, 4)}`;
    this.characterId = (options.character as CharacterId) || 'penguin';
    this.vehicleId = options.vehicle || 'board_basic';
    this.hatId = options.hat || 'none';
    this.scarfId = options.scarf || 'none';
    this.gogglesId = options.goggles || 'none';

    this.group = new THREE.Group();
    const startX = options.x || 0;
    const startY = options.y || 0;
    const startZ = options.z || 0;
    this.group.position.set(startX, startY, startZ);
    this.targetPosition.set(startX, startY, startZ);
    this.targetRotationY = options.rotY || 0;
    this.group.rotation.y = this.targetRotationY;

    // Inicializa Canvas para Nametag
    this.nameTagCanvas = document.createElement('canvas');
    this.nameTagCanvas.width = 512;
    this.nameTagCanvas.height = 256;
    this.nameTagContext = this.nameTagCanvas.getContext('2d')!;
    this.nameTagTexture = new THREE.CanvasTexture(this.nameTagCanvas);
    this.nameTagTexture.minFilter = THREE.LinearFilter;

    this.rebuildAvatar();
    this.createNameTag();
    this.parentScene.add(this.group);
  }

  public rebuildAvatar(isRacing: boolean = false) {
    // Remove avatar e veículo anteriores
    if (this.characterGroup) {
      this.group.remove(this.characterGroup);
      this.characterGroup = null;
      this.rig = null;
    }
    if (this.vehicleMesh) {
      this.group.remove(this.vehicleMesh);
      this.vehicleMesh = null;
    }

    // Constrói personagem com cosméticos
    this.characterGroup = CharacterBuilder.createCharacter(this.characterId, {
      vehicle: this.vehicleId,
      hat: this.hatId,
      scarf: this.scarfId,
      goggles: this.gogglesId,
    });
    this.rig = this.characterGroup.userData.rig as CharacterRig;

    if (isRacing) {
      // Monta veículo de corrida
      this.vehicleMesh = VehicleBuilder.createVehicleMesh(this.vehicleId);
      if (this.vehicleMesh) {
        this.group.add(this.vehicleMesh);
      }
      this.characterGroup.position.set(0, 0.42, 0);
      this.characterGroup.rotation.y = 0;
    } else {
      this.characterGroup.position.set(0, 0, 0);
    }

    this.group.add(this.characterGroup);
  }

  private createNameTag() {
    this.redrawNameTag();
    const spriteMat = new THREE.SpriteMaterial({
      map: this.nameTagTexture,
      transparent: true,
      depthTest: false,
    });
    this.nameTagSprite = new THREE.Sprite(spriteMat);
    this.nameTagSprite.scale.set(3.2, 1.6, 1);
    this.nameTagSprite.position.set(0, 2.3, 0);
    this.group.add(this.nameTagSprite);
  }

  public showChatBubble(text: string) {
    this.currentChatText = text;
    this.chatBubbleTimer = 5.0; // 5 segundos
    this.redrawNameTag();
  }

  private redrawNameTag() {
    const ctx = this.nameTagContext;
    ctx.clearRect(0, 0, 512, 256);

    const centerX = 256;
    const nameY = 200;

    // Se houver balão de fala ativo
    if (this.currentChatText.length > 0 && this.chatBubbleTimer > 0) {
      ctx.save();
      const bubbleW = Math.min(460, Math.max(160, ctx.measureText(this.currentChatText).width + 60));
      const bubbleH = 64;
      const bubbleX = centerX - bubbleW / 2;
      const bubbleY = 80;

      // Fundo do balão
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 16);
      ctx.fill();

      // Triângulo indicador
      ctx.beginPath();
      ctx.moveTo(centerX - 10, bubbleY + bubbleH);
      ctx.lineTo(centerX + 10, bubbleY + bubbleH);
      ctx.lineTo(centerX, bubbleY + bubbleH + 12);
      ctx.closePath();
      ctx.fill();

      // Borda sutil
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Texto do balão
      ctx.font = 'bold 26px "Segoe UI", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let displayStr = this.currentChatText;
      if (displayStr.length > 32) displayStr = displayStr.substring(0, 30) + '...';
      ctx.fillText(displayStr, centerX, bubbleY + bubbleH / 2);
      ctx.restore();
    }

    // Badge do Apelido
    ctx.save();
    ctx.font = 'bold 28px "Segoe UI", sans-serif';
    const textWidth = ctx.measureText(this.name).width;
    const badgeW = textWidth + 50;
    const badgeH = 42;
    const badgeX = centerX - badgeW / 2;
    const badgeY = nameY - badgeH / 2;

    // Fundo do crachá do piloto
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
    ctx.fill();

    // Borda brilhante
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Ícone e Nome
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`❄️ ${this.name}`, centerX, nameY);
    ctx.restore();

    this.nameTagTexture.needsUpdate = true;
  }

  public update(delta: number, time: number, isRacing: boolean = false) {
    // Interpolação suave de posição (independente de framerate)
    const lerpFactor = 1 - Math.exp(-14 * delta);
    this.group.position.lerp(this.targetPosition, lerpFactor);

    // Interpolação de rotação com menor arco angular
    const diffRotY = (this.targetRotationY - this.group.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    this.group.rotation.y += diffRotY * lerpFactor;

    if (isRacing) {
      const diffRotX = (this.targetRotationX - this.group.rotation.x + Math.PI * 3) % (Math.PI * 2) - Math.PI;
      this.group.rotation.x += diffRotX * lerpFactor;
      const diffRotZ = (this.targetRotationZ - this.group.rotation.z + Math.PI * 3) % (Math.PI * 2) - Math.PI;
      this.group.rotation.z += diffRotZ * lerpFactor;
    }

    // Animação procedural do Rig
    if (this.rig) {
      if (this.isSitting) {
        // Posição sentada no banco da vila
        this.rig.torso.position.y = 0.55;
        this.rig.footL.position.set(-0.25, 0.2, 0.35);
        this.rig.footR.position.set(0.25, 0.2, 0.35);
        this.rig.footL.rotation.x = 0;
        this.rig.footR.rotation.x = 0;
        this.rig.armL.rotation.set(0.4, 0, 0.2);
        this.rig.armR.rotation.set(0.4, 0, -0.2);
      } else if (this.isMoving && !isRacing) {
        RigAnimator.animateRigWalk(this.rig, time, this.isRunning);
      } else if (!isRacing) {
        // Idle suave (respiração)
        RigAnimator.animateRigIdle(this.rig, false, false, 0, 0);
      }
    }

    // Processamento de knockback
    if (this.knockbackVel.lengthSq() > 0.0001) {
      this.group.position.add(this.knockbackVel);
      this.knockbackVel.multiplyScalar(0.88);
    }

    // Processamento de congelamento
    if (this.freezeTimer > 0) {
      this.freezeTimer -= delta;
      this.group.position.x += (Math.random() - 0.5) * 0.03;
    }

    // Temporizador do balão de fala
    if (this.chatBubbleTimer > 0) {
      this.chatBubbleTimer -= delta;
      if (this.chatBubbleTimer <= 0) {
        this.currentChatText = '';
        this.redrawNameTag();
      }
    }
  }

  public setCosmetics(character: string, vehicle: string, hat: string, scarf: string, goggles: string, isRacing: boolean = false) {
    let changed = false;
    if (character && character !== this.characterId) {
      this.characterId = character as CharacterId;
      changed = true;
    }
    if (vehicle && vehicle !== this.vehicleId) {
      this.vehicleId = vehicle;
      changed = true;
    }
    if (hat !== undefined && hat !== this.hatId) {
      this.hatId = hat;
      changed = true;
    }
    if (scarf !== undefined && scarf !== this.scarfId) {
      this.scarfId = scarf;
      changed = true;
    }
    if (goggles !== undefined && goggles !== this.gogglesId) {
      this.gogglesId = goggles;
      changed = true;
    }

    if (changed) {
      this.rebuildAvatar(isRacing);
      this.redrawNameTag();
    }
  }

  public destroy() {
    if (this.nameTagSprite) {
      this.group.remove(this.nameTagSprite);
      this.nameTagSprite.material.dispose();
      this.nameTagTexture.dispose();
    }
    this.parentScene.remove(this.group);
  }
}
