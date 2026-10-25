import { writeFile } from 'node:fs/promises'

// A single, manually run query. The game uses the saved extract, never live Overpass calls.
const endpoint = 'https://overpass-api.de/api/interpreter'
const query = '[out:json][timeout:45];node["place"~"^(city|town)$"](36.85,-123.6,38.95,-121.1);out body;'
const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Common-Ground-map-data' },
  body: new URLSearchParams({ data: query }),
  signal: AbortSignal.timeout(60_000),
})
if (!response.ok) throw new Error(`City extract: HTTP ${response.status}. Retry manually later.`)
const data = await response.json()
if (!Array.isArray(data.elements) || data.remark) throw new Error('City extract is incomplete.')
const places = data.elements.filter(node => node.type === 'node' && node.tags?.name && Number.isFinite(node.lat) && Number.isFinite(node.lon)).map(node => ({
  id: node.id,
  name: node.tags.name,
  coordinates: [node.lon, node.lat],
  population: Number(String(node.tags.population ?? '0').replaceAll(',', '')) || 0,
}))
await writeFile(new URL('./data/bay-area-places.json', import.meta.url), JSON.stringify({
  source: {
    name: 'OpenStreetMap contributors',
    url: 'https://www.openstreetmap.org/',
    license: 'ODbL 1.0',
    licenseUrl: 'https://www.openstreetmap.org/copyright',
    endpoint, query, checkedAt: new Date().toISOString().slice(0, 10),
    osmBase: data.osm3s?.timestamp_osm_base ?? null,
  },
  places,
}, null, 2) + '\n')
console.log(`Saved ${places.length} public city and town labels.`)
