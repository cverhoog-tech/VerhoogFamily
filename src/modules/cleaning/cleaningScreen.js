import './cleaningDomain.js?v=4';
import './cleaningRepositoryContract.js?v=4';
import './cleaningHouseholdRepository.js?v=4';

const ROOM_TYPES = Object.freeze([
  {id:'living-room', label:'Woonkamer', icon:'🛋️'},
  {id:'kitchen', label:'Keuken', icon:'🍳'},
  {id:'bathroom', label:'Badkamer', icon:'🛁'},
  {id:'toilet', label:'Toilet', icon:'🚽'},
  {id:'bedroom', label:'Slaapkamer', icon:'🛏️'},
  {id:'kids-room', label:'Kinderkamer', icon:'🧸'},
  {id:'hall', label:'Hal', icon:'🚪'},
  {id:'laundry', label:'Wasruimte', icon:'🧺'},
  {id:'outdoor', label:'Balkon / tuin', icon:'🌿'},
  {id:'custom', label:'Eigen ruimte', icon:'✨'}
]);

const state = {
  primaryTab: 'overview',
  roomView: 'rooms',
  repository: null,
  roomForm: {
    open: false,
    mode: 'create',
    roomId: null,
    name: '',
    type: 'living-room',
    submitting: false,
    deleting: false,
    deleteConfirm: false,
    error: ''
  },
  roomNotice: ''
};

let repositoryUnsubscribe = null;
let repositorySubscribing = false;
let mountedRoot = null;

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

function roomType(type){
  return ROOM_TYPES.find((entry) => entry.id === type) || ROOM_TYPES[ROOM_TYPES.length - 1];
}

function repositoryRooms(){
  const repository = state.repository;
  const raw = repository && repository.data && repository.data.rooms;
  if(!raw || typeof raw !== 'object') return [];
  return Object.keys(raw).map((key) => {
    const value = raw[key] && typeof raw[key] === 'object' ? raw[key] : {};
    return Object.assign({id:key}, value);
  }).filter((room) => room && room.active !== false)
    .sort((a,b) => {
      const aCreated = Number(a.createdAt || 0);
      const bCreated = Number(b.createdAt || 0);
      if(aCreated !== bCreated) return aCreated - bCreated;
      return String(a.name || '').localeCompare(String(b.name || ''), 'nl');
    });
}

function findRoom(roomId){
  return repositoryRooms().find((room) => String(room.id) === String(roomId)) || null;
}

function roomFormMarkup(){
  if(!state.roomForm.open) return '';
  const editing = state.roomForm.mode === 'edit';
  const busy = state.roomForm.submitting || state.roomForm.deleting;
  const options = ROOM_TYPES.map((type) => '<option value="'+escapeText(type.id)+'"'+(state.roomForm.type===type.id?' selected':'')+'>'+escapeText(type.icon+' '+type.label)+'</option>').join('');
  const danger = !editing ? '' : (
    '<div class="cleaning-room-danger">'
      +(!state.roomForm.deleteConfirm
        ? '<button type="button" class="cleaning-danger-link" data-cleaning-room-delete-open'+(busy?' disabled':'')+'>Kamer verwijderen</button>'
        : '<div class="cleaning-delete-confirm" role="alert">'
          +'<div><strong>Kamer verwijderen?</strong><span>De kamer verdwijnt uit jullie actieve kamers. Historie en toekomstige verwijzingen blijven veilig bewaard.</span></div>'
          +'<div class="cleaning-delete-actions">'
            +'<button type="button" class="cleaning-secondary-button" data-cleaning-room-delete-cancel'+(busy?' disabled':'')+'>Niet verwijderen</button>'
            +'<button type="button" class="cleaning-danger-button" data-cleaning-room-delete-confirm'+(busy?' disabled':'')+'>'+(state.roomForm.deleting?'Verwijderen…':'Ja, verwijder kamer')+'</button>'
          +'</div>'
        +'</div>')
    +'</div>'
  );

  return '<form class="cleaning-room-form" data-cleaning-room-form>'
    +'<div class="cleaning-form-heading">'
      +'<div><p class="cleaning-form-kicker">'+(editing?'Kamer aanpassen':'Nieuwe ruimte')+'</p><h3>'+(editing?'Kamer bewerken':'Nieuwe kamer')+'</h3></div>'
      +'<button type="button" class="cleaning-icon-button" data-cleaning-room-cancel aria-label="Sluiten"'+(busy?' disabled':'')+'>✕</button>'
    +'</div>'
    +'<label class="cleaning-field">'
      +'<span>Naam</span>'
      +'<input type="text" name="roomName" maxlength="60" autocomplete="off" placeholder="Bijv. Badkamer boven" value="'+escapeText(state.roomForm.name)+'" data-cleaning-room-name'+(busy?' disabled':'')+'>'
    +'</label>'
    +'<label class="cleaning-field">'
      +'<span>Type kamer</span>'
      +'<select name="roomType" data-cleaning-room-type'+(busy?' disabled':'')+'>'+options+'</select>'
    +'</label>'
    +(state.roomForm.error?'<p class="cleaning-form-error" role="alert">'+escapeText(state.roomForm.error)+'</p>':'')
    +'<div class="cleaning-form-actions">'
      +'<button type="button" class="cleaning-secondary-button" data-cleaning-room-cancel'+(busy?' disabled':'')+'>Annuleren</button>'
      +'<button type="submit" class="cleaning-primary-button"'+(busy?' disabled':'')+'>'+(state.roomForm.submitting?'Opslaan…':(editing?'Wijzigingen opslaan':'Kamer toevoegen'))+'</button>'
    +'</div>'
    +danger
  +'</form>';
}

