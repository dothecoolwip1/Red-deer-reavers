import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Card, PageHeader, Related, Kv, Empty, RecordLink, DataTable, Filters, Tabs } from '../components/ui'
import { openCreate } from '../components/create'
import { useColl, patchItem, toast } from '../services/store'
import { sponsorExposure } from '../services/social'
import { fmtDate, money, num, sum } from '../utils/format'
import type { SponsorStatus } from '../types'

export const sponsorStatuses: SponsorStatus[] = ['Prospect', 'Contacted', 'Interested', 'Negotiating', 'Active', 'Renewal Due', 'Declined']
export function Sponsors() {
  const sp = useColl('sponsors'); const nav = useNavigate(); const [view, setView] = useState<'Pipeline' | 'Table'>('Pipeline')
  return (<>
    <PageHeader title="Sponsors (CRM)" subtitle={`Active value ${money(sum(sp.filter(s => ['Active', 'Renewal Due'].includes(s.status)).map(s => s.value)))}`} actions={<button className="btn primary" onClick={() => openCreate('sponsor')}>+ Add Sponsor</button>} />
    <Filters options={['Pipeline', 'Table'] as const} value={view} onChange={setView} /><div style={{ height: '.6rem' }} />
    {view === 'Pipeline' ? <div className="grid g-cards">{sponsorStatuses.map(st => <Card key={st} title={<Badge>{st}</Badge>}>{sp.filter(s => s.status === st).map(s => <p key={s.id}><Link to={`/sponsors/${s.id}`}><b>{s.company}</b></Link><br /><span className="muted">{money(s.value)} · follow up {fmtDate(s.nextFollowUp)}</span></p>)}{!sp.some(s => s.status === st) && <Empty>—</Empty>}</Card>)}</div>
      : <DataTable rows={sp} onRow={s => nav(`/sponsors/${s.id}`)} cols={[{ key: 'c', label: 'Company', render: s => <b>{s.company}</b> }, { key: 's', label: 'Status', render: s => <Badge>{s.status}</Badge> }, { key: 'l', label: 'Level', render: s => s.level }, { key: 'v', label: 'Value', render: s => money(s.value) }, { key: 'f', label: 'Next follow-up', render: s => fmtDate(s.nextFollowUp) }, { key: 'r', label: 'Renewal', render: s => fmtDate(s.renewal) }]} />}
  </>)
}
const TABS = ['Overview', 'Benefits', 'Social exposure', 'Linked'] as const
export function SponsorDetail() {
  const { id } = useParams(); const s = useColl('sponsors').find(x => x.id === id); const media = useColl('mediaAssets'); const camps = useColl('socialCampaigns'); const funds = useColl('fundraisers'); const evs = useColl('events'); useColl('socialPosts')
  const [tab, setTab] = useState<typeof TABS[number]>('Overview')
  if (!s) return <Empty>Not found. <Link to="/sponsors">Back</Link></Empty>
  const ex = sponsorExposure(s.id); const logo = media.find(m => m.sponsorId === s.id)
  return (<>
    <PageHeader title={s.company} subtitle={<><Badge>{s.status}</Badge> {s.level} · {money(s.value)}</>} actions={<><select className="input" value={s.status} onChange={e => patchItem('sponsors', s.id, { status: e.target.value as SponsorStatus })}>{sponsorStatuses.map(x => <option key={x}>{x}</option>)}</select><button className="btn" onClick={() => { patchItem('sponsors', s.id, { lastContact: '2026-10-07' }); toast('Contact logged (mock)') }}>Log contact today</button><Link className="btn" to="/sponsors">← All</Link></>} />
    <Tabs tabs={TABS} value={tab} onChange={setTab} />
    {tab === 'Overview' && <div className="grid g2"><Card title="Contact"><Kv k="Contact" v={s.contact} /><Kv k="Email" v={s.email} /><Kv k="Phone" v={s.phone} /><Kv k="First contacted" v={fmtDate(s.contacted)} /><Kv k="Last contact" v={fmtDate(s.lastContact)} /><Kv k="Next follow-up" v={fmtDate(s.nextFollowUp)} /><Kv k="Renewal" v={fmtDate(s.renewal)} /><Kv k="Logo" v={logo ? <span className="chip">🖼 {logo.name}</span> : 'none'} /></Card>
      <Card title="Notes"><textarea className="input" rows={5} defaultValue={s.notes} onBlur={e => patchItem('sponsors', s.id, { notes: e.target.value })} /></Card></div>}
    {tab === 'Benefits' && <Card title="Benefits promised vs delivered"><ul className="list">{s.promised.map(b => { const d = s.delivered.includes(b); return <li key={b}><span>{b}</span>{d ? <Badge tone="good">Delivered</Badge> : <button className="btn sm" onClick={() => patchItem('sponsors', s.id, { delivered: [...s.delivered, b] })}>Mark delivered</button>}</li> })}</ul>{!s.promised.length && <Empty />}</Card>}
    {tab === 'Social exposure' && <Card title="Social exposure (from the Communications hub)"><p><b>{s.company}</b> received <b>{ex.mentions}</b> social mentions ({ex.published} published) with a combined reach of <b>{num(ex.reach)}</b> and <b>{num(ex.engagement)}</b> engagements. Logo shown in {ex.logoShown} posts.</p>
      <div className="chips">{ex.posts.map(p => <RecordLink key={p.id} r={{ type: 'post', id: p.id }} />)}</div><p>Campaigns: {ex.campaigns.map(c => camps.find(x => x.id === c)?.name).join(', ') || '—'}</p><p className="muted">Handy at renewal time to demonstrate value.</p></Card>}
    {tab === 'Linked' && <div className="grid g2"><Card title="Fundraisers">{funds.filter(f => f.sponsorIds.includes(s.id)).map(f => <RecordLink key={f.id} r={{ type: 'fundraiser', id: f.id }} />)}</Card><Card title="Events">{evs.filter(f => f.sponsorIds.includes(s.id)).map(f => <RecordLink key={f.id} r={{ type: 'event', id: f.id }} />)}</Card><Related type="sponsor" id={s.id} /></div>}
  </>)
}
