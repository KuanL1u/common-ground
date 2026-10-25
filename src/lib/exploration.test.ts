import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { hotspots, placeById } from '../exploration/content.ts'
import { createFieldJournal } from '../exploration/journal.ts'
import { basketsUsed, compareFarm, compareGarden, compareSharing, defaultFarm, defaultGarden, defaultPark, defaultSharing, farmChoiceError, gardenChoiceError, simulateFarm, simulateGarden, simulatePark, simulateSharing, parkChoiceError, sharingChoiceError } from '../exploration/model.ts'
import { initialExploration, restoreExploration } from '../exploration/storage.ts'
import type { FarmChoice, GardenChoice } from '../exploration/types.ts'

test('rain is conserved; soil cover and organic matter change water movement rather than the rain', () => {
  for (const cover of ['bare', 'mulch', 'living'] as const) {
    for (const compost of [false, true]) {
      for (const time of ['now', 'season'] as const) {
        const choice: FarmChoice = { ...defaultFarm, cover, compost }
        const result = simulateFarm(choice, 'rain', time)
        assert.equal(result.infiltration + result.runoff + result.surface, 100)
        assert.ok(result.runoff >= 0)
        const bare = simulateFarm(defaultFarm, 'rain', time)
        if (cover !== 'bare' || compost) assert.ok(result.infiltration > bare.infiltration)
      }
    }
  }
})

test('dry-period choices have resource tradeoffs and use the same conditions in A/B comparisons', () => {
  const bare = simulateFarm(defaultFarm, 'dry', 'season')
  const retained = simulateFarm({ ...defaultFarm, cover: 'mulch' }, 'dry', 'season')
  assert.ok(retained.moisture > bare.moisture)
  assert.ok(retained.costs.care > bare.costs.care)
  const living = simulateFarm({ ...defaultFarm, cover: 'living' }, 'dry', 'season')
  assert.ok(living.soil > retained.soil)
  assert.ok(living.moisture < retained.moisture)
  const current = { choice: { ...defaultFarm, watering: 'drip' as const, water: 3 }, weather: 'dry' as const, time: 'season' as const }
  const compared = compareFarm({ choice: { ...defaultFarm }, weather: 'rain', time: 'now' }, current)
  assert.deepEqual(compared.a, bare)
  assert.deepEqual(compared.b, simulateFarm(current.choice, 'dry', 'season'))
  assert.equal(compared.different, true)
  assert.equal(compareFarm(current, current).different, false)
  assert.match(farmChoiceError({ ...defaultFarm, cover: 'living', compost: true, watering: 'drip' })!, /credits/)
})

test('a young tree needs time and establishment care; immediate shade competes with the seating budget', () => {
  const young = simulatePark(defaultPark, 0)
  const cared = simulatePark(defaultPark, 5)
  const neglected = simulatePark({ ...defaultPark, care: 0 }, 5)
  assert.ok(cared.shade > young.shade)
  assert.ok(cared.shade > neglected.shade)
  const canopy = simulatePark({ strategy: 'canopy', care: 0, seating: false }, 0)
  assert.ok(canopy.shade > young.shade)
  assert.ok(canopy.habitat < young.habitat)
  assert.match(parkChoiceError({ ...defaultPark, strategy: 'canopy' })!, /seating/)
  assert.equal(parkChoiceError(defaultPark), null)
})

test('stored progress rejects invalid budgets, foreign places, and injected fields while preserving good field notes', () => {
  const state = initialExploration()
  state.visited = ['farm']
  state.entries.soil = { id: 'soil', place: 'farm', title: 'Living soil', observation: 'Covered soil took in more game rain.', reasoning: 'The rainfall stayed the same.', savedAt: '2026-10-24T23:00:00.000Z' }
  const saved = JSON.parse(JSON.stringify(state))
  saved.visited.push('constructor', '__proto__', 'private-home', 'farm')
  saved.farm = { ...defaultFarm, water: 100 }
  saved.park = { ...defaultPark, strategy: 'canopy' }
  saved.entries.water = { ...state.entries.soil, id: 'water', place: 'library' }
  saved.entries.unknown = { ...state.entries.soil }
  const restored = restoreExploration(JSON.stringify(saved))
  assert.deepEqual(restored.visited, ['farm'])
  assert.deepEqual(restored.farm, defaultFarm)
  assert.deepEqual(restored.park, defaultPark)
  assert.equal(restored.entries.water, undefined)
  assert.deepEqual(Object.keys(restored.entries), ['soil'])
  assert.equal(restored.entries.soil!.reasoning, 'The rainfall stayed the same.')
  assert.deepEqual(restoreExploration('{broken'), initialExploration())
  assert.deepEqual(restoreExploration('{"version":99}'), initialExploration())
})

