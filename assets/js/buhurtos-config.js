// Members area: the Red Deer Reavers website signs in to the SAME BuhurtOS account system (Supabase project "BuhurtOS").
// BuhurtOS is served from its own address; both sites sign in to the same BuhurtOS account system.
// These values are public by design: the URL and publishable key only identify the project. Every permission is enforced by the
// BuhurtOS database (row-level security and checked database functions), never by this website.
window.BUHURTOS = {
  supabaseUrl: 'https://mvbxlebznlgroptwwdsm.supabase.co',
  publishableKey: 'sb_publishable_u76M-dggKSsdsyhUQKveJg_5fPJ5Nan',
  appUrl: 'https://buhurt-os.vercel.app',   // BuhurtOS has its own Vercel project; both sites sign in to the same BuhurtOS account system
  teamSlug: 'red-deer-reavers',
  // The Red Deer Reavers bylaws (PDF in the club's Google Drive), linked from the sign-up and join screens.
  bylawsUrl: 'https://drive.google.com/file/d/1R9EDu7BpUZ1KM790BDNN0iIaXZYtUtCE/view?usp=drivesdk',
  // The club's Discord server (members hub: quick link on Home, button under Club › Executive and contact).
  discordInvite: 'https://discord.gg/9855ZUE56',
  // More club documents for Club › Documents: { title, href, note (optional), quick: true to also show it in the Home quick links }.
  documents: []
};
