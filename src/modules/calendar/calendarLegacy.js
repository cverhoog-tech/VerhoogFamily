'use strict';
// ============================================================
// AGENDA
// ============================================================

function renderCal(){
  var el=document.getElementById('cal-grid');if(!el)return;
  var monthNames=['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December'];
  document.getElementById('cal-month').textContent=monthNames[calMonth]+' '+calYear;

  var dayNames=['Ma','Di','Wo','Do','Vr','Za','Zo'];
  var html=dayNames.map(function(d){return '<div class="cal-day-head">'+d+'</div>';}).join('');

  var first=new Date(calYear,calMonth,1);
  var startDow=(first.getDay()||7)-1;
  var daysInMonth=new Date(calYear,calMonth+1,0).getDate();
  var prevDays=new Date(calYear,calMonth,0).getDate();
  var today=new Date().toISOString().split('T')[0];

  for(var i=0;i<startDow;i++){
    var d=prevDays-startDow+1+i;
    html+='<div class="cal-day other-month">'+d+'</div>';
  }
  for(var d=1;d<=daysInMonth;d++){
    var dateStr=calYear+'-'+(calMonth+1<10?'0':'')+(calMonth+1)+'-'+(d<10?'0':'')+d;
    var isToday=dateStr===today;
    var hasEvent=calData.some(function(e){return e.date===dateStr;});
    var isSel=calSelDay===dateStr;
    html+='<div class="cal-day'+(isToday?' today':'')+(hasEvent?' has-event':'')+(isSel?' sel':'')+'" onclick="selectDay(\''+dateStr+'\')" style="'+(isSel&&!isToday?'background:#e8f5e3;':'')+'">'+d+'</div>';
  }
  var total=startDow+daysInMonth;
  var remaining=(7-total%7)%7;
  for(var i=1;i<=remaining;i++){html+='<div class="cal-day other-month">'+i+'</div>';}
  el.innerHTML=html;
  renderCalEvents();
}

function selectDay(d){
  calSelDay=d;renderCal();
  var lbl=document.getElementById('cal-sel-label');
  if(lbl)lbl.textContent=new Date(d+'T00:00:00').toLocaleDateString('nl-NL',{weekday:'long',day:'numeric',month:'long'});
}

function renderCalEvents(){
  var el=document.getElementById('cal-events');if(!el)return;
  var allEvents = calData.concat(importedCalEvents||[]);
  var events=calSelDay?allEvents.filter(function(e){return e.date===calSelDay;}):allEvents.slice().sort(function(a,b){return (a.date||'').localeCompare(b.date||'');});
  if(!events.length){
    el.innerHTML='<div style="padding:16px;color:var(--c-text3);font-size:13px;text-align:center">'+(calSelDay?'Geen afspraken op deze dag':'Tik op een dag om afspraken te zien')+'</div>';
    return;
  }
  el.innerHTML=events.map(function(e){
    var whoLabel = e.who && e.who !== 'imported' ? ' · <span style="font-size:11px;font-weight:700;color:'+(e.who==='Shane'?'var(--c-primary)':'var(--c-partner)')+'">'+e.who+'</span>' : '';
    var importBadge = e._imported ? ' <span style="font-size:9px;background:#dbeafe;color:#1d4ed8;padding:1px 5px;border-radius:6px;font-weight:700">IMPORT</span>' : '';
    return '<div class="cal-event" style="position:relative">'
      +'<div class="cal-event-color" style="background:'+e.color+'"></div>'
      +'<div style="flex:1"><div style="font-size:14px;font-weight:600;color:var(--c-text)">'+e.title+importBadge+'</div>'
      +'<div style="font-size:12px;color:var(--c-text2);margin-top:2px">'+(e.time||'Hele dag')+' · '+formatDate(e.date)+whoLabel+'</div>'
      +'</div>'
      +'<button onclick="deleteCalEvent('+e.id+')" style="background:none;border:none;color:var(--c-text3);font-size:16px;padding:4px;cursor:pointer;flex-shrink:0">🗑</button>'
      +'</div>';
  }).join('');
}

var importedCalEvents = [];

function deleteCalEvent(id) {
  calData = calData.filter(function(e){return e.id!==id;});
  renderCal();
}


function changeCal(dir){
  calMonth+=dir;
  if(calMonth<0){calMonth=11;calYear--;}
  if(calMonth>11){calMonth=0;calYear++;}
  renderCal();
}

function toggleCalSync() {
  var panel = document.getElementById('cal-sync-panel');
  var arrow = document.getElementById('cal-sync-arrow');
  if(!panel) return;
  var open = panel.style.display !== 'none';
  panel.style.display = open ? 'none' : 'block';
  if(arrow) arrow.textContent = open ? '›' : '‹';

  if(!open) {
    // Populate saved URLs
    var shaneUrl = localStorage.getItem('familie_ics_shane') || '';
    var esraUrl  = localStorage.getItem('familie_ics_esra')  || '';
    var si = document.getElementById('ics-url-shane');
    var ei = document.getElementById('ics-url-esra');
    if(si) si.value = shaneUrl;
    if(ei) ei.value = esraUrl;

    // Wire ICS import input
    var imp = document.getElementById('ics-import-inp');
    if(imp && !imp._wired) {
      imp._wired = true;
      imp.onchange = function(e) {
        var file = e.target.files[0]; if(!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) { importICS(ev.target.result); };
        reader.readAsText(file);
        imp.value = '';
      };
    }
  }
}

