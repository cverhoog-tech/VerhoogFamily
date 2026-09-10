'use strict';
// ============================================================
// CLEANING HELP REQUEST UI v0.1.0
// Recipient-side accept/decline card for an ad-hoc per-occurrence help
// request (STEP 14 Blok 2.4, overname-hulp). The requester's own entry
// point lives in cleaningExceptionTaskUi.js's 'Vraag hulp' option; this
// file only renders and resolves the recipient's side, since the recipient
// has no Task of their own for the occurrence until they accept.
// Never auto-accepts. Declining is always available and changes nothing
// else about the occurrence.
// ============================================================
(function(){
  if(window.CleaningHelpRequestUi)return;

  var VERSION='0.1.0';
  var state={observer:null,queued:false,busyId:null};

  function text(value){return String(value==null?'':value).trim();}
  function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function repository(){return window.CleaningHouseholdRepository||null;}
  function contextSnapshot(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(error){return null;}}
  function currentUid(){var ctx=contextSnapshot();return text(ctx&&ctx.uid);}
  function toast(message){if(typeof window.showToast==='function')window.showToast(message);}

  function memberName(uid){
    try{
      var bridge=window.HouseholdIdentityFirebaseBridge,rows=bridge&&bridge.getMembers?bridge.getMembers():[];
      var found=(Array.isArray(rows)?rows:[]).find(function(row){return text(row&&row.uid)===text(uid);});
      return found?text(found.displayName||found.name)||'Gezinslid':'Gezinslid';
    }catch(error){return'Gezinslid';}
  }

  function roomName(data,roomId){var room=data.rooms&&data.rooms[roomId];return room&&room.name?text(room.name):'Ruimte';}

  function pendingRequestsForMe(){
    var repo=repository(),snap=repo&&repo.snapshot?repo.snapshot():null,data=snap&&snap.data||{},uid=currentUid();
    if(!uid)return[];
    var occurrences=data.occurrences||{};
    return Object.keys(occurrences).map(function(id){return Object.assign({id:id},occurrences[id]||{});}).filter(function(row){
      var request=row&&row.helpRequest;
      return row&&request&&typeof request==='object'&&text(request.status)==='PENDING'&&text(request.toUid)===uid&&row.status!=='CANCELLED'&&row.status!=='SKIPPED'&&row.status!=='COMPLETED';
    }).map(function(row){return{occurrence:row,data:data};});
  }

  function ensureStyle(){
    if(document.getElementById('cleaning-help-request-ui-style'))return;
    var style=document.createElement('style');
    style.id='cleaning-help-request-ui-style';
    style.textContent='\n'
      +'#screen-cleaning .cleaning-help-request-card{display:grid;gap:9px;padding:14px 15px;margin:0 0 12px;border-radius:18px;border:1px solid color-mix(in srgb,var(--cleaning-accent) 30%,var(--cleaning-border));background:color-mix(in srgb,var(--cleaning-accent) 9%,var(--cleaning-surface));box-shadow:0 8px 24px rgba(31,25,55,.06)}\n'
      +'#screen-cleaning .cleaning-help-request-card strong{font-size:13px;color:var(--cleaning-text)}\n'
      +'#screen-cleaning .cleaning-help-request-card p{margin:0;font-size:11px;line-height:1.5;color:var(--cleaning-muted);font-weight:750}\n'
      +'#screen-cleaning .cleaning-help-request-actions{display:flex;gap:8px;flex-wrap:wrap}\n'
      +'#screen-cleaning .cleaning-help-request-actions button{flex:1;min-width:120px;min-height:44px;border-radius:13px;border:1px solid var(--cleaning-border);font:inherit;font-size:12px;font-weight:950;cursor:pointer}\n'
      +'#screen-cleaning .cleaning-help-request-accept{background:var(--cleaning-accent);color:#fff;border-color:transparent}\n'
      +'#screen-cleaning .cleaning-help-request-decline{background:var(--cleaning-surface);color:var(--cleaning-text)}\n'
      +'#screen-cleaning .cleaning-help-request-actions button:disabled{opacity:.5;cursor:default}\n';
    document.head.appendChild(style);
  }

  function cardHtml(entry){
    var occurrence=entry.occurrence,data=entry.data,request=occurrence.helpRequest,busy=state.busyId===occurrence.id;
    return '<section class="cleaning-help-request-card" data-cleaning-help-request-card="'+esc(occurrence.id)+'">'
      +'<strong>🤝 '+esc(memberName(request.fromUid))+' vraagt jouw hulp</strong>'
      +'<p>'+esc(roomName(data,occurrence.roomId))+' · '+esc(Number(occurrence.estimatedMinutes)||0)+' min. Als je accepteert, help je alleen mee met deze ene beurt; er verandert niets aan de vaste toewijzing.</p>'
      +'<div class="cleaning-help-request-actions">'
        +'<button type="button" class="cleaning-help-request-decline" data-cleaning-help-request-decline="'+esc(occurrence.id)+'"'+(busy?' disabled':'')+'>Afwijzen</button>'
        +'<button type="button" class="cleaning-help-request-accept" data-cleaning-help-request-accept="'+esc(occurrence.id)+'"'+(busy?' disabled':'')+'>'+(busy?'Bezig…':'Accepteren')+'</button>'
      +'</div></section>';
  }

  function decorate(){
    state.queued=false;ensureStyle();
    var screen=document.getElementById('screen-cleaning');
    if(!screen)return;
    var panel=screen.querySelector('.cleaning-panel');
    if(!panel)return;
    var entries=pendingRequestsForMe();
    var existing=panel.querySelector('[data-cleaning-help-request-inbox]');
    if(!entries.length){if(existing)existing.remove();return;}
    var html=entries.map(cardHtml).join('');
    if(!existing){
      var holder=document.createElement('div');
      holder.setAttribute('data-cleaning-help-request-inbox','1');
      holder.innerHTML=html;
      panel.insertBefore(holder,panel.firstChild);
    }else if(existing.dataset.signature!==html){
      existing.innerHTML=html;
    }
    var inbox=panel.querySelector('[data-cleaning-help-request-inbox]');
    if(inbox)inbox.dataset.signature=html;
  }

  function queue(){if(state.queued)return;state.queued=true;(window.requestAnimationFrame||function(callback){return window.setTimeout(callback,0);})(decorate);}

  function respond(occurrenceId,action){
    if(state.busyId)return;
    var runtime=window.CleaningExceptionRuntime;
    if(!runtime||typeof runtime.respondToHelpRequest!=='function'){toast('Hulpverzoeken zijn nog niet beschikbaar.');return;}
    state.busyId=occurrenceId;queue();
    runtime.respondToHelpRequest(occurrenceId,action).then(function(){
      state.busyId=null;queue();
      toast(action==='ACCEPT_HELP'?'Je helpt mee met deze beurt ✓':'Hulpverzoek afgewezen.');
    }).catch(function(error){
      state.busyId=null;queue();
      toast(runtime.userMessage?runtime.userMessage(error):(text(error&&error.message)||'Actie mislukt.'));
    });
  }

  function onClick(event){
    var target=event.target,closest=target&&target.closest?target.closest.bind(target):null;
    if(!closest)return;
    var accept=closest('[data-cleaning-help-request-accept]');
    if(accept&&!accept.disabled){event.preventDefault();respond(text(accept.getAttribute('data-cleaning-help-request-accept')),'ACCEPT_HELP');return;}
    var decline=closest('[data-cleaning-help-request-decline]');
    if(decline&&!decline.disabled){event.preventDefault();respond(text(decline.getAttribute('data-cleaning-help-request-decline')),'DECLINE_HELP');}
  }

  function start(){
    if(window.__cleaningHelpRequestUiStarted)return;
    window.__cleaningHelpRequestUiStarted=true;
    ensureStyle();
    document.addEventListener('click',onClick,true);
    var target=document.getElementById('screen-cleaning')||document.documentElement;
    if(typeof MutationObserver!=='undefined'&&target){
      state.observer=new MutationObserver(queue);
      state.observer.observe(target,{childList:true,subtree:true});
    }
    window.addEventListener('familyapp:cleaning-repository',queue);
    window.addEventListener('familyapp:cleaning-exception',queue);
    window.addEventListener('familyapp:household-context',queue);
    queue();
  }

  window.CleaningHelpRequestUi={version:VERSION,start:start,_pendingRequestsForMe:pendingRequestsForMe};
  start();
})();
