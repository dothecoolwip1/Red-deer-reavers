# Social photo sync

Photos the Reavers post on Instagram and Facebook are copied onto the website automatically. Every six hours a GitHub Action
(`.github/workflows/social-sync.yml`) reads the latest posts through Meta's official APIs, saves resized copies of the photos in
`assets/social/`, and publishes them. They show up on:

- **Social** (`social.html`): every channel in one place, with the merged photo feed
- **Media** (`media.html`): newest social photos first in the gallery
- **Home**: a "Fresh from our socials" strip

Nothing is synced until the credentials below are added. Until then the pages simply show the follow links.

Photos are downloaded rather than linked because Meta's image links expire. Only posts with photos are used, captions are
shown as plain text, and video posts appear as their cover image linking to the original post.

## What you need

- The Instagram account **@red_deer_reavers** switched to a **professional account** (Business or Creator, free:
  Instagram app → Settings → Account type and tools). Meta no longer offers API access to personal accounts.
- The Reavers **Facebook Page** and admin access to it.
- A free **Meta developer account** (developers.facebook.com) to create an app. It can stay in development mode because it
  only reads your own accounts.

## 1. Create the Meta app

1. developers.facebook.com → My Apps → **Create app**. Name it something like "Reavers Website".
2. Add the **Instagram** product, choose **API setup with Instagram login**.
3. Add the **Facebook Login for Business** / **Pages** use case if you also want Facebook posts.

## 2. Instagram token

1. In the app: Instagram → API setup with Instagram login → **Generate access tokens**.
2. Add @red_deer_reavers as an Instagram tester if asked, accept the invite in the Instagram app, then generate a token with
   the `instagram_business_basic` permission.
3. Copy the token. It is a long-lived token (about 60 days). The sync refreshes it on every run, so it keeps working as
   long as the Action runs at least once every 60 days.

## 3. Facebook Page id and token

1. Open the Graph API Explorer (developers.facebook.com/tools/explorer), select your app, and request
   `pages_show_list` and `pages_read_engagement`.
2. Generate a user token, then exchange it for a long-lived one (Access Token Tool → Extend).
3. In the Explorer run `me/accounts` with the long-lived token. Copy the Reavers Page's `id` and `access_token`.
   A Page token made from a long-lived user token does not expire.

## 4. Add the secrets to GitHub

Repository → Settings → Secrets and variables → Actions → **New repository secret**:

| Secret | Value |
| --- | --- |
| `INSTAGRAM_ACCESS_TOKEN` | the Instagram token from step 2 |
| `FACEBOOK_PAGE_ID` | the Page id from step 3 |
| `FACEBOOK_PAGE_TOKEN` | the Page token from step 3 |

Either source can be left out; the other still syncs. Optional: a repository **variable** `META_GRAPH_VERSION` (for
example `v23.0`) pins the Graph API version. Empty uses the app's default.

## 5. Run it

Actions → **Sync Social Photos** → **Run workflow**. New photos are committed to `main` and are live within a minute or
two. After that it runs on its own every six hours.

## When something goes wrong

- The run log names the source that failed. Photos already on the site stay put; a failure never empties the page.
- "Error validating access token": the token expired or was revoked. Generate a new one and replace the secret.
- If the log says Instagram returned a different token on refresh, replace `INSTAGRAM_ACCESS_TOKEN` with a freshly
  generated token.
- To remove a photo, delete the post on Instagram/Facebook; the next sync removes it from the site. Up to 48 recent posts
  are kept (`SOCIAL_MAX_POSTS`).

## Run it locally

```
INSTAGRAM_ACCESS_TOKEN=… FACEBOOK_PAGE_ID=… FACEBOOK_PAGE_TOKEN=… node scripts/sync-social.mjs
```
