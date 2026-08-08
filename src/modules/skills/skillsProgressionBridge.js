'use strict';
// ============================================================
// SKILLS PROGRESSION BRIDGE v1
// Makes the existing Skills page render from FamilyProgression only.
// ============================================================
(function(){
  if(window.SkillsProgressionBridge) return;
  var VERSION='1.0.0',wrapped=false,rerenderTimer=null;

  function currentName(){
    try{
      var u=window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser);
      return (u&&u.displayName)||window.myName||'Gebruiker';
    }catch(e){return window.myName||'Gebruiker';}
  }
  function currentAvatar(){
    try{
      var u=window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser);
      return (u&&u.photoURL)||localStorage.getItem('familyapp-current-user-avatar-v1')||'';
    }catch(e){return '';}
  }
  function syncFromProgression(){
    if(!window.FamilyProgression||!FamilyProgression.isReady||!FamilyProgression.isReady())return false;
    var st=FamilyProgression.getState();if(!st)return false;
    var name=currentName();
    if(!window.skillsData||typeof window.skillsData!=='object')window.skillsData={};
    if(!skillsData[name])skillsData[name]={};
    Object.keys(st.skills||{}).forEach(function(id){skillsData[name][id]=JSON.parse(JSON.stringify(st.skills[id]));});
    try{skillsViewPerson=name;}catch(e){}
    window.skillsViewPerson=name;
    return true;
  }
  function overallMeta(){
    if(!window.FamilyProgression||!FamilyProgression.getState)return null;
    var st=FamilyProgression.getState();if(!st)return null;
    var lv=st.level||1,total=st.totalXp||0;
    var base=FamilyProgression.totalXpForLevel(lv),next=FamilyProgression.totalXpForLevel(lv+1),span=Math.max(1,next-base),pct=Math.max(0,Math.min(100,Math.round((total-base)/span*100)));
    return{level:lv,totalXp:total,currentXp:Math.max(0,total-base),nextXp:span,pct:pct};
  }
  function polish(){
    var el=document.getElementById('skills-content');if(!el)return;
    var tabs=el.querySelector('.skills-person-tabs');if(tabs)tabs.remove();
    var name=currentName(),avatar=currentAvatar(),meta=overallMeta();
    var hero=el.firstElementChild;
    if(hero){
      var title=hero.querySelector('div[style*="font-size:20px"]');if(title)title.textContent=name+' · Skills';
      var avatarBox=hero.querySelector('div[style*="width:50px"][style*="height:50px"]');
      if(avatarBox){
        if(avatar){avatarBox.innerHTML='<img src="'+avatar.replace(/"/g,'&quot;')+'" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block">';}
        else avatarBox.textContent=name.substring(0,2).toUpperCase();
      }
      if(meta){
        var summary=document.createElement('div');summary.className='skills-account-progress';
        summary.style.cssText='margin-top:14px;padding:12px 13px;border-radius:15px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.16)';
        summary.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px"><div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;opacity:.72;font-weight:800">Account progression</div><div style="font-size:18px;font-weight:900">Level '+meta.level+'</div></div><div style="font-size:12px;font-weight:800">'+meta.totalXp+' XP totaal</div></div><div style="height:7px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden"><div style="height:100%;width:'+meta.pct+'%;border-radius:99px;background:#fff"></div></div><div style="font-size:10px;opacity:.78;margin-top:5px">'+meta.currentXp+' / '+meta.nextXp+' XP naar level '+(meta.level+1)+'</div>';
        hero.appendChild(summary);
      }
    }
  }
  function scheduleRender(){
    if(rerenderTimer)clearTimeout(rerenderTimer);
    rerenderTimer=setTimeout(function(){
      rerenderTimer=null;
      if(document.getElementById('skills-content')&&typeof window.renderSkills==='function'){syncFromProgression();window.renderSkills();}
    },80);
  }
  function wrap(){
    if(wrapped||typeof window.renderSkills!=='function')return false;
    var original=window.renderSkills;
    var replacement=function(){
      syncFromProgression();
      var result=original.apply(this,arguments);
      polish();
      return result;
    };
    replacement.__accountProgression=true;
    window.renderSkills=replacement;try{renderSkills=replacement;}catch(e){}
    wrapped=true;return true;
  }
  function boot(){
    var tries=0,t=setInterval(function(){tries++;if(wrap()||tries>100)clearInterval(t);},100);
    ['ready','xp','skill','levelup','saved'].forEach(function(type){window.addEventListener('familyapp:progression:'+type,scheduleRender);});
    window.addEventListener('familyapp:modules:ready',function(){wrap();scheduleRender();});
  }
  window.SkillsProgressionBridge={version:VERSION,boot:boot,sync:syncFromProgression};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
