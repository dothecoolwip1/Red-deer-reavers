import { daysUntil } from './format'
import type { ComplianceItem } from '../types'
export type CStatus = 'Upcoming' | 'Due Soon' | 'Overdue' | 'Complete'
export function complianceStatus(c: ComplianceItem): CStatus {
  if (c.complete) return 'Complete'
  const d = daysUntil(c.due)
  return d < 0 ? 'Overdue' : d <= 14 ? 'Due Soon' : 'Upcoming'
}
export const statusColor = (s: string): string => {
  const good = ['Active', 'Paid', 'Approved', 'Complete', 'Published', 'Carried', 'Connected', 'Healthy', 'Done', 'Closed', 'Awarded', 'Good', 'New', 'Confirmed']
  const warn = ['Pending', 'Submitted', 'Due Soon', 'Review', 'Scheduled', 'Treasurer Review', 'Negotiating', 'Interested', 'Contacted', 'Drafting', 'Planning', 'In Progress', 'Fair', 'Expiring Soon', 'Medium', 'Renewal Due', 'Reporting Required', 'Follow-up', 'Ready', 'Eligible', 'Limited']
  const bad = ['Expired', 'Overdue', 'Rejected', 'Failed', 'Declined', 'Defeated', 'Poor', 'Out of Service', 'High', 'Open', 'Owing', 'Not Connected', 'None']
  return good.includes(s) ? 'good' : bad.includes(s) ? 'bad' : warn.includes(s) ? 'warn' : 'info'
}
