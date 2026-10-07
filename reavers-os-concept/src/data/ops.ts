import type { Practice, Program, Task, OrgEvent, EquipmentItem, Incident, ComplianceItem, Meeting, AgmState } from '../types'

export const practices: Practice[] = [
  { id: 'pr1', title: 'Tuesday Practice', date: '2026-10-06', start: '19:00', end: '21:00', location: 'Red Deer Recreation Centre (MOCK), Gym B', coachIds: ['m4'], expected: 9, attendeeIds: ['m1', 'm4', 'm5', 'm7', 'm8', 'm10', 'm6'], drills: ['Footwork ladders', 'Shield work', 'Sparring rounds'], focus: 'Fundamentals', equipment: ['Foam weapons', 'Loaner armour set'], notes: 'Good turnout.' },
  { id: 'pr2', title: 'Thursday Practice', date: '2026-10-08', start: '19:00', end: '21:00', location: 'Red Deer Recreation Centre (MOCK), Gym B', coachIds: ['m5'], expected: 10, attendeeIds: [], drills: ['Pole-arm intro', 'Grappling basics', 'Conditioning'], focus: 'Grappling', equipment: ['Mats', 'Gloves'], notes: '' },
  { id: 'pr3', title: 'Beginner Night', date: '2026-10-13', start: '18:30', end: '20:30', location: 'Red Deer Recreation Centre (MOCK), Gym A', coachIds: ['m4', 'm5'], expected: 8, attendeeIds: [], drills: ['Armour fitting', 'Safe striking', 'Intro sparring'], focus: 'Beginner intake', equipment: ['Loaner armour set', 'Foam weapons'], notes: 'Kira Novak first full practice.' },
  { id: 'pr4', title: 'Thursday Practice', date: '2026-10-15', start: '19:00', end: '21:00', location: 'Red Deer Recreation Centre (MOCK), Gym B', coachIds: ['m4'], expected: 10, attendeeIds: [], drills: ['Team formations', 'Sparring'], focus: 'Team tactics', equipment: [], notes: '' },
  { id: 'pr5', title: 'Tuesday Practice', date: '2026-09-29', start: '19:00', end: '21:00', location: 'Red Deer Recreation Centre (MOCK), Gym B', coachIds: ['m4'], expected: 9, attendeeIds: ['m1', 'm4', 'm5', 'm7', 'm8', 'm6'], drills: ['Pairs drills', 'Sparring'], focus: 'Sparring', equipment: [], notes: '' },
  { id: 'pr6', title: 'Thursday Practice', date: '2026-09-24', start: '19:00', end: '21:00', location: 'Red Deer Recreation Centre (MOCK), Gym B', coachIds: ['m5'], expected: 9, attendeeIds: ['m4', 'm5', 'm7', 'm8', 'm10', 'm6', 'm1'], drills: ['Conditioning'], focus: 'Conditioning', equipment: [], notes: '' },
]

