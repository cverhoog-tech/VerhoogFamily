'use strict';
// ============================================================
// HOUSEHOLD ACTIVITY FACADE v1.4.0 — STEP 13.2
// Canonical persistence/lifecycle authority: ActivityHouseholdRepository.
// Domain mutation hooks live in ActivityDomainProducers. This facade only
// validates/publishes immutable events and exposes the feed projection.
// ============================================================
(function(){
  if(window.HouseholdActivity)return;

  var TYPES=Object.freeze({TASK_CREATED:'task.created',TASK_COMPLETED:'task.completed',MEAL_PLANNED:'meal.planned',SHOPPING_COMPLETED:'shopping.completed',PARTY_QUEST_COMPLETED:'partyQuest.completed'});
  var VISIBLE={};Object.keys(TYPES).forEach(function(k){VISIBLE[TYPES[k]]=true;});
  var state={events:[],unsubscribe:null,lastError:null,timer:null,tries:0};
  var MAX_BOOT_TRIES=240;

  function repo(){return window.ActivityHouseholdRepository||null;}
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function members(){try{if(window.HouseholdIdentityFirebaseBridge&&typeof HouseholdIdentityFirebaseBridge.getMembers==='function')return HouseholdIdentityFirebaseBridge.getMembers()||[];if(window.TaskSharedData&&typeof TaskSharedData.members==='function')return TaskSharedData.members()||[];}catch(e){}return[];}
  function member(userId){return members().find(function(m){return String(m.uid||m.id)===String(userId);})||null;}
  function actorName(userId){var m=member(userId)||{};return m.displayName||m.name||'Gezinslid';}
  function stripAmounts(payload){var out=clone(payload||{})||{};['amount','total','totalAmount','price','cost','receiptTotal','value','currencyAmount'].forEach(function(k){delete out[k];});return out;}
  function shouldPublishToFeed(event){return !!(event&&VISIBLE[event.type]);}
  function normalize(input){input=clone(input||{})||{};var type=String(input.type||'');if(!VISIBLE[type])throw new Error('Onbekend activity type: '+type);var occurrenceKey=String(input.occurrenceKey||input.dedupeKey||'').trim();if(!occurrenceKey)throw new Error('Activity occurrenceKey ontbreekt');input.occurrenceKey=occurrenceKey;delete input.dedupeKey;if(type===TYPES.SHOPPING_COMPLETED)input.payload=stripAmounts(input.payload);input.presentation=Object.assign({variant:type.replace(/\./g,'-')},input.presentation||{});return input;}
  function publish(input){var r=repo();if(!r||typeof r.appendOnce!=='function')return Promise.reject(new Error('Activity repository is nog niet gereed'));var event;try{event=normalize(input);}catch(e){return Promise.reject(e);}return r.appendOnce(event).then(function(result){state.lastError=null;return result.event;}).catch(function(error){state.lastError=error&&error.message||String(error);throw error;});}
  function attach(){var r=repo();if(!r||typeof r.subscribe!=='function')return false;if(state.unsubscribe)return true;state.unsubscribe=r.subscribe(function(events){state.events=(events||[]).filter(shouldPublishToFeed);try{window.dispatchEvent(new CustomEvent('familyapp:activity-updated',{detail:{count:state.events.length}}));}catch(e){}});return true;}
  function wake(){if(attach()){if(state.timer){clearInterval(state.timer);state.timer=null;}return;}if(state.timer)return;state.tries=0;state.timer=setInterval(function(){state.tries++;if(attach()||state.tries>=MAX_BOOT_TRIES){clearInterval(state.timer);state.timer=null;}},250);}
  ['familyapp:household-context','familyapp:household-identity-synced','familyapp:modules:ready'].forEach(function(name){window.addEventListener(name,wake);});window.addEventListener('load',wake,{once:true});Promise.resolve().then(wake);

  window.HouseholdActivity={version:'1.4.0',TYPES:TYPES,start:function(){wake();return true;},publish:publish,getEvents:function(){return state.events.slice();},shouldPublishToFeed:shouldPublishToFeed,resolveMember:member,actorName:actorName,status:function(){var r=repo();var s=r&&r.status?r.status():{};return{ready:!!s.ready,householdId:s.householdId||null,uid:s.uid||null,count:state.events.length,lastError:state.lastError,canonicalPath:s.canonicalPath||null,repositoryVersion:r&&r.version||null};}};
})();
