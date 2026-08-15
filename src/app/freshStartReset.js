'use strict';
(function(){
  if(window.__familyFreshStartResetV1)return;
  window.__familyFreshStartResetV1=true;

  var TARGET_NAMES=['shane','esra'];
  var BUSY=false;

  function db(){try{return window.fbDb||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
  function familyId(){return window.fbFamilyId||null;}
  function members(){try{if(window.HouseholdIdentityFirebaseBridge&&typeof HouseholdIdentityFirebaseBridge.getMembers==='function')return HouseholdIdentityFirebaseBridge.getMembers()||[];if(window.TaskSharedData&&typeof TaskSharedData.members==='function')return TaskSharedData.members()||[];}catch(e){}return[];}
  function targetMembers(){return members().filter(function(m){return TARGET_NAMES.indexOf(String(m.displayName||m.name||'').trim().toLowerCase())>-1;});}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function toast(msg){try{if(typeof window.showToast==='function')return window.showToast(msg);}catch(e){}console.log(msg);}

  function injectStyle(){
    if(document.getElementById('fresh-start-reset-style'))return;
    var s=document.createElement('style');s.id='fresh-start-reset-style';s.textContent=[
      '.fresh-start-more-btn{border:1.5px dashed rgba(220,38,38,.28)!important;background:linear-gradient(180deg,rgba(254,242,242,.92),rgba(255,255,255,.98))!important;color:#991b1b!important}',
      '[data-theme*="dark"] .fresh-start-more-btn{background:linear-gradient(180deg,#28161b,#1a1115)!important;color:#fecaca!important;border-color:rgba(248,113,113,.32)!important}',
      '.fsr-overlay{position:fixed;inset:0;z-index:12000;background:rgba(7,8,15,.62);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;padding:14px;opacity:0;pointer-events:none;transition:opacity .18s}.fsr-overlay.open{opacity:1;pointer-events:auto}.fsr-sheet{width:min(100%,440px);max-height:90dvh;overflow:auto;background:var(--c-sheet-bg,#fff);color:var(--c-text,#111827);border-radius:24px;padding:18px;box-shadow:0 24px 80px rgba(0,0,0,.35);transform:translateY(16px);transition:transform .18s}.fsr-overlay.open .fsr-sheet{transform:none}.fsr-handle{width:42px;height:4px;border-radius:999px;background:var(--c-border,#ddd);margin:0 auto 16px}.fsr-title{font-size:20px;font-weight:900}.fsr-sub{font-size:12px;line-height:1.5;color:var(--c-text2,#6b7280);margin-top:5px}.fsr-list{margin:16px 0;padding:12px 14px;border-radius:16px;background:var(--c-surface2,#f7f7f7);border:1px solid var(--c-border,#e5e7eb);font-size:12px;line-height:1.65}.fsr-keep{margin-top:10px;padding-top:10px;border-top:1px solid var(--c-border,#e5e7eb);color:var(--c-text2,#6b7280)}.fsr-label{display:block;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--c-text2,#6b7280);margin-bottom:6px}.fsr-input{width:100%;height:44px;border-radius:13px;border:1.5px solid var(--c-border,#ddd);background:var(--c-input-bg,#fff);color:var(--c-text,#111827);padding:0 12px;font-size:16px;font-weight:800;outline:none;text-transform:uppercase}.fsr-input:focus{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.12)}.fsr-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:14px}.fsr-btn{height:44px;border-radius:13px;border:0;font-size:13px;font-weight:900}.fsr-cancel{background:var(--c-surface2,#f3f4f6);color:var(--c-text,#111827)}.fsr-reset{background:linear-gradient(135deg,#b91c1c,#dc2626);color:#fff}.fsr-reset:disabled{opacity:.35}.fsr-status{font-size:11px;color:var(--c-text2,#6b7280);margin-top:10px;min-height:16px}'
    ].join('\n');document.head.appendChild(s);
  }

  function addMoreButton(){
    var grid=document.getElementById('more-grid');if(!grid||grid.querySelector('#fresh-start-more-btn'))return;
    var btn=document.createElement('button');btn.className='more-btn fresh-start-more-btn';btn.id='fresh-start-more-btn';btn.innerHTML='<span style="font-size:22px">🧹</span><span>Verse start</span>';btn.onclick=function(){try{if(typeof window.closeMore==='function')window.closeMore();}catch(e){}open();};grid.appendChild(btn);
  }

  function patchRenderNav(){
    if(typeof window.renderNav!=='function'||window.renderNav.__freshStartWrapped)return;
    var raw=window.renderNav;var wrapped=function(){var out=raw.apply(this,arguments);setTimeout(addMoreButton,0);return out;};wrapped.__freshStartWrapped=true;window.renderNav=wrapped;
  }

  function open(){
    injectStyle();var existing=document.getElementById('fresh-start-reset-overlay');if(existing)existing.remove();
    var targets=targetMembers();var names=targets.length?targets.map(function(m){return m.displayName||m.name||'Gezinslid';}).join(' & '):'Shane & Esra';
    var ov=document.createElement('div');ov.className='fsr-overlay';ov.id='fresh-start-reset-overlay';ov.innerHTML='<div class="fsr-sheet" role="dialog" aria-modal="true"><div class="fsr-handle"></div><div class="fsr-title">🧹 Verse start</div><div class="fsr-sub">Reset de test/progressiedata voor <b>'+esc(names)+'</b>. Accounts en gezinslidmaatschap blijven intact.</div><div class="fsr-list"><b>Wordt gereset</b><br>• alle household taken en subtaken<br>• XP van Shane en Esra naar 0<br>• achievements/unlocks van Shane en Esra<br>• lokale skills + skill logs van Shane en Esra<br><div class="fsr-keep"><b>Blijft behouden</b><br>accounts, household, namen, avatars, recepten, agenda, boodschappen, financiën en instellingen.</div></div><label class="fsr-label" for="fsr-confirm">Typ RESET om te bevestigen</label><input id="fsr-confirm" class="fsr-input" autocomplete="off" autocapitalize="characters" placeholder="RESET"><div class="fsr-actions"><button class="fsr-btn fsr-cancel" id="fsr-cancel">Annuleren</button><button class="fsr-btn fsr-reset" id="fsr-run" disabled>Alles resetten</button></div><div class="fsr-status" id="fsr-status"></div></div>';
    document.body.appendChild(ov);requestAnimationFrame(function(){ov.classList.add('open');});
    var inp=ov.querySelector('#fsr-confirm'),run=ov.querySelector('#fsr-run'),cancel=ov.querySelector('#fsr-cancel');
    inp.oninput=function(){run.disabled=String(inp.value||'').trim().toUpperCase()!=='RESET'||BUSY;};
    cancel.onclick=function(){if(!BUSY)close();};ov.onclick=function(e){if(e.target===ov&&!BUSY)close();};
    run.onclick=function(){if(run.disabled)return;execute(ov,run,inp);};
  }

  function close(){var ov=document.getElementById('fresh-start-reset-overlay');if(!ov)return;ov.classList.remove('open');setTimeout(function(){if(ov.parentNode)ov.parentNode.removeChild(ov);},180);}

  function resetLocalSkills(){
    var defs=Array.isArray(window.SKILL_DEFS)?window.SKILL_DEFS:[];var fresh={Shane:{},Esra:{}};
    defs.forEach(function(def){fresh.Shane[def.id]={xp:0,log:[]};fresh.Esra[def.id]={xp:0,log:[]};});
    try{localStorage.setItem('fam_skills_v1',JSON.stringify(fresh));}catch(e){}
    if(window.skillsData){window.skillsData=fresh;}
  }

  function resetKnownLocalProgress(){
    try{localStorage.setItem('fam_myxp_v1','0');}catch(e){}
    try{localStorage.removeItem('fam_unlocked_badges_v1');}catch(e){}
    try{localStorage.removeItem('fam_streak_v1');}catch(e){}
    try{localStorage.removeItem('fam_streaks_v1');}catch(e){}
    try{localStorage.removeItem('fam_skill_history_v1');}catch(e){}
    try{if(window.AppState&&typeof AppState.get==='function'){var st=AppState.get();if(st){st.tasks=[];if(st.meta)st.meta.lastSaved=new Date().toISOString();localStorage.setItem('familieapp_state_v024',JSON.stringify(st));}}}catch(e){}
    window.myXP=0;window.unlockedBadges={};window.taskData=[];
  }

  function execute(ov,run,inp){
    if(BUSY)return;var d=db(),hid=familyId(),targets=targetMembers(),status=ov.querySelector('#fsr-status');
    if(!d||!hid){status.textContent='Firebase/household is nog niet klaar. Open dit scherm opnieuw zodra de app volledig geladen is.';return;}
    if(targets.length!==2){status.textContent='Veiligheidsstop: ik kon Shane en Esra niet allebei UID-based vinden in dit household.';return;}
    BUSY=true;run.disabled=true;inp.disabled=true;status.textContent='Reset wordt uitgevoerd…';
    var updates={};updates['families/'+hid+'/tasks']=null;
    targets.forEach(function(m){var uid=String(m.uid||m.id||'');updates['families/'+hid+'/members/'+uid+'/xp']=0;updates['families/'+hid+'/members/'+uid+'/achievements']=null;});
    d.ref().update(updates).then(function(){
      resetLocalSkills();resetKnownLocalProgress();
      try{window.dispatchEvent(new CustomEvent('familyapp:tasks-updated',{detail:{source:'fresh-start',count:0}}));window.dispatchEvent(new CustomEvent('familyapp:progression-updated',{detail:{source:'fresh-start'}}));}catch(e){}
      status.textContent='Verse start voltooid. De app wordt opnieuw geladen…';toast('Verse start voltooid ✓');setTimeout(function(){window.location.reload();},900);
    }).catch(function(err){BUSY=false;run.disabled=false;inp.disabled=false;status.textContent='Reset mislukt: '+((err&&err.message)||'onbekende fout');});
  }

  function boot(){injectStyle();patchRenderNav();addMoreButton();var grid=document.getElementById('more-grid');if(grid){new MutationObserver(function(){addMoreButton();}).observe(grid,{childList:true});}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.FamilyFreshStartReset={open:open,status:function(){return{householdId:familyId(),targets:targetMembers().map(function(m){return{uid:m.uid||m.id,name:m.displayName||m.name};})};}};
})();
