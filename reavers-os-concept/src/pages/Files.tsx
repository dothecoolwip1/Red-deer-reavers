// Files, organised the way the club's Google Drive already is: ten numbered top folders, sub-folders inside.
// The difference from Drive: a file can also be attached to the record it belongs to, and the record knows about it.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Panel, Pill, Seg, Ref, Empty, Sheet } from '../ui'
import { fmt } from '../model'
import { useStore, patch, add, uid, toast, TODAY } from '../store'
import type { Doc } from '../types'

interface Folder { name: string; cats: string[]; sub?: Folder[]; recordType?: string }
// Mirrors the Drive screenshot (1–9) plus 10. Social Media. `cats` are doc categories that land in that folder.
const tree: Folder[] = [
  { name: '1. Society Documents', cats: ['Governance', 'HACSA'], sub: [{ name: 'Bylaws & policies', cats: ['Bylaws'] }, { name: 'AGM', cats: ['AGM'] }, { name: 'Meeting minutes', cats: ['Meeting Minutes'], recordType: 'meeting' }] },
  { name: '2. Financials', cats: ['Finance'], sub: [{ name: 'Receipts', cats: ['Receipts'], recordType: 'expense' }, { name: 'Grants', cats: ['Grants'], recordType: 'grant' }] },
  { name: '3. Sponsorships & Fundraising', cats: [], sub: [{ name: 'Sponsors', cats: ['Sponsors'], recordType: 'sponsor' }, { name: 'Fundraising', cats: ['Fundraising'], recordType: 'fundraiser' }] },
  { name: '4. Gear & Inventory', cats: ['Equipment'], recordType: 'equipment' },
  { name: '5. Media & Branding', cats: ['Marketing'], sub: [{ name: 'Photos', cats: ['Photos'] }] },
  { name: '6. Practice & Event Calendar', cats: [], sub: [{ name: 'Practices', cats: ['Practices'], recordType: 'practice' }, { name: 'Events', cats: ['Events'], recordType: 'event' }] },
  { name: '7. Training & Rules', cats: ['Training'] },
  { name: '8. Youth Program', cats: ['Programs'], recordType: 'program' },
  { name: '9. Insurance', cats: ['Insurance', 'Waivers'], sub: [{ name: 'Signed waivers', cats: ['Waivers'], recordType: 'member' }] },
  { name: '10. Social Media', cats: ['Social Media'] },
]
const icon = (t: string) => ({ PDF: '📕', DOCX: '📘', XLSX: '📗', JPG: '🖼️', ZIP: '🗜️' } as Record<string, string>)[t] ?? '📄'
const allCats = (f: Folder): string[] => [...f.cats, ...(f.sub ?? []).flatMap(allCats)]
const V = ['Folders', 'Starred', 'Recent', 'Attached to records'] as const

