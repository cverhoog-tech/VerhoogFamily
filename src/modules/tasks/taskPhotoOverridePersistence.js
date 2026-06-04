'use strict';
// ============================================================
// TASK PHOTO OVERRIDE PERSISTENCE v0.298j
// Native MVP fix: persist selected quest photos by title before the native
// quest-overlay save runs, then force that photo after every re-render.
// This prevents keyword fallback images such as laundry/wasserette from
// replacing a user-uploaded photo for titles like "baby wassen".
// ============================================================

(function(){
  var STORE = 'familyapp_task_custom_photos_v1';
  var installed = false;

  function parse(raw, fallback){ try { return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; } }
  function readMap(){ return parse(localStorage.getItem(STORE), {}); }
  function writeMap(map){ try { localStorage.setItem(STORE, JSON.stringify(map || {})); } catch(e) {} }
  function norm(v){ return String(v || '').trim().toLowerCase(); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>\"]/g,function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'})[ch] || ch; }); }

  function modalTitle(modal){
    var el = modal && modal.querySelector('#qn');
    return el ? String(el.value || '').trim() : '';
  }

  function remember(modal){
    if(!modal) return;
    var title = modalTitle(modal);
    var photo = modal.__questPhotoDataUrl || '';
    if(!title || !/^data:image\//.test(photo)) return;
    var map = readMap();
    map[norm(title)] = photo;
    writeMap(map);
    try { window.__familyappTaskPhotoOverrides = map; } catch(e) {}
  }

  function cardTitle(card){
    var el = card && card.querySelector('.fqTitle');
    return el ? String(el.textContent || '').trim() : '';
  }

  function applyToCard(card, photo){
    if(!card || !photo) return;
    var img = card.querySelector('.fqImg');
    if(img){
      img.style.setProperty('background-image', 'url(' + photo + ')', 'important');
      img.setAttribute('data-photo-override', '1');
    }
    card.setAttribute('data-photo-override', '1');
  }

  function applyToModal(photo){
    if(!photo) return;
    var hero = document.querySelector('#fqModal.open .fqHero');
    if(hero){
      hero.style.setProperty('background-image', 'url(' + photo + ')', 'important');
      hero.setAttribute('data-photo-override', '1');
    }
  }

  function patchCards(){
    var map = readMap();
    var cards = Array.prototype.slice.call(document.querySelectorAll('.fqCard'));
    cards.forEach(function(card){
      var title = cardTitle(card);
      var photo = map[norm(title)];
      if(photo) applyToCard(card, photo);
    });

    var modal = document.querySelector('#fqModal.open');
    if(modal){
      var h = modal.querySelector('.fqHeroT h2');
      var title = h ? String(h.textContent || '').trim() : modalTitle(modal);
      var photo = map[norm(title)];
      if(photo) applyToModal(photo);
    }
  }

  function patchStoredTasks(){
    var map = readMap();
    if(!Object.keys(map).length) return;
    ['fam_tasks_v023','fam_tasks_v022','fam_tasks_v021'].forEach(function(key){
      var tasks = parse(localStorage.getItem(key), null);
      if(!Array.isArray(tasks)) return;
      var changed = false;
      tasks.forEach(function(task){
        var title = Array.isArray(task) ? task[2] : (task && (task.title || task.name));
        var photo = map[norm(title)];
        if(!photo) return;
        if(Array.isArray(task) && task[7] !== photo){ task[7] = photo; changed = true; }
        else if(task && !Array.isArray(task) && task.imageUrl !== photo){ task.imageUrl = photo; task.image = photo; task.imageDataUrlFallback = photo; changed = true; }
      });
      if(changed){ try { localStorage.setItem(key, JSON.stringify(tasks)); } catch(e) {} }
    });
  }

  function bindSaveCapture(){
    if(document.__taskPhotoOverrideSaveCaptureV298j) return;
    document.__taskPhotoOverrideSaveCaptureV298j = true;
    document.addEventListener('click', function(ev){
      var btn = ev.target && ev.target.closest ? ev.target.closest('.fqSaveBtn,button') : null;
      if(!btn) return;
      var txt = String(btn.textContent || '').toLowerCase();
      if(!(btn.classList && btn.classList.contains('fqSaveBtn')) && !/quest\s*opslaan|opslaan|aanmaken/.test(txt)) return;
      var modal = btn.closest && btn.closest('#fqModal');
      if(!modal || !modal.querySelector('#qn')) return;

      // Capture before native quest-overlay onclick runs. Do not stop or prevent.
      remember(modal);
      setTimeout(function(){ patchStoredTasks(); patchCards(); }, 30);
      setTimeout(function(){ patchStoredTasks(); patchCards(); }, 160);
      setTimeout(function(){ patchStoredTasks(); patchCards(); }, 450);
      setTimeout(function(){ patchStoredTasks(); patchCards(); }, 900);
    }, true);
  }

  function install(){
    if(installed) return;
    installed = true;
    bindSaveCapture();
    patchStoredTasks();
    patchCards();
    window.addEventListener('familyapp:tasks-updated', function(){ setTimeout(function(){ patchStoredTasks(); patchCards(); }, 40); });
    window.addEventListener('storage', function(ev){ if(ev.key === STORE || /^fam_tasks_v02/.test(ev.key || '')) setTimeout(function(){ patchStoredTasks(); patchCards(); }, 40); });
    if(document.body){
      new MutationObserver(function(){
        clearTimeout(document.body.__taskPhotoOverrideTimerV298j);
        document.body.__taskPhotoOverrideTimerV298j = setTimeout(function(){ patchStoredTasks(); patchCards(); }, 25);
      }).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class','style','data-id'] });
    }
    var i = 0;
    var timer = setInterval(function(){ i++; patchStoredTasks(); patchCards(); if(i > 120) clearInterval(timer); }, 120);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();

  window.TaskPhotoOverridePersistence = { install: install, patchCards: patchCards, patchStoredTasks: patchStoredTasks };
})();
