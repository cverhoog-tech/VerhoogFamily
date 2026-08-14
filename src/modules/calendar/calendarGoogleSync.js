'use strict';
// ============================================================
// FAMILYAPP -> GOOGLE CALENDAR SYNC v1.0
// Per-user Google connection. Only local FamilyApp mutations are sent
// to Google, so Firebase snapshots from another household device never
// create duplicate Google events.
// ============================================================
(function(){
  if(window.__calendarGoogleSyncV1)return;
  window.__calendarGoogleSyncV1=true;

  var state={connected:false,configured:true,calendars:[],busy:false,lastError:'',ready:false};
  var pending={};

  function user(){try{return window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||null;}catch(e){return null;}}
  function uid(){var u=user();return u&&u.uid?String(u.uid):'guest';}
  function safeUid(){return uid().replace(/[.#$\[\]\/]/g,'_');}
  function prefKey(){return'familyapp-google-calendar-sync-v1-'+uid();}
  function prefs(){
    try{var v=JSON.parse(localStorage.getItem(prefKey())||'{}');return{calendarId:String(v.calendarId||''),calendarSummary:String(v.calendarSummary||''),autoSync:v.autoSync!==false};}
    catch(e){return{calendarId:'',calendarSummary:'',autoSync:true};}
  }
  function savePrefs(next){try{localStorage.setItem(prefKey(),JSON.stringify(next));}catch(e){}renderPanel();}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function api(method,body){
    var opts={method:method||'GET',credentials:'same-origin',headers:{Accept:'application/json'}};
    if(body){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body);}
    return fetch('/api/google-calendar',opts).then(function(r){return r.text().then(function(t){var data={};try{data=t?JSON.parse(t):{};}catch(e){}if(!r.ok){var err=new Error(data.error||('HTTP '+r.status));err.status=r.status;err.data=data;throw err;}return data;});});
  }
  function currentEvent(id){return(window.calData||[]).find(function(e){return String(e.id)===String(id);})||null;}
  function mapping(event){return event&&event.googleSync&&event.googleSync[safeUid()]||null;}
  function storeMapping(event,data,calendar){
    var live=currentEvent(event.id);if(!live)return;
    live.googleSync=live.googleSync&&typeof live.googleSync==='object'?live.googleSync:{};
    live.googleSync[safeUid()]={calendarId:calendar.id,eventId:data.eventId,calendarSummary:calendar.summary||calendar.id,syncedAt:Date.now(),syncedBy:uid(),status:'synced'};
    live.updatedAt=Date.now();
    if(window.CalendarSharedLive&&typeof CalendarSharedLive.save==='function')CalendarSharedLive.save();
    try{window.dispatchEvent(new CustomEvent('familyapp:google-calendar-synced',{detail:{eventId:live.id,googleEventId:data.eventId}}));}catch(e){}
    if(typeof window.renderCalEvents==='function')window.renderCalEvents();
  }
  function selectedCalendar(){
    var p=prefs(),found=state.calendars.find(function(c){return c.id===p.calendarId;});
    if(found)return found;
    return state.calendars.find(function(c){return c.primary;})||state.calendars[0]||null;
  }
  function syncMutation(detail){
    if(!detail||!detail.event||!state.connected||!prefs().autoSync)return;
    var type=detail.type,event=detail.event,id=String(event.id||'');if(!id)return;
    clearTimeout(pending[id]);
    pending[id]=setTimeout(function(){
      delete pending[id];
      var p=prefs(),calendar=selectedCalendar();if(!calendar)return;
      if(type==='delete'){
        var map=mapping(event);if(!map||!map.eventId)return;
        api('POST',{action:'delete',calendarId:map.calendarId||calendar.id,eventId:map.eventId}).then(function(){if(window.showToast)showToast('Ook uit Google Agenda verwijderd ✓');}).catch(function(err){console.warn('[GoogleCalendarSync] delete failed',err);if(window.showToast)showToast('FamilyApp verwijderd; Google-sync mislukte');});
        return;
      }
      var live=currentEvent(id)||event,map=mapping(live);
      if(type==='update'&&!map)return; // Never create a second Google copy when another household member edits.
      var action=map&&map.eventId?'update':'create';
      api('POST',{action:action,calendarId:(map&&map.calendarId)||calendar.id,eventId:map&&map.eventId,event:live}).then(function(data){storeMapping(live,data,calendar);if(window.showToast)showToast(action==='create'?'Ook in Google Agenda gezet ✓':'Google Agenda bijgewerkt ✓');}).catch(function(err){console.warn('[GoogleCalendarSync] sync failed',err);if(window.showToast)showToast('Afspraak opgeslagen; Google-sync mislukte');});
    },140);
  }

  function removeLegacy(){
    var panel=document.getElementById('cal-sync-panel');if(panel&&panel.parentNode)panel.parentNode.remove();
    document.querySelectorAll('#screen-cal [onclick*="toggleCalSync"],#cal-external-actions,#cal-detail-external').forEach(function(el){el.remove();});
  }
  function ensureStyles(){
    if(document.getElementById('google-calendar-sync-style'))return;
    var s=document.createElement('style');s.id='google-calendar-sync-style';s.textContent=''
      +'.gcal-sync-card{margin:14px 16px 20px;border:1px solid var(--c-border);background:var(--c-surface);border-radius:20px;padding:15px;box-shadow:0 7px 24px rgba(17,24,39,.055)}'
      +'.gcal-sync-head{display:flex;gap:11px;align-items:center}.gcal-sync-logo{width:40px;height:40px;border-radius:13px;background:#fff;border:1px solid #e5e7eb;display:flex;align-items:center;justify-content:center;font-size:20px;flex:0 0 auto}.gcal-sync-title{font-size:14px;font-weight:900;color:var(--c-text)}.gcal-sync-sub{font-size:11.5px;color:var(--c-text2);margin-top:3px;line-height:1.4}.gcal-sync-status{margin-left:auto;font-size:10px;font-weight:850;padding:5px 8px;border-radius:999px;background:var(--c-surface2);color:var(--c-text2);white-space:nowrap}.gcal-sync-status.ok{background:#e8f5ea;color:#237a3c}.gcal-sync-controls{margin-top:13px;display:grid;gap:9px}.gcal-sync-select{width:100%;border:1px solid var(--c-border);background:var(--c-surface2);color:var(--c-text);border-radius:13px;padding:10px 11px;font-size:12px;font-weight:700}.gcal-sync-row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;font-weight:750;color:var(--c-text)}.gcal-sync-btn{border:none;border-radius:13px;padding:10px 12px;font-size:12px;font-weight:850;cursor:pointer;background:#4285f4;color:#fff}.gcal-sync-btn.secondary{background:var(--c-surface2);color:var(--c-text2);border:1px solid var(--c-border)}';document.head.appendChild(s);
  }
  function panelHost(){return document.getElementById('screen-cal');}
  function renderPanel(){
    removeLegacy();ensureStyles();var host=panelHost();if(!host)return;
    var card=document.getElementById('gcal-sync-card');if(!card){card=document.createElement('div');card.id='gcal-sync-card';card.className='gcal-sync-card';host.appendChild(card);}
    var p=prefs();
    if(!state.configured){card.innerHTML='<div class="gcal-sync-head"><div class="gcal-sync-logo">📅</div><div><div class="gcal-sync-title">Google Agenda</div><div class="gcal-sync-sub">Serverconfiguratie ontbreekt nog.</div></div><div class="gcal-sync-status">Setup nodig</div></div>';return;}
    if(!state.connected){card.innerHTML='<div class="gcal-sync-head"><div class="gcal-sync-logo">G</div><div style="flex:1"><div class="gcal-sync-title">Google Agenda</div><div class="gcal-sync-sub">FamilyApp-afspraken automatisch toevoegen aan jouw Google Agenda.</div></div><div class="gcal-sync-status">Niet gekoppeld</div></div><div class="gcal-sync-controls"><button class="gcal-sync-btn" onclick="CalendarGoogleSync.connect()">Google Agenda koppelen</button></div>';return;}
    var options=state.calendars.map(function(c){return'<option value="'+esc(c.id)+'" '+((p.calendarId||selectedCalendar()&&selectedCalendar().id)===c.id?'selected':'')+'>'+esc(c.summary)+(c.primary?' · primair':'')+'</option>';}).join('');
    card.innerHTML='<div class="gcal-sync-head"><div class="gcal-sync-logo">G</div><div style="flex:1"><div class="gcal-sync-title">Google Agenda</div><div class="gcal-sync-sub">Nieuwe FamilyApp-afspraken worden automatisch gesynchroniseerd.</div></div><div class="gcal-sync-status ok">✓ Gekoppeld</div></div><div class="gcal-sync-controls">'
      +(options?'<select class="gcal-sync-select" onchange="CalendarGoogleSync.choose(this.value)">'+options+'</select>':'<div class="gcal-sync-sub">Agenda’s laden…</div>')
      +'<div class="gcal-sync-row"><span>Automatisch synchroniseren</span><input type="checkbox" '+(p.autoSync?'checked':'')+' onchange="CalendarGoogleSync.toggle(this.checked)" style="width:18px;height:18px"></div>'
      +'<button class="gcal-sync-btn secondary" onclick="CalendarGoogleSync.disconnect()">Koppeling verbreken</button></div>';
  }
  function loadCalendars(){
    if(!state.connected)return Promise.resolve();
    return api('POST',{action:'listCalendars'}).then(function(data){state.calendars=data.calendars||[];var p=prefs(),sel=selectedCalendar();if(!p.calendarId&&sel)savePrefs({calendarId:sel.id,calendarSummary:sel.summary||sel.id,autoSync:p.autoSync});renderPanel();}).catch(function(err){if(err.status===401){state.connected=false;state.calendars=[];}state.lastError=err.message;renderPanel();});
  }
  function check(){
    return api('GET').then(function(){state.connected=true;state.configured=true;state.ready=true;return loadCalendars();}).catch(function(err){state.connected=false;state.configured=err.status!==503;state.ready=true;renderPanel();});
  }
  function connect(){window.location.href='/api/google-calendar-auth?returnTo='+encodeURIComponent(window.location.pathname||'/');}
  function disconnect(){api('DELETE').catch(function(){}).then(function(){state.connected=false;state.calendars=[];renderPanel();if(window.showToast)showToast('Google Agenda ontkoppeld');});}
  function choose(id){var c=state.calendars.find(function(x){return x.id===id;}),p=prefs();savePrefs({calendarId:id,calendarSummary:c?c.summary:id,autoSync:p.autoSync});}
  function toggle(value){var p=prefs();savePrefs({calendarId:p.calendarId,calendarSummary:p.calendarSummary,autoSync:!!value});}
  function cleanCallbackQuery(){
    try{var u=new URL(window.location.href),v=u.searchParams.get('googleCalendar');if(!v)return;if(v==='connected'&&window.showToast)showToast('Google Agenda gekoppeld ✓');u.searchParams.delete('googleCalendar');history.replaceState(null,'',u.pathname+(u.search?'?'+u.searchParams.toString():'')+u.hash);}catch(e){}
  }
  function boot(){removeLegacy();cleanCallbackQuery();renderPanel();check();}

  window.addEventListener('familyapp:calendar-local-mutation',function(e){syncMutation(e&&e.detail);});
  window.addEventListener('focus',function(){if(state.ready)check();});
  window.CalendarGoogleSync={version:'1.0.0',connect:connect,disconnect:disconnect,choose:choose,toggle:toggle,refresh:check,status:function(){return{connected:state.connected,configured:state.configured,calendars:state.calendars.slice(),prefs:prefs()};}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();