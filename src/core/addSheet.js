'use strict';
function addTr(key,fallback,params){try{if(window.FamilyI18n&&typeof window.FamilyI18n.t==='function'){var value=window.FamilyI18n.t(key,params||{});if(value&&value!==key)return value;}}catch(error){}return fallback;}
// ============================================================
// ADD SHEET
// ============================================================

function persistTasksFromAddSheet(operation, id) {
  if(window.TaskRepositoryAdapter && typeof window.TaskRepositoryAdapter.persistGlobals === 'function') {
    window.TaskRepositoryAdapter.persistGlobals({ operation: operation || 'addSheetTaskMutation', id: id || null, source: 'addSheet.js' });
  } else if(window.AppState && typeof window.AppState.save === 'function') {
    window.AppState.save();
  }
}

var SHEETS = {
  task: {
    title: function(){return addTr('add.task.title','Taak toevoegen');},
    build: function() {
      var days=[
        ['maandag','add.day.mon','ma'],['dinsdag','add.day.tue','di'],['woensdag','add.day.wed','wo'],
        ['donderdag','add.day.thu','do'],['vrijdag','add.day.fri','vr'],['zaterdag','add.day.sat','za'],['zondag','add.day.sun','zo']
      ];
      var dayButtons=days.map(function(row){return '<button type="button" class="day-pill" data-day="'+row[0]+'" onclick="toggleDay(this)">'+addTr(row[1],row[2])+'</button>';}).join('');
      var monthDayButtons=days.map(function(row){return '<button type="button" class="day-pill" data-day="'+row[0]+'" onclick="toggleMonthDay(this)">'+addTr(row[1],row[2])+'</button>';}).join('');
      return '<div class="field"><label>'+addTr('add.description','Omschrijving')+'</label><input id="f1" placeholder="'+addTr('add.description.taskPlaceholder','bijv. Auto wassen')+'"></div>'
        +'<div class="field"><label>'+addTr('add.type','Type')+'</label><div class="type-row">'
        +'<button type="button" class="type-btn active" id="ttype-eenmalig" onclick="setTaskType(\'eenmalig\')">📅 '+addTr('add.oneTime','Eenmalig')+'</button>'
        +'<button type="button" class="type-btn" id="ttype-herhalend" onclick="setTaskType(\'herhalend\')">🔁 '+addTr('add.recurring','Herhalend')+'</button>'
        +'</div></div>'
        +'<div id="fields-eenmalig">'
        +'<div class="field"><label>'+addTr('add.who','Wie')+'</label><div class="assignee-row">'
        +'<button type="button" class="assignee-chip active" id="aw-shane" onclick="toggleWie(\'Shane\')">Shane</button>'
        +'<button type="button" class="assignee-chip" id="aw-esra" onclick="toggleWie(\'Esra\')">Esra</button>'
        +'</div></div>'
        +'<div class="field"><label>'+addTr('add.date','Datum')+'</label><input id="f3" type="date">'
        +'<div class="quick-dates">'
        +'<button type="button" class="quick-date" onclick="setQDate(0)">'+addTr('common.today','Vandaag')+'</button>'
        +'<button type="button" class="quick-date" onclick="setQDate(1)">'+addTr('common.tomorrow','Morgen')+'</button>'
        +'<button type="button" class="quick-date" onclick="setQDate(7)">'+addTr('add.nextWeek','Volgende week')+'</button>'
        +'</div></div>'
        +'<div class="field"><label>'+addTr('add.priority','Prioriteit')+'</label><select id="f4">'
        +'<option value="high">🔴 '+addTr('add.priority.high','Hoog')+'</option>'
        +'<option value="med" selected>🟠 '+addTr('add.priority.normal','Normaal')+'</option>'
        +'<option value="low">🟢 '+addTr('add.priority.low','Laag')+'</option>'
        +'</select></div>'
        +'</div>'
        +'<div id="fields-herhalend" style="display:none">'
        +'<div class="field"><label>'+addTr('add.who','Wie')+'</label><div class="assignee-row">'
        +'<button type="button" class="assignee-chip active" id="aw-r-shane" onclick="toggleWieR(\'Shane\')">Shane</button>'
        +'<button type="button" class="assignee-chip" id="aw-r-esra" onclick="toggleWieR(\'Esra\')">Esra</button>'
        +'</div></div>'
        +'<div class="field"><label>'+addTr('add.frequency','Frequentie')+'</label><div class="type-row">'
        +'<button type="button" class="type-btn active" id="freq-weekly" onclick="setFreq(\'weekly\')">'+addTr('add.weekly','Wekelijks')+'</button>'
        +'<button type="button" class="type-btn" id="freq-monthly1" onclick="setFreq(\'monthly1\')">'+addTr('add.monthlyOnce','1x/maand')+'</button>'
        +'<button type="button" class="type-btn" id="freq-monthly2" onclick="setFreq(\'monthly2\')">'+addTr('add.monthlyTwice','2x/maand')+'</button>'
        +'</div></div>'
        +'<div id="freq-days-wrap" class="field"><label>'+addTr('add.whichDays','Op welke dag(en)?')+'</label>'
        +'<div class="day-pills" id="freq-days">'+dayButtons+'</div></div>'
        +'<div id="freq-month-wrap" class="field" style="display:none"><label>'+addTr('add.weekOfMonth','Week van de maand')+'</label>'
        +'<div class="type-row">'
        +[1,2,3,4].map(function(n){return '<button type="button" class="type-btn '+(n===1?'active':'')+'" data-wk="'+n+'" onclick="setMonthWeek(this)">'+addTr('add.weekNumber','Week '+n,{count:n})+'</button>';}).join('')
        +'</div>'
        +'<div class="field" style="margin-top:10px"><label>'+addTr('add.whichDay','Op welke dag?')+'</label>'
        +'<div class="day-pills" id="freq-month-days">'+monthDayButtons+'</div></div></div>'
        +'</div>';
    }
  },
  cal: {
    title:function(){return addTr('add.calendar.title','Afspraak toevoegen');},
    build:function(){return '<div class="field"><label>'+addTr('add.title','Titel')+'</label><input id="f1" placeholder="'+addTr('add.title.placeholder','bijv. Tandarts')+'"></div>'
      +'<div class="field"><label>'+addTr('add.date','Datum')+'</label><input id="f2" type="date"></div>'
      +'<div class="field"><label>'+addTr('add.time','Tijd')+'</label><input id="f3" type="time" value="10:00"></div>';}
  },
  trans: {
    title:function(){return addTr('add.transaction.title','Transactie toevoegen');},
    build:function(){return '<div class="field"><label>'+addTr('add.description','Omschrijving')+'</label><input id="f1" placeholder="'+addTr('add.transaction.placeholder','bijv. Albert Heijn')+'"></div>'
      +'<div class="field"><label>'+addTr('add.amount','Bedrag (€)')+'</label><input id="f2" type="number" min="0" step="0.01" placeholder="0.00"></div>'
      +'<div class="field"><label>'+addTr('add.type','Type')+'</label><div class="type-row">'
      +'<button type="button" class="type-btn active" id="trans-neg" data-tt="-1">💸 '+addTr('add.expense','Uitgave')+'</button>'
      +'<button type="button" class="type-btn" id="trans-pos" data-tt="1">💚 '+addTr('add.income','Inkomst')+'</button></div></div>'
      +'<div class="field"><label>'+addTr('add.category','Categorie')+'</label><select id="f3">'
      +'<option value="Boodschappen">'+addTr('add.cat.groceries','Boodschappen')+'</option><option value="Uit eten">'+addTr('add.cat.dining','Uit eten')+'</option><option value="Transport">'+addTr('add.cat.transport','Transport')+'</option>'
      +'<option value="Gezondheid">'+addTr('add.cat.health','Gezondheid')+'</option><option value="Abonnementen">'+addTr('add.cat.subscriptions','Abonnementen')+'</option><option value="Kleding">'+addTr('add.cat.clothing','Kleding')+'</option>'
      +'<option value="Shopping">'+addTr('add.cat.shopping','Shopping')+'</option><option value="Overig">'+addTr('add.cat.other','Overig')+'</option></select></div>'
      +'<div class="field"><label>'+addTr('add.who','Wie')+'</label><div class="assignee-row"><button type="button" class="assignee-chip active" id="tw-shane" data-tw="Shane">Shane</button><button type="button" class="assignee-chip" id="tw-esra" data-tw="Esra">Esra</button></div></div>'
      +'<div class="field"><label>'+addTr('add.date','Datum')+'</label><input id="f4" type="date"></div>';}
  },
  extraincome: {
    title:function(){return addTr('add.extraIncome.title','🎁 Extra inkomen toevoegen');},
    build:function(){return '<div class="field"><label>'+addTr('add.description','Omschrijving')+'</label><input id="f1" placeholder="'+addTr('add.extraIncome.placeholder','bijv. Vakantiegeld')+'"></div>'
      +'<div class="field"><label>'+addTr('add.amount','Bedrag (€)')+'</label><input id="f2" type="number" min="0" step="0.01" placeholder="0.00"></div>'
      +'<div class="field"><label>'+addTr('add.category','Categorie')+'</label><select id="f3">'
      +'<option value="Vakantiegeld">'+addTr('add.cat.holidayPay','Vakantiegeld')+'</option><option value="Bonus">'+addTr('add.cat.bonus','Bonus')+'</option><option value="Belasting">'+addTr('add.cat.tax','Belasting')+'</option>'
      +'<option value="Freelance">'+addTr('add.cat.freelance','Freelance')+'</option><option value="Cadeau">'+addTr('add.cat.gift','Cadeau')+'</option><option value="Overig">'+addTr('add.cat.other','Overig')+'</option></select></div>'
      +'<div class="field"><label>'+addTr('add.who','Wie')+'</label><div class="assignee-row"><button type="button" class="assignee-chip active" id="ew-shane" data-ew="Shane">Shane</button><button type="button" class="assignee-chip" id="ew-esra" data-ew="Esra">Esra</button></div></div>'
      +'<div class="field"><label>'+addTr('add.date','Datum')+'</label><input id="f4" type="date"></div>';}
  },
  vastlast: {
    title:function(){return addTr('add.fixed.title','Vaste last toevoegen');},
    build:function(){return '<div class="field"><label>'+addTr('add.name','Naam')+'</label><input id="f1" placeholder="'+addTr('add.rentPlaceholder','bijv. Huur')+'"></div>'
      +'<div class="field"><label>'+addTr('add.amount','Bedrag (€)')+'</label><input id="f2" type="number" min="0" step="1" placeholder="0"></div>'
      +'<div class="field"><label>'+addTr('add.dayOfMonth','Dag van de maand')+'</label><input id="f3" type="number" min="1" max="28" value="1"></div>'
      +'<div class="field"><label>'+addTr('add.whoPays','Wie betaalt?')+'</label><select id="f4"><option value="Samen">'+addTr('add.together','Samen')+'</option><option value="Shane">Shane</option><option value="Esra">Esra</option></select></div>';}
  }
};

