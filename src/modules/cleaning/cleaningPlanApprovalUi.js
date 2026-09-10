'use strict';
// ============================================================
// CLEANING PLAN APPROVAL UI + REPOSITORY EXTENSION v0.1.0
// Branch-only vertical slice for Weekplanner approvals.
// Canonical CleaningOccurrence remains the source of truth.
// No Task or Calendar projection is created here.
// ============================================================

const VERSION = '0.1.0';
const runtime = {
  repositoryPatched: false,
  observer: null,
  decorateQueued: false,
  busy: false,
  notice: '',
  error: ''
};

function clone(value){
  if(value === undefined) return undefined;
  try { return JSON.parse(JSON.stringify(value)); } catch(error) { return value; }
}

function contextSnapshot(){
  try {
    return window.HouseholdContext && typeof window.HouseholdContext.snapshot === 'function'
      ? window.HouseholdContext.snapshot()
      : null;
  } catch(error) {
    return null;
  }
}

function captureContext(){
  try {
    return window.HouseholdContext && typeof window.HouseholdContext.capture === 'function'
      ? window.HouseholdContext.capture()
      : null;
  } catch(error) {
    return null;
  }
}

function contextIsCurrent(token){
  try {
    return !!(window.HouseholdContext && typeof window.HouseholdContext.isCurrent === 'function' && window.HouseholdContext.isCurrent(token));
  } catch(error) {
    return false;
  }
}

function firebaseDb(){
  try {
    if(window.fbDb) return window.fbDb;
    if(window.firebase && typeof window.firebase.database === 'function') return window.firebase.database();
  } catch(error) {}
  return null;
}

function cleaningBasePath(householdId){
  const domain = window.CleaningDomain;
  if(domain && typeof domain.basePath === 'function') return domain.basePath(householdId);
  return householdId ? 'families/' + String(householdId) + '/cleaning' : null;
}

function requireWriteContext(){
  const ctx = contextSnapshot();
  if(!ctx || ctx.ready !== true || !ctx.uid || !ctx.householdId) throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');
  const db = firebaseDb();
  if(!db) throw new Error('FIREBASE_DATABASE_UNAVAILABLE');
  const token = captureContext();
  if(!token || !contextIsCurrent(token)) throw new Error('HOUSEHOLD_CONTEXT_CHANGED');
  const path = cleaningBasePath(ctx.householdId);
  if(!path) throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');
  return {ctx, db, token, path};
}

function repositorySnapshot(){
  const repository = window.CleaningHouseholdRepository;
  if(!repository || typeof repository.snapshot !== 'function') return null;
  try { return repository.snapshot(); } catch(error) { return null; }
}

function currentWeekWindow(){
  const start = new Date();
  start.setHours(0,0,0,0);
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  const end = new Date(start.getTime());
  end.setDate(end.getDate() + 7);
  return {startAt:start.getTime(), endAt:end.getTime()};
}

function currentPlanFromSnapshot(snapshot){
  const persistence = window.CleaningPlanPersistenceContract;
  const plans = snapshot && snapshot.data && snapshot.data.plans;
  if(!persistence || typeof persistence.planIdForWindow !== 'function' || !plans || typeof plans !== 'object') return null;
  try {
    const planId = persistence.planIdForWindow(currentWeekWindow());
    const plan = plans[planId];
    return plan && typeof plan === 'object' ? Object.assign({id:planId}, clone(plan)) : null;
  } catch(error) {
    return null;
  }
}

function approvalMap(root, uid){
  if(!root.approvals || typeof root.approvals !== 'object') root.approvals = {};
  if(!root.approvals[uid] || typeof root.approvals[uid] !== 'object') root.approvals[uid] = {};
  return root.approvals[uid];
}

function approvalFor(data, uid, planId){
  const approvals = data && data.approvals;
  const userMap = approvals && approvals[uid];
  const approval = userMap && userMap[planId];
  return approval && typeof approval === 'object' ? approval : null;
}

function planOccurrences(root, plan){
  const occurrences = root.occurrences && typeof root.occurrences === 'object' ? root.occurrences : {};
  return (Array.isArray(plan.occurrenceIds) ? plan.occurrenceIds : []).map((id) => {
    const row = occurrences[id];
    if(!row || typeof row !== 'object' || String(row.planId || '') !== String(plan.id || '')) throw new Error('CLEANING_PLAN_OCCURRENCE_NOT_FOUND');
    return {id:String(id), row:row};
  });
}

function assignedUid(occurrence){
  const list = occurrence && Array.isArray(occurrence.assignmentUids) ? occurrence.assignmentUids.filter(Boolean).map(String) : [];
  if(list.length !== 1) throw new Error('CLEANING_PLAN_ASSIGNMENT_INVALID');
  return list[0];
}

