import { ArrowRight, BookOpen, Check, CloudRain, CloudSun, Coins, Droplet, Eraser, HandHeart, Info, MapPin, RotateCcw, Undo2 } from 'lucide-react'
import type { CSSProperties } from 'react'
import { outcomes, practices, practiceById } from '../data/practices.ts'
import { scenario } from '../data/scenario.ts'
import { baselineAt, costsOf, improvementCount, simulate } from '../lib/game.ts'
import { BlockScene } from './BlockScene.tsx'
import { PracticeIcon } from './PracticeIcon.tsx'
import type { Checkpoint, Layout, PracticeId, SavedDesign } from '../types.ts'

export function Timeline({ year, onChange, compact = false }: { year: Checkpoint; onChange: (year: Checkpoint) => void; compact?: boolean }) {
  return <div className={`timeline ${compact ? 'timeline-compact' : ''}`} role="group" aria-label="Simulated time checkpoint">
    {scenario.checkpoints.map((checkpoint) => <button key={checkpoint.year} className={`time-stop ${year === checkpoint.year ? 'active' : ''}`} onClick={() => onChange(checkpoint.year)} aria-pressed={year === checkpoint.year}>
      <span className="time-dot">{checkpoint.year === 0 ? <span /> : checkpoint.year === 5 ? <CloudSun size={17} /> : <CloudRain size={17} />}</span>
      <span className="time-year">Year {checkpoint.year}</span>
      {!compact && <span className="time-caption">{checkpoint.year === 0 ? 'Plant' : checkpoint.year === 5 ? 'Drought' : 'Heavy rain'}</span>}
    </button>)}
  </div>
}

function BudgetBar({ layout }: { layout: Layout }) {
  const costs = costsOf(layout)
  const budgets = [
    { key: 'budget' as const, label: 'Budget', unit: 'credits', icon: Coins },
    { key: 'water' as const, label: 'Water', unit: 'units', icon: Droplet },
    { key: 'care' as const, label: 'Care', unit: 'units', icon: HandHeart },
  ]
  return <div className="budget-bar" aria-label="Planning resource use">
    {budgets.map(({ key, label, unit, icon: Icon }) => <div className="budget-item" key={key}>
      <div className="budget-label"><Icon size={17} strokeWidth={1.7} />{label}<span><strong>{scenario.budgets[key] - costs[key]}</strong> left</span></div>
      <div className="budget-track"><span style={{ width: `${costs[key] / scenario.budgets[key] * 100}%` }} /></div>
      <span className="budget-detail">{costs[key]} of {scenario.budgets[key]} {unit} used</span>
    </div>)}
  </div>
}

