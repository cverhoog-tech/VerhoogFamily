'use strict';
// ============================================================
// NOTIFICATION CENTER v1.0.0
// Canonical presentation for NotificationStore events.
// Actionable events expose explicit controls; mutations stay in NotificationActions.
// ============================================================
(function(){
  if(window.NotificationCenter)return;
  var VERSION='1.0.0';

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function me(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
  function ensureStyles(){
    if(document.getElementById('notification-center-style'))return;
    var s=document.createElement('style');s.id='notification-center-style';s.textContent=[
      '#notif-list{padding:0 14px 18px}',
      '.nc-item{width:100%;border:1px solid var(--c-border);background:var(--c-surface);border-radius:16px;padding:12px;display:flex;align-items:flex-start;gap:11px;text-align:left;margin:0 0 9px;box-shadow:0 2px 8px rgba(15,23,42,.04)}',
      '.nc-item.is-read{opacity:.68}',
      '.nc-icon{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;font-size:19px;flex:0 0 auto}',
      '.nc-copy{flex:1;min-width:0}',
      '.nc-title{font-size:13px;font-weight:900;color:var(--c-text)}',
      '.nc-body{font-size:11.5px;line-height:1.4;color:var(--c-text2);margin-top:2px}',
      '.nc-meta{font-size:9.5px;color:var(--c-text3);margin-top:5px}',
      '.nc-actions{display:flex;gap:7px;margin-top:9px}',
      '.nc-action{border:0;border-radius:10px;padding:8px 11px;background:var(--c-primary);color:#fff;font-size:11px;font-weight:900;cursor:pointer;touch-action:manipulation}',
      '.nc-dot{width:7px;height:7px;border-radius:50%;background:var(--c-primary);flex:0 0 auto;margin-top:7px}'
    ].join('\n');document.head.appendChild(s);
  }
  function itemHtml(n){
    var uid=me(),read=!!(uid&&n.readBy&&n.readBy[uid]);
    var actionable=!!(window.NotificationActions&&NotificationActions.isActionable&&NotificationActions.isActionable(n));
    var actor=n.actor&&n.actor.name?esc(n.actor.name)+' · ':'';
    var time=n.createdAt?new Date(n.createdAt).toLocaleString('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';
    return '<article class="nc-item'+(read?' is-read':'')+'" data-notif-id="'+esc(n.id)+'">'
      +'<div class="nc-icon" style="background:'+esc(n.bg||'#ede9fe')+'">'+esc(n.icon||'🔔')+'</div>'
      +'<div class="nc-copy"><div class="nc-title">'+esc(n.title||'Melding')+'</div><div class="nc-body">'+esc(n.body||'')+'</div><div class="nc-meta">'+actor+esc(time)+'</div>'
      +(actionable?'<div class="nc-actions"><button type="button" class="nc-action" data-notif-action="accept">Accepteren</button></div>':'')+'</div>'
      +(!read?'<span class="nc-dot"></span>':'')+'</article>';
  }
  function render(){
    ensureStyles();
    var el=document.getElementById('notif-list');if(!el)return;
    if(!window.NotificationStore){el.innerHTML='<div style="padding:30px;text-align:center;color:var(--c-text2)">Meldingen worden geladen…</div>';return;}
    NotificationStore.ensureSubscription();
    var items=NotificationStore.list();
    el.innerHTML=items.map(itemHtml).join('')||'<div style="padding:30px;text-align:center;color:var(--c-text2)">Geen meldingen</div>';
    var dot=document.getElementById('notif-dot');if(dot)dot.style.display=NotificationStore.unreadCount()?'block':'none';
  }
  function install(){
    ensureStyles();
    window.renderNotifs=render;
    window.clearNotifs=function(){return window.NotificationStore?NotificationStore.markAllRead().then(render):Promise.resolve();};
    document.addEventListener('click',function(ev){
      var btn=ev.target&&ev.target.closest&&ev.target.closest('#notif-list [data-notif-action]');
      if(btn){
        var row=btn.closest('[data-notif-id]');
        var event=window.NotificationActions&&NotificationActions.byId?NotificationActions.byId(row&&row.getAttribute('data-notif-id')):null;
        ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
        if(!event)return;
        NotificationActions.run(event).then(render).catch(function(err){console.warn('[NotificationCenter]',err);if(typeof window.showToast==='function')window.showToast('Actie uitvoeren mislukt');});
        return;
      }
      var row=ev.target&&ev.target.closest&&ev.target.closest('#notif-list [data-notif-id]');
      if(row&&window.NotificationStore)NotificationStore.markRead(row.getAttribute('data-notif-id')).then(render);
    },true);
    window.addEventListener('familyapp:notifications-changed',render);
  }
  window.NotificationCenter={version:VERSION,render:render,install:install};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();