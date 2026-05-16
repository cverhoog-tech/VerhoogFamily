'use strict';
// ============================================================
// FOOD MODULES REPAIR v0.337
// Repairs preview breakage for groceries, recipes and meals caused by
// mismatched DOM ids and missing persistence boundaries.
// ============================================================

(function(){
  var VERSION = '0.337';
  var STORAGE = {
    shop: 'familyapp_food_shop_v001',
    recipes: 'familyapp_food_recipes_v001',
    meals: 'familyapp_food_meals_v001'
  };

  function safeParse(raw, fallback){
    try { return raw ? JSON.parse(raw) : fallback; } catch(error) { return fallback; }
  }

  function read(key, fallback){ return safeParse(localStorage.getItem(key), fallback); }
  function write(key, value){ localStorage.setItem(key, JSON.stringify(value)); return value; }

  function ensureFoodState(){
    if(!Array.isArray(window.shopData)) window.shopData = read(STORAGE.shop, []);
    else {
      var storedShop = read(STORAGE.shop, null);
      if(Array.isArray(storedShop) && storedShop.length && !window.shopData.length) window.shopData = storedShop;
    }

    if(!Array.isArray(window.recipesData)) window.recipesData = read(STORAGE.recipes, []);
    else {
      var storedRecipes = read(STORAGE.recipes, null);
      if(Array.isArray(storedRecipes) && storedRecipes.length) window.recipesData = storedRecipes;
    }

    if(!window.mealPlan || typeof window.mealPlan !== 'object') window.mealPlan = read(STORAGE.meals, {});
    else {
      var storedMeals = read(STORAGE.meals, null);
      if(storedMeals && typeof storedMeals === 'object' && Object.keys(storedMeals).length) window.mealPlan = storedMeals;
    }

    if(!window.recipesData.length) {
      window.recipesData = [
        {id:1,name:'Pasta pesto',cat:'Diner',persons:4,time:20,photo:null,ingredients:['400g pasta','1 pot pesto','250g cherrytomaten','100g geraspte kaas'],steps:['Kook de pasta.','Meng pesto door de pasta.','Voeg tomaten en kaas toe.'],notes:''},
        {id:2,name:'Wraps met kip',cat:'Diner',persons:4,time:25,photo:null,ingredients:['6 wraps','300g kip','1 paprika','1 zak sla','Knoflooksaus'],steps:['Bak de kip.','Snijd de groente.','Vul de wraps.'],notes:''},
        {id:3,name:'Yoghurt bowl',cat:'Ontbijt',persons:2,time:5,photo:null,ingredients:['500ml yoghurt','1 banaan','Granola','Honing'],steps:['Doe yoghurt in kommen.','Voeg toppings toe.'],notes:''}
      ];
    }

    window.recipeNextId = Math.max.apply(null, window.recipesData.map(function(r){ return Number(r.id) || 0; }).concat([0])) + 1;
    window.shopNextId = Math.max.apply(null, window.shopData.map(function(i){ return Number(i.id) || 0; }).concat([0])) + 1;
  }

  function persistFood(collection){
    if(collection === 'shop' || !collection) write(STORAGE.shop, window.shopData || []);
    if(collection === 'recipes' || !collection) write(STORAGE.recipes, window.recipesData || []);
    if(collection === 'meals' || !collection) write(STORAGE.meals, window.mealPlan || {});
    if(window.HouseholdRepository && typeof window.HouseholdRepository.write === 'function'){
      if(collection === 'shop' || !collection) window.HouseholdRepository.write('groceries', window.shopData || [], { source:'foodModulesRepair', operation:'persistShop' });
      if(collection === 'recipes' || !collection) window.HouseholdRepository.write('recipes', window.recipesData || [], { source:'foodModulesRepair', operation:'persistRecipes' });
      if(collection === 'meals' || !collection) window.HouseholdRepository.write('meals', window.mealPlan || {}, { source:'foodModulesRepair', operation:'persistMeals' });
    }
  }

  function emojiFor(cat){
    var map = window.CAT_EMOJIS || {Ontbijt:'🥞',Lunch:'🥗',Diner:'🍽️',Snack:'🍿',Dessert:'🍰',Bakken:'🧁'};
    return map[cat] || '🍴';
  }

  function renderRecipesSafe(){
    ensureFoodState();
    var list = document.getElementById('recipes-list') || document.getElementById('recipe-grid');
    var listView = document.getElementById('recipes-list-view') || document.getElementById('recipe-list-view');
    var detail = document.getElementById('recipe-detail-view');
    if(listView) listView.style.display = 'block';
    if(detail) detail.style.display = 'none';
    if(!list) return;

    list.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:8px 16px 120px;box-sizing:border-box';
    list.innerHTML = (window.recipesData || []).map(function(r){
      var img = r.photo
        ? '<img src="'+r.photo+'" style="width:100%;height:100%;object-fit:cover">'
        : '<span style="font-size:42px">'+emojiFor(r.cat)+'</span>';
      return '<button type="button" data-food-recipe="'+r.id+'" style="text-align:left;border:1px solid var(--c-border);background:var(--c-surface);border-radius:18px;overflow:hidden;padding:0;box-shadow:0 6px 18px rgba(17,24,39,.06);cursor:pointer">'
        +'<div style="height:104px;display:flex;align-items:center;justify-content:center;background:var(--c-surface2);overflow:hidden">'+img+'</div>'
        +'<div style="padding:10px">'
        +'<div style="font-size:14px;font-weight:900;color:var(--c-text);margin-bottom:5px">'+r.name+'</div>'
        +'<div style="font-size:11px;color:var(--c-text2);font-weight:700;display:flex;gap:6px;flex-wrap:wrap"><span>'+r.cat+'</span><span>⏱ '+r.time+'m</span><span>👥 '+r.persons+'p</span></div>'
        +'</div></button>';
    }).join('');
    list.querySelectorAll('[data-food-recipe]').forEach(function(btn){
      btn.onclick = function(){ openRecipeDetailSafe(parseInt(btn.getAttribute('data-food-recipe'), 10)); };
    });
  }

  function openRecipeDetailSafe(id){
    ensureFoodState();
    var r = (window.recipesData || []).find(function(item){ return Number(item.id) === Number(id); });
    var listView = document.getElementById('recipes-list-view') || document.getElementById('recipe-list-view');
    var detail = document.getElementById('recipe-detail-view');
    if(!r || !detail) return;
    if(listView) listView.style.display = 'none';
    detail.style.display = 'block';
    detail.innerHTML = '<div style="padding:14px 16px 120px">'
      +'<button onclick="renderRecipes()" style="border:0;background:var(--c-surface2);border-radius:999px;padding:8px 13px;font-size:13px;font-weight:800;color:var(--c-text);margin-bottom:12px">← Terug</button>'
      +'<div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:22px;overflow:hidden;box-shadow:0 8px 22px rgba(17,24,39,.07)">'
      +'<div style="height:150px;display:flex;align-items:center;justify-content:center;background:var(--c-surface2);font-size:64px">'+emojiFor(r.cat)+'</div>'
      +'<div style="padding:16px"><h2 style="margin:0 0 8px;font-size:22px">'+r.name+'</h2>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px"><span class="recipe-tag">📂 '+r.cat+'</span><span class="recipe-tag">⏱ '+r.time+' min</span><span class="recipe-tag">👥 '+r.persons+' pers</span></div>'
      +'<h3 style="font-size:15px;margin:12px 0 8px">Ingrediënten</h3>'
      +(r.ingredients || []).map(function(ing){ return '<div style="padding:8px 0;border-bottom:1px solid var(--c-border);font-size:14px">'+ing+'</div>'; }).join('')
      +'<button onclick="addRecipeToShop('+r.id+')" style="width:100%;margin-top:14px;background:var(--c-primary);color:#fff;border:0;border-radius:14px;padding:12px;font-weight:900">🛒 Zet op boodschappenlijst</button>'
      +'<h3 style="font-size:15px;margin:16px 0 8px">Bereiding</h3>'
      +(r.steps || []).map(function(step, i){ return '<div style="display:flex;gap:10px;margin-bottom:10px"><b>'+(i+1)+'.</b><span>'+step+'</span></div>'; }).join('')
      +'</div></div></div>';
  }

  function renderMealsSafe(){
    ensureFoodState();
    var el = document.getElementById('meals-grid') || document.getElementById('meals-content');
    if(!el) return;
    var days = [], start = new Date();
    start.setDate(start.getDate() - ((start.getDay()+6)%7));
    for(var i=0;i<7;i++){ var d = new Date(start); d.setDate(start.getDate()+i); days.push(d); }
    var names = ['Ma','Di','Wo','Do','Vr','Za','Zo'];
    el.style.cssText = 'padding:8px 16px 120px;box-sizing:border-box';
    el.innerHTML = '<div style="font-size:18px;font-weight:950;margin:6px 0 4px;color:var(--c-text)">Weekmenu</div>'
      +'<div style="font-size:12px;color:var(--c-text2);margin-bottom:12px">Plan lunch en diner per dag.</div>'
      +days.map(function(d, i){
        var ds = d.toISOString().slice(0,10);
        var plan = window.mealPlan[ds] || {};
        var lunch = plan.lunch ? window.recipesData.find(function(r){ return Number(r.id) === Number(plan.lunch); }) : null;
        var dinner = plan.dinner ? window.recipesData.find(function(r){ return Number(r.id) === Number(plan.dinner); }) : null;
        return '<div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:18px;padding:12px;margin-bottom:10px;box-shadow:0 5px 14px rgba(17,24,39,.045)">'
          +'<div style="font-weight:950;margin-bottom:8px;color:var(--c-text)">'+names[i]+' '+d.getDate()+'/'+(d.getMonth()+1)+'</div>'
          +mealSlotHtml(ds, 'lunch', '🥗 Lunch', lunch)
          +mealSlotHtml(ds, 'dinner', '🍽️ Diner', dinner)
          +'</div>';
      }).join('')
      +'<button onclick="addMealPlanToShop()" style="width:100%;background:var(--c-primary);color:#fff;border:none;border-radius:14px;padding:13px;font-size:14px;font-weight:900;cursor:pointer">🛒 Ingrediënten naar boodschappen</button>';
  }

  function mealSlotHtml(date, slot, label, recipe){
    return '<button type="button" data-meal-date="'+date+'" data-meal-slot="'+slot+'" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;border:0;background:var(--c-surface2);border-radius:13px;padding:10px;margin-top:7px;text-align:left;cursor:pointer" onclick="openMealPicker(\''+date+'\',\''+slot+'\')">'
      +'<span style="font-size:13px;font-weight:800;color:var(--c-text2)">'+label+'</span>'
      +'<span style="font-size:13px;font-weight:900;color:var(--c-text)">'+(recipe ? recipe.name : 'Kiezen...')+'</span>'
      +'</button>';
  }

  function openMealPickerSafe(date, slot){
    ensureFoodState();
    var title = document.getElementById('sheet-title');
    var fields = document.getElementById('sheet-fields');
    var overlay = document.getElementById('add-overlay');
    if(!title || !fields || !overlay) return;
    title.textContent = (slot === 'lunch' ? '🥗 Lunch' : '🍽️ Diner') + ' kiezen';
    fields.innerHTML = '<div style="display:flex;flex-direction:column;gap:8px;max-height:55vh;overflow-y:auto">'
      +(window.recipesData || []).map(function(r){
        return '<button type="button" data-pick-recipe="'+r.id+'" style="background:var(--c-surface2);border:0;border-radius:13px;padding:11px;text-align:left;font-weight:800;color:var(--c-text);cursor:pointer">'+emojiFor(r.cat)+' '+r.name+' <span style="font-size:11px;color:var(--c-text2)">· '+r.time+'m</span></button>';
      }).join('')+'</div>';
    overlay.classList.add('open');
    setTimeout(function(){
      fields.querySelectorAll('[data-pick-recipe]').forEach(function(btn){
        btn.onclick = function(){
          if(!window.mealPlan[date]) window.mealPlan[date] = {};
          window.mealPlan[date][slot] = parseInt(btn.getAttribute('data-pick-recipe'), 10);
          persistFood('meals');
          if(typeof window.closeAdd === 'function') window.closeAdd();
          renderMealsSafe();
          if(typeof window.showToast === 'function') window.showToast('Recept gepland 🍽️');
        };
      });
    }, 0);
  }

  function addRecipeToShopSafe(recipeId){
    ensureFoodState();
    var r = (window.recipesData || []).find(function(item){ return Number(item.id) === Number(recipeId); });
    if(!r) return;
    var added = 0;
    (r.ingredients || []).forEach(function(ing){
      var exists = (window.shopData || []).some(function(s){ return String(s.name || '').toLowerCase() === String(ing).toLowerCase() && !s.done; });
      if(!exists){ window.shopData.unshift({id:window.shopNextId++, name:ing, qty:'1x', cat:'Overig', who:window.myName || 'Gezin', done:false, photo:null}); added++; }
    });
    persistFood('shop');
    if(typeof window.renderShop === 'function') window.renderShop();
    if(typeof window.showToast === 'function') window.showToast(added+' ingrediënten toegevoegd ✓');
  }

  function wrapShopMutations(){
    ['toggleShop','deleteShop','resetShop'].forEach(function(name){
      var fn = window[name];
      if(typeof fn !== 'function' || fn.__foodRepairWrapped) return;
      window[name] = function(){
        var result = fn.apply(this, arguments);
        persistFood('shop');
        return result;
      };
      window[name].__foodRepairWrapped = true;
    });
  }

  function boot(){
    ensureFoodState();
    window.renderRecipes = renderRecipesSafe;
    window.renderRecipeGrid = renderRecipesSafe;
    window.openRecipeDetail = openRecipeDetailSafe;
    window.renderMeals = renderMealsSafe;
    window.openMealPicker = openMealPickerSafe;
    window.addRecipeToShop = addRecipeToShopSafe;
    wrapShopMutations();
    persistFood();
    try { window.dispatchEvent(new CustomEvent('familyapp:food-repair-ready', { detail:{ version:VERSION } })); } catch(error) {}
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
