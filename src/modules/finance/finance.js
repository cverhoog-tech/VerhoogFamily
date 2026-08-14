'use strict';
// ============================================================
// SPAARDOELEN
// ============================================================

var GOAL_ICONS = ['🏠','🚗','✈️','💻','📱','🎓','💍','🌴','🛋️','🎸','⛵','👶','🐕','🏋️','🎮','🌍','💊','🏦','🎁','💰'];

var savingsGoals = [
  {id:1, name:'Vakantie Italië', icon:'✈️', target:3000, saved:1250, who:'Beiden',
   color:'#1a6fa8',
   log:[
     {date:'2026-01-15', amount:500,  type:'deposit', note:'Eerste inleg', who:'Shane'},
     {date:'2026-02-01', amount:300,  type:'deposit', note:'Maandelijkse bijdrage', who:'Esra'},
     {date:'2026-03-01', amount:250,  type:'deposit', note:'Maandelijkse bijdrage', who:'Shane'},
     {date:'2026-04-01', amount:200,  type:'deposit', note:'Extra bijdrage', who:'Esra'},
   ]},
  {id:2, name:'Nieuwe bank', icon:'🛋️', target:800, saved:320, who:'Beiden',
   color:'#7c3aed',
   log:[
     {date:'2026-02-10', amount:200, type:'deposit', note:'Start', who:'Shane'},
     {date:'2026-03-15', amount:120, type:'deposit', note:'Bijdrage', who:'Esra'},
   ]},
  {id:3, name:'Noodfonds', icon:'🏦', target:5000, saved:2100, who:'Beiden',
   color:'#2d5a27',
   log:[
     {date:'2026-01-01', amount:1000, type:'deposit', note:'Start noodfonds', who:'Shane'},
     {date:'2026-02-01', amount:500,  type:'deposit', note:'Maandelijkse inleg', who:'Esra'},
     {date:'2026-03-01', amount:400,  type:'deposit', note:'Maandelijkse inleg', who:'Shane'},
     {date:'2026-04-01', amount:200,  type:'withdrawal', note:'Autopech', who:'Shane'},
   ]}
];
var savingsNextId = 4;
var savingsViewGoal = null;

function renderSparen() {
  var el = document.getElementById('fin-sparen');
  if(!el) return;
  if(savingsViewGoal) renderSparenDetail(el, savingsViewGoal);
  else renderSparenOverview(el);
}

