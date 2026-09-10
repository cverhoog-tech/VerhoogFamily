'use strict';
// ============================================================
// ACTION INBOX SCREEN v1.0.0
// Functional premium basis (Fase 5): compact cards, clear primary/secondary
// actions, dark/light aware, 44x44 targets, loading/error/empty states.
// Definitive visual polish is deliberately deferred to a later pass.
//
// This screen only renders ActionInboxStore output and calls
// ActionInboxStore.runAction(id, actionId) — it never talks to a domain
// runtime directly and never stores its own request state.
// ============================================================
(function(){
  if(window.ActionInboxScreen)return;

  var VERSION='1.0.0';
  var busyId=null;
  var errorMessage='';

  var DOMAIN_LABEL={
    'task.help':{icon:'✅',label:'Taken'},
    'task.swap':{icon:'✅',label:'Taken — ruilen'},
    'partyQuest.invite':{icon:'⚔️',label:'Party Quest'},
    'cleaning.help':{icon:'🧹',label:'Schoonmaken'},
    'cleaning.routine.transfer':{icon:'🧹',label:'Schoonmaken'},
    'cleaning.routine.counter':{icon:'🧹',label:'Schoonmaken'}
  };

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}

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
    if(existing)return existing;
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
      if(retry)retry.onclick=function(){errorMessage='';if(window.ActionInboxStore)ActionInboxStore.refresh();render();};
      return;
    }
    content.innerHTML=list.map(cardHtml).join('');
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
      if(typeof window.showToast==='function')window.showToast(actionId==='decline'?'Afgewezen':actionId==='detail'?'Geopend in Schoonmaken':'Geaccepteerd ✓');
    }).catch(function(error){
      busyId=null;
      errorMessage=(error&&error.message)||'Actie kon niet worden uitgevoerd.';
      render();
    });
  }

  document.addEventListener('click',onClick,true);

  window.ActionInboxScreen={version:VERSION,ensure:ensure,render:render};
})();
