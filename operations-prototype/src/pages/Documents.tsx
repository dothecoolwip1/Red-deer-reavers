import { useMemo, useState } from 'react'
import { Badge, Card, Filters, Modal, PageHeader, Kv, RecordLink, SearchBox, Empty } from '../components/ui'
import { openCreate } from '../components/create'
import { useColl, patchItem } from '../services/store'
import { docCategories } from '../data/docs'
import { fmtDate } from '../utils/format'
import type { Doc } from '../types'

const V = ['All', 'Starred', 'Recently opened'] as const
export default function Documents() {
  const docs = useColl('docs'); const [q, setQ] = useState(''); const [cat, setCat] = useState('All'); const [v, setV] = useState<typeof V[number]>('All'); const [open, setOpen] = useState<Doc | null>(null)
  const rows = useMemo(() => docs.filter(d => (cat === 'All' || d.category === cat) && (v === 'All' || (v === 'Starred' ? d.starred : !!d.lastOpened)) && (d.title + d.tags.join(' ') + d.uploader).toLowerCase().includes(q.toLowerCase())).sort((a, b) => v === 'Recently opened' ? (b.lastOpened ?? '').localeCompare(a.lastOpened ?? '') : b.date.localeCompare(a.date)), [docs, q, cat, v])
  const cur = open ? docs.find(d => d.id === open.id)! : null
  return (<>
    <PageHeader title="Documents & Files" subtitle="A concept for replacing Google Drive: every file belongs to a record in the system" actions={<button className="btn primary" onClick={() => openCreate('document')}>+ Upload Document</button>} />
    <div className="row wrap" style={{ marginBottom: '.5rem' }}><SearchBox value={q} onChange={setQ} placeholder="Search title, tag, uploader" /><Filters options={V} value={v} onChange={setV} /><select className="input" style={{ width: 'auto' }} value={cat} onChange={e => setCat(e.target.value)}><option>All</option>{docCategories.map(c => <option key={c}>{c} ({docs.filter(d => d.category === c).length})</option>)}</select></div>
    <div className="pills" style={{ marginBottom: '.6rem' }}>{docCategories.filter(c => docs.some(d => d.category === c)).map(c => <button key={c} className={'pill' + (cat === c ? ' on' : '')} onClick={() => setCat(cat === c ? 'All' : c)}>{c}</button>)}</div>
    <div className="grid g-cards">{rows.map(d => (
      <Card key={d.id}><div className="row" style={{ justifyContent: 'space-between' }}><b style={{ cursor: 'pointer' }} onClick={() => { patchItem('docs', d.id, { lastOpened: '2026-10-07' }); setOpen(d) }}>📄 {d.title}</b><button className="btn ghost sm" onClick={() => patchItem('docs', d.id, { starred: !d.starred })} aria-label="star">{d.starred ? '⭐' : '☆'}</button></div>
        <div className="muted">{d.category} · {d.fileType} · {fmtDate(d.date)}</div><div className="chips" style={{ margin: '.3rem 0' }}>{d.tags.map(t => <span className="chip" key={t}>#{t}</span>)}</div><RecordLink r={d.related} /></Card>))}</div>
    {!rows.length && <Empty>No documents match.</Empty>}
    {cur && <Modal title={cur.title} onClose={() => setOpen(null)} wide>
      <div className="grid g2"><div className="preview" style={{ maxWidth: 'none' }}><div className="ph" style={{ background: '#999', height: 260 }}>Mock {cur.fileType} preview</div></div>
        <div><Kv k="Category" v={cur.category} /><Kv k="Type" v={cur.fileType} /><Kv k="Size" v={cur.sizeKb + ' KB'} /><Kv k="Uploaded by" v={cur.uploader} /><Kv k="Date" v={fmtDate(cur.date)} /><Kv k="Tags" v={cur.tags.join(', ')} /><Kv k="Attached to" v={<RecordLink r={cur.related} />} /><p className="muted">{cur.summary}</p>
          <div className="row"><button className="btn" onClick={() => patchItem('docs', cur.id, { starred: !cur.starred })}>{cur.starred ? 'Unstar' : 'Star'}</button><Badge tone="info">Download disabled in mock</Badge></div></div></div></Modal>}
  </>)
}
