'use strict';
// ============================================================
// PERSON DASHBOARD SERVICE v1.2.0
// Read-only, UID-first view model for the Taken > Persoon tab.
// Avatar and hero presentation are resolved through canonical identity/media
// layers so renderers never need name heuristics or screen-specific crop rules.
// ============================================================
(function(){
  if(window.PersonDashboardService) return;

  var VERSION='1.2.0';
  var subscribers=[];
  var cachedIdentity=[];
  var cachedMemberRecords={};
  var memberRef=null;
  var memberHouseholdId=null;
  var booted=false;

  function db(){try{return window.fbDb||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
  function hid(){try{var c=window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;return c&&c.householdId||window.fbFamilyId||null;}catch(e){return window.fbFamilyId||null;}}
  function currentUid(){try{var c=window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;if(c&&c.uid)return c.uid;if(window.HouseholdIdentityFirebaseBridge&&HouseholdIdentityFirebaseBridge.getCurrentUid)return HouseholdIdentityFirebaseBridge.getCurrentUid();var u=window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser);return u&&u.uid||null;}catch(e){return null;}}
  function now(){return Date.now();}
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function number(v,fallback){var n=Number(v);return isFinite(n)?n:(fallback||0);}
  function rewardXp(task){if(window.ProgressionUidBridge&&typeof ProgressionUidBridge.rewardXp==='function')return ProgressionUidBridge.rewardXp(task);var m=String(task&&(task.rewardXp||task.xpAmount||task.xpReward||task.xp)||'').match(/(\d+)/);return m?Math.max(0,parseInt(m[1],10)):0;}
  function isDone(task){return !!(task&&(task.done===true||task.status==='completed'));}
  function helperUid(h){return String(h&&(h.uid||h.memberId||h.id)||'');}
  function isAssigned(task,uid){return !!(task&&uid&&((task.assignedToUids&&task.assignedToUids[uid])||String(task.assignedToUid||'')===String(uid)));}
  function isCreator(task,uid){return !!(task&&uid&&String(task.createdByUid||task.ownerUid||'')===String(uid));}
  function isHelper(task,uid){return !!(task&&uid&&Array.isArray(task.helpers)&&task.helpers.some(function(h){return helperUid(h)===String(uid);}));}
  function isParticipant(task,uid){return isAssigned(task,uid)||isCreator(task,uid)||isHelper(task,uid);}
  function taskRole(task,uid){var roles=[];if(isCreator(task,uid))roles.push('creator');if(isAssigned(task,uid))roles.push('assignee');if(isHelper(task,uid))roles.push('helper');return roles;}
  function taskRows(){if(window.TaskSharedData&&Array.isArray(window.taskData))return window.taskData.slice();if(window.TaskRepositoryAdapter&&typeof TaskRepositoryAdapter.listTasks==='function')return TaskRepositoryAdapter.listTasks()||[];return Array.isArray(window.taskData)?window.taskData.slice():[];}
  function normalizeTask(task,uid){var t=clone(task)||{};return{id:t.id,_key:t._key||null,title:t.title||t.name||'Taak',description:t.description||t.desc||'',type:t.type||t.questType||'SIDE QUEST',dueDate:t.date||t.dueDate||t.deadline||null,image:t.imageUrl||t.image||t.photo||'',xp:rewardXp(t),done:isDone(t),completedAt:number(t.completedAt,0)||null,completedByUid:t.completedByUid||null,roles:taskRole(t,uid),helpRequested:!!t.helpRequested,raw:t};}
  function weekAgo(){return now()-(7*24*60*60*1000);}
  function levelFromXp(xp){var n=Math.max(0,number(xp,0));try{if(typeof window.getLevel==='function')return Math.max(1,number(window.getLevel(n),1));}catch(e){}return Math.max(1,Math.floor(n/100)+1);}
  function xpBounds(level){var prev=0,next=level*100;try{if(Array.isArray(window.LEVEL_XP)){prev=number(window.LEVEL_XP[Math.max(0,level-1)],0);next=number(window.LEVEL_XP[Math.min(level,window.LEVEL_XP.length-1)],prev+200)||prev+200;}}catch(e){}if(next<=prev)next=prev+200;return{previous:prev,next:next};}
  function titleFor(level){try{var row=Array.isArray(window.LEVEL_TITLES)?window.LEVEL_TITLES[Math.min(Math.max(0,level-1),window.LEVEL_TITLES.length-1)]:null;return row&&(row.title||row.name)||'Avonturier';}catch(e){return'Avonturier';}}
  function achievementsFromRecord(record){var rows=(record&&record.achievements)||{};return Object.keys(rows).map(function(id){var a=rows[id];if(!a||a.unlocked===false)return null;return{id:id,unlocked:true,unlockedAt:number(a.unlockedAt,0)||null,xp:number(a.xp,0)};}).filter(Boolean).sort(function(a,b){return number(b.unlockedAt,0)-number(a.unlockedAt,0);});}
  function presenceState(member){var online=member&&member.online===true,ts=number(member&&member.lastSeen,0),age=ts?Math.max(0,now()-ts):Infinity;if(online)return'online';if(age<=15*60*1000)return'recent';if(age<=24*60*60*1000)return'today';return'offline';}
  function identityMembers(){try{if(window.HouseholdIdentityFirebaseBridge&&typeof HouseholdIdentityFirebaseBridge.getMembers==='function'){var list=HouseholdIdentityFirebaseBridge.getMembers();if(Array.isArray(list)&&list.length)cachedIdentity=list.slice();}}catch(e){}return cachedIdentity.slice();}
  function resolvedAvatar(identity,record){
    var direct=(identity&&(identity.avatar||identity.avatarUrl||identity.photoURL))||(record&&(record.avatar||record.avatarUrl||record.photoURL))||'';
    if(direct)return direct;
    try{if(window.FamilyAvatarIdentity&&typeof FamilyAvatarIdentity.resolveAvatar==='function'){var fromBridge=FamilyAvatarIdentity.resolveAvatar(identity||record);if(fromBridge)return fromBridge;}}catch(e){}
    try{if(window.HouseholdIdentity&&typeof HouseholdIdentity.resolveAvatar==='function'){var fromIdentity=HouseholdIdentity.resolveAvatar(identity&&identity.uid||identity&&identity.id||identity&&identity.displayName||'');if(fromIdentity)return fromIdentity;}}catch(e){}
    return'';
  }
  function resolvedHeroMedia(identity,record,avatar){
    try{if(window.ProfileMedia&&typeof ProfileMedia.resolveHeroMedia==='function')return ProfileMedia.resolveHeroMedia(identity,record,avatar);}catch(e){}
    return Object.freeze({url:String(avatar||''),focalX:0.5,focalY:0.5,zoom:1,fit:'cover'});
  }
  function buildMember(identity){var uid=String(identity.uid||identity.id||''),record=cachedMemberRecords[uid]||{},avatar=resolvedAvatar(identity,record),heroMedia=resolvedHeroMedia(identity,record,avatar),xp=number(record.xp,0),level=levelFromXp(xp),bounds=xpBounds(level),all=taskRows(),mine=all.filter(function(t){return isParticipant(t,uid);}),active=mine.filter(function(t){return !isDone(t);}).map(function(t){return normalizeTask(t,uid);}),completed=mine.filter(isDone),recentCompleted=completed.filter(function(t){return number(t.completedAt,0)>=weekAgo();}),earned=completed.filter(function(t){return String(t.completedByUid||'')===uid&&number(t.completedAt,0)>=weekAgo();}).reduce(function(sum,t){return sum+rewardXp(t);},0),achievements=achievementsFromRecord(record);return{
      uid:uid,
      member:{uid:uid,displayName:identity.displayName||identity.name||record.name||'Gezinslid',avatar:avatar,heroMedia:heroMedia,initials:identity.initials||'',role:identity.role||record.role||'member',isCurrent:uid===String(currentUid()||'')},
      presence:{state:presenceState(identity),online:identity.online===true,lastSeen:identity.lastSeen||null,area:identity.area||''},
      progression:{xp:xp,level:level,title:titleFor(level),previousLevelXp:bounds.previous,nextLevelXp:bounds.next,streak:null},
      quests:{active:active,activeCount:active.length,completedCount:completed.length,completedThisWeek:recentCompleted.length,earnedXpThisWeek:earned},
      achievements:{unlocked:achievements,recent:achievements.slice(0,6),total:achievements.length},
      activity:{recent:[]},
      capabilities:{identity:true,presence:true,progression:true,quests:true,achievements:true,streak:false,activity:false}
    };}
  function snapshot(){return identityMembers().map(buildMember);}
  function notify(){var data=snapshot();subscribers.slice().forEach(function(fn){try{fn(data.slice());}catch(e){console.warn('[PersonDashboardService] subscriber failed',e);}});try{window.dispatchEvent(new CustomEvent('familyapp:person-dashboard-updated',{detail:{members:data,version:VERSION}}));}catch(e){}return data;}
  function detachMembers(){if(memberRef)try{memberRef.off();}catch(e){}memberRef=null;memberHouseholdId=null;cachedMemberRecords={};}
  function attachMembers(){var d=db(),family=hid();if(!d||!family)return false;if(memberRef&&memberHouseholdId===family)return true;detachMembers();memberHouseholdId=family;memberRef=d.ref('families/'+family+'/members');memberRef.on('value',function(s){cachedMemberRecords=s.val()||{};notify();});return true;}
  function refresh(){attachMembers();return notify();}
  function subscribe(fn){if(typeof fn!=='function')return function(){};subscribers.push(fn);try{fn(snapshot());}catch(e){}refresh();return function(){var i=subscribers.indexOf(fn);if(i>=0)subscribers.splice(i,1);};}
  function get(uid){var id=String(uid||'');return snapshot().find(function(m){return m.uid===id;})||null;}
  function boot(){if(booted){refresh();return;}booted=true;attachMembers();refresh();}

  window.PersonDashboardService={
    version:VERSION,
    getMembers:snapshot,
    get:get,
    subscribe:subscribe,
    refresh:refresh,
    status:function(){return{version:VERSION,householdId:hid(),currentUid:currentUid(),memberCount:identityMembers().length,memberRecords:Object.keys(cachedMemberRecords||{}).length,attached:!!memberRef,capabilities:{streak:false,activity:false,heroMedia:!!window.ProfileMedia}};}
  };

  window.addEventListener('familyapp:household-identity-synced',function(e){var members=e&&e.detail&&e.detail.members;if(Array.isArray(members))cachedIdentity=members.slice();boot();});
  window.addEventListener('familyapp:household-context-changed',function(){detachMembers();booted=false;boot();});
  window.addEventListener('familyapp:tasks-updated',notify);
  window.addEventListener('familyapp:progression-updated',notify);
  window.addEventListener('familyapp:avatar-updated',notify);
  if(window.HouseholdContext&&typeof HouseholdContext.subscribe==='function')HouseholdContext.subscribe(function(){if(booted)refresh();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
