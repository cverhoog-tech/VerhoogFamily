'use strict';
// ============================================================
// PARTY QUEST HELP UI v1.0.1 — STEP 11.4
// Presentation only. Reads PartyQuestRepository and delegates all mutations
// to PartyQuestService. HouseholdContext is the only identity authority.
// ============================================================
(function(){
  if(window.PartyQuestHelpUi)return;

  var VERSION='1.0.1';
  var quests=[],incoming=[],repoUnsubscribe=null,boundRepo=null,generation=0,lastIdentity=null;
  var observer=null,startTimer=null,decorateTimer=null;

  function context(){try{return window.HouseholdContext&&typeof HouseholdContext.snapshot==='function'?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function uid(){var c=context();return c&&c.ready&&c.uid?String(c.uid):null;}
  function identity(c){return c&&c.ready&&c.uid&&c.householdId?[String(c.uid),String(c.householdId),String(c.revision||0)].join('|'):null;}
  function repo(){return window.PartyQuestRepository||null;}
  function service(){return window.PartyQuestService||null;}
  function invitees(q){return q&&q.invitees&&typeof q.invitees==='object'?q.invitees:{};}
  function requests(q){return q&&q.helpRequests&&typeof q.helpRequests==='object'?q.helpRequests:{};}
  function members(){try{return window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members()||[]:[];}catch(e){return[];}}
  function memberId(m){return String(m&&(m.uid||m.id)||'');}
  function memberName(id){var m=members().find(function(x){return memberId(x)===String(id||'');});return (m&&(m.displayName||m.name))||'Gezinslid';}
  function taskById(id){return (window.taskData||[]).find(function(t){return String(t&&(t.id||t._key)||'')===String(id||'');})||null;}
  function activeMember(m){return !!(m&&(!m.status||m.status==='active'));}
  function participant(q,id){var key=String(id||''),inv=invitees(q)[key];return String(q&&q.inviterUid||'')===key||!!(inv&&(inv.status==='active'||inv.status==='pending'));}
  function assigned(task,id){var key=String(id||'');return !!(task&&((task.assignedToUids&&task.assignedToUids[key])||String(task.assignedToUid||'')===key||String(task.createdByUid||task.ownerUid||'')===key));}
  function eligible(q,id){var m=members().find(function(x){return memberId(x)===String(id||'');}),task=taskById(q&&q.questId);return !!(m&&activeMember(m)&&!participant(q,id)&&!assigned(task,id));}
  function openRequest(q){var map=requests(q),keys=Object.keys(map);for(var i=0;i<keys.length;i++){var r=map[keys[i]];if(r&&r.status==='open')return r;}return null;}
  function responded(r,id){var key=String(id||'');return !!((r&&r.acceptedByUids&&Object.prototype.hasOwnProperty.call(r.acceptedByUids,key))||(r&&r.declinedByUids&&Object.prototype.hasOwnProperty.call(r.declinedByUids,key)));}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function toast(m){if(typeof window.showToast==='function')window.showToast(m);}
  function close(){var e=document.getElementById('party-quest-help-modal');if(e)e.remove();}
  function modal(html){close();var e=document.createElement('div');e.id='party-quest-help-modal';e.style.cssText='position:fixed;inset:0;z-index:10140;background:rgba(8,7,15,.72);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;padding:16px';e.innerHTML='<div style="width:min(440px,100%);max-height:82vh;overflow:auto;border-radius:24px;background:linear-gradient(180deg,#171126,#0f0d18);border:1px solid rgba(216,181,82,.48);padding:20px;color:#fff">'+html+'</div>';document.body.appendChild(e);e.onclick=function(ev){if(ev.target===e)close();};return e;}
  function button(label,attr,muted){return '<button '+attr+' style="width:100%;margin-top:10px;border:0;border-radius:13px;padding:12px;background:'+(muted?'#262130':'linear-gradient(135deg,#6d28d9,#8b5cf6)')+';color:'+(muted?'#c9c0d1':'#fff')+';font-weight:900">'+label+'</button>';}

  function computeIncoming(){
    var me=uid();if(!me)return[];var out=[];
    quests.forEach(function(q){if(!q||q.status!=='active'||participant(q,me)||!eligible(q,me))return;Object.keys(requests(q)).forEach(function(key){var r=requests(q)[key];if(!r||r.status!=='open'||String(r.requesterUid||'')===me)return;var targeted=r.audience==='uid';if(targeted&&String(r.targetUid||'')!==me)return;if(!targeted&&responded(r,me))return;out.push({quest:q,request:r});});});
    return out.sort(function(a,b){return Number(b.request.createdAt||0)-Number(a.request.createdAt||0);});
  }

  function decorateCard(){
    if(decorateTimer)clearTimeout(decorateTimer);decorateTimer=setTimeout(function(){decorateTimer=null;var b=document.getElementById('tch-party-quest');if(!b||!incoming.length)return;var pending=window.PartyQuestInvites&&typeof PartyQuestInvites.pending==='function'?PartyQuestInvites.pending():[];if(pending&&pending.length)return;var h=b.querySelector('b'),s=b.querySelector('small'),x=incoming[0];if(h)h.textContent=incoming.length===1?'Hulp gevraagd voor Party Quest':incoming.length+' Party Quest-hulpvragen';if(s)s.textContent=(x.request.requesterName||'Gezinslid')+' · '+(x.quest.questTitle||'Party Quest');},0);
  }

  function patchActiveOverlay(){
    var root=document.getElementById('party-quest-active-view');if(!root)return;
    root.querySelectorAll('[data-action="end"]').forEach(function(endBtn){
      var id=endBtn.getAttribute('data-id');if(!id||endBtn.parentNode.querySelector('[data-party-help-owner="'+id+'"]'))return;var q=quests.find(function(x){return String(x&&(x.id||x._key))===String(id);});if(!q)return;var help=document.createElement('button');help.type='button';help.setAttribute('data-party-help-owner',id);help.textContent=openRequest(q)?'Hulpvraag beheren':'Hulp vragen';help.style.cssText='width:100%;margin-top:10px;border:1px solid rgba(216,181,82,.35);border-radius:12px;padding:10px;background:#241b35;color:#f4ddb0;font-weight:850';help.onclick=function(e){e.preventDefault();e.stopPropagation();openOwner(id);};endBtn.parentNode.insertBefore(help,endBtn);
    });
  }

  function openOwner(id){
    var q=quests.find(function(x){return String(x&&(x.id||x._key))===String(id);})||(repo()&&repo().getById?repo().getById(id):null);if(!q)return false;var me=uid();if(!me||String(q.inviterUid||'')!==me){toast('Alleen de maker kan hulp vragen');return false;}
    var existing=openRequest(q);
    if(existing){
      var accepted=Object.keys(existing.acceptedByUids||{}).length,declined=Object.keys(existing.declinedByUids||{}).length;var audience=existing.audience==='household'?'Open voor het hele gezin':'Gericht aan '+(existing.targetName||memberName(existing.targetUid));
      var e=modal('<h3 style="margin:0;font:800 20px Georgia,serif">Hulpvraag actief</h3><p style="color:#aaa1b4;font-size:12px;line-height:1.45">'+esc(q.questTitle||'Party Quest')+'<br>'+esc(audience)+(existing.audience==='household'?'<br>'+accepted+' geholpen · '+declined+' niet voor mij':'')+'</p>'+button('Hulpvraag intrekken','data-retract','')+button('Sluiten','data-close','1'));
      e.querySelector('[data-close]').onclick=close;e.querySelector('[data-retract]').onclick=function(){var b=this;b.disabled=true;var s=service();Promise.resolve(s&&s.retractHelp?s.retractHelp(id,existing.occurrenceId||existing.id):Promise.reject(new Error('Service niet klaar'))).then(function(){toast('Hulpvraag ingetrokken');close();}).catch(function(err){b.disabled=false;toast((err&&err.message)||'Intrekken mislukt');});};return true;
    }
    var candidates=members().filter(function(m){return eligible(q,memberId(m));});var choices='';
    if(candidates.length)choices+=button('👨‍👩‍👧‍👦 Vraag het hele gezin','data-household','');
    candidates.forEach(function(m){choices+=button('Vraag '+esc(m.displayName||m.name||'Gezinslid'),'data-target="'+esc(memberId(m))+'"','1');});
    if(!choices)choices='<p style="color:#aaa1b4;font-size:12px">Er is nu niemand extra beschikbaar om hulp te vragen.</p>';
    var e2=modal('<h3 style="margin:0;font:800 20px Georgia,serif">Extra hulp vragen</h3><p style="color:#aaa1b4;font-size:12px;line-height:1.45">'+esc(q.questTitle||'Party Quest')+'<br>Kies één gezinslid of zet de hulpvraag open voor iedereen.</p>'+choices+button('Sluiten','data-close','1'));
    e2.querySelector('[data-close]').onclick=close;var all=e2.querySelector('[data-household]');if(all)all.onclick=function(){sendHelp(this,id,null,true);};e2.querySelectorAll('[data-target]').forEach(function(b){b.onclick=function(){sendHelp(b,id,b.getAttribute('data-target'),false);};});return true;
  }

  function sendHelp(buttonEl,id,target,household){
    buttonEl.disabled=true;var s=service(),p=household?(s&&s.requestHouseholdHelp?s.requestHouseholdHelp(id):null):(s&&s.requestHelp?s.requestHelp(id,target):null);if(!p){buttonEl.disabled=false;toast('Hulp vragen is nog niet klaar');return;}Promise.resolve(p).then(function(){toast(household?'Hulp gevraagd aan het hele gezin 🤝':'Hulpvraag verstuurd 🤝');close();}).catch(function(err){buttonEl.disabled=false;toast((err&&err.message)||'Hulp vragen mislukt');});
  }

  function openIncoming(){
    var x=incoming[0];if(!x)return false;var q=x.quest,r=x.request;var e=modal('<div style="font-size:30px">🤝</div><h3 style="margin:6px 0 0;font:800 20px Georgia,serif">Hulp gevraagd</h3><p style="color:#aaa1b4;font-size:12px;line-height:1.45">'+esc(r.requesterName||'Gezinslid')+' vraagt hulp bij <b style="color:#fff">'+esc(q.questTitle||'Party Quest')+'</b>.'+(r.audience==='household'?'<br>Deze vraag staat open voor het hele gezin.':'')+'</p>'+button('Hulp geven','data-accept','')+button('Niet voor mij','data-decline','1')+button('Sluiten','data-close','1'));
    e.querySelector('[data-close]').onclick=close;e.querySelector('[data-accept]').onclick=function(){respondIncoming(this,q,r,'active');};e.querySelector('[data-decline]').onclick=function(){respondIncoming(this,q,r,'declined');};return true;
  }
  function respondIncoming(btn,q,r,status){btn.disabled=true;var s=service();if(!s||typeof s.respondHelp!=='function'){btn.disabled=false;toast('Hulp reageren is nog niet klaar');return;}Promise.resolve(s.respondHelp(q.id||q._key,r.occurrenceId||r.id,status)).then(function(){toast(status==='active'?'Je helpt nu mee 🤝':'Deze hulpvraag is niet voor jou');close();setTimeout(function(){if(incoming.length)openIncoming();},60);}).catch(function(err){btn.disabled=false;toast((err&&err.message)||'Actie mislukt');});}

  function refresh(list,meta,gen){
    if(gen!==generation)return;var c=context(),key=identity(c);if(!key){quests=[];incoming=[];lastIdentity=null;close();decorateCard();return;}if(meta&&meta.ready&&((meta.uid&&String(meta.uid)!==String(c.uid))||(meta.householdId&&String(meta.householdId)!==String(c.householdId))||(meta.revision&&Number(meta.revision)!==Number(c.revision))))return;if(lastIdentity!==key){lastIdentity=key;close();}
    quests=(Array.isArray(list)?list:[]).slice();incoming=computeIncoming();decorateCard();patchActiveOverlay();
  }
  function start(){var r=repo();if(!r||typeof r.subscribe!=='function')return false;if(repoUnsubscribe&&boundRepo===r)return true;if(repoUnsubscribe){try{repoUnsubscribe();}catch(e){}repoUnsubscribe=null;}boundRepo=r;var gen=++generation;repoUnsubscribe=r.subscribe(function(list,meta){refresh(list,meta,gen);});if(typeof r.start==='function')r.start();if(!observer&&document.body){observer=new MutationObserver(function(){patchActiveOverlay();decorateCard();});observer.observe(document.body,{childList:true,subtree:true});}return true;}
  function stop(){generation++;if(repoUnsubscribe){try{repoUnsubscribe();}catch(e){}repoUnsubscribe=null;}boundRepo=null;quests=[];incoming=[];lastIdentity=null;if(observer){observer.disconnect();observer=null;}close();}

  document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('#tch-party-quest');if(!b||!incoming.length)return;var pending=window.PartyQuestInvites&&typeof PartyQuestInvites.pending==='function'?PartyQuestInvites.pending():[];if(pending&&pending.length)return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();openIncoming();},true);

  window.PartyQuestHelpUi={version:VERSION,start:start,stop:stop,openOwner:openOwner,openIncoming:openIncoming,incoming:function(){return incoming.slice();},status:function(){var c=context();return{version:VERSION,ready:!!repoUnsubscribe,uid:c&&c.uid||null,householdId:c&&c.householdId||null,incoming:incoming.length};}};
  var tries=0;startTimer=setInterval(function(){tries++;if(start()||tries>120){clearInterval(startTimer);startTimer=null;}},100);
})();
