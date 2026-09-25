import { CharacterRig, WarBot } from '../types/game.types';

export class RigAnimator {
  public static readonly MAX_THROW_ANIM_FRAMES = 18;

  public static animateRigWalk(
    rig: CharacterRig,
    time: number,
    running: boolean,
    isCharging = false,
    chargeRatio = 0,
    throwTimer = 0,
    maxThrowAnimFrames = RigAnimator.MAX_THROW_ANIM_FRAMES
  ) {
    if (!rig.footL || !rig.footR || !rig.torso) return;

    const freq = running ? 1.6 : 1.0;
    const t = time * freq;

    // Passos patinados com elevação orgânica estilo Animal Crossing
    rig.footL.position.z = Math.sin(t) * (running ? 0.30 : 0.22);
    rig.footL.position.y = Math.max(0, Math.cos(t) * (running ? 0.18 : 0.14));
    rig.footL.rotation.x = -Math.sin(t) * 0.28;

    rig.footR.position.z = -Math.sin(t) * (running ? 0.30 : 0.22);
    rig.footR.position.y = Math.max(0, -Math.cos(t) * (running ? 0.18 : 0.14));
    rig.footR.rotation.x = Math.sin(t) * 0.28;

    const isThrowing = throwTimer > 0;
    const isChargingThrow = isCharging && !isThrowing;

    if (isThrowing) {
      // Snap vigoroso para frente e follow-through dinâmico em movimento
      const progress = 1.0 - (throwTimer / maxThrowAnimFrames);
      if (progress < 0.35) {
        const snapT = progress / 0.35;
        rig.torso.rotation.y = -0.35 + snapT * 0.75;
        rig.torso.rotation.x = snapT * 0.18;
        rig.torso.rotation.z = Math.sin(t) * 0.08;
        if (rig.armR) {
          rig.armR.rotation.x = -1.6 + snapT * 3.25;
          rig.armR.rotation.y = -0.25 * snapT;
          rig.armR.rotation.z = -0.20;
        }
        if (rig.armL) {
          rig.armL.rotation.x = 1.0 - snapT * 1.6;
          rig.armL.rotation.z = 0.30;
        }
      } else {
        const blend = (progress - 0.35) / 0.65;
        rig.torso.rotation.y = 0.40 * (1 - blend);
        rig.torso.rotation.x = 0.18 * (1 - blend);
        rig.torso.rotation.z = Math.sin(t) * (running ? 0.18 : 0.13);
        if (rig.armR) {
          rig.armR.rotation.x = 1.65 * (1 - blend) + (-Math.sin(t) * 0.6) * blend;
          rig.armR.rotation.y = 0;
          rig.armR.rotation.z = -0.38;
        }
        if (rig.armL) {
          rig.armL.rotation.x = -0.6 * (1 - blend) + (Math.sin(t) * 0.6) * blend;
          rig.armL.rotation.y = 0;
          rig.armL.rotation.z = 0.38;
        }
      }
      if (rig.handSnowball) rig.handSnowball.visible = false;
    } else if (isChargingThrow) {
      // Postura tática enquanto corre ou anda: braço direito puxado atrás com bola, outro apontando
      const c = chargeRatio;
      rig.torso.rotation.y = -0.42 * c;
      rig.torso.rotation.x = -0.08 * c;
      rig.torso.rotation.z = Math.sin(t) * 0.08;

      if (rig.head) {
        rig.head.rotation.y = 0.42 * c;
        rig.head.rotation.z = 0;
      }

      if (rig.armR) {
        rig.armR.rotation.x = -1.6 - c * 0.65;
        rig.armR.rotation.y = 0.35;
        rig.armR.rotation.z = -0.45 - c * 0.25;
      }

      if (rig.armL) {
        rig.armL.rotation.x = 1.15;
        rig.armL.rotation.y = 0.20;
        rig.armL.rotation.z = 0.25;
      }

      if (rig.handSnowball) {
        rig.handSnowball.visible = true;
        rig.handSnowball.scale.setScalar(0.75 + c * 0.55);
      }
    } else {
      // Caminhada / corrida alegre estilo Animal Crossing (waddle)
      rig.torso.rotation.z = Math.sin(t) * (running ? 0.18 : 0.13);
      rig.torso.rotation.y = 0;
      rig.torso.rotation.x = 0;

      if (rig.head) {
        rig.head.rotation.z = -Math.sin(t) * (running ? 0.16 : 0.12);
        rig.head.rotation.y = Math.sin(t) * 0.08;
      }

      if (rig.armL && rig.armR) {
        rig.armL.rotation.x = Math.sin(t) * (running ? 0.75 : 0.55);
        rig.armR.rotation.x = -Math.sin(t) * (running ? 0.75 : 0.55);
        rig.armL.rotation.y = 0;
        rig.armR.rotation.y = 0;
        rig.armL.rotation.z = 0.38 + Math.abs(Math.sin(t)) * 0.12;
        rig.armR.rotation.z = -0.38 - Math.abs(Math.sin(t)) * 0.12;
      }

      if (rig.handSnowball) rig.handSnowball.visible = false;
    }

    rig.torso.position.y = Math.abs(Math.sin(t * 2)) * (running ? 0.08 : 0.05);

    if (rig.tail) {
      rig.tail.rotation.y = Math.sin(t * 2.2) * 0.42;
    }

    if (rig.scarfTail) {
      rig.scarfTail.rotation.y = 0.25 + Math.sin(t * 1.5) * 0.25;
    }
  }

