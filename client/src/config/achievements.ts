export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  first_race: {
    id: 'first_race',
    title: 'Primeira Descida',
    description: 'Complete uma corrida de trenó até a linha de chegada!',
    icon: '🏁',
    unlocked: false
  },
  drift_master: {
    id: 'drift_master',
    title: 'Rei do Drift',
    description: 'Carregue e solte um Mini-Turbo Nível 3 (Roxo)!',
    icon: '⚡',
    unlocked: false
  },
  stunt_legend: {
    id: 'stunt_legend',
    title: 'Acrobata dos Ares',
    description: 'Faça uma manobra aérea completa em uma rampa!',
    icon: '🤸',
    unlocked: false
  },
  powerup_frenzy: {
    id: 'powerup_frenzy',
    title: 'Arsenal de Inverno',
    description: 'Colete e use um Power-up durante a corrida!',
    icon: '🌶️',
    unlocked: false
  },
  snowball_sniper: {
    id: 'snowball_sniper',
    title: 'Franco-Atirador',
    description: 'Acerte 5 bolas de neve em alvos ou jogadores!',
    icon: '🎯',
    unlocked: false
  },
  coin_collector: {
    id: 'coin_collector',
    title: 'Magnata da Neve',
    description: 'Colete pelo menos 100 Moedas de Neve!',
    icon: '🪙',
    unlocked: false
  },
  speed_demon: {
    id: 'speed_demon',
    title: 'Velocidade Terminal',
    description: 'Atinja 95 km/h em uma descida veloz!',
    icon: '🚀',
    unlocked: false
  }
};