function openAdd(type) {
  // Boodschappen has its own dedicated, state-owning UI (GroceryAddSheet ->
  // ShoppingListStore). It is not a SHEETS[] entry: routing it through the
  // generic raw sheet here would resurrect a second, competing add-item UI.
  if(type === 'shop') {
    if(window.GroceryAddSheet && typeof window.GroceryAddSheet.open === 'function') { window.GroceryAddSheet.open(); return; }
    if(typeof window.showToast === 'function') window.showToast(addTr('add.shoppingUnavailable','Boodschappenlijst is nog niet beschikbaar. Probeer opnieuw.'));
    return;
  }
  var sheet = SHEETS[type];
  if(!sheet) return;
  currentAddType = type;
  document.getElementById('sheet-title').textContent = typeof sheet.title==='function'?sheet.title():sheet.title;
  document.getElementById('sheet-fields').innerHTML = sheet.build();
  document.getElementById('add-overlay').classList.add('open');
  var addSheetEl = document.querySelector('#add-overlay .add-sheet');
  if(addSheetEl) addSheetEl.classList.toggle('sheet-task', type === 'task');
  setTimeout(function(){
    var f=document.getElementById('f1');if(f)f.focus();
    document.querySelectorAll('[data-tt]').forEach(function(b){ b.onclick=function(){setTransType(parseInt(b.dataset.tt));}; });
    document.querySelectorAll('[data-tw]').forEach(function(b){ b.onclick=function(){setTransWie(b.dataset.tw);}; });
    document.querySelectorAll('[data-ew]').forEach(function(b){ b.onclick=function(){setExtraWie(b.dataset.ew);}; });
  },200);
}

