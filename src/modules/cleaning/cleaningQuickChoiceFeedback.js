'use strict';
// ============================================================
// CLEANING QUICK CHOICE FEEDBACK v0.1.0
// Quick preset selection should feel local: keep the user's scroll position,
// wait for the canonical repository echo, then show a toast. The existing
// Cleaning screen remains the writer and source of rendering truth.
// ============================================================
(function(){
  if(window.CleaningQuickChoiceFeedback)return;

  var VERSION='0.1.0';
  var state={pending:null,observer:null,queued:false,clearTimer:null};

  function text(value){return String(value==null?'':value).trim();}
  function now(){return Date.now();}
  function scrollY(){return Number(window.scrollY||window.pageYOffset||0);}

  function toast(message){
    if(typeof window.showToast==='function'){
      window.showToast(message);
      return;
    }
    var old=document.getElementById('cleaning-quick-choice-toast');
    if(old)old.remove();
    var el=document.createElement('div');
    el.id='cleaning-quick-choice-toast';
    el.setAttribute('role','status');
    el.textContent=message;
    el.style.cssText='position:fixed;left:50%;bottom:calc(94px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:99999;padding:11px 15px;border-radius:999px;background:rgba(20,24,32,.92);color:#fff;font:800 13px/1.2 system-ui,-apple-system,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.22);white-space:nowrap;pointer-events:none';
    document.body.appendChild(el);
    window.setTimeout(function(){if(el&&el.parentNode)el.remove();},2200);
  }

  function matchingButton(pending){
    if(!pending)return null;
    var buttons=document.querySelectorAll('#screen-cleaning [data-cleaning-template-add][data-cleaning-template-key]');
    for(var i=0;i<buttons.length;i++){
      var button=buttons[i];
      if(text(button.getAttribute('data-cleaning-template-add'))===pending.roomId&&text(button.getAttribute('data-cleaning-template-key'))===pending.templateKey)return button;
    }
    return null;
  }

  function suppressLegacySuccessNotice(){
    var notices=document.querySelectorAll('#screen-cleaning .cleaning-room-notice');
    for(var i=0;i<notices.length;i++){
      if(text(notices[i].textContent).indexOf('Suggestie toegevoegd')>=0)notices[i].remove();
    }
  }

  function restorePosition(pending){
    if(!pending)return;
    var target=pending.scrollTop;
    var restore=function(){
      if(!state.pending||state.pending.token!==pending.token)return;
      if(Math.abs(scrollY()-target)>1){
        try{window.scrollTo({top:target,left:0,behavior:'auto'});}catch(error){window.scrollTo(0,target);}
      }
    };
    var raf=window.requestAnimationFrame||function(callback){return window.setTimeout(callback,0);};
    raf(function(){raf(restore);});
  }

  function clearPendingLater(pending){
    if(state.clearTimer)window.clearTimeout(state.clearTimer);
    state.clearTimer=window.setTimeout(function(){
      if(state.pending&&state.pending.token===pending.token)state.pending=null;
      state.clearTimer=null;
    },500);
  }

  function reconcile(){
    state.queued=false;
    var pending=state.pending;
    if(!pending)return;
    if(now()-pending.startedAt>6000){state.pending=null;return;}

    suppressLegacySuccessNotice();
    restorePosition(pending);

    // During the optimistic/pending render the preset button still exists and
    // is merely disabled. Once the canonical repository echo contains the new
    // routine, the preset disappears from the suggestion list.
    if(!pending.confirmed&&!matchingButton(pending)){
      pending.confirmed=true;
      suppressLegacySuccessNotice();
      restorePosition(pending);
      toast('Routine toegevoegd ✓');
      clearPendingLater(pending);
    }
  }

  function queue(){
    if(state.queued)return;
    state.queued=true;
    var raf=window.requestAnimationFrame||function(callback){return window.setTimeout(callback,0);};
    raf(reconcile);
  }

  function onClick(event){
    var target=event.target;
    var button=target&&target.closest?target.closest('[data-cleaning-template-add][data-cleaning-template-key]'):null;
    if(!button||button.disabled)return;
    var roomId=text(button.getAttribute('data-cleaning-template-add'));
    var templateKey=text(button.getAttribute('data-cleaning-template-key'));
    if(!roomId||!templateKey)return;
    state.pending={
      token:roomId+'|'+templateKey+'|'+now(),
      roomId:roomId,
      templateKey:templateKey,
      scrollTop:scrollY(),
      startedAt:now(),
      confirmed:false
    };
    queue();
  }

  function start(){
    if(window.__cleaningQuickChoiceFeedbackStarted)return;
    window.__cleaningQuickChoiceFeedbackStarted=true;
    document.addEventListener('click',onClick,true);
    var target=document.getElementById('screen-cleaning')||document.documentElement;
    if(typeof MutationObserver!=='undefined'&&target){
      state.observer=new MutationObserver(queue);
      state.observer.observe(target,{childList:true,subtree:true});
    }
    window.addEventListener('familyapp:cleaning-repository',queue);
  }

  window.CleaningQuickChoiceFeedback={
    version:VERSION,
    start:start,
    _reconcile:reconcile,
    _matchingButton:matchingButton
  };
  start();
})();
