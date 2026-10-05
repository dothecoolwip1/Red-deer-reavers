(()=>{
  const API=window.REAVERS_API||"https://oztfcnrwrovzasftsdwa.supabase.co/functions/v1/reavers-site-api";
  const tokenKey="reaversAdminToken";
  const state={data:null,calendarMonth:new Date(new Date().getFullYear(),new Date().getMonth(),1),editor:null,rosterSortable:null};
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
  const token=()=>sessionStorage.getItem(tokenKey)||"";
  const timeShort=value=>{if(!value)return"";const [h,m]=String(value).split(":").map(Number);if(Number.isNaN(h))return String(value);const suffix=h>=12?"PM":"AM";const hour=h%12||12;return `${hour}:${String(m||0).padStart(2,"0")} ${suffix}`};
  const dateLabel=value=>{if(!value)return"";const d=new Date(`${value}T12:00:00`);return new Intl.DateTimeFormat("en-CA",{weekday:"short",month:"short",day:"numeric",year:"numeric"}).format(d)};
  const dayNames=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  let toastTimer=null;
  // A roster record whose discipline is "hide-buhurtos:<fighter id>" keeps that BuhurtOS fighter off the public pages.
  const HIDE="hide-buhurtos:";
  const isHideRecord=m=>String(m.discipline||"").startsWith(HIDE);
  const hiddenId=m=>String(m.discipline||"").slice(HIDE.length).trim().toLowerCase();

  function showToast(message){
    const el=$("[data-toast]");
    el.textContent=message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>el.classList.remove("show"),2400);
  }

  async function api(body=null){
    const options={method:body?"POST":"GET",headers:{"Content-Type":"application/json"},cache:"no-store"};
    if(token())options.headers["x-reavers-admin"]=token();
    if(body)options.body=JSON.stringify(body);
    const response=await fetch(API,options);
    const payload=await response.json().catch(()=>({}));
    if(response.status===401&&body?.action!=="login"){
      sessionStorage.removeItem(tokenKey);
      showLogin("Admin session expired. Enter the password again.");
      throw new Error("Session expired");
    }
    if(!response.ok)throw new Error(payload.error||`Request failed (${response.status})`);
    return payload;
  }

  function showLogin(message=""){
    $("[data-login-panel]").hidden=false;
    $("[data-dashboard]").hidden=true;
    $("[data-login-message]").textContent=message;
  }
  function showDashboard(){
    $("[data-login-panel]").hidden=true;
    $("[data-dashboard]").hidden=false;
  }

  async function loadData(){
    state.data=await api();
    renderAll();
    if(!state.bosRequested){state.bosRequested=true;loadBos()}
  }

  async function loadBos(){
    if(!window.BUHURTOS)return;
    try{state.bos=(await window.BUHURTOS.teamRoster()).fighters;state.bosError=false}catch{state.bos=null;state.bosError=true}
    try{state.bosEvents=await window.BUHURTOS.upcomingEvents()}catch{state.bosEvents=null}
    renderBos();
  }

  function renderBos(){
    const list=$("[data-bos-roster]");
    if(list){
      const hidden=new Set((state.data?.roster||[]).filter(isHideRecord).map(hiddenId));
      if(state.bos===undefined)list.innerHTML='<li><span>Loading fighters from BuhurtOS…</span></li>';
      else if(state.bosError||state.bos===null)list.innerHTML='<li><span>BuhurtOS could not be reached just now. The public Team page will retry on its own.</span></li>';
      else if(!state.bos.length)list.innerHTML='<li><span>No fighters on the BuhurtOS roster yet. Share the sign-up steps with the team.</span></li>';
      else list.innerHTML=state.bos.map(f=>{
        const off=hidden.has(String(f.id).toLowerCase());
        return `<li class="${off?"is-hidden":""}"><div><b>${esc(f.name)}</b> <span>${f.captain?"Captain · ":""}${off?"Hidden from website":f.avatar?"Shown · has photo":"Shown · no photo yet"}</span></div><div class="bos-row-actions"><a href="${esc(f.profileUrl)}" target="_blank" rel="noopener">View card</a><button type="button" class="visibility-button ${off?"":"is-visible"}" data-bos-toggle="${esc(f.id)}" data-bos-name="${esc(f.name)}" aria-pressed="${off?"false":"true"}" aria-label="${off?"Show":"Hide"} ${esc(f.name)} ${off?"on":"from"} the website">${off?"Show":"Hide"}</button></div></li>`;
      }).join("");
    }
    const events=$("[data-bos-events]");
    if(events){
      if(state.bosEvents===undefined)events.innerHTML='<li><span>Loading events from BuhurtOS…</span></li>';
      else if(state.bosEvents===null)events.innerHTML='<li><span>BuhurtOS could not be reached just now.</span></li>';
      else if(!state.bosEvents.length)events.innerHTML='<li><span>No upcoming tournaments on BuhurtOS yet. When there are, they appear on the public Events page automatically.</span></li>';
      else events.innerHTML=state.bosEvents.map(e=>`<li><div><b>${esc(e.name)}</b> <span>${e.reavers?`Reavers ${esc(e.reavers)} · `:""}${esc(dateLabel(e.startsOn))}${e.endsOn&&e.endsOn!==e.startsOn?` to ${esc(dateLabel(e.endsOn))}`:""}${e.where?` · ${esc(e.where)}`:""}</span></div><div class="bos-row-actions"><a href="${esc(e.url)}" target="_blank" rel="noopener">Open</a></div></li>`).join("");
    }
  }

  function renderAll(){
    renderCalendar();
    renderEventList();
    renderRoster();
    renderBos();
    renderPractices();
    renderCommunityInquiries();
    renderSettings();
  }

  function renderCalendar(){
    const grid=$("[data-calendar-grid]");
    const month=state.calendarMonth;
    $("[data-calendar-title]").textContent=new Intl.DateTimeFormat("en-CA",{month:"long",year:"numeric"}).format(month);
    const first=new Date(month.getFullYear(),month.getMonth(),1);
    const start=new Date(first);start.setDate(1-first.getDay());
    const today=new Date();
    const events=state.data?.events||[];
    const practices=(state.data?.practices||[]).filter(x=>x.active);
    let html="";
    for(let i=0;i<42;i++){
      const d=new Date(start);d.setDate(start.getDate()+i);
      const yyyy=d.getFullYear(),mm=String(d.getMonth()+1).padStart(2,"0"),dd=String(d.getDate()).padStart(2,"0");
      const iso=`${yyyy}-${mm}-${dd}`;
      const outside=d.getMonth()!==month.getMonth();
      const isToday=d.toDateString()===today.toDateString();
      const dayEvents=events.filter(e=>e.event_date===iso);
      const dayPractices=practices.filter(p=>Number(p.weekday)===d.getDay());
      html+=`<div class="calendar-day${outside?" outside":""}${isToday?" today":""}" data-date="${iso}"><span class="calendar-date">${d.getDate()}</span>`;
      for(const p of dayPractices)html+=`<span class="calendar-item practice" title="${esc(p.label)} practice">${esc(p.label)} practice</span>`;
      for(const e of dayEvents)html+=`<button type="button" class="calendar-item ${esc(e.event_type||"other")}" data-edit-event="${esc(e.id)}" title="${esc(e.title)}">${esc(e.title)}</button>`;
      html+="</div>";
    }
    grid.innerHTML=html;
  }

  function renderEventList(){
    const list=$("[data-event-manage-list]");
    const events=[...(state.data?.events||[])].sort((a,b)=>String(a.event_date).localeCompare(String(b.event_date))||String(a.start_time||"").localeCompare(String(b.start_time||"")));
    $("[data-event-count]").textContent=`${events.length} saved`;
    if(!events.length){list.innerHTML='<div class="empty-state">No events yet. Add a tournament, demo, meeting, social, or one-off practice.</div>';return}
    list.innerHTML=events.map(e=>`<article class="manage-row"><div class="manage-row-main"><strong>${esc(e.title)}</strong><span>${esc(dateLabel(e.event_date))}${e.start_time?` · ${esc(timeShort(e.start_time))}`:""}${e.location?` · ${esc(e.location)}`:""}</span><small>${esc(e.event_type||"other")}${e.is_public?" · Public":" · Hidden"}</small></div><div class="manage-row-actions"><button type="button" class="small-button" data-edit-event="${esc(e.id)}">Edit</button><button type="button" class="small-button delete" data-delete-event="${esc(e.id)}">Delete</button></div></article>`).join("");
  }

  function renderRoster(){
    const list=$("[data-roster-manage-list]");
    const roster=[...(state.data?.roster||[])].filter(m=>!isHideRecord(m)).sort((a,b)=>(Number(a.sort_order)||0)-(Number(b.sort_order)||0)||String(a.name).localeCompare(String(b.name)));
    if(!roster.length){list.innerHTML='<div class="empty-state">No roster members yet.</div>';return}
    list.innerHTML=roster.map(m=>`<article class="manage-row" data-roster-id="${esc(m.id)}">${m.photo_url?`<img class="member-thumb" src="${esc(m.photo_url)}" alt="">`:`<img class="member-thumb placeholder" src="assets/reavers-logo.jpg" alt="">`}<div class="manage-row-main"><strong>${esc(m.name)}</strong><span>${esc(m.role||"Team member")}${m.discipline?` · ${esc(m.discipline)}`:""}${m.experience_years!==null&&m.experience_years!==undefined?` · ${esc(m.experience_years)}+ yrs`:""}</span>${m.affiliations?`<small>${esc(m.affiliations)}</small>`:""}${m.is_example?'<span class="badge">SAMPLE PROFILE</span>':""}${!m.active?'<span class="badge inactive">NOT SHOWN</span>':'<span class="badge visible">SHOWN ON SITE</span>'}</div><div class="manage-row-actions"><button type="button" class="visibility-button ${m.active?"is-visible":""}" data-toggle-roster="${esc(m.id)}" aria-pressed="${m.active?"true":"false"}">${m.active?"Shown":"Not shown"}</button><button type="button" class="small-button drag-handle" aria-label="Drag ${esc(m.name)} to reorder" title="Drag to reorder">↕</button><button type="button" class="small-button" data-edit-roster="${esc(m.id)}">Edit</button><button type="button" class="small-button delete" data-delete-roster="${esc(m.id)}">Delete</button></div></article>`).join("");
    setupRosterSorting(list);
  }

  function setupRosterSorting(list){
    if(state.rosterSortable){state.rosterSortable.destroy();state.rosterSortable=null}
    if(!window.Sortable||!list||list.children.length<2)return;
    state.rosterSortable=window.Sortable.create(list,{
      animation:160,
      handle:".drag-handle",
      ghostClass:"drag-ghost",
      chosenClass:"drag-chosen",
      onEnd:async()=>{
        const ids=Array.from(list.querySelectorAll("[data-roster-id]")).map(row=>row.dataset.rosterId);
        try{
          await api({action:"roster_reorder",ids});
          await loadData();
          showToast("Roster order saved");
        }catch(error){showToast(error.message)}
      }
    });
  }

  function renderPractices(){
    const list=$("[data-practice-manage-list]");
    const practices=[...(state.data?.practices||[])].sort((a,b)=>(Number(a.sort_order)||0)-(Number(b.sort_order)||0)||Number(a.weekday)-Number(b.weekday));
    if(!practices.length){list.innerHTML='<div class="empty-state">No recurring practices set.</div>';return}
    list.innerHTML=practices.map(p=>`<article class="manage-row"><div class="manage-row-main"><strong>${esc(p.label)} · ${esc(timeShort(p.start_time))} to ${esc(timeShort(p.end_time))}</strong><span>${esc(p.venue)}${p.fee?` · ${esc(p.fee)}`:""}</span>${!p.active?'<span class="badge inactive">HIDDEN</span>':""}</div><div class="manage-row-actions"><button type="button" class="small-button" data-edit-practice="${esc(p.id)}">Edit</button><button type="button" class="small-button delete" data-delete-practice="${esc(p.id)}">Delete</button></div></article>`).join("");
  }

  function renderCommunityInquiries(){
    const list=$("[data-community-inquiries]");
    if(!list)return;
    const inquiries=[...(state.data?.communityInquiries||[])];
    const count=$("[data-community-count]");
    if(count)count.textContent=inquiries.length?`${inquiries.length} total`:"None yet";
    if(!inquiries.length){list.innerHTML='<div class="empty-state">No community inquiries yet.</div>';return}
    list.innerHTML=inquiries.map(i=>{
      const created=i.created_at?new Intl.DateTimeFormat("en-CA",{month:"short",day:"numeric",year:"numeric"}).format(new Date(i.created_at)):"";
      const eventDate=i.event_date?dateLabel(i.event_date):"Date not set";
      const size=i.audience_size?` · about ${esc(i.audience_size)} people`:"";
      return `<article class="inquiry-row">
        <div class="inquiry-head"><div><span class="inquiry-type">${esc(String(i.event_type||"community event").replaceAll("_"," "))}</span><strong>${esc(i.name)}</strong><small>${esc(i.organization||"")}</small></div><span class="inquiry-created">${esc(created)}</span></div>
        <div class="inquiry-meta"><b>${esc(i.contact)}</b><span>${esc(eventDate)}${i.location?` · ${esc(i.location)}`:""}${size}</span></div>
        ${i.details?`<p>${esc(i.details)}</p>`:""}
        <div class="inquiry-actions"><select data-inquiry-status="${esc(i.id)}" aria-label="Inquiry status">
          ${["new","contacted","booked","closed","declined"].map(s=>`<option value="${s}"${i.status===s?" selected":""}>${s[0].toUpperCase()+s.slice(1)}</option>`).join("")}
        </select><button type="button" class="small-button delete" data-delete-inquiry="${esc(i.id)}">Delete</button></div>
      </article>`;
    }).join("");
  }

  function renderSettings(){
    const form=$("[data-settings-form]");
    const s=state.data?.settings||{};
    for(const key of ["season","organization","location","contact_email"]){if(form.elements[key])form.elements[key].value=s[key]||""}
  }

  function setTab(name){
    $$('[data-tab-button]').forEach(b=>b.classList.toggle("active",b.dataset.tabButton===name));
    $$('[data-tab-panel]').forEach(p=>{const active=p.dataset.tabPanel===name;p.classList.toggle("active",active);p.hidden=!active});
  }

  function openEditor(type,item=null,preset={}){
    state.editor={type,item};
    const dialog=$("[data-editor-dialog]");
    const title=$("[data-dialog-title]");
    const kicker=$("[data-dialog-kicker]");
    const fields=$("[data-dialog-fields]");
    const del=$("[data-dialog-delete]");
    $("[data-dialog-message]").textContent="";
    del.hidden=!item;
    fields.className="dialog-fields";

    if(type==="event"){
      kicker.textContent="CALENDAR";title.textContent=item?"Edit event":"Add event";
      const v=item||{event_type:"other",event_date:preset.event_date||new Date().toISOString().slice(0,10),is_public:true};
      fields.innerHTML=`
        <label>Event title<input name="title" maxlength="180" value="${esc(v.title||"")}" required></label>
        <div class="field-row"><label>Type<select name="event_type">${["tournament","demo","meeting","social","practice","other"].map(x=>`<option value="${x}"${v.event_type===x?" selected":""}>${x[0].toUpperCase()+x.slice(1)}</option>`).join("")}</select></label><label>Date<input type="date" name="event_date" value="${esc(v.event_date||"")}" required></label></div>
        <div class="field-row"><label>Start time<input type="time" name="start_time" value="${esc(String(v.start_time||"").slice(0,5))}"></label><label>End time<input type="time" name="end_time" value="${esc(String(v.end_time||"").slice(0,5))}"></label></div>
        <label>Location<input name="location" maxlength="240" value="${esc(v.location||"")}"></label>
        <label>Details<textarea name="details" maxlength="2000">${esc(v.details||"")}</textarea></label>
        <label>Link, optional<input name="href" maxlength="1200" value="${esc(v.href||"")}" placeholder="https://..."></label>
        <label class="toggle-row"><span>Show on public site</span><input type="checkbox" name="is_public"${v.is_public!==false?" checked":""}></label>`;
    }
    if(type==="roster"){
      kicker.textContent="ROSTER";title.textContent=item?"Edit person":"Add person";
      const v=item||{active:true,is_example:false,sort_order:(state.data?.roster?.length||0)*10+10};
      fields.innerHTML=`
        <label>Name<input name="name" maxlength="120" value="${esc(v.name||"")}" required></label>
        <div class="field-row"><label>Role<input name="role" maxlength="120" value="${esc(v.role||"Team member")}" placeholder="Fighter, Squire, Team Ops..."></label><label>Sort order<input type="number" name="sort_order" value="${esc(v.sort_order??0)}"></label></div>
        <label>Discipline / specialty<input name="discipline" maxlength="180" value="${esc(v.discipline||"")}" placeholder="Melee, duels, armour support..."></label>
        <div class="field-row"><label>Years of experience<input type="number" min="0" max="80" name="experience_years" value="${esc(v.experience_years??"")}" placeholder="Optional"></label><label>Affiliations<input name="affiliations" maxlength="500" value="${esc(v.affiliations||"")}" placeholder="HACSA, teams, organizations..."></label></div>
        <label>Experience / highlights<textarea name="experience_summary" maxlength="1000" placeholder="Coaching, tournaments, roles, specialties...">${esc(v.experience_summary||"")}</textarea></label>
        <label>Short bio<textarea name="bio" maxlength="1500">${esc(v.bio||"")}</textarea></label>
        <label>Photo URL, optional<input name="photo_url" maxlength="1200" value="${esc(v.photo_url||"")}" placeholder="https://..."></label>
        <label class="toggle-row"><span><b>Show on website</b><small>Turn this off to keep the member in Admin without showing their public profile.</small></span><input type="checkbox" name="active"${v.active!==false?" checked":""}></label>
        <label class="toggle-row"><span>Mark as sample profile</span><input type="checkbox" name="is_example"${v.is_example?" checked":""}></label>`;
    }
    if(type==="practice"){
      kicker.textContent="TRAINING";title.textContent=item?"Edit practice":"Add practice";
      const v=item||{weekday:0,label:"Sunday",start_time:"17:00",end_time:"20:00",venue:"Springbrook Archery Centre",fee:"$10",active:true,sort_order:(state.data?.practices?.length||0)*10+10};
      fields.innerHTML=`
        <div class="field-row"><label>Day<select name="weekday">${dayNames.map((name,i)=>`<option value="${i}"${Number(v.weekday)===i?" selected":""}>${name}</option>`).join("")}</select></label><label>Label<input name="label" maxlength="40" value="${esc(v.label||dayNames[Number(v.weekday)||0])}"></label></div>
        <div class="field-row"><label>Start time<input type="time" name="start_time" value="${esc(String(v.start_time||"").slice(0,5))}" required></label><label>End time<input type="time" name="end_time" value="${esc(String(v.end_time||"").slice(0,5))}" required></label></div>
        <label>Venue<input name="venue" maxlength="240" value="${esc(v.venue||"")}" required></label>
        <div class="field-row"><label>Fee<input name="fee" maxlength="40" value="${esc(v.fee||"")}" placeholder="$10"></label><label>Sort order<input type="number" name="sort_order" value="${esc(v.sort_order??0)}"></label></div>
        <label class="toggle-row"><span>Practice is active</span><input type="checkbox" name="active"${v.active!==false?" checked":""}></label>`;
    }
    if(!dialog.open)dialog.showModal();
  }

  function closeEditor(){const d=$("[data-editor-dialog]");if(d.open)d.close();state.editor=null}

  async function saveEditor(){
    const editor=state.editor;if(!editor)return;
    const form=$("[data-editor-form]");const fd=new FormData(form);let item={id:editor.item?.id};
    if(editor.type==="event")item={...item,title:fd.get("title"),event_type:fd.get("event_type"),event_date:fd.get("event_date"),start_time:fd.get("start_time"),end_time:fd.get("end_time"),location:fd.get("location"),details:fd.get("details"),href:fd.get("href"),is_public:fd.get("is_public")==="on"};
    if(editor.type==="roster")item={...item,name:fd.get("name"),role:fd.get("role"),discipline:fd.get("discipline"),experience_years:fd.get("experience_years"),affiliations:fd.get("affiliations"),experience_summary:fd.get("experience_summary"),bio:fd.get("bio"),photo_url:fd.get("photo_url"),active:fd.get("active")==="on",is_example:fd.get("is_example")==="on",sort_order:Number(fd.get("sort_order")||0)};
    if(editor.type==="practice")item={...item,weekday:Number(fd.get("weekday")),label:fd.get("label"),start_time:fd.get("start_time"),end_time:fd.get("end_time"),venue:fd.get("venue"),fee:fd.get("fee"),active:fd.get("active")==="on",sort_order:Number(fd.get("sort_order")||0)};
    try{
      $("[data-dialog-message]").textContent="Saving…";
      await api({action:`${editor.type}_save`,item});
      closeEditor();await loadData();showToast("Saved");
    }catch(error){$("[data-dialog-message]").textContent=error.message}
  }

  async function deleteItem(type,id){
    const label=type==="roster"?"person":type;
    if(!confirm(`Delete this ${label}? This cannot be undone.`))return;
    try{await api({action:`${type}_delete`,id});closeEditor();await loadData();showToast("Deleted")}
    catch(error){showToast(error.message)}
  }

  $("[data-login-form]").addEventListener("submit",async event=>{
    event.preventDefault();const form=event.currentTarget;const password=form.elements.password.value;
    const msg=$("[data-login-message]");msg.textContent="Checking…";
    try{const result=await api({action:"login",password});sessionStorage.setItem(tokenKey,result.token);form.reset();showDashboard();await loadData();msg.textContent=""}
    catch(error){msg.textContent=error.message}
  });
  $("[data-logout]").addEventListener("click",()=>{sessionStorage.removeItem(tokenKey);showLogin();});
  $$('[data-tab-button]').forEach(button=>button.addEventListener("click",()=>setTab(button.dataset.tabButton)));
  $("[data-calendar-prev]").addEventListener("click",()=>{state.calendarMonth=new Date(state.calendarMonth.getFullYear(),state.calendarMonth.getMonth()-1,1);renderCalendar()});
  $("[data-calendar-next]").addEventListener("click",()=>{state.calendarMonth=new Date(state.calendarMonth.getFullYear(),state.calendarMonth.getMonth()+1,1);renderCalendar()});
  $("[data-add-event]").addEventListener("click",()=>openEditor("event"));
  $("[data-add-roster]").addEventListener("click",()=>openEditor("roster"));
  $("[data-add-practice]").addEventListener("click",()=>openEditor("practice"));
  $("[data-calendar-grid]").addEventListener("dblclick",event=>{const day=event.target.closest(".calendar-day");if(day&&!event.target.closest("[data-edit-event]"))openEditor("event",null,{event_date:day.dataset.date})});
  document.addEventListener("click",event=>{
    const editEvent=event.target.closest("[data-edit-event]");if(editEvent){const item=state.data.events.find(x=>x.id===editEvent.dataset.editEvent);if(item)openEditor("event",item);return}
    const editRoster=event.target.closest("[data-edit-roster]");if(editRoster){const item=state.data.roster.find(x=>x.id===editRoster.dataset.editRoster);if(item)openEditor("roster",item);return}
    const editPractice=event.target.closest("[data-edit-practice]");if(editPractice){const item=state.data.practices.find(x=>x.id===editPractice.dataset.editPractice);if(item)openEditor("practice",item);return}
    const deleteEvent=event.target.closest("[data-delete-event]");if(deleteEvent){deleteItem("event",deleteEvent.dataset.deleteEvent);return}
    const toggleRoster=event.target.closest("[data-toggle-roster]");if(toggleRoster){
      const item=state.data.roster.find(x=>x.id===toggleRoster.dataset.toggleRoster);
      if(item){
        toggleRoster.disabled=true;
        api({action:"roster_save",item:{...item,active:!item.active}})
          .then(()=>loadData())
          .then(()=>showToast(item.active?"Removed from public Team page":"Shown on public Team page"))
          .catch(error=>{toggleRoster.disabled=false;showToast(error.message)});
      }
      return;
    }
    const deleteRoster=event.target.closest("[data-delete-roster]");if(deleteRoster){deleteItem("roster",deleteRoster.dataset.deleteRoster);return}
    const deletePractice=event.target.closest("[data-delete-practice]");if(deletePractice){deleteItem("practice",deletePractice.dataset.deletePractice);return}
    const deleteInquiry=event.target.closest("[data-delete-inquiry]");if(deleteInquiry){
      if(confirm("Delete this community inquiry? This cannot be undone.")){
        api({action:"community_inquiry_delete",id:deleteInquiry.dataset.deleteInquiry}).then(()=>loadData()).then(()=>showToast("Inquiry deleted")).catch(error=>showToast(error.message));
      }
      return;
    }
  });
  document.addEventListener("change",event=>{
    const select=event.target.closest("[data-inquiry-status]");
    if(!select)return;
    api({action:"community_inquiry_status",id:select.dataset.inquiryStatus,status:select.value})
      .then(()=>loadData())
      .then(()=>showToast("Inquiry updated"))
      .catch(error=>showToast(error.message));
  });
  document.addEventListener("click",async event=>{
    const btn=event.target.closest("[data-bos-toggle]");
    if(!btn)return;
    const id=String(btn.dataset.bosToggle).toLowerCase(),name=btn.dataset.bosName||"This fighter";
    const marker=(state.data?.roster||[]).find(m=>isHideRecord(m)&&hiddenId(m)===id);
    btn.disabled=true;
    try{
      if(marker){await api({action:"roster_delete",id:marker.id});await loadData();showToast(`${name} is shown on the website again`)}
      else{await api({action:"roster_save",item:{name,role:"Hidden from website",discipline:HIDE+id,experience_years:"",affiliations:"",experience_summary:"",bio:"",photo_url:"",active:true,is_example:false,sort_order:9000}});await loadData();showToast(`${name} is hidden from the website`)}
    }catch(error){showToast(error.message)}finally{btn.disabled=false}
  });
  $("[data-editor-form]").addEventListener("submit",event=>{event.preventDefault();saveEditor()});
  $("[data-dialog-close]").addEventListener("click",closeEditor);
  $("[data-dialog-cancel]").addEventListener("click",closeEditor);
  $("[data-dialog-delete]").addEventListener("click",()=>{if(state.editor?.item)deleteItem(state.editor.type,state.editor.item.id)});
  $("[data-print-promo]")?.addEventListener("click",()=>window.print());

  $("[data-settings-form]").addEventListener("submit",async event=>{
    event.preventDefault();const fd=new FormData(event.currentTarget);const item=Object.fromEntries(fd.entries());
    try{await api({action:"settings_save",item});await loadData();showToast("Settings saved")}catch(error){showToast(error.message)}
  });

  (async()=>{
    if(!token()){showLogin();return}
    try{showDashboard();await loadData()}catch{showLogin("Enter the team password to continue.")}
  })();
})();
