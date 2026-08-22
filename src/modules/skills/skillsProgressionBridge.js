'use strict';
// ============================================================
// SKILLS PROGRESSION BRIDGE v1.0
// Replaces hardcoded Shane/Esra demo state with current UID progression.
// ============================================================
(function(){
  if(window.__skillsProgressionBridgeV1)return;
  window.__skillsProgressionBridgeV1=true;
  var installed=false,filter='all';
  function svc(){return window.FamilyProgression||null;}
  function defs(){return Array.isArray(window.SKILL_DEFS)?window.SKILL_DEFS:[];}
  function name(){return String(window.myName||localStorage.getItem('familyapp-profile-name-v1')||'Mijn account');}
  function state(){var s=svc();return s&&s.getState?s.getState():null;}
  function skillData(id){var st=state();return st&&st.skills&&st.skills[id]?st.skills[id]:{xp:0,log:[]};}
  function level(xp){try{return typeof window.skillLevelFromXp==='function'?window.skillLevelFromXp(xp):1;}catch(e){return 1;}}
  function xpIn(xp){try{return typeof window.skillXpInCurrentLevel==='function'?window.skillXpInCurrentLevel(xp):xp;}catch(e){return xp;}}
  function xpNext(xp){try{return typeof window.skillXpToNextLevel==='function'?window.skillXpToNextLevel(xp):100;}catch(e){return 100;}}
  function title(lv){try{return typeof window.getSkillTitle==='function'?window.getSkillTitle(lv):('Level '+lv);}catch(e){return'Level '+lv;}}
  function syncCompat(){
    var who=name(),compat={};compat[who]={};defs().forEach(function(d){var sk=skillData(d.id);compat[who][d.id]={xp:Number(sk.xp)||0,log:Array.isArray(sk.log)?sk.log.slice():[]};});
    window.skillsData=compat;try{skillsData=compat;}catch(e){}window.skillsViewPerson=who;try{skillsViewPerson=who;}catch(e){}
  }
  function render(){
    var el=document.getElementById('skills-content');if(!el)return;var s=svc(),st=state();
    if(!s||!st){el.innerHTML='<div style="padding:32px 16px;text-align:center;color:var(--c-text2)">Skills worden geladen…</div>';return;}
    syncCompat();
    var list=defs().map(function(d){var sk=skillData(d.id),xp=Number(sk.xp)||0;return Object.assign({},d,{xp:xp,log:Array.isArray(sk.log)?sk.log:[],level:level(xp)});});
    if(filter==='top')list=list.slice().sort(function(a,b){return b.xp-a.xp;}).slice(0,6);else if(filter==='recent')list=list.filter(function(x){return x.log.length;}).sort(function(a,b){var aa=a.log[a.log.length-1]||{},bb=b.log[b.log.length-1]||{};return String(bb.date||'').localeCompare(String(aa.date||''));});
    var totalLevels=defs().reduce(function(sum,d){return sum+level(skillData(d.id).xp||0);},0),best=list.slice().sort(function(a,b){return b.xp-a.xp;})[0]||{icon:'⚡',name:'Nog geen',level:1};
    var html='<div style="background:linear-gradient(135deg,var(--c-primary),#5b8f4a);color:#fff;padding:22px 16px 16px">'
      +'<div style="display:flex;align-items:center;gap:12px"><div style="width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900">'+name().substring(0,2).toUpperCase()+'</div>'
      +'<div style="min-width:0"><div style="font-size:20px;font-weight:850">'+name()+' · Skills</div><div style="font-size:12px;opacity:.82;margin-top:2px">'+totalLevels+' totale levels · Beste: '+best.icon+' '+best.name+'</div></div></div>'
      +'<div style="margin-top:12px;display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.14);padding:5px 9px;border-radius:999px;font-size:10px;font-weight:750">🔒 Accountgebonden · live opgeslagen</div></div>';
    html+='<div class="chips" style="padding:10px 16px 6px">'+[['all','Alle'],['top','🏆 Top 6'],['recent','🕐 Recent']].map(function(f){return'<div class="chip'+(filter===f[0]?' active':'')+'" data-sf="'+f[0]+'">'+f[1]+'</div>';}).join('')+'</div>';
    html+='<div style="padding:4px 0 90px">';
    if(!list.length)html+='<div style="text-align:center;padding:40px;color:var(--c-text2)">Nog geen skill-activiteit</div>';
    list.forEach(function(sk){var inLv=xpIn(sk.xp),to=xpNext(sk.xp),pct=to?Math.min(100,Math.round(inLv/to*100)):100,dots=sk.log.slice(-12).map(function(l){return'<div class="skill-hist-dot" style="background:'+sk.color+';opacity:'+(0.25+Math.min(1,(Number(l.xp)||0)/25)*.75)+'"></div>';}).join('');html+='<div class="skill-card"><div class="skill-top"><div class="skill-icon" style="background:'+sk.color+'22">'+sk.icon+'</div><div class="skill-info"><div class="skill-name">'+sk.name+'</div><div class="skill-title" style="color:'+sk.color+'">'+title(sk.level)+'</div></div><div class="skill-lvl-badge" style="background:'+sk.color+'">Lv '+sk.level+'</div></div><div class="skill-xp-row"><div class="skill-xp-bar"><div class="skill-xp-fill" style="width:'+pct+'%;background:'+sk.color+'"></div></div><div class="skill-xp-txt">'+inLv+' / '+to+' XP</div></div>'+(dots?'<div class="skill-history">'+dots+'</div>':'')+'<div class="skill-actions" style="flex-direction:column;gap:5px"><div style="font-size:11px;color:var(--c-text2);line-height:1.55"><b style="color:var(--c-text)">+'+sk.xpPerDo+' Skill XP</b> wanneer een passende taak wordt voltooid.</div></div></div>';});
    html+='</div>';el.innerHTML=html;el.querySelectorAll('[data-sf]').forEach(function(c){c.onclick=function(){filter=c.dataset.sf;render();};});
  }
  function log(person,skillId){var d=defs().find(function(x){return x.id===skillId;}),s=svc();if(!d||!s)return null;var before=skillData(skillId).xp||0,res=s.awardSkill(skillId,d.xpPerDo,{source:'manual-skill',eventId:'manual-skill:'+skillId+':'+Date.now().toString(36)});var after=before+d.xpPerDo,oldLv=level(before),newLv=level(after);try{if(typeof window.showSkillXpIndicator==='function')window.showSkillXpIndicator(d);}catch(e){}try{if(newLv>oldLv&&typeof window.showSkillLevelUp==='function')window.showSkillLevelUp(name(),d,newLv);else if(typeof window.showToast==='function')window.showToast(d.icon+' '+d.name+' +'+d.xpPerDo+' XP');}catch(e){}try{if(typeof window.checkAchievements==='function')setTimeout(function(){window.checkAchievements();},0);}catch(e){}return res;}
  function save(){return true;}
  function install(){if(installed)return true;if(!defs().length||typeof window.renderSkills!=='function')return false;window.renderSkills=render;window.logSkill=log;window.saveSkills=save;installed=true;syncCompat();return true;}
  function start(){var s=svc();if(s&&typeof s.refreshDefinitions==='function')s.refreshDefinitions();install();syncCompat();try{var screen=document.getElementById('screen-skills');if(screen&&screen.classList.contains('active'))render();}catch(e){}}
  window.SkillsProgressionBridge={version:'1.0.0',start:start,render:render,status:function(){var s=svc();return{installed:installed,ready:!!(s&&s.isReady&&s.isReady()),uid:s&&s.getUid?s.getUid():null};}};
  window.addEventListener('familyapp:progression:ready',start);window.addEventListener('familyapp:progression:updated',function(){syncCompat();try{var screen=document.getElementById('screen-skills');if(screen&&screen.classList.contains('active'))render();}catch(e){}});window.addEventListener('load',start,{once:true});
  if(document.readyState==='complete')start();else Promise.resolve().then(start);
})();
