import { initialResources } from '../data/resources.ts'
import { emptyLayout } from '../data/scenario.ts'
import { safePublicUrl } from './directory.ts'
import { validLayout } from './game.ts'
import type { Resource, StoredState, Suggestion } from '../types.ts'

export const STORAGE_KEY = 'common-ground-v1'

export function initialState(): StoredState {
  return {
    version: 1,
    layout: emptyLayout(),
    savedDesign: null,
    resources: initialResources.map((resource) => ({ ...resource })),
    suggestions: [],
    reflection: '',
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function validSuggestion(value: unknown): value is Suggestion {
  if (!isObject(value)) return false
  return (
    typeof value.id === 'string' && value.id.length < 120 &&
    initialResources.some((resource) => resource.id === value.resourceId) &&
    typeof value.resourceName === 'string' && value.resourceName.length < 200 &&
    ['access', 'status'].includes(String(value.field)) &&
    typeof value.before === 'string' && value.before.length <= 600 &&
    typeof value.after === 'string' && value.after.length <= 600 &&
    (value.field !== 'status' || ['source-checked', 'inactive'].includes(value.after)) &&
    (value.field !== 'access' || value.after.trim().length >= 10) &&
    safePublicUrl(value.sourceUrl) &&
    typeof value.note === 'string' && value.note.length <= 600 &&
    ['pending', 'approved', 'declined'].includes(String(value.status)) &&
    typeof value.submittedAt === 'string' && Number.isFinite(Date.parse(value.submittedAt)) &&
    (value.reviewedAt === undefined || (typeof value.reviewedAt === 'string' && Number.isFinite(Date.parse(value.reviewedAt)))) &&
    (value.demo === undefined || typeof value.demo === 'boolean')
  )
}

export function restoreState(raw: string | null): StoredState {
  const state = initialState()
  if (!raw) return state
  try {
    const value: unknown = JSON.parse(raw)
    if (!isObject(value) || value.version !== 1) return state
    if (validLayout(value.layout)) state.layout = value.layout
    if (isObject(value.savedDesign) && validLayout(value.savedDesign.layout)) {
      state.savedDesign = { name: 'Design A', layout: value.savedDesign.layout }
    }
    if (typeof value.reflection === 'string') state.reflection = value.reflection.slice(0, 1200)
    if (Array.isArray(value.suggestions)) {
      state.suggestions = value.suggestions.filter(validSuggestion).slice(0, 150)
    }
    if (Array.isArray(value.resources)) {
      const savedResources = value.resources.filter(isObject)
      state.resources = state.resources.map((resource): Resource => {
        const saved = savedResources.find((item) => item.id === resource.id)
        // Only the two reviewable fields can override the checked seed data.
        // Public source URLs and privacy-sensitive locations stay in the curated dataset.
        if (
          !saved || !['demo-reviewed', 'inactive'].includes(String(saved.status)) ||
          typeof saved.access !== 'string' || saved.access.length < 10 || saved.access.length > 600 ||
          !safePublicUrl(saved.reviewSourceUrl) ||
          typeof saved.reviewedAt !== 'string' || !Number.isFinite(Date.parse(saved.reviewedAt))
        ) return resource
        return {
          ...resource,
          access: saved.access,
          status: saved.status as 'demo-reviewed' | 'inactive',
          reviewedAt: saved.reviewedAt,
          reviewSourceUrl: saved.reviewSourceUrl,
          reviewer: 'Local demo reviewer',
        }
      })
    }
    return state
  } catch {
    return state
  }
}

export function readState(): StoredState {
  try {
    return restoreState(localStorage.getItem(STORAGE_KEY))
  } catch {
    return initialState()
  }
}

export function persistState(state: StoredState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