function closeAdd() { document.getElementById('add-overlay').classList.remove('open'); currentAddType = ''; }

var taskTypeMode = 'eenmalig';
var transTypeSign = -1;
var transWho = 'Shane';
var extraWho = 'Shane';
function setTransType(sign) { transTypeSign=sign; var n=document.getElementById('trans-neg'); if(n)n.classList.toggle('active',sign===-1); var p=document.getElementById('trans-pos'); if(p)p.classList.toggle('active',sign===1); }
function setTransWie(who) { transWho=who; var s=document.getElementById('tw-shane');if(s)s.classList.toggle('active',who==='Shane'); var e=document.getElementById('tw-esra'); if(e)e.classList.toggle('active',who==='Esra'); }
function setExtraWie(who) { extraWho=who; var s=document.getElementById('ew-shane');if(s)s.classList.toggle('active',who==='Shane'); var e=document.getElementById('ew-esra'); if(e)e.classList.toggle('active',who==='Esra'); }
var wieShane = true;
var wieEsra = false;
var wieRShane = true;
var wieREsra = false;
var freqMode = 'weekly';
var monthWeeks = [1];
function setTaskType(t) { taskTypeMode = t; document.getElementById('ttype-eenmalig').classList.toggle('active', t==='eenmalig'); document.getElementById('ttype-herhalend').classList.toggle('active', t==='herhalend'); document.getElementById('fields-eenmalig').style.display = t==='eenmalig' ? '' : 'none'; document.getElementById('fields-herhalend').style.display = t==='herhalend' ? '' : 'none'; }
function toggleWie(name) { if(name==='Shane'){wieShane=!wieShane;document.getElementById('aw-shane').classList.toggle('active',wieShane);} else{wieEsra=!wieEsra;document.getElementById('aw-esra').classList.toggle('active',wieEsra);} }
function toggleWieR(name) { if(name==='Shane'){wieRShane=!wieRShane;document.getElementById('aw-r-shane').classList.toggle('active',wieRShane);} else{wieREsra=!wieREsra;document.getElementById('aw-r-esra').classList.toggle('active',wieREsra);} }
function setFreq(f) { freqMode = f; ['weekly','monthly1','monthly2'].forEach(function(x){ var el=document.getElementById('freq-'+x);if(el)el.classList.toggle('active',x===f); }); var isMonth = f==='monthly1'||f==='monthly2'; document.getElementById('freq-days-wrap').style.display = isMonth ? 'none' : ''; document.getElementById('freq-month-wrap').style.display = isMonth ? '' : 'none'; }
function toggleDay(btn) { btn.classList.toggle('active'); }
function toggleMonthDay(btn) { document.querySelectorAll('#freq-month-days .day-pill').forEach(function(b){b.classList.remove('active');}); btn.classList.add('active'); }
function setMonthWeek(btn) { btn.closest('.type-row').querySelectorAll('.type-btn').forEach(function(b){b.classList.remove('active');}); btn.classList.add('active'); }
function setQDate(days) { var d=new Date();d.setDate(d.getDate()+days); var f=document.getElementById('f3'); if(f)f.value=d.toISOString().split('T')[0]; }