function groupOccurrenceIdsByUid(entries){
  const grouped = {};
  entries.forEach((entry) => {
    const uid = assignedUid(entry.row);
    if(!grouped[uid]) grouped[uid] = [];
    grouped[uid].push(entry.id);
  });
  return grouped;
}

function sortedUids(value){
  return Array.from(new Set((Array.isArray(value) ? value : []).filter(Boolean).map(String))).sort();
}

function approvalStateSummary(root, planId, requiredUids){
  const accepted = [];
  const declined = [];
  requiredUids.forEach((uid) => {
    const record = approvalFor(root, uid, planId);
    if(record && record.status === 'ACCEPTED') accepted.push(uid);
    if(record && record.status === 'DECLINED') declined.push(uid);
  });
  return {accepted:sortedUids(accepted), declined:sortedUids(declined)};
}

function memberRole(uid){
  try {
    const bridge = window.HouseholdIdentityFirebaseBridge;
    const members = bridge && typeof bridge.getMembers === 'function' ? bridge.getMembers() : [];
    const member = Array.isArray(members) ? members.find((entry) => String(entry && entry.uid || '') === String(uid || '')) : null;
    return member ? String(member.role || '') : '';
  } catch(error) {
    return '';
  }
}

function canReopen(plan, actorUid){
  if(String(plan.createdByUid || plan.generatedByUid || '') === String(actorUid || '')) return true;
  const role = memberRole(actorUid);
  return role === 'owner' || role === 'admin';
}

function updatePlanMeta(plan, actorUid, timestamp){
  plan.updatedAt = timestamp;
  plan.updatedByUid = actorUid;
  return plan;
}

function proposeRoot(serverRoot, planId, actorUid, householdId, timestamp){
  const root = serverRoot && typeof serverRoot === 'object' ? clone(serverRoot) : {};
  if(!root.plans || typeof root.plans !== 'object') root.plans = {};
  const plan = root.plans[planId];
  if(!plan || typeof plan !== 'object') throw new Error('CLEANING_PLAN_NOT_FOUND');
  plan.id = plan.id || planId;
  if(plan.householdId && String(plan.householdId) !== String(householdId)) throw new Error('CLEANING_PLAN_HOUSEHOLD_CONFLICT');
  if(plan.status === 'PROPOSED' || plan.status === 'PARTIALLY_ACCEPTED' || plan.status === 'ACTIVE') return root;
  if(plan.status !== 'DRAFT') throw new Error('CLEANING_PLAN_NOT_DRAFT');

  const entries = planOccurrences(root, plan);
  const grouped = groupOccurrenceIdsByUid(entries);
  const requiredUids = Object.keys(grouped).sort();
  const round = Math.max(0, Number(plan.approvalRound || 0)) + 1;

  entries.forEach((entry) => {
    const occurrence = entry.row;
    if(occurrence.status !== 'DRAFT') throw new Error('CLEANING_OCCURRENCE_NOT_DRAFT');
    occurrence.status = 'PROPOSED';
    occurrence.assignmentStatus = 'PROPOSED';
    occurrence.proposedAt = timestamp;
    occurrence.proposedByUid = actorUid;
    occurrence.updatedAt = timestamp;
    occurrence.updatedByUid = actorUid;
  });

  requiredUids.forEach((uid) => {
    const userMap = approvalMap(root, uid);
    const previous = userMap[planId] && typeof userMap[planId] === 'object' ? userMap[planId] : null;
    userMap[planId] = {
      id: planId + '__' + uid,
      householdId: householdId,
      planId: planId,
      uid: uid,
      status: 'PENDING',
      occurrenceIds: grouped[uid].slice(),
      round: round,
      proposedAt: timestamp,
      proposedByUid: actorUid,
      createdAt: Number(previous && previous.createdAt) || timestamp,
      createdByUid: String(previous && previous.createdByUid || actorUid),
      updatedAt: timestamp,
      updatedByUid: actorUid,
      schemaVersion: 1
    };
  });

  plan.status = requiredUids.length ? 'PROPOSED' : 'ACTIVE';
  plan.approvalState = requiredUids.length ? 'PENDING' : 'APPROVED';
  plan.approvalRound = round;
  plan.requiredApprovalUids = requiredUids;
  plan.acceptedApprovalUids = [];
  plan.declinedApprovalUids = [];
  plan.proposedAt = timestamp;
  plan.proposedByUid = actorUid;
  if(!requiredUids.length){
    plan.activatedAt = timestamp;
    plan.activatedByUid = actorUid;
  }
  updatePlanMeta(plan, actorUid, timestamp);
  return root;
}

