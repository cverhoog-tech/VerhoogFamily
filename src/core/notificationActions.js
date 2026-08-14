'use strict';
// ============================================================
// NOTIFICATION ACTIONS v2.0.0
// Presentation-agnostic action service for actionable notification events.
// NotificationCenter and NotificationDelivery own all DOM and interaction UI.
// ============================================================
(function(){
  if(window.NotificationActions)return;
  var VERSION='2.0.0';

  function currentUid(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
  function members(){try{return window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members()||[]:[];}catch(e){return[];}}
  function member(uid){return members().find(function(m){return String(m.uid||m.id)===String(uid);})||null;}
  function taskByEvent(event){
    var id=event&&event.data&&(event.data.taskId||event.data.taskKey)||(event&&event.entity&&event.entity.id)||'';
    return (window.taskData||[]).find(function(t){return String(t.id||t._key)===String(id);})||null;
  }
  function isActionable(event){return !!(event&&event.type==='task.help.requested');}
  function markRead(event){return window.NotificationStore&&event&&event.id?NotificationStore.markRead(event.id):Promise.resolve();}

  function acceptTaskHelp(event){
    var me=currentUid(),task=taskByEvent(event);
    if(!me)return Promise.reject(new Error('Niet ingelogd'));
    if(!task)return Promise.reject(new Error('Taak niet gevonden'));
    if(!window.TaskSharedData||typeof TaskSharedData.update!=='function')return Promise.reject(new Error('Taakdata is nog niet klaar'));
    var helpers=Array.isArray(task.helpers)?task.helpers.slice():[];
    var exists=helpers.some(function(h){return String(h&&(h.uid||h.memberId||h.id)||'')===String(me);});
    if(!exists){
      var m=member(me)||{},name=m.displayName||m.name||(window.myName||'Gezinslid');
      helpers.push({uid:me,memberId:me,name:name,initials:String(name).trim().split(/\s+/).map(function(p){return p.charAt(0);}).join('').slice(0,2).toUpperCase(),joinedAt:Date.now()});
    }
    return TaskSharedData.update(task.id||task._key,{helpRequested:true,helpers:helpers}).then(function(saved){
      return markRead(event).then(function(){
        if(typeof window.showToast==='function')window.showToast(exists?'Je helpt al mee ✓':'Je helpt nu mee 🤝');
        return saved;
      });
    });
  }

  function run(event){
    if(!event)return Promise.resolve(false);
    if(event.type==='task.help.requested')return acceptTaskHelp(event).then(function(){return true;});
    return markRead(event).then(function(){return false;});
  }
  function byId(id){
    if(!window.NotificationStore)return null;
    return NotificationStore.list().find(function(n){return String(n.id)===String(id);})||null;
  }

  window.NotificationActions={version:VERSION,isActionable:isActionable,run:run,acceptTaskHelp:acceptTaskHelp,byId:byId};
})();