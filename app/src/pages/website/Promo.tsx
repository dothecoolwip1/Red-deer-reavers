import { useMemo } from "react";
import { siteOrigin } from "../../data/config";
import { Page, errorText, useToast } from "../../ui";

// Generated on every site build (scripts/build-site.mjs), so they always point at the live pages.
const CODES = [
  { file: "home", title: "Reavers website", note: "Main team website", download: "reavers-website-qr.svg" },
  { file: "join", title: "Join the team", note: "Training and newcomer page", download: "reavers-join-qr.svg" },
  { file: "community", title: "Book the Reavers", note: "Community inquiry form", download: "reavers-community-qr.svg" },
  { file: "events", title: "Events", note: "Upcoming public schedule", download: "reavers-events-qr.svg" }
];

export function Promo() {
  const toast = useToast();
  const origin = useMemo(siteOrigin, []);
  const src = (file: string) => `${origin}/assets/generated/qr/${file}.svg`;
  async function save(file: string, name: string) {
    try {
      const response = await fetch(src(file));
      if (!response.ok) throw new Error(`Could not download the QR code (${response.status})`);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(await response.blob());
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) {
      toast(errorText(e), true);
    }
  }
  return (
    <Page title="QR codes" intro="For posters, tables at demos and flyers. They're rebuilt with the website every time it's published, so they always point at the live pages."
      actions={<button className="primary" onClick={() => window.print()}>Print sheet</button>}>
      <div className="qr-grid">
        {CODES.map(c => (
          <article key={c.file} className="card qr">
            <img src={src(c.file)} alt={`QR code: ${c.title}`} width="220" height="220" />
            <div>
              <strong>{c.title}</strong>
              <small className="muted block">{c.note}</small>
            </div>
            <button className="no-print" onClick={() => void save(c.file, c.download)}>Download SVG</button>
          </article>))}
      </div>
    </Page>
  );
}
