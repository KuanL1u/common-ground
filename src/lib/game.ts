import { practices, practiceById } from '../data/practices.ts'
import { emptyLayout, scenario } from '../data/scenario.ts'
import type { Checkpoint, Costs, Layout, OutcomeId, PracticeId, Simulation } from '../types.ts'

const practiceIds = new Set(practices.map(({ id }) => id))
const outcomeIds: OutcomeId[] = ['water', 'shade', 'soil', 'community']

export function validLayout(value: unknown): value is Layout {
  return (
    Array.isArray(value) &&
    value.length === scenario.columns * scenario.rows &&
    value.every((item, index) => {
      if (index in scenario.fixedPlots) return item === null
      return item === null || (typeof item === 'string' && practiceIds.has(item as PracticeId))
    }) &&
    withinBudget(value as Layout)
  )
}

export function costsOf(layout: Layout): Costs {
  return layout.reduce<Costs>(
    (total, id) => {
      if (!id) return total
      const costs = practiceById[id].costs
      return { budget: total.budget + costs.budget, water: total.water + costs.water, care: total.care + costs.care }
    },
    { budget: 0, water: 0, care: 0 },
  )
}

export function withinBudget(layout: Layout): boolean {
  const costs = costsOf(layout)
  return (Object.keys(costs) as (keyof Costs)[]).every((key) => costs[key] <= scenario.budgets[key])
}

export function placePractice(
  layout: Layout,
  index: number,
  practice: PracticeId | null,
): { layout: Layout; error?: string } {
  if (!Number.isInteger(index) || index < 0 || index >= layout.length) {
    return { layout, error: 'Choose a plot inside the block.' }
  }
  if (index in scenario.fixedPlots) {
    return { layout, error: 'The community hall and existing trees stay. Choose an open plot.' }
  }
  if (practice !== null && !practiceIds.has(practice)) return { layout, error: 'Choose a practice from the palette.' }
  if (layout[index] === practice) return { layout }
  const next = [...layout]
  next[index] = practice
  const costs = costsOf(next)
  if (costs.budget > scenario.budgets.budget) {
    return { layout, error: 'That exceeds your 110-credit budget. Remove or replace another improvement.' }
  }
  if (costs.water > scenario.budgets.water) {
    return { layout, error: 'That needs more than 58 water units. Try a less thirsty mix.' }
  }
  if (costs.care > scenario.budgets.care) {
    return { layout, error: 'That needs more than 36 care units. Leave room for upkeep.' }
  }
  return { layout: next }
}

export const selectedPractices = (layout: Layout): PracticeId[] => practices.filter((p) => layout.includes(p.id)).map((p) => p.id)
export const improvementCount = (layout: Layout) => layout.filter(Boolean).length

// These are authored educational rules. Sources support directions of effects,
// not coefficients, magnitudes, time-to-maturity, or a real site's forecast.
export function simulate(layout: Layout, year: Checkpoint): Simulation {
  const checkpoint = scenario.checkpoints.find((item) => item.year === year)!
  const costs = costsOf(layout)
  const waterShortfall = Math.max(0, costs.water - checkpoint.water)
  const careShortfall = Math.max(0, costs.care - checkpoint.care)
  const waterStress = waterShortfall / Math.max(costs.water, 1)
  const careStress = careShortfall / Math.max(costs.care, 1)
  const baseline: Record<Checkpoint, Record<OutcomeId, number>> = {
    0: { water: 24, shade: 13, soil: 22, community: 30 },
    5: { water: 16, shade: 18, soil: 19, community: 30 },
    15: { water: 19, shade: 24, soil: 20, community: 28 },
  }
  const scores = { ...baseline[year] }
  const waterSensitivity: Record<PracticeId, number> = { trees: 0.35, rain: 0.35, food: 0.85, native: 0.2, permeable: 0 }
  const growth: Record<PracticeId, Record<Checkpoint, number>> = {
    trees: { 0: 0.2, 5: 0.65, 15: 1 },
    rain: { 0: 0.85, 5: 1, 15: 1 },
    food: { 0: 0.65, 5: 1, 15: 1 },
    native: { 0: 0.55, 5: 1, 15: 1 },
    permeable: { 0: 1, 5: 1, 15: 1 },
  }
  for (const id of layout) {
    if (!id) continue
    const factor = growth[id][year] * (1 - waterStress * waterSensitivity[id]) * (1 - careStress * 0.6)
    for (const outcome of outcomeIds) {
      const stormBonus = year === 15 && outcome === 'water' && (id === 'rain' || id === 'permeable') ? 1.16 : 1
      scores[outcome] += practiceById[id].effects[outcome] * factor * stormBonus
    }
  }
  const diversity = selectedPractices(layout).length
  if (diversity >= 3) {
    scores.soil += 3
    scores.community += 4
  }
  for (const outcome of outcomeIds) scores[outcome] = Math.min(100, Math.max(0, Math.round(scores[outcome])))
  const insights: string[] = []
  if (!improvementCount(layout)) {
    insights.push('The unchanged block is your baseline. Add a practice to see a different future.')
  } else {
    if (year === 0 && layout.includes('trees')) insights.push('New trees start small. Their shade grows at later checkpoints.')
    if (waterShortfall) insights.push(`Your design needs ${waterShortfall} more water units than this dry period allows. Food-growing benefits are affected most.`)
    else if (year === 5) insights.push('Your design stays within the dry-period water allowance.')
    if (careShortfall) insights.push(`Upkeep exceeds the available care by ${careShortfall} units. Unmaintained features deliver less in this scenario.`)
    if (year === 15 && (layout.includes('rain') || layout.includes('permeable'))) insights.push('During heavy rain, rain gardens and permeable paths get a larger water-resilience contribution.')
    if (diversity >= 3) insights.push('A mix of at least three practices earns a small soil and shared-value bonus.')
    if (year === 15 && layout.includes('trees')) insights.push('The trees have reached the game’s full canopy contribution. A real tree’s growth would depend on species and conditions.')
  }
  return { year, scores, costs, waterShortfall, careShortfall, diversity, insights: insights.slice(0, 3) }
}

export function baselineAt(year: Checkpoint): Simulation {
  return simulate(emptyLayout(), year)
}
