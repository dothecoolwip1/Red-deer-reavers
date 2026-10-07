import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, Kv, PageHeader, Stat, Tabs, Mock, RecordLink, Empty, DataTable } from '../components/ui'
import { useAgmState, useColl, patchAgm, toast, uid } from '../services/store'
import { fmtDate, daysUntil, money } from '../utils/format'
import { nameOf } from '../utils/links'
import type { AttendanceMethod } from '../types'

const T = ['Overview & RSVP', 'Attendance', 'Nominations', 'Agenda', 'Motions & voting', 'Reports & documents', 'Minutes'] as const
const M: AttendanceMethod[] = ['In Person', 'Video Call', 'Proxy', 'Not Attending']
export default function Agm() {
  const a = useAgmState(); const members = useColl('members'); const docs = useColl('docs'); const [tab, setTab] = useState<typeof T[number]>('Overview & RSVP'); const [me, setMe] = useState('m1')
  const voters = members.filter(m => m.canVote); const count = (x: string) => Object.values(a.rsvp).filter(v => v === x).length
  const offices = ['President', 'Secretary', 'Treasurer']
  return (<>
    <PageHeader title="2026 Annual General Meeting" subtitle={`${fmtDate(a.date)} · ${a.time} · ${a.location}`} actions={<><Badge tone="warn">in {daysUntil(a.date)} days</Badge><Link className="btn" to="/meetings/mt3">Meeting record</Link></>} />
    <Mock>UI only: no real voting, identity checks or security.</Mock>
    <Tabs tabs={T} value={tab} onChange={setTab} />
    {tab === 'Overview & RSVP' && <><div className="grid g4"><Stat label="Voting eligible" value={voters.length} /><Stat label="In person" value={count('In Person')} /><Stat label="Video" value={count('Video Call')} /><Stat label="Proxy" value={count('Proxy')} sub={`${count('Not Attending')} not attending`} /></div>
      <Card title="RSVP (pick who you are)"><select className="input" style={{ maxWidth: 260, marginBottom: '.5rem' }} value={me} onChange={e => setMe(e.target.value)}>{members.filter(m => m.status === 'Active').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        <div className="row wrap">{M.map(x => <button key={x} className={'btn ' + (a.rsvp[me] === x ? 'primary' : '')} onClick={() => { patchAgm(s => ({ ...s, rsvp: { ...s.rsvp, [me]: x } })); toast(`RSVP: ${x}`) }}>{x}</button>)}</div><p className="muted">Current: {a.rsvp[me] ?? 'No Response'} · {members.find(m => m.id === me)?.canVote ? 'eligible to vote' : 'NOT eligible to vote (dues/status)'}</p></Card></>}
    {tab === 'Attendance' && <Card title={`Check-in (${a.checkedIn.length} present)`}><ul className="list">{members.filter(m => m.status !== 'Expired').map(m => <li key={m.id}><span>{m.name} <Badge>{a.rsvp[m.id] ?? 'No Response'}</Badge> {!m.canVote && <Badge tone="bad">no vote</Badge>}</span><button className={'btn sm ' + (a.checkedIn.includes(m.id) ? 'primary' : '')} onClick={() => patchAgm(s => ({ ...s, checkedIn: s.checkedIn.includes(m.id) ? s.checkedIn.filter(x => x !== m.id) : [...s.checkedIn, m.id] }))}>{a.checkedIn.includes(m.id) ? '✓ checked in' : 'Check in'}</button></li>)}</ul></Card>}
    {tab === 'Nominations' && <div className="grid g3">{offices.map(o => <Card key={o} title={o} actions={<button className="btn sm" onClick={() => { const id = prompt('Nominee member id (e.g. m4)'); if (id) patchAgm(s => ({ ...s, nominations: [...s.nominations, { id: uid('n'), office: o, nomineeId: id, by: me, accepted: false }] })) }}>+ Nominate</button>}>
      <ul className="list">{a.nominations.filter(n => n.office === o).map(n => <li key={n.id}><span>{nameOf(n.nomineeId)}<br /><span className="muted">nominated by {nameOf(n.by)}</span></span>{n.accepted ? <Badge tone="good">Accepted</Badge> : <button className="btn sm" onClick={() => patchAgm(s => ({ ...s, nominations: s.nominations.map(x => x.id === n.id ? { ...x, accepted: true } : x) }))}>Accept (as nominee)</button>}</li>)}</ul>{!a.nominations.some(n => n.office === o) && <Empty>No nominations.</Empty>}</Card>)}</div>}
    {tab === 'Agenda' && <Card title="Agenda"><ol>{a.agenda.map(x => <li key={x}>{x}</li>)}</ol></Card>}
    {tab === 'Motions & voting' && <Card title="Motions" actions={<button className="btn sm" onClick={() => { const t = prompt('Motion'); if (t) patchAgm(s => ({ ...s, motions: [...s.motions, { id: uid('am'), text: t, status: 'Pending', yes: 0, no: 0, abstain: 0 }] })) }}>+ Motion</button>}>
      <ul className="list">{a.motions.map(m => <li key={m.id} style={{ flexWrap: 'wrap' }}><span>{m.text}</span><span className="row wrap"><Badge>{m.status}</Badge>
        {(['yes', 'no', 'abstain'] as const).map(k => <button key={k} className="btn sm" onClick={() => patchAgm(s => ({ ...s, motions: s.motions.map(x => x.id === m.id ? { ...x, [k]: x[k] + 1, status: 'Pending' } : x) }))}>{k} {m[k]}</button>)}
        <button className="btn sm primary" onClick={() => patchAgm(s => ({ ...s, motions: s.motions.map(x => x.id === m.id ? { ...x, status: x.yes > x.no ? 'Carried' : 'Defeated' } : x) }))}>Close vote</button></span></li>)}</ul></Card>}
    {tab === 'Reports & documents' && <div className="grid g2"><Card title="Reports"><Kv k="Financial report" v={<Link to="/finance">Open Finance dashboard</Link>} /><Kv k="Annual report" v={<Link to="/annual-report">Open Annual Report builder</Link>} /><Kv k="Financial audit" v="Pending member review (mock)" /><Kv k="Balance (mock)" v={money(8214)} /></Card>
      <Card title="Documents">{docs.filter(d => ['AGM', 'Finance'].includes(d.category)).map(d => <p key={d.id}><RecordLink r={{ type: 'document', id: d.id }} /></p>)}<h3>Previous minutes</h3><RecordLink r={{ type: 'document', id: 'd7' }} /></Card></div>}
    {tab === 'Minutes' && <Card title="AGM minutes (draft)"><textarea className="input" rows={10} value={a.minutesDraft} placeholder="Minutes of the 2026 AGM…" onChange={e => patchAgm(s => ({ ...s, minutesDraft: e.target.value }))} /></Card>}
    {false && <DataTable rows={[]} cols={[]} />}
  </>)
}
