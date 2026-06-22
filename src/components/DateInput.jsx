import { useState, useEffect, useRef } from 'react'
import { COLORS } from '../styles/theme'

// Hybrid date input: free-text typing + native picker button.
// Accepts YYYY-MM-DD, YY-MM-DD, YYYY/MM/DD, YY/MM/DD, YYYY.MM.DD.
// Picker button calls showPicker() (Chrome/Edge/Safari 16+ incl. iOS).
export function DateInput({ value, onChange, style }) {
  const [text, setText] = useState(value || '')
  const hiddenRef = useRef(null)

  useEffect(() => { setText(value || '') }, [value])

  const commit = () => {
    const norm = normalize(text)
    if (norm === null) {
      setText(value || '')
    } else if (norm !== (value || '')) {
      onChange(norm)
    }
  }

  const openPicker = () => {
    const el = hiddenRef.current
    if (!el) return
    if (typeof el.showPicker === 'function') {
      try { el.showPicker(); return } catch {}
    }
    el.focus(); el.click()
  }

  return (
    <div style={{ ...S.wrap, ...style }}>
      <input type="text" inputMode="numeric"
        value={text}
        placeholder="YYYY-MM-DD"
        onChange={e => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit() } }}
        style={S.text} />
      <button type="button" onClick={openPicker} style={S.btn} title="Open calendar">📅</button>
      <input type="date" ref={hiddenRef}
        value={value || ''}
        onChange={e => { setText(e.target.value); onChange(e.target.value || '') }}
        style={S.hidden}
        tabIndex={-1} aria-hidden="true" />
    </div>
  )
}

function normalize(raw) {
  if (raw === undefined || raw === null) return ''
  const s = String(raw).trim()
  if (!s) return ''
  const parts = s.replace(/[./]/g, '-').split('-')
  if (parts.length !== 3) return null
  let [y, m, d] = parts
  if (!/^\d+$/.test(y) || !/^\d+$/.test(m) || !/^\d+$/.test(d)) return null
  if (y.length === 2) y = '20' + y
  if (y.length !== 4) return null
  m = m.padStart(2, '0')
  d = d.padStart(2, '0')
  const mi = parseInt(m, 10), di = parseInt(d, 10)
  if (mi < 1 || mi > 12 || di < 1 || di > 31) return null
  return `${y}-${m}-${d}`
}

const S = {
  wrap: { display: 'inline-flex', alignItems: 'stretch', gap: 0,
    border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: 'hidden',
    background: COLORS.bg },
  text: { background: 'transparent', color: COLORS.text, border: 0, outline: 'none',
    padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', minWidth: 120 },
  btn: { background: COLORS.card, color: COLORS.text, border: 0, borderLeft: `1px solid ${COLORS.border}`,
    cursor: 'pointer', padding: '0 12px', fontSize: 16 },
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' },
}
