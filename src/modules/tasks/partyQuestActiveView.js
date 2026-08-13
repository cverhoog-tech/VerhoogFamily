'use strict';
(function(){
  if(window.__partyQuestActiveViewV2)return;
  window.__partyQuestActiveViewV2=true;
  var active=[],seenEvents={};
  function currentUid(){try{var u=window.fbUser||(window.fbAuth&&window.fbAuth.currentUser)||firebase.auth().currentUser;return u&&u.uid||null;}catch(e){return null;}}
  function familyId(){return window.fbFamilyId||null;}
  function invitees(q){return q&&q.invitees&&typeof q.invitees==='object'?q.invitees:{};}
  function relevant(q){var me=currentUid(),mine=invitees(q)[me];return q&&q.status==='active'&&(q.inviterUid===me||(mine&&mine.status==='active'));}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function toast(m){if(typeof window.showToast==='function')window.showToast(m);}
  function refresh(rows){
    var all=Object.keys(rows||{}).map(function(k){var q=rows[k];if(q&&!q.id)q.id=k;return q;});
    all.forEach(function(q){var ev=q&&q.lastEvent;if(!ev||!ev.id)return;if(!seenEvents[q.id]){seenEvents[q.id]=ev.id;return;}if(seenEvents[q.id]===ev.id)return;seenEvents[q.id]=ev.id;if(ev.actorUid!==currentUid()&&relevant(q))toast(ev.message||'Party Quest bijgewerkt');});
    active=all.filter(relevant).sort(function(a,b){return Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0);});decorate();
    var openEl=document.getElementById('party-quest-active-view');if(openEl&&active.length)open();
  }
  function decorate(){var b=document.getElementById('tch-party-quest');if(!b||!active.length)return;var h=b.querySelector('b'),s=b.querySelector('small');if(h)h.textContent=active.length===1?'1 actieve Party Quest':active.length+' actieve Party Quests';if(s)s.textContent='Tik voor overzicht en beheer';}
  function participantNames(q){var names=[];Object.keys(invitees(q)).forEach(function(k){var x=invitees(q)[k];if(x&&x.status==='active')names.push(x.name||'Gezinslid');});return names;}
  function eventPayload(message){return {id:String(Date.now())+'-'+currentUid(),actorUid:currentUid(),message:message,time:firebase.database.ServerValue.TIMESTAMP};}
  function leave(q){var me=currentUid(),mine=invitees(q)[me];if(!mine)return;var message=(mine.name||'Een gezinslid')+' heeft “'+(q.questTitle||'Party Quest')+'” verlaten';var updates={};updates['invitees/'+me+'/status']='declined';updates['invitees/'+me+'/respondedAt']=firebase.database.ServerValue.TIMESTAMP;updates.updatedAt=firebase.database.ServerValue.TIMESTAMP;updates.lastEvent=eventPayload(message);firebase.database().ref('families/'+familyId()+'/partyQuests/'+q.id).update(updates).then(function(){toast('Je hebt “'+(q.questTitle||'Party Quest')+'” verlaten');});}
  function end(q){var message=(q.inviterName||'De maker')+' heeft “'+(q.questTitle||'Party Quest')+'” beëindigd';firebase.database().ref('families/'+familyId()+'/partyQuests/'+q.id).update({status:'completed',endedAt:firebase.database.ServerValue.TIMESTAMP,updatedAt:firebase.database.ServerValue.TIMESTAMP,lastEvent:eventPayload(message)}).then(function(){toast('Party Quest beëindigd');});}
  function open(){
    if(!active.length)return false;var old=document.getElementById('party-quest-active-view');if(old)old.remove();var me=currentUid();var e=document.createElement('div');e.id='party-quest-active-view';e.style.cssText='position:fixed;inset:0;z-index:10120;background:rgba(8,7,15,.68);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;padding:16px';
    e.innerHTML='<div style="width:min(440px,100%);max-height:82vh;overflow:auto;border-radius:24px;background:linear-gradient(180deg,#171126,#0f0d18);border:1px solid rgba(216,181,82,.48);padding:20px;color:#fff"><h3 style="margin:0;font:800 20px Georgia,serif">Actieve Party Quests</h3><p style="color:#aaa1b4;font-size:12px">Beheer je actieve groepsquests.</p>'+active.map(function(q){var names=participantNames(q),owner=q.inviterUid===me;return '<div style="border:1px solid rgba(255,255,255,.1);background:#1b1726;border-radius:15px;padding:12px;margin-top:10px"><b>'+esc(q.questTitle||'Party Quest')+'</b><small style="display:block;color:#a9a0b3;margin-top:4px">'+(names.length?'Actief met '+esc(names.join(', ')):'Geen andere actieve deelnemers')+'</small><button data-action="'+(owner?'end':'leave')+'" data-id="'+esc(q.id)+'" style="width:100%;margin-top:10px;border:0;border-radius:12px;padding:10px;background:#3a1720;color:#ffb3c0;font-weight:800">'+(owner?'Beëindigen':'Verlaten')+'</button></div>';}).join('')+'<button data-close style="width:100%;margin-top:16px;border:0;border-radius:14px;padding:12px;background:#262130;color:#c9c0d1;font-weight:800">Sluiten</button></div>';
    document.body.appendChild(e);e.onclick=function(ev){if(ev.target===e)e.remove();};e.querySelector('[data-close]').onclick=function(){e.remove();};e.querySelectorAll('[data-action]').forEach(function(b){b.onclick=function(){var q=active.find(function(x){return String(x.id)===String(b.getAttribute('data-id'));});if(!q)return;if(b.getAttribute('data-action')==='end')end(q);else leave(q);};});return true;
  }
  function start(){try{if(!familyId()||!currentUid())return false;firebase.database().ref('families/'+familyId()+'/partyQuests').on('value',function(s){refresh(s.val()||{});});return true;}catch(e){return false;}}
  document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('#tch-party-quest');if(!b||!active.length)return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();open();},true);
  window.PartyQuestActiveView={open:open,list:function(){return active.slice();},start:start};
  var tries=0,t=setInterval(function(){tries++;if(start()||tries>80)clearInterval(t);},250);
})();
