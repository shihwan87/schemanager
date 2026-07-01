import { COLORS } from '../styles/theme'
import { daysUntil, effectiveDeadline } from '../lib/format'

export function UrgentBanner({ projects, stepsByProject, onClick }) {
  const urgent = projects.filter(p => {
    if (p.status === 'Done') return false
    const eff = effectiveDeadline(p, stepsByProject.get(p.id))
    const n = daysUntil(eff?.date)
    return n !== null && n <= 7
  })
  if (urgent.length === 0) return null

  return (
    <div style={S.wrap}>
      <span style={S.icon}>⚠️</span>
      <span style={S.text}><strong>Due in 1 week</strong></span>
      <span style={S.titles}>
        {urgent.map(p => (
          <button key={p.id} onClick={() => onClick(p)} style={S.chip}>{p.title}</button>
        ))}
      </span>
    </div>
  )
}

const S = {
  wrap: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    background: 'rgba(255, 107, 107, 0.1)', border: `1px solid ${COLORS.danger}55`,
    borderRadius: 12, padding: '12px 16px', marginBottom: 16 },
  icon: { fontSize: 18 },
  text: { color: COLORS.text, fontSize: 14 },
  titles: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  chip: { background: COLORS.danger, color: '#fff', border: 0, borderRadius: 999,
    padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
}
