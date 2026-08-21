'use strict';
// ============================================================
// STEP 2B.6B — TASK HELP / PARTY / STATUS ICON MIGRATION
// Presentation-only bridge from task-detail collaboration/status surfaces
// to the canonical FamilyAppIconRegistry + FamilyAppIconRenderer.
// No task data, Firebase, completion or XP behavior is changed here.
// ============================================================
(function(){
  if(window.TaskStatusIcons)return;

  var MAP=Object.freeze({
    help:'utilityPeople',
    collaboration:'utilityLink',
    waiting:'utilityClock',
    open:'quest',
    completed:'achievement'
  });

  function render(key,size,className){
    if(!window.FamilyAppIconRenderer||typeof FamilyAppIconRenderer.render!=='function')return'';
    return FamilyAppIconRenderer.render(key,{size:size||'sm',label:false,className:className||'task-status-icon'});
  }

  function replaceControlIcon(control,key,size,marker){
    if(!control||control.getAttribute('data-task-status-icon')===marker)return;
    var current=control.querySelector('svg');
    var html=render(key,size,'task-status-icon task-status-icon--control');
    if(!html)return;
    if(current){
      var holder=document.createElement('span');
      holder.className='task-status-icon-slot';
      holder.innerHTML=html;
      current.replaceWith(holder);
    }else{
      control.insertAdjacentHTML('afterbegin','<span class="task-status-icon-slot">'+html+'</span>');
    }
    control.setAttribute('data-task-status-icon',marker);
  }

  function patchHelpCrest(root){
    var crest=root.querySelector('.tdp-help-crest');
    if(!crest||crest.getAttribute('data-task-status-icon')==='help')return;
    var html=render(MAP.help,'md','task-status-icon task-status-icon--help');
    if(!html)return;
    crest.innerHTML='<span class="task-help-crest-shell" aria-hidden="true"><span class="task-help-crest-inner">'+html+'</span></span>';
    crest.setAttribute('data-task-status-icon','help');
  }

  function patchHelpButton(root){
    var btn=root.querySelector('.tdp-help-btn');
    if(btn)replaceControlIcon(btn,MAP.collaboration,'xs','collaboration');
  }

  function patchWaiting(root){
    var status=root.querySelector('.tdp-help-status');
    if(!status||status.getAttribute('data-task-status-icon')==='waiting')return;
    var html=render(MAP.waiting,'xs','task-status-icon task-status-icon--waiting');
    if(!html)return;
    status.insertAdjacentHTML('afterbegin','<span class="task-status-icon-slot task-status-icon-slot--status">'+html+'</span>');
    status.setAttribute('data-task-status-icon','waiting');
  }

  function patchProgressStatus(root){
    var value=root.querySelector('.tdp-progress-value');
    if(!value)return;
    var raw=String(value.textContent||'').trim().toLowerCase();
    var completed=raw==='voltooid'||/voltooid$/.test(raw)&&!/^0 van /.test(raw);
    var marker=completed?'completed':'open';
    if(value.getAttribute('data-task-status-icon')===marker)return;
    var html=render(completed?MAP.completed:MAP.open,'xs','task-status-icon task-status-icon--progress');
    if(!html)return;
    var old=value.querySelector('.task-status-icon-slot');
    if(old)old.remove();
    value.insertAdjacentHTML('afterbegin','<span class="task-status-icon-slot task-status-icon-slot--status">'+html+'</span>');
    value.setAttribute('data-task-status-icon',marker);
  }

  function patch(root){
    root=root||document;
    var overlay=root.querySelector?root.querySelector('#tdp-overlay'):null;
    if(!overlay&&root.id==='tdp-overlay')overlay=root;
    if(!overlay)return;
    patchHelpCrest(overlay);
    patchHelpButton(overlay);
    patchWaiting(overlay);
    patchProgressStatus(overlay);
  }

  var observer=new MutationObserver(function(records){
    for(var i=0;i<records.length;i++){
      var target=records[i].target;
      if(target&&((target.id==='tdp-overlay')||(target.closest&&target.closest('#tdp-overlay')))){
        patch(document);
        break;
      }
    }
  });

  if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){patch(document);},{once:true});
  else patch(document);

  window.TaskStatusIcons={map:MAP,patch:patch};
  window.dispatchEvent(new CustomEvent('familyapp:task-status-icons-ready'));
})();
