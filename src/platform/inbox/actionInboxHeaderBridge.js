'use strict';
// ============================================================
// ACTION INBOX HEADER BRIDGE v1.0.0
// Adds the app-wide Inbox envelope button to .app-header, purely via DOM
// injection (no index.html edit needed), mirroring how e.g.
// taskSwapRequests.js injects its own trigger button. The badge on this
// button is driven EXCLUSIVELY by ActionInboxStore.count() — it must never
// be derived from NotificationStore/unread notifications. That distinction
// (✉️ Inbox = open decisions, 🔔 Meldingen = unread info) is the whole
// point of this milestone and must stay true both technically and visually.
// ============================================================
(function(){
  if(window.ActionInboxHeaderBridge)return;

  var VERSION='1.0.0';
  var BUTTON_ID='action-inbox-header-btn';
  var unsubscribe=null;

  function ensureStyle(){
    if(document.getElementById('action-inbox-header-style'))return;
    var style=document.createElement('style');
    style.id='action-inbox-header-style';
    style.textContent=''
      +'.header-inbox-btn{position:relative;background:none;border:none;padding:0;margin:0 2px;cursor:pointer;color:var(--c-text2);display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;min-width:44px;min-height:44px;border-radius:12px;-webkit-tap-highlight-color:transparent}\n'
      +'.header-inbox-btn:active{background:rgba(124,58,237,.10)}\n'
      +'[data-theme*="dark"] .header-inbox-btn:active{background:rgba(216,181,82,.14)}\n'
      +'.header-inbox-btn svg{display:block}\n'
      +'.action-inbox-badge{position:absolute;top:6px;right:6px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:#7c3aed;color:#fff;font-size:10px;line-height:16px;font-weight:800;text-align:center;border:1.5px solid var(--c-header-bg);display:none}\n'
      +'[data-theme*="dark"] .action-inbox-badge{background:#d8b552;color:#241608}\n'
      +'.action-inbox-badge.is-visible{display:block}\n';
    document.head.appendChild(style);
  }

  function iconSvg(){
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
      +'<path d="M3 6.5a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11Z"/>'
      +'<path d="m4 6.5 8 6.2 8-6.2"/>'
      +'</svg>';
  }

  function ensureButton(){
    var header=document.querySelector('.app-header');
    if(!header)return null;
    var existing=document.getElementById(BUTTON_ID);
    if(existing)return existing;
    var btn=document.createElement('button');
    btn.type='button';
    btn.id=BUTTON_ID;
    btn.className='header-inbox-btn';
    btn.setAttribute('aria-label','Inbox — openstaande verzoeken');
    btn.title='Inbox';
    btn.innerHTML=iconSvg()+'<span class="action-inbox-badge" id="action-inbox-badge">0</span>';
    btn.onclick=function(){open();};
    var notifBtn=header.querySelector('.header-notif');
    if(notifBtn&&notifBtn.parentNode)notifBtn.parentNode.insertBefore(btn,notifBtn);
    else header.appendChild(btn);
    return btn;
  }

  function updateBadge(count){
    var badge=document.getElementById('action-inbox-badge');
    if(!badge)return;
    var n=Number(count)||0;
    badge.textContent=n>99?'99+':String(n);
    badge.classList.toggle('is-visible',n>0);
  }

  function open(){
    if(window.ActionInboxScreen&&typeof ActionInboxScreen.ensure==='function')ActionInboxScreen.ensure();
    if(typeof window.showScreen==='function')window.showScreen('inbox');
    var title=document.getElementById('hdr-title');
    if(title)title.textContent='Inbox';
  }

  function start(){
    ensureStyle();
    ensureButton();
    if(!unsubscribe&&window.ActionInboxStore&&typeof ActionInboxStore.subscribe==='function'){
      unsubscribe=ActionInboxStore.subscribe(function(items,count){updateBadge(count);});
    }
    window.addEventListener('familyapp:household-context',function(){ensureButton();});
  }

  window.ActionInboxHeaderBridge={version:VERSION,start:start,open:open,_ensureButton:ensureButton,_updateBadge:updateBadge};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
