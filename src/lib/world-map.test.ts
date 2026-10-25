import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { climateAt, describeSite, geographicPoint, inRegionalPolygon, mapPoint, terrainAt } from '../community/geography.ts'
import type { SiteEnvironment } from '../community/types.ts'
import { bayAreaBounds } from '../exploration/geography.ts'
import type { BayAreaGeometry, NeighborhoodGeometry } from '../exploration/geography.ts'
import { bayAreaCamera, clampCamera, initialCamera, screenToWorld, startingScale, worldExtent, zoomCamera } from '../exploration/map-camera.ts'

const local = JSON.parse(readFileSync(new URL('../data/east-bay-map.json', import.meta.url), 'utf8')) as NeighborhoodGeometry
const region = JSON.parse(readFileSync(new URL('../data/bay-area-map.json', import.meta.url), 'utf8')) as BayAreaGeometry
const map = { ...local, region }
const environment = JSON.parse(readFileSync(new URL('../data/site-environment.json', import.meta.url), 'utf8')) as SiteEnvironment
const desktop = { width: 1200, height: 740 }
const cities = [
  { latitude: 37.7749, longitude: -122.4194 },
  { latitude: 37.3382, longitude: -121.8863 },
  { latitude: 38.4405, longitude: -122.7144 },
  { latitude: 38.2975, longitude: -122.2869 },
  { latitude: 37.9735, longitude: -122.5311 },
]
const screenPoint = (viewport: typeof desktop, camera: ReturnType<typeof initialCamera>, [x, y]: number[]) => {
  const scale = startingScale(map, viewport) * camera.zoom
  return [viewport.width / 2 + (x - camera.x) * scale, viewport.height / 2 + (y - camera.y) * scale]
}

test('the expanded map keeps the exact Oakland starting camera and projection', () => {
  assert.deepEqual(initialCamera(map), initialCamera(local))
  assert.deepEqual(clampCamera(map, desktop, initialCamera(map)), initialCamera(local))
  for (const anchor of Object.values(local.anchors)) {
    assert.deepEqual(geographicPoint(map, anchor!.point), geographicPoint(local, anchor!.point))
  }
  assert.equal(zoomCamera(local, desktop, initialCamera(local), -1).zoom, 1)
  assert.equal(zoomCamera(map, desktop, initialCamera(map), -1).zoom, .5)
})

test('zooming out fits every regional edge on wide and narrow screens and has a finite limit', () => {
  for (const viewport of [desktop, { width: 390, height: 470 }, { width: 1600, height: 940 }]) {
    const fitted = bayAreaCamera(map, viewport)
    assert.ok(fitted.zoom > 0 && fitted.zoom < .05)
    const extent = worldExtent(map)
    for (const point of [[extent.left, extent.top], [extent.right, extent.bottom]]) {
      const [x, y] = screenPoint(viewport, fitted, point)
      assert.ok(x >= 23.9 && x <= viewport.width - 23.9, `horizontal fit at ${viewport.width}px`)
      assert.ok(y >= 23.9 && y <= viewport.height - 23.9, `vertical fit at ${viewport.width}px`)
    }
    let camera = initialCamera(map)
    for (let count = 0; count < 30; count++) camera = zoomCamera(map, viewport, camera, -1)
    assert.deepEqual(camera, fitted)
    assert.deepEqual(clampCamera(map, viewport, { ...fitted, x: -1e9, y: 1e9 }), fitted)
  }
})

test('panning reaches San Francisco, San Jose, and the North Bay without changing zoom or escaping regional bounds', () => {
  for (const city of cities) {
    const [x, y] = mapPoint(map, city)
    const camera = clampCamera(map, desktop, { zoom: .35, x, y })
    assert.deepEqual(camera, { zoom: .35, x, y })
    const moved = clampCamera(map, desktop, { ...camera, x: camera.x + 90 / (startingScale(map, desktop) * camera.zoom) })
    assert.equal(moved.zoom, camera.zoom)
  }
  const extent = worldExtent(map)
  const far = clampCamera(map, desktop, { zoom: 100, x: -1e9, y: 1e9 })
  assert.equal(far.zoom, 6)
  assert.ok(far.x > extent.left && far.x < extent.right && far.y > extent.top && far.y < extent.bottom)
})

