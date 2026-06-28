import { COLORS } from '../styles/theme'

const TABS = [
  { id: 'work',     label: 'WORK' },
  { id: 'personal', label: 'PERSONAL' },
  { id: 'config',   label: 'CONFIG' },
]

export function TabBar({ active, onChange }) {
  return (
    <nav style={S.bar} className="safe-top">
      {TABS.map(t => {
        const on = active === t.id
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            ...S.btn,
            color: on ? COLORS.primary : COLORS.muted,
            borderBottom: on ? `2px solid ${COLORS.primary}` : '2px solid transparent',
          }}>{t.label}</button>
        )
      })}
    </nav>
  )
}

const S = {
  bar: { position: 'fixed', left: 0, right: 0, top: 0,
    display: 'flex', justifyContent: 'space-around',
    background: COLORS.card, borderBottom: `1px solid ${COLORS.border}`,
    zIndex: 50 },
  btn: { flex: 1, background: 'transparent', border: 0,
    padding: '14px 8px', fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
    cursor: 'pointer' },
}
