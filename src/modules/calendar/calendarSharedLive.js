'use strict';
// ============================================================
// CALENDAR SHARED LIVE v2.0
// HouseholdContext-authoritative shared agenda via FamilyDataStore.
// UI renderers stay owned by the existing calendar modules.
// ============================================================
(function(){
  if(window.__calendarSharedLiveV2)return;
  window.__calendarSharedLiveV2=true;

  var COLLECTION='calendar';
  var state={attached:false,applying:false,editingId:null,unsubscribe:null,bootTimer:null,token:null};

  function now(){return Date.now();}
  function ctx(){return window.HouseholdContext||null;}
  function store(){return window.FamilyDataStore||null;}
  function captureReady(){var c=ctx();if(!c)throw new Error('HOUSEHOLD_CONTEXT_UNAVAILABLE');var uid=c.requireUser(),householdId=c.requireHousehold();c.assertContext({uid:uid,householdId:householdId,requireReady:true});return{uid:uid,householdId:householdId};}
  function same(token){return !!(token&&ctx()&&ctx().isCurrent(token));}
  function assertToken(token){if(!same(token)){var e=new Error('CALENDAR_CONTEXT_CHANGED');e.code='CALENDAR_CONTEXT_CHANGED';throw e;}return token;}
  function ready(){try{return !!(store()&&typeof store().subscribeShared==='function'&&typeof window.calData!=='undefined'&&captureReady());}catch(e){return false;}}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function eventKey(id){return'id_'+String(id).replace(/[.#$\[\]\/]/g,'_');}
  function makeId(token){token=token||captureReady();return'cal_'+String(token.uid).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,24)+'_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,8);}
  function itemsFromArray(events,token){var out={};(events||[]).forEach(function(event){if(!event)return;var e=Object.assign({},event);if(e.id===undefined||e.id===null||e.id==='')e.id=makeId(token);out[eventKey(e.id)]=e;});return out;}
  function arrayFromItems(value){var items=value&&value.items&&typeof value.items==='object'?value.items:{};return Object.keys(items).map(function(k){return items[k];}).filter(Boolean);}
  function payload(events,token){assertToken(token);return{schemaVersion:2,initialized:true,items:itemsFromArray(events,token),updatedAt:now(),updatedBy:token.uid,householdId:token.householdId};}
  function saveLocal(){try{if(window.AppState&&typeof AppState.set==='function')AppState.set('cal',window.calData);else if(window.AppState&&typeof AppState.save==='function')AppState.save();}catch(e){console.warn('[CalendarSharedLive] local cache projection failed',e);}}
  function render(){try{if(typeof window.renderCal==='function')window.renderCal();}catch(e){}try{if(typeof window.updateStats==='function')window.updateStats();}catch(e){}}
  function emitLocal(type,event,token){if(!event||!same(token))return;try{window.dispatchEvent(new CustomEvent('familyapp:calendar-local-mutation',{detail:{type:type,event:clone(event),userId:token.uid,familyId:token.householdId}}));}catch(e){}}

  function write(token){token=token||captureReady();assertToken(token);if(state.applying)return Promise.resolve(false);saveLocal();return store().writeShared(COLLECTION,payload(window.calData||[],token)).then(function(r){assertToken(token);return r;});}

  function legacyFirebaseRead(token){
    // Migration-only fallback. Never used as ongoing authority.
    try{assertToken(token);var db=window.fbDb||(window.firebase&&firebase.database&&firebase.database());if(!db)return Promise.resolve([]);return db.ref('families/'+token.householdId+'/cal').once('value').then(function(s){assertToken(token);var raw=s.val();if(!raw)return[];if(Array.isArray(raw))return raw.filter(Boolean);if(typeof raw==='object')return Object.keys(raw).map(function(k){return raw[k];}).filter(Boolean);return[];}).catch(function(e){if(e&&e.code==='CALENDAR_CONTEXT_CHANGED')throw e;return[];});}catch(e){return Promise.reject(e);}
  }

  function stop(){
    if(state.unsubscribe)try{state.unsubscribe();}catch(e){}
    state.unsubscribe=null;state.attached=false;state.token=null;state.editingId=null;
    state.applying=true;window.calData=[];saveLocal();state.applying=false;render();
  }

  function initializeAndSubscribe(){
    var token;try{token=captureReady();}catch(e){return false;}
    if(state.attached&&state.token&&same(state.token))return true;
    stop();state.attached=true;state.token=token;
    store().readShared(COLLECTION,null).then(function(existing){
      assertToken(token);
      if(existing&&existing.initialized)return existing;
      return legacyFirebaseRead(token).then(function(legacy){
        assertToken(token);
        var seed=legacy.length?legacy:(Array.isArray(window.calData)?clone(window.calData):[]),first=payload(seed,token);
        first.migratedAt=now();first.migratedFrom=legacy.length?'families/{householdId}/cal':(seed.length?'local-calData':'empty');
        return store().writeShared(COLLECTION,first).then(function(){assertToken(token);return first;});
      });
    }).then(function(){
      assertToken(token);
      state.unsubscribe=store().subscribeShared(COLLECTION,function(value){
        if(!same(token)||!value||!value.initialized)return;
        state.applying=true;window.calData=arrayFromItems(value);saveLocal();state.applying=false;render();
      },{schemaVersion:2,initialized:true,items:{}});
    }).catch(function(err){if(err&&err.code==='CALENDAR_CONTEXT_CHANGED')return;state.attached=false;state.token=null;console.error('[CalendarSharedLive] init failed',err);});
    return true;
  }

  function patchAddSheet(){
    if(typeof window.saveItem!=='function'||window.saveItem.__calendarSharedWrapped)return false;
    var originalSave=window.saveItem;
    function wrappedSaveItem(){
      if(window.currentAddType!=='cal')return originalSave.apply(this,arguments);
      var token;try{token=captureReady();}catch(e){if(window.showToast)showToast('Agenda is niet beschikbaar');return;}
      var title=((document.getElementById('f1')||{}).value||'').trim(),date=((document.getElementById('f2')||{}).value||'').trim(),time=((document.getElementById('f3')||{}).value||'').trim(),description=((document.getElementById('cal-description')||{}).value||'').trim();
      if(!title){if(window.showToast)showToast('Vul een titel in');return;}if(!date){if(window.showToast)showToast('Kies een datum');return;}
      var target=null,mode='create';
      if(state.editingId!==null){
        var existing=(window.calData||[]).find(function(e){return String(e.id)===String(state.editingId);});
        if(existing){existing.title=title;existing.date=date;existing.time=time;existing.description=description;existing.updatedAt=now();existing.updatedBy=token.uid;target=existing;mode='update';}
      } else {
        target={id:makeId(token),title:title,date:date,time:time,description:description,color:'#2d5a27',createdAt:now(),createdBy:token.uid,updatedAt:now(),updatedBy:token.uid,householdId:token.householdId,attendeeUids:[]};
        window.calData.push(target);
      }
      state.editingId=null;
      write(token).then(function(){assertToken(token);render();if(window.closeAdd)closeAdd();if(window.showToast)showToast('Afspraak opgeslagen ✓');emitLocal(mode,target,token);}).catch(function(err){if(window.showToast)showToast(err&&err.code==='CALENDAR_CONTEXT_CHANGED'?'Agenda-context gewijzigd':'Afspraak kon niet worden opgeslagen');});
    }
    wrappedSaveItem.__calendarSharedWrapped=true;window.saveItem=wrappedSaveItem;
    if(typeof window.closeAdd==='function'&&!window.closeAdd.__calendarSharedWrapped){var originalClose=window.closeAdd,wrappedClose=function(){state.editingId=null;return originalClose.apply(this,arguments);};wrappedClose.__calendarSharedWrapped=true;window.closeAdd=wrappedClose;}
    return true;
  }

  function patchCalendarCrud(){
    window.deleteCalEvent=function(id){
      var token;try{token=captureReady();}catch(e){return false;}
      var old=(window.calData||[]).find(function(e){return String(e.id)===String(id);})||null;
      window.calData=(window.calData||[]).filter(function(e){return String(e.id)!==String(id);});
      return write(token).then(function(){assertToken(token);render();emitLocal('delete',old,token);return true;}).catch(function(err){console.warn('[CalendarSharedLive] delete failed',err);return false;});
    };
    window.openCalEdit=function(id){var event=(window.calData||[]).find(function(e){return String(e.id)===String(id);});if(!event||event._imported||typeof window.openAdd!=='function')return;state.editingId=event.id;window.openAdd('cal');var st=document.getElementById('sheet-title');if(st)st.textContent='Afspraak bewerken';var btn=document.querySelector('#add-overlay .sheet-btn');if(btn)btn.textContent='Opslaan';var f1=document.getElementById('f1');if(f1)f1.value=event.title||'';var f2=document.getElementById('f2');if(f2)f2.value=event.date||'';var f3=document.getElementById('f3');if(f3)f3.value=event.time||'';var f4=document.getElementById('cal-description');if(f4)f4.value=event.description||'';};
    if(typeof window.importICS==='function'&&!window.importICS.__calendarSharedWrapped){var originalImport=window.importICS,wrappedImport=function(){var token;try{token=captureReady();}catch(e){return false;}var before=(window.calData||[]).length,result=originalImport.apply(this,arguments);if((window.calData||[]).length!==before){window.calData=(window.calData||[]).map(function(e){if(e&&(e.id===undefined||e.id===null||typeof e.id==='number'))e.id=makeId(token);if(e&&!e.createdBy)e.createdBy=token.uid;if(e&&!e.householdId)e.householdId=token.householdId;return e;});write(token).catch(function(err){console.warn('[CalendarSharedLive] ICS sync failed',err);});}return result;};wrappedImport.__calendarSharedWrapped=true;window.importICS=wrappedImport;}
    return true;
  }

  function boot(){
    if(state.bootTimer)return;
    var tries=0;
    state.bootTimer=setInterval(function(){tries++;patchAddSheet();patchCalendarCrud();initializeAndSubscribe();if((state.attached&&window.saveItem&&window.saveItem.__calendarSharedWrapped)||tries>240){clearInterval(state.bootTimer);state.bootTimer=null;}},250);
    patchAddSheet();patchCalendarCrud();initializeAndSubscribe();
  }
  function rebind(){stop();initializeAndSubscribe();}

  window.addEventListener('focus',initializeAndSubscribe);window.addEventListener('online',initializeAndSubscribe);window.addEventListener('familyapp:household-context-changed',rebind);window.addEventListener('familyapp:session:cleared',stop);
  window.CalendarSharedLive={version:'2.0.0',sync:initializeAndSubscribe,save:function(){var token=captureReady();return write(token);},stop:stop,rebind:rebind,status:function(){return{attached:state.attached,context:state.token?Object.assign({},state.token):null,editingId:state.editingId,count:(window.calData||[]).length};}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
