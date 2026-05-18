'use strict';
// ============================================================
// MEAL PLANNER BOTTOM SHEET BRIDGE v0.362
// Standalone meal planning flow on ModalManager/BottomSheet.
// Connects recipes -> meal planning -> optional grocery sync.
// ============================================================

(function(){
  var VERSION = '0.362';
  var STORAGE_KEY = 'familyapp_food_meal_plan_v001';
  var STYLE_ID = 'meal-planner-bottom-sheet-style';
  var loadingPromise = null;

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
      script.onerror = function(){ console.warn('[MealPlannerBottomSheetBridge] failed to load', src); resolve(); };
      document.body.appendChild(script);
    });
  }

  function ensureBottomSheet(){
    if(loadingPromise) return loadingPromise;
    loadingPromise = Promise.resolve()
      .then(function(){ return loadScriptOnce('modal-manager-js','src/core/modalManager.js',function(){ return !!window.ModalManager; }); })
      .then(function(){ return loadScriptOnce('bottom-sheet-js','src/core/bottomSheet.js',function(){ return !!window.BottomSheet; }); })
      .then(function(){ return loadScriptOnce('grocery-quick-add-modal-js','src/core/groceryQuickAddModal.js',function(){ return !!window.GroceryQuickAddModal; }); });
    return loadingPromise;
  }

  function ensureStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.meal-plan-native-btn{background:var(--c-primary)!important;color:#fff!important;border:0!important;border-radius:999px!important;padding:9px 16px!important;font-size:13px!important;font-weight:950!important;box-shadow:0 8px 18px rgba(63,127,47,.18)!important;cursor:pointer!important}',
      '.meal-plan-native-btn:active{transform:scale(.97)!important}',
      '.meal-plan-card{background:var(--c-surface,#fff);border:1px solid var(--c-border,#edf0ec);border-radius:20px;margin:10px 16px;padding:14px;box-shadow:0 6px 18px rgba(17,24,39,.045)}',
      '.meal-plan-card-top{display:flex;align-items:center;gap:12px}',
      '.meal-plan-emoji{width:44px;height:44px;border-radius:16px;background:var(--c-surface2,#f4f7f2);display:flex;align-items:center;justify-content:center;font-size:23px;flex:0 0 auto}',
      '.meal-plan-title{font-size:15px;font-weight:950;color:var(--c-text,#111827)}',
      '.meal-plan-meta{font-size:12px;color:var(--c-text2,#667085);margin-top:2px}',
      '.meal-plan-delete{border:0;background:var(--c-surface2,#f4f7f2);color:var(--c-text2,#667085);border-radius:12px;padding:8px 10px;font-weight:900}',
      '.meal-picker-recipe{width:100%;border:1.5px solid var(--c-border,#edf0ec);background:var(--c-surface,#fff);border-radius:16px;padding:11px 12px;margin-bottom:8px;text-align:left;display:flex;align-items:center;gap:10px;font-weight:850;color:var(--c-text,#111827)}',
      '.meal-picker-recipe.active{border-color:var(--c-primary,#3f7f2f);background:rgba(63,127,47,.08)}',
      '.meal-toggle-row{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--c-surface2,#f4f7f2);border-radius:16px;padding:12px;margin-top:10px}',
      '.meal-toggle-row input{width:auto!important}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function safeParse(raw, fallback){ try { return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; } }

  function ensureMealPlan(){
    if(!Array.isArray(window.mealPlanData)) window.mealPlanData = safeParse(localStorage.getItem(STORAGE_KEY), []);
    window.mealPlanNextId = Math.max.apply(null, window.mealPlanData.map(function(m){ return Number(m.id) || 0; }).concat([0])) + 1;
  }

  function persist(operation){
    ensureMealPlan();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(window.mealPlanData || [])); } catch(e) {}
    if(window.HouseholdRepository && typeof window.HouseholdRepository.write === 'function'){
      window.HouseholdRepository.write('mealPlan', window.mealPlanData || [], { source:'mealPlannerBottomSheetBridge', operation:operation || 'mealPlanMutation', version:VERSION });
    }
    try { window.dispatchEvent(new CustomEvent('familyapp:food:meal-plan-updated', { detail:{ meals:window.mealPlanData || [], version:VERSION } })); } catch(e) {}
  }

  function today(){ return new Date().toISOString().slice(0,10); }
  function esc(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function toast(msg){ if(typeof window.showToast === 'function') window.showToast(msg); }
  function xp(n,label){ if(typeof window.awardXP === 'function') window.awardXP(n,label); }
  function activity(icon,bg,text){ if(typeof window.addActivity === 'function') window.addActivity(icon,bg,text); }

  function recipes(){ return Array.isArray(window.recipesData) ? window.recipesData : []; }
  function emojiForRecipe(r){ return (r && (r.emoji || (window.CAT_EMOJIS && window.CAT_EMOJIS[r.cat]))) || '🍽️'; }

  function screen(){
    return document.getElementById('screen-meals') || document.getElementById('screen-food') || document.getElementById('screen-mealplanner') || document.querySelector('[data-screen="meals"]');
  }

  function contentNode(){
    var s = screen();
    if(!s) return null;
    return document.getElementById('meal-plan-list') || document.getElementById('meals-list') || document.getElementById('meal-grid') || s.querySelector('.meal-list,.meals-list,.meal-plan-list,.content-body') || s;
  }

  function addIngredientsToShop(recipe){
    if(!recipe || !Array.isArray(recipe.ingredients) || !recipe.ingredients.length) return;
    if(!Array.isArray(window.shopData)) window.shopData = [];
    var next = Math.max.apply(null, window.shopData.map(function(i){ return Number(i.id) || 0; }).concat([0])) + 1;
    var existing = {};
    window.shopData.forEach(function(item){ existing[String(item.name || '').trim().toLowerCase()] = true; });
    recipe.ingredients.forEach(function(ing){
      var name = String(ing || '').trim();
      if(!name) return;
      var key = name.toLowerCase();
      if(existing[key]) return;
      existing[key] = true;
      window.shopData.unshift({ id:next++, name:name, qty:'1x', cat:'Overig', who:window.myName || 'Gezin', done:false, photo:'🛒' });
    });
    try { localStorage.setItem('familyapp_food_shop_v001', JSON.stringify(window.shopData || [])); } catch(e) {}
    if(window.HouseholdRepository && typeof window.HouseholdRepository.write === 'function'){
      window.HouseholdRepository.write('groceries', window.shopData || [], { source:'mealPlannerBottomSheetBridge', operation:'addRecipeIngredientsToShop', version:VERSION });
    }
    if(typeof window.renderShop === 'function') window.renderShop();
  }

  function openMealPlanner(){
    ensureBottomSheet().then(function(){
      ensureStyles(); ensureMealPlan();
      if(!window.BottomSheet) return;
      var list = recipes();
      var recipeButtons = list.length ? list.slice(0,12).map(function(r, i){
        return '<button type="button" class="meal-picker-recipe '+(i===0?'active':'')+'" data-recipe-id="'+r.id+'"><span style="font-size:22px">'+emojiForRecipe(r)+'</span><span style="flex:1"><b>'+esc(r.name)+'</b><small style="display:block;color:var(--c-text2);font-weight:700;margin-top:2px">'+esc(r.cat || 'Recept')+' · '+esc(r.time || 20)+' min</small></span></button>';
      }).join('') : '<div style="font-size:13px;color:var(--c-text2);padding:10px 0">Nog geen recepten. Je kunt wel een losse maaltijd plannen.</div>';

      window.BottomSheet.open({
        title:'📅 Maaltijd plannen',
        html:''
          +'<div class="fam-modal-field"><label>Dag</label><input id="meal-bs-date" type="date" value="'+today()+'"></div>'
          +'<div class="fam-modal-field"><label>Recept kiezen</label><div id="meal-recipe-picker">'+recipeButtons+'</div></div>'
          +'<div class="fam-modal-field"><label>Of losse maaltijd</label><input id="meal-bs-title" placeholder="bijv. Tacos"></div>'
          +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="fam-modal-field"><label>Personen</label><input id="meal-bs-persons" type="number" min="1" value="4"></div><div class="fam-modal-field"><label>Icoon</label><input id="meal-bs-emoji" value="🍽️"></div></div>'
          +'<div class="fam-modal-field"><label>Notitie</label><textarea id="meal-bs-notes" rows="3" placeholder="Optioneel"></textarea></div>'
          +'<label class="meal-toggle-row"><span><b>Ingrediënten naar boodschappen</b><small style="display:block;color:var(--c-text2);margin-top:2px">Voeg ontbrekende ingrediënten toe aan de boodschappenlijst.</small></span><input id="meal-bs-grocery" type="checkbox" checked></label>',
        onOpen:function(ctx){
          var modal = ctx.modal;
          modal.querySelectorAll('[data-recipe-id]').forEach(function(btn){
            btn.onclick = function(){
              modal.querySelectorAll('[data-recipe-id]').forEach(function(b){ b.classList.remove('active'); });
              btn.classList.add('active');
              var r = list.find(function(x){ return Number(x.id) === Number(btn.getAttribute('data-recipe-id')); });
              if(r){
                var title = modal.querySelector('#meal-bs-title');
                var persons = modal.querySelector('#meal-bs-persons');
                var emoji = modal.querySelector('#meal-bs-emoji');
                if(title) title.value = r.name || '';
                if(persons) persons.value = r.persons || 4;
                if(emoji) emoji.value = emojiForRecipe(r);
              }
            };
          });
          var first = modal.querySelector('[data-recipe-id]');
          if(first) first.click();
        },
        actions:[
          { label:'Annuleren' },
          { label:'Plannen', primary:true, onClick:function(ctx){
            var modal = ctx.modal;
            var active = modal.querySelector('[data-recipe-id].active');
            var recipe = active ? list.find(function(x){ return Number(x.id) === Number(active.getAttribute('data-recipe-id')); }) : null;
            var title = ((modal.querySelector('#meal-bs-title') || {}).value || '').trim() || (recipe ? recipe.name : 'Maaltijd');
            var date = (modal.querySelector('#meal-bs-date') || {}).value || today();
            var persons = parseInt((modal.querySelector('#meal-bs-persons') || {}).value, 10) || 4;
            var emoji = ((modal.querySelector('#meal-bs-emoji') || {}).value || '').trim() || (recipe ? emojiForRecipe(recipe) : '🍽️');
            var notes = (modal.querySelector('#meal-bs-notes') || {}).value || '';
            var groceries = !!(modal.querySelector('#meal-bs-grocery') || {}).checked;
            window.mealPlanData.unshift({ id:window.mealPlanNextId++, date:date, title:title, recipeId:recipe ? recipe.id : null, persons:persons, emoji:emoji, notes:notes, who:window.myName || 'Gezin' });
            persist('createMealPlan');
            if(groceries && recipe) addIngredientsToShop(recipe);
            if(typeof window.renderMeals === 'function') window.renderMeals();
            else renderFallback();
            activity('🍽️','#fff3dc',(window.myName || 'Gezin')+' plande "'+title+'"');
            xp(2,'Maaltijd gepland');
            toast('Maaltijd gepland ✓');
            return true;
          }}
        ]
      });
    });
    return false;
  }

  function renderFallback(){
    ensureMealPlan(); ensureStyles();
    var node = contentNode();
    if(!node) return;
    var existing = document.getElementById('meal-plan-native-list');
    if(existing && existing.parentNode) existing.parentNode.removeChild(existing);
    var wrap = document.createElement('div');
    wrap.id = 'meal-plan-native-list';
    if(!window.mealPlanData.length){
      wrap.innerHTML = '<div style="padding:24px 16px;text-align:center;color:var(--c-text2)">Nog geen maaltijden gepland.</div>';
    } else {
      wrap.innerHTML = window.mealPlanData.slice(0,20).map(function(m){
        return '<div class="meal-plan-card" data-meal-id="'+m.id+'"><div class="meal-plan-card-top"><div class="meal-plan-emoji">'+esc(m.emoji || '🍽️')+'</div><div style="flex:1;min-width:0"><div class="meal-plan-title">'+esc(m.title)+'</div><div class="meal-plan-meta">'+esc(m.date)+' · '+esc(m.persons || 4)+' personen</div></div><button class="meal-plan-delete" data-del-meal="'+m.id+'">✕</button></div>'+(m.notes?'<div style="font-size:12px;color:var(--c-text2);margin-top:10px">'+esc(m.notes)+'</div>':'')+'</div>';
      }).join('');
    }
    node.appendChild(wrap);
    wrap.querySelectorAll('[data-del-meal]').forEach(function(btn){
      btn.onclick = function(){
        var id = Number(btn.getAttribute('data-del-meal'));
        window.mealPlanData = window.mealPlanData.filter(function(m){ return Number(m.id) !== id; });
        persist('deleteMealPlan');
        renderFallback();
      };
    });
  }

  function installButton(){
    ensureStyles();
    var s = screen();
    if(!s) return;
    var header = s.querySelector('.list-header') || s.querySelector('.section-header') || s.querySelector('.module-header') || s;
    if(!header) return;
    var old = header.querySelector('.add-btn,[onclick*="meal"],[onclick*="Meal"],[onclick*="maaltijd"]');
    if(old && !old.classList.contains('meal-plan-native-btn')){ old.style.display = 'none'; old.onclick = null; old.removeAttribute('onclick'); }
    var btn = document.getElementById('meal-plan-native-btn');
    if(!btn){
      btn = document.createElement('button');
      btn.id = 'meal-plan-native-btn';
      btn.className = 'meal-plan-native-btn';
      btn.type = 'button';
      btn.textContent = '+ Maaltijd';
      header.appendChild(btn);
    }
    btn.onclick = function(e){ if(e) e.preventDefault(); return openMealPlanner(); };
  }

  function boot(){
    ensureMealPlan();
    ensureBottomSheet();
    installButton();
    renderFallback();
    [100,300,800,1500,2500,4000].forEach(function(delay){ setTimeout(function(){ installButton(); renderFallback(); }, delay); });
  }

  window.MealPlannerBottomSheetBridge = { version:VERSION, boot:boot, openMealPlanner:openMealPlanner, installButton:installButton, renderFallback:renderFallback };
  window.openMealPlanner = openMealPlanner;
  window.openMealPlanSheet = openMealPlanner;

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
