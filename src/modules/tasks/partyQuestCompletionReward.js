'use strict';
// ============================================================
// PARTY QUEST COMPLETION + REWARD WORKER v4.0.0 — STEP 11.5
//
// Completion authority:
//   canonical linked Task completion -> PartyQuestService.completeFromTask()
// Reward authority:
//   frozen ProgressionStore.awardOnce()
//
// Party Quest rewardSettlements are durable diagnostics/work items only. They
// never claim XP ahead of ProgressionStore. A participant who is offline when
// the task completes keeps a pending settlement and receives it on a later
// authenticated session. The deterministic ProgressionStore reward key makes
// retries/crashes exactly-once per participant.
// ============================================================
(function(){
  if(window.__partyQuestCompletionRewardV4)return;
  window.__partyQuestCompletionRewardV4=true;

  var VERSION='4.0.0';
  var repoUnsubscribe=null;
  var contextUnsubscribe=null;
  var generation=0;
  var scheduled=false;
  var running=false;
  var rerun=false;
  var completionInFlight={};
  var rewardInFlight={};

  function clone(value){try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}}
  function context(){try{return window.HouseholdContext&&typeof HouseholdContext.snapshot==='function'?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function capture(){try{return window.HouseholdContext&&typeof HouseholdContext.capture==='function'?HouseholdContext.capture():null;}catch(e){return null;}}
  function isCurrent(token){try{return !!(window.HouseholdContext&&typeof HouseholdContext.isCurrent==='function'&&HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function readyContext(c){return !!(c&&c.ready===true&&c.uid&&c.householdId);}
  function repo(){return window.PartyQuestRepository||null;}
  function service(){return window.PartyQuestService||null;}
  function progression(){return window.ProgressionStore||null;}
  function taskRepo(){return window.TaskHouseholdRepository||window.TaskRepository||null;}
  function tasks(){
    var r=taskRepo();
    try{if(r&&typeof r.list==='function')return r.list()||[];}catch(e){}
    return Array.isArray(window.taskData)?window.taskData:[];
  }
  function taskById(id){var wanted=String(id||'');return tasks().find(function(t){return String(t&&(t.id||t._key)||'')===wanted;})||null;}
  function taskComplete(task){var status=String(task&&task.status||'').toLowerCase();return !!(task&&(task.done===true||task.completed===true||status==='done'||status==='completed'));}
  function settlements(q){return q&&q.rewardSettlements&&typeof q.rewardSettlements==='object'&&!Array.isArray(q.rewardSettlements)?q.rewardSettlements:{};}
  function questId(q){return String(q&&(q._key||q.id)||'');}

  function clearInFlight(){completionInFlight={};rewardInFlight={};}
  function stopRepo(){if(repoUnsubscribe){try{repoUnsubscribe();}catch(e){}repoUnsubscribe=null;}}
  function invalidate(){generation++;scheduled=false;running=false;rerun=false;clearInFlight();}

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    var myGeneration=generation;
    setTimeout(function(){
      scheduled=false;
      if(myGeneration!==generation)return;
      scan().catch(function(error){try{console.error('[PartyQuestCompletionReward] scan failed',error);}catch(e){}});
    },0);
  }

  function completionCandidate(q){
    if(!q||q.status!=='active'||!questId(q))return false;
    return taskComplete(taskById(q.questId));
  }

  function finalizeCompletion(q,token,myGeneration){
    var id=questId(q),s=service();
    if(!id||!s||typeof s.completeFromTask!=='function'||completionInFlight[id])return Promise.resolve(false);
    completionInFlight[id]=true;
    return Promise.resolve().then(function(){
      if(myGeneration!==generation||!isCurrent(token))throw new Error('STALE_PARTY_QUEST_CONTEXT');
      return s.completeFromTask(id);
    }).then(function(){
      if(myGeneration!==generation||!isCurrent(token))return false;
      return true;
    }).catch(function(error){
      var code=String(error&&(error.code||error.message)||'');
      // Concurrent clients may have completed/cancelled the quest first. The
      // repository snapshot will converge and the next scan handles it.
      if(!/PARTY_QUEST_ALREADY_|PARTY_QUEST_COMPLETION_REQUIRES_ACTIVE|PARTY_QUEST_NOT_COMPLETED|STALE_PARTY_QUEST_CONTEXT/.test(code)){
        try{console.warn('[PartyQuestCompletionReward] completion deferred',id,error);}catch(e){}
      }
      return false;
    }).finally(function(){delete completionInFlight[id];});
  }

  function settleForCurrentUser(q,token,myGeneration){
    var c=context(),uid=c&&String(c.uid||''),id=questId(q),map=settlements(q),row=uid&&map[uid];
    if(!uid||!id||!row||row.status==='settled'||!row.rewardKey||!row.occurrenceId)return Promise.resolve(false);
    var lock=id+'|'+uid+'|'+String(row.occurrenceId),p=progression(),s=service();
    if(rewardInFlight[lock])return Promise.resolve(false);
    if(!p||typeof p.awardOnce!=='function'||!s||typeof s.markRewardSettled!=='function')return Promise.resolve(false);
    rewardInFlight[lock]=true;

    return Promise.resolve().then(function(){
      if(myGeneration!==generation||!isCurrent(token))throw new Error('STALE_PARTY_QUEST_CONTEXT');
      return p.awardOnce(String(row.rewardKey),Math.max(0,Math.round(Number(row.amount)||0)),{
        reason:'Party Quest voltooid',
        source:'party-quest',
        sourceId:id
      });
    }).then(function(result){
      if(myGeneration!==generation||!isCurrent(token))throw new Error('STALE_PARTY_QUEST_CONTEXT');
      // awardOnce returns awarded:false when this deterministic reward already
      // exists. That is success for settlement purposes: the canonical reward
      // is present, which covers retry after a crash between XP and settlement.
      if(result&&result.error)throw new Error(result.error);
      if(typeof p.hasReward==='function'&&!p.hasReward(String(row.rewardKey)))throw new Error('PARTY_QUEST_REWARD_NOT_CONFIRMED');
      return s.markRewardSettled(id,String(row.occurrenceId)).then(function(){
        if(myGeneration!==generation||!isCurrent(token))return false;
        if(result&&result.awarded){
          try{if(typeof window.addActivity==='function')window.addActivity('🏆','#efe9fb','Party Quest voltooid: “'+String(q.questTitle||'Quest')+'”');}catch(e){}
          try{if(typeof window.showToast==='function')window.showToast('Party Quest voltooid! +'+Math.max(0,Math.round(Number(row.amount)||0))+' XP');}catch(e){}
        }
        return true;
      });
    }).catch(function(error){
      var code=String(error&&(error.code||error.message)||'');
      if(code.indexOf('STALE_PARTY_QUEST_CONTEXT')<0){try{console.warn('[PartyQuestCompletionReward] reward remains pending',lock,error);}catch(e){}}
      return false;
    }).finally(function(){delete rewardInFlight[lock];});
  }

  function processSnapshot(rows,token,myGeneration){
    rows=Array.isArray(rows)?rows:[];
    var chain=Promise.resolve();
    rows.forEach(function(q){
      if(completionCandidate(q))chain=chain.then(function(){return finalizeCompletion(q,token,myGeneration);});
    });
    return chain.then(function(){
      if(myGeneration!==generation||!isCurrent(token))return false;
      var r=repo(),latest=r&&typeof r.list==='function'?r.list()||[]:rows;
      var rewards=Promise.resolve();
      latest.forEach(function(q){if(q&&q.status==='completed')rewards=rewards.then(function(){return settleForCurrentUser(q,token,myGeneration);});});
      return rewards;
    });
  }

  function scan(){
    if(running){rerun=true;return Promise.resolve(false);}
    var c=context(),token=capture(),r=repo(),myGeneration=generation;
    if(!readyContext(c)||!token||!isCurrent(token)||!r||typeof r.list!=='function')return Promise.resolve(false);
    running=true;rerun=false;
    return processSnapshot(r.list()||[],token,myGeneration).finally(function(){
      if(myGeneration===generation)running=false;
      if(myGeneration===generation&&rerun){rerun=false;schedule();}
    });
  }

  function bindRepository(){
    stopRepo();
    var r=repo(),myGeneration=generation;
    if(!r||typeof r.subscribe!=='function')return false;
    repoUnsubscribe=r.subscribe(function(rows,meta){
      if(myGeneration!==generation)return;
      var c=context();
      if(!readyContext(c)||!meta||meta.ready!==true)return;
      if(meta.uid&&String(meta.uid)!==String(c.uid))return;
      if(meta.householdId&&String(meta.householdId)!==String(c.householdId))return;
      schedule();
    });
    return true;
  }

  function handleContext(next){
    invalidate();
    stopRepo();
    if(!readyContext(next))return;
    bindRepository();
    schedule();
  }

  function start(){
    if(!contextUnsubscribe&&window.HouseholdContext&&typeof HouseholdContext.subscribe==='function'){
      contextUnsubscribe=HouseholdContext.subscribe(handleContext);
    }
    var c=context();
    if(readyContext(c)&&!repoUnsubscribe){bindRepository();schedule();}
    return !!contextUnsubscribe;
  }
  function stop(){
    invalidate();stopRepo();
    if(contextUnsubscribe){try{contextUnsubscribe();}catch(e){}contextUnsubscribe=null;}
  }

  window.PartyQuestCompletionReward={
    version:VERSION,
    start:start,
    stop:stop,
    scan:scan,
    status:function(){var c=context();return{uid:c&&c.uid||null,householdId:c&&c.householdId||null,attached:!!repoUnsubscribe,running:running,generation:generation};}
  };

  window.addEventListener('familyapp:tasks-updated',schedule);
  window.addEventListener('familyapp:progression-updated',schedule);
  window.addEventListener('familyapp:session-state',start);
  window.addEventListener('load',start,{once:true});
  start();
})();
