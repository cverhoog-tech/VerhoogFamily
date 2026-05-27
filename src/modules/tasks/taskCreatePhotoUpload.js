'use strict';
// ============================================================
// TASK CREATE PHOTO UPLOAD v0.298f
// Adds custom image upload to quest create sheet.
// v0.298f: robust create/save fallback so new quests appear in overview.
// ============================================================

(function(){
  var STYLE_ID = 'task-create-photo-upload-style';
  var TASK_STORE = 'fam_tasks_v023';
  var SAVE_LOCK = false;

  function injectStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.fqPhotoUploadBox{position:relative;overflow:hidden;border-radius:24px!important;padding:0!important;background:#0f172a!important;border:1px solid rgba(15,23,42,.08)!important}',
      '.fqPhotoPreview{height:168px;background:linear-gradient(135deg,#111827,#315f2c);background-size:cover;background-position:center;display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:14px;box-sizing:border-box;color:#fff;position:relative}',
      '.fqPhotoPreview:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.72));pointer-events:none}',
      '.fqPhotoPreview>*{position:relative;z-index:1}',
      '.fqPhotoText b{display:block;font-size:14px;font-weight:1000;color:#fff;margin-bottom:3px}.fqPhotoText span{display:block;font-size:12px;font-weight:800;color:rgba(255,255,255,.75);line-height:1.25}',
      '.fqPhotoBtn{border:0;border-radius:999px;padding:10px 12px;background:rgba(255,255,255,.92);color:#0f172a;font-size:12px;font-weight:1000;box-shadow:0 12px 30px rgba(0,0,0,.24);white-space:nowrap}',
      '.fqPhotoRemove{border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:8px 10px;background:rgba(255,255,255,.14);color:#fff;font-size:11px;font-weight:950;backdrop-filter:blur(12px);display:none}',
      '.fqPhotoUploadBox.hasPhoto .fqPhotoRemove{display:inline-flex}',
      '.fqPhotoUploadBox input[type="file"]{position:absolute;inset:0;opacity:0;pointer-events:none}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function fallbackImage(title, desc){
    var s = String((title || '') + ' ' + (desc || '')).toLowerCase();
    if(/kind|school/.test(s)) return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=700&q=90&fm=webp';
    if(/auto|car/.test(s)) return 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=700&q=90&fm=webp';
    if(/plant/.test(s)) return 'https://images.unsplash.com/photo-1525498128493-380d1990a112?auto=format&fit=crop&w=700&q=90&fm=webp';
    if(/was|laundry/.test(s)) return 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=700&q=90&fm=webp';
    if(/eten|kook|boodschap/.test(s)) return 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=700&q=90&fm=webp';
    if(/tand|dokter/.test(s)) return 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=700&q=90&fm=webp';
    if(/kamer|huis|stof/.test(s)) return 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=700&q=90&fm=webp';
    return 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=700&q=90&fm=webp';
  }

  function xpFor(type, prio){
    type = String(type || 'SIDE QUEST');
    prio = String(prio || 'laag').toLowerCase();
    if(type.indexOf('RAID') > -1) return '+120 XP';
    if(type.indexOf('DUNGEON') > -1) return '+60 XP';
    if(prio === 'hoog' || prio === 'high') return '+30 XP';
    if(prio === 'normaal' || prio === 'medium' || prio === 'normal') return '+20 XP';
    return '+10 XP';
  }

  function parse(raw, fallback){ try { return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; } }

  function listTasks(){
    var repoTasks = null;
    try { if(window.TaskRepositoryAdapter && window.TaskRepositoryAdapter.listTasks) repoTasks = window.TaskRepositoryAdapter.listTasks(); } catch(e) {}
    if(Array.isArray(repoTasks)) return repoTasks.slice();
    try { if(window.HouseholdRepository && window.HouseholdRepository.listTasks) repoTasks = window.HouseholdRepository.listTasks(); } catch(e) {}
    if(Array.isArray(repoTasks)) return repoTasks.slice();
    if(Array.isArray(window.taskData)) return window.taskData.slice();
    return parse(localStorage.getItem(TASK_STORE), []);
  }

  function syncEverywhere(tasks, meta){
    tasks = Array.isArray(tasks) ? tasks : [];
    if(Array.isArray(window.taskData)){
      window.taskData.length = 0;
      tasks.forEach(function(t){ window.taskData.push(t); });
    } else {
      window.taskData = tasks.slice();
    }
    try { localStorage.setItem(TASK_STORE, JSON.stringify(tasks)); } catch(e) {}
    try { localStorage.setItem('fam_tasks_v022', JSON.stringify(tasks)); } catch(e) {}
    try { if(window.HouseholdRepository && window.HouseholdRepository.saveTasks) window.HouseholdRepository.saveTasks(tasks, Object.assign({ source:'TaskCreatePhotoUpload' }, meta || {})); } catch(e) {}
    try { if(window.TaskRepositoryAdapter && window.TaskRepositoryAdapter.saveTasks) window.TaskRepositoryAdapter.saveTasks(tasks, Object.assign({ source:'TaskCreatePhotoUpload' }, meta || {})); } catch(e) {}
    try { window.dispatchEvent(new CustomEvent('familyapp:tasks-updated', { detail:Object.assign({ tasks:tasks, source:'TaskCreatePhotoUpload' }, meta || {}) })); } catch(e) {}
    return tasks;
  }

  function compressFile(file){
    return new Promise(function(resolve, reject){
      if(!file || !/^image\//.test(file.type || '')) return reject(new Error('Geen afbeelding'));
      var reader = new FileReader();
      reader.onload = function(){
        var img = new Image();
        img.onload = function(){
          var max = 1100;
          var w = img.naturalWidth || img.width;
          var h = img.naturalHeight || img.height;
          var scale = Math.min(1, max / Math.max(w, h));
          var cw = Math.max(1, Math.round(w * scale));
          var ch = Math.max(1, Math.round(h * scale));
          var canvas = document.createElement('canvas');
          canvas.width = cw; canvas.height = ch;
          canvas.getContext('2d').drawImage(img, 0, 0, cw, ch);
          var dataUrl;
          try { dataUrl = canvas.toDataURL('image/webp', 0.76); }
          catch(e){ dataUrl = canvas.toDataURL('image/jpeg', 0.78); }
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function injectUpload(m){
    if(!m || m.__photoUploadInjected || !m.querySelector('#qn')) return;
    var content = m.querySelector('.fqContent');
    if(!content) return;
    m.__photoUploadInjected = true;
    var html = '<div class="fqBox fqPhotoUploadBox" id="fqPhotoUploadBox">'
      + '<div class="fqPhotoPreview" id="fqPhotoPreview">'
      + '<div class="fqPhotoText"><b>Kaartfoto</b><span>Upload een eigen foto die iedereen bij deze taak ziet.</span></div>'
      + '<div style="display:flex;gap:8px;align-items:center"><button type="button" class="fqPhotoRemove" id="fqPhotoRemove">Verwijder</button><button type="button" class="fqPhotoBtn" id="fqPhotoBtn">Foto kiezen</button></div>'
      + '</div><input id="fqPhotoInput" type="file" accept="image/*"></div>';
    var dateBox = m.querySelector('#qdate');
    var insertBefore = dateBox ? dateBox.closest('.fqBox') : null;
    if(insertBefore) insertBefore.insertAdjacentHTML('beforebegin', html);
    else content.insertAdjacentHTML('beforeend', html);

    var input = m.querySelector('#fqPhotoInput');
    var btn = m.querySelector('#fqPhotoBtn');
    var remove = m.querySelector('#fqPhotoRemove');
    var preview = m.querySelector('#fqPhotoPreview');
    var box = m.querySelector('#fqPhotoUploadBox');
    m.__questPhotoDataUrl = '';

    btn.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); input.click(); });
    remove.addEventListener('click', function(ev){
      ev.preventDefault(); ev.stopPropagation();
      m.__questPhotoDataUrl = '';
      preview.style.backgroundImage = '';
      box.classList.remove('hasPhoto');
      input.value = '';
    });
    input.addEventListener('change', function(){
      var file = input.files && input.files[0];
      if(!file) return;
      btn.textContent = 'Verwerken...';
      compressFile(file).then(function(dataUrl){
        m.__questPhotoDataUrl = dataUrl;
        preview.style.backgroundImage = 'url(' + dataUrl + ')';
        box.classList.add('hasPhoto');
        btn.textContent = 'Andere foto';
      }).catch(function(){
        btn.textContent = 'Foto kiezen';
        if(typeof window.showToast === 'function') window.showToast('Foto kon niet worden geladen');
      });
    });
  }

  function buildTaskFromModal(m){
    var nameEl = m.querySelector('#qn');
    var descEl = m.querySelector('#qd');
    if(!nameEl) return null;
    var name = nameEl.value.trim();
    if(!name){ nameEl.style.border = '1.5px solid #dc2626'; return false; }
    var desc = (descEl && descEl.value.trim()) || 'Nieuwe quest.';
    var dateEl = m.querySelector('#qdate');
    var whoEl = m.querySelector('#qwho');
    var date = (dateEl && dateEl.value) || new Date().toISOString().slice(0,10);
    var who = (whoEl && whoEl.value) || (window.myName || 'Shane');
    var type = String(window._qtype || 'SIDE QUEST');
    if(/group/i.test(type)) type = 'SIDE QUEST';
    var prio = window._qprio || 'laag';
    var photo = m.__questPhotoDataUrl || fallbackImage(name, desc);
    var id = 'q' + Date.now();
    var obj = {
      id:id,
      type:type,
      title:name,
      description:desc,
      dueDate:date,
      assignedTo:who,
      xpReward:xpFor(type, prio),
      imageUrl:photo,
      imageDataUrlFallback:/^data:image\//.test(photo) ? photo : '',
      subtasks:['Eerste stap'],
      progress:0,
      recurrence:'once',
      recurrenceDate:date,
      priority:prio,
      helpRequested:false,
      helpers:[],
      status:'open',
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString()
    };
    if(window.TaskModel && window.TaskModel.toLegacyArray) return window.TaskModel.toLegacyArray(obj);
    return [id, type, name, desc, date, who, xpFor(type, prio), photo, ['Eerste stap'], 0, 'once', date, prio, '', []];
  }

  function forceOverviewRender(){
    try { window.taskTab = 'overzicht'; } catch(e) {}
    var r = document.getElementById('task-content');
    if(r){
      r.dataset.v023 = '';
      r.dataset.rendered = '';
    }
    try { if(window.TaskRepositoryAdapter && window.TaskRepositoryAdapter.syncGlobalsFromRepository) window.TaskRepositoryAdapter.syncGlobalsFromRepository(); } catch(e) {}
    if(typeof window.renderTasks === 'function'){
      setTimeout(function(){ try { window.renderTasks(); } catch(e) {} }, 40);
      setTimeout(function(){ try { window.renderTasks(true); } catch(e) {} }, 180);
    }
    try { if(window.TaskSharedJoinableState && window.TaskSharedJoinableState.patchCards) setTimeout(window.TaskSharedJoinableState.patchCards, 260); } catch(e) {}
  }

  function saveQuestFromModal(m){
    if(SAVE_LOCK) return true;
    SAVE_LOCK = true;
    setTimeout(function(){ SAVE_LOCK = false; }, 700);

    var task = buildTaskFromModal(m);
    if(task === false) return true;
    if(!task) return false;
    var id = window.TaskModel ? window.TaskModel.getId(task) : task[0];
    var tasks = listTasks().filter(function(t){
      var tid = window.TaskModel ? window.TaskModel.getId(t) : (Array.isArray(t) ? t[0] : t && t.id);
      return String(tid) !== String(id);
    });
    tasks.unshift(task);
    syncEverywhere(tasks, { operation:'createQuest', id:id });
    try { if(typeof window.closeModal === 'function') window.closeModal(); else { m.classList.remove('open'); document.body.style.overflow = ''; } } catch(e) {}
    forceOverviewRender();
    setTimeout(function(){
      var visible = !!document.querySelector('.fqCard[data-id="'+CSS.escape(String(id))+'"]');
      if(!visible) forceOverviewRender();
    }, 450);
    if(typeof window.showToast === 'function') window.showToast('Quest aangemaakt ✓');
    return true;
  }

  function isSaveButton(btn){
    if(!btn) return false;
    if(btn.classList && btn.classList.contains('fqSaveBtn')) return true;
    var txt = String(btn.textContent || '').toLowerCase().trim();
    return /quest\s*opslaan|opslaan|aanmaken|maak.*quest/.test(txt);
  }

  function bindSaveCapture(){
    if(document.__taskCreatePhotoUploadCaptureV298f) return;
    document.__taskCreatePhotoUploadCaptureV298f = true;
    document.addEventListener('click', function(ev){
      var btn = ev.target && ev.target.closest ? ev.target.closest('button,.fqSaveBtn,[role="button"]') : null;
      if(!isSaveButton(btn)) return;
      var m = btn.closest && btn.closest('#fqModal');
      if(!m || !m.querySelector('#qn')) return;
      ev.preventDefault();
      ev.stopPropagation();
      if(typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
      saveQuestFromModal(m);
    }, true);
  }

  function patch(){
    injectStyles();
    bindSaveCapture();
    var m = document.getElementById('fqModal');
    if(m && m.classList.contains('open')) injectUpload(m);
  }

  var n = 0;
  var timer = setInterval(function(){ n++; patch(); if(n > 80) clearInterval(timer); }, 120);
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patch); else patch();
  if(document.body && !document.body.__taskCreatePhotoUploadObserver){
    document.body.__taskCreatePhotoUploadObserver = true;
    new MutationObserver(function(){ clearTimeout(document.body.__taskCreatePhotoUploadTimer); document.body.__taskCreatePhotoUploadTimer = setTimeout(patch, 30); }).observe(document.body, { childList:true, subtree:true });
  }

  window.TaskCreatePhotoUpload = { patch: patch, saveQuestFromModal: saveQuestFromModal };
})();
