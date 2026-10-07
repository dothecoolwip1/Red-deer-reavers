import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Card, DataTable, Filters, PageHeader, Related, Kv, Empty, Progress } from '../components/ui'
import { openCreate } from '../components/create'
import { useColl } from '../services/store'
import { practiceService } from '../services/ops'
import { fmtDate } from '../utils/format'
import { nameOf } from '../utils/links'

export function Practices() {
  const ps = useColl('practices'); const nav = useNavigate(); const [f, setF] = useState<'Upcoming' | 'Past'>('Upcoming')
  const rows = useMemo(() => ps.filter(p => (f === 'Upcoming') === (p.date >= '2026-10-07')).sort((a, b) => f === 'Upcoming' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)), [ps, f])
  return (<>
    <PageHeader title="Practices" actions={<button className="btn primary" onClick={() => openCreate('practice')}>+ Create Practice</button>} />
    <Filters options={['Upcoming', 'Past'] as const} value={f} onChange={setF} />
    <div style={{ height: '.6rem' }} />
    <DataTable rows={rows} onRow={p => nav(`/practices/${p.id}`)} cols={[
      { key: 'd', label: 'Date', render: p => <b>{fmtDate(p.date)}</b> }, { key: 't', label: 'Practice', render: p => p.title }, { key: 'h', label: 'Time', render: p => `${p.start}–${p.end}` },
      { key: 'l', label: 'Location', render: p => p.location }, { key: 'c', label: 'Coach', render: p => p.coachIds.map(nameOf).join(', ') }, { key: 'f', label: 'Focus', render: p => p.focus },
      { key: 'a', label: 'Attendance', render: p => `${p.attendeeIds.length} / ${p.expected}` }]} />
  </>)
}
export function PracticeDetail() {
  const { id } = useParams(); const p = useColl('practices').find(x => x.id === id); const members = useColl('members'); useColl('tasks'); useColl('docs')
  const [q, setQ] = useState('')
  if (!p) return <Empty>Not found. <Link to="/practices">Back</Link></Empty>
  const eligible = members.filter(m => m.status === 'Active' || m.status === 'Pending')
  return (<>
    <PageHeader title={p.title} subtitle={`${fmtDate(p.date)} · ${p.start}–${p.end} · ${p.location}`} actions={<><button className="btn" onClick={() => openCreate('task', { related: 'practice:' + p.id })}>+ Task</button><button className="btn" onClick={() => openCreate('document', { related: 'practice:' + p.id, category: 'Practices' })}>+ Document</button><Link className="btn" to="/practices">← All</Link></>} />
    <div className="grid g2">
      <Card title={`Check-in (${p.attendeeIds.length} / ${p.expected} expected)`}>
        <Progress value={Math.round(p.attendeeIds.length / Math.max(1, p.expected) * 100)} />
        <input className="input" placeholder="Filter names…" value={q} onChange={e => setQ(e.target.value)} style={{ margin: '.5rem 0' }} />
        <ul className="list">{eligible.filter(m => m.name.toLowerCase().includes(q.toLowerCase())).map(m => { const on = p.attendeeIds.includes(m.id); return <li key={m.id}><span>{m.name} {m.status === 'Pending' && <Badge>Pending</Badge>}</span><button className={'btn sm ' + (on ? 'primary' : '')} onClick={() => practiceService.toggleCheckIn(p.id, m.id)}>{on ? '✓ Here' : 'Check in'}</button></li> })}</ul>
      </Card>
      <div>
        <Card title="Plan"><Kv k="Coaches" v={p.coachIds.map(nameOf).join(', ')} /><Kv k="Training focus" v={p.focus} /><Kv k="Equipment" v={p.equipment.join(', ') || '—'} /><h3 style={{ marginTop: '.6rem' }}>Drills</h3><ol>{p.drills.map(d => <li key={d}>{d}</li>)}</ol><p className="muted">{p.notes || 'No notes.'}</p></Card>
        <Related type="practice" id={p.id} />
      </div>
    </div>
  </>)
}
