import './cleaningDomain.js?v=6';
import './cleaningPlannerContract.js?v=1';
import './cleaningPlanPersistenceContract.js?v=1';
import './cleaningRepositoryContract.js?v=7';
import './cleaningHouseholdRepository.js?v=7';
import { routineTemplatesForRoomType } from './cleaningRoutineTemplates.js?v=1';

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

const PRIORITY_LABELS = Object.freeze({
  BASIC:'Basis',
  NORMAL:'Normaal',
  EXTRA:'Extra'
});

const state = {
  primaryTab: 'overview',
  roomView: 'rooms',
  repository: null,
  templatePending: null,
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
  routineForm: {
    open: false,
    mode: 'create',
    routineId: null,
    roomId: null,
    title: '',
    intervalDays: 7,
    estimatedMinutes: 15,
    priority: 'NORMAL',
    submitting: false,
    deleting: false,
    deleteConfirm: false,
    error: ''
  },
  planning: {
    submitting: false,
    error: '',
    notice: '',
    memberFilterUid: ''
  },
  members: [],
  roomNotice: ''
};

let repositoryUnsubscribe = null;
let repositorySubscribing = false;
let memberUnsubscribe = null;
let memberSubscribing = false;
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

function repositoryRoutinesForRoom(roomId){
  const repository = state.repository;
  const raw = repository && repository.data && repository.data.routines;
  if(!raw || typeof raw !== 'object') return [];
  return Object.keys(raw).map((key) => {
    const value = raw[key] && typeof raw[key] === 'object' ? raw[key] : {};
    return Object.assign({id:key}, value);
  }).filter((routine) => routine && routine.active !== false && String(routine.roomId) === String(roomId))
    .sort((a,b) => {
      const aCreated = Number(a.createdAt || 0);
      const bCreated = Number(b.createdAt || 0);
      if(aCreated !== bCreated) return aCreated - bCreated;
      return String(a.title || '').localeCompare(String(b.title || ''), 'nl');
    });
}

function findRoom(roomId){
  return repositoryRooms().find((room) => String(room.id) === String(roomId)) || null;
}

function findRoutine(routineId){
  const repository = state.repository;
  const raw = repository && repository.data && repository.data.routines;
  if(!raw || typeof raw !== 'object') return null;
  const routine = raw[routineId];
  return routine && typeof routine === 'object' && routine.active !== false
    ? Object.assign({id:routineId}, routine)
    : null;
}

function rawRoom(roomId){
  const raw = state.repository && state.repository.data && state.repository.data.rooms;
  const room = raw && raw[roomId];
  return room && typeof room === 'object' ? Object.assign({id:roomId},room) : null;
}

function activeRoutines(){
  const raw = state.repository && state.repository.data && state.repository.data.routines;
  if(!raw || typeof raw !== 'object') return [];
  return Object.keys(raw).map((key) => Object.assign({id:key},raw[key] || {}))
    .filter((routine) => routine.active !== false && rawRoom(routine.roomId) && rawRoom(routine.roomId).active !== false);
}

function householdMembers(){
  const bridge = window.HouseholdIdentityFirebaseBridge;
  if(!bridge || typeof bridge.getMembers !== 'function') return state.members.slice();
  try{
    const members = bridge.getMembers();
    return Array.isArray(members) ? members.slice() : state.members.slice();
  }catch(error){
    return state.members.slice();
  }
}

function memberName(uid){
  const member = householdMembers().find((entry) => String(entry.uid || '') === String(uid || ''));
  return member ? String(member.displayName || member.name || 'Gezinslid') : 'Gezinslid';
}

function currentWeekWindow(){
  const start = new Date();
  start.setHours(0,0,0,0);
  const daysSinceMonday = (start.getDay()+6)%7;
  start.setDate(start.getDate()-daysSinceMonday);
  const end = new Date(start.getTime());
  end.setDate(end.getDate()+7);
  return {startAt:start.getTime(),endAt:end.getTime()};
}

function formatWeekWindow(windowValue){
  try{
    const formatter = new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short'});
    return formatter.format(new Date(windowValue.startAt))+' – '+formatter.format(new Date(windowValue.endAt-1));
  }catch(error){
    return 'Deze week';
  }
}

function currentWeekPlan(){
  const repository = state.repository;
  const plans = repository && repository.data && repository.data.plans;
  const persistence = window.CleaningPlanPersistenceContract;
  if(!plans || typeof plans !== 'object' || !persistence || typeof persistence.planIdForWindow !== 'function') return null;
  try{
    const planId = persistence.planIdForWindow(currentWeekWindow());
    const plan = plans[planId];
    return plan && typeof plan === 'object' ? Object.assign({},plan,{id:planId}) : null;
  }catch(error){
    return null;
  }
}

