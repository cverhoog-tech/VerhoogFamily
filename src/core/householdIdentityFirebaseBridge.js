'use strict';
(function(){
  if(window.__householdIdentityFirebaseBridgeV4) return;
  window.__householdIdentityFirebaseBridgeV4 = true;

  var membersRef=null,presenceRef=null,membersCb=null,presenceCb=null;
  var currentHouseholdId=null,currentUid=null,lastMembers={},lastPresence={};
  var subscribers=[],contextUnsubscribe=null,migrationInFlight=false;

  function db(){try{return window.fbDb||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
  function initials(name){return String(name||'?').split(/\s+/).filter(Boolean).map(function(p){return p[0];}).join('').slice(0,2).toUpperCase()||'?';}
  function context(){return window.HouseholdContext&&typeof HouseholdContext.snapshot==='function'?HouseholdContext.snapshot():{uid:null,householdId:null,ready:false};}

  function detach(){
    try{if(membersRef&&membersCb)membersRef.off('value',membersCb);}catch(e){}
    try{if(presenceRef&&presenceCb)presenceRef.off('value',presenceCb);}catch(e){}
    membersRef=null;presenceRef=null;membersCb=null;presenceCb=null;
    currentHouseholdId=null;currentUid=null;lastMembers={};lastPresence={};
  }

  function normalizedMembers(){
    return Object.keys(lastMembers||{}).map(function(uid){
      var raw=lastMembers[uid];
      if(!raw||raw.status==='removed'||raw.status==='inactive')return null;
      var presence=(lastPresence&&lastPresence[uid])||{};
      var name=raw.name||raw.displayName||(raw.email?raw.email.split('@')[0]:'Gezinslid');
      return {id:uid,uid:uid,accountId:uid,authUid:uid,name:name,displayName:raw.displayName||name,initials:raw.initials||initials(name),avatar:raw.avatar||raw.avatarUrl||raw.photoURL||'',role:raw.role||'member',status:raw.status||'active',onlineStatus:presence.online?'online':'offline',online:presence.online===true,lastSeen:presence.lastSeen||null,area:presence.area||'',joinedAt:raw.joinedAt||null,createdAt:raw.joinedAt||raw.createdAt||null,updatedAt:raw.updatedAt||presence.lastSeen||null};
    }).filter(Boolean).sort(function(a,b){var aj=Number(a.joinedAt||0),bj=Number(b.joinedAt||0);if(aj&&bj&&aj!==bj)return aj-bj;return String(a.name).localeCompare(String(b.name),'nl');});
  }

  function notify(members){subscribers.slice().forEach(function(fn){try{fn(members.slice());}catch(e){console.warn('[HouseholdIdentityFirebaseBridge] subscriber failed',e);}});}

  function apply(){
    var members=normalizedMembers();
    var ctx=context();
    if(window.HouseholdIdentity&&typeof HouseholdIdentity.saveMembers==='function'&&members.length){
      try{HouseholdIdentity.saveMembers(members);}catch(e){}
      if(ctx.uid&&typeof HouseholdIdentity.setActiveMember==='function'){
        var mine=members.find(function(m){return m.uid===ctx.uid;});
        if(mine){
          try{HouseholdIdentity.setActiveMember(mine.uid);}catch(e){}
          try{window.myName=mine.name;if(typeof myName!=='undefined')myName=mine.name;window.myInitials=mine.initials;if(typeof myInitials!=='undefined')myInitials=mine.initials;}catch(e){}
        }
      }
    }
    notify(members);
    try{window.dispatchEvent(new CustomEvent('familyapp:household-identity-synced',{detail:{householdId:currentHouseholdId,members:members}}));}catch(e){}
    return members.length>0;
  }

  function legacyOwnProfile(){var r={};try{var n=localStorage.getItem('familyapp-profile-name-v1'),a=localStorage.getItem('familyapp-current-user-avatar-v1');if(n&&n.trim())r.name=n.trim();if(a)r.avatar=a;}catch(e){}return r;}
  function migrationKey(hid,uid){return 'familyapp-firebase-member-profile-migrated-v2:'+hid+':'+uid;}
  function updateOwnMemberProfile(patch){
    var d=db(),ctx=context();if(!d||!ctx.ready||!patch)return Promise.resolve(false);
    var clean={};if(typeof patch.name==='string'&&patch.name.trim())clean.name=patch.name.trim();if(typeof patch.avatar==='string'&&patch.avatar)clean.avatar=patch.avatar;if(!Object.keys(clean).length)return Promise.resolve(false);
    clean.updatedAt=(window.firebase&&firebase.database&&firebase.database.ServerValue)?firebase.database.ServerValue.TIMESTAMP:Date.now();
    return d.ref('families/'+ctx.householdId+'/members/'+ctx.uid).update(clean).then(function(){return true;});
  }
  function migrateOwnLegacyProfileOnce(){
    var ctx=context();if(!ctx.ready||migrationInFlight)return;var key=migrationKey(ctx.householdId,ctx.uid);try{if(localStorage.getItem(key)==='1')return;}catch(e){}
    var legacy=legacyOwnProfile(),server=(lastMembers&&lastMembers[ctx.uid])||{},patch={};
    if(!server.name&&legacy.name)patch.name=legacy.name;if(!(server.avatar||server.avatarUrl||server.photoURL)&&legacy.avatar)patch.avatar=legacy.avatar;
    if(!Object.keys(patch).length){try{localStorage.setItem(key,'1');}catch(e){}return;}
    migrationInFlight=true;updateOwnMemberProfile(patch).then(function(){try{localStorage.setItem(key,'1');}catch(e){}}).catch(function(err){console.warn('[HouseholdIdentityFirebaseBridge] legacy profile migration failed',err);}).finally(function(){migrationInFlight=false;});
  }

  function attach(ctx){
    var d=db();if(!d||!ctx||!ctx.ready||!ctx.householdId||!ctx.uid){detach();return false;}
    if(currentHouseholdId===ctx.householdId&&currentUid===ctx.uid&&membersRef&&presenceRef)return true;
    detach();currentHouseholdId=ctx.householdId;currentUid=ctx.uid;
    membersRef=d.ref('families/'+ctx.householdId+'/members');presenceRef=d.ref('families/'+ctx.householdId+'/presence');
    membersCb=function(snapshot){lastMembers=snapshot.val()||{};apply();migrateOwnLegacyProfileOnce();};
    presenceCb=function(snapshot){lastPresence=snapshot.val()||{};apply();};
    membersRef.on('value',membersCb);presenceRef.on('value',presenceCb);return true;
  }

  function sync(){return attach(context());}
  function subscribe(fn){if(typeof fn!=='function')return function(){};subscribers.push(fn);try{fn(normalizedMembers());}catch(e){}sync();return function(){var i=subscribers.indexOf(fn);if(i>=0)subscribers.splice(i,1);};}

  function bindContext(){
    if(contextUnsubscribe)return true;
    if(!window.HouseholdContext||typeof HouseholdContext.subscribe!=='function')return false;
    contextUnsubscribe=HouseholdContext.subscribe(function(ctx){attach(ctx);});
    return true;
  }

  window.addEventListener('familyapp:avatar-updated',function(e){var detail=(e&&e.detail)||{},url=detail.url||'';if(url)updateOwnMemberProfile({avatar:url}).catch(function(err){console.warn('[HouseholdIdentityFirebaseBridge] avatar sync failed',err);});});

  window.HouseholdIdentityFirebaseBridge={version:'4.0',sync:sync,apply:apply,detach:detach,getMembers:function(){return normalizedMembers();},getCurrentUid:function(){return context().uid||null;},subscribe:subscribe,updateOwnMemberProfile:updateOwnMemberProfile,status:function(){return{householdId:currentHouseholdId,uid:currentUid,attached:!!membersRef,memberCount:Object.keys(lastMembers||{}).length};}};

  if(!bindContext())window.addEventListener('familyapp:household-context',function(e){var d=e&&e.detail&&e.detail.context;attach(d||context());});
})();
