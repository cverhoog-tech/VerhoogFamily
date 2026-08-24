'use strict';
// ============================================================
// FINANCE PROGRESSION BRIDGE v1.0.0 — STEP 9
//
// STEP 8 Finance remains frozen. This adapter changes no Finance calculation,
// storage shape or UI behavior; it only attaches deterministic canonical XP
// reward keys to the already-existing Finance side rewards.
// ============================================================
(function(){
  if(window.FinanceProgressionBridge)return;

  var VERSION='1.0.0';

  function runtime(){return window.ProgressionRuntime||null;}
  function finance(){return window.FinanceStore||null;}
  function queue(reason,options){
    var r=runtime();
    if(!r||typeof r.queueLegacyReward!=='function')return null;
    try{return r.queueLegacyReward(reason,options,2500);}catch(e){console.error('[FinanceProgressionBridge] queue failed',reason,e);return null;}
  }
  function state(){
    var f=finance();
    try{return f&&typeof f.get==='function'?f.get():null;}catch(e){return null;}
  }
  function goalById(snapshot,id){
    return snapshot&&Array.isArray(snapshot.savingsGoals)?snapshot.savingsGoals.find(function(g){return g&&String(g.id)===String(id);})||null:null;
  }
  function decorate(fn,marker){fn[marker]=true;return fn;}

  function wrapSavingsTransaction(){
    var f=finance();
    if(!f||typeof f.addSavingsTransaction!=='function')return false;
    if(f.addSavingsTransaction.__progressionFinanceBridge)return true;
    var raw=f.addSavingsTransaction;
    var wrapped=function(goalId,entry){
      var self=this,args=arguments,before=state(),goal=goalById(before,goalId),input=entry&&typeof entry==='object'?entry:{};
      return Promise.resolve(raw.apply(self,args)).then(function(logEntry){
        if(logEntry&&logEntry.id!=null){
          if(input._fromBudget!==true){
            queue('Spaartransactie',{
              key:'finance:savingsTx:'+String(goalId)+':'+String(logEntry.id),
              source:'finance-savings-transaction',
              sourceId:String(logEntry.id)
            });
          }
          if(goal){
            var amount=Math.max(0,Number(input.amount)||0);
            var projected=input.type==='deposit'?(Number(goal.saved)||0)+amount:Math.max(0,(Number(goal.saved)||0)-amount);
            if(projected>=Number(goal.target||0)&&Number(goal.target||0)>0){
              queue('Spaardoel bereikt',{
                key:'finance:savingsGoalReached:'+String(goalId),
                source:'finance-savings-goal',
                sourceId:String(goalId)
              });
            }
          }
        }
        return logEntry;
      });
    };
    decorate(wrapped,'__progressionFinanceBridge');
    wrapped.__wrappedFinanceSavingsTransaction=raw;
    f.addSavingsTransaction=wrapped;
    return true;
  }

  function wrapSavingsGoal(){
    var f=finance();
    if(!f||typeof f.addSavingsGoal!=='function')return false;
    if(f.addSavingsGoal.__progressionFinanceBridge)return true;
    var raw=f.addSavingsGoal;
    var wrapped=function(){
      var self=this,args=arguments;
      return Promise.resolve(raw.apply(self,args)).then(function(goal){
        if(goal&&goal.id!=null){
          queue('Spaardoel aangemaakt',{
            key:'finance:savingsGoalCreated:'+String(goal.id),
            source:'finance-savings-goal',
            sourceId:String(goal.id)
          });
        }
        return goal;
      });
    };
    decorate(wrapped,'__progressionFinanceBridge');
    wrapped.__wrappedFinanceSavingsGoal=raw;
    f.addSavingsGoal=wrapped;
    return true;
  }

  function wrapExtraIncome(){
    var f=finance();
    if(!f||typeof f.addExtraIncome!=='function')return false;
    if(f.addExtraIncome.__progressionFinanceBridge)return true;
    var raw=f.addExtraIncome;
    var wrapped=function(data){
      var self=this,args=arguments,input=data&&typeof data==='object'?data:{};
      return Promise.resolve(raw.apply(self,args)).then(function(record){
        // Budget -> savings linkage intentionally has no existing 'Eenmalig' XP
        // call, so do not leave a pending context for that internal record.
        if(!input._savingsBudgetRef&&record&&record.id!=null){
          queue('Eenmalig',{
            key:'finance:extraIncome:'+String(record.id),
            source:'finance-extra-income',
            sourceId:String(record.id)
          });
        }
        return record;
      });
    };
    decorate(wrapped,'__progressionFinanceBridge');
    wrapped.__wrappedFinanceExtraIncome=raw;
    f.addExtraIncome=wrapped;
    return true;
  }

  function wrapIncome(){
    var f=finance();
    if(!f||typeof f.setIncome!=='function')return false;
    if(f.setIncome.__progressionFinanceBridge)return true;
    var raw=f.setIncome;
    var wrapped=function(slot){
      var self=this,args=arguments;
      return Promise.resolve(raw.apply(self,args)).then(function(result){
        if(result&&result.updatedAt!=null){
          queue('Inkomen bijgesteld',{
            key:'finance:income:'+String(slot)+':'+String(result.updatedAt),
            source:'finance-income',
            sourceId:String(slot)
          });
        }
        return result;
      });
    };
    decorate(wrapped,'__progressionFinanceBridge');
    wrapped.__wrappedFinanceIncome=raw;
    f.setIncome=wrapped;
    return true;
  }

  function install(){
    return{
      savingsTransaction:wrapSavingsTransaction(),
      savingsGoal:wrapSavingsGoal(),
      extraIncome:wrapExtraIncome(),
      income:wrapIncome()
    };
  }

  window.FinanceProgressionBridge={
    version:VERSION,
    install:install,
    status:function(){
      var f=finance();
      return{
        savingsTransaction:!!(f&&f.addSavingsTransaction&&f.addSavingsTransaction.__progressionFinanceBridge),
        savingsGoal:!!(f&&f.addSavingsGoal&&f.addSavingsGoal.__progressionFinanceBridge),
        extraIncome:!!(f&&f.addExtraIncome&&f.addExtraIncome.__progressionFinanceBridge),
        income:!!(f&&f.setIncome&&f.setIncome.__progressionFinanceBridge)
      };
    }
  };

  window.addEventListener('familyapp:finance:changed',install);
  window.addEventListener('familyapp:progression-updated',install);
  window.addEventListener('load',install,{once:true});
  if(document.readyState==='complete')install();else Promise.resolve().then(install);
})();