export default function Files() {
  const s = useStore(); const [v, setV] = useState<typeof V[number]>('Folders'); const [path, setPath] = useState<Folder[]>([]); const [q, setQ] = useState(''); const [open, setOpen] = useState<Doc | null>(null); const [up, setUp] = useState(false)
  const cur = path[path.length - 1]; const folders = cur ? cur.sub ?? [] : tree
  const subCats = cur ? (cur.sub ?? []).flatMap(allCats) : []
  const here = cur ? s.docs.filter(d => cur.cats.includes(d.category) && !subCats.includes(d.category)) : []
  const latest = (f: Folder) => s.docs.filter(d => allCats(f).includes(d.category)).map(d => d.date).sort().pop()
  const count = (f: Folder) => s.docs.filter(d => allCats(f).includes(d.category)).length
  const hits = q ? s.docs.filter(d => (d.title + ' ' + d.tags.join(' ') + ' ' + d.category).toLowerCase().includes(q.toLowerCase())) : null
  const openDoc = (d: Doc) => { patch('docs', d.id, { lastOpened: TODAY }); setOpen(d) }
  const Row = ({ d }: { d: Doc }) => <li><div className="main"><b style={{ cursor: 'pointer' }} onClick={() => openDoc(d)}>{icon(d.fileType)} {d.title}</b><span>Modified {fmt(d.date)} · {d.uploader}{d.related && <> · <Ref r={d.related} /></>}</span></div>{d.starred && <span title="starred">⭐</span>}<button className="btn ghost s" aria-label="more" onClick={() => openDoc(d)}>⋮</button></li>
  const live = open && s.docs.find(d => d.id === open.id)
  return (<>
    <div className="head"><div><h1>Files</h1><p>Same ten folders as the club's Google Drive, so nobody has to relearn where things are. The difference: a receipt also lives on its expense, minutes on their meeting, a waiver on the member. Open the record and the file is there.</p></div><button className="btn e" onClick={() => setUp(true)}>+ Upload</button></div>
    <div className="row" style={{ marginBottom: '1rem', justifyContent: 'space-between' }}><Seg opts={V} v={v} on={x => { setV(x); setQ('') }} /><input className="input" style={{ width: 'auto', minWidth: 180 }} placeholder="Search all files" value={q} onChange={e => setQ(e.target.value)} /></div>
    {hits ? <Panel title={`${hits.length} result${hits.length === 1 ? '' : 's'} for “${q}”`}><ul className="list">{hits.map(d => <Row key={d.id} d={d} />)}</ul>{!hits.length && <Empty>Nothing matches.</Empty>}</Panel>
    : v === 'Folders' ? <Panel title={<span className="row" style={{ gap: '.3rem' }}><a style={{ cursor: 'pointer' }} onClick={() => setPath([])}>Red Deer Reavers</a>{path.map((f, i) => <span key={f.name}> › <a style={{ cursor: 'pointer' }} onClick={() => setPath(path.slice(0, i + 1))}>{f.name}</a></span>)}</span>} right={<span className="faint">Name ↑</span>}>
        <ul className="list">
          {folders.map(f => <li key={f.name} style={{ cursor: 'pointer' }} onClick={() => setPath([...path, f])}><span style={{ fontSize: '1.4rem' }}>📁</span><div className="main"><b>{f.name}</b><span>{count(f)} file{count(f) === 1 ? '' : 's'}{latest(f) ? ` · Modified ${fmt(latest(f))}` : ''}{f.recordType ? ` · each file sits on a ${f.recordType}` : ''}</span></div><span className="faint">›</span></li>)}
          {here.map(d => <Row key={d.id} d={d} />)}
        </ul>{!folders.length && !here.length && <Empty>Empty folder.</Empty>}
        {cur && <p className="faint" style={{ marginTop: '.6rem' }}><button className="btn ghost s" onClick={() => setPath(path.slice(0, -1))}>← back</button></p>}</Panel>
    : v === 'Starred' ? <Panel title="Starred"><ul className="list">{s.docs.filter(d => d.starred).map(d => <Row key={d.id} d={d} />)}</ul></Panel>
    : v === 'Recent' ? <Panel title="Recently opened"><ul className="list">{s.docs.filter(d => d.lastOpened).sort((a, b) => b.lastOpened!.localeCompare(a.lastOpened!)).map(d => <Row key={d.id} d={d} />)}</ul>{!s.docs.some(d => d.lastOpened) && <Empty />}</Panel>
    : <div className="grid g2">{Object.entries(s.docs.filter(d => d.related).reduce<Record<string, Doc[]>>((a, d) => { (a[d.related!.type] ??= []).push(d); return a }, {})).map(([t, list]) => <Panel key={t} title={`On ${t}s · ${list.length}`}><ul className="list">{list.map(d => <Row key={d.id} d={d} />)}</ul></Panel>)}</div>}
    {live && <Sheet title={live.title} onClose={() => setOpen(null)}><div className="phone" style={{ maxWidth: 'none' }}><div className="img" style={{ background: 'var(--panel-2)', color: 'var(--ink-3)', height: 180 }}>{live.fileType} preview (mock)</div></div><ul className="list"><li><div className="main"><b>Folder</b></div><span>{folderOf(live.category)}</span></li><li><div className="main"><b>Modified</b></div><span>{fmt(live.date)} by {live.uploader}</span></li><li><div className="main"><b>Attached to</b></div>{live.related ? <Ref r={live.related} /> : <span className="faint">nothing (folder only)</span>}</li><li><div className="main"><b>Tags</b></div><span>{live.tags.join(', ') || '—'}</span></li></ul><div className="row" style={{ marginTop: '.6rem' }}><button className="btn s" onClick={() => patch('docs', live.id, { starred: !live.starred })}>{live.starred ? 'Unstar' : 'Star'}</button><Pill>download disabled in mock</Pill></div></Sheet>}
    {up && <Sheet title="Upload" onClose={() => setUp(false)}><form className="stack" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); const title = String(f.get('title')); if (!title) return; const rel = String(f.get('related')); add('docs', { id: uid('d'), title, category: String(f.get('cat')), tags: [], uploader: 'You', date: TODAY, starred: false, sizeKb: 120, fileType: 'PDF', related: rel ? { type: rel.split(':')[0], id: rel.split(':')[1] } : undefined, summary: 'Mock upload' }); toast('Uploaded (mock)'); setUp(false) }}><label className="f">File<input className="input" type="file" /></label><label className="f">Title<input className="input" name="title" autoFocus /></label><label className="f">Folder<select className="input" name="cat" defaultValue={cur?.cats[0] ?? 'Governance'}>{tree.map(f => <optgroup key={f.name} label={f.name}>{[f, ...(f.sub ?? [])].flatMap(x => x.cats.map(c => <option key={c} value={c}>{x === f ? f.name : '   ' + x.name} ({c})</option>))}</optgroup>)}</select></label><label className="f">Also attach to a record<select className="input" name="related"><option value="">—</option>{s.meetings.map(x => <option key={x.id} value={'meeting:' + x.id}>Meeting: {x.title}</option>)}{s.events.map(x => <option key={x.id} value={'event:' + x.id}>Event: {x.name}</option>)}{s.grants.map(x => <option key={x.id} value={'grant:' + x.id}>Grant: {x.name}</option>)}{s.sponsors.map(x => <option key={x.id} value={'sponsor:' + x.id}>Sponsor: {x.company}</option>)}{s.members.map(x => <option key={x.id} value={'member:' + x.id}>Member: {x.name}</option>)}</select></label><div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn p">Upload</button></div></form></Sheet>}
    <p className="faint">Moving the real Drive in is a one-time import once there's a backend: same folder names, same files. <Link to="/concept">The idea</Link>.</p>
  </>)
}
function folderOf(cat: string): string { for (const f of tree) { if (f.cats.includes(cat)) return f.name; for (const sf of f.sub ?? []) if (sf.cats.includes(cat)) return `${f.name} › ${sf.name}` } return '—' }
