import { useState } from 'react'
import { Badge, Card, Filters, PageHeader, Empty, SearchBox } from '../components/ui'
import { openCreate } from '../components/create'
import { useColl, patchItem, toast } from '../services/store'
import { fmtDate } from '../utils/format'

const CATS = ['All', 'Sponsors', 'Venues', 'Suppliers', 'City Contacts', 'Media', 'Photographers', 'Community Organizations', 'Other Buhurt Clubs', 'HACSA', 'Grant Contacts']
export default function Contacts() {
  const cs = useColl('contacts'); const [cat, setCat] = useState('All'); const [q, setQ] = useState('')
  return (<>
    <PageHeader title="Contacts" subtitle="Everyone outside the club the organization deals with" actions={<button className="btn primary" onClick={() => openCreate('contact')}>+ Add Contact</button>} />
    <div className="row wrap" style={{ marginBottom: '.6rem' }}><SearchBox value={q} onChange={setQ} /><Filters options={CATS as any} value={cat as any} onChange={setCat as any} /></div>
    <div className="grid g-cards">{cs.filter(c => (cat === 'All' || c.category === cat) && (c.name + c.org).toLowerCase().includes(q.toLowerCase())).map(c => (
      <Card key={c.id} title={c.name} actions={<Badge tone="info">{c.category}</Badge>}>
        <p>{c.org}<br /><span className="muted">{c.email} · {c.phone}</span></p>
        {c.followUp && <p><Badge tone={c.followUp < '2026-10-14' ? 'bad' : 'warn'}>Follow up {fmtDate(c.followUp)}</Badge></p>}
        <h3>Communications</h3>{c.comms.length ? <ul className="list">{c.comms.map((m, i) => <li key={i}><span>{m.note}</span><span className="muted">{fmtDate(m.date)}</span></li>)}</ul> : <Empty>None logged.</Empty>}
        <button className="btn sm" onClick={() => { const note = prompt('Log a communication'); if (note) { patchItem('contacts', c.id, { comms: [...c.comms, { date: '2026-10-07', note }] }); toast('Logged') } }}>+ Log communication</button></Card>))}</div>
  </>)
}