function acceptRoot(serverRoot, planId, actorUid, householdId, timestamp){
  const root = serverRoot && typeof serverRoot === 'object' ? clone(serverRoot) : {};
  const plan = root.plans && root.plans[planId];
  if(!plan || typeof plan !== 'object') throw new Error('CLEANING_PLAN_NOT_FOUND');
  plan.id = plan.id || planId;
  if(plan.householdId && String(plan.householdId) !== String(householdId)) throw new Error('CLEANING_PLAN_HOUSEHOLD_CONFLICT');
  if(plan.status === 'ACTIVE') return root;
  if(plan.status !== 'PROPOSED' && plan.status !== 'PARTIALLY_ACCEPTED') throw new Error('CLEANING_PLAN_NOT_PROPOSED');
  if(plan.approvalState === 'CHANGES_REQUESTED') throw new Error('CLEANING_PLAN_CHANGES_REQUESTED');

  const entries = planOccurrences(root, plan);
  const grouped = groupOccurrenceIdsByUid(entries);
  const requiredUids = sortedUids(plan.requiredApprovalUids && plan.requiredApprovalUids.length ? plan.requiredApprovalUids : Object.keys(grouped));
  if(requiredUids.indexOf(String(actorUid)) < 0) throw new Error('CLEANING_PLAN_APPROVAL_NOT_REQUIRED');

  const userMap = approvalMap(root, actorUid);
  const approval = userMap[planId];
  if(!approval || typeof approval !== 'object') throw new Error('CLEANING_PLAN_APPROVAL_NOT_FOUND');
  if(approval.status === 'DECLINED') throw new Error('CLEANING_PLAN_APPROVAL_DECLINED');
  if(approval.status !== 'ACCEPTED'){
    approval.status = 'ACCEPTED';
    approval.acceptedAt = timestamp;
    approval.acceptedByUid = actorUid;
    approval.updatedAt = timestamp;
    approval.updatedByUid = actorUid;

    const ownIds = Array.isArray(approval.occurrenceIds) ? approval.occurrenceIds.map(String) : grouped[actorUid] || [];
    ownIds.forEach((occurrenceId) => {
      const occurrence = root.occurrences && root.occurrences[occurrenceId];
      if(!occurrence || assignedUid(occurrence) !== String(actorUid)) throw new Error('CLEANING_PLAN_APPROVAL_OCCURRENCE_MISMATCH');
      occurrence.status = 'FLEXIBLE';
      occurrence.assignmentStatus = 'ACCEPTED';
      occurrence.acceptedAt = timestamp;
      occurrence.acceptedByUid = actorUid;
      occurrence.updatedAt = timestamp;
      occurrence.updatedByUid = actorUid;
    });
  }

  const summary = approvalStateSummary(root, planId, requiredUids);
  plan.requiredApprovalUids = requiredUids;
  plan.acceptedApprovalUids = summary.accepted;
  plan.declinedApprovalUids = summary.declined;

  if(summary.declined.length){
    plan.status = summary.accepted.length ? 'PARTIALLY_ACCEPTED' : 'PROPOSED';
    plan.approvalState = 'CHANGES_REQUESTED';
  } else if(summary.accepted.length === requiredUids.length){
    plan.status = 'ACTIVE';
    plan.approvalState = 'APPROVED';
    plan.activatedAt = timestamp;
    plan.activatedByUid = actorUid;
    entries.forEach((entry) => {
      if(entry.row.status !== 'CANCELLED'){
        entry.row.status = 'FLEXIBLE';
        entry.row.assignmentStatus = 'ACTIVE';
        entry.row.activatedAt = timestamp;
        entry.row.updatedAt = timestamp;
        entry.row.updatedByUid = actorUid;
      }
    });
  } else {
    plan.status = summary.accepted.length ? 'PARTIALLY_ACCEPTED' : 'PROPOSED';
    plan.approvalState = 'PENDING';
  }
  updatePlanMeta(plan, actorUid, timestamp);
  return root;
}

