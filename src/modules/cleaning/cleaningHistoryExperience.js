'use strict';
// ============================================================
// CLEANING HISTORY EXPERIENCE v0.1.0
// Read-only room/routine history derived exclusively from completionLogs.
// No second history store, no Firebase writes, no occurrence mutation.
// ============================================================
(function(){
  if(window.CleaningHistoryExperience)return;

  var VERSION='0.1.0';
  var state={repository:null,observer:null,queued:false,lastSignature:null};

  function text(value){return String(value==null?'':value).trim();}
  function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function at(log){return Number(log&&(log.completedAt||log.finalizedAt||log.reopenedAt||log.createdAt))||0;}
  function root(){
    var snap=state.repository;
    if(!snap){try{var repo=window.CleaningHouseholdRepository;snap=repo&&repo.snapshot?repo.snapshot():null;}catch(e){}}
    return snap&&snap.data||{};
  }
  function roomName(data,id){var room=data.rooms&&data.rooms[id];return text(room&&room.name)||'Verwijderde ruimte';}
  function routineName(data,id,fallback){var row=data.routines&&data.routines[id];return text(row&&row.title)||text(fallback)||'Schoonmaakroutine';}
  function relative(value){
    var timestamp=Number(value)||0;if(!timestamp)return'Nog nooit';
    var d=new Date(timestamp),today=new Date();today.setHours(0,0,0,0);var day=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();var diff=Math.round((day-today.getTime())/86400000);
    if(diff===0)return'Vandaag';if(diff===-1)return'Gisteren';
    try{return d.toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:d.getFullYear()!==today.getFullYear()?'numeric':undefined});}catch(e){return'';}
  }
  function outcomeLabel(value){var status=text(value).toUpperCase();if(status==='COMPLETED')return'Afgerond';if(status==='CARRY_FORWARD')return'Doorgeschoven';if(status==='SKIP'||status==='SKIPPED')return'Overgeslagen';if(status==='REOPENED')return'Heropend';if(status==='PARTIAL')return'Deels gedaan';return status||'Bijgewerkt';}
  function memberName(uid){
    try{var bridge=window.HouseholdIdentityFirebaseBridge,rows=bridge&&bridge.getMembers?bridge.getMembers():[],row=(Array.isArray(rows)?rows:[]).find(function(member){return text(member&&(member.uid||member.id))===text(uid);});return text(row&&(row.displayName||row.name))||'Gezinslid';}catch(e){return'Gezinslid';}
  }
  function logs(data){
    var rows=data.completionLogs||{};
    return Object.keys(rows).map(function(id){return Object.assign({id:id,_at:at(rows[id])},rows[id]||{});}).filter(function(row){return row._at>0;}).sort(function(a,b){return b._at-a._at;});
  }
  function routineTouches(data,roomLogs){
    var map={};
    roomLogs.forEach(function(log){
      var remaining=(Array.isArray(log.remainingRoutineItemIds)?log.remainingRoutineItemIds:[]).map(String);
      (Array.isArray(log.checklist)?log.checklist:[]).forEach(function(item){
        var id=text(item&&(item.routineItemId||item.sourceRoutineItemId||item.id));if(!id)return;
        var candidateStatus=item&&item.completed===true?'COMPLETED':(remaining.indexOf(id)>=0?(text(log.outcome).toUpperCase()==='CARRY_FORWARD'?'CARRY_FORWARD':'SKIPPED'):(text(log.status).toUpperCase()||text(log.outcome).toUpperCase()||'PARTIAL'));
        if(!map[id]||log._at>map[id].at)map[id]={id:id,title:routineName(data,id,item&&item.title),at:log._at,status:candidateStatus,byUid:text(log.completedByUid||log.finalizedByUid||log.createdByUid)};
      });
    });
    return Object.keys(map).map(function(id){return map[id];}).sort(function(a,b){return b.at-a.at;});
  }
  function roomRows(data){
    var all=logs(data),byRoom={};
    all.forEach(function(log){var id=text(log.roomId)||'unknown';if(!byRoom[id])byRoom[id]=[];byRoom[id].push(log);});
    return Object.keys(byRoom).map(function(roomId){
      var roomLogs=byRoom[roomId],last=roomLogs[0],monthCutoff=Date.now()-30*86400000;
      return{roomId:roomId,name:roomName(data,roomId),logs:roomLogs,lastAt:last&&last._at||0,lastOutcome:text(last&&(last.outcome||last.status)),activity30:roomLogs.filter(function(log){return log._at>=monthCutoff;}).length,routines:routineTouches(data,roomLogs)};
    }).sort(function(a,b){return b.lastAt-a.lastAt;});
  }

  function ensureStyle(){
    if(document.getElementById('cleaning-history-experience-style'))return;
    var style=document.createElement('style');style.id='cleaning-history-experience-style';style.textContent='\n'
      +'#screen-cleaning .cleaning-history-detail{padding:14px;border:1px solid var(--cleaning-border);border-radius:18px;background:var(--cleaning-surface)}\n'
      +'#screen-cleaning .cleaning-history-detail-head{display:flex;justify-content:space-between;gap:10px;align-items:end;margin-bottom:9px}#screen-cleaning .cleaning-history-detail-head strong{font-size:13px}#screen-cleaning .cleaning-history-detail-head span{font-size:9px;color:var(--cleaning-muted);font-weight:850}\n'
      +'#screen-cleaning .cleaning-history-room{border-top:1px solid var(--cleaning-border)}#screen-cleaning .cleaning-history-room:first-of-type{border-top:0}#screen-cleaning .cleaning-history-room>summary{list-style:none;display:flex;align-items:center;gap:10px;min-height:48px;cursor:pointer}#screen-cleaning .cleaning-history-room>summary::-webkit-details-marker{display:none}\n'
      +'#screen-cleaning .cleaning-history-room-copy{flex:1;min-width:0}#screen-cleaning .cleaning-history-room-copy strong{display:block;font-size:11.5px}#screen-cleaning .cleaning-history-room-copy span{display:block;font-size:9px;color:var(--cleaning-muted);margin-top:2px}#screen-cleaning .cleaning-history-room-count{font-size:9px;font-weight:900;color:var(--cleaning-accent);white-space:nowrap}\n'
      +'#screen-cleaning .cleaning-history-routines{display:grid;gap:6px;padding:0 0 10px 2px}#screen-cleaning .cleaning-history-routine{display:flex;gap:9px;align-items:center;padding:8px 9px;border-radius:11px;background:color-mix(in srgb,var(--cleaning-accent) 4%,var(--cleaning-surface))}#screen-cleaning .cleaning-history-routine>span:first-child{width:7px;height:7px;border-radius:50%;background:var(--cleaning-accent);flex:0 0 auto}.cleaning-history-routine-copy{flex:1;min-width:0}.cleaning-history-routine-copy strong{display:block;font-size:10px}.cleaning-history-routine-copy small{display:block;margin-top:1px;font-size:8.5px;color:var(--cleaning-muted)}#screen-cleaning .cleaning-history-routine-status{font-size:8.5px;font-weight:900;color:var(--cleaning-accent);white-space:nowrap}\n';
    document.head.appendChild(style);
  }
  function markup(data){
    var rooms=roomRows(data);
    if(!rooms.length)return'<section class="cleaning-history-detail" data-cleaning-history-detail><div class="cleaning-history-detail-head"><strong>Geschiedenis per kamer</strong><span>uit completionLogs</span></div><div class="cleaning-overview-empty">Zodra schoonmaakbeurten zijn afgerond of overgeslagen zie je hier de geschiedenis per kamer en routine.</div></section>';
    return'<section class="cleaning-history-detail" data-cleaning-history-detail><div class="cleaning-history-detail-head"><strong>Geschiedenis per kamer</strong><span>'+rooms.length+' '+(rooms.length===1?'kamer':'kamers')+'</span></div>'
      +rooms.map(function(room,index){
        var routineHtml=room.routines.length?room.routines.slice(0,8).map(function(routine){return'<div class="cleaning-history-routine"><span></span><div class="cleaning-history-routine-copy"><strong>'+esc(routine.title)+'</strong><small>'+esc(relative(routine.at))+(routine.byUid?' · '+esc(memberName(routine.byUid)):'')+'</small></div><span class="cleaning-history-routine-status">'+esc(outcomeLabel(routine.status))+'</span></div>';}).join(''):'<div class="cleaning-overview-empty">Geen routine-details beschikbaar in deze oudere log.</div>';
        return'<details class="cleaning-history-room"'+(index===0?' open':'')+'><summary><div class="cleaning-history-room-copy"><strong>'+esc(room.name)+'</strong><span>Laatst '+esc(relative(room.lastAt))+' · '+esc(outcomeLabel(room.lastOutcome))+'</span></div><span class="cleaning-history-room-count">'+room.activity30+'× in 30 dagen</span></summary><div class="cleaning-history-routines">'+routineHtml+'</div></details>';
      }).join('')+'</section>';
  }
  function signature(data){var rows=data.completionLogs||{};return Object.keys(rows).sort().map(function(id){var row=rows[id]||{};return id+':'+at(row)+':'+text(row.status)+':'+text(row.outcome);}).join('|');}
  function decorate(){
    state.queued=false;ensureStyle();var screen=document.getElementById('screen-cleaning');if(!screen)return;
    var active=screen.querySelector('[data-cleaning-tab="overview"].is-active'),overview=screen.querySelector('[data-cleaning-live-overview]');if(!active||!overview)return;
    var data=root(),sig=signature(data),existing=overview.querySelector('[data-cleaning-history-detail]');
    if(existing&&state.lastSignature===sig)return;
    var holder=document.createElement('div');holder.innerHTML=markup(data);var next=holder.firstElementChild;
    if(existing)existing.replaceWith(next);else overview.appendChild(next);
    state.lastSignature=sig;
  }
  function queue(){if(state.queued)return;state.queued=true;(window.requestAnimationFrame||function(cb){return setTimeout(cb,0);})(decorate);}
  function onRepository(event){state.repository=event&&event.detail||null;state.lastSignature=null;queue();}
  function start(){
    if(window.__cleaningHistoryExperienceStarted)return;window.__cleaningHistoryExperienceStarted=true;
    window.addEventListener('familyapp:cleaning-repository',onRepository);
    var target=document.getElementById('screen-cleaning')||document.documentElement;
    if(typeof MutationObserver!=='undefined'&&target){state.observer=new MutationObserver(queue);state.observer.observe(target,{childList:true,subtree:true});}
    queue();
  }
  window.CleaningHistoryExperience={version:VERSION,start:start,_roomRows:roomRows,_routineTouches:routineTouches};
  start();
})();
