import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { ARCHIVED } from '../lib/constants'
import { daysUntil, effectiveDeadline } from '../lib/format'

// Live minimum days-until across each scope + open-request count for CONFIG.
// Drives ☆ / ! markers on the tab bar. Excludes Archived + Done projects.
export function useTabMarkers() {
  const [state, setState] = useState({
    work: { minDays: null }, personal: { minDays: null }, openRequests: 0,
  })

  const fetchAll = useCallback(async () => {
    const [{ data: projects }, { data: steps }, { count }] = await Promise.all([
      supabase.from('projects').select('id, scope, category, deadline, status'),
      supabase.from('steps').select('project_id, status, deadline'),
      supabase.from('claude_requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    ])
    const stepsByProject = new Map()
    for (const s of steps ?? []) {
      if (!stepsByProject.has(s.project_id)) stepsByProject.set(s.project_id, [])
      stepsByProject.get(s.project_id).push(s)
    }
    const minFor = (scope) => {
      let min = null
      for (const p of projects ?? []) {
        if (p.scope !== scope) continue
        if (p.category === ARCHIVED) continue
        if (p.status === 'Done') continue
        const eff = effectiveDeadline(p, stepsByProject.get(p.id))
        const n = daysUntil(eff?.date)
        if (n === null) continue
        if (min === null || n < min) min = n
      }
      return min
    }
    setState({
      work: { minDays: minFor('work') },
      personal: { minDays: minFor('personal') },
      openRequests: count ?? 0,
    })
  }, [])

  useEffect(() => {
    fetchAll()
    const ch = supabase.channel('tab-markers-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'steps' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claude_requests' }, fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetchAll])

  return state
}

// Threshold: ≤3 days → 'star', >3 & ≤7 → 'bang', else null.
// Overdue (negative days) counts as star.
export function markerFor(minDays) {
  if (minDays === null) return null
  if (minDays <= 3) return 'star'
  if (minDays <= 7) return 'bang'
  return null
}
