import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { routeFor, labelFor } from './model'
import type { RecordRef } from './types'

const tone = (s: string) => /active|paid|done|won|told|carried|ok|good|complete|approved|published|present|connected|healthy|confirmed|signed/i.test(s) ? 'ok' : /overdue|lost|failed|owing|expired|rejected|problem|out of service|poor|defeated|missing/i.test(s) ? 'bad' : /owed|review|needs|pending|due|asked|scheduled|submitted|renewal|fair|expiring|draft/i.test(s) ? 'warn' : ''
export const Pill = ({ children, t }: { children: ReactNode; t?: string }) => <span className={'pill ' + (t ?? tone(String(children)))}>{children}</span>
export const Panel = ({ title, children, right, className = '' }: { title?: ReactNode; children: ReactNode; right?: ReactNode; className?: string }) => <section className={'panel ' + className}>{(title || right) && <div className="row" style={{ justifyContent: 'space-between', marginBottom: '.6rem' }}><h3 style={{ margin: 0 }}>{title}</h3>{right}</div>}{children}</section>
export const Head = ({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) => <div className="head"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div><div className="row">{right}</div></div>
export const Kpi = ({ v, l, t }: { v: ReactNode; l: string; t?: string }) => <div className={'kpi ' + (t ?? '')}><b>{v}</b><span>{l}</span></div>
export const Meter = ({ v, t }: { v: number; t?: string }) => <div className={'meter ' + (t ?? '')}><i style={{ width: Math.min(100, Math.max(0, v)) + '%' }} /></div>
export const Ref = ({ r }: { r: RecordRef }) => <Link className="chip" to={routeFor(r)}><small>{r.type}</small>{labelFor(r)}</Link>
export function Tabs<T extends string>({ tabs, v, on, counts }: { tabs: readonly T[]; v: T; on: (t: T) => void; counts?: Partial<Record<T, number>> }) { return <div className="tabs">{tabs.map(t => <button key={t} className={'tab' + (t === v ? ' on' : '')} onClick={() => on(t)}>{t}{counts?.[t] !== undefined && <span className="n">{counts[t]}</span>}</button>)}</div> }
export function Seg<T extends string>({ opts, v, on }: { opts: readonly T[]; v: T; on: (t: T) => void }) { return <div className="seg">{opts.map(o => <button key={o} className={o === v ? 'on' : ''} onClick={() => on(o)}>{o}</button>)}</div> }
export const Bars = ({ data, fmt = String }: { data: { k: string; v: number }[]; fmt?: (n: number) => string }) => { const m = Math.max(1, ...data.map(d => d.v)); return <div>{data.map(d => <div className="bar" key={d.k}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.k}</span><div className="track"><i style={{ width: d.v / m * 100 + '%' }} /></div><span className="v">{fmt(d.v)}</span></div>)}</div> }
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) { return <div className="sheet-back" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><div className="sheet" role="dialog" aria-label={title}><div className="row" style={{ justifyContent: 'space-between' }}><h2>{title}</h2><button className="btn ghost" onClick={onClose} aria-label="Close">✕</button></div>{children}</div></div> }
/** Tiny inline form replacing prompt(): one field, enter to submit. */
export function Ask({ label, onSubmit, placeholder = '' }: { label: string; onSubmit: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false); const [v, setV] = useState('')
  if (!open) return <button className="btn s" onClick={() => setOpen(true)}>{label}</button>
  return <form className="row" onSubmit={e => { e.preventDefault(); if (v.trim()) onSubmit(v.trim()); setV(''); setOpen(false) }}><input className="input" style={{ width: 'auto', flex: 1, minWidth: 140 }} autoFocus placeholder={placeholder} value={v} onChange={e => setV(e.target.value)} /><button className="btn s p" type="submit">Add</button><button type="button" className="btn s ghost" onClick={() => setOpen(false)}>✕</button></form>
}
export const Empty = ({ children = 'Nothing here.' }: { children?: ReactNode }) => <p className="faint" style={{ margin: '.5rem 0' }}>{children}</p>