function roomCardsMarkup(rooms){
  return '<div class="cleaning-room-grid">'+rooms.map((room) => {
    const type = roomType(room.type);
    return '<article class="cleaning-room-card" data-cleaning-room-id="'+escapeText(room.id)+'">'
      +'<div class="cleaning-room-card-icon" aria-hidden="true">'+escapeText(type.icon)+'</div>'
      +'<div class="cleaning-room-card-copy">'
        +'<h3>'+escapeText(room.name || type.label)+'</h3>'
        +'<p>'+escapeText(type.label)+' · Nog geen routine</p>'
      +'</div>'
      +'<div class="cleaning-room-card-actions">'
        +'<span class="cleaning-room-card-status">Nieuw</span>'
        +'<button type="button" class="cleaning-room-edit-button" data-cleaning-room-edit="'+escapeText(room.id)+'" aria-label="'+escapeText((room.name||type.label)+' bewerken')+'">Bewerken</button>'
      +'</div>'
    +'</article>';
  }).join('')+'</div>';
}

function roomsContent(){
  const repository = state.repository;
  if(repository && repository.error){
    return '<section class="cleaning-status-card cleaning-status-error" role="alert">'
      +'<strong>Kamers konden niet worden geladen</strong>'
      +'<span>'+escapeText(repository.error)+'</span>'
    +'</section>';
  }

  if(!repository || repository.ready !== true){
    return '<section class="cleaning-status-card" aria-live="polite">'
      +'<strong>Kamers laden…</strong>'
      +'<span>We verbinden met het actieve huishouden.</span>'
    +'</section>';
  }

  const rooms = repositoryRooms();
  const notice = state.roomNotice ? '<p class="cleaning-room-notice" role="status">'+escapeText(state.roomNotice)+'</p>' : '';
  const body = rooms.length
    ? roomCardsMarkup(rooms)
    : emptyCard('🛋️','Nog geen kamers','Voeg je eerste kamer toe. Routines en planning komen pas in de volgende stappen.');

  return notice + roomFormMarkup() + body;
}

function roomsPanel(){
  const roomsActive = state.roomView === 'rooms';
  const plannedActive = state.roomView === 'planned';
  return '<div class="cleaning-room-toggle" role="group" aria-label="Kamerweergave">'
    +'<button type="button" class="cleaning-room-toggle-btn'+(roomsActive?' is-active':'')+'" data-cleaning-room-view="rooms" aria-pressed="'+(roomsActive?'true':'false')+'">Kamers</button>'
    +'<button type="button" class="cleaning-room-toggle-btn'+(plannedActive?' is-active':'')+'" data-cleaning-room-view="planned" aria-pressed="'+(plannedActive?'true':'false')+'">Gepland per kamer</button>'
    +'</div>'
    +(roomsActive
      ? '<div class="cleaning-room-toolbar"><div><h2>Kamers</h2><p>Beheer de ruimtes van jullie huishouden.</p></div><button type="button" class="cleaning-add-room-button" data-cleaning-room-add>＋ Nieuwe kamer</button></div>'+roomsContent()
      : emptyCard('📍','Gepland per kamer','Hier komt straks in één overzicht wat er per kamer gepland, flexibel of afgerond is.'));
}

