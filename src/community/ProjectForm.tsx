import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, MapPin, Sprout } from 'lucide-react'
import type { CommunityClient } from './client.ts'
import { PlantArt } from './PlantArt.tsx'
import { plants } from './plants.ts'
import { helpRoles, localToday, projectKinds, validateProject } from './projects.ts'
import type { GardenProject, PlantId, ProjectInput, ProjectKind, SelectedSite, SiteConditions } from './types.ts'

export function ProjectForm({ site, conditions, selected, kind = 'new-garden', visitorName, existing, client, onSaved, onBack }: {
  site: SelectedSite; conditions: SiteConditions; selected: PlantId[]; kind?: ProjectKind; visitorName: string
  existing?: GardenProject; client: CommunityClient; onSaved: (project: GardenProject) => void; onBack: () => void
}) {
  const [draft, setDraft] = useState<ProjectInput>(() => existing ?? ({
    site, conditions, plants: selected, kind, title: '', goal: '', otherPlants: '', budget: 0,
    budgetNote: '', volunteersNeeded: 4, roles: ['planting', 'planning'], organizerName: visitorName,
    permission: 'checking', permissionNote: '', workDate: '', meetupNote: '', carePlan: '',
  }))
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [acknowledged, setAcknowledged] = useState(Boolean(existing))
  const [submissionKey] = useState(() => crypto.randomUUID())
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      panel.current?.closest('dialog')?.scrollTo({ top: 0 })
      panel.current?.querySelector<HTMLButtonElement>('.project-steps [aria-current="step"]')?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [step])
  const patch = (value: Partial<ProjectInput>) => setDraft(current => ({ ...current, ...value }))
  const next = () => {
    if (draft.site.label.trim().length < 3) { setError('Give this spot a short name.'); return }
    if (draft.title.trim().length < 3) { setError('Give your project a name.'); return }
    if (draft.goal.trim().length < 12) { setError('Add a sentence about what you want to change.'); return }
    if (!draft.plants.length && !draft.otherPlants.trim()) { setError('Choose what you want to grow.'); return }
    setError(''); setStep(2)
  }
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (step === 1) { next(); return }
    if (!acknowledged) { setError('Confirm that you’ll check with the land steward.'); return }
    try {
      const project = validateProject(draft)
      setError(''); setSaving(true)
      const result = existing ? await client.edit(project, existing.id, existing.revision) : await client.create(project, submissionKey)
      onSaved(result)
    } catch (failure) { setError((failure as Error).message); void client.refresh() }
    finally { setSaving(false) }
  }
  const selectedRole = (id: ProjectInput['roles'][number]) => draft.roles.includes(id)
  return <div ref={panel} className="community-dialog project-editor">
    <div className="community-location"><MapPin size={17} />{site.label}</div>
    <h2>{existing ? 'Keep the plan ' : 'Let’s grow '}<em>{existing ? 'growing.' : 'together.'}</em></h2>
    <p className="community-lead">{existing ? 'Update your idea, resources, and care.' : 'A small idea. A place. A team.'}</p>
    <div className="project-steps" aria-label="Project form steps"><button type="button" aria-current={step === 1 ? 'step' : undefined} onClick={() => { setStep(1); setError('') }}><span>{step === 2 ? <Check size={15} /> : '1'}</span>The idea</button><i /><button type="button" aria-current={step === 2 ? 'step' : undefined} onClick={next}><span>2</span>People & resources</button></div>
    <form className="community-form" onSubmit={save}>
      {step === 1 ? <>
        <fieldset className="project-kind"><legend>What would you like to do?</legend>{projectKinds.map(type => <label key={type.id} className={draft.kind === type.id ? 'selected' : ''}><input type="radio" name="project-kind" value={type.id} checked={draft.kind === type.id} onChange={() => patch({ kind: type.id })} />{type.name}</label>)}</fieldset>
        <label>Project name<input value={draft.title} maxLength={80} onChange={event => patch({ title: event.target.value })} placeholder="A pollinator patch on our block" required /></label>
        <label>Spot name<input value={draft.site.label} maxLength={120} onChange={event => patch({ site: { ...draft.site, label: event.target.value } })} required /><small>The pin marks your chosen spot. No address or access is verified.</small></label>
        <label>What will you change?<textarea rows={2} value={draft.goal} maxLength={600} onChange={event => patch({ goal: event.target.value })} placeholder={draft.kind === 'revive-garden' ? 'Repair the beds and bring the garden back to life…' : 'Turn a bare patch into a place for…'} required minLength={12} /></label>
        <fieldset className="grow-options"><legend>What will you grow?</legend><div>{plants.map(plant => <label key={plant.id} className={draft.plants.includes(plant.id) ? 'selected' : ''}><input type="checkbox" checked={draft.plants.includes(plant.id)} onChange={() => patch({ plants: draft.plants.includes(plant.id) ? draft.plants.filter(id => id !== plant.id) : [...draft.plants, plant.id] })} /><PlantArt id={plant.id} /><span>{plant.name}</span>{draft.plants.includes(plant.id) && <Check size={16} />}</label>)}</div></fieldset>
        <label>Other plants <span className="field-optional">optional</span><input value={draft.otherPlants} maxLength={160} onChange={event => patch({ otherPlants: event.target.value })} placeholder="Herbs, fruit trees, or another idea" /><small>Other plants need their own suitability check.</small></label>
      </> : <>
        <div className="form-pair">
          <label>Budget target (USD)<input type="number" inputMode="decimal" min="0" max="1000000" step=".01" value={Number.isFinite(draft.budget) ? draft.budget : ''} onChange={event => patch({ budget: event.target.value === '' ? NaN : Number(event.target.value) })} required /><small>Planning estimate; $0 can mean donated materials.</small></label>
          <label>Volunteers needed<input type="number" inputMode="numeric" min={Math.max(1, existing?.members.length ?? 0)} max="50" step="1" value={Number.isFinite(draft.volunteersNeeded) ? draft.volunteersNeeded : ''} onChange={event => patch({ volunteersNeeded: event.target.value === '' ? NaN : Number(event.target.value) })} required /><small>Additional people, besides you.</small></label>
        </div>
        <fieldset className="role-options"><legend>What help do you need?</legend>{helpRoles.map(role => {
          const held = Boolean(existing?.members.some(member => member.role === role.id))
          return <label key={role.id} className={selectedRole(role.id) ? 'selected' : ''}><input type="checkbox" checked={selectedRole(role.id)} disabled={held} onChange={() => patch({ roles: selectedRole(role.id) ? draft.roles.filter(id => id !== role.id) : [...draft.roles, role.id] })} />{role.name}</label>
        })}</fieldset>
        <div className="form-pair"><label>Your name or nickname<input value={draft.organizerName} maxLength={40} minLength={2} onChange={event => patch({ organizerName: event.target.value })} required /></label><label>Work day <span className="field-optional">optional</span><input type="date" value={draft.workDate} min={existing?.workDate && existing.workDate < localToday() ? existing.workDate : localToday()} onInput={event => patch({ workDate: event.currentTarget.value })} onChange={event => patch({ workDate: event.target.value })} /></label></div>
        <label>Permission to change this spot<select value={draft.permission} onChange={event => patch({ permission: event.target.value as ProjectInput['permission'] })}><option value="checking">Still checking — planning only</option><option value="contacted">Steward contacted — planning only</option><option value="confirmed" disabled={site.feature === 'water'}>Permission confirmed by me</option></select></label>
        {draft.permission !== 'checking' && <label>{draft.permission === 'confirmed' ? 'Who confirmed permission, and for what?' : 'Steward contact note'}<input value={draft.permissionNote} maxLength={240} minLength={draft.permission === 'confirmed' ? 5 : undefined} required={draft.permission === 'confirmed'} onChange={event => patch({ permissionNote: event.target.value })} placeholder="Name / role and agreed scope" /><small>Share a role or name, without private contact details.</small></label>}
        <label>Who will care for it afterward?<textarea rows={2} value={draft.carePlan} maxLength={400} minLength={12} onChange={event => patch({ carePlan: event.target.value })} placeholder="We’ll set up a weekly watering and care rota…" required /></label>
        <details className="project-extra"><summary>Budget & meetup details <span>optional</span></summary><label>What is the budget for?<textarea rows={2} value={draft.budgetNote} maxLength={240} onChange={event => patch({ budgetNote: event.target.value })} placeholder="Seeds, soil, repaired beds, tools…" /></label><label>Meetup note<input value={draft.meetupNote} maxLength={240} onChange={event => patch({ meetupNote: event.target.value })} placeholder="Planning meetup first; time to be agreed" /></label></details>
        <label className="steward-check"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} />I’ll check with the land steward before changing this site.</label>
        <p className="local-publish-note">Your proposal and nickname will be visible to visitors on this local server.</p>
      </>}
      {error && <p className="community-error" role="alert">{error}</p>}
      <div className="community-sticky-actions"><button type="button" className="text-button" disabled={saving} onClick={() => { setError(''); if (step === 2) setStep(1); else onBack() }}><ArrowLeft size={17} />{step === 2 ? 'The idea' : existing ? 'Project' : 'Site check'}</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Saving…' : step === 1 ? 'People & resources' : existing ? 'Save changes' : 'Publish project'}{step === 1 ? <ArrowRight size={18} /> : <Sprout size={19} />}</button></div>
    </form>
  </div>
}