const ms = (...a: [string, boolean, string][]) => a.map(([title, done, due]) => ({ title, done, due }))
export const programs: Program[] = [
  { id: 'p1', name: 'Youth Program', goal: 'Launch a safe, low-impact youth intro program for ages 12–17.', ownerId: 'm9', participantIds: [], milestones: ms(['Safety policy approved', true, '2026-06-30'], ['Coaches screened', true, '2026-08-31'], ['Equipment sourced', false, '2026-11-15'], ['Pilot session', false, '2027-01-20']), budget: 5000, start: '2026-06-01', end: '2027-03-31', notes: 'Pending Maple Auto sponsorship + Youth Active grant.', status: 'Planning' },
  { id: 'p2', name: 'Beginner Fighter Program', goal: 'Move new members from intake to safe sparring in 12 weeks.', ownerId: 'm4', participantIds: ['m11', 'm8', 'm10'], milestones: ms(['Curriculum drafted', true, '2026-07-15'], ['Loaner armour inventory', true, '2026-08-30'], ['Cohort 1 start', true, '2026-09-15'], ['Cohort 1 graduation', false, '2026-12-10']), budget: 6500, start: '2026-07-01', end: '2027-06-30', notes: 'Needs more loaner armour — see Armour Fundraiser.', status: 'Active' },
  { id: 'p3', name: 'Recruitment', goal: 'Add 10 new members by Dec 2026.', ownerId: 'm6', participantIds: [], milestones: ms(['Recruitment night #1', true, '2026-09-26'], ['Social campaign live', true, '2026-09-01'], ['Recruitment night #2', false, '2026-11-14']), budget: 1200, start: '2026-08-15', end: '2026-12-31', notes: '', status: 'Active' },
  { id: 'p4', name: 'Fighter Development', goal: 'Develop competitive fighters for 2027 tournaments.', ownerId: 'm5', participantIds: ['m1', 'm4', 'm5', 'm7'], milestones: ms(['Skills assessment', true, '2026-05-01'], ['Spring tournament prep', false, '2027-02-01']), budget: 3000, start: '2026-01-01', end: '2027-04-30', notes: '', status: 'Active' },
  { id: 'p5', name: 'Community Outreach', goal: 'Run quarterly public demonstrations and fundraisers.', ownerId: 'm1', participantIds: [], milestones: ms(['Spring demo', true, '2026-03-14'], ['Summer fair', true, '2026-07-04'], ['Armour Fundraiser', true, '2026-08-22'], ['Winter social', false, '2026-12-10']), budget: 4000, start: '2026-01-01', end: '2026-12-31', notes: '', status: 'Active' },
  { id: 'p6', name: 'School Demonstrations', goal: 'Visit 4 schools with a safe demonstration and talk.', ownerId: 'm4', participantIds: [], milestones: ms(['School #1', true, '2026-04-10'], ['School #2', true, '2026-05-14'], ['School #3', true, '2026-09-12'], ['School #4', false, '2026-11-20']), budget: 1500, start: '2026-03-01', end: '2026-12-31', notes: 'Funded by School Outreach Mini-Grant.', status: 'Active' },
  { id: 'p7', name: 'Volunteer Development', goal: 'Train volunteers in event roles and safety.', ownerId: 'm9', participantIds: ['m9', 'm12'], milestones: ms(['Training plan', true, '2026-08-30'], ['Workshop #1', false, '2026-11-08']), budget: 2500, start: '2026-08-01', end: '2027-02-28', notes: 'Grant submitted.', status: 'Planning' },
]

const T = (id: string, title: string, assigneeId: string, due: string, priority: Task['priority'], status: Task['status'], category: string, related?: Task['related'], notes = ''): Task =>
  ({ id, title, assigneeId, due, priority, status, category, related, notes })
