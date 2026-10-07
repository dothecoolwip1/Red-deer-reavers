import type { Member, Volunteer, VolunteerLog, Contact } from '../types'

const w = (signed: boolean, date?: string) => [
  { name: 'Participation Waiver 2026', signed, date },
  { name: 'Media Release', signed: signed && date !== undefined, date },
]
const E = (name: string, relation: string) => ({ name, phone: '403-555-01' + Math.floor(10 + name.length * 3), relation })

// All names are fictional.
export const members: Member[] = [
  { id: 'm1', name: 'Alex Hartwell', status: 'Active', tags: ['Executive', 'Fighter'], orgRole: 'President', joined: '2022-03-01', expires: '2026-12-31', duesStatus: 'Paid', duesAmount: 60, canVote: true, email: 'alex@example.test', phone: '403-555-0101', emergency: E('Jo Hartwell', 'Spouse'), waivers: w(true, '2026-01-10'), notes: 'Founding member.' },
  { id: 'm2', name: 'Brynn Okafor', status: 'Active', tags: ['Executive', 'Volunteer'], orgRole: 'Treasurer', joined: '2022-04-12', expires: '2026-12-31', duesStatus: 'Paid', duesAmount: 60, canVote: true, email: 'brynn@example.test', phone: '403-555-0102', emergency: E('Ife Okafor', 'Sibling'), waivers: w(true, '2026-01-12'), notes: 'Handles reimbursements.' },
  { id: 'm3', name: 'Cass Delaney', status: 'Active', tags: ['Executive', 'Volunteer'], orgRole: 'Secretary', joined: '2023-01-20', expires: '2026-12-31', duesStatus: 'Paid', duesAmount: 60, canVote: true, email: 'cass@example.test', phone: '403-555-0103', emergency: E('Pat Delaney', 'Parent'), waivers: w(true, '2026-02-01'), notes: 'Minutes and compliance.' },
  { id: 'm4', name: 'Dmitri Volkov', status: 'Active', tags: ['Coach', 'Fighter'], orgRole: 'Head Coach', joined: '2022-03-01', expires: '2026-12-31', duesStatus: 'Paid', duesAmount: 60, canVote: true, email: 'dmitri@example.test', phone: '403-555-0104', emergency: E('Nina Volkov', 'Spouse'), waivers: w(true, '2026-01-05'), notes: 'Level 2 coaching cert.' },
  { id: 'm5', name: 'Elena Marsh', status: 'Active', tags: ['Coach', 'Fighter'], orgRole: 'Assistant Coach', joined: '2023-05-02', expires: '2026-12-31', duesStatus: 'Paid', duesAmount: 60, canVote: true, email: 'elena@example.test', phone: '403-555-0105', emergency: E('Sam Marsh', 'Spouse'), waivers: w(true, '2026-01-20'), notes: '' },
  { id: 'm6', name: 'Finn Gallagher', status: 'Active', tags: ['Fighter', 'Volunteer'], orgRole: 'Social Media Manager', joined: '2023-09-14', expires: '2026-12-31', duesStatus: 'Paid', duesAmount: 60, canVote: true, email: 'finn@example.test', phone: '403-555-0106', emergency: E('Rae Gallagher', 'Parent'), waivers: w(true, '2026-02-15'), notes: 'Runs socials and photos.' },
  { id: 'm7', name: 'Gwen Takahashi', status: 'Active', tags: ['Fighter'], orgRole: 'Team Lead (Armour)', joined: '2024-01-08', expires: '2026-12-31', duesStatus: 'Paid', duesAmount: 60, canVote: true, email: 'gwen@example.test', phone: '403-555-0107', emergency: E('Ken Takahashi', 'Sibling'), waivers: w(true, '2026-03-01'), notes: 'Armour inspections.' },
  { id: 'm8', name: 'Hamza Qureshi', status: 'Active', tags: ['Fighter'], orgRole: 'Member', joined: '2024-06-19', expires: '2026-12-31', duesStatus: 'Waived', duesAmount: 0, canVote: true, email: 'hamza@example.test', phone: '403-555-0108', emergency: E('Aisha Qureshi', 'Parent'), waivers: w(true, '2026-03-12'), notes: '' },
  { id: 'm9', name: 'Iris Lindqvist', status: 'Active', tags: ['Volunteer'], orgRole: 'Volunteer Coordinator', joined: '2024-09-02', expires: '2026-12-31', duesStatus: 'Paid', duesAmount: 30, canVote: true, email: 'iris@example.test', phone: '403-555-0109', emergency: E('Lars Lindqvist', 'Spouse'), waivers: w(true, '2026-04-02'), notes: '' },
  { id: 'm10', name: 'Jonah Whitecalf', status: 'Active', tags: ['Fighter'], orgRole: 'Member', joined: '2025-02-11', expires: '2026-12-31', duesStatus: 'Owing', duesAmount: 60, canVote: false, email: 'jonah@example.test', phone: '403-555-0110', emergency: E('Mae Whitecalf', 'Parent'), waivers: w(true, '2026-05-01'), notes: 'Dues owing; not yet eligible to vote.' },
  { id: 'm11', name: 'Kira Novak', status: 'Pending', tags: ['Fighter'], orgRole: 'Prospect', joined: '2026-09-20', expires: '2027-09-20', duesStatus: 'Owing', duesAmount: 60, canVote: false, email: 'kira@example.test', phone: '403-555-0111', emergency: E('Tom Novak', 'Parent'), waivers: w(false), notes: 'Came out from Recruitment night.' },
  { id: 'm12', name: 'Liam Boucher', status: 'Pending', tags: ['Volunteer'], orgRole: 'Prospect', joined: '2026-10-01', expires: '2027-10-01', duesStatus: 'Owing', duesAmount: 30, canVote: false, email: 'liam@example.test', phone: '403-555-0112', emergency: E('Anne Boucher', 'Parent'), waivers: w(false), notes: '' },
  { id: 'm13', name: 'Mara Sinclair', status: 'Expired', tags: ['Fighter'], orgRole: 'Member', joined: '2023-02-02', expires: '2025-12-31', duesStatus: 'Owing', duesAmount: 60, canVote: false, email: 'mara@example.test', phone: '403-555-0113', emergency: E('Roy Sinclair', 'Parent'), waivers: w(true, '2025-01-10'), notes: 'Lapsed after injury layoff.' },
  { id: 'm14', name: 'Noel Fraser', status: 'Expired', tags: ['Volunteer'], orgRole: 'Member', joined: '2022-08-08', expires: '2025-12-31', duesStatus: 'Owing', duesAmount: 30, canVote: false, email: 'noel@example.test', phone: '403-555-0114', emergency: E('Lee Fraser', 'Spouse'), waivers: w(true, '2025-02-01'), notes: '' },
]

