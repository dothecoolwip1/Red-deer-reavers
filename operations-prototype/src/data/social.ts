import type { SocialAccount, SocialPost, SocialCampaign, MediaAsset, SocialMetric, PlatformId } from '../types'

const M = (key: string, label: string, value: number, unit?: string): SocialMetric => ({ key, label, value, unit })

export const socialAccounts: SocialAccount[] = [
  { id: 'a1', platform: 'facebook', name: 'Red Deer Reavers', handle: '@reddeerreavers', connected: true, permissions: 'Full', lastSync: '2026-10-07 07:12', tokenHealth: 'Healthy', followers: 1240 },
  { id: 'a2', platform: 'instagram', name: 'reddeer.reavers', handle: '@reddeer.reavers', connected: true, permissions: 'Full', lastSync: '2026-10-07 07:12', tokenHealth: 'Expiring Soon', followers: 2310 },
  { id: 'a3', platform: 'tiktok', name: 'reddeerreavers', handle: '@reddeerreavers', connected: true, permissions: 'Limited', lastSync: '2026-10-06 22:40', tokenHealth: 'Healthy', followers: 3880 },
  { id: 'a4', platform: 'youtube', name: 'Red Deer Reavers', handle: 'Red Deer Reavers', connected: true, permissions: 'Full', lastSync: '2026-10-07 06:55', tokenHealth: 'Healthy', followers: 410 },
  { id: 'a5', platform: 'x', name: 'Reavers', handle: '@reddeerreavers', connected: false, permissions: 'None', lastSync: 'never', tokenHealth: 'n/a', followers: 0 },
]

export const socialCampaigns: SocialCampaign[] = [
  { id: 'cp1', name: 'Recruitment 2027', goal: 'Add 10 new members', start: '2026-09-01', end: '2027-01-31', eventId: 'ev5', sponsorIds: [], programId: 'p3', targetReach: 40000 },
  { id: 'cp2', name: 'Youth Program Launch', goal: 'Build awareness + parent signups', start: '2026-11-01', end: '2027-02-15', sponsorIds: ['s4'], programId: 'p1', targetReach: 20000 },
  { id: 'cp3', name: 'Armour Fundraiser', goal: 'Reach $6,000 raised', start: '2026-07-15', end: '2026-09-15', eventId: 'ev3', fundraiserId: 'f1', sponsorIds: ['s2', 's5', 's1'], targetReach: 25000 },
  { id: 'cp4', name: 'Sponsor Campaign', goal: 'Show sponsor value', start: '2026-01-01', end: '2026-12-31', sponsorIds: ['s1', 's2', 's3'], targetReach: 30000 },
  { id: 'cp5', name: 'AGM', goal: 'Boost RSVP to 80%', start: '2026-10-01', end: '2026-10-18', eventId: 'ev6', sponsorIds: [], targetReach: 3000 },
  { id: 'cp6', name: 'Community Demonstration', goal: 'Fill demonstration events', start: '2026-02-15', end: '2026-03-14', eventId: 'ev1', sponsorIds: ['s1'], targetReach: 10000 },
  { id: 'cp7', name: 'Tournament Promotion', goal: 'Promote hosted tournament', start: '2027-03-01', end: '2027-05-22', eventId: 'ev8', sponsorIds: [], targetReach: 35000 },
]