export const tasks: Task[] = [
  T('t1', 'Finish budget section for Equipment Grant', 'm2', '2026-10-12', 'High', 'In Progress', 'Grants', { type: 'grant', id: 'g1' }),
  T('t2', 'Collect two letters of support', 'm1', '2026-10-18', 'High', 'Open', 'Grants', { type: 'grant', id: 'g1' }),
  T('t3', 'Accessibility audit for Inclusion grant', 'm9', '2026-10-17', 'High', 'Open', 'Grants', { type: 'grant', id: 'g7' }),
  T('t4', 'Submit Local Rec grant final report', 'm1', '2026-11-10', 'Medium', 'Open', 'Grants', { type: 'grant', id: 'g2' }),
  T('t5', 'Call Ironworks about renewal', 'm1', '2026-10-15', 'High', 'Open', 'Sponsors', { type: 'sponsor', id: 's1' }),
  T('t6', 'Thank-you post for Prairie Brewing', 'm6', '2026-09-30', 'Medium', 'Open', 'Social', { type: 'sponsor', id: 's2' }, 'Overdue example'),
  T('t7', 'Send sponsor proposal to Maple Auto', 'm1', '2026-10-10', 'High', 'In Progress', 'Sponsors', { type: 'sponsor', id: 's4' }),
  T('t8', 'Post practice photos', 'm6', '2026-10-09', 'Low', 'Open', 'Social', { type: 'practice', id: 'pr1' }),
  T('t9', 'Promote AGM (reminder posts)', 'm6', '2026-10-14', 'Medium', 'Open', 'Social', { type: 'meeting', id: 'mt3' }),
  T('t10', 'Inspect loaner helmets', 'm7', '2026-10-11', 'Medium', 'Open', 'Equipment', { type: 'equipment', id: 'e2' }),
  T('t11', 'Book room for Beginner Night', 'm3', '2026-10-05', 'Medium', 'Done', 'Practices', { type: 'practice', id: 'pr3' }),
  T('t12', 'Prepare AGM financial report', 'm2', '2026-10-14', 'High', 'In Progress', 'Administration', { type: 'meeting', id: 'mt3' }),
  T('t13', 'Print AGM voting list', 'm3', '2026-10-17', 'Medium', 'Open', 'Administration', { type: 'meeting', id: 'mt3' }),
  T('t14', 'Order replacement shield straps', 'm7', '2026-10-08', 'High', 'Open', 'Equipment', { type: 'equipment', id: 'e4' }),
  T('t15', 'Plan Winter Raffle prizes', 'm3', '2026-11-01', 'Medium', 'Open', 'Fundraising', { type: 'fundraiser', id: 'f2' }),
  T('t16', 'File fundraiser expense receipts', 'm2', '2026-09-05', 'Medium', 'Done', 'Fundraising', { type: 'fundraiser', id: 'f1' }),
  T('t17', 'Schedule school demo #4', 'm4', '2026-11-01', 'Low', 'Open', 'Programs', { type: 'program', id: 'p6' }),
  T('t18', 'Annual return filing prep', 'm3', '2026-11-30', 'High', 'Open', 'Administration'),
  T('t19', 'Update waiver for Kira Novak', 'm3', '2026-10-13', 'Medium', 'Open', 'Members', { type: 'member', id: 'm11' }),
  T('t20', 'Share fundraiser results post', 'm6', '2026-09-20', 'Medium', 'Done', 'Social', { type: 'fundraiser', id: 'f1' }),
]

export const events: OrgEvent[] = [
  { id: 'ev1', name: 'Spring Demonstration', type: 'Demonstration', date: '2026-03-14', location: 'Red Deer Community Centre (MOCK)', organizerId: 'm1', volunteerIds: ['v1', 'v3', 'v5'], equipmentIds: ['e1', 'e2'], budget: 600, sponsorIds: ['s1'], attendance: 140, notes: '', finalReport: 'Good turnout; 6 leads for recruitment.', status: 'Complete', campaignId: 'cp6' },
  { id: 'ev2', name: 'Summer Community Fair Booth', type: 'Community Event', date: '2026-07-04', location: 'Rotary Park (MOCK)', organizerId: 'm9', volunteerIds: ['v3', 'v5'], equipmentIds: ['e1'], budget: 300, sponsorIds: [], attendance: 600, notes: '', finalReport: 'High foot traffic. Great photos.', status: 'Complete' },
  { id: 'ev3', name: 'Armour Fundraiser Night', type: 'Fundraiser', date: '2026-08-22', location: 'Legion Hall (MOCK)', organizerId: 'm1', volunteerIds: ['v1', 'v2', 'v3', 'v4', 'v5'], equipmentIds: ['e1', 'e5'], budget: 1500, sponsorIds: ['s2', 's5'], attendance: 180, notes: 'Part of Armour Fundraiser 2026.', finalReport: 'Raised $4,150 gross. See fundraiser.', status: 'Complete', campaignId: 'cp3' },
  { id: 'ev4', name: 'School Demo #3', type: 'Demonstration', date: '2026-09-12', location: 'Lindsay Thurber (MOCK)', organizerId: 'm4', volunteerIds: ['v1', 'v6'], equipmentIds: ['e6'], budget: 200, sponsorIds: [], attendance: 220, notes: '', finalReport: 'Students loved the shield demo.', status: 'Complete' },
  { id: 'ev5', name: 'Recruitment Night #2', type: 'Recruitment', date: '2026-11-14', location: 'Red Deer Recreation Centre (MOCK)', organizerId: 'm6', volunteerIds: ['v1'], equipmentIds: ['e2'], budget: 300, sponsorIds: [], notes: '', finalReport: '', status: 'Planning', campaignId: 'cp1' },
  { id: 'ev6', name: '2026 Annual General Meeting', type: 'AGM', date: '2026-10-18', location: 'Red Deer Recreation Centre (MOCK), Room 3', organizerId: 'm3', volunteerIds: ['v1'], equipmentIds: [], budget: 150, sponsorIds: [], notes: '', finalReport: '', status: 'Confirmed', campaignId: 'cp5' },
  { id: 'ev7', name: 'Winter Raffle & Social', type: 'Social', date: '2026-12-10', location: 'Legion Hall (MOCK)', organizerId: 'm3', volunteerIds: ['v1', 'v4'], equipmentIds: [], budget: 800, sponsorIds: ['s1'], notes: 'Fundraiser f2.', finalReport: '', status: 'Planning' },
  { id: 'ev8', name: 'Hosted Tournament (tentative)', type: 'Hosted Event', date: '2027-05-22', location: 'TBD', organizerId: 'm1', volunteerIds: [], equipmentIds: [], budget: 8000, sponsorIds: [], notes: 'Early idea; see BuhurtOS for competition management.', finalReport: '', status: 'Planning' },
]

