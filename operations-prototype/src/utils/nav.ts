import type { RoleId } from '../types'
export interface NavItem { id: string; label: string; to: string; icon: string }
export interface NavGroup { title: string; items: NavItem[] }
export const navGroups: NavGroup[] = [
  { title: 'Operations', items: [
    { id: 'dashboard', label: 'Dashboard', to: '/', icon: '🏠' }, { id: 'practices', label: 'Practices', to: '/practices', icon: '🛡️' },
    { id: 'programs', label: 'Programs', to: '/programs', icon: '🎯' }, { id: 'tasks', label: 'Tasks', to: '/tasks', icon: '✅' }, { id: 'events', label: 'Events', to: '/events', icon: '🎪' }] },
  { title: 'Funding', items: [
    { id: 'fundraising', label: 'Fundraising', to: '/fundraising', icon: '💰' }, { id: 'sponsors', label: 'Sponsors', to: '/sponsors', icon: '🤝' },
    { id: 'grants', label: 'Funding & Grants', to: '/grants', icon: '📑' }, { id: 'grantbuilder', label: 'Grant Builder', to: '/grant-builder', icon: '🧩' }] },
  { title: 'People', items: [
    { id: 'members', label: 'Members', to: '/members', icon: '👥' }, { id: 'volunteers', label: 'Volunteers', to: '/volunteers', icon: '🙋' }, { id: 'contacts', label: 'Contacts', to: '/contacts', icon: '📇' }] },
  { title: 'Administration', items: [
    { id: 'finance', label: 'Finance', to: '/finance', icon: '🏦' }, { id: 'documents', label: 'Documents', to: '/documents', icon: '🗂️' },
    { id: 'meetings', label: 'Meetings', to: '/meetings', icon: '📝' }, { id: 'agm', label: 'AGM', to: '/agm', icon: '🗳️' },
    { id: 'compliance', label: 'Compliance', to: '/compliance', icon: '📅' }, { id: 'equipment', label: 'Equipment', to: '/equipment', icon: '⚔️' }, { id: 'safety', label: 'Safety (restricted)', to: '/safety', icon: '🚑' }] },
  { title: 'Communications', items: [
    { id: 'social', label: 'Social Hub', to: '/social', icon: '📣' }, { id: 'composer', label: 'Composer', to: '/social/composer', icon: '✍️' },
    { id: 'calendar', label: 'Content Calendar', to: '/social/calendar', icon: '🗓️' }, { id: 'analytics', label: 'Analytics', to: '/social/analytics', icon: '📈' },
    { id: 'campaigns', label: 'Campaigns', to: '/social/campaigns', icon: '🚩' }, { id: 'exposure', label: 'Sponsor Exposure', to: '/social/exposure', icon: '🏷️' },
    { id: 'accounts', label: 'Social Accounts', to: '/social/accounts', icon: '🔗' }, { id: 'media', label: 'Media Library', to: '/media', icon: '🖼️' }] },
  { title: 'Reporting', items: [{ id: 'reports', label: 'Reports', to: '/reports', icon: '📊' }, { id: 'annual', label: 'Annual Report', to: '/annual-report', icon: '📘' }] },
  { title: 'System', items: [{ id: 'settings', label: 'Settings & Roles', to: '/settings', icon: '⚙️' }] },
]
export const allIds = navGroups.flatMap(g => g.items.map(i => i.id))
const social = ['social', 'composer', 'calendar', 'analytics', 'campaigns', 'exposure', 'accounts', 'media']
export const roleAccess: Record<RoleId, string[]> = {
  Administrator: allIds, Executive: allIds,
  Treasurer: ['dashboard', 'tasks', 'events', 'fundraising', 'sponsors', 'grants', 'grantbuilder', 'members', 'finance', 'documents', 'meetings', 'agm', 'compliance', 'reports', 'annual', 'settings'],
  Secretary: ['dashboard', 'tasks', 'events', 'grants', 'members', 'contacts', 'documents', 'meetings', 'agm', 'compliance', 'reports', 'annual', 'settings'],
  'Social Media Manager': ['dashboard', 'tasks', 'events', 'fundraising', 'sponsors', 'documents', ...social, 'reports', 'settings'],
  'Team Lead': ['dashboard', 'practices', 'programs', 'tasks', 'events', 'members', 'volunteers', 'documents', 'equipment', 'safety', 'settings'],
  Coach: ['dashboard', 'practices', 'programs', 'tasks', 'events', 'members', 'equipment', 'safety', 'agm', 'settings'],
  Volunteer: ['dashboard', 'tasks', 'events', 'volunteers', 'documents', 'agm', 'media', 'settings'],
  Member: ['dashboard', 'practices', 'tasks', 'events', 'documents', 'meetings', 'agm', 'settings'],
}
export const roles = Object.keys(roleAccess) as RoleId[]
export const can = (role: RoleId, id: string) => roleAccess[role].includes(id)
export function idForPath(path: string): string {
  const all = navGroups.flatMap(g => g.items).sort((a, b) => b.to.length - a.to.length)
  const hit = all.find(i => i.to === '/' ? path === '/' : path === i.to || path.startsWith(i.to + '/'))
  return hit?.id ?? 'dashboard'
}
