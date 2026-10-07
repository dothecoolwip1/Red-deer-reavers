// Domain actions for non-social modules. FUTURE: swap bodies for Supabase RPC/queries; signatures stay.
import { getState, patchItem, addItem, uid, toast } from './store'
import { sum } from '../utils/format'
import type { ExpenseStatus, Transaction } from '../types'
import { OPENING_BALANCE } from '../data/finance'

export const taskService = {
  toggle(id: string) { patchItem('tasks', id, t => ({ status: (t.status === 'Done' ? 'Open' : 'Done') as 'Open' | 'Done' })) },
  setStatus(id: string, status: 'Open' | 'In Progress' | 'Done') { patchItem('tasks', id, { status }) },
}
export const practiceService = {
  toggleCheckIn(practiceId: string, memberId: string) {
    patchItem('practices', practiceId, p => ({ attendeeIds: p.attendeeIds.includes(memberId) ? p.attendeeIds.filter(x => x !== memberId) : [...p.attendeeIds, memberId] }))
  },
}
export const equipmentService = {
  checkout(id: string, memberId: string) { patchItem('equipment', id, { assignedTo: memberId }); toast('Checked out (mock)') },
  return(id: string) { patchItem('equipment', id, { assignedTo: undefined }); toast('Returned (mock)') },
}
const flow: ExpenseStatus[] = ['Draft', 'Submitted', 'Treasurer Review', 'Approved', 'Paid']
export const expenseService = {
  flow,
  advance(id: string) {
    const e = getState().expenses.find(x => x.id === id); if (!e) return
    const i = flow.indexOf(e.status); if (i < 0 || i >= flow.length - 1) return
    const next = flow[i + 1]; patchItem('expenses', id, { status: next })
    if (next === 'Paid') {
      const tx: Transaction = { id: uid('tx'), date: '2026-10-07', description: `Reimbursement — ${e.vendor}`, amount: -e.amount, category: e.category, related: e.related, receiptDocId: e.receiptDocId }
      addItem('transactions', tx)
    }
    toast(`Expense → ${next}`)
  },
  reject(id: string) { patchItem('expenses', id, { status: 'Rejected' }); toast('Expense rejected') },
}
export const financeService = {
  totals() {
    const tx = getState().transactions
    const inc = sum(tx.filter(t => t.amount > 0).map(t => t.amount)); const out = -sum(tx.filter(t => t.amount < 0).map(t => t.amount))
    return { income: inc, spending: out, balance: OPENING_BALANCE + inc - out, byCategory: (c: string) => sum(tx.filter(t => t.category === c).map(t => t.amount)) }
  },
}
export function fundraiserStats(fid: string) {
  const s = getState(); const f = s.fundraisers.find(x => x.id === fid)!
  const raised = sum(f.donations.map(d => d.amount))
  const expenses = sum(s.transactions.filter(t => t.amount < 0 && t.related?.type === 'fundraiser' && t.related.id === fid).map(t => -t.amount))
  const hours = sum(s.volunteerLogs.filter(l => l.fundraiserId === fid).map(l => l.hours))
  return { raised, expenses, net: raised - expenses, hours, pct: f.goal ? Math.round((raised / f.goal) * 100) : 0 }
}
export function volunteerHoursTotal() { return sum(getState().volunteerLogs.map(l => l.hours)) }
export function attendanceFor(memberId: string) {
  const ps = getState().practices.filter(p => p.date <= '2026-10-07')
  return { attended: ps.filter(p => p.attendeeIds.includes(memberId)).length, total: ps.length }
}
export function memberHours(memberId: string) {
  const s = getState(); const v = s.volunteers.find(x => x.memberId === memberId)
  return v ? sum(s.volunteerLogs.filter(l => l.volunteerId === v.id).map(l => l.hours)) : 0
}
