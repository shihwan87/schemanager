import { useState, useEffect } from 'react'
import { PinGate } from './components/PinGate'
import { Dashboard } from './components/Dashboard'
import { ConfigTab } from './components/ConfigTab'
import { TabBar } from './components/TabBar'
import { useTabMarkers, markerFor } from './hooks/useTabMarkers'

const TAB_KEY = 'schemanager.activeTab'

export default function App() {
  const [tab, setTab] = useState(() => sessionStorage.getItem(TAB_KEY) || 'work')
  const markers = useTabMarkers()

  useEffect(() => { sessionStorage.setItem(TAB_KEY, tab) }, [tab])

  const tabMarkers = {
    work:     markerFor(markers.work.minDays),
    personal: markerFor(markers.personal.minDays),
    config:   markers.openRequests > 0 ? 'bang' : null,
  }

  return (
    <PinGate>
      <TabBar active={tab} onChange={setTab} markers={tabMarkers} />
      <div style={{ paddingTop: 60 }}>
        {tab === 'work'     && <Dashboard scope="work"     title="Work"     itemNoun="Project" />}
        {tab === 'personal' && <Dashboard scope="personal" title="Personal" itemNoun="Item" />}
        {tab === 'config'   && <ConfigTab />}
      </div>
    </PinGate>
  )
}
