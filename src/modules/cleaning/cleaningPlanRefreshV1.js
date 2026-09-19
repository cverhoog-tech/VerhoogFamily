'use strict';
// ============================================================
// CLEANING PLAN REFRESH V1.1
// The current rooms + routines are the source of truth. The Weekplan button
// explicitly runs the canonical stale-source sanitizer and active-plan
// reconciler pipeline, instead of only trying to append missing work.
// ============================================================
(function(){
  if(window.CleaningPlanRefreshV1)return;

  var VERSION='1.1.0';
  var state={busy:false,subscribed:false,lastError:null};
  var DAY_MS=86400000;

  function text(v){return String(v==null?'':v).trim();}
  function clone(v){if(v===undefined)return undefined;try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function repo(){return window.CleaningV2Repository||window.CleaningHouseholdRepository||null;}
  function snap(){var r=repo();try{return r&&r.snapshot?r.snapshot():null;}catch(e){return null;}}
  function context(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(e){return null;}}
  function db(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}}
  function toast(m){if(typeof window.showToast==='function')window.showToast(m);else try{console.info('[CleaningPlanRefresh]',m);}catch(e){}}
  function now(){return Date.now();}
  function safe(v){return text(v).replace(/[.#$\[\]\/\u0000-\u001F\u007F]/g,'_');}
  function weekWindow(){var d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return{startAt:d.getTime(),endAt:d.getTime()+7*DAY_MS};}
  function currentPlan(data){var range=weekWindow(),id='week_'+range.startAt+'_'+range.endAt,row=data&&data.plans&&data.plans[id];return row?Object.assign({id:id},row):null;}
  function refreshablePlan(plan){var status=text(plan&&plan.status).toUpperCase();return !!plan&&['ACTIVE','PROPOSED','PARTIALLY_ACCEPTED'].indexOf(status)>=0;}

  function forceRender(){
    try{window.dispatchEvent(new CustomEvent('familyapp:cleaning-plan-refresh',{detail:{at:now()}}));}catch(e){}
    try{if(window.CleaningV2Ui&&typeof window.CleaningV2Ui.render==='function')window.CleaningV2Ui.render();}catch(e){}
    schedulePatch();
  }

  function canonicalRefresh(plan){
    var sanitizer=window.CleaningPlanSanitizer;
    if(sanitizer&&typeof sanitizer.refreshPlan==='function'){
      return sanitizer.refreshPlan(plan.id).then(function(result){return{mode:'updated',result:result,owner:'sanitizer'};});
    }
    var reconciler=window.CleaningActivePlanReconciler;
    if(reconciler&&typeof reconciler.reconcilePlan==='function'){
      return reconciler.reconcilePlan(plan.id).then(function(result){return{mode:'updated',result:result,owner:'reconciler-fallback'};});
    }
    return Promise.reject(new Error('Werkplan synchronisatie is nog niet geladen.'));
  }

  function refreshWorkplan(){
    if(state.busy)return Promise.resolve(null);
    state.busy=true;patchPlanButton();
    var r=repo(),s=snap(),data=s&&s.data||{},plan=currentPlan(data),work;
    if(r===window.CleaningV2Repository&&r&&typeof r.generateWeekPlan==='function')work=r.generateWeekPlan().then(function(result){return{mode:plan?'updated':'generated',result:result,owner:'v2-repository'};});
    else if(plan&&refreshablePlan(plan))work=canonicalRefresh(plan);
    else if(r&&typeof r.generateWeekPlan==='function')work=r.generateWeekPlan().then(function(result){return{mode:'generated',result:result,owner:'repository'};});
    else work=Promise.reject(new Error('Werkplan is nog niet beschikbaar.'));

    return Promise.resolve(work).then(function(result){
      var empty=result&&result.result&&result.result.empty;
      state.lastError=null;
      forceRender();
      toast(empty?'Er zijn nu geen routines om in te plannen.':(result&&result.mode==='updated'?'Werkplan opnieuw opgebouwd uit je huidige kamers en routines ✓':'Werkplan staat klaar ✓'));
      return result;
    }).catch(function(error){
      state.lastError=text(error&&error.message)||String(error);
      toast(state.lastError||'Werkplan kon niet worden bijgewerkt.');
      throw error;
    }).finally(function(){state.busy=false;forceRender();});
  }

  function refreshCurrentPlanSilently(){
    var s=snap(),plan=currentPlan(s&&s.data||{});
    if(!refreshablePlan(plan))return Promise.resolve(null);
    return canonicalRefresh(plan).then(function(result){forceRender();return result;}).catch(function(error){state.lastError=text(error&&error.message)||String(error);return null;});
  }

  function patchPlanButton(){
    var s=snap(),plan=currentPlan(s&&s.data||{}),hasPlan=!!plan;
    document.querySelectorAll('[data-cv2-plan-generate]').forEach(function(button){
      button.disabled=!!state.busy;
      button.textContent=state.busy?(hasPlan?'Werkplan bijwerken…':'Werkplan maken…'):(hasPlan?'Werkplan bijwerken':'Maak werkplan');
      button.setAttribute('aria-label',hasPlan?'Werkplan opnieuw opbouwen uit de huidige kamers en routines':'Nieuw werkplan maken');
      button.setAttribute('data-cleaning-refresh-owner','current-sources');
    });
  }

  function routineRowActions(){
    var s=snap(),data=s&&s.data||{};
    document.querySelectorAll('#cleaning-v2-sheet .cv2-routines > button[data-cv2-routine-edit]').forEach(function(row){
      var id=text(row.getAttribute('data-cv2-routine-edit'));if(!id)return;
      var existing=row.nextElementSibling;
      if(existing&&existing.getAttribute('data-clpr-actions')===id){updateActionCopy(existing,data.routines&&data.routines[id]);return;}
      var actions=document.createElement('div');actions.className='clpr-routine-actions';actions.setAttribute('data-clpr-actions',id);
      actions.innerHTML='<button type="button" data-clpr-pause="'+id+'"></button><button type="button" class="danger" data-clpr-delete="'+id+'">Verwijderen</button>';
      row.insertAdjacentElement('afterend',actions);updateActionCopy(actions,data.routines&&data.routines[id]);
    });
  }
  function updateActionCopy(actions,routine){var paused=!!(routine&&routine.paused===true),btn=actions&&actions.querySelector('[data-clpr-pause]');if(btn)btn.textContent=paused?'Hervatten':'Pauzeren';if(actions)actions.classList.toggle('is-paused',paused);}

  function ensureStyle(){
    if(document.getElementById('cleaning-plan-refresh-v1-style'))return;
    var style=document.createElement('style');style.id='cleaning-plan-refresh-v1-style';style.textContent=''
      +'#cleaning-v2-sheet .clpr-routine-actions{display:flex;justify-content:flex-end;gap:7px;margin:-2px 2px 8px 44px}'
      +'#cleaning-v2-sheet .clpr-routine-actions button{min-height:30px;padding:0 10px;border:1px solid var(--c-border);border-radius:999px;background:var(--c-bg2);color:var(--c-text2);font:inherit;font-size:10px;font-weight:800}'
      +'#cleaning-v2-sheet .clpr-routine-actions button.danger{color:#b2504c;border-color:rgba(178,80,76,.22);background:rgba(178,80,76,.06)}';
    document.head.appendChild(style);
  }

  function pauseRoutine(id){
    var ctx=context(),database=db(),s=snap(),row=s&&s.data&&s.data.routines&&s.data.routines[id];
    if(!ctx||!ctx.householdId||!ctx.uid||!database||!row)return Promise.reject(new Error('Routine kon niet worden aangepast.'));
    var paused=row.paused===true,timestamp=now();
    return database.ref('families/'+ctx.householdId+'/cleaning/routines/'+safe(id)).update({paused:!paused,updatedAt:timestamp,updatedByUid:ctx.uid}).then(function(){
      return new Promise(function(resolve){setTimeout(resolve,80);});
    }).then(refreshCurrentPlanSilently).then(function(){toast(paused?'Routine hervat ✓':'Routine gepauzeerd ✓');schedulePatch();});
  }

  function deleteRoutine(id){
    var r=repo();if(!r||typeof r.removeRoutineItem!=='function')return Promise.reject(new Error('Routine verwijderen is niet beschikbaar.'));
    return r.removeRoutineItem(id).then(function(){return new Promise(function(resolve){setTimeout(resolve,80);});}).then(refreshCurrentPlanSilently).then(function(){toast('Routine verwijderd en werkplan bijgewerkt');schedulePatch();});
  }

  function schedulePatch(){ensureStyle();[0,40,120,260].forEach(function(delay){setTimeout(function(){patchPlanButton();routineRowActions();},delay);});}

  document.addEventListener('click',function(event){
    var plan=event.target&&event.target.closest?event.target.closest('[data-cv2-plan-generate]'):null;
    if(plan){event.preventDefault();event.stopImmediatePropagation();refreshWorkplan().catch(function(){});return;}
    var pause=event.target&&event.target.closest?event.target.closest('[data-clpr-pause]'):null;
    if(pause){event.preventDefault();event.stopPropagation();pauseRoutine(text(pause.getAttribute('data-clpr-pause'))).catch(function(error){toast(text(error&&error.message)||'Pauzeren mislukt');});return;}
    var del=event.target&&event.target.closest?event.target.closest('[data-clpr-delete]'):null;
    if(del){event.preventDefault();event.stopPropagation();if(!confirm('Deze routine verwijderen? Het huidige werkplan wordt meteen bijgewerkt.'))return;deleteRoutine(text(del.getAttribute('data-clpr-delete'))).catch(function(error){toast(text(error&&error.message)||'Verwijderen mislukt');});return;}
    if(event.target&&event.target.closest&&event.target.closest('[data-cv2-room],[data-cv2-room-edit],[data-cv2-routine-edit],[data-cv2-routine-new],[data-cv2-tab]'))schedulePatch();
  },true);

  function attach(){
    var r=repo();if(!r||typeof r.subscribe!=='function')return false;if(state.subscribed)return true;
    state.subscribed=true;r.subscribe(function(snapshot){if(snapshot&&snapshot.ready===true)schedulePatch();});schedulePatch();return true;
  }
  var tries=0,timer=setInterval(function(){tries++;if(attach()||tries>240)clearInterval(timer);},100);
  window.addEventListener('familyapp:household-context',function(){state.subscribed=false;attach();schedulePatch();});

  window.CleaningPlanRefreshV1={version:VERSION,refresh:refreshWorkplan,reconcile:refreshCurrentPlanSilently,status:function(){return clone({version:VERSION,busy:state.busy,lastError:state.lastError});}};
})();
