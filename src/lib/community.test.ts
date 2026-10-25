import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { describeSite, geographicPoint, mapPoint, pointInPolygon, terrainAt } from '../community/geography.ts'
import { assessPlant, emptyConditions, plantById, plants } from '../community/plants.ts'
import { validateProject } from '../community/projects.ts'
import { createCommunityMiddleware } from '../community/server.ts'
import type { CommunitySnapshot, GardenProject, ProjectInput, SiteConditions, SiteEnvironment } from '../community/types.ts'
import type { NeighborhoodGeometry } from '../exploration/geography.ts'

const map = JSON.parse(readFileSync(new URL('../data/east-bay-map.json', import.meta.url), 'utf8')) as NeighborhoodGeometry
const environment = JSON.parse(readFileSync(new URL('../data/site-environment.json', import.meta.url), 'utf8')) as SiteEnvironment
const park = geographicPoint(map, map.anchors.park!.point)!
const parkSite = describeSite(map, park)
const answered: SiteConditions = { sun: 'full', water: 'regular', drainage: 'drains', soil: 'tested', surface: 'ground', season: 'fall' }
const input = (patch: Partial<ProjectInput> = {}): ProjectInput => ({
  title: 'Test pollinator patch', kind: 'new-garden', goal: 'Plan a small pollinator bed with neighbors.',
  site: { ...parkSite, label: 'A proposed East Bay spot' }, conditions: emptyConditions(),
  plants: ['poppy', 'fuchsia'], otherPlants: '', budget: 120, budgetNote: 'Seeds, soil, and donated tools.',
  volunteersNeeded: 2, roles: ['planting', 'planning'], organizerName: 'Test organizer',
  permission: 'checking', permissionNote: '', workDate: '', meetupNote: 'Planning meetup first.',
  carePlan: 'A shared weekly watering and care rota.', ...patch,
})

async function harness(directory?: string) {
  const dataDirectory = directory ?? await mkdtemp(join(tmpdir(), 'common-ground-community-'))
  const middleware = createCommunityMiddleware({ dataDirectory, geometryPath: resolve('src/data/east-bay-map.json') })
  const server = createServer((req, res) => middleware(req, res, () => { res.writeHead(404); res.end() }))
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  const origin = `http://127.0.0.1:${address.port}`
  const visitor = () => {
    let cookie = ''
    return {
      async request<T = GardenProject>(path = '', method = 'GET', body?: unknown, headers: Record<string, string> = {}) {
        const response = await fetch(`${origin}/api/community${path}`, { method, headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie, ...headers }, ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}) })
        const setCookie = response.headers.get('set-cookie')
        if (setCookie) cookie = setCookie.split(';')[0]
        const result = await response.json() as T & { error?: string }
        return { status: response.status, result, headers: response.headers }
      },
    }
  }
  return {
    dataDirectory, origin, visitor,
    close: async () => {
      await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()))
      await middleware.close()
    },
  }
}

test('a chosen map point round-trips through the actual projection; water and footprints do not imply garden access', () => {
  for (const anchor of Object.values(map.anchors)) {
    const geo = geographicPoint(map, anchor!.point)!
    const point = mapPoint(map, geo)
    assert.ok(Math.abs(point[0] - anchor!.point[0]) < 1e-7)
    assert.ok(Math.abs(point[1] - anchor!.point[1]) < 1e-7)
  }
  assert.equal(geographicPoint(map, [0, 0]), null)
  assert.equal(parkSite.feature, 'green')
  assert.ok(parkSite.nearestStreet)
  const lake = map.water.filter(shape => shape.name === 'Lake Merritt').sort((a, b) => b.points.length - a.points.length)[0]
  const center = [0, 1].map(axis => lake.points.reduce((sum, point) => sum + point[axis], 0) / lake.points.length)
  assert.ok(pointInPolygon(center, lake.points))
  assert.equal(describeSite(map, geographicPoint(map, center)!).feature, 'water')
})

test('unknown site conditions never become a positive planting verdict', () => {
  for (const plant of plants) {
    const result = assessPlant(plant, emptyConditions(), 'green')
    assert.notEqual(result.status, 'likely')
    assert.ok(result.unknowns.includes('Soil condition') || result.unknowns.includes('Soil suitability for food'))
  }
  assert.equal(assessPlant(plantById.lettuce, { ...answered, soil: 'unknown' }, 'green').status, 'check')
  assert.equal(assessPlant(plantById.poppy, { ...answered, soil: 'concern' }, 'green').status, 'change')
})

