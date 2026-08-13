'use strict';
// ============================================================
// CALENDAR PREMIUM UI v1.1
// Task-detail inspired appointment cards + detail popup + notes.
// ============================================================
(function(){
  if(window.__calendarPremiumUiV1)return;
  window.__calendarPremiumUiV1=true;

  var editingId=null;
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function icon(name,size){
    var p={close:'<path d="M6 6l12 12M18 6 6 18"/>',calendar:'<rect x="4" y="5.5" width="16" height="15" rx="2.3"/><path d="M4 10h16M8 3.3v4M16 3.3v4"/>',clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',note:'<path d="M6 3.5h9l3 3V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"/><path d="M14 3.5V8h4M8 12h7M8 16h5"/>',edit:'<path d="M4 20h4l10-10-4-4L4 16v4Z"/><path d="m12.5 7.5 4 4"/>',trash:'<path d="M5 7h14M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2M7 7l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12"/>'};
    return '<svg viewBox="0 0 24 24" width="'+(size||16)+'" height="'+(size||16)+'" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(p[name]||'')+'</svg>';
  }

  function ensureStyles(){
    if(document.getElementById('calendar-premium-ui-style'))return;
    var s=document.createElement('style');s.id='calendar-premium-ui-style';
    s.textContent=''
      +'.cal-event.cal-premium{border:1px solid var(--c-border);background:var(--c-surface);border-radius:18px;padding:13px 14px;display:flex;gap:12px;align-items:center;margin:8px 0;box-shadow:0 5px 18px rgba(17,24,39,.06);cursor:pointer;transition:transform .16s ease}.cal-event.cal-premium:active{transform:scale(.985)}'
      +'.cal-premium-mark{width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;background:linear-gradient(145deg,#efe9ff,#e3d8ff);color:#6d28d9;border:1px solid rgba(109,40,217,.14)}'
      +'.cal-premium-title{font-size:15px;font-weight:850;letter-spacing:-.2px;color:var(--c-text);line-height:1.2}.cal-premium-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:5px;font-size:11.5px;font-weight:650;color:var(--c-text2)}.cal-premium-note-preview{font-size:12px;color:var(--c-text2);margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px}'
      +'.cal-detail-overlay{position:fixed;inset:0;z-index:240;background:rgba(15,12,25,.58);backdrop-filter:blur(8px);display:none;align-items:flex-end;justify-content:center;padding:12px}.cal-detail-overlay.open{display:flex}.cal-detail-card{width:min(100%,520px);max-height:88vh;overflow:auto;border-radius:28px 28px 22px 22px;background:var(--c-surface);border:1px solid var(--c-border);box-shadow:0 28px 80px rgba(17,24,39,.3);padding:0 18px 18px}.cal-detail-hero{position:relative;margin:0 -18px 16px;padding:24px 20px 18px;border-radius:28px 28px 22px 22px;background:linear-gradient(145deg,#25194a,#4b2a85 60%,#6d28d9);color:#fff;overflow:hidden}.cal-detail-hero:after{content:"";position:absolute;width:180px;height:180px;border-radius:50%;right:-65px;top:-80px;background:rgba(255,255,255,.1)}.cal-detail-close{position:absolute;right:14px;top:14px;width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.22);background:rgba(0,0,0,.18);color:#fff;display:flex;align-items:center;justify-content:center}.cal-detail-kicker{font-size:10px;font-weight:900;letter-spacing:1.15px;text-transform:uppercase;color:#eadfff;margin-bottom:8px}.cal-detail-title{font-size:23px;font-weight:950;letter-spacing:-.55px;line-height:1.08;max-width:82%}.cal-detail-info{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}.cal-detail-tile{border:1px solid var(--c-border);background:var(--c-surface2);border-radius:16px;padding:12px}.cal-detail-tile-label{font-size:10px;text-transform:uppercase;letter-spacing:.7px;font-weight:850;color:var(--c-text3);margin-bottom:5px}.cal-detail-tile-value{font-size:13px;font-weight:800;color:var(--c-text);display:flex;align-items:center;gap:7px}.cal-detail-note{border:1px solid var(--c-border);background:var(--c-surface2);border-radius:18px;padding:14px;margin:10px 0 14px}.cal-detail-note-head{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:900;color:var(--c-text);margin-bottom:8px}.cal-detail-note-body{font-size:13px;line-height:1.55;color:var(--c-text2);white-space:pre-wrap}.cal-detail-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.cal-detail-btn{border:none;border-radius:15px;padding:13px 14px;font-size:13px;font-weight:850;display:flex;align-items:center;justify-content:center;gap:8px}.cal-detail-btn.edit{background:#ede9fe;color:#5b21b6}.cal-detail-btn.delete{background:#fee2e2;color:#b91c1c}'
      +'#add-overlay .add-sheet.sheet-calendar{border-radius:28px 28px 0 0;padding-top:10px}#add-overlay .sheet-calendar .sheet-title{font-size:21px;font-weight:950;letter-spacing:-.4px}#add-overlay .sheet-calendar .field label{font-size:11px;font-weight:850;letter-spacing:.35px;text-transform:uppercase;color:var(--c-text2)}#add-overlay .sheet-calendar input,#add-overlay .sheet-calendar textarea{border-radius:14px!important;background:var(--c-surface2)!important;border:1px solid var(--c-border)!important;padding:12px 13px!important}#add-overlay .sheet-calendar textarea{box-sizing:border-box;width:100%;min-height:96px;resize:vertical;font:inherit;color:var(--c-text)}';
    document.head.appendChild(s);
  }

  function getEvent(id){return (window.calData||[]).find(function(e){return String(e.id)===String(id);})||null;}
  function formatDate(date){try{return new Date(date+'T00:00:00').toLocaleDateString('nl-NL',{weekday:'long',day:'numeric',month:'long',year:'numeric'});}catch(e){return date||'';}}
  function ensureOverlay(){if(document.getElementById('cal-detail-overlay'))return;var d=document.createElement('div');d.id='cal-detail-overlay';d.className='cal-detail-overlay';d.onclick=function(ev){if(ev.target===d)close();};document.body.appendChild(d);}
  function close(){var o=document.getElementById('cal-detail-overlay');if(o)o.classList.remove('open');}

  function open(id){
    ensureStyles();ensureOverlay();var e=getEvent(id);if(!e)return;var o=document.getElementById('cal-detail-overlay');
    o.innerHTML='<div class="cal-detail-card"><div class="cal-detail-hero"><button class="cal-detail-close" onclick="CalendarPremiumUi.close()">'+icon('close',16)+'</button><div class="cal-detail-kicker">Familie afspraak</div><div class="cal-detail-title">'+esc(e.title||'Afspraak')+'</div></div>'
      +'<div class="cal-detail-info"><div class="cal-detail-tile"><div class="cal-detail-tile-label">Datum</div><div class="cal-detail-tile-value">'+icon('calendar',15)+esc(formatDate(e.date))+'</div></div><div class="cal-detail-tile"><div class="cal-detail-tile-label">Tijd</div><div class="cal-detail-tile-value">'+icon('clock',15)+esc(e.time||'Hele dag')+'</div></div></div>'
      +'<div class="cal-detail-note"><div class="cal-detail-note-head">'+icon('note',15)+' Beschrijving / notitie</div><div class="cal-detail-note-body">'+(e.description?esc(e.description):'<span style="color:var(--c-text3)">Geen beschrijving toegevoegd.</span>')+'</div></div>'
      +'<div class="cal-detail-actions"><button class="cal-detail-btn edit" onclick="CalendarPremiumUi.edit(\''+encodeURIComponent(String(e.id))+'\')">'+icon('edit',15)+' Bewerken</button><button class="cal-detail-btn delete" onclick="CalendarPremiumUi.remove(\''+encodeURIComponent(String(e.id))+'\')">'+icon('trash',15)+' Verwijderen</button></div></div>';
    o.classList.add('open');
  }
  function edit(id){close();var real=decodeURIComponent(id);editingId=real;if(typeof window.openCalEdit==='function')window.openCalEdit(real);setTimeout(function(){var e=getEvent(real),f4=document.getElementById('cal-description');if(e&&f4)f4.value=e.description||'';},0);}
  function remove(id){var real=decodeURIComponent(id);if(window.confirm&&!window.confirm('Deze afspraak verwijderen?'))return;close();if(typeof window.deleteCalEvent==='function')window.deleteCalEvent(real);}

  function decorateSheet(){
    var sheet=document.querySelector('#add-overlay .add-sheet');if(!sheet)return;var isCal=window.currentAddType==='cal';sheet.classList.toggle('sheet-calendar',isCal);if(!isCal)return;
    var fields=document.getElementById('sheet-fields');if(fields&&!document.getElementById('cal-description')){
      var wrap=document.createElement('div');wrap.className='field';wrap.innerHTML='<label>Beschrijving / notitie</label><textarea id="cal-description" placeholder="Bijv. neem verzekeringspas mee, parkeren aan de achterzijde..."></textarea>';fields.appendChild(wrap);
    }
    if(editingId){var e=getEvent(editingId),ta=document.getElementById('cal-description');if(e&&ta)ta.value=e.description||'';}
  }

  var oldOpenAdd=window.openAdd;
  if(typeof oldOpenAdd==='function')window.openAdd=function(type){if(type==='cal'&&!editingId)editingId=null;var r=oldOpenAdd.apply(this,arguments);setTimeout(decorateSheet,0);return r;};

  var oldCloseAdd=window.closeAdd;
  if(typeof oldCloseAdd==='function')window.closeAdd=function(){editingId=null;return oldCloseAdd.apply(this,arguments);};

  var oldOpenEdit=window.openCalEdit;
  if(typeof oldOpenEdit==='function')window.openCalEdit=function(id){editingId=id;var r=oldOpenEdit.apply(this,arguments);setTimeout(decorateSheet,0);return r;};

  var oldSave=window.saveItem;
  if(typeof oldSave==='function')window.saveItem=function(){
    if(window.currentAddType!=='cal')return oldSave.apply(this,arguments);
    var noteEl=document.getElementById('cal-description'),note=noteEl?noteEl.value.trim():'';
    var before=(window.calData||[]).map(function(e){return String(e.id);});
    var targetId=editingId;
    var result=oldSave.apply(this,arguments);
    setTimeout(function(){
      var target=null;
      if(targetId)target=getEvent(targetId);
      if(!target){target=(window.calData||[]).find(function(e){return before.indexOf(String(e.id))===-1;})||null;}
      if(target){target.description=note;target.updatedAt=Date.now();if(window.CalendarSharedLive&&typeof window.CalendarSharedLive.save==='function')window.CalendarSharedLive.save();}
      editingId=null;
    },0);
    return result;
  };

  window.renderCalEvents=function(){
    var el=document.getElementById('cal-events');if(!el)return;
    var all=(window.calData||[]).concat(window.importedCalEvents||[]);
    var events=window.calSelDay?all.filter(function(e){return e.date===window.calSelDay;}):all.slice().sort(function(a,b){return (a.date||'').localeCompare(b.date||'');});
    if(!events.length){el.innerHTML='<div style="padding:18px;color:var(--c-text3);font-size:13px;text-align:center">'+(window.calSelDay?'Geen afspraken op deze dag':'Tik op een dag om afspraken te zien')+'</div>';return;}
    el.innerHTML=events.map(function(e){var id=encodeURIComponent(String(e.id));var note=e.description?'<div class="cal-premium-note-preview">'+esc(e.description)+'</div>':'';return '<div class="cal-event cal-premium" onclick="'+(e._imported?'':'CalendarPremiumUi.open(\''+id+'\')')+'"><div class="cal-premium-mark">'+icon('calendar',21)+'</div><div style="flex:1;min-width:0"><div class="cal-premium-title">'+esc(e.title||'Afspraak')+'</div><div class="cal-premium-meta"><span>'+icon('clock',12)+' '+esc(e.time||'Hele dag')+'</span><span>•</span><span>'+esc(window.formatDate?window.formatDate(e.date):e.date)+'</span></div>'+note+'</div><div style="font-size:22px;color:var(--c-text3)">›</div></div>';}).join('');
  };

  ensureStyles();ensureOverlay();
  window.CalendarPremiumUi={open:open,close:close,edit:edit,remove:remove,decorateSheet:decorateSheet};
  setTimeout(function(){decorateSheet();if(typeof window.renderCalEvents==='function')window.renderCalEvents();},50);
})();
