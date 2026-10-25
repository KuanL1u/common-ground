import type { EvidenceSource, OutcomeId, Practice } from '../types.ts'

export const evidence: EvidenceSource[] = [
  {
    id: 'epa',
    title: 'Green infrastructure and community benefits',
    publisher: 'US Environmental Protection Agency',
    url: 'https://www.epa.gov/sites/default/files/2017-11/documents/greeninfrastructure_healthy_communities_factsheet.pdf',
    note: 'Supports the relationships between vegetation, shade, permeable surfaces, runoff, and community benefits. It does not validate the numbers in this game.',
  },
  {
    id: 'ebmud',
    title: 'Lawn to Garden Design Center',
    publisher: 'East Bay Municipal Utility District',
    url: 'https://www.ebmud.com/water/conservation-and-rebates/watersmart-gardener/lawn-garden-design-center',
    note: 'Local guidance on waterwise plants, soil, and garden design. Water and care costs here are authored game units, not EBMUD calculations.',
  },
  {
    id: 'anv',
    title: 'Community farming and volunteering',
    publisher: 'Acta Non Verba',
    url: 'https://anvfarm.org/get-involved/volunteer-with-us/',
    note: 'A real example of community participation through urban farming. Community-value scores are an educational assumption, not a measured social outcome.',
  },
  {
    id: 'canopy',
    title: 'Oakland Tree Canopy & Land Cover Assessment',
    publisher: 'City of Oakland',
    url: 'https://www.oaklandca.gov/files/assets/city/v/1/public-works/documents/sustainability/urban-forest-plan/oakland-land-cover-assessment-20210413_client-delivery.pdf',
    note: 'Regional context from 2018 imagery, published in 2021. This fictional block is not a mapped parcel or an assessment of a real property.',
  },
  {
    id: 'worldcover',
    title: 'ESA WorldCover data access',
    publisher: 'European Space Agency',
    url: 'https://esa-worldcover.org/en/data-access',
    note: 'A possible future regional baseline: 10 m land-cover classes. No satellite pixels or site-level predictions are used in this prototype.',
  },
]

export const practices: Practice[] = [
  {
    id: 'trees',
    name: 'Shade trees',
    shortName: 'Trees',
    description: 'Make room for a future canopy and a cooler place to gather.',
    tradeoff: 'Strong shade takes time. Young trees need water and regular care.',
    color: '#326b4c',
    softColor: '#e0eddf',
    costs: { budget: 22, water: 6, care: 3 },
    effects: { water: 4, shade: 16, soil: 5, community: 4 },
    sources: ['epa', 'ebmud'],
  },
  {
    id: 'rain',
    name: 'Rain garden',
    shortName: 'Rain garden',
    description: 'Give runoff a planted place to slow down and soak in.',
    tradeoff: 'Needs suitable soil, drainage, and upkeep. Infiltration needs a site assessment.',
    color: '#437d83',
    softColor: '#deedef',
    costs: { budget: 16, water: 4, care: 6 },
    effects: { water: 15, shade: 1, soil: 9, community: 3 },
    sources: ['epa'],
  },
  {
    id: 'food',
    name: 'Community food garden',
    shortName: 'Food garden',
    description: 'Create growing space, learning opportunities, and a shared purpose.',
    tradeoff: 'The most water- and care-intensive choice. Safe soil and community stewardship matter.',
    color: '#ae7643',
    softColor: '#f3e7d8',
    costs: { budget: 18, water: 12, care: 6 },
    effects: { water: 2, shade: 2, soil: 11, community: 14 },
    sources: ['anv', 'ebmud'],
  },
  {
    id: 'native',
    name: 'Native planting',
    shortName: 'Native plants',
    description: 'Trade a bare patch for locally suitable, diverse planting.',
    tradeoff: 'Lower ongoing water demand in this scenario; establishment and species choice still need care.',
    color: '#897246',
    softColor: '#f0ead9',
    costs: { budget: 13, water: 2, care: 3 },
    effects: { water: 8, shade: 2, soil: 12, community: 5 },
    sources: ['ebmud', 'epa'],
  },
  {
    id: 'permeable',
    name: 'Permeable path',
    shortName: 'Permeable path',
    description: 'Replace a sealed surface with a path that can let water through.',
    tradeoff: 'Little shade on its own. Accessibility, drainage, and maintenance require a real design.',
    color: '#747b6e',
    softColor: '#e8eae3',
    costs: { budget: 12, water: 0, care: 2 },
    effects: { water: 12, shade: 0, soil: 2, community: 5 },
    sources: ['epa'],
  },
]

export const practiceById = Object.fromEntries(practices.map((practice) => [practice.id, practice])) as Record<
  Practice['id'],
  Practice
>

export const outcomes: { id: OutcomeId; name: string; explanation: string; color: string }[] = [
  { id: 'water', name: 'Water resilience', explanation: 'How well the design handles dry periods and runoff.', color: '#437d83' },
  { id: 'shade', name: 'Shade & canopy', explanation: 'Space sheltered by growing trees and vegetation.', color: '#326b4c' },
  { id: 'soil', name: 'Living soil', explanation: 'Opportunities for planted, permeable, cared-for soil.', color: '#ad794d' },
  { id: 'community', name: 'Shared value', explanation: 'Illustrative opportunities to gather, grow, and learn.', color: '#897246' },
]