test('plant matches respond to observed sun, water, drainage, growing medium, and planting season', () => {
  assert.equal(assessPlant(plantById.lettuce, answered, 'green').status, 'likely')
  assert.equal(assessPlant(plantById.tomato, answered, 'green').status, 'change')
  assert.equal(assessPlant(plantById.tomato, { ...answered, season: 'summer' }, 'green').status, 'likely')
  assert.equal(assessPlant(plantById.lettuce, { ...answered, water: 'limited' }, 'green').status, 'change')
  assert.equal(assessPlant(plantById.poppy, { ...answered, water: 'limited' }, 'green').status, 'likely')
  assert.equal(assessPlant(plantById.fuchsia, { ...answered, sun: 'part' }, 'green').status, 'likely')
  assert.equal(assessPlant(plantById.tomato, { ...answered, sun: 'part', season: 'summer' }, 'green').status, 'change')
  assert.equal(assessPlant(plantById.poppy, { ...answered, drainage: 'ponds' }, 'green').status, 'change')
  assert.equal(assessPlant(plantById.lettuce, answered, 'building').status, 'change')
  assert.equal(assessPlant(plantById.lettuce, { ...answered, surface: 'containers', soil: 'clean-bed' }, 'building').status, 'likely')
  assert.equal(assessPlant(plantById.poppy, answered, 'water').status, 'change')
})

test('climate and terrain data have complete primary-source provenance and unknown terrain stays unknown', () => {
  assert.equal(environment.climate.years, 10)
  assert.equal(environment.climate.period, '2016–2025')
  assert.equal(environment.climate.months.length, 12)
  assert.match(environment.climate.requestUrl, /models=era5/)
  assert.equal(environment.terrain.elevations.length, environment.terrain.rows * environment.terrain.columns)
  assert.equal(environment.terrain.requestUrls.length, 6)
  assert.ok(environment.terrain.elevations.every(Number.isFinite))
  const terrain = terrainAt(environment, park)!
  assert.ok(Number.isFinite(terrain.elevation) && Number.isFinite(terrain.slope))
  assert.equal(terrainAt(environment, { latitude: 0, longitude: 0 }), null)
  const missing = structuredClone(environment)
  missing.terrain.elevations.fill(null)
  assert.equal(terrainAt(missing, park), null)
  assert.equal(readFileSync(new URL('../data/site-environment.json', import.meta.url), 'utf8'), readFileSync(resolve('public/data/site-environment.json'), 'utf8'))
})

test('project validation rejects invalid resources, missing stewardship details, out-of-map sites, and foreign plant IDs', () => {
  assert.equal(validateProject(input()).budget, 120)
  assert.equal(validateProject(input({ budget: 0 })).budget, 0)
  for (const budget of [-1, NaN, Infinity, 1_000_001]) assert.throws(() => validateProject(input({ budget })), /Budget/)
  for (const volunteersNeeded of [0, 1.5, 51]) assert.throws(() => validateProject(input({ volunteersNeeded })), /volunteers/)
  assert.throws(() => validateProject(input({ permission: 'confirmed' })), /Permission note/)
  assert.throws(() => validateProject(input({ workDate: '2026-02-30' })), /valid work date/)
  assert.throws(() => validateProject(input({ carePlan: '' })), /Ongoing care/)
  assert.throws(() => validateProject(input({ plants: [], otherPlants: '' })), /want to grow/)
  assert.throws(() => validateProject({ ...input(), plants: ['constructor'] }), /plants/)
  assert.throws(() => validateProject(input({ site: { ...parkSite, latitude: 0 } })), /Bay Area map/)
  assert.throws(() => validateProject(input({ conditions: { ...answered, soil: 'clean-bed' } })), /raised-bed/)
  const sanitized = validateProject({ ...input(), organizer: 'forged', members: [{ name: 'forged' }], isOrganizer: true, status: 'closed' })
  assert.equal(Object.hasOwn(sanitized, 'organizer'), false)
  assert.equal(Object.hasOwn(sanitized, 'members'), false)
})

