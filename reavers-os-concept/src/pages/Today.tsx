import { Link } from 'react-router-dom'
import { Panel, Pill, Kpi, Meter } from '../ui'
import { happenings, asks, money, rel, fmt, sum, stories } from '../model'
import { useStore, usePersona, TODAY } from '../store'
import { inbox } from './Inbox'

export default function Today() {
  const s = useStore(); const me = usePersona(); const mine = inbox(me)
  const week = happenings().filter(h => h.date >= TODAY && h.date <= '2026-10-21' && h.kind !== 'campaign')
  const bal = 3200 + sum(s.transactions.map(t => t.amount))
  const openAsks = asks().filter(a => ['Working', 'Asked', 'Owed'].includes(a.stage))
  const member = s.members.find(m => m.id === me.memberId)!
  if (me.id === 'kira') return (<>
    <h1>Hi Kira</h1><p className="muted">A new member sees only what's theirs. Nothing about money, sponsors or other people.</p>
    <div className="grid g2" style={{ marginTop: '1rem' }}>
      <Panel title="Your membership"><ul className="list"><li><div className="main"><b>Status</b></div><Pill>{member.status}</Pill></li><li><div className="main"><b>Dues</b><span>$60 for 2026</span></div><Pill>{member.duesStatus}</Pill></li><li><div className="main"><b>Waiver</b></div><Pill>{member.waivers[0].signed ? 'Signed' : 'Not signed'}</Pill></li><li><div className="main"><b>Vote at the AGM</b></div><Pill>{member.canVote ? 'Eligible' : 'Not yet'}</Pill></li></ul><div className="row" style={{ marginTop: '.6rem' }}><button className="btn p">Pay dues (mock)</button><button className="btn">Sign waiver (mock)</button></div></Panel>
      <Panel title="Next practices">{week.filter(h => h.kind === 'practice').map(h => <div className="item" key={h.id}><div className="date"><b>{fmt(h.date).split(' ')[1]}</b>{fmt(h.date).split(' ')[0]}</div><div className="t"><b><Link to={`/happenings/${h.ref.id}`}>{h.title}</Link></b><span>{h.sub} · {h.where}</span></div></div>)}</Panel>
      <Panel title="AGM, Oct 18"><p className="muted">RSVP so the executive can plan the room.</p><div className="row"><button className="btn p">In person</button><button className="btn">Video</button><button className="btn">Can't make it</button></div></Panel>
    </div></>)
  return (<>
    <h1>{me.id === 'brynn' ? 'Money week' : me.id === 'finn' ? 'Comms week' : me.id === 'dmitri' ? 'Training week' : 'This week'}</h1>
    <p className="muted">Oct 7, 2026. What's happening, and what needs {me.name.split(' ')[0]}.</p>
    <div className="grid split" style={{ marginTop: '1rem' }}>
      <div className="stack">
        <Panel title={`Needs you · ${mine.length}`} right={<Link to="/inbox">open inbox</Link>}>
          {mine.slice(0, 5).map(i => <div className="item" key={i.id}><div className="ic" style={{ fontSize: '1.3rem', textAlign: 'center' }}>{{ money: '💵', post: '📣', person: '🧍', deadline: '⏰', gear: '🛡️', task: '☑️' }[i.kind]}</div><div className="t"><b><Link to="/inbox">{i.title}</Link></b><span>{i.detail}</span></div>{i.action && <button className="btn s e" onClick={i.action.run}>{i.action.label}</button>}</div>)}
          {!mine.length && <p className="faint">Inbox zero.</p>}
        </Panel>
        <Panel title="Next two weeks" right={<Link to="/happenings">all happenings</Link>}>
          {week.map(h => <div className="item" key={h.id}><div className="date"><b>{fmt(h.date).split(' ')[1]}</b>{fmt(h.date).split(' ')[0]}</div><div className="t"><b><Link to={h.ref.type === 'grant' ? `/funding/${h.ref.id}` : h.ref.type === 'task' ? '/inbox' : `/happenings/${h.ref.id}`}>{h.title}</Link></b><span>{h.sub}{h.where ? ' · ' + h.where : ''}{h.who ? ' · ' + h.who : ''}</span></div><Pill t={h.kind === 'deadline' ? (h.date <= '2026-10-12' ? 'bad' : 'warn') : ''}>{rel(h.date)}</Pill></div>)}
        </Panel>
      </div>
      <div className="stack">
        {me.id !== 'dmitri' && <Panel title="Money at a glance" right={<Link to="/money">ledger</Link>}><div className="grid g2"><Kpi v={money(bal)} l="in the bank" /><Kpi v={money(sum(s.expenses.filter(e => ['Submitted', 'Treasurer Review', 'Approved'].includes(e.status)).map(e => e.amount)))} l="waiting to be reimbursed" t="ember" /></div><p className="muted" style={{ margin: '.6rem 0 .2rem' }}>Spent {money(-sum(s.transactions.filter(t => t.amount < 0).map(t => t.amount)))} of $18,000 budgeted spending</p><Meter v={-sum(s.transactions.filter(t => t.amount < 0).map(t => t.amount)) / 180} /></Panel>}
        {me.id !== 'dmitri' && <Panel title="Open asks" right={<Link to="/funding">pipeline</Link>}><ul className="list">{openAsks.slice(0, 5).map(a => <li key={a.id}><div className="main"><b><Link to={`/funding/${a.ref.id}`}>{a.title}</Link></b><span>{a.kind} · {a.next ? `${a.nextLabel} ${rel(a.next)}` : a.stage}</span></div><span className="mono">{money(a.value)}</span></li>)}</ul></Panel>}
        {me.id === 'dmitri' && <Panel title="Gear with problems" right={<Link to="/gear">gear</Link>}><ul className="list">{s.equipment.filter(e => e.issue).map(e => <li key={e.id}><div className="main"><b>{e.name}</b><span>{e.issue}</span></div><Pill>{e.condition}</Pill></li>)}</ul></Panel>}
        <Panel title="Stories" right={<Link to="/stories">all</Link>}><ul className="list">{stories().slice(0, 4).map(st => <li key={st.id}><div className="main"><b><Link to={`/stories/${st.id}`}>{st.title}</Link></b><span>{st.posts.length} posts · {st.reach.toLocaleString()} reached</span></div><Pill>{st.status}</Pill></li>)}</ul></Panel>
      </div>
    </div>
  </>)
}
