import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// scope: 'work' | 'personal' — required, isolates the two tabs.
export function useProjects(scope = 'work') {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('scope', scope)
      .order('deadline', { ascending: true, nullsFirst: false })
    if (error) setError(error)
    else setProjects(data ?? [])
    setLoading(false)
  }, [scope])

  useEffect(() => {
    fetchAll()
    // Scope-keyed channel so WORK and PERSONAL do not re-render each other.
    const channel = supabase
      .channel(`projects-realtime-${scope}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `scope=eq.${scope}` },
        fetchAll,
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchAll, scope])

  const addProject = async ({ title, category, deadline, priority = 'mid' }) => {
    const { data, error } = await supabase
      .from('projects')
      .insert({ title, category, deadline, priority, scope })
      .select()
      .single()
    if (error) throw error
    return data
  }

  const updateProject = async (id, patch) => {
    const { error } = await supabase.from('projects').update(patch).eq('id', id)
    if (error) throw error
  }

  const deleteProject = async (id) => {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
  }

  return { projects, loading, error, addProject, updateProject, deleteProject, refresh: fetchAll }
}
