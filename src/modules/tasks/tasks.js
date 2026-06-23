'use strict';
// ============================================================
// TAKEN
// ============================================================

function renderTasks() {
  var el=document.getElementById('task-content');if(!el)return;
  if(taskTab==='overzicht') {
    // Use v023 quest UI
    if(window.__famV023) { var _r=typeof render==='function'?render:window.famRender; if(_r){_r(true);} }
  }
  else if(taskTab==='persoon') renderTasksPersoon(el);
}

function setTaskTab(tab, btn) {
  taskTab=tab;
  document.querySelectorAll('.ttab').forEach(function(b){b.classList.remove('active');});
  if(btn) btn.classList.add('active');
  renderTasks();
}

function toggleTask(id) {
  var t=taskData.find(function(x){return x.id===id;});
  if(!t)return;
  var el=document.getElementById('ck-'+id);
  t.done=!t.done;
  if(el){
    el.classList.toggle('done',t.done);
    el.innerHTML=t.done?'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>':'';
    if(t.done) spawnParticles(el);
  }
  // Re-render after short delay to let animation show
  AppState.save();
  setTimeout(function(){renderTasks();updateStats();},150);
  if(t.done) {
    awardXP(4,'Taak');
    addActivity('✅','#e8f5e3',myName+' voltooide "'+t.title+'"');
  }
}

function deleteTask(id) {
  var i=taskData.findIndex(function(t){return t.id===id;});
  if(i>-1){taskData.splice(i,1);AppState.save();renderTasks();updateStats();}
}

function renderTasksOverzicht(el) {
  // Redirected to v023 quest UI
  if(window.__famV023) { var _r=typeof render==='function'?render:window.famRender; if(_r){ _r(true); } }
}

