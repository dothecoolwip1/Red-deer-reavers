import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Card, DataTable, Filters, Kv, PageHeader, Progress, Related, Empty, RecordLink, Mock, Stat } from '../components/ui'
import { openCreate } from '../components/create'
import { useColl, patchItem } from '../services/store'
import { daysUntil, dueLabel, fmtDate, money, sum } from '../utils/format'
import { nameOf } from '../utils/links'
import type { GrantStatus } from '../types'

export const grantStatuses: GrantStatus[] = ['Researching', 'Eligible', 'Planning', 'Drafting', 'Ready', 'Submitted', 'Approved', 'Declined', 'Reporting Required', 'Complete']
const V = ['All Grants', 'Upcoming Deadlines', 'In Progress', 'Submitted', 'Awarded', 'Reporting Required'] as const
export function Grants() {
  const gs = useColl('grants'); const nav = useNavigate(); const [v, setV] = useState<typeof V[number]>('All Grants')
  const rows = useMemo(() => gs.filter(g => v === 'All Grants' ? true : v === 'Upcoming Deadlines' ? g.deadline >= '2026-10-07' && !['Submitted', 'Approved', 'Declined', 'Complete', 'Reporting Required'].includes(g.status) : v === 'In Progress' ? ['Researching', 'Eligible', 'Planning', 'Drafting', 'Ready'].includes(g.status) : v === 'Submitted' ? g.status === 'Submitted' : v === 'Awarded' ? g.received > 0 : g.status === 'Reporting Required').sort((a, b) => a.deadline.localeCompare(b.deadline)), [gs, v])
  return (<>
    <PageHeader title="Funding & Grants" actions={<><Link className="btn" to="/grant-builder">Grant Application Builder</Link><button className="btn primary" onClick={() => openCreate('grant')}>+ Add Grant</button></>} />
    <Mock>All grant programs here are MOCK examples, not real funders or real deadlines.</Mock>
    <div className="grid g4" style={{ marginBottom: '.8rem' }}><Stat label="Requested (active)" value={money(sum(gs.filter(g => ['Submitted', 'Ready', 'Drafting'].includes(g.status)).map(g => g.requested)))} /><Stat label="Awarded / received" value={money(sum(gs.map(g => g.received)))} /><Stat label="Open deadlines" value={gs.filter(g => g.deadline >= '2026-10-07' && ['Researching', 'Eligible', 'Planning', 'Drafting', 'Ready'].includes(g.status)).length} /><Stat label="Reporting due" value={gs.filter(g => g.status === 'Reporting Required').length} /></div>
    <Filters options={V} value={v} onChange={setV} /><div style={{ height: '.6rem' }} />
    <DataTable rows={rows} onRow={g => nav(`/grants/${g.id}`)} cols={[{ key: 'n', label: 'Grant', render: g => <b>{g.name}</b> }, { key: 'f', label: 'Funder', render: g => g.funder }, { key: 's', label: 'Status', render: g => <Badge>{g.status}</Badge> }, { key: 'd', label: 'Deadline', render: g => <>{fmtDate(g.deadline)} {['Submitted', 'Approved', 'Declined', 'Complete', 'Reporting Required'].includes(g.status) ? null : <Badge tone={daysUntil(g.deadline) < 14 ? 'bad' : 'info'}>{dueLabel(g.deadline)}</Badge>}</> }, { key: 'm', label: 'Max', render: g => money(g.max) }, { key: 'r', label: 'Received', render: g => money(g.received) }, { key: 'p', label: 'Progress', render: g => <Progress value={g.progress} /> }, { key: 'o', label: 'Owner', render: g => nameOf(g.ownerId) }]} />
  </>)
}
export function GrantDetail() {
  const { id } = useParams(); const g = useColl('grants').find(x => x.id === id); const tasks = useColl('tasks'); const docs = useColl('docs'); const funds = useColl('fundraisers')
  if (!g) return <Empty>Not found. <Link to="/grants">Back</Link></Empty>
  const upd = (p: any) => patchItem('grants', g.id, p)
  return (<>
    <PageHeader title={g.name} subtitle={g.funder} actions={<><select className="input" value={g.status} onChange={e => upd({ status: e.target.value })}>{grantStatuses.map(s => <option key={s}>{s}</option>)}</select><Link className="btn orange" to={`/grant-builder?grant=${g.id}`}>Open in builder</Link><button className="btn" onClick={() => openCreate('task', { related: 'grant:' + g.id })}>+ Task</button><Link className="btn" to="/grants">← All</Link></>} />
    <Mock>MOCK grant information.</Mock>
    <div className="grid g2"><div>
      <Card title="Details"><Kv k="Maximum funding" v={money(g.max)} /><Kv k="Deadline" v={fmtDate(g.deadline)} /><Kv k="Eligibility" v={g.eligibility} /><Kv k="Application owner" v={nameOf(g.ownerId)} /><Kv k="Related project" v={g.programId ? <RecordLink r={{ type: 'program', id: g.programId }} /> : '—'} /><Kv k="Matching requirement" v={g.matching} />
        <Kv k="Amount requested" v={money(g.requested)} /><Kv k="Amount received" v={money(g.received)} /><Kv k="Submission date" v={fmtDate(g.submitted)} /><Kv k="Reporting deadline" v={fmtDate(g.reportingDeadline)} /><p>Application progress</p><Progress value={g.progress} />
        <input type="range" min={0} max={100} value={g.progress} onChange={e => upd({ progress: Number(e.target.value) })} style={{ width: '100%' }} /></Card>
      <Card title="Requirements checklist"><ul className="list">{g.requirements.map((r, i) => <li key={i}><label><input type="checkbox" checked={r.done} onChange={() => upd({ requirements: g.requirements.map((x, j) => j === i ? { ...x, done: !x.done } : x) })} /> {r.text}</label></li>)}</ul>{!g.requirements.length && <Empty />}</Card>
    </div><div>
      <Card title="Tasks">{tasks.filter(t => t.related?.type === 'grant' && t.related.id === g.id).map(t => <p key={t.id}>{t.title} <Badge>{t.status}</Badge> <span className="muted">due {fmtDate(t.due)}</span></p>)}</Card>
      <Card title="Documents" actions={<button className="btn sm" onClick={() => openCreate('document', { related: 'grant:' + g.id, category: 'Grants' })}>Upload</button>}>{docs.filter(d => d.related?.id === g.id).map(d => <p key={d.id}>📄 {d.title}</p>)}</Card>
      <Card title="Money this funded">{funds.filter(f => f.grantId === g.id).map(f => <RecordLink key={f.id} r={{ type: 'fundraiser', id: f.id }} />)}</Card>
      <Card title="Notes"><textarea className="input" rows={3} defaultValue={g.notes} onBlur={e => upd({ notes: e.target.value })} /></Card>
      <Related type="grant" id={g.id} />
    </div></div>
  </>)
}
