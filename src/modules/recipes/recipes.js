'use strict';
// ============================================================
// RECEPTEN
// ============================================================

var CAT_EMOJIS = {Ontbijt:'🥞',Lunch:'🥗',Diner:'🍽️',Snack:'🍿',Dessert:'🍰',Bakken:'🧁'};

var recipesData = [
  {id:1, name:'Lasagne', cat:'Diner', persons:4, time:60, photo:null,
   ingredients:['500g gehakt','2 uien','2 teentjes knoflook','1 blik tomaten (400g)','Lasagne platen','500ml béchamelsaus','100g geraspte kaas','Olijfolie, zout, peper'],
   steps:['Verwarm oven op 180°C.','Bak gehakt met ui en knoflook.','Voeg tomaten toe, 15 min sudderen.','Laag voor laag opbouwen: lasagne, vleessaus, béchamel.','Afsluiten met kaas. 40 min bakken.'],
   notes:'Heerlijk de volgende dag ook!'},
  {id:2, name:'Shakshuka', cat:'Ontbijt', persons:2, time:20, photo:null,
   ingredients:['4 eieren','1 blik tomaten','1 ui','1 paprika','Komijn, paprikapoeder','Feta (optioneel)'],
   steps:['Bak ui en paprika zacht.','Voeg tomaten en kruiden toe.','Maak kuiltjes en breek eieren erin.','Deksel op pan, 8-10 min laten staan.'],
   notes:'Lekker met knapperig brood'},
  {id:3, name:'Bananenbrood', cat:'Bakken', persons:8, time:65, photo:null,
   ingredients:['3 rijpe bananen','200g bloem','100g suiker','2 eieren','80g boter','1 tl bakpoeder','Snuf zout'],
   steps:['Verwarm oven op 175°C.','Prak bananen fijn.','Meng alle ingrediënten.','In broodvorm 55 min bakken.'],
   notes:''}
];
var recipeNextId = 4;
var recipeCatFilter = 'all';
var currentRecipeId = null;
var checkedIngredients = {}; // {recipeId: Set of checked indices}

function renderRecipes() {
  // Attach chip events
  document.querySelectorAll('#recipe-cat-chips .chip').forEach(function(c) {
    c.onclick = function() {
      document.querySelectorAll('#recipe-cat-chips .chip').forEach(function(x){x.classList.remove('active');});
      c.classList.add('active');
      recipeCatFilter = c.dataset.rcat;
      renderRecipeGrid();
    };
  });
  showRecipeListView();
  renderRecipeGrid();
}

function renderRecipeGrid() {
  var grid = document.getElementById('recipe-grid');
  if(!grid) return;
  var data = recipeCatFilter==='all' ? recipesData : recipesData.filter(function(r){return r.cat===recipeCatFilter;});
  if(!data.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--c-text2)">Nog geen recepten in deze categorie</div>';
    return;
  }
  // Give #recipe-grid itself the grid layout
  grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 16px 16px';
  grid.innerHTML = data.map(function(r) {
    var emoji = r.photo ? '' : (CAT_EMOJIS[r.cat] || '🍴');
    var thumbContent = r.photo
      ? '<img src="'+r.photo+'" style="width:100%;height:100%;object-fit:cover">'
      : '<span style="font-size:44px">'+emoji+'</span>';
    return '<div class="recipe-card" data-rid="'+r.id+'">'
      +'<div class="recipe-card-thumb" style="background:var(--c-surface2)">'+thumbContent+'</div>'
      +'<div class="recipe-card-body">'
      +'<div class="recipe-card-name">'+r.name+'</div>'
      +'<div class="recipe-card-meta">'
      +'<span class="recipe-cat-badge">'+r.cat+'</span>'
      +'<span>⏱ '+r.time+'m</span>'
      +'<span>👥 '+r.persons+'p</span>'
      +'</div></div></div>';
  }).join('');
  // Attach click events via JS (no inline onclick needed)
  grid.querySelectorAll('[data-rid]').forEach(function(card) {
    card.onclick = function() { openRecipeDetail(parseInt(card.dataset.rid)); };
  });
}