export const mediaAssets: MediaAsset[] = [
  { id: 'md1', name: 'fundraiser-crowd.jpg', kind: 'Photo', tags: ['fundraiser', 'crowd'], eventId: 'ev3', uploader: 'Finn Gallagher', date: '2026-08-23', photographer: 'Finn Gallagher', approved: true, category: 'Event', color: '#6a3d9a' },
  { id: 'md2', name: 'fundraiser-raffle.jpg', kind: 'Photo', tags: ['fundraiser', 'raffle'], eventId: 'ev3', uploader: 'Finn Gallagher', date: '2026-08-23', photographer: 'Finn Gallagher', approved: true, category: 'Event', color: '#b3541e' },
  { id: 'md3', name: 'armour-clip.mp4', kind: 'Video', tags: ['armour', 'fighting'], eventId: 'ev3', uploader: 'Finn Gallagher', date: '2026-08-23', photographer: 'Finn Gallagher', approved: true, category: 'Fighting', color: '#2f4858' },
  { id: 'md4', name: 'practice-sparring.jpg', kind: 'Photo', tags: ['practice', 'sparring'], uploader: 'Finn Gallagher', date: '2026-10-06', photographer: 'Finn Gallagher', approved: true, category: 'Practice', color: '#33658a' },
  { id: 'md5', name: 'reavers-logo.png', kind: 'Logo', tags: ['logo', 'brand'], uploader: 'Finn Gallagher', date: '2026-03-01', photographer: '—', approved: true, category: 'Brand', color: '#800080' },
  { id: 'md6', name: 'ironworks-logo.png', kind: 'Sponsor Logo', tags: ['sponsor'], uploader: 'Alex Hartwell', date: '2026-02-01', photographer: '—', approved: true, sponsorId: 's1', category: 'Sponsor', color: '#555' },
  { id: 'md7', name: 'prairie-logo.png', kind: 'Sponsor Logo', tags: ['sponsor'], uploader: 'Alex Hartwell', date: '2026-07-01', photographer: '—', approved: true, sponsorId: 's2', category: 'Sponsor', color: '#a47c18' },
  { id: 'md8', name: 'recruit-night-poster.png', kind: 'Graphic', tags: ['recruitment', 'poster'], eventId: 'ev5', uploader: 'Finn Gallagher', date: '2026-10-02', photographer: '—', approved: true, category: 'Promo', color: '#c0392b' },
  { id: 'md9', name: 'agm-reminder.png', kind: 'Graphic', tags: ['agm'], eventId: 'ev6', uploader: 'Finn Gallagher', date: '2026-10-04', photographer: '—', approved: true, category: 'Promo', color: '#27ae60' },
  { id: 'md10', name: 'school-demo.jpg', kind: 'Photo', tags: ['school', 'demo'], eventId: 'ev4', uploader: 'Iris Lindqvist', date: '2026-09-12', photographer: 'Iris Lindqvist', approved: true, category: 'Event', color: '#16a085' },
  { id: 'md11', name: 'member-selfie.jpg', kind: 'Photo', tags: ['member'], uploader: 'Hamza Qureshi', date: '2026-10-05', photographer: 'Hamza Qureshi', approved: false, category: 'Member submitted', color: '#8e44ad' },
  { id: 'md12', name: 'sunset-pizza-logo.png', kind: 'Sponsor Logo', tags: ['sponsor'], uploader: 'Alex Hartwell', date: '2026-07-01', photographer: '—', approved: true, sponsorId: 's5', category: 'Sponsor', color: '#d35400' },
  { id: 'md13', name: 'spring-demo.jpg', kind: 'Photo', tags: ['demo'], eventId: 'ev1', uploader: 'Finn Gallagher', date: '2026-03-15', photographer: 'Finn Gallagher', approved: true, category: 'Event', color: '#2980b9' },
]

// Metrics differ by platform on purpose.
const fb = (reach: number, comments: number, shares: number, reactions = Math.round(reach * 0.05)): SocialMetric[] => [M('reach', 'Reach', reach), M('reactions', 'Reactions', reactions), M('comments', 'Comments', comments), M('shares', 'Shares', shares), M('clicks', 'Link clicks', Math.round(reach * 0.02))]
const ig = (reach: number, likes: number, shares: number): SocialMetric[] => [M('reach', 'Reach', reach), M('likes', 'Likes', likes), M('comments', 'Comments', Math.round(likes * 0.06)), M('shares', 'Shares', shares), M('saves', 'Saves', Math.round(likes * 0.12))]
const tt = (views: number, likes: number, comments: number): SocialMetric[] => [M('views', 'Views', views), M('likes', 'Likes', likes), M('comments', 'Comments', comments), M('shares', 'Shares', Math.round(likes * 0.1))]
const yt = (views: number, hours: number): SocialMetric[] => [M('views', 'Views', views), M('watch', 'Watch time', hours, 'hrs'), M('likes', 'Likes', Math.round(views * 0.03)), M('subs', 'Subs gained', Math.round(views * 0.004))]

