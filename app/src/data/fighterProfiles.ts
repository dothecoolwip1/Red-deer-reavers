import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_MEDIA_BUCKET } from "./config";
import type { FighterProfile } from "../lib/fighterProfile";

// Reavers fighter profiles (reavers_app_fighter_profiles, migration 20261111020000). A fighter edits their own; anyone
// who can use the Team page edits any. The public site reads only the ones turned on (fighter.js, app.js).

export type MyFighter = { fighter_id: string; name: string };

export interface FighterProfilesApi {
  /** The BuhurtOS fighter profiles linked to the signed-in account. */
  mine(): Promise<MyFighter[]>;
  /** Every profile this person can read: their own, or all of them with the Team page. */
  list(): Promise<FighterProfile[]>;
  save(profile: FighterProfile): Promise<void>;
  /** Uploads an action photo for this fighter and returns its public address. */
  uploadPhoto(fighterId: string, file: File): Promise<string>;
  /** True in sample mode, where uploaded pictures stay in the browser. */
  sample: boolean;
}

const COLUMNS = "fighter_id,show_on_site,nickname,weight_class,team_role,tagline,about,photo_url,video_url,sponsors,open_to_sponsors,updated_at";

function check<T>(r: { data: T; error: { message: string; code?: string } | null }): T {
  if (r.error) throw Object.assign(new Error(r.error.message), { code: r.error.code });
  return r.data;
}

export function liveFighterProfiles(sb: () => SupabaseClient): FighterProfilesApi {
  const table = () => sb().from("reavers_app_fighter_profiles");
  return {
    sample: false,
    async mine() { return (check(await sb().rpc("reavers_app_my_fighters")) || []) as MyFighter[]; },
    async list() { return (check(await table().select(COLUMNS).limit(1000)) || []) as FighterProfile[]; },
    async save(profile) {
      const { updated_at: _skip, ...row } = profile;
      check(await table().upsert(row, { onConflict: "fighter_id" }));
    },
    async uploadPhoto(fighterId, file) {
      const safe = file.name.replace(/[^\w.-]+/g, "-").slice(-60);
      const path = `fighters/${fighterId.toLowerCase()}/${Date.now()}-${safe}`;
      const { error } = await sb().storage.from(SITE_MEDIA_BUCKET).upload(path, file, { contentType: file.type });
      if (error) throw new Error(error.message);
      return sb().storage.from(SITE_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
    }
  };
}

const DEMO_KEY = "reavers-app-fighter-profiles-demo-v1";
/** The first sample fighter (see demoWebsite) is "you" in sample mode. */
export const DEMO_ME = "f0000000-0000-4000-8000-000000000001";

export function demoFighterProfiles(): FighterProfilesApi {
  let rows: FighterProfile[] = [
    {
      fighter_id: DEMO_ME, show_on_site: true, nickname: "The Anvil", weight_class: "Heavyweight", team_role: "Captain",
      tagline: "Hold the line, then break it.", about: null, photo_url: null, video_url: "https://www.youtube.com/@RedDeerReavers",
      sponsors: "Prairie Iron Works (sample)", open_to_sponsors: true, updated_at: new Date().toISOString()
    },
    {
      fighter_id: "f0000000-0000-4000-8000-000000000003", show_on_site: false, nickname: null, weight_class: "Middleweight",
      team_role: "Polearm", tagline: null, about: null, photo_url: null, video_url: null, sponsors: null, open_to_sponsors: false
    }
  ];
  try { const saved = localStorage.getItem(DEMO_KEY); if (saved) rows = JSON.parse(saved); } catch { /* sample data only */ }
  const persist = () => { try { localStorage.setItem(DEMO_KEY, JSON.stringify(rows)); } catch { /* ignore */ } };
  return {
    sample: true,
    async mine() { return [{ fighter_id: DEMO_ME, name: "Garrett (sample)" }]; },
    async list() { return structuredClone(rows); },
    async save(profile) {
      rows = [...rows.filter(r => r.fighter_id !== profile.fighter_id), { ...profile, updated_at: new Date().toISOString() }];
      persist();
    },
    async uploadPhoto(_id, file) {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read the image"));
        reader.readAsDataURL(file);
      });
    }
  };
}
