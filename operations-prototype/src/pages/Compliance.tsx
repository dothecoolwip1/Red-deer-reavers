import { useState } from 'react'
import { Badge, DataTable, Filters, PageHeader, Stat } from '../components/ui'
import { openCreate } from '../components/create'
import { useColl, patchItem } from '../services/store'
import { complianceStatus, type CStatus } from '../utils/status'
import { fmtDate, dueLabel } from '../utils/format'

const F = ['All', 'Upcoming', 'Due Soon', 'Overdue', 'Complete'] as const
export default function Compliance() {
  const cs = useColl('compliance'); const [f, setF] = useState<typeof F[number]>('All')
  const rows = cs.filter(c => f === 'All' || complianceStatus(c) === f).sort((a, b) => a.due.localeCompare(b.due)); const n = (s: CStatus) => cs.filter(c => complianceStatus(c) === s).length
  return (<><PageHeader title="Compliance Calendar" subtitle="Nonprofit deadlines in one list" actions={<button className="btn primary" onClick={() => openCreate('compliance')}>+ Add item</button>} />
    <div className="grid g4" style={{ marginBottom: '.7rem' }}><Stat label="Upcoming" value={n('Upcoming')} /><Stat label="Due soon (14d)" value={n('Due Soon')} /><Stat label="Overdue" value={n('Overdue')} tone="bad" /><Stat label="Complete" value={n('Complete')} /></div>
    <Filters options={F} value={f} onChange={setF} /><div style={{ height: '.6rem' }} />
    <DataTable rows={rows} cols={[{ key: 's', label: 'Status', render: c => <Badge>{complianceStatus(c)}</Badge> }, { key: 't', label: 'Item', render: c => <b>{c.title}</b> }, { key: 'c', label: 'Category', render: c => c.category }, { key: 'd', label: 'Due', render: c => <>{fmtDate(c.due)} {!c.complete && <span className="muted">({dueLabel(c.due)})</span>}</> }, { key: 'o', label: 'Owner', render: c => c.owner }, { key: 'n', label: 'Notes', render: c => c.notes }, { key: 'x', label: '', render: c => <button className="btn sm" onClick={() => patchItem('compliance', c.id, { complete: !c.complete })}>{c.complete ? 'Reopen' : 'Mark complete'}</button> }]} /></>)
}