function occurrencesForPlan(plan){
  const raw = state.repository && state.repository.data && state.repository.data.occurrences;
  if(!plan || !Array.isArray(plan.occurrenceIds) || !raw || typeof raw !== 'object') return [];
  return plan.occurrenceIds.map((id) => {
    const occurrence = raw[id];
    return occurrence && typeof occurrence === 'object' ? Object.assign({},occurrence,{id:id}) : null;
  }).filter((occurrence) => occurrence && occurrence.status !== 'CANCELLED' && String(occurrence.planId) === String(plan.id));
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

function routineFormMarkup(){
  if(!state.routineForm.open) return '';
  const room = findRoom(state.routineForm.roomId);
  if(!room) return '';
  const editing = state.routineForm.mode === 'edit';
  const busy = state.routineForm.submitting || state.routineForm.deleting;
  const danger = !editing ? '' : (
    '<div class="cleaning-room-danger">'
      +(!state.routineForm.deleteConfirm
        ? '<button type="button" class="cleaning-danger-link" data-cleaning-routine-delete-open'+(busy?' disabled':'')+'>Routine verwijderen</button>'
        : '<div class="cleaning-delete-confirm" role="alert">'
          +'<div><strong>Routine verwijderen?</strong><span>De routine verdwijnt uit de actieve planning. Historie en verwijzingen blijven bewaard.</span></div>'
          +'<div class="cleaning-delete-actions">'
            +'<button type="button" class="cleaning-secondary-button" data-cleaning-routine-delete-cancel'+(busy?' disabled':'')+'>Niet verwijderen</button>'
            +'<button type="button" class="cleaning-danger-button" data-cleaning-routine-delete-confirm'+(busy?' disabled':'')+'>'+(state.routineForm.deleting?'Verwijderen…':'Ja, verwijder routine')+'</button>'
          +'</div>'
        +'</div>')
    +'</div>'
  );

  return '<form class="cleaning-room-form cleaning-routine-form" data-cleaning-routine-form>'
    +'<div class="cleaning-form-heading">'
      +'<div><p class="cleaning-form-kicker">Routine voor '+escapeText(room.name)+'</p><h3>'+(editing?'Routine bewerken':'Routine toevoegen')+'</h3></div>'
      +'<button type="button" class="cleaning-icon-button" data-cleaning-routine-cancel aria-label="Sluiten"'+(busy?' disabled':'')+'>✕</button>'
    +'</div>'
    +'<label class="cleaning-field">'
      +'<span>Wat moet er gebeuren?</span>'
      +'<input type="text" maxlength="80" autocomplete="off" placeholder="Bijv. Douche en wastafel schoonmaken" value="'+escapeText(state.routineForm.title)+'" data-cleaning-routine-title'+(busy?' disabled':'')+'>'
    +'</label>'
    +'<div class="cleaning-routine-fields">'
      +'<label class="cleaning-field"><span>Elke hoeveel dagen?</span><input type="number" inputmode="numeric" min="1" max="365" value="'+escapeText(state.routineForm.intervalDays)+'" data-cleaning-routine-interval'+(busy?' disabled':'')+'></label>'
      +'<label class="cleaning-field"><span>Geschatte tijd</span><div class="cleaning-number-with-unit"><input type="number" inputmode="numeric" min="1" max="480" step="1" value="'+escapeText(state.routineForm.estimatedMinutes)+'" data-cleaning-routine-minutes'+(busy?' disabled':'')+'><span>min</span></div></label>'
    +'</div>'
    +'<label class="cleaning-field">'
      +'<span>Prioriteit</span>'
      +'<select data-cleaning-routine-priority'+(busy?' disabled':'')+'>'
        +'<option value="BASIC"'+(state.routineForm.priority==='BASIC'?' selected':'')+'>Basis</option>'
        +'<option value="NORMAL"'+(state.routineForm.priority==='NORMAL'?' selected':'')+'>Normaal</option>'
        +'<option value="EXTRA"'+(state.routineForm.priority==='EXTRA'?' selected':'')+'>Extra</option>'
      +'</select>'
    +'</label>'
    +(state.routineForm.error?'<p class="cleaning-form-error" role="alert">'+escapeText(state.routineForm.error)+'</p>':'')
    +'<div class="cleaning-form-actions">'
      +'<button type="button" class="cleaning-secondary-button" data-cleaning-routine-cancel'+(busy?' disabled':'')+'>Annuleren</button>'
      +'<button type="submit" class="cleaning-primary-button"'+(busy?' disabled':'')+'>'+(state.routineForm.submitting?'Opslaan…':(editing?'Wijzigingen opslaan':'Routine toevoegen'))+'</button>'
    +'</div>'
    +danger
  +'</form>';
}

function routineTemplateMarkup(room){
  const activeKeys = new Set(repositoryRoutinesForRoom(room.id).map((routine) => String(routine.templateKey || '')).filter(Boolean));
  const templates = routineTemplatesForRoomType(room.type).filter((template) => !activeKeys.has(template.key));
  if(!templates.length){
    return '<div class="cleaning-routine-section"><div class="cleaning-routine-section-head"><span>Snelle suggesties</span><span>Alles toegevoegd ✓</span></div></div>';
  }
  return '<div class="cleaning-routine-section">'
    +'<div class="cleaning-routine-section-head"><span>Snelle suggesties</span><span>1 tik om toe te voegen</span></div>'
    +'<div class="cleaning-routine-list">'+templates.map((template) => {
      const pending = !!(state.templatePending && String(state.templatePending.roomId)===String(room.id) && state.templatePending.key===template.key);
      return '<button type="button" class="cleaning-add-routine-button" data-cleaning-template-add="'+escapeText(room.id)+'" data-cleaning-template-key="'+escapeText(template.key)+'"'+(pending?' disabled':'')+'>'
        +(pending?'Toevoegen…':'＋ '+escapeText(template.title)+' · elke '+escapeText(template.intervalDays)+' d · '+escapeText(template.estimatedMinutes)+' min')
      +'</button>';
    }).join('')+'</div>'
  +'</div>';
}

function routineListMarkup(room){
  const routines = repositoryRoutinesForRoom(room.id);
  const activeMarkup = !routines.length
    ? '<div class="cleaning-routine-empty"><span>Nog geen vaste routines</span><button type="button" class="cleaning-add-routine-button" data-cleaning-routine-add="'+escapeText(room.id)+'">＋ Eigen routine</button></div>'
    : '<div class="cleaning-routine-section">'
      +'<div class="cleaning-routine-section-head"><span>'+routines.length+' '+(routines.length===1?'routine':'routines')+'</span><button type="button" class="cleaning-add-routine-button" data-cleaning-routine-add="'+escapeText(room.id)+'">＋ Eigen routine</button></div>'
      +'<div class="cleaning-routine-list">'+routines.map((routine) => {
        const priority = PRIORITY_LABELS[routine.priority] || PRIORITY_LABELS.NORMAL;
        return '<div class="cleaning-routine-item">'
          +'<div class="cleaning-routine-dot" aria-hidden="true"></div>'
          +'<div class="cleaning-routine-copy"><strong>'+escapeText(routine.title)+'</strong><span>Elke '+escapeText(routine.intervalDays)+' dagen · '+escapeText(routine.estimatedMinutes)+' min</span></div>'
          +'<div class="cleaning-routine-item-actions">'
            +'<span class="cleaning-priority-badge" data-priority="'+escapeText(routine.priority||'NORMAL')+'">'+escapeText(priority)+'</span>'
            +'<button type="button" class="cleaning-routine-edit-button" data-cleaning-routine-edit="'+escapeText(routine.id)+'" aria-label="'+escapeText((routine.title||'Routine')+' bewerken')+'">Bewerken</button>'
          +'</div>'
        +'</div>';
      }).join('')+'</div>'
    +'</div>';
  return activeMarkup + routineTemplateMarkup(room);
}

function roomCardsMarkup(rooms){
  return '<div class="cleaning-room-grid">'+rooms.map((room) => {
    const type = roomType(room.type);
    const routines = repositoryRoutinesForRoom(room.id);
    return '<article class="cleaning-room-card" data-cleaning-room-id="'+escapeText(room.id)+'">'
      +'<div class="cleaning-room-card-main">'
        +'<div class="cleaning-room-card-icon" aria-hidden="true">'+escapeText(type.icon)+'</div>'
        +'<div class="cleaning-room-card-copy">'
          +'<h3>'+escapeText(room.name || type.label)+'</h3>'
          +'<p>'+escapeText(type.label)+' · '+(routines.length?(routines.length+' '+(routines.length===1?'routine':'routines')):'Nog geen routine')+'</p>'
        +'</div>'
        +'<div class="cleaning-room-card-actions">'
          +'<span class="cleaning-room-card-status">'+(routines.length?'Actief':'Nieuw')+'</span>'
          +'<button type="button" class="cleaning-room-edit-button" data-cleaning-room-edit="'+escapeText(room.id)+'" aria-label="'+escapeText((room.name||type.label)+' bewerken')+'">Bewerken</button>'
        +'</div>'
      +'</div>'
      +routineListMarkup(room)
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
    : emptyCard('🛋️','Nog geen kamers','Voeg je eerste kamer toe. Daarna kun je per kamer vaste schoonmaakroutines instellen.');

  return notice + roomFormMarkup() + routineFormMarkup() + body;
}

function roomsPanel(){
  const roomsActive = state.roomView === 'rooms';
  const plannedActive = state.roomView === 'planned';
  return '<div class="cleaning-room-toggle" role="group" aria-label="Kamerweergave">'
    +'<button type="button" class="cleaning-room-toggle-btn'+(roomsActive?' is-active':'')+'" data-cleaning-room-view="rooms" aria-pressed="'+(roomsActive?'true':'false')+'">Kamers</button>'
    +'<button type="button" class="cleaning-room-toggle-btn'+(plannedActive?' is-active':'')+'" data-cleaning-room-view="planned" aria-pressed="'+(plannedActive?'true':'false')+'">Gepland per kamer</button>'
    +'</div>'
    +(roomsActive
      ? '<div class="cleaning-room-toolbar"><div><h2>Kamers</h2><p>Beheer ruimtes en vaste schoonmaakroutines.</p></div><button type="button" class="cleaning-add-room-button" data-cleaning-room-add>＋ Nieuwe kamer</button></div>'+roomsContent()
      : emptyCard('📍','Gepland per kamer','Hier komt straks in één overzicht wat er per kamer gepland, flexibel of afgerond is.'));
}

function planFeedbackMarkup(){
  if(state.planning.error){
    return '<p class="cleaning-plan-feedback is-error" role="alert">'+escapeText(state.planning.error)+'</p>';
  }
  if(state.planning.notice){
    return '<p class="cleaning-plan-feedback is-success" role="status">'+escapeText(state.planning.notice)+'</p>';
  }
  return '';
}

function memberLoadsMarkup(plan){
  const loads = plan && plan.summary && Array.isArray(plan.summary.memberLoads) ? plan.summary.memberLoads : [];
  if(!loads.length) return '';
  const selectedUid = String(state.planning.memberFilterUid || '');
  return '<section class="cleaning-plan-loads" aria-label="Verdeling op geschatte tijd">'
    +'<div class="cleaning-plan-section-head"><div><span>Verdeling</span><strong>Eerlijk op geschatte tijd</strong></div><span>'+escapeText(plan.summary.imbalanceMinutes || 0)+' min verschil</span></div>'
    +'<div class="cleaning-plan-load-grid">'+loads.map((load) => {
      const uid = String(load && load.uid || '');
      const active = !!uid && uid === selectedUid;
      return '<div class="cleaning-plan-load'+(active?' is-active':'')+'" data-cleaning-plan-member-filter="'+escapeText(uid)+'" role="button" tabindex="0" aria-pressed="'+(active?'true':'false')+'" aria-label="'+escapeText((active?'Toon alle schoonmaakbeurten':'Filter schoonmaakbeurten op ')+memberName(uid))+'">'
        +'<span>'+escapeText(memberName(uid))+'</span>'
        +'<strong>'+escapeText(load.estimatedMinutes || 0)+' min</strong>'
        +'<small>'+(active?'✓ Filter actief':escapeText(load.bundleCount || 0)+' '+(Number(load.bundleCount)===1?'kamer':'kamers')+' · tik om te filteren')+'</small>'
      +'</div>';
    }).join('')+'</div>'
  +'</section>';
}

function occurrenceCardMarkup(occurrence,hidden){
  const room = rawRoom(occurrence.roomId);
  const type = roomType(room && room.type);
  const checklist = Array.isArray(occurrence.checklist) ? occurrence.checklist : [];
  const assignedUid = Array.isArray(occurrence.assignmentUids) ? occurrence.assignmentUids[0] : null;
  const overdue = occurrence.dueState === 'OVERDUE';
  const roomName = room && room.name ? room.name : 'Ruimte';
  return '<article class="cleaning-plan-card"'+(hidden?' hidden':'')+'>'
    +'<div class="cleaning-plan-card-head">'
      +'<div class="cleaning-plan-room-icon" aria-hidden="true">'+escapeText(type.icon)+'</div>'
      +'<div class="cleaning-plan-room"><h3>'+escapeText(roomName)+'</h3><span>'+escapeText(checklist.length)+' '+(checklist.length===1?'routine':'routines')+' · '+escapeText(occurrence.estimatedMinutes || 0)+' min</span></div>'
      +'<span class="cleaning-plan-due'+(overdue?' is-overdue':'')+'">'+(overdue?'Achterstallig':'Deze week')+'</span>'
    +'</div>'
    +'<div class="cleaning-plan-assignment"><span>Voorgesteld voor</span><strong>'+escapeText(memberName(assignedUid))+'</strong></div>'
    +'<ul class="cleaning-plan-checklist">'+checklist.map((item) => '<li><span aria-hidden="true"></span><strong>'+escapeText(item.title || 'Schoonmaakonderdeel')+'</strong><small>'+escapeText(item.estimatedMinutes || 0)+' min</small></li>').join('')+'</ul>'
    +'<div class="cleaning-plan-card-footer"><span>Nog geen moment gekozen</span><strong>'+escapeText(occurrence.estimatedMinutes || 0)+' min totaal</strong></div>'
  +'</article>';
}

function planningPanel(){
  const repository = state.repository;
  if(repository && repository.error){
    return '<section class="cleaning-status-card cleaning-status-error" role="alert"><strong>Planning kon niet worden geladen</strong><span>'+escapeText(repository.error)+'</span></section>';
  }
  if(!repository || repository.ready !== true){
    return '<section class="cleaning-status-card" aria-live="polite"><strong>Planning laden…</strong><span>We verbinden met het actieve huishouden.</span></section>';
  }

  const windowValue = currentWeekWindow();
  const plan = currentWeekPlan();
  const occurrences = occurrencesForPlan(plan);
  const members = householdMembers();
  const routines = activeRoutines();
  const memberLoads = plan && plan.summary && Array.isArray(plan.summary.memberLoads) ? plan.summary.memberLoads : [];
  const filterableUids = new Set(memberLoads.map((load) => String(load && load.uid || '')).filter(Boolean));
  let selectedUid = String(state.planning.memberFilterUid || '');
  if(selectedUid && !filterableUids.has(selectedUid)){
    state.planning.memberFilterUid = '';
    selectedUid = '';
  }
  const selectedName = selectedUid ? memberName(selectedUid) : '';
  const visibleOccurrences = selectedUid
    ? occurrences.filter((occurrence) => Array.isArray(occurrence.assignmentUids) && occurrence.assignmentUids.map(String).includes(selectedUid))
    : occurrences;
  const visibleMinutes = visibleOccurrences.reduce((sum, occurrence) => sum + Math.max(0, Number(occurrence && occurrence.estimatedMinutes) || 0), 0);
  const occurrenceCards = occurrences.map((occurrence) => {
    const assignedToSelected = !selectedUid || (Array.isArray(occurrence.assignmentUids) && occurrence.assignmentUids.map(String).includes(selectedUid));
    return occurrenceCardMarkup(occurrence, !assignedToSelected);
  }).join('');
  const draft = !plan || plan.status === 'DRAFT';
  const initialBlocked = !plan && (!routines.length || !members.length);
  const disabled = state.planning.submitting || !draft || initialBlocked;
  const summary = plan && plan.summary || {};
  const actionLabel = state.planning.submitting ? 'Weekplan maken…' : (plan ? 'Opnieuw berekenen' : 'Maak weekplan');
  const statusLabel = plan ? (draft ? 'Concept · realtime' : String(plan.status || 'Plan')) : 'Nog niet gemaakt';
  let availability = '';
  if(!routines.length) availability = 'Voeg eerst minimaal één actieve routine toe bij Kamers.';
  else if(!members.length) availability = 'We wachten nog op de actieve huishoudleden.';

  const hero = '<section class="cleaning-plan-hero">'
    +'<div class="cleaning-plan-hero-head"><div><p class="cleaning-plan-eyebrow">Week van '+escapeText(formatWeekWindow(windowValue))+'</p><h2>'+(plan?'Conceptplan voor deze week':'Zet jullie weekplan klaar')+'</h2></div><span class="cleaning-plan-status">'+escapeText(statusLabel)+'</span></div>'
    +'<p class="cleaning-plan-intro">'+(plan?'Routines zijn per kamer gebundeld en eerlijk verdeeld op geschatte tijd.':'Routines die deze week aan de beurt zijn worden per kamer één schoonmaakbeurt, met een eerlijke tijdsverdeling.')+'</p>'
    +'<div class="cleaning-plan-stats">'
      +'<div><strong>'+escapeText(plan ? (summary.occurrenceCount || 0) : routines.length)+'</strong><span>'+(plan?'schoonmaakbeurten':'actieve routines')+'</span></div>'
      +'<div><strong>'+escapeText(plan ? (summary.routineCount || 0) : members.length)+'</strong><span>'+(plan?'routines deze week':'gezinsleden')+'</span></div>'
      +'<div><strong>'+escapeText(plan ? (summary.totalEstimatedMinutes || 0) : '—')+'</strong><span>'+(plan?'minuten totaal':'na berekening')+'</span></div>'
    +'</div>'
    +'<div class="cleaning-plan-actions"><button type="button" class="cleaning-plan-generate" data-cleaning-plan-generate'+(disabled?' disabled':'')+'>'+escapeText(actionLabel)+'</button><span>Dit is alleen een concept; er worden nog geen Taken- of Agenda-items aangemaakt.</span></div>'
    +(availability?'<p class="cleaning-plan-availability">'+escapeText(availability)+'</p>':'')
  +'</section>';

  if(!plan) return '<div class="cleaning-plan-stack">'+planFeedbackMarkup()+hero+'</div>';

  let list;
  if(occurrences.length){
    const filteredEmpty = selectedUid && !visibleOccurrences.length
      ? '<div class="cleaning-inline-empty" role="status">Geen schoonmaakbeurten voor '+escapeText(selectedName)+'. Tik hetzelfde gezinslid nogmaals aan om de volledige week te tonen.</div>'
      : '';
    list = '<section class="cleaning-plan-list"><div class="cleaning-plan-section-head"><div><span>Deze week</span><strong>'+escapeText(visibleOccurrences.length)+' '+(visibleOccurrences.length===1?'schoonmaakbeurt':'schoonmaakbeurten')+(selectedUid?' voor '+escapeText(selectedName):'')+'</strong></div><span>'+escapeText(visibleMinutes)+' min zichtbaar</span></div>'+filteredEmpty+occurrenceCards+'</section>';
  } else {
    list = '<section class="cleaning-plan-empty"><span aria-hidden="true">✓</span><div><strong>Alles is op schema</strong><p>Er zijn deze week geen routines aan de beurt.</p></div></section>';
  }

  return '<div class="cleaning-plan-stack">'+planFeedbackMarkup()+hero+memberLoadsMarkup(plan)+list+'</div>';
}

function panelContent(){
  if(state.primaryTab === 'planning'){
    return planningPanel();
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

function readableRoutineError(error){
  const code = String(error && error.message || error || 'Routine kon niet worden opgeslagen.');
  if(code.indexOf('CLEANING_ROUTINE_TITLE_REQUIRED')>-1) return 'Geef de routine eerst een naam.';
  if(code.indexOf('CLEANING_ROUTINE_ID_REQUIRED')>-1) return 'De routine kon niet worden herkend.';
  if(code.indexOf('CLEANING_ROUTINE_INACTIVE')>-1) return 'Deze routine is al verwijderd.';
  if(code.indexOf('CLEANING_ROUTINE_NOT_FOUND')>-1) return 'Deze routine bestaat niet meer.';
  if(code.indexOf('CLEANING_ROUTINE_ROOM_REQUIRED')>-1) return 'Kies eerst een geldige kamer.';
  if(code.indexOf('CLEANING_ROOM_INACTIVE')>-1 || code.indexOf('CLEANING_ROOM_NOT_FOUND')>-1) return 'Deze kamer is niet meer actief.';
  if(code.indexOf('ACTIVE_HOUSEHOLD_REQUIRED')>-1) return 'Er is geen actief huishouden beschikbaar.';
  if(code.indexOf('HOUSEHOLD_CONTEXT_CHANGED')>-1) return 'Het actieve huishouden veranderde tijdens de actie. Probeer opnieuw.';
  if(code.indexOf('PERMISSION_DENIED')>-1 || code.toLowerCase().indexOf('permission')>-1) return 'Firebase staat deze routinewijziging nog niet toe voor dit huishouden.';
  return code;
}

function readablePlanError(error){
  const code = String(error && error.message || error || 'Het weekplan kon niet worden gemaakt.');
  if(code.indexOf('CLEANING_PLANNER_ACTIVE_MEMBER_REQUIRED')>-1) return 'Er is minimaal één beschikbaar huishoudlid nodig om de schoonmaakbeurten te verdelen.';
  if(code.indexOf('CLEANING_PLAN_NOT_DRAFT')>-1 || code.indexOf('CLEANING_OCCURRENCE_NOT_DRAFT')>-1) return 'Dit weekplan is niet meer alleen een concept en kan daarom niet opnieuw worden berekend.';
  if(code.indexOf('CLEANING_PLAN_PERSISTENCE_UNAVAILABLE')>-1 || code.indexOf('CLEANING_PLANNER')>-1) return 'De weekplanner is nog niet volledig geladen. Probeer het nog een keer.';
  if(code.indexOf('CLEANING_REPOSITORY_CONTEXT_NOT_READY')>-1) return 'De schoonmaakgegevens wisselen nog naar het actieve huishouden. Probeer het zo opnieuw.';
  if(code.indexOf('ACTIVE_HOUSEHOLD_REQUIRED')>-1) return 'Er is geen actief huishouden beschikbaar.';
  if(code.indexOf('ACTIVE_MEMBER_REQUIRED')>-1) return 'Je bent geen actief lid van dit huishouden.';
  if(code.indexOf('HOUSEHOLD_CONTEXT_CHANGED')>-1) return 'Het actieve huishouden veranderde tijdens de berekening. Probeer opnieuw.';
  if(code.indexOf('PERMISSION_DENIED')>-1 || code.toLowerCase().indexOf('permission')>-1) return 'Firebase staat het opslaan van dit weekplan nog niet toe voor dit huishouden.';
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

function resetRoutineForm(){
  state.routineForm = {
    open: false,
    mode: 'create',
    routineId: null,
    roomId: null,
    title: '',
    intervalDays: 7,
    estimatedMinutes: 15,
    priority: 'NORMAL',
    submitting: false,
    deleting: false,
    deleteConfirm: false,
    error: ''
  };
}

function openCreateRoom(root){
  resetRoutineForm();
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
  resetRoutineForm();
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

function openRoutineForm(root,roomId){
  const room = findRoom(roomId);
  if(!room){
    state.roomNotice = 'Kamer niet gevonden.';
    renderCleaningScreen(root);
    return;
  }
  resetRoomForm();
  resetRoutineForm();
  state.routineForm.open = true;
  state.routineForm.roomId = room.id;
  state.roomNotice = '';
  renderCleaningScreen(root);
  window.setTimeout(() => {
    const input = root.querySelector('[data-cleaning-routine-title]');
    if(input) input.focus();
  }, 0);
}

function openEditRoutine(root,routineId){
  const routine = findRoutine(routineId);
  if(!routine){
    state.roomNotice = 'Routine niet gevonden.';
    renderCleaningScreen(root);
    return;
  }
  const room = findRoom(routine.roomId);
  if(!room){
    state.roomNotice = 'De kamer van deze routine is niet meer actief.';
    renderCleaningScreen(root);
    return;
  }
  resetRoomForm();
  state.routineForm = {
    open: true,
    mode: 'edit',
    routineId: routine.id,
    roomId: routine.roomId,
    title: String(routine.title || ''),
    intervalDays: Number(routine.intervalDays) || 7,
    estimatedMinutes: Number(routine.estimatedMinutes) || 15,
    priority: routine.priority || 'NORMAL',
    submitting: false,
    deleting: false,
    deleteConfirm: false,
    error: ''
  };
  state.roomNotice = '';
  renderCleaningScreen(root);
  window.setTimeout(() => {
    const input = root.querySelector('[data-cleaning-routine-title]');
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
    if(state.templatePending){
      const exists = repositoryRoutinesForRoom(state.templatePending.roomId)
        .some((routine) => String(routine.templateKey || '') === state.templatePending.key);
      if(exists) state.templatePending = null;
    }
    renderIfActive();
  });
  repositoryUnsubscribe = typeof unsubscribe === 'function' ? unsubscribe : function(){};
  repositorySubscribing = false;
}

function ensureMemberSubscription(){
  if(memberUnsubscribe || memberSubscribing) return;
  const bridge = window.HouseholdIdentityFirebaseBridge;
  if(!bridge || typeof bridge.subscribe !== 'function') return;
  memberSubscribing = true;
  try{
    const unsubscribe = bridge.subscribe((members) => {
      state.members = Array.isArray(members) ? members.slice() : [];
      renderIfActive();
    });
    memberUnsubscribe = typeof unsubscribe === 'function' ? unsubscribe : function(){};
  }catch(error){
    memberUnsubscribe = null;
  }finally{
    memberSubscribing = false;
  }
}

function generateWeekPlan(root){
  if(state.planning.submitting) return;
  const repository = window.CleaningHouseholdRepository;
  const planner = window.CleaningPlannerContract;
  const availabilityContract = window.CleaningAvailabilityContract;
  const snapshot = state.repository;
  const existingPlan = currentWeekPlan();
  const members = householdMembers();
  const routines = activeRoutines();
  const windowValue = currentWeekWindow();

  if(!snapshot || snapshot.ready !== true){
    state.planning.error = 'De schoonmaakgegevens zijn nog niet geladen.';
    renderCleaningScreen(root);
    return;
  }
  if(!existingPlan && !routines.length){
    state.planning.error = 'Voeg eerst minimaal één actieve routine toe bij Kamers.';
    renderCleaningScreen(root);
    return;
  }
  if(routines.length && !members.length){
    state.planning.error = 'Er is minimaal één actief huishoudlid nodig om de schoonmaakbeurten te verdelen.';
    renderCleaningScreen(root);
    return;
  }
  if(!planner || typeof planner.generateConceptPlan !== 'function' || !repository || typeof repository.saveDraftPlan !== 'function'){
    state.planning.error = 'De weekplanner is nog niet volledig geladen. Probeer het nog een keer.';
    renderCleaningScreen(root);
    return;
  }

  let planningInput = {
    window: windowValue,
    rooms: snapshot.data && snapshot.data.rooms || {},
    routines: snapshot.data && snapshot.data.routines || {},
    members: members,
    availability: snapshot.data && snapshot.data.availability || {}
  };
  if(availabilityContract && typeof availabilityContract.preparePlanningInput === 'function'){
    try{
      const adjusted = availabilityContract.preparePlanningInput(planningInput);
      planningInput = {
        window: windowValue,
        rooms: planningInput.rooms,
        routines: adjusted.routines,
        members: adjusted.members
      };
      if(routines.length && !adjusted.members.length){
        state.planning.error = 'Deze week is niemand beschikbaar voor automatische verdeling. Pas Beschikbaarheid aan of gebruik bestaande overdracht/hulp voor lopend werk.';
        renderCleaningScreen(root);
        return;
      }
    }catch(error){
      state.planning.error = readablePlanError(error);
      renderCleaningScreen(root);
      return;
    }
  }

  let concept;
  try{
    concept = planner.generateConceptPlan(planningInput);
  }catch(error){
    state.planning.error = readablePlanError(error);
    renderCleaningScreen(root);
    return;
  }

  state.planning.submitting = true;
  state.planning.error = '';
  state.planning.notice = '';
  renderCleaningScreen(root);

  repository.saveDraftPlan(concept).then((result) => {
    const count = result && result.plan && result.plan.summary ? Number(result.plan.summary.occurrenceCount || 0) : 0;
    state.planning.submitting = false;
    state.planning.notice = count
      ? 'Weekplan staat realtime klaar: '+count+' '+(count===1?'schoonmaakbeurt':'schoonmaakbeurten')+'.'
      : 'Weekplan staat realtime klaar: alles is op schema.';
    renderCleaningScreen(root);
    window.setTimeout(() => {
      if(state.planning.notice){
        state.planning.notice = '';
        renderIfActive();
      }
    },3000);
  }).catch((error) => {
    state.planning.submitting = false;
    state.planning.error = readablePlanError(error);
    renderCleaningScreen(root);
  });
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

function submitRoutine(root){
  if(state.routineForm.submitting || state.routineForm.deleting) return;
  const title = String(state.routineForm.title || '').trim();
  if(!title){
    state.routineForm.error = 'Geef de routine eerst een naam.';
    renderCleaningScreen(root);
    return;
  }
  const intervalDays = Math.min(365, Math.max(1, parseInt(state.routineForm.intervalDays,10) || 7));
  const estimatedMinutes = Math.min(480, Math.max(1, parseInt(state.routineForm.estimatedMinutes,10) || 15));
  const repository = window.CleaningHouseholdRepository;
  const editing = state.routineForm.mode === 'edit';
  const method = editing ? 'updateRoutineItem' : 'createRoutineItem';
  if(!repository || typeof repository[method] !== 'function'){
    state.routineForm.error = 'De schoonmaakrepository is nog niet beschikbaar.';
    renderCleaningScreen(root);
    return;
  }

  const routineId = state.routineForm.routineId;
  const payload = {
    roomId: state.routineForm.roomId,
    title: title,
    intervalDays: intervalDays,
    estimatedMinutes: estimatedMinutes,
    priority: state.routineForm.priority
  };
  state.routineForm.title = title;
  state.routineForm.intervalDays = intervalDays;
  state.routineForm.estimatedMinutes = estimatedMinutes;
  state.routineForm.submitting = true;
  state.routineForm.deleteConfirm = false;
  state.routineForm.error = '';

  const request = editing ? repository.updateRoutineItem(routineId,payload) : repository.createRoutineItem(payload);
  renderCleaningScreen(root);
  request.then(() => {
    resetRoutineForm();
    state.roomNotice = editing ? 'Routine bijgewerkt ✓' : 'Routine toegevoegd ✓';
    renderCleaningScreen(root);
    window.setTimeout(() => {
      if(state.roomNotice){
        state.roomNotice = '';
        renderIfActive();
      }
    }, 2500);
  }).catch((error) => {
    state.routineForm.submitting = false;
    state.routineForm.error = readableRoutineError(error);
    renderCleaningScreen(root);
  });
}

function addRoutineTemplate(root,roomId,templateKey){
  const room = findRoom(roomId);
  if(!room) return;
  const template = routineTemplatesForRoomType(room.type).find((entry) => entry.key === templateKey);
  if(!template) return;
  const duplicate = repositoryRoutinesForRoom(room.id).some((routine) => String(routine.templateKey || '') === template.key);
  if(duplicate) return;
  if(state.templatePending && String(state.templatePending.roomId)===String(room.id) && state.templatePending.key===template.key) return;

  const repository = window.CleaningHouseholdRepository;
  if(!repository || typeof repository.createRoutineItem !== 'function'){
    state.roomNotice = 'De schoonmaakrepository is nog niet beschikbaar.';
    renderCleaningScreen(root);
    return;
  }

  state.templatePending = {roomId:room.id,key:template.key};
  state.roomNotice = '';
  renderCleaningScreen(root);

  repository.createRoutineItem({
    roomId: room.id,
    title: template.title,
    intervalDays: template.intervalDays,
    estimatedMinutes: template.estimatedMinutes,
    priority: template.priority,
    templateKey: template.key
  }).then(() => {
    state.roomNotice = 'Suggestie toegevoegd ✓';
    renderCleaningScreen(root);
    window.setTimeout(() => {
      if(state.roomNotice){
        state.roomNotice = '';
        renderIfActive();
      }
    },2500);
  }).catch((error) => {
    state.templatePending = null;
    state.roomNotice = readableRoutineError(error);
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

function removeRoutine(root){
  if(state.routineForm.mode !== 'edit' || state.routineForm.deleting || state.routineForm.submitting) return;
  const repository = window.CleaningHouseholdRepository;
  if(!repository || typeof repository.removeRoutineItem !== 'function'){
    state.routineForm.error = 'De schoonmaakrepository is nog niet beschikbaar.';
    renderCleaningScreen(root);
    return;
  }
  const routineId = state.routineForm.routineId;
  state.routineForm.deleting = true;
  state.routineForm.error = '';
  renderCleaningScreen(root);

  repository.removeRoutineItem(routineId).then(() => {
    resetRoutineForm();
    state.roomNotice = 'Routine verwijderd ✓';
    renderCleaningScreen(root);
    window.setTimeout(() => {
      if(state.roomNotice){
        state.roomNotice = '';
        renderIfActive();
      }
    }, 2500);
  }).catch((error) => {
    state.routineForm.deleting = false;
    state.routineForm.error = readableRoutineError(error);
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

  const generateButton = root.querySelector('[data-cleaning-plan-generate]');
  if(generateButton) generateButton.addEventListener('click', () => generateWeekPlan(root));

  root.querySelectorAll('[data-cleaning-plan-member-filter]').forEach((button) => {
    const toggle = () => {
      const uid = String(button.getAttribute('data-cleaning-plan-member-filter') || '');
      if(!uid) return;
      state.planning.memberFilterUid = state.planning.memberFilterUid === uid ? '' : uid;
      renderCleaningScreen(root);
    };
    button.addEventListener('click', toggle);
    button.addEventListener('keydown', (event) => {
      if(event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggle();
    });
  });

  root.querySelectorAll('[data-cleaning-room-edit]').forEach((button) => {
    button.addEventListener('click', () => openEditRoom(root,button.getAttribute('data-cleaning-room-edit')));
  });

  root.querySelectorAll('[data-cleaning-routine-add]').forEach((button) => {
    button.addEventListener('click', () => openRoutineForm(root,button.getAttribute('data-cleaning-routine-add')));
  });

  root.querySelectorAll('[data-cleaning-routine-edit]').forEach((button) => {
    button.addEventListener('click', () => openEditRoutine(root,button.getAttribute('data-cleaning-routine-edit')));
  });

  root.querySelectorAll('[data-cleaning-template-add]').forEach((button) => {
    button.addEventListener('click', () => addRoutineTemplate(root,button.getAttribute('data-cleaning-template-add'),button.getAttribute('data-cleaning-template-key')));
  });

  root.querySelectorAll('[data-cleaning-room-cancel]').forEach((button) => {
    button.addEventListener('click', () => {
      if(state.roomForm.submitting || state.roomForm.deleting) return;
      resetRoomForm();
      renderCleaningScreen(root);
    });
  });

  root.querySelectorAll('[data-cleaning-routine-cancel]').forEach((button) => {
    button.addEventListener('click', () => {
      if(state.routineForm.submitting || state.routineForm.deleting) return;
      resetRoutineForm();
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

  const routineDeleteOpen = root.querySelector('[data-cleaning-routine-delete-open]');
  if(routineDeleteOpen) routineDeleteOpen.addEventListener('click', () => {
    state.routineForm.deleteConfirm = true;
    state.routineForm.error = '';
    renderCleaningScreen(root);
  });

  const routineDeleteCancel = root.querySelector('[data-cleaning-routine-delete-cancel]');
  if(routineDeleteCancel) routineDeleteCancel.addEventListener('click', () => {
    if(state.routineForm.deleting) return;
    state.routineForm.deleteConfirm = false;
    renderCleaningScreen(root);
  });

  const routineDeleteConfirm = root.querySelector('[data-cleaning-routine-delete-confirm]');
  if(routineDeleteConfirm) routineDeleteConfirm.addEventListener('click', () => removeRoutine(root));

  const nameInput = root.querySelector('[data-cleaning-room-name]');
  if(nameInput) nameInput.addEventListener('input', () => {
    state.roomForm.name = nameInput.value;
    if(state.roomForm.error) state.roomForm.error = '';
  });

  const typeSelect = root.querySelector('[data-cleaning-room-type]');
  if(typeSelect) typeSelect.addEventListener('change', () => {
    state.roomForm.type = typeSelect.value || 'custom';
  });

  const routineTitle = root.querySelector('[data-cleaning-routine-title]');
  if(routineTitle) routineTitle.addEventListener('input', () => {
    state.routineForm.title = routineTitle.value;
    if(state.routineForm.error) state.routineForm.error = '';
  });

  const routineInterval = root.querySelector('[data-cleaning-routine-interval]');
  if(routineInterval) routineInterval.addEventListener('input', () => {
    state.routineForm.intervalDays = routineInterval.value;
  });

  const routineMinutes = root.querySelector('[data-cleaning-routine-minutes]');
  if(routineMinutes) routineMinutes.addEventListener('input', () => {
    state.routineForm.estimatedMinutes = routineMinutes.value;
  });

  const routinePriority = root.querySelector('[data-cleaning-routine-priority]');
  if(routinePriority) routinePriority.addEventListener('change', () => {
    state.routineForm.priority = routinePriority.value || 'NORMAL';
  });

  const roomForm = root.querySelector('[data-cleaning-room-form]');
  if(roomForm) roomForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitRoom(root);
  });

  const routineForm = root.querySelector('[data-cleaning-routine-form]');
  if(routineForm) routineForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitRoutine(root);
  });
}

export function renderCleaningScreen(target){
  const root = target || document.getElementById('cleaning-content');
  if(!root) return;
  mountedRoot = root;
  ensureRepositorySubscription();
  ensureMemberSubscription();

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