function showRecipeListView() {
  document.getElementById('recipe-list-view').style.display = 'block';
  document.getElementById('recipe-detail-view').style.display = 'none';
  document.getElementById('recipe-editor-view').style.display = 'none';
  document.getElementById('recipe-import-view').style.display = 'none';
}

function openRecipeDetail(id) {
  currentRecipeId = id;
  var r = recipesData.find(function(x){ return x.id === id; });
  if(!r) { showToast('Recept niet gevonden'); return; }

  // Ensure arrays exist
  if(!Array.isArray(r.ingredients)) r.ingredients = [];
  if(!Array.isArray(r.steps)) r.steps = [];
  if(!checkedIngredients[id]) checkedIngredients[id] = new Set();

  // Switch views
  var listView   = document.getElementById('recipe-list-view');
  var detailView = document.getElementById('recipe-detail-view');
  var editorView = document.getElementById('recipe-editor-view');
  var importView = document.getElementById('recipe-import-view');
  if(listView)   listView.style.display   = 'none';
  if(detailView) detailView.style.display = 'block';
  if(editorView) editorView.style.display = 'none';
  if(importView) importView.style.display = 'none';

  // Wire top buttons
  var editBtn = document.getElementById('recipe-edit-btn');
  var delBtn  = document.getElementById('recipe-delete-btn');
  if(editBtn) editBtn.onclick = function(){ openRecipeEditor(id); };
  if(delBtn)  delBtn.onclick  = function(){
    if(confirm('Recept "'+r.name+'" verwijderen?')) {
      recipesData = recipesData.filter(function(x){ return x.id !== id; });
      showRecipeListView(); renderRecipeGrid();
    }
  };

  // ── HERO ──
  var heroHtml = r.photo
    ? '<div class="recipe-hero-wrap" style="width:100%;height:210px;overflow:hidden;position:relative">'
      +'<img src="'+r.photo+'" style="width:100%;height:100%;object-fit:cover" onerror="this.parentNode.style.opacity=\'.3\'">'
      +'<button id="recipe-photo-btn" style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:20px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer">📷 Wijzigen</button>'
      +'</div>'
    : '<div class="recipe-hero-wrap" style="text-align:center;padding:28px 16px 12px;position:relative">'
      +'<div style="font-size:64px;line-height:1">'+(CAT_EMOJIS[r.cat]||'🍴')+'</div>'
      +'<button id="recipe-photo-btn" style="margin-top:10px;background:var(--c-surface);color:var(--c-text2);border:1px solid var(--c-border);border-radius:20px;padding:6px 14px;font-size:11px;font-weight:600;cursor:pointer">📷 Foto toevoegen</button>'
      +'</div>';

  // ── INGREDIENTS ──
  var checked = checkedIngredients[id];
  var ingsHtml = r.ingredients.length === 0
    ? '<p class="recipe-ing-text" style="padding:10px 0">Geen ingrediënten opgegeven</p>'
    : r.ingredients.map(function(ing, i){
        var done = checked.has(i);
        return '<label class="recipe-ing-label">'
          +'<input type="checkbox" '+(done?'checked':'')+' data-recid="'+id+'" data-idx="'+i+'" style="display:none">'
          +'<div class="recipe-ing-circle'+(done?' done':'')+'">'
          +(done?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>':'')
          +'</div>'
          +'<span class="recipe-ing-text'+(done?' done':'')+'">'+ing+'</span>'
          +'</label>';
      }).join('');

  // ── STEPS ──
  var stepsHtml = r.steps.length === 0
    ? '<p class="recipe-step-text" style="padding:10px 0">Geen bereidingsstappen opgegeven</p>'
    : r.steps.map(function(step, i){
        return '<div class="recipe-step-row">'
          +'<div class="recipe-step-num">'+(i+1)+'</div>'
          +'<div class="recipe-step-text">'+step+'</div>'
          +'</div>';
      }).join('');

  // ── RENDER ──
  var dc = document.getElementById('recipe-detail-content');
  if(!dc) return;

  dc.innerHTML =
    heroHtml
    +'<div class="recipe-title-area">'
    +'<h2>'+r.name+'</h2>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
    +'<span class="recipe-tag">📂 '+r.cat+'</span>'
    +'<span class="recipe-tag">⏱ '+r.time+' min</span>'
    +'<span class="recipe-tag">👥 '+r.persons+' pers</span>'
    +'</div></div>'
    +'<div class="recipe-ings-wrap">'
    +'<div class="recipe-section-header">Ingrediënten</div>'
    +ingsHtml
    +'<button class="recipe-shop-btn" id="to-shop-btn">🛒 Zet alles op boodschappenlijst</button>'
    +'</div>'
    +'<div class="recipe-steps-wrap">'
    +'<div class="recipe-section-header">Bereiding</div>'
    +stepsHtml
    +'</div>'
    +(r.notes
      ? '<div class="recipe-notes-wrap"><div class="recipe-notes-label">💡 Notities</div>'
        +'<div class="recipe-notes-body">'+r.notes+'</div></div>'
      : '')
    +'<div style="height:40px"></div>';

  // ── EVENT LISTENERS (after innerHTML) ──
  // Photo button
  var pBtn = document.getElementById('recipe-photo-btn');
  if(pBtn) pBtn.onclick = function(){ openRecipePhotoSheet(id); };

  // Shop button
  var sBtn = document.getElementById('to-shop-btn');
  if(sBtn) sBtn.onclick = function(){ addRecipeToShop(id); };

  // Ingredient checkboxes — use change event on label
  dc.querySelectorAll('[data-recid]').forEach(function(inp){
    inp.onchange = function(){
      var rid = parseInt(inp.dataset.recid);
      var idx = parseInt(inp.dataset.idx);
      if(!checkedIngredients[rid]) checkedIngredients[rid] = new Set();
      var s = checkedIngredients[rid];
      if(s.has(idx)) s.delete(idx); else s.add(idx);
      var done = s.has(idx);
      var lbl    = inp.closest('label');
      var circle = lbl ? lbl.querySelector('.recipe-ing-circle') : null;
      var text   = lbl ? lbl.querySelector('.recipe-ing-text')   : null;
      if(circle){
        circle.classList.toggle('done', done);
        circle.innerHTML = done
          ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>'
          : '';
      }
      if(text) text.classList.toggle('done', done);
    };
  });
}


function closeRecipeDetail() { showRecipeListView(); renderRecipeGrid(); }

// ── PHOTO SHEET ──
var photoSheetRecipeId = null;

function openRecipePhotoSheet(id) {
  photoSheetRecipeId = id;
  document.getElementById('recipe-photo-overlay').style.display = 'block';
  document.getElementById('recipe-photo-suggestions').innerHTML = '';
  document.getElementById('recipe-photo-status').textContent = '';
  document.getElementById('recipe-photo-url').value = '';

  // Wire file input
  var fileInp = document.getElementById('recipe-photo-file');
  fileInp.onchange = function(e) {
    var file = e.target.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      saveRecipePhoto(id, ev.target.result);
      closeRecipePhotoSheet();
    };
    reader.readAsDataURL(file);
    fileInp.value = '';
  };
}

