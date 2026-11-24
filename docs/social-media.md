# Social media manager: setup

The app (Growth → **Social media**) lets the executive write a post once, pick the club's accounts, and post it now or
at a time they choose. Each account gets its own result: the live link, the error if it failed (with **Try again**),
and likes, comments, shares and views as they come in. Posts that fail for a passing reason (the platform was down,
a video still processing) are retried twice on their own, 5 and 20 minutes later.

Everything goes through each platform's official API. Nothing is scraped and no passwords are stored: people sign in
on the platform's own page, and the app keeps only the keys the platform hands back, in a table no screen and no
signed-in person can read.

## What can post, and when

| Platform | What it posts | Can post | What's still needed for the public to see it |
| --- | --- | --- | --- |
| **Discord** | Text, photos, video links | As soon as the function is deployed | Nothing |
| **Bluesky** | Text, links, up to 4 photos | As soon as the function is deployed | Nothing |
| **Facebook Page** | Text, links, up to 10 photos, or a video | Once you make the Meta app (step 4a) | Probably nothing: people with a role on the Meta app can connect Pages they manage. Check the first post from a signed-out browser (below). |
| **Instagram** | 1 photo, a carousel of up to 10, or a Reel | Once you make the Meta app (step 4b) | Same as Facebook: the club account is added as a tester on the app. |
| **YouTube** | Videos | Once you make the Google project (step 4c) | Google's **YouTube API audit**. Until it passes, every upload is locked to **private**, whatever you pick. |
| **TikTok** | Videos up to 64 MB | Once TikTok approves the app (step 4d) | TikTok's **Direct Post audit**. Until it passes, posts are **Only me**. |
| **X** | Text and up to 4 photos | Once you make the X app and buy credits (step 4e) | Nothing, but X charges for every post (below). |

The app says all of this next to each account, and the Check panel says it again before anything is posted. When
YouTube or TikTok keep a post private, the post's result says so.

Two things for the Meta, Google and TikTok reviews. First, a **privacy policy**: use
https://reddeerreavers.com/privacy.html (built from `scripts/pages/privacy.page.mjs`; it covers the YouTube API Services
wording Google asks for). Meta also asks for a **data deletion instructions URL**: use
https://reddeerreavers.com/privacy.html#delete. Second, for TikTok and the YouTube audit, a short screen recording of
connecting and posting from the app. The app's own screens are enough for that recording.

## 1. Database

