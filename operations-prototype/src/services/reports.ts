// Report assembly from the same mock data every module uses. FUTURE: server-side views/RPCs.
import { getState } from './store'
import { fundraiserStats, financeService, volunteerHoursTotal } from './ops'
import { sponsorExposure, postReach, postEngagement, overallTotals } from './social'
import { sum, money, num, fmtDate } from '../utils/format'
import { incomeCategories } from '../data/finance'

export interface Section { title: string; lines?: string[]; table?: { head: string[]; rows: (string | number)[][] } }
export function buildReport(id: string): { title: string; sections: Section[]; csv: Record<string, any>[] } {
  const s = getState(); const fin = financeService.totals(); const pub = s.socialPosts.filter(p => p.status === 'Published')
  const tx = s.transactions
  const sec: Record<string, () => { title: string; sections: Section[]; csv: Record<string, any>[] }> = {
    membership: () => ({ title: 'Membership Report', csv: s.members.map(m => ({ name: m.name, status: m.status, role: m.orgRole, dues: m.duesStatus, vote: m.canVote })), sections: [{ title: 'Summary', lines: [`Total ${s.members.length} · Active ${s.members.filter(m => m.status === 'Active').length} · Pending ${s.members.filter(m => m.status === 'Pending').length} · Expired ${s.members.filter(m => m.status === 'Expired').length}`, `Voting eligible: ${s.members.filter(m => m.canVote).length}`] }, { title: 'Roster', table: { head: ['Name', 'Status', 'Role', 'Dues'], rows: s.members.map(m => [m.name, m.status, m.orgRole, m.duesStatus]) } }] }),
    volunteer: () => ({ title: 'Volunteer Hours', csv: s.volunteerLogs, sections: [{ title: 'Total', lines: [`${volunteerHoursTotal()} hours across ${s.volunteers.length} volunteers`] }, { title: 'By volunteer', table: { head: ['Volunteer', 'Hours'], rows: s.volunteers.map(v => [v.name, sum(s.volunteerLogs.filter(l => l.volunteerId === v.id).map(l => l.hours))]) } }, { title: 'By event', table: { head: ['Event', 'Hours'], rows: s.events.map(e => [e.name, sum(s.volunteerLogs.filter(l => l.eventId === e.id).map(l => l.hours))]).filter(r => r[1]) } }] }),
    attendance: () => { const ps = s.practices.filter(p => p.date <= '2026-10-07'); return { title: 'Practice Attendance', csv: ps.map(p => ({ date: p.date, practice: p.title, attended: p.attendeeIds.length, expected: p.expected })), sections: [{ title: 'Per practice', table: { head: ['Date', 'Practice', 'Attended', 'Expected'], rows: ps.map(p => [fmtDate(p.date), p.title, p.attendeeIds.length, p.expected]) } }, { title: 'Per member', table: { head: ['Member', 'Attended'], rows: s.members.filter(m => m.status === 'Active').map(m => [m.name, ps.filter(p => p.attendeeIds.includes(m.id)).length + '/' + ps.length]) } }] } },
    finance: () => ({ title: 'Financial Summary', csv: tx, sections: [{ title: 'Totals', lines: [`Balance ${money(fin.balance)} · Income ${money(fin.income)} · Spending ${money(fin.spending)}`] }, { title: 'Budget vs actual', table: { head: ['Category', 'Budget', 'Actual'], rows: s.budget.map(b => [b.category, money(b.budgeted), money(Math.abs(sum(tx.filter(t => t.category === b.category).map(t => t.amount))))]) } }] }),
    fundraising: () => ({ title: 'Fundraising', csv: s.fundraisers.map(f => ({ name: f.name, goal: f.goal, ...fundraiserStats(f.id) })), sections: [{ title: 'Fundraisers', table: { head: ['Name', 'Goal', 'Raised', 'Expenses', 'Net', 'Vol. hrs'], rows: s.fundraisers.map(f => { const x = fundraiserStats(f.id); return [f.name, money(f.goal), money(x.raised), money(x.expenses), money(x.net), x.hours] }) } }] }),
    sponsors: () => ({ title: 'Sponsors', csv: s.sponsors, sections: [{ title: 'Pipeline', table: { head: ['Company', 'Status', 'Value', 'Renewal'], rows: s.sponsors.map(x => [x.company, x.status, money(x.value), fmtDate(x.renewal)]) } }] }),
    grants: () => ({ title: 'Grants', csv: s.grants.map(g => ({ name: g.name, status: g.status, requested: g.requested, received: g.received })), sections: [{ title: 'Summary', lines: [`Requested ${money(sum(s.grants.map(g => g.requested)))} · Received ${money(sum(s.grants.map(g => g.received)))} (MOCK grants)`] }, { title: 'Grants', table: { head: ['Grant', 'Status', 'Requested', 'Received'], rows: s.grants.map(g => [g.name, g.status, money(g.requested), money(g.received)]) } }] }),
    programs: () => ({ title: 'Program Activity', csv: s.programs.map(p => ({ name: p.name, status: p.status, budget: p.budget })), sections: [{ title: 'Programs', table: { head: ['Program', 'Status', 'Milestones', 'Budget'], rows: s.programs.map(p => [p.name, p.status, `${p.milestones.filter(m => m.done).length}/${p.milestones.length}`, money(p.budget)]) } }] }),
    equipment: () => ({ title: 'Equipment', csv: s.equipment, sections: [{ title: 'Inventory', table: { head: ['Item', 'Qty', 'Condition', 'Value'], rows: s.equipment.map(e => [e.name, e.qty, e.condition, money(e.value * e.qty)]) } }] }),
    events: () => ({ title: 'Events', csv: s.events.map(e => ({ name: e.name, date: e.date, attendance: e.attendance })), sections: [{ title: 'Events', table: { head: ['Event', 'Date', 'Attendance', 'Result'], rows: s.events.map(e => [e.name, fmtDate(e.date), e.attendance ?? '—', e.finalReport || '—']) } }] }),
    social: () => { const t = overallTotals('year'); return { title: 'Social Media', csv: pub.map(p => ({ title: p.title, reach: postReach(p), engagement: postEngagement(p) })), sections: [{ title: 'Year (mock)', lines: [`Impressions ${num(t.impressions)} · Reach ${num(t.reach)} · Engagement rate ${t.engagementRate}%`] }, { title: 'Published posts', table: { head: ['Post', 'Reach/Views', 'Engagement'], rows: pub.map(p => [p.title, num(postReach(p)), num(postEngagement(p))]) } }] } },
    exposure: () => ({ title: 'Sponsor Exposure', csv: s.sponsors.map(x => ({ sponsor: x.company, ...sponsorExposure(x.id), posts: undefined })), sections: [{ title: 'Exposure by sponsor', table: { head: ['Sponsor', 'Mentions', 'Reach', 'Engagement'], rows: s.sponsors.filter(x => sponsorExposure(x.id).mentions).map(x => { const e = sponsorExposure(x.id); return [x.company, e.mentions, num(e.reach), num(e.engagement)] }) } }] }),
  }
  if (id === 'annual') return buildAnnual('2026')
  return sec[id]()
}
export function buildAnnual(year: string) {
  const s = getState(); const fin = financeService.totals(); const y = (d: string) => d.startsWith(year); const pub = s.socialPosts.filter(p => p.status === 'Published' && (p.publishedAt ?? '').startsWith(year))
  const tx = s.transactions.filter(t => y(t.date)); const t = overallTotals('year')
  const inc = (c: string) => sum(tx.filter(x => x.category === c).map(x => x.amount))
  const sections: Section[] = [
    { title: 'Organization overview', lines: ['Red Deer Reavers: nonprofit historical armoured combat club, Red Deer AB. (MOCK TEXT)'] },
    { title: 'Executive', table: { head: ['Name', 'Role'], rows: s.members.filter(m => m.tags.includes('Executive')).map(m => [m.name, m.orgRole]) } },
    { title: 'Membership', lines: [`${s.members.filter(m => m.status === 'Active').length} active, ${s.members.filter(m => m.status === 'Pending').length} pending, ${s.members.filter(m => m.status === 'Expired').length} expired.`] },
    { title: 'Practices & attendance', lines: [`${s.practices.filter(p => y(p.date) && p.date <= '2026-10-07').length} practices logged. Average attendance ${Math.round(sum(s.practices.filter(p => p.attendeeIds.length).map(p => p.attendeeIds.length)) / Math.max(1, s.practices.filter(p => p.attendeeIds.length).length))}.`] },
    { title: 'Volunteer hours', lines: [`${sum(s.volunteerLogs.filter(l => y(l.date)).map(l => l.hours))} hours from ${s.volunteers.length} volunteers.`] },
    { title: 'Programs', table: { head: ['Program', 'Status', 'Milestones'], rows: s.programs.map(p => [p.name, p.status, `${p.milestones.filter(m => m.done).length}/${p.milestones.length}`]) } },
    { title: 'Community events & tournaments', table: { head: ['Event', 'Date', 'Attendance'], rows: s.events.filter(e => y(e.date) && e.status === 'Complete').map(e => [e.name, fmtDate(e.date), e.attendance ?? '—']) }, lines: ['Tournaments attended: Calgary (mock). Competition results are managed in BuhurtOS.'] },
    { title: 'Fundraising', table: { head: ['Fundraiser', 'Raised', 'Net'], rows: s.fundraisers.map(f => { const x = fundraiserStats(f.id); return [f.name, money(x.raised), money(x.net)] }) } },
    { title: 'Sponsors', lines: [`${s.sponsors.filter(x => x.status === 'Active' || x.status === 'Renewal Due').length} active sponsors worth ${money(sum(s.sponsors.filter(x => ['Active', 'Renewal Due'].includes(x.status)).map(x => x.value)))}.`] },
    { title: 'Grants (mock)', lines: [`Awarded ${money(sum(s.grants.map(g => g.received)))} across ${s.grants.filter(g => g.received > 0).length} grants.`] },
    { title: 'Financial summary', lines: [`Income ${money(fin.income)} · Spending ${money(fin.spending)} · Balance ${money(fin.balance)}`, ...incomeCategories.map(c => `${c}: ${money(inc(c))}`)] },
    { title: 'Equipment', lines: [`${sum(s.equipment.map(e => e.qty))} items, ${s.equipment.filter(e => e.issue).length} with open issues.`] },
    { title: 'Social media reach & growth', lines: [`Published posts: ${pub.length}. Combined post reach ${num(sum(pub.map(postReach)))}. Platform reach this year (mock) ${num(t.reach + t.videoViews)}; new followers ${num(t.growth)}.`] },
    { title: 'Community engagement', lines: [`Engagement on published posts: ${num(sum(pub.map(postEngagement)))}. Event attendance total ${sum(s.events.map(e => e.attendance ?? 0))}.`] },
    { title: 'Achievements', lines: ['Armour Fundraiser exceeded 69% of its goal with 5 volunteers and 2 sponsors.', 'Beginner program cohort 1 launched.', 'Recruitment campaign started.'] },
    { title: 'Goals for next year', lines: ['Launch Youth Program pilot.', 'Host a tournament (tentative May 2027).', 'Grow membership to 25.'] },
  ]
  return { title: `${year} Annual Report`, sections, csv: sections.map(x => ({ section: x.title })) }
}