test('projects are shared between visitors, creation retries are idempotent, and duplicate joins occupy one space', async () => {
  const app = await harness()
  try {
    const organizer = app.visitor(), neighbor = app.visitor()
    const key = randomUUID()
    const created = await organizer.request('/projects', 'POST', input(), { 'Idempotency-Key': key })
    assert.equal(created.status, 201)
    assert.equal(created.result.isOrganizer, true)
    const retried = await organizer.request('/projects', 'POST', input(), { 'Idempotency-Key': key })
    assert.equal(retried.result.id, created.result.id)
    const board = await neighbor.request<CommunitySnapshot>()
    assert.equal(board.result.projects.length, 1)
    assert.equal(board.result.projects[0].isOrganizer, false)
    assert.equal(board.result.projects[0].site.feature, 'green')
    assert.equal(board.headers.get('cache-control'), 'no-store')
    assert.match(created.headers.get('set-cookie') ?? '', /HttpOnly; SameSite=Strict/)
    const id = created.result.id
    const first = await neighbor.request(`/projects/${id}/join`, 'POST', { name: 'Test neighbor', role: 'planting', availability: 'Weekend mornings' })
    assert.equal(first.status, 200)
    const repeat = await neighbor.request(`/projects/${id}/join`, 'POST', { name: 'Test neighbor', role: 'planning', availability: 'Evenings' })
    assert.equal(repeat.result.members.length, 1)
    assert.equal(repeat.result.members[0].role, 'planning')
    assert.equal(repeat.result.joined, true)
    assert.equal(repeat.result.members[0].mine, true)
    const ownerView = await organizer.request(`/projects/${id}`)
    assert.equal(ownerView.result.members[0].mine, false)
    assert.equal(Object.hasOwn(ownerView.result, 'organizer'), false)
    assert.equal(Object.hasOwn(ownerView.result.members[0], 'visitor'), false)
    const left = await neighbor.request(`/projects/${id}/join`, 'DELETE')
    assert.equal(left.result.members.length, 0)
    assert.equal(left.result.joined, false)
  } finally { await app.close(); await rm(app.dataDirectory, { recursive: true, force: true }) }
})

test('two simultaneous visitors cannot take the same final space, including across independent server instances', async () => {
  const first = await harness()
  const second = await harness(first.dataDirectory)
  try {
    const organizer = first.visitor()
    const created = await organizer.request('/projects', 'POST', input({ volunteersNeeded: 1 }), { 'Idempotency-Key': randomUUID() })
    assert.equal(created.status, 201)
    // Both readers see the empty team before concurrent writes.
    const a = first.visitor(), b = second.visitor()
    await Promise.all([a.request(), b.request()])
    const attempts = await Promise.all([a.request(`/projects/${created.result.id}/join`, 'POST', { name: 'Neighbor A', role: 'planting', availability: '' }), b.request(`/projects/${created.result.id}/join`, 'POST', { name: 'Neighbor B', role: 'planning', availability: '' })])
    assert.deepEqual(attempts.map(attempt => attempt.status).sort(), [200, 409])
    const saved = await organizer.request(`/projects/${created.result.id}`)
    assert.equal(saved.result.members.length, 1)
    assert.equal(saved.result.volunteersNeeded, 1)
  } finally { await second.close(); await first.close(); await rm(first.dataDirectory, { recursive: true, force: true }) }
})

