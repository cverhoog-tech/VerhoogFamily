'use strict';
// ============================================================
// FEED ACTIVITY PRESENTATION v1.0.0
// Presentation-only consumer for HouseholdActivity.
// Social posts and immutable household events remain separate persistence
// models and are merged chronologically only at render time.
// ============================================================
(function(){
  if(window.FeedActivityPresentation) return;

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function actorName(event){try{if(window.HouseholdActivity&&HouseholdActivity.actorName)return HouseholdActivity.actorName(event.actorUid);}catch(e){}return 'Gezinslid';}
  function actorAvatar(name){try{if(typeof window.avatarHTML==='function')return window.avatarHTML(name,'','', 'fs-author-avatar');}catch(e){}return '<div class="fs-author-avatar"></div>';}
  function postTime(p){return Number(p&&p.createdAt||0);}
  function eventTime(e){return Number(e&&e.occurredAt||e&&e.createdAt||0);}
  function events(){try{return window.HouseholdActivity&&HouseholdActivity.getEvents?HouseholdActivity.getEvents().filter(function(e){return HouseholdActivity.shouldPublishToFeed(e);}):[];}catch(e){return[];}}

  var PRESENTATIONS={
    'task.created':function(e){var p=e.payload||{};return{eyebrow:'NEW QUEST',title:'Nieuwe taak beschikbaar',body:actorName(e)+' heeft een nieuwe taak aangemaakt',detail:p.taskTitle||'Nieuwe taak',meta:p.xpEarned?('+'+p.xpEarned+' XP'):null,icon:'⚔️',tone:'task-created'};},
    'task.completed':function(e){var p=e.payload||{};return{eyebrow:'QUEST COMPLETE',title:'Taak voltooid',body:actorName(e)+' heeft een taak afgerond',detail:p.taskTitle||'Taak',meta:p.xpEarned?('+'+p.xpEarned+' XP'):null,icon:'✨',tone:'task-completed'};},
    'meal.planned':function(e){var p=e.payload||{};return{eyebrow:'DINNER PLANNED',title:(p.mealName||'Maaltijd')+' staat op het menu',body:'Gepland door '+actorName(e),detail:p.plannedDate||null,meta:p.slot==='lunch'?'Lunch':(p.slot==='dinner'?'Diner':null),icon:'🍽️',tone:'meal-planned'};},
    'grocery.receipt_uploaded':function(e){var p=e.payload||{};return{eyebrow:'BOODSCHAPPEN GEDAAN',title:'Voorraad aangevuld',body:actorName(e)+' heeft de boodschappen binnengehaald',detail:p.shoppingListName||null,meta:p.itemCount?String(p.itemCount)+' items':null,icon:'🛒',tone:'shopping-completed'};}
  };

  function card(event){
    var presenter=PRESENTATIONS[event.type];if(!presenter)return '';var vm=presenter(event),name=actorName(event);
    return '<article class="fs-card fs-activity '+esc(vm.tone)+'" data-activity-id="'+esc(event.id)+'">'
      +'<div class="fs-activity-head">'+actorAvatar(name)
      +'<div class="fs-activity-heading"><span class="fs-activity-eyebrow">'+esc(vm.eyebrow)+'</span><strong>'+esc(vm.title)+'</strong><small>'+esc(vm.body)+'</small></div>'
      +'<div class="fs-activity-icon">'+esc(vm.icon)+'</div></div>'
      +(vm.detail?'<div class="fs-activity-detail">'+esc(vm.detail)+(vm.meta?'<span>'+esc(vm.meta)+'</span>':'')+'</div>':'')
      +'</article>';
  }

  function merged(){
    var social=(window.feedData||[]).map(function(p){return{kind:'post',at:postTime(p),value:p};});
    var activity=events().map(function(e){return{kind:'activity',at:eventTime(e),value:e};});
    return social.concat(activity).sort(function(a,b){return b.at-a.at;});
  }

  function feedBody(){
    var st=null;try{st=window.FeedSharedData&&FeedSharedData.status?FeedSharedData.status():null;}catch(e){}
    if(!st||!st.hasSnapshot)return '<div class="fs-feed-loading" style="text-align:center;padding:48px 20px;color:var(--c-text2,#6b7280)"><div style="font-size:28px;margin-bottom:8px">⏳</div><div style="font-size:14px;font-weight:600">Feed wordt verbonden...</div></div>';
    var items=merged();
    if(window.feedFilter==='tasks')items=items.filter(function(x){return x.kind==='activity'&&(x.value.type==='task.created'||x.value.type==='task.completed')||(x.kind==='post'&&x.value.type==='task');});
    if(window.feedFilter==='agenda')items=items.filter(function(x){return x.kind==='post'&&x.value.type==='agenda';});
    if(!items.length)return '<div class="fs-feed-empty" style="text-align:center;padding:48px 20px;color:var(--c-text2,#6b7280)"><div style="font-size:28px;margin-bottom:8px">💬</div><div style="font-size:14px;font-weight:600">Nog geen berichten</div><div style="font-size:12px;margin-top:4px">Deel iets met het gezin hierboven</div></div>';
    return items.map(function(item){if(item.kind==='activity')return card(item.value);return typeof window.renderPostHTML==='function'?window.renderPostHTML(item.value):'';}).join('');
  }

  function css(){if(document.getElementById('feed-activity-presentation-v1'))return;var s=document.createElement('style');s.id='feed-activity-presentation-v1';s.textContent=''
    +'.fs-activity{position:relative;overflow:hidden}.fs-activity:before{content:"";position:absolute;inset:0 auto 0 0;width:4px;background:#7c3aed}.fs-activity.task-created:before{background:#6d5bd0}.fs-activity.task-completed:before{background:#c69024}.fs-activity.meal-planned:before{background:#d66b4b}.fs-activity.shopping-completed:before{background:#3f7f2f}'
    +'.fs-activity-head{display:grid;grid-template-columns:48px 1fr 42px;gap:12px;align-items:center}.fs-activity-heading{min-width:0}.fs-activity-eyebrow{display:block;font-size:10px;font-weight:950;letter-spacing:.11em;color:#7c3aed;margin-bottom:3px}.task-completed .fs-activity-eyebrow{color:#a36d10}.meal-planned .fs-activity-eyebrow{color:#b85238}.shopping-completed .fs-activity-eyebrow{color:#3f7f2f}.fs-activity-heading strong{display:block;font-size:16px;color:#111827;line-height:1.22}.fs-activity-heading small{display:block;font-size:12px;color:#7c8492;margin-top:3px;line-height:1.3}.fs-activity-icon{width:40px;height:40px;border-radius:14px;background:#f6f3ff;display:grid;place-items:center;font-size:19px}.task-completed .fs-activity-icon{background:#fff7df}.meal-planned .fs-activity-icon{background:#fff1ea}.shopping-completed .fs-activity-icon{background:#eef8ea}.fs-activity-detail{margin:14px 0 0 60px;padding:11px 12px;border:1px solid #edf0ee;border-radius:15px;background:#fbfcfb;font-size:14px;font-weight:850;color:#172033;display:flex;align-items:center;justify-content:space-between;gap:10px}.fs-activity-detail span{font-size:12px;color:#748094;font-weight:850;white-space:nowrap}';document.head.appendChild(s);}

  window.feedListBodyHTML=function(){css();return feedBody();};
  window.addEventListener('familyapp:activity-updated',function(){try{var screen=document.getElementById('screen-feed');if(screen&&screen.classList.contains('active')&&typeof window.renderFeed==='function')window.renderFeed();}catch(e){}});
  window.FeedActivityPresentation={version:'1.0.0',presentations:PRESENTATIONS,merged:merged,renderCard:card};
})();
