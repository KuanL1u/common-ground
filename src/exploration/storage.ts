import { hotspots, placeById } from './content.ts'
import { defaultFarm, defaultGarden, defaultPark, defaultSharing, farmChoiceError, gardenChoiceError, parkChoiceError, sharingChoiceError } from './model.ts'
import type { ExplorationState, FarmChoice, FarmRun, GardenChoice, HotspotId, JournalEntry, ParkChoice, PlaceId, SharingChoice } from './types.ts'

export const EXPLORATION_KEY = 'common-ground-exploration-v1'
const PREVIOUS_EXPLORATION_KEY = `${EXPLORATION_KEY}-previous`
const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const integer = (value: unknown, max: number): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max

export function initialExploration(): ExplorationState {
  return {
    version: 1, visited: [], entries: {}, farm: { ...defaultFarm }, savedFarm: null,
    park: { ...defaultPark }, savedPark: null,
    garden: { plots: [...defaultGarden.plots] }, savedGarden: null,
    sharing: { ...defaultSharing }, savedSharing: null,
    idea: { priority: 'water', choice: 'care', proposal: '', tradeoff: '', question: '' },
    reducedMotion: false,
  }
}

function validFarm(value: unknown): value is FarmChoice {
  return object(value) && ['bare', 'mulch', 'living'].includes(String(value.cover)) && typeof value.compost === 'boolean'
    && ['pour', 'drip'].includes(String(value.watering)) && integer(value.water, 6) && !farmChoiceError(value as unknown as FarmChoice)
}
function validPark(value: unknown): value is ParkChoice {
  return object(value) && ['existing', 'tree', 'canopy'].includes(String(value.strategy)) && integer(value.care, 2)
    && typeof value.seating === 'boolean' && !parkChoiceError(value as unknown as ParkChoice)
}
function copyFarm(value: FarmChoice): FarmChoice {
  return { cover: value.cover, compost: value.compost, watering: value.watering, water: value.water }
}
function copyPark(value: ParkChoice): ParkChoice {
  return { strategy: value.strategy, care: value.care, seating: value.seating }
}
function validRun(value: unknown): value is FarmRun {
  return object(value) && validFarm(value.choice) && ['rain', 'dry'].includes(String(value.weather)) && ['now', 'season'].includes(String(value.time))
}
function validGarden(value: unknown): value is GardenChoice {
  return object(value) && Array.isArray(value.plots) && value.plots.length === 4
    && value.plots.every(plant => plant === null || ['vegetables', 'flowers', 'elder'].includes(plant))
    && !gardenChoiceError(value as unknown as GardenChoice)
}
function validSharing(value: unknown): value is SharingChoice {
  return object(value) && integer(value.households, 4) && integer(value.meal, 3) && integer(value.volunteers, 2)
    && !sharingChoiceError(value as unknown as SharingChoice)
}
const copySharing = (value: SharingChoice): SharingChoice => ({ households: value.households, meal: value.meal, volunteers: value.volunteers })

export function restoreExploration(raw: string | null): ExplorationState {
  const state = initialExploration()
  try {
    const value: unknown = JSON.parse(raw ?? 'null')
    if (!object(value) || value.version !== 1) return state
    if (Array.isArray(value.visited)) state.visited = [...new Set(value.visited.filter((id): id is PlaceId => typeof id === 'string' && Object.hasOwn(placeById, id)))]
    if (validFarm(value.farm)) state.farm = copyFarm(value.farm)
    if (validPark(value.park)) state.park = copyPark(value.park)
    if (validRun(value.savedFarm)) state.savedFarm = { choice: copyFarm(value.savedFarm.choice), weather: value.savedFarm.weather, time: value.savedFarm.time }
    if (validPark(value.savedPark)) state.savedPark = copyPark(value.savedPark)
    if (validGarden(value.garden)) state.garden = { plots: [...value.garden.plots] }
    if (validGarden(value.savedGarden)) state.savedGarden = { plots: [...value.savedGarden.plots] }
    if (validSharing(value.sharing)) state.sharing = copySharing(value.sharing)
    if (validSharing(value.savedSharing)) state.savedSharing = copySharing(value.savedSharing)
    if (typeof value.reducedMotion === 'boolean') state.reducedMotion = value.reducedMotion
    if (object(value.entries)) {
      for (const id of Object.keys(hotspots) as HotspotId[]) {
        const entry = value.entries[id]
        if (!object(entry) || entry.id !== id || entry.place !== hotspots[id].place || typeof entry.observation !== 'string' || typeof entry.reasoning !== 'string') continue
        const restored: JournalEntry = {
          id, place: hotspots[id].place, title: hotspots[id].name,
          observation: entry.observation.slice(0, 1500), reasoning: entry.reasoning.slice(0, 1200),
          savedAt: typeof entry.savedAt === 'string' && Number.isFinite(Date.parse(entry.savedAt)) ? entry.savedAt : '2026-10-24T00:00:00.000Z',
        }
        state.entries[id] = restored
      }
    }
    if (object(value.idea)) {
      const idea = value.idea
      state.idea = {
        priority: ['soil', 'water', 'shade', 'community'].includes(String(idea.priority)) ? idea.priority as ExplorationState['idea']['priority'] : 'water',
        choice: idea.choice === 'new' ? 'new' : 'care',
        proposal: typeof idea.proposal === 'string' ? idea.proposal.slice(0, 1200) : '',
        tradeoff: typeof idea.tradeoff === 'string' ? idea.tradeoff.slice(0, 600) : '',
        question: typeof idea.question === 'string' ? idea.question.slice(0, 600) : '',
      }
    }
  } catch { /* A malformed draft starts a fresh exploration without affecting the directory. */ }
  return state
}

export function readExploration(): ExplorationState {
  try { return restoreExploration(localStorage.getItem(EXPLORATION_KEY)) } catch { return initialExploration() }
}

export function persistExploration(state: ExplorationState) {
  try { localStorage.setItem(EXPLORATION_KEY, JSON.stringify(state)); return true } catch { return false }
}

export function hasFieldTrip(state: ExplorationState) {
  return state.visited.length > 0 || Object.keys(state.entries).length > 0 || Boolean(state.idea.proposal.trim())
}

export function readPreviousExploration(): ExplorationState | null {
  try {
    const state = restoreExploration(localStorage.getItem(PREVIOUS_EXPLORATION_KEY))
    return hasFieldTrip(state) ? state : null
  } catch { return null }
}

export function persistPreviousExploration(state: ExplorationState) {
  try { localStorage.setItem(PREVIOUS_EXPLORATION_KEY, JSON.stringify(state)); return true } catch { return false }
}
