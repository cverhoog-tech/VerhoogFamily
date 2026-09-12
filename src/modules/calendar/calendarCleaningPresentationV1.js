'use strict';
// ============================================================
// FAMILYAPP AGENDA — CLEANING PRESENTATION V1
// Presentation-only decorator over existing projected calendar records.
// CleaningOccurrence remains canonical; no Calendar/Cleaning writes live here.
// ============================================================
(function(){
  if(window.CalendarCleaningPresentationV1)return;

  var VERSION='1.0.0';
  var installed=false;
  var originalRenderEvents=null;
  var currentRows=[];
  var PHOTO={
    bathroom:'/src/assets/cleaning-rooms/bathroom-light.webp',
    bedroom:'/src/assets/cleaning-rooms/bedroom-light.webp',
    hall:'/src/assets/cleaning-rooms/hall-light.webp',
    kids:'/src/assets/cleaning-rooms/kids-room-light.webp',
    kitchen:'/src/assets/cleaning-rooms/kitchen-light.webp',
    laundry:'/src/assets/cleaning-rooms/laundry-light.webp',
    living:'/src/assets/cleaning-rooms/living-room-light.webp',
    toilet:'/src/assets/cleaning-rooms/toilet-light.webp',
    outdoor:'/src/assets/cleaning-rooms/outdoor-light.webp',
    fallback:'/src/assets/task-heroes/cozy-home.webp'
  };

  function text(v){return String(v==null?'':v).trim();}
  function esc(v){return text(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function svg(path){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';}
  var ICON={clean:svg('<path d="m5 20 5.6-5.6M8.5 3.5l12 12-5 5-12-12 5-5Z"/><path d="m13.4 8.4 2.2-2.2M4 16l4 4"/>'),chevron:svg('<path d="m9 18 6-6-6-6"/>')};

  function allEvents(){
    var nativeRows=Array.isArray(window.calData)?window.calData:[];
    var imported=Array.isArray(window.importedCalEvents)?window.importedCalEvents:[];
    return nativeRows.concat(imported);
  }
  function visibleEvents(){
    var rows=allEvents(),selected=window.calSelDay||null;
    if(selected)return rows.filter(function(e){return e&&e.date===selected;});
    return rows.slice().sort(function(a,b){return text(a&&a.date).localeCompare(text(b&&b.date));});
  }
  function isCleaning(row){
    var source=text(row&&row.sourceType).toLowerCase();
    return !!(row&&row.projectionManaged===true&&(source==='cleaning-occurrence'||source==='cleaning-occurrence-group'));
  }
  function roomName(row){var title=text(row&&row.title);var m=title.match(/^schoonmaken\s*[·\-:]\s*(.+)$/i);return m&&m[1]?text(m[1]):'Schoonmaken';}
  function displayTitle(row){var room=roomName(row);return room==='Schoonmaken'?'Schoonmaken':room+' schoonmaken';}
  function photoKey(row){
    var raw=(roomName(row)+' '+text(row&&row.title)).toLowerCase();
    if(/badkamer|bathroom|douche/.test(raw))return'bathroom';
    if(/toilet|\bwc\b/.test(raw))return'toilet';
    if(/kinderkamer|kids|speelgoed|kind/.test(raw))return'kids';
    if(/woonkamer|living/.test(raw))return'living';
    if(/slaapkamer|bedroom/.test(raw))return'bedroom';
    if(/\bhal\b|entree|hall/.test(raw))return'hall';
    if(/wasruimte|laundry|wasgoed/.test(raw))return'laundry';
    if(/keuken|kitchen/.test(raw))return'kitchen';
    if(/tuin|balkon|garden|buiten|outdoor/.test(raw))return'outdoor';
    return'fallback';
  }
  function photo(row){return PHOTO[photoKey(row)]||PHOTO.fallback;}
  function minutes(row){var m=text(row&&row.description).match(/(\d+)\s*min\b/i);return m?parseInt(m[1],10):0;}
  function timeLabel(row){return text(row&&row.time)||'Hele dag';}
  function status(row){if(row&&row.completed)return{label:'Afgerond',done:true};if(row&&row.flexible)return{label:'Flexibel gepland',done:false};return{label:'Gepland',done:false};}

  function removeLegacyCleaningRows(rows){
    var nodes=Array.prototype.slice.call(document.querySelectorAll('#cal-events .cal-event'));
    rows.forEach(function(row,index){if(isCleaning(row)&&nodes[index]&&nodes[index].parentNode)nodes[index].parentNode.removeChild(nodes[index]);});
  }

  function card(row,index){
    var meta=[timeLabel(row)];var min=minutes(row);if(min)meta.push(min+' min');if(text(row&&row.who))meta.push(text(row.who));var st=status(row);
    return '<button type="button" class="cal-cleaning-card" data-cal-cleaning-index="'+index+'">'
      +'<span class="cal-cleaning-photo" style="background-image:url(\''+esc(photo(row))+'\')" aria-hidden="true"></span>'
      +'<span class="cal-cleaning-body"><span class="cal-cleaning-name">'+esc(displayTitle(row))+'</span><span class="cal-cleaning-meta"><strong>Schoonmaken</strong><span>·</span><span>'+meta.map(esc).join(' · ')+'</span></span><span class="cal-cleaning-status'+(st.done?' done':'')+'">'+esc(st.label)+'</span></span>'
      +'<span class="cal-cleaning-chevron">'+ICON.chevron+'</span></button>';
  }
  function section(rows){return '<section class="cal-cleaning-summary"><div class="cal-cleaning-summary-title">'+ICON.clean+'<span>Geplande schoonmaak'+(rows.length===1?'':'beurten')+'</span></div><div class="cal-cleaning-summary-list">'+rows.map(card).join('')+'</div></section>';}

  function bind(root){root.querySelectorAll('[data-cal-cleaning-index]').forEach(function(btn){btn.onclick=function(){var index=parseInt(btn.getAttribute('data-cal-cleaning-index'),10);var row=currentRows[index];if(row)openCleaning(row);};});}

  function decorate(){
    var root=document.getElementById('cal-events');if(!root)return;
    var visible=visibleEvents();removeLegacyCleaningRows(visible);
    currentRows=visible.filter(isCleaning);
    if(!currentRows.length)return;
    var holder=document.createElement('div');holder.innerHTML=section(currentRows);var node=holder.firstElementChild;if(!node)return;
    var meal=root.querySelector('.cal-meal-summary');if(meal)root.insertBefore(node,meal);else root.appendChild(node);
    bind(node);
  }

  function occurrenceId(row){var ids=Array.isArray(row&&row.cleaningOccurrenceIds)?row.cleaningOccurrenceIds:[];return text(row&&row.cleaningOccurrenceId)||text(row&&row.sourceId)||text(ids[0]);}
  function resolveRoomId(row){
    var id=occurrenceId(row);if(!id)return'';
    try{var repo=window.CleaningHouseholdRepository,snap=repo&&repo.snapshot?repo.snapshot():null,data=snap&&snap.data||{},occ=data.occurrences&&data.occurrences[id];return text(occ&&occ.roomId);}catch(e){return'';}
  }
  function openCleaning(row){
    if(typeof window.showScreen==='function')window.showScreen('cleaning');
    var tries=0,timer=window.setInterval(function(){
      tries++;
      var roomId=resolveRoomId(row),experience=window.CleaningTurnExperience;
      if(roomId&&experience&&typeof experience.openRoom==='function'){
        window.clearInterval(timer);experience.openRoom(roomId);return;
      }
      if(tries>100){window.clearInterval(timer);if(typeof window.showToast==='function')window.showToast('Schoonmaakbeurt geopend');}
    },50);
  }

  function install(){
    if(installed||!window.CalendarMealPlanIntegration||typeof window.renderCalEvents!=='function')return false;
    originalRenderEvents=window.renderCalEvents;
    window.renderCalEvents=function(){var result=originalRenderEvents.apply(this,arguments);decorate();return result;};
    window.renderCalEvents.__familyappCleaningPresentationV1=true;
    installed=true;
    if(document.getElementById('screen-cal')&&document.getElementById('screen-cal').classList.contains('active'))window.renderCalEvents();
    return true;
  }
  function start(){if(install())return;var attempts=0,timer=window.setInterval(function(){attempts++;if(install()||attempts>160)window.clearInterval(timer);},50);}

  window.CalendarCleaningPresentationV1={version:VERSION,install:install,decorate:decorate,openCleaning:openCleaning,isCleaning:isCleaning};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