test('the world has checked real destinations and six connected avatar routes, not arbitrary tile positions', () => {
  const world = JSON.parse(readFileSync(new URL('../data/west-oakland-map.json', import.meta.url), 'utf8'))
  assert.equal(world.source.license, 'ODbL 1.0')
  for (const id of ['farm', 'park', 'library']) {
    assert.ok(world.anchors[id].coordinates[0] > 37.81 && world.anchors[id].coordinates[0] < 37.824)
    assert.ok(world.anchors[id].coordinates[1] < -122.28 && world.anchors[id].coordinates[1] > -122.29)
    for (const other of ['farm', 'park', 'library'].filter(other => other !== id)) {
      const route = world.routes[`${id}-${other}`]
      assert.ok(route.length > 1)
      assert.deepEqual(route[0], world.anchors[id].arrival)
      assert.deepEqual(route.at(-1), world.anchors[other].arrival)
    }
  }
  assert.ok(world.anchors.farm.coordinates[0] > world.anchors.park.coordinates[0])
  assert.equal(placeById.farm.address, '2847 Peralta Street')
  assert.equal(placeById.library.address, '1801 Adeline Street')
})

test('the journal exports the player’s ideas, matched comparisons, real providers, and explicit assumptions', () => {
  const state = initialExploration()
  state.idea.proposal = 'Explore a shaded gathering space with residents.'
  state.idea.tradeoff = 'A new tree needs water and ongoing care before providing much shade.'
  state.idea.question = 'Who uses this space and who would maintain it?'
  state.savedFarm = { choice: { ...defaultFarm }, weather: 'rain', time: 'now' }
  state.farm = { ...defaultFarm, cover: 'mulch' }
  state.savedGarden = { plots: [...defaultGarden.plots] }
  state.garden = { plots: ['vegetables', 'flowers', 'elder', null] }
  state.savedSharing = { ...defaultSharing }
  state.sharing = { households: 3, meal: 3, volunteers: 2 }
  const result = createFieldJournal(state)
  assert.match(result, /matched|same later-season dry period/)
  assert.match(result, /Explore a shaded gathering space/)
  assert.match(result, /anvfarm\.org/)
  assert.match(result, /oaklandlibrary\.org\/locations\/was/)
  assert.match(result, /uncalibrated game values/)
  assert.match(result, /has not been submitted/)
  assert.doesNotMatch(result, /fictional West Oakland block/)
  assert.match(result, /of 10/)
  assert.match(result, /Gravity Garden/)
  assert.match(result, /2519 7th Avenue/)
  assert.match(result, /oufp\.org/)
  assert.match(result, /same eight-basket harvest/)
  assert.match(result, /Pollinator support/)
  assert.match(result, /Oct 25, 2026/)
})

test('garden planting has resource tradeoffs; both alternatives rerun at the chosen year', () => {
  const diverse: GardenChoice = { plots: ['vegetables', 'flowers', 'elder', null] }
  assert.equal(gardenChoiceError(diverse), null)
  const a = simulateGarden(defaultGarden, 0)
  const b = simulateGarden(diverse, 0)
  assert.ok(b.food < a.food)
  assert.ok(b.pollinators > a.pollinators)
  assert.ok(b.costs.care > a.costs.care)
  const compared = compareGarden(defaultGarden, diverse, 5)
  assert.deepEqual(compared.a, simulateGarden(defaultGarden, 5))
  assert.deepEqual(compared.b, simulateGarden(diverse, 5))
  assert.ok(compared.b.food > b.food)
  assert.equal(compared.different, true)
  assert.equal(compareGarden(diverse, { plots: [null, 'elder', 'flowers', 'vegetables'] }, 5).different, false)
  assert.match(gardenChoiceError({ plots: ['elder', 'elder', 'elder', 'elder'] })!, /credits/)
  assert.match(gardenChoiceError({ plots: ['vegetables', 'flowers', 'elder', 'flowers'] })!, /care/)
})

