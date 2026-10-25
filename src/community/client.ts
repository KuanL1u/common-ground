import { useCallback, useEffect, useRef, useState } from 'react'
import type { CommunitySnapshot, GardenProject, JoinInput, ProjectInput } from './types.ts'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try { response = await fetch(`/api/community${path}`, { credentials: 'same-origin', ...options, headers: { 'Content-Type': 'application/json', ...options.headers } }) }
  catch { throw new Error('The garden server couldn’t be reached. Try again.') }
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('The garden server is unavailable. Try again.')
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'The project couldn’t be saved. Try again.')
  return data as T
}

export function useCommunity() {
  const [data, setData] = useState<CommunitySnapshot>({ projects: [], visitorName: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const epoch = useRef(0)
  const sequence = useRef(0)
  const mounted = useRef(true)
  const refresh = useCallback(async () => {
    const generation = epoch.current, order = ++sequence.current
    try {
      const result = await request<CommunitySnapshot>('')
      if (!mounted.current || generation !== epoch.current || order !== sequence.current) return
      setData(result); setError(''); setLoading(false)
    } catch (failure) {
      if (!mounted.current || generation !== epoch.current || order !== sequence.current) return
      setError((failure as Error).message); setLoading(false)
    }
  }, [])
  useEffect(() => {
    mounted.current = true
    void refresh()
    const poll = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh() }, 10_000)
    const focus = () => { void refresh() }
    window.addEventListener('focus', focus)
    return () => { mounted.current = false; sequence.current++; window.clearInterval(poll); window.removeEventListener('focus', focus) }
  }, [refresh])
  const save = async (path: string, method: string, body?: unknown, key?: string) => {
    epoch.current++
    const result = await request<GardenProject>(path, { method, ...(body ? { body: JSON.stringify(body) } : {}), ...(key ? { headers: { 'Idempotency-Key': key } } : {}) })
    epoch.current++
    if (mounted.current) {
      setData(current => ({ projects: [result, ...current.projects.filter(project => project.id !== result.id)].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), visitorName: result.isOrganizer ? result.organizerName : result.members.find(member => member.mine)?.name ?? current.visitorName }))
      setError('')
    }
    return result
  }
  return {
    ...data, loading, error, refresh,
    create: (project: ProjectInput, key: string) => save('/projects', 'POST', project, key),
    edit: (project: ProjectInput, id: string, revision: number) => save(`/projects/${id}`, 'PATCH', { ...project, revision }),
    setStatus: (project: GardenProject, status: GardenProject['status']) => save(`/projects/${project.id}`, 'PATCH', { status, revision: project.revision }),
    join: (id: string, input: JoinInput) => save(`/projects/${id}/join`, 'POST', input),
    leave: (id: string) => save(`/projects/${id}/join`, 'DELETE'),
  }
}

export type CommunityClient = ReturnType<typeof useCommunity>
