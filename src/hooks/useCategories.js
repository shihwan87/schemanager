import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// scope: 'work' | 'personal' — categories are isolated per scope.
export function useCategories(scope = 'work') {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('scope', scope)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    if (!error) setCategories(data ?? [])
    setLoading(false)
  }, [scope])

  useEffect(() => {
    fetchAll()
    const ch = supabase.channel(`categories-rt-${scope}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `scope=eq.${scope}` },
        fetchAll,
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetchAll, scope])

  const addCategory = async ({ name, color }) => {
    const { error } = await supabase.from('categories').insert({ name, color, scope })
    if (error) throw error
  }

  const updateCategory = async (id, patch) => {
    // If renaming, propagate to projects.category within the same scope only.
    const current = categories.find(c => c.id === id)
    if (current && patch.name && patch.name !== current.name) {
      await supabase
        .from('projects')
        .update({ category: patch.name })
        .eq('category', current.name)
        .eq('scope', scope)
    }
    const { error } = await supabase.from('categories').update(patch).eq('id', id)
    if (error) throw error
  }

  const deleteCategory = async (id) => {
    // DB trigger reassigns linked projects to scope-matching 'Uncategorized'.
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
  }

  const reorderCategories = async (orderedIds) => {
    const updates = orderedIds.map((id, idx) =>
      supabase.from('categories').update({ sort_order: idx }).eq('id', id)
    )
    await Promise.all(updates)
    await fetchAll()
  }

  const colorFor = (name) => categories.find(c => c.name === name)?.color || '#8a8fa3'

  return { categories, loading, addCategory, updateCategory, deleteCategory,
    reorderCategories, colorFor, refresh: fetchAll }
}
