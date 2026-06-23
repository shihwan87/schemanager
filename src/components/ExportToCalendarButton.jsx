import { useState } from 'react'
import { COLORS } from '../styles/theme'
import { DateInput } from './DateInput'
import { calendarConfigured, createEvent, updateEvent } from '../lib/google'

// Per-step "Add to Google Calendar" button + small export modal.
// Default date = step deadline (falls back to project deadline). User can
// toggle all-day or pick start/end times. Stores the returned event id on the
// step (gcal_event_id) so a second export updates the same event in place.
export function ExportToCalendarButton({ step, project, accent, onUpdate }) {
  const [open, setOpen] = useState(false)

  if (!calendarConfigured()) return null

  const exported = !!step.gcal_event_id

  return (
    <>
      <button onClick={() => setOpen(true)} style={S.trigger}>
        {exported ? '🔄 Update calendar event' : '📅 Add to Google Calendar'}
      </button>
      {open && (
        <ExportModal step={step} project={project} accent={accent}
          onClose={() => setOpen(false)} onUpdate={onUpdate} />
      )}
    </>
  )
}

function ExportModal({ step, project, accent, onClose, onUpdate }) {
  const defaultDate = step.deadline || project?.deadline || ''
  const [date, setDate] = useState(defaultDate)
  const [allDay, setAllDay] = useState(true)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const summary = `[${project?.category || 'Uncategorized'}] ${project?.title || ''} — ${step.title}`
  const description = [step.notes || '', '', window.location.href].join('\n').trim()

  const submit = async () => {
    setErr('')
    if (!date) { setErr('Pick a date first.'); return }
    if (!allDay && endTime <= startTime) { setErr('End time must be after start.'); return }
    setBusy(true)
    try {
      const fields = { summary, description, date, allDay, startTime, endTime }
      const eventId = step.gcal_event_id
        ? await updateEvent(step.gcal_event_id, fields)
        : await createEvent(fields)
      await onUpdate(step.id, { gcal_event_id: eventId })
      onClose()
    } catch (e) {
      setErr(e.message || 'Export failed. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.head}>
          <span style={S.title}>Export to Google Calendar</span>
          <button onClick={onClose} style={S.close}>✕</button>
        </div>

        <div style={S.summary}>{summary}</div>

        <div style={S.row}>
          <label style={S.label}>Date</label>
          <DateInput value={date} onChange={setDate} />
        </div>

        <label style={S.checkRow}>
          <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} />
          <span>All-day event</span>
        </label>

        {!allDay && (
          <div style={S.row}>
            <label style={S.label}>Time</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
              style={S.time} />
            <span style={S.dash}>–</span>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
              style={S.time} />
          </div>
        )}

        {err && <div style={S.err}>{err}</div>}

        <div style={S.actions}>
          <button onClick={onClose} style={S.cancel} disabled={busy}>Cancel</button>
          <button onClick={submit} style={{ ...S.confirm, background: accent || COLORS.primary }}
            disabled={busy}>
            {busy ? 'Working…' : step.gcal_event_id ? 'Update event' : 'Add event'}
          </button>
        </div>
      </div>
    </div>
  )
}

const S = {
  trigger: { alignSelf: 'flex-start', marginTop: 4, background: 'transparent',
    color: COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: 8,
    padding: '6px 12px', cursor: 'pointer', fontSize: 12 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'grid', placeItems: 'center', padding: 16, zIndex: 200 },
  modal: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16,
    width: '100%', maxWidth: 420, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: COLORS.text, fontSize: 16, fontWeight: 600 },
  close: { background: 'transparent', color: COLORS.muted, border: 0, fontSize: 18, cursor: 'pointer' },
  summary: { color: COLORS.muted, fontSize: 13, background: COLORS.bg, borderRadius: 8,
    padding: '8px 10px', border: `1px solid ${COLORS.border}` },
  row: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  label: { color: COLORS.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: 0.5, minWidth: 44 },
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, color: COLORS.text, fontSize: 13,
    cursor: 'pointer' },
  time: { background: COLORS.bg, color: COLORS.text, border: `1px solid ${COLORS.border}`,
    borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none' },
  dash: { color: COLORS.muted },
  err: { color: COLORS.danger, fontSize: 12 },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  cancel: { background: 'transparent', color: COLORS.muted, border: `1px solid ${COLORS.border}`,
    borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 },
  confirm: { color: '#fff', border: 0, borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
    fontSize: 13, fontWeight: 600 },
}
