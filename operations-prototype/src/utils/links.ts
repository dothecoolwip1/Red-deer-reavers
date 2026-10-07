// Central "record registry": turns {type,id} into a label and route so any record can link to any other.
import { getState } from '../services/store'
import type { RecordRef, RecordType } from '../types'

export const routeFor = (type: RecordType, id: string): string => ({
  member: `/members/${id}`, practice: `/practices/${id}`, program: `/programs/${id}`, task: `/tasks`, event: `/events/${id}`,
  fundraiser: `/fundraising/${id}`, sponsor: `/sponsors/${id}`, grant: `/grants/${id}`, meeting: `/meetings/${id}`,
  equipment: `/equipment`, expense: `/finance/expenses`, document: `/documents`, campaign: `/social/campaigns/${id}`,
  post: `/social/posts/${id}`, contact: `/contacts`, volunteer: `/volunteers`,
} as Record<RecordType, string>)[type]

const colMap: Record<RecordType, [keyof ReturnType<typeof getState>, string]> = {
  member: ['members', 'name'], practice: ['practices', 'title'], program: ['programs', 'name'], task: ['tasks', 'title'], event: ['events', 'name'],
  fundraiser: ['fundraisers', 'name'], sponsor: ['sponsors', 'company'], grant: ['grants', 'name'], meeting: ['meetings', 'title'],
  equipment: ['equipment', 'name'], expense: ['expenses', 'vendor'], document: ['docs', 'title'], campaign: ['socialCampaigns', 'name'],
  post: ['socialPosts', 'title'], contact: ['contacts', 'name'], volunteer: ['volunteers', 'name'],
}
export const typeLabel: Record<RecordType, string> = {
  member: 'Member', practice: 'Practice', program: 'Program', task: 'Task', event: 'Event', fundraiser: 'Fundraiser', sponsor: 'Sponsor', grant: 'Grant',
  meeting: 'Meeting', equipment: 'Equipment', expense: 'Expense', document: 'Document', campaign: 'Campaign', post: 'Social post', contact: 'Contact', volunteer: 'Volunteer',
}
export function labelFor(r?: RecordRef): string {
  if (!r) return '—'
  const [col, field] = colMap[r.type]
  const item = (getState()[col] as any[]).find(x => x.id === r.id)
  return item ? item[field] : r.id
}
export const nameOf = (id?: string) => (id ? getState().members.find(m => m.id === id)?.name ?? id : '—')
export const sponsorName = (id: string) => getState().sponsors.find(s => s.id === id)?.company ?? id
export const volunteerName = (id: string) => getState().volunteers.find(v => v.id === id)?.name ?? id
export const mediaOf = (id: string) => getState().mediaAssets.find(m => m.id === id)

/** Everything in the system that points at a record (the "it's all one platform" view). */
export function relatedTo(type: RecordType, id: string): { type: RecordType; id: string; note?: string }[] {
  const s = getState(); const out: { type: RecordType; id: string; note?: string }[] = []
  const is = (r?: RecordRef) => r && r.type === type && r.id === id
  s.tasks.filter(t => is(t.related)).forEach(t => out.push({ type: 'task', id: t.id, note: t.status }))
  s.docs.filter(d => is(d.related)).forEach(d => out.push({ type: 'document', id: d.id, note: d.category }))
  s.expenses.filter(e => is(e.related)).forEach(e => out.push({ type: 'expense', id: e.id, note: `$${e.amount} ${e.status}` }))
  s.incidents.filter(i => is(i.related)).forEach(i => out.push({ type: 'task', id: i.id, note: 'incident' }))
  const fk = ({ event: 'eventId', fundraiser: 'fundraiserId', program: 'programId', campaign: 'campaignId' } as any)[type]
  if (fk) s.socialPosts.filter(p => (p as any)[fk] === id).forEach(p => out.push({ type: 'post', id: p.id, note: p.status }))
  if (type === 'sponsor') s.socialPosts.filter(p => p.sponsorIds.includes(id)).forEach(p => out.push({ type: 'post', id: p.id, note: 'sponsor tagged' }))
  return out.filter(o => !(o.note === 'incident'))
}
