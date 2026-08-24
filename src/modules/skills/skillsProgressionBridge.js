'use strict';
// ============================================================
// SKILLS PROGRESSION BRIDGE v4.0.0 — STEP 9
//
// The legacy Skills subsystem remains local/name-based for now, but every
// account-XP side effect is routed into canonical UID progression. This bridge
// does not make fam_skills_v1 canonical; it only removes that subsystem as an
// authority for account XP.
// ============================================================
(function(){
  if(window.__skillsProgressionBridgeV4)return;
  window.__skillsProgressionBridgeV4=true;

  var VERSION='4.0.0';

  function runtime(){return window.ProgressionRuntime||null;}
  function store(){return window.ProgressionStore||null;}
  function queue(reason,options){
    var r=runtime();
    if(!r||typeof r.queueLegacyReward!=='function')return null;
    try{return r.queueLegacyReward(reason,options,1500);}catch(e){console.error('[SkillsProgressionBridge] queue failed',reason,e);return null;}
  }
  function cancel(token){
    var r=runtime();
    if(token!=null&&r&&typeof r.cancelLegacyReward==='function')try{r.cancelLegacyReward(token);}catch(e){}
  }
  function week(){
    try{return typeof window.getWk==='function'?String(window.getWk()):String(getWk());}catch(e){return'unknown-week';}
  }
  function canonicalXp(){
    var s=store();
    try{if(s&&typeof s.getCurrentXp==='function')return Math.max(0,Math.round(Number(s.getCurrentXp())||0));}catch(e){}
    return Math.max(0,Math.round(Number(window.myXP)||0));
  }
  function restoreXp(xp){
    xp=Math.max(0,Math.round(Number(xp)||0));
    window.myXP=xp;
    try{myXP=xp;}catch(e){}
    try{localStorage.setItem('fam_myxp_v1',String(xp));}catch(e){}
  }
  function abilityById(id){return (window.ABILITIES||[]).find(function(a){return a&&String(a.id)===String(id);})||null;}

  function wrapLegacyLogSkill(){
    if(typeof window.logSkill!=='function')return false;
    if(window.logSkill.__canonicalSkillReward)return true;
    var raw=window.logSkill;
    var wrapped=function(person,skillId){
      var def=(window.SKILL_DEFS||[]).find(function(d){return d&&String(d.id)===String(skillId);});
      var personData=window.skillsData&&window.skillsData[person];
      var skillData=personData&&personData[skillId];
      var ordinal=((skillData&&skillData.log)||[]).length+1;
      var token=null;
      if(def){
        token=queue(def.name,{
          key:'skillLog:'+String(person)+':'+String(skillId)+':'+ordinal,
          source:'skill-log',
          sourceId:String(skillId)
        });
      }
      try{return raw.apply(this,arguments);}finally{if(token!=null)cancel(token);}
    };
    wrapped.__canonicalSkillReward=true;
    wrapped.__wrappedLogSkill=raw;
    window.logSkill=wrapped;
    return true;
  }

  function wrapQuestComplete(){
    if(typeof window.showQuestComplete!=='function')return false;
    if(window.showQuestComplete.__canonicalWeeklyQuestReward)return true;
    var raw=window.showQuestComplete;
    var wrapped=function(quest){
      var token=null;
      var alreadyEarned=false;
      try{alreadyEarned=typeof window.canEarnAbilityThisWeek==='function'?!window.canEarnAbilityThisWeek():false;}catch(e){}
      if(quest&&alreadyEarned){
        token=queue('Quest bonus',{
          key:'weeklyQuestBonus:'+week()+':'+String(quest.id),
          source:'weekly-quest',
          sourceId:String(quest.id)
        });
      }
      try{return raw.apply(this,arguments);}finally{if(token!=null)cancel(token);}
    };
    wrapped.__canonicalWeeklyQuestReward=true;
    wrapped.__wrappedQuestComplete=raw;
    window.showQuestComplete=wrapped;
    return true;
  }

  function wrapQuestClaim(){
    if(typeof window.claimQuestReward!=='function')return false;
    if(window.claimQuestReward.__canonicalWeeklyQuestClaim)return true;
    var raw=window.claimQuestReward;
    var wrapped=function(quest){
      if(!quest||quest.claimed)return raw.apply(this,arguments);
      var ability=abilityById(quest.abilityId);
      var token=ability?queue('Quest beloning',{
        key:'weeklyQuestReward:'+week()+':'+String(quest.id),
        source:'weekly-quest-claim',
        sourceId:String(quest.id)
      }):null;

      // The served legacy function references `ability` without defining it in
      // its own scope. Supplying the browser-global binding here preserves the
      // intended existing claim flow while this legacy module awaits STEP 16.
      var hadGlobal=Object.prototype.hasOwnProperty.call(window,'ability');
      var previous=window.ability;
      window.ability=ability;
      try{return raw.apply(this,arguments);}finally{
        if(hadGlobal)window.ability=previous;else try{delete window.ability;}catch(e){window.ability=undefined;}
        if(token!=null)cancel(token);
      }
    };
    wrapped.__canonicalWeeklyQuestClaim=true;
    wrapped.__wrappedQuestClaim=raw;
    window.claimQuestReward=wrapped;
    return true;
  }

  function silentAward(key,amount,meta){
    var s=store(),r=runtime();
    if(!s||typeof s.awardOnce!=='function')return Promise.resolve({awarded:false,error:'PROGRESSION_STORE_UNAVAILABLE'});
    return s.awardOnce(key,amount,meta).then(function(result){
      if(r&&typeof r.checkAchievements==='function')return Promise.resolve(r.checkAchievements()).then(function(){return result;});
      return result;
    }).catch(function(error){
      console.error('[SkillsProgressionBridge] silent reward failed',key,error);
      return{awarded:false,error:error&&error.message||String(error)};
    });
  }

  function wrapAbilityUse(){
    if(typeof window.useAbility!=='function')return false;
    if(window.useAbility.__canonicalAbilityReward)return true;
    var raw=window.useAbility;
    var wrapped=function(abilityId,taskId){
      var ability=abilityById(abilityId);
      if(!ability)return raw.apply(this,arguments);
      var inventory=window.myAbilities||{};
      var beforeCount=Math.max(0,Number(inventory[abilityId])||0);
      var beforeUsed=Math.max(0,Number(window.abilitiesUsed)||0);
      var beforeXp=canonicalXp();
      var token=null;

      if(beforeCount>0&&ability.type==='copycat'){
        var hasSource=(window.taskData||[]).some(function(t){return t&&t.done&&t.who&&t.who.indexOf(window.partnerName)>-1;});
        if(hasSource&&window.taskNextId!=null){
          token=queue('Kopieer-kat',{
            key:'ability:copycat:task:'+String(window.taskNextId),
            source:'ability',
            sourceId:String(abilityId)
          });
        }
      }else if(beforeCount>0&&ability.type==='auto_done'&&taskId!=null){
        token=queue('Auto-piloot',{
          key:'ability:autoDone:'+String(taskId),
          source:'ability',
          sourceId:String(abilityId)
        });
      }

      var result;
      try{result=raw.apply(this,arguments);}finally{if(token!=null)cancel(token);}

      if(beforeCount>0&&ability.type==='triple_xp'){
        var afterCount=Math.max(0,Number((window.myAbilities||{})[abilityId])||0);
        if(afterCount<beforeCount){
          // Remove the legacy direct `myXP += 4` bump before recording exactly
          // the same hidden +4 through canonical progression. Silent write keeps
          // the existing ability UX unchanged (no new popup was present before).
          restoreXp(beforeXp);
          silentAward(
            'ability:triple:'+week()+':use:'+(beforeUsed+1),
            4,
            {reason:'Triple-XP activatie',source:'ability',sourceId:String(abilityId)}
          );
        }
      }
      return result;
    };
    wrapped.__canonicalAbilityReward=true;
    wrapped.__wrappedAbilityUse=raw;
    window.useAbility=wrapped;
    return true;
  }

  function install(){
    return{
      skillLog:wrapLegacyLogSkill(),
      questComplete:wrapQuestComplete(),
      questClaim:wrapQuestClaim(),
      abilityUse:wrapAbilityUse()
    };
  }

  window.SkillsProgressionBridge={
    version:VERSION,
    install:install,
    status:function(){return{
      skillLog:!!(window.logSkill&&window.logSkill.__canonicalSkillReward),
      questComplete:!!(window.showQuestComplete&&window.showQuestComplete.__canonicalWeeklyQuestReward),
      questClaim:!!(window.claimQuestReward&&window.claimQuestReward.__canonicalWeeklyQuestClaim),
      abilityUse:!!(window.useAbility&&window.useAbility.__canonicalAbilityReward)
    };}
  };

  window.addEventListener('familyapp:progression-updated',install);
  window.addEventListener('load',install,{once:true});
  if(document.readyState==='complete')install();else Promise.resolve().then(install);
})();
