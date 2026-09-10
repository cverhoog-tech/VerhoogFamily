'use strict';
(function(){
  if(window.PlatformAdminFoundation)return;

  var VERSION='1.0';
  var ROLE_PERMISSIONS={
    superadmin:['platform.operations.read','platform.audit.read','platform.beta.manage','platform.support.manage','platform.admin.manage'],
    support:['platform.operations.read','platform.audit.read','platform.support.manage']
  };
  var PRIVACY={
    OPERATIONAL:'operational',
    HOUSEHOLD_CONTENT:'household-content',
    USER_PRIVATE:'user-private',
    SUPPORT_CONTENT:'support-content'
  };
  var OPERATIONAL_FIELDS={
    householdId:true,displayLabel:true,memberCount:true,health:true,schemaVersion:true,appVersion:true,runtimeVersion:true,
    createdAt:true,lastActivityAt:true,lastSyncAt:true,lastHealthyAt:true,authHealth:true,startupHealth:true,syncHealth:true,
    notificationHealth:true,moduleHealth:true,errorSummary:true,deviceContext:true,betaCohort:true,featureFlags:true,updatedAt:true
  };
  var PRIVATE_KEYS={
    tasks:true,task:true,taskTitle:true,taskText:true,groceries:true,shopping:true,shoppingItems:true,itemName:true,
    recipes:true,ingredients:true,meals:true,calendar:true,events:true,eventTitle:true,eventDescription:true,
    finance:true,transactions:true,amount:true,description:true,feed:true,posts:true,comments:true,notes:true,messages:true,
    uploads:true,photos:true,private:true,raw:true,content:true
  };

  var revision=0;
  var requestGeneration=0;
  var sessionUnsubscribe=null;
  var listeners=[];
  var state={uid:null,role:null,status:'unknown',permissions:[],resolved:false,loading:false,lastError:null,revision:0};

  function freeze(value){try{return Object.freeze(value);}catch(e){return value;}}
  function snapshot(){return freeze({uid:state.uid,role:state.role,status:state.status,permissions:state.permissions.slice(),resolved:state.resolved,loading:state.loading,isPlatformAdmin:state.status==='active'&&!!state.role,lastError:state.lastError,revision:state.revision});}
  function emit(reason){
    var snap=snapshot();
    listeners.slice().forEach(function(fn){try{fn(snap,reason||'update');}catch(e){console.warn('[PlatformAdminFoundation] subscriber failed',e);}});
    try{window.dispatchEvent(new CustomEvent('familyapp:platform-capabilities',{detail:{reason:reason||'update',capabilities:snap}}));}catch(e){}
  }
  function replaceState(next,reason){
    revision++;
    state={uid:next.uid||null,role:next.role||null,status:next.status||'none',permissions:Array.isArray(next.permissions)?next.permissions.slice():[],resolved:next.resolved===true,loading:next.loading===true,lastError:next.lastError||null,revision:revision};
    emit(reason);return snapshot();
  }
  function db(){
    try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}
  }
  function authenticatedUid(){
    var sessionController=window.AuthenticatedSessionController;
    var session=sessionController&&typeof sessionController.status==='function'?sessionController.status():null;
    if(session&&session.uid)return session.uid;
    var householdContext=window.HouseholdContext;
    var ctx=householdContext&&typeof householdContext.snapshot==='function'?householdContext.snapshot():null;
    if(ctx&&ctx.uid)return ctx.uid;
    try{return window.fbAuth&&window.fbAuth.currentUser&&window.fbAuth.currentUser.uid||null;}catch(e){return null;}
  }
  function permissionsFor(role){return ROLE_PERMISSIONS[role]?ROLE_PERMISSIONS[role].slice():[];}
  function normalizeRegistryRecord(uid,raw){
    raw=raw||{};
    var role=typeof raw.role==='string'?raw.role:null;
    var active=raw.uid===uid&&raw.status==='active'&&!!ROLE_PERMISSIONS[role];
    return {uid:uid,role:active?role:null,status:active?'active':'none',permissions:active?permissionsFor(role):[],resolved:true,loading:false,lastError:null};
  }
  function clear(reason){requestGeneration++;return replaceState({uid:null,role:null,status:'none',permissions:[],resolved:true,loading:false,lastError:null},reason||'clear');}
  function refresh(){
    var uid=authenticatedUid(),database=db(),generation=++requestGeneration;
    if(!uid)return Promise.resolve(clear('signed-out'));
    if(!database){return Promise.resolve(replaceState({uid:uid,role:null,status:'none',permissions:[],resolved:true,loading:false,lastError:'PLATFORM_ADMIN_AUTHORITY_UNAVAILABLE'},'authority-unavailable'));}
    replaceState({uid:uid,role:null,status:'checking',permissions:[],resolved:false,loading:true,lastError:null},'checking');
    return database.ref('platformAdmins/'+uid).once('value').then(function(snap){
      if(generation!==requestGeneration||uid!==authenticatedUid())return snapshot();
      return replaceState(normalizeRegistryRecord(uid,snap&&snap.val?snap.val():null),'resolved');
    }).catch(function(error){
      if(generation!==requestGeneration||uid!==authenticatedUid())return snapshot();
      return replaceState({uid:uid,role:null,status:'none',permissions:[],resolved:true,loading:false,lastError:String(error&&error.code||error&&error.message||'PLATFORM_ADMIN_AUTHORITY_FAILED')},'authority-error');
    });
  }
  function subscribe(fn){if(typeof fn!=='function')return function(){};listeners.push(fn);try{fn(snapshot(),'subscribe');}catch(e){}return function(){var i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);};}
  function has(permission){return state.status==='active'&&state.permissions.indexOf(String(permission||''))>=0;}
  function requirePermission(permission){
    if(!state.uid)throw new Error('AUTHENTICATED_USER_REQUIRED');
    if(!state.resolved)throw new Error('PLATFORM_CAPABILITIES_NOT_RESOLVED');
    if(!has(permission))throw new Error('PLATFORM_PERMISSION_DENIED:'+permission);
    return true;
  }
  function isPlatformAdmin(){return state.status==='active'&&!!state.role;}

  function classifyPath(path){
    path=String(path||'').replace(/^\/+|\/+$/g,'');
    if(path==='platformOperations'||path.indexOf('platformOperations/')===0)return PRIVACY.OPERATIONAL;
    if(path==='families'||path.indexOf('families/')===0)return PRIVACY.HOUSEHOLD_CONTENT;
    if(path==='users'||path.indexOf('users/')===0)return PRIVACY.USER_PRIVATE;
    return PRIVACY.SUPPORT_CONTENT;
  }
  function canReadByDefault(classification){return classification===PRIVACY.OPERATIONAL;}
  function safeValue(value,depth){
    if(depth>5)return null;
    if(value===null||typeof value==='string'||typeof value==='number'||typeof value==='boolean')return value;
    if(Array.isArray(value))return value.slice(0,50).map(function(item){return safeValue(item,depth+1);});
    if(typeof value!=='object')return null;
    var clean={};Object.keys(value).forEach(function(key){if(!PRIVATE_KEYS[key])clean[key]=safeValue(value[key],depth+1);});return clean;
  }
  function sanitizeOperationalRecord(raw){
    raw=raw||{};var clean={};
    Object.keys(OPERATIONAL_FIELDS).forEach(function(key){if(Object.prototype.hasOwnProperty.call(raw,key))clean[key]=safeValue(raw[key],0);});
    return clean;
  }
  function validOpaqueId(value){return /^[A-Za-z0-9_-]{6,128}$/.test(String(value||''));}
  function readHouseholdOperations(householdId){
    requirePermission('platform.operations.read');
    if(!validOpaqueId(householdId))return Promise.reject(new Error('INVALID_HOUSEHOLD_ID'));
    var database=db();if(!database)return Promise.reject(new Error('PLATFORM_OPERATIONS_UNAVAILABLE'));
    return database.ref('platformOperations/households/'+householdId).once('value').then(function(snap){return sanitizeOperationalRecord(snap&&snap.val?snap.val():null);});
  }

  function sanitizeAuditMetadata(metadata){
    metadata=metadata&&typeof metadata==='object'?metadata:{};var clean={};
    Object.keys(metadata).forEach(function(key){if(PRIVATE_KEYS[key])return;var value=metadata[key];if(value===null||typeof value==='string'||typeof value==='number'||typeof value==='boolean')clean[key]=value;});
    return clean;
  }
  function createAuditEvent(action,options){
    requirePermission('platform.support.manage');options=options||{};
    var event={version:1,actorUid:state.uid,action:String(action||'').trim(),targetHouseholdId:options.targetHouseholdId?String(options.targetHouseholdId):null,targetUid:options.targetUid?String(options.targetUid):null,reason:options.reason?String(options.reason).slice(0,240):null,metadata:sanitizeAuditMetadata(options.metadata),at:Date.now()};
    if(!event.action)throw new Error('AUDIT_ACTION_REQUIRED');
    if(event.targetHouseholdId&&!validOpaqueId(event.targetHouseholdId))throw new Error('INVALID_HOUSEHOLD_ID');
    return freeze(event);
  }

  function bindSession(){
    if(sessionUnsubscribe)return true;
    var controller=window.AuthenticatedSessionController;if(!controller||typeof controller.subscribe!=='function')return false;
    var lastUid=null;
    sessionUnsubscribe=controller.subscribe(function(session){var uid=session&&session.uid||null;if(uid===lastUid)return;lastUid=uid;if(uid)refresh();else clear('session-signed-out');});
    return true;
  }
  function stop(){requestGeneration++;if(sessionUnsubscribe){try{sessionUnsubscribe();}catch(e){}sessionUnsubscribe=null;}clear('stopped');}

  window.PlatformAdminFoundation={
    version:VERSION,snapshot:snapshot,subscribe:subscribe,refresh:refresh,has:has,requirePermission:requirePermission,isPlatformAdmin:isPlatformAdmin,
    readHouseholdOperations:readHouseholdOperations,
    privacy:freeze({classes:freeze(PRIVACY),classifyPath:classifyPath,canReadByDefault:canReadByDefault,sanitizeOperationalRecord:sanitizeOperationalRecord}),
    audit:freeze({createEvent:createAuditEvent,persistence:'server-only'}),stop:stop
  };

  // Client capability/UI helper only. The actual security boundary is Firebase
  // Rules plus privileged server/admin tooling. Platform status never grants a
  // generic read of families/{householdId} or users/{uid}.
  if(!bindSession())window.addEventListener('familyapp:session-state',function(){refresh();});
})();
