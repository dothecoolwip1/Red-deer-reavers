/*
 * Red Deer Reavers members area (members.html): account, joining the Reavers, your membership, club meetings and voting, and the executive's tools.
 *
 * ONE account. This page uses the same Supabase Auth project as BuhurtOS, so creating an account here creates the BuhurtOS account itself
 * (one auth.users row, one profile), and an existing BuhurtOS account signs in here unchanged. There is no Reavers password database, no
 * second profile and nothing is synchronised. No token is ever put in a URL or passed between sites.
 *
 * Meetings. Every meeting (the AGM, a general meeting, a leadership meeting, a voting session) is a club_meetings row with its own link
 * (?view=meeting&meeting=<id>), its own RSVP, agenda, topics, votes and records. The page reads club_meetings_list and club_meeting_view;
 * where the database does not have those yet it falls back to the AGM-only reads (club_meeting_member_view, club_leadership_meeting).
 * Old links keep working: ?view=agm opens the current AGM, ?view=leadership the leadership meeting, ?view=agm-admin the AGM's executive tools.
 *
 * Nothing here is a security boundary. The BuhurtOS database decides everything (club_* and club_meeting_* functions): a member acts only
 * on their own membership, RSVP, proxy and ballots; only the club's current President, Secretary or Treasurer change dues, membership
 * status, check-in, meetings and questions. Ballots are secret: nobody can read how anyone voted. All database text is inserted with textContent.
 */
