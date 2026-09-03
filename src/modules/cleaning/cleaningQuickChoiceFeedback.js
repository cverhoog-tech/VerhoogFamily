'use strict';
// ============================================================
// CLEANING QUICK CHOICE FEEDBACK v0.2.0
// A preset is a local one-tap action: preserve the visible position, wait for
// the canonical repository echo and confirm with a toast instead of inserting
// a notice at the top of the page.
// ============================================================
(function(){
  if(window.CleaningQuickChoiceFeedback)return;

  var VERSION='0.2.0';
  var state={pending:null,observer:null,queued:false,clearTimer:null};

  function text(value){return String(value==null?'':value).trim();}
  function now(){return Date.now();}
  function currentScrollTop(){return Number(window.scrollY||window.pageYOffset||0);}

  function ensureStyle(){
    if(document.getElementById('cleaning-quick-choice-feedback-style'))return;
    var style=document.createElement('style');
    style.id='cleaning-quick-choice-feedback-style';
    style.textContent='html[data-cleaning-quick-choice-pending="1"] #screen-cleaning .cleaning-room-notice{display:none!important}';
    document.head.appendChild(style);
  }

  function setPendingAttribute(enabled){
    var root=document.documentElement;
    if(!root)return;
    if(enabled&&root.setAttribute)root.setAttribute('data-cleaning-quick-choice-pending','1');
    else if(!enabled&&root.removeAttribute)root.removeAttribute('data-cleaning-quick-choice-pending');
  }

  function showSuccessToast(){
    if(typeof window.showToast==='function'){
      window.showToast('Routine toegevoegd ✓');
      return;
    }
    var old=document.getElementById('cleaning-quick-choice-toast');
    if(old&&old.remove)old.remove();
    var el=document.createElement('div');
    el.id='cleaning-quick-choice-toast';
    el.setAttribute('role','status');
    el.textContent='Routine toegevoegd ✓';
    el.style.cssText='position:fixed;left:50%;bottom:calc(94px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:99999;padding:11px 15px;border-radius:999px;background:rgba(20,24,32,.92);color:#fff;font:800 13px/1.2 system-ui,-apple-system,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.22);white-space:nowrap;pointer-events:none';
    document.body.appendChild(el);
    window.setTimeout(function(){if(el&&el.parentNode&&el.remove)el.remove();},2200);
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

  function restoreCapturedPosition(pending){
    if(!pending||pending.confirmed)return;
    var target=pending.scrollTop;
    var restore=function(){
      if(!state.pending||state.pending.token!==pending.token||pending.confirmed)return;
      if(Math.abs(currentScrollTop()-target)>1){
        try{window.scrollTo({top:target,left:0,behavior:'auto'});}catch(error){window.scrollTo(0,target);}
      }
    };
    var raf=window.requestAnimationFrame||function(callback){return window.setTimeout(callback,0);};
    raf(function(){raf(restore);});
  }

  function finishAfterLegacyNoticeExpires(pending){
    if(state.clearTimer)window.clearTimeout(state.clearTimer);
    state.clearTimer=window.setTimeout(function(){
      if(state.pending&&state.pending.token===pending.token)state.pending=null;
      setPendingAttribute(false);
      state.clearTimer=null;
    },2800);
  }

  function cancelPending(pending){
    if(!pending||!state.pending||state.pending.token!==pending.token)return;
    state.pending=null;
    setPendingAttribute(false);
    if(state.clearTimer){window.clearTimeout(state.clearTimer);state.clearTimer=null;}
  }

  function reconcile(){
    state.queued=false;
    var pending=state.pending;
    if(!pending)return;
    if(now()-pending.startedAt>6500){cancelPending(pending);return;}

    var button=matchingButton(pending);

    // The optimistic screen render keeps the preset button in place but marks
    // it disabled. Keep restoring only during that short write/echo phase.
    if(!pending.confirmed){
      restoreCapturedPosition(pending);

      // The button disappeared: Firebase echoed the newly created routine.
      if(!button){
        pending.confirmed=true;
        try{window.scrollTo({top:pending.scrollTop,left:0,behavior:'auto'});}catch(error){window.scrollTo(0,pending.scrollTop);}
        showSuccessToast();
        finishAfterLegacyNoticeExpires(pending);
        return;
      }

      // On failure the original button returns enabled. Stop suppressing the
      // regular inline error so the user can see what went wrong.
      if(button.disabled===false&&now()-pending.startedAt>150){
        cancelPending(pending);
      }
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

    if(state.clearTimer){window.clearTimeout(state.clearTimer);state.clearTimer=null;}
    state.pending={
      token:roomId+'|'+templateKey+'|'+now(),
      roomId:roomId,
      templateKey:templateKey,
      scrollTop:currentScrollTop(),
      startedAt:now(),
      confirmed:false
    };
    setPendingAttribute(true);
    queue();
  }

  function start(){
    if(window.__cleaningQuickChoiceFeedbackStarted)return;
    window.__cleaningQuickChoiceFeedbackStarted=true;
    ensureStyle();
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