function declineRoot(serverRoot, planId, actorUid, householdId, timestamp){
  const root = serverRoot && typeof serverRoot === 'object' ? clone(serverRoot) : {};
  const plan = root.plans && root.plans[planId];
  if(!plan || typeof plan !== 'object') throw new Error('CLEANING_PLAN_NOT_FOUND');
  plan.id = plan.id || planId;
  if(plan.householdId && String(plan.householdId) !== String(householdId)) throw new Error('CLEANING_PLAN_HOUSEHOLD_CONFLICT');
  if(plan.status !== 'PROPOSED' && plan.status !== 'PARTIALLY_ACCEPTED') throw new Error('CLEANING_PLAN_NOT_PROPOSED');

  const entries = planOccurrences(root, plan);
  const grouped = groupOccurrenceIdsByUid(entries);
  const requiredUids = sortedUids(plan.requiredApprovalUids && plan.requiredApprovalUids.length ? plan.requiredApprovalUids : Object.keys(grouped));
  if(requiredUids.indexOf(String(actorUid)) < 0) throw new Error('CLEANING_PLAN_APPROVAL_NOT_REQUIRED');
  const userMap = approvalMap(root, actorUid);
  const approval = userMap[planId];
  if(!approval || typeof approval !== 'object') throw new Error('CLEANING_PLAN_APPROVAL_NOT_FOUND');
  if(approval.status === 'DECLINED') return root;
  if(approval.status === 'ACCEPTED') throw new Error('CLEANING_PLAN_APPROVAL_ALREADY_ACCEPTED');

  approval.status = 'DECLINED';
  approval.declinedAt = timestamp;
  approval.declinedByUid = actorUid;
  approval.updatedAt = timestamp;
  approval.updatedByUid = actorUid;

  const ownIds = Array.isArray(approval.occurrenceIds) ? approval.occurrenceIds.map(String) : grouped[actorUid] || [];
  ownIds.forEach((occurrenceId) => {
    const occurrence = root.occurrences && root.occurrences[occurrenceId];
    if(!occurrence || assignedUid(occurrence) !== String(actorUid)) throw new Error('CLEANING_PLAN_APPROVAL_OCCURRENCE_MISMATCH');
    occurrence.status = 'PROPOSED';
    occurrence.assignmentStatus = 'DECLINED';
    occurrence.declinedAt = timestamp;
    occurrence.declinedByUid = actorUid;
    occurrence.updatedAt = timestamp;
    occurrence.updatedByUid = actorUid;
  });

  const summary = approvalStateSummary(root, planId, requiredUids);
  plan.status = summary.accepted.length ? 'PARTIALLY_ACCEPTED' : 'PROPOSED';
  plan.approvalState = 'CHANGES_REQUESTED';
  plan.requiredApprovalUids = requiredUids;
  plan.acceptedApprovalUids = summary.accepted;
  plan.declinedApprovalUids = summary.declined;
  plan.changesRequestedAt = timestamp;
  plan.changesRequestedByUid = actorUid;
  updatePlanMeta(plan, actorUid, timestamp);
  return root;
}

function reopenRoot(serverRoot, planId, actorUid, householdId, timestamp){
  const root = serverRoot && typeof serverRoot === 'object' ? clone(serverRoot) : {};
  const plan = root.plans && root.plans[planId];
  if(!plan || typeof plan !== 'object') throw new Error('CLEANING_PLAN_NOT_FOUND');
  plan.id = plan.id || planId;
  if(plan.householdId && String(plan.householdId) !== String(householdId)) throw new Error('CLEANING_PLAN_HOUSEHOLD_CONFLICT');
  if(plan.approvalState !== 'CHANGES_REQUESTED') throw new Error('CLEANING_PLAN_NO_CHANGES_REQUESTED');
  if(!canReopen(plan, actorUid)) throw new Error('CLEANING_PLAN_REOPEN_NOT_ALLOWED');

  const entries = planOccurrences(root, plan);
  entries.forEach((entry) => {
    if(entry.row.status === 'CANCELLED') return;
    entry.row.status = 'DRAFT';
    entry.row.assignmentStatus = 'PROPOSED';
    entry.row.updatedAt = timestamp;
    entry.row.updatedByUid = actorUid;
    delete entry.row.acceptedAt;
    delete entry.row.acceptedByUid;
    delete entry.row.activatedAt;
    delete entry.row.declinedAt;
    delete entry.row.declinedByUid;
  });

  const requiredUids = sortedUids(plan.requiredApprovalUids);
  requiredUids.forEach((uid) => {
    const record = approvalFor(root, uid, planId);
    if(!record) return;
    record.status = 'REOPENED';
    record.reopenedAt = timestamp;
    record.reopenedByUid = actorUid;
    record.updatedAt = timestamp;
    record.updatedByUid = actorUid;
  });

  plan.status = 'DRAFT';
  plan.approvalState = 'DRAFT';
  plan.requiredApprovalUids = [];
  plan.acceptedApprovalUids = [];
  plan.declinedApprovalUids = [];
  plan.reopenedAt = timestamp;
  plan.reopenedByUid = actorUid;
  updatePlanMeta(plan, actorUid, timestamp);
  return root;
}

