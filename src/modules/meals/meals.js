'use strict';
// ============================================================
// MAALTIJDPLANNER
// ============================================================
var mealPlan={};
function renderMeals(){
  var el=document.getElementById('meals-content');if(!el)return;
  var days=[],start=new Date();start.setDate(start.getDate()-((start.getDay()+6)%7));
  for(var i=0;i<7;i++){var d=new Date(start);d.setDate(start.getDate()+i);days.push(d);}
  var dayNames=['Ma','Di','Wo','Do','Vr','Za','Zo'];
  var html='<div style="padding:14px 16px 8px;font-size:18px;font-weight:800;color:var(--c-text)">🗓️ Week menu</div>'
    +'<div style="padding:0 16px 8px;font-size:12px;color:var(--c-text2)">Tik op een slot om een recept te koppelen.</div>';
  days.forEach(function(d,i){
    var ds=d.toISOString().split('T')[0];
    var plan=mealPlan[ds]||{};
    var lunchRec=plan.lunch?recipesData.find(function(r){return r.id===plan.lunch;}):null;
    var dinnerRec=plan.dinner?recipesData.find(function(r){return r.id===plan.dinner;}):null;
    var isToday=ds===todayStr();
    html+='<div class="meal-day" style="'+(isToday?'background:var(--c-primary-light)':'')+'">'
      +'<div class="meal-day-label" style="'+(isToday?'color:var(--c-primary);font-weight:800':'')+'">'+dayNames[i]+'<br><span style="font-size:10px;font-weight:400">'+d.getDate()+'/'+(d.getMonth()+1)+'</span></div>'
      +'<div style="flex:1;display:flex;flex-direction:column;gap:5px">'
      +'<div class="meal-slot" data-date="'+ds+'" data-slot="lunch"><span style="font-size:14px">🥗</span>'
      +(lunchRec?'<div class="meal-slot-name">'+lunchRec.name+'</div><button onclick="clearMeal(\''+ds+'\',\'lunch\')" style="background:none;border:none;font-size:12px;color:var(--c-text3);cursor:pointer;margin-left:auto">✕</button>':'<div class="meal-slot-empty">Lunch kiezen...</div>')
      +'</div>'
      +'<div class="meal-slot" data-date="'+ds+'" data-slot="dinner"><span style="font-size:14px">🍽️</span>'
      +(dinnerRec?'<div class="meal-slot-name">'+dinnerRec.name+'</div><button onclick="clearMeal(\''+ds+'\',\'dinner\')" style="background:none;border:none;font-size:12px;color:var(--c-text3);cursor:pointer;margin-left:auto">✕</button>':'<div class="meal-slot-empty">Diner kiezen...</div>')
      +'</div></div></div>';
  });
  html+='<div style="padding:12px 16px"><button onclick="addMealPlanToShop()" style="width:100%;background:var(--c-primary);color:#fff;border:none;border-radius:12px;padding:12px;font-size:14px;font-weight:700;cursor:pointer">🛒 Voeg ingrediënten toe aan boodschappen</button></div>';
  el.innerHTML=html;
  el.querySelectorAll('.meal-slot[data-date]').forEach(function(slot){
    slot.onclick=function(e){if(e.target.tagName==='BUTTON')return;openMealPicker(slot.dataset.date,slot.dataset.slot);};
  });
}
function openMealPicker(date,slot){
  currentAddType='meal_pick';
  var slotLabel=slot==='lunch'?'🥗 Lunch':'🍽️ Diner';
  document.getElementById('sheet-title').textContent=slotLabel+' kiezen';
  document.getElementById('sheet-fields').innerHTML=
    '<div style="display:flex;flex-direction:column;gap:6px;max-height:55vh;overflow-y:auto">'
    +recipesData.map(function(r){
      return '<button data-rid="'+r.id+'" style="background:var(--c-surface2);border:none;border-radius:10px;padding:10px 12px;text-align:left;cursor:pointer;display:flex;align-items:center;gap:10px">'
        +'<span style="font-size:20px">'+(CAT_EMOJIS[r.cat]||'🍴')+'</span>'
        +'<div><div style="font-size:13px;font-weight:700;color:var(--c-text)">'+r.name+'</div>'
        +'<div style="font-size:11px;color:var(--c-text2)">'+r.cat+' · ⏱'+r.time+'m</div></div>'
        +'</button>';
    }).join('')+'</div>';
  document.getElementById('add-overlay').classList.add('open');
  document.getElementById('add-overlay').dataset.mealDate=date;
  document.getElementById('add-overlay').dataset.mealSlot=slot;
  setTimeout(function(){
    document.querySelectorAll('[data-rid]').forEach(function(btn){
      btn.onclick=function(){
        var rid=parseInt(btn.dataset.rid);
        var d2=document.getElementById('add-overlay').dataset.mealDate;
        var s2=document.getElementById('add-overlay').dataset.mealSlot;
        if(!mealPlan[d2])mealPlan[d2]={};
        mealPlan[d2][s2]=rid;
        closeAdd();renderMeals();showToast('Recept gepland! 🍽️');
      };
    });
  },100);
}
function clearMeal(date,slot){if(mealPlan[date]){mealPlan[date][slot]=null;renderMeals();}}
function addMealPlanToShop(){
  var added=0;
  Object.values(mealPlan).forEach(function(day){
    ['lunch','dinner'].forEach(function(slot){
      if(!day[slot])return;
      var rec=recipesData.find(function(r){return r.id===day[slot];});
      if(rec){addRecipeToShop(rec.id);added++;}
    });
  });
  showToast('🛒 '+(added?added+' recepten naar boodschappenlijst':'Geen recepten gepland'));
  if(added)showScreenMore('shop');
}

