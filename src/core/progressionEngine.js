'use strict';
// ============================================================
// FAMILYAPP PROGRESSION ENGINE v1
// Authoritative account-bound XP + skill progression.
// Persists under users/{uid}/private/progression via FamilyDataStore.
// ============================================================
(function(){
  if(window.FamilyProgression) return;

  var VERSION='1.0.0';
  var COLLECTION='progression';
  var STATE_KEY='current';
  var state=null;
  var ready=false;
  var saveTimer=null;
  var installed=false;

  function now(){return Date.now();}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function user(){
    try{return window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||null;}catch(e){return null;}
  }
  function userName(){
    var u=user();
    return (u&&u.displayName)||window.myName||'Gebruiker';
  }
  function levelXp(lv){return Math.floor(70+(lv*55)+Math.pow(lv,1.7)*4);}
  function totalForLevel(lv){var t=0;for(var i=1;i<lv;i++)t+=levelXp(i);return t;}
  function levelFromXp(xp){var lv=1,x=Math.max(0,Number(xp)||0);while(x>=totalForLevel(lv+1)&&lv<100)lv++;return lv;}

  function blankSkill(){return{xp:0,log:[],updatedAt:0};}
  function defaultState(){
    var skills={};
    if(window.SKILL_DEFS&&Array.isArray(SKILL_DEFS))SKILL_DEFS.forEach(function(d){skills[d.id]=blankSkill();});
    return{schemaVersion:1,totalXp:0,level:1,skills:skills,stats:{tasksCompleted:0,skillActions:0},events:{},createdAt:now(),updatedAt:now()};
  }
  function normalize(raw){
    var out=Object.assign(defaultState(),raw||{});
    out.totalXp=Math.max(0,Number(out.totalXp)||0);
    out.level=levelFromXp(out.totalXp);
    out.skills=out.skills||{};
    if(window.SKILL_DEFS&&Array.isArray(SKILL_DEFS))SKILL_DEFS.forEach(function(d){
      var sk=out.skills[d.id]||blankSkill();
      sk.xp=Math.max(0,Number(sk.xp)||0);sk.log=Array.isArray(sk.log)?sk.log:[];out.skills[d.id]=sk;
    });
    out.stats=Object.assign({tasksCompleted:0,skillActions:0},out.stats||{});
    out.events=out.events||{};
    return out;
  }
  function migrateLegacy(base){
    var migrated=false,name=userName();
    try{
      var raw=localStorage.getItem('fam_skills_v1');
      if(raw){
        var saved=JSON.parse(raw),legacy=saved&&saved[name];
        if(!legacy&&saved){
          var keys=Object.keys(saved);if(keys.length===1)legacy=saved[keys[0]];
        }
        if(legacy){
          Object.keys(legacy).forEach(function(id){
            var old=legacy[id];if(!old)return;
            var cur=base.skills[id]||blankSkill();
            if((Number(old.xp)||0)>cur.xp){cur.xp=Number(old.xp)||0;cur.log=Array.isArray(old.log)?old.log.slice(-100):[];cur.updatedAt=now();base.skills[id]=cur;migrated=true;}
          });
        }
      }
      if(window.AppState&&typeof AppState.get==='function'){
        var localXp=Number(AppState.get('xp'))||0;
        if(localXp>base.totalXp){base.totalXp=localXp;migrated=true;}
      }
    }catch(e){console.warn('[Progression] legacy migration skipped',e);}
    base.level=levelFromXp(base.totalXp);
    if(migrated)base.migratedLegacyAt=now();
    return base;
  }

  function emit(type,detail){
    try{window.dispatchEvent(new CustomEvent('familyapp:progression:'+type,{detail:detail||{}}));}catch(e){}
  }
  function syncLegacyViews(){
    if(!state)return;
    var name=userName();
    if(window.skillsData&&typeof skillsData==='object'){
      if(!skillsData[name])skillsData[name]={};
      Object.keys(state.skills).forEach(function(id){skillsData[name][id]=clone(state.skills[id]);});
      if(typeof window.skillsViewPerson==='string')window.skillsViewPerson=name;
      try{skillsViewPerson=name;}catch(e){}
    }
    if(window.AppState&&typeof AppState.set==='function'){
      var current=Number(AppState.get('xp'))||0;
      if(current!==state.totalXp)AppState.set('xp',state.totalXp);
    }
  }
  function persistSoon(){
    if(saveTimer)clearTimeout(saveTimer);
    saveTimer=setTimeout(function(){saveTimer=null;persist();},180);
  }
  function persist(){
    if(!state)return Promise.resolve();
    state.updatedAt=now();
    if(window.FamilyDataStore&&FamilyDataStore.writePrivateRecord){
      return FamilyDataStore.writePrivateRecord(COLLECTION,STATE_KEY,state).then(function(result){emit('saved',{state:clone(state),result:result});return result;});
    }
    try{localStorage.setItem('familyapp_progression_fallback_v1',JSON.stringify(state));}catch(e){}
    return Promise.resolve({mode:'local'});
  }

  function eventSeen(id){return !!(id&&state&&state.events&&state.events[id]);}
  function markEvent(id,payload){if(!id)return;if(!state.events)state.events={};state.events[id]=Object.assign({at:now()},payload||{});var ids=Object.keys(state.events);if(ids.length>500){ids.sort(function(a,b){return(state.events[a].at||0)-(state.events[b].at||0);});ids.slice(0,ids.length-400).forEach(function(k){delete state.events[k];});}}

  function awardAccountXp(amount,meta){
    if(!ready||!state)return null;
    amount=Math.max(0,Math.round(Number(amount)||0));if(!amount)return null;
    meta=meta||{};if(meta.eventId&&eventSeen(meta.eventId))return{duplicate:true,state:clone(state)};
    var before=state.level;
    state.totalXp+=amount;state.level=levelFromXp(state.totalXp);
    if(meta.type==='task')state.stats.tasksCompleted=(state.stats.tasksCompleted||0)+1;
    markEvent(meta.eventId,{type:meta.type||'xp',amount:amount,source:meta.source||''});
    syncLegacyViews();persistSoon();
    emit('xp',{amount:amount,beforeLevel:before,level:state.level,totalXp:state.totalXp,meta:meta});
    if(state.level>before)emit('levelup',{from:before,to:state.level,totalXp:state.totalXp});
    return{amount:amount,level:state.level,totalXp:state.totalXp};
  }

  function awardSkill(skillId,amount,meta){
    if(!ready||!state)return null;
    meta=meta||{};if(meta.eventId&&eventSeen(meta.eventId))return{duplicate:true,state:clone(state)};
    var def=window.SKILL_DEFS&&SKILL_DEFS.find(function(d){return d.id===skillId;});
    if(!def)return null;
    amount=Math.max(0,Math.round(Number(amount!=null?amount:def.xpPerDo)||0));if(!amount)return null;
    var sk=state.skills[skillId]||blankSkill();
    var oldLevel=typeof window.skillLevelFromXp==='function'?skillLevelFromXp(sk.xp):1;
    sk.xp+=amount;sk.updatedAt=now();sk.log.push({date:new Date().toISOString(),xp:amount,source:meta.source||'app'});if(sk.log.length>100)sk.log=sk.log.slice(-100);
    state.skills[skillId]=sk;state.stats.skillActions=(state.stats.skillActions||0)+1;
    var newLevel=typeof window.skillLevelFromXp==='function'?skillLevelFromXp(sk.xp):oldLevel;
    markEvent(meta.eventId,{type:'skill',skillId:skillId,amount:amount,source:meta.source||''});
    syncLegacyViews();persistSoon();
    emit('skill',{skillId:skillId,amount:amount,xp:sk.xp,beforeLevel:oldLevel,level:newLevel,meta:meta});
    if(newLevel>oldLevel&&typeof window.showSkillLevelUp==='function')showSkillLevelUp(userName(),def,newLevel);
    return{skillId:skillId,xp:sk.xp,level:newLevel};
  }

  function installLegacyBridges(){
    if(installed)return;installed=true;
    var tries=0,t=setInterval(function(){
      tries++;
      if(typeof window.awardXP==='function'&&!window.awardXP.__progressionWrapped){
        var oldAward=window.awardXP;
        var wrapped=function(amount,source){var result=oldAward.apply(this,arguments);awardAccountXp(amount,{source:source||'legacy',type:'xp'});return result;};
        wrapped.__progressionWrapped=true;window.awardXP=wrapped;try{awardXP=wrapped;}catch(e){}
      }
      if(typeof window.awardSkillXP==='function'&&!window.awardSkillXP.__progressionWrapped){
        var wrappedSkill=function(person,skillId){
          var name=userName();
          if(person&&person!==name&&person!==window.myName){return;}
          var def=window.SKILL_DEFS&&SKILL_DEFS.find(function(d){return d.id===skillId;});
          return awardSkill(skillId,def?def.xpPerDo:0,{source:'task-auto'});
        };
        wrappedSkill.__progressionWrapped=true;window.awardSkillXP=wrappedSkill;try{awardSkillXP=wrappedSkill;}catch(e){}
      }
      if(typeof window.logSkill==='function'&&!window.logSkill.__progressionWrapped){
        var wrappedLog=function(person,skillId){return window.awardSkillXP(person,skillId);};wrappedLog.__progressionWrapped=true;window.logSkill=wrappedLog;try{logSkill=wrappedLog;}catch(e){}
      }
      if(tries>80)clearInterval(t);
    },100);
  }

  function load(){
    var fallback=null;try{fallback=JSON.parse(localStorage.getItem('familyapp_progression_fallback_v1')||'null');}catch(e){}
    var read=(window.FamilyDataStore&&FamilyDataStore.readPrivate)?FamilyDataStore.readPrivate(COLLECTION,{}):Promise.resolve({current:fallback});
    return read.then(function(collection){
      var raw=collection&&collection[STATE_KEY];
      state=migrateLegacy(normalize(raw||fallback||{}));ready=true;syncLegacyViews();persistSoon();emit('ready',{state:clone(state)});return clone(state);
    });
  }
  function boot(){installLegacyBridges();var attempts=0,t=setInterval(function(){attempts++;if(window.FamilyDataStore&&user()){clearInterval(t);load();}else if(attempts>100){clearInterval(t);state=migrateLegacy(normalize({}));ready=true;syncLegacyViews();emit('ready',{state:clone(state),offline:true});}},100);}

  window.FamilyProgression={
    version:VERSION,boot:boot,load:load,persist:persist,
    getState:function(){return state?clone(state):null;},isReady:function(){return ready;},
    levelFromXp:levelFromXp,xpForLevel:levelXp,totalXpForLevel:totalForLevel,
    awardXp:awardAccountXp,awardSkill:awardSkill
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
