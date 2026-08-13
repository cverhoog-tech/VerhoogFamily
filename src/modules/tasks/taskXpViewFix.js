'use strict';
(function(){
  if(window.__taskXpViewFixV2)return;
  window.__taskXpViewFixV2=true;
  var currentTaskId=null;
  function task(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||null;}
  function reward(t){try{if(window.ProgressionUidBridge&&typeof ProgressionUidBridge.rewardXp==='function')return ProgressionUidBridge.rewardXp(t);}catch(e){}try{if(window.TaskRewardBridge&&typeof TaskRewardBridge.rewardXp==='function')return TaskRewardBridge.rewardXp(t);}catch(e){}return 4;}
  function applyRows(){document.querySelectorAll('.tch-row[data-task-id]').forEach(function(row){var el=row.querySelector('.tch-reward'),t=task(row.getAttribute('data-task-id'));if(el&&t)el.innerHTML='+'+reward(t)+'<small>XP</small>';});}
  function applyDetail(){var t=task(currentTaskId);if(!t)return;var xp=reward(t);document.querySelectorAll('#tdp-overlay .tdp-xp-num').forEach(function(el){el.textContent='+'+xp;});document.querySelectorAll('#tdp-overlay .tdp-xp-shield b').forEach(function(el){el.textContent=String(xp);});}
  function applyInvites(){document.querySelectorAll('#party-quest-invite-modal [data-quest]').forEach(function(row){var t=task(row.getAttribute('data-quest')),small=row.querySelector('small');if(t&&small&&/XP/i.test(small.textContent||''))small.textContent=(small.textContent||'').replace(/\+?\d+\s*XP/i,'+'+reward(t)+' XP');});}
  function apply(){applyRows();applyDetail();applyInvites();}
  function hookDetail(){if(!window.TaskDetailPopup||typeof TaskDetailPopup.open!=='function'||TaskDetailPopup.open.__xpViewWrapped)return false;var old=TaskDetailPopup.open;TaskDetailPopup.open=function(id){currentTaskId=id;var r=old.apply(this,arguments);setTimeout(apply,0);setTimeout(apply,100);return r;};TaskDetailPopup.open.__xpViewWrapped=true;return true;}
  document.addEventListener('click',function(){setTimeout(apply,40);},true);
  window.addEventListener('familyapp:tasks-updated',function(){setTimeout(apply,40);});
  window.addEventListener('familyapp:progression-updated',function(){setTimeout(apply,40);});
  var n=0,t=setInterval(function(){n++;hookDetail();apply();if(n>80)clearInterval(t);},250);
  setTimeout(function(){hookDetail();apply();},0);
})();
