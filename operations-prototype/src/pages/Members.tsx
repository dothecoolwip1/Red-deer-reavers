import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Card, DataTable, Filters, Kv, PageHeader, Related, SearchBox, Tabs, RecordLink, Empty } from '../components/ui'
import { openCreate } from '../components/create'
import { patchItem, useColl, toast } from '../services/store'
import { attendanceFor, memberHours } from '../services/ops'
import { fmtDate, money } from '../utils/format'
import { useTab } from '../components/ui'

const F = ['All', 'Active', 'Expired', 'Pending', 'Executive', 'Coach', 'Fighter', 'Volunteer'] as const
export function Members() {
  const members = useColl('members'); const nav = useNavigate()
  const [f, setF] = useState<typeof F[number]>('All'); const [q, setQ] = useState('')
  const rows = useMemo(() => members.filter(m => (f === 'All' || m.status === f || (m.tags as string[]).includes(f)) && m.name.toLowerCase().includes(q.toLowerCase())), [members, f, q])
  return (<>
    <PageHeader title="Members" subtitle={`${members.length} in registry`} actions={<button className="btn primary" onClick={() => openCreate('member')}>+ Add Member</button>} />
    <div className="row wrap" style={{ marginBottom: '.6rem' }}><SearchBox value={q} onChange={setQ} placeholder="Search members" /><Filters options={F} value={f} onChange={setF} /></div>
    <DataTable rows={rows} onRow={m => nav(`/members/${m.id}`)} cols={[
      { key: 'n', label: 'Name', render: m => <b>{m.name}</b> }, { key: 's', label: 'Status', render: m => <Badge>{m.status}</Badge> },
      { key: 'r', label: 'Role', render: m => m.orgRole }, { key: 't', label: 'Tags', render: m => m.tags.join(', ') || '—' },
      { key: 'd', label: 'Dues', render: m => <Badge>{m.duesStatus}</Badge> }, { key: 'v', label: 'Can vote', render: m => m.canVote ? 'Yes' : 'No' }, { key: 'e', label: 'Expires', render: m => fmtDate(m.expires) },
    ]} />
  </>)
}
const TABS = ['Overview', 'Contact & emergency', 'Waivers', 'Attendance', 'Volunteer', 'Equipment', 'Files', 'Notes'] as const
export function MemberDetail() {
  const { id } = useParams(); const m = useColl('members').find(x => x.id === id); const practices = useColl('practices'); const eq = useColl('equipment'); const docs = useColl('docs'); const logs = useColl('volunteerLogs'); const vols = useColl('volunteers')
  const [tab, setTab] = useTab(TABS)
  if (!m) return <Empty>Member not found. <Link to="/members">Back</Link></Empty>
  const att = attendanceFor(m.id); const v = vols.find(x => x.memberId === m.id)
  return (<>
    <PageHeader title={m.name} subtitle={<><Badge>{m.status}</Badge> {m.orgRole} · {m.tags.join(', ')}</>} actions={<><button className="btn" onClick={() => { patchItem('members', m.id, { status: 'Active', duesStatus: 'Paid', canVote: true }); toast('Marked active, dues paid (mock)') }}>Activate + mark dues paid</button><Link className="btn" to="/members">← All</Link></>} />
    <Tabs tabs={TABS} value={tab} onChange={setTab} />
    {tab === 'Overview' && <div className="grid g2"><Card title="Membership"><Kv k="Joined" v={fmtDate(m.joined)} /><Kv k="Expires" v={fmtDate(m.expires)} /><Kv k="Dues" v={<>{money(m.duesAmount)} <Badge>{m.duesStatus}</Badge></>} /><Kv k="Voting eligible" v={m.canVote ? 'Yes' : 'No'} /><Kv k="Role" v={m.orgRole} />
      <div className="row wrap" style={{ marginTop: '.5rem' }}><button className="btn sm" onClick={() => patchItem('members', m.id, { canVote: !m.canVote })}>Toggle voting eligibility</button></div></Card><Related type="member" id={m.id} /></div>}
    {tab === 'Contact & emergency' && <div className="grid g2"><Card title="Contact"><Kv k="Email" v={m.email} /><Kv k="Phone" v={m.phone} /></Card><Card title="Emergency contact (private)"><Kv k="Name" v={m.emergency.name} /><Kv k="Phone" v={m.emergency.phone || '—'} /><Kv k="Relation" v={m.emergency.relation || '—'} /></Card></div>}
    {tab === 'Waivers' && <Card title="Waivers">{m.waivers.map((w, i) => <Kv key={i} k={w.name} v={w.signed ? <Badge tone="good">Signed {fmtDate(w.date)}</Badge> : <button className="btn sm" onClick={() => patchItem('members', m.id, { waivers: m.waivers.map((x, j) => j === i ? { ...x, signed: true, date: '2026-10-07' } : x) })}>Mark signed (mock)</button>} />)}</Card>}
    {tab === 'Attendance' && <Card title={`Practice attendance: ${att.attended}/${att.total}`}><ul className="list">{practices.filter(p => p.date <= '2026-10-07').map(p => <li key={p.id}><Link to={`/practices/${p.id}`}>{fmtDate(p.date)} {p.title}</Link>{p.attendeeIds.includes(m.id) ? <Badge tone="good">Present</Badge> : <Badge tone="bad">Absent</Badge>}</li>)}</ul></Card>}
    {tab === 'Volunteer' && <Card title={`Volunteer hours: ${memberHours(m.id)}`}>{v ? <ul className="list">{logs.filter(l => l.volunteerId === v.id).map(l => <li key={l.id}><span>{fmtDate(l.date)} · {l.note}</span><b>{l.hours}h</b></li>)}</ul> : <Empty>Not registered as a volunteer.</Empty>}</Card>}
    {tab === 'Equipment' && <Card title="Assigned equipment">{eq.filter(e => e.assignedTo === m.id).map(e => <RecordLink key={e.id} r={{ type: 'equipment', id: e.id }} />)}{!eq.some(e => e.assignedTo === m.id) && <Empty>None assigned.</Empty>}</Card>}
    {tab === 'Files' && <Card title="Related files" actions={<button className="btn sm" onClick={() => openCreate('document', { related: 'member:' + m.id, category: 'Waivers' })}>Upload</button>}>{docs.filter(d => d.related?.type === 'member' && d.related.id === m.id).map(d => <p key={d.id}>📄 {d.title}</p>)}{!docs.some(d => d.related?.id === m.id) && <Empty>No files.</Empty>}</Card>}
    {tab === 'Notes' && <Card title="Notes"><textarea className="input" rows={4} defaultValue={m.notes} onBlur={e => patchItem('members', m.id, { notes: e.target.value })} /></Card>}
  </>)
}
