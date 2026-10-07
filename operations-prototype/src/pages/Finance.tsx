import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge, Card, DataTable, Kv, PageHeader, Progress, Stat, Tabs, Bars, RecordLink, Empty, Mock } from '../components/ui'
import { openCreate } from '../components/create'
import { useColl, useSession } from '../services/store'
import { expenseService, financeService } from '../services/ops'
import { categories, incomeCategories } from '../data/finance'
import { fmtDate, money, sum, cx } from '../utils/format'
import { nameOf } from '../utils/links'

const TABS = ['Dashboard', 'Transactions', 'Budget', 'Income', 'Expenses', 'Reimbursements', 'Receipts', 'Categories'] as const
const slug = (t: string) => t.toLowerCase()
export default function Finance() {
  const { tab: p } = useParams(); const nav = useNavigate()
  const tab = TABS.find(t => slug(t) === p) ?? 'Dashboard'
  return (<>
    <PageHeader title="Finance" subtitle="Lightweight nonprofit finance — not accounting software" actions={<><button className="btn" onClick={() => openCreate('receipt')}>Upload Receipt</button><button className="btn" onClick={() => openCreate('transaction')}>+ Transaction</button><button className="btn primary" onClick={() => openCreate('expense')}>+ Add Expense</button></>} />
    <Tabs tabs={TABS} value={tab} onChange={t => nav(`/finance/${slug(t)}`)} />
    {tab === 'Dashboard' && <FinDash />}{tab === 'Transactions' && <Tx />}{tab === 'Budget' && <Budget />}{tab === 'Income' && <Tx income />}
    {tab === 'Expenses' && <Expenses />}{tab === 'Reimbursements' && <Reimb />}{tab === 'Receipts' && <Receipts />}{tab === 'Categories' && <Cats />}
  </>)
}
function FinDash() {
  const tx = useColl('transactions'); const fin = financeService.totals(); const by = (c: string) => sum(tx.filter(t => t.category === c).map(t => Math.abs(t.amount)))
  return (<>
    <div className="grid g4"><Stat label="Current balance" value={money(fin.balance)} /><Stat label="Income YTD" value={money(fin.income)} tone="good" /><Stat label="Spending YTD" value={money(fin.spending)} tone="bad" /><Stat label="Net" value={money(fin.income - fin.spending)} /></div>
    <div className="grid g2" style={{ marginTop: '.8rem' }}>
      <Card title="Income by source"><Bars data={incomeCategories.map(c => ({ k: c, v: by(c) }))} fmt={money} color="#1b7f3b" /></Card>
      <Card title="Spending by area"><Bars data={['Equipment', 'Travel', 'Events', 'Programs', 'Facilities', 'Insurance', 'Marketing'].map(c => ({ k: c, v: by(c) }))} fmt={money} color="#b3261e" /></Card></div>
    <Budget compact />
  </>)
}
function Tx({ income }: { income?: boolean }) {
  const tx = useColl('transactions'); const [cat, setCat] = useState('All')
  const rows = tx.filter(t => (!income || t.amount > 0) && (cat === 'All' || t.category === cat)).sort((a, b) => b.date.localeCompare(a.date))
  return (<><select className="input" style={{ width: 'auto', marginBottom: '.6rem' }} value={cat} onChange={e => setCat(e.target.value)}><option>All</option>{categories.map(c => <option key={c}>{c}</option>)}</select>
    <DataTable rows={rows} cols={[{ key: 'd', label: 'Date', render: t => fmtDate(t.date) }, { key: 'x', label: 'Description', render: t => t.description }, { key: 'c', label: 'Category', render: t => <Badge tone="info">{t.category}</Badge> }, { key: 'a', label: 'Amount', render: t => <b style={{ color: t.amount < 0 ? 'var(--bad)' : 'var(--good)' }}>{money(t.amount)}</b> }, { key: 'r', label: 'Project', render: t => <RecordLink r={t.related} /> }, { key: 'rc', label: 'Receipt', render: t => t.receiptDocId ? <RecordLink r={{ type: 'document', id: t.receiptDocId }} /> : '—' }]} /></>)
}
function Budget({ compact }: { compact?: boolean }) {
  const b = useColl('budget'); const tx = useColl('transactions')
  const rows = b.map(l => { const actual = Math.abs(sum(tx.filter(t => t.category === l.category).map(t => t.amount))); return { ...l, actual, income: incomeCategories.includes(l.category) } })
  return <Card title="Budget vs actual (2026)"><DataTable rows={rows} cols={[{ key: 'c', label: 'Category', render: r => <>{r.category} <Badge tone={r.income ? 'good' : 'warn'}>{r.income ? 'income' : 'expense'}</Badge></> }, { key: 'b', label: 'Budgeted', render: r => money(r.budgeted) }, { key: 'a', label: 'Actual', render: r => money(r.actual) }, { key: 'p', label: compact ? 'Used' : '% of budget', render: r => <Progress value={Math.round(r.actual / r.budgeted * 100)} /> }, { key: 'v', label: 'Variance', render: r => <span style={{ color: (r.income ? r.actual >= r.budgeted : r.actual <= r.budgeted) ? 'var(--good)' : 'var(--bad)' }}>{money(r.income ? r.actual - r.budgeted : r.budgeted - r.actual)}</span> }]} /></Card>
}
function Expenses() {
  const ex = useColl('expenses'); const docs = useColl('docs')
  return <DataTable rows={ex} cols={[{ key: 'd', label: 'Date', render: e => fmtDate(e.date) }, { key: 'v', label: 'Vendor', render: e => <b>{e.vendor}</b> }, { key: 'a', label: 'Amount', render: e => money(e.amount) }, { key: 'c', label: 'Category', render: e => e.category }, { key: 's', label: 'By', render: e => nameOf(e.submitterId) }, { key: 'r', label: 'Project', render: e => <RecordLink r={e.related} /> }, { key: 'rc', label: 'Receipt', render: e => e.receiptDocId && docs.some(d => d.id === e.receiptDocId) ? <RecordLink r={{ type: 'document', id: e.receiptDocId }} /> : <Badge tone="bad">missing</Badge> }, { key: 'st', label: 'Status', render: e => <Badge>{e.status}</Badge> }, { key: 'x', label: '', render: e => e.status === 'Draft' ? <button className="btn sm" onClick={() => expenseService.advance(e.id)}>Submit</button> : null }]} />
}
function Reimb() {
  const ex = useColl('expenses'); const { role } = useSession(); const isTreasurer = ['Treasurer', 'Administrator', 'Executive'].includes(role)
  return (<><Mock>Workflow: Add Expense → Vendor → Amount → Category → Project → Receipt → Submit → Treasurer Review → Approved/Rejected → Paid. {isTreasurer ? 'You can act as Treasurer.' : `As ${role} you can't review — switch role to Treasurer.`}</Mock>
    <div className="grid g-cards">{ex.map(e => { const i = expenseService.flow.indexOf(e.status); return (
      <Card key={e.id} title={`${e.vendor} — ${money(e.amount)}`} actions={<Badge>{e.status}</Badge>}>
        <div className="steps">{expenseService.flow.map((s, k) => <span key={s} className={cx('step', k === i && 'on', k < i && 'done')}>{s}</span>)}{e.status === 'Rejected' && <span className="step on" style={{ background: 'var(--bad)' }}>Rejected</span>}</div>
        <Kv k="Submitted by" v={nameOf(e.submitterId)} /><Kv k="Category" v={e.category} /><Kv k="Project" v={<RecordLink r={e.related} />} /><Kv k="Notes" v={e.notes || '—'} />
        <div className="row wrap" style={{ marginTop: '.4rem' }}>
          {e.status === 'Draft' && <button className="btn sm primary" onClick={() => expenseService.advance(e.id)}>Submit reimbursement</button>}
          {e.status === 'Submitted' && <button className="btn sm" disabled={!isTreasurer} onClick={() => expenseService.advance(e.id)}>Send to Treasurer review</button>}
          {e.status === 'Treasurer Review' && <><button className="btn sm primary" disabled={!isTreasurer} onClick={() => expenseService.advance(e.id)}>Approve</button><button className="btn sm danger" disabled={!isTreasurer} onClick={() => expenseService.reject(e.id)}>Reject</button></>}
          {e.status === 'Approved' && <button className="btn sm primary" disabled={!isTreasurer} onClick={() => expenseService.advance(e.id)}>Mark Paid</button>}
        </div></Card>) })}</div></>)
}
function Receipts() {
  const docs = useColl('docs'); const rows = docs.filter(d => d.category === 'Receipts')
  return <><div className="row end" style={{ marginBottom: '.5rem' }}><button className="btn primary" onClick={() => openCreate('receipt')}>Upload Receipt</button></div><DataTable rows={rows} cols={[{ key: 't', label: 'Receipt', render: d => <b>📎 {d.title}</b> }, { key: 'd', label: 'Date', render: d => fmtDate(d.date) }, { key: 'u', label: 'Uploader', render: d => d.uploader }, { key: 'r', label: 'Attached to', render: d => <RecordLink r={d.related} /> }]} empty={<Empty />} /></>
}
function Cats() {
  const tx = useColl('transactions'); const b = useColl('budget')
  return <Card title="Categories"><DataTable rows={categories.map(c => ({ id: c, name: c }))} cols={[{ key: 'c', label: 'Category', render: r => r.name }, { key: 't', label: 'Type', render: r => incomeCategories.includes(r.name) ? 'Income' : 'Expense' }, { key: 'n', label: 'Transactions', render: r => tx.filter(t => t.category === r.name).length }, { key: 'b', label: 'Budget', render: r => money(b.find(x => x.category === r.name)?.budgeted ?? 0) }]} /></Card>
}
