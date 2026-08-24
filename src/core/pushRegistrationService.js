'use strict';
// ============================================================
// PUSH REGISTRATION SERVICE v1.0.0 — STEP 10
// Platform-neutral-ish web adapter around FCM registration. Starting the
// service NEVER requests notification permission. Permission is requested only
// through requestEnable(), which must be called from a user gesture.
// ============================================================
(function(){
  if(window.PushRegistrationService)return;
  var VERSION='1.0.0';
  var OPTIN_PREFIX='familyapp_push_optin_v1:';
  var started=false,contextUnsubscribe=null,onMessageUnsubscribe=null;
  var activeUid=null,generation=0,config=null,configPromise=null;
  var state={status:'idle',supported:false,configured:false,permission:'default',enabled:false,reason:null};

  function clone(v){if(v===undefined)return undefined;try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function ctx(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function valid(c){return !!(c&&c.ready===true&&c.uid&&c.householdId);}
  function nav(){return window.navigator||{};}
  function permission(){try{return typeof Notification!=='undefined'?Notification.permission:'unsupported';}catch(e){return'unsupported';}}
  function iosLike(){var n=nav(),ua=String(n.userAgent||'');return /iPhone|iPad|iPod/i.test(ua)||(n.platform==='MacIntel'&&Number(n.maxTouchPoints)>1);}
  function standalone(){try{return !!(nav().standalone===true||(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches));}catch(e){return false;}}
  function supported(){
    if(!window.isSecureContext)return false;
    if(typeof Notification==='undefined')return false;
    if(!nav().serviceWorker)return false;
    if(!window.fbMsg||typeof window.fbMsg.getToken!=='function')return false;
    try{if(window.firebase&&firebase.messaging&&typeof firebase.messaging.isSupported==='function'&&!firebase.messaging.isSupported())return false;}catch(e){}
    return true;
  }
  function optinKey(uid){return OPTIN_PREFIX+String(uid||'');}
  function hasOptin(uid){try{return localStorage.getItem(optinKey(uid))==='1';}catch(e){return false;}}
  function setOptin(uid,value){try{if(value)localStorage.setItem(optinKey(uid),'1');else localStorage.removeItem(optinKey(uid));}catch(e){}}
  function registry(){return window.PushDeviceRegistry||null;}
  function emit(reason){
    var c=ctx(),r=registry();
    var next=Object.assign({},state,{
      version:VERSION,
      uid:c&&c.uid||null,
      householdId:c&&c.householdId||null,
      supported:supported(),
      configured:!!(config&&config.configured&&config.vapidKey),
      permission:permission(),
      enabled:!!state.enabled,
      standalone:standalone(),
      iosLike:iosLike(),
      deviceId:r&&r.getDeviceId?r.getDeviceId():null,
      platform:r&&r.platform?r.platform():'web',
      reason:reason||state.reason||null
    });
    state=next;
    try{window.dispatchEvent(new CustomEvent('familyapp:push-status',{detail:clone(next)}));}catch(e){}
    return clone(next);
  }
  function setStatus(status,extra){state=Object.assign({},state,extra||{},{status:status});return emit(extra&&extra.reason);}

  function loadConfig(){
    if(config)return Promise.resolve(config);
    if(configPromise)return configPromise;
    configPromise=(window.fetch?window.fetch('/api/push-config',{cache:'no-store'}):Promise.reject(new Error('PUSH_FETCH_UNAVAILABLE'))).then(function(res){if(!res||!res.ok)throw new Error('PUSH_CONFIG_UNAVAILABLE');return res.json();}).then(function(value){config=value||{};emit('config-loaded');return config;}).catch(function(error){config={configured:false,vapidKey:'',serviceWorkerPath:'/firebase-messaging-sw.js',error:error&&error.message||'PUSH_CONFIG_UNAVAILABLE'};emit('config-error');return config;}).finally(function(){configPromise=null;});
    return configPromise;
  }

  function serviceWorker(){
    if(!supported())return Promise.reject(new Error('PUSH_NOT_SUPPORTED'));
    var path=config&&config.serviceWorkerPath||'/firebase-messaging-sw.js';
    return nav().serviceWorker.register(path,{scope:'/'});
  }

  function attachForegroundHandler(){
    if(onMessageUnsubscribe||!window.fbMsg||typeof fbMsg.onMessage!=='function')return;
    try{onMessageUnsubscribe=fbMsg.onMessage(function(payload){
      try{window.dispatchEvent(new CustomEvent('familyapp:push-foreground',{detail:{payload:payload||null}}));}catch(e){}
      // Canonical NotificationStore/RTDB remains responsible for inbox state and
      // live banners, preventing the FCM foreground copy from creating duplicates.
    });}catch(e){}
  }
  function attachServiceWorkerMessages(){
    if(!nav().serviceWorker||window.__familyappPushMessageListener)return;
    window.__familyappPushMessageListener=true;
    nav().serviceWorker.addEventListener('message',function(ev){
      var data=ev&&ev.data||{};
      if(data.type!=='familyapp:push-open')return;
      try{if(typeof window.showScreenMore==='function')window.showScreenMore('notif');else if(typeof window.showScreen==='function')window.showScreen('notif');}catch(e){}
      try{window.dispatchEvent(new CustomEvent('familyapp:push-open',{detail:data}));}catch(e){}
    });
  }
  function syncBadge(unread){
    var n=nav();unread=Math.max(0,Number(unread)||0);
    try{
      if(unread&&typeof n.setAppBadge==='function')return Promise.resolve(n.setAppBadge(unread)).catch(function(){});
      if(!unread&&typeof n.clearAppBadge==='function')return Promise.resolve(n.clearAppBadge()).catch(function(){});
    }catch(e){}
    return Promise.resolve();
  }
  function attachBadgeSync(){
    if(window.__familyappPushBadgeListener)return;
    window.__familyappPushBadgeListener=true;
    window.addEventListener('familyapp:notifications-changed',function(ev){var unread=ev&&ev.detail&&ev.detail.unread||0;syncBadge(unread);});
  }

  function unsubscribeBrowserPush(){
    var deletePromise=Promise.resolve(false);
    try{if(window.fbMsg&&typeof fbMsg.deleteToken==='function')deletePromise=Promise.resolve(fbMsg.deleteToken()).catch(function(){return false;});}catch(e){}
    return deletePromise.then(function(){
      if(!nav().serviceWorker||typeof nav().serviceWorker.getRegistration!=='function')return false;
      return nav().serviceWorker.getRegistration('/').then(function(reg){if(!reg||!reg.pushManager)return false;return reg.pushManager.getSubscription().then(function(sub){return sub?sub.unsubscribe():false;});}).catch(function(){return false;});
    });
  }

  function registerTransport(uid,reason){
    var g=++generation;
    if(!valid(ctx())||String(ctx().uid)!==String(uid))return Promise.reject(new Error('PUSH_CONTEXT_NOT_READY'));
    if(!supported())return Promise.reject(new Error('PUSH_NOT_SUPPORTED'));
    if(!config||!config.configured||!config.vapidKey)return Promise.reject(new Error('PUSH_VAPID_NOT_CONFIGURED'));
    if(permission()!=='granted')return Promise.reject(new Error('PUSH_PERMISSION_NOT_GRANTED'));
    setStatus('registering',{enabled:false,reason:reason||'registering'});
    return serviceWorker().then(function(reg){
      if(g!==generation||!valid(ctx())||String(ctx().uid)!==String(uid))throw new Error('PUSH_CONTEXT_CHANGED');
      return fbMsg.getToken({vapidKey:config.vapidKey,serviceWorkerRegistration:reg}).then(function(token){return{reg:reg,token:token};});
    }).then(function(result){
      if(g!==generation||!valid(ctx())||String(ctx().uid)!==String(uid))throw new Error('PUSH_CONTEXT_CHANGED');
      if(!result.token)throw new Error('PUSH_TOKEN_UNAVAILABLE');
      var r=registry();if(!r||typeof r.upsert!=='function')throw new Error('PUSH_REGISTRY_UNAVAILABLE');
      return r.upsert({provider:'fcm',token:result.token,permission:'granted',serviceWorkerScope:result.reg.scope,appVersion:'web-step10',enabled:true}).then(function(){
        if(g!==generation||!valid(ctx())||String(ctx().uid)!==String(uid))throw new Error('PUSH_CONTEXT_CHANGED');
        attachForegroundHandler();setStatus('enabled',{enabled:true,reason:null});return status();
      });
    }).catch(function(error){setStatus('error',{enabled:false,reason:error&&error.message||'PUSH_REGISTER_FAILED'});throw error;});
  }

  function requestEnable(){
    var c=ctx();
    if(!valid(c))return Promise.reject(new Error('PUSH_CONTEXT_NOT_READY'));
    if(!supported())return Promise.reject(new Error('PUSH_NOT_SUPPORTED'));
    if(iosLike()&&!standalone())return Promise.reject(new Error('PUSH_IOS_HOME_SCREEN_REQUIRED'));
    if(!config||!config.configured||!config.vapidKey)return Promise.reject(new Error('PUSH_VAPID_NOT_CONFIGURED'));

    // Keep the permission request as the first async operation after the user's
    // button tap so iOS/iPadOS can recognize it as a direct user interaction.
    return Promise.resolve(Notification.requestPermission()).then(function(result){
      if(result!=='granted'){setOptin(c.uid,false);setStatus(result==='denied'?'denied':'disabled',{enabled:false,reason:'permission-'+result});throw new Error('PUSH_PERMISSION_'+String(result).toUpperCase());}
      setOptin(c.uid,true);
      return registerTransport(c.uid,'user-opt-in');
    });
  }

  function disable(reason){
    var c=ctx(),r=registry(),uid=c&&c.uid||activeUid;
    if(uid)setOptin(uid,false);
    generation++;
    var mark=(valid(c)&&r&&typeof r.disable==='function')?r.disable(reason||'user-disabled').catch(function(){return false;}):Promise.resolve(false);
    return mark.then(function(){return unsubscribeBrowserPush();}).then(function(){setStatus('disabled',{enabled:false,reason:reason||'user-disabled'});syncBadge(0);return status();});
  }

  function restoreIfAllowed(uid){
    if(!uid||!hasOptin(uid)||permission()!=='granted')return Promise.resolve(false);
    if(!config||!config.configured||!config.vapidKey)return Promise.resolve(false);
    return registerTransport(uid,'restore').then(function(){return true;}).catch(function(){return false;});
  }

  function handleContext(next){
    var nextUid=valid(next)?String(next.uid):null;
    if(nextUid===activeUid){emit('context-same');return;}
    var previous=activeUid;activeUid=nextUid;generation++;
    if(previous){
      // A messaging subscription belongs to the browser installation rather than
      // Firebase Auth. Invalidate it on every UID/logout transition so a token
      // registered for user A cannot keep delivering after user B uses the PWA.
      unsubscribeBrowserPush().finally(function(){if(nextUid)restoreIfAllowed(nextUid);});
    }else if(nextUid){restoreIfAllowed(nextUid);}
    state.enabled=false;
    emit('identity-change');
  }

  function start(){
    if(started)return status();started=true;
    attachServiceWorkerMessages();attachBadgeSync();attachForegroundHandler();
    loadConfig().then(function(){var c=ctx();if(valid(c))restoreIfAllowed(String(c.uid));});
    if(window.HouseholdContext&&typeof HouseholdContext.subscribe==='function')contextUnsubscribe=HouseholdContext.subscribe(handleContext);
    var c=ctx();if(valid(c)&&!activeUid){activeUid=String(c.uid);restoreIfAllowed(activeUid);}
    return setStatus(supported()?'ready':'unsupported',{enabled:false,reason:null});
  }

  function stop(){
    generation++;if(contextUnsubscribe){try{contextUnsubscribe();}catch(e){}contextUnsubscribe=null;}
    if(onMessageUnsubscribe){try{onMessageUnsubscribe();}catch(e){}onMessageUnsubscribe=null;}
    started=false;activeUid=null;state.enabled=false;return emit('stopped');
  }
  function status(){return clone(Object.assign({},state,{version:VERSION,uid:activeUid,configured:!!(config&&config.configured&&config.vapidKey),supported:supported(),permission:permission(),standalone:standalone(),iosLike:iosLike()}));}

  var api={version:VERSION,start:start,stop:stop,status:status,requestEnable:requestEnable,disable:disable,loadConfig:loadConfig,isSupported:supported,isStandalone:standalone,isIOSLike:iosLike};
  window.PushRegistrationService=api;

  // Retire the legacy auto-permission helper. AuthenticatedSessionController may
  // still call this compatibility entrypoint; it now only starts the service and
  // can never request Notification permission by itself.
  window.setupPushNotifications=function(){return api.start();};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
