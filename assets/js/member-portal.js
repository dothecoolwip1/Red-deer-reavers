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
  var T = document.body.classList.contains('portal-t');   // members-t.html: the portal is the whole page (app bar, pill tabs, toast status, vote-now bar)
  var statusTimer = null;
  var state = { session: null, profile: null, team: null, overview: null, agm: null, view: null, year: null, roster: null, filter: 'all', search: '',
    duesFor: null, agmRows: null, agmFilter: 'all', agmSearch: '', proxyPick: false, recovery: false, loading: false,
    leader: null, agmx: null, agmxError: '', topicForm: null, topicNotice: '', nomMode: null, nomOffice: null, nomTarget: '', nomNotice: '', agmSection: 'people', topicFilter: 'all',
    votes: null, votesError: '', voteTimer: null, voteForm: null, ballotsFor: null, ballots: null };

  var MEMBERSHIP = { pending: 'Pending', active: 'Active', inactive: 'Inactive', removed: 'Removed' };
  var DUES = { unpaid: 'Unpaid', paid: 'Paid', waived: 'Waived', gear_contribution: 'Gear contribution' };
  var RSVP = { in_person: 'In Person', video: 'Video Call', proxy: 'Voting by Proxy', not_attending: 'Not Attending' };
  var RSVP_DONE = { in_person: 'Attending In Person', video: 'Attending by Video Call', proxy: 'Voting by Proxy', not_attending: 'Not Attending' };
  var ATTEND = { present_in_person: 'Present in person', present_video: 'Present by video', absent: 'Absent' };
  var INTERESTS = [['fighter', 'Fighter'], ['volunteer', 'Volunteer / helper'], ['fan', 'Supporter / fan'], ['captain', 'Team captain'], ['organizer', 'Event organizer']];
  var MIN_PASSWORD = 8;
  var membershipChannel = null;

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
  function status(msg, isErr) {
    var s = $('status'); s.textContent = msg || ''; s.className = isErr ? 'err' : '';
    if (T) { clearTimeout(statusTimer); if (msg && !isErr && !/…$/.test(msg)) statusTimer = setTimeout(function () { if (s.textContent === msg) s.textContent = ''; }, 6000); }
  }
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
  (function () {
    var rb = $('refresh'); if (!rb) return;
    rb.addEventListener('click', function () { rb.classList.add('spin'); status('Refreshing…'); reload(); setTimeout(function () { rb.classList.remove('spin'); }, 1500); });
  })();

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
    if (!session) { state.recovery = false; watchMembership(null); forgetFighterNudge(before); renderAll(); return; }
    if (before !== session.user.id) setTimeout(load, 0); else renderAll();
  });
  sb.auth.getSession().then(function (r) {
    if (r.error && /code|verifier|flow/i.test(String(r.error.message))) status('This link was opened in a different browser or app. Your email is confirmed: sign in below with your email and password.', true);
    if (!r.data.session) renderAll();
  });

  function renderAll() {
    var signedIn = !!state.session;
    var adminNote = $('admin-note'); if (adminNote) adminNote.hidden = signedIn || new URLSearchParams(window.location.search).get('view') !== 'agm-admin';
    $('signed-out').hidden = signedIn;
    $('new-password').hidden = !(signedIn && state.recovery);
    $('signed-in').hidden = !signedIn || state.recovery;
    $('lede').hidden = signedIn;
    document.querySelectorAll('[data-when=in]').forEach(function (el) { el.hidden = !signedIn; });
    if (T && !signedIn) updateVoteNow();
    if (!signedIn) { $('view').textContent = ''; state.overview = null; state.agm = null; state.agmx = null; state.profile = null; state.team = null; state.votes = null; stopVotePolling(); }
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
    watchMembership(uid);
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
          if (params.get('view') === 'agm-admin' && !rs[0].data.can_view_roster) status('Admin sign in: this account is not a current executive, so there are no admin tools. Your member page is shown instead.');
          render();
          loadLeader(false); loadAgmx(); loadVotes();
          fighterNudge();
          if (myMembership()) ensureReaversPush(false);
        });
      });
    }).catch(function (x) { state.loading = false; status(words(x), true); });
  }
  function reload() { state.loading = false; state.overview = null; state.agmRows = null; state.agmx = null; load(); }
  function watchMembership(uid) {
    if (membershipChannel) { sb.removeChannel(membershipChannel); membershipChannel = null; }
    if (!uid) return;
    membershipChannel = sb.channel('reavers-membership-' + uid)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'club_memberships', filter: 'user_id=eq.' + uid }, function (payload) {
        var before = payload.old && payload.old.status, after = payload.new && payload.new.status;
        if (before === 'pending' && after === 'active') {
          var approvalTitle = 'Red Deer Reavers Membership Approved';
          var approvalBody = 'Your membership has been approved. Welcome to the Red Deer Reavers!';
          status(approvalBody);
          try {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(approvalTitle, { body: approvalBody });
            }
          } catch (e) {}
          state.view = 'mine';
          window.setTimeout(function () { reload(); }, 1200);
        } else {
          reload();
        }
      })
      .subscribe();
  }
  function b64ToBytes(s) {
    var pad = '='.repeat((4 - (s.length % 4)) % 4);
    var raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  function ensureReaversPush(ask) {
    if (!state.session || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return Promise.resolve(false);
    var permission = Notification.permission;
    var getPermission = ask && permission === 'default' ? Notification.requestPermission() : Promise.resolve(permission);
    return getPermission.then(function (p) {
      if (p !== 'granted') return false;
      return Promise.all([
        navigator.serviceWorker.register('reavers-sw.js', { scope: './members' }),   // relative: works at the site root (Vercel) and under /Red-deer-reavers/ (GitHub Pages)
        sb.rpc('push_public_key')
      ]).then(function (rs) {
        var reg = rs[0], keyRes = rs[1];
        if (keyRes.error || !keyRes.data) return false;
        return reg.pushManager.getSubscription().then(function (sub) {
          if (sub) return sub;
          return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(keyRes.data) });
        }).then(function (sub) {
          var json = sub.toJSON(), keys = json.keys || {};
          if (!sub.endpoint || !keys.p256dh || !keys.auth) return false;
          return sb.rpc('register_push_device', {
            p_endpoint: sub.endpoint,
            p_p256dh: keys.p256dh,
            p_auth: keys.auth,
            p_label: 'Red Deer Reavers approval alerts'
          }).then(function (r) { return !r.error; });
        });
      });
    }).catch(function () { return false; });
  }
  function approvalAlertControl() {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    var wrap = h('div', { class: 'approval-alert' });
    if (Notification.permission === 'granted') {
      wrap.appendChild(h('p', { class: 'small' }, '🔔 Approval alerts are enabled on this device.'));
      return wrap;
    }
    if (Notification.permission === 'denied') {
      wrap.appendChild(h('p', { class: 'small' }, 'Approval alerts are blocked in this browser. You can allow notifications in your browser/site settings.'));
      return wrap;
    }
    var btn = h('button', { type: 'button', class: 'btn-line small-btn' }, '🔔 Notify me when I’m approved');
    var msg = h('span', { class: 'small' });
    btn.addEventListener('click', function () {
      busy(btn, true); msg.textContent = '';
      ensureReaversPush(true).then(function (ok) {
        busy(btn, false);
        if (ok) { btn.textContent = '✓ Approval alerts enabled'; btn.disabled = true; msg.textContent = ' We’ll let you know when your membership is approved.'; }
        else msg.textContent = ' Notifications were not enabled.';
      });
    });
    wrap.appendChild(btn); wrap.appendChild(msg);
    return wrap;
  }
  function myMembership() { var o = state.overview; return o ? (o.memberships || []).filter(function (x) { return x.year === o.current_year; })[0] || null : null; }
  function currentYear() { var o = state.overview; return o ? (o.years || []).filter(function (y) { return y.year === o.current_year; })[0] || null : null; }

  // ---------------------------------------------------------------- BuhurtOS fighter profile nudge
  // A Reavers member whose account has no BuhurtOS fighter profile yet gets one small notice. The check is BuhurtOS's own my_fighter_id():
  // it reads fighter_accounts for auth.uid() only (the same link the executive's member roster uses) and can never answer for anyone else.
  // A fighter profile is forged when the team captain accepts a join request (BuhurtOS /team-manager?join=), or claimed at /claim-profile.
  // "Maybe Later" lasts for this browser session; signing out forgets it, so a later sign-in may remind again until the profile exists.
  var NUDGE_KEY = 'rdr-fighter-nudge-later:';
  var nudgeCheckedFor = null;
  // Red deer antlers over a Reavers shield with crossed swords. Fixed artwork, no data.
  var CREST = '<svg viewBox="0 0 64 84" width="50" height="66" aria-hidden="true" focusable="false">' +
    '<g fill="none" stroke="#4f5865" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M26 18 C22 13 19 9 18 2"/><path d="M21.5 11 C17 10 13 8 10 4"/><path d="M19.2 6 L14.5 2.5"/>' +
      '<path d="M38 18 C42 13 45 9 46 2"/><path d="M42.5 11 C47 10 51 8 54 4"/><path d="M44.8 6 L49.5 2.5"/></g>' +
    '<path d="M32 15 L59 24 V46 C59 64 46 75 32 81 C18 75 5 64 5 46 V24 Z" fill="#800080" stroke="#FFA500" stroke-width="3"/>' +
    '<path d="M32 21 L53 28 V46 C53 60 43 69 32 74 C21 69 11 60 11 46 V28 Z" fill="none" stroke="#d9a5d9" stroke-width="1" opacity=".55"/>' +
    '<g stroke="#e6e9ee" stroke-width="3.2" stroke-linecap="round"><path d="M19 33 L45 61"/><path d="M45 33 L19 61"/></g>' +
    '<g stroke="#FFA500" stroke-width="3.2" stroke-linecap="round"><path d="M38 58 L48 52"/><path d="M26 58 L16 52"/></g>' +
    '<g fill="#FFA500"><circle cx="48.5" cy="63.5" r="2.6"/><circle cx="15.5" cy="63.5" r="2.6"/></g></svg>';
  function laterSet(uid) { try { return sessionStorage.getItem(NUDGE_KEY + uid) === '1'; } catch (e) { return false; } }
  function hideFighterNudge() { var n = $('fighter-nudge'); n.hidden = true; n.textContent = ''; }
  function forgetFighterNudge(uid) {
    nudgeCheckedFor = null; hideFighterNudge();
    if (uid) try { sessionStorage.removeItem(NUDGE_KEY + uid); } catch (e) {}
  }
  function fighterNudge() {
    var uid = state.session && state.session.user.id, m = myMembership();
    if (!uid || !m || m.status === 'removed' || laterSet(uid) || nudgeCheckedFor === uid) return;
    nudgeCheckedFor = uid;
    sb.rpc('my_fighter_id').then(function (r) {
      // Linked (or the check failed): say nothing. Only a definite "no fighter profile" shows the notice.
      if (r.error || r.data || !state.session || state.session.user.id !== uid) return;
      showFighterNudge(uid);
    });
  }
  function showFighterNudge(uid) {
    var box = $('fighter-nudge'); box.textContent = '';
    var crest = h('div', { class: 'fn-crest' }); crest.innerHTML = CREST;   // fixed artwork, no data
    var later = function () {
      try { sessionStorage.setItem(NUDGE_KEY + uid, '1'); } catch (e) {}
      hideFighterNudge();
    };
    box.appendChild(h('aside', { class: 'fighter-nudge', role: 'region', 'aria-labelledby': 'fn-title', 'data-testid': 'fighter-nudge' },
      crest,
      h('div', { class: 'fn-body' },
        h('h2', { id: 'fn-title' }, h('span', { class: 'fn-x', 'aria-hidden': 'true' }, '⚔️'), 'Hold, brave Reaver!'),
        h('p', {}, 'Your Reavers account is ready, but your BuhurtOS fighter profile hasn\'t been forged yet.'),
        h('p', {}, 'Forge your fighter profile so your name can link to your BuhurtOS page, events, stats, teams and fight history.'),
        h('div', { class: 'fn-acts' },
          h('a', { class: 'btn-rdr fn-go', href: CFG.appUrl + '/team-manager?join=' + encodeURIComponent(CFG.teamSlug), rel: 'noopener', 'data-testid': 'fighter-nudge-go' },
            h('span', { class: 'fn-x', 'aria-hidden': 'true' }, '⚔️'), 'Forge My Fighter Profile'),
          h('button', { type: 'button', class: 'btn-line fn-later', onclick: later, 'data-testid': 'fighter-nudge-later' }, 'Maybe Later')),
        h('p', { class: 'fn-note' }, 'Already fought before? ',
          h('a', { href: CFG.appUrl + '/claim-profile', rel: 'noopener', 'data-testid': 'fighter-nudge-claim' }, 'Claim your existing profile')))));
    box.hidden = false;
  }

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
    if (o.can_view_roster) tabs.push(['members', 'Members', 'exec'], ['agm-admin', 'AGM admin', 'exec'], ['proxies', 'Proxies', 'exec'], ['print', 'AGM voting list', 'exec'], ['history', 'Dues history', 'exec']);
    if (!tabs.some(function (t) { return t[0] === state.view; }) && !(state.view === 'leadership' && leaderMeeting())) state.view = tabs[0][0];
    var nav = $('tabs'); nav.textContent = ''; nav.hidden = false;
    tabs.forEach(function (t) {
      if (T && t[2] === 'exec' && !nav.querySelector('.tab-sep')) nav.appendChild(h('span', { class: 'tab-sep', 'aria-hidden': 'true' }, 'Executive'));
      nav.appendChild(h('button', { type: 'button', 'aria-selected': String(state.view === t[0]), onclick: function () { state.view = t[0]; state.proxyPick = false; render(); } }, t[1]));
    });
    var v = $('view'); v.textContent = '';
    if (!o.enabled) { v.appendChild(h('p', {}, 'Membership is not set up yet.')); return; }
    if (state.view !== 'agm' && state.agmx && (state.agmx.to_respond || []).length) v.appendChild(nominatedBanner());
    if (mine && state.view !== 'join') v.appendChild(glanceCard());
    if (mine && state.view !== 'leadership' && leaderMeeting()) v.appendChild(leaderCard());
    ({ join: renderJoin, mine: renderMine, agm: renderAgm, leadership: renderLeadership, members: renderMembers, 'agm-admin': renderAgmAdmin, proxies: renderProxies, print: renderPrint, history: renderHistory })[state.view](v);
    var vm0 = voteMeeting(); if (vm0 && state.votesMeeting !== vm0.id && !state.votesLoading) loadVotes();
    if (T) updateVoteNow();
  }
  function go(view) { if ((view === 'leadership') !== (state.view === 'leadership')) { state.votes = null; state.votesMeeting = null; } state.view = view; state.proxyPick = false; render(); window.scrollTo(0, 0); }


  // ================================================================ leadership meeting (invited members only)
  // club_leadership_meeting returns meeting: null unless this member is on the invite list, so nobody else sees that it exists.
  function leaderMeeting() { return state.leader && state.leader.meeting ? state.leader.meeting : null; }
  function voteMeeting() { var lm = leaderMeeting(); return (state.view === 'leadership' && lm) ? lm : (state.agm && state.agm.meeting ? state.agm.meeting : null); }
  function loadLeader(redraw) {
    if (!state.team || !state.session) return Promise.resolve();
    return sb.rpc('club_leadership_meeting', { p_team: state.team.id }).then(function (r) {
      state.leader = r.error ? null : r.data;
      if (redraw !== false) render();
    });
  }
  function leaderMe() { var L = state.leader; return L ? (L.attendees || []).filter(function (x) { return x.membership_id === L.my_membership_id; })[0] : null; }
  function leaderTile() {
    var mt = leaderMeeting(); if (!mt) return null;
    var me = leaderMe();
    return h('button', { type: 'button', class: 'tile-b agm', 'data-testid': 'tile-leadership', onclick: function () { go('leadership'); } },
      h('div', { class: 'tile-k' }, 'Leadership meeting'), h('div', { class: 'tile-big' }, mt.started ? 'Underway' : mt.local_time),
      h('div', { class: 'small' }, mt.title + ' · ' + mt.local_date.replace(/^[A-Za-z]+, /, '')),
      h('div', { class: 'tile-foot' }, me && me.attendance ? chip('active', ATTEND[me.attendance]) : chip('pending', 'Invited: open')));
  }
  function leaderCard() {
    var mt = leaderMeeting(); if (!mt) return null;
    return h('section', { class: 'card-panel', 'data-testid': 'leadership-card' },
      h('h3', {}, mt.title), h('p', {}, (mt.started ? 'Underway now · ' : '') + mt.local_date + ' · ' + mt.local_time + ' · invited members only'),
      h('button', { type: 'button', class: 'btn-rdr', onclick: function () { go('leadership'); } }, 'Open the leadership meeting'));
  }
  function renderLeadership(v) {
    var L = state.leader, mt = leaderMeeting();
    if (!mt) { v.appendChild(h('p', {}, 'No leadership meeting is open for you.')); return; }
    var box = h('section', { class: 'card-panel', 'data-testid': 'leadership' },
      h('div', { class: 'agm-head' }, h('div', { class: 'agm-kicker' }, 'RED DEER REAVERS LEADERSHIP'), h('h2', {}, mt.title)),
      h('p', {}, mt.local_date + ' · ' + mt.local_time + (mt.location ? ' · ' + mt.location : '') + (mt.started ? ' · underway' : '')),
      h('div', { class: 'held' }, h('b', {}, 'Invited only. '), 'This meeting is shown to the ' + (L.attendees || []).length + ' people invited to it and nobody else. Nothing decided here is binding: anything needing approval goes to a vote at the AGM.'),
      mt.notes_link ? h('p', {}, h('a', { href: mt.notes_link, target: '_blank', rel: 'noopener' }, mt.notes_label || 'Shared notes for this meeting')) : null);
    var att = h('section', { class: 'card-panel', 'data-testid': 'leadership-attendance' }, h('h3', {}, 'Who is here'),
      L.can_manage ? h('p', { class: 'small' }, 'President, Secretary or Treasurer: mark each person as they join.') : null);
    (L.attendees || []).forEach(function (x) {
      var row = h('div', { class: 'arow' + (x.attendance && x.attendance !== 'absent' ? ' here' : ''), 'data-testid': 'leadership-row' },
        h('div', { class: 'who' }, h('b', {}, x.name), x.offices && x.offices.length ? h('span', { class: 'small' }, ' · ' + x.offices.join(', ')) : null),
        h('div', { class: 'chips' }, x.attendance ? chip(x.attendance === 'absent' ? '' : 'active', ATTEND[x.attendance]) : chip('pending', 'Not checked in')));
      if (L.can_manage) row.appendChild(h('div', { class: 'checkin', role: 'group', 'aria-label': 'Attendance of ' + x.name },
        [['present_in_person', 'Here'], ['present_video', 'Video'], ['absent', 'Absent']].map(function (s) {
          return h('button', { type: 'button', class: 'small-btn ' + (x.attendance === s[0] ? 'btn-rdr' : 'btn-line'), 'aria-pressed': String(x.attendance === s[0]), onclick: function () {
            sb.rpc('set_club_meeting_attendance', { p_meeting: mt.id, p_membership: x.membership_id, p_status: s[0] }).then(function (r) {
              if (r.error) return status(words(r.error), true);
              status(x.name + ': ' + ATTEND[s[0]] + '.'); loadLeader();
            });
          } }, s[1]);
        })));
      att.appendChild(row);
    });
    var ag = h('section', { class: 'card-panel', 'data-testid': 'leadership-agenda' }, h('h3', {}, 'Agenda'));
    if (!(L.agenda || []).length) ag.appendChild(h('p', { class: 'small' }, 'No agenda items yet.'));
    (L.agenda || []).forEach(function (t) { ag.appendChild(h('div', { class: 'arow' }, h('div', { class: 'who' }, h('b', {}, t.subject)), h('div', { class: 'topic-details' }, t.details))); });
    v.appendChild(box); v.appendChild(att); v.appendChild(ag);
    v.appendChild(votingPanel());
    if (L.can_manage) { var adm = h('section', { class: 'card-panel', 'data-testid': 'leadership-vote-admin' }, h('h3', {}, 'Run a vote in this meeting'), h('p', { class: 'small' }, 'Questions here belong to the leadership meeting only: they never appear in the AGM.')); var admBody = h('div'); adm.appendChild(admBody); v.appendChild(adm); drawVotingAdmin(admBody, false); }
    v.appendChild(h('button', { type: 'button', class: 'btn-line', onclick: function () { go('mine'); } }, 'Back'));
  }

  // ---------------------------------------------------------------- at a glance: where I stand and the one thing to do next
  function glanceCard() {
    var m = myMembership(), a = state.agm, vt = state.votes, row = h('div', { class: 'glance-row' });
    var openQ = vt ? (vt.questions || []).filter(function (q) { return q.status === 'open'; }).length : 0;
    row.appendChild(h('span', {}, 'Membership ', chip(m.status, MEMBERSHIP[m.status])));
    row.appendChild(h('span', {}, m.year + ' fee ', m.fee_waived ? chip('waived', 'Waived') : chip(m.dues_status, DUES[m.dues_status])));
    row.appendChild(h('span', {}, 'Voting ', chip(m.eligible ? 'can' : 'cannot', m.eligible ? 'Can vote' : 'Cannot vote')));
    if (a && a.meeting) {
      var resp = a.rsvp && a.rsvp.response;
      row.appendChild(h('span', {}, 'AGM ', resp ? chip('rsvp', RSVP[resp] + (resp === 'proxy' && a.proxy ? ': ' + a.proxy.holder_name : '')) : chip('pending', 'No answer yet')));
    }
    var next = null;
    if (openQ) next = h('button', { type: 'button', class: 'btn-rdr', onclick: function () { go('agm'); var el = $('vote-panel'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } }, openQ === 1 ? 'A vote is open: vote now' : openQ + ' votes are open: vote now');
    else if (a && a.meeting && !(a.rsvp && a.rsvp.response) && state.view !== 'agm' && m.status !== 'removed') next = h('button', { type: 'button', class: 'btn-rdr', onclick: function () { go('agm'); } }, 'Say how you will attend the AGM');
    else if (m.status === 'active' && !m.fee_waived && m.dues_status === 'unpaid') next = h('span', { class: 'small' }, 'Pay your dues to the Treasurer to vote.');
    var head = null, quick = null;
    if (T) {
      var offices = (state.overview.offices || []).map(function (x) { return x.label; });
      head = h('div', { class: 'glance-name' }, m.full_name, h('small', {}, (offices.length ? offices.join(', ') + ' · ' : '') + m.year + ' member'));
      quick = h('div', { class: 'glance-quick' },
        state.view !== 'agm' && a && a.meeting ? h('button', { type: 'button', class: 'btn-line', onclick: function () { go('agm'); } }, 'The AGM') : null,
        h('button', { type: 'button', class: 'btn-line', onclick: inviteMember }, 'Invite a member'));
    }
    return h('section', { class: 'glance', 'data-testid': 'glance', 'aria-label': 'At a glance' }, head, row, next, quick);
  }
  // share the public members page (the sign-in / join page), never this signed-in view
  function inviteMember() {
    var url = HERE.replace(/members-t\.html$/, 'members.html'), text = 'Join the Red Deer Reavers or sign in to the members area: ' + url;
    if (navigator.share) { navigator.share({ title: 'Red Deer Reavers members', text: 'Join the Red Deer Reavers or sign in to the members area', url: url }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { status('Link copied: ' + url); }, function () { status('Members page: ' + url); });
    else status('Members page: ' + url);
  }

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
      CFG.bylawsUrl ? h('p', { class: 'small' }, h('a', { href: CFG.bylawsUrl, target: '_blank', rel: 'noopener noreferrer', 'data-testid': 'bylaws-link-join' }, 'Read the bylaws (PDF, opens in a new tab)')) : null,
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
      m.status === 'pending' ? approvalAlertControl() : null,
      m.status === 'active' && !m.fee_waived && m.dues_status === 'unpaid' ? h('p', { class: 'small' }, 'Pay your ' + money(year ? year.dues_cents : null) + ' dues to the Treasurer; they record it here.') : null,
      h('button', { type: 'button', class: 'btn-rdr', onclick: function () { go('agm'); } }, 'Register for the 2026 AGM')));
  }

  // ================================================================ the AGM (member)
  function agmHeader(a) {
    var mt = a.meeting;
    return h('div', { class: 'agm-head', 'data-testid': 'agm-head' },
      h('div', { class: 'agm-kicker' }, 'RED DEER REAVERS ' + mt.year + ' AGM'),
      h('div', { class: 'agm-when' }, mt.local_date), h('div', { class: 'agm-when' }, mt.local_time + ' (' + (mt.timezone === 'America/Edmonton' ? 'Mountain time, Red Deer' : mt.timezone) + ')'),
      mt.location ? h('div', { class: 'small' }, 'Location: ' + mt.location) : null,
      T ? countdown(mt) : null, T ? agmTools(mt) : null);
  }
  function countdown(mt) {
    var ms = new Date(mt.starts_at).getTime() - Date.now();
    if (mt.started || ms <= 0) return ms > -6 * 3600e3 ? h('div', { class: 'agm-countdown' }, 'Underway now') : null;
    var d = Math.floor(ms / 864e5), hr = Math.floor((ms % 864e5) / 36e5), mn = Math.floor((ms % 36e5) / 6e4);
    return h('div', { class: 'agm-countdown', 'data-testid': 'agm-countdown' }, d >= 1 ? 'In ' + d + ' day' + (d === 1 ? '' : 's') + (hr ? ' ' + hr + ' h' : '') : hr >= 1 ? 'In ' + hr + ' h ' + mn + ' min' : 'In ' + mn + ' min');
  }
  function icsText(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, function (c) { return '\\' + c; }); }
  function agmTools(mt) {
    var start = new Date(mt.starts_at), end = new Date(start.getTime() + 2 * 3600e3);
    var stamp = function (d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    var title = mt.title || ('Red Deer Reavers ' + mt.year + ' AGM'), page = HERE.replace(/members-t\.html$/, 'members.html');
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Red Deer Reavers//Members//EN', 'BEGIN:VEVENT', 'UID:agm-' + mt.id + '@red-deer-reavers', 'DTSTAMP:' + stamp(new Date()),
      'DTSTART:' + stamp(start), 'DTEND:' + stamp(end), 'SUMMARY:' + icsText(title), mt.location ? 'LOCATION:' + icsText(mt.location) : null, 'DESCRIPTION:' + icsText('RSVP and vote on the members page: ' + page), 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
    var g = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) + '&dates=' + stamp(start) + '/' + stamp(end) + (mt.location ? '&location=' + encodeURIComponent(mt.location) : '') + '&details=' + encodeURIComponent('RSVP and vote on the members page: ' + page);
    var lnk = function (attrs, text) { attrs.class = 'btn-line'; attrs.style = 'display:inline-flex;align-items:center;text-decoration:none'; return h('a', attrs, text); };
    return h('div', { class: 'agm-tools', 'data-testid': 'agm-tools' },
      lnk({ href: 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics), download: 'reavers-agm-' + mt.year + '.ics' }, 'Add to calendar'),
      lnk({ href: g, target: '_blank', rel: 'noopener noreferrer' }, 'Google Calendar'),
      mt.location ? lnk({ href: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mt.location), target: '_blank', rel: 'noopener noreferrer' }, 'Map') : null);
  }
  function renderAgm(v) {
    var a = state.agm;
    if (!a || !a.meeting) { v.appendChild(h('p', {}, 'No AGM is scheduled yet.')); return; }
    if (!state.voteTimer) pollVotes();
    var card = h('section', { class: 'card-panel', 'data-testid': 'agm-member' }, agmHeader(a));
    v.appendChild(card);
    // the help is only an explanation: if it ever failed to build, the RSVP and everything else below must still work
    try { v.appendChild(agmHelp()); } catch (e) { if (window.console) console.warn('help not shown', e); }
    v.appendChild(votingPanel());
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
    sb.rpc('club_meeting_member_view', { p_team: state.team.id }).then(function (r) { if (!r.error) state.agm = r.data; loadVotes(false).then(render); });
  }

  // ================================================================ the AGM: concerns and executive nominations (member)
  var OFFICE = { president: 'President', secretary: 'Secretary', treasurer: 'Treasurer' };
  var TOPIC = { submitted: 'Submitted', on_agenda: 'Added to Agenda', addressed: 'Addressed', withdrawn: 'Withdrawn' };
  var TOPIC_CHIP = { submitted: 'pending', on_agenda: 'rsvp', addressed: 'active', withdrawn: '' };
  var NOM = { awaiting_acceptance: 'Awaiting acceptance', accepted: 'Accepted', declined: 'Declined', withdrawn: 'Withdrawn' };
  var NOM_CHIP = { awaiting_acceptance: 'pending', accepted: 'active', declined: 'cannot', withdrawn: '' };
  function agmName() { return state.agm.meeting.year + ' Red Deer Reavers AGM'; }
  // DISPLAY ONLY. Every place that names an office holder goes through officerName(). The name comes from the officer records / the database.
  //  * The database may label an office whose holder has no BuhurtOS account yet as "Kedrixx (no currently active account)": that awkward system
  //    wording is shown as "Kedrixx (account not currently linked)". The data itself is not changed.
  //  * If an office has no name at all, OFFICER_NO_ACCOUNT supplies the name below; otherwise it reads "not assigned".
  // None of this decides anything or grants any permission, and the fallback names are ignored the moment an office has a real holder.
  var NOT_LINKED = ' (account not currently linked)';
  var OFFICER_NO_ACCOUNT = { president: 'Kedrixx', treasurer: 'Carmalee' };
  function officerName(office, name) {
    if (name) return String(name).replace(/\s*\(no currently active account\)\s*$/i, NOT_LINKED);
    return OFFICER_NO_ACCOUNT[office] ? OFFICER_NO_ACCOUNT[office] + NOT_LINKED : 'not assigned';
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
  function fetchRoster() {
    return Promise.all([
      sb.rpc('club_member_roster', { p_team: state.team.id, p_year: state.year }),
      sb.rpc('club_member_profile_links', { p_team: state.team.id, p_year: state.year })
    ]).then(function (rs) {
      if (rs[0].error) return rs[0];
      var links = {};
      (rs[1].data || []).forEach(function (x) { if (x.fighter_id) links[x.membership_id] = x.fighter_id; });
      (rs[0].data || []).forEach(function (x) { x.fighter_id = links[x.membership_id] || null; });
      return rs[0];
    });
  }
  function buhurtosProfileLink(r) {
    if (!r || !r.fighter_id) return h('b', {}, r.full_name);
    return h('a', {
      href: CFG.appUrl + '/fighters/' + encodeURIComponent(r.fighter_id),
      target: '_blank',
      rel: 'noopener noreferrer',
      title: 'Open ' + r.full_name + ' on BuhurtOS'
    }, h('b', {}, r.full_name));
  }
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
    if (T) v.appendChild(h('p', { class: 'row-btns', style: 'margin:8px 0 12px' }, h('button', { type: 'button', class: 'btn-line small-btn', 'data-testid': 'members-csv', onclick: function () {
      downloadCsv('reavers-members-' + state.year + '.csv', ['Member', 'Membership', state.year + ' fee', 'Can vote', 'Why not', 'Executive role'],
        live.slice().sort(function (x, y) { return x.full_name.localeCompare(y.full_name); }).map(function (r) { return [r.full_name, MEMBERSHIP[r.status], waived() && r.dues_status === 'unpaid' ? 'Fee waived' : DUES[r.dues_status], r.eligible ? 'yes' : 'no', (r.reasons || []).join('; '), (r.offices || []).join(', ')]; }));
    } }, 'Download CSV (' + live.length + ' members)')));
    var list = h('div', { role: 'table', 'aria-label': state.year + ' members' },
      h('div', { class: 'mrow head', role: 'row' }, h('span', {}, 'Member'), h('span', {}, 'Membership'), h('span', {}, state.year + ' fee'), h('span', {}, 'Voting'), h('span', {}, 'Actions')));
    var shown = rows.filter(keep);
    if (!rows.length) v.appendChild(h('p', {}, 'Nobody has applied for ' + state.year + ' yet.'));
    else if (!shown.length) v.appendChild(h('p', {}, 'Nobody matches.'));
    shown.forEach(function (r) {
      list.appendChild(h('div', { class: 'mrow' + (r.status === 'pending' ? ' pending' : ''), role: 'row', 'data-testid': 'member-row' },
        h('span', { class: 'who', role: 'cell' }, buhurtosProfileLink(r), r.offices && r.offices.length ? h('small', {}, r.offices.join(', ')) : null),
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
    if (state.agmSection === 'voting') { drawVotingAdmin(v.appendChild(h('div', {}))); return; }
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
    return h('div', { class: 'filters', role: 'group', 'aria-label': 'AGM admin section' }, [['people', 'People and check-in'], ['concerns', 'Concerns'], ['nominations', 'Nominations'], ['voting', 'Voting']].map(function (t) {
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

  // ================================================================ the AGM vote: questions, ballots, results (member and executive)
  // Members see opened questions and vote (their own ballot, plus one for each member whose proxy they hold); results show once a question is
  // closed. The executive opens and closes questions in AGM admin › Voting. Ballots are secret: the executive sees who has voted, never how anyone voted.
  var KIND = { election: 'Election', motion: 'Motion' };
  function stopVotePolling() { if (state.voteTimer) { clearInterval(state.voteTimer); state.voteTimer = null; } }
  function loadVotes(redraw) {
    var vm = voteMeeting();
    if (!vm) { state.votes = null; state.votesMeeting = null; return Promise.resolve(); }
    if (state.votesMeeting !== vm.id) { state.votes = null; state.votesMeeting = vm.id; }
    state.votesLoading = true;
    return sb.rpc('club_question_list', { p_meeting: vm.id }).then(function (r) {
      state.votesLoading = false;
      if (state.votesMeeting !== vm.id) return;   // the view moved to another meeting while this was in flight
      var before = state.votes ? (state.votes.questions || []).filter(function (q) { return q.status === 'open'; }).map(function (q) { return q.id; }) : null;
      if (r.error) { state.votesError = (r.error.code === '42501') ? '' : words(r.error); state.votes = null; }
      else { state.votes = r.data; state.votesError = ''; }
      if (redraw !== false) { swap('vote-panel', votingPanel); var adm = $('vote-admin'); if (adm) drawVotingAdmin(adm.parentNode, true); }
      if (T) { if (before) noticeOpened(before); updateVoteNow(); }
    });
  }
  function pollVotes() {
    stopVotePolling();
    state.voteTimer = setInterval(function () {
      if ((document.hidden && !(T && buzzOn())) || !state.session || !voteMeeting()) return;
      if (!$('vote-panel') && !$('vote-admin')) { stopVotePolling(); return; }
      loadVotes();
    }, 8000);
  }
  function optionLabel(q, key) { var o = (q.options || []).filter(function (x) { return x.key === key; })[0]; return o ? o.label : key; }
  function resultBars(q) {
    var t = q.tally; if (!t) return null;
    var total = Number(t.total) || 0, best = 0;
    (t.options || []).forEach(function (o) { if (o.key !== 'abstain') best = Math.max(best, Number(o.votes) || 0); });
    var box = h('div', { class: 'vote-results', 'data-testid': 'vote-results' });
    (t.options || []).forEach(function (o) {
      var n = Number(o.votes) || 0, pct = total ? Math.round(n * 100 / total) : 0, lead = q.status === 'closed' && n > 0 && n === best && o.key !== 'abstain';
      box.appendChild(h('div', { class: 'vote-row' + (lead ? ' lead' : '') },
        h('div', { class: 'vote-row-head' }, h('b', {}, o.label), h('span', {}, n + (n === 1 ? ' vote' : ' votes') + (total ? ' · ' + pct + '%' : ''))),
        h('div', { class: 'vote-bar' }, h('div', { class: 'vote-fill', style: 'width:' + pct + '%' }))));
    });
    box.appendChild(h('p', { class: 'small' }, total + ' of ' + (t.eligible != null ? t.eligible : q.eligible_count) + ' eligible ballots' + (q.status === 'closed' ? ' · closed ' + timeText(q.closed_at) : ' so far')));
    return box;
  }
  function ballotChoice(q, membershipId) { var b = (q.my_ballots || []).filter(function (x) { return x.membership_id === membershipId; })[0]; return b ? b.choice : null; }
  function castBallot(q, voter, key, btnBox) {
    Array.prototype.forEach.call(btnBox.querySelectorAll('button'), function (b) { b.disabled = true; });
    sb.rpc('cast_club_ballot', { p_question: q.id, p_choice: key, p_for_membership: voter.self ? null : voter.membership_id }).then(function (r) {
      if (r.error) { status(words(r.error), true); Array.prototype.forEach.call(btnBox.querySelectorAll('button'), function (b) { b.disabled = false; }); return; }
      status((voter.self ? 'Your vote' : 'Vote for ' + voter.name) + ' on "' + q.title + '": ' + optionLabel(q, key) + '.');
      loadVotes();
    });
  }
  // ---------------------------------------------------------------- test layout: buzz when a vote opens, the vote-now bar, CSV downloads
  var BUZZ_KEY = 'rdr-vote-buzz';
  function buzzOn() { try { return localStorage.getItem(BUZZ_KEY) === '1'; } catch (e) { return false; } }
  function setBuzz(on) {
    try { localStorage.setItem(BUZZ_KEY, on ? '1' : '0'); } catch (e) { /* ignore */ }
    if (on) {
      if (navigator.vibrate) navigator.vibrate(80);
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().then(function () { swap('vote-panel', votingPanel); });
      status('You will be buzzed when a vote opens while this page is open on your phone.');
    } else status('Buzz is off.');
  }
  function buzzRow() {
    var on = buzzOn(), perm = ('Notification' in window) ? Notification.permission : 'unsupported';
    return h('div', { class: 'buzz', 'data-testid': 'buzz' },
      h('button', { type: 'button', class: 'btn-line', 'aria-pressed': String(on), onclick: function () { setBuzz(!on); swap('vote-panel', votingPanel); } }, on ? 'Buzz when a vote opens: on' : 'Buzz me when a vote opens'),
      h('span', { class: 'small' }, on ? (perm === 'granted' ? 'Vibrates and shows a notification, even with the screen off the page.' : perm === 'denied' ? 'Notifications are blocked in your browser: you still get the vibration while this page is open.' : 'Vibrates while this page is open.') : 'Keep this page open on the night: it checks for a new question every few seconds.'));
  }
  function noticeOpened(beforeIds) {
    if (!buzzOn() || !state.votes) return;
    var fresh = (state.votes.questions || []).filter(function (q) { return q.status === 'open' && beforeIds.indexOf(q.id) < 0; });
    if (!fresh.length) return;
    if (navigator.vibrate) navigator.vibrate([220, 120, 220]);
    if ('Notification' in window && Notification.permission === 'granted') {
      fresh.forEach(function (q) {
        try { var n = new Notification('Vote open: ' + q.title, { body: 'Red Deer Reavers AGM: cast your ballot now.', tag: 'rdr-vote-' + q.id, icon: 'assets/crest-96.webp' }); n.onclick = function () { window.focus(); go('agm'); }; } catch (e) { /* ignore */ }
      });
    }
  }
  function pendingOpen() {
    var vt = state.votes; if (!vt) return [];
    return (vt.questions || []).filter(function (q) { return q.status === 'open' && (vt.voters || []).some(function (v) { return v.can && !ballotChoice(q, v.membership_id); }); });
  }
  function updateVoteNow() {
    var bar = $('vote-now'); if (!bar) return;
    var qs = state.session ? pendingOpen() : [], panel = $('vote-panel'), seen = false;
    if (panel && (state.view === 'agm' || state.view === 'leadership')) { var rc = panel.getBoundingClientRect(); seen = rc.top < window.innerHeight - 120 && rc.bottom > 140; }
    if (!qs.length || seen) { bar.hidden = true; document.body.classList.remove('has-vote-now'); return; }
    bar.textContent = '';
    bar.appendChild(h('button', { type: 'button', 'data-testid': 'vote-now', onclick: function () {
      var lm = leaderMeeting(), target = lm && state.votesMeeting === lm.id ? 'leadership' : 'agm';
      if (state.view !== target) go(target);
      setTimeout(function () { var p = $('vote-panel'); if (p) p.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
    } }, h('span', {}, qs.length === 1 ? qs[0].title : qs.length + ' votes are open', h('br'), h('small', {}, 'Your ballot is not in yet')), h('span', { class: 'go' }, 'Vote now')));
    bar.hidden = false; document.body.classList.add('has-vote-now');
  }
  if (T) { var voteNowTick = false; window.addEventListener('scroll', function () { if (voteNowTick) return; voteNowTick = true; requestAnimationFrame(function () { voteNowTick = false; updateVoteNow(); }); }, { passive: true }); }
  function downloadCsv(name, header, rows) {
    var esc = function (x) { x = x == null ? '' : String(x); return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
    var text = [header].concat(rows).map(function (r) { return r.map(esc).join(','); }).join('\r\n');
    var a = h('a', { href: 'data:text/csv;charset=utf-8,\ufeff' + encodeURIComponent(text), download: name });
    document.body.appendChild(a); a.click(); a.remove();
  }
  function questionCard(q, vt) {
    var open = q.status === 'open';
    var card = h('section', { class: 'card-panel vote-q ' + q.status, 'data-testid': 'vote-question' },
      h('div', { class: 'chips' }, chip(open ? 'active' : '', open ? 'Open for voting' : 'Closed'), chip('rsvp', q.kind === 'election' ? 'Election: ' + OFFICE[q.office] : 'Motion')),
      h('h3', {}, q.title), q.details ? h('p', { class: 'vote-details' }, q.details) : null);
    if (open) {
      (vt.voters || []).forEach(function (voter) {
        var mine = ballotChoice(q, voter.membership_id);
        var block = h('div', { class: 'vote-block', 'data-testid': 'vote-block' },
          h('div', { class: 'vote-who' }, h('b', {}, voter.self ? 'Your vote' : 'Vote for ' + voter.name + ' (proxy)'), mine ? chip('active', 'Voted: ' + optionLabel(q, mine)) : chip('pending', 'Not voted yet')));
        if (!voter.can) { block.appendChild(h('p', { class: 'small err' }, voter.why ? voter.why.charAt(0).toUpperCase() + voter.why.slice(1) + '.' : 'Cannot vote.')); card.appendChild(block); return; }
        var btns = h('div', { class: 'rsvp-opts', role: 'group', 'aria-label': (voter.self ? 'Your vote' : 'Vote for ' + voter.name) + ' on ' + q.title });
        (q.options || []).forEach(function (o) {
          btns.appendChild(h('button', { type: 'button', class: 'rsvp-opt', 'aria-pressed': String(mine === o.key), onclick: function () { castBallot(q, voter, o.key, btns); } }, o.label));
        });
        block.appendChild(btns);
        if (mine) block.appendChild(h('p', { class: 'small' }, 'You can change this until the question closes.'));
        card.appendChild(block);
      });
      card.appendChild(h('p', { class: 'small', 'data-testid': 'ballots-in' }, q.ballots_in + ' of ' + q.eligible_count + ' eligible ballots in.'));
      if (q.tally) card.appendChild(resultBars(q));
    } else {
      var rb = resultBars(q); if (rb) card.appendChild(rb);
    }
    return card;
  }
  function votingPanel() {
    var vm = voteMeeting(), vt = state.votes;
    var box = h('section', { id: 'vote-panel', class: 'card-panel', 'data-testid': 'vote-panel' }, h('h2', {}, 'Voting'));
    if (!vm) return h('div', { id: 'vote-panel' });
    if (state.votesError) { box.appendChild(h('p', { class: 'err' }, state.votesError)); return box; }
    if (!vt) { box.appendChild(h('p', { class: 'small' }, 'Checking for open questions…')); return box; }
    var qs = (vt.questions || []).filter(function (q) { return q.status !== 'draft'; });
    var open = qs.filter(function (q) { return q.status === 'open'; }), closed = qs.filter(function (q) { return q.status === 'closed'; });
    if (T && vt.is_member) box.appendChild(buzzRow());
    if (!qs.length) { box.appendChild(h('p', {}, 'No question is open yet. When the executive opens a vote during the AGM, it appears here: keep this page open on the night.')); if (!vt.is_member) box.appendChild(h('p', { class: 'small' }, 'Only members vote.')); return box; }
    if (vt.is_member && !vt.eligible && !vt.gave_proxy) box.appendChild(h('p', { class: 'small err' }, 'You are not currently eligible to vote: see your voting status above.'));
    if (vt.gave_proxy) box.appendChild(h('p', { class: 'small' }, 'You gave your proxy for this AGM, so your proxy holder votes for you. Cancel the proxy above to vote yourself.'));
    open.forEach(function (q) { box.appendChild(questionCard(q, vt)); });
    if (closed.length) { box.appendChild(h('h3', {}, 'Results')); closed.forEach(function (q) { box.appendChild(questionCard(q, vt)); }); }
    return box;
  }
  // ---------------------------------------------------------------- executive: write, open and close questions; the executive: who has voted (never how)
  function drawVotingAdmin(body, keep) {
    var a = state.agm, vt = state.votes;
    body.textContent = '';
    var wrap = h('div', { id: 'vote-admin', 'data-testid': 'vote-admin' });
    body.appendChild(wrap);
    if (!vt) { wrap.appendChild(h('p', { class: 'small' }, 'Loading…')); loadVotes(false).then(function () { drawVotingAdmin(body, true); }); if (!keep) pollVotes(); return; }
    var manage = !!vt.can_manage;
    wrap.appendChild(h('p', { class: 'small' }, 'Open a question when the meeting reaches it; members vote on their phones (their own ballot, plus one for each proxy they hold). Close it to freeze the result. Members see counts only once a question is closed. Ballots are secret: you can see who has voted, never how anyone voted.'));
    if (manage) wrap.appendChild(questionForm());
    var qs = vt.questions || [];
    if (!qs.length) wrap.appendChild(h('p', { 'data-testid': 'vote-admin-empty' }, 'No questions yet.'));
    qs.forEach(function (q) {
      var row = h('section', { class: 'card-panel vote-q ' + q.status, 'data-testid': 'vote-admin-q' },
        h('div', { class: 'chips' }, chip(q.status === 'open' ? 'active' : q.status === 'draft' ? 'pending' : '', q.status === 'open' ? 'Open' : q.status === 'draft' ? 'Draft (members do not see it)' : 'Closed'), chip('rsvp', q.kind === 'election' ? 'Election: ' + OFFICE[q.office] : 'Motion')),
        h('h3', {}, q.title), q.details ? h('p', { class: 'vote-details' }, q.details) : null,
        h('p', { class: 'small' }, 'Choices: ' + (q.options || []).map(function (o) { return o.label; }).join(' · ')));
      if (q.status !== 'draft') { var rb = resultBars(q); if (rb) row.appendChild(rb); }
      var acts = h('div', { class: 'row-btns' });
      if (manage && q.status === 'draft') {
        acts.appendChild(h('button', { type: 'button', class: 'btn-rdr', onclick: function () { if (!window.confirm('Open "' + q.title + '" for voting now?')) return; runQ('open_club_question', q, 'Open for voting.'); } }, 'Open for voting'));
        acts.appendChild(h('button', { type: 'button', class: 'btn-line', onclick: function () { state.voteForm = { id: q.id, kind: q.kind, office: q.office, title: q.title, details: q.details || '' }; drawVotingAdmin(body, true); } }, 'Edit'));
        acts.appendChild(h('button', { type: 'button', class: 'btn-line', onclick: function () { if (!window.confirm('Remove the draft "' + q.title + '"?')) return; runQ('delete_club_question', q, 'Removed.'); } }, 'Remove'));
      }
      if (manage && q.status === 'open') acts.appendChild(h('button', { type: 'button', class: 'btn-rdr', onclick: function () { if (!window.confirm('Close "' + q.title + '"? No more ballots after this; the result is final.')) return; runQ('close_club_question', q, 'Closed: the result is final.'); } }, 'Close and count'));
      if ((manage || vt.can_see_ballots) && q.status !== 'draft') acts.appendChild(h('button', { type: 'button', class: 'btn-line', 'data-testid': 'see-ballots', onclick: function () {
        if (state.ballotsFor === q.id) { state.ballotsFor = null; state.ballots = null; drawVotingAdmin(body, true); return; }
        sb.rpc('club_question_ballots', { p_question: q.id }).then(function (r) { if (r.error) return status(words(r.error), true); state.ballotsFor = q.id; state.ballots = r.data; drawVotingAdmin(body, true); });
      } }, state.ballotsFor === q.id ? 'Hide turnout' : 'Who has voted'));
      row.appendChild(acts);
      if (state.ballotsFor === q.id && state.ballots) {
        var bl = state.ballots, list = h('div', { class: 'ballot-list', 'data-testid': 'ballot-list' }, h('p', { class: 'small' }, 'Turnout only: who has a ballot in. How anyone voted is never shown to anyone. Every look is recorded in the audit log.'));
        (bl.ballots || []).forEach(function (b) {
          list.appendChild(h('div', { class: 'arow' }, h('div', { class: 'who' }, h('b', {}, b.voter), b.cast_by ? h('small', {}, ' · cast by ' + b.cast_by + ' (proxy)') : null),
            h('div', { class: 'chips' }, chip('active', 'Ballot in'), h('span', { class: 'small' }, timeText(b.changed_at) + (b.changes > 0 ? ' · changed ' + b.changes + (b.changes === 1 ? ' time' : ' times') : '')))));
        });
        if ((bl.not_voted || []).length) list.appendChild(h('p', { class: 'small' }, 'Not voted: ' + bl.not_voted.join(', ')));
        if (!(bl.ballots || []).length) list.appendChild(h('p', { class: 'small' }, 'No ballots yet.'));
        row.appendChild(list);
      }
      wrap.appendChild(row);
    });
    if (!keep) pollVotes();
  }
  function runQ(fn, q, done) {
    sb.rpc(fn, { p_question: q.id }).then(function (r) { if (r.error) return status(words(r.error), true); status('"' + q.title + '": ' + done); loadVotes(); });
  }
  function questionForm() {
    var f = state.voteForm || { kind: 'motion', office: 'president', title: '', details: '' };
    var kind = h('select', { class: 'browser-default', id: 'q-kind' }, h('option', { value: 'motion', selected: f.kind === 'motion' }, 'Motion (Yes / No / Abstain)'), h('option', { value: 'election', selected: f.kind === 'election' }, 'Election (from the accepted nominations)'));
    var office = h('select', { class: 'browser-default', id: 'q-office' }, ['president', 'secretary', 'treasurer'].map(function (o) { return h('option', { value: o, selected: f.office === o }, OFFICE[o]); }));
    var title = h('input', { class: 'browser-default', id: 'q-title', maxlength: '160', placeholder: 'e.g. Approve the 2026 budget', value: f.title || '' });
    var details = h('textarea', { class: 'browser-default', id: 'q-details', maxlength: '2000', rows: '3', placeholder: 'What members are voting on (optional)' }, f.details || '');
    var officeLbl = h('label', { class: 'fld' }, 'Office', office);
    var titleLbl = h('label', { class: 'fld' }, 'Title', title);
    var sync = function () { var el = kind.value === 'election'; officeLbl.hidden = !el; if (el && !title.value) title.placeholder = 'Election: ' + OFFICE[office.value] + ' (default)'; };
    kind.addEventListener('change', sync); office.addEventListener('change', sync); if (f.id) kind.disabled = true; sync();
    var err = h('p', { class: 'err', role: 'alert' });
    var save = h('button', { type: 'button', class: 'btn-rdr', 'data-testid': 'q-save' }, f.id ? 'Save changes' : 'Add question');
    save.addEventListener('click', function () {
      err.textContent = '';
      var call = f.id ? sb.rpc('update_club_question', { p_question: f.id, p_title: title.value.trim(), p_details: details.value.trim() || null })
        : sb.rpc('create_club_question', { p_meeting: voteMeeting().id, p_kind: kind.value, p_title: title.value.trim(), p_details: details.value.trim() || null, p_office: kind.value === 'election' ? office.value : null });
      call.then(function (r) { if (r.error) { err.textContent = words(r.error); return; } state.voteForm = null; status(f.id ? 'Question updated.' : 'Question added as a draft. Open it when the meeting reaches it.'); loadVotes(); });
    });
    var box = h('section', { class: 'card-panel', 'data-testid': 'q-form' }, h('h3', {}, f.id ? 'Edit the question' : 'Add a question'),
      h('label', { class: 'fld' }, 'Kind', kind), officeLbl, titleLbl, h('label', { class: 'fld' }, 'Details', details), err,
      h('div', { class: 'row-btns' }, save, f.id ? h('button', { type: 'button', class: 'btn-line', onclick: function () { state.voteForm = null; var adm = $('vote-admin'); if (adm) drawVotingAdmin(adm.parentNode, true); } }, 'Cancel') : null));
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
    if (T) bar.appendChild(h('button', { type: 'button', class: 'btn-line', 'data-testid': 'agm-csv', onclick: function () {
      loadAgmRows().then(function (r) {
        if (r.error) return status(words(r.error), true);
        downloadCsv('reavers-agm-' + a.meeting.year + '.csv', ['Member', 'Membership', 'Fee', 'Can vote', 'Why not', 'Response', 'Proxy holder', 'Checked in', 'Valid proxies held'],
          (r.data || []).filter(function (m) { return m.membership_status !== 'removed'; }).sort(function (x, y) { return x.full_name.localeCompare(y.full_name); }).map(function (m) {
            return [m.full_name, MEMBERSHIP[m.membership_status] || m.membership_status, m.dues_status ? (DUES[m.dues_status] || m.dues_status) : '', m.eligible ? 'yes' : 'no', (m.reasons || []).join('; '), m.response ? RSVP[m.response] : '', m.proxy_holder_name || '', m.attendance ? ATTEND[m.attendance] : '', m.valid_proxies_held || 0];
          }));
      });
    } }, 'Download CSV'));
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
