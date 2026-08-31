import './cleaningDomain.js?v=1';
import './cleaningRepositoryContract.js?v=1';
import './cleaningHouseholdRepository.js?v=1';

const state = {
  primaryTab: 'overview',
  roomView: 'rooms'
};

function escapeText(value){
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function tabButton(id, label){
  const active = state.primaryTab === id;
  return '<button type="button" class="cleaning-tab'+(active?' is-active':'')+'" data-cleaning-tab="'+id+'" aria-pressed="'+(active?'true':'false')+'">'+escapeText(label)+'</button>';
}

function emptyCard(icon, title, copy){
  return '<section class="cleaning-empty-card" aria-live="polite">'
    +'<div class="cleaning-empty-icon" aria-hidden="true">'+escapeText(icon)+'</div>'
    +'<h2 class="cleaning-empty-title">'+escapeText(title)+'</h2>'
    +'<p class="cleaning-empty-copy">'+escapeText(copy)+'</p>'
    +'</section>';
}

function roomsPanel(){
  const roomsActive = state.roomView === 'rooms';
  const plannedActive = state.roomView === 'planned';
  return '<div class="cleaning-room-toggle" role="group" aria-label="Kamerweergave">'
    +'<button type="button" class="cleaning-room-toggle-btn'+(roomsActive?' is-active':'')+'" data-cleaning-room-view="rooms" aria-pressed="'+(roomsActive?'true':'false')+'">Kamers</button>'
    +'<button type="button" class="cleaning-room-toggle-btn'+(plannedActive?' is-active':'')+'" data-cleaning-room-view="planned" aria-pressed="'+(plannedActive?'true':'false')+'">Gepland per kamer</button>'
    +'</div>'
    +(roomsActive
      ? emptyCard('🛋️','Kamers','Hier komen straks de kamers van het huishouden en hun vaste schoonmaakroutines.')
      : emptyCard('📍','Gepland per kamer','Hier komt straks in één overzicht wat er per kamer gepland, flexibel of afgerond is.'));
}

function panelContent(){
  if(state.primaryTab === 'planning'){
    return emptyCard('🗓️','Planning','Hier komt straks het weekvoorstel met verdeling, momenten en goedkeuringen.');
  }
  if(state.primaryTab === 'rooms') return roomsPanel();
  return emptyCard('✨','Huisoverzicht','Hier komt straks de huisstatus, aandachtspunten, snelle acties en recente activiteit.');
}

function bind(root){
  root.querySelectorAll('[data-cleaning-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      state.primaryTab = button.getAttribute('data-cleaning-tab') || 'overview';
      renderCleaningScreen(root);
    });
  });

  root.querySelectorAll('[data-cleaning-room-view]').forEach((button) => {
    button.addEventListener('click', () => {
      state.roomView = button.getAttribute('data-cleaning-room-view') || 'rooms';
      renderCleaningScreen(root);
    });
  });
}

export function renderCleaningScreen(target){
  const root = target || document.getElementById('cleaning-content');
  if(!root) return;

  root.innerHTML = '<div class="cleaning-shell">'
    +'<header class="cleaning-intro">'
      +'<p class="cleaning-kicker">Huishouden</p>'
      +'<h1 class="cleaning-title">Schoonmaken</h1>'
      +'<p class="cleaning-subtitle">Kamers, routines en weekplanning op één plek.</p>'
    +'</header>'
    +'<nav class="cleaning-tabs" aria-label="Schoonmaken onderdelen">'
      +tabButton('overview','Overzicht')
      +tabButton('planning','Planning')
      +tabButton('rooms','Kamers')
    +'</nav>'
    +'<div class="cleaning-panel">'+panelContent()+'</div>'
  +'</div>';

  bind(root);
}
