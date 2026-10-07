import { Link, useParams } from 'react-router-dom'
import { Badge, Card, Kv, PageHeader, Empty, RecordLink, Mock } from '../components/ui'
import { useColl, useSession } from '../services/store'
import { socialService, postReach, postEngagement, postClicks, adapters } from '../services/social'
import { num, cx } from '../utils/format'
import { PlatformTag, SocialNav } from './social-common'

export default function PostDetail() {
  const { id } = useParams(); const p = useColl('socialPosts').find(x => x.id === id); const media = useColl('mediaAssets'); const camps = useColl('socialCampaigns'); const sponsors = useColl('sponsors'); const { role } = useSession()
  if (!p) return <Empty>Not found. <Link to="/social">Back</Link></Empty>
  const flow = ['Draft', 'Review', 'Approved', 'Scheduled', 'Published']; const i = flow.indexOf(p.status)
  return (<>
    <PageHeader title={p.title} subtitle={<><Badge>{p.status}</Badge> by {p.author}</>} actions={<><button className="btn primary" disabled={i < 0 || i >= 4} onClick={() => socialService.advance(p.id, role)}>Advance → {flow[i + 1] ?? '—'}</button>{p.status === 'Failed' && <button className="btn" onClick={() => socialService.retry(p.id)}>Retry</button>}<button className="btn" onClick={() => socialService.archive(p.id)}>Archive</button></>} />
    <SocialNav />
    <div className="steps">{flow.map((s, k) => <span key={s} className={cx('step', k === i && 'on', k < i && 'done')}>{s}</span>)}</div>
    <div className="grid g2"><div>
      <Card title="Content"><p>{p.caption}</p><p className="muted">{p.hashtags.join(' ')} {p.link}</p><div className="chips">{p.mediaIds.map(m => <span className="chip" key={m}>🖼 {media.find(x => x.id === m)?.name}</span>)}</div></Card>
      <Card title="Links"><Kv k="Campaign" v={p.campaignId ? <RecordLink r={{ type: 'campaign', id: p.campaignId }} /> : '—'} /><Kv k="Event" v={p.eventId ? <RecordLink r={{ type: 'event', id: p.eventId }} /> : '—'} /><Kv k="Fundraiser" v={p.fundraiserId ? <RecordLink r={{ type: 'fundraiser', id: p.fundraiserId }} /> : '—'} /><Kv k="Sponsors tagged" v={<span className="chips">{p.sponsorIds.map(s => <RecordLink key={s} r={{ type: 'sponsor', id: s }} />)}</span>} />{sponsors.length === 0 && camps.length === 0 && null}</Card>
      <Card title="Approval history"><ul className="list">{p.history.map((h, k) => <li key={k}><span>{h.action}</span><span className="muted">{h.by} · {h.at}</span></li>)}</ul>{!p.history.length && <Empty />}</Card>
    </div><div>
      <Card title="Total performance (summed across platforms)"><div className="grid g3"><div><b>{num(postReach(p))}</b><div className="muted">reach / views</div></div><div><b>{num(postEngagement(p))}</b><div className="muted">engagement</div></div><div><b>{num(postClicks(p))}</b><div className="muted">clicks</div></div></div></Card>
      <Mock>Each platform exposes different metrics — shown as a flexible metric list.</Mock>
      {p.platforms.map(pp => <Card key={pp.platform} title={<PlatformTag p={pp.platform} />} actions={<Badge>{pp.status}</Badge>}>{pp.error && <div className="warnbox error">{pp.error}</div>}
        {pp.metrics.length ? pp.metrics.map(m => <Kv key={m.key} k={m.label} v={num(m.value) + (m.unit ? ' ' + m.unit : '')} />) : <Empty>No results yet ({pp.status}).</Empty>}<small className="muted">Metrics this platform can expose: {adapters[pp.platform].capabilities.metrics.map(m => m.label).join(', ')}</small></Card>)}
    </div></div></>)
}
