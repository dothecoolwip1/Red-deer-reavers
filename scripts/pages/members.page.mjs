import { head, header, footer, dock, scripts, icon } from "./partials.mjs";

export const file = "members.html";
// The members area logic lives in assets/js/member-portal.js (unchanged). Only the chrome and styling come from the new site.
export default () => `${head({
  title: "Members | Red Deer Reavers",
  description: "Red Deer Reavers members area: one account for the Reavers and BuhurtOS, membership status, dues, AGM RSVP, nominations and executive tools.",
  page: "members",
  ogImage: 14,
  extra: `\n  <meta name="robots" content="noindex">\n  <link rel="stylesheet" href="assets/members.css?v=26">`
})}${header("members", { solid: true, cta: ["agm.html", "AGM"] })}
<main id="content" class="members-page">
  <section class="section-tight members-hero">
    <div class="shell">
      <p class="eyebrow solo">The Guild</p>
      <h1 class="members-title">Members</h1>
      <p class="lede no-print" id="lede">One account for the Red Deer Reavers and BuhurtOS. Create it here or sign in with the account you already use on BuhurtOS: same email, same password.</p>
    </div>
  </section>
  <section class="section parchment members-sheet">
    <div class="shell members">
      <div id="status" role="status" aria-live="polite"></div>
        <!-- Signed out -->
        <section id="signed-out" class="card-panel" hidden>
            <nav class="tabs-rdr" aria-label="Account">
                <button type="button" data-auth-tab="signin" aria-selected="true">Sign in</button>
                <button type="button" data-auth-tab="signup" aria-selected="false">Create account</button>
                <button type="button" data-auth-tab="forgot" aria-selected="false">Forgot password</button>
            </nav>

            <div data-auth-panel="signin">
                <h2>Member sign in</h2>
                <p class="small" id="admin-note" hidden><b>Admin sign in:</b> use your normal Reavers / BuhurtOS account. There is no separate admin login. The executive tools appear automatically if you currently hold an executive role.</p>
                <p class="small">Already on BuhurtOS? Use the same email and password (or Google) here. Do not create a second account.</p>
                <form id="password-form" autocomplete="on" novalidate>
                    <label class="fld">Email<input id="email" type="email" autocomplete="email" required></label>
                    <label class="fld">Password<input id="password" type="password" autocomplete="current-password"></label>
                    <button class="btn-rdr" type="submit" id="password-btn">Sign in</button>
                </form>
                <div class="or"><span>or</span></div>
                <button class="btn-line wide" type="button" id="google-btn">Continue with Google</button>
                <form id="code-form" novalidate>
                    <p class="small">No password? Get a 6-digit sign-in code by email (uses the email address above).</p>
                    <button class="btn-line" type="submit" id="code-send-btn">Email me a sign-in code</button>
                    <div id="code-step" hidden>
                        <label class="fld">6-digit code<input id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="10"></label>
                        <button class="btn-rdr" type="button" id="code-verify-btn">Sign in with code</button>
                    </div>
                </form>
            </div>

            <div data-auth-panel="signup" hidden>
                <h2>Create your account</h2>
                <p class="small">This creates your BuhurtOS account: the one account for the Reavers website and BuhurtOS. Next you can join the Red Deer Reavers.</p>
                <p class="small">Thinking of joining? Read the <a href="https://drive.google.com/file/d/1R9EDu7BpUZ1KM790BDNN0iIaXZYtUtCE/view?usp=drivesdk" target="_blank" rel="noopener noreferrer" data-testid="bylaws-link-signup">Red Deer Reavers bylaws (PDF, opens in a new tab)</a> first. Creating an account does not make you a member.</p>
                <form id="signup-form" autocomplete="on" novalidate>
                    <label class="fld">Your name<input id="su-name" type="text" maxlength="80"></label>
                    <label class="fld">Email<input id="su-email" type="email" autocomplete="email"></label>
                    <label class="fld">Password (at least 8 characters)<input id="su-password" type="password" autocomplete="new-password"></label>
                    <label class="fld">Password again<input id="su-password2" type="password" autocomplete="new-password"></label>
                    <button class="btn-rdr" type="submit" id="signup-btn">Create account</button>
                </form>
                <div id="signup-check" hidden>
                    <p id="signup-check-text"></p>
                    <label class="fld">Code from the email (if it shows one)<input id="su-code" inputmode="numeric" autocomplete="one-time-code" maxlength="10"></label>
                    <div class="row-btns">
                        <button class="btn-rdr" type="button" id="su-code-btn">Confirm with code</button>
                        <button class="btn-line" type="button" id="su-resend-btn">Send the email again</button>
                    </div>
                    <p class="small">Already have an account with this email? <a href="#" data-goto="signin">Sign in</a> or <a href="#" data-goto="forgot">reset your password</a>.</p>
                </div>
            </div>

            <div data-auth-panel="forgot" hidden>
                <h2>Reset your password</h2>
                <p class="small">Works for every BuhurtOS account. If you only ever used Google, this sets a password you can also use.</p>
                <form id="forgot-form" novalidate>
                    <label class="fld">Email<input id="fp-email" type="email" autocomplete="email"></label>
                    <button class="btn-rdr" type="submit" id="forgot-btn">Email me a reset link</button>
                </form>
                <div id="forgot-check" hidden>
                    <p>If that address has an account, a reset email is on its way. Open its link on this device, or enter the code if the email shows one.</p>
                    <label class="fld">Code from the email<input id="fp-code" inputmode="numeric" autocomplete="one-time-code" maxlength="10"></label>
                    <button class="btn-rdr" type="button" id="fp-code-btn">Continue</button>
                </div>
            </div>
        </section>

        <!-- New password (after a reset link or code) -->
        <section id="new-password" class="card-panel" hidden>
            <h2>Choose a new password</h2>
            <form id="newpw-form" novalidate>
                <label class="fld">New password (at least 8 characters)<input id="np-password" type="password" autocomplete="new-password"></label>
                <label class="fld">New password again<input id="np-password2" type="password" autocomplete="new-password"></label>
                <button class="btn-rdr" type="submit" id="newpw-btn">Save new password</button>
            </form>
        </section>

        <!-- Signed in -->
        <section id="signed-in" hidden>
            <div class="account-bar no-print">
                <span>Signed in as <b id="who"></b> <span class="small">(BuhurtOS account)</span></span>
                <button class="btn-line small-btn" id="sign-out" type="button">Sign out</button>
            </div>
            <div id="fighter-nudge" class="no-print" hidden></div>
            <nav class="tabs-rdr no-print" id="tabs" hidden aria-label="Members area"></nav>
            <div id="view"></div>
            <p class="small no-print" id="buhurtos-link"></p>
        </section>
    </div>
  </section>
</main>
    <dialog id="dues-dialog" aria-labelledby="dues-title">
        <form method="dialog" id="dues-form">
            <h3 id="dues-title">Dues</h3>
            <p class="small" id="dues-now"></p>
            <div class="dues-pick" role="radiogroup" aria-label="Dues status">
                <label><input type="radio" name="dues" value="paid"><span>Paid</span></label>
                <label><input type="radio" name="dues" value="unpaid"><span>Unpaid</span></label>
                <label><input type="radio" name="dues" value="waived"><span>Waived</span></label>
                <label><input type="radio" name="dues" value="gear_contribution"><span>Gear contribution</span></label>
            </div>
            <label class="fld" id="dues-amount-wrap">Amount (empty = normal dues)<input id="dues-amount" inputmode="decimal"></label>
            <label class="fld">Note (optional)<input id="dues-note" maxlength="300"></label>
            <p class="small">Recorded in the dues history with your name and office.</p>
            <p class="err" id="dues-err" role="alert"></p>
            <div class="row-btns">
                <button class="btn-rdr" id="dues-save" value="save" type="submit">Save dues</button>
                <button class="btn-line" value="cancel" type="button" id="dues-cancel">Cancel</button>
            </div>
        </form>
    </dialog>
${footer()}${dock("members")}${scripts(
  `<script src="assets/js/vendor/supabase-js-2.117.2.umd.js"></script>`,
  `<script src="assets/js/buhurtos-config.js"></script>`,
  `<script src="assets/js/member-portal.js?v=26"></script>`
)}`;
