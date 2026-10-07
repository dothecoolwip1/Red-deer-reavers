import { useMemo, useState } from 'react'
import { Card, DataTable, Filters, PageHeader, Stat, Bars, Tabs } from '../components/ui'
import { openCreate } from '../components/create'
import { useColl } from '../services/store'
import { fmtDate, sum, ym } from '../utils/format'
import { volunteerName } from '../utils/links'

const T = ['Volunteers', 'Hours log', 'Reports'] as const
const R = ['Month', 'Year', 'Event', 'Program'] as const
export default function Volunteers() {
  const vs = useColl('volunteers'); const logs = useColl('volunteerLogs'); const events = useColl('events'); const programs = useColl('programs')
  const [tab, setTab] = useState<typeof T[number]>('Volunteers'); const [by, setBy] = useState<typeof R[number]>('Month')
  const data = useMemo(() => {
    const g: Record<string, number> = {}
    for (const l of logs) { const k = by === 'Month' ? ym(l.date) : by === 'Year' ? l.date.slice(0, 4) : by === 'Event' ? (events.find(e => e.id === l.eventId)?.name ?? 'No event') : (programs.find(p => p.id === l.programId)?.name ?? 'No program'); g[k] = (g[k] ?? 0) + l.hours }
    return Object.entries(g).map(([k, v]) => ({ k, v })).sort((a, b) => by === 'Month' || by === 'Year' ? a.k.localeCompare(b.k) : b.v - a.v)
  }, [logs, by, events, programs])
  return (<>
    <PageHeader title="Volunteers" actions={<><button className="btn" onClick={() => openCreate('volunteerHours')}>+ Log hours</button><button className="btn primary" onClick={() => openCreate('volunteer')}>+ Add Volunteer</button></>} />
    <div className="grid g3" style={{ marginBottom: '.8rem' }}><Stat label="Volunteers" value={vs.length} /><Stat label="Total hours" value={sum(logs.map(l => l.hours))} /><Stat label="Entries" value={logs.length} /></div>
    <Tabs tabs={T} value={tab} onChange={setTab} />
    {tab === 'Volunteers' && <DataTable rows={vs} cols={[{ key: 'n', label: 'Volunteer', render: v => <b>{v.name}</b> }, { key: 'c', label: 'Contact', render: v => `${v.email} · ${v.phone}` }, { key: 'r', label: 'Roles', render: v => v.roles.join(', ') }, { key: 'i', label: 'Interests', render: v => v.interests.join(', ') }, { key: 'a', label: 'Availability', render: v => v.availability }, { key: 'q', label: 'Qualifications', render: v => v.qualifications.join(', ') || '—' }, { key: 'h', label: 'Hours', render: v => sum(logs.filter(l => l.volunteerId === v.id).map(l => l.hours)) }]} />}
    {tab === 'Hours log' && <DataTable rows={[...logs].sort((a, b) => b.date.localeCompare(a.date))} cols={[{ key: 'd', label: 'Date', render: l => fmtDate(l.date) }, { key: 'v', label: 'Volunteer', render: l => volunteerName(l.volunteerId) }, { key: 'h', label: 'Hours', render: l => l.hours }, { key: 'e', label: 'Event', render: l => events.find(e => e.id === l.eventId)?.name ?? '—' }, { key: 'p', label: 'Program', render: l => programs.find(p => p.id === l.programId)?.name ?? '—' }, { key: 'n', label: 'Note', render: l => l.note }]} />}
    {tab === 'Reports' && <Card title="Volunteer hours report"><Filters options={R} value={by} onChange={setBy} /><div style={{ height: '.6rem' }} /><Bars data={data} fmt={n => n + ' h'} /></Card>}
  </>)
}
