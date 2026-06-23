'use strict';
// ============================================================
// RECIPE DIRECT STABLE PATCH v0.377
// Patches the active legacy recipes.js renderer directly.
// No filter bridges, no render loops, no white-screen prone wrappers.
// ============================================================

(function(){
  var VERSION = '0.377';
  var STYLE_ID = 'recipe-direct-stable-style';
  var search = '';

  var IMG = 'https://images.unsplash.com/';
  var FALLBACKS = [
    IMG+'photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=85',
    IMG+'photo-1498579397066-22750a3cb424?auto=format&fit=crop&w=1200&q=85',
    IMG+'photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=85',
    IMG+'photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85',
    IMG+'photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=85',
    IMG+'photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=85'
  ];

  var EXTRA = [
    {name:'Surinaamse roti met kip masala',cat:'Diner',persons:4,time:75,photo:FALLBACKS[0],ingredients:['4 rotiplaten','600g kipdijfilet','600g aardappelen','400g kousenband of sperziebonen','4 eieren','2 uien','3 teentjes knoflook','2 el masala'],steps:['Bak ui en knoflook.','Voeg kip en masala toe.','Stoof met aardappel gaar.','Serveer met roti, ei en groenten.'],notes:'Madame Jeanette apart serveren.'},
    {name:'Surinaamse pasteitjes met kip',cat:'Snack',persons:8,time:55,photo:FALLBACKS[3],ingredients:['10 plakjes bladerdeeg','350g kipfilet','1 ui','2 teentjes knoflook','150g doperwten en wortel','1 tl kerrie','1 ei'],steps:['Kook en pluk kip.','Maak kruidige vulling.','Vul bladerdeeg en bestrijk met ei.','Bak goudbruin.'],notes:'Perfect als snack.'},
    {name:'Indische loempia’s met kip',cat:'Snack',persons:6,time:70,photo:FALLBACKS[3],ingredients:['12 loempiavellen','350g kip','200g witte kool','150g wortel','100g taugé','2 teentjes knoflook','1 el ketjap'],steps:['Roerbak vulling.','Laat afkoelen.','Rol in loempiavellen.','Frituur of airfry krokant.'],notes:'Serveer met chilisaus.'},
    {name:'Pom met kip',cat:'Diner',persons:6,time:110,photo:FALLBACKS[4],ingredients:['1kg pomtayer','700g kip','2 uien','2 el tomatenpuree','Sinaasappel','Citroen','Bouillonblokje'],steps:['Bak kip met ui en tomatenpuree.','Meng pom met citrus en jus.','Laag pom en kip in ovenschaal.','Bak goudbruin.'],notes:'Lekker met rijst en zuur.'},
    {name:'Saoto soep',cat:'Diner',persons:4,time:80,photo:FALLBACKS[5],ingredients:['Kip','Bouillon','Laos','Salam','Taugé','Ei','Rijst','Aardappelsticks','Selderij'],steps:['Trek kippenbouillon.','Pluk kip.','Vul kommen met rijst, kip en toppings.','Schenk bouillon erover.'],notes:'Sambal apart.'},
    {name:'Nasi goreng kampung',cat:'Diner',persons:4,time:35,photo:IMG+'photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=85',ingredients:['500g koude rijst','3 eieren','250g kip','Sjalot','Knoflook','Ketjap','Sambal'],steps:['Bak aromaten.','Voeg kip toe.','Roerbak rijst op hoog vuur.','Serveer met ei.'],notes:'Koude rijst werkt best.'},
    {name:'Rendang daging',cat:'Diner',persons:6,time:180,photo:IMG+'photo-1625944525533-473f1a3d54e7?auto=format&fit=crop&w=1200&q=85',ingredients:['1kg rundvlees','400ml kokosmelk','Citroengras','Limoenblad','Ui','Knoflook','Gember','Kruiden'],steps:['Maak boemboe.','Bak vlees aan.','Stoof met kokosmelk langzaam droog.'],notes:'Volgende dag nog lekkerder.'},
    {name:'Gado gado',cat:'Lunch',persons:4,time:35,photo:IMG+'photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=85',ingredients:['Sperziebonen','Aardappel','Taugé','Komkommer','Ei','Tofu','Pindasaus'],steps:['Kook groenten en eieren.','Bak tofu.','Schik op schaal.','Serveer met pindasaus.'],notes:'Lauw of koud.'},
    {name:'Adana kebab met pilav',cat:'Diner',persons:4,time:55,photo:FALLBACKS[0],ingredients:['600g gehakt','Rode peper','Ui','Peterselie','Komijn','Paprika','Pilavrijst','Flatbread'],steps:['Kruid gehakt.','Vorm kebabs.','Grill gaar.','Serveer met pilav.'],notes:'Gebruik pul biber voor pit.'},
    {name:'Köfte met bulgur salade',cat:'Diner',persons:4,time:50,photo:IMG+'photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=85',ingredients:['600g gehakt','Ui','Knoflook','Ei','Paneermeel','Komijn','Bulgur','Tomaat','Komkommer'],steps:['Meng en vorm köfte.','Bak of grill.','Maak bulgur salade.','Serveer met yoghurt.'],notes:'Meal prep vriendelijk.'},
    {name:'Manti met yoghurt-knoflooksaus',cat:'Diner',persons:4,time:95,photo:FALLBACKS[3],ingredients:['Deegvellen','300g gehakt','Ui','Yoghurt','Knoflook','Boter','Paprikapoeder','Munt'],steps:['Vul deeg met gehakt.','Kook manti.','Meng yoghurt met knoflook.','Serveer met paprikaboter.'],notes:'Vullend gerecht.'},
    {name:'Karnıyarık gevulde aubergine',cat:'Diner',persons:4,time:80,photo:IMG+'photo-1625944228741-cf30983ecb78?auto=format&fit=crop&w=1200&q=85',ingredients:['4 aubergines','400g gehakt','Ui','Tomaat','Groene peper','Knoflook','Tomatenpuree'],steps:['Rooster aubergines.','Bak gehaktvulling.','Vul aubergines.','Bak met saus in oven.'],notes:'Lekker met rijst.'},
    {name:'Tavuk şiş met bulgur',cat:'Diner',persons:4,time:50,photo:IMG+'photo-1529563021893-cc83c992d75d?auto=format&fit=crop&w=1200&q=85',ingredients:['600g kipdijfilet','Yoghurt','Citroen','Knoflook','Paprika','Komijn','Bulgur'],steps:['Marineer kip.','Rijg spiesen.','Grill gaar.','Serveer met bulgur.'],notes:'Ook goed op BBQ.'},
    {name:'Turkse sigara böreği',cat:'Snack',persons:6,time:35,photo:FALLBACKS[2],ingredients:['Yufka','250g feta','Peterselie','Ei','Peper','Olie'],steps:['Meng feta en peterselie.','Rol yufka strak op.','Bak krokant.'],notes:'Lekker met yoghurt-dip.'},
    {name:'Spaghetti carbonara',cat:'Diner',persons:4,time:25,photo:IMG+'photo-1612874742237-6526221588e3?auto=format&fit=crop&w=1200&q=85',ingredients:['400g spaghetti','150g pancetta','3 eieren','80g Parmezaan','Zwarte peper'],steps:['Kook pasta.','Bak pancetta.','Meng ei en kaas.','Combineer van het vuur met pastawater.'],notes:'Geen room nodig.'},
    {name:'Pizza margherita',cat:'Diner',persons:4,time:60,photo:FALLBACKS[2],ingredients:['Pizzadeeg','Tomatensaus','Mozzarella','Basilicum','Olijfolie'],steps:['Verwarm oven heet.','Beleg pizza.','Bak krokant.','Garneer basilicum.'],notes:'Simpel en premium.'},
    {name:'Risotto funghi',cat:'Diner',persons:4,time:45,photo:IMG+'photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=1200&q=85',ingredients:['320g risottorijst','300g paddenstoelen','Ui','Bouillon','Parmezaan','Boter'],steps:['Fruit rijst.','Voeg bouillon langzaam toe.','Bak paddenstoelen.','Roer met kaas en boter.'],notes:'Rustig blijven roeren.'},
    {name:'Pasta arrabbiata',cat:'Diner',persons:4,time:30,photo:IMG+'photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=85',ingredients:['400g penne','Tomaten','Knoflook','Chilivlokken','Olijfolie','Parmezaan'],steps:['Fruit knoflook en chili.','Laat tomaten inkoken.','Meng pasta met saus.'],notes:'Pittig en snel.'},
    {name:'Pasta al forno',cat:'Diner',persons:6,time:65,photo:IMG+'photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=85',ingredients:['500g pasta','500g gehakt','Tomatensaus','Mozzarella','Parmezaan','Ui','Knoflook'],steps:['Maak gehaktsaus.','Meng met pasta.','Doe in ovenschaal.','Bak met kaas.'],notes:'Familie ovenschotel.'},
    {name:'Boerenkool stamppot met rookworst',cat:'Diner',persons:4,time:40,photo:IMG+'photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',ingredients:['Aardappelen','Boerenkool','Rookworst','Melk','Boter','Mosterd'],steps:['Kook aardappelen en boerenkool.','Stamp met melk en boter.','Serveer met rookworst.'],notes:'Extra lekker met spekjes.'}
  ];

  function ensureStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.recipe-search-direct{padding:0 16px 12px;margin-top:-2px}',
      '.recipe-search-direct input{width:100%;height:46px;border-radius:18px;border:1px solid var(--c-border,#edf0ec);background:var(--c-surface,#fff);padding:0 14px;font-size:15px;font-weight:800;box-shadow:0 8px 22px rgba(17,24,39,.045)}',
      '.recipe-manage-direct{display:flex;gap:8px;flex-wrap:wrap;padding:0 16px 14px}',
      '.recipe-manage-direct button{border:0;border-radius:999px;padding:10px 13px;font-size:12px;font-weight:950;background:var(--c-surface2,#f4f7f2);color:var(--c-text,#111827)}',
      '.recipe-manage-direct .primary{background:var(--c-primary,#3f7f2f);color:#fff}',
      '.recipe-manage-direct .danger{background:#fff1f1;color:#c23333}',
      '.recipe-step-check-row{display:flex;gap:12px;align-items:flex-start;background:var(--c-surface,#fff);border:1px solid var(--c-border,#edf0ec);border-radius:16px;margin-bottom:8px;padding:12px}',
      '.recipe-step-circle{width:26px;height:26px;min-width:26px;border-radius:50%;border:2px solid var(--c-border,#d8dfd6);display:flex;align-items:center;justify-content:center}',
      '.recipe-step-circle.done{background:var(--c-primary,#3f7f2f);border-color:var(--c-primary,#3f7f2f)}',
      '.recipe-step-text.done{text-decoration:line-through;color:var(--c-text3,#9aa3af)}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function recipes(){ return Array.isArray(window.recipesData) ? window.recipesData : (typeof recipesData !== 'undefined' ? recipesData : []); }
  function setRecipes(next){ window.recipesData = next; try { recipesData = next; } catch(e) {} }
  function nextId(){ var arr = recipes(); var max = Math.max.apply(null, arr.map(function(r){return Number(r.id)||0;}).concat([0])); window.recipeNextId = max + 1; try { recipeNextId = max + 1; } catch(e) {} return max + 1; }
  function n(v){ return String(v||'').toLowerCase().trim(); }
  function esc(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function fallback(r){ return r.photo || FALLBACKS[(Number(r.id)||0) % FALLBACKS.length]; }

  function forceSeed(){
    var arr = recipes();
    var existing = {};
    arr.forEach(function(r){ existing[n(r.name)] = true; if(!r.photo) r.photo = fallback(r); });
    var added = 0;
    EXTRA.forEach(function(item){
      if(existing[n(item.name)]) return;
      var copy = JSON.parse(JSON.stringify(item));
      copy.id = nextId() + added;
      copy.seeded = true;
      arr.push(copy);
      existing[n(copy.name)] = true;
      added++;
    });
    setRecipes(arr);
    try { if(typeof recipeNextId !== 'undefined') recipeNextId = Math.max.apply(null, arr.map(function(r){return Number(r.id)||0;})) + 1; } catch(e) {}
  }

  function installSearch(){
    var grid = document.getElementById('recipe-grid');
    if(!grid || document.getElementById('recipe-search-direct')) return;
    var wrap = document.createElement('div');
    wrap.id = 'recipe-search-direct';
    wrap.className = 'recipe-search-direct';
    wrap.innerHTML = '<input id="recipe-search-input-direct" placeholder="🔎 Zoek recept, ingrediënt of keuken" value="'+esc(search)+'">';
    grid.parentNode.insertBefore(wrap, grid);
    var inp = document.getElementById('recipe-search-input-direct');
    inp.oninput = function(){ search = inp.value || ''; if(typeof window.renderRecipeGrid === 'function') window.renderRecipeGrid(); };
  }

  function renderGrid(){
    forceSeed();
    installSearch();
    var grid = document.getElementById('recipe-grid');
    if(!grid) return;
    var filter = (typeof window.recipeCatFilter !== 'undefined' ? window.recipeCatFilter : (typeof recipeCatFilter !== 'undefined' ? recipeCatFilter : 'all')) || 'all';
    var q = n(search);
    var data = recipes().filter(function(r){
      var catOk = filter === 'all' || r.cat === filter;
      var hay = n([r.name,r.cat,r.cuisine,r.notes,(r.ingredients||[]).join(' ')].join(' '));
      return catOk && (!q || hay.indexOf(q) > -1);
    });
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 16px 120px';
    if(!data.length){ grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--c-text2)">Geen recepten gevonden</div>'; return; }
    grid.innerHTML = data.map(function(r){
      var photo = fallback(r);
      return '<div class="recipe-card" data-rid="'+esc(r.id)+'">'
        +'<div class="recipe-card-thumb" style="background:var(--c-surface2);overflow:hidden"><img src="'+esc(photo)+'" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display=\'none\';this.parentNode.innerHTML=\'<span style=&quot;font-size:44px&quot;>🍽️</span>\'"></div>'
        +'<div class="recipe-card-body"><div class="recipe-card-name">'+esc(r.name)+'</div><div class="recipe-card-meta"><span class="recipe-cat-badge">'+esc(r.cat||'Diner')+'</span><span>⏱ '+esc(r.time||20)+'m</span><span>👥 '+esc(r.persons||4)+'p</span></div></div></div>';
    }).join('');
    grid.querySelectorAll('[data-rid]').forEach(function(card){ card.onclick = function(){ window.openRecipeDetail(parseInt(card.dataset.rid)); }; });
  }

  function openDetail(id){
    forceSeed();
    var r = recipes().find(function(x){return Number(x.id)===Number(id);});
    if(!r) return;
    window.currentRecipeId = id; try { currentRecipeId = id; } catch(e) {}
    var listView = document.getElementById('recipe-list-view');
    var detailView = document.getElementById('recipe-detail-view');
    var editorView = document.getElementById('recipe-editor-view');
    var importView = document.getElementById('recipe-import-view');
    if(listView) listView.style.display='none'; if(detailView) detailView.style.display='block'; if(editorView) editorView.style.display='none'; if(importView) importView.style.display='none';
    var dc = document.getElementById('recipe-detail-content'); if(!dc) return;
    window.checkedIngredients = window.checkedIngredients || {}; window.checkedRecipeSteps = window.checkedRecipeSteps || {};
    if(!window.checkedIngredients[id]) window.checkedIngredients[id] = new Set();
    if(!window.checkedRecipeSteps[id]) window.checkedRecipeSteps[id] = new Set();
    var ingSet = window.checkedIngredients[id]; var stepSet = window.checkedRecipeSteps[id];
    if(Array.isArray(ingSet)) ingSet = window.checkedIngredients[id] = new Set(ingSet);
    if(Array.isArray(stepSet)) stepSet = window.checkedRecipeSteps[id] = new Set(stepSet);
    var ingHtml = (r.ingredients||[]).map(function(ing,i){ var done=ingSet.has(i); return '<label class="recipe-ing-label"><input type="checkbox" '+(done?'checked':'')+' data-ing="'+i+'" style="display:none"><div class="recipe-ing-circle '+(done?'done':'')+'">'+(done?'✓':'')+'</div><span class="recipe-ing-text '+(done?'done':'')+'">'+esc(ing)+'</span></label>'; }).join('') || '<p>Geen ingrediënten opgegeven</p>';
    var stepHtml = (r.steps||[]).map(function(st,i){ var done=stepSet.has(i); return '<label class="recipe-step-check-row"><div class="recipe-step-circle '+(done?'done':'')+'">'+(done?'✓':'')+'</div><div class="recipe-step-num">'+(i+1)+'</div><div class="recipe-step-text '+(done?'done':'')+'">'+esc(st)+'</div><input type="checkbox" '+(done?'checked':'')+' data-step="'+i+'" style="display:none"></label>'; }).join('') || '<p>Geen bereidingsstappen opgegeven</p>';
    dc.innerHTML = '<div class="recipe-hero-wrap" style="width:100%;height:210px;overflow:hidden;position:relative"><img src="'+esc(fallback(r))+'" style="width:100%;height:100%;object-fit:cover"><button id="recipe-photo-btn" style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:20px;padding:6px 14px;font-size:12px;font-weight:800">📷 Wijzigen</button></div>'
      +'<div class="recipe-title-area"><h2>'+esc(r.name)+'</h2><div style="display:flex;gap:8px;flex-wrap:wrap"><span class="recipe-tag">📂 '+esc(r.cat||'Diner')+'</span><span class="recipe-tag">⏱ '+esc(r.time||20)+' min</span><span class="recipe-tag">👥 '+esc(r.persons||4)+' pers</span></div></div>'
      +'<div class="recipe-manage-direct"><button class="primary" id="recipe-edit-direct">✏️ Bewerken</button><button id="recipe-photo-direct">🖼️ Foto</button><button class="danger" id="recipe-delete-direct">🗑️ Verwijderen</button></div>'
      +'<div class="recipe-ings-wrap"><div class="recipe-section-header">Ingrediënten</div>'+ingHtml+'<button class="recipe-shop-btn" id="to-shop-btn">🛒 Zet alles op boodschappenlijst</button></div>'
      +'<div class="recipe-steps-wrap"><div class="recipe-section-header">Bereiding</div>'+stepHtml+'</div>'+(r.notes?'<div class="recipe-notes-wrap"><div class="recipe-notes-label">💡 Notities</div><div class="recipe-notes-body">'+esc(r.notes)+'</div></div>':'')+'<div style="height:40px"></div>';
    dc.querySelectorAll('[data-ing]').forEach(function(inp){ inp.onchange=function(){ var i=parseInt(inp.dataset.ing); if(ingSet.has(i)) ingSet.delete(i); else ingSet.add(i); openDetail(id); }; });
    dc.querySelectorAll('[data-step]').forEach(function(inp){ inp.onchange=function(){ var i=parseInt(inp.dataset.step); if(stepSet.has(i)) stepSet.delete(i); else stepSet.add(i); openDetail(id); }; });
    var edit=document.getElementById('recipe-edit-direct'); if(edit) edit.onclick=function(){ if(typeof window.openRecipeEditor==='function') window.openRecipeEditor(id); };
    var photo=document.getElementById('recipe-photo-direct'); var ph=document.getElementById('recipe-photo-btn'); [photo,ph].forEach(function(btn){ if(btn) btn.onclick=function(){ if(typeof window.openRecipePhotoSheet==='function') window.openRecipePhotoSheet(id); }; });
    var del=document.getElementById('recipe-delete-direct'); if(del) del.onclick=function(){ if(confirm('Recept "'+r.name+'" verwijderen?')){ setRecipes(recipes().filter(function(x){return Number(x.id)!==Number(id);})); if(typeof window.showRecipeListView==='function') window.showRecipeListView(); renderGrid(); } };
    var shop=document.getElementById('to-shop-btn'); if(shop && typeof window.addRecipeToShop==='function') shop.onclick=function(){ window.addRecipeToShop(id); };
  }

  function patch(){
    ensureStyles();
    forceSeed();
    window.renderRecipeGrid = renderGrid;
    window.openRecipeDetail = openDetail;
    try { renderRecipeGrid = renderGrid; openRecipeDetail = openDetail; } catch(e) {}
    installSearch();
    renderGrid();
  }

  window.RecipeDirectStablePatch = { version:VERSION, patch:patch, seed:forceSeed };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(patch, 100); setTimeout(patch, 700); });
  else { setTimeout(patch, 100); setTimeout(patch, 700); }
})();
