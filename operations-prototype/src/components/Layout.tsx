import { useState, type ReactNode } from 'react'
import { NavLink, useLocation, Link } from 'react-router-dom'
import { navGroups, can, roles, idForPath } from '../utils/nav'
import { useSession, setRole } from '../services/store'
import { CreateHost } from './create'
import type { RoleId } from '../types'

export default function Layout({ children }: { children: ReactNode }) {
  const { role, toast } = useSession(); const [open, setOpen] = useState(false); const loc = useLocation()
  const allowed = can(role, idForPath(loc.pathname))
  return (
    <div className="app">
      <header className="topbar">
        <button className="btn ghost menu" onClick={() => setOpen(o => !o)} aria-label="Menu">☰</button>
        <img src="./logo.jpg" alt="" className="logo" />
        <div className="brand"><b>Red Deer Reavers</b> <span className="muted">Operations</span></div>
        <span className="proto-tag">PROTOTYPE · MOCK DATA</span>
        <div className="grow" />
        <label className="role-sw">Viewing as
          <select value={role} onChange={e => setRole(e.target.value as RoleId)} aria-label="Role switcher">{roles.map(r => <option key={r}>{r}</option>)}</select>
        </label>
      </header>
      <div className="body">
        <nav className={'sidebar' + (open ? ' open' : '')} onClick={() => setOpen(false)}>
          {navGroups.map(g => {
            const items = g.items.filter(i => can(role, i.id)); if (!items.length) return null
            return <div key={g.title} className="nav-group"><div className="nav-title">{g.title}</div>
              {items.map(i => <NavLink key={i.id} to={i.to} end={i.to === '/' || i.to === '/social'} className={({ isActive }) => 'nav-link' + (isActive ? ' on' : '')}><span>{i.icon}</span> {i.label}</NavLink>)}</div>
          })}
          <div className="nav-group"><div className="nav-title">Outside prototype</div><a className="nav-link" href="../index.html">↩ Live Reavers website</a></div>
        </nav>
        <main className="main">
          {allowed ? children : <div className="card restricted"><h2>🔒 Restricted for {role}</h2><p>In the real system this section would be hidden or read-only for this role. Switch role (top right) to see it.</p><Link className="btn primary" to="/">Back to dashboard</Link></div>}
        </main>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
      <CreateHost />
    </div>
  )
}
