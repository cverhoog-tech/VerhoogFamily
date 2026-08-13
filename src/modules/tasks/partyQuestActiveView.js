'use strict';
(function(){
  if(window.__partyQuestActiveViewV1)return;
  window.__partyQuestActiveViewV1=true;
  var active=[];
  function currentUid(){try{var u=window.fbUser||(window.fbAuth&&window.fbAuth.currentUser)||firebase.auth().currentUser;return u&&u.uid||null;}catch(e){return null;}}
  function familyId(){return window.fbFamilyId||null;}
  function invitees(q){return q&&q.invitees&&typeof q.invitees==='object'?q.invitees:{};}
  function relevant(q){var me=currentUid(),mine=invitees(q)[me];return q&&q.status==='active'&&(q.inviterUid===me||(mine&&mine.status==='active'));}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function refresh(rows){active=Object.keys(rows||{}).map(function(k){var q=rows[k];if(q&&!q.id)q.id=k;return q;}).filter(relevant).sort(function(a,b){return Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0);});decorate();}
  function decorate(){var b=document.getElementById('tch-party-quest');if(!b||!active.length)return;var h=b.querySelector('b'),s=b.querySelector('small');if(h)h.textContent=active.length===1?'1 actieve Party Quest':active.length+' actieve Party Quests';if(s)s.textContent='Tik voor overzicht van actieve quests';}
  function open(){if(!active.length)return false;var old=document.getElementById('party-quest-active-view');if(old)old.remove();var e=document.createElement('div');e.id='party-quest-active-view';e.style.cssText='position:fixed;inset:0;z-index:10095;background:rgba(8,7,15,.68);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;padding:16px';e.innerHTML='<div style="width:min(440px,100%);max-height:82vh;overflow:auto;border-radius:24px;background:linear-gradient(180deg,#171126,#0f0d18);border:1px solid rgba(216,181,82,.48);padding:20px;color:#fff"><h3 style="margin:0;font:800 20px Georgia,serif">Actieve Party Quests</h3><p style="color:#aaa1b4;font-size:12px">'+active.length+' actieve quest'+(active.length===1?'':'s')+'</p>'+active.map(function(q){var names=[];Object.keys(invitees(q)).forEach(function(k){var x=invitees(q)[k];if(x&&x.status==='active')names.push(x.name||'Gezinslid');});return '<div style="border:1px solid rgba(255,255,255,.1);background:#1b1726;border-radius:15px;padding:12px;margin-top:10px"><b>'+esc(q.questTitle||'Party Quest')+'</b><small style="display:block;color:#a9a0b3;margin-top:4px">'+(names.length?'Actief met '+esc(names.join(', ')):'Geen andere actieve deelnemers')+'</small></div>';}).join('')+'<button data-close style="width:100%;margin-top:16px;border:0;border-radius:14px;padding:12px;background:#262130;color:#c9c0d1;font-weight:800">Sluiten</button></div>';document.body.appendChild(e);e.onclick=function(ev){if(ev.target===e)e.remove();};e.querySelector('[data-close]').onclick=function(){e.remove();};return true;}
  function start(){try{if(!familyId()||!currentUid())return false;firebase.database().ref('families/'+familyId()+'/partyQuests').on('value',function(s){refresh(s.val()||{});});return true;}catch(e){return false;}}
  window.PartyQuestActiveView={open:open,list:function(){return active.slice();},start:start};
  var tries=0,t=setInterval(function(){tries++;if(start()||tries>80)clearInterval(t);},250);
})();
