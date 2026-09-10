'use strict';
// ============================================================
// CLEANING HELP NOTIFICATION UI v0.1.0
// Adds accept/decline controls to the existing NotificationCenter detail for
// cleaning.help.requested events without changing the frozen STEP 10
// NotificationActions core. Canonical mutation remains exclusively owned by
// CleaningExceptionRuntime.respondToHelpRequest().
// ============================================================
(function(){
  if(window.CleaningHelpNotificationUi)return;

  var VERSION='0.1.0';
  var activeNotificationId=null,busy=false;

  function text(value){return String(value==null?'':value).trim();}
  function currentUid(){try{var c=window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;return c&&c.ready?text(c.uid):'';}catch(error){return'';}}
  function eventById(id){
    try{
      if(window.NotificationActions&&typeof NotificationActions.byId==='function')return NotificationActions.byId(id);
      var rows=window.NotificationStore&&typeof NotificationStore.list==='function'?NotificationStore.list():[];
      return(Array.isArray(rows)?rows:[]).find(function(row){return text(row&&row.id)===text(id);})||null;
    }catch(error){return null;}
  }
  function occurrenceFromRepository(event){
    var id=text(event&&event.data&&event.data.occurrenceId);if(!id)return null;
    try{
      var repo=window.CleaningHouseholdRepository,snapshot=repo&&typeof repo.snapshot==='function'?repo.snapshot():null;
      var data=snapshot&&snapshot.ready===true?snapshot.data:null;
      return data&&data.occurrences&&data.occurrences[id]||null;
    }catch(error){return null;}
  }
  function modelForEvent(event){
    if(!event||text(event.type)!=='cleaning.help.requested')return null;
    var occurrenceId=text(event.data&&event.data.occurrenceId);
    if(!occurrenceId)return{statusLabel:'Niet meer actief',detail:'Deze hulpvraag mist de schoonmaakbeurt.',actions:[]};
    var occurrence=occurrenceFromRepository(event),request=occurrence&&occurrence.helpRequest,status=text(request&&request.status).toUpperCase(),me=currentUid();
    if(request){
      if(status==='ACCEPTED')return{statusLabel:'Geaccepteerd ✓',detail:'Je helpt mee met deze schoonmaakbeurt.',actions:[]};
      if(status==='DECLINED')return{statusLabel:'Afgewezen',detail:'Je hebt deze hulpvraag afgewezen.',actions:[]};
      if(status&&status!=='PENDING')return{statusLabel:'Niet meer actief',detail:'Deze hulpvraag is al afgehandeld.',actions:[]};
      if(text(request.toUid)&&me&&text(request.toUid)!==me)return{statusLabel:'Niet voor jou',detail:'Deze hulpvraag is voor een ander gezinslid.',actions:[]};
    }
    // The notification projector publishes this event only to helpRequest.toUid.
    // If the Cleaning repository is not mounted yet, the targeted notification
    // itself is enough to render the controls; the runtime re-validates the
    // canonical request before committing either response.
    return{statusLabel:'Wacht op jouw reactie',detail:'Wil je meehelpen met deze schoonmaakbeurt?',actions:[{label:'Accepteren',action:'accept',cls:''},{label:'Afwijzen',action:'decline',cls:'is-danger'}]};
  }
  function closeDetail(){var close=typeof document!=='undefined'&&document.querySelector('#nc-detail-popover [data-detail-close]');if(close&&typeof close.click==='function')close.click();activeNotificationId=null;}
  function markRead(event){try{return window.NotificationStore&&event&&event.id?Promise.resolve(NotificationStore.markRead(event.id)):Promise.resolve();}catch(error){return Promise.resolve();}}
  function respond(event,action){
    if(!event||text(event.type)!=='cleaning.help.requested')return Promise.reject(new Error('Geen schoonmaakhulpvraag'));
    var occurrenceId=text(event.data&&event.data.occurrenceId);if(!occurrenceId)return Promise.reject(new Error('Schoonmaakbeurt ontbreekt'));
    var runtime=window.CleaningExceptionRuntime;
    if(!runtime||typeof runtime.respondToHelpRequest!=='function')return Promise.reject(new Error('Schoonmaakhulp wordt nog geladen'));
    var runtimeAction=action==='decline'?'DECLINE_HELP':'ACCEPT_HELP';
    return Promise.resolve(runtime.respondToHelpRequest(occurrenceId,runtimeAction)).then(function(result){
      return markRead(event).then(function(){return result;});
    });
  }
  function decorate(id){
    if(typeof document==='undefined')return false;
    var event=eventById(id),model=modelForEvent(event),popover=document.getElementById('nc-detail-popover');
    if(!event||!model||!popover)return false;
    var card=popover.querySelector('.nc-detail-card');if(!card)return false;
    var existing=card.querySelector('[data-cleaning-help-notification-actions]');if(existing)existing.remove();
    var status=card.querySelector('.nc-detail-status'),title=card.querySelector('.nc-detail-title');
    if(!status&&title&&title.parentNode){status=document.createElement('div');status.className='nc-detail-status';title.parentNode.appendChild(status);}
    if(status)status.textContent=model.statusLabel||'';
    var body=card.querySelector('.nc-detail-body');if(body&&model.detail)body.textContent=model.detail;
    if(!model.actions||!model.actions.length)return true;
    var wrap=document.createElement('div');wrap.className='nc-detail-actions';wrap.setAttribute('data-cleaning-help-notification-actions','1');
    model.actions.forEach(function(item){var button=document.createElement('button');button.type='button';button.className='nc-detail-btn'+(item.cls?' '+item.cls:'');button.setAttribute('data-cleaning-help-notification-action',item.action);button.textContent=item.label;button.disabled=busy;wrap.appendChild(button);});
    card.appendChild(wrap);return true;
  }
  function scheduleDecorate(id){activeNotificationId=text(id)||activeNotificationId;if(!activeNotificationId)return;window.setTimeout(function(){decorate(activeNotificationId);},0);}
  function runAction(action){
    if(busy||!activeNotificationId)return;var event=eventById(activeNotificationId);if(!event)return;
    busy=true;decorate(activeNotificationId);
    respond(event,action).then(function(){
      busy=false;
      if(typeof window.showToast==='function')window.showToast(action==='decline'?'Hulpvraag afgewezen':'Je helpt mee ✓');
      closeDetail();if(window.NotificationCenter&&typeof NotificationCenter.render==='function')NotificationCenter.render();
    }).catch(function(error){busy=false;decorate(activeNotificationId);if(typeof window.showToast==='function')window.showToast(text(error&&error.message)||'Reactie kon niet worden opgeslagen');});
  }
  function onClick(event){
    var target=event.target&&event.target.closest?event.target:null;if(!target)return;
    var action=target.closest('[data-cleaning-help-notification-action]');
    if(action){event.preventDefault();event.stopPropagation();runAction(text(action.getAttribute('data-cleaning-help-notification-action')));return;}
    var row=target.closest('#notif-list [data-notif-id]');if(row)scheduleDecorate(row.getAttribute('data-notif-id'));
    if(target.closest('#nc-detail-popover [data-detail-close]'))activeNotificationId=null;
  }
  function onKey(event){if(event.key!=='Enter'&&event.key!==' ')return;var row=event.target&&event.target.closest&&event.target.closest('#notif-list [data-notif-id]');if(row)scheduleDecorate(row.getAttribute('data-notif-id'));}
  function refresh(){if(activeNotificationId)scheduleDecorate(activeNotificationId);}
  function start(){
    if(window.__cleaningHelpNotificationUiStarted)return true;
    window.__cleaningHelpNotificationUiStarted=true;
    if(typeof document==='undefined')return false;
    document.addEventListener('click',onClick,true);document.addEventListener('keydown',onKey,true);
    window.addEventListener('familyapp:cleaning-repository',refresh);
    window.addEventListener('familyapp:notifications-changed',refresh);
    return true;
  }

  window.CleaningHelpNotificationUi={version:VERSION,start:start,modelForEvent:modelForEvent,respond:respond,decorate:decorate};
  start();
})();