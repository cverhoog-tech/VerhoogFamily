'use strict';
// ============================================================
// PARTY QUEST INVITES UI/FACADE v7.1.0
// STEP 11 UX patch: multiple starts, canonical task-create handoff,
// meaningful Arcana task icons, and explicit session-only invite defer.
// Persistence/mutations remain PartyQuestService/Repository;
// identity remains HouseholdContext.
// ============================================================
(function(){
  if(window.__partyQuestInvitesV71)return;
  window.__partyQuestInvitesV71=true;

  var VERSION='7.1.0';
  var repoUnsubscribe=null,current=null,pendingList=[],statusById={},rowsById={},modalId='party-quest-invite-modal';
  var taskCreateHandoff=null,deferredInviteIds={};

  function ctx(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function uid(){var c=ctx();return c&&c.ready&&c.uid||null;}
  function householdId(){var c=ctx();return c&&c.ready&&c.householdId||null;}
  function contextIdentity(c){return c&&c.ready&&c.uid&&c.householdId?[String(c.uid),String(c.householdId),String(c.revision||0)].join('|'):null;}
  function service(){return window.PartyQuestService||null;}
  function repo(){return window.PartyQuestRepository||null;}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function toast(m){if(typeof window.showToast==='function')window.showToast(m);}
  function members(){try{return window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members()||[]:[];}catch(e){return[];}}
  function memberId(m){return m&&(m.uid||m.id)||null;}
  function nameOf(m){return String(m&&(m.displayName||m.name)||'Gezinslid');}
  function isTaskCreator(task,userId){if(window.TaskSharedData&&TaskSharedData.isTaskCreator)return TaskSharedData.isTaskCreator(task,userId);return !!(task&&userId&&String(task.createdByUid||task.ownerUid||'')===String(userId));}
  function taskById(id){return (window.taskData||[]).find(function(t){return String(t&&(t.id||t._key)||'')===String(id||'');})||null;}
  function openTasks(){var me=uid();return (window.taskData||[]).filter(function(t){var s=String(t&&t.status||'').toLowerCase();return t&&(t.id||t._key)&&!t.done&&!t.completed&&s!=='done'&&s!=='completed'&&isTaskCreator(t,me);});}
  function invitees(q){return q&&q.invitees&&typeof q.invitees==='object'?q.invitees:{};}
  function relevant(q){var me=uid();return q&&(String(q.inviterUid||'')===String(me||'')||!!invitees(q)[me]);}
  function myInvite(q){return invitees(q)[uid()]||null;}
  function participantNames(q){var names=[];if(q&&q.inviterUid)names.push(q.inviterName||'Maker');Object.keys(invitees(q)).forEach(function(k){var x=invitees(q)[k];if(x&&x.status==='active')names.push(x.name||'Gezinslid');});return Array.from(new Set(names));}
  function isLive(q){return q&&q.status!=='cancelled'&&q.status!=='completed';}
  function promptKey(q){var mine=myInvite(q)||{},id=q&&(q.id||q._key)||'';return String(id)+':'+String(mine.inviteOccurrenceId||mine.inviteVersion||'pending');}
  function deferInvites(list){(Array.isArray(list)?list:[list]).forEach(function(q){if(q)deferredInviteIds[promptKey(q)]=true;});close();return true;}
  function autoPending(){return pendingList.filter(function(q){return !deferredInviteIds[promptKey(q)];});}

  var ARCANA_FALLBACK={quest:'⚔',laundry:'🧺',cleaning:'🧹',kitchen:'🍳',groceries:'🛒',pantry:'📦',admin:'📜',family:'♟',garden:'🌿',travel:'🧭',dropoff:'↗',pickup:'↙'};
  function taskCategory(task){
    try{if(window.TaskCategoryIcons&&typeof TaskCategoryIcons.detect==='function')return TaskCategoryIcons.detect(task||{});}catch(e){}
    var raw=String(task&&(task.category||task.type||task.title)||'').toLowerCase();
    if(/ophalen|afhalen|pickup|pick up/.test(raw))return'pickup';
    if(/wegbrengen|brengen|afzetten|dropoff|drop off/.test(raw))return'dropoff';
    if(/reis|travel|trip|vakantie|airport|vliegveld/.test(raw))return'travel';
    if(/was|laundry|kleding/.test(raw))return'laundry';
    if(/stof|schoon|clean|dweil|badkamer|toilet/.test(raw))return'cleaning';
    if(/vaat|keuken|kitchen|koken/.test(raw))return'kitchen';
    if(/voorraad|pantry|kast aanvullen|snack|snoep|chips/.test(raw))return'pantry';
    if(/bood|supermarkt|grocer/.test(raw))return'groceries';
    if(/admin|contract|rekening|factuur|bank/.test(raw))return'admin';
    if(/kind|speel|family|gezin/.test(raw))return'family';
    if(/tuin|garden|plant/.test(raw))return'garden';
    return'quest';
  }
  function taskIconHtml(task){
    var cat=taskCategory(task),html='';
    try{if(window.TaskCategoryIcons&&typeof TaskCategoryIcons.icon==='function')html=TaskCategoryIcons.icon(cat,'sm','compact')||'';}catch(e){}
    return '<span class="pqi-arcana pqi-arcana--'+esc(cat)+'" data-party-quest-category="'+esc(cat)+'">'+(html||'<span class="pqi-arcana-fallback" aria-hidden="true">'+esc(ARCANA_FALLBACK[cat]||ARCANA_FALLBACK.quest)+'</span>')+'</span>';
  }
  function crestHtml(){
    var html='';try{if(window.TaskCategoryIcons&&typeof TaskCategoryIcons.icon==='function')html=TaskCategoryIcons.icon('quest','sm','compact')||'';}catch(e){}
    return '<div class="pqi-crest">'+(html||'<span aria-hidden="true">⚔</span>')+'</div>';
  }

  function activeParticipantUids(taskId,sourceRows){
    var blocked={},task=taskById(taskId);
    if(task){
      if(task.assignedToUids&&typeof task.assignedToUids==='object')Object.keys(task.assignedToUids).forEach(function(id){if(task.assignedToUids[id])blocked[String(id)]=true;});
      if(task.assignedToUid)blocked[String(task.assignedToUid)]=true;
      var owner=task.createdByUid||task.ownerUid;if(owner)blocked[String(owner)]=true;
    }
    Object.keys(sourceRows||{}).forEach(function(k){
      var q=sourceRows[k];if(!isLive(q)||String(q.questId||'')!==String(taskId))return;
      if(q.inviterUid)blocked[String(q.inviterUid)]=true;
      Object.keys(invitees(q)).forEach(function(id){var x=invitees(q)[id];if(x&&(x.status==='active'||x.status==='pending'))blocked[String(id)]=true;});
    });
    return blocked;
  }

  function ensureCss(){
    if(document.getElementById('party-quest-invite-css'))return;
    var s=document.createElement('style');s.id='party-quest-invite-css';s.textContent=[
      '.pqi-overlay{position:fixed;inset:0;z-index:10080;background:rgba(8,7,15,.66);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;padding:16px}',
      '.pqi-card{width:min(440px,100%);max-height:82vh;overflow:auto;border-radius:24px;background:linear-gradient(180deg,#171126,#0f0d18);border:1px solid rgba(216,181,82,.48);box-shadow:0 24px 70px rgba(0,0,0,.5);padding:20px;color:#fff}',
      '.pqi-head{display:flex;gap:12px;align-items:center;margin-bottom:14px}.pqi-crest{width:46px;height:50px;display:grid;place-items:center;clip-path:polygon(50% 0,92% 14%,86% 70%,50% 100%,14% 70%,8% 14%);background:linear-gradient(160deg,#6d28d9,#2c1648 72%,#171023);color:#f3d27a;filter:drop-shadow(0 7px 12px rgba(0,0,0,.36));font-size:20px}.pqi-crest>*{max-width:28px;max-height:28px}',
      '.pqi-head h3{margin:0;font:800 20px/1.1 Georgia,serif}.pqi-head p{margin:4px 0 0;color:#bdb4c8;font-size:12px;line-height:1.4}',
      '.pqi-list{display:grid;gap:9px;margin:12px 0}.pqi-row{width:100%;display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,.1);background:#1b1726;color:#fff;border-radius:15px;padding:11px;text-align:left}.pqi-row.is-selected{border-color:#d8b552;background:#2a2038;box-shadow:inset 0 0 0 1px rgba(216,181,82,.22)}.pqi-row b{display:block;font-size:13px}.pqi-row small{display:block;color:#9f96aa;font-size:10px;margin-top:2px}',
      '.pqi-arcana{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;flex:0 0 42px;overflow:hidden;background:radial-gradient(circle at 36% 26%,rgba(216,181,82,.20),transparent 34%),linear-gradient(145deg,#57268c,#28163d 70%,#171020);color:#f2d176;border:1px solid rgba(216,181,82,.38);box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 7px 16px rgba(0,0,0,.18)}.pqi-arcana>*{max-width:30px;max-height:30px}.pqi-arcana svg{width:28px!important;height:28px!important}.pqi-arcana-fallback{font-size:20px;line-height:1;filter:saturate(.8)}',
      '.pqi-create-new{width:100%;display:flex;align-items:center;gap:11px;margin:4px 0 13px;padding:11px;border-radius:15px;border:1px solid rgba(216,181,82,.34);background:linear-gradient(135deg,rgba(91,33,182,.28),rgba(216,181,82,.10));color:#fff;text-align:left}.pqi-create-new .pqi-arcana{border-style:dashed}.pqi-create-new b{display:block;font-size:13px;color:#f4df9f}.pqi-create-new small{display:block;font-size:10px;color:#aaa1b4;margin-top:2px}.pqi-empty{padding:15px 12px;border:1px dashed rgba(255,255,255,.12);border-radius:14px;text-align:center;color:#8f879a;font-size:11px;background:rgba(255,255,255,.025)}',
      '.pqi-avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#6d28d9;border:1.5px solid #d8b552;font-size:10px;font-weight:800;overflow:hidden}.pqi-avatar img{width:100%;height:100%;object-fit:cover}.pqi-check{margin-left:auto;width:24px;height:24px;border-radius:8px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.18);font-size:12px}.is-selected .pqi-check{background:#d8b552;color:#21160a;border-color:#d8b552}',
      '.pqi-actions{display:flex;gap:9px;margin-top:15px}.pqi-btn{flex:1;border:0;border-radius:14px;padding:12px 14px;font-weight:800}.pqi-gold{background:linear-gradient(135deg,#d1ac55,#9e7425);color:#21160a}.pqi-muted{background:#262130;color:#c9c0d1}.pqi-danger{background:#3a1720;color:#ffb3c0}.pqi-new-party{width:100%;margin-top:14px}.pqi-later{width:100%;margin-top:9px;background:transparent;border:1px solid rgba(255,255,255,.13);color:#bdb4c8}.pqi-note{font-size:11px;line-height:1.45;color:#aaa1b4;background:rgba(255,255,255,.04);border-radius:12px;padding:10px;margin-top:10px}.pqi-focus{font:800 17px/1.25 Georgia,serif;color:#f0d78c;margin:10px 0 4px}'
    ].join('');document.head.appendChild(s);
  }
  function avatarHtml(m){var u=m&&(m.avatar||m.avatarUrl||m.photoURL)||'';if(u)return '<span class="pqi-avatar"><img src="'+esc(u)+'" alt=""></span>';var n=nameOf(m),i=n.trim().split(/\s+/).map(function(x){return x[0]||'';}).join('').slice(0,2).toUpperCase();return '<span class="pqi-avatar">'+esc(i||'G')+'</span>';}
  function close(){var x=document.getElementById(modalId);if(x)x.remove();}
  function modal(html){ensureCss();close();var e=document.createElement('div');e.id=modalId;e.className='pqi-overlay';e.innerHTML='<div class="pqi-card">'+html+'</div>';document.body.appendChild(e);e.onclick=function(ev){if(ev.target===e)close();};return e;}
  function failMessage(error,fallback){return error&&error.message&&error.message.indexOf('PARTY_QUEST_')!==0?error.message:fallback;}

  function clearTaskCreateHandoff(){taskCreateHandoff=null;}
  function startTaskCreate(){
    var c=ctx(),key=contextIdentity(c);
    if(!key){toast('Party Quest is nog niet klaar');return false;}
    if(!window.TaskDetailPopup||typeof TaskDetailPopup.openCreate!=='function'){toast('Nieuwe quest maken is nog niet beschikbaar');return false;}
    var existing={};(window.taskData||[]).forEach(function(t){var id=t&&(t.id||t._key);if(id!==undefined&&id!==null)existing[String(id)]=true;});
    taskCreateHandoff={identity:key,startedAt:Date.now(),existing:existing};
    var startedAt=taskCreateHandoff.startedAt;
    setTimeout(function(){if(taskCreateHandoff&&taskCreateHandoff.startedAt===startedAt)clearTaskCreateHandoff();},600000);
    close();TaskDetailPopup.openCreate();return true;
  }
  function completeTaskCreateHandoff(){
    var h=taskCreateHandoff;if(!h)return false;
    var c=ctx();if(!contextIdentity(c)||contextIdentity(c)!==h.identity||Date.now()-h.startedAt>600000){clearTaskCreateHandoff();return false;}
    var candidates=openTasks().filter(function(t){var id=t&&(t.id||t._key);return id!==undefined&&id!==null&&!h.existing[String(id)];}).sort(function(a,b){return Number(b.createdAt||b.updatedAt||0)-Number(a.createdAt||a.updatedAt||0);});
    if(!candidates.length)return false;
    var id=candidates[0].id||candidates[0]._key;clearTaskCreateHandoff();chooseQuests(id);return true;
  }

  function chooseQuests(preselectId){
    if(!uid()||!householdId()||!service()){toast('Party Quest is nog niet klaar');return;}
    var tasks=openTasks(),selected={};if(preselectId!==undefined&&preselectId!==null)selected[String(preselectId)]=true;
    var rows=tasks.length?tasks.map(function(t){var id=t.id||t._key,key=String(id),xp=t.xp||t.xpReward||('+'+(t.xpAmount||20)+' XP');return '<button class="pqi-row'+(selected[key]?' is-selected':'')+'" data-quest="'+esc(id)+'">'+taskIconHtml(t)+'<span><b>'+esc(t.title||t.name||'Naamloze quest')+'</b><small>'+esc(xp)+(t.date?' · '+esc(t.date):'')+'</small></span><span class="pqi-check">✓</span></button>';}).join(''):'<div class="pqi-empty">Je hebt nog geen zelf gestarte open quests. Maak er hierboven direct één aan.</div>';
    var newIcon='<span class="pqi-arcana pqi-arcana--quest"><span class="pqi-arcana-fallback" aria-hidden="true">＋</span></span>';
    var e=modal('<div class="pqi-head">'+crestHtml()+'<div><h3>Start een Party Quest</h3><p>Kies een quest die jij zelf hebt gestart. Daarna zie je alleen beschikbare gezinsleden.</p></div></div><button class="pqi-create-new" data-create-task>'+newIcon+'<span><b>Nieuwe quest maken</b><small>Maak eerst een nieuwe taak en nodig daarna je party uit</small></span></button><div class="pqi-list">'+rows+'</div><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-close>Annuleren</button><button class="pqi-btn pqi-gold" data-next>Deelnemers kiezen</button></div>');
    e.querySelector('[data-create-task]').onclick=startTaskCreate;
    e.querySelector('[data-close]').onclick=close;
    e.querySelectorAll('[data-quest]').forEach(function(b){b.onclick=function(){var id=String(b.getAttribute('data-quest'));selected[id]=!selected[id];b.classList.toggle('is-selected',!!selected[id]);};});
    e.querySelector('[data-next]').onclick=function(){var ids=Object.keys(selected).filter(function(k){return selected[k]&&taskById(k);});if(!ids.length){toast('Kies minstens een quest');return;}chooseInvitees(ids);};
  }

  function chooseInvitees(questIds){
    var me=uid();questIds=questIds.filter(function(taskId){return isTaskCreator(taskById(taskId),me);});
    if(!questIds.length){toast('Alleen de maker van een quest kan deelnemers uitnodigen');chooseQuests();return;}
    var blocked={};questIds.forEach(function(taskId){var b=activeParticipantUids(taskId,rowsById);Object.keys(b).forEach(function(id){blocked[id]=true;});});blocked[String(me)]=true;
    var list=members().filter(function(m){var id=memberId(m);return id&&(!m.status||m.status==='active')&&!blocked[String(id)];});
    if(!list.length){toast('Alle gezinsleden doen al mee, zijn toegewezen of hebben een open uitnodiging');chooseQuests();return;}
    var selected={};
    var e=modal('<div class="pqi-head">'+crestHtml()+'<div><h3>Deelnemers kiezen</h3><p>Actieve deelnemers, toegewezen gezinsleden en pending genodigden zijn uitgefilterd.</p></div></div><div class="pqi-list">'+list.map(function(m){return '<button class="pqi-row" data-person="'+esc(memberId(m))+'">'+avatarHtml(m)+'<span><b>'+esc(nameOf(m))+'</b><small>Gezinslid uitnodigen</small></span><span class="pqi-check">✓</span></button>';}).join('')+'</div><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-back>Terug</button><button class="pqi-btn pqi-gold" data-send>Uitnodigen</button></div>');
    e.querySelector('[data-back]').onclick=chooseQuests;
    e.querySelectorAll('[data-person]').forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-person');selected[id]=!selected[id];b.classList.toggle('is-selected',!!selected[id]);};});
    e.querySelector('[data-send]').onclick=function(){var ids=Object.keys(selected).filter(function(k){return selected[k];});if(!ids.length){toast('Kies minstens een gezinslid');return;}sendInvites(ids,questIds);};
  }

  function sendInvites(targetUids,questIds){
    var s=service();if(!s||typeof s.createInvites!=='function'){toast('Party Quest service is nog niet klaar');return Promise.resolve(false);}
    return s.createInvites(questIds,targetUids).then(function(result){close();var created=result&&result.created||0,total=result&&result.totalTargets||0;toast(created+' quest'+(created===1?'':'s')+' verstuurd naar '+total+' deelnemer'+(total===1?'':'s'));return true;}).catch(function(error){toast(failMessage(error,'Uitnodigingen versturen mislukt'));return false;});
  }

  function respond(q,status){
    var s=service();if(!s||typeof s.respond!=='function'||!q)return Promise.resolve(false);
    return s.respond(q.id||q._key,status).then(function(){close();toast(status==='active'?'Party Quest “'+(q.questTitle||'Quest')+'” geaccepteerd!':'Party Quest geweigerd');return true;}).catch(function(error){close();toast(failMessage(error,'Deze uitnodiging is niet meer actief'));return false;});
  }

  function revokeInvite(questId,targetUid){
    var s=service();if(!s||typeof s.revokeInvite!=='function')return Promise.reject(new Error('Party Quest service is nog niet klaar'));
    return s.revokeInvite(questId,targetUid).then(function(){toast('Uitnodiging ingetrokken');return true;});
  }

  function incoming(q){
    var mine=myInvite(q);if(!mine||mine.status!=='pending')return;
    var e=modal('<div class="pqi-head">'+crestHtml()+'<div><h3>Party Quest-uitnodiging</h3><p><b>'+esc(q.inviterName||'Een gezinslid')+'</b> nodigt je uit voor:</p></div></div><div class="pqi-focus">'+esc(q.questTitle||'Party Quest')+'</div><div class="pqi-note">Je kunt nu reageren of later beslissen. Zolang je niet reageert blijft de uitnodiging open.</div><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-no>Weigeren</button><button class="pqi-btn pqi-gold" data-yes>Accepteren</button></div><button class="pqi-btn pqi-later" data-later>Later beslissen</button>');
    e.querySelector('[data-no]').onclick=function(){respond(q,'declined');};
    e.querySelector('[data-yes]').onclick=function(){respond(q,'active');};
    e.querySelector('[data-later]').onclick=function(){deferInvites([q]);};
  }
  function incomingQueue(list){
    if(!list.length)return;if(list.length===1){incoming(list[0]);return;}
    var e=modal('<div class="pqi-head">'+crestHtml()+'<div><h3>'+list.length+' Party Quest-uitnodigingen</h3><p>Reageer per quest of bekijk ze later opnieuw via de Party Quest-tegel.</p></div></div><div class="pqi-list">'+list.map(function(q){var task=taskById(q.questId)||{title:q.questTitle||'Party Quest'};return '<div class="pqi-row" style="flex-wrap:wrap">'+taskIconHtml(task)+'<span style="flex:1;min-width:0"><b>'+esc(q.questTitle||'Party Quest')+'</b><small>Van '+esc(q.inviterName||'Gezinslid')+'</small></span><div class="pqi-actions" style="width:100%;margin-top:4px"><button class="pqi-btn pqi-muted" data-no="'+esc(q.id)+'">Weigeren</button><button class="pqi-btn pqi-gold" data-yes="'+esc(q.id)+'">Accepteren</button></div></div>';}).join('')+'</div><button class="pqi-btn pqi-later" data-later>Later beslissen</button>');
    e.querySelector('[data-later]').onclick=function(){deferInvites(list);};
    e.querySelectorAll('[data-no]').forEach(function(b){b.onclick=function(){var q=list.find(function(x){return String(x.id)===String(b.getAttribute('data-no'));});if(q)respond(q,'declined');};});
    e.querySelectorAll('[data-yes]').forEach(function(b){b.onclick=function(){var q=list.find(function(x){return String(x.id)===String(b.getAttribute('data-yes'));});if(q)respond(q,'active');};});
  }

  function end(q){
    var s=service();if(!s||typeof s.cancelQuest!=='function')return Promise.reject(new Error('Party Quest service is nog niet klaar'));
    var wasActive=q&&q.status==='active';
    return s.cancelQuest(q.id||q._key).then(function(){close();toast(wasActive?'Party Quest beëindigd':'Uitnodigingen ingetrokken');return true;}).catch(function(error){toast(failMessage(error,'Party Quest beëindigen mislukt'));return false;});
  }
  function startNew(){chooseQuests();return true;}
  function showStatus(q){
    if(pendingList.length){incomingQueue(pendingList);return;}if(!q){chooseQuests();return;}
    var mine=myInvite(q);if(mine&&mine.status==='pending'){incoming(q);return;}
    var names=participantNames(q),active=q.status==='active',task=taskById(q.questId)||{title:q.questTitle};
    var e=modal('<div class="pqi-head">'+crestHtml()+'<div><h3>'+(active?'Party Quest actief':'Uitnodiging verstuurd')+'</h3><p>'+(names.length?esc(names.join(', ')):'Nog geen deelnemers')+'</p></div></div><div style="display:flex;align-items:center;gap:11px">'+taskIconHtml(task)+'<div class="pqi-focus" style="margin:0">'+esc(q.questTitle||'Party Quest')+'</div></div><button class="pqi-btn pqi-gold pqi-new-party" data-new-party>＋ Nieuwe Party Quest</button><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-close>Sluiten</button>'+(String(q.inviterUid||'')===String(uid()||'')?'<button class="pqi-btn pqi-danger" data-end>'+(active?'Beëindigen':'Alles intrekken')+'</button>':'')+'</div>');
    e.querySelector('[data-new-party]').onclick=startNew;e.querySelector('[data-close]').onclick=close;var endBtn=e.querySelector('[data-end]');if(endBtn)endBtn.onclick=function(){end(q);};
  }

  function decorate(){
    var b=document.getElementById('tch-party-quest');if(!b)return;var h=b.querySelector('b'),s=b.querySelector('small');
    if(pendingList.length){if(h)h.textContent=pendingList.length===1?'Party Quest-uitnodiging':pendingList.length+' Party Quest-uitnodigingen';if(s)s.textContent=pendingList.length===1?(pendingList[0].questTitle||'Party Quest')+' · van '+(pendingList[0].inviterName||'Gezinslid'):'Tik om alle uitnodigingen te bekijken';return;}
    if(!current){if(h)h.textContent='Party Quest starten';if(s)s.textContent='Nodig beschikbare gezinsleden uit voor een quest die jij hebt gestart';return;}
    if(current.status==='pending'){if(h)h.textContent='Uitnodigingen verstuurd';if(s)s.textContent=current.questTitle||'Party Quest';}else if(current.status==='active'){if(h)h.textContent='Party Quest actief';if(s)s.textContent=(current.questTitle||'Party Quest')+' · '+participantNames(current).join(', ');}
  }

  function snapshot(list){
    rowsById={};(Array.isArray(list)?list:[]).forEach(function(q){if(q){var id=String(q._key||q.id||'');if(id){if(!q.id)q.id=id;rowsById[id]=q;}}});
    var arr=[];
    Object.keys(rowsById).forEach(function(k){
      var q=rowsById[k],prev=statusById[k],mine=myInvite(q),state=mine&&mine.status||q.status;statusById[k]=state;
      if(String(q.inviterUid||'')===String(uid()||'')&&prev&&prev!==state&&state==='active')toast('“'+(q.questTitle||'Party Quest')+'” is geaccepteerd');
      if(relevant(q)&&(q.status==='active'||q.status==='pending'))arr.push(q);
    });
    arr.sort(function(a,b){return Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0);});
    pendingList=arr.filter(function(q){var m=myInvite(q);return m&&m.status==='pending';});
    var liveKeys={};pendingList.forEach(function(q){liveKeys[promptKey(q)]=true;});Object.keys(deferredInviteIds).forEach(function(k){if(!liveKeys[k])delete deferredInviteIds[k];});
    current=arr[0]||null;decorate();
    var promptList=autoPending();if(promptList.length&&!document.getElementById(modalId))incomingQueue(promptList);
  }
  function start(){
    var r=repo();if(!r||typeof r.subscribe!=='function')return false;
    if(repoUnsubscribe)return true;
    repoUnsubscribe=r.subscribe(function(list){snapshot(list);});
    if(typeof r.start==='function')r.start();decorate();return true;
  }
  function getById(id){var key=String(id||''),q=rowsById[key];if(q)return q;var r=repo();return r&&typeof r.getById==='function'?r.getById(key):null;}

  document.addEventListener('click',function(e){
    var cancel=e.target&&e.target.closest&&e.target.closest('#tdp-close-btn,#tdp-cancel-btn');
    if(taskCreateHandoff&&(cancel||(e.target&&e.target.id==='tdp-overlay'))){clearTaskCreateHandoff();}
    var b=e.target&&e.target.closest&&e.target.closest('#tch-party-quest');if(!b)return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();if(pendingList.length)incomingQueue(pendingList);else current?showStatus(current):chooseQuests();
  },true);
  window.addEventListener('familyapp:tasks-updated',function(){setTimeout(function(){completeTaskCreateHandoff();decorate();},0);});
  var tries=0,t=setInterval(function(){tries++;if(start()||tries>120)clearInterval(t);},100);

  window.PartyQuestInvites={version:'7.1',start:start,open:function(){if(pendingList.length)incomingQueue(pendingList);else current?showStatus(current):chooseQuests();},current:function(){return current;},pending:function(){return pendingList.slice();},getById:getById,revokeInvite:revokeInvite,respond:respond,startNew:startNew};
})();