function panelContent(){
  if(state.primaryTab === 'planning'){
    return emptyCard('🗓️','Planning','Hier komt straks het weekvoorstel met verdeling, momenten en goedkeuringen.');
  }
  if(state.primaryTab === 'rooms') return roomsPanel();
  return emptyCard('✨','Huisoverzicht','Hier komt straks de huisstatus, aandachtspunten, snelle acties en recente activiteit.');
}

function readableRoomError(error){
  const code = String(error && error.message || error || 'Kamer kon niet worden opgeslagen.');
  if(code.indexOf('CLEANING_ROOM_NAME_REQUIRED')>-1) return 'Geef de kamer eerst een naam.';
  if(code.indexOf('CLEANING_ROOM_INACTIVE')>-1) return 'Deze kamer is al verwijderd.';
  if(code.indexOf('CLEANING_ROOM_NOT_FOUND')>-1) return 'Deze kamer bestaat niet meer. Ververs de lijst en probeer opnieuw.';
  if(code.indexOf('CLEANING_ROOM_ID_REQUIRED')>-1) return 'De kamer kon niet worden herkend.';
  if(code.indexOf('ACTIVE_HOUSEHOLD_REQUIRED')>-1) return 'Er is geen actief huishouden beschikbaar.';
  if(code.indexOf('HOUSEHOLD_CONTEXT_CHANGED')>-1) return 'Het actieve huishouden veranderde tijdens de actie. Probeer opnieuw.';
  if(code.indexOf('PERMISSION_DENIED')>-1 || code.toLowerCase().indexOf('permission')>-1) return 'Firebase staat deze kamerwijziging nog niet toe voor dit huishouden.';
  return code;
}

function resetRoomForm(){
  state.roomForm = {
    open: false,
    mode: 'create',
    roomId: null,
    name: '',
    type: 'living-room',
    submitting: false,
    deleting: false,
    deleteConfirm: false,
    error: ''
  };
}

function openCreateRoom(root){
  resetRoomForm();
  state.roomForm.open = true;
  state.roomNotice = '';
  renderCleaningScreen(root);
  window.setTimeout(() => {
    const input = root.querySelector('[data-cleaning-room-name]');
    if(input) input.focus();
  }, 0);
}

function openEditRoom(root,roomId){
  const room = findRoom(roomId);
  if(!room){
    state.roomNotice = 'Kamer niet gevonden.';
    renderCleaningScreen(root);
    return;
  }
  state.roomForm = {
    open: true,
    mode: 'edit',
    roomId: room.id,
    name: String(room.name || ''),
    type: room.type || 'custom',
    submitting: false,
    deleting: false,
    deleteConfirm: false,
    error: ''
  };
  state.roomNotice = '';
  renderCleaningScreen(root);
  window.setTimeout(() => {
    const input = root.querySelector('[data-cleaning-room-name]');
    if(input){input.focus();input.select();}
  }, 0);
}

function renderIfActive(){
  const screen = document.getElementById('screen-cleaning');
  if(!mountedRoot || !mountedRoot.isConnected || !screen || !screen.classList.contains('active')) return;
  renderCleaningScreen(mountedRoot);
}

function ensureRepositorySubscription(){
  if(repositoryUnsubscribe || repositorySubscribing) return;
  const repository = window.CleaningHouseholdRepository;
  if(!repository || typeof repository.subscribe !== 'function') return;
  repositorySubscribing = true;
  const unsubscribe = repository.subscribe((snapshot) => {
    state.repository = snapshot;
    renderIfActive();
  });
  repositoryUnsubscribe = typeof unsubscribe === 'function' ? unsubscribe : function(){};
  repositorySubscribing = false;
}