function renderSparenOverview(el) {
  var totalTarget = savingsGoals.reduce(function(s,g){return s+g.target;},0);
  var totalSaved  = savingsGoals.reduce(function(s,g){return s+g.saved;},0);
  var pct = totalTarget ? Math.round(totalSaved/totalTarget*100) : 0;

  var html = '<div style="background:linear-gradient(135deg,#1e3a5c,#2d5a8c);color:#fff;padding:20px 16px">'
    +'<div style="font-size:13px;opacity:.75;margin-bottom:4px">Totaal gespaard</div>'
    +'<div style="font-size:32px;font-weight:900">€ '+totalSaved.toLocaleString('nl-NL')+'</div>'
    +'<div style="font-size:13px;opacity:.75;margin-top:2px">van € '+totalTarget.toLocaleString('nl-NL')+' doel</div>'
    +'<div style="height:6px;background:rgba(255,255,255,.2);border-radius:3px;margin:12px 0 4px;overflow:hidden">'
    +'<div style="height:100%;width:'+pct+'%;background:#fff;border-radius:3px;transition:width .6s"></div></div>'
    +'<div style="font-size:11px;opacity:.7">'+pct+'% van alle doelen bereikt</div>'
    +'</div>';

  html += '<div style="padding:12px 16px 8px;display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:16px;font-weight:800;color:var(--c-text)">Spaardoelen</div>'
    +'<button onclick="openSavingsGoalSheet(null)" style="background:var(--c-primary);color:#fff;border:none;border-radius:20px;padding:7px 16px;font-size:13px;font-weight:700;cursor:pointer">+ Nieuw doel</button>'
    +'</div>';

  if(!savingsGoals.length) {
    html += '<div style="text-align:center;padding:40px;color:var(--c-text2)">Nog geen spaardoelen. Voeg er een toe!</div>';
  } else {
    savingsGoals.forEach(function(g){
      var gPct = g.target ? Math.min(Math.round(g.saved/g.target*100),100) : 0;
      var remaining = Math.max(0, g.target - g.saved);
      var done = g.saved >= g.target;
      html += '<div style="background:var(--c-surface);border-radius:16px;margin:0 16px 10px;padding:14px;box-shadow:0 1px 6px var(--c-card-shadow);cursor:pointer;transition:transform .12s" data-goalid="'+g.id+'">'
        +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">'
        +'<div style="width:44px;height:44px;border-radius:14px;background:'+g.color+'22;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">'+g.icon+'</div>'
        +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:15px;font-weight:800;color:var(--c-text)">'+g.name+'</div>'
        +'<div style="font-size:12px;color:var(--c-text2);margin-top:1px">'+(done?'🎉 Doel bereikt!':'Nog € '+remaining.toLocaleString('nl-NL')+' te gaan')+'</div>'
        +'</div>'+(done?'<div style="font-size:20px">🎉</div>':'')+'</div>'
        +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><div style="flex:1;height:10px;background:var(--c-surface2);border-radius:5px;overflow:hidden"><div style="height:100%;width:'+gPct+'%;background:'+g.color+';border-radius:5px;transition:width .5s"></div></div><div style="font-size:12px;font-weight:700;color:'+g.color+';min-width:36px;text-align:right">'+gPct+'%</div></div>'
        +'<div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:13px;font-weight:700;color:var(--c-text)">€ '+g.saved.toLocaleString('nl-NL')+' <span style="font-size:11px;font-weight:400;color:var(--c-text2)">/ € '+g.target.toLocaleString('nl-NL')+'</span></div><div style="display:flex;gap:6px"><button data-deposit="'+g.id+'" style="background:var(--c-primary);color:#fff;border:none;border-radius:9px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer">+ Storting</button><button data-withdraw="'+g.id+'" style="background:var(--c-surface2);color:var(--c-text2);border:none;border-radius:9px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer">− Opname</button></div></div></div>';
    });
  }
  el.innerHTML = html;
  el.querySelectorAll('[data-goalid]').forEach(function(card){card.onclick=function(e){if(e.target.closest('[data-deposit]')||e.target.closest('[data-withdraw]'))return;savingsViewGoal=card.dataset.goalid;renderSparen();};});
  el.querySelectorAll('[data-deposit]').forEach(function(btn){btn.onclick=function(e){e.stopPropagation();openSavingsSheet(btn.dataset.deposit,'deposit');};});
  el.querySelectorAll('[data-withdraw]').forEach(function(btn){btn.onclick=function(e){e.stopPropagation();openSavingsSheet(btn.dataset.withdraw,'withdrawal');};});
}

