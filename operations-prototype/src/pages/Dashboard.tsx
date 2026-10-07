import { Link } from 'react-router-dom'
import { Card, Stat, Progress, Badge, PageHeader, RecordLink } from '../components/ui'
import { openCreate, type CreateKind } from '../components/create'
import { useColl } from '../services/store'
import { financeService, volunteerHoursTotal } from '../services/ops'
import { postReach, postEngagement } from '../services/social'
import { money, num, sum, fmtDate, dueLabel, daysUntil } from '../utils/format'
import { complianceStatus } from '../utils/status'

const quick: [string, CreateKind][] = [['Add Member', 'member'], ['Add Expense', 'expense'], ['Upload Receipt', 'receipt'], ['Create Practice', 'practice'], ['Create Event', 'event'], ['Create Task', 'task'], ['Add Sponsor', 'sponsor'], ['Add Grant', 'grant'], ['Create Fundraiser', 'fundraiser'], ['Create Meeting', 'meeting'], ['Upload Document', 'document']]

export default function Dashboard() {
  const members = useColl('members'), practices = useColl('practices'), events = useColl('events'), meetings = useColl('meetings'), tasks = useColl('tasks')
  const sponsors = useColl('sponsors'), grants = useColl('grants'), expenses = useColl('expenses'), comp = useColl('compliance'), eq = useColl('equipment')
  const docs = useColl('docs'), posts = useColl('socialPosts'), fund = useColl('fundraisers'); useColl('transactions'); useColl('volunteerLogs')
  const fin = financeService.totals()
  const t = '2026-10-07'
  const raised = sum(fund.flatMap(f => f.donations.map(d => d.amount))), goal = sum(fund.map(f => f.goal))
  const openTasks = tasks.filter(x => x.status !== 'Done')
  const published = posts.filter(p => p.status === 'Published')
  return (
    <>
      <PageHeader title="Organization Dashboard" subtitle="Red Deer Reavers — everything the nonprofit runs on, in one place. (Mock data, today = Oct 7, 2026)" />
      <Card title="Quick actions"><div className="row wrap">{quick.map(([l, k]) => <button key={k} className="btn" onClick={() => openCreate(k)}>+ {l}</button>)}<Link className="btn orange" to="/social/composer">+ Create Social Post</Link></div></Card>
      <div className="grid g4" style={{ marginBottom: '.8rem' }}>
        <Stat label="Active members" value={members.filter(m => m.status === 'Active').length} sub={`${members.filter(m => m.status === 'Pending').length} pending`} to="/members" />
        <Stat label="Open tasks" value={openTasks.length} sub={`${openTasks.filter(x => x.due < t).length} overdue`} to="/tasks" tone={openTasks.some(x => x.due < t) ? 'bad' : ''} />
        <Stat label="Volunteer hours (2026)" value={volunteerHoursTotal()} to="/volunteers" />
        <Stat label="Current balance" value={money(fin.balance)} sub="mock" to="/finance" />
        <Stat label="Annual budget" value={money(24000)} to="/finance/budget" />
        <Stat label="Fundraising" value={`${money(raised)}`} sub={`of ${money(goal)} goal`} to="/fundraising" />
        <Stat label="Pending reimbursements" value={expenses.filter(e => ['Submitted', 'Treasurer Review', 'Approved'].includes(e.status)).length} to="/finance/reimbursements" />
        <Stat label="Equipment problems" value={eq.filter(e => e.issue).length} to="/equipment" tone="bad" />
      </div>
      <div className="grid g3">
        <Card title="Upcoming practices" actions={<Link to="/practices">all</Link>}><ul className="list">{practices.filter(p => p.date >= t).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4).map(p => <li key={p.id}><Link to={`/practices/${p.id}`}>{fmtDate(p.date)} · {p.title}</Link><span className="muted">{p.focus}</span></li>)}</ul></Card>
        <Card title="Upcoming events" actions={<Link to="/events">all</Link>}><ul className="list">{events.filter(e => e.date >= t).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4).map(e => <li key={e.id}><Link to={`/events/${e.id}`}>{e.name}</Link><span className="muted">{fmtDate(e.date)}</span></li>)}</ul></Card>
        <Card title="Upcoming meetings" actions={<Link to="/meetings">all</Link>}><ul className="list">{meetings.filter(e => e.date >= t).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4).map(e => <li key={e.id}><Link to={`/meetings/${e.id}`}>{e.title}</Link><span className="muted">{fmtDate(e.date)}</span></li>)}</ul></Card>
        <Card title="Grant deadlines" actions={<Link to="/grants">all</Link>}><ul className="list">{grants.filter(g => g.deadline >= t && ['Researching', 'Eligible', 'Planning', 'Drafting', 'Ready'].includes(g.status)).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 4).map(g => <li key={g.id}><Link to={`/grants/${g.id}`}>{g.name.replace(' (MOCK)', '')}</Link><Badge tone={daysUntil(g.deadline) < 14 ? 'bad' : 'warn'}>{dueLabel(g.deadline)}</Badge></li>)}</ul></Card>
        <Card title="Compliance deadlines" actions={<Link to="/compliance">all</Link>}><ul className="list">{comp.filter(c => !c.complete).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4).map(c => <li key={c.id}><span>{c.title}</span><Badge>{complianceStatus(c)}</Badge></li>)}</ul></Card>
        <Card title="Sponsors" actions={<Link to="/sponsors">all</Link>}>
          <div className="row wrap"><Badge tone="good">{sponsors.filter(s => s.status === 'Active').length} active</Badge><Badge tone="warn">{sponsors.filter(s => s.status === 'Renewal Due').length} renewal due</Badge><Badge tone="info">{sponsors.filter(s => ['Prospect', 'Contacted', 'Interested', 'Negotiating'].includes(s.status)).length} in pipeline</Badge></div>
          <p>Active value: <b>{money(sum(sponsors.filter(s => ['Active', 'Renewal Due'].includes(s.status)).map(s => s.value)))}</b></p></Card>
        <Card title="Fundraising progress"><Progress value={Math.round(raised / goal * 100)} label={`${money(raised)} / ${money(goal)}`} /></Card>
        <Card title="Recent documents" actions={<Link to="/documents">all</Link>}><ul className="list">{docs.filter(d => d.lastOpened).sort((a, b) => b.lastOpened!.localeCompare(a.lastOpened!)).slice(0, 4).map(d => <li key={d.id}><Link to="/documents">{d.title}</Link><span className="muted">{d.fileType}</span></li>)}</ul></Card>
        <Card title="Social snapshot" actions={<Link to="/social/analytics">analytics</Link>}>
          <div className="row wrap"><Badge tone="good">{published.length} published</Badge><Badge tone="warn">{posts.filter(p => p.status === 'Scheduled').length} scheduled</Badge><Badge>{posts.filter(p => p.status === 'Review').length} in review</Badge></div>
          <p>Published-post reach: <b>{num(sum(published.map(postReach)))}</b> · engagement <b>{num(sum(published.map(postEngagement)))}</b></p>
          <ul className="list">{published.slice(0, 2).map(p => <li key={p.id}><RecordLink r={{ type: 'post', id: p.id }} /></li>)}</ul></Card>
      </div>
      <Card title="Scheduled posts"><ul className="list">{posts.filter(p => p.status === 'Scheduled').map(p => <li key={p.id}><Link to={`/social/posts/${p.id}`}>{p.title}</Link><span className="muted">{p.scheduledFor}</span></li>)}</ul></Card>
    </>
  )
}