test('only an organizer can edit; stale revisions and removing occupied spaces or roles preserve the saved plan', async () => {
  const app = await harness()
  try {
    const organizer = app.visitor(), neighbor = app.visitor(), stranger = app.visitor()
    const created = await organizer.request('/projects', 'POST', input(), { 'Idempotency-Key': randomUUID() })
    const id = created.result.id
    const unauthorized = await stranger.request(`/projects/${id}`, 'PATCH', { status: 'closed', revision: 1 })
    assert.equal(unauthorized.status, 403)
    await neighbor.request(`/projects/${id}/join`, 'POST', { name: 'Test helper', role: 'planting', availability: '' })
    const stale = await organizer.request(`/projects/${id}`, 'PATCH', { ...input({ budget: 500 }), revision: 1 })
    assert.equal(stale.status, 409)
    let current = (await organizer.request(`/projects/${id}`)).result
    const missingRole = await organizer.request(`/projects/${id}`, 'PATCH', { ...input({ roles: ['planning'] }), revision: current.revision })
    assert.equal(missingRole.status, 409)
    const saved = await organizer.request(`/projects/${id}`, 'PATCH', { ...input({ budget: 150, kind: 'revive-garden' }), revision: current.revision })
    assert.equal(saved.status, 200)
    assert.equal(saved.result.members.length, 1)
    assert.equal(saved.result.kind, 'revive-garden')
    current = saved.result
    const closed = await organizer.request(`/projects/${id}`, 'PATCH', { status: 'closed', revision: current.revision })
    assert.equal(closed.status, 200)
    assert.equal((await stranger.request(`/projects/${id}/join`, 'POST', { name: 'New helper', role: 'planning', availability: '' })).status, 409)
    const reopened = await organizer.request(`/projects/${id}`, 'PATCH', { status: 'open', revision: closed.result.revision })
    assert.equal(reopened.status, 200)
    await stranger.request(`/projects/${id}/join`, 'POST', { name: 'New helper', role: 'planning', availability: '' })
    current = (await organizer.request(`/projects/${id}`)).result
    const tooSmall = await organizer.request(`/projects/${id}`, 'PATCH', { ...input({ volunteersNeeded: 1 }), revision: current.revision })
    assert.equal(tooSmall.status, 409)
    assert.equal((await organizer.request(`/projects/${id}`)).result.volunteersNeeded, 2)
  } finally { await app.close(); await rm(app.dataDirectory, { recursive: true, force: true }) }
})

test('projects and visitor control survive a server restart', async () => {
  const before = await harness()
  const organizer = before.visitor()
  const created = await organizer.request('/projects', 'POST', input(), { 'Idempotency-Key': randomUUID() })
  const token = created.headers.get('set-cookie')!.split(';')[0]
  await before.close()
  const after = await harness(before.dataDirectory)
  try {
    const restored = await after.visitor().request(`/projects/${created.result.id}`, 'GET', undefined, { Cookie: token })
    assert.equal(restored.status, 200)
    assert.equal(restored.result.title, created.result.title)
    assert.equal(restored.result.isOrganizer, true)
    assert.equal(restored.result.budget, 120)
  } finally { await after.close(); await rm(before.dataDirectory, { recursive: true, force: true }) }
})

test('failed store validation does not overwrite saved projects', async () => {
  const app = await harness()
  const visitor = app.visitor()
  await visitor.request()
  const database = new DatabaseSync(join(app.dataDirectory, 'gardens.sqlite'))
  try {
    for (const invalid of [
      '{"version":99,"projects":[],"preserve":"original"}',
      JSON.stringify({ version: 1, projects: [{ ...input(), budget: -1 }], preserve: 'original' }),
    ]) {
      database.prepare('UPDATE community SET value = ? WHERE id = 1').run(invalid)
      assert.equal((await visitor.request()).status, 503)
      assert.equal((await visitor.request('/projects', 'POST', input(), { 'Idempotency-Key': randomUUID() })).status, 503)
      assert.equal(database.prepare('SELECT value FROM community WHERE id = 1').get()!.value, invalid)
    }
  } finally { database.close(); await app.close(); await rm(app.dataDirectory, { recursive: true, force: true }) }
})

test('a damaged legacy store is kept for recovery rather than replaced by an empty board', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'common-ground-community-legacy-'))
  await writeFile(join(directory, 'gardens.json'), '{damaged')
  const app = await harness(directory)
  try {
    assert.equal((await app.visitor().request()).status, 503)
    assert.equal(await readFile(join(directory, 'gardens.json'), 'utf8'), '{damaged')
  } finally { await app.close(); await rm(directory, { recursive: true, force: true }) }
})