function transactPlan(planId, transition){
  let write;
  try { write = requireWriteContext(); } catch(error) { return Promise.reject(error); }
  const timestamp = Date.now();
  const rootRef = write.db.ref(write.path);
  let transitionError = null;
  return rootRef.transaction((serverRoot) => {
    if(!contextIsCurrent(write.token)){
      transitionError = new Error('HOUSEHOLD_CONTEXT_CHANGED');
      return;
    }
    try {
      transitionError = null;
      return transition(serverRoot, String(planId || ''), String(write.ctx.uid), String(write.ctx.householdId), timestamp);
    } catch(error) {
      transitionError = error;
      return;
    }
  }).then((result) => {
    if(transitionError) throw transitionError;
    if(!contextIsCurrent(write.token)) throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');
    if(!result || result.committed !== true) throw new Error('CLEANING_PLAN_APPROVAL_WRITE_NOT_COMMITTED');
    return result.snapshot && typeof result.snapshot.val === 'function' ? clone(result.snapshot.val()) : null;
  });
}

function patchRepository(){
  const repository = window.CleaningHouseholdRepository;
  if(!repository) return false;
  if(repository.__approvalExtensionV1){ runtime.repositoryPatched = true; return true; }

  repository.proposePlan = function(planId){ return transactPlan(planId, proposeRoot); };
  repository.acceptOwnAssignments = function(planId){ return transactPlan(planId, acceptRoot); };
  repository.declineOwnAssignments = function(planId){ return transactPlan(planId, declineRoot); };
  repository.reopenPlan = function(planId){ return transactPlan(planId, reopenRoot); };
  repository.__approvalExtensionV1 = true;
  runtime.repositoryPatched = true;
  return true;
}

