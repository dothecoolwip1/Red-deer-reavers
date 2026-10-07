import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Card, PageHeader, Progress, Related, Kv, Empty, RecordLink, DataTable, Stat } from '../components/ui'
import { openCreate } from '../components/create'
import { useColl, patchItem, toast } from '../services/store'
import { fundraiserStats } from '../services/ops'
import { postReach } from '../services/social'
import { fmtDate, money, sum, num } from '../utils/format'
import { nameOf, volunteerName, sponsorName } from '../utils/links'

export function Fundraising() {
  const fs = useColl('fundraisers'); useColl('transactions'); useColl('volunteerLogs'); const nav = useNavigate()
  return (<>
    <PageHeader title="Fundraising" actions={<button className="btn primary" onClick={() => openCreate('fundraiser')}>+ Create Fundraiser</button>} />
    <div className="grid g-cards">{fs.map(f => { const s = fundraiserStats(f.id); return (
      <Card key={f.id} title={<Link to={`/fundraising/${f.id}`}>{f.name}</Link>} actions={<Badge>{f.status}</Badge>}>
        <Progress value={s.pct} label={`${money(s.raised)} / ${money(f.goal)}`} />
        <Kv k="Expenses" v={money(s.expenses)} /><Kv k="Net proceeds" v={money(s.net)} /><Kv k="Organizer" v={nameOf(f.organizerId)} /><Kv k="Sponsors" v={f.sponsorIds.length} />
        <button className="btn sm" style={{ marginTop: '.4rem' }} onClick={() => nav(`/fundraising/${f.id}`)}>Open</button></Card>) })}</div>
  </>)
}
export function FundraiserDetail() {
  const { id } = useParams(); const f = useColl('fundraisers').find(x => x.id === id); const tx = useColl('transactions'); const logs = useColl('volunteerLogs'); const posts = useColl('socialPosts'); const grants = useColl('grants'); const tasks = useColl('tasks'); useColl('expenses')
  if (!f) return <Empty>Not found. <Link to="/fundraising">Back</Link></Empty>
  const s = fundraiserStats(f.id); const g = grants.find(x => x.id === f.grantId)
  const fx = tx.filter(t => t.amount < 0 && t.related?.type === 'fundraiser' && t.related.id === f.id)
  const fposts = posts.filter(p => p.fundraiserId === f.id)
  const addDonation = () => { const amt = Number(prompt('Donation amount ($)?', '100')); if (amt > 0) { patchItem('fundraisers', f.id, { donations: [...f.donations, { donor: 'New donation (mock)', amount: amt, date: '2026-10-07' }] }); toast('Donation added') } }
  return (<>
    <PageHeader title={f.name} subtitle={`${fmtDate(f.start)} → ${fmtDate(f.end)} · organizer ${nameOf(f.organizerId)}`} actions={<><button className="btn" onClick={addDonation}>+ Donation</button><button className="btn" onClick={() => openCreate('expense', { related: 'fundraiser:' + f.id })}>+ Expense</button><button className="btn" onClick={() => openCreate('task', { related: 'fundraiser:' + f.id })}>+ Task</button><Link className="btn orange" to="/social/composer">Promote</Link><Link className="btn" to="/fundraising">← All</Link></>} />
    <div className="grid g4" style={{ marginBottom: '.8rem' }}><Stat label="Raised" value={money(s.raised)} sub={`${s.pct}% of ${money(f.goal)}`} /><Stat label="Expenses" value={money(s.expenses)} /><Stat label="Net proceeds" value={money(s.net)} tone={s.net < 0 ? 'bad' : 'good'} /><Stat label="Volunteer hours" value={s.hours} /></div>
    <Progress value={s.pct} />
    <div className="grid g2" style={{ marginTop: '.8rem' }}><div>
      <Card title="Donations / income"><ul className="list">{f.donations.map((d, i) => <li key={i}><span>{d.donor} <span className="muted">{fmtDate(d.date)}</span></span><b>{money(d.amount)}</b></li>)}</ul></Card>
      <Card title="Expenses (linked to receipts)"><DataTable rows={fx} cols={[{ key: 'd', label: 'Date', render: t => fmtDate(t.date) }, { key: 'x', label: 'Description', render: t => t.description }, { key: 'a', label: 'Amount', render: t => money(-t.amount) }, { key: 'r', label: 'Receipt', render: t => t.receiptDocId ? <RecordLink r={{ type: 'document', id: t.receiptDocId }} /> : <Badge tone="bad">missing</Badge> }]} empty="No expenses." /></Card>
      <Card title="Funding">{g ? <p>Partially funded by <RecordLink r={{ type: 'grant', id: g.id }} /> — received {money(g.received)}</p> : <Empty>No grant linked.</Empty>}</Card>
    </div><div>
      <Card title="Sponsors"><div className="chips">{f.sponsorIds.map(sid => <RecordLink key={sid} r={{ type: 'sponsor', id: sid }} />)}</div></Card>
      <Card title="Volunteers"><div className="chips">{f.volunteerIds.map(v => <span className="chip" key={v}>{volunteerName(v)} ({sum(logs.filter(l => l.volunteerId === v && l.fundraiserId === f.id).map(l => l.hours))}h)</span>)}</div></Card>
      <Card title="Social posts & reach">{fposts.map(p => <p key={p.id}><RecordLink r={{ type: 'post', id: p.id }} /> <Badge>{p.status}</Badge> reach {num(postReach(p))}</p>)}{!fposts.length && <Empty>No posts.</Empty>}<b>Total reach: {num(sum(fposts.map(postReach)))}</b></Card>
      <Card title="Tasks">{tasks.filter(t => t.related?.id === f.id).map(t => <p key={t.id}>{t.title} <Badge>{t.status}</Badge></p>)}</Card>
      <Card title="Notes"><textarea className="input" rows={3} defaultValue={f.notes} onBlur={e => patchItem('fundraisers', f.id, { notes: e.target.value })} /></Card>
      <Related type="fundraiser" id={f.id} />
    </div></div>
  </>)
}
