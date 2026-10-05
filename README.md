# Red Deer Reavers website

Public team website and lightweight team administration for the Red Deer Reavers in Central Alberta.

## Architecture

- Static HTML, CSS, and JavaScript hosted on GitHub Pages
- Supabase PostgreSQL for practices, events, crew roster, site settings, and community inquiries
- Supabase Edge Function `reavers-site-api` for public data and the password protected admin workflow
- **BuhurtOS** (`buhurtos.js`) for fighter profiles: the Team page, home page fighter cards, `fighter.html` profiles, the company record, tournament results and events are read live from BuhurtOS's public API
- Progressive Web App manifest and service worker for installable mobile use
- GitHub Actions production build and quality checks

## Fighter profiles from BuhurtOS

Fighters do not need to be added on this site. A fighter signs in to BuhurtOS, asks to join the Red Deer Reavers, and builds their profile there (photo, disciplines, bio, socials). Once the team captain approves them on BuhurtOS, they appear on the Team page automatically, and their record and placings fill in as they compete at BuhurtOS events. The Team page has an "Add your fighter profile" section that links straight into that flow.

**Hiding people who come and go.** In Admin → Roster, every BuhurtOS fighter has a **Hide** / **Show** button. Hiding keeps them off the Team page, the home page, the crew count and their profile page, and leaves their BuhurtOS record untouched. The hide list is stored with the team's roster data as a record whose discipline is `hide-buhurtos:<fighter id>`; those records are never shown as people.

**Events from BuhurtOS.** Every upcoming published tournament on BuhurtOS, plus anything the Reavers host (`host_team_id`) or are entered in, is merged into the Events page, the home page "upcoming" card and the add-to-calendar buttons, with a link to the BuhurtOS page for details and registration. Ones the Reavers host or enter are labelled "Reavers hosting" / "Reavers entered". Events also entered by hand in Admin are not duplicated, and test events are never shown. Admin → Calendar lists what is being pulled in.

`buhurtos.js` reads only public data with the BuhurtOS publishable (browser-safe) key: the team roster, public fighter profile fields, team and fighter statistics, results, and entries. It never shows birth year, age, gender, account or contact data, and leaves synthetic/test fighters and events out of the roster and records. Anyone on the admin crew roster whose name matches a BuhurtOS fighter is merged into that fighter's card, so crew, coaches and media can still be listed from Admin.

## Social photo sync

`.github/workflows/social-sync.yml` runs `scripts/sync-social.mjs` once a day. It reads the latest Instagram and Facebook posts through Meta's official APIs, saves WebP copies of the photos in `assets/social/`, writes `assets/social/feed.json`, and commits them so they appear on the Social, Media and Home pages. It does nothing until the `INSTAGRAM_ACCESS_TOKEN` and/or `FACEBOOK_PAGE_ID` + `FACEBOOK_PAGE_TOKEN` repository secrets are added. Step-by-step setup: [docs/SOCIAL_SYNC.md](docs/SOCIAL_SYNC.md).

## Design

The "Forged" theme lives in `styles.css`: dark iron, gilt corner guards, parchment sections, heraldic shield avatars, and the crest's purple and ember. Fonts (Grenze Gotisch, Cinzel, Alegreya Sans, all OFL) are self-hosted from `vendor/fonts`. Moving decoration (forge embers, the discipline banner) respects reduced-motion settings and has a pause button.

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
- **SortableJS** lets Admin drag and save roster ordering.
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

Open `admin.html` to manage:

- Events
- Roster profiles, public visibility, and drag ordering
- Recurring practices
- Community inquiries
- Printable/downloadable QR codes
- Basic site settings

Routine content changes are designed to be made from Admin rather than by editing site files.
