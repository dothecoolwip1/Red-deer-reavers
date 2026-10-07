// Prototype types. Intentionally simple; real schema decisions come later.
export type ID = string
export type RecordType =
  | 'member' | 'practice' | 'program' | 'task' | 'event' | 'fundraiser' | 'sponsor' | 'grant'
  | 'meeting' | 'equipment' | 'expense' | 'document' | 'campaign' | 'post' | 'contact' | 'volunteer'
export interface RecordRef { type: RecordType; id: ID }

export type MemberTag = 'Executive' | 'Coach' | 'Fighter' | 'Volunteer'
export interface Member {
  id: ID; name: string; status: 'Active' | 'Expired' | 'Pending'; tags: MemberTag[]; orgRole: string
  joined: string; expires: string; duesStatus: 'Paid' | 'Waived' | 'Owing'; duesAmount: number
  canVote: boolean; email: string; phone: string
  emergency: { name: string; phone: string; relation: string }
  waivers: { name: string; signed: boolean; date?: string }[]
  notes: string
}
export interface Practice {
  id: ID; title: string; date: string; start: string; end: string; location: string
  coachIds: ID[]; expected: number; attendeeIds: ID[]; drills: string[]; focus: string
  equipment: string[]; notes: string
}
export interface Program {
  id: ID; name: string; goal: string; ownerId: ID; participantIds: ID[]
  milestones: { title: string; done: boolean; due: string }[]
  budget: number; start: string; end: string; notes: string; status: 'Planning' | 'Active' | 'Paused' | 'Complete'
}
export type Priority = 'Low' | 'Medium' | 'High'
export interface Task {
  id: ID; title: string; assigneeId: ID; due: string; priority: Priority
  status: 'Open' | 'In Progress' | 'Done'; category: string; notes: string; related?: RecordRef
}
export interface OrgEvent {
  id: ID; name: string; type: string; date: string; location: string; organizerId: ID
  volunteerIds: ID[]; equipmentIds: ID[]; budget: number; sponsorIds: ID[]
  attendance?: number; notes: string; finalReport: string; campaignId?: ID
  status: 'Planning' | 'Confirmed' | 'Complete'
}
export interface Fundraiser {
  id: ID; name: string; goal: number; organizerId: ID; volunteerIds: ID[]
  donations: { donor: string; amount: number; date: string }[]
  sponsorIds: ID[]; grantId?: ID; eventId?: ID; campaignId?: ID
  start: string; end: string; notes: string; status: 'Planning' | 'Active' | 'Complete'
}
export type SponsorStatus = 'Prospect' | 'Contacted' | 'Interested' | 'Negotiating' | 'Active' | 'Declined' | 'Renewal Due'
export interface Sponsor {
  id: ID; company: string; contact: string; email: string; phone: string
  level: 'Bronze' | 'Silver' | 'Gold' | 'In-Kind' | 'None'; value: number
  contacted: string; lastContact: string; nextFollowUp: string; renewal: string
  status: SponsorStatus; promised: string[]; delivered: string[]; notes: string
}
export type GrantStatus = 'Researching' | 'Eligible' | 'Planning' | 'Drafting' | 'Ready' | 'Submitted' | 'Approved' | 'Declined' | 'Reporting Required' | 'Complete'
export interface Grant {
  id: ID; name: string; funder: string; max: number; deadline: string; eligibility: string
  programId?: ID; ownerId: ID; requirements: { text: string; done: boolean }[]; matching: string
  progress: number; requested: number; received: number; submitted?: string; reportingDeadline?: string
  status: GrantStatus; notes: string
}
export interface LibraryAnswer { id: ID; topic: string; text: string; updated: string }
export interface Volunteer {
  id: ID; name: string; memberId?: ID; email: string; phone: string; roles: string[]
  interests: string[]; availability: string; qualifications: string[]
}
export interface VolunteerLog {
  id: ID; volunteerId: ID; date: string; hours: number; eventId?: ID; programId?: ID; fundraiserId?: ID; note: string
}
export interface Transaction {
  id: ID; date: string; description: string; amount: number; category: string
  related?: RecordRef; receiptDocId?: ID
}
export interface BudgetLine { id: ID; category: string; budgeted: number }
export type ExpenseStatus = 'Draft' | 'Submitted' | 'Treasurer Review' | 'Approved' | 'Rejected' | 'Paid'
export interface Expense {
  id: ID; vendor: string; amount: number; category: string; date: string; submitterId: ID
  related?: RecordRef; receiptDocId?: ID; status: ExpenseStatus; notes: string
}
export interface Doc {
  id: ID; title: string; category: string; tags: string[]; uploader: string; date: string
  starred: boolean; lastOpened?: string; sizeKb: number; fileType: string; related?: RecordRef; summary: string
}
export interface Meeting {
  id: ID; title: string; type: 'Executive' | 'General' | 'Planning' | 'AGM' | 'Special Meeting'
  date: string; time: string; location: string; agenda: string[]; attendeeIds: ID[]; notes: string
  motions: { id: ID; text: string; movedBy: string; status: 'Pending' | 'Carried' | 'Defeated'; votes?: { yes: number; no: number; abstain: number } }[]
  actionItems: { text: string; ownerId: ID; done: boolean }[]; minutes: string; minutesDocId?: ID
}
export type AttendanceMethod = 'In Person' | 'Video Call' | 'Proxy' | 'Not Attending' | 'No Response'
export interface AgmState {
  date: string; time: string; location: string
  rsvp: Record<ID, AttendanceMethod>; checkedIn: ID[]
  nominations: { id: ID; office: string; nomineeId: ID; by: ID; accepted: boolean }[]
  agenda: string[]
  motions: { id: ID; text: string; status: 'Pending' | 'Carried' | 'Defeated'; yes: number; no: number; abstain: number }[]
  minutesDraft: string
}
export interface ComplianceItem {
  id: ID; title: string; category: string; due: string; owner: string; notes: string; complete: boolean
}
export interface EquipmentItem {
  id: ID; name: string; category: string; qty: number; condition: 'New' | 'Good' | 'Fair' | 'Poor' | 'Out of Service'
  location: string; assignedTo?: ID; value: number; replacement: number; purchased: string
  lastMaintenance: string; nextInspection: string; notes: string; issue?: string
}
export interface Contact {
  id: ID; name: string; org: string; category: string; email: string; phone: string
  comms: { date: string; note: string }[]; followUp?: string
}
export interface Incident {
  id: ID; type: 'Injury' | 'Near Miss' | 'Damaged Equipment' | 'Safety Concern' | 'Incident'
  date: string; description: string; severity: 'Low' | 'Medium' | 'High'; reporter: string
  related?: RecordRef; actions: { text: string; done: boolean }[]; status: 'Open' | 'Follow-up' | 'Closed'
}

