'use strict';
// ============================================================
// RECIPE SERVERLESS LINK IMPORT v0.277
// Professional free import flow using /api/import-recipe first.
// Overrides the temporary AI-key based link import button.
// ============================================================

(function(){
  var STORE_KEY = 'fam_recipes_v1';
  var BTN_ID = 'r-import-link-btn';
  var STYLE_ID = 'recipe-serverless-link-import-style';
  var CATS = ['Ontbijt','Lunch','Diner','Snack','Dessert','Bakken'];
  var CAT_ICONS = {Ontbijt:'🥞',Lunch:'🥗',Diner:'🍽️',Snack:'🍿',Dessert:'🍰',Bakken:'🧁'};

  function esc(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function newId(){ return 'r' + Date.now() + Math.random().toString(36).slice(2,6); }
  function validUrl(url){ try { var u = new URL(url); return /^https?:$/.test(u.protocol); } catch(e){ return false; } }

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.rli-note{font-size:12px;line-height:1.4;color:var(--c-text2,#667085);background:var(--c-surface2,#f3f5f2);border-radius:14px;padding:10px;margin:8px 0 12px}',
      '.rli-status{font-size:13px;line-height:1.45;color:var(--c-text2,#667085);margin-top:10px;min-height:18px}',
      '.rli-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '.rli-preview-img{width:100%;height:120px;border-radius:16px;object-fit:cover;background:var(--c-surface2,#f3f5f2);margin:8px 0 4px}',
      '.rli-warning{font-size:12px;line-height:1.4;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:10px;margin:8px 0 12px}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function titleFromUrl(url){
    try {
      var u = new URL(url);
      var part = decodeURIComponent((u.pathname.split('/').filter(Boolean).pop() || u.hostname).replace(/[-_]+/g, ' '));
      return part.replace(/\.[a-z0-9]+$/i, '').replace(/\s+/g, ' ').trim() || 'Geïmporteerd recept';
    } catch(e){ return 'Geïmporteerd recept'; }
  }

  function normalizeRecipe(input, sourceUrl){
    input = input || {};
    var cat = CATS.indexOf(input.cat) >= 0 ? input.cat : 'Diner';
    var ingredients = Array.isArray(input.ingredients) ? input.ingredients : [];
    var steps = Array.isArray(input.steps) ? input.steps : [];
    ingredients = ingredients.map(function(x){ return String(x || '').trim(); }).filter(Boolean);
    steps = steps.map(function(x){ return String(x || '').trim(); }).filter(Boolean);
    if(!ingredients.length) ingredients = ['Controleer ingrediënten via de bronlink'];
    if(!steps.length) steps = ['Open de bronlink en vul de bereidingsstappen aan'];
    return {
      id: input.id || newId(),
      name: String(input.name || '').trim() || titleFromUrl(sourceUrl),
      cat: cat,
      cuisine: String(input.cuisine || '').trim() || 'Onbekend',
      persons: parseInt(input.persons, 10) || 4,
      time: parseInt(input.time, 10) || 30,
      emoji: input.emoji || CAT_ICONS[cat] || '🍴',
      photo: String(input.photo || '').trim() || null,
      ingredients: ingredients,
      steps: steps,
      notes: String(input.notes || '').trim() || 'Geïmporteerd via receptlink. Controleer dit recept vóór gebruik.',
      sourceUrl: sourceUrl || input.sourceUrl || '',
      importSource: input.importSource || 'serverless'
    };
  }

  function fallbackRecipe(url, reason){
    return normalizeRecipe({
      name: titleFromUrl(url),
      cat: 'Diner',
      cuisine: 'Onbekend',
      persons: 4,
      time: 30,
      ingredients: ['Controleer ingrediënten via de bronlink'],
      steps: ['Open de bronlink en vul de bereidingsstappen aan'],
      notes: 'Geen gestructureerde receptdata gevonden. Basisconcept gemaakt uit de link.',
      importSource: 'fallback',
      warning: reason || 'Geen receptdata gevonden'
    }, url);
  }

  function importViaServerless(url, onStatus){
    if(onStatus) onStatus('Receptdata ophalen...');
    return fetch('/api/import-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url })
    }).then(function(res){
      return res.json().catch(function(){ return {}; });
    }).then(function(data){
      if(!data || data.ok === false) return fallbackRecipe(url, data && data.error);
      return normalizeRecipe(data.recipe || {}, url);
    }).catch(function(err){
      console.warn('[RecipeServerlessLinkImport] import failed', err);
      return fallbackRecipe(url, 'Import endpoint niet beschikbaar');
    });
  }

  function getRecipeStore(){
    if(Array.isArray(window.recipesData)) return window.recipesData;
    try {
      var raw = localStorage.getItem(STORE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      if(Array.isArray(parsed)) { window.recipesData = parsed; return parsed; }
    } catch(e) {}
    window.recipesData = [];
    return window.recipesData;
  }

  function saveRecipe(recipe){
    var list = getRecipeStore();
    list.unshift(recipe);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch(e) {}
    try { if(window.HouseholdRepository && window.HouseholdRepository.write) window.HouseholdRepository.write('recipes', list, {source:'recipe-serverless-link-import'}); } catch(e) {}
    try { if(typeof window.awardXP === 'function') window.awardXP(5, 'Recept geïmporteerd'); } catch(e) {}
    try { if(typeof window.addActivity === 'function') window.addActivity('🍳','#fff3dc',(window.myName || 'Iemand') + ' importeerde recept "' + recipe.name + '"'); } catch(e) {}
    if(typeof window.showToast === 'function') window.showToast('Recept geïmporteerd ✓');
  }

  function previewHtml(r){
    var catOptions = CATS.map(function(c){ return '<option '+(r.cat === c ? 'selected' : '')+'>'+c+'</option>'; }).join('');
    var warning = r.importSource === 'fallback' ? '<div class="rli-warning">Geen volledige receptdata gevonden. Er is een basisconcept gemaakt; vul dit handmatig aan.</div>' : '';
    return ''
      + warning
      + '<div class="rli-note">Controleer dit recept even voordat je opslaat. De import leest gratis receptdata uit de pagina, maar websites verschillen.</div>'
      + (r.photo ? '<img class="rli-preview-img" src="'+esc(r.photo)+'" onerror="this.style.display=\'none\'">' : '')
      + '<div class="fam-modal-field"><label>Naam</label><input id="rli-name" value="'+esc(r.name)+'"></div>'
      + '<div class="rli-grid2"><div class="fam-modal-field"><label>Categorie</label><select id="rli-cat">'+catOptions+'</select></div><div class="fam-modal-field"><label>Keuken</label><input id="rli-cuisine" value="'+esc(r.cuisine)+'"></div></div>'
      + '<div class="rli-grid2"><div class="fam-modal-field"><label>Personen</label><input id="rli-persons" type="number" value="'+esc(r.persons)+'"></div><div class="fam-modal-field"><label>Tijd min</label><input id="rli-time" type="number" value="'+esc(r.time)+'"></div></div>'
      + '<div class="fam-modal-field"><label>Foto URL</label><input id="rli-photo" value="'+esc(r.photo || '')+'"></div>'
      + '<div class="fam-modal-field"><label>Ingrediënten</label><textarea id="rli-ingredients" rows="5">'+esc((r.ingredients||[]).join('\n'))+'</textarea></div>'
      + '<div class="fam-modal-field"><label>Stappen</label><textarea id="rli-steps" rows="5">'+esc((r.steps||[]).join('\n'))+'</textarea></div>'
      + '<div class="fam-modal-field"><label>Notities</label><textarea id="rli-notes" rows="2">'+esc(r.notes || '')+'</textarea></div>';
  }

  function readPreview(modal, original){
    var cat = modal.querySelector('#rli-cat').value || 'Diner';
    return normalizeRecipe({
      name: modal.querySelector('#rli-name').value,
      cat: cat,
      cuisine: modal.querySelector('#rli-cuisine').value,
      persons: modal.querySelector('#rli-persons').value,
      time: modal.querySelector('#rli-time').value,
      photo: modal.querySelector('#rli-photo').value,
      ingredients: modal.querySelector('#rli-ingredients').value.split('\n'),
      steps: modal.querySelector('#rli-steps').value.split('\n'),
      notes: modal.querySelector('#rli-notes').value,
      emoji: CAT_ICONS[cat] || original.emoji || '🍴',
      importSource: original.importSource || 'serverless'
    }, original.sourceUrl || '');
  }

  function openPreview(recipe){
    if(!window.BottomSheet) return;
    window.BottomSheet.open({
      title: '✅ Controleer recept',
      html: previewHtml(recipe),
      actions: [
        { label: 'Annuleren' },
        { label: 'Opslaan', primary: true, onClick: function(ctx){
          var finalRecipe = readPreview(ctx.modal, recipe);
          if(!finalRecipe.name || !finalRecipe.ingredients.length){
            if(typeof window.showToast === 'function') window.showToast('Naam en ingrediënten zijn verplicht');
            return false;
          }
          saveRecipe(finalRecipe);
          setTimeout(function(){
            if(typeof window.renderRecipes === 'function') window.renderRecipes();
            if(typeof window.openRecipeDetail === 'function') window.openRecipeDetail(finalRecipe.id);
            if(window.RecipeCardImageFix && window.RecipeCardImageFix.apply) window.RecipeCardImageFix.apply();
          }, 80);
          return true;
        }}
      ]
    });
  }

  function openImportSheet(){
    addStyle();
    if(!window.BottomSheet) return;
    window.BottomSheet.open({
      title: '🔗 Recept via link',
      html: '<div class="rli-note">Plak een receptenlink. FamilyApp probeert gratis receptdata uit de pagina te halen. Geen AI API-key nodig.</div>'
        + '<div class="fam-modal-field"><label>Recept link</label><input id="rli-url" placeholder="https://..." inputmode="url"></div>'
        + '<div class="rli-status" id="rli-status"></div>',
      onOpen: function(ctx){
        var inp = ctx.modal.querySelector('#rli-url');
        if(inp) setTimeout(function(){ try { inp.focus(); } catch(e){} }, 120);
      },
      actions: [
        { label: 'Annuleren' },
        { label: 'Importeren', primary: true, keepOpen: true, onClick: function(ctx){
          var input = ctx.modal.querySelector('#rli-url');
          var status = ctx.modal.querySelector('#rli-status');
          var url = input ? input.value.trim() : '';
          if(!validUrl(url)){
            if(status) status.textContent = 'Plak een geldige http(s) link.';
            return false;
          }
          if(status) status.textContent = 'Bezig met importeren...';
          importViaServerless(url, function(msg){ if(status) status.textContent = msg; })
            .then(function(recipe){ ctx.close(); setTimeout(function(){ openPreview(recipe); }, 240); })
            .catch(function(err){ if(status) status.textContent = err && err.message ? err.message : 'Importeren mislukt.'; });
          return false;
        }}
      ]
    });
  }

  function patchButton(){
    addStyle();
    var btn = document.getElementById(BTN_ID);
    if(!btn) return;
    btn.onclick = openImportSheet;
    btn.title = 'Recept gratis importeren via link';
  }

  function boot(){
    patchButton();
    var screen = document.getElementById('screen-recipes');
    if(screen && !screen.__recipeServerlessLinkImportObserver){
      screen.__recipeServerlessLinkImportObserver = true;
      new MutationObserver(patchButton).observe(screen, { childList:true, subtree:true });
    }
  }

  var tries = 0;
  var timer = setInterval(function(){
    tries++;
    boot();
    if(document.getElementById(BTN_ID) || tries > 30) clearInterval(timer);
  }, 150);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.RecipeServerlessLinkImport = { boot: boot, open: openImportSheet };
})();
