'use strict';
// ============================================================
// HOUSEHOLD DOMAIN NOTIFICATION PROJECTOR v1.0.0
// Read-only observers over canonical household repositories.
// NotificationStore remains persistence authority; push remains downstream.
// ============================================================
(function(){
  if(window.HouseholdDomainNotificationProjector)return;
  var VERSION='1.0.0',unsubs=[],memberBinding=null,started=false;
  var shopping={ready:false,map:{}},meals={ready:false,map:{}},tasks={ready:false,map:{}},calendar={ready:false,map:{}},members={ready:false,map:{}};

  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function valid(c){return !!(c&&c.ready&&c.uid&&c.householdId);}
  function id(row){return String(row&&(row.id||row._key||row.uid)||'');}
  function mapRows(rows){var out={};(rows||[]).forEach(function(row){var k=id(row);if(k)out[k]=row;});return out;}
  function safe(p){if(p&&typeof p.catch==='function')p.catch(function(e){console.warn('[HouseholdDomainNotificationProjector]',e&&e.message||e);});}
  function actorIsOther(row,c,field){var uid=row&&row[field||'updatedByUid'];return !!(uid&&String(uid)!==String(c.uid));}
  function changed(a,b,fields){return(fields||[]).some(function(k){return String(a&&a[k]??'')!==String(b&&b[k]??'');});}
  function activeMember(m){return !!(m&&m.status!=='inactive'&&m.status!=='removed');}

  function shoppingRows(){try{return window.ShoppingListStore&&ShoppingListStore.list?ShoppingListStore.list():[];}catch(e){return[];}}
  function bindShopping(){if(!window.ShoppingListStore||typeof ShoppingListStore.subscribe!=='function')return;unsubs.push(ShoppingListStore.subscribe(function(rows,meta){var c=context();if(!valid(c)||!meta||meta.ready===false)return;var next=mapRows(rows);if(!shopping.ready){shopping={ready:true,map:next};return;}var added=Object.keys(next).map(function(k){return next[k];}).filter(function(row){return !shopping.map[id(row)]&&actorIsOther(row,c,'createdByUid');});if(added.length&&window.NotificationEvents&&NotificationEvents.shoppingItemsAdded){var groups={};added.forEach(function(row){var actor=String(row.createdByUid||'');var bucket=Math.floor(Number(row.createdAt||Date.now())/10000);var k=actor+':'+bucket;(groups[k]||(groups[k]=[])).push(row);});Object.keys(groups).forEach(function(k){var rows2=groups[k];safe(NotificationEvents.shoppingItemsAdded(rows2,k));});}shopping.map=next;}));var initial=shoppingRows();if(initial.length&&!shopping.ready)shopping={ready:true,map:mapRows(initial)};}

  function bindMeals(){if(!window.MealPlanHouseholdRepository||typeof MealPlanHouseholdRepository.subscribe!=='function')return;unsubs.push(MealPlanHouseholdRepository.subscribe(function(rows,meta){var c=context();if(!valid(c)||!meta||meta.ready===false)return;var next=mapRows(rows);if(!meals.ready){meals={ready:true,map:next};return;}Object.keys(next).forEach(function(k){var row=next[k],prev=meals.map[k];if(!prev&&actorIsOther(row,c,'createdByUid')&&NotificationEvents.mealPlanned)safe(NotificationEvents.mealPlanned(row));else if(prev&&Number(row.updatedAt||0)!==Number(prev.updatedAt||0)&&actorIsOther(row,c,'updatedByUid')&&changed(prev,row,['date','mealType','title','recipeId','persons'])&&NotificationEvents.mealUpdated)safe(NotificationEvents.mealUpdated(row));});meals.map=next;}));}

  function assigned(row){var out=[];if(row&&row.assignedToUids&&typeof row.assignedToUids==='object')Object.keys(row.assignedToUids).forEach(function(uid){if(row.assignedToUids[uid])out.push(String(uid));});if(row&&row.assignedToUid)out.push(String(row.assignedToUid));return Array.from(new Set(out));}
  function bindTasks(){if(!window.TaskHouseholdRepository||typeof TaskHouseholdRepository.subscribe!=='function')return;unsubs.push(TaskHouseholdRepository.subscribe(function(rows,meta){var c=context();if(!valid(c)||!meta||meta.ready===false)return;var next=mapRows(rows);if(!tasks.ready){tasks={ready:true,map:next};return;}Object.keys(next).forEach(function(k){var row=next[k],prev=tasks.map[k];if(!actorIsOther(row,c,prev?'updatedByUid':'createdByUid'))return;var before=prev?assigned(prev):[],after=assigned(row),fresh=after.filter(function(uid){return before.indexOf(uid)<0;});if(fresh.length&&NotificationEvents.taskAssigned)safe(NotificationEvents.taskAssigned(row,fresh));});tasks.map=next;}));}

  function bindCalendar(){if(!window.CalendarEventHouseholdRepository||typeof CalendarEventHouseholdRepository.subscribe!=='function')return;unsubs.push(CalendarEventHouseholdRepository.subscribe(function(rows,meta){var c=context();if(!valid(c)||!meta||meta.ready===false)return;var next=mapRows(rows);if(!calendar.ready){calendar={ready:true,map:next};return;}Object.keys(next).forEach(function(k){var row=next[k],prev=calendar.map[k];if(!prev&&actorIsOther(row,c,'createdByUid')&&NotificationEvents.calendarCreated)safe(NotificationEvents.calendarCreated(row));else if(prev&&Number(row.updatedAt||0)!==Number(prev.updatedAt||0)&&actorIsOther(row,c,'updatedByUid')&&changed(prev,row,['title','date','time','who'])&&NotificationEvents.calendarUpdated)safe(NotificationEvents.calendarUpdated(row));});calendar.map=next;}));}

  function unbindMembers(){if(memberBinding&&memberBinding.ref&&memberBinding.handler)try{memberBinding.ref.off('value',memberBinding.handler);}catch(e){}memberBinding=null;members={ready:false,map:{}};}
  function bindMembers(c){unbindMembers();var db=null;try{db=window.fbDb||(window.firebase&&firebase.database&&firebase.database());}catch(e){}if(!db||!valid(c))return;var ref=db.ref('families/'+c.householdId+'/members');var binding={ref:ref,uid:c.uid,householdId:c.householdId,handler:null};memberBinding=binding;binding.handler=function(s){if(memberBinding!==binding)return;var raw=s&&s.val?s.val():{};var next={};Object.keys(raw||{}).forEach(function(uid){if(raw[uid])next[uid]=Object.assign({uid:uid},raw[uid]);});if(!members.ready){members={ready:true,map:next};return;}Object.keys(next).forEach(function(uid){var row=next[uid],prev=members.map[uid];if(!prev&&activeMember(row)&&String(uid)!==String(binding.uid)&&NotificationEvents.householdMemberJoined)safe(NotificationEvents.householdMemberJoined(row));else if(prev&&activeMember(prev)&&!activeMember(row)&&String(uid)===String(binding.uid)&&NotificationEvents.householdMemberLeft)safe(NotificationEvents.householdMemberLeft(prev,row.updatedAt||Date.now()));});Object.keys(members.map).forEach(function(uid){if(next[uid])return;var prev=members.map[uid];if(activeMember(prev)&&String(uid)===String(binding.uid)&&NotificationEvents.householdMemberLeft)safe(NotificationEvents.householdMemberLeft(prev,Date.now()));});members.map=next;};ref.on('value',binding.handler,function(e){console.warn('[HouseholdDomainNotificationProjector] member listener failed',e);});}

  function resetDomainSnapshots(){shopping={ready:false,map:{}};meals={ready:false,map:{}};tasks={ready:false,map:{}};calendar={ready:false,map:{}};}
  function handleContext(c){resetDomainSnapshots();if(valid(c))bindMembers(c);else unbindMembers();}
  function start(){if(started)return true;started=true;bindShopping();bindMeals();bindTasks();bindCalendar();if(window.HouseholdContext&&typeof HouseholdContext.subscribe==='function')unsubs.push(HouseholdContext.subscribe(handleContext));var c=context();if(valid(c))bindMembers(c);return true;}
  function stop(){unsubs.splice(0).forEach(function(fn){try{if(typeof fn==='function')fn();}catch(e){}});unbindMembers();started=false;resetDomainSnapshots();}

  window.HouseholdDomainNotificationProjector={version:VERSION,start:start,stop:stop,status:function(){return{version:VERSION,started:started,shoppingReady:shopping.ready,mealsReady:meals.ready,tasksReady:tasks.ready,calendarReady:calendar.ready,membersReady:members.ready};}};
  start();
})();
