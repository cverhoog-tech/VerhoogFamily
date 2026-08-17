'use strict';
(function(){
  if(window.__partyQuestActiveContextViewV1)return;
  window.__partyQuestActiveContextViewV1=true;
  var active=[];
  function svc(){return window.PartyQuestContextService||null;}
  function uid(){try{return window.HouseholdContext&&HouseholdContext.requireUser?HouseholdContext.requireUser():null;}catch(e){return null;}}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function toast(m){if(typeof window.showToast==='function')window.showToast(m);}
  function invitees(q){return q&&q.invitees&&typeof q.invitees==='object'?q.invitees:{};}
  function relevant(q){var me=uid(),mine=invitees(q)[me];return !!(q&&q.status==='active'&&(String(q.inviterUid)===String(me)||(mine&&mine.status==='active')));}
  function refresh(){var s=svc();if(!s)return false;try{active=s.list().filter(relevant).sort(function(a,b){return Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0);});}catch(e){active=[];}decorate();return true;}
  function decorate(){var b=document.getElementById('tch-party-quest');if(!b||!active.length)return;var h=b.querySelector('b'),s=b.querySelector('small');if(h)h.textContent=active.length===1?'1 actieve Party Quest':active.length+' actieve Party Quests';if(s)s.textContent='Tik voor overzicht en beheer';}
  function close(){var e=document.getElementById('party-quest-active-view');if(e)e.remove();}
  function open(){refresh();if(!active.length){close();return false;}close();var me=uid(),e=document.createElement('div');e.id='party-quest-active-view';e.style.cssText='position:fixed;inset:0;z-index:10120;background:rgba(8,7,15,.68);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;padding:16px';e.innerHTML='<div style="width:min(440px,100%);max-height:82vh;overflow:auto;border-radius:24px;background:linear-gradient(180deg,#171126,#0f0d18);border:1px solid rgba(216,181,82,.48);padding:20px;color:#fff"><h3 style="margin:0;font:800 20px Georgia,serif">Actieve Party Quests</h3><p style="color:#aaa1b4;font-size:12px">'+active.length+' actieve groepsquest'+(active.length===1?'':'s')+'</p>'+active.map(function(q){var mine=invitees(q)[me],owner=String(q.inviterUid)===String(me);return '<div style="border:1px solid rgba(255,255,255,.1);background:#1b1726;border-radius:15px;padding:12px;margin-top:10px"><b>'+esc(q.questTitle||'Party Quest')+'</b><small style="display:block;color:#a9a0b3;margin-top:4px">'+esc(owner?'Jij bent maker':((mine&&mine.name)||'Je doet mee'))+'</small><button data-action="'+(owner?'end':'leave')+'" data-id="'+esc(q.id)+'" style="width:100%;margin-top:10px;border:0;border-radius:12px;padding:10px;background:#3a1720;color:#ffb3c0;font-weight:800">'+(owner?'Beëindigen':'Verlaten')+'</button></div>';}).join('')+'<button data-close style="width:100%;margin-top:16px;border:0;border-radius:14px;padding:12px;background:#262130;color:#c9c0d1;font-weight:800">Sluiten</button></div>';document.body.appendChild(e);e.onclick=function(ev){if(ev.target===e)close();};e.querySelector('[data-close]').onclick=close;e.querySelectorAll('[data-action]').forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-id'),action=b.getAttribute('data-action'),p=action==='end'?svc().end(id,'completed'):svc().leave(id);Promise.resolve(p).then(function(){toast(action==='end'?'Party Quest beëindigd':'Party Quest verlaten');refresh();open();}).catch(function(err){toast((err&&err.message)||'Actie mislukt');});};});return true;}
  function start(){var s=svc();if(!s)return false;var ok=s.start();refresh();return ok;}
  function endQuest(q){if(!q||!q.id)return Promise.resolve(false);return svc().end(q.id,'completed').then(function(){refresh();return true;});}
  window.addEventListener('familyapp:party-quests-updated',refresh);
  window.addEventListener('familyapp:household-context-changed',function(){close();refresh();});
  window.PartyQuestActiveView={version:'6.0-context',open:open,list:function(){refresh();return active.slice();},start:start,endQuest:endQuest};
  Promise.resolve().then(start);
})();