// ── ICS EXPORT ──
function exportICS(who) {
  var events = who === 'all'
    ? calData
    : calData.filter(function(e){ return !e.who || e.who === who; });

  var lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FamilieApp//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:FamilieApp' + (who !== 'all' ? ' - ' + who : ''),
  ];

  events.forEach(function(ev) {
    var dt = (ev.date || todayStr()).replace(/-/g,'');
    var uid = 'familieapp-' + ev.id + '@familie.app';
    var dtStamp = new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + uid);
    lines.push('DTSTAMP:' + dtStamp);
    lines.push('DTSTART;VALUE=DATE:' + dt);
    lines.push('DTEND;VALUE=DATE:' + dt);
    lines.push('SUMMARY:' + (ev.title || '').replace(/\n/g,'\\n'));
    if(ev.time) lines.push('DESCRIPTION:' + ev.time);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  var icsContent = lines.join('\r\n');
  var blob = new Blob([icsContent], {type: 'text/calendar;charset=utf-8'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'familieapp' + (who !== 'all' ? '-' + who.toLowerCase() : '') + '.ics';
  a.click();
  URL.revokeObjectURL(url);
  showToast('📅 Agenda geëxporteerd als .ics');
}

// ── ICS IMPORT ──
function importICS(text) {
  var status = document.getElementById('ics-import-status');
  var imported = 0;
  var events = text.split('BEGIN:VEVENT');
  events.shift(); // remove header

  events.forEach(function(block) {
    var getField = function(name) {
      var match = block.match(new RegExp(name + '[^:]*:([^\r\n]+)'));
      return match ? match[1].trim() : '';
    };

    var summary = getField('SUMMARY').replace(/\\n/g,'\n').replace(/\\,/g,',');
    var dtStart = getField('DTSTART');
    var dtEnd   = getField('DTEND');

    // Parse date — handle YYYYMMDD and YYYYMMDDTHHMMSSZ formats
    var dateStr = '';
    var timeStr = '';
    if(dtStart) {
      var d = dtStart.replace(/[TZ].*/, '').replace(/;VALUE=DATE/,'');
      if(d.length >= 8) {
        dateStr = d.substring(0,4) + '-' + d.substring(4,6) + '-' + d.substring(6,8);
      }
      if(dtStart.indexOf('T') > -1) {
        var t = dtStart.split('T')[1].replace('Z','');
        timeStr = t.substring(0,2) + ':' + t.substring(2,4);
      }
    }

    if(!summary || !dateStr) return;

    // Skip duplicates by title+date
    var exists = calData.some(function(e){
      return e.title === summary && e.date === dateStr;
    });
    if(exists) return;

    calData.push({
      id: calNextId++,
      title: summary,
      date: dateStr,
      time: timeStr,
      color: '#1a6fa8',
      who: 'imported',
      _imported: true
    });
    imported++;
  });

  renderCal();
  if(status) {
    status.innerHTML = imported > 0
      ? '<span style="color:#16a34a">✓ '+imported+' afspraak'+(imported===1?'':'en')+' geïmporteerd!</span>'
      : '<span style="color:#d97706">Geen nieuwe afspraken gevonden (duplicaten worden overgeslagen)</span>';
  }
  if(imported > 0) showToast('📅 ' + imported + ' afspraken geïmporteerd');
}

// ── ICS URL SUBSCRIBE ──
var icsUrls = {
  shane: localStorage.getItem('familie_ics_shane') || '',
  esra:  localStorage.getItem('familie_ics_esra')  || ''
};

function saveIcsUrls() {
  var si = document.getElementById('ics-url-shane');
  var ei = document.getElementById('ics-url-esra');
  var shaneUrl = si ? si.value.trim() : '';
  var esraUrl  = ei ? ei.value.trim() : '';
  icsUrls.shane = shaneUrl;
  icsUrls.esra  = esraUrl;
  localStorage.setItem('familie_ics_shane', shaneUrl);
  localStorage.setItem('familie_ics_esra',  esraUrl);

  var status = document.getElementById('ics-url-status');

  if(!shaneUrl && !esraUrl) {
    if(status) status.innerHTML = '<span style="color:#d97706">Geen URLs ingevoerd</span>';
    return;
  }

  if(status) status.innerHTML = '<span style="color:var(--c-text2)">⏳ Opgeslagen. Gebruik de telefoon-agenda app zelf om te abonneren op webcal:// URLs — browsers blokkeren directe ICS URL-fetch uit veiligheidsoverwegingen.<br><br>Kopieer de URL en plak hem in:<br>• iPhone: Instellingen → Agenda → Accounts → Account toevoegen → Overig → Abonnement<br>• Android: Google Agenda → Andere agenda → Via URL</span>';
  showToast('URLs opgeslagen ✓');
}



function setFinTab(tab, btn) {
  finTab=tab;
  document.querySelectorAll('#screen-finance .ftab').forEach(function(t){t.classList.remove('active');});
  document.querySelectorAll('#screen-finance .fin-panel').forEach(function(p){p.classList.remove('active');});
  if(btn)btn.classList.add('active');
  var panel=document.getElementById('fin-'+tab);
  if(panel)panel.classList.add('active');
  renderFinance();
}

function renderFinance(){
  try {
    if(finTab==='maandplan')renderMaandplan();
    else if(finTab==='trans')renderTrans();
    else if(finTab==='analyse')renderAnalyse();
    else if(finTab==='sparen')renderSparen();
  } catch(e) {
    var el = document.getElementById('fin-'+finTab);
    if(el) el.innerHTML = '<div style="padding:20px;color:#dc2626;font-size:13px;background:#fee2e2;margin:16px;border-radius:12px">'
      +'<b>Fout in '+finTab+':</b><br>'+e.message+'<br><br>'
      +'<code style="font-size:11px;word-break:break-all">'+e.stack+'</code></div>';
  }
}

function mpKey(y,m){return y+'-'+(m<10?'0':'')+m;}

function samenShare(l,person){
  if(l.who!=='Samen')return l.who===person?l.amount:0;
  if(samenBetaler==='Beiden')return l.amount/2;
  if(samenBetaler===person)return l.amount;
  return 0;
}

function renderMaandplan(){
  var el=document.getElementById('fin-maandplan');if(!el)return;
  var ym=mpKey(mpYear,mpMonth);
  var months=['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December'];
  var shaneCosts=vasteLasten.reduce(function(s,l){return s+samenShare(l,'Shane');},0);
  var esraCosts=vasteLasten.reduce(function(s,l){return s+samenShare(l,'Esra');},0);
  var shanePaid=vasteLasten.filter(function(l){return (l.paid||{})[ym];}).reduce(function(s,l){return s+samenShare(l,'Shane');},0);
  var esraPaid=vasteLasten.filter(function(l){return (l.paid||{})[ym];}).reduce(function(s,l){return s+samenShare(l,'Esra');},0);
  var totalLasten=vasteLasten.reduce(function(s,l){return s+l.amount;},0);

  var html='<div class="mp-income-card">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
    +'<div style="font-size:12px;opacity:.7;text-transform:uppercase;letter-spacing:.5px">Inkomen</div>'
    +'<div style="display:flex;gap:6px">'
    +'<button onclick="changeMp(-1)" style="background:rgba(255,255,255,.2);color:#fff;border:none;border-radius:8px;padding:4px 11px;font-size:15px;cursor:pointer">‹</button>'
    +'<span style="font-weight:700;font-size:14px">'+months[mpMonth]+'</span>'
    +'<button onclick="changeMp(1)" style="background:rgba(255,255,255,.2);color:#fff;border:none;border-radius:8px;padding:4px 11px;font-size:15px;cursor:pointer">›</button>'
    +'</div></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
    // Shane income card
    +'<div style="background:rgba(255,255,255,.12);border-radius:12px;padding:10px">'
    +'<div style="font-size:10px;opacity:.7;margin-bottom:4px">Shane</div>'
    +(mpEditIncome==='Shane'
      ? '<input id="mp-inc-shane-label" value="'+inkomenShane.label+'" style="width:100%;background:rgba(255,255,255,.2);border:none;border-radius:6px;padding:3px 6px;font-size:12px;color:#fff;margin-bottom:4px">'
        +'<div style="display:flex;align-items:center;gap:4px"><span style="font-size:14px;opacity:.8">€</span>'
        +'<input id="mp-inc-shane-amt" type="number" value="'+inkomenShane.amount+'" style="flex:1;background:rgba(255,255,255,.2);border:none;border-radius:6px;padding:3px 6px;font-size:18px;font-weight:800;color:#fff;width:80px"></div>'
        +'<div style="display:flex;gap:5px;margin-top:7px">'
        +'<button onclick="saveMpIncome(\'Shane\')" style="flex:1;background:rgba(255,255,255,.3);color:#fff;border:none;border-radius:7px;padding:5px;font-size:11px;font-weight:700;cursor:pointer">✓ Opslaan</button>'
        +'<button onclick="cancelMpIncome()" style="background:rgba(255,255,255,.15);color:#fff;border:none;border-radius:7px;padding:5px 8px;font-size:11px;cursor:pointer">✕</button>'
        +'</div>'
      : '<div style="font-size:11px;opacity:.75">'+inkomenShane.label+'</div>'
        +'<div style="font-size:22px;font-weight:800;margin:2px 0">€ '+inkomenShane.amount.toLocaleString('nl-NL')+'</div>'
        +'<div style="font-size:10px;opacity:.7">Na lasten: € '+(inkomenShane.amount-shaneCosts).toFixed(0)+'</div>'
        +'<button onclick="editMpIncome(\'Shane\')" style="margin-top:6px;background:rgba(255,255,255,.2);color:#fff;border:none;border-radius:7px;padding:4px 8px;font-size:10px;cursor:pointer">✏️ Wijzigen</button>')
    +'</div>'
    // Esra income card
    +'<div style="background:rgba(255,255,255,.12);border-radius:12px;padding:10px">'
    +'<div style="font-size:10px;opacity:.7;margin-bottom:4px">Esra</div>'
    +(mpEditIncome==='Esra'
      ? '<input id="mp-inc-esra-label" value="'+inkomenEsra.label+'" style="width:100%;background:rgba(255,255,255,.2);border:none;border-radius:6px;padding:3px 6px;font-size:12px;color:#fff;margin-bottom:4px">'
        +'<div style="display:flex;align-items:center;gap:4px"><span style="font-size:14px;opacity:.8">€</span>'
        +'<input id="mp-inc-esra-amt" type="number" value="'+inkomenEsra.amount+'" style="flex:1;background:rgba(255,255,255,.2);border:none;border-radius:6px;padding:3px 6px;font-size:18px;font-weight:800;color:#fff;width:80px"></div>'
        +'<div style="display:flex;gap:5px;margin-top:7px">'
        +'<button onclick="saveMpIncome(\'Esra\')" style="flex:1;background:rgba(255,255,255,.3);color:#fff;border:none;border-radius:7px;padding:5px;font-size:11px;font-weight:700;cursor:pointer">✓ Opslaan</button>'
        +'<button onclick="cancelMpIncome()" style="background:rgba(255,255,255,.15);color:#fff;border:none;border-radius:7px;padding:5px 8px;font-size:11px;cursor:pointer">✕</button>'
        +'</div>'
      : '<div style="font-size:11px;opacity:.75">'+inkomenEsra.label+'</div>'
        +'<div style="font-size:22px;font-weight:800;margin:2px 0">€ '+inkomenEsra.amount.toLocaleString('nl-NL')+'</div>'
        +'<div style="font-size:10px;opacity:.7">Na lasten: € '+(inkomenEsra.amount-esraCosts).toFixed(0)+'</div>'
        +'<button onclick="editMpIncome(\'Esra\')" style="margin-top:6px;background:rgba(255,255,255,.2);color:#fff;border:none;border-radius:7px;padding:4px 8px;font-size:10px;cursor:pointer">✏️ Wijzigen</button>')
    +'</div>'
    +'</div></div>';

  // ── LIVE BEREKENINGEN ──
  var ymStr = mpYear+'-'+(mpMonth+1<10?'0':'')+(mpMonth+1);

  // Eenmalige bij/afschrijvingen deze maand
  var monthEenmaligAll = extraIncome.filter(function(e){
    return e.date && e.date.substring(0,7) === ymStr;
  });
  var eenmaligIn  = monthEenmaligAll.filter(function(e){return e.amount>0;}).reduce(function(s,e){return s+e.amount;},0);
  var eenmaligOut = monthEenmaligAll.filter(function(e){return e.amount<0;}).reduce(function(s,e){return s+Math.abs(e.amount);},0);

  // Totaal gespaard (alle spaardoelen samen)
  var totalSaved = savingsGoals.reduce(function(s,g){return s+g.saved;},0);
  // Spaarbedrag ingekomen deze maand
  var maandSparen = savingsGoals.reduce(function(s,g){
    return s + (g.log||[]).filter(function(l){
      return l.date && l.date.substring(0,7)===ymStr && l.type==='deposit';
    }).reduce(function(ss,l){return ss+l.amount;},0);
  },0);

  var totaalInkomen = inkomenShane.amount + inkomenEsra.amount + eenmaligIn;
  var totaalUit     = totalLasten + eenmaligOut + maandSparen;
  var vrijBesteedbaar = totaalInkomen - totaalUit;

  html+='<div style="background:var(--c-surface);margin:0;border-bottom:.5px solid var(--c-border)">'
    // Grote "Vrij besteedbaar" hero
    +'<div style="padding:14px 16px 10px">'
    +'<div style="font-size:11px;font-weight:700;color:var(--c-text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Overzicht '+months[mpMonth]+'</div>'

    // Hero-getal
    +'<div style="background:'+(vrijBesteedbaar>=0?'#dcfce7':'#fee2e2')+';border-radius:14px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">'
    +'<div>'
    +'<div style="font-size:12px;font-weight:700;color:'+(vrijBesteedbaar>=0?'#16a34a':'#dc2626')+'">Vrij besteedbaar</div>'
    +'<div style="font-size:30px;font-weight:900;color:'+(vrijBesteedbaar>=0?'#16a34a':'#dc2626')+'">€ '+Math.abs(vrijBesteedbaar).toLocaleString('nl-NL')+'</div>'
    +(vrijBesteedbaar<0?'<div style="font-size:11px;color:#dc2626;margin-top:2px">⚠️ Let op: meer uitgaven dan inkomen!</div>':'')
    +'</div>'
    +'<div style="font-size:36px">'+(vrijBesteedbaar>=0?'💚':'🔴')+'</div>'
    +'</div>'

    // Breakdown rijen
    +'<div style="display:flex;flex-direction:column;gap:6px">'
    // Salaris
    +'<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--c-surface2);border-radius:10px">'
    +'<div style="display:flex;align-items:center;gap:8px"><span style="font-size:16px">💼</span><div><div style="font-size:13px;font-weight:600;color:var(--c-text)">Salaris</div><div style="font-size:11px;color:var(--c-text2)">Shane + Esra</div></div></div>'
    +'<div style="font-size:15px;font-weight:700;color:#16a34a">+€ '+(inkomenShane.amount+inkomenEsra.amount).toLocaleString('nl-NL')+'</div>'
    +'</div>'
    // Eenmalig inkomen (alleen tonen als > 0)
    +(eenmaligIn>0
      ? '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--c-surface2);border-radius:10px">'
        +'<div style="display:flex;align-items:center;gap:8px"><span style="font-size:16px">💰</span><div><div style="font-size:13px;font-weight:600;color:var(--c-text)">Eenmalig inkomen</div><div style="font-size:11px;color:var(--c-text2)">'+monthEenmaligAll.filter(function(e){return e.amount>0;}).length+' bijschrijving(en)</div></div></div>'
        +'<div style="font-size:15px;font-weight:700;color:#16a34a">+€ '+eenmaligIn.toLocaleString('nl-NL')+'</div>'
        +'</div>'
      : '')
    // Vaste lasten
    +'<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--c-surface2);border-radius:10px">'
    +'<div style="display:flex;align-items:center;gap:8px"><span style="font-size:16px">🏠</span><div><div style="font-size:13px;font-weight:600;color:var(--c-text)">Vaste lasten</div><div style="font-size:11px;color:var(--c-text2)">'+vasteLasten.length+' posten</div></div></div>'
    +'<div style="font-size:15px;font-weight:700;color:#dc2626">-€ '+totalLasten.toFixed(0)+'</div>'
    +'</div>'
    // Eenmalige afschrijvingen (alleen tonen als > 0)
    +(eenmaligOut>0
      ? '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--c-surface2);border-radius:10px">'
        +'<div style="display:flex;align-items:center;gap:8px"><span style="font-size:16px">💸</span><div><div style="font-size:13px;font-weight:600;color:var(--c-text)">Eenmalige uitgaven</div><div style="font-size:11px;color:var(--c-text2)">'+monthEenmaligAll.filter(function(e){return e.amount<0;}).length+' afschrijving(en)</div></div></div>'
        +'<div style="font-size:15px;font-weight:700;color:#dc2626">-€ '+eenmaligOut.toFixed(0)+'</div>'
        +'</div>'
      : '')
    // Sparen deze maand (alleen tonen als > 0)
    +(maandSparen>0
      ? '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--c-surface2);border-radius:10px">'
        +'<div style="display:flex;align-items:center;gap:8px"><span style="font-size:16px">🏦</span><div><div style="font-size:13px;font-weight:600;color:var(--c-text)">Spaarstortingen</div><div style="font-size:11px;color:var(--c-text2)">Naar spaardoelen</div></div></div>'
        +'<div style="font-size:15px;font-weight:700;color:#0891b2">-€ '+maandSparen.toFixed(0)+'</div>'
        +'</div>'
      : '')
    +'</div>'

    // Sparen vanuit budget knop
    +'<div style="margin-top:10px;display:flex;gap:8px">'
    +'<button onclick="openSparenVanuitBudget()" style="flex:1;background:var(--c-primary);color:#fff;border:none;border-radius:12px;padding:11px 14px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">'
    +'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"/><path d="M3 21h18"/><path d="M9 10h6"/><path d="M9 14h6"/></svg>'
    +' Bedrag opzij zetten</button>'
    +'</div>'

    // Spaarmodule koppeling
    +'<div style="margin-top:10px;background:linear-gradient(135deg,#0891b2,#0369a1);border-radius:12px;padding:12px 14px;color:#fff;display:flex;align-items:center;justify-content:space-between;cursor:pointer" onclick="setFinTab(\'sparen\',null);renderFinance()">'
    +'<div><div style="font-size:11px;opacity:.8">Totaal gespaard</div>'
    +'<div style="font-size:22px;font-weight:900">€ '+totalSaved.toLocaleString('nl-NL')+'</div>'
    +'<div style="font-size:11px;opacity:.7">'+savingsGoals.length+' spaardoel'+(savingsGoals.length!==1?'en':'')+'</div></div>'
    +'<div style="text-align:right"><div style="font-size:28px">🏦</div>'
    +'<div style="font-size:11px;opacity:.8;margin-top:4px">Bekijk →</div>'
    +'</div></div>'

    +'</div></div>';

  // Samen betaler instelling
  html+='<div style="padding:8px 16px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
    +'<span style="font-size:12px;color:#888;font-weight:600">💑 Samen betaald door:</span>'
    +'<button onclick="setSamen(\'Beiden\',this)" style="padding:5px 12px;border-radius:20px;border:.5px solid #ddd;background:'+(samenBetaler==='Beiden'?'#2d5a27':'#fff')+';color:'+(samenBetaler==='Beiden'?'#fff':'#555')+';font-size:12px;font-weight:600">50/50</button>'
    +'<button onclick="setSamen(\'Shane\',this)" style="padding:5px 12px;border-radius:20px;border:.5px solid #ddd;background:'+(samenBetaler==='Shane'?'#2d5a27':'#fff')+';color:'+(samenBetaler==='Shane'?'#fff':'#555')+';font-size:12px;font-weight:600">Shane</button>'
    +'<button onclick="setSamen(\'Esra\',this)" style="padding:5px 12px;border-radius:20px;border:.5px solid #ddd;background:'+(samenBetaler==='Esra'?'#2d5a27':'#fff')+';color:'+(samenBetaler==='Esra'?'#fff':'#555')+';font-size:12px;font-weight:600">Esra</button>'
    +'</div>';

  // Progress bars
  html+='<div style="padding:8px 16px">'
    +'<div style="margin-bottom:10px">'
    +'<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:#2d5a27;margin-bottom:4px"><span>Shane</span><span>€ '+shanePaid.toFixed(0)+' / € '+shaneCosts.toFixed(0)+'</span></div>'
    +'<div class="prog-bar"><div class="prog-fill" style="width:'+(shaneCosts?Math.round(shanePaid/shaneCosts*100):0)+'%;background:#2d5a27"></div></div>'
    +'</div>'
    +'<div>'
    +'<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:#c0547a;margin-bottom:4px"><span>Esra</span><span>€ '+esraPaid.toFixed(0)+' / € '+esraCosts.toFixed(0)+'</span></div>'
    +'<div class="prog-bar"><div class="prog-fill" style="width:'+(esraCosts?Math.round(esraPaid/esraCosts*100):0)+'%;background:#c0547a"></div></div>'
    +'</div></div>';

  // Checklist
  html+='<div style="padding:8px 16px 4px;display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:16px;font-weight:700">Vaste lasten '+months[mpMonth]+'</div>'
    +'<div style="font-size:12px;color:#aaa">'+vasteLasten.filter(function(l){return (l.paid||{})[ym];}).length+'/'+vasteLasten.length+' betaald</div>'
    +'</div>';

  vasteLasten.slice().sort(function(a,b){return a.day-b.day;}).forEach(function(l){
    var isPaid=!!(l.paid||{})[ym];
    var whoClass=l.who==='Shane'?'shane':l.who==='Esra'?'esra':'samen';
    var shareNote=l.who==='Samen'?(' ('+samenBetaler+')'):'';
    html+='<div class="mp-cost-item" id="mpi-'+l.id+'">'
      +'<div class="check-circle '+(isPaid?'done':'')+'" id="mpck-'+l.id+'" onclick="toggleLast(\''+l.id+'\')" style="cursor:pointer">'
      +(isPaid?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>':'')
      +'</div>'
      +'<div style="flex:1;min-width:0">'
      +'<div style="font-size:13px;font-weight:600;color:'+(isPaid?'#bbb':'#222')+';text-decoration:'+(isPaid?'line-through':'none')+'">'+l.name+'</div>'
      +'<div style="font-size:11px;color:#aaa">Dag '+l.day+' · '+l.cat+(isPaid?' · ✓ betaald':'')+'</div>'
      +'</div>'
      +'<span class="mp-cost-who '+whoClass+'">'+l.who+shareNote+'</span>'
      +'<div style="font-size:14px;font-weight:700;color:'+(isPaid?'#bbb':'#222')+'">€ '+l.amount.toFixed(0)+'</div>'
      +'<button onclick="deleteLast(\''+l.id+'\')" style="background:none;border:none;color:#ddd;font-size:15px;padding:4px">✕</button>'
      +'</div>';
  });
  html+='<div style="padding:12px 16px"><button onclick="openAdd(\'vastlast\')" style="width:100%;padding:11px;border:1.5px dashed var(--c-border);border-radius:12px;background:var(--c-surface);font-size:13px;color:var(--c-text2);cursor:pointer">+ Vaste last toevoegen</button></div>';

  // ── EENMALIGE BIJ- EN AFSCHRIJVINGEN ──
  var ym2 = mpKey(mpYear, mpMonth);
  var monthEenmalig = extraIncome.filter(function(e){
    return e.date && e.date.substring(0,7) === (mpYear+'-'+(mpMonth+1<10?'0':'')+(mpMonth+1));
  });
  var totalEenmaligIn  = monthEenmalig.filter(function(e){return e.amount>0;}).reduce(function(s,e){return s+e.amount;},0);
  var totalEenmaligOut = monthEenmalig.filter(function(e){return e.amount<0;}).reduce(function(s,e){return s+Math.abs(e.amount);},0);
  var catIcns = {Vakantiegeld:'🏖️',Bonus:'🎉',Belasting:'🏛️',Freelance:'💻',Cadeau:'🎁',Abonnement:'📱',Verzekering:'🛡️',Medisch:'💊',Reparatie:'🔧',Overig:'💰'};

  html += '<div style="padding:12px 16px 4px;display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:16px;font-weight:700;color:var(--c-text)">Eenmalig deze maand</div>'
    +'<div style="display:flex;gap:6px">'
    +(totalEenmaligIn?'<span style="font-size:11px;background:#dcfce7;color:#16a34a;padding:3px 8px;border-radius:10px;font-weight:700">+€ '+totalEenmaligIn.toFixed(0)+'</span>':'')
    +(totalEenmaligOut?'<span style="font-size:11px;background:#fee2e2;color:#dc2626;padding:3px 8px;border-radius:10px;font-weight:700">-€ '+totalEenmaligOut.toFixed(0)+'</span>':'')
    +'</div></div>';

  if(monthEenmalig.length) {
    monthEenmalig.slice().sort(function(a,b){return (b.date||'').localeCompare(a.date||'');}).forEach(function(e){
      var isNeg = e.amount < 0;
      var icon  = catIcns[e.cat] || (isNeg ? '💸' : '💰');
      var whoColor = e.who==='Shane'?'var(--c-primary)':'var(--c-partner)';
      html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:.5px solid var(--c-border);background:var(--c-surface)">'
        +'<div style="width:38px;height:38px;border-radius:12px;background:'+(isNeg?'#fee2e2':'#dcfce7')+';display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">'+icon+'</div>'
        +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:13px;font-weight:700;color:var(--c-text)">'+e.name+'</div>'
        +'<div style="font-size:11px;color:var(--c-text2);margin-top:1px">'+e.cat+' · '+formatDate(e.date)+' · <span style="font-weight:700;color:'+whoColor+'">'+e.who+'</span></div>'
        +'</div>'
        +'<div style="font-size:15px;font-weight:800;color:'+(isNeg?'#dc2626':'#16a34a')+'">'
        +(isNeg?'-':'+')+'€ '+Math.abs(e.amount).toFixed(0)+'</div>'
        +'<button onclick="deleteExtraIncome('+e.id+')" style="background:none;border:none;color:var(--c-text3);font-size:14px;padding:4px;cursor:pointer">✕</button>'
        +'</div>';
    });
  } else {
    html += '<div style="text-align:center;padding:14px;color:var(--c-text3);font-size:13px">Geen eenmalige transacties deze maand</div>';
  }

  // Two action buttons
  html += '<div style="padding:12px 16px;display:flex;gap:8px">'
    +'<button onclick="openEenmalig(1)" style="flex:1;background:#16a34a;color:#fff;border:none;border-radius:12px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">'
    +'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Bijschrijving</button>'
    +'<button onclick="openEenmalig(-1)" style="flex:1;background:#dc2626;color:#fff;border:none;border-radius:12px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">'
    +'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg> Afschrijving</button>'
    +'</div>';

  // Extra income summary (all time)
  var allExtraIn  = extraIncome.filter(function(e){return e.amount>0;}).reduce(function(s,e){return s+e.amount;},0);
  if(allExtraIn > 0) {
    html += '<div style="margin:0 16px 16px;background:var(--c-surface2);border-radius:12px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between">'
      +'<div><div style="font-size:12px;font-weight:700;color:var(--c-text2)">Totaal extra inkomen (ooit)</div>'
      +'<div style="font-size:18px;font-weight:800;color:#16a34a">€ '+allExtraIn.toLocaleString('nl-NL')+'</div></div>'
      +'<div style="font-size:28px">💰</div></div>';
  }

  el.innerHTML=html;
}

function openSparenVanuitBudget() {
  if(!savingsGoals.length) {
    showToast('Maak eerst een spaardoel aan in het Sparen tabblad');
    return;
  }

  // Calculate how much is free this month
  var ymStr = mpYear+'-'+(mpMonth+1<10?'0':'')+(mpMonth+1);
  var eenmaligIn  = extraIncome.filter(function(e){return e.date&&e.date.substring(0,7)===ymStr&&e.amount>0;}).reduce(function(s,e){return s+e.amount;},0);
  var eenmaligOut = extraIncome.filter(function(e){return e.date&&e.date.substring(0,7)===ymStr&&e.amount<0;}).reduce(function(s,e){return s+Math.abs(e.amount);},0);
  var maandSparen = savingsGoals.reduce(function(s,g){return s+(g.log||[]).filter(function(l){return l.date&&l.date.substring(0,7)===ymStr&&l.type==='deposit';}).reduce(function(ss,l){return ss+l.amount;},0);},0);
  var totalLasten = vasteLasten.reduce(function(s,l){return s+l.amount;},0);
  var vrij = (inkomenShane.amount+inkomenEsra.amount+eenmaligIn-eenmaligOut-totalLasten-maandSparen);

  currentAddType = 'spaar_vanuit_budget';
  document.getElementById('sheet-title').textContent = '🏦 Bedrag opzij zetten';
  document.getElementById('sheet-fields').innerHTML =
    '<div style="background:var(--c-surface2);border-radius:10px;padding:10px 12px;margin-bottom:12px">'
    +'<div style="font-size:11px;color:var(--c-text2);font-weight:600">Vrij besteedbaar deze maand</div>'
    +'<div style="font-size:20px;font-weight:800;color:'+(vrij>=0?'#16a34a':'#dc2626')+'">€ '+vrij.toFixed(0)+'</div>'
    +'</div>'
    +'<div class="field"><label>Bedrag (€)</label>'
    +'<input id="svb-amount" type="number" min="1" step="1" placeholder="0" '
    +(vrij>0?'value="'+Math.floor(vrij/4)+'"':'')+'></div>'
    +'<div class="field"><label>Naar spaardoel</label><select id="svb-goal">'
    +savingsGoals.map(function(g){
      return '<option value="'+g.id+'">'+g.icon+' '+g.name+' (€ '+g.saved.toLocaleString('nl-NL')+' / € '+g.target.toLocaleString('nl-NL')+')</option>';
    }).join('')
    +'</select></div>'
    +'<div class="field"><label>Wie zet het opzij?</label><div class="assignee-row">'
    +'<button type="button" class="assignee-chip active" data-svbwho="'+myName+'">'+myName+'</button>'
    +'<button type="button" class="assignee-chip" data-svbwho="'+partnerName+'">'+partnerName+'</button>'
    +'</div></div>'
    +'<div class="field"><label>Notitie (optioneel)</label>'
    +'<input id="svb-note" placeholder="bijv. Extra spaarmoment"></div>';

  document.getElementById('add-overlay').classList.add('open');
  document.getElementById('add-overlay').dataset.svbDate = todayStr();

  setTimeout(function(){
    document.querySelectorAll('[data-svbwho]').forEach(function(btn){
      btn.onclick = function(){
        document.querySelectorAll('[data-svbwho]').forEach(function(b){b.classList.remove('active');});
        btn.classList.add('active');
      };
    });
    var ai = document.getElementById('svb-amount'); if(ai) ai.focus();
  },150);
}

function saveSparenVanuitBudget() {
  var amount  = parseFloat((document.getElementById('svb-amount')||{}).value)||0;
  var goalId  = parseInt((document.getElementById('svb-goal')||{}).value)||0;
  var note    = (document.getElementById('svb-note')||{}).value||'Opzij gezet vanuit maandplan';
  var whoBtn  = document.querySelector('[data-svbwho].active');
  var who     = whoBtn ? whoBtn.dataset.svbwho : myName;
  var date    = document.getElementById('add-overlay').dataset.svbDate || todayStr();

  if(amount <= 0) { showToast('Vul een bedrag in'); return; }
  var goal = savingsGoals.find(function(g){return g.id===goalId;});
  if(!goal) { showToast('Kies een spaardoel'); return; }

  // Add to savings goal log with special tag so we can undo it
  var logEntry = {
    date: date,
    amount: amount,
    type: 'deposit',
    note: note,
    who: who,
    _fromBudget: true,          // tag: came from maandplan
    _budgetRef: Date.now()      // unique ref for undo
  };
  goal.log.push(logEntry);
  goal.saved += amount;

  // Also register as eenmalige afschrijving in the maandplan so it shows in budget
  var em = {
    id: extraIncNextId++,
    name: '🏦 '+goal.icon+' '+goal.name,
    amount: -amount,
    cat: 'Sparen',
    date: date,
    who: who,
    _savingsGoalId: goalId,
    _savingsBudgetRef: logEntry._budgetRef
  };
  extraIncome.unshift(em);

  closeAdd();
  renderFinance();
  showToast('💚 € '+amount.toFixed(0)+' opzij gezet voor "'+goal.name+'"');
  addActivity('🏦','#dbeafe', who+' zette € '+amount.toFixed(0)+' opzij voor "'+goal.name+'"');
  addNotif('🏦','#dbeafe','Bedrag opzij gezet', '€ '+amount.toFixed(0)+' → '+goal.icon+' '+goal.name);

  // Check goal completion
  if(goal.saved >= goal.target) {
    queueUnlock({icon:goal.icon, type:'🎯 Spaardoel bereikt!', title:goal.name, desc:'€ '+goal.target.toLocaleString('nl-NL')+' gespaard!', who:who, confetti:true});
    awardXP(25,'Spaardoel bereikt');
  }
}

// Undo a budget-linked savings entry (called from maandplan eenmalig list ✕)
var _origDeleteExtraIncome = deleteExtraIncome;
deleteExtraIncome = function(id) {
  var em = extraIncome.find(function(e){return e.id===id;});
  if(em && em._savingsGoalId && em._savingsBudgetRef) {
    // Also reverse the savings goal entry
    var goal = savingsGoals.find(function(g){return g.id===em._savingsGoalId;});
    if(goal) {
      var li = goal.log.findIndex(function(l){return l._budgetRef===em._savingsBudgetRef;});
      if(li > -1) {
        goal.saved = Math.max(0, goal.saved - goal.log[li].amount);
        goal.log.splice(li, 1);
        showToast('↩️ Spaarboeking ook ongedaan gemaakt in "'+goal.name+'"');
      }
    }
  }
  var i = extraIncome.findIndex(function(e){return e.id===id;});
  if(i > -1) extraIncome.splice(i, 1);
  renderFinance();
};

function openEenmalig(direction) {
  // direction: 1 = bijschrijving (income), -1 = afschrijving (expense)
  var isIncome = direction > 0;
  currentAddType = 'eenmalig';
  document.getElementById('sheet-title').textContent = isIncome ? '💚 Bijschrijving toevoegen' : '🔴 Afschrijving toevoegen';
  var cats = isIncome
    ? ['Vakantiegeld','Bonus','Belasting terug','Freelance','Cadeau','Overig']
    : ['Abonnement','Verzekering','Medisch','Reparatie','Boodschappen','Kleding','Overig'];
  document.getElementById('sheet-fields').innerHTML =
    '<div class="field"><label>Omschrijving</label><input id="em-name" placeholder="bijv. '+(isIncome?'Vakantiegeld':'Tandarts')+'"></div>'
    +'<div class="field"><label>Bedrag (€)</label><input id="em-amount" type="number" min="0" step="0.01" placeholder="0.00"></div>'
    +'<div class="field"><label>Categorie</label><select id="em-cat">'
    +cats.map(function(c){return '<option>'+c+'</option>';}).join('')
    +'</select></div>'
    +'<div class="field"><label>Wie?</label><div class="assignee-row">'
    +'<button type="button" class="assignee-chip active" id="em-shane" data-emwho="Shane">Shane</button>'
    +'<button type="button" class="assignee-chip" id="em-esra" data-emwho="Esra">Esra</button>'
    +'</div></div>'
    +'<div class="field"><label>Datum</label><input id="em-date" type="date" value="'+todayStr()+'"></div>';
  document.getElementById('add-overlay').classList.add('open');
  document.getElementById('add-overlay').dataset.emDir = direction;
  setTimeout(function(){
    document.querySelectorAll('[data-emwho]').forEach(function(btn){
      btn.onclick=function(){
        document.querySelectorAll('[data-emwho]').forEach(function(b){b.classList.remove('active');});
        btn.classList.add('active');
      };
    });
    var ni = document.getElementById('em-name'); if(ni) ni.focus();
  },150);
}

function saveEenmalig() {
  var overlay = document.getElementById('add-overlay');
  var dir = parseFloat(overlay.dataset.emDir)||1;
  var name   = (document.getElementById('em-name')||{}).value||'';
  var amount = parseFloat((document.getElementById('em-amount')||{}).value)||0;
  var cat    = (document.getElementById('em-cat')||{}).value||'Overig';
  var date   = (document.getElementById('em-date')||{}).value||todayStr();
  var whoBtn = document.querySelector('[data-emwho].active');
  var who    = whoBtn ? whoBtn.dataset.emwho : myName;
  if(!name || amount<=0){showToast('Vul naam en bedrag in');return;}
  extraIncome.unshift({id:extraIncNextId++, name:name, amount:amount*dir, cat:cat, date:date, who:who});
  awardXP(2,'Eenmalig');
  addActivity(dir>0?'💚':'🔴','#f3f4f6',who+(dir>0?' ontving':' betaalde')+' € '+amount.toFixed(0)+' ('+name+')');
  closeAdd();
  renderFinance();
  showToast((dir>0?'💚 Bijschrijving':'🔴 Afschrijving')+' van € '+amount.toFixed(0)+' toegevoegd');
}

var mpEditIncome = null; // 'Shane' | 'Esra' | null

function editMpIncome(person) { mpEditIncome=person; renderFinance(); }
function cancelMpIncome() { mpEditIncome=null; renderFinance(); }
function saveMpIncome(person) {
  if(person==='Shane') {
    var lbl=document.getElementById('mp-inc-shane-label');
    var amt=document.getElementById('mp-inc-shane-amt');
    if(lbl) inkomenShane.label=lbl.value.trim()||inkomenShane.label;
    if(amt) inkomenShane.amount=Math.max(0,parseInt(amt.value)||0);
  } else {
    var lbl=document.getElementById('mp-inc-esra-label');
    var amt=document.getElementById('mp-inc-esra-amt');
    if(lbl) inkomenEsra.label=lbl.value.trim()||inkomenEsra.label;
    if(amt) inkomenEsra.amount=Math.max(0,parseInt(amt.value)||0);
  }
  mpEditIncome=null;
  renderFinance();
  showToast('Inkomen opgeslagen ✓');
  awardXP(2,'Inkomen bijgesteld');
}

function setSamen(v){samenBetaler=v;renderFinance();}
function changeMp(d){
  mpMonth+=d;
  if(mpMonth<0){mpMonth=11;mpYear--;}
  if(mpMonth>11){mpMonth=0;mpYear++;}
  renderFinance();
}



function toggleLast(id){
  var l=vasteLasten.find(function(x){return x.id===id;});if(!l)return;
  var ym=mpKey(mpYear,mpMonth);
  var el=document.getElementById('mpck-'+id);
  if((l.paid||{})[ym]){delete (l.paid||{})[ym];}
  else{
    (l.paid||{})[ym]=true;
    addNotif('✅','#e8f5e3',l.name+' betaald','€ '+l.amount);
    if(el)spawnParticles(el);
  }
  renderFinance();
}

function deleteLast(id){
  var i=vasteLasten.findIndex(function(x){return x.id===id;});
  if(i>-1){vasteLasten.splice(i,1);renderFinance();}
}


// ── TRANSACTIONS ──
var transFilter = {who:'all', cat:'all', period:'all'};

function renderTrans(){
  var el=document.getElementById('fin-trans');if(!el)return;

  // Filter controls
  var cats = [...new Set(transData.map(function(t){return t.cat;}))].sort();
  var filtered = transData.filter(function(t){
    if(transFilter.who!=='all' && t.who!==transFilter.who) return false;
    if(transFilter.cat!=='all' && t.cat!==transFilter.cat) return false;
    if(transFilter.period!=='all'){
      var now=new Date(); var d=new Date(t.date+'T00:00:00');
      if(transFilter.period==='month' && (d.getMonth()!==now.getMonth()||d.getFullYear()!==now.getFullYear())) return false;
      if(transFilter.period==='3m'){var cutoff=new Date();cutoff.setMonth(cutoff.getMonth()-3);if(d<cutoff)return false;}
    }
    return true;
  });

  var totalIn = filtered.filter(function(t){return t.amount>0;}).reduce(function(s,t){return s+t.amount;},0);
  var totalOut = filtered.filter(function(t){return t.amount<0;}).reduce(function(s,t){return s+Math.abs(t.amount);},0);

  var catIcons = {'Boodschappen':'🛒','Uit eten':'🍽️','Transport':'🚗','Gezondheid':'💊','Abonnementen':'📱','Kleding':'👕','Shopping':'🛍️','Overig':'📦'};

  el.innerHTML = '<div style="padding:12px 16px 0">'
    // Filter row
    +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">'
    +'<select onchange="transFilter.who=this.value;renderTrans()" style="border:1px solid var(--c-border);border-radius:20px;padding:5px 10px;font-size:12px;background:var(--c-surface);color:var(--c-text);outline:none">'
    +'<option value="all">👥 Beiden</option>'
    +'<option value="Shane"'+(transFilter.who==='Shane'?' selected':'')+'>👤 Shane</option>'
    +'<option value="Esra"'+(transFilter.who==='Esra'?' selected':'')+'>👤 Esra</option>'
    +'</select>'
    +'<select onchange="transFilter.period=this.value;renderTrans()" style="border:1px solid var(--c-border);border-radius:20px;padding:5px 10px;font-size:12px;background:var(--c-surface);color:var(--c-text);outline:none">'
    +'<option value="all">📅 Alles</option>'
    +'<option value="month"'+(transFilter.period==='month'?' selected':'')+'>Deze maand</option>'
    +'<option value="3m"'+(transFilter.period==='3m'?' selected':'')+'>Laatste 3 maanden</option>'
    +'</select>'
    +'<select onchange="transFilter.cat=this.value;renderTrans()" style="border:1px solid var(--c-border);border-radius:20px;padding:5px 10px;font-size:12px;background:var(--c-surface);color:var(--c-text);outline:none">'
    +'<option value="all">🏷️ Alle categorieën</option>'
    +cats.map(function(c){return '<option value="'+c+'"'+(transFilter.cat===c?' selected':'')+'>'+c+'</option>';}).join('')
    +'</select>'
    +'</div>'
    // Summary row
    +'<div style="display:flex;gap:8px;margin-bottom:14px">'
    +'<div style="flex:1;background:var(--c-surface);border-radius:12px;padding:10px;text-align:center">'
    +'<div style="font-size:18px;font-weight:800;color:#dc2626">-€ '+totalOut.toFixed(0)+'</div>'
    +'<div style="font-size:10px;color:var(--c-text2);margin-top:2px">Totaal uitgaven</div></div>'
    +'<div style="flex:1;background:var(--c-surface);border-radius:12px;padding:10px;text-align:center">'
    +'<div style="font-size:18px;font-weight:800;color:#16a34a">+€ '+totalIn.toFixed(0)+'</div>'
    +'<div style="font-size:10px;color:var(--c-text2);margin-top:2px">Totaal inkomsten</div></div>'
    +'<div style="flex:1;background:var(--c-surface);border-radius:12px;padding:10px;text-align:center">'
    +'<div style="font-size:18px;font-weight:800;color:'+(totalIn-totalOut>=0?'#16a34a':'#dc2626')+'">€ '+(totalIn-totalOut).toFixed(0)+'</div>'
    +'<div style="font-size:10px;color:var(--c-text2);margin-top:2px">Netto</div></div>'
    +'</div>'
    +'</div>'
    // Transactions list
    +'<div>'
    +filtered.map(function(t){
      var isNeg=t.amount<0;
      var icon=catIcons[t.cat]||'💸';
      var whoColor=t.who==='Shane'?'var(--c-primary)':'var(--c-partner)';
      return '<div style="display:flex;align-items:center;gap:12px;padding:11px 16px;border-bottom:.5px solid var(--c-border);background:var(--c-surface)">'
        +'<div style="width:38px;height:38px;border-radius:12px;background:var(--c-surface2);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">'+icon+'</div>'
        +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:13px;font-weight:600;color:var(--c-text)">'+t.name+'</div>'
        +'<div style="font-size:11px;color:var(--c-text2);margin-top:1px">'+t.cat+' · '+formatDate(t.date)
        +' · <span style="font-weight:600;color:'+whoColor+'">'+t.who+'</span></div>'
        +'</div>'
        +'<div style="font-size:15px;font-weight:700;color:'+(isNeg?'#dc2626':'#16a34a')+'">'
        +(isNeg?'-':'+')+'€ '+Math.abs(t.amount).toFixed(2)+'</div>'
        +'<button onclick="deleteTrans('+t.id+')" style="background:none;border:none;color:var(--c-text3);font-size:14px;padding:4px;cursor:pointer">✕</button>'
        +'</div>';
    }).join('')
    +(filtered.length===0?'<div style="text-align:center;padding:30px;color:var(--c-text2)">Geen transacties gevonden</div>':'')
    +'</div>'
    +'<div style="padding:12px 16px">'
    +'<button onclick="openAdd(\'trans\')" style="width:100%;background:var(--c-primary);color:#fff;border:none;border-radius:12px;padding:12px;font-size:14px;font-weight:700;cursor:pointer">+ Transactie toevoegen</button>'
    +'</div>';
}

function deleteTrans(id){
  var i=transData.findIndex(function(t){return t.id===id;});
  if(i>-1){transData.splice(i,1);renderTrans();}
}

// ── ANALYSE ──
var analyseView = 'donut';   // 'donut' | 'bar' | 'line' | 'table'
var analyseWho = 'beiden';   // 'beiden' | 'shane' | 'esra' | 'vergelijk'
var analysePeriod = '3m';    // '1m' | '3m' | '6m' | 'all'

// Helper: resolve CSS variable to actual color for SVG use
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
}

function renderAnalyse(){
  var el=document.getElementById('fin-analyse');if(!el)return;
  el.style.background='var(--c-bg)';
  el.style.color='var(--c-text)';

  // Build dataset based on filters
  var filtered = transData.filter(function(t){
    if(analyseWho==='shane' && t.who!=='Shane') return false;
    if(analyseWho==='esra' && t.who!=='Esra') return false;
    if(analysePeriod!=='all'){
      var now=new Date(); var d=new Date(t.date+'T00:00:00');
      var months={'1m':1,'3m':3,'6m':6}[analysePeriod]||999;
      var cutoff=new Date();cutoff.setMonth(cutoff.getMonth()-months);
      if(d<cutoff)return false;
    }
    return t.amount<0; // only expenses for cat analysis
  });

  var html = '<div style="padding:12px 16px 0">';

  // Control bar
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">'
    // View type
    +'<div style="display:flex;gap:4px;background:var(--c-surface2);border-radius:20px;padding:3px">'
    +[['donut','🍩'],['bar','📊'],['line','📈'],['table','📋']].map(function(v){
      return '<button onclick="analyseView=\''+v[0]+'\';renderAnalyse()" style="padding:5px 10px;border-radius:16px;border:none;font-size:13px;cursor:pointer;background:'+(analyseView===v[0]?'var(--c-primary)':'transparent')+';color:'+(analyseView===v[0]?'#fff':'var(--c-text2)')+';font-weight:600">'+v[1]+'</button>';
    }).join('')
    +'</div>'
    // Who
    +'<div style="display:flex;gap:4px;background:var(--c-surface2);border-radius:20px;padding:3px">'
    +[['beiden','👥'],['shane','Shane'],['esra','Esra'],['vergelijk','Vergelijk']].map(function(v){
      return '<button onclick="analyseWho=\''+v[0]+'\';renderAnalyse()" style="padding:5px 9px;border-radius:16px;border:none;font-size:11px;cursor:pointer;background:'+(analyseWho===v[0]?'var(--c-primary)':'transparent')+';color:'+(analyseWho===v[0]?'#fff':'var(--c-text2)')+';font-weight:600">'+v[1]+'</button>';
    }).join('')
    +'</div>'
    // Period
    +'<div style="display:flex;gap:4px;background:var(--c-surface2);border-radius:20px;padding:3px">'
    +[['1m','1M'],['3m','3M'],['6m','6M'],['all','Alles']].map(function(v){
      return '<button onclick="analysePeriod=\''+v[0]+'\';renderAnalyse()" style="padding:5px 9px;border-radius:16px;border:none;font-size:11px;cursor:pointer;background:'+(analysePeriod===v[0]?'var(--c-primary)':'transparent')+';color:'+(analysePeriod===v[0]?'#fff':'var(--c-text2)')+';font-weight:600">'+v[1]+'</button>';
    }).join('')
    +'</div></div>';

  html += '</div>';

  if(analyseWho==='vergelijk'){
    html += renderVergelijk();
  } else if(analyseView==='donut'){
    html += renderDonutChart(filtered);
  } else if(analyseView==='bar'){
    html += renderBarChart(filtered);
  } else if(analyseView==='line'){
    html += renderLineChart();
  } else {
    html += renderAnalyseTable(filtered);
  }

  el.innerHTML = html;
}

// ── DONUT CHART (SVG) ──
function renderDonutChart(data){
  var bycat={};
  data.forEach(function(t){if(!bycat[t.cat])bycat[t.cat]=0;bycat[t.cat]+=Math.abs(t.amount);});
  var entries=Object.entries(bycat).sort(function(a,b){return b[1]-a[1];});
  var total=entries.reduce(function(s,e){return s+e[1];},0);
  if(!total) return '<div style="padding:30px;text-align:center;color:var(--c-text2)">Geen uitgaven in deze periode</div>';

  var colors=['#2d5a27','#c0547a','#d97706','#3a5fb0','#7c3aed','#dc2626','#0ea5e9','#10b981'];
  var cx=140,cy=140,r=90,inner=55;
  var startAngle=-Math.PI/2;
  var slices='';
  var legend='';

  entries.forEach(function(e,i){
    var pct=e[1]/total;
    var angle=pct*2*Math.PI;
    var endAngle=startAngle+angle;
    var x1=cx+r*Math.cos(startAngle),y1=cy+r*Math.sin(startAngle);
    var x2=cx+r*Math.cos(endAngle),y2=cy+r*Math.sin(endAngle);
    var xi1=cx+inner*Math.cos(startAngle),yi1=cy+inner*Math.sin(startAngle);
    var xi2=cx+inner*Math.cos(endAngle),yi2=cy+inner*Math.sin(endAngle);
    var large=angle>Math.PI?1:0;
    var color=colors[i%colors.length];
    slices+='<path d="M'+xi1+' '+yi1+' L'+x1+' '+y1+' A'+r+' '+r+' 0 '+large+' 1 '+x2+' '+y2+' L'+xi2+' '+yi2+' A'+inner+' '+inner+' 0 '+large+' 0 '+xi1+' '+yi1+' Z" fill="'+color+'" stroke="'+cssVar('--c-bg')+'" stroke-width="2"/>';
    legend+='<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:.5px solid var(--c-border)">'
      +'<div style="width:12px;height:12px;border-radius:3px;background:'+color+';flex-shrink:0"></div>'
      +'<div style="flex:1;font-size:13px;font-weight:600;color:var(--c-text)">'+e[0]+'</div>'
      +'<div style="font-size:13px;font-weight:700;color:var(--c-text2)">€ '+e[1].toFixed(0)+'</div>'
      +'<div style="font-size:11px;color:var(--c-text2);min-width:32px;text-align:right">'+Math.round(pct*100)+'%</div>'
      +'</div>';
    startAngle=endAngle;
  });

  return '<div style="padding:0 16px 16px">'
    +'<svg width="280" height="280" viewBox="0 0 280 280" style="display:block;margin:0 auto">'
    +slices
    +'<text x="140" y="133" text-anchor="middle" font-size="11" fill="'+cssVar('--c-text2')+'" font-family="inherit">Totaal</text>'
    +'<text x="140" y="153" text-anchor="middle" font-size="16" font-weight="800" fill="'+cssVar('--c-text')+'" font-family="inherit">€ '+total.toFixed(0)+'</text>'
    +'</svg>'
    +legend+'</div>';
}

// ── BAR CHART (SVG) ──
function renderBarChart(data){
  var bycat={};
  data.forEach(function(t){if(!bycat[t.cat])bycat[t.cat]=0;bycat[t.cat]+=Math.abs(t.amount);});
  var entries=Object.entries(bycat).sort(function(a,b){return b[1]-a[1];}).slice(0,7);
  var maxVal=entries.length?Math.max.apply(null,entries.map(function(e){return e[1];})):1;
  var colors=['#2d5a27','#c0547a','#d97706','#3a5fb0','#7c3aed','#dc2626','#0ea5e9'];
  var W=Math.min(320, entries.length*44+20);
  var bars=''; var labels=''; var gridLines='';
  var gridVals=[0,Math.round(maxVal*0.5),Math.round(maxVal)];
  gridVals.forEach(function(v,i){
    var y=160-i*80;
    gridLines+='<line x1="30" y1="'+y+'" x2="'+(W-10)+'" y2="'+y+'" stroke="'+cssVar('--c-border')+'" stroke-width=".5"/>';
    gridLines+='<text x="26" y="'+(y+4)+'" text-anchor="end" font-size="9" fill="'+cssVar('--c-text2')+'" font-family="inherit">€'+v+'</text>';
  });
  entries.forEach(function(e,i){
    var bh=Math.round((e[1]/maxVal)*140);
    var x=30+i*44+10;
    bars+='<rect x="'+x+'" y="'+(160-bh)+'" width="30" height="'+bh+'" rx="4" fill="'+colors[i%colors.length]+'"/>';
    var shortCat=e[0].length>6?e[0].substring(0,5)+'…':e[0];
    labels+='<text x="'+(x+15)+'" y="175" text-anchor="middle" font-size="9" fill="'+cssVar('--c-text2')+'" font-family="inherit">'+shortCat+'</text>';
    labels+='<text x="'+(x+15)+'" y="'+(160-bh-4)+'" text-anchor="middle" font-size="9" font-weight="700" fill="'+cssVar('--c-text')+'" font-family="inherit">€'+Math.round(e[1])+'</text>';
  });
  return '<div style="padding:8px 16px 16px;overflow-x:auto">'
    +'<svg width="'+W+'" height="185" viewBox="0 0 '+W+' 185" style="display:block;min-width:'+W+'px">'
    +gridLines+bars+labels+'</svg></div>';
}

// ── LINE CHART (SVG) — maandelijkse uitgaven ──
function renderLineChart(){
  // Get last 6 months
  var months=[];
  var now=new Date();
  for(var i=5;i>=0;i--){
    var d=new Date(now.getFullYear(),now.getMonth()-i,1);
    months.push({year:d.getFullYear(),month:d.getMonth(),
      label:['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'][d.getMonth()]});
  }
  function getMonthTotal(yr,mo,who){
    return transData.filter(function(t){
      if(t.amount>=0)return false;
      var d=new Date(t.date+'T00:00:00');
      if(d.getFullYear()!==yr||d.getMonth()!==mo)return false;
      if(who&&t.who!==who)return false;
      return true;
    }).reduce(function(s,t){return s+Math.abs(t.amount);},0);
  }

  var shaneVals=months.map(function(m){return getMonthTotal(m.year,m.month,'Shane');});
  var esraVals=months.map(function(m){return getMonthTotal(m.year,m.month,'Esra');});
  var bothVals=months.map(function(m){return getMonthTotal(m.year,m.month,null);});

  var maxV=Math.max.apply(null,[...shaneVals,...esraVals,...bothVals,1]);
  var W=320,H=180,pad=36,bpad=30;
  var plotW=W-pad-10,plotH=H-bpad-10;

  function toY(v){return 10+plotH-Math.round((v/maxV)*plotH);}
  function toX(i){return pad+Math.round((i/(months.length-1))*plotW);}

  function makePath(vals,color){
    if(vals.every(function(v){return v===0;}))return '';
    var d=vals.map(function(v,i){return (i===0?'M':'L')+toX(i)+' '+toY(v);}).join(' ');
    var dots=vals.map(function(v,i){return '<circle cx="'+toX(i)+'" cy="'+toY(v)+'" r="3" fill="'+color+'"/>';}).join('');
    return '<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="2" stroke-linejoin="round"/>'+dots;
  }

  // Grid lines
  var grid='';
  for(var gi=0;gi<=4;gi++){
    var gy=10+Math.round((gi/4)*plotH);
    var gv=Math.round(maxV*(1-gi/4));
    grid+='<line x1="'+pad+'" y1="'+gy+'" x2="'+(W-10)+'" y2="'+gy+'" stroke="'+cssVar('--c-border')+'" stroke-width=".5"/>';
    grid+='<text x="'+(pad-4)+'" y="'+(gy+3)+'" text-anchor="end" font-size="9" fill="'+cssVar('--c-text2')+'" font-family="inherit">'+gv+'</text>';
  }
  // X labels
  var xlabels=months.map(function(m,i){return '<text x="'+toX(i)+'" y="'+(H-6)+'" text-anchor="middle" font-size="9" fill="'+cssVar('--c-text2')+'" font-family="inherit">'+m.label+'</text>';}).join('');

  var svg='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" style="display:block;width:100%;max-width:360px;margin:0 auto">'
    +grid
    +makePath(shaneVals,cssVar('--c-primary'))
    +makePath(esraVals,cssVar('--c-partner'))
    +xlabels+'</svg>';

  return '<div style="padding:8px 16px 12px">'
    +svg
    +'<div style="display:flex;gap:16px;justify-content:center;margin-top:8px">'
    +'<div style="display:flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:var(--c-primary)"><div style="width:16px;height:3px;background:var(--c-primary);border-radius:2px"></div>Shane</div>'
    +'<div style="display:flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:var(--c-partner)"><div style="width:16px;height:3px;background:var(--c-partner);border-radius:2px"></div>Esra</div>'
    +'</div></div>';
}

// ── VERGELIJK ──
function renderVergelijk(){
  var cats=[...new Set(transData.map(function(t){return t.cat;}))].sort();
  var now=new Date();
  function getCatTotal(who,cat){
    return transData.filter(function(t){
      if(t.amount>=0)return false;
      if(t.who!==who)return false;
      if(cat&&t.cat!==cat)return false;
      var d=new Date(t.date+'T00:00:00');
      var cutoff=new Date();cutoff.setMonth(cutoff.getMonth()-3);
      return d>=cutoff;
    }).reduce(function(s,t){return s+Math.abs(t.amount);},0);
  }
  var shaneTotal=getCatTotal('Shane',null);
  var esraTotal=getCatTotal('Esra',null);
  var maxTotal=Math.max(shaneTotal,esraTotal,1);

  var html='<div style="padding:12px 16px;background:var(--c-bg)">'
    +'<div style="display:flex;gap:8px;margin-bottom:16px">'
    +'<div style="flex:1;background:var(--c-primary-light);border-radius:12px;padding:10px;text-align:center">'
    +'<div style="font-size:20px;font-weight:800;color:var(--c-primary)">€ '+shaneTotal.toFixed(0)+'</div>'
    +'<div style="font-size:11px;color:var(--c-primary);margin-top:2px">Shane · 3 mnd</div></div>'
    +'<div style="flex:1;background:var(--c-partner-light);border-radius:12px;padding:10px;text-align:center">'
    +'<div style="font-size:20px;font-weight:800;color:var(--c-partner)">€ '+esraTotal.toFixed(0)+'</div>'
    +'<div style="font-size:11px;color:var(--c-partner);margin-top:2px">Esra · 3 mnd</div></div>'
    +'</div>'
    +'<div style="font-size:12px;font-weight:700;color:var(--c-text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Per categorie</div>';

  cats.forEach(function(cat){
    var sv=getCatTotal('Shane',cat);
    var ev=getCatTotal('Esra',cat);
    if(!sv&&!ev)return;
    var maxV=Math.max(sv,ev,1);
    html+='<div style="margin-bottom:12px">'
      +'<div style="font-size:13px;font-weight:700;color:var(--c-text);margin-bottom:6px">'+cat+'</div>'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">'
      +'<div style="font-size:11px;color:var(--c-primary);width:44px;font-weight:600">Shane</div>'
      +'<div style="flex:1;height:10px;background:var(--c-surface2);border-radius:5px;overflow:hidden">'
      +'<div style="height:100%;width:'+(sv/maxV*100)+'%;background:var(--c-primary);border-radius:5px;transition:width .4s"></div></div>'
      +'<div style="font-size:11px;color:var(--c-text2);width:44px;text-align:right">€ '+sv.toFixed(0)+'</div></div>'
      +'<div style="display:flex;align-items:center;gap:8px">'
      +'<div style="font-size:11px;color:var(--c-partner);width:44px;font-weight:600">Esra</div>'
      +'<div style="flex:1;height:10px;background:var(--c-surface2);border-radius:5px;overflow:hidden">'
      +'<div style="height:100%;width:'+(ev/maxV*100)+'%;background:var(--c-partner);border-radius:5px;transition:width .4s"></div></div>'
      +'<div style="font-size:11px;color:var(--c-text2);width:44px;text-align:right">€ '+ev.toFixed(0)+'</div></div>'
      +'</div>';
  });
  html+='</div>';
  return html;
}

// ── TABLE ──
function renderAnalyseTable(data){
  var bycat={};
  data.forEach(function(t){if(!bycat[t.cat])bycat[t.cat]={total:0,count:0,items:[]};bycat[t.cat].total+=Math.abs(t.amount);bycat[t.cat].count++;bycat[t.cat].items.push(t);});
  var entries=Object.entries(bycat).sort(function(a,b){return b[1].total-a[1].total;});
  var grandTotal=entries.reduce(function(s,e){return s+e[1].total;},0);
  return '<div style="padding:0 16px 16px">'
    +'<table style="width:100%;border-collapse:collapse;font-size:13px">'
    +'<thead><tr style="border-bottom:2px solid var(--c-border)">'
    +'<th style="text-align:left;padding:8px 0;color:var(--c-text2);font-size:11px;text-transform:uppercase;letter-spacing:.4px">Categorie</th>'
    +'<th style="text-align:right;padding:8px 0;color:var(--c-text2);font-size:11px;text-transform:uppercase">Transacties</th>'
    +'<th style="text-align:right;padding:8px 0;color:var(--c-text2);font-size:11px;text-transform:uppercase">Totaal</th>'
    +'<th style="text-align:right;padding:8px 0;color:var(--c-text2);font-size:11px;text-transform:uppercase">%</th>'
    +'</tr></thead><tbody>'
    +entries.map(function(e){
      var pct=grandTotal?Math.round(e[1].total/grandTotal*100):0;
      return '<tr style="border-bottom:.5px solid var(--c-border)">'
        +'<td style="padding:9px 0;font-weight:600;color:var(--c-text)">'+e[0]+'</td>'
        +'<td style="padding:9px 0;text-align:right;color:var(--c-text2)">'+e[1].count+'x</td>'
        +'<td style="padding:9px 0;text-align:right;font-weight:700;color:var(--c-text)">€ '+e[1].total.toFixed(2)+'</td>'
        +'<td style="padding:9px 0;text-align:right;color:var(--c-primary);font-weight:700">'+pct+'%</td>'
        +'</tr>';
    }).join('')
    +'<tr style="border-top:2px solid var(--c-border)">'
    +'<td style="padding:9px 0;font-weight:800;color:var(--c-text)">Totaal</td>'
    +'<td></td>'
    +'<td style="padding:9px 0;text-align:right;font-weight:800;color:var(--c-text)">€ '+grandTotal.toFixed(2)+'</td>'
    +'<td style="padding:9px 0;text-align:right;font-weight:700;color:var(--c-primary)">100%</td>'
    +'</tr>'
    +'</tbody></table></div>';
}

// ── EXTRA INKOMSTEN ──
function renderExtraIncome(){
  var el=document.getElementById('fin-extra');if(!el)return;
  var total=extraIncome.reduce(function(s,e){return s+e.amount;},0);
  var shaneTotal=extraIncome.filter(function(e){return e.who==='Shane';}).reduce(function(s,e){return s+e.amount;},0);
  var esraTotal=extraIncome.filter(function(e){return e.who==='Esra';}).reduce(function(s,e){return s+e.amount;},0);
  var cats=['Vakantiegeld','Bonus','Belasting','Freelance','Cadeau','Overig'];
  var catIcons={Vakantiegeld:'🏖️',Bonus:'🎉',Belasting:'🏛️',Freelance:'💻',Cadeau:'🎁',Overig:'💰'};

  el.innerHTML='<div style="padding:12px 16px 0">'
    // Summary
    +'<div style="display:flex;gap:8px;margin-bottom:16px">'
    +'<div style="flex:1;background:linear-gradient(135deg,var(--c-primary),var(--c-accent));border-radius:14px;padding:14px;text-align:center;color:#fff">'
    +'<div style="font-size:11px;opacity:.8;margin-bottom:4px">Totaal extra</div>'
    +'<div style="font-size:24px;font-weight:800">€ '+total.toLocaleString('nl-NL')+'</div>'
    +'</div>'
    +'<div style="flex:1;display:flex;flex-direction:column;gap:8px">'
    +'<div style="flex:1;background:var(--c-surface);border-radius:12px;padding:10px;text-align:center;box-shadow:0 1px 4px var(--c-card-shadow)">'
    +'<div style="font-size:16px;font-weight:800;color:var(--c-primary)">€ '+shaneTotal.toLocaleString('nl-NL')+'</div>'
    +'<div style="font-size:10px;color:var(--c-text2)">Shane</div></div>'
    +'<div style="flex:1;background:var(--c-surface);border-radius:12px;padding:10px;text-align:center;box-shadow:0 1px 4px var(--c-card-shadow)">'
    +'<div style="font-size:16px;font-weight:800;color:var(--c-partner)">€ '+esraTotal.toLocaleString('nl-NL')+'</div>'
    +'<div style="font-size:10px;color:var(--c-text2)">Esra</div></div>'
    +'</div></div>'
    // List
    +'<div style="font-size:11px;font-weight:700;color:var(--c-text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Overzicht</div>'
    +'</div>'
    +'<div>'
    +extraIncome.slice().sort(function(a,b){return b.date.localeCompare(a.date);}).map(function(e){
      var icon=catIcons[e.cat]||'💰';
      var whoColor=e.who==='Shane'?'var(--c-primary)':'var(--c-partner)';
      return '<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:.5px solid var(--c-border);background:var(--c-surface)">'
        +'<div style="width:42px;height:42px;border-radius:12px;background:var(--c-primary-light);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">'+icon+'</div>'
        +'<div style="flex:1">'
        +'<div style="font-size:14px;font-weight:700;color:var(--c-text)">'+e.name+'</div>'
        +'<div style="font-size:11px;color:var(--c-text2);margin-top:2px">'+e.cat+' · '+formatDate(e.date)+' · <span style="font-weight:700;color:'+whoColor+'">'+e.who+'</span></div>'
        +'</div>'
        +'<div style="font-size:17px;font-weight:800;color:#16a34a">+€ '+e.amount.toLocaleString('nl-NL')+'</div>'
        +'<button onclick="deleteExtraIncome('+e.id+')" style="background:none;border:none;color:var(--c-text3);font-size:14px;padding:4px;cursor:pointer">✕</button>'
        +'</div>';
    }).join('')
    +(extraIncome.length===0?'<div style="text-align:center;padding:30px;color:var(--c-text2)">Nog geen extra inkomsten</div>':'')
    +'</div>'
    +'<div style="padding:12px 16px">'
    +'<button onclick="openAdd(\'extraincome\')" style="width:100%;background:var(--c-primary);color:#fff;border:none;border-radius:12px;padding:13px;font-size:15px;font-weight:700;cursor:pointer">+ Extra inkomen toevoegen</button>'
    +'</div>';
}

function deleteExtraIncome(id){
  var i=extraIncome.findIndex(function(e){return e.id===id;});
  if(i>-1){extraIncome.splice(i,1);renderExtraIncome();}
}

