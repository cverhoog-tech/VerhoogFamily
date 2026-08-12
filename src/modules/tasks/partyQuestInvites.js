'use strict';
(function(){
  if(window.__partyQuestInvitesV2)return;
  window.__partyQuestInvitesV2=true;

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
  function relevant(q){var me=uid();return q&&(q.inviterUid===me||q.inviteeUid===me);}
  function otherName(q){return q.inviterUid===uid()?q.inviteeName:q.inviterName;}

  function ensureCss(){
    if(document.getElementById('party-quest-invite-css'))return;
    var s=document.createElement('style');s.id='party-quest-invite-css';s.textContent='.pqi-overlay{position:fixed;inset:0;z-index:10080;background:rgba(8,7,15,.66);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;padding:16px}.pqi-card{width:min(440px,100%);max-height:82vh;overflow:auto;border-radius:24px;background:linear-gradient(180deg,#171126,#0f0d18);border:1px solid rgba(216,181,82,.48);box-shadow:0 24px 70px rgba(0,0,0,.5);padding:20px;color:#fff}.pqi-head{display:flex;gap:12px;align-items:center;margin-bottom:14px}.pqi-crest{width:46px;height:50px;display:grid;place-items:center;clip-path:polygon(50% 0,92% 14%,86% 70%,50% 100%,14% 70%,8% 14%);background:linear-gradient(160deg,#cfa94d,#8f6923);font-size:20px}.pqi-head h3{margin:0;font:800 20px/1.1 Georgia,serif}.pqi-head p{margin:4px 0 0;color:#bdb4c8;font-size:12px;line-height:1.4}.pqi-list{display:grid;gap:9px;margin:12px 0}.pqi-row{width:100%;display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,.1);background:#1b1726;color:#fff;border-radius:15px;padding:11px;text-align:left}.pqi-row b{display:block;font-size:13px}.pqi-row small{display:block;color:#9f96aa;font-size:10px;margin-top:2px}.pqi-avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#6d28d9;border:1.5px solid #d8b552;font-size:10px;font-weight:800;overflow:hidden}.pqi-avatar img{width:100%;height:100%;object-fit:cover}.pqi-qicon{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:#2c2140;color:#e0bf69;border:1px solid rgba(216,181,82,.3);flex:0 0 34px}.pqi-actions{display:flex;gap:9px;margin-top:15px}.pqi-btn{flex:1;border:0;border-radius:14px;padding:12px 14px;font-weight:800}.pqi-gold{background:linear-gradient(135deg,#d1ac55,#9e7425);color:#21160a}.pqi-muted{background:#262130;color:#c9c0d1}.pqi-danger{background:#3a1720;color:#ffb3c0}.pqi-note{font-size:11px;line-height:1.45;color:#aaa1b4;background:rgba(255,255,255,.04);border-radius:12px;padding:10px;margin-top:10px}.pqi-focus{font:800 17px/1.25 Georgia,serif;color:#f0d78c;margin:10px 0 4px}';document.head.appendChild(s);
  }
  function avatarHtml(m){var u=m&&(m.avatarUrl||m.photoURL)||'';if(u)return '<span class="pqi-avatar"><img src="'+esc(u)+'" alt=""></span>';var n=nameOf(m),i=n.trim().split(/\s+/).map(function(x){return x[0]||'';}).join('').slice(0,2).toUpperCase();return '<span class="pqi-avatar">'+esc(i||'G')+'</span>';}
  function close(){var x=document.getElementById(modalId);if(x)x.remove();}
  function modal(html){ensureCss();close();var e=document.createElement('div');e.id=modalId;e.className='pqi-overlay';e.innerHTML='<div class="pqi-card">'+html+'</div>';document.body.appendChild(e);e.onclick=function(ev){if(ev.target===e)close();};return e;}

  function chooseInvitee(){
    if(!uid()||!hid()||!db()){toast('Log in om een Party Quest te starten');return;}
    var list=members().filter(function(m){return (m.uid||m.id)&&String(m.uid||m.id)!==String(uid());});
    if(!list.length){toast('Er is nog geen ander gezinslid beschikbaar');return;}
    var e=modal('<div class="pqi-head"><div class="pqi-crest">⚔</div><div><h3>Start een Party Quest</h3><p>Kies met wie je samen op quest wilt.</p></div></div><div class="pqi-list">'+list.map(function(m){return '<button class="pqi-row" data-person="'+esc(m.uid||m.id)+'">'+avatarHtml(m)+'<span><b>'+esc(nameOf(m))+'</b><small>Kies gezinslid</small></span></button>';}).join('')+'</div><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-close>Annuleren</button></div>');
    e.querySelector('[data-close]').onclick=close;e.querySelectorAll('[data-person]').forEach(function(b){b.onclick=function(){chooseQuest(b.getAttribute('data-person'));};});
  }
  function chooseQuest(targetUid){
    var target=members().find(function(m){return String(m.uid||m.id)===String(targetUid);}),tasks=openTasks();
    if(!target){toast('Gezinslid niet gevonden');return;}if(!tasks.length){toast('Er zijn geen openstaande quests om te delen');return;}
    var e=modal('<div class="pqi-head"><div class="pqi-crest">⚔</div><div><h3>Kies de quest</h3><p>Welke taak wil je samen met <b>'+esc(nameOf(target))+'</b> uitvoeren?</p></div></div><div class="pqi-list">'+tasks.map(function(t){var xp=t.xp||t.xpReward||('+'+(t.xpAmount||20)+' XP');return '<button class="pqi-row" data-quest="'+esc(t.id)+'"><span class="pqi-qicon">✦</span><span><b>'+esc(t.title||'Naamloze quest')+'</b><small>'+esc(xp)+(t.date?' · '+esc(t.date):'')+'</small></span></button>';}).join('')+'</div><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-back>Terug</button><button class="pqi-btn pqi-muted" data-close>Annuleren</button></div>');
    e.querySelector('[data-back]').onclick=chooseInvitee;e.querySelector('[data-close]').onclick=close;e.querySelectorAll('[data-quest]').forEach(function(b){b.onclick=function(){sendInvite(targetUid,b.getAttribute('data-quest'));};});
  }
  function sendInvite(targetUid,questId){
    var d=db(),family=hid(),me=uid(),target=members().find(function(m){return String(m.uid||m.id)===String(targetUid);}),task=taskById(questId);if(!d||!family||!me||!target||!task){toast('Kon deze Party Quest niet voorbereiden');return;}
    var id=d.ref('families/'+family+'/partyQuests').push().key,q={id:id,title:'Party Quest',questId:String(task.id),questTitle:String(task.title||'Naamloze quest'),status:'pending',inviterUid:me,inviterName:selfName(),inviteeUid:String(targetUid),inviteeName:nameOf(target),createdAt:firebase.database.ServerValue.TIMESTAMP,updatedAt:firebase.database.ServerValue.TIMESTAMP};
    d.ref('families/'+family+'/partyQuests/'+id).set(q).then(function(){close();toast('Uitnodiging voor “'+q.questTitle+'” verstuurd naar '+nameOf(target));}).catch(function(x){toast('Uitnodiging versturen mislukt: '+((x&&x.message)||'onbekende fout'));});
  }
  function incoming(q){
    var e=modal('<div class="pqi-head"><div class="pqi-crest">⚔</div><div><h3>Party Quest-uitnodiging</h3><p><b>'+esc(q.inviterName||'Een gezinslid')+'</b> wil deze quest samen met jou doen:</p></div></div><div class="pqi-focus">'+esc(q.questTitle||'Party Quest')+'</div><div class="pqi-note">Accepteer om deze quest voor jullie beiden als actieve Party Quest te markeren.</div><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-no>Weigeren</button><button class="pqi-btn pqi-gold" data-yes>Accepteren</button></div>');
    e.querySelector('[data-no]').onclick=function(){respond(q,'declined');};e.querySelector('[data-yes]').onclick=function(){respond(q,'active');};
  }
  function respond(q,status){var d=db();if(!d||q.inviteeUid!==uid())return;d.ref('families/'+hid()+'/partyQuests/'+q.id).update({status:status,respondedAt:firebase.database.ServerValue.TIMESTAMP,updatedAt:firebase.database.ServerValue.TIMESTAMP,acceptedBy:status==='active'?uid():null}).then(function(){close();toast(status==='active'?'Party Quest “'+(q.questTitle||'Quest')+'” geaccepteerd!':'Party Quest geweigerd');});}
  function showStatus(q){if(!q){chooseInvitee();return;}if(q.status==='pending'&&q.inviteeUid===uid()){incoming(q);return;}var active=q.status==='active',e=modal('<div class="pqi-head"><div class="pqi-crest">⚔</div><div><h3>'+(active?'Party Quest actief':'Uitnodiging verstuurd')+'</h3><p>'+(active?'Samen met '+esc(otherName(q))+'.':'Wachten op '+esc(otherName(q))+'.')+'</p></div></div><div class="pqi-focus">'+esc(q.questTitle||'Party Quest')+'</div><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-close>Sluiten</button><button class="pqi-btn pqi-danger" data-end>'+(active?'Beëindigen':'Intrekken')+'</button></div>');e.querySelector('[data-close]').onclick=close;e.querySelector('[data-end]').onclick=function(){end(q,active?'completed':'cancelled');};}
  function end(q,status){db().ref('families/'+hid()+'/partyQuests/'+q.id).update({status:status,updatedAt:firebase.database.ServerValue.TIMESTAMP,endedAt:firebase.database.ServerValue.TIMESTAMP}).then(function(){close();toast(status==='completed'?'Party Quest beëindigd':'Uitnodiging ingetrokken');});}
  function decorate(){var b=document.getElementById('tch-party-quest');if(!b)return;var h=b.querySelector('b'),s=b.querySelector('small');if(!current){if(h)h.textContent='Party Quest starten';if(s)s.textContent='Kies een quest en nodig een gezinslid uit';return;}if(current.status==='pending'){if(h)h.textContent=current.inviteeUid===uid()?'Party Quest-uitnodiging':'Uitnodiging verstuurd';if(s)s.textContent=(current.questTitle||'Party Quest')+' · '+(current.inviteeUid===uid()?('van '+current.inviterName):('wacht op '+otherName(current)));}else if(current.status==='active'){if(h)h.textContent='Party Quest actief';if(s)s.textContent=(current.questTitle||'Party Quest')+' · met '+otherName(current);}}
  function snapshot(rows){var arr=[];Object.keys(rows||{}).forEach(function(k){var q=rows[k];if(!q)return;if(!q.id)q.id=k;var prev=statusById[k];statusById[k]=q.status;if(q.inviterUid===uid()&&prev==='pending'&&q.status==='active')toast((q.inviteeName||'Gezinslid')+' heeft “'+(q.questTitle||'je Party Quest')+'” geaccepteerd!');if(q.inviterUid===uid()&&prev==='pending'&&q.status==='declined')toast((q.inviteeName||'Gezinslid')+' heeft de Party Quest geweigerd');if(relevant(q)&&(q.status==='active'||q.status==='pending'))arr.push(q);});arr.sort(function(a,b){return Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0);});current=arr[0]||null;decorate();if(current&&current.status==='pending'&&current.inviteeUid===uid()&&!document.getElementById(modalId))incoming(current);}
  function start(){var d=db();if(!d||!hid()||!uid())return false;if(ref)try{ref.off();}catch(e){}ref=d.ref('families/'+hid()+'/partyQuests');ref.on('value',function(s){snapshot(s.val()||{});});decorate();return true;}
  document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('#tch-party-quest');if(!b)return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();current?showStatus(current):chooseInvitee();},true);
  window.addEventListener('familyapp:tasks-updated',function(){setTimeout(decorate,0);});window.addEventListener('familyapp:household-members-updated',function(){setTimeout(start,0);});
  var tries=0,t=setInterval(function(){tries++;if(start()||tries>80)clearInterval(t);},250);
  window.PartyQuestInvites={start:start,open:function(){current?showStatus(current):chooseInvitee();},current:function(){return current;}};
})();
