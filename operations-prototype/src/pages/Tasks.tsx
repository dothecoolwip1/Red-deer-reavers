import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, DataTable, Filters, PageHeader, RecordLink, SearchBox } from '../components/ui'
import { openCreate } from '../components/create'
import { useColl, useSession } from '../services/store'
import { taskService } from '../services/ops'
import { fmtDate, dueLabel } from '../utils/format'
import { nameOf } from '../utils/links'

const V = ['My Tasks', 'All Tasks', 'Overdue', 'Completed'] as const
// Prototype: "me" is Alex Hartwell (m1), the Administrator; non-admin roles map to a plausible person.
const meFor = (role: string) => ({ Treasurer: 'm2', Secretary: 'm3', Coach: 'm4', 'Social Media Manager': 'm6', 'Team Lead': 'm7', Volunteer: 'm9', Member: 'm8' } as Record<string, string>)[role] ?? 'm1'
export default function Tasks() {
  const tasks = useColl('tasks'); const { role } = useSession(); const me = meFor(role)
  const [v, setV] = useState<typeof V[number]>('My Tasks'); const [q, setQ] = useState(''); const [cat, setCat] = useState('All')
  const cats = ['All', ...new Set(tasks.map(t => t.category))]
  const rows = useMemo(() => tasks.filter(t => (v === 'My Tasks' ? t.assigneeId === me && t.status !== 'Done' : v === 'All Tasks' ? true : v === 'Overdue' ? t.status !== 'Done' && t.due < '2026-10-07' : t.status === 'Done')
    && (cat === 'All' || t.category === cat) && t.title.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.due.localeCompare(b.due)), [tasks, v, q, cat, me])
  return (<>
    <PageHeader title="Tasks" subtitle={`Viewing as ${nameOf(me)}`} actions={<button className="btn primary" onClick={() => openCreate('task')}>+ Create Task</button>} />
    <div className="row wrap" style={{ marginBottom: '.6rem' }}><Filters options={V} value={v} onChange={setV} /><select className="input" style={{ width: 'auto' }} value={cat} onChange={e => setCat(e.target.value)}>{cats.map(c => <option key={c}>{c}</option>)}</select><SearchBox value={q} onChange={setQ} /></div>
    <DataTable rows={rows} cols={[
      { key: 'done', label: 'Done', render: t => <input type="checkbox" checked={t.status === 'Done'} onChange={() => taskService.toggle(t.id)} aria-label="complete" /> },
      { key: 't', label: 'Task', render: t => <><b>{t.title}</b>{t.notes && <div className="muted">{t.notes}</div>}{t.category === 'Social' && t.status !== 'Done' && <div><Link className="btn sm orange" to="/social/composer">Open composer</Link></div>}</> },
      { key: 'a', label: 'Assignee', render: t => nameOf(t.assigneeId) }, { key: 'd', label: 'Due', render: t => <>{fmtDate(t.due)} {t.status !== 'Done' && <Badge tone={t.due < '2026-10-07' ? 'bad' : 'info'}>{dueLabel(t.due)}</Badge>}</> },
      { key: 'p', label: 'Priority', render: t => <Badge>{t.priority}</Badge> }, { key: 's', label: 'Status', render: t => <select className="input" value={t.status} onChange={e => taskService.setStatus(t.id, e.target.value as any)}><option>Open</option><option>In Progress</option><option>Done</option></select> },
      { key: 'c', label: 'Category', render: t => t.category }, { key: 'r', label: 'Related', render: t => <RecordLink r={t.related} /> }]} empty="No tasks in this view." />
  </>)
}