export const volunteers: Volunteer[] = [
  { id: 'v1', name: 'Iris Lindqvist', memberId: 'm9', email: 'iris@example.test', phone: '403-555-0109', roles: ['Coordinator', 'Registration'], interests: ['Fundraising', 'Youth'], availability: 'Weekends, Tue evenings', qualifications: ['First Aid', 'Police Check'] },
  { id: 'v2', name: 'Brynn Okafor', memberId: 'm2', email: 'brynn@example.test', phone: '403-555-0102', roles: ['Finance'], interests: ['Grants'], availability: 'Evenings', qualifications: ['Bookkeeping'] },
  { id: 'v3', name: 'Finn Gallagher', memberId: 'm6', email: 'finn@example.test', phone: '403-555-0106', roles: ['Photography', 'Social'], interests: ['Media'], availability: 'Practice nights', qualifications: ['Photography'] },
  { id: 'v4', name: 'Liam Boucher', memberId: 'm12', email: 'liam@example.test', phone: '403-555-0112', roles: ['Setup crew'], interests: ['Events'], availability: 'Saturdays', qualifications: [] },
  { id: 'v5', name: 'Oksana Petrenko', email: 'oksana@example.test', phone: '403-555-0120', roles: ['Setup crew', 'Concessions'], interests: ['Community'], availability: 'Weekends', qualifications: ['Food Safe'] },
  { id: 'v6', name: 'Pierre Gagnon', email: 'pierre@example.test', phone: '403-555-0121', roles: ['Youth helper'], interests: ['Youth', 'School demos'], availability: 'Weekdays after 4', qualifications: ['Police Check', 'First Aid'] },
]

