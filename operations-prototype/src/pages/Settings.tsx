import { Badge, Card, PageHeader, Mock, Kv } from '../components/ui'
import { useSession, setRole, resetMockData } from '../services/store'
import { navGroups, roleAccess, roles, can } from '../utils/nav'

export default function Settings() {
  const { role } = useSession()
  return (<><PageHeader title="Settings & Roles" subtitle="Prototype role switcher: sections hide/show to preview future permissions (visual only, not security)" />
    <div className="grid g2"><Card title="Current role"><div className="pills">{roles.map(r => <button key={r} className={'pill' + (r === role ? ' on' : '')} onClick={() => setRole(r)}>{r}</button>)}</div>
      <p className="muted">Sections visible to <b>{role}</b>: {roleAccess[role].length} of {navGroups.flatMap(g => g.items).length}</p></Card>
      <Card title="Prototype"><Mock>Everything here is mock. Data lives in memory only.</Mock><button className="btn danger" onClick={() => { resetMockData() }}>Reset mock data</button>
        <Kv k="Backend" v="None (frontend only)" /><Kv k="Auth" v="None (role switcher only)" /><Kv k="Social credentials" v="None stored" /></Card></div>
    <Card title="Role → section matrix"><div className="table-wrap"><table className="dt"><thead><tr><th>Section</th>{roles.map(r => <th key={r}>{r}</th>)}</tr></thead><tbody>{navGroups.flatMap(g => g.items).map(i => <tr key={i.id}><td data-label="Section">{i.label}</td>{roles.map(r => <td key={r} data-label={r}>{can(r, i.id) ? <Badge tone="good">✓</Badge> : <span className="muted">—</span>}</td>)}</tr>)}</tbody></table></div></Card>
    <Card title="Social approval concept"><ul><li><b>Member</b>: submit content suggestion</li><li><b>Social Media Manager</b>: draft, schedule</li><li><b>Executive</b>: approve</li><li><b>Administrator</b>: publish</li></ul></Card></>)
}
