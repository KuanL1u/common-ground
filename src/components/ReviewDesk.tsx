import { ArrowRight, Check, Download, ExternalLink, FileCheck2, RotateCcw, Sprout, X } from 'lucide-react'
import { useState } from 'react'
import { downloadText } from '../lib/proposal.ts'
import type { Resource, Suggestion } from '../types.ts'

export function ReviewDesk({ resources, suggestions, onReview, onExample, onReset, onMap, onOpen }: {
  resources: Resource[]; suggestions: Suggestion[]
  onReview: (id: string, decision: 'approved' | 'declined') => void; onExample: () => void; onReset: () => void
  onMap: () => void; onOpen: (resource: Resource) => void
}) {
  const [tab, setTab] = useState<'pending' | 'reviewed'>('pending')
  const pending = suggestions.filter((item) => item.status === 'pending')
  const shown = suggestions.filter((item) => tab === 'pending' ? item.status === 'pending' : item.status !== 'pending').reverse()
  const [resetting, setResetting] = useState(false)
  return <>
    <section className="hero review-hero"><div><div className="eyebrow"><FileCheck2 size={14} />Care for the information</div><h1>A little review.<br /><em>A more useful map.</em></h1></div><div className="hero-copy"><p>Compare a correction with its public source.<br className="desktop-break" /> Approve it before the listing changes.<br className="desktop-break" /> Clear information makes participation easier.</p><button className="text-button" onClick={onMap}>Explore the directory <ArrowRight size={17} /></button></div></section>
    <div className="local-demo-note"><FileCheck2 size={21} /><div><strong>This is a local review demonstration.</strong><p>Anyone can try this desk. Suggestions and reviews stay in this browser; a production reviewer role and shared storage still need the Guild’s input.</p></div><span className="pill">Local demo</span></div>
    <div className="review-toolbar"><div className="review-tabs" role="group" aria-label="Review status"><button className={tab === 'pending' ? 'active' : ''} onClick={() => setTab('pending')}>Pending <span>{pending.length}</span></button><button className={tab === 'reviewed' ? 'active' : ''} onClick={() => setTab('reviewed')}>Reviewed <span>{suggestions.length - pending.length}</span></button></div><div className="review-actions"><button className="button button-secondary button-small" disabled={pending.some((item) => item.demo)} onClick={() => { onExample(); setTab('pending') }}>Try a demo correction</button><button className="text-button muted" onClick={() => downloadText(JSON.stringify({ version: 1, localDemo: true, resources }, null, 2), 'common-ground-directory.json', 'application/json;charset=utf-8')}><Download size={15} />Export directory</button></div></div>
    <div className="review-list" aria-live="polite">
      {shown.map((suggestion) => {
        const resource = resources.find((item) => item.id === suggestion.resourceId)!
        return <article key={suggestion.id} className="review-card">
          <div className="review-card-heading"><div><span className="eyebrow muted">{suggestion.field === 'access' ? 'Participation information' : 'Listing status'}{suggestion.demo ? ' · Demo correction' : ''}</span><button className="review-resource-title" onClick={() => onOpen(resource)}>{suggestion.resourceName}<ArrowRight size={16} /></button></div><span className={`review-status ${suggestion.status}`}>{suggestion.status === 'pending' ? 'Awaiting review' : suggestion.status === 'approved' ? 'Approved locally' : 'Declined'}</span></div>
          <div className="review-diff"><div><span className="eyebrow muted">Current when suggested</span><p>{suggestion.before}</p></div><div><span className="eyebrow">Proposed change</span><p>{suggestion.after}</p></div></div>
          {suggestion.note && <p className="review-note"><strong>Why:</strong> {suggestion.note}</p>}
          <div className="review-source"><a href={suggestion.sourceUrl} target="_blank" rel="noreferrer">Check the public source <ExternalLink size={13} /></a><span>Added {new Date(suggestion.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></div>
          {suggestion.status === 'pending' && <div className="review-card-actions"><span>Approval updates only this browser’s directory.</span><button className="button button-secondary button-small" onClick={() => onReview(suggestion.id, 'declined')}><X size={15} />Decline</button><button className="button button-primary button-small" onClick={() => onReview(suggestion.id, 'approved')}><Check size={15} />Approve locally</button></div>}
        </article>
      })}
      {!shown.length && <div className="review-empty"><span className="empty-illustration"><Sprout size={43} strokeWidth={1.3} /></span><h2>{tab === 'pending' ? 'A good place to begin.' : 'No reviews yet.'}</h2><p>{tab === 'pending' ? 'Suggest a correction from any resource, or load a demo to try the review flow.' : 'Approved and declined corrections will appear here.'}</p>{tab === 'pending' && <button className="button button-primary" onClick={onExample}>Try a demo correction <ArrowRight size={17} /></button>}</div>}
    </div>
    <div className="review-reset"><span>{resources.filter((resource) => resource.status !== 'source-checked').length} listings changed in this demo</span>{resetting ? <><span>Restore source listings and clear the review queue?</span><button className="text-button" onClick={() => { onReset(); setResetting(false) }}>Restore demo</button><button className="text-button muted" onClick={() => setResetting(false)}>Cancel</button></> : <button className="text-button muted" onClick={() => setResetting(true)}><RotateCcw size={14} />Reset directory demo</button>}</div>
  </>
}
