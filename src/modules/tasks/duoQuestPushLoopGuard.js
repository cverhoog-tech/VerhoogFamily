'use strict';
(function(){
  if(window.__duoQuestPushLoopGuardV1)return;
  window.__duoQuestPushLoopGuardV1=true;

  function install(){
    if(typeof window._oanotif!=='function'||typeof window.sendPushToPartner!=='function')return false;
    var localNotif=window._oanotif;
    var sendPush=window.sendPushToPartner;

    window.addNotif=function(icon,bg,title,body){
      localNotif(icon,bg,title,body);
      try{sendPush(title,body,icon);}catch(e){}
    };

    window.showPushBanner=function(n){
      if(!n)return;
      var el=document.createElement('div');
      el.style.cssText='position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:400;background:var(--c-surface);border-radius:14px;padding:12px 16px;box-shadow:0 4px 20px rgba(0,0,0,.2);display:flex;align-items:center;gap:10px;min-width:240px;max-width:90%;animation:achSlideIn .3s ease;cursor:pointer;border-left:4px solid var(--c-primary)';
      el.innerHTML='<div style="font-size:22px">'+(n.icon||'🔔')+'</div><div style="flex:1"><div style="font-size:12px;font-weight:700;color:var(--c-text)">'+String(n.title||'Melding')+'</div><div style="font-size:11px;color:var(--c-text2)">'+String(n.body||'')+'</div></div><div style="font-size:10px;color:var(--c-text3)">'+String(n.from||'')+'</div>';
      el.onclick=function(){el.remove();};
      document.body.appendChild(el);
      setTimeout(function(){if(el.parentNode){el.style.animation='achSlideOut .3s ease forwards';setTimeout(function(){el.remove();},300);}},5000);
      try{localNotif(n.icon||'🔔','#ede9fe',n.title,n.body);}catch(e){}
    };
    return true;
  }

  if(install())return;
  var tries=0,t=setInterval(function(){tries++;if(install()||tries>40)clearInterval(t);},100);
})();
