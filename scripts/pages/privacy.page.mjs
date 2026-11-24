import { head, header, footer, dock, scripts } from "./partials.mjs";

// The privacy policy. Meta, Google (YouTube) and TikTok ask for this page before they approve the social media manager
// (docs/social-media.md), and #delete is the "data deletion instructions" address Meta asks for.
// Keep it true: when the site, the members area or the Reavers app starts collecting something new, add it here.
const UPDATED = "November 24, 2026";
const EMAIL = "reddeerreavers@gmail.com";

export const file = "privacy.html";
export default () => `${head({
  title: "Privacy policy | Red Deer Reavers",
  description: "What the Red Deer Reavers Guild collects on reddeerreavers.com, the members area and the Reavers app, why, who it's shared with, and how to see or delete it.",
  page: "privacy",
  extra: `
  <style>
    .legal{padding:calc(var(--header-h) + 48px) 0 64px}
    .legal .shell{max-width:780px}
    .legal h1{font-family:var(--font-display);font-size:clamp(2.8rem,10vw,4.6rem);line-height:.95;margin:0 0 12px;color:var(--bone)}
    .legal h2{font-size:clamp(1.6rem,5vw,2.2rem);margin:40px 0 10px}
    .legal h3{margin:22px 0 6px}
    .legal p,.legal li{color:var(--bone-dim);line-height:1.6}
    .legal ul{padding-left:1.2em;display:grid;gap:6px}
    .legal strong{color:var(--bone)}
    .legal .updated{color:var(--bone-mute)}
    .legal .toc{display:flex;flex-wrap:wrap;gap:8px 18px;padding:0;list-style:none;margin:20px 0 0}
    .legal :target{scroll-margin-top:calc(var(--header-h) + 16px)}
  </style>`
})}${header("", { solid: true })}
<main id="content" class="legal">
  <div class="shell">
    <p class="eyebrow">Red Deer Reavers Guild</p>
    <h1>Privacy policy</h1>
    <p class="updated">Last updated ${UPDATED}</p>
    <p>The Red Deer Reavers Guild ("the Reavers", "we") is a nonprofit society in Red Deer, Alberta. This page explains what personal information we collect through <strong>reddeerreavers.com</strong>, the <strong>members area</strong>, the <strong>Reavers app</strong> (app.reddeerreavers.com) and our event and payment pages, why we collect it, who we share it with, and how you can see, fix or delete it.</p>
    <p>Questions or requests: <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>
    <ul class="toc">
      <li><a href="#collect">What we collect</a></li>
      <li><a href="#use">How we use it</a></li>
      <li><a href="#share">Who we share it with</a></li>
      <li><a href="#social">Social media accounts</a></li>
      <li><a href="#storage">Cookies and storage</a></li>
      <li><a href="#keep">How long we keep it</a></li>
      <li><a href="#delete">Your choices and deleting your data</a></li>
    </ul>

    <h2 id="collect">What we collect</h2>
    <p>We only collect what you give us, or what we need to run the club.</p>
    <h3>When you just visit the website</h3>
    <p>Nothing that identifies you. The website has no advertising, no tracking pixels and no analytics service. Our web host (Cloudflare) keeps the short-lived technical logs every web server keeps, such as IP addresses, to deliver the site and protect it from attacks.</p>
    <h3>Forms on the website</h3>
    <ul>
      <li><strong>Booking the Reavers</strong> (demos, school visits, events): your name, organization, how to reach you, and the event details you enter.</li>
      <li><strong>Becoming a sponsor</strong>: your business name, contact name, email, phone, website and message.</li>
      <li><strong>Event sign-ups and tickets</strong>: your name, email, and, when the event asks for them, a phone number, your club and a note.</li>
      <li><strong>Buying merch or paying fees</strong>: your name and email. Card details go straight to Square; we never see or store them.</li>
    </ul>
    <h3>Members area and the Reavers app</h3>
    <ul>
      <li><strong>Your account</strong>: your name and email, and if you sign in with Google or Discord, the basic profile those services share (name, email, profile picture, Discord user ID).</li>
      <li><strong>Membership</strong>: your membership status, dues and payments, meeting attendance and RSVPs, and proxy, nomination and voting records. Ballots are secret: the records show that you voted, never how.</li>
      <li><strong>Training and safety</strong>: practice attendance, your signed waiver (including an emergency contact and any medical notes you choose to give), and incident reports.</li>
      <li><strong>Club business</strong>: reimbursement claims and receipts you upload, and club gear you borrow.</li>
      <li><strong>Fighter profile</strong>: what you choose to add to your public fighter profile (name, photos, weight class, role, sponsors). This part is public on the website because you put it there.</li>
    </ul>

    <h2 id="use">How we use it</h2>
    <ul>
      <li>To run the club: training, events, tournaments, membership, dues and meetings.</li>
      <li>To keep fighters safe: waivers, emergency contacts and incident records.</li>
      <li>To reply to you, and to send the reminders you'd expect as a member (dues, practices, events), by email or Discord.</li>
      <li>To keep the books, as a registered society must.</li>
    </ul>
    <p>We don't sell personal information, rent it out, or use it for advertising.</p>

    <h2 id="share">Who we share it with</h2>
    <p>Only the club's executive (and members an admin gives a specific page to) can see member records, and the database enforces who sees what. We use these services to run the club, and they handle information only to provide their service to us:</p>
    <ul>
      <li><strong>BuhurtOS</strong>: the buhurt club platform that holds accounts, fighter profiles and the club's records, on a server in Canada with a backup copy on Supabase.</li>
      <li><strong>Cloudflare</strong>: hosts the website.</li>
      <li><strong>Square</strong>: takes payments. See Square's privacy notice.</li>
      <li><strong>Google and Discord</strong>: only if you choose to sign in with them, or receive reminders by Discord.</li>
      <li><strong>Resend</strong>: sends reminder emails, if the club has them turned on.</li>
    </ul>
    <p>We'd also share information if the law required it, or in an emergency to protect someone's safety.</p>

    <h2 id="social">The club's social media accounts</h2>
    <p>The Reavers app has a tool the executive uses to post to the <strong>club's own</strong> accounts on Facebook, Instagram, YouTube, TikTok, X, Bluesky and Discord. When an executive connects one of those accounts, the platform gives the app a key that lets it post to that account and read the likes, comments and views on the club's posts. The app stores those keys in a part of the database no person can read, uses them only to post what the executive writes and to show how those posts did, and deletes a key as soon as the account is disconnected.</p>
    <p>The app doesn't read your personal social media, messages, contacts or followers. Photos and captions we post may show members at club events; ask us if you'd rather not appear and we'll take the photo down.</p>
    <p><strong>YouTube.</strong> The app uses YouTube API Services to upload videos to the club's channel. By using it you are also bound by the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener">YouTube Terms of Service</a>, and Google's handling of data is covered by the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy Policy</a>. The app's use of information received from Google APIs follows the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener">Google API Services User Data Policy</a>, including the Limited Use requirements. You can remove the app's access at any time in your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener">Google account's security settings</a>.</p>
    <p>The same goes for Meta (Facebook and Instagram), TikTok and X: you can remove the app under the connected apps settings of each platform, and the app stops posting there right away.</p>
    <p>The website's Social page also shows photos the club posted on its own Instagram and Facebook, copied onto the site.</p>

    <h2 id="storage">Cookies and storage in your browser</h2>
    <p>We don't use tracking or advertising cookies. When you sign in to the members area or the Reavers app, your browser stores your sign-in so you stay signed in, and the site may save copies of pages so they load offline. You can clear these at any time in your browser's settings, which signs you out.</p>

    <h2 id="keep">How long we keep it</h2>
    <ul>
      <li>Inquiries and sponsor messages: as long as we're in touch, and up to two years after.</li>
      <li>Membership, waiver, incident and financial records: as long as the society's bylaws, its insurer and the law require (financial records generally at least seven years).</li>
      <li>Reminder history: one year.</li>
      <li>Social media keys: until the account is disconnected.</li>
      <li>Your account: until you ask us to delete it.</li>
    </ul>

    <h2 id="delete">Your choices and deleting your data</h2>
    <p>You can ask to see the personal information we hold about you, ask us to correct it, or ask us to delete it. Email <a href="mailto:${EMAIL}">${EMAIL}</a> from the address on your account (or tell us how to confirm it's you), say what you'd like, and we'll answer within 30 days. Some records we have to keep by law, such as financial records and signed waivers; we'll tell you if that applies.</p>
    <p>To delete data the Reavers app received from a social media platform, disconnect the account in the app (Social media → Accounts → Disconnect) or remove the app in that platform's settings; its keys are deleted straight away. You can also email us and we'll do it for you.</p>
    <p>You can edit or remove your public fighter profile yourself in the members area at any time.</p>
    <p>If you're not happy with how we've handled your information, tell us first and we'll try to put it right. You can also contact the <a href="https://oipc.ab.ca/" target="_blank" rel="noopener">Office of the Information and Privacy Commissioner of Alberta</a>.</p>

    <h2>Children</h2>
    <p>Youth programs are run with a parent or guardian, who signs the waiver and gives any information for a fighter under 18.</p>

    <h2>Changes</h2>
    <p>If we change this policy, we'll update the date at the top. If a change affects how we use information you've already given us, we'll tell members by email or in the members area.</p>
  </div>
</main>
${footer()}${dock("")}${scripts()}`;
