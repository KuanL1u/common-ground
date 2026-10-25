import type { FarmChoice, FarmResult, FarmRun, FarmTime, GardenChoice, GardenPlant, GardenResult, ParkChoice, ParkResult, SharingChoice, Weather } from './types.ts'

export const FARM_BUDGET = { credits: 4, care: 3, water: 6 }
export const PARK_BUDGET = { credits: 6, care: 2 }
export const defaultFarm: FarmChoice = { cover: 'bare', compost: false, watering: 'pour', water: 4 }
export const defaultPark: ParkChoice = { strategy: 'tree', care: 2, seating: true }
const clamp = (n: number) => Math.round(Math.max(0, Math.min(100, n)))

export function farmCosts(choice: FarmChoice) {
  return {
    credits: (choice.cover === 'mulch' ? 1 : choice.cover === 'living' ? 2 : 0) + (choice.compost ? 1 : 0) + (choice.watering === 'drip' ? 3 : 0),
    care: (choice.cover === 'mulch' ? 1 : choice.cover === 'living' ? 2 : 0) + (choice.compost ? 1 : 0) + (choice.watering === 'drip' ? 1 : 0),
    water: choice.water,
  }
}

export function farmChoiceError(choice: FarmChoice): string | null {
  const costs = farmCosts(choice)
  if (costs.credits > FARM_BUDGET.credits) return 'That mix needs more than 4 credits. Try another cover or watering method.'
  if (costs.care > FARM_BUDGET.care) return 'That mix needs more than 3 care tokens. Leave room for ongoing upkeep.'
  if (costs.water > FARM_BUDGET.water || costs.water < 0) return 'You have 6 water tokens to share with this bed.'
  return null
}

// Authored relative teaching rules, not measured soil, hydraulic, or growth models.
export function simulateFarm(choice: FarmChoice, weather: Weather, time: FarmTime): FarmResult {
  const later = time === 'season'
  const coverInfiltration = choice.cover === 'mulch' ? 18 : choice.cover === 'living' ? 25 : 0
  const infiltration = clamp(36 + coverInfiltration + (choice.compost ? 14 + (later ? 5 : 0) : 0))
  const surface = choice.cover === 'bare' ? 12 : 7
  const runoff = 100 - infiltration - surface
  const soil = clamp(30 + (choice.compost ? 28 + (later ? 8 : 0) : 0) + (choice.cover === 'mulch' ? 14 : choice.cover === 'living' ? 22 + (later ? 5 : 0) : 0))
  const wateringEfficiency = choice.watering === 'drip' ? 1.5 : 1
  const coverRetention = choice.cover === 'mulch' ? 18 : choice.cover === 'living' ? 12 : 0
  const livingDemand = choice.cover === 'living' ? 14 : 0
  const moisture = weather === 'rain'
    ? clamp(infiltration * .85 + choice.water * 2)
    : clamp(choice.water * 13 * wateringEfficiency + coverRetention + (choice.compost ? 12 : 0) - livingDemand - (later ? 46 : 36))
  return { infiltration, runoff, surface, moisture, soil, vitality: clamp(moisture * .8 + soil * .2), costs: farmCosts(choice) }
}

export function compareFarm(saved: FarmRun, current: FarmRun) {
  return {
    a: simulateFarm(saved.choice, current.weather, current.time),
    b: simulateFarm(current.choice, current.weather, current.time),
    weather: current.weather,
    time: current.time,
    different: JSON.stringify(saved.choice) !== JSON.stringify(current.choice),
  }
}

export function parkCosts(choice: ParkChoice) {
  return (choice.strategy === 'existing' ? 2 : choice.strategy === 'tree' ? 4 : 6) + (choice.seating ? 2 : 0)
}

export function parkChoiceError(choice: ParkChoice) {
  if (parkCosts(choice) > PARK_BUDGET.credits) return 'A shade canopy uses all 6 credits. Remove the new seating or try a tree-based idea.'
  if (choice.care > PARK_BUDGET.care || choice.care < 0) return 'There are 2 care tokens available.'
  return null
}

export function simulatePark(choice: ParkChoice, year: 0 | 5): ParkResult {
  const later = year === 5
  const shade = choice.strategy === 'existing' ? (later ? 72 + choice.care * 5 : 82)
    : choice.strategy === 'canopy' ? (later ? 63 + choice.care * 5 : 78)
      : later ? 14 + choice.care * 22 : 16
  const habitat = choice.strategy === 'canopy' ? 8
    : choice.strategy === 'existing' ? 72 + choice.care * 5
      : later ? 18 + choice.care * 25 : 20
  const gathering = clamp(shade * .55 + (choice.seating ? 38 : 8))
  const note = choice.strategy === 'existing'
    ? 'Established canopy offers shade now. Caring for it and choosing the meeting location still matter.'
    : choice.strategy === 'canopy'
      ? 'A built canopy gives immediate shade, but uses the whole improvement budget and adds little living habitat.'
      : later
        ? choice.care === 2 ? 'The young tree has grown with consistent establishment care. Its shade still takes time to develop.'
          : 'Reduced establishment care limits the young tree’s growth in this learning scenario.'
        : 'A newly planted tree offers little shade today. The benefit depends on time and continuing care.'
  return { shade, habitat: clamp(habitat), gathering, credits: parkCosts(choice), care: choice.care, note }
}