(function () {
  'use strict';
  var CFG = window.BUHURTOS_CFG || window.BUHURTOS;
  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
  });
  var HERE = window.location.origin + window.location.pathname;
  var $ = function (id) { return document.getElementById(id); };
  var T = true;   // the portal is the whole page: toast status, vote-now bar, CSV downloads
  var statusTimer = null;
  var state = { session: null, profile: null, team: null, overview: null, view: null, year: null, roster: null, filter: 'all', search: '',
    duesFor: null, agmRows: null, agmFilter: 'all', agmSearch: '', proxyPick: false, recovery: false, loading: false,
    // meetings: the list, the meeting being viewed (member page) and the meeting being run (executive page)
    meetings: null, meetingsError: '', legacy: false, meetingId: null, meeting: null, meetingError: '', meetingLoading: null,
    admId: null, adm: null, admError: '', agmSection: 'people', meetingForm: null, inviteePick: null, meetingsFilter: 'upcoming',
    agmxBy: {}, agmxError: {}, topicForm: null, topicNotice: '', nomMode: null, nomOffice: null, nomTarget: '', nomNotice: '',
    votes: null, votesError: '', voteTimer: null, votesMeeting: null, votesLoading: false, voteForm: null, ballotsFor: null, ballots: null, listTimer: null,
    notices: null, noticeEdit: null, noticeArchive: false, fighterId: undefined };

  var MEMBERSHIP = { pending: 'Pending', active: 'Active', inactive: 'Inactive', removed: 'Removed' };
  var DUES = { unpaid: 'Unpaid', paid: 'Paid', waived: 'Waived', gear_contribution: 'Gear contribution' };
  var RSVP = { in_person: 'In Person', video: 'Video Call', proxy: 'Voting by Proxy', not_attending: 'Not Attending' };
  var RSVP_DONE = { in_person: 'Attending In Person', video: 'Attending by Video Call', proxy: 'Voting by Proxy', not_attending: 'Not Attending' };
  var ATTEND = { present_in_person: 'Present in person', present_video: 'Present by video', absent: 'Absent' };
  var INTERESTS = [['fighter', 'Fighter'], ['volunteer', 'Volunteer / helper'], ['fan', 'Supporter / fan'], ['captain', 'Team captain'], ['organizer', 'Event organizer']];
  var KINDS = { agm: 'Annual General Meeting', general: 'General meeting', leadership: 'Leadership meeting', vote: 'Vote', special: 'Leadership meeting' };
  var KIND_SHORT = { agm: 'AGM', general: 'Meeting', leadership: 'Leadership', vote: 'Vote', special: 'Leadership' };
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

  // ================================================================ signed in / signed out
  function renderAll() {
    var signedIn = !!state.session;
    var adminNote = $('admin-note'); if (adminNote) adminNote.hidden = signedIn || new URLSearchParams(window.location.search).get('view') !== 'agm-admin';
    $('signed-out').hidden = signedIn;
    $('new-password').hidden = !(signedIn && state.recovery);
    $('signed-in').hidden = !signedIn || state.recovery;
    $('lede').hidden = signedIn;
    document.querySelectorAll('[data-when=in]').forEach(function (el) { el.hidden = !signedIn; });
    document.body.classList.toggle('no-tabs', !signedIn || state.recovery || !state.overview);
    var exec = $('exec-btn'); if (exec && !signedIn) exec.hidden = true;
    if (!signedIn) {
      $('view').textContent = ''; $('tabs').hidden = true; updateVoteNow();
      state.overview = null; state.meetings = null; state.meeting = null; state.meetingId = null; state.adm = null; state.admId = null; state.agmxBy = {}; state.agmxError = {};
      state.profile = null; state.team = null; state.votes = null; state.votesMeeting = null; state.notices = null; stopVotePolling(); stopListPolling();
    }
  }

  // ================================================================ load the signed-in person
  function load() {
    if (!state.session || state.loading) return;
    state.loading = true;
    renderAll();
    status('Loading…');
    $('who').textContent = state.session.user.email || '';
    var uid = state.session.user.id;
    watchMembership(uid);
    sb.from('profiles').select('display_name,onboarded_at,interests,city,region,country').eq('id', uid).maybeSingle().then(function (p) {
      state.profile = p.data || null;
      if (!state.profile || !state.profile.onboarded_at) { state.loading = false; status(''); return renderProfileSetup(); }
      return sb.from('teams').select('id,name,slug').eq('slug', CFG.teamSlug).maybeSingle().then(function (t) {
        if (t.error || !t.data) { state.loading = false; return status(words(t.error, 'Could not find the Red Deer Reavers in BuhurtOS.'), true); }
        state.team = t.data;
        return Promise.all([sb.rpc('club_membership_overview', { p_team: state.team.id }), loadMeetings(false)]).then(function (rs) {
          state.loading = false;
          if (rs[0].error) return status(words(rs[0].error, 'Could not load your membership.'), true);
          state.overview = rs[0].data; state.year = rs[0].data.current_year;
          status('');
          var params = new URLSearchParams(window.location.search);
          if (params.get('view') === 'agm-admin' && !rs[0].data.can_view_roster) status('Admin sign in: this account is not a current executive, so there are no admin tools. Your member page is shown instead.');
          var target = resolveRoute(params.get('view'), params.get('meeting'));
          state.view = target.view; state.meetingId = target.meetingId || null; state.admId = target.admId || null;
          try { window.history.replaceState({ view: state.view, meeting: state.meetingId, adm: state.admId }, '', routeUrl(state.view, state.meetingId || state.admId)); } catch (e) { /* ignore */ }
          render();
          var agm = agmMeeting(); if (agm && myMembership()) loadAgmx(agm.id, false).then(function () { if (state.view === 'home') render(); });
          loadFighter(); loadNotices(); startListPolling();
          if (myMembership()) ensureReaversPush(false);
        });
      });
    }).catch(function (x) { state.loading = false; status(words(x), true); });
  }
  function reload() { state.loading = false; state.overview = null; state.agmRows = null; state.meeting = null; state.adm = null; state.agmxBy = {}; load(); }
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


  // ================================================================ routes: Home, Meetings, one meeting, Account, Join, the executive's tools
  // ?view=home | meetings | meeting&meeting=<id> | account | join | notices | exec-meetings | exec-meeting&meeting=<id> | exec-members | exec-notices | exec-history
  // Older links: agm, leadership, agm-admin, proxies, print, members, history, notices-admin, me/mine, training/events/club.
  var EXEC_VIEWS = { 'exec-meetings': 'Meetings', 'exec-members': 'Members and dues', 'exec-notices': 'Notices', 'exec-history': 'Dues history' };
  function resolveRoute(view, meetingParam) {
    var mine = myMembership(), exec = state.overview && state.overview.can_view_roster;
    var agm = agmMeeting(), lead = meetingsOf('leadership').slice(-1)[0];
    switch (view) {
      case 'agm': return agm ? { view: 'meeting', meetingId: agm.id } : { view: 'meetings' };
      case 'leadership': return lead ? { view: 'meeting', meetingId: lead.id } : { view: 'meetings' };
      case 'agm-admin': case 'proxies': case 'print': if (exec) { if (view !== 'agm-admin') state.agmSection = 'records'; return agm ? { view: 'exec-meeting', admId: agm.id } : { view: 'exec-meetings' }; } return agm ? { view: 'meeting', meetingId: agm.id } : { view: 'meetings' };
      case 'members': return exec ? { view: 'exec-members' } : { view: mine ? 'home' : 'join' };
      case 'history': return exec ? { view: 'exec-history' } : { view: mine ? 'home' : 'join' };
      case 'notices-admin': return exec ? { view: 'exec-notices' } : { view: 'notices' };
      case 'me': case 'mine': return { view: 'account' };
      case 'meeting': return meetingParam ? { view: 'meeting', meetingId: meetingParam } : { view: 'meetings' };
      case 'exec-meeting': return exec && meetingParam ? { view: 'exec-meeting', admId: meetingParam } : { view: 'meetings' };
      case 'home': case 'meetings': case 'account': case 'join': case 'notices': return { view: view === 'home' && !mine ? 'join' : view };
      case 'exec-meetings': case 'exec-members': case 'exec-notices': case 'exec-history': return exec ? { view: view } : { view: mine ? 'home' : 'join' };
      default: return { view: mine ? 'home' : 'join' };
    }
  }
  function routeUrl(view, meetingId) { return window.location.pathname + '?view=' + encodeURIComponent(view) + (meetingId && (view === 'meeting' || view === 'exec-meeting') ? '&meeting=' + encodeURIComponent(meetingId) : ''); }
  function meetingUrl(id) { return HERE + '?view=meeting&meeting=' + encodeURIComponent(id); }

  function render() {
    renderAll();
    var o = state.overview, mine = myMembership();
    if (!o || !state.session) return;   // signed out (a loader can finish after a sign-out)
    var tabs = [];
    if (mine) tabs.push(['home', 'Home']); else tabs.push(['join', 'Join']);
    tabs.push(['meetings', 'Meetings']);
    var topViews = ['account', 'notices', 'meeting'];
    var isExec = state.view.indexOf('exec-') === 0;
    if (isExec && !o.can_view_roster) state.view = mine ? 'home' : 'join';
    if (!tabs.some(function (t) { return t[0] === state.view; }) && topViews.indexOf(state.view) < 0 && !isExec) state.view = tabs[0][0];
    var nav = $('tabs'); nav.textContent = ''; nav.hidden = false;
    var selected = state.view === 'meeting' ? 'meetings' : state.view;
    tabs.forEach(function (t) {
      var unread = t[0] === 'home' && state.view !== 'home' ? unreadCount() : 0;
      nav.appendChild(h('button', { type: 'button', 'aria-selected': String(selected === t[0]), 'data-nav': t[0], onclick: function () { go(t[0]); } }, icon(t[0]), h('span', {}, t[1]), unread ? h('span', { class: 'nav-badge', 'aria-label': unread + ' new notices' }, String(unread)) : null));
    });
    var execBtn = $('exec-btn'); execBtn.hidden = !o.can_view_roster; execBtn.setAttribute('aria-pressed', String(isExec));
    var acct = $('account-btn'); acct.setAttribute('aria-pressed', String(state.view === 'account'));
    var sheetList = $('exec-sheet').querySelector('.sheet-list'); sheetList.textContent = '';
    Object.keys(EXEC_VIEWS).forEach(function (k) {
      sheetList.appendChild(h('button', { type: 'button', class: 'sheet-item', 'aria-current': String(state.view === k || (k === 'exec-meetings' && state.view === 'exec-meeting')), onclick: function () { $('exec-sheet').close(); go(k); } }, icon(k), EXEC_VIEWS[k]));
    });
    var v = $('view'); v.textContent = '';
    if (!o.enabled) { v.appendChild(h('p', {}, 'Membership is not set up yet.')); return; }
    if (state.view !== 'meeting' && mine) { var nb = nominatedBanner(); if (nb) v.appendChild(nb); }
    ({ join: renderJoin, home: renderHome, meetings: renderMeetings, meeting: renderMeeting, account: renderAccount, notices: renderNotices,
      'exec-meetings': renderExecMeetings, 'exec-meeting': renderExecMeeting, 'exec-members': renderMembers, 'exec-notices': renderNoticesAdmin, 'exec-history': renderHistory })[state.view](v);
    var vm0 = voteMeeting(); if (vm0 && state.votesMeeting !== vm0.id && !state.votesLoading) loadVotes(); else if (!vm0) { stopVotePolling(); }
    updateVoteNow();
  }
  function go(view, opts) {
    opts = opts || {};
    var change = function () {
      if (view === 'meeting' && opts.meetingId) state.meetingId = opts.meetingId;
      if (view === 'exec-meeting' && opts.meetingId) { if (state.admId !== opts.meetingId) { state.adm = null; state.agmRows = null; state.voteForm = null; } state.admId = opts.meetingId; }
      if (view !== state.view || (view === 'meeting' && opts.meetingId)) { state.votes = null; state.votesMeeting = null; }
      state.view = view; state.proxyPick = false; render();
      if (opts.scrollTo) setTimeout(function () { var p = $(opts.scrollTo); if (p) p.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
      else if (!opts.keepScroll) window.scrollTo(0, 0);
    };
    if (!opts.silent) { try { window.history.pushState({ view: view, meeting: view === 'meeting' ? opts.meetingId || state.meetingId : null, adm: view === 'exec-meeting' ? opts.meetingId || state.admId : null }, '', routeUrl(view, view === 'meeting' ? opts.meetingId || state.meetingId : view === 'exec-meeting' ? opts.meetingId || state.admId : null)); } catch (e) { /* ignore */ } }
    if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && view !== state.view) document.startViewTransition(change);
    else change();
  }
  function openMeeting(id, opts) { opts = opts || {}; opts.meetingId = id; go('meeting', opts); }
  window.addEventListener('popstate', function (e) {
    if (!state.session || !state.overview) return;
    var st = e.state || {}, params = new URLSearchParams(window.location.search);
    var target = st.view ? st : resolveRoute(params.get('view'), params.get('meeting'));
    if (target.view === 'meeting') go('meeting', { silent: true, meetingId: st.meeting || target.meetingId });
    else if (target.view === 'exec-meeting') go('exec-meeting', { silent: true, meetingId: st.adm || target.admId });
    else go(target.view, { silent: true });
  });
  function tick() { if (navigator.vibrate) navigator.vibrate(10); }
  // one icon per destination (plain strokes, inherit the text colour)
  var ICONS = {
    home: 'M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z', join: 'M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z',
    meetings: 'M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 10h16M8 4v4M16 4v4', 'exec-meetings': 'M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 10h16M8 4v4M16 4v4',
    account: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    'exec-members': 'M9 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 11.5a3 3 0 1 0 0-6M21.5 20a6 6 0 0 0-5-5.9',
    'exec-notices': 'M5 4h11l3 3v13H5zM8 10h8M8 13h8M8 16h5', 'exec-history': 'M4 6h16M4 12h10M4 18h7'
  };
  function icon(name) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('class', 'nav-ico');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', ICONS[name] || ICONS.meetings); path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'currentColor'); path.setAttribute('stroke-width', '1.9'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path); return svg;
  }
  // the virtual keyboard: when it is up the bottom bar and the vote bar step aside (visualViewport is the reliable signal)
  (function () {
    var vv = window.visualViewport; if (!vv) return;
    var tickK = false;
    var check = function () { tickK = false; var gap = window.innerHeight - vv.height; document.body.classList.toggle('kbd', gap > 150); };
    vv.addEventListener('resize', function () { if (!tickK) { tickK = true; requestAnimationFrame(check); } });
  })();
  // installing the members app: Android/desktop get the browser prompt; iPhone gets the two-step instructions
  var installEvent = null, INSTALL_KEY = 'rdr-install-dismissed';
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvent = e; if (state.view === 'home' || state.view === 'account') render(); });
  window.addEventListener('appinstalled', function () { installEvent = null; status('The members app is on your home screen.'); render(); });
  function standalone() { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
  function isIOS() { return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  function installCard(compact) {
    if (standalone()) return null;
    var dismissed = false; try { dismissed = localStorage.getItem(INSTALL_KEY) === '1'; } catch (e) { /* ignore */ }
    if (compact && dismissed) return null;
    if (!installEvent && !isIOS()) return null;
    var body = installEvent
      ? h('button', { type: 'button', class: 'btn-rdr', 'data-testid': 'install-btn', onclick: function () { installEvent.prompt(); installEvent.userChoice.then(function () { installEvent = null; render(); }); } }, 'Install the members app')
      : h('p', { class: 'small', 'data-testid': 'install-ios' }, 'On iPhone: tap the ', h('b', {}, 'Share'), ' button in Safari, then ', h('b', {}, 'Add to Home Screen'), '. It opens full screen like an app and keeps you signed in.');
    return h('section', { class: 'card-panel install' + (compact ? ' compact' : ''), 'data-testid': 'install-card' },
      h('div', { class: 'install-row' }, h('img', { src: 'assets/icon-192.png', alt: '', width: '44', height: '44' }), h('div', {}, h('b', {}, 'Members on your home screen'), h('div', { class: 'small' }, 'Training, votes and the AGM one tap away, with no browser bars.'))),
      body,
      compact ? h('button', { type: 'button', class: 'btn-line small-btn', onclick: function () { try { localStorage.setItem(INSTALL_KEY, '1'); } catch (e) { /* ignore */ } render(); } }, 'Not now') : null);
  }
  function greeting() { var hr = new Date().getHours(); return hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening'; }
  function inviteMember() {
    var url = HERE, text = 'Join the Red Deer Reavers or sign in to the members area: ' + url;
    if (navigator.share) { navigator.share({ title: 'Red Deer Reavers members', text: 'Join the Red Deer Reavers or sign in to the members area', url: url }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { status('Link copied: ' + url); }, function () { status('Members page: ' + url); });
    else status('Members page: ' + url);
  }

  function voteBanner(eligible, reasons) {
    return h('div', { class: 'vote ' + (eligible ? 'yes' : 'no'), 'data-testid': 'vote-banner' },
      h('b', {}, eligible ? 'ELIGIBLE TO VOTE' : 'NOT CURRENTLY ELIGIBLE TO VOTE'),
      !eligible && reasons && reasons.length ? h('span', {}, reasons.join(' · ')) : null);
  }
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
        state.view = 'account'; reload();
      });
    });
    v.appendChild(form);
  }

  // ================================================================ meetings: the list, one meeting, Home
  function kindLabel(mt) { return KINDS[mt.kind] || 'Meeting'; }
  function meetingsOf(kind) { return (state.meetings ? state.meetings.meetings || [] : []).filter(function (m) { return m.kind === kind; }); }
  function findMeeting(id) { return (state.meetings ? state.meetings.meetings || [] : []).filter(function (m) { return m.id === id; })[0] || null; }
  function isUpcoming(m) { var end = m.ends_at ? new Date(m.ends_at).getTime() : new Date(m.starts_at).getTime() + 6 * 3600e3; return !m.cancelled && end > Date.now() - 1800e3; }
  function missingFn(err) { return !!err && (err.code === 'PGRST202' || err.code === '42883' || /could not find the function|does not exist/i.test(String(err.message || ''))); }
  function mv() { return state.meeting; }
  function am() { return state.adm; }
  function voteMeeting() {
    if (state.view === 'meeting') return state.meeting && state.meeting.meeting && state.meeting.meeting.id === state.meetingId ? state.meeting.meeting : null;
    if (state.view === 'exec-meeting') return state.adm && state.adm.meeting && state.adm.meeting.id === state.admId ? state.adm.meeting : null;
    return null;
  }
  // the list: club_meetings_list, or (older database) the AGM and the leadership meeting
  function loadMeetings(redraw) {
    if (!state.team || !state.session) return Promise.resolve();
    return sb.rpc('club_meetings_list', { p_team: state.team.id }).then(function (r) {
      if (!r.error) { state.meetings = r.data; state.meetingsError = ''; state.legacy = false; }
      else if (missingFn(r.error)) return legacyList();
      else { state.meetingsError = words(r.error); }
    }).then(function () { if (redraw !== false) { render(); } else updateVoteNow(); });
  }
  function legacyList() {
    state.legacy = true;
    return Promise.all([sb.rpc('club_meeting_member_view', { p_team: state.team.id }), sb.rpc('club_leadership_meeting', { p_team: state.team.id })]).then(function (rs) {
      var rows = [];
      if (!rs[0].error && rs[0].data && rs[0].data.meeting) { var a = rs[0].data; rows.push(legacyRow(a.meeting, 'agm', a)); state.legacyAgm = a; }
      if (!rs[1].error && rs[1].data && rs[1].data.meeting) { var L = rs[1].data; rows.push(legacyRow(L.meeting, 'leadership', null)); state.legacyLead = L; }
      state.meetings = { meetings: rows, can_view_admin: !!(state.overview && state.overview.can_view_roster), can_manage: !!(rs[0].data && rs[0].data.can_manage) };
      state.meetingsError = rs[0].error && !rows.length ? words(rs[0].error) : '';
    });
  }
  function legacyRow(mt, kind, a) {
    var m = {}; Object.keys(mt).forEach(function (k) { m[k] = mt[k]; });
    m.kind = kind; m.invite_only = kind === 'leadership'; m.cancelled = false; m.details = m.details || null; m.ends_at = m.ends_at || null;
    m.my_rsvp = a && a.rsvp ? a.rsvp.response : null; m.is_member = !!(a && a.membership) || !!myMembership(); m.invited = kind === 'leadership'; m.open_questions = 0; m.to_vote = 0;
    return m;
  }
  // one meeting: club_meeting_view, or (older database) the AGM / leadership payloads shaped the same way
  function loadMeeting(id, redraw) {
    if (!id || !state.session) return Promise.resolve();
    state.meetingLoading = id;
    var done = function (data, err) {
      if (state.meetingLoading !== id) return;
      state.meetingLoading = null;
      if (err) { state.meetingError = words(err, 'Could not open this meeting.'); state.meeting = null; }
      else { state.meeting = data; state.meetingError = ''; }
      if (redraw !== false) render();
      if (data && data.meeting && data.meeting.kind !== 'vote' && data.membership) loadAgmx(id, redraw !== false);
    };
    if (state.legacy) return Promise.resolve(legacyView(id)).then(function (d) { done(d, d ? null : { message: 'meeting not found' }); });
    return sb.rpc('club_meeting_view', { p_meeting: id }).then(function (r) {
      if (r.error && missingFn(r.error)) { state.legacy = true; return legacyList().then(function () { var d = legacyView(id); done(d, d ? null : { message: 'meeting not found' }); }); }
      done(r.data, r.error);
    });
  }
  function legacyView(id) {
    var a = state.legacyAgm, L = state.legacyLead, row = findMeeting(id);
    if (!row) return null;
    if (row.kind === 'agm' && a) { var v = {}; Object.keys(a).forEach(function (k) { v[k] = a[k]; }); v.meeting = row; v.attendees = []; v.agenda = []; v.invited = false; v.my_attendance = null; return v; }
    if (row.kind === 'leadership' && L) {
      var me = (L.attendees || []).filter(function (x) { return x.membership_id === L.my_membership_id; })[0], m = myMembership();
      return { meeting: row, fee_waived: false, membership: m ? { id: m.id || L.my_membership_id, status: m.status, full_name: m.full_name, dues_status: m.dues_status } : null, eligible: !!(m && m.eligible), reasons: m ? m.reasons || [] : [],
        rsvp: null, my_attendance: me ? me.attendance : null, proxy: null, proxies_held: [], video: { link: L.meeting.notes_link, details: L.meeting.notes_label }, proxy_candidates: [], invited: true,
        attendees: L.attendees || [], agenda: L.agenda || [], can_view_admin: !!(state.overview && state.overview.can_view_roster), can_manage: !!L.can_manage };
    }
    return null;
  }
  function refreshMeeting() { loadMeeting(state.meetingId, false).then(function () { return loadVotes(false); }).then(function () { loadMeetings(false); render(); }); }
  // the list is refreshed every 20 seconds while the page is open, so Home and the "Vote now" bar follow a vote the executive opens elsewhere
  function startListPolling() { stopListPolling(); state.listTimer = setInterval(function () { if (document.hidden || !state.session || !state.team || state.legacy) return; loadMeetings(false).then(function () { if (state.view === 'home' || state.view === 'meetings') render(); }); }, 20000); }
  function stopListPolling() { if (state.listTimer) { clearInterval(state.listTimer); state.listTimer = null; } }

  function whenShort(m) { return m.local_date.replace(/^[A-Za-z]+, /, '').replace(/, \d{4}$/, '') + ' · ' + m.local_time; }
  function meetingRow(m, opts) {
    opts = opts || {};
    var live = !m.cancelled && m.started && isUpcoming(m), chips = [];
    chips.push(chip('kind', KIND_SHORT[m.kind] || 'Meeting'));
    if (m.cancelled) chips.push(chip('bad', 'Cancelled'));
    else if (live) chips.push(chip('live', m.kind === 'vote' ? 'Open now' : 'Underway'));
    if (m.to_vote > 0) chips.push(chip('live', m.to_vote === 1 ? 'Your vote is needed' : m.to_vote + ' votes need you'));
    else if (m.open_questions > 0) chips.push(chip('active', m.open_questions === 1 ? '1 vote open' : m.open_questions + ' votes open'));
    if (m.kind !== 'vote' && m.is_member && !m.cancelled && isUpcoming(m) && !m.started) chips.push(m.my_rsvp ? chip('rsvp', RSVP_DONE[m.my_rsvp]) : chip('pending', 'RSVP needed'));
    if (m.my_attendance && m.my_attendance !== 'absent') chips.push(chip('active', 'Checked in'));
    if (m.invite_only) chips.push(chip('', opts.exec && m.invitee_count != null ? m.invitee_count + ' invited' : 'Invited only'));
    if (opts.exec && m.closed_questions > 0) chips.push(chip('', m.closed_questions + ' result' + (m.closed_questions === 1 ? '' : 's')));
    return h('button', { type: 'button', class: 'meeting-row' + (live ? ' live' : '') + (m.cancelled ? ' cancelled' : '') + (m.invite_only ? ' invite' : ''), 'data-testid': 'meeting-row', 'data-kind': m.kind,
      onclick: function () { if (opts.exec) go('exec-meeting', { meetingId: m.id }); else openMeeting(m.id); } },
      h('div', {}, h('div', { class: 'mr-title' }, m.title), h('div', { class: 'mr-when' }, whenShort(m) + (m.location ? ' · ' + m.location : ''))),
      h('span', { class: 'mr-go', 'aria-hidden': 'true' }, '›'),
      h('div', { class: 'mr-chips' }, chips));
  }

  // ---------------------------------------------------------------- Home: what needs you, the next meeting, where you stand, notices
  function renderHome(v) {
    var m = myMembership(), rows = state.meetings ? state.meetings.meetings || [] : [];
    var upcoming = rows.filter(isUpcoming), needVote = rows.filter(function (x) { return x.to_vote > 0; });
    var offices = (state.overview.offices || []).map(function (x) { return x.label; });
    var hero = h('section', { class: 'glance', 'data-testid': 'glance', 'aria-label': 'At a glance' },
      h('div', { class: 'glance-name' }, h('span', { class: 'glance-hi' }, greeting() + ','), m.full_name.split(' ')[0], h('small', {}, (offices.length ? offices.join(', ') + ' · ' : '') + m.year + ' member')),
      h('div', { class: 'glance-row' }, h('span', {}, 'Membership ', chip(m.status, MEMBERSHIP[m.status])), h('span', {}, m.year + ' fee ', m.fee_waived ? chip('waived', 'Waived') : chip(m.dues_status, DUES[m.dues_status])), h('span', {}, 'Voting ', chip(m.eligible ? 'can' : 'cannot', m.eligible ? 'Can vote' : 'Cannot vote'))),
      m.status === 'pending' ? h('p', { class: 'small' }, 'Your application is with the executive. You can already RSVP to meetings.') : null,
      m.status === 'pending' ? approvalAlertControl() : null,
      m.status === 'active' && !m.fee_waived && m.dues_status === 'unpaid' ? h('p', { class: 'small' }, 'Pay your dues to the Treasurer to vote.') : null);
    if (needVote.length) {
      var total = 0; needVote.forEach(function (x) { total += x.to_vote; });
      var card = h('section', { class: 'card-panel home-vote', 'data-testid': 'home-vote' }, h('p', { class: 'kicker' }, 'Needs you now'),
        h('h2', {}, total === 1 ? 'A vote is waiting for your ballot' : total + ' votes are waiting for your ballot'));
      needVote.forEach(function (x) { card.appendChild(h('button', { type: 'button', class: 'btn-rdr', 'data-testid': 'vote-now-home', onclick: function () { openMeeting(x.id, { scrollTo: 'vote-panel' }); } }, 'Vote now: ' + x.title)); });
      v.appendChild(card);
    }
    v.appendChild(hero);
    var next = upcoming.slice(0, 3);
    var nx = h('section', { class: 'card-panel', 'data-testid': 'home-next' }, h('div', { class: 'card-head' }, h('h2', {}, next.length ? 'Coming up' : 'Meetings'), h('button', { type: 'button', class: 'btn-line small-btn', onclick: function () { go('meetings'); } }, 'All meetings')));
    if (state.meetingsError) nx.appendChild(h('p', { class: 'err' }, state.meetingsError));
    if (!next.length) nx.appendChild(h('p', { class: 'small' }, 'Nothing is scheduled right now. Past meetings and their results are under Meetings.'));
    else nx.appendChild(h('div', { class: 'mlist' }, next.map(function (x) { return meetingRow(x); })));
    v.appendChild(nx);
    v.appendChild(noticesCard(3));
    var inst = installCard(true); if (inst) v.appendChild(inst);
  }

  // ---------------------------------------------------------------- Meetings: upcoming and past
  function renderMeetings(v) {
    var rows = state.meetings ? state.meetings.meetings || [] : [], m = myMembership();
    var up = rows.filter(isUpcoming), past = rows.filter(function (x) { return !isUpcoming(x); }).reverse();
    v.appendChild(h('h2', { class: 'section-h' }, 'Meetings'));
    if (state.meetingsError) v.appendChild(h('p', { class: 'err' }, state.meetingsError));
    if (!m) v.appendChild(h('p', { class: 'small' }, 'Members RSVP, raise topics and vote here. ', h('a', { href: '#', onclick: function (e) { e.preventDefault(); go('join'); } }, 'Join the Red Deer Reavers'), ' first: it takes a minute.'));
    var filt = h('div', { class: 'filters', role: 'group', 'aria-label': 'Show' }, [['upcoming', 'Upcoming (' + up.length + ')'], ['past', 'Past (' + past.length + ')']].map(function (f) {
      return h('button', { type: 'button', 'aria-pressed': String(state.meetingsFilter === f[0]), onclick: function () { state.meetingsFilter = f[0]; render(); } }, f[1]);
    }));
    v.appendChild(filt);
    var shown = state.meetingsFilter === 'past' ? past : up;
    if (!shown.length) v.appendChild(h('p', { class: 'empty', 'data-testid': 'meetings-empty' }, state.meetingsFilter === 'past' ? 'No past meetings yet.' : 'Nothing is scheduled right now. The executive posts meetings and votes here.'));
    else v.appendChild(h('div', { class: 'mlist', 'data-testid': 'meetings-list' }, shown.map(function (x) { return meetingRow(x); })));
    if (state.meetings && state.meetings.can_manage) v.appendChild(h('p', { class: 'small', style: 'margin-top:14px' }, h('a', { href: '#', onclick: function (e) { e.preventDefault(); go('exec-meetings'); } }, 'Schedule or run a meeting (executive)')));
  }

  // ---------------------------------------------------------------- one meeting (member): votes first, then RSVP, agenda, topics, nominations, help, results
  function renderMeeting(v) {
    var id = state.meetingId, a = state.meeting, row = findMeeting(id);
    v.appendChild(h('p', { class: 'small no-print' }, h('a', { href: '#', onclick: function (e) { e.preventDefault(); go('meetings'); } }, '‹ All meetings')));
    if (!a || !a.meeting || a.meeting.id !== id) {
      if (state.meetingError && state.meetingLoading !== id) { v.appendChild(h('section', { class: 'card-panel' }, h('h2', {}, 'This meeting could not be opened'), h('p', { class: 'err' }, state.meetingError))); return; }
      if (state.meetingLoading !== id) loadMeeting(id);
      v.appendChild(h('section', { class: 'card-panel', 'aria-busy': 'true' }, row ? meetingHeader({ meeting: row }, true) : null, skeleton()));
      return;
    }
    var mt = a.meeting, m = myMembership();
    if (!state.voteTimer && !mt.cancelled) pollVotes();
    var card = h('section', { class: 'card-panel', 'data-testid': 'agm-member' }, meetingHeader(a));
    if (a.can_view_admin) card.appendChild(h('div', { class: 'row-btns no-print', style: 'margin-top:10px' }, h('button', { type: 'button', class: 'btn-line small-btn', 'data-testid': 'run-meeting', onclick: function () { go('exec-meeting', { meetingId: mt.id }); } }, 'Run this meeting (executive)')));
    if (mt.details) card.appendChild(h('p', { class: 'meeting-details' }, mt.details));
    v.appendChild(card);
    // open votes come first: they are the reason most people open the page during a meeting
    var open = state.votes ? (state.votes.questions || []).filter(function (q) { return q.status === 'open'; }) : [];
    v.appendChild(votingPanel());
    if (!a.membership) {
      card.appendChild(h('p', {}, 'Only Red Deer Reavers members can RSVP and vote. Join first: it takes a minute.'));
      card.appendChild(h('button', { type: 'button', class: 'btn-rdr', onclick: function () { go('join'); } }, 'Join the Red Deer Reavers'));
    } else if (a.membership.status === 'removed') {
      card.appendChild(h('p', {}, 'Your membership was removed. Ask the club executive.'));
    } else {
      card.appendChild(h('dl', { class: 'facts' },
        h('dt', {}, 'Membership'), h('dd', {}, MEMBERSHIP[a.membership.status]),
        h('dt', {}, 'Voting'), h('dd', {}, h('b', { class: a.eligible ? 'ok-text' : 'err' }, a.eligible ? 'ELIGIBLE TO VOTE' : 'NOT CURRENTLY ELIGIBLE TO VOTE'),
          !a.eligible && (a.reasons || []).length ? h('div', { class: 'small' }, a.reasons.join(' · ')) : null)));
      if (a.my_attendance && a.my_attendance !== 'absent') card.appendChild(h('p', { class: 'small' }, 'Checked in: ' + ATTEND[a.my_attendance] + '.'));
      if (mt.kind !== 'vote' && !mt.cancelled) rsvpBlock(card, a);
      if (a.video && a.video.link && (mt.kind === 'leadership' || mt.kind === 'vote')) card.appendChild(h('div', { class: 'held' }, h('b', {}, mt.kind === 'leadership' ? 'Meeting link / shared notes: ' : 'Link: '), h('a', { href: a.video.link, target: '_blank', rel: 'noopener noreferrer' }, a.video.details || a.video.link)));
    }
    if (mt.invite_only && (a.attendees || []).length) v.appendChild(attendeesCard(a));
    if ((a.agenda || []).length) v.appendChild(agendaCard(a));
    if (a.membership && a.membership.status !== 'removed' && mt.kind !== 'vote' && !mt.cancelled) {
      var x = agmx(), xe = state.agmxError[mt.id];
      if (xe) v.appendChild(h('p', { class: 'err', role: 'alert' }, xe));
      if (x && x.is_member) v.appendChild(topicsPanel());
      if (x && mt.kind === 'agm') v.appendChild(nominationsPanel());
    }
    if (mt.kind === 'agm' && a.membership) { try { v.appendChild(agmHelp()); } catch (e) { if (window.console) console.warn('help not shown', e); } }
    else v.appendChild(meetingHelp(mt));
    v.appendChild(resultsPanel());
    if (!open.length) { /* nothing open: the results, if any, are already below */ }
  }
  function rsvpBlock(card, a) {
    var mt = a.meeting, resp = a.rsvp && a.rsvp.response;
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
    if (mt.started) { card.appendChild(h('p', { class: 'small' }, 'The meeting has started. Ask the executive to record any change.')); return; }
    card.appendChild(h('h3', {}, resp ? 'Change how you will take part' : 'How will you take part?'));
    var opts = h('div', { class: 'rsvp-opts', role: 'group', 'aria-label': 'How will you take part?' });
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
  function attendeesCard(a) {
    var mt = a.meeting, att = h('section', { class: 'card-panel', 'data-testid': 'leadership-attendance' }, h('h3', {}, 'Who is invited'),
      h('p', { class: 'small' }, 'This meeting is shown to the ' + a.attendees.length + ' people invited to it and nobody else.' + (a.can_manage ? ' President, Secretary or Treasurer: mark each person as they join.' : '')));
    a.attendees.forEach(function (x) {
      var row = h('div', { class: 'arow' + (x.attendance && x.attendance !== 'absent' ? ' here' : ''), 'data-testid': 'leadership-row' },
        h('div', { class: 'who' }, h('b', {}, x.name), x.offices && x.offices.length ? h('span', { class: 'small' }, x.offices.join(', ')) : null),
        h('div', { class: 'chips' }, x.attendance ? chip(x.attendance === 'absent' ? '' : 'active', ATTEND[x.attendance]) : chip('pending', 'Not checked in')));
      if (a.can_manage && !mt.cancelled) row.appendChild(h('div', { class: 'checkin', role: 'group', 'aria-label': 'Attendance of ' + x.name },
        [['present_in_person', 'Here'], ['present_video', 'Video'], ['absent', 'Absent']].map(function (s) {
          return h('button', { type: 'button', class: 'small-btn ' + (x.attendance === s[0] ? 'btn-rdr' : 'btn-line'), 'aria-pressed': String(x.attendance === s[0]), onclick: function () {
            sb.rpc('set_club_meeting_attendance', { p_meeting: mt.id, p_membership: x.membership_id, p_status: s[0] }).then(function (r) {
              if (r.error) return status(words(r.error), true);
              status(x.name + ': ' + ATTEND[s[0]] + '.'); loadMeeting(mt.id);
            });
          } }, s[1]);
        })));
      att.appendChild(row);
    });
    return att;
  }
  function agendaCard(a) {
    var ag = h('section', { class: 'card-panel', 'data-testid': 'agenda' }, h('h3', {}, 'Agenda'));
    (a.agenda || []).forEach(function (t) { ag.appendChild(h('div', { class: 'arow' }, h('div', { class: 'who' }, h('b', {}, t.subject), t.status === 'addressed' ? h('span', { class: 'small' }, 'Addressed') : null), t.details ? h('div', { class: 'topic-details small' }, t.details) : null)); });
    return ag;
  }
  function meetingHelp(mt) {
    var item = function (title) { var kids = Array.prototype.slice.call(arguments, 1); return h('details', { class: 'help-item' }, h('summary', {}, title), h('div', { class: 'help-body' }, kids)); };
    return h('section', { class: 'card-panel agm-help', 'data-testid': 'meeting-help' }, h('h3', {}, 'How this works'), h('p', { class: 'small' }, 'Tap a heading to open it.'),
      mt.kind !== 'vote' ? item('Taking part', h('p', {}, 'Tell the club how you will take part with the buttons above: In Person, Video Call, Voting by Proxy or Not Attending. You can change your answer until the meeting starts.'),
        h('p', {}, 'If you can vote but cannot be there, choose Voting by Proxy and pick a member who can vote to carry your vote. You can change or cancel it before the meeting.')) : null,
      item('Voting', h('p', {}, 'When the executive opens a question it appears at the top of this page: keep the page open and tap your choice. You can change your ballot until the question closes. Ballots are secret: nobody sees how you voted.'),
        h('p', {}, 'If you hold another member\'s proxy, you cast a separate ballot for them. Results appear here once a question is closed.')),
      item('Who can vote', h('p', {}, 'Approved members who are 18 or older and shown as ELIGIBLE TO VOTE' + (currentYear() && currentYear().fee_waived ? ' (the ' + currentYear().year + ' fee is waived)' : ', with this year\'s fee paid') + '. Your voting status is shown on this page and under Account.')),
      mt.kind !== 'vote' ? item('Raising a topic', h('p', {}, 'Use "Something you want discussed?" above to send the executive a topic, question or concern before the meeting. You can edit or withdraw it until the meeting starts.')) : null);
  }
  // ================================================================ a meeting's header: kind, when, where, countdown, calendar
  function meetingHeader(a, forAdmin) {
    var mt = a.meeting;
    var whenLine = mt.local_time + (mt.local_end_time && mt.local_end_date === mt.local_date ? ' to ' + mt.local_end_time : '') + ' (' + (mt.timezone === 'America/Edmonton' ? 'Mountain time, Red Deer' : mt.timezone) + ')';
    return h('div', { class: 'agm-head', 'data-testid': 'agm-head' },
      h('div', { class: 'agm-kicker' }, kindLabel(mt) + (mt.invite_only ? ' · invited members only' : '')),
      h('h2', {}, mt.title),
      mt.cancelled ? h('div', { class: 'notice-box bad' }, h('b', {}, 'Cancelled. '), 'This meeting is not going ahead; its records are kept.') : null,
      h('div', { class: 'agm-when' }, mt.local_date), h('div', { class: 'agm-when' }, whenLine),
      mt.kind === 'vote' && mt.local_end_date && mt.local_end_date !== mt.local_date ? h('div', { class: 'small' }, 'Closes ' + mt.local_end_date + ' at ' + mt.local_end_time) : null,
      mt.location ? h('div', { class: 'small' }, 'Location: ' + mt.location) : null,
      mt.cancelled ? null : countdown(mt), forAdmin || mt.cancelled ? null : agmTools(mt));
  }
  function countdown(mt) {
    var ms = new Date(mt.starts_at).getTime() - Date.now(), endMs = mt.ends_at ? new Date(mt.ends_at).getTime() - Date.now() : null;
    if (mt.started || ms <= 0) {
      if (endMs != null) return endMs > 0 ? h('div', { class: 'agm-countdown live' }, mt.kind === 'vote' ? 'Open now' : 'Underway now') : null;
      return ms > -6 * 3600e3 ? h('div', { class: 'agm-countdown live' }, 'Underway now') : null;
    }
    var d = Math.floor(ms / 864e5), hr = Math.floor((ms % 864e5) / 36e5), mn = Math.floor((ms % 36e5) / 6e4);
    return h('div', { class: 'agm-countdown', 'data-testid': 'agm-countdown' }, d >= 1 ? 'In ' + d + ' day' + (d === 1 ? '' : 's') + (hr ? ' ' + hr + ' h' : '') : hr >= 1 ? 'In ' + hr + ' h ' + mn + ' min' : 'In ' + mn + ' min');
  }
  function icsText(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, function (c) { return '\\' + c; }); }
  function agmTools(mt) {
    var start = new Date(mt.starts_at), end = mt.ends_at ? new Date(mt.ends_at) : new Date(start.getTime() + 2 * 3600e3);
    var stamp = function (d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    var title = mt.title, page = meetingUrl(mt.id);
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Red Deer Reavers//Members//EN', 'BEGIN:VEVENT', 'UID:meeting-' + mt.id + '@red-deer-reavers', 'DTSTAMP:' + stamp(new Date()),
      'DTSTART:' + stamp(start), 'DTEND:' + stamp(end), 'SUMMARY:' + icsText(title), mt.location ? 'LOCATION:' + icsText(mt.location) : null, 'DESCRIPTION:' + icsText('RSVP and vote on the members page: ' + page), 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
    var g = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) + '&dates=' + stamp(start) + '/' + stamp(end) + (mt.location ? '&location=' + encodeURIComponent(mt.location) : '') + '&details=' + encodeURIComponent('RSVP and vote on the members page: ' + page);
    var lnk = function (attrs, text) { attrs.class = 'btn-line small-btn'; return h('a', attrs, text); };
    return h('div', { class: 'agm-tools', 'data-testid': 'agm-tools' },
      lnk({ href: 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics), download: 'reavers-' + mt.kind + '-' + mt.year + '.ics' }, 'Add to calendar'),
      lnk({ href: g, target: '_blank', rel: 'noopener noreferrer' }, 'Google Calendar'),
      mt.location ? lnk({ href: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mt.location), target: '_blank', rel: 'noopener noreferrer' }, 'Map') : null,
      navigator.share || navigator.clipboard ? h('button', { type: 'button', class: 'btn-line small-btn', onclick: function () { shareLink(page, mt.title); } }, 'Share link') : null);
  }
  function shareLink(url, title) {
    if (navigator.share) { navigator.share({ title: title, url: url }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { status('Link copied.'); }, function () { status(url); });
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
    sb.rpc('set_club_meeting_rsvp', { p_meeting: mv().meeting.id, p_response: response, p_proxy_holder: holder, p_authorize: authorize }).then(function (r) {
      if (r.error) { status(''); if (errEl) errEl.textContent = words(r.error); else status(words(r.error), true); return; }
      state.proxyPick = false; status('Saved: ' + RSVP_DONE[response] + '.');
      refreshMeeting();
    });
  }
  function cancelProxy() {
    if (!window.confirm('Cancel your proxy? You can then choose how you will participate.')) return;
    sb.rpc('cancel_club_meeting_proxy', { p_meeting: mv().meeting.id }).then(function (r) {
      if (r.error) return status(words(r.error), true);
      status('Proxy cancelled.'); refreshMeeting();
    });
  }

  // ================================================================ a meeting: concerns and executive nominations (member)
  var OFFICE = { president: 'President', secretary: 'Secretary', treasurer: 'Treasurer' };
  var TOPIC = { submitted: 'Submitted', on_agenda: 'Added to Agenda', addressed: 'Addressed', withdrawn: 'Withdrawn' };
  var TOPIC_CHIP = { submitted: 'pending', on_agenda: 'rsvp', addressed: 'active', withdrawn: '' };
  var NOM = { awaiting_acceptance: 'Awaiting acceptance', accepted: 'Accepted', declined: 'Declined', withdrawn: 'Withdrawn' };
  var NOM_CHIP = { awaiting_acceptance: 'pending', accepted: 'active', declined: 'cannot', withdrawn: '' };
  function agmName() { var mt = mv().meeting; return mt.kind === 'agm' ? mt.year + ' Red Deer Reavers AGM' : mt.title; }
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
  // topics and nominations for one meeting (club_agm_member_view), kept per meeting id
  function agmx() { var m = mv(); return m && m.meeting ? state.agmxBy[m.meeting.id] || null : null; }
  // 'Sunday, October 18 at 5:30 PM': when nominations or topics close for the meeting on screen (the database decides; NULL = when the meeting starts)
  function closeWhen(what, meeting) {
    var x = meeting ? null : agmx(), m = meeting || (mv() && mv().meeting), key = what + '_close_text';
    if (x && x[key]) return x[key];
    if (m && m[key]) return m[key];
    return m && m.local_time ? 'when the meeting starts (' + m.local_date + ', ' + m.local_time + ')' : 'when the meeting starts';
  }
  function closeIsOpen(what, meeting) {
    var x = meeting ? null : agmx(), m = meeting || (mv() && mv().meeting), key = what + '_open';
    if (x && typeof x[key] === 'boolean') return x[key];
    if (m && typeof m[key] === 'boolean') return m[key];
    return !!m && !m.started;
  }
  function loadAgmx(meetingId, redraw) {
    if (!meetingId) return Promise.resolve();
    return sb.rpc('club_agm_member_view', { p_meeting: meetingId }).then(function (r) {
      if (r.error) { state.agmxError[meetingId] = words(r.error); delete state.agmxBy[meetingId]; } else { state.agmxBy[meetingId] = r.data; delete state.agmxError[meetingId]; }
      if (redraw !== false) render();
    });
  }
  function swap(id, build) { var el = $(id); if (el) el.replaceWith(build()); }
  // the AGM the nomination banner is about: the current AGM in the meetings list
  function agmMeeting() { return meetingsOf('agm').filter(function (m) { return !m.cancelled && new Date(m.starts_at).getTime() > Date.now() - 864e5; })[0] || meetingsOf('agm')[0] || null; }
  function nominatedBanner() {
    var agm = agmMeeting(), x = agm ? state.agmxBy[agm.id] : null;
    if (!x || !(x.to_respond || []).length) return null;
    var n = x.to_respond[0];
    return h('div', { class: 'nominated-box', role: 'status', 'data-testid': 'nominated-banner' },
      h('h3', {}, 'You\'ve Been Nominated'),
      h('p', {}, 'You have been nominated for ' + n.label + ' for the ' + agm.year + ' Red Deer Reavers AGM.'),
      h('button', { type: 'button', class: 'btn-rdr', onclick: function () { openMeeting(agm.id, { scrollTo: 'agm-nominations' }); } }, 'Review nomination'));
  }

  // ================================================================ "How the AGM Works": plain-English help for members
  function agmHelp() {
    var a = mv(), mt = a.meeting, yr = currentYear(), waivedYear = !!(yr && yr.fee_waived), board = agmx() && agmx().board;
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
        h('p', { class: 'small' }, 'New nominations close ' + closeWhen('nominations') + '. A member who has been nominated can still accept or decline until the AGM starts.')),
      item('topic', 'Submit an AGM topic',
        h('p', {}, 'Have something you want discussed at the AGM? You can submit it before the meeting. It could be:'),
        ul('an idea for the club', 'something you think should change', 'a question for the executive', 'an event or practice idea', 'anything you want the members to talk about'),
        ol(['Find ', q('Something you want discussed?'), ' on this tab.'], ['Tap ', q('Submit AGM Concern / Topic'), '.'], ['Write a short subject.'],
          ['Explain what you want discussed in the details.'], ['Tap ', q('Submit for AGM'), '.']),
        h('p', {}, 'Your topic then shows under ', q('Your AGM topics'), '. You can edit it until topic submissions close (' + closeWhen('topics') + ') and withdraw it until the AGM starts, unless the executive has marked it Addressed. Only you and the executive can see what you submit.')),
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
    var x = agmx(), box = h('section', { class: 'card-panel agm-extra', id: 'agm-topics', 'data-testid': 'agm-topics' },
      h('h3', {}, 'Something you want discussed?'),
      h('p', {}, 'If there is a concern, question, idea or topic you would like brought up at the AGM, submit it here.'));
    if (x.topics_open) {
      if (state.topicForm) box.appendChild(topicForm(state.topicForm));
      else box.appendChild(h('button', { type: 'button', class: 'btn-rdr', 'data-testid': 'topic-new', onclick: function () { state.topicNotice = ''; state.topicForm = {}; swap('agm-topics', topicsPanel); } }, 'Submit AGM Concern / Topic'));
      if (!execLine(box, 'topics', 'Topic submissions')) box.appendChild(h('p', { class: 'small', 'data-testid': 'topics-close' }, 'Topic submissions close ' + closeWhen('topics') + '.'));
    } else if (!execLine(box, 'topics', 'Topic submissions')) box.appendChild(h('p', { class: 'small', 'data-testid': 'topics-closed' }, 'Topic submissions closed ' + closeWhen('topics') + '. Speak to the executive.'));
    if (state.topicNotice) box.appendChild(h('p', { class: 'ok-text', role: 'status', 'data-testid': 'topic-received' }, state.topicNotice));
    var mine = x.my_topics || [];
    if (mine.length) {
      box.appendChild(h('h4', {}, 'Your AGM topics'));
      mine.forEach(function (t) {
        var row = h('div', { class: 'arow', 'data-testid': 'my-topic' },
          h('div', { class: 'who' }, h('b', {}, t.subject)),
          h('div', { class: 'chips' }, chip(TOPIC_CHIP[t.status], TOPIC[t.status]), h('span', { class: 'small' }, 'Submitted ' + dateText(t.created_at) + (t.updated_at !== t.created_at ? ' · edited ' + dateText(t.updated_at) : ''))),
          h('div', { class: 'topic-details small' }, t.details));
        var canWithdraw = typeof t.can_withdraw === 'boolean' ? t.can_withdraw : t.can_edit;
        if (t.can_edit || canWithdraw) {
          row.appendChild(h('div', { class: 'row-btns' },
            t.can_edit ? h('button', { type: 'button', class: 'btn-line small-btn', onclick: function () { state.topicNotice = ''; state.topicForm = { id: t.id, subject: t.subject, details: t.details }; swap('agm-topics', topicsPanel); } }, 'Edit') : null,
            canWithdraw ? h('button', { type: 'button', class: 'btn-line small-btn', onclick: function () { withdrawTopic(t); } }, 'Withdraw') : null));
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
      var call = f.id ? sb.rpc('update_club_agm_topic', { p_topic: f.id, p_subject: s1, p_details: d1 }) : sb.rpc('submit_club_agm_topic', { p_meeting: mv().meeting.id, p_subject: s1, p_details: d1 });
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

  // an executive looking at the member page gets the deadline line with its Close now button; returns false for everyone else
  function execLine(box, what, label) {
    var a = mv(); if (!a || !a.can_view_admin || state.legacy) return false;
    box.appendChild(deadlineLine(what, label, memberReload(a.meeting), a));
    return true;
  }
  // ---- nominations
  function nominationsPanel() {
    var x = agmx(), box = h('section', { class: 'card-panel agm-extra', id: 'agm-nominations', 'data-testid': 'agm-nominations' }, h('h3', {}, 'Executive Nominations'));
    (x.to_respond || []).forEach(function (n) { box.appendChild(nomineeCard(n)); });
    (x.my_candidacies || []).forEach(function (c) {
      if (c.status === 'accepted') box.appendChild(h('div', { class: 'cand-mine', 'data-testid': 'my-candidacy' },
        h('span', {}, 'You are an accepted candidate for '), h('b', {}, c.label), h('span', {}, '. '),
        h('button', { type: 'button', class: 'btn-line small-btn', onclick: function () { withdrawCandidacy(c); } }, 'Withdraw my candidacy')));
      else if (c.status === 'declined' || c.status === 'withdrawn') box.appendChild(h('p', { class: 'small' }, 'Your nomination for ' + c.label + ': ' + NOM[c.status] + '.'));
    });
    if (state.nomNotice) box.appendChild(h('p', { class: 'ok-text', role: 'status', 'data-testid': 'nomination-notice' }, state.nomNotice));
    if (x.can_nominate) { box.appendChild(nominateForm()); if (!execLine(box, 'nominations', 'New nominations')) box.appendChild(h('p', { class: 'small', 'data-testid': 'nominations-close' }, 'New nominations close ' + closeWhen('nominations') + '.')); }
    else if (x.nominate_blocked) { box.appendChild(h('p', { class: 'small', 'data-testid': 'nominate-blocked' }, x.nominate_blocked)); execLine(box, 'nominations', 'New nominations'); }
    box.appendChild(h('h4', { 'data-testid': 'nominations-heading' }, mv().meeting.year + ' Executive Nominations'));
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
    var x = agmx(), box = h('div', { class: 'nominate-box', 'data-testid': 'nominate-form' }), redraw = function () { swap('agm-nominations', nominationsPanel); };
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
      sb.rpc('nominate_for_club_office', { p_meeting: mv().meeting.id, p_office: state.nomOffice, p_nominee: self ? null : state.nomTarget }).then(function (r) {
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
  function loadAgmRows() { return sb.rpc('club_meeting_dashboard', { p_meeting: am().meeting.id }); }
  function renderAgmAdmin(v) {
    if (!am() || !am().meeting) { v.appendChild(h('p', {}, 'No meeting is selected.')); return; }
    v.appendChild(h('p', { class: 'small' }, 'Loading…'));
    loadAgmRows().then(function (r) {
      if (r.error) { v.textContent = ''; v.appendChild(h('p', { class: 'err' }, words(r.error))); return; }
      state.agmRows = (r.data || []).filter(function (x) { return x.membership_status !== 'removed'; });
      drawAgmAdmin(v);
    });
  }
  function drawAgmAdmin(v) {
    v.textContent = '';
    var a = am(), rows = state.agmRows, manage = !!a.can_manage;
    var count = function (f) { return rows.filter(f).length; };
    var set = function (f) { return function () { state.agmFilter = f; drawAgmAdmin(v); }; };
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
  // "Topics close Sunday, October 18 at 5:30 PM · Close now" / "Topics closed …". The time itself is set under Details.
  function deadlineLine(what, label, redraw, ctx) {
    var a = ctx || am(), mt = a.meeting, open = closeIsOpen(what, mt), when = closeWhen(what, mt);
    var line = h('p', { class: 'small notice-box', 'data-testid': what + '-deadline' }, h('b', {}, label + (open ? ' close ' : ' closed ') + when + '.'), ' ');
    if (state.legacy) return line;
    if (!a.can_view_admin) return line;
    if (open) {
      var btn = h('button', { type: 'button', class: 'btn-line small-btn', 'data-testid': what + '-close-now' }, 'Close ' + what + ' now');
      btn.addEventListener('click', function () {
        if (!window.confirm('Close ' + what + ' now? Members can no longer ' + (what === 'topics' ? 'submit or edit topics (they can still withdraw their own until the meeting starts)' : 'nominate anyone (a nominee can still accept or decline until the meeting starts)') + ' for "' + mt.title + '". You can reopen them under Details.')) return;
        busy(btn, true);
        saveDeadlines(mt, what === 'nominations' ? new Date().toISOString() : (mt.nominations_close_set ? mt.nominations_close_at : null),
          what === 'topics' ? new Date().toISOString() : (mt.topics_close_set ? mt.topics_close_at : null)).then(function (ok) { busy(btn, false); if (ok) { status(label + ' closed.'); redraw(); } });
      });
      line.appendChild(btn);
    } else line.appendChild(h('span', {}, 'To reopen, set a later time under Details.'));
    return line;
  }
  // the small form every executive gets under Details: when new nominations (AGM) and topic submissions close
  function deadlinesForm(mt) {
    var nom = h('input', { class: 'browser-default', id: 'dl-nom-close', type: 'datetime-local', value: mt.nominations_close_set ? isoToWall(mt.nominations_close_at, TZ) : '' });
    var top = h('input', { class: 'browser-default', id: 'dl-top-close', type: 'datetime-local', value: mt.topics_close_set ? isoToWall(mt.topics_close_at, TZ) : '' });
    var err = h('p', { class: 'err', role: 'alert' }), save = h('button', { type: 'button', class: 'btn-rdr', 'data-testid': 'deadlines-save' }, 'Save');
    save.addEventListener('click', function () {
      err.textContent = '';
      var nc = mt.kind === 'agm' && nom.value ? zonedToIso(nom.value, TZ) : null; if (mt.kind === 'agm' && nom.value && !nc) { err.textContent = 'Check when nominations close.'; return; }
      var tc = top.value ? zonedToIso(top.value, TZ) : null; if (top.value && !tc) { err.textContent = 'Check when topic submissions close.'; return; }
      busy(save, true);
      saveDeadlines(mt, nc, tc).then(function (ok) { busy(save, false); if (ok) { status('Saved.'); refreshAdmin(); } });
    });
    return h('section', { class: 'card-panel', 'data-testid': 'deadlines-form' }, h('h3', {}, 'When submissions close'),
      h('p', { class: 'small' }, 'Red Deer time. Leave a field empty and it closes when the meeting starts.'),
      mt.kind === 'agm' ? h('label', { class: 'fld' }, 'New nominations close', nom) : null,
      h('label', { class: 'fld' }, 'Topic submissions close', top), err, h('div', { class: 'row-btns' }, save));
  }
  function execReload(mt) { return function () { loadAdm(mt.id, false).then(function () { return loadMeetings(false); }).then(render); }; }
  function memberReload(mt) { return function () { Promise.resolve(loadMeeting(mt.id, false)).then(function () { return loadAgmx(mt.id, false); }).then(function () { return loadMeetings(false); }).then(render); }; }
  function saveDeadlines(mt, nomIso, topIso) {
    return sb.rpc('set_club_meeting_deadlines', { p_meeting: mt.id, p_nominations_close_at: nomIso || null, p_topics_close_at: topIso || null }).then(function (r) {
      if (r.error) { status(missingFn(r.error) ? 'Closing nominations or topics at a set time needs the database update (club_meeting_deadlines).' : words(r.error), true); return false; }
      return true;
    });
  }
  function drawConcernsAdmin(body) {
    body.appendChild(h('p', { class: 'small' }, 'Loading…'));
    sb.rpc('club_agm_topics_admin', { p_meeting: am().meeting.id }).then(function (r) {
      body.textContent = '';
      if (r.error) { body.appendChild(h('p', { class: 'err' }, words(r.error))); return; }
      var rows = r.data || [], manage = !!am().can_manage, mt = am().meeting;
      var redraw = function () { body.textContent = ''; drawConcernsAdmin(body); };
      var setStatus = function (t, st) {
        sb.rpc('set_club_agm_topic_status', { p_topic: t.topic_id, p_status: st }).then(function (x) { if (x.error) return status(words(x.error), true); status('"' + t.subject + '": ' + TOPIC[st] + '.'); redraw(); });
      };
      if (!rows.length) { body.appendChild(h('p', { 'data-testid': 'topics-empty' }, 'No topics submitted yet. Members submit them from the meeting page under "Something you want discussed?".')); return; }
      var q = (state.topicSearch || '').trim().toLowerCase();
      if (rows.length > 5) body.appendChild(searchBox(state.topicSearch || '', function (x) { state.topicSearch = x; }, function () { redraw(); return body; }));
      var keep = function (t) { return !q || (t.subject + ' ' + t.details + ' ' + t.member_name).toLowerCase().indexOf(q) >= 0; };
      var when = function (t) { return new Date(t.status_changed_at || t.updated_at || t.created_at).getTime(); };
      var groups = [
        ['on_agenda', 'On the agenda', 'In this order on the members’ agenda. Tap Addressed as each one is dealt with.', function (a, b) { return when(a) - when(b); }],
        ['submitted', 'Waiting for a decision', 'New from members. Add to the agenda, or mark addressed if it was handled another way.', function (a, b) { return new Date(b.created_at) - new Date(a.created_at); }],
        ['addressed', 'Addressed', null, function (a, b) { return when(b) - when(a); }],
        ['withdrawn', 'Withdrawn by the member', null, function (a, b) { return when(b) - when(a); }]];
      var any = false;
      groups.forEach(function (g) {
        var list = rows.filter(function (t) { return t.status === g[0]; }).filter(keep).sort(g[3]);
        if (!list.length) return;
        any = true;
        var sec = h('section', { class: 'topic-group', 'data-testid': 'topic-group-' + g[0] }, h('h4', {}, g[1] + ' ', h('span', { class: 'count' }, '(' + list.length + ')')), g[2] ? h('p', { class: 'small' }, g[2]) : null);
        var holder = sec;
        if (g[0] === 'withdrawn' || g[0] === 'addressed') { holder = h('details', { open: g[0] === 'addressed' && list.length <= 3 ? '' : null }, h('summary', {}, 'Show or hide these ' + list.length)); sec.appendChild(holder); }
        list.forEach(function (t, n) {
          var long = (t.details || '').length > 280;
          var row = h('div', { class: 'arow topic', 'data-testid': 'topic-row' },
            h('div', { class: 'who' }, h('b', {}, (g[0] === 'on_agenda' ? (n + 1) + '. ' : '') + t.subject), h('small', {}, t.member_name + ' · ' + timeText(t.created_at) + (t.edited ? ' · edited ' + timeText(t.updated_at) : ''))),
            long ? h('details', { class: 'topic-more' }, h('summary', {}, 'Read the details'), h('div', { class: 'topic-details' }, t.details)) : h('div', { class: 'topic-details' }, t.details));
          if (manage) {
            var acts = { submitted: [['on_agenda', 'Add to agenda', 'btn-rdr'], ['addressed', 'Addressed', 'btn-line']],
              on_agenda: [['addressed', 'Addressed', 'btn-rdr'], ['submitted', 'Take off the agenda', 'btn-line']],
              addressed: [['on_agenda', 'Back on the agenda', 'btn-line']], withdrawn: [] }[t.status] || [];
            if (acts.length) row.appendChild(h('div', { class: 'row-btns' }, acts.map(function (a) { return h('button', { type: 'button', class: a[2] + ' small-btn', onclick: function () { setStatus(t, a[0]); } }, a[1]); })));
          }
          if (t.status === 'withdrawn') row.appendChild(h('div', { class: 'small' }, 'The member withdrew this topic.'));
          holder.appendChild(row);
        });
        body.appendChild(sec);
      });
      if (!any) body.appendChild(h('p', { 'data-testid': 'topics-empty' }, 'No topics match.'));
      if (!manage) body.appendChild(h('p', { class: 'small' }, 'Only the President, Secretary or Treasurer change a topic’s status.'));
    });
  }
  function drawNominationsAdmin(body) {
    body.appendChild(h('p', { class: 'small' }, 'Loading…'));
    sb.rpc('club_agm_nominations_admin', { p_meeting: am().meeting.id }).then(function (r) {
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
    sb.rpc('set_club_meeting_attendance', { p_meeting: am().meeting.id, p_membership: r.membership_id, p_status: st }).then(function (x) {
      if (x.error) return status(words(x.error), true);
      status(r.full_name + ': ' + ATTEND[st] + '.');
      loadAgmRows().then(function (y) { if (!y.error) { state.agmRows = y.data.filter(function (z) { return z.membership_status !== 'removed'; }); drawAgmAdmin(v); } });
    });
  }
  function videoForm() {
    var box = h('section', { class: 'card-panel', 'data-testid': 'video-form' }, h('h3', {}, am().meeting.kind === 'leadership' ? 'Meeting link or shared notes' : 'Video meeting link'), h('p', { class: 'small' }, 'Shown only to signed-in Reavers members.'));
    var link = h('input', { class: 'browser-default', id: 'vid-link', placeholder: 'https://…', inputmode: 'url' });
    var det = h('input', { class: 'browser-default', id: 'vid-details', maxlength: '500', placeholder: 'Passcode or dial-in (optional)' });
    var err = h('p', { class: 'err', role: 'alert' });
    var btn = h('button', { type: 'button', class: 'btn-rdr' }, 'Save link');
    sb.rpc('club_meeting_admin_info', { p_meeting: am().meeting.id }).then(function (r) { if (!r.error) { link.value = r.data.video_link || ''; det.value = r.data.video_details || ''; } });
    btn.addEventListener('click', function () {
      err.textContent = '';
      sb.rpc('set_club_meeting_video', { p_meeting: am().meeting.id, p_link: link.value.trim() || null, p_details: det.value.trim() || null }).then(function (r) {
        if (r.error) { err.textContent = words(r.error); return; }
        status('Video link saved.'); refreshAdmin();
      });
    });
    box.appendChild(h('label', { class: 'fld' }, 'Link', link)); box.appendChild(h('label', { class: 'fld' }, 'Details', det)); box.appendChild(err); box.appendChild(btn);
    return box;
  }

  // ================================================================ the AGM vote: questions, ballots, results (member and executive)
  // Members see opened questions and vote (their own ballot, plus one for each member whose proxy they hold); results show once a question is
  // closed. The executive opens and closes questions in AGM admin › Voting. Ballots are secret: the executive sees who has voted, never how anyone voted.
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
      if (redraw !== false) {
        swap('vote-panel', votingPanel); swap('results-panel', resultsPanel);
        var adm = $('vote-admin'), ae = document.activeElement, typing = !!(adm && ae && adm.contains(ae) && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName));
        if (adm && !typing) drawVotingAdmin(adm.parentNode, true);   // never rebuild the form under someone's fingers
      }
      if (T) { if (before) noticeOpened(before); updateVoteNow(); }
    });
  }
  function pollVotes() {
    stopVotePolling();
    state.voteTimer = setInterval(function () {
      if ((document.hidden && !(T && buzzOn())) || !state.session || !voteMeeting()) return;
      if (!$('vote-panel') && !$('vote-admin')) { stopVotePolling(); return; }
      if (voteMeeting() && voteMeeting().cancelled) return;
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
    box.appendChild(h('p', { class: 'small' }, total + ' of ' + (t.eligible != null ? t.eligible : q.eligible_count) + ' eligible ballots' + (q.status === 'closed' ? ' · closed ' + timeText(q.closed_at) + (q.auto_closed ? ' (24 hours after it opened)' : '') : ' so far')));
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
        try { var n = new Notification('Vote open: ' + q.title, { body: (voteMeeting() ? voteMeeting().title : 'Red Deer Reavers') + ': cast your ballot now.', tag: 'rdr-vote-' + q.id, icon: 'assets/crest-96.webp' }); n.onclick = function () { window.focus(); if (voteMeeting()) openMeeting(voteMeeting().id, { scrollTo: 'vote-panel' }); }; } catch (e) { /* ignore */ }
      });
    }
  }
  function pendingOpen() {
    var vt = state.votes; if (!vt) return [];
    return (vt.questions || []).filter(function (q) { return q.status === 'open' && (vt.voters || []).some(function (v) { return v.can && !ballotChoice(q, v.membership_id); }); });
  }
  // the "Vote now" bar: every open question still waiting for this member's ballot, across every meeting they can see.
  // The meetings list carries the count per meeting (to_vote); the meeting being viewed uses its own fresher ballot data.
  function pendingVotes() {
    var rows = state.meetings ? state.meetings.meetings || [] : [], out = [];
    rows.forEach(function (m) {
      if (voteMeeting() && m.id === voteMeeting().id && state.votes) { var qs = pendingOpen(); if (qs.length) out.push({ meeting: m, count: qs.length, title: qs.length === 1 ? qs[0].title : null }); }
      else if (m.to_vote > 0) out.push({ meeting: m, count: m.to_vote, title: null });
    });
    return out;
  }
  function updateVoteNow() {
    var bar = $('vote-now'); if (!bar) return;
    var pend = state.session && state.overview ? pendingVotes() : [], panel = $('vote-panel'), seen = false, total = 0;
    pend.forEach(function (p) { total += p.count; });
    if (panel && state.view === 'meeting') { var rc = panel.getBoundingClientRect(); seen = rc.top < window.innerHeight - 120 && rc.bottom > 140; }
    if (!total || seen) { bar.hidden = true; document.body.classList.remove('has-vote-now'); return; }
    var first = pend[0];
    bar.textContent = '';
    bar.appendChild(h('button', { type: 'button', 'data-testid': 'vote-now', onclick: function () { openMeeting(first.meeting.id, { scrollTo: 'vote-panel' }); } },
      h('span', {}, total === 1 && first.title ? first.title : total === 1 ? 'A vote is open' : total + ' votes are open', h('br'), h('small', {}, (pend.length === 1 ? first.meeting.title + ' · ' : '') + 'Your ballot is not in yet')), h('span', { class: 'go' }, 'Vote now')));
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
      if (q.closes_text) card.appendChild(h('p', { class: 'small', 'data-testid': 'closes-at' }, 'Voting closes ' + q.closes_text + ' (24 hours after it opened), or earlier if the executive closes it.'));
      if (q.tally) card.appendChild(resultBars(q));
    } else {
      var rb = resultBars(q); if (rb) card.appendChild(rb);
    }
    return card;
  }
  // open questions (the top of a meeting page); closed ones are in resultsPanel() at the bottom
  function votingPanel() {
    var vm = voteMeeting(), vt = state.votes;
    if (!vm) return h('div', { id: 'vote-panel' });
    var box = h('section', { id: 'vote-panel', class: 'card-panel', 'data-testid': 'vote-panel' }, h('h2', {}, 'Voting'));
    if (vm.cancelled) { box.appendChild(h('p', { class: 'small' }, 'This meeting was cancelled.')); return box; }
    if (state.votesError) { box.appendChild(h('p', { class: 'err' }, state.votesError)); return box; }
    if (!vt) { box.appendChild(h('p', { class: 'small' }, 'Checking for open questions…')); return box; }
    var qs = (vt.questions || []).filter(function (q) { return q.status !== 'draft'; });
    var open = qs.filter(function (q) { return q.status === 'open'; }), closed = qs.filter(function (q) { return q.status === 'closed'; });
    if (vt.is_member && isUpcoming(vm)) box.appendChild(buzzRow());
    if (!open.length) {
      box.appendChild(h('p', {}, closed.length ? 'No question is open right now. Results so far are at the bottom of this page.' : (vm.kind === 'vote' ? 'No question is open yet. When the executive opens it, it appears here.' : 'No question is open yet. When the executive opens a vote during the meeting, it appears here: keep this page open.')));
      if (!vt.is_member) box.appendChild(h('p', { class: 'small' }, 'Only members vote.'));
      return box;
    }
    if (vt.is_member && !vt.eligible && !vt.gave_proxy) box.appendChild(h('p', { class: 'small err' }, 'You are not currently eligible to vote: see your voting status below.'));
    if (vt.gave_proxy) box.appendChild(h('p', { class: 'small' }, 'You gave your proxy for this meeting, so your proxy holder votes for you. Cancel the proxy below to vote yourself.'));
    open.forEach(function (q) { box.appendChild(questionCard(q, vt)); });
    return box;
  }
  function resultsPanel() {
    var vm = voteMeeting(), vt = state.votes;
    if (!vm || !vt) return h('div', { id: 'results-panel' });
    var closed = (vt.questions || []).filter(function (q) { return q.status === 'closed'; });
    if (!closed.length) return h('div', { id: 'results-panel' });
    var box = h('section', { id: 'results-panel', class: 'card-panel', 'data-testid': 'results-panel' }, h('h2', {}, 'Results'));
    closed.forEach(function (q) { box.appendChild(questionCard(q, vt)); });
    return box;
  }
  // ---------------------------------------------------------------- executive: write, open and close questions; the executive: who has voted (never how)
  function drawVotingAdmin(body, keep) {
    var vt = state.votes;
    body.textContent = '';
    var wrap = h('div', { id: 'vote-admin', 'data-testid': 'vote-admin' });
    body.appendChild(wrap);
    if (!vt) { wrap.appendChild(h('p', { class: 'small' }, 'Loading…')); loadVotes(false).then(function () { drawVotingAdmin(body, true); }); if (!keep) pollVotes(); return; }
    var manage = !!vt.can_manage;
    wrap.appendChild(h('p', { class: 'small' }, 'Open a question when the meeting reaches it; members vote on their phones (their own ballot, plus one for each proxy they hold). Each question closes on its own 24 hours after it opens; close it earlier to freeze the result sooner. Members see counts only once a question is closed. Ballots are secret: you can see who has voted, never how anyone voted.'));
    if (manage) wrap.appendChild(questionForm());
    var qs = vt.questions || [];
    if (!qs.length) wrap.appendChild(h('p', { 'data-testid': 'vote-admin-empty' }, 'No questions yet.'));
    qs.forEach(function (q) {
      var row = h('section', { class: 'card-panel vote-q ' + q.status, 'data-testid': 'vote-admin-q' },
        h('div', { class: 'chips' }, chip(q.status === 'open' ? 'active' : q.status === 'draft' ? 'pending' : '', q.status === 'open' ? 'Open' : q.status === 'draft' ? 'Draft (members do not see it)' : 'Closed'), chip('rsvp', q.kind === 'election' ? 'Election: ' + OFFICE[q.office] : 'Motion')),
        h('h3', {}, q.title), q.details ? h('p', { class: 'vote-details' }, q.details) : null,
        h('p', { class: 'small' }, 'Choices: ' + (q.options || []).map(function (o) { return o.label; }).join(' · ')),
        q.status === 'open' && q.closes_text ? h('p', { class: 'small notice-box', 'data-testid': 'admin-closes-at' }, h('b', {}, 'Closes on its own ' + q.closes_text + '.'), ' Close and count below to end it earlier.') : null,
        q.status === 'closed' && q.auto_closed ? h('p', { class: 'small' }, 'Closed on its own ' + timeText(q.closed_at) + ', 24 hours after it opened.') : null);
      if (q.status !== 'draft') { var rb = resultBars(q); if (rb) row.appendChild(rb); }
      var acts = h('div', { class: 'row-btns' });
      if (manage && q.status === 'draft') {
        acts.appendChild(h('button', { type: 'button', class: 'btn-rdr', onclick: function () { if (!window.confirm('Open "' + q.title + '" for voting now?')) return; runQ('open_club_question', q, 'Open for voting.'); } }, 'Open for voting'));
        acts.appendChild(h('button', { type: 'button', class: 'btn-line', onclick: function () { state.voteForm = { id: q.id, kind: q.kind, office: q.office, title: q.title, details: q.details || '' }; drawVotingAdmin(body, true); } }, 'Edit'));
        acts.appendChild(h('button', { type: 'button', class: 'btn-line', onclick: function () { if (!window.confirm('Remove the draft "' + q.title + '"?')) return; runQ('delete_club_question', q, 'Removed.'); } }, 'Remove'));
      }
      if (manage && q.status === 'open') acts.appendChild(h('button', { type: 'button', class: 'btn-rdr', onclick: function () { if (!window.confirm('Close "' + q.title + '" now, before its 24 hours are up? No more ballots after this; the result is final.')) return; runQ('close_club_question', q, 'Closed: the result is final.'); } }, 'Close and count now'));
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
    var remember = function () { state.voteForm = { id: f.id, kind: kind.value, office: office.value, title: title.value, details: details.value }; };
    [kind, office, title, details].forEach(function (el) { el.addEventListener('input', remember); el.addEventListener('change', remember); });
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
    if (!am() || !am().meeting) { v.appendChild(h('p', {}, 'No AGM is scheduled.')); return; }
    v.appendChild(h('p', { class: 'small' }, 'Loading…'));
    sb.rpc('club_meeting_proxy_list', { p_meeting: am().meeting.id }).then(function (r) {
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
    if (!am() || !am().meeting) { v.appendChild(h('p', {}, 'No AGM is scheduled.')); return; }
    var a = am(), bar = h('div', { class: 'row-btns no-print' });
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
      sb.rpc('record_club_meeting_snapshot', { p_meeting: a.meeting.id }).then(function (r) { if (r.error) return status(words(r.error), true); status('Official AGM record saved.'); render(); });
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
    var a = am(), live = members.filter(function (m) { return m.membership_status !== 'removed'; });
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


  // ================================================================ Account: your membership record, fighter profile, notifications, help, sign out
  function loadFighter() {
    if (!state.session) return Promise.resolve();
    return sb.rpc('my_fighter_id').then(function (r) { state.fighterId = r.error ? null : (r.data || null); if (state.view === 'account') render(); });
  }
  function renderAccount(v) {
    var o = state.overview, m = myMembership(), year = currentYear();
    var offices = (o.offices || []).map(function (x) { return x.label; });
    if (m) {
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
        m.status === 'pending' ? h('p', { class: 'small' }, 'The club executive will review your application. You can already RSVP to meetings.') : null,
        m.status === 'pending' ? approvalAlertControl() : null,
        m.status === 'active' && !m.fee_waived && m.dues_status === 'unpaid' ? h('p', { class: 'small' }, 'Pay your ' + money(year ? year.dues_cents : null) + ' dues to the Treasurer; they record it here.') : null));
    } else {
      v.appendChild(h('section', { class: 'card-panel' }, h('h2', {}, 'Not a member yet'), h('p', { class: 'small' }, 'Your account is ready. Apply to join the Red Deer Reavers to RSVP and vote.'),
        h('button', { type: 'button', class: 'btn-rdr', onclick: function () { go('join'); } }, 'Join the Red Deer Reavers')));
    }
    // the BuhurtOS fighter profile: a plain card here, never a pop-up on every page
    var fid = state.fighterId, card = h('section', { class: 'card-panel', 'data-testid': 'me-fighter' }, h('h2', {}, 'Fighter profile'));
    if (fid === undefined) card.appendChild(h('p', { class: 'small' }, 'Checking…'));
    else if (fid) card.appendChild(h('div', { class: 'row-btns' },
      h('a', { class: 'btn-line', href: 'fighter.html?id=' + encodeURIComponent(fid) }, 'My fighter page'),
      h('a', { class: 'btn-line', href: CFG.appUrl + '/fighters/' + encodeURIComponent(fid), target: '_blank', rel: 'noopener' }, 'Edit on BuhurtOS')));
    else card.appendChild(h('div', { 'data-testid': 'fighter-nudge' }, h('p', { class: 'small' }, 'No BuhurtOS fighter profile is linked to this account yet. It puts you on the team page with your events, stats and fight history.'),
      h('div', { class: 'row-btns' }, h('a', { class: 'btn-rdr', href: CFG.appUrl + '/team-manager?join=' + encodeURIComponent(CFG.teamSlug), rel: 'noopener', 'data-testid': 'fighter-nudge-go' }, 'Create my fighter profile'),
        h('a', { class: 'btn-line', href: CFG.appUrl + '/claim-profile', rel: 'noopener', 'data-testid': 'fighter-nudge-claim' }, 'Claim an existing one'))));
    v.appendChild(card);
    var inst = installCard(false); if (inst) v.appendChild(inst);
    var docs = (CFG.documents || []).slice();
    if (CFG.bylawsUrl && !docs.some(function (d) { return d.href === CFG.bylawsUrl; })) docs.unshift({ title: 'Club bylaws (PDF)', href: CFG.bylawsUrl });
    v.appendChild(h('section', { class: 'card-panel', 'data-testid': 'account-help' }, h('h2', {}, 'Help'),
      h('details', { class: 'help-item' }, h('summary', {}, 'Where things are'), h('div', { class: 'help-body' },
        h('p', {}, h('b', {}, 'Home'), ' shows anything that needs you (a vote waiting for your ballot, an RSVP), the next meetings and the latest notices.'),
        h('p', {}, h('b', {}, 'Meetings'), ' lists every upcoming and past meeting. Open one to RSVP, read the agenda, raise a topic and vote. Results stay on the meeting page.'),
        h('p', {}, h('b', {}, 'Account'), ' (this page) is your membership record, your fighter profile and this help.'),
        o.can_view_roster ? h('p', {}, h('b', {}, 'Exec'), ' at the top opens the executive tools: scheduling and running meetings, members and dues, notices and the dues history.') : null)),
      h('details', { class: 'help-item' }, h('summary', {}, 'Voting'), h('div', { class: 'help-body' },
        h('p', {}, 'Open the meeting when a vote is called: the open question is at the top of its page. Tap your choice; you can change it until the question closes. Ballots are secret.'),
        h('p', {}, 'You can vote when you are an approved member, 18 or older' + (year && year.fee_waived ? ' (the ' + year.year + ' fee is waived)' : ', with the year\'s fee paid') + '. If you cannot attend a meeting, give your proxy to a member who can vote; they cast a ballot for you.'))),
      h('details', { class: 'help-item' }, h('summary', {}, 'Your account'), h('div', { class: 'help-body' },
        h('p', {}, 'This is your BuhurtOS account: the same email and password work on ', h('a', { href: CFG.appUrl + '/', target: '_blank', rel: 'noopener' }, 'BuhurtOS'), ' for events, teams and your fighter profile.'),
        docs.length ? h('ul', {}, docs.map(function (d) { return h('li', {}, h('a', { href: d.href, target: '_blank', rel: 'noopener noreferrer' }, d.title), d.note ? h('span', { class: 'small' }, ' · ' + d.note) : null); })) : null,
        h('p', {}, 'Questions? ', h('a', { href: 'mailto:reddeerreavers@gmail.com' }, 'Email the club'), CFG.discordInvite ? [' or find us on ', h('a', { href: CFG.discordInvite, target: '_blank', rel: 'noopener noreferrer' }, 'Discord')] : null, '.')))));
    v.appendChild(h('section', { class: 'card-panel' }, h('h2', {}, 'Account'), h('p', { class: 'small' }, 'Signed in as ' + (state.session.user.email || '') + '.'),
      h('div', { class: 'row-btns' }, h('a', { class: 'btn-line', href: CFG.appUrl + '/account', target: '_blank', rel: 'noopener' }, 'Account settings on BuhurtOS'),
        h('button', { type: 'button', class: 'btn-line', onclick: inviteMember }, 'Invite a member'),
        h('button', { type: 'button', class: 'btn-line', 'data-testid': 'sign-out-account', onclick: function () { sb.auth.signOut(); } }, 'Sign out'))));
  }
  function renderNotices(v) {
    v.appendChild(h('p', { class: 'small no-print' }, h('a', { href: '#', onclick: function (e) { e.preventDefault(); go('home'); } }, '‹ Home')));
    v.appendChild(noticesCard(0));
  }
  function skeleton(cls) { return h('div', { class: 'skel ' + (cls || ''), 'aria-hidden': 'true' }, h('span', { class: 'skel-line w40' }), h('span', { class: 'skel-line w70 tall' }), h('span', { class: 'skel-line w55' })); }
  // ---------------------------------------------------------------- notices (the executive writes, members read; pinned first)
  var SEEN_KEY = 'rdr-notices-seen';
  function seenAt() { try { return localStorage.getItem(SEEN_KEY) || ''; } catch (e) { return ''; } }
  function markSeen() { try { localStorage.setItem(SEEN_KEY, new Date().toISOString()); } catch (e) { /* ignore */ } }
  function loadNotices(redraw) {
    if (!state.team || (!myMembership() && !state.overview.can_view_roster)) { state.notices = null; return Promise.resolve(); }
    return sb.rpc('club_notices', { p_team: state.team.id, p_limit: 100 }).then(function (r) {
      state.notices = r.error ? { notices: [], can_post: false, error: words(r.error) } : r.data;
      if (redraw !== false && (state.view === 'home' || state.view === 'notices')) render();
    });
  }
  function unreadCount() { var seen = seenAt(); return state.notices ? (state.notices.notices || []).filter(function (n) { return n.posted_at > seen; }).length : 0; }
  function noticeRow(n, seen, full) {
    var fresh = n.posted_at > seen;
    var body = h('div', { class: 'notice-body' }, n.body);
    var row = h('article', { class: 'notice' + (n.pinned ? ' pinned' : '') + (fresh ? ' fresh' : ''), 'data-testid': 'notice' },
      h('div', { class: 'notice-head' }, h('b', {}, n.title), fresh ? chip('active', 'New') : null, n.pinned ? chip('rsvp', 'Pinned') : null),
      h('div', { class: 'small notice-meta' }, n.posted_by_name + ' · ' + timeText(n.posted_at) + (n.updated_at > n.posted_at ? ' · edited' : '')), body);
    if (!full && n.body.length > 220) { body.textContent = n.body.slice(0, 200).replace(/\s+\S*$/, '') + '…'; row.appendChild(h('button', { type: 'button', class: 'btn-line small-btn', onclick: function () { body.textContent = n.body; this.remove(); } }, 'Read all')); }
    return row;
  }
  function noticesCard(limit) {
    var seen = seenAt(), box = h('section', { class: 'card-panel notices', 'data-testid': 'notices', 'aria-busy': String(!state.notices) }, h('h2', {}, 'Notices'));
    if (!state.notices) { box.appendChild(skeleton()); return box; }
    if (state.notices.error) { box.appendChild(h('p', { class: 'small err' }, state.notices.error)); return box; }
    var list = state.notices.notices || [];
    if (!list.length) { box.appendChild(h('p', { class: 'small' }, 'Nothing posted yet.' + (state.notices.can_post ? ' Post the first notice from Exec › Notices.' : ''))); return box; }
    list.slice(0, limit || list.length).forEach(function (n) { box.appendChild(noticeRow(n, seen, !limit)); });
    if (limit && list.length > limit) box.appendChild(h('button', { type: 'button', class: 'btn-line', onclick: function () { go('notices'); } }, 'All ' + list.length + ' notices'));
    setTimeout(markSeen, 1500);
    return box;
  }
  function renderNoticesAdmin(v) {
    var team = state.team, editing = state.noticeEdit || null, archived = !!state.noticeArchive;
    var title = h('input', { class: 'browser-default', id: 'n-title', maxlength: '120', placeholder: 'e.g. Practice moved to 4 pm this Sunday', value: editing ? editing.title : '' });
    var body = h('textarea', { class: 'browser-default', id: 'n-body', rows: '5', maxlength: '4000', placeholder: 'What members need to know' }); body.value = editing ? editing.body : '';
    var pin = h('input', { type: 'checkbox', id: 'n-pin' }); pin.checked = !!(editing && editing.pinned);
    var err = h('p', { class: 'err', role: 'alert' });
    var save = h('button', { type: 'button', class: 'btn-rdr', 'data-testid': 'n-save' }, editing ? 'Save changes' : 'Post notice');
    save.addEventListener('click', function () {
      err.textContent = '';
      if (title.value.trim().length < 3) { err.textContent = 'Give the notice a short title.'; return; }
      if (!body.value.trim()) { err.textContent = 'Write the notice.'; return; }
      busy(save, true);
      var call = editing ? sb.rpc('update_club_notice', { p_notice: editing.id, p_title: title.value.trim(), p_body: body.value.trim(), p_pinned: pin.checked })
                         : sb.rpc('post_club_notice', { p_team: team.id, p_title: title.value.trim(), p_body: body.value.trim(), p_pinned: pin.checked });
      call.then(function (r) { busy(save, false); if (r.error) { err.textContent = words(r.error); return; } state.noticeEdit = null; status(editing ? 'Notice updated.' : 'Notice posted: every member sees it on Home.'); loadNotices(false).then(function () { render(); }); });
    });
    v.appendChild(h('section', { class: 'card-panel', 'data-testid': 'n-form' }, h('h2', {}, editing ? 'Edit notice' : 'Post a notice'),
      h('p', { class: 'small' }, 'Members see notices on Home, pinned ones first. Keep it short; link out for the long version.'),
      h('label', { class: 'fld' }, 'Title', title), h('label', { class: 'fld' }, 'Notice', body),
      h('label', { class: 'check' }, pin, h('span', {}, 'Pin to the top')), err,
      h('div', { class: 'row-btns' }, save, editing ? h('button', { type: 'button', class: 'btn-line', onclick: function () { state.noticeEdit = null; render(); } }, 'Cancel') : null)));
    var list = h('section', { class: 'card-panel', 'data-testid': 'n-list' }, h('div', { class: 'row-btns', style: 'justify-content:space-between;align-items:center' }, h('h2', { style: 'margin:0' }, archived ? 'Archived notices' : 'Live notices'),
      h('button', { type: 'button', class: 'btn-line small-btn', onclick: function () { state.noticeArchive = !archived; render(); } }, archived ? 'Show live' : 'Show archive')));
    v.appendChild(list);
    sb.rpc('club_notices', { p_team: team.id, p_limit: 200, p_archived: archived }).then(function (r) {
      if (r.error) { list.appendChild(h('p', { class: 'err' }, words(r.error))); return; }
      var rows = r.data.notices || [];
      if (!rows.length) list.appendChild(h('p', { class: 'small' }, archived ? 'Nothing archived.' : 'Nothing posted yet.'));
      rows.forEach(function (n) {
        var act = function (fn, label) { return h('button', { type: 'button', class: 'btn-line small-btn', onclick: fn }, label); };
        list.appendChild(h('div', { class: 'arow', 'data-testid': 'n-row' }, h('div', { class: 'who' }, h('b', {}, n.title), h('small', {}, n.posted_by_name + ' · ' + timeText(n.posted_at)), h('div', { class: 'chips' }, n.pinned ? chip('rsvp', 'Pinned') : null)),
          h('div', { class: 'row-btns' },
            archived ? act(function () { runN('archive_club_notice', { p_notice: n.id, p_archived: false }, 'Notice restored.'); }, 'Restore')
                     : [act(function () { state.noticeEdit = n; render(); window.scrollTo(0, 0); }, 'Edit'),
                        act(function () { runN('update_club_notice', { p_notice: n.id, p_title: n.title, p_body: n.body, p_pinned: !n.pinned }, n.pinned ? 'Unpinned.' : 'Pinned to the top.'); }, n.pinned ? 'Unpin' : 'Pin'),
                        act(function () { if (window.confirm('Archive "' + n.title + '"? Members stop seeing it; you can restore it later.')) runN('archive_club_notice', { p_notice: n.id, p_archived: true }, 'Notice archived.'); }, 'Archive')])));
      });
    });
    function runN(fn, args, msg) { sb.rpc(fn, args).then(function (r) { if (r.error) return status(words(r.error), true); status(msg); loadNotices(false).then(function () { render(); }); }); }
  }

  // ================================================================ executive: schedule and run meetings
  var TZ = 'America/Edmonton';
  function tzOffsetMin(date, tz) {
    var parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(date);
    var m = {}; parts.forEach(function (p) { m[p.type] = p.value; });
    return (Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour, +m.minute, +m.second) - date.getTime()) / 60000;
  }
  // 'YYYY-MM-DDTHH:MM' as a wall-clock time in Red Deer -> the instant, whatever time zone the executive's phone is in
  function zonedToIso(wall, tz) {
    var p = wall.split(/[-T:]/).map(Number); if (p.length < 5 || p.some(isNaN)) return null;
    var guess = Date.UTC(p[0], p[1] - 1, p[2], p[3], p[4]), off = tzOffsetMin(new Date(guess), tz), utc = guess - off * 60000, off2 = tzOffsetMin(new Date(utc), tz);
    if (off2 !== off) utc = guess - off2 * 60000;
    return new Date(utc).toISOString();
  }
  function isoToWall(iso, tz) {
    if (!iso) return '';
    var parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(iso));
    var m = {}; parts.forEach(function (p) { m[p.type] = p.value; });
    return m.year + '-' + m.month + '-' + m.day + 'T' + m.hour + ':' + m.minute;
  }
  function loadAdm(id, redraw) {
    if (!id) return Promise.resolve();
    state.admLoading = id;
    var done = function (data, err) {
      if (state.admLoading !== id) return;
      state.admLoading = null;
      if (err) { state.admError = words(err, 'Could not open this meeting.'); state.adm = null; } else { state.adm = data; state.admError = ''; }
      if (redraw !== false) render();
    };
    if (state.legacy) { var d = legacyView(id); return Promise.resolve().then(function () { done(d, d ? null : { message: 'meeting not found' }); }); }
    return sb.rpc('club_meeting_view', { p_meeting: id }).then(function (r) { done(r.data, r.error); });
  }
  function refreshAdmin() { loadAdm(state.admId, false).then(function () { return loadMeetings(false); }).then(function () { if (state.view === 'exec-meeting') render(); }); }
  function sectionsFor(mt) {
    if (mt.kind === 'vote') return [['voting', 'Voting'], ['records', 'Records'], ['details', 'Details']];
    var s = [['people', 'People and check-in'], ['concerns', 'Topics'], ['voting', 'Voting'], ['records', 'Records'], ['details', 'Details']];
    if (mt.kind === 'agm') s.splice(2, 0, ['nominations', 'Nominations']);
    return s;
  }

  function renderExecMeetings(v) {
    var rows = state.meetings ? state.meetings.meetings || [] : [];
    var up = rows.filter(isUpcoming), past = rows.filter(function (x) { return !isUpcoming(x); }).reverse();
    v.appendChild(h('div', { class: 'card-head' }, h('h2', { class: 'section-h', style: 'margin:0' }, 'Meetings'),
      state.meetings && state.meetings.can_manage && !state.legacy ? h('button', { type: 'button', class: 'btn-rdr small-btn', 'data-testid': 'new-meeting', onclick: function () { state.meetingForm = { kind: 'general' }; render(); } }, '+ New') : null));
    if (state.legacy) v.appendChild(h('p', { class: 'notice-box' }, 'Scheduling new meetings needs the database update (club_meetings_reusable). Until then the AGM and the leadership meeting are run from here.'));
    if (state.meetingForm && !state.meetingForm.id) v.appendChild(meetingForm(null));
    v.appendChild(h('div', { class: 'filters', role: 'group', 'aria-label': 'Show' }, [['upcoming', 'Upcoming (' + up.length + ')'], ['past', 'Past (' + past.length + ')']].map(function (f) {
      return h('button', { type: 'button', 'aria-pressed': String(state.meetingsFilter === f[0]), onclick: function () { state.meetingsFilter = f[0]; render(); } }, f[1]);
    })));
    var shown = state.meetingsFilter === 'past' ? past : up;
    if (!shown.length) v.appendChild(h('p', { class: 'empty' }, state.meetingsFilter === 'past' ? 'No past meetings.' : 'Nothing scheduled. Tap + New to schedule a meeting or a vote.'));
    else v.appendChild(h('div', { class: 'mlist', 'data-testid': 'exec-meetings-list' }, shown.map(function (x) { return meetingRow(x, { exec: true }); })));
    v.appendChild(h('p', { class: 'small', style: 'margin-top:14px' }, 'Open a meeting to check people in, put topics on the agenda, run the votes, print the voting list and save the official record.'));
  }

  // the form: schedule a new meeting, or change the one being run
  function meetingForm(existing) {
    var f = state.meetingForm || {}, mt = existing ? existing.meeting : null, isNew = !mt;
    var kind = h('select', { class: 'browser-default', id: 'mf-kind' }, [['general', 'General meeting'], ['agm', 'Annual General Meeting'], ['leadership', 'Leadership meeting (invited members)'], ['vote', 'Vote (no gathering: a question members answer on their phones)']].map(function (k) { return h('option', { value: k[0], selected: (f.kind || 'general') === k[0] }, k[1]); }));
    var title = h('input', { class: 'browser-default', id: 'mf-title', maxlength: '120', placeholder: 'e.g. November general meeting', value: f.title != null ? f.title : (mt ? mt.title : '') });
    var start = h('input', { class: 'browser-default', id: 'mf-start', type: 'datetime-local', value: f.start != null ? f.start : (mt ? isoToWall(mt.starts_at, TZ) : '') });
    var end = h('input', { class: 'browser-default', id: 'mf-end', type: 'datetime-local', value: f.end != null ? f.end : (mt && mt.ends_at ? isoToWall(mt.ends_at, TZ) : '') });
    var loc = h('input', { class: 'browser-default', id: 'mf-location', maxlength: '200', placeholder: 'Where (optional)', value: f.location != null ? f.location : (mt ? mt.location || '' : '') });
    var det = h('textarea', { class: 'browser-default', id: 'mf-details', maxlength: '4000', rows: '4', placeholder: 'What the meeting is about, the agenda, anything members should bring (optional)' }); det.value = f.details != null ? f.details : (mt ? mt.details || '' : '');
    var inv = h('input', { type: 'checkbox', id: 'mf-invite' }); inv.checked = f.invite_only != null ? f.invite_only : (mt ? !!mt.invite_only : (f.kind === 'leadership'));
    var nomClose = h('input', { class: 'browser-default', id: 'mf-nom-close', type: 'datetime-local', value: f.nomClose != null ? f.nomClose : (mt && mt.nominations_close_set ? isoToWall(mt.nominations_close_at, TZ) : '') });
    var topClose = h('input', { class: 'browser-default', id: 'mf-top-close', type: 'datetime-local', value: f.topClose != null ? f.topClose : (mt && mt.topics_close_set ? isoToWall(mt.topics_close_at, TZ) : '') });
    var nomLbl = h('label', { class: 'fld' }, 'New nominations close (optional: otherwise when the meeting starts)', nomClose);
    var topLbl = h('label', { class: 'fld' }, 'Topic submissions close (optional: otherwise when the meeting starts)', topClose);
    var showDeadlines = function () { var k = isNew ? kind.value : mt.kind; nomLbl.hidden = k !== 'agm'; topLbl.hidden = k === 'vote'; };
    showDeadlines();
    var err = h('p', { class: 'err', role: 'alert' });
    var save = h('button', { type: 'button', class: 'btn-rdr', 'data-testid': 'meeting-save' }, isNew ? 'Schedule it' : 'Save changes');
    var remember = function () { state.meetingForm = { id: mt ? mt.id : null, kind: kind.value, title: title.value, start: start.value, end: end.value, location: loc.value, details: det.value, invite_only: inv.checked, nomClose: nomClose.value, topClose: topClose.value }; };
    [kind, title, start, end, loc, det, inv, nomClose, topClose].forEach(function (el) { el.addEventListener('input', remember); el.addEventListener('change', remember); });
    var endLbl = h('label', { class: 'fld' }, 'Ends (optional)', end);
    var sync = function () { endLbl.querySelector('span') && (endLbl.firstChild.textContent = kind.value === 'vote' ? 'Voting closes (optional)' : 'Ends (optional)'); if (isNew && kind.value === 'leadership' && !f.touchedInvite) inv.checked = true; if (isNew && kind.value !== 'leadership' && !f.touchedInvite) inv.checked = false; };
    kind.addEventListener('change', sync); kind.addEventListener('change', showDeadlines); inv.addEventListener('change', function () { f.touchedInvite = true; });
    save.addEventListener('click', function () {
      err.textContent = '';
      if (title.value.trim().length < 3) { err.textContent = 'Give the meeting a short title.'; return; }
      var s = zonedToIso(start.value, TZ); if (!s) { err.textContent = 'Choose the date and time.'; return; }
      var e = end.value ? zonedToIso(end.value, TZ) : null; if (end.value && !e) { err.textContent = 'Check the end time.'; return; }
      if (e && e <= s) { err.textContent = 'The end must come after the start.'; return; }
      var nc = !nomLbl.hidden && nomClose.value ? zonedToIso(nomClose.value, TZ) : null; if (!nomLbl.hidden && nomClose.value && !nc) { err.textContent = 'Check when nominations close.'; return; }
      var tc = !topLbl.hidden && topClose.value ? zonedToIso(topClose.value, TZ) : null; if (!topLbl.hidden && topClose.value && !tc) { err.textContent = 'Check when topics close.'; return; }
      var hadDeadlines = mt ? (!!mt.nominations_close_set || !!mt.topics_close_set) : false;
      var deadlines = function (id) { return (nc || tc || hadDeadlines) ? saveDeadlines({ id: id }, nc, tc) : Promise.resolve(true); };
      busy(save, true);
      var call = isNew
        ? sb.rpc('create_club_meeting', { p_team: state.team.id, p_kind: kind.value, p_title: title.value.trim(), p_starts_at: s, p_timezone: TZ, p_location: loc.value.trim() || null, p_details: det.value.trim() || null, p_invite_only: inv.checked, p_ends_at: e })
        : sb.rpc('update_club_meeting', { p_meeting: mt.id, p_title: title.value.trim(), p_starts_at: s, p_timezone: TZ, p_location: loc.value.trim() || null, p_details: det.value.trim() || null, p_invite_only: inv.checked, p_ends_at: e });
      call.then(function (r) {
        if (r.error) { busy(save, false); err.textContent = words(r.error); return; }
        return deadlines(isNew ? r.data : mt.id).then(function () { return r; });
      }).then(function (r) {
        if (!r) return;
        busy(save, false);
        state.meetingForm = null;
        if (isNew) { status('Scheduled. Members see it under Meetings' + (inv.checked ? ' once you invite them' : '') + '.'); state.agmSection = inv.checked ? 'details' : 'people'; loadMeetings(false).then(function () { go('exec-meeting', { meetingId: r.data }); }); }
        else { status('Meeting updated.'); refreshAdmin(); }
      });
    });
    return h('section', { class: 'card-panel', 'data-testid': 'meeting-form' }, h('h3', {}, isNew ? 'Schedule a meeting or a vote' : 'Change this meeting'),
      isNew ? h('label', { class: 'fld' }, 'Kind', kind) : h('p', { class: 'small' }, kindLabel(mt) + '. The kind cannot change.'),
      h('label', { class: 'fld' }, 'Title', title),
      h('label', { class: 'fld' }, 'Starts (Red Deer time)', start), endLbl, nomLbl, topLbl,
      h('label', { class: 'fld' }, 'Location', loc),
      h('label', { class: 'fld' }, 'Details', det),
      h('label', { class: 'check' }, inv, h('span', {}, 'Invited members only (nobody else sees this meeting)')),
      err, h('div', { class: 'row-btns' }, save, h('button', { type: 'button', class: 'btn-line', onclick: function () { state.meetingForm = null; render(); } }, isNew ? 'Cancel' : 'Close')));
  }

  function renderExecMeeting(v) {
    var id = state.admId, a = state.adm;
    v.appendChild(h('p', { class: 'small no-print' }, h('a', { href: '#', onclick: function (e) { e.preventDefault(); go('exec-meetings'); } }, '‹ All meetings (executive)')));
    if (!a || !a.meeting || a.meeting.id !== id) {
      if (state.admError && state.admLoading !== id) { v.appendChild(h('p', { class: 'err' }, state.admError)); return; }
      if (state.admLoading !== id) loadAdm(id);
      v.appendChild(h('section', { class: 'card-panel', 'aria-busy': 'true' }, skeleton()));
      return;
    }
    var mt = a.meeting, sections = sectionsFor(mt);
    if (!sections.some(function (s) { return s[0] === state.agmSection; })) state.agmSection = sections[0][0];
    var head = h('section', { class: 'card-panel no-print', 'data-testid': 'exec-meeting-head' }, meetingHeader(a, true),
      h('div', { class: 'row-btns' }, h('button', { type: 'button', class: 'btn-line small-btn', onclick: function () { openMeeting(mt.id); } }, 'See it as a member'),
        h('button', { type: 'button', class: 'btn-line small-btn', onclick: function () { shareLink(meetingUrl(mt.id), mt.title); } }, 'Share the link')));
    if (mt.kind !== 'vote' && !state.legacy) {
      var dl = h('div', { class: 'deadlines', 'data-testid': 'deadlines' });
      if (mt.kind === 'agm') dl.appendChild(deadlineLine('nominations', 'New nominations', execReload(mt)));
      dl.appendChild(deadlineLine('topics', 'Topic submissions', execReload(mt)));
      head.appendChild(dl);
    }
    v.appendChild(head);
    v.appendChild(h('div', { class: 'filters no-print', role: 'group', 'aria-label': 'Section' }, sections.map(function (s) {
      return h('button', { type: 'button', 'aria-pressed': String(state.agmSection === s[0]), 'data-section': s[0], onclick: function () { state.agmSection = s[0]; render(); } }, s[1]);
    })));
    var body = h('div', { 'data-testid': 'exec-section-' + state.agmSection }); v.appendChild(body);
    switch (state.agmSection) {
      case 'people': renderAgmAdmin(body); break;
      case 'concerns': drawConcernsAdmin(body); break;
      case 'nominations': drawNominationsAdmin(body); break;
      case 'voting': body.appendChild(h('p', { class: 'small' }, 'Members vote on their phones from this meeting\'s page. Open a question when you reach it; close it to freeze the result.')); drawVotingAdmin(body, false); break;
      case 'records': renderRecords(body); break;
      case 'details': renderDetailsAdmin(body); break;
    }
  }
  function renderRecords(body) {
    var mt = am().meeting;
    body.appendChild(h('h3', {}, mt.kind === 'vote' ? 'Voting list and official record' : 'Voting list, check-in and official record'));
    var pr = h('div'); body.appendChild(pr); renderPrint(pr);
    if (mt.kind !== 'vote') { body.appendChild(h('h3', { class: 'no-print', style: 'margin-top:18px' }, 'Proxies')); var px = h('div', { class: 'no-print' }); body.appendChild(px); renderProxies(px); }
  }
  function renderDetailsAdmin(body) {
    var a = am(), mt = a.meeting;
    if (state.legacy) { body.appendChild(h('p', { class: 'notice-box' }, 'Changing meeting details needs the database update (club_meetings_reusable).')); return; }
    if (!a.can_manage) {
      if (mt.kind !== 'vote') body.appendChild(deadlinesForm(mt));
      body.appendChild(h('p', { class: 'small' }, 'Only the President, Secretary or Treasurer can change the meeting itself (title, time, place, invite list, cancelling).'));
      return;
    }
    if (!state.meetingForm || state.meetingForm.id !== mt.id) state.meetingForm = { id: mt.id, kind: mt.kind };
    body.appendChild(meetingForm(a));
    if (mt.invite_only) body.appendChild(inviteePicker(mt));
    var cancelBtn = h('button', { type: 'button', class: 'btn-line' + (mt.cancelled ? '' : ' danger'), 'data-testid': 'meeting-cancel' }, mt.cancelled ? 'Restore this meeting' : 'Cancel this meeting');
    cancelBtn.addEventListener('click', function () {
      if (!mt.cancelled && !window.confirm('Cancel "' + mt.title + '"? Members will see it as cancelled. Nothing is deleted and you can restore it.')) return;
      sb.rpc('cancel_club_meeting', { p_meeting: mt.id, p_cancelled: !mt.cancelled }).then(function (r) { if (r.error) return status(words(r.error), true); status(mt.cancelled ? 'Meeting restored.' : 'Meeting cancelled.'); refreshAdmin(); });
    });
    body.appendChild(h('section', { class: 'card-panel' }, h('h3', {}, mt.cancelled ? 'Cancelled' : 'Cancelling'), h('p', { class: 'small' }, mt.cancelled ? 'This meeting is shown as cancelled. Its RSVPs, topics, questions and ballots are kept.' : 'A cancelled meeting stays in the list, marked cancelled, with everything recorded so far. Close any open vote first.'), cancelBtn));
  }
  function inviteePicker(mt) {
    var box = h('section', { class: 'card-panel', 'data-testid': 'invitee-picker' }, h('h3', {}, 'Who is invited'), h('p', { class: 'small' }, 'Only ticked members (and the executive) see this meeting.'));
    var list = h('div', { class: 'invitee-pick' }); box.appendChild(h('p', { class: 'small' }, 'Loading members…')); box.appendChild(list);
    var err = h('p', { class: 'err', role: 'alert' }), save = h('button', { type: 'button', class: 'btn-rdr', 'data-testid': 'invitees-save' }, 'Save the invite list');
    Promise.all([fetchRoster(), sb.rpc('club_meeting_invitee_ids', { p_meeting: mt.id })]).then(function (rs) {
      box.querySelector('p.small + p.small') && box.querySelector('p.small + p.small').remove();
      if (rs[0].error) { err.textContent = words(rs[0].error); return; }
      var picked = {}; (rs[1].data || []).forEach(function (x) { picked[x] = true; });
      var rows = (rs[0].data || []).filter(function (r) { return r.status !== 'removed'; }).sort(function (x, y) { return x.full_name.localeCompare(y.full_name); });
      rows.forEach(function (r) {
        var c = h('input', { type: 'checkbox', value: r.membership_id }); c.checked = !!picked[r.membership_id];
        list.appendChild(h('label', { class: 'check' }, c, h('span', {}, r.full_name, r.offices && r.offices.length ? h('span', { class: 'small' }, ' · ' + r.offices.join(', ')) : null, r.status !== 'active' ? h('span', { class: 'small' }, ' · ' + MEMBERSHIP[r.status]) : null)));
      });
      save.addEventListener('click', function () {
        err.textContent = '';
        var ids = Array.prototype.map.call(list.querySelectorAll('input:checked'), function (i) { return i.value; });
        busy(save, true);
        sb.rpc('set_club_meeting_invitees', { p_meeting: mt.id, p_memberships: ids }).then(function (r) { busy(save, false); if (r.error) { err.textContent = words(r.error); return; } status(ids.length + ' member' + (ids.length === 1 ? '' : 's') + ' invited.'); refreshAdmin(); });
      });
    });
    box.appendChild(err); box.appendChild(save);
    return box;
  }

  // ================================================================ header buttons: Exec sheet, Account, Refresh
  (function () {
    var btn = $('exec-btn'), sheet = $('exec-sheet');
    btn.addEventListener('click', function () { if (sheet.open) sheet.close(); else sheet.showModal(); });
    sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.close(); });
    var close = sheet.querySelector('[data-close]'); if (close) close.addEventListener('click', function () { sheet.close(); });
    $('account-btn').addEventListener('click', function () { if (!state.overview) return; go(state.view === 'account' ? (myMembership() ? 'home' : 'join') : 'account'); });
  })();
  function forgetFighterNudge() { /* the fighter-profile prompt lives under Account now; nothing to forget */ }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && state.session && state.team && !state.loading) { loadMeetings(false).then(function () { if (state.view === 'home' || state.view === 'meetings') render(); }); if (voteMeeting()) loadVotes(); } });
})();