test('harvest sharing conserves baskets and exposes whose requests remain unmet', () => {
  const alternate = { households: 3, meal: 3, volunteers: 2 }
  assert.equal(sharingChoiceError(defaultSharing), null)
  assert.equal(sharingChoiceError(alternate), null)
  for (const choice of [defaultSharing, alternate, { households: 0, meal: 0, volunteers: 0 }]) {
    const result = simulateSharing(choice)
    assert.equal(result.used + result.remaining, 8)
    assert.equal(result.unmet, 9 - basketsUsed(choice))
  }
  const compared = compareSharing(defaultSharing, alternate)
  assert.equal(compared.a.groups.find(group => group.id === 'volunteers')!.unmet, 1)
  assert.equal(compared.b.groups.find(group => group.id === 'households')!.unmet, 1)
  assert.equal(compared.different, true)
  assert.equal(compareSharing(alternate, alternate).different, false)
  assert.match(sharingChoiceError({ ...defaultSharing, volunteers: 2 })!, /8 baskets/)
  assert.match(sharingChoiceError({ ...defaultSharing, meal: -1 })!, /whole baskets/)
})

test('adding Gravity Garden preserves existing journals and initializes new choices without a reset', () => {
  const legacy = initialExploration()
  legacy.visited = ['farm', 'park']
  legacy.entries.soil = { id: 'soil', place: 'farm', title: 'Living soil', observation: 'My original observation.', reasoning: 'My original reasoning.', savedAt: '2026-10-24T23:00:00.000Z' }
  const raw = JSON.parse(JSON.stringify(legacy))
  for (const field of ['garden', 'savedGarden', 'sharing', 'savedSharing']) delete raw[field]
  const restored = restoreExploration(JSON.stringify(raw))
  const expectedEntries = { soil: { ...legacy.entries.soil!, title: hotspots.soil.name } }
  assert.deepEqual(restored.entries, expectedEntries)
  assert.deepEqual(restored.visited, legacy.visited)
  assert.deepEqual(restored.garden, defaultGarden)
  assert.deepEqual(restored.sharing, defaultSharing)
  raw.garden = { plots: ['elder', 'elder', 'elder', 'elder'] }
  raw.savedGarden = { plots: ['constructor', null, null, null] }
  raw.sharing = { households: 4, meal: 3, volunteers: 2 }
  raw.savedSharing = { households: 1.5, meal: 2, volunteers: 1 }
  const invalid = restoreExploration(JSON.stringify(raw))
  assert.deepEqual(invalid.garden, defaultGarden)
  assert.deepEqual(invalid.sharing, defaultSharing)
  assert.equal(invalid.savedGarden, null)
  assert.equal(invalid.savedSharing, null)
  assert.deepEqual(invalid.entries, expectedEntries)
})

test('East Bay connects all four real destinations through extracted streets and includes Lake Merritt', () => {
  const source = readFileSync(new URL('../data/east-bay-map.json', import.meta.url), 'utf8')
  const map = JSON.parse(source)
  assert.equal(readFileSync(new URL('../../public/data/east-bay-map.json', import.meta.url), 'utf8'), source)
  assert.equal(map.source.license, 'ODbL 1.0')
  assert.equal(map.source.extractUrls.length, 12)
  assert.deepEqual(Object.keys(map.anchors).sort(), ['farm', 'gravity', 'library', 'park'])
  assert.equal(map.anchors.gravity.coordinates[0], 37.8019293)
  assert.equal(map.anchors.gravity.coordinates[1], -122.2421346)
  assert.match(map.anchors.gravity.note, /Not a surveyed garden boundary/)
  assert.ok(map.width > 2 * 1180)
  assert.ok(map.water.some((shape: { name: string; points: number[][] }) => shape.name === 'Lake Merritt' && shape.points.length > 100))
  const walkable = new Set(['residential', 'tertiary', 'secondary', 'unclassified', 'living_street', 'pedestrian', 'footway', 'path'])
  const edges = new Set<string>()
  const edgeKey = (a: number[], b: number[]) => `${a.join(',')}>${b.join(',')}`
  for (const road of map.roads) {
    if (!walkable.has(road.kind)) continue
    for (let i = 1; i < road.points.length; i++) {
      edges.add(edgeKey(road.points[i - 1], road.points[i]))
      edges.add(edgeKey(road.points[i], road.points[i - 1]))
    }
  }
  assert.equal(Object.keys(map.routes).length, 12)
  for (const [key, points] of Object.entries(map.routes) as [string, number[][]][]) {
    const [from, to] = key.split('-')
    assert.deepEqual(points[0], map.anchors[from].arrival)
    assert.deepEqual(points.at(-1), map.anchors[to].arrival)
    for (let i = 1; i < points.length; i++) assert.ok(edges.has(edgeKey(points[i - 1], points[i])), `${key} must follow an extracted street`)
  }
  assert.ok(map.routes['farm-gravity'].length > 50)
  assert.equal(placeById.gravity.neighborhoodId, 'ivy-hill')
  assert.equal(placeById.gravity.address, '2519 7th Avenue')
  assert.deepEqual(placeById.gravity.hotspots, ['habitat', 'sharing'])
})
