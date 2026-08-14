'use strict';
// ============================================================
// NOTIFICATION ACTIONS v1.1.0
// One action router for actionable in-app notification events.
// ============================================================
(function(){
  if(window.NotificationActions)return;
  var VERSION='1.1.0';

  function currentUid(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
  function members(){try{return window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members()||[]:[];}catch(e){return[];}}
  function member(uid){return members().find(function(m){return String(m.uid||m.id)===String(uid);})||null;}
  function taskByEvent(event){var id=event&&event.data&&(event.data.taskId||event.data.taskKey)||(event&&event.entity&&event.entity.id)||'';return (window.taskData||[]).find(function(t){return String(t.id||t._key)===String(id);})||null;}
  function isActionable(event){return !!(event&&event.type==='task.help.requested');}
  function markRead(event){if(window.NotificationStore&&event&&event.id)return NotificationStore.markRead(event.id);return Promise.resolve();}

  function acceptTaskHelp(event){
    var me=currentUid(),task=taskByEvent(event);
    if(!me)return Promise.reject(new Error('Niet ingelogd'));
    if(!task)return Promise.reject(new Error('Taak niet gevonden'));
    if(!window.TaskSharedData||typeof TaskSharedData.update!=='function')return Promise.reject(new Error('Taakdata is nog niet klaar'));
    var helpers=Array.isArray(task.helpers)?task.helpers.slice():[];
    var exists=helpers.some(function(h){return String(h&&(h.uid||h.memberId||h.id)||'')===String(me);});
    if(!exists){var m=member(me)||{};helpers.push({uid:me,memberId:me,name:m.displayName||m.name||(window.myName||'Gezinslid'),initials:String(m.displayName||m.name||window.myName||'G').slice(0,2).toUpperCase(),joinedAt:Date.now()});}
    return TaskSharedData.update(task.id||task._key,{helpRequested:true,helpers:helpers}).then(function(saved){return markRead(event).then(function(){if(typeof window.showToast==='function')window.showToast(exists?'Je helpt al mee ✓':'Je helpt nu mee 🤝');if(typeof window.renderTasks==='function')window.renderTasks();return saved;});});
  }

  function run(event){if(!event)return Promise.resolve(false);if(event.type==='task.help.requested')return acceptTaskHelp(event).then(function(){return true;});return markRead(event).then(function(){return false;});}
  function byId(id){if(!window.NotificationStore)return null;return NotificationStore.list().find(function(n){return String(n.id)===String(id);})||null;}

  function ensureStyles(){if(document.getElementById('notification-actions-style'))return;var s=document.createElement('style');s.id='notification-actions-style';s.textContent='.notif-action-hint{display:inline-flex;margin-top:5px;color:var(--c-primary);font-size:10.5px;font-weight:900}.notif-item.is-actionable{cursor:pointer}';document.head.appendChild(s);}
  function decorateCenter(){ensureStyles();var list=document.getElementById('notif-list');if(!list)return;list.querySelectorAll('[data-notif-id]').forEach(function(row){var event=byId(row.getAttribute('data-notif-id'));var old=row.querySelector('.notif-action-hint');if(!isActionable(event)){row.classList.remove('is-actionable');if(old)old.remove();return;}row.classList.add('is-actionable');if(!old){var copy=row.querySelector('.notif-body')||row.querySelector('div[style*="flex:1"]')||row;var hint=document.createElement('span');hint.className='notif-action-hint';hint.textContent='Accepteren →';copy.parentNode.insertBefore(hint,copy.nextSibling);}});}
  function installRenderHook(){if(typeof window.renderNotifs!=='function'||window.renderNotifs.__notificationActionsWrapped)return;var raw=window.renderNotifs;window.renderNotifs=function(){var out=raw.apply(this,arguments);decorateCenter();return out;};window.renderNotifs.__notificationActionsWrapped=true;}
  function installCenterClicks(){
    document.addEventListener('click',function(ev){var row=ev.target&&ev.target.closest&&ev.target.closest('#notif-list [data-notif-id]');if(!row)return;var event=byId(row.getAttribute('data-notif-id'));if(!isActionable(event))return;ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();run(event).then(function(){if(typeof window.renderNotifs==='function')window.renderNotifs();}).catch(function(err){console.warn('[NotificationActions]',err);if(typeof window.showToast==='function')window.showToast('Hulp accepteren mislukt');});},true);
    window.addEventListener('familyapp:notifications-changed',decorateCenter);
    window.addEventListener('load',function(){installRenderHook();decorateCenter();});
  }

  window.NotificationActions={version:VERSION,isActionable:isActionable,run:run,acceptTaskHelp:acceptTaskHelp,byId:byId,decorateCenter:decorateCenter};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installCenterClicks);else installCenterClicks();
})();