// Per-platform adapters. The UI only talks to socialService, which talks to these.
// FUTURE: each adapter's publish()/fetchMetrics() would call the official platform API via a backend
// (OAuth tokens kept server-side). Today they only validate and simulate. No network calls are made.
import type { PlatformId, MediaAsset } from '../../types'

export interface ComposerDraft {
  title: string; caption: string; hashtags: string[]; link: string
  mediaIds: string[]; media: MediaAsset[]
  overrides: Partial<Record<PlatformId, { caption?: string; title?: string }>>
}
export interface Warning { level: 'warn' | 'error'; text: string }
export interface Capabilities {
  label: string; icon: string; color: string; captionMax: number; hashtagMax: number
  supportsImage: boolean; supportsVideo: boolean; requiresVideo: boolean; requiresTitle: boolean; titleMax?: number
  supportsLink: boolean; aspect: string; metrics: { key: string; label: string }[]; note: string
}
export interface PlatformAdapter {
  id: PlatformId; capabilities: Capabilities
  validate(d: ComposerDraft): Warning[]
  simulatePublish(d: ComposerDraft): Promise<{ ok: boolean; error?: string }>
}

function make(id: PlatformId, capabilities: Capabilities, extra?: (d: ComposerDraft, caption: string) => Warning[]): PlatformAdapter {
  return {
    id, capabilities,
    validate(d) {
      const c = capabilities; const w: Warning[] = []
      const caption = d.overrides[id]?.caption ?? d.caption
      const title = d.overrides[id]?.title ?? d.title
      const photos = d.media.filter(m => m.kind !== 'Video'); const videos = d.media.filter(m => m.kind === 'Video')
      if (caption.length > c.captionMax) w.push({ level: 'warn', text: `This caption (${caption.length}) may need adjustment for ${c.label} (max ${c.captionMax}).` })
      if (d.hashtags.length > c.hashtagMax) w.push({ level: 'warn', text: `${c.label} works best with ${c.hashtagMax} hashtags or fewer.` })
      if (c.requiresVideo && videos.length === 0) w.push({ level: 'error', text: 'Video required.' })
      if (!c.supportsVideo && videos.length) w.push({ level: 'error', text: `This media type (video) is not supported on ${c.label} here.` })
      if (!c.supportsImage && photos.length) w.push({ level: 'error', text: `This media type (image) is not supported on ${c.label}.` })
      if (c.requiresTitle && !title.trim()) w.push({ level: 'error', text: `${c.label} needs a title.` })
      if (c.titleMax && title.length > c.titleMax) w.push({ level: 'warn', text: `Title longer than ${c.titleMax} characters.` })
      if (d.link && !c.supportsLink) w.push({ level: 'warn', text: `Links aren't clickable in ${c.label} captions.` })
      if (d.media.length && c.aspect) w.push({ level: 'warn', text: `Different aspect ratio recommended: ${c.aspect}.` })
      if (!d.caption.trim() && !caption.trim()) w.push({ level: 'error', text: 'Caption is empty.' })
      return [...w, ...(extra?.(d, caption) ?? [])]
    },
    async simulatePublish(d) {
      await new Promise(r => setTimeout(r, 150))
      return this.validate(d).some(x => x.level === 'error') ? { ok: false, error: 'Blocked by platform rules (mock)' } : { ok: true }
    },
  }
}

export const facebookAdapter = make('facebook', { label: 'Facebook', icon: 'f', color: '#1877f2', captionMax: 5000, hashtagMax: 5, supportsImage: true, supportsVideo: true, requiresVideo: false, requiresTitle: false, supportsLink: true, aspect: '', metrics: [{ key: 'reach', label: 'Reach' }, { key: 'reactions', label: 'Reactions' }, { key: 'comments', label: 'Comments' }, { key: 'shares', label: 'Shares' }, { key: 'clicks', label: 'Link clicks' }], note: 'Pages API (Meta) — requires app review.' })
export const instagramAdapter = make('instagram', { label: 'Instagram', icon: 'ig', color: '#c13584', captionMax: 2200, hashtagMax: 30, supportsImage: true, supportsVideo: true, requiresVideo: false, requiresTitle: false, supportsLink: false, aspect: '4:5 or 1:1 recommended', metrics: [{ key: 'reach', label: 'Reach' }, { key: 'likes', label: 'Likes' }, { key: 'comments', label: 'Comments' }, { key: 'shares', label: 'Shares' }, { key: 'saves', label: 'Saves' }], note: 'Instagram Graph API — professional account + Meta review.' }, d => d.media.length === 0 ? [{ level: 'error', text: 'Instagram needs at least one image or video.' }] : [])
export const tiktokAdapter = make('tiktok', { label: 'TikTok', icon: 'tt', color: '#111', captionMax: 2200, hashtagMax: 5, supportsImage: false, supportsVideo: true, requiresVideo: true, requiresTitle: false, supportsLink: false, aspect: '9:16 vertical recommended', metrics: [{ key: 'views', label: 'Views' }, { key: 'likes', label: 'Likes' }, { key: 'comments', label: 'Comments' }, { key: 'shares', label: 'Shares' }], note: 'Content Posting API — requires TikTok audit; unaudited posts are private.' })
export const youtubeAdapter = make('youtube', { label: 'YouTube', icon: 'yt', color: '#d00', captionMax: 5000, hashtagMax: 15, supportsImage: false, supportsVideo: true, requiresVideo: true, requiresTitle: true, titleMax: 100, supportsLink: true, aspect: '16:9 recommended (or 9:16 Shorts)', metrics: [{ key: 'views', label: 'Views' }, { key: 'watch', label: 'Watch time (hrs)' }, { key: 'likes', label: 'Likes' }, { key: 'subs', label: 'Subs gained' }], note: 'YouTube Data API — upload quota + compliance audit.' })
export const xAdapter = make('x', { label: 'X', icon: 'x', color: '#000', captionMax: 280, hashtagMax: 3, supportsImage: true, supportsVideo: true, requiresVideo: false, requiresTitle: false, supportsLink: true, aspect: '16:9 recommended', metrics: [{ key: 'impressions', label: 'Impressions' }, { key: 'likes', label: 'Likes' }, { key: 'reposts', label: 'Reposts' }], note: 'X API — paid access tier required.' })

export const adapters: Record<PlatformId, PlatformAdapter> = { facebook: facebookAdapter, instagram: instagramAdapter, tiktok: tiktokAdapter, youtube: youtubeAdapter, x: xAdapter }
export const platformIds = Object.keys(adapters) as PlatformId[]
