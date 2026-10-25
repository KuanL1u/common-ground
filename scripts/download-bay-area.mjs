import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = new URL('./data/natural-earth/', import.meta.url)
const headers = { 'User-Agent': 'Common-Ground-map-data' }
const revisionResponse = await fetch('https://api.github.com/repos/nvkelso/natural-earth-vector/commits/master', { headers })
if (!revisionResponse.ok) throw new Error(`Natural Earth revision: HTTP ${revisionResponse.status}`)
const { sha } = await revisionResponse.json()
await mkdir(root, { recursive: true })
const names = ['land', 'lakes', 'roads', 'urban_areas', 'populated_places']
const files = []
// Keep downloads modest: two requests at a time, with no tile prefetching.
for (let index = 0; index < names.length; index += 2) {
  const results = await Promise.allSettled(names.slice(index, index + 2).map(async name => {
    const filename = `ne_10m_${name}.geojson`
    const url = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${sha}/geojson/${filename}`
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(120_000) })
    if (!response.ok) throw new Error(`${filename}: HTTP ${response.status}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    const data = JSON.parse(bytes.toString('utf8'))
    if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error(`${filename}: invalid GeoJSON`)
    await writeFile(new URL(filename, root), bytes)
    console.log(`Saved ${filename} (${(bytes.length / 1_000_000).toFixed(1)} MB).`)
    return { name, filename, url, sha256: createHash('sha256').update(bytes).digest('hex') }
  }))
  for (const result of results) {
    if (result.status === 'rejected') throw result.reason
    files.push(result.value)
  }
}
await writeFile(new URL('../bay-area-source.json', root), JSON.stringify({
  name: 'Natural Earth', url: 'https://www.naturalearthdata.com/',
  license: 'Public domain', licenseUrl: 'https://www.naturalearthdata.com/about/terms-of-use/',
  scale: '1:10,000,000', revision: sha, checkedAt: new Date().toISOString().slice(0, 10), files,
}, null, 2) + '\n')
console.log(`Source manifest saved beside ${fileURLToPath(root)}.`)
