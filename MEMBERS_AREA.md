# Members area (members.html)

One account for the Red Deer Reavers and BuhurtOS. People can create that account right here, without visiting BuhurtOS.

- **Account:**
  - Create account (Supabase Auth sign-up in the BuhurtOS project; the confirmation email links back here).
  - Sign in: email + password, Google, or an email code.
  - Forgot password (the email link comes back here and asks for a new password).
  - A first-time profile step: BuhurtOS's own `complete_my_profile`, so BuhurtOS never asks again.
- **Join the Red Deer Reavers:**
  - The application, then Membership Application Pending, then Membership: Active.
  - The 2026 membership fee shows as WAIVED.
  - Voting status: ELIGIBLE TO VOTE, or NOT CURRENTLY ELIGIBLE TO VOTE with the reason.
- **2026 AGM** (Sunday, October 18, 2026, 5:30 PM, Red Deer time):
  - In Person, Video Call, Voting by Proxy or Not Attending.
  - Change the answer, change the proxy, or cancel the proxy.
  - The private video link appears once the executive adds it.
  - **Something you want discussed?** Submit a concern or topic for the AGM; see, edit or withdraw your own until the meeting starts.
  - **Executive Nominations** for President, Secretary and Treasurer: nominate yourself or another voting member; a nominated member accepts
    or declines (You've Been Nominated); the page lists current officers and accepted candidates. Only members who can vote may nominate.
    Nominations never change who holds an office: that is decided at the AGM.
- **Executive** (current Reavers executive only; the database checks it):
  - Members and dues.
  - AGM admin: counts, filters, check-in, video link; Concerns (set Submitted / Added to Agenda / Addressed); Nominations (candidates per office).
  - Proxies.
  - Printable AGM voting list and the saved official AGM record.
  - Dues history.

This website and BuhurtOS are both served from `dothecoolwip1.github.io`, so the browser keeps one sign-in for both. No token is passed
between them, and nothing here is a security boundary.

| File | What it is |
| --- | --- |
| `members.html` | The page |
| `assets/js/member-portal.js` | The page logic |
| `assets/js/buhurtos-config.js` | Project URL and publishable key (public by design) |
| `assets/js/vendor/supabase-js-2.117.2.umd.js` | Pinned copy of supabase-js (MIT) |
| `assets/members.css` | Styles |

Full design and setup are in the BuhurtOS repository: `docs/runbooks/CLUB_MEMBERSHIP.md`.
