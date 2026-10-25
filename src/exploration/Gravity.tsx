import { useState } from 'react'
import { ArrowRight, Flower2, Minus, Plus, Sprout } from 'lucide-react'
import { GardenLabArt, SharingArt } from './GardenArt.tsx'
import { Indicators, LessonFrame, LessonHeading, Reasoning, SaveDiscovery, TokenBudget } from './LessonUI.tsx'
import type { LessonProps } from './LessonUI.tsx'
import { basketsUsed, compareGarden, compareSharing, defaultGarden, defaultSharing, GARDEN_BUDGET, gardenChoiceError, gardenCosts, gardenPlants, HARVEST_BASKETS, sharingChoiceError, sharingGroups, simulateGarden, simulateSharing } from './model.ts'
import type { GardenChoice, GardenPlant, SharingChoice } from './types.ts'

export function HabitatLesson({ state, onUpdate, onComplete, onNext }: LessonProps) {
  const choice = state.garden ?? defaultGarden
  const [plant, setPlant] = useState<GardenPlant | null>('flowers')
  const [year, setYear] = useState<0 | 5>(0)
  const [run, setRun] = useState<GardenChoice | null>(null)
  const [comparing, setComparing] = useState(false)
  const [reason, setReason] = useState(state.entries.habitat?.reasoning ?? '')
  const [error, setError] = useState('')
  const result = run ? simulateGarden(run, year) : null
  const comparison = run && state.savedGarden ? compareGarden(state.savedGarden, run, year) : null
  const plantPatch = (index: number) => {
    const next = { plots: choice.plots.map((value, i) => i === index ? plant : value) }
    const invalid = gardenChoiceError(next)
    if (invalid) { setError(invalid); return }
    onUpdate({ garden: next }); setRun(null); setComparing(false); setError('')
  }
  const ready = Boolean(comparing && comparison?.different && reason.trim().length >= 12)
  return <LessonFrame art={<GardenLabArt choice={choice} plant={plant} year={year} grown={Boolean(run)} onPlant={plantPatch} />} className="garden-lesson">
    <LessonHeading id="habitat" completed={Boolean(state.entries.habitat)} />
    <p className="lesson-intro">Grow food and habitat within your water and care limits.</p>
    <TokenBudget {...gardenCosts(choice)} limits={GARDEN_BUDGET} />
    <fieldset className="lesson-controls"><legend>Pick a plant</legend><div className="plant-palette">{(Object.entries(gardenPlants) as [GardenPlant, typeof gardenPlants[GardenPlant]][]).map(([id, item]) => <button key={id} aria-pressed={plant === id} className={plant === id ? 'active' : ''} onClick={() => setPlant(id)}><strong>{item.name}</strong><small>{item.credits} credits · {item.care} care · {item.water} water</small></button>)}<button aria-pressed={plant === null} className={plant === null ? 'active' : ''} onClick={() => setPlant(null)}><strong>Open space</strong><small>Uses no tokens</small></button></div></fieldset>
    <fieldset className="lesson-controls"><legend>Tap a patch</legend><div className="patch-choices">{choice.plots.map((value, i) => <button key={i} onClick={() => plantPatch(i)} aria-label={`Garden patch ${i + 1}: ${value ? gardenPlants[value].name : 'Open space'}`}><span>0{i + 1}</span>{value ? gardenPlants[value].name : 'Open space'}<Plus size={12} /></button>)}</div></fieldset>
    <fieldset className="lesson-controls"><legend>Time</legend><div className="choice-segments">{([0, 5] as const).map(value => <button key={value} className={year === value ? 'active' : ''} aria-pressed={year === value} onClick={() => { setYear(value); setRun(null); setComparing(false) }}>{value === 0 ? 'Today' : 'Year 5'}</button>)}</div></fieldset>
    {error && <p className="lesson-error" role="alert">{error}</p>}
    <button className="button button-primary" onClick={() => { setRun({ plots: [...choice.plots] }); setComparing(false) }}><Flower2 size={16} />Grow <ArrowRight size={15} /></button>
    {result ? <div className="experiment-feedback" aria-live="polite"><Indicators items={[{ name: 'Food', value: result.food, color: '#c9a26c' }, { name: 'Pollinators', value: result.pollinators, color: '#b69bac' }, { name: 'Soil cover', value: result.cover }]} /><p className="causal-note">Vegetables favor food; flowers favor pollinators. Elder takes time and care.</p><div className="experiment-actions"><button className="button button-secondary button-small" onClick={() => { onUpdate({ savedGarden: { plots: [...run!.plots] } }); setComparing(false) }}>Save A</button><button className="text-button" disabled={!state.savedGarden} onClick={() => setComparing(true)}>Compare A & B <ArrowRight size={13} /></button></div></div> : <p className="lesson-hint">Grow → save A → change a patch → compare.</p>}
    {comparing && comparison && <div className="mini-comparison" aria-live="polite"><h3>A & B · same time and limits</h3><p>{year === 0 ? 'Today' : 'Year 5'}, with ongoing care.</p><table><caption>Game indicators</caption><thead><tr><th>Result</th><th>A</th><th>B</th></tr></thead><tbody>{([['Food', comparison.a.food, comparison.b.food], ['Pollinators', comparison.a.pollinators, comparison.b.pollinators], ['Soil cover', comparison.a.cover, comparison.b.cover]] as const).map(([name, a, b]) => <tr key={name}><th>{name}</th><td>{a}</td><td>{b}</td></tr>)}<tr><th>Credits / care / water</th><td>{comparison.a.costs.credits} / {comparison.a.costs.care} / {comparison.a.costs.water}</td><td>{comparison.b.costs.credits} / {comparison.b.costs.care} / {comparison.b.costs.water}</td></tr></tbody></table>{!comparison.different && <p className="lesson-hint">Same plant mix. Try another kind or amount.</p>}</div>}
    {comparing && comparison?.different && <Reasoning value={reason} onChange={setReason} label="What improved? What did you give up?" />}
    <SaveDiscovery id="habitat" state={state} ready={ready} onSave={() => onComplete('habitat', `At ${year === 0 ? 'year zero' : 'year five'}, garden A had food/pollinator indicators ${comparison!.a.food}/${comparison!.a.pollinators}; garden B had ${comparison!.b.food}/${comparison!.b.pollinators}. Both used the same resource allowance and time.`, reason.trim())} />
    <details className="lesson-details"><summary>About the experiment</summary><p>Plants, tokens, and outcomes are a learning example, not Gravity Garden’s planting plan. Gravity Garden’s native elder care inspired this activity.</p></details>
    {state.entries.habitat && <button className="text-button" onClick={() => onNext('sharing')}>Explore the pantry <ArrowRight size={14} /></button>}
  </LessonFrame>
}

