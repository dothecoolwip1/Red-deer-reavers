export default function Concept() {
  return (<div className="prose">
    <h1>The idea, reinvented</h1>
    <p>The first prototype asked "what records does a nonprofit keep?" and answered with 25 sections. That's a filing cabinet. This one asks "what does a Reaver open on a Tuesday night?" and builds from there.</p>
    <h2>Seven nouns, not twenty-five modules</h2>
    <ul><li><b>Happenings.</b> Practices, events, meetings, deadlines. One timeline. Everything else attaches to a happening.</li>
      <li><b>People.</b> One directory. Member, volunteer, sponsor contact, venue, journalist: those are tags, not separate lists. Emergency contacts show only to coaches and executive.</li>
      <li><b>Funding.</b> Sponsors, grants and fundraisers are all an <i>ask</i>: Idea → Working → Asked → Won → Owed → Done. "Owed" is the part spreadsheets lose: a report due to the funder, a logo we promised, a renewal call.</li>
      <li><b>Money.</b> One ledger. Every line has a source and, where it makes sense, a happening. A reimbursement is three questions and a photo; it becomes a ledger line the moment the treasurer taps Paid.</li>
      <li><b>Files.</b> The same ten numbered folders as the club's Google Drive (Society Documents, Financials, … Insurance, Social Media), so nothing has to be relearned. On top of that, a file can be attached to the record it proves: open the expense and the receipt is there; open the meeting and the minutes are there.</li>
      <li><b>Stories.</b> Comms isn't a composer. It's "something happened, let's tell it", shaped per platform by an adapter that knows that platform's rules. Sponsor exposure and the annual report fall out of stories for free.</li>
      <li><b>Programs.</b> The club's longer plans (youth, beginners, recruitment): goals, milestones, budget, funding and the work left. They sit on their own page and open as a workbench like everything else.</li>
      <li><b>Reports.</b> Membership, volunteer hours, attendance, financial summary, fundraising results, a funder's grant report, sponsor value: each assembled live from the records. <b>The year</b> is the same idea across the whole year.</li>
      <li><b>Gear & safety.</b> What we own, who has it, what broke, what went wrong. A waiver gate lives in the checkout button.</li></ul>
    <h2>Two screens do most of the work</h2>
    <p><b>Today</b> is different for each person: the treasurer sees money, the coach sees check-ins and broken helmets, a new member sees only her dues, waiver and next practice. <b>Inbox</b> holds every decision waiting on you, from every part of the club, with the action right there. Act in the inbox and the record updates itself.</p>
    <h2>Every record is the same shape</h2>
    <p>Open a practice, a grant, a sponsor or an event and you get the same workbench: who's involved, every dollar, every file, how it was told online, gear, to-dos. Learn it once.</p>
    <h2>What got merged</h2>
    <ul><li>Members + Volunteers + Contacts → People</li><li>Sponsors + Grants + Fundraising + Grant Builder → Funding (the answer library lives inside a grant)</li><li>Practices + Events + Meetings + AGM + Compliance + Programs → Happenings</li><li>Social hub + Composer + Calendar + Analytics + Campaigns + Exposure + Accounts + Media → Stories</li><li>Finance + Expenses + Receipts → Money</li><li>Equipment + Safety → Gear & safety</li><li>Reports + Annual report → Reports (nine live reports) and The year</li><li>Tasks, Compliance, Approvals → Inbox</li><li>Settings/roles → the persona switcher at the top</li></ul>
    <h2>Still fake</h2>
    <p>All data is fictional and lives in memory. Publishing, OAuth, uploads, payments and votes are simulated. No backend, database, auth or social account was touched. Social numbers are invented but shaped like each platform's real metrics.</p>
    <h2>If this is the direction, build in this order</h2>
    <ol><li>People + personas (on the existing Supabase auth)</li><li>Happenings + the workbench</li><li>Inbox + Money (reimbursements are the first real win)</li><li>Funding pipeline</li><li>Files</li><li>Stories with manual "mark as posted", then one platform adapter at a time once approved by Meta / TikTok / Google</li></ol>
  </div>)
}
