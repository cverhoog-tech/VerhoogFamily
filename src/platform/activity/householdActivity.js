'use strict';
(function(){
  if(window.HouseholdActivity) return;

  var COLLECTION='activityEvents';
  var TYPES=Object.freeze({TASK_CREATED:'task.created',TASK_COMPLETED:'task.completed',MEAL_PLANNED:'meal.planned',GROCERY_RECEIPT_UPLOADED:'grocery.receipt_uploaded'});
  var VISIBLE={};Object.keys(TYPES).forEach(function(k){VISIBLE[TYPES[k]]=true;});
  var state={started:false,attached:false,events:[],unsubscribe:null,lastError:null,timer:null,tries:0};
  var MAX_BOOT_TRIES=240;

  function fds(){return window.FamilyDataStore||null;}
  function uid(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
  function hid(){return window.fbFamilyId||null;}
  function ready(){return !!(fds()&&hid()&&uid());}
  function now(){return Date.now();}
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function safe(v){return String(v||'event').replace(/[.#$\[\]\/]/g,'_').replace(/[^a-zA-Z0-9:_-]/g,'_').slice(0,220);}
  function eventKey(dedupeKey){return 'evt_'+safe(dedupeKey);}
  function members(){try{if(window.HouseholdIdentityFirebaseBridge&&typeof HouseholdIdentityFirebaseBridge.getMembers==='function')return HouseholdIdentityFirebaseBridge.getMembers()||[];if(window.TaskSharedData&&typeof TaskSharedData.members==='function')return TaskSharedData.members()||[];}catch(e){}return[];}
  function member(userId){return members().find(function(m){return String(m.uid||m.id)===String(userId);})||null;}
  function actorName(userId){var m=member(userId)||{};return m.displayName||m.name||window.myName||'Gezinslid';}
  function stripReceiptAmounts(payload){var out=clone(payload||{})||{};['amount','total','totalAmount','price','cost','receiptTotal','value','currencyAmount'].forEach(function(k){delete out[k];});return out;}
  function normalize(input){input=input||{};var type=String(input.type||''),dedupeKey=String(input.dedupeKey||'').trim();if(!VISIBLE[type])throw new Error('Onbekend activity type: '+type);if(!dedupeKey)throw new Error('Activity dedupeKey ontbreekt');var ts=Number(input.occurredAt)||now(),payload=type===TYPES.GROCERY_RECEIPT_UPLOADED?stripReceiptAmounts(input.payload):clone(input.payload||{});return{id:eventKey(dedupeKey),schemaVersion:1,type:type,householdId:hid(),actorUid:uid(),occurredAt:ts,createdAt:ts,visibility:'household',dedupeKey:dedupeKey,source:clone(input.source||{}),payload:payload,presentation:{variant:(input.presentation&&input.presentation.variant)||type.replace(/\./g,'-')}};}
  function rows(value){if(!value)return[];return Object.keys(value).map(function(k){var v=value[k];if(!v||typeof v!=='object')return null;var e=clone(v);if(!e.id)e.id=k;return e;}).filter(Boolean).sort(function(a,b){return Number(b.occurredAt||0)-Number(a.occurredAt||0);}).slice(0,80);}
  function shouldPublishToFeed(event){return !!(event&&VISIBLE[event.type]);}
  function publish(input){if(!ready())return Promise.reject(new Error('Household Activity is nog niet gereed'));var event;try{event=normalize(input);}catch(e){return Promise.reject(e);}return fds().mutateSharedRecord(COLLECTION,event.id,function(existing){return existing||event;},null).then(function(result){state.lastError=result&&result.error?(result.error.message||String(result.error)):null;return result&&result.value?result.value:event;});}
  function start(){if(state.started||!ready())return false;state.started=true;state.unsubscribe=fds().subscribeShared(COLLECTION,function(value){state.attached=true;state.events=rows(value);try{window.dispatchEvent(new CustomEvent('familyapp:activity-updated',{detail:{count:state.events.length}}));}catch(e){}},{});return true;}

  function taskTitle(task){return task&&(task.title||task.name)||'Taak';}
  function taskXp(task){var raw=task&&(task.xp||task.rewardXp||task.reward);if(typeof raw==='number')return raw;var m=String(raw||'').match(/\d+/);return m?Number(m[0]):null;}
  function taskRow(result,fallback){return result&&result.value&&typeof result.value==='object'?result.value:(result&&typeof result==='object'&&!result.mode?result:fallback||null);}
  function wrapTasks(){if(!window.TaskSharedData||TaskSharedData.__activityWrapped)return false;var rawCreate=TaskSharedData.create,rawUpdate=TaskSharedData.update;
    if(typeof rawCreate==='function')TaskSharedData.create=function(task){return Promise.resolve(rawCreate.apply(this,arguments)).then(function(result){var row=taskRow(result,task)||task,key=row&&row._key||row&&row.id;if(key)publish({type:TYPES.TASK_CREATED,dedupeKey:'task:'+key+':created',source:{module:'tasks',entityType:'task',entityId:String(key)},payload:{taskTitle:taskTitle(row),xpEarned:taskXp(row),difficulty:row&&row.priority||null}}).catch(function(e){console.warn('[HouseholdActivity] task.created',e);});return result;});};
    if(typeof rawUpdate==='function')TaskSharedData.update=function(id,patch){patch=patch||{};return Promise.resolve(rawUpdate.apply(this,arguments)).then(function(result){var local=(window.taskData||[]).find(function(t){return String(t.id)===String(id);}),row=taskRow(result,local);if(patch.done===true&&row&&row.done){var key=row._key||row.id||id,completionId=patch.completedAt||row.completedAt||row.updatedAt||now();publish({type:TYPES.TASK_COMPLETED,dedupeKey:'task:'+key+':completion:'+completionId,occurredAt:row.completedAt||completionId,source:{module:'tasks',entityType:'task',entityId:String(key)},payload:{taskTitle:taskTitle(row),xpEarned:taskXp(row),difficulty:row.priority||null}}).catch(function(e){console.warn('[HouseholdActivity] task.completed',e);});}return result;});};TaskSharedData.__activityWrapped=true;return true;}

  function wrapMeals(){if(!window.MealPlanStore||MealPlanStore.__activityWrapped||typeof MealPlanStore.replaceSlot!=='function')return false;var raw=MealPlanStore.replaceSlot;MealPlanStore.replaceSlot=function(input){return Promise.resolve(raw.apply(this,arguments)).then(function(result){var record=result&&result.record?result.record:(input||{}),id=record.id||((record.date||input.date)+':'+(record.mealType||input.mealType||'dinner'));publish({type:TYPES.MEAL_PLANNED,dedupeKey:'meal:'+id+':planned:'+String(record.updatedAt||record.createdAt||now()),occurredAt:record.updatedAt||record.createdAt||now(),source:{module:'meals',entityType:'mealPlan',entityId:String(id)},payload:{mealName:record.title||'Maaltijd',plannedDate:record.date||input.date,slot:record.mealType||input.mealType||'dinner',recipeId:record.recipeId||input.recipeId||null}}).catch(function(e){console.warn('[HouseholdActivity] meal.planned',e);});return result;});};MealPlanStore.__activityWrapped=true;return true;}

  function wrapReceiptFinance(){if(!window.FinanceStore||FinanceStore.__activityWrapped||typeof FinanceStore.upsertSourceTransaction!=='function')return false;var raw=FinanceStore.upsertSourceTransaction;FinanceStore.upsertSourceTransaction=function(config){return Promise.resolve(raw.apply(this,arguments)).then(function(record){if(config&&config.sourceType==='shoppingReceipt'){var tx=config.transaction||{},sourceId=config.sourceId||record&&record.sourceId||record&&record.id;if(sourceId)publish({type:TYPES.GROCERY_RECEIPT_UPLOADED,dedupeKey:'receipt:'+sourceId+':uploaded',source:{module:'shop',entityType:'shoppingReceipt',entityId:String(sourceId)},payload:{shoppingListName:tx.shoppingListName||'Boodschappen',itemCount:Array.isArray(tx.shoppingItemNames)?tx.shoppingItemNames.length:null}}).catch(function(e){console.warn('[HouseholdActivity] grocery.receipt_uploaded',e);});}return record;});};FinanceStore.__activityWrapped=true;return true;}

  function allBridgesReady(){return !!(window.TaskSharedData&&TaskSharedData.__activityWrapped&&window.MealPlanStore&&MealPlanStore.__activityWrapped&&window.FinanceStore&&FinanceStore.__activityWrapped);}
  function ensure(){start();wrapTasks();wrapMeals();wrapReceiptFinance();return allBridgesReady();}
  function stopPolling(){if(state.timer){clearInterval(state.timer);state.timer=null;}}
  function ensurePolling(){
    if(ensure()){stopPolling();return;}
    if(state.timer)return;
    state.tries=0;
    state.timer=setInterval(function(){state.tries++;if(ensure()||state.tries>=MAX_BOOT_TRIES)stopPolling();},250);
  }
  function wake(){ensurePolling();}
  ['familyapp:household-changed','familyapp:household-identity-synced','familyapp:auth-ready','familyapp:modules:ready','familyapp:meals:changed'].forEach(function(name){window.addEventListener(name,wake);});
  window.addEventListener('focus',wake);window.addEventListener('online',wake);window.addEventListener('load',wake,{once:true});Promise.resolve().then(wake);

  window.HouseholdActivity={version:'1.2.0',TYPES:TYPES,start:start,publish:publish,getEvents:function(){return state.events.slice();},shouldPublishToFeed:shouldPublishToFeed,resolveMember:member,actorName:actorName,status:function(){return{started:state.started,attached:state.attached,ready:ready(),householdId:hid(),uid:uid(),count:state.events.length,lastError:state.lastError,bootstrapPolling:!!state.timer,bridges:{tasks:!!(window.TaskSharedData&&TaskSharedData.__activityWrapped),meals:!!(window.MealPlanStore&&MealPlanStore.__activityWrapped),receipt:!!(window.FinanceStore&&FinanceStore.__activityWrapped)}};}};
})();
