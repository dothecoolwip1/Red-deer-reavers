/*
 * Red Deer Reavers members area.
 *
 * ONE account: this page signs in to the same Supabase Auth project as BuhurtOS, so the person is the same auth user on both sites.
 * There is no Reavers password database and no token is ever passed between the two websites. Each website keeps its own sign-in session
 * in its own browser storage (signing in here does not sign you in on buhurtos.ca and the other way round); the account behind both is one.
 *
 * Nothing here is a security boundary. What a person may see or change is decided by the BuhurtOS database (club_* functions, migration
 * 20261013000100): a regular member gets only their own record; the club's current executive gets the members list; only the current
 * President, Secretary or Treasurer may change dues or membership status. All text from the database is inserted with textContent.
 */
(function () {
  'use strict';
  var CFG = window.BUHURTOS;
  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
  });
  var $ = function (id) { return document.getElementById(id); };
  var state = { session: null, team: null, overview: null, view: null, year: null, roster: null, filter: 'all', search: '', duesFor: null, asOf: today() };

  var MEMBERSHIP = { pending: 'Pending', active: 'Active', inactive: 'Inactive', removed: 'Removed' };
  var DUES = { unpaid: 'Unpaid', paid: 'Paid', waived: 'Waived', gear_contribution: 'Gear contribution' };

  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function money(c) { return c == null ? '' : '$' + (c / 100).toFixed(c % 100 === 0 ? 0 : 2); }
  function dateText(iso) { return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }); }

  /** h('div', {class: 'x', onclick: fn}, 'text', child) — text is always text, never HTML. */
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

  /** Words a person can act on. Database messages for permission problems never reveal more than "not allowed". */
  function words(err, fallback) {
    var e = err || {};
    if (navigator.onLine === false) return 'You are offline. Try again when you have signal.';
    if (e.code === '42501') return 'You do not have permission to do that.';
    if (['22023', 'P0001', 'P0002', '23505'].indexOf(e.code) >= 0 && e.message) return e.message.charAt(0).toUpperCase() + e.message.slice(1) + '.';
    var m = String(e.message || '').toLowerCase();
    if (e.code === 'invalid_credentials' || m.indexOf('invalid login') >= 0) return 'That email and password do not match. Check them, or use "Forgot password?" or an email code.';
    if (e.code === 'otp_expired' || (m.indexOf('token') >= 0 && m.indexOf('expired') >= 0) || m.indexOf('invalid') >= 0 && m.indexOf('otp') >= 0) return 'That code is not right or has expired. Ask for a new one.';
    if (e.code === 'email_not_confirmed') return 'Confirm your email address first, using the link BuhurtOS emailed you.';
    if (e.status === 429 || m.indexOf('rate limit') >= 0) return 'Too many attempts. Wait a minute and try again.';
    if (m.indexOf('failed to fetch') >= 0 || m.indexOf('network') >= 0) return 'Could not reach BuhurtOS. Check your signal and try again.';
    return fallback || 'Something went wrong. Please try again.';
  }

  // ------------------------------------------------------------ sign in (same Supabase Auth as BuhurtOS)
  var membershipPath = '/teams/' + CFG.teamSlug + '/membership';
  $('link-forgot').href = CFG.appUrl + '/sign-in?next=' + encodeURIComponent(membershipPath);
  $('link-signup').href = CFG.appUrl + '/sign-in?mode=signup&next=' + encodeURIComponent(membershipPath);

  $('password-form').addEventListener('submit', function (e) {
    e.preventDefault(); status('');
    var email = $('email').value.trim(), pw = $('password').value;
    if (!email || !pw) return status('Enter your email and password, or use an email code.', true);
    $('password-btn').disabled = true;
    sb.auth.signInWithPassword({ email: email, password: pw }).then(function (r) {
      $('password-btn').disabled = false;
      if (r.error) status(words(r.error), true);
    });
  });
  $('code-form').addEventListener('submit', function (e) {
    e.preventDefault(); status('');
    var email = $('email').value.trim();
    if (!email) return status('Enter your email address above first.', true);
    $('code-send-btn').disabled = true;
    sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true } }).then(function (r) {
      $('code-send-btn').disabled = false;
      if (r.error) return status(words(r.error), true);
      $('code-step').hidden = false; $('code').focus();
      status('If that address can receive email, a 6-digit code is on its way. Enter it below.');
    });
  });
  $('code-verify-btn').addEventListener('click', function () {
    status('');
    var email = $('email').value.trim(), code = $('code').value.replace(/\s/g, '');
    if (!code) return status('Enter the code from the email.', true);
    $('code-verify-btn').disabled = true;
    sb.auth.verifyOtp({ email: email, token: code, type: 'email' }).then(function (r) {
      $('code-verify-btn').disabled = false;
      if (r.error) status(words(r.error), true);
    });
  });
  $('sign-out').addEventListener('click', function () { sb.auth.signOut(); });

  sb.auth.onAuthStateChange(function (event, session) {
    var before = state.session && state.session.user.id;
    state.session = session;
    if (!session) { showSignedOut(); return; }
    if (before !== session.user.id || event === 'SIGNED_IN' && !state.overview) setTimeout(load, 0);
  });

  function showSignedOut() {
    state.overview = null; state.team = null; state.roster = null;
    $('signed-in').hidden = true; $('signed-out').hidden = false; $('view').textContent = '';
  }

  // ------------------------------------------------------------ load the member's own view (and leadership tools when the database allows)
  function load() {
    status('Loading your membership…');
    $('signed-out').hidden = true; $('signed-in').hidden = false;
    $('who').textContent = state.session.user.email || '';
    $('buhurtos-link').textContent = '';
    $('buhurtos-link').appendChild(h('a', { href: CFG.appUrl + membershipPath, rel: 'noopener' }, 'Open the full membership tools in BuhurtOS'));
    $('buhurtos-link').appendChild(document.createTextNode(' (executive roles, editing your application). You may need to sign in there too: same email and password.'));
    sb.from('teams').select('id,name,slug').eq('slug', CFG.teamSlug).maybeSingle().then(function (t) {
      if (t.error || !t.data) { status(words(t.error, 'Could not find the Red Deer Reavers in BuhurtOS.'), true); return; }
      state.team = t.data;
      return sb.rpc('club_membership_overview', { p_team: state.team.id }).then(function (r) {
        if (r.error) { status(words(r.error, 'Could not load your membership.'), true); return; }
        state.overview = r.data; state.year = r.data.current_year;
        status('');
        if (!state.view) state.view = r.data.can_view_roster ? 'members' : 'mine';
        render();
      });
    });
  }

  function render() {
    var o = state.overview;
    var tabs = [['mine', 'My membership']];
    if (o.can_view_roster) tabs.push(['members', 'Members'], ['agm', 'AGM voters'], ['history', 'Dues history']);
    var nav = $('tabs'); nav.textContent = ''; nav.hidden = tabs.length < 2;
    tabs.forEach(function (t) {
      nav.appendChild(h('button', { type: 'button', 'aria-selected': String(state.view === t[0]), onclick: function () { state.view = t[0]; render(); } }, t[1]));
    });
    var v = $('view'); v.textContent = '';
    if (!o.enabled) { v.appendChild(h('p', {}, 'Membership is not set up in BuhurtOS yet.')); return; }
    if (state.view === 'mine') v.appendChild(renderMine(o));
    else if (state.view === 'members') renderMembers(v);
    else if (state.view === 'agm') renderAgm(v);
    else if (state.view === 'history') renderHistory(v);
  }

  function voteBanner(eligible, reasons) {
    return h('div', { class: 'vote ' + (eligible ? 'yes' : 'no'), 'data-testid': 'vote-banner' },
      h('b', {}, eligible ? 'ELIGIBLE TO VOTE' : 'NOT ELIGIBLE TO VOTE'),
      !eligible && reasons && reasons.length ? h('span', {}, reasons.join(' · ')) : null);
  }

  function renderMine(o) {
    var wrap = h('div', {});
    var m = (o.memberships || []).filter(function (x) { return x.year === o.current_year; })[0];
    var offices = (o.offices || []).map(function (x) { return x.label; });
    var year = (o.years || []).filter(function (y) { return y.year === o.current_year; })[0];
    if (m) {
      wrap.appendChild(h('section', { class: 'card-panel', 'data-testid': 'my-membership' },
        voteBanner(m.eligible, m.reasons),
        h('dl', { class: 'facts' },
          h('dt', {}, 'Member'), h('dd', {}, m.full_name),
          h('dt', {}, 'Membership'), h('dd', {}, chip(m.status, MEMBERSHIP[m.status]), ' ', String(m.year)),
          h('dt', {}, m.year + ' dues'), h('dd', {}, chip(m.dues_status, DUES[m.dues_status]), ' ', money(m.dues_amount_cents)),
          offices.length ? [h('dt', {}, 'Executive role'), h('dd', {}, offices.join(', '))] : null,
          m.discord_name ? [h('dt', {}, 'Discord'), h('dd', {}, m.discord_name)] : null,
          h('dt', {}, 'Applied'), h('dd', {}, dateText(m.applied_at))),
        m.status === 'pending' ? h('p', { class: 'small' }, 'Your application is waiting for the club executive. Dues are recorded by the President, Secretary or Treasurer.') : null,
        m.status === 'active' && m.dues_status === 'unpaid' ? h('p', { class: 'small' }, 'Pay your ' + money(year ? year.dues_cents : null) + ' dues to the Treasurer; they record it here.') : null));
    } else {
      if (offices.length) wrap.appendChild(h('p', {}, 'Your executive role: ', h('b', {}, offices.join(', ')), '. You have no ' + o.current_year + ' membership record yet.'));
      if (year && year.applications_open) wrap.appendChild(applyForm(o, year));
      else if (year) wrap.appendChild(h('p', {}, 'Applications for ' + year.year + ' are closed. Ask the club executive.'));
    }
    return wrap;
  }

  function applyForm(o, year) {
    var name = h('input', { class: 'browser-default', id: 'ap-name', autocomplete: 'name', maxlength: '120', value: o.suggested_name || '' });
    var discord = h('input', { class: 'browser-default', id: 'ap-discord', maxlength: '64' });
    var dob = h('input', { class: 'browser-default', id: 'ap-dob', type: 'date', max: today() });
    var adult = h('input', { type: 'checkbox', id: 'ap-adult' });
    var bylaws = h('input', { type: 'checkbox', id: 'ap-bylaws' });
    var err = h('p', { class: 'err', role: 'alert' });
    var btn = h('button', { class: 'btn-rdr', type: 'submit' }, 'Apply');
    var form = h('form', { class: 'card-panel', 'data-testid': 'apply-form', novalidate: true },
      h('h2', {}, 'Apply to become a ' + year.year + ' member'),
      h('p', { class: 'small' }, 'Annual dues for ' + year.year + ': ', h('b', {}, money(year.dues_cents)), ', paid to the Treasurer. Your account email: ' + (o.email || '') + '.'),
      h('label', { class: 'fld' }, 'Full name', name),
      h('label', { class: 'fld' }, 'Discord name (optional)', discord),
      h('label', { class: 'fld' }, 'Date of birth (optional if you confirm 18+ below)', dob),
      h('label', { class: 'check' }, adult, h('span', {}, 'I confirm I am 18 or older')),
      h('label', { class: 'check' }, bylaws, h('span', {}, 'I agree to follow the Red Deer Reavers bylaws and team standards')),
      err, btn);
    form.addEventListener('submit', function (e) {
      e.preventDefault(); err.textContent = '';
      if (name.value.trim().length < 2) { err.textContent = 'Enter your full name.'; return; }
      if (!dob.value && !adult.checked) { err.textContent = 'Give your date of birth, or confirm you are 18 or older.'; return; }
      if (!bylaws.checked) { err.textContent = 'You must agree to follow the bylaws and team standards.'; return; }
      btn.disabled = true;
      sb.rpc('apply_for_club_membership', {
        p_team: state.team.id, p_year: year.year, p_full_name: name.value.trim(), p_discord_name: discord.value.trim() || null,
        p_date_of_birth: dob.value || null, p_adult_confirmed: adult.checked, p_agree_bylaws: bylaws.checked
      }).then(function (r) {
        btn.disabled = false;
        if (r.error) { err.textContent = words(r.error); return; }
        state.overview = null; load();
      });
    });
    return form;
  }

  // ------------------------------------------------------------ leadership (the database refuses anyone else)
  function fetchRoster(asOf) {
    var args = { p_team: state.team.id, p_year: state.year };
    if (asOf) args.p_as_of = asOf;
    return sb.rpc('club_member_roster', args);
  }
  function satisfied(s) { return s !== 'unpaid'; }
  function summarize(rows) {
    var live = rows.filter(function (r) { return r.status !== 'removed'; });
    return {
      total: live.length, active: live.filter(function (r) { return r.status === 'active'; }).length,
      voting: rows.filter(function (r) { return r.eligible; }).length,
      paid: live.filter(function (r) { return satisfied(r.dues_status); }).length,
      outstanding: live.filter(function (r) { return (r.status === 'active' || r.status === 'pending') && !satisfied(r.dues_status); }).length,
      pending: live.filter(function (r) { return r.status === 'pending'; }).length
    };
  }
  var FILTERS = [['all', 'All'], ['eligible', 'Can vote'], ['not_eligible', 'Cannot vote'], ['paid', 'Dues paid'], ['unpaid', 'Dues unpaid'], ['pending', 'Pending'], ['active', 'Active']];
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
  function drawMembers(v) {
    v.textContent = '';
    var o = state.overview, rows = state.roster, s = summarize(rows);
    var tile = function (n, label, tone, f) { return h('button', { type: 'button', class: 'tile ' + tone, onclick: function () { state.filter = f; drawMembers(v); } }, h('b', {}, String(n)), h('span', {}, label)); };
    v.appendChild(h('div', { class: 'tiles', 'data-testid': 'summary' },
      tile(s.total, 'Total members', '', 'all'), tile(s.active, 'Active', '', 'active'), tile(s.voting, 'Can vote', 'yes', 'eligible'),
      tile(s.paid, 'Dues paid', '', 'paid'), tile(s.outstanding, 'Dues outstanding', s.outstanding ? 'no' : '', 'unpaid'),
      tile(s.pending, 'Pending applications', s.pending ? 'warn' : '', 'pending')));
    v.appendChild(h('div', { class: 'filters', role: 'group', 'aria-label': 'Show' }, FILTERS.map(function (f) {
      return h('button', { type: 'button', 'aria-pressed': String(state.filter === f[0]), onclick: function () { state.filter = f[0]; drawMembers(v); } }, f[1]);
    })));
    var search = h('input', { type: 'search', class: 'browser-default', placeholder: 'Find a member', 'aria-label': 'Find a member', value: state.search });
    search.addEventListener('input', function () { state.search = search.value; var pos = search.selectionStart; drawMembers(v); var n = v.querySelector('input[type=search]'); n.focus(); n.setSelectionRange(pos, pos); });
    v.appendChild(search);
    var list = h('div', { role: 'table', 'aria-label': state.year + ' members' },
      h('div', { class: 'mrow head', role: 'row' }, h('span', {}, 'Member'), h('span', {}, 'Membership'), h('span', {}, state.year + ' dues'), h('span', {}, 'Voting'), h('span', {}, 'Actions')));
    var shown = rows.filter(keep);
    if (!rows.length) v.appendChild(h('p', {}, 'Nobody has applied for ' + state.year + ' yet.'));
    else if (!shown.length) v.appendChild(h('p', {}, 'Nobody matches.'));
    shown.forEach(function (r) {
      list.appendChild(h('div', { class: 'mrow' + (r.status === 'pending' ? ' pending' : ''), role: 'row', 'data-testid': 'member-row' },
        h('span', { class: 'who', role: 'cell' }, h('b', {}, r.full_name), r.offices && r.offices.length ? h('small', {}, r.offices.join(', ')) : null),
        h('span', { class: 'st', role: 'cell' }, chip(r.status, MEMBERSHIP[r.status])),
        h('span', { class: 'du', role: 'cell' }, chip(r.dues_status, DUES[r.dues_status])),
        h('span', { class: 'vt', role: 'cell' }, chip(r.eligible ? 'can' : 'cannot', r.eligible ? 'Can vote' : 'Cannot vote'), !r.eligible && r.reasons.length ? h('small', {}, r.reasons.join(' · ')) : null),
        h('span', { class: 'acts', role: 'cell' },
          o.can_change_dues ? h('button', { type: 'button', class: 'btn-line small-btn', 'aria-label': 'Change dues for ' + r.full_name, onclick: function () { openDues(r); } }, 'Dues') : null,
          o.can_change_dues && r.status === 'pending' ? h('button', { type: 'button', class: 'btn-rdr small-btn', 'aria-label': 'Approve ' + r.full_name, onclick: function () { approve(r); } }, 'Approve') : null)));
    });
    v.appendChild(list);
  }

  function approve(r) {
    if (!window.confirm('Approve ' + r.full_name + ' as an active ' + state.year + ' member?')) return;
    sb.rpc('set_club_membership_status', { p_membership: r.membership_id, p_status: 'active', p_note: null }).then(function (x) {
      if (x.error) return status(words(x.error), true);
      status(''); renderMembers(clear());
    });
  }
  function clear() { var v = $('view'); v.textContent = ''; return v; }

  // dues dialog
  var dlg = $('dues-dialog');
  function openDues(r) {
    state.duesFor = r;
    $('dues-title').textContent = r.full_name + ': ' + state.year + ' dues';
    $('dues-now').textContent = 'Now: ' + DUES[r.dues_status] + (r.dues_changed_by_name ? ' · last changed by ' + r.dues_changed_by_name : '');
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
    $('dues-save').disabled = true;
    sb.rpc('set_club_dues', { p_membership: state.duesFor.membership_id, p_status: st, p_amount_cents: cents, p_note: $('dues-note').value.trim() || null }).then(function (r) {
      $('dues-save').disabled = false;
      if (r.error) { $('dues-err').textContent = words(r.error); return; }
      dlg.close(); renderMembers(clear());
    });
  });

  function renderAgm(v) {
    var date = h('input', { type: 'date', class: 'browser-default', value: state.asOf, 'aria-label': 'AGM date' });
    date.addEventListener('change', function () { state.asOf = date.value || today(); renderAgm(clear()); });
    v.appendChild(h('div', { class: 'no-print row-btns', style: 'align-items:end;margin-bottom:8px' },
      h('label', { class: 'fld', style: 'max-width:220px;margin:0' }, 'AGM date (ages counted on)', date),
      h('button', { type: 'button', class: 'btn-line', onclick: function () { window.print(); } }, 'Print')));
    v.appendChild(h('p', { class: 'small no-print' }, 'Read-only snapshot. Nothing on this screen changes membership or dues.'));
    var out = h('div', { 'data-testid': 'agm' }, h('p', { class: 'small' }, 'Loading…'));
    v.appendChild(out);
    fetchRoster(state.asOf).then(function (r) {
      out.textContent = '';
      if (r.error) { out.appendChild(h('p', { class: 'err' }, words(r.error))); return; }
      var byName = function (a, b) { return a.full_name.localeCompare(b.full_name); };
      var voters = r.data.filter(function (x) { return x.eligible; }).sort(byName);
      var excluded = r.data.filter(function (x) { return !x.eligible && x.status !== 'removed'; }).sort(byName);
      out.appendChild(h('h2', { style: 'font-family:Cinzel,serif;font-size:1.5rem;margin:0' }, (state.team.name) + ' · ' + state.year + ' eligible voters'));
      out.appendChild(h('p', { class: 'small' }, 'As of ' + dateText(state.asOf + 'T12:00:00') + ' · from BuhurtOS'));
      out.appendChild(h('div', { class: 'agm-count' }, h('b', { 'data-testid': 'agm-count' }, String(voters.length)), ' eligible voter' + (voters.length === 1 ? '' : 's')));
      out.appendChild(h('h3', { style: 'font-size:1.2rem;font-weight:700' }, 'Eligible to vote'));
      out.appendChild(voters.length ? h('ol', { class: 'agm-list' }, voters.map(function (x) { return h('li', {}, x.full_name, x.offices.length ? h('small', {}, ' (' + x.offices.join(', ') + ')') : null); })) : h('p', {}, 'Nobody is eligible yet.'));
      out.appendChild(h('h3', { style: 'font-size:1.2rem;font-weight:700' }, 'Not eligible (' + excluded.length + ')'));
      out.appendChild(excluded.length ? h('ul', { class: 'agm-out' }, excluded.map(function (x) { return h('li', {}, h('b', {}, x.full_name), h('span', {}, x.reasons.join(' · '))); })) : h('p', {}, 'Nobody is excluded.'));
    });
  }

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

  document.addEventListener('DOMContentLoaded', function () { if (window.M) window.M.Sidenav.init(document.querySelectorAll('.sidenav')); });
  sb.auth.getSession().then(function (r) { if (!r.data.session) showSignedOut(); });
})();
