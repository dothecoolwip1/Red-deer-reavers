import { useState } from "react";
import { Empty, Loading, Page, Pill, dateLabel, useAction, useCan, useStore, useTable } from "../ui";

const WAIVER_TEXT = [
  "Buhurt is full-contact armoured combat with steel weapons. I understand it carries a real risk of injury, including concussion, broken bones and, rarely, serious injury.",
  "I will wear armour that meets the rules in force, follow the marshals and coaches, and stop when told.",
  "I will tell the coach about any injury or condition that affects my safety, and I will not fight while impaired.",
  "I accept these risks voluntarily and release the Red Deer Reavers society, its directors, coaches and volunteers from claims arising from ordinary participation, to the extent the law allows.",
  "In an emergency, the club may share the information below with first responders."
];

export function Waivers() {
  const store = useStore();
  const run = useAction();
  const exec = useCan("records.view");
  const { rows, reload } = useTable("waivers");
  const season = new Date().getFullYear();
  const mine = (rows || []).find(w => w.season === season && w.user_id === store.session.userId);
  const [form, setForm] = useState({ full_name: store.session.name, signed_name: "", is_minor: false, guardian_name: "", emergency_contact: "", emergency_phone: "", medical_notes: "" });
  const [error, setError] = useState("");
  const set = (k: keyof typeof form, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));
  const thisSeason = (rows || []).filter(w => w.season === season);

  return (
    <Page title={`Season ${season} waiver`} intro="Every fighter signs once a season before sparring. Medical notes are seen only by you and the executive.">
      {!rows ? <Loading /> : mine ? (
        <article className="card"><p><Pill tone="done">Signed</Pill> {mine.full_name} signed on {dateLabel(mine.signed_at)}.</p></article>
      ) : (
        <form className="form card" onSubmit={async e => {
          e.preventDefault();
          if (!form.is_minor && form.signed_name.trim().toLowerCase() !== form.full_name.trim().toLowerCase()) return setError("Type your full name exactly as above to sign.");
          if (form.is_minor && !form.guardian_name.trim()) return setError("A parent or guardian must sign for a fighter under 18.");
          if (!form.emergency_contact.trim() || !form.emergency_phone.trim()) return setError("Add an emergency contact and phone number.");
          setError("");
          if (await run(() => store.insert("waivers", { ...form, season, user_id: store.session.userId, guardian_name: form.guardian_name || null, medical_notes: form.medical_notes || null }), "Waiver signed. See you on the field.")) await reload();
        }}>
          <ol className="waiver">{WAIVER_TEXT.map(t => <li key={t}>{t}</li>)}</ol>
          <div className="grid">
            <label><span>Fighter's full name *</span><input value={form.full_name} onChange={e => set("full_name", e.target.value)} required /></label>
            <label className="check"><input type="checkbox" checked={form.is_minor} onChange={e => set("is_minor", e.target.checked)} /> Fighter is under 18</label>
            {form.is_minor && <label><span>Parent or guardian name *</span><input value={form.guardian_name} onChange={e => set("guardian_name", e.target.value)} /></label>}
            <label><span>Emergency contact *</span><input value={form.emergency_contact} onChange={e => set("emergency_contact", e.target.value)} /></label>
            <label><span>Emergency phone *</span><input type="tel" value={form.emergency_phone} onChange={e => set("emergency_phone", e.target.value)} /></label>
            <label className="wide"><span>Allergies, conditions or medication the first-aider should know</span><textarea rows={2} value={form.medical_notes} onChange={e => set("medical_notes", e.target.value)} /></label>
            <label className="wide"><span>{form.is_minor ? "Guardian signature: type the guardian's full name *" : "Signature: type your full name *"}</span>
              <input className="signature" value={form.signed_name} onChange={e => set("signed_name", e.target.value)} required /></label>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="form-actions"><button className="primary">Sign waiver</button></div>
        </form>
      )}
      {exec && rows && (
        <>
          <h2>Signed this season ({thisSeason.length})</h2>
          {thisSeason.length === 0 ? <Empty>Nobody has signed yet.</Empty> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Fighter</th><th>Signed</th><th>Emergency contact</th><th>Medical</th><th aria-label="Actions" /></tr></thead>
                <tbody>{thisSeason.map(w => (
                  <tr key={w.id}>
                    <td data-label="Fighter">{w.full_name}{w.is_minor && <small className="muted block">minor, guardian {w.guardian_name}</small>}</td>
                    <td data-label="Signed">{dateLabel(w.signed_at)}</td>
                    <td data-label="Emergency">{w.emergency_contact} {w.emergency_phone}</td>
                    <td data-label="Medical">{w.medical_notes || <span className="muted">none</span>}</td>
                    <td className="row-actions"><button className="ghost" onClick={() => { if (confirm("Remove this waiver so it is signed again?")) void run(() => store.remove("waivers", w.id), "Removed").then(reload); }}>Remove</button></td>
                  </tr>))}</tbody>
              </table>
            </div>)}
        </>)}
    </Page>
  );
}
