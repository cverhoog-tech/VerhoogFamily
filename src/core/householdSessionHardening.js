'use strict';
// ============================================================
// HOUSEHOLD SESSION HARDENING v1.0
// Central auth/household lifecycle guard for multi-household isolation.
// Keeps legacy runtime compatible while preventing stale listeners/state
// from surviving logout, account switch or household revocation.
// ============================================================
(function(){
  if(window.__householdSessionHardeningV1) return;
  window.__householdSessionHardeningV1 = true;

  var VERSION = '1.0.0';
  var syncRef = null;
  var syncHandler = null;
  var syncUid = null;
  var syncHouseholdId = null;
  var lastAuthUid = null;
  var originalLogout = typeof window.logoutUser === 'function' ? window.logoutUser : null;
  var originalLoadUserFamily = typeof window.loadUserFamily === 'function' ? window.loadUserFamily : null;

  function db(){
    try { return window.fbDb || (window.firebase && firebase.database && firebase.database()) || null; }
    catch(e){ return null; }
  }

  function auth(){
    try { return window.fbAuth || (window.firebase && firebase.auth && firebase.auth()) || null; }
    catch(e){ return null; }
  }

  function currentUser(){
    try { return window.fbUser || (auth() && auth().currentUser) || null; }
    catch(e){ return null; }
  }

  function currentUid(){ var u=currentUser(); return u && u.uid || null; }
  function currentHousehold(){ return window.fbFamilyId || null; }
  function now(){ return Date.now(); }

  function emit(name, detail){
    try { window.dispatchEvent(new CustomEvent('familyapp:session:'+name,{detail:detail||{}})); }
    catch(e){}
  }

  function setGlobal(name,value){
    try { window[name]=value; } catch(e){}
    try {
      if(name==='fbFamilyId' && typeof fbFamilyId!=='undefined') fbFamilyId=value;
      if(name==='fbUser' && typeof fbUser!=='undefined') fbUser=value;
      if(name==='myName' && typeof myName!=='undefined') myName=value;
      if(name==='myInitials' && typeof myInitials!=='undefined') myInitials=value;
      if(name==='partnerName' && typeof partnerName!=='undefined') partnerName=value;
    } catch(e){}
  }

  function profileKey(uid,field){ return 'familyapp-profile-v2:'+uid+':'+field; }

  function mirrorCurrentProfile(user, name, avatar){
    if(!user || !user.uid) return;
    var resolvedName = String(name || user.displayName || '').trim();
    var resolvedAvatar = String(avatar || user.photoURL || '').trim();
    try {
      if(resolvedName) localStorage.setItem(profileKey(user.uid,'name'),resolvedName);
      if(resolvedAvatar) localStorage.setItem(profileKey(user.uid,'avatar'),resolvedAvatar);
      // Compatibility mirror: these old keys may still be read by legacy UI, but
      // they are rewritten only from the CURRENT authenticated UID.
      if(resolvedName) localStorage.setItem('familyapp-profile-name-v1',resolvedName);
      else localStorage.removeItem('familyapp-profile-name-v1');
      if(resolvedAvatar) localStorage.setItem('familyapp-current-user-avatar-v1',resolvedAvatar);
      else localStorage.removeItem('familyapp-current-user-avatar-v1');
    } catch(e){}
  }

  function clearLegacyProfileMirror(){
    try {
      localStorage.removeItem('familyapp-profile-name-v1');
      localStorage.removeItem('familyapp-current-user-avatar-v1');
      localStorage.removeItem('familyapp-partner-name-v1');
    } catch(e){}
  }

  function clearSharedRuntimeData(){
    try { if(typeof taskData!=='undefined') taskData=[]; } catch(e){}
    try { if(typeof shopData!=='undefined') shopData=[]; } catch(e){}
    try { if(typeof calData!=='undefined') calData=[]; } catch(e){}
    try { if(typeof recurData!=='undefined') recurData=[]; } catch(e){}
    try { setGlobal('partnerName','Partner'); } catch(e){}
  }

  function stopLegacySync(){
    try {
      if(syncRef && syncHandler) syncRef.off('value',syncHandler);
      else if(syncRef) syncRef.off('value');
    } catch(e){}

    // Kill any anonymous legacy root-family listener that may have been attached
    // before this hardening layer loaded. Domain modules listen on child paths.
    try {
      var d=db(), hid=syncHouseholdId || currentHousehold();
      if(d && hid) d.ref('families/'+hid).off('value');
    } catch(e){}

    syncRef=null; syncHandler=null; syncUid=null; syncHouseholdId=null;
    try { if(typeof _fbSyncActive!=='undefined') _fbSyncActive=false; } catch(e){}
    window._fbSyncActive=false;
  }

  function stopPresence(context){
    var d=db();
    var uid=(context&&context.uid)||syncUid||lastAuthUid||currentUid();
    var hid=(context&&context.householdId)||syncHouseholdId||currentHousehold();
    try {
      // HouseholdPlatform v1 used anonymous listeners here; remove them centrally
      // so account/household switches cannot leave old connection callbacks alive.
      if(d) d.ref('.info/connected').off('value');
    } catch(e){}
    if(d && uid && hid){
      try { d.ref('families/'+hid+'/presence/'+uid).onDisconnect().cancel(); } catch(e){}
      try {
        d.ref('families/'+hid+'/presence/'+uid).update({
          online:false,
          lastSeen:(window.firebase&&firebase.database&&firebase.database.ServerValue)?firebase.database.ServerValue.TIMESTAMP:now()
        }).catch(function(){});
      } catch(e){}
    }
  }

  function detachIdentity(){
    try {
      if(window.HouseholdIdentityFirebaseBridge && typeof HouseholdIdentityFirebaseBridge.detach==='function') HouseholdIdentityFirebaseBridge.detach();
    } catch(e){}
  }

  function clearHouseholdGlobals(){
    setGlobal('fbFamilyId',null);
    clearSharedRuntimeData();
  }

  function stopAll(reason, context, options){
    options=options||{};
    var snapshot={
      uid:(context&&context.uid)||syncUid||lastAuthUid||currentUid(),
      householdId:(context&&context.householdId)||syncHouseholdId||currentHousehold()
    };
    stopLegacySync();
    stopPresence(snapshot);
    detachIdentity();
    clearHouseholdGlobals();
    if(options.clearProfileMirror) clearLegacyProfileMirror();
    emit('cleared',{reason:reason||'unknown',uid:snapshot.uid,householdId:snapshot.householdId});
  }

  function toArray(obj){
    try { if(typeof objToArr==='function') return objToArr(obj); } catch(e){}
    if(Array.isArray(obj)) return obj.slice();
    if(!obj || typeof obj!=='object') return [];
    return Object.keys(obj).map(function(k){return obj[k];}).filter(Boolean);
  }

  function installSafeFirebaseSync(){
    var safeStart=function(){
      var d=db(), uid=currentUid(), hid=currentHousehold();
      if(!d || !uid || !hid || window.offlineMode===true) return false;

      if(syncRef && syncUid===uid && syncHouseholdId===hid) return true;
      if(syncRef || (syncUid && syncUid!==uid) || (syncHouseholdId && syncHouseholdId!==hid)){
        stopAll('sync-context-switch',{uid:syncUid,householdId:syncHouseholdId});
      }

      // Remove a possibly pre-existing anonymous legacy root listener for this household.
      try { d.ref('families/'+hid).off('value'); } catch(e){}

      syncUid=uid; syncHouseholdId=hid;
      syncRef=d.ref('families/'+hid);
      syncHandler=function(snapshot){
        // A late Firebase callback must never mutate state after auth/household changed.
        if(currentUid()!==uid || currentHousehold()!==hid){
          stopLegacySync();
          return;
        }
        var data=snapshot.val()||{};
        try { if(typeof taskData!=='undefined') taskData=toArray(data.tasks); } catch(e){}
        try { if(typeof shopData!=='undefined') shopData=toArray(data.shop); } catch(e){}
        try { if(typeof calData!=='undefined') calData=toArray(data.cal); } catch(e){}
        try { if(typeof recurData!=='undefined') recurData=toArray(data.recurData); } catch(e){}

        try {
          var members=data.members||{}, self=null, other=null;
          Object.keys(members).forEach(function(memberUid){
            var m=members[memberUid]; if(!m || m.status==='removed' || m.status==='inactive') return;
            if(memberUid===uid || (m.uid && m.uid===uid)) self=m;
            else if(!other) other=m;
          });
          if(self && typeof myXP!=='undefined' && typeof self.xp==='number') myXP=self.xp;
          if(other && other.name) setGlobal('partnerName',other.name);
        } catch(e){}

        try { if(typeof _renderScreen==='function' && typeof _currentScreen!=='undefined') _renderScreen(_currentScreen); } catch(e){}
        try { if(typeof updateHomeXP==='function') updateHomeXP(); } catch(e){}
      };
      syncRef.on('value',syncHandler);
      try { if(typeof _fbSyncActive!=='undefined') _fbSyncActive=true; } catch(e){}
      window._fbSyncActive=true;
      emit('sync-attached',{uid:uid,householdId:hid});
      return true;
    };
    safeStart.__householdHardening=true;
    window.startFirebaseSync=safeStart;
    try { startFirebaseSync=safeStart; } catch(e){}
    window.stopFirebaseSync=stopLegacySync;
  }

  function rejectStaleMembership(d,uid,hid,code){
    var updates={};
    updates['users/'+uid+'/activeHouseholdId']=null;
    updates['users/'+uid+'/familyId']=null;
    return d.ref().update(updates).catch(function(){}).then(function(){
      stopAll(code||'household-access-revoked',{uid:uid,householdId:hid});
      var err=new Error(code||'HOUSEHOLD_ACCESS_REVOKED');
      err.code=code||'HOUSEHOLD_ACCESS_REVOKED';
      throw err;
    });
  }

  function installStrictHouseholdLoader(){
    var strictLoad=function(){
      var d=db(), u=currentUser();
      if(!d || !u) return Promise.reject(new Error('Niet ingelogd'));
      var uid=u.uid;
      return d.ref('users/'+uid).once('value').then(function(userSnap){
        var data=userSnap.val()||{};
        var hid=data.activeHouseholdId||data.familyId;
        if(!hid){ var required=new Error('HOUSEHOLD_REQUIRED'); required.code='HOUSEHOLD_REQUIRED'; throw required; }
        return Promise.all([
          d.ref('families/'+hid+'/meta').once('value'),
          d.ref('families/'+hid+'/members/'+uid).once('value')
        ]).then(function(results){
          var meta=results[0].val(), member=results[1].val();

          // Explicit legacy boundary: only an old family without meta may use the
          // previous migration path. Existing production households never recreate
          // a missing/removed membership implicitly.
          if(!meta && typeof originalLoadUserFamily==='function'){
            return Promise.resolve(originalLoadUserFamily()).then(function(){
              emit('legacy-household-resolved',{uid:uid,householdId:hid});
              return {id:hid,user:data,legacy:true};
            });
          }

          if(!member || member.status!=='active'){
            return rejectStaleMembership(d,uid,hid,'HOUSEHOLD_ACCESS_REVOKED');
          }

          var resolvedName=member.name||data.name||u.displayName||'Gebruiker';
          setGlobal('fbFamilyId',hid);
          setGlobal('myName',resolvedName);
          setGlobal('myInitials',resolvedName.substring(0,2).toUpperCase());
          mirrorCurrentProfile(u,resolvedName,member.avatar||member.avatarUrl||member.photoURL||u.photoURL||'');

          try {
            if(window.HouseholdIdentityFirebaseBridge && typeof HouseholdIdentityFirebaseBridge.sync==='function') HouseholdIdentityFirebaseBridge.sync();
          } catch(e){}
          try {
            if(window.FamilyHousehold && typeof FamilyHousehold.startPresence==='function') FamilyHousehold.startPresence(hid);
          } catch(e){}

          emit('household-resolved',{uid:uid,householdId:hid});
          return {id:hid,user:data,member:member};
        });
      });
    };
    // Prevent HouseholdPlatform's compatibility installer from overwriting this
    // loader after it has been hardened.
    strictLoad.__householdV1=true;
    strictLoad.__householdHardening=true;
    window.loadUserFamily=strictLoad;
    try { loadUserFamily=strictLoad; } catch(e){}
  }

  function installLogoutGuard(){
    var guarded=function(){
      var context={uid:currentUid(),householdId:currentHousehold()};
      stopAll('logout',context,{clearProfileMirror:true});
      setGlobal('fbUser',null);
      window._appStarted=false;
      if(originalLogout){
        try { return originalLogout.apply(this,arguments); } catch(e){}
      }
      var a=auth();
      if(a) return a.signOut();
    };
    guarded.__householdHardening=true;
    window.logoutUser=guarded;
    try { logoutUser=guarded; } catch(e){}
  }

  function installPresenceGuard(){
    try {
      if(!window.FamilyHousehold || typeof FamilyHousehold.startPresence!=='function' || FamilyHousehold.startPresence.__householdHardening) return;
      var original=FamilyHousehold.startPresence;
      var wrapped=function(hid){
        var d=db();
        // Remove any previous anonymous HouseholdPlatform connection listener
        // before attaching the current context.
        try { if(d) d.ref('.info/connected').off('value'); } catch(e){}
        return original.apply(this,arguments);
      };
      wrapped.__householdHardening=true;
      FamilyHousehold.startPresence=wrapped;
      FamilyHousehold.stopPresence=function(){ stopPresence({uid:currentUid(),householdId:currentHousehold()}); };
    } catch(e){}
  }

  function onAuthChanged(user){
    var nextUid=user&&user.uid||null;
    if(lastAuthUid && nextUid!==lastAuthUid){
      stopAll('auth-account-switch',{uid:lastAuthUid,householdId:currentHousehold()},{clearProfileMirror:true});
    }
    if(!nextUid){
      stopAll('auth-signed-out',{uid:lastAuthUid,householdId:currentHousehold()},{clearProfileMirror:true});
      lastAuthUid=null;
      setGlobal('fbUser',null);
      window._appStarted=false;
      return;
    }
    lastAuthUid=nextUid;
    setGlobal('fbUser',user);
    mirrorCurrentProfile(user,user.displayName||'',user.photoURL||'');
  }

  function boot(){
    installSafeFirebaseSync();
    installStrictHouseholdLoader();
    installLogoutGuard();
    installPresenceGuard();

    var a=auth();
    if(a && typeof a.onAuthStateChanged==='function') a.onAuthStateChanged(onAuthChanged);

    // HouseholdPlatform can be installed by another compatibility layer; patch
    // presence again when identity/runtime signals indicate it became available.
    window.addEventListener('familyapp:household-identity-synced',installPresenceGuard);
    window.addEventListener('focus',function(){ installPresenceGuard(); });
  }

  window.HouseholdSessionHardening={
    version:VERSION,
    stopAll:stopAll,
    stopFirebaseSync:stopLegacySync,
    stopPresence:stopPresence,
    reinstall:function(){ installSafeFirebaseSync();installStrictHouseholdLoader();installLogoutGuard();installPresenceGuard(); },
    status:function(){return{version:VERSION,uid:currentUid(),householdId:currentHousehold(),syncUid:syncUid,syncHouseholdId:syncHouseholdId,syncAttached:!!syncRef};}
  };

  boot();
})();
