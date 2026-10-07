import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Card, DataTable, Filters, Kv, PageHeader, Related, Empty, RecordLink } from '../components/ui'
import { openCreate } from '../components/create'
import { useColl, patchItem } from '../services/store'
import { fmtDate, money, sum } from '../utils/format'
import { nameOf, volunteerName } from '../utils/links'

export function Events() {
  const evs = useColl('events'); const nav = useNavigate(); const [f, setF] = useState<'Upcoming' | 'Past' | 'All'>('Upcoming')
  const rows = evs.filter(e => f === 'All' || (f === 'Upcoming') === (e.date >= '2026-10-07')).sort((a, b) => a.date.localeCompare(b.date))
  return (<>
    <PageHeader title="Events" subtitle="Reavers organizational events (tournament competition management lives in BuhurtOS)" actions={<button className="btn primary" onClick={() => openCreate('event')}>+ Create Event</button>} />
    <Filters options={['Upcoming', 'Past', 'All'] as const} value={f} onChange={setF} /><div style={{ height: '.6rem' }} />
    <DataTable rows={rows} onRow={e => nav(`/events/${e.id}`)} cols={[
      { key: 'd', label: 'Date', render: e => fmtDate(e.date) }, { key: 'n', label: 'Event', render: e => <b>{e.name}</b> }, { key: 't', label: 'Type', render: e => e.type }, { key: 'l', label: 'Location', render: e => e.location },
      { key: 'o', label: 'Organizer', render: e => nameOf(e.organizerId) }, { key: 'b', label: 'Budget', render: e => money(e.budget) }, { key: 's', label: 'Status', render: e => <Badge>{e.status}</Badge> }]} />
  </>)
}
export function EventDetail() {
  const { id } = useParams(); const e = useColl('events').find(x => x.id === id); const eq = useColl('equipment'); const sp = useColl('sponsors'); const logs = useColl('volunteerLogs'); const tx = useColl('transactions')
  if (!e) return <Empty>Not found. <Link to="/events">Back</Link></Empty>
  const spent = sum(tx.filter(t => t.amount < 0 && t.related?.type === 'event' && t.related.id === e.id).map(t => -t.amount))
  const hours = sum(logs.filter(l => l.eventId === e.id).map(l => l.hours))
  return (<>
    <PageHeader title={e.name} subtitle={`${fmtDate(e.date)} · ${e.location}`} actions={<><button className="btn" onClick={() => openCreate('task', { related: 'event:' + e.id })}>+ Task</button><button className="btn" onClick={() => openCreate('document', { related: 'event:' + e.id, category: 'Events' })}>+ Document</button><Link className="btn orange" to="/social/composer">Social post</Link><Link className="btn" to="/events">← All</Link></>} />
    <div className="grid g2"><div>
      <Card title="Overview"><Kv k="Type" v={e.type} /><Kv k="Status" v={<Badge>{e.status}</Badge>} /><Kv k="Organizer" v={nameOf(e.organizerId)} /><Kv k="Budget" v={money(e.budget)} /><Kv k="Spent (linked)" v={money(spent)} /><Kv k="Attendance" v={e.attendance ?? '—'} /><Kv k="Volunteer hours" v={hours} />
        <Kv k="Social campaign" v={e.campaignId ? <RecordLink r={{ type: 'campaign', id: e.campaignId }} /> : '—'} /></Card>
      <Card title="Volunteers"><div className="chips">{e.volunteerIds.map(v => <span key={v} className="chip">{volunteerName(v)}</span>)}{!e.volunteerIds.length && <Empty>None yet.</Empty>}</div></Card>
      <Card title="Equipment"><div className="chips">{e.equipmentIds.map(i => <RecordLink key={i} r={{ type: 'equipment', id: i }} />)}{!e.equipmentIds.length && <Empty>None.</Empty>}</div>{eq.length === 0 && null}</Card>
      <Card title="Sponsors"><div className="chips">{e.sponsorIds.map(s => <RecordLink key={s} r={{ type: 'sponsor', id: s }} />)}{!e.sponsorIds.length && <Empty>None.</Empty>}</div>{sp.length === 0 && null}</Card>
    </div><div>
      <Card title="Final report"><textarea className="input" rows={4} defaultValue={e.finalReport} placeholder="Write the event results…" onBlur={ev => patchItem('events', e.id, { finalReport: ev.target.value })} /></Card>
      <Card title="Notes"><textarea className="input" rows={3} defaultValue={e.notes} onBlur={ev => patchItem('events', e.id, { notes: ev.target.value })} /></Card>
      <Related type="event" id={e.id} />
    </div></div>
  </>)
}
