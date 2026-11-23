# Move reddeerreavers.com from Vercel to Cloudflare Pages (free)

Written 2026-11-23. Since 2026-11-18 Vercel answers every request on reddeerreavers.com and app.reddeerreavers.com with
`402 Deployment Paused`, the same thing that happened to buhurt-os.app. This moves the Reavers site onto the same setup
BuhurtOS uses now (`dothecoolwip1/buhurtos`, `docs/runbooks/MOVE_TO_CLOUDFLARE_PAGES.md`).

**What changes:** only where the website files are served from, and which company runs the domain's DNS.
**What does not change:** the database, sign-in, Square, the forms and the app's data. They already live on the BuhurtOS
home server (`https://api-home.buhurtoshome.app`), with the 2-minute copy to the cloud project and the site switch in front
of it. Squarespace stays the registrar (you keep paying Squarespace for the name only). Google Workspace email stays as is.

**Cost:** $0 (Cloudflare Pages Free and the Cloudflare Free DNS plan).

**Your clicks:** about 40 minutes over two days, in five parts. Do them in order. Part 2 has a wait of up to a day built in.

---

## The DNS records today (checked 2026-11-23 from Google's public DNS)

Nameservers: `nsc1.squarespacedns.com`, `nsc2.squarespacedns.com`, `nsc3.squarespacedns.com`, `nsc4.squarespacedns.com`.
DNSSEC: **on** (the `.com` registry holds a DS record, key tag 53176). This is the one thing that can take the whole domain,
email included, offline if it's done in the wrong order, so Part 2 turns it off before anything moves.

