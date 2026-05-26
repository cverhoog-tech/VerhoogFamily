'use strict';
// ============================================================
// GROUP QUEST REWARD POLISH v0.283
// Adds RPG feedback around group quest join/contribute/completion.
// Safe wrapper layer: does not change quest storage or engine logic.
// ============================================================

(function(){
  var STYLE_ID = 'group-quest-reward-polish-style';
  var wrapped = false;
  var lastCompleted = {};

  function injectStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.gqrToast{position:fixed;left:50%;top:16px;z-index:12000;transform:translateX(-50%) translateY(-18px);opacity:0;pointer-events:none;width:min(92vw,420px);border-radius:24px;padding:14px 16px;background:linear-gradient(135deg,rgba(17,24,39,.96),rgba(49,95,44,.94));color:#fff;border:1px solid rgba(255,255,255,.18);box-shadow:0 24px 70px rgba(0,0,0,.34);backdrop-filter:blur(18px);transition:opacity .28s ease,transform .28s ease;font-weight:900}',
      '.gqrToast.show{opacity:1;transform:translateX(-50%) translateY(0)}',
      '.gqrToast .k{display:flex;align-items:center;gap:9px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#bbf7d0;margin-bottom:4px}',
      '.gqrToast .t{font-size:18px;line-height:1.08;letter-spacing:-.3px}.gqrToast .s{font-size:12px;line-height:1.35;color:rgba(255,255,255,.76);margin-top:4px}',
      '.gqrBurst{position:fixed;inset:0;z-index:11999;pointer-events:none;overflow:hidden}.gqrBurst i{position:absolute;top:50%;left:50%;font-style:normal;font-size:22px;animation:gqrPop .9s ease-out forwards}',
      '@keyframes gqrPop{0%{transform:translate(-50%,-50%) scale(.4);opacity:0}12%{opacity:1}100%{transform:translate(var(--x),var(--y)) scale(1.15) rotate(var(--r));opacity:0}}',
      '.gq-card.just-completed{animation:gqrGlow 1.1s ease-out}.gq-card.just-contributed{animation:gqrPulse .52s ease-out}',
      '@keyframes gqrGlow{0%{box-shadow:0 0 0 rgba(250,204,21,0)}28%{box-shadow:0 0 0 4px rgba(250,204,21,.35),0 28px 80px rgba(250,204,21,.22)}100%{box-shadow:inherit}}',
      '@keyframes gqrPulse{0%{transform:scale(1)}45%{transform:scale(1.018)}100%{transform:scale(1)}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function toast(kind, title, sub){
    injectStyles();
    var old = document.querySelector('.gqrToast');
    if(old) old.remove();
    var el = document.createElement('div');
    el.className = 'gqrToast';
    el.innerHTML = '<div class="k">'+kind+'</div><div class="t">'+escapeHtml(title)+'</div><div class="s">'+escapeHtml(sub || '')+'</div>';
    document.body.appendChild(el);
    requestAnimationFrame(function(){ el.classList.add('show'); });
    setTimeout(function(){ el.classList.remove('show'); setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 350); }, 2600);
  }

  function burst(){
    injectStyles();
    var root = document.createElement('div');
    root.className = 'gqrBurst';
    var icons = ['✨','⚔️','🏆','⭐','💚','🔥','+XP'];
    for(var i=0;i<22;i++){
      var p = document.createElement('i');
      p.textContent = icons[i % icons.length];
      p.style.setProperty('--x', ((Math.random()*320)-160) + 'px');
      p.style.setProperty('--y', ((Math.random()*-280)-50) + 'px');
      p.style.setProperty('--r', ((Math.random()*80)-40) + 'deg');
      p.style.left = (44 + Math.random()*12) + '%';
      p.style.top = (48 + Math.random()*10) + '%';
      p.style.animationDelay = (Math.random()*0.16) + 's';
      root.appendChild(p);
    }
    document.body.appendChild(root);
    setTimeout(function(){ if(root.parentNode) root.parentNode.removeChild(root); }, 1300);
  }

  function escapeHtml(v){ return String(v || '').replace(/[&<>\"]/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'})[ch] || ch; }); }

  function snapshotQuest(id){
    try {
      if(typeof window.loadGroupQuests !== 'function') return null;
      var list = window.loadGroupQuests() || [];
      return list.find(function(q){ return String(q.id) === String(id); }) || null;
    } catch(e){ return null; }
  }

  function progressPct(q){
    if(!q) return 0;
    return Math.min(100, Math.round(((q.progress || 0) / Math.max(1, q.target || 1)) * 100));
  }

  function rewardFor(q){
    try {
      if(window.getGroupQuestReward) return window.getGroupQuestReward(q).total || 0;
    } catch(e) {}
    return q && q.xp ? q.xp : 100;
  }

  function markCard(id, cls){
    setTimeout(function(){
      var card = document.querySelector('.gq-actions button[onclick*="'+id+'"]');
      card = card ? card.closest('.gq-card') : null;
      if(!card) return;
      card.classList.add(cls);
      setTimeout(function(){ card.classList.remove(cls); }, 1200);
    }, 80);
  }

  function noteActivity(icon, text){
    try { if(typeof window.addActivity === 'function') window.addActivity(icon, '#dcfce7', text); } catch(e) {}
  }

  function wrapFunction(name, handler){
    var original = window[name];
    if(typeof original !== 'function' || original.__gqRewardPolish) return false;
    var wrappedFn = function(){
      var args = Array.prototype.slice.call(arguments);
      var before = snapshotQuest(args[0]);
      var result = original.apply(this, arguments);
      setTimeout(function(){ handler(args, before, snapshotQuest(args[0])); }, 120);
      return result;
    };
    wrappedFn.__gqRewardPolish = true;
    window[name] = wrappedFn;
    return true;
  }

  function onJoin(args, before, after){
    if(!after) return;
    toast('Party joined', 'Je bent toegetreden tot de quest', after.title || 'Group quest');
    markCard(after.id, 'just-contributed');
    noteActivity('⚔️', (window.myName || 'Iemand') + ' joined group quest "' + (after.title || 'Quest') + '"');
  }

  function onLeave(args, before, after){
    var q = after || before;
    if(!q) return;
    toast('Party update', 'Je hebt de party verlaten', q.title || 'Group quest');
    noteActivity('🛡️', (window.myName || 'Iemand') + ' verliet group quest "' + (q.title || 'Quest') + '"');
  }

  function onContribute(args, before, after){
    if(!after) return;
    var beforePct = progressPct(before);
    var afterPct = progressPct(after);
    var title = after.title || 'Group quest';
    markCard(after.id, 'just-contributed');

    var completed = after.status === 'completed' || afterPct >= 100;
    if(completed && !lastCompleted[after.id]){
      lastCompleted[after.id] = true;
      burst();
      toast('Raid completed', title, '+' + rewardFor(after) + ' team XP verdiend');
      noteActivity('🏆', 'Group quest voltooid: "' + title + '"');
      try { if(typeof window.awardXP === 'function') window.awardXP(Math.max(10, Math.round(rewardFor(after) / 8)), 'Group quest voltooid'); } catch(e) {}
      markCard(after.id, 'just-completed');
      return;
    }

    if(afterPct > beforePct){
      toast('Bijdrage toegevoegd', title, beforePct + '% → ' + afterPct + '% progress');
      noteActivity('✨', (window.myName || 'Iemand') + ' droeg bij aan "' + title + '"');
    } else {
      toast('Bijdrage verwerkt', title, 'Team progress bijgewerkt');
    }
  }

  function install(){
    injectStyles();
    var a = wrapFunction('joinGroupQuest', onJoin);
    var b = wrapFunction('leaveGroupQuest', onLeave);
    var c = wrapFunction('contributeGroupQuest', onContribute);
    wrapped = wrapped || a || b || c;
    return wrapped;
  }

  var tries = 0;
  var timer = setInterval(function(){
    tries++;
    if(install() || tries > 40) clearInterval(timer);
  }, 150);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();

  window.GroupQuestRewardPolish = { install: install, toast: toast, burst: burst };
})();
