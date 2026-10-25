import assert from 'node:assert/strict'
import test from 'node:test'
import { initialResources } from '../data/resources.ts'
import { emptyLayout, exampleLayout } from '../data/scenario.ts'
import { filterResources, makeSuggestion, reviewSuggestion, safePublicUrl } from './directory.ts'
import { baselineAt, costsOf, placePractice, simulate, validLayout } from './game.ts'
import { createProposal } from './proposal.ts'
import { initialState, restoreState } from './storage.ts'
import type { Layout } from '../types.ts'

test('a rejected move leaves a valid design unchanged, including protected plots', () => {
  const original = emptyLayout()
  assert.equal(placePractice(original, 0, 'food').layout, original)
  let layout = original
  for (const index of [1, 2, 3, 5, 6]) layout = placePractice(layout, index, 'trees').layout
  assert.equal(costsOf(layout).budget, 110)
  const rejected = placePractice(layout, 7, 'native')
  assert.equal(rejected.layout, layout)
  assert.match(rejected.error!, /budget/)
  assert.deepEqual(original, emptyLayout())
  const removed = placePractice(layout, 1, null)
  assert.equal(costsOf(removed.layout).budget, 88)
})

test('time and drought create a real tradeoff; comparison always uses the same checkpoint', () => {
  const treeLayout = emptyLayout()
  treeLayout[1] = 'trees'
  assert.ok(simulate(treeLayout, 15).scores.shade > simulate(treeLayout, 0).scores.shade)
  const thirsty = emptyLayout()
  for (const index of [1, 2, 3, 5]) thirsty[index] = 'food'
  const dry = simulate(thirsty, 5)
  assert.equal(dry.waterShortfall, 20)
  assert.ok(dry.scores.community < simulate(thirsty, 15).scores.community)
  const mixed = exampleLayout()
  assert.deepEqual(simulate(mixed, 5), simulate([...mixed], 5))
  assert.ok(simulate(mixed, 15).scores.water > baselineAt(15).scores.water)
  assert.equal(simulate(mixed, 5).waterShortfall, 0)
})

test('water and care allowances independently reject a plan that still has budget room', () => {
  let food = emptyLayout()
  for (const index of [1, 2, 3, 5]) food = placePractice(food, index, 'food').layout
  const thirsty = placePractice(food, 6, 'food')
  assert.equal(thirsty.layout, food)
  assert.match(thirsty.error!, /water units/)
  let rain = emptyLayout()
  for (const index of [1, 2, 3, 5, 6, 7]) rain = placePractice(rain, index, 'rain').layout
  assert.equal(costsOf(rain).budget, 96)
  const maintenance = placePractice(rain, 8, 'permeable')
  assert.equal(maintenance.layout, rain)
  assert.match(maintenance.error!, /care units/)
})

test('untrusted saved layouts cannot inject practices or override protected plots', () => {
  assert.equal(validLayout(['trees']), false)
  const invalid = emptyLayout() as unknown as string[]
  invalid[1] = 'unknown'
  assert.equal(validLayout(invalid), false)
  const protectedLayout = emptyLayout()
  protectedLayout[0] = 'trees'
  assert.equal(validLayout(protectedLayout), false)
  const excessive = Array(20).fill('food') as Layout
  for (const index of [0, 4, 19]) excessive[index] = null
  assert.equal(validLayout(excessive), false)
})

test('pending corrections never change a listing; only an explicit review applies them', () => {
  const resource = initialResources[0]
  const created = makeSuggestion(resource, {
    field: 'access',
    after: 'Use the published volunteer application before arranging a visit.',
    sourceUrl: resource.sourceUrl,
    note: 'Clarify the first step.',
  })
  assert.ok(created.suggestion)
  assert.equal(created.suggestion!.status, 'pending')
  assert.equal(resource.access, initialResources[0].access)
  const approved = reviewSuggestion(initialResources, [created.suggestion!], created.suggestion!.id, 'approved')
  assert.equal(approved.resources[0].access, created.suggestion!.after)
  assert.equal(approved.resources[0].status, 'demo-reviewed')
  assert.equal(approved.resources[0].checkedAt, resource.checkedAt)
  assert.equal(approved.suggestions[0].status, 'approved')
  const duplicate = reviewSuggestion(approved.resources, approved.suggestions, created.suggestion!.id, 'approved')
  assert.ok(duplicate.error)
})

test('stale corrections cannot overwrite a newer review; declining preserves the directory', () => {
  const resource = initialResources[0]
  const first = makeSuggestion(resource, { field: 'access', after: 'First revised access information, with a source.', sourceUrl: resource.sourceUrl, note: '' }).suggestion!
  const second = makeSuggestion(resource, { field: 'access', after: 'Second revised access information, with a source.', sourceUrl: resource.sourceUrl, note: '' }).suggestion!
  const accepted = reviewSuggestion(initialResources, [first, second], first.id, 'approved')
  const stale = reviewSuggestion(accepted.resources, accepted.suggestions, second.id, 'approved')
  assert.match(stale.error!, /changed/)
  const declined = reviewSuggestion(accepted.resources, accepted.suggestions, second.id, 'declined')
  assert.equal(declined.resources, accepted.resources)
  assert.equal(declined.suggestions[1].status, 'declined')
})

test('unsafe source links and edited saved geography are rejected', () => {
  for (const value of ['javascript:alert(1)', 'file:///etc/passwd', 'https://user:secret@example.org', 'not a URL']) {
    assert.equal(safePublicUrl(value), false)
  }
  assert.equal(safePublicUrl('https://example.org/source'), true)
  const state = initialState()
  const online = state.resources.findIndex(resource => resource.id === 'ebmud-design')
  state.resources[online] = { ...state.resources[online], coordinates: [37, -122], url: 'javascript:alert(1)' }
  const restored = restoreState(JSON.stringify(state))
  assert.equal(restored.resources[online].coordinates, undefined)
  assert.equal(restored.resources[online].url, initialResources[online].url)
  assert.deepEqual(restoreState('{bad json'), initialState())
})

test('inactive resources stay out of discovery and online resources are not plotted', () => {
  const resources = initialResources.map(resource => resource.neighborhood === 'West Oakland' ? { ...resource, status: 'inactive' as const } : resource)
  assert.equal(filterResources(resources, { search: 'West Oakland' }).length, 0)
  assert.ok(filterResources(resources, { city: 'Berkeley', practices: ['native'] }).length > 0)
  assert.equal(initialResources.find(({ id }) => id === 'ebmud-design')!.coordinates, undefined)
})

test('the exported proposal includes explicit assumptions, time comparisons, and actual participation links', () => {
  const proposal = createProposal(exampleLayout(), { name: 'Design A', layout: emptyLayout() }, 'I chose a mix that needs less water.', initialResources)
  assert.match(proposal, /not a scientifically validated forecast/)
  assert.match(proposal, /Comparison at year 15/)
  assert.match(proposal, /anvfarm\.org/)
  assert.match(proposal, /I chose a mix/)
  assert.match(proposal, /has not been sent anywhere/)
})
