'use strict';
// ============================================================
// NOTIFICATION DELIVERY v2.0.0 — STEP 10
// In-app live presentation channel for canonical NotificationStore events.
// Queue/banner state is identity-bound and cleared on HouseholdContext changes.
// OS/Web Push is a separate later delivery adapter.
// ============================================================
(function(){
  if(window.NotificationDelivery)return;
  var VERSION='2.0.0';
  var activeBanner=null;
  var queue=[];
  var installed=false;
  var contextUnsubscribe=null;
  var activeIdentity=null;

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function identity(c){return c&&c.ready&&c.uid&&c.householdId?[String(c.uid),String(c.householdId),String(c.revision||0)].join('|'):null;}
  function actionable(event){return !!(window.NotificationActions&&NotificationActions.isActionable&&NotificationActions.isActionable(event));}
  function ensureStyles(){
    if(document.getElementById('notification-delivery-style'))return;
    var s=document.createElement('style');s.id='notification-delivery-style';s.textContent=[
      '.notif-live-banner{position:fixed;top:max(64px,calc(env(safe-area-inset-top) + 52px));left:50%;transform:translateX(-50%);z-index:12020;width:min(420px,calc(100% - 24px));background:var(--c-surface);border:1px solid var(--c-border);border-radius:18px;padding:12px 13px;box-shadow:0 14px 40px rgba(15,23,42,.18);display:flex;align-items:flex-start;gap:11px;animation:notifLiveIn .22s ease-out}',
      '.notif-live-icon{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;font-size:20px;flex:0 0 auto}',
      '.notif-live-copy{flex:1;min-width:0}',
      '.notif-live-title{font-size:13px;font-weight:900;color:var(--c-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.notif-live-body{font-size:11.5px;color:var(--c-text2);line-height:1.35;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.notif-live-from{font-size:9.5px;color:var(--c-text3);margin-top:3px}',
      '.notif-live-actions{display:flex;gap:7px;margin-top:8px}',
      '.notif-live-accept{border:0;border-radius:10px;padding:8px 11px;background:var(--c-primary);color:#fff;font-size:10.5px;font-weight:900;cursor:pointer;touch-action:manipulation}',
      '.notif-live-open{border:0;border-radius:10px;padding:8px 10px;background:var(--c-surface2);color:var(--c-text2);font-size:10.5px;font-weight:800;cursor:pointer;touch-action:manipulation}',
      '.notif-live-close{border:0;background:var(--c-surface2);color:var(--c-text2);width:28px;height:28px;border-radius:9px;display:grid;place-items:center;font-size:13px;flex:0 0 auto;cursor:pointer;touch-action:manipulation}',
      '@keyframes notifLiveIn{from{opacity:0;transform:translate(-50%,-8px) scale(.98)}to{opacity:1;transform:translate(-50%,0) scale(1)}}'
    ].join('\n');document.head.appendChild(s);
  }
  function clearLive(){queue=[];if(activeBanner&&activeBanner.parentNode)activeBanner.parentNode.removeChild(activeBanner);activeBanner=null;}
  function openCenter(event){if(window.NotificationStore&&event&&event.id)NotificationStore.markRead(event.id).catch(function(){});if(typeof window.showScreenMore==='function')window.showScreenMore('notif');else if(typeof window.showScreen==='function')window.showScreen('notif');}
  function next(){
    if(activeBanner||!queue.length)return;
    var entry=queue.shift();if(!entry||entry.identity!==activeIdentity)return next();
    var event=entry.event;if(!event)return next();
    ensureStyles();var isAction=actionable(event);
    var el=document.createElement('div');el.className='notif-live-banner';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
    el.innerHTML='<div class="notif-live-icon" style="background:'+esc(event.bg||'#ede9fe')+'">'+esc(event.icon||'🔔')+'</div><div class="notif-live-copy"><div class="notif-live-title">'+esc(event.title||'Melding')+'</div><div class="notif-live-body">'+esc(event.body||'')+'</div>'+(event.actor&&event.actor.name?'<div class="notif-live-from">Van '+esc(event.actor.name)+'</div>':'')+'<div class="notif-live-actions">'+(isAction?'<button type="button" class="notif-live-accept">Accepteren</button>':'')+'<button type="button" class="notif-live-open">Meldingen</button></div></div><button class="notif-live-close" type="button" aria-label="Sluiten">✕</button>';
    function close(){if(el.parentNode)el.parentNode.removeChild(el);if(activeBanner===el)activeBanner=null;next();}
    el.querySelector('.notif-live-close').onclick=function(ev){ev.preventDefault();ev.stopPropagation();close();};
    var openBtn=el.querySelector('.notif-live-open');if(openBtn)openBtn.onclick=function(ev){ev.preventDefault();ev.stopPropagation();openCenter(event);close();};
    var acceptBtn=el.querySelector('.notif-live-accept');if(acceptBtn)acceptBtn.onclick=function(ev){ev.preventDefault();ev.stopPropagation();if(entry.identity!==activeIdentity){close();return;}acceptBtn.disabled=true;NotificationActions.run(event).then(close).catch(function(err){acceptBtn.disabled=false;console.warn('[NotificationDelivery]',err);if(typeof window.showToast==='function')window.showToast('Actie uitvoeren mislukt');});};
    el.onclick=function(ev){if(ev.target&&ev.target.closest&&ev.target.closest('button'))return;if(entry.identity!==activeIdentity){close();return;}if(isAction){NotificationActions.run(event).then(close).catch(function(err){console.warn('[NotificationDelivery]',err);});}else{openCenter(event);close();}};
    document.body.appendChild(el);activeBanner=el;setTimeout(function(){if(activeBanner===el)close();},8000);
  }
  function receive(event){if(!event||!activeIdentity)return;queue.push({identity:activeIdentity,event:event});next();}
  function handleContext(c){var nextId=identity(c);if(nextId===activeIdentity)return;activeIdentity=nextId;clearLive();}
  function install(){
    if(installed)return;installed=true;ensureStyles();
    window.addEventListener('familyapp:notification-received',function(ev){receive(ev&&ev.detail&&ev.detail.event);});
    if(window.HouseholdContext&&typeof HouseholdContext.subscribe==='function')contextUnsubscribe=HouseholdContext.subscribe(handleContext);
  }
  function stop(){clearLive();if(contextUnsubscribe){try{contextUnsubscribe();}catch(e){}contextUnsubscribe=null;}activeIdentity=null;}
  window.NotificationDelivery={version:VERSION,install:install,stop:stop,receive:receive,status:function(){return{version:VERSION,identity:activeIdentity,queued:queue.length,banner:!!activeBanner};}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
