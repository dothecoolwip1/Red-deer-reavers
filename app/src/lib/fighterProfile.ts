// The Reavers extras on a fighter's profile (reavers_app_fighter_profiles). BuhurtOS keeps the photo, disciplines, bio and
// the fight record; these are what the club adds for reddeerreavers.com and sponsors. Limits match the migration.

export type FighterProfile = {
  fighter_id: string;
  show_on_site: boolean;
  nickname: string | null;
  weight_class: string | null;
  team_role: string | null;
  tagline: string | null;
  about: string | null;
  photo_url: string | null;
  video_url: string | null;
  sponsors: string | null;
  open_to_sponsors: boolean;
  updated_at?: string;
};

export const LIMITS = { nickname: 40, weight_class: 40, team_role: 60, tagline: 140, about: 1500, sponsors: 300 } as const;
type TextKey = keyof typeof LIMITS;
const LABELS: Record<TextKey | "photo_url" | "video_url", string> = {
  nickname: "Nickname", weight_class: "Weight class", team_role: "Team role", tagline: "Motto", about: "About",
  sponsors: "Sponsors", photo_url: "Action photo", video_url: "Highlight video"
};

/** Suggestions only: people can type anything. */
export const WEIGHT_CLASSES = ["Lightweight", "Middleweight", "Heavyweight", "Super heavyweight", "Open weight"];
export const TEAM_ROLES = ["Captain", "Line fighter", "Polearm", "Grappler", "Duelist", "Reserve", "Squire", "Coach"];

export const blankProfile = (fighterId: string): FighterProfile => ({
  fighter_id: fighterId, show_on_site: false, nickname: null, weight_class: null, team_role: null, tagline: null, about: null,
  photo_url: null, video_url: null, sponsors: null, open_to_sponsors: false
});

const text = (v: unknown) => {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return s ? s : null;
};
const paragraphs = (v: unknown) => {
  const s = String(v ?? "").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return s ? s : null;
};

/** Adds https:// when it's left off. Returns undefined when the value isn't a web address. */
export function webAddress(v: unknown): string | null | undefined {
  let s = String(v ?? "").trim();
  if (!s) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s) && /^[\w-]+(\.[\w-]+)+(\/|$)/.test(s)) s = `https://${s}`;
  if (/^http:\/\//i.test(s)) s = s.replace(/^http:/i, "https:");
  if (!/^https:\/\/[^\s/]+\.[^\s]+$/i.test(s) || s.length > 2000) return undefined;
  return s;
}

/**
 * Tidies what was typed and checks it against the database's limits. Returns the row to save, or the problems in words.
 * allowDataPhoto: sample mode keeps uploaded pictures in the browser as data: addresses.
 */
export function cleanProfile(input: Partial<FighterProfile> & { fighter_id: string }, allowDataPhoto = false):
  { profile: FighterProfile } | { errors: string[] } {
  const errors: string[] = [];
  const out = blankProfile(input.fighter_id);
  for (const key of Object.keys(LIMITS) as TextKey[]) {
    const v = key === "about" ? paragraphs(input[key]) : text(input[key]);
    if (v && v.length > LIMITS[key]) errors.push(`${LABELS[key]} can be at most ${LIMITS[key]} characters (it's ${v.length}).`);
    out[key] = v;
  }
  const photo = String(input.photo_url ?? "").trim();
  if (!photo) out.photo_url = null;
  else if (allowDataPhoto && /^data:image\//.test(photo)) out.photo_url = photo;
  else if (/^\/(?!\/)\S*$/.test(photo)) out.photo_url = photo;
  else {
    const url = webAddress(photo);
    if (url === undefined) errors.push(`${LABELS.photo_url} must be an https:// web address.`);
    else out.photo_url = url;
  }
  const video = webAddress(input.video_url);
  if (video === undefined) errors.push(`${LABELS.video_url} must be a web address, like a YouTube or Instagram link.`);
  else out.video_url = video;
  out.show_on_site = Boolean(input.show_on_site);
  out.open_to_sponsors = Boolean(input.open_to_sponsors);
  return errors.length ? { errors } : { profile: out };
}

/** What a fighter still hasn't filled in, so the app can nudge them. */
export function missing(p: FighterProfile | null | undefined): string[] {
  if (!p) return ["weight class", "team role", "action photo", "motto"];
  return [
    !p.weight_class && "weight class",
    !p.team_role && "team role",
    !p.photo_url && "action photo",
    !p.tagline && "motto"
  ].filter(Boolean) as string[];
}

/** The sponsors written as a list ("Iron Works, Gaetz Gym"). */
export const sponsorList = (s: string | null | undefined) =>
  String(s || "").split(/\s*(?:,|;|\n)\s*/).map(x => x.trim()).filter(Boolean);
