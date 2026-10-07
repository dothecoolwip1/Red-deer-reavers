import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx } from '../utils/format'
import { statusColor } from '../utils/status'
import { routeFor, labelFor, typeLabel, relatedTo } from '../utils/links'
import type { RecordRef, RecordType } from '../types'

export const Badge = ({ children, tone }: { children: ReactNode; tone?: string }) => {
  const t = tone ?? statusColor(String(children)); return <span className={`badge ${t}`}>{children}</span>
}
export const Card = ({ title, children, actions, className }: { title?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string }) => (
  <section className={cx('card', className)}>
    {(title || actions) && <div className="card-head"><h3>{title}</h3><div className="row">{actions}</div></div>}
    {children}
  </section>
)
export const Stat = ({ label, value, sub, to, tone }: { label: string; value: ReactNode; sub?: ReactNode; to?: string; tone?: string }) => {
  const inner = <><div className="stat-label">{label}</div><div className={cx('stat-value', tone)}>{value}</div>{sub && <div className="stat-sub">{sub}</div>}</>
  return to ? <Link to={to} className="stat">{inner}</Link> : <div className="stat">{inner}</div>
}
export const Progress = ({ value, label }: { value: number; label?: string }) => (
  <div className="progress" title={label}><div style={{ width: Math.min(100, value) + '%' }} /><span>{label ?? value + '%'}</span></div>
)
export const PageHeader = ({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) => (
  <div className="page-head"><div><h1>{title}</h1>{subtitle && <p className="muted">{subtitle}</p>}</div><div className="row wrap">{actions}</div></div>
)
export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: readonly T[]; value: T; onChange: (t: T) => void }) {
  return <div className="tabs">{tabs.map(t => <button key={t} className={cx('tab', t === value && 'on')} onClick={() => onChange(t)}>{t}</button>)}</div>
}
export function useTab<T extends string>(tabs: readonly T[]) { const [t, setT] = useState<T>(tabs[0]); return [t, setT] as const }
export const Empty = ({ children = 'Nothing here yet.' }: { children?: ReactNode }) => <p className="muted empty">{children}</p>

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="modal-back" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={cx('modal', wide && 'wide')} role="dialog" aria-label={title}>
        <div className="modal-head"><h2>{title}</h2><button className="btn ghost" onClick={onClose} aria-label="Close">✕</button></div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export interface Col<T> { key: string; label: string; render: (r: T) => ReactNode; className?: string }
export function DataTable<T extends { id: string }>({ rows, cols, onRow, empty }: { rows: T[]; cols: Col<T>[]; onRow?: (r: T) => void; empty?: ReactNode }) {
  if (!rows.length) return <Empty>{empty}</Empty>
  return (
    <div className="table-wrap">
      <table className="dt">
        <thead><tr>{cols.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead>
        <tbody>{rows.map(r => (
          <tr key={r.id} onClick={onRow ? () => onRow(r) : undefined} className={onRow ? 'click' : ''}>
            {cols.map(c => <td key={c.key} data-label={c.label} className={c.className}>{c.render(r)}</td>)}
          </tr>))}
        </tbody>
      </table>
    </div>
  )
}

export function RecordLink({ r }: { r?: RecordRef }) {
  if (!r) return <span className="muted">—</span>
  return <Link className="chip" to={routeFor(r.type, r.id)} onClick={e => e.stopPropagation()}><b>{typeLabel[r.type]}</b> {labelFor(r)}</Link>
}
/** Cross-system "linked records" panel. */
export function Related({ type, id }: { type: RecordType; id: string }) {
  const items = relatedTo(type, id)
  return <Card title="Linked records (across the system)">{items.length ? <div className="chips">{items.map((i, k) => <RecordLink key={k} r={i} />)}</div> : <Empty>No linked records.</Empty>}</Card>
}

export function SearchBox({ value, onChange, placeholder = 'Search…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input className="input search" type="search" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
}
export function Filters<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return <div className="pills">{options.map(o => <button key={o} className={cx('pill', o === value && 'on')} onClick={() => onChange(o)}>{o}</button>)}</div>
}
export function Bars({ data, max, fmt = (n: number) => String(n), color }: { data: { k: string; v: number }[]; max?: number; fmt?: (n: number) => string; color?: string }) {
  const m = max ?? Math.max(1, ...data.map(d => d.v))
  return <div className="bars">{data.map(d => <div key={d.k} className="bar-row"><span className="bar-k">{d.k}</span><div className="bar"><div style={{ width: (d.v / m) * 100 + '%', background: color }} /></div><span className="bar-v">{fmt(d.v)}</span></div>)}</div>
}
export const Kv = ({ k, v }: { k: string; v: ReactNode }) => <div className="kv"><span>{k}</span><b>{v}</b></div>
export const Mock = ({ children = 'MOCK DATA — nothing here is real or saved' }: { children?: ReactNode }) => <div className="mock-note">{children}</div>
