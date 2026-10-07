import { Route, Routes, NavLink, useLocation } from 'react-router-dom'
import { useStore, usePersona, setPersona, personas, useToast, reset, type PersonaId } from './store'
import { inbox } from './pages/Inbox'
import Today from './pages/Today'; import Inbox from './pages/Inbox'; import { Happenings, HappeningDetail } from './pages/Happenings'; import { People, PersonDetail } from './pages/People'
import { Funding, AskDetail } from './pages/Funding'; import Money from './pages/Money'; import Files from './pages/Files'; import Gear from './pages/Gear'
import { Stories, StoryDetail, NewStory } from './pages/Stories'; import Year from './pages/Year'; import Programs from './pages/Programs'; import Reports from './pages/Reports'; import Concept from './pages/Concept'

const nav = [['/', '🏠', 'Today'], ['/inbox', '📥', 'Inbox'], ['/happenings', '📅', 'Happenings'], ['/programs', '🎯', 'Programs'], ['/people', '👥', 'People'], ['/funding', '🤝', 'Funding'], ['/money', '💵', 'Money'], ['/money/budget', '📊', 'Budget'], ['/files', '📁', 'Files'], ['/stories', '📣', 'Stories'], ['/gear', '🛡️', 'Gear & safety'], ['/reports', '📋', 'Reports'], ['/year', '📘', 'The year'], ['/concept', '💡', 'The idea']] as const
const hide: Record<PersonaId, string[]> = { alex: [], brynn: ['/gear'], finn: ['/money', '/money/budget', '/gear'], dmitri: ['/money', '/money/budget', '/funding', '/reports'], kira: ['/inbox', '/funding', '/money', '/money/budget', '/files', '/gear', '/people', '/year', '/reports', '/programs'] }
export default function App() {
  useStore(); const me = usePersona(); const toast = useToast(); const n = inbox(me).length; const loc = useLocation()
  const items = nav.filter(([to]) => !hide[me.id].includes(to)); const mobile = items.filter(([to]) => ['/', '/inbox', '/happenings', '/stories', '/money'].includes(to)).slice(0, 4)
  return (<div className="app">
    <aside className="rail"><div className="logo"><img src="./logo.jpg" alt="" /><b>Red Deer Reavers<br /><span className="faint" style={{ fontFamily: 'var(--body)', fontWeight: 400 }}>concept · mock data</span></b></div>
      {items.map(([to, ic, l]) => <NavLink key={to} to={to} end={to === '/' || to === '/money'} className={({ isActive }) => 'nav' + (isActive ? ' on' : '')}><span className="ic">{ic}</span>{l}{to === '/inbox' && n > 0 && <span className="n">{n}</span>}</NavLink>)}
      <div style={{ marginTop: 'auto' }} className="faint"><button className="btn ghost s" onClick={reset}>reset data</button></div></aside>
    <main className="page">
      <div className="persona"><span className="tag">Viewing as</span><select value={me.id} onChange={e => setPersona(e.target.value as PersonaId)} aria-label="Persona">{personas.map(p => <option key={p.id} value={p.id}>{p.name} · {p.role}</option>)}</select><span className="muted" style={{ fontSize: '.9rem' }}>{me.blurb}</span></div>
      {hide[me.id].some(h => loc.pathname === h || loc.pathname.startsWith(h + '/')) ? <div className="panel" style={{ textAlign: 'center', padding: '2rem' }}><h2>Not for {me.name.split(' ')[0]}</h2><p className="muted">A {me.role.toLowerCase()} wouldn't see this. Switch who you're viewing as, above.</p></div> :
      <Routes><Route path="/" element={<Today />} /><Route path="/inbox" element={<Inbox />} /><Route path="/happenings" element={<Happenings />} /><Route path="/happenings/:id" element={<HappeningDetail />} /><Route path="/people" element={<People />} /><Route path="/people/:id" element={<PersonDetail />} /><Route path="/funding" element={<Funding />} /><Route path="/funding/:id" element={<AskDetail />} /><Route path="/money" element={<Money />} /><Route path="/money/:tab" element={<Money />} /><Route path="/files" element={<Files />} /><Route path="/gear" element={<Gear />} /><Route path="/stories" element={<Stories />} /><Route path="/stories/new" element={<NewStory />} /><Route path="/stories/:id" element={<StoryDetail />} /><Route path="/year" element={<Year />} /><Route path="/programs" element={<Programs />} /><Route path="/reports" element={<Reports />} /><Route path="/concept" element={<Concept />} /><Route path="*" element={<p>Not found.</p>} /></Routes>}
    </main>
    <nav className="tabbar">{mobile.map(([to, ic, l]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'on' : ''}><span className="ic">{ic}</span>{l}{to === '/inbox' && n > 0 && ` (${n})`}</NavLink>)}<NavLink to="/concept" className={({ isActive }) => isActive ? 'on' : ''}><span className="ic">☰</span>More</NavLink></nav>
    {toast && <div className="toast">{toast}</div>}
  </div>)
}
