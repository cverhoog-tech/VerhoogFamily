'use strict';
// ============================================================
// RECIPE LINK IMPORT v0.276
// AI-assisted recipe import from a pasted URL, with preview before save.
// No scraper/backend: safe MVP layer on top of recipes.js v0.272.
// ============================================================

(function(){
  var STORE_KEY = 'fam_recipes_v1';
  var BTN_ID = 'r-import-link-btn';
  var STYLE_ID = 'recipe-link-import-style';
  var CATS = ['Ontbijt','Lunch','Diner','Snack','Dessert','Bakken'];
  var CAT_ICONS = {Ontbijt:'🥞',Lunch:'🥗',Diner:'🍽️',Snack:'🍿',Dessert:'🍰',Bakken:'🧁'};

  function esc(v){
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function newId(){
    return 'r' + Date.now() + Math.random().toString(36).slice(2,6);
  }

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '#'+BTN_ID+'{background:var(--c-surface2,#f3f5f2);color:var(--c-text,#111827);border:0;border-radius:99px;padding:8px 13px;font-size:13px;font-weight:800;cursor:pointer;margin-left:8px;white-space:nowrap}',
      '.rli-note{font-size:12px;line-height:1.4;color:var(--c-text2,#667085);background:var(--c-surface2,#f3f5f2);border-radius:14px;padding:10px;margin:8px 0 12px}',
      '.rli-status{font-size:13px;line-height:1.45;color:var(--c-text2,#667085);margin-top:10px;min-height:18px}',
      '.rli-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '.rli-preview-img{width:100%;height:120px;border-radius:16px;object-fit:cover;background:var(--c-surface2,#f3f5f2);margin:8px 0 4px}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function validUrl(url){
    try { var u = new URL(url); return /^https?:$/.test(u.protocol); } catch(e){ return false; }
  }

  function cleanJsonText(text){
    text = String(text || '').replace(/```json|```/gi, '').trim();
    var first = text.indexOf('{');
    var last = text.lastIndexOf('}');
    if(first >= 0 && last > first) text = text.slice(first, last + 1);
    return text;
  }

  function normalizeRecipe(input, sourceUrl){
    input = input || {};
    var cat = CATS.indexOf(input.cat) >= 0 ? input.cat : 'Diner';
    var name = String(input.name || '').trim();
    if(!name) name = titleFromUrl(sourceUrl);
    var ingredients = Array.isArray(input.ingredients) ? input.ingredients : [];
    var steps = Array.isArray(input.steps) ? input.steps : [];

    ingredients = ingredients.map(function(x){ return String(x || '').trim(); }).filter(Boolean);
    steps = steps.map(function(x){ return String(x || '').trim(); }).filter(Boolean);

    if(!ingredients.length) ingredients = ['Controleer ingrediënten via bronlink'];
    if(!steps.length) steps = ['Controleer bereidingswijze via bronlink'];

    return {
      id: newId(),
      name: name,
      cat: cat,
      cuisine: String(input.cuisine || '').trim() || 'Onbekend',
      persons: parseInt(input.persons, 10) || 4,
      time: parseInt(input.time, 10) || 30,
      emoji: input.emoji || CAT_ICONS[cat] || '🍴',
      photo: String(input.photo || '').trim() || null,
      ingredients: ingredients,
      steps: steps,
      notes: String(input.notes || '').trim() || ('Geïmporteerd via link: ' + sourceUrl),
      sourceUrl: sourceUrl
    };
  }

  function titleFromUrl(url){
    try {
      var u = new URL(url);
      var part = decodeURIComponent((u.pathname.split('/').filter(Boolean).pop() || u.hostname).replace(/[-_]+/g, ' '));
      return part.replace(/\.[a-z0-9]+$/i, '').replace(/\s+/g, ' ').trim() || 'Geïmporteerd recept';
    } catch(e){
      return 'Geïmporteerd recept';
    }
  }

  function fallbackRecipe(url){
    return normalizeRecipe({
      name: titleFromUrl(url),
      cat: 'Diner',
      cuisine: 'Onbekend',
      persons: 4,
      time: 30,
      ingredients: ['Controleer ingrediënten via de bronlink'],
      steps: ['Open de bronlink en vul de bereidingsstappen aan'],
      notes: 'AI import kon niet volledig worden verwerkt. Controleer dit recept handmatig.'
    }, url);
  }

  function buildPrompt(url){
    return [
      'Je bent een recepten-import assistent voor FamilyApp.',
      'Maak van deze receptenlink een gestructureerd recept voor een gezinsapp.',
      'URL: ' + url,
      '',
      'Geef ALLEEN geldige JSON terug. Geen markdown. Geen uitleg.',
      'Gebruik exact deze velden:',
      '{',
      '  "name": "...",',
      '  "cat": "Diner",',
      '  "cuisine": "...",',
      '  "persons": 4,',
      '  "time": 30,',
      '  "photo": "",',
      '  "ingredients": ["500g voorbeeld", "2 stuks voorbeeld"],',
      '  "steps": ["Stap 1", "Stap 2"],',
      '  "notes": "Controleer dit recept op basis van de bronlink."',
      '}',
      '',
      'Toegestane cat waarden: Ontbijt, Lunch, Diner, Snack, Dessert, Bakken.',
      'Als de pagina niet gelezen kan worden, leid dan een plausibel recept af uit de URL/titel, maar zet in notes dat controle nodig is.',
      'Gebruik korte Nederlandse ingrediënten en duidelijke Nederlandse stappen.'
    ].join('\n');
  }

  function importViaAI(url, onStatus){
    if(typeof window.callGemini !== 'function') return Promise.resolve(fallbackRecipe(url));
    if(typeof window.checkApiKey === 'function' && !window.checkApiKey()) return Promise.reject(new Error('Geen API key ingesteld'));
    if(onStatus) onStatus('AI analyseert de link...');
    return window.callGemini(buildPrompt(url), null, 1600).then(function(text){
      var parsed = JSON.parse(cleanJsonText(text));
      return normalizeRecipe(parsed, url);
    }).catch(function(err){
      console.warn('[RecipeLinkImport] AI import failed, using fallback', err);
      return fallbackRecipe(url);
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
    try { if(window.HouseholdRepository && window.HouseholdRepository.write) window.HouseholdRepository.write('recipes', list, {source:'recipe-link-import'}); } catch(e) {}
    try { if(typeof window.awardXP === 'function') window.awardXP(5, 'Recept geïmporteerd'); } catch(e) {}
    try { if(typeof window.addActivity === 'function') window.addActivity('🍳','#fff3dc',(window.myName || 'Iemand') + ' importeerde recept "' + recipe.name + '"'); } catch(e) {}
    if(typeof window.showToast === 'function') window.showToast('Recept geïmporteerd ✓');
  }

  function previewHtml(r){
    var catOptions = CATS.map(function(c){ return '<option '+(r.cat === c ? 'selected' : '')+'>'+c+'</option>'; }).join('');
    return ''
      + '<div class="rli-note">Controleer dit recept even voordat je opslaat. AI-import is handig, maar niet altijd perfect.</div>'
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
      emoji: CAT_ICONS[cat] || original.emoji || '🍴'
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
    if(!window.BottomSheet) return;
    window.BottomSheet.open({
      title: '🔗 Recept via link',
      html: '<div class="rli-note">Plak een receptenlink. FamilyApp maakt een conceptrecept met AI. Je krijgt altijd eerst een preview.</div>'
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
          importViaAI(url, function(msg){ if(status) status.textContent = msg; })
            .then(function(recipe){
              ctx.close();
              setTimeout(function(){ openPreview(recipe); }, 240);
            })
            .catch(function(err){
              if(status) status.textContent = err && err.message ? err.message : 'Importeren mislukt.';
            });
          return false;
        }}
      ]
    });
  }

  function injectButton(){
    addStyle();
    var addBtn = document.getElementById('r-addbtn');
    if(!addBtn || document.getElementById(BTN_ID)) return;
    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.textContent = '🔗 Link';
    btn.onclick = openImportSheet;
    addBtn.insertAdjacentElement('afterend', btn);
  }

  function boot(){
    injectButton();
    var screen = document.getElementById('screen-recipes');
    if(screen && !screen.__recipeLinkImportObserver){
      screen.__recipeLinkImportObserver = true;
      new MutationObserver(injectButton).observe(screen, { childList:true, subtree:true });
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

  window.RecipeLinkImport = { boot: boot, open: openImportSheet };
})();
