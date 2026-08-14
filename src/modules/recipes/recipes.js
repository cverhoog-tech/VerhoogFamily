'use strict';
// ============================================================
// RECIPES UI v2.0
// RecipeStore is the source of truth. No direct household/local writes.
// ============================================================
(function(){
  var CAT_ICONS={Ontbijt:'🥞',Lunch:'🥗',Diner:'🍽️',Snack:'🍿',Dessert:'🍰',Bakken:'🧁'};
  var R=[],checkedI={},checkedS={},currentFilter='all',currentSearch='',subscribed=false;

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function ingredientText(ing){if(ing&&typeof ing==='object')return String(ing.rawText||ing.text||ing.name||'').trim();return String(ing||'').trim();}
  function ingredientLines(list){return (list||[]).map(ingredientText).filter(Boolean);}
  function store(){return window.RecipeStore||null;}
  function syncFromStore(){var s=store();if(s&&typeof s.list==='function')R=s.list();else if(Array.isArray(window.recipesData))R=window.recipesData.slice();window.recipesData=R;return R;}
  function getRecipe(id){var s=store();return s&&typeof s.get==='function'?s.get(id):R.find(function(x){return String(x.id)===String(id);});}
  // Single source of truth for recipe visuals — see recipeHero.js. Also
  // used by recipeEditorPopup.js's live hero preview, so grid card,
  // detail hero and editor hero always agree on the same rules.
  function resolveHero(r){return window.RecipeHero?window.RecipeHero.resolve(r):{hasPhoto:!!(r&&r.photo),photoUrl:r&&r.photo,background:'linear-gradient(150deg,#3b4258,#161922 66%,#0d0f14)',emoji:(r&&r.emoji)||CAT_ICONS[r&&r.cat]||'🍴'};}

  function addCSS(){
    if(document.getElementById('rcss2'))return;var s=document.createElement('style');s.id='rcss2';s.textContent=[
      '#rg{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 14px 100px}',
      '#rs-wrap{padding:8px 14px 4px}',
      '#rs-inp{width:100%;height:44px;border-radius:16px;border:1.5px solid var(--c-border,#e5e7eb);background:var(--c-surface,#fff);padding:0 14px;font-size:14px;font-weight:600;outline:none;box-sizing:border-box}',
      '.rc{border-radius:20px;overflow:hidden;cursor:pointer;position:relative;min-height:190px;background:#17181c}',
      '.rc-img{position:absolute;inset:0;overflow:hidden}.rc-img img{width:100%;height:100%;object-fit:cover;display:block}',
      '.rc-ov{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(8,12,20,.04) 20%,rgba(8,10,16,.82) 100%)}',
      '.rc-emoji{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:54px;background:radial-gradient(circle at 30% 20%,#3b4258,#161922 66%,#0d0f14)}',
      '.rc-top{position:absolute;top:8px;left:8px;right:8px;display:flex;justify-content:space-between;gap:4px}.rc-tag{background:rgba(15,17,24,.46);backdrop-filter:blur(8px);color:#fff;font-size:10px;font-weight:800;padding:4px 8px;border:1px solid rgba(255,255,255,.16);border-radius:99px}',
      '.rc-bot{position:absolute;bottom:10px;left:10px;right:10px;color:#fff}.rc-name{font-size:15px;font-weight:900;line-height:1.15;text-shadow:0 1px 7px rgba(0,0,0,.7)}.rc-sub{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap}.rc-sub span{background:rgba(255,255,255,.14);backdrop-filter:blur(5px);font-size:10px;font-weight:700;padding:3px 7px;border-radius:99px}',
      '#rd-hero{width:100%;height:220px;position:relative;overflow:hidden;background:#151821;display:flex;align-items:center;justify-content:center;font-size:64px}#rd-hero img{width:100%;height:100%;object-fit:cover;display:block}',
      '.rd-hero-shade{position:absolute;inset:0;background:linear-gradient(to top,rgba(7,9,15,.45),transparent 60%);pointer-events:none}',
      '.rd-photobtn{position:absolute;bottom:10px;right:10px;background:rgba(10,12,18,.72);backdrop-filter:blur(8px);color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:99px;padding:7px 12px;font-size:12px;font-weight:800;cursor:pointer}',
      '.rd-info{padding:16px 16px 8px}.rd-info h2{margin:0 0 8px;font-size:22px;font-weight:900}.rd-tags{display:flex;gap:6px;flex-wrap:wrap}',
      '.rd-actions{padding:0 16px 8px;display:flex;gap:8px;flex-wrap:wrap}.rd-btn{border:0;border-radius:99px;padding:8px 14px;font-size:12px;font-weight:800;cursor:pointer;background:var(--c-surface2,#f0f0ee);color:var(--c-text,#111)}.rd-btn.pri{background:var(--c-primary,#3f7f2f);color:#fff}.rd-btn.red{background:#fff0f0;color:#b00}',
      '.rd-sec{background:var(--c-surface,#fff);border-radius:18px;margin:8px 14px;padding:14px;border:1px solid var(--c-border,#e5e7eb)}.rd-sec-h{font-size:11px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:var(--c-text2,#888);margin-bottom:10px}',
      '.rd-ing{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid rgba(0,0,0,.05);cursor:pointer;user-select:none}.rd-ing:last-child{border-bottom:0}.rd-dot{width:22px;height:22px;min-width:22px;border-radius:50%;border:2px solid var(--c-border,#ccc);display:flex;align-items:center;justify-content:center;transition:.12s;flex-shrink:0;margin-top:1px}.rd-dot.on{background:var(--c-primary,#3f7f2f);border-color:var(--c-primary,#3f7f2f)}.rd-ing-txt{font-size:14px;line-height:1.4;flex:1}.rd-ing-txt.on{color:var(--c-text3,#aaa);text-decoration:line-through}',
      '.rd-step{display:flex;align-items:flex-start;gap:10px;padding:9px 11px;border-radius:12px;border:1px solid var(--c-border,#e5e7eb);margin-bottom:6px;cursor:pointer;user-select:none}.rd-stepn{width:24px;height:24px;min-width:24px;border-radius:8px;background:var(--c-surface2,#f0f0ee);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:var(--c-text2,#888)}.rd-step-txt{font-size:14px;line-height:1.4;flex:1}.rd-step-txt.on{color:var(--c-text3,#aaa);text-decoration:line-through}',
      '.rd-primary-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.rd-actionbtn{min-height:48px;border:0;border-radius:14px;color:#fff;font-size:13px;font-weight:900;cursor:pointer;padding:10px}.rd-actionbtn.shop{background:linear-gradient(135deg,#238a52,#126c3c);box-shadow:0 8px 18px rgba(25,120,72,.2)}.rd-actionbtn.meal{background:linear-gradient(135deg,#6f4ee8,#4c2cb7);box-shadow:0 8px 18px rgba(87,57,190,.22)}',
      '.rd-notes{margin:8px 14px;padding:12px;background:var(--c-surface2,#f5f5f3);border-radius:14px;font-size:13px;line-height:1.5}',
      '#r-addbtn{background:var(--c-primary,#3f7f2f);color:#fff;border:0;border-radius:99px;padding:8px 16px;font-size:13px;font-weight:800;cursor:pointer}.r-empty{grid-column:1/-1;text-align:center;padding:40px;color:var(--c-text2,#888);font-size:14px}',
      '.r-listpick{display:flex;flex-direction:column;gap:8px}.r-listpick button{width:100%;text-align:left;border:1px solid var(--c-border,#e4e7ec);background:var(--c-surface,#fff);border-radius:14px;padding:12px;font-weight:800;color:var(--c-text,#111);cursor:pointer}.r-listpick small{display:block;margin-top:3px;color:var(--c-text2,#777);font-weight:600}'
    ].join('');document.head.appendChild(s);
  }

  function renderList(){
    syncFromStore();addCSS();var screen=document.getElementById('screen-recipes');if(!screen)return;
    screen.innerHTML='<div id="recipe-list-view"><div class="list-header"><h2>Recepten</h2><button id="r-addbtn">+ Recept</button></div><div id="rs-wrap"><input id="rs-inp" placeholder="Zoek recept, keuken..." autocomplete="off"></div><div class="chips" style="padding:4px 14px 10px"><button class="chip" id="rf-all">Alle</button><button class="chip" id="rf-diner">Diner</button><button class="chip" id="rf-ontbijt">Ontbijt</button><button class="chip" id="rf-lunch">Lunch</button><button class="chip" id="rf-snack">Snack</button><button class="chip" id="rf-dessert">Dessert</button><button class="chip" id="rf-bakken">Bakken</button></div><div id="rg"></div></div><div id="recipe-detail-view" style="display:none"></div>';
    [['all','rf-all'],['Diner','rf-diner'],['Ontbijt','rf-ontbijt'],['Lunch','rf-lunch'],['Snack','rf-snack'],['Dessert','rf-dessert'],['Bakken','rf-bakken']].forEach(function(x){var b=document.getElementById(x[1]);if(b){if(currentFilter===x[0])b.classList.add('active');b.onclick=function(){currentFilter=x[0];renderList();};}});
    document.getElementById('r-addbtn').onclick=function(){openEditor(null);};var q=document.getElementById('rs-inp');q.value=currentSearch;q.oninput=function(){currentSearch=this.value;renderGrid();};renderGrid();
  }

  function renderGrid(){
    syncFromStore();var grid=document.getElementById('rg');if(!grid)return;var q=currentSearch.toLowerCase().trim();
    var rows=R.filter(function(r){if(currentFilter!=='all'&&r.cat!==currentFilter)return false;var text=[r.name,r.cuisine,r.cat].concat(ingredientLines(r.ingredients)).join(' ').toLowerCase();return !q||text.indexOf(q)>-1;});
    if(!rows.length){grid.innerHTML='<div class="r-empty">Geen recepten gevonden</div>';return;}
    grid.innerHTML=rows.map(function(r){var hero=resolveHero(r),id=esc(r.id),media=hero.hasPhoto?('<img src="'+esc(hero.photoUrl)+'" alt="" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="rc-emoji" style="display:none;background-image:'+hero.background+'">'+hero.emoji+'</div>'):('<div class="rc-emoji" style="background-image:'+hero.background+'">'+hero.emoji+'</div>');return '<div class="rc" id="rc-'+id+'"><div class="rc-img">'+media+'</div><div class="rc-ov"></div><div class="rc-top"><span class="rc-tag">'+esc(r.cuisine||r.cat)+'</span><span class="rc-tag">⏱ '+esc(r.time||20)+'m</span></div><div class="rc-bot"><div class="rc-name">'+esc(r.name)+'</div><div class="rc-sub"><span>'+hero.emoji+' '+esc(r.cat)+'</span><span>👥 '+esc(r.persons||4)+'p</span></div></div></div>';}).join('');
    rows.forEach(function(r){var el=document.getElementById('rc-'+String(r.id));if(el)el.onclick=function(){renderDetail(r.id);};});
  }

  function renderDetail(id){
    syncFromStore();var r=getRecipe(id);if(!r)return;if(!checkedI[id])checkedI[id]=new Set();if(!checkedS[id])checkedS[id]=new Set();var ci=checkedI[id],cs=checkedS[id],hero=resolveHero(r),e=hero.emoji;
    var SVG='<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    var ings=ingredientLines(r.ingredients).map(function(ing,i){var on=ci.has(i);return '<div class="rd-ing" id="ri-'+i+'"><div class="rd-dot'+(on?' on':'')+'">'+(on?SVG:'')+'</div><div class="rd-ing-txt'+(on?' on':'')+'">'+esc(ing)+'</div></div>';}).join('')||'<p style="color:var(--c-text2);font-size:13px">Geen ingrediënten</p>';
    var steps=(r.steps||[]).map(function(step,i){var on=cs.has(i);return '<div class="rd-step" id="rs-'+i+'"><div class="rd-dot'+(on?' on':'')+'">'+(on?SVG:'')+'</div><div class="rd-stepn">'+(i+1)+'</div><div class="rd-step-txt'+(on?' on':'')+'">'+esc(step)+'</div></div>';}).join('')||'<p style="color:var(--c-text2);font-size:13px">Geen stappen</p>';
    var dv=document.getElementById('recipe-detail-view');if(!dv)return;
    dv.innerHTML='<div class="list-header" style="padding:10px 14px 6px"><button id="rd-back" class="add-btn" style="background:var(--c-surface2);color:var(--c-text);box-shadow:none">← Terug</button></div><div id="rd-hero"'+(hero.hasPhoto?'':' style="background-image:'+hero.background+'"')+'>'+(hero.hasPhoto?'<img src="'+esc(hero.photoUrl)+'" onerror="this.style.display=\'none\'">':'<span style="filter:drop-shadow(0 2px 8px rgba(0,0,0,.35))">'+e+'</span>')+'<div class="rd-hero-shade"></div><button class="rd-photobtn" id="rd-photobtn">📷 Foto</button></div><div class="rd-info"><h2>'+esc(r.name)+'</h2><div class="rd-tags"><span class="recipe-tag">'+esc(r.cat)+'</span><span class="recipe-tag">⏱ '+esc(r.time||20)+' min</span><span class="recipe-tag">👥 '+esc(r.persons||4)+' pers</span>'+(r.cuisine?'<span class="recipe-tag">🌍 '+esc(r.cuisine)+'</span>':'')+'</div></div><div class="rd-actions"><button class="rd-btn pri" id="rd-edit">✏️ Bewerken</button><button class="rd-btn red" id="rd-del">🗑️ Verwijderen</button></div><div class="rd-sec"><div class="rd-sec-h">Ingrediënten</div>'+ings+'<div class="rd-primary-actions"><button class="rd-actionbtn shop" id="rd-shop">🛒 Naar boodschappenlijst</button><button class="rd-actionbtn meal" id="rd-meal">📅 Maaltijd plannen</button></div></div><div class="rd-sec"><div class="rd-sec-h">Bereiding</div>'+steps+'</div>'+(r.notes?'<div class="rd-notes">💡 '+esc(r.notes)+'</div>':'')+'<div style="height:50px"></div>';
    document.getElementById('rd-back').onclick=goBack;document.getElementById('rd-photobtn').onclick=function(){openPhotoSheet(r);};document.getElementById('rd-edit').onclick=function(){openEditor(r.id);};document.getElementById('rd-del').onclick=function(){deleteRecipe(r.id);};document.getElementById('rd-shop').onclick=function(){openShoppingPicker(r);};document.getElementById('rd-meal').onclick=function(){planMeal(r);};
    ingredientLines(r.ingredients).forEach(function(_,i){var row=document.getElementById('ri-'+i);if(row)row.onclick=function(){ci.has(i)?ci.delete(i):ci.add(i);var on=ci.has(i);row.querySelector('.rd-dot').className='rd-dot'+(on?' on':'');row.querySelector('.rd-dot').innerHTML=on?SVG:'';row.querySelector('.rd-ing-txt').className='rd-ing-txt'+(on?' on':'');};});
    (r.steps||[]).forEach(function(_,i){var row=document.getElementById('rs-'+i);if(row)row.onclick=function(){cs.has(i)?cs.delete(i):cs.add(i);var on=cs.has(i);row.querySelector('.rd-dot').className='rd-dot'+(on?' on':'');row.querySelector('.rd-dot').innerHTML=on?SVG:'';row.querySelector('.rd-step-txt').className='rd-step-txt'+(on?' on':'');};});
    document.getElementById('recipe-list-view').style.display='none';dv.style.display='block';
  }

  function goBack(){var dv=document.getElementById('recipe-detail-view'),lv=document.getElementById('recipe-list-view');if(dv)dv.style.display='none';if(lv)lv.style.display='block';renderGrid();}

  function deleteRecipe(id){var r=getRecipe(id),s=store();if(!r||!s||!confirm('Verwijder "'+r.name+'"?'))return;s.remove(r.id).then(function(){if(typeof window.showToast==='function')window.showToast('Verwijderd');renderList();}).catch(function(){if(typeof window.showToast==='function')window.showToast('Verwijderen mislukt');});}

  function openShoppingPicker(r){
    var svc=window.ShoppingListService;if(!svc||!window.BottomSheet){if(typeof window.showToast==='function')window.showToast('Boodschappenlijsten zijn nog niet beschikbaar');return;}var rows=svc.list();
    if(!rows.length){if(typeof window.showToast==='function')window.showToast('Maak eerst een boodschappenlijst');if(window.ShoppingLists&&ShoppingLists.openCreate)ShoppingLists.openCreate();return;}
    var html='<div class="r-listpick">'+rows.map(function(row,i){var l=row.list||{};return '<button type="button" data-list="'+esc(row.key)+'">'+esc(l.icon||'🛒')+' '+esc(l.name||'Lijst')+'<small>'+(row.scope==='private'?'Privé':'Gezin')+'</small></button>';}).join('')+'</div>';
    window.BottomSheet.open({title:'🛒 Kies boodschappenlijst',html:html,onOpen:function(ctx){ctx.modal.querySelectorAll('[data-list]').forEach(function(btn){btn.onclick=function(){var key=btn.getAttribute('data-list');btn.disabled=true;svc.appendRecipeIngredients(key,r).then(function(result){ctx.close();if(typeof window.showToast==='function')window.showToast(result.added.length+' toegevoegd'+(result.skipped.length?' · '+result.skipped.length+' bestond al':'')+' ✓');}).catch(function(){btn.disabled=false;if(typeof window.showToast==='function')window.showToast('Toevoegen mislukt');});};});},actions:[{label:'Annuleren'}]});
  }

  function planMeal(r){var p=window.MealPlannerBottomSheetBridge;if(p&&typeof p.openForRecipe==='function'){p.openForRecipe(r.id);return;}if(p&&typeof p.openMealPlanner==='function'){p.openMealPlanner({recipeId:r.id});return;}if(typeof window.showToast==='function')window.showToast('Maaltijdplanner wordt geladen');}

  function openPhotoSheet(r){
    if(!window.BottomSheet)return;window.BottomSheet.open({title:'📷 Receptafbeelding',html:'<div class="fam-modal-field"><label>Eigen foto URL</label><input id="rp-url" value="'+esc(r.photo||'')+'" placeholder="Leeg = FamilyApp Hero"></div><div><button type="button" class="add-btn" id="rp-upbtn">📂 Upload eigen foto</button><input type="file" accept="image/*" id="rp-file" style="display:none"></div><div style="font-size:12px;color:var(--c-text2,#777);margin-top:10px">Laat het veld leeg om automatisch de FamilyApp '+esc(r.cat)+' Hero te gebruiken.</div>',onOpen:function(ctx){var ub=ctx.modal.querySelector('#rp-upbtn'),fi=ctx.modal.querySelector('#rp-file');if(ub&&fi){ub.onclick=function(){fi.click();};fi.onchange=function(ev){var f=ev.target.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(e){ctx.modal.querySelector('#rp-url').value=e.target.result;};rd.readAsDataURL(f);};}},actions:[{label:'Annuleren'},{label:'Opslaan',primary:true,onClick:function(ctx){var u=(ctx.modal.querySelector('#rp-url').value||'').trim(),s=store();if(!s)return false;s.upsert(Object.assign({},r,{photo:u||null,imageMode:u?'custom':'preset',heroPreset:String(r.cat||'Diner').toLowerCase()})).then(function(){if(typeof window.showToast==='function')window.showToast(u?'Eigen foto opgeslagen ✓':'FamilyApp Hero ingesteld ✓');setTimeout(function(){renderDetail(r.id);},80);});return true;}}]});
  }

  // Delegates to the premium hero-header popup (recipeEditorPopup.js).
  // That popup owns its own draft state and calls RecipeStore.create()/
  // .upsert() directly — recipes.js no longer builds the editor markup.
  function openEditor(id){
    if(window.RecipeEditorPopup&&typeof window.RecipeEditorPopup.open==='function'){window.RecipeEditorPopup.open(id);return;}
    if(typeof window.showToast==='function')window.showToast('Receptbewerker kon niet laden');
  }

  function ensureSubscription(){var s=store();if(!s)return false;if(!subscribed&&typeof s.subscribe==='function'){subscribed=true;s.subscribe(function(rows){R=rows.slice();window.recipesData=R;var screen=document.getElementById('screen-recipes');if(screen&&(screen.classList.contains('active')||screen.offsetParent!==null))renderList();});}return true;}
  function renderRecipes(){try{syncFromStore();ensureSubscription();renderList();var s=store();if(s&&typeof s.boot==='function')s.boot().then(function(){syncFromStore();renderList();});}catch(err){var screen=document.getElementById('screen-recipes');if(screen)screen.innerHTML='<div style="padding:20px;color:red;font-size:13px">FOUT: '+esc(err.message)+'</div>';console.error('[recipes] render error',err);}}

  window.renderRecipes=renderRecipes;window.openRecipeDetail=function(id){renderDetail(id);};window.closeRecipeDetail=goBack;window.renderRecipeGrid=renderGrid;window.recipesData=R;
  var tries=0,t=setInterval(function(){tries++;if(ensureSubscription()){clearInterval(t);syncFromStore();}else if(tries>160)clearInterval(t);},250);
})();
