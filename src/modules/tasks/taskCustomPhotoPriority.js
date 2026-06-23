'use strict';
// ============================================================
// TASK CUSTOM PHOTO PRIORITY v0.298k
// Custom uploaded task images win over keyword images.
// Anti-glitch: do not observe style changes and do not rewrite unchanged DOM.
// ============================================================

(function(){
  var TASK_KEYS = ['fam_tasks_v023', 'fam_tasks_v022', 'fam_tasks_v021'];
  var OVERRIDE_KEY = 'familyapp_task_custom_photos_v1';
  var installed = false;
  var storeSignature = '';
  var lastPatch = 0;

  function parse(raw, fb){ try { return raw ? JSON.parse(raw) : fb; } catch(e){ return fb; } }
  function norm(v){ return String(v || '').trim().toLowerCase(); }
  function isCustomImage(v){ return String(v || '').indexOf('data:image/') === 0; }
  function readOverrides(){ return parse(localStorage.getItem(OVERRIDE_KEY), {}); }
  function saveOverrides(map){ try { localStorage.setItem(OVERRIDE_KEY, JSON.stringify(map || {})); } catch(e) {} }
  function bgValue(img){ return 'url(' + JSON.stringify(String(img || '')) + ')'; }
  function sameBg(el, img){ return !!(el && img && el.getAttribute('data-custom-photo-src') === img); }

  function readTasks(){
    for(var i = 0; i < TASK_KEYS.length; i++){
      var tasks = parse(localStorage.getItem(TASK_KEYS[i]), null);
      if(Array.isArray(tasks) && tasks.length) return tasks;
    }
    try { if(window.TaskRepositoryAdapter && window.TaskRepositoryAdapter.listTasks) return window.TaskRepositoryAdapter.listTasks() || []; } catch(e) {}
    try { if(window.HouseholdRepository && window.HouseholdRepository.listTasks) return window.HouseholdRepository.listTasks() || []; } catch(e) {}
    return Array.isArray(window.taskData) ? window.taskData : [];
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
  function setImage(task, img){
    if(Array.isArray(task)) task[7] = img;
    else if(task){ task.imageUrl = img; task.image = img; task.imageDataUrlFallback = img; }
  }

  function buildMap(){
    var byId = {};
    var byTitle = readOverrides();
    readTasks().forEach(function(task){
      var img = getImage(task);
      if(!isCustomImage(img)) return;
      var id = getId(task);
      var title = norm(getTitle(task));
      if(id) byId[id] = img;
      if(title) byTitle[title] = img;
    });
    return { byId: byId, byTitle: byTitle };
  }

  function patchStoredTasks(force){
    var overrides = readOverrides();
    var nextSig = JSON.stringify(overrides || {});
    if(!force && nextSig === storeSignature) return;
    storeSignature = nextSig;
    if(!Object.keys(overrides).length) return;
    TASK_KEYS.forEach(function(key){
      var tasks = parse(localStorage.getItem(key), null);
      if(!Array.isArray(tasks)) return;
      var changed = false;
      tasks.forEach(function(task){
        var img = overrides[norm(getTitle(task))];
        if(img && getImage(task) !== img){ setImage(task, img); changed = true; }
      });
      if(changed){ try { localStorage.setItem(key, JSON.stringify(tasks)); } catch(e) {} }
    });
  }

  function applyImage(card, img){
    var image = card && card.querySelector('.fqImg');
    if(!image || !img || sameBg(image, img)) return;
    image.style.setProperty('background-image', bgValue(img), 'important');
    image.setAttribute('data-custom-photo-src', img);
    image.setAttribute('data-custom-photo', '1');
    card.setAttribute('data-custom-photo', '1');
  }

  function patchCards(opts){
    opts = opts || {};
    var now = Date.now();
    if(!opts.force && now - lastPatch < 90) return;
    lastPatch = now;
    if(opts.store) patchStoredTasks(false);
    var map = buildMap();
    Array.prototype.slice.call(document.querySelectorAll('.fqCard')).forEach(function(card){
      var id = card.getAttribute('data-id') || '';
      var titleEl = card.querySelector('.fqTitle');
      var title = titleEl ? norm(titleEl.textContent) : '';
      var img = map.byId[id] || map.byTitle[title];
      if(img) applyImage(card, img);
    });
  }

  function rememberFromModal(modal){
    var titleEl = modal && modal.querySelector('#qn');
    var title = titleEl ? norm(titleEl.value) : '';
    var img = modal && modal.__questPhotoDataUrl || '';
    if(!title || !isCustomImage(img)) return;
    var overrides = readOverrides();
    if(overrides[title] === img) return;
    overrides[title] = img;
    saveOverrides(overrides);
    storeSignature = '';
  }

  function bindSaveCapture(){
    if(document.__taskCustomPhotoSaveCaptureV298k) return;
    document.__taskCustomPhotoSaveCaptureV298k = true;
    document.addEventListener('click', function(ev){
      var btn = ev.target && ev.target.closest ? ev.target.closest('.fqSaveBtn,button') : null;
      if(!btn) return;
      var txt = String(btn.textContent || '').toLowerCase();
      if(!(btn.classList && btn.classList.contains('fqSaveBtn')) && !/quest\s*opslaan|opslaan|aanmaken/.test(txt)) return;
      var modal = btn.closest && btn.closest('#fqModal');
      if(!modal || !modal.querySelector('#qn')) return;
      rememberFromModal(modal);
      setTimeout(function(){ patchStoredTasks(true); patchCards({ force:true }); }, 120);
      setTimeout(function(){ patchStoredTasks(true); patchCards({ force:true }); }, 420);
    }, true);
  }

  function install(){
    if(installed) return;
    installed = true;
    bindSaveCapture();
    patchStoredTasks(true);
    patchCards({ force:true });
    window.addEventListener('familyapp:tasks-updated', function(){ setTimeout(function(){ patchCards({ store:true }); }, 120); });
    window.addEventListener('storage', function(ev){ if(TASK_KEYS.indexOf(ev.key) >= 0 || ev.key === OVERRIDE_KEY) setTimeout(function(){ patchCards({ store:true }); }, 120); });
    if(document.body){
      new MutationObserver(function(){
        clearTimeout(document.body.__taskCustomPhotoPriorityTimer);
        document.body.__taskCustomPhotoPriorityTimer = setTimeout(function(){ patchCards(); }, 140);
      }).observe(document.body, { childList:true, subtree:true });
    }
    var n = 0;
    var timer = setInterval(function(){ n++; patchCards(); if(n > 10) clearInterval(timer); }, 300);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();

  window.TaskCustomPhotoPriority = { patchCards: patchCards, install: install, patchStoredTasks: patchStoredTasks };
})();
