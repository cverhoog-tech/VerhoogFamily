'use strict';
// Household domain notification projector v1.1.0.
// Events are published by the UID that performed the canonical mutation so the
// existing trusted sender can verify actor === caller and exclude only the actor.
(function(){
  if(window.HouseholdDomainNotificationProjectorV2)return;
  var VERSION='1.1.0',unsubs=[],memberBinding=null,started=false;
  var states={shopping:null,meals:null,tasks:null,calendar:null};
  function ctx(){try{return HouseholdContext.snapshot();}catch(e){return null;}}
  function valid(c){return !!(c&&c.ready&&c.uid&&c.householdId);}
  function rid(r){return String(r&&(r.id||r._key||r.uid)||'');}
  function map(rows){var o={};(rows||[]).forEach(function(r){var k=rid(r);if(k)o[k]=r;});return o;}
  function mine(r,c,field){return !!(r&&r[field]&&String(r[field])===String(c.uid));}
  function safe(p){if(p&&p.catch)p.catch(function(e){console.warn('[HouseholdDomainNotificationProjectorV2]',e&&e.message||e);});}
  function changed(a,b,fields){return fields.some(function(k){return String(a&&a[k]??'')!==String(b&&b[k]??'');});}
  function assigned(r){var a=[];if(r&&r.assignedToUids&&typeof r.assignedToUids==='object')Object.keys(r.assignedToUids).forEach(function(u){if(r.assignedToUids[u])a.push(String(u));});if(r&&r.assignedToUid)a.push(String(r.assignedToUid));return Array.from(new Set(a));}
  function subscribe(repo,name,handler){if(!repo||typeof repo.subscribe!=='function')return;unsubs.push(repo.subscribe(function(rows,meta){var c=ctx();if(!valid(c)||!meta||meta.ready===false)return;var next=map(rows),prev=states[name];if(!prev){states[name]=next;return;}handler(next,prev,c);states[name]=next;}));}
  function bindDomains(){
    subscribe(window.ShoppingListStore,'shopping',function(next,prev,c){var added=Object.keys(next).map(function(k){return next[k];}).filter(function(r){return !prev[rid(r)]&&mine(r,c,'createdByUid');});if(!added.length||!NotificationEvents.shoppingItemsAdded)return;var groups={};added.forEach(function(r){var bucket=Math.floor(Number(r.createdAt||Date.now())/10000),k=String(r.createdByUid)+':'+bucket;(groups[k]||(groups[k]=[])).push(r);});Object.keys(groups).forEach(function(k){safe(NotificationEvents.shoppingItemsAdded(groups[k],k));});});
    subscribe(window.MealPlanHouseholdRepository,'meals',function(next,prev,c){Object.keys(next).forEach(function(k){var r=next[k],p=prev[k];if(!p&&mine(r,c,'createdByUid')&&NotificationEvents.mealPlanned)safe(NotificationEvents.mealPlanned(r));else if(p&&Number(r.updatedAt||0)!==Number(p.updatedAt||0)&&mine(r,c,'updatedByUid')&&changed(p,r,['date','mealType','title','recipeId','persons'])&&NotificationEvents.mealUpdated)safe(NotificationEvents.mealUpdated(r));});});
    subscribe(window.TaskHouseholdRepository,'tasks',function(next,prev,c){Object.keys(next).forEach(function(k){var r=next[k],p=prev[k];if(!mine(r,c,p?'updatedByUid':'createdByUid'))return;var before=p?assigned(p):[],fresh=assigned(r).filter(function(u){return before.indexOf(u)<0&&String(u)!==String(c.uid);});if(fresh.length&&NotificationEvents.taskAssigned)safe(NotificationEvents.taskAssigned(r,fresh));});});
    subscribe(window.CalendarEventHouseholdRepository,'calendar',function(next,prev,c){Object.keys(next).forEach(function(k){var r=next[k],p=prev[k];if(!p&&mine(r,c,'createdByUid')&&NotificationEvents.calendarCreated)safe(NotificationEvents.calendarCreated(r));else if(p&&Number(r.updatedAt||0)!==Number(p.updatedAt||0)&&mine(r,c,'updatedByUid')&&changed(p,r,['title','date','time','who'])&&NotificationEvents.calendarUpdated)safe(NotificationEvents.calendarUpdated(r));});});
  }
  function unbindMembers(){if(memberBinding)try{memberBinding.ref.off('value',memberBinding.handler);}catch(e){}memberBinding=null;}
  function bindMembers(c){unbindMembers();var db=null;try{db=window.fbDb||(firebase&&firebase.database&&firebase.database());}catch(e){}if(!db)return;var ref=db.ref('families/'+c.householdId+'/members'),first=true,previous={};var binding={ref:ref,handler:null,uid:String(c.uid)};memberBinding=binding;binding.handler=function(s){if(memberBinding!==binding)return;var raw=s&&s.val?s.val():{},next={};Object.keys(raw||{}).forEach(function(u){if(raw[u])next[u]=Object.assign({uid:u},raw[u]);});if(first){first=false;previous=next;var self=next[binding.uid],joinedAt=Number(self&&self.joinedAt||0);if(self&&self.status!=='inactive'&&self.status!=='removed'&&joinedAt&&Date.now()-joinedAt<60000&&NotificationEvents.householdMemberJoined)safe(NotificationEvents.householdMemberJoined(self));return;}var selfBefore=previous[binding.uid],selfAfter=next[binding.uid];if(selfBefore&&selfBefore.status!=='inactive'&&selfBefore.status!=='removed'&&(!selfAfter||selfAfter.status==='inactive'||selfAfter.status==='removed')&&NotificationEvents.householdMemberLeft){safe(NotificationEvents.householdMemberLeft(selfBefore,Number(selfAfter&&selfAfter.updatedAt||selfBefore.updatedAt||selfBefore.joinedAt)));}previous=next;};ref.on('value',binding.handler);}
  function reset(){states={shopping:null,meals:null,tasks:null,calendar:null};}
  function onContext(c){reset();if(valid(c))bindMembers(c);else unbindMembers();}
  function start(){if(started)return true;started=true;bindDomains();if(window.HouseholdContext&&HouseholdContext.subscribe)unsubs.push(HouseholdContext.subscribe(onContext));var c=ctx();if(valid(c))bindMembers(c);return true;}
  function stop(){unsubs.splice(0).forEach(function(f){try{f();}catch(e){}});unbindMembers();reset();started=false;}
  window.HouseholdDomainNotificationProjectorV2={version:VERSION,start:start,stop:stop};start();
})();
