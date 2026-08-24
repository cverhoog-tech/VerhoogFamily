'use strict';
// ============================================================
// PROGRESSION STORE v1.0.0 — STEP 9 canonical foundation
//
// Canonical authority:
//   families/{householdId}/members/{uid}/progression
//
// The store is deliberately UID + household scoped through HouseholdContext.
// Legacy globals/localStorage are compatibility projections only and are NEVER
// used as migration authority. Existing member XP/achievements may be migrated
// once from the active member record.
// ============================================================
(function(){
  if(window.ProgressionStore)return;

  var VERSION='1.0.0';
  var SCHEMA_VERSION=1;
  var state=emptyState();
  var active={uid:null,householdId:null,token:null,ref:null,handler:null,errorHandler:null,generation:0};
  var contextUnsubscribe=null;
  var pendingBind=null;

  function clone(value){
    if(value===undefined)return undefined;
    try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}
  }

  function emptyState(){
    return {version:SCHEMA_VERSION,xp:0,rewards:{},achievements:{},migration:null,updatedAt:null};
  }

  function cleanMap(value){return value&&typeof value==='object'&&!Array.isArray(value)?clone(value):{};}

  function normalize(value){
    value=value&&typeof value==='object'?value:{};
    return {
      version:Number(value.version||SCHEMA_VERSION)||SCHEMA_VERSION,
      xp:Math.max(0,Math.round(Number(value.xp)||0)),
      rewards:cleanMap(value.rewards),
      achievements:cleanMap(value.achievements),
      migration:value.migration&&typeof value.migration==='object'?clone(value.migration):null,
      updatedAt:value.updatedAt==null?null:value.updatedAt
    };
  }

  function context(){return window.HouseholdContext||null;}
  function database(){
    try{return window.fbDb||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}
  }
  function serverTimestamp(){
    try{return firebase.database.ServerValue.TIMESTAMP;}catch(e){return Date.now();}
  }
  function currentContext(){
    var h=context();
    try{return h&&typeof h.snapshot==='function'?h.snapshot():null;}catch(e){return null;}
  }
  function readyContext(c){return !!(c&&c.ready===true&&c.uid&&c.householdId);}
  function capture(){
    var h=context();
    try{return h&&typeof h.capture==='function'?h.capture():null;}catch(e){return null;}
  }
  function tokenCurrent(token){
    var h=context();
    try{return !!(h&&typeof h.isCurrent==='function'&&h.isCurrent(token));}catch(e){return false;}
  }
  function memberBase(token){return 'families/'+token.householdId+'/members/'+token.uid;}
  function progressionPath(token){return memberBase(token)+'/progression';}

  // Firebase keys may not contain . # $ [ ] /. encodeURIComponent handles all
  // except '.', so encode that explicitly too. The original key remains stored
  // inside the reward record for diagnostics/migration.
  function safeRewardKey(key){return encodeURIComponent(String(key||'')).replace(/\./g,'%2E');}

  function compatibilityBadges(next){
    var out={};
    Object.keys((next&&next.achievements)||{}).forEach(function(id){
      var row=next.achievements[id];
      if(row&&row.unlocked!==false)out[id]=true;
    });
    return out;
  }

  function dispatch(reason){
    try{
      window.dispatchEvent(new CustomEvent('familyapp:progression-updated',{detail:{
        version:VERSION,
        reason:reason||'update',
        uid:active.uid,
        householdId:active.householdId,
        xp:state.xp,
        progression:clone(state)
      }}));
    }catch(e){}
  }

  function project(value,reason){
    state=normalize(value);

    // Temporary compatibility projection for legacy UI. These are mirrors, not
    // authorities; this store never reads them when deciding canonical state.
    window.myXP=state.xp;
    try{myXP=state.xp;}catch(e){}
    try{localStorage.setItem('fam_myxp_v1',String(state.xp));}catch(e){}

    var badges=compatibilityBadges(state);
    window.unlockedBadges=badges;
    try{unlockedBadges=badges;}catch(e){}

    dispatch(reason);
    try{
      var screen=document.getElementById('screen-achievements');
      if(typeof window.renderAch==='function'&&screen&&screen.classList.contains('active'))window.renderAch();
    }catch(e){}
    try{if(typeof window.updateHomeXP==='function')window.updateHomeXP();}catch(e){}
    return clone(state);
  }

  function clearProjection(reason){return project(emptyState(),reason||'cleared');}

  function detach(reason){
    active.generation++;
    if(active.ref&&active.handler){
      try{active.ref.off('value',active.handler);}catch(e){}
    }
    active.ref=null;
    active.handler=null;
    active.errorHandler=null;
    active.token=null;
    active.uid=null;
    active.householdId=null;
    pendingBind=null;
    clearProjection(reason||'detached');
  }

  function migratedAchievements(member){
    var source=member&&member.achievements&&typeof member.achievements==='object'?member.achievements:{};
    var achievements={};
    var rewards={};
    Object.keys(source).forEach(function(id){
      var row=source[id];
      if(row===false||row==null)return;
      var unlocked=typeof row==='object'?row.unlocked!==false:!!row;
      if(!unlocked)return;
      var xp=Math.max(0,Math.round(Number(row&&row.xp)||0));
      achievements[id]={
        unlocked:true,
        xp:xp,
        unlockedAt:row&&row.unlockedAt!=null?row.unlockedAt:null,
        migrated:true
      };
      var original='achievement:'+id;
      rewards[safeRewardKey(original)]={
        key:original,
        amount:xp,
        reason:'Legacy achievement migration',
        source:'legacy-achievement',
        sourceId:String(id),
        awardedAt:row&&row.unlockedAt!=null?row.unlockedAt:null,
        migrated:true
      };
    });
    return {achievements:achievements,rewards:rewards};
  }

  function legacySeed(member){
    member=member&&typeof member==='object'?member:{};
    var migrated=migratedAchievements(member);
    return {
      version:SCHEMA_VERSION,
      xp:Math.max(0,Math.round(Number(member.xp)||0)),
      rewards:migrated.rewards,
      achievements:migrated.achievements,
      migration:{source:'legacy-member',migratedAt:serverTimestamp()},
      updatedAt:serverTimestamp()
    };
  }

  function ensureCanonical(token){
    var d=database();
    if(!d)return Promise.reject(new Error('PROGRESSION_DATABASE_UNAVAILABLE'));
    if(!tokenCurrent(token))return Promise.reject(new Error('STALE_PROGRESSION_CONTEXT'));
    var pRef=d.ref(progressionPath(token));

    return pRef.once('value').then(function(snap){
      if(!tokenCurrent(token))throw new Error('STALE_PROGRESSION_CONTEXT');
      var existing=snap.val();
      if(existing!==null&&existing!==undefined)return normalize(existing);
      return d.ref(memberBase(token)).once('value').then(function(memberSnap){
        if(!tokenCurrent(token))throw new Error('STALE_PROGRESSION_CONTEXT');
        var seed=legacySeed(memberSnap.val());
        return pRef.transaction(function(current){
          if(!tokenCurrent(token))return;
          if(current!==null&&current!==undefined)return current;
          return seed;
        }).then(function(result){
          if(!tokenCurrent(token))throw new Error('STALE_PROGRESSION_CONTEXT');
          var value=result&&result.snapshot&&typeof result.snapshot.val==='function'?result.snapshot.val():seed;
          return normalize(value);
        });
      });
    });
  }

  function bind(c,reason){
    c=c||currentContext();
    if(!readyContext(c)){
      detach(reason||'context-not-ready');
      return Promise.resolve(false);
    }
    if(active.ref&&active.uid===c.uid&&active.householdId===c.householdId)return Promise.resolve(true);
    if(pendingBind&&active.uid===c.uid&&active.householdId===c.householdId)return pendingBind;

    detach('identity-switch');
    var token=capture();
    if(!token||!token.uid||!token.householdId)return Promise.reject(new Error('PROGRESSION_CONTEXT_CAPTURE_FAILED'));
    var generation=active.generation;
    active.uid=token.uid;
    active.householdId=token.householdId;
    active.token=token;

    pendingBind=ensureCanonical(token).then(function(initial){
      if(active.generation!==generation||!tokenCurrent(token))return false;
      project(initial,'canonical-ready');
      var d=database();
      if(!d)throw new Error('PROGRESSION_DATABASE_UNAVAILABLE');
      var ref=d.ref(progressionPath(token));
      var handler=function(snap){
        if(active.generation!==generation||!tokenCurrent(token))return;
        project(snap.val()||emptyState(),'remote');
      };
      var errorHandler=function(error){
        if(active.generation!==generation||!tokenCurrent(token))return;
        console.error('[ProgressionStore] listener failed',error);
      };
      active.ref=ref;
      active.handler=handler;
      active.errorHandler=errorHandler;
      ref.on('value',handler,errorHandler);
      return true;
    }).catch(function(error){
      if(String(error&&error.message||'').indexOf('STALE_PROGRESSION_CONTEXT')>-1)return false;
      console.error('[ProgressionStore] bind failed',error);
      throw error;
    }).finally(function(){
      if(active.generation===generation)pendingBind=null;
    });
    return pendingBind;
  }

  function whenReady(){
    var c=currentContext();
    if(!readyContext(c))return Promise.reject(new Error('PROGRESSION_CONTEXT_NOT_READY'));
    if(active.ref&&active.uid===c.uid&&active.householdId===c.householdId)return Promise.resolve(true);
    return bind(c,'ensure-ready').then(function(ok){if(!ok)throw new Error('STALE_PROGRESSION_CONTEXT');return true;});
  }

  function rewardMeta(key,amount,meta){
    meta=meta&&typeof meta==='object'?meta:{};
    return {
      key:String(key),
      amount:Math.max(0,Math.round(Number(amount)||0)),
      reason:String(meta.reason||''),
      source:String(meta.source||'legacy-ui'),
      sourceId:meta.sourceId==null?null:String(meta.sourceId),
      awardedAt:serverTimestamp()
    };
  }

  function awardOnce(key,amount,meta){
    key=String(key||'').trim();
    amount=Math.max(0,Math.round(Number(amount)||0));
    if(!key)return Promise.reject(new Error('PROGRESSION_REWARD_KEY_REQUIRED'));
    if(!amount)return Promise.resolve({awarded:false,reason:'zero-amount',xp:state.xp});

    return whenReady().then(function(){
      var token=capture();
      if(!tokenCurrent(token))throw new Error('STALE_PROGRESSION_CONTEXT');
      var d=database(),ref=d.ref(progressionPath(token)),safeKey=safeRewardKey(key),didAward=false;
      return ref.transaction(function(current){
        didAward=false;
        if(!tokenCurrent(token))return;
        var next=normalize(current);
        if(next.rewards[safeKey])return;
        didAward=true;
        next.rewards[safeKey]=rewardMeta(key,amount,meta);
        next.xp=Math.max(0,next.xp+amount);
        next.version=SCHEMA_VERSION;
        next.updatedAt=serverTimestamp();
        return next;
      }).then(function(result){
        if(!tokenCurrent(token))throw new Error('STALE_PROGRESSION_CONTEXT');
        var committed=!!(result&&result.committed);
        if(committed&&result.snapshot&&typeof result.snapshot.val==='function')project(result.snapshot.val(),'reward');
        return {awarded:committed&&didAward,key:key,amount:committed&&didAward?amount:0,xp:state.xp};
      });
    });
  }

  function unlockAchievementOnce(badgeId,amount,meta){
    badgeId=String(badgeId||'').trim();
    amount=Math.max(0,Math.round(Number(amount)||0));
    if(!badgeId)return Promise.reject(new Error('PROGRESSION_ACHIEVEMENT_ID_REQUIRED'));

    return whenReady().then(function(){
      var token=capture();
      if(!tokenCurrent(token))throw new Error('STALE_PROGRESSION_CONTEXT');
      var d=database(),ref=d.ref(progressionPath(token));
      var rewardKey='achievement:'+badgeId,safeKey=safeRewardKey(rewardKey),didUnlock=false,didAward=false;
      return ref.transaction(function(current){
        didUnlock=false;didAward=false;
        if(!tokenCurrent(token))return;
        var next=normalize(current);
        var existing=next.achievements[badgeId];
        if(existing&&existing.unlocked!==false)return;
        didUnlock=true;
        var alreadyRewarded=!!next.rewards[safeKey];
        if(!alreadyRewarded&&amount>0){
          didAward=true;
          next.rewards[safeKey]=rewardMeta(rewardKey,amount,{
            reason:(meta&&meta.reason)||'Achievement unlocked',
            source:(meta&&meta.source)||'achievement',
            sourceId:(meta&&meta.sourceId)||badgeId
          });
          next.xp=Math.max(0,next.xp+amount);
        }
        next.achievements[badgeId]={
          unlocked:true,
          xp:amount,
          unlockedAt:serverTimestamp()
        };
        next.version=SCHEMA_VERSION;
        next.updatedAt=serverTimestamp();
        return next;
      }).then(function(result){
        if(!tokenCurrent(token))throw new Error('STALE_PROGRESSION_CONTEXT');
        var committed=!!(result&&result.committed);
        if(committed&&result.snapshot&&typeof result.snapshot.val==='function')project(result.snapshot.val(),'achievement');
        return {unlocked:committed&&didUnlock,awarded:committed&&didAward,badgeId:badgeId,amount:committed&&didAward?amount:0,xp:state.xp};
      });
    });
  }

  function hasReward(key){return !!state.rewards[safeRewardKey(key)];}
  function hasAchievement(id){var row=state.achievements[String(id||'')];return !!(row&&row.unlocked!==false);}

  function handleContext(next,reason){bind(next,reason||'context-update').catch(function(error){console.error('[ProgressionStore] context bind failed',error);});}

  function start(){
    if(contextUnsubscribe)return true;
    var h=context();
    if(!h||typeof h.subscribe!=='function')return false;
    contextUnsubscribe=h.subscribe(handleContext);
    return true;
  }

  function stop(){
    if(contextUnsubscribe){try{contextUnsubscribe();}catch(e){}contextUnsubscribe=null;}
    detach('stopped');
  }

  window.ProgressionStore={
    version:VERSION,
    schemaVersion:SCHEMA_VERSION,
    start:start,
    stop:stop,
    bind:bind,
    get:function(){return clone(state);},
    getCurrentXp:function(){return state.xp;},
    awardOnce:awardOnce,
    unlockAchievementOnce:unlockAchievementOnce,
    hasReward:hasReward,
    hasAchievement:hasAchievement,
    rewardKey:safeRewardKey,
    status:function(){return{uid:active.uid,householdId:active.householdId,attached:!!active.ref,pending:!!pendingBind,xp:state.xp,rewardCount:Object.keys(state.rewards||{}).length,achievementCount:Object.keys(state.achievements||{}).length};},
    _normalize:normalize,
    _legacySeed:legacySeed
  };

  if(!start()){
    window.addEventListener('familyapp:household-context',function(e){handleContext(e&&e.detail&&e.detail.context,e&&e.detail&&e.detail.reason);});
  }
})();
