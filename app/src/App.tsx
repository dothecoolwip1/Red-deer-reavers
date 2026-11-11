import { useEffect, useMemo, useState } from "react";
import { HashRouter, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { demoStore } from "./data/demo";
import { SITE_URL } from "./data/config";
import { isMissingSetup, liveSession, liveStore, supabase } from "./data/supabase";
import type { Session, Store } from "./data/types";
import { can, type Action } from "./lib/roles";
import { StoreProvider, ToastHost, errorText } from "./ui";
import { Dashboard } from "./pages/Dashboard";
import { Ledger } from "./pages/Ledger";
import { Claims } from "./pages/Claims";
import { Budgets } from "./pages/Budgets";
import { Pay } from "./pages/Pay";
import { Buy } from "./pages/Buy";
import { Sales } from "./pages/Sales";
import { Dues } from "./pages/Dues";
import { Sponsors } from "./pages/Sponsors";
import { Grants } from "./pages/Grants";
import { Compliance } from "./pages/Compliance";
import { Gear } from "./pages/Gear";
import { Waivers } from "./pages/Waivers";
import { Incidents } from "./pages/Incidents";
import { SiteEditor } from "./pages/SiteEditor";
import { Calendar } from "./pages/website/Calendar";
import { TeamPage } from "./pages/website/TeamPage";
import { Practices } from "./pages/website/Practices";
import { Inquiries } from "./pages/website/Inquiries";
import { Promo } from "./pages/website/Promo";
import { SiteSettings } from "./pages/website/SiteSettings";
import { Attendance } from "./pages/Attendance";
import { PageAccess } from "./pages/PageAccess";
import { FighterProfiles } from "./pages/FighterProfiles";
import type { PageId } from "./lib/pages";

/** need: a role action, or a staff page whose access an admin can change per person (see lib/pages.ts). */
type Nav = { path: string; label: string; need: Action | { page: PageId }; element: JSX.Element; group: string };
const NAV: Nav[] = [
  { path: "/", label: "Home", need: "self.use", element: <Dashboard />, group: "" },
  { path: "/attendance", label: "Attendance", need: { page: "attendance" }, element: <Attendance />, group: "Team" },
  { path: "/fighters", label: "Fighter profiles", need: "self.use", element: <FighterProfiles />, group: "Team" },
  { path: "/access", label: "Page access", need: "access.manage", element: <PageAccess />, group: "Team" },
  { path: "/ledger", label: "Ledger", need: { page: "ledger" }, element: <Ledger />, group: "Money" },
  { path: "/claims", label: "Reimbursements", need: "self.use", element: <Claims />, group: "Money" },
  { path: "/budget", label: "Budget", need: { page: "budget" }, element: <Budgets />, group: "Money" },
  { path: "/pay", label: "Pay the club", need: "self.use", element: <Pay />, group: "Money" },
  { path: "/sales", label: "Square sales", need: { page: "sales" }, element: <Sales />, group: "Money" },
  { path: "/dues", label: "Dues", need: { page: "dues" }, element: <Dues />, group: "Money" },
  { path: "/sponsors", label: "Sponsors", need: { page: "sponsors" }, element: <Sponsors />, group: "Growth" },
  { path: "/grants", label: "Grants", need: { page: "grants" }, element: <Grants />, group: "Growth" },
  { path: "/waivers", label: "Waiver", need: "self.use", element: <Waivers />, group: "Safety" },
  { path: "/incidents", label: "Incidents", need: "self.use", element: <Incidents />, group: "Safety" },
  { path: "/gear", label: "Armory", need: { page: "gear" }, element: <Gear />, group: "Safety" },
  { path: "/compliance", label: "Deadlines", need: { page: "compliance" }, element: <Compliance />, group: "Society" },
  { path: "/calendar", label: "Calendar", need: { page: "calendar" }, element: <Calendar />, group: "Website" },
  { path: "/team", label: "Team page", need: { page: "team" }, element: <TeamPage />, group: "Website" },
  { path: "/practices", label: "Practices", need: { page: "practices" }, element: <Practices />, group: "Website" },
  { path: "/inquiries", label: "Inquiries", need: { page: "inquiries" }, element: <Inquiries />, group: "Website" },
  { path: "/site", label: "Site editor", need: { page: "site" }, element: <SiteEditor />, group: "Website" },
  { path: "/qr", label: "QR codes", need: { page: "qr" }, element: <Promo />, group: "Website" },
  { path: "/site-settings", label: "Site settings", need: { page: "site-settings" }, element: <SiteSettings />, group: "Website" }
];

type Gate =
  | { kind: "loading" }
  | { kind: "signed-out"; note?: string }
  | { kind: "not-member"; session: Session }
  | { kind: "ready"; store: Store; note?: string };

const isOpenPayPage = () => /^#\/buy(\?|$)/.test(window.location.hash);

export function App() {
  const [open, setOpen] = useState(isOpenPayPage);
  useEffect(() => {
    const onHash = () => setOpen(isOpenPayPage());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  // The open pay page needs no sign-in, so it skips the gate entirely.
  return open ? <ToastHost><Buy /></ToastHost> : <SignedInApp />;
}

function SignedInApp() {
  const [gate, setGate] = useState<Gate>({ kind: "loading" });

  async function check() {
    try {
      const session = await liveSession();
      if (!session) return setGate({ kind: "signed-out" });
      if (session.role === "none") return setGate({ kind: "not-member", session });
      setGate({ kind: "ready", store: liveStore(session) });
    } catch (e) {
      if (isMissingSetup(e)) setGate({ kind: "ready", store: demoStore(), note: "The app's database tables aren't set up yet, so you're looking at sample data. Nothing you do here is saved to the club's records." });
      else setGate({ kind: "signed-out", note: errorText(e) });
    }
  }

  useEffect(() => {
    void check();
    const { data } = supabase().auth.onAuthStateChange(event => { if (event === "SIGNED_IN" || event === "SIGNED_OUT") void check(); });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <ToastHost>
      {gate.kind === "loading" && <div className="center"><p className="muted">Opening the hall…</p></div>}
      {gate.kind === "signed-out" && <SignIn note={gate.note} onDemo={() => setGate({ kind: "ready", store: demoStore(), note: "Demo mode: sample data stored only in this browser." })} />}
      {gate.kind === "not-member" && <NotMember session={gate.session} />}
      {gate.kind === "ready" && <Shell store={gate.store} note={gate.note} onExit={async () => { await gate.store.signOut(); setGate({ kind: "signed-out" }); }} />}
    </ToastHost>
  );
}

function Shell({ store, note, onExit }: { store: Store; note?: string; onExit: () => void }) {
  const nav = useMemo(() => NAV.filter(n => typeof n.need === "string" ? can(store.session.role, n.need) : store.session.pages[n.need.page] > 0), [store]);
  const [menu, setMenu] = useState(false);
  const groups = [...new Set(nav.map(n => n.group))];
  return (
    <StoreProvider value={store}>
      <HashRouter>
        <div className="shell">
          <header className="top">
            <button className="ghost menu-button" onClick={() => setMenu(m => !m)} aria-expanded={menu} aria-controls="nav">☰</button>
            <a className="brand" href={SITE_URL}><img src={`${import.meta.env.BASE_URL}crest.png`} alt="" width="28" height="28" /> Reavers</a>
            <span className="who">{store.session.name} · {store.session.role === "finance" ? "Treasury" : store.session.role === "exec" ? "Executive" : "Member"}{store.session.mode === "demo" && " · demo"}</span>
            <button className="ghost" onClick={onExit}>{store.session.mode === "demo" ? "Leave demo" : "Sign out"}</button>
          </header>
          <SideNav nav={nav} groups={groups} open={menu} onPick={() => setMenu(false)} />
          <main>
            {note && <p className="banner">{note}</p>}
            <Routes>
              {nav.map(n => <Route key={n.path} path={n.path} element={n.element} />)}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </StoreProvider>
  );
}

/** The side menu. Each section's heading is a clear label, and the section holding the open page is marked. */
function SideNav({ nav, groups, open, onPick }: { nav: Nav[]; groups: string[]; open: boolean; onPick: () => void }) {
  const { pathname } = useLocation();
  const current = nav.find(n => n.path === pathname)?.group ?? "";
  return (
    <nav id="nav" className={open ? "side open" : "side"} onClick={onPick} aria-label="Sections">
      {groups.map(g => (
        <div key={g || "home"} className={g && g === current ? "nav-group current" : "nav-group"}>
          {g && <h3 aria-current={g === current ? "true" : undefined}>{g}</h3>}
          {nav.filter(n => n.group === g).map(n => <NavLink key={n.path} to={n.path} end>{n.label}</NavLink>)}
        </div>))}
    </nav>
  );
}

function SignIn({ note, onDemo }: { note?: string; onDemo: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(note || "");
  const [busy, setBusy] = useState(false);
  const redirectTo = window.location.href.split("#")[0];
  const oauth = (provider: "google" | "discord") => supabase().auth.signInWithOAuth({ provider, options: { redirectTo } });
  return (
    <div className="center">
      <div className="signin card">
        <img src={`${import.meta.env.BASE_URL}crest.png`} alt="" width="64" height="64" />
        <h1>Reavers app</h1>
        <p>The club's back office: money, sponsors, gear, waivers, deadlines and the website. Sign in with your BuhurtOS account, the same one you use for the members area.</p>
        <button className="primary wide" onClick={() => oauth("google")}>Continue with Google</button>
        <button className="wide" onClick={() => oauth("discord")}>Continue with Discord</button>
        <form className="form" onSubmit={async e => {
          e.preventDefault();
          setBusy(true);
          const { error } = await supabase().auth.signInWithPassword({ email, password });
          setBusy(false);
          setMessage(error ? error.message : "");
        }}>
          <label><span>Email</span><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
          <label><span>Password</span><input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
          <button className="wide" disabled={busy}>{busy ? "Signing in…" : "Sign in with email"}</button>
        </form>
        {message && <p className="error" role="alert">{message}</p>}
        <p className="muted small">No account yet? <a href={`${SITE_URL}members.html`}>Join through the members area</a>.</p>
        <button className="ghost" onClick={onDemo}>Look around with sample data</button>
      </div>
    </div>
  );
}

function NotMember({ session }: { session: Session }) {
  return (
    <div className="center">
      <div className="signin card">
        <h1>Not on the Reavers roster yet</h1>
        <p>{session.email} is signed in, but this account isn't a Red Deer Reavers member. Ask to join the team on BuhurtOS, or apply in the members area.</p>
        <a className="button primary" href={`${SITE_URL}members.html`}>Members area</a>
        <button className="ghost" onClick={() => supabase().auth.signOut()}>Sign out</button>
      </div>
    </div>
  );
}