const L = (id: string, volunteerId: string, date: string, hours: number, extra: Partial<VolunteerLog>, note = ''): VolunteerLog => ({ id, volunteerId, date, hours, note, ...extra })
export const volunteerLogs: VolunteerLog[] = [
  L('vl1', 'v1', '2026-03-14', 6, { eventId: 'ev1' }, 'Registration desk'),
  L('vl2', 'v3', '2026-03-14', 5, { eventId: 'ev1' }, 'Photography'),
  L('vl3', 'v5', '2026-03-14', 5, { eventId: 'ev1' }, 'Setup/teardown'),
  L('vl4', 'v1', '2026-05-09', 4, { programId: 'p1' }, 'Youth intro session'),
  L('vl5', 'v6', '2026-05-09', 4, { programId: 'p1' }, 'Youth helper'),
  L('vl6', 'v6', '2026-06-13', 3, { programId: 'p1' }, 'Youth session'),
  L('vl7', 'v1', '2026-08-22', 8, { eventId: 'ev3', fundraiserId: 'f1' }, 'Armour fundraiser night'),
  L('vl8', 'v4', '2026-08-22', 7, { eventId: 'ev3', fundraiserId: 'f1' }, 'Setup'),
  L('vl9', 'v5', '2026-08-22', 8, { eventId: 'ev3', fundraiserId: 'f1' }, 'Concessions'),
  L('vl10', 'v3', '2026-08-22', 6, { eventId: 'ev3', fundraiserId: 'f1' }, 'Photos + live posts'),
  L('vl11', 'v2', '2026-08-22', 4, { eventId: 'ev3', fundraiserId: 'f1' }, 'Cash handling'),
  L('vl12', 'v1', '2026-09-12', 5, { eventId: 'ev4' }, 'Demo day'),
  L('vl13', 'v6', '2026-09-12', 5, { eventId: 'ev4' }, 'School demo helper'),
  L('vl14', 'v4', '2026-09-26', 4, { programId: 'p2' }, 'Recruitment night'),
  L('vl15', 'v1', '2026-10-03', 3, { programId: 'p2' }, 'Beginner intake'),
  L('vl16', 'v2', '2026-01-17', 3, {}, 'Year-end bookkeeping'),
  L('vl17', 'v5', '2026-07-04', 6, { eventId: 'ev2' }, 'Canada Day-ish community fair'),
  L('vl18', 'v3', '2026-07-04', 6, { eventId: 'ev2' }, 'Photos'),
]

export const contacts: Contact[] = [
  { id: 'c1', name: 'Sandra Whitfield', org: 'Ironworks Fabrication', category: 'Sponsors', email: 'sandra@ironworks.test', phone: '403-555-0201', comms: [{ date: '2026-09-18', note: 'Renewal call; interested in logo on new banner.' }], followUp: '2026-10-15' },
  { id: 'c2', name: 'Facility Booking Desk', org: 'Red Deer Recreation Centre (MOCK)', category: 'Venues', email: 'bookings@rec.test', phone: '403-555-0202', comms: [{ date: '2026-08-30', note: 'Confirmed Tuesday/Thursday slots through Dec.' }] },
  { id: 'c3', name: 'Marcus Webb', org: 'Webb Leather & Hardware', category: 'Suppliers', email: 'marcus@webb.test', phone: '403-555-0203', comms: [{ date: '2026-07-11', note: 'Quote for replacement straps.' }], followUp: '2026-10-20' },
  { id: 'c4', name: 'Councillor Reyes', org: 'City of Red Deer (MOCK)', category: 'City Contacts', email: 'reyes@city.test', phone: '403-555-0204', comms: [{ date: '2026-06-02', note: 'Invited to demonstration.' }] },
  { id: 'c5', name: 'Priya Anand', org: 'Central Alberta Gazette (MOCK)', category: 'Media', email: 'priya@gazette.test', phone: '403-555-0205', comms: [{ date: '2026-08-15', note: 'Pitched fundraiser story.' }, { date: '2026-08-24', note: 'Story ran; thanked.' }] },
  { id: 'c6', name: 'Tomasz Nowak', org: 'Nowak Photography', category: 'Photographers', email: 'tomasz@nowak.test', phone: '403-555-0206', comms: [] },
  { id: 'c7', name: 'Dana Lee', org: 'Youth Alliance Red Deer (MOCK)', category: 'Community Organizations', email: 'dana@youthalliance.test', phone: '403-555-0207', comms: [{ date: '2026-09-02', note: 'Discussed youth program partnership.' }], followUp: '2026-10-12' },
  { id: 'c8', name: 'Rhys Morgan', org: 'Calgary Iron Wolves (MOCK)', category: 'Other Buhurt Clubs', email: 'rhys@wolves.test', phone: '403-555-0208', comms: [{ date: '2026-09-09', note: 'Joint practice idea.' }] },
  { id: 'c9', name: 'HACSA Secretariat', org: 'HACSA', category: 'HACSA', email: 'info@hacsa.test', phone: '403-555-0209', comms: [{ date: '2026-09-01', note: 'Confirmed annual affiliation.' }] },
  { id: 'c10', name: 'Grants Officer', org: 'Alberta Community Sport Fund (MOCK)', category: 'Grant Contacts', email: 'grants@acsf.test', phone: '403-555-0210', comms: [{ date: '2026-06-20', note: 'Clarified eligibility for equipment costs.' }], followUp: '2026-10-25' },
]