  public static animateRigIdle(
    rig: CharacterRig,
    isSitting = false,
    isCharging = false,
    chargeRatio = 0,
    throwTimer = 0,
    maxThrowAnimFrames = RigAnimator.MAX_THROW_ANIM_FRAMES
  ) {
    if (!rig.footL || !rig.footR || !rig.torso) return;

    if (isSitting) {
      rig.footL.position.set(-0.16, 0.05, 0.32);
      rig.footR.position.set(0.16, 0.05, 0.32);
      rig.footL.rotation.set(0, -0.18, 0);
      rig.footR.rotation.set(0, 0.18, 0);
      rig.torso.rotation.set(0, 0, 0);
      rig.torso.position.y = -0.05;
      rig.torso.scale.set(1, 1, 1);
      if (rig.head) rig.head.rotation.set(0, 0, 0);
      if (rig.armL && rig.armR) {
        rig.armL.rotation.set(0.4, 0, 0.2);
        rig.armR.rotation.set(0.4, 0, -0.2);
      }
      if (rig.handSnowball) rig.handSnowball.visible = false;
      return;
    }

    const isThrowing = throwTimer > 0;
    const isChargingThrow = isCharging && !isThrowing;

    rig.footL.position.set(-0.16, 0.04, 0.08);
    rig.footR.position.set(0.16, 0.04, 0.08);
    rig.footL.rotation.set(0, -0.18, 0);
    rig.footR.rotation.set(0, 0.18, 0);

    if (isThrowing) {
      const progress = 1.0 - (throwTimer / maxThrowAnimFrames);
      if (progress < 0.35) {
        const snapT = progress / 0.35;
        rig.torso.rotation.y = -0.35 + snapT * 0.75;
        rig.torso.rotation.x = snapT * 0.18;
        rig.torso.rotation.z = 0;
        if (rig.armR) {
          rig.armR.rotation.x = -1.6 + snapT * 3.25;
          rig.armR.rotation.y = -0.25 * snapT;
          rig.armR.rotation.z = -0.20;
        }
        if (rig.armL) {
          rig.armL.rotation.x = 1.0 - snapT * 1.6;
          rig.armL.rotation.z = 0.30;
        }
      } else {
        const blend = (progress - 0.35) / 0.65;
        rig.torso.rotation.y = 0.40 * (1 - blend);
        rig.torso.rotation.x = 0.18 * (1 - blend);
        rig.torso.rotation.z = 0;
        if (rig.armR) {
          rig.armR.rotation.x = 1.65 * (1 - blend) + (-0.15) * blend;
          rig.armR.rotation.y = 0;
          rig.armR.rotation.z = -0.32;
        }
        if (rig.armL) {
          rig.armL.rotation.x = -0.6 * (1 - blend) + (-0.15) * blend;
          rig.armL.rotation.y = 0;
          rig.armL.rotation.z = 0.32;
        }
      }
      if (rig.handSnowball) rig.handSnowball.visible = false;
    } else if (isChargingThrow) {
      const c = chargeRatio;
      rig.torso.rotation.y = -0.42 * c;
      rig.torso.rotation.x = -0.08 * c;
      rig.torso.rotation.z = 0;
      rig.torso.position.y = 0;

      if (rig.head) {
        rig.head.rotation.y = 0.42 * c;
        rig.head.rotation.z = 0;
      }

      if (rig.armR) {
        rig.armR.rotation.x = -1.6 - c * 0.65;
        rig.armR.rotation.y = 0.35;
        rig.armR.rotation.z = -0.45 - c * 0.25;
      }

      if (rig.armL) {
        rig.armL.rotation.x = 1.15;
        rig.armL.rotation.y = 0.20;
        rig.armL.rotation.z = 0.25;
      }

      if (rig.handSnowball) {
        rig.handSnowball.visible = true;
        rig.handSnowball.scale.setScalar(0.75 + c * 0.55);
      }
    } else {
      const now = Date.now();
      const breathe = Math.sin(now * 0.0035);
      rig.torso.scale.set(1.0 - breathe * 0.015, 1.0 + breathe * 0.022, 1.0 - breathe * 0.015);
      rig.torso.rotation.set(0, 0, 0);
      rig.torso.position.y = 0;

      if (rig.head) {
        rig.head.rotation.z = Math.sin(now * 0.0018) * 0.04;
        rig.head.rotation.y = Math.sin(now * 0.0012) * 0.03;
      }

      if (rig.armL && rig.armR) {
        rig.armL.rotation.set(-0.15, 0, 0.32);
        rig.armR.rotation.set(-0.15, 0, -0.32);
      }

      if (rig.tail) {
        rig.tail.rotation.y = Math.sin(now * 0.0025) * 0.18;
      }

      if (rig.handSnowball) rig.handSnowball.visible = false;
    }
  }