function renderTasksTerugkerend(el) {
  var now = new Date();
  var todayNum = now.getDay();
  var weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((todayNum+6)%7));
  weekStart.setHours(0,0,0,0);
  var months = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
  var ws = weekStart.getDate()+' '+months[weekStart.getMonth()];
  var weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate()+6);
  var we = weekEnd.getDate()+' '+months[weekEnd.getMonth()];
  var dateRange = ws+' \u2013 '+we;
  if(!window.fqRecurView) window.fqRecurView = 'Wekelijks';
  var weekTasks = taskData.filter(function(t){
    if(!t.date) return false;
    var d = new Date(t.date+'T00:00:00');
    return d >= weekStart && d <= weekEnd;
  });
  var doneCnt = weekTasks.filter(function(t){return t.done;}).length;
  var totalCnt = weekTasks.length || 1;
  var pct = Math.round(doneCnt/totalCnt*100);
  var motiv = doneCnt===0 ? 'Laten we beginnen! \uD83D\uDCAA' : doneCnt < totalCnt ? 'Goed bezig! \uD83D\uDCAA' : 'Alles klaar! \uD83C\uDF89';
  var circ = 201.06;
  var dash = circ*(1-pct/100);
  var h = '<div style="padding:14px 14px 100px;background:transparent;">';
  h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;position:relative;">';
  h += '<div><div id="fqRecurTitle" onclick="fqToggleRecurView(this)" style="font-size:22px;font-weight:950;color:#111827;letter-spacing:-.4px;cursor:pointer;display:flex;align-items:center;gap:6px;">'+window.fqRecurView+'e taken <span style="font-size:16px;">&#8964;</span></div>';
  h += '<div style="font-size:13px;color:#667085;font-weight:700;margin-top:2px;">'+dateRange+' &#8250;</div></div>';
  h += '<button onclick="fqScrollToToday()" style="border:1.5px solid #111827;background:transparent;border-radius:99px;padding:8px 16px;font-size:13px;font-weight:850;cursor:pointer;color:#111827;white-space:nowrap;">Vandaag</button></div>';
  h += '<div id="fqRecurDropdown" style="display:none;position:absolute;z-index:50;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.14);border:1px solid #edf0ec;padding:6px;width:180px;margin-top:-8px;">';
  ['Wekelijks','Maandelijks','Jaarlijks'].forEach(function(m){
    var active = m===window.fqRecurView;
    h += '<button onclick="fqSetRecurView(\''+m+'\')" style="display:block;width:100%;text-align:left;padding:10px 14px;border:none;border-radius:12px;font-size:14px;font-weight:'+(active?'900':'700')+';background:'+(active?'#edf8e9':'transparent')+';color:'+(active?'#2a7a28':'#111827')+';cursor:pointer;">'+m+'e taken</button>';
  });
  h += '</div>';
  h += '<div style="background:#fff;border:1px solid #edf0ec;border-radius:20px;padding:16px;margin-bottom:14px;display:flex;align-items:center;gap:14px;box-shadow:0 3px 12px rgba(17,24,39,.05);">';
  h += '<div style="position:relative;width:72px;height:72px;flex-shrink:0;">';
  h += '<svg width="72" height="72" viewBox="0 0 72 72" style="transform:rotate(-90deg)"><circle cx="36" cy="36" r="32" fill="none" stroke="#e5e7eb" stroke-width="7"/><circle cx="36" cy="36" r="32" fill="none" stroke="#3f7f2f" stroke-width="7" stroke-linecap="round" stroke-dasharray="'+circ+'" stroke-dashoffset="'+dash+'"/></svg>';
  h += '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;"><span style="font-size:15px;font-weight:950;color:#111827;line-height:1;">'+doneCnt+'/'+totalCnt+'</span><span style="font-size:10px;color:#667085;font-weight:700;">voltooid</span></div></div>';
  h += '<div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:900;color:#111827;margin-bottom:6px;">'+motiv+'</div>';
  h += '<div style="height:6px;background:#e5e7eb;border-radius:99px;overflow:hidden;margin-bottom:5px;"><div style="height:100%;width:'+pct+'%;background:#3f7f2f;border-radius:99px;"></div></div>';
  h += '<div style="font-size:12px;color:#667085;font-weight:700;">'+(totalCnt-doneCnt)+' taken te gaan</div></div>';
  h += '<div style="font-size:38px;flex-shrink:0;">\uD83E\uDEB4</div></div>';
  var dayAbbr=['MA','DI','WO','DO','VR','ZA','ZO'];
  for(var i=0;i<7;i++){
    var dayDate = new Date(weekStart); dayDate.setDate(weekStart.getDate()+i);
    var isToday = dayDate.toDateString()===now.toDateString();
    var dateStr = dayDate.toISOString().split('T')[0];
    var dayTasks = taskData.filter(function(t){return t.date===dateStr;});
    var bg = isToday?'#f0fdf4':'#fff';
    var bl = isToday?'border-left:4px solid #3f7f2f;':'border-left:4px solid transparent;';
    h += '<div id="fqDay-'+i+'" style="background:'+bg+';border:1px solid #edf0ec;'+bl+'border-radius:16px;margin-bottom:8px;">';
    if(!dayTasks.length){
      h += '<div style="display:flex;align-items:center;gap:12px;padding:13px 14px;">';
      h += '<div style="width:36px;text-align:center;"><div style="font-size:11px;font-weight:900;color:'+(isToday?'#3f7f2f':'#9aa3af')+';letter-spacing:.3px;">'+dayAbbr[i]+'</div><div style="font-size:17px;font-weight:950;color:'+(isToday?'#3f7f2f':'#111827')+';">'+dayDate.getDate()+'</div></div>';
      h += '<div style="flex:1;font-size:13px;color:#c5cbd3;font-style:italic;">Vrije dag</div></div>';
    } else {
      var dI = i;
      dayTasks.forEach(function(t,ti){
        h += '<div style="display:flex;align-items:center;gap:11px;padding:'+(ti===0?'13px 13px 9px':'4px 13px 9px')+';cursor:pointer;">';
        if(ti===0){
          h += '<div style="width:36px;flex-shrink:0;text-align:center;"><div style="font-size:11px;font-weight:900;color:'+(isToday?'#3f7f2f':'#9aa3af')+';letter-spacing:.3px;">'+dayAbbr[dI]+'</div><div style="font-size:17px;font-weight:950;color:'+(isToday?'#3f7f2f':'#111827')+';">'+dayDate.getDate()+'</div></div>';
        } else {
          h += '<div style="width:36px;flex-shrink:0;"></div>';
        }
        h += '<div onclick="event.stopPropagation();toggleTask('+t.id+')" style="width:28px;height:28px;border-radius:50%;border:2px solid '+(t.done?'#3f7f2f':'#d1d5db')+';background:'+(t.done?'#3f7f2f':'transparent')+';display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;" id="ck-'+t.id+'">';
        if(t.done) h += '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
        h += '</div>';
        h += '<div style="flex:1;min-width:0;">';
        h += '<div style="font-size:15px;font-weight:'+(t.done?'700':'850')+';color:'+(t.done?'#9aa3af':'#111827')+';text-decoration:'+(t.done?'line-through':'none')+';display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'+t.title;
        if(isToday&&!t.done) h += '<span style="font-size:10px;font-weight:900;background:#f0fdf4;color:#3f7f2f;padding:2px 7px;border-radius:99px;">Vandaag</span>';
        h += '</div>';
        if(t.assigned&&t.assigned.length>1){
          var avH='<div style="display:flex;margin-top:3px;">';
          var aColors={'SK':'#3f7f2f','JD':'#6d28d9','ES':'#ec4899','SH':'#f97316'};
          t.assigned.forEach(function(a){avH+='<div style="width:20px;height:20px;border-radius:50%;background:'+(aColors[a]||'#6d28d9')+';border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:900;color:#fff;margin-right:-4px;">'+a+'</div>';});
          avH+='</div>';
          h+=avH;
        }
        h += '</div>';
        var ac_map={'SK':'#3f7f2f','JD':'#6d28d9','ES':'#ec4899','SH':'#f97316'};
        var av=(t.assigned&&t.assigned[0])||'SK';
        h += '<div style="width:28px;height:28px;border-radius:50%;background:'+(ac_map[av]||'#3f7f2f')+';display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:#fff;flex-shrink:0;">'+av+'</div>';
        h += '<div style="font-size:18px;color:#c5cbd3;">&#8250;</div>';
        h += '</div>';
        if(ti<dayTasks.length-1) h+='<div style="height:1px;background:#f3f4f6;margin:0 13px 0 61px;"></div>';
      });
    }
    h += '</div>';
  }
  h += '<div style="display:flex;gap:10px;align-items:center;padding:4px 0 16px;">';
  h += '<button onclick="openAdd(\'task\')" style="flex:1;border:none;border-radius:99px;padding:15px;font-size:15px;font-weight:900;background:#3f7f2f;color:#fff;box-shadow:0 7px 20px rgba(63,127,47,.26);cursor:pointer;">+ Taak toevoegen</button>';
  h += '<button style="width:50px;height:50px;border-radius:50%;border:none;background:#6d28d9;color:#fff;font-size:20px;cursor:pointer;box-shadow:0 7px 18px rgba(109,40,217,.28);">&#10022;</button>';
  h += '</div></div>';
  el.innerHTML = h;
}

