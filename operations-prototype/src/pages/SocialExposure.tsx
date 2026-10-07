import { Link } from 'react-router-dom'
import { Badge, Card, DataTable, PageHeader, Mock } from '../components/ui'
import { useColl } from '../services/store'
import { sponsorExposure } from '../services/social'
import { money, num } from '../utils/format'
import { SocialNav } from './social-common'

export default function SocialExposure() {
  const sp = useColl('sponsors'); useColl('socialPosts'); useColl('mediaAssets'); const camps = useColl('socialCampaigns')
  const rows = sp.filter(s => ['Active', 'Renewal Due', 'Negotiating'].includes(s.status)).map(s => ({ id: s.id, s, ex: sponsorExposure(s.id) }))
  return (<><PageHeader title="Sponsor Exposure Tracking" subtitle="Use at renewal time to show sponsors what they received" /><SocialNav /><Mock>Computed live from the mock posts that tag each sponsor.</Mock>
    <div className="grid g-cards" style={{ marginBottom: '.8rem' }}>{rows.map(({ s, ex }) => <Card key={s.id} title={<Link to={`/sponsors/${s.id}`}>{s.company}</Link>} actions={<Badge>{s.status}</Badge>}><p><b>{s.company}</b> received <b>{ex.mentions}</b> social mentions this season with a combined reach of <b>{num(ex.reach)}</b>.</p><p className="muted">Sponsorship value {money(s.value)}</p></Card>)}</div>
    <DataTable rows={rows} cols={[{ key: 's', label: 'Sponsor', render: r => <b>{r.s.company}</b> }, { key: 't', label: 'Tagged posts', render: r => r.ex.mentions }, { key: 'l', label: 'Logo shown', render: r => r.ex.logoShown }, { key: 'p', label: 'Published', render: r => r.ex.published }, { key: 'c', label: 'Campaigns', render: r => r.ex.campaigns.map(c => camps.find(x => x.id === c)?.name).join(', ') || '—' }, { key: 'r', label: 'Est. reach', render: r => num(r.ex.reach) }, { key: 'e', label: 'Engagement', render: r => num(r.ex.engagement) }, { key: 'b', label: 'Benefits delivered', render: r => `${r.s.delivered.length}/${r.s.promised.length}` }]} /></>)
}