const EQ = (id: string, name: string, category: string, qty: number, condition: EquipmentItem['condition'], location: string, value: number, replacement: number, extra: Partial<EquipmentItem> = {}): EquipmentItem =>
  ({ id, name, category, qty, condition, location, value, replacement, purchased: '2024-03-01', lastMaintenance: '2026-06-01', nextInspection: '2026-12-01', notes: '', ...extra })
export const equipment: EquipmentItem[] = [
  EQ('e1', 'Event tent 10x10', 'Event Equipment', 2, 'Good', 'Storage locker A', 400, 600),
  EQ('e2', 'Loaner helmet', 'Loaner Armour', 6, 'Fair', 'Storage locker A', 150, 280, { nextInspection: '2026-10-11', issue: '2 helmets with loose padding' }),
  EQ('e3', 'Loaner gauntlets (pair)', 'Loaner Armour', 8, 'Good', 'Storage locker A', 90, 160, { assignedTo: 'm11', notes: '1 pair assigned' }),
  EQ('e4', 'Training shield', 'Shields', 10, 'Fair', 'Gym storage', 70, 120, { issue: 'Straps worn on 4 shields' }),
  EQ('e5', 'PA system + mics', 'Electronics', 1, 'Good', 'Secretary home', 600, 900),
  EQ('e6', 'Demo foam weapons', 'Weapons', 12, 'Good', 'Gym storage', 35, 60),
  EQ('e7', 'Steel training swords', 'Weapons', 6, 'Good', 'Gym storage', 120, 200),
  EQ('e8', 'Banners (Reavers)', 'Club Property', 3, 'Good', 'Storage locker A', 150, 250),
  EQ('e9', 'Training dummies', 'Training Equipment', 2, 'Poor', 'Gym storage', 200, 350, { issue: 'Seam splitting', nextInspection: '2026-10-20' }),
  EQ('e10', 'Pop-up display wall', 'Event Equipment', 1, 'New', 'Storage locker A', 450, 450),
  EQ('e11', 'Camera (club)', 'Electronics', 1, 'Good', 'Finn', 800, 1000, { assignedTo: 'm6' }),
  EQ('e12', 'Loaner breastplate', 'Loaner Armour', 4, 'Out of Service', 'Repair', 220, 400, { issue: 'Cracked rivets; out for repair' }),
]

