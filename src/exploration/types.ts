export type PlaceId = 'farm' | 'park' | 'gravity' | 'library'
export type NeighborhoodId = 'west-oakland' | 'ivy-hill'
export type HotspotId = 'compost' | 'soil' | 'water' | 'trees' | 'shade' | 'community' | 'habitat' | 'sharing' | 'journal' | 'idea'
export type Weather = 'rain' | 'dry'
export type FarmTime = 'now' | 'season'

export interface FarmChoice {
  cover: 'bare' | 'mulch' | 'living'
  compost: boolean
  watering: 'pour' | 'drip'
  water: number
}
export interface FarmResult {
  infiltration: number
  runoff: number
  surface: number
  moisture: number
  soil: number
  vitality: number
  costs: { credits: number; care: number; water: number }
}
export interface FarmRun {
  choice: FarmChoice
  weather: Weather
  time: FarmTime
}
export interface ParkChoice {
  strategy: 'existing' | 'tree' | 'canopy'
  care: number
  seating: boolean
}
export interface ParkResult {
  shade: number
  habitat: number
  gathering: number
  credits: number
  care: number
  note: string
}
export interface JournalEntry {
  id: HotspotId
  place: PlaceId
  title: string
  observation: string
  reasoning: string
  savedAt: string
}
export type GardenPlant = 'vegetables' | 'flowers' | 'elder'
export interface GardenChoice { plots: (GardenPlant | null)[] }
export interface GardenResult {
  food: number
  pollinators: number
  cover: number
  diversity: number
  costs: { credits: number; care: number; water: number }
}
export interface SharingChoice { households: number; meal: number; volunteers: number }
export interface ExplorationState {
  version: 1
  visited: PlaceId[]
  entries: Partial<Record<HotspotId, JournalEntry>>
  farm: FarmChoice
  savedFarm: FarmRun | null
  park: ParkChoice
  savedPark: ParkChoice | null
  garden: GardenChoice
  savedGarden: GardenChoice | null
  sharing: SharingChoice
  savedSharing: SharingChoice | null
  idea: { priority: 'water' | 'soil' | 'shade' | 'community'; choice: 'care' | 'new'; proposal: string; tradeoff: string; question: string }
  reducedMotion: boolean
}
