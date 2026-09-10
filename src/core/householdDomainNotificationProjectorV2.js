'use strict';
// Household domain notification projector v1.2.1 — STEP 11.6.
// Events are published by the UID that performed the canonical mutation so the
// existing trusted sender can verify actor === caller and exclude only the actor.
// v1.2 adds targeted task-completion notifications for actual collaborators and
// excludes Party Quest participants who receive the richer completion+XP event.
// v1.2.1 prevents the immediate HouseholdContext subscribe callback from wiping
// repository baselines that were just established during startup.
(function(){
  if(window.HouseholdDomainNotificationProjectorV2)return;
  var VERSION='1.2.1',unsubs=[],memberBinding=null,started=false,contextIdentity=null;
  var states={shopping:null,meals:null,tasks:null,calendar:null};
  function ctx(){try{return HouseholdContext.snapshot();}catch(e){return null;}}
  function valid(c){return !!(c&&c.ready&&c.uid&&c.householdId);}
  function identity(c){return valid(c)?String(c.uid)+'|'+String(c.householdId)+'|'+String(c.revision==null?'':c.revision):'signed-out';}
  function rid(r){return String(r&&(r.id||r._key||r.uid)||'');}
  function map(rows){var o={};(rows||[]).forEach(function(r){var k=rid(r);if(k)o[k]=r;});return o;}
  function mine(r,c,field){return !!(r&&r[field]&&String(r[field])===String(c.uid));}
  function safe(p){if(p&&p.catch)p.catch(function(e){console.warn('[HouseholdDomainNotificationProjectorV2]',e&&e.message||e);});}
  function value(o,k){return o&&o[k]!=null?o[k]:'';}
  function changed(a,b,fields){return fields.some(function(k){return String(value(a,k))!==String(value(b,k));});}
  function unique(values){var seen={};return (values||[]).filter(Boolean).map(String).filter(function(id){if(seen[id])return false;seen[id]=true;return true;});}
  function assigned(r){var a=[];if(r&&r.assignedToUids&&typeof r.assignedToUids==='object')Object.keys(r.assignedToUids).forEach(function(u){if(r.assignedToUids[u])a.push(String(u));});if(r&&r.assignedToUid)a.push(String(r.assignedToUid));return unique(a);}
  function helperUid(h){return String(h&&(h.uid||h.memberId||h.id)||'');}
  function collaborators(r){var out=[];if(r&&(r.createdByUid||r.ownerUid))out.push(String(r.createdByUid||r.ownerUid));out=out.concat(assigned(r));(Array.isArray(r&&r.helpers)?r.helpers:[]).forEach(function(h){var id=helperUid(h);if(id)out.push(id);});return unique(out);}
  function done(r){var status=String(r&&r.status||'').toLowerCase();return !!(r&&(r.done===true||r.completed===true||status==='done'||status==='completed'));}
  function partyQuestParticipantsForTask(task){
    var repo=window.PartyQuestRepository;if(!repo||typeof repo.list!=='function')return[];
    var taskIdentity=rid(task),completedAt=String(task&&task.completedAt||''),out=[];
    try{(repo.list()||[]).forEach(function(q){
      if(!q||String(q.questId||'')!==taskIdentity)return;
      var include=q.status==='active';
      if(q.status==='completed'&&q.completion){var qAt=String(q.completion.taskCompletedAt||'');include=!!(completedAt&&qAt&&completedAt===qAt);}
      if(!include)return;
      var completionUids=q.completion&&Array.isArray(q.completion.participantUids)?q.completion.participantUids:null;
      if(completionUids&&completionUids.length){out=out.concat(completionUids);return;}
      if(q.inviterUid)out.push(String(q.inviterUid));
      var inv=q.invitees&&typeof q.invitees==='object'?q.invitees:{};Object.keys(inv).forEach(function(uid){if(inv[uid]&&inv[uid].status==='active')out.push(String(uid));});
    });}catch(e){}
    return unique(out);
  }
  function completionRecipients(task,c){
    var party={};partyQuestParticipantsForTask(task).forEach(function(uid){party[String(uid)]=true;});
    return collaborators(task).filter(function(uid){return String(uid)!==String(c.uid)&&!party[String(uid)];});
  }
  function subscribe(repo,name,handler){if(!repo||typeof repo.subscribe!=='function')return;unsubs.push(repo.subscribe(function(rows,meta){var c=ctx();if(!valid(c)||!meta||meta.ready===false)return;var next=map(rows),prev=states[name];if(!prev){states[name]=next;return;}handler(next,prev,c);states[name]=next;}));}
  function bindDomains(){
    subscribe(window.ShoppingListStore,'shopping',function(next,prev,c){var added=Object.keys(next).map(function(k){return next[k];}).filter(function(r){return !prev[rid(r)]&&mine(r,c,'createdByUid');});if(!added.length||!NotificationEvents.shoppingItemsAdded)return;var groups={};added.forEach(function(r){var bucket=Math.floor(Number(r.createdAt||Date.now())/10000),k=String(r.createdByUid)+':'+bucket;(groups[k]||(groups[k]=[])).push(r);});Object.keys(groups).forEach(function(k){safe(NotificationEvents.shoppingItemsAdded(groups[k],k));});});
    subscribe(window.MealPlanHouseholdRepository,'meals',function(next,prev,c){Object.keys(next).forEach(function(k){var r=next[k],p=prev[k];if(!p&&mine(r,c,'createdByUid')&&NotificationEvents.mealPlanned)safe(NotificationEvents.mealPlanned(r));else if(p&&Number(r.updatedAt||0)!==Number(p.updatedAt||0)&&mine(r,c,'updatedByUid')&&changed(p,r,['date','mealType','title','recipeId','persons'])&&NotificationEvents.mealUpdated)safe(NotificationEvents.mealUpdated(r));});});
    subscribe(window.TaskHouseholdRepository,'tasks',function(next,prev,c){Object.keys(next).forEach(function(k){
      var r=next[k],p=prev[k];
      if(!mine(r,c,p?'updatedByUid':'createdByUid'))return;
      var before=p?assigned(p):[],fresh=assigned(r).filter(function(u){return before.indexOf(u)<0&&String(u)!==String(c.uid);});
      if(fresh.length&&NotificationEvents.taskAssigned)safe(NotificationEvents.taskAssigned(r,fresh));
      if(p&&!done(p)&&done(r)&&String(r.completedByUid||r.updatedByUid||'')===String(c.uid)&&NotificationEvents.taskCompleted){
        var recipients=completionRecipients(r,c);
        if(recipients.length)safe(NotificationEvents.taskCompleted(r,recipients,{completedByUid:String(c.uid),occurrence:r.completedAt||r.updatedAt||'completed'}));
      }
    });});
    subscribe(window.CalendarEventHouseholdRepository,'calendar',function(next,prev,c){Object.keys(next).forEach(function(k){var r=next[k],p=prev[k];if(!p&&mine(r,c,'createdByUid')&&NotificationEvents.calendarCreated)safe(NotificationEvents.calendarCreated(r));else if(p&&Number(r.updatedAt||0)!==Number(p.updatedAt||0)&&mine(r,c,'updatedByUid')&&changed(p,r,['title','date','time','who'])&&NotificationEvents.calendarUpdated)safe(NotificationEvents.calendarUpdated(r));});});
  }
  function unbindMembers(){if(memberBinding)try{memberBinding.ref.off('value',memberBinding.handler);}catch(e){}memberBinding=null;}
  function bindMembers(c){unbindMembers();var database=null;try{database=window.fbDb||(window.firebase&&firebase.database&&firebase.database());}catch(e){}if(!database)return;var ref=database.ref('families/'+c.householdId+'/members'),first=true,previous={};var binding={ref:ref,handler:null,uid:String(c.uid)};memberBinding=binding;binding.handler=function(s){if(memberBinding!==binding)return;var raw=s&&s.val?s.val():{},next={};Object.keys(raw||{}).forEach(function(u){if(raw[u])next[u]=Object.assign({uid:u},raw[u]);});if(first){first=false;previous=next;var self=next[binding.uid],joinedAt=Number(self&&self.joinedAt||0);if(self&&self.status!=='inactive'&&self.status!=='removed'&&joinedAt&&Date.now()-joinedAt<60000&&NotificationEvents.householdMemberJoined)safe(NotificationEvents.householdMemberJoined(self));return;}var selfBefore=previous[binding.uid],selfAfter=next[binding.uid];if(selfBefore&&selfBefore.status!=='inactive'&&selfBefore.status!=='removed'&&(!selfAfter||selfAfter.status==='inactive'||selfAfter.status==='removed')&&NotificationEvents.householdMemberLeft)safe(NotificationEvents.householdMemberLeft(selfBefore,Number(selfAfter&&selfAfter.updatedAt||selfBefore.updatedAt||selfBefore.joinedAt)));previous=next;};ref.on('value',binding.handler);}
  function reset(){states={shopping:null,meals:null,tasks:null,calendar:null};}
  function onContext(c){var nextIdentity=identity(c);if(nextIdentity===contextIdentity)return;contextIdentity=nextIdentity;reset();if(valid(c))bindMembers(c);else unbindMembers();}
  function start(){if(started)return true;started=true;var c=ctx();contextIdentity=identity(c);if(valid(c))bindMembers(c);bindDomains();if(window.HouseholdContext&&HouseholdContext.subscribe)unsubs.push(HouseholdContext.subscribe(onContext));return true;}
  function stop(){unsubs.splice(0).forEach(function(f){try{f();}catch(e){}});unbindMembers();reset();contextIdentity=null;started=false;}
  window.HouseholdDomainNotificationProjectorV2={version:VERSION,start:start,stop:stop};start();
})();
