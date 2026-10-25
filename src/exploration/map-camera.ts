import { mapPoint } from '../community/geography.ts'
import type { NeighborhoodGeometry } from './geography.ts'

export interface Camera { zoom: number; x: number; y: number }
export interface Viewport { width: number; height: number }

export const initialCamera = (map: NeighborhoodGeometry): Camera => ({ zoom: 1, x: map.width / 2, y: map.height / 2 })
export const startingScale = (map: NeighborhoodGeometry, viewport: Viewport) => Math.min(viewport.width / map.width, viewport.height / map.height)

export function worldExtent(map: NeighborhoodGeometry) {
  if (!map.region) return { left: 0, top: 0, right: map.width, bottom: map.height }
  const [west, south, east, north] = map.region.bounds
  const [left, top] = mapPoint(map, { latitude: north, longitude: west })
  const [right, bottom] = mapPoint(map, { latitude: south, longitude: east })
  return { left, top, right, bottom }
}

export function bayAreaCamera(map: NeighborhoodGeometry, viewport: Viewport): Camera {
  const extent = worldExtent(map)
  const scale = Math.min(Math.max(1, viewport.width - 48) / (extent.right - extent.left), Math.max(1, viewport.height - 48) / (extent.bottom - extent.top))
  return { zoom: Math.min(1, scale / startingScale(map, viewport)), x: (extent.left + extent.right) / 2, y: (extent.top + extent.bottom) / 2 }
}

export function clampCamera(map: NeighborhoodGeometry, viewport: Viewport, camera: Camera): Camera {
  const extent = worldExtent(map)
  const minimum = map.region ? bayAreaCamera(map, viewport).zoom : 1
  const zoom = Math.max(minimum, Math.min(6, camera.zoom))
  const scale = startingScale(map, viewport) * zoom
  const halfWidth = viewport.width / scale / 2, halfHeight = viewport.height / scale / 2
  const center = (value: number, low: number, high: number, half: number) => half * 2 >= high - low ? (low + high) / 2 : Math.max(low + half, Math.min(high - half, value))
  return { zoom, x: center(camera.x, extent.left, extent.right, halfWidth), y: center(camera.y, extent.top, extent.bottom, halfHeight) }
}

export function zoomCamera(map: NeighborhoodGeometry, viewport: Viewport, camera: Camera, direction: number): Camera {
  const zoom = direction > 0 ? camera.zoom >= 1 ? camera.zoom + .5 : Math.min(1, camera.zoom * 2)
    : camera.zoom > 1 ? camera.zoom - .5 : camera.zoom / 2
  return clampCamera(map, viewport, { ...camera, zoom })
}

export function screenToWorld(map: NeighborhoodGeometry, viewport: Viewport, camera: Camera, [x, y]: number[]): number[] {
  const scale = startingScale(map, viewport) * camera.zoom
  return [camera.x + (x - viewport.width / 2) / scale, camera.y + (y - viewport.height / 2) / scale]
}