const P = (platform: PlatformId, status: SocialPost['platforms'][0]['status'], metrics: SocialMetric[], extra = {}) => ({ platform, override: false, status, metrics, ...extra })
export const socialPosts: SocialPost[] = [
  { id: 'sp1', title: 'Armour Fundraiser — announcement', caption: 'Help us armour up our beginners! Join us Aug 22 at the Legion Hall. Tickets, raffle, live demos. Thanks to Prairie Brewing Co. and Ironworks for backing us!', hashtags: ['#Buhurt', '#RedDeer', '#ReaversRise'], link: 'https://example.test/fundraiser', status: 'Published', author: 'Finn Gallagher', campaignId: 'cp3', eventId: 'ev3', fundraiserId: 'f1', sponsorIds: ['s2', 's1'], mediaIds: ['md8'], publishedAt: '2026-08-01',
    platforms: [P('facebook', 'Published', fb(4800, 12, 19)), P('instagram', 'Published', ig(6200, 310, 44)), P('tiktok', 'Published', tt(12400, 680, 37)), P('youtube', 'Published', yt(2100, 73))], history: [{ at: '2026-07-30', by: 'Finn Gallagher', action: 'Drafted' }, { at: '2026-07-31', by: 'Alex Hartwell', action: 'Approved' }, { at: '2026-08-01', by: 'Administrator', action: 'Published' }] },
  { id: 'sp2', title: 'Fundraiser night recap photos', caption: 'THANK YOU Red Deer! $4,150 raised for loaner armour. Huge thanks to our sponsors and volunteers.', hashtags: ['#Thankful', '#Buhurt'], status: 'Published', author: 'Finn Gallagher', campaignId: 'cp3', eventId: 'ev3', fundraiserId: 'f1', sponsorIds: ['s2', 's5'], mediaIds: ['md1', 'md2'], publishedAt: '2026-08-24',
    platforms: [P('facebook', 'Published', fb(3900, 28, 31)), P('instagram', 'Published', ig(5100, 520, 80))], history: [{ at: '2026-08-23', by: 'Finn Gallagher', action: 'Drafted' }, { at: '2026-08-24', by: 'Alex Hartwell', action: 'Approved & published' }] },
  { id: 'sp3', title: 'Armour clip (best hits)', caption: 'Reavers in the armour. #Buhurt', hashtags: ['#Buhurt', '#Armour'], status: 'Published', author: 'Finn Gallagher', campaignId: 'cp3', eventId: 'ev3', sponsorIds: ['s1'], mediaIds: ['md3'], publishedAt: '2026-08-28',
    platforms: [P('tiktok', 'Published', tt(31200, 2100, 140)), P('youtube', 'Published', yt(5400, 180)), P('instagram', 'Published', ig(8800, 740, 120))], history: [{ at: '2026-08-28', by: 'Finn Gallagher', action: 'Published' }] },
  { id: 'sp4', title: 'Recruitment Night #1', caption: 'Ever wanted to try armoured combat? Come out and try it!', hashtags: ['#TryBuhurt', '#RedDeer'], status: 'Published', author: 'Finn Gallagher', campaignId: 'cp1', sponsorIds: [], mediaIds: ['md8'], publishedAt: '2026-09-20',
    platforms: [P('facebook', 'Published', fb(2900, 8, 22)), P('instagram', 'Published', ig(4100, 260, 51))], history: [{ at: '2026-09-19', by: 'Finn Gallagher', action: 'Published' }] },
  { id: 'sp5', title: 'Thank you Ironworks', caption: 'Thank you to Ironworks Fabrication for another year of support!', hashtags: ['#Sponsor'], status: 'Published', author: 'Finn Gallagher', campaignId: 'cp4', sponsorIds: ['s1'], mediaIds: ['md6'], publishedAt: '2026-05-02',
    platforms: [P('facebook', 'Published', fb(1800, 5, 9)), P('instagram', 'Published', ig(2200, 140, 12))], history: [] },
  { id: 'sp6', title: 'School demo highlights', caption: 'Our school demo day was a blast!', hashtags: ['#Outreach'], status: 'Published', author: 'Finn Gallagher', sponsorIds: ['s3'], mediaIds: ['md10'], publishedAt: '2026-09-14',
    platforms: [P('facebook', 'Published', fb(2400, 14, 17)), P('tiktok', 'Published', tt(7400, 410, 21))], history: [] },
  { id: 'sp7', title: 'AGM reminder #1', caption: 'AGM Oct 18, 5:30pm. RSVP in the members area!', hashtags: ['#ReaversAGM'], status: 'Scheduled', author: 'Finn Gallagher', campaignId: 'cp5', eventId: 'ev6', sponsorIds: [], mediaIds: ['md9'], scheduledFor: '2026-10-10 12:00',
    platforms: [P('facebook', 'Scheduled', []), P('instagram', 'Scheduled', [])], history: [{ at: '2026-10-04', by: 'Finn Gallagher', action: 'Drafted' }, { at: '2026-10-05', by: 'Alex Hartwell', action: 'Approved' }, { at: '2026-10-05', by: 'Administrator', action: 'Scheduled' }] },
  { id: 'sp8', title: 'Recruitment Night #2 poster', caption: 'Join us Nov 14! No experience needed.', hashtags: ['#TryBuhurt'], status: 'Scheduled', author: 'Finn Gallagher', campaignId: 'cp1', eventId: 'ev5', sponsorIds: [], mediaIds: ['md8'], scheduledFor: '2026-11-01 10:00',
    platforms: [P('facebook', 'Scheduled', []), P('instagram', 'Scheduled', []), P('tiktok', 'Scheduled', [])], history: [] },
  { id: 'sp9', title: 'Thank you Prairie Brewing', caption: 'Thank you Prairie Brewing Co. for backing the armour fundraiser!', hashtags: ['#Sponsor'], status: 'Review', author: 'Finn Gallagher', campaignId: 'cp4', sponsorIds: ['s2'], mediaIds: ['md7'],
    platforms: [P('facebook', 'Pending', []), P('instagram', 'Pending', [])], history: [{ at: '2026-10-06', by: 'Finn Gallagher', action: 'Submitted for review' }] },
  { id: 'sp10', title: 'Practice photos — Oct 6', caption: 'Tuesday night sparring.', hashtags: ['#Practice'], status: 'Draft', author: 'Finn Gallagher', sponsorIds: [], mediaIds: ['md4'],
    platforms: [P('facebook', 'Pending', []), P('instagram', 'Pending', [])], history: [] },
  { id: 'sp11', title: 'Content suggestion: member jousting clip', caption: 'Suggested by Hamza.', hashtags: [], status: 'Draft', author: 'Hamza Qureshi', sponsorIds: [], mediaIds: ['md11'],
    platforms: [P('tiktok', 'Pending', [])], history: [{ at: '2026-10-05', by: 'Hamza Qureshi', action: 'Suggested content' }] },
  { id: 'sp12', title: 'Spring Demo teaser', caption: 'See us Mar 14!', hashtags: ['#Demo'], status: 'Failed', author: 'Finn Gallagher', campaignId: 'cp6', sponsorIds: ['s1'], mediaIds: ['md13'], scheduledFor: '2026-03-01 10:00',
    platforms: [P('facebook', 'Published', fb(1500, 4, 6)), P('instagram', 'Failed', [], { error: 'Token expired (mock)' })], history: [] },
  { id: 'sp13', title: 'Old recruitment banner', caption: 'Archived.', hashtags: [], status: 'Archived', author: 'Finn Gallagher', sponsorIds: [], mediaIds: [], publishedAt: '2025-09-10',
    platforms: [P('facebook', 'Published', fb(900, 2, 3))], history: [] },
  { id: 'sp14', title: 'Winter Raffle teaser', caption: 'Tickets soon! Prizes from local sponsors.', hashtags: ['#WinterRaffle'], status: 'Approved', author: 'Finn Gallagher', fundraiserId: 'f2', sponsorIds: ['s1'], mediaIds: [],
    platforms: [P('facebook', 'Pending', []), P('instagram', 'Pending', [])], history: [{ at: '2026-10-06', by: 'Alex Hartwell', action: 'Approved' }] },
]