export function Game({
  layout, year, tool, savedDesign, canUndo, onTool, onPlace, onYear, onUndo, onReset, onExample, onSave, onCompare, onSources, onExplore, onProposal,
}: {
  layout: Layout; year: Checkpoint; tool: PracticeId | 'remove'; savedDesign: SavedDesign | null; canUndo: boolean
  onTool: (id: PracticeId | 'remove') => void; onPlace: (index: number) => void; onYear: (year: Checkpoint) => void
  onUndo: () => void; onReset: () => void; onExample: () => void; onSave: () => void; onCompare: () => void
  onSources: () => void; onExplore: () => void; onProposal: () => void
}) {
  const result = simulate(layout, year)
  const baseline = baselineAt(year)
  const checkpoint = scenario.checkpoints.find((item) => item.year === year)!
  const count = improvementCount(layout)
  const activePractice = tool === 'remove' ? null : practiceById[tool]
  return <>
    <section className="hero game-hero">
      <div><div className="eyebrow"><span className="small-sprout" />A neighborhood learning lab</div><h1>A better block.<br /><em>A shared future.</em></h1></div>
      <div className="hero-copy"><p>A few small choices can shape a place for years.<br className="desktop-break" /> Try a mix, see what changes, and find people<br className="desktop-break" /> making it happen in the East Bay.</p><button className="text-button" onClick={onExplore}>Explore local action <ArrowRight size={17} /></button></div>
    </section>
    <div className="journey" aria-label="Learning journey"><div className="current"><span>01</span>Shape a block</div><i /><div><span>02</span>Watch it grow</div><i /><div><span>03</span>Take it into the world</div><p>3–5 minutes · No right answer</p></div>
    <section className="design-workspace" aria-label="Neighborhood design game">
      <div className="board-panel">
        <div className="board-heading"><div><div className="eyebrow muted"><MapPin size={12} />West Oakland · imagined</div><h2>The shared block</h2></div><div className="board-tools"><button className="icon-button" aria-label="Undo last change" title="Undo" disabled={!canUndo} onClick={onUndo}><Undo2 size={19} /></button><button className="icon-button" aria-label="Reset the block" title="Reset" disabled={!count} onClick={onReset}><RotateCcw size={18} /></button></div></div>
        <BudgetBar layout={layout} />
        <div className="scene-container">
          <div className="canvas-note"><span className="status-dot" />{savedDesign ? 'Design B · your current draft' : 'Your neighborhood canvas'}</div>
          <span className="canvas-year">YEAR {year.toString().padStart(2, '0')}</span>
          <BlockScene layout={layout} year={year} tool={tool} onPlace={onPlace} />
          <div className="canvas-instruction">{tool === 'remove' ? <Eraser size={15} /> : <PracticeIcon id={tool} size={15} />}<span>{tool === 'remove' ? 'Choose an improvement to remove it.' : <>Choose a plot to add <strong>{activePractice!.shortName.toLowerCase()}</strong>.</>}</span></div>
        </div>
        <div className="board-timeline"><div className="time-intro"><span className="eyebrow muted">Meet the future</span><p>{checkpoint.title}</p></div><Timeline year={year} onChange={onYear} /></div>
      </div>
      <aside className="practice-panel" aria-label="Practice palette">
        <div className="palette-heading"><span className="eyebrow">Make your mix</span><h2>What belongs here?</h2><p>Select a practice. Choose an open plot.</p></div>
        <div className="practice-list" role="group" aria-label="Choose a practice">
          {practices.map((practice) => <button key={practice.id} className={`practice-card ${tool === practice.id ? 'selected' : ''}`} aria-pressed={tool === practice.id} onClick={() => onTool(practice.id)} style={{ '--practice-color': practice.color, '--practice-soft': practice.softColor } as CSSProperties}>
            <span className="practice-thumb"><PracticeIcon id={practice.id} size={27} /></span>
            <span className="practice-card-copy"><strong>{practice.name === 'Community food garden' ? 'Food garden' : practice.name}</strong><span className="practice-costs"><span title="Budget credits"><Coins size={12} />{practice.costs.budget}</span><span title="Water units"><Droplet size={12} />{practice.costs.water}</span><span title="Care units"><HandHeart size={12} />{practice.costs.care}</span></span></span>
            <span className="practice-check">{tool === practice.id && <Check size={15} />}</span>
          </button>)}
        </div>
        <button className={`erase-tool ${tool === 'remove' ? 'selected' : ''}`} aria-pressed={tool === 'remove'} onClick={() => onTool('remove')}><Eraser size={16} />Remove an improvement</button>
        <div className="practice-description">{activePractice ? <><span className="eyebrow muted">The tradeoff</span><p>{activePractice.tradeoff}</p></> : <><span className="eyebrow muted">Make room for another idea</span><p>Removing an improvement returns its budget, water, and care units.</p></>}</div>
        <button className="text-button example-button" onClick={onExample}><BookOpen size={15} />Try a balanced example</button>
      </aside>
    </section>
    <section className="outcome-section" aria-label="Illustrative environmental outcomes">
      <div className="section-heading"><div><span className="eyebrow muted">Small choices, longer horizons</span><h2>What could change?</h2></div><button className="text-button muted" onClick={onSources}><Info size={16} />How the scores work</button></div>
      <div className={`event-note year-${year}`}>
        {year === 0 ? <><span className="event-icon"><PracticeIcon id="native" size={18} /></span><div><strong>Start small. Leave room to grow.</strong><span>Planning allowance: 58 water units and 36 care units. Trees need time to develop shade.</span></div></>
          : year === 5 ? <><span className="event-icon"><CloudSun size={21} /></span><div><strong>Year 5: a long, dry summer</strong><span>Available: 28 water units · 30 care units.{result.waterShortfall ? ` Your mix is ${result.waterShortfall} water units over.` : ' Your mix stays within the water allowance.'}</span></div></>
          : <><span className="event-icon"><CloudRain size={21} /></span><div><strong>Year 15: the rain returns</strong><span>Available: 58 water units · 24 care units. Runoff and long-term upkeep matter now.</span></div></>}
        <span className="index-label">Game units</span>
      </div>
      <div className="outcome-grid">{outcomes.map(({ id, name, color, explanation }) => {
        const difference = result.scores[id] - baseline.scores[id]
        return <div className="outcome-card" key={id} style={{ '--outcome-color': color } as CSSProperties}>
          <span className="outcome-name" title={explanation}>{name}</span><div className="outcome-value">{result.scores[id]}<span>/ 100</span></div>
          <div className="outcome-track"><span style={{ width: `${result.scores[id]}%` }} /><i style={{ left: `${baseline.scores[id]}%` }} title={`Unchanged block: ${baseline.scores[id]}`} /></div>
          <span className="outcome-delta">{difference >= 0 ? '+' : ''}{difference} <span>vs. unchanged block at year {year}</span></span>
        </div>
      })}</div>
      <div className="outcome-bottom"><p><Info size={14} />Illustrative indices, not environmental forecasts.</p><div>{savedDesign ? <button className="button button-secondary button-small" onClick={onCompare}>Compare Design A & B <ArrowRight size={15} /></button> : <button className="button button-secondary button-small" disabled={!count} onClick={onSave}>Save as Design A <ArrowRight size={15} /></button>}</div></div>
      {count > 0 && <div className="insight-row">{result.insights.map((insight) => <p key={insight}><Check size={14} />{insight}</p>)}</div>}
    </section>
    <section className="action-bridge"><div><span className="eyebrow">From a possibility to a place</span><h2>Good ideas grow with people.</h2><p>Find a garden, a learning space, or a tool library connected to your choices.</p></div><div className="bridge-actions"><button className="button button-primary" onClick={onExplore}>Find real places <ArrowRight size={17} /></button><button className="text-button" onClick={onProposal} disabled={!count}>Make a conversation starter <ArrowRight size={15} /></button></div></section>
  </>
}
