import { Panel, Kpi, Bars, Pill } from '../ui'
import { money, sum, stories, postReach, fmt } from '../model'
import { useStore } from '../store'
import { Link } from 'react-router-dom'

export default function Year() {
  const s = useStore(); const inc = sum(s.transactions.filter(t => t.amount > 0).map(t => t.amount)); const out = -sum(s.transactions.filter(t => t.amount < 0).map(t => t.amount))
  const told = stories().filter(st => st.reach > 0); const hours = sum(s.volunteerLogs.map(l => l.hours)); const done = s.events.filter(e => e.status === 'Complete')
  return (<>
    <div className="head"><div><h1>2026 so far</h1><p>The annual report writes itself from happenings, asks, the ledger and stories. Nothing here was typed in separately. Fill in the gaps as the year goes; at the AGM it's done.</p></div><Pill t="warn">mock data</Pill></div>
    <div className="grid g4" style={{ marginBottom: '1rem' }}><Kpi v={s.members.filter(m => m.status === 'Active').length} l="active members" /><Kpi v={s.practices.filter(p => p.date <= '2026-10-07').length} l="practices held" /><Kpi v={hours} l="volunteer hours" /><Kpi v={told.reduce((a, st) => a + st.reach, 0).toLocaleString()} l="people reached online" /></div>
    <div className="grid g2">
      <Panel title="What we did"><ul className="list">{done.map(e => <li key={e.id}><div className="main"><b><Link to={'/happenings/' + e.id}>{e.name}</Link></b><span>{fmt(e.date)} · {e.attendance} people · {e.finalReport || 'no write-up yet'}</span></div></li>)}</ul></Panel>
      <Panel title="Money"><div className="grid g3" style={{ gap: '.5rem' }}><Kpi v={money(inc)} l="in" t="ok" /><Kpi v={money(out)} l="out" t="ember" /><Kpi v={money(3200 + inc - out)} l="bank" /></div><Bars data={['Membership', 'Sponsorship', 'Fundraising', 'Grants', 'Donations'].map(c => ({ k: c, v: sum(s.transactions.filter(t => t.category === c).map(t => t.amount)) }))} fmt={money} /></Panel>
      <Panel title="Who backed us"><ul className="list">{s.sponsors.filter(x => ['Active', 'Renewal Due'].includes(x.status)).map(x => <li key={x.id}><div className="main"><b><Link to={'/funding/' + x.id}>{x.company}</Link></b><span>{x.level} · {s.socialPosts.filter(p => p.status === 'Published' && p.sponsorIds.includes(x.id)).length} public thank-yous</span></div><span className="mono">{money(x.value)}</span></li>)}{s.grants.filter(g => g.received > 0).map(g => <li key={g.id}><div className="main"><b><Link to={'/funding/' + g.id}>{g.name.replace(' (MOCK)', '')}</Link></b><span>grant</span></div><span className="mono">{money(g.received)}</span></li>)}</ul></Panel>
      <Panel title="How it was told"><Bars data={told.slice(0, 6).map(st => ({ k: st.title, v: st.reach }))} fmt={n => n.toLocaleString()} /></Panel>
      <Panel title="Programs"><ul className="list">{s.programs.map(p => <li key={p.id}><div className="main"><b><Link to={'/happenings/program-' + p.id}>{p.name}</Link></b><span>{p.milestones.filter(m => m.done).length}/{p.milestones.length} milestones</span></div><Pill>{p.status}</Pill></li>)}</ul></Panel>
      <Panel title="Gear & safety"><p>{sum(s.equipment.map(e => e.qty))} items worth {money(sum(s.equipment.map(e => e.value * e.qty)))} to the club. {s.incidents.length} incidents logged, {s.incidents.filter(i => i.status === 'Closed').length} closed.</p></Panel>
    </div>
    <Panel title="Still to write before the AGM"><ul><li>Goals for 2027 (youth pilot, hosted tournament, 25 members)</li><li>President's letter</li><li>Photos: pick 6 from the media library</li></ul><p className="faint">Export to PDF would live here. In the mock it's a button that does nothing.</p></Panel>
  </>)
}
