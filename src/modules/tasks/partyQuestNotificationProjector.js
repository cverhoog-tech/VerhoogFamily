'use strict';
// ============================================================
// PARTY QUEST NOTIFICATION PROJECTOR v1.0.0
// Read-only observer over the existing UID-based partyQuests store.
// Converts invite/join/complete transitions into typed NotificationEvents.
// ============================================================
(function(){
  if(window.PartyQuestNotificationProjector)return;

  var VERSION='1.0.0';
  var ref=null,handler=null,householdId=null,snapshot={},initialized=false;

  function db(){try{return window.fbDb||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
  function uid(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
  function hid(){return window.fbFamilyId||null;}
  function map(value){var out={};Object.keys(value||{}).forEach(function(k){var q=value[k];if(q)out[k]=Object.assign({id:q.id||k},q);});return out;}
  function invitees(q){return q&&q.invitees&&typeof q.invitees==='object'?q.invitees:{};}
  function safe(p){if(p&&typeof p.catch==='function')p.catch(function(e){console.warn('[PartyQuestNotificationProjector]',e);});}

  function project(next){
    var me=uid();
    if(!initialized){snapshot=next;initialized=true;return;}
    Object.keys(next).forEach(function(k){
      var q=next[k],prev=snapshot[k]||null;
      if(!q||!window.NotificationEvents)return;

      if(!prev&&String(q.inviterUid||'')===String(me)){
        var targets=Object.keys(invitees(q)).filter(function(id){return invitees(q)[id]&&invitees(q)[id].status!=='declined';});
        safe(NotificationEvents.partyQuestCreated(q,targets));
      }

      if(prev){
        var beforeMine=invitees(prev)[me],afterMine=invitees(q)[me];
        if(afterMine&&String(q.inviterUid||'')!==String(me)&&(!beforeMine||beforeMine.status!==afterMine.status)&&afterMine.status==='active'){
          safe(NotificationEvents.partyQuestJoined(q,q.inviterUid));
        }

        if(prev.status!==q.status&&q.status==='completed'&&String(q.inviterUid||'')===String(me)){
          safe(NotificationEvents.partyQuestCompleted(q));
        }
      }
    });
    snapshot=next;
  }

  function stop(){if(ref&&handler)try{ref.off('value',handler);}catch(e){}ref=null;handler=null;householdId=null;snapshot={};initialized=false;}
  function start(){
    var d=db(),family=hid(),me=uid();
    if(!d||!family||!me)return false;
    if(ref&&householdId===family)return true;
    stop();householdId=family;
    ref=d.ref('families/'+family+'/partyQuests');
    handler=function(s){project(map(s.val()||{}));};
    ref.on('value',handler);
    return true;
  }

  window.PartyQuestNotificationProjector={version:VERSION,start:start,stop:stop,status:function(){return{version:VERSION,started:!!ref,householdId:householdId,tracked:Object.keys(snapshot).length};}};
  window.addEventListener('familyapp:household-members-updated',start);
  window.addEventListener('familyapp:household-changed',start);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();