export interface GamepadState {
  connected: boolean;
  id: string;
  stickX: number;
  stickY: number;
  accelerate: number;
  brake: number;
  buttonJump: boolean;
  buttonAction: boolean;
  buttonItem: boolean;
  buttonEmote: boolean;
  buttonDrift: boolean;
  justJump: boolean;
  justItem: boolean;
  justEmote: boolean;
}

export class GamepadManager {
  private activeGamepadIndex: number | null = null;
  private prevJump = false;
  private prevItem = false;
  private prevAction = false;
  private prevEmote = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
        console.log(`[Gamepad] Controle conectado: ${e.gamepad.id} no slot ${e.gamepad.index}`);
        this.activeGamepadIndex = e.gamepad.index;
      });

      window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => {
        console.log(`[Gamepad] Controle desconectado: ${e.gamepad.id}`);
        if (this.activeGamepadIndex === e.gamepad.index) {
          this.activeGamepadIndex = null;
        }
      });
    }
  }

  public getState(): GamepadState {
    const defaultState: GamepadState = {
      connected: false,
      id: '',
      stickX: 0,
      stickY: 0,
      accelerate: 0,
      brake: 0,
      buttonJump: false,
      buttonAction: false,
      buttonItem: false,
      buttonEmote: false,
      buttonDrift: false,
      justJump: false,
      justItem: false,
      justEmote: false
    };

    if (typeof navigator === 'undefined' || !navigator.getGamepads) {
      return defaultState;
    }

    const gamepads = navigator.getGamepads();
    let pad: Gamepad | null = null;

    if (this.activeGamepadIndex !== null && gamepads[this.activeGamepadIndex]) {
      pad = gamepads[this.activeGamepadIndex];
    } else {
      // Procurar primeiro controle conectado
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          pad = gamepads[i];
          this.activeGamepadIndex = i;
          break;
        }
      }
    }

    if (!pad) return defaultState;

    // Aplicar deadzone nos analógicos
    const rawX = pad.axes[0] || 0;
    const rawY = pad.axes[1] || 0;
    const deadzone = 0.15;
    const stickX = Math.abs(rawX) > deadzone ? (rawX - Math.sign(rawX) * deadzone) / (1 - deadzone) : 0;
    const stickY = Math.abs(rawY) > deadzone ? (rawY - Math.sign(rawY) * deadzone) / (1 - deadzone) : 0;

    // Gatilhos e botões
    const btnA = pad.buttons[0]?.pressed || false;
    const btnB = pad.buttons[1]?.pressed || false;
    const btnX = pad.buttons[2]?.pressed || false;
    const btnY = pad.buttons[3]?.pressed || false;
    const btnLB = pad.buttons[4]?.pressed || false;
    const btnRB = pad.buttons[5]?.pressed || false;
    const triggerLT = pad.buttons[6]?.value || 0;
    const triggerRT = pad.buttons[7]?.value || 0;

    const accelerate = Math.max(triggerRT, btnA ? 1 : 0);
    const brake = Math.max(triggerLT, btnB ? 1 : 0);
    const buttonDrift = btnLB || btnRB || triggerLT > 0.3;

    const justJump = btnA && !this.prevJump;
    const justItem = btnX && !this.prevItem;
    const justEmote = btnY && !this.prevEmote;

    this.prevJump = btnA;
    this.prevItem = btnX;
    this.prevEmote = btnY;

    return {
      connected: true,
      id: pad.id,
      stickX,
      stickY,
      accelerate,
      brake,
      buttonJump: btnA,
      buttonAction: btnX,
      buttonItem: btnX,
      buttonEmote: btnY,
      buttonDrift,
      justJump,
      justItem,
      justEmote
    };
  }

  public vibrate(duration = 200, weakMagnitude = 0.5, strongMagnitude = 0.8) {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    if (this.activeGamepadIndex !== null && gamepads[this.activeGamepadIndex]) {
      const pad = gamepads[this.activeGamepadIndex];
      if (pad && pad.vibrationActuator && typeof pad.vibrationActuator.playEffect === 'function') {
        try {
          pad.vibrationActuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration,
            weakMagnitude,
            strongMagnitude
          });
        } catch (e) {}
      }
    }
  }
}
