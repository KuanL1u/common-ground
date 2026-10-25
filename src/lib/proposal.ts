import { evidence, outcomes, practices } from '../data/practices.ts'
import { scenario } from '../data/scenario.ts'
import { costsOf, selectedPractices, simulate } from './game.ts'
import type { Layout, Resource, SavedDesign } from '../types.ts'

export function createProposal(layout: Layout, savedDesign: SavedDesign | null, reflection: string, resources: Resource[]): string {
  const costs = costsOf(layout)
  const chosen = selectedPractices(layout)
  const relevant = resources.filter((resource) => resource.status !== 'inactive' && resource.practices.some((id) => chosen.includes(id))).slice(0, 6)
  const rows = scenario.checkpoints.map(({ year }) => {
    const result = simulate(layout, year)
    return `| ${year} | ${outcomes.map(({ id }) => result.scores[id]).join(' | ')} | ${result.waterShortfall} | ${result.careShortfall} |`
  })
  const comparison = savedDesign
    ? [
      '',
      '## Comparison at year 15',
      '',
      '| Outcome | Saved Design A | Current Design B |',
      '| --- | --- | --- |',
      ...outcomes.map(({ id, name }) => `| ${name} | ${simulate(savedDesign.layout, 15).scores[id]} | ${simulate(layout, 15).scores[id]} |`),
    ]
    : []
  return [
    '# Common Ground — a neighborhood conversation starter',
    '',
    `Scenario: ${scenario.name}, ${scenario.neighborhood}.`,
    'This is a fictional learning scenario, not a real property proposal or permission to change land.',
    '',
    '## Our design',
    '',
    ...practices.filter(({ id }) => chosen.includes(id)).map((practice) => `- ${practice.name}: ${layout.filter((id) => id === practice.id).length} plot(s). Tradeoff: ${practice.tradeoff}`),
    '',
    `Authored game resources: ${costs.budget}/110 budget credits; ${costs.water}/58 water units; ${costs.care}/36 care units.`,
    'These are not prices, litres, or labour-hour estimates.',
    '',
    '## What changes over time',
    '',
    'All outcomes are illustrative 0–100 indices. Higher means more of that outcome in this game, not a scientifically validated forecast.',
    '',
    '| Year | Water resilience | Shade & canopy | Living soil | Shared value | Water shortfall | Care shortfall |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows,
    '',
    'Year 5 is a dry period with 28 water units and 30 care units. Year 15 has heavy rain and 24 care units.',
    ...comparison,
    '',
    '## My reasoning',
    '',
    reflection.trim() || 'To discuss: Which tradeoff matters most? Who benefits, who maintains it, and what would we change?',
    '',
    '## Before proposing a real site',
    '',
    '- Identify the landowner, intended users, accessibility needs, and a willing community steward.',
    '- Assess soil safety, drainage, plant suitability, water access, cost, and maintenance capacity.',
    '- Speak with neighbors, especially people whose access or livelihoods could change.',
    '- Ask which planning process applies and who can receive a youth proposal.',
    '',
    'Oakland Planning Commission information: https://www.oaklandca.gov/Government/Boards-Commissions/Planning-Commission',
    'No municipal partnership, submission, or acceptance is implied. This document has not been sent anywhere.',
    '',
    '## Places to learn or participate',
    '',
    ...relevant.flatMap((resource) => [
      `### ${resource.name}`,
      resource.access,
      `${resource.action}: ${resource.url}`,
      `Public source checked ${resource.checkedAt}; not steward-confirmed. ${resource.status === 'demo-reviewed' ? 'Access information has a separate local demo review.' : ''}`.trim(),
      '',
    ]),
    '## Evidence and assumptions',
    '',
    'Practice IDs connect scenario choices to related learning and participation resources. They do not mean a resource delivers a quantified ecological benefit.',
    'Sources support causal directions. Game coefficients, maturation rates, stresses, diversity bonuses, and budgets were authored for learning and are uncalibrated.',
    'Regional land-cover references are context only. This prototype does not ingest satellite data or run a real ecological model.',
    '',
    ...evidence.map((source) => `- ${source.publisher}: ${source.title}. ${source.url}\n  ${source.note}`),
    '',
  ].join('\n')
}

export function downloadText(contents: string, filename: string, mime = 'text/markdown;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([contents], { type: mime }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