export const socialTasks = [
  { id: 'st1', title: 'Post practice photos', composer: { title: 'Practice photos', mediaIds: ['md4'] } },
  { id: 'st2', title: 'Promote Winter Raffle', composer: { title: 'Winter Raffle', fundraiserId: 'f2' } },
  { id: 'st3', title: 'Thank sponsor: Ironworks', composer: { title: 'Thank you Ironworks', sponsorIds: ['s1'] } },
  { id: 'st4', title: 'AGM reminder #2', composer: { title: 'AGM reminder #2', eventId: 'ev6' } },
  { id: 'st5', title: 'Volunteer recruitment post', composer: { title: 'Volunteers wanted' } },
  { id: 'st6', title: 'Promote School Demo #4', composer: { title: 'School demo #4' } },
]

export const reportDefs = [
  { id: 'annual', title: 'Annual Organization Report', area: 'Organization', description: 'Everything in one place.' },
  { id: 'membership', title: 'Membership', area: 'People', description: 'Counts, status, dues.' },
  { id: 'volunteer', title: 'Volunteer Hours', area: 'People', description: 'By month, event, program.' },
  { id: 'attendance', title: 'Practice Attendance', area: 'Operations', description: 'Per member, per practice.' },
  { id: 'finance', title: 'Financial Summary', area: 'Finance', description: 'Income, spending, budget vs actual.' },
  { id: 'fundraising', title: 'Fundraising', area: 'Funding', description: 'Goal, raised, net proceeds.' },
  { id: 'sponsors', title: 'Sponsors', area: 'Funding', description: 'Pipeline and value.' },
  { id: 'grants', title: 'Grants', area: 'Funding', description: 'Applied, awarded, reporting.' },
  { id: 'programs', title: 'Program Activity', area: 'Operations', description: 'Milestones & budget.' },
  { id: 'equipment', title: 'Equipment', area: 'Admin', description: 'Condition and value.' },
  { id: 'events', title: 'Events', area: 'Operations', description: 'Attendance and results.' },
  { id: 'social', title: 'Social Media', area: 'Communications', description: 'Reach and growth.' },
  { id: 'exposure', title: 'Sponsor Exposure', area: 'Communications', description: 'Mentions and reach per sponsor.' },
]
