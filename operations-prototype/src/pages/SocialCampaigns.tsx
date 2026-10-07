import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Card, DataTable, Kv, PageHeader, Progress, Empty, RecordLink, Stat } from '../components/ui'
import { openCreate } from '../components/create'
import { useColl, patchItem, toast } from '../services/store'
import { postReach, postEngagement, postClicks } from '../services/social'
import { fmtDate, num, sum, pct } from '../utils/format'
import { PlatformTag, SocialNav } from './social-common'

export function Campaigns() {
  const cs = useColl('socialCampaigns'); const posts = useColl('socialPosts'); const nav = useNavigate()
  return (<><PageHeader title="Campaigns" actions={<button className="btn primary" onClick={() => openCreate('campaign')}>+ Build campaign</button>} /><SocialNav />
    <DataTable rows={cs} onRow={c => nav(`/social/campaigns/${c.id}`)} cols={[{ key: 'n', label: 'Campaign', render: c => <b>{c.name}</b> }, { key: 'g', label: 'Goal', render: c => c.goal }, { key: 'd', label: 'Dates', render: c => `${fmtDate(c.start)} → ${fmtDate(c.end)}` }, { key: 'p', label: 'Posts', render: c => posts.filter(p => p.campaignId === c.id).length }, { key: 'r', label: 'Reach', render: c => num(sum(posts.filter(p => p.campaignId === c.id && p.status === 'Published').map(postReach))) }, { key: 's', label: 'Sponsors', render: c => c.sponsorIds.length }]} /></>)
}
export function CampaignDetail() {
  const { id } = useParams(); const c = useColl('socialCampaigns').find(x => x.id === id); const posts = useColl('socialPosts'); const sponsors = useColl('sponsors')
  if (!c) return <Empty>Not found. <Link to="/social/campaigns">Back</Link></Empty>
  const cp = posts.filter(p => p.campaignId === c.id); const pub = cp.filter(p => p.status === 'Published'); const reach = sum(pub.map(postReach))
  const plats = [...new Set(cp.flatMap(p => p.platforms.map(x => x.platform)))]
  return (<>
    <PageHeader title={c.name} subtitle={`${c.goal} · ${fmtDate(c.start)} → ${fmtDate(c.end)}`} actions={<><Link className="btn orange" to="/social/composer">+ Post</Link><Link className="btn" to="/social/campaigns">← All</Link></>} /><SocialNav />
    <div className="grid g4"><Stat label="Posts" value={cp.length} sub={`${pub.length} published`} /><Stat label="Reach" value={num(reach)} /><Stat label="Engagement" value={num(sum(pub.map(postEngagement)))} /><Stat label="Clicks" value={num(sum(pub.map(postClicks)))} /></div>
    <div className="grid g2" style={{ marginTop: '.8rem' }}><div>
      <Card title="Goal: reach target"><Progress value={pct(reach, c.targetReach)} label={`${num(reach)} / ${num(c.targetReach)}`} /><div className="chips" style={{ marginTop: '.5rem' }}>{plats.map(p => <PlatformTag key={p} p={p} />)}</div></Card>
      <Card title="Related">{c.eventId && <Kv k="Event" v={<RecordLink r={{ type: 'event', id: c.eventId }} />} />}{c.fundraiserId && <Kv k="Fundraiser" v={<RecordLink r={{ type: 'fundraiser', id: c.fundraiserId }} />} />}{c.programId && <Kv k="Program" v={<RecordLink r={{ type: 'program', id: c.programId }} />} />}
        <h3 style={{ marginTop: '.5rem' }}>Sponsors</h3><div className="chips">{c.sponsorIds.map(s => <RecordLink key={s} r={{ type: 'sponsor', id: s }} />)}</div>
        <select className="input" style={{ marginTop: '.5rem' }} value="" onChange={e => { if (e.target.value) { patchItem('socialCampaigns', c.id, { sponsorIds: [...c.sponsorIds, e.target.value] }); toast('Sponsor assigned to campaign') } }}><option value="">+ Assign sponsor…</option>{sponsors.filter(s => !c.sponsorIds.includes(s.id) && ['Active', 'Renewal Due'].includes(s.status)).map(s => <option key={s.id} value={s.id}>{s.company}</option>)}</select></Card>
    </div><div><Card title="Posts in this campaign">{cp.map(p => <p key={p.id}><RecordLink r={{ type: 'post', id: p.id }} /> <Badge>{p.status}</Badge> {p.status === 'Published' && <span className="muted">reach {num(postReach(p))}</span>}</p>)}{!cp.length && <Empty />}
      <select className="input" value="" onChange={e => { if (e.target.value) patchItem('socialPosts', e.target.value, { campaignId: c.id }) }}><option value="">+ Add existing post…</option>{posts.filter(p => p.campaignId !== c.id).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></Card></div></div></>)
}
