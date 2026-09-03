'use strict';
// ============================================================
// CLEANING SUPPLY DIRECT MANAGER v0.1.0
// Makes the room Benodigdheden sheet the primary management surface.
// - opens on all room items
// - add a supply directly and select which routine it belongs to
// - toggle existing supply <-> routine links directly in the sheet
// - expose smart room/routine suggestions in the same sheet
// Canonical relation remains CleaningRoutineItem.supplyIds.
// ============================================================
(function(){
  if(window.CleaningSupplyDirectManager)return;

  var VERSION='0.1.0';
  var state={root:{},unsubscribe:null,observer:null,queued:false,roomId:null,targetRoutineId:null,busyLink:null,busyAdd:false,wrapped:false};

  function text(value){return String(value==null?'':value).trim();}
  function escapeHtml(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function canonical(value){return text(value).toLocaleLowerCase('nl-NL').replace(/\s+/g,' ');}
  function now(){return Date.now();}
  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
  function repo(){return window.CleaningHouseholdRepository||null;}
  function context(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(error){return null;}}
  function capture(){try{return window.HouseholdContext&&window.HouseholdContext.capture?window.HouseholdContext.capture():null;}catch(error){return null;}}
  function current(token){try{return !!(window.HouseholdContext&&window.HouseholdContext.isCurrent&&window.HouseholdContext.isCurrent(token));}catch(error){return false;}}
  function database(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(error){return null;}}
  function cleaningPath(householdId){var domain=window.CleaningDomain;return domain&&domain.basePath?domain.basePath(householdId):'families/'+String(householdId||'')+'/cleaning';}
  function toast(message){if(typeof window.showToast==='function')window.showToast(message);}
  function uniqueIds(values){var seen={},out=[];(Array.isArray(values)?values:[]).forEach(function(value){var id=text(value);if(id&&!seen[id]){seen[id]=true;out.push(id);}});return out;}

  function setSnapshot(snapshot){state.root=snapshot&&snapshot.data&&typeof snapshot.data==='object'?snapshot.data:{};return state.root;}
  function prime(){var r=repo();if(!r||typeof r.snapshot!=='function')return false;try{setSnapshot(r.snapshot());return true;}catch(error){return false;}}
  function room(){var row=state.root.rooms&&state.root.rooms[state.roomId];return row&&row.active!==false?row:null;}
  function routines(){var raw=state.root.routines||{},rows=[];Object.keys(raw).forEach(function(id){var row=raw[id];if(row&&row.active!==false&&text(row.roomId)===text(state.roomId))rows.push(Object.assign({id:id},row));});rows.sort(function(a,b){return (Number(a.createdAt)||0)-(Number(b.createdAt)||0)||text(a.title).localeCompare(text(b.title),'nl');});return rows;}
  function supplyById(id){var row=state.root.supplies&&state.root.supplies[id];return row&&row.active!==false?row:null;}
  function linked(routine,supplyId){return uniqueIds(routine&&routine.supplyIds).indexOf(text(supplyId))>=0;}
  function linkedSupplyNames(){var ids=[];routines().forEach(function(row){ids=ids.concat(uniqueIds(row.supplyIds));});var seen={},names=[];uniqueIds(ids).forEach(function(id){var row=supplyById(id),key=row&&canonical(row.name);if(row&&key&&!seen[key]){seen[key]=true;names.push(row.name);}});return names;}
  function toggleLinkIds(values,supplyId,shouldLink){var ids=uniqueIds(values),id=text(supplyId),index=ids.indexOf(id);if(shouldLink&&id&&index<0)ids.push(id);if(!shouldLink&&index>=0)ids.splice(index,1);return ids;}

  function writeContext(){var ctx=context(),db=database(),token=capture(),path=ctx&&cleaningPath(ctx.householdId);if(!ctx||ctx.ready!==true||!ctx.uid||!ctx.householdId)throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');if(!db)throw new Error('FIREBASE_DATABASE_UNAVAILABLE');if(!token||!current(token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED');return{ctx:ctx,db:db,token:token,path:path};}
  function setRoutineSupplyLink(routineId,supplyId,shouldLink){
    var write;try{write=writeContext();}catch(error){return Promise.reject(error);}routineId=text(routineId);supplyId=text(supplyId);if(!routineId||!supplyId)return Promise.reject(new Error('CLEANING_SUPPLY_LINK_REQUIRED'));var timestamp=now(),transitionError=null;
    return write.db.ref(write.path+'/routines/'+routineId).transaction(function(serverRoutine){if(!current(write.token)){transitionError=new Error('HOUSEHOLD_CONTEXT_CHANGED');return;}if(!serverRoutine||typeof serverRoutine!=='object'||serverRoutine.active===false){transitionError=new Error('CLEANING_ROUTINE_NOT_FOUND');return;}if(text(serverRoutine.roomId)!==text(state.roomId)){transitionError=new Error('CLEANING_SUPPLY_ROOM_MISMATCH');return;}serverRoutine.supplyIds=toggleLinkIds(serverRoutine.supplyIds,supplyId,shouldLink);serverRoutine.updatedAt=timestamp;serverRoutine.updatedByUid=write.ctx.uid;transitionError=null;return serverRoutine;}).then(function(result){if(transitionError)throw transitionError;if(!current(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');if(!result||result.committed!==true)throw new Error('CLEANING_SUPPLY_LINK_NOT_COMMITTED');return result.snapshot&&result.snapshot.val?clone(result.snapshot.val()):null;});
  }

  function ensureStyle(){
    if(document.getElementById('cleaning-supply-direct-manager-style'))return;var style=document.createElement('style');style.id='cleaning-supply-direct-manager-style';style.textContent='\n'
      +'.cleaning-supply-direct{display:grid;gap:10px;margin-bottom:14px;padding:12px;border:1px solid var(--cleaning-border,#ddd);border-radius:17px;background:color-mix(in srgb,var(--cleaning-accent,#6750a4) 5%,var(--cleaning-surface,#fff))}.cleaning-supply-direct-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.cleaning-supply-direct-head strong{font-size:12px}.cleaning-supply-direct-head span{font-size:9px;color:var(--cleaning-muted,#777);font-weight:800;text-align:right}.cleaning-supply-direct-target{display:grid;gap:5px}.cleaning-supply-direct-target>span{font-size:9px;color:var(--cleaning-muted,#777);font-weight:850}.cleaning-supply-direct-target select{min-height:40px;width:100%;border:1px solid var(--cleaning-border,#ddd);border-radius:11px;background:var(--cleaning-surface,#fff);color:var(--cleaning-text,#222);font:inherit;font-size:11px;padding:0 10px}\n'
      +'.cleaning-supply-direct-addrow{display:flex;gap:7px}.cleaning-supply-direct-addrow input{min-width:0;flex:1;min-height:42px;border:1px solid var(--cleaning-border,#ddd);border-radius:11px;background:var(--cleaning-surface,#fff);color:var(--cleaning-text,#222);font:inherit;font-size:11px;padding:0 11px}.cleaning-supply-direct-addrow button{min-height:42px;border:0;border-radius:11px;background:var(--cleaning-accent,#6750a4);color:#fff;font:inherit;font-size:10px;font-weight:950;padding:0 12px}.cleaning-supply-direct-addrow button:disabled{opacity:.5}\n'
      +'.cleaning-supply-direct-suggest{display:flex;flex-wrap:wrap;gap:6px}.cleaning-supply-direct-suggest button{min-height:34px;border:1px dashed color-mix(in srgb,var(--cleaning-accent,#6750a4) 45%,var(--cleaning-border,#ddd));border-radius:999px;background:var(--cleaning-surface,#fff);color:var(--cleaning-accent,#6750a4);font:inherit;font-size:9px;font-weight:900;padding:0 9px}.cleaning-supply-linker{display:grid;gap:6px;margin-top:9px;padding-top:9px;border-top:1px solid var(--cleaning-border,#ddd)}.cleaning-supply-linker>span{font-size:9px;color:var(--cleaning-muted,#777);font-weight:850}.cleaning-supply-link-chips{display:flex;flex-wrap:wrap;gap:5px}.cleaning-supply-link-chip{min-height:31px;border:1px solid var(--cleaning-border,#ddd);border-radius:999px;background:var(--cleaning-surface,#fff);color:var(--cleaning-muted,#777);font:inherit;font-size:9px;font-weight:850;padding:0 9px}.cleaning-supply-link-chip.is-linked{border-color:color-mix(in srgb,var(--cleaning-accent,#6750a4) 45%,var(--cleaning-border,#ddd));background:color-mix(in srgb,var(--cleaning-accent,#6750a4) 10%,var(--cleaning-surface,#fff));color:var(--cleaning-accent,#6750a4)}.cleaning-supply-link-chip:disabled{opacity:.5}\n';document.head.appendChild(style);
  }

  function smartSuggestions(target){var experience=window.CleaningSupplyExperience,r=room();if(!experience||typeof experience._smartSuggestions!=='function'||!r)return[];return Array.from(experience._smartSuggestions(r.type,target&&target.title||'',linkedSupplyNames())).slice(0,5);}
  function directMarkup(){
    var rows=routines();if(!rows.length)return '<div class="cleaning-supply-direct-head"><div><strong>Benodigd item toevoegen</strong><div style="font-size:10px;color:var(--cleaning-muted);margin-top:3px">Maak eerst minimaal één routine in deze kamer. Een benodigd item hoort altijd bij een routine.</div></div></div>';
    if(!state.targetRoutineId||!rows.some(function(row){return row.id===state.targetRoutineId;}))state.targetRoutineId=rows[0].id;var target=rows.find(function(row){return row.id===state.targetRoutineId;})||rows[0],options=rows.map(function(row){return '<option value="'+escapeHtml(row.id)+'"'+(row.id===target.id?' selected':'')+'>'+escapeHtml(row.title||'Routine')+'</option>';}).join(''),suggestions=smartSuggestions(target);
    return '<div class="cleaning-supply-direct-head"><div><strong>＋ Benodigd item</strong><div style="font-size:10px;color:var(--cleaning-muted);margin-top:3px">Voeg hier toe en koppel direct aan de juiste routine.</div></div><span>Per routine instelbaar</span></div>'
      +'<label class="cleaning-supply-direct-target"><span>Koppel aan routine</span><select data-cleaning-supply-direct-target>'+options+'</select></label>'
      +(suggestions.length?'<div class="cleaning-supply-direct-suggest">'+suggestions.map(function(name){return '<button type="button" data-cleaning-supply-direct-suggest="'+escapeHtml(name)+'">＋ '+escapeHtml(name)+'</button>';}).join('')+'</div>':'')
      +'<div class="cleaning-supply-direct-addrow"><input type="text" maxlength="60" autocomplete="off" placeholder="Bijv. Allesreiniger" data-cleaning-supply-direct-name><button type="button" data-cleaning-supply-direct-add'+(state.busyAdd?' disabled':'')+'>'+(state.busyAdd?'Toevoegen…':'Toevoegen')+'</button></div>';
  }

  function decorateDirect(overlay){
    var tabs=overlay.querySelector('.cleaning-supply-tabs');if(!tabs)return;var section=overlay.querySelector('[data-cleaning-supply-direct]');if(!section){section=document.createElement('section');section.className='cleaning-supply-direct';section.setAttribute('data-cleaning-supply-direct','1');tabs.insertAdjacentElement('afterend',section);}var signature=JSON.stringify({room:state.roomId,target:state.targetRoutineId,routines:routines().map(function(row){return[row.id,row.title,row.supplyIds||[]];}),busy:state.busyAdd});if(section.getAttribute('data-signature')!==signature){section.setAttribute('data-signature',signature);section.innerHTML=directMarkup();}
  }
  function decorateRows(overlay){
    var rows=routines(),items=overlay.querySelectorAll('.cleaning-supply-row');for(var i=0;i<items.length;i++){var item=items[i],status=item.querySelector('[data-cleaning-supply-status-id]'),supplyId=text(status&&status.getAttribute('data-cleaning-supply-status-id'));if(!supplyId)continue;var linker=item.querySelector('[data-cleaning-supply-linker]');if(!linker){linker=document.createElement('div');linker.className='cleaning-supply-linker';linker.setAttribute('data-cleaning-supply-linker','1');item.appendChild(linker);}var signature=JSON.stringify(rows.map(function(row){return[row.id,linked(row,supplyId),state.busyLink===row.id+'|'+supplyId];}));if(linker.getAttribute('data-signature')===signature)continue;linker.setAttribute('data-signature',signature);linker.innerHTML='<span>Gebruikt bij</span><div class="cleaning-supply-link-chips">'+(rows.length?rows.map(function(row){var on=linked(row,supplyId),busy=state.busyLink===row.id+'|'+supplyId;return '<button type="button" class="cleaning-supply-link-chip'+(on?' is-linked':'')+'" data-cleaning-supply-link-routine="'+escapeHtml(row.id)+'" data-cleaning-supply-link-id="'+escapeHtml(supplyId)+'" data-cleaning-supply-link-next="'+(on?'0':'1')+'"'+(busy?' disabled':'')+'>'+(on?'✓ ':'')+escapeHtml(row.title||'Routine')+'</button>';}).join(''):'<span style="font-size:9px;color:var(--cleaning-muted)">Nog geen routines</span>')+'</div>';}
    var empty=overlay.querySelector('.cleaning-supply-empty');if(empty)empty.textContent=rows.length?'Nog geen benodigdheden gekoppeld. Voeg hierboven een item toe aan een routine.':'Maak eerst een routine. Daarna kun je hier direct benodigdheden toevoegen.';
  }
  function forceAllItems(overlay){if(overlay.getAttribute('data-cleaning-direct-defaulted')==='1')return;overlay.setAttribute('data-cleaning-direct-defaulted','1');var all=overlay.querySelector('[data-cleaning-supply-mode="all"]');if(all&&all.getAttribute('class').indexOf('is-active')<0&&typeof all.click==='function')all.click();}
  function decorate(){state.queued=false;ensureStyle();wrapOpenRoom();var overlay=document.getElementById('cleaning-supplies-overlay');if(!overlay||!state.roomId)return;forceAllItems(overlay);decorateDirect(overlay);decorateRows(overlay);}
  function queue(){if(state.queued)return;state.queued=true;(window.requestAnimationFrame||function(callback){return window.setTimeout(callback,0);})(decorate);}

  function wrapOpenRoom(){var experience=window.CleaningSupplyExperience;if(!experience||typeof experience.openRoom!=='function')return false;if(experience.openRoom.__cleaningDirectManager){state.wrapped=true;return true;}var raw=experience.openRoom;experience.openRoom=function(roomId){state.roomId=text(roomId);state.targetRoutineId=null;var result=raw.apply(this,arguments);queue();return result;};experience.openRoom.__cleaningDirectManager=true;experience.openRoom.__raw=raw;state.wrapped=true;return true;}

  function addNamedSupply(name){
    name=text(name);var rows=routines(),target=rows.find(function(row){return row.id===state.targetRoutineId;})||rows[0],experience=window.CleaningSupplyExperience;if(!name||!target||!experience||typeof experience.createSupply!=='function'||state.busyAdd)return;state.busyAdd=true;queue();experience.createSupply(name).then(function(supply){if(!supply||!supply.id)throw new Error('CLEANING_SUPPLY_ID_REQUIRED');return setRoutineSupplyLink(target.id,supply.id,true);}).then(function(){state.busyAdd=false;toast(name+' toegevoegd aan '+(target.title||'routine')+' ✓');queue();}).catch(function(error){state.busyAdd=false;toast((error&&error.message)||'Benodigd item kon niet worden toegevoegd');queue();});
  }
  function toggleLink(button){var routineId=text(button.getAttribute('data-cleaning-supply-link-routine')),supplyId=text(button.getAttribute('data-cleaning-supply-link-id')),shouldLink=button.getAttribute('data-cleaning-supply-link-next')==='1',key=routineId+'|'+supplyId;if(state.busyLink)return;state.busyLink=key;queue();setRoutineSupplyLink(routineId,supplyId,shouldLink).then(function(){state.busyLink=null;toast(shouldLink?'Aan routine gekoppeld ✓':'Koppeling verwijderd ✓');queue();}).catch(function(error){state.busyLink=null;toast((error&&error.message)||'Koppeling kon niet worden aangepast');queue();});}

  function onClick(event){var target=event.target,closest=target&&target.closest?target.closest.bind(target):null;if(!closest)return;var roomButton=closest('[data-cleaning-room-supplies]');if(roomButton){state.roomId=text(roomButton.getAttribute('data-cleaning-room-supplies'));state.targetRoutineId=null;window.setTimeout(queue,0);return;}var add=closest('[data-cleaning-supply-direct-add]');if(add){event.preventDefault();event.stopPropagation();var input=document.querySelector('#cleaning-supplies-overlay [data-cleaning-supply-direct-name]');addNamedSupply(input&&input.value);return;}var suggestion=closest('[data-cleaning-supply-direct-suggest]');if(suggestion){event.preventDefault();event.stopPropagation();addNamedSupply(suggestion.getAttribute('data-cleaning-supply-direct-suggest'));return;}var link=closest('[data-cleaning-supply-link-routine][data-cleaning-supply-link-id]');if(link){event.preventDefault();event.stopPropagation();toggleLink(link);}}
  function onChange(event){var target=event.target;if(target&&target.matches&&target.matches('[data-cleaning-supply-direct-target]')){state.targetRoutineId=text(target.value);queue();}}
  function onKeydown(event){var target=event.target;if(event.key==='Enter'&&target&&target.matches&&target.matches('[data-cleaning-supply-direct-name]')){event.preventDefault();addNamedSupply(target.value);}}

  function start(){
    if(window.__cleaningSupplyDirectManagerStarted)return;window.__cleaningSupplyDirectManagerStarted=true;ensureStyle();prime();var r=repo();if(r&&typeof r.subscribe==='function')state.unsubscribe=r.subscribe(function(snapshot){setSnapshot(snapshot);queue();});wrapOpenRoom();document.addEventListener('click',onClick,true);document.addEventListener('change',onChange,true);document.addEventListener('keydown',onKeydown,true);var target=document.body||document.documentElement;if(typeof MutationObserver!=='undefined'&&target){state.observer=new MutationObserver(queue);state.observer.observe(target,{childList:true,subtree:true});}queue();
  }

  window.CleaningSupplyDirectManager={version:VERSION,start:start,setRoutineSupplyLink:setRoutineSupplyLink,_toggleLinkIds:toggleLinkIds,_setSnapshot:setSnapshot};start();
})();
