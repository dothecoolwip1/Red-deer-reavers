import { Link } from 'react-router-dom'
import { Panel, Pill, Meter, Kpi, Ref } from '../ui'
import { money, fmt, rel, nameOf, sum } from '../model'
import { useStore, TODAY } from '../store'

export default function Programs() {
  const s = useStore()
  return (<>
    <div className="head"><div><h1>Programs</h1><p>The club's longer plans: youth, beginners, recruitment, outreach, development. Each one has goals, milestones, a budget, the money backing it, and the work still to do. Open one and you get the same workbench as everything else.</p></div><Link className="btn e" to="/happenings">+ New (via happenings)</Link></div>
    <div className="grid g4" style={{ marginBottom: '1rem' }}><Kpi v={s.programs.filter(p => p.status === 'Active').length} l="running" /><Kpi v={s.programs.filter(p => p.status === 'Planning').length} l="being planned" /><Kpi v={money(sum(s.programs.map(p => p.budget)))} l="planned budget" /><Kpi v={s.tasks.filter(t => t.related?.type === 'program' && t.status !== 'Done').length} l="open to-dos" t="ember" /></div>
    <div className="grid g2">{s.programs.map(p => { const done = p.milestones.filter(m => m.done).length; const next = p.milestones.find(m => !m.done); const todo = s.tasks.filter(t => t.related?.type === 'program' && t.related.id === p.id && t.status !== 'Done'); const grants = s.grants.filter(g => g.programId === p.id); const spent = sum(s.transactions.filter(t => t.amount < 0 && t.related?.type === 'program' && t.related.id === p.id).map(t => -t.amount))
      return <Panel key={p.id} title={<Link to={'/happenings/program-' + p.id}>{p.name}</Link>} right={<Pill>{p.status}</Pill>}>
        <p className="muted" style={{ margin: '0 0 .6rem' }}>{p.goal}</p>
        <div className="row" style={{ justifyContent: 'space-between', fontSize: '.85rem' }}><span>{done}/{p.milestones.length} milestones</span><span className="faint">{fmt(p.start)} → {fmt(p.end)}</span></div><Meter v={p.milestones.length ? done / p.milestones.length * 100 : 0} t="ok" />
        <ul className="list" style={{ marginTop: '.5rem' }}>{next && <li><div className="main"><b>Next: {next.title}</b><span>due {fmt(next.due)} ({rel(next.due)})</span></div><Pill t={next.due < TODAY ? 'bad' : ''}>{next.due < TODAY ? 'late' : 'milestone'}</Pill></li>}
          <li><div className="main"><b>Budget {money(p.budget)}</b><span>{money(spent)} spent · owner {nameOf(p.ownerId)}</span></div></li>
          {grants.length > 0 && <li><div className="main"><b>Funding</b><div className="chips" style={{ marginTop: '.2rem' }}>{grants.map(g => <Ref key={g.id} r={{ type: 'grant', id: g.id }} />)}</div></div></li>}
          {todo.length > 0 && <li><div className="main"><b>{todo.length} to-do{todo.length > 1 ? 's' : ''}</b><span>{todo.slice(0, 2).map(t => t.title).join(' · ')}{todo.length > 2 ? ' …' : ''}</span></div></li>}</ul></Panel> })}</div>
  </>)
}
