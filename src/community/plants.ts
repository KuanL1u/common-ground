import type { PlantId, Season, SiteConditions } from './types.ts'

const vegetables = 'https://ucanr.edu/blog/hort-coco-uc-master-gardener-program-contra-costa/article/creating-family-garden-bed'
const handbook = 'https://ucanr.edu/sites/default/files/2025-03/vegetable_gardening_handbook_for_beginners.pdf'

export interface PlantProfile {
  id: PlantId
  name: string
  scientificName: string
  kind: 'food' | 'habitat'
  color: string
  icon: 'tomato' | 'leaf' | 'flower'
  sun: 'full' | 'part'
  toleratesPartialSun?: boolean
  water: 'regular' | 'limited'
  seasons: Season[]
  seasonNote: string
  benefit: string
  care: string
  source: string
  sourceName: string
}

export const plants: PlantProfile[] = [
  {
    id: 'tomato', name: 'Tomatoes', scientificName: 'Solanum lycopersicum', kind: 'food', color: '#c66b4c', icon: 'tomato',
    sun: 'full', water: 'regular', seasons: ['spring', 'summer'], seasonNote: 'Warm season; plant after frost risk.',
    benefit: 'Food to share', care: 'Sun, regular water, compost, and space for a trellis. Check variety and local planting dates.',
    source: vegetables, sourceName: 'UC Master Gardeners',
  },
  {
    id: 'lettuce', name: 'Lettuce', scientificName: 'Lactuca sativa', kind: 'food', color: '#7c9c62', icon: 'leaf',
    sun: 'part', water: 'regular', seasons: ['fall', 'winter', 'spring'], seasonNote: 'Cool season; protect from hot weather.',
    benefit: 'A small salad bed', care: 'Leafy crops can use some partial sun. Keep moisture consistent; summer heat can cause bolting.',
    source: handbook, sourceName: 'UC ANR gardening handbook',
  },
  {
    id: 'kale', name: 'Kale', scientificName: 'Brassica oleracea', kind: 'food', color: '#4f7d67', icon: 'leaf',
    sun: 'part', water: 'regular', seasons: ['fall', 'winter', 'spring'], seasonNote: 'Cool-season greens.',
    benefit: 'Greens over time', care: 'Plan regular water and harvest care. Sun thresholds are simplified screening bands for leafy crops.',
    source: vegetables, sourceName: 'UC Master Gardeners',
  },
  {
    id: 'poppy', name: 'California poppy', scientificName: 'Eschscholzia californica', kind: 'habitat', color: '#d9a044', icon: 'flower',
    sun: 'full', toleratesPartialSun: true, water: 'limited', seasons: ['fall', 'winter', 'spring'], seasonNote: 'Fall rain is a good time to sow seed.',
    benefit: 'Flowers for pollinators', care: 'Prefers plenty of sun and draining soil. Water seedlings until established; don’t bury seeds in mulch.',
    source: 'https://calscape.org/plant/1602/Eschscholzia-californica-(California-Poppy)', sourceName: 'CNPS / Calscape',
  },
  {
    id: 'fuchsia', name: 'California fuchsia', scientificName: 'Epilobium canum', kind: 'habitat', color: '#c86650', icon: 'flower',
    sun: 'full', toleratesPartialSun: true, water: 'limited', seasons: ['fall', 'winter', 'spring'], seasonNote: 'Establish in the cooler, wetter season.',
    benefit: 'Late flowers for hummingbirds', care: 'Choose a suitable local form. Low water needs refer to established plants; young plants still need care.',
    source: 'https://calscape.org/plant/1413/Epilobium-canum-(California-Fuchsia)', sourceName: 'CNPS / Calscape',
  },
  {
    id: 'buckwheat', name: 'California buckwheat', scientificName: 'Eriogonum fasciculatum', kind: 'habitat', color: '#b99771', icon: 'flower',
    sun: 'full', water: 'limited', seasons: ['fall', 'winter', 'spring'], seasonNote: 'Establish with cool weather and rain.',
    benefit: 'Habitat through the seasons', care: 'A spreading native shrub. Allow room for its mature size and plan establishment watering.',
    source: 'https://calscape.org/plant/1502/Eriogonum-fasciculatum-(California-Buckwheat)', sourceName: 'CNPS / Calscape',
  },
]

export const plantById = Object.fromEntries(plants.map(plant => [plant.id, plant])) as Record<PlantId, PlantProfile>
export const soilSource = 'https://ucanr.edu/site/urban-agriculture/soil-contaminants-and-soil-testing'

export function currentSeason(date = new Date()): Season {
  const month = date.getMonth()
  return month >= 2 && month <= 4 ? 'spring' : month >= 5 && month <= 7 ? 'summer' : month >= 8 && month <= 10 ? 'fall' : 'winter'
}

export function emptyConditions(): SiteConditions {
  return { sun: 'unknown', water: 'unknown', drainage: 'unknown', soil: 'unknown', surface: 'unknown', season: currentSeason() }
}

export interface PlantMatch {
  status: 'likely' | 'check' | 'change'
  label: string
  reasons: string[]
  unknowns: string[]
}

export function assessPlant(plant: PlantProfile, conditions: SiteConditions, feature: string): PlantMatch {
  const reasons: string[] = []
  const unknowns: string[] = []
  if (feature === 'water') reasons.push('Mapped water. Choose a land site.')
  if ((feature === 'building' || feature === 'road') && conditions.surface !== 'containers') reasons.push('Mapped building or road. Confirm a suitable growing area.')
  if (conditions.surface === 'unknown') unknowns.push('Growing area')
  if (conditions.sun === 'unknown') unknowns.push('Sun')
  else if (conditions.sun === 'shade') reasons.push('Too little direct sun for this shortlist.')
  else if (conditions.sun === 'part' && plant.sun === 'full' && !plant.toleratesPartialSun) reasons.push('A sunnier spot would be better.')
  if (conditions.water === 'unknown') unknowns.push('Water')
  else if (conditions.water === 'none') reasons.push('Plan water for establishment.')
  else if (conditions.water === 'limited' && plant.water === 'regular') reasons.push('Needs reliable, regular watering.')
  if (conditions.drainage === 'unknown') unknowns.push('Drainage')
  else if (conditions.drainage === 'ponds') reasons.push('Resolve standing water before planting.')
  if (conditions.soil === 'concern') reasons.push('Get the site assessed before gardening.')
  else if (conditions.soil === 'unknown') unknowns.push(plant.kind === 'food' ? 'Soil suitability for food' : 'Soil condition')
  if (!plant.seasons.includes(conditions.season)) reasons.push(plant.seasonNote)
  if (reasons.length) return { status: 'change', label: 'Needs a change', reasons, unknowns }
  if (unknowns.length) return { status: 'check', label: 'Check first', reasons: ['Add your site observations.'], unknowns }
  return { status: 'likely', label: 'Promising with your answers', reasons: ['Sun, water, season, and reported soil conditions align.'], unknowns }
}
