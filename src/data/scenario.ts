import type { Layout, Scenario } from '../types.ts'

export const scenario: Scenario = {
  id: 'west-oakland-shared-block',
  name: 'The shared block',
  neighborhood: 'West Oakland · illustrative scenario',
  description:
    'Imagine a neighborhood space with a community hall, two existing trees, and patches of paving and dry grass. What would you change, and who would care for it?',
  columns: 5,
  rows: 4,
  fixedPlots: { 0: 'hall', 4: 'existing-tree', 19: 'existing-tree' },
  pavement: [1, 2, 3, 6, 7, 8, 11, 12, 13, 17],
  budgets: { budget: 110, water: 58, care: 36 },
  checkpoints: [
    { year: 0, title: 'Plant the possibility', subtitle: 'New roots. Small beginnings.', water: 58, care: 36 },
    { year: 5, title: 'A long, dry summer', subtitle: 'Water is tighter. Your choices are tested.', water: 28, care: 30 },
    { year: 15, title: 'The rain returns', subtitle: 'A heavy storm. Less time for upkeep.', water: 58, care: 24 },
  ],
}

export const emptyLayout = (): Layout => Array<null>(scenario.columns * scenario.rows).fill(null)

export const exampleLayout = (): Layout => {
  const layout = emptyLayout()
  layout[1] = 'trees'
  layout[5] = 'native'
  layout[7] = 'rain'
  layout[10] = 'food'
  layout[12] = 'permeable'
  layout[15] = 'native'
  return layout
}
