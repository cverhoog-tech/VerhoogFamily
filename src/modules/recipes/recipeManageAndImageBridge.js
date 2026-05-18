'use strict';
// ============================================================
// RECIPE MANAGE & IMAGE BRIDGE v0.374
// Stable recipe management: edit, delete, photo upload/url/default fallback.
// No filters, no render overrides that mutate recipe data.
// ============================================================

(function(){
  var VERSION = '0.374';
  var STORAGE_KEY = 'familyapp_food_recipes_v001';
  var STYLE_ID = 'recipe-manage-image-style';
  var loadingPromise = null;

  var PREMIUM_FALLBACKS = [
    'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1498579397066-22750a3cb424?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=85'
  ];

  function esc(v){
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function ensureStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.recipe-manage-row{display:flex;gap:9px;padding:0 16px 14px;margin-top:-2px}',
      '.recipe-manage-btn{border:0;border-radius:999px;padding:10px 13px;font-size:12px;font-weight:950;background:var(--c-surface2,#f4f7f2);color:var(--c-text,#111827);box-shadow:0 5px 16px rgba(17,24,39,.05)}',
      '.recipe-manage-btn.primary{background:var(--c-primary,#3f7f2f);color:#fff}',
      '.recipe-manage-btn.danger{background:#fff1f1;color:#c23333}',
      '.recipe-photo-preview{width:100%;height:155px;border-radius:20px;background-size:cover;background-position:center;background-color:var(--c-surface2,#f4f7f2);border:1px solid var(--c-border,#edf0ec);margin-bottom:12px}',
      '.recipe-fallback-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}',
      '.recipe-fallback-thumb{height:76px;border-radius:15px;background-size:cover;background-position:center;border:2px solid transparent}',
      '.recipe-fallback-thumb.active{border-color:var(--c-primary,#3f7f2f)}',
      '.recipe-upload-line{display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
      '.recipe-upload-native{display:none}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function loadScriptOnce(id, src, ready){
    return new Promise(function(resolve){
      if(ready && ready()) return resolve();
      if(document.getElementById(id)){
        var tries = 0;
        var wait = setInterval(function(){
          tries++;
          if(!ready || ready() || tries > 60){ clearInterval(wait); resolve(); }
        }, 40);
        return;
      }
      var script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.onload = function(){ resolve(); };
      script.onerror = function(){ console.warn('[RecipeManageAndImageBridge] failed to load', src); resolve(); };
      document.body.appendChild(script);
    });
  }

  function ensureSheet(){
    if(loadingPromise) return loadingPromise;
    loadingPromise = Promise.resolve()
      .then(function(){ return loadScriptOnce('modal-manager-js','src/core/modalManager.js',function(){ return !!window.ModalManager; }); })
      .then(function(){ return loadScriptOnce('bottom-sheet-js','src/core/bottomSheet.js',function(){ return !!window.BottomSheet; }); });
    return loadingPromise;
  }

  function recipes(){ if(!Array.isArray(window.recipesData)) window.recipesData = []; return window.recipesData; }
  function findRecipe(id){ return recipes().find(function(r){ return Number(r.id) === Number(id); }); }
  function currentRecipe(){ return findRecipe(window.currentRecipeId); }

  function pickFallback(recipe){
    var key = String((recipe && recipe.name) || '').length + Number((recipe && recipe.id) || 0);
    return PREMIUM_FALLBACKS[Math.abs(key) % PREMIUM_FALLBACKS.length];
  }

  function persist(operation){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes())); } catch(e) {}
    if(window.HouseholdRepository && typeof window.HouseholdRepository.write === 'function'){
      window.HouseholdRepository.write('recipes', recipes(), { source:'recipeManageAndImageBridge', operation:operation || 'recipeManage', version:VERSION });
    }
    try { window.dispatchEvent(new CustomEvent('familyapp:food:recipes-updated', { detail:{ recipes:recipes(), version:VERSION } })); } catch(e) {}
  }

  function render(){
    if(typeof window.renderRecipes === 'function') window.renderRecipes();
    else if(typeof window.renderRecipeGrid === 'function') window.renderRecipeGrid();
    setTimeout(installDetailActions, 80);
  }

  function toast(msg){ if(typeof window.showToast === 'function') window.showToast(msg); }

  function applyFallbacks(){
    var changed = 0;
    recipes().forEach(function(r){
      if(!r.photo){
        r.photo = pickFallback(r);
        r.photoFallback = true;
        r.photoFallbackVersion = VERSION;
        changed++;
      }
    });
    if(changed){ persist('applyPremiumFallbacks'); render(); }
    return changed;
  }

  function readFileAsDataUrl(file, cb){
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(ev){ cb(ev.target.result); };
    reader.readAsDataURL(file);
  }

  function openEditSheet(id){
    ensureSheet().then(function(){
      ensureStyles();
      var r = findRecipe(id);
      if(!r || !window.BottomSheet) return;
      var photoValue = r.photo || pickFallback(r);
      window.BottomSheet.open({
        title:'✏️ Recept bewerken',
        html:''
          +'<div id="recipe-edit-preview" class="recipe-photo-preview" style="background-image:url(\''+esc(photoValue)+'\')"></div>'
          +'<div class="fam-modal-field"><label>Naam</label><input id="recipe-edit-name" value="'+esc(r.name)+'"></div>'
          +'<div class="fam-modal-field"><label>Categorie</label><select id="recipe-edit-cat"><option>Ontbijt</option><option>Lunch</option><option>Diner</option><option>Snack</option><option>Dessert</option><option>Bakken</option></select></div>'
          +'<div class="fam-modal-field"><label>Keuken</label><input id="recipe-edit-cuisine" placeholder="bijv. Turks" value="'+esc(r.cuisine || '')+'"></div>'
          +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="fam-modal-field"><label>Personen</label><input id="recipe-edit-persons" type="number" min="1" value="'+esc(r.persons || 4)+'"></div><div class="fam-modal-field"><label>Tijd min.</label><input id="recipe-edit-time" type="number" min="1" value="'+esc(r.time || 20)+'"></div></div>'
          +'<div class="fam-modal-field"><label>Emoji</label><input id="recipe-edit-emoji" value="'+esc(r.emoji || '🍽️')+'"></div>'
          +'<div class="fam-modal-field"><label>Foto URL</label><input id="recipe-edit-photo" value="'+esc(photoValue)+'"></div>'
          +'<div class="recipe-upload-line"><button type="button" class="recipe-manage-btn primary" id="recipe-edit-upload-btn">📷 Foto uploaden</button><input class="recipe-upload-native" id="recipe-edit-upload" type="file" accept="image/*"><button type="button" class="recipe-manage-btn" id="recipe-edit-random-photo">✨ Kies sfeerfoto</button></div>'
          +'<div class="recipe-fallback-grid">'+PREMIUM_FALLBACKS.map(function(src,i){ return '<button type="button" class="recipe-fallback-thumb" data-photo="'+esc(src)+'" style="background-image:url(\''+esc(src)+'\')" aria-label="Sfeerfoto '+(i+1)+'"></button>'; }).join('')+'</div>'
          +'<div class="fam-modal-field"><label>Ingrediënten</label><textarea id="recipe-edit-ingredients" rows="5">'+esc((r.ingredients || []).join('\n'))+'</textarea></div>'
          +'<div class="fam-modal-field"><label>Bereiding</label><textarea id="recipe-edit-steps" rows="5">'+esc((r.steps || []).join('\n'))+'</textarea></div>'
          +'<div class="fam-modal-field"><label>Notities</label><textarea id="recipe-edit-notes" rows="3">'+esc(r.notes || '')+'</textarea></div>',
        onOpen:function(ctx){
          var modal = ctx.modal;
          var cat = modal.querySelector('#recipe-edit-cat');
          if(cat) cat.value = r.cat || 'Diner';
          function setPhoto(src){
            var photo = modal.querySelector('#recipe-edit-photo');
            var preview = modal.querySelector('#recipe-edit-preview');
            if(photo) photo.value = src || '';
            if(preview) preview.style.backgroundImage = src ? "url('"+String(src).replace(/'/g,'%27')+"')" : '';
          }
          var photoInput = modal.querySelector('#recipe-edit-photo');
          if(photoInput) photoInput.oninput = function(){ setPhoto(photoInput.value); };
          var uploadBtn = modal.querySelector('#recipe-edit-upload-btn');
          var upload = modal.querySelector('#recipe-edit-upload');
          if(uploadBtn && upload) uploadBtn.onclick = function(){ upload.click(); };
          if(upload) upload.onchange = function(e){ readFileAsDataUrl(e.target.files[0], setPhoto); };
          var random = modal.querySelector('#recipe-edit-random-photo');
          if(random) random.onclick = function(){ setPhoto(PREMIUM_FALLBACKS[Math.floor(Math.random()*PREMIUM_FALLBACKS.length)]); };
          modal.querySelectorAll('[data-photo]').forEach(function(btn){ btn.onclick = function(){ setPhoto(btn.getAttribute('data-photo')); }; });
        },
        actions:[
          { label:'Annuleren' },
          { label:'Opslaan', primary:true, onClick:function(ctx){
            var m = ctx.modal;
            var name = ((m.querySelector('#recipe-edit-name') || {}).value || '').trim();
            if(!name){ toast('Vul een naam in'); return false; }
            r.name = name;
            r.cat = (m.querySelector('#recipe-edit-cat') || {}).value || 'Diner';
            r.cuisine = ((m.querySelector('#recipe-edit-cuisine') || {}).value || '').trim();
            r.persons = parseInt((m.querySelector('#recipe-edit-persons') || {}).value,10) || 4;
            r.time = parseInt((m.querySelector('#recipe-edit-time') || {}).value,10) || 20;
            r.emoji = ((m.querySelector('#recipe-edit-emoji') || {}).value || '').trim() || '🍽️';
            r.photo = ((m.querySelector('#recipe-edit-photo') || {}).value || '').trim() || pickFallback(r);
            r.ingredients = String((m.querySelector('#recipe-edit-ingredients') || {}).value || '').split('\n').map(function(x){ return x.trim(); }).filter(Boolean);
            r.steps = String((m.querySelector('#recipe-edit-steps') || {}).value || '').split('\n').map(function(x){ return x.trim(); }).filter(Boolean);
            r.notes = (m.querySelector('#recipe-edit-notes') || {}).value || '';
            persist('updateRecipe');
            toast('Recept opgeslagen ✓');
            render();
            if(typeof window.openRecipeDetail === 'function') setTimeout(function(){ window.openRecipeDetail(r.id); }, 100);
            return true;
          }}
        ]
      });
    });
  }

  function openPhotoSheet(id){
    ensureSheet().then(function(){
      ensureStyles();
      var r = findRecipe(id);
      if(!r || !window.BottomSheet) return;
      var current = r.photo || pickFallback(r);
      window.BottomSheet.open({
        title:'🖼️ Receptfoto',
        html:''
          +'<div id="recipe-photo-preview-manage" class="recipe-photo-preview" style="background-image:url(\''+esc(current)+'\')"></div>'
          +'<div class="fam-modal-field"><label>Foto URL</label><input id="recipe-photo-manage-url" value="'+esc(current)+'"></div>'
          +'<div class="recipe-upload-line"><button type="button" class="recipe-manage-btn primary" id="recipe-photo-upload-btn">📷 Uploaden</button><input class="recipe-upload-native" id="recipe-photo-upload" type="file" accept="image/*"><button type="button" class="recipe-manage-btn" id="recipe-photo-fallback-btn">✨ Sfeerfoto</button></div>'
          +'<div class="recipe-fallback-grid">'+PREMIUM_FALLBACKS.map(function(src,i){ return '<button type="button" class="recipe-fallback-thumb" data-photo="'+esc(src)+'" style="background-image:url(\''+esc(src)+'\')" aria-label="Sfeerfoto '+(i+1)+'"></button>'; }).join('')+'</div>',
        onOpen:function(ctx){
          var modal = ctx.modal;
          function setPhoto(src){
            var input = modal.querySelector('#recipe-photo-manage-url');
            var preview = modal.querySelector('#recipe-photo-preview-manage');
            if(input) input.value = src || '';
            if(preview) preview.style.backgroundImage = src ? "url('"+String(src).replace(/'/g,'%27')+"')" : '';
          }
          var input = modal.querySelector('#recipe-photo-manage-url');
          if(input) input.oninput = function(){ setPhoto(input.value); };
          var uploadBtn = modal.querySelector('#recipe-photo-upload-btn');
          var upload = modal.querySelector('#recipe-photo-upload');
          if(uploadBtn && upload) uploadBtn.onclick = function(){ upload.click(); };
          if(upload) upload.onchange = function(e){ readFileAsDataUrl(e.target.files[0], setPhoto); };
          var fallback = modal.querySelector('#recipe-photo-fallback-btn');
          if(fallback) fallback.onclick = function(){ setPhoto(PREMIUM_FALLBACKS[Math.floor(Math.random()*PREMIUM_FALLBACKS.length)]); };
          modal.querySelectorAll('[data-photo]').forEach(function(btn){ btn.onclick = function(){ setPhoto(btn.getAttribute('data-photo')); }; });
        },
        actions:[
          { label:'Annuleren' },
          { label:'Opslaan', primary:true, onClick:function(ctx){
            var url = ((ctx.modal.querySelector('#recipe-photo-manage-url') || {}).value || '').trim();
            r.photo = url || pickFallback(r);
            r.photoFallback = !url;
            persist('updateRecipePhoto');
            toast('Foto opgeslagen ✓');
            render();
            if(typeof window.openRecipeDetail === 'function') setTimeout(function(){ window.openRecipeDetail(r.id); }, 100);
            return true;
          }}
        ]
      });
    });
  }

  function deleteRecipe(id){
    var r = findRecipe(id);
    if(!r) return;
    if(!confirm('Recept "'+r.name+'" verwijderen?')) return;
    window.recipesData = recipes().filter(function(x){ return Number(x.id) !== Number(id); });
    persist('deleteRecipe');
    toast('Recept verwijderd');
    if(typeof window.showRecipeListView === 'function') window.showRecipeListView();
    render();
  }

  function installDetailActions(){
    ensureStyles();
    var r = currentRecipe();
    var content = document.getElementById('recipe-detail-content');
    if(!r || !content) return;
    if(document.getElementById('recipe-manage-row')) return;
    var title = content.querySelector('.recipe-title-area') || content.firstElementChild;
    var row = document.createElement('div');
    row.id = 'recipe-manage-row';
    row.className = 'recipe-manage-row';
    row.innerHTML = '<button class="recipe-manage-btn primary" id="recipe-manage-edit">✏️ Bewerken</button><button class="recipe-manage-btn" id="recipe-manage-photo">🖼️ Foto</button><button class="recipe-manage-btn danger" id="recipe-manage-delete">🗑️ Verwijderen</button>';
    if(title && title.parentNode) title.parentNode.insertBefore(row, title.nextSibling);
    else content.insertBefore(row, content.firstChild);
    var edit = document.getElementById('recipe-manage-edit');
    var photo = document.getElementById('recipe-manage-photo');
    var del = document.getElementById('recipe-manage-delete');
    if(edit) edit.onclick = function(){ openEditSheet(r.id); };
    if(photo) photo.onclick = function(){ openPhotoSheet(r.id); };
    if(del) del.onclick = function(){ deleteRecipe(r.id); };
  }

  function wrapDetail(){
    if(typeof window.openRecipeDetail !== 'function' || window.openRecipeDetail.__manageImageWrapped) return;
    var original = window.openRecipeDetail;
    window.openRecipeDetail = function(id){
      var result = original.apply(this, arguments);
      window.currentRecipeId = id;
      setTimeout(installDetailActions, 80);
      setTimeout(installDetailActions, 250);
      return result;
    };
    window.openRecipeDetail.__manageImageWrapped = true;
  }

  function boot(){
    ensureStyles();
    applyFallbacks();
    wrapDetail();
    installDetailActions();
    [200,800,1600,3000].forEach(function(delay){ setTimeout(function(){ applyFallbacks(); wrapDetail(); installDetailActions(); }, delay); });
  }

  window.RecipeManageAndImageBridge = { version:VERSION, boot:boot, openEditSheet:openEditSheet, openPhotoSheet:openPhotoSheet, deleteRecipe:deleteRecipe, applyFallbacks:applyFallbacks, fallbackImages:PREMIUM_FALLBACKS };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
