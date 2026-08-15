'use strict';
// ============================================================
// HOME DASHBOARD SERVICE v1.0.0
// Read-only composition layer. Home owns no domain state.
// ============================================================
(function(){
  if(window.HomeDashboardService&&window.HomeDashboardService.version==='1.0.0')return;
  var VERSION='1.0.0',listeners=[];
  function hc(){return window.HouseholdContext||null;}function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
  function capture(){var c=hc();if(!c)throw new Error('HOUSEHOLD_CONTEXT_UNAVAILABLE');var uid=c.requireUser(),householdId=c.requireHousehold();c.assertContext({uid:uid,householdId:householdId,requireReady:true});return{uid:uid,householdId:householdId};}
  function same(t){return!!(t&&hc()&&hc().isCurrent(t));}
  function profile(){try{return window.ProfileContextService&&ProfileContextService.getCurrentMember?ProfileContextService.getCurrentMember():null;}catch(e){return null;}}
  function progression(){try{return window.ProgressionStore&&ProgressionStore.get?ProgressionStore.get():null;}catch(e){return null;}}
  function tasks(){try{return Array.isArray(window.taskData)?window.taskData.slice():[];}catch(e){return[];}}
  function shoppingCount(){try{var a=window.ShoppingLists&&ShoppingLists.active?ShoppingLists.active():null;if(!a||!a.list)return 0;var items=a.list.items||{};return Object.keys(items).filter(function(k){return items[k]&&!items[k].done;}).length;}catch(e){return 0;}}
  function feedCount(){try{return window.FeedSharedData&&FeedSharedData.getPosts?FeedSharedData.getPosts().length:0;}catch(e){return 0;}}
  function activities(){try{return window.ActivityService&&ActivityService.getEvents?ActivityService.getEvents().slice(0,10):[];}catch(e){return[];}}
  function levelInfo(p){p=p||{};var xp=Math.max(0,Number(p.totalXp!=null?p.totalXp:p.xp)||0),level=Math.max(1,Number(p.level)||1),prev=0,next=100;try{if(window.FamilyProgression){prev=FamilyProgression.totalXpForLevel(level)||0;next=FamilyProgression.totalXpForLevel(level+1)||prev+100;}}catch(e){}var pct=next>prev?Math.max(0,Math.min(100,Math.round((xp-prev)/(next-prev)*100))):100;var title='Avonturier';try{if(typeof window.getLevelName==='function')title=window.getLevelName(level)||title;}catch(e){}return{xp:xp,level:level,previousXp:prev,nextXp:next,percent:pct,title:title};}
  function snapshot(){var token;try{token=capture();}catch(e){return{version:VERSION,ready:false,context:null,profile:null,progression:levelInfo(null),stats:{tasks:0,shopping:0,feed:0},activity:[]};}var member=profile(),p=progression(),t=tasks();return{version:VERSION,ready:true,context:token,profile:member?{uid:member.uid||member.id,name:member.displayName||member.name||'Gezinslid',initials:member.initials||'',avatar:member.avatar||''}:{uid:token.uid,name:'Gezinslid',initials:'',avatar:''},progression:levelInfo(p),stats:{tasks:t.filter(function(x){return x&&!x.done&&x.status!=='completed';}).length,shopping:shoppingCount(),feed:feedCount()},activity:activities()};}
  function notify(){var s=snapshot();listeners.slice().forEach(function(fn){try{fn(clone(s));}catch(e){}});try{window.dispatchEvent(new CustomEvent('familyapp:home-dashboard-updated',{detail:s}));}catch(e){}return s;}
  function subscribe(fn){if(typeof fn!=='function')return function(){};listeners.push(fn);try{fn(snapshot());}catch(e){}return function(){var i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);};}
  ['familyapp:household-context-changed','familyapp:profile-context-updated','familyapp:progression-updated','familyapp:tasks-updated','familyapp:feed-updated','familyapp:activity-updated','familyapp:household-identity-synced'].forEach(function(name){window.addEventListener(name,notify);});
  window.addEventListener('familyapp:session:cleared',notify);
  window.HomeDashboardService={version:VERSION,get:snapshot,subscribe:subscribe,refresh:notify,isCurrent:same,status:function(){var s=snapshot();return{version:VERSION,ready:s.ready,context:s.context,stats:s.stats};}};
})();