export const GARDEN_BUDGET = { credits: 8, care: 5, water: 6 }
export const defaultGarden: GardenChoice = { plots: ['vegetables', 'vegetables', null, null] }
export const gardenPlants: Record<GardenPlant, { name: string; credits: number; care: number; water: number }> = {
  vegetables: { name: 'Vegetables', credits: 2, care: 2, water: 2 },
  flowers: { name: 'Native flowers', credits: 1, care: 1, water: 1 },
  elder: { name: 'Native elder', credits: 3, care: 2, water: 2 },
}

export function gardenCosts(choice: GardenChoice) {
  return choice.plots.reduce((sum, plant) => {
    const cost = plant ? gardenPlants[plant] : { credits: 0, care: 0, water: 0 }
    return { credits: sum.credits + cost.credits, care: sum.care + cost.care, water: sum.water + cost.water }
  }, { credits: 0, care: 0, water: 0 })
}
export function gardenChoiceError(choice: GardenChoice): string | null {
  if (choice.plots.length !== 4 || choice.plots.some(plant => plant !== null && !Object.hasOwn(gardenPlants, plant))) return 'Choose a plant or an open space for each of the four patches.'
  const costs = gardenCosts(choice)
  if (costs.credits > GARDEN_BUDGET.credits) return 'That garden needs more than 8 credits. Try a different mix.'
  if (costs.care > GARDEN_BUDGET.care) return 'That garden needs more than 5 care tokens. Leave room for ongoing upkeep.'
  if (costs.water > GARDEN_BUDGET.water) return 'You have 6 water tokens for this garden.'
  return null
}
// Plant roles and all coefficients are illustrative, rather than yields or a site planting recommendation.
export function simulateGarden(choice: GardenChoice, year: 0 | 5): GardenResult {
  const count = (plant: GardenPlant) => choice.plots.filter(value => value === plant).length
  const vegetables = count('vegetables'), flowers = count('flowers'), elder = count('elder')
  return {
    food: clamp(20 * vegetables + (year === 0 ? 10 : 25) * elder),
    pollinators: clamp(7 * vegetables + 24 * flowers + 14 * elder),
    cover: clamp(15 * vegetables + 25 * flowers + (year === 0 ? 18 : 30) * elder),
    diversity: new Set(choice.plots.filter(Boolean)).size,
    costs: gardenCosts(choice),
  }
}
export function compareGarden(a: GardenChoice, b: GardenChoice, year: 0 | 5) {
  return { a: simulateGarden(a, year), b: simulateGarden(b, year), year, different: JSON.stringify(a.plots.filter(Boolean).sort()) !== JSON.stringify(b.plots.filter(Boolean).sort()) }
}

export const HARVEST_BASKETS = 8
export const sharingGroups = [
  { id: 'households', name: 'Neighbors’ households', requested: 4 },
  { id: 'meal', name: 'A shared meal', requested: 3 },
  { id: 'volunteers', name: 'A volunteer day', requested: 2 },
] as const
export const defaultSharing: SharingChoice = { households: 4, meal: 3, volunteers: 1 }
export const basketsUsed = (choice: SharingChoice) => sharingGroups.reduce((sum, group) => sum + choice[group.id], 0)
export function sharingChoiceError(choice: SharingChoice): string | null {
  if (sharingGroups.some(group => !Number.isInteger(choice[group.id]) || choice[group.id] < 0 || choice[group.id] > group.requested)) return 'Choose whole baskets, up to each group’s request.'
  if (basketsUsed(choice) > HARVEST_BASKETS) return 'There are 8 baskets to share. Take one back before offering it elsewhere.'
  return null
}
export function simulateSharing(choice: SharingChoice) {
  return {
    used: basketsUsed(choice), remaining: HARVEST_BASKETS - basketsUsed(choice),
    unmet: sharingGroups.reduce((sum, group) => sum + group.requested - choice[group.id], 0),
    groups: sharingGroups.map(group => ({ ...group, allocated: choice[group.id], unmet: group.requested - choice[group.id] })),
  }
}
export function compareSharing(a: SharingChoice, b: SharingChoice) {
  return { a: simulateSharing(a), b: simulateSharing(b), different: sharingGroups.some(group => a[group.id] !== b[group.id]) }
}
