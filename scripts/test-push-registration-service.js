'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const source=fs.readFileSync('src/core/pushRegistrationService.js','utf8');
function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));}
function tick(){return new Promise(resolve=>setTimeout(resolve,0));}

(async function(){
  let current={ready:true,uid:'userA',householdId:'houseA',revision:1};
  const contextListeners=[];
  const events=[];
  const storage={};
  const registryWrites=[];
  const registryDisables=[];
  let permission='default';
  let permissionRequests=0;
  let getTokenCalls=0;
  let deleteTokenCalls=0;
  let unsubscribeCalls=0;
  let onMessageHandler=null;

  const HouseholdContext={
    snapshot(){return clone(current);},
    subscribe(fn){contextListeners.push(fn);fn(clone(current),'subscribe');return()=>{const i=contextListeners.indexOf(fn);if(i>=0)contextListeners.splice(i,1);};}
  };
  function switchContext(next){current=clone(next);contextListeners.slice().forEach(fn=>fn(clone(current),'test-switch'));}

  const localStorage={getItem(k){return Object.prototype.hasOwnProperty.call(storage,k)?storage[k]:null;},setItem(k,v){storage[k]=String(v);},removeItem(k){delete storage[k];}};
  const Notification={
    get permission(){return permission;},
    requestPermission(){permissionRequests++;permission='granted';return Promise.resolve('granted');}
  };
  const registration={
    scope:'https://app.test/',
    pushManager:{getSubscription(){return Promise.resolve({unsubscribe(){unsubscribeCalls++;return Promise.resolve(true);}});}}
  };
  const serviceWorkerListeners={};
  const navigator={
    userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',platform:'Win32',maxTouchPoints:0,
    serviceWorker:{
      register(path,opts){assert.strictEqual(path,'/firebase-messaging-sw.js');assert.strictEqual(opts.scope,'/');return Promise.resolve(registration);},
      getRegistration(){return Promise.resolve(registration);},
      addEventListener(type,fn){serviceWorkerListeners[type]=fn;}
    },
    setAppBadge(){return Promise.resolve();},clearAppBadge(){return Promise.resolve();}
  };
  const fbMsg={
    getToken(options){getTokenCalls++;assert.strictEqual(options.vapidKey,'PUBLIC_VAPID');assert.strictEqual(options.serviceWorkerRegistration,registration);return Promise.resolve('token-'+current.uid+'-'+getTokenCalls);},
    deleteToken(){deleteTokenCalls++;return Promise.resolve(true);},
    onMessage(fn){onMessageHandler=fn;return()=>{onMessageHandler=null;};}
  };
  const PushDeviceRegistry={
    getDeviceId(){return'device1';},platform(){return'web-windows';},
    upsert(value){registryWrites.push({uid:current.uid,value:clone(value)});return Promise.resolve(value);},
    disable(reason){registryDisables.push({uid:current.uid,reason});return Promise.resolve(true);}
  };
  const windowListeners={};
  const window={
    HouseholdContext,PushDeviceRegistry,fbMsg,Notification,navigator,localStorage,isSecureContext:true,
    firebase:{messaging:{isSupported(){return true;}}},
    matchMedia(){return{matches:false};},
    fetch(){return Promise.resolve({ok:true,json(){return Promise.resolve({version:'1.1.0',configured:true,vapidConfigured:true,senderConfigured:true,vapidKey:'PUBLIC_VAPID',serviceWorkerPath:'/firebase-messaging-sw.js'});}});},
    addEventListener(type,fn){(windowListeners[type]||(windowListeners[type]=[])).push(fn);},
    dispatchEvent(event){events.push(event);(windowListeners[event.type]||[]).slice().forEach(fn=>fn(event));}
  };
  function CustomEvent(type,opts){this.type=type;this.detail=opts&&opts.detail;}
  const document={readyState:'loading',addEventListener(){}};
  const sandbox={window,HouseholdContext,PushDeviceRegistry,fbMsg,Notification,navigator,localStorage,document,CustomEvent,console,setTimeout,clearTimeout,Promise,Date,Math,JSON,Object,String,Number,Array};
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:'pushRegistrationService.js'});

  const service=window.PushRegistrationService;
  assert.ok(service);
  assert.strictEqual(service.version,'1.1.0');
  assert.strictEqual(typeof window.setupPushNotifications,'function');

  // Legacy startup entrypoint is safe: it may initialize/configure the service,
  // but it may NEVER prompt for notification permission.
  window.setupPushNotifications();
  await tick();await tick();
  assert.strictEqual(permissionRequests,0,'startup must not request Notification permission');
  assert.strictEqual(getTokenCalls,0,'startup with no prior opt-in must not create a token');
  assert.strictEqual(service.status().configured,true);
  assert.strictEqual(service.status().vapidConfigured,true);
  assert.strictEqual(service.status().senderConfigured,true);

  // Explicit user action requests permission and registers exactly this UID/device.
  const enabled=await service.requestEnable();
  assert.strictEqual(permissionRequests,1);
  assert.strictEqual(getTokenCalls,1);
  assert.strictEqual(enabled.enabled,true);
  assert.strictEqual(registryWrites.length,1);
  assert.strictEqual(registryWrites[0].uid,'userA');
  assert.strictEqual(registryWrites[0].value.token,'token-userA-1');
  assert.strictEqual(storage['familyapp_push_optin_v1:userA'],'1');
  assert.ok(onMessageHandler,'foreground FCM handler must be attached after registration');

  // A foreground FCM copy is delivery telemetry only; it must not create a
  // competing canonical NotificationStore event.
  onMessageHandler({data:{notificationId:'evt1'}});
  assert.ok(events.some(e=>e.type==='familyapp:push-foreground'));

  // Same-household account switch invalidates the browser-level transport. B has
  // no local opt-in, so no token is silently registered and no permission prompt.
  switchContext({ready:true,uid:'userB',householdId:'houseA',revision:2});
  await tick();await tick();await tick();
  assert.ok(deleteTokenCalls>=1,'account switch must invalidate prior FCM token');
  assert.ok(unsubscribeCalls>=1,'account switch must unsubscribe browser Push subscription as fallback');
  assert.strictEqual(permissionRequests,1,'account switch may not prompt new user automatically');
  assert.strictEqual(getTokenCalls,1,'new account without opt-in may not inherit push registration');
  assert.ok(!storage['familyapp_push_optin_v1:userB']);

  // B can explicitly opt in and receives a B-owned device registration.
  await service.requestEnable();
  assert.strictEqual(permissionRequests,2,'explicit B button tap may request/confirm permission flow');
  assert.strictEqual(getTokenCalls,2);
  assert.strictEqual(registryWrites[1].uid,'userB');
  assert.strictEqual(registryWrites[1].value.token,'token-userB-2');

  // User-controlled disable marks current registry disabled before invalidating
  // the browser transport and clears the local per-account opt-in marker.
  const deletedBeforeDisable=deleteTokenCalls;
  await service.disable('user-disabled');
  assert.strictEqual(registryDisables.length,1);
  assert.strictEqual(registryDisables[0].uid,'userB');
  assert.strictEqual(registryDisables[0].reason,'user-disabled');
  assert.ok(deleteTokenCalls>deletedBeforeDisable);
  assert.ok(!storage['familyapp_push_optin_v1:userB']);
  assert.strictEqual(service.status().enabled,false);

  // iPhone browser tab (not Home Screen) must reject enablement before asking
  // permission. This preserves Apple's user-gesture/Home Screen requirement.
  navigator.userAgent='Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X)';navigator.platform='iPhone';navigator.maxTouchPoints=5;
  window.matchMedia=function(){return{matches:false};};
  const beforeIosPrompt=permissionRequests;
  await assert.rejects(()=>service.requestEnable(),/PUSH_IOS_HOME_SCREEN_REQUIRED/);
  assert.strictEqual(permissionRequests,beforeIosPrompt,'non-installed iPhone flow must not show a doomed permission prompt');

  // Readiness checks must run before permission. The static order guard prevents
  // future refactors from prompting before VAPID/sender readiness is known.
  assert.ok(source.includes('PUSH_SENDER_NOT_CONFIGURED'));
  assert.ok(source.indexOf('assertDeliveryConfig();')<source.indexOf('Notification.requestPermission()'));

  console.log('STEP 10 Web Push readiness/explicit opt-in/account-switch contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});