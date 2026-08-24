'use strict';
// ============================================================
// RECURRING TASK REWARD BRIDGE v1.0.0 — STEP 9
//
// Legacy recurring-task UI is retained, but XP is routed through the canonical
// ProgressionRuntime with stable occurrence keys. The old toggleRecDay() still
// contains a direct `myXP += 2`; this bridge immediately restores the canonical
// projection and records that reward through awardXP instead.
// ============================================================
(function(){
  if(window.RecurringTaskRewardBridge)return;

  var VERSION='1.0.0';
  var installedToggle=false;
  var installedDay=false;
  var rawToggle=null;
  var rawDay=null;

  function recurring(id){
    return (window.recurData||[]).find(function(row){return row&&String(row.id)===String(id);})||null;
  }
  function weekKey(){
    try{return typeof window.getWk==='function'?String(window.getWk()):String(getWk());}catch(e){return'';}
  }
  function monthKey(){
    try{return typeof window.getMk==='function'?String(window.getMk()):String(getMk());}catch(e){return'';}
  }
  function canonicalXp(){
    try{
      if(window.ProgressionStore&&typeof window.ProgressionStore.getCurrentXp==='function')return Math.max(0,Math.round(Number(window.ProgressionStore.getCurrentXp())||0));
    }catch(e){}
    return Math.max(0,Math.round(Number(window.myXP)||0));
  }
  function restoreCanonicalXp(value){
    var xp=Math.max(0,Math.round(Number(value)||0));
    window.myXP=xp;
    try{myXP=xp;}catch(e){}
    try{localStorage.setItem('fam_myxp_v1',String(xp));}catch(e){}
  }
  function rewardOptions(r,occurrence){
    return{
      key:'recurring:'+String(r.id)+':'+occurrence,
      source:'recurring-task',
      sourceId:String(r.id)
    };
  }
  function withRecurringAward(r,occurrence,fn){
    var currentAward=window.awardXP;
    if(typeof currentAward!=='function')return fn();
    var proxy=function(amount,reason,options){
      if(String(reason||'').toLowerCase()==='vaste taak'){
        options=options&&typeof options==='object'?Object.assign({},options):{};
        if(!options.key)Object.assign(options,rewardOptions(r,occurrence));
      }
      return currentAward.call(this,amount,reason,options);
    };
    window.awardXP=proxy;
    try{return fn();}finally{
      // Do not overwrite a newer runtime replacement that may have happened
      // during the synchronous legacy function call.
      if(window.awardXP===proxy)window.awardXP=currentAward;
    }
  }

  function installToggle(){
    if(typeof window.toggleRec!=='function')return false;
    if(window.toggleRec.__canonicalRecurringReward)return true;
    rawToggle=window.toggleRec;
    var wrapped=function(id){
      var r=recurring(id);
      if(!r)return rawToggle.apply(this,arguments);
      var occurrence=r.freq==='weekly'?'week:'+weekKey()+':complete':'month:'+monthKey()+':complete';
      return withRecurringAward(r,occurrence,function(){return rawToggle.apply(this,arguments);}.bind(this));
    };
    wrapped.__canonicalRecurringReward=true;
    wrapped.__wrappedRecurringToggle=rawToggle;
    window.toggleRec=wrapped;
    installedToggle=true;
    return true;
  }

  function installDay(){
    if(typeof window.toggleRecDay!=='function')return false;
    if(window.toggleRecDay.__canonicalRecurringDayReward)return true;
    rawDay=window.toggleRecDay;
    var wrapped=function(id,day){
      var r=recurring(id);
      if(!r)return rawDay.apply(this,arguments);
      var wk=weekKey();
      var beforeDays=(r.doneWeek&&r.doneWeek[wk])||[];
      var wasDone=beforeDays.indexOf(day)>-1;
      var beforeXp=canonicalXp();
      var result=rawDay.apply(this,arguments);

      // Legacy code mutates myXP directly only when a day changes undone -> done.
      // Canonical progression remains authoritative regardless of that mutation.
      restoreCanonicalXp(beforeXp);
      var afterDays=(r.doneWeek&&r.doneWeek[wk])||[];
      var nowDone=afterDays.indexOf(day)>-1;
      if(!wasDone&&nowDone&&typeof window.awardXP==='function'){
        window.awardXP(2,'Vaste taak dag',rewardOptions(r,'week:'+wk+':day:'+String(day)));
      }
      return result;
    };
    wrapped.__canonicalRecurringDayReward=true;
    wrapped.__wrappedRecurringDay=rawDay;
    window.toggleRecDay=wrapped;
    installedDay=true;
    return true;
  }

  function install(){
    installedToggle=installToggle()||installedToggle;
    installedDay=installDay()||installedDay;
    return installedToggle&&installedDay;
  }

  window.RecurringTaskRewardBridge={
    version:VERSION,
    install:install,
    status:function(){return{
      toggleInstalled:!!(window.toggleRec&&window.toggleRec.__canonicalRecurringReward),
      dayInstalled:!!(window.toggleRecDay&&window.toggleRecDay.__canonicalRecurringDayReward)
    };}
  };

  window.addEventListener('familyapp:progression-updated',install);
  window.addEventListener('familyapp:tasks-updated',install);
  window.addEventListener('load',install,{once:true});
  if(document.readyState==='complete')install();else Promise.resolve().then(install);
})();