Apply `app/supabase/migrations/20261124000000_reavers_app_social.sql` (Studio → SQL editor, or `psql -f`), on the home
server and the cloud copy. It adds the `reavers_app_social_*` tables, the public `reavers-social-media` storage bucket,
one function only the service role can call, and a **Social media** entry on the Page access screen (the executive has it
by default; members don't). Nothing existing changes. Check it first with `PGHOST=... PGUSER=postgres app/supabase/tests/run.sh`.

Videos: the bucket takes files up to 500 MB, but a self-hosted server has its own upload limit, `FILE_SIZE_LIMIT` in the
server's `.env` (50 MB by default). Raise it, say to `524288000`, and `docker compose up -d storage`, if you'll post
longer videos.

## 2. Deploy the function

Like the reminders and the attendance bot, on the BuhurtOS home server (`api-home.buhurtoshome.app`):

1. Copy `app/supabase/functions/_shared` and `app/supabase/functions/reavers-social` into the server's
   `volumes/functions/` folder.
2. Add to the server's `.env`, and pass them to the `functions` service in `docker-compose.yml` under `environment:`.
   Leave out the platforms you aren't setting up yet; the app shows those as "Not set up on the server yet".

   ```
   SOCIAL_REDIRECT_URI=https://api-home.buhurtoshome.app/functions/v1/reavers-social
   META_APP_ID=...            # 4a
   META_APP_SECRET=...
   INSTAGRAM_APP_ID=...       # 4b (Instagram's own id and secret, not the Meta app's)
   INSTAGRAM_APP_SECRET=...
   GOOGLE_CLIENT_ID=...       # 4c
   GOOGLE_CLIENT_SECRET=...
   TIKTOK_CLIENT_KEY=...      # 4d
   TIKTOK_CLIENT_SECRET=...
   X_CLIENT_ID=...            # 4e
   X_CLIENT_SECRET=...
   ```

   `REAVERS_CRON_SECRET` is the attendance bot's and is already there. Optional: `META_GRAPH_VERSION` (default `v23.0`).
3. This function runs with JWT checking off, because pg_cron and the platforms' sign-in pages can't send a Supabase
   sign-in. It checks every app call itself (the person needs the Social media page). If the server has
   `VERIFY_JWT=true`, add `reavers-social` to the skip list in `volumes/functions/main/index.ts`, next to
   `reavers-reminders`.
4. Big videos take a while to hand over to YouTube and TikTok. The server's `volumes/functions/main/index.ts` gives each
   function call a time limit (`workerTimeoutMs`); if long videos fail with a timeout, raise it to 5 minutes
   (`5 * 60 * 1000`).
5. `docker compose up -d functions`.

Quick check: `curl -X POST https://api-home.buhurtoshome.app/functions/v1/reavers-social` should answer
`{"error":"Sign in first"}`.

**The redirect address.** Every platform below asks for an "OAuth redirect URI" or "callback URL". It's the same for
all of them: `https://api-home.buhurtoshome.app/functions/v1/reavers-social`, exactly, with no slash at the end.

## 3. The 5-minute schedule

In Studio → SQL editor:

```sql
select cron.schedule('reavers-social-every-5-min', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://api-home.buhurtoshome.app/functions/v1/reavers-social',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-reavers-cron', (select decrypted_secret from vault.decrypted_secrets where name = 'reavers_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000)
$$);
```

Each run posts up to 6 accounts' worth of what's due (more goes out 5 minutes later), refreshes the numbers on recent
posts, and renews Instagram keys before they run out. A post scheduled for 10:00 goes out between 10:00 and 10:05.
"Post now" in the app doesn't wait for the schedule. To stop it: `select cron.unschedule('reavers-social-every-5-min');`

## 4. Each platform

### 4a. Facebook Page

1. Sign in at https://developers.facebook.com with a Facebook account that's an admin of the Reavers Page → **My Apps**
   → **Create app**. Name it "Reavers app". Use case: **Manage everything on your Page**. Connect it to the club's
   business portfolio if Meta asks (create one if there isn't one).
2. **App settings → Basic**: copy the **App ID** (`META_APP_ID`) and **App secret** (`META_APP_SECRET`). Fill in the
   privacy policy URL (https://reddeerreavers.com/privacy.html), the data deletion instructions URL
   (https://reddeerreavers.com/privacy.html#delete) and the app icon while you're there.
3. **Use cases → Manage everything on your Page → Customize**: make sure `pages_show_list`, `pages_read_engagement` and
   `pages_manage_posts` are added.
4. **Facebook Login for Business → Settings** (or **Facebook Login → Settings**): add the redirect address from step 2
   under **Valid OAuth Redirect URIs** and save.
5. **App roles → Roles**: add every person who will press Connect (as Administrator or Developer). They accept the
   invite at developers.facebook.com.
6. In the app: Social media → Accounts → **Connect Facebook Page**. Facebook asks which Pages to share: pick the Reavers
   Page.
7. Post a test, then open the Page in a private (signed-out) browser window. If the post doesn't show there, switch the
   Meta app from **Development** to **Live** at the top of the app dashboard (it needs the privacy policy URL). If Meta
   asks for **App Review** for `pages_manage_posts` before it'll let you, that's the review: submit the recording and a
   one-line reason ("the club's executive posts club news to the club's own Page").

### 4b. Instagram

The account must be a **professional account** (free: Instagram app → Settings → Account type and tools → Switch to
professional account → Creator or Business). The photo sync already needs this.

1. In the same Meta app: **Add product → Instagram → API setup with Instagram login**.
2. Copy the **Instagram app ID** (`INSTAGRAM_APP_ID`) and **Instagram app secret** (`INSTAGRAM_APP_SECRET`). These are
   different from the Meta app's.
3. **Set up Instagram business login → Business login settings**: add the same redirect address under **OAuth redirect
   URIs** and save.
4. **App roles → Roles → Instagram Testers → Add**: `red_deer_reavers`. Accept it in Instagram (Settings → Website
   permissions → Apps and websites → Tester invites).
5. In the app: **Connect Instagram** and sign in as @red_deer_reavers.
6. Public posting by accounts that aren't testers needs App Review for `instagram_business_content_publish`. For the
   club's own account, the tester role is enough.

Instagram takes JPEG photos only (the app checks), and doesn't allow text-only posts. Its keys last 60 days; the
function renews them on its own, so nobody has to sign in again as long as the schedule runs.

### 4c. YouTube

1. https://console.cloud.google.com, signed in with the Google account that owns the Reavers channel → create a
   project "Reavers app".
2. **APIs & Services → Library → YouTube Data API v3 → Enable**.
3. **Google Auth Platform** (OAuth consent screen): app name "Reavers app", support email, **Audience: External**.
   Under **Branding → Authorized domains** add `reddeerreavers.com` and `buhurtoshome.app`. Under **Data access** add
   the scopes `.../auth/youtube.upload` and `.../auth/youtube.readonly`.
4. **Clients → Create client → Web application**. Under **Authorized redirect URIs** add the redirect address. Copy the
   **Client ID** (`GOOGLE_CLIENT_ID`) and **Client secret** (`GOOGLE_CLIENT_SECRET`).
5. **Audience → Publish app** (to "In production"). Important: while it says "Testing", Google cancels the sign-in
   after 7 days and YouTube stops posting. Google shows an "unverified app" warning on the sign-in screen until it
   verifies the app; for the club's own use you can click through it (Advanced → Go to Reavers app).
6. In the app: **Connect YouTube**, sign in, and pick the Reavers channel (or its brand account).
7. **The audit.** Uploads from an unaudited project are locked to private. Apply with the YouTube API Services audit
   form: https://support.google.com/youtube/contact/yt_api_form ("I'd like to request an API audit"). Until it
   passes, you can still upload privately and then make the video public in YouTube Studio by hand.

Google limits each project to a daily quota (10,000 units by default); an upload uses a large share of it, so a handful
of uploads a day is the practical limit. That's plenty for the club.

### 4d. TikTok

1. https://developers.tiktok.com → sign in → **Manage apps → Connect an app**. Fill in the app details, icon, privacy
   policy and terms URLs, and the website `https://reddeerreavers.com`.
2. **Add products**: **Login Kit** and **Content Posting API**. Turn on **Direct Post** under Content Posting API.
   Scopes: `user.info.basic` and `video.publish`.
3. **Login Kit → Redirect URI**: add the redirect address.
4. Copy the **Client key** (`TIKTOK_CLIENT_KEY`) and **Client secret** (`TIKTOK_CLIENT_SECRET`).
5. To try it before TikTok approves the app, use the app's **Sandbox**: add the club's TikTok as a target user, and use
   the sandbox client key and secret.
6. **Submit for review** (with the recording). Once approved, swap in the production key and secret, and apply for the
   **Direct Post audit** in the Content Posting API section. Until that passes, every post goes out as Only me.

### 4e. X (Twitter)

1. https://console.x.com → create a project and app.
2. **User authentication settings → Set up**: permissions **Read and write**, type of app **Web App (confidential
   client)**, callback URI the redirect address, website `https://reddeerreavers.com`.
3. Copy the **OAuth 2.0 Client ID** (`X_CLIENT_ID`) and **Client Secret** (`X_CLIENT_SECRET`).
4. **Buy credits** in the console. X is pay-per-use: at the time of writing about 1.5 cents per post, and 20 cents for
   a post with a link in it. Set a spending limit in the console. Without credits, X refuses every post and the app
   shows X's message.

### 4f. Bluesky

No setup. In Bluesky: Settings → Privacy and security → **App passwords → Add**. In the app: **Connect Bluesky**, enter
the club's handle and that app password (not the account password).

### 4g. Discord

No setup. In the Reavers Discord: open the announcements channel → Edit Channel → Integrations → Webhooks → **New
Webhook** → name it "Reavers" → **Copy Webhook URL**. In the app: **Connect Discord channel** and paste it. Connect more
channels the same way. Posts can't ping anyone (@everyone is shown as text).

## Using it

- **Write**: the text, photos or one video, an optional link, the accounts, and optionally different wording for one
  platform (a shorter one for X, say). The Check panel shows each platform's character count and anything it won't take.
- **When**: Post now, Schedule (Red Deer time), or Save as draft.
- **Posts**: Coming up, Posted, To check (anything that failed), Drafts. Each account has its own result. A post can be
  edited or cancelled until it starts going out; after that, use **Copy to new post**.
- **Accounts**: connect, reconnect (when a platform cancels the sign-in, the account shows "Needs connecting again"), or
  disconnect.

## When something goes wrong

- The error shown on the post is the platform's own message.
- "Needs connecting again": the person who connected it changed their password, removed the app, or lost admin on the
  Page. Press Connect again, then **Try again** on the post.
- "Not set up on the server yet": that platform's keys aren't in the server's `.env` (step 2).
- YouTube "quotaExceeded": the day's quota is used up; it's tried again later.
- Nothing goes out at the scheduled time: check the schedule (step 3) with `select * from cron.job_run_details order by
  start_time desc limit 5;`, or press **Post what's due now**.

## Not in this version

Instagram Stories, TikTok photo posts, videos on X and Bluesky, Threads, LinkedIn and Google Business Profile, replying
to comments, and follower counts. Each of those has an official API and can be added the same way.
