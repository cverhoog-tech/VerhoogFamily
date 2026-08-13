'use strict';
(function(){
  if(window.__taskSwapRuntimeV1)return;
  window.__taskSwapRuntimeV1=true;

  var ref=null,requests=[],seen={},modalId='task-swap-runtime-modal';
  function db(){try{return window.fbDb||firebase.database();}catch(e){return null;}}
  function uid(){try{var u=window.fbUser||(window.fbAuth&&window.fbAuth.currentUser)||firebase.auth().currentUser;return u&&u.uid||null;}catch(e){return null;}}
  function hid(){return window.fbFamilyId||null;}
  function members(){try{return window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members()||[]:[];}catch(e){return[];}}
  function member(id){return members().find(function(m){return String(m.uid||m.id)===String(id);})||null;}
  function nameOf(id,fallback){var m=member(id);return (m&&(m.displayName||m.name))||fallback||'Gezinslid';}
  function avatarOf(id){var m=member(id);if(!m)return'';try{return m.avatarUrl||m.photoURL||m.profilePhoto||m.avatar||localStorage.getItem('fam_avatar_'+String(m.displayName||m.name||'').toLowerCase())||'';}catch(e){return'';}}
  function initials(v){return String(v||'G').trim().split(/\s+/).map(function(x){return x.charAt(0);}).join('').slice(0,2).toUpperCase()||'G';}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function task(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||null;}
  function toast(m){if(typeof window.showToast==='function')window.showToast(m);}
  function close(){var e=document.getElementById(modalId);if(e)e.remove();}
  function avatarHtml(id){var u=avatarOf(id),n=nameOf(id);return u?'<img class="tsu-avatar" src="'+esc(u)+'" alt="'+esc(n)+'">':'<span class="tsu-avatar">'+esc(initials(n))+'</span>';}
  function ensureUiCss(){if(document.getElementById('task-swap-ui-css'))return;}

  function showIncoming(r){
    ensureUiCss();if(window.TaskSwapUi&&TaskSwapUi.close)TaskSwapUi.close();close();
    var e=document.createElement('div');e.id=modalId;e.className='tsu-overlay';e.innerHTML='<div class="tsu-card"><div class="tsu-head"><div class="tsu-crest">⇄</div><div><h3>Ruilverzoek</h3><p><b>'+esc(r.requesterName||nameOf(r.requesterUid))+'</b> vraagt of jij deze taak wilt overnemen.</p></div></div><div class="tsu-focus"><small>Quest</small><b>'+esc(r.taskTitle||'Taak')+'</b></div><div class="tsu-person" style="pointer-events:none">'+avatarHtml(r.requesterUid)+'<span><b>'+esc(r.requesterName||nameOf(r.requesterUid))+'</b><small>Wil deze taak met jou ruilen</small></span></div><div class="tsu-actions"><button class="tsu-btn tsu-muted" data-no>Weigeren</button><button class="tsu-btn" data-yes style="background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff">Accepteren</button></div></div>';
    document.body.appendChild(e);e.onclick=function(ev){if(ev.target===e)close();};e.querySelector('[data-no]').onclick=function(){respond(r,'declined');};e.querySelector('[data-yes]').onclick=function(){accept(r);};
  }

  function send(taskId,targetUid){
    var d=db(),family=hid(),me=uid(),t=task(taskId);if(!d||!family||!me||!t)return;
    var pending=requests.find(function(r){return r.status==='pending'&&String(r.taskId)===String(taskId)&&(r.requesterUid===me||r.targetUid===me);});
    if(pending){toast('Er loopt al een ruilverzoek voor deze taak');return;}
    var base=d.ref('families/'+family+'/taskSwapRequests'),id=base.push().key;
    base.child(id).set({id:id,taskId:String(t.id),taskTitle:String(t.title||'Taak'),requesterUid:me,requesterName:nameOf(me,'Gezinslid'),targetUid:String(targetUid),targetName:nameOf(targetUid),status:'pending',createdAt:firebase.database.ServerValue.TIMESTAMP,updatedAt:firebase.database.ServerValue.TIMESTAMP}).then(function(){if(window.TaskSwapUi&&TaskSwapUi.close)TaskSwapUi.close();toast('Ruilverzoek verstuurd naar '+nameOf(targetUid));}).catch(function(){toast('Ruilverzoek versturen mislukt');});
  }

  function respond(r,status){
    db().ref('families/'+hid()+'/taskSwapRequests/'+r.id).update({status:status,respondedAt:firebase.database.ServerValue.TIMESTAMP,updatedAt:firebase.database.ServerValue.TIMESTAMP}).then(function(){close();toast(status==='declined'?'Ruilverzoek geweigerd':'Ruilverzoek bijgewerkt');});
  }

  function accept(r){
    var t=task(r.taskId),me=uid();if(!t||String(r.targetUid)!==String(me))return;
    if(!window.TaskSharedData||typeof TaskSharedData.update!=='function'){toast('Taakdata is nog niet klaar');return;}
    var assigned={};Object.keys(t.assignedToUids||{}).forEach(function(k){if(t.assignedToUids[k]&&String(k)!==String(r.requesterUid))assigned[k]=true;});assigned[me]=true;
    var names=Object.keys(assigned).map(function(k){return nameOf(k);});
    TaskSharedData.update(t.id,{assignedToUids:assigned,assignedToUid:me,who:names}).then(function(){return db().ref('families/'+hid()+'/taskSwapRequests/'+r.id).update({status:'accepted',acceptedAt:firebase.database.ServerValue.TIMESTAMP,respondedAt:firebase.database.ServerValue.TIMESTAMP,updatedAt:firebase.database.ServerValue.TIMESTAMP});}).then(function(){close();toast('Taak overgenomen: '+(t.title||'Taak'));}).catch(function(){toast('Taak ruilen mislukt');});
  }

  function snapshot(rows){
    var me=uid();requests=[];var incoming=[];
    Object.keys(rows||{}).forEach(function(k){var r=rows[k];if(!r)return;if(!r.id)r.id=k;if(r.requesterUid!==me&&r.targetUid!==me)return;requests.push(r);if(r.targetUid===me&&r.status==='pending')incoming.push(r);var prev=seen[r.id];seen[r.id]=r.status;if(prev&&prev!==r.status&&r.requesterUid===me){if(r.status==='accepted')toast((r.targetName||nameOf(r.targetUid))+' heeft “'+(r.taskTitle||'de taak')+'” overgenomen');if(r.status==='declined')toast((r.targetName||nameOf(r.targetUid))+' heeft het ruilverzoek geweigerd');}}
    );
    if(incoming.length&&!document.getElementById(modalId)&&!document.getElementById('task-swap-ui-modal'))showIncoming(incoming[0]);
  }
  function start(){var d=db();if(!d||!hid()||!uid())return false;if(ref)try{ref.off();}catch(e){}ref=d.ref('families/'+hid()+'/taskSwapRequests');ref.on('value',function(s){snapshot(s.val()||{});});return true;}
  window.addEventListener('familyapp:task-swap-target-selected',function(e){var d=e&&e.detail||{};if(d.taskId&&d.targetUid)send(d.taskId,d.targetUid);});
  var tries=0,t=setInterval(function(){tries++;if(start()||tries>80)clearInterval(t);},250);
  window.TaskSwapRuntime={send:send,requests:function(){return requests.slice();}};
})();