test('foreign origins, malformed bodies, and unsupported actions cannot change local projects', async () => {
  const app = await harness()
  try {
    const visitor = app.visitor()
    assert.equal((await visitor.request('/projects', 'POST', input(), { Origin: 'https://other.example', 'Idempotency-Key': randomUUID() })).status, 403)
    assert.equal((await visitor.request('/projects', 'POST', '{broken', { 'Idempotency-Key': randomUUID() })).status, 400)
    assert.equal((await visitor.request('/projects', 'POST', 'x'.repeat(25_000), { 'Idempotency-Key': randomUUID() })).status, 413)
    assert.equal((await visitor.request('/projects', 'POST', input(), { 'Content-Type': 'text/plain', 'Idempotency-Key': randomUUID() })).status, 415)
    const created = await visitor.request('/projects', 'POST', input(), { 'Idempotency-Key': randomUUID() })
    assert.equal((await visitor.request(`/projects/${created.result.id}`, 'PATCH', { status: 'invalid', revision: 1 })).status, 422)
    assert.equal((await visitor.request(`/projects/${created.result.id}`, 'GET')).result.status, 'open')
  } finally { await app.close(); await rm(app.dataDirectory, { recursive: true, force: true }) }
})

test('the server rechecks mapped water instead of trusting a client’s surface or permission claims', async () => {
  const app = await harness()
  try {
    const lake = map.water.filter(shape => shape.name === 'Lake Merritt').sort((a, b) => b.points.length - a.points.length)[0]
    const point = [0, 1].map(axis => lake.points.reduce((sum, item) => sum + item[axis], 0) / lake.points.length)
    const selected = { ...parkSite, ...geographicPoint(map, point)!, feature: 'green' as const }
    const result = await app.visitor().request('/projects', 'POST', input({ site: selected, permission: 'confirmed', permissionNote: 'A reported permission' }), { 'Idempotency-Key': randomUUID() })
    assert.equal(result.status, 422)
    assert.match(result.result.error!, /mapped water/)
  } finally { await app.close(); await rm(app.dataDirectory, { recursive: true, force: true }) }
})

test('a garden outside the Oakland pilot is shared, joinable, editable, and survives a restart', async () => {
  const before = await harness()
  const organizer = before.visitor()
  const site = { ...parkSite, label: 'San Francisco test spot', latitude: 37.7749, longitude: -122.4194 }
  const created = await organizer.request('/projects', 'POST', input({ site }), { 'Idempotency-Key': randomUUID() })
  assert.equal(created.status, 201)
  assert.equal(created.result.site.latitude, site.latitude)
  assert.equal(created.result.site.longitude, site.longitude)
  assert.equal(created.result.site.feature, 'unmapped')
  assert.equal(created.result.site.nearestStreet, null)
  const neighbor = before.visitor()
  const joined = await neighbor.request(`/projects/${created.result.id}/join`, 'POST', { name: 'Regional helper', role: 'planning', availability: '' })
  assert.equal(joined.status, 200)
  const edited = await organizer.request(`/projects/${created.result.id}`, 'PATCH', { ...input({ site, budget: 180 }), revision: joined.result.revision })
  assert.equal(edited.status, 200)
  const token = created.headers.get('set-cookie')!.split(';')[0]
  await before.close()
  const after = await harness(before.dataDirectory)
  try {
    const restored = await after.visitor().request(`/projects/${created.result.id}`, 'GET', undefined, { Cookie: token })
    assert.equal(restored.status, 200)
    assert.equal(restored.result.isOrganizer, true)
    assert.equal(restored.result.members.length, 1)
    assert.equal(restored.result.budget, 180)
    assert.equal(restored.result.site.longitude, site.longitude)
  } finally { await after.close(); await rm(before.dataDirectory, { recursive: true, force: true }) }
})

test('the server rechecks regional Bay water and rejects projects outside the expanded coverage', async () => {
  const app = await harness()
  try {
    const organizer = app.visitor()
    const water = { ...parkSite, latitude: 37.66, longitude: -122.3 }
    const result = await organizer.request('/projects', 'POST', input({ site: water, permission: 'confirmed', permissionNote: 'A reported permission' }), { 'Idempotency-Key': randomUUID() })
    assert.equal(result.status, 422)
    assert.match(result.result.error!, /mapped water/)
    const outside = await organizer.request('/projects', 'POST', input({ site: { ...parkSite, latitude: 40, longitude: -122 } }), { 'Idempotency-Key': randomUUID() })
    assert.equal(outside.status, 422)
    assert.match(outside.result.error!, /Bay Area map/)
    assert.equal((await organizer.request<CommunitySnapshot>()).result.projects.length, 0)
  } finally { await app.close(); await rm(app.dataDirectory, { recursive: true, force: true }) }
})
