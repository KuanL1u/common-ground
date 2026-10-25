// Optional data refresh. Normal dev/build uses the saved, attributed dataset.
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const run = promisify(execFile)
await mkdir(new URL('data/', import.meta.url), { recursive: true })
const jobs = []
for (let col = 0; col < 4; col++) {
  for (let row = 0; row < 3; row++) {
    const west = -122.299 + col * .015625
    const south = 37.7965 + row * (.0305 / 3)
    const box = [west - .00005, south - .00005, west + .015625 + .00005, south + .0305 / 3 + .00005].map(n => n.toFixed(7)).join(',')
    jobs.push({
      name: `${col}-${row}`,
      url: `https://www.openstreetmap.org/api/0.6/map?bbox=${box}`,
      filename: `scripts/data/east-bay-tile-${col}-${row}.osm`,
    })
  }
}
const extracts = []
for (let index = 0; index < jobs.length; index += 2) {
  const batch = await Promise.allSettled(jobs.slice(index, index + 2).map(async job => {
    const { stdout } = await run('curl', [
      '--fail-with-body', '--silent', '--show-error', '--connect-timeout', '10', '--max-time', '45',
      job.url, '--output', job.filename, '--write-out', 'HTTP %{http_code}; %{size_download} bytes',
    ], { cwd: root, timeout: 50000 })
    if (!(await readFile(new URL(job.filename, `file://${root}`), 'utf8')).includes('<osm ')) throw new Error('Invalid OSM extract')
    return { ...job, result: stdout, ok: true }
  }))
  batch.forEach((result, offset) => {
    const record = result.status === 'fulfilled' ? result.value : { ...jobs[index + offset], ok: false, error: String(result.reason) }
    extracts.push(record)
    console.log(JSON.stringify(record))
  })
}
if (extracts.some(extract => !extract.ok)) {
  console.error('Some tiles could not be downloaded; the previous manifest and derived map are retained.')
  process.exitCode = 1
} else {
  await writeFile(new URL('data/east-bay-source.json', import.meta.url), JSON.stringify({ name: 'OpenStreetMap API', checkedAt: new Date().toISOString().slice(0, 10), extracts }, null, 2) + '\n')
  console.log('Saved 12 extracts. Run python3 scripts/prepare-world.py east-bay to derive the map.')
}
