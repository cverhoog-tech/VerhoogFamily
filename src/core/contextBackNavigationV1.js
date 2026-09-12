'use strict';
// ============================================================
// FAMILYAPP — CONTEXTUAL BACK NAVIGATION V1
// Adds a small app-level history layer around the canonical showScreen router.
// It does NOT use browser history and never owns screen rendering itself.
// ============================================================
(function(){
  if(window.ContextBackNavigationV1)return;

  var VERSION='1.0.1';
  var stack=[];
  var MAX_DEPTH=12;
  var rootIntent=false;
  var installed=false;
  var rawShowScreen=null;
  var restoreTimer=0;

  function current(){return String(window._currentScreen||'home');}
  function same(a,b){return String(a||'')===String(b||'');}
  function snapshot(id){return{id:String(id||current()),scrollY:Math.max(0,Math.round(window.scrollY||document.documentElement.scrollTop||0))};}
  function svg(){return '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';}

  function trim(){if(stack.length>MAX_DEPTH)stack.splice(0,stack.length-MAX_DEPTH);}
  function pushPrevious(id){
    if(!id)return;
    var last=stack[stack.length-1];
    if(last&&same(last.id,id)){last.scrollY=snapshot(id).scrollY;return;}
    stack.push(snapshot(id));trim();
  }
  function clear(){stack.length=0;syncSoon();}
  function canGoBack(){return stack.length>0;}

  function setRootIntent(){
    rootIntent=true;
    window.setTimeout(function(){rootIntent=false;},0);
  }

  function markRootNavigation(event){
    var target=event.target&&event.target.closest?event.target.closest('#bottom-nav [data-goto],#bottom-nav #nav-feed-btn,#more-grid [data-goto-more]'):null;
    if(target)setRootIntent();
  }

  function makeButton(cls){
    var button=document.createElement('button');
    button.type='button';
    button.className=cls;
    button.setAttribute('aria-label','Terug naar vorig scherm');
    button.setAttribute('data-familyapp-context-back','1');
    button.innerHTML=svg();
    button.onclick=function(event){event.preventDefault();event.stopPropagation();goBack();};
    return button;
  }

  function syncLegacyHeader(show){
    var header=document.querySelector('.app-header');
    if(!header)return;
    var button=header.querySelector(':scope > [data-familyapp-context-back]');
    if(show&&!button){button=makeButton('familyapp-context-back');header.insertBefore(button,header.firstChild);}
    if(button)button.hidden=!show;
  }

  function syncTasksHeader(show){
    var header=document.querySelector('#screen-tasks .tv3-brand');
    if(!header)return;
    var button=header.querySelector(':scope > [data-familyapp-context-back]');
    if(show&&!button){button=makeButton('familyapp-context-back familyapp-context-back--tasks');header.insertBefore(button,header.firstChild);}
    if(button)button.hidden=!show;
  }

  function sync(){
    var show=canGoBack();
    syncLegacyHeader(show);
    syncTasksHeader(show&&current()==='tasks');
    document.documentElement.classList.toggle('familyapp-has-context-back',show);
  }
  function syncSoon(){
    var raf=window.requestAnimationFrame||function(fn){return window.setTimeout(fn,16);};
    raf(sync);
    window.setTimeout(sync,80);
  }

  function restoreScroll(y){
    if(restoreTimer)window.clearTimeout(restoreTimer);
    restoreTimer=window.setTimeout(function(){
      window.scrollTo({top:Math.max(0,Number(y)||0),left:0,behavior:'auto'});
      restoreTimer=0;
    },90);
  }

  function goBack(){
    if(!stack.length)return false;
    var target=stack.pop();
    if(!target||!target.id)return false;
    if(typeof rawShowScreen!=='function')return false;
    rawShowScreen(target.id);
    restoreScroll(target.scrollY);
    syncSoon();
    return true;
  }

  function wrapRouter(){
    if(installed||typeof window.showScreen!=='function')return installed;
    rawShowScreen=window.showScreen;
    var wrapped=function(id){
      var target=String(id==null?'':id);
      var before=current();
      if(rootIntent){stack.length=0;rootIntent=false;}
      else if(target&&before&&!same(target,before))pushPrevious(before);
      var result=rawShowScreen.apply(this,arguments);
      syncSoon();
      return result;
    };
    wrapped.__familyappContextBackV1=true;
    wrapped.__familyappRaw=rawShowScreen;
    window.showScreen=wrapped;
    installed=true;
    syncSoon();
    return true;
  }

  function start(){
    // pointerdown covers touch/mouse immediately; click also covers keyboard,
    // assistive-tech and synthetic activations without relying on event timing.
    document.addEventListener('pointerdown',markRootNavigation,true);
    document.addEventListener('click',markRootNavigation,true);
    if(wrapRouter())return;
    var attempts=0,timer=window.setInterval(function(){attempts++;if(wrapRouter()||attempts>120)window.clearInterval(timer);},50);
  }

  window.ContextBackNavigationV1={
    version:VERSION,
    back:goBack,
    clear:clear,
    canGoBack:canGoBack,
    status:function(){return{current:current(),depth:stack.length,stack:stack.slice()};},
    sync:sync
  };
  window.familyAppGoBack=goBack;

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
