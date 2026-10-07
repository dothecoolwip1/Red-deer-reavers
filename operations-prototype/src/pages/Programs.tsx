import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Card, PageHeader, Progress, Related, Kv, Empty, RecordLink } from '../components/ui'
import { openCreate } from '../components/create'
import { useColl, patchItem } from '../services/store'
import { fmtDate, money, sum, pct } from '../utils/format'
import { nameOf } from '../utils/links'

export function Programs() {
  const ps = useColl('programs'); const nav = useNavigate()
  return (<>
    <PageHeader title="Programs & Development" subtitle="Youth, recruitment, outreach, development and volunteer programs" actions={<button className="btn primary" onClick={() => openCreate('program')}>+ Create Program</button>} />
    <div className="grid g-cards">{ps.map(p => { const done = p.milestones.filter(m => m.done).length; return (
      <Card key={p.id} title={<Link to={`/programs/${p.id}`}>{p.name}</Link>} actions={<Badge>{p.status}</Badge>}>
        <p className="muted">{p.goal}</p><Kv k="Owner" v={nameOf(p.ownerId)} /><Kv k="Participants" v={p.participantIds.length} /><Kv k="Budget" v={money(p.budget)} />
        <Progress value={pct(done, p.milestones.length)} label={`${done}/${p.milestones.length} milestones`} />
        <button className="btn sm" style={{ marginTop: '.5rem' }} onClick={() => nav(`/programs/${p.id}`)}>Open</button></Card>) })}</div>
  </>)
}
export function ProgramDetail() {
  const { id } = useParams(); const p = useColl('programs').find(x => x.id === id); const grants = useColl('grants'); const sponsors = useColl('sponsors'); const tasks = useColl('tasks'); const tx = useColl('transactions'); const camps = useColl('socialCampaigns')
  if (!p) return <Empty>Not found. <Link to="/programs">Back</Link></Empty>
  const spent = sum(tx.filter(t => t.amount < 0 && t.related?.type === 'program' && t.related.id === p.id).map(t => -t.amount))
  const toggleMs = (i: number) => patchItem('programs', p.id, { milestones: p.milestones.map((m, j) => j === i ? { ...m, done: !m.done } : m) })
  return (<>
    <PageHeader title={p.name} subtitle={p.goal} actions={<><button className="btn" onClick={() => openCreate('task', { related: 'program:' + p.id })}>+ Task</button><Link className="btn" to="/programs">← All</Link></>} />
    <div className="grid g2"><div>
      <Card title="Overview"><Kv k="Status" v={<Badge>{p.status}</Badge>} /><Kv k="Owner" v={nameOf(p.ownerId)} /><Kv k="Dates" v={`${fmtDate(p.start)} → ${fmtDate(p.end)}`} /><Kv k="Budget" v={money(p.budget)} /><Kv k="Spent (linked transactions)" v={money(spent)} /><Progress value={pct(spent, p.budget)} /></Card>
      <Card title="Milestones">{p.milestones.length ? <ul className="list">{p.milestones.map((m, i) => <li key={i}><label><input type="checkbox" checked={m.done} onChange={() => toggleMs(i)} /> {m.title}</label><span className="muted">{fmtDate(m.due)}</span></li>)}</ul> : <Empty />}</Card>
      <Card title="Participants"><div className="chips">{p.participantIds.map(m => <RecordLink key={m} r={{ type: 'member', id: m }} />)}{!p.participantIds.length && <Empty>None yet.</Empty>}</div></Card>
    </div><div>
      <Card title="Related grants">{grants.filter(g => g.programId === p.id).map(g => <p key={g.id}><RecordLink r={{ type: 'grant', id: g.id }} /> <Badge>{g.status}</Badge></p>)}</Card>
      <Card title="Sponsors / campaigns">{camps.filter(c => c.programId === p.id).map(c => <p key={c.id}><RecordLink r={{ type: 'campaign', id: c.id }} /> {c.sponsorIds.map(s => <RecordLink key={s} r={{ type: 'sponsor', id: s }} />)}</p>)}{sponsors.length === 0 && null}</Card>
      <Card title={`Tasks (${tasks.filter(t => t.related?.id === p.id).length})`}>{tasks.filter(t => t.related?.id === p.id).map(t => <p key={t.id}>{t.title} <Badge>{t.status}</Badge></p>)}</Card>
      <Card title="Notes"><textarea className="input" rows={3} defaultValue={p.notes} onBlur={e => patchItem('programs', p.id, { notes: e.target.value })} /></Card>
      <Related type="program" id={p.id} />
    </div></div>
  </>)
}
