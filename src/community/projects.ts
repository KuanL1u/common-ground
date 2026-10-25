import { inPilot } from './geography.ts'
import { plants } from './plants.ts'
import type { HelpRole, JoinInput, ProjectInput, SiteConditions } from './types.ts'

export const projectKinds = [
  { id: 'new-garden', name: 'New garden' },
  { id: 'revive-garden', name: 'Revive a garden' },
  { id: 'landscape', name: 'Landscape' },
] as const
export const helpRoles = [
  { id: 'planting', name: 'Planting' },
  { id: 'building', name: 'Building' },
  { id: 'watering', name: 'Watering & care' },
  { id: 'planning', name: 'Planning' },
] as const
export const permissionLabels = { checking: 'Permission pending', contacted: 'Steward contacted', confirmed: 'Permission reported' }
export const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value)

export class InputError extends Error {
  status: number
  constructor(message: string, status = 422) { super(message); this.name = 'InputError'; this.status = status }
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InputError('Please provide the project details.')
  return value as Record<string, unknown>
}

function text(value: unknown, label: string, min: number, max: number): string {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new InputError(`${label}: use ${min ? `${min}–${max}` : `up to ${max}`} characters.`)
  return value.trim()
}

function choice<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== 'string' || !values.includes(value as T)) throw new InputError(`Choose ${label}.`)
  return value as T
}

function number(value: unknown, label: string, min: number, max: number, integer = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw new InputError(`${label}: use ${integer ? 'a whole number' : 'a number'} from ${min} to ${max}.`)
  return value
}

function choices<T extends string>(value: unknown, values: readonly T[], label: string, min = 0): T[] {
  if (!Array.isArray(value) || value.length > values.length) throw new InputError(`Choose ${label}.`)
  const selected = [...new Set(value.map(item => choice(item, values, label)))]
  if (selected.length < min) throw new InputError(`Choose at least one ${label}.`)
  return selected
}

export function validateConditions(value: unknown): SiteConditions {
  const input = object(value)
  const result: SiteConditions = {
    sun: choice(input.sun, ['unknown', 'shade', 'part', 'full'], 'sun exposure'),
    water: choice(input.water, ['unknown', 'none', 'limited', 'regular'], 'water access'),
    drainage: choice(input.drainage, ['unknown', 'drains', 'ponds'], 'drainage'),
    soil: choice(input.soil, ['unknown', 'tested', 'clean-bed', 'concern'], 'soil status'),
    surface: choice(input.surface, ['unknown', 'ground', 'containers'], 'growing area'),
    season: choice(input.season, ['spring', 'summer', 'fall', 'winter'], 'planting season'),
  }
  if (result.soil === 'clean-bed' && result.surface !== 'containers') throw new InputError('Clean imported soil belongs to the raised-bed or container option.')
  return result
}

export function validateProject(value: unknown): ProjectInput {
  const input = object(value), site = object(input.site)
  const latitude = number(site.latitude, 'Latitude', -90, 90), longitude = number(site.longitude, 'Longitude', -180, 180)
  if (!inPilot(latitude, longitude)) throw new InputError('Choose a spot inside the East Bay pilot map.')
  const selectedPlants = choices(input.plants, plants.map(plant => plant.id), 'plants')
  const otherPlants = text(input.otherPlants, 'Other plants', 0, 160)
  if (!selectedPlants.length && !otherPlants) throw new InputError('Choose what you want to grow.')
  const permission = choice(input.permission, ['checking', 'contacted', 'confirmed'], 'permission status')
  const permissionNote = text(input.permissionNote, 'Permission note', permission === 'confirmed' ? 5 : 0, 240)
  const workDate = text(input.workDate, 'Work date', 0, 10)
  if (workDate && (!/^\d{4}-\d{2}-\d{2}$/.test(workDate) || !Number.isFinite(Date.parse(`${workDate}T12:00:00Z`)) || new Date(`${workDate}T12:00:00Z`).toISOString().slice(0, 10) !== workDate)) throw new InputError('Choose a valid work date, or leave it open.')
  return {
    title: text(input.title, 'Project name', 3, 80),
    kind: choice(input.kind, projectKinds.map(kind => kind.id), 'a project type'),
    goal: text(input.goal, 'What you’ll change', 12, 600),
    site: { latitude, longitude, label: text(site.label, 'Spot name', 3, 120), feature: 'unmapped', featureName: '', nearestStreet: null },
    conditions: validateConditions(input.conditions),
    plants: selectedPlants,
    otherPlants,
    budget: Math.round(number(input.budget, 'Budget in dollars', 0, 1_000_000) * 100) / 100,
    budgetNote: text(input.budgetNote, 'Budget details', 0, 240),
    volunteersNeeded: number(input.volunteersNeeded, 'Additional volunteers', 1, 50, true),
    roles: choices(input.roles, helpRoles.map(role => role.id), 'help role', 1),
    organizerName: text(input.organizerName, 'Your name or nickname', 2, 40),
    permission,
    permissionNote,
    workDate,
    meetupNote: text(input.meetupNote, 'Meetup note', 0, 240),
    carePlan: text(input.carePlan, 'Ongoing care', 12, 400),
  }
}

export function validateJoin(value: unknown, roles: HelpRole[]): JoinInput {
  const input = object(value)
  return {
    name: text(input.name, 'Your name or nickname', 2, 40),
    role: choice(input.role, roles, 'one of the requested help roles'),
    availability: text(input.availability, 'Availability', 0, 120),
  }
}

export function localToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}
