import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Card, DataTable, Kv, PageHeader, Related, Empty, RecordLink, Tabs } from '../components/ui'
import { openCreate } from '../components/create'
import { useColl, patchItem, uid, toast } from '../services/store'
import { fmtDate } from '../utils/format'
import { nameOf } from '../utils/links'

export function Meetings() {
  const ms = useColl('meetings'); const nav = useNavigate()
  return (<><PageHeader title="Meetings" actions={<><Link className="btn" to="/agm">AGM →</Link><button className="btn primary" onClick={() => openCreate('meeting')}>+ Create Meeting</button></>} />
    <DataTable rows={[...ms].sort((a, b) => b.date.localeCompare(a.date))} onRow={m => nav(`/meetings/${m.id}`)} cols={[{ key: 'd', label: 'Date', render: m => fmtDate(m.date) }, { key: 't', label: 'Meeting', render: m => <b>{m.title}</b> }, { key: 'y', label: 'Type', render: m => <Badge tone="info">{m.type}</Badge> }, { key: 'a', label: 'Attendees', render: m => m.attendeeIds.length }, { key: 'm', label: 'Motions', render: m => m.motions.length }, { key: 'i', label: 'Action items', render: m => `${m.actionItems.filter(a => a.done).length}/${m.actionItems.length}` }]} /></>)
}
const T = ['Agenda', 'Attendance', 'Motions & votes', 'Action items', 'Minutes'] as const
export function MeetingDetail() {
  const { id } = useParams(); const m = useColl('meetings').find(x => x.id === id); const members = useColl('members'); const docs = useColl('docs')
  const [tab, setTab] = useState<typeof T[number]>('Agenda')
  if (!m) return <Empty>Not found. <Link to="/meetings">Back</Link></Empty>
  const upd = (p: any) => patchItem('meetings', m.id, p)
  const addMotion = () => { const text = prompt('Motion text'); if (text) upd({ motions: [...m.motions, { id: uid('mo'), text, movedBy: 'You', status: 'Pending' }] }) }
  const vote = (i: number) => { const yes = Number(prompt('Votes for', '5')), no = Number(prompt('Votes against', '1')); upd({ motions: m.motions.map((x, j) => j === i ? { ...x, votes: { yes, no, abstain: 0 }, status: yes > no ? 'Carried' : 'Defeated' } : x) }); toast('Vote recorded') }
  return (<>
    <PageHeader title={m.title} subtitle={`${fmtDate(m.date)} ${m.time} · ${m.location}`} actions={<><Badge tone="info">{m.type}</Badge><button className="btn" onClick={() => openCreate('document', { related: 'meeting:' + m.id, category: 'Meeting Minutes' })}>+ Document</button><Link className="btn" to="/meetings">← All</Link></>} />
    <Tabs tabs={T} value={tab} onChange={setTab} />
    {tab === 'Agenda' && <div className="grid g2"><Card title="Agenda"><ol>{m.agenda.map(a => <li key={a}>{a}</li>)}</ol><button className="btn sm" onClick={() => { const a = prompt('Agenda item'); if (a) upd({ agenda: [...m.agenda, a] }) }}>+ item</button></Card><div><Card title="Notes"><textarea className="input" rows={4} defaultValue={m.notes} onBlur={e => upd({ notes: e.target.value })} /></Card><Related type="meeting" id={m.id} /></div></div>}
    {tab === 'Attendance' && <Card title={`Attendees (${m.attendeeIds.length})`}><ul className="list">{members.filter(x => x.status === 'Active').map(x => <li key={x.id}><span>{x.name}</span><button className={'btn sm ' + (m.attendeeIds.includes(x.id) ? 'primary' : '')} onClick={() => upd({ attendeeIds: m.attendeeIds.includes(x.id) ? m.attendeeIds.filter(i => i !== x.id) : [...m.attendeeIds, x.id] })}>{m.attendeeIds.includes(x.id) ? '✓ present' : 'mark present'}</button></li>)}</ul></Card>}
    {tab === 'Motions & votes' && <Card title="Motions" actions={<button className="btn sm" onClick={addMotion}>+ Motion</button>}>{m.motions.length ? <ul className="list">{m.motions.map((x, i) => <li key={x.id}><span>{x.text}<br /><span className="muted">moved by {x.movedBy}{x.votes && ` · ${x.votes.yes}-${x.votes.no}-${x.votes.abstain}`}</span></span><span className="row"><Badge>{x.status}</Badge><button className="btn sm" onClick={() => vote(i)}>Record vote</button></span></li>)}</ul> : <Empty>No motions.</Empty>}</Card>}
    {tab === 'Action items' && <Card title="Action items" actions={<button className="btn sm" onClick={() => { const t = prompt('Action item'); if (t) upd({ actionItems: [...m.actionItems, { text: t, ownerId: 'm1', done: false }] }) }}>+ item</button>}><ul className="list">{m.actionItems.map((a, i) => <li key={i}><label><input type="checkbox" checked={a.done} onChange={() => upd({ actionItems: m.actionItems.map((x, j) => j === i ? { ...x, done: !x.done } : x) })} /> {a.text}</label><span className="muted">{nameOf(a.ownerId)}</span></li>)}</ul></Card>}
    {tab === 'Minutes' && <div className="grid g2"><Card title="Minutes"><textarea className="input" rows={10} defaultValue={m.minutes} placeholder="Write minutes…" onBlur={e => upd({ minutes: e.target.value })} /></Card><Card title="Documents">{docs.filter(d => d.related?.type === 'meeting' && d.related.id === m.id).map(d => <p key={d.id}><RecordLink r={{ type: 'document', id: d.id }} /></p>)}{m.minutesDocId && <p>Minutes file: <RecordLink r={{ type: 'document', id: m.minutesDocId }} /></p>}</Card></div>}
    {tab === 'Agenda' && null}{false && <Kv k="" v="" />}
  </>)
}
