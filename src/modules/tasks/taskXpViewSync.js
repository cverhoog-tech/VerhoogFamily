'use strict';
// ============================================================
// TASK XP VIEW SYNC v1.0
// Event-driven presentation sync for XP labels that are still rendered by
// legacy-compatible task detail/invite surfaces. No polling or function wraps.
// ============================================================
(function(){
  if(window.__taskXpViewSyncV1)return;
  window.__taskXpViewSyncV1=true;
  var currentTaskId=null;

  function task(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||null;}
  function reward(t){
    try{if(window.ProgressionUidBridge&&typeof ProgressionUidBridge.rewardXp==='function')return ProgressionUidBridge.rewardXp(t);}catch(e){}
    try{if(window.TaskRewardBridge&&typeof TaskRewardBridge.rewardXp==='function')return TaskRewardBridge.rewardXp(t);}catch(e){}
    if(!t)return 4;
    var n=Number(t.rewardXp||t.xpAmount);if(isFinite(n)&&n>0)return Math.round(n);
    var m=String(t.xpReward||t.xp||'').match(/(\d+)/);return m?Math.max(1,parseInt(m[1],10)):4;
  }
  function applyRows(){
    document.querySelectorAll('.tch-row[data-task-id]').forEach(function(row){
      var el=row.querySelector('.tch-reward'),t=task(row.getAttribute('data-task-id'));
      if(el&&t)el.innerHTML='+'+reward(t)+'<small>XP</small>';
    });
  }
  function applyDetail(){
    var t=task(currentTaskId);if(!t)return;
    var xp=reward(t);
    document.querySelectorAll('#tdp-overlay .tdp-xp-num').forEach(function(el){el.textContent='+'+xp;});
    document.querySelectorAll('#tdp-overlay .tdp-xp-shield b').forEach(function(el){el.textContent=String(xp);});
  }
  function applyInvites(){
    document.querySelectorAll('#party-quest-invite-modal [data-quest]').forEach(function(row){
      var t=task(row.getAttribute('data-quest')),small=row.querySelector('small');
      if(t&&small&&/XP/i.test(small.textContent||''))small.textContent=(small.textContent||'').replace(/\+?\d+\s*XP/i,'+'+reward(t)+' XP');
    });
  }
  function apply(){applyRows();applyDetail();applyInvites();}
  function schedule(){Promise.resolve().then(apply);}

  document.addEventListener('click',function(e){
    var row=e.target&&e.target.closest?e.target.closest('.tch-row[data-task-id]'):null;
    if(row){currentTaskId=row.getAttribute('data-task-id');schedule();return;}
    if(e.target&&e.target.closest&&e.target.closest('#party-quest-invite-modal'))schedule();
  },true);
  window.addEventListener('familyapp:tasks-updated',schedule);
  window.addEventListener('familyapp:progression-updated',schedule);
  window.addEventListener('familyapp:party-quests-updated',schedule);
  window.TaskXpViewSync={version:'1.0.0',apply:apply,rewardXp:reward};
})();
