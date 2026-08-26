'use strict';
// ============================================================
// PARTY QUEST HOUSEHOLD REPOSITORY v1.1.0
// STEP 11.1/11.2 canonical Party Quest persistence/lifecycle boundary.
//
// Source of truth: families/{householdId}/partyQuests/{partyQuestId}
// Identity authority: HouseholdContext (UID + household + revision)
// v1 rows are normalized in memory only. v1.1 adds guarded collection
// transactions + ID allocation for the STEP 11.2 domain service.
// ============================================================
(function(){
  if(window.PartyQuestRepository)return;

  var VERSION='1.1.0';
  var subscribers=[];
  var contextUnsubscribe=null;
  var attachTimer=null;
  var active=null;
  var bindGeneration=0;
  var currentQuests=[];
  var lastMeta={source:'idle',ready:false,error:null};

  var IMMUTABLE={_key:true,id:true,householdId:true,inviterUid:true,createdByUid:true,createdAt:true};

  function now(){return Date.now();}
  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}}
  function safeKey(value){return String(value===undefined||value===null?'party_'+now():value).replace(/[.#$\[\]\/]/g,'_');}
  function same(a,b){try{return JSON.stringify(a)===JSON.stringify(b);}catch(e){return false;}}
  function db(){try{if(window.fbDb)return window.fbDb;if(window.firebase&&window.firebase.database)return window.firebase.database();}catch(e){}return null;}
  function context(){try{return window.HouseholdContext&&typeof window.HouseholdContext.snapshot==='function'?window.HouseholdContext.snapshot():null;}catch(e){return null;}}
  function capture(){try{return window.HouseholdContext&&typeof window.HouseholdContext.capture==='function'?window.HouseholdContext.capture():null;}catch(e){return null;}}
  function isCurrent(token){try{return !!(window.HouseholdContext&&typeof window.HouseholdContext.isCurrent==='function'&&window.HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function validContext(ctx){return !!(ctx&&ctx.ready===true&&ctx.uid&&ctx.householdId);}

  function rows(value){if(!value||typeof value!=='object')return[];return Object.keys(value).map(function(key){var row=value[key];return row&&typeof row==='object'?{key:key,value:row}:null;}).filter(Boolean);}
  function normalizeInvitees(value){
    var out={};if(!value||typeof value!=='object'||Array.isArray(value))return out;
    Object.keys(value).forEach(function(uid){var row=value[uid];if(!row||typeof row!=='object')return;var next=clone(row)||{};next.uid=String(next.uid||uid);if(!next.status)next.status='pending';out[String(uid)]=next;});
    return out;
  }
  function normalizeMap(value){return value&&typeof value==='object'&&!Array.isArray(value)?clone(value):{};}
  function normalizeExisting(row,key,ctx){
    var out=clone(row||{})||{};
    var canonicalKey=String(key||out._key||out.id||safeKey('party_'+now()));
    out._key=canonicalKey;
    if(out.id===undefined||out.id===null||out.id==='')out.id=canonicalKey;else out.id=String(out.id);
    out.householdId=ctx.householdId;
    out.invitees=normalizeInvitees(out.invitees);
    out.helpRequests=normalizeMap(out.helpRequests);
    out.rewardSettlements=normalizeMap(out.rewardSettlements);
    if(out.completion===undefined)out.completion=null;
    out.schemaVersion=Math.max(2,Number(out.schemaVersion||1));
    return out;
  }
  function sealMutation(server,changed,key,ctx){
    var base=normalizeExisting(server||{},key,ctx),next=clone(base)||{},patch=changed&&typeof changed==='object'?changed:{};
    Object.keys(patch).forEach(function(prop){if(!IMMUTABLE[prop])next[prop]=clone(patch[prop]);});
    next._key=key;
    next.id=base.id||key;
    next.householdId=ctx.householdId;
    next.inviterUid=base.inviterUid||ctx.uid;
    next.createdByUid=base.createdByUid||ctx.uid;
    next.createdAt=Number(base.createdAt)||now();
    next.updatedByUid=ctx.uid;
    next.updatedAt=now();
    next.schemaVersion=2;
    next.invitees=normalizeInvitees(next.invitees);
    next.helpRequests=normalizeMap(next.helpRequests);
    next.rewardSettlements=normalizeMap(next.rewardSettlements);
    if(next.completion===undefined)next.completion=null;
    return next;
  }
  function listFromValue(value,ctx){return rows(value).map(function(entry){return normalizeExisting(entry.value,entry.key,ctx);});}
  function mapFromValue(value,ctx){var out={};rows(value).forEach(function(entry){out[entry.key]=normalizeExisting(entry.value,entry.key,ctx);});return out;}

  function emit(quests,meta){
    currentQuests=Array.isArray(quests)?quests.map(clone):[];
    lastMeta=Object.assign({source:'unknown',ready:!!active,error:null},meta||{});
    subscribers.slice().forEach(function(fn){try{fn(currentQuests.map(clone),clone(lastMeta));}catch(e){console.warn('[PartyQuestRepository] subscriber failed',e);}});
    try{window.dispatchEvent(new CustomEvent('familyapp:party-quest-repository',{detail:{quests:currentQuests.map(clone),meta:clone(lastMeta)}}));}catch(e){}
  }
  function subscribe(fn){if(typeof fn!=='function')return function(){};subscribers.push(fn);try{fn(currentQuests.map(clone),clone(lastMeta));}catch(e){}return function(){var i=subscribers.indexOf(fn);if(i>=0)subscribers.splice(i,1);};}
  function bindingCurrent(binding){return !!(binding&&active===binding&&binding.generation===bindGeneration&&isCurrent(binding.token));}
  function unbind(reason,clearProjection){if(active&&active.ref&&active.handler){try{active.ref.off('value',active.handler);}catch(e){}}active=null;bindGeneration++;if(clearProjection!==false)emit([],{source:reason||'unbound',ready:false,uid:null,householdId:null,revision:0});}
  function publish(binding,value,source){if(!bindingCurrent(binding))return;emit(listFromValue(value,binding.context),{source:source||'firebase',ready:true,uid:binding.context.uid,householdId:binding.context.householdId,revision:binding.context.revision});}
  function bind(ctx,reason){
    unbind('context-rebind',false);
    if(!validContext(ctx)){emit([],{source:'context-not-ready',ready:false,uid:ctx&&ctx.uid||null,householdId:ctx&&ctx.householdId||null,revision:ctx&&ctx.revision||0});return false;}
    var database=db();if(!database){emit([],{source:'firebase-unavailable',ready:false,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,error:'FIREBASE_DATABASE_UNAVAILABLE'});return false;}
    var token=capture();if(!token||!isCurrent(token))return false;
    var generation=++bindGeneration;
    var binding={generation:generation,token:token,context:{uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision},ref:database.ref('families/'+ctx.householdId+'/partyQuests'),handler:null};
    active=binding;
    emit([],{source:reason||'binding',ready:true,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision});
    binding.handler=function(snapshot){if(!bindingCurrent(binding))return;publish(binding,snapshot&&snapshot.val?snapshot.val():null,'firebase');};
    binding.ref.on('value',binding.handler,function(error){if(!bindingCurrent(binding))return;emit([],{source:'firebase-error',ready:true,uid:binding.context.uid,householdId:binding.context.householdId,revision:binding.context.revision,error:error&&error.message||String(error||'PARTY_QUEST_LISTENER_ERROR')});});
    return true;
  }
  function handleContext(ctx,reason){if(!validContext(ctx)){if(active||currentQuests.length)unbind('context-cleared',true);return;}if(active&&active.context.uid===ctx.uid&&active.context.householdId===ctx.householdId&&active.context.revision===ctx.revision)return;bind(ctx,reason||'context-change');}
  function attachContext(){if(contextUnsubscribe)return true;if(!window.HouseholdContext||typeof window.HouseholdContext.subscribe!=='function')return false;contextUnsubscribe=window.HouseholdContext.subscribe(handleContext);return true;}
  function start(){if(attachContext())return true;if(!attachTimer){var tries=0;attachTimer=setInterval(function(){tries++;if(attachContext()||tries>200){clearInterval(attachTimer);attachTimer=null;}},50);}return false;}
  function stop(){if(attachTimer){clearInterval(attachTimer);attachTimer=null;}if(contextUnsubscribe){try{contextUnsubscribe();}catch(e){}contextUnsubscribe=null;}unbind('stopped',true);}
  function requireBinding(){start();var ctx=context();if(validContext(ctx)&&(!active||active.context.uid!==ctx.uid||active.context.householdId!==ctx.householdId||active.context.revision!==ctx.revision))bind(ctx,'mutation-bind');if(!active||!bindingCurrent(active))throw new Error('ACTIVE_PARTY_QUEST_HOUSEHOLD_REQUIRED');return active;}
  function rejectOffline(){try{return !!(window.offlineMode||(window.navigator&&window.navigator.onLine===false));}catch(e){return false;}}
  function assertWritable(binding){if(!bindingCurrent(binding))throw new Error('STALE_PARTY_QUEST_CONTEXT');if(rejectOffline())throw new Error('PARTY_QUEST_REPOSITORY_OFFLINE');return binding;}
  function findLocal(id){var wanted=String(id);return currentQuests.find(function(q){return String(q&&q.id)===wanted||String(q&&q._key)===wanted;})||null;}
  function keyFor(id){if(id&&typeof id==='object')return String(id._key||id.id||'');var local=findLocal(id);return local&&local._key?String(local._key):safeKey(id);}
  function allocateId(){var binding=assertWritable(requireBinding());if(binding.ref&&typeof binding.ref.push==='function'){var child=binding.ref.push();if(child&&child.key)return String(child.key);}return safeKey('party_'+now()+'_'+Math.floor(Math.random()*1000000));}

  function mutateOne(id,mutator){
    var binding=assertWritable(requireBinding()),key=keyFor(id);if(!key)return Promise.reject(new Error('PARTY_QUEST_ID_REQUIRED'));var ref=binding.ref.child(key);
    return new Promise(function(resolve,reject){
      var mutatorError=null;
      ref.transaction(function(server){
        if(!bindingCurrent(binding))return;if(!server||typeof server!=='object')return;
        var base=normalizeExisting(server,key,binding.context),changed;
        try{changed=mutator(clone(base));}catch(error){mutatorError=error;return;}
        if(changed===undefined)return;
        return sealMutation(base,changed,key,binding.context);
      },function(error,committed,snapshot){
        if(mutatorError){reject(mutatorError);return;}if(error){reject(error);return;}if(!committed){reject(new Error(bindingCurrent(binding)?'PARTY_QUEST_NOT_FOUND_OR_ABORTED':'STALE_PARTY_QUEST_CONTEXT'));return;}if(!bindingCurrent(binding)){reject(new Error('STALE_PARTY_QUEST_CONTEXT'));return;}
        resolve(normalizeExisting(snapshot&&snapshot.val?snapshot.val():null,key,binding.context));
      },false);
    });
  }
  function mutateCollection(mutator){
    var binding=assertWritable(requireBinding());
    return new Promise(function(resolve,reject){
      var mutatorError=null,outcome=null;
      binding.ref.transaction(function(server){
        if(!bindingCurrent(binding))return;
        var raw=server&&typeof server==='object'?server:{},before=mapFromValue(raw,binding.context),changed;
        try{changed=mutator(clone(before));}catch(error){mutatorError=error;return;}
        if(changed===undefined)return;
        var requested=changed&&changed.rows&&typeof changed.rows==='object'?changed.rows:changed;
        outcome=changed&&Object.prototype.hasOwnProperty.call(changed,'result')?clone(changed.result):null;
        if(!requested||typeof requested!=='object')return;
        var nextRaw=clone(raw)||{};
        Object.keys(requested).forEach(function(key){
          var candidate=requested[key];if(!candidate||typeof candidate!=='object')return;
          if(raw[key]&&same(normalizeExisting(raw[key],key,binding.context),normalizeExisting(candidate,key,binding.context)))return;
          nextRaw[key]=sealMutation(raw[key]||{},candidate,key,binding.context);
        });
        return nextRaw;
      },function(error,committed,snapshot){
        if(mutatorError){reject(mutatorError);return;}if(error){reject(error);return;}if(!committed){reject(new Error(bindingCurrent(binding)?'PARTY_QUEST_COLLECTION_ABORTED':'STALE_PARTY_QUEST_CONTEXT'));return;}if(!bindingCurrent(binding)){reject(new Error('STALE_PARTY_QUEST_CONTEXT'));return;}
        resolve({rows:listFromValue(snapshot&&snapshot.val?snapshot.val():null,binding.context),result:clone(outcome)});
      },false);
    });
  }
  function updateOne(id,patch){patch=patch&&typeof patch==='object'?patch:{};return mutateOne(id,function(current){var next=clone(current)||{};Object.keys(patch).forEach(function(prop){if(!IMMUTABLE[prop])next[prop]=clone(patch[prop]);});return next;});}
  function list(){return currentQuests.map(clone);}
  function getById(id){var row=findLocal(id);return row?clone(row):null;}
  function status(){var ctx=context();return{version:VERSION,ready:!!(active&&bindingCurrent(active)),uid:ctx&&ctx.uid||null,householdId:ctx&&ctx.householdId||null,revision:ctx&&ctx.revision||0,count:currentQuests.length,source:lastMeta.source||'idle',activePartyQuestListener:!!(active&&active.handler),canonicalPath:ctx&&ctx.householdId?'families/'+ctx.householdId+'/partyQuests':null};}

  window.PartyQuestRepository={version:VERSION,start:start,stop:stop,list:list,getById:getById,subscribe:subscribe,allocateId:allocateId,mutateOne:mutateOne,mutateCollection:mutateCollection,updateOne:updateOne,status:status,_handleContext:handleContext,_keyFor:keyFor};

  window.addEventListener('familyapp:household-context',function(){start();});
  window.addEventListener('familyapp:session-state',function(){start();});
  window.addEventListener('load',function(){start();},{once:true});
  start();
})();
