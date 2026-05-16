'use strict';
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
    title: 'Taak toevoegen',
    build: function() {
      return '<div class="field"><label>Omschrijving</label><input id="f1" placeholder="bijv. Auto wassen"></div>'
        +'<div class="field"><label>Type</label><div class="type-row">'
        +'<button type="button" class="type-btn active" id="ttype-eenmalig" onclick="setTaskType(\'eenmalig\')">📅 Eenmalig</button>'
        +'<button type="button" class="type-btn" id="ttype-herhalend" onclick="setTaskType(\'herhalend\')">🔁 Herhalend</button>'
        +'</div></div>'
        +'<div id="fields-eenmalig">'
        +'<div class="field"><label>Wie</label><div class="assignee-row">'
        +'<button type="button" class="assignee-chip active" id="aw-shane" onclick="toggleWie(\'Shane\')">Shane</button>'
        +'<button type="button" class="assignee-chip" id="aw-esra" onclick="toggleWie(\'Esra\')">Esra</button>'
        +'</div></div>'
        +'<div class="field"><label>Datum</label><input id="f3" type="date">'
        +'<div class="quick-dates">'
        +'<button type="button" class="quick-date" onclick="setQDate(0)">Vandaag</button>'
        +'<button type="button" class="quick-date" onclick="setQDate(1)">Morgen</button>'
        +'<button type="button" class="quick-date" onclick="setQDate(7)">Volgende week</button>'
        +'</div></div>'
        +'<div class="field"><label>Prioriteit</label><select id="f4">'
        +'<option value="high">🔴 Hoog</option>'
        +'<option value="med" selected>🟠 Normaal</option>'
        +'<option value="low">🟢 Laag</option>'
        +'</select></div>'
        +'</div>'
        +'<div id="fields-herhalend" style="display:none">'
        +'<div class="field"><label>Wie</label><div class="assignee-row">'
        +'<button type="button" class="assignee-chip active" id="aw-r-shane" onclick="toggleWieR(\'Shane\')">Shane</button>'
        +'<button type="button" class="assignee-chip" id="aw-r-esra" onclick="toggleWieR(\'Esra\')">Esra</button>'
        +'</div></div>'
        +'<div class="field"><label>Frequentie</label><div class="type-row">'
        +'<button type="button" class="type-btn active" id="freq-weekly" onclick="setFreq(\'weekly\')">Wekelijks</button>'
        +'<button type="button" class="type-btn" id="freq-monthly1" onclick="setFreq(\'monthly1\')">1x/maand</button>'
        +'<button type="button" class="type-btn" id="freq-monthly2" onclick="setFreq(\'monthly2\')">2x/maand</button>'
        +'</div></div>'
        +'<div id="freq-days-wrap" class="field"><label>Op welke dag(en)?</label>'
        +'<div class="day-pills" id="freq-days">'
        +'<button type="button" class="day-pill" data-day="maandag" onclick="toggleDay(this)">ma</button>'
        +'<button type="button" class="day-pill" data-day="dinsdag" onclick="toggleDay(this)">di</button>'
        +'<button type="button" class="day-pill" data-day="woensdag" onclick="toggleDay(this)">wo</button>'
        +'<button type="button" class="day-pill" data-day="donderdag" onclick="toggleDay(this)">do</button>'
        +'<button type="button" class="day-pill" data-day="vrijdag" onclick="toggleDay(this)">vr</button>'
        +'<button type="button" class="day-pill" data-day="zaterdag" onclick="toggleDay(this)">za</button>'
        +'<button type="button" class="day-pill" data-day="zondag" onclick="toggleDay(this)">zo</button>'
        +'</div></div>'
        +'<div id="freq-month-wrap" class="field" style="display:none"><label>Week van de maand</label>'
        +'<div class="type-row">'
        +'<button type="button" class="type-btn active" data-wk="1" onclick="setMonthWeek(this)">Week 1</button>'
        +'<button type="button" class="type-btn" data-wk="2" onclick="setMonthWeek(this)">Week 2</button>'
        +'<button type="button" class="type-btn" data-wk="3" onclick="setMonthWeek(this)">Week 3</button>'
        +'<button type="button" class="type-btn" data-wk="4" onclick="setMonthWeek(this)">Week 4</button>'
        +'</div>'
        +'<div class="field" style="margin-top:10px"><label>Op welke dag?</label>'
        +'<div class="day-pills" id="freq-month-days">'
        +'<button type="button" class="day-pill" data-day="maandag" onclick="toggleMonthDay(this)">ma</button>'
        +'<button type="button" class="day-pill" data-day="dinsdag" onclick="toggleMonthDay(this)">di</button>'
        +'<button type="button" class="day-pill" data-day="woensdag" onclick="toggleMonthDay(this)">wo</button>'
        +'<button type="button" class="day-pill" data-day="donderdag" onclick="toggleMonthDay(this)">do</button>'
        +'<button type="button" class="day-pill" data-day="vrijdag" onclick="toggleMonthDay(this)">vr</button>'
        +'<button type="button" class="day-pill" data-day="zaterdag" onclick="toggleMonthDay(this)">za</button>'
        +'<button type="button" class="day-pill" data-day="zondag" onclick="toggleMonthDay(this)">zo</button>'
        +'</div></div></div>'
        +'</div>';
    }
  },
  shop: {
    title: 'Boodschap toevoegen',
    build: function() {
      return '<div class="field"><label>Product</label>'
        +'<div class="ac-wrap"><input id="f1" placeholder="bijv. Melk" autocomplete="off">'
        +'<div class="ac-dropdown" id="ac-shop" style="display:none"></div></div></div>'
        +'<div class="field"><label>Hoeveelheid</label><input id="f2" placeholder="bijv. 2x, 500g"></div>'
        +'<div class="field"><label>Categorie</label><select id="f3">'
        +'<option>Groente</option><option>Fruit</option><option>Zuivel</option>'
        +'<option>Brood</option><option>Vlees</option><option>Dranken</option><option>Overig</option>'
        +'</select></div>'
        +'<div class="field"><label>Foto / Emoji (optioneel)</label>'
        +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">'
        +'<span style="font-size:22px;cursor:pointer" onclick="setShopEmoji(\'🥛\')">🥛</span>'
        +'<span style="font-size:22px;cursor:pointer" onclick="setShopEmoji(\'🍎\')">🍎</span>'
        +'<span style="font-size:22px;cursor:pointer" onclick="setShopEmoji(\'🍞\')">🍞</span>'
        +'<span style="font-size:22px;cursor:pointer" onclick="setShopEmoji(\'🧀\')">🧀</span>'
        +'<span style="font-size:22px;cursor:pointer" onclick="setShopEmoji(\'🍅\')">🍅</span>'
        +'<span style="font-size:22px;cursor:pointer" onclick="setShopEmoji(\'🍌\')">🍌</span>'
        +'<span style="font-size:22px;cursor:pointer" onclick="setShopEmoji(\'🥚\')">🥚</span>'
        +'<span style="font-size:22px;cursor:pointer" onclick="setShopEmoji(\'🥩\')">🥩</span>'
        +'<span style="font-size:22px;cursor:pointer" onclick="setShopEmoji(\'🥦\')">🥦</span>'
        +'<span style="font-size:22px;cursor:pointer" onclick="setShopEmoji(\'🧃\')">🧃</span>'
        +'</div>'
        +'<input id="f4" placeholder="Of plak een foto-URL..."></div>';
    }
  },
  cal: { title: 'Afspraak toevoegen', build: function() { return '<div class="field"><label>Titel</label><input id="f1" placeholder="bijv. Tandarts"></div>' +'<div class="field"><label>Datum</label><input id="f2" type="date"></div>' +'<div class="field"><label>Tijd</label><input id="f3" type="time" value="10:00"></div>'; } },
  trans: { title: 'Transactie toevoegen', build: function() { return '<div class="field"><label>Omschrijving</label><input id="f1" placeholder="bijv. Albert Heijn"></div>' +'<div class="field"><label>Bedrag (€)</label><input id="f2" type="number" min="0" step="0.01" placeholder="0.00"></div>' +'<div class="field"><label>Type</label><div class="type-row">' +'<button type="button" class="type-btn active" id="trans-neg" data-tt="-1">💸 Uitgave</button>' +'<button type="button" class="type-btn" id="trans-pos" data-tt="1">💚 Inkomst</button>' +'</div></div>' +'<div class="field"><label>Categorie</label><select id="f3">' +'<option>Boodschappen</option><option>Uit eten</option><option>Transport</option>' +'<option>Gezondheid</option><option>Abonnementen</option><option>Kleding</option>' +'<option>Shopping</option><option>Overig</option></select></div>' +'<div class="field"><label>Wie</label><div class="assignee-row">' +'<button type="button" class="assignee-chip active" id="tw-shane" data-tw="Shane">Shane</button>' +'<button type="button" class="assignee-chip" id="tw-esra" data-tw="Esra">Esra</button>' +'</div></div>' +'<div class="field"><label>Datum</label><input id="f4" type="date"></div>'; } },
  extraincome: { title: '🎁 Extra inkomen toevoegen', build: function() { return '<div class="field"><label>Omschrijving</label><input id="f1" placeholder="bijv. Vakantiegeld"></div>' +'<div class="field"><label>Bedrag (€)</label><input id="f2" type="number" min="0" step="0.01" placeholder="0.00"></div>' +'<div class="field"><label>Categorie</label><select id="f3">' +'<option>Vakantiegeld</option><option>Bonus</option><option>Belasting</option>' +'<option>Freelance</option><option>Cadeau</option><option>Overig</option>' +'</select></div>' +'<div class="field"><label>Wie</label><div class="assignee-row">' +'<button type="button" class="assignee-chip active" id="ew-shane" data-ew="Shane">Shane</button>' +'<button type="button" class="assignee-chip" id="ew-esra" data-ew="Esra">Esra</button>' +'</div></div>' +'<div class="field"><label>Datum</label><input id="f4" type="date"></div>'; } },
  vastlast: { title: 'Vaste last toevoegen', build: function() { return '<div class="field"><label>Naam</label><input id="f1" placeholder="bijv. Huur"></div>' +'<div class="field"><label>Bedrag (€)</label><input id="f2" type="number" min="0" step="1" placeholder="0"></div>' +'<div class="field"><label>Dag van de maand</label><input id="f3" type="number" min="1" max="28" value="1"></div>' +'<div class="field"><label>Wie betaalt?</label><select id="f4">' +'<option value="Samen">Samen</option>' +'<option value="Shane">Shane</option>' +'<option value="Esra">Esra</option>' +'</select></div>'; } }
};

