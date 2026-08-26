'use strict';
// ============================================================
// PARTY QUEST ACTIVE VIEW v6.0.0 — STEP 11.3
// Presentation only. Party Quest realtime state is owned by
// PartyQuestRepository; mutations are owned by PartyQuestService.
// Identity is exclusively HouseholdContext UID + household revision.
// ============================================================
(function(){
  if(window.__partyQuestActiveViewV6)return;
  window.__partyQuestActiveViewV6=true;

  var VERSION='6.0.0';
  var active=[],seenEvents={},openTaskId=null,reopenQueue=false;
  var repoUnsubscribe=null,boundRepo=null,subscriptionGeneration=0,lastIdentity=null;
  var startTimer=null,queueTimer=null,detailTimer=null,detailObserver=null;

  function context(){try{return window.HouseholdContext&&typeof HouseholdContext.snapshot==='function'?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function currentUid(){var c=context();return c&&c.ready&&c.uid||null;}
  function identity(c){return c&&c.ready&&c.uid&&c.householdId?[String(c.uid),String(c.householdId),String(c.revision||0)].join('|'):null;}
  function repo(){return window.PartyQuestRepository||null;}
  function service(){return window.PartyQuestService||null;}
  function invitees(q){return q&&q.invitees&&typeof q.invitees==='object'?q.invitees:{};}
  function relevant(q){var me=currentUid(),mine=invitees(q)[me];return !!(q&&me&&q.status==='active'&&(String(q.inviterUid||'')===String(me)||(mine&&mine.status==='active')));}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function toast(m){if(typeof window.showToast==='function')window.showToast(m);}
  function failMessage(error,fallback){return error&&error.message&&String(error.message).indexOf('PARTY_QUEST_')!==0?error.message:fallback;}
  function members(){try{return window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members()||[]:[];}catch(e){return[];}}
  function member(id){return members().find(function(m){return String(m.uid||m.id)===String(id);})||null;}
  function nameOf(id,fallback){var m=member(id);return (m&&(m.displayName||m.name))||fallback||'Gezinslid';}
  function avatarOf(id){var m=member(id);return m&&(m.avatarUrl||m.photoURL||m.profilePhoto||m.avatar)||'';}
  function initials(v){return String(v||'G').trim().split(/\s+/).map(function(x){return x.charAt(0);}).join('').slice(0,2).toUpperCase()||'G';}
  function participantRows(q){var out=[];if(q.inviterUid)out.push({uid:q.inviterUid,name:q.inviterName||nameOf(q.inviterUid)});Object.keys(invitees(q)).forEach(function(k){var x=invitees(q)[k];if(x&&x.status==='active'&&!out.some(function(p){return String(p.uid)===String(k);})){out.push({uid:k,name:x.name||nameOf(k)});}});return out;}
  function participantNames(q){return participantRows(q).map(function(p){return p.name;});}
  function avatarStack(q,cls){return participantRows(q).map(function(p){var u=avatarOf(p.uid),n=p.name||nameOf(p.uid);return u?'<img class="'+cls+'" src="'+esc(u)+'" alt="'+esc(n)+'">':'<span class="'+cls+'" title="'+esc(n)+'">'+esc(initials(n))+'</span>';}).join('');}

  function removeActiveOverlay(){var el=document.getElementById('party-quest-active-view');if(el)el.remove();}
  function removeDetailStrip(){var old=document.querySelector&&document.querySelector('#tdp-overlay .tdp-body .tdp-party-strip');if(old)old.remove();}
  function clearProjection(reason){active=[];seenEvents={};openTaskId=null;removeActiveOverlay();removeDetailStrip();try{window.dispatchEvent(new CustomEvent('familyapp:party-quest-active-view',{detail:{reason:reason||'cleared',count:0}}));}catch(e){}}
  function dropLocal(id){active=active.filter(function(q){return String(q&&q.id)!==String(id);});decorate();decorateDetail();var openEl=document.getElementById('party-quest-active-view');if(openEl){if(active.length)open();else openEl.remove();}}

  function refresh(list,meta,generation){
    if(generation!==subscriptionGeneration)return;
    var c=context(),id=identity(c);
    if(!id){lastIdentity=null;clearProjection('context-not-ready');return;}
    if(meta&&meta.ready&&((meta.uid&&String(meta.uid)!==String(c.uid))||(meta.householdId&&String(meta.householdId)!==String(c.householdId))||(meta.revision&&Number(meta.revision)!==Number(c.revision))))return;
    if(lastIdentity!==id){lastIdentity=id;active=[];seenEvents={};removeActiveOverlay();removeDetailStrip();}
    var all=(Array.isArray(list)?list:[]).map(function(q){return q&&typeof q==='object'?q:null;}).filter(Boolean);
    all.forEach(function(q){var ev=q&&q.lastEvent,key=String(q&&q.id||q&&q._key||'');if(!key||!ev||!ev.id)return;if(!seenEvents[key]){seenEvents[key]=ev.id;return;}if(seenEvents[key]===ev.id)return;seenEvents[key]=ev.id;if(String(ev.actorUid||'')!==String(currentUid()||'')&&relevant(q))toast(ev.message||'Party Quest bijgewerkt');});
    active=all.filter(relevant).sort(function(a,b){return Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0);});
    decorate();decorateDetail();
    var openEl=document.getElementById('party-quest-active-view');if(openEl){if(active.length)open();else openEl.remove();}
    try{window.dispatchEvent(new CustomEvent('familyapp:party-quest-active-view',{detail:{reason:'repository',count:active.length,uid:c.uid,householdId:c.householdId,revision:c.revision}}));}catch(e){}
  }

  function decorate(){var b=document.getElementById('tch-party-quest');if(!b||!active.length)return;var h=b.querySelector('b'),s=b.querySelector('small');if(h)h.textContent=active.length===1?'1 actieve Party Quest':active.length+' actieve Party Quests';if(s)s.textContent='Tik voor overzicht en beheer';}

  function leave(q){
    var s=service();if(!q||!s||typeof s.leaveQuest!=='function'){toast('Party Quest service is nog niet klaar');return Promise.resolve(false);}
    return s.leaveQuest(q.id||q._key).then(function(){dropLocal(q.id||q._key);toast('Je hebt “'+(q.questTitle||'Party Quest')+'” verlaten');return true;}).catch(function(error){toast(failMessage(error,'Party Quest verlaten mislukt'));return false;});
  }
  function end(q){
    var s=service();if(!q||!s||typeof s.cancelQuest!=='function'){toast('Party Quest service is nog niet klaar');return Promise.resolve(false);}
    return s.cancelQuest(q.id||q._key).then(function(){dropLocal(q.id||q._key);toast('Party Quest beëindigd');return true;}).catch(function(error){toast(failMessage(error,'Party Quest beëindigen mislukt'));return false;});
  }

  function open(){
    if(!active.length){removeActiveOverlay();return false;}
    removeActiveOverlay();var me=currentUid();if(!me)return false;var e=document.createElement('div');e.id='party-quest-active-view';e.style.cssText='position:fixed;inset:0;z-index:10120;background:rgba(8,7,15,.68);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;padding:16px';
    e.innerHTML='<div style="width:min(440px,100%);max-height:82vh;overflow:auto;border-radius:24px;background:linear-gradient(180deg,#171126,#0f0d18);border:1px solid rgba(216,181,82,.48);padding:20px;color:#fff"><style>.pqav-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.pqav-avatars{display:flex;align-items:center;padding-left:8px}.pqav-avatar{width:31px;height:31px;border-radius:50%;margin-left:-8px;display:grid;place-items:center;object-fit:cover;overflow:hidden;background:linear-gradient(135deg,#6d28d9,#a855f7);color:#fff;border:2px solid #1b1726;box-shadow:0 0 0 1px rgba(216,181,82,.65);font-size:9px;font-weight:900}.pqav-avatar:first-child{margin-left:0}</style><h3 style="margin:0;font:800 20px Georgia,serif">Actieve Party Quests</h3><p style="color:#aaa1b4;font-size:12px">'+active.length+' actieve groepsquest'+(active.length===1?'':'s')+'</p>'+active.map(function(q){var names=participantNames(q),owner=String(q.inviterUid||'')===String(me);return '<div style="border:1px solid rgba(255,255,255,.1);background:#1b1726;border-radius:15px;padding:12px;margin-top:10px"><div class="pqav-head"><div style="min-width:0"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(q.questTitle||'Party Quest')+'</b><small style="display:block;color:#a9a0b3;margin-top:4px">'+(names.length?'Party: '+esc(names.join(', ')):'Geen andere actieve deelnemers')+'</small></div><div class="pqav-avatars">'+avatarStack(q,'pqav-avatar')+'</div></div><button data-action="'+(owner?'end':'leave')+'" data-id="'+esc(q.id||q._key)+'" style="width:100%;margin-top:10px;border:0;border-radius:12px;padding:10px;background:#3a1720;color:#ffb3c0;font-weight:800">'+(owner?'Beëindigen':'Verlaten')+'</button></div>';}).join('')+'<button data-close style="width:100%;margin-top:16px;border:0;border-radius:14px;padding:12px;background:#262130;color:#c9c0d1;font-weight:800">Sluiten</button></div>';
    document.body.appendChild(e);e.onclick=function(ev){if(ev.target===e)e.remove();};e.querySelector('[data-close]').onclick=function(){e.remove();};e.querySelectorAll('[data-action]').forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-id'),q=active.find(function(x){return String(x.id||x._key)===String(id);});if(!q)return;b.disabled=true;Promise.resolve(b.getAttribute('data-action')==='end'?end(q):leave(q)).then(function(ok){if(!ok&&document.body.contains(b))b.disabled=false;});};});return true;
  }

  function ensureDetailCss(){if(document.getElementById('party-quest-detail-css'))return;var s=document.createElement('style');s.id='party-quest-detail-css';s.textContent='.tdp-party-strip{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 9px;padding:8px 10px;border-radius:13px;border:1px solid rgba(164,120,36,.32);background:linear-gradient(135deg,rgba(109,40,217,.10),rgba(202,161,83,.10))}.tdp-party-copy{min-width:0}.tdp-party-label{font-family:"Cinzel",Georgia,serif;font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--tdp-gold)}.tdp-party-sub{font-size:10.5px;color:var(--tdp-text2);margin-top:2px}.tdp-party-avatars{display:flex;align-items:center;flex:0 0 auto;padding-left:8px}.tdp-party-avatar{width:29px;height:29px;border-radius:50%;margin-left:-8px;display:grid;place-items:center;overflow:hidden;object-fit:cover;background:linear-gradient(135deg,#6d28d9,#a855f7);color:#fff;border:2px solid var(--tdp-surface);box-shadow:0 0 0 1px rgba(202,161,83,.65);font-size:9px;font-weight:900}.tdp-party-avatar:first-child{margin-left:0}';document.head.appendChild(s);}
  function decorateDetail(){if(!openTaskId)return;var body=document.querySelector('#tdp-overlay .tdp-body');if(!body)return;var old=body.querySelector('.tdp-party-strip');if(old)old.remove();var q=active.find(function(x){return String(x.questId)===String(openTaskId);});if(!q)return;var people=participantRows(q);if(people.length<2)return;ensureDetailCss();var anchor=body.querySelector('.tdp-person');if(!anchor)return;var strip=document.createElement('div');strip.className='tdp-party-strip';strip.innerHTML='<div class="tdp-party-copy"><div class="tdp-party-label">⚔ Groepsquest</div><div class="tdp-party-sub">'+esc(people.map(function(p){return p.name;}).join(' & '))+'</div></div><div class="tdp-party-avatars">'+avatarStack(q,'tdp-party-avatar')+'</div>';anchor.parentNode.insertBefore(strip,anchor.nextSibling);}

  function hookDetail(){if(detailTimer||detailObserver)return;var tries=0;detailTimer=setInterval(function(){tries++;if(window.TaskDetailPopup&&typeof window.TaskDetailPopup.open==='function'&&!window.TaskDetailPopup.__partyActiveWrapped){var orig=window.TaskDetailPopup.open;window.TaskDetailPopup.open=function(id){openTaskId=id;var r=orig.apply(this,arguments);setTimeout(decorateDetail,0);setTimeout(decorateDetail,100);return r;};window.TaskDetailPopup.__partyActiveWrapped=true;clearInterval(detailTimer);detailTimer=null;}else if(tries>80){clearInterval(detailTimer);detailTimer=null;}},100);detailObserver=new MutationObserver(function(){if(openTaskId)setTimeout(decorateDetail,0);});if(document.body)detailObserver.observe(document.body,{childList:true,subtree:true});else window.addEventListener('load',function(){if(document.body&&detailObserver)detailObserver.observe(document.body,{childList:true,subtree:true});},{once:true});}
  function hookQueue(){if(queueTimer)return;document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('#party-quest-invite-modal [data-yes],#party-quest-invite-modal [data-no]');if(!b||!window.PartyQuestInvites||typeof window.PartyQuestInvites.pending!=='function')return;if(window.PartyQuestInvites.pending().length>1)reopenQueue=true;},true);queueTimer=setInterval(function(){if(!reopenQueue)return;var p=window.PartyQuestInvites&&window.PartyQuestInvites.pending?window.PartyQuestInvites.pending():[];if(p.length&&!document.getElementById('party-quest-invite-modal')){reopenQueue=false;setTimeout(function(){if(window.PartyQuestInvites)window.PartyQuestInvites.open();},40);}else if(!p.length)reopenQueue=false;},120);}

  function start(){
    var r=repo();if(!r||typeof r.subscribe!=='function')return false;
    if(repoUnsubscribe&&boundRepo===r)return true;
    if(repoUnsubscribe){try{repoUnsubscribe();}catch(e){}repoUnsubscribe=null;}
    boundRepo=r;var generation=++subscriptionGeneration;
    repoUnsubscribe=r.subscribe(function(list,meta){refresh(list,meta,generation);});
    if(typeof r.start==='function')r.start();
    return true;
  }
  function stop(){subscriptionGeneration++;if(repoUnsubscribe){try{repoUnsubscribe();}catch(e){}repoUnsubscribe=null;}boundRepo=null;lastIdentity=null;clearProjection('stopped');}
  function status(){var c=context();return{version:VERSION,ready:!!repoUnsubscribe,uid:c&&c.uid||null,householdId:c&&c.householdId||null,revision:c&&c.revision||0,count:active.length,repository:boundRepo&&boundRepo.version||null};}

  document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('#tch-party-quest');if(!b||!active.length)return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();open();},true);
  hookDetail();hookQueue();
  window.PartyQuestActiveView={version:VERSION,open:open,list:function(){return active.slice();},start:start,stop:stop,status:status,endQuest:end,leaveQuest:leave};
  var tries=0;startTimer=setInterval(function(){tries++;if(start()||tries>120){clearInterval(startTimer);startTimer=null;}},100);
})();
