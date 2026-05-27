'use strict';
// ============================================================
// TASK CREATE PHOTO UPLOAD v0.298g
// Adds custom image upload to the quest create sheet WITHOUT intercepting
// the native quest-overlay save flow. The native save flow owns the visible
// internal quest data array, so blocking it prevents new quests appearing.
// ============================================================

(function(){
  var STYLE_ID = 'task-create-photo-upload-style';
  var TASK_STORE = 'fam_tasks_v023';

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

  function parse(raw, fallback){ try { return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; } }

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
          canvas.width = cw;
          canvas.height = ch;
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

  function injectUpload(modal){
    if(!modal || modal.__photoUploadInjected || !modal.querySelector('#qn')) return;
    var content = modal.querySelector('.fqContent');
    if(!content) return;
    modal.__photoUploadInjected = true;
    modal.__questPhotoDataUrl = '';

    var html = '<div class="fqBox fqPhotoUploadBox" id="fqPhotoUploadBox">'
      + '<div class="fqPhotoPreview" id="fqPhotoPreview">'
      + '<div class="fqPhotoText"><b>Kaartfoto</b><span>Upload een eigen foto die iedereen bij deze taak ziet.</span></div>'
      + '<div style="display:flex;gap:8px;align-items:center"><button type="button" class="fqPhotoRemove" id="fqPhotoRemove">Verwijder</button><button type="button" class="fqPhotoBtn" id="fqPhotoBtn">Foto kiezen</button></div>'
      + '</div><input id="fqPhotoInput" type="file" accept="image/*"></div>';

    var dateBox = modal.querySelector('#qdate');
    var insertBefore = dateBox ? dateBox.closest('.fqBox') : null;
    if(insertBefore) insertBefore.insertAdjacentHTML('beforebegin', html);
    else content.insertAdjacentHTML('beforeend', html);

    var input = modal.querySelector('#fqPhotoInput');
    var btn = modal.querySelector('#fqPhotoBtn');
    var remove = modal.querySelector('#fqPhotoRemove');
    var preview = modal.querySelector('#fqPhotoPreview');
    var box = modal.querySelector('#fqPhotoUploadBox');

    btn.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); input.click(); });
    remove.addEventListener('click', function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      modal.__questPhotoDataUrl = '';
      preview.style.backgroundImage = '';
      box.classList.remove('hasPhoto');
      input.value = '';
    });
    input.addEventListener('change', function(){
      var file = input.files && input.files[0];
      if(!file) return;
      btn.textContent = 'Verwerken...';
      compressFile(file).then(function(dataUrl){
        modal.__questPhotoDataUrl = dataUrl;
        preview.style.backgroundImage = 'url(' + dataUrl + ')';
        box.classList.add('hasPhoto');
        btn.textContent = 'Andere foto';
      }).catch(function(){
        btn.textContent = 'Foto kiezen';
        if(typeof window.showToast === 'function') window.showToast('Foto kon niet worden geladen');
      });
    });
  }

  function rememberPhotoAfterNativeSave(modal){
    if(!modal || !modal.__questPhotoDataUrl) return;
    var titleEl = modal.querySelector('#qn');
    var title = titleEl ? titleEl.value.trim() : '';
    var photo = modal.__questPhotoDataUrl;
    if(!title || !photo) return;

    setTimeout(function(){
      var tasks = parse(localStorage.getItem(TASK_STORE), []);
      if(!Array.isArray(tasks) || !tasks.length) return;
      for(var i = tasks.length - 1; i >= 0; i--){
        if(Array.isArray(tasks[i]) && String(tasks[i][2] || '').trim() === title){
          tasks[i][7] = photo;
          break;
        }
        if(tasks[i] && !Array.isArray(tasks[i]) && String(tasks[i].title || tasks[i].name || '').trim() === title){
          tasks[i].imageUrl = photo;
          tasks[i].imageDataUrlFallback = photo;
          break;
        }
      }
      try { localStorage.setItem(TASK_STORE, JSON.stringify(tasks)); } catch(e) {}
      try { if(window.TaskRepositoryAdapter && window.TaskRepositoryAdapter.saveTasks) window.TaskRepositoryAdapter.saveTasks(tasks, { source:'TaskCreatePhotoUpload', operation:'attachPhotoAfterNativeSave' }); } catch(e) {}
      try { window.dispatchEvent(new CustomEvent('familyapp:tasks-updated', { detail:{ tasks:tasks, source:'TaskCreatePhotoUpload' } })); } catch(e) {}
    }, 220);
  }

  function bindPassiveSaveObserver(){
    if(document.__taskCreatePhotoPassiveSaveObserver) return;
    document.__taskCreatePhotoPassiveSaveObserver = true;
    document.addEventListener('click', function(ev){
      var btn = ev.target && ev.target.closest ? ev.target.closest('.fqSaveBtn,button') : null;
      if(!btn) return;
      var txt = String(btn.textContent || '').toLowerCase();
      if(!/quest\s*opslaan|opslaan|aanmaken/.test(txt) && !(btn.classList && btn.classList.contains('fqSaveBtn'))) return;
      var modal = btn.closest && btn.closest('#fqModal');
      if(!modal || !modal.querySelector('#qn')) return;
      // Do NOT preventDefault / stopPropagation here. The native quest-overlay
      // save handler must run because it updates the renderer's internal data array.
      rememberPhotoAfterNativeSave(modal);
    }, false);
  }

  function patch(){
    injectStyles();
    bindPassiveSaveObserver();
    var modal = document.getElementById('fqModal');
    if(modal && modal.classList.contains('open')) injectUpload(modal);
  }

  var n = 0;
  var timer = setInterval(function(){ n++; patch(); if(n > 80) clearInterval(timer); }, 120);
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patch); else patch();
  if(document.body && !document.body.__taskCreatePhotoUploadObserver){
    document.body.__taskCreatePhotoUploadObserver = true;
    new MutationObserver(function(){
      clearTimeout(document.body.__taskCreatePhotoUploadTimer);
      document.body.__taskCreatePhotoUploadTimer = setTimeout(patch, 30);
    }).observe(document.body, { childList:true, subtree:true });
  }

  window.TaskCreatePhotoUpload = { patch: patch };
})();
