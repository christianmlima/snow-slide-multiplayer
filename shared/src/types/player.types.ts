export type CharacterType = 'penguin' | 'frog' | 'shih_tzu' | 'siamese';
export type VehicleType = 'board' | 'sled' | 'cart';

export interface PlayerAttributes {
  id: string;
  name: string;
  character: CharacterType;
  vehicle: VehicleType;
  currency: number;
}