export const incidents: Incident[] = [
  { id: 'i1', type: 'Injury', date: '2026-09-24', description: 'Minor finger jam during pairs drill. Ice applied; no further treatment. [MOCK]', severity: 'Low', reporter: 'Dmitri Volkov', related: { type: 'practice', id: 'pr6' }, actions: [{ text: 'Reminder on gauntlet use at next practice', done: true }, { text: 'Check helmet/gauntlet fit for newer members', done: false }], status: 'Follow-up' },
  { id: 'i2', type: 'Near Miss', date: '2026-10-06', description: 'Shield strap nearly failed mid-drill. [MOCK]', severity: 'Medium', reporter: 'Gwen Takahashi', related: { type: 'equipment', id: 'e4' }, actions: [{ text: 'Replace worn straps', done: false }, { text: 'Add strap check to inspection list', done: false }], status: 'Open' },
  { id: 'i3', type: 'Damaged Equipment', date: '2026-08-22', description: 'Breastplate rivets cracked at fundraiser demo. [MOCK]', severity: 'Low', reporter: 'Gwen Takahashi', related: { type: 'equipment', id: 'e12' }, actions: [{ text: 'Send for repair', done: true }], status: 'Closed' },
  { id: 'i4', type: 'Safety Concern', date: '2026-09-03', description: 'Gym floor slippery after cleaning. Facility notified. [MOCK]', severity: 'Medium', reporter: 'Elena Marsh', actions: [{ text: 'Confirm with facility', done: true }], status: 'Closed' },
]

export const compliance: ComplianceItem[] = [
  { id: 'cm1', title: 'AGM held', category: 'Governance', due: '2026-10-31', owner: 'Cass Delaney', notes: 'AGM scheduled Oct 18.', complete: false },
  { id: 'cm2', title: 'Annual return filing', category: 'Governance', due: '2026-11-30', owner: 'Cass Delaney', notes: '', complete: false },
  { id: 'cm3', title: 'Insurance renewal', category: 'Insurance', due: '2026-10-12', owner: 'Brynn Okafor', notes: 'Get quote from Foothills (prospective sponsor).', complete: false },
  { id: 'cm4', title: 'Equity Grant application: Equipment', category: 'Grants', due: '2026-10-31', owner: 'Brynn Okafor', notes: 'See Grants.', complete: false },
  { id: 'cm5', title: 'Local Rec grant final report', category: 'Grants', due: '2026-11-15', owner: 'Alex Hartwell', notes: '', complete: false },
  { id: 'cm6', title: 'Ironworks sponsor renewal', category: 'Sponsors', due: '2026-12-31', owner: 'Alex Hartwell', notes: '', complete: false },
  { id: 'cm7', title: 'Facility agreement renewal', category: 'Facilities', due: '2026-09-30', owner: 'Cass Delaney', notes: 'Overdue — confirm with rec centre.', complete: false },
  { id: 'cm8', title: 'Event permit — Hosted Tournament', category: 'Permits', due: '2027-03-15', owner: 'Alex Hartwell', notes: '', complete: false },
  { id: 'cm9', title: 'Equipment safety inspection', category: 'Equipment', due: '2026-10-11', owner: 'Gwen Takahashi', notes: '', complete: false },
  { id: 'cm10', title: 'Mid-year financial review', category: 'Finance', due: '2026-06-30', owner: 'Brynn Okafor', notes: '', complete: true },
  { id: 'cm11', title: 'Policy review (safety, youth)', category: 'Governance', due: '2026-12-15', owner: 'Cass Delaney', notes: '', complete: false },
  { id: 'cm12', title: 'HACSA affiliation renewal', category: 'Governance', due: '2026-09-15', owner: 'Alex Hartwell', notes: '', complete: true },
]

