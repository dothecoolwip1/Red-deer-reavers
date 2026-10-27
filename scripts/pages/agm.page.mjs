import { head, header, footer, dock, scripts, icon, rule } from "./partials.mjs";

export const file = "agm.html";
export default () => `${head({
  title: "AGM 2026 | Red Deer Reavers",
  description: "The Red Deer Reavers 2026 Annual General Meeting was held on October 18, 2026. What an AGM is, society documents, and a form to send topics for the next meeting.",
  page: "agm",
  ogImage: 14,
  extra: `\n  <link rel="stylesheet" href="assets/members.css?v=28">`
})}${header("members", { solid: true, cta: ["members.html", "Members"] })}
<main id="content" class="members-page">
  <section class="section-tight members-hero">
    <div class="shell">
      <p class="eyebrow solo">Red Deer Reavers Guild</p>
      <h1 class="members-title">2026 Annual General Meeting</h1>
      <p class="lede">The 2026 AGM was held on <strong>Sunday, October 18</strong>, with voting by paper ballot at the meeting. Thank you to every member who came out and had their say. Questions and topics for the next meeting are welcome any time, below.</p>
    </div>
  </section>
  <section class="section parchment members-sheet">
    <div class="shell members">
      <div class="card-panel">
        <h2>Meeting held</h2>
        <dl class="facts agm-facts">
          <dt>Date</dt><dd>Sunday, October 18, 2026</dd>
          <dt>Voting</dt><dd>Paper ballot at the meeting</dd>
          <dt>Records</dt><dd>Minutes and society documents are kept in the Reavers Drive</dd>
        </dl>
        <div class="row-btns" style="margin-top:14px"><a class="btn-rdr" href="#documents">Society documents</a><a class="btn-line" href="#submit">Send a topic</a></div>
      </div>

      <h2 class="agm-h">What is an AGM?</h2>
      <p>The Annual General Meeting is the main yearly business meeting for the Red Deer Reavers Guild. It gives members a chance to review how the society is doing, elect leadership, review finances, raise issues and help decide where the team goes next.</p>
      <div class="agm-cards">
        <div class="card-panel"><h3>Finances</h3><p>Review the annual financial audit, income, expenses and current balance.</p></div>
        <div class="card-panel"><h3>Elections &amp; voting</h3><p>Elect executive officers and hold any properly scheduled member votes.</p></div>
        <div class="card-panel"><h3>Team business</h3><p>Discuss membership, operations, events, gear, fundraising and team priorities.</p></div>
        <div class="card-panel"><h3>Future direction</h3><p>Bring forward ideas, concerns and goals for the next year and beyond.</p></div>
      </div>
      <div class="held"><strong>What to expect:</strong> the meeting follows an agenda, attendance and minutes are recorded, members discuss agenda items, and formal votes are documented. The bylaws give each member one vote and allow proxy voting with prior written notice. Members who cannot attend in person may also take part through an approved documented voting method.</div>

      <h2 class="agm-h" id="submit">Send a question, concern or topic</h2>
      <p>Something you want the guild to discuss? Send it here any time and it goes to the executive for the next general meeting. Include your name or submit anonymously. Signed-in members can also submit and track topics in the <a href="members.html">members area</a>.</p>
      <div id="success-box" class="rsvp-now" hidden><b>Thanks. Your submission was sent.</b><span>The executive will review it for the next meeting agenda.</span></div>
      <div class="card-panel">
        <form id="agm-form" method="POST">
          <input type="hidden" name="_subject" value="Red Deer Reavers AGM Submission">
          <input type="hidden" name="_template" value="table">
          <input type="hidden" name="_url" value="https://reddeerreavers.com/agm.html">
          <input type="hidden" name="_next" value="https://reddeerreavers.com/agm.html?submitted=1">
          <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off" aria-hidden="true" aria-label="Leave this field empty">
          <input type="hidden" id="submitted-as" name="Submitted As" value="Named or name left blank">
          <label class="fld">Your name (optional)<input id="member-name" name="Name" type="text" maxlength="100"></label>
          <label class="check"><input id="anonymous" type="checkbox"> <span>Submit anonymously</span></label>
          <label class="fld">Type of submission<select id="category" name="Category" required><option value="" disabled selected>Choose one</option><option>Question</option><option>Concern</option><option>Topic for discussion</option><option>Proposal or idea</option><option>Other</option></select></label>
          <label class="fld">Short topic or title<input id="topic" name="Topic" type="text" maxlength="160" required></label>
          <label class="fld">What would you like brought up?<textarea id="details" name="Details" maxlength="4000" required></textarea></label>
          <label class="fld">How should this be brought up?<select id="share" name="Meeting Sharing Preference" required><option value="" disabled selected>Choose one</option><option>Okay to read or discuss as submitted</option><option>Please summarize without identifying me</option></select></label>
          <p class="small">Your name is not required. Leaving it blank or choosing anonymous means the submission is reviewed without a member name attached. This form helps build the agenda; it does not itself create a formal vote, nomination or bylaw amendment.</p>
          <button class="btn-rdr" type="submit">Send</button>
        </form>
      </div>

      <h2 class="agm-h" id="documents">Society documents</h2>
      <p>The bylaws, minutes and other society records are in the Reavers Google Drive.</p>
      <a class="btn-line" href="https://drive.google.com/drive/folders/1dD5-X08qAoyu-bSonBDvOOA4lqDIHA7L" target="_blank" rel="noopener">Open Reavers Drive</a>
    </div>
  </section>
</main>
${footer()}${dock("members")}${scripts(`<script>
(function () {
  var form = document.getElementById('agm-form');
  form.action = 'https://formsubmit.co/' + atob('Z2FycmV0dHJvYnNvbjk1QGdtYWlsLmNvbQ==');
  var anon = document.getElementById('anonymous'), name = document.getElementById('member-name'), as = document.getElementById('submitted-as');
  anon.addEventListener('change', function () { name.disabled = anon.checked; if (anon.checked) name.value = ''; as.value = anon.checked ? 'Anonymous' : 'Named or name left blank'; });
  if (new URLSearchParams(location.search).get('submitted') === '1') { var ok = document.getElementById('success-box'); ok.hidden = false; ok.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
})();
</script>`)}`;
