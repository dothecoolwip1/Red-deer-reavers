// Pulls the Reavers' latest Instagram and Facebook posts and stores their photos in the site.
// Runs on a schedule from .github/workflows/social-sync.yml. Setup: docs/SOCIAL_SYNC.md.
//
// Environment (all optional; a source without credentials is skipped):
//   INSTAGRAM_ACCESS_TOKEN  long-lived token from the Instagram API with Instagram Login (professional account)
//   FACEBOOK_PAGE_ID        numeric id of the Reavers Facebook Page
//   FACEBOOK_PAGE_TOKEN     Page access token with pages_read_engagement
//   META_GRAPH_VERSION      e.g. "v23.0"; empty uses the app's default version
//   SOCIAL_MAX_POSTS        newest posts to keep (default 48)
//
// Output: assets/social/feed.json plus WebP sizes of every photo in assets/social/.
// Photos are downloaded and re-encoded because Meta's image links expire.
// A source that fails keeps its previously synced posts, so a hiccup never empties the page.
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const root = process.cwd();
const dir = path.join(root, "assets", "social");
const feedPath = path.join(dir, "feed.json");
const widths = [360, 720, 1200];
const maxPosts = Math.max(1, Number(process.env.SOCIAL_MAX_POSTS || 48));
const maxImagesPerPost = 6;
const version = (process.env.META_GRAPH_VERSION || "").trim().replace(/^\/|\/$/g, "");
const v = version ? `${version}/` : "";
const ACCOUNTS = {
  instagram: { label: "Instagram", handle: "@red_deer_reavers", url: "https://www.instagram.com/red_deer_reavers/" },
  facebook: { label: "Facebook", handle: "Red Deer Reavers", url: "https://www.facebook.com/share/1BZE4wGtyz/" }
};

const log = message => console.log(message);
const warn = message => console.log(`::warning::${message}`);
const redact = (text, secrets) => secrets.filter(Boolean).reduce((out, s) => out.split(s).join("***"), String(text));

async function getJson(url, secrets) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.error) throw new Error(`${response.status} ${body.error?.message || response.statusText}`);
    return body;
  } catch (error) {
    throw new Error(redact(error.message, secrets));
  } finally {
    clearTimeout(timer);
  }
}

async function download(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`image ${response.status}`);
    const type = response.headers.get("content-type") || "";
    if (!type.startsWith("image/")) throw new Error(`not an image (${type})`);
    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

