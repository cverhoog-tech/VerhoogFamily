'use strict';
(function(){
  if(window.__taskCompletedCleanupV1)return;
  window.__taskCompletedCleanupV1=true;
  function doneTasks(){return (Array.isArray(window.taskData)?window.taskData:[]).filter(function(t){return t&&t.done;});}
  function toast(m){try{if(typeof window.showToast==='function')window.showToast(m);}catch(e){}}
  function inject(){var group=document.querySelector('[data-life-group="Voltooid"]');if(!group)return false;var head=group.querySelector('.tch-group-head .tch-group-right');if(!head||head.querySelector('[data-clear-completed]'))return true;var b=document.createElement('button');b.type='button';b.setAttribute('data-clear-completed','1');b.textContent='Opschonen';b.style.cssText='border:0;background:transparent;color:#b91c1c;font-size:10px;font-weight:900;padding:4px 6px';b.onclick=function(e){e.preventDefault();e.stopPropagation();var list=doneTasks();if(!list.length)return;if(!confirm('Alle '+list.length+' voltooide taken verwijderen?'))return;if(typeof window.deleteTask!=='function'){toast('Opschonen is nog niet beschikbaar');return;}list.forEach(function(t){window.deleteTask(t.id);});toast(list.length+' voltooide '+(list.length===1?'taak verwijderd':'taken verwijderd'));};head.insertBefore(b,head.firstChild);return true;}
  function run(){setTimeout(inject,80);}
  window.addEventListener('familyapp:tasks-updated',run);document.addEventListener('click',run,true);var n=0,t=setInterval(function(){n++;if(inject()||n>80)clearInterval(t);},250);
})();
