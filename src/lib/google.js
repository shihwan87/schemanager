// Google Calendar export via Google Identity Services (GIS) token client.
// Fully client-side OAuth: no backend, no refresh tokens. Access token lives
// in memory for the tab session and is re-requested when it expires.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const GIS_SRC = 'https://accounts.google.com/gsi/client'
const CAL_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

let gisLoaded = null      // Promise that resolves once the GIS script is ready
let tokenClient = null    // cached GIS token client
let accessToken = null    // in-memory access token for this tab session

export function calendarConfigured() {
  return !!CLIENT_ID
}

// Lazy-load the GIS client script exactly once.
function loadGis() {
  if (gisLoaded) return gisLoaded
  gisLoaded = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve()
    const s = document.createElement('script')
    s.src = GIS_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(s)
  })
  return gisLoaded
}

// Request an access token via the GIS popup. Resolves with the token string.
async function requestToken() {
  if (!CLIENT_ID) throw new Error('Google Client ID not configured')
  await loadGis()
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (resp) => {
          if (resp.error) { reject(new Error(resp.error)); return }
          accessToken = resp.access_token
          resolve(accessToken)
        },
      })
    } else {
      // Reuse the client but swap in a fresh callback for this request.
      tokenClient.callback = (resp) => {
        if (resp.error) { reject(new Error(resp.error)); return }
        accessToken = resp.access_token
        resolve(accessToken)
      }
    }
    tokenClient.requestAccessToken({ prompt: accessToken ? '' : 'consent' })
  })
}

async function ensureToken() {
  if (accessToken) return accessToken
  return requestToken()
}

// Build the Google Calendar event body from our step fields.
// allDay → date-only event (Google's all-day end date is exclusive, so +1 day).
// timed  → dateTime with the browser's local timezone.
function buildEventBody({ summary, description, date, allDay, startTime, endTime }) {
  if (allDay) {
    return {
      summary,
      description,
      start: { date },
      end: { date: addDays(date, 1) },
    }
  }
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  return {
    summary,
    description,
    start: { dateTime: `${date}T${startTime}:00`, timeZone: tz },
    end: { dateTime: `${date}T${endTime}:00`, timeZone: tz },
  }
}

async function callCalendar(url, method, body) {
  const token = await ensureToken()
  let res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  // Token expired mid-session → request a fresh one once and retry.
  if (res.status === 401) {
    accessToken = null
    const fresh = await requestToken()
    res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${fresh}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Calendar API ${res.status}: ${text}`)
  }
  return res.json()
}

// Create a new event. Returns the Google event id.
export async function createEvent(fields) {
  const data = await callCalendar(CAL_API, 'POST', buildEventBody(fields))
  return data.id
}

// Update an existing event in place (idempotent re-export).
export async function updateEvent(eventId, fields) {
  const url = `${CAL_API}/${encodeURIComponent(eventId)}`
  const data = await callCalendar(url, 'PATCH', buildEventBody(fields))
  return data.id
}

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + n)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
