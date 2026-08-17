'use strict';
// ============================================================
// SKILLS PROGRESSION BRIDGE v4.0.0
// Current UID presentation and writes via FamilyProgression only.
// ============================================================
(function(){
  if(window.SkillsProgressionBridge&&window.SkillsProgressionBridge.version==='4.0.0')return;
  var wrapped=false,originalRender=null;
  function hc(){return window.HouseholdContext||null;}function engine(){return window.FamilyProgression||null;}
  function context(){try{return hc()&&hc().current?hc().current():null;}catch(e){return null;}}
  function members(){try{return window.HouseholdIdentityFirebaseBridge&&HouseholdIdentityFirebaseBridge.getMembers?HouseholdIdentityFirebaseBridge.getMembers()||[]:[];}catch(e){return[];}}
  function member(){var c=context();return c&&members().find(function(m){return String(m.uid||m.id)===String(c.uid);})||null;}
  function name(){var m=member();return m&&(m.displayName||m.name)||'Gezinslid';}
  function avatar(){var m=member();return m&&(m.avatar||m.avatarUrl||m.photoURL||m.profilePhoto)||'';}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function sync(){var e=engine();if(!e||!e.isReady||!e.isReady())return false;var st=e.getState();if(!st)return false;var key=name();window.skillsData=window.skillsData||{};window.skillsData[key]={};(window.SKILL_DEFS||[]).forEach(function(def){var s=st.skills&&st.skills[def.id]||{xp:0,log:[]};window.skillsData[key][def.id]=JSON.parse(JSON.stringify(s));});window.skillsViewPerson=key;try{skillsViewPerson=key;}catch(err){}window.myXP=Number(st.totalXp)||0;return true;}
  function injectCss(){if(document.getElementById('skills-progression-v4-css'))return;var s=document.createElement('style');s.id='skills-progression-v4-css';s.textContent='#skills-content .skills-person-tabs{display:none!important}.skills-v4-identity{display:flex;align-items:center;gap:12px;margin-bottom:12px}.skills-v4-avatar{width:50px;height:50px;border-radius:18px;overflow:hidden;display:grid;place-items:center;background:rgba(255,255,255,.2);font-weight:900}.skills-v4-avatar img{width:100%;height:100%;object-fit:cover}.skills-v4-meta{font-size:10px;opacity:.7;margin-top:3px}';document.head.appendChild(s);}
  function repair(){injectCss();var el=document.getElementById('skills-content');if(!el)return;el.querySelectorAll('.skills-person-tabs').forEach(function(n){n.remove();});var hero=el.firstElementChild,c=context();if(!hero||!c||!c.uid)return;var a=avatar(),n=name(),identity=hero.querySelector('.skills-v4-identity');if(!identity){identity=document.createElement('div');identity.className='skills-v4-identity';hero.insertBefore(identity,hero.firstChild);}identity.innerHTML='<div class="skills-v4-avatar">'+(a?'<img src="'+esc(a)+'" alt="">':esc(n.substring(0,2).toUpperCase()))+'</div><div><div style="font-size:20px;font-weight:900">'+esc(n)+' Skills</div><div class="skills-v4-meta">Persoonlijke progression · UID '+esc(String(c.uid).slice(0,8))+'…</div></div>';}
  function render(){if(sync()&&typeof originalRender==='function')originalRender();repair();}
  function install(){
    injectCss();
    if(!wrapped&&typeof window.renderSkills==='function'){originalRender=window.renderSkills;window.renderSkills=function(){sync();var r=originalRender.apply(this,arguments);repair();return r;};wrapped=true;}
    window.saveSkills=function(){};
    window.logSkill=function(person,skillId){var c=context(),e=engine(),def=(window.SKILL_DEFS||[]).find(function(d){return d.id===skillId;});if(!c||!c.uid||!e||!e.isReady||!e.isReady()||!def)return Promise.resolve(false);var requested=String(person||''),currentName=name();if(requested&&requested!==currentName&&requested!==String(c.uid)){if(window.showToast)showToast('Skill XP wordt alleen aan het actieve account toegekend');return Promise.resolve(false);}var eventId='manual-skill:'+c.uid+':'+skillId+':'+Date.now();var result=e.awardSkill(skillId,def.xpPerDo,{eventId:eventId,source:'skills-ui'});if(result&&typeof window.showXPPopup==='function')showXPPopup(def.xpPerDo,def.name);var account=e.awardXp(Math.floor(def.xpPerDo/3),{eventId:eventId+':account',type:'skill',source:def.name});return e.persist().then(function(){sync();if(window.showToast)showToast(def.icon+' '+currentName+' deed '+def.name+'! +'+def.xpPerDo+' XP');render();return{skill:result,account:account};});};
    sync();repair();return true;
  }
  function boot(){var e=engine();if(e&&e.load)e.load().then(function(){install();render();});else install();}
  window.SkillsProgressionBridge={version:'4.0.0',boot:boot,sync:sync,repair:repair,render:render,status:function(){return{context:context(),ready:!!(engine()&&engine().isReady&&engine().isReady()),wrapped:wrapped};}};
  ['ready','xp','skill','levelup','streak','achievement'].forEach(function(type){window.addEventListener('familyapp:progression:'+type,function(){install();render();});});window.addEventListener('familyapp:household-context-changed',boot);window.addEventListener('familyapp:household-members-updated',render);window.addEventListener('familyapp:avatar-updated',render);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
