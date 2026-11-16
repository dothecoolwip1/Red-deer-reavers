# Red Deer Reavers website

This repository is the one Reavers website, served at https://reddeerreavers.com/ (Vercel, from `main`). Old copies (GitHub Pages, `red-deer-reavers.vercel.app`, `www.`) forward to the same page there. It combines the public "Forged" site (formerly the separate `Reavers-Site` repository) with the members area and AGM tools (`members.html`, `agm.html`, see `MEMBERS_AREA.md`). The two frontend-only prototypes in `operations-prototype/` and `reavers-os-concept/` are concept work, not part of the site build.

Public team website and lightweight team administration for the Red Deer Reavers in Central Alberta.

## Architecture

- Static HTML, CSS, and JavaScript hosted on Vercel at reddeerreavers.com
- Team data lives on the BuhurtOS home server (https://api-home.buhurtoshome.app), the same backend as buhurt-os.app
- BuhurtOS home server (`public.reavers_site`) for practices, the calendar, roster records, site settings and community inquiries; the app signs in with a BuhurtOS account and only Red Deer Reavers captains can edit
- **BuhurtOS** (`buhurtos.js`) for fighter profiles: the Team page, home page fighter cards, `fighter.html` profiles, the company record, tournament results and events are read live from BuhurtOS's public API
- Progressive Web App manifest and service worker for installable mobile use
- GitHub Actions production build and quality checks

## Reavers app (app.reddeerreavers.com)

`app/` is the club's back office (ledger and bank import, reimbursements, budget, Stripe payment links, sponsors, grants, waivers, incidents, armory, deadlines), a React app that signs in with BuhurtOS accounts. `npm run build` builds it into `_site/app/`, and `vercel.json` sends app.reddeerreavers.com to it (a redirect to `/app/`, because Vercel rewrites never override an existing file such as `index.html`). Setup and roles: [app/README.md](app/README.md).

## Fighter profiles from BuhurtOS

Fighters do not need to be added on this site. A fighter signs in to BuhurtOS, asks to join the Red Deer Reavers, and builds their profile there (photo, disciplines, bio, socials). Once the team captain approves them on BuhurtOS, they appear on the Team page automatically, and their record and placings fill in as they compete at BuhurtOS events. The Team page has an "Add your fighter profile" section that links straight into that flow.

**Reavers profile extras.** On top of BuhurtOS, each fighter can fill in a Reavers profile in the app under Team → **Fighter profiles**: nickname, weight class, team role, a motto, an "about" for sponsors, an action photo, a highlight video, their sponsors and an "open to sponsors" switch. Nothing shows until they (or someone with the Team page) turn on "Show on the website". Then the Team page cards show the nickname, weight class and role, and `fighter.html` uses the action photo as its hero and adds the record (W-L-D), a "Sponsored by" panel, a "Sponsor <name>" button (which opens the community form set to sponsorship) and a "Print a sponsor sheet" button with a one-page print layout. Stored in `reavers_app_fighter_profiles` (`app/supabase/migrations/20261111020000_reavers_app_fighter_profiles.sql`); the site reads it with the public key, only rows turned on, and carries on without it if it is unreachable.

**Hiding people who come and go.** In the app under Website → Team page, every BuhurtOS fighter has a **Hide** / **Show** button. Hiding keeps them off the Team page, the home page, the crew count and their profile page, and leaves their BuhurtOS record untouched. The hide list is stored with the team's roster data as a record whose discipline is `hide-buhurtos:<fighter id>`; those records are never shown as people.

**Events from BuhurtOS.** Every published event on BuhurtOS, past and future, appears on the Events page. Upcoming ones are merged into the calendar list, the home page "upcoming" card and the add-to-calendar buttons. Finished ones go in a "Past events" archive, newest first, 12 at a time, each linking to its BuhurtOS page for results. Events the Reavers host or enter are labelled "Reavers hosting" / "Reavers entered". Events also entered by hand in the app are not duplicated, and test events are never shown. The app's Website → Calendar lists what is being pulled in.

`buhurtos.js` reads only public data with the BuhurtOS publishable (browser-safe) key: the team roster, public fighter profile fields, team and fighter statistics, results, and entries. It never shows birth year, age, gender, account or contact data, and leaves synthetic/test fighters and events out of the roster and records. Anyone on the admin crew roster whose name matches a BuhurtOS fighter is merged into that fighter's card, so crew, coaches and media can still be listed from the app.

## Social photo sync

`.github/workflows/social-sync.yml` runs `scripts/sync-social.mjs` once a day. It reads the latest Instagram and Facebook posts through Meta's official APIs, saves WebP copies of the photos in `assets/social/`, writes `assets/social/feed.json`, and commits them so they appear on the Social, Media and Home pages. It does nothing until the `INSTAGRAM_ACCESS_TOKEN` and/or `FACEBOOK_PAGE_ID` + `FACEBOOK_PAGE_TOKEN` repository secrets are added. Step-by-step setup: [docs/SOCIAL_SYNC.md](docs/SOCIAL_SYNC.md).

## Design

The "Forged" theme lives in `styles.css`: dark iron, gilt corner guards, parchment sections, heraldic shield avatars, and the crest's purple and ember. Fonts (Grenze Gotisch, Cinzel, Alegreya Sans, all OFL) are self-hosted from `vendor/fonts`. Moving decoration (forge embers, the discipline banner) respects reduced-motion settings and has a pause button.

## Members area and AGM

`members.html` and `agm.html` are generated like every other page (`scripts/pages/members.page.mjs`, `agm.page.mjs`) so they share the header, footer and dock. Their logic is `assets/js/member-portal.js` (unchanged) with its own stylesheet `assets/members.css`; its config global is `window.REAVERS_MEMBERS` (the public site uses `window.BUHURTOS`). The push-notification handlers live in `sw.js`; `reavers-sw.js` only forwards to it for browsers that still have the old worker registered. Old addresses (`programs`, `involved`, `steps`, `contact`, `resources`) redirect to their replacements.

## Editing pages

The public HTML pages are generated so the header, footer and mobile dock stay identical. Edit `scripts/pages/*.page.mjs` (or the shared `scripts/pages/partials.mjs`) and run:

```
npm run pages
```

Commit the regenerated HTML: GitHub Pages serves the repository root.

## Open source tooling

The site intentionally stays framework free while using focused libraries where they directly improve it:

- **Sharp** generates responsive WebP versions of every gallery photo during deployment.
- **PhotoSwipe** powers the mobile friendly, swipe and zoom media gallery.
- **Add to Calendar Button** gives public events Apple, Google, iCal, Microsoft, Outlook, and Yahoo calendar actions.
- **node-qrcode** generates printable SVG QR codes for the website, Join, Community, and Events pages.
- **Lighthouse CI** checks performance, accessibility, best practices, and SEO.
- **Pa11y CI** runs WCAG 2 AA accessibility checks against every public page.
- **Lychee** validates internal links in the built site.

Dependencies are pinned in `package.json`. Browser libraries are copied into the production artifact during `npm run build`; Node development tooling is never deployed.

## Build

```
npm install
npm run pages   # only after editing scripts/pages
npm run build
npm run check
```

The production output is written to `_site/`. GitHub Pages deploys only that directory.

## Public pages

- `index.html` team hub
- `team.html` fighters (live from BuhurtOS), company record, add-your-profile steps, crew and leadership
- `fighter.html?id=…` a fighter's profile, record and placings from BuhurtOS
- `training.html` practice information and newcomer flow
- `events.html` tournaments, appearances, schedule, and calendar actions
- `community.html` schools, demos, events, birthdays, and partnership inquiries
- `media.html` optimized PhotoSwipe team gallery, newest social photos first
- `social.html` Instagram, Facebook, BuhurtOS and email in one place, with the synced photo feed

## Admin

The old `admin.html` page is gone: everything it did now lives in the Reavers app (`/app/`, also at app.reddeerreavers.com) under **Website**, and `/admin` redirects there:

- Calendar: events, weekly practices and every BuhurtOS event on one month grid
- Team page: hide or show BuhurtOS fighters, put club members on the website, and add, order and edit crew, coaches and media
- Practices
- Community inquiries
- Site editor
- Printable and downloadable QR codes
- Site settings

Routine content changes are designed to be made from the app rather than by editing site files.
