import { members, volunteers, volunteerLogs, contacts } from './people'
import { sponsors, grants, library, fundraisers } from './funding'
import { practices, programs, tasks, events, equipment, incidents, compliance, meetings, agm } from './ops'
import { transactions, budget, expenses } from './finance'
import { docs } from './docs'
import { socialAccounts, socialCampaigns, mediaAssets, socialPosts } from './social'

// Mock "today" so the prototype is stable regardless of the real date.
export const TODAY = '2026-10-07'

export const seed = {
  members, volunteers, volunteerLogs, contacts, sponsors, grants, library, fundraisers,
  practices, programs, tasks, events, equipment, incidents, compliance, meetings,
  transactions, budget, expenses, docs, socialAccounts, socialCampaigns, mediaAssets, socialPosts,
  agm,
}
export type Seed = typeof seed
export type CollectionKey = { [K in keyof Seed]: Seed[K] extends any[] ? K : never }[keyof Seed]
