import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const root = fileURLToPath(new URL('../', import.meta.url))
const bounds = [-122.299, 37.7965, -122.2365, 37.827]
const columns = 28, rows = 18
const coordinates = Array.from({ length: columns * rows }, (_, index) => ({
  latitude: bounds[3] - Math.floor(index / columns) / (rows - 1) * (bounds[3] - bounds[1]),
  longitude: bounds[0] + index % columns / (columns - 1) * (bounds[2] - bounds[0]),
}))
const weatherUrl = 'https://archive-api.open-meteo.com/v1/archive?latitude=37.81175&longitude=-122.26775&start_date=2016-01-01&end_date=2025-12-31&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&models=era5&timezone=America%2FLos_Angeles&elevation=nan'
const rawWeather = `${root}scripts/data/oakland-weather-2016-2025.json`
const refresh = process.argv.includes('--refresh')
if (refresh) await run('curl', ['--fail', '--silent', '--show-error', '--max-time', '60', weatherUrl, '-o', rawWeather])
const weather = JSON.parse(await readFile(rawWeather, 'utf8'))
const days = weather.daily
if (days.time.length !== 3653 || days.time[0] !== '2016-01-01' || days.time.at(-1) !== '2025-12-31') throw new Error('Weather period incomplete')
for (const key of ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum']) {
  if (days[key].length !== days.time.length || !days[key].every(Number.isFinite)) throw new Error(`Weather variable incomplete: ${key}`)
}
const round = (value, precision = 1) => Number(value.toFixed(precision))
const months = Array.from({ length: 12 }, (_, month) => {
  const indices = days.time.flatMap((date, index) => Number(date.slice(5, 7)) === month + 1 ? [index] : [])
  const mean = key => indices.reduce((sum, index) => sum + days[key][index], 0) / indices.length
  return { month: month + 1, highC: round(mean('temperature_2m_max')), lowC: round(mean('temperature_2m_min')), precipitationMm: round(indices.reduce((sum, index) => sum + days.precipitation_sum[index], 0) / 10) }
})
const requestUrls = []
const elevations = []
for (let offset = 0; offset < coordinates.length; offset += 100) {
  const batch = coordinates.slice(offset, offset + 100)
  const url = new URL('https://api.open-meteo.com/v1/elevation')
  url.searchParams.set('latitude', batch.map(point => point.latitude.toFixed(7)).join(','))
  url.searchParams.set('longitude', batch.map(point => point.longitude.toFixed(7)).join(','))
  requestUrls.push(url.toString())
  const rawPath = `${root}scripts/data/east-bay-elevation-${offset / 100}.json`
  if (refresh || process.argv.includes('--terrain')) await run('curl', ['--fail', '--silent', '--show-error', '--max-time', '40', url.toString(), '-o', rawPath])
  const data = JSON.parse(await readFile(rawPath, 'utf8'))
  if (!Array.isArray(data.elevation) || data.elevation.length !== batch.length || !data.elevation.every(value => value === null || Number.isFinite(value))) throw new Error(`Terrain batch incomplete: ${offset}`)
  elevations.push(...data.elevation)
  console.log(`Terrain samples: ${elevations.length}/${coordinates.length}`)
}
const environment = {
  version: 1,
  checkedAt: new Date().toISOString().slice(0, 10),
  climate: {
    source: 'Open-Meteo / Copernicus ERA5',
    url: 'https://open-meteo.com/en/docs/historical-weather-api',
    requestUrl: weatherUrl,
    period: '2016–2025',
    years: 10,
    resolutionKm: 25,
    requestedCoordinates: [37.81175, -122.26775],
    returnedCoordinates: [weather.latitude, weather.longitude],
    months,
    annualRainMm: round(days.precipitation_sum.reduce((sum, value) => sum + value, 0) / 10),
    summerRainMm: round(months.filter(month => month.month >= 6 && month.month <= 8).reduce((sum, month) => sum + month.precipitationMm, 0)),
    coldestNightC: Math.min(...days.temperature_2m_min),
    freezingDaysPerYear: days.temperature_2m_min.filter(value => value <= 0).length / 10,
  },
  terrain: {
    source: 'Open-Meteo / Copernicus DEM GLO-90 (2021)',
    url: 'https://open-meteo.com/en/docs/elevation-api',
    resolutionMeters: 90,
    sampleSpacingMeters: 205,
    bounds,
    columns,
    rows,
    elevations,
    requestUrls,
  },
}
await mkdir(`${root}src/data`, { recursive: true })
await mkdir(`${root}public/data`, { recursive: true })
const text = JSON.stringify(environment)
await writeFile(`${root}src/data/site-environment.json`, text)
await writeFile(`${root}public/data/site-environment.json`, text)
console.log(JSON.stringify({ period: environment.climate.period, annualRainMm: environment.climate.annualRainMm, summerRainMm: environment.climate.summerRainMm, coldestNightC: environment.climate.coldestNightC, terrainSamples: elevations.length }))
