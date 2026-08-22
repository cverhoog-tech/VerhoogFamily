'use strict';
// ============================================================
// FAMILYAPP PROGRESSION ENGINE v2.0
// Canonical UID-private progression authority.
// users/{uid}/private/progression/current
// ============================================================
(function(){
  if(window.FamilyProgression && String(window.FamilyProgression.version||'').indexOf('2.')===0)return;

  var VERSION='2.0.0',COLLECTION='progression',STATE_KEY='current';
  var state=null,ready=false,loading=null,unsubscribe=null,boundUid=null,authBound=false,queued=[];

  function now(){return Date.now();}
  function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
  function user(){try{return window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||null;}catch(e){return null;}}
  function uid(){var u=user();return u&&u.uid||null;}
  function db(){try{return window.fbDb||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
  function householdId(){return window.fbFamilyId||null;}
  function skillDefs(){return Array.isArray(window.SKILL_DEFS)?window.SKILL_DEFS:[];}
  function blankSkill(){return{xp:0,log:[],updatedAt:0};}
  function fallbackLevel(xp){var lv=1,x=Math.max(0,Number(xp)||0);while(lv<100&&x>=Math.floor(70+(lv*55)+Math.pow(lv,1.7)*4)){x-=Math.floor(70+(lv*55)+Math.pow(lv,1.7)*4);lv++;}return lv;}
  function levelFromXp(xp){try{if(typeof window.getLevel==='function')return Math.max(1,Number(window.getLevel(Math.max(0,Number(xp)||0)))||1);}catch(e){}return fallbackLevel(xp);}
  function defaultState(){return{schemaVersion:2,revision:0,totalXp:0,level:1,skills:{},streaks:{current:0,best:0,lastActiveDate:null},achievements:{},stats:{tasksCompleted:0,questsCompleted:0,achievementsUnlocked:0,skillActions:0,streakEvents:0},events:{},createdAt:now(),updatedAt:now()};}
  function normalize(raw){
    var base=defaultState(),out=Object.assign(base,raw||{});
    out.schemaVersion=2;out.revision=Math.max(0,Number(out.revision)||0);out.totalXp=Math.max(0,Math.round(Number(out.totalXp)||0));out.level=levelFromXp(out.totalXp);
    out.skills=out.skills&&typeof out.skills==='object'?out.skills:{};
    skillDefs().forEach(function(def){var sk=out.skills[def.id]||blankSkill();sk.xp=Math.max(0,Math.round(Number(sk.xp)||0));sk.log=Array.isArray(sk.log)?sk.log:[];sk.updatedAt=Math.max(0,Number(sk.updatedAt)||0);out.skills[def.id]=sk;});
    out.streaks=Object.assign({current:0,best:0,lastActiveDate:null},out.streaks||{});
    out.achievements=out.achievements&&typeof out.achievements==='object'?out.achievements:{};
    out.stats=Object.assign({tasksCompleted:0,questsCompleted:0,achievementsUnlocked:0,skillActions:0,streakEvents:0},out.stats||{});
    out.events=out.events&&typeof out.events==='object'?out.events:{};
    out.createdAt=Number(out.createdAt)||now();out.updatedAt=Number(out.updatedAt)||now();
    return out;
  }
  function eventSeen(s,id){return !!(id&&s&&s.events&&s.events[id]);}
  function trimEvents(s){var ids=Object.keys(s.events||{});if(ids.length<=800)return;ids.sort(function(a,b){return Number(s.events[a].at||0)-Number(s.events[b].at||0);});ids.slice(0,ids.length-600).forEach(function(k){delete s.events[k];});}
  function markEvent(s,id,payload){if(!id)return;s.events[id]=Object.assign({at:now()},payload||{});trimEvents(s);}
  function emit(name,detail){try{window.dispatchEvent(new CustomEvent('familyapp:progression:'+name,{detail:detail||{}}));}catch(e){} }
  function emitLegacy(detail){try{window.dispatchEvent(new CustomEvent('familyapp:progression-updated',{detail:detail||{}}));}catch(e){} }
  function syncLegacyGlobals(source){
    if(!state)return;
    window.myXP=state.totalXp;try{if(typeof myXP!=='undefined')myXP=state.totalXp;}catch(e){}
    try{localStorage.setItem('fam_myxp_v1',String(state.totalXp));}catch(e){}
    try{if(typeof window.updateHomeXP==='function')window.updateHomeXP();}catch(e){}
    emitLegacy({uid:uid(),xp:state.totalXp,level:state.level,source:source||'progression'});
  }
  function setState(next,source){
    var incoming=normalize(next||{});
    if(state&&source==='firebase'&&incoming.revision<state.revision)return state;
    state=incoming;syncLegacyGlobals(source);emit('updated',{state:clone(state),source:source||'local'});return state;
  }
  function legacyLocalXp(){var vals=[];try{vals.push(Number(localStorage.getItem('fam_myxp_v1'))||0);}catch(e){}vals.push(Number(window.myXP)||0);return Math.max.apply(Math,[0].concat(vals));}
  function legacyHouseholdXp(){
    var d=db(),me=uid(),hid=householdId();if(!d||!me||!hid)return Promise.resolve(0);
    return d.ref('families/'+hid+'/members/'+me+'/xp').once('value').then(function(s){return Math.max(0,Math.round(Number(s.val())||0));}).catch(function(){return 0;});
  }
  function migrateInitial(){
    return legacyHouseholdXp().then(function(remoteXp){var s=defaultState();s.totalXp=Math.max(legacyLocalXp(),remoteXp);s.level=levelFromXp(s.totalXp);s.revision=1;s.updatedAt=now();return s;});
  }
  function subscribe(){
    if(unsubscribe){try{unsubscribe();}catch(e){}unsubscribe=null;}
    if(!window.FamilyDataStore||typeof FamilyDataStore.subscribePrivate!=='function')return;
    unsubscribe=FamilyDataStore.subscribePrivate(COLLECTION,function(collection,meta){
      if(!collection||!collection[STATE_KEY])return;
      setState(collection[STATE_KEY],meta&&meta.source==='firebase'?'firebase':'subscription');
    },{});
  }
  function flushQueue(){if(!ready||!queued.length)return;var list=queued.slice();queued=[];list.forEach(function(item){try{if(item.kind==='xp')awardXp.apply(null,item.args);else if(item.kind==='skill')awardSkill.apply(null,item.args);else if(item.kind==='achievement')unlockAchievement.apply(null,item.args);else if(item.kind==='streak')recordStreak.apply(null,item.args);}catch(e){}});}
  function reset(){ready=false;loading=null;boundUid=null;state=null;if(unsubscribe){try{unsubscribe();}catch(e){}unsubscribe=null;}}
  function load(){
    var me=uid();if(!me||!window.FamilyDataStore||typeof FamilyDataStore.readPrivate!=='function')return Promise.resolve(null);
    if(ready&&boundUid===me&&state)return Promise.resolve(clone(state));
    if(loading&&boundUid===me)return loading;
    if(boundUid&&boundUid!==me)reset();boundUid=me;
    loading=FamilyDataStore.readPrivate(COLLECTION,{}).then(function(collection){
      if(uid()!==me)return null;
      if(collection&&collection[STATE_KEY])return normalize(collection[STATE_KEY]);
      return migrateInitial().then(function(initial){return FamilyDataStore.writePrivateRecord(COLLECTION,STATE_KEY,initial).then(function(){return initial;});});
    }).then(function(next){
      loading=null;if(!next||uid()!==me)return null;ready=true;setState(next,'load');subscribe();emit('ready',{uid:me,state:clone(state)});flushQueue();return clone(state);
    }).catch(function(err){loading=null;emit('error',{stage:'load',message:err&&err.message?err.message:String(err)});return null;});
    return loading;
  }
  function unique(prefix){return(prefix||'event')+':'+now().toString(36)+':'+Math.random().toString(36).slice(2,8);}
  function mutate(eventId,eventMeta,mutator){
    if(!ready||!state)return{queued:true};
    if(eventId&&eventSeen(state,eventId))return{duplicate:true,state:clone(state)};
    var before=clone(state),local=normalize(clone(state));
    local=mutator(local)||local;local.revision=(Number(local.revision)||0)+1;local.updatedAt=now();markEvent(local,eventId,eventMeta);local.level=levelFromXp(local.totalXp);setState(local,'optimistic');
    var expectedRevision=local.revision;
    var persist=window.FamilyDataStore&&typeof FamilyDataStore.transactPrivatePath==='function'
      ? FamilyDataStore.transactPrivatePath(COLLECTION,[STATE_KEY],function(server){var s=normalize(server||defaultState());if(eventId&&eventSeen(s,eventId))return s;s=mutator(s)||s;s.revision=(Number(s.revision)||0)+1;s.updatedAt=now();markEvent(s,eventId,eventMeta);s.level=levelFromXp(s.totalXp);return s;},defaultState()).then(function(result){if(result&&result.value){var incoming=normalize(result.value);if(!state||incoming.revision>=state.revision)setState(incoming,'firebase');}return result;}).catch(function(err){emit('error',{stage:'persist',message:err&&err.message?err.message:String(err),eventId:eventId});return null;})
      : Promise.resolve(null);
    return{before:before,state:clone(local),revision:expectedRevision,persist:persist};
  }
  function awardXp(amount,meta){
    meta=meta||{};amount=Math.max(0,Math.round(Number(amount)||0));if(!amount)return null;
    if(!ready){queued.push({kind:'xp',args:[amount,meta]});load();return{queued:true,amount:amount};}
    var id=meta.eventId||unique(meta.type||'xp'),beforeLevel=state.level;
    var result=mutate(id,{type:meta.type||'xp',amount:amount,source:meta.source||'',taskId:meta.taskId||null,questId:meta.questId||null},function(s){s.totalXp+=amount;if(meta.type==='task')s.stats.tasksCompleted++;if(meta.type==='quest')s.stats.questsCompleted++;return s;});
    if(result&&result.duplicate)return result;
    var after=state;var payload={amount:amount,beforeLevel:beforeLevel,level:after.level,totalXp:after.totalXp,meta:meta,eventId:id};emit('xp',payload);if(after.level>beforeLevel)emit('levelup',{from:beforeLevel,to:after.level,totalXp:after.totalXp});return Object.assign(payload,{persist:result&&result.persist});
  }
  function awardSkill(skillId,amount,meta){
    meta=meta||{};var def=skillDefs().find(function(d){return d.id===skillId;});if(!def)return null;amount=Math.max(0,Math.round(Number(amount!=null?amount:def.xpPerDo)||0));if(!amount)return null;
    if(!ready){queued.push({kind:'skill',args:[skillId,amount,meta]});load();return{queued:true,skillId:skillId,amount:amount};}
    var id=meta.eventId||unique('skill:'+skillId),before=(state.skills[skillId]||blankSkill()).xp;
    var result=mutate(id,{type:'skill',skillId:skillId,amount:amount,source:meta.source||''},function(s){var sk=s.skills[skillId]||blankSkill();sk.xp=Math.max(0,Number(sk.xp)||0)+amount;sk.updatedAt=now();sk.log=Array.isArray(sk.log)?sk.log:[];sk.log.push({date:new Date().toISOString(),xp:amount,source:meta.source||'app'});if(sk.log.length>120)sk.log=sk.log.slice(-120);s.skills[skillId]=sk;s.stats.skillActions++;return s;});
    if(result&&result.duplicate)return result;var current=state.skills[skillId]||blankSkill(),payload={skillId:skillId,amount:amount,beforeXp:before,xp:current.xp,meta:meta,eventId:id};emit('skill',payload);return Object.assign(payload,{persist:result&&result.persist});
  }
  function stableTaskKey(task){if(!task)return'unknown';if(task.id!=null)return String(task.id);var raw=[task.title||'',task.date||'',task.createdAt||''].join('|'),h=0;for(var i=0;i<raw.length;i++)h=((h<<5)-h)+raw.charCodeAt(i)|0;return'legacy_'+Math.abs(h);}
  function detectSkill(title){var lower=String(title||'').toLowerCase(),map=window.TASK_SKILL_MAP||{},matched=null;(lower.match(/#\w+/g)||[]).forEach(function(tag){if(!matched&&map[tag])matched=map[tag];});if(!matched)Object.keys(map).some(function(k){if(lower.indexOf(k)>-1){matched=map[k];return true;}return false;});return matched;}
  function rewardXp(task){if(!task)return 4;var n=Number(task.rewardXp||task.xpAmount);if(isFinite(n)&&n>0)return Math.round(n);var m=String(task.xpReward||task.xp||'').match(/(\d+)/);return m?Math.max(1,parseInt(m[1],10)):4;}
  function awardTaskCompletion(task,o){
    o=o||{};if(!task)return null;var key=stableTaskKey(task),base='task:'+key+':completion:v2',xp=Math.max(1,Math.round(Number(o.xp!=null?o.xp:rewardXp(task))||4));
    var account=awardXp(xp,{eventId:base+':xp',type:'task',source:o.source||'task-complete',taskId:task.id});var skillId=o.skillId||detectSkill(task.title),skill=null;
    if(skillId){var def=skillDefs().find(function(d){return d.id===skillId;});skill=awardSkill(skillId,def?def.xpPerDo:undefined,{eventId:base+':skill:'+skillId,source:o.source||'task-complete'});}emit('taskreward',{taskId:task.id,key:key,account:account,skill:skill,skillId:skillId});return{account:account,skill:skill,skillId:skillId};
  }
  function awardQuestCompletion(quest,o){o=o||{};if(!quest)return null;var id=quest.id!=null?String(quest.id):stableTaskKey(quest),xp=Math.max(1,Math.round(Number(o.xp!=null?o.xp:rewardXp(quest))||4));return awardXp(xp,{eventId:o.eventId||('quest:'+id+':completion:v1'),type:'quest',source:o.source||'quest-complete',questId:quest.id});}
  function unlockAchievement(id,xp,meta){
    meta=meta||{};if(!id)return null;xp=Math.max(0,Math.round(Number(xp)||0));if(!ready){queued.push({kind:'achievement',args:[id,xp,meta]});load();return{queued:true,id:id};}
    if(state.achievements&&state.achievements[id])return{duplicate:true,id:id,state:clone(state)};var beforeLevel=state.level,eventId=meta.eventId||('achievement:'+id+':v1');
    var result=mutate(eventId,{type:'achievement',achievementId:id,amount:xp,source:meta.source||'achievement'},function(s){if(s.achievements[id])return s;s.achievements[id]={unlockedAt:now(),xp:xp,source:meta.source||'achievement'};s.stats.achievementsUnlocked++;if(xp)s.totalXp+=xp;return s;});
    if(result&&result.duplicate)return result;var payload={id:id,amount:xp,level:state.level,totalXp:state.totalXp,meta:meta};emit('achievement',payload);if(state.level>beforeLevel)emit('levelup',{from:beforeLevel,to:state.level,totalXp:state.totalXp});return Object.assign(payload,{persist:result&&result.persist});
  }
  function recordStreak(value,meta){
    meta=meta||{};value=Math.max(0,Math.round(Number(value)||0));if(!ready){queued.push({kind:'streak',args:[value,meta]});load();return{queued:true,value:value};}
    var xp=Math.max(0,Math.round(Number(meta.xp)||0)),eventId=meta.eventId||('streak:'+value+':'+(meta.date||new Date().toISOString().slice(0,10)));
    var result=mutate(eventId,{type:'streak',value:value,amount:xp,source:meta.source||'streak'},function(s){s.streaks.current=value;s.streaks.best=Math.max(Number(s.streaks.best)||0,value);s.streaks.lastActiveDate=meta.date||new Date().toISOString().slice(0,10);s.stats.streakEvents++;if(xp)s.totalXp+=xp;return s;});
    if(result&&result.duplicate)return result;var payload={value:value,best:state.streaks.best,amount:xp,totalXp:state.totalXp,eventId:eventId};emit('streak',payload);return Object.assign(payload,{persist:result&&result.persist});
  }
  function presentAward(result,label){if(!result||result.queued||result.duplicate)return;var amount=Number(result.amount)||0;if(amount){try{if(typeof window.showXPPopup==='function')window.showXPPopup(amount,label||'XP');}catch(e){}}try{if(result.level&&result.beforeLevel&&result.level>result.beforeLevel&&typeof window.showLevelUp==='function')setTimeout(function(){window.showLevelUp(result.level);},500);}catch(e){}try{if(typeof window.updateHomeXP==='function')window.updateHomeXP();}catch(e){} }
  function refreshDefinitions(){if(!state)return null;setState(state,'definitions');return clone(state);}
  function boot(){
    if(!authBound){try{if(window.firebase&&firebase.auth){firebase.auth().onAuthStateChanged(function(u){if(!u)reset();else load();});authBound=true;}}catch(e){}}
    return load();
  }
  window.FamilyProgression={version:VERSION,boot:boot,load:load,isReady:function(){return ready;},getState:function(){return state?clone(state):null;},getUid:uid,levelFromXp:levelFromXp,rewardXp:rewardXp,detectSkill:detectSkill,awardXp:awardXp,awardSkill:awardSkill,awardTaskCompletion:awardTaskCompletion,awardQuestCompletion:awardQuestCompletion,unlockAchievement:unlockAchievement,recordStreak:recordStreak,presentAward:presentAward,eventSeen:function(id){return eventSeen(state,id);},refreshDefinitions:refreshDefinitions,status:function(){return{version:VERSION,uid:uid(),ready:ready,boundUid:boundUid,totalXp:state?state.totalXp:0,revision:state?state.revision:0,queued:queued.length,storage:'users/{uid}/private/progression/current'};}};
  window.addEventListener('familyapp:auth-ready',boot);window.addEventListener('familyapp:household-identity-synced',boot);window.addEventListener('familyapp:household-changed',boot);window.addEventListener('online',boot);window.addEventListener('load',boot,{once:true});
  if(document.readyState==='complete')boot();else Promise.resolve().then(boot);
})();
