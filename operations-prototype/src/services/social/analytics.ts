// Mock analytics generator. FUTURE: replaced by stored platform insights synced via adapters.
import type { PlatformId } from '../../types'
export type Period = '7d' | '30d' | '90d' | 'year' | 'custom'
export const periodDays: Record<Exclude<Period, 'custom'>, number> = { '7d': 7, '30d': 30, '90d': 90, year: 280 }

// Per-30-day baselines. null/absent = platform does not expose that metric.
const base: Record<PlatformId, Record<string, number | undefined>> = {
  facebook: { followers: 1240, growth: 38, impressions: 21000, reach: 14800, likes: 0, reactions: 740, comments: 96, shares: 120, saves: undefined, clicks: 310, videoViews: 2900 },
  instagram: { followers: 2310, growth: 112, impressions: 33000, reach: 21500, likes: 2600, reactions: undefined, comments: 210, shares: 260, saves: 340, clicks: 190, videoViews: 6100 },
  tiktok: { followers: 3880, growth: 420, impressions: undefined, reach: undefined, likes: 5200, reactions: undefined, comments: 380, shares: 510, saves: 180, clicks: undefined, videoViews: 61000 },
  youtube: { followers: 410, growth: 22, impressions: 9000, reach: undefined, likes: 160, reactions: undefined, comments: 18, shares: 25, saves: undefined, clicks: 70, videoViews: 7500 },
  x: { followers: 0, growth: 0, impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, clicks: 0, videoViews: 0 },
}
export const metricLabels: Record<string, string> = { followers: 'Followers', growth: 'Follower growth', impressions: 'Impressions', reach: 'Reach', videoViews: 'Video views', likes: 'Likes', reactions: 'Reactions', comments: 'Comments', shares: 'Shares', saves: 'Saves', clicks: 'Clicks' }

export function daysFor(period: Period, customDays = 14) { return period === 'custom' ? customDays : periodDays[period] }
export function platformTotals(p: PlatformId, period: Period, customDays?: number): Record<string, number | undefined> {
  const mult = daysFor(period, customDays) / 30; const b = base[p]
  const out: Record<string, number | undefined> = {}
  for (const k of Object.keys(b)) out[k] = b[k] === undefined ? undefined : k === 'followers' ? b[k] : Math.round((b[k] as number) * mult)
  const eng = (out.likes ?? 0) + (out.reactions ?? 0) + (out.comments ?? 0) + (out.shares ?? 0) + (out.saves ?? 0)
  const denom = out.reach ?? out.videoViews ?? 0
  out.engagementRate = denom ? Math.round((eng / denom) * 1000) / 10 : 0
  return out
}
export function overallTotals(period: Period, customDays?: number) {
  const ids = Object.keys(base) as PlatformId[]; const tot: Record<string, number> = {}
  for (const id of ids) { const t = platformTotals(id, period, customDays); for (const [k, v] of Object.entries(t)) if (k !== 'engagementRate') tot[k] = (tot[k] ?? 0) + (v ?? 0) }
  const eng = (tot.likes ?? 0) + (tot.reactions ?? 0) + (tot.comments ?? 0) + (tot.shares ?? 0) + (tot.saves ?? 0)
  tot.engagementRate = Math.round((eng / ((tot.reach ?? 0) + (tot.videoViews ?? 0) || 1)) * 1000) / 10
  return tot
}
export function series(period: Period, customDays?: number) {
  const n = Math.min(daysFor(period, customDays), 30) ; const out: { label: string; reach: number }[] = []
  for (let i = 0; i < n; i++) out.push({ label: String(i + 1), reach: Math.round(900 + 600 * Math.sin(i / 2.2) + ((i * 7919) % 400) + (i % 9 === 0 ? 1200 : 0)) })
  return out
}
export const bestDays = [{ k: 'Mon', v: 52 }, { k: 'Tue', v: 61 }, { k: 'Wed', v: 48 }, { k: 'Thu', v: 70 }, { k: 'Fri', v: 66 }, { k: 'Sat', v: 94 }, { k: 'Sun', v: 80 }]
export const bestTimes = [{ k: '8am', v: 30 }, { k: '12pm', v: 66 }, { k: '3pm', v: 48 }, { k: '6pm', v: 82 }, { k: '8pm', v: 95 }, { k: '10pm', v: 58 }]
export const bestCategories = [{ k: 'Fighting clips', v: 96 }, { k: 'Event recaps', v: 82 }, { k: 'Fundraiser', v: 74 }, { k: 'Sponsor thanks', v: 40 }, { k: 'Announcements', v: 38 }, { k: 'Behind the scenes', v: 55 }]