export const meetings: Meeting[] = [
  { id: 'mt1', title: 'Executive Meeting — September', type: 'Executive', date: '2026-09-08', time: '19:30', location: 'Video call', agenda: ['Treasurer report', 'Youth program', 'AGM planning', 'Equipment'], attendeeIds: ['m1', 'm2', 'm3'], notes: 'Reviewed fundraiser outcome.', motions: [{ id: 'mo1', text: 'Approve $600 for helmet repairs', movedBy: 'Brynn Okafor', status: 'Carried', votes: { yes: 3, no: 0, abstain: 0 } }], actionItems: [{ text: 'Get quotes for helmet repair', ownerId: 'm7', done: true }, { text: 'Draft AGM agenda', ownerId: 'm3', done: false }], minutes: 'Meeting called to order 19:34. Treasurer reported $8,214 balance...', minutesDocId: 'd8' },
  { id: 'mt2', title: 'General Meeting — August', type: 'General', date: '2026-08-12', time: '19:00', location: 'Rec Centre Room 3', agenda: ['Fundraiser update', 'Recruitment', 'Safety'], attendeeIds: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'], notes: '', motions: [{ id: 'mo2', text: 'Hold Armour Fundraiser on Aug 22', movedBy: 'Alex Hartwell', status: 'Carried', votes: { yes: 8, no: 0, abstain: 0 } }], actionItems: [], minutes: 'See attached.', minutesDocId: 'd9' },
  { id: 'mt3', title: '2026 Annual General Meeting', type: 'AGM', date: '2026-10-18', time: '17:30', location: 'Rec Centre Room 3 + video call', agenda: ['Call to order', 'Approve previous minutes', 'President report', 'Financial report', 'Annual report', 'Elections', 'Motions', 'Adjourn'], attendeeIds: [], notes: '', motions: [], actionItems: [{ text: 'Prepare financial report', ownerId: 'm2', done: false }, { text: 'Print voting list', ownerId: 'm3', done: false }], minutes: '' },
  { id: 'mt4', title: 'Planning Meeting — Winter Social', type: 'Planning', date: '2026-10-22', time: '19:00', location: 'Video call', agenda: ['Venue', 'Raffle prizes', 'Volunteers'], attendeeIds: [], notes: '', motions: [], actionItems: [], minutes: '' },
  { id: 'mt5', title: 'Special Meeting — Insurance', type: 'Special Meeting', date: '2026-06-18', time: '20:00', location: 'Video call', agenda: ['Insurance quote'], attendeeIds: ['m1', 'm2', 'm3'], notes: '', motions: [{ id: 'mo3', text: 'Renew insurance with current provider', movedBy: 'Cass Delaney', status: 'Defeated', votes: { yes: 1, no: 2, abstain: 0 } }], actionItems: [], minutes: 'Motion defeated; get second quote.' },
]

export const agm: AgmState = {
  date: '2026-10-18', time: '17:30', location: 'Red Deer Recreation Centre (MOCK), Room 3 (video link available)',
  rsvp: { m1: 'In Person', m2: 'In Person', m3: 'In Person', m4: 'In Person', m5: 'Video Call', m6: 'In Person', m7: 'Proxy', m8: 'Not Attending', m9: 'In Person', m10: 'No Response' },
  checkedIn: [],
  nominations: [
    { id: 'n1', office: 'President', nomineeId: 'm1', by: 'm4', accepted: true },
    { id: 'n2', office: 'President', nomineeId: 'm5', by: 'm7', accepted: false },
    { id: 'n3', office: 'Secretary', nomineeId: 'm3', by: 'm1', accepted: true },
    { id: 'n4', office: 'Treasurer', nomineeId: 'm2', by: 'm1', accepted: true },
  ],
  agenda: ['Call to order', 'Approve previous minutes', 'President report', 'Financial report', 'Annual report', 'Elections', 'Motions', 'Adjourn'],
  motions: [
    { id: 'am1', text: 'Adopt the 2026 financial report as presented', status: 'Pending', yes: 0, no: 0, abstain: 0 },
    { id: 'am2', text: 'Set 2027 dues at $60 (youth/volunteer $30)', status: 'Pending', yes: 0, no: 0, abstain: 0 },
    { id: 'am3', text: 'Approve Youth Program pilot budget of $5,000', status: 'Pending', yes: 0, no: 0, abstain: 0 },
  ],
  minutesDraft: '',
}
