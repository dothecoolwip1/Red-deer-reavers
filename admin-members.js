/* Team Admin › Roster: the club's MEMBERS, live from BuhurtOS (the Red Deer Reavers membership system lives in the BuhurtOS project).
 * Read only here. Membership is private, so this shows only when the browser holds an executive's sign-in from the Members page
 * (same site, same sign-in: the Members page and this page share one session). Everything else about members is managed on the Members page. */
(function () {
  var box = document.querySelector('[data-club-members]');
  if (!box || !window.supabase || !window.BUHURTOS_CFG) return;
  var CFG = window.BUHURTOS_CFG;
  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.publishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'pkce' } });
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]; }); };
  var note = function (html) { box.innerHTML = '<li><span>' + html + '</span></li>'; };
  var statusWord = function (s) { return s === 'active' ? 'Active member' : s === 'pending' ? 'Application pending' : s === 'inactive' ? 'Inactive' : s === 'removed' ? 'Removed' : (s || ''); };
  var duesWord = function (r, waived) { if (waived) return 'fee waived'; var d = r.dues_status; return d === 'paid' ? 'fee paid' : d === 'waived' ? 'fee waived' : d === 'gear_contribution' ? 'gear contribution' : 'fee unpaid'; };

  var members = [], yearRow = null;
  var HIDE = 'hide-buhurtos:';
  var norm = function (v) { return String(v || '').trim().toLowerCase().replace(/\s+/g, ' '); };
  // the public Team page shows people from the site's own roster records (the same ones Add person makes); a member is "on the website"
  // when a record with their name exists and is marked active
  var recordFor = function (r) {
    var A = window.REAVERS_ADMIN; if (!A) return null;
    return A.roster().find(function (m) { return m && m.name && String(m.discipline || '').indexOf(HIDE) !== 0 && norm(m.name) === norm(r.full_name); }) || null;
  };
  function render(rows, year) {
    if (rows) { members = rows; yearRow = year; }
    var waived = !!(yearRow && yearRow.fee_waived);
    var list = (members || []).filter(function (r) { return r.status !== 'removed'; });
    if (!list.length) { note('No club members yet. Members join through the Members page.'); return; }
    var order = { active: 0, pending: 1, inactive: 2 };
    list.sort(function (a, b) { return (order[a.status] ?? 9) - (order[b.status] ?? 9) || String(a.full_name).localeCompare(String(b.full_name)); });
    box.innerHTML = list.map(function (r) {
      var rec = recordFor(r), shown = !!(rec && rec.active);
      var name = r.fighter_id ? '<a href="' + esc(CFG.appUrl + '/fighters/' + encodeURIComponent(r.fighter_id)) + '" target="_blank" rel="noopener">' + esc(r.full_name) + '</a>' : '<b>' + esc(r.full_name) + '</b>';
      var bits = [statusWord(r.status)];
      if (r.office) bits.push(esc(r.office));
      bits.push(duesWord(r, waived));
      bits.push(r.eligible ? 'can vote' : 'cannot vote');
      bits.push(r.fighter_id ? 'fighter profile' : (shown ? 'shown on website' : 'not on website'));
      var action = r.fighter_id ? '' : '<div class="bos-row-actions"><button type="button" class="' + (shown ? '' : 'primary') + '" data-member-toggle="' + esc(r.membership_id) + '" data-member-name="' + esc(r.full_name) + '" data-member-office="' + esc(r.office || '') + '">' + (shown ? 'Hide' : 'Show on website') + '</button></div>';
      return '<li class="' + (r.status === 'active' ? '' : 'is-hidden') + '"><div>' + name + ' <span>' + bits.join(' · ') + '</span></div>' + action + '</li>';
    }).join('');
    var count = document.querySelector('[data-club-members-count]');
    if (count) { var a = list.filter(function (r) { return r.status === 'active'; }).length, p = list.filter(function (r) { return r.status === 'pending'; }).length; count.textContent = a + ' active' + (p ? ', ' + p + ' pending' : ''); }
  }
  // Show on website / Hide: the same roster records as Add person, so the public Team page lists the member with their office as the role
  box.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-member-toggle]'); if (!btn) return;
    var A = window.REAVERS_ADMIN; if (!A) return;
    var r = { full_name: btn.dataset.memberName }, rec = recordFor(r), office = btn.dataset.memberOffice;
    var item = rec ? Object.assign({}, rec, { active: !rec.active }) : { name: btn.dataset.memberName, role: office || 'Member', discipline: '', experience_years: '', affiliations: '', experience_summary: '', bio: '', photo_url: '', active: true, is_example: false, sort_order: 500 };
    btn.disabled = true; btn.textContent = 'Saving…';
    A.api({ action: 'roster_save', item: item }).then(function () { return A.loadData(); }).then(function () { render(); })
      .catch(function (e) { btn.disabled = false; btn.textContent = 'Try again'; note('Could not save: ' + esc(e && e.message || e)); });
  });
  function load() {
    note('Checking your Members sign-in…');
    sb.auth.getSession().then(function (s) {
      var session = s.data && s.data.session;
      if (!session) { note('Sign in on the <a href="members.html">Members page</a> with an executive account, then come back here. Membership is private, so it only shows to the executive.'); return; }
      return sb.from('teams').select('id,name,slug').eq('slug', CFG.teamSlug).maybeSingle().then(function (t) {
        if (t.error || !t.data) { note('Could not find the Red Deer Reavers in BuhurtOS.'); return; }
        var teamId = t.data.id;
        return sb.rpc('club_membership_overview', { p_team: teamId }).then(function (o) {
          if (o.error) { note('Could not read the membership: ' + esc(o.error.message)); return; }
          if (!o.data || !o.data.can_view_roster) { note('You are signed in as ' + esc(session.user.email || 'a member') + ', which is not a current executive account, so the members list stays private. Sign in on the <a href="members.html">Members page</a> with an executive account.'); return; }
          var year = o.data.current_year, yrow = o.data.year || null;
          return Promise.all([sb.rpc('club_member_roster', { p_team: teamId, p_year: year }), sb.rpc('club_member_profile_links', { p_team: teamId, p_year: year })]).then(function (rs) {
            if (rs[0].error) { note('Could not load the members list: ' + esc(rs[0].error.message)); return; }
            var links = {}; (rs[1].data || []).forEach(function (x) { if (x.fighter_id) links[x.membership_id] = x.fighter_id; });
            (rs[0].data || []).forEach(function (x) { x.fighter_id = links[x.membership_id] || null; });
            render(rs[0].data, yrow);
          });
        });
      });
    }).catch(function (e) { note('Could not reach BuhurtOS just now.'); });
  }
  load();
  sb.auth.onAuthStateChange(function () { load(); });
})();
