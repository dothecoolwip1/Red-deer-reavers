// The reinvented model: everything is a Happening, a Person, an Ask, a Story, a Dollar, a File or a Thing.
// These are *views* derived from the mock records so the same data can be shown through the new lens.
import { getState, TODAY } from './store'
import type { RecordRef, RecordType, SocialPost } from './types'

export type HKind = 'practice' | 'event' | 'meeting' | 'deadline' | 'campaign'
export interface Happening { id: string; kind: HKind; title: string; date: string; end?: string; where?: string; who?: string; ref: RecordRef; status?: string; sub?: string }

export const money = (n: number) => (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-CA', { maximumFractionDigits: 0 })
export const num = (n: number) => n.toLocaleString('en-CA')
export const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
export const fmt = (d?: string) => d ? new Date(d.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '—'
export const fmtLong = (d?: string) => d ? new Date(d.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—'
export const days = (d: string) => Math.round((new Date(d).getTime() - new Date(TODAY).getTime()) / 86400000)
export const rel = (d: string) => { const n = days(d); return n === 0 ? 'today' : n === 1 ? 'tomorrow' : n === -1 ? 'yesterday' : n < 0 ? `${-n}d ago` : `in ${n}d` }
export const nameOf = (id?: string) => getState().members.find(m => m.id === id)?.name ?? '—'

export function happenings(): Happening[] {
  const s = getState(); const h: Happening[] = []
  s.practices.forEach(p => h.push({ id: 'h-' + p.id, kind: 'practice', title: p.title, date: p.date, where: p.location.split(',')[0], who: p.coachIds.map(nameOf).join(', '), ref: { type: 'practice', id: p.id }, sub: p.focus, status: p.date < TODAY ? `${p.attendeeIds.length}/${p.expected} came` : `${p.expected} expected` }))
  s.events.forEach(e => h.push({ id: 'h-' + e.id, kind: 'event', title: e.name, date: e.date, where: e.location, who: nameOf(e.organizerId), ref: { type: 'event', id: e.id }, sub: e.type, status: e.status }))
  s.meetings.forEach(m => h.push({ id: 'h-' + m.id, kind: 'meeting', title: m.title, date: m.date, where: m.location, ref: { type: 'meeting', id: m.id }, sub: m.type }))
  s.compliance.filter(c => !c.complete).forEach(c => h.push({ id: 'h-' + c.id, kind: 'deadline', title: c.title, date: c.due, who: c.owner, ref: { type: 'task', id: c.id }, sub: c.category }))
  s.grants.filter(g => ['Researching', 'Eligible', 'Planning', 'Drafting', 'Ready'].includes(g.status)).forEach(g => h.push({ id: 'h-' + g.id, kind: 'deadline', title: 'Grant due: ' + g.name.replace(' (MOCK)', ''), date: g.deadline, who: nameOf(g.ownerId), ref: { type: 'grant', id: g.id }, sub: g.status }))
  s.grants.filter(g => g.status === 'Reporting Required' && g.reportingDeadline).forEach(g => h.push({ id: 'hr-' + g.id, kind: 'deadline', title: 'Grant report: ' + g.name.replace(' (MOCK)', ''), date: g.reportingDeadline!, who: nameOf(g.ownerId), ref: { type: 'grant', id: g.id }, sub: 'reporting' }))
  s.socialCampaigns.forEach(c => h.push({ id: 'h-' + c.id, kind: 'campaign', title: c.name, date: c.start, end: c.end, ref: { type: 'campaign', id: c.id }, sub: c.goal }))
  return h.sort((a, b) => a.date.localeCompare(b.date))
}

// ---- Asks: one pipeline for sponsors, grants, fundraisers ----
export type AskKind = 'sponsor' | 'grant' | 'fundraiser'
export type Stage = 'Idea' | 'Working' | 'Asked' | 'Won' | 'Owed' | 'Done' | 'Lost'
export interface Ask { id: string; kind: AskKind; title: string; from: string; stage: Stage; value: number; got: number; next?: string; nextLabel?: string; owner: string; ref: RecordRef; obligations: { text: string; done: boolean }[] }
export function asks(): Ask[] {
  const s = getState(); const a: Ask[] = []
  const sp: Record<string, Stage> = { Prospect: 'Idea', Contacted: 'Working', Interested: 'Working', Negotiating: 'Asked', Active: 'Won', 'Renewal Due': 'Owed', Declined: 'Lost' }
  s.sponsors.forEach(x => a.push({ id: 'a-' + x.id, kind: 'sponsor', title: x.company, from: x.contact || 'no contact yet', stage: sp[x.status], value: x.value, got: ['Active', 'Renewal Due'].includes(x.status) ? x.value : 0, next: x.nextFollowUp || undefined, nextLabel: x.status === 'Renewal Due' ? 'renewal' : 'follow-up', owner: 'Alex Hartwell', ref: { type: 'sponsor', id: x.id }, obligations: x.promised.map(p => ({ text: p, done: x.delivered.includes(p) })) }))
  const gs: Record<string, Stage> = { Researching: 'Idea', Eligible: 'Idea', Planning: 'Working', Drafting: 'Working', Ready: 'Working', Submitted: 'Asked', Approved: 'Won', Declined: 'Lost', 'Reporting Required': 'Owed', Complete: 'Done' }
  s.grants.forEach(g => a.push({ id: 'a-' + g.id, kind: 'grant', title: g.name.replace(' (MOCK)', ''), from: g.funder.replace(' (MOCK)', ''), stage: gs[g.status], value: g.requested || g.max, got: g.received, next: g.status === 'Reporting Required' ? g.reportingDeadline : ['Submitted', 'Approved', 'Complete', 'Declined'].includes(g.status) ? undefined : g.deadline, nextLabel: g.status === 'Reporting Required' ? 'report due' : 'deadline', owner: nameOf(g.ownerId), ref: { type: 'grant', id: g.id }, obligations: g.requirements }))
  s.fundraisers.forEach(f => { const raised = sum(f.donations.map(d => d.amount)); a.push({ id: 'a-' + f.id, kind: 'fundraiser', title: f.name, from: 'community', stage: f.status === 'Complete' ? 'Done' : f.status === 'Active' ? 'Asked' : 'Working', value: f.goal, got: raised, next: f.status === 'Complete' ? undefined : f.end, nextLabel: 'ends', owner: nameOf(f.organizerId), ref: { type: 'fundraiser', id: f.id }, obligations: [] }) })
  return a
}
export const stages: Stage[] = ['Idea', 'Working', 'Asked', 'Won', 'Owed', 'Done', 'Lost']

// ---- People: one directory ----
export type PersonKind = 'member' | 'volunteer' | 'contact'
export interface Person { id: string; kind: PersonKind; name: string; line: string; tags: string[]; ref: RecordRef; flag?: string }
export function people(): Person[] {
  const s = getState(); const p: Person[] = []
  s.members.forEach(m => p.push({ id: 'p-' + m.id, kind: 'member', name: m.name, line: m.orgRole, tags: [m.status, ...m.tags], ref: { type: 'member', id: m.id }, flag: m.status === 'Pending' ? 'waiver + dues' : m.duesStatus === 'Owing' && m.status === 'Active' ? 'dues owing' : m.status === 'Expired' ? 'lapsed' : undefined }))
  s.volunteers.filter(v => !v.memberId).forEach(v => p.push({ id: 'p-' + v.id, kind: 'volunteer', name: v.name, line: v.roles.join(', '), tags: ['Volunteer'], ref: { type: 'volunteer', id: v.id } }))
  s.contacts.forEach(c => p.push({ id: 'p-' + c.id, kind: 'contact', name: c.name, line: `${c.org} · ${c.category}`, tags: [c.category], ref: { type: 'contact', id: c.id }, flag: c.followUp && c.followUp <= '2026-10-21' ? 'follow up ' + rel(c.followUp) : undefined }))
  return p
}

// ---- Stories: a thing that happened/will happen, told across platforms ----
export interface Story { id: string; title: string; posts: SocialPost[]; status: string; reach: number; eng: number; sponsors: string[]; anchor?: RecordRef; when: string }
export const postReach = (p: SocialPost) => sum(p.platforms.map(pp => pp.metrics.find(m => ['reach', 'views', 'impressions'].includes(m.key))?.value ?? 0))
export const postEng = (p: SocialPost) => sum(p.platforms.flatMap(pp => pp.metrics.filter(m => ['likes', 'reactions', 'comments', 'shares', 'saves'].includes(m.key)).map(m => m.value)))
export function stories(): Story[] {
  const s = getState(); const groups = new Map<string, SocialPost[]>()
  for (const p of s.socialPosts) { const k = p.eventId ? 'event:' + p.eventId : p.fundraiserId ? 'fundraiser:' + p.fundraiserId : p.campaignId ? 'campaign:' + p.campaignId : 'post:' + p.id; groups.set(k, [...(groups.get(k) ?? []), p]) }
  const out: Story[] = []
  for (const [k, posts] of groups) {
    const [type, id] = k.split(':') as [RecordType, string]
    const title = type === 'event' ? s.events.find(e => e.id === id)?.name : type === 'fundraiser' ? s.fundraisers.find(e => e.id === id)?.name : type === 'campaign' ? s.socialCampaigns.find(e => e.id === id)?.name : posts[0].title
    const pub = posts.filter(p => p.status === 'Published')
    const status = pub.length === posts.length ? 'Told' : posts.some(p => ['Review'].includes(p.status)) ? 'Needs approval' : posts.some(p => p.status === 'Scheduled') ? 'Scheduled' : posts.some(p => p.status === 'Failed') ? 'Problem' : pub.length ? 'In progress' : 'Draft'
    out.push({ id: k.replace(':', '-'), title: title ?? '?', posts, status, reach: sum(pub.map(postReach)), eng: sum(pub.map(postEng)), sponsors: [...new Set(posts.flatMap(p => p.sponsorIds))], anchor: type === 'post' ? undefined : { type, id }, when: posts.map(p => p.publishedAt ?? p.scheduledFor ?? '9999').sort()[0].slice(0, 10) })
  }
  return out.sort((a, b) => b.when.localeCompare(a.when))
}

// ---- Inbox: everything waiting on a decision ----
export interface InboxItem { id: string; kind: 'money' | 'post' | 'person' | 'deadline' | 'gear' | 'task'; title: string; detail: string; for: string[]; ref: RecordRef; action?: { label: string; run: () => void }; secondary?: { label: string; run: () => void } }

// ---- Attachments: what hangs off a record ----
export function attached(ref: RecordRef) {
  const s = getState(); const is = (r?: RecordRef) => r?.type === ref.type && r.id === ref.id
  const fk = ({ event: 'eventId', fundraiser: 'fundraiserId', program: 'programId', campaign: 'campaignId' } as Record<string, string>)[ref.type]
  const posts = s.socialPosts.filter(p => (fk && (p as any)[fk] === ref.id) || (ref.type === 'sponsor' && p.sponsorIds.includes(ref.id)))
  const tx = s.transactions.filter(t => is(t.related))
  const expenses = s.expenses.filter(e => is(e.related))
  const docs = s.docs.filter(d => is(d.related))
  const tasks = s.tasks.filter(t => is(t.related))
  const logs = s.volunteerLogs.filter(l => (ref.type === 'event' && l.eventId === ref.id) || (ref.type === 'program' && l.programId === ref.id) || (ref.type === 'fundraiser' && l.fundraiserId === ref.id))
  let peopleIds: string[] = []; let gearIds: string[] = []
  if (ref.type === 'event') { const e = s.events.find(x => x.id === ref.id)!; peopleIds = [e.organizerId]; gearIds = e.equipmentIds; logs.forEach(l => { const v = s.volunteers.find(v => v.id === l.volunteerId); if (v?.memberId) peopleIds.push(v.memberId) }) }
  if (ref.type === 'practice') { const p = s.practices.find(x => x.id === ref.id)!; peopleIds = [...p.coachIds, ...p.attendeeIds] }
  if (ref.type === 'meeting') peopleIds = s.meetings.find(x => x.id === ref.id)!.attendeeIds
  if (ref.type === 'program') { const p = s.programs.find(x => x.id === ref.id)!; peopleIds = [p.ownerId, ...p.participantIds] }
  if (ref.type === 'fundraiser') { const f = s.fundraisers.find(x => x.id === ref.id)!; peopleIds = [f.organizerId]; logs.forEach(l => { const v = s.volunteers.find(v => v.id === l.volunteerId); if (v?.memberId) peopleIds.push(v.memberId) }) }
  if (ref.type === 'grant') peopleIds = [s.grants.find(x => x.id === ref.id)!.ownerId]
  return { posts, tx, expenses, docs, tasks, logs, people: [...new Set(peopleIds)], gear: gearIds, hours: sum(logs.map(l => l.hours)), spent: sum(tx.filter(t => t.amount < 0).map(t => -t.amount)), earned: sum(tx.filter(t => t.amount > 0).map(t => t.amount)) }
}
export const routeFor = (r: RecordRef) => ({ member: '/people/', volunteer: '/people/', contact: '/people/', sponsor: '/funding/', grant: '/funding/', fundraiser: '/funding/', practice: '/happenings/', event: '/happenings/', meeting: '/happenings/', campaign: '/stories/campaign-', post: '/stories/post-', program: '/happenings/program-', equipment: '/gear', expense: '/money/inbox', document: '/files', task: '/inbox' } as Record<RecordType, string>)[r.type] + (['equipment', 'expense', 'document', 'task'].includes(r.type) ? '' : r.id)
export function labelFor(r: RecordRef): string {
  const s = getState(); const f = (arr: any[], k: string) => arr.find(x => x.id === r.id)?.[k]
  return ({ member: f(s.members, 'name'), volunteer: f(s.volunteers, 'name'), contact: f(s.contacts, 'name'), sponsor: f(s.sponsors, 'company'), grant: f(s.grants, 'name'), fundraiser: f(s.fundraisers, 'name'), practice: f(s.practices, 'title'), event: f(s.events, 'name'), meeting: f(s.meetings, 'title'), campaign: f(s.socialCampaigns, 'name'), post: f(s.socialPosts, 'title'), program: f(s.programs, 'name'), equipment: f(s.equipment, 'name'), expense: f(s.expenses, 'vendor'), document: f(s.docs, 'title'), task: f(s.tasks, 'title') ?? f(s.compliance, 'title') } as Record<RecordType, string>)[r.type] ?? r.id
}
