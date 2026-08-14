'use strict';
// ============================================================
// MAALTIJDPLANNER v2.0
// UI projection of MealPlanStore/window.mealPlanData.
// No separate legacy mealPlan object.
// ============================================================
(function(){
  function rows(){return window.MealPlanStore&&MealPlanStore.list?MealPlanStore.list():(Array.isArray(window.mealPlanData)?window.mealPlanData:[]);}
  function recipeById(id){var list=window.RecipeStore&&RecipeStore.list?RecipeStore.list():(Array.isArray(window.recipesData)?window.recipesData:[]);return list.find(function(r){return String(r.id)===String(id);})||null;}
  function mealAt(date,type){return rows().find(function(m){return m&&m.date===date&&m.mealType===type;})||null;}
  function today(){return typeof window.todayStr==='function'?window.todayStr():new Date().toISOString().slice(0,10);}
  function openPlanner(date,type,recipeId){var p=window.MealPlannerBottomSheetBridge;if(p&&typeof p.openMealPlanner==='function'){p.openMealPlanner({date:date,mealType:type,recipeId:recipeId||null});return;}if(typeof window.showToast==='function')window.showToast('Maaltijdplanner wordt geladen');}

  function renderMeals(){
    var el=document.getElementById('meals-content');if(!el)return;
    var days=[],start=new Date();start.setDate(start.getDate()-((start.getDay()+6)%7));
    for(var i=0;i<7;i++){var d=new Date(start);d.setDate(start.getDate()+i);days.push(d);}
    var dayNames=['Ma','Di','Wo','Do','Vr','Za','Zo'];
    var html='<div style="padding:14px 16px 8px;font-size:18px;font-weight:800;color:var(--c-text)">🗓️ Week menu</div>'
      +'<div style="padding:0 16px 8px;font-size:12px;color:var(--c-text2)">Tik op een slot om een recept of maaltijd te plannen.</div>';
    days.forEach(function(d,i){
      var ds=d.toISOString().split('T')[0],lunch=mealAt(ds,'lunch'),dinner=mealAt(ds,'dinner'),isToday=ds===today();
      function slot(type,m,emoji,label){var rec=m&&m.recipeId?recipeById(m.recipeId):null,title=m?(m.title||(rec&&rec.name)||'Maaltijd'):null;return '<div class="meal-slot" data-date="'+ds+'" data-slot="'+type+'"><span style="font-size:14px">'+emoji+'</span>'+(m?'<div class="meal-slot-name">'+title+'</div><button type="button" data-clear-date="'+ds+'" data-clear-slot="'+type+'" style="background:none;border:none;font-size:12px;color:var(--c-text3);cursor:pointer;margin-left:auto">✕</button>':'<div class="meal-slot-empty">'+label+' kiezen...</div>')+'</div>';}
      html+='<div class="meal-day" style="'+(isToday?'background:var(--c-primary-light)':'')+'">'
        +'<div class="meal-day-label" style="'+(isToday?'color:var(--c-primary);font-weight:800':'')+'">'+dayNames[i]+'<br><span style="font-size:10px;font-weight:400">'+d.getDate()+'/'+(d.getMonth()+1)+'</span></div>'
        +'<div style="flex:1;display:flex;flex-direction:column;gap:5px">'
        +slot('lunch',lunch,'🥗','Lunch')+slot('dinner',dinner,'🍽️','Diner')+'</div></div>';
    });
    html+='<div style="padding:12px 16px"><button id="meal-week-shop" style="width:100%;background:var(--c-primary);color:#fff;border:none;border-radius:12px;padding:12px;font-size:14px;font-weight:700;cursor:pointer">🛒 Voeg ingrediënten toe aan boodschappen</button></div>';
    el.innerHTML=html;
    el.querySelectorAll('.meal-slot[data-date]').forEach(function(slot){slot.onclick=function(e){if(e.target&&e.target.hasAttribute('data-clear-date'))return;var m=mealAt(slot.dataset.date,slot.dataset.slot);openPlanner(slot.dataset.date,slot.dataset.slot,m&&m.recipeId);};});
    el.querySelectorAll('[data-clear-date]').forEach(function(btn){btn.onclick=function(e){e.stopPropagation();clearMeal(btn.getAttribute('data-clear-date'),btn.getAttribute('data-clear-slot'));};});
    var shop=document.getElementById('meal-week-shop');if(shop)shop.onclick=addMealPlanToShop;
  }

  function openMealPicker(date,slot){openPlanner(date,slot,null);}
  function clearMeal(date,slot){
    if(window.MealPlanStore&&typeof MealPlanStore.removeSlot==='function')MealPlanStore.removeSlot(date,slot).then(function(){renderMeals();if(typeof window.renderCal==='function')window.renderCal();});
    else if(typeof window.showToast==='function')window.showToast('Maaltijdopslag niet beschikbaar');
  }
  function addMealPlanToShop(){
    var planned=rows().filter(function(m){return m&&m.recipeId;});
    if(!planned.length){if(typeof window.showToast==='function')window.showToast('🛒 Geen recepten gepland');return;}
    var svc=window.ShoppingListService,lists=svc&&svc.list?svc.list():[];
    if(!svc||!lists.length){if(typeof window.showToast==='function')window.showToast('Open eerst een boodschappenlijst');return;}
    var target=(window.ShoppingLists&&ShoppingLists.active?ShoppingLists.active():null)||lists[0],key=target&&target.key;if(!key)return;
    var chain=Promise.resolve(),added=0;
    planned.forEach(function(m){var rec=recipeById(m.recipeId);if(!rec)return;chain=chain.then(function(){return svc.appendRecipeIngredients(key,rec).then(function(result){added+=result&&result.added?result.added.length:0;});});});
    chain.then(function(){if(typeof window.showToast==='function')window.showToast('🛒 '+added+' ingrediënten toegevoegd');if(typeof window.showScreenMore==='function')window.showScreenMore('shop');});
  }

  window.renderMeals=renderMeals;window.openMealPicker=openMealPicker;window.clearMeal=clearMeal;window.addMealPlanToShop=addMealPlanToShop;
  function subscribe(){if(window.MealPlanStore&&MealPlanStore.subscribe&&!window.__mealsScreenStoreSub){window.__mealsScreenStoreSub=MealPlanStore.subscribe(function(){renderMeals();});return true;}return false;}
  if(!subscribe()){var n=0,t=setInterval(function(){n++;if(subscribe()||n>120)clearInterval(t);},100);}
})();