'use strict';
// ============================================================
// SKILLS PROGRESSION BRIDGE v2
// Single-user account Skills UI backed only by FamilyProgression.
// Reuses the app-selected avatar and removes legacy person switching.
// ============================================================
(function(){
  if(window.SkillsProgressionBridgeV2) return;
  window.SkillsProgressionBridgeV2=true;

  var VERSION='2.0.0',wrapped=false,rerenderTimer=null,observer=null,repairing=false;

  function currentUser(){
    try{return window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||null;}catch(e){return null;}
  }
  function currentName(){
    var u=currentUser();
    try{return localStorage.getItem('familyapp-profile-name-v1')||(u&&u.displayName)||window.myName||'Gebruiker';}catch(e){return (u&&u.displayName)||window.myName||'Gebruiker';}
  }
  function currentAvatar(){
    // The selected FamilyApp avatar is authoritative. Google photo is only a
    // fallback, otherwise pages can show different identities for one user.
    var selected='';
    try{selected=localStorage.getItem('familyapp-current-user-avatar-v1')||'';}catch(e){}
    if(selected)return selected;
    var u=currentUser();
    return (u&&u.photoURL)||'';
  }
  function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  function syncFromProgression(){
    if(!window.FamilyProgression||!FamilyProgression.isReady||!FamilyProgression.isReady())return false;
    var st=FamilyProgression.getState();if(!st)return false;
    var name=currentName();
    if(!window.skillsData||typeof window.skillsData!=='object')window.skillsData={};
    skillsData[name]={};
    Object.keys(st.skills||{}).forEach(function(id){skillsData[name][id]=JSON.parse(JSON.stringify(st.skills[id]));});
    window.skillsViewPerson=name;try{skillsViewPerson=name;}catch(e){}
    return true;
  }
  function overallMeta(){
    if(!window.FamilyProgression||!FamilyProgression.getState)return null;
    var st=FamilyProgression.getState();if(!st)return null;
    var lv=st.level||1,total=st.totalXp||0;
    var base=FamilyProgression.totalXpForLevel(lv),next=FamilyProgression.totalXpForLevel(lv+1),span=Math.max(1,next-base);
    return{state:st,level:lv,totalXp:total,currentXp:Math.max(0,total-base),nextXp:span,pct:Math.max(0,Math.min(100,Math.round((total-base)/span*100)))};
  }
  function skillSummary(st){
    var defs=window.SKILL_DEFS||[],skills=st&&st.skills||{};
    var totalLevels=0,best=null;
    defs.forEach(function(def){
      var sk=skills[def.id]||{xp:0},xp=Number(sk.xp)||0;
      var level=typeof window.skillLevelFromXp==='function'?skillLevelFromXp(xp):1;
      totalLevels+=level;
      if(!best||xp>best.xp)best={def:def,xp:xp,level:level};
    });
    return{totalLevels:totalLevels,best:best};
  }
  function injectCss(){
    if(document.getElementById('skills-progression-v2-css'))return;
    var s=document.createElement('style');s.id='skills-progression-v2-css';
    s.textContent='\n#skills-content .skills-person-tabs{display:none!important}\n.skills-v2-hero{padding:22px 20px 20px!important;background:radial-gradient(circle at 88% 12%,rgba(153,230,117,.28),transparent 34%),linear-gradient(145deg,#153a1a 0%,#276527 58%,#3d8535 100%)!important;color:#fff;box-shadow:inset 0 -1px rgba(255,255,255,.10)}\n.skills-v2-head{display:flex;align-items:center;gap:14px}.skills-v2-avatar{width:68px;height:68px;border-radius:22px;overflow:hidden;display:grid;place-items:center;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.24);box-shadow:0 10px 28px rgba(0,0,0,.20);font-size:23px;font-weight:900;flex:0 0 auto}.skills-v2-avatar img{width:100%;height:100%;object-fit:cover;display:block}.skills-v2-name{font-size:24px;font-weight:950;letter-spacing:-.45px;line-height:1.05}.skills-v2-sub{font-size:12px;opacity:.78;font-weight:650;margin-top:5px}.skills-v2-level{margin-left:auto;min-width:54px;height:54px;border-radius:18px;display:grid;place-items:center;background:rgba(11,20,15,.38);border:1px solid rgba(255,255,255,.17);font-size:13px;font-weight:900;text-align:center;line-height:1.05}.skills-v2-progress{margin-top:18px;padding:13px 14px;background:rgba(7,18,10,.26);border:1px solid rgba(255,255,255,.13);border-radius:17px}.skills-v2-progress-top{display:flex;align-items:end;justify-content:space-between;gap:12px}.skills-v2-total{font-size:18px;font-weight:950}.skills-v2-caption{font-size:10px;text-transform:uppercase;letter-spacing:.65px;opacity:.68;font-weight:800}.skills-v2-xp{font-size:12px;font-weight:850;opacity:.92}.skills-v2-bar{height:7px;background:rgba(255,255,255,.17);border-radius:999px;overflow:hidden;margin-top:9px}.skills-v2-fill{height:100%;background:linear-gradient(90deg,#fff,#c7ffb5);border-radius:999px}.skills-v2-next{font-size:10px;opacity:.7;margin-top:5px}.skills-v2-best{display:flex;gap:8px;align-items:center;margin-top:12px;font-size:11px;font-weight:750;opacity:.86}.skills-v2-best span{padding:5px 9px;border-radius:999px;background:rgba(255,255,255,.11)}';
    document.head.appendChild(s);
  }
  function rebuildHero(){
    var el=document.getElementById('skills-content');if(!el)return;
    var hero=el.firstElementChild;if(!hero)return;
    var meta=overallMeta();if(!meta)return;
    var name=currentName(),avatar=currentAvatar(),summary=skillSummary(meta.state),best=summary.best;
    hero.classList.add('skills-v2-hero');
    var avatarHtml=avatar?'<img src="'+esc(avatar)+'" alt="">':esc(name.substring(0,2).toUpperCase());
    var bestHtml=best?'<span>'+esc(best.def.icon)+' '+esc(best.def.name)+' · Lv '+best.level+'</span>':'<span>Nog geen skill-XP</span>';
    hero.innerHTML='<div class="skills-v2-head"><div class="skills-v2-avatar">'+avatarHtml+'</div><div style="min-width:0"><div class="skills-v2-name">'+esc(name)+'</div><div class="skills-v2-sub">'+summary.totalLevels+' skill-levels opgebouwd</div></div><div class="skills-v2-level">LV<br>'+meta.level+'</div></div><div class="skills-v2-progress"><div class="skills-v2-progress-top"><div><div class="skills-v2-caption">Account progression</div><div class="skills-v2-total">'+meta.totalXp+' XP</div></div><div class="skills-v2-xp">'+meta.currentXp+' / '+meta.nextXp+' XP</div></div><div class="skills-v2-bar"><div class="skills-v2-fill" style="width:'+meta.pct+'%"></div></div><div class="skills-v2-next">Nog '+Math.max(0,meta.nextXp-meta.currentXp)+' XP tot level '+(meta.level+1)+'</div><div class="skills-v2-best">Beste skill '+bestHtml+'</div></div>';
  }
  function repairDom(){
    if(repairing)return;repairing=true;
    try{
      injectCss();
      var el=document.getElementById('skills-content');if(!el)return;
      el.querySelectorAll('.skills-person-tabs').forEach(function(node){node.remove();});
      syncFromProgression();rebuildHero();
    }finally{repairing=false;}
  }
  function startObserver(){
    var el=document.getElementById('skills-content');if(!el||observer)return;
    observer=new MutationObserver(function(){setTimeout(repairDom,0);});
    observer.observe(el,{childList:true,subtree:true});
  }
  function scheduleRender(){
    if(rerenderTimer)clearTimeout(rerenderTimer);
    rerenderTimer=setTimeout(function(){
      rerenderTimer=null;
      syncFromProgression();
      if(document.getElementById('skills-content')&&typeof window.renderSkills==='function')window.renderSkills();
      repairDom();startObserver();
    },60);
  }
  function wrap(){
    if(wrapped||typeof window.renderSkills!=='function')return false;
    var original=window.renderSkills;
    var replacement=function(){
      syncFromProgression();
      var result=original.apply(this,arguments);
      repairDom();startObserver();
      return result;
    };
    replacement.__accountProgressionV2=true;
    window.renderSkills=replacement;try{renderSkills=replacement;}catch(e){}
    wrapped=true;return true;
  }
  function boot(){
    injectCss();
    var tries=0,t=setInterval(function(){tries++;wrap();repairDom();startObserver();if(tries>120)clearInterval(t);},100);
    ['ready','xp','skill','levelup','saved'].forEach(function(type){window.addEventListener('familyapp:progression:'+type,scheduleRender);});
    window.addEventListener('familyapp:avatar-updated',scheduleRender);
    window.addEventListener('familyapp:modules:ready',scheduleRender);
  }
  window.SkillsProgressionBridge={version:VERSION,boot:boot,sync:syncFromProgression,repair:repairDom};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
