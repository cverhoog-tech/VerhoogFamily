'use strict';
// ============================================================
// ACTIVITY DOMAIN PRODUCERS v1.0.0 — STEP 13.2
// Projects successful canonical domain mutations into immutable activityEvents.
// It owns NO domain persistence. Activity write failures never roll back the
// successful task/meal/shopping/party mutation and are safe to retry because
// every producer supplies a deterministic occurrenceKey.
// ============================================================
(function(){
  if(window.ActivityDomainProducers)return;

  var VERSION='1.0.0';
  var TYPES=Object.freeze({
    TASK_CREATED:'task.created',
    TASK_COMPLETED:'task.completed',
    MEAL_PLANNED:'meal.planned',
    SHOPPING_COMPLETED:'shopping.completed',
    PARTY_QUEST_COMPLETED:'partyQuest.completed'
  });
  var state={installed:{},lastError:null};

  function now(){return Date.now();}
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function activity(){return window.HouseholdActivity||null;}
  function publish(input){
    var a=activity();
    if(!a||typeof a.publish!=='function')return Promise.resolve(null);
    return a.publish(input).then(function(event){state.lastError=null;return event;}).catch(function(error){state.lastError=error&&error.message||String(error);try{console.warn('[ActivityDomainProducers] deferred activity projection',input&&input.type,error);}catch(e){}return null;});
  }
  function taskTitle(task){return String(task&&(task.title||task.name)||'Taak');}
  function taskXp(task){var raw=task&&(task.xp||task.rewardXp||task.reward||task.xpReward);if(typeof raw==='number')return raw;var m=String(raw||'').match(/\d+/);return m?Number(m[0]):null;}
  function taskRow(result,fallback){return result&&result.value&&typeof result.value==='object'?result.value:(result&&typeof result==='object'&&!result.mode?result:fallback||null);}

  function installTasks(){
    var api=window.TaskSharedData;if(!api||state.installed.tasks)return !!state.installed.tasks;
    var rawCreate=api.create,rawUpdate=api.update;
    if(typeof rawCreate!=='function'||typeof rawUpdate!=='function')return false;
    api.create=function(task){return Promise.resolve(rawCreate.apply(this,arguments)).then(function(result){var row=taskRow(result,task)||task,key=row&&(row._key||row.id);if(key)publish({type:TYPES.TASK_CREATED,occurrenceKey:'task:'+key+':created',occurredAt:Number(row.createdAt)||now(),source:{module:'tasks',entityType:'task',entityId:String(key)},payload:{taskTitle:taskTitle(row),xpEarned:taskXp(row),difficulty:row&&row.priority||null}});return result;});};
    api.update=function(id,patch){patch=patch||{};return Promise.resolve(rawUpdate.apply(this,arguments)).then(function(result){var local=(window.taskData||[]).find(function(t){return String(t&&(t.id||t._key))===String(id);}),row=taskRow(result,local);if(patch.done===true&&row&&row.done){var key=row._key||row.id||id,completionId=row.completedAt||patch.completedAt||row.updatedAt;if(completionId)publish({type:TYPES.TASK_COMPLETED,occurrenceKey:'task:'+key+':completion:'+completionId,occurredAt:Number(row.completedAt||completionId)||now(),source:{module:'tasks',entityType:'task',entityId:String(key)},payload:{taskTitle:taskTitle(row),xpEarned:taskXp(row),difficulty:row.priority||null,completedByUid:row.completedByUid||null}});}return result;});};
    state.installed.tasks=true;return true;
  }

  function installMeals(){
    var store=window.MealPlanStore;if(!store||state.installed.meals||typeof store.replaceSlot!=='function')return !!state.installed.meals;
    var raw=store.replaceSlot;
    store.replaceSlot=function(input){input=input||{};return Promise.resolve(raw.apply(this,arguments)).then(function(result){var record=result&&result.record?result.record:input,id=record.id||((record.date||input.date)+':'+(record.mealType||input.mealType||'dinner')),version=record.updatedAt||record.createdAt;if(version)publish({type:TYPES.MEAL_PLANNED,occurrenceKey:'meal:'+id+':planned:'+version,occurredAt:Number(version)||now(),source:{module:'meals',entityType:'mealPlan',entityId:String(id)},payload:{mealName:record.title||record.name||'Maaltijd',plannedDate:record.date||input.date,slot:record.mealType||input.mealType||'dinner',recipeId:record.recipeId||input.recipeId||null}});return result;});};
    state.installed.meals=true;return true;
  }

  function installShopping(){
    var receipt=window.ShoppingReceiptFinance;if(!receipt||state.installed.shopping||typeof receipt.onProcessed!=='function')return !!state.installed.shopping;
    receipt.onProcessed(function(detail){detail=detail||{};if(!detail.sourceId)return;publish({type:TYPES.SHOPPING_COMPLETED,occurrenceKey:'shopping:'+detail.sourceId+':completed',occurredAt:Number(detail.processedAt)||now(),source:{module:'shop',entityType:'shoppingReceipt',entityId:String(detail.sourceId)},payload:{shoppingListName:detail.shoppingListName||'Boodschappen',itemCount:Number(detail.itemCount)||0}});});
    state.installed.shopping=true;return true;
  }

  function installPartyQuests(){
    var service=window.PartyQuestService;if(!service||state.installed.partyQuests||typeof service.completeFromTask!=='function')return !!state.installed.partyQuests;
    var raw=service.completeFromTask;
    service.completeFromTask=function(questId){return Promise.resolve(raw.apply(this,arguments)).then(function(saved){var completion=saved&&saved.completion,occ=completion&&completion.occurrenceId,id=saved&&(saved._key||saved.id)||questId;if(occ)publish({type:TYPES.PARTY_QUEST_COMPLETED,occurrenceKey:String(occ),occurredAt:Number(completion.finalizedAt||saved.endedAt)||now(),source:{module:'partyQuests',entityType:'partyQuest',entityId:String(id)},payload:{questTitle:saved.questTitle||'Party Quest',taskId:completion.taskId||saved.questId||null,participantUids:clone(completion.participantUids||[]),xpPerParticipant:completion.xpPerParticipant||null}});return saved;});};
    state.installed.partyQuests=true;return true;
  }

  function ensure(){installTasks();installMeals();installShopping();installPartyQuests();return Object.assign({},state.installed);}
  var timer=null,tries=0;
  function start(){ensure();if(timer)return true;timer=setInterval(function(){tries++;ensure();if((state.installed.tasks&&state.installed.meals&&state.installed.shopping&&state.installed.partyQuests)||tries>240){clearInterval(timer);timer=null;}},100);return true;}
  ['familyapp:modules:ready','familyapp:household-context','familyapp:session-state'].forEach(function(name){window.addEventListener(name,ensure);});
  window.addEventListener('load',start,{once:true});
  window.ActivityDomainProducers={version:VERSION,TYPES:TYPES,start:start,ensure:ensure,status:function(){return{version:VERSION,installed:Object.assign({},state.installed),lastError:state.lastError};}};
  start();
})();
