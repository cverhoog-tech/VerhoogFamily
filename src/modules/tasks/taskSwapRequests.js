'use strict';
// ============================================================
// TASK SWAP REQUESTS v2.0.0
// UID-based swap controller. Firebase owns request state; TaskSharedData owns
// task assignment. No polling, MutationObserver or TaskDetailPopup monkey patch.
// ============================================================
(function(){
  if(window.TaskSwapRequests&&window.TaskSwapRequests.version==='2.0.0')return;

  var VERSION='2.0.0';
  var modalId='task-swap-request-modal';
  var currentTaskId=null;
  var requests=[];
  var pendingIncoming=[];
  var statusById={};
  var ref=null;
  var subscriptionKey='';

  function db(){try{return window.fbDb||firebase.database();}catch(e){return null;}}
  function uid(){try{var u=window.fbUser||(window.fbAuth&&window.fbAuth.currentUser)||firebase.auth().currentUser;return u&&u.uid||null;}catch(e){return null;}}
  function hid(){return window.fbFamilyId||null;}
  function members(){try{return window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members()||[]:[];}catch(e){return[];}}
  function member(id){return members().find(function(m){return String(m.uid||m.id)===String(id);})||null;}
  function nameOf(id,fallback){var m=member(id);return (m&&(m.displayName||m.name))||fallback||'Gezinslid';}
  function avatarOf(id){var m=member(id);if(!m)return'';try{return m.avatar||m.avatarUrl||m.photoURL||m.profilePhoto||localStorage.getItem('fam_avatar_'+String(m.displayName||m.name||'').toLowerCase())||'';}catch(e){return m.avatar||m.avatarUrl||m.photoURL||m.profilePhoto||'';}}
  function initials(v){return String(v||'G').trim().split(/\s+/).map(function(x){return x.charAt(0);}).join('').slice(0,2).toUpperCase()||'G';}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function toast(m){if(typeof window.showToast==='function')window.showToast(m);}
  function task(id){return (window.taskData||[]).find(function(t){return String(t.id||t._key)===String(id);})||null;}
  function isAssignedTo(t,id){return !!(t&&t.assignedToUids&&t.assignedToUids[id]);}
  function selfName(){return nameOf(uid(),(window.fbUser&&window.fbUser.displayName)||window.myName||'Gezinslid');}

  function ensureCss(){
    if(document.getElementById('task-swap-request-css'))return;
    var s=document.createElement('style');s.id='task-swap-request-css';s.textContent=[
      '#tdp-overlay .tdp-hero{position:relative}',
      '#tdp-overlay .tdp-hero>.tsr-trigger{position:absolute!important;top:10px!important;right:70px!important;left:auto!important;bottom:auto!important;transform:none!important;z-index:30!important;width:34px!important;height:34px!important;min-width:34px!important;min-height:34px!important;max-width:34px!important;max-height:34px!important;margin:0!important;padding:0!important;display:grid!important;place-items:center!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;overflow:visible!important;border-radius:50%;border:1.5px solid rgba(216,181,82,.72);background:rgba(255,255,255,.92);color:#6d28d9;box-shadow:0 4px 12px rgba(30,15,50,.18);font-size:17px;font-weight:900;-webkit-appearance:none;appearance:none}',
      '#tdp-overlay .tdp-hero>.tsr-trigger:active{transform:scale(.94)!important}',
      '[data-theme*="dark"] #tdp-overlay .tsr-trigger{background:rgba(20,15,36,.88);border-color:#caa153;color:#e0bf69}',
      '#tdp-overlay .tsr-trigger.is-pending:after{content:"";position:absolute;right:-1px;top:-1px;width:8px;height:8px;border-radius:50%;background:#a855f7;border:1.5px solid #fff}',
      '@media(max-width:380px){#tdp-overlay .tdp-hero>.tsr-trigger{right:66px!important}}',
      '.tsr-overlay{position:fixed;inset:0;z-index:10160;background:rgba(8,6,16,.66);backdrop-filter:blur(9px);display:flex;align-items:flex-end;justify-content:center;padding:16px}',
      '.tsr-card{width:min(440px,100%);max-height:84vh;overflow:auto;border-radius:24px;background:linear-gradient(180deg,#fbf7ee,#f7f0e4);border:1.5px solid rgba(180,138,60,.55);box-shadow:0 28px 80px rgba(20,10,40,.38);padding:18px;color:#241f1a}',
      '[data-theme*="dark"] .tsr-card{background:linear-gradient(180deg,#171126,#0f0d18);border-color:rgba(216,181,82,.58);color:#f6f0fb}',
      '.tsr-head{display:flex;gap:12px;align-items:center;margin-bottom:12px}.tsr-crest{width:48px;height:54px;flex:0 0 48px;display:grid;place-items:center;clip-path:polygon(50% 0,92% 14%,86% 70%,50% 100%,14% 70%,8% 14%);background:linear-gradient(160deg,#d6b45c,#946c23);color:#2a173b;font-size:21px}.tsr-head h3{margin:0;font:800 20px/1.1 Georgia,serif}.tsr-head p{margin:4px 0 0;color:#81766a;font-size:11px;line-height:1.4}[data-theme*="dark"] .tsr-head p{color:#b9afc1}',
      '.tsr-focus{border:1px solid rgba(180,138,60,.22);background:rgba(255,255,255,.58);border-radius:14px;padding:11px 12px;margin-bottom:11px}.tsr-focus small{display:block;color:#8a7f70;font-size:9px;text-transform:uppercase;letter-spacing:.8px;font-weight:900}.tsr-focus b{display:block;font:800 16px/1.25 Georgia,serif;margin-top:3px}[data-theme*="dark"] .tsr-focus{background:rgba(255,255,255,.04);border-color:rgba(216,181,82,.2)}[data-theme*="dark"] .tsr-focus small{color:#aaa0b3}',
      '.tsr-list{display:grid;gap:8px}.tsr-person{width:100%;display:flex;align-items:center;gap:10px;border:1px solid rgba(109,40,217,.14);background:rgba(255,255,255,.68);border-radius:14px;padding:10px;text-align:left;color:inherit}.tsr-person:active{transform:scale(.99)}[data-theme*="dark"] .tsr-person{background:#1b1726;border-color:rgba(216,181,82,.18)}',
      '.tsr-avatar{width:38px;height:38px;flex:0 0 38px;border-radius:50%;display:grid;place-items:center;object-fit:cover;overflow:hidden;background:linear-gradient(135deg,#6d28d9,#a855f7);color:#fff;border:2px solid #d8b552;font-size:10px;font-weight:900}.tsr-person b{display:block;font-size:13px}.tsr-person small{display:block;color:#8a7f8f;font-size:10px;margin-top:2px}.tsr-arrow{margin-left:auto;color:#8b5cca;font-size:17px;font-weight:900}',
      '.tsr-actions{display:flex;gap:9px;margin-top:14px}.tsr-btn{flex:1;border:0;border-radius:13px;padding:11px 12px;font-weight:900;font-size:12px}.tsr-muted{background:#eee8e2;color:#655d68}.tsr-purple{background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff}.tsr-danger{background:#f5dfe3;color:#a3223c}[data-theme*="dark"] .tsr-muted{background:#262130;color:#c9c0d1}[data-theme*="dark"] .tsr-danger{background:#3a1720;color:#ffb3c0}',
      '.tsr-note{font-size:10.5px;line-height:1.45;color:#7f7585;background:rgba(109,40,217,.06);border-radius:11px;padding:9px;margin-top:9px}[data-theme*="dark"] .tsr-note{color:#aaa1b4;background:rgba(255,255,255,.04)}'
    ].join('\n');document.head.appendChild(s);
  }

  function avatarHtml(id){var u=avatarOf(id),n=nameOf(id);return u?'<img class="tsr-avatar" src="'+esc(u)+'" alt="'+esc(n)+'">':'<span class="tsr-avatar">'+esc(initials(n))+'</span>';}
  function close(){var x=document.getElementById(modalId);if(x)x.remove();}
  function modal(html){ensureCss();close();var e=document.createElement('div');e.id=modalId;e.className='tsr-overlay';e.innerHTML='<div class="tsr-card">'+html+'</div>';document.body.appendChild(e);e.onclick=function(ev){if(ev.target===e)close();};return e;}
  function requestForTask(taskId){return requests.find(function(r){return String(r.taskId)===String(taskId)&&r.status==='pending'&&(r.requesterUid===uid()||r.targetUid===uid());})||null;}

  function availableTargets(t){var me=uid();return members().filter(function(m){var id=m.uid||m.id;return id&&String(id)!==String(me)&&!isAssignedTo(t,String(id));});}

  function chooseTarget(taskId){
    var t=task(taskId),me=uid();if(!t||!me)return;
    currentTaskId=String(t.id||t._key);
    if(t.done){toast('Een voltooide taak kan niet worden geruild');return;}
    if(!isAssignedTo(t,me)){toast('Je kunt alleen een taak ruilen die aan jou is toegewezen');return;}
    var existing=requestForTask(currentTaskId);if(existing){showRequest(existing);return;}
    var list=availableTargets(t);if(!list.length){toast('Er is geen ander gezinslid beschikbaar voor deze ruil');return;}
    var e=modal('<div class="tsr-head"><div class="tsr-crest">⇄</div><div><h3>Taak ruilen</h3><p>Vraag een ander partylid om deze taak van je over te nemen.</p></div></div><div class="tsr-focus"><small>Quest</small><b>'+esc(t.title||'Taak')+'</b></div><div class="tsr-list">'+list.map(function(m){var id=String(m.uid||m.id);return '<button class="tsr-person" data-target="'+esc(id)+'">'+avatarHtml(id)+'<span><b>'+esc(nameOf(id))+'</b><small>Stuur ruilverzoek</small></span><span class="tsr-arrow">›</span></button>';}).join('')+'</div><div class="tsr-actions"><button class="tsr-btn tsr-muted" data-close>Annuleren</button></div>');
    e.querySelector('[data-close]').onclick=close;e.querySelectorAll('[data-target]').forEach(function(b){b.onclick=function(){sendRequest(t,b.getAttribute('data-target'));};});
  }

  function openPicker(){
    var me=uid();if(!me){toast('Log in om taken te ruilen');return;}
    var list=(window.taskData||[]).filter(function(t){return !t.done&&isAssignedTo(t,me);});
    if(!list.length){toast('Je hebt geen open taken om te ruilen');return;}
    var e=modal('<div class="tsr-head"><div class="tsr-crest">⇄</div><div><h3>Taak ruilen</h3><p>Kies welke quest je wilt overdragen aan een ander partylid.</p></div></div><div class="tsr-list">'+list.map(function(t){var id=String(t.id||t._key);return '<button class="tsr-person" data-task="'+esc(id)+'"><span class="tsr-avatar">⚔</span><span><b>'+esc(t.title||'Taak')+'</b><small>'+esc(t.date||'Geen datum')+'</small></span><span class="tsr-arrow">›</span></button>';}).join('')+'</div><div class="tsr-actions"><button class="tsr-btn tsr-muted" data-close>Annuleren</button></div>');
    e.querySelector('[data-close]').onclick=close;e.querySelectorAll('[data-task]').forEach(function(b){b.onclick=function(){chooseTarget(b.getAttribute('data-task'));};});
  }

  function sendRequest(t,targetUid){
    var d=db(),family=hid(),me=uid();if(!d||!family||!me)return;
    var base=d.ref('families/'+family+'/taskSwapRequests'),id=base.push().key;
    var row={id:id,taskId:String(t.id||t._key),taskTitle:String(t.title||'Taak'),requesterUid:me,requesterName:selfName(),targetUid:String(targetUid),targetName:nameOf(targetUid),status:'pending',createdAt:firebase.database.ServerValue.TIMESTAMP,updatedAt:firebase.database.ServerValue.TIMESTAMP};
    base.child(id).set(row).then(function(){close();toast('Ruilverzoek verstuurd naar '+nameOf(targetUid));}).catch(function(){toast('Ruilverzoek versturen mislukt');});
  }

  function showRequest(r){
    var incoming=String(r.targetUid)===String(uid()),t=task(r.taskId),other=incoming?r.requesterUid:r.targetUid;
    var e=modal('<div class="tsr-head"><div class="tsr-crest">⇄</div><div><h3>'+(incoming?'Ruilverzoek':'Ruilverzoek verstuurd')+'</h3><p>'+(incoming?'<b>'+esc(r.requesterName||nameOf(r.requesterUid))+'</b> vraagt of jij deze taak wilt overnemen.':'Wachten op antwoord van <b>'+esc(r.targetName||nameOf(r.targetUid))+'</b>.')+'</p></div></div><div class="tsr-focus"><small>Quest</small><b>'+esc(r.taskTitle||(t&&t.title)||'Taak')+'</b></div><div class="tsr-person" style="pointer-events:none">'+avatarHtml(other)+'<span><b>'+esc(nameOf(other,incoming?r.requesterName:r.targetName))+'</b><small>'+(incoming?'Wil deze taak met jou ruilen':'Ontvanger van het verzoek')+'</small></span></div><div class="tsr-note">De taak wordt pas opnieuw toegewezen nadat het verzoek is geaccepteerd.</div><div class="tsr-actions">'+(incoming?'<button class="tsr-btn tsr-muted" data-decline>Weigeren</button><button class="tsr-btn tsr-purple" data-accept>Accepteren</button>':'<button class="tsr-btn tsr-danger" data-cancel>Intrekken</button><button class="tsr-btn tsr-muted" data-close>Sluiten</button>')+'</div>');
    var c=e.querySelector('[data-close]');if(c)c.onclick=close;var a=e.querySelector('[data-accept]');if(a)a.onclick=function(){accept(r);};var n=e.querySelector('[data-decline]');if(n)n.onclick=function(){respond(r,'declined');};var x=e.querySelector('[data-cancel]');if(x)x.onclick=function(){respond(r,'cancelled');};
  }

  function respond(r,status){var d=db(),family=hid();if(!d||!family||!r)return Promise.reject(new Error('Ruilverzoek niet beschikbaar'));return d.ref('families/'+family+'/taskSwapRequests/'+r.id).update({status:status,updatedAt:firebase.database.ServerValue.TIMESTAMP,respondedAt:firebase.database.ServerValue.TIMESTAMP}).then(function(){close();toast(status==='declined'?'Ruilverzoek geweigerd':'Ruilverzoek ingetrokken');});}

  function accept(r){
    var t=task(r.taskId),me=uid();if(!t||!me||String(r.targetUid)!==String(me))return Promise.reject(new Error('Ruilverzoek niet gevonden'));
    if(!window.TaskSharedData||typeof TaskSharedData.update!=='function'){toast('Taakdata is nog niet klaar');return Promise.reject(new Error('Taakdata is nog niet klaar'));}
    var next={};Object.keys(t.assignedToUids||{}).forEach(function(k){if(t.assignedToUids[k]&&String(k)!==String(r.requesterUid))next[k]=true;});next[me]=true;
    var names=Object.keys(next).map(function(k){return nameOf(k);});
    return TaskSharedData.update(t.id||t._key,{assignedToUids:next,assignedToUid:me,who:names}).then(function(){return db().ref('families/'+hid()+'/taskSwapRequests/'+r.id).update({status:'accepted',updatedAt:firebase.database.ServerValue.TIMESTAMP,respondedAt:firebase.database.ServerValue.TIMESTAMP,acceptedAt:firebase.database.ServerValue.TIMESTAMP});}).then(function(){close();toast('Taak overgenomen: '+(t.title||'Taak'));}).catch(function(error){toast('Taak ruilen mislukt');throw error;});
  }

  // ------------------------------------------------------------
  // Public, minimal API for external callers (e.g. Action Inbox) that need
  // to accept/decline a specific pending incoming swap request by id without
  // opening the modal UI. No new writer: delegates to the same accept()/
  // respond() functions the modal itself uses.
  // ------------------------------------------------------------
  function incomingPendingById(id){return pendingIncoming.find(function(r){return String(r.id)===String(id);})||null;}
  function acceptRequest(id){var r=incomingPendingById(id);if(!r)return Promise.reject(new Error('Ruilverzoek is niet meer actief'));return accept(r);}
  function declineRequest(id){var r=incomingPendingById(id);if(!r)return Promise.reject(new Error('Ruilverzoek is niet meer actief'));return respond(r,'declined');}

  function decorateTrigger(){
    ensureCss();var hero=document.querySelector('#tdp-overlay .tdp-hero');if(!hero||!currentTaskId)return;
    var old=hero.querySelector('.tsr-trigger');if(old)old.remove();var t=task(currentTaskId);if(!t||t.done||!isAssignedTo(t,uid()))return;
    var b=document.createElement('button');b.type='button';b.className='tsr-trigger'+(requestForTask(currentTaskId)?' is-pending':'');b.setAttribute('aria-label','Taak ruilen');b.title='Taak ruilen';b.textContent='⇄';b.onclick=function(e){e.preventDefault();e.stopPropagation();chooseTarget(currentTaskId);};hero.appendChild(b);
  }

  function snapshot(rows){
    var me=uid();requests=[];pendingIncoming=[];
    Object.keys(rows||{}).forEach(function(k){var r=rows[k];if(!r)return;if(!r.id)r.id=k;if(String(r.requesterUid)!==String(me)&&String(r.targetUid)!==String(me))return;requests.push(r);if(String(r.targetUid)===String(me)&&r.status==='pending')pendingIncoming.push(r);var prev=statusById[r.id];statusById[r.id]=r.status;if(prev&&prev!==r.status){if(String(r.requesterUid)===String(me)&&r.status==='accepted')toast((r.targetName||nameOf(r.targetUid))+' heeft “'+(r.taskTitle||'de taak')+'” overgenomen');else if(String(r.requesterUid)===String(me)&&r.status==='declined')toast((r.targetName||nameOf(r.targetUid))+' heeft het ruilverzoek geweigerd');}});
    decorateTrigger();
  }

  function start(){
    var d=db(),family=hid(),me=uid();if(!d||!family||!me)return false;
    var key=String(family)+'|'+String(me);if(ref&&subscriptionKey===key)return true;
    if(ref)try{ref.off();}catch(e){}
    subscriptionKey=key;ref=d.ref('families/'+family+'/taskSwapRequests');ref.on('value',function(s){snapshot(s.val()||{});});return true;
  }

  function onTaskCardCapture(e){
    var row=e.target&&e.target.closest&&e.target.closest('[data-task-id]');if(!row)return;
    currentTaskId=row.getAttribute('data-task-id');
    Promise.resolve().then(decorateTrigger);
  }

  ensureCss();
  document.addEventListener('click',onTaskCardCapture,true);
  window.addEventListener('familyapp:tasks-updated',decorateTrigger);
  window.addEventListener('familyapp:household-members-updated',start);
  window.addEventListener('familyapp:household-changed',start);
  window.addEventListener('familyapp:household-identity-synced',start);
  window.addEventListener('focus',start);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();

  window.TaskSwapRequests={version:VERSION,open:function(taskId){chooseTarget(taskId);},openPicker:openPicker,pending:function(){return pendingIncoming.slice();},requests:function(){return requests.slice();},refresh:start,acceptRequest:acceptRequest,declineRequest:declineRequest};
  // Existing task-tab markup still calls openTradeSheet(). Make that public
  // entrypoint use the UID-based controller; the old name-based implementation
  // in achievements.js is no longer the runtime owner.
  window.openTradeSheet=openPicker;
})();
