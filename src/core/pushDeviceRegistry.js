'use strict';
// ============================================================
// PUSH DEVICE REGISTRY v1.0.0 — STEP 10
// User-private technical delivery registry:
//   users/{uid}/private/pushDevices/{deviceId}
//
// Tokens are never stored in household-shared notification state. The local
// device id is only an address for this browser installation, not identity.
// ============================================================
(function(){
  if(window.PushDeviceRegistry)return;
  var VERSION='1.0.0';
  var DEVICE_KEY='familyapp_push_device_id_v1';
  var lastRecord=null;

  function now(){return Date.now();}
  function clone(v){if(v===undefined)return undefined;try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function db(){try{return window.fbDb||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function capture(){try{return window.HouseholdContext&&HouseholdContext.capture?HouseholdContext.capture():null;}catch(e){return null;}}
  function isCurrent(token){try{return !!(window.HouseholdContext&&HouseholdContext.isCurrent&&HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function valid(c){return !!(c&&c.ready===true&&c.uid);}
  function randomId(){
    try{if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();}catch(e){}
    return 'web_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,12);
  }
  function deviceId(){
    var id='';try{id=localStorage.getItem(DEVICE_KEY)||'';}catch(e){}
    if(!id){id=randomId();try{localStorage.setItem(DEVICE_KEY,id);}catch(e){}}
    return id;
  }
  function path(uid){return 'users/'+uid+'/private/pushDevices/'+deviceId();}
  function platform(){
    var n=window.navigator||{};
    var ua=String(n.userAgent||'').toLowerCase();
    if(/iphone|ipad|ipod/.test(ua)||(n.platform==='MacIntel'&&Number(n.maxTouchPoints)>1))return'web-ios';
    if(/android/.test(ua))return'web-android';
    if(/mac/.test(ua))return'web-macos';
    if(/win/.test(ua))return'web-windows';
    return'web';
  }
  function requireBinding(){
    var c=context(),database=db(),token=capture();
    if(!valid(c))throw new Error('PUSH_CONTEXT_NOT_READY');
    if(!database)throw new Error('PUSH_DATABASE_UNAVAILABLE');
    if(!token||!isCurrent(token))throw new Error('PUSH_CONTEXT_STALE');
    return{context:c,db:database,token:token,path:path(c.uid)};
  }
  function sanitize(input,binding){
    input=input&&typeof input==='object'?clone(input):{};
    var created=Number(input.createdAt)||Number(lastRecord&&lastRecord.createdAt)||now();
    return{
      schemaVersion:1,
      deviceId:deviceId(),
      uid:String(binding.context.uid),
      provider:String(input.provider||'fcm'),
      platform:String(input.platform||platform()),
      token:String(input.token||''),
      enabled:input.enabled!==false,
      permission:String(input.permission||'default'),
      serviceWorkerScope:String(input.serviceWorkerScope||''),
      appVersion:String(input.appVersion||'web'),
      userAgent:String(input.userAgent||(window.navigator&&navigator.userAgent)||'').slice(0,240),
      createdAt:created,
      updatedAt:now(),
      lastSeenAt:now(),
      disabledAt:input.enabled===false?Number(input.disabledAt)||now():null,
      disabledReason:input.enabled===false?String(input.disabledReason||'disabled'):null
    };
  }
  function upsert(input){
    var binding;try{binding=requireBinding();}catch(error){return Promise.reject(error);}
    var record=sanitize(input,binding);
    if(!record.token&&record.enabled)return Promise.reject(new Error('PUSH_TOKEN_REQUIRED'));
    return binding.db.ref(binding.path).set(record).then(function(){
      if(!isCurrent(binding.token))throw new Error('PUSH_CONTEXT_CHANGED_DURING_WRITE');
      lastRecord=clone(record);
      return clone(record);
    });
  }
  function disable(reason){
    var binding;try{binding=requireBinding();}catch(error){return Promise.reject(error);}
    var at=now();
    return binding.db.ref(binding.path).update({enabled:false,permission:typeof Notification!=='undefined'?Notification.permission:'unsupported',disabledAt:at,disabledReason:String(reason||'disabled'),updatedAt:at,lastSeenAt:at}).then(function(){
      if(!isCurrent(binding.token))throw new Error('PUSH_CONTEXT_CHANGED_DURING_WRITE');
      if(lastRecord){lastRecord.enabled=false;lastRecord.disabledAt=at;lastRecord.disabledReason=String(reason||'disabled');lastRecord.updatedAt=at;}
      return true;
    });
  }
  function remove(){
    var binding;try{binding=requireBinding();}catch(error){return Promise.reject(error);}
    return binding.db.ref(binding.path).remove().then(function(){if(!isCurrent(binding.token))throw new Error('PUSH_CONTEXT_CHANGED_DURING_WRITE');lastRecord=null;return true;});
  }
  function touch(){
    var binding;try{binding=requireBinding();}catch(error){return Promise.reject(error);}
    var at=now();return binding.db.ref(binding.path).update({lastSeenAt:at,updatedAt:at}).then(function(){if(!isCurrent(binding.token))throw new Error('PUSH_CONTEXT_CHANGED_DURING_WRITE');return true;});
  }
  function status(){var c=context();return{version:VERSION,deviceId:deviceId(),uid:c&&c.uid||null,householdId:c&&c.householdId||null,platform:platform(),registered:!!(lastRecord&&lastRecord.enabled),provider:lastRecord&&lastRecord.provider||null};}

  window.PushDeviceRegistry={version:VERSION,getDeviceId:deviceId,platform:platform,upsert:upsert,disable:disable,remove:remove,touch:touch,status:status};
})();
