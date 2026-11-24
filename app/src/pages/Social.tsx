import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { SaveRequest, SocialAccount, SocialPost, SocialStatus, SocialTarget } from "../data/social";
import { redDeerInstant, redDeerToday } from "../lib/reminders";
import {
  lengthFor, PLATFORM, PLATFORMS, problemsFor, statsLine, textFor, type MediaItem, type Platform, type PostDraft, type PostStatus,
  type TiktokPrivacy, type YoutubePrivacy
} from "../lib/social";
import { LOGO_PATH } from "../lib/socialLogos";
import { Empty, Loading, Page, Pill, errorText, useAction, usePage, useStore, useToast } from "../ui";

const STATUS: Record<PostStatus, [string, string]> = {
  draft: ["Draft", ""], scheduled: ["Scheduled", "soon"], publishing: ["Posting", "soon"], published: ["Posted", "done"],
  partial: ["Partly posted", "overdue"], failed: ["Failed", "overdue"], cancelled: ["Cancelled", ""]
};
const when = (iso: string) => new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Edmonton" }).format(new Date(iso));
const shortDate = (iso: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Edmonton" }).format(new Date(iso));
const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/** The platform's own logo, white on its brand colour. Decorative: the platform's name is always written next to it. */
export const Badge = ({ p }: { p: Platform }) => (
  <span className={`plat plat-${p}`} aria-hidden="true">
    <svg viewBox="0 0 24 24" focusable="false"><path d={LOGO_PATH[p]} /></svg>
  </span>
);

type Tab = "write" | "queue" | "accounts";

/** Write a post once, pick the club's accounts, post it now or later, and see how it did. */
export function Social() {
  const store = useStore();
  const toast = useToast();
  const edit = usePage("social") >= 2;
  const [params, setParams] = useSearchParams();
  const [accounts, setAccounts] = useState<SocialAccount[] | null | undefined>(undefined);
  const [data, setData] = useState<{ posts: SocialPost[]; targets: SocialTarget[] } | null>(null);
  const [status, setStatus] = useState<SocialStatus | undefined>(undefined);
  const [tab, setTab] = useState<Tab | null>(null);
  const [editing, setEditing] = useState<{ post: SocialPost | null; copy: boolean; key: number }>({ post: null, copy: false, key: 0 });
  const [busy, setBusy] = useState(false);
  const run = useAction();

  const load = useCallback(async () => {
    try {
      const [a, p] = await Promise.all([store.social.accounts(), store.social.posts()]);
      setAccounts(a); setData(p);
    } catch (e) { toast(errorText(e), true); setAccounts(null); setData({ posts: [], targets: [] }); }
  }, [store, toast]);
  useEffect(() => { void load(); store.social.status().then(setStatus, () => setStatus(null)); }, [load, store]);

  // Coming back from a platform's sign-in page.
  useEffect(() => {
    const ok = params.get("social_connected"), bad = params.get("social_error");
    if (!ok && !bad) return;
    if (ok) toast(`Connected ${ok}.`); else toast(bad || "", true);
    setTab("accounts");
    setParams({}, { replace: true });
  }, [params, setParams, toast]);

  const connected = (accounts || []).filter(a => a.status === "connected");
  const current = tab ?? (accounts && !accounts.length ? "accounts" : "write");
  const problems = (data?.posts || []).filter(p => p.status === "failed" || p.status === "partial").length;
  const upcoming = (data?.posts || []).filter(p => p.status === "scheduled" || p.status === "publishing").length;

  return (
    <Page title="Social media"
      intro="Write a post once and send it to the club's Facebook Page, Instagram, YouTube, TikTok, X, Bluesky and Discord, now or at a time you pick. Each account shows its own result, the live link, and likes and views once they come in."
      actions={edit && accounts && <button disabled={busy} onClick={async () => { setBusy(true); await run(async () => toast(await store.social.runNow())); setBusy(false); void load(); }}>{busy ? "Posting…" : "Post what's due now"}</button>}>
      {accounts === undefined ? <Loading /> : (
        <>
          {accounts === null && <p className="banner">The database update for social media isn't applied yet (<code>20261124000000_reavers_app_social.sql</code>), so nothing can be saved or posted. Setup: <code>docs/social-media.md</code>.</p>}
          {accounts && status === null && <p className="banner">The social media function isn't on the server yet, so accounts can't be connected and nothing goes out. Setup: <code>docs/social-media.md</code>.</p>}
          {accounts && status && !status.schedule && <p className="banner">The 5-minute schedule isn't set up on the server (REAVERS_CRON_SECRET), so scheduled posts only go out when someone presses Post what's due now.</p>}
          {!edit && <p className="muted small">You can look at this page but not post. An admin can change that under Team → Page access.</p>}

          <div className="segmented tabs social-tabs" role="tablist" aria-label="Social media">
            {([["write", editing.post && !editing.copy ? "Edit post" : "Write", 0, 0], ["queue", "Posts", upcoming, problems], ["accounts", "Accounts", connected.length, (accounts || []).length - connected.length]] as [Tab, string, number, number][]).map(([t, l, n, bad]) => (
              <button key={t} role="tab" aria-selected={current === t} onClick={() => setTab(t)}
                aria-label={t === "queue" ? `Posts: ${upcoming} coming up, ${problems} to check` : t === "accounts" ? `Accounts: ${connected.length} connected${bad ? `, ${bad} to reconnect` : ""}` : undefined}>
                {l}{n > 0 && <span className="tab-count">{n}</span>}{bad > 0 && <span className="tab-alert">{bad}</span>}
              </button>))}
          </div>

          {current === "write" && (
            edit ? <Composer key={editing.key} accounts={connected} post={editing.post} copy={editing.copy}
              onDone={() => { setEditing({ post: null, copy: false, key: editing.key + 1 }); setTab("queue"); void load(); }}
              onCancel={editing.post ? () => setEditing({ post: null, copy: false, key: editing.key + 1 }) : undefined}
              onConnect={() => setTab("accounts")} />
              : <Empty>Only people who can use this page can write posts.</Empty>)}
          {current === "queue" && (!data ? <Loading /> : (
            <Queue data={data} edit={edit} reload={load}
              onEdit={(post, copy) => { setEditing({ post, copy, key: editing.key + 1 }); setTab("write"); }} />))}
          {current === "accounts" && accounts && <Accounts accounts={accounts} status={status} edit={edit} reload={load} />}
        </>)}
    </Page>
  );
}

// ------------------------------------------------------------------ writing a post

type When = "now" | "later" | "draft";

function Composer({ accounts, post, copy, onDone, onCancel, onConnect }: {
  accounts: SocialAccount[]; post: SocialPost | null; copy: boolean; onDone: () => void; onCancel?: () => void; onConnect: () => void;
}) {
  const store = useStore();
  const toast = useToast();
  const run = useAction();
  const [body, setBody] = useState(post?.body ?? "");
  const [texts, setTexts] = useState<Partial<Record<Platform, string>>>(post?.texts ?? {});
  const [media, setMedia] = useState<MediaItem[]>(post?.media ?? []);
  const [link, setLink] = useState(post?.link_url ?? "");
  const [ytTitle, setYtTitle] = useState(post?.options?.youtube_title ?? "");
  const [ytPrivacy, setYtPrivacy] = useState<YoutubePrivacy>(post?.options?.youtube_privacy ?? "public");
  const [ttPrivacy, setTtPrivacy] = useState<TiktokPrivacy>(post?.options?.tiktok_privacy ?? "PUBLIC_TO_EVERYONE");
  const [picked, setPicked] = useState<string[]>([]);
  const [own, setOwn] = useState<Platform | null>(null);
  const [mode, setMode] = useState<When>(post?.status === "draft" && !copy ? "draft" : post?.scheduled_at && !copy ? "later" : "now");
  const startAt = post?.scheduled_at && !copy ? new Date(post.scheduled_at) : null;
  const [day, setDay] = useState(startAt ? startAt.toLocaleDateString("en-CA", { timeZone: "America/Edmonton" }) : addDays(redDeerToday(), 1));
  const [time, setTime] = useState(startAt ? startAt.toLocaleTimeString("en-GB", { timeZone: "America/Edmonton", hour: "2-digit", minute: "2-digit" }) : "10:00");
  const [uploading, setUploading] = useState(0);
  const [saving, setSaving] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  // The accounts a post being edited already goes to.
  useEffect(() => {
    if (!post) { setPicked([]); return; }
    store.social.posts().then(d => setPicked(d.targets.filter(t => t.post_id === post.id && t.account_id).map(t => t.account_id!)), () => undefined);
  }, [post, store]);

  const draft: PostDraft = { body, texts, media, link_url: link.trim() || null, options: { youtube_title: ytTitle.trim() || undefined, youtube_privacy: ytPrivacy, tiktok_privacy: ttPrivacy } };
  const chosen = accounts.filter(a => picked.includes(a.id));
  const platforms = [...new Set(chosen.map(a => a.platform))];
  const issues = platforms.map(p => [p, problemsFor(draft, p)] as const).filter(([, list]) => list.length);
  const at = mode === "later" ? redDeerInstant(day, time) : null;
  const tooSoon = at ? at.getTime() < Date.now() - 60e3 : false;
  const linkBad = link.trim() !== "" && !/^https?:\/\/\S+$/.test(link.trim());
  const blocked = mode !== "draft" && (!chosen.length || issues.length > 0 || tooSoon);
  const empty = !body.trim() && !media.length;

  async function add(files: FileList | null) {
    if (!files?.length) return;
    for (const f of Array.from(files)) {
      if (!/^(image\/(jpeg|png|webp|gif)|video\/(mp4|quicktime|webm))$/.test(f.type)) { toast(`${f.name}: use a JPEG, PNG, WebP or GIF photo, or an MP4 or MOV video.`, true); continue; }
      setUploading(n => n + 1);
      try { const m = await store.social.upload(f); setMedia(list => [...list, m]); }
      catch (e) { toast(`${f.name}: ${errorText(e)}`, true); }
      finally { setUploading(n => n - 1); }
    }
    if (file.current) file.current.value = "";
  }

  async function save() {
    setSaving(true);
    const req: SaveRequest = { id: post && !copy ? post.id : undefined, draft, accountIds: picked, when: mode === "draft" ? "draft" : mode === "now" ? "now" : at!, byName: store.session.name };
    const ok = await run(async () => toast(await store.social.save(req)));
    setSaving(false);
    if (ok) onDone();
  }

  if (!accounts.length) {
    return <Empty>No accounts are connected yet. <button className="linkish" onClick={onConnect}>Connect the club's accounts</button> first.</Empty>;
  }

  return (
    <div className="composer">
      <section className="card composer-main">
        {post && <p className="muted small">{copy ? "A copy of an earlier post. Change what you like, then post it." : "Editing a post that hasn't gone out yet."}</p>}
        <label className="field">
          <span>Post</span>
          <textarea rows={6} value={body} onChange={e => setBody(e.target.value)} placeholder="Practice this Sunday at 5 PM at the Westerner. New fighters welcome, loaner armour available." />
        </label>

        <div className="field">
          <span>Photos or a video</span>
          {media.length > 0 && (
            <ul className="media-list">
              {media.map((m, i) => (
                <li key={m.path + i}>
                  {m.kind === "image" ? <img src={m.url} alt="" /> : <video src={m.url} muted preload="metadata" />}
                  <div>
                    <small className="block">{m.name} · {(m.size / 1e6).toFixed(1)} MB</small>
                    {m.kind === "image" && <input aria-label={`Description of ${m.name} for people using screen readers`} placeholder="Describe the photo" value={m.alt || ""} onChange={e => setMedia(list => list.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} />}
                  </div>
                  <button className="ghost" aria-label={`Remove ${m.name}`} onClick={() => setMedia(list => list.filter((_, j) => j !== i))}>Remove</button>
                </li>))}
            </ul>)}
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm" multiple aria-label="Add photos or a video" onChange={e => void add(e.target.files)} />
          {uploading > 0 && <small className="muted">Uploading {uploading}…</small>}
        </div>

        <label className="field">
          <span>Link (optional)</span>
          <input type="url" inputMode="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://reddeerreavers.com/events.html" />
          {linkBad && <small className="error">Start the link with https://</small>}
        </label>

        <fieldset className="field accounts-pick">
          <legend>Post to</legend>
          {accounts.map(a => {
            const on = picked.includes(a.id);
            return (
              <label key={a.id} className={on ? "pick on" : "pick"}>
                <input type="checkbox" checked={on} onChange={e => setPicked(list => (e.target.checked ? [...list, a.id] : list.filter(x => x !== a.id)))} />
                <Badge p={a.platform} /> <span>{a.name}<small className="muted block">{PLATFORM[a.platform].label}</small></span>
              </label>);
          })}
          <div className="pick-all">
            <button type="button" className="ghost" onClick={() => setPicked(accounts.map(a => a.id))}>All</button>
            <button type="button" className="ghost" onClick={() => setPicked([])}>None</button>
          </div>
        </fieldset>

        {platforms.length > 0 && (
          <div className="field">
            <span>Different wording for one platform (optional)</span>
            <div className="segmented own-pick">
              {platforms.map(p => <button key={p} type="button" aria-pressed={own === p} aria-label={`Own wording for ${PLATFORM[p].label}`} title={PLATFORM[p].label} onClick={() => setOwn(own === p ? null : p)}><Badge p={p} /> {texts[p]?.trim() ? "✓" : ""}</button>)}
            </div>
            {own && (
              <label className="field">
                <span>{PLATFORM[own].label} gets this instead of the post above</span>
                <textarea rows={3} value={texts[own] || ""} onChange={e => setTexts(t => ({ ...t, [own]: e.target.value }))} placeholder={body} />
              </label>)}
          </div>)}

        {platforms.includes("youtube") && (
          <div className="field-row">
            <label className="field"><span>YouTube title</span><input maxLength={100} value={ytTitle} onChange={e => setYtTitle(e.target.value)} placeholder={body.split("\n")[0].slice(0, 100) || "Title"} /></label>
            <label className="field"><span>YouTube visibility</span>
              <select value={ytPrivacy} onChange={e => setYtPrivacy(e.target.value as YoutubePrivacy)}>
                <option value="public">Public</option><option value="unlisted">Unlisted</option><option value="private">Private</option>
              </select></label>
          </div>)}
        {platforms.includes("tiktok") && (
          <label className="field"><span>TikTok visibility</span>
            <select value={ttPrivacy} onChange={e => setTtPrivacy(e.target.value as TiktokPrivacy)}>
              <option value="PUBLIC_TO_EVERYONE">Everyone</option><option value="FOLLOWER_OF_CREATOR">Followers</option>
              <option value="MUTUAL_FOLLOW_FRIENDS">Friends</option><option value="SELF_ONLY">Only me</option>
            </select>
            <small className="muted">Until TikTok's audit passes, TikTok only allows Only me, and the post goes out that way.</small>
          </label>)}

        <div className="field">
          <span>When</span>
          <div className="segmented when-pick" role="radiogroup" aria-label="When">
            {([["now", "Post now"], ["later", "Schedule"], ["draft", "Save as draft"]] as [When, string][]).map(([v, l]) =>
              <button key={v} type="button" role="radio" aria-checked={mode === v} aria-pressed={mode === v} onClick={() => setMode(v)}>{l}</button>)}
          </div>
          {mode === "later" && (
            <div className="field-row">
              <label className="field"><span>Day</span><input type="date" value={day} min={redDeerToday()} onChange={e => setDay(e.target.value)} /></label>
              <label className="field"><span>Time (Red Deer)</span><input type="time" value={time} step={300} onChange={e => setTime(e.target.value)} /></label>
            </div>)}
          {tooSoon && <small className="error">That time has passed. Pick a later one, or Post now.</small>}
        </div>

        {mode !== "draft" && chosen.length > 0 && issues.length > 0 && <p className="error small">{issues.length === 1 ? `${PLATFORM[issues[0][0]].label} can't take this post yet` : `${issues.length} accounts can't take this post yet`}: see Check. Fix it, or untick {issues.length === 1 ? "that account" : "those accounts"}.</p>}
        <div className="actions">
          {onCancel && <button className="ghost" onClick={onCancel}>Start over</button>}
          <button className="primary" disabled={saving || uploading > 0 || blocked || linkBad || (empty && mode !== "draft")} onClick={save}>
            {saving ? "Saving…" : mode === "now" ? `Post to ${chosen.length || ""} account${chosen.length === 1 ? "" : "s"}`.replace("  ", " ") : mode === "later" ? `Schedule for ${at ? when(at.toISOString()) : ""}` : "Save draft"}
          </button>
        </div>
      </section>

      <aside className="card composer-side" aria-label="Check before posting">
        <h2>Check</h2>
        {!chosen.length ? <p className="muted small">Pick at least one account to post to.</p> : (
          <ul className="check-list">
            {platforms.map(p => {
              const text = textFor(draft, p);
              const len = lengthFor(text, p);
              const list = problemsFor(draft, p);
              return (
                <li key={p} className={list.length ? "bad" : "ok"}>
                  <div className="check-head"><Badge p={p} /> <strong>{PLATFORM[p].label}</strong>
                    <span className={len > PLATFORM[p].maxText ? "count over" : "count"}>{len.toLocaleString()} / {PLATFORM[p].maxText.toLocaleString()}</span></div>
                  {list.length ? list.map(x => <small key={x} className="block error">{x}</small>) : <small className="block muted">Ready{texts[p]?.trim() ? ", with its own wording" : ""}.</small>}
                  {PLATFORM[p].approval && <small className="block muted">{PLATFORM[p].approval}</small>}
                </li>);
            })}
          </ul>)}
        {mode === "now" && chosen.length > 0 && <p className="muted small">Goes out as soon as you press the button. Photos and videos can take a minute or two.</p>}
      </aside>
    </div>
  );
}

// ------------------------------------------------------------------ what's been posted and what's coming

type Filter = "upcoming" | "drafts" | "posted" | "problems" | "all";
const FILTERS: [Filter, string, (p: SocialPost) => boolean][] = [
  ["upcoming", "Coming up", p => p.status === "scheduled" || p.status === "publishing"],
  ["posted", "Posted", p => p.status === "published" || p.status === "partial"],
  ["problems", "To check", p => p.status === "failed" || p.status === "partial"],
  ["drafts", "Drafts", p => p.status === "draft"],
  ["all", "All", () => true]
];

function Queue({ data, edit, reload, onEdit }: { data: { posts: SocialPost[]; targets: SocialTarget[] }; edit: boolean; reload: () => void; onEdit: (p: SocialPost, copy: boolean) => void }) {
  const store = useStore();
  const toast = useToast();
  const run = useAction();
  const [filter, setFilter] = useState<Filter>("upcoming");
  const test = FILTERS.find(f => f[0] === filter)![2];
  const list = useMemo(() => {
    const out = data.posts.filter(test);
    // Coming up: soonest first. Everything else: newest first.
    return filter === "upcoming" ? [...out].sort((a, b) => (a.scheduled_at || "").localeCompare(b.scheduled_at || "")) : out;
  }, [data.posts, test, filter]);

  return (
    <>
      <div className="segmented queue-filter" role="tablist" aria-label="Show">
        {FILTERS.map(([f, l, t]) => <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}>{l} ({data.posts.filter(t).length})</button>)}
      </div>
      {!list.length ? <Empty>{filter === "upcoming" ? "Nothing scheduled. Write a post and pick a time." : "Nothing here."}</Empty> : (
        <div className="post-list">
          {list.map(p => {
            const targets = data.targets.filter(t => t.post_id === p.id);
            const tried = targets.some(t => t.attempts > 0);
            const [label, tone] = STATUS[p.status];
            return (
              <article key={p.id} className="card post">
                <header className="post-head">
                  <Pill tone={tone}>{label}</Pill>
                  <span className="muted small">{p.scheduled_at ? when(p.published_at || p.scheduled_at) : `Saved ${when(p.updated_at)}`}{p.created_by_name ? ` · ${p.created_by_name}` : ""}</span>
                </header>
                <div className="post-body">
                  {p.media[0] && (p.media[0].kind === "image" ? <img src={p.media[0].url} alt={p.media[0].alt || ""} /> : <video src={p.media[0].url} muted preload="metadata" />)}
                  <div>
                    <p>{p.body || <span className="muted">(no text)</span>}</p>
                    {p.media.length > 1 && <small className="muted">+{p.media.length - 1} more {p.media[1].kind === "video" ? "video" : "photos"}</small>}
                    {p.link_url && <small className="block"><a href={p.link_url} target="_blank" rel="noreferrer">{p.link_url}</a></small>}
                  </div>
                </div>
                {targets.length > 0 && (
                  <ul className="targets">
                    {targets.map(t => (
                      <li key={t.id}>
                        <Badge p={t.platform} />
                        <span className="target-name">{t.account_name}{!t.account_id && <small className="muted"> (disconnected)</small>}</span>
                        <TargetState t={t} />
                        {t.url && t.url !== "#" && <a className="target-act" href={t.url} target="_blank" rel="noreferrer">View</a>}
                        {edit && t.status === "failed" && t.account_id && <button className="ghost target-act" onClick={() => run(async () => { toast(await store.social.retry(t.id)); reload(); })}>Try again</button>}
                        {(t.error || t.note || t.stats) && <small className={t.status === "failed" ? "target-more error" : "target-more muted"}>{t.status === "failed" ? t.error : [t.note, statsLine(t.stats)].filter(Boolean).join(" · ")}</small>}
                      </li>))}
                  </ul>)}
                {edit && (
                  <footer className="actions">
                    {!tried && p.status !== "cancelled" && <button onClick={() => onEdit(p, false)}>Edit</button>}
                    <button className="ghost" onClick={() => onEdit(p, true)}>Copy to new post</button>
                    {p.status === "scheduled" && !tried && <button className="ghost" onClick={() => run(async () => { await store.social.cancel(p.id); reload(); }, "Cancelled. It won't go out.")}>Cancel</button>}
                    {(!tried || p.status === "cancelled" || p.status === "failed") && (
                      <button className="ghost danger-text" onClick={() => { if (confirm("Delete this post from the app? Anything already posted stays on the platforms.")) void run(async () => { await store.social.remove(p.id); reload(); }, "Deleted"); }}>Delete</button>)}
                  </footer>)}
              </article>);
          })}
        </div>)}
    </>
  );
}

function TargetState({ t }: { t: SocialTarget }) {
  if (t.status === "published") return <Pill tone="done">Posted</Pill>;
  if (t.status === "publishing") return <Pill tone="soon">Posting</Pill>;
  if (t.status === "skipped") return <Pill>Skipped</Pill>;
  if (t.status === "failed") return <Pill tone="overdue">{t.attempts < 3 && t.next_try_at ? `Retrying ${when(t.next_try_at).split(", ").pop()}` : "Failed"}</Pill>;
  return <Pill>Waiting</Pill>;
}

// ------------------------------------------------------------------ connected accounts

function Accounts({ accounts, status, edit, reload }: { accounts: SocialAccount[]; status: SocialStatus | undefined; edit: boolean; reload: () => void }) {
  const store = useStore();
  const toast = useToast();
  const run = useAction();
  const [form, setForm] = useState<Platform | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Platform | null>(null);

  async function connect(p: Platform) {
    if (PLATFORM[p].connect === "form") { setForm(form === p ? null : p); setFields({}); return; }
    setBusy(p);
    try {
      const url = await store.social.connect(p, `${window.location.href.split("#")[0]}#/social`);
      if (url) { window.location.href = url; return; }
      toast("Connected (sample)."); reload();
    } catch (e) { toast(errorText(e), true); }
    setBusy(null);
  }

  return (
    <div className="platforms">
      {PLATFORMS.map(info => {
        const mine = accounts.filter(a => a.platform === info.id);
        const ready = status?.platforms?.[info.id] ?? false;
        return (
          <section key={info.id} className="card platform">
            <header className="platform-head"><Badge p={info.id} /><h2>{info.label}</h2></header>
            {mine.map(a => (
              <div key={a.id} className="account">
                {a.avatar_url ? <img src={a.avatar_url} alt="" width="36" height="36" /> : <span className="avatar" aria-hidden="true">{a.name.slice(0, 1)}</span>}
                <div>
                  <strong>{a.profile_url ? <a href={a.profile_url} target="_blank" rel="noreferrer">{a.name}</a> : a.name}</strong>
                  {a.handle && <small className="muted block">{a.handle.startsWith("@") ? a.handle : `@${a.handle}`}</small>}
                  {a.status === "needs_reconnect"
                    ? <small className="block error">Needs connecting again{a.last_error ? `: ${a.last_error}` : ""}</small>
                    : <small className="muted block">Connected {shortDate(a.connected_at)}{a.token_expires_at && Date.parse(a.token_expires_at) - Date.now() < 30 * 86400e3 ? ` · connect again before ${shortDate(a.token_expires_at)}` : ""}</small>}
                </div>
                {edit && <button className="ghost" onClick={() => { if (confirm(`Disconnect ${a.name}? Scheduled posts to it won't go out.`)) void run(async () => { await store.social.disconnect(a.id); reload(); }, "Disconnected"); }}>Disconnect</button>}
              </div>))}
            <p className="muted small">{blurb(info.id)}</p>
            {info.approval && <p className="small approval">{info.approval}</p>}
            {status && !ready && <p className="small error">Not set up on the server yet. Steps: <code>docs/social-media.md</code>.</p>}
            {edit && (status ? ready : false) && (
              <button className={mine.length ? "" : "primary"} disabled={busy === info.id} onClick={() => void connect(info.id)}>
                {busy === info.id ? "Opening…" : mine.length ? (info.id === "facebook" ? "Connect another Page" : "Connect another") : `Connect ${info.label}`}
              </button>)}
            {form === info.id && (
              <form className="form connect-form" onSubmit={e => { e.preventDefault(); void run(async () => { toast(await store.social.connectForm(info.id, fields)); setForm(null); reload(); }); }}>
                {info.id === "bluesky" ? (
                  <>
                    <label><span>Handle</span><input required autoComplete="off" value={fields.handle || ""} onChange={e => setFields({ ...fields, handle: e.target.value })} placeholder="reddeerreavers.bsky.social" /></label>
                    <label><span>App password</span><input required type="password" autoComplete="off" value={fields.password || ""} onChange={e => setFields({ ...fields, password: e.target.value })} placeholder="xxxx-xxxx-xxxx-xxxx" />
                      <small className="muted">Bluesky → Settings → Privacy and security → App passwords → Add. Not the account password.</small></label>
                  </>) : (
                  <label><span>Webhook address</span><input required type="url" autoComplete="off" value={fields.webhook || ""} onChange={e => setFields({ ...fields, webhook: e.target.value })} placeholder="https://discord.com/api/webhooks/…" />
                    <small className="muted">In Discord: Edit Channel → Integrations → Webhooks → New Webhook → Copy Webhook URL.</small></label>)}
                <div className="actions"><button type="button" className="ghost" onClick={() => setForm(null)}>Cancel</button><button className="primary">Connect</button></div>
              </form>)}
          </section>);
      })}
    </div>
  );
}

const blurb = (p: Platform) => ({
  facebook: "Posts to the club's Facebook Page: text, links, up to 10 photos, or a video. Sign in with a Facebook account that's an admin of the Page.",
  instagram: "Posts photos, carousels and Reels to an Instagram professional (Business or Creator) account. Instagram doesn't allow text-only posts.",
  youtube: "Uploads videos to the club's channel, with a title and visibility.",
  tiktok: "Posts videos (up to 64 MB) to the club's TikTok.",
  x: "Posts text and up to 4 photos.",
  bluesky: "Posts text, links and up to 4 photos. Works straight away: no developer app or approval needed.",
  discord: "Posts announcements to a channel in the club's Discord, with photos and videos. Works straight away."
})[p];
