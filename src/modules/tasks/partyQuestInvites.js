'use strict';
(function(){
  if(window.__partyQuestInvitesV5)return;
  window.__partyQuestInvitesV5=true;

  var ref=null,current=null,pendingList=[],statusById={},rowsById={},modalId='party-quest-invite-modal';
  function db(){try{return window.fbDb||firebase.database();}catch(e){return null;}}
  function user(){try{return window.fbUser||(window.fbAuth&&fbAuth.currentUser)||firebase.auth().currentUser;}catch(e){return null;}}
  function hid(){return window.fbFamilyId||null;}
  function uid(){var u=user();return u&&u.uid||null;}
  function now(){return Date.now();}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function toast(m){if(typeof window.showToast==='function')window.showToast(m);}
  function members(){try{return window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members()||[]:[];}catch(e){return[];}}
  function memberId(m){return m&&(m.uid||m.id)||null;}
  function nameOf(m){return String((m&&(m.displayName||m.name))||'Gezinslid');}
  function selfName(){var me=members().find(function(m){return String(memberId(m))===String(uid());});return me?nameOf(me):((user()&&user().displayName)||'Gezinslid');}
  function openTasks(){return (window.taskData||[]).filter(function(t){var s=String(t&&t.status||'').toLowerCase();return t&&t.id&&!t.done&&!t.completed&&s!=='done'&&s!=='completed';});}
  function taskById(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||null;}
  function invitees(q){if(q&&q.invitees&&typeof q.invitees==='object')return q.invitees;return {};}
  function relevant(q){var me=uid();return q&&(String(q.inviterUid)===String(me)||!!invitees(q)[me]);}
  function myInvite(q){return invitees(q)[uid()]||null;}
  function participantNames(q){var names=[];if(q&&q.inviterUid)names.push(q.inviterName||'Maker');Object.keys(invitees(q)).forEach(function(k){var x=invitees(q)[k];if(x&&x.status==='active')names.push(x.name||'Gezinslid');});return Array.from(new Set(names));}
  function isLive(q){return q&&q.status!=='cancelled'&&q.status!=='completed';}

  function activeParticipantUids(taskId,sourceRows){
    var blocked={};
    var task=taskById(taskId);
    if(task){
      if(task.assignedToUids&&typeof task.assignedToUids==='object')Object.keys(task.assignedToUids).forEach(function(id){if(task.assignedToUids[id])blocked[String(id)]=true;});
      if(task.assignedToUid)blocked[String(task.assignedToUid)]=true;
      var ownerUid=task.createdByUid||task.ownerUid||null;
      if(ownerUid)blocked[String(ownerUid)]=true;
    }
    Object.keys(sourceRows||{}).forEach(function(k){
      var q=sourceRows[k];if(!isLive(q)||String(q.questId||'')!==String(taskId))return;
      if(q.inviterUid)blocked[String(q.inviterUid)]=true;
      Object.keys(invitees(q)).forEach(function(id){var x=invitees(q)[id];if(x&&x.status==='active')blocked[String(id)]=true;});
    });
    return blocked;
  }

  function ensureCss(){
    if(document.getElementById('party-quest-invite-css'))return;
    var s=document.createElement('style');s.id='party-quest-invite-css';s.textContent='.pqi-overlay{position:fixed;inset:0;z-index:10080;background:rgba(8,7,15,.66);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;padding:16px}.pqi-card{width:min(440px,100%);max-height:82vh;overflow:auto;border-radius:24px;background:linear-gradient(180deg,#171126,#0f0d18);border:1px solid rgba(216,181,82,.48);box-shadow:0 24px 70px rgba(0,0,0,.5);padding:20px;color:#fff}.pqi-head{display:flex;gap:12px;align-items:center;margin-bottom:14px}.pqi-crest{width:46px;height:50px;display:grid;place-items:center;clip-path:polygon(50% 0,92% 14%,86% 70%,50% 100%,14% 70%,8% 14%);background:linear-gradient(160deg,#cfa94d,#8f6923);font-size:20px}.pqi-head h3{margin:0;font:800 20px/1.1 Georgia,serif}.pqi-head p{margin:4px 0 0;color:#bdb4c8;font-size:12px;line-height:1.4}.pqi-list{display:grid;gap:9px;margin:12px 0}.pqi-row{width:100%;display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,.1);background:#1b1726;color:#fff;border-radius:15px;padding:11px;text-align:left}.pqi-row.is-selected{border-color:#d8b552;background:#2a2038;box-shadow:inset 0 0 0 1px rgba(216,181,82,.22)}.pqi-row b{display:block;font-size:13px}.pqi-row small{display:block;color:#9f96aa;font-size:10px;margin-top:2px}.pqi-avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#6d28d9;border:1.5px solid #d8b552;font-size:10px;font-weight:800;overflow:hidden}.pqi-avatar img{width:100%;height:100%;object-fit:cover}.pqi-qicon{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:#2c2140;color:#e0bf69;border:1px solid rgba(216,181,82,.3);flex:0 0 34px}.pqi-check{margin-left:auto;width:24px;height:24px;border-radius:8px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.18);font-size:12px}.is-selected .pqi-check{background:#d8b552;color:#21160a;border-color:#d8b552}.pqi-actions{display:flex;gap:9px;margin-top:15px}.pqi-btn{flex:1;border:0;border-radius:14px;padding:12px 14px;font-weight:800}.pqi-gold{background:linear-gradient(135deg,#d1ac55,#9e7425);color:#21160a}.pqi-muted{background:#262130;color:#c9c0d1}.pqi-danger{background:#3a1720;color:#ffb3c0}.pqi-note{font-size:11px;line-height:1.45;color:#aaa1b4;background:rgba(255,255,255,.04);border-radius:12px;padding:10px;margin-top:10px}.pqi-focus{font:800 17px/1.25 Georgia,serif;color:#f0d78c;margin:10px 0 4px}';document.head.appendChild(s);
  }
  function avatarHtml(m){var u=m&&(m.avatar||m.avatarUrl||m.photoURL)||'';if(u)return '<span class="pqi-avatar"><img src="'+esc(u)+'" alt=""></span>';var n=nameOf(m),i=n.trim().split(/\s+/).map(function(x){return x[0]||'';}).join('').slice(0,2).toUpperCase();return '<span class="pqi-avatar">'+esc(i||'G')+'</span>';}
  function close(){var x=document.getElementById(modalId);if(x)x.remove();}
  function modal(html){ensureCss();close();var e=document.createElement('div');e.id=modalId;e.className='pqi-overlay';e.innerHTML='<div class="pqi-card">'+html+'</div>';document.body.appendChild(e);e.onclick=function(ev){if(ev.target===e)close();};return e;}

  function chooseQuests(){
    if(!uid()||!hid()||!db()){toast('Log in om een Party Quest te starten');return;}
    var tasks=openTasks();if(!tasks.length){toast('Er zijn geen openstaande quests om te delen');return;}
    var selected={};
    var e=modal('<div class="pqi-head"><div class="pqi-crest">⚔</div><div><h3>Start een Party Quest</h3><p>Kies eerst de quest. Daarna zie je alleen gezinsleden die nog niet actief deelnemen.</p></div></div><div class="pqi-list">'+tasks.map(function(t){var xp=t.xp||t.xpReward||('+'+(t.xpAmount||20)+' XP');return '<button class="pqi-row" data-quest="'+esc(t.id)+'"><span class="pqi-qicon">✦</span><span><b>'+esc(t.title||'Naamloze quest')+'</b><small>'+esc(xp)+(t.date?' · '+esc(t.date):'')+'</small></span><span class="pqi-check">✓</span></button>';}).join('')+'</div><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-close>Annuleren</button><button class="pqi-btn pqi-gold" data-next>Deelnemers kiezen</button></div>');
    e.querySelector('[data-close]').onclick=close;
    e.querySelectorAll('[data-quest]').forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-quest');selected[id]=!selected[id];b.classList.toggle('is-selected',!!selected[id]);};});
    e.querySelector('[data-next]').onclick=function(){var ids=Object.keys(selected).filter(function(k){return selected[k];});if(!ids.length){toast('Kies minstens één quest');return;}chooseInvitees(ids);};
  }

  function chooseInvitees(questIds){
    var blocked={};
    questIds.forEach(function(taskId){var b=activeParticipantUids(taskId,rowsById);Object.keys(b).forEach(function(id){blocked[id]=true;});});
    blocked[String(uid())]=true;
    var list=members().filter(function(m){var id=memberId(m);return id&&!blocked[String(id)];});
    if(!list.length){toast('Alle gezinsleden nemen al deel aan deze quest');chooseQuests();return;}
    var selected={};
    var e=modal('<div class="pqi-head"><div class="pqi-crest">⚔</div><div><h3>Deelnemers kiezen</h3><p>Actieve deelnemers en de actieve taakeigenaar zijn al uitgefilterd.</p></div></div><div class="pqi-list">'+list.map(function(m){return '<button class="pqi-row" data-person="'+esc(memberId(m))+'">'+avatarHtml(m)+'<span><b>'+esc(nameOf(m))+'</b><small>Gezinslid uitnodigen</small></span><span class="pqi-check">✓</span></button>';}).join('')+'</div><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-back>Terug</button><button class="pqi-btn pqi-gold" data-send>Uitnodigen</button></div>');
    e.querySelector('[data-back]').onclick=chooseQuests;
    e.querySelectorAll('[data-person]').forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-person');selected[id]=!selected[id];b.classList.toggle('is-selected',!!selected[id]);};});
    e.querySelector('[data-send]').onclick=function(){var ids=Object.keys(selected).filter(function(k){return selected[k];});if(!ids.length){toast('Kies minstens één gezinslid');return;}sendInvites(ids,questIds);};
  }

  function sendInvites(targetUids,questIds){
    var d=db(),family=hid(),me=uid();if(!d||!family||!me)return;
    var base=d.ref('families/'+family+'/partyQuests');
    base.once('value').then(function(snap){
      var latest=snap.val()||{},updates={},created=0,totalTargets=0;
      questIds.forEach(function(questId){
        var task=taskById(questId);if(!task)return;
        var blocked=activeParticipantUids(questId,latest),inv={};
        targetUids.forEach(function(targetUid){
          if(blocked[String(targetUid)]||String(targetUid)===String(me))return;
          var m=members().find(function(x){return String(memberId(x))===String(targetUid);});
          if(m){inv[targetUid]={uid:String(targetUid),name:nameOf(m),status:'pending'};totalTargets++;}
        });
        if(!Object.keys(inv).length)return;
        var id=base.push().key;
        updates[id]={id:id,title:'Party Quest',questId:String(task.id),questTitle:String(task.title||'Naamloze quest'),status:'pending',inviterUid:me,inviterName:selfName(),invitees:inv,createdAt:firebase.database.ServerValue.TIMESTAMP,updatedAt:firebase.database.ServerValue.TIMESTAMP};created++;
      });
      if(!created){toast('De gekozen deelnemers nemen inmiddels al deel');return false;}
      return base.update(updates).then(function(){close();toast(created+' quest'+(created===1?'':'s')+' verstuurd naar '+totalTargets+' deelnemer'+(totalTargets===1?'':'s'));return true;});
    }).catch(function(x){toast('Uitnodigingen versturen mislukt: '+((x&&x.message)||'onbekende fout'));});
  }

  function respond(q,status){
    var d=db(),me=uid();if(!d||!me||!q)return Promise.resolve(false);
    var qref=d.ref('families/'+hid()+'/partyQuests/'+q.id);
    return qref.transaction(function(cur){
      if(!cur||cur.status==='cancelled'||cur.status==='completed'||!cur.invitees||!cur.invitees[me]||cur.invitees[me].status!=='pending')return;
      cur.invitees[me].status=status;
      cur.invitees[me].respondedAt=now();
      cur.updatedAt=now();
      if(status==='active')cur.status='active';
      return cur;
    }).then(function(result){
      if(!result.committed){close();toast('Deze uitnodiging is niet meer actief');return false;}
      close();toast(status==='active'?'Party Quest “'+(q.questTitle||'Quest')+'” geaccepteerd!':'Party Quest geweigerd');return true;
    });
  }

  function revokeInvite(questId,targetUid){
    var d=db(),me=uid();if(!d||!me||!questId||!targetUid)return Promise.reject(new Error('Uitnodiging ontbreekt'));
    var qref=d.ref('families/'+hid()+'/partyQuests/'+questId);
    return qref.transaction(function(cur){
      if(!cur||String(cur.inviterUid)!==String(me)||!cur.invitees||!cur.invitees[targetUid]||cur.invitees[targetUid].status!=='pending')return;
      cur.invitees[targetUid].status='revoked';
      cur.invitees[targetUid].revokedAt=now();
      cur.updatedAt=now();
      var values=Object.keys(cur.invitees).map(function(id){return cur.invitees[id];});
      var hasActive=values.some(function(x){return x&&x.status==='active';});
      var hasPending=values.some(function(x){return x&&x.status==='pending';});
      if(hasActive)cur.status='active';else if(hasPending)cur.status='pending';else cur.status='cancelled';
      return cur;
    }).then(function(result){if(!result.committed)throw new Error('Deze uitnodiging kan niet meer worden ingetrokken');toast('Uitnodiging ingetrokken');return true;});
  }

  function incoming(q){
    var mine=myInvite(q);if(!mine||mine.status!=='pending')return;
    var e=modal('<div class="pqi-head"><div class="pqi-crest">⚔</div><div><h3>Party Quest-uitnodiging</h3><p><b>'+esc(q.inviterName||'Een gezinslid')+'</b> nodigt je uit voor:</p></div></div><div class="pqi-focus">'+esc(q.questTitle||'Party Quest')+'</div><div class="pqi-note">Je kunt deze quest accepteren of weigeren. Een ingetrokken uitnodiging kan niet alsnog geaccepteerd worden.</div><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-no>Weigeren</button><button class="pqi-btn pqi-gold" data-yes>Accepteren</button></div>');
    e.querySelector('[data-no]').onclick=function(){respond(q,'declined');};e.querySelector('[data-yes]').onclick=function(){respond(q,'active');};
  }
  function incomingQueue(list){
    if(!list.length)return;if(list.length===1){incoming(list[0]);return;}
    var e=modal('<div class="pqi-head"><div class="pqi-crest">⚔</div><div><h3>'+list.length+' Party Quest-uitnodigingen</h3><p>Accepteer of weiger elke quest afzonderlijk.</p></div></div><div class="pqi-list">'+list.map(function(q){return '<div class="pqi-row" style="flex-wrap:wrap"><span class="pqi-qicon">✦</span><span style="flex:1;min-width:0"><b>'+esc(q.questTitle||'Party Quest')+'</b><small>Van '+esc(q.inviterName||'Gezinslid')+'</small></span><div class="pqi-actions" style="width:100%;margin-top:4px"><button class="pqi-btn pqi-muted" data-no="'+esc(q.id)+'">Weigeren</button><button class="pqi-btn pqi-gold" data-yes="'+esc(q.id)+'">Accepteren</button></div></div>';}).join('')+'</div><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-close>Later</button></div>');
    e.querySelector('[data-close]').onclick=close;
    e.querySelectorAll('[data-no]').forEach(function(b){b.onclick=function(){var q=list.find(function(x){return String(x.id)===String(b.getAttribute('data-no'));});if(q)respond(q,'declined');};});
    e.querySelectorAll('[data-yes]').forEach(function(b){b.onclick=function(){var q=list.find(function(x){return String(x.id)===String(b.getAttribute('data-yes'));});if(q)respond(q,'active');};});
  }

  function showStatus(q){
    if(pendingList.length){incomingQueue(pendingList);return;}if(!q){chooseQuests();return;}
    var mine=myInvite(q);if(mine&&mine.status==='pending'){incoming(q);return;}
    var names=participantNames(q),active=q.status==='active';
    var e=modal('<div class="pqi-head"><div class="pqi-crest">⚔</div><div><h3>'+(active?'Party Quest actief':'Uitnodiging verstuurd')+'</h3><p>'+(names.length?esc(names.join(', ')):'Nog geen deelnemers')+'</p></div></div><div class="pqi-focus">'+esc(q.questTitle||'Party Quest')+'</div><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-close>Sluiten</button>'+(q.inviterUid===uid()?'<button class="pqi-btn pqi-danger" data-end>'+(active?'Beëindigen':'Alles intrekken')+'</button>':'')+'</div>');
    e.querySelector('[data-close]').onclick=close;var endBtn=e.querySelector('[data-end]');if(endBtn)endBtn.onclick=function(){end(q,active?'completed':'cancelled');};
  }
  function end(q,status){return db().ref('families/'+hid()+'/partyQuests/'+q.id).update({status:status,updatedAt:firebase.database.ServerValue.TIMESTAMP,endedAt:firebase.database.ServerValue.TIMESTAMP}).then(function(){close();toast(status==='completed'?'Party Quest beëindigd':'Uitnodigingen ingetrokken');});}

  function decorate(){
    var b=document.getElementById('tch-party-quest');if(!b)return;var h=b.querySelector('b'),s=b.querySelector('small');
    if(pendingList.length){if(h)h.textContent=pendingList.length===1?'Party Quest-uitnodiging':pendingList.length+' Party Quest-uitnodigingen';if(s)s.textContent=pendingList.length===1?(pendingList[0].questTitle||'Party Quest')+' · van '+(pendingList[0].inviterName||'Gezinslid'):'Tik om alle uitnodigingen te bekijken';return;}
    if(!current){if(h)h.textContent='Party Quest starten';if(s)s.textContent='Nodig beschikbare gezinsleden uit voor een quest';return;}
    if(current.status==='pending'){if(h)h.textContent='Uitnodigingen verstuurd';if(s)s.textContent=current.questTitle||'Party Quest';}else if(current.status==='active'){if(h)h.textContent='Party Quest actief';if(s)s.textContent=(current.questTitle||'Party Quest')+' · '+participantNames(current).join(', ');}
  }

  function snapshot(rows){
    rowsById=rows||{};var arr=[];
    Object.keys(rowsById).forEach(function(k){
      var q=rowsById[k];if(!q)return;if(!q.id)q.id=k;
      var prev=statusById[k],mine=myInvite(q),state=(mine&&mine.status)||q.status;statusById[k]=state;
      if(q.inviterUid===uid()&&prev&&prev!==state&&state==='active')toast('“'+(q.questTitle||'Party Quest')+'” is geaccepteerd');
      if(relevant(q)&&(q.status==='active'||q.status==='pending'))arr.push(q);
    });
    arr.sort(function(a,b){return Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0);});
    pendingList=arr.filter(function(q){var m=myInvite(q);return m&&m.status==='pending';});
    current=arr[0]||null;decorate();
    if(pendingList.length&&!document.getElementById(modalId))incomingQueue(pendingList);
  }
  function start(){var d=db();if(!d||!hid()||!uid())return false;if(ref)try{ref.off();}catch(e){}ref=d.ref('families/'+hid()+'/partyQuests');ref.on('value',function(s){snapshot(s.val()||{});});decorate();return true;}
  function getById(id){var q=rowsById&&rowsById[id];if(q&&!q.id)q.id=id;return q||null;}

  document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('#tch-party-quest');if(!b)return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();if(pendingList.length)incomingQueue(pendingList);else current?showStatus(current):chooseQuests();},true);
  window.addEventListener('familyapp:tasks-updated',function(){setTimeout(decorate,0);});window.addEventListener('familyapp:household-members-updated',function(){setTimeout(start,0);});
  var tries=0,t=setInterval(function(){tries++;if(start()||tries>80)clearInterval(t);},250);
  window.PartyQuestInvites={version:'5.1',start:start,open:function(){if(pendingList.length)incomingQueue(pendingList);else current?showStatus(current):chooseQuests();},current:function(){return current;},pending:function(){return pendingList.slice();},getById:getById,revokeInvite:revokeInvite,respond:respond};
})();