function escapeText(value){
  return String(value == null ? '' : value)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function memberName(uid){
  try {
    const bridge = window.HouseholdIdentityFirebaseBridge;
    const members = bridge && typeof bridge.getMembers === 'function' ? bridge.getMembers() : [];
    const member = Array.isArray(members) ? members.find((entry) => String(entry && entry.uid || '') === String(uid || '')) : null;
    return member ? String(member.displayName || member.name || 'Gezinslid') : 'Gezinslid';
  } catch(error) {
    return 'Gezinslid';
  }
}

function statusLabel(plan){
  if(!plan) return 'Nog niet gemaakt';
  if(plan.status === 'DRAFT') return 'Concept · realtime';
  if(plan.approvalState === 'CHANGES_REQUESTED') return 'Aanpassing nodig';
  if(plan.status === 'PROPOSED') return 'Voorgesteld';
  if(plan.status === 'PARTIALLY_ACCEPTED') return 'Deels geaccepteerd';
  if(plan.status === 'ACTIVE') return 'Actief';
  return String(plan.status || 'Plan');
}

function readableError(error){
  const code = String(error && error.message || error || 'Actie mislukt.');
  const messages = {
    ACTIVE_HOUSEHOLD_REQUIRED:'Er is geen actief huishouden beschikbaar.',
    HOUSEHOLD_CONTEXT_CHANGED:'Het actieve huishouden veranderde tijdens de actie. Probeer opnieuw.',
    CLEANING_PLAN_NOT_FOUND:'Dit weekplan bestaat niet meer.',
    CLEANING_PLAN_NOT_DRAFT:'Dit weekplan is geen concept meer.',
    CLEANING_PLAN_NOT_PROPOSED:'Dit weekplan wacht niet op goedkeuring.',
    CLEANING_PLAN_APPROVAL_NOT_REQUIRED:'Voor jou staat in dit weekplan geen goedkeuring open.',
    CLEANING_PLAN_APPROVAL_NOT_FOUND:'Jouw persoonlijke goedkeuringsverzoek kon niet worden gevonden.',
    CLEANING_PLAN_CHANGES_REQUESTED:'Er is al om een aanpassing gevraagd. Het plan moet eerst terug naar concept.',
    CLEANING_PLAN_APPROVAL_ALREADY_ACCEPTED:'Je hebt dit voorstel al geaccepteerd.',
    CLEANING_PLAN_REOPEN_NOT_ALLOWED:'Alleen de maker of een beheerder kan dit voorstel terugzetten naar concept.',
    CLEANING_PLAN_NO_CHANGES_REQUESTED:'Er is geen open aanpassingsverzoek.'
  };
  for(const key of Object.keys(messages)) if(code.indexOf(key) > -1) return messages[key];
  if(code.indexOf('permission') > -1 || code.indexOf('PERMISSION_DENIED') > -1) return 'Firebase staat deze wijziging niet toe voor dit huishouden.';
  return code;
}

function ensureStyle(){
  if(document.getElementById('cleaning-plan-approval-style')) return;
  const style = document.createElement('style');
  style.id = 'cleaning-plan-approval-style';
  style.textContent = `
#screen-cleaning .cleaning-approval-panel{padding:16px;border:1px solid var(--cleaning-border);border-radius:20px;background:var(--cleaning-surface-strong);box-shadow:0 9px 26px rgba(40,26,70,.07);display:grid;gap:12px}
#screen-cleaning .cleaning-approval-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
#screen-cleaning .cleaning-approval-head>div{display:grid;gap:3px}
#screen-cleaning .cleaning-approval-kicker{color:var(--cleaning-muted);font-size:10px;font-weight:900;letter-spacing:.06em;text-transform:uppercase}
#screen-cleaning .cleaning-approval-head strong{font-size:15px;font-weight:950;color:var(--cleaning-text)}
#screen-cleaning .cleaning-approval-count{padding:6px 9px;border-radius:999px;background:color-mix(in srgb,var(--cleaning-accent) 10%,var(--cleaning-surface));color:var(--cleaning-accent);font-size:10px;font-weight:950;white-space:nowrap}
#screen-cleaning .cleaning-approval-copy{margin:0;color:var(--cleaning-muted);font-size:11px;font-weight:750;line-height:1.5}
#screen-cleaning .cleaning-approval-members{display:grid;gap:7px}
#screen-cleaning .cleaning-approval-member{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 10px;border-radius:12px;background:color-mix(in srgb,var(--cleaning-accent) 5%,var(--cleaning-surface))}
#screen-cleaning .cleaning-approval-member span{font-size:11px;font-weight:850;color:var(--cleaning-text)}
#screen-cleaning .cleaning-approval-member small{font-size:9px;font-weight:850;color:var(--cleaning-muted)}
#screen-cleaning .cleaning-approval-actions{display:flex;gap:8px;flex-wrap:wrap}
#screen-cleaning .cleaning-approval-btn{min-height:46px;flex:1 1 145px;border:0;border-radius:14px;padding:0 14px;background:var(--cleaning-accent);color:#fff;font:inherit;font-size:12px;font-weight:950;cursor:pointer}
#screen-cleaning .cleaning-approval-btn.is-secondary{background:color-mix(in srgb,var(--cleaning-accent) 9%,var(--cleaning-surface));color:var(--cleaning-text);border:1px solid var(--cleaning-border)}
#screen-cleaning .cleaning-approval-btn.is-danger{background:rgba(188,54,66,.1);color:#b32636;border:1px solid rgba(188,54,66,.18)}
[data-theme*="dark"] #screen-cleaning .cleaning-approval-btn.is-danger{color:#ff9ba6}
#screen-cleaning .cleaning-approval-btn:disabled{opacity:.5;cursor:default}
#screen-cleaning .cleaning-approval-feedback{margin:0;padding:10px 11px;border-radius:12px;background:color-mix(in srgb,var(--cleaning-accent) 8%,var(--cleaning-surface));font-size:11px;font-weight:850;color:var(--cleaning-text)}
#screen-cleaning .cleaning-approval-feedback.is-error{background:rgba(188,54,66,.09);color:#b32636}
[data-theme*="dark"] #screen-cleaning .cleaning-approval-feedback.is-error{color:#ff9ba6}
`;
  document.head.appendChild(style);
}

function currentApproval(snapshot, plan, uid){
  return approvalFor(snapshot && snapshot.data || {}, String(uid || ''), String(plan && plan.id || ''));
}

function approvalPanelHtml(snapshot, plan, uid){
  const data = snapshot && snapshot.data || {};
  const required = sortedUids(plan.requiredApprovalUids);
  const accepted = sortedUids(plan.acceptedApprovalUids);
  const declined = sortedUids(plan.declinedApprovalUids);
  const mine = currentApproval(snapshot, plan, uid);
  const countLabel = required.length ? accepted.length + ' van ' + required.length + ' akkoord' : 'Nog niet voorgesteld';
  const feedback = runtime.error
    ? '<p class="cleaning-approval-feedback is-error" role="alert">' + escapeText(runtime.error) + '</p>'
    : (runtime.notice ? '<p class="cleaning-approval-feedback" role="status">' + escapeText(runtime.notice) + '</p>' : '');

  let copy = '';
  let actions = '';
  if(plan.status === 'DRAFT'){
    copy = 'Het plan is nog een concept. Verstuur het voorstel pas als de verdeling goed genoeg voelt.';
    if(Array.isArray(plan.occurrenceIds) && plan.occurrenceIds.length){
      actions = '<button type="button" class="cleaning-approval-btn" data-cleaning-approval-action="propose"' + (runtime.busy?' disabled':'') + '>' + (runtime.busy?'Versturen…':'Voorstellen aan gezin') + '</button>';
    }
  } else if(plan.approvalState === 'CHANGES_REQUESTED'){
    copy = declined.length
      ? memberName(declined[0]) + (declined.length > 1 ? ' en nog iemand hebben' : ' heeft') + ' om een aanpassing gevraagd. Zet het plan terug naar concept, pas het aan en stel opnieuw voor.'
      : 'Er is om een aanpassing gevraagd.';
    if(canReopen(plan, uid)){
      actions = '<button type="button" class="cleaning-approval-btn is-secondary" data-cleaning-approval-action="reopen"' + (runtime.busy?' disabled':'') + '>Terug naar concept</button>';
    }
  } else if(plan.status === 'ACTIVE'){
    copy = 'Iedereen heeft het eigen deel geaccepteerd. Het weekplan is nu actief. Taken- en Agenda-projecties volgen in de volgende integratiestap.';
  } else {
    if(mine && mine.status === 'PENDING'){
      const ownCount = Array.isArray(mine.occurrenceIds) ? mine.occurrenceIds.length : 0;
      copy = 'Voor jou staan ' + ownCount + ' ' + (ownCount === 1 ? 'schoonmaakbeurt' : 'schoonmaakbeurten') + ' klaar. Je beoordeelt alleen jouw eigen deel.';
      actions = '<button type="button" class="cleaning-approval-btn" data-cleaning-approval-action="accept"' + (runtime.busy?' disabled':'') + '>' + (runtime.busy?'Opslaan…':'Accepteer mijn deel') + '</button>'
        + '<button type="button" class="cleaning-approval-btn is-danger" data-cleaning-approval-action="decline"' + (runtime.busy?' disabled':'') + '>Afwijzen</button>';
    } else if(mine && mine.status === 'ACCEPTED'){
      copy = 'Jouw deel is geaccepteerd. Het plan wordt automatisch actief zodra alle benodigde gezinsleden akkoord zijn.';
    } else {
      copy = 'Dit voorstel wacht nog op de gezinsleden aan wie schoonmaakbeurten zijn toegewezen.';
    }
  }

  const memberRows = required.length ? '<div class="cleaning-approval-members">' + required.map((memberUid) => {
    const record = approvalFor(data, memberUid, plan.id);
    const status = record && record.status === 'ACCEPTED' ? 'Akkoord ✓' : record && record.status === 'DECLINED' ? 'Aanpassing gevraagd' : 'Wacht op reactie';
    return '<div class="cleaning-approval-member"><span>' + escapeText(memberName(memberUid)) + '</span><small>' + escapeText(status) + '</small></div>';
  }).join('') + '</div>' : '';

  return '<section class="cleaning-approval-panel" data-cleaning-approval-panel>'
    + '<div class="cleaning-approval-head"><div><span class="cleaning-approval-kicker">Persoonlijke goedkeuring</span><strong>' + escapeText(statusLabel(plan)) + '</strong></div><span class="cleaning-approval-count">' + escapeText(countLabel) + '</span></div>'
    + '<p class="cleaning-approval-copy">' + escapeText(copy) + '</p>'
    + memberRows
    + feedback
    + (actions ? '<div class="cleaning-approval-actions">' + actions + '</div>' : '')
    + '</section>';
}

function decorateOccurrenceCards(snapshot, plan){
  const root = document.getElementById('cleaning-content');
  if(!root) return;
  const cards = Array.from(root.querySelectorAll('.cleaning-plan-card'));
  const occurrences = snapshot && snapshot.data && snapshot.data.occurrences || {};
  const ids = Array.isArray(plan.occurrenceIds) ? plan.occurrenceIds : [];
  cards.forEach((card, index) => {
    const occurrence = occurrences[ids[index]];
    if(!occurrence) return;
    const assignmentLabel = card.querySelector('.cleaning-plan-assignment span');
    if(assignmentLabel) assignmentLabel.textContent = occurrence.assignmentStatus === 'ACCEPTED' || occurrence.assignmentStatus === 'ACTIVE' ? 'Verantwoordelijk' : 'Voorgesteld voor';
    const footer = card.querySelector('.cleaning-plan-card-footer span');
    if(footer && (occurrence.status === 'FLEXIBLE' || plan.status === 'ACTIVE')) footer.textContent = 'Flexibel deze week';
  });
}

function bindApprovalActions(panel, plan){
  panel.querySelectorAll('[data-cleaning-approval-action]').forEach((button) => {
    button.addEventListener('click', () => {
      if(runtime.busy) return;
      const repository = window.CleaningHouseholdRepository;
      if(!repository) return;
      const action = button.getAttribute('data-cleaning-approval-action');
      const methods = {
        propose:'proposePlan',
        accept:'acceptOwnAssignments',
        decline:'declineOwnAssignments',
        reopen:'reopenPlan'
      };
      const method = methods[action];
      if(!method || typeof repository[method] !== 'function'){
        runtime.error = 'De goedkeuringsflow is nog niet volledig geladen.';
        queueDecorate();
        return;
      }
      runtime.busy = true;
      runtime.error = '';
      runtime.notice = '';
      queueDecorate();
      repository[method](plan.id).then(() => {
        runtime.busy = false;
        runtime.notice = action === 'propose' ? 'Voorstel verstuurd ✓' : action === 'accept' ? 'Jouw deel is geaccepteerd ✓' : action === 'decline' ? 'Aanpassing gevraagd.' : 'Plan staat weer als concept klaar.';
        queueDecorate();
        window.setTimeout(() => { runtime.notice = ''; queueDecorate(); }, 2400);
      }).catch((error) => {
        runtime.busy = false;
        runtime.error = readableError(error);
        queueDecorate();
      });
    });
  });
}

function decorate(){
  runtime.decorateQueued = false;
  patchRepository();
  ensureStyle();
  const screen = document.getElementById('screen-cleaning');
  const root = document.getElementById('cleaning-content');
  if(!screen || !root || !screen.classList.contains('active')) return;
  const hero = root.querySelector('.cleaning-plan-hero');
  if(!hero) return;

  const snapshot = repositorySnapshot();
  const plan = currentPlanFromSnapshot(snapshot);
  if(!plan) return;
  const ctx = contextSnapshot();
  const uid = String(ctx && ctx.uid || '');

  const status = hero.querySelector('.cleaning-plan-status');
  if(status) status.textContent = statusLabel(plan);
  const generateButton = hero.querySelector('.cleaning-plan-generate');
  if(generateButton) generateButton.style.display = plan.status === 'DRAFT' ? '' : 'none';
  const conceptCopy = hero.querySelector('.cleaning-plan-actions > span');
  if(conceptCopy){
    conceptCopy.textContent = plan.status === 'DRAFT'
      ? 'Dit is alleen een concept; er worden nog geen Taken- of Agenda-items aangemaakt.'
      : plan.status === 'ACTIVE'
        ? 'Plan actief; Taken- en Agenda-projecties volgen in de volgende integratiestap.'
        : 'Voorstel verstuurd; er worden nog geen Taken- of Agenda-items aangemaakt.';
  }

  const html = approvalPanelHtml(snapshot, plan, uid);
  let panel = root.querySelector('[data-cleaning-approval-panel]');
  const mine = currentApproval(snapshot, plan, uid);
  const signature = JSON.stringify({
    status:plan.status,
    approvalState:plan.approvalState || '',
    round:plan.approvalRound || 0,
    required:plan.requiredApprovalUids || [],
    accepted:plan.acceptedApprovalUids || [],
    declined:plan.declinedApprovalUids || [],
    mine:mine && mine.status || '',
    busy:runtime.busy,
    notice:runtime.notice,
    error:runtime.error
  });
  if(!panel){
    const holder = document.createElement('div');
    holder.innerHTML = html;
    panel = holder.firstElementChild;
    panel.dataset.signature = signature;
    hero.insertAdjacentElement('afterend', panel);
    bindApprovalActions(panel, plan);
  } else if(panel.dataset.signature !== signature){
    const holder = document.createElement('div');
    holder.innerHTML = html;
    const next = holder.firstElementChild;
    next.dataset.signature = signature;
    panel.replaceWith(next);
    panel = next;
    bindApprovalActions(panel, plan);
  }
  decorateOccurrenceCards(snapshot, plan);
}

function queueDecorate(){
  if(runtime.decorateQueued) return;
  runtime.decorateQueued = true;
  window.requestAnimationFrame(decorate);
}

function start(){
  if(window.__cleaningPlanApprovalUiV1) return;
  window.__cleaningPlanApprovalUiV1 = true;
  patchRepository();
  ensureStyle();
  runtime.observer = new MutationObserver(queueDecorate);
  runtime.observer.observe(document.documentElement, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
  window.addEventListener('familyapp:cleaning-repository', queueDecorate);
  window.addEventListener('familyapp:household-context', queueDecorate);
  window.addEventListener('familyapp:household-identity-synced', queueDecorate);
  window.setInterval(() => { if(!runtime.repositoryPatched) patchRepository(); }, 250);
  queueDecorate();
}

window.CleaningPlanApprovalUi = {
  version: VERSION,
  start: start,
  proposeRoot: proposeRoot,
  acceptRoot: acceptRoot,
  declineRoot: declineRoot,
  reopenRoot: reopenRoot
};

start();
