export type TrackTheme = 'alpine_day' | 'aurora_night' | 'crystal_cave';

export interface TrackConfig {
  id: TrackTheme;
  name: string;
  icon: string;
  desc: string;
  skyColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  groundColor: number;
  ambientColor: number;
  directionalColor: number;
  hasAurora?: boolean;
  hasCrystals?: boolean;
}

export const TRACK_CATALOG: Record<TrackTheme, TrackConfig> = {
  alpine_day: {
    id: 'alpine_day',
    name: 'Pico Nevado Clássico',
    icon: '☀️🏔️',
    desc: 'Descida ensolarada com pinheiros verdes e neve brilhante.',
    skyColor: 0x93c5fd,
    fogColor: 0xdbeafe,
    fogNear: 25,
    fogFar: 140,
    groundColor: 0xf1f5f9,
    ambientColor: 0xffffff,
    directionalColor: 0xffedd5
  },
  aurora_night: {
    id: 'aurora_night',
    name: 'Trilha da Aurora Boreal',
    icon: '🌌✨',
    desc: 'Noite mágica iluminada por cortinas de aurora verde e magenta.',
    skyColor: 0x050c1a,
    fogColor: 0x08152c,
    fogNear: 20,
    fogFar: 130,
    groundColor: 0x1e293b,
    ambientColor: 0x38bdf8,
    directionalColor: 0xc084fc,
    hasAurora: true
  },
  crystal_cave: {
    id: 'crystal_cave',
    name: 'Caverna dos Cristais de Gelo',
    icon: '💎🧊',
    desc: 'Túnel subterrâneo com cristais luminescentes e curvas técnicas.',
    skyColor: 0x090d16,
    fogColor: 0x0e1b2f,
    fogNear: 15,
    fogFar: 110,
    groundColor: 0x0f172a,
    ambientColor: 0x06b6d4,
    directionalColor: 0x38bdf8,
    hasCrystals: true
  }
};
