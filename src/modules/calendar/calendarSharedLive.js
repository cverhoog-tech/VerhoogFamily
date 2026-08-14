'use strict';
// ============================================================
// CALENDAR SHARED LIVE v1.1
// Household-scoped Firebase agenda via FamilyDataStore.
// Data-sync/CRUD layer only: UI renderers remain owned by calendar UI modules.
// ============================================================
(function(){
  if(window.__calendarSharedLiveV1)return;
  window.__calendarSharedLiveV1=true;

  var COLLECTION='calendar';
  var state={attached:false,applying:false,editingId:null,unsubscribe:null,bootTimer:null};

  function now(){return Date.now();}
  function currentUser(){try{return window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||null;}catch(e){return null;}}
  function familyId(){return window.fbFamilyId||null;}
  function ready(){return !!(window.FamilyDataStore&&typeof FamilyDataStore.subscribeShared==='function'&&familyId()&&currentUser()&&typeof window.calData!=='undefined');}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function eventKey(id){return'id_'+String(id).replace(/[.#$\[\]\/]/g,'_');}
  function makeId(){var u=currentUser(),uid=u&&u.uid?u.uid:'local';return'cal_'+uid.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,24)+'_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,8);}
  function itemsFromArray(events){var out={};(events||[]).forEach(function(event){if(!event)return;var e=Object.assign({},event);if(e.id===undefined||e.id===null||e.id==='')e.id=makeId();out[eventKey(e.id)]=e;});return out;}
  function arrayFromItems(value){var items=value&&value.items&&typeof value.items==='object'?value.items:{};return Object.keys(items).map(function(k){return items[k];}).filter(Boolean);}
  function payload(events){var u=currentUser();return{schemaVersion:1,initialized:true,items:itemsFromArray(events),updatedAt:now(),updatedBy:u&&u.uid?u.uid:'unknown'};}
  function saveLocal(){try{if(window.AppState&&typeof AppState.set==='function')AppState.set('cal',window.calData);else if(window.AppState&&typeof AppState.save==='function')AppState.save();}catch(e){console.warn('[CalendarSharedLive] local cache save failed',e);}}
  function render(){try{if(typeof window.renderCal==='function')window.renderCal();}catch(e){}try{if(typeof window.updateStats==='function')window.updateStats();}catch(e){}}
  function write(){if(state.applying||!ready())return Promise.resolve(false);saveLocal();return FamilyDataStore.writeShared(COLLECTION,payload(window.calData||[]));}

  function legacyFirebaseRead(){try{var db=window.fbDb||(window.firebase&&firebase.database&&firebase.database()),fid=familyId();if(!db||!fid)return Promise.resolve([]);return db.ref('families/'+fid+'/cal').once('value').then(function(s){var raw=s.val();if(!raw)return[];if(Array.isArray(raw))return raw.filter(Boolean);if(typeof raw==='object')return Object.keys(raw).map(function(k){return raw[k];}).filter(Boolean);return[];}).catch(function(){return[];});}catch(e){return Promise.resolve([]);}}

  function initializeAndSubscribe(){
    if(state.attached||!ready())return false;
    state.attached=true;
    FamilyDataStore.readShared(COLLECTION,null).then(function(existing){
      if(existing&&existing.initialized)return existing;
      return legacyFirebaseRead().then(function(legacy){
        var seed=legacy.length?legacy:(Array.isArray(window.calData)?clone(window.calData):[]),first=payload(seed);
        first.migratedAt=now();first.migratedFrom=legacy.length?'families/{householdId}/cal':(seed.length?'local-calData':'empty');
        return FamilyDataStore.writeShared(COLLECTION,first).then(function(){return first;});
      });
    }).then(function(){
      state.unsubscribe=FamilyDataStore.subscribeShared(COLLECTION,function(value){
        if(!value||!value.initialized)return;
        state.applying=true;window.calData=arrayFromItems(value);saveLocal();state.applying=false;render();
      },{schemaVersion:1,initialized:true,items:{}});
    }).catch(function(err){state.attached=false;console.error('[CalendarSharedLive] init failed',err);});
    return true;
  }

  function patchAddSheet(){
    if(typeof window.saveItem!=='function'||window.saveItem.__calendarSharedWrapped)return false;
    var originalSave=window.saveItem;
    function wrappedSaveItem(){
      if(window.currentAddType!=='cal')return originalSave.apply(this,arguments);
      var title=((document.getElementById('f1')||{}).value||'').trim(),date=((document.getElementById('f2')||{}).value||'').trim(),time=((document.getElementById('f3')||{}).value||'').trim();
      if(!title){if(window.showToast)showToast('Vul een titel in');return;}if(!date){if(window.showToast)showToast('Kies een datum');return;}
      var u=currentUser();
      if(state.editingId!==null){var existing=(window.calData||[]).find(function(e){return String(e.id)===String(state.editingId);});if(existing){existing.title=title;existing.date=date;existing.time=time;existing.updatedAt=now();existing.updatedBy=u&&u.uid?u.uid:'unknown';}}
      else window.calData.push({id:makeId(),title:title,date:date,time:time,color:'#2d5a27',createdAt:now(),createdBy:u&&u.uid?u.uid:'unknown'});
      state.editingId=null;write();render();if(window.closeAdd)closeAdd();if(window.showToast)showToast('Afspraak opgeslagen ✓');
    }
    wrappedSaveItem.__calendarSharedWrapped=true;window.saveItem=wrappedSaveItem;
    if(typeof window.closeAdd==='function'&&!window.closeAdd.__calendarSharedWrapped){var originalClose=window.closeAdd,wrappedClose=function(){state.editingId=null;return originalClose.apply(this,arguments);};wrappedClose.__calendarSharedWrapped=true;window.closeAdd=wrappedClose;}
    return true;
  }

  function patchCalendarCrud(){
    window.deleteCalEvent=function(id){window.calData=(window.calData||[]).filter(function(e){return String(e.id)!==String(id);});write();render();};
    window.openCalEdit=function(id){var event=(window.calData||[]).find(function(e){return String(e.id)===String(id);});if(!event||event._imported||typeof window.openAdd!=='function')return;state.editingId=event.id;window.openAdd('cal');var st=document.getElementById('sheet-title');if(st)st.textContent='Afspraak bewerken';var btn=document.querySelector('#add-overlay .sheet-btn');if(btn)btn.textContent='Opslaan';var f1=document.getElementById('f1');if(f1)f1.value=event.title||'';var f2=document.getElementById('f2');if(f2)f2.value=event.date||'';var f3=document.getElementById('f3');if(f3)f3.value=event.time||'';};

    var originalOpen=window.openAdd;
    if(typeof originalOpen==='function'&&!originalOpen.__calendarSharedWrapped){var wrappedOpen=function(type){if(type==='cal'&&state.editingId===null)state.editingId=null;var result=originalOpen.apply(this,arguments);if(type==='cal'&&state.editingId===null){var btn=document.querySelector('#add-overlay .sheet-btn');if(btn)btn.textContent='Toevoegen';}return result;};wrappedOpen.__calendarSharedWrapped=true;window.openAdd=wrappedOpen;}

    if(typeof window.importICS==='function'&&!window.importICS.__calendarSharedWrapped){var originalImport=window.importICS,wrappedImport=function(){var before=(window.calData||[]).length,result=originalImport.apply(this,arguments);if((window.calData||[]).length!==before){window.calData=(window.calData||[]).map(function(e){if(e&&(e.id===undefined||e.id===null||typeof e.id==='number'))e.id=makeId();return e;});write();}return result;};wrappedImport.__calendarSharedWrapped=true;window.importICS=wrappedImport;}
    return true;
  }

  function boot(){
    if(state.bootTimer)return;
    var tries=0;
    state.bootTimer=setInterval(function(){tries++;patchAddSheet();patchCalendarCrud();initializeAndSubscribe();if((state.attached&&window.saveItem&&window.saveItem.__calendarSharedWrapped)||tries>240){clearInterval(state.bootTimer);state.bootTimer=null;}},250);
    patchAddSheet();patchCalendarCrud();initializeAndSubscribe();
  }

  window.addEventListener('focus',initializeAndSubscribe);window.addEventListener('online',initializeAndSubscribe);window.addEventListener('familyapp:household-members-updated',initializeAndSubscribe);
  window.CalendarSharedLive={version:'1.1.0',sync:initializeAndSubscribe,save:write,status:function(){return{attached:state.attached,familyId:familyId(),editingId:state.editingId,count:(window.calData||[]).length};}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();