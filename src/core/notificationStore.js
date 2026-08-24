'use strict';
// ============================================================
// NOTIFICATION STORE v2.0.0 — STEP 10 canonical facade
//
// Persistence/listener authority: NotificationHouseholdRepository.
// Identity authority: HouseholdContext.
// Domain producers publish deterministic event keys; presentation and push
// delivery remain downstream concerns.
// ============================================================
(function(){
  if(window.NotificationStore)return;

  var VERSION='2.0.0';
  var records={};
  var listeners=[];
  var repositoryUnsubscribe=null;
  var activeIdentity=null;
  var readySnapshotSeen=false;
  var subscriptionStartedAt=0;

  var TYPES={
    'system.message':true,
    'task.help.requested':true,
    'task.help.joined':true,
    'task.swap.requested':true,
    'task.swap.accepted':true,
    'task.swap.declined':true,
    'partyQuest.created':true,
    'partyQuest.invitation.sent':true,
    'partyQuest.joined':true,
    'partyQuest.completed':true,
    'finance.savings.updated':true
  };

  function now(){return Date.now();}
  function clone(v){if(v===undefined)return undefined;try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function uid(){var c=context();return c&&c.ready&&c.uid||null;}
  function repo(){return window.NotificationHouseholdRepository||null;}
  function actor(){var c=context();return{uid:c&&c.uid||null,name:window.myName||'Gezinslid'};}
  function normalizeMap(value){
    var out={};if(!value)return out;
    if(Array.isArray(value)){value.forEach(function(item){if(item&&item.id)out[String(item.id)]=clone(item);});return out;}
    Object.keys(value).forEach(function(key){if(value[key])out[String(key)]=Object.assign({id:String(key)},clone(value[key]));});
    return out;
  }
  function audienceSelf(){var id=uid();return{kind:'uids',uids:id?[String(id)]:[]};}
  function audienceHousehold(){return{kind:'household'};}
  function audienceUids(ids){return{kind:'uids',uids:Array.from(new Set((ids||[]).filter(Boolean).map(String)))};}
  function canSee(event){
    var id=uid();if(!event||!id)return false;
    if(event.dismissedBy&&event.dismissedBy[id])return false;
    var a=event.audience||{kind:'household'};
    if(a.kind==='household')return true;
    if(a.kind==='uids')return Array.isArray(a.uids)&&a.uids.map(String).indexOf(String(id))>-1;
    return false;
  }
  function sortedVisible(){return Object.keys(records).map(function(k){return records[k];}).filter(canSee).sort(function(a,b){var d=(Number(b.createdAt)||0)-(Number(a.createdAt)||0);if(d)return d;return String(b.id||'').localeCompare(String(a.id||''));});}
  function isRead(event){var id=uid();return !!(id&&event&&event.readBy&&event.readBy[id]);}
  function unreadCount(){return sortedVisible().filter(function(e){return!isRead(e);}).length;}
  function updateUnreadIndicator(){var dot=document.getElementById('notif-dot');if(dot)dot.style.display=unreadCount()?'block':'none';}
  function emit(meta){
    updateUnreadIndicator();
    var list=sortedVisible();
    listeners.slice().forEach(function(fn){try{fn(clone(list),clone(meta||{}));}catch(e){console.error('[NotificationStore listener]',e);}});
    try{window.dispatchEvent(new CustomEvent('familyapp:notifications-changed',{detail:{items:clone(list),meta:clone(meta||{}),unread:unreadCount()}}));}catch(e){}
  }
  function identityKey(meta){return meta&&meta.uid&&meta.householdId?[String(meta.uid),String(meta.householdId),String(meta.revision||0)].join('|'):null;}
  function detectIncoming(previous,allowLive){
    var me=uid(),fresh=[];
    if(!me||!allowLive)return fresh;
    Object.keys(records).forEach(function(id){
      var e=records[id];
      if(previous[id]||!canSee(e)||isRead(e))return;
      if(e.actor&&String(e.actor.uid||'')===String(me))return;
      var created=Number(e.createdAt)||0;
      if(created&&subscriptionStartedAt&&created<subscriptionStartedAt-5000)return;
      fresh.push(e);
    });
    return fresh.sort(function(a,b){return(Number(a.createdAt)||0)-(Number(b.createdAt)||0);});
  }

  function applyRepository(value,meta){
    meta=meta||{};
    var key=identityKey(meta);
    if(key!==activeIdentity){
      activeIdentity=key;
      records={};
      readySnapshotSeen=false;
      subscriptionStartedAt=key?now():0;
    }
    var previous=records;
    records=normalizeMap(value);
    var isFirstReady=!!(meta.ready&&!readySnapshotSeen);
    var incoming=detectIncoming(previous,!!(meta.ready&&readySnapshotSeen));
    if(meta.ready)readySnapshotSeen=true;
    emit({source:meta.source||'repository',ready:!!meta.ready,incoming:clone(incoming),initial:isFirstReady,uid:meta.uid||null,householdId:meta.householdId||null,revision:meta.revision||null});
    incoming.forEach(function(event){try{window.dispatchEvent(new CustomEvent('familyapp:notification-received',{detail:{event:clone(event)}}));}catch(e){}});
  }

  function ensureSubscription(){
    var r=repo();if(!r)return false;
    if(typeof r.start==='function')r.start();
    if(repositoryUnsubscribe)return true;
    if(typeof r.subscribe!=='function')return false;
    repositoryUnsubscribe=r.subscribe(applyRepository);
    return true;
  }

  function validate(input,eventKey){
    if(!input||typeof input!=='object')throw new Error('Notification event ontbreekt');
    if(!eventKey||!String(eventKey).trim())throw new Error('NOTIFICATION_EVENT_KEY_REQUIRED');
    if(!input.type||!TYPES[input.type])throw new Error('Onbekend notification event type: '+String(input.type||''));
    if(!input.title)throw new Error('Notification title ontbreekt');
  }

  function normalizeForPublish(eventKey,input){
    validate(input,eventKey);
    var payload=clone(input)||{};
    payload.eventKey=String(eventKey);
    payload.schemaVersion=Number(payload.schemaVersion||1)||1;
    payload.title=String(payload.title);
    payload.body=String(payload.body||'');
    payload.icon=payload.icon||'bell';
    payload.bg=payload.bg||'#ede9fe';
    payload.tone=payload.tone||'default';
    payload.actor=payload.actor||actor();
    payload.audience=payload.audience||audienceSelf();
    payload.entity=payload.entity||null;
    payload.data=payload.data&&typeof payload.data==='object'?payload.data:{};
    payload.channels=Array.isArray(payload.channels)?payload.channels.slice():['inApp'];
    payload.createdAt=Number(payload.createdAt)||now();
    payload.readBy=payload.readBy&&typeof payload.readBy==='object'?payload.readBy:{};
    payload.dismissedBy=payload.dismissedBy&&typeof payload.dismissedBy==='object'?payload.dismissedBy:{};
    return payload;
  }

  function publishOnce(eventKey,input){
    var r=repo();if(!r||typeof r.publishOnce!=='function')return Promise.reject(new Error('NotificationHouseholdRepository niet beschikbaar'));
    ensureSubscription();
    var payload=normalizeForPublish(eventKey,input);
    return r.publishOnce(eventKey,payload).then(function(result){return result&&result.event?clone(result.event):null;});
  }

  // Compatibility entry points remain, but random/unkeyed notification creation
  // is deliberately forbidden. Old callers must supply input.eventKey or migrate
  // to the explicit *Once APIs below.
  function publish(input){input=input||{};return publishOnce(input.eventKey,input);}
  function publishSelf(type,payload){payload=Object.assign({},payload||{},{type:type,audience:audienceSelf()});return publish(payload);}
  function publishHousehold(type,payload){payload=Object.assign({},payload||{},{type:type,audience:audienceHousehold()});return publish(payload);}
  function publishToUids(type,uids,payload){payload=Object.assign({},payload||{},{type:type,audience:audienceUids(uids)});return publish(payload);}
  function publishSelfOnce(eventKey,type,payload){payload=Object.assign({},payload||{},{type:type,audience:audienceSelf()});return publishOnce(eventKey,payload);}
  function publishHouseholdOnce(eventKey,type,payload){payload=Object.assign({},payload||{},{type:type,audience:audienceHousehold()});return publishOnce(eventKey,payload);}
  function publishToUidsOnce(eventKey,type,uids,payload){payload=Object.assign({},payload||{},{type:type,audience:audienceUids(uids)});return publishOnce(eventKey,payload);}

  function list(){ensureSubscription();return sortedVisible().map(clone);}
  function markRead(id){var r=repo();if(!r||typeof r.markRead!=='function')return Promise.resolve(false);return r.markRead(id).then(function(){return true;});}
  function markAllRead(){var unread=sortedVisible().filter(function(e){return!isRead(e);});return unread.reduce(function(chain,e){return chain.then(function(){return markRead(e.id);});},Promise.resolve()).then(function(){return unread.length;});}
  function dismiss(id){var r=repo();if(!r||typeof r.dismiss!=='function')return Promise.resolve(false);return r.dismiss(id).then(function(){return true;});}
  function clearVisible(){var visible=sortedVisible();return visible.reduce(function(chain,e){return chain.then(function(){return dismiss(e.id);});},Promise.resolve()).then(function(){return visible.length;});}
  function subscribe(fn){if(typeof fn!=='function')return function(){};listeners.push(fn);ensureSubscription();try{fn(list(),{source:'subscribe',ready:!!(repo()&&repo().status&&repo().status().ready)});}catch(e){}return function(){var i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);};}
  function registerType(type){if(type&&typeof type==='string')TYPES[type]=true;}
  function stop(){if(repositoryUnsubscribe){try{repositoryUnsubscribe();}catch(e){}repositoryUnsubscribe=null;}activeIdentity=null;readySnapshotSeen=false;subscriptionStartedAt=0;records={};emit({source:'stopped',ready:false});}
  function status(){var c=context(),r=repo(),rs=r&&r.status?r.status():{};return{version:VERSION,uid:c&&c.uid||null,householdId:c&&c.householdId||null,count:Object.keys(records).length,visible:sortedVisible().length,unread:unreadCount(),subscribed:!!repositoryUnsubscribe,repositoryReady:!!rs.ready,repositoryVersion:rs.version||null};}

  window.NotificationStore={
    version:VERSION,
    types:TYPES,
    status:status,
    ensureSubscription:ensureSubscription,
    stop:stop,
    registerType:registerType,
    publish:publish,
    publishOnce:publishOnce,
    publishSelf:publishSelf,
    publishHousehold:publishHousehold,
    publishToUids:publishToUids,
    publishSelfOnce:publishSelfOnce,
    publishHouseholdOnce:publishHouseholdOnce,
    publishToUidsOnce:publishToUidsOnce,
    list:list,
    unreadCount:unreadCount,
    markRead:markRead,
    markAllRead:markAllRead,
    dismiss:dismiss,
    clearVisible:clearVisible,
    subscribe:subscribe,
    isRead:isRead,
    audienceSelf:audienceSelf,
    audienceHousehold:audienceHousehold,
    audienceUids:audienceUids
  };

  ensureSubscription();
})();