function saveItem() {
  var f1 = document.getElementById('f1');
  var val = f1 ? f1.value.trim() : '';
  if(!val){closeAdd();return;}

  if(currentAddType==='task') {
    if(taskTypeMode==='eenmalig') {
      var who = [];
      if(wieShane) who.push('Shane');
      if(wieEsra) who.push('Esra');
      if(!who.length) who.push(myName);
      var date = (document.getElementById('f3')||{}).value||null;
      var prio = (document.getElementById('f4')||{}).value||'med';
      var createdTask = {id:taskNextId++,title:val,who:who,date:date,done:false,prio:prio};
      taskData.unshift(createdTask);
      persistTasksFromAddSheet('createTask', createdTask.id);
      addActivity('📋','#f0ede8',addTr('add.activity.task',myName+' maakte taak “'+val+'” aan',{name:myName,title:val}));
      renderTasks(); updateStats();
    } else {
      var who2 = [];
      if(wieRShane) who2.push('Shane');
      if(wieREsra) who2.push('Esra');
      if(!who2.length) who2.push(myName);
      var r = {id:'r'+recurNextId++,title:val,who:who2,freq:freqMode,days:[],streak:0,doneWeek:{},doneDates:{}};
      if(freqMode==='weekly') {
        document.querySelectorAll('#freq-days .day-pill.active').forEach(function(b){r.days.push(b.dataset.day);});
        if(!r.days.length){showToast(addTr('add.chooseDay','Kies minimaal één dag'));return;}
        r.freqLabel = r.days.map(function(d){return d.slice(0,2);}).join(', ');
      } else {
        var wkBtn = document.querySelector('[data-wk].active');
        var dayBtn = document.querySelector('#freq-month-days .day-pill.active');
        r.week = wkBtn ? parseInt(wkBtn.dataset.wk) : 1;
        r.day = dayBtn ? dayBtn.dataset.day : 'maandag';
        r.weeks = freqMode==='monthly2' ? [r.week, r.week+2] : [r.week];
        r.freqLabel = 'Week '+r.week+' · '+r.day.slice(0,2);
      }
      recurData.push(r);
      persistTasksFromAddSheet('createRecurringTask', r.id);
      addActivity('🔁','#e8f5e3',addTr('add.activity.recurring',myName+' voegde vaste taak “'+val+'” toe',{name:myName,title:val}));
      renderTasks();
    }
  }
  else if(currentAddType==='cal') { var date2 = (document.getElementById('f2')||{}).value||''; var time  = (document.getElementById('f3')||{}).value||''; calData.push({id:calNextId++,title:val,date:date2,time:time,color:'#2d5a27'}); renderCal(); addActivity('📅','#dbeafe',addTr('add.activity.appointment',myName+' voegde afspraak “'+val+'” toe',{name:myName,title:val})); }
  else if(currentAddType==='trans') { var amount = parseFloat((document.getElementById('f2')||{}).value)||0; var cat  = (document.getElementById('f3')||{}).value||'Overig'; var date = (document.getElementById('f4')||{}).value||todayStr(); if(amount>0 && window.FinanceStore) { FinanceStore.addTransaction({name:val,cat:cat,amount:transTypeSign*amount,who:transWho,date:date}).then(function(){ addActivity('💸','#f0ede8',addTr('add.activity.transaction',myName+' voegde transactie “'+val+'” toe',{name:myName,title:val})); }); } }
  else if(currentAddType==='extraincome') { var amount2 = parseFloat((document.getElementById('f2')||{}).value)||0; var cat2  = (document.getElementById('f3')||{}).value||'Overig'; var date3 = (document.getElementById('f4')||{}).value||todayStr(); if(amount2>0 && window.FinanceStore) { FinanceStore.addExtraIncome({name:val,amount:amount2,who:extraWho,cat:cat2,date:date3}).then(function(){ addActivity('🎁','#e8f5e3',addTr('add.activity.extraIncome',myName+' voegde extra inkomen “'+val+'” toe (€ '+amount2+')',{name:myName,title:val,amount:amount2})); awardXP(3,'Extra inkomen'); }); } }
  else if(currentAddType==='vastlast') { var amount3 = parseFloat((document.getElementById('f2')||{}).value)||0; var day    = parseInt((document.getElementById('f3')||{}).value)||1; var who3   = (document.getElementById('f4')||{}).value||'Samen'; if(window.FinanceStore) FinanceStore.addVasteLast({name:val,amount:amount3,cat:'Overig',day:day,who:who3}); }

  if(currentAddType==='trade'){submitTrade();return;}
  if(currentAddType==='savings_tx'){saveSavingsTransaction();return;}
  if(currentAddType==='savings_goal'){saveSavingsGoal();return;}
  if(currentAddType==='eenmalig'){saveEenmalig();return;}
  if(currentAddType==='spaar_vanuit_budget'){saveSparenVanuitBudget();return;}
  closeAdd();
  taskTypeMode='eenmalig'; wieShane=true; wieEsra=false;
  wieRShane=true; wieREsra=false; freqMode='weekly';
}

window.addEventListener('familyapp:language-changed',function(){try{if(document.getElementById('add-overlay')&&document.getElementById('add-overlay').classList.contains('open')&&currentAddType&&SHEETS[currentAddType]){var sheet=SHEETS[currentAddType];document.getElementById('sheet-title').textContent=typeof sheet.title==='function'?sheet.title():sheet.title;document.getElementById('sheet-fields').innerHTML=sheet.build();}}catch(error){}});