function closeRecipePhotoSheet() {
  document.getElementById('recipe-photo-overlay').style.display = 'none';
  photoSheetRecipeId = null;
}

function saveRecipePhotoUrl() {
  var url = document.getElementById('recipe-photo-url').value.trim();
  if(!url) return;
  saveRecipePhoto(photoSheetRecipeId, url);
  closeRecipePhotoSheet();
}

function saveRecipePhoto(id, src) {
  var r = recipesData.find(function(x){return x.id===id;});
  if(r) { r.photo = src; openRecipeDetail(id); renderRecipeGrid(); }
}

function removeRecipePhoto() {
  var r = recipesData.find(function(x){return x.id===photoSheetRecipeId;});
  if(r) { r.photo = null; openRecipeDetail(r.id); renderRecipeGrid(); }
  closeRecipePhotoSheet();
}

function generateRecipePhoto() {
  if(!checkApiKey()) return;
  var r = recipesData.find(function(x){return x.id===photoSheetRecipeId;});
  if(!r) return;
  var statusEl = document.getElementById('recipe-photo-status');
  var sugEl = document.getElementById('recipe-photo-suggestions');
  statusEl.innerHTML = '<div style="display:flex;gap:4px;justify-content:center;align-items:center;padding:8px"><div class="ai-typing-dot"></div><div class="ai-typing-dot"></div><div class="ai-typing-dot"></div></div>AI zoekt fotos...';
  sugEl.innerHTML = '';

  // Use Gemini to get Unsplash search query for this dish
  var photoPrompt = 'Geef mij een Unsplash zoekterm (1-3 woorden, Engels) voor het gerecht: "'+r.name+'". Geef ALLEEN de zoekterm terug, niets anders.';
  callGemini(photoPrompt, null, 20)
  .then(function(query){
    var q = encodeURIComponent((query||r.name).trim().replace(/[^a-zA-Z0-9 ]/g,''));
    var urls = [1,2,3].map(function(s){return 'https://source.unsplash.com/400x400/?'+q+',food&sig='+s;});
    statusEl.textContent = 'Kies een foto:';
    sugEl.innerHTML = urls.map(function(url) {
      return '<div style="aspect-ratio:1;border-radius:10px;overflow:hidden;cursor:pointer" data-purl="'+encodeURIComponent(url)+'">'
        +'<img src="'+url+'" style="width:100%;height:100%;object-fit:cover">'
        +'</div>';
    }).join('');
    sugEl.querySelectorAll('[data-purl]').forEach(function(el){
      el.onclick=function(){pickAiPhoto(decodeURIComponent(el.dataset.purl));};
    });
  })
  .catch(function(){
    // Fallback zonder AI
    var query = encodeURIComponent(r.name + ' food');
    try {
      var urls = JSON.parse(clean);
      statusEl.textContent = 'Kies een foto:';
      sugEl.innerHTML = urls.map(function(url) {
        return '<div style="aspect-ratio:1;border-radius:10px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color .15s" onclick="pickAiPhoto(\''+url.replace(/'/g,'%27')+'\')">'
          +'<img src="'+url+'" style="width:100%;height:100%;object-fit:cover" onerror="this.parentNode.style.display=\'none\'">'
          +'</div>';
      }).join('');
    } catch(e) {
      // Fallback: use Unsplash source API which always works
      var query = encodeURIComponent(r.name + ' food');
      var fallbacks = [
        'https://source.unsplash.com/400x400/?'+query+'&sig=1',
        'https://source.unsplash.com/400x400/?'+query+'&sig=2',
        'https://source.unsplash.com/400x400/?'+query+'&sig=3'
      ];
      statusEl.textContent = 'Kies een foto:';
      sugEl.innerHTML = fallbacks.map(function(url) {
        return '<div style="aspect-ratio:1;border-radius:10px;overflow:hidden;cursor:pointer" onclick="pickAiPhoto(\''+url+'\')">'
          +'<img src="'+url+'" style="width:100%;height:100%;object-fit:cover">'
          +'</div>';
      }).join('');
    }
  })
  .catch(function(){
    // Always fallback to Unsplash source
    var query = encodeURIComponent((r.name||'food')+' dish food');
    statusEl.textContent = 'Kies een foto:';
    sugEl.innerHTML = [1,2,3].map(function(sig) {
      var url = 'https://source.unsplash.com/400x400/?'+query+'&sig='+sig;
      return '<div style="aspect-ratio:1;border-radius:10px;overflow:hidden;cursor:pointer" onclick="pickAiPhoto(\''+url+'\')">'
        +'<img src="'+url+'" style="width:100%;height:100%;object-fit:cover">'
        +'</div>';
    }).join('');
  });
}

function pickAiPhoto(url) {
  saveRecipePhoto(photoSheetRecipeId, decodeURIComponent(url.replace(/%27/g,"'")));
  closeRecipePhotoSheet();
  showToast('Foto opgeslagen ✓');
}

// Also add photo field to editor
function addPhotoToEditor(id) {
  document.getElementById('recipe-photo-file').click();
}

function toggleIngredient(recipeId, idx) {
  if(!checkedIngredients[recipeId]) checkedIngredients[recipeId] = new Set();
  var set = checkedIngredients[recipeId];
  if(set.has(idx)) set.delete(idx); else set.add(idx);
  openRecipeDetail(recipeId); // re-render
}

function addRecipeToShop(recipeId) {
  var r = recipesData.find(function(x){return x.id===recipeId;});
  if(!r) return;
  var added = 0;
  r.ingredients.forEach(function(ing) {
    // Parse ingredient: "500g gehakt" -> name="gehakt", qty="500g"
    var match = ing.match(/^([\d\/]+\s*(?:g|kg|ml|l|el|tl|stuk|stuks|blik|teen|teentjes|snuf|takje|tak)?\s+)/i);
    var qty = match ? match[1].trim() : '1x';
    var name = match ? ing.substring(match[0].length).trim() : ing;
    // Don't add if already on list
    var exists = shopData.some(function(s){return s.name.toLowerCase()===name.toLowerCase()&&!s.done;});
    if(!exists) {
      shopData.unshift({id:shopNextId++, name:name, qty:qty, cat:'Overig', who:myName, done:false, photo:null});
      added++;
    }
  });
  updateStats();
  addActivity('🛒','#fff3dc',myName+' voegde '+added+' ingrediënten toe van "'+r.name+'"');
  addNotif('🛒','#fff3dc','Ingrediënten toegevoegd!',added+' items van "'+r.name+'" staan nu op de lijst');
  awardXP(2,'Recept naar lijst');
  showToast(added+' ingrediënten toegevoegd aan boodschappen ✓');
}

function openRecipeEditor(id) {
  document.getElementById('recipe-list-view').style.display = 'none';
  document.getElementById('recipe-detail-view').style.display = 'none';
  document.getElementById('recipe-editor-view').style.display = 'block';
  document.getElementById('recipe-import-view').style.display = 'none';

  var r = id ? recipesData.find(function(x){return x.id===id;}) : null;
  currentRecipeId = id || null;
  document.getElementById('recipe-editor-title').textContent = r ? 'Recept bewerken' : 'Nieuw recept';
  document.getElementById('re-name').value = r ? r.name : '';
  document.getElementById('re-cat').value = r ? r.cat : 'Diner';
  document.getElementById('re-persons').value = r ? r.persons : 4;
  document.getElementById('re-time').value = r ? r.time : 30;
  document.getElementById('re-ingredients').value = r ? r.ingredients.join('\n') : '';
  document.getElementById('re-steps').value = r ? r.steps.join('\n') : '';
  document.getElementById('re-notes').value = r ? r.notes||'' : '';
  setTimeout(attachIngredientAutocomplete, 100);
  document.getElementById('re-photo-url').value = (r && r.photo && !r.photo.startsWith('data:')) ? r.photo : '';

  // Photo preview
  var preview = document.getElementById('re-photo-preview');
  if(preview) {
    if(r && r.photo) {
      preview.innerHTML = '<img src="'+r.photo+'" style="width:100%;height:100%;object-fit:cover">';
    } else {
      preview.textContent = CAT_EMOJIS[r ? r.cat : 'Diner'] || '🍴';
    }
  }

  // File upload handler
  var fileInp = document.getElementById('re-photo-file');
  fileInp.onchange = function(e) {
    var file = e.target.files[0]; if(!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      var preview2 = document.getElementById('re-photo-preview');
      if(preview2) preview2.innerHTML = '<img src="'+ev.target.result+'" style="width:100%;height:100%;object-fit:cover">';
      fileInp._dataUrl = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
}

function saveRecipe() {
  var name = document.getElementById('re-name').value.trim();
  if(!name) { showToast('Vul een naam in'); return; }

  // Determine photo: uploaded file takes priority, then URL field, then existing
  var existingR = currentRecipeId ? recipesData.find(function(x){return x.id===currentRecipeId;}) : null;
  var fileInp = document.getElementById('re-photo-file');
  var urlInp = document.getElementById('re-photo-url');
  var photo = (fileInp && fileInp._dataUrl) || (urlInp && urlInp.value.trim()) || (existingR && existingR.photo) || null;
  if(fileInp) fileInp._dataUrl = null; // clear after use

  var r = {
    id: currentRecipeId || recipeNextId++,
    name: name,
    cat: document.getElementById('re-cat').value,
    persons: parseInt(document.getElementById('re-persons').value)||4,
    time: parseInt(document.getElementById('re-time').value)||30,
    ingredients: document.getElementById('re-ingredients').value.split('\n').map(function(s){return s.trim();}).filter(Boolean),
    steps: document.getElementById('re-steps').value.split('\n').map(function(s){return s.trim();}).filter(Boolean),
    notes: document.getElementById('re-notes').value.trim(),
    photo: photo
  };
  if(currentRecipeId) {
    var idx = recipesData.findIndex(function(x){return x.id===currentRecipeId;});
    if(idx>-1) recipesData[idx]=r;
  } else {
    recipesData.unshift(r);
    awardXP(4,'Recept aangemaakt');
    addActivity('🍳','#fff3dc',myName+' maakte recept "'+r.name+'" aan');
  }
  currentRecipeId = r.id;
  showToast('Recept opgeslagen ✓');
  openRecipeDetail(r.id);
}

function closeRecipeEditor() {
  if(currentRecipeId) openRecipeDetail(currentRecipeId);
  else showRecipeListView();
}

function openRecipeImport() {
  document.getElementById('recipe-list-view').style.display = 'none';
  document.getElementById('recipe-detail-view').style.display = 'none';
  document.getElementById('recipe-editor-view').style.display = 'none';
  document.getElementById('recipe-import-view').style.display = 'block';
  document.getElementById('recipe-import-status').textContent = '';
  document.getElementById('recipe-url-inp').value = '';
}

function closeRecipeImport() { showRecipeListView(); renderRecipeGrid(); }

function importRecipeFromUrl() {
  if(!checkApiKey()) return;
  var url = document.getElementById('recipe-url-inp').value.trim();
  if(!url) { showToast('Vul een URL in'); return; }
  var statusEl = document.getElementById('recipe-import-status');
  statusEl.innerHTML = '<div style="display:flex;gap:6px;justify-content:center;align-items:center"><div class="ai-typing-dot"></div><div class="ai-typing-dot"></div><div class="ai-typing-dot"></div></div><div style="margin-top:6px">Recept ophalen via AI...</div>';

  var importPrompt = 'Analyseer deze recepten URL en geef het recept als JSON terug. URL: '+url+'\n\n'
    +'Als je de pagina niet kan ophalen, maak dan een plausibel recept op basis van de URL naam.\n\n'
    +'JSON formaat (ALLEEN JSON, geen markdown, geen uitleg):\n'
    +'{"name":"...","cat":"Diner","persons":4,"time":30,'
    +'"ingredients":["500g gehakt","2 uien"],'
    +'"steps":["Stap 1...","Stap 2..."],'
    +'"notes":"...",'
    +'"photo":"https://source.unsplash.com/600x400/?GERECHT_NAAM+food"}\n\n'
    +'Vervang GERECHT_NAAM met de echte naam (Engels, URL-encoded).\n'
    +'Categorieën: Ontbijt, Lunch, Diner, Snack, Dessert, Bakken';

  callGemini(importPrompt, null, 1200)
  .then(function(text){
    var clean = text.replace(/```json|```/g,'').trim();
    try {
      var recipe = JSON.parse(clean);
      recipe.id = recipeNextId++;
      if(!recipe.name) throw new Error('Geen naam');
      if(!recipe.photo) recipe.photo = null;
      recipesData.unshift(recipe);
      showRecipeListView();
      renderRecipeGrid();
      showToast('Recept "'+recipe.name+'" geïmporteerd! 🍳');
      awardXP(5,'Recept geïmporteerd');
      // Auto-open detail
      setTimeout(function(){ openRecipeDetail(recipe.id); }, 300);
    } catch(e) {
      statusEl.textContent = '❌ Kon recept niet verwerken. Probeer een ander adres of voeg handmatig toe.';
    }
  })
  .catch(function(){
    statusEl.textContent = '❌ Verbindingsfout. Controleer je internetverbinding.';
  });
}

// ============================================================
// AI ASSISTENT (per scherm)
// ============================================================

var aiPanelOpen = false;
var aiCurrentScreen = 'home';
var aiMessages = [];
var aiLoading = false;

var AI_CONTEXTS = {
  home:        {title:'🏠 Home Assistent', sub:'Tips over de app', chips:['Wat kan ik hier doen?','Toon mijn voortgang','Wat zijn quick tips?']},
  tasks:       {title:'✅ Taken Assistent', sub:'Tips over taken & planning', chips:['Hoe plan ik slim?','Taakverdeling tips','Productiviteit boost']},
  shop:        {title:'🛒 Boodschappen AI', sub:'Slimme boodschappen tips', chips:['Budget besparen tips','Gezonde alternatieven','Wat mis ik vaak?']},
  notes:       {title:'📝 Notities Assistent', sub:'Tips over notities maken', chips:['Hoe organiseer ik goed?','Note-taking tips','Beste structuur voor recepten']},
  feed:        {title:'📸 Feed Assistent', sub:'Tips voor gezinsberichten', chips:['Compliment ideeën','Hoe deel ik nieuws?','Leuke post ideeën']},
  finance:     {title:'💰 Financieel Adviseur', sub:'Budgettips & inzichten', chips:['Bezuinigingstips','Spaarstrategie','Hoe verdeel ik kosten?']},
  cal:         {title:'📅 Agenda Assistent', sub:'Planning & tijdbeheer', chips:['Weekplanning tips','Hoe plan ik activiteiten?','Herinneringen instellen']},
  achievements:{title:'🏆 Gamification Coach', sub:'Level up tips', chips:['Hoe krijg ik meer XP?','Badges tips','Beste streak opbouwen']},
  recipes:     {title:'🍳 Kookassistent', sub:'Recepten & kooktips', chips:['Wat kan ik maken?','Ingrediënten substituties','Gezonde aanpassingen']},
  notif:       {title:'🔔 Meldingen Help', sub:'App meldingen', chips:['Wat betekent dit?','Notificatie tips']},
  profile:     {title:'👤 Profiel Assistent', sub:'Personalisatie tips', chips:['Thema advies','XP strategie','App aanpassen']}
};

function toggleAiPanel() {
  aiPanelOpen = !aiPanelOpen;
  var panel = document.getElementById('ai-panel');
  var fab = document.getElementById('ai-fab');
  if(aiPanelOpen) {
    panel.classList.add('open');
    fab.classList.add('panel-open');
    panel.style.display='flex';
    updateAiContext();
    setTimeout(function(){document.getElementById('ai-input').focus();},200);
  } else {
    panel.classList.remove('open');
    fab.classList.remove('panel-open');
    panel.style.display='none';
  }
}

function updateAiContext() {
  // Find current screen
  var current = 'home';
  document.querySelectorAll('.screen').forEach(function(s){
    if(s.classList.contains('active')) current = s.id.replace('screen-','');
  });
  if(current === aiCurrentScreen && aiMessages.length > 0) return;
  aiCurrentScreen = current;
  aiMessages = [];

  var ctx = AI_CONTEXTS[current] || AI_CONTEXTS.home;
  var titleEl = document.getElementById('ai-panel-title');
  var subEl = document.getElementById('ai-panel-sub');
  if(titleEl) titleEl.textContent = ctx.title;
  if(subEl) subEl.textContent = ctx.sub;

  // Render welcome message
  var msgs = document.getElementById('ai-messages');
  if(msgs) {
    msgs.innerHTML = '<div class="ai-msg ai-msg-ai">Hoi! Ik ben je '+ctx.title.replace(/^[^ ]+ /,'')+'. Wat kan ik voor je doen?</div>';
  }

  // Quick chips
  var chipsEl = document.getElementById('ai-quick-chips');
  if(chipsEl) {
    chipsEl.innerHTML = (ctx.chips||[]).map(function(chip) {
      return '<button class="ai-quick-chip" onclick="sendAiChip(\''+chip.replace(/'/g,'&apos;')+'\')">' + chip + '</button>';
    }).join('');
  }
}

function sendAiChip(text) {
  document.getElementById('ai-input').value = text;
  sendAiMessage();
}

function sendAiMessage() {
  if(!checkApiKey()) return;
  var inp = document.getElementById('ai-input');
  var text = inp ? inp.value.trim() : '';
  if(!text || aiLoading) return;
  inp.value = '';

  // Add user message to UI
  var msgs = document.getElementById('ai-messages');
  if(msgs) {
    var userDiv = document.createElement('div');
    userDiv.className = 'ai-msg ai-msg-user';
    userDiv.textContent = text;
    msgs.appendChild(userDiv);
    // Typing indicator
    var typingDiv = document.createElement('div');
    typingDiv.className = 'ai-msg-typing';
    typingDiv.id = 'ai-typing';
    typingDiv.innerHTML = '<div class="ai-typing-dot"></div><div class="ai-typing-dot"></div><div class="ai-typing-dot"></div>';
    msgs.appendChild(typingDiv);
    msgs.scrollTop = msgs.scrollHeight;
  }

  aiMessages.push({role:'user', content:text});
  aiLoading = true;
  var sendBtn = document.getElementById('ai-send-btn');
  if(sendBtn) sendBtn.style.opacity = '0.5';

  // Build context
  var ctx = AI_CONTEXTS[aiCurrentScreen] || AI_CONTEXTS.home;
  var contextData = getScreenContextData(aiCurrentScreen);
  var systemPrompt = 'Je bent een vriendelijke, korte en praktische AI assistent ingebouwd in een gezins-app genaamd FamilieApp voor Shane en Esra. '
    + 'Je specialiteit op dit moment is: ' + ctx.title + '. '
    + 'Huidige app data context: ' + contextData + '. '
    + 'Geef ALTIJD korte, vriendelijke antwoorden in het Nederlands. Max 3-4 zinnen. Gebruik emoji\'s. Wees concreet en praktisch.';

  callGemini(conversationPrompt, systemPrompt, 400)
  .then(function(reply){
    aiMessages.push({role:'assistant', content:reply});
    var typing = document.getElementById('ai-typing');
    if(typing) typing.remove();
    var msgs2 = document.getElementById('ai-messages');
    if(msgs2) {
      var aiDiv = document.createElement('div');
      aiDiv.className = 'ai-msg ai-msg-ai';
      aiDiv.textContent = reply;
      msgs2.appendChild(aiDiv);
      msgs2.scrollTop = msgs2.scrollHeight;
    }
  })
  .catch(function(e){
    var typing = document.getElementById('ai-typing');
    if(typing) typing.remove();
    var msgs2 = document.getElementById('ai-messages');
    if(msgs2) {
      var errDiv = document.createElement('div');
      errDiv.className = 'ai-msg ai-msg-ai';
      var errMsg = e.message==='NO_KEY' ? '⚙️ Geen API key. Ga naar Profiel → Gemini API Key.' : '❌ Fout: '+e.message;
      errDiv.textContent = errMsg;
      msgs2.appendChild(errDiv);
      msgs2.scrollTop = msgs2.scrollHeight;
    }
  })
  .finally(function(){
    aiLoading = false;
    var sendBtn2 = document.getElementById('ai-send-btn');
    if(sendBtn2) sendBtn2.style.opacity = '1';
  });
}

function getScreenContextData(screen) {
  try {
    if(screen==='tasks') return 'Open taken: '+taskData.filter(function(t){return !t.done;}).length+', Vaste taken: '+recurData.length;
    if(screen==='shop') return 'Items te kopen: '+shopData.filter(function(i){return !i.done;}).length;
    if(screen==='finance') return 'Inkomen Shane: €'+inkomenShane.amount+', Esra: €'+inkomenEsra.amount+', Vaste lasten: €'+vasteLasten.reduce(function(s,l){return s+l.amount;},0);
    if(screen==='recipes') return 'Recepten: '+recipesData.length+', Categorieën: '+[...new Set(recipesData.map(function(r){return r.cat;}))].join(', ');
    if(screen==='achievements') return 'XP: '+myXP+', Level: '+getLevel(myXP)+', Badges: '+Object.keys(unlockedBadges).length+'/'+BADGES.length;
    return 'Scherm: '+screen;
  } catch(e) { return 'Scherm: '+screen; }
}

// Enter key in AI input
document.addEventListener('DOMContentLoaded', function(){
  var inp = document.getElementById('ai-input');
  if(inp) inp.addEventListener('keydown', function(e){if(e.key==='Enter')sendAiMessage();});
});

