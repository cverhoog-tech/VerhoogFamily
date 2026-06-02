'use strict';
// ============================================================
// TASK CUSTOM PHOTO PRIORITY v0.298i
// Ensures uploaded custom task photos always win over keyword/fallback images.
// Fixes cases like "baby wassen" where later render layers replace the upload
// with a laundry/wasserette fallback image.
// ============================================================

(function(){
  var TASK_KEYS = ['fam_tasks_v023', 'fam_tasks_v022', 'fam_tasks_v021'];
  var installed = false;

  function parse(raw, fb){ try { return raw ? JSON.parse(raw) : fb; } catch(e){ return fb; } }
  function isCustomPhoto(url){ return /^data:image\//.test(String(url || '')); }

  function readTasks(){
    for(var i=0;i<TASK_KEYS.length;i++){
      var tasks = parse(localStorage.getItem(TASK_KEYS[i]), null);
      if(Array.isArray(tasks) && tasks.length) return tasks;
    }
    try { if(window.TaskRepositoryAdapter && window.TaskRepositoryAdapter.listTasks) return window.TaskRepositoryAdapter.listTasks() || []; } catch(e) {}
    try { if(window.HouseholdRepository && window.HouseholdRepository.listTasks) return window.HouseholdRepository.listTasks() || []; } catch(e) {}
    try { return Array.isArray(window.taskData) ? window.taskData : []; } catch(e) { return []; }
  }

  function getId(task){
    if(window.TaskModel && window.TaskModel.getId) return window.TaskModel.getId(task);
    return String(Array.isArray(task) ? task[0] : task && task.id || '');
  }
  function getTitle(task){
    if(window.TaskModel && window.TaskModel.getTitle) return window.TaskModel.getTitle(task);
    return String(Array.isArray(task) ? task[2] : task && (task.title || task.name) || '');
  }
  function getImage(task){
    if(window.TaskModel && window.TaskModel.getImage) return window.TaskModel.getImage(task);
    return String(Array.isArray(task) ? task[7] : task && (task.imageUrl || task.image || task.photo || task.cover || task.imageDataUrlFallback) || '');
  }

  function customMap(){
    var byId = {};
    var byTitle = {};
    readTasks().forEach(function(task){
      var img = getImage(task);
      if(!isCustomPhoto(img)) return;
      var id = getId(task);
      var title = getTitle(task).trim();
      if(id) byId[id] = img;
      if(title) byTitle[title] = img;
    });
    return { byId: byId, byTitle: byTitle };
  }

  function applyImage(card, img){
    if(!card || !img) return;
    var image = card.querySelector('.fqImg');
    if(image) image.style.setProperty('background-image', 'url(' + img + ')', 'important');
    card.setAttribute('data-custom-photo', '1');
  }

  function patchCards(){
    var maps = customMap();
    Array.prototype.slice.call(document.querySelectorAll('.fqCard')).forEach(function(card){
      var id = card.getAttribute('data-id') || '';
      var titleEl = card.querySelector('.fqTitle');
      var title = titleEl ? String(titleEl.textContent || '').trim() : '';
      var img = maps.byId[id] || maps.byTitle[title];
      if(img) applyImage(card, img);
    });
  }

  function install(){
    if(installed) return;
    installed = true;
    patchCards();
    window.addEventListener('familyapp:tasks-updated', function(){ setTimeout(patchCards, 40); setTimeout(patchCards, 240); });
    window.addEventListener('storage', function(ev){ if(TASK_KEYS.indexOf(ev.key) >= 0) setTimeout(patchCards, 40); });
    if(document.body){
      new MutationObserver(function(){
        clearTimeout(document.body.__taskCustomPhotoPriorityTimer);
        document.body.__taskCustomPhotoPriorityTimer = setTimeout(patchCards, 35);
      }).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['style','data-id','class'] });
    }
    var n = 0;
    var timer = setInterval(function(){ n++; patchCards(); if(n > 80) clearInterval(timer); }, 120);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();

  window.TaskCustomPhotoPriority = { patchCards: patchCards, install: install };
})();