  public static animateRigFlinch(rig: CharacterRig) {
    if (!rig) return;
    rig.torso.rotation.set(-0.35, 0, 0);
    rig.torso.position.y = 0.12;
    if (rig.head) rig.head.rotation.set(-0.25, 0, 0);
    if (rig.armL) rig.armL.rotation.set(1.1, 0, 0.5);
    if (rig.armR) rig.armR.rotation.set(1.1, 0, -0.5);
    if (rig.handSnowball) rig.handSnowball.visible = false;
  }

  public static animateBot(bot: WarBot) {
    const rig = bot.rig;
    if (!rig) return;

    if (bot.state === 'frozen') {
      rig.torso.rotation.set(0.15, 0, 0.1);
      rig.torso.position.y = 0.05;
      if (rig.head) rig.head.rotation.set(-0.25, 0.2, 0);
      if (rig.armL) rig.armL.rotation.set(0.9, 0, 1.1);
      if (rig.armR) rig.armR.rotation.set(0.9, 0, -1.1);
      if (rig.footL) rig.footL.position.set(-0.24, 0.12, 0.2);
      if (rig.footR) rig.footR.position.set(0.24, 0.02, -0.1);
      if (rig.handSnowball) rig.handSnowball.visible = false;
      return;
    }

    if (bot.hitTimer > 0) {
      const hitT = bot.hitTimer / 18;
      rig.torso.rotation.set(-0.35 * hitT, 0, 0);
      rig.torso.position.y = 0.12 * hitT;
      if (rig.head) rig.head.rotation.set(-0.3 * hitT, 0, 0);
      if (rig.armL) rig.armL.rotation.set(1.2 * hitT, 0, 0.6);
      if (rig.armR) rig.armR.rotation.set(1.2 * hitT, 0, -0.6);
      if (rig.handSnowball) rig.handSnowball.visible = false;
      return;
    }

    if (bot.state === 'windup') {
      const p = Math.min(1.0, 1.0 - (bot.stateTimer / 22));
      RigAnimator.animateRigIdle(rig, false, true, p, 0);
      return;
    }

    if (bot.state === 'throw') {
      RigAnimator.animateRigIdle(rig, false, false, 0, bot.stateTimer);
      return;
    }

    if (bot.isMoving) {
      RigAnimator.animateRigWalk(rig, bot.walkTime, true, false, 0, 0);
    } else {
      RigAnimator.animateRigIdle(rig, false, false, 0, 0);
    }
  }
}
