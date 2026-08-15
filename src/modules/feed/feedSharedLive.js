'use strict';
// ============================================================
// FEED SHARED LIVE v1.0
// Household-scoped realtime Feed via FamilyDataStore.
// Existing feed UI remains the renderer; this module owns shared persistence.
// ============================================================
(function(){
  if(window.__feedSharedLiveV1)return;
  window.__feedSharedLiveV1=true;

  var COLLECTION='feed';
  var state={attached:false,applying:false,unsubscribe:null,bootTimer:null,rawSave:null,rawPublish:null};

  function now(){return Date.now();}
  function user(){try{return window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||null;}catch(e){return null;}}
  function hid(){return window.fbFamilyId||null;}
  function ready(){return !!(window.FamilyDataStore&&typeof FamilyDataStore.readShared==='function'&&typeof FamilyDataStore.writeShared==='function'&&typeof FamilyDataStore.subscribeShared==='function'&&hid()&&user()&&Array.isArray(window.feedData));}
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function localSave(){try{localStorage.setItem('fam_feed_v2',JSON.stringify(window.feedData||[]));}catch(e){}}
  function makeNumericId(){return (Date.now()*1000)+Math.floor(Math.random()*900+100);}
  function normalizeRows(rows){
    var seen={};return (rows||[]).filter(Boolean).map(function(row){var p=clone(row)||{};var id=Number(p.id);if(!Number.isFinite(id)||seen[id])id=makeNumericId();seen[id]=true;p.id=id;if(!Array.isArray(p.likes))p.likes=[];if(!Array.isArray(p.comments))p.comments=[];return p;});
  }
  function payload(rows){var u=user();return{schemaVersion:1,initialized:true,items:normalizeRows(rows),updatedAt:now(),updatedBy:u&&u.uid||'unknown'};}
  function rowsFrom(value){return normalizeRows(value&&Array.isArray(value.items)?value.items:[]);}
  function render(){try{if(typeof window.renderFeed==='function'&&document.getElementById('screen-feed')&&document.getElementById('screen-feed').classList.contains('active'))window.renderFeed();}catch(e){}try{if(typeof window.updateStats==='function')window.updateStats();}catch(e){}}
  function write(){if(state.applying||!ready())return Promise.resolve(false);localSave();return FamilyDataStore.writeShared(COLLECTION,payload(window.feedData||[]));}

  function patchSave(){
    if(typeof window.saveFeed!=='function')return false;
    if(window.saveFeed.__feedSharedLive)return true;
    state.rawSave=window.saveFeed;
    var wrapped=function(){var out=state.rawSave.apply(this,arguments);if(!state.applying)write().catch(function(err){console.error('[FeedSharedLive] save failed',err);});return out;};
    wrapped.__feedSharedLive=true;window.saveFeed=wrapped;return true;
  }

  function patchPublish(){
    if(typeof window.publishPost!=='function')return false;
    if(window.publishPost.__feedSharedLive)return true;
    state.rawPublish=window.publishPost;
    var wrapped=function(){
      var before=(window.feedData||[]).slice();var beforeIds={};before.forEach(function(p){beforeIds[String(p.id)]=true;});
      var out=state.rawPublish.apply(this,arguments);
      var created=(window.feedData||[]).find(function(p){return !beforeIds[String(p.id)];});
      if(created){created.id=makeNumericId();created.authorUid=(user()&&user().uid)||null;created.createdAt=now();created.updatedAt=created.createdAt;localSave();write().catch(function(err){console.error('[FeedSharedLive] publish sync failed',err);});render();}
      return out;
    };
    wrapped.__feedSharedLive=true;window.publishPost=wrapped;return true;
  }

  function initialize(){
    if(state.attached||!ready())return false;
    state.attached=true;
    FamilyDataStore.readShared(COLLECTION,null).then(function(existing){
      if(existing&&existing.initialized)return existing;
      var first=payload(window.feedData||[]);first.migratedAt=now();first.migratedFrom=(window.feedData||[]).length?'local-feedData':'empty';
      return FamilyDataStore.writeShared(COLLECTION,first).then(function(){return first;});
    }).then(function(){
      state.unsubscribe=FamilyDataStore.subscribeShared(COLLECTION,function(value){
        if(!value||!value.initialized)return;
        state.applying=true;window.feedData=rowsFrom(value);localSave();state.applying=false;render();
      },{schemaVersion:1,initialized:true,items:[]});
    }).catch(function(err){state.attached=false;console.error('[FeedSharedLive] init failed',err);});
    return true;
  }

  function boot(){
    if(state.bootTimer)return;
    var tries=0;
    state.bootTimer=setInterval(function(){tries++;patchSave();patchPublish();initialize();if((state.attached&&window.saveFeed&&window.saveFeed.__feedSharedLive&&window.publishPost&&window.publishPost.__feedSharedLive)||tries>240){clearInterval(state.bootTimer);state.bootTimer=null;}},250);
    patchSave();patchPublish();initialize();
  }

  window.addEventListener('familyapp:household-changed',initialize);
  window.addEventListener('familyapp:household-identity-synced',initialize);
  window.addEventListener('focus',initialize);
  window.addEventListener('online',initialize);
  window.FeedSharedLive={version:'1.0.0',sync:initialize,save:write,status:function(){return{attached:state.attached,familyId:hid(),count:(window.feedData||[]).length,applying:state.applying};}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
