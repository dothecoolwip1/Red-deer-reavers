import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, Filters, PageHeader, SearchBox, Modal, Kv, RecordLink } from '../components/ui'
import { openCreate } from '../components/create'
import { useColl, patchItem } from '../services/store'
import { fmtDate } from '../utils/format'
import { sponsorName } from '../utils/links'
import { SocialNav } from './social-common'
import type { MediaAsset } from '../types'

const K = ['All', 'Photo', 'Video', 'Logo', 'Sponsor Logo', 'Graphic'] as const
export default function Media() {
  const media = useColl('mediaAssets'); const [k, setK] = useState<typeof K[number]>('All'); const [q, setQ] = useState(''); const [o, setO] = useState<MediaAsset | null>(null)
  const cur = o && media.find(m => m.id === o.id)
  return (<><PageHeader title="Media Library" subtitle="Shared photos, videos, logos and graphics (mock files)" actions={<><Link className="btn orange" to="/social/composer">Use in composer</Link><button className="btn primary" onClick={() => openCreate('media')}>+ Upload</button></>} /><SocialNav />
    <div className="row wrap" style={{ marginBottom: '.6rem' }}><SearchBox value={q} onChange={setQ} /><Filters options={K} value={k} onChange={setK} /></div>
    <div className="grid g-cards" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))' }}>{media.filter(m => (k === 'All' || m.kind === k) && (m.name + m.tags.join(' ')).toLowerCase().includes(q.toLowerCase())).map(m => <div key={m.id} className="media-tile" onClick={() => setO(m)}><div className="ph" style={{ background: m.color }}>{m.kind}</div><div style={{ padding: '.3rem', fontSize: '.78rem' }}><b>{m.name}</b><br />{m.approved ? <Badge tone="good">public OK</Badge> : <Badge tone="warn">needs approval</Badge>}</div></div>)}</div>
    {cur && <Modal title={cur.name} onClose={() => setO(null)}><div className="ph" style={{ background: cur.color, height: 160, borderRadius: 8, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cur.kind} preview (mock)</div>
      <Kv k="Tags" v={cur.tags.join(', ')} /><Kv k="Event" v={cur.eventId ? <RecordLink r={{ type: 'event', id: cur.eventId }} /> : '—'} /><Kv k="Uploader" v={cur.uploader} /><Kv k="Date" v={fmtDate(cur.date)} /><Kv k="Photographer" v={cur.photographer} /><Kv k="Sponsor" v={cur.sponsorId ? sponsorName(cur.sponsorId) : '—'} /><Kv k="Category" v={cur.category} /><Kv k="Approved for public use" v={cur.approved ? 'Yes' : 'No'} />
      <div className="row" style={{ marginTop: '.5rem' }}><button className="btn" onClick={() => patchItem('mediaAssets', cur.id, { approved: !cur.approved })}>{cur.approved ? 'Revoke approval' : 'Approve for public use'}</button></div></Modal>}</>)
}
