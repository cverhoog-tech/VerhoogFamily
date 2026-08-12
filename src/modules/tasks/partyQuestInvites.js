'use strict';
// ============================================================
// PARTY QUEST INVITES v1
// Realtime household invitation/acceptance flow for Compact Party Quest.
// Stores invitations under families/{householdId}/partyQuests/{id}.
// Does not modify taskData or TaskSharedData records.
// ============================================================
(function(){
  if(window.__partyQuestInvitesV1)return;
  window.__partyQuestInvitesV1=true;

  var ref=null;
  var current=null;
  var statusById={};
  var modalId='party-quest-invite-modal';

  function db(){try{return window.fbDb||firebase.database();}catch(e){return null;}}
  function user(){try{return window.fbUser||(window.fbAuth&&fbAuth.currentUser)||firebase.auth().currentUser;}catch(e){return null;}}
  function hid(){return window.fbFamilyId||null;}
  function uid(){var u=user();return u&&u.uid||null;}
  function nameOf(m){return String((m&&(m.displayName||m.name))||'Gezinslid');}
  function members(){try{return window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members()||[]:[];}catch(e){return[];}}
  function selfName(){var me=members().find(function(m){return (m.uid||m.id)===uid();});return nameOf(me)||(user()&&user().displayName)||'Gezinslid';}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function toast(msg){if(typeof window.showToast==='function')window.showToast(msg);}

  function ensureCss(){
    if(document.getElementById('party-quest-invite-css'))return;
    var s=document.createElement('style');
    s.id='party-quest-invite-css';
    s.textContent='\
.pqi-overlay{position:fixed;inset:0;z-index:10080;background:rgba(8,7,15,.66);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;padding:16px}\
.pqi-card{width:min(440px,100%);max-height:82vh;overflow:auto;border-radius:24px;background:linear-gradient(180deg,#171126,#0f0d18);border:1px solid rgba(216,181,82,.48);box-shadow:0 24px 70px rgba(0,0,0,.5);padding:20px;color:#fff}\
.pqi-head{display:flex;gap:12px;align-items:center;margin-bottom:14px}.pqi-crest{width:46px;height:50px;display:grid;place-items:center;clip-path:polygon(50% 0,92% 14%,86% 70%,50% 100%,14% 70%,8% 14%);background:linear-gradient(160deg,#cfa94d,#8f6923);color:#fff;font-size:20px}.pqi-head h3{margin:0;font:800 20px/1.1 Georgia,serif}.pqi-head p{margin:4px 0 0;color:#bdb4c8;font-size:12px;line-height:1.4}.pqi-list{display:grid;gap:9px;margin:12px 0}.pqi-member{width:100%;display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,.1);background:#1b1726;color:#fff;border-radius:15px;padding:11px;text-align:left}.pqi-avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#6d28d9;border:1.5px solid #d8b552;font-size:10px;font-weight:800;overflow:hidden}.pqi-avatar img{width:100%;height:100%;object-fit:cover}.pqi-member b{display:block;font-size:13px}.pqi-member small{display:block;color:#9f96aa;font-size:10px;margin-top:2px}.pqi-actions{display:flex;gap:9px;margin-top:15px}.pqi-btn{flex:1;border:0;border-radius:14px;padding:12px 14px;font-weight:800}.pqi-primary{background:linear-gradient(135deg,#7c3aed,#9f67e9);color:#fff}.pqi-gold{background:linear-gradient(135deg,#d1ac55,#9e7425);color:#21160a}.pqi-muted{background:#262130;color:#c9c0d1}.pqi-danger{background:#3a1720;color:#ffb3c0}.pqi-note{font-size:11px;line-height:1.45;color:#aaa1b4;background:rgba(255,255,255,.04);border-radius:12px;padding:10px;margin-top:10px}\
';
    document.head.appendChild(s);
  }

  function avatarHtml(m){
    var url='';try{url=m.avatarUrl||m.photoURL||'';}catch(e){}
    if(url)return '<span class="pqi-avatar"><img src="'+esc(url)+'" alt=""></span>';
    var n=nameOf(m),initials=n.trim().split(/\s+/).map(function(x){return x[0]||'';}).join('').slice(0,2).toUpperCase();
    return '<span class="pqi-avatar">'+esc(initials||'G')+'</span>';
  }

  function closeModal(){var x=document.getElementById(modalId);if(x)x.remove();}
  function modal(inner){ensureCss();closeModal();var el=document.createElement('div');el.id=modalId;el.className='pqi-overlay';el.innerHTML='<div class="pqi-card">'+inner+'</div>';document.body.appendChild(el);el.addEventListener('click',function(e){if(e.target===el)closeModal();});return el;}

  function otherName(q){var me=uid();return q.inviterUid===me?q.inviteeName:q.inviterName;}
  function relevant(q){var me=uid();return q&&(q.inviterUid===me||q.inviteeUid===me);}

  function chooseInvitee(){
    var me=uid();
    if(!me||!hid()||!db()){toast('Log in om een Party Quest te starten');return;}
    var list=members().filter(function(m){var id=m.uid||m.id;return id&&id!==me;});
    if(!list.length){toast('Er is nog geen ander gezinslid beschikbaar');return;}
    var el=modal('<div class="pqi-head"><div class="pqi-crest">⚔</div><div><h3>Start een Party Quest</h3><p>Nodig een gezinslid uit. De quest wordt pas actief nadat diegene accepteert.</p></div></div><div class="pqi-list">'+list.map(function(m){var id=m.uid||m.id;return '<button class="pqi-member" data-pqi-member="'+esc(id)+'">'+avatarHtml(m)+'<span><b>'+esc(nameOf(m))+'</b><small>Uitnodigen voor gezamenlijke quest</small></span></button>';}).join('')+'</div><div class="pqi-note">De uitnodiging wordt realtime opgeslagen. Als de ander de app later opent, blijft de uitnodiging klaarstaan.</div><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-pqi-close>Annuleren</button></div>');
    el.querySelector('[data-pqi-close]').onclick=closeModal;
    el.querySelectorAll('[data-pqi-member]').forEach(function(btn){btn.onclick=function(){sendInvite(btn.getAttribute('data-pqi-member'));};});
  }

  function sendInvite(targetUid){
    var d=db(),family=hid(),me=uid();
    var target=members().find(function(m){return (m.uid||m.id)===targetUid;});
    if(!d||!family||!me||!target)return;
    var id=d.ref('families/'+family+'/partyQuests').push().key;
    var q={id:id,title:'Party Quest',status:'pending',inviterUid:me,inviterName:selfName(),inviteeUid:targetUid,inviteeName:nameOf(target),createdAt:firebase.database.ServerValue.TIMESTAMP,updatedAt:firebase.database.ServerValue.TIMESTAMP};
    d.ref('families/'+family+'/partyQuests/'+id).set(q).then(function(){closeModal();toast('Party Quest-uitnodiging verstuurd naar '+nameOf(target));}).catch(function(e){toast('Uitnodiging versturen mislukt: '+((e&&e.message)||'onbekende fout'));});
  }

  function showIncoming(q){
    if(!q||q.status!=='pending'||q.inviteeUid!==uid())return;
    var el=modal('<div class="pqi-head"><div class="pqi-crest">⚔</div><div><h3>Party Quest-uitnodiging</h3><p><b>'+esc(q.inviterName||'Een gezinslid')+'</b> nodigt je uit om samen een Party Quest te starten.</p></div></div><div class="pqi-note">Na accepteren zien jullie allebei dat de Party Quest actief is.</div><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-pqi-decline>Weigeren</button><button class="pqi-btn pqi-gold" data-pqi-accept>Accepteren</button></div>');
    el.querySelector('[data-pqi-decline]').onclick=function(){respond(q,'declined');};
    el.querySelector('[data-pqi-accept]').onclick=function(){respond(q,'active');};
  }

  function respond(q,status){
    var d=db(),family=hid();if(!d||!family||!q||q.inviteeUid!==uid())return;
    d.ref('families/'+family+'/partyQuests/'+q.id).update({status:status,respondedAt:firebase.database.ServerValue.TIMESTAMP,updatedAt:firebase.database.ServerValue.TIMESTAMP,acceptedBy:status==='active'?uid():null}).then(function(){closeModal();toast(status==='active'?'Party Quest geaccepteerd!':'Party Quest geweigerd');}).catch(function(e){toast('Kon niet reageren: '+((e&&e.message)||'onbekende fout'));});
  }

  function showStatus(q){
    if(!q){chooseInvitee();return;}
    if(q.status==='pending'&&q.inviteeUid===uid()){showIncoming(q);return;}
    var active=q.status==='active';
    var waiting=q.status==='pending';
    var title=active?'Party Quest actief':'Uitnodiging verstuurd';
    var sub=active?'Jij en '+esc(otherName(q))+' zijn samen op quest.':'Wachten op antwoord van '+esc(otherName(q))+'.';
    var el=modal('<div class="pqi-head"><div class="pqi-crest">⚔</div><div><h3>'+title+'</h3><p>'+sub+'</p></div></div><div class="pqi-note">'+(active?'Deze status wordt realtime met jullie huishouden gedeeld.':'De andere gebruiker kan Accepteren of Weigeren zodra de app geopend is.')+'</div><div class="pqi-actions"><button class="pqi-btn pqi-muted" data-pqi-close>Sluiten</button><button class="pqi-btn pqi-danger" data-pqi-end>'+(active?'Party Quest beëindigen':'Uitnodiging intrekken')+'</button></div>');
    el.querySelector('[data-pqi-close]').onclick=closeModal;
    el.querySelector('[data-pqi-end]').onclick=function(){endQuest(q,active?'completed':'cancelled');};
  }

  function endQuest(q,status){var d=db(),family=hid();if(!d||!family||!q)return;d.ref('families/'+family+'/partyQuests/'+q.id).update({status:status,updatedAt:firebase.database.ServerValue.TIMESTAMP,endedAt:firebase.database.ServerValue.TIMESTAMP}).then(function(){closeModal();toast(status==='completed'?'Party Quest beëindigd':'Uitnodiging ingetrokken');});}

  function decorateButton(){
    var b=document.getElementById('tch-party-quest');if(!b)return;
    var h=b.querySelector('b'),s=b.querySelector('small');
    if(!current){if(h)h.textContent='Party Quest starten';if(s)s.textContent='Nodig een gezinslid uit voor bonus samenwerking';return;}
    if(current.status==='pending'){
      if(current.inviteeUid===uid()){if(h)h.textContent='Party Quest-uitnodiging';if(s)s.textContent=(current.inviterName||'Gezinslid')+' wacht op jouw antwoord';}
      else{if(h)h.textContent='Party Quest uitnodiging verstuurd';if(s)s.textContent='Wacht op '+otherName(current);}
    }else if(current.status==='active'){if(h)h.textContent='Party Quest actief';if(s)s.textContent='Samen met '+otherName(current);}
  }

  function selectCurrent(rows){
    var me=uid(),arr=[];Object.keys(rows||{}).forEach(function(k){var q=rows[k];if(q&&!q.id)q.id=k;if(relevant(q)&&(q.status==='active'||q.status==='pending'))arr.push(q);});
    arr.sort(function(a,b){return Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0);});
    current=arr[0]||null;
  }

  function onSnapshot(rows){
    var me=uid();
    Object.keys(rows||{}).forEach(function(k){
      var q=rows[k];if(!q)return;if(!q.id)q.id=k;
      var prev=statusById[k];statusById[k]=q.status;
      if(q.inviterUid===me&&prev==='pending'&&q.status==='active')toast((q.inviteeName||'Gezinslid')+' heeft je Party Quest geaccepteerd!');
      if(q.inviterUid===me&&prev==='pending'&&q.status==='declined')toast((q.inviteeName||'Gezinslid')+' heeft de Party Quest geweigerd');
    });
    selectCurrent(rows||{});decorateButton();
    if(current&&current.status==='pending'&&current.inviteeUid===me&&!document.getElementById(modalId))showIncoming(current);
  }

  function start(){
    var d=db(),family=hid(),me=uid();
    if(!d||!family||!me)return false;
    if(ref)try{ref.off();}catch(e){}
    ref=d.ref('families/'+family+'/partyQuests');
    ref.on('value',function(snap){onSnapshot(snap.val()||{});},function(){});
    decorateButton();
    return true;
  }

  document.addEventListener('click',function(e){
    var btn=e.target&&e.target.closest&&e.target.closest('#tch-party-quest');
    if(!btn)return;
    e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    if(current)showStatus(current);else chooseInvitee();
  },true);

  window.addEventListener('familyapp:tasks-updated',function(){setTimeout(decorateButton,0);});
  window.addEventListener('familyapp:household-members-updated',function(){setTimeout(function(){start();decorateButton();},0);});
  var tries=0,t=setInterval(function(){tries++;if(start()||tries>80)clearInterval(t);},250);
  window.PartyQuestInvites={start:start,open:function(){current?showStatus(current):chooseInvitee();},current:function(){return current;}};
})();