function fqToggleRecurView(btn){
  var dd=document.getElementById('fqRecurDropdown');
  if(!dd)return;
  dd.style.display=dd.style.display==='none'?'block':'none';
  var rect=(btn||document.getElementById('fqRecurTitle')).getBoundingClientRect();
  dd.style.top=(rect.bottom+window.scrollY+4)+'px';
  dd.style.left=(rect.left+window.scrollX)+'px';
}

function fqSetRecurView(v){
  window.fqRecurView=v;
  var dd=document.getElementById('fqRecurDropdown');
  if(dd) dd.style.display='none';
  var el=document.getElementById('task-content');
  if(el) renderTasksTerugkerend(el);
}

function fqScrollToToday(){
  var todayIdx=((new Date().getDay()+6)%7);
  var el=document.getElementById('fqDay-'+todayIdx);
  if(el) el.scrollIntoView({behavior:'smooth',block:'center'});
}


function renderTasksWeek(el) {
  var days=['maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag','zondag'];
  var today=todayName();
  var html='<div style="display:flex;overflow-x:auto;gap:8px;padding:12px 16px">';
  days.forEach(function(day){
    var isToday=day===today;
    var tasks=taskData.filter(function(t){
      if(!t.date)return false;
      var d=new Date(t.date+'T00:00:00');
      return ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'][d.getDay()]===day;
    });
    html+='<div style="flex-shrink:0;width:140px;background:'+(isToday?'#e8f5e3':'#fff')+';border-radius:12px;padding:10px;border:.5px solid '+(isToday?'#2d5a27':'#e8e5e0')+'">';
    html+='<div style="font-size:11px;font-weight:700;color:'+(isToday?'#2d5a27':'#aaa')+';margin-bottom:8px;text-transform:uppercase">'+day.slice(0,2).toUpperCase()+(isToday?' ✓':'')+'</div>';
    if(tasks.length) {
      tasks.forEach(function(t){
        html+='<div style="font-size:12px;padding:5px 0;border-bottom:.5px solid #f0ede8;display:flex;gap:6px;align-items:center">'
          +'<div class="check-sq '+(t.done?'done':'')+'" id="ck-'+t.id+'" onclick="toggleTask('+t.id+')" style="width:16px;height:16px;cursor:pointer;flex-shrink:0">'
          +(t.done?'<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>':'')
          +'</div>'
          +'<span style="color:'+(t.done?'#bbb':'#333')+';text-decoration:'+(t.done?'line-through':'none')+'">'+t.title+'</span>'
          +'</div>';
      });
    } else {
      html+='<div style="font-size:11px;color:#ccc;text-align:center;padding:10px 0">Vrij</div>';
    }
    html+='</div>';
  });
  html+='</div>';
  html+='<div style="padding:0 16px 16px;text-align:center">'
    +'<button onclick="openAdd(\'task\')" style="background:#2d5a27;color:#fff;border:none;border-radius:20px;padding:10px 24px;font-size:14px;font-weight:600">+ Taak toevoegen</button>'
    +'</div>';
  el.innerHTML=html;
}

