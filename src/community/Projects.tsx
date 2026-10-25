import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Check, Copy, MapPin, Pencil, Plus, Sprout, Users } from 'lucide-react'
import type { CommunityClient } from './client.ts'
import { GardenPreview } from './PlantArt.tsx'
import { plantById } from './plants.ts'
import { helpRoles, money, permissionLabels, projectKinds } from './projects.ts'
import { SiteEvidence, SiteFacts, SiteObservations } from './SiteCheck.tsx'
import type { GardenProject, HelpRole, SiteEnvironment } from './types.ts'

export function ProjectBoard({ client, onOpen, onStart }: { client: CommunityClient; onOpen: (id: string) => void; onStart: () => void }) {
  const [filter, setFilter] = useState<'all' | 'mine' | 'open'>('all')
  const filtered = client.projects.filter(project => filter === 'all' || (filter === 'mine' ? project.isOrganizer || project.joined : project.status === 'open' && project.members.length < project.volunteersNeeded))
  return <div className="community-dialog community-board">
    <span className="community-eyebrow">Neighbors grow things</span><h2>A little land.<br /><em>A lot of possibility.</em></h2>
    <p className="community-lead">Find a team. Or start one.</p>
    <div className="board-tools"><div className="plant-filter" role="group" aria-label="Project filter">{([['all', 'All projects'], ['open', 'Needs help'], ['mine', 'My projects']] as const).map(([id, label]) => <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}</div><button className="button button-primary" onClick={onStart}><Plus size={19} />Start a garden</button></div>
    {client.loading ? <p className="community-empty" role="status">Opening the garden board…</p> : client.error ? <div className="community-error" role="alert"><p>{client.error}</p><button className="button button-secondary" onClick={() => { void client.refresh() }}>Try again</button></div> : !filtered.length ? <div className="community-empty"><GardenPreview selected={[]} /><h3>{client.projects.length ? 'No projects in this view yet.' : 'Be the first to plant an idea.'}</h3><p>Pick a spot on the map to begin.</p><button className="text-button" onClick={onStart}>Choose a spot <ArrowRight size={18} /></button></div> : <div className="project-board-grid">{filtered.map(project => <button key={project.id} className="project-card" onClick={() => onOpen(project.id)}>
      <GardenPreview selected={project.plants} kind={project.kind} /><div className="project-card-body"><span className="project-card-kind">{projectKinds.find(kind => kind.id === project.kind)?.name}{project.isOrganizer ? ' · Your idea' : project.joined ? ' · Joined' : ''}</span><h3>{project.title}</h3><p><MapPin size={16} />{project.site.label}</p><span className={`project-permission permission-${project.permission}`}>{permissionLabels[project.permission]}</span><div className="project-card-numbers"><span><Users size={18} />{project.members.length}/{project.volunteersNeeded} joined</span><strong>{money(project.budget)}</strong></div><span className="project-card-action">{project.status === 'closed' ? 'Signups closed' : project.members.length >= project.volunteersNeeded ? 'Team is full' : project.permission === 'confirmed' ? 'Meet the team' : 'Join the planning'}<ArrowRight size={18} /></span></div>
    </button>)}</div>}
    <p className="community-scope"><Sprout size={17} />Local pilot · Shared on this computer · Pins are proposals</p>
  </div>
}

export function ProjectDetail({ project, environment, client, onEdit, onBoard, onSiteCheck, onNotice }: {
  project: GardenProject; environment: SiteEnvironment | null; client: CommunityClient; onEdit: () => void
  onBoard: () => void; onSiteCheck: () => void; onNotice: (text: string) => void
}) {
  const [joining, setJoining] = useState(false)
  const [name, setName] = useState(client.visitorName)
  const [role, setRole] = useState<HelpRole>(project.roles[0])
  const [availability, setAvailability] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const slots = Math.max(0, project.volunteersNeeded - project.members.length)
  const own = project.members.find(member => member.mine)
  const join = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true)
    try { await client.join(project.id, { name, role, availability }); setJoining(false); onNotice('You joined the team.') }
    catch (failure) { setError((failure as Error).message); void client.refresh() }
    finally { setBusy(false) }
  }
  const action = async (operation: () => Promise<unknown>, message: string) => {
    setBusy(true); setError('')
    try { await operation(); onNotice(message) } catch (failure) { setError((failure as Error).message); void client.refresh() }
    finally { setBusy(false) }
  }
  const share = async () => {
    const url = new URL(window.location.href); url.search = `project=${project.id}`
    try { await navigator.clipboard.writeText(url.toString()); onNotice('Project link copied. It works on this local server.') }
    catch { setError('Copy the project link from your browser’s address bar.') }
  }
  const date = project.workDate ? new Date(`${project.workDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date to agree'
  return <div className="community-dialog project-detail">
    <button className="text-button community-back" onClick={onBoard}><ArrowLeft size={17} />Garden projects</button>
    <div className="project-detail-meta"><span className="community-eyebrow">{projectKinds.find(kind => kind.id === project.kind)?.name}</span><button className="text-button" onClick={() => { void share() }}><Copy size={16} />Copy link</button></div>
    <h2>{project.title}</h2>
    <p className="community-location"><MapPin size={17} />{project.site.label}</p>
    <GardenPreview selected={project.plants} kind={project.kind} />
    <div className="project-stats"><div><strong>{money(project.budget)}</strong><span>Budget target</span></div><div><strong>{project.members.length}<small> / {project.volunteersNeeded}</small></strong><span>Volunteers joined</span></div><div><strong><CalendarDays size={20} />{date}</strong><span>Work day</span></div></div>
    <div className={`project-permission-block permission-${project.permission}`}><span>{permissionLabels[project.permission]}</span><p>{project.permission === 'confirmed' ? 'Reported by the organizer; access is not independently verified.' : 'Planning only. Confirm access with the land steward before site work.'}</p>{project.permissionNote && <p>{project.permissionNote}</p>}</div>
    <div className="project-detail-columns"><section className="project-plan"><h3>The plan</h3><p className="project-goal">{project.goal}</p><div className="project-grow-list">{project.plants.map(id => <span key={id}>{plantById[id].name}</span>)}{project.otherPlants && <span>{project.otherPlants}</span>}</div>
      <h4>Care after planting</h4><p>{project.carePlan}</p>
      {project.budgetNote && <><h4>Budget goes toward</h4><p>{project.budgetNote}</p></>}
      {project.meetupNote && <><h4>Meetup</h4><p>{project.meetupNote}</p></>}
      <p className="project-organizer">Started by <strong>{project.organizerName}</strong></p>
      <details className="project-site"><summary>This site & plant checks</summary><SiteFacts site={project.site} environment={environment} /><p>Saved observations are the organizer’s reports. Recheck them before work.</p><SiteObservations conditions={project.conditions} /><button className="text-button" onClick={onSiteCheck}>Open plant check <ArrowRight size={17} /></button><SiteEvidence environment={environment} /></details>
    </section><section className="project-team"><div className="team-heading"><h3>The team</h3><span>{project.status === 'closed' ? 'Signups closed' : slots ? `${slots} ${slots === 1 ? 'space' : 'spaces'} open` : 'Team is full'}</span></div>
      <div className="team-person"><span className="person-initial organizer-initial">{project.organizerName.slice(0, 1).toUpperCase()}</span><span><strong>{project.organizerName}{project.isOrganizer && ' (you)'}</strong><small>Organizer</small></span></div>
      {project.members.map((member, index) => <div className="team-person" key={`${member.joinedAt}-${index}`}><span className="person-initial">{member.name.slice(0, 1).toUpperCase()}</span><span><strong>{member.name}{member.mine && ' (you)'}</strong><small>{helpRoles.find(item => item.id === member.role)?.name}</small>{member.availability && <p>{member.availability}</p>}</span>{member.mine && <Check size={17} />}</div>)}
      {!project.members.length && <p className="team-empty">Every garden needs its first neighbor.</p>}
      <div className="requested-roles"><span>Help wanted</span>{project.roles.map(id => <small key={id}>{helpRoles.find(item => item.id === id)?.name}</small>)}</div>
      {project.isOrganizer ? <div className="organizer-tools"><button className="button button-primary" onClick={onEdit} disabled={busy}><Pencil size={17} />Edit your plan</button><button className="text-button" disabled={busy} onClick={() => { void action(() => client.setStatus(project, project.status === 'open' ? 'closed' : 'open'), project.status === 'open' ? 'Signups closed. You can reopen them.' : 'Signups reopened.') }}>{project.status === 'open' ? 'Close signups' : 'Reopen signups'}</button></div> : own ? <div className="joined-actions"><p><Check size={18} />You’re on the team.</p><button className="text-button" disabled={busy} onClick={() => { setJoining(!joining); setName(own.name); setRole(own.role); setAvailability(own.availability); setError('') }}>Update how you’ll help</button><button className="text-button" disabled={busy} onClick={() => { void action(() => client.leave(project.id), 'You left the team. Your space is open again.') }}>Leave the team</button></div> : project.status === 'open' && slots > 0 && !joining ? <button className="button button-primary join-project-button" onClick={() => { setJoining(true); setError('') }}><Users size={19} />{project.permission === 'confirmed' ? 'Join this garden' : 'Join the planning'}</button> : !joining ? <p className="team-empty">{project.status === 'closed' ? 'The organizer has closed signups.' : 'All volunteer spaces are filled.'}</p> : null}
      {joining && !project.isOrganizer && <form className="community-form join-form" onSubmit={join}><h4>{own ? 'Your part in the team' : 'Count me in.'}</h4><label>Your name or nickname<input autoFocus value={name} minLength={2} maxLength={40} onChange={event => setName(event.target.value)} required /></label><label>How you’ll help<select value={role} onChange={event => setRole(event.target.value as HelpRole)}>{project.roles.map(id => <option key={id} value={id}>{helpRoles.find(item => item.id === id)?.name}</option>)}</select></label><label>Availability <span className="field-optional">optional</span><input value={availability} maxLength={120} onChange={event => setAvailability(event.target.value)} placeholder="Weekend mornings, planning online…" /></label><p className="local-publish-note">Your nickname, role, and availability appear on this project.</p><div className="join-form-actions"><button type="button" className="text-button" disabled={busy} onClick={() => setJoining(false)}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : own ? 'Update' : 'Join team'}<ArrowRight size={18} /></button></div></form>}
      {error && <p className="community-error" role="alert">{error}</p>}
    </section></div>
    <p className="community-scope"><Sprout size={17} />Local pilot · Shared on this computer · Pins are proposals</p>
  </div>
}