function renderSparenDetail(el, goalId) {
  var g = savingsGoals.find(function(x){return x.id===goalId;});
  if(!g) { savingsViewGoal=null; renderSparen(); return; }
  var gPct = g.target ? Math.min(Math.round(g.saved/g.target*100),100) : 0;
  var remaining = Math.max(0, g.target - g.saved);
  var done = g.saved >= g.target;
  var totalDeposits=(g.log||[]).filter(function(l){return l.type==='deposit';}).reduce(function(s,l){return s+l.amount;},0);
  var totalWithdrawals=(g.log||[]).filter(function(l){return l.type==='withdrawal';}).reduce(function(s,l){return s+l.amount;},0);

  var html='<div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:.5px solid var(--c-border);position:sticky;top:54px;background:var(--c-surface);z-index:5"><button onclick="savingsViewGoal=null;renderSparen()" style="background:none;border:none;font-size:14px;font-weight:600;color:var(--c-primary);cursor:pointer">← Terug</button><div style="flex:1;font-size:16px;font-weight:800;color:var(--c-text)">'+g.icon+' '+g.name+'</div><button onclick="openSavingsGoalSheet(\''+g.id+'\')" style="background:none;border:none;font-size:14px;color:var(--c-text2);cursor:pointer">✏️</button><button onclick="deleteSavingsGoal(\''+g.id+'\')" style="background:none;border:none;font-size:14px;color:#dc2626;cursor:pointer">🗑</button></div>';
  html+='<div style="margin:12px 16px;background:'+g.color+';border-radius:16px;padding:18px;color:#fff"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px"><div><div style="font-size:12px;opacity:.8">Gespaard</div><div style="font-size:28px;font-weight:900">€ '+g.saved.toLocaleString('nl-NL')+'</div><div style="font-size:12px;opacity:.8">van € '+g.target.toLocaleString('nl-NL')+'</div></div><div style="text-align:right"><div style="font-size:32px;font-weight:900">'+gPct+'%</div><div style="font-size:11px;opacity:.8">'+(done?'Bereikt! 🎉':'Nog € '+remaining.toLocaleString('nl-NL'))+'</div></div></div><div style="height:8px;background:rgba(255,255,255,.25);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+gPct+'%;background:#fff;border-radius:4px;transition:width .6s"></div></div></div>';
  html+='<div style="display:flex;gap:8px;padding:0 16px 12px"><div style="flex:1;background:var(--c-surface);border-radius:12px;padding:10px;text-align:center;box-shadow:0 1px 4px var(--c-card-shadow)"><div style="font-size:16px;font-weight:800;color:#16a34a">+€ '+totalDeposits.toLocaleString('nl-NL')+'</div><div style="font-size:10px;color:var(--c-text2);margin-top:2px">Totaal gestort</div></div><div style="flex:1;background:var(--c-surface);border-radius:12px;padding:10px;text-align:center;box-shadow:0 1px 4px var(--c-card-shadow)"><div style="font-size:16px;font-weight:800;color:#dc2626">-€ '+totalWithdrawals.toLocaleString('nl-NL')+'</div><div style="font-size:10px;color:var(--c-text2);margin-top:2px">Totaal opgenomen</div></div><div style="flex:1;background:var(--c-surface);border-radius:12px;padding:10px;text-align:center;box-shadow:0 1px 4px var(--c-card-shadow)"><div style="font-size:16px;font-weight:800;color:var(--c-text2)">'+(g.log||[]).length+'x</div><div style="font-size:10px;color:var(--c-text2);margin-top:2px">Transacties</div></div></div>';
  html+='<div style="display:flex;gap:8px;padding:0 16px 16px"><button onclick="openSavingsSheet(\''+g.id+'\',\'deposit\')" style="flex:2;background:var(--c-primary);color:#fff;border:none;border-radius:12px;padding:12px;font-size:14px;font-weight:700;cursor:pointer">+ Storting toevoegen</button><button onclick="openSavingsSheet(\''+g.id+'\',\'withdrawal\')" style="flex:1;background:var(--c-surface2);color:var(--c-text2);border:none;border-radius:12px;padding:12px;font-size:13px;font-weight:600;cursor:pointer">− Opname</button></div>';
  html += renderSavingsChart(g);
  html += '<div style="padding:0 16px 4px;font-size:11px;font-weight:700;color:var(--c-text2);text-transform:uppercase;letter-spacing:.5px">Transactielogboek</div>';
  var sortedLog=window.FinanceStore?FinanceStore.sortTransactions(g.log||[]):(g.log||[]).slice();
  if(!sortedLog.length)html+='<div style="text-align:center;padding:20px;color:var(--c-text2);font-size:13px">Nog geen transacties</div>';
  else{
    html+='<div>';
    sortedLog.forEach(function(l){var isDeposit=l.type==='deposit';var whoColor=l.who==='Shane'?'var(--c-primary)':'var(--c-partner)';html+='<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:.5px solid var(--c-border);background:var(--c-surface)"><div style="width:38px;height:38px;border-radius:50%;background:'+(isDeposit?'#dcfce7':'#fee2e2')+';display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">'+(isDeposit?'💰':'📤')+'</div><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:var(--c-text)">'+(l.note||(isDeposit?'Storting':'Opname'))+'</div><div style="font-size:11px;color:var(--c-text2);margin-top:2px">'+formatDate(l.date)+' · <span style="font-weight:700;color:'+whoColor+'">'+l.who+'</span></div></div><div style="font-size:15px;font-weight:800;color:'+(isDeposit?'#16a34a':'#dc2626')+'">'+(isDeposit?'+':'-')+'€ '+l.amount.toFixed(0)+'</div><button data-dellog="'+l.id+'" style="background:none;border:none;color:var(--c-text3);font-size:13px;padding:4px;cursor:pointer">✕</button></div>';});
    html+='</div>';
  }
  html+='<div style="height:30px"></div>';
  el.innerHTML=html;
  el.querySelectorAll('[data-dellog]').forEach(function(btn){btn.onclick=function(){if(window.FinanceStore)FinanceStore.deleteSavingsLogEntry(g.id,btn.dataset.dellog);};});
}

