# Members area (members.html)

One account for the Red Deer Reavers and BuhurtOS. People create it here, without visiting BuhurtOS, and use it for every club meeting and vote.

## What a member sees

- **Sign in:** Google first, then email and password. Email-code sign-in, password recovery and account creation are secondary links on the
  same card. A first-time profile step (BuhurtOS's own `complete_my_profile`) runs once, so BuhurtOS never asks again.
- **Home:** anything that needs you first (a nomination to answer, a vote waiting for your ballot), then the next meetings, a compact
  membership summary (status, fee, voting) and the latest notices.
- **Meetings:** upcoming and past meetings. Each meeting has its own link (`members.html?view=meeting&meeting=<id>`) and its own page:
  open votes at the top, then how you take part (In Person, Video Call, Voting by Proxy, Not Attending; change or cancel a proxy), proxies
  you hold, who is invited (invite-only meetings), the agenda, "Something you want discussed?", Executive Nominations (AGM only), help, and
  results of closed questions at the bottom. A **vote-now bar** follows you on every screen while a ballot is waiting.
- **Account** (person icon, top right): membership record and voting eligibility, approval alerts while pending, the BuhurtOS fighter
  profile (create or claim), install on the home screen, help, sign out.
- **Join:** the application for people with an account but no membership.
- A small **Site** link returns to the public website; the public bottom dock is not shown in the members area.

Meeting kinds: **AGM** (one per year), **General meeting**, **Leadership meeting** (usually invited members only) and **Vote** (a voting
session with no gathering). RSVP, topics and nominations show only where they apply. Personal and proxy ballots stay separate; a ballot is
confirmed only after the database acknowledges it. Ballots are secret: nobody can read how anyone voted.

## What the executive sees (current President, Secretary, Treasurer, Vice President, Director; the database checks it)

The **Exec** button in the top bar opens one sheet:

- **Meetings:** every meeting including invite-only ones; **+ New** schedules an AGM, a general meeting, a leadership meeting or a vote
  (title, Red Deer start and optional end time, place, details, invited-only). Opening a meeting groups its tools in sections:
  People and check-in (RSVP counts, filters, check-in, video or notes link), Topics (grouped: On the agenda in order, Waiting for a
  decision, Addressed, Withdrawn; one-tap next step per topic; search once there are more than five), Nominations
  (AGM), Voting (write, open and close questions; a question closes on its own 24 hours after it opens, "Close and count now" ends it earlier; turnout only, never a choice), Records (printable voting list, CSV, the saved official
  record, proxies) and Details (change, invite list, cancel or restore).
- **Deadlines** (every current executive): the meeting card at the top of the executive's meeting page, on every section, shows
  "New nominations close …" (AGM) and "Topic submissions close …" with a **Close … now** button (`set_club_meeting_deadlines`). An
  executive looking at the member page of the meeting sees the same lines there. Under Details, "New nominations close" (AGM) and "Topic submissions close" (Red Deer time, both
  optional) sit in the meeting form for the President, Secretary or Treasurer and in a small "When submissions close" form for every other
  executive. Empty means they close when the meeting starts. After the nominations deadline nobody can nominate, but a nominee can still accept, decline or withdraw
  until the meeting starts; after the topics deadline nobody can submit or edit a topic, but a member can still withdraw their own until
  the meeting starts. Members see the real time ("New nominations close Sunday, October 18 at 5:30 PM") on the meeting page and in the help.
- **Members and dues**, **Notices** (members see them on Home, pinned first) and **Dues history**.

Older links keep working: `?view=agm` opens the current AGM, `?view=leadership` the leadership meeting, `?view=agm-admin` the AGM's
executive tools; `members-t.html` forwards here.

## Files

| File | What it is |
| --- | --- |
| `members.html` | The page (the only members page; `members-t.html` only forwards to it) |
| `assets/js/member-portal.js` | The page logic |
| `assets/members-app.css` | The one members stylesheet, built on the site tokens in `styles.css` |
| `assets/js/buhurtos-config.js` | Project URL and publishable key (public by design), team slug, bylaws link, Discord invite |
| `assets/js/vendor/supabase-js-2.117.2.umd.js` | Pinned copy of supabase-js (MIT) |
| `members.webmanifest` | Installable members app (start on `members.html`) |
| `assets/members.css` | Styles of the public `agm.html` page only |

## Database

Everything is decided by the BuhurtOS database (`club_*` and `club_meeting_*` functions; design and setup in the BuhurtOS repository,
`docs/runbooks/CLUB_MEMBERSHIP.md`). The page reads `club_meetings_list` and `club_meeting_view` (BuhurtOS migration
`20261018040000_club_meetings_reusable.sql`); until that migration is applied it falls back to the AGM-only reads
(`club_meeting_member_view`, `club_leadership_meeting`) and the executive cannot schedule new meetings from the page.

**Officer names.** Every place that shows an office holder goes through one display function, `officerName()` in
`assets/js/member-portal.js`: the database's "(no currently active account)" label is shown as "(account not currently linked)", and an
office with no name at all shows the display-only name in `OFFICER_NO_ACCOUNT` followed by that suffix, otherwise "not assigned". It grants
nothing and is ignored as soon as the office has a real holder. Delete the `OFFICER_NO_ACCOUNT` entry once that person's account is assigned.
