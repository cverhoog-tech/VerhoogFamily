'use strict';
// Rendering boundary for the dedicated Cleaning turn modal.
//
// CleaningOccurrence/repository state keeps updating while the modal is open,
// but the expensive hidden Cleaning DOM is detached so repository subscribers
// and presentation MutationObservers cannot rebuild/decorate it behind the
// fullscreen turn experience. On close the same root is restored and rendered
// exactly once from the latest repository/member snapshot.
(function(){
  if(window.CleaningTurnRenderGuard)return;

  var state={
    pending:false,
    suspended:false,
    root:null,
    placeholder:null,
    restorePromise:null
  };

  function trace(name,detail){
    try{
      var t=window.CleaningFreezeTrace;
      if(t&&typeof t.mark==='function')t.mark(name,detail||{});
    }catch(error){}
  }

  function turnIsOpen(){
    try{
      return !!(window.CleaningTurnExperience
        && typeof window.CleaningTurnExperience.isOpen==='function'
        && window.CleaningTurnExperience.isOpen());
    }catch(error){
      return false;
    }
  }

  function detachAfterOpen(){
    state.pending=false;
    if(state.suspended||!turnIsOpen())return;
    var screen=document.getElementById('screen-cleaning');
    var root=document.getElementById('cleaning-content');
    if(!screen||!screen.classList.contains('active')||!root||!root.parentNode||!root.isConnected)return;

    var placeholder=document.createComment('cleaning-turn-render-boundary');
    root.parentNode.replaceChild(placeholder,root);
    state.root=root;
    state.placeholder=placeholder;
    state.suspended=true;
    trace('cleaning-turn-background-suspended',{connected:root.isConnected});
  }

  function scheduleSuspend(event){
    if(state.pending||state.suspended)return;
    var target=event&&event.target;
    if(!target||!target.closest)return;
    var trigger=target.closest('#screen-cleaning [data-cleaning-room-primary-action]');
    if(!trigger)return;

    // The dedicated turn popup owns this same capture click and calls
    // stopImmediatePropagation(). Schedule the detach as a microtask so its
    // synchronous openRoom() can finish first while the clicked card is still
    // connected to #screen-cleaning.
    state.pending=true;
    Promise.resolve().then(detachAfterOpen);
  }

  function restore(){
    state.pending=false;
    if(!state.suspended)return;

    var root=state.root;
    var placeholder=state.placeholder;
    state.root=null;
    state.placeholder=null;
    state.suspended=false;

    if(root&&placeholder&&placeholder.parentNode){
      placeholder.parentNode.replaceChild(root,placeholder);
    }
    trace('cleaning-turn-background-restored',{connected:!!(root&&root.isConnected)});

    if(!root||!root.isConnected||window._currentScreen!=='cleaning')return;
    var screen=document.getElementById('screen-cleaning');
    if(!screen||!screen.classList.contains('active'))return;

    // Use the canonical v=1 module identity already shared by navigation and
    // Round4. This does not create a second CleaningScreen module instance.
    state.restorePromise=import('/src/modules/cleaning/cleaningScreen.js?v=1')
      .then(function(mod){
        if(window._currentScreen!=='cleaning'||!root.isConnected)return;
        var liveScreen=document.getElementById('screen-cleaning');
        if(!liveScreen||!liveScreen.classList.contains('active'))return;
        if(mod&&typeof mod.renderCleaningScreen==='function'){
          mod.renderCleaningScreen(root);
          trace('cleaning-turn-background-rendered-once',{});
        }
      })
      .catch(function(error){
        console.error('[Cleaning] achtergrond kon na beurt niet worden hersteld:',error);
      })
      .finally(function(){state.restorePromise=null;});
  }

  document.addEventListener('click',scheduleSuspend,true);
  window.addEventListener('familyapp:cleaning-turn-closed',restore);

  window.CleaningTurnRenderGuard={
    version:'1.0.0',
    isSuspended:function(){return state.suspended;},
    restore:restore
  };
})();