const cleanCaption = text => String(text || "").replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, 600);
const safePermalink = url => (/^https:\/\/(www\.|m\.)?(instagram\.com|facebook\.com|fb\.watch)\//i.test(String(url || "")) ? String(url) : "");
const altFrom = (caption, source) => {
  const first = cleanCaption(caption).split(/\n|(?<=[.!?])\s/)[0].replace(/#[\w-]+/g, "").replace(/\s+/g, " ").trim();
  return first ? first.slice(0, 140) : `Red Deer Reavers photo from ${ACCOUNTS[source].label}`;
};

// ---------------------------------------------------------------- Instagram (Instagram API with Instagram Login)
async function fetchInstagram(token) {
  const secrets = [token];
  try {
    const refreshed = await getJson(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`, secrets);
    const days = Math.round(Number(refreshed.expires_in || 0) / 86400);
    log(`Instagram token refreshed${days ? `, valid for about ${days} days` : ""}.`);
    if (refreshed.access_token && refreshed.access_token !== token) warn("Instagram returned a different token on refresh. Update the INSTAGRAM_ACCESS_TOKEN secret with a fresh token (see docs/SOCIAL_SYNC.md).");
  } catch (error) {
    // A token younger than 24 hours cannot be refreshed yet; that is fine.
    log(`Instagram token refresh skipped: ${error.message}`);
  }
  const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{id,media_type,media_url,thumbnail_url}";
  let url = `https://graph.instagram.com/${v}me/media?fields=${encodeURIComponent(fields)}&limit=25&access_token=${encodeURIComponent(token)}`;
  const posts = [];
  while (url && posts.length < maxPosts) {
    const page = await getJson(url, secrets);
    for (const m of page.data || []) {
      const pick = item => (item.media_type === "VIDEO" ? item.thumbnail_url : item.media_url);
      const sources = m.media_type === "CAROUSEL_ALBUM"
        ? (m.children?.data || []).map(pick)
        : [pick(m)];
      const images = sources.filter(Boolean).slice(0, maxImagesPerPost);
      if (!images.length) continue;
      posts.push({ id: `ig-${m.id}`, source: "instagram", url: safePermalink(m.permalink), date: m.timestamp, caption: cleanCaption(m.caption), video: m.media_type === "VIDEO", remote: images });
    }
    url = page.paging?.next || "";
  }
  return posts;
}

// ---------------------------------------------------------------- Facebook Page posts
async function fetchFacebook(pageId, token) {
  const secrets = [token];
  const fields = "id,message,created_time,permalink_url,full_picture,attachments{media_type,media,subattachments{media_type,media}}";
  let url = `https://graph.facebook.com/${v}${encodeURIComponent(pageId)}/posts?fields=${encodeURIComponent(fields)}&limit=25&access_token=${encodeURIComponent(token)}`;
  const posts = [];
  let pages = 0;
  while (url && posts.length < maxPosts && pages < 6) {
    pages++;
    const page = await getJson(url, secrets);
    for (const p of page.data || []) {
      const attachment = p.attachments?.data?.[0];
      const subs = attachment?.subattachments?.data || [];
      const fromAttachments = (subs.length ? subs : attachment ? [attachment] : [])
        .map(a => a.media?.image?.src)
        .filter(Boolean);
      const images = (fromAttachments.length ? fromAttachments : [p.full_picture]).filter(Boolean).slice(0, maxImagesPerPost);
      if (!images.length) continue;
      const video = /video/i.test(attachment?.media_type || "");
      posts.push({ id: `fb-${p.id}`, source: "facebook", url: safePermalink(p.permalink_url), date: p.created_time, caption: cleanCaption(p.message), video, remote: images });
    }
    url = page.paging?.next || "";
  }
  return posts;
}

// ---------------------------------------------------------------- images
const slug = id => id.replace(/[^a-z0-9-]/gi, "-").slice(0, 60);

async function storeImages(post, previous) {
  const prior = previous?.images || [];
  const images = [];
  for (let i = 0; i < post.remote.length; i++) {
    const base = `${slug(post.id)}-${i + 1}`;
    const known = prior[i];
    const files = widths.map(w => path.join(dir, `${base}-${w}.webp`));
    const exists = known && (await Promise.all(files.map(f => fs.access(f).then(() => true, () => false)))).every(Boolean);
    if (exists) { images.push(known); continue; }
    try {
      const buffer = await download(post.remote[i]);
      const meta = await sharp(buffer).rotate().metadata();
      if (!meta.width || !meta.height) continue;
      const sizes = {};
      for (const w of widths) {
        const out = path.join(dir, `${base}-${w}.webp`);
        const info = await sharp(buffer).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: w >= 1200 ? 80 : 76, effort: 5 }).toFile(out);
        sizes[w] = { src: `assets/social/${base}-${w}.webp`, width: info.width, height: info.height };
      }
      images.push({ alt: altFrom(post.caption, post.source), sizes });
    } catch (error) {
      warn(`Skipped a photo from ${post.id}: ${error.message}`);
    }
  }
  return images;
}

// ---------------------------------------------------------------- main
await fs.mkdir(dir, { recursive: true });
let previousFeed = { posts: [] };
try { previousFeed = JSON.parse(await fs.readFile(feedPath, "utf8")); } catch { /* first run */ }
const previousById = new Map((previousFeed.posts || []).map(p => [p.id, p]));

const igToken = (process.env.INSTAGRAM_ACCESS_TOKEN || "").trim();
const fbPage = (process.env.FACEBOOK_PAGE_ID || "").trim();
const fbToken = (process.env.FACEBOOK_PAGE_TOKEN || "").trim();
const configured = { instagram: Boolean(igToken), facebook: Boolean(fbPage && fbToken) };
if (!configured.instagram && !configured.facebook) {
  log("No social media credentials are configured, so there is nothing to sync. See docs/SOCIAL_SYNC.md.");
  process.exit(0);
}

const fetched = [];
const failed = [];
for (const [source, run] of [["instagram", () => fetchInstagram(igToken)], ["facebook", () => fetchFacebook(fbPage, fbToken)]]) {
  if (!configured[source]) continue;
  try {
    const posts = await run();
    log(`${ACCOUNTS[source].label}: ${posts.length} posts with photos.`);
    fetched.push(...posts);
  } catch (error) {
    failed.push(source);
    warn(`${ACCOUNTS[source].label} could not be read: ${error.message}. Keeping the photos already on the site.`);
    fetched.push(...(previousFeed.posts || []).filter(p => p.source === source).map(p => ({ ...p, keep: true })));
  }
}

// Unconfigured sources keep whatever was synced before (for example while a token is being replaced).
for (const p of previousFeed.posts || []) if (!configured[p.source]) fetched.push({ ...p, keep: true });

const newest = fetched
  .filter(p => p.date && !Number.isNaN(Date.parse(p.date)))
  .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
  .filter((p, i, all) => all.findIndex(q => q.id === p.id) === i)
  .slice(0, maxPosts);

const posts = [];
for (const post of newest) {
  if (post.keep) { if (post.images?.length) posts.push({ id: post.id, source: post.source, url: post.url, date: post.date, caption: post.caption, video: Boolean(post.video), images: post.images }); continue; }
  const images = await storeImages(post, previousById.get(post.id));
  if (images.length) posts.push({ id: post.id, source: post.source, url: post.url, date: new Date(post.date).toISOString(), caption: post.caption, video: Boolean(post.video), images });
}

// Remove photos that are no longer in the feed.
const keepFiles = new Set(posts.flatMap(p => p.images.flatMap(img => Object.values(img.sizes).map(s => path.basename(s.src)))));
for (const name of await fs.readdir(dir)) {
  if (name.endsWith(".webp") && !keepFiles.has(name)) await fs.rm(path.join(dir, name));
}

const signature = crypto.createHash("sha1").update(JSON.stringify(posts)).digest("hex");
const previousSignature = crypto.createHash("sha1").update(JSON.stringify(previousFeed.posts || [])).digest("hex");
const feed = {
  updated: signature === previousSignature && previousFeed.updated ? previousFeed.updated : new Date().toISOString(),
  accounts: ACCOUNTS,
  posts
};
await fs.writeFile(feedPath, JSON.stringify(feed, null, 2) + "\n");
log(`Social feed: ${posts.length} posts, ${keepFiles.size / widths.length} photos.${failed.length ? ` Problems with: ${failed.join(", ")}.` : ""}`);
if (failed.length && failed.length === Object.values(configured).filter(Boolean).length) process.exit(1);
