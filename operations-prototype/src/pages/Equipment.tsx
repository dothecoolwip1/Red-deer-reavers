import { useState } from 'react'
import { Badge, DataTable, Filters, PageHeader, Stat, Modal } from '../components/ui'
import { openCreate } from '../components/create'
import { useColl, patchItem } from '../services/store'
import { equipmentService } from '../services/ops'
import { fmtDate, money, sum } from '../utils/format'
import { nameOf } from '../utils/links'

const C = ['All', 'Loaner Armour', 'Weapons', 'Shields', 'Training Equipment', 'Event Equipment', 'Electronics', 'Club Property']
export default function Equipment() {
  const eq = useColl('equipment'); const members = useColl('members'); const [cat, setCat] = useState('All'); const [co, setCo] = useState<string | null>(null)
  const rows = eq.filter(e => cat === 'All' || e.category === cat)
  return (<><PageHeader title="Equipment & Assets" actions={<button className="btn primary" onClick={() => openCreate('equipment')}>+ Add Equipment</button>} />
    <div className="grid g4" style={{ marginBottom: '.7rem' }}><Stat label="Items" value={sum(eq.map(e => e.qty))} /><Stat label="Total value" value={money(sum(eq.map(e => e.value * e.qty)))} /><Stat label="Replacement value" value={money(sum(eq.map(e => e.replacement * e.qty)))} /><Stat label="With problems" value={eq.filter(e => e.issue).length} tone="bad" /></div>
    <Filters options={C as any} value={cat as any} onChange={setCat as any} /><div style={{ height: '.6rem' }} />
    <DataTable rows={rows} cols={[{ key: 'n', label: 'Item', render: e => <><b>{e.name}</b>{e.issue && <div><Badge tone="bad">⚠ {e.issue}</Badge></div>}</> }, { key: 'c', label: 'Category', render: e => e.category }, { key: 'q', label: 'Qty', render: e => e.qty }, { key: 'k', label: 'Condition', render: e => <Badge>{e.condition}</Badge> }, { key: 'l', label: 'Location', render: e => e.location }, { key: 'a', label: 'Assigned', render: e => e.assignedTo ? nameOf(e.assignedTo) : '—' }, { key: 'v', label: 'Value / Repl.', render: e => `${money(e.value)} / ${money(e.replacement)}` }, { key: 'i', label: 'Next inspection', render: e => fmtDate(e.nextInspection) },
      { key: 'x', label: '', render: e => <span className="row wrap">{e.assignedTo ? <button className="btn sm" onClick={() => equipmentService.return(e.id)}>Return</button> : <button className="btn sm primary" onClick={() => setCo(e.id)}>Check out</button>}<button className="btn sm" onClick={() => patchItem('equipment', e.id, { lastMaintenance: '2026-10-07', issue: undefined, condition: 'Good' })}>Maintained</button></span> }]} />
    {co && <Modal title="Check out to member" onClose={() => setCo(null)}><ul className="list">{members.filter(m => m.status === 'Active' || m.status === 'Pending').map(m => <li key={m.id}><span>{m.name}</span><button className="btn sm" onClick={() => { equipmentService.checkout(co, m.id); setCo(null) }}>Assign</button></li>)}</ul></Modal>}</>)
}
