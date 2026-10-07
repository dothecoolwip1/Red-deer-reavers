import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, PageHeader } from '../components/ui'
import { useColl } from '../services/store'
import { SocialNav } from './social-common'
import { cx } from '../utils/format'

const COL = { post: '#800080', event: '#1b7f3b', campaign: '#a56a00', sponsor: '#2f6fb3' }
export default function SocialCalendar() {
  const posts = useColl('socialPosts'); const events = useColl('events'); const camps = useColl('socialCampaigns'); const sponsors = useColl('sponsors')
  const [month, setMonth] = useState({ y: 2026, m: 9 }); const [sel, setSel] = useState('2026-10-10')
  const items = useMemo(() => {
    const it: { date: string; kind: keyof typeof COL; label: string; to: string; status?: string }[] = []
    posts.forEach(p => { const d = (p.scheduledFor ?? p.publishedAt ?? '').slice(0, 10); if (d) it.push({ date: d, kind: 'post', label: p.title, to: `/social/posts/${p.id}`, status: p.status }) })
    events.forEach(e => it.push({ date: e.date, kind: 'event', label: e.name, to: `/events/${e.id}` }))
    camps.forEach(c => { it.push({ date: c.start, kind: 'campaign', label: `▶ ${c.name}`, to: `/social/campaigns/${c.id}` }); it.push({ date: c.end, kind: 'campaign', label: `■ ${c.name}`, to: `/social/campaigns/${c.id}` }) })
    sponsors.filter(s => s.nextFollowUp).forEach(s => it.push({ date: s.nextFollowUp, kind: 'sponsor', label: `Sponsor follow-up: ${s.company}`, to: `/sponsors/${s.id}` }))
    return it
  }, [posts, events, camps, sponsors])
  const first = new Date(month.y, month.m, 1); const start = new Date(month.y, month.m, 1 - first.getDay())
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i); return { d, key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` } })
  const go = (n: number) => setMonth(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })
  return (<>
    <PageHeader title="Content Calendar" subtitle="Posts, events, campaigns and sponsor commitments together" /><SocialNav />
    <div className="row wrap" style={{ marginBottom: '.5rem' }}><button className="btn" onClick={() => go(-1)}>←</button><b>{first.toLocaleString('en-CA', { month: 'long', year: 'numeric' })}</b><button className="btn" onClick={() => go(1)}>→</button>{Object.entries(COL).map(([k, c]) => <span key={k}><span className="plat-dot" style={{ background: c }}>&nbsp;</span>{k}</span>)}</div>
    <div className="grid g2" style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)' }}>
      <div className="cal">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="cal-h">{d}</div>)}{days.map(({ d, key }) => <div key={key} className={cx('cal-d', key === sel && 'on', key === '2026-10-07' && 'today', d.getMonth() !== month.m && 'out')} onClick={() => setSel(key)}>{d.getDate()}{items.filter(i => i.date === key).slice(0, 4).map((i, k) => <span key={k} className="ev" style={{ background: COL[i.kind] }}>{i.label}</span>)}</div>)}</div>
      <Card title={`Selected: ${sel}`}>{items.filter(i => i.date === sel).map((i, k) => <p key={k}><span className="plat-dot" style={{ background: COL[i.kind] }}>&nbsp;</span><Link to={i.to}>{i.label}</Link> {i.status && <Badge>{i.status}</Badge>}</p>)}{!items.some(i => i.date === sel) && <p className="muted">Nothing on this day. <Link to="/social/composer">Create a post</Link></p>}</Card></div></>)
}
