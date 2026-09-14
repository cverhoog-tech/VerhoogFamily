'use strict';
// ============================================================
// CLEANING PLAN REFRESH V1
// Keeps active Cleaning work aligned with current rooms/routines and makes
// the workplan action reusable. Also adds quick pause/delete routine actions.
// ============================================================
(function(){
  if(window.CleaningPlanRefreshV1)return;

  var VERSION='1.0.0';
  var state={busy:false,subscribed:false,reconcileQueued:false,lastError:null};
  var DAY_MS=86400000;

  function text(v){return String(v==null?'':v).trim();}
  function clone(v){if(v===undefined)return undefined;try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function repo(){return window.CleaningHouseholdRepository||window.CleaningV2Repository||null;}
  function snap(){var r=repo();try{return r&&r.snapshot?r.snapshot():null;}catch(e){return null;}}
  function context(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(e){return null;}}
  function db(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}}
  function toast(m){if(typeof window.showToast==='function')window.showToast(m);else try{console.info('[CleaningPlanRefresh]',m);}catch(e){}}
  function now(){return Date.now();}
  function safe(v){return text(v).replace(/[.#$\[\]\/\u0000-\u001F\u007F]/g,'_');}
  function hash(v){var h=2166136261,s=String(v||'');for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(36);}
  function weekWindow(){var d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return{startAt:d.getTime(),endAt:d.getTime()+7*DAY_MS};}
  function currentPlan(data){var range=weekWindow(),id='week_'+range.startAt+'_'+range.endAt,row=data&&data.plans&&data.plans[id];return row?Object.assign({id:id},row):null;}
  function completed(row){var a=text(row&&row.status).toUpperCase(),b=text(row&&row.assignmentStatus).toUpperCase();return a==='COMPLETED'||b==='COMPLETED';}
  function closed(row){var a=text(row&&row.status).toUpperCase(),b=text(row&&row.assignmentStatus).toUpperCase();return completed(row)||a==='CANCELLED'||a==='SKIPPED'||b==='SKIPPED';}
  function roomActive(data,id){var row=data&&data.rooms&&data.rooms[text(id)];return !!(row&&typeof row==='object'&&row.active!==false);}
  function routineActive(data,id,roomId){var row=data&&data.routines&&data.routines[text(id)];return !!(row&&typeof row==='object'&&row.active!==false&&row.paused!==true&&text(row.roomId)===text(roomId)&&roomActive(data,roomId));}
  function occurrenceRoutineId(item){return text(item&&(item.routineItemId||item.id));}
  function taskIdFor(row){return text(row&&row.projections&&row.projections.taskId)||('cleaning_v2_'+hash(row&&row.id));}
  function eventKeyFor(row){var id=text(row&&row.projections&&row.projections.calendarEventId)||taskIdFor(row);return id?'id_'+safe(id):'';}
  function assignmentUid(row){return text(row&&Array.isArray(row.assignmentUids)&&row.assignmentUids[0]);}
  function memberName(uid){try{var bridge=window.HouseholdIdentityFirebaseBridge,rows=bridge&&bridge.getMembers?bridge.getMembers():[];var found=(Array.isArray(rows)?rows:[]).find(function(m){return text(m&&(m.uid||m.id))===text(uid);});return text(found&&(found.displayName||found.name))||'Gezinslid';}catch(e){return'Gezinslid';}}

  function taskSubtasks(row,list){
    return list.map(function(item,index){
      var id=occurrenceRoutineId(item)||('item_'+index),done=item&&item.completed===true;
      return{id:safe(id),title:text(item&&item.title)||'Schoonmaakonderdeel',done:done,completed:done,sourceRoutineItemId:id,cleaningOccurrenceId:row.id,estimatedMinutes:Math.max(1,Number(item&&item.estimatedMinutes)||10),priority:text(item&&item.priority)||'NORMAL'};
    });
  }

  function cancelOccurrence(updates,row,ctx,timestamp){
    var id=text(row&&row.id);if(!id)return;
    updates['cleaning/occurrences/'+safe(id)+'/status']='CANCELLED';
    updates['cleaning/occurrences/'+safe(id)+'/assignmentStatus']='SKIPPED';
    updates['cleaning/occurrences/'+safe(id)+'/cancelledAt']=timestamp;
    updates['cleaning/occurrences/'+safe(id)+'/cancelledByUid']=ctx.uid;
    updates['cleaning/occurrences/'+safe(id)+'/updatedAt']=timestamp;
    updates['cleaning/occurrences/'+safe(id)+'/updatedByUid']=ctx.uid;
    var taskId=taskIdFor(row),eventKey=eventKeyFor(row);
    if(taskId)updates['tasks/'+safe(taskId)]=null;
    if(eventKey)updates['calendarEvents/'+eventKey]=null;
  }

  function reconcileInactive(){
    var r=repo(),s=snap(),ctx=context(),database=db();
    if(!r||!s||s.ready!==true||!s.data||!ctx||ctx.ready!==true||!ctx.uid||!ctx.householdId||!database)return Promise.resolve({changed:false});
    var data=s.data,updates={},cancelled={},timestamp=now();
    Object.keys(data.occurrences||{}).forEach(function(id){
      var original=data.occurrences[id];if(!original||typeof original!=='object')return;
      var row=Object.assign({id:id},original);if(closed(row))return;
      if(!roomActive(data,row.roomId)){cancelOccurrence(updates,row,ctx,timestamp);cancelled[id]=true;return;}
      var list=Array.isArray(row.checklist)?row.checklist:[];
      var kept=list.filter(function(item){return routineActive(data,occurrenceRoutineId(item),row.roomId);});
      if(kept.length===list.length)return;
      if(!kept.length){cancelOccurrence(updates,row,ctx,timestamp);cancelled[id]=true;return;}
      var minutes=kept.reduce(function(sum,item){return sum+Math.max(1,Number(item&&item.estimatedMinutes)||10);},0),allDone=kept.every(function(item){return item&&item.completed===true;}),taskId=taskIdFor(row),eventKey=eventKeyFor(row),subs=taskSubtasks(row,kept),doneCount=subs.filter(function(item){return item.done;}).length;
      updates['cleaning/occurrences/'+safe(id)+'/checklist']=kept;
      updates['cleaning/occurrences/'+safe(id)+'/routineItemIds']=kept.map(occurrenceRoutineId);
      updates['cleaning/occurrences/'+safe(id)+'/estimatedMinutes']=minutes;
      updates['cleaning/occurrences/'+safe(id)+'/updatedAt']=timestamp;
      updates['cleaning/occurrences/'+safe(id)+'/updatedByUid']=ctx.uid;
      if(allDone){updates['cleaning/occurrences/'+safe(id)+'/status']='COMPLETED';updates['cleaning/occurrences/'+safe(id)+'/assignmentStatus']='COMPLETED';}
      if(taskId){
        updates['tasks/'+safe(taskId)+'/subtasks']=subs;
        updates['tasks/'+safe(taskId)+'/description']=subs.length+' '+(subs.length===1?'onderdeel':'onderdelen')+' · '+minutes+' min';
        updates['tasks/'+safe(taskId)+'/progress']=subs.length?Math.round(doneCount/subs.length*100):0;
        updates['tasks/'+safe(taskId)+'/done']=allDone;
        updates['tasks/'+safe(taskId)+'/status']=allDone?'done':'open';
        updates['tasks/'+safe(taskId)+'/updatedAt']=timestamp;
        updates['tasks/'+safe(taskId)+'/updatedByUid']=ctx.uid;
      }
      if(eventKey){updates['calendarEvents/'+eventKey+'/description']=minutes+' min · '+subs.map(function(item){return item.title;}).join(', ');updates['calendarEvents/'+eventKey+'/completed']=allDone;updates['calendarEvents/'+eventKey+'/updatedAt']=timestamp;updates['calendarEvents/'+eventKey+'/updatedByUid']=ctx.uid;}
    });

    Object.keys(data.plans||{}).forEach(function(planId){
      var plan=data.plans[planId];if(!plan||!Array.isArray(plan.occurrenceIds))return;
      var next=plan.occurrenceIds.filter(function(id){return !cancelled[text(id)];});
      if(next.length!==plan.occurrenceIds.length){updates['cleaning/plans/'+safe(planId)+'/occurrenceIds']=next;updates['cleaning/plans/'+safe(planId)+'/updatedAt']=timestamp;updates['cleaning/plans/'+safe(planId)+'/updatedByUid']=ctx.uid;}
    });

    var keys=Object.keys(updates);if(!keys.length)return Promise.resolve({changed:false});
    return database.ref('families/'+ctx.householdId).update(updates).then(function(){return{changed:true,updateCount:keys.length};});
  }

  function waitTick(){return new Promise(function(resolve){setTimeout(resolve,90);});}
  function refreshWorkplan(){
    if(state.busy)return Promise.resolve(null);state.busy=true;patchPlanButton();
    return reconcileInactive().then(waitTick).then(function(){
      var r=repo(),s=snap(),data=s&&s.data||{},plan=currentPlan(data);
      if(plan&&text(plan.status).toUpperCase()==='ACTIVE'){
        var reconciler=window.CleaningActivePlanReconciler;
        if(reconciler&&typeof reconciler.reconcilePlan==='function')return reconciler.reconcilePlan(plan.id).then(function(result){return{mode:'updated',result:result};});
        return{mode:'updated',result:null};
      }
      if(r&&typeof r.generateWeekPlan==='function')return r.generateWeekPlan().then(function(result){return{mode:'generated',result:result};});
      throw new Error('Werkplan is nog niet beschikbaar.');
    }).then(function(result){
      var empty=result&&result.result&&result.result.empty;
      toast(empty?'Er zijn nu geen routines om in te plannen.':(result&&result.mode==='updated'?'Werkplan bijgewerkt ✓':'Werkplan staat klaar ✓'));
      return result;
    }).catch(function(error){state.lastError=text(error&&error.message)||String(error);toast(state.lastError||'Werkplan kon niet worden bijgewerkt.');throw error;}).finally(function(){state.busy=false;schedulePatch();});
  }

  function patchPlanButton(){
    var s=snap(),plan=currentPlan(s&&s.data||{}),active=plan&&text(plan.status).toUpperCase()==='ACTIVE';
    document.querySelectorAll('[data-cv2-plan-generate]').forEach(function(button){
      button.disabled=!!state.busy;
      button.textContent=state.busy?(active?'Werkplan bijwerken…':'Werkplan maken…'):(active?'Werkplan bijwerken':'Maak werkplan');
      button.setAttribute('aria-label',active?'Werkplan opnieuw controleren en bijwerken':'Nieuw werkplan maken');
    });
  }

  function routineRowActions(){
    var s=snap(),data=s&&s.data||{};
    document.querySelectorAll('#cleaning-v2-sheet .cv2-routines > button[data-cv2-routine-edit]').forEach(function(row){
      var id=text(row.getAttribute('data-cv2-routine-edit'));if(!id)return;
      var existing=row.nextElementSibling;if(existing&&existing.getAttribute('data-clpr-actions')===id){updateActionCopy(existing,data.routines&&data.routines[id]);return;}
      var actions=document.createElement('div');actions.className='clpr-routine-actions';actions.setAttribute('data-clpr-actions',id);
      actions.innerHTML='<button type="button" data-clpr-pause="'+id+'"></button><button type="button" class="danger" data-clpr-delete="'+id+'">Verwijderen</button>';
      row.insertAdjacentElement('afterend',actions);updateActionCopy(actions,data.routines&&data.routines[id]);
    });
  }
  function updateActionCopy(actions,routine){var paused=!!(routine&&routine.paused===true),btn=actions&&actions.querySelector('[data-clpr-pause]');if(btn)btn.textContent=paused?'Hervatten':'Pauzeren';actions&&actions.classList.toggle('is-paused',paused);}

  function ensureStyle(){if(document.getElementById('cleaning-plan-refresh-v1-style'))return;var style=document.createElement('style');style.id='cleaning-plan-refresh-v1-style';style.textContent=''
    +'#cleaning-v2-sheet .clpr-routine-actions{display:flex;justify-content:flex-end;gap:7px;margin:-2px 2px 8px 44px}'
    +'#cleaning-v2-sheet .clpr-routine-actions button{min-height:30px;padding:0 10px;border:1px solid var(--c-border);border-radius:999px;background:var(--c-bg2);color:var(--c-text2);font:inherit;font-size:10px;font-weight:800}'
    +'#cleaning-v2-sheet .clpr-routine-actions button.danger{color:#b2504c;border-color:rgba(178,80,76,.22);background:rgba(178,80,76,.06)}'
    +'#cleaning-v2-sheet .clpr-routine-actions.is-paused+*{}';document.head.appendChild(style);}

  function pauseRoutine(id){
    var ctx=context(),database=db(),s=snap(),row=s&&s.data&&s.data.routines&&s.data.routines[id];if(!ctx||!ctx.householdId||!ctx.uid||!database||!row)return Promise.reject(new Error('Routine kon niet worden aangepast.'));
    var paused=row.paused===true,timestamp=now();return database.ref('families/'+ctx.householdId+'/cleaning/routines/'+safe(id)).update({paused:!paused,updatedAt:timestamp,updatedByUid:ctx.uid}).then(function(){return reconcileInactive();}).then(function(){toast(paused?'Routine hervat ✓':'Routine gepauzeerd ✓');schedulePatch();});
  }
  function deleteRoutine(id){var r=repo();if(!r||typeof r.removeRoutineItem!=='function')return Promise.reject(new Error('Routine verwijderen is niet beschikbaar.'));return r.removeRoutineItem(id).then(function(){return reconcileInactive();}).then(function(){toast('Routine verwijderd');schedulePatch();});}

  function schedulePatch(){
    ensureStyle();
    [0,40,120].forEach(function(delay){setTimeout(function(){patchPlanButton();routineRowActions();},delay);});
  }
  function queueReconcile(){if(state.reconcileQueued)return;state.reconcileQueued=true;setTimeout(function(){state.reconcileQueued=false;reconcileInactive().catch(function(error){state.lastError=text(error&&error.message)||String(error);});},30);}

  document.addEventListener('click',function(event){
    var plan=event.target&&event.target.closest?event.target.closest('[data-cv2-plan-generate]'):null;
    if(plan){event.preventDefault();event.stopImmediatePropagation();refreshWorkplan().catch(function(){});return;}
    var pause=event.target&&event.target.closest?event.target.closest('[data-clpr-pause]'):null;
    if(pause){event.preventDefault();event.stopPropagation();pauseRoutine(text(pause.getAttribute('data-clpr-pause'))).catch(function(error){toast(text(error&&error.message)||'Pauzeren mislukt');});return;}
    var del=event.target&&event.target.closest?event.target.closest('[data-clpr-delete]'):null;
    if(del){event.preventDefault();event.stopPropagation();if(!confirm('Deze routine verwijderen? Open schoonmaaktaken voor deze routine worden ook bijgewerkt.'))return;deleteRoutine(text(del.getAttribute('data-clpr-delete'))).catch(function(error){toast(text(error&&error.message)||'Verwijderen mislukt');});return;}
    if(event.target&&event.target.closest&&event.target.closest('[data-cv2-room],[data-cv2-room-edit],[data-cv2-routine-edit],[data-cv2-routine-new],[data-cv2-tab]'))schedulePatch();
  },true);

  function attach(){
    var r=repo();if(!r||typeof r.subscribe!=='function')return false;if(state.subscribed)return true;
    state.subscribed=true;r.subscribe(function(snapshot){if(snapshot&&snapshot.ready===true){queueReconcile();schedulePatch();}});schedulePatch();return true;
  }
  var tries=0,timer=setInterval(function(){tries++;if(attach()||tries>240)clearInterval(timer);},100);
  window.addEventListener('familyapp:household-context',function(){state.subscribed=false;attach();schedulePatch();});

  window.CleaningPlanRefreshV1={version:VERSION,refresh:refreshWorkplan,reconcile:reconcileInactive,status:function(){return clone({version:VERSION,busy:state.busy,lastError:state.lastError});}};
})();
