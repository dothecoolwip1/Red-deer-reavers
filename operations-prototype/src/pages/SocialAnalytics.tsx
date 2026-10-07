import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Bars, Card, DataTable, Filters, PageHeader, Stat, Mock, RecordLink } from '../components/ui'
import { useColl } from '../services/store'
import { overallTotals, platformTotals, series, metricLabels, platformIds, adapters, bestDays, bestTimes, bestCategories, postReach, postEngagement, type Period } from '../services/social'
import { num, sum } from '../utils/format'
import { PlatformTag, SocialNav } from './social-common'

const P = ['7 Days', '30 Days', '90 Days', 'This Year', 'Custom'] as const
const map: Record<typeof P[number], Period> = { '7 Days': '7d', '30 Days': '30d', '90 Days': '90d', 'This Year': 'year', Custom: 'custom' }
const keys = ['followers', 'growth', 'impressions', 'reach', 'videoViews', 'likes', 'reactions', 'comments', 'shares', 'saves', 'clicks', 'engagementRate']
export default function SocialAnalytics() {
  const [p, setP] = useState<typeof P[number]>('30 Days'); const [days, setDays] = useState(14); const posts = useColl('socialPosts')
  const per = map[p]; const tot = overallTotals(per, days); const pub = posts.filter(x => x.status === 'Published')
  const ranked = [...pub].sort((a, b) => postReach(b) - postReach(a)); const accounts = useColl('socialAccounts')
  const byEng = [...pub].sort((a, b) => postEngagement(b) - postEngagement(a))
  const platReach = platformIds.map(id => ({ k: adapters[id].capabilities.label, v: platformTotals(id, per, days).reach ?? platformTotals(id, per, days).videoViews ?? 0 })).sort((a, b) => b.v - a.v)
  return (<>
    <PageHeader title="Social Analytics" subtitle="Unified view with realistic MOCK numbers" /><Mock>Mock data. A "—" means that platform does not expose the metric (not zero).</Mock><SocialNav />
    <div className="row wrap" style={{ marginBottom: '.7rem' }}><Filters options={P} value={p} onChange={setP} />{p === 'Custom' && <label>days <input className="input" type="number" style={{ width: 80, display: 'inline' }} min={1} max={365} value={days} onChange={e => setDays(Number(e.target.value) || 1)} /></label>}</div>
    <h2>Overall Reavers performance</h2>
    <div className="grid g4">{keys.map(k => <Stat key={k} label={k === 'engagementRate' ? 'Engagement rate' : metricLabels[k]} value={k === 'engagementRate' ? tot[k] + '%' : num(tot[k] ?? 0)} />)}</div>
    <div className="grid g2" style={{ marginTop: '.8rem' }}><Card title="Daily reach (mock)"><Bars data={series(per, days).filter((_, i) => i % 2 === 0).map(s => ({ k: 'day ' + s.label, v: s.reach }))} fmt={num} /></Card><Card title="Reach / views by platform"><Bars data={platReach} fmt={num} /></Card></div>
    <h2>Performance by platform</h2>
    <Card><div className="table-wrap"><table className="dt"><thead><tr><th>Metric</th>{platformIds.map(id => <th key={id}>{adapters[id].capabilities.label}</th>)}</tr></thead><tbody>{keys.map(k => <tr key={k}><td data-label="Metric"><b>{k === 'engagementRate' ? 'Engagement rate' : metricLabels[k]}</b></td>{platformIds.map(id => { const v = platformTotals(id, per, days)[k]; return <td key={id} data-label={adapters[id].capabilities.label}>{!accounts.find(a => a.platform === id)?.connected ? <span className="muted">not connected</span> : v === undefined ? '—' : k === 'engagementRate' ? v + '%' : num(v)}</td> })}</tr>)}</tbody></table></div></Card>
    <h2>Post performance</h2>
    <DataTable rows={ranked} cols={[{ key: 'p', label: 'Post', render: x => <Link to={`/social/posts/${x.id}`}><b>{x.title}</b></Link> }, { key: 'pl', label: 'Platforms', render: x => <span className="chips">{x.platforms.map(y => <PlatformTag key={y.platform} p={y.platform} />)}</span> }, { key: 'r', label: 'Reach/views', render: x => num(postReach(x)) }, { key: 'e', label: 'Engagement', render: x => num(postEngagement(x)) }, { key: 'o', label: '', render: x => <Link className="btn sm" to={`/social/posts/${x.id}`}>Open results</Link> }]} />
    <h2>Top performing content</h2>
    <div className="grid g3"><Card title="Best posts (reach)">{ranked.slice(0, 3).map(x => <p key={x.id}><RecordLink r={{ type: 'post', id: x.id }} /> <b>{num(postReach(x))}</b></p>)}</Card>
      <Card title="Highest engagement">{byEng.slice(0, 3).map(x => <p key={x.id}><RecordLink r={{ type: 'post', id: x.id }} /> <b>{num(postEngagement(x))}</b></p>)}</Card>
      <Card title="Best video">{ranked.filter(x => x.platforms.some(y => ['tiktok', 'youtube'].includes(y.platform))).slice(0, 2).map(x => <p key={x.id}><RecordLink r={{ type: 'post', id: x.id }} /></p>)}<Badge tone="good">Best platform: TikTok</Badge></Card>
      <Card title="Best posting days"><Bars data={bestDays} /></Card><Card title="Best posting times"><Bars data={bestTimes} /></Card><Card title="Best content categories"><Bars data={bestCategories} /></Card></div>
    <Card title="Follower growth (30d, mock)"><Bars data={platformIds.map(id => ({ k: adapters[id].capabilities.label, v: platformTotals(id, '30d').growth ?? 0 }))} fmt={n => '+' + n} /><p className="muted">Total followers: {num(sum(accounts.map(a => a.followers)))}</p></Card>
  </>)
}
