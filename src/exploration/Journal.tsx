import { ArrowRight, Check, Download, Leaf, MapPin, RotateCcw, Sprout } from 'lucide-react'
import { hotspotOrder, hotspots, placeById, places } from './content.ts'
import { hasFieldTrip } from './storage.ts'
import type { ExplorationState, HotspotId, PlaceId } from './types.ts'

export function Notebook({ state, onVisit, compact = false }: { state: ExplorationState; onVisit?: (place: PlaceId, hotspot?: HotspotId) => void; compact?: boolean }) {
  const count = Object.keys(state.entries).length
  return <div className={`illustrated-notebook ${compact ? 'compact' : ''}`}>
    <div className="notebook-cover"><span className="notebook-strap" /><span className="eyebrow"><Sprout size={15} />Field notes</span><h2>My little<br /><em>discoveries.</em></h2><span className="notebook-place"><MapPin size={13} />East Bay</span></div>
    <div className="notebook-pages">
      {!count ? <div className="notebook-empty"><Leaf size={34} strokeWidth={1.2} /><h3>Your next discovery<br />starts outside.</h3><p>Explore a place to fill your journal.</p>{onVisit && <button className="button button-primary" onClick={() => onVisit('farm')}>Visit Farm Park <ArrowRight size={15} /></button>}</div>
        : hotspotOrder.map(id => {
          const entry = state.entries[id]
          if (!entry) return null
          return <article key={id} className="notebook-entry"><span className="notebook-entry-mark"><Check size={13} /></span><span className="eyebrow">{placeById[entry.place].shortName}</span><h3>{hotspots[id].name}</h3><p>{entry.observation}</p><p className="notebook-reason"><strong>My thinking:</strong> {entry.reasoning}</p>{onVisit && <button className="text-button" onClick={() => onVisit(entry.place, id)}>Revisit <ArrowRight size={12} /></button>}</article>
        })}
    </div>
  </div>
}

export function JournalDialog({ state, previous, onVisit, onDownload, onRestart, onRestore }: { state: ExplorationState; previous: ExplorationState | null; onVisit: (place: PlaceId, hotspot?: HotspotId) => void; onDownload: () => void; onRestart: () => void; onRestore: () => void }) {
  const count = Object.keys(state.entries).length
  return <>
    <h2 className="dialog-title">My journal.</h2><p className="dialog-lead">{count}/{hotspotOrder.length} discoveries · {state.visited.length}/{places.length} places</p>
    <div className="journal-stamps">{places.map(place => <div key={place.id}><span>{place.hotspots.every(id => state.entries[id]) ? <Check size={20} /> : <MapPin size={20} />}</span><strong>{place.shortName}</strong><small>{place.hotspots.filter(id => state.entries[id]).length}/{place.hotspots.length} discoveries</small><button className="text-button" onClick={() => onVisit(place.id)}>Visit <ArrowRight size={12} /></button></div>)}</div>
    <Notebook state={state} onVisit={onVisit} compact />
    <div className="dialog-actions"><button className="button button-primary" onClick={onDownload}><Download size={16} />Download journal</button><button className="button button-secondary" onClick={() => onVisit('library', 'idea')}>Make an idea <ArrowRight size={15} /></button></div><p className="dialog-footnote">Saved here. Your download includes sources.</p>
    <div className="journal-replay"><div><strong>Another adventure?</strong><p>Start fresh. One previous journal is kept here.</p></div><div><button className="text-button" disabled={!hasFieldTrip(state)} onClick={onRestart}><RotateCcw size={14} />Start again</button>{previous && hasFieldTrip(previous) && <button className="text-button" onClick={onRestore}>Restore previous trip ({Object.keys(previous.entries).length} discoveries) <ArrowRight size={13} /></button>}</div></div>
  </>
}
