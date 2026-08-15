'use strict';
// ============================================================
// NOTIFICATION CENTER v1.2.0
// Canonical presentation for NotificationStore events.
// Detail status is always projected from current domain state.
// ============================================================
(function(){
  if(window.NotificationCenter)return;
  var VERSION='1.2.0',activeDetailId=null,detailCloseTimer=null;

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function me(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
  function iconHtml(n){var key=n&&n.icon||'bell';if(window.FamilyIcons&&FamilyIcons.has&&FamilyIcons.has(key))return FamilyIcons.svg(key,20);return esc(key||'🔔');}
  function ensureStyles(){
    if(document.getElementById('notification-center-style'))return;
    var s=document.createElement('style');s.id='notification-center-style';s.textContent=[
      '#notif-list{padding:0 14px 18px}',
      '.nc-item{box-sizing:border-box;-webkit-appearance:none;appearance:none;width:100%;border:1px solid var(--c-border);background:var(--c-surface);border-radius:16px;padding:12px;display:flex;align-items:flex-start;gap:11px;text-align:left;margin:0 0 9px;box-shadow:0 2px 8px rgba(15,23,42,.04);cursor:pointer;touch-action:manipulation}',
      '.nc-item.is-read{opacity:.68}',
      '.nc-icon{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;flex:0 0 auto;color:var(--c-primary)}',
      '.nc-copy{flex:1;min-width:0}',
      '.nc-title{font-size:13px;font-weight:900;color:var(--c-text)}',
      '.nc-body{font-size:11.5px;line-height:1.4;color:var(--c-text2);margin-top:2px}',
      '.nc-meta{font-size:9.5px;color:var(--c-text3);margin-top:5px}',
      '.nc-dot{width:7px;height:7px;border-radius:50%;background:var(--c-primary);flex:0 0 auto;margin-top:7px}',
      '.nc-pill{display:inline-flex;align-items:center;padding:2px 8px;border-radius:99px;font-size:9.5px;font-weight:900;letter-spacing:.3px;margin-top:5px}',
      '.nc-pill.is-open{background:#fef3c7;color:#92400e}',
      '.nc-pill.is-success{background:#dcfce7;color:#166534}',
      '.nc-pill.is-muted{background:var(--c-surface2);color:var(--c-text2)}',
      '.nc-detail-overlay{box-sizing:border-box;position:fixed;inset:0;z-index:9600;background:rgba(8,7,15,.5);display:flex;align-items:flex-end;justify-content:center;padding:16px max(16px,env(safe-area-inset-right)) max(16px,calc(16px + env(safe-area-inset-bottom))) max(16px,env(safe-area-inset-left));opacity:0;pointer-events:none;transition:opacity .18s;overscroll-behavior:contain}',
      '.nc-detail-overlay.open{opacity:1;pointer-events:auto}',
      '.nc-detail-card{box-sizing:border-box;width:min(400px,100%);max-height:min(78dvh,680px);overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;border-radius:20px;background:var(--c-surface);border:1.5px solid var(--c-border);box-shadow:0 20px 50px rgba(20,10,40,.25);padding:16px;transform:translateY(14px);transition:transform .2s}',
      '.nc-detail-overlay.open .nc-detail-card{transform:translateY(0)}',
      '.nc-detail-head{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px}',
      '.nc-detail-title{font-size:14px;font-weight:900;color:var(--c-text)}',
      '.nc-detail-status{font-size:10.5px;font-weight:800;color:var(--c-primary);margin-top:2px;text-transform:uppercase;letter-spacing:.4px}',
      '.nc-detail-close{box-sizing:border-box;-webkit-appearance:none;appearance:none;margin-left:auto;width:40px;height:40px;min-width:40px;border:0;border-radius:50%;background:var(--c-surface2);font-size:14px;color:var(--c-text2);cursor:pointer;padding:0;display:grid;place-items:center;touch-action:manipulation}',
      '.nc-detail-body{font-size:13px;color:var(--c-text2);line-height:1.45;margin-bottom:12px}',
      '.nc-detail-actions{display:flex;gap:8px;flex-wrap:wrap}',
      '.nc-detail-btn{box-sizing:border-box;-webkit-appearance:none;appearance:none;flex:1 1 130px;min-height:44px;border:0;border-radius:12px;padding:11px;font-size:12.5px;font-weight:800;cursor:pointer;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;touch-action:manipulation}',
      '.nc-detail-btn.is-danger{background:#7f1d1d;color:#fff}',
      '.nc-detail-btn:disabled{opacity:.55;cursor:default}'
    ].join('\n');document.head.appendChild(s);
  }
  function pillClassFor(state){
    if(state.actions&&state.actions.length)return'is-open';
    var s=String(state.statusLabel||'');
    if(/Geaccepteerd|helpt al mee/i.test(s))return'is-success';
    if(/Geweigerd|Ingetrokken|niet meer|Al ingetrokken|niet gevonden/i.test(s))return'is-muted';
    return'';
  }
  function detailEsc(e){if(e.key==='Escape')closeDetail();}
  function removeDetailNow(){
    if(detailCloseTimer){clearTimeout(detailCloseTimer);detailCloseTimer=null;}
    var o=document.getElementById('nc-detail-popover');if(o&&o.parentNode)o.parentNode.removeChild(o);
    document.removeEventListener('keydown',detailEsc,true);
  }
  function closeDetail(){
    activeDetailId=null;
    var o=document.getElementById('nc-detail-popover');
    document.removeEventListener('keydown',detailEsc,true);
    if(!o)return;
    o.classList.remove('open');
    if(detailCloseTimer)clearTimeout(detailCloseTimer);
    detailCloseTimer=setTimeout(function(){if(o.parentNode)o.parentNode.removeChild(o);detailCloseTimer=null;},160);
  }
  function renderDetail(n,markRead){
    removeDetailNow();activeDetailId=n&&n.id?String(n.id):null;
    if(!n)return;
    var state=window.NotificationActions&&NotificationActions.describeStatus?NotificationActions.describeStatus(n):{statusLabel:'',detail:n.body||'',actions:[]};
    var actionsHtml=state.actions&&state.actions.length?('<div class="nc-detail-actions">'+state.actions.map(function(a){return '<button type="button" class="nc-detail-btn'+(a.cls?' '+a.cls:'')+'" data-detail-action="'+esc(a.action)+'">'+esc(a.label)+'</button>';}).join('')+'</div>'):'';
    var o=document.createElement('div');o.id='nc-detail-popover';o.className='nc-detail-overlay';
    o.innerHTML='<div class="nc-detail-card" role="dialog" aria-modal="true" aria-label="'+esc(n.title||'Melding')+'"><div class="nc-detail-head"><div class="nc-icon" style="background:'+esc(n.bg||'#ede9fe')+'">'+iconHtml(n)+'</div><div style="flex:1;min-width:0"><div class="nc-detail-title">'+esc(n.title||'Melding')+'</div>'+(state.statusLabel?'<div class="nc-detail-status">'+esc(state.statusLabel)+'</div>':'')+'</div><button type="button" class="nc-detail-close" data-detail-close="1" aria-label="Sluiten">✕</button></div><div class="nc-detail-body">'+esc(state.detail||n.body||'')+'</div>'+actionsHtml+'</div>';
    document.body.appendChild(o);
    o.onclick=function(e){if(e.target===o)closeDetail();};
    o.querySelector('[data-detail-close]').onclick=closeDetail;
    o.querySelectorAll('[data-detail-action]').forEach(function(btn){
      btn.onclick=function(){
        var action=btn.getAttribute('data-detail-action');
        Array.prototype.forEach.call(o.querySelectorAll('[data-detail-action]'),function(b){b.disabled=true;});
        Promise.resolve(NotificationActions.run(n,action)).then(function(){closeDetail();render();}).catch(function(err){
          Array.prototype.forEach.call(o.querySelectorAll('[data-detail-action]'),function(b){b.disabled=false;});
          refreshOpenDetail();
          if(typeof window.showToast==='function')window.showToast((err&&err.message)||'Actie is niet meer beschikbaar');
        });
      };
    });
    requestAnimationFrame(function(){o.classList.add('open');});
    document.addEventListener('keydown',detailEsc,true);
    if(markRead!==false&&window.NotificationStore&&n.id)NotificationStore.markRead(n.id).then(render);
  }
  function openDetail(n){renderDetail(n,true);}
  function refreshOpenDetail(){
    if(!activeDetailId)return;
    var event=window.NotificationActions&&NotificationActions.byId?NotificationActions.byId(activeDetailId):null;
    if(!event){closeDetail();return;}
    renderDetail(event,false);
  }
  function itemHtml(n){
    var uid=me(),read=!!(uid&&n.readBy&&n.readBy[uid]);
    var state=window.NotificationActions&&NotificationActions.describeStatus?NotificationActions.describeStatus(n):{statusLabel:'',detail:'',actions:[]};
    var pillCls=pillClassFor(state);
    var actor=n.actor&&n.actor.name?esc(n.actor.name)+' · ':'';
    var time=n.createdAt?new Date(n.createdAt).toLocaleString('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';
    return '<article class="nc-item'+(read?' is-read':'')+'" data-notif-id="'+esc(n.id)+'" tabindex="0" role="button">'
      +'<div class="nc-icon" style="background:'+esc(n.bg||'#ede9fe')+'">'+iconHtml(n)+'</div>'
      +'<div class="nc-copy"><div class="nc-title">'+esc(n.title||'Melding')+'</div><div class="nc-body">'+esc(n.body||'')+'</div>'
      +(state.statusLabel?'<span class="nc-pill'+(pillCls?' '+pillCls:'')+'">'+esc(state.statusLabel)+'</span>':'')
      +'<div class="nc-meta">'+actor+esc(time)+'</div></div>'
      +(!read?'<span class="nc-dot"></span>':'')+'</article>';
  }
  function render(){
    ensureStyles();var el=document.getElementById('notif-list');if(!el)return;
    if(!window.NotificationStore){el.innerHTML='<div style="padding:30px;text-align:center;color:var(--c-text2)">Meldingen worden geladen…</div>';return;}
    NotificationStore.ensureSubscription();var items=NotificationStore.list();
    el.innerHTML=items.map(itemHtml).join('')||'<div style="padding:30px;text-align:center;color:var(--c-text2)">Geen meldingen</div>';
    var dot=document.getElementById('notif-dot');if(dot)dot.style.display=NotificationStore.unreadCount()?'block':'none';
  }
  function syncPresentation(){render();refreshOpenDetail();}
  function install(){
    ensureStyles();window.renderNotifs=render;window.clearNotifs=function(){return window.NotificationStore?NotificationStore.markAllRead().then(syncPresentation):Promise.resolve();};
    document.addEventListener('click',function(ev){
      var row=ev.target&&ev.target.closest&&ev.target.closest('#notif-list [data-notif-id]');if(!row)return;
      var event=window.NotificationActions&&NotificationActions.byId?NotificationActions.byId(row.getAttribute('data-notif-id')):null;if(event)openDetail(event);
    },true);
    document.addEventListener('keydown',function(ev){
      if(ev.key!=='Enter'&&ev.key!==' ')return;var row=ev.target&&ev.target.closest&&ev.target.closest('#notif-list [data-notif-id]');if(!row)return;ev.preventDefault();var event=window.NotificationActions&&NotificationActions.byId?NotificationActions.byId(row.getAttribute('data-notif-id')):null;if(event)openDetail(event);
    },true);
    window.addEventListener('familyapp:notifications-changed',syncPresentation);
    window.addEventListener('familyapp:party-quests-updated',syncPresentation);
    window.addEventListener('familyapp:tasks-updated',syncPresentation);
  }
  window.NotificationCenter={version:VERSION,render:render,install:install,openDetail:openDetail,refreshOpenDetail:refreshOpenDetail};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();