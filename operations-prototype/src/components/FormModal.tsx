import { useState } from 'react'
import { Modal } from './ui'

export interface FieldDef {
  name: string; label: string; type?: 'text' | 'number' | 'date' | 'time' | 'textarea' | 'select' | 'checkbox' | 'list' | 'file'
  options?: (string | { value: string; label: string })[]; required?: boolean; placeholder?: string; hint?: string
}
export type Values = Record<string, any>

export function FormModal({ title, fields, initial = {}, submitLabel = 'Save', onSubmit, onClose }: {
  title: string; fields: FieldDef[]; initial?: Values; submitLabel?: string; onSubmit: (v: Values) => void; onClose: () => void
}) {
  const [v, setV] = useState<Values>(() => {
    const o: Values = {}
    for (const f of fields) o[f.name] = initial[f.name] ?? (f.type === 'checkbox' ? false : f.type === 'select' ? (typeof f.options?.[0] === 'string' ? f.options?.[0] : (f.options?.[0] as any)?.value) ?? '' : '')
    return o
  })
  const set = (n: string, val: any) => setV(p => ({ ...p, [n]: val }))
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const out: Values = { ...v }
    for (const f of fields) {
      if (f.type === 'number') out[f.name] = Number(v[f.name] || 0)
      if (f.type === 'list') out[f.name] = String(v[f.name] || '').split(',').map(s => s.trim()).filter(Boolean)
    }
    onSubmit(out); onClose()
  }
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="form">
        {fields.map(f => (
          <label key={f.name} className={f.type === 'checkbox' ? 'field check' : 'field'}>
            <span>{f.label}{f.required && ' *'}</span>
            {f.type === 'textarea' ? <textarea className="input" rows={3} value={v[f.name]} required={f.required} placeholder={f.placeholder} onChange={e => set(f.name, e.target.value)} />
              : f.type === 'select' ? <select className="input" value={v[f.name]} onChange={e => set(f.name, e.target.value)}>
                {f.options?.map(o => typeof o === 'string' ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}</select>
              : f.type === 'checkbox' ? <input type="checkbox" checked={!!v[f.name]} onChange={e => set(f.name, e.target.checked)} />
              : f.type === 'file' ? <input className="input" type="file" onChange={e => set(f.name, e.target.files?.[0]?.name ?? '')} />
              : <input className="input" type={f.type === 'list' ? 'text' : f.type ?? 'text'} step={f.type === 'number' ? 'any' : undefined} value={v[f.name]} required={f.required} placeholder={f.placeholder ?? (f.type === 'list' ? 'comma, separated' : '')} onChange={e => set(f.name, e.target.value)} />}
            {f.hint && <small className="muted">{f.hint}</small>}
          </label>
        ))}
        <div className="row end"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" type="submit">{submitLabel}</button></div>
        <small className="muted">Mock only — saved in memory, resets on refresh.</small>
      </form>
    </Modal>
  )
}
