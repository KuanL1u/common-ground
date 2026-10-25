import { Carrot, Flower2, Footprints, TreeDeciduous, Waves } from 'lucide-react'
import type { PracticeId } from '../types.ts'

const icons = { trees: TreeDeciduous, rain: Waves, food: Carrot, native: Flower2, permeable: Footprints }

export function PracticeIcon({ id, size = 20, className }: { id: PracticeId; size?: number; className?: string }) {
  const Icon = icons[id]
  return <Icon size={size} strokeWidth={1.7} className={className} aria-hidden="true" />
}
