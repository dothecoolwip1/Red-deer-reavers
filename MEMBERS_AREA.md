# Members area (members.html)

Members sign in here with their **BuhurtOS account**: the same account, email and password as on BuhurtOS. There is no separate Reavers
account and no password database on this website.

- `members.html` is the page. Every menu has a "Members" link, and the homepage has a "Member Sign In" button.
- `assets/js/member-portal.js` holds the page logic. All text from the database is inserted with `textContent`.
- `assets/js/buhurtos-config.js` points at the BuhurtOS Supabase project. The URL and publishable key are public by design.
- `assets/js/vendor/supabase-js-2.117.2.umd.js` is a pinned copy of supabase-js (MIT, licence alongside), the same version BuhurtOS uses, so
  no third-party CDN is trusted for sign-in code.
- `assets/members.css` holds the styles.

## Who sees what

The BuhurtOS database decides who sees and changes what. The website only displays it. Hiding a button is never the protection.

- **Signed-in person:** their own membership, dues, voting eligibility (ELIGIBLE / NOT ELIGIBLE TO VOTE, with the reason), executive role,
  or the application form.
- **Any current Reavers executive:** also the members dashboard (counts, filters), the AGM voters snapshot (printable) and the dues history.
- **Current President, Secretary or Treasurer:** also the Dues and Approve buttons.
- Assigning executive roles is done in BuhurtOS. The page links there.

## Sign in

- Email + password, or a 6-digit code by email. A code sent to a new address creates the BuhurtOS account.
- "Forgot password?" and "Create an account with a password" open BuhurtOS.
- Each website keeps its own sign-in. Signing in here does not sign you in on buhurtos.ca. The account behind both is the same.

Full design, security rules and setup steps are in the BuhurtOS repository: `docs/runbooks/CLUB_MEMBERSHIP.md`.
