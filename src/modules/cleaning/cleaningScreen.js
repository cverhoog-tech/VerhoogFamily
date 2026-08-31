'use strict';
// ============================================================
// SCHOONMAKEN — module shell (FASE A)
//
// Geïsoleerd, module-scoped scherm. Rendert uitsluitend binnen
// #cleaning-content (binnen #screen-cleaning). Raakt geen andere
// schermen, geen Firebase, geen Taken-/Agenda-/Boodschappenstate.
//
// Bronnen:
//   FamilyApp-Schoonmaken-module-architectuur.md (secties 2-3)
//   FamilyApp-Schoonmaken-visual-spec.md (secties 2-5)
//
// FASE A bevat alleen de shell: drie tabs (Overzicht/Planning/Kamers)
// + de Kamers/Gepland-per-kamer toggle, met lege-staat content.
// Geen Firebase-schema, geen planner, geen Taken-/Agenda-/
// Boodschappenintegratie — dat volgt pas in latere, apart
// goedgekeurde fases (zie architectuurdocument sectie 21).
// ============================================================
(function(){
  var cleaningTab = 'overzicht';        // 'overzicht' | 'planning' | 'kamers'
  var cleaningKamersView = 'kamers';    // 'kamers' | 'gepland'

  function esc(s){
    return String(s==null?'':s).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function tabButton(id,label){
    var active = cleaningTab === id;
    return '<button class="cleaning-tab'+(active?' active':'')+'" data-cleaning-tab="'+id+'">'+esc(label)+'</button>';
  }

  function statChip(label,value,status){
    return '<div class="cleaning-stat cleaning-stat--'+status+'">'
      +'<div class="cleaning-stat-value">'+esc(value)+'</div>'
      +'<div class="cleaning-stat-label">'+esc(label)+'</div>'
      +'</div>';
  }

  function heroStatsHtml(){
    return ''
      + statChip('Gepland','0','gepland')
      + statChip('Flexibel','0','flexibel')
      + statChip('Wacht op akkoord','0','akkoord')
      + statChip('Afgerond','0','afgerond');
  }

  function heroHtml(){
    return ''
      +'<div class="cleaning-hero">'
        +'<div class="cleaning-hero-bg" aria-hidden="true"></div>'
        +'<div class="cleaning-hero-content">'
          +'<div class="cleaning-hero-label">Huisstatus</div>'
          +'<div class="cleaning-hero-title">Nog geen kamers ingesteld</div>'
          +'<div class="cleaning-hero-sub">Voeg kamers en routines toe om je schoonmaakplanning te starten.</div>'
          +'<div class="cleaning-hero-stats">'+heroStatsHtml()+'</div>'
        +'</div>'
      +'</div>';
  }

  function compactHeroHtml(label){
    return ''
      +'<div class="cleaning-hero cleaning-hero--compact">'
        +'<div class="cleaning-hero-bg" aria-hidden="true"></div>'
        +'<div class="cleaning-hero-content">'
          +'<div class="cleaning-hero-label">'+esc(label)+'</div>'
          +'<div class="cleaning-hero-stats">'+heroStatsHtml()+'</div>'
        +'</div>'
      +'</div>';
  }

  function emptyState(icon,title,sub){
    return '<div class="cleaning-empty">'
      +'<div class="cleaning-empty-icon">'+icon+'</div>'
      +'<div class="cleaning-empty-title">'+esc(title)+'</div>'
      +'<div class="cleaning-empty-sub">'+esc(sub)+'</div>'
      +'</div>';
  }

  function quickAction(icon,label,target){
    return '<button class="cleaning-quick-action" data-cleaning-quick="'+target+'">'
      +'<span class="cleaning-quick-icon">'+icon+'</span>'
      +'<span class="cleaning-quick-label">'+esc(label)+'</span>'
      +'</button>';
  }

  function overzichtHtml(){
    return ''
      + heroHtml()
      + '<div class="cleaning-section-title">Aandacht nodig</div>'
      + emptyState('🧺','Niets dat aandacht vraagt','Zodra er een voorstel of conflict is, verschijnt het hier.')
      + '<div class="cleaning-section-title">Snelle acties</div>'
      + '<div class="cleaning-quick-actions">'
        + quickAction('🧹','Kamers beheren','kamers')
        + quickAction('📅','Planning bekijken','planning')
      + '</div>'
      + '<div class="cleaning-section-title">Recente activiteit</div>'
      + emptyState('📋','Nog geen activiteit','Afgeronde schoonmaakbeurten verschijnen hier terug.');
  }

  function planningHtml(){
    return ''
      + '<div class="cleaning-section-title">Planning</div>'
      + emptyState('🗓️','Weekplanner volgt binnenkort','Hier verschijnt straks het conceptweekplan met voorstellen per gezinslid.');
  }

  function kamersHtml(){
    var toggle = ''
      +'<div class="cleaning-toggle">'
        +'<button class="cleaning-toggle-btn'+(cleaningKamersView==='kamers'?' active':'')+'" data-cleaning-view="kamers">Kamers</button>'
        +'<button class="cleaning-toggle-btn'+(cleaningKamersView==='gepland'?' active':'')+'" data-cleaning-view="gepland">Gepland per kamer</button>'
      +'</div>';

    var body = cleaningKamersView === 'kamers'
      ? emptyState('🚪','Nog geen kamers','Voeg je eerste kamer toe om routines en benodigdheden bij te houden.')
      : compactHeroHtml('Dit staat er in huis gepland')
        + emptyState('📍','Nog niets gepland per kamer','Zodra kamers en routines bestaan, zie je hier het huisbrede planningsoverzicht.');

    return '<div class="cleaning-section-title">Kamers</div>' + toggle + body;
  }

  function tabContentHtml(){
    if(cleaningTab === 'planning') return planningHtml();
    if(cleaningTab === 'kamers') return kamersHtml();
    return overzichtHtml();
  }

  function attachDelegation(root){
    root.querySelectorAll('[data-cleaning-tab]').forEach(function(btn){
      btn.onclick = function(){ setCleaningTab(btn.getAttribute('data-cleaning-tab')); };
    });
    root.querySelectorAll('[data-cleaning-view]').forEach(function(btn){
      btn.onclick = function(){ setCleaningKamersView(btn.getAttribute('data-cleaning-view')); };
    });
    root.querySelectorAll('[data-cleaning-quick]').forEach(function(btn){
      btn.onclick = function(){ setCleaningTab(btn.getAttribute('data-cleaning-quick')); };
    });
  }

  function renderCleaning(){
    var el = document.getElementById('cleaning-content');
    if(!el) return;
    var html = ''
      +'<div class="cleaning-tabs">'
        + tabButton('overzicht','Overzicht')
        + tabButton('planning','Planning')
        + tabButton('kamers','Kamers')
      +'</div>'
      +'<div class="cleaning-tab-content">'+tabContentHtml()+'</div>';
    el.innerHTML = html;
    attachDelegation(el);
  }

  function setCleaningTab(tab){
    if(cleaningTab === tab) return;
    cleaningTab = tab;
    renderCleaning();
  }

  function setCleaningKamersView(view){
    if(cleaningKamersView === view) return;
    cleaningKamersView = view;
    renderCleaning();
  }

  window.renderCleaning = renderCleaning;
})();
