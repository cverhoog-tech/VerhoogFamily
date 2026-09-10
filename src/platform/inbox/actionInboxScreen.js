'use strict';
// ============================================================
// ACTION INBOX SCREEN v1.1.1
// Compact decision cards. This screen only renders ActionInboxStore output and
// calls ActionInboxStore.runAction(); it never owns domain request state.
// Cleaning decisions are hydrated on demand when Inbox opens, never at app
// startup, and the temporary Cleaning repository listener is torn down after
// the first fresh household snapshot.
// ============================================================
(function(){
  if(window.ActionInboxScreen)return;

  var VERSION='1.1.1';
  var busyId=null;
  var errorMessage='';
  var cleaningHydratePromise=null;

  var DOMAIN_LABEL={
    'task.help':{icon:'✅',label:'Taken'},
    'task.swap':{icon:'✅',label:'Taken — ruilen'},
    'partyQuest.invite':{icon:'⚔️',label:'Party Quest'},
    'cleaning.help':{icon:'🧹',label:'Schoonmaken — hulp'},
    'cleaning.occurrence.transfer':{icon:'🧹',label:'Schoonmaken — overdracht'},
    'cleaning.occurrence.counter':{icon:'🧹',label:'Schoonmaken — tegenvoorstel'}
  };

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}

  function refreshStore(){try{if(window.ActionInboxStore&&typeof ActionInboxStore.refresh==='function')ActionInboxStore.refresh();}catch(e){}}

  function hydrateCleaningDecisions(){
    var ctx=context();
    if(!ctx||ctx.ready!==true||!ctx.uid||!ctx.householdId)return Promise.resolve(false);
    if(cleaningHydratePromise)return cleaningHydratePromise;
    cleaningHydratePromise=import('/src/modules/cleaning/cleaningScreen.js?v=1').then(function(){
      var repo=window.CleaningHouseholdRepository;
      if(!repo||typeof repo.snapshot!=='function'||typeof repo.subscribe!=='function'||typeof repo.start!=='function'||typeof repo.stop!=='function')return false;
      var snap=repo.snapshot();
      // When Inbox is opened directly from Cleaning, the existing snapshot is
      // already live/current. Navigation will perform the normal teardown.
      if(window._currentScreen==='cleaning'&&snap&&snap.ready===true&&String(snap.uid||'')===String(ctx.uid)&&String(snap.householdId||'')===String(ctx.householdId))return true;
      // Outside Cleaning, force one fresh canonical read. subscribe() emits the
      // retained snapshot synchronously, so ignore callbacks until start() has
      // been called; then stop immediately after the first fresh result/error.
      try{repo.stop();}catch(e){}
      return new Promise(function(resolve){
        var settled=false,started=false,unsubscribe=function(){};
        function finish(ok){
          if(settled)return;settled=true;
          try{unsubscribe();}catch(e){}
          try{repo.stop();}catch(e){}
          resolve(!!ok);
        }
        unsubscribe=repo.subscribe(function(next){
          if(!started||!next)return;
          var same=String(next.uid||'')===String(ctx.uid)&&String(next.householdId||'')===String(ctx.householdId);
          if(same&&next.ready===true){finish(true);return;}
          if(same&&next.error){finish(false);}
        });
        started=true;
        try{repo.start();}catch(e){finish(false);}
      });
    }).then(function(ok){refreshStore();return ok;}).catch(function(error){try{console.warn('[ActionInbox] Cleaning hydration failed',error);}catch(e){}return false;}).finally(function(){cleaningHydratePromise=null;});
    return cleaningHydratePromise;
  }

  function ensureStyle(){
    if(document.getElementById('action-inbox-screen-style'))return;
    var style=document.createElement('style');
    style.id='action-inbox-screen-style';
    style.textContent=''
      +'#screen-inbox{padding:14px 16px 32px}\n'
      +'#screen-inbox .aib-state{padding:48px 20px;text-align:center;color:var(--c-text2)}\n'
      +'#screen-inbox .aib-state strong{display:block;font-size:14px;margin-bottom:6px;color:var(--c-text)}\n'
      +'#screen-inbox .aib-card{border:1px solid var(--c-border);background:var(--c-card-bg,var(--c-bg2));border-radius:16px;padding:14px 14px 12px;margin-bottom:12px;box-shadow:0 6px 18px rgba(20,10,40,.05)}\n'
      +'#screen-inbox .aib-domain{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:var(--c-text2);margin-bottom:6px}\n'
      +'#screen-inbox .aib-title{font-size:14px;font-weight:800;color:var(--c-text);margin:0 0 3px}\n'
      +'#screen-inbox .aib-body{font-size:12.5px;line-height:1.45;color:var(--c-text2);margin:0 0 11px}\n'
      +'#screen-inbox .aib-actions{display:flex;gap:8px}\n'
      +'#screen-inbox .aib-btn{flex:1;min-height:44px;border-radius:12px;border:0;font:inherit;font-size:12.5px;font-weight:800;cursor:pointer}\n'
      +'#screen-inbox .aib-btn-primary{background:#7c3aed;color:#fff}\n'
      +'#screen-inbox .aib-btn-secondary{background:var(--c-bg3,rgba(120,110,140,.12));color:var(--c-text)}\n'
      +'#screen-inbox .aib-btn:disabled{opacity:.55;cursor:default}\n'
      +'#screen-inbox .aib-detail-link{display:block;margin-top:8px;background:none;border:0;padding:0;text-align:left;font-size:11.5px;font-weight:800;color:#7c3aed;cursor:pointer}\n'
      +'[data-theme*="dark"] #screen-inbox .aib-btn-primary{background:#d8b552;color:#241608}\n'
      +'[data-theme*="dark"] #screen-inbox .aib-detail-link{color:#e0bf69}\n'
      +'#screen-inbox .aib-retry{margin-top:10px;min-height:44px;padding:0 18px;border-radius:12px;border:0;background:#7c3aed;color:#fff;font-weight:800}\n';
    document.head.appendChild(style);
  }

  function ensure(){
    ensureStyle();
    var existing=document.getElementById('screen-inbox');
    if(existing){hydrateCleaningDecisions();return existing;}
    var screen=document.createElement('div');
    screen.className='screen';
    screen.id='screen-inbox';
    var content=document.createElement('div');
    content.id='action-inbox-content';
    screen.appendChild(content);
    var profile=document.getElementById('screen-profile');
    if(profile&&profile.parentNode)profile.parentNode.insertBefore(screen,profile);
    else document.body.appendChild(screen);
    if(window.ActionInboxStore&&typeof ActionInboxStore.subscribe==='function'){
      ActionInboxStore.subscribe(function(items){render(items);});
    }
    render(window.ActionInboxStore&&ActionInboxStore.list?ActionInboxStore.list():[]);
    hydrateCleaningDecisions();
    return screen;
  }

  function cardHtml(item){
    var meta=DOMAIN_LABEL[item.type]||{icon:'✉️',label:item.domain||''};
    var busy=busyId===item.id;
    var primary=(item.actions||[]).filter(function(a){return!a.secondary;});
    var secondary=(item.actions||[]).filter(function(a){return a.secondary;});
    var buttonsHtml=primary.map(function(a,index){
      var cls=index===0?'aib-btn-primary':'aib-btn-secondary';
      return '<button type="button" class="aib-btn '+cls+'" data-aib-action="'+esc(item.id)+'|'+esc(a.id)+'"'+(busy?' disabled':'')+'>'+(busy?'Bezig…':esc(a.label))+'</button>';
    }).join('');
    var detailHtml=secondary.map(function(a){
      return '<button type="button" class="aib-detail-link" data-aib-action="'+esc(item.id)+'|'+esc(a.id)+'"'+(busy?' disabled':'')+'>'+esc(a.label)+'</button>';
    }).join('');
    return '<section class="aib-card" data-aib-card="'+esc(item.id)+'">'
      +'<div class="aib-domain">'+meta.icon+' '+esc(meta.label)+'</div>'
      +'<p class="aib-title">'+esc(item.title)+'</p>'
      +'<p class="aib-body">'+esc(item.body)+'</p>'
      +'<div class="aib-actions">'+buttonsHtml+'</div>'
      +detailHtml
      +'</section>';
  }

  function stateHtml(){
    var ctx=context();
    if(!ctx||!ctx.ready){
      return '<div class="aib-state"><strong>Inbox wordt geladen…</strong><span>Even geduld terwijl je gezinsdata laadt.</span></div>';
    }
    if(errorMessage){
      return '<div class="aib-state"><strong>Er ging iets mis</strong><span>'+esc(errorMessage)+'</span><br><button type="button" class="aib-retry" id="aib-retry-btn">Opnieuw proberen</button></div>';
    }
    return '<div class="aib-state"><strong>Niets te beslissen ✓</strong><span>Nieuwe verzoeken verschijnen hier automatisch.</span></div>';
  }

  function render(items){
    var content=document.getElementById('action-inbox-content');
    if(!content)return;
    var list=Array.isArray(items)?items:(window.ActionInboxStore&&ActionInboxStore.list?ActionInboxStore.list():[]);
    if(!list.length){
      content.innerHTML=stateHtml();
      var retry=document.getElementById('aib-retry-btn');
      if(retry)retry.onclick=function(){errorMessage='';refreshStore();hydrateCleaningDecisions();render();};
      return;
    }
    content.innerHTML=list.map(cardHtml).join('');
  }

  function successMessage(actionId){
    if(actionId==='decline'||actionId==='decline-help'||actionId==='decline-counter')return'Afgewezen';
    if(actionId==='counter')return'Tegenvoorstel geopend';
    if(actionId==='accept-help')return'Hulp geaccepteerd ✓';
    if(actionId==='accept-counter')return'Tegenvoorstel geaccepteerd ✓';
    return'Geaccepteerd ✓';
  }

  function onClick(event){
    var target=event.target,closest=target&&target.closest?target.closest.bind(target):null;
    if(!closest)return;
    var trigger=closest('[data-aib-action]');
    if(!trigger||trigger.disabled)return;
    var raw=trigger.getAttribute('data-aib-action')||'';
    var sep=raw.lastIndexOf('|');
    if(sep<0)return;
    var itemId=raw.slice(0,sep),actionId=raw.slice(sep+1);
    event.preventDefault();
    if(busyId)return;
    busyId=itemId;errorMessage='';render();
    if(!window.ActionInboxStore||typeof ActionInboxStore.runAction!=='function'){busyId=null;return;}
    ActionInboxStore.runAction(itemId,actionId).then(function(){
      busyId=null;render();
      if(typeof window.showToast==='function')window.showToast(successMessage(actionId));
    }).catch(function(error){
      busyId=null;
      errorMessage=(error&&error.message)||'Actie kon niet worden uitgevoerd.';
      render();
    });
  }

  document.addEventListener('click',onClick,true);

  window.ActionInboxScreen={version:VERSION,ensure:ensure,render:render,hydrateCleaningDecisions:hydrateCleaningDecisions};
})();