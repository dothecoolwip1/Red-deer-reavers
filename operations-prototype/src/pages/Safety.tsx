import { useState } from 'react'
import { Badge, Card, Filters, PageHeader, Mock, RecordLink } from '../components/ui'
import { openCreate } from '../components/create'
import { useColl, patchItem } from '../services/store'
import { fmtDate } from '../utils/format'

const F = ['All', 'Open', 'Follow-up', 'Closed'] as const
export default function Safety() {
  const inc = useColl('incidents'); const [f, setF] = useState<typeof F[number]>('All')
  return (<><PageHeader title="🔒 Safety & Incident Reports" subtitle="Restricted: executive, coaches and team leads only (visual only)" actions={<button className="btn primary" onClick={() => openCreate('incident')}>+ Report incident</button>} />
    <Mock>All incidents are fictional.</Mock><Filters options={F} value={f} onChange={setF} /><div style={{ height: '.6rem' }} />
    <div className="grid g-cards">{inc.filter(i => f === 'All' || i.status === f).map(i => <Card key={i.id} title={`${i.type} · ${fmtDate(i.date)}`} actions={<><Badge>{i.severity}</Badge><Badge>{i.status}</Badge></>}>
      <p>{i.description}</p><p className="muted">Reported by {i.reporter}</p>{i.related && <RecordLink r={i.related} />}
      <h3 style={{ marginTop: '.5rem' }}>Corrective actions</h3><ul className="list">{i.actions.map((a, k) => <li key={k}><label><input type="checkbox" checked={a.done} onChange={() => patchItem('incidents', i.id, { actions: i.actions.map((x, j) => j === k ? { ...x, done: !x.done } : x) })} /> {a.text}</label></li>)}</ul>
      <div className="row wrap"><button className="btn sm" onClick={() => { const t = prompt('Corrective action / follow-up'); if (t) patchItem('incidents', i.id, { actions: [...i.actions, { text: t, done: false }] }) }}>+ action</button><select className="input" style={{ width: 'auto' }} value={i.status} onChange={e => patchItem('incidents', i.id, { status: e.target.value as any })}><option>Open</option><option>Follow-up</option><option>Closed</option></select></div></Card>)}</div></>)
}
