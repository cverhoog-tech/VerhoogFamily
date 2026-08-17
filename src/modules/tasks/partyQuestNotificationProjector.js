'use strict';
(function(){
  if(window.PartyQuestNotificationProjector)return;
  var VERSION='2.0.0',snapshot={},initialized=false,started=false;
  function uid(){try{return window.HouseholdContext&&HouseholdContext.requireUser?HouseholdContext.requireUser():null;}catch(e){return null;}}
  function service(){return window.PartyQuestContextService||null;}
  function map(list){var out={};(list||[]).forEach(function(q){if(q&&q.id)out[q.id]=q;});return out;}
  function invitees(q){return q&&q.invitees&&typeof q.invitees==='object'?q.invitees:{};}
  function safe(p){if(p&&typeof p.catch==='function')p.catch(function(e){console.warn('[PartyQuestNotificationProjector]',e);});}
  function project(next){var me=uid();if(!me)return;if(!initialized){snapshot=next;initialized=true;return;}Object.keys(next).forEach(function(k){var q=next[k],prev=snapshot[k]||null;if(!q||!window.NotificationEvents)return;if(!prev&&String(q.inviterUid||'')===String(me)){var targets=Object.keys(invitees(q)).filter(function(id){return invitees(q)[id]&&invitees(q)[id].status==='pending';});safe(NotificationEvents.partyQuestCreated(q,targets));targets.forEach(function(targetUid){if(NotificationEvents.partyQuestInvitationSent)safe(NotificationEvents.partyQuestInvitationSent(q,targetUid));});}if(prev){var beforeMine=invitees(prev)[me],afterMine=invitees(q)[me];if(afterMine&&String(q.inviterUid||'')!==String(me)&&(!beforeMine||beforeMine.status!==afterMine.status)&&afterMine.status==='active')safe(NotificationEvents.partyQuestJoined(q,q.inviterUid));if(prev.status!==q.status&&q.status==='completed'&&String(q.inviterUid||'')===String(me))safe(NotificationEvents.partyQuestCompleted(q));}});snapshot=next;}
  function refresh(){var s=service();if(!s)return false;try{project(map(s.list()));return true;}catch(e){return false;}}
  function stop(){snapshot={};initialized=false;started=false;}
  function start(){var s=service();if(!s)return false;s.start();started=true;refresh();return true;}
  window.PartyQuestNotificationProjector={version:VERSION,start:start,stop:stop,status:function(){var c=null;try{c=HouseholdContext.current();}catch(e){}return{version:VERSION,started:started,householdId:c&&c.householdId||null,tracked:Object.keys(snapshot).length};}};
  window.addEventListener('familyapp:party-quests-updated',refresh);
  window.addEventListener('familyapp:household-context-changed',function(){stop();start();});
  window.addEventListener('familyapp:session:cleared',stop);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();