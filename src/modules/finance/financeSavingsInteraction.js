'use strict';
// ============================================================
// FINANCE SAVINGS INTERACTION v1.0.0
// Final compatibility owner for STEP 8 savings/add-sheet interactions.
// Keeps canonical FinanceStore persistence while repairing legacy UI ID and
// generic add-sheet routing mismatches on real devices.
// ============================================================
(function(){
  if(window.FinanceSavingsInteraction)return;
  var VERSION='1.0.0';
  var installTimer=null;

  function clone(v){if(v===undefined)return undefined;try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function store(){return window.FinanceStore||null;}
  function stateGoals(){var s=store()&&typeof store().get==='function'?store().get():null;return s&&Array.isArray(s.savingsGoals)?s.savingsGoals:[];}
  function sameId(a,b){return String(a==null?'':a)===String(b==null?'':b);}
  function canonicalGoal(goalId){return stateGoals().find(function(g){return g&&sameId(g.id,goalId);})||null;}
  function canonicalGoalId(goalId){var g=canonicalGoal(goalId);return g?g.id:goalId;}
  function canonicalLogId(goalId,logId){var g=canonicalGoal(goalId),log=g&&Array.isArray(g.log)?g.log:[];var row=log.find(function(l){return l&&sameId(l.id,logId);});return row?row.id:logId;}

  // The legacy finance UI uses data-* values, which are always strings. Older
  // household Finance records can still contain numeric ids. Normalize only
  // the presentation projection; canonical Firebase values stay untouched.
  function normalizeProjection(){
    if(Array.isArray(window.savingsGoals)){
      window.savingsGoals=window.savingsGoals.map(function(goal){
        var g=clone(goal)||{};
        if(g.id!==undefined&&g.id!==null)g.id=String(g.id);
        g.log=Array.isArray(g.log)?g.log.map(function(entry){var e=clone(entry)||{};if(e.id!==undefined&&e.id!==null)e.id=String(e.id);return e;}):[];
        return g;
      });
    }
    if(Array.isArray(window.extraIncome)){
      window.extraIncome=window.extraIncome.map(function(row){var next=clone(row)||{};if(next._savingsGoalId!==undefined&&next._savingsGoalId!==null)next._savingsGoalId=String(next._savingsGoalId);if(next._savingsBudgetRef!==undefined&&next._savingsBudgetRef!==null)next._savingsBudgetRef=String(next._savingsBudgetRef);return next;});
    }
  }

  function wrapStoreMethod(name,mapper){
    var s=store();if(!s||typeof s[name]!=='function'||s[name].__financeSavingsIdBridge)return false;
    var original=s[name];
    var wrapped=function(){var args=Array.prototype.slice.call(arguments);args=mapper(args);return original.apply(s,args);};
    wrapped.__financeSavingsIdBridge=true;
    s[name]=wrapped;
    return true;
  }

  function patchStore(){
    if(!store())return false;
    wrapStoreMethod('addSavingsTransaction',function(args){args[0]=canonicalGoalId(args[0]);return args;});
    wrapStoreMethod('updateSavingsGoal',function(args){args[0]=canonicalGoalId(args[0]);return args;});
    wrapStoreMethod('deleteSavingsGoal',function(args){args[0]=canonicalGoalId(args[0]);return args;});
    wrapStoreMethod('deleteSavingsLogEntry',function(args){var goalId=canonicalGoalId(args[0]);args[1]=canonicalLogId(goalId,args[1]);args[0]=goalId;return args;});
    return true;
  }

  function wrapUiFunction(name){
    var original=window[name];if(typeof original!=='function'||original.__financeSavingsProjectionWrapped)return false;
    var wrapped=function(){normalizeProjection();return original.apply(this,arguments);};
    wrapped.__financeSavingsProjectionWrapped=true;
    window[name]=wrapped;
    return true;
  }

  function patchUi(){
    ['openSavingsSheet','renderSparenDetail','openSavingsGoalSheet','saveSavingsTransaction','saveSavingsGoal','deleteSavingsGoal','openSparenVanuitBudget','saveSparenVanuitBudget','deleteExtraIncome'].forEach(wrapUiFunction);
    return typeof window.saveSavingsTransaction==='function'&&typeof window.saveSparenVanuitBudget==='function';
  }

  var SPECIAL_SAVE={
    savings_tx:'saveSavingsTransaction',
    savings_goal:'saveSavingsGoal',
    spaar_vanuit_budget:'saveSparenVanuitBudget',
    eenmalig:'saveEenmalig'
  };

  function patchSaveItem(){
    var original=window.saveItem;if(typeof original!=='function')return false;
    if(original.__financeSavingsWrapped)return true;
    var wrapped=function(){
      var type=window.currentAddType||'';
      var fnName=SPECIAL_SAVE[type];
      if(fnName){
        normalizeProjection();
        if(typeof window[fnName]==='function')return window[fnName]();
        if(typeof window.showToast==='function')window.showToast('Financiele actie is nog niet klaar');
        return false;
      }
      return original.apply(this,arguments);
    };
    wrapped.__financeSavingsWrapped=true;
    if(original.__calendarRepositoryWrapped)wrapped.__calendarRepositoryWrapped=true;
    window.saveItem=wrapped;
    return true;
  }

  function refreshSavingsIfVisible(){
    normalizeProjection();
    if(window.finTab==='sparen'&&typeof window.renderSparen==='function'){
      try{window.renderSparen();}catch(e){}
    }
  }

  function install(){
    var okStore=patchStore(),okUi=patchUi(),okSave=patchSaveItem();
    normalizeProjection();
    return okStore&&okUi&&okSave;
  }

  window.addEventListener('familyapp:finance:changed',refreshSavingsIfVisible);
  window.addEventListener('familyapp:household-context',function(){setTimeout(install,0);});
  install();
  var tries=0;
  installTimer=setInterval(function(){tries++;if(install()||tries>80){clearInterval(installTimer);installTimer=null;}},100);

  window.FinanceSavingsInteraction={version:VERSION,install:install,normalizeProjection:normalizeProjection,canonicalGoalId:canonicalGoalId,status:function(){return{version:VERSION,installed:!!(window.saveItem&&window.saveItem.__financeSavingsWrapped)};}};
})();