| Type | Name | Content | TTL | What happens to it |
| --- | --- | --- | --- | --- |
| MX | `@` | `smtp.google.com` priority `1` | 1 hour | **Copy exactly** (Google Workspace mail) |
| TXT | `@` | `v=spf1 include:_spf.google.com ~all` | 1 hour | **Copy exactly** |
| TXT | `google._domainkey` | `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1MYU43mWprlsalFHzMs2o7maFVF36/9NPDe4Z4wqj10MZ2XGg/kwjDtpmitpiNGrVxsrR4i7vNse61+CZ1rGdmgiuOOy8C7a+OP+g/h/xfFVnQpEOMp9unM+yPGX5HMoBDKtaMYpLv/jCyQ0wGhFjI9uEAElcnX/y3/8qbz3389eMjhi9Xakg/GN4i62zKl/yY1vsAKzpPjxgBji3UEBzm4QcO+1f76MqUXFiVmSGrZtwmU8XgrOw2QmG/KmlsAAJUVRQLvysHTmHbUsVAW24IXsiHdITvbTYLV70DDIdp3B8AE69N8OziGKO/d86ZusKO2LDJjCqW9J/wez53Xx9QIDAQAB` | 1 hour | **Copy exactly** (Google mail signing) |
| CNAME | `_domainconnect` | `_domainconnect.domains.squarespace.com` | 1 hour | **Copy exactly** (Squarespace's own helper; harmless) |
| A | `@` | `216.198.79.1` | 4 hours | Replaced by Pages (Vercel's address) |
| A | `@` | `64.29.17.1` | 4 hours | Replaced by Pages (Vercel's address) |
| CNAME | `www` | `2ae95fad027177cf.vercel-dns-017.com` | 4 hours | Replaced by Pages |
| CNAME | `app` | `2ae95fad027177cf.vercel-dns-017.com` | 4 hours | Replaced by Pages |

Public DNS can't list every name in a domain. I checked the usual ones (`_dmarc`, `mail`, `calendar`, `shop`, `send`,
`em`, other DKIM selectors and about 20 more) and found nothing else, but **Part 2 step 1 has you compare against
Squarespace's own list** before anything moves.

---

## Part 1. Merge the repo change and create the Pages project (15 minutes)

The pull request adds `_redirects` and `_headers`, which give Cloudflare the same redirects and headers that `vercel.json`
gave Vercel. Merge it on GitHub first so the first Cloudflare build already has them.

1. Open **https://dash.cloudflare.com** and sign in (the same account that has `buhurtoshome.app` and `buhurt-os.app`).
2. Left menu: **Compute** (or **Workers & Pages**) > **Workers & Pages** > **Create application**.
3. Pick the **Pages** tab (not Workers) > **Import an existing Git repository** > **Get started**.
4. The repository list probably shows only `buhurtos`, because the Cloudflare GitHub app was given that one repository.
   Click **+ Add account** / **Configure GitHub** (it opens GitHub). Under **Repository access**, keep **Only select
   repositories**, add `dothecoolwip1/Red-deer-reavers`, and click **Save**. Back in Cloudflare the list now shows it.
5. Pick **Red-deer-reavers** > **Begin setup** and fill in:

   | Field | Old value | New value |
   | --- | --- | --- |
   | Project name | `red-deer-reavers` (prefilled) | `red-deer-reavers` |
   | Production branch | `main` | `main` |
   | Framework preset | None | `None` |
   | Build command | (empty) | `npm run build` |
   | Build output directory | (empty) | `_site` |
   | Root directory | (empty) | leave empty |

6. **Environment variables (advanced)** > **Add variable**: name `NODE_VERSION`, value `24`. Nothing else is needed: the
   site and app have the home server's address and public key built in.
7. **Save and Deploy**. Wait for the green **Success** (about 3 minutes: it builds the app, runs its tests and optimizes
   the photos).
8. Open the `https://red-deer-reavers.pages.dev` link it shows. The home page should load with fighters and events.
   (Signing in to the app only works on the real address, not on pages.dev. That is expected.)
9. **Save build minutes:** project > **Settings** > **Builds** (or **Build**) > **Branch control** > **Preview branch**:
   old value `All non-Production branches`, new value `None`. Only `main` then builds.

Tell me when step 8 works. I check every page on pages.dev on a phone and a desktop size before Part 3.

---

## Part 2. Turn DNSSEC off at Squarespace, then wait (5 minutes, then up to a day)

Nothing visible changes in this part. It's there because Cloudflare will sign the domain with its own keys, and the
`.com` registry still pointing at Squarespace's key would make every lookup fail for about a third of the internet.

1. Open **https://account.squarespace.com/domains** > click **reddeerreavers.com** > **DNS** (left menu) >
   **DNS Settings**. **Take a screenshot of every record listed** (all sections, including "Custom records" and any
   "Google Workspace" or "Squarespace Defaults" block) and send it to me. I compare it with the table above.
2. On the same domain, open **DNSSEC** (on the DNS page, or under **Advanced settings**, depending on the Squarespace
   layout). Old value: **On** (or "DNSSEC enabled"). New value: **Off**. Confirm.
3. Wait. The `.com` registry keeps the old DS record for up to 24 hours. I check from here and tell you when it's gone;
   don't move on before that.

Rollback for this part: turn DNSSEC back on in the same place.

---

## Part 3. Add the domain to Cloudflare (10 minutes, after I say the DS record is gone)

1. **https://dash.cloudflare.com** > account home > **Add** > **Connect a domain** (or **Onboard a domain**).
2. Type `reddeerreavers.com`, keep **Quick scan for DNS records**, **Continue**, choose the **Free** plan.
3. On the DNS records review, make it match this list exactly. Add what's missing (**Add record**), fix what differs,
   and delete anything that isn't here. Mail records are **DNS only** (grey cloud).

   | Type | Name | Content | Priority | Proxy | TTL |
   | --- | --- | --- | --- | --- | --- |
   | MX | `@` | `smtp.google.com` | `1` | DNS only | 1 hr |
   | TXT | `@` | `v=spf1 include:_spf.google.com ~all` | | DNS only | 1 hr |
   | TXT | `google._domainkey` | the long `v=DKIM1; k=rsa; p=MIIB...QIDAQAB` value from the table at the top | | DNS only | 1 hr |
   | CNAME | `_domainconnect` | `_domainconnect.domains.squarespace.com` | | DNS only | 1 hr |

   **Delete** the Vercel ones if the scan brought them in (Part 4 adds the new ones for you):

   | Type | Name | Old content (delete) |
   | --- | --- | --- |
   | A | `reddeerreavers.com` | `216.198.79.1` |
   | A | `reddeerreavers.com` | `64.29.17.1` |
   | CNAME | `www` | `2ae95fad027177cf.vercel-dns-017.com` |
   | CNAME | `app` | `2ae95fad027177cf.vercel-dns-017.com` |

4. **Continue to activation**. Cloudflare shows two nameservers (like `xxx.ns.cloudflare.com`). Copy them.
5. Open **https://account.squarespace.com/domains** > **reddeerreavers.com** > **DNS** > **Domain Nameservers**
   (or **Nameservers**) > **Use custom nameservers**.
   - Old value: `nsc1.squarespacedns.com`, `nsc2.squarespacedns.com`, `nsc3.squarespacedns.com`, `nsc4.squarespacedns.com`
   - New value: the two Cloudflare nameservers from step 4. **Save**.
6. Back in Cloudflare click **Check nameservers now**. It usually turns **Active** within 5 to 30 minutes (up to 24 h).

Email keeps flowing the whole time: during the change some senders ask Squarespace and some ask Cloudflare, and both
give the same MX, SPF and DKIM answers.

---

## Part 4. Point the domain at Pages and add the two host redirects (10 minutes, once the domain is Active)

1. **Workers & Pages** > **red-deer-reavers** > **Custom domains** > **Set up a custom domain** > type
   `reddeerreavers.com` > **Continue** > **Activate domain**.
2. Repeat for `www.reddeerreavers.com` and for `app.reddeerreavers.com`. Wait until all three show **Active**.
3. Two redirects depend on the host name, which Pages' `_redirects` file can't see, so they are zone rules. Go to
   **reddeerreavers.com** (the domain, not the Pages project) > **Rules** > **Overview** > **Create rule** >
   **Redirect Rule**.

   Rule 1, `www to bare domain` (there is also a ready-made template "Redirect from WWW to root"):

   | Field | Value |
   | --- | --- |
   | Rule name | `www to bare domain` |
   | When incoming requests match | Custom filter expression |
   | Field / Operator / Value | `Hostname` / `equals` / `www.reddeerreavers.com` |
   | Then: Type | `Dynamic` |
   | Expression | `concat("https://reddeerreavers.com", http.request.uri.path)` |
   | Status code | `301` |
   | Preserve query string | ticked |

   **Deploy**. Then Rule 2, `app host to the app`:

   | Field | Value |
   | --- | --- |
   | Rule name | `app host to the app` |
   | When incoming requests match | Custom filter expression > **Edit expression** |
   | Expression | `(http.host eq "app.reddeerreavers.com" and not starts_with(http.request.uri.path, "/app/"))` |
   | Then: Type | `Static` |
   | URL | `https://app.reddeerreavers.com/app/` |
   | Status code | `302` |
   | Preserve query string | ticked |

   **Deploy**. These are the same two rules `vercel.json` had.
4. Optional, later: **reddeerreavers.com** > **DNS** > **Settings** > **DNSSEC** > **Enable DNSSEC**, then copy the
   DS record it shows into Squarespace > **DNSSEC** > **Add DS record** (key tag, algorithm 13, digest type 2, digest).

Tell me when step 3 is done. I check every page address on a phone and a desktop, sign-in on the app, the forms, and the
MX/SPF/DKIM answers.

---

## Part 5. Vercel (only after I confirm everything works on Cloudflare)

1. **https://vercel.com/r5-03dd/red-deer-reavers/settings/domains**: remove `reddeerreavers.com`,
   `www.reddeerreavers.com` and `app.reddeerreavers.com` (**⋯** > **Remove**). Nothing points at Vercel any more, so this
   only tidies up.
2. Leave the Vercel project itself for a week as a fallback copy of the build, then delete it (or cancel the plan) if you
   like. The old `reavers-site` project serves nothing and can go now.

---

## After the move

- **Deploys:** every merge to `main` builds on Cloudflare and goes live by itself. A build that fails never goes live; the
  last good one stays up. Rollback: Pages project > **Deployments** > pick an older one > **⋯** > **Rollback to this deployment**.
- **Checks run locally**, not on GitHub Actions: `npm run verify` (syntax, full build, static checks). With a local server
  on `_site` (`python3 -m http.server 4173 --directory _site`), `npm run a11y` and `npm run lighthouse` too. The Site
  Quality and asset workflows now run only when started by hand.
- **Old addresses:** Pages serves every page without `.html` (`/team`) and sends `/team.html` there with a permanent
  redirect, query string kept (`/fighter.html?id=…` goes to `/fighter?id=…`). The other old addresses keep working
  through `_redirects`.
- **Header and redirect changes** go in `_headers` and `_redirects`. `vercel.json` stays until Vercel is gone.