// ---- Communications ----
export type PlatformId = 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'x'
export interface SocialAccount {
  id: ID; platform: PlatformId; name: string; handle: string; connected: boolean
  permissions: 'Full' | 'Limited' | 'Expired' | 'None'; lastSync: string; tokenHealth: 'Healthy' | 'Expiring Soon' | 'Expired' | 'n/a'
  followers: number
}
export interface SocialMetric { key: string; label: string; value: number; unit?: string }
export type PostStatus = 'Draft' | 'Review' | 'Approved' | 'Scheduled' | 'Published' | 'Failed' | 'Archived'
export interface SocialPlatformPost {
  platform: PlatformId; caption?: string; title?: string; override: boolean
  status: 'Pending' | 'Scheduled' | 'Published' | 'Failed'; metrics: SocialMetric[]; error?: string
}
export interface SocialPost {
  id: ID; title: string; caption: string; hashtags: string[]; link?: string
  status: PostStatus; author: string; campaignId?: ID; eventId?: ID; fundraiserId?: ID; programId?: ID
  sponsorIds: ID[]; mediaIds: ID[]; scheduledFor?: string; publishedAt?: string
  platforms: SocialPlatformPost[]; history: { at: string; by: string; action: string }[]
}
export interface SocialCampaign {
  id: ID; name: string; goal: string; start: string; end: string; eventId?: ID; fundraiserId?: ID
  sponsorIds: ID[]; programId?: ID; targetReach: number
}
export interface MediaAsset {
  id: ID; name: string; kind: 'Photo' | 'Video' | 'Logo' | 'Sponsor Logo' | 'Graphic'; tags: string[]
  eventId?: ID; uploader: string; date: string; photographer: string; approved: boolean
  sponsorId?: ID; category: string; color: string
}
export interface ReportDef { id: string; title: string; description: string; area: string }
export type RoleId = 'Member' | 'Volunteer' | 'Coach' | 'Social Media Manager' | 'Team Lead' | 'Treasurer' | 'Secretary' | 'Executive' | 'Administrator'
