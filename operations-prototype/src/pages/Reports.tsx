import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, PageHeader, Mock, Filters } from '../components/ui'
import { reportDefs } from '../data/social'
import { buildReport, buildAnnual } from '../services/reports'
import { toast } from '../services/store'
import { toCsv } from '../utils/format'

export function ReportView({ title, sections, csv }: ReturnType<typeof buildReport>) {
  const dl = () => { const b = new Blob([toCsv(csv as any)], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = title.replace(/\W+/g, '_') + '.csv'; a.click(); toast('CSV generated locally from mock data') }
  return (<>
    <div className="row wrap no-print" style={{ marginBottom: '.6rem' }}><button className="btn primary" onClick={() => window.print()}>Print</button><button className="btn" onClick={() => toast('Export PDF simulated — use Print → Save as PDF for now')}>Export PDF</button><button className="btn" onClick={dl}>Export CSV</button></div>
    <div className="report"><h1>{title}</h1><p className="muted">Red Deer Reavers · generated from MOCK data · {new Date('2026-10-07').toDateString()}</p>
      {sections.map(s => <div key={s.title}><h2>{s.title}</h2>{s.lines?.map((l, i) => <p key={i}>{l}</p>)}{s.table && <div className="table-wrap"><table className="dt"><thead><tr>{s.table.head.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{s.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} data-label={s.table!.head[j]}>{c}</td>)}</tr>)}</tbody></table></div>}</div>)}</div></>)
}
export default function Reports() {
  const [id, setId] = useState<string | null>(null); const r = id ? buildReport(id) : null
  return (<><PageHeader title="Reporting Centre" actions={<Link className="btn" to="/annual-report">Annual Report builder</Link>} /><Mock>Print-friendly previews built from the same mock data as every other module.</Mock>
    {!r ? <div className="grid g-cards">{reportDefs.map(d => <Card key={d.id} title={d.title}><p className="muted">{d.description}</p><button className="btn primary sm" onClick={() => setId(d.id)}>Preview</button></Card>)}</div> : <><button className="btn no-print" style={{ marginBottom: '.6rem' }} onClick={() => setId(null)}>← All reports</button><ReportView {...r} /></>}</>)
}
export function AnnualReport() {
  const [y, setY] = useState('2026')
  return (<><PageHeader title="Annual Report Builder" subtitle="Every module feeds one report" /><Mock>2025 only shows what exists in mock data — most of it is empty by design.</Mock><div className="no-print" style={{ marginBottom: '.6rem' }}><Filters options={['2026', '2025'] as const} value={y as any} onChange={setY as any} /></div><ReportView {...buildAnnual(y)} /></>)
}
