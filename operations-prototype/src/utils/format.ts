import { TODAY } from '../data'
export const money = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-CA', { minimumFractionDigits: Math.abs(n) % 1 ? 2 : 0, maximumFractionDigits: 2 })
export const num = (n: number) => n.toLocaleString('en-CA')
export const pct = (a: number, b: number) => (b ? Math.min(100, Math.round((a / b) * 100)) : 0)
export const today = () => TODAY
export const daysUntil = (d: string) => Math.round((new Date(d).getTime() - new Date(TODAY).getTime()) / 86400000)
export const fmtDate = (d?: string) => {
  if (!d) return '—'
  const dt = new Date(d.slice(0, 10) + 'T12:00:00')
  return dt.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}
export const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
export const isPast = (d: string) => d < TODAY
export function dueLabel(d: string) {
  const n = daysUntil(d)
  if (n < 0) return `${-n}d overdue`
  if (n === 0) return 'today'
  return `in ${n}d`
}
export const cx = (...a: (string | false | undefined | null)[]) => a.filter(Boolean).join(' ')
export const ym = (d: string) => d.slice(0, 7)
export function toCsv(rows: Record<string, any>[]) {
  if (!rows.length) return ''
  const keys = Object.keys(rows[0])
  return [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n')
}
