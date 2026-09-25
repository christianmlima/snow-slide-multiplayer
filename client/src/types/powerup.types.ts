export type PowerUpType = 'nitro' | 'ice_trap' | 'homing_snowball' | 'shield';

export interface PowerUpItem {
  type: PowerUpType;
  name: string;
  icon: string;
  desc: string;
}

export const POWER_UPS: Record<PowerUpType, PowerUpItem> = {
  nitro: {
    type: 'nitro',
    name: 'Pimenta Nitro',
    icon: '🌶️',
    desc: 'Super aceleração com labaredas de fogo no gelo!'
  },
  ice_trap: {
    type: 'ice_trap',
    name: 'Cubo de Gelo',
    icon: '🧊',
    desc: 'Lança um obstáculo congelante para trás!'
  },
  homing_snowball: {
    type: 'homing_snowball',
    name: 'Bola Teleguiada',
    icon: '🎯',
    desc: 'Dispara uma bola de neve perseguidora!'
  },
  shield: {
    type: 'shield',
    name: 'Escudo de Neve',
    icon: '🛡️',
    desc: 'Bolha que protege contra 1 impacto ou armadilha!'
  }
};
