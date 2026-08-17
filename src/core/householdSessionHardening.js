'use strict';
// ============================================================
// HOUSEHOLD SESSION HARDENING v1.1
// One lifecycle boundary for auth + active household runtime state.
// ============================================================
(function(){
  if(window.__householdSessionHardeningV1) return;
  window.__householdSessionHardeningV1=true;

  var VERSION='1.1.0';
  var syncRef=null, syncHandler=null, syncUid=null, syncHid=null;
  var lastAuthUid=null;
  var originalLogout=typeof window.logoutUser==='function'?window.logoutUser:null;

  function db(){try{return window.fbDb||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
  function auth(){try{return window.fbAuth||(window.firebase&&firebase.auth&&firebase.auth())||null;}catch(e){return null;}}
  function user(){try{return window.fbUser||(auth()&&auth().currentUser)||null;}catch(e){return null;}}
  function uid(){var u=user();return u&&u.uid||null;}
  function hid(){return window.fbFamilyId||null;}
  function now(){return Date.now();}
  function emit(name,detail){try{window.dispatchEvent(new CustomEvent('familyapp:session:'+name,{detail:detail||{}}));}catch(e){}}

  function setGlobal(name,value){
    try{window[name]=value;}catch(e){}
    try{
      if(name==='fbUser'&&typeof fbUser!=='undefined')fbUser=value;
      if(name==='fbFamilyId'&&typeof fbFamilyId!=='undefined')fbFamilyId=value;
      if(name==='myName'&&typeof myName!=='undefined')myName=value;
      if(name==='myInitials'&&typeof myInitials!=='undefined')myInitials=value;
      if(name==='partnerName'&&typeof partnerName!=='undefined')partnerName=value;
    }catch(e){}
  }

  function profileKey(userId,field){return 'familyapp-profile-v2:'+userId+':'+field;}
  function mirrorProfile(u,name,avatar){
    if(!u||!u.uid)return;
    name=String(name||u.displayName||'').trim();
    avatar=String(avatar||u.photoURL||'').trim();
    try{
      if(name)localStorage.setItem(profileKey(u.uid,'name'),name);
      if(avatar)localStorage.setItem(profileKey(u.uid,'avatar'),avatar);
      // Legacy keys remain a compatibility mirror only for the CURRENT UID.
      if(name)localStorage.setItem('familyapp-profile-name-v1',name);else localStorage.removeItem('familyapp-profile-name-v1');
      if(avatar)localStorage.setItem('familyapp-current-user-avatar-v1',avatar);else localStorage.removeItem('familyapp-current-user-avatar-v1');
    }catch(e){}
  }
  function clearLegacyProfileMirror(){
    try{
      localStorage.removeItem('familyapp-profile-name-v1');
      localStorage.removeItem('familyapp-current-user-avatar-v1');
      localStorage.removeItem('familyapp-partner-name-v1');
    }catch(e){}
  }

  function clearSharedRuntime(){
    try{if(typeof taskData!=='undefined')taskData=[];}catch(e){}
    try{if(typeof shopData!=='undefined')shopData=[];}catch(e){}
    try{if(typeof calData!=='undefined')calData=[];}catch(e){}
    try{if(typeof recurData!=='undefined')recurData=[];}catch(e){}
    setGlobal('partnerName','Partner');
  }

  function stopRootSync(){
    try{if(syncRef&&syncHandler)syncRef.off('value',syncHandler);else if(syncRef)syncRef.off('value');}catch(e){}
    // Remove anonymous legacy root listener that duoQuests may have attached.
    try{var d=db(),oldHid=syncHid||hid();if(d&&oldHid)d.ref('families/'+oldHid).off('value');}catch(e){}
    syncRef=null;syncHandler=null;syncUid=null;syncHid=null;
    try{if(typeof _fbSyncActive!=='undefined')_fbSyncActive=false;}catch(e){}
    window._fbSyncActive=false;
  }

  function stopPresence(context){
    var d=db(),oldUid=context&&context.uid,oldHid=context&&context.householdId;
    try{if(d)d.ref('.info/connected').off('value');}catch(e){}
    if(!d||!oldUid||!oldHid)return;
    try{d.ref('families/'+oldHid+'/presence/'+oldUid).onDisconnect().cancel();}catch(e){}
    try{
      d.ref('families/'+oldHid+'/presence/'+oldUid).update({
        online:false,
        lastSeen:(window.firebase&&firebase.database&&firebase.database.ServerValue)?firebase.database.ServerValue.TIMESTAMP:now()
      }).catch(function(){});
    }catch(e){}
  }

  function detachIdentity(){
    try{if(window.HouseholdIdentityFirebaseBridge&&typeof HouseholdIdentityFirebaseBridge.detach==='function')HouseholdIdentityFirebaseBridge.detach();}catch(e){}
  }

  // Cleanup an OLD bound context without touching a newly selected household.
  function stopBoundContext(reason,context,options){
    options=options||{};
    context=context||{uid:syncUid||lastAuthUid||uid(),householdId:syncHid||hid()};
    stopRootSync();
    stopPresence(context);
    detachIdentity();
    clearSharedRuntime();
    if(options.clearHousehold)setGlobal('fbFamilyId',null);
    if(options.clearProfileMirror)clearLegacyProfileMirror();
    emit('cleared',{reason:reason||'unknown',uid:context.uid||null,householdId:context.householdId||null});
  }

  function toArray(obj){
    try{if(typeof objToArr==='function')return objToArr(obj);}catch(e){}
    if(Array.isArray(obj))return obj.slice();
    if(!obj||typeof obj!=='object')return[];
    return Object.keys(obj).map(function(k){return obj[k];}).filter(Boolean);
  }

  function installSafeFirebaseSync(){
    var safeStart=function(){
      var d=db(),currentUid=uid(),currentHid=hid();
      if(!d||!currentUid||!currentHid||window.offlineMode===true)return false;
      if(syncRef&&syncUid===currentUid&&syncHid===currentHid)return true;

      if(syncRef||syncUid||syncHid){
        var old={uid:syncUid,householdId:syncHid};
        stopBoundContext('sync-context-switch',old,{clearHousehold:false,clearProfileMirror:false});
        // The selected NEW household remains authoritative.
        setGlobal('fbFamilyId',currentHid);
      }

      try{d.ref('families/'+currentHid).off('value');}catch(e){}
      syncUid=currentUid;syncHid=currentHid;
      syncRef=d.ref('families/'+currentHid);
      syncHandler=function(snapshot){
        if(uid()!==currentUid||hid()!==currentHid){
          stopRootSync();
          return;
        }
        var data=snapshot.val()||{};
        try{if(typeof taskData!=='undefined')taskData=toArray(data.tasks);}catch(e){}
        try{if(typeof shopData!=='undefined')shopData=toArray(data.shop);}catch(e){}
        try{if(typeof calData!=='undefined')calData=toArray(data.cal);}catch(e){}
        try{if(typeof recurData!=='undefined')recurData=toArray(data.recurData);}catch(e){}
        try{
          var members=data.members||{},self=null,other=null;
          Object.keys(members).forEach(function(memberUid){
            var m=members[memberUid];
            if(!m||m.status==='removed'||m.status==='inactive')return;
            if(memberUid===currentUid||(m.uid&&m.uid===currentUid))self=m;else if(!other)other=m;
          });
          if(self&&typeof myXP!=='undefined'&&typeof self.xp==='number')myXP=self.xp;
          if(other&&other.name)setGlobal('partnerName',other.name);
        }catch(e){}
        try{if(typeof _renderScreen==='function'&&typeof _currentScreen!=='undefined')_renderScreen(_currentScreen);}catch(e){}
        try{if(typeof updateHomeXP==='function')updateHomeXP();}catch(e){}
      };
      syncRef.on('value',syncHandler);
      try{if(typeof _fbSyncActive!=='undefined')_fbSyncActive=true;}catch(e){}
      window._fbSyncActive=true;
      emit('sync-attached',{uid:currentUid,householdId:currentHid});
      return true;
    };
    safeStart.__householdHardening=true;
    window.startFirebaseSync=safeStart;
    try{startFirebaseSync=safeStart;}catch(e){}
    window.stopFirebaseSync=stopRootSync;
  }

  function accessRevoked(d,currentUid,currentHid,cause){
    var updates={};
    updates['users/'+currentUid+'/activeHouseholdId']=null;
    updates['users/'+currentUid+'/familyId']=null;
    return d.ref().update(updates).catch(function(){}).then(function(){
      stopBoundContext('household-access-revoked',{uid:currentUid,householdId:currentHid},{clearHousehold:true});
      var err=new Error(cause||'HOUSEHOLD_ACCESS_REVOKED');err.code='HOUSEHOLD_ACCESS_REVOKED';throw err;
    });
  }

  function resolveLegacyHousehold(){
    if(window.FamilyHousehold&&typeof FamilyHousehold.resolve==='function')return FamilyHousehold.resolve();
    var err=new Error('LEGACY_HOUSEHOLD_MIGRATION_UNAVAILABLE');err.code='LEGACY_HOUSEHOLD_MIGRATION_UNAVAILABLE';return Promise.reject(err);
  }

  function installStrictLoader(){
    var strictLoad=function(){
      var d=db(),u=user();
      if(!d||!u)return Promise.reject(new Error('Niet ingelogd'));
      var currentUid=u.uid;
      return d.ref('users/'+currentUid).once('value').then(function(userSnap){
        var data=userSnap.val()||{},currentHid=data.activeHouseholdId||data.familyId;
        if(!currentHid){var required=new Error('HOUSEHOLD_REQUIRED');required.code='HOUSEHOLD_REQUIRED';throw required;}
        return d.ref('families/'+currentHid+'/meta').once('value').then(function(metaSnap){
          // Only a genuinely pre-platform family may run legacy migration.
          if(!metaSnap.exists())return resolveLegacyHousehold();
          return d.ref('families/'+currentHid+'/members/'+currentUid).once('value').then(function(memberSnap){
            var member=memberSnap.val();
            if(!member||member.status!=='active')return accessRevoked(d,currentUid,currentHid,'HOUSEHOLD_ACCESS_REVOKED');
            var resolvedName=member.name||data.name||u.displayName||'Gebruiker';
            setGlobal('fbFamilyId',currentHid);
            setGlobal('myName',resolvedName);
            setGlobal('myInitials',resolvedName.substring(0,2).toUpperCase());
            mirrorProfile(u,resolvedName,member.avatar||member.avatarUrl||member.photoURL||u.photoURL||'');
            try{if(window.HouseholdIdentityFirebaseBridge&&typeof HouseholdIdentityFirebaseBridge.sync==='function')HouseholdIdentityFirebaseBridge.sync();}catch(e){}
            try{if(window.FamilyHousehold&&typeof FamilyHousehold.startPresence==='function')FamilyHousehold.startPresence(currentHid);}catch(e){}
            emit('household-resolved',{uid:currentUid,householdId:currentHid});
            return{id:currentHid,user:data,member:member};
          },function(){
            // Security Rules intentionally deny member reads after removal.
            return accessRevoked(d,currentUid,currentHid,'HOUSEHOLD_MEMBERSHIP_READ_DENIED');
          });
        });
      });
    };
    strictLoad.__householdV1=true;
    strictLoad.__householdHardening=true;
    window.loadUserFamily=strictLoad;
    try{loadUserFamily=strictLoad;}catch(e){}
  }

  function installPresenceGuard(){
    try{
      if(!window.FamilyHousehold||typeof FamilyHousehold.startPresence!=='function'||FamilyHousehold.startPresence.__householdHardening)return;
      var original=FamilyHousehold.startPresence;
      var wrapped=function(){
        var d=db();try{if(d)d.ref('.info/connected').off('value');}catch(e){}
        return original.apply(this,arguments);
      };
      wrapped.__householdHardening=true;
      FamilyHousehold.startPresence=wrapped;
      FamilyHousehold.stopPresence=function(){stopPresence({uid:uid(),householdId:hid()});};
    }catch(e){}
  }

  function installLogoutGuard(){
    var guarded=function(){
      var old={uid:uid(),householdId:hid()};
      stopBoundContext('logout',old,{clearHousehold:true,clearProfileMirror:true});
      setGlobal('fbUser',null);
      window._appStarted=false;
      if(originalLogout){try{return originalLogout.apply(this,arguments);}catch(e){}}
      var a=auth();if(a)return a.signOut();
    };
    guarded.__householdHardening=true;
    window.logoutUser=guarded;
    try{logoutUser=guarded;}catch(e){}
  }

  function onAuthChanged(nextUser){
    var nextUid=nextUser&&nextUser.uid||null;
    if(lastAuthUid&&nextUid!==lastAuthUid){
      stopBoundContext('auth-account-switch',{uid:lastAuthUid,householdId:hid()},{clearHousehold:true,clearProfileMirror:true});
    }
    if(!nextUid){
      if(lastAuthUid)stopBoundContext('auth-signed-out',{uid:lastAuthUid,householdId:hid()},{clearHousehold:true,clearProfileMirror:true});
      lastAuthUid=null;setGlobal('fbUser',null);window._appStarted=false;return;
    }
    lastAuthUid=nextUid;setGlobal('fbUser',nextUser);mirrorProfile(nextUser,nextUser.displayName||'',nextUser.photoURL||'');
  }

  function boot(){
    installSafeFirebaseSync();
    installStrictLoader();
    installLogoutGuard();
    installPresenceGuard();
    var a=auth();if(a&&typeof a.onAuthStateChanged==='function')a.onAuthStateChanged(onAuthChanged);
    window.addEventListener('familyapp:household-identity-synced',installPresenceGuard);
    window.addEventListener('focus',installPresenceGuard);
  }

  window.HouseholdSessionHardening={
    version:VERSION,
    stopAll:function(reason){stopBoundContext(reason,{uid:syncUid||lastAuthUid||uid(),householdId:syncHid||hid()},{clearHousehold:true});},
    stopFirebaseSync:stopRootSync,
    stopPresence:stopPresence,
    reinstall:function(){installSafeFirebaseSync();installStrictLoader();installLogoutGuard();installPresenceGuard();},
    status:function(){return{version:VERSION,uid:uid(),householdId:hid(),syncUid:syncUid,syncHouseholdId:syncHid,syncAttached:!!syncRef};}
  };

  boot();
})();
