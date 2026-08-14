'use strict';
// ============================================================
// NOTIFICATION STORE v1.1.0
// Single household-scoped source of truth for in-app notification events.
// Persistence is owned by FamilyDataStore at families/{householdId}/shared/notifications.
// Domain modules publish typed events; presentation and delivery are separate concerns.
// ============================================================
(function(){
  if(window.NotificationStore)return;

  var VERSION='1.1.0';
  var COLLECTION='notifications';
  var records={};
  var listeners=[];
  var unsubscribe=null;
  var subscribedFamilyId=null;
  var subscriptionStartedAt=0;
  var firstSnapshotForSubscription=true;

  var TYPES={
    'system.message':true,
    'task.help.requested':true,
    'task.help.joined':true,
    'task.swap.requested':true,
    'task.swap.accepted':true,
    'task.swap.declined':true,
    'partyQuest.created':true,
    'partyQuest.joined':true,
    'partyQuest.completed':true,
    'finance.savings.updated':true
  };

  function now(){return Date.now();}
  function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
  function authUser(){try{return window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||null;}catch(e){return null;}}
  function uid(){var u=authUser();return u&&u.uid||null;}
  function familyId(){return window.fbFamilyId||null;}
  function actor(){var u=authUser();return{uid:u&&u.uid||null,name:window.myName||(u&&u.displayName)||'Gezinslid'};}
  function normalizeMap(value){var out={};if(!value)return out;if(Array.isArray(value)){value.forEach(function(item){if(item&&item.id)out[item.id]=item;});return out;}Object.keys(value).forEach(function(key){if(value[key])out[key]=Object.assign({id:key},value[key]);});return out;}
  function audienceSelf(){var id=uid();return{kind:'uids',uids:id?[id]:[]};}
  function audienceHousehold(){return{kind:'household'};}
  function audienceUids(ids){return{kind:'uids',uids:Array.from(new Set((ids||[]).filter(Boolean).map(String)))};}
  function canSee(event){var id=uid();if(!event||!id)return false;if(event.dismissedBy&&event.dismissedBy[id])return false;var a=event.audience||{kind:'household'};if(a.kind==='household')return true;if(a.kind==='uids')return Array.isArray(a.uids)&&a.uids.map(String).indexOf(String(id))>-1;return false;}
  function sortedVisible(){return Object.keys(records).map(function(k){return records[k];}).filter(canSee).sort(function(a,b){var d=(Number(b.createdAt)||0)-(Number(a.createdAt)||0);if(d)return d;return String(b.id||'').localeCompare(String(a.id||''));});}
  function isRead(event){var id=uid();return !!(id&&event&&event.readBy&&event.readBy[id]);}
  function formatRelative(ts){var diff=Math.max(0,now()-(Number(ts)||now()));if(diff<60000)return'Zojuist';if(diff<3600000)return Math.max(1,Math.floor(diff/60000))+' min geleden';if(diff<86400000)return Math.floor(diff/3600000)+' uur geleden';if(diff<604800000)return Math.floor(diff/86400000)+' d geleden';try{return new Date(ts).toLocaleDateString('nl-NL',{day:'numeric',month:'short'});}catch(e){return'';}}
  function legacyProjection(event){return{id:event.id,icon:event.icon||'🔔',bg:event.bg||'#ede9fe',title:event.title||'Melding',body:event.body||'',time:formatRelative(event.createdAt),read:isRead(event),type:event.type,createdAt:event.createdAt,actor:event.actor||null,entity:event.entity||null};}
  function mirrorLegacy(){window.notifData=sortedVisible().map(legacyProjection);var dot=document.getElementById('notif-dot');if(dot)dot.style.display=unreadCount()?'block':'none';}
  function emit(meta){mirrorLegacy();var list=sortedVisible();listeners.slice().forEach(function(fn){try{fn(list,meta||{});}catch(e){console.error('[NotificationStore listener]',e);}});try{window.dispatchEvent(new CustomEvent('familyapp:notifications-changed',{detail:{items:list,meta:meta||{},unread:unreadCount()}}));}catch(e){}}
  function detectIncoming(previous,allowLive){var me=uid(),fresh=[];if(!me||!allowLive)return fresh;Object.keys(records).forEach(function(id){var e=records[id];if(previous[id]||!canSee(e)||isRead(e))return;if(e.actor&&String(e.actor.uid||'')===String(me))return;var created=Number(e.createdAt)||0;if(created&&created<subscriptionStartedAt-5000)return;fresh.push(e);});return fresh.sort(function(a,b){return(Number(a.createdAt)||0)-(Number(b.createdAt)||0);});}

  function detachSubscription(){if(unsubscribe){try{unsubscribe();}catch(e){}}unsubscribe=null;subscribedFamilyId=null;subscriptionStartedAt=0;firstSnapshotForSubscription=true;records={};}
  function ensureSubscription(){
    if(!window.FamilyDataStore)return false;
    var f=familyId(),me=uid();if(!f||!me)return false;
    if(unsubscribe&&subscribedFamilyId===f)return true;
    if(unsubscribe)detachSubscription();
    subscribedFamilyId=f;
    subscriptionStartedAt=now();
    firstSnapshotForSubscription=true;
    unsubscribe=FamilyDataStore.subscribeShared(COLLECTION,function(value,meta){
      var previous=records;
      records=normalizeMap(value);
      var isInitial=firstSnapshotForSubscription;
      firstSnapshotForSubscription=false;
      var incoming=detectIncoming(previous,!isInitial);
      emit({source:meta&&meta.source||'shared',incoming:incoming,initial:isInitial});
      incoming.forEach(function(event){try{window.dispatchEvent(new CustomEvent('familyapp:notification-received',{detail:{event:event}}));}catch(e){}});
    },{});
    return true;
  }
  function validate(input){if(!input||typeof input!=='object')throw new Error('Notification event ontbreekt');if(!input.type||!TYPES[input.type])throw new Error('Onbekend notification event type: '+String(input.type||''));if(!input.title)throw new Error('Notification title ontbreekt');}
  function publish(input){
    validate(input);if(!window.FamilyDataStore)return Promise.reject(new Error('FamilyDataStore niet beschikbaar'));ensureSubscription();
    var id=input.id||FamilyDataStore.makeId('evt');
    var event={id:id,schemaVersion:1,type:input.type,title:String(input.title),body:String(input.body||''),icon:input.icon||'🔔',bg:input.bg||'#ede9fe',tone:input.tone||'default',actor:input.actor||actor(),audience:input.audience||audienceSelf(),entity:input.entity||null,data:input.data||{},channels:Array.isArray(input.channels)?input.channels.slice():['inApp'],createdAt:Number(input.createdAt)||now(),updatedAt:now(),readBy:input.readBy||{},dismissedBy:input.dismissedBy||{}};
    records[id]=event;emit({source:'local-publish',event:event});
    return FamilyDataStore.writeSharedRecord(COLLECTION,id,event).then(function(){return clone(event);});
  }
  function publishSelf(type,payload){payload=Object.assign({},payload||{},{type:type,audience:audienceSelf()});return publish(payload);}
  function publishHousehold(type,payload){payload=Object.assign({},payload||{},{type:type,audience:audienceHousehold()});return publish(payload);}
  function publishToUids(type,uids,payload){payload=Object.assign({},payload||{},{type:type,audience:audienceUids(uids)});return publish(payload);}
  function legacy(icon,bg,title,body){return publishSelf('system.message',{icon:icon||'🔔',bg:bg||'#ede9fe',title:title||'Melding',body:body||'',data:{legacy:true}});}
  function list(){ensureSubscription();return sortedVisible().map(clone);}
  function unreadCount(){return sortedVisible().filter(function(e){return!isRead(e);}).length;}
  function markRead(id){var me=uid();if(!me||!records[id]||!window.FamilyDataStore)return Promise.resolve(false);records[id].readBy=Object.assign({},records[id].readBy||{});records[id].readBy[me]=now();records[id].updatedAt=now();emit({source:'local-read',id:id});return FamilyDataStore.writeSharedPath(COLLECTION,[id,'readBy',me],records[id].readBy[me]).then(function(){return true;});}
  function markAllRead(){var unread=sortedVisible().filter(function(e){return!isRead(e);});return unread.reduce(function(chain,e){return chain.then(function(){return markRead(e.id);});},Promise.resolve()).then(function(){return unread.length;});}
  function dismiss(id){var me=uid();if(!me||!records[id]||!window.FamilyDataStore)return Promise.resolve(false);records[id].dismissedBy=Object.assign({},records[id].dismissedBy||{});records[id].dismissedBy[me]=now();records[id].updatedAt=now();emit({source:'local-dismiss',id:id});return FamilyDataStore.writeSharedPath(COLLECTION,[id,'dismissedBy',me],records[id].dismissedBy[me]).then(function(){return true;});}
  function clearVisible(){var visible=sortedVisible();return visible.reduce(function(chain,e){return chain.then(function(){return dismiss(e.id);});},Promise.resolve()).then(function(){return visible.length;});}
  function subscribe(fn){if(typeof fn!=='function')return function(){};listeners.push(fn);ensureSubscription();fn(list(),{source:'subscribe'});return function(){listeners=listeners.filter(function(x){return x!==fn;});};}
  function registerType(type){if(type&&typeof type==='string')TYPES[type]=true;}
  function status(){return{version:VERSION,familyId:familyId(),uid:uid(),subscribedFamilyId:subscribedFamilyId,count:Object.keys(records).length,visible:sortedVisible().length,unread:unreadCount(),subscribed:!!unsubscribe};}

  window.NotificationStore={version:VERSION,types:TYPES,status:status,ensureSubscription:ensureSubscription,registerType:registerType,publish:publish,publishSelf:publishSelf,publishHousehold:publishHousehold,publishToUids:publishToUids,legacy:legacy,list:list,unreadCount:unreadCount,markRead:markRead,markAllRead:markAllRead,dismiss:dismiss,clearVisible:clearVisible,subscribe:subscribe,isRead:isRead};

  function identityReady(){ensureSubscription();}
  window.addEventListener('familyapp:household-members-updated',identityReady);
  window.addEventListener('familyapp:household-changed',identityReady);
  window.addEventListener('familyapp:household-identity-synced',identityReady);
  window.addEventListener('familyapp:data:shared:notifications',identityReady);
  window.addEventListener('focus',identityReady);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',identityReady);else identityReady();
  window.addEventListener('load',identityReady);

  // Runtime companions are separate modules with separate responsibilities.
  function loadCompanion(id,src,done){
    if(document.getElementById(id)){if(done)done();return;}
    var s=document.createElement('script');s.id=id;s.src=src;s.async=false;s.onload=function(){if(done)done();};s.onerror=function(){console.error('[NotificationStore] failed to load',src);if(done)done();};document.head.appendChild(s);
  }
  loadCompanion('notification-events-runtime','src/core/notificationEvents.js?v=2',function(){
    loadCompanion('notification-delivery-runtime','src/core/notificationDelivery.js?v=3');
  });
})();