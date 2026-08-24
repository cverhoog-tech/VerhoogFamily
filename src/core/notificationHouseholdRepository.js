'use strict';
// ============================================================
// NOTIFICATION HOUSEHOLD REPOSITORY v1.0.0 — STEP 10 foundation
//
// Canonical persistence boundary:
//   families/{householdId}/shared/notifications/{eventId}
//
// Identity authority: HouseholdContext (uid + householdId + revision).
// Exactly one household listener is owned here. UI, domain projectors and push
// delivery must never own a competing notification persistence listener.
// ============================================================
(function(){
  if(window.NotificationHouseholdRepository)return;

  var VERSION='1.0.0';
  var subscribers=[];
  var contextUnsubscribe=null;
  var attachTimer=null;
  var active=null;
  var bindGeneration=0;
  var current={};
  var lastMeta={source:'idle',ready:false,error:null,uid:null,householdId:null,revision:null};

  function now(){return Date.now();}
  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}}
  function db(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}}
  function snapshot(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function capture(){try{return window.HouseholdContext&&HouseholdContext.capture?HouseholdContext.capture():null;}catch(e){return null;}}
  function isCurrent(token){try{return !!(window.HouseholdContext&&HouseholdContext.isCurrent&&HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function validContext(ctx){return !!(ctx&&ctx.ready===true&&ctx.uid&&ctx.householdId);}
  function normalizeMap(value){
    var out={};
    if(!value)return out;
    if(Array.isArray(value)){
      value.forEach(function(row){if(row&&row.id)out[String(row.id)]=clone(row);});
      return out;
    }
    Object.keys(value).forEach(function(key){if(value[key])out[String(key)]=Object.assign({id:String(key)},clone(value[key]));});
    return out;
  }
  function pathFor(ctx){return 'families/'+ctx.householdId+'/shared/notifications';}
  function safeEventKey(key){
    var raw=String(key==null?'':key).trim();
    if(!raw)throw new Error('NOTIFICATION_EVENT_KEY_REQUIRED');
    return encodeURIComponent(raw).replace(/\./g,'%2E');
  }
  function eventIdFor(key){return 'evt_'+safeEventKey(key);}

  function emit(value,meta){
    current=normalizeMap(value);
    lastMeta=Object.assign({source:'unknown',ready:!!active,error:null,uid:null,householdId:null,revision:null},meta||{});
    var projection=clone(current),info=clone(lastMeta);
    subscribers.slice().forEach(function(fn){try{fn(projection,info);}catch(e){console.warn('[NotificationHouseholdRepository] subscriber failed',e);}});
    try{window.dispatchEvent(new CustomEvent('familyapp:notification-repository',{detail:{records:projection,meta:info}}));}catch(e){}
  }

  function subscribe(fn){
    if(typeof fn!=='function')return function(){};
    subscribers.push(fn);
    try{fn(clone(current),clone(lastMeta));}catch(e){}
    return function(){var i=subscribers.indexOf(fn);if(i>=0)subscribers.splice(i,1);};
  }

  function bindingCurrent(binding){return !!(binding&&active===binding&&binding.generation===bindGeneration&&isCurrent(binding.token));}

  function unbind(reason,clearProjection){
    if(active&&active.ref&&active.handler){try{active.ref.off('value',active.handler);}catch(e){}}
    active=null;
    bindGeneration++;
    if(clearProjection!==false)emit({}, {source:reason||'unbound',ready:false,error:null,uid:null,householdId:null,revision:null});
  }

  function publishProjection(binding,value,source){
    if(!bindingCurrent(binding))return;
    emit(value,{source:source||'firebase',ready:true,error:null,uid:binding.context.uid,householdId:binding.context.householdId,revision:binding.context.revision});
  }

  function bind(ctx){
    unbind('context-rebind',false);
    if(!validContext(ctx)){
      emit({}, {source:'context-not-ready',ready:false,error:null,uid:ctx&&ctx.uid||null,householdId:ctx&&ctx.householdId||null,revision:ctx&&ctx.revision||null});
      return false;
    }
    var database=db();
    if(!database){
      emit({}, {source:'no-db',ready:false,error:'FIREBASE_DATABASE_UNAVAILABLE',uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision});
      return false;
    }
    var token=capture();
    if(!token||!isCurrent(token))return false;
    var generation=++bindGeneration;
    var ref=database.ref(pathFor(ctx));
    var binding={generation:generation,context:{uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision},token:token,db:database,ref:ref,handler:null};
    active=binding;
    emit({}, {source:'binding',ready:false,error:null,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision});
    binding.handler=function(snap){
      if(!bindingCurrent(binding))return;
      publishProjection(binding,snap&&snap.val?snap.val():{},'firebase');
    };
    ref.on('value',binding.handler,function(error){
      if(!bindingCurrent(binding))return;
      emit({}, {source:'firebase-error',ready:false,error:error&&error.message||String(error||'NOTIFICATION_LISTENER_ERROR'),uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision});
    });
    return true;
  }

  function handleContext(ctx){
    if(!validContext(ctx)){unbind('context-cleared',true);return;}
    if(active&&active.context.uid===ctx.uid&&active.context.householdId===ctx.householdId&&active.context.revision===ctx.revision)return;
    bind(ctx);
  }

  function start(){
    if(!contextUnsubscribe&&window.HouseholdContext&&typeof HouseholdContext.subscribe==='function')contextUnsubscribe=HouseholdContext.subscribe(handleContext);
    var ctx=snapshot();
    if(validContext(ctx))handleContext(ctx);
    if(!validContext(ctx)&&!attachTimer){
      var tries=0;
      attachTimer=setInterval(function(){
        tries++;
        var next=snapshot();
        if(validContext(next)){clearInterval(attachTimer);attachTimer=null;handleContext(next);}
        else if(tries>300){clearInterval(attachTimer);attachTimer=null;}
      },100);
    }
    return true;
  }

  function requireBinding(){
    var ctx=snapshot();
    if(!validContext(ctx))throw new Error('NOTIFICATION_CONTEXT_NOT_READY');
    if(!active||active.context.uid!==ctx.uid||active.context.householdId!==ctx.householdId||active.context.revision!==ctx.revision)bind(ctx);
    if(!active||!bindingCurrent(active))throw new Error('NOTIFICATION_CONTEXT_STALE');
    return active;
  }

  function normalizeEvent(eventKey,input,binding){
    input=input&&typeof input==='object'?clone(input):{};
    var id=eventIdFor(eventKey);
    var out=Object.assign({},input,{
      id:id,
      eventKey:String(eventKey),
      schemaVersion:Number(input.schemaVersion||1)||1,
      createdAt:Number(input.createdAt)||now(),
      updatedAt:now()
    });
    if(!out.actor||typeof out.actor!=='object')out.actor={uid:binding.context.uid};
    if(!out.actor.uid)out.actor.uid=binding.context.uid;
    if(!out.readBy||typeof out.readBy!=='object'||Array.isArray(out.readBy))out.readBy={};
    if(!out.dismissedBy||typeof out.dismissedBy!=='object'||Array.isArray(out.dismissedBy))out.dismissedBy={};
    return out;
  }

  function publishOnce(eventKey,input){
    var binding;
    try{binding=requireBinding();}catch(error){return Promise.reject(error);}
    var token=binding.token,id;
    try{id=eventIdFor(eventKey);}catch(error){return Promise.reject(error);}
    var event=normalizeEvent(eventKey,input,binding);
    var ref=binding.db.ref(pathFor(binding.context)+'/'+id);
    return ref.transaction(function(server){
      if(!bindingCurrent(binding)||!isCurrent(token))return;
      if(server!==null&&server!==undefined)return;
      return clone(event);
    }).then(function(result){
      if(!bindingCurrent(binding)||!isCurrent(token))throw new Error('NOTIFICATION_CONTEXT_CHANGED_DURING_PUBLISH');
      var committed=!!(result&&result.committed);
      var value=result&&result.snapshot&&typeof result.snapshot.val==='function'?result.snapshot.val():(committed?event:null);
      if(value){
        var next=clone(current)||{};
        next[id]=Object.assign({id:id},clone(value));
        publishProjection(binding,next,committed?'mutation-ack':'duplicate-ack');
      }
      return {created:committed,id:id,event:clone(value||current[id]||null)};
    });
  }

  function marker(id,field,timestamp){
    var binding;
    try{binding=requireBinding();}catch(error){return Promise.reject(error);}
    id=String(id||'').trim();
    if(!id)return Promise.reject(new Error('NOTIFICATION_ID_REQUIRED'));
    if(field!=='readBy'&&field!=='dismissedBy')return Promise.reject(new Error('NOTIFICATION_MARKER_FIELD_INVALID'));
    var token=binding.token,me=binding.context.uid,at=Number(timestamp)||now();
    var markerPath=pathFor(binding.context)+'/'+id+'/'+field+'/'+me;
    return binding.db.ref(markerPath).set(at).then(function(){
      if(!bindingCurrent(binding)||!isCurrent(token))throw new Error('NOTIFICATION_CONTEXT_CHANGED_DURING_MARKER');
      var next=clone(current)||{};
      if(next[id]){
        next[id][field]=Object.assign({},next[id][field]||{});
        next[id][field][me]=at;
        next[id].updatedAt=at;
        publishProjection(binding,next,'marker-ack');
      }
      return {id:id,uid:me,field:field,at:at};
    });
  }

  function markRead(id,timestamp){return marker(id,'readBy',timestamp);}
  function dismiss(id,timestamp){return marker(id,'dismissedBy',timestamp);}

  function stop(){
    if(contextUnsubscribe){try{contextUnsubscribe();}catch(e){}contextUnsubscribe=null;}
    if(attachTimer){clearInterval(attachTimer);attachTimer=null;}
    unbind('stopped',true);
  }

  function status(){
    var ctx=snapshot();
    return {version:VERSION,ready:!!(active&&bindingCurrent(active)&&lastMeta.ready),uid:ctx&&ctx.uid||null,householdId:ctx&&ctx.householdId||null,boundUid:active&&active.context.uid||null,boundHouseholdId:active&&active.context.householdId||null,count:Object.keys(current||{}).length,source:lastMeta.source,error:lastMeta.error||null};
  }

  window.NotificationHouseholdRepository={
    version:VERSION,
    start:start,
    stop:stop,
    get:function(){return clone(current);},
    subscribe:subscribe,
    publishOnce:publishOnce,
    markRead:markRead,
    dismiss:dismiss,
    eventIdFor:eventIdFor,
    status:status
  };

  start();
})();
