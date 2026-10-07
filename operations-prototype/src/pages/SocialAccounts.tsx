import { Badge, Card, PageHeader, Mock, Kv } from '../components/ui'
import { useColl } from '../services/store'
import { socialService, adapters } from '../services/social'
import { num } from '../utils/format'
import { PlatformTag, SocialNav } from './social-common'

export default function SocialAccounts() {
  const acc = useColl('socialAccounts')
  return (<><PageHeader title="Social Accounts" subtitle="Connection management concept" /><SocialNav />
    <Mock>Visual only. No OAuth, no tokens, no credentials are created, requested or stored. Connect/Disconnect just flips a flag in memory.</Mock>
    <div className="grid g-cards">{acc.map(a => { const c = adapters[a.platform].capabilities; return (
      <Card key={a.id} title={<PlatformTag p={a.platform} />} actions={<Badge tone={a.connected ? 'good' : 'bad'}>{a.connected ? 'Connected' : 'Not Connected'}</Badge>}>
        <div className="row"><div className="ph" style={{ width: 48, height: 48, borderRadius: '50%', background: c.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>RDR</div><div><b>{a.name}</b><div className="muted">{a.handle}</div></div></div>
        <Kv k="Permissions" v={<Badge>{a.permissions}</Badge>} /><Kv k="Last sync" v={a.lastSync} /><Kv k="Token health (concept)" v={<Badge>{a.tokenHealth}</Badge>} /><Kv k="Followers" v={num(a.followers)} /><Kv k="Future API" v={<span className="muted">{c.note}</span>} />
        <div className="row wrap" style={{ marginTop: '.5rem' }}>{a.connected ? <><button className="btn sm danger" onClick={() => socialService.setAccount(a.id, false)}>Disconnect</button><button className="btn sm" onClick={() => socialService.setAccount(a.id, true)}>Reconnect</button></> : <button className="btn sm primary" onClick={() => socialService.setAccount(a.id, true)}>Connect (simulated)</button>}</div></Card>) })}</div></>)
}
