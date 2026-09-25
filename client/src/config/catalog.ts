import { ShopItem } from '../types/game.types';

export const GAME_VERSION = "v2.6.0-STABLE";

export const SHOP_CATALOG: ShopItem[] = [
  // Veículos (Exclusivo Garagem Alpina)
  { id: 'sled_wood', name: 'Trenó de Madeira', category: 'sleds', price: 0, icon: '🛷', desc: 'Clássico trenó alpino com patins de aço polido.' },
  { id: 'board_cyan', name: 'Snowboard Pro Cyan', category: 'sleds', price: 350, icon: '🏂', desc: 'Prancha de alta performance para manobras ágeis.' },
  { id: 'sled_gold', name: 'Trenó Imperial Ouro', category: 'sleds', price: 800, icon: '👑', desc: 'Forjado em ouro alpino com estofado carmesim.' },
  { id: 'board_lava', name: 'Snowboard Vulcão', category: 'sleds', price: 500, icon: '🔥', desc: 'Prancha vulcânica com bordas incandescentes.' },

  // Chapéus (Exclusivo Boutique dos Gorros)
  { id: 'hat_red', name: 'Gorro Vermelho Pom-Pom', category: 'hats', price: 0, icon: '🔴', desc: 'O clássico gorro de lã quentinho com pom-pom.' },
  { id: 'hat_blue', name: 'Gorro Azul Nevasca', category: 'hats', price: 150, icon: '🔵', desc: 'Gorro polar reforçado para ventos frios.' },
  { id: 'hat_top', name: 'Cartola de Inverno', category: 'hats', price: 400, icon: '🎩', desc: 'Elegância aristocrática para exploradores refinados.' },
  { id: 'hat_crown', name: 'Coroa Glacial', category: 'hats', price: 750, icon: '👑', desc: 'Digna do verdadeiro rei das montanhas nevadas.' },

  // Cachecóis (Exclusivo Ateliê da Montanha)
  { id: 'scarf_green', name: 'Cachecol Verde Esmeralda', category: 'scarves', price: 0, icon: '🧣', desc: 'Lã macia com cauda esvoaçante ao vento.' },
  { id: 'scarf_red', name: 'Cachecol Vermelho Listrado', category: 'scarves', price: 180, icon: '🧣', desc: 'Listras festivas visíveis em qualquer nevasca.' },
  { id: 'scarf_gold', name: 'Cachecol Seda Dourada', category: 'scarves', price: 380, icon: '✨', desc: 'Tecido nobre que reluz ao brilho do sol alpino.' },

  // Óculos de Esqui (Exclusivo Ateliê da Montanha)
  { id: 'goggles_none', name: 'Sem Óculos', category: 'goggles', price: 0, icon: '👀', desc: 'Olhos livres para sentir a brisa da neve.' },
  { id: 'goggles_orange', name: 'Óculos Laranja Polar', category: 'goggles', price: 250, icon: '🥽', desc: 'Lentes âmbar de alta definição com proteção UV.' },
  { id: 'goggles_cyan', name: 'Óculos Neon Ciano', category: 'goggles', price: 380, icon: '🥽', desc: 'Visor espelhado futurista contra reflexos de gelo.' }
];
