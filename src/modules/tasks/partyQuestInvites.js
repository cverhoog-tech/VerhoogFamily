'use strict';
(function(){
  if(window.__partyQuestInvitesV3)return;
  window.__partyQuestInvitesV3=true;

  var ref=null,current=null,statusById={},modalId='party-quest-invite-modal';
  function db(){try{return window.fbDb||firebase.database();}catch(e){return null;}}
  function user(){try{return window.fbUser||(window.fbAuth&&fbAuth.currentUser)||firebase.auth().currentUser;}catch(e){return null;}}
  function hid(){return window.fbFamilyId||null;}
  function uid(){var u=user();return u&&u.uid||null;}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function toast(m){if(typeof window.showToast==='function')window.showToast(m);}
  function members(){try{return window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members()||[]:[];}catch(e){return[];}}
  function nameOf(m){return String((m&&(m.displayName||m.name))||'Gezinslid');}
  function selfName(){var me=members().find(function(m){return (m.uid||m.id)===uid();});return me?nameOf(me):((user()&&user().displayName)||'Gezinslid');}
  function openTasks(){return (window.taskData||[]).filter(function(t){var s=String(t&&t.status||'').toLowerCase();return t&&t.id&&!t.done&&!t.completed&&s!=='done'&&s!=='completed';});}
  function taskById(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||null;}
  function invitees(q){
    if(q&&q.invitees&&typeof q.invitees==='object')return q.invitees;
    if(q&&q.inviteeUid){var o={};o[q.inviteeUid]={uid:q.inviteeUid,name:q.inviteeName||'Gezinslid',status:q.status==='active'?'active':q.status==='declined'?'declined':'pending'};return o;}
    return {};
  }
  function relevant(q){var me=uid();return q&&(q.inviterUid===me||!!invitees(q)[me]);}
  function myInvite(q){return invitees(q)[uid()]||null;}
  function participantNames(q){var names=[];Object.keys(invitees(q)).forEach(function(k){var x=invitees(q)[k];if(x&&x.status!=='declined')names.push(x.name||'Gezinslid');});return names;}

  function ensureCss(){
    if(document.getElementById('party-quest-invite-css'))return;
    var s=document.createElement('style');s.id='party-quest-invite-css';s.textContent='.pqi-overlay{position:fixed;inset:0;z-index:10080;background:rgba(8,7,15,.66);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;padding:16px}.pqi-card{width:min(440px,100%);max-height:82vh;overflow:auto;border-radius:24px;background:linear-gradient(180deg,#171126,#0f0d18);border:1px solid rgba(216,181,82,.48);box-shadow:0 24px 70px rgba(0,0,0,.5);padding:20px;color:#fff}.pqi-head{display:flex;gap:12px;align-items:center;margin-bottom:14px}.pqi-crest{width:46px;height:50px;display:grid;place-items:center;clip-path:polygon(50% 0,92% 14%,86% 70%,50% 100%,14% 70%,8% 14%);background:linear-gradient(160deg,#cfa94d,#8f6923);font-size:20px}.pqi-head h3{margin:0;font:800 20px/1.1 Georgia,serif}.pqi-head p{margin:4px 0 0;color:#bdb4c8;font-size:12px;line-height:1.4}.pqi-list{display:grid;gap:9px;margin:12px 0}.pqi-row{width:100%;display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,.1);background:#1b1726;color:#fff;border-radius:15px;padding:11px;text-align:left}.pqi-row.is-selected{border-color:#d8b552;background:#2a2038;box-shadow:inset 0 0 0 1px rgba(216,181,82,.22)}.pqi-row b{display:block;font-size:13px}.pqi-row small{display:block;color:#9f96aa;font-size:10px;margin-top:2px}.pqi-avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#6d28d9;border:1.5px solid #d8b552;font-size:10px;font-weight:800;overflow:hidden}.pqi-avatar img{width:100%;height:100%;object-fit:cover}.pqi-qicon{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:#2c2140;color:#e0bf69;border:1px solid rgba(216,181,82,.3);flex:0 0 34px}.pqi-check{margin-left:auto;width:24px;height:24px;border-radius:8px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.18);font-size:12px}.is-selected .pqi-check{background:#d8b552;color:#21160a;border-color:#d8b552}.pqi-actions{display:flex;gap:9px;margin-top:15px}.pqi-btn{flex:1;border:0;border-radius:14px;padding:12px 14px;font-weight:800}.pqi-gold{background:linear-gradient(135deg,#d1ac55,#9e7425);color:#21160a}.pqi-muted{background:#262130;color:#c9c0d1}.pqi-danger{background:#3a1720;color:#ffb3c0}.pqi-note{font-size:11px;line-height:1.45;color:#aaa1b4;background:rgba(255,255,255,.04);border-radius:12px;padding:10px;margin-top:10px}.pqi-focus{font:800 17px/1.25 Georgia,serif;color:#f0d78c;margin:10px 0 4px}';document.head.appendChild(s);
  }
  function avatarHtml(m){var u=m&&(m.avatarUrl||m.photoURL)||'';if(u)return '<span class="pqi-avatar"><img src="'+esc(u)+'" alt=""></span>';var n=nameOf(m),i=n.trim().split(/\s+/).map(function(x){return x[0]||'';}).join('').slice(0,2).toUpperCase();return '<span class="pqi-avatar">'+esc(i||'G')+'</span>';}
  function close(){var x=document.getElementById(modalId);if(x)x.remove();}
  function modal(html){ensureCss();close();var e=document.createElement('div');e.id=modalId;e.className='pqi-overlay';e.innerHTML='<div class="pqi-card">'+html+'</div>';document.body.appendChild(e);e.onclick=function(ev){if(ev.target===e)close();};return e;}

  function chooseInvitees(){
    if(!uid()||!hid()||!db()){toast('Log in om een Party Quest te starten');return;}
    var list=members().filter(function(m){return (m.uid||m.id)&&String(m.uid||m.id)!==String(uid());});
    if(!list.length){toast('Er is nog geen ander gezinslid beschikbaar');return;}
    var selected={};
    var e=modal('<div class="pqi-head"><div class="pqi-crest">⚔</div><div><h3>Start een Party Quest</h3><p>Kies één of meerdere gezinsleden.</p></div></div><div class="pqi-list">'+list.map(function(m){return '<button class="pqi-row" data-person="'+esc(m.uid||m.id)+'">'+avatarHtml(m)+'<span><b>'+esc(nameOf(m))+'</b><small>Gezinslid uitnodigen</small></span><span class="pqi-check">✓</span></button>';}).join('')+'</div><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-close>Annuleren</button><button class="pqi-btn pqi-gold" data-next>Volgende</button></div>');
    e.querySelector('[data-close]').onclick=close;
    e.querySelectorAll('[data-person]').forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-person');selected[id]=!selected[id];b.classList.toggle('is-selected',!!selected[id]);};});
    e.querySelector('[data-next]').onclick=function(){var ids=Object.keys(selected).filter(function(k){return selected[k];});if(!ids.length){toast('Kies minstens één gezinslid');return;}chooseQuests(ids);};
  }

  function chooseQuests(targetUids){
    var tasks=openTasks();if(!tasks.length){toast('Er zijn geen openstaande quests om te delen');return;}
    var selected={};
    var names=targetUids.map(function(id){var m=members().find(function(x){return String(x.uid||x.id)===String(id);});return m?nameOf(m):'Gezinslid';});
    var e=modal('<div class="pqi-head"><div class="pqi-crest">⚔</div><div><h3>Kies quests</h3><p>Selecteer één of meerdere quests voor '+esc(names.join(', '))+'.</p></div></div><div class="pqi-list">'+tasks.map(function(t){var xp=t.xp||t.xpReward||('+'+(t.xpAmount||20)+' XP');return '<button class="pqi-row" data-quest="'+esc(t.id)+'"><span class="pqi-qicon">✦</span><span><b>'+esc(t.title||'Naamloze quest')+'</b><small>'+esc(xp)+(t.date?' · '+esc(t.date):'')+'</small></span><span class="pqi-check">✓</span></button>';}).join('')+'</div><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-back>Terug</button><button class="pqi-btn pqi-gold" data-send>Uitnodigen</button></div>');
    e.querySelector('[data-back]').onclick=chooseInvitees;
    e.querySelectorAll('[data-quest]').forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-quest');selected[id]=!selected[id];b.classList.toggle('is-selected',!!selected[id]);};});
    e.querySelector('[data-send]').onclick=function(){var ids=Object.keys(selected).filter(function(k){return selected[k];});if(!ids.length){toast('Kies minstens één quest');return;}sendInvites(targetUids,ids);};
  }

  function sendInvites(targetUids,questIds){
    var d=db(),family=hid(),me=uid();if(!d||!family||!me)return;
    var base=d.ref('families/'+family+'/partyQuests'),updates={};
    questIds.forEach(function(questId){
      var task=taskById(questId);if(!task)return;
      var id=base.push().key,inv={};
      targetUids.forEach(function(targetUid){var m=members().find(function(x){return String(x.uid||x.id)===String(targetUid);});if(m)inv[targetUid]={uid:String(targetUid),name:nameOf(m),status:'pending'};});
      updates[id]={id:id,title:'Party Quest',questId:String(task.id),questTitle:String(task.title||'Naamloze quest'),status:'pending',inviterUid:me,inviterName:selfName(),invitees:inv,createdAt:firebase.database.ServerValue.TIMESTAMP,updatedAt:firebase.database.ServerValue.TIMESTAMP};
    });
    base.update(updates).then(function(){close();toast(questIds.length+' quest'+(questIds.length===1?'':'s')+' verstuurd naar '+targetUids.length+' gezinslid'+(targetUids.length===1?'':'en'));}).catch(function(x){toast('Uitnodigingen versturen mislukt: '+((x&&x.message)||'onbekende fout'));});
  }

  function incoming(q){
    var mine=myInvite(q);if(!mine||mine.status!=='pending')return;
    var e=modal('<div class="pqi-head"><div class="pqi-crest">⚔</div><div><h3>Party Quest-uitnodiging</h3><p><b>'+esc(q.inviterName||'Een gezinslid')+'</b> nodigt je uit voor:</p></div></div><div class="pqi-focus">'+esc(q.questTitle||'Party Quest')+'</div><div class="pqi-note">Je kunt deze quest accepteren of weigeren. Andere genodigden reageren onafhankelijk.</div><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-no>Weigeren</button><button class="pqi-btn pqi-gold" data-yes>Accepteren</button></div>');
    e.querySelector('[data-no]').onclick=function(){respond(q,'declined');};e.querySelector('[data-yes]').onclick=function(){respond(q,'active');};
  }

  function respond(q,status){
    var d=db(),me=uid(),mine=myInvite(q);if(!d||!mine)return;
    var path='families/'+hid()+'/partyQuests/'+q.id+'/invitees/'+me;
    d.ref(path).update({status:status,respondedAt:firebase.database.ServerValue.TIMESTAMP}).then(function(){return d.ref('families/'+hid()+'/partyQuests/'+q.id).update({status:status==='active'?'active':q.status,updatedAt:firebase.database.ServerValue.TIMESTAMP});}).then(function(){close();toast(status==='active'?'Party Quest “'+(q.questTitle||'Quest')+'” geaccepteerd!':'Party Quest geweigerd');});
  }

  function showStatus(q){
    if(!q){chooseInvitees();return;}
    var mine=myInvite(q);if(mine&&mine.status==='pending'){incoming(q);return;}
    var names=participantNames(q),active=q.status==='active';
    var e=modal('<div class="pqi-head"><div class="pqi-crest">⚔</div><div><h3>'+(active?'Party Quest actief':'Uitnodiging verstuurd')+'</h3><p>'+(names.length?esc(names.join(', ')):'Nog geen deelnemers')+'</p></div></div><div class="pqi-focus">'+esc(q.questTitle||'Party Quest')+'</div><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-close>Sluiten</button>'+(q.inviterUid===uid()?'<button class="pqi-btn pqi-danger" data-end>'+(active?'Beëindigen':'Intrekken')+'</button>':'')+'</div>');
    e.querySelector('[data-close]').onclick=close;var endBtn=e.querySelector('[data-end]');if(endBtn)endBtn.onclick=function(){end(q,active?'completed':'cancelled');};
  }
  function end(q,status){db().ref('families/'+hid()+'/partyQuests/'+q.id).update({status:status,updatedAt:firebase.database.ServerValue.TIMESTAMP,endedAt:firebase.database.ServerValue.TIMESTAMP}).then(function(){close();toast(status==='completed'?'Party Quest beëindigd':'Uitnodiging ingetrokken');});}

  function decorate(){var b=document.getElementById('tch-party-quest');if(!b)return;var h=b.querySelector('b'),s=b.querySelector('small');if(!current){if(h)h.textContent='Party Quest starten';if(s)s.textContent='Nodig meerdere gezinsleden uit voor één of meer quests';return;}var mine=myInvite(current);if(mine&&mine.status==='pending'){if(h)h.textContent='Party Quest-uitnodiging';if(s)s.textContent=(current.questTitle||'Party Quest')+' · van '+(current.inviterName||'Gezinslid');return;}if(current.status==='pending'){if(h)h.textContent='Uitnodigingen verstuurd';if(s)s.textContent=(current.questTitle||'Party Quest')+' · '+participantNames(current).join(', ');}else if(current.status==='active'){if(h)h.textContent='Party Quest actief';if(s)s.textContent=(current.questTitle||'Party Quest')+' · '+participantNames(current).join(', ');}}

  function snapshot(rows){
    var arr=[];
    Object.keys(rows||{}).forEach(function(k){
      var q=rows[k];if(!q)return;if(!q.id)q.id=k;
      var prev=statusById[k],mine=myInvite(q),state=(mine&&mine.status)||q.status;statusById[k]=state;
      if(q.inviterUid===uid()&&prev&&prev!==state&&state==='active')toast('“'+(q.questTitle||'Party Quest')+'” is geaccepteerd');
      if(relevant(q)&&(q.status==='active'||q.status==='pending'))arr.push(q);
    });
    arr.sort(function(a,b){return Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0);});
    current=arr[0]||null;decorate();
    var pending=arr.find(function(q){var m=myInvite(q);return m&&m.status==='pending';});
    if(pending&&!document.getElementById(modalId))incoming(pending);
  }
  function start(){var d=db();if(!d||!hid()||!uid())return false;if(ref)try{ref.off();}catch(e){}ref=d.ref('families/'+hid()+'/partyQuests');ref.on('value',function(s){snapshot(s.val()||{});});decorate();return true;}
  document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('#tch-party-quest');if(!b)return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();current?showStatus(current):chooseInvitees();},true);
  window.addEventListener('familyapp:tasks-updated',function(){setTimeout(decorate,0);});window.addEventListener('familyapp:household-members-updated',function(){setTimeout(start,0);});
  var tries=0,t=setInterval(function(){tries++;if(start()||tries>80)clearInterval(t);},250);
  window.PartyQuestInvites={start:start,open:function(){current?showStatus(current):chooseInvitees();},current:function(){return current;}};
})();
