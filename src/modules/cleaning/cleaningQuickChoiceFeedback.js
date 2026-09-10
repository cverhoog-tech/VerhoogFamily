'use strict';
// ============================================================
// CLEANING QUICK CHOICE FEEDBACK v0.3.0
// A preset is a local one-tap action: preserve the visible position inside
// the actual scrolling container, wait for the canonical repository echo and
// confirm with a toast instead of inserting a notice at the top of the page.
// ============================================================
(function(){
  if(window.CleaningQuickChoiceFeedback)return;

  var VERSION='0.3.0';
  var state={pending:null,observer:null,queued:false,clearTimer:null,adjusting:false};

  function text(value){return String(value==null?'':value).trim();}
  function now(){return Date.now();}
  function rect(node){try{return node&&node.getBoundingClientRect?node.getBoundingClientRect():null;}catch(error){return null;}}

  function ensureStyle(){
    if(document.getElementById('cleaning-quick-choice-feedback-style'))return;
    var style=document.createElement('style');
    style.id='cleaning-quick-choice-feedback-style';
    style.textContent='html[data-cleaning-quick-choice-pending="1"] #screen-cleaning{overflow-anchor:none!important}html[data-cleaning-quick-choice-pending="1"] #screen-cleaning .cleaning-room-notice{display:none!important}';
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

  function roomCard(roomId){
    var cards=document.querySelectorAll('#screen-cleaning .cleaning-room-card[data-cleaning-room-id]');
    for(var i=0;i<cards.length;i++)if(text(cards[i].getAttribute('data-cleaning-room-id'))===text(roomId))return cards[i];
    return null;
  }

  function scrollContainerFor(node){
    var cursor=node&&node.parentElement;
    while(cursor&&cursor!==document.body&&cursor!==document.documentElement){
      try{
        var style=window.getComputedStyle?window.getComputedStyle(cursor):null;
        var overflow=style&&text(style.overflowY||style.overflow);
        if(/auto|scroll|overlay/i.test(overflow)&&Number(cursor.scrollHeight)>Number(cursor.clientHeight)+1)return cursor;
      }catch(error){}
      cursor=cursor.parentElement;
    }
    return window;
  }

  function scrollPosition(container){
    if(!container||container===window)return Number(window.scrollY||window.pageYOffset||0);
    return Number(container.scrollTop||0);
  }

  function scrollByDelta(container,delta){
    if(!Number.isFinite(delta)||Math.abs(delta)<0.5)return;
    state.adjusting=true;
    try{
      if(!container||container===window){
        if(typeof window.scrollBy==='function')window.scrollBy(0,delta);
        else if(typeof window.scrollTo==='function')window.scrollTo(0,scrollPosition(window)+delta);
      }else{
        container.scrollTop=scrollPosition(container)+delta;
      }
    }finally{
      var release=function(){state.adjusting=false;};
      (window.requestAnimationFrame||function(callback){return window.setTimeout(callback,0);})(release);
    }
  }

  function suggestionHeader(card){
    if(!card||!card.querySelectorAll)return null;
    var sections=card.querySelectorAll('.cleaning-routine-section');
    for(var i=0;i<sections.length;i++){
      var section=sections[i];
      if(text(section.textContent).indexOf('Snelle suggesties')>=0){
        return section.querySelector&&section.querySelector('.cleaning-routine-section-head');
      }
    }
    return null;
  }

  function captureViewport(button,roomId){
    var container=scrollContainerFor(button),anchor=null,anchorKind='room-main',anchorKey=null;
    var previous=button&&button.previousElementSibling;
    if(previous&&previous.getAttribute&&previous.hasAttribute&&previous.hasAttribute('data-cleaning-template-key')){
      anchor=previous;anchorKind='template';anchorKey=text(previous.getAttribute('data-cleaning-template-key'));
    }
    var card=roomCard(roomId)||(button&&button.closest?button.closest('.cleaning-room-card'):null);
    if(!anchor){anchor=suggestionHeader(card);anchorKind='suggestion-head';}
    if(!anchor&&card&&card.querySelector){anchor=card.querySelector('.cleaning-room-card-main')||card;anchorKind='room-main';}
    var box=rect(anchor);
    return{
      container:container,
      fallbackScrollTop:scrollPosition(container),
      roomId:text(roomId),
      anchorKind:anchorKind,
      anchorKey:anchorKey,
      anchorTop:box&&Number.isFinite(Number(box.top))?Number(box.top):null
    };
  }

  function locateAnchor(viewport){
    if(!viewport)return null;
    var card=roomCard(viewport.roomId);
    if(!card)return null;
    if(viewport.anchorKind==='template'){
      var buttons=card.querySelectorAll?card.querySelectorAll('[data-cleaning-template-key]'):[];
      for(var i=0;i<buttons.length;i++)if(text(buttons[i].getAttribute('data-cleaning-template-key'))===viewport.anchorKey)return buttons[i];
    }
    if(viewport.anchorKind==='suggestion-head')return suggestionHeader(card);
    return card.querySelector?card.querySelector('.cleaning-room-card-main')||card:card;
  }

  function restoreViewport(pending){
    if(!pending||!pending.viewport)return;
    var viewport=pending.viewport;
    var anchor=locateAnchor(viewport),box=rect(anchor);
    if(anchor&&box&&viewport.anchorTop!==null&&Number.isFinite(Number(box.top))){
      var delta=Number(box.top)-Number(viewport.anchorTop);
      scrollByDelta(viewport.container,delta);
      return;
    }
    var current=scrollPosition(viewport.container),fallback=Number(viewport.fallbackScrollTop)||0;
    if(Math.abs(current-fallback)>1)scrollByDelta(viewport.container,fallback-current);
  }

  function restoreAcrossFrames(pending){
    var raf=window.requestAnimationFrame||function(callback){return window.setTimeout(callback,0);};
    raf(function(){
      if(!state.pending||state.pending.token!==pending.token)return;
      restoreViewport(pending);
      raf(function(){if(state.pending&&state.pending.token===pending.token)restoreViewport(pending);});
    });
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
    restoreAcrossFrames(pending);

    if(!pending.confirmed){
      // The button disappeared: Firebase echoed the newly created routine.
      if(!button){
        pending.confirmed=true;
        restoreAcrossFrames(pending);
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
      viewport:captureViewport(button,roomId),
      startedAt:now(),
      confirmed:false
    };
    setPendingAttribute(true);
    queue();
  }

  function onUserIntent(){
    var pending=state.pending;
    if(pending&&pending.confirmed&&!state.adjusting)cancelPending(pending);
  }

  function start(){
    if(window.__cleaningQuickChoiceFeedbackStarted)return;
    window.__cleaningQuickChoiceFeedbackStarted=true;
    ensureStyle();
    document.addEventListener('click',onClick,true);
    document.addEventListener('touchstart',onUserIntent,true);
    document.addEventListener('pointerdown',onUserIntent,true);
    document.addEventListener('wheel',onUserIntent,{capture:true,passive:true});
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
    _matchingButton:matchingButton,
    _captureViewport:captureViewport,
    _restoreViewport:restoreViewport,
    _scrollContainerFor:scrollContainerFor
  };
  start();
})();
