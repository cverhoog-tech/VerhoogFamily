'use strict';
// ============================================================
// FAMILYAPP -> GOOGLE CALENDAR SYNC v1.1
// Per-user Google connection with HouseholdContext guards.
// ============================================================
(function(){
  if(window.__calendarGoogleSyncV11)return;
  window.__calendarGoogleSyncV11=true;

  var state={connected:false,configured:true,calendars:[],busy:false,lastError:'',ready:false};
  var pending={};

  function ctx(){return window.HouseholdContext||null;}
  function capture(){var c=ctx();if(!c)throw new Error('HOUSEHOLD_CONTEXT_UNAVAILABLE');var uid=c.requireUser(),householdId=c.requireHousehold();c.assertContext({uid:uid,householdId:householdId,requireReady:true});return{uid:uid,householdId:householdId};}
  function same(token){return !!(token&&ctx()&&ctx().isCurrent(token));}
  function assertToken(token){if(!same(token)){var e=new Error('CALENDAR_CONTEXT_CHANGED');e.code='CALENDAR_CONTEXT_CHANGED';throw e;}return token;}
  function safeUid(token){return String(token.uid).replace(/[.#$\[\]\/]/g,'_');}
  function prefKey(token){return'familyapp-google-calendar-sync-v2-'+token.uid;}
  function prefs(token){try{var v=JSON.parse(localStorage.getItem(prefKey(token))||'{}');return{calendarId:String(v.calendarId||''),calendarSummary:String(v.calendarSummary||''),autoSync:v.autoSync!==false};}catch(e){return{calendarId:'',calendarSummary:'',autoSync:true};}}
  function savePrefs(token,next){assertToken(token);try{localStorage.setItem(prefKey(token),JSON.stringify(next));}catch(e){}renderPanel();}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function api(method,body){var opts={method:method||'GET',credentials:'same-origin',headers:{Accept:'application/json'}};if(body){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body);}return fetch('/api/google-calendar',opts).then(function(r){return r.text().then(function(t){var data={};try{data=t?JSON.parse(t):{};}catch(e){}if(!r.ok){var err=new Error(data.error||('HTTP '+r.status));err.status=r.status;err.data=data;throw err;}return data;});});}
  function currentEvent(id){return(window.calData||[]).find(function(e){return String(e.id)===String(id);})||null;}
  function mapping(event,token){return event&&event.googleSync&&event.googleSync[safeUid(token)]||null;}
  function storeMapping(event,data,calendar,token){assertToken(token);var live=currentEvent(event.id);if(!live)return;live.googleSync=live.googleSync&&typeof live.googleSync==='object'?live.googleSync:{};live.googleSync[safeUid(token)]={calendarId:calendar.id,eventId:data.eventId,calendarSummary:calendar.summary||calendar.id,syncedAt:Date.now(),syncedBy:token.uid,status:'synced'};live.updatedAt=Date.now();live.updatedBy=token.uid;if(window.CalendarSharedLive&&typeof CalendarSharedLive.save==='function')CalendarSharedLive.save().catch(function(e){console.warn('[GoogleCalendarSync] mapping save failed',e);});try{window.dispatchEvent(new CustomEvent('familyapp:google-calendar-synced',{detail:{eventId:live.id,googleEventId:data.eventId,userId:token.uid,familyId:token.householdId}}));}catch(e){}if(typeof window.renderCalEvents==='function')window.renderCalEvents();}
  function selectedCalendar(token){var p=prefs(token),found=state.calendars.find(function(c){return c.id===p.calendarId;});if(found)return found;return state.calendars.find(function(c){return c.primary;})||state.calendars[0]||null;}
  function syncMutation(detail){
    if(!detail||!detail.event)return;
    var token;try{token=capture();}catch(e){return;}
    if(detail.userId&&detail.userId!==token.uid)return;if(detail.familyId&&detail.familyId!==token.householdId)return;if(!state.connected||!prefs(token).autoSync)return;
    var type=detail.type,event=detail.event,id=String(event.id||'');if(!id)return;clearTimeout(pending[id]);
    pending[id]=setTimeout(function(){
      delete pending[id];try{assertToken(token);}catch(e){return;}
      var calendar=selectedCalendar(token);if(!calendar)return;
      if(type==='delete'){
        var map=mapping(event,token);if(!map||!map.eventId)return;
        api('POST',{action:'delete',calendarId:map.calendarId||calendar.id,eventId:map.eventId}).then(function(){assertToken(token);if(window.showToast)showToast('Ook uit Google Agenda verwijderd ✓');}).catch(function(err){if(err&&err.code==='CALENDAR_CONTEXT_CHANGED')return;console.warn('[GoogleCalendarSync] delete failed',err);if(window.showToast)showToast('FamilyApp verwijderd; Google-sync mislukte');});return;
      }
      var live=currentEvent(id)||event,map=mapping(live,token);if(type==='update'&&!map)return;
      var action=map&&map.eventId?'update':'create';
      api('POST',{action:action,calendarId:(map&&map.calendarId)||calendar.id,eventId:map&&map.eventId,event:live}).then(function(data){assertToken(token);storeMapping(live,data,calendar,token);if(window.showToast)showToast(action==='create'?'Ook in Google Agenda gezet ✓':'Google Agenda bijgewerkt ✓');}).catch(function(err){if(err&&err.code==='CALENDAR_CONTEXT_CHANGED')return;console.warn('[GoogleCalendarSync] sync failed',err);if(window.showToast)showToast('Afspraak opgeslagen; Google-sync mislukte');});
    },140);
  }
  function removeLegacy(){var panel=document.getElementById('cal-sync-panel');if(panel&&panel.parentNode)panel.parentNode.remove();document.querySelectorAll('#screen-cal [onclick*="toggleCalSync"],#cal-external-actions,#cal-detail-external').forEach(function(el){el.remove();});}
  function ensureStyles(){if(document.getElementById('google-calendar-sync-style'))return;var s=document.createElement('style');s.id='google-calendar-sync-style';s.textContent='.gcal-sync-card{margin:14px 16px 20px;border:1px solid var(--c-border);background:var(--c-surface);border-radius:20px;padding:15px}.gcal-sync-head{display:flex;gap:11px;align-items:center}.gcal-sync-logo{width:40px;height:40px;border-radius:13px;background:#fff;border:1px solid #e5e7eb;display:flex;align-items:center;justify-content:center;font-size:20px}.gcal-sync-title{font-size:14px;font-weight:900}.gcal-sync-sub{font-size:11.5px;color:var(--c-text2);margin-top:3px}.gcal-sync-status{margin-left:auto;font-size:10px;font-weight:850;padding:5px 8px;border-radius:999px;background:var(--c-surface2)}.gcal-sync-status.ok{background:#e8f5ea;color:#237a3c}.gcal-sync-controls{margin-top:13px;display:grid;gap:9px}.gcal-sync-select{width:100%;border:1px solid var(--c-border);background:var(--c-surface2);border-radius:13px;padding:10px}.gcal-sync-row{display:flex;align-items:center;justify-content:space-between}.gcal-sync-btn{border:none;border-radius:13px;padding:10px 12px;font-weight:850;background:#4285f4;color:#fff}.gcal-sync-btn.secondary{background:var(--c-surface2);color:var(--c-text2);border:1px solid var(--c-border)}';document.head.appendChild(s);}
  function panelHost(){return document.getElementById('screen-cal');}
  function renderPanel(){removeLegacy();ensureStyles();var host=panelHost();if(!host)return;var token;try{token=capture();}catch(e){return;}var card=document.getElementById('gcal-sync-card');if(!card){card=document.createElement('div');card.id='gcal-sync-card';card.className='gcal-sync-card';host.appendChild(card);}var p=prefs(token);if(!state.configured){card.innerHTML='<div class="gcal-sync-head"><div class="gcal-sync-logo">📅</div><div><div class="gcal-sync-title">Google Agenda</div><div class="gcal-sync-sub">Serverconfiguratie ontbreekt nog.</div></div></div>';return;}if(!state.connected){card.innerHTML='<div class="gcal-sync-head"><div class="gcal-sync-logo">G</div><div style="flex:1"><div class="gcal-sync-title">Google Agenda</div><div class="gcal-sync-sub">FamilyApp-afspraken automatisch toevoegen.</div></div></div><div class="gcal-sync-controls"><button class="gcal-sync-btn" onclick="CalendarGoogleSync.connect()">Google Agenda koppelen</button></div>';return;}var options=state.calendars.map(function(c){return'<option value="'+esc(c.id)+'" '+((p.calendarId||selectedCalendar(token)&&selectedCalendar(token).id)===c.id?'selected':'')+'>'+esc(c.summary)+'</option>';}).join('');card.innerHTML='<div class="gcal-sync-head"><div class="gcal-sync-logo">G</div><div style="flex:1"><div class="gcal-sync-title">Google Agenda</div></div><div class="gcal-sync-status ok">✓ Gekoppeld</div></div><div class="gcal-sync-controls">'+(options?'<select class="gcal-sync-select" onchange="CalendarGoogleSync.choose(this.value)">'+options+'</select>':'')+'<div class="gcal-sync-row"><span>Automatisch synchroniseren</span><input type="checkbox" '+(p.autoSync?'checked':'')+' onchange="CalendarGoogleSync.toggle(this.checked)"></div><button class="gcal-sync-btn secondary" onclick="CalendarGoogleSync.disconnect()">Koppeling verbreken</button></div>';}
  function loadCalendars(token){assertToken(token);if(!state.connected)return Promise.resolve();return api('POST',{action:'listCalendars'}).then(function(data){assertToken(token);state.calendars=data.calendars||[];var p=prefs(token),sel=selectedCalendar(token);if(!p.calendarId&&sel)savePrefs(token,{calendarId:sel.id,calendarSummary:sel.summary||sel.id,autoSync:p.autoSync});renderPanel();}).catch(function(err){if(err&&err.code==='CALENDAR_CONTEXT_CHANGED')return;if(err.status===401){state.connected=false;state.calendars=[];}state.lastError=err.message;renderPanel();});}
  function check(){var token;try{token=capture();}catch(e){return Promise.resolve();}return api('GET').then(function(){assertToken(token);state.connected=true;state.configured=true;state.ready=true;return loadCalendars(token);}).catch(function(err){if(err&&err.code==='CALENDAR_CONTEXT_CHANGED')return;state.connected=false;state.configured=err.status!==503;state.ready=true;renderPanel();});}
  function connect(){window.location.href='/api/google-calendar-auth?returnTo='+encodeURIComponent(window.location.pathname||'/');}
  function disconnect(){var token;try{token=capture();}catch(e){return;}api('DELETE').catch(function(){}).then(function(){if(!same(token))return;state.connected=false;state.calendars=[];renderPanel();if(window.showToast)showToast('Google Agenda ontkoppeld');});}
  function choose(id){var token=capture(),c=state.calendars.find(function(x){return x.id===id;}),p=prefs(token);savePrefs(token,{calendarId:id,calendarSummary:c?c.summary:id,autoSync:p.autoSync});}
  function toggle(value){var token=capture(),p=prefs(token);savePrefs(token,{calendarId:p.calendarId,calendarSummary:p.calendarSummary,autoSync:!!value});}
  function cleanCallbackQuery(){try{var u=new URL(window.location.href),v=u.searchParams.get('googleCalendar');if(!v)return;if(v==='connected'&&window.showToast)showToast('Google Agenda gekoppeld ✓');u.searchParams.delete('googleCalendar');history.replaceState(null,'',u.pathname+(u.search?'?'+u.searchParams.toString():'')+u.hash);}catch(e){}}
  function boot(){removeLegacy();cleanCallbackQuery();renderPanel();check();}
  function onContextChanged(){Object.keys(pending).forEach(function(k){clearTimeout(pending[k]);delete pending[k];});state.connected=false;state.calendars=[];state.ready=false;check();}

  window.addEventListener('familyapp:calendar-local-mutation',function(e){syncMutation(e&&e.detail);});window.addEventListener('familyapp:household-context-changed',onContextChanged);window.addEventListener('familyapp:session:cleared',onContextChanged);window.addEventListener('focus',function(){if(state.ready)check();});
  window.CalendarGoogleSync={version:'1.1.0',connect:connect,disconnect:disconnect,choose:choose,toggle:toggle,refresh:check,status:function(){var token=null;try{token=capture();}catch(e){}return{connected:state.connected,configured:state.configured,calendars:state.calendars.slice(),context:token,prefs:token?prefs(token):null};}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
