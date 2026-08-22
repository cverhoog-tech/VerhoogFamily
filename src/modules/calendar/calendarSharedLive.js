'use strict';
// ============================================================
// CALENDAR SHARED LIVE v2.0.0
// STEP 6 compatibility facade over CalendarEventHouseholdRepository.
//
// Existing agenda UI keeps window.calData/saveItem/openCalEdit/deleteCalEvent,
// while persistence, realtime lifecycle and household isolation live only in
// the canonical repository.
// ============================================================
(function(){
  if(window.CalendarSharedLive&&window.CalendarSharedLive.version==='2.0.0')return;

  var VERSION='2.0.0';
  var state={editingId:null,repositoryUnsubscribe:null,bootTimer:null,lastMeta:{source:'idle',ready:false}};

  function clone(v){if(v===undefined)return undefined;try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function repo(){return window.CalendarEventHouseholdRepository||window.CalendarEventRepository||null;}
  function ctx(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function now(){return Date.now();}
  function current(id){var r=repo();return r&&typeof r.get==='function'?r.get(id):((window.calData||[]).find(function(e){return String(e&&e.id)===String(id);})||null);}
  function render(){try{if(typeof window.renderCal==='function')window.renderCal();}catch(e){}try{if(typeof window.updateStats==='function')window.updateStats();}catch(e){}}
  function emitLocal(type,event){
    if(!event)return;
    var c=ctx();
    try{window.dispatchEvent(new CustomEvent('familyapp:calendar-local-mutation',{detail:{type:type,event:clone(event),userId:c&&c.uid||null,familyId:c&&c.householdId||null,householdId:c&&c.householdId||null}}));}catch(e){}
  }
  function projection(rows,meta){
    window.calData=Array.isArray(rows)?rows.map(clone):[];
    state.lastMeta=clone(meta||{})||{};
    render();
  }
  function ensureRepository(){
    var r=repo();
    if(!r||typeof r.subscribe!=='function')return false;
    if(typeof r.start==='function')r.start();
    if(!state.repositoryUnsubscribe)state.repositoryUnsubscribe=r.subscribe(projection);
    return true;
  }
  function mutationResult(promise,type,options){
    options=options||{};
    return promise.then(function(event){if(options.emitMutation!==false&&event)emitLocal(type,event);return event;});
  }
  function createEvent(input,options){var r=repo();if(!r||typeof r.create!=='function')return Promise.reject(new Error('Agenda-opslag niet beschikbaar'));return mutationResult(r.create(input||{}),'create',options);}
  function updateEvent(id,patch,options){var r=repo();if(!r||typeof r.updateOne!=='function')return Promise.reject(new Error('Agenda-opslag niet beschikbaar'));return mutationResult(r.updateOne(id,patch||{}),'update',options);}
  function removeEvent(id,options){
    var r=repo(),old=current(id);if(!r||typeof r.remove!=='function')return Promise.reject(new Error('Agenda-opslag niet beschikbaar'));
    return r.remove(id).then(function(ok){if(ok&&(!options||options.emitMutation!==false)&&old)emitLocal('delete',old);return ok;});
  }

  function patchAddSheet(){
    if(typeof window.saveItem!=='function'||window.saveItem.__calendarRepositoryWrapped)return false;
    var originalSave=window.saveItem;
    function wrappedSaveItem(){
      if(window.currentAddType!=='cal')return originalSave.apply(this,arguments);
      var title=((document.getElementById('f1')||{}).value||'').trim();
      var date=((document.getElementById('f2')||{}).value||'').trim();
      var time=((document.getElementById('f3')||{}).value||'').trim();
      var description=((document.getElementById('cal-description')||{}).value||'').trim();
      if(!title){if(window.showToast)showToast('Vul een titel in');return false;}
      if(!date){if(window.showToast)showToast('Kies een datum');return false;}
      var button=document.querySelector('#add-overlay .sheet-btn');if(button)button.disabled=true;
      var id=state.editingId,existing=id!==null?current(id):null;
      var work=existing
        ? updateEvent(existing.id,{title:title,date:date,time:time,description:description})
        : createEvent({title:title,date:date,time:time,description:description,color:'#2d5a27',createdAt:now()});
      work.then(function(){state.editingId=null;if(window.closeAdd)window.closeAdd();if(window.showToast)showToast('Afspraak opgeslagen ✓');}).catch(function(error){if(button)button.disabled=false;if(window.showToast)showToast(error&&error.message||'Afspraak opslaan mislukt');});
      return false;
    }
    wrappedSaveItem.__calendarRepositoryWrapped=true;
    window.saveItem=wrappedSaveItem;

    if(typeof window.closeAdd==='function'&&!window.closeAdd.__calendarRepositoryWrapped){
      var originalClose=window.closeAdd;
      var wrappedClose=function(){state.editingId=null;return originalClose.apply(this,arguments);};
      wrappedClose.__calendarRepositoryWrapped=true;window.closeAdd=wrappedClose;
    }
    return true;
  }

  function patchCalendarCrud(){
    window.deleteCalEvent=function(id){
      return removeEvent(id).then(function(){if(typeof window.showToast==='function')window.showToast('Afspraak verwijderd');}).catch(function(error){if(typeof window.showToast==='function')window.showToast(error&&error.message||'Verwijderen mislukt');});
    };
    window.openCalEdit=function(id){
      var event=current(id);if(!event||event._imported||typeof window.openAdd!=='function')return;
      state.editingId=event.id;window.openAdd('cal');
      var st=document.getElementById('sheet-title');if(st)st.textContent='Afspraak bewerken';
      var btn=document.querySelector('#add-overlay .sheet-btn');if(btn){btn.textContent='Opslaan';btn.disabled=false;}
      var f1=document.getElementById('f1');if(f1)f1.value=event.title||'';
      var f2=document.getElementById('f2');if(f2)f2.value=event.date||'';
      var f3=document.getElementById('f3');if(f3)f3.value=event.time||'';
      var f4=document.getElementById('cal-description');if(f4)f4.value=event.description||'';
    };
    return true;
  }

  function patchIcsImport(){
    if(typeof window.importICS!=='function'||window.importICS.__calendarRepositoryWrapped)return false;
    var originalImport=window.importICS;
    var wrapped=function(text){
      var before=(window.calData||[]).map(function(e){return String(e&&e.id);});
      var result=originalImport.apply(this,arguments);
      var added=(window.calData||[]).filter(function(e){return e&&before.indexOf(String(e.id))===-1;}).map(clone);
      if(!added.length)return result;
      var chain=Promise.resolve();
      added.forEach(function(event){chain=chain.then(function(){return createEvent(event);});});
      chain.catch(function(error){if(typeof window.showToast==='function')window.showToast(error&&error.message||'Agenda-import kon niet volledig worden opgeslagen');});
      return result;
    };
    wrapped.__calendarRepositoryWrapped=true;window.importICS=wrapped;return true;
  }

  // Compatibility escape hatch for integrations that already changed one row
  // in calData before STEP 6. It never deletes missing rows and never treats
  // generic local/AppState data as migration authority.
  function saveCompatibility(){
    var r=repo();if(!r)return Promise.reject(new Error('Agenda-opslag niet beschikbaar'));
    var rows=Array.isArray(window.calData)?window.calData.slice():[],chain=Promise.resolve(),saved=0;
    rows.forEach(function(row){if(!row||!row.id)return;chain=chain.then(function(){var live=r.get&&r.get(row.id);return (live?r.updateOne(row.id,row):r.create(row)).then(function(){saved++;});});});
    return chain.then(function(){return{saved:saved,deprecated:true};});
  }

  function boot(){
    ensureRepository();patchAddSheet();patchCalendarCrud();patchIcsImport();
    if(state.bootTimer)return;
    var tries=0;state.bootTimer=setInterval(function(){tries++;var ok=ensureRepository();patchAddSheet();patchCalendarCrud();patchIcsImport();if((ok&&window.saveItem&&window.saveItem.__calendarRepositoryWrapped)||tries>240){clearInterval(state.bootTimer);state.bootTimer=null;}},100);
  }
  function status(){var r=repo(),base=r&&typeof r.status==='function'?r.status():{};return Object.assign({version:VERSION,editingId:state.editingId,count:(window.calData||[]).length,source:state.lastMeta.source||'idle'},base);}

  window.CalendarSharedLive={version:VERSION,boot:boot,sync:function(){boot();return true;},save:saveCompatibility,create:createEvent,update:updateEvent,remove:removeEvent,status:status};
  window.addEventListener('familyapp:household-context',boot);
  window.addEventListener('online',boot);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