export function SharingLesson({ state, onUpdate, onComplete, onNext }: LessonProps) {
  const choice = state.sharing ?? defaultSharing
  const [run, setRun] = useState<SharingChoice | null>(null)
  const [comparing, setComparing] = useState(false)
  const [reason, setReason] = useState(state.entries.sharing?.reasoning ?? '')
  const [error, setError] = useState('')
  const result = run ? simulateSharing(run) : null
  const comparison = run && state.savedSharing ? compareSharing(state.savedSharing, run) : null
  const commit = (id: keyof SharingChoice, change: number) => {
    const next = { ...choice, [id]: choice[id] + change }
    const invalid = sharingChoiceError(next)
    if (invalid) { setError(invalid); return }
    onUpdate({ sharing: next }); setRun(null); setComparing(false); setError('')
  }
  const ready = Boolean(comparing && comparison?.different && reason.trim().length >= 12)
  return <LessonFrame art={<SharingArt choice={choice} onGive={id => commit(id, 1)} />} className="sharing-lesson">
    <LessonHeading id="sharing" completed={Boolean(state.entries.sharing)} />
    <p className="lesson-intro">8 baskets. 9 requested. Try sharing, then listen to your neighbors.</p>
    <div className="harvest-budget"><Sprout size={19} /><strong>{basketsUsed(choice)}/{HARVEST_BASKETS} baskets offered</strong><span>{HARVEST_BASKETS - basketsUsed(choice)} left to share</span></div>
    <div className="sharing-controls">{sharingGroups.map(group => <div key={group.id}><div><strong>{group.name}</strong><small>Requests {group.requested} baskets</small></div><div className="basket-stepper"><button aria-label={`Take a basket back from ${group.name}`} disabled={choice[group.id] === 0} onClick={() => commit(group.id, -1)}><Minus size={14} /></button><output aria-label={`${group.name} allocation`}>{choice[group.id]}</output><button aria-label={`Give a basket to ${group.name}`} disabled={choice[group.id] === group.requested} onClick={() => commit(group.id, 1)}><Plus size={14} /></button></div></div>)}</div>
    {error && <p className="lesson-error" role="alert">{error}</p>}
    <button className="button button-primary" onClick={() => { setRun({ ...choice }); setComparing(false) }}>Try sharing <ArrowRight size={15} /></button>
    {result ? <div className="experiment-feedback" aria-live="polite"><div className="harvest-result"><strong>{result.unmet} requested {result.unmet === 1 ? 'basket remains' : 'baskets remain'} unfilled.</strong><p>{result.groups.filter(group => group.unmet > 0).map(group => `${group.name}: ${group.unmet} still requested`).join(' · ')}{result.remaining > 0 ? ` · ${result.remaining} baskets are still unallocated.` : ''}</p></div><p className="causal-note">Someone still needs a basket. Ask neighbors about needs and alternatives.</p><div className="experiment-actions"><button className="button button-secondary button-small" onClick={() => { onUpdate({ savedSharing: { ...run! } }); setComparing(false) }}>Save A</button><button className="text-button" disabled={!state.savedSharing} onClick={() => setComparing(true)}>Compare A & B <ArrowRight size={13} /></button></div></div> : <p className="lesson-hint">Try it → save A → move a basket → compare.</p>}
    {comparing && comparison && <div className="mini-comparison" aria-live="polite"><h3>A & B · same harvest</h3><p>Same 8 baskets. Same 9 requests.</p><table><caption>Baskets offered / requested</caption><thead><tr><th>Group</th><th>A</th><th>B</th></tr></thead><tbody>{sharingGroups.map(group => <tr key={group.id}><th>{group.name}</th><td>{state.savedSharing![group.id]} / {group.requested}</td><td>{run![group.id]} / {group.requested}</td></tr>)}<tr><th>Unfilled requests</th><td>{comparison.a.unmet}</td><td>{comparison.b.unmet}</td></tr></tbody></table>{!comparison.different && <p className="lesson-hint">Same sharing. Move a basket.</p>}</div>}
    {comparing && comparison?.different && <Reasoning value={reason} onChange={setReason} label="Who gains? Who would you ask?" />}
    <SaveDiscovery id="sharing" state={state} ready={ready} onSave={() => onComplete('sharing', `With the same eight-basket harvest, A offered ${sharingGroups.map(group => state.savedSharing![group.id]).join('/')} to households/shared meal/volunteer day; B offered ${sharingGroups.map(group => run![group.id]).join('/')}. Unfilled requests were ${comparison!.a.unmet} and ${comparison!.b.unmet}.`, reason.trim())} />
    <details className="lesson-details"><summary>About the experiment</summary><p>A fictional harvest. Real pantry decisions belong to stewards and neighbors.</p></details>
    {state.entries.sharing && <button className="text-button" onClick={() => onNext(null)}>Look around <ArrowRight size={14} /></button>}
  </LessonFrame>
}
