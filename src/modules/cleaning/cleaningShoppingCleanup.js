'use strict';
// ============================================================
// CLEANING SHOPPING CLEANUP v0.1.0
// Keeps explicit Cleaning-origin shopping items aligned with active room/routine
// supply needs. Only open items with source === 'cleaning' are candidates.
// Manual/recipe items and completed shopping history are never removed.
// ============================================================
(function(){
  if(window.CleaningShoppingCleanup)return;

  var VERSION='0.1.0';
  var state={cleaningSnapshot:null,cleaningUnsubscribe:null,queued:false,inFlight:false,pending:false,lastResult:null,lastError:null};

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function canonicalName(value){return text(value).toLocaleLowerCase('nl-NL').replace(/\s+/g,' ');}
  function unique(values){var seen={},out=[];(Array.isArray(values)?values:[]).forEach(function(value){var id=text(value);if(id&&!seen[id]){seen[id]=true;out.push(id);}});return out;}
  function cleaningRepo(){return window.CleaningHouseholdRepository||null;}
  function shoppingRepo(){return window.ShoppingListHouseholdRepository||null;}

  function requiredSupplyIds(cleaning){
    var root=cleaning&&typeof cleaning==='object'?cleaning:{},rooms=root.rooms&&typeof root.rooms==='object'?root.rooms:{},routines=root.routines&&typeof root.routines==='object'?root.routines:{},needed={};
    Object.keys(routines).forEach(function(id){
      var routine=routines[id];if(!routine||typeof routine!=='object'||routine.active===false)return;var room=rooms[text(routine.roomId)];if(!room||typeof room!=='object'||room.active===false)return;
      unique(routine.supplyIds).forEach(function(supplyId){needed[supplyId]=true;});
    });
    return needed;
  }

  function supplyNameLookup(cleaning){
    var supplies=cleaning&&cleaning.supplies&&typeof cleaning.supplies==='object'?cleaning.supplies:{},lookup={};
    Object.keys(supplies).forEach(function(id){var row=supplies[id];if(!row||typeof row!=='object')return;var name=canonicalName(row.name);if(name&&!lookup[name])lookup[name]=id;});
    return lookup;
  }

  function resolveSupplyId(cleaning,item){
    var explicit=text(item&&item.cleaningSupplyId);if(explicit)return explicit;var lookup=supplyNameLookup(cleaning),name=canonicalName(item&&item.name);return name&&lookup[name]?lookup[name]:null;
  }

  function isCleaningCandidate(cleaning,item){
    if(!item||typeof item!=='object'||item.done===true||text(item.source).toLowerCase()!=='cleaning')return false;
    var supplyId=resolveSupplyId(cleaning,item);if(!supplyId)return false;
    return !requiredSupplyIds(cleaning)[supplyId];
  }

  function cleanupCandidates(cleaning,shopping){
    var projection=shopping&&typeof shopping==='object'?shopping:{},out=[];
    ['shared','private'].forEach(function(scope){var lists=projection[scope]&&typeof projection[scope]==='object'?projection[scope]:{};Object.keys(lists).forEach(function(listKey){var list=lists[listKey];if(!list||typeof list!=='object')return;var items=list.items&&typeof list.items==='object'?list.items:{};Object.keys(items).forEach(function(itemKey){var item=items[itemKey];if(isCleaningCandidate(cleaning,item))out.push({scope:scope,listId:text(list.id)||text(listKey),itemKey:text(item._key)||text(itemKey),name:text(item.name),supplyId:resolveSupplyId(cleaning,item)});});});});
    return out;
  }

  function emit(detail){state.lastResult=clone(detail||{});state.lastError=detail&&detail.error||null;try{window.dispatchEvent(new CustomEvent('familyapp:cleaning-shopping-cleanup',{detail:clone(detail||{})}));}catch(error){}}

  function currentCleaning(){var snapshot=state.cleaningSnapshot;if(snapshot&&snapshot.ready===true)return snapshot.data||{};var repo=cleaningRepo();try{snapshot=repo&&repo.snapshot?repo.snapshot():null;if(snapshot&&snapshot.ready===true){state.cleaningSnapshot=snapshot;return snapshot.data||{};}}catch(error){}return null;}
  function currentShopping(){var repo=shoppingRepo();try{return repo&&repo.snapshot?repo.snapshot():null;}catch(error){return null;}}

  function reconcile(){
    if(state.inFlight){state.pending=true;return Promise.resolve(null);}var cleaning=currentCleaning(),shopping=currentShopping(),repo=shoppingRepo();if(!cleaning||!shopping||!repo||typeof repo.deleteItem!=='function')return Promise.resolve(null);
    var candidates=cleanupCandidates(cleaning,shopping);if(!candidates.length){var clean={status:'clean',removedCount:0,removed:[]};emit(clean);return Promise.resolve(clean);}
    state.inFlight=true;state.pending=false;var removed=[];
    return candidates.reduce(function(chain,row){return chain.then(function(){return repo.deleteItem(row.scope,row.listId,row.itemKey).then(function(){removed.push(row);}).catch(function(error){var message=text(error&&error.message||error);if(message==='Item niet gevonden')return;throw error;});});},Promise.resolve()).then(function(){var result={status:'cleaned',removedCount:removed.length,removed:removed};emit(result);return result;}).catch(function(error){emit({status:'error',error:error&&error.message||String(error),removedCount:removed.length,removed:removed});throw error;}).finally(function(){state.inFlight=false;if(state.pending){state.pending=false;queue();}});
  }

  function queue(){if(state.queued){state.pending=true;return;}state.queued=true;window.setTimeout(function(){state.queued=false;reconcile().catch(function(){});},0);}
  function onCleaning(snapshot){if(snapshot&&snapshot.ready===true)state.cleaningSnapshot=snapshot;queue();}
  function attachCleaning(){var repo=cleaningRepo();if(!repo||typeof repo.subscribe!=='function')return false;if(state.cleaningUnsubscribe)return true;state.cleaningUnsubscribe=repo.subscribe(onCleaning);return true;}
  function start(){if(window.__cleaningShoppingCleanupStarted)return true;window.__cleaningShoppingCleanupStarted=true;attachCleaning();window.addEventListener('familyapp:cleaning-repository',function(event){if(event&&event.detail&&event.detail.ready===true)state.cleaningSnapshot=event.detail;queue();});window.addEventListener('familyapp:shopping-repository',queue);window.addEventListener('familyapp:household-context',function(){attachCleaning();queue();});queue();return true;}
  function stop(){if(state.cleaningUnsubscribe){try{state.cleaningUnsubscribe();}catch(error){}state.cleaningUnsubscribe=null;}state.queued=false;state.inFlight=false;state.pending=false;}

  window.CleaningShoppingCleanup={version:VERSION,start:start,stop:stop,reconcile:reconcile,status:function(){return clone({version:VERSION,inFlight:state.inFlight,lastResult:state.lastResult,lastError:state.lastError});},_requiredSupplyIds:requiredSupplyIds,_resolveSupplyId:resolveSupplyId,_isCleaningCandidate:isCleaningCandidate,_cleanupCandidates:cleanupCandidates};
  start();
})();
