'use strict';
// ============================================================
// PUSH NOTIFICATION SETTINGS v1.1.0 — STEP 10
// Explicit user-controlled opt-in surface. Never requests permission on load.
// ============================================================
(function(){
  if(window.PushNotificationSettings)return;
  var VERSION='1.1.0',installed=false,busy=false;

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function service(){return window.PushRegistrationService||null;}
  function ensureStyles(){
    if(document.getElementById('push-settings-style'))return;
    var s=document.createElement('style');s.id='push-settings-style';s.textContent=[
      '.push-settings-card{margin:0 14px 12px;padding:13px;border:1px solid var(--c-border);border-radius:17px;background:linear-gradient(145deg,var(--c-surface),var(--c-surface2));box-shadow:0 3px 12px rgba(15,23,42,.05)}',
      '.push-settings-head{display:flex;gap:10px;align-items:flex-start}',
      '.push-settings-icon{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;flex:0 0 auto;background:#ede9fe;font-size:19px}',
      '.push-settings-copy{flex:1;min-width:0}',
      '.push-settings-title{font-size:13px;font-weight:900;color:var(--c-text)}',
      '.push-settings-status{font-size:11.5px;line-height:1.4;color:var(--c-text2);margin-top:2px}',
      '.push-settings-btn{box-sizing:border-box;-webkit-appearance:none;appearance:none;margin-top:11px;width:100%;min-height:42px;border:0;border-radius:12px;padding:10px 13px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;font-size:12.5px;font-weight:850;cursor:pointer;touch-action:manipulation}',
      '.push-settings-btn.secondary{background:var(--c-surface2);color:var(--c-text2);border:1px solid var(--c-border)}',
      '.push-settings-btn:disabled{opacity:.55;cursor:default}',
      '.push-settings-note{font-size:9.5px;color:var(--c-text3);line-height:1.35;margin-top:7px}'
    ].join('\n');document.head.appendChild(s);
  }
  function card(){
    var el=document.getElementById('push-settings-card');if(el)return el;
    var list=document.getElementById('notif-list');if(!list||!list.parentNode)return null;
    el=document.createElement('section');el.id='push-settings-card';el.className='push-settings-card';el.setAttribute('aria-label','Pushmeldingen');
    list.parentNode.insertBefore(el,list);return el;
  }
  function view(st){
    st=st||{};
    if(!st.supported)return{status:'Pushmeldingen worden op dit apparaat of in deze browser niet ondersteund.',label:'Niet ondersteund',disabled:true,secondary:true,note:''};
    if(st.iosLike&&!st.standalone)return{status:'Op iPhone werken pushmeldingen nadat FamilyApp aan het beginscherm is toegevoegd en vanaf het app-icoon wordt geopend.',label:'Eerst op beginscherm zetten',disabled:true,secondary:true,note:'Open FamilyApp daarna via het beginscherm en schakel push hier in.'};
    if(st.vapidConfigured===false)return{status:'De Web Push-sleutel ontbreekt nog in de deploymentconfiguratie.',label:'Web Push-config ontbreekt',disabled:true,secondary:true,note:'FamilyApp vraagt geen notificatierechten zolang de publieke VAPID-configuratie niet klaar is.'};
    if(st.senderConfigured===false)return{status:'Web Push is voorbereid, maar de beveiligde FamilyApp sender is nog niet geactiveerd.',label:'Push sender ontbreekt',disabled:true,secondary:true,note:'Er wordt geen toestemming gevraagd totdat de serverdelivery veilig is geconfigureerd.'};
    if(!st.configured)return{status:'De push-deliveryconfiguratie is nog niet volledig beschikbaar.',label:'Pushconfiguratie ontbreekt',disabled:true,secondary:true,note:'Er wordt geen toestemming gevraagd zolang de delivery-configuratie niet compleet is.'};
    if(st.permission==='denied')return{status:'Pushmeldingen zijn door het apparaat geblokkeerd. Je kunt dit wijzigen in de notificatie-instellingen van FamilyApp.',label:'Geblokkeerd in instellingen',disabled:true,secondary:true,note:''};
    if(st.enabled)return{status:'Pushmeldingen staan aan voor dit account op dit apparaat.',label:'Pushmeldingen uitschakelen',disabled:false,secondary:true,note:'In-app meldingen blijven gewoon beschikbaar als push wordt uitgeschakeld.'};
    if(st.status==='registering')return{status:'Dit apparaat wordt veilig geregistreerd voor pushmeldingen…',label:'Bezig…',disabled:true,secondary:false,note:''};
    if(st.status==='error')return{status:'Pushregistratie kon niet worden afgerond. Je in-app meldingen blijven wel werken.',label:'Opnieuw proberen',disabled:false,secondary:false,note:st.reason||''};
    return{status:'Ontvang FamilyApp-meldingen ook wanneer de app niet open staat.',label:'Pushmeldingen inschakelen',disabled:false,secondary:false,note:'FamilyApp vraagt pas om toestemming nadat je op deze knop tikt.'};
  }
  function render(){
    ensureStyles();var el=card(),svc=service();if(!el)return;
    var st=svc&&svc.status?svc.status():{supported:false},v=view(st);
    el.innerHTML='<div class="push-settings-head"><div class="push-settings-icon">🔔</div><div class="push-settings-copy"><div class="push-settings-title">Pushmeldingen</div><div class="push-settings-status">'+esc(v.status)+'</div></div></div><button type="button" class="push-settings-btn'+(v.secondary?' secondary':'')+'" id="push-settings-action"'+((v.disabled||busy)?' disabled':'')+'>'+esc(busy?'Bezig…':v.label)+'</button>'+(v.note?'<div class="push-settings-note">'+esc(v.note)+'</div>':'');
    var btn=document.getElementById('push-settings-action');if(btn&&!v.disabled)btn.onclick=function(){
      if(busy||!svc)return;busy=true;render();
      var action=st.enabled?svc.disable('user-disabled'):svc.requestEnable();
      Promise.resolve(action).catch(function(error){
        var msg=String(error&&error.message||'');
        if(typeof window.showToast==='function'){
          if(/HOME_SCREEN_REQUIRED/.test(msg))window.showToast('Zet FamilyApp eerst op je beginscherm');
          else if(/VAPID_NOT_CONFIGURED/.test(msg))window.showToast('Web Push-configuratie ontbreekt nog');
          else if(/SENDER_NOT_CONFIGURED|DELIVERY_NOT_CONFIGURED/.test(msg))window.showToast('Push sender is nog niet geconfigureerd');
          else if(/PERMISSION_DENIED/.test(msg))window.showToast('Pushmeldingen zijn geblokkeerd');
          else window.showToast('Pushmeldingen konden niet worden aangepast');
        }
      }).finally(function(){busy=false;render();});
    };
  }
  function install(){if(installed)return;installed=true;render();window.addEventListener('familyapp:push-status',render);window.addEventListener('familyapp:notifications-changed',render);}
  window.PushNotificationSettings={version:VERSION,install:install,render:render};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();