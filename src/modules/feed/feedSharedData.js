'use strict';
// ============================================================
// FEED SHARED DATA v1.0
// Firebase shared/feedPosts is authoritative for the household Feed.
// Record-based: every post is its own child node, and likes/comments are
// written to their own leaf paths. Nothing here ever overwrites the whole
// feedPosts collection — create/delete/like/comment each touch only the
// path they own, so two members acting at the same time cannot silently
// drop each other's changes.
// window.feedData remains a compatibility projection for the existing Feed UI.
// ============================================================
(function(){
  if(window.FeedSharedData) return;

  var COLLECTION='feedPosts';
  var LEGACY_COLLECTION='feed';
  var started=false,attached=false,hasSnapshot=false,migrating=false,lastError=null;

  // Sparse, dev-facing trace of the create -> write -> snapshot -> render
  // pipeline. Not spammy: one line per meaningful transition, so a broken
  // link in the chain is easy to spot in the console without noise.
  function trace(label,detail){try{console.log('[FeedSharedData]',label,detail!==undefined?detail:'');}catch(e){}}

  function uid(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
  function now(){return Date.now();}
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function fds(){return window.FamilyDataStore||null;}
  function ready(){return !!(fds()&&window.fbFamilyId&&uid());}

  function members(){
    try{
      if(window.HouseholdIdentityFirebaseBridge&&typeof window.HouseholdIdentityFirebaseBridge.getMembers==='function')return window.HouseholdIdentityFirebaseBridge.getMembers()||[];
      if(window.TaskSharedData&&typeof window.TaskSharedData.members==='function')return window.TaskSharedData.members()||[];
    }catch(e){}
    return[];
  }
  function memberByUid(uidVal){var list=members();for(var i=0;i<list.length;i++){var m=list[i];if(String(m.uid||m.id)===String(uidVal))return m;}return null;}
  function displayNameFor(uidVal){var m=memberByUid(uidVal);return m?(m.displayName||m.name||null):null;}
  function myDisplayName(){try{return localStorage.getItem('familyapp-profile-name-v1')||window.myName||'Ik';}catch(e){return window.myName||'Ik';}}
  function initialsFor(name){return String(name||'G').trim().split(/\s+/).map(function(p){return p.charAt(0);}).join('').slice(0,2).toUpperCase()||'G';}
  function makeId(prefix){var store=fds();return store&&typeof store.makeId==='function'?store.makeId(prefix||'post'):(prefix||'post')+'_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,8);}

  function likesArray(row){var l=row&&row.likes;if(!l)return[];if(Array.isArray(l))return l.filter(Boolean);return Object.keys(l).filter(function(k){return l[k];});}
  function commentsArray(row){
    var c=row&&row.comments;if(!c)return[];
    var list=Array.isArray(c)?c.filter(Boolean).map(function(x,i){return Object.assign({},x,{_key:x._key||String(i)});}):Object.keys(c).map(function(k){var v=c[k];return v?Object.assign({},v,{_key:k}):null;}).filter(Boolean);
    return list.sort(function(a,b){return (a.createdAt||0)-(b.createdAt||0);});
  }

  // Projects the raw Firebase record map into the array shape the existing
  // Feed UI (feed.js) already knows how to render.
  function rows(value){
    if(!value)return[];
    return Object.keys(value).map(function(key){
      var raw=value[key];
      if(!raw||typeof raw!=='object')return null;
      var row=clone(raw)||{};
      row._key=key;
      if(row.id===undefined||row.id===null)row.id=key;
      row.likes=likesArray(row);
      row.comments=commentsArray(row);
      if(!row.authorDisplayName)row.authorDisplayName=row.author||displayNameFor(row.authorUid)||'Gezinslid';
      if(!row.author)row.author=row.authorDisplayName;
      if(!row.initials)row.initials=initialsFor(row.authorDisplayName);
      return row;
    }).filter(Boolean).sort(function(a,b){return (b.createdAt||0)-(a.createdAt||0);});
  }

  function publishProjection(value,source){
    window.feedData=rows(value);
    trace('snapshot received',{source:source,count:window.feedData.length});
    try{window.dispatchEvent(new CustomEvent('familyapp:feed-updated',{detail:{source:source||'shared',count:window.feedData.length}}));}catch(e){}
    try{
      var screen=document.getElementById('screen-feed');
      if(typeof window.renderFeed==='function'&&screen&&screen.classList.contains('active'))window.renderFeed();
    }catch(e){}
    try{if(typeof window.updateStats==='function')window.updateStats();}catch(e){}
  }

  // One-time migration of the retired FeedSharedLive whole-array doc
  // (families/{hid}/shared/feed) into individual feedPosts records.
  // Guarded by a migratedToFeedPosts marker on the legacy doc so it can
  // never run twice, and skipped entirely if feedPosts already has content.
  function migrateLegacyIfNeeded(){
    if(!ready()||migrating)return Promise.resolve(false);
    migrating=true;
    return fds().readShared(LEGACY_COLLECTION,null).then(function(legacy){
      if(!legacy||legacy.migratedToFeedPosts||!Array.isArray(legacy.items)||!legacy.items.length)return false;
      return fds().readShared(COLLECTION,{}).then(function(existing){
        if(existing&&Object.keys(existing).length)return false;
        var ts=now();
        var writes=legacy.items.map(function(p,i){
          var key=makeId('post');
          var row=clone(p)||{};
          row.id=key;row._key=key;
          row.authorDisplayName=row.author||row.authorDisplayName||'Gezinslid';
          row.author=row.authorDisplayName;
          row.authorUid=null; // legacy name-only posts have no reliable UID mapping
          row.createdAt=row.createdAt||(ts-i);
          row.updatedAt=row.updatedAt||row.createdAt;
          row.likes={}; // legacy likes were display-name strings; not safely mappable to uids
          var comments={};
          (Array.isArray(p.comments)?p.comments:[]).forEach(function(c,ci){
            comments[makeId('cmt')]={authorUid:null,authorDisplayName:c.author||'Gezinslid',author:c.author||'Gezinslid',initials:initialsFor(c.author),text:c.text||'',gifUrl:c.gifUrl||null,createdAt:row.createdAt+ci};
          });
          row.comments=comments;
          return fds().writeSharedRecord(COLLECTION,key,row);
        });
        return Promise.all(writes).then(function(){
          return fds().writeShared(LEGACY_COLLECTION,Object.assign({},legacy,{migratedToFeedPosts:true,migratedAt:now()}));
        }).then(function(){return true;});
      });
    }).catch(function(e){console.error('[FeedSharedData] legacy migration failed',e);return false;}).then(function(result){migrating=false;return result;});
  }

  function start(){
    if(started||!ready())return false;
    started=true;
    trace('start()',{uid:uid(),householdId:window.fbFamilyId});
    fds().subscribeShared(COLLECTION,function(value){
      attached=true;
      hasSnapshot=true;
      publishProjection(value,'firebase');
    },{});
    migrateLegacyIfNeeded();
    return true;
  }

  function findLocal(idOrKey){
    var target=String(idOrKey);
    return (window.feedData||[]).find(function(p){return String(p.id)===target||String(p._key)===target;})||null;
  }
  function keyFor(post){return post&&(post._key||String(post.id));}

  function createPost(data){
    if(!ready()){lastError='not-ready';return Promise.reject(new Error('Feed opslag is nog niet gereed'));}
    var me=uid(),name=myDisplayName(),key=makeId('post'),ts=now();
    var row={
      id:key,type:'post',authorUid:me,authorDisplayName:name,author:name,
      initials:initialsFor(name),color:(data&&data.color)||window.myColor||'#eaf7e5',
      text:(data&&data.text)||'',media:(data&&data.media)||null,mediaType:(data&&data.mediaType)||null,
      linkedEntity:(data&&data.linkedEntity)||null,
      createdAt:ts,updatedAt:ts,likes:{},comments:{}
    };
    trace('createPost begin',key);
    return fds().writeSharedRecord(COLLECTION,key,row).then(function(){
      trace('writeSharedRecord success',key);
      lastError=null;
      return row;
    }).catch(function(e){
      trace('writeSharedRecord FAILED',key+' '+(e&&e.message));
      lastError=(e&&e.message)||String(e);
      throw e;
    });
  }

  function canDelete(post){
    if(!post)return false;
    if(!post.authorUid)return true; // legacy/unowned post — any household member may clean it up
    return String(post.authorUid)===String(uid());
  }

  function deletePost(idOrKey){
    if(!ready())return Promise.reject(new Error('Feed opslag is nog niet gereed'));
    var post=findLocal(idOrKey);
    if(!post)return Promise.reject(new Error('Post niet gevonden'));
    if(!canDelete(post))return Promise.reject(new Error('Je kunt alleen je eigen posts verwijderen'));
    return fds().writeSharedRecord(COLLECTION,keyFor(post),null);
  }

  function toggleReaction(idOrKey){
    if(!ready())return Promise.reject(new Error('Feed opslag is nog niet gereed'));
    var post=findLocal(idOrKey),me=uid();
    if(!post)return Promise.reject(new Error('Post niet gevonden'));
    if(!me)return Promise.reject(new Error('Niet ingelogd'));
    var liked=(post.likes||[]).indexOf(me)>-1;
    return fds().writeSharedPath(COLLECTION,[keyFor(post),'likes',me],liked?null:true).then(function(){return{liked:!liked};});
  }

  function addComment(idOrKey,data){
    if(!ready())return Promise.reject(new Error('Feed opslag is nog niet gereed'));
    var post=findLocal(idOrKey),me=uid(),name=myDisplayName();
    if(!post)return Promise.reject(new Error('Post niet gevonden'));
    var commentKey=makeId('cmt');
    var comment={authorUid:me,authorDisplayName:name,author:name,initials:initialsFor(name),text:(data&&data.text)||'',gifUrl:(data&&data.gifUrl)||null,createdAt:now()};
    return fds().writeSharedPath(COLLECTION,[keyFor(post),'comments',commentKey],comment).then(function(){return comment;});
  }

  function getPosts(){return window.feedData||[];}
  function status(){return{
    started:started,
    ready:ready(),
    attached:attached,
    subscribed:attached,
    uid:uid(),
    householdId:window.fbFamilyId||null,
    count:(window.feedData||[]).length,
    hasSnapshot:hasSnapshot,
    lastError:lastError
  };}

  window.FeedSharedData={
    version:'1.0.0',start:start,createPost:createPost,deletePost:deletePost,
    toggleReaction:toggleReaction,addComment:addComment,getPosts:getPosts,
    canDelete:canDelete,members:members,status:status
  };

  function ensureStart(){start();}
  window.addEventListener('familyapp:household-changed',ensureStart);
  window.addEventListener('familyapp:household-identity-synced',ensureStart);
  window.addEventListener('familyapp:auth-ready',ensureStart);
  window.addEventListener('load',ensureStart,{once:true});
  if(document.readyState==='complete')ensureStart();else Promise.resolve().then(ensureStart);
})();
