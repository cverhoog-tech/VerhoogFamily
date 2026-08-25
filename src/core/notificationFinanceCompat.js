'use strict';
(function(){
  if(!window.NotificationEvents||NotificationEvents.financeSavingsUpdated)return;
  function ctx(){try{return HouseholdContext.snapshot();}catch(e){return null;}}
  function members(){try{if(window.TaskSharedData&&TaskSharedData.members)return TaskSharedData.members()||[];if(window.HouseholdIdentityFirebaseBridge&&HouseholdIdentityFirebaseBridge.getMembers)return HouseholdIdentityFirebaseBridge.getMembers()||[];if(window.HouseholdIdentity&&HouseholdIdentity.getMembers)return HouseholdIdentity.getMembers()||[];}catch(e){}return[];}
  function uid(m){return m&&(m.uid||m.id)||null;}
  function others(){var c=ctx(),me=c&&c.uid;return members().filter(function(m){return m&&m.status!=='inactive'&&m.status!=='removed';}).map(uid).filter(function(x){return x&&String(x)!==String(me);});}
  function part(v){return String(v==null?'':v).trim()||'unknown';}
  function key(){return Array.prototype.slice.call(arguments).map(part).join(':');}
  NotificationEvents.financeSavingsUpdated=function(goal,transaction){
    if(!goal)return Promise.reject(new Error('Spaardoel ontbreekt'));transaction=transaction||{};
    var type=transaction.type==='withdrawal'?'withdrawal':'deposit',amount=Math.abs(Number(transaction.amount)||0),who=transaction.who||window.myName||'Een gezinslid';
    var transactionId=transaction.id||transaction._key||key(transaction.date||'date',type,amount,who,transaction.note||''),eventKey=key('finance.savings.updated',goal.id||'goal',transactionId),store=window.NotificationStore;
    if(!store)return Promise.reject(new Error('NotificationStore niet beschikbaar'));if(store.registerType)store.registerType('finance.savings.updated');
    return store.publishToUidsOnce(eventKey,'finance.savings.updated',others(),{icon:'tasks',bg:'#dbeafe',tone:'finance',title:String(goal.icon||'🎯')+' '+String(goal.name||'Spaardoel'),body:String(who)+' '+(type==='deposit'?'zette € ':'nam € ')+amount.toFixed(0)+(type==='deposit'?' opzij':' op')+(transaction.note?' — '+String(transaction.note):''),entity:{type:'savingsGoal',id:String(goal.id||'')},data:{goalId:String(goal.id||''),transactionId:String(transaction.id||transaction._key||''),transactionType:type,amount:amount,who:String(who),date:String(transaction.date||''),note:String(transaction.note||'')}});
  };
})();