test('screen picks round-trip to the same geographic spot at all zoom levels and reject outside or invalid coordinates', () => {
  for (const viewport of [desktop, { width: 390, height: 470 }]) {
    for (const city of cities) {
      const [x, y] = mapPoint(map, city)
      for (const camera of [bayAreaCamera(map, viewport), { zoom: .35, x, y }]) {
        const picked = geographicPoint(map, screenToWorld(map, viewport, camera, screenPoint(viewport, camera, mapPoint(map, city))))!
        assert.ok(Math.abs(picked.latitude - city.latitude) < 1e-9)
        assert.ok(Math.abs(picked.longitude - city.longitude) < 1e-9)
      }
    }
  }
  assert.equal(geographicPoint(local, mapPoint(local, cities[0])), null)
  assert.equal(geographicPoint(map, mapPoint(map, { latitude: 40, longitude: -122 })), null)
  assert.equal(geographicPoint(map, [NaN, 0]), null)
  assert.equal(geographicPoint(map, [0, Infinity]), null)
})

test('regional water respects polygon holes and actual coastline while outside site details stay unknown', () => {
  const shape = { rings: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]], [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]]] }
  assert.equal(inRegionalPolygon([2, 2], shape), true)
  assert.equal(inRegionalPolygon([5, 5], shape), false)
  for (const city of cities) {
    const site = describeSite(map, city)
    assert.equal(site.feature, 'unmapped')
    assert.equal(site.nearestStreet, null)
    assert.match(site.featureName, /unknown/)
  }
  for (const water of [{ latitude: 37.7, longitude: -123.1 }, { latitude: 37.66, longitude: -122.3 }]) {
    assert.equal(describeSite(map, water).feature, 'water')
  }
  const park = geographicPoint(map, map.anchors.park!.point)!
  assert.equal(describeSite(map, park).feature, 'green')
})

test('Oakland environmental data cannot be presented as measurements elsewhere in the Bay Area', () => {
  const park = geographicPoint(map, map.anchors.park!.point)!
  assert.equal(climateAt(environment, park), environment.climate)
  assert.ok(terrainAt(environment, park))
  for (const city of cities) {
    assert.equal(climateAt(environment, city), null)
    assert.equal(terrainAt(environment, city), null)
  }
})

test('the saved regional overview has source licenses, consistent coverage, city labels, and finite clipped geometry', () => {
  assert.deepEqual(region.bounds, [...bayAreaBounds])
  assert.equal(region.source.name, 'Natural Earth')
  assert.equal(region.source.license, 'Public domain')
  assert.equal(region.source.scale, '1:10,000,000')
  assert.match(region.source.revision, /^[a-f0-9]{40}$/)
  assert.equal(region.placesSource.license, 'ODbL 1.0')
  for (const name of ['Oakland', 'San Francisco', 'San Jose', 'Santa Rosa', 'Napa', 'San Rafael', 'Fremont']) {
    assert.ok(region.cities.some(city => city.name === name), `${name} city label`)
  }
  const [west, south, east, north] = region.dataBounds
  for (const [longitude, latitude] of [
    ...[...region.land, ...region.lakes, ...region.urban].flatMap(shape => shape.rings.flat()),
    ...region.roads.flatMap(road => road.points),
  ]) {
    assert.ok(Number.isFinite(longitude) && Number.isFinite(latitude))
    assert.ok(longitude >= west && longitude <= east && latitude >= south && latitude <= north)
  }
  assert.equal(readFileSync(new URL('../data/bay-area-map.json', import.meta.url), 'utf8'), readFileSync(new URL('../../public/data/bay-area-map.json', import.meta.url), 'utf8'))
})
