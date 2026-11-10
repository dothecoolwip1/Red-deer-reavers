import type { SiteSettings as Settings } from "../../data/website";
import { Page, RecordForm } from "../../ui";
import { CaptainOnly, useSite } from "./shared";

export function SiteSettings() {
  const { data, failed, act } = useSite();
  return (
    <Page title="Site settings" intro="The season, name, area and contact email the public website shows in its header, footer and contact sections.">
      <CaptainOnly data={data} failed={failed}>{d => (
        <div className="card narrow">
          <RecordForm
            key={JSON.stringify(d.settings)}
            fields={[
              { key: "season", label: "Season", hint: "e.g. 2026" },
              { key: "organization", label: "Organization" },
              { key: "location", label: "Location", hint: "e.g. Central Alberta" },
              { key: "contact_email", label: "Contact email", type: "email" }
            ]}
            initial={d.settings}
            submitLabel="Save settings"
            onSubmit={async values => { await act({ action: "settings_save", item: values as Settings }, "Settings saved"); }}
          />
        </div>)}
      </CaptainOnly>
    </Page>
  );
}
