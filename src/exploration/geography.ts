import type { PlaceId } from './types.ts'

export const bayAreaBounds = [-123.6, 36.85, -121.1, 38.95] as const

export interface RegionalPolygon { rings: number[][][] }
export interface BayAreaGeometry {
  version: 1
  bounds: number[]
  dataBounds: number[]
  source: { name: string; url: string; license: string; licenseUrl: string; checkedAt: string; scale: string; revision: string }
  placesSource: { name: string; url: string; license: string; licenseUrl: string; checkedAt: string; osmBase: string | null }
  land: RegionalPolygon[]
  lakes: RegionalPolygon[]
  urban: RegionalPolygon[]
  roads: { kind: string; name: string; points: number[][] }[]
  cities: { name: string; coordinates: number[]; population: number }[]
}

export interface NeighborhoodGeometry {
  width: number
  height: number
  bounds: number[]
  anchors: Partial<Record<PlaceId, { point: number[]; arrival: number[] }>>
  routes: Record<string, number[][]>
  roads: { id: string; name: string; kind: string; points: number[][] }[]
  buildings: { id: string; points: number[][] }[]
  greens: { id: string; name?: string; points: number[][] }[]
  water: { id: string; name?: string; points: number[][] }[]
  pitches: { id: string; points: number[][] }[]
  trees: number[][]
  region?: BayAreaGeometry
}
