import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Card, DataTable, Filters, PageHeader, Mock, Tabs, RecordLink } from '../components/ui'
import { useColl, useSession } from '../services/store'
import { socialService, postReach } from '../services/social'
import { socialTasks } from '../data/social'
import { fmtDate, num } from '../utils/format'
import { PlatformTag, SocialNav } from './social-common'
import type { PostStatus } from '../types'

const S = ['Draft', 'Review', 'Approved', 'Scheduled', 'Published', 'Failed', 'Archived'] as const
const T = ['Post library', 'Approval workflow', 'Social tasks'] as const
export default function SocialHub() {
  const posts = useColl('socialPosts'); const camps = useColl('socialCampaigns'); const { role } = useSession(); const nav = useNavigate()
  const [tab, setTab] = useState<typeof T[number]>('Post library'); const [st, setSt] = useState<PostStatus>('Published')
  const flow: PostStatus[] = ['Draft', 'Review', 'Approved', 'Scheduled', 'Published']
  return (<>
    <PageHeader title="Communications & Social Media Hub" subtitle="One place to plan, approve, publish and measure Reavers social media (all mock)" actions={<Link className="btn orange" to="/social/composer">✍️ New post</Link>} />
    <Mock>No real accounts are connected. Publishing is simulated.</Mock><SocialNav />
    <Tabs tabs={T} value={tab} onChange={setTab} />
    {tab === 'Post library' && <><div className="pills" style={{ marginBottom: '.6rem' }}>{S.map(s => <button key={s} className={'pill' + (st === s ? ' on' : '')} onClick={() => setSt(s)}>{s} ({posts.filter(p => p.status === s).length})</button>)}</div>
      <DataTable rows={posts.filter(p => p.status === st)} onRow={p => nav(`/social/posts/${p.id}`)} cols={[{ key: 't', label: 'Post', render: p => <b>{p.title}</b> }, { key: 'p', label: 'Platforms', render: p => <span className="chips">{p.platforms.map(x => <PlatformTag key={x.platform} p={x.platform} />)}</span> }, { key: 'a', label: 'Author', render: p => p.author }, { key: 'c', label: 'Campaign', render: p => camps.find(c => c.id === p.campaignId)?.name ?? '—' }, { key: 'e', label: 'Event', render: p => p.eventId ? <RecordLink r={{ type: 'event', id: p.eventId }} /> : '—' }, { key: 'd', label: 'Date', render: p => p.publishedAt ? fmtDate(p.publishedAt) : p.scheduledFor ?? '—' }, { key: 'm', label: 'Media', render: p => p.mediaIds.length }, { key: 'r', label: 'Reach', render: p => p.status === 'Published' ? num(postReach(p)) : '—' }, { key: 's', label: 'Status', render: p => <Badge>{p.status}</Badge> }]} empty={`No ${st.toLowerCase()} posts.`} /></>}
    {tab === 'Approval workflow' && <><Mock>Role concept — Member: suggest · Social Media Manager: draft · Executive: approve · Administrator: publish. You are viewing as <b>{role}</b>.</Mock>
      <div className="grid g-cards">{flow.map(s => <Card key={s} title={<Badge>{s}</Badge>}>{posts.filter(p => p.status === s).map(p => <p key={p.id}><Link to={`/social/posts/${p.id}`}><b>{p.title}</b></Link><br /><span className="muted">{p.author}</span><br />{s !== 'Published' && <><button className="btn sm primary" onClick={() => socialService.advance(p.id, role)}>→ next step</button>{s === 'Review' && <button className="btn sm" onClick={() => socialService.reject(p.id, role)}>Send back</button>}</>}</p>)}</Card>)}</div></>}
    {tab === 'Social tasks' && <Card title="Social media tasks → open directly in composer"><ul className="list">{socialTasks.map(t => <li key={t.id}><span>{t.title}</span><Link className="btn sm orange" to={`/social/composer?task=${t.id}`}>Open in composer</Link></li>)}</ul></Card>}
  </>)
}
