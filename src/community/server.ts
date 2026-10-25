import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { chmod, mkdir, readFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { NeighborhoodGeometry } from '../exploration/geography.ts'
import { describeSite } from './geography.ts'
import { InputError, localToday, validateJoin, validateProject } from './projects.ts'
import type { CommunitySnapshot, GardenProject, JoinInput, ProjectInput } from './types.ts'

interface StoredMember extends JoinInput { visitor: string; joinedAt: string }
interface StoredProject extends ProjectInput {
  id: string
  createdAt: string
  updatedAt: string
  revision: number
  status: 'open' | 'closed'
  organizer: string
  submissionKey: string
  members: StoredMember[]
}
interface Store { version: 1; projects: StoredProject[] }
interface Options { dataDirectory: string; geometryPath: string; cookieName?: string }

function publicProject(project: StoredProject, visitor: string): GardenProject {
  const { organizer, submissionKey: _key, members, ...details } = project
  return { ...details, isOrganizer: organizer === visitor, joined: members.some(member => member.visitor === visitor), members: members.map(({ visitor: id, ...member }) => ({ ...member, mine: id === visitor })) }
}

function snapshot(store: Store, visitor: string): CommunitySnapshot {
  const projects = store.projects.map(project => publicProject(project, visitor)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const own = store.projects.filter(project => project.organizer === visitor || project.members.some(member => member.visitor === visitor)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  return { projects, visitorName: own ? own.organizer === visitor ? own.organizerName : own.members.find(member => member.visitor === visitor)?.name ?? '' : '' }
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new InputError('Send project details as JSON.', 415)
  const chunks: Buffer[] = []
  let length = 0
  await new Promise<void>((done, reject) => {
    req.on('data', (chunk: Buffer) => { length += chunk.length; if (length <= 24_576) chunks.push(chunk) })
    req.on('end', done)
    req.on('error', reject)
    req.on('aborted', () => reject(new InputError('The request was interrupted.', 400)))
  })
  if (length > 24_576) throw new InputError('Project details are too large.', 413)
  let parsed: unknown
  try { parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { throw new InputError('Project details could not be read.', 400) }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new InputError('Provide project details.', 400)
  return parsed as Record<string, unknown>
}

export function createCommunityMiddleware({ dataDirectory, geometryPath, cookieName = 'common-ground-neighbor' }: Options) {
  const path = resolve(dataDirectory, 'gardens.sqlite')
  let databasePromise: Promise<DatabaseSync> | null = null
  let geometryPromise: Promise<NeighborhoodGeometry> | null = null
  let queue: Promise<unknown> = Promise.resolve()
  const parseStore = (raw: string): Store => {
    try {
      const saved = JSON.parse(raw) as Store
      if (saved.version !== 1 || !Array.isArray(saved.projects)) throw new Error('Garden store format unsupported')
      for (const project of saved.projects) {
        validateProject(project)
        if (!/^[a-f0-9]{64}$/.test(project.organizer) || !Array.isArray(project.members) || project.members.length > project.volunteersNeeded || !Number.isInteger(project.revision) || !['open', 'closed'].includes(project.status)) throw new Error('Garden store invalid')
        const ids = new Set<string>()
        for (const member of project.members) {
          validateJoin(member, project.roles)
          if (!/^[a-f0-9]{64}$/.test(member.visitor) || ids.has(member.visitor)) throw new Error('Garden member invalid')
          ids.add(member.visitor)
        }
      }
      return saved
    } catch (error) {
      // A damaged saved record is a storage failure, not a visitor's form error.
      if (error instanceof InputError) throw new Error('Saved garden details are invalid')
      throw error
    }
  }
  const database = () => databasePromise ??= (async () => {
    await mkdir(dataDirectory, { recursive: true, mode: 0o700 })
    const db = new DatabaseSync(path)
    try {
      await chmod(path, 0o600)
      db.exec('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS community (id INTEGER PRIMARY KEY CHECK(id = 1), value TEXT NOT NULL) STRICT')
      if (!db.prepare('SELECT value FROM community WHERE id = 1').get()) {
        let initial: Store = { version: 1, projects: [] }
        try { initial = parseStore(await readFile(resolve(dataDirectory, 'gardens.json'), 'utf8')) }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
        db.prepare('INSERT OR IGNORE INTO community (id, value) VALUES (1, ?)').run(JSON.stringify(initial))
      }
      return db
    } catch (error) { db.close(); throw error }
  })().catch(error => { databasePromise = null; throw error })
  const load = async (): Promise<Store> => {
    const row = (await database()).prepare('SELECT value FROM community WHERE id = 1').get()
    if (typeof row?.value !== 'string') throw new Error('Garden storage is incomplete')
    return parseStore(row.value)
  }
  const geometry = () => geometryPromise ??= readFile(geometryPath, 'utf8').then(raw => JSON.parse(raw) as NeighborhoodGeometry).catch(error => { geometryPromise = null; throw error })
  const transact = <T,>(operation: (draft: Store) => T): Promise<T> => {
    const work = queue.then(async () => {
      const db = await database()
      db.exec('BEGIN IMMEDIATE')
      try {
        const row = db.prepare('SELECT value FROM community WHERE id = 1').get()
        if (typeof row?.value !== 'string') throw new Error('Garden storage is incomplete')
        const draft = parseStore(row.value)
        const result = operation(draft)
        db.prepare('UPDATE community SET value = ? WHERE id = 1').run(JSON.stringify(draft))
        db.exec('COMMIT')
        return result
      } catch (error) { db.exec('ROLLBACK'); throw error }
    })
    queue = work.catch(() => undefined)
    return work
  }
  const send = (res: ServerResponse, status: number, value: unknown) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
    res.end(JSON.stringify(value))
  }
  const middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/community')) { next(); return }
    void (async () => {
      // The anonymous pilot is restricted to the existing local app.
      const host = req.headers.host ?? ''
      if (!/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host)) throw new InputError('The garden pilot is available locally.', 403)
      if (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && req.headers.origin !== `http://${host}` && req.headers.origin !== `https://${host}`)) throw new InputError('Open the garden board in this app.', 403)
      const route = new URL(req.url!, `http://${host}`).pathname
      if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method ?? '')) throw new InputError('This action is unavailable.', 405)
      if (req.method !== 'GET' && !req.headers.origin) throw new InputError('Open the garden board in this app.', 403)
      const value = req.headers.cookie?.split(';').map(item => item.trim()).find(item => item.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1)
      const token = value && /^[a-f0-9]{64}$/.test(value) ? value : randomBytes(32).toString('hex')
      if (token !== value) res.setHeader('Set-Cookie', `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/api/community; Max-Age=31536000`)
      const visitor = createHash('sha256').update(token).digest('hex')
      if (route === '/api/community' && req.method === 'GET') {
        await queue
        send(res, 200, snapshot(await load(), visitor))
        return
      }
      if (route === '/api/community/projects' && req.method === 'POST') {
        const body = await readBody(req)
        const input = validateProject(body)
        if (input.workDate && input.workDate < localToday()) throw new InputError('Choose today or a future work date.')
        const submissionKey = req.headers['idempotency-key']
        if (typeof submissionKey !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(submissionKey)) throw new InputError('The project could not be identified. Try again.', 400)
        const mapped = describeSite(await geometry(), input.site)
        if (mapped.feature === 'water' && input.permission === 'confirmed') throw new InputError('This pin is mapped water. Choose a land spot before confirming a garden.')
        const result = await transact(draft => {
          const previous = draft.projects.find(project => project.organizer === visitor && project.submissionKey === submissionKey)
          if (previous) return previous
          if (draft.projects.length >= 500) throw new InputError('This local pilot has reached its project limit.', 409)
          const now = new Date().toISOString()
          const project: StoredProject = { ...input, site: { ...mapped, label: input.site.label }, id: randomUUID(), createdAt: now, updatedAt: now, revision: 1, status: 'open', organizer: visitor, submissionKey, members: [] }
          draft.projects.push(project)
          return project
        })
        send(res, 201, publicProject(result, visitor))
        return
      }
      const match = /^\/api\/community\/projects\/([a-f0-9-]{36})(\/join)?$/.exec(route)
      if (!match) throw new InputError('Project not found.', 404)
      if (!match[2] && req.method === 'GET') {
        await queue
        const project = (await load()).projects.find(item => item.id === match[1])
        if (!project) throw new InputError('Project not found.', 404)
        send(res, 200, publicProject(project, visitor))
        return
      }
      if (req.method === 'GET') throw new InputError('This action is unavailable.', 405)
      const body = req.method === 'DELETE' ? {} : await readBody(req)
      if (body.status !== undefined && body.status !== 'open' && body.status !== 'closed') throw new InputError('Choose open or closed signups.')
      const map = req.method === 'PATCH' && !body.status ? await geometry() : null
      const result = await transact(draft => {
        const project = draft.projects.find(item => item.id === match[1])
        if (!project) throw new InputError('Project not found.', 404)
        if (match[2]) {
          if (req.method === 'DELETE') project.members = project.members.filter(member => member.visitor !== visitor)
          else if (req.method === 'POST') {
            if (project.organizer === visitor) throw new InputError('You are already the organizer.', 409)
            const joined = project.members.find(member => member.visitor === visitor)
            if (project.status === 'closed' && !joined) throw new InputError('Signups are closed for this project.', 409)
            if (!joined && project.members.length >= project.volunteersNeeded) throw new InputError('The team is full. Check back for an opening.', 409)
            const input = validateJoin(body, project.roles)
            if (joined) Object.assign(joined, input)
            else project.members.push({ ...input, visitor, joinedAt: new Date().toISOString() })
          } else throw new InputError('This action is unavailable.', 405)
        } else if (req.method === 'PATCH') {
          if (project.organizer !== visitor) throw new InputError('Only the organizer can edit this project.', 403)
          if (body.revision !== project.revision) throw new InputError('The team changed while you were editing. Reopen the editor and try again.', 409)
          if (body.status === 'open' || body.status === 'closed') project.status = body.status
          else {
            const input = validateProject(body)
            if (input.volunteersNeeded < project.members.length) throw new InputError('Keep enough spaces for everyone already on the team.', 409)
            if (input.workDate && input.workDate !== project.workDate && input.workDate < localToday()) throw new InputError('Choose today or a future work date.')
            if (project.members.some(member => !input.roles.includes(member.role))) throw new InputError('Keep the help roles already chosen by team members.', 409)
            const mapped = describeSite(map!, input.site)
            if (mapped.feature === 'water' && input.permission === 'confirmed') throw new InputError('This pin is mapped water. Choose a land spot before confirming a garden.')
            Object.assign(project, input, { site: { ...mapped, label: input.site.label } })
          }
        } else throw new InputError('This action is unavailable.', 405)
        project.updatedAt = new Date().toISOString()
        project.revision += 1
        return project
      })
      send(res, 200, publicProject(result, visitor))
    })().catch(error => {
      if (!(error instanceof InputError)) console.error('Garden storage could not complete the request:', (error as Error).message)
      send(res, error instanceof InputError ? error.status : 503, { error: error instanceof InputError ? error.message : 'Garden storage is unavailable. Your last saved projects are kept; try again.' })
    })
  }
  return Object.assign(middleware, { close: async () => {
    await queue
    const opened = await databasePromise?.catch(() => null)
    if (opened?.isOpen) opened.close()
    databasePromise = null
  } })
}
