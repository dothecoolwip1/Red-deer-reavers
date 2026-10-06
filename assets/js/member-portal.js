/*
 * Red Deer Reavers members area: account, joining the Reavers, membership, the 2026 AGM, and the executive's tools.
 *
 * ONE account. This page uses the same Supabase Auth project as BuhurtOS, so creating an account here creates the BuhurtOS account itself
 * (one auth.users row, one profile), and an existing BuhurtOS account signs in here unchanged. There is no Reavers password database, no
 * second profile and nothing is synchronised. The website and BuhurtOS are served from the same web origin, so the browser also keeps one
 * sign-in for both; no token is ever put in a URL or passed between sites.
 *
 * Nothing here is a security boundary. The BuhurtOS database decides everything (club_* and club_meeting_* functions, migrations
 * 20261013000100 and 20261014000100): a member acts only on their own membership, RSVP and proxy; only the club's current President,
 * Secretary or Treasurer change dues, membership status, check-in and the video link. All database text is inserted with textContent.
 */
(function () {
  'use strict';
  var CFG = window.BUHURTOS;
  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
  });
  var HERE = window.location.origin + window.location.pathname;
  var $ = function (id) { return document.getElementById(id); };
  var state = { session: null, profile: null, team: null, overview: null, agm: null, view: null, year: null, roster: null, filter: 'all', search: '',
    duesFor: null, agmRows: null, agmFilter: 'all', agmSearch: '', proxyPick: false, recovery: false, loading: false,
    agmx: null, agmxError: '', topicForm: null, topicNotice: '', nomMode: null, nomOffice: null, nomTarget: '', nomNotice: '', agmSection: 'people', topicFilter: 'all' };

  var MEMBERSHIP = { pending: 'Pending', active: 'Active', inactive: 'Inactive', removed: 'Removed' };
  var DUES = { unpaid: 'Unpaid', paid: 'Paid', waived: 'Waived', gear_contribution: 'Gear contribution' };
  var RSVP = { in_person: 'In Person', video: 'Video Call', proxy: 'Voting by Proxy', not_attending: 'Not Attending' };
  var RSVP_DONE = { in_person: 'Attending In Person', video: 'Attending by Video Call', proxy: 'Voting by Proxy', not_attending: 'Not Attending' };
  var ATTEND = { present_in_person: 'Present in person', present_video: 'Present by video', absent: 'Absent' };
  var INTERESTS = [['fighter', 'Fighter'], ['volunteer', 'Volunteer / helper'], ['fan', 'Supporter / fan'], ['captain', 'Team captain'], ['organizer', 'Event organizer']];
  var MIN_PASSWORD = 8;

  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function money(c) { return c == null ? '' : '$' + (c / 100).toFixed(c % 100 === 0 ? 0 : 2); }
  function dateText(iso) { return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }); }
  function timeText(iso) { return new Date(iso).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  function looksLikeEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim()); }

  /** h('div', {class: 'x', onclick: fn}, 'text', child): text is always text, never HTML. */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      (Array.isArray(c) ? c : [c]).forEach(function (x) { if (x != null && x !== false) el.appendChild(typeof x === 'string' || typeof x === 'number' ? document.createTextNode(String(x)) : x); });
    }
    return el;
  }
  function chip(cls, text) { return h('span', { class: 'chip-s ' + cls }, text); }
  function status(msg, isErr) { var s = $('status'); s.textContent = msg || ''; s.className = isErr ? 'err' : ''; }
  function feeChip(duesStatus, feeWaived) { return feeWaived && duesStatus === 'unpaid' ? chip('waived', 'Fee waived') : chip(duesStatus, DUES[duesStatus]); }

  /** Words a person can act on. Never says whether an email address has an account. */
  function words(err, fallback) {
    var e = err || {};
    if (navigator.onLine === false) return 'You are offline. Try again when you have signal.';
    if (e.code === '42501') return 'You do not have permission to do that.';
    if (['22023', 'P0001', 'P0002', '23505'].indexOf(e.code) >= 0 && e.message) return e.message.charAt(0).toUpperCase() + e.message.slice(1) + '.';
    var m = String(e.message || '').toLowerCase();
    if (e.code === 'invalid_credentials' || m.indexOf('invalid login') >= 0) return 'That email and password do not match. Check them, or use "Forgot password", Google or an email code.';
    if (e.code === 'otp_expired' || (m.indexOf('token') >= 0 && m.indexOf('expired') >= 0) || (m.indexOf('invalid') >= 0 && (m.indexOf('otp') >= 0 || m.indexOf('token') >= 0))) return 'That code or link is not right or has expired. Ask for a new one.';
    if (e.code === 'email_not_confirmed') return 'Confirm your email address first: open the link in the email we sent when you created the account (you can send it again from "Create account").';
    if (e.code === 'weak_password') return 'Choose a stronger password: at least ' + MIN_PASSWORD + ' characters, not a common one.';
    if (e.code === 'same_password') return 'Your new password must be different from the old one.';
    if (e.code === 'user_already_exists' || e.code === 'email_exists') return 'Could not create an account with that email. If you already have a BuhurtOS account, sign in or reset your password.';
    if (e.code === 'signup_disabled' || e.code === 'email_provider_disabled') return 'New accounts cannot be created with email right now. Try "Continue with Google".';
    if (e.code === 'email_address_not_authorized') return 'Account emails cannot be sent to that address right now. Please contact the club executive.';
    if (e.code === 'email_address_invalid' || e.code === 'validation_failed') return 'Enter a valid email address.';
    if (e.status === 429 || m.indexOf('rate limit') >= 0) return 'Too many attempts. Wait a minute and try again.';
    if (m.indexOf('failed to fetch') >= 0 || m.indexOf('network') >= 0) return 'Could not reach BuhurtOS. Check your signal and try again.';
    return fallback || 'Something went wrong. Please try again.';
  }
  function busy(btn, on) { btn.disabled = !!on; }

  // ================================================================ account: sign in, create account, forgot password
  function authTab(name) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-auth-tab]'), function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-auth-tab') === name)); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-auth-panel]'), function (p) { p.hidden = p.getAttribute('data-auth-panel') !== name; });
    status('');
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-auth-tab]'), function (b) { b.addEventListener('click', function () { authTab(b.getAttribute('data-auth-tab')); }); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-goto]'), function (a) { a.addEventListener('click', function (e) { e.preventDefault(); authTab(a.getAttribute('data-goto')); }); });

  $('password-form').addEventListener('submit', function (e) {
    e.preventDefault(); status('');
    var email = $('email').value.trim(), pw = $('password').value;
    if (!email || !pw) return status('Enter your email and password, or use Google or an email code.', true);
    busy($('password-btn'), true);
    sb.auth.signInWithPassword({ email: email, password: pw }).then(function (r) { busy($('password-btn'), false); if (r.error) status(words(r.error), true); });
  });
  $('google-btn').addEventListener('click', function () {
    sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: HERE } }).then(function (r) { if (r.error) status(words(r.error), true); });
  });
  $('code-form').addEventListener('submit', function (e) {
    e.preventDefault(); status('');
    var email = $('email').value.trim();
    if (!looksLikeEmail(email)) return status('Enter your email address above first.', true);
    busy($('code-send-btn'), true);
    // Existing accounts only: new people use "Create account" so they choose a password and confirm their email.
    sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: false } }).then(function (r) {
      busy($('code-send-btn'), false);
      if (r.error && r.error.code !== 'otp_disabled' && r.error.code !== 'user_not_found' && r.error.status !== 422 && r.error.status !== 400) return status(words(r.error), true);
      $('code-step').hidden = false; $('code').focus();
      status('If that address has an account, a 6-digit code is on its way. Enter it below. New here? Use "Create account".');
    });
  });
  $('code-verify-btn').addEventListener('click', function () {
    status('');
    var email = $('email').value.trim(), code = $('code').value.replace(/\s/g, '');
    if (!code) return status('Enter the code from the email.', true);
    busy($('code-verify-btn'), true);
    sb.auth.verifyOtp({ email: email, token: code, type: 'email' }).then(function (r) { busy($('code-verify-btn'), false); if (r.error) status(words(r.error), true); });
  });

  // Create account: Supabase Auth sign-up in the SAME project as BuhurtOS. The BuhurtOS profile row is created by the database for every
  // new account (on_auth_user_created); the profile step below completes it with BuhurtOS's own complete_my_profile.
  $('signup-form').addEventListener('submit', function (e) {
    e.preventDefault(); status('');
    var name = $('su-name').value.trim(), email = $('su-email').value.trim(), pw = $('su-password').value, pw2 = $('su-password2').value;
    if (name.length < 2) return status('Enter your name.', true);
    if (!looksLikeEmail(email)) return status('Enter a valid email address.', true);
    if (pw.length < MIN_PASSWORD) return status('Use at least ' + MIN_PASSWORD + ' characters for your password.', true);
    if (pw.length > 72) return status('Use at most 72 characters for your password.', true);
    if (pw !== pw2) return status('The two passwords do not match.', true);
    busy($('signup-btn'), true);
    sb.auth.signUp({ email: email, password: pw, options: { emailRedirectTo: HERE, data: { full_name: name } } }).then(function (r) {
      busy($('signup-btn'), false);
      if (r.error) return status(words(r.error), true);
      if (r.data && r.data.session) { status(''); return; }   // signed in straight away (email confirmation off): onAuthStateChange continues
      // Confirmation needed. The same answer for a new address and an address that already has an account (no enumeration).
      $('signup-form').hidden = true; $('signup-check').hidden = false;
      $('signup-check-text').textContent = 'Check your email (' + email + '). Open the confirmation link on this device to finish creating your account and come straight back here. '
        + 'If you already have a BuhurtOS account with this email, no new account is made: sign in instead, or reset your password.';
    });
  });
  $('su-code-btn').addEventListener('click', function () {
    var email = $('su-email').value.trim(), code = $('su-code').value.replace(/\s/g, '');
    if (!code) return status('Enter the code from the email, or open its link.', true);
    busy($('su-code-btn'), true);
    sb.auth.verifyOtp({ email: email, token: code, type: 'signup' }).then(function (r) { busy($('su-code-btn'), false); if (r.error) status(words(r.error), true); });
  });
  $('su-resend-btn').addEventListener('click', function () {
    var email = $('su-email').value.trim();
    busy($('su-resend-btn'), true);
    sb.auth.resend({ type: 'signup', email: email, options: { emailRedirectTo: HERE } }).then(function (r) {
      busy($('su-resend-btn'), false);
      if (r.error && r.error.code !== 'over_email_send_rate_limit') return status(words(r.error), true);
      status('If that address is waiting for confirmation, the email is on its way again (or was sent a moment ago).');
    });
  });

  $('forgot-form').addEventListener('submit', function (e) {
    e.preventDefault(); status('');
    var email = $('fp-email').value.trim();
    if (!looksLikeEmail(email)) return status('Enter a valid email address.', true);
    busy($('forgot-btn'), true);
    sb.auth.resetPasswordForEmail(email, { redirectTo: HERE + '?reset=1' }).then(function (r) {
      busy($('forgot-btn'), false);
      // Supabase limits emails per ADDRESS; answering "too soon" differently would reveal that the address has an account.
      if (r.error && r.error.code !== 'over_email_send_rate_limit') return status(words(r.error), true);
      $('forgot-check').hidden = false;
    });
  });
  $('fp-code-btn').addEventListener('click', function () {
    var email = $('fp-email').value.trim(), code = $('fp-code').value.replace(/\s/g, '');
    if (!code) return status('Enter the code from the email, or open its link.', true);
    busy($('fp-code-btn'), true);
    sb.auth.verifyOtp({ email: email, token: code, type: 'recovery' }).then(function (r) {
      busy($('fp-code-btn'), false);
      if (r.error) return status(words(r.error), true);
      state.recovery = true; renderAll();
    });
  });
  $('newpw-form').addEventListener('submit', function (e) {
    e.preventDefault(); status('');
    var pw = $('np-password').value, pw2 = $('np-password2').value;
    if (pw.length < MIN_PASSWORD) return status('Use at least ' + MIN_PASSWORD + ' characters.', true);
    if (pw !== pw2) return status('The two passwords do not match.', true);
    busy($('newpw-btn'), true);
    sb.auth.updateUser({ password: pw }).then(function (r) {
      busy($('newpw-btn'), false);
      if (r.error) return status(words(r.error), true);
      state.recovery = false;
      try { window.history.replaceState(null, '', HERE); } catch (x) { /* ignore */ }
      status('Password saved. Use it here and on BuhurtOS.');
      renderAll(); load();
    });
  });
  $('sign-out').addEventListener('click', function () { sb.auth.signOut(); });

  // Arriving from an email link: a reset link lands with ?reset=1; a link opened in another browser cannot finish (PKCE) but the email is
  // already confirmed by then, so say so instead of failing silently.
  (function () {
    var q = new URLSearchParams(window.location.search), hq = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (q.get('reset') === '1') state.recovery = true;
    var err = q.get('error_description') || hq.get('error_description');
    if (err) status(/expired|invalid/i.test(err) ? 'That email link has expired or was already used. Ask for a new one.' : 'That email link could not be used: ' + err, true);
  })();

  sb.auth.onAuthStateChange(function (event, session) {
    if (event === 'PASSWORD_RECOVERY') state.recovery = true;
    var before = state.session && state.session.user.id;
    state.session = session;
    if (!session) { state.recovery = false; renderAll(); return; }
    if (before !== session.user.id) setTimeout(load, 0); else renderAll();
  });
  sb.auth.getSession().then(function (r) {
    if (r.error && /code|verifier|flow/i.test(String(r.error.message))) status('This link was opened in a different browser or app. Your email is confirmed: sign in below with your email and password.', true);
    if (!r.data.session) renderAll();
  });

  function renderAll() {
    var signedIn = !!state.session;
    $('signed-out').hidden = signedIn;
    $('new-password').hidden = !(signedIn && state.recovery);
    $('signed-in').hidden = !signedIn || state.recovery;
    $('lede').hidden = signedIn;
    if (!signedIn) { $('view').textContent = ''; state.overview = null; state.agm = null; state.agmx = null; state.profile = null; state.team = null; }
  }

  // ================================================================ load the signed-in person
  function load() {
    if (!state.session || state.loading) return;
    state.loading = true;
    renderAll();
    status('Loading…');
    $('who').textContent = state.session.user.email || '';
    var bl = $('buhurtos-link'); bl.textContent = '';
    bl.appendChild(document.createTextNode('This is your BuhurtOS account. '));
    bl.appendChild(h('a', { href: CFG.appUrl + '/', rel: 'noopener' }, 'Open BuhurtOS'));
    bl.appendChild(document.createTextNode(' with the same sign-in for events, teams and your fighter profile.'));
    var uid = state.session.user.id;
    sb.from('profiles').select('display_name,onboarded_at,interests,city,region,country').eq('id', uid).maybeSingle().then(function (p) {
      state.profile = p.data || null;
      if (!state.profile || !state.profile.onboarded_at) { state.loading = false; status(''); return renderProfileSetup(); }
      return sb.from('teams').select('id,name,slug').eq('slug', CFG.teamSlug).maybeSingle().then(function (t) {
        if (t.error || !t.data) { state.loading = false; return status(words(t.error, 'Could not find the Red Deer Reavers in BuhurtOS.'), true); }
        state.team = t.data;
        return Promise.all([sb.rpc('club_membership_overview', { p_team: state.team.id }), sb.rpc('club_meeting_member_view', { p_team: state.team.id })]).then(function (rs) {
          state.loading = false;
          if (rs[0].error) return status(words(rs[0].error, 'Could not load your membership.'), true);
          state.overview = rs[0].data; state.agm = rs[1].error ? null : rs[1].data; state.year = rs[0].data.current_year;
          status('');
          var params = new URLSearchParams(window.location.search);
          if (!state.view) state.view = params.get('view') || (myMembership() ? 'mine' : 'join');
          render();
          loadAgmx();
        });
      });
    }).catch(function (x) { state.loading = false; status(words(x), true); });
  }
  function reload() { state.loading = false; state.overview = null; state.agmRows = null; state.agmx = null; load(); }
  function myMembership() { var o = state.overview; return o ? (o.memberships || []).filter(function (x) { return x.year === o.current_year; })[0] || null : null; }
  function currentYear() { var o = state.overview; return o ? (o.years || []).filter(function (y) { return y.year === o.current_year; })[0] || null : null; }

  // ---------------------------------------------------------------- basic profile (BuhurtOS's own first-sign-in step)
  function renderProfileSetup() {
    renderAll(); $('tabs').hidden = true;
    var v = $('view'); v.textContent = '';
    var meta = state.session.user.user_metadata || {};
    var name = h('input', { class: 'browser-default', id: 'pf-name', maxlength: '80', autocomplete: 'name', value: (state.profile && state.profile.display_name) || meta.full_name || meta.name || '' });
    var boxes = INTERESTS.map(function (i) { return h('label', { class: 'check' }, h('input', { type: 'checkbox', value: i[0], checked: i[0] === 'fighter' }), h('span', {}, i[1])); });
    var city = h('input', { class: 'browser-default', id: 'pf-city', maxlength: '80', value: 'Red Deer' });
    var region = h('input', { class: 'browser-default', id: 'pf-region', maxlength: '80', value: 'Alberta' });
    var err = h('p', { class: 'err', role: 'alert' });
    var btn = h('button', { class: 'btn-rdr', type: 'submit' }, 'Continue');
    var form = h('form', { class: 'card-panel', 'data-testid': 'profile-setup', novalidate: true },
      h('h2', {}, 'Set up your account'), h('p', { class: 'small' }, 'One quick step for your BuhurtOS account. Next: join the Red Deer Reavers.'),
      h('label', { class: 'fld' }, 'Your name (shown to the club executive and team captains)', name),
      h('fieldset', { class: 'plain' }, h('legend', {}, 'How do you take part?'), boxes),
      h('label', { class: 'fld' }, 'City (optional)', city), h('label', { class: 'fld' }, 'Province (optional)', region), err, btn);
    form.addEventListener('submit', function (e) {
      e.preventDefault(); err.textContent = '';
      var picks = boxes.map(function (b) { return b.querySelector('input'); }).filter(function (i) { return i.checked; }).map(function (i) { return i.value; });
      if (name.value.trim().length < 2) { err.textContent = 'Enter your name.'; return; }
      if (!picks.length) { err.textContent = 'Choose at least one.'; return; }
      busy(btn, true);
      sb.rpc('complete_my_profile', { p_name: name.value.trim(), p_interests: picks, p_city: city.value.trim() || null, p_region: region.value.trim() || null, p_country: 'Canada' }).then(function (r) {
        busy(btn, false);
        if (r.error) { err.textContent = words(r.error); return; }
        reload();
      });
    });
    v.appendChild(form);
  }

  // ================================================================ tabs
  function render() {
    renderAll();
    var o = state.overview, mine = myMembership();
    var tabs = [];
    if (!mine) tabs.push(['join', 'Join the Reavers']); else tabs.push(['mine', 'My membership']);
    tabs.push(['agm', '2026 AGM']);
    if (o.can_view_roster) tabs.push(['members', 'Members'], ['agm-admin', 'AGM admin'], ['proxies', 'Proxies'], ['print', 'AGM voting list'], ['history', 'Dues history']);
    if (!tabs.some(function (t) { return t[0] === state.view; })) state.view = tabs[0][0];
    var nav = $('tabs'); nav.textContent = ''; nav.hidden = false;
    tabs.forEach(function (t) {
      nav.appendChild(h('button', { type: 'button', 'aria-selected': String(state.view === t[0]), onclick: function () { state.view = t[0]; state.proxyPick = false; render(); } }, t[1]));
    });
    var v = $('view'); v.textContent = '';
    if (!o.enabled) { v.appendChild(h('p', {}, 'Membership is not set up yet.')); return; }
    if (state.view !== 'agm' && state.agmx && (state.agmx.to_respond || []).length) v.appendChild(nominatedBanner());
    ({ join: renderJoin, mine: renderMine, agm: renderAgm, members: renderMembers, 'agm-admin': renderAgmAdmin, proxies: renderProxies, print: renderPrint, history: renderHistory })[state.view](v);
  }
  function go(view) { state.view = view; state.proxyPick = false; render(); window.scrollTo(0, 0); }

  function voteBanner(eligible, reasons) {
    return h('div', { class: 'vote ' + (eligible ? 'yes' : 'no'), 'data-testid': 'vote-banner' },
      h('b', {}, eligible ? 'ELIGIBLE TO VOTE' : 'NOT CURRENTLY ELIGIBLE TO VOTE'),
      !eligible && reasons && reasons.length ? h('span', {}, reasons.join(' · ')) : null);
  }

  // ---------------------------------------------------------------- join (membership application)
  function renderJoin(v) {
    var o = state.overview, year = currentYear();
    if (!year) { v.appendChild(h('p', {}, 'Membership is not open yet.')); return; }
    if (!year.applications_open) { v.appendChild(h('p', {}, 'Applications for ' + year.year + ' are closed. Ask the club executive.')); return; }
    var offices = (o.offices || []).map(function (x) { return x.label; });
    if (offices.length) v.appendChild(h('p', {}, 'Your executive role: ', h('b', {}, offices.join(', ')), '.'));
    var name = h('input', { class: 'browser-default', id: 'ap-name', autocomplete: 'name', maxlength: '120', value: (state.profile && state.profile.display_name) || o.suggested_name || '' });
    var discord = h('input', { class: 'browser-default', id: 'ap-discord', maxlength: '64' });
    var dob = h('input', { class: 'browser-default', id: 'ap-dob', type: 'date', max: today() });
    var adult = h('input', { type: 'checkbox', id: 'ap-adult' });
    var bylaws = h('input', { type: 'checkbox', id: 'ap-bylaws' });
    var err = h('p', { class: 'err', role: 'alert' });
    var btn = h('button', { class: 'btn-rdr', type: 'submit' }, 'Apply to join');
    var form = h('form', { class: 'card-panel', 'data-testid': 'apply-form', novalidate: true },
      h('h2', {}, 'Join the Red Deer Reavers'),
      h('p', { class: 'small' }, year.fee_waived ? ['The ' + year.year + ' membership fee is ', h('b', {}, 'waived'), ': nothing to pay.'] : ['Annual dues for ' + year.year + ': ', h('b', {}, money(year.dues_cents)), ', paid to the Treasurer.'],
        ' Account: ' + (o.email || '') + '.'),
      h('label', { class: 'fld' }, 'Full name (for the membership register)', name),
      h('label', { class: 'fld' }, 'Discord name (optional)', discord),
      h('label', { class: 'fld' }, 'Date of birth (optional if you confirm 18+ below)', dob),
      h('label', { class: 'check' }, adult, h('span', {}, 'I confirm I am 18 or older')),
      h('label', { class: 'check' }, bylaws, h('span', {}, 'I agree to follow the Red Deer Reavers bylaws and team standards')),
      h('p', { class: 'small' }, 'Members under 18 are welcome but cannot vote.'), err, btn);
    form.addEventListener('submit', function (e) {
      e.preventDefault(); err.textContent = '';
      if (name.value.trim().length < 2) { err.textContent = 'Enter your full name.'; return; }
      if (!dob.value && !adult.checked) { err.textContent = 'Give your date of birth, or confirm you are 18 or older.'; return; }
      if (!bylaws.checked) { err.textContent = 'You must agree to follow the bylaws and team standards.'; return; }
      busy(btn, true);
      sb.rpc('apply_for_club_membership', {
        p_team: state.team.id, p_year: year.year, p_full_name: name.value.trim(), p_discord_name: discord.value.trim() || null,
        p_date_of_birth: dob.value || null, p_adult_confirmed: adult.checked, p_agree_bylaws: bylaws.checked
      }).then(function (r) {
        busy(btn, false);
        if (r.error) { err.textContent = words(r.error); return; }
        state.view = 'mine'; reload();
      });
    });
    v.appendChild(form);
  }

  // ---------------------------------------------------------------- my membership
  function renderMine(v) {
    var o = state.overview, m = myMembership(), year = currentYear();
    var offices = (o.offices || []).map(function (x) { return x.label; });
    v.appendChild(h('section', { class: 'card-panel', 'data-testid': 'my-membership' },
      m.status === 'pending' ? h('h2', { 'data-testid': 'membership-heading' }, 'Membership Application Pending') : h('h2', { 'data-testid': 'membership-heading' }, 'Membership: ' + MEMBERSHIP[m.status]),
      voteBanner(m.eligible, m.reasons),
      h('dl', { class: 'facts' },
        h('dt', {}, 'Member'), h('dd', {}, m.full_name),
        h('dt', {}, 'Membership'), h('dd', {}, chip(m.status, MEMBERSHIP[m.status]), ' ', String(m.year)),
        h('dt', {}, m.year + ' membership fee'), h('dd', { 'data-testid': 'fee' }, m.fee_waived ? h('b', { class: 'waived-text' }, 'WAIVED') : [chip(m.dues_status, DUES[m.dues_status]), ' ', money(m.dues_amount_cents)]),
        offices.length ? [h('dt', {}, 'Executive role'), h('dd', {}, offices.join(', '))] : null,
        m.discord_name ? [h('dt', {}, 'Discord'), h('dd', {}, m.discord_name)] : null,
        h('dt', {}, 'Applied'), h('dd', {}, dateText(m.applied_at))),
      m.status === 'pending' ? h('p', { class: 'small' }, 'The club executive will review your application. You can already register for the AGM.') : null,
      m.status === 'active' && !m.fee_waived && m.dues_status === 'unpaid' ? h('p', { class: 'small' }, 'Pay your ' + money(year ? year.dues_cents : null) + ' dues to the Treasurer; they record it here.') : null,
      h('button', { type: 'button', class: 'btn-rdr', onclick: function () { go('agm'); } }, 'Register for the 2026 AGM')));
  }

  // ================================================================ the AGM (member)
  function agmHeader(a) {
    var mt = a.meeting;
    return h('div', { class: 'agm-head', 'data-testid': 'agm-head' },
      h('div', { class: 'agm-kicker' }, 'RED DEER REAVERS ' + mt.year + ' AGM'),
      h('div', { class: 'agm-when' }, mt.local_date), h('div', { class: 'agm-when' }, mt.local_time + ' (' + (mt.timezone === 'America/Edmonton' ? 'Mountain time, Red Deer' : mt.timezone) + ')'),
      mt.location ? h('div', { class: 'small' }, 'Location: ' + mt.location) : null);
  }
  function renderAgm(v) {
    var a = state.agm;
    if (!a || !a.meeting) { v.appendChild(h('p', {}, 'No AGM is scheduled yet.')); return; }
    var card = h('section', { class: 'card-panel', 'data-testid': 'agm-member' }, agmHeader(a));
    v.appendChild(card);
    // the help is only an explanation: if it ever failed to build, the RSVP and everything else below must still work
    try { v.appendChild(agmHelp()); } catch (e) { if (window.console) console.warn('help not shown', e); }
    v.appendChild(agmExtras());
    if (!a.membership) {
      card.appendChild(h('p', {}, 'Only Red Deer Reavers members can register. Join first: it takes a minute.'));
      card.appendChild(h('button', { type: 'button', class: 'btn-rdr', onclick: function () { go('join'); } }, 'Join the Red Deer Reavers'));
      return;
    }
    if (a.membership.status === 'removed') { card.appendChild(h('p', {}, 'Your membership was removed. Ask the club executive.')); return; }
    card.appendChild(h('dl', { class: 'facts' },
      h('dt', {}, 'Membership'), h('dd', {}, MEMBERSHIP[a.membership.status]),
      h('dt', {}, a.meeting.year + ' Membership Fee'), h('dd', {}, a.fee_waived ? h('b', { class: 'waived-text' }, 'WAIVED') : DUES[a.membership.dues_status]),
      h('dt', {}, 'Voting Status'), h('dd', {}, h('b', { class: a.eligible ? 'ok-text' : 'err' }, a.eligible ? 'ELIGIBLE TO VOTE' : 'NOT CURRENTLY ELIGIBLE TO VOTE'),
        !a.eligible && a.reasons.length ? h('div', { class: 'small' }, a.reasons.join(' · ')) : null)));
    var resp = a.rsvp && a.rsvp.response;
    if (resp) {
      var line = h('div', { class: 'rsvp-now', 'data-testid': 'rsvp-now' }, h('b', {}, RSVP_DONE[resp]));
      if (resp === 'proxy' && a.proxy) {
        line.appendChild(h('div', {}, 'Your Proxy: ', h('b', { 'data-testid': 'proxy-holder' }, a.proxy.holder_name)));
        if (a.proxy.problem) line.appendChild(h('div', { class: 'err' }, 'Not currently valid: ' + a.proxy.problem + '. Choose another member.'));
      }
      if (resp === 'video') {
        if (a.video && a.video.link) line.appendChild(h('div', { 'data-testid': 'video-info' }, 'Video meeting: ', h('a', { href: a.video.link, rel: 'noopener noreferrer', target: '_blank' }, a.video.link), a.video.details ? h('div', { class: 'small' }, a.video.details) : null));
        else line.appendChild(h('div', { class: 'small', 'data-testid': 'video-info' }, 'The video meeting link will appear here when the executive adds it.'));
      }
      card.appendChild(line);
    }
    if ((a.proxies_held || []).length) {
      card.appendChild(h('div', { class: 'held' }, h('b', {}, 'Proxy authority you hold: '), a.proxies_held.map(function (p, i) { return (i ? ', ' : '') + p.grantor_name + (p.valid ? '' : ' (not currently valid)'); }),
        h('div', { class: 'small' }, 'This is separate from your own vote. Nothing is voted automatically.')));
    }
    if (a.meeting.started) { card.appendChild(h('p', { class: 'small' }, 'The meeting has started. Ask the executive to record any change.')); return; }
    card.appendChild(h('h3', {}, resp ? 'Change how you will participate' : 'How will you participate?'));
    var opts = h('div', { class: 'rsvp-opts', role: 'group', 'aria-label': 'How will you participate?' });
    ['in_person', 'video', 'proxy', 'not_attending'].forEach(function (k) {
      opts.appendChild(h('button', { type: 'button', class: 'rsvp-opt', 'aria-pressed': String(resp === k), onclick: function () {
        if (k === 'proxy') { state.proxyPick = true; render(); return; }
        saveRsvp(k, null, false);
      } }, RSVP[k]));
    });
    card.appendChild(opts);
    if (resp === 'proxy' && a.proxy && !state.proxyPick) {
      card.appendChild(h('div', { class: 'row-btns' },
        h('button', { type: 'button', class: 'btn-line', onclick: function () { state.proxyPick = true; render(); } }, 'Change proxy'),
        h('button', { type: 'button', class: 'btn-line', onclick: cancelProxy }, 'Cancel proxy')));
    }
    if (state.proxyPick) card.appendChild(proxyForm(a));
  }
  function proxyForm(a) {
    var sel = h('select', { class: 'browser-default', id: 'proxy-holder' }, h('option', { value: '' }, 'Choose a member…'),
      (a.proxy_candidates || []).map(function (c) { return h('option', { value: c.membership_id, selected: a.proxy && a.proxy.holder_membership_id === c.membership_id }, c.name); }));
    var when = a.meeting.local_date.replace(/^[A-Za-z]+, /, '');
    var ok = h('input', { type: 'checkbox', id: 'proxy-ok' });
    var err = h('p', { class: 'err', role: 'alert' });
    var save = h('button', { type: 'button', class: 'btn-rdr' }, 'Save my proxy');
    save.addEventListener('click', function () {
      err.textContent = '';
      if (!sel.value) { err.textContent = 'Choose the member who will hold your proxy.'; return; }
      if (!ok.checked) { err.textContent = 'Tick the authorization to continue.'; return; }
      saveRsvp('proxy', sel.value, true, err);
    });
    return h('div', { class: 'proxy-box', 'data-testid': 'proxy-form' },
      h('h3', {}, 'Voting by Proxy'),
      (a.proxy_candidates || []).length ? null : h('p', { class: 'err' }, 'No member is eligible to hold a proxy right now.'),
      h('label', { class: 'fld' }, 'Member who will hold your proxy (eligible voting members only)', sel),
      h('label', { class: 'check' }, ok, h('span', {}, 'I authorize the selected member to act as my proxy for the ' + when + ' Red Deer Reavers AGM.')),
      h('p', { class: 'small' }, 'Your proxy holder may vote on your behalf at the meeting. You can change or cancel this before the AGM.'),
      err, h('div', { class: 'row-btns' }, save, h('button', { type: 'button', class: 'btn-line', onclick: function () { state.proxyPick = false; render(); } }, 'Back')));
  }
  function saveRsvp(response, holder, authorize, errEl) {
    status('Saving…');
    sb.rpc('set_club_meeting_rsvp', { p_meeting: state.agm.meeting.id, p_response: response, p_proxy_holder: holder, p_authorize: authorize }).then(function (r) {
      if (r.error) { status(''); if (errEl) errEl.textContent = words(r.error); else status(words(r.error), true); return; }
      state.proxyPick = false; status('Saved: ' + RSVP_DONE[response] + '.');
      refreshAgm();
    });
  }
  function cancelProxy() {
    if (!window.confirm('Cancel your proxy? You can then choose how you will participate.')) return;
    sb.rpc('cancel_club_meeting_proxy', { p_meeting: state.agm.meeting.id }).then(function (r) {
      if (r.error) return status(words(r.error), true);
      status('Proxy cancelled.'); refreshAgm();
    });
  }
  function refreshAgm() {
    sb.rpc('club_meeting_member_view', { p_team: state.team.id }).then(function (r) { if (!r.error) state.agm = r.data; render(); });
  }

  // ================================================================ the AGM: concerns and executive nominations (member)
  var OFFICE = { president: 'President', secretary: 'Secretary', treasurer: 'Treasurer' };
  var TOPIC = { submitted: 'Submitted', on_agenda: 'Added to Agenda', addressed: 'Addressed', withdrawn: 'Withdrawn' };
  var TOPIC_CHIP = { submitted: 'pending', on_agenda: 'rsvp', addressed: 'active', withdrawn: '' };
  var NOM = { awaiting_acceptance: 'Awaiting acceptance', accepted: 'Accepted', declined: 'Declined', withdrawn: 'Withdrawn' };
  var NOM_CHIP = { awaiting_acceptance: 'pending', accepted: 'active', declined: 'cannot', withdrawn: '' };
  function agmName() { return state.agm.meeting.year + ' Red Deer Reavers AGM'; }
  // DISPLAY ONLY. An office holder is shown from the officer records. For an office with no record (its holder has no BuhurtOS account yet) the
  // page shows the name below instead of "not assigned". It decides nothing: it grants no permission, and it is ignored the moment the office has a real holder.
  var OFFICER_NO_ACCOUNT = { president: 'Kedrixx', treasurer: 'Carmalee' };
  function officerName(office, name) {
    if (name) return name;
    return OFFICER_NO_ACCOUNT[office] ? OFFICER_NO_ACCOUNT[office] + ' (no currently active account)' : 'not assigned';
  }
  function loadAgmx(redraw) {
    if (!state.agm || !state.agm.meeting) { state.agmx = null; return Promise.resolve(); }
    return sb.rpc('club_agm_member_view', { p_meeting: state.agm.meeting.id }).then(function (r) {
      state.agmx = r.error ? null : r.data; state.agmxError = r.error ? words(r.error) : '';
      if (redraw !== false) render();
    });
  }
  function swap(id, build) { var el = $(id); if (el) el.replaceWith(build()); }
  function agmExtras() {
    var box = h('div', { id: 'agm-extras' }), x = state.agmx;
    if (state.agmxError) box.appendChild(h('p', { class: 'err', role: 'alert' }, state.agmxError));
    if (!x || (!x.is_member && !x.board)) return box;
    if (x.is_member) box.appendChild(topicsPanel());
    box.appendChild(nominationsPanel());
    return box;
  }
  function nominatedBanner() {
    var n = state.agmx.to_respond[0];
    return h('div', { class: 'nominated-box', role: 'status', 'data-testid': 'nominated-banner' },
      h('h3', {}, 'You\'ve Been Nominated'),
      h('p', {}, 'You have been nominated for ' + n.label + ' for the ' + agmName() + '.'),
      h('button', { type: 'button', class: 'btn-rdr', onclick: function () { go('agm'); } }, 'Review nomination'));
  }

  // ================================================================ "How the AGM Works": plain-English help for members
  // Every button name quoted here is the real button on this page (the browser tests check that). Dates, fee and officers come from the system.
  function agmHelp() {
    var a = state.agm, mt = a.meeting, yr = currentYear(), waivedYear = !!(yr && yr.fee_waived), board = state.agmx && state.agmx.board;
    var q = function (t) { return h('b', {}, '“' + t + '”'); };
    var ol = function () { return h('ol', { class: 'browser-default' }, Array.prototype.map.call(arguments, function (x) { return h('li', {}, x); })); };
    var ul = function () { return h('ul', { class: 'browser-default' }, Array.prototype.map.call(arguments, function (x) { return h('li', {}, x); })); };
    var item = function (id, title) {
      var kids = Array.prototype.slice.call(arguments, 2);
      return h('details', { class: 'help-item', 'data-testid': 'help-' + id }, h('summary', {}, title), h('div', { class: 'help-body' }, [].concat.apply([], kids)));
    };
    var feeLine = waivedYear ? ['Membership fees are waived for ' + mt.year + '. You do not need to pay the normal ' + money(yr.dues_cents) + ' fee to vote this year.']
      : ['The ' + mt.year + ' membership fee is ' + (yr ? money(yr.dues_cents) : 'set by the club') + ', paid to the Treasurer.'];
    var roles = [['president', 'President', 'Helps lead the society and meetings.'],
      ['secretary', 'Secretary', 'Helps keep society records, meeting information and official paperwork organized.'],
      ['treasurer', 'Treasurer', 'Helps manage the society\'s money and financial records.']];
    var holder = function (office) { var b = (board || []).filter(function (x) { return x.office === office; })[0]; return officerName(office, b && b.current_officer); };
    var where = mt.local_date + ' at ' + mt.local_time + (mt.location ? ', ' + mt.location : '');
    return h('section', { class: 'card-panel agm-help', id: 'agm-help', 'data-testid': 'agm-help' },
      h('h3', {}, 'How the AGM Works'),
      h('p', { class: 'small' }, 'Tap a heading to open it.'),
      item('vote', 'Who can vote?',
        h('p', {}, 'You can vote at the AGM if you are:'),
        ul('18 or older', 'an approved Red Deer Reavers member', 'shown on this page as ELIGIBLE TO VOTE'),
        h('p', {}, feeLine),
        h('p', {}, 'Making an account is not enough on its own. You also need an approved membership. Members under 18 are welcome but cannot vote.')),
      item('join', 'How to join',
        h('p', {}, 'BuhurtOS and the Reavers site use the ', h('b', {}, 'same account'), '. You never need two.'),
        ol(['Open the Red Deer Reavers Members page.'],
          ['Already have a BuhurtOS account? Sign in with it.'],
          ['No account yet? On the sign-in page tap ', q('Create account'), ' and make one right there.'],
          ['Finish your profile (tap ', q('Continue'), ').'],
          ['On ', q('Join the Reavers'), ' fill in the form and tap ', q('Apply to join'), '.'],
          ['Wait for the executive to approve you. Until then it says Membership Application Pending.'],
          waivedYear ? ['The ' + mt.year + ' fee is waived, so there is nothing to pay.'] : ['Pay the ' + mt.year + ' fee to the Treasurer.'],
          ['Once you are approved and eligible, this page says ELIGIBLE TO VOTE.'])),
      item('roles', 'Executive roles',
        h('p', {}, 'The Reavers have three executive positions.'),
        roles.map(function (r) {
          return h('div', { class: 'help-role', 'data-testid': 'help-role-' + r[0] }, h('b', {}, r[1]), h('div', {}, r[2]),
            board ? h('div', { class: 'small' }, 'Currently: ', h('b', {}, holder(r[0]))) : null);
        }),
        board ? null : h('p', { class: 'small' }, 'Members can see who holds each position here.')),
      item('nominate', 'How nominations work',
        h('p', {}, 'Any member who can vote can put their name forward for President, Secretary or Treasurer. You can also nominate another member who can vote.'),
        h('p', {}, 'A nomination does ', h('b', {}, 'not'), ' give anyone the job. The decision is made at the AGM election. If nobody runs against the current officer, they stay in the position.'),
        h('p', {}, h('b', {}, 'Nominate yourself')),
        ol(['Find ', q('Executive Nominations'), ' on this tab.'], ['Tap ', q('Nominate Myself'), '.'], ['Choose President, Secretary or Treasurer.'],
          ['Read the message that appears.'], ['Tap ', q('Confirm Nomination'), '.']),
        h('p', {}, 'Your name then shows as an accepted candidate for that position.'),
        h('p', {}, h('b', {}, 'Nominate someone else')),
        ol(['Find ', q('Executive Nominations'), ' on this tab.'], ['Tap ', q('Nominate Another Member'), '.'], ['Choose the member (only members who can vote are listed).'],
          ['Choose President, Secretary or Treasurer.'], ['Tap ', q('Confirm Nomination'), '.']),
        h('p', {}, 'The person you nominate must accept before they are a confirmed candidate. They can also decline. You cannot accept for them. They will see ', q('You\'ve Been Nominated'), ' when they sign in, with ', q('Accept Nomination'), ' and ', q('Decline Nomination'), ' buttons.'),
        h('p', { class: 'small' }, 'Nominations close when the AGM starts.')),
      item('topic', 'Submit an AGM topic',
        h('p', {}, 'Have something you want discussed at the AGM? You can submit it before the meeting. It could be:'),
        ul('an idea for the club', 'something you think should change', 'a question for the executive', 'an event or practice idea', 'anything you want the members to talk about'),
        ol(['Find ', q('Something you want discussed?'), ' on this tab.'], ['Tap ', q('Submit AGM Concern / Topic'), '.'], ['Write a short subject.'],
          ['Explain what you want discussed in the details.'], ['Tap ', q('Submit for AGM'), '.']),
        h('p', {}, 'Your topic then shows under ', q('Your AGM topics'), '. You can edit or withdraw it until the AGM starts, unless the executive has marked it Addressed. Only you and the executive can see what you submit.')),
      item('rsvp', 'RSVP and proxy voting',
        h('p', {}, h('b', {}, 'AGM: '), where + '.'),
        h('p', {}, 'Tell the club how you plan to take part by tapping one of the four choices at the top of this tab:'),
        ul('In Person', 'Video Call (the link appears here once the executive adds it)', 'Voting by Proxy', 'Not Attending'),
        h('p', {}, 'You can change your answer until the AGM starts.'),
        h('p', {}, h('b', {}, 'Can\'t attend but still want your vote represented?')),
        h('p', {}, 'If you can vote, you can choose another member who can vote to hold your proxy. That lets them represent your vote at the AGM.'),
        ol(['Tap ', q('Voting by Proxy'), '.'], ['Choose the member who will hold your proxy.'], ['Tick the box that says you authorize them.'], ['Tap ', q('Save my proxy'), '.']),
        h('p', {}, 'Before the AGM you can use ', q('Change proxy'), ' or ', q('Cancel proxy'), '.')));
  }

  // ---- concerns / topics
  function topicsPanel() {
    var x = state.agmx, box = h('section', { class: 'card-panel agm-extra', id: 'agm-topics', 'data-testid': 'agm-topics' },
      h('h3', {}, 'Something you want discussed?'),
      h('p', {}, 'If there is a concern, question, idea or topic you would like brought up at the AGM, submit it here.'));
    if (x.topics_open) {
      if (state.topicForm) box.appendChild(topicForm(state.topicForm));
      else box.appendChild(h('button', { type: 'button', class: 'btn-rdr', 'data-testid': 'topic-new', onclick: function () { state.topicNotice = ''; state.topicForm = {}; swap('agm-topics', topicsPanel); } }, 'Submit AGM Concern / Topic'));
    } else box.appendChild(h('p', { class: 'small' }, 'Topics closed when the AGM started. Speak to the executive.'));
    if (state.topicNotice) box.appendChild(h('p', { class: 'ok-text', role: 'status', 'data-testid': 'topic-received' }, state.topicNotice));
    var mine = x.my_topics || [];
    if (mine.length) {
      box.appendChild(h('h4', {}, 'Your AGM topics'));
      mine.forEach(function (t) {
        var row = h('div', { class: 'arow', 'data-testid': 'my-topic' },
          h('div', { class: 'who' }, h('b', {}, t.subject)),
          h('div', { class: 'chips' }, chip(TOPIC_CHIP[t.status], TOPIC[t.status]), h('span', { class: 'small' }, 'Submitted ' + dateText(t.created_at) + (t.updated_at !== t.created_at ? ' · edited ' + dateText(t.updated_at) : ''))),
          h('div', { class: 'topic-details small' }, t.details));
        if (t.can_edit) {
          row.appendChild(h('div', { class: 'row-btns' },
            h('button', { type: 'button', class: 'btn-line small-btn', onclick: function () { state.topicNotice = ''; state.topicForm = { id: t.id, subject: t.subject, details: t.details }; swap('agm-topics', topicsPanel); } }, 'Edit'),
            h('button', { type: 'button', class: 'btn-line small-btn', onclick: function () { withdrawTopic(t); } }, 'Withdraw')));
        } else if (t.status === 'addressed') row.appendChild(h('div', { class: 'small' }, 'The executive has addressed this topic, so it can no longer be changed.'));
        box.appendChild(row);
      });
    }
    return box;
  }
  function topicForm(f) {
    var subj = h('input', { class: 'browser-default', id: 'topic-subject', maxlength: '120', placeholder: 'A short title', value: f.subject || '' });
    var det = h('textarea', { class: 'browser-default', id: 'topic-details', maxlength: '4000', rows: '6', placeholder: 'Explain the concern, question, suggestion or topic' }, f.details || '');
    var err = h('p', { class: 'err', role: 'alert' });
    var save = h('button', { type: 'button', class: 'btn-rdr', 'data-testid': 'topic-submit' }, f.id ? 'Save changes' : 'Submit for AGM');
    save.addEventListener('click', function () {
      err.textContent = '';
      var s1 = subj.value.trim(), d1 = det.value.trim();
      if (s1.length < 3) { err.textContent = 'Give your topic a short title.'; return; }
      if (!d1) { err.textContent = 'Add some details so the executive understands.'; return; }
      busy(save, true);
      var call = f.id ? sb.rpc('update_club_agm_topic', { p_topic: f.id, p_subject: s1, p_details: d1 }) : sb.rpc('submit_club_agm_topic', { p_meeting: state.agm.meeting.id, p_subject: s1, p_details: d1 });
      call.then(function (r) {
        busy(save, false);
        if (r.error) { err.textContent = words(r.error); return; }
        state.topicForm = null;
        state.topicNotice = f.id ? 'Saved your changes to "' + s1 + '".' : 'Received. "' + s1 + '" has been sent to the executive for the AGM.';
        loadAgmx(false).then(function () { swap('agm-topics', topicsPanel); });
      });
    });
    return h('div', { class: 'topic-form', 'data-testid': 'topic-form' },
      h('label', { class: 'fld' }, 'Subject', subj), h('label', { class: 'fld' }, 'Details', det), err,
      h('div', { class: 'row-btns' }, save, h('button', { type: 'button', class: 'btn-line', onclick: function () { state.topicForm = null; swap('agm-topics', topicsPanel); } }, 'Cancel')));
  }
  function withdrawTopic(t) {
    if (!window.confirm('Withdraw "' + t.subject + '"? The executive will see that you withdrew it.')) return;
    sb.rpc('withdraw_club_agm_topic', { p_topic: t.id }).then(function (r) {
      if (r.error) return status(words(r.error), true);
      state.topicNotice = 'Withdrawn: "' + t.subject + '".';
      loadAgmx(false).then(function () { swap('agm-topics', topicsPanel); });
    });
  }

  // ---- nominations
  function nominationsPanel() {
    var x = state.agmx, box = h('section', { class: 'card-panel agm-extra', id: 'agm-nominations', 'data-testid': 'agm-nominations' }, h('h3', {}, 'Executive Nominations'));
    (x.to_respond || []).forEach(function (n) { box.appendChild(nomineeCard(n)); });
    (x.my_candidacies || []).forEach(function (c) {
      if (c.status === 'accepted') box.appendChild(h('div', { class: 'cand-mine', 'data-testid': 'my-candidacy' },
        h('span', {}, 'You are an accepted candidate for '), h('b', {}, c.label), h('span', {}, '. '),
        h('button', { type: 'button', class: 'btn-line small-btn', onclick: function () { withdrawCandidacy(c); } }, 'Withdraw my candidacy')));
      else if (c.status === 'declined' || c.status === 'withdrawn') box.appendChild(h('p', { class: 'small' }, 'Your nomination for ' + c.label + ': ' + NOM[c.status] + '.'));
    });
    if (state.nomNotice) box.appendChild(h('p', { class: 'ok-text', role: 'status', 'data-testid': 'nomination-notice' }, state.nomNotice));
    if (x.can_nominate) box.appendChild(nominateForm());
    else if (x.nominate_blocked) box.appendChild(h('p', { class: 'small', 'data-testid': 'nominate-blocked' }, x.nominate_blocked));
    box.appendChild(h('h4', { 'data-testid': 'nominations-heading' }, state.agm.meeting.year + ' Executive Nominations'));
    box.appendChild(h('p', { class: 'small' }, 'Nominations only prepare the list of candidates. They do not change who holds an office: current officers stay in place unless members vote otherwise at the AGM. Only accepted nominations are confirmed candidates.'));
    (x.board || []).forEach(function (o) {
      var acc = o.candidates.filter(function (c) { return c.status === 'accepted'; }), wait = o.candidates.filter(function (c) { return c.status === 'awaiting_acceptance'; });
      box.appendChild(h('div', { class: 'office-card', 'data-testid': 'office-' + o.office },
        h('h4', {}, o.label),
        h('div', {}, 'Current Officer: ', h('b', {}, officerName(o.office, o.current_officer))),
        h('div', {}, 'Accepted Candidates: ', acc.length ? acc.map(function (c, i) { return h('b', {}, (i ? ', ' : '') + c.name); }) : h('span', { class: 'small' }, 'none yet')),
        wait.length ? h('div', { class: 'small' }, 'Nominated, awaiting acceptance: ' + wait.map(function (c) { return c.name; }).join(', ')) : null));
    });
    return box;
  }
  function nomineeCard(n) {
    var title = 'You\'ve Been Nominated';
    var acc = h('button', { type: 'button', class: 'btn-rdr', 'data-testid': 'nomination-accept', onclick: function () { answerNomination(n, 'accept'); } }, 'Accept Nomination');
    var dec = h('button', { type: 'button', class: 'btn-line', 'data-testid': 'nomination-decline', onclick: function () { answerNomination(n, 'decline'); } }, 'Decline Nomination');
    return h('div', { class: 'nominated-box', 'data-testid': 'nominated-card' }, h('h3', {}, title),
      h('p', {}, 'You have been nominated for ' + n.label + ' for the ' + agmName() + '.'),
      h('dl', { class: 'facts' }, h('dt', {}, 'Nominated by'), h('dd', {}, (n.nominated_by || []).join(', ')), h('dt', {}, 'Role'), h('dd', {}, n.label), h('dt', {}, 'Date'), h('dd', {}, dateText(n.nominated_at))),
      h('div', { class: 'row-btns' }, acc, dec));
  }
  function answerNomination(n, answer) {
    if (answer === 'decline' && !window.confirm('Decline the nomination for ' + n.label + '?')) return;
    sb.rpc('respond_to_club_nomination', { p_nomination: n.id, p_response: answer }).then(function (r) {
      if (r.error) return status(words(r.error), true);
      state.nomNotice = answer === 'accept' ? 'You accepted the nomination for ' + n.label + '. You are now a candidate.' : 'You declined the nomination for ' + n.label + '.';
      status(''); loadAgmx();
    });
  }
  function withdrawCandidacy(c) {
    if (!window.confirm('Withdraw your candidacy for ' + c.label + '?')) return;
    sb.rpc('respond_to_club_nomination', { p_nomination: c.id, p_response: 'withdraw' }).then(function (r) {
      if (r.error) return status(words(r.error), true);
      state.nomNotice = 'You withdrew your candidacy for ' + c.label + '.'; status(''); loadAgmx();
    });
  }
  function nominateForm() {
    var x = state.agmx, box = h('div', { class: 'nominate-box', 'data-testid': 'nominate-form' }), redraw = function () { swap('agm-nominations', nominationsPanel); };
    var modes = h('div', { class: 'rsvp-opts', role: 'group', 'aria-label': 'Who are you nominating?' },
      [['self', 'Nominate Myself'], ['other', 'Nominate Another Member']].map(function (m) {
        return h('button', { type: 'button', class: 'rsvp-opt', 'aria-pressed': String(state.nomMode === m[0]), onclick: function () { state.nomMode = state.nomMode === m[0] ? null : m[0]; state.nomNotice = ''; redraw(); } }, m[1]);
      }));
    box.appendChild(modes);
    if (!state.nomMode) return box;
    var err = h('p', { class: 'err', role: 'alert' }), target = null;
    if (state.nomMode === 'other') {
      target = h('select', { class: 'browser-default', id: 'nominee' }, h('option', { value: '' }, 'Choose a member…'),
        (x.nominees || []).map(function (c) { return h('option', { value: c.membership_id, selected: state.nomTarget === c.membership_id }, c.name); }));
      target.addEventListener('change', function () { state.nomTarget = target.value; redraw(); });
      box.appendChild(h('label', { class: 'fld' }, 'Member (voting members only)', target));
    }
    box.appendChild(h('div', { class: 'small' }, 'Executive role'));
    box.appendChild(h('div', { class: 'rsvp-opts', role: 'group', 'aria-label': 'Executive role' }, [['president', 'President'], ['secretary', 'Secretary'], ['treasurer', 'Treasurer']].map(function (o) {
      return h('button', { type: 'button', class: 'rsvp-opt', 'aria-pressed': String(state.nomOffice === o[0]), onclick: function () { state.nomOffice = o[0]; redraw(); } }, o[1]);
    })));
    var nominee = state.nomMode === 'other' ? (x.nominees || []).filter(function (c) { return c.membership_id === state.nomTarget; })[0] : null;
    var ready = !!state.nomOffice && (state.nomMode === 'self' || !!nominee);
    if (ready) box.appendChild(h('p', { class: 'confirm-line', 'data-testid': 'nomination-confirm' },
      state.nomMode === 'self' ? 'You are nominating yourself for ' + OFFICE[state.nomOffice] + ' at the ' + agmName() + '.'
        : 'You are nominating ' + nominee.name + ' for ' + OFFICE[state.nomOffice] + ' at the ' + agmName() + '. ' + nominee.name + ' must accept before becoming a candidate.'));
    var go1 = h('button', { type: 'button', class: 'btn-rdr', 'data-testid': 'nomination-submit', disabled: !ready }, 'Confirm Nomination');
    go1.addEventListener('click', function () {
      busy(go1, true); err.textContent = '';
      var self = state.nomMode === 'self', label = OFFICE[state.nomOffice], nm = nominee && nominee.name;
      sb.rpc('nominate_for_club_office', { p_meeting: state.agm.meeting.id, p_office: state.nomOffice, p_nominee: self ? null : state.nomTarget }).then(function (r) {
        busy(go1, false);
        if (r.error) { err.textContent = words(r.error); return; }
        state.nomNotice = self ? 'Done: you are a candidate for ' + label + '.' : 'Nomination sent. ' + nm + ' must accept the nomination for ' + label + ' before becoming a candidate.';
        state.nomMode = null; state.nomOffice = null; state.nomTarget = '';
        loadAgmx(false).then(redraw);
      });
    });
    box.appendChild(err); box.appendChild(go1);
    return box;
  }

  // ================================================================ executive: members and dues (from the previous release)
  function fetchRoster() { return sb.rpc('club_member_roster', { p_team: state.team.id, p_year: state.year }); }
  function waived() { var y = currentYear(); return !!(y && y.fee_waived); }
  function satisfied(s) { return waived() || s !== 'unpaid'; }
  var FILTERS = [['all', 'All'], ['eligible', 'Can vote'], ['not_eligible', 'Cannot vote'], ['paid', 'Fee paid / waived'], ['unpaid', 'Fee unpaid'], ['pending', 'Pending'], ['active', 'Active']];
  function keep(r) {
    var q = state.search.trim().toLowerCase();
    if (q && (r.full_name + ' ' + (r.discord_name || '') + ' ' + (r.email || '')).toLowerCase().indexOf(q) < 0) return false;
    switch (state.filter) {
      case 'eligible': return r.eligible;
      case 'not_eligible': return !r.eligible && r.status !== 'removed';
      case 'paid': return r.status !== 'removed' && satisfied(r.dues_status);
      case 'unpaid': return r.status !== 'removed' && !satisfied(r.dues_status);
      case 'pending': return r.status === 'pending';
      case 'active': return r.status === 'active';
      default: return true;
    }
  }
  function renderMembers(v) {
    v.appendChild(h('p', { class: 'small' }, 'Loading members…'));
    fetchRoster().then(function (r) {
      v.textContent = '';
      if (r.error) { v.appendChild(h('p', { class: 'err' }, words(r.error, 'Could not load the members list.'))); return; }
      state.roster = r.data || [];
      drawMembers(v);
    });
  }
  function tile(n, label, tone, onclick, testid) { return h('button', { type: 'button', class: 'tile ' + (tone || ''), onclick: onclick, 'data-testid': testid }, h('b', {}, String(n)), h('span', {}, label)); }
  function searchBox(value, onchange, redraw) {
    var s = h('input', { type: 'search', class: 'browser-default', placeholder: 'Find a member', 'aria-label': 'Find a member', value: value });
    s.addEventListener('input', function () { var pos = s.selectionStart; onchange(s.value); var n = redraw(); var box = n.querySelector('input[type=search]'); box.focus(); box.setSelectionRange(pos, pos); });
    return s;
  }
  function drawMembers(v) {
    v.textContent = '';
    var o = state.overview, rows = state.roster, live = rows.filter(function (r) { return r.status !== 'removed'; });
    var paid = live.filter(function (r) { return satisfied(r.dues_status); }).length;
    var out = live.filter(function (r) { return (r.status === 'active' || r.status === 'pending') && !satisfied(r.dues_status); }).length;
    var set = function (f) { return function () { state.filter = f; drawMembers(v); }; };
    v.appendChild(h('div', { class: 'tiles', 'data-testid': 'summary' },
      tile(live.length, 'Total members', '', set('all')), tile(live.filter(function (r) { return r.status === 'active'; }).length, 'Active', '', set('active')),
      tile(rows.filter(function (r) { return r.eligible; }).length, 'Can vote', 'yes', set('eligible')),
      tile(paid, waived() ? 'Fee waived / paid' : 'Dues paid', '', set('paid')), tile(out, 'Dues outstanding', out ? 'no' : '', set('unpaid')),
      tile(live.filter(function (r) { return r.status === 'pending'; }).length, 'Pending applications', live.some(function (r) { return r.status === 'pending'; }) ? 'warn' : '', set('pending'))));
    if (waived()) v.appendChild(h('p', { class: 'small' }, 'The ' + state.year + ' membership fee is waived: nobody owes dues this year.'));
    v.appendChild(h('div', { class: 'filters', role: 'group', 'aria-label': 'Show' }, FILTERS.map(function (f) {
      return h('button', { type: 'button', 'aria-pressed': String(state.filter === f[0]), onclick: set(f[0]) }, f[1]);
    })));
    v.appendChild(searchBox(state.search, function (x) { state.search = x; }, function () { drawMembers(v); return v; }));
    var list = h('div', { role: 'table', 'aria-label': state.year + ' members' },
      h('div', { class: 'mrow head', role: 'row' }, h('span', {}, 'Member'), h('span', {}, 'Membership'), h('span', {}, state.year + ' fee'), h('span', {}, 'Voting'), h('span', {}, 'Actions')));
    var shown = rows.filter(keep);
    if (!rows.length) v.appendChild(h('p', {}, 'Nobody has applied for ' + state.year + ' yet.'));
    else if (!shown.length) v.appendChild(h('p', {}, 'Nobody matches.'));
    shown.forEach(function (r) {
      list.appendChild(h('div', { class: 'mrow' + (r.status === 'pending' ? ' pending' : ''), role: 'row', 'data-testid': 'member-row' },
        h('span', { class: 'who', role: 'cell' }, h('b', {}, r.full_name), r.offices && r.offices.length ? h('small', {}, r.offices.join(', ')) : null),
        h('span', { class: 'st', role: 'cell' }, chip(r.status, MEMBERSHIP[r.status])),
        h('span', { class: 'du', role: 'cell' }, feeChip(r.dues_status, waived())),
        h('span', { class: 'vt', role: 'cell' }, chip(r.eligible ? 'can' : 'cannot', r.eligible ? 'Can vote' : 'Cannot vote'), !r.eligible && r.reasons.length ? h('small', {}, r.reasons.join(' · ')) : null),
        h('span', { class: 'acts', role: 'cell' },
          o.can_change_dues ? h('button', { type: 'button', class: 'btn-line small-btn', 'aria-label': 'Change dues for ' + r.full_name, onclick: function () { openDues(r); } }, 'Dues') : null,
          o.can_change_dues && r.status === 'pending' ? h('button', { type: 'button', class: 'btn-rdr small-btn', 'aria-label': 'Approve ' + r.full_name, onclick: function () { approve(r); } }, 'Approve') : null)));
    });
    v.appendChild(list);
    v.appendChild(h('p', { class: 'small' }, 'Executive roles are assigned in BuhurtOS (club page › Executive).'));
  }
  function approve(r) {
    if (!window.confirm('Approve ' + r.full_name + ' as an active ' + state.year + ' member?')) return;
    sb.rpc('set_club_membership_status', { p_membership: r.membership_id, p_status: 'active', p_note: null }).then(function (x) {
      if (x.error) return status(words(x.error), true);
      status(r.full_name + ' approved.'); renderMembers(clear());
    });
  }
  function clear() { var v = $('view'); v.textContent = ''; return v; }

  var dlg = $('dues-dialog');
  function openDues(r) {
    state.duesFor = r;
    $('dues-title').textContent = r.full_name + ': ' + state.year + ' dues';
    $('dues-now').textContent = (waived() ? 'The ' + state.year + ' fee is waived for everyone. ' : '') + 'Recorded: ' + DUES[r.dues_status] + (r.dues_changed_by_name ? ' · last changed by ' + r.dues_changed_by_name : '');
    var pick = r.dues_status === 'unpaid' ? 'paid' : r.dues_status;
    Array.prototype.forEach.call(dlg.querySelectorAll('input[name=dues]'), function (i) { i.checked = i.value === pick; });
    $('dues-amount').value = r.dues_amount_cents != null ? String(r.dues_amount_cents / 100) : '';
    $('dues-note').value = ''; $('dues-err').textContent = '';
    syncAmount();
    dlg.showModal();
  }
  function picked() { var i = dlg.querySelector('input[name=dues]:checked'); return i ? i.value : null; }
  function syncAmount() { var p = picked(); $('dues-amount-wrap').hidden = !(p === 'paid' || p === 'gear_contribution'); }
  Array.prototype.forEach.call(dlg.querySelectorAll('input[name=dues]'), function (i) { i.addEventListener('change', syncAmount); });
  $('dues-cancel').addEventListener('click', function () { dlg.close(); });
  $('dues-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var st = picked(), raw = $('dues-amount').value.trim().replace(/^\$/, ''), cents = null;
    if ((st === 'paid' || st === 'gear_contribution') && raw) {
      if (!/^\d{1,4}(\.\d{1,2})?$/.test(raw)) { $('dues-err').textContent = 'Enter an amount like 20 or 20.00, or leave it empty.'; return; }
      cents = Math.round(Number(raw) * 100);
    }
    busy($('dues-save'), true);
    sb.rpc('set_club_dues', { p_membership: state.duesFor.membership_id, p_status: st, p_amount_cents: cents, p_note: $('dues-note').value.trim() || null }).then(function (r) {
      busy($('dues-save'), false);
      if (r.error) { $('dues-err').textContent = words(r.error); return; }
      dlg.close(); renderMembers(clear());
    });
  });

  function renderHistory(v) {
    v.appendChild(h('p', { class: 'small' }, 'Every dues change, newest first. History cannot be edited or removed.'));
    var ul = h('ul', { class: 'hist', 'data-testid': 'history' });
    v.appendChild(ul);
    sb.rpc('club_dues_history', { p_team: state.team.id, p_year: state.year, p_membership: null }).then(function (r) {
      if (r.error) { ul.appendChild(h('li', { class: 'err' }, words(r.error))); return; }
      if (!r.data.length) ul.appendChild(h('li', {}, 'No dues changes recorded for ' + state.year + '.'));
      r.data.forEach(function (x) {
        var from = x.previous_status ? DUES[x.previous_status] : 'no record';
        ul.appendChild(h('li', {}, x.changed_by_name + ' (' + x.changed_by_office + ') changed ' + x.member_name + "'s " + x.membership_year + ' dues from ' + from + ' to ' + DUES[x.new_status] +
          (x.new_amount_cents != null ? ' (' + money(x.new_amount_cents) + ')' : '') + ' on ' + dateText(x.changed_at) + '.', x.note ? h('small', {}, ' “' + x.note + '”') : null));
      });
    });
  }

  // ================================================================ executive: AGM administration
  var AGM_FILTERS = [['all', 'All'], ['eligible', 'Voting eligible'], ['not_eligible', 'Not voting eligible'], ['in_person', 'In person'], ['video', 'Video'],
    ['proxy', 'Proxy'], ['not_attending', 'Not attending'], ['none', 'No response'], ['checked', 'Checked in']];
  function agmKeep(r) {
    var q = state.agmSearch.trim().toLowerCase();
    if (q && r.full_name.toLowerCase().indexOf(q) < 0) return false;
    switch (state.agmFilter) {
      case 'eligible': return r.eligible;
      case 'not_eligible': return !r.eligible;
      case 'none': return !r.response;
      case 'checked': return !!r.attendance && r.attendance !== 'absent';
      case 'all': return true;
      default: return r.response === state.agmFilter;
    }
  }
  function loadAgmRows() { return sb.rpc('club_meeting_dashboard', { p_meeting: state.agm.meeting.id }); }
  function renderAgmAdmin(v) {
    if (!state.agm || !state.agm.meeting) { v.appendChild(h('p', {}, 'No AGM is scheduled.')); return; }
    v.appendChild(h('p', { class: 'small' }, 'Loading…'));
    loadAgmRows().then(function (r) {
      if (r.error) { v.textContent = ''; v.appendChild(h('p', { class: 'err' }, words(r.error))); return; }
      state.agmRows = (r.data || []).filter(function (x) { return x.membership_status !== 'removed'; });
      drawAgmAdmin(v);
    });
  }
  function drawAgmAdmin(v) {
    v.textContent = '';
    var a = state.agm, rows = state.agmRows, manage = !!a.can_manage;
    var count = function (f) { return rows.filter(f).length; };
    var set = function (f) { return function () { state.agmFilter = f; drawAgmAdmin(v); }; };
    v.appendChild(agmHeader(a));
    v.appendChild(agmSwitch(v));
    if (state.agmSection === 'concerns') { drawConcernsAdmin(v.appendChild(h('div', {}))); return; }
    if (state.agmSection === 'nominations') { drawNominationsAdmin(v.appendChild(h('div', {}))); return; }
    v.appendChild(h('div', { class: 'tiles seven', 'data-testid': 'agm-summary' },
      tile(rows.length, 'Total members', '', set('all')), tile(count(function (r) { return r.eligible; }), 'Voting eligible', 'yes', set('eligible')),
      tile(count(function (r) { return r.response === 'in_person'; }), 'In person', '', set('in_person')), tile(count(function (r) { return r.response === 'video'; }), 'Video call', '', set('video')),
      tile(count(function (r) { return r.response === 'proxy'; }), 'Voting by proxy', '', set('proxy')), tile(count(function (r) { return r.response === 'not_attending'; }), 'Not attending', '', set('not_attending')),
      tile(count(function (r) { return !r.response; }), 'No response', count(function (r) { return !r.response; }) ? 'warn' : '', set('none'))));
    v.appendChild(h('div', { class: 'filters', role: 'group', 'aria-label': 'Show' }, AGM_FILTERS.map(function (f) {
      return h('button', { type: 'button', 'aria-pressed': String(state.agmFilter === f[0]), onclick: set(f[0]) }, f[1]);
    })));
    v.appendChild(searchBox(state.agmSearch, function (x) { state.agmSearch = x; }, function () { drawAgmAdmin(v); return v; }));
    var shown = rows.filter(agmKeep);
    if (!shown.length) v.appendChild(h('p', {}, 'Nobody matches.'));
    shown.forEach(function (r) {
      var row = h('div', { class: 'arow' + (r.attendance && r.attendance !== 'absent' ? ' here' : ''), 'data-testid': 'agm-row' },
        h('div', { class: 'who' }, h('b', {}, r.full_name), r.offices.length ? h('small', {}, ' ' + r.offices.join(', ')) : null),
        h('div', { class: 'chips' }, chip(r.membership_status, MEMBERSHIP[r.membership_status]), chip(r.eligible ? 'can' : 'cannot', r.eligible ? 'Can vote' : 'Cannot vote'),
          feeChip(r.dues_status, r.fee_waived), r.response ? chip('rsvp', RSVP[r.response]) : chip('none', 'No response'),
          r.attendance ? chip(r.attendance === 'absent' ? 'cannot' : 'can', ATTEND[r.attendance]) : null),
        !r.eligible && r.reasons.length ? h('div', { class: 'small err' }, r.reasons.join(' · ')) : null,
        r.proxy_holder_name ? h('div', { class: 'small' }, 'Proxy → ' + r.proxy_holder_name + (r.proxy_problem ? ' (not valid: ' + r.proxy_problem + ')' : '')) : null,
        r.proxies_held_names.length ? h('div', { class: 'small' }, 'Holds ' + r.valid_proxies_held + ' valid prox' + (r.valid_proxies_held === 1 ? 'y' : 'ies') + ': ' + r.proxies_held_names.join(', ')) : null,
        r.attendance ? h('div', { class: 'small' }, 'Checked by ' + r.attendance_recorded_by + ', ' + timeText(r.attendance_recorded_at)) : null,
        manage ? h('div', { class: 'checkin', role: 'group', 'aria-label': 'Check in ' + r.full_name },
          [['present_in_person', 'In person'], ['present_video', 'Video'], ['absent', 'Absent']].map(function (s) {
            return h('button', { type: 'button', class: 'small-btn ' + (r.attendance === s[0] ? 'btn-rdr' : 'btn-line'), 'aria-pressed': String(r.attendance === s[0]),
              'aria-label': ATTEND[s[0]] + ': ' + r.full_name, onclick: function () { checkIn(r, s[0], v); } }, s[1]);
          })) : null);
      v.appendChild(row);
    });
    if (manage) v.appendChild(videoForm());
  }
  // ---------------------------------------------------------------- executive: AGM concerns and nominations (inside AGM admin)
  function agmSwitch(v) {
    return h('div', { class: 'filters', role: 'group', 'aria-label': 'AGM admin section' }, [['people', 'People and check-in'], ['concerns', 'Concerns'], ['nominations', 'Nominations']].map(function (t) {
      return h('button', { type: 'button', 'aria-pressed': String(state.agmSection === t[0]), onclick: function () { state.agmSection = t[0]; drawAgmAdmin(v); } }, t[1]);
    }));
  }
  function drawConcernsAdmin(body) {
    body.appendChild(h('p', { class: 'small' }, 'Loading…'));
    sb.rpc('club_agm_topics_admin', { p_meeting: state.agm.meeting.id }).then(function (r) {
      body.textContent = '';
      if (r.error) { body.appendChild(h('p', { class: 'err' }, words(r.error))); return; }
      var rows = r.data || [], manage = !!state.agm.can_manage;
      var f = state.topicFilter, cnt = function (st) { return rows.filter(function (t) { return st === 'all' || t.status === st; }).length; };
      var redraw = function () { body.textContent = ''; drawConcernsAdmin(body); };
      body.appendChild(h('div', { class: 'filters', role: 'group', 'aria-label': 'Show topics' }, [['all', 'All'], ['submitted', 'Submitted'], ['on_agenda', 'Added to Agenda'], ['addressed', 'Addressed'], ['withdrawn', 'Withdrawn']].map(function (t) {
        return h('button', { type: 'button', 'aria-pressed': String(f === t[0]), onclick: function () { state.topicFilter = t[0]; redraw(); } }, t[1] + ' (' + cnt(t[0]) + ')');
      })));
      var shown = rows.filter(function (t) { return f === 'all' || t.status === f; });
      if (!shown.length) body.appendChild(h('p', { 'data-testid': 'topics-empty' }, rows.length ? 'No topics match.' : 'No topics submitted yet.'));
      shown.forEach(function (t) {
        var row = h('div', { class: 'arow', 'data-testid': 'topic-row' },
          h('div', { class: 'who' }, h('b', {}, t.subject)),
          h('div', { class: 'chips' }, chip(TOPIC_CHIP[t.status], TOPIC[t.status]), h('span', { class: 'small' }, t.member_name + ' · ' + timeText(t.created_at) + (t.edited ? ' · edited ' + timeText(t.updated_at) : ''))),
          h('div', { class: 'topic-details' }, t.details));
        if (manage && t.status !== 'withdrawn') row.appendChild(h('div', { class: 'checkin', role: 'group', 'aria-label': 'Status of ' + t.subject },
          [['submitted', 'Submitted'], ['on_agenda', 'Add to agenda'], ['addressed', 'Addressed']].map(function (s) {
            return h('button', { type: 'button', class: 'small-btn ' + (t.status === s[0] ? 'btn-rdr' : 'btn-line'), 'aria-pressed': String(t.status === s[0]), onclick: function () {
              sb.rpc('set_club_agm_topic_status', { p_topic: t.topic_id, p_status: s[0] }).then(function (x) { if (x.error) return status(words(x.error), true); status('"' + t.subject + '": ' + TOPIC[s[0]] + '.'); redraw(); });
            } }, s[1]);
          })));
        if (t.status === 'withdrawn') row.appendChild(h('div', { class: 'small' }, 'The member withdrew this topic.'));
        body.appendChild(row);
      });
    });
  }
  function drawNominationsAdmin(body) {
    body.appendChild(h('p', { class: 'small' }, 'Loading…'));
    sb.rpc('club_agm_nominations_admin', { p_meeting: state.agm.meeting.id }).then(function (r) {
      body.textContent = '';
      if (r.error) { body.appendChild(h('p', { class: 'err' }, words(r.error))); return; }
      body.appendChild(h('p', { class: 'small' }, 'Nominations prepare the candidate list. They never change who holds an office: that is decided by the vote at the AGM.'));
      (r.data.offices || []).forEach(function (o) {
        var n = function (st) { return o.nominations.filter(function (x) { return x.status === st; }).length; };
        var card = h('section', { class: 'card-panel office-card', 'data-testid': 'admin-office-' + o.office },
          h('h3', {}, o.label), h('div', {}, 'Current Officer: ', h('b', {}, officerName(o.office, o.current_officer))),
          h('div', { class: 'small', 'data-testid': 'office-counts' }, 'Accepted ' + n('accepted') + ' · Awaiting acceptance ' + n('awaiting_acceptance') + ' · Declined ' + n('declined') + ' · Withdrawn ' + n('withdrawn')));
        if (!o.nominations.length) card.appendChild(h('p', { class: 'small' }, 'No nominations yet.'));
        o.nominations.forEach(function (x) {
          card.appendChild(h('div', { class: 'arow', 'data-testid': 'nomination-row' },
            h('div', { class: 'who' }, h('b', {}, x.nominee)),
            h('div', { class: 'chips' }, chip(NOM_CHIP[x.status], NOM[x.status]), chip('rsvp', x.self_nominated ? 'Self nomination' : 'Member nomination')),
            x.nominated_by.length ? h('div', { class: 'small' }, 'Nominated by ' + x.nominated_by.join(', ')) : null,
            h('div', { class: 'small' }, timeText(x.created_at) + (x.responded_at && x.status !== 'awaiting_acceptance' ? ' · answered ' + timeText(x.responded_at) : ''))));
        });
        body.appendChild(card);
      });
    });
  }
  function checkIn(r, st, v) {
    sb.rpc('set_club_meeting_attendance', { p_meeting: state.agm.meeting.id, p_membership: r.membership_id, p_status: st }).then(function (x) {
      if (x.error) return status(words(x.error), true);
      status(r.full_name + ': ' + ATTEND[st] + '.');
      loadAgmRows().then(function (y) { if (!y.error) { state.agmRows = y.data.filter(function (z) { return z.membership_status !== 'removed'; }); drawAgmAdmin(v); } });
    });
  }
  function videoForm() {
    var box = h('section', { class: 'card-panel', 'data-testid': 'video-form' }, h('h3', {}, 'Video meeting link'), h('p', { class: 'small' }, 'Shown only to signed-in Reavers members.'));
    var link = h('input', { class: 'browser-default', id: 'vid-link', placeholder: 'https://…', inputmode: 'url' });
    var det = h('input', { class: 'browser-default', id: 'vid-details', maxlength: '500', placeholder: 'Passcode or dial-in (optional)' });
    var err = h('p', { class: 'err', role: 'alert' });
    var btn = h('button', { type: 'button', class: 'btn-rdr' }, 'Save video link');
    sb.rpc('club_meeting_admin_info', { p_meeting: state.agm.meeting.id }).then(function (r) { if (!r.error) { link.value = r.data.video_link || ''; det.value = r.data.video_details || ''; } });
    btn.addEventListener('click', function () {
      err.textContent = '';
      sb.rpc('set_club_meeting_video', { p_meeting: state.agm.meeting.id, p_link: link.value.trim() || null, p_details: det.value.trim() || null }).then(function (r) {
        if (r.error) { err.textContent = words(r.error); return; }
        status('Video link saved.'); refreshAgm();
      });
    });
    box.appendChild(h('label', { class: 'fld' }, 'Link', link)); box.appendChild(h('label', { class: 'fld' }, 'Details', det)); box.appendChild(err); box.appendChild(btn);
    return box;
  }

  function renderProxies(v) {
    if (!state.agm || !state.agm.meeting) { v.appendChild(h('p', {}, 'No AGM is scheduled.')); return; }
    v.appendChild(h('p', { class: 'small' }, 'Loading…'));
    sb.rpc('club_meeting_proxy_list', { p_meeting: state.agm.meeting.id }).then(function (r) {
      v.textContent = '';
      if (r.error) { v.appendChild(h('p', { class: 'err' }, words(r.error))); return; }
      var active = r.data.filter(function (p) { return p.status === 'active'; }), ended = r.data.filter(function (p) { return p.status !== 'active'; });
      v.appendChild(h('p', { class: 'small' }, 'Documented proxy authority only. Nothing here casts or counts a vote. A proxy is valid when both members are eligible to vote and the holder has not given away their own vote.'));
      var byHolder = {};
      active.forEach(function (p) { (byHolder[p.holder_name] = byHolder[p.holder_name] || { eligible: p.holder_eligible, valid: 0, all: [] }).all.push(p); if (p.valid) byHolder[p.holder_name].valid++; });
      v.appendChild(h('h3', {}, 'Proxy holders'));
      var holders = Object.keys(byHolder).sort();
      if (!holders.length) v.appendChild(h('p', {}, 'No proxies yet.'));
      holders.forEach(function (n) {
        var x = byHolder[n];
        v.appendChild(h('div', { class: 'arow', 'data-testid': 'proxy-holder-row' }, h('div', { class: 'who' }, h('b', {}, n)),
          h('div', { class: 'small' }, 'Own vote: ' + (x.eligible ? 'eligible' : 'NOT eligible') + ' · Proxy authority held: ' + x.valid + ' valid'),
          h('ul', { class: 'hist' }, x.all.map(function (p) { return h('li', {}, 'From ' + p.grantor_name + ' — ', p.valid ? chip('can', 'Valid') : chip('cannot', 'Not valid'), p.problem ? ' ' + p.problem : '', h('small', {}, ' · authorized ' + timeText(p.authorized_at))); }))));
      });
      if (ended.length) {
        v.appendChild(h('h3', {}, 'Changed or cancelled'));
        v.appendChild(h('ul', { class: 'hist' }, ended.map(function (p) { return h('li', {}, p.grantor_name + ' → ' + p.holder_name + ': ' + p.status + (p.end_reason ? ' (' + p.end_reason + ')' : '') + ', ' + timeText(p.ended_at)); })));
      }
    });
  }

  // ---------------------------------------------------------------- printable AGM voting list (live, or a saved official record)
  function renderPrint(v) {
    if (!state.agm || !state.agm.meeting) { v.appendChild(h('p', {}, 'No AGM is scheduled.')); return; }
    var a = state.agm, bar = h('div', { class: 'row-btns no-print' });
    v.appendChild(bar);
    var out = h('div', { 'data-testid': 'agm-print' }, h('p', { class: 'small' }, 'Loading…'));
    v.appendChild(out);
    bar.appendChild(h('button', { type: 'button', class: 'btn-line', onclick: function () { window.print(); } }, 'Print'));
    if (a.can_manage) bar.appendChild(h('button', { type: 'button', class: 'btn-rdr', onclick: function () {
      if (!window.confirm('Save the official AGM record now? It keeps a frozen copy of this list that later changes cannot alter.')) return;
      sb.rpc('record_club_meeting_snapshot', { p_meeting: a.meeting.id }).then(function (r) { if (r.error) return status(words(r.error), true); status('Official AGM record saved.'); go('print'); });
    } }, 'Save official AGM record'));
    Promise.all([loadAgmRows(), sb.rpc('club_meeting_proxy_list', { p_meeting: a.meeting.id }), sb.rpc('club_meeting_records', { p_meeting: a.meeting.id })]).then(function (rs) {
      out.textContent = '';
      if (rs[0].error || rs[1].error) { out.appendChild(h('p', { class: 'err' }, words(rs[0].error || rs[1].error))); return; }
      var records = rs[2].error ? [] : rs[2].data;
      if (records.length) {
        var pick = h('select', { class: 'browser-default no-print', 'aria-label': 'Show' }, h('option', { value: '' }, 'Live list (now)'),
          records.map(function (rec) { return h('option', { value: String(rec.id) }, 'Saved record: ' + timeText(rec.recorded_at) + ' by ' + rec.recorded_by_name); }));
        pick.addEventListener('change', function () {
          var rec = records.filter(function (x) { return String(x.id) === pick.value; })[0];
          body.textContent = '';
          body.appendChild(rec ? votingList(rec.snapshot.members, rec.snapshot.proxies, 'Saved official record, ' + timeText(rec.recorded_at) + ', by ' + rec.recorded_by_name) : votingList(rs[0].data, rs[1].data, 'Live list printed ' + timeText(new Date().toISOString())));
        });
        out.appendChild(h('label', { class: 'fld no-print', style: 'max-width:360px' }, 'Which list', pick));
      }
      var body = h('div', {}, votingList(rs[0].data, rs[1].data, 'Live list printed ' + timeText(new Date().toISOString())));
      out.appendChild(body);
    });
  }
  function votingList(members, proxies, note) {
    var a = state.agm, live = members.filter(function (m) { return m.membership_status !== 'removed'; });
    var byName = function (x, y) { return x.full_name.localeCompare(y.full_name); };
    var eligible = live.filter(function (m) { return m.eligible; }).sort(byName), notEligible = live.filter(function (m) { return !m.eligible; }).sort(byName);
    var present = function (s) { return live.filter(function (m) { return m.attendance === s; }).sort(byName); };
    var valid = proxies.filter(function (p) { return p.status === 'active' && p.valid; });
    var list = function (rows, fn) { return rows.length ? h('ol', { class: 'agm-list' }, rows.map(fn)) : h('p', { class: 'small' }, 'None.'); };
    return h('div', { class: 'print-list' },
      h('h2', { class: 'print-title' }, 'Red Deer Reavers ' + a.meeting.year + ' AGM: voting list'),
      h('p', { class: 'small' }, a.meeting.local_date + ', ' + a.meeting.local_time + ' · ' + note),
      h('p', { class: 'agm-count' }, h('b', { 'data-testid': 'print-eligible-count' }, String(eligible.length)), ' eligible voters · ', String(present('present_in_person').length + present('present_video').length), ' present · ', String(valid.length), ' valid proxies'),
      h('h3', {}, 'Eligible voters'),
      list(eligible, function (m) { return h('li', {}, m.full_name, ' — ', m.attendance ? ATTEND[m.attendance] : 'not checked in', m.valid_proxies_held ? ' · holds ' + m.valid_proxies_held + ' valid prox' + (m.valid_proxies_held === 1 ? 'y' : 'ies') : ''); }),
      h('h3', {}, 'Present in person'), list(present('present_in_person'), function (m) { return h('li', {}, m.full_name + (m.eligible ? '' : ' (not eligible to vote)')); }),
      h('h3', {}, 'Present by video'), list(present('present_video'), function (m) { return h('li', {}, m.full_name + (m.eligible ? '' : ' (not eligible to vote)')); }),
      h('h3', {}, 'Valid proxies'), list(valid.slice().sort(function (x, y) { return x.holder_name.localeCompare(y.holder_name); }), function (p) { return h('li', {}, p.holder_name + ' holds the proxy of ' + p.grantor_name); }),
      h('h3', {}, 'Not eligible to vote'), notEligible.length ? h('ul', { class: 'agm-out' }, notEligible.map(function (m) { return h('li', {}, h('b', {}, m.full_name), h('span', {}, m.reasons.join(' · '))); })) : h('p', { class: 'small' }, 'None.'),
      h('h3', {}, 'No response'), list(live.filter(function (m) { return !m.response; }).sort(byName), function (m) { return h('li', {}, m.full_name); }));
  }

  document.addEventListener('DOMContentLoaded', function () { if (window.M) window.M.Sidenav.init(document.querySelectorAll('.sidenav')); });
})();
