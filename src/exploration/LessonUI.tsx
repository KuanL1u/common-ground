import type { ReactNode } from 'react'
import { ArrowRight, BookOpen, Check, Coins, Droplet, HandHeart, Sprout } from 'lucide-react'
import { hotspots } from './content.ts'
import type { ExplorationState, HotspotId } from './types.ts'

export type SaveEntry = (id: HotspotId, observation: string, reasoning: string) => void
export type Update = (patch: Partial<ExplorationState>) => void
export type LessonProps = { state: ExplorationState; onUpdate: Update; onComplete: SaveEntry; onNext: (id: HotspotId | null) => void }

export function LessonHeading({ id, completed }: { id: HotspotId; completed: boolean }) {
  return <div className="lesson-heading">{completed && <span className="eyebrow"><Check size={16} />Saved</span>}<h2>{hotspots[id].title}</h2></div>
}
export function LessonFrame({ art, children, className = '' }: { art: ReactNode; children: ReactNode; className?: string }) {
  return <div className={`place-layout ${className}`}><div className="place-canvas-wrap"><div className="place-canvas">{art}</div><div className="scene-caption"><Sprout size={16} />Learning illustration</div></div><aside className="lesson-panel">{children}</aside></div>
}
export function Indicators({ items }: { items: { name: string; value: number; color?: string }[] }) {
  return <div className="lesson-indicators" aria-label="Illustrative experiment results">{items.map(item => <div key={item.name}><span>{item.name}</span><strong>{item.value}<small>/100</small></strong><i><b style={{ width: `${item.value}%`, background: item.color ?? '#7e9e66' }} /></i></div>)}<p>Relative game indicators</p></div>
}
export function TokenBudget({ credits, care, water, park = false, limits }: { credits: number; care: number; water?: number; park?: boolean; limits?: { credits: number; care: number; water: number } }) {
  return <div className="lesson-budget" aria-label="Resources used"><span><Coins size={14} /><strong>{credits}/{limits?.credits ?? (park ? 6 : 4)}</strong> credits</span><span><HandHeart size={14} /><strong>{care}/{limits?.care ?? (park ? 2 : 3)}</strong> care</span>{water !== undefined && <span><Droplet size={14} /><strong>{water}/{limits?.water ?? 6}</strong> water</span>}</div>
}
export function SaveDiscovery({ id, state, ready, onSave, children }: { id: HotspotId; state: ExplorationState; ready: boolean; onSave: () => void; children?: ReactNode }) {
  return <div className="collect-discovery">{children}<button className="button button-primary" disabled={!ready} onClick={onSave}><BookOpen size={18} />{state.entries[id] ? 'Update note' : 'Save discovery'}<ArrowRight size={17} /></button></div>
}
export function Reasoning({ value, onChange, label = 'What changed? What’s the tradeoff?' }: { value: string; onChange: (text: string) => void; label?: string }) {
  return <label className="lesson-reflection">{label}<textarea rows={2} maxLength={600} value={value} onChange={event => onChange(event.target.value)} placeholder="I noticed… because…" /><small>One sentence · 12+ characters</small></label>
}