function renderTasksVast(el) {
  var wk=getWk();
  var mk=getMk();
  var today=todayName();
  var wom=weekOfMonth();

  function isDoneWeekly(r){return r.days.every(function(d){return (r.doneWeek[wk]||[]).indexOf(d)>-1;});}
  function isDoneMonthly(r){return !!(r.doneDates&&r.doneDates[mk]);}
  function isDone(r){return r.freq==='weekly'?isDoneWeekly(r):isDoneMonthly(r);}
  function isMonthDue(r){
    if(r.freq==='monthly1')return r.week===wom;
    if(r.freq==='monthly2')return (r.weeks||[r.week,r.week+2]).indexOf(wom)>-1;
    return false;
  }

  var weekly=recurData.filter(function(r){return r.freq==='weekly';});
  var monthly=recurData.filter(function(r){return r.freq!=='weekly';});
  var total=recurData.length;
  var done=recurData.filter(isDone).length;
  var pct=total?Math.round(done/total*100):0;

  var html='<div style="padding:12px 16px 4px">'
    +'<div style="height:6px;background:#f0ede8;border-radius:3px;overflow:hidden;margin-bottom:6px">'
    +'<div style="height:100%;background:#2d5a27;border-radius:3px;width:'+pct+'%;transition:width .3s"></div>'
    +'</div>'
    +'<div style="font-size:12px;color:#888">'+done+'/'+total+' gedaan deze week</div>'
    +'</div>'
    +'<div style="padding:8px 16px 4px;font-size:11px;font-weight:700;color:#2d5a27;text-transform:uppercase;letter-spacing:.5px">Wekelijks</div>';

  // Today's tasks first
  var todayRec=weekly.filter(function(r){return r.days.indexOf(today)>-1;});
  var otherRec=weekly.filter(function(r){return r.days.indexOf(today)===-1;});

  function recCardHTML(r) {
    var isMonthly=r.freq!=='weekly';
    var done2=isDone(r);
    var doneDays=(!isMonthly&&r.doneWeek[wk])||[];
    var totalDays=!isMonthly?r.days.length:1;
    var donePct=totalDays?Math.round(doneDays.length/totalDays*100):(done2?100:0);
    var freqTxt=r.freqLabel||(r.days?r.days.map(function(d){return d.slice(0,2);}).join(', '):'');
    var due=isMonthly?isMonthDue(r):true;
    return '<div class="rec-card" style="'+(isMonthly&&!due?'opacity:.4':'')+'"><div class="rec-card-top">'
      +'<div class="check-circle '+(done2?'done':'')+'" id="rck-'+r.id+'" onclick="toggleRec(\''+r.id+'\')" style="cursor:pointer">'
      +(done2?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>':'')
      +'</div>'
      +'<div class="rec-body">'
      +'<div class="rec-title'+(done2?' done':'')+'">'+r.title+'</div>'
      +'<div class="rec-meta">'
      +whoTag(r.who)
      +'<span class="rec-badge '+(isMonthly?'rec-badge-month':'rec-badge-week')+'">🔁 '+freqTxt+'</span>'
      +(r.streak>1?'<span class="rec-streak">🔥 '+r.streak+'x</span>':'')
      +'</div>'
      +(!isMonthly&&r.days.length?'<div class="rec-day-pills">'
        +r.days.map(function(d){
          var isT=d===today;
          var isDoneDay=(doneDays.indexOf(d)>-1);
          return '<span class="rec-day-pill'+(isT?' today':'')+(isDoneDay?' done-day':'')+'" onclick="toggleRecDay(\''+r.id+'\',\''+d+'\')">'
            +d.slice(0,2)+(isDoneDay?' ✓':'')+'</span>';
        }).join('')
        +'</div>':'')
      +'</div>'
      +'<button class="rec-edit-btn" onclick="editRec(\''+r.id+'\')">✏️</button>'
      +'</div>'
      +'<div class="rec-progress"><div class="rec-progress-fill" style="width:'+donePct+'%"></div></div>'
      +'</div>';
  }

  if(todayRec.length) {
    html+='<div style="padding:6px 16px 4px;font-size:11px;font-weight:700;color:#2d5a27;text-transform:uppercase">'+today+' · Vandaag</div>';
    todayRec.forEach(function(r){html+=recCardHTML(r);});
  }
  ['maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag','zondag'].forEach(function(day){
    if(day===today)return;
    var dayRec=otherRec.filter(function(r){return r.days.indexOf(day)>-1;});
    if(!dayRec.length)return;
    html+='<div style="padding:6px 16px 4px;font-size:11px;font-weight:700;color:#bbb;text-transform:uppercase">'+day+'</div>';
    dayRec.forEach(function(r){html+=recCardHTML(r);});
  });
  if(monthly.length) {
    html+='<div style="padding:12px 16px 4px;font-size:11px;font-weight:700;color:#3a5fb0;text-transform:uppercase;letter-spacing:.5px">🗓 Maandelijks</div>';
    monthly.forEach(function(r){html+=recCardHTML(r);});
  }
  html+='<div style="padding:16px">'
    +'<div style="display:flex;gap:8px">'
    +'<button onclick="openAdd(\'task\')" style="flex:1;background:#2d5a27;color:#fff;border:none;border-radius:20px;padding:10px;font-size:13px;font-weight:600">+ Vaste taak</button>'
    +'<button onclick="resetRec()" style="background:#f7f5f0;color:#555;border:none;border-radius:20px;padding:10px 16px;font-size:13px;font-weight:600">↺ Reset</button>'
    +'</div></div>';
  el.innerHTML=html;
}

function toggleRec(id) {
  var r=recurData.find(function(x){return x.id===id;});if(!r)return;
  var wk=getWk();var mk=getMk();
  var isMonthly=r.freq!=='weekly';
  var el=document.getElementById('rck-'+id);
  if(isMonthly){
    if(!r.doneDates)r.doneDates={};
    if(r.doneDates[mk]){delete r.doneDates[mk];}
    else{r.doneDates[mk]=true;r.streak=(r.streak||0)+1;awardXP(6,'Vaste taak');tryAwardTaskSkill(r.who&&r.who[0]?r.who[0]:myName,r.title);addActivity('✅','#e8f5e3',myName+' voltooide "'+r.title+'"');}
  } else {
    if(!r.doneWeek)r.doneWeek={};
    var allDone=r.days.every(function(d){return (r.doneWeek[wk]||[]).indexOf(d)>-1;});
    if(allDone){r.doneWeek[wk]=[];}
    else{r.doneWeek[wk]=[...r.days];r.streak=(r.streak||0)+1;awardXP(6,'Vaste taak');tryAwardTaskSkill(r.who&&r.who[0]?r.who[0]:myName,r.title);addActivity('✅','#e8f5e3',myName+' voltooide "'+r.title+'"');}
  }
  if(el) themeParticles(el);
  setTimeout(function(){renderTasks();},150);
}

function toggleRecDay(id, day) {
  var r=recurData.find(function(x){return x.id===id;});if(!r)return;
  var wk=getWk();
  if(!r.doneWeek)r.doneWeek={};
  if(!r.doneWeek[wk])r.doneWeek[wk]=[];
  var idx=r.doneWeek[wk].indexOf(day);
  if(idx>-1)r.doneWeek[wk].splice(idx,1);
  else{r.doneWeek[wk].push(day);myXP+=2;}
  if(r.days.every(function(d){return r.doneWeek[wk].indexOf(d)>-1;})){
    r.streak=(r.streak||0)+1;
    addActivity('✅','#e8f5e3',myName+' voltooide "'+r.title+'"');
  }
  renderTasks();
}

function resetRec() {
  var wk=getWk();
  recurData.forEach(function(r){r.doneWeek[wk]=[];});
  renderTasks();
  showToast('Week gereset ↺');
}

function editRec(id) {
  var r=recurData.find(function(x){return x.id===id;});if(!r)return;
  showToast('Bewerken: '+r.title+' (binnenkort beschikbaar)');
}

function renderTasksPersoon(el) {
  if(!el) return;
  var raw = localStorage.getItem('fam_tasks_v023')||localStorage.getItem('fam_tasks_v022')||'[]';
  var allTasks; try { allTasks=JSON.parse(raw)||[]; } catch(e){ allTasks=[]; }

  // Namen ophalen
  var myName    = localStorage.getItem('familyapp-profile-name-v1')||'Shane';
  var partName  = localStorage.getItem('familyapp-partner-name-v1')||'Esra';

  // Avatars ophalen
  function getAvatar(name) {
    if(name.toLowerCase()===myName.toLowerCase()) {
      var url = localStorage.getItem('familyapp-current-user-avatar-v1');
      if(url) return url;
    }
    var stored = localStorage.getItem('fam_avatar_'+name.toLowerCase());
    if(stored) return stored;
    return null;
  }

  var accentColors = {};
  accentColors[myName]   = '#2563eb';
  accentColors[partName] = '#ec4899';

  function xpFromString(xpStr) {
    if(!xpStr) return 0;
    var m = String(xpStr).match(/(\d+)/);
    return m ? parseInt(m[1]) : 0;
  }

  function statsForPerson(name) {
    var tasks = allTasks.filter(function(x){ return x[5]&&(x[5]==='Beiden'||x[5].indexOf(name)>-1); });
    var done  = tasks.filter(function(x){ return x[9]; });
    var open  = tasks.filter(function(x){ return !x[9]; });
    var totalXP = done.reduce(function(sum,x){ return sum+xpFromString(x[6]); }, 0);
    var raids   = tasks.filter(function(x){ return x[1]&&x[1].indexOf('RAID')>-1; }).length;
    var dungeons= tasks.filter(function(x){ return x[1]&&x[1].indexOf('DUNGEON')>-1; }).length;
    var pct     = tasks.length ? Math.round(done.length/tasks.length*100) : 0;
    // Simpel level: elke 100xp = 1 level
    var level   = Math.max(1, Math.floor(totalXP/100)+1);
    return { tasks:tasks, done:done, open:open, totalXP:totalXP, raids:raids, dungeons:dungeons, pct:pct, level:level };
  }

  var people = [myName, partName];
  var html = '<div class="fq" style="padding-bottom:100px;">';

  people.forEach(function(person, pi) {
    var s      = statsForPerson(person);
    var color  = accentColors[person]||'#667085';
    var avatarUrl = getAvatar(person);
    var initials  = person.slice(0,2).toUpperCase();

    html += '<div style="padding:18px 16px 12px;">';

    // ── Hero header ──
    html += '<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">';
    // Avatar
    if(avatarUrl) {
      html += '<img src="'+avatarUrl+'" style="width:56px;height:56px;border-radius:50%;object-fit:cover;object-position:50% 36%;border:2.5px solid '+color+';flex-shrink:0;" onerror="this.style.display=\'none\'">';
    } else {
      html += '<div style="width:56px;height:56px;border-radius:50%;background:'+color+';display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;flex-shrink:0;border:2.5px solid '+color+';">'+initials+'</div>';
    }
    // Naam + level
    html += '<div style="flex:1;">';
    html += '<div style="font-size:19px;font-weight:950;color:#111827;letter-spacing:-.3px;">'+person+'</div>';
    html += '<div style="font-size:12px;color:'+color+';font-weight:800;margin-top:2px;">⚔️ Level '+s.level+' Avonturier</div>';
    html += '</div>';
    // XP badge
    html += '<div style="background:'+color+';color:#fff;border-radius:12px;padding:8px 14px;text-align:center;flex-shrink:0;">';
    html += '<div style="font-size:18px;font-weight:950;">'+s.totalXP+'</div>';
    html += '<div style="font-size:10px;font-weight:800;opacity:.85;">XP</div>';
    html += '</div>';
    html += '</div>';

    // ── Progress bar ──
    html += '<div style="background:#edf0ec;border-radius:99px;height:8px;margin-bottom:16px;overflow:hidden;">';
    html += '<div style="height:100%;width:'+s.pct+'%;background:'+color+';border-radius:99px;transition:.4s;"></div>';
    html += '</div>';

    // ── Stat cards ──
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;">';
    var stats = [
      {label:'Quests', val:s.tasks.length, icon:'📋'},
      {label:'Voltooid', val:s.done.length, icon:'✅'},
      {label:'Raids', val:s.raids, icon:'⚔️'},
      {label:'Dungeons', val:s.dungeons, icon:'🏰'},
    ];
    stats.forEach(function(st) {
      html += '<div style="background:#fff;border:1px solid #edf0ec;border-radius:14px;padding:10px 6px;text-align:center;box-shadow:0 2px 8px rgba(17,24,39,.04);">';
      html += '<div style="font-size:18px;">'+st.icon+'</div>';
      html += '<div style="font-size:17px;font-weight:950;color:#111827;margin-top:2px;">'+st.val+'</div>';
      html += '<div style="font-size:10px;color:#9aa7bd;font-weight:700;margin-top:1px;">'+st.label+'</div>';
      html += '</div>';
    });
    html += '</div>';

    // ── Open quests ──
    if(s.open.length > 0) {
      html += '<div style="font-size:13px;font-weight:900;color:#667085;letter-spacing:.4px;text-transform:uppercase;margin-bottom:8px;">Open quests</div>';
      s.open.forEach(function(x) {
        var isRaid=x[1]&&x[1].indexOf('RAID')>-1;
        var isDung=x[1]&&x[1].indexOf('DUNGEON')>-1;
        var cls=isRaid?'raid':(isDung?'dungeon':'');
        html += '<div class="fqCard '+cls+'" data-id="'+x[0]+'" style="margin-bottom:10px;cursor:pointer;" onclick="if(window.famDetail)famDetail(\''+x[0]+'\')">';
        html += '<div class="fqImg" style="background-image:url('+x[7]+')"><div class="fqChk"></div></div>';
        html += '<div class="fqBody">';
        html += '<div class="fqBadges"><span class="fqBadge '+(isRaid?'raid':(isDung?'dungeon':'side'))+'">'+x[1]+'</span></div>';
        html += '<div class="fqTitle">'+x[2]+'</div>';
        html += '<div class="fqMeta"><span class="fqMetaTag">📅 '+(x[11]||x[4])+'</span><span class="fqMetaTag xp">'+x[6]+'</span></div>';
        html += '</div><div class="fqArrow">›</div></div>';
      });
    } else {
      html += '<div style="text-align:center;padding:16px;color:#9aa7bd;font-size:14px;font-weight:700;">🎉 Alle quests voltooid!</div>';
    }

    html += '</div>';
    if(pi < people.length-1) html += '<div style="height:1px;background:#edf0ec;margin:0 16px 4px;"></div>';
  });

  html += '</div>';
  el.innerHTML = html;
}

