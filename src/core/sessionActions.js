'use strict';
// ============================================================
// FAMILYAPP SESSION ACTIONS v1.3.1
// Explicit account actions plus lightweight first-household UI defaults.
// Firebase Auth remains the sole auth authority.
// ============================================================
(function(){
  if(window.FamilySessionActions)return;

  var busy=false;
  var moreObserver=null;
  var onboardingObserver=null;
  var shoppingTimer=null;
  var shoppingEnsured={};
  function tr(key,fallback,params){try{if(window.FamilyI18n&&typeof window.FamilyI18n.t==='function'){var value=window.FamilyI18n.t(key,params||{});if(value&&value!==key)return value;}}catch(error){}return fallback;}

  function auth(){
    try{if(window.fbAuth)return window.fbAuth;}catch(e){}
    try{if(window.firebase&&typeof window.firebase.auth==='function')return window.firebase.auth();}catch(e){}
    return null;
  }

  function toast(message){
    try{if(typeof window.showToast==='function')window.showToast(message);}catch(e){}
  }

  function signOut(){
    if(busy)return Promise.resolve(false);
    var instance=auth();
    if(!instance||typeof instance.signOut!=='function')return Promise.reject(new Error('FIREBASE_AUTH_REQUIRED'));
    busy=true;
    try{if(typeof window.closeMore==='function')window.closeMore();}catch(e){}
    return Promise.resolve(instance.signOut()).then(function(){return true;}).catch(function(error){
      toast(tr('session.logoutFailed','Uitloggen mislukt. Probeer opnieuw.'));throw error;
    }).finally(function(){busy=false;});
  }

  function addMoreLogoutButton(){
    var grid=document.getElementById('more-grid');
    if(!grid||grid.querySelector('#more-logout-btn'))return;
    var button=document.createElement('button');
    button.className='more-btn';button.id='more-logout-btn';
    button.style.border='1.5px solid rgba(220,38,38,.22)';button.style.color='#dc2626';
    button.innerHTML='<span style="font-size:22px">↪</span><span>'+tr('session.logout','Uitloggen')+'</span>';
    button.onclick=function(){try{if(typeof window.closeMore==='function')window.closeMore();}catch(e){}signOut().catch(function(){});};
    grid.appendChild(button);
  }

  function installMoreLogout(){
    addMoreLogoutButton();var grid=document.getElementById('more-grid');
    if(!grid||moreObserver)return;
    moreObserver=new MutationObserver(function(){addMoreLogoutButton();});moreObserver.observe(grid,{childList:true});
  }

  function ensureOnboardingCancel(){
    var overlay=document.getElementById('household-onboarding');
    if(!overlay||overlay.querySelector('#hh-cancel-login'))return;
    if(!overlay.querySelector('[data-hh="create"]')||!overlay.querySelector('[data-hh="join"]'))return;
    var card=overlay.querySelector('.hh-card');if(!card)return;
    var button=document.createElement('button');button.type='button';button.className='hh-back';button.id='hh-cancel-login';button.textContent=tr('session.backLogin','Terug naar inloggen');
    button.onclick=function(){if(button.disabled)return;button.disabled=true;signOut().then(function(){var current=document.getElementById('household-onboarding');if(current)current.remove();}).catch(function(){button.disabled=false;});};
    card.appendChild(button);
  }

  function installOnboardingCancel(){
    ensureOnboardingCancel();if(onboardingObserver||!document.body)return;
    onboardingObserver=new MutationObserver(function(){ensureOnboardingCancel();});onboardingObserver.observe(document.body,{childList:true,subtree:true});
  }

  function ensureDefaultShoppingList(){
    var ctx=null,store=window.ShoppingListStore,repo=window.ShoppingListHouseholdRepository;
    try{ctx=window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){}
    if(!ctx||ctx.ready!==true||!ctx.uid||!ctx.householdId||!store||!repo||typeof store.all!=='function'||typeof store.createList!=='function'||typeof repo.status!=='function')return;
    var key=ctx.uid+'|'+ctx.householdId,status=repo.status(),rows=store.all();
    if(rows.length){shoppingEnsured[key]='ready';return;}
    if(shoppingEnsured[key]==='creating'||shoppingEnsured[key]==='ready')return;
    if(!status.ready||status.householdId!==ctx.householdId)return;
    shoppingEnsured[key]='creating';
    store.createList({id:'household_default',name:tr('shop.familyList','Gezinslijst'),icon:'🛒',visibility:'household'}).then(function(){shoppingEnsured[key]='ready';}).catch(function(error){
      delete shoppingEnsured[key];console.warn('[FamilySessionActions] default shopping list creation failed',error);
    });
  }

  function installDefaultShoppingList(){
    ensureDefaultShoppingList();if(shoppingTimer)return;
    shoppingTimer=setInterval(ensureDefaultShoppingList,500);
  }

  function installSessionUi(){installMoreLogout();installOnboardingCancel();installDefaultShoppingList();}
  window.addEventListener('familyapp:language-changed',function(){var logout=document.getElementById('more-logout-btn');if(logout)logout.innerHTML='<span style="font-size:22px">↪</span><span>'+tr('session.logout','Uitloggen')+'</span>';var cancel=document.getElementById('hh-cancel-login');if(cancel)cancel.textContent=tr('session.backLogin','Terug naar inloggen');});

  window.FamilySessionActions={version:'1.3.1',signOut:signOut,isBusy:function(){return busy;},ensureMoreLogout:addMoreLogoutButton,ensureOnboardingCancel:ensureOnboardingCancel,ensureDefaultShoppingList:ensureDefaultShoppingList};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installSessionUi,{once:true});else installSessionUi();
})();