function openSavingsSheet(goalId, type) {
  var g=savingsGoals.find(function(x){return x.id===goalId;});if(!g)return;
  currentAddType='savings_tx';
  document.getElementById('sheet-title').textContent=type==='deposit'?'💰 Storting — '+g.name:'📤 Opname — '+g.name;
  document.getElementById('sheet-fields').innerHTML='<div class="field"><label>Bedrag (€)</label><input id="sv-amount" type="number" min="1" step="1" placeholder="0"></div><div class="field"><label>Notitie (optioneel)</label><input id="sv-note" placeholder="bijv. Maandelijkse bijdrage"></div><div class="field"><label>Wie?</label><div class="assignee-row"><button type="button" class="assignee-chip active" id="sv-shane" data-svwho="Shane">Shane</button><button type="button" class="assignee-chip" id="sv-esra" data-svwho="Esra">Esra</button></div></div><div class="field"><label>Datum</label><input id="sv-date" type="date" value="'+todayStr()+'"></div>';
  document.getElementById('add-overlay').classList.add('open');
  document.getElementById('add-overlay').dataset.svGoal=goalId;
  document.getElementById('add-overlay').dataset.svType=type;
  setTimeout(function(){document.querySelectorAll('[data-svwho]').forEach(function(btn){btn.onclick=function(){document.querySelectorAll('[data-svwho]').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');};});var amt=document.getElementById('sv-amount');if(amt)amt.focus();},200);
}

function saveSavingsTransaction() {
  if(!window.FinanceStore)return;
  var overlay=document.getElementById('add-overlay');
  var goalId=overlay.dataset.svGoal,type=overlay.dataset.svType;
  var g=savingsGoals.find(function(x){return x.id===goalId;});if(!g){closeAdd();return;}
  var amount=parseFloat((document.getElementById('sv-amount')||{}).value)||0;
  var note=(document.getElementById('sv-note')||{}).value||'';
  var date=(document.getElementById('sv-date')||{}).value||todayStr();
  var whoBtn=document.querySelector('[data-svwho].active');
  var who=whoBtn?whoBtn.dataset.svwho:myName;
  if(amount<=0){showToast('Vul een bedrag in');return;}
  if(type==='withdrawal'&&amount>g.saved){showToast('Je kunt niet meer opnemen dan gespaard (€ '+g.saved+')');return;}

  FinanceStore.addSavingsTransaction(goalId,{date:date,amount:amount,type:type,note:note,who:who}).then(function(){
    closeAdd();
    var typeLabel=type==='deposit'?'stortte':'nam op';
    addActivity('💰','#dbeafe',who+' '+typeLabel+' € '+amount.toFixed(0)+' bij "'+g.name+'"');
    if(window.NotificationStore){
      NotificationStore.publishSelf('finance.savings.updated',{
        icon:'💰',bg:'#dbeafe',title:g.icon+' '+g.name,
        body:who+' '+(type==='deposit'?'+':'-')+'€ '+amount.toFixed(0)+(note?' — '+note:''),
        entity:{type:'savingsGoal',id:String(g.id)},
        data:{goalId:String(g.id),transactionType:type,amount:amount,who:who,date:date}
      }).catch(function(err){console.error('[Finance notification]',err);});
    }
    var projectedSaved=type==='deposit'?g.saved+amount:Math.max(0,g.saved-amount);
    if(projectedSaved>=g.target){queueUnlock({icon:g.icon,type:'🎯 Spaardoel bereikt!',title:g.name,desc:'€ '+g.target.toLocaleString('nl-NL')+' gespaard!',who:who,confetti:true});awardXP(25,'Spaardoel bereikt');}
    awardXP(2,'Spaartransactie');
    showToast((type==='deposit'?'💰 Storting':'📤 Opname')+' van € '+amount.toFixed(0)+' geregistreerd');
  });
}

function openSavingsGoalSheet(editId) {
  var g=editId?savingsGoals.find(function(x){return x.id===editId;}):null;
  currentAddType='savings_goal';
  document.getElementById('sheet-title').textContent=g?'✏️ Doel bewerken':'🎯 Nieuw spaardoel';
  document.getElementById('sheet-fields').innerHTML='<div class="field"><label>Naam</label><input id="sg-name" placeholder="bijv. Vakantie" value="'+(g?g.name:'')+'"></div><div class="field"><label>Doelbedrag (€)</label><input id="sg-target" type="number" min="1" placeholder="0" value="'+(g?g.target:'')+'"></div><div class="field"><label>Pictogram</label><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px" id="sg-icons">'+GOAL_ICONS.map(function(ic){return '<button type="button" data-ic="'+ic+'" style="font-size:22px;padding:6px 8px;border-radius:10px;border:2px solid '+(g&&g.icon===ic?'var(--c-primary)':'var(--c-border)')+';background:var(--c-surface);cursor:pointer">'+ic+'</button>';}).join('')+'</div></div><div class="field"><label>Kleur</label><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px" id="sg-colors">'+['#2d5a27','#1a6fa8','#7c3aed','#c0547a','#d97706','#dc2626','#059669','#0891b2'].map(function(col){return '<button type="button" data-col="'+col+'" style="width:28px;height:28px;border-radius:50%;background:'+col+';border:3px solid '+(g&&g.color===col?'#333':'transparent')+';cursor:pointer"></button>';}).join('')+'</div></div>';
  document.getElementById('add-overlay').classList.add('open');
  document.getElementById('add-overlay').dataset.sgEdit=editId||'';
  setTimeout(function(){document.querySelectorAll('[data-ic]').forEach(function(btn){btn.onclick=function(){document.querySelectorAll('[data-ic]').forEach(function(b){b.style.borderColor='var(--c-border)';});btn.style.borderColor='var(--c-primary)';};});document.querySelectorAll('[data-col]').forEach(function(btn){btn.onclick=function(){document.querySelectorAll('[data-col]').forEach(function(b){b.style.borderColor='transparent';});btn.style.borderColor='#333';};});var ni=document.getElementById('sg-name');if(ni)ni.focus();},200);
}

function saveSavingsGoal() {
  if(!window.FinanceStore)return;
  var overlay=document.getElementById('add-overlay');
  var editId=overlay.dataset.sgEdit||null;
  var name=(document.getElementById('sg-name')||{}).value||'';
  var target=parseFloat((document.getElementById('sg-target')||{}).value)||0;
  var iconBtn=document.querySelector('[data-ic][style*="var(--c-primary)"]');
  var colorBtn=document.querySelector('[data-col][style*="333"]');
  var icon=iconBtn?iconBtn.dataset.ic:'🎯';
  var color=colorBtn?colorBtn.dataset.col:'var(--c-primary)';
  if(!name||target<=0){showToast('Vul naam en doelbedrag in');return;}
  var write=editId?FinanceStore.updateSavingsGoal(editId,{name:name,target:target,icon:icon,color:color}):FinanceStore.addSavingsGoal({name:name,icon:icon,target:target,who:'Beiden',color:color}).then(function(){addActivity('🎯','#dbeafe',myName+' maakte spaardoel "'+name+'" aan (€ '+target+')');awardXP(5,'Spaardoel aangemaakt');});
  write.then(function(){closeAdd();showToast((editId?'Doel opgeslagen':'Spaardoel aangemaakt')+' ✓');});
}

function deleteSavingsGoal(id) {
  if(!window.FinanceStore)return;
  if(!confirm('Spaardoel verwijderen?'))return;
  FinanceStore.deleteSavingsGoal(id).then(function(){savingsViewGoal=null;showToast('Doel verwijderd');});
}

// ============================================================
// NOTIFICATIONS
// UI reads directly from NotificationStore. No local notification array owns state.
// ============================================================
function escapeNotifText(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}

function renderNotifs(){
  var el=document.getElementById('notif-list');if(!el)return;
  if(!window.NotificationStore){
    el.innerHTML='<div style="padding:30px;text-align:center;color:var(--c-text2)">Meldingen worden geladen…</div>';
    return;
  }
  NotificationStore.ensureSubscription();
  var items=NotificationStore.list();
  var me=(window.fbUser&&fbUser.uid)||null;
  var unread=NotificationStore.unreadCount();
  var dot=document.getElementById('notif-dot');if(dot)dot.style.display=unread?'block':'none';
  el.innerHTML=items.map(function(n){
    var read=me&&n.readBy&&n.readBy[me];
    var actor=n.actor&&n.actor.name?'<span style="font-weight:700">'+escapeNotifText(n.actor.name)+'</span> · ':'';
    var time=n.createdAt?new Date(n.createdAt).toLocaleString('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';
    return '<button class="notif-item" data-notif-id="'+escapeNotifText(n.id)+'" style="width:100%;border:0;text-align:left;opacity:'+(read?'.72':'1')+'">'
      +'<div class="notif-icon" style="background:'+escapeNotifText(n.bg||'#ede9fe')+'">'+escapeNotifText(n.icon||'🔔')+'</div>'
      +'<div style="flex:1;min-width:0"><div class="notif-title">'+escapeNotifText(n.title||'Melding')+'</div>'
      +'<div class="notif-body">'+escapeNotifText(n.body||'')+'</div>'
      +'<div class="notif-time">'+actor+escapeNotifText(time)+'</div></div>'
      +(!read?'<span style="width:7px;height:7px;border-radius:50%;background:var(--c-primary);flex:0 0 auto"></span>':'')
      +'</button>';
  }).join('')||'<div style="padding:30px;text-align:center;color:var(--c-text2)">Geen meldingen</div>';

  el.querySelectorAll('[data-notif-id]').forEach(function(row){
    row.onclick=function(){NotificationStore.markRead(row.dataset.notifId).then(renderNotifs);};
  });
}

function clearNotifs(){
  if(!window.NotificationStore)return;
  NotificationStore.markAllRead().then(function(){renderNotifs();showToast('Alles gemarkeerd als gelezen');});
}

window.addEventListener('familyapp:notifications-changed',function(){
  var dot=document.getElementById('notif-dot');
  if(dot&&window.NotificationStore)dot.style.display=NotificationStore.unreadCount()?'block':'none';
  if(window._currentScreen==='notif')renderNotifs();
});
