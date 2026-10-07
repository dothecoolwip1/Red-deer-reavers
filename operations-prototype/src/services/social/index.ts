// socialService: the ONLY thing UI uses for social. Mock-backed today.
import { getState, addItem, patchItem, uid, toast } from '../store'
import { adapters, platformIds, type ComposerDraft } from './adapters'
import type { PlatformId, PostStatus, SocialPost, RoleId } from '../../types'
export { adapters, platformIds } from './adapters'
export * from './analytics'

export function metricValue(p: SocialPost['platforms'][number], key: string) { return p.metrics.find(m => m.key === key)?.value ?? 0 }
export function postReach(p: SocialPost) { return p.platforms.reduce((s, pp) => s + (metricValue(pp, 'reach') || metricValue(pp, 'views') || metricValue(pp, 'impressions')), 0) }
export function postEngagement(p: SocialPost) {
  return p.platforms.reduce((s, pp) => s + ['reactions', 'likes', 'comments', 'shares', 'saves'].reduce((a, k) => a + metricValue(pp, k), 0), 0)
}
export function postClicks(p: SocialPost) { return p.platforms.reduce((s, pp) => s + metricValue(pp, 'clicks'), 0) }

export function sponsorExposure(sponsorId: string) {
  const posts = getState().socialPosts.filter(p => p.sponsorIds.includes(sponsorId))
  const pub = posts.filter(p => p.status === 'Published')
  const logo = getState().mediaAssets.filter(m => m.sponsorId === sponsorId).map(m => m.id)
  return {
    posts, published: pub.length, mentions: posts.length,
    logoShown: pub.filter(p => p.mediaIds.some(m => logo.includes(m))).length,
    campaigns: [...new Set(posts.map(p => p.campaignId).filter(Boolean))] as string[],
    reach: pub.reduce((s, p) => s + postReach(p), 0), engagement: pub.reduce((s, p) => s + postEngagement(p), 0),
  }
}

export type SubmitMode = 'draft' | 'review' | 'schedule' | 'publish'
export interface SubmitMeta { campaignId?: string; eventId?: string; fundraiserId?: string; programId?: string; sponsorIds: string[]; scheduledFor?: string; author: string }
export function validateAll(d: ComposerDraft, ids: PlatformId[]) { return Object.fromEntries(ids.map(i => [i, adapters[i].validate(d)])) as Record<PlatformId, ReturnType<typeof adapters.facebook.validate>> }

export const socialService = {
  async submit(d: ComposerDraft, ids: PlatformId[], mode: SubmitMode, meta: SubmitMeta): Promise<SocialPost> {
    const status: PostStatus = mode === 'draft' ? 'Draft' : mode === 'review' ? 'Review' : mode === 'schedule' ? 'Scheduled' : 'Published'
    const now = '2026-10-07'
    const results = await Promise.all(ids.map(i => mode === 'publish' ? adapters[i].simulatePublish(d) : Promise.resolve({ ok: true } as { ok: boolean; error?: string })))
    const post: SocialPost = {
      id: uid('sp'), title: d.title || '(untitled)', caption: d.caption, hashtags: d.hashtags, link: d.link || undefined, status, author: meta.author,
      campaignId: meta.campaignId, eventId: meta.eventId, fundraiserId: meta.fundraiserId, programId: meta.programId, sponsorIds: meta.sponsorIds, mediaIds: d.mediaIds,
      scheduledFor: mode === 'schedule' ? meta.scheduledFor : undefined, publishedAt: mode === 'publish' ? now : undefined,
      platforms: ids.map((id, i) => ({ platform: id, override: !!d.overrides[id], caption: d.overrides[id]?.caption, title: d.overrides[id]?.title,
        status: mode === 'publish' ? (results[i].ok ? 'Published' : 'Failed') : mode === 'schedule' ? 'Scheduled' : 'Pending', metrics: [], error: results[i].error })),
      history: [{ at: now, by: meta.author, action: mode === 'draft' ? 'Saved draft' : mode === 'review' ? 'Submitted for review' : mode === 'schedule' ? 'Scheduled (mock)' : 'Published (mock)' }],
    }
    if (mode === 'publish' && post.platforms.every(p => p.status === 'Failed')) post.status = 'Failed'
    addItem('socialPosts', post)
    return post
  },
  /** Draft → Review → Approved → Scheduled → Published. */
  advance(id: string, role: RoleId) {
    const p = getState().socialPosts.find(x => x.id === id); if (!p) return
    const next: Partial<Record<PostStatus, { to: PostStatus; roles: RoleId[] }>> = {
      Draft: { to: 'Review', roles: ['Member', 'Volunteer', 'Social Media Manager', 'Team Lead', 'Executive', 'Administrator', 'Coach', 'Secretary', 'Treasurer'] },
      Review: { to: 'Approved', roles: ['Executive', 'Administrator'] },
      Approved: { to: 'Scheduled', roles: ['Social Media Manager', 'Administrator'] },
      Scheduled: { to: 'Published', roles: ['Administrator'] },
    }
    const n = next[p.status]; if (!n) return toast('No further step.')
    if (!n.roles.includes(role)) return toast(`As ${role} you can't move ${p.status} → ${n.to} (needs ${n.roles.filter(r => ['Executive', 'Administrator', 'Social Media Manager'].includes(r)).join(' / ')}).`)
    patchItem('socialPosts', id, x => ({
      status: n.to, publishedAt: n.to === 'Published' ? '2026-10-07' : x.publishedAt, scheduledFor: n.to === 'Scheduled' ? (x.scheduledFor ?? '2026-10-12 12:00') : x.scheduledFor,
      platforms: x.platforms.map(pp => ({ ...pp, status: n.to === 'Published' ? 'Published' : n.to === 'Scheduled' ? 'Scheduled' : pp.status })),
      history: [...x.history, { at: '2026-10-07', by: role, action: `${p.status} → ${n.to}` }],
    }))
    toast(`${p.title}: ${p.status} → ${n.to}`)
  },
  reject(id: string, role: RoleId) {
    patchItem('socialPosts', id, x => ({ status: 'Draft' as PostStatus, history: [...x.history, { at: '2026-10-07', by: role, action: 'Sent back to draft' }] }))
  },
  archive(id: string) { patchItem('socialPosts', id, { status: 'Archived' }) },
  retry(id: string) { patchItem('socialPosts', id, x => ({ status: 'Scheduled' as PostStatus, platforms: x.platforms.map(p => p.status === 'Failed' ? { ...p, status: 'Scheduled' as const, error: undefined } : p) })); toast('Retry queued (mock)') },
  setAccount(id: string, connected: boolean) {
    patchItem('socialAccounts', id, connected
      ? { connected: true, permissions: 'Full', lastSync: '2026-10-07 now', tokenHealth: 'Healthy' }
      : { connected: false, permissions: 'None', tokenHealth: 'n/a' })
    toast(connected ? 'Connected (SIMULATED — no real OAuth)' : 'Disconnected (simulated)')
  },
}
export { platformIds as allPlatforms }
