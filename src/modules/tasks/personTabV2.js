'use strict';
// ============================================================
// PERSON TAB V2
// Clean UID-first renderer over PersonDashboardService.
// Hero backdrop and character portrait are separate presentation layers.
// ============================================================
(function(){
  if(window.PersonTabV2)return;

  var VERSION='2.3.0';
  var target=null;
  var selectedUid=null;
  var unsubscribe=null;
  var lastModels=[];

  function esc(value){
    return String(value==null?'':value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }
  function clamp(value){return Math.max(0,Math.min(100,Math.round(Number(value)||0)));}
  function initials(member){if(member&&member.initials)return member.initials;return String(member&&member.displayName||'?').split(/\s+/).filter(Boolean).map(function(part){return part.charAt(0);}).join('').slice(0,2).toUpperCase()||'?';}
  function currentModel(models){if(!models.length)return null;var chosen=selectedUid&&models.find(function(model){return model.uid===selectedUid;});if(!chosen)chosen=models.find(function(model){return model.member&&model.member.isCurrent;})||models[0];selectedUid=chosen.uid;return chosen;}
  function presenceState(model){return String(model&&model.presence&&model.presence.state||'offline');}
  function presenceText(model){var p=model&&model.presence||{};if(p.state==='online')return p.area?'Online · '+String(p.area):'Online';if(p.state==='recent')return'Recent actief';if(p.state==='today')return'Vandaag actief';return'Offline';}
  function avatarHtml(model,large){var member=model.member||{},src=member.avatar||'',cls=large?'pt2-avatar pt2-avatar-large':'pt2-avatar';if(src)return'<img class="'+cls+'" src="'+esc(src)+'" alt="'+esc(member.displayName||'Gezinslid')+'">';return'<div class="'+cls+' pt2-avatar-fallback">'+esc(initials(member))+'</div>';}
  function memberRail(models){return'<div class="pt2-members" role="list">'+models.map(function(model){var member=model.member||{},active=model.uid===selectedUid,state=presenceState(model);return'<button type="button" class="pt2-member'+(active?' is-active':'')+'" data-pt2-member="'+esc(model.uid)+'" role="listitem"><span class="pt2-avatar-shell">'+avatarHtml(model,false)+'<i class="pt2-status-dot is-'+esc(state)+'"></i></span><span class="pt2-member-name">'+esc(member.displayName||'Gezinslid')+'</span><span class="pt2-member-state">'+esc(state==='online'?'Online':state==='recent'?'Recent':state==='today'?'Vandaag':'Offline')+'</span></button>';}).join('')+'</div>';}
  function heroBackdropHtml(member){
    var media=member.heroMedia||{};
    var url=media.url||member.avatar||'';
    if(!url)return'';
    var x=Math.max(0,Math.min(1,Number(media.focalX)));if(!isFinite(x))x=.5;
    var y=Math.max(0,Math.min(1,Number(media.focalY)));if(!isFinite(y))y=.5;
    return'<div class="pt2-hero-backdrop-layer" style="--pt2-focal-x:'+(x*100).toFixed(2)+'%;--pt2-focal-y:'+(y*100).toFixed(2)+'%"><img src="'+esc(url)+'" alt=""></div>';
  }
  function characterPortraitHtml(member){
    if(member.avatar)return'<div class="pt2-hero-character"><img src="'+esc(member.avatar)+'" alt="'+esc(member.displayName||'Gezinslid')+'"></div>';
    return'<div class="pt2-hero-character pt2-hero-character-fallback">'+esc(initials(member))+'</div>';
  }
  function hero(model){
    var member=model.member||{},progress=model.progression||{},prev=Number(progress.previousLevelXp||0),next=Number(progress.nextLevelXp||prev+1),xp=Number(progress.xp||0),pct=next>prev?clamp(((xp-prev)/(next-prev))*100):0;
    return'<section class="pt2-hero">'
      +heroBackdropHtml(member)
      +'<div class="pt2-hero-shade"></div>'
      +characterPortraitHtml(member)
      +'<div class="pt2-level"><span>LEVEL</span><strong>'+esc(progress.level||1)+'</strong></div>'
      +'<div class="pt2-hero-body">'
        +'<div class="pt2-hero-name"><h2>'+esc(member.displayName||'Gezinslid')+'</h2><p>'+esc(progress.title||'Avonturier')+'</p></div>'
        +'<div class="pt2-presence is-'+esc(presenceState(model))+'"><i></i>'+esc(presenceText(model))+'</div>'
        +'<div class="pt2-xp-meta"><span>'+xp.toLocaleString('nl-NL')+' XP</span><span>'+next.toLocaleString('nl-NL')+' XP</span></div>'
        +'<div class="pt2-progress"><i style="width:'+pct+'%"></i></div>'
      +'</div>'
    +'</section>';
  }
  function statCard(icon,value,label){return'<div class="pt2-stat"><span class="pt2-stat-icon">'+icon+'</span><strong>'+esc(value)+'</strong><small>'+esc(label)+'</small></div>';}
  function stats(model){var q=model.quests||{},g=model.progression||{};return'<section class="pt2-section"><h3>Jouw avontuur</h3><div class="pt2-stats">'+statCard('⬡',g.level||1,'Level')+statCard('🔥',g.streak==null?'—':g.streak,'Streak')+statCard('⚔️',q.completedCount||0,'Quests')+statCard('✦',q.earnedXpThisWeek||0,'XP/week')+'</div></section>';}
  function questIcon(task){var type=String(task&&task.type||'').toUpperCase();if(type.indexOf('RAID')>-1)return'⚔️';if(type.indexOf('DUNGEON')>-1)return'🏰';return'✦';}
  function quests(model){var list=((model.quests&&model.quests.active)||[]).slice(0,3),body=list.length?'<div class="pt2-quest-list">'+list.map(function(task){return'<article class="pt2-quest"><span class="pt2-quest-icon">'+questIcon(task)+'</span><div class="pt2-quest-copy"><strong>'+esc(task.title||'Taak')+'</strong><small>'+esc(task.dueDate||'Actieve quest')+'</small></div><b>+'+esc(task.xp||0)+' XP</b></article>';}).join('')+'</div>':'<div class="pt2-empty">Geen actieve quests voor dit gezinslid.</div>';return'<section class="pt2-section"><div class="pt2-section-head"><h3>Actieve quests</h3><button type="button" data-pt2-tasks>Alles bekijken</button></div>'+body+'</section>';}
  function achievements(model){var list=((model.achievements&&model.achievements.recent)||[]).slice(0,4);if(!list.length)return'<section class="pt2-section"><h3>Achievements</h3><div class="pt2-empty">Nog geen achievements ontgrendeld.</div></section>';return'<section class="pt2-section"><h3>Achievements</h3><div class="pt2-achievements">'+list.map(function(item){return'<div class="pt2-achievement"><span>🏆</span><strong>'+esc(item.id||'Achievement')+'</strong></div>';}).join('')+'</div></section>';}
  function renderModels(models){if(!target)return;lastModels=Array.isArray(models)?models.slice():[];var selected=currentModel(lastModels);if(!selected){target.innerHTML='<div class="person-tab-v2"><div class="pt2-empty pt2-empty-main">Geen gezinsleden beschikbaar.</div></div>';return;}target.innerHTML='<div class="person-tab-v2">'+memberRail(lastModels)+hero(selected)+stats(selected)+quests(selected)+achievements(selected)+'</div>';bindUi();}
  function bindUi(){if(!target)return;target.querySelectorAll('[data-pt2-member]').forEach(function(button){button.addEventListener('click',function(){selectedUid=button.getAttribute('data-pt2-member');renderModels(lastModels);});});var tasks=target.querySelector('[data-pt2-tasks]');if(tasks)tasks.addEventListener('click',function(){if(typeof window.setTaskTab==='function')window.setTaskTab('compact',document.querySelector('#screen-tasks .task-tabs .ttab'));});}
  function connectService(){if(!window.PersonDashboardService)return false;if(unsubscribe){try{unsubscribe();}catch(e){}unsubscribe=null;}unsubscribe=window.PersonDashboardService.subscribe(function(models){renderModels(models);});return true;}
  function render(el){target=el||document.getElementById('task-content');if(!target)return;target.innerHTML='<div class="person-tab-v2"><div class="pt2-loading">Persoonsdashboard laden…</div></div>';if(connectService())return;var tries=0,timer=setInterval(function(){tries++;if(connectService()||tries>=20)clearInterval(timer);},100);}
  function destroy(){if(unsubscribe){try{unsubscribe();}catch(e){}unsubscribe=null;}target=null;lastModels=[];}

  window.PersonTabV2={version:VERSION,render:render,destroy:destroy,selectedUid:function(){return selectedUid;}};
})();
