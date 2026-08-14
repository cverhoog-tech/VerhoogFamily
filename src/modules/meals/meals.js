'use strict';
// ============================================================
// MAALTIJDPLANNER v2.1
// UI projection of MealPlanStore/window.mealPlanData.
// Real calendar weeks: this week / next week.
// ============================================================
(function(){
  var weekOffset=0;
  function rows(){return window.MealPlanStore&&MealPlanStore.list?MealPlanStore.list():(Array.isArray(window.mealPlanData)?window.mealPlanData:[]);}
  function recipeById(id){var list=window.RecipeStore&&RecipeStore.list?RecipeStore.list():(Array.isArray(window.recipesData)?window.recipesData:[]);return list.find(function(r){return String(r.id)===String(id);})||null;}
  function mealAt(date,type){return rows().find(function(m){return m&&m.date===date&&m.mealType===type;})||null;}
  function today(){return typeof window.todayStr==='function'?window.todayStr():new Date().toISOString().slice(0,10);}
  function mondayForOffset(offset){var d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7)+(offset*7));return d;}
  function iso(d){var y=d.getFullYear(),m=d.getMonth()+1,day=d.getDate();return y+'-'+(m<10?'0':'')+m+'-'+(day<10?'0':'')+day;}
  function fmt(d){return d.toLocaleDateString('nl-NL',{day:'numeric',month:'short'}).replace('.','');}
  function weekDays(offset){var start=mondayForOffset(offset),out=[];for(var i=0;i<7;i++){var d=new Date(start);d.setDate(start.getDate()+i);out.push(d);}return out;}
  function weekRange(offset){var d=weekDays(offset);return fmt(d[0])+' – '+fmt(d[6]);}
  function ensureStyles(){if(document.getElementById('meal-week-selector-style'))return;var s=document.createElement('style');s.id='meal-week-selector-style';s.textContent=''
    +'.meal-week-switch{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:0 16px 10px;padding:4px;border-radius:14px;background:var(--c-surface2,#f3f4f6);border:1px solid var(--c-border,#e5e7eb)}'
    +'.meal-week-switch button{border:0;border-radius:10px;background:transparent;padding:8px 7px;color:var(--c-text2,#667085);font-size:11px;font-weight:850;line-height:1.15;cursor:pointer}.meal-week-switch button span{display:block;font-size:9.5px;font-weight:700;opacity:.72;margin-top:2px}'
    +'.meal-week-switch button.active{background:var(--c-surface,#fff);color:var(--c-text,#111);box-shadow:0 2px 8px rgba(17,24,39,.08)}';document.head.appendChild(s);}
  function openPlanner(date,type,recipeId){var p=window.MealPlannerBottomSheetBridge;if(p&&typeof p.openMealPlanner==='function'){p.openMealPlanner({date:date,mealType:type,recipeId:recipeId||null});return;}if(typeof window.showToast==='function')window.showToast('Maaltijdplanner wordt geladen');}

  function renderMeals(){
    var el=document.getElementById('meals-content');if(!el)return;ensureStyles();
    var days=weekDays(weekOffset),dayNames=['Ma','Di','Wo','Do','Vr','Za','Zo'];
    var html='<div style="padding:14px 16px 8px;font-size:18px;font-weight:800;color:var(--c-text)">🗓️ Week menu</div>'
      +'<div class="meal-week-switch"><button type="button" data-week="0" class="'+(weekOffset===0?'active':'')+'">Deze week<span>'+weekRange(0)+'</span></button><button type="button" data-week="1" class="'+(weekOffset===1?'active':'')+'">Volgende week<span>'+weekRange(1)+'</span></button></div>'
      +'<div style="padding:0 16px 8px;font-size:12px;color:var(--c-text2)">Tik op een slot om een recept of maaltijd te plannen.</div>';
    days.forEach(function(d,i){
      var ds=iso(d),lunch=mealAt(ds,'lunch'),dinner=mealAt(ds,'dinner'),isToday=ds===today();
      function slot(type,m,emoji,label){var rec=m&&m.recipeId?recipeById(m.recipeId):null,title=m?(m.title||(rec&&rec.name)||'Maaltijd'):null;return '<div class="meal-slot" data-date="'+ds+'" data-slot="'+type+'"><span style="font-size:14px">'+emoji+'</span>'+(m?'<div class="meal-slot-name">'+title+'</div><button type="button" data-clear-date="'+ds+'" data-clear-slot="'+type+'" style="background:none;border:none;font-size:12px;color:var(--c-text3);cursor:pointer;margin-left:auto">✕</button>':'<div class="meal-slot-empty">'+label+' kiezen...</div>')+'</div>';}
      html+='<div class="meal-day" style="'+(isToday?'background:var(--c-primary-light)':'')+'">'
        +'<div class="meal-day-label" style="'+(isToday?'color:var(--c-primary);font-weight:800':'')+'">'+dayNames[i]+'<br><span style="font-size:10px;font-weight:400">'+d.getDate()+'/'+(d.getMonth()+1)+'</span></div>'
        +'<div style="flex:1;display:flex;flex-direction:column;gap:5px">'+slot('lunch',lunch,'🥗','Lunch')+slot('dinner',dinner,'🍽️','Diner')+'</div></div>';
    });
    html+='<div style="padding:12px 16px"><button id="meal-week-shop" style="width:100%;background:var(--c-primary);color:#fff;border:none;border-radius:12px;padding:12px;font-size:14px;font-weight:700;cursor:pointer">🛒 Voeg ingrediënten van deze week toe</button></div>';
    el.innerHTML=html;
    el.querySelectorAll('[data-week]').forEach(function(btn){btn.onclick=function(){weekOffset=parseInt(btn.getAttribute('data-week'),10)||0;renderMeals();};});
    el.querySelectorAll('.meal-slot[data-date]').forEach(function(slot){slot.onclick=function(e){if(e.target&&e.target.hasAttribute('data-clear-date'))return;var m=mealAt(slot.dataset.date,slot.dataset.slot);openPlanner(slot.dataset.date,slot.dataset.slot,m&&m.recipeId);};});
    el.querySelectorAll('[data-clear-date]').forEach(function(btn){btn.onclick=function(e){e.stopPropagation();clearMeal(btn.getAttribute('data-clear-date'),btn.getAttribute('data-clear-slot'));};});
    var shop=document.getElementById('meal-week-shop');if(shop)shop.onclick=addMealPlanToShop;
  }

  function openMealPicker(date,slot){openPlanner(date,slot,null);}
  function clearMeal(date,slot){if(window.MealPlanStore&&typeof MealPlanStore.removeSlot==='function')MealPlanStore.removeSlot(date,slot).then(function(){renderMeals();if(typeof window.renderCal==='function')window.renderCal();});else if(typeof window.showToast==='function')window.showToast('Maaltijdopslag niet beschikbaar');}
  function addMealPlanToShop(){
    var visibleDates={};weekDays(weekOffset).forEach(function(d){visibleDates[iso(d)]=true;});
    var planned=rows().filter(function(m){return m&&m.recipeId&&visibleDates[m.date];});
    if(!planned.length){if(typeof window.showToast==='function')window.showToast('🛒 Geen recepten gepland in deze week');return;}
    var svc=window.ShoppingListService,lists=svc&&svc.list?svc.list():[];if(!svc||!lists.length){if(typeof window.showToast==='function')window.showToast('Open eerst een boodschappenlijst');return;}
    var target=(window.ShoppingLists&&ShoppingLists.active?ShoppingLists.active():null)||lists[0],key=target&&target.key;if(!key)return;
    var chain=Promise.resolve(),added=0;planned.forEach(function(m){var rec=recipeById(m.recipeId);if(!rec)return;chain=chain.then(function(){return svc.appendRecipeIngredients(key,rec).then(function(result){added+=result&&result.added?result.added.length:0;});});});
    chain.then(function(){if(typeof window.showToast==='function')window.showToast('🛒 '+added+' ingrediënten toegevoegd');if(typeof window.showScreenMore==='function')window.showScreenMore('shop');});
  }

  window.renderMeals=renderMeals;window.openMealPicker=openMealPicker;window.clearMeal=clearMeal;window.addMealPlanToShop=addMealPlanToShop;
  function subscribe(){if(window.MealPlanStore&&MealPlanStore.subscribe&&!window.__mealsScreenStoreSub){window.__mealsScreenStoreSub=MealPlanStore.subscribe(function(){renderMeals();});return true;}return false;}
  if(!subscribe()){var n=0,t=setInterval(function(){n++;if(subscribe()||n>120)clearInterval(t);},100);}
})();