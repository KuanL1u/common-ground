import type { PlaceId } from './types.ts'

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
}
