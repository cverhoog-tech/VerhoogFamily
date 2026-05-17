'use strict';
// ============================================================
// RECIPE BOTTOM SHEET BRIDGE v0.357
// Adds recipe URL import foundation + manual recipe creation via BottomSheet.
// Browser-side website parsing is intentionally fallback-first because many
// recipe sites block direct reads with CORS. A backend/AI parser can later hook
// into RecipeImportBridge.parseUrl().
// ============================================================

(function(){
  var VERSION = '0.357';
  var loadingPromise = null;
  var STORAGE_KEY = 'familyapp_food_recipes_v001';

  function loadScriptOnce(id, src, ready){
    return new Promise(function(resolve){
      if(ready && ready()) return resolve();
      if(document.getElementById(id)){
        var tries = 0;
        var wait = setInterval(function(){
          tries++;
          if(!ready || ready() || tries > 50){ clearInterval(wait); resolve(); }
        }, 40);
        return;
      }
      var script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.onload = function(){ resolve(); };
      script.onerror = function(){ console.warn('[RecipeBottomSheetBridge] failed to load', src); resolve(); };
      document.body.appendChild(script);
    });
  }

  function ensureBottomSheet(){
    if(loadingPromise) return loadingPromise;
    loadingPromise = Promise.resolve()
      .then(function(){ return loadScriptOnce('modal-manager-js', 'src/core/modalManager.js', function(){ return !!window.ModalManager; }); })
      .then(function(){ return loadScriptOnce('bottom-sheet-js', 'src/core/bottomSheet.js', function(){ return !!window.BottomSheet; }); });
    return loadingPromise;
  }

  function esc(v){
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function ensureRecipes(){
    if(!Array.isArray(window.recipesData)) window.recipesData = [];
    window.recipeNextId = Math.max.apply(null, window.recipesData.map(function(r){ return Number(r.id) || 0; }).concat([0])) + 1;
  }

  function persistRecipes(operation){
    ensureRecipes();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(window.recipesData || [])); } catch(error) {}
    if(window.HouseholdRepository && typeof window.HouseholdRepository.write === 'function'){
      window.HouseholdRepository.write('recipes', window.recipesData || [], { source:'recipeBottomSheetBridge', operation:operation || 'recipeMutation', version:VERSION });
    }
    try { window.dispatchEvent(new CustomEvent('familyapp:food:recipes-updated', { detail:{ recipes:window.recipesData || [], version:VERSION } })); } catch(error) {}
  }

  function toast(msg){ if(typeof window.showToast === 'function') window.showToast(msg); }
  function xp(n,label){ if(typeof window.awardXP === 'function') window.awardXP(n,label); }
  function activity(icon,bg,text){ if(typeof window.addActivity === 'function') window.addActivity(icon,bg,text); }

  function parseLines(value){
    return String(value || '').split('\n').map(function(v){ return v.trim(); }).filter(Boolean);
  }

  function emojiForCategory(cat){
    var map = { Ontbijt:'🥞', Lunch:'🥗', Diner:'🍽️', Snack:'🍿', Dessert:'🍰', Bakken:'🧁' };
    return map[cat] || '🍴';
  }

  function guessNameFromUrl(url){
    try {
      var u = new URL(url);
      var part = u.pathname.split('/').filter(Boolean).pop() || u.hostname;
      return decodeURIComponent(part).replace(/[-_]+/g,' ').replace(/\.[a-z0-9]+$/i,'').trim();
    } catch(error) {
      return '';
    }
  }

  function parseRecipeFromUrl(url){
    // Placeholder parser. Real extraction needs backend/proxy/AI because most sites block CORS.
    return Promise.resolve({
      sourceUrl: url,
      name: guessNameFromUrl(url),
      cat: 'Diner',
      persons: 4,
      time: 30,
      emoji: '🍴',
      ingredients: [],
      steps: [],
      notes: 'Geïmporteerd van: ' + url + '\nControleer en vul ingrediënten/bereiding aan.'
    });
  }

  function recipeSheetHtml(existing){
    return ''
      +'<div class="fam-modal-field"><label>Importeren</label><button type="button" id="recipe-bs-import-url" style="width:100%;border:1.5px dashed var(--c-border);background:var(--c-surface2);border-radius:16px;padding:12px;font-weight:900;color:var(--c-text)">🌐 Importeer van website</button></div>'
      +'<div class="fam-modal-field"><label>Naam</label><input id="recipe-bs-name" placeholder="bijv. Pasta pesto" value="'+esc(existing ? existing.name : '')+'"></div>'
      +'<div class="fam-modal-field"><label>Categorie</label><select id="recipe-bs-cat"><option>Ontbijt</option><option>Lunch</option><option>Diner</option><option>Snack</option><option>Dessert</option><option>Bakken</option></select></div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="fam-modal-field"><label>Personen</label><input id="recipe-bs-persons" type="number" min="1" step="1" value="'+esc(existing ? existing.persons || 4 : 4)+'"></div><div class="fam-modal-field"><label>Tijd min.</label><input id="recipe-bs-time" type="number" min="1" step="1" value="'+esc(existing ? existing.time || 20 : 20)+'"></div></div>'
      +'<div class="fam-modal-field"><label>Icoon / emoji</label><input id="recipe-bs-emoji" placeholder="🍝" value="'+esc(existing ? (existing.emoji || '') : '')+'"></div>'
      +'<div class="fam-modal-field"><label>Ingrediënten</label><textarea id="recipe-bs-ingredients" rows="5" placeholder="Elke regel is één ingrediënt">'+esc(existing ? (existing.ingredients || []).join('\n') : '')+'</textarea></div>'
      +'<div class="fam-modal-field"><label>Bereiding</label><textarea id="recipe-bs-steps" rows="5" placeholder="Elke regel is één stap">'+esc(existing ? (existing.steps || []).join('\n') : '')+'</textarea></div>'
      +'<div class="fam-modal-field"><label>Bron URL</label><input id="recipe-bs-source-url" placeholder="https://..." value="'+esc(existing ? existing.sourceUrl || '' : '')+'"></div>'
      +'<div class="fam-modal-field"><label>Notities</label><textarea id="recipe-bs-notes" rows="3" placeholder="Optioneel">'+esc(existing ? existing.notes || '' : '')+'</textarea></div>';
  }

  function fillRecipeForm(modal, data){
    function set(id, value){ var el = modal.querySelector('#'+id); if(el && value != null) el.value = value; }
    set('recipe-bs-name', data.name || '');
    set('recipe-bs-cat', data.cat || 'Diner');
    set('recipe-bs-persons', data.persons || 4);
    set('recipe-bs-time', data.time || 30);
    set('recipe-bs-emoji', data.emoji || emojiForCategory(data.cat || 'Diner'));
    set('recipe-bs-ingredients', (data.ingredients || []).join('\n'));
    set('recipe-bs-steps', (data.steps || []).join('\n'));
    set('recipe-bs-source-url', data.sourceUrl || '');
    set('recipe-bs-notes', data.notes || '');
  }

  function openImportUrlSheet(parentModal){
    if(!window.BottomSheet) return;
    window.BottomSheet.open({
      title: '🌐 Recept importeren',
      html: '<div class="fam-modal-field"><label>Recept URL</label><input id="recipe-import-url" placeholder="https://..."></div><div style="font-size:12px;line-height:1.45;color:var(--c-text2);margin-top:8px">Plak een link naar een recept. Automatisch scannen wordt voorbereid; als de site blokkert, vullen we alvast bron en titel in zodat je kunt controleren.</div>',
      onOpen: function(ctx){ var input = ctx.modal.querySelector('#recipe-import-url'); if(input) setTimeout(function(){ input.focus(); }, 80); },
      actions: [
        { label:'Annuleren' },
        { label:'Importeren', primary:true, keepOpen:true, onClick:function(ctx){
          var url = ((ctx.modal.querySelector('#recipe-import-url') || {}).value || '').trim();
          if(!url){ toast('Plak eerst een receptlink'); return false; }
          parseRecipeFromUrl(url).then(function(data){
            if(parentModal && parentModal.parentNode) fillRecipeForm(parentModal, data);
            if(window.ModalManager) window.ModalManager.close();
            toast('Receptlink toegevoegd. Controleer de velden.');
          });
          return false;
        }}
      ]
    });
  }

  function openRecipeSheet(editId){
    ensureBottomSheet().then(function(){
      ensureRecipes();
      if(!window.BottomSheet) return;
      var existing = editId ? window.recipesData.find(function(r){ return Number(r.id) === Number(editId); }) : null;
      window.BottomSheet.open({
        title: existing ? '✏️ Recept bewerken' : '🍳 Nieuw recept',
        html: recipeSheetHtml(existing),
        onOpen: function(ctx){
          var cat = ctx.modal.querySelector('#recipe-bs-cat');
          if(cat && existing) cat.value = existing.cat || 'Diner';
          var importBtn = ctx.modal.querySelector('#recipe-bs-import-url');
          if(importBtn) importBtn.onclick = function(){ openImportUrlSheet(ctx.modal); };
          var name = ctx.modal.querySelector('#recipe-bs-name');
          if(name) setTimeout(function(){ name.focus(); }, 80);
        },
        actions: [
          { label:'Annuleren' },
          { label:'Opslaan', primary:true, onClick:function(ctx){
            var modal = ctx.modal;
            var name = (modal.querySelector('#recipe-bs-name') || {}).value || '';
            name = name.trim();
            var cat = (modal.querySelector('#recipe-bs-cat') || {}).value || 'Diner';
            var persons = parseInt((modal.querySelector('#recipe-bs-persons') || {}).value, 10) || 4;
            var time = parseInt((modal.querySelector('#recipe-bs-time') || {}).value, 10) || 20;
            var emoji = ((modal.querySelector('#recipe-bs-emoji') || {}).value || '').trim() || emojiForCategory(cat);
            var ingredients = parseLines((modal.querySelector('#recipe-bs-ingredients') || {}).value);
            var steps = parseLines((modal.querySelector('#recipe-bs-steps') || {}).value);
            var sourceUrl = ((modal.querySelector('#recipe-bs-source-url') || {}).value || '').trim();
            var notes = (modal.querySelector('#recipe-bs-notes') || {}).value || '';
            if(!name){ toast('Vul een receptnaam in'); return false; }
            if(!ingredients.length){ toast('Voeg minimaal één ingrediënt toe'); return false; }
            if(existing){
              existing.name = name; existing.cat = cat; existing.persons = persons; existing.time = time; existing.emoji = emoji; existing.ingredients = ingredients; existing.steps = steps; existing.sourceUrl = sourceUrl; existing.notes = notes;
              persistRecipes('updateRecipe');
              toast('Recept opgeslagen ✓');
            } else {
              window.recipesData.unshift({ id:window.recipeNextId++, name:name, cat:cat, persons:persons, time:time, emoji:emoji, sourceUrl:sourceUrl, photo:null, ingredients:ingredients, steps:steps, notes:notes });
              persistRecipes('createRecipe');
              activity('🍳','#fff3dc',(window.myName || 'Gezin')+' voegde recept "'+name+'" toe');
              xp(3,'Recept toegevoegd');
              toast('Recept toegevoegd ✓');
            }
            if(typeof window.renderRecipes === 'function') window.renderRecipes();
            return true;
          }}
        ]
      });
    });
  }

  function overrideOpenAdd(){
    var original = window.openAdd;
    if(original && original.__recipeBottomSheetWrapped) return;
    window.openAdd = function(type){
      if(type === 'recipe') { openRecipeSheet(null); return false; }
      if(typeof original === 'function') return original.apply(this, arguments);
      return false;
    };
    window.openAdd.__recipeBottomSheetWrapped = true;
  }

  function boot(){
    overrideOpenAdd();
    [100,300,800,1500,2500].forEach(function(delay){ setTimeout(overrideOpenAdd, delay); });
  }

  window.RecipeImportBridge = { version:VERSION, parseUrl:parseRecipeFromUrl, openImportUrlSheet:openImportUrlSheet };
  window.RecipeBottomSheetBridge = { version:VERSION, openRecipeSheet:openRecipeSheet, boot:boot };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