function openAdd(type) {
  var sheet = SHEETS[type];
  if(!sheet) return;
  currentAddType = type;
  document.getElementById('sheet-title').textContent = sheet.title;
  document.getElementById('sheet-fields').innerHTML = sheet.build();
  document.getElementById('add-overlay').classList.add('open');
  setTimeout(function(){
    var f=document.getElementById('f1');if(f)f.focus();
    if(currentAddType==='shop') attachShopAutocomplete();
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
function setShopEmoji(e) { var f=document.getElementById('f4');if(f)f.value=e; }
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
      addActivity('📋','#f0ede8',myName+' maakte taak "'+val+'" aan');
      addNotif('📋','#f0ede8','Nieuwe taak',''+val);
      renderTasks(); updateStats();
    } else {
      var who2 = [];
      if(wieRShane) who2.push('Shane');
      if(wieREsra) who2.push('Esra');
      if(!who2.length) who2.push(myName);
      var r = {id:'r'+recurNextId++,title:val,who:who2,freq:freqMode,days:[],streak:0,doneWeek:{},doneDates:{}};
      if(freqMode==='weekly') {
        document.querySelectorAll('#freq-days .day-pill.active').forEach(function(b){r.days.push(b.dataset.day);});
        if(!r.days.length){showToast('Kies minimaal één dag');return;}
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
      addActivity('🔁','#e8f5e3',myName+' voegde vaste taak "'+val+'" toe');
      renderTasks();
    }
  }
  else if(currentAddType==='shop') {
    var qty  = (document.getElementById('f2')||{}).value||'1x';
    var cat  = (document.getElementById('f3')||{}).value||'Overig';
    var photo = ((document.getElementById('f4')||{}).value||'').trim()||null;
    shopData.unshift({id:(shopNextId||1)++,name:val,qty:qty,cat:cat,who:myName,done:false,photo:photo});
    AppState.save(); renderShop(); updateStats(); addActivity('🛒','#fff3dc',myName+' voegde "'+val+'" toe');
  }
  else if(currentAddType==='cal') { var date2 = (document.getElementById('f2')||{}).value||''; var time  = (document.getElementById('f3')||{}).value||''; calData.push({id:calNextId++,title:val,date:date2,time:time,color:'#2d5a27'}); renderCal(); addActivity('📅','#dbeafe',myName+' voegde afspraak "'+val+'" toe'); }
  else if(currentAddType==='trans') { var amount = parseFloat((document.getElementById('f2')||{}).value)||0; var cat  = (document.getElementById('f3')||{}).value||'Overig'; var date = (document.getElementById('f4')||{}).value||todayStr(); if(amount>0) { transData.unshift({id:transNextId++,name:val,cat:cat,amount:transTypeSign*amount,who:transWho,date:date}); renderFinance(); addActivity('💸','#f0ede8',myName+' voegde transactie "'+val+'" toe'); } }
  else if(currentAddType==='extraincome') { var amount2 = parseFloat((document.getElementById('f2')||{}).value)||0; var cat2  = (document.getElementById('f3')||{}).value||'Overig'; var date3 = (document.getElementById('f4')||{}).value||todayStr(); if(amount2>0) { extraIncome.unshift({id:extraIncNextId++,name:val,amount:amount2,who:extraWho,cat:cat2,date:date3}); renderFinance(); addActivity('🎁','#e8f5e3',myName+' voegde extra inkomen "'+val+'" toe (€ '+amount2+')'); addNotif('🎁','#e8f5e3','Extra inkomen!',val+' · € '+amount2); awardXP(3,'Extra inkomen'); } }
  else if(currentAddType==='vastlast') { var amount3 = parseFloat((document.getElementById('f2')||{}).value)||0; var day    = parseInt((document.getElementById('f3')||{}).value)||1; var who3   = (document.getElementById('f4')||{}).value||'Samen'; vasteLasten.push({id:'vl'+vlNextId++,name:val,amount:amount3,cat:'Overig',day:day,who:who3,paid:{}}); renderFinance(); }

  if(currentAddType==='trade'){submitTrade();return;}
  if(currentAddType==='savings_tx'){saveSavingsTransaction();return;}
  if(currentAddType==='savings_goal'){saveSavingsGoal();return;}
  if(currentAddType==='eenmalig'){saveEenmalig();return;}
  if(currentAddType==='spaar_vanuit_budget'){saveSparenVanuitBudget();return;}
  closeAdd();
  taskTypeMode='eenmalig'; wieShane=true; wieEsra=false;
  wieRShane=true; wieREsra=false; freqMode='weekly';
}
