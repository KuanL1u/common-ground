import { evidence, hotspotOrder, placeById, places } from './content.ts'
import { compareFarm, compareGarden, compareSharing, simulatePark } from './model.ts'
import { formatSourceDate } from '../lib/dates.ts'
import type { ExplorationState } from './types.ts'

export function createFieldJournal(state: ExplorationState): string {
  const entries = hotspotOrder.flatMap(id => {
    const entry = state.entries[id]
    return entry ? [
      `### ${entry.title} — ${placeById[entry.place].name}`,
      '', entry.observation, '', `My explanation: ${entry.reasoning}`, '',
    ] : []
  })
  const farm = state.savedFarm ? compareFarm(state.savedFarm, { choice: state.farm, weather: 'dry', time: 'season' }) : null
  const parkA = state.savedPark ? simulatePark(state.savedPark, 5) : null
  const parkB = simulatePark(state.park, 5)
  const garden = state.savedGarden ? compareGarden(state.savedGarden, state.garden, 5) : null
  const sharing = state.savedSharing ? compareSharing(state.savedSharing, state.sharing) : null
  return [
    '# Common Ground — my Oakland field journal',
    '',
    'A cartoon exploration of real community places, with authored environmental learning experiments.',
    'The experiments are illustrative, not measurements or forecasts for these sites. This document has not been submitted to anyone.',
    '',
    `Discoveries collected: ${Object.keys(state.entries).length} of ${hotspotOrder.length}.`,
    '',
    '## My discoveries', '', ...entries,
    '## My neighborhood idea', '',
    `Priority: ${state.idea.priority}.`,
    `Starting approach: ${state.idea.choice === 'care' ? 'Care for existing green spaces' : 'Explore a new shaded growing space'}.`,
    '', state.idea.proposal.trim() || 'I am still gathering ideas.',
    '', `Tradeoff: ${state.idea.tradeoff.trim() || 'To discuss.'}`,
    '', `A question before acting: ${state.idea.question.trim() || 'Who owns the space, who uses it, and who can care for it?'}`,
    '',
    '## Comparisons under the same conditions', '',
    ...(farm ? [
      'Demonstration beds: both alternatives are rerun in the same later-season dry period.',
      '| Indicator (game units) | Saved approach A | Current approach B |',
      '| --- | --- | --- |',
      `| Water tokens | ${farm.a.costs.water} | ${farm.b.costs.water} |`,
      `| Moisture | ${farm.a.moisture} | ${farm.b.moisture} |`,
      `| Soil condition | ${farm.a.soil} | ${farm.b.soil} |`,
      '',
    ] : ['No farm comparison saved yet.', '']),
    ...(parkA ? [
      'Hypothetical gathering space: both alternatives at year five.',
      '| Indicator (game units) | Saved approach A | Current approach B |',
      '| --- | --- | --- |',
      `| Shade | ${parkA.shade} | ${parkB.shade} |`,
      `| Living habitat | ${parkA.habitat} | ${parkB.habitat} |`,
      `| Credits | ${parkA.credits} | ${parkB.credits} |`, '',
    ] : []),
    ...(garden ? [
      'Fictional garden patches: both alternatives at year five, with continuing care and the same resource allowance.',
      '| Indicator (game units) | Saved garden A | Current garden B |',
      '| --- | --- | --- |',
      `| Food potential | ${garden.a.food} | ${garden.b.food} |`,
      `| Pollinator support | ${garden.a.pollinators} | ${garden.b.pollinators} |`,
      `| Soil cover | ${garden.a.cover} | ${garden.b.cover} |`,
      `| Credits / care / water | ${garden.a.costs.credits}/${garden.a.costs.care}/${garden.a.costs.water} | ${garden.b.costs.credits}/${garden.b.costs.care}/${garden.b.costs.water} |`, '',
    ] : []),
    ...(sharing ? [
      'Fictional sharing choices: the same eight-basket harvest and the same requests.',
      '| Baskets offered / requested | Saved sharing A | Current sharing B |',
      '| --- | --- | --- |',
      ...sharing.a.groups.map((group, i) => `| ${group.name} | ${group.allocated}/${group.requested} | ${sharing.b.groups[i].allocated}/${group.requested} |`), '',
    ] : []),
    '## Real places and possible next steps', '',
    ...places.flatMap(place => [
      `### ${place.name}`, `${place.address} — ${place.neighborhood}`, place.fact,
      `${place.action}: ${place.actionUrl}`,
      `Source checked ${formatSourceDate(place.checkedAt)}: ${place.source}`, '',
    ]),
    'Schedules, access, age eligibility, and availability must be confirmed with each provider. Source checks are not steward approval or a partnership.',
    '',
    'Oakland planning information: https://www.oaklandca.gov/Government/Boards-Commissions/Planning-Commission',
    'Before proposing a real change, identify a willing steward and an appropriate planning process/recipient. Ask about ownership, soil safety, drainage, accessibility, water, costs, and long-term care.',
    '',
    '## Evidence and authored assumptions', '',
    'Rain tests partition 100 illustrative drops into infiltration, runoff, and surface water. Dry-period tests use authored retention and delivery factors. Trees use authored year-zero/year-five growth and care factors. Budget/care/water tokens and all 0–100 indicators are uncalibrated game values.',
    'The garden experiment assigns different food, pollinator, and cover factors to vegetables, native flowers, and native elder. It allows four patches, 8 credits, 5 care, and 6 water tokens. Sharing uses eight fictional baskets against nine requested; it makes no claims about pantry policy, actual harvests, or how many people are fed.',
    'The illustrated layout, characters, experiments, and library desk are fictional. Real place listings remain separate from experimental outcomes.',
    ...evidence.map(source => `- ${source.publisher}: ${source.title}. ${source.url}\n  ${source.note}`),
    '',
  ].join('\n')
}
