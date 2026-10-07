import type { Transaction, BudgetLine, Expense } from '../types'

export const categories = ['Membership', 'Sponsorship', 'Fundraising', 'Grants', 'Donations', 'Equipment', 'Travel', 'Events', 'Programs', 'Facilities', 'Insurance', 'Marketing', 'Admin']
export const incomeCategories = ['Membership', 'Sponsorship', 'Fundraising', 'Grants', 'Donations']

const X = (id: string, date: string, description: string, amount: number, category: string, related?: Transaction['related'], receiptDocId?: string): Transaction => ({ id, date, description, amount, category, related, receiptDocId })
export const transactions: Transaction[] = [
  X('tx1', '2026-01-15', 'Membership dues (batch)', 2100, 'Membership'),
  X('tx2', '2026-02-10', 'Ironworks sponsorship (2026)', 2500, 'Sponsorship', { type: 'sponsor', id: 's1' }),
  X('tx3', '2026-02-26', 'School Outreach grant received', 1200, 'Grants', { type: 'grant', id: 'g6' }),
  X('tx4', '2026-03-01', 'Facility rental (Q1)', -900, 'Facilities'),
  X('tx5', '2026-03-10', 'Spring Demo supplies', -240, 'Events', { type: 'event', id: 'ev1' }, 'd20'),
  X('tx6', '2026-04-15', 'Insurance premium', -1800, 'Insurance'),
  X('tx7', '2026-05-12', 'Training gloves', -310, 'Equipment', undefined, 'd21'),
  X('tx8', '2026-06-01', 'Facility rental (Q2)', -900, 'Facilities'),
  X('tx9', '2026-06-20', 'Bottle drive proceeds', 410, 'Fundraising', { type: 'fundraiser', id: 'f3' }),
  X('tx10', '2026-07-01', 'Prairie Brewing sponsorship', 1000, 'Sponsorship', { type: 'sponsor', id: 's2' }),
  X('tx11', '2026-07-03', 'Fair booth supplies', -180, 'Events', { type: 'event', id: 'ev2' }),
  X('tx12', '2026-07-20', 'Event Support grant received', 3500, 'Grants', { type: 'grant', id: 'g10' }),
  X('tx13', '2026-08-05', 'Loaner armour materials', -1250, 'Equipment', { type: 'fundraiser', id: 'f1' }, 'd22'),
  X('tx14', '2026-08-10', 'Local Rec Micro-Grant received', 1500, 'Grants', { type: 'grant', id: 'g2' }),
  X('tx15', '2026-08-22', 'Fundraiser: door + raffle', 2750, 'Fundraising', { type: 'fundraiser', id: 'f1' }),
  X('tx16', '2026-08-21', 'Venue deposit — Legion Hall', -350, 'Events', { type: 'fundraiser', id: 'f1' }, 'd23'),
  X('tx17', '2026-08-22', 'Raffle prize supplies', -220, 'Events', { type: 'fundraiser', id: 'f1' }, 'd24'),
  X('tx18', '2026-08-30', 'Online donations', 650, 'Donations', { type: 'fundraiser', id: 'f1' }),
  X('tx19', '2026-09-01', 'Facility rental (Q3)', -900, 'Facilities'),
  X('tx20', '2026-09-05', 'Printing: banners', -260, 'Marketing', { type: 'fundraiser', id: 'f1' }, 'd25'),
  X('tx21', '2026-09-12', 'School demo travel', -85, 'Travel', { type: 'event', id: 'ev4' }),
  X('tx22', '2026-09-15', 'HACSA affiliation', -250, 'Admin'),
  X('tx23', '2026-09-20', 'Membership dues (new)', 420, 'Membership'),
  X('tx24', '2026-09-26', 'Recruitment night supplies', -75, 'Programs', { type: 'program', id: 'p3' }),
  X('tx25', '2026-04-20', 'Youth program policy consult', -400, 'Programs', { type: 'program', id: 'p1' }),
  X('tx26', '2026-03-20', 'Tournament travel (Calgary)', -620, 'Travel'),
  X('tx27', '2026-05-30', 'Sunset Pizza (in-kind not counted)', 0, 'Sponsorship', { type: 'sponsor', id: 's5' }),
  X('tx28', '2026-10-02', 'Winter raffle early tickets', 320, 'Fundraising', { type: 'fundraiser', id: 'f2' }),
]
export const budget: BudgetLine[] = [
  { id: 'b1', category: 'Membership', budgeted: 3000 }, { id: 'b2', category: 'Sponsorship', budgeted: 5000 },
  { id: 'b3', category: 'Fundraising', budgeted: 6000 }, { id: 'b4', category: 'Grants', budgeted: 8000 }, { id: 'b5', category: 'Donations', budgeted: 800 },
  { id: 'b6', category: 'Equipment', budgeted: 3500 }, { id: 'b7', category: 'Travel', budgeted: 1500 }, { id: 'b8', category: 'Events', budgeted: 2500 },
  { id: 'b9', category: 'Programs', budgeted: 2500 }, { id: 'b10', category: 'Facilities', budgeted: 3600 }, { id: 'b11', category: 'Insurance', budgeted: 1800 },
  { id: 'b12', category: 'Marketing', budgeted: 600 }, { id: 'b13', category: 'Admin', budgeted: 500 },
]
export const OPENING_BALANCE = 3200

const EXP = (id: string, vendor: string, amount: number, category: string, date: string, submitterId: string, status: Expense['status'], related?: Expense['related'], receiptDocId?: string, notes = ''): Expense =>
  ({ id, vendor, amount, category, date, submitterId, status, related, receiptDocId, notes })
export const expenses: Expense[] = [
  EXP('x1', 'Legion Hall', 350, 'Events', '2026-08-21', 'm1', 'Paid', { type: 'fundraiser', id: 'f1' }, 'd23', 'Deposit'),
  EXP('x2', 'Print Shop Red Deer', 260, 'Marketing', '2026-09-05', 'm6', 'Paid', { type: 'fundraiser', id: 'f1' }, 'd25'),
  EXP('x3', 'Webb Leather & Hardware', 1250, 'Equipment', '2026-08-05', 'm7', 'Paid', { type: 'fundraiser', id: 'f1' }, 'd22', 'Armour materials'),
  EXP('x4', 'Superstore', 220, 'Events', '2026-08-22', 'm3', 'Paid', { type: 'fundraiser', id: 'f1' }, 'd24', 'Raffle prizes'),
  EXP('x5', 'Hardware Store', 94.5, 'Equipment', '2026-10-03', 'm7', 'Treasurer Review', { type: 'equipment', id: 'e4' }, undefined, 'Shield strap hardware'),
  EXP('x6', 'Fuel — school demo', 62, 'Travel', '2026-10-01', 'm4', 'Submitted', { type: 'program', id: 'p6' }, undefined, 'Mileage'),
  EXP('x7', 'Staples', 38.2, 'Admin', '2026-09-30', 'm3', 'Approved', undefined, undefined, 'Printer ink for AGM'),
  EXP('x8', 'Dollarama', 27.4, 'Events', '2026-09-26', 'm9', 'Rejected', { type: 'program', id: 'p3' }, undefined, 'No receipt provided'),
  EXP('x9', 'Camera lens cloth & SD cards', 56, 'Marketing', '2026-10-05', 'm6', 'Draft', { type: 'campaign', id: 'cp1' }, undefined, 'For recruitment photos'),
]
