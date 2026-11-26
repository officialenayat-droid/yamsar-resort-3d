export type { CabinId, StayConfig as Stay } from '../shared/types.ts'
export { inr } from '../shared/pricing.ts'

export type AdventureId = 'bukhari' | 'deodar' | 'star' | 'kahwa'
export type CameraPreset = 'overview' | 'river' | 'glacier'

export const ADVENTURES: { id: AdventureId; title: string; hint: string }[] = [
  { id: 'bukhari', title: 'Light the Bukhari', hint: 'Step inside any cabin and light its cast-iron stove.' },
  { id: 'deodar', title: 'Rustle the Deodar', hint: 'Shake the great snowy pine by the river. Someone is hiding…' },
  { id: 'star', title: 'Nightfall in Kullan', hint: 'Switch to night and catch a shooting star over the peaks.' },
  { id: 'kahwa', title: 'Brew with Rustam', hint: 'Help Rustam the fox brew saffron kahwa before the samovar boils over.' },
]
