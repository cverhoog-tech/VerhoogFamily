'use strict';
// ============================================================
// FAMILYAPP PROGRESSION UNLOCKS v1
// Account-bound ledger for level titles, milestone unlocks and legacy badges.
// ============================================================
(function(){
  if(window.FamilyProgressionUnlocks) return;
  var VERSION='1.0.0',COLLECTION='progressionUnlocks',STATE_KEY='current';
  var ledger={schemaVersion:1,unlocks:{},updatedAt:0},ready=false,saveTimer=null,wrapped=false;

  var FALLBACK_LEVEL_TITLES={
    1:'🥚 Huishoud-embryo',5:'🧦 Sokkenzoeker',10:'🔔 Reminder-addict',15:'💸 Budget-whisperer',20:'👑 Gezins-CEO',25:'🌌 Huishoud-Legende',30:'🌌 HUISHOUD-GOD',35:'💫 Supernova-planner'
  };
  var LEVEL_MILESTONES={
    5:{icon:'🧦',title:'Level 5 bereikt',desc:'Je eerste echte progression-mijlpaal.'},
    10:{icon:'⚡',title:'Level 10 bereikt',desc:'Dubbele cijfers. Je household-rang groeit.'},
    15:{icon:'🏅',title:'Level 15 bereikt',desc:'Je bent officieel een ervaren household-held.'},
    20:{icon:'👑',title:'Level 20 bereikt',desc:'Elite progression-status bereikt.'},
    25:{icon:'💎',title:'Level 25 bereikt',desc:'Legendarische household-status.'},
    30:{icon:'🌌',title:'Level 30 bereikt',desc:'Maximale klassieke rang bereikt.'},
    35:{icon:'🌀',title:'Level 35 bereikt',desc:'Voorbij de normale progression-grens.'}
  };

  function now(){return Date.now();}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function stableId(payload){
    payload=payload||{};
    var raw=[payload.type||'',payload.title||'',payload.who||'',payload.icon||''].join('|').toLowerCase();
    var h=0;for(var i=0;i<raw.length;i++)h=((h<<5)-h)+raw.charCodeAt(i)|0;
    return 'legacy_'+Math.abs(h);
  }
  function titleForLevel(level){
    try{
      if(Array.isArray(window.LEVEL_TITLES)){
        var found=LEVEL_TITLES.find(function(x){return Number(x.lv)===Number(level);});
        if(found&&found.title)return found.title;
      }
    }catch(e){}
    return FALLBACK_LEVEL_TITLES[level]||('Level '+level);
  }
  function has(id){return !!(id&&ledger.unlocks&&ledger.unlocks[id]);}
  function mark(id,data){if(!id||has(id))return false;ledger.unlocks[id]=Object.assign({id:id,unlockedAt:now()},data||{});ledger.updatedAt=now();persistSoon();return true;}
  function persistSoon(){if(saveTimer)clearTimeout(saveTimer);saveTimer=setTimeout(function(){saveTimer=null;persist();},180);}
  function persist(){
    if(window.FamilyDataStore&&FamilyDataStore.writePrivateRecord)return FamilyDataStore.writePrivateRecord(COLLECTION,STATE_KEY,ledger);
    try{localStorage.setItem('familyapp_progression_unlocks_v1',JSON.stringify(ledger));}catch(e){}
    return Promise.resolve({mode:'local'});
  }
  function load(){
    var fallback=null;try{fallback=JSON.parse(localStorage.getItem('familyapp_progression_unlocks_v1')||'null');}catch(e){}
    var read=(window.FamilyDataStore&&FamilyDataStore.readPrivate)?FamilyDataStore.readPrivate(COLLECTION,{}):Promise.resolve({current:fallback});
    return read.then(function(collection){var raw=collection&&collection[STATE_KEY];ledger=Object.assign({schemaVersion:1,unlocks:{},updatedAt:0},raw||fallback||{});ledger.unlocks=ledger.unlocks||{};ready=true;return clone(ledger);});
  }
  function show(payload){
    if(typeof window.queueUnlock==='function')return window.queueUnlock(payload);
    if(typeof window.showToast==='function')return showToast((payload.icon||'🏆')+' '+(payload.title||payload.type||'Unlock!'));
  }
  function onLevelUp(ev){
    if(!ready)return;var d=ev&&ev.detail||{},to=Number(d.to)||0;if(!to)return;
    for(var lv=(Number(d.from)||0)+1;lv<=to;lv++){
      var id='level:'+lv;if(has(id))continue;
      var milestone=LEVEL_MILESTONES[lv];
      mark(id,{kind:'level',level:lv,title:titleForLevel(lv)});
      if(milestone){
        show({icon:milestone.icon,type:'✨ Nieuwe rang',title:titleForLevel(lv),desc:milestone.desc,who:(window.myName||''),confetti:lv%10===0});
      }
    }
  }
  function onSkill(ev){
    if(!ready)return;var d=ev&&ev.detail||{},level=Number(d.level)||0,before=Number(d.beforeLevel)||0;if(level<=before)return;
    for(var lv=before+1;lv<=level;lv++){
      var id='skill:'+d.skillId+':'+lv;if(!has(id))mark(id,{kind:'skill',skillId:d.skillId,level:lv});
    }
  }
  function wrapLegacyUnlocks(){
    if(wrapped||typeof window.queueUnlock!=='function')return false;
    var original=window.queueUnlock;
    var replacement=function(payload){
      payload=payload||{};
      var explicit=payload.unlockId||payload.id||null;
      var id=explicit?('legacy:'+explicit):stableId(payload);
      if(ready&&has(id))return false;
      if(ready)mark(id,{kind:'legacy',title:payload.title||'',type:payload.type||'',icon:payload.icon||''});
      return original.apply(this,arguments);
    };
    replacement.__progressionUnlockLedger=true;
    window.queueUnlock=replacement;try{queueUnlock=replacement;}catch(e){}
    wrapped=true;return true;
  }
  function rerunAchievementChecks(){try{if(typeof window.checkAchievements==='function')checkAchievements();}catch(e){console.warn('[ProgressionUnlocks] achievement check',e);}}
  function boot(){
    var attempts=0,t=setInterval(function(){attempts++;if(window.FamilyDataStore){clearInterval(t);load().then(function(){wrapLegacyUnlocks();rerunAchievementChecks();});}else if(attempts>100){clearInterval(t);load().then(wrapLegacyUnlocks);}},100);
    var wrapTimer=setInterval(function(){if(wrapLegacyUnlocks())clearInterval(wrapTimer);},150);
    window.addEventListener('familyapp:progression:levelup',onLevelUp);
    window.addEventListener('familyapp:progression:skill',onSkill);
    window.addEventListener('familyapp:progression:taskreward',rerunAchievementChecks);
    window.addEventListener('familyapp:progression:xp',rerunAchievementChecks);
  }
  window.FamilyProgressionUnlocks={version:VERSION,load:load,persist:persist,has:has,getLedger:function(){return clone(ledger);},mark:mark};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