function submitRoom(root){
  if(state.roomForm.submitting || state.roomForm.deleting) return;
  const name = String(state.roomForm.name || '').trim();
  if(!name){
    state.roomForm.error = 'Geef de kamer eerst een naam.';
    renderCleaningScreen(root);
    return;
  }

  const repository = window.CleaningHouseholdRepository;
  const editing = state.roomForm.mode === 'edit';
  const method = editing ? 'updateRoom' : 'createRoom';
  if(!repository || typeof repository[method] !== 'function'){
    state.roomForm.error = 'De schoonmaakrepository is nog niet beschikbaar.';
    renderCleaningScreen(root);
    return;
  }

  const roomId = state.roomForm.roomId;
  const payload = {name:name,type:state.roomForm.type};
  state.roomForm.name = name;
  state.roomForm.submitting = true;
  state.roomForm.deleteConfirm = false;
  state.roomForm.error = '';
  renderCleaningScreen(root);

  const request = editing ? repository.updateRoom(roomId,payload) : repository.createRoom(payload);
  request.then(() => {
    resetRoomForm();
    state.roomNotice = editing ? 'Kamer bijgewerkt ✓' : 'Kamer toegevoegd ✓';
    renderCleaningScreen(root);
    window.setTimeout(() => {
      if(state.roomNotice){
        state.roomNotice = '';
        renderIfActive();
      }
    }, 2500);
  }).catch((error) => {
    state.roomForm.submitting = false;
    state.roomForm.error = readableRoomError(error);
    renderCleaningScreen(root);
  });
}

function removeRoom(root){
  if(state.roomForm.mode !== 'edit' || state.roomForm.deleting || state.roomForm.submitting) return;
  const repository = window.CleaningHouseholdRepository;
  if(!repository || typeof repository.removeRoom !== 'function'){
    state.roomForm.error = 'De schoonmaakrepository is nog niet beschikbaar.';
    renderCleaningScreen(root);
    return;
  }
  const roomId = state.roomForm.roomId;
  state.roomForm.deleting = true;
  state.roomForm.error = '';
  renderCleaningScreen(root);

  repository.removeRoom(roomId).then(() => {
    resetRoomForm();
    state.roomNotice = 'Kamer verwijderd ✓';
    renderCleaningScreen(root);
    window.setTimeout(() => {
      if(state.roomNotice){
        state.roomNotice = '';
        renderIfActive();
      }
    }, 2500);
  }).catch((error) => {
    state.roomForm.deleting = false;
    state.roomForm.error = readableRoomError(error);
    renderCleaningScreen(root);
  });
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

  const addButton = root.querySelector('[data-cleaning-room-add]');
  if(addButton) addButton.addEventListener('click', () => openCreateRoom(root));

  root.querySelectorAll('[data-cleaning-room-edit]').forEach((button) => {
    button.addEventListener('click', () => openEditRoom(root,button.getAttribute('data-cleaning-room-edit')));
  });

  root.querySelectorAll('[data-cleaning-room-cancel]').forEach((button) => {
    button.addEventListener('click', () => {
      if(state.roomForm.submitting || state.roomForm.deleting) return;
      resetRoomForm();
      renderCleaningScreen(root);
    });
  });

  const deleteOpen = root.querySelector('[data-cleaning-room-delete-open]');
  if(deleteOpen) deleteOpen.addEventListener('click', () => {
    state.roomForm.deleteConfirm = true;
    state.roomForm.error = '';
    renderCleaningScreen(root);
  });

  const deleteCancel = root.querySelector('[data-cleaning-room-delete-cancel]');
  if(deleteCancel) deleteCancel.addEventListener('click', () => {
    if(state.roomForm.deleting) return;
    state.roomForm.deleteConfirm = false;
    renderCleaningScreen(root);
  });

  const deleteConfirm = root.querySelector('[data-cleaning-room-delete-confirm]');
  if(deleteConfirm) deleteConfirm.addEventListener('click', () => removeRoom(root));

  const nameInput = root.querySelector('[data-cleaning-room-name]');
  if(nameInput) nameInput.addEventListener('input', () => {
    state.roomForm.name = nameInput.value;
    if(state.roomForm.error) state.roomForm.error = '';
  });

  const typeSelect = root.querySelector('[data-cleaning-room-type]');
  if(typeSelect) typeSelect.addEventListener('change', () => {
    state.roomForm.type = typeSelect.value || 'custom';
  });

  const form = root.querySelector('[data-cleaning-room-form]');
  if(form) form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitRoom(root);
  });
}

export function renderCleaningScreen(target){
  const root = target || document.getElementById('cleaning-content');
  if(!root) return;
  mountedRoot = root;
  ensureRepositorySubscription();

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