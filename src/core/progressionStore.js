'use strict';
// ============================================================
// PROGRESSION STORE v1.1.0
// Promise-based facade over FamilyProgression. No second persistence authority.
// ============================================================
(function(){
  if(window.ProgressionStore&&window.ProgressionStore.version==='1.1.0')return;
  function engine(){return window.FamilyProgression||null;}function now(){return Date.now();}
  function ensure(){var e=engine();return e&&e.isReady&&e.isReady()?Promise.resolve(true):(e&&e.load?e.load().then(function(){return!!(e.isReady&&e.isReady());}):Promise.resolve(false));}
  function get(){var e=engine(),s=e&&e.getState?e.getState():null;return s||{schemaVersion:2,totalXp:0,level:1,skills:{},stats:{},streak:{current:0,best:0,lastActiveDate:null},achievements:{},events:{}};}
  function publishAchievement(row){if(!row||row.duplicate||!window.ActivityService||typeof ActivityService.publish!=='function')return Promise.resolve(row);return ActivityService.publish({type:'achievement.unlocked',module:'progression',entityType:'achievement',entityId:String(row.id||row.achievement&&row.achievement.id||''),idempotencyKey:'achievement:'+String(row.unlockedBy||'self')+':'+String(row.id||''),payload:{achievementId:String(row.id||''),name:String(row.name||''),icon:String(row.icon||''),xp:Number(row.xp||0)||0,rarity:String(row.rarity||'')}}).catch(function(){}).then(function(){return row;});}
  function awardXP(amount,reason,meta){return ensure().then(function(ok){if(!ok)throw new Error('PROGRESSION_NOT_READY');var e=engine(),eventId=meta&&meta.eventId||null,result=e.awardXp(amount,{eventId:eventId,type:meta&&meta.type||'xp',source:reason||meta&&meta.source||'',meta:meta||{}});return e.persist().then(function(){return result;});});}
  function unlockAchievement(id,data){return ensure().then(function(ok){if(!ok)throw new Error('PROGRESSION_NOT_READY');var e=engine(),row=e.unlockAchievement(id,data||{});if(row&&row.duplicate)return row;return e.persist().then(function(){return publishAchievement(row);});});}
  function logSkill(skillId,xp,meta){return ensure().then(function(ok){if(!ok)throw new Error('PROGRESSION_NOT_READY');var e=engine(),result=e.awardSkill(skillId,xp,{eventId:meta&&meta.eventId||null,source:meta&&meta.source||'app'});return e.persist().then(function(){return result;});});}
  function setStreak(current,lastActiveDate){return ensure().then(function(ok){if(!ok)throw new Error('PROGRESSION_NOT_READY');var e=engine(),result=e.setStreak(current,lastActiveDate);return e.persist().then(function(){return result;});});}
  function incrementCounter(name,delta){return ensure().then(function(ok){if(!ok)throw new Error('PROGRESSION_NOT_READY');var e=engine(),result=e.incrementCounter(name,delta);return e.persist().then(function(){return result;});});}
  window.ProgressionStore={version:'1.1.0',ready:ensure,start:ensure,stop:function(){var e=engine();if(e&&e.stop)e.stop();},rebind:function(){var e=engine();return e&&e.rebind?e.rebind():Promise.resolve(null);},get:get,awardXP:awardXP,unlockAchievement:unlockAchievement,logSkill:logSkill,setStreak:setStreak,incrementCounter:incrementCounter,skill:function(id){var s=get().skills||{};return s[id]||{xp:0,log:[]};},status:function(){var e=engine();return e&&e.status?e.status():{version:'1.1.0',ready:false,at:now()};}};
